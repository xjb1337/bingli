/* 模板病例界面的真机验收。
 *
 * 守的是这几件容易坏的事：
 *   ① 选科室前不该冒出模板（通用科没有「标准病例」这回事）
 *   ② 切到消化内科后，模板卡片要出现，且只列消化内科的 6 个病种
 *   ③ 点一个模板 → 空白项被填上、患者身份仍然是空的、科室没被改坏
 *   ④ 已经有内容时再套另一个模板 → 原有内容一个字都不能变
 *   ⑤ 412px 手机上卡片不横向溢出、点击区域 ≥44px
 *
 * 跑法：node tools/verify-templates-ui.js（先 node build.js）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist', '大病历生成器.html');
const PORT = 9317;
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

    // ---- ① 通用科：不该有模板 ----
    const atGeneral = await evaluate(`(() => {
      const card = document.getElementById('tplCard');
      return {
        hasCard: !!card,
        step: APP._test.getStepKey(),
        buttons: document.querySelectorAll('[data-tpl]').length,
        text: card ? card.textContent.replace(/\\s+/g,'') : '',
        bodyMentions: document.body.textContent.includes('用模板开始'),
      };
    })()`);
    check('通用科不列病种模板，只给一句说明',
      atGeneral.hasCard === true && atGeneral.buttons === 0 &&
      atGeneral.text.includes('通用科不提供模板'),
      `卡片=${atGeneral.hasCard} 步骤=${atGeneral.step} 按钮=${atGeneral.buttons} 正文含标题=${atGeneral.bodyMentions} 文案=${atGeneral.text.slice(0, 40)}`);

    // ---- ② 切到消化内科：出现 6 个模板，且都收在本卡片里 ----
    const atDigestive = await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'digestive';
      APP._test.render();
      const card = document.getElementById('tplCard');
      card.open = true;
      const btns = [...document.querySelectorAll('[data-tpl]')];
      return {
        count: btns.length,
        keys: btns.map(b => b.dataset.tpl),
        names: btns.map(b => b.querySelector('.tpl-name').textContent.trim()),
        countTag: (card.querySelector('.tpl-count') || {}).textContent || '',
        onlyDigestive: btns.every(b => APP._test.templatesOf('digestive').some(t => t.key === b.dataset.tpl)),
      };
    })()`);
    check('切到消化内科后列出 6 个病种模板，且都是本科室的',
      atDigestive.count === 6 && atDigestive.onlyDigestive === true,
      `${atDigestive.count} 个：${atDigestive.keys.join(', ')} ${atDigestive.countTag.trim()}`);

    // 点错科室不能串台：心内科的模板只该是自己的那几份，绝不能混进消化内科的
    const crossDept = await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'cardiology';
      APP._test.render();
      const btns = Array.from(document.querySelectorAll('[data-tpl]'));
      const keys = btns.map(b => b.dataset.tpl);
      const own = APP._test.templatesOf('cardiology').map(t => t.key);
      const digest = APP._test.templatesOf('digestive').map(t => t.key);
      const out = {
        count: btns.length,
        // 列出来的每一份都必须是心内科自己的
        allOwn: keys.every(k => own.includes(k)),
        // 一份消化内科的模板都不许出现在这里
        noCrosstalk: keys.every(k => !digest.includes(k)),
        keys: keys
      };
      r.basic.department = 'digestive';
      APP._test.render();
      return out;
    })()`);
    check('切到心内科时只列心内科自己的模板，不串消化内科的',
      crossDept.allOwn === true && crossDept.noCrosstalk === true,
      `${crossDept.count} 个：${crossDept.keys.join(', ')}`);

    // ---- ③ 套用模板：空白被填、身份仍空、科室正确 ----
    await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'digestive';
      APP._test.render();
      window.__origConfirm = window.confirm;
      window.confirm = () => true;
      return true;
    })()`);
    await sleep(200);
    const applied = await evaluate(`(() => {
      const card = document.getElementById('tplCard');
      if (card) card.open = true;
      document.querySelector('[data-tpl="obstruction"]').click();
      return true;
    })()`);
    await sleep(600);
    // 套用后要去看查体页才知道勾选框状态——留在基本页数勾选框会数到 0
    await evaluate(`(() => { APP._test.gotoStep('pe'); return true; })()`);
    await sleep(500);
    const afterApply = await evaluate(`(() => {
      const r = APP.getRecord();
      const out = document.getElementById('outputText');
      return {
        chief: r.basic.chiefComplaint,
        name: r.basic.name,
        gender: r.basic.gender,
        age: r.basic.age,
        recordNo: r.basic.recordNo,
        bedNo: r.basic.bedNo,
        dept: r.basic.department,
        vitals: JSON.stringify(r.pe.vitals || {}),
        diagCount: (r.diagnosis.confirmed || []).length,
        // pe.checked 里没有条目是正常的：模板写进去的是文字，peChecked 第 2 级
        // 「已有非空文字即视为已勾」会兜住它。所以要看界面上的勾选框。
        checkedBoxes: document.querySelectorAll('input[data-pecheck]:checked').length,
        peTexts: Object.keys(r.pe).filter(k => k !== 'vitals' && k !== 'checked')
          .reduce((n, g) => n + Object.values(r.pe[g] || {}).filter(v => String(v || '').trim()).length, 0),
        toast: (document.getElementById('toast') || {}).textContent || '',
      };
    })()`);
    check('套用「肠梗阻」模板后主诉与诊断被填上',
      String(afterApply.chief).includes('腹痛') && afterApply.diagCount === 3,
      `主诉=${afterApply.chief} 诊断=${afterApply.diagCount} 条`);
    check('套用后患者身份仍然留空（姓名/性别/年龄/住院号/床号）',
      !afterApply.name && !afterApply.gender && !afterApply.age && !afterApply.recordNo && !afterApply.bedNo,
      `name="${afterApply.name}" gender="${afterApply.gender}" age="${afterApply.age}" recordNo="${afterApply.recordNo}" bedNo="${afterApply.bedNo}"`);
    check('套用后生命体征仍然是空的（温度血压不能编）',
      afterApply.vitals === '{}', afterApply.vitals);
    check('套用后科室仍是消化内科，且查体自动视为已查',
      afterApply.dept === 'digestive' && afterApply.peTexts > 0 && afterApply.checkedBoxes > 0,
      `科室=${afterApply.dept} 写入查体=${afterApply.peTexts} 项 勾选框=${afterApply.checkedBoxes} 个`);
    check('套用后给了提示（说明填了多少项、从哪来）',
      afterApply.toast.includes('已套用'), afterApply.toast.slice(0, 60));

    // ---- ④ 已有内容再套另一个模板：原内容不许被覆盖 ----
    await evaluate(`(() => { APP._test.gotoStep('basic'); return true; })()`);
    await sleep(300);
    const overwrite = await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.name = '张三';
      r.basic.chiefComplaint = '我自己问的主诉';
      r.hpi.symptoms = '我自己写的症状';
      r.diagnosis.confirmed = ['我自己下的诊断'];
      APP._test.render();
      const card = document.getElementById('tplCard');
      if (card) card.open = true;
      document.querySelector('[data-tpl="pud"]').click();
      return true;
    })()`);
    await sleep(500);
    const afterSecond = await evaluate(`(() => {
      const r = APP.getRecord();
      return {
        name: r.basic.name,
        chief: r.basic.chiefComplaint,
        symptoms: r.hpi.symptoms,
        diag: (r.diagnosis.confirmed || []).slice(),
        toast: (document.getElementById('toast') || {}).textContent || '',
      };
    })()`);
    check('再套第二个模板时，已写的内容一个字都没被改',
      afterSecond.name === '张三' &&
      afterSecond.chief === '我自己问的主诉' &&
      afterSecond.symptoms === '我自己写的症状' &&
      afterSecond.diag.length === 1 && afterSecond.diag[0] === '我自己下的诊断',
      `姓名=${afterSecond.name} 主诉=${afterSecond.chief} 诊断=${afterSecond.diag.join('/')}`);

    // ---- ⑤ 外科肺结节院内范例：真实点击、来源说明和检查组保护 ----
    await evaluate(`(() => {
      const r = APP.getRecord();
      APP._test.setRecord(SCHEMA.emptyRecord());
      APP.getRecord().basic.department = 'surgery';
      APP._test.gotoStep('basic');
      APP._test.render();
      const card = document.getElementById('tplCard');
      if (card) card.open = true;
      return true;
    })()`);
    await sleep(400);
    const surgeryCard = await evaluate(`(() => {
      const card = document.getElementById('tplCard');
      const btns = [...document.querySelectorAll('[data-tpl]')];
      const lung = document.querySelector('[data-tpl="lungNodule"]');
      return {
        count: btns.length,
        lungName: lung && lung.querySelector('.tpl-name').textContent.trim(),
        source: lung && lung.querySelector('.tpl-source') && lung.querySelector('.tpl-source').textContent.trim(),
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        cardRight: card && Math.round(card.getBoundingClientRect().right),
      };
    })()`);
    check('外科模板列表含肺结节院内范例并显示来源/缺项说明',
      surgeryCard.count === 7 && surgeryCard.lungName === '肺结节（院内范例）' &&
      surgeryCard.source && surgeryCard.source.includes('院内范例') && surgeryCard.source.includes('未展示病史留空') &&
      surgeryCard.scrollW <= surgeryCard.clientW + 1,
      `列表=${surgeryCard.count} 名称=${surgeryCard.lungName} 来源=${surgeryCard.source || ''} 横宽=${surgeryCard.scrollW}/${surgeryCard.clientW}`);

    await evaluate(`(() => {
      window.__lungConfirm = '';
      window.confirm = msg => { window.__lungConfirm = msg; return true; };
      document.querySelector('[data-tpl="lungNodule"]').click();
      return true;
    })()`);
    await sleep(700);
    const lungApplied = await evaluate(`(() => {
      const r = APP.getRecord();
      APP._test.gotoStep('output');
      const text = document.getElementById('outputText').textContent;
      APP._test.gotoStep('basic');
      const button = document.querySelector('[data-tpl="lungNodule"]');
      return {
        dept: r.basic.department,
        identityEmpty: !r.basic.name && !r.basic.gender && !r.basic.age && !r.basic.recordNo && !r.basic.bedNo,
        vitalsEmpty: Object.keys(r.pe.vitals || {}).length === 0,
        diagnosis: (r.diagnosis.confirmed || []).slice(),
        itemCount: r.auxiliary.items.length,
        items: r.auxiliary.items.map(x => x.name),
        confirm: window.__lungConfirm,
        sourceNote: APP._test.templatesOf('surgery').find(t => t.key === 'lungNodule').source.note,
        sourceStillShown: !!(button && button.querySelector('.tpl-source')),
        sourceInBody: text.includes('院内范例') || text.includes('依据用户提供的肺结节病历截图整理'),
        hasUncertainty: text.includes('原发性肺癌可能性大') && text.includes('性质待定'),
        hasPathologyGap: text.includes('暂缺'),
        toast: (document.getElementById('toast') || {}).textContent || '',
      };
    })()`);
    check('点击肺结节范例后 confirm 告知来源 note，病历保留不确定性及病理暂缺',
      lungApplied.confirm.includes(lungApplied.sourceNote) &&
      lungApplied.hasUncertainty && lungApplied.hasPathologyGap && !lungApplied.sourceInBody,
      `诊断=${lungApplied.diagnosis.join('、')} note=${lungApplied.confirm.includes('依据用户提供的肺结节病历截图整理')} 正文来源=${lungApplied.sourceInBody}`);
    check('肺结节套用后4项辅助检查均保留，身份/生命体征仍空',
      lungApplied.dept === 'surgery' && lungApplied.identityEmpty && lungApplied.vitalsEmpty && lungApplied.itemCount === 4 &&
      lungApplied.items.join('|') === '胸部CT|腹部超声|PET/CT|病理检查' &&
      lungApplied.diagnosis[0] === '右肺上叶部分实性结节（性质待定）',
      `科室=${lungApplied.dept} 检查=${lungApplied.items.join('/')}`);

    // 已有检查中的日期/机构属于已填内容；真实点击后整组都应原样保留。
    const retained = [];
    for (const [field, value] of [['date', '2026-10-01'], ['hospital', '院内检查室']]) {
      const before = await evaluate(`(() => {
        const r = APP.getRecord();
        r.basic.chiefComplaint = '本人原有主诉';
        r.hpi.symptoms = '本人原有症状';
        r.auxiliary.items = [{ name: '', result: '', date: '', hospital: '', no: '', [${JSON.stringify(field)}]: ${JSON.stringify(value)} }];
        const original = JSON.stringify(r.auxiliary.items);
        APP._test.render();
        window.confirm = () => true;
        document.querySelector('[data-tpl="lungNodule"]').click();
        return original;
      })()`);
      await sleep(300);
      const after = await evaluate(`(() => {
        const r = APP.getRecord();
        return { items: JSON.stringify(r.auxiliary.items), chief: r.basic.chiefComplaint, symptoms: r.hpi.symptoms };
      })()`);
      retained.push({ field, ok: after.items === before && after.chief === '本人原有主诉' && after.symptoms === '本人原有症状' });
    }
    check('仅有日期/机构的既有检查整组保留，既有主诉和症状不覆盖',
      retained.every(x => x.ok), retained.map(x => `${x.field}=${x.ok}`).join(' '));

    // ---- ⑥ 412px 布局 ----
    const layout = await evaluate(`(() => {
      const card = document.getElementById('tplCard');
      if (card) card.open = true;
      const btns = [...document.querySelectorAll('.tpl-item')];
      const h = btns.map(b => Math.round(b.getBoundingClientRect().height));
      const w = btns.map(b => Math.round(b.getBoundingClientRect().width));
      return {
        count: btns.length,
        minH: Math.min.apply(null, h),
        maxW: Math.max.apply(null, w),
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      };
    })()`);
    check('模板按钮点击高度 ≥44px', layout.count > 0 && layout.minH >= 44, `按钮=${layout.count} 最小高=${layout.minH}px`);
    check('412px 视口无横向溢出', layout.scrollW <= layout.clientW + 1,
      `scrollWidth=${layout.scrollW} clientWidth=${layout.clientW}`);

    // ---- 收尾：恢复 confirm ----
    await evaluate(`(() => { if (window.__origConfirm) window.confirm = window.__origConfirm; return true; })()`);

    // ---- 截图：卡片展开的样子，供人工过一眼 ----
    const shotDir = process.env.TPL_UI_SHOT_DIR || path.join(ROOT, 'dist', 'shots');
    if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });
    await evaluate(`(() => {
      const r = APP.getRecord();
      r.basic.department = 'surgery';
      APP._test.gotoStep('basic');
      const card = document.getElementById('tplCard');
      if (card) card.open = true;
      const lung = document.querySelector('[data-tpl="lungNodule"]');
      if (lung) lung.scrollIntoView({block:'center'});
      return true;
    })()`);
    await sleep(500);
    const pic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(shotDir, 'tpl-card.png'), Buffer.from(pic.data, 'base64'));
    console.log(`\n截图：${path.join(shotDir, 'tpl-card.png')}`);

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