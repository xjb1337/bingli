/* 用 Chrome headless 打开单文件 HTML，跑一遍真实交互，输出截图和控制台错误
 * 用法：node test/browser-check.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, '..', 'dist', '大病历生成器.html');
const SHOT_DIR = path.resolve(__dirname, '..', 'dist', 'shots');
const PORT = 9223;

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function cdp(url) {
  const res = await fetch(url);
  return res.json();
}

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbl-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=430,932',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2500);

  let targets;
  for (let i = 0; i < 20; i++) {
    try {
      targets = await cdp(`http://127.0.0.1:${PORT}/json/list`);
      if (targets && targets.length) break;
    } catch (e) { /* retry */ }
    await sleep(500);
  }
  if (!targets) { console.error('无法连接 Chrome'); chrome.kill(); process.exit(1); }

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 0;
  const pending = new Map();
  const consoleLogs = [];
  const errors = [];

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise(res => ws.addEventListener('open', res));

  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push(msg.params.type + ': ' + msg.params.args.map(a => a.value || a.description || '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push((d.exception && d.exception.description) || d.text);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 412, height: 915, deviceScaleFactor: 2, mobile: true
  });

  await send('Page.navigate', { url: 'file:///' + HTML.replace(/\\/g, '/') });
  await sleep(2000);

  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: true
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result.value;
  };

  async function shot(name) {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const p = path.join(SHOT_DIR, name + '.png');
    fs.writeFileSync(p, Buffer.from(r.data, 'base64'));
    console.log('  截图：' + p);
  }

  const results = [];

  // 1. 首页渲染
  const title = await evaluate('document.getElementById("stepTitle").textContent');
  const cards = await evaluate('document.querySelectorAll(".card").length');
  results.push(['首页渲染', title === '基本情况' && cards > 0, `标题=${title} 卡片=${cards}`]);
  await shot('01-basic');

  // 2. 填基本信息
  await evaluate(`
    (() => {
    const set = (path, val) => {
      const el = document.querySelector('[data-path="'+path+'"]');
      if (!el) throw new Error('找不到字段 '+path);
      el.value = val;
      el.dispatchEvent(new Event('input', {bubbles:true}));
    };
    set('basic.name','张三');
    set('basic.age','58');
    set('basic.chiefComplaint','发热、咳嗽、咳黄痰');
    set('basic.chiefComplaintDuration','3');
    document.querySelector('[data-seg="basic.gender"][data-val="男"]').click();
    document.querySelector('[data-seg="basic.marital"][data-val="已婚"]').click();
    'ok'
    })()
  `);
  await sleep(400);
  const ccText = await evaluate('document.querySelector("#ccPreview").textContent');
  results.push(['主诉实时预览', ccText.includes('发热、咳嗽、咳黄痰3天'), ccText.trim()]);
  await shot('02-basic-filled');

  // 3. 切科室 -> 专科查体出现
  await evaluate(`
    const sel = document.querySelector('select[data-path="basic.department"]');
    sel.value = 'respiratory';
    sel.dispatchEvent(new Event('change', {bubbles:true}));
    'ok'
  `);
  await sleep(300);

  // 4. 现病史
  await evaluate('document.getElementById("btnNext").click()');
  await sleep(300);
  await evaluate(`
    (() => {
    const set = (path, val) => {
      const el = document.querySelector('[data-path="'+path+'"]');
      el.value = val; el.dispatchEvent(new Event('input', {bubbles:true}));
    };
    set('hpi.onset','3天前受凉后出现发热，体温最高39.2℃，伴畏寒');
    set('hpi.symptoms','咳嗽呈阵发性连声咳，咳黄色黏痰，量中等，不易咳出');
    set('hpi.accompanying','伴右侧胸痛，咳嗽及深呼吸时加重');
    'ok'
    })()
  `);
  await sleep(300);
  await shot('03-hpi');

  // 5. 系统回顾
  await evaluate('document.getElementById("btnNext").click()');
  await sleep(300);
  const rosChips = await evaluate('document.querySelectorAll("[data-ros]").length');
  // 三态：未问 → 阴性 → 阳性 → 未问。点一次是「阴性」，要点两次才是阳性，
  // 每次点击都会重绘按钮的 innerHTML，所以必须重新取元素，不能缓存引用。
  const clickTwice = async (sys, sym) => {
    const sel = `[data-ros="${sys}"][data-sym="${sym}"]`;
    await evaluate(`document.querySelector('${sel}').click()`);
    await sleep(120);
    await evaluate(`document.querySelector('${sel}').click()`);
    await sleep(120);
  };
  for (const sym of ['cough', 'sputum', 'fever']) await clickTwice('resp', sym);
  await sleep(400);
  const rosPos = await evaluate('document.querySelectorAll(".ros-item").length');
  const rosNeg = await evaluate('document.querySelectorAll("[data-rosneg]").length');
  results.push(['系统回顾', rosChips >= 80 && rosPos === 3 && rosNeg === 8,
    `症状项=${rosChips} 阳性详情框=${rosPos} 负性批按钮=${rosNeg}`]);
  await shot('04-ros');

  // 6. 跳到体格检查
  const gotoStep = async (n) => {
    await evaluate(`(() => {
      // 通过点击"下一步"逐屏前进
      for (let i = 0; i < ${n}; i++) document.getElementById('btnNext').click();
      return document.getElementById('stepTitle').textContent;
    })()`);
    await sleep(300);
    return evaluate('document.getElementById("stepTitle").textContent');
  };
  const peTitle = await gotoStep(4); // ros -> pmh -> personal -> marriage -> family
  results.push(['步骤跳转', peTitle === '婚姻与生育史' || peTitle === '家庭史', peTitle]);

  await evaluate('document.getElementById("btnNext").click()');
  await sleep(400);
  const peTitle2 = await evaluate('document.getElementById("stepTitle").textContent');
  const hasSpecial = await evaluate('document.querySelector(".pe-special") !== null');
  results.push(['专科查体注入', peTitle2 === '体格检查' && hasSpecial, `标题=${peTitle2} 专科查体=${hasSpecial}`]);

  // 7. 填生命体征 + 查体
  await evaluate(`
    (() => {
    const set = (path, val) => {
      const el = document.querySelector('[data-path="'+path+'"]');
      if (el) { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true})); }
    };
    set('pe.vitals.temperature','38.6');
    set('pe.vitals.pulse','102');
    set('pe.vitals.respiration','22');
    set('pe.vitals.sbp','126');
    set('pe.vitals.dbp','78');
    set('pe.vitals.height','172');
    set('pe.vitals.weight','70');
    'ok'
    })()
  `);
  await sleep(400);
  const bmi = await evaluate('document.querySelector("#bmiPreview").textContent');
  results.push(['BMI 自动计算', bmi.includes('23.7'), bmi.trim()]);
  await shot('05-pe');

  // 8. 用快捷描述改肺部听诊
  await evaluate(`
    const btn = document.querySelector('[data-pequick="chest"][data-pekey="lungAuscultation"][data-val="右下肺可闻及湿性啰音"]');
    if (!btn) throw new Error('找不到肺部听诊快捷选项');
    btn.click();
    'ok'
  `);
  await sleep(300);
  const lungVal = await evaluate('document.querySelector(\'textarea[data-path="pe.chest.lungAuscultation"]\').value');
  results.push(['查体快捷描述', lungVal === '右下肺可闻及湿性啰音', lungVal]);
  await shot('06-pe-filled');

  // 9. 跳到摘要与诊断
  await gotoStep(2);
  const sumTitle = await evaluate('document.getElementById("stepTitle").textContent');
  const hintCount = await evaluate('document.querySelectorAll(".hint-card").length');
  const hintNames = await evaluate('Array.from(document.querySelectorAll(".hint-name")).map(e=>e.textContent).join("|")');
  results.push(['诊断参考提示', sumTitle === '摘要与诊断' && hintCount > 0, `标题=${sumTitle} 提示数=${hintCount} => ${hintNames}`]);
  await shot('07-summary');

  // 10. 添加诊断
  await evaluate(`
    document.getElementById('diagNew').value = '社区获得性肺炎（右下肺）';
    document.querySelector('[data-act="addDiag"]').click();
    'ok'
  `);
  await sleep(400);
  const diagCount = await evaluate('document.querySelectorAll("[data-diag]").length');
  results.push(['添加诊断', diagCount === 1, `诊断条数=${diagCount}`]);

  // 11. 评分自查（新增的第 11 步）
  await evaluate('document.getElementById("btnNext").click()');
  await sleep(500);
  const checkTitle = await evaluate('document.getElementById("stepTitle").textContent');
  const checkStations = await evaluate('document.querySelectorAll(".check-station").length');
  const checkTop3 = await evaluate('document.querySelectorAll(".top3-item").length');
  const checkPct = await evaluate(`(() => {
    const el = document.querySelector('.check-head .pct, .check-head b');
    return el ? el.textContent.trim() : '';
  })()`);
  results.push(['评分自查页', checkTitle === '评分自查' && checkStations === 4,
    `标题=${checkTitle} 考站卡片=${checkStations} 待补=${checkTop3} 总分=${checkPct || 'n/a'}`]);
  await shot('08-check');

  // 12. 生成病历（第 12 步）
  await evaluate('document.getElementById("btnNext").click()');
  await sleep(500);
  const outTitle = await evaluate('document.getElementById("stepTitle").textContent');
  const outText = await evaluate('document.getElementById("outputText").textContent');
  const hasSections = ['一般项目', '主诉', '现病史', '系统回顾', '体格检查', '初步诊断']
    .every(s => outText.includes(s));
  const hasData = outText.includes('张三') && outText.includes('右下肺可闻及湿性啰音')
    && outText.includes('社区获得性肺炎');
  results.push(['生成病历', outTitle === '生成病历' && hasSections && hasData,
    `标题=${outTitle} 章节齐全=${hasSections} 数据注入=${hasData}`]);
  await shot('09-output');

  // 13. 三种视图切换
  const views = await evaluate(`(() => {
    const out = {};
    for (const key of ['firstCourse', 'discharge', 'record']) {
      const btn = document.querySelector('[data-view="' + key + '"]');
      if (!btn) { out[key] = -1; continue; }
      btn.click();
      const t = document.getElementById('outputText');
      out[key] = t ? t.textContent.length : -1;
    }
    return out;
  })()`);
  const viewsOk = views.record > 200 && views.firstCourse > 50 && views.discharge > 50;
  results.push(['三视图切换', viewsOk,
    `大病历=${views.record} 首次病程录=${views.firstCourse} 出院记录=${views.discharge}`]);
  await shot('10-views');

  // 12. 本地保存
  await evaluate('document.getElementById("btnSave").click()');
  await sleep(300);
  const stored = await evaluate('localStorage.getItem("dabingli.records.v1")');
  results.push(['本地保存', !!stored && stored.includes('张三'), stored ? '已写入 localStorage' : '未写入']);

  // 13. 刷新后恢复
  await send('Page.reload');
  await sleep(1800);
  // 刷新会回到上次停留的步骤（有意的行为），先跳回基本情况再读姓名
  await evaluate('APP._test.gotoStep("basic")');
  await sleep(400);
  const afterReload = await evaluate('document.querySelector(\'[data-path="basic.name"]\').value');
  results.push(['刷新恢复', afterReload === '张三', `刷新后姓名=${afterReload}`]);
  await shot('09-reload');

  // 14. 空病历不崩溃
  await evaluate('localStorage.clear()');
  await send('Page.reload');
  await sleep(1800);
  const emptyOk = await evaluate('document.querySelectorAll(".card").length > 0');
  results.push(['清空后可用', emptyOk, `卡片数=${await evaluate('document.querySelectorAll(".card").length')}`]);

  // 汇总
  console.log('\n================ 测试结果 ================');
  let pass = 0;
  for (const [name, ok, detail] of results) {
    console.log(`${ok ? '✓' : '✗'} ${name}  —— ${detail}`);
    if (ok) pass++;
  }
  console.log(`\n通过 ${pass}/${results.length}`);

  if (errors.length) {
    console.log('\n未捕获异常：');
    errors.forEach(e => console.log('  ' + e.split('\n')[0]));
  }
  if (consoleLogs.length) {
    console.log('\n控制台输出：');
    consoleLogs.slice(0, 20).forEach(l => console.log('  ' + l));
  }

  ws.close();
  chrome.kill();
  await sleep(800);
  try {
    fs.rmSync(userDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  } catch (e) { /* Chrome 可能仍占用临时目录，忽略 */ }
  process.exit(errors.length || pass < results.length ? 1 : 0);
}

main().catch(e => {
  console.error('测试失败：', e);
  process.exit(1);
});