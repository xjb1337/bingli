/* 有数据态下的触摸目标实测
 *
 * tools/verify-ui-audit.js 跑的是空病历。空态扫不到只在有数据时才渲染的控件：
 *   重点查体标签的 ×、SOAP 行的删除、诊断/辅助检查行的删除、病历列表的删除。
 * 少了这一轮，那些控件的尺寸永远没人量，「0 处不达标」是假绿。
 * 所以这个脚本和 verify-ui-audit.js 是配套的，两个都得跑。
 *
 * 用法：node tools/verify-touch-data.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const FILE = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'index.html');
const SHOTS = path.join(__dirname, '..', 'dist', 'shots');
const PORT = 9531;
const SLEEP = ms => new Promise(r => setTimeout(r, ms));

const findChrome = () => [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });

(async () => {
  const proc = spawn(findChrome(), [
    `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--user-data-dir=' + path.join(os.tmpdir(), 'p-dt-' + Date.now()), 'about:blank',
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await SLEEP(300);
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = l.find(t => t.type === 'page');
    } catch (e) { /* 浏览器还没起来 */ }
  }
  if (!target) throw new Error('Chrome 没起来');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.javascriptDialogOpening') {
      cdp('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
      return;
    }
    if (m.id && pend.has(m.id)) {
      const p = pend.get(m.id); pend.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    }
  });
  const cdp = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id;
    pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error(method + ' timeout')); } }, 25000);
  });
  const ev = async expr => {
    const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    }
    return r.result.value;
  };
  const shot = async name => {
    const b = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, name), Buffer.from(b.data, 'base64'));
  };

  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const seed = await cdp('Page.addScriptToEvaluateOnNewDocument', {
    source: 'try{localStorage.clear();}catch(e){}',
  });
  await cdp('Page.navigate', { url: 'file:///' + FILE.split(path.sep).join('/') });
  await SLEEP(2400);
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: seed.identifier });

  /* 量真实热区。选择器覆盖到所有「有数据才出现」的控件：
     [data-focusdel] = 重点查体标签的 ×、[data-arrdel]/[data-arrstrdel] = SOAP 行删除、
     [data-del] = 病历列表删除、[data-auxdel]/[data-diagdel] = 辅助检查/诊断删除。 */
  await ev(`(function(){ window.__q = function(){
    var SEL = 'button, input[type=checkbox], input[type=radio], select, summary, a[href], textarea,'
            + ' [role=button], [data-act], [data-seg], [data-chip], [data-jump], [data-view],'
            + ' [data-navstep], [data-pall], [data-focusadd], [data-focusdel], [data-tpl], [data-del],'
            + ' [data-auxdel], [data-diagdel], [data-arrdel], [data-arrstrdel], [data-checkjump]';
    var out = [];
    document.querySelectorAll(SEL).forEach(function(el){
      var host = el;
      if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
        var lb = el.closest('label'); if (lb) host = lb;
      }
      var r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var cs = getComputedStyle(host);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      var cls = host.tagName
        + (host.id ? '#' + host.id : '')
        + (host.className && typeof host.className === 'string'
            ? '.' + host.className.trim().split(/\\s+/).join('.') : '');
      out.push({ el: cls, text: (host.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18),
                 w: Math.round(r.width), h: Math.round(r.height) });
    });
    return out;
  }; return 1; })();`);

  /* 灌一份有内容的记录：重点查体两个标签（含专科项）、SOAP 三组数组、辅助检查、诊断、出院诊断。 */
  await ev(`(function(){
    var R = SCHEMA.emptyRecord();
    R.basic = Object.assign({}, R.basic, {
      name: '欧阳娜娜', gender: '女', age: '52', department: 'digestive',
      chiefComplaint: '转移性右下腹疼痛18小时', recordNo: 'A00123',
    });
    R.pe.special_digestive = { giTenderness: '麦氏点压痛' };
    R.pe.abdomen = { abdPalpation: '右下腹压痛、反跳痛' };
    R.pe.checked = { 'special_digestive.giTenderness': true, 'abdomen.abdPalpation': true };
    R.focusPE = { keys: ['special_digestive.giTenderness', 'abdomen.abdPalpation'], note: '' };
    R.auxiliary.items = [
      { name: '血常规', result: 'WBC 12.1×10^9/L' },
      { name: '腹部CT', result: '阑尾增粗' },
    ];
    R.diagnosis.confirmed = [{ name: '急性阑尾炎' }, { name: '急性胃肠炎' }];
    R.discharge.diagnoses = [{ name: '急性阑尾炎' }];
    R.soap.a.basisDetail = [{ diagnosis: '急性阑尾炎', history: '转移性右下腹痛', pe: '麦氏点压痛', aux: 'CT' }];
    R.soap.a.diff = [{ diagnosis: '肠梗阻', why: '均有腹痛' }];
    R.soap.p.perDiagnosis = [{ diagnosis: '急性阑尾炎', exam: '血常规' }];
    APP._test.setRecord(R);
    return 1;
  })()`);

  const PAGES = ['basic', 'hpi', 'pmh', 'ros', 'personal', 'marriage', 'family', 'pe', 'aux', 'summary', 'output'];
  const bad = [];
  const rows = [];
  /* 每页顺带记一笔：这一页本该出现的「有数据才渲染」控件，到底渲染出来没有。
     光报「0 处不达标」不够——选择器漏了、数据没渲染，一样得到漂亮的 0。 */
  const witness = {};
  const WATCH = {
    pe: { '重点查体 ×': '[data-focusdel]', '专科查体勾选': '[data-pecheck]' },
    aux: { '辅助检查删除': '[data-auxdel]' },
    summary: {
      'SOAP 行删除': '.soap-row .btn-del',
      '诊断行删除': '[data-diagdel]',
      '诊断依据行删除': '[data-arrdel]',
      '字段级删除': '[data-arrstrdel]',
    },
  };
  for (const p of PAGES) {
    await ev(`APP._test.gotoStep('${p}')`);
    await SLEEP(600);
    await ev(`document.querySelectorAll('details').forEach(function(d){ d.open = true; })`);
    await SLEEP(260);
    if (WATCH[p]) {
      witness[p] = await ev(`(function(){
        var pick = ${JSON.stringify(WATCH[p])};
        var out = {};
        Object.keys(pick).forEach(function(k){
          var els = document.querySelectorAll(pick[k]);
          out[k] = { n: els.length, sizes: Array.prototype.slice.call(els, 0, 3).map(function(e){
            var r = e.getBoundingClientRect(); return Math.round(r.width) + '×' + Math.round(r.height); }) };
        });
        return out;
      })()`);
    }
    const res = await ev(`(function(){
      var all = window.__q();
      var sub = all.filter(function(b){ return b.w < 44 || b.h < 44; });
      return { total: all.length,
               ok: all.filter(function(b){ return b.w >= 44 && b.h >= 44; }).length,
               bad: sub.filter(function(b){ return !/^DIV#stepBar/.test(b.el); }),
               row: sub.filter(function(b){ return /^DIV#stepBar/.test(b.el); }).length };
    })()`);
    rows.push({ page: p, total: res.total, ok: res.ok, bad: res.bad.length, row: res.row });
    res.bad.forEach(b => bad.push(Object.assign({ page: p }, b)));
  }

  /* 病历列表弹层：这一步才渲染出 data-del 的「删除」按钮，也是「删除两字竖排」的现场。 */
  await ev(`(function(){
    APP._test.gotoStep('basic');
    var base = SCHEMA.emptyRecord();
    base.basic = Object.assign({}, base.basic, { name: '病人甲', gender: '男', age: '30', department: 'digestive' });
    APP._test.setRecord(base);
    APP._test.saveToLibrary();
    return 1;
  })()`);
  await SLEEP(400);
  await ev(`(function(){ APP._test.gotoStep('basic'); return 1; })()`);
  await SLEEP(300);
  await ev(`APP._test.openList()`);
  await SLEEP(800);

  const listInfo = await ev(`(function(){
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-del]'));
    if (!btns.length) return { count: 0 };
    return { count: btns.length, items: btns.slice(0, 3).map(function(b){
      var r = b.getBoundingClientRect();
      var rg = document.createRange(); rg.selectNodeContents(b);
      var rects = rg.getClientRects();
      return { w: Math.round(r.width), h: Math.round(r.height),
               text: (b.textContent || '').trim(),
               lineBoxes: rects.length,
               // 内容盒宽度要扣掉左右 padding 和 border，才是真正能放字的宽度
               contentW: Math.round(r.width - parseFloat(getComputedStyle(b).paddingLeft)
                                    - parseFloat(getComputedStyle(b).paddingRight)
                                    - parseFloat(getComputedStyle(b).borderLeftWidth)
                                    - parseFloat(getComputedStyle(b).borderRightWidth)) };
    }) };
  })()`);
  const listBad = await ev(`(function(){
    var all = window.__q();
    var sub = all.filter(function(b){ return b.w < 44 || b.h < 44; });
    return sub.filter(function(b){ return !/^DIV#stepBar/.test(b.el); });
  })()`);
  await shot('ui-audit-56-list-delete-btn.png');

  console.log('\n=== 有数据态：每页触摸统计 ===');
  rows.forEach(r => console.log(' ', r.page.padEnd(9), '控件', String(r.total).padStart(3),
    '| ≥44px', String(r.ok).padStart(3), '| <44px', String(r.bad).padStart(2),
    '| 通栏豁免', r.row));

  const map = new Map();
  bad.forEach(b => {
    const k = b.el + '||' + b.text;
    if (!map.has(k)) map.set(k, { el: b.el, text: b.text, w: b.w, h: b.h, pages: new Set() });
    map.get(k).pages.add(b.page);
  });

  console.log('\n=== 录入页 <44px 归并（' + map.size + ' 类，' + bad.length + ' 处）===');
  if (!map.size) console.log('  （无）');
  Array.from(map.values()).sort((a, b) => a.w * a.h - b.w * b.h).forEach(v =>
    console.log('  ', v.el, '「' + v.text + '」', v.w + '×' + v.h, '<-', Array.from(v.pages).join(',')));

  console.log('\n=== 病历列表弹层 ===');
  console.log('  删除按钮数:', listInfo.count);
  (listInfo.items || []).forEach(it =>
    console.log('   ', it.w + '×' + it.h, '内容盒 ' + it.contentW + 'px', '行框', it.lineBoxes,
      it.lineBoxes === 1 ? '✓ 单行' : '✗ 折行', '「' + it.text + '」'));
  console.log('  弹层内 <44px 控件:', listBad.length, listBad.length ? JSON.stringify(listBad) : '（无）');

  /* 反证：光报「0 处不达标」不够，得确认这些控件真的进了 DOM。
     否则选择器漏了、或者数据没渲染出来，一样会得到漂亮的 0。
     每页的 witness 已在上面逐页采过（控件随页面挂载 / 卸载，事后统一查是查不到的）。 */
  console.log('\n=== 反证：这些控件确实渲染出来了 ===');
  const notRendered = [];
  Object.keys(witness).forEach(page => {
    Object.keys(witness[page]).forEach(k => {
      const w = witness[page][k];
      if (!w.n) notRendered.push(page + '/' + k);
      console.log('  ', (page + '/' + k).padEnd(24), '个数', String(w.n).padStart(3),
        w.n ? w.sizes.join(' ') : '（未渲染）');
    });
  });
  if (notRendered.length) console.log('  ⚠ 以下控件本轮没渲染出来，结论对它们无效：', notRendered.join('、'));
  else console.log('  ✓ 动态控件全部渲染，尺寸已实测');

  console.log('\n=== 结论 ===');
  const totalBad = bad.length + listBad.length;
  console.log(totalBad === 0 ? '  ✓ 有数据态下所有离散控件 ≥44×44' : '  ✗ 仍有 ' + totalBad + ' 处不达标');

  ws.close(); proc.kill(); process.exit(totalBad === 0 ? 0 : 1);
})().catch(e => { console.error('ERR', e); process.exit(1); });
