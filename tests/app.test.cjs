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
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
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

test('STEPS 有 12 个步骤', () => {
  const app = boot();
  assert.equal(app.run('APP.STEPS.length'), 12);
});

test('STEPS 含「评分自查」步骤，且排在摘要与诊断之后、生成病历之前', () => {
  const app = boot();
  const keys = app.run('APP.STEPS.map(s => s.key)');
  const names = app.run('APP.STEPS.map(s => s.name)');
  assert.ok(names.includes('评分自查'), '步骤里应有「评分自查」');
  const iCheck = keys.indexOf('check');
  assert.ok(iCheck > 0, '应有 check 步骤');
  assert.equal(keys[iCheck - 1], 'summary', '「评分自查」应在「摘要与诊断」之后');
  assert.equal(keys[iCheck + 1], 'output', '「评分自查」应在「生成病历」之前');
});

test('沙箱内不发起网络请求', () => {
  // boot 时 fetch 已设为抛错，若能启动到这一步说明没有网络依赖
  const app = boot();
  assert.ok(app.document.querySelector('#content').innerHTML.length > 0);
});
