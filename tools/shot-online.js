/* 对线上地址截图，确认部署后的真实界面。
 * 用法：node tools/shot-online.js [url]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const URL_ = process.argv[2] || 'https://xjb1337.github.io/bingli/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.resolve(__dirname, '..', 'dist', 'probe');
const PORT = 9233;
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
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
  let id = 0; const pending = new Map();
  const send = (m, p = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    }
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL_ });

  // 先按默认视口把页面加载完，再切到手机尺寸截图。
  // 一开始就设移动模拟时，线上首包较慢，冷启动容易取不到已渲染的内容。
  const waitCards = async (n, ms) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const c = await send('Runtime.evaluate', {
        expression: 'document.querySelectorAll(".card").length', returnByValue: true
      });
      if ((c.result?.value || 0) >= n) return true;
      await sleep(300);
    }
    return false;
  };
  if (!await waitCards(1, 30000)) {
    const txt = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.slice(0,200)', returnByValue: true
    });
    throw new Error('页面 30 秒内没有渲染出卡片；当前正文：' + (txt.result?.value || ''));
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
  await sleep(800);

  const ev = async x => {
    const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async n => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, n + '.png'), Buffer.from(r.data, 'base64'));
    console.log('  截图：dist/probe/' + n + '.png');
  };

  console.log('页面标题:', await ev('document.title'));
  await shot('live-1-home');

  // 填一点数据后走到评分自查页
  await ev(`(() => {
    const set=(p,v)=>{const el=document.querySelector('[data-path="'+p+'"]');if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}};
    set('basic.name','李四'); set('basic.age','58'); set('basic.chiefComplaint','发热、咳嗽、咳黄痰');
    set('basic.chiefComplaintDuration','3');
    document.querySelector('[data-seg="basic.gender"][data-val="男"]')?.click();
    const s=document.querySelector('select[data-path="basic.department"]');
    if(s){s.value='respiratory';s.dispatchEvent(new Event('change',{bubbles:true}));}
  })()`);
  await sleep(600);

  const reached = await ev(`(() => {
    const title = () => (document.getElementById('stepTitle')||{}).textContent || '';
    for (let i = 0; i < 20 && title() !== '评分自查'; i++) {
      const b = document.getElementById('btnNext'); if (!b) break; b.click();
    }
    return title();
  })()`);
  await sleep(900);
  console.log('到达步骤:', reached);
  console.log('考站卡片数:', await ev('document.querySelectorAll(".check-station").length'));
  await shot('live-2-check');

  await ev(`(() => { const b=document.querySelector('[data-view="firstCourse"]'); if(b) b.click(); })()`);
  await sleep(500);
  await shot('live-3-views');

  ws.close(); chrome.kill(); await sleep(600);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch (e) {}
}

main().catch(e => { console.error('截图失败:', e.message); process.exit(1); });
