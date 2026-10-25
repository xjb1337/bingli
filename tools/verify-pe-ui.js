/* 查体勾选制的界面回归：两个曾经真实发生过的问题。
 *
 * ①「全选 / 全不选」整页跳回顶部
 *    根因是那个分支调了 render()，而 render() 末尾会 window.scrollTo({top:0})。
 *    症状：用户滚到专科卡片点「全选」，刚勾完的 11 项瞬间离开视野，
 *    体验上等于「点了没反应」。
 *
 * ②「勾了但没填」显示成绿色「已填」
 *    根因是 refreshPeBadge 读的是 textarea 的 DOM 值，而 textarea 里预填着
 *    正常描述，于是永远判成 filled；整页重绘后又变回 default，
 *    同一份数据两种显示。
 *
 * 跑法：node tools/verify-pe-ui.js
 * 依赖 Chrome 可被 launch，用 CDP 驱动 dist/大病历生成器.html。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist', '大病历生成器.html');
const PORT = 9311;
const PROFILE = path.join(require('os').tmpdir(), 'pe-ui-profile-' + Date.now());

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe',
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error('找不到 Chrome');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(DIST)) throw new Error('先跑 node build.js');
  const chrome = spawn(findChrome(), [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--window-size=412,915',
    'file:///' + DIST.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });

  let ws, id = 0;
  const pending = new Map();
  const send = (method, params) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params: params || {} }));
  });

  try {
    // 等 CDP 起来
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

    const click = async sel => evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return false;
      el.click();
      return true;
    })()`);

    const results = [];
    const check = (name, ok, detail) => {
      results.push({ name, ok, detail });
      console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  —— ' + detail : ''}`);
    };

    // ---- 进到查体页：把科室设成消化内科，然后按标题点「下一步」 ----
    // 直接改记录 + gotoStep，比点十几下按钮稳
    await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'digestive';
      r.basic.name = '测试';
      r.basic.gender = '男';
      r.basic.age = '40';
      APP._test.gotoStep('pe');
      return true;
    })()`);
    await sleep(700);

    const onPe = await evaluate(`document.body.innerHTML.includes('消化内科专科查体')`);
    check('已进入查体页并看到本科室专科卡片', onPe === true);

    // ---- ① 全选不跳顶部 ----
    const scrollTest = await evaluate(`(() => {
      const card = document.getElementById('pe-special_digestive');
      if (!card) return { err: 'no card' };
      card.open = true;
      card.scrollIntoView({ block: 'center' });
      const before = window.scrollY;
      const btn = card.querySelector('[data-pall="1"]');
      if (!btn) return { err: 'no button' };
      btn.click();
      const after = window.scrollY;
      return { before, after, delta: Math.abs(after - before) };
    })()`);
    check('点「全选」不整页跳回顶部',
      scrollTest.err === undefined && scrollTest.before > 100 && scrollTest.delta < 50,
      `scrollY ${scrollTest.before} → ${scrollTest.after}`);

    const afterAll = await evaluate(`(() => {
      const card = document.getElementById('pe-special_digestive');
      return {
        open: card.open,
        count: card.querySelector('[data-count-for="special_digestive"]').textContent.trim(),
        boxes: [...card.querySelectorAll('input[data-pecheck]')].filter(b => b.checked).length,
        states: [...card.querySelectorAll('.pe-item')].map(i => i.className.match(/is-\\w+/)[0]),
      };
    })()`);
    check('全选后卡片保持展开、勾选框全部勾上',
      afterAll.open === true && afterAll.boxes === 11 && afterAll.count === '已勾 11/11',
      `open=${afterAll.open} 勾选=${afterAll.boxes} ${afterAll.count}`);

    const allDefault = afterAll.states.every(s => s === 'is-default');
    check('全选后（一条都没填）每项都是「系统默认」而非「已填」',
      allDefault, [...new Set(afterAll.states)].join(','));

    // ---- ② 勾了没填 ≠ 已填 ----
    await click('[data-pall="0"][data-pgroup="special_digestive"]');
    await sleep(120);
    const beforeCheck = await evaluate(`(() => {
      const box = document.querySelector('.pe-item[data-pe-key="giSpleenPalp"]');
      return { cls: box.className.match(/is-\\w+/)[0], rec: (APP.getRecord().pe.special_digestive||{}).giSpleenPalp || '' };
    })()`);
    await click('input[data-pecheck="special_digestive"][data-pekey="giSpleenPalp"]');
    await sleep(150);
    const afterCheck = await evaluate(`(() => {
      const box = document.querySelector('.pe-item[data-pe-key="giSpleenPalp"]');
      const ta = box.querySelector('.pe-text');
      return {
        cls: box.className.match(/is-\\w+/)[0],
        badge: (box.querySelector('.tag-done,.tag-auto,.tag-off,.tag-req') || {}).textContent || '',
        rec: (APP.getRecord().pe.special_digestive||{}).giSpleenPalp || '',
        textareaShowsDefault: ta.value.length > 0,
      };
    })()`);
    check('勾选但没填 → 灰色「系统默认」，不是绿色「已填」',
      afterCheck.rec === '' && afterCheck.cls === 'is-default' && afterCheck.badge === '系统默认',
      `状态=${afterCheck.cls} 角标=${afterCheck.badge} 记录值="${afterCheck.rec}"`);

    // 同一份数据，重绘后必须还是 default（曾经原地 filled、重绘 default）
    await evaluate(`(() => { APP._test.render(); return true; })()`);
    await sleep(300);
    const afterRerender = await evaluate(`(() => {
      const box = document.querySelector('.pe-item[data-pe-key="giSpleenPalp"]');
      return { cls: box.className.match(/is-\\w+/)[0], rec: (APP.getRecord().pe.special_digestive||{}).giSpleenPalp || '' };
    })()`);
    check('原地刷新与整页重绘结果一致（同一份数据不许两种显示）',
      afterRerender.cls === afterCheck.cls && afterRerender.rec === afterCheck.rec,
      `原地=${afterCheck.cls} 重绘=${afterRerender.cls}`);

    // ---- ③ 点击区域 ----
    const taps = await evaluate(`(() => {
      const pick = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      };
      return {
        box: pick('.pe-check'),
        all: pick('[data-pall="1"]'),
        none: pick('[data-pall="0"]'),
        jump: pick('.jump-btn'),
        chip: pick('.chip.small'),
        // 底部「上一步/下一步」是每次录入都要点的两个按钮，
        // 之前的验收漏了它们——190x39.6 也够不着。
        prev: pick('#btnPrev'),
        next: pick('#btnNext'),
      };
    })()`);
    // 44px 是苹果/安卓触摸目标的通行下限
    const small = Object.entries(taps).filter(([, v]) => v && v.h < 44);
    check('主要点击区域高度 ≥44px', small.length === 0,
      Object.entries(taps).map(([k, v]) => `${k}=${v ? v.w + 'x' + v.h : '无'}`).join(' '));

    // ---- ④ 没有横向溢出 ----
    const overflow = await evaluate(`(() => ({
      doc: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))()`);
    check('412px 视口无横向溢出', overflow.doc <= overflow.client,
      `scrollWidth=${overflow.doc} clientWidth=${overflow.client}`);

    // ---- ⑤ 刷新后回到上次停留的步骤 ----
    // 只在真浏览器里验得了：要真的 Page.reload，让 init() 从 localStorage 重新读设置。
    await evaluate(`(() => { APP._test.gotoStep('summary'); return true; })()`);
    await sleep(300);
    await send('Page.reload');
    await sleep(1800);
    const afterReload = await evaluate(`(() => ({
      num: document.querySelector('#stepNum').textContent,
      title: document.querySelector('#stepTitle').textContent,
    }))()`);
    check('刷新后回到上次停留的步骤',
      afterReload.num === '10/12' && /摘要与诊断/.test(afterReload.title),
      `${afterReload.num} ${afterReload.title}`);

    // 生成页不记：在输出页刷新，应该回到上一个编辑步骤而不是停在只读的生成页
    await evaluate(`(() => { APP._test.gotoStep('output'); return true; })()`);
    await sleep(300);
    await send('Page.reload');
    await sleep(1800);
    const afterOutputReload = await evaluate(`(() => ({
      num: document.querySelector('#stepNum').textContent,
      title: document.querySelector('#stepTitle').textContent,
    }))()`);
    check('停在生成页时刷新，回到上一个编辑步骤',
      afterOutputReload.num === '10/12',
      `${afterOutputReload.num} ${afterOutputReload.title}`);

    const failed = results.filter(r => !r.ok);
    console.log(`\n通过 ${results.length - failed.length}/${results.length}`);
    if (failed.length) process.exitCode = 1;  } finally {
    try { ws && ws.close(); } catch (_) { /* ignore */ }
    chrome.kill();
    await sleep(300);
    try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  }
}

main().catch(e => { console.error(e); process.exitCode = 1; });
