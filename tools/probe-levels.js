/* 看「字段等级标记」与「填写情况总览」的实际渲染。
 * 用法：node tools/probe-levels.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, '..', 'dist', '大病历生成器.html');
const OUT = path.resolve(__dirname, '..', 'dist', 'probe');
const PORT = 9251;
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lvl-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=412,915', '--hide-scrollbars', 'about:blank'
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
  const shot = async n => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.data, 'base64'));
    console.log('  截图 dist/probe/' + n + '.png');
  };

  // 1) 只看基本情况的标记分布
  console.log('=== 基本情况页的等级标记 ===');
  console.log('  必填标记数:', await ev('document.querySelectorAll(".tag-req").length'));
  console.log('  建议标记数:', await ev('document.querySelectorAll(".tag-should").length'));
  console.log('  可留空标记数:', await ev('document.querySelectorAll(".tag-auto").length'));
  await shot('lv-1-basic');

  // 2) 查体页：默认 vs 已填
  await ev(`(() => {
    const title = () => (document.getElementById('stepTitle')||{}).textContent || '';
    for (let i = 0; i < 20 && title() !== '体格检查'; i++) {
      const b = document.getElementById('btnNext'); if (!b) break; b.click();
    }
  })()`);
  await sleep(600);
  console.log('');
  console.log('=== 体格检查页 ===');
  console.log('  已填(绿条):', await ev('document.querySelectorAll(".pe-item.is-filled").length'));
  console.log('  系统默认(灰条):', await ev('document.querySelectorAll(".pe-item.is-default").length'));

  // 给一个查体项填值，看是否变「已填」
  await ev(`(() => {
    const ta = document.querySelector('textarea[data-path="pe.general.face"]');
    if (ta) { ta.value = '急性病容'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
  })()`);
  await sleep(500);
  console.log('  填一项后 -> 已填:', await ev('document.querySelectorAll(".pe-item.is-filled").length'));

  // 3) 跳到生成页看总览
  await ev(`(() => {
    const title = () => (document.getElementById('stepTitle')||{}).textContent || '';
    for (let i = 0; i < 20 && title() !== '生成病历'; i++) {
      const b = document.getElementById('btnNext'); if (!b) break; b.click();
    }
  })()`);
  await sleep(800);
  console.log('');
  console.log('=== 填写情况总览 ===');
  console.log('  卡片存在:', await ev('!!document.querySelector(".fill-status")'));
  console.log('  必填缺项:', await ev(`(() => {
    const el = document.querySelectorAll('.fill-status .fs-row')[0];
    return el ? el.innerText.replace(/\\n/g,' | ').slice(0,120) : '(无)';
  })()`));
  console.log('  建议缺项:', await ev(`(() => {
    const el = document.querySelectorAll('.fill-status .fs-row')[1];
    return el ? el.innerText.replace(/\\n/g,' | ').slice(0,120) : '(无)';
  })()`));
  console.log('  可留空  :', await ev(`(() => {
    const el = document.querySelectorAll('.fill-status .fs-row')[2];
    return el ? el.innerText.replace(/\\n/g,' | ').slice(0,120) : '(无)';
  })()`));
  await shot('lv-2-fillstatus');

  ws.close(); chrome.kill(); await sleep(500);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch (e) {}
}

main().catch(e => { console.error('失败:', e.message); process.exit(1); });
