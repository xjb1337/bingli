/* 填好必填项后，截「填写情况」总览的图。
 * 用法：node tools/probe-status.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, '..', 'dist', '大病历生成器.html');
const OUT = path.resolve(__dirname, '..', 'dist', 'probe');
const PORT = 9253;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--disable-gpu', '--window-size=412,1500', '--hide-scrollbars', 'about:blank'
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
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const q = pending.get(m.id); pending.delete(m.id);
      m.error ? q.rej(new Error(JSON.stringify(m.error))) : q.res(m.result);
    }
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: 'file:///' + HTML.replace(/\\/g, '/') });
  await sleep(1500);

  const ev = async x => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  // 填必填项
  await ev(`(() => {
    const set = (p, v) => {
      const el = document.querySelector('[data-path="' + p + '"]');
      if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
    };
    set('basic.name', '田泓宇');
    set('basic.age', '7月');
    set('basic.chiefComplaint', '发热、咳嗽8天');
    const g = document.querySelector('[data-seg="basic.gender"][data-val="男"]');
    if (g) g.click();
    const s = document.querySelector('select[data-path="basic.department"]');
    if (s) { s.value = 'pediatrics'; s.dispatchEvent(new Event('change', { bubbles: true })); }
  })()`);
  await sleep(700);

  // 跳到生成页
  await ev(`(() => {
    const title = () => (document.getElementById('stepTitle') || {}).textContent || '';
    for (let i = 0; i < 20 && title() !== '生成病历'; i++) {
      const b = document.getElementById('btnNext'); if (!b) break; b.click();
    }
  })()`);
  await sleep(900);

  const rows = await ev(`Array.from(document.querySelectorAll('.fill-status .fs-row')).map(
    r => r.innerText.replace(/\\n/g, ' | ').slice(0, 100))`);
  rows.forEach((r, i) => console.log(`  行${i + 1}: ${r}`));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT, 'lv-3-status.png'), Buffer.from(shot.data, 'base64'));
  console.log('  截图 dist/probe/lv-3-status.png');

  ws.close(); chrome.kill(); await sleep(500);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch (e) {}
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
