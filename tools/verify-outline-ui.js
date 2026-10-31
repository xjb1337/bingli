/* 手机尺寸浏览器验收：提纲触摸滚动、病种差异、只读行为及按钮配色。
 * node build.js && node tools/verify-outline-ui.js；不代表 Android 实机验收。 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'index.html');
const PORT = 19327;
const PROFILE = path.join(os.tmpdir(), 'tpl-ui-profile-' + Date.now());

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (p && fs.existsSync(p)) return p;
  throw new Error('找不到 Chrome');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(DIST)) throw new Error('先跑 node build.js');
  const chrome = spawn(findChrome(), [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=412,915',
    'file:///' + DIST.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });

  let ws, id = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((res, rej) => {
    const mid = ++id;
    const timer = setTimeout(() => { pending.delete(mid); rej(new Error('CDP timeout: ' + method)); }, 10000);
    pending.set(mid, { res: v => { clearTimeout(timer); res(v); }, rej: e => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });

  try {
    let target = null;
    for (let i = 0; i < 60 && !target; i++) {
      await sleep(250);
      try {
        const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
        target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      } catch (_) { /* 还没起来 */ }
    }
    if (!target) throw new Error('CDP 没起来');

    const WebSocket = globalThis.WebSocket;
    if (!WebSocket) throw new Error('需要 Node 22+（内置 WebSocket）');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412, height: 915, deviceScaleFactor: 2, mobile: true,
    });
    await send('Page.reload');
    await sleep(1800);

    const evaluate = async expr => {
      const r = await send('Runtime.evaluate', {
        expression: expr, returnByValue: true, awaitPromise: true,
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception));
      return r.result.value;
    };

    const results = [];
    const check = (name, ok, detail) => {
      results.push({ name, ok, detail });
      console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  —— ' + detail : ''}`);
    };

    for (const [width, height] of [[412,915],[360,640],[360,480]]) {
      await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:2,mobile:true});
      const before = await evaluate(`(() => {
        APP.getRecord().basic.department = 'digestive'; APP._test.render();
        document.getElementById('tplCard').open = true;
        window.__outlineBefore = JSON.stringify(APP.getRecord());
        const btn = document.querySelector('[data-tplmode="example"]');
        const c = getComputedStyle(btn);
        const colors = [c.backgroundColor,c.color];
        document.querySelector('[data-tplmode="patient"]').click();
        return colors;
      })()`);
      await sleep(150);
      const geometry = await evaluate(`(() => {
        const el = document.querySelector('.modal-body'); const r = el.getBoundingClientRect();
        return {x:r.x+r.width/2,y:r.y+r.height-80,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height-80).outerHTML.slice(0,160),client:el.clientHeight,scroll:el.scrollHeight,bottom:r.bottom};
      })()`);
      check('bounded scroll '+width, geometry.scroll>geometry.client && geometry.bottom<=height, JSON.stringify(geometry));
      await send('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{x:geometry.x,y:geometry.y}]});
      for (let i=1;i<=12;i++) { await send('Input.dispatchTouchEvent', {type:'touchMove',touchPoints:[{x:geometry.x,y:geometry.y-i*20}]}); await sleep(20); }
      await send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
      await sleep(300);
      const after = await evaluate(`(() => {
        const el = document.querySelector('.modal-body'); const moved = el.scrollTop;
        el.scrollTop = el.scrollHeight;
        const close = el.querySelector('[data-close]'); const r=close.getBoundingClientRect();
        const text=el.textContent; close.click();
        const same=JSON.stringify(APP.getRecord())===window.__outlineBefore;
        document.querySelectorAll('[data-tplmode="patient"]')[1].click();
        const different=document.querySelector('.modal-body').textContent!==text;
        document.querySelector('.modal [data-close]').click();
        return {moved,closeVisible:r.bottom<=innerHeight,same,different};
      })()`);
      check('touch scroll / close / unchanged / distinct '+width, after.moved>0 && after.closeVisible && after.same && after.different, JSON.stringify(after));
      check('example contrast '+width, before[0]==='rgb(23, 105, 94)' && before[1]==='rgb(255, 255, 255)', before.join(' / '));
    }

    const dialogs = await evaluate(`(() => {
      window.confirm = () => true;
      APP._test.applyTemplate('cap', 'example');
      document.querySelector('[data-act="viewTemplateFill"]').click();
      const fill = document.querySelector('.modal-body');
      const fillOK = !!fill && fill.textContent.includes('模板') && getComputedStyle(fill).gap === '12px';
      fill.querySelector('[data-close]').click();
      APP._test.applyTemplate('asthma', 'example');
      const mixed = document.querySelector('.modal');
      const mixedOK = !!mixed && mixed.textContent.includes('不能混合模板');
      mixed.querySelector('[data-close]').click();
      return {fillOK,mixedOK,closed:!document.querySelector('.modal-mask')};
    })()`);
    check('other modal content / spacing / close', dialogs.fillOK && dialogs.mixedOK && dialogs.closed, JSON.stringify(dialogs));

    const pass = results.filter(r => r.ok).length;
    console.log(`\n通过 ${pass}/${results.length}`);
    const bad = results.filter(r => !r.ok);
    if (bad.length) {
      console.log('\n未通过：');
      bad.forEach(r => console.log(`  ✗ ${r.name}  —— ${r.detail}`));
      process.exitCode = 1;
    }
  } finally {
    try { ws && ws.close(); } catch (_) { /* ignore */ }
    chrome.kill();
    await sleep(300);
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
