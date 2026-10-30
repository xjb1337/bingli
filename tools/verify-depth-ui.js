/* 问诊深度自查卡片的真机验收。
 *
 * 守的是这几件容易坏的事：
 *   ① 生成页里确实出现「问诊深度自查」卡片，而且评分自查卡已经不在了
 *   ② 学生写清楚了就不许报（冤枉一次就会关掉整页）
 *   ③ 「去补」按钮能跳到对应录入步骤
 *   ④ 412px 手机上不横向溢出、点击区域 ≥44px
 *
 * 跑法：node tools/verify-depth-ui.js（先 node build.js）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'index.html');
const PORT = 9319;
const PROFILE = path.join(require('os').tmpdir(), 'depth-ui-profile-' + Date.now());

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

    const results = [];
    const check = (name, ok, detail) => {
      results.push({ name, ok, detail });
      console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  —— ' + detail : ''}`);
    };

    // ---- ① 空白病历：提示存在，但不声称问诊已经完整 ----
    const blank = await evaluate(`(() => {
      APP._test.gotoStep('output');
      const card = document.querySelector('.depth-card');
      if (card && card.closest('details')) card.closest('details').open = true;
      return {
        step: APP._test.getStepKey(),
        hasCard: !!card,
        hasScoreCard: !!document.querySelector('.check-overall-card'),
        text: card ? card.textContent.replace(/\\s+/g,'') : '',
        lines: document.querySelectorAll('.depth-line').length,
      };
    })()`);
    check('生成页有问诊补充提示，且不再有评分自查卡',
      blank.step === 'output' && blank.hasCard && !blank.hasScoreCard,
      `步骤=${blank.step} 深度卡=${blank.hasCard} 评分卡=${blank.hasScoreCard}`);
    check('空白病历时深度自查不报任何问题（没写就没有可挑剔的）',
      blank.lines === 0 && blank.text.includes('仍请人工核对'),
      `条目=${blank.lines} 文案=${blank.text.slice(0, 50)}`);

    // ---- ② 笔记1 的真实病例：四件被扣分的事都要点出来 ----
    const real = await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'digestive';
      r.basic.gender = '男';
      r.basic.age = '52';
      r.basic.chiefComplaint = '解黑便';
      r.basic.chiefComplaintDuration = '3日';
      r.hpi.onset = '3天前';
      r.hpi.symptoms = '解柏油样黑便，伴呕吐';
      r.pmh.health = '一般';
      r.pmh.diseaseChecks = { 高血压: true };
      APP._test.render();
      const depthCard = document.querySelector('.depth-card');
      if (depthCard && depthCard.closest('details')) depthCard.closest('details').open = true;
      const ids = APP._test.depthOf(r).map(f => f.id);
      const lines = [...document.querySelectorAll('.depth-line')].map(el => ({
        lv: el.className.replace('depth-line ',''),
        tag: (el.querySelector('.dl-tag')||{}).textContent||'',
        msg: (el.querySelector('.dl-msg')||{}).textContent||'',
        jump: el.querySelector('.dl-jump') ? el.querySelector('.dl-jump').dataset.checkjump : '',
      }));
      return { ids, lines };
    })()`);
    const hasAll = ['sym:melena','sym:vomit','neg-symptom','chronic-meds']
      .every(x => real.ids.includes(x));
    check('笔记1 的真实病例：黑便量化/呕吐量化/阴性症状/高血压用药 四条全点出',
      hasAll, `报出 ${real.ids.length} 条：${real.ids.join(', ')}`);
    check('界面把四条渲染成了带档位标签的卡片',
      real.lines.length >= 4 && real.lines.every(l => l.tag.length > 0),
      `${real.lines.length} 条，标签：${real.lines.map(l => l.tag).join('/')}`);

    // ---- ③ 「去补」跳到对应步骤 ----
    const jumpTargets = real.lines.filter(l => l.jump).map(l => l.jump);
    check('每条都带「去补」按钮且指向真实步骤',
      real.lines.length > 0 && jumpTargets.length === real.lines.length &&
      jumpTargets.every(k => ['hpi','pmh','personal','marriage','aux'].includes(k)),
      `指向：${[...new Set(jumpTargets)].join(', ')}`);

    const jumped = await evaluate(`(() => {
      const btn = document.querySelector('.depth-line .dl-jump');
      const want = btn.dataset.checkjump;
      btn.click();
      return { want, got: APP._test.getStepKey() };
    })()`);
    check('点「去补」真的切到了那个步骤',
      jumped.got === jumped.want, `期望=${jumped.want} 实际=${jumped.got}`);

    // ---- ④ 写清楚了就不许报（冤枉一次就会关掉整页） ----
    const fixed = await evaluate(`(() => {
      const r = APP.getRecord();
      r.hpi.symptoms = '解柏油样黑便，每日2次，每次约一个鸡蛋大小，成形';
      r.hpi.negativeDiscriminating = '无呕血，无发热，无腰背放射痛，无皮肤黄染';
      r.hpi.accompanying = '伴呕吐，每日3次，为胃内容物';
      r.pmh.longTermMeds = '氨氯地平5mg每日1次，血压控制在130/80mmHg左右';
      r.pmh.allergy = '无';
      r.pmh.infection = '否认肝炎、结核等传染病史';
      APP._test.render();
      return { ids: APP._test.depthOf(r).map(f => f.id),
               lines: document.querySelectorAll('.depth-line').length };
    })()`);
    check('把该写的都写全之后，四条必补项全部消失',
      !fixed.ids.includes('sym:melena') && !fixed.ids.includes('sym:vomit') &&
      !fixed.ids.includes('neg-symptom') && !fixed.ids.includes('chronic-meds'),
      `剩余：${fixed.ids.join(', ') || '（无）'}`);

    // ---- ⑤ 412px 布局 ----
    const layout = await evaluate(`(() => {
      const r = APP.getRecord();
      r.hpi.symptoms = '解柏油样黑便，伴呕吐';
      r.hpi.negativeDiscriminating = '';
      r.pmh.longTermMeds = '';
      APP._test.render();
      APP._test.gotoStep('output');
      const depthCard = document.querySelector('.depth-card');
      if (depthCard && depthCard.closest('details')) depthCard.closest('details').open = true;
      const rows = [...document.querySelectorAll('.depth-line')];
      const jumps = [...document.querySelectorAll('.dl-jump')];
      return {
        rows: rows.length,
        minH: jumps.length ? Math.min.apply(null, jumps.map(b => Math.round(b.getBoundingClientRect().height))) : 0,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      };
    })()`);
    check('「去补」按钮点击高度 ≥44px', layout.rows > 0 && layout.minH >= 44,
      `条目=${layout.rows} 最小高=${layout.minH}px`);
    check('412px 视口无横向溢出', layout.scrollW <= layout.clientW + 1,
      `scrollWidth=${layout.scrollW} clientWidth=${layout.clientW}`);

    // ---- 截图 ----
    const shotDir = path.join(ROOT, 'dist', 'shots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
    await evaluate(`(() => {
      const card = document.querySelector('.depth-card');
      if (card) card.scrollIntoView({ block: 'start' });
      return true;
    })()`);
    await sleep(400);
    const pic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(shotDir, 'depth-card.png'), Buffer.from(pic.data, 'base64'));
    console.log(`\n截图：${path.join(shotDir, 'depth-card.png')}`);

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
