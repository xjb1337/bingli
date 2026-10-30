/* ===========================================================================
 * 精神科的真机验收（Chrome CDP，412×915）
 * 运行：node tools/verify-psychiatry-ui.js
 *
 * 精神科是唯一一个「查体不是查体」的科室：它的 PE_SPECIAL 组是精神状况检查
 * （MSE），不是触诊叩诊。这个脚本要证明的是整条链路在真机上真的通了：
 *   选科室 → 专科查体卡片出现且十项齐全 → 勾一项写一项 → 套用模板 →
 *   病历正文里的「精神状况检查」段与「病前性格」两行都到位 → 提示落在抑郁发作。
 *
 * 断言全部对着 DOM 和生成结果，不看源码里有没有某个字符串。
 * =========================================================================== */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PORT = 9337;
const FILE = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'index.html');
const SHOT_DIR = path.resolve(__dirname, '..', 'dist', 'shots');

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
  ].filter(Boolean);
  return cands.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function cdp(ws, method, params = {}) {
  const id = ++cdp._id;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(method + ' 超时')), 15000);
    const on = ev => {
      const m = JSON.parse(ev.data);
      if (m.id === id) {
        clearTimeout(t); ws.removeEventListener('message', on);
        m.error ? rej(new Error(method + ' ' + JSON.stringify(m.error))) : res(m.result);
      }
    };
    ws.addEventListener('message', on);
  });
}
cdp._id = 0;

(async () => {
  const chrome = findChrome();
  if (!chrome) { console.error('找不到 Chrome'); process.exit(1); }
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const proc = spawn(chrome, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'dsh-psy-' + Date.now()),
    'about:blank'
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(300);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find(t => t.type === 'page');
    } catch (e) {}
  }
  if (!target) { proc.kill(); console.error('拿不到 CDP 目标'); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Runtime.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride',
    { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });

  const ev = async expr => {
    const r = await cdp(ws, 'Runtime.evaluate',
      { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' +
      JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description));
    return r.result.value;
  };

  const results = [];
  const check = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  —— ' + detail : ''}`);
  };

  const jsErrors = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      jsErrors.push(m.params.exceptionDetails.text);
    }
  });

  await cdp(ws, 'Page.navigate', { url: 'file:///' + FILE.split(path.sep).join('/') });
  await sleep(1400);

  // 1. 科室下拉里真的有「精神科」，且在「精神」分组下
  const deptInfo = await ev(`(() => {
    const sel = document.querySelector('[data-path="basic.department"]');
    const opt = Array.from(sel.options).find(o => o.value === 'psychiatry');
    const grp = opt && opt.parentElement ? opt.parentElement.label : null;
    return { has: !!opt, text: opt ? opt.textContent : null, group: grp };
  })()`);
  check('科室下拉里有「精神科」，归在「精神」分组',
    deptInfo.has && deptInfo.text === '精神科' && deptInfo.group === '精神',
    `文本=${deptInfo.text} 分组=${deptInfo.group}`);

  // 2. 切到精神科后，查体页出现「精神状况检查」卡片，十项齐全
  const peInfo = await ev(`(() => {
    const sel = document.querySelector('[data-path="basic.department"]');
    sel.value = 'psychiatry';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    APP._test.gotoStep('pe');
    const card = document.getElementById('pe-special_psychiatry');
    if (!card) return { card: false };
    // data-pecheck 存的是组键，项目键在 data-pekey（别搞混，2026-10 踩过一次）
    const items = Array.from(card.querySelectorAll('[data-pecheck]')).map(x => x.dataset.pekey);
    const title = card.querySelector('.card-title, summary');
    const rect = card.getBoundingClientRect();
    return {
      card: true,
      title: title ? title.textContent.replace(/\\s+/g, ' ').trim() : '',
      items,
      n: items.length,
      width: Math.round(rect.width)
    };
  })()`);
  check('切到精神科后查体页出现「精神状况检查」卡片',
    peInfo.card && /精神状况检查/.test(peInfo.title), peInfo.title);
  check('精神状况检查有且只有十项（MSE 十维度）',
    peInfo.n === 10, `${peInfo.n} 项`);
  check('十项都是默认未勾选（没查就不写进病历）',
    await ev(`(() => {
      const card = document.getElementById('pe-special_psychiatry');
      const boxes = Array.from(card.querySelectorAll('[data-pecheck]'));
      return boxes.every(b => !b.checked);
    })()`), '');

  // 3. 勾一项并填值，页面上要有反馈（角标/计数变化）
  const afterCheck = await ev(`(() => {
    const card = document.getElementById('pe-special_psychiatry');
    const box = card.querySelector('[data-pekey="psyPerception"]');
    if (!box) return { err: '找不到 psyPerception 的勾选框' };
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    const ta = card.querySelector('[data-path="pe.special_psychiatry.psyPerception"]');
    if (ta) { ta.value = '幻听'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    return {
      checked: box.checked,
      textarea: !!ta,
      count: (card.querySelector('.pe-count[data-count-for="special_psychiatry"]') || {}).textContent || '',
      tag: (card.querySelector('.tag') || {}).textContent || ''
    };
  })()`);
  check('勾选后在页面上立刻有反馈（有勾选态与计数）',
    !afterCheck.err && afterCheck.checked && /1\s*\/\s*10/.test(afterCheck.count),
    afterCheck.err || `计数=${String(afterCheck.count).trim() || '(空)'} 角标=${String(afterCheck.tag).trim() || '(空)'}`);

  // 4. 生成病历里出现「精神状况检查：幻听」，且没勾的九项一个都不出现
  const gen1 = await ev(`(() => {
    APP._test.gotoStep('output');
    const t = document.querySelector('#outputText').textContent;
    const pe = t.split('【体格检查】')[1].split('【辅助检查】')[0];
    return pe;
  })()`);
  check('未勾的九项一个字都不写进病历，只写勾了的那一项',
    /精神状况检查：幻听。/.test(gen1) &&
    !/衣着整洁|定向力完整|思维连贯|未引出妄想|情感反应协调|记忆、计算|自知力完整|意志活动正常/.test(gen1),
    gen1.trim().split('\n').filter(l => /精神状况检查/.test(l))[0] || '(无该行)');

  // 5. 套用「抑郁发作」模板，正文要有 MSE 段、病前性格、发病前应激事件
  //    套用前会弹 window.confirm（提醒模板是教学病例），headless 下必须放行，
  //    否则 Runtime.evaluate 会一直卡在对话框上直到超时。
  //    诊断参考提示在「摘要与诊断」页（.hint-card），不在生成页——这点也踩过。
  const afterTpl = await ev(`(() => {
    window.confirm = () => true;
    APP._test.applyTemplate('depression');
    APP._test.gotoStep('output');
    const t = document.querySelector('#outputText').textContent;
    const pe = t.split('【体格检查】')[1].split('【辅助检查】')[0];
    const per = t.split('【个人史】')[1].split('【婚姻史】')[0];
    APP._test.gotoStep('summary');
    const hints = Array.from(document.querySelectorAll('.hint-card .hint-name'))
      .map(x => x.textContent.replace(/\\s+/g, ' ').trim());
    return { pe, per, hints, len: t.length };
  })()`);
  check('套用抑郁模板后，精神状况检查段有实质内容（≥6 个分句）',
    afterTpl.pe.split(/[，,；;。]/).filter(s => s.trim()).length >= 6,
    `${afterTpl.pe.split(/[，,；;。]/).filter(s => s.trim()).length} 个分句`);
  check('个人史里出现「病前性格」与「发病前应激事件」两行',
    /病前性格/.test(afterTpl.per) && /发病前应激事件/.test(afterTpl.per),
    afterTpl.per.split('\n').filter(l => /病前性格|应激/.test(l)).join(' / '));
  check('「病前性格」没有重复标签（不许出现「病前性格：病前性格…」）',
    !/病前性格：\\s*病前性格/.test(afterTpl.per), '');
  check('诊断参考提示第一条是「抑郁发作」',
    afterTpl.hints.length > 0 && /抑郁发作/.test(afterTpl.hints[0]),
    afterTpl.hints.slice(0, 3).join(' | ') || '(无提示)');

  // 6. 截图留档（必须在切科室之前拍，否则拍到的是消化内科的查体页）
  await ev(`(() => {
    APP._test.gotoStep('pe');
    const card = document.getElementById('pe-special_psychiatry');
    if (card) { card.open = true; card.scrollIntoView({ block: 'center' }); }
    return true;
  })()`);
  await sleep(350);
  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOT_DIR, 'psychiatry-pe.png'), Buffer.from(shot.data, 'base64'));
  await ev(`APP._test.gotoStep('output'); window.scrollTo(0, 0);`);
  await sleep(350);
  const shot2 = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOT_DIR, 'psychiatry-output.png'), Buffer.from(shot2.data, 'base64'));

  // 7. 切回消化内科，精神科内容整段消失（切科室不许残留）
  //    科室下拉只在第一步，得先回到 basic 才能改它。
  const afterSwitch = await ev(`(() => {
    APP._test.gotoStep('basic');
    const sel = document.querySelector('[data-path="basic.department"]');
    if (!sel) return { err: '第一步找不到科室下拉' };
    sel.value = 'digestive';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    APP._test.gotoStep('output');
    const t = document.querySelector('#outputText').textContent;
    return { hasPsy: /精神状况检查/.test(t), hasPsyPerception: /幻听/.test(t) };
  })()`);
  check('切回消化内科后，精神状况检查整段不再出现',
    !afterSwitch.err && !afterSwitch.hasPsy && !afterSwitch.hasPsyPerception,
    afterSwitch.err || `含「精神状况检查」=${afterSwitch.hasPsy} 含「幻听」=${afterSwitch.hasPsyPerception}`);

  const pass = results.filter(r => r.ok).length;
  console.log(`\n通过 ${pass}/${results.length}`);
  if (jsErrors.length) console.log('JS 异常：' + jsErrors.join(' | '));
  proc.kill();
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
