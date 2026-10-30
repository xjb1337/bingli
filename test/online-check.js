/* 线上地址验收：用真实 Chrome 打开 GitHub Pages 上的页面，走一遍核心流程
 * 用法：node test/online-check.js
 * 验证的是"用户手机访问线上网址"的真实路径。
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'https://xjb1337.github.io/bingli/';
const SHOT_DIR = path.resolve(__dirname, '..', 'dist', 'shots');
const PORT = 9226;
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbl-online-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=412,915', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2500);

  let targets;
  for (let i = 0; i < 20; i++) {
    try {
      targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
      if (targets && targets.length) break;
    } catch (e) {}
    await sleep(500);
  }
  if (!targets) { console.error('无法连接 Chrome'); chrome.kill(); process.exit(1); }

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const errors = [];
  const netRequests = [];

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await new Promise(res => ws.addEventListener('open', res));
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
    if (m.method === 'Network.requestWillBeSent') {
      netRequests.push(m.params.request.url);
    }
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 412, height: 915, deviceScaleFactor: 2, mobile: true
  });
  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
  });

  await send('Page.navigate', { url: URL });
  await sleep(4000);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOT_DIR, name + '.png'), Buffer.from(r.data, 'base64'));
  };

  const results = [];
  const check = (n, ok, d) => { results.push([n, ok, d]); };

  // 1. 线上页面能打开
  const title = await ev('document.title');
  const hasApp = await ev('typeof APP === "object" && typeof APP.init === "function"');
  check('线上页面加载成功', title.includes('大病历') && hasApp, `标题=${title}`);

  // 2. 首屏渲染
  const cards = await ev('document.querySelectorAll(".card").length');
  const stepTitle = await ev('document.getElementById("stepTitle").textContent');
  const basicFields = await ev(`['basic.name','basic.age','basic.chiefComplaint','basic.department'].every(p => !!document.querySelector('[data-path="'+p+'"]'))`);
  check('首屏渲染正常', cards > 0 && basicFields && stepTitle === '基本情况', `卡片=${cards} 字段齐全=${basicFields} 步骤=${stepTitle}`);
  await shot('online-01');

  // 3. 只请求了自身资源（无第三方追踪）
  const external = netRequests.filter(u => !u.startsWith('https://xjb1337.github.io/') && !u.startsWith('data:'));
  check('无第三方网络请求', external.length === 0, external.slice(0, 3).join(', ') || '无');

  // 4. 填写并生成
  await ev(`(() => {
    const set = (p,v) => { const el=document.querySelector('[data-path="'+p+'"]'); if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));} };
    set('basic.name','线上测试');
    set('basic.age','60');
    // 时长写进主诉正文——界面上已经没有单独的「持续时间 / 单位」输入框
    set('basic.chiefComplaint','咳嗽咳痰5天');
    document.querySelector('[data-seg="basic.gender"][data-val="男"]').click();
    const s=document.querySelector('select[data-path="basic.department"]');
    s.value='respiratory'; s.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await sleep(600);

  // 5. localStorage 在 https 下可用
  const lsOk = await ev(`(() => { try { localStorage.setItem('__t','1'); const v=localStorage.getItem('__t'); localStorage.removeItem('__t'); return v==='1'; } catch(e){ return 'ERR'; } })()`);
  check('线上 localStorage 可用', lsOk === true, String(lsOk));

  // 6. 走到生成页（共 12 步：点 11 次下一步，末步才是生成）
  //    注意别写死次数：以步骤标题为准，避免以后再加步骤时又静默失败。
  const reached = await ev(`(() => {
    const title = () => (document.getElementById('stepTitle')||{}).textContent || '';
    for (let i = 0; i < 20 && title() !== '生成病历'; i++) {
      const btn = document.getElementById('btnNext');
      if (!btn) break;
      btn.click();
    }
    return title();
  })()`);
  await sleep(1200);
  const outLen = await ev(`(() => { const t=document.getElementById('outputText'); return t?t.textContent.length:0; })()`);
  check('生成病历可用', reached === '生成病历' && outLen > 300,
    `到达步骤=${reached} 输出长度=${outLen}`);
  await shot('online-02');

  // 7. 保存并刷新恢复
  await ev(`document.getElementById('btnSave').click()`);
  const saved = await ev(`(async () => {
    for (let i = 0; i < 60; i++) {
      const pointer = JSON.parse(localStorage.getItem('dabingli.current.v1') || 'null');
      const draft = pointer && JSON.parse(localStorage.getItem('dabingli.draft.v1.' + pointer.id) || 'null');
      const list = JSON.parse(localStorage.getItem('dabingli.records.v1') || '[]');
      if (draft && draft.id === pointer.id && draft.basic.name === '线上测试' &&
          list.some(item => item.id === pointer.id && item.data.basic.name === '线上测试')) return true;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  })()`);
  check('保存到浏览器存储', saved === true, String(saved));

  await send('Page.reload');
  await sleep(3500);
  // 步骤位置会持久化（settings.lastStep），刷新后停在上次的「生成病历」页，
  // 基本页的输入框根本不在 DOM 里。先跳回去再读。
  const reloadStep = await ev(`APP._test.getStepKey()`);
  await ev(`APP._test.gotoStep('basic')`);
  await sleep(400);
  const restored = await ev(`document.querySelector('[data-path="basic.name"]').value`);
  check('刷新后数据恢复', restored === '线上测试', `${restored}（刷新后停在「${reloadStep}」）`);

  console.log('\n================ 线上地址验收 ================');
  console.log(`地址：${URL}\n`);
  let pass = 0;
  results.forEach(([n, ok, d]) => { console.log(`${ok ? '✓' : '✗'} ${n}  —— ${d}`); if (ok) pass++; });
  console.log(`\n通过 ${pass}/${results.length}`);

  if (errors.length) {
    console.log('\n页面异常：');
    errors.slice(0, 5).forEach(e => console.log('  ' + e.split('\n')[0]));
  }

  ws.close(); chrome.kill(); await sleep(800);
  try { fs.rmSync(userDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) {}
  process.exit(errors.length || pass < results.length ? 1 : 0);
}

main().catch(e => { console.error('验收失败：', e); process.exit(1); });
