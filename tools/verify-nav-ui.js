/* ===========================================================================
 * 步骤导航的真机验收（Chrome CDP，412×915）
 * 运行：node tools/verify-nav-ui.js
 *
 * 检查的是「手机上真的能点到、点得准」，不是源码里有没有这个函数。
 * =========================================================================== */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 9333;
const FILE = path.resolve(__dirname, '..', 'dist', '大病历生成器.html');
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
    '--user-data-dir=' + path.join(require('node:os').tmpdir(), 'dsh-nav-' + Date.now()),
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
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description));
    return r.result.value;
  };

  const results = [];
  const check = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  —— ' + detail : ''}`);
  };

  await cdp(ws, 'Page.navigate', { url: 'file:///' + FILE.split(path.sep).join('/') });
  await sleep(1400);

  // 1. stepbar 上能看到「目录」入口
  const hasEntry = await ev(`!!document.querySelector('#btnNav') && /目录/.test(document.querySelector('#btnNav').textContent)`);
  check('顶部有「目录」入口', hasEntry);

  // 2. 点 stepbar 打开导航面板
  await ev(`document.querySelector('#stepBar').click()`);
  await sleep(200);
  const sheetOpen = await ev(`!!document.querySelector('.nav-sheet')`);
  check('点击后弹出步骤导航', sheetOpen);

  // 3. 12 行、当前步高亮
  const rowInfo = await ev(`(() => {
    const rows = Array.from(document.querySelectorAll('.nav-row'));
    const cur = document.querySelector('.nav-row.cur');
    return { n: rows.length, cur: cur ? cur.dataset.navstep : null };
  })()`);
  check('导航列出 12 步，当前步高亮', rowInfo.n === 12 && rowInfo.cur === 'basic',
    `行=${rowInfo.n} 当前=${rowInfo.cur}`);

  // 4. 每行 ≥44px 高
  const rowH = await ev(`(() => {
    const r = document.querySelector('.nav-row').getBoundingClientRect();
    return Math.round(r.height);
  })()`);
  check('每行高度 ≥44px', rowH >= 44, `${rowH}px`);

  // 5. 点「体格检查」真的跳过去，且面板关闭
  await ev(`document.querySelector('[data-navstep="pe"]').click()`);
  await sleep(300);
  const afterJump = await ev(`({
    step: APP._test.getStepKey(),
    title: document.getElementById('stepTitle').textContent,
    sheet: !!document.querySelector('.nav-sheet')
  })`);
  check('点「体格检查」跳到该步并关闭面板',
    afterJump.step === 'pe' && /体格检查/.test(afterJump.title) && !afterJump.sheet,
    `step=${afterJump.step} 标题=${afterJump.title}`);

  // 6. 再打开，能看出「既往史」排在「系统回顾」前面
  await ev(`document.querySelector('#stepBar').click()`);
  await sleep(200);
  const order = await ev(`Array.from(document.querySelectorAll('.nav-row')).map(r => r.dataset.navstep)`);
  const iRob = order.indexOf('pmh');
  const iRos = order.indexOf('ros');
  check('既往史排在系统回顾之前', iRob >= 0 && iRos === iRob + 1, `pmh=${iRob} ros=${iRos}`);

  // 7. 状态角标：空记录时都是「还没填」（自查/生成除外）
  const states = await ev(`(() => {
    const rows = Array.from(document.querySelectorAll('.nav-row'));
    return rows.map(r => ({
      key: r.dataset.navstep,
      st: (() => {
        const el = r.querySelector('.nav-state');
        if (!el) return null;
        return Array.from(el.classList).filter(c => c.startsWith('st-'))[0] || null;
      })(),
      text: (r.querySelector('.nav-state') || {}).textContent || ''
    }));
  })()`);
  const empties = states.filter(s => s.st === 'st-empty').map(s => s.key);
  const noState = states.filter(s => s.st === null).map(s => s.key);
  check('空病历里 10 个录入步骤都标「还没填」，自查/生成不带角标',
    empties.length === 10 && noState.join(',') === 'check,output',
    `还没填=${empties.join(',')} 无角标=${noState.join(',')}`);

  // 8. 填一点内容后，重启打开导航能看到「已填」
  await ev(`document.querySelector('[data-navstep="basic"]').click()`);
  await sleep(200);
  await ev(`(() => {
    const r = APP.getRecord();
    r.basic.name='张三'; r.basic.gender='男'; r.basic.age='45'; r.basic.chiefComplaint='上腹痛';
    APP._test.saveToLibrary && 0; return 1;
  })()`);
  await ev(`document.querySelector('#stepBar').click()`);
  await sleep(200);
  const basicState = await ev(`(() => {
    const r = document.querySelector('[data-navstep="basic"]');
    const cls = Array.from(r.querySelector('.nav-state').classList).filter(c => c.startsWith('st-'))[0] || '';
    return { st: cls.slice(3), text: r.querySelector('.nav-state').textContent };
  })()`);
  check('填了必填项后「基本情况」变「已填」', basicState.st === 'done', basicState.text);

  // 9. 截图留档
  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SHOT_DIR, 'nav-sheet.png'), Buffer.from(shot.data, 'base64'));

  // 10. 412px 无横向溢出
  const overflow = await ev(`(() => {
    const de = document.documentElement;
    const bad = Array.from(document.querySelectorAll('*')).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.right > 413;
    }).map(el => el.className || el.tagName);
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 5) };
  })()`);
  check('412px 下无横向溢出', overflow.scrollW <= overflow.clientW + 1,
    `scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);

  // 11. 不要把我改动之前的顺序又改回去——这条是对着用户诉求的回归锁
  const finalOrder = await ev(`APP.STEPS.map(s => s.key).join('>')`);
  check('步骤顺序是 basic>hpi>pmh>ros>personal>marriage>family>pe>aux>summary>check>output',
    finalOrder === 'basic>hpi>pmh>ros>personal>marriage>family>pe>aux>summary>check>output', finalOrder);

  ws.close();
  proc.kill();

  const pass = results.filter(r => r.ok).length;
  console.log(`\n通过 ${pass}/${results.length}`);
  fs.writeFileSync(path.join(SHOT_DIR, 'nav-report.json'),
    JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
