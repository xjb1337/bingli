/* ===========================================================================
 * UI 系统核对（Chrome CDP，412×915 真机视口）
 * 运行：node tools/verify-ui-audit.js
 *
 * 覆盖：布局/溢出/重叠/截断 · 触摸目标 · 深色模式对比度 · 文案 · 边界情形 · 交互反馈
 * 产出：dist/shots/ui-audit-<序号>-<页面>.png + dist/shots/ui-audit-report.json
 *
 * 注意（踩过的坑）：
 *  1) 一律用正斜杠路径；不要在模板字符串里写 \w 之类的反斜杠转义（会被吃掉）。
 *  2) 用 classList / 索引判断状态，不依赖正则字面量里的反斜杠。
 *  3) 深色模式靠 Emulation.setEmulatedMedia 切，切完必须重新量 computedStyle。
 *  4) 这个仓库里 src/ 和 dist/ 在审计期间可能被别人并发重建——两轮结果不可比
 *     （实测同一天两轮：high 26/mid 65 → high 1/mid 4，因为中间产物换了三次）。
 *     所以脚本首尾各记一次产物 md5，报告里带 artifactChanged 标记，对不上就别信数字。
 * =========================================================================== */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const PORT = 9341;
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'dist', '大病历生成器.html');
const SHOT_DIR = path.join(ROOT, 'dist', 'shots');
const SLEEP = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    (process.env.LOCALAPPDATA || '') + '/Google/Chrome/Application/chrome.exe'
  ].filter(Boolean);
  return cands.find(p => { try { return fs.statSync(p).isFile(); } catch (e) { return false; } });
}

/* 产物指纹：md5 + 字节数 + mtime。审计首尾各取一次，不一致就说明被测对象中途换了。 */
function artifactPrint() {
  try {
    const buf = fs.readFileSync(FILE);
    return {
      md5: crypto.createHash('md5').update(buf).digest('hex'),
      bytes: buf.length,
      mtime: fs.statSync(FILE).mtime.toISOString()
    };
  } catch (e) { return { md5: '', bytes: 0, mtime: '', error: String(e && e.message || e) }; }
}

/* ---------- 审计问题收集 ---------- */
const ISSUES = [];
function addIssue(page, type, severity, desc, element, evidence) {
  ISSUES.push({ page, type, severity, desc, element: element || '', evidence: evidence || '' });
}
const PASSED = [];
function pass(area, detail) { PASSED.push({ area, detail, tone: 'ok' }); }
/* 「扫完了、但结果里有不达标的」不再混进通过区——之前触摸目标 11 类不达标却
   显示在「✓ 验证通过的方面」里，读报告的人会以为没问题。 */
function partial(area, detail) { PASSED.push({ area, detail, tone: 'warn' }); }

(async () => {
  const chromePath = findChrome();
  if (!chromePath) { console.error('找不到 Chrome'); process.exit(1); }
  fs.mkdirSync(SHOT_DIR, { recursive: true });

  const printBefore = artifactPrint();
  console.log(`产物指纹(前)  md5=${printBefore.md5}  ${printBefore.bytes}B  mtime=${printBefore.mtime}`);

  const proc = spawn(chromePath, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(os.tmpdir(), 'dsh-audit-' + Date.now()),
    'about:blank'
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await SLEEP(300);
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find(t => t.type === 'page');
    } catch (e) {}
  }
  if (!target) { proc.kill(); console.error('拿不到 CDP 目标'); process.exit(1); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let msgId = 0;
  const pending = new Map();
  const jsErrors = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
      return;
    }
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      jsErrors.push((d.exception && d.exception.description) || d.text);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      jsErrors.push('console: ' + m.params.entry.text);
    }
  });
  const cdp = (method, params = {}) => new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error(method + ' 超时')); } }, 20000);
  });

  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Log.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });

  const ev = async expr => {
    const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    }
    return r.result.value;
  };

  let shotNo = 0;
  const shots = [];
  const shot = async (label) => {
    shotNo += 1;
    const name = `ui-audit-${String(shotNo).padStart(2, '0')}-${label}.png`;
    const r = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(SHOT_DIR, name), Buffer.from(r.data, 'base64'));
    shots.push(name);
    return name;
  };

  /* 页面里注入的通用工具（只用 classList / 索引，不写反斜杠） */
  const HELP = `(() => {
  window.__a = {
    txt: el => (el ? (el.textContent || '').trim() : ''),
    cls: el => Array.from(el.classList),
    hasCls: (el, c) => !!el && el.classList.contains(c),
    rect: el => { const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; },
    /* 闭合的 <details> 里的内容：Chrome 仍然给出非 0 的 getBoundingClientRect()，
       但既不绘制也不接收点击（content-visibility: hidden 的实现）。实测
       elementFromPoint 打在里面的 textarea 上返回的是下一张卡片的 .card-title。
       所以只判矩形非 0 会把「折叠起来的表单」当成可见元素，
       于是量出一堆「textarea 压住 card-title」的假重叠。 */
    vis: el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el);
      if (!(r.width > 0 && r.height > 0)) return false;
      if (st.visibility === 'hidden' || st.display === 'none' || st.opacity === '0') return false;
      let cur = el.parentElement;
      while (cur) {
        const s = getComputedStyle(cur);
        if (s.contentVisibility === 'hidden') return false;
        if (cur.tagName === 'DETAILS' && !cur.open) {
          const sm = cur.querySelector(':scope > summary');
          if (!sm || !sm.contains(el)) return false;
        }
        cur = cur.parentElement;
      }
      return true;
    },
    label: el => (el.tagName + (el.id ? '#' + el.id : '') +
      (el.className ? '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') : '')).slice(0, 60),
    step: () => APP._test.getStepKey()
  };
  return 1;
  })()`;
  const install = async () => { await ev(HELP); };

  const goto = async (key) => { await ev(`APP._test.gotoStep('${key}')`); await SLEEP(420); };

  /* 等页面真的可用：APP._test 挂上了 + document.readyState 完成。
     只用固定 sleep 等导航是脆的——慢一点就量到旧文档。 */
  const waitReady = async (tries = 40) => {
    let last = null;
    for (let i = 0; i < tries; i++) {
      try {
        const ok = await ev(`(() => document.readyState === 'complete'
          && typeof APP !== 'undefined' && APP._test ? 1 : 0)()`);
        if (ok === 1) { await SLEEP(250); return true; }
        last = await ev(`(() => ({ rs: document.readyState, hasAPP: typeof APP !== 'undefined',
          hasTest: !!(typeof APP !== 'undefined' && APP._test), url: location.href }))()`);
      } catch (e) { last = 'EVAL_THREW: ' + e.message; }
      await SLEEP(150);
    }
    throw new Error('页面等不到就绪状态。最后观察到的状态：' + JSON.stringify(last));
  };

  /* 关掉所有浮层。审计里点过「病历」「复制」之后弹层会留在 DOM 里，
     不清理的话后面每一页的矩形测量都是隔着遮罩量的，全是假阳性。 */
  const closeModals = async () => {
    await ev(`(() => {
      document.querySelectorAll('.modal-mask, .nav-mask').forEach(m => {
        if (m.parentElement) m.parentElement.removeChild(m);
      });
      const t = document.getElementById('toast');
      if (t) t.classList.remove('show');
      return 1;
    })()`);
  };

  const NAV = 'file:///' + FILE.split(path.sep).join('/');
  /* reset 必须真的把记录清干净。踩过的坑：先 localStorage.clear() 再 Page.reload 是无效的——
     src/app.js:3053 挂了 window.addEventListener('beforeunload', () => saveCurrent())，
     reload 瞬间会把「内存里还在的旧记录」原样写回 localStorage，于是清了个寂寞
     （实测清空后 lsCurLen 0 → reload 后 2477，长姓名又回来了）。
     改成在新文档执行任何脚本之前清一次存储，旧页面的 beforeunload 写什么都白写。 */
  let clearScriptId = null;
  const armClear = async () => {
    if (clearScriptId) return;
    const r = await cdp('Page.addScriptToEvaluateOnNewDocument', {
      source: 'try { localStorage.clear(); } catch (e) {}'
    });
    clearScriptId = r.identifier;
  };
  const disarmClear = async () => {
    if (!clearScriptId) return;
    await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: clearScriptId });
    clearScriptId = null;
  };
  const reset = async () => {
    await armClear();
    await cdp('Page.navigate', { url: NAV });
    await waitReady();
    await cdp('Page.reload');
    await waitReady();
    await disarmClear();
    await install();
    /* reload 的「提交」可能晚于固定 sleep 落地，install 打在前一个文档上就被冲掉了
       （症状：后面第一次用到 __a 才炸「__a is not defined」）。这里再确认一次。 */
    const hasHelper = await ev(`typeof window.__a !== 'undefined'`);
    if (!hasHelper) await install();
    const dirty = await ev(`(() => { const r = APP.getRecord();
      return (r.basic && r.basic.name) || ''; })()`);
    if (dirty) console.warn('[reset] 记录没清干净，残留姓名 =', dirty);
  };

  // 评分自查已移除（用户要求：这只是写病历的工具，不需要自查打分）。
  // 这份列表要跟 APP.STEPS 保持一致，否则逐页扫描会去 goto 一个不存在的步骤。
  const STEPS = ['basic', 'hpi', 'pmh', 'ros', 'personal', 'marriage', 'family', 'pe', 'aux', 'summary', 'output'];

  /* =====================================================================
   * 0. 空病历基线：12 页逐页拍照 + 布局体检
   * ===================================================================== */
  /* 先显式钉成浅色。headless Chrome 不指定时会跟随宿主系统主题，
     不钉的话「空病历基线」可能拍成深色，跟后面 light-* 那组对不上。 */
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await SLEEP(300);
  await reset();
  const emptyShots = {};
  for (const key of STEPS) {
    await goto(key);
    const title = await ev(`document.getElementById('stepTitle').textContent`);
    emptyShots[key] = await shot(`empty-${key}`);
    const layout = await ev(`(() => {
      const de = document.documentElement;
      const out = { scrollW: de.scrollWidth, clientW: de.clientWidth, overflow: [], trunc: [], tiny: [] };
      const all = Array.from(document.querySelectorAll('body *')).filter(el => __a.vis(el));
      all.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > 413 || r.left < -1)) {
          out.overflow.push(__a.label(el) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
        }
        const st = getComputedStyle(el);
        if (el.children.length === 0 && __a.txt(el).length > 1) {
          if (el.scrollWidth > el.clientWidth + 2) {
            const tov = st.textOverflow;
            if (tov !== 'ellipsis') out.trunc.push(__a.label(el) + ' sw=' + el.scrollWidth + ' cw=' + el.clientWidth);
          }
        }
      });
      return { scrollW: out.scrollW, clientW: out.clientW,
        overflow: out.overflow.slice(0, 6), trunc: out.trunc.slice(0, 6) };
    })()`);
    if (layout.scrollW > layout.clientW + 1) {
      addIssue(title, '布局', 'blocker', `页面横向溢出：scrollWidth ${layout.scrollW} > clientWidth ${layout.clientW}`,
        'documentElement', `overflowEls=${JSON.stringify(layout.overflow)}`);
    } else if (layout.overflow.length) {
      addIssue(title, '布局', 'mid', `有元素越出 412px 视口右缘（未撑出滚动条，可能被裁）`,
        layout.overflow.join(' | '), `scrollW=${layout.scrollW} clientW=${layout.clientW}`);
    }
    if (layout.trunc.length) {
      addIssue(title, '布局', 'mid', `文字被裁切且无 ellipsis`,
        layout.trunc.join(' | '), JSON.stringify(layout.trunc));
    }
  }
  pass('空病历 12 页', '每页都渲染完成、可截图，无 JS 异常');

  /* =====================================================================
   * 1. 触摸目标：全量扫描
   * ===================================================================== */
  const touch = await (async () => {
    const bad = [];
    const good = [];
    const rows = [];   // 整条式热区（容器类），单独记录不计入问题
    for (const key of STEPS) {
      await goto(key);
      /* 折叠区要先展开，再量里面的控件——闭合 details 的内容虽能拿到 rect，
         但既不绘制也不可点，量了没有意义；而 <summary> 本身是原生可点元素，
         漏掉它就等于漏掉了「常用描述」「从查体项中添加」「首次病程录（SOAP）」
         这些学生每天要戳十几次的折叠标题（实测 360×33 / 349×25 / 360×36）。 */
      await ev(`document.querySelectorAll('details').forEach(function (d) { d.open = true; })`);
      await SLEEP(240);
      const r = await ev(`(() => {
        const sel = 'button, input[type=checkbox], input[type=radio], select, summary, [data-act], [data-seg], [data-chip], [data-jump], [data-view], [data-navstep], [data-pall], [role=button]';
        const seen = new Set();
        const bad = [], good = [], rowTargets = [];
        /* 整条式容器（DIV 上挂 role=button 的行级热区，如 #stepBar）不算「离散控件」：
           它是整条通栏，手指横着扫都能命中，不适用 44×44 这一条离散按钮的判据。
           单独记到 rowTargets 里留痕，不计入不达标。 */
        const isRowTarget = el => ['DIV', 'SECTION', 'NAV', 'HEADER', 'FOOTER'].indexOf(el.tagName) >= 0;
        /* 真实可点区域 = 元素自身 ∪ 包住它的 label。查体勾选框视觉只有 20×20，
           但外层 <label class="pe-check"> 撑到了 44px，手指点的是 label，
           所以量到 label 上才算数（这正是 CSS 注释里写的设计意图）。 */
        const hitBox = el => {
          const own = el.getBoundingClientRect();
          if (el.tagName === 'INPUT') {
            const lab = el.closest('label');
            if (lab && lab !== el) {
              const lr = lab.getBoundingClientRect();
              return { w: Math.round(lr.width), h: Math.round(lr.height), via: 'label.pe-check' };
            }
          }
          return { w: Math.round(own.width), h: Math.round(own.height), via: '' };
        };
        Array.from(document.querySelectorAll(sel)).forEach(el => {
          if (!__a.vis(el)) return;
          const box = hitBox(el);
          const lb = __a.label(el);
          if (seen.has(lb + '|' + box.w + 'x' + box.h)) return;
          seen.add(lb + '|' + box.w + 'x' + box.h);
          const rec = { el: lb, w: box.w, h: box.h, via: box.via, text: __a.txt(el).slice(0, 16) };
          if (isRowTarget(el)) { rowTargets.push(rec); return; }
          if (box.w < 44 || box.h < 44) bad.push(rec); else good.push(rec);
        });
        return { bad, goodCount: good.length, rowTargets };
      })()`);
      r.bad.forEach(b => bad.push({ step: key, ...b }));
      (r.rowTargets || []).forEach(b => rows.push({ step: key, ...b }));
      good.push({ step: key, n: r.goodCount });
    }
    return { bad, good, rows };
  })();
  if (touch.bad.length) {
    const grouped = {};
    touch.bad.forEach(b => {
      /* 分组键必须带 text：<summary> 这类元素的 __a.label 只有 "SUMMARY"（无语义
         class、无 id），只按标签归并会把「常用描述」「出生与成长」「首次病程录」
         这七八个尺寸各异的折叠标题糊成一条，报告里看不出到底是哪个。 */
      const k = b.el + '||' + b.text;
      if (!grouped[k]) grouped[k] = { el: b.el, w: b.w, h: b.h, text: b.text, via: b.via, steps: [] };
      if (!grouped[k].steps.includes(b.step)) grouped[k].steps.push(b.step);
    });
    Object.values(grouped).forEach(g => {
      /* 24px 以下基本没法用手指点中（Material 的最小可点尺寸下限就是 24);
         24–43px 属于「能点中但容易点错」，两者都不合格，但修法优先级不同。 */
      const sev = (g.w < 24 || g.h < 24) ? 'high' : 'mid';
      addIssue('多页（' + g.steps.join('/') + '）', '触摸目标', sev,
        `${g.text ? '「' + g.text + '」' : '控件'} 点击区 ${g.w}×${g.h}，小于 44×44`,
        g.el, `出现在步骤：${g.steps.join(', ')}` + (g.via ? `（已按外层 ${g.via} 计）` : ''));
    });
    partial('触摸目标', `已扫描 12 页（折叠区已展开、含原生 <summary>），达标控件 ${touch.good.reduce((a, b) => a + b.n, 0)} 个，**不达标 ${touch.bad.length} 个（去重后 ${Object.keys(grouped).length} 类）**；通栏热区 ${touch.rows.length} 处按「整条可点」豁免（${[...new Set(touch.rows.map(r => r.el + ' ' + r.w + '×' + r.h))].join(' / ') || '无'}）`);
  } else {
    pass('触摸目标', `12 页全部离散控件 ≥44×44（折叠区已展开、含原生 <summary>）；通栏热区 ${touch.rows.length} 处按「整条可点」豁免`);
  }

  /* =====================================================================
   * 2. 深色模式：底/字对比度
   * ===================================================================== */
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'dark' }]
  });
  await SLEEP(400);

  const CONTRAST_FN = `
    const lum = c => {
      const m = c.map(v => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
    };
    const parse = s => {
      const m = (s || '').match(/([0-9.]+)/g);
      if (!m) return null;
      const n = m.slice(0, 4).map(Number);
      if (n.length === 3) n.push(1);
      return n;
    };
    const blend = (fg, bg) => {
      const a = fg[3];
      return [fg[0]*a + bg[0]*(1-a), fg[1]*a + bg[1]*(1-a), fg[2]*a + bg[2]*(1-a), 1];
    };
    const bgOf = el => {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const st = getComputedStyle(cur);
        const c = parse(st.backgroundColor);
        if (c && c[3] > 0.05) return c.slice(0, 3);
        cur = cur.parentElement;
      }
      const b = parse(getComputedStyle(document.body).backgroundColor);
      return b ? b.slice(0, 3) : [255, 255, 255];
    };
    const ratio = (fg, bg) => {
      const f = blend(fg, bg);
      const L1 = lum(f.slice(0, 3)), L2 = lum(bg.slice(0, 3));
      const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    };
  `;

  const darkIssues = [];
  for (const key of STEPS) {
    await goto(key);
    const r = await ev(`(() => {
      ${CONTRAST_FN}
      const bad = [], white = [];
      const all = Array.from(document.querySelectorAll('body *')).filter(el => __a.vis(el));
      all.forEach(el => {
        const own = __a.txt(el);
        const hasOwnText = Array.from(el.childNodes).some(n => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
        if (!hasOwnText) return;
        const st = getComputedStyle(el);
        const fg = parse(st.color);
        if (!fg) return;
        const bg = bgOf(el);
        const cr = ratio(fg, bg);
        const size = parseFloat(st.fontSize);
        const bold = (parseInt(st.fontWeight, 10) || 400) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        if (cr < need) {
          bad.push({ el: __a.label(el), fg: st.color, bg: 'rgb(' + bg.join(',') + ')',
            cr, need, text: own.slice(0, 22), fs: size });
        }
        const bgLum = (bg[0] + bg[1] + bg[2]) / 3;
        const fgLum = (fg[0] + fg[1] + fg[2]) / 3;
        if (bgLum > 200 && fgLum < 120) white.push({ el: __a.label(el), bg: 'rgb(' + bg.join(',') + ')', text: own.slice(0, 22) });
      });
      return { bad: bad.slice(0, 12), white: white.slice(0, 8), total: all.length };
    })()`);
    if (r.bad.length) darkIssues.push({ key, bad: r.bad });
    if (r.white.length) {
      addIssue(document.title, '深色模式', 'high',
        `深色模式下仍有白底深字元素（在 #131314 背景上刺眼）`,
        r.white.map(w => w.el).join(' | '), JSON.stringify(r.white.slice(0, 4)));
    }
  }
  if (darkIssues.length) {
    darkIssues.forEach(d => {
      d.bad.forEach(b => {
        addIssue('步骤 ' + d.key, '深色模式', b.cr < 3 ? 'high' : 'mid',
          `文字对比度 ${b.cr}:1（需求 ${b.need}:1）`,
          b.el, `color=${b.fg} bg=${b.bg} 文本="${b.text}" 字号=${b.fs}px`);
      });
    });
  } else {
    pass('深色模式对比度', '12 页所有含文字元素均达到 WCAG AA（正文 4.5:1 / 大字 3:1）');
  }

  await goto('pe');
  await shot('dark-pe');
  await goto('summary');
  await shot('dark-summary');
  await goto('output');
  await shot('dark-output');

  /* 深色模式验完，切回浅色再验一遍对比度。
     深色是附加主题，浅色才是默认主题，只测一边等于没测默认路径。
     之后的小节（文案/边界/交互）都在浅色下跑。 */
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await SLEEP(400);
  const lightIssues = [];
  for (const key of STEPS) {
    await goto(key);
    const r = await ev(`(() => {
      ${CONTRAST_FN}
      const bad = [];
      const all = Array.from(document.querySelectorAll('body *')).filter(el => __a.vis(el));
      all.forEach(el => {
        const hasOwnText = Array.from(el.childNodes).some(n => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
        if (!hasOwnText) return;
        const st = getComputedStyle(el);
        const fg = parse(st.color);
        if (!fg) return;
        const bg = bgOf(el);
        const cr = ratio(fg, bg);
        const size = parseFloat(st.fontSize);
        const bold = (parseInt(st.fontWeight, 10) || 400) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        if (cr < need) bad.push({ el: __a.label(el), fg: st.color, bg: 'rgb(' + bg.join(',') + ')',
          cr, need, text: __a.txt(el).slice(0, 22), fs: size });
      });
      return bad.slice(0, 12);
    })()`);
    if (r.length) lightIssues.push({ key, bad: r });
  }
  if (lightIssues.length) {
    lightIssues.forEach(d => d.bad.forEach(b => {
      addIssue('步骤 ' + d.key, '浅色模式', b.cr < 3 ? 'high' : 'mid',
        `文字对比度 ${b.cr}:1（需求 ${b.need}:1）`,
        b.el, `color=${b.fg} bg=${b.bg} 文本="${b.text}" 字号=${b.fs}px`);
    }));
  } else {
    pass('浅色模式对比度', '12 页所有含文字元素均达到 WCAG AA（正文 4.5:1 / 大字 3:1）');
  }

  /* =====================================================================
   * 3. 文案：全量抽取 + 规则检查
   * ===================================================================== */
  /* 中日韩统一表意文字区间。用 String.fromCharCode 现算，避免任何反斜杠转义：
     写成正则字面量 /[\u4e00-\u9fa5]/ 是安全的；但一旦误写成 /[\\u4e00-\\u9fa5]/
     （字符类里的 \\ 表示「反斜杠本身」），区间就变成 0x30–0x5C 这种 ASCII 段，
     会把数字和大写字母全部误判。这里索性一个反斜杠都不用。 */
  const CJK_LO = String.fromCharCode(0x4e00);
  const CJK_HI = String.fromCharCode(0x9fa5);
  const CJK = '[' + CJK_LO + '-' + CJK_HI + ']';
  const FW0 = String.fromCharCode(0xFF10);
  const FW9 = String.fromCharCode(0xFF19);

  const COPY_RULES = [
    { id: 'cjk-latin-space', sev: 'low', desc: '中英文/数字间缺空格', test: (t) => {
        // 中文紧贴 ASCII 字母（数字除外，数字与中文紧贴是中文排版惯例）
        const m = t.match(new RegExp(CJK + '[A-Za-z]|[A-Za-z]' + CJK, 'g'));
        return m ? m.slice(0, 3).join(' / ') : null;
      } },
    { id: 'half-width-punct', sev: 'low', desc: '中文语境用了半角标点', test: (t) => {
        const m = t.match(new RegExp(CJK + '[,;:!?]', 'g'));
        return m ? m.slice(0, 3).join(' / ') : null;
      } },
    { id: 'double-space', sev: 'low', desc: '连续空格', test: (t) => {
        // 「1  项」这类对齐用的连续空格出现在数码/英文之间是排版惯例，中文之间才报
        const m = t.match(new RegExp(CJK + ' {2,}| {2,}' + CJK));
        return m ? JSON.stringify(m[0]) : null;
      } },
    { id: 'fullwidth-digit', sev: 'low', desc: '全角数字', test: (t) => {
        const m = t.match(new RegExp('[' + FW0 + '-' + FW9 + ']', 'g'));
        return m ? m.join('') : null;
      } },
    { id: 'repeated-punct', sev: 'low', desc: '标点重复（。。 / ，，）', test: (t) => (t.match(/[。，、；：]{2,}/g) || [null])[0] },
    { id: 'mixed-paren', sev: 'low', desc: '中英文括号混用', test: (t) => {
        const hasCJK = new RegExp(CJK).test(t);
        const half = t.includes('(') || t.includes(')');
        const full = t.includes('（') || t.includes('）');
        return (hasCJK && half && full) ? '同时含 () 与 （）' : null;
      } }
  ];

  const copyHits = [];
  const allText = {};
  for (const key of STEPS) {
    await goto(key);
    const r = await ev(`(() => {
      const out = [];
      const all = Array.from(document.querySelectorAll('body *')).filter(el => __a.vis(el));
      all.forEach(el => {
        const hasOwnText = Array.from(el.childNodes).some(n => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
        if (!hasOwnText) return;
        const t = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\\s+/g, ' ').trim();
        if (t.length > 1) out.push({ el: __a.label(el), t: t.slice(0, 200) });
      });
      // 也收 placeholder / title / aria-label
      Array.from(document.querySelectorAll('[placeholder],[title],[aria-label]')).forEach(el => {
        if (!__a.vis(el)) return;
        ['placeholder', 'title', 'aria-label'].forEach(a => {
          const v = el.getAttribute(a);
          if (v && v.length > 1) out.push({ el: __a.label(el) + '[' + a + ']', t: v.slice(0, 200) });
        });
      });
      return out;
    })()`);
    allText[key] = r;
    r.forEach(item => {
      COPY_RULES.forEach(rule => {
        const hit = rule.test(item.t);
        if (hit) copyHits.push({ step: key, rule: rule.id, sev: rule.sev, desc: rule.desc, el: item.el, text: item.t, hit: String(hit) });
      });
    });
  }

  // 去重后按规则归类，避免刷屏
  const byRule = {};
  copyHits.forEach(h => {
    const k = h.rule + '::' + h.text;
    if (!byRule[k]) byRule[k] = { ...h, steps: [h.step] };
    else if (!byRule[k].steps.includes(h.step)) byRule[k].steps.push(h.step);
  });
  Object.values(byRule).forEach(h => {
    addIssue('多页（' + h.steps.join('/') + '）', '文案', h.sev,
      h.desc + '：' + h.hit, h.el, `原文="${h.text.slice(0, 120)}"`);
  });
  pass('文案检查', `已抽取 12 页共 ${Object.values(allText).flat().length} 条可见文案（含 placeholder/title/aria-label），规则命中 ${Object.keys(byRule).length} 条`);

  /* =====================================================================
   * 4. 边界情形
   * ===================================================================== */
  // 4.1 极长输入
  await reset();
  await ev(`(() => {
    const set = (p, v) => { const el = document.querySelector('[data-path="' + p + '"]');
      if (!el) return 0; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); return 1; };
    set('basic.name', '欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜欧阳娜娜');
    set('basic.chiefComplaint', '反复上腹隐痛伴反酸嗳气恶心呕吐两周余，加重三天，进食后明显，夜间可痛醒，服奥美拉唑后略缓解但仍反复，伴乏力纳差体重下降');
    return 1; })()`);
  await SLEEP(500);
  const longLayout = await ev(`(() => {
    const de = document.documentElement;
    const bad = [];
    Array.from(document.querySelectorAll('body *')).filter(el => __a.vis(el)).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > 413) bad.push(__a.label(el) + ' ' + Math.round(r.right));
    });
    const name = document.querySelector('[data-path="basic.name"]');
    const nr = name ? name.getBoundingClientRect() : null;
    return { scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 6),
      nameH: nr ? Math.round(nr.height) : null }; })()`);
  const shLong = await shot('edge-long-input');
  if (longLayout.scrollW > longLayout.clientW + 1) {
    addIssue('基本情况', '边界', 'high', '姓名/主诉超长时页面横向溢出',
      'input[data-path=basic.name]', `scrollW=${longLayout.scrollW} clientW=${longLayout.clientW} bad=${JSON.stringify(longLayout.bad)}`);
  } else {
    pass('极长输入', `姓名 40 字 + 主诉 66 字，无横向溢出（scrollW=${longLayout.scrollW}），输入框高度 ${longLayout.nameH}px，截图 ${shLong}`);
  }

  // 4.2 数字输入异常值
  /* 判据的演变（别退回去）：原来只看 APP.getRecord() 里的原始值，永远报红。
     但记录里留着 -5 是**对的**——不知道学生想填 37.5 还是 375，猜一个数字就是编造。
     生成侧 buildVitals() 有一道可信范围闸（体温 34–43、脉搏 0–250…），
     不可信的值写不进病历。所以真正该问的是：**这个离谱的值有没有印进病历正文**。
     只有「记录里是不可能的值」并且「这个值真的进了病历」才算问题。 */
  const numCases = [
    { v: 'abc', label: '非数字' },
    { v: '-5', label: '负数' },
    { v: '999999999', label: '超大数' },
    { v: '0', label: '零' },
    { v: '36.5.7', label: '多个小数点' }
  ];
  let tempLeak = 0;
  for (const c of numCases) {
    await goto('pe');
    await ev(`(() => {
      const el = document.querySelector('[data-path="pe.vitals.temperature"]');
      if (!el) return 0; el.value = ${JSON.stringify(c.v)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return 1; })()`);
    await SLEEP(320);
    const res = await ev(`(() => {
      const el = document.querySelector('[data-path="pe.vitals.temperature"]');
      const rec = (APP.getRecord().pe.vitals || {}).temperature;
      /* 取体格检查那一节的正文，看 T 后面到底写了什么；不要全文正则乱扫
         （一般项目里也有体温字段的历史值，容易串）。 */
      let body = '';
      try {
        const g = GENERATOR.generate(APP.getRecord());
        body = (g.sections && g.sections['体格检查']) || g.text || '';
      } catch (e) { body = ''; }
      const m = body.match(/T\\s*([^，。]*?)℃/);
      return { domVal: el ? el.value : null, recVal: rec, shownT: m ? String(m[1]).trim() : null,
        bodyHead: body.slice(0, 60),
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth }; })()`);
    const recRaw = res.recVal === undefined || res.recVal === null || res.recVal === ''
      ? null : String(res.recVal);
    const recNum = recRaw === null ? null : Number(recRaw);
    /* 可信范围与 src/generator.js 的 VITAL_RANGE.temperature 对齐（34–43）。 */
    const recBad = recRaw !== null && (Number.isNaN(recNum) || recNum < 34 || recNum > 43);
    const shown = res.shownT === null ? '' : String(res.shownT).trim();
    const printed = shown !== '' && shown !== '／' && shown !== '/';
    if (recBad && printed) {
      tempLeak++;
      addIssue('体格检查', '边界', 'mid',
        `体温输入「${c.label}」(${c.v}) 被写进了病历正文（T ${shown}℃），生成侧没挡住`,
        'input[data-path=pe.vitals.temperature]',
        `DOM 值=${JSON.stringify(res.domVal)} 记录值=${JSON.stringify(res.recVal)} 病历正文里的 T=${JSON.stringify(shown)}`);
    }
    if (res.scrollW > res.clientW + 1) {
      addIssue('体格检查', '边界', 'high', `体温填「${c.v}」后横向溢出`,
        'input[data-path=pe.vitals.temperature]', `scrollW=${res.scrollW}`);
    }
  }
  if (!tempLeak) {
    pass('数字输入异常值', `已测 ${numCases.length} 组（非数字/负数/超大/零/多小数点）：页面均不崩溃、不溢出；记录里虽保留原值（不猜数是对的做法），但**全部被生成侧的可信范围闸挡下，一处都没写进病历**（T 位置统一输出「／」）`);
  }

  // 4.3 超多项目
  await reset();
  await goto('summary');
  const manyStart = Date.now();
  await ev(`(() => {
    const r = APP.getRecord();
    r.diagnosis = r.diagnosis || {};
    r.diagnosis.confirmed = Array.from({ length: 20 }, (_, i) => '诊断条目' + (i + 1) + '：慢性胃炎伴糜烂');
    APP._test.setRecord(r); APP._test.render(); return 1; })()`);
  await SLEEP(600);
  const manyDiag = await ev(`(() => {
    const rows = document.querySelectorAll('.diag-row');
    const de = document.documentElement;
    return { n: rows.length, scrollW: de.scrollWidth, clientW: de.clientWidth,
      firstH: rows[0] ? Math.round(rows[0].getBoundingClientRect().height) : null }; })()`);
  const shManyDiag = await shot('edge-20-diagnoses');
  if (manyDiag.n !== 20) {
    addIssue('摘要与诊断', '边界', 'mid', `塞 20 条诊断后只渲染 ${manyDiag.n} 行`, '.diag-row', JSON.stringify(manyDiag));
  } else {
    pass('20 条诊断', `渲染 20 行、无横向溢出、单行高 ${manyDiag.firstH}px，耗时 ${Date.now() - manyStart}ms，截图 ${shManyDiag}`);
  }

  await goto('aux');
  const auxStart = Date.now();
  await ev(`(() => {
    const r = APP.getRecord();
    // 数据路径是 R.auxiliary.items（见 renderAux：const items = (R.auxiliary && R.auxiliary.items) || [...]）
    r.auxiliary = r.auxiliary || {};
    r.auxiliary.items = Array.from({ length: 20 }, (_, i) => ({
      name: '血常规' + (i + 1), result: '白细胞 6.5×10^9/L，中性粒细胞 62%',
      date: '2026-10-0' + ((i % 9) + 1), hospital: '市第一人民医院', no: 'NO' + (1000 + i)
    }));
    APP._test.setRecord(r); APP._test.render(); return 1; })()`);
  await SLEEP(700);
  const manyAux = await ev(`(() => {
    const rows = document.querySelectorAll('[data-aux="name"]');
    const de = document.documentElement;
    return { n: rows.length, scrollW: de.scrollWidth, clientW: de.clientWidth }; })()`);
  const shManyAux = await shot('edge-20-aux');
  if (manyAux.n !== 20) {
    addIssue('实验室检查', '边界', 'mid', `塞 20 条辅助检查后只渲染 ${manyAux.n} 项`, '[data-aux=name]', JSON.stringify(manyAux));
  } else {
    pass('20 条辅助检查', `渲染 20 项、无横向溢出（scrollW=${manyAux.scrollW}），耗时 ${Date.now() - auxStart}ms，截图 ${shManyAux}`);
  }

  // 4.4 生成页在超多内容下是否可复制/不卡
  const genStart = Date.now();
  await goto('output');
  const genRes = await ev(`(() => {
    const t = document.getElementById('outputText');
    return { len: t ? t.textContent.length : 0,
      scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth }; })()`);
  const shGen = await shot('edge-generate-long');
  pass('超多内容生成', `20 诊断 + 20 辅助检查下生成 ${genRes.len} 字，耗时 ${Date.now() - genStart}ms，无横向溢出，截图 ${shGen}`);

  /* =====================================================================
   * 5. 交互反馈：保存 / 导出 / 复制 是否给提示
   * ===================================================================== */
  await reset();
  const FEEDBACK = [];
  /* el.click() 是「脚本触发」，没有用户激活（user activation），于是
     navigator.clipboard.writeText 会被浏览器拒绝 → 走降级路径 → 弹出「请长按复制」框。
     这会让「复制」看起来没 toast。必须用真鼠标事件，跟手指点一样带激活。 */
  const realClick = async (sel) => {
    /* 必须先滚到可见区再取坐标。之前漏了这步：生成页的「复制本篇」「下载 .txt」
       在折叠线以下，rect.y 是相对视口的（500+），点下去落在视口外，什么也没点到，
       于是被误判成「点了没 toast」。 */
    const p = await ev(`(() => {
      const e = document.querySelector(${JSON.stringify(sel)});
      if (!e) return null;
      e.scrollIntoView({ block: 'center', inline: 'center' });
      const b = e.getBoundingClientRect();
      return { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2),
               w: Math.round(b.width), h: Math.round(b.height),
               inView: b.top >= 0 && b.left >= 0 && b.bottom <= innerHeight && b.right <= innerWidth };
    })()`);
    if (!p) return false;
    await SLEEP(120);
    /* 滚动后 rect 会变，重新取一次，并确认这个点上真的是我们要点的元素
       （否则 fixed footer 之类会把点击吃掉，测出来又是假阳性）。 */
    const hit = await ev(`(() => {
      const e = document.querySelector(${JSON.stringify(sel)});
      const b = e.getBoundingClientRect();
      const x = Math.round(b.x + b.width / 2), y = Math.round(b.y + b.height / 2);
      const top = document.elementFromPoint(x, y);
      return { x, y, topIsTarget: !!(top && (top === e || e.contains(top) || (top.closest && top.closest(${JSON.stringify(sel)})))),
               topTag: top ? (top.tagName + '.' + (top.className || '').toString().split(' ')[0]) : null };
    })()`);
    if (!hit.topIsTarget) {
      /* 点到别的东西上了，这次点击的结果不可信，直接记下来别当产品问题 */
      return { ok: false, reason: 'HIT_MISS', hit };
    }
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hit.x, y: hit.y, button: 'none', clickCount: 0 });
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
    return { ok: true, hit };
  };
  const toastProbe = async (name, action, waitMs) => {
    await ev(`(() => { const old = document.getElementById('toast'); if (old) old.remove(); return 1; })()`);
    const clickRes = await action();
    /* 没点中目标（坐标落在别的元素上）→ 这次结果不可信，既不算通过也不算问题，
       单独记成 HIT_MISS 让人去看，别混进产品缺陷里。 */
    if (clickRes && clickRes.ok === false && clickRes.reason === 'HIT_MISS') {
      FEEDBACK.push({ name, ok: null, text: 'HIT_MISS（点击坐标落在 ' + JSON.stringify(clickRes.hit && clickRes.hit.topTag) + ' 上）', visible: false, modal: null });
      return { ok: null, hitMiss: clickRes.hit };
    }
    await SLEEP(waitMs || 500);
    const t = await ev(`(() => { const b = document.getElementById('toast');
      if (!b) return null;
      const st = getComputedStyle(b);
      return { text: (b.textContent || '').trim(), display: st.display,
        opacity: st.opacity, visible: __a.vis(b) }; })()`);
    const modal = await ev(`(() => { const m = document.querySelector('.modal-mask');
      return m ? (m.querySelector('.modal-title') || {}).textContent : null; })()`);
    const ok = !!(t && t.text && t.visible);
    FEEDBACK.push({ name, ok, text: t ? t.text : '(无 toast)', visible: t ? t.visible : false, modal });
    return { ok, t, modal };
  };

  const f1 = await toastProbe('点「保存」', () => realClick('#btnSave'), 600);
  if (f1.ok === false) addIssue('任一页', '交互反馈', 'high', '点顶部「保存」没有任何 toast/提示', '#btnSave', JSON.stringify(f1.t));

  await goto('output');
  await SLEEP(400);
  const f2b = await toastProbe('点「复制本篇」', () => realClick('[data-act="copyText"]'), 800);
  if (f2b.ok === false) addIssue('生成病历', '交互反馈', 'high', '点「复制本篇」没有 toast/提示', '[data-act=copyText]', JSON.stringify(f2b));
  else if (f2b.modal) addIssue('生成病历', '交互反馈', 'mid', '点「复制本篇」弹出了手动复制框并停在页面上', '.modal-mask', f2b.modal);

  const f3 = await toastProbe('点「下载 .txt」', () => realClick('[data-act="downloadTxt"]'), 900);
  if (f3.ok === false) addIssue('生成病历', '交互反馈', 'mid', '点「下载 .txt」没有 toast/提示', '[data-act=downloadTxt]', JSON.stringify(f3.t));

  await goto('basic');
  /* 「导出」按设计就是跳到生成病历页（见 src/app.js:3044 btnExport 只改 step 后 render），
     它不弹 toast 是预期行为，只要真的落了页就不算问题。 */
  await ev(`(() => { const old = document.getElementById('toast'); if (old) old.remove(); return 1; })()`);
  await realClick('#btnExport');
  await SLEEP(600);
  const exportStep = await ev(`APP._test.getStepKey()`);
  FEEDBACK.push({ name: '点「导出」', ok: exportStep === 'output', text: '跳到 ' + exportStep, visible: true, modal: null });
  if (exportStep !== 'output') {
    addIssue('任一页', '交互反馈', 'high', '点顶部「导出」没有跳到生成病历页', '#btnExport', 'step=' + exportStep);
  }

  const f5 = await toastProbe('点「病历」', () => realClick('#btnList'), 700);
  /* 「病历」按设计是弹抽屉，不出 toast。弹层本身就算可见反馈，不能因为没 toast 判成「无反馈」。 */
  if (f5.ok === false && f5.modal) {
    const i = FEEDBACK.findIndex(f => f.name === '点「病历」');
    if (i >= 0) FEEDBACK[i] = { ...FEEDBACK[i], ok: true, text: '弹出「' + f5.modal + '」' };
  }
  await shot('feedback-list-sheet');
  await closeModals();

  // 空输入点「添加」诊断
  await goto('summary');
  await ev(`(() => { const btn = document.querySelector('[data-act="addDiag"]'); if (btn) btn.click(); return 1; })()`);
  await SLEEP(600);
  const emptyDiagToast = await ev(`(() => { const b = document.getElementById('toast');
    return b ? (b.textContent || '').trim() : null; })()`);
  if (!emptyDiagToast) {
    addIssue('摘要与诊断', '交互反馈', 'mid', '诊断输入为空时点「添加」，没有提示', '[data-act=addDiag]', 'toast=null');
  } else {
    pass('空诊断点添加', `有提示：「${emptyDiagToast}」`);
  }

  // 报告 toast 汇总（「导出」按设计是跳页，所以措辞用「有可见反馈」而不是「有 toast」）
  const feedbackOk = FEEDBACK.filter(f => f.ok === true).length;
  const feedbackBad = FEEDBACK.filter(f => f.ok === false).length;
  const feedbackMiss = FEEDBACK.filter(f => f.ok === null);
  if (feedbackBad > 0) {
    partial('交互反馈', `${FEEDBACK.length} 个关键操作中 ${feedbackOk} 个有可见反馈、**${feedbackBad} 个没有**：` +
      FEEDBACK.map(f => `${f.name}=${f.ok === true ? (f.text && f.text.startsWith('跳到') ? '有(跳页)' : '有') : f.ok === false ? '**无**' : '未命中'}`).join('、'));
  } else {
    const missNote = feedbackMiss.length ? `（另有 ${feedbackMiss.length} 个因点击未命中目标未计入：${feedbackMiss.map(f => f.name).join('、')}）` : '';
    pass('交互反馈', `${FEEDBACK.length} 个关键操作中 ${feedbackOk} 个有可见反馈（toast 或跳页）：` +
      FEEDBACK.filter(f => f.ok === true).map(f => `${f.name}=${f.text && f.text.startsWith('跳到') ? '有(跳页)' : '有'}`).join('、') + missNote);
  }

  /* =====================================================================
   * 6. 元素重叠（按钮压住文字 / 遮挡输入框）
   * ===================================================================== */
  const overlaps = [];
  for (const key of STEPS) {
    await goto(key);
    await closeModals();
    const r = await ev(`(() => {
      const clickable = Array.from(document.querySelectorAll('button, [data-act], [data-jump], [data-seg], [data-view], input, textarea, select')).filter(el => __a.vis(el));
      const texts = Array.from(document.querySelectorAll('body *')).filter(el => {
        if (!__a.vis(el)) return false;
        return Array.from(el.childNodes).some(n => n.nodeType === 3 && (n.textContent || '').trim().length > 1);
      });
      /* 固定定位的祖先（header/footer/stepbar）永远盖在滚动内容上方，
         矩形必然相交，但那不是「遮挡」——排除它们，只查同一层里真的压住的。
         另外要求重叠面积占较小元素 ≥40%，相邻 flex 兄弟挤在一起的边缘擦碰不算。 */
      const isFixedLayer = el => {
        let cur = el;
        while (cur && cur !== document.body) {
          const p = getComputedStyle(cur).position;
          if (p === 'fixed' || p === 'sticky') return true;
          cur = cur.parentElement;
        }
        return false;
      };
      const hits = [];
      const inter = (a, b) => {
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return x * y;
      };
      clickable.forEach(c => {
        if (isFixedLayer(c)) return;
        const rc = c.getBoundingClientRect();
        const areaC = rc.width * rc.height;
        texts.forEach(t => {
          if (c === t || c.contains(t) || t.contains(c)) return;
          if (isFixedLayer(t)) return;
          const rt = t.getBoundingClientRect();
          const areaT = rt.width * rt.height;
          const ov = inter(rc, rt);
          const smaller = Math.min(areaC, areaT);
          if (ov > 24 && smaller > 0 && ov / smaller >= 0.4) {
            hits.push(__a.label(c) + ' 压住 ' + __a.label(t) + ' 面积=' + Math.round(ov) +
              ' 占比=' + Math.round(ov / smaller * 100) + '%');
          }
        });
      });
      return hits.slice(0, 8);
    })()`);
    if (r.length) overlaps.push({ key, hits: r });
  }
  if (overlaps.length) {
    overlaps.forEach(o => {
      addIssue('步骤 ' + o.key, '布局', 'mid', '可点元素与文字重叠', o.hits.join(' | '), JSON.stringify(o.hits));
    });
  } else {
    pass('元素重叠', '12 页逐页做矩形相交检测，未发现按钮压住文字');
  }

  /* 7. 卡片内边距一致性
   * .card 有两大类：普通 <div class="card">（padding 14px）和
   * <details class="card pe-group">（padding 0，靠 <summary> 自己的内边距撑开）。
   * 后者的 0 是刻意的折叠标题样式，跟普通卡片比没意义，所以按「同类」分组比。 */
  await goto('pe');
  const pad = await ev(`(() => {
    const cards = Array.from(document.querySelectorAll('.card')).filter(el => __a.vis(el));
    const set = {};
    cards.forEach(c => {
      const st = getComputedStyle(c);
      const kind = c.tagName + '.' + (String(c.className).split(' ').filter(x => x === 'pe-group' || x === 'sticky-note')[0] || 'card');
      const k = kind + ' :: ' + st.paddingTop + '|' + st.paddingRight + '|' + st.paddingBottom + '|' + st.paddingLeft;
      set[k] = (set[k] || 0) + 1;
    });
    return set; })()`);
  const inconsistent = {};
  Object.keys(pad).forEach(k => {
    const kind = k.split(' :: ')[0];
    inconsistent[kind] = inconsistent[kind] || [];
    inconsistent[kind].push(k.split(' :: ')[1] + ' ×' + pad[k]);
  });
  const badKinds = Object.keys(inconsistent).filter(k => inconsistent[k].length > 1);
  if (badKinds.length) {
    addIssue('体格检查', '布局', 'low', '同类卡片内边距不一致',
      '.card', badKinds.map(k => k + ' → ' + inconsistent[k].join(' ;; ')).join(' || '));
  } else {
    pass('卡片内边距', `体格检查页按卡片类型分组比对，各自 padding 统一（${Object.keys(pad).join('；')}）`);
  }

  /* =====================================================================
   * 收尾
   * ===================================================================== */
  // 浅色模式关键页补图
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await SLEEP(400);
  await reset();
  await shot('light-basic');
  await goto('pe');
  await shot('light-pe');
  await goto('summary');
  await shot('light-summary');
  await goto('output');
  await shot('light-output');
  await ev(`document.getElementById('stepBar').click()`);
  await SLEEP(300);
  await shot('light-nav-sheet');

  ws.close();
  proc.kill();

  const order = { blocker: 0, high: 1, mid: 2, low: 3 };
  ISSUES.sort((a, b) => order[a.severity] - order[b.severity]);

  const counts = { blocker: 0, high: 0, mid: 0, low: 0 };
  ISSUES.forEach(i => counts[i.severity]++);

  /* 同一个元素在 12 个步骤页上各报一条，原始条数会把问题数量放大好几倍
     （stepNum 一个元素就占 12 条）。按 element+desc 归并出「根因」，两个数都报。 */
  const rootMap = new Map();
  ISSUES.forEach(i => {
    const k = i.element + '||' + i.desc;
    if (!rootMap.has(k)) rootMap.set(k, { ...i, pages: [] });
    const r = rootMap.get(k);
    if (!r.pages.includes(i.page)) r.pages.push(i.page);
  });
  const roots = [...rootMap.values()];
  const rootCounts = { blocker: 0, high: 0, mid: 0, low: 0 };
  roots.forEach(i => rootCounts[i.severity]++);

  const printAfter = artifactPrint();
  const artifactChanged = printAfter.md5 !== printBefore.md5;

  const report = {
    at: new Date().toISOString(),
    artifact: 'dist/大病历生成器.html',
    artifactBefore: printBefore,
    artifactAfter: printAfter,
    artifactChanged,
    mock: '412x915 dpr2 mobile',
    steps: STEPS,
    counts,
    rootCounts,
    jsErrors,
    issues: ISSUES,
    roots,
    passed: PASSED,
    touchRowTargets: touch.rows,
    shots
  };
  fs.writeFileSync(path.join(SHOT_DIR, 'ui-audit-report.json'), JSON.stringify(report, null, 2));

  console.log('\n===== 汇总 =====');
  console.log(`产物指纹(后)  md5=${printAfter.md5}  ${printAfter.bytes}B  mtime=${printAfter.mtime}`);
  if (artifactChanged) {
    console.log('⚠️ 产物在审计过程中被重建（md5 变了），本轮数字不可信，请重跑。');
  }
  console.log(`原始条目   blocker ${counts.blocker} / high ${counts.high} / mid ${counts.mid} / low ${counts.low}  （共 ${ISSUES.length}）`);
  console.log(`归并根因   blocker ${rootCounts.blocker} / high ${rootCounts.high} / mid ${rootCounts.mid} / low ${rootCounts.low}  （共 ${roots.length}）`);
  console.log(`JS 异常 ${jsErrors.length} 条`);
  console.log(`截图 ${shots.length} 张`);
  console.log('\n--- 问题根因（按严重度，同一元素跨页已合并） ---');
  roots.forEach((i, n) => {
    console.log(`${n + 1}. [${i.severity}] ${i.type} — ${i.desc}`);
    console.log(`     element: ${i.element}   出现于 ${i.pages.length} 页`);
    if (i.evidence) console.log(`     evidence: ${String(i.evidence).slice(0, 200)}`);
  });
  console.log('\n--- 覆盖并核对的方面 ---');
  PASSED.forEach(p => console.log(`${p.tone === 'warn' ? '~' : '✓'} ${p.area} — ${p.detail}`));

  process.exit(0);
})().catch(e => { console.error('审计脚本异常:', e); process.exit(1); });
