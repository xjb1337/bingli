/* 排查线上首页内容区空白：对比线上与本地 file:// 的渲染数据。 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9247;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function probe(url) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbg-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--disable-gpu', '--window-size=412,915', 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(2500);

  let targets;
  for (let i = 0; i < 20; i++) {
    try { targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json()); if (targets && targets.length) break; } catch (e) {}
    await sleep(500);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const send = (m, p = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  const errors = [];
  const logs = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const q = pending.get(m.id); pending.delete(m.id);
      m.error ? q.rej(new Error(JSON.stringify(m.error))) : q.res(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description
        || m.params.exceptionDetails.text || JSON.stringify(m.params.exceptionDetails));
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      logs.push(m.params.args.map(a => a.value || a.description || '').join(' '));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(5000);

  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result ? r.result.value : null;
  };

  const out = {
    url,
    cards: await ev('document.querySelectorAll(".card").length'),
    textLen: await ev('document.body.innerText.length'),
    textHead: await ev('document.body.innerText.slice(0,100)'),
    firstCardH: await ev('(() => { const c = document.querySelector(".card"); return c ? Math.round(c.getBoundingClientRect().height) : null; })()'),
    scrollH: await ev('document.documentElement.scrollHeight'),
    bodyBg: await ev('getComputedStyle(document.body).backgroundColor'),
    cardBg: await ev('(() => { const c = document.querySelector(".card"); return c ? getComputedStyle(c).backgroundColor : null; })()'),
    errors: JSON.stringify(errors.slice(0, 3)),
    consoleErrs: JSON.stringify(logs.slice(0, 3))
  };

  ws.close();
  chrome.kill();
  await sleep(500);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch (e) {}
  return out;
}

(async () => {
  const local = 'file:///' + path.resolve(__dirname, '..', 'dist', '大病历生成器.html').replace(/\\/g, '/');
  const live = 'https://xjb1337.github.io/bingli/';
  for (const u of [local, live]) {
    const r = await probe(u);
    console.log('---');
    console.log('地址:', r.url.startsWith('file') ? '本地 file://' : '线上');
    console.log('  card 数量:', r.cards);
    console.log('  正文长度:', r.textLen);
    console.log('  正文开头:', JSON.stringify(r.textHead));
    console.log('  首个 card 高度:', r.firstCardH);
    console.log('  页面高度:', r.scrollH);
    console.log('  body 背景:', r.bodyBg, '| card 背景:', r.cardBg);
  }
})().catch(e => { console.error('失败:', e.message); process.exit(1); });
