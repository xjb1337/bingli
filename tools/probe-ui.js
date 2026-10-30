/* 临时探针：直接看评分自查页与三种生成视图的真实渲染
 * 用法：node tools/probe-ui.js
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'index.html');
const SHOT = path.resolve(__dirname, '..', 'dist', 'probe');
const PORT = 9231;
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(SHOT)) fs.mkdirSync(SHOT, { recursive: true });

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=412,915', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(2500);

  let targets;
  for (let i = 0; i < 20; i++) {
    try { targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json()); if (targets?.length) break; } catch (e) {}
    await sleep(500);
  }
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const errors = [];
  const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'file:///' + HTML.replace(/\\/g, '/') });
  await sleep(2500);

  const ev = async x => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async n => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOT, n + '.png'), Buffer.from(r.data, 'base64'));
  };

  // 填一点数据，让自查有内容
  await ev(`(() => {
    const set=(p,v)=>{const el=document.querySelector('[data-path="'+p+'"]');if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('basic.name','张三'); set('basic.gender','男'); set('basic.age','58');
    set('basic.chiefComplaint','发热、咳嗽、咳黄痰3天');
    document.querySelector('[data-seg="basic.gender"][data-val="男"]')?.click();
    const s=document.querySelector('select[data-path="basic.department"]');
    if(s){s.value='respiratory';s.dispatchEvent(new Event('change',{bubbles:true}));}
  })()`);
  await sleep(500);

  // 跳到第 11 步：评分自查
  const titles = [];
  for (let i = 0; i < 10; i++) {
    await ev('document.getElementById("btnNext").click()');
    await sleep(120);
    titles.push(await ev('document.getElementById("stepTitle").textContent'));
  }
  console.log('前进步骤:', titles.join(' -> '));
  console.log('当前步骤:', await ev('document.getElementById("stepTitle").textContent'));
  const checkCards = await ev('document.querySelectorAll(".check-station").length');
  const top3 = await ev('document.querySelectorAll(".top3-item").length');
  const defNote = await ev('(() => { const t=document.body.innerText; const m=t.match(/另有 \\d+ 项[^\\n]*默认[^\\n]*/); return m?m[0]:"(无默认值提示)"; })()');
  console.log('自查站卡片数:', checkCards, '| top3 条数:', top3);
  console.log('默认值提示:', defNote);
  await shot('check-page');

  // 跳到第 12 步：生成页，切三种视图
  await ev('document.getElementById("btnNext").click()');
  await sleep(600);
  console.log('当前步骤:', await ev('document.getElementById("stepTitle").textContent'));
  const tabs = await ev('Array.from(document.querySelectorAll("[data-view]")).map(b=>b.textContent).join(" | ")');
  console.log('视图标签:', tabs);

  for (const [key, name] of [['record','view-record'],['firstCourse','view-first'],['discharge','view-discharge']]) {
    await ev(`document.querySelector('[data-view="${key}"]')?.click()`);
    await sleep(500);
    const len = await ev('(document.getElementById("outputText")||{textContent:""}).textContent.length');
    const preview = await ev('(document.getElementById("outputText")||{textContent:""}).textContent.slice(0,60)');
    console.log(`  ${key}: 长度=${len} 开头="${preview.replace(/\\n/g,' ')}"`);
    await shot(name);
  }

  console.log('\n页面异常:', errors.length ? errors.slice(0,3).join(' | ') : '无');
  ws.close(); chrome.kill(); await sleep(600);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch (e) {}
}

main().catch(e => { console.error('探针失败:', e.message); process.exit(1); });
