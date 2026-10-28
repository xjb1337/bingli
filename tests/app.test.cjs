/* ===========================================================================
 * UI 层测试（node:test + vm 沙箱 + 模拟 DOM）
 * 运行：node --test tests/
 *
 * 目的：不启动浏览器，也能验证界面层的关键行为——
 *   · 存储写入失败时不能宣称"已保存"
 *   · 损坏存档不被覆盖
 *   · 导入/导出的用户流程
 * 做法：把 dist/ 下单文件 HTML 里的脚本抽出来，在 vm 里跑，
 *       用最小 DOM 桩替换真实 DOM。这样测的就是真正发布的那份代码。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DIST = path.join(__dirname, '..', 'dist', '大病历生成器.html');

/* ---------------------- 最小 DOM 桩 ---------------------- */

/**
 * 造一个够用的 DOM：元素按 id/selector 惰性创建，
 * querySelector 只支持本应用用到的简单形式。
 */
function makeFakeDocument() {
  const nodes = new Map();
  const listeners = new Map();
  // 记录 :root 上设置的 CSS 变量，用于验证字号缩放
  const fontScale = { value: undefined };

  function makeEl(sel) {
    const el = {
      _sel: sel,
      innerHTML: '',
      textContent: '',
      value: '',
      hidden: true,
      checked: false,
      files: [],
      style: {
        setProperty(name, v) { if (name === '--fs-scale') fontScale.value = v; },
        width: ''
      },
      dataset: {},
      children: [],
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            this._set.has(c) ? this._set.delete(c) : this._set.add(c);
          } else if (force) this._set.add(c);
          else this._set.delete(c);
        },
        contains(c) { return this._set.has(c); }
      },
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
      remove() {},
      setAttribute() {},
      hasAttribute() { return false; },
      addEventListener(type, fn) {
        const key = sel + '::' + type;
        if (!listeners.has(key)) listeners.set(key, []);
        listeners.get(key).push(fn);
      },
      querySelector() { return makeEl(sel + ' >q'); },
      querySelectorAll() { return []; },
      closest() { return null; },
      scrollIntoView() {},
      focus() {},
      select() {},
      setSelectionRange() {},
      click() {}
    };
    return el;
  }

  function getNode(sel) {
    if (!nodes.has(sel)) nodes.set(sel, makeEl(sel));
    return nodes.get(sel);
  }

  const document = {
    documentElement: getNode(':root'),
    body: getNode('body'),
    visibilityState: 'visible',
    createElement: tag => makeEl('<created:' + tag + '>'),
    getElementById: id => getNode('#' + id),
    querySelector: sel => getNode(sel),
    querySelectorAll: () => [],
    addEventListener(type, fn) {
      if (!listeners.has('doc::' + type)) listeners.set('doc::' + type, []);
      listeners.get('doc::' + type).push(fn);
    },
    _nodes: nodes,
    _listeners: listeners,
    _fontScale: fontScale
  };
  return document;
}

/* ---------------------- 从产物中抽出脚本 ---------------------- */

function extractScripts(html) {
  const blocks = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  return blocks.filter(b => b.trim().length > 0).join('\n');
}

/* ---------------------- 启动沙箱 ---------------------- */

/**
 * @param {object} opts
 *  initial:  初始 localStorage 内容（Map 或对象）
 *  failWrite: 写入时抛错，模拟存储空间满
 */
function boot(opts = {}) {
  const memory = new Map(Object.entries(opts.initial || {}));
  const document = makeFakeDocument();
  const toasts = [];
  const confirms = [];
  // 定时器与 window 事件回调必须能手动触发，否则「自动保存」「关闭页面前保存」
  // 这两条最可能覆盖损坏存档的路径在测试里根本走不到。
  const intervals = [];
  const timeouts = [];

  const storage = {
    getItem: k => (memory.has(k) ? memory.get(k) : null),
    setItem(k, v) {
      if (opts.failWrite) throw new Error('QuotaExceededError');
      memory.set(k, String(v));
    },
    removeItem(k) { memory.delete(k); }
  };

  const sandbox = {
    console,
    document,
    localStorage: storage,
    Date,
    JSON,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Map,
    Set,
    Promise,
    isNaN,
    parseFloat,
    parseInt,
    setTimeout: fn => { timeouts.push(fn); return timeouts.length; },
    clearTimeout: () => {},
    setInterval: fn => { intervals.push(fn); return intervals.length; },
    clearInterval: () => {},
    requestAnimationFrame: fn => { try { fn(); } catch (e) {} return 1; },
    scrollTo: () => {},
    scrollIntoView: () => {},
    alert: () => {},
    navigator: {},
    location: { protocol: 'file:', hostname: '' },
    isSecureContext: false,
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    Blob: function Blob(parts) { this.parts = parts; this.size = 1; },
    FileReader: function FileReader() { this.readAsText = () => {}; },
    confirm: msg => { confirms.push(msg); return opts.confirm === undefined ? true : opts.confirm; },
    fetch: () => { throw new Error('测试中不应访问网络'); }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  // window.addEventListener('beforeunload' / 'visibilitychange') 等
  sandbox.addEventListener = (type, fn) => {
    if (!document._listeners.has('win::' + type)) document._listeners.set('win::' + type, []);
    document._listeners.get('win::' + type).push(fn);
  };
  sandbox.removeEventListener = () => {};

  const html = fs.readFileSync(DIST, 'utf8');
  const source = extractScripts(html);

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'dist-bundle.js' });

  // 触发 DOMContentLoaded，完成 APP.init()
  const domReady = document._listeners.get('doc::DOMContentLoaded') || [];
  assert.ok(domReady.length > 0, '产物里应注册了 DOMContentLoaded');
  domReady.forEach(fn => fn({}));

  return {
    sandbox,
    memory,
    document,
    storage,
    toasts,
    confirms,
    /** 定时器回调（自动保存用），测试里手动触发 */
    intervals,
    /** window 上的事件回调（beforeunload 用），测试里手动触发 */
    fireWindow: type => (document._listeners.get('win::' + type) || []).forEach(fn => fn({})),
    /** 记录 CSS 变量 --fs-scale 的最终值 */
    fontScale: document._fontScale.value,
    /** 直接执行表达式（用于取内部状态） */
    run: code => vm.runInContext(code, sandbox),
    /** 取某个 selector 的节点 */
    el: sel => document.querySelector(sel),
    /** 取存储里的解析后 JSON */
    stored: key => {
      const raw = memory.get(key);
      return raw === undefined ? undefined : JSON.parse(raw);
    }
  };
}

const KEYS = {
  list: 'dabingli.records.v1',
  current: 'dabingli.current.v1',
  settings: 'dabingli.settings.v1'
};

/* ======================= 启动与渲染 ======================= */

test('产物可启动并渲染出界面', () => {
  const app = boot();
  const content = app.document.querySelector('#content').innerHTML;
  assert.ok(content.length > 100, '首屏应渲染出内容');
  assert.match(app.document.querySelector('#stepTitle').textContent, /基本情况/);
});

test('首屏包含科室选择与姓名输入', () => {
  const app = boot();
  const html = app.document.querySelector('#content').innerHTML;
  assert.match(html, /basic\.department/);
  assert.match(html, /basic\.name/);
});

/* ======================= 存储失败可见（参考项目核心主张） ======================= */

test('存储写入失败时 saveToLibrary 返回 false，不谎称已保存', () => {
  const app = boot({ failWrite: true });
  const ok = app.run('APP._test.saveToLibrary()');
  assert.equal(ok, false);
});

test('存储写入失败后界面出现可见告警，而不是静默失败', () => {
  const app = boot({ failWrite: true });
  app.run('APP._test.saveToLibrary()');
  app.run('APP._test.render()');
  const html = app.document.querySelector('#content').innerHTML;
  assert.match(html, /storageAlert|保存失败/, '应渲染存储告警');
});

test('存储正常时保存成功并写入 localStorage', () => {
  const app = boot();
  app.run(`(() => {
    const R = APP.getRecord();
    R.basic.name = '张三';
    R.basic.chiefComplaint = '咳嗽';
  })()`);
  const ok = app.run('APP._test.saveToLibrary()');
  assert.equal(ok, true);
  const list = app.stored(KEYS.list);
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 1);
  assert.equal(list[0].basic.name, '张三');
});

/* ======================= 损坏存档保护 ======================= */

test('损坏的当前病历不会被覆盖，且给出告警', () => {
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  // 构建完成后，损坏的原始数据必须还在
  assert.equal(app.memory.get(KEYS.current), corrupt, '损坏数据不应被自动覆盖');
  const html = app.document.querySelector('#content').innerHTML;
  assert.match(html, /无法读取|损坏/, '应提示用户存档有问题');
});

test('损坏的病历列表不被覆盖', () => {
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  app.run('APP._test.loadList()');
  assert.equal(app.memory.get(KEYS.list), corrupt);
});

test('损坏的当前病历：自动保存不会把它冲掉', () => {
  // 启动时读到损坏数据只是第一道关。真正危险的是之后那条 setInterval——
  // 它每隔十秒调一次 saveCurrent()，而那时 R 已经是一份空白病历，
  // 一次回调就能把用户的原始数据换成 {"basic":{...}}，且毫无提示。
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  assert.ok(app.intervals.length > 0, '应注册了自动保存定时器');
  app.intervals.forEach(fn => fn());
  assert.equal(app.memory.get(KEYS.current), corrupt, '自动保存不应覆盖损坏数据');
});

test('损坏的当前病历：关闭页面前的保存不会把它冲掉', () => {
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  app.fireWindow('beforeunload');
  assert.equal(app.memory.get(KEYS.current), corrupt, 'beforeunload 不应覆盖损坏数据');
});

test('损坏的当前病历：用户点保存也不算成功，原始数据不被替换', () => {
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  app.run('APP.getRecord().basic.name = "新填的"');
  const ok = app.run('APP._test.saveWithFeedback()');
  assert.equal(ok, false, '写入被锁时必须返回失败，不能假装已保存');
  assert.equal(app.memory.get(KEYS.current), corrupt, '普通保存也不许覆盖损坏数据');
  const toastText = app.el('#toast').textContent;
  assert.match(toastText, /失败/, '应提示保存失败');
});

test('写入锁期间明确告诉用户：当前编辑的内容还没存下来', () => {
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  const html = app.document.querySelector('#content').innerHTML;
  assert.match(html, /未写入|尚未保存|没有保存|未持久化/, '必须说清编辑内容还没落盘');
});

test('有效存档时自动保存照常工作，没有被锁死', () => {
  const r = JSON.parse(JSON.stringify(app_schema().emptyRecord()));
  r.basic.name = '张三';
  r.basic.chiefComplaint = '咳嗽';
  const app = boot({ initial: { [KEYS.current]: JSON.stringify(r) } });
  app.run('APP.getRecord().basic.chiefComplaint = "改过的主诉"');
  app.intervals.forEach(fn => fn());
  const saved = app.stored(KEYS.current);
  assert.equal(saved.basic.chiefComplaint, '改过的主诉', '正常存档应能自动保存');
});

test('根本没有当前病历（第一次打开）时，自动保存照常写入', () => {
  const app = boot();
  app.run('APP.getRecord().basic.name = "新病人"');
  app.intervals.forEach(fn => fn());
  const saved = app.stored(KEYS.current);
  assert.equal(saved.basic.name, '新病人', '全新的病历不该被锁');
});

test('用户明确清除损坏存档后解除写入锁，新数据可以保存', () => {
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  app.run('APP._test.discardCorruptCurrent()');
  assert.notEqual(app.memory.get(KEYS.current), corrupt, '确认清除后才允许覆盖');
  app.run('APP.getRecord().basic.name = "重新开始"');
  app.intervals.forEach(fn => fn());
  const saved = app.stored(KEYS.current);
  assert.equal(saved.basic.name, '重新开始', '解锁后自动保存应恢复');
});

test('损坏的病历列表：普通保存不会把原始列表冲成空数组', () => {
  // saveToLibrary() 里先 loadList()，损坏时 LIST 变成 []，
  // 接着 saveList() 就把这个 [] 写回去——用户几十份病历一次点击全没了。
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  app.run('APP.getRecord().basic.name = "张三"');
  const ok = app.run('APP._test.saveToLibrary()');
  assert.equal(ok, false, '列表写入被锁时整次保存都算失败');
  assert.equal(app.memory.get(KEYS.list), corrupt, '原始列表必须原样保留');
});

test('损坏列表时不许出现「只改了一半」的假成功：当前病历也不写', () => {
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  app.run('APP.getRecord().basic.name = "张三"');
  app.run('APP._test.saveToLibrary()');
  assert.equal(app.memory.get(KEYS.current), undefined, '列表失败时不应单独写当前病历');
});

test('损坏原文被原样留着手边，用户可以先导出再决定', () => {
  // 恢复路径的第一半：把原始的损坏字符串原样交出去，一个字都不加工。
  // 只有用户确认清除，才允许丢（下一条测试）。
  const corrupt = '{"broken": [';
  const app = boot({ initial: { [KEYS.current]: corrupt } });
  assert.equal(app.run('APP._test.currentSaveBlocked()'), true);
  assert.equal(app.run('APP._test.corruptCurrentRaw()'), corrupt, '导出的必须是原始字节');
  assert.match(app.run('APP._test.storageAlertText()'), /导出/, '横幅里要告诉用户能导出');
});

test('损坏列表的原文同样原样留着', () => {
  // 列表是懒加载的：启动时不读，第一次用到（点「病历」/保存）才读。
  // 读坏的那一刻同样要留原文、上锁。
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  app.run('APP._test.loadList()');
  assert.equal(app.run('APP._test.listSaveBlocked()'), true);
  assert.equal(app.run('APP._test.corruptListRaw()'), corrupt);
  assert.equal(app.memory.get(KEYS.list), corrupt);
});

test('损坏列表时合并导入整单不写，原始列表逐字节不变', () => {
  // 合并要读现有列表。列表损坏时 loadList() 给的是空数组，
  // 若照常合并再写回，用户原有几十份病历就被「空 + 导入的几份」替掉了。
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  const out = app.run(`(function () {
    const r = SCHEMA.emptyRecord();
    r.basic.name = '导入进来的';
    const bundle = RECORD_CORE.buildExport([{ id: 'imp-' + r.basic.name, updatedAt: new Date().toISOString(), data: r }], new Date().toISOString());
    const parsed = RECORD_CORE.parseImport(JSON.stringify(bundle), SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
    return APP._test.applyImport('merge', parsed.records);
  })()`);
  assert.equal(out.ok, false, '合并导入必须报告失败');
  assert.equal(out.blocked, true, '应标记为被写入锁挡下，好让调用方区分失败原因');
  assert.equal(app.memory.get(KEYS.list), corrupt, '原始列表必须原样保留');
  assert.match(app.run('APP._test.storageAlertText()'), /没有写入|停止合并/);
});

test('损坏列表时「替换全部」是用户明确确认后才允许的覆盖入口', () => {
  // 替换是破坏性操作，也是列表损坏时唯一能走出来的路：
  // 用户确认后应解除锁定并真的写进去。
  const corrupt = '[{"id": broken';
  const app = boot({ initial: { [KEYS.list]: corrupt } });
  const out = app.run(`(function () {
    const r = SCHEMA.emptyRecord();
    r.basic.name = '替换进来的';
    const bundle = RECORD_CORE.buildExport([{ id: 'imp-' + r.basic.name, updatedAt: new Date().toISOString(), data: r }], new Date().toISOString());
    const parsed = RECORD_CORE.parseImport(JSON.stringify(bundle), SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
    return APP._test.applyImport('replace', parsed.records);
  })()`);
  assert.equal(out.ok, true, '替换应当写入成功');
  assert.equal(out.replaced, 1);
  const saved = JSON.parse(app.memory.get(KEYS.list));
  assert.equal(saved.length, 1);
  assert.equal(saved[0].data.basic.name, '替换进来的');
  assert.equal(app.run('APP._test.listSaveBlocked()'), false, '替换后应解除列表写入锁');
});

test('正常列表上合并导入照常工作，现有病历不被丢掉', () => {
  const SCHEMA = app_schema();
  const existing = SCHEMA.emptyRecord();
  existing.basic.name = '原来就有的';
  existing.id = 'keep-me';
  existing.updatedAt = '2020-01-01T00:00:00.000Z';
  // 列表里每一条的真实形状是 { id, updatedAt, schemaVersion, basic, data }
  const entry = { id: 'keep-me', updatedAt: existing.updatedAt, basic: existing.basic, data: existing };
  const app = boot({ initial: { [KEYS.list]: JSON.stringify([entry]) } });
  const out = app.run(`(function () {
    const r = SCHEMA.emptyRecord();
    r.basic.name = '新导入的';
    const bundle = RECORD_CORE.buildExport([{ id: 'imp-' + r.basic.name, updatedAt: new Date().toISOString(), data: r }], new Date().toISOString());
    const parsed = RECORD_CORE.parseImport(JSON.stringify(bundle), SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
    return APP._test.applyImport('merge', parsed.records);
  })()`);
  assert.equal(out.ok, true);
  assert.equal(out.res.added, 1);
  const saved = JSON.parse(app.memory.get(KEYS.list));
  assert.deepEqual(saved.map(x => x.data.basic.name).sort(), ['新导入的', '原来就有的'].sort());
});

/* ======================= 载入与规范化 ======================= */

test('载入已有病历并把旧结构补齐', () => {
  const SCHEMA = app_schema();
  const old = {
    basic: { name: '旧病历', chiefComplaint: '头晕' },
    hpi: { onset: '1天前头晕' },
    diagnosis: { confirmed: ['眩晕'] }
  };
  const app = boot({ initial: { [KEYS.current]: JSON.stringify(old) } });
  const name = app.run('APP.getRecord().basic.name');
  assert.equal(name, '旧病历');
  // 新字段被补齐
  const hasPe = app.run('!!APP.getRecord().pe.vitals');
  assert.equal(hasPe, true);
});

function app_schema() {
  return require(path.join(__dirname, '..', 'src', 'schema.js'));
}

test('未知科室的旧病历能正常打开', () => {
  const SCHEMA = app_schema();
  const r = SCHEMA.emptyRecord();
  r.basic.name = '旧科室病历';
  r.basic.department = 'removed-dept-xyz';
  r.hpi.onset = '测试';
  const app = boot({ initial: { [KEYS.current]: JSON.stringify(r) } });
  const dept = app.run('APP.getRecord().basic.department');
  assert.equal(dept, 'general', '未知科室应回退到通用');
});

/* ======================= 设置 ======================= */

test('非法设置被纠正，不会撑坏界面', () => {
  const app = boot({ initial: { [KEYS.settings]: JSON.stringify({ fontScale: 99, rosMode: 'bogus' }) } });
  const applied = app.fontScale;
  // 99 超出允许区间，应回退到 1
  assert.equal(applied, '1', `实际应用的字号缩放：${applied}`);
});

test('合法字号设置被保留', () => {
  const app = boot({ initial: { [KEYS.settings]: JSON.stringify({ fontScale: 1.2 }) } });
  assert.equal(app.fontScale, '1.2');
});

/* ======================= 纯函数接口 ======================= */

test('getRecord 返回当前病历对象', () => {
  const app = boot();
  const r = app.run('APP.getRecord()');
  assert.ok(r && r.basic, '应返回有病历结构的对象');
});

test('STEPS 有 11 个步骤', () => {
  const app = boot();
  assert.equal(app.run('APP.STEPS.length'), 11);
});

test('步骤里不再有「评分自查」，生成病历是最后一步', () => {
  const app = boot();
  const keys = Array.from(app.run('APP.STEPS.map(s => s.key)'));
  const names = Array.from(app.run('APP.STEPS.map(s => s.name)'));
  // 用户明确要求过：这只是一个写病历的工具，不需要自查打分。
  assert.ok(!names.includes('评分自查'), '「评分自查」整块已移除');
  assert.ok(!keys.includes('check'), '不应再有 check 步骤');
  assert.equal(keys[keys.length - 1], 'output', '「生成病历」应为最后一步');
  assert.equal(keys[keys.length - 2], 'summary', '「摘要与诊断」紧接其后');
});

test('沙箱内不发起网络请求', () => {
  // boot 时 fetch 已设为抛错，若能启动到这一步说明没有网络依赖
  const app = boot();
  assert.ok(app.document.querySelector('#content').innerHTML.length > 0);
});

test('录入步骤顺序与病历章节顺序一致：既往史在系统回顾之前', () => {
  const app = boot();
  // vm 沙箱里的数组 prototype 与宿主不同，deepStrictEqual 会因原型不等而失败，
  // 所以先转成宿主数组再比。
  const keys = Array.from(app.run('APP.STEPS.map(s => s.key)'));
  // 用户反馈过「顺序有误，应该先既往史再系统回顾」。
  // 《诊断学》第10版的住院病历书写顺序也是既往史在前——系统回顾是
  // 既往史的补充追问，排在它后面才讲得通。写死整个数组，是防止以后
  // 有人改步骤时只顾一处、把顺序又改乱。
  assert.deepEqual(keys, [
    'basic', 'hpi', 'pmh', 'ros', 'personal', 'marriage',
    'family', 'pe', 'aux', 'summary', 'output'
  ]);
});

test('录入步骤顺序与 SECTION_ORDER 的病史部分一一对应', () => {
  // 步骤顺序如果和生成病历的章节顺序不一致，学生就会在「系统回顾」页
  // 填一个病历里排在「既往史」前面的东西，翻回来对不上号。
  const { bootGlobals } = require('./bootstrap.cjs');
  const G = bootGlobals().GENERATOR;
  const sec = Array.from(G.SECTION_ORDER);
  const app = boot();
  const keys = Array.from(app.run('APP.STEPS.map(s => s.key)'));

  const map = {
    basic: '一般项目', hpi: '现病史', pmh: '既往史', ros: '系统回顾',
    personal: '个人史', marriage: '婚姻史', family: '家庭史',
    pe: '体格检查', aux: '实验室检查', summary: '摘要'
  };
  const pairs = keys.filter(k => map[k]).map(k => [k, sec.indexOf(map[k])]);
  const idx = pairs.map(p => p[1]);
  assert.ok(idx.every(i => i >= 0), `章节名都要能在 SECTION_ORDER 里找到：${JSON.stringify(pairs)}`);
  // 用字符串比而不是 deepEqual：bootGlobals 加载的模块与本测试不在同一个 realm，
  // 数组原型不同，deepStrictEqual 会因原型不等而报「看起来一模一样」的错。
  const sorted = [...idx].sort((a, b) => a - b);
  assert.equal(idx.join(','), sorted.join(','), `步骤顺序应与章节顺序一致，实际：${JSON.stringify(pairs)}`);
});

/* ======================= 记住上次停留的步骤 ======================= */

test('stepIndexOf 认得出步骤键，认不出来的一律回第 0 步', () => {
  const app = boot();
  assert.equal(app.run('APP._test.stepIndexOf("basic")'), 0);
  assert.equal(app.run('APP._test.stepIndexOf("pe")'), 7);
  assert.equal(app.run('APP._test.stepIndexOf("output")'), 10);
  // 空串、旧键、拼错的键都不能让页面白屏
  assert.equal(app.run('APP._test.stepIndexOf("")'), 0);
  assert.equal(app.run('APP._test.stepIndexOf(undefined)'), 0);
  assert.equal(app.run('APP._test.stepIndexOf("不存在的步骤")'), 0);
});

test('刷新后回到上次停留的步骤，不必从第一步重新点', () => {
  const app = boot({
    initial: { 'dabingli.settings.v1': JSON.stringify({ rosMode: 'detail', fontScale: 1, lastStep: 'pe' }) }
  });
  assert.equal(app.document.querySelector('#stepNum').textContent, '8/11');
  assert.match(app.document.querySelector('#stepTitle').textContent, /体格检查/);
});

test('存档里的步骤键坏掉时退回第一步，不白屏', () => {
  const app = boot({
    initial: { 'dabingli.settings.v1': JSON.stringify({ lastStep: 'steps-changed' }) }
  });
  assert.equal(app.document.querySelector('#stepNum').textContent, '1/11');
  assert.match(app.document.querySelector('#stepTitle').textContent, /基本情况/);
  assert.ok(app.document.querySelector('#content').innerHTML.length > 100);
});

test('切换步骤后立即写回设置，生成页不记', () => {
  const app = boot();
  app.run('APP._test.gotoStep("summary")');
  assert.equal(app.stored(KEYS.settings).lastStep, 'summary');

  app.run('APP._test.gotoStep("output")');
  // 生成页只是输出，记它等于下次打开先看一屏只读的文字
  assert.equal(app.stored(KEYS.settings).lastStep, 'summary');
});

/* ======================= 步骤导航 ======================= */

test('步骤导航列出全部 11 步，且当前步被标出来', () => {
  const app = boot();
  app.run('APP._test.gotoStep("pmh")');
  const html = app.run('APP._test.navRowsHtml()');
  assert.match(html, /基本情况/);
  assert.match(html, /既往史/);
  assert.match(html, /系统回顾/);
  assert.match(html, /生成病历/);
  const rows = (html.match(/data-navstep=/g) || []).length;
  assert.equal(rows, 11, '11 个步骤每步一行');
  assert.match(html, /nav-row cur[^>]*data-navstep="pmh"/, '当前步要带 cur 类');
});

test('步骤导航每行显示填写状态，三种状态各有自己的样式类', () => {
  const app = boot();
  app.run('APP._test.gotoStep("basic")');
  const html = app.run('APP._test.navRowsHtml()');
  assert.match(html, /st-empty/, '空病历应有「还没填」');
  assert.match(html, /还没填/);
});

test('某个步骤填了之后，导航里那一行变成「已填」', () => {
  const app = boot();
  app.run(`
    const r = APP.getRecord();
    r.basic.name = '张三'; r.basic.gender = '男'; r.basic.age = '45';
    r.basic.chiefComplaint = '上腹痛';
  `);
  assert.equal(app.run('APP._test.stepState("basic")'), 'done');
  assert.equal(app.run('APP._test.stepState("hpi")'), 'empty');
});

test('现病史只填起病时间算「填了一部分」，症状特点也写了才算已填', () => {
  const app = boot();
  app.run('APP.getRecord().hpi.onset = "3天前"');
  assert.equal(app.run('APP._test.stepState("hpi")'), 'part');
  app.run('APP.getRecord().hpi.symptoms = "中上腹持续性隐痛"');
  assert.equal(app.run('APP._test.stepState("hpi")'), 'done');
});

test('体格检查一项都没勾时算空，勾了一大半才算已填', () => {
  const app = boot();
  assert.equal(app.run('APP._test.stepState("pe")'), 'empty');
  // 勾 3 项：远不到 60%，仍是「填了一部分」
  app.run(`
    SCHEMA.setPeChecked(APP.getRecord(), 'general', 'development', true);
    SCHEMA.setPeChecked(APP.getRecord(), 'general', 'nutrition', true);
    SCHEMA.setPeChecked(APP.getRecord(), 'general', 'conscious', true);
  `);
  assert.equal(app.run('APP._test.stepState("pe")'), 'part');
});

test('点导航里的行会跳到对应步骤', () => {
  const app = boot();
  app.run('APP._test.gotoStep("basic")');
  // 沙箱里的 closest 是桩，点击链路交给真机 E2E 覆盖；
  // 这里验证的是「导航里确实有 family 这一行，且它的 key 与 gotoStep 认的键一致」。
  const html = app.run('APP._test.navRowsHtml()');
  assert.match(html, /data-navstep="family"/);
  app.run('APP._test.gotoStep("family")');
  assert.equal(app.run('APP._test.getStepKey()'), 'family');
});

test('生成病历那一步不显示状态——它没有内容多少这回事', () => {
  const app = boot();
  // 「生成病历」不是录入步骤。给它标「填了一部分」会让人以为还有东西没填，
  // 标「已填」又像是做完了一项检查。状态是 none，导航里整个角标不渲染。
  assert.equal(app.run('APP._test.stepState("output")'), 'none');
  const html = app.run('APP._test.navRowsHtml()');
  const rows = html.split('data-navstep="');
  const outRow = rows.find(r => r.startsWith('output"'));
  assert.ok(outRow && !/nav-state/.test(outRow), '生成那行不该有状态角标');
});

/* ======================= 病历切换与保存失败回归 ======================= */

function clickList(app, attribute, openId) {
  app.run('APP._test.openList()');
  const handler = app.document._listeners.get('<created:div>::click').at(-1);
  const target = {
    dataset: {},
    hasAttribute: name => name === attribute,
    closest: selector => selector === '[data-open]' && openId ? { dataset: { open: openId } } : null
  };
  handler({ target });
}

test('没有姓名主诉但已填现病史，新建前仍保存这份病历', () => {
  const app = boot();
  app.run('APP.getRecord().hpi.symptoms = "持续腹痛"');
  clickList(app, 'data-new');
  assert.equal(app.confirms.length, 1);
  assert.equal(app.stored(KEYS.list)[0].data.hpi.symptoms, '持续腹痛');
  assert.equal(app.run('APP.getRecord().hpi.symptoms'), '');
});

test('列表损坏时新建中止，当前编辑内容与原始存档都保留', () => {
  const app = boot({ initial: { [KEYS.list]: 'invalid json' } });
  app.run('APP.getRecord().basic.name = "张三"; APP.getRecord().hpi.symptoms = "持续腹痛"; APP._test.saveCurrent()');
  clickList(app, 'data-new');
  assert.equal(app.run('APP.getRecord().hpi.symptoms'), '持续腹痛');
  assert.equal(app.stored(KEYS.current).hpi.symptoms, '持续腹痛');
  assert.equal(app.memory.get(KEYS.list), 'invalid json');
});

test('当前病历写入失败时列表不发生半次保存', () => {
  const app = boot();
  const set = app.storage.setItem;
  app.storage.setItem = (k, v) => { if (k === KEYS.current) throw new Error('quota'); set(k, v); };
  app.run('APP.getRecord().basic.name = "张三"');
  assert.equal(app.run('APP._test.saveToLibrary()'), false);
  assert.equal(app.stored(KEYS.list), undefined);
  assert.equal(app.run('APP._test.saveToLibrary()'), false);
  assert.equal(app.stored(KEYS.list), undefined);
});

test('列表写入失败后重试仍使用同一 ID，刷新后也不会重复', () => {
  const app = boot();
  const set = app.storage.setItem;
  app.storage.setItem = (k, v) => { if (k === KEYS.list) throw new Error('quota'); set(k, v); };
  app.run('APP.getRecord().basic.name = "张三"');
  assert.equal(app.run('APP._test.saveToLibrary()'), false);
  const id = app.stored(KEYS.current).id;
  assert.ok(id);
  assert.equal(app.run('APP.getRecord().id'), id);
  const restarted = boot({ initial: Object.fromEntries(app.memory) });
  assert.equal(restarted.run('APP._test.saveToLibrary()'), true);
  assert.equal(restarted.run('APP._test.saveToLibrary()'), true);
  assert.equal(restarted.stored(KEYS.list).length, 1);
  assert.equal(restarted.stored(KEYS.list)[0].id, id);
});

test('切换到新记录时当前槽写入失败，继续保留原记录', () => {
  const app = boot();
  app.run('APP.getRecord().basic.name = "张三"');
  const set = app.storage.setItem;
  let currentWrites = 0;
  app.storage.setItem = (k, v) => {
    if (k === KEYS.current && ++currentWrites === 2) throw new Error('quota');
    set(k, v);
  };
  clickList(app, 'data-new');
  assert.equal(app.run('APP.getRecord().basic.name'), '张三');
  assert.equal(app.stored(KEYS.current).basic.name, '张三');
  assert.equal(app.stored(KEYS.list)[0].data.basic.name, '张三');
});

test('打开当前记录自身时使用刚保存的最新内容', () => {
  const app = boot();
  app.run('APP.getRecord().basic.name = "张三"; APP._test.saveToLibrary(); APP.getRecord().hpi.symptoms = "新症状"');
  const id = app.run('APP.getRecord().id');
  clickList(app, null, id);
  assert.equal(app.run('APP.getRecord().hpi.symptoms'), '新症状');
  assert.equal(app.stored(KEYS.current).hpi.symptoms, '新症状');
});

test('保存失败时可以独立导出当前病历备份', () => {
  const app = boot({ initial: { [KEYS.list]: 'invalid json' } });
  let downloaded;
  app.sandbox.URL.createObjectURL = blob => { downloaded = blob; return 'blob:x'; };
  app.run('APP.getRecord().hpi.symptoms = "持续腹痛"');
  clickList(app, 'data-backup-current');
  const backup = JSON.parse(downloaded.parts.join('').replace(/^\ufeff/, ''));
  assert.equal(backup.records[0].data.hpi.symptoms, '持续腹痛');
  assert.equal(app.memory.get(KEYS.list), 'invalid json');
});

test('套用模板标记可跨刷新保留，并阻止混入另一种模板', () => {
  const app = boot();
  app.run('APP._test.applyTemplate("cap")');
  assert.equal(app.run('APP.getRecord().__templateKey'), 'cap');
  const restarted = boot({ initial: Object.fromEntries(app.memory) });
  const before = restarted.run('JSON.stringify(APP.getRecord())');
  restarted.run('APP._test.applyTemplate("asthma")');
  assert.equal(restarted.run('JSON.stringify(APP.getRecord())'), before);
  assert.ok(restarted.document.body.children.some(node => node.innerHTML.includes('不能混合模板')));
});

test('离线复制返回 false 时打开手动复制框，不误报成功', () => {
  const app = boot();
  app.document.execCommand = () => false;
  const target = { dataset: { act: 'copyText' }, closest() { return this; } };
  const handler = app.document._listeners.get('doc::click')[0];
  handler({ target });
  assert.ok(app.document.body.children.some(node => node.innerHTML.includes('请长按全选后复制')));
  assert.notEqual(app.el('#toast').textContent, '已复制到剪贴板');
});

test('打开其他病历时保存失败，当前病历不会被替换', () => {
  const app = boot();
  app.run('APP.getRecord().basic.name = "旧病历"; APP._test.saveToLibrary()');
  const oldId = app.run('APP.getRecord().id');
  app.run('APP._test.setRecord(SCHEMA.emptyRecord()); APP.getRecord().hpi.symptoms = "正在编辑"');
  const set = app.storage.setItem;
  app.storage.setItem = (k, v) => { if (k === KEYS.list) throw new Error('quota'); set(k, v); };
  clickList(app, null, oldId);
  assert.equal(app.run('APP.getRecord().hpi.symptoms'), '正在编辑');
  assert.equal(app.stored(KEYS.current).hpi.symptoms, '正在编辑');
  assert.equal(app.stored(KEYS.list)[0].basic.name, '旧病历');
});

test('用户拒绝填入生命体征示例值时不写入数字', () => {
  const app = boot({ confirm: false });
  const target = { dataset: { act: 'fillVitalsNormal' }, closest() { return this; } };
  app.document._listeners.get('doc::click')[0]({ target });
  assert.match(app.confirms[0], /示例数值/);
  assert.equal(app.run('Object.keys(APP.getRecord().pe.vitals).length'), 0);
});
