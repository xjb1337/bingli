/* ===========================================================================
 * UI 层：分步骤表单、本地保存、预览导出
 * 依赖 RECORD_CORE / SCHEMA / GENERATOR / HINTS / DEPTH（构建时内联到同一文件）
 *
 * 存储与数据校验一律走 RECORD_CORE（可在 node:test 中单测），
 * 这里只负责 DOM 与用户交互。
 *
 * 界面职责边界：
 *   · 病历正文 = 大病历（12 个章节）
 *   · 首次病程录 = 同一份病历的 SOAP 归纳，不重复抄病历
 *   · 出院记录 = 住院经过的收尾文书
 * =========================================================================== */

const APP = (() => {
  'use strict';

  const CORE = RECORD_CORE;
  const K = CORE.STORAGE_KEYS;

  /** 应用版本，显示在页脚，便于判断手机是否仍在用旧版 */
  const APP_VERSION = '3.0.0';

  /** 当前正在编辑的病历 */
  let R = null;
  /** 已保存病历列表 */
  let LIST = [];
  /** 当前步骤索引 */
  let step = 0;
  let settings = { ...CORE.SETTINGS_DEFAULTS };
  /** 存储异常提示（损坏 / 写满），显示在界面顶部 */
  let storageAlert = '';
  /** 其他标签页写了更新版本时的冲突状态；有值时禁止本页覆盖 */
  let remoteConflict = null;
  /** 本页会话 ID，用于区分「自己的写入」和「其他页面的写入」 */
  const SESSION_ID = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  /** 撤销栈：只在本机内存里，刷新即失效 */
  const HISTORY = CORE.createHistory(20);
  /** 界面层临时展示的生命体征示例值（绝不写入病历） */
  let vitalsExample = null;

  /** 当前所有合法科室键，供 core 校验 */
  const deptKeys = () => SCHEMA.DEPARTMENTS.map(d => d.key);

  /**
   * 步骤清单。
   *
   * 步骤顺序 == 病历章节顺序（见 GENERATOR.SECTION_ORDER），不是两套。
   * 既往史在系统回顾之前：《诊断学》第10版第六篇的住院病历书写顺序是
   * 「主诉／现病史／既往史／系统回顾／个人史／婚姻史／月经生育史／家族史」，
   * 系统回顾是既往史的补充追问，排在它后面才讲得通。
   */
  const STEPS = [
    { key: 'basic', name: '基本情况', icon: '①' },
    { key: 'hpi', name: '现病史', icon: '②' },
    { key: 'pmh', name: '既往史', icon: '③' },
    { key: 'ros', name: '系统回顾', icon: '④' },
    { key: 'personal', name: '个人史', icon: '⑤' },
    { key: 'marriage', name: '婚姻与生育史', icon: '⑥' },
    { key: 'family', name: '家庭史', icon: '⑦' },
    { key: 'pe', name: '体格检查', icon: '⑧' },
    { key: 'aux', name: '辅助检查', icon: '⑨' },
    { key: 'summary', name: '摘要与诊断', icon: '⑩' },
    { key: 'output', name: '生成病历', icon: '✓' }
  ];

  /* ===================== 字段填写等级（必填 / 建议 / 可留空） =====================
   *
   * 用户反馈过「分不清什么必须填、什么可以留空」——这里把每个字段的等级写死成一张表，
   * 界面上按等级打标记，同时在「生成病历」页给一个总览。
   *
   *   must   必填：不填病历就不成立（姓名、性别、年龄、主诉）
   *   should 建议填：不填会留空或写成通用默认，病历质量下降
   *   auto   可留空：留空由工具自动补默认描述（会标注「系统默认」）
   */
  const FIELD_LEVEL = {
    must: new Set([
      'basic.name', 'basic.gender', 'basic.age', 'basic.department',
      'basic.chiefComplaint'
      // 主诉时长原本在这里。用户要求把「持续时间/单位」两个控件去掉、时间直接写进主诉，
      // 这个字段就没有对应的输入框了——留在 must 里会让「填写情况」永远报一项必填缺失，
      // 而那一项在界面上根本不存在，学生永远补不完。
    ]),
    // 留空后「病历里会缺这一项」或只剩通用套话
    should: new Set([
      'basic.recordNo', 'basic.admitDate', 'basic.informant',
      'hpi.onset', 'hpi.symptoms', 'hpi.treatment',
      'pmh.health', 'pmh.surgery', 'pmh.trauma', 'pmh.transfusion',
      'personal.smoking', 'personal.drinking',
      'pe.vitals.temperature', 'pe.vitals.pulse', 'pe.vitals.respiration',
      'pe.vitals.sbp', 'pe.vitals.dbp'
    ])
  };

  /** 取某个字段的等级：must / should / auto */
  function fieldLevel(path) {
    if (FIELD_LEVEL.must.has(path)) return 'must';
    if (FIELD_LEVEL.should.has(path)) return 'should';
    return 'auto';
  }

  /** 等级对应的角标 HTML */
  function levelTag(path) {
    const lv = fieldLevel(path);
    if (lv === 'must') return '<span class="tag-req">必填</span>';
    if (lv === 'should') return '<span class="tag-should">建议填</span>';
    return '';
  }

  /* ========================= 存储（委托给 core） ========================= */
  //
  // 写入锁：loadCurrent / loadList 一旦发现「key 在、但读不出来」，就把对应槽锁上，
  // 之后任何写入都被最底层的 saveCurrent / saveList 挡回去。
  // 为什么必须锁在最底层：自动保存（10 秒定时器）、beforeunload、事件委托里
  // 那一堆「改完立刻 saveCurrent()」的调用点、普通保存按钮、导入合并……
  // 只要有一处漏了，「空白病历覆盖掉损坏原文」就发生了，用户的旧病历彻底没了。
  // 锁只能由用户明确操作解除：清除损坏槽从头写、或导入备份替换。
  let currentSaveBlocked = false;
  let listSaveBlocked = false;
  let corruptCurrentRaw = '';
  let corruptListRaw = '';
  /** 上一次写入是否失败，用于「恢复保存」时明确告知一次 */
  let lastSaveFailed = false;

  /** 每个标签页自己的「当前病历」指针；localStorage 里的 current 只作兜底 */
  const SESSION_KEY = 'dabingli.session.current.v1';
  let sessionIdCache = '';
  function getSessionId() {
    // window.name 是每个标签页自己的，刷新后仍在，也不会被同源其他标签页读写；
    // sessionStorage 作为第二选择（部分浏览器/隐私模式行为不同）。
    try {
      const named = String(window.name || '');
      if (named.indexOf('dabingli:') === 0) return named.slice('dabingli:'.length);
    } catch (e) { /* ignore */ }
    try { return sessionStorage.getItem(SESSION_KEY) || sessionIdCache; } catch (e) { return sessionIdCache; }
  }
  function setSessionId(id) {
    sessionIdCache = String(id || '');
    try { window.name = sessionIdCache ? 'dabingli:' + sessionIdCache : ''; } catch (e) { /* ignore */ }
    try { sessionStorage.setItem(SESSION_KEY, sessionIdCache); } catch (e) { /* 隐私模式也不影响使用 */ }
  }

  /** Web Locks 在 Chrome/Edge/Android Chrome 可用；不可用时退回单页检查 */
  function lockAvailable() {
    return typeof navigator !== 'undefined' && navigator.locks
      && typeof navigator.locks.request === 'function';
  }
  let saveQueue = Promise.resolve();
  let listQueue = Promise.resolve();

  function loadList() {
    const res = CORE.loadList(localStorage);
    if (res.ok) {
      LIST = res.list;
      listSaveBlocked = false;
      corruptListRaw = '';
    } else if (res.corrupt) {
      // 关键：损坏时不覆盖原存档，提示用户先导出/备份
      LIST = res.list;
      listSaveBlocked = true;
      corruptListRaw = String(res.raw == null ? '' : res.raw);
      storageAlert = '本地病历列表读取失败，已保留原始数据未做修改、也不再自动写回。'
        + '请先导出原始数据留底，再决定是否新建列表。';
    } else {
      LIST = res.list;
    }
    return res;
  }

  function saveListNow(opts = {}) {
    if (listSaveBlocked) {
      storageAlert = '病历列表读不出来，已停止写入以免覆盖原数据。'
        + '请先在下方导出原始数据或新建列表，再继续保存。';
      return false;
    }
    if (!opts.replace) {
      // 写前合并：另一个标签页可能刚保存了别的病历
      const stored = CORE.loadList(localStorage);
      if (stored.ok) LIST = CORE.mergeListForWrite(stored.list, LIST);
    }
    const ok = CORE.safeSet(localStorage, K.list, JSON.stringify(LIST));
    if (!ok) {
      // 保存失败必须让用户看见，不能假装已保存
      storageAlert = '保存失败：浏览器存储空间可能已满。请先导出病历，再删除不需要的记录。';
      return false;
    }
    return true;
  }

  /**
   * 需要知道列表到底写没写成功时用它：有 Web Locks 返回 Promise<boolean>，
   * 没有该 API 时同步返回布尔值。
   */
  function saveListAwait(opts = {}) {
    if (!lockAvailable()) return saveListNow(opts);
    const run = listQueue
      .then(() => navigator.locks.request('dabingli:list', () => saveListNow(opts)))
      .catch(() => false);
    listQueue = run.then(() => {}, () => {});
    return run;
  }

  /** 普通保存入口：排队写入，不阻塞界面 */
  function saveList(opts = {}) {
    const result = saveListAwait(opts);
    return result && typeof result.then === 'function' ? true : result;
  }

  function saveCurrentNow() {
    if (currentSaveBlocked) {
      // 静默拒绝：这条路径会被定时器和 beforeunload 频繁触发，
      // 每次都改 storageAlert 会把用户正在读的提示刷成别的内容。
      // 告警在 loadCurrent 时已经写过一次，横幅会一直挂在那儿。
      return false;
    }
    if (!R) return false;
    if (remoteConflict) {
      // 其他标签页已有更新版本：在用户选择「载入新版本 / 保留为副本」前不写
      return false;
    }
    if (!R.meta) R.meta = {};
    const expected = Number(R.meta.revision) || 0;
    const res = CORE.saveCurrent(localStorage, R, expected);
    if (res.ok) {
      R.meta.revision = res.record.meta.revision;
      R.meta.updatedAt = res.record.meta.updatedAt;
      const recovered = lastSaveFailed;
      lastSaveFailed = false;
      storageAlert = '';
      if (recovered) toast('本机保存已恢复');
      return true;
    }
    if (res.conflict) {
      remoteConflict = { remote: res.remote, remoteRevision: res.remoteRevision };
      storageAlert = '其他页面已保存了这份病历的更新版本（修订号 '
        + res.remoteRevision + '）。为避免互相覆盖，本页已暂停保存。';
      return false;
    }
    // 存储层失败：保留内存内容，明确告诉用户尚未落盘
    lastSaveFailed = true;
    storageAlert = '当前病历自动保存失败：' + (res.reason || '无法写入本机存储')
      + '。内容仍在当前页面，请先导出留底。';
    return false;
  }

  /**
   * 保存入口：有 Web Locks 时按病历 id 排队并加跨标签页锁，锁内再读修订号；
   * 没有该 API 的环境（Node 测试、旧浏览器）退回同步检查。
   */
  function saveCurrent() {
    if (currentSaveBlocked || !R || remoteConflict) return saveCurrentNow();
    const id = R.id;
    if (!lockAvailable()) return saveCurrentNow();
    saveCurrentAwait();
    return true;
  }

  /**
   * 需要知道「到底写成功没有」的路径用它：锁内重新读修订号再比较，
   * 保证两个标签页不会都基于同一个旧修订号写入。
   * 无 Web Locks 时同步返回布尔值，有锁时返回 Promise<boolean>。
   */
  function saveCurrentAwait() {
    if (currentSaveBlocked || !R || remoteConflict) return saveCurrentNow();
    const id = R.id;
    if (!lockAvailable()) return saveCurrentNow();
    const run = saveQueue.then(() =>
      navigator.locks.request('dabingli:record:' + id, () => saveCurrentNow())
    ).catch(() => false);
    saveQueue = run;
    return run;
  }

  /** 统一处理「同步布尔 / 异步 Promise」两种返回 */
  function afterSave(result, done) {
    if (result && typeof result.then === 'function') return result.then(done);
    return done(result);
  }

  function loadCurrent() {
    const res = CORE.loadCurrent(localStorage, SCHEMA.emptyRecord, deptKeys(), getSessionId());
    if (res.ok) {
      if (res.record) { R = res.record; setSessionId(R.id); }
      currentSaveBlocked = false;
      corruptCurrentRaw = '';
      return !!res.record;
    }
    // res.corrupt：不是「没有存档」，是「有存档但读不出来」。这两种必须分开，
    // 早先只用一个真假值表示，导致损坏时被当成第一次使用，空白病历直接写回去。
    currentSaveBlocked = true;
    corruptCurrentRaw = String(res.raw == null ? '' : res.raw);
    storageAlert = '正在编辑的病历无法读取（' + (res.reason || '存档损坏') + '）。'
      + '原数据保留未动，自动保存已暂停——当前编辑的内容尚未写入本机。'
      + '请先导出原始数据留底，再选择「新建空白病历」。';
    return false;
  }

  // 用户明确确认后的解锁路径：清掉损坏槽、开始新病历。
  // 调用点会先弹 confirm 并把原始字符串给用户下载，所以这里不再二次确认。
  function discardCorruptCurrent() {
    if (!currentSaveBlocked) return false;
    try { localStorage.removeItem(K.current); } catch (e) { /* 删不掉也不能把锁解开 */ }
    currentSaveBlocked = false;
    corruptCurrentRaw = '';
    R = newRecord();
    setSessionId(R.id);
    storageAlert = '';
    return saveCurrent();
  }

  function discardCorruptList() {
    if (!listSaveBlocked) return false;
    try { localStorage.removeItem(K.list); } catch (e) { /* 同上 */ }
    listSaveBlocked = false;
    corruptListRaw = '';
    LIST = [];
    storageAlert = '';
    return saveList();
  }

  /** 新病历先分配 ID：撤销栈、多标签页冲突都按 ID 绑定，未保存过也要能撤销 */
  function newRecord() {
    const r = SCHEMA.emptyRecord();
    r.id = CORE.uid();
    return r;
  }

  /** 操作前存快照：只在本机内存，刷新即失效 */
  function snapshot(label) {
    if (!R) return false;
    return HISTORY.push(R, label);
  }

  /** 撤销最近一次可撤销操作（按病历 ID 绑定） */
  function undoLast() {
    if (!R) return false;
    const item = HISTORY.pop(R.id);
    if (!item) { toast('没有可撤销的操作'); return false; }
    let rec;
    try {
      rec = CORE.normalizeRecord(item.snapshot, SCHEMA.emptyRecord, deptKeys());
    } catch (e) {
      toast('撤销失败：快照无法读取');
      return false;
    }
    const keepRev = Number(R.meta && R.meta.revision) || 0;
    R = rec;
    if (!R.meta) R.meta = {};
    // 快照里的修订号是旧的，直接写会被当成冲突；撤销本身是一次新的写入
    R.meta.revision = keepRev;
    // 撤销后的内容要立即落盘，否则刷新又回到撤销前
    const saved = saveCurrent();
    render();
    toast(saved ? `已撤销：${item.label}` : `已撤销：${item.label}（尚未写入本机）`);
    return true;
  }

  function loadSettings() {
    const raw = CORE.safeGetJSON(localStorage, K.settings);
    settings = CORE.normalizeSettings(raw);
    applyFontScale();
  }

  function saveSettings() {
    CORE.safeSet(localStorage, K.settings, JSON.stringify(settings));
    applyFontScale();
  }

  function applyFontScale() {
    document.documentElement.style.setProperty('--fs-scale', String(settings.fontScale || 1));
  }

  /** 把 defaults 中缺失的键补进 obj（保留 obj 已有值）—— 由 core 提供 */
  const deepMerge = CORE.deepMerge;

  /* ========================= 工具 ========================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const uid = CORE.uid;

  /** 给对象设置嵌套路径的值，如 setPath(R,'pe.vitals.temperature','37') */
  function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] === undefined || cur[parts[i]] === null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
  }

  /* ========================= 通用控件 ========================= */

  /**
   * 字段标签行：名称 + 等级角标（必填 / 建议填 / 可留空）。
   * opts.tag = false 可关掉角标（用于明确不需要的场合）。
   */
  function fieldLabel(label, path, opts) {
    const tag = opts && opts.tag === false ? '' : levelTag(path);
    return `<span class="field-label">${esc(label)}${tag}</span>`;
  }

  /** 文本输入 */
  function input(label, path, opts = {}) {
    const val = getPath(R, path) || '';
    const type = opts.type || 'text';
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const hint = opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : '';
    return `<label class="field">
      ${fieldLabel(label, path, opts)}
      <input type="${type}" data-path="${path}" value="${esc(val)}"${ph}
        ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''}>
      ${hint}
    </label>`;
  }

  /** 多行文本 */
  function textarea(label, path, opts = {}) {
    const val = getPath(R, path) || '';
    const rows = opts.rows || 3;
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const hint = opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : '';
    return `<label class="field">
      ${fieldLabel(label, path, opts)}
      <textarea rows="${rows}" data-path="${path}"${ph}>${esc(val)}</textarea>
      ${hint}
    </label>`;
  }

  /** 单选 segmented */
  function seg(label, path, options, opts = {}) {
    const cur = getPath(R, path);
    const btns = options.map(o => {
      const v = typeof o === 'string' ? o : o.value;
      const t = typeof o === 'string' ? o : o.text;
      const on = String(cur) === String(v) ? ' on' : '';
      return `<button type="button" class="seg-btn${on}" data-seg="${path}" data-val="${esc(v)}">${esc(t)}</button>`;
    }).join('');
    return `<div class="field">
      ${fieldLabel(label, path, opts)}
      <div class="seg">${btns}</div>
      ${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}
    </div>`;
  }

  /** 单选下拉，支持 optgroup 分组 */
  function select(label, path, options, opts = {}) {
    const cur = getPath(R, path) || '';
    const isGrouped = options.length && options[0] && options[0].items;

    let optsHtml;
    if (isGrouped) {
      optsHtml = options.map(g => `<optgroup label="${esc(g.label)}">` +
        g.items.map(o => `<option value="${esc(o.value)}"${String(cur) === String(o.value) ? ' selected' : ''}>${esc(o.text)}</option>`).join('') +
        '</optgroup>').join('');
    } else {
      optsHtml = options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const t = typeof o === 'string' ? o : o.text;
        return `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(t)}</option>`;
      }).join('');
    }

    return `<label class="field">
      ${fieldLabel(label, path, opts)}
      <select data-path="${path}">
        ${opts.empty ? `<option value="">${esc(opts.empty)}</option>` : ''}
        ${optsHtml}
      </select>
      ${opts.hint ? `<div class="hint">${esc(opts.hint)}</div>` : ''}
    </label>`;
  }

  /** 科室分组选项 */
  function deptGroups() {
    const groups = [];
    SCHEMA.DEPARTMENTS.forEach(d => {
      let g = groups.find(x => x.label === d.group);
      if (!g) { g = { label: d.group, items: [] }; groups.push(g); }
      g.items.push({ value: d.key, text: d.name });
    });
    return groups;
  }

  /** 复选框组（多选），path 指向对象，如 pmh.diseaseChecks */
  function checks(label, path, options, opts = {}) {
    const obj = getPath(R, path) || {};
    const btns = options.map(o => {
      const v = typeof o === 'string' ? o : o.value;
      const t = typeof o === 'string' ? o : o.text;
      const on = obj[v] ? ' on' : '';
      return `<button type="button" class="chip${on}" data-check="${path}" data-val="${esc(v)}">${esc(t)}</button>`;
    }).join('');
    return `<div class="field">
      <span class="field-label">${esc(label)}</span>
      <div class="chips">${btns}</div>
    </div>`;
  }

  /* ========================= 各步骤渲染 ========================= */

  /**
   * 模板病例卡片。
   *
   * 为什么放在「科室」下面而不是另开一步：
   *   模板是按科室来的，选了科室才知道该列哪些。放同一步省一次翻页，
   *   而且学生本来就要在第一步填科室。
   *
   * 为什么默认折叠：模板是「可选的起点」。一进来就摊开一堆病种，会让人
   *   以为必须先选一个才能往下走。
   */
  function renderTemplates() {
    const deptKey = R.basic.department || 'general';
    const list = (typeof TEMPLATES !== 'undefined' && TEMPLATES.listByDept)
      ? TEMPLATES.listByDept(deptKey)
      : [];

    if (!list.length) {
      // 通用科没有「标准病例」，说清楚比留个空卡片好
      if (deptKey === 'general') {
        return `<details class="tpl-card optional-details" id="tplCard">
          <summary>用模板开始（可选）<span class="tpl-count">先选择科室</span></summary>
          <div class="hint">通用科不提供模板——不同系统的病差别太大，没有一份能通用的初稿。
            选了具体科室后，这里会列出该科室的常见病种。</div>
        </details>`;
      }
      return `<details class="tpl-card optional-details" id="tplCard">
        <summary>用模板开始（可选）<span class="tpl-count">本科室暂无模板</span></summary>
        <div class="hint">目前只做了消化内科的模板，其他科室会陆续加。你可以直接从
          <b>一般项目</b>开始自己写。</div>
      </details>`;
    }

    const items = list.map(t => {
      // 别名里经常把病名本身又写一遍（「急性胆囊炎」的别名里也有「急性胆囊炎」），
      // 名字里已经含的就别再重复列一遍，否则标题后面拖一串自我重复的字。
      const seen = String(t.name || '').toLowerCase();
      const alias = (t.alias || []).filter(a => {
        const k = String(a || '').trim().toLowerCase();
        return k && !seen.includes(k);
      });
      const aliases = alias.length
        ? `<span class="tpl-alias">又叫：${esc(alias.join('、'))}</span>` : '';
      return `<div class="tpl-item-group">
        <div class="tpl-name">${esc(t.name)}</div>
        ${aliases}
        ${t.hint ? `<div class="tpl-hint">${esc(t.hint)}</div>` : ''}
        ${t.source ? `<div class="tpl-source">${esc(t.source.label)}：${esc(t.source.note)}</div>` : ''}
        <div class="btn-row">
          <button class="btn btn-mini" data-tpl="${esc(t.key)}" data-tplmode="example">作为学习范例填入</button>
          <button class="btn btn-mini btn-ghost" data-tpl="${esc(t.key)}" data-tplmode="patient">查看患者录入提纲</button>
        </div>
      </div>`;
    }).join('');

    const last = R.meta && R.meta.lastTemplateFill;
    const lastHtml = last
      ? `<div class="doc-state doc-state-muted" data-doc-state="template-fill">
          <div class="doc-state-title">本次带入：${esc(last.name || last.key)}（${(last.filled || []).length} 项，来源已逐字段标记）</div>
          <div class="doc-state-btns">
            <button type="button" class="btn btn-mini" data-act="viewTemplateFill">查看本次带入内容</button>
            <button type="button" class="btn btn-mini btn-ghost" data-act="undoTemplateFill">撤销本次带入</button>
          </div>
          <div class="hint">撤销只回滚本次带入且此后没被改过的字段；你后来手改的内容会保留。</div>
        </div>`
      : '';

    return `<details class="tpl-card optional-details" id="tplCard">
      <summary>用模板开始（可选）<span class="tpl-count">${list.length} 个病种</span></summary>
      <div class="hint">两种用途分开：<b>学习范例</b>会填入一份典型病例供对照，所有内容都标为「模板来源、未核对」；
        <b>患者录入提纲</b>只列出应该问、应该查的项目，<b>不写入任何患者事实</b>。</div>
      <div class="tpl-list">${items}</div>
      <div class="hint">范例只补空白项；一份病历只能套用一个模板。要换模板，请先新建病历。</div>
      ${lastHtml}
    </details>`;
  }

  function renderBasic() {
    const b = R.basic;
    const hasContact = ['workUnit', 'address', 'phone'].some(k => String(b[k] || '').trim());
    return `
      <div class="card">
        <div class="card-title">基本情况</div>
        ${select('科室', 'basic.department', deptGroups(), {
          hint: '选择科室后，体格检查会自动追加该科室的专科查体项目。'
        })}
        ${renderTemplates()}
        <div class="section-title">一般项目</div>
        ${input('姓名', 'basic.name', { placeholder: '如：张三' })}
        ${seg('性别', 'basic.gender', SCHEMA.GENDERS)}
        <div class="row2">${input('出生日期', 'basic.birthDate', { type: 'date' })}
        ${input('年龄', 'basic.age', {
          placeholder: '58 或 7月 / 3天',
          hint: '成人填数字；婴儿可填「7月」或「3天」。'
        })}</div>
        ${input('民族', 'basic.nationality', { placeholder: '汉族', hint: '不填则病历里写「／」。' })}
        ${seg('婚姻', 'basic.marital', SCHEMA.MARITAL)}
        ${input('职业', 'basic.occupation', { placeholder: '退休 / 农民 / 工人…' })}
        <div class="row2">${input('籍贯', 'basic.nativePlace', { placeholder: '浙江温州' })}
          ${input('出生地', 'basic.birthPlace', { placeholder: '浙江温州' })}</div>
        <details class="optional-details"${hasContact ? ' open' : ''}>
          <summary>工作单位和联系方式</summary>
          ${input('工作单位', 'basic.workUnit', { placeholder: '无 / ××公司' })}
          ${input('通讯地址', 'basic.address', { placeholder: '通讯地址' })}
          ${input('电话号码', 'basic.phone', { placeholder: '联系电话' })}
        </details>
        <div class="row2">${input('病历号 / 住院号', 'basic.recordNo', {
          placeholder: '如：01234567',
        })}
        ${input('床号', 'basic.bedNo', {
          placeholder: '如：32 / 12-3'
        })}</div>
        <div class="row2">${input('入院日期', 'basic.admitDate', { type: 'date' })}
          ${input('入院时间', 'basic.admitTime', { type: 'time' })}</div>
        <div class="row2">${input('记录日期', 'basic.recordDate', { type: 'date' })}
          ${input('记录时间', 'basic.recordTime', { type: 'time' })}</div>
        <div class="hint">日期和时间请按实际情况填写，不自动使用当天日期。</div>
        ${input('病史陈述者', 'basic.informant', {
          placeholder: '如：患者本人；儿科写「母亲」',
          hint: '请按实际陈述者填写；留空不会自动推断。'
        })}
        ${/* 加空选项：schema 里 reliability 的默认值已清空（不能替学生判断病史可靠程度），
             若这里不给空项，下拉框会「看起来选中了可靠」而实际存的是空值。 */ ''}
        ${select('病史可靠程度', 'basic.reliability', SCHEMA.RELIABILITY, {
          empty: '未评估',
          hint: '不选＝没评估，病历里写「／」。'
        })}
        <div class="section-title">主诉 <span class="tag-req">必填</span></div>
        ${textarea('主诉症状', 'basic.chiefComplaint', {
          rows: 2,
          placeholder: '如：发热、咳嗽、咳黄痰3天',
          hint: '只写症状和体征，不写诊断；一般不超过20字。'
        })}
        ${/* 用户要求：时间自己写在主诉里（「反复上腹部疼痛2年」），不要再单独给两个下拉框。
             原来那对「持续时间 + 单位」的控件会把一句话拆成三处，学生写「2年」还得再点一次下拉，
             而且病历正文里「2」和「年」是拼出来的，改起来要找两个框。
             现在主诉正文就是唯一真相：写了多久就写在同一句里。 */ ''}
        <div class="hint">
          持续时间直接写进主诉，例如「<b>反复上腹部疼痛2年</b>」「<b>发热、咳嗽、咳黄痰3天</b>」。
          没有写时长的话，生成时会提醒你补。
        </div>
        <div class="live-preview" id="ccPreview"></div>
      </div>
    `;
  }

  function renderHpi() {
    const h = R.hpi || {};
    const hasDetails = ['cause', 'relief', 'evolution', 'accompanying', 'negativeDiscriminating', 'extra']
      .some(k => String(h[k] || '').trim());
    return `
      <div class="card">
        <div class="card-title">现病史
          <button class="btn-mini" data-act="draftHpi">一键生成初稿</button>
        </div>
        <div class="hint">按提示分句填写，生成的现病史会自动加句号并补主语"患者"。</div>

        ${textarea('起病情况（何时、何种方式起病、有无诱因）', 'hpi.onset', {
          rows: 3,
          placeholder: '如：3天前受凉后出现发热，体温最高39.2℃，伴畏寒'
        })}
        ${textarea('主要症状特点（部位、性质、程度、持续时间、加重缓解因素）', 'hpi.symptoms', {
          rows: 3,
          placeholder: '如：咳嗽呈阵发性连声咳，咳黄色黏痰，量中等，不易咳出'
        })}
        ${textarea('诊治经过（在何处就诊、检查、用药及效果）', 'hpi.treatment', {
          rows: 3,
          placeholder: '如：自服布洛芬后体温可暂时下降，未到医院就诊'
        })}
        ${textarea('一般情况（精神、食欲、睡眠、大小便、体重）', 'hpi.generalCondition', {
          rows: 2,
          placeholder: '如：发病以来精神、食欲、睡眠可，大小便正常，体重无明显变化',
          hint: '留空时不会自动填入正常情况。'
        })}
        <details class="optional-details"${hasDetails ? ' open' : ''}>
          <summary>补充诱因、进展和伴随症状</summary>
          ${input('发病诱因', 'hpi.cause', { placeholder: '如：受凉后 / 无明显诱因' })}
          ${textarea('缓解因素', 'hpi.relief', { rows: 2, placeholder: '如：休息后腹痛稍缓解' })}
          ${textarea('病情进展', 'hpi.evolution', { rows: 2, placeholder: '如：症状逐渐加重' })}
          ${textarea('伴随症状', 'hpi.accompanying', { rows: 2, placeholder: '如：伴胸痛；无咯血' })}
          ${textarea('有鉴别诊断意义的阴性病史', 'hpi.negativeDiscriminating', {
            rows: 2, placeholder: '如：无咯血、盗汗、消瘦', hint: '只填写实际询问过的阴性症状。'
          })}
          ${textarea('其他补充', 'hpi.extra', { rows: 2 })}
        </details>
      </div>
    `;
  }

  function renderRos() {
    const totalPos = SCHEMA.ROS.reduce((n, sys) => {
      const store = R.ros[sys.key] || {};
      return n + sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
    }, 0);
    // 明确标为阴性的症状数（缺陷1：三态里的「问了且阴性」，与「没问」分开计数）
    const totalNeg = SCHEMA.ROS.reduce((n, sys) => {
      const store = R.ros[sys.key] || {};
      return n + sys.symptoms.filter(s => {
        const v = store[s.key] || {};
        return !v.checked && v.negative;
      }).length;
    }, 0);
    const totalSym = SCHEMA.ROS.reduce((n, sys) => n + sys.symptoms.length, 0);

    let html = `
      <div class="card sticky-note">
        <div class="ros-head">
          <div>
            <strong>系统回顾</strong>
            <div class="hint">${/* 旧文案「默认全部为阴性」已经不成立：没勾不等于阴性。
                  现在必须明说「不点就不写」，否则用户会以为留空也没关系（其实会写「／」）。 */ ''}
              问过且没有的症状，点一下变<b>灰</b>记为阴性；有症状的点一下变<b>红</b>记为阳性。
              <b>没点过 = 没问 = 病历里一个字都不写。</b>已标阴性 ${totalNeg}/${totalSym} 项。</div>
          </div>
          <div class="ros-count">已选阳性 <b>${totalPos}</b> 项</div>
        </div>
        <div class="btn-row">
          <button class="btn btn-ghost" data-act="rosAllNegative">全部标记为阴性</button>
          <button class="btn btn-ghost" data-act="rosClearAll">全部清空为未问</button>
          <button class="btn btn-ghost" data-act="rosExpandAll">展开/收起全部</button>
        </div>
        <div class="ros-jump">
          ${SCHEMA.ROS.map((sys, i) => {
            const store = R.ros[sys.key] || {};
            const n = sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
            return `<button class="jump-btn${n ? ' has-pos' : ''}" data-jump="${sys.key}">
              ${esc(sys.name.replace('及其器官', ''))}${n ? `<b>${n}</b>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>
    `;

    SCHEMA.ROS.forEach(sys => {
      const store = R.ros[sys.key] || {};
      const posCount = sys.symptoms.filter(s => (store[s.key] || {}).checked).length;
      const negCount = sys.symptoms.filter(s => {
        const v = store[s.key] || {};
        return !v.checked && v.negative;
      }).length;
      const chips = sys.symptoms.map(sym => {
        const v = store[sym.key] || {};
        // 三态样式：阳性（红，复用既有 .chip-sym.on）、阴性（灰，行内样式）、未问（默认白）
        // 阴性态的样式写成行内是有意的：style.css 不归本文件改，
        // 不新造 .neg 类名，免得与其他人正在改的 CSS 撞车（撞了就是"点了没反应"的死按钮）。
        const cls = v.checked ? ' on' : '';
        const negStyle = (!v.checked && v.negative)
          ? ' style="background:var(--gray-2);border-color:var(--gray-4);color:var(--gray-5);text-decoration:line-through;"'
          : '';
        const mark = v.checked ? ' ✓' : (v.negative ? ' −' : '');
        return `<button type="button" class="chip chip-sym${cls}"${negStyle} data-ros="${sys.key}" data-sym="${sym.key}">
          ${esc(sym.label)}${mark}
        </button>`;
      }).join('');
      // 默认展开含阳性项的系统，其余收起（避免一屏全是标题）
      html += `<details class="card ros-group" id="ros-group-${sys.key}" ${posCount ? 'open' : ''}>
        <summary>
          <span>${esc(sys.name)}</span>
          ${posCount ? `<span class="badge-pos">${posCount}</span>` : ''}
          ${negCount ? `<span class="tag-off" data-negcount="${sys.key}">阴性 ${negCount}</span>` : ''}
        </summary>
        <div class="btn-row">
          <button class="btn btn-ghost btn-sm" data-rosneg="${sys.key}">本系统剩余项全部标为阴性</button>
        </div>
        <div class="chips">${chips}</div>
        <div class="ros-detail" data-ros-detail="${sys.key}"></div>
      </details>`;
    });
    return html;
  }

  /** 系统回顾中某系统的阳性详情输入区 */
  function renderRosDetail(sysKey) {
    const sys = SCHEMA.ROS.find(s => s.key === sysKey);
    if (!sys) return '';
    const store = R.ros[sysKey] || {};
    const positives = sys.symptoms.filter(s => (store[s.key] || {}).checked);
    if (!positives.length) return '';
    return positives.map(sym => {
      const v = store[sym.key] || {};
      return `<div class="ros-item">
        <div class="ros-item-name">${esc(sym.label)}</div>
        <div class="row2">
          <input type="text" data-path="ros.${sysKey}.${sym.key}.time" value="${esc(v.time || '')}"
            placeholder="时间，如：3天前 / 2年">
          <input type="text" data-path="ros.${sysKey}.${sym.key}.detail" value="${esc(v.detail || '')}"
            placeholder="${esc(sym.detail || '补充描述')}">
        </div>
      </div>`;
    }).join('');
  }

  function renderPmh() {
    const p = R.pmh;
    return `
      <div class="card">
        <div class="card-title">平素健康状况</div>
        ${/* 原来 seg 没有空选项，一进页面就默认选中「良好」，于是即便学生没问，
             病历也会生成「既往健康状况：平素良好」。加「未问」空选项后，
             不选就是没问，病历里写「／」而不是替学生下结论。 */ ''}
        ${seg('健康状况', 'pmh.health', [{ value: '', text: '未问' }, '良好', '一般', '较差'], {
          hint: '不选＝没问过，病历里写「／」；选了才写「平素良好」等。'
        })}
        <div class="section-title">既往慢性病</div>
        ${checks('勾选既往疾病（可多选）', 'pmh.diseaseChecks', SCHEMA.COMMON_PMH)}
        ${input('其他疾病', 'pmh.diseaseOther', { placeholder: '补充未列出的疾病' })}
        ${textarea('疾病详情（病程、治疗、控制情况）', 'pmh.diseaseDetail', {
          rows: 3,
          placeholder: '如：高血压病史 5 年，长期口服氨氯地平 5mg qd，血压控制在 130/80mmHg 左右',
          hint: '填写此项后会直接采用这里的文字，替代上面的勾选描述。'
        })}
        ${textarea('长期用药史', 'pmh.longTermMeds', {
          rows: 2,
          placeholder: '如：长期口服氨氯地平 5mg qd（3 年）',
          hint: '可补充实际长期使用的药名和用法。'
        })}
        ${textarea('与本病无关但仍需治疗的其他疾病', 'pmh.otherTreatDiseases', {
          rows: 2,
          placeholder: '如：慢性乙型病毒性肝炎（定期复查）',
          hint: '填写后会写入现病史结尾。'
        })}
        <div class="section-title">其他既往史</div>
        ${textarea('传染病史', 'pmh.infection', {
          rows: 2, placeholder: '如：否认肝炎、结核等传染病史'
        })}
        ${textarea('手术史', 'pmh.surgery', { rows: 2, placeholder: '如：2015年阑尾切除术' })}
        ${textarea('外伤史', 'pmh.trauma', { rows: 2, placeholder: '如：否认外伤史' })}
        ${textarea('输血史', 'pmh.transfusion', { rows: 2, placeholder: '如：否认输血史' })}
        ${textarea('中毒史', 'pmh.poisoning', { rows: 2, placeholder: '如：否认中毒史' })}
        ${textarea('预防接种史', 'pmh.vaccine', { rows: 2, placeholder: '如：按计划预防接种' })}
        ${textarea('与本病相关病史', 'pmh.relatedHistory', {
          rows: 2,
          placeholder: '如：既往有类似发作史（3年前同样出现右下腹痛，保守治疗好转）',
          hint: '和本次发病直接相关的既往情况，例如反复发作、既往同样症状、相关手术史。'
        })}
        <div class="section-title">过敏史</div>
        ${/* 同 pmh.health：原来只有「无/有」两态，默认停在「无」，
             等于工具替学生否认了过敏史。加空选项表示「没问」。 */ ''}
        ${seg('有无过敏史', 'pmh.allergy', [{ value: '', text: '未问' }, '无', '有'], {
          hint: '不选＝没问过，病历里写「／」；点「无」才会写成「否认食物、药物过敏史」。'
        })}
        ${p.allergy === '有' ? `
          ${checks('过敏原', 'pmh.allergenChecks', SCHEMA.ALLERGENS)}
          ${input('其他过敏原', 'pmh.allergenOther')}
          ${checks('过敏反应表现', 'pmh.allergenReactionChecks', SCHEMA.ALLERGY_REACTIONS)}
          ${input('反应描述', 'pmh.allergyReaction', {
            placeholder: '如：全身皮疹伴瘙痒',
            hint: '勾了上面的反应表现时，生成的病历会写成「表现为皮疹、瘙痒」；此处手写描述优先，可与勾选并用或只用其一。'
          })}
        ` : ''}
        <div class="section-title">其他</div>
        ${textarea('其他需补充的既往史', 'pmh.special', {
          rows: 2, placeholder: '如：否认疫区接触史'
        })}
      </div>
    `;
  }

  function renderPersonal() {
    // 母孕史/出生史/喂养史/生长发育史是儿科病历的项目。成人默认收起，
    // 免得学生填了半天才发现这些东西根本不该出现在成人病历里；
    // 老存档里已有内容时自动展开，不能让既有记录看不见。
    const p = R.personal || {};
    const hasGrowth = ['maternal', 'birth', 'feeding', 'growth'].some(k => String(p[k] || '').trim());
    const ageNum = Number(String(R.basic.age || '').match(/\d+/));
    const isChild = Number.isFinite(ageNum) && ageNum > 0 && ageNum < 14;
    const growthOpen = hasGrowth || isChild;
    const psychOpen = R.basic.department === 'psychiatry' || !!(p.premorbidPersonality || p.stressEvent);
    return `
      <div class="card">
      <div class="card-title">个人史</div>
      <details class="optional-details"${growthOpen ? ' open' : ''}>
        <summary>出生与成长 <span class="muted">儿科填写，成人一般不写</span></summary>
        ${textarea('母孕史', 'personal.maternal', {
          rows: 2,
          placeholder: '如：母孕期体健，否认重大感染病史及特殊服药史，否认毒物、放射线接触史',
          hint: '母亲怀孕期间的健康与用药情况。成人病历留空，病历里不会出现这一行。'
        })}
        ${textarea('出生史', 'personal.birth', {
          rows: 2,
          placeholder: '如：G2P2，足月剖宫产，出生体重4.2kg，无产伤、窒息史',
          hint: '出生方式、出生体重、有无产伤或窒息。成人留空即可。'
        })}
        ${textarea('喂养史', 'personal.feeding', {
          rows: 2,
          placeholder: '如：生后人工喂养至今，6个月始添加辅食',
          hint: '儿科病历要求写明喂养方式与辅食添加时间。成人可留空。'
        })}
        ${textarea('生长发育史', 'personal.growth', {
          rows: 2,
          placeholder: '如：3个月会抬头，6个月会坐，生长发育与正常同龄儿相同',
          hint: '儿科病历要求写明与同龄儿的比较。成人可留空。'
        })}
      </details>

        <div class="section-title">居住与接触</div>
        ${input('长期居住地', 'personal.residence', { placeholder: '温州' })}
        ${input('近期旅行/居住史', 'personal.travel', { placeholder: '近1月无外地旅居史' })}
        <div class="section-title">吸烟与饮酒</div>
        ${/* 加「未问」空选项：原默认停在「无」，空记录会凭空输出「吸烟史：无」。 */ ''}
        ${seg('吸烟', 'personal.smoking', [{ value: '', text: '未问' }, '无', '有', '已戒'], {
          hint: '不选＝没问过，病历里写「／」。'
        })}
        ${input('吸烟情况', 'personal.smokingAmount', {
          placeholder: '如：吸烟30年，每日约20支，未戒烟'
        })}
        ${seg('饮酒', 'personal.drinking', [{ value: '', text: '未问' }, '无', '有', '已戒'], {
          hint: '不选＝没问过，病历里写「／」。'
        })}
        ${input('饮酒情况', 'personal.drinkingAmount', {
          placeholder: '如：饮白酒约2两/日，已戒酒5年'
        })}
        <div class="section-title">接触史</div>
        ${/* 《诊断学》第10版 个人史：「职业与工作条件及有无工业毒物、粉尘、
             放射性物质接触史，有无冶游史」——这两项教材点名要求，此前全项目缺失。 */ ''}
        ${textarea('职业与工作条件', 'personal.occupationEnv', {
          rows: 2,
          placeholder: '如：从事煤矿井下作业12年，长期接触粉尘；否认放射性物质接触史',
          hint: '教材要求记录工作环境及有无工业毒物、粉尘、放射性物质接触史。与「一般项目」里的职业名称不同；不填则病历里写「／」。'
        })}
        ${textarea('冶游史', 'personal.sexualHistory', {
          rows: 2,
          placeholder: '如：否认冶游史',
          hint: '冶游史即不洁性接触史。敏感项，不填则病历里写「／」，工具不会替你写「否认」。'
        })}
        ${textarea('毒物、粉尘、放射性物质接触史', 'personal.drugs', {
          rows: 2, placeholder: '如：否认毒物、粉尘及放射性物质接触史'
        })}
        ${textarea('疫区、疫水、动物接触史', 'personal.environment', { rows: 2 })}
        ${textarea('其他生活习惯', 'personal.habits', { rows: 2 })}
      <details class="optional-details"${psychOpen ? ' open' : ''}>
        <summary>精神科相关</summary>
        ${/* 精神科病史采集必问「病前性格」和「发病前有没有遇到什么事」。
             放到个人史里而不是单开一步，是因为综合医院病历根本不用这两栏，
             留空就不输出（generator 的 buildPersonal 里判了 stripTail）。 */ ''}
        ${textarea('病前性格', 'personal.premorbidPersonality', {
          rows: 2,
          placeholder: '如：病前性格内向，少与人交往，做事认真，情绪易波动',
          hint: '精神科必填；其它科室留空即可，病历里不会出现这一行。'
        })}
        ${textarea('发病前应激事件', 'personal.stressEvent', {
          rows: 2,
          placeholder: '如：3个月前因工作调动与同事发生冲突后逐渐出现情绪低落',
          hint: '精神科必填；其它科室留空即可。'
        })}
      </details>
      </div>
    `;
  }

  function marriageConflictHtml() {
    const c = CORE.marriageConflict(R);
    if (!c) return '';
    const btn = v => `<button type="button" class="btn btn-mini" data-act="resolveMarriage" data-value="${esc(v)}">采用「${esc(v || '未填')}」</button>`;
    return `<div class="doc-state doc-state-stale" data-doc-state="marriage-conflict">
      <div class="doc-state-title">旧存档里婚姻状态有两处不同的值，需要你选一个</div>
      <div class="hint">基本情况：${esc(c.basicValue || '未填')}；婚姻史：${esc(c.marriageValue || '未填')}。两个原值都已保留，选择前不会静默舍弃。</div>
      <div class="doc-state-btns">${btn(c.basicValue)}${btn(c.marriageValue)}</div>
    </div>`;
  }

  function renderMarriage() {
    const b = R.basic;
    const isFemale = b.gender === '女';
    return `
      <div class="card">
        <div class="card-title">婚姻史</div>
        ${/* 缺陷2第3条：婚姻史以前没填就整节消失，validate 里也没有任何检查项，
              属于完全静默的丢失。schema 的 marriage.status 本来默认就是 ''，
              但 seg 没有空选项时界面会"看起来"一个都没选中，用户以为选过了。
              加「未填」空选项，选中态与数据一致，点一下也能主动清空。 */ ''}
        ${marriageConflictHtml()}
        ${seg('婚姻状况', 'basic.marital', [{ value: '', text: '未填' }, ...SCHEMA.MARITAL], {
          hint: '婚姻状态只有一个来源：这里与「基本情况」是同一个字段，改任一处另一处立即一致。不选＝没问过。'
        })}
        ${input('结婚年龄', 'marriage.age', { type: 'number', inputmode: 'numeric', placeholder: '25' })}
        ${input('配偶健康状况', 'marriage.spouseHealth', { placeholder: '如：配偶体健' })}
        ${input('性生活情况', 'marriage.sexLife', {
          placeholder: '如：正常',
          hint: '《诊断学》婚姻史要求记录性生活情况与夫妻关系；属于隐私，不填就不会写进病历。'
        })}
        ${input('夫妻关系', 'marriage.relation', { placeholder: '如：和睦' })}
      </div>

      ${isFemale ? `
      <div class="card">
        <div class="card-title">月经史</div>
        ${seg('月经情况', 'menstruation.applicable', [
          { value: '', text: '未选' }, { value: '有', text: '有月经' }, { value: '无', text: '已绝经' }
        ])}
        ${textarea('月经史描述', 'menstruation.extra', {
          rows: 2,
          placeholder: '如：14岁初潮，周期28-30天，经期5天，经量中等，无痛经，末次月经2026-09-28',
          hint: '可直接写整句，或使用下面的结构化字段。'
        })}
        <details class="mini-details">
          <summary>结构化填写</summary>
          <div class="row2">
            ${input('初潮年龄', 'menstruation.age', { type: 'number', inputmode: 'numeric' })}
            ${input('周期（天）', 'menstruation.cycle', { type: 'number', inputmode: 'numeric' })}
          </div>
          <div class="row2">
            ${input('经期（天）', 'menstruation.duration', { type: 'number', inputmode: 'numeric' })}
            ${input('经量', 'menstruation.quantity', { placeholder: '中等' })}
          </div>
          ${/* 《诊断学》第10版 月经史：「并记录月经量、颜色，有无血块、痛经、白带等情况」。
               经量此前已有，颜色/血块/白带三项缺失，采集不到也就写不出来。 */ ''}
          <div class="row2">
            ${input('经血颜色', 'menstruation.color', { placeholder: '暗红' })}
            ${input('血块', 'menstruation.clot', { placeholder: '无血块' })}
          </div>
          ${input('白带', 'menstruation.leukorrhea', { placeholder: '量中，色白，无异味' })}
          <div class="row2">
            ${input('绝经年龄', 'menstruation.menopauseAge', { type: 'number', inputmode: 'numeric' })}
            ${input('末次月经', 'menstruation.lmp', { placeholder: '2026-09-28' })}
          </div>
          ${/* 原来「痛经」只有无/有两态且默认「无」，空记录会凭空输出「无痛经。」。
               加「未问」表示没问过，此时病历里不写痛经。 */ ''}
          ${seg('痛经', 'menstruation.dysmenorrhea', [{ value: '', text: '未问' }, '无', '有'], {
            hint: '不选＝没问过，病历里不出现「痛经」字样。'
          })}
        </details>
      </div>

      <div class="card">
        <div class="card-title">生育史</div>
        <div class="hint">按《诊断学》要求写成「足月分娩数-早产数-流产或人流数-存活数」，四项填任意一项即用此格式；一项都不填则回退到「孕次/产次」写法。</div>
        <div class="row2">
          ${input('足月分娩数', 'childbirth.fullTerm', { type: 'number', inputmode: 'numeric', placeholder: '1' })}
          ${input('早产数', 'childbirth.premature', { type: 'number', inputmode: 'numeric', placeholder: '0' })}
        </div>
        <div class="row2">
          ${input('流产或人流数', 'childbirth.abortion', { type: 'number', inputmode: 'numeric', placeholder: '0' })}
          ${input('存活数', 'childbirth.alive', { type: 'number', inputmode: 'numeric', placeholder: '1' })}
        </div>
        <details class="mini-details">
          <summary>其他生育信息</summary>
          <div class="row2">
            ${input('孕次', 'childbirth.gravida', { type: 'number', inputmode: 'numeric' })}
            ${input('产次', 'childbirth.para', { type: 'number', inputmode: 'numeric' })}
          </div>
          ${input('末次分娩', 'childbirth.lastBirth', { placeholder: '2020年顺产一子' })}
          ${textarea('分娩及子女情况', 'childbirth.details', { rows: 2, placeholder: '如：顺产1子，体健' })}
        </details>
        ${input('避孕措施', 'childbirth.contraception', { placeholder: '如：宫内节育器 / 无' })}
      </div>
      ` : `
      <div class="card">
        <div class="card-title">生育史（男性患者可选填）</div>
        <div class="row2">
          ${input('子女数', 'childbirth.gravida', { type: 'number', inputmode: 'numeric', placeholder: '留空则不显示' })}
          ${input('子女健康状况', 'childbirth.details', { placeholder: '如：子女体健' })}
        </div>
      </div>
      `}
    `;
  }

  function renderFamily() {
    return `
      <div class="card">
        <div class="card-title">家族史</div>
        ${checks('家族中患有的疾病（可多选）', 'family.diseaseChecks', SCHEMA.FAMILY_DISEASES)}
        ${textarea('父母、兄弟姐妹健康状况', 'family.deceased', {
          rows: 2, placeholder: '如：父母健在，兄弟1人均体健；如已死亡，写死亡原因及年龄'
        })}
        ${textarea('与本病相似的病情', 'family.similarDisease', {
          rows: 2,
          placeholder: '如：父亲患高血压，母亲患2型糖尿病；或写「家族中无类似疾病患者」',
          hint: '手写内容优先；未询问时可留空。'
        })}
        ${textarea('家族传染病史', 'family.infectionHistory', {
          rows: 2,
          placeholder: '如：否认结核、肝炎、性病等传染性疾病史',
          hint: '《诊断学》家族史三个问题之一，与遗传性疾病分开记录。留空则写「／」，不替你写「否认」。'
        })}
        ${textarea('两系三代遗传性疾病史', 'family.threeGeneration', {
          rows: 2,
          placeholder: '留空则默认：两系三代否认遗传性疾病史',
          hint: '按实际询问范围填写。'
        })}
        ${textarea('其他补充', 'family.other', {
          rows: 2, placeholder: '如：否认家族性遗传病及传染病史'
        })}
      </div>
    `;
  }

  function renderPe() {
    const deptKey = R.basic.department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];

    let html = `
      <div class="card sticky-note">
        <div><strong>体格检查</strong></div>
        <div class="hint">
          <b>勾了才算查过。</b>没勾的项目＝本次没做，病历里不会出现，也不会替你写「正常」。
          常规查体项目，可以用每张卡片里的「全选」，或点「常用描述」直接选一句（会自动勾上）。
          生命体征没填的项，病历里写「／」。
        </div>
      </div>
      <div class="card">
        <div class="card-title">生命体征</div>
        <div class="grid3">
          ${SCHEMA.VITALS.filter(v => !v.dept || v.dept === deptKey).map(v => `
            <label class="vital">
              <span class="vital-label">${esc(v.label)}</span>
              <input type="number" step="0.1" inputmode="decimal"
                data-path="pe.vitals.${v.key}" value="${esc(R.pe.vitals[v.key] || '')}"
                data-min="${v.min === undefined ? '' : v.min}"
                data-max="${v.max === undefined ? '' : v.max}"
                data-vlabel="${esc(v.label)}"
                placeholder="${esc(v.placeholder || '')}">
              <span class="vital-unit">${esc(v.unit)}</span>
            </label>
          `).join('')}
        </div>
        <div class="btn-row" style="margin-top:10px">
          <button class="btn btn-ghost" data-act="fillVitalsNormal">填入正常值</button>
        </div>
        <div class="hint">这是示例数值，不是实测结果；请按实际测量值逐项修改。</div>
        ${vitalsExample ? `<div class="doc-state doc-state-muted" data-doc-state="vitals-example">
          <div class="doc-state-title">参考示例（未写入病历）</div>
          <div class="hint">体温 ${esc(vitalsExample.temperature)} ℃、脉搏 ${esc(vitalsExample.pulse)} 次/分、呼吸 ${esc(vitalsExample.respiration)} 次/分、血压 ${esc(vitalsExample.sbp)}/${esc(vitalsExample.dbp)} mmHg</div>
        </div>` : ''}
        <div class="live-preview" id="bmiPreview"></div>
        <div class="ros-jump pe-jump">
          ${SCHEMA.PE_COMMON.map(g => `<button class="jump-btn" data-jump="pe-${g.key}">${esc(g.name)}</button>`).join('')}
          ${(dept.special || []).map(sp => `<button class="jump-btn has-pos" data-jump="pe-special_${sp}">${esc(SCHEMA.PE_SPECIAL[sp].name)}</button>`).join('')}
        </div>
      </div>

      ${renderFocusPE(deptKey, dept)}
    `;

    // 通用查体
    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      if (!items.length) return;
      const itemHtml = items.map(it => peItemHtml(group.key, group.key, it)).join('');
      html += peGroupCard({
        id: `pe-${group.key}`,
        name: group.name,
        groupKey: group.key,
        items,
        itemHtml,
        extra: ''
      });
    });

    // 专科查体
    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      const storeKey = 'special_' + spKey;
      const itemHtml = sp.items.map(it => peItemHtml(storeKey, storeKey, it)).join('');
      html += peGroupCard({
        id: `pe-special_${spKey}`,
        name: sp.name,
        groupKey: storeKey,
        items: sp.items,
        itemHtml,
        extra: '<span class="tag-dept">本科室</span>',
        cls: ' pe-special'
      });
    });

    return html;
  }

  /**
   * 勾选制的核心交互文案：一个查体项要不要写进病历，由学生说了算。
   *
   * ⚠️ 本轮语义变更（缺陷1第4条）：**通用查体也改成默认不勾。**
   * 旧设计是「通用查体每个病人都做 → 默认勾上，留空自动补正常描述」，
   * 结果空记录直接生成「发育正常，营养中等，神志清楚…双肺呼吸音清…腹平软」整段正常描述，
   * 学生一眼都没看过病人，工具已经替他写完了查体。
   * 现在统一规则：**勾了才算查过，没勾＝本次没做＝病历里不出现**。
   * 判定逻辑的唯一实现是 SCHEMA.peChecked（那里也已删掉「有默认描述就算已勾」那一级），
   * 这里只负责呈现。
   */
  /**
   * 查体项的核对状态必须和「实际会输出的文字」绑定：
   * 手填就用填入值，系统默认就用默认描述，内容一变核对即失效。
   */
  function peReviewValid(path, shownText) {
    const st = CORE.fieldState(R, path);
    return !!(st.reviewed && st.reviewedValueHash === CORE.fingerprint(String(shownText || '')));
  }

  function peItemHtml(groupKey, containerKey, it) {
    const cur = (R.pe[containerKey] || {})[it.key];
    const val = cur !== undefined && cur !== null && String(cur) !== '' ? String(cur) : '';
    const checked = SCHEMA.peChecked(R, groupKey, it.key);
    const normalText = SCHEMA.peNormalText(it);
    // 未勾选时**不预填**正常描述，输入框留空，只在 placeholder 里给提示。
    // 原来无条件预填（shown = val || normalText）会造成两个问题：
    //   ①界面上看着像"已经写了查体结果"，其实记录是空的；
    //   ②学生误以为空白框里那行字是自己写的，直接生成。
    // 已经手写的值（val）无论勾没勾都照常显示，不能把用户写过的东西藏起来。
    const shown = val || (checked ? normalText : '');
    // 四种状态：
    //   off     —— 未勾选，本次没查，病历里完全不出现这一项
    //   filled  —— 勾了且自己填了
    //   default —— 勾了但没填，生成时自动补规范正常描述
    //   blank   —— 勾了但没默认也没正常描述，必须自己填
    const state = !checked ? 'off' : (val ? 'filled' : (normalText ? 'default' : 'blank'));
    const badge = state === 'off'
      ? '<span class="tag-off">未查</span>'
      : (state === 'filled'
        ? '<span class="tag-done">已填</span>'
        : (state === 'default'
          ? '<span class="tag-auto">系统默认</span>'
          : '<span class="tag-req">需填</span>'));
    const quick = (it.options || []).map(o =>
      `<button type="button" class="chip small${shown === o ? ' on' : ''}"
        data-pequick="${containerKey}" data-pekey="${it.key}" data-val="${esc(o)}">${esc(o)}</button>`
    ).join('');
    const hint = state === 'default'
      ? '已勾选但没填具体所见，生成时自动写这句正常描述。'
      : (state === 'blank' ? '这一项没有默认描述，留空则病历里不会出现这句。' : '');
    const reviewPath = `pe.${containerKey}.${it.key}`;
    const reviewed = state !== 'off' && !!shown && peReviewValid(reviewPath, shown);
    const reviewBadge = state === 'off' || !shown
      ? ''
      : (reviewed
        ? '<span class="tag-done tag-review">已核对</span>'
        : `<button type="button" class="chip small tag-review-btn" data-act="confirmPe" data-path="${esc(reviewPath)}">待核对·确认</button>`);
    return `<div class="pe-item is-${state}" data-pe-group="${esc(groupKey)}" data-pe-key="${esc(it.key)}">
      <div class="pe-label">
        <label class="pe-check"><input type="checkbox" data-pecheck="${esc(groupKey)}" data-pekey="${esc(it.key)}"${checked ? ' checked' : ''}><span>本次检查</span></label>
        ${esc(it.label)}${badge}${reviewBadge}
      </div>
      <div class="pe-input">
        <textarea rows="2" class="pe-text" data-path="pe.${containerKey}.${it.key}"
          placeholder="${esc(normalText || '填写检查所见')}">${esc(shown)}</textarea>
        <div class="hint pe-hint"${hint ? '' : ' hidden'}>${hint}</div>
        <details class="pe-opts">
          <summary>常用描述</summary>
          <div class="chips">${quick}</div>
        </details>
      </div>
    </div>`;
  }

  /** 一张查体卡片：标题 + 「已勾 N/M」+ 全选/全不选 + 条目列表 */
  function peGroupCard(opt) {
    const items = opt.items || [];
    const on = items.filter(it => SCHEMA.peChecked(R, opt.groupKey, it.key)).length;
    const store = (R.pe[opt.containerKey || opt.groupKey] || {});
    const open = Object.values(store).some(v => v) || (opt.cls || '').includes('pe-special');
    return `<details class="card pe-group${opt.cls || ''}" id="${opt.id}" ${open ? 'open' : ''}>
      <summary>${esc(opt.name)}${opt.extra || ''}<span class="pe-count" data-count-for="${esc(opt.groupKey)}">已勾 ${on}/${items.length}</span></summary>
      <div class="btn-row pe-tools">
        <button type="button" class="btn btn-ghost btn-sm" data-pall="1" data-pgroup="${esc(opt.groupKey)}">全选</button>
        <button type="button" class="btn btn-ghost btn-sm" data-pall="0" data-pgroup="${esc(opt.groupKey)}">全不选</button>
        <button type="button" class="btn btn-ghost btn-sm" data-act="confirmAllPe" data-group="${esc(opt.groupKey)}" data-container="${esc(opt.containerKey || opt.groupKey)}">确认本组描述</button>
      </div>
      <div class="pe-body">${opt.itemHtml}</div>
    </details>`;
  }

  /**
   * 重点查体（评分表第 4 页 15 分）。
   *
   * 「会不会挑重点」是这一项考的东西：从已填的查体项里挑 3 项左右与主诉/主要
   * 阳性体征直接相关的，再写一句为什么查这些。keys 存 '组.key' 引用，
   * 由 generator.buildFocusPE 解析成「组名：项目名 + 描述」。
   */
  function renderFocusPE(deptKey, dept) {
    const f = (R.focusPE && typeof R.focusPE === 'object') ? R.focusPE : {};
    const keys = Array.isArray(f.keys) ? f.keys : [];
    const options = [];
    SCHEMA.PE_COMMON.forEach(g => {
      const items = (g.items || []).filter(it => !it.depts || it.depts.includes(deptKey));
      items.forEach(it => options.push({ ref: `${g.key}.${it.key}`, label: `${g.name} · ${it.label}` }));
    });
    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      (sp.items || []).forEach(it => options.push({ ref: `special_${spKey}.${it.key}`, label: `${sp.name} · ${it.label}` }));
    });

    // 只显示仍属于当前科室的项。
    // 切科室后 focusPE.keys 里可能还留着上一个科室的专科项（'special_digestive.giTenderness'），
    // 那些项在当前科室的 options 里找不到，以前会 fallback 成裸 key 直接印在界面上；
    // 而生成器也不会把它们写进病历（见 generator.buildFocusPE），两处口径必须一致：
    // 界面上看不见 = 病历里不出现。
    const picked = keys.filter(ref => options.some(o => o.ref === ref)).map(ref => {
      const o = options.find(x => x.ref === ref);
      return `<span class="focus-tag">${esc(o.label)}
        <button type="button" class="focus-x" data-focusdel="${esc(ref)}">×</button></span>`;
    }).join('');
    const liveKeys = keys.filter(ref => options.some(o => o.ref === ref));
    const rest = options.filter(o => !liveKeys.includes(o.ref));

    return `
      <details class="card pe-group" id="pe-focus" ${liveKeys.length || f.note ? 'open' : ''}>
        <summary>重点查体</summary>
        <div class="pe-body">
          <div class="hint">可标记与本次病情相关的查体，并补充说明。</div>
          <div class="focus-picked">${picked || '<span class="muted">还没有标记重点查体部位</span>'}</div>
          ${rest.length ? `
          <details class="mini-details" style="margin-top:8px">
            <summary>从查体项中添加（已标记 ${liveKeys.length} 项）</summary>
            <div class="chips focus-chips">
              ${rest.map(o => `<button type="button" class="chip small" data-focusadd="${esc(o.ref)}">${esc(o.label)}</button>`).join('')}
            </div>
          </details>` : ''}
          ${textarea('为什么查这些（与诊断思路 / 鉴别关键点的关系）', 'focusPE.note', {
            rows: 2,
            placeholder: '如：患者以发热咳嗽为主诉，重点查双肺听诊有无啰音、有无胸腔积液征象，以判断是否合并肺炎旁积液'
          })}
        </div>
      </details>
    `;
  }

  /**
   * 辅助检查录入。
   *
   * 《诊断学》第10版 辅助检查：「应分类按检查时间顺序记录检查结果，如系在其他
   * 医疗机构所做检查，应当写明该机构名称及检查号」。原先每项只有「项目名 + 结果」
   * 两个输入框，外院机构名和检查号无处可填，日期也没有，生成时只能按录入顺序排。
   * 本轮每项补 date / hospital / no 三个输入框。
   *
   * 布局注意：`.aux-row` 在 style.css 里是 flex 且写了 `input:first-child` /
   * `input:nth-child(2)` 的宽度比例，往里平铺新输入框会打乱这两条规则、412px 下溢出。
   * 所以新增的输入框一律放到 `.aux-row` 之外的 `.row2` 或独立行里，不动既有结构。
   */
  function renderAux() {
    const items = (R.auxiliary && R.auxiliary.items) || [{ name: '', result: '' }];
    const rows = items.map((it, i) => `
      <div class="aux-item">
        <div class="aux-row">
          <input type="text" data-aux="name" data-idx="${i}" value="${esc(it.name || '')}"
            placeholder="检查项目，如：血常规">
          <input type="text" data-aux="result" data-idx="${i}" value="${esc(it.result || '')}"
            placeholder="结果">
          <button type="button" class="btn-del" data-auxdel="${i}">×</button>
        </div>
        <div class="row2">
          <input type="date" data-aux="date" data-idx="${i}" value="${esc(it.date || '')}"
            title="检查日期：填了会按日期升序排列">
          <input type="text" data-aux="hospital" data-idx="${i}" value="${esc(it.hospital || '')}"
            placeholder="检查机构（外院必填）">
        </div>
        <input type="text" data-aux="no" data-idx="${i}" value="${esc(it.no || '')}"
          placeholder="检查号（外院填写）">
      </div>
    `).join('');
    return `
      <div class="card">
        <div class="card-title">辅助检查</div>
        <div class="hint">填写本次就诊已有的检查结果；没有就留空，生成时这一节写「暂缺」。填了日期会按时间先后排列，在外院做的检查请写明机构名称与检查号。</div>
        <div id="auxList">${rows}</div>
        <button class="btn btn-ghost" data-act="addAux">+ 添加一项</button>
      </div>
    `;
  }

  /* ---------------------- 文书状态（摘要 / SOAP / 出院） ---------------------- */

  const DOC_LABEL = {
    empty: '尚未生成', fresh: '与当前资料一致', stale: '需更新',
    manual: '人工修改', 'manual-stale': '人工修改，资料已变化',
    reviewed: '已核对', 'reviewed-stale': '已核对，但资料已变化',
    legacy: '旧存档，来源不明'
  };

  function docStateOf(kind, section) {
    try { return CORE.documentState(R, kind, section); } catch (e) { return null; }
  }

  function docStateClass(st) {
    if (!st) return 'unknown';
    if (/(^|-)stale$/.test(st.state)) return 'stale';
    if (st.state === 'reviewed' || st.state === 'fresh') return 'ok';
    if (st.state === 'manual') return 'manual';
    return 'muted';
  }

  function changedText(st) {
    const names = { identity: '身份与主诉', hpi: '现病史', pe: '体格检查', aux: '辅助检查', diagnoses: '诊断' };
    const list = (st && st.changed) || [];
    return list.map(k => names[k] || k).join('、');
  }

  /**
   * 摘要状态面板：显示现有文字、最新草稿、哪类资料变了，并给出
   * 「采用新草稿 / 保留原文并核对 / 撤销」三个明确动作。
   * 不自动覆盖人工摘要。
   */
  function summaryStateHtml() {
    const st = docStateOf('summary');
    if (!st) return '';
    const draft = GENERATOR.draftSummary(R);
    const stale = /(^|-)stale$/.test(st.state);
    const empty = st.state === 'empty';
    const changed = changedText(st);
    const tone = docStateClass(st);
    if (empty) {
      return `<div class="doc-state doc-state-muted" data-doc-state="summary">
        <div class="doc-state-title">摘要为空：生成时实时使用自动草稿，未写入存档。</div>
      </div>`;
    }
    return `<div class="doc-state doc-state-${tone}" data-doc-state="summary">
      <div class="doc-state-title">摘要状态：${esc(DOC_LABEL[st.state] || st.state)}${stale && changed ? `（${esc(changed)}已变化）` : ''}</div>
      ${stale ? `<details class="doc-diff"><summary>对比最新自动草稿</summary>
        <div class="doc-diff-label">现有摘要</div><pre class="doc-pre">${esc(st.text)}</pre>
        <div class="doc-diff-label">最新自动草稿</div><pre class="doc-pre">${esc(draft)}</pre>
      </details>` : ''}
      <div class="doc-state-btns">
        <button type="button" class="btn btn-mini" data-act="updateSummary">采用新草稿</button>
        <button type="button" class="btn btn-mini btn-ghost" data-act="keepSummary">保留原文并标记已核对</button>
        <button type="button" class="btn btn-mini btn-ghost" data-act="undoDoc">撤销上一步</button>
      </div>
      <div class="hint">「保留原文」只确认当前文字，不会因为资料变化自动改写；撤销历史只在本机内存，刷新后失效。</div>
    </div>`;
  }

  const SOAP_SEG_DRAFT = {
    s: r => GENERATOR.draftCaseSummary(r),
    oPe: r => GENERATOR.draftObjectivePE(r),
    oAux: r => GENERATOR.draftObjectiveAux(r),
    basis: r => GENERATOR.buildBasisSection(r)
  };

  /** 单个 SOAP 段落的状态条：只提示本段，更新也只动本段 */
  function soapStateHtml(seg, title) {
    const st = docStateOf('firstCourse', seg);
    if (!st) return '';
    if (st.state === 'empty') {
      return `<div class="doc-state doc-state-muted" data-doc-state="fc-${seg}">
        <div class="doc-state-title">${title}：留空时按当前资料自动生成，未写入存档。</div>
      </div>`;
    }
    const stale = /(^|-)stale$/.test(st.state);
    const changed = changedText(st);
    const draft = SOAP_SEG_DRAFT[seg] ? SOAP_SEG_DRAFT[seg](R) : '';
    return `<div class="doc-state doc-state-${docStateClass(st)}" data-doc-state="fc-${seg}">
      <div class="doc-state-title">${title}：${esc(DOC_LABEL[st.state] || st.state)}${stale && changed ? `（${esc(changed)}已变化）` : ''}</div>
      ${stale ? `<details class="doc-diff"><summary>对比最新草稿</summary>
        <div class="doc-diff-label">现有文字</div><pre class="doc-pre">${esc(st.text)}</pre>
        <div class="doc-diff-label">最新草稿</div><pre class="doc-pre">${esc(draft)}</pre>
      </details>` : ''}
      <div class="doc-state-btns">
        <button type="button" class="btn btn-mini" data-act="updateSoapSeg" data-seg="${seg}">更新此段</button>
        <button type="button" class="btn btn-mini btn-ghost" data-act="reviewSoapSeg" data-seg="${seg}">标记已核对</button>
      </div>
    </div>`;
  }

  function dischargeDxStateHtml() {
    const st = docStateOf('discharge', 'diagnoses');
    if (!st) return '';
    const d = R.discharge || {};
    const list = Array.isArray(d.diagnoses) ? d.diagnoses : [];
    const confirmed = !!d.diagnosesConfirmed;
    if (!list.length) {
      return `<div class="doc-state doc-state-muted" data-doc-state="discharge-dx">
        <div class="doc-state-title">出院诊断：待填写。不会自动沿用初步诊断。</div>
        <div class="doc-state-btns">
          <button type="button" class="btn btn-mini" data-act="importDischargeDx">从初步诊断带入</button>
        </div>
      </div>`;
    }
    const tone = confirmed ? 'ok' : 'stale';
    return `<div class="doc-state doc-state-${tone}" data-doc-state="discharge-dx">
      <div class="doc-state-title">出院诊断：${confirmed ? '已确认' : '已填写，尚未确认'}</div>
      ${st.state === 'legacy' ? '<div class="hint">这份出院诊断来自旧存档，来源无法判断，请核对。</div>' : ''}
      <div class="doc-state-btns">
        <button type="button" class="btn btn-mini" data-act="confirmDischargeDx">确认出院诊断</button>
        <button type="button" class="btn btn-mini btn-ghost" data-act="importDischargeDx">从初步诊断重新带入</button>
      </div>
    </div>`;
  }

  function admitConditionStateHtml() {
    const st = docStateOf('discharge', 'admitCondition');
    if (!st || st.state === 'empty') return '';
    const stale = /(^|-)stale$/.test(st.state);
    return `<div class="doc-state doc-state-${docStateClass(st)}" data-doc-state="discharge-admit">
      <div class="doc-state-title">入院情况：${esc(DOC_LABEL[st.state] || st.state)}${stale ? `（${esc(changedText(st))}已变化）` : ''}</div>
      ${stale ? `<div class="hint">已确认的入院情况不会被后来更新的出院查体悄悄改写；如需按当前资料重写，请点「更新入院情况」。</div>
      <div class="doc-state-btns">
        <button type="button" class="btn btn-mini" data-act="updateAdmitCondition">更新入院情况</button>
      </div>` : ''}
    </div>`;
  }

  function renderSummary() {
    const diagList = ((R.diagnosis || {}).confirmed) || [];
    const hints = HINTS.analyze(R);
    const warnings = (typeof GENERATOR.validateStructured === 'function')
      ? GENERATOR.validateStructured(R)
      : GENERATOR.validate(R).map(m => ({ code: 'GENERAL', severity: 'warning', paths: [], message: m }));

    const diagHtml = diagList.map((d, i) => `
      <div class="diag-row">
        <span class="diag-no">${i + 1}.</span>
        <input type="text" data-diag="${i}" value="${esc(d)}">
        <button type="button" class="btn-del" data-diagdel="${i}">×</button>
      </div>
    `).join('');

    const hintHtml = hints.length ? hints.map(h => `
      <div class="hint-card">
        <div class="hint-name">${esc(h.name)}</div>
        <div class="hint-text">${esc(h.hint)}</div>
        <div class="hint-note">💡 ${esc(h.note)}</div>
        <div class="hint-matched">依据：${h.matched.map(m => esc(friendlyKey(m))).join('、')}</div>
        <button class="btn btn-mini" data-addhint="${esc(h.name)}">加入诊断</button>
      </div>
    `).join('') : '<div class="empty">暂无匹配的参考提示。已有足够的阳性发现时才会出现提示。</div>';

    const warnHtml = warnings.length
      ? warnings.map(w => {
        const p = (w.paths && w.paths[0]) || '';
        const jump = p
          ? ` <button type="button" class="btn btn-mini btn-ghost" data-act="jumpPath" data-path="${esc(p)}">定位</button>`
          : '';
        return `<div class="warn-item warn-${esc(w.severity || 'warning')}" data-code="${esc(w.code || '')}">${esc(w.message)}${jump}</div>`;
      }).join('')
      : '<div class="hint">当前规则未发现提醒，仍请逐项核对。</div>';

    return `
      <div class="card review-panel">
        <div class="card-title">核对提醒</div>
        <div class="warn-list">${warnHtml}</div>
      </div>

      <div class="card">
        <div class="card-title">诊断参考提示</div>
        <div class="hint">根据已填写的阳性发现自动匹配，仅供参考，请自行判断后决定是否采用。</div>
        ${hintHtml}
      </div>

      <div class="card">
        <div class="card-title">初步诊断</div>
        <div class="hint">按主次顺序排列：主要疾病在前，次要疾病在后，并发症列于有关主病之后，伴发病最后。一时难以确定的在病名后加「？」，如「发热待查，肠结核？」。</div>
        <div id="diagList">${diagHtml || '<div class="empty">尚未添加诊断</div>'}</div>
        <div class="diag-add">
          <input type="text" id="diagNew" placeholder="输入诊断后点添加">
          <button class="btn" data-act="addDiag">添加</button>
        </div>
        ${input('医师签名', 'diagnosis.signature', {
          placeholder: '签全名，如：李四',
          hint: '入院记录要求书写者在初步诊断右下角签全名；留空则病历里不出现签名行。'
        })}
      </div>

      <div class="card">
        <div class="card-title">病历摘要
          <button class="btn-mini" data-act="draftSummary">自动生成初稿</button>
        </div>
        <div class="hint">留空则使用自动生成的摘要；点右上角可先生成初稿，再按自己的表述修改。</div>
        ${textarea('摘要', 'summary', {
          rows: 5,
          placeholder: '留空自动生成'
        })}
        ${summaryStateHtml()}
      </div>

      ${renderSoap()}
      ${renderDischarge()}
    `;
  }

  /* ---------------------- 首次病程录（SOAP） ---------------------- */

  /**
   * 首次病程录的录入区（评分表第 5 页 100 分；第 6 页「首次病程记录」20 分）。
   *
   * 设计要点：
   *   · SOAP 是「归纳」而不是「复制」现病史，所以每一项都能手写；
   *     留空时生成器才用已填内容兜底，并把兜底内容标成「待补充」。
   *   · 「诊断依据」「鉴别诊断」「诊疗计划」按诊断逐条展开，可增可删。
   *   · 每一项都给出它在评分表里的分值与页码，方便写完就知道值多少分。
   */
  function renderSoap() {
    const soap = R.soap || {};
    const s = soap.s || {};
    const o = soap.o || {};
    const a = soap.a || {};
    const p = soap.p || {};
    const basis = Array.isArray(a.basisDetail) ? a.basisDetail : [];
    const diff = Array.isArray(a.diff) ? a.diff : [];
    const plans = Array.isArray(p.perDiagnosis) ? p.perDiagnosis : [];

    const basisRows = basis.map((row, i) => `
      <div class="soap-row">
        <div class="soap-row-head">
          <span class="soap-row-title">诊断 ${i + 1}</span>
          <button type="button" class="btn-del" data-arrdel="soap.a.basisDetail" data-idx="${i}">×</button>
        </div>
        <input type="text" data-arr="soap.a.basisDetail" data-field="diagnosis" data-idx="${i}"
          value="${esc(row.diagnosis || '')}" placeholder="诊断名称（与初步诊断一致）">
        <input type="text" data-arr="soap.a.basisDetail" data-field="history" data-idx="${i}"
          value="${esc(row.history || '')}" placeholder="① 病史依据">
        <input type="text" data-arr="soap.a.basisDetail" data-field="pe" data-idx="${i}"
          value="${esc(row.pe || '')}" placeholder="② 体检依据">
        <input type="text" data-arr="soap.a.basisDetail" data-field="aux" data-idx="${i}"
          value="${esc(row.aux || '')}" placeholder="③ 辅助检查依据">
      </div>
    `).join('');

    const diffRows = diff.map((row, i) => `
      <div class="soap-row">
        <div class="soap-row-head">
          <span class="soap-row-title">鉴别 ${i + 1}</span>
          <button type="button" class="btn-del" data-arrdel="soap.a.diff" data-idx="${i}">×</button>
        </div>
        <input type="text" data-arr="soap.a.diff" data-field="diagnosis" data-idx="${i}"
          value="${esc(row.diagnosis || '')}" placeholder="需要鉴别的疾病">
        <input type="text" data-arr="soap.a.diff" data-field="why" data-idx="${i}"
          value="${esc(row.why || '')}" placeholder="支持点：为什么考虑它">
        <input type="text" data-arr="soap.a.diff" data-field="against" data-idx="${i}"
          value="${esc(row.against || '')}" placeholder="不支持点：哪一点与本例不符">
        <input type="text" data-arr="soap.a.diff" data-field="points" data-idx="${i}"
          value="${esc(row.points || '')}" placeholder="鉴别要点（可留空）">
      </div>
    `).join('');

    const planRows = plans.map((row, i) => `
      <div class="soap-row">
        <div class="soap-row-head">
          <span class="soap-row-title">诊断 ${i + 1}</span>
          <button type="button" class="btn-del" data-arrdel="soap.p.perDiagnosis" data-idx="${i}">×</button>
        </div>
        <input type="text" data-arr="soap.p.perDiagnosis" data-field="diagnosis" data-idx="${i}"
          value="${esc(row.diagnosis || '')}" placeholder="诊断名称（与初步诊断一致）">
        <input type="text" data-arr="soap.p.perDiagnosis" data-field="exam" data-idx="${i}"
          value="${esc(row.exam || '')}" placeholder="拟完善的检查">
        <input type="text" data-arr="soap.p.perDiagnosis" data-field="treatment" data-idx="${i}"
          value="${esc(row.treatment || '')}" placeholder="治疗措施">
      </div>
    `).join('');

    return `
      <details class="card mini-details soap-card" id="soapCard">
        <summary>首次病程录（SOAP）</summary>
        <div class="hint">可根据已录入的病史生成初稿，再核对、补充。</div>
        <div class="btn-row" style="margin:8px 0 12px">
          <button class="btn btn-ghost" data-act="draftSoap">按已填内容生成初稿</button>
        </div>

        <div class="soap-sec">
          <div class="soap-sec-title">S 主观资料</div>
          ${textarea('病历特点（概括现病史要点：起病、诱因、主要症状、进展）', 'soap.s.summary', {
            rows: 3,
            placeholder: '留空则自动归纳现病史，并标注「待补充」'
          })}
          ${soapStateHtml('s', 'S 段')}
          <details class="optional-details"${String(s.consistency || '').trim() ? ' open' : ''}>
            <summary>补充说明</summary>
            ${input('与病史采集一致性的补充说明', 'soap.s.consistency', {
              placeholder: '如：上述病史由患者本人陈述'
            })}
          </details>
        </div>

        <div class="soap-sec">
          <div class="soap-sec-title">O 客观资料</div>
          ${textarea('对诊断有意义的体格检查', 'soap.o.pe', {
            rows: 2,
            placeholder: '留空则由阳性体征自动生成（只取阳性，不抄整段查体）'
          })}
          ${soapStateHtml('oPe', 'O 段·体格检查')}
          ${textarea('与疾病相关的辅助检查结果', 'soap.o.aux', {
            rows: 2,
            placeholder: '留空则由「辅助检查」页自动生成'
          })}
          ${soapStateHtml('oAux', 'O 段·辅助检查')}
        </div>

        <div class="soap-sec">
          <div class="soap-sec-title">A 评估与鉴别</div>
          ${textarea('诊断依据概述（简洁完整、不堆砌）', 'soap.a.basis', {
            rows: 3,
            placeholder: '把病史、体检、辅助检查三方面的关键点各写一两句，不要逐条罗列全部检查'
          })}
          ${soapStateHtml('basis', 'A 段·诊断依据')}
          <div class="soap-subtitle">各项诊断的依据（每条诊断都要病史 / 体检 / 辅助检查齐全）</div>
          ${basisRows || '<div class="empty">还没有按诊断列依据，点下面添加</div>'}
          <button class="btn btn-ghost" data-act="addSoapBasis">+ 添加一条诊断依据</button>
          <div class="soap-subtitle">鉴别诊断（围绕主要诊断写 2 条左右）</div>
          ${diffRows || '<div class="empty">还没有鉴别诊断，点下面添加</div>'}
          <button class="btn btn-ghost" data-act="addSoapDiff">+ 添加一条鉴别诊断</button>
          <details class="optional-details"${String(a.ranking || a.diffNote || '').trim() ? ' open' : ''}>
            <summary>诊断与鉴别补充说明</summary>
            ${input('诊断主次排序说明', 'soap.a.ranking', { placeholder: '按实际情况补充' })}
            ${textarea('鉴别诊断补充说明', 'soap.a.diffNote', { rows: 2 })}
          </details>
        </div>

        <div class="soap-sec">
          <div class="soap-sec-title">P 诊疗计划</div>
          ${textarea('诊疗计划总述（检查安排 + 治疗原则，简明扼要）', 'soap.p.principle', {
            rows: 3,
            placeholder: '如：完善血常规、胸片等检查，予抗感染、对症支持治疗，观察体温变化'
          })}
          <div class="soap-subtitle">按诊断逐条列出检查与治疗</div>
          ${planRows || '<div class="empty">还没有按诊断列计划，点下面添加</div>'}
          <button class="btn btn-ghost" data-act="addSoapPlan">+ 添加一条诊疗计划</button>
          ${textarea('个体化说明（本例哪些因素影响方案）', 'soap.p.individual', {
            rows: 2,
            placeholder: '如：患者高龄、合并肾功能不全，抗菌药物按肌酐清除率调整剂量'
          })}
        </div>
      </details>
    `;
  }

  /* ---------------------- 出院记录 ---------------------- */

  /**
   * 出院记录录入区（评分表第 6-7 页 15 分）。
   *
   * 六项小标题与评分表逐条对应；出院诊断留空时自动继承「初步诊断」，
   * 住院天数由入院日期与出院日期推算。
   */
  function renderDischarge() {
    const d = R.discharge || {};
    const adv = d.advice || {};
    const list = Array.isArray(d.diagnoses) ? d.diagnoses : [];
    const rows = list.map((s, i) => `
      <div class="diag-row">
        <span class="diag-no">${i + 1}.</span>
        <input type="text" data-arrstr="discharge.diagnoses" data-idx="${i}" value="${esc(s || '')}"
          placeholder="出院诊断">
        <button type="button" class="btn-del" data-arrstrdel="discharge.diagnoses" data-idx="${i}">×</button>
      </div>
    `).join('');
    return `
      <details class="card mini-details soap-card" id="dischargeCard">
        <summary>出院记录</summary>
        <div class="hint">出院诊断需单独填写并确认，不会自动沿用初步诊断；填写出院日期后可计算住院天数。</div>
        ${input('出院日期', 'discharge.dischargeDate', { type: 'date' })}
        ${textarea('入院情况（入院时主要症状、体征与入院诊断）', 'discharge.admitCondition', {
          rows: 3, placeholder: '留空则按主诉 + 阳性体征 + 初步诊断自动生成'
        })}
        ${admitConditionStateHtml()}
        ${textarea('诊疗经过（病情变化、检查结果、治疗经过及效果）', 'discharge.course', {
          rows: 4,
          placeholder: '如：入院后完善血常规示……，予……治疗，体温于第 3 天降至正常，复查胸片示……'
        })}
        ${textarea('出院情况（出院时主要症状、体征、辅助检查结果）', 'discharge.dischargeStatus', {
          rows: 3, placeholder: '如：无发热，咳嗽明显减轻，双肺呼吸音清，复查血常规正常'
        })}
        <div class="soap-subtitle">出院诊断</div>
        ${rows || '<div class="empty">尚未填写出院诊断</div>'}
        <button class="btn btn-ghost" data-act="addDischargeDiag">+ 添加一条出院诊断</button>
        ${dischargeDxStateHtml()}
        <div class="soap-subtitle">出院医嘱</div>
        ${input('药物治疗', 'discharge.advice.drug', { placeholder: '如：口服头孢克洛 0.25g tid × 5 天' })}
        ${input('非药物治疗', 'discharge.advice.nonDrug', { placeholder: '如：戒烟、呼吸功能锻炼' })}
        ${input('生活指导', 'discharge.advice.lifestyle', { placeholder: '如：注意休息，避免受凉' })}
        ${input('复诊时间', 'discharge.advice.followUp', { placeholder: '如：2 周后门诊复查胸片' })}
      </details>
    `;
  }

  function friendlyKey(k) {
    const map = {
      'cc:发热': '主诉/现病史提及发热',
      'cc:咳嗽': '主诉/现病史提及咳嗽',
      'cc:咳痰': '主诉/现病史提及咳痰',
      'cc:咯血': '主诉/现病史提及咯血',
      'cc:胸痛': '主诉/现病史提及胸痛',
      'cc:胸闷': '主诉/现病史提及胸闷',
      'cc:气促': '主诉/现病史提及气促',
      'cc:喘息': '主诉/现病史提及喘息',
      'cc:心悸': '主诉/现病史提及心悸',
      'cc:腹痛': '主诉/现病史提及腹痛',
      'cc:上腹痛': '主诉/现病史提及上腹痛',
      'cc:右上腹痛': '主诉/现病史提及右上腹痛',
      'cc:转移性右下腹痛': '主诉/现病史提及转移性右下腹痛',
      'cc:腹胀': '主诉/现病史提及腹胀',
      'cc:黑便': '主诉/现病史提及黑便',
      'cc:呕血': '主诉/现病史提及呕血',
      'cc:乏力': '主诉/现病史提及乏力',
      'cc:消瘦': '主诉/现病史提及消瘦',
      'vital:tempUp': '体温升高',
      'vital:tachy': '心率增快',
      'vital:tachypnea': '呼吸增快',
      'vital:bpUp': '血压升高',
      'vital:bpDown': '血压下降',
      'vital:bmiHigh': 'BMI 偏高',
      'smoke:有': '有吸烟史',
      'risk:smoke': '吸烟危险因素',
      'risk:alcohol': '饮酒史',
      'trauma:有': '有外伤史',
      'gender:女': '女性',
      'age:elderly': '年龄≥65岁',
      'age:fertile': '育龄期',
      'age:child': '儿童',
      'menstruation:delay': '月经推迟/停经'
    };
    if (map[k]) return map[k];
    if (k.startsWith('ros:')) {
      const [, sysKey, symKey] = k.split('.');
      const sys = SCHEMA.ROS.find(s => s.key === sysKey);
      const sym = sys && sys.symptoms.find(s => s.key === symKey);
      return sym ? `${sys.name}：${sym.label}` : k;
    }
    if (k.startsWith('pmh:')) return `既往史：${k.slice(4)}`;
    if (k.startsWith('aux:')) return `辅助检查：${k.slice(4)}`;
    if (k.startsWith('pev:')) {
      const body = k.slice(4);
      const eq = body.indexOf('=');
      return eq > 0 ? `查体：${body.slice(eq + 1)}` : `查体：${body}`;
    }
    if (k.startsWith('pe:')) return `查体异常：${k.slice(3)}`;
    return k;
  }

  /** 已勾选、没填文字、但生成时会输出默认描述的查体项 */
  function peCheckedDefaults() {
    const out = [];
    const groups = SCHEMA.PE_COMMON.map(g => ({ key: g.key, container: g.key, items: g.items || [] }));
    Object.keys(SCHEMA.PE_SPECIAL || {}).forEach(k => {
      groups.push({ key: 'special_' + k, container: 'special_' + k, items: (SCHEMA.PE_SPECIAL[k] || {}).items || [] });
    });
    groups.forEach(g => g.items.forEach(it => {
      const val = String(((R.pe || {})[g.container] || {})[it.key] || '');
      if (val) return;
      if (!SCHEMA.peChecked(R, g.key, it.key)) return;
      const text = SCHEMA.peNormalText(it);
      if (!text) return;
      out.push({ path: 'pe.' + g.container + '.' + it.key, text, label: it.label || it.key });
    }));
    return out;
  }

  /** 输出前核对清单：只提示、不自动往正文里塞「正常」事实 */
  function outputChecklistHtml() {
    const fs = (R.meta && R.meta.fieldStates) || {};
    let tpl = 0;
    Object.keys(fs).forEach(p => {
      const st = CORE.fieldState(R, p);
      if (st.source === 'template' && !CORE.fieldReviewValid(R, p)) tpl++;
    });
    const pePending = peCheckedDefaults().filter(x => !CORE.fieldReviewValid(R, x.path, x.text));
    const peDefault = pePending.length;
    const stale = [];
    const sm = CORE.documentState(R, 'summary');
    if (/(^|-)stale$/.test(sm.state)) stale.push({ label: '摘要', path: 'summary' });
    [['s', '首次病程录 S 段', 'soap.s.summary'], ['oPe', '首次病程录 O 段（体检）', 'soap.o.pe'],
      ['oAux', '首次病程录 O 段（辅助检查）', 'soap.o.aux'], ['basis', '诊断依据', 'soap.a.basis']]
      .forEach(([seg, label, path]) => {
        if (/(^|-)stale$/.test(CORE.documentState(R, 'firstCourse', seg).state)) stale.push({ label, path });
      });
    if (/(^|-)stale$/.test(CORE.documentState(R, 'discharge', 'admitCondition').state)) {
      stale.push({ label: '出院记录·入院情况', path: 'discharge.admitCondition' });
    }
    const dxUnconfirmed = (R.discharge && (R.discharge.diagnoses || []).filter(Boolean).length)
      && !R.discharge.diagnosesConfirmed;

    const items = [];
    if (tpl) items.push({ text: `有 ${tpl} 个字段来自教学模板，尚未核对`, path: Object.keys(fs).find(p => CORE.fieldState(R, p).source === 'template' && !CORE.fieldReviewValid(R, p)) });
    if (peDefault) items.push({ text: `有 ${peDefault} 项查体使用系统默认描述，尚未确认：` + pePending.slice(0, 3).map(x => `${x.label}「${x.text}」`).join('；'), path: pePending[0].path });
    stale.forEach(s => items.push({ text: `${s.label}已过期：原始资料变过，当前文字未更新`, path: s.path }));
    if (dxUnconfirmed) items.push({ text: '出院诊断已填写，但尚未单独确认', path: 'discharge.diagnoses' });

    if (!items.length) {
      return `<div class="doc-state doc-state-ok" data-doc-state="output-check">
        <div class="doc-state-title">输出前核对：没有未确认的模板事实、默认查体或过期段落。</div>
        <div class="hint">自动检查不能替代逐字核对；复制的是草稿，不是已签发的病历。</div>
      </div>`;
    }
    return `<div class="doc-state doc-state-stale" data-doc-state="output-check">
      <div class="doc-state-title">输出前核对：以下 ${items.length} 类内容尚未确认（仍可复制草稿）</div>
      <ul class="outline-list">
        ${items.map(it => `<li>${esc(it.text)}${it.path ? ` <button type="button" class="btn btn-mini btn-ghost" data-act="jumpPath" data-path="${esc(it.path)}">定位</button>` : ''}</li>`).join('')}
      </ul>
    </div>`;
  }

  function renderOutput() {
    const res = GENERATOR.generate(R, { rosMode: settings.rosMode });
    GENERATED = res;
    const relevantWarnings = res.warnings.filter(w => {
      if (OUT_VIEW !== 'firstCourse' && w.startsWith('【首次病程录】')) return false;
      if (OUT_VIEW !== 'discharge' && w.startsWith('【出院记录】')) return false;
      return true;
    });
    const text = outputTextOf(OUT_VIEW, res);
    const viewBtns = OUTPUT_VIEWS.map(v => `
      <button type="button" class="view-btn${OUT_VIEW === v.key ? ' on' : ''}"
        data-view="${v.key}">${esc(v.name)}</button>`).join('');
    return `
      ${outputChecklistHtml()}
      <div class="card review-panel">
        <div class="card-title">核对提醒</div>
        <div class="hint">请结合实际问诊、查体和报告核对；自动检查不能保证病历正确或完整。</div>
        <div class="warn-list">
          ${relevantWarnings.length ? relevantWarnings.map(w => `<div class="warn-item">${esc(w)}</div>`).join('') : '<div class="hint">当前规则未发现提醒，仍请逐项核对。</div>'}
        </div>
        <details class="optional-details">
          <summary>填写情况和问诊补充提示</summary>
          ${renderFillStatus()}
          ${renderDepthCard()}
        </details>
      </div>

      <div class="card">
        <div class="card-title">生成结果</div>
        <div class="hint">复制或下载前，请逐项核对模板、默认查体和生命体征是否与患者实际情况一致。</div>
        <details class="optional-details output-options">
          <summary>输出选项</summary>
          ${seg('系统回顾详略', 'settings.rosMode', [
            { value: 'detail', text: '逐系统写出（推荐）' },
            { value: 'brief', text: '只写阳性' }
          ])}
        </details>
        <div class="view-tabs">${viewBtns}</div>
        ${OUT_VIEW === 'firstCourse' ? `
          <label class="field">
            <span class="field-label">记录时间（可留空）</span>
            <input type="text" data-fcdate value="${esc(fcStamp())}" placeholder="如：2026-10-18 09:30">
          </label>` : ''}
        <div class="btn-row">
          <button class="btn" data-act="copyText">复制本篇</button>
          <button class="btn btn-ghost" data-act="downloadTxt">下载 .txt</button>
          ${OUT_VIEW === 'record'
            ? '<button class="btn btn-ghost" data-act="copySection">复制某段</button>'
            : ''}
        </div>
        <pre id="outputText" class="output">${esc(text)}</pre>
        <div class="hint">${esc(outputViewHint())}</div>
        ${selfCheckNotes()}
      </div>
    `;
  }

  /**
   * 填写情况总览：把「必填 / 建议填 / 可留空」三类一次性列清楚。
   *
   * 用户反馈过分不清哪些必须填——这里用实际数据回答：
   * 必填没填 = 红色，建议没填 = 黄色，留空由系统补的 = 灰色（且可点开看是哪些）。
   */
  function renderFillStatus() {
    const mustList = Array.from(FIELD_LEVEL.must);
    const shouldList = Array.from(FIELD_LEVEL.should);

    const isBlank = p => {
      const v = getPath(R, p);
      return v === undefined || v === null || String(v).trim() === '';
    };
    const NAME = {
      'basic.name': '姓名', 'basic.gender': '性别', 'basic.age': '年龄',
      'basic.department': '科室', 'basic.chiefComplaint': '主诉症状',
      // 主诉时长已并入主诉正文，这里不再有对应输入框。留着一行没有输入框的映射，
      // 只会让「填写情况」把一个界面上不存在的字段算成缺失。
      'basic.recordNo': '病历号', 'basic.admitDate': '入院日期',
      'basic.informant': '病史陈述者',
      'hpi.onset': '起病情况', 'hpi.symptoms': '症状特点', 'hpi.treatment': '诊治经过',
      'pmh.health': '平素健康状况', 'pmh.surgery': '手术史',
      'pmh.trauma': '外伤史', 'pmh.transfusion': '输血史',
      'personal.smoking': '吸烟史', 'personal.drinking': '饮酒史',
      'pe.vitals.temperature': '体温', 'pe.vitals.pulse': '脉搏',
      'pe.vitals.respiration': '呼吸', 'pe.vitals.sbp': '收缩压', 'pe.vitals.dbp': '舒张压'
    };

    const mustMissing = mustList.filter(isBlank).map(p => NAME[p] || p);
    const shouldMissing = shouldList.filter(isBlank).map(p => NAME[p] || p);

    // 查体里有多少项还没勾（没勾 = 本次没查 = 病历里不出现）
    //
    // ⚠️ 语义变更（本轮）：这里原来统计「没写字」的项，并声称它们「用系统默认」
    // 自动补一句正常描述。现在通用查体默认全不勾（缺陷1），留空 ≠ 默认正常，
    // 而是「没查、不写」。所以统计口径必须改成「没勾」，否则会继续误导学生。
    const deptKey = R.basic.department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    let peTotal = 0;
    let peUnchecked = 0;
    SCHEMA.PE_COMMON.forEach(g => {
      g.items.filter(it => !it.depts || it.depts.includes(deptKey)).forEach(it => {
        peTotal++;
        if (!SCHEMA.peChecked(R, g.key, it.key)) peUnchecked++;
      });
    });
    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      sp.items.forEach(it => {
        peTotal++;
        if (!SCHEMA.peChecked(R, 'special_' + spKey, it.key)) peUnchecked++;
      });
    });

    return `
      <div class="fill-status">
        <div class="section-title">填写情况</div>
        <div class="hint">这里只检查部分字段是否有内容，不判断事实是否准确或病历是否完整。</div>

        <div class="fs-row">
          <div class="fs-head"><span class="tag-req">必填</span> ${mustMissing.length ? `还差 ${mustMissing.length} 项` : '已填齐'}</div>
          ${mustMissing.length
            ? `<div class="fs-miss">${mustMissing.map(n => `<span class="fs-chip bad">${esc(n)}</span>`).join('')}</div>
               <div class="hint">这些基础字段尚未填写。</div>`
            : '<div class="hint">姓名、性别、年龄、科室、主诉都已填。</div>'}
        </div>

        <div class="fs-row">
          <div class="fs-head"><span class="tag-should">建议填</span> ${shouldMissing.length ? `还差 ${shouldMissing.length} 项` : '已填齐'}</div>
          ${shouldMissing.length
            ? `<div class="fs-miss">${shouldMissing.map(n => `<span class="fs-chip warn">${esc(n)}</span>`).join('')}</div>
               <div class="hint">这些字段尚未填写，请结合实际情况核对。</div>`
            : '<div class="hint">建议项都已填。</div>'}
        </div>

        <div class="fs-row">
          <div class="fs-head"><span class="tag-auto">可留空</span> 查体 ${peTotal} 项中 ${peTotal - peUnchecked} 项已勾选</div>
          <div class="hint">
            <b>没勾的项 = 本次没查</b>，病历里一个字都不会写，工具不会替你补「未见异常」。
            勾一项、写一句所见（或点「常用描述」选一个），病历里才会出现这一项。
            生命体征同理：填了才写，没填就写「／」。
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------------- 三种生成视图 ---------------------- */

  /**
   * 首次病程录的自查提醒。
   *
   * 单独渲染在正文之外：这些是给考生看的话（例如「某项鉴别与诊断关联不明确」），
   * 一旦混进正文，用户整段复制就会把提醒带进真正的病历。
   */
  function selfCheckNotes() {
    if (OUT_VIEW !== 'firstCourse') return '';
    const fn = (typeof GENERATOR !== 'undefined' && GENERATOR.firstCourseSelfCheck)
      ? GENERATOR.firstCourseSelfCheck : null;
    if (!fn) return '';
    let notes = [];
    try { notes = fn(R) || []; } catch (e) { return ''; }
    if (!notes.length) return '';
    return `<div class="selfcheck-notes">
      <div class="scn-title">⚠️ 自查提醒（不会写入病历正文）</div>
      ${notes.map(n => `<div class="scn-line">· ${esc(n)}</div>`).join('')}
    </div>`;
  }

  /**
   * 生成的三种产物。「大病历」是入院时写的完整病历，另外两篇是后续文书：
   * 它们共用同一份 record，只是各有自己的字段与排版，因此必须能分别复制，
   * 不能只给一个「复制全文」——把三篇拼在一起贴进病历系统是错的。
   */
  const OUTPUT_VIEWS = [
    { key: 'record', name: '大病历', meta: '' },
    { key: 'firstCourse', name: '首次病程录', meta: '' },
    { key: 'discharge', name: '出院记录', meta: '' }
  ];

  /** 当前生成视图（只在界面层保存，不写进病历存档） */
  let OUT_VIEW = 'record';
  /** 首次病程录的记录时间存在病历里（soap.recordTime），随病历保存和切换，不跨病历串用 */
  function fcStamp() {
    return String((R.soap && R.soap.recordTime) || '').trim();
  }

  function outputViewMeta() {
    const v = OUTPUT_VIEWS.find(x => x.key === OUT_VIEW) || OUTPUT_VIEWS[0];
    return v.meta;
  }

  function outputViewHint() {
    if (OUT_VIEW === 'firstCourse') {
      return '首次病程录是归纳而非复制：S 段概括现病史，O 段只取阳性体征，A 段按诊断给依据，P 段按诊断列检查与治疗。标「待补充」的地方就是还没写的内容。';
    }
    if (OUT_VIEW === 'discharge') {
      return '出院记录包括入院情况、诊疗经过、出院情况、出院诊断和出院医嘱；出院诊断需要单独填写并确认，不会自动沿用初步诊断。';
    }
    return '大病历 = 一般项目 → 主诉 → 现病史 → 既往史 → 系统回顾 → 个人史 → 婚姻史 → 月经与生育史 → 家庭史 → 体格检查 → 辅助检查 → 摘要 → 诊断依据 → 初步诊断。';
  }

  /** 取某个生成视图的纯文本（始终按当前 record 现算，不用旧缓存） */
  function outputTextOf(view, res) {
    const r = res || GENERATOR.generate(R, { rosMode: settings.rosMode });
    if (view === 'firstCourse') {
      return GENERATOR.buildFirstCourseRecord(R, fcStamp() ? { date: fcStamp() } : {});
    }
    if (view === 'discharge') return GENERATOR.buildDischargeRecord(R);
    return r.text;
  }

  /** 当前视图的复制/下载载荷 */
  function currentOutput() {
    const view = OUT_VIEW;
    const text = outputTextOf(view, GENERATED);
    const label = (OUTPUT_VIEWS.find(v => v.key === view) || OUTPUT_VIEWS[0]).name;
    return { text, view, label };
  }

  /* ---------------------- 问诊深度自查 ---------------------- */

  /**
   * 问诊深度自查：读学生自己写的自由文本，指出「提到了但没问深」的地方。
   *
   * 它不参与任何计分，也不写进病历正文——只是把带教老师会追问的点列出来。
   * 放在生成页而不是单开一步：这个软件的目的是写病历，这一栏是写完之后
   * 顺手看一眼的提醒，为它单设一步反而打断流程。
   */
  function renderDepthCard() {
    const D = typeof DEPTH !== 'undefined' ? DEPTH : null;
    if (!D) return '';
    const list = D.check(R) || [];
    const html = list.length ? list.map(f => `
      <div class="depth-line lv-${f.level}">
        <span class="dl-tag">${esc(f.label)}</span>
        <div class="dl-body">
          <div class="dl-msg">${esc(f.message)}</div>
          <div class="dl-meta">${esc(f.section)}${depthStep(f.section) ? `<button class="btn btn-ghost btn-jump dl-jump" data-checkjump="${esc(depthStep(f.section))}">去补</button>` : ''}</div>
        </div>
      </div>`).join('') : '<div class="hint">当前规则未发现需要补充的追问，仍请人工核对。</div>';
    return `
      <div class="depth-card">
        <div class="section-title">问诊补充提示</div>
        <div class="hint">根据已录入的文字提供提示，不代表问诊已经完整。</div>
        <div class="depth-lines">${html}</div>
      </div>`;
  }

  /** 深度自查的栏目名 → 对应录入步骤 */
  function depthStep(section) {
    return ({
      主诉: 'hpi',
      现病史: 'hpi',
      既往史: 'pmh',
      个人史: 'personal',
      月经史: 'marriage',
      辅助检查: 'aux'
    })[section] || '';
  }

  /* ---------------------- 步骤导航 ---------------------- */

  /**
   * 某一步填到什么程度：done（该步的关键内容有了）/ part（填了一点）/ empty（一个字都没有）。
   *
   * 判据刻意从简：导航面板是用来「跳转」的，不是用来打分的。
   * 一旦它开始算百分比，就会和「评分自查」打架——学生不知道该信哪个。
   * 所以这里只回答三件事：有了、有一点、没有。
   */
  function stepState(key) {
    const b = R.basic || {};
    const txt = v => String(v === undefined || v === null ? '' : v).trim() !== '';
    const anyText = obj => Object.keys(obj || {}).some(k => {
      const v = obj[k];
      if (typeof v === 'string') return txt(v);
      if (typeof v === 'boolean') return v;
      if (v && typeof v === 'object') return anyText(v);
      return false;
    });

    switch (key) {
      case 'basic': {
        const n = ['name', 'gender', 'age', 'chiefComplaint'].filter(k => txt(b[k])).length;
        return n >= 3 ? 'done' : (n ? 'part' : 'empty');
      }
      case 'hpi': {
        const n = ['onset', 'symptoms'].filter(k => txt((R.hpi || {})[k])).length;
        return n === 2 ? 'done' : (n ? 'part' : 'empty');
      }
      case 'pmh': {
        const p = R.pmh || {};
        if (txt(p.health) && txt(p.diseaseDetail)) return 'done';
        return anyText(p) ? 'part' : 'empty';
      }
      case 'ros': {
        const sys = Object.keys(R.ros || {});
        const n = sys.reduce((a, k) => a + Object.keys(R.ros[k] || {}).filter(s => {
          const v = R.ros[k][s];
          return v && (v.checked || v.negative);
        }).length, 0);
        return n >= 20 ? 'done' : (n ? 'part' : 'empty');
      }
      case 'personal':
        return txt((R.personal || {}).smoking) || txt(R.personal.environment) ? 'done'
          : (anyText(R.personal) ? 'part' : 'empty');
      case 'marriage':
        return txt(b.marital) ? 'done' : (anyText(R.marriage) ? 'part' : 'empty');
      case 'family':
        return anyText(R.family) ? 'part' : 'empty';
      case 'pe': {
        const deptKey = b.department || 'general';
        const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
        let total = 0;
        let on = 0;
        SCHEMA.PE_COMMON.forEach(g => g.items
          .filter(it => !it.depts || it.depts.includes(deptKey))
          .forEach(it => { total++; if (SCHEMA.peChecked(R, g.key, it.key)) on++; }));
        (dept.special || []).forEach(spKey => {
          const sp = SCHEMA.PE_SPECIAL[spKey];
          if (sp) sp.items.forEach(it => { total++; if (SCHEMA.peChecked(R, 'special_' + spKey, it.key)) on++; });
        });
        if (!on) return 'empty';
        return on >= Math.ceil(total * 0.6) ? 'done' : 'part';
      }
      case 'aux':
        return (R.auxiliary || {}).items &&
          R.auxiliary.items.some(it => txt(it.name) || txt(it.result)) ? 'done' : 'empty';
      case 'summary':
        return ((R.diagnosis || {}).confirmed || []).filter(txt).length ? 'done' : 'empty';
      default:
        // 自查 / 生成：没有「内容多少」这回事，不该给它们贴「还没填」的标签。
        // 用 'none' 表示「这一步不适用填写状态」，导航里就不渲染角标。
        return 'none';
    }
  }

  /**
   * 打开步骤导航（底部抽屉）。
   *
   * 为什么用底部抽屉而不是顶部下拉框：
   *   手机上手一伸就够到底部，而且 12 项竖排一屏放得下，不必滚动。
   *   顶部下拉框在 iOS Safari 上会被地址栏挤掉，还会盖住当前这一步的标题。
   */
  function openNav() {
    const wrap = document.createElement('div');
    wrap.className = 'nav-mask';
    wrap.innerHTML = `<div class="nav-sheet">
      <div class="nav-head">
        <span class="nav-title">跳到哪一步</span>
        <button type="button" class="btn-icon" data-navclose>关闭</button>
      </div>
      <div class="nav-list">${navRowsHtml()}</div>
      <div class="hint">带数字的是录入步骤，顺序与病历章节一致。填到一半随时可以跳走，回来时内容还在。</div>
    </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener('click', async ev => {
      if (ev.target === wrap) { wrap.remove(); return; }
      if (ev.target.closest('[data-navclose]')) { wrap.remove(); return; }
      const row = ev.target.closest('[data-navstep]');
      if (row) {
        wrap.remove();
        gotoStep(row.dataset.navstep);
      }
    });
    return wrap;
  }

  /** 导航面板的行 HTML。抽出来是为了让测试能直接断言，不必去读 DOM。 */
  function navRowsHtml() {
    return STEPS.map((s, i) => {
      const st = stepState(s.key);
      const cur = i === step ? ' cur' : '';
      const stateText = { done: '已填', part: '填了一部分', empty: '还没填' }[st];
      // 自查 / 生成这两步没有「填了多少」这回事，硬贴一个状态只会误导人，
      // 所以整个角标都不渲染。
      const stateHtml = st === 'none' ? ''
        : `<span class="nav-state st-${st}">${stateText}</span>`;
      return `<button type="button" class="nav-row${cur}" data-navstep="${esc(s.key)}">
        <span class="nav-icon">${esc(s.icon)}</span>
        <span class="nav-name">${esc(s.name)}</span>
        ${stateHtml}
      </button>`;
    }).join('');
  }

  /** 步骤键 → 索引。认不出来（空串、旧键、改过步骤）一律回 0，不让页面白屏 */
  function stepIndexOf(key) {
    if (!key) return 0;
    const i = STEPS.findIndex(s => s.key === key);
    return i < 0 ? 0 : i;
  }

  /** 跳到某个步骤（保持 render 的唯一步骤入口） */
  function gotoStep(key) {
    const i = STEPS.findIndex(s => s.key === key);
    if (i < 0) return;
    step = i;
    render();
  }

  /** 提醒里的「定位」：切到字段所在步骤并聚焦，返回后不丢填写位置 */
  function jumpToPath(path) {
    if (!path) return;
    const top = String(path).split('.')[0];
    const stepKey = {
      basic: 'basic', hpi: 'hpi', pmh: 'pmh', ros: 'ros', personal: 'personal',
      marriage: 'marriage', menstruation: 'marriage', childbirth: 'marriage',
      family: 'family', pe: 'pe', auxiliary: 'aux', summary: 'summary',
      diagnosis: 'summary', soap: 'summary', discharge: 'summary'
    }[top];
    if (stepKey) {
      const i = STEPS.findIndex(s => s.key === stepKey);
      if (i >= 0 && i !== step) { step = i; render(); }
    }
    const sel = `[data-path="${path}"],[data-diag],[data-aux]`;
    const el = document.querySelector(`[data-path="${path}"]`) || document.querySelector(sel);
    if (el) {
      if (el.tagName === 'DETAILS') el.open = true;
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (el.focus) el.focus({ preventScroll: true });
    }
  }

  /**
   * 套用模板病例。
   *
   * 三条行为约定：
   *   1. 只补空白项。已经写过的内容一个字都不动——学生自己写的东西
   *      永远比他随手点的模板更接近真相。
   *   2. 套用前明确告知「这是模板，不是你的病人」，并要求确认。
   *      病历是法律文书，让学生糊里糊涂提交一份「标准病例」是害他。
   *   3. 套完留在原步骤、滚回顶部，用 toast 报「补了多少项」，
   *      不自动跳到下一步——学生通常想先看看都写了什么。
   */
  function applyTemplate(tplKey, mode) {
    if (typeof TEMPLATES === 'undefined' || !TEMPLATES.get) return;
    const t = TEMPLATES.get(tplKey);
    if (!t) return;

    if (mode === 'patient') {
      const res = TEMPLATES.apply(R, tplKey, { mode: 'patient' });
      if (!res || !res.ok) { toast('模板数据不完整'); return; }
      const groups = {};
      (res.outline || []).forEach(o => {
        (groups[o.section] = groups[o.section] || []).push(o.label);
      });
      const body = Object.keys(groups).map(sec => `
        <div class="soap-subtitle">${esc(sec)}</div>
        <ul class="outline-list">${groups[sec].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      `).join('');
      showModal(`患者录入提纲：${t.name}`,
        `<div class="hint">以下只是「应该问什么、应该查什么」的提纲，<b>没有写入任何患者事实</b>；
          模板里的阴性病史、阳性体征、检查结果和诊断都不属于当前患者。</div>${body}
         <div class="btn-row"><button class="btn" data-close>关闭</button></div>`);
      return;
    }

    if (R.__templateKey && R.__templateKey !== tplKey) {
      showModal('不能混合模板', '<div class="warn-item">这份病历已套用其他模板。为避免混入不同病例的内容，请先新建病历，再选择新模板。</div><div class="btn-row"><button class="btn" data-close>关闭</button></div>');
      return;
    }

    const ok = window.confirm(
      `作为学习范例套用：${t.name}\n\n` +
      (t.source ? `${t.source.label}：${t.source.note}\n\n` : '') +
      '这会把教学范例已有的内容填进**空白项**（现病史、既往史、查体、辅助检查、诊断等），' +
      '你已经写过的内容不会被覆盖。所有带入内容都会标为「模板来源、未核对」。\n\n' +
      '套用后请按实际问到的、查到的逐条核对补充；缺项保持待填，影像考虑不能替代病理诊断。\n\n' +
      '确定套用吗？'
    );
    if (!ok) return;

    const before = R.basic.chiefComplaint || R.hpi.symptoms || '';
    snapshot('套用模板：' + t.name);
    const res = TEMPLATES.apply(R, tplKey, { mode: 'example' });
    if (!res || !res.ok) { toast('套用失败，模板数据可能不完整'); return; }
    R.__templateKey = tplKey;

    // 模板没写科室而当前是通用科时，apply 会把科室补上；此时要提示，
    // 否则学生不知道自己的科室被改了。
    const deptChanged = (R.basic.department === t.dept)
      && (res.filled.indexOf('basic.department') >= 0);

    saveCurrent();
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });

    const parts = [`已套用「${t.name}」，填入 ${res.count} 项（模板来源，未核对）`];
    if (deptChanged) parts.push(`科室已设为${TEMPLATES.deptName(t.dept)}`);
    if (before) parts.push('你原先写的内容没有被覆盖');
    toast(parts.join('；'));
  }

  /** 查看本次模板带入的具体文字 */
  function viewTemplateFill() {
    const last = R.meta && R.meta.lastTemplateFill;
    if (!last) { toast('没有本次带入记录'); return; }
    const rows = Object.keys(last.values || {}).map(p =>
      `<li><code>${esc(p)}</code>：${esc(last.values[p])}</li>`).join('');
    showModal('本次带入内容',
      `<div class="hint">共 ${(last.filled || []).length} 项，全部标记为「模板来源、未核对」。
        请逐条对照实际问诊和查体修改。</div>
       <ul class="outline-list">${rows || '<li>（没有可显示的文字字段）</li>'}</ul>
       <div class="btn-row"><button class="btn" data-close>关闭</button></div>`);
  }

  /**
   * 撤销本次模板带入：只回滚「本次写入、且此后没被改过」的字段。
   * 用户后来手改过的内容一律保留，不做整段覆盖。
   */
  function undoTemplateFill() {
    const last = R.meta && R.meta.lastTemplateFill;
    if (!last) { toast('没有本次带入记录'); return; }
    const paths = Object.keys(last.values || {});
    if (!paths.length) { toast('本次带入没有可撤销的文字字段'); return; }
    snapshot('撤销模板带入：' + (last.name || last.key));
    let cleared = 0, kept = 0;
    paths.forEach(p => {
      const cur = CORE.getPath(R, p);
      if (String(cur == null ? '' : cur) === String(last.values[p])) {
        CORE.setPath(R, p, '');
        CORE.setFieldState(R, p, { source: 'manual', reviewed: false, reviewedValueHash: '', sourceRef: '' });
        cleared++;
      } else {
        kept++;
      }
    });
    R.meta.lastTemplateFill = null;
    saveCurrent();
    render();
    toast(`已撤销 ${cleared} 项${kept ? `，保留 ${kept} 项你后来改过的内容` : ''}`);
  }

  /* ========================= 渲染主循环 ========================= */

  let GENERATED = null;

  function render() {
    // 同步 segmented 设置
    if (settings.rosMode) R.__rosMode = settings.rosMode;

    const cur = STEPS[step];
    let body = '';
    switch (cur.key) {
      case 'basic': body = renderBasic(); break;
      case 'hpi': body = renderHpi(); break;
      case 'ros': body = renderRos(); break;
      case 'pmh': body = renderPmh(); break;
      case 'personal': body = renderPersonal(); break;
      case 'marriage': body = renderMarriage(); break;
      case 'family': body = renderFamily(); break;
      case 'pe': body = renderPe(); break;
      case 'aux': body = renderAux(); break;
      case 'summary': body = renderSummary(); break;
      case 'output': body = renderOutput(); break;
    }

    // 存储异常必须让用户看到，不能静默
    const banner = storageAlert
      ? `<div class="storage-alert" id="storageAlert">
           <div class="alert-msg">⚠️ ${esc(storageAlert)}</div>
           <div class="alert-btns">
             ${currentSaveBlocked ? '<button type="button" class="alert-act" data-export-corrupt="current">导出原始损坏数据</button>' : ''}
             ${currentSaveBlocked ? '<button type="button" class="alert-act" data-discard-corrupt="current">新建空白病历</button>' : ''}
             ${listSaveBlocked ? '<button type="button" class="alert-act" data-export-corrupt="list">导出原始列表</button>' : ''}
             ${listSaveBlocked ? '<button type="button" class="alert-act" data-discard-corrupt="list">新建空列表</button>' : ''}
             ${remoteConflict ? '<button type="button" class="alert-act" data-act="loadRemote">载入新版本</button>' : ''}
             ${remoteConflict ? '<button type="button" class="alert-act" data-act="keepCopy">保留为副本</button>' : ''}
             <button type="button" class="alert-x" data-dismiss-alert>知道了</button>
           </div>
         </div>`
      : '';
    $('#content').innerHTML = banner + body;

    // 步骤条
    $('#stepTitle').textContent = cur.name;
    $('#stepNum').textContent = `${step + 1}/${STEPS.length}`;
    $('#progressBar').style.width = ((step + 1) / STEPS.length * 100) + '%';

    // 底部导航：首步禁用「上一步」，末步「下一步」变为保存
    const prevBtn = $('#btnPrev');
    const nextBtn = $('#btnNext');
    if (prevBtn) {
      prevBtn.disabled = step === 0;
      prevBtn.textContent = step === 0 ? '已是第一步' : '上一步';
    }
    if (nextBtn) {
      nextBtn.textContent = step === STEPS.length - 1 ? '保存病历' : '下一步';
    }

    // 系统回顾详情区
    if (cur.key === 'ros') {
      SCHEMA.ROS.forEach(sys => {
        const box = document.querySelector(`[data-ros-detail="${sys.key}"]`);
        if (box) box.innerHTML = renderRosDetail(sys.key);
      });
    }

    // 实时预览
    updateLivePreviews();

    // 记住停在哪一步。刷新、切走再回来都会回到原处，
    // 不必每次都从「基本情况」重新点 7 下。
    // 生成页不记——它只是输出，回到编辑流程更有用。
    if (cur.key !== 'output' && settings.lastStep !== cur.key) {
      settings.lastStep = cur.key;
      saveSettings();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateLivePreviews() {
    const cc = $('#ccPreview');
    if (cc) {
      const text = GENERATOR.buildChiefComplaint(R);
      cc.innerHTML = text ? `<b>生成的主诉：</b>${esc(text)}` : '<span class="muted">填写后这里会实时显示主诉</span>';
    }
    const bmi = $('#bmiPreview');
    if (bmi) {
      const h = parseFloat(R.pe.vitals.height);
      const w = parseFloat(R.pe.vitals.weight);
      if (h > 0 && w > 0) {
        const v = (w / Math.pow(h / 100, 2)).toFixed(1);
        let tag = '正常';
        if (v < 18.5) tag = '偏瘦';
        else if (v >= 24 && v < 28) tag = '超重';
        else if (v >= 28) tag = '肥胖';
        bmi.innerHTML = `<b>BMI：</b>${v}（${tag}）`;
      } else {
        bmi.innerHTML = '';
      }
    }
  }

  /* ========================= 事件处理 ========================= */

  /**
   * 输入查体项时，就地刷新它的状态标记与左侧色条。
   *
   * 不整页重绘的原因：重绘会让 textarea 失焦、光标跳到开头，手机上基本没法用。
   * 这里只改那一个 .pe-item 的 class 和角标文字。
   */
  function refreshPeBadge(el) {
    const item = el.closest('.pe-item');
    if (!item) return;
    const groupKey = item.dataset.peGroup || '';
    const itemKey = item.dataset.peKey || '';
    if (!groupKey || !itemKey || !SCHEMA.findPEItem) return;
    const it = SCHEMA.findPEItem(groupKey + '.' + itemKey);
    if (!it) return;
    // 读记录值，不读 el.value ——
    // textarea 里预填着正常描述（shown = val || normalText），拿它当「用户填了」
    // 会把「勾了但没填」错判成绿色「已填」，而整页重绘后又变回「系统默认」，
    // 同一份数据两种显示。记录值是唯一真相。
    const containerKey = el.dataset.path
      ? el.dataset.path.split('.')[1]
      : groupKey;
    const raw = (R.pe[containerKey] || {})[itemKey];
    const val = raw !== undefined && raw !== null ? String(raw).trim() : '';
    const checked = SCHEMA.peChecked(R, groupKey, itemKey);
    const normalText = SCHEMA.peNormalText(it);
    const state = !checked ? 'off' : (val ? 'filled' : (normalText ? 'default' : 'blank'));
    item.classList.remove('is-filled', 'is-default', 'is-blank', 'is-off');
    item.classList.add('is-' + state);

    // 勾选框本身也要跟上（「全选 / 全不选」是整组改状态，不经过单个 input 事件，
    // 不在这里同步的话，记录改了、框还画着旧的）
    const cb = item.querySelector('input[data-pecheck]');
    if (cb && cb.checked !== checked) cb.checked = checked;

    const label = item.querySelector('.pe-label');
    if (label) {
      // 去掉旧角标再插新的
      label.querySelectorAll('.tag-done,.tag-auto,.tag-req,.tag-off').forEach(n => n.remove());
      const span = document.createElement('span');
      if (state === 'off') { span.className = 'tag-off'; span.textContent = '未查'; }
      else if (state === 'filled') { span.className = 'tag-done'; span.textContent = '已填'; }
      else if (state === 'default') { span.className = 'tag-auto'; span.textContent = '系统默认'; }
      else { span.className = 'tag-req'; span.textContent = '需填'; }
      label.appendChild(span);

      // 核对角标：与「实际输出文字」绑定，手改后立即回到待核对
      label.querySelectorAll('.tag-review,.tag-review-btn').forEach(n => n.remove());
      const path = `pe.${containerKey}.${itemKey}`;
      const shownText = val || (checked ? normalText : '');
      if (shownText) {
        if (peReviewValid(path, shownText)) {
          const ok = document.createElement('span');
          ok.className = 'tag-done tag-review';
          ok.textContent = '已核对';
          label.appendChild(ok);
        } else {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'chip small tag-review-btn';
          btn.dataset.act = 'confirmPe';
          btn.dataset.path = path;
          btn.textContent = '待核对·确认';
          label.appendChild(btn);
        }
      }
    }

    // 提示文案跟着状态切换（只动我们自己加的那条，别碰别的 hint）
    const hintBox = item.querySelector('.pe-hint');
    if (hintBox) {
      if (state === 'default') hintBox.textContent = '已勾选但没填具体所见，生成时自动写这句正常描述。';
      else if (state === 'blank') hintBox.textContent = '这一项没有默认描述，留空则病历里不会出现这句。';
      else hintBox.textContent = '';
      hintBox.hidden = !hintBox.textContent;
    }
    refreshPeCount(groupKey);
  }

  /** 刷新某张查体卡片标题上的「已勾 N/M」 */
  function refreshPeCount(groupKey) {
    const box = document.querySelector(`[data-count-for="${groupKey}"]`);
    if (!box) return;
    const items = peItemsOf(groupKey);
    const on = items.filter(it => SCHEMA.peChecked(R, groupKey, it.key)).length;
    box.textContent = `已勾 ${on}/${items.length}`;
  }

  /**
   * 生命体征输入侧的「可信范围」校验。
   *
   * 为什么要有：`GENERATOR.validate()` 里已经有一份同样的范围表（VITAL_RANGE），
   * 但那要到第 11 步生成病历时才提示。学生在第 9 步把体温打成 375、脉搏打成 7，
   * 一路点下去毫无阻碍，等看到警告时已经不知道是哪一个数字错了。
   *
   * 这里只做一件事：把输入框标红 + 在旁边说明「可信范围是 34～43」。
   * 不拦输入、不改正数字——万一是真的有这种极端值，改不改由学生判断。
   */
  function markVital(el) {
    if (!el || !el.dataset || el.dataset.min === undefined) return;
    const lo = el.dataset.min === '' ? null : Number(el.dataset.min);
    const hi = el.dataset.max === '' ? null : Number(el.dataset.max);
    const label = el.dataset.vlabel || '这一项';
    const raw = String(el.value || '').trim();
    const cell = el.closest('.vital');
    let note = cell ? cell.querySelector('.vital-warn') : null;

    let bad = '';
    if (raw !== '' && /^-?\d+(\.\d+)?$/.test(raw)) {
      const n = Number(raw);
      if (lo !== null && n < lo) bad = `低于可信范围（${lo}～${hi}）`;
      else if (hi !== null && n > hi) bad = `高于可信范围（${lo}～${hi}）`;
    }
    if (bad) {
      el.classList.add('is-out-of-range');
      if (!note && cell) {
        note = document.createElement('span');
        note.className = 'vital-warn';
        cell.appendChild(note);
      }
      if (note) note.textContent = `${label}${bad}`;
    } else {
      el.classList.remove('is-out-of-range');
      if (note) note.remove();
    }
  }

  /** 按组键取查体项列表：普通组从 PE_COMMON 取，special_xxx 从 PE_SPECIAL 取 */
  function peItemsOf(groupKey) {
    if (String(groupKey).startsWith('special_')) {
      const sp = SCHEMA.PE_SPECIAL[String(groupKey).slice('special_'.length)];
      return (sp && sp.items) || [];
    }
    const g = SCHEMA.PE_COMMON.find(x => x.key === groupKey);
    return (g && g.items) || [];
  }

  function bindEvents() {
    // 输入事件（委托）
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.path) {
        let v = t.value;
        if (t.type === 'number' || t.dataset.num === '1') {
          // 保留原始字符串，生成时再处理
        }
        setPath(R, t.dataset.path, v);
        // 记录来源：手写摘要 / 手写 SOAP 段落要能区分「生成后被改」与「原本就是人写的」
        if (t.dataset.path === 'summary') {
          CORE.markDocumentManual(R, 'summary');
        } else if (t.dataset.path === 'soap.s.summary') {
          CORE.markDocumentManual(R, 'firstCourse', 's');
        } else if (t.dataset.path === 'soap.o.pe') {
          CORE.markDocumentManual(R, 'firstCourse', 'oPe');
        } else if (t.dataset.path === 'soap.o.aux') {
          CORE.markDocumentManual(R, 'firstCourse', 'oAux');
        } else if (t.dataset.path === 'soap.a.basis') {
          CORE.markDocumentManual(R, 'firstCourse', 'basis');
        } else if (t.dataset.path === 'discharge.admitCondition') {
          CORE.markDocumentManual(R, 'discharge', 'admitCondition');
        }
        saveCurrent();
        updateLivePreviews();
        // 查体项：只刷新这一个条目的「已填 / 系统默认 / 需填」标记，
        // 不整页重绘（否则输入框会失焦、光标跳到开头）。
        if (t.dataset.path.startsWith('pe.')) refreshPeBadge(t);
        if (t.dataset.path.startsWith('pe.')) CORE.markFieldManual(R, t.dataset.path);
        // 生命体征的可信范围：边输边标，不等生成时才说
        if (t.dataset.path.startsWith('pe.vitals.')) markVital(t);
        // 过敏史/性别切换需要重绘
        if (t.dataset.path === 'pmh.allergy' || t.dataset.path === 'marital') { }
      }
      if (t.dataset.aux) {
        const idx = parseInt(t.dataset.idx, 10);
        // 旧存档里这一项可能没有 date/hospital/no，缺什么补什么（只补空壳，不填值）。
        R.auxiliary.items[idx] = R.auxiliary.items[idx] || { name: '', result: '', date: '', hospital: '', no: '' };
        R.auxiliary.items[idx][t.dataset.aux] = t.value;
        saveCurrent();
      }
      if (t.dataset.diag !== undefined) {
        R.diagnosis.confirmed[parseInt(t.dataset.diag, 10)] = t.value;
        saveCurrent();
      }
      // 首次病程录 / 出院记录里的「数组对象」行（诊断依据、鉴别诊断、诊疗计划）
      if (t.dataset.arr) {
        const list = getPath(R, t.dataset.arr);
        if (Array.isArray(list) && list[parseInt(t.dataset.idx, 10)]) {
          list[parseInt(t.dataset.idx, 10)][t.dataset.field] = t.value;
          saveCurrent();
        }
      }
      // 出院诊断（字符串数组）
      if (t.dataset.arrstr) {
        const list = getPath(R, t.dataset.arrstr);
        if (Array.isArray(list)) {
          list[parseInt(t.dataset.idx, 10)] = t.value;
          if (t.dataset.arrstr === 'discharge.diagnoses') {
            // 改过就必须重新确认，不能继承上一次的确认状态
            R.discharge.diagnosesConfirmed = false;
            CORE.markDocumentManual(R, 'discharge', 'diagnoses');
          }
          saveCurrent();
        }
      }
      // 首次病程录记录时间：写入当前病历，切换病历不沿用上一份
      if (t.dataset.fcdate !== undefined) {
        R.soap.recordTime = t.value;
        saveCurrent();
        const pre = document.getElementById('outputText');
        if (pre) pre.textContent = GENERATOR.buildFirstCourseRecord(R, fcStamp() ? { date: fcStamp() } : {});
      }
    });

    // 点击事件（委托）
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-seg],[data-check],[data-ros],[data-rosneg],[data-pequick],[data-pecheck],[data-pall],[data-act],[data-addhint],[data-auxdel],[data-diagdel],[data-jump],[data-dismiss-alert],[data-export-corrupt],[data-discard-corrupt],[data-view],[data-checkjump],[data-arrdel],[data-arrstrdel],[data-focusadd],[data-focusdel],[data-tpl]');
      if (!t) return;
      const ds = t.dataset;

      // 套用模板病例
      if (ds.tpl !== undefined) {
        applyTemplate(ds.tpl, ds.tplmode || 'example');
        return;
      }

      // 生成视图切换（大病历 / 首次病程录 / 出院记录）
      if (ds.view !== undefined) {
        OUT_VIEW = ds.view;
        render();
        return;
      }

      // 自查页「去补本站内容」
      if (ds.checkjump !== undefined) {
        gotoStep(ds.checkjump);
        return;
      }

      // 重点查体：添加 / 移除标记项（存 '组.key' 引用）
      if (ds.focusadd !== undefined) {
        const f = R.focusPE || (R.focusPE = { keys: [], note: '' });
        if (!Array.isArray(f.keys)) f.keys = [];
        if (!f.keys.includes(ds.focusadd)) f.keys.push(ds.focusadd);
        // 加入重点查体 = 明确要写进病历，顺手把它置为已勾选。
        // 否则会出现「重点查体里列了这一项，正文说未查」的自相矛盾。
        const ref = String(ds.focusadd);
        const dot = ref.indexOf('.');
        if (dot > 0 && SCHEMA.setPeChecked) {
          SCHEMA.setPeChecked(R, ref.slice(0, dot), ref.slice(dot + 1), true);
        }
        saveCurrent();
        render();
        return;
      }
      if (ds.focusdel !== undefined) {
        const f = R.focusPE || {};
        if (Array.isArray(f.keys)) f.keys = f.keys.filter(k => k !== ds.focusdel);
        saveCurrent();
        render();
        return;
      }

      // 首次病程录「按已填内容生成初稿」
      if (ds.act === 'draftSoap') {
        handleAction('draftSoap', t);
        return;
      }

      // 数组行删除（SOAP 的诊断依据 / 鉴别诊断 / 诊疗计划）
      if (ds.arrdel !== undefined) {
        const list = getPath(R, ds.arrdel);
        if (Array.isArray(list)) {
          list.splice(parseInt(ds.idx, 10), 1);
          saveCurrent();
          render();
        }
        return;
      }

      // 出院诊断删除
      if (ds.arrstrdel !== undefined) {
        const list = getPath(R, ds.arrstrdel);
        if (Array.isArray(list)) {
          list.splice(parseInt(ds.idx, 10), 1);
          saveCurrent();
          render();
        }
        return;
      }

      // segmented 单选
      if (ds.seg !== undefined) {
        setPath(R, ds.seg, ds.val);
        saveCurrent();
        const needsRerender =
          ds.seg === 'basic.department' || ds.seg === 'pmh.allergy' ||
          ds.seg === 'basic.gender' || ds.seg === 'menstruation.applicable' ||
          ds.seg === 'settings.rosMode';
        if (ds.seg === 'settings.rosMode') {
          settings.rosMode = ds.val;
          saveSettings();
        }
        if (needsRerender) render();
        else {
          $$(`[data-seg="${ds.seg}"]`).forEach(b => b.classList.toggle('on', b.dataset.val === ds.val));
        }
        return;
      }

      // 多选 chip
      if (ds.check !== undefined) {
        const obj = getPath(R, ds.check) || {};
        obj[ds.val] = !obj[ds.val];
        setPath(R, ds.check, obj);
        saveCurrent();
        t.classList.toggle('on', !!obj[ds.val]);
        return;
      }

      // 系统回顾三态切换（缺陷1第2条的核心交互）
      //
      // 旧实现只有两态（勾=阳性，不勾=阴性），于是「没问过」必然被写成阴性。
      // 现在每个症状按固定顺序循环：
      //   未问 →（点一次）→ 阴性 →（再点）→ 阳性 →（再点）→ 未问
      // 这个顺序保证「要写成阳性」也必须先经过一次阴性，反而更贴合问诊动作：
      // 先确认病人没有这个症状，有的话才记成阳性。
      if (ds.ros !== undefined) {
        const store = R.ros[ds.ros] || (R.ros[ds.ros] = {});
        const item = store[ds.sym] || (store[ds.sym] = { checked: false, negative: false, time: '', detail: '' });
        if (item.checked) {
          // 阳性 → 未问
          item.checked = false;
          item.negative = false;
        } else if (item.negative) {
          // 阴性 → 阳性
          item.negative = false;
          item.checked = true;
        } else {
          // 未问 → 阴性
          item.negative = true;
          item.checked = false;
        }
        saveCurrent();
        // 更新按钮外观与详情区
        const label = SCHEMA.ROS.find(s => s.key === ds.ros).symptoms.find(s => s.key === ds.sym).label;
        t.classList.toggle('on', !!item.checked);
        if (item.checked) {
          t.setAttribute('style', '');
        } else if (item.negative) {
          t.setAttribute('style', 'background:var(--gray-2);border-color:var(--gray-4);color:var(--gray-5);text-decoration:line-through;');
        } else {
          t.setAttribute('style', '');
        }
        t.innerHTML = esc(label) + (item.checked ? ' ✓' : (item.negative ? ' −' : ''));
        const box = document.querySelector(`[data-ros-detail="${ds.ros}"]`);
        if (box) box.innerHTML = renderRosDetail(ds.ros);
        // 选中阳性时自动展开该系统
        const group = document.getElementById('ros-group-' + ds.ros);
        if (group) {
          if (item.checked) group.open = true;
          const badge = group.querySelector('.badge-pos');
          const summary = group.querySelector('summary');
          const posN = SCHEMA.ROS.find(s => s.key === ds.ros).symptoms
            .filter(s => ((R.ros[ds.ros] || {})[s.key] || {}).checked).length;
          if (badge) badge.textContent = posN;
          else if (posN) {
            const span = document.createElement('span');
            span.className = 'badge-pos';
            span.textContent = posN;
            summary.appendChild(span);
          }
          // 阴性计数角标
          const negN = SCHEMA.ROS.find(s => s.key === ds.ros).symptoms
            .filter(s => { const v = (R.ros[ds.ros] || {})[s.key] || {}; return !v.checked && v.negative; }).length;
          const negBadge = summary.querySelector('[data-negcount]');
          if (negBadge) {
            negBadge.textContent = `阴性 ${negN}`;
            negBadge.style.display = negN ? '' : 'none';
          } else if (negN) {
            const span = document.createElement('span');
            span.className = 'tag-off';
            span.setAttribute('data-negcount', ds.ros);
            span.textContent = `阴性 ${negN}`;
            summary.appendChild(span);
          }
        }
        // 更新计数
        const totalPos = SCHEMA.ROS.reduce((n, sys) => {
          const s = R.ros[sys.key] || {};
          return n + sys.symptoms.filter(x => (s[x.key] || {}).checked).length;
        }, 0);
        const cnt = document.querySelector('.ros-count b');
        if (cnt) cnt.textContent = totalPos;
        return;
      }

      // 单个系统的「剩余项全部标为阴性」：只标没问过的，已标阳性的保持阳性
      if (ds.rosneg !== undefined) {
        const sys = SCHEMA.ROS.find(s => s.key === ds.rosneg);
        if (!sys) return;
        const store = R.ros[ds.rosneg] || (R.ros[ds.rosneg] = {});
        sys.symptoms.forEach(sym => {
          const it = store[sym.key] || (store[sym.key] = { checked: false, negative: false, time: '', detail: '' });
          if (!it.checked) it.negative = true;
        });
        saveCurrent();
        render();
        return;
      }

      // 查体快捷描述
      if (ds.pequick !== undefined) {
        const group = R.pe[ds.pequick] || (R.pe[ds.pequick] = {});
        group[ds.pekey] = ds.val;
        // 选了一个具体描述 = 这次查过了，自动勾上（专科技巧：不然点了描述却仍标「未查」）
        if (SCHEMA.setPeChecked) SCHEMA.setPeChecked(R, ds.pequick, ds.pekey, true);
        saveCurrent();
        // 同步文本框
        const ta = document.querySelector(`textarea[data-path="pe.${ds.pequick}.${ds.pekey}"]`);
        if (ta) {
          ta.value = ds.val;
          refreshPeBadge(ta);
        }
        $$(`[data-pequick="${ds.pequick}"][data-pekey="${ds.pekey}"]`).forEach(b =>
          b.classList.toggle('on', b.dataset.val === ds.val)
        );
        return;
      }

      // 勾选 / 取消勾选一个查体项
      if (ds.pecheck !== undefined) {
        SCHEMA.setPeChecked(R, ds.pecheck, ds.pekey, t.checked);
        const path = 'pe.' + ds.pecheck + '.' + ds.pekey;
        const filled = String((R.pe[ds.pecheck] || {})[ds.pekey] || '');
        if (t.checked && !filled) {
          CORE.setFieldState(R, path, { source: 'default', reviewed: false, reviewedValueHash: '' });
        } else if (!t.checked) {
          CORE.setFieldState(R, path, { source: 'default', reviewed: false, reviewedValueHash: '' });
        }
        saveCurrent();
        // 就地刷新，不整页重绘（重绘会丢滚动位置）
        const box = t.closest('.pe-item');
        if (box) {
          const ta = box.querySelector('.pe-text');
          if (ta) refreshPeBadge(ta);
          else refreshPeCount(ds.pecheck);
        }
        return;
      }

      // 整组全选 / 全不选
      if (ds.pall !== undefined) {
        const on = ds.pall === '1';
        peItemsOf(ds.pgroup).forEach(it => SCHEMA.setPeChecked(R, ds.pgroup, it.key, on));
        saveCurrent();
        // 就地刷新，不调 render()：
        // render() 末尾会 window.scrollTo({top:0})，刚勾完的卡片瞬间离开视野，
        // 用户得重新滚回去，体验上等于「点了没反应」。整页重绘还会重置所有
        // <details> 的展开状态、让正在编辑的 textarea 失焦。
        // 状态判定与计数都只在 DOM 上已存在的节点里改，够用。
        $$(`[data-pe-group="${ds.pgroup}"]`).forEach(item => {
          const ta = item.querySelector('.pe-text');
          if (ta) refreshPeBadge(ta);
        });
        refreshPeCount(ds.pgroup);
        return;
      }

      // 关闭存储告警（只关横幅，不解锁——锁只能靠明确的重建动作解除）
      if (ds.dismissAlert !== undefined) {
        storageAlert = '';
        const el = document.getElementById('storageAlert');
        if (el) el.remove();
        return;
      }

      // 导出损坏的原始数据：原文逐字节给出去，不做任何加工
      if (ds.exportCorrupt !== undefined) {
        const which = ds.exportCorrupt === 'list' ? 'list' : 'current';
        const raw = which === 'list' ? corruptListRaw : corruptCurrentRaw;
        if (!raw) { toast('没有可导出的原始数据'); return; }
        const name = which === 'list'
          ? `损坏的病历列表_原始数据_${SCHEMA.todayStr()}.txt`
          : `损坏的当前病历_原始数据_${SCHEMA.todayStr()}.txt`;
        downloadBlob(raw, name, 'text/plain');
        toast('原始数据已导出，请留好这份文件');
        return;
      }

      // 明确确认后清除损坏槽、解除写入锁
      if (ds.discardCorrupt !== undefined) {
        const which = ds.discardCorrupt === 'list' ? 'list' : 'current';
        const ok = confirm(which === 'list'
          ? '新建空列表？损坏的原始列表会被清除，且无法恢复。建议先点「导出原始列表」留底。'
          : '新建空白病历？损坏的原始病历会被清除，且无法恢复。建议先点「导出原始损坏数据」留底。');
        if (!ok) return;
        if (which === 'list') discardCorruptList(); else discardCorruptCurrent();
        toast(which === 'list' ? '已新建空列表' : '已新建空白病历，可以开始写了');
        render();
        return;
      }

      // 跳转到某个系统 / 查体分组
      if (ds.jump !== undefined) {
        const target = document.getElementById(
          ds.jump.startsWith('pe-') ? ds.jump : 'ros-group-' + ds.jump
        );
        if (target) {
          target.open = true;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // 操作按钮
      const act = ds.act;
      if (act) handleAction(act, t);
      if (ds.addhint) {
        R.diagnosis.confirmed.push(ds.addhint);
        saveCurrent();
        render();
      }
      if (ds.auxdel !== undefined) {
        R.auxiliary.items.splice(parseInt(ds.auxdel, 10), 1);
        // 保底一行时也要给全字段，否则新加的 date/hospital/no 输入框取不到值
        if (!R.auxiliary.items.length) R.auxiliary.items = [{ name: '', result: '', date: '', hospital: '', no: '' }];
        saveCurrent();
        render();
      }
      if (ds.diagdel !== undefined) {
        R.diagnosis.confirmed.splice(parseInt(ds.diagdel, 10), 1);
        saveCurrent();
        render();
      }
    });

    // 下拉框
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.path) {
        setPath(R, t.dataset.path, t.value);
        saveCurrent();
        if (t.dataset.path === 'basic.department') render();
      }
    });
  }

  function handleAction(act, el) {
    switch (act) {
      case 'draftHpi': {
        R.hpi = GENERATOR.draftHPI(R);
        saveCurrent();
        render();
        toast('已生成现病史初稿，请补充修改');
        break;
      }
      case 'draftSummary': {
        snapshot('生成摘要');
        R.summary = '';  // 先清空，让它自动生成
        const draft = GENERATOR.draftSummary(R);
        R.summary = draft;
        CORE.markDocumentGenerated(R, 'summary');
        saveCurrent();
        render();
        toast('已生成摘要初稿，请核对');
        break;
      }
      case 'updateSummary': {
        snapshot('更新摘要');
        R.summary = GENERATOR.draftSummary(R);
        CORE.markDocumentGenerated(R, 'summary');
        saveCurrent();
        render();
        toast('已采用最新草稿；旧摘要仍可通过撤销恢复');
        break;
      }
      case 'resolveMarriage': {
        CORE.resolveMarriage(R, String(el.dataset.value || ''));
        saveCurrent();
        render();
        toast('婚姻状态已统一，之后只维护这一个字段');
        break;
      }
      case 'keepSummary': {
        CORE.markDocumentReviewed(R, 'summary');
        saveCurrent();
        render();
        toast('已按当前文字标记核对；资料再变化时会重新提示');
        break;
      }
      case 'undoDoc': {
        undoLast();
        break;
      }
      case 'rosAllNegative': {
        // ⚠️ 缺陷1第2条连带项：旧实现是 `R.ros = {}`，而那正是「未问」的状态，
        // 却弹出 toast「已全部标记为阴性」——按钮做的事和说的话相反。
        // 现在把每个症状显式写成 negative:true（这才真的是「标记为阴性」），
        // 阳性项会被清掉并计入确认文案，不再是静默删除。
        const posCount = SCHEMA.ROS.reduce((n, sys) => {
          const s = R.ros[sys.key] || {};
          return n + sys.symptoms.filter(x => (s[x.key] || {}).checked).length;
        }, 0);
        const msg = posCount
          ? `确定要把所有系统回顾项目都标记为阴性吗？已选的 ${posCount} 个阳性项会被清除。`
          : '确定要把所有系统回顾项目都标记为阴性吗？标记后病历里会逐系统写「无…」。';
        if (!confirm(msg)) return;
        R.ros = {};
        SCHEMA.ROS.forEach(sys => {
          const store = R.ros[sys.key] = {};
          sys.symptoms.forEach(sym => { store[sym.key] = { checked: false, negative: true, time: '', detail: '' }; });
        });
        saveCurrent();
        render();
        toast('已全部标记为阴性（病历里会逐系统写「无…」）');
        break;
      }
      case 'rosClearAll': {
        // 与「全部标记为阴性」相反的操作：回到「未问」，病历里系统回顾写「／」。
        if (!confirm('确定要把系统回顾全部清空吗？清空后视为「未问」，病历里这一节只写「／」。')) return;
        R.ros = {};
        saveCurrent();
        render();
        toast('已清空：视为未问，病历里不会写任何阴性症状');
        break;
      }
      case 'rosExpandAll': {
        const groups = $$('.ros-group');
        const anyClosed = groups.some(g => !g.open);
        groups.forEach(g => { g.open = anyClosed; });
        break;
      }
      case 'fillVitalsNormal': {
        // 只展示对照示例，不写入任何数字：未实测的生命体征不能被当成患者事实
        const normal = { temperature: '36.5', pulse: '78', respiration: '18', sbp: '120', dbp: '80' };
        const msg = '以下只是示例数值，不是患者的实测结果：\n\n'
          + `体温 ${normal.temperature} ℃、脉搏 ${normal.pulse} 次/分、呼吸 ${normal.respiration} 次/分、血压 ${normal.sbp}/${normal.dbp} mmHg\n\n`
          + '这些数字不会写入病历。请按实际测量值逐项填写。';
        if (!window.confirm(msg)) return;
        vitalsExample = normal;
        render();
        toast('示例值仅供参考，未写入病历');
        break;
      }
      case 'jumpPath': {
        jumpToPath(String(el.dataset.path || ''));
        break;
      }
      case 'viewTemplateFill': { viewTemplateFill(); break; }
      case 'undoTemplateFill': { undoTemplateFill(); break; }
      case 'confirmPe': {
        const path = String(el.dataset.path || '');
        const m = path.match(/^pe\.([^.]+)\.(.+)$/);
        if (!m) return;
        const containerKey = m[1], itemKey = m[2];
        const groupKey = containerKey;
        const it = peItemsOf(groupKey).find(x => x.key === itemKey);
        const val = String((R.pe[containerKey] || {})[itemKey] || '');
        const checked = SCHEMA.peChecked(R, groupKey, itemKey);
        const shown = val || (checked && it ? SCHEMA.peNormalText(it) : '');
        if (!shown) { toast('这一项还没有可核对的内容'); return; }
        const prev = CORE.fieldState(R, path);
        CORE.setFieldState(R, path, {
          source: prev.source || (val ? 'manual' : 'default'),
          reviewed: true,
          reviewedValueHash: CORE.fingerprint(shown)
        });
        saveCurrent();
        render();
        toast('已确认这一项的描述');
        break;
      }
      case 'confirmAllPe': {
        const groupKey = String(el.dataset.group || '');
        const containerKey = String(el.dataset.container || groupKey);
        const items = peItemsOf(groupKey);
        const pending = [];
        items.forEach(it => {
          const val = String((R.pe[containerKey] || {})[it.key] || '');
          const checked = SCHEMA.peChecked(R, groupKey, it.key);
          const shown = val || (checked ? SCHEMA.peNormalText(it) : '');
          if (!shown) return;
          const path = `pe.${containerKey}.${it.key}`;
          if (peReviewValid(path, shown)) return;
          pending.push({ path, label: it.label, shown, source: val ? 'manual' : 'default' });
        });
        if (!pending.length) { toast('本组没有待确认的描述'); return; }
        const msg = '将确认以下 ' + pending.length + ' 项的实际输出文字：\n\n'
          + pending.map((p, i) => `${i + 1}. ${p.label}：${p.shown}`).join('\n')
          + '\n\n确认后若文字再变化，会自动回到待核对。';
        if (!window.confirm(msg)) return;
        snapshot('批量确认查体描述');
        pending.forEach(p => {
          CORE.setFieldState(R, p.path, {
            source: p.source, reviewed: true, reviewedValueHash: CORE.fingerprint(p.shown)
          });
        });
        saveCurrent();
        render();
        toast(`已确认 ${pending.length} 项查体描述`);
        break;
      }
      case 'addAux': {
        R.auxiliary.items.push({ name: '', result: '', date: '', hospital: '', no: '' });
        saveCurrent();
        render();
        break;
      }
      case 'addDiag': {
        const inp = $('#diagNew');
        const v = (inp && inp.value || '').trim();
        if (!v) { toast('请先输入诊断内容'); return; }
        R.diagnosis.confirmed.push(v);
        saveCurrent();
        render();
        toast('已添加诊断');
        break;
      }
      // 首次病程录：按已填内容生成初稿（只补空字段，不覆盖手写内容）
      case 'loadRemote': {
        if (!remoteConflict || !remoteConflict.remote) return;
        const rec = CORE.normalizeRecord(remoteConflict.remote, SCHEMA.emptyRecord, deptKeys());
        if (!rec.ok) { toast('新版本无法读取，已保留当前内容'); return; }
        R = rec.record;
        remoteConflict = null;
        storageAlert = '';
        saveCurrent();
        render();
        toast('已载入其他页面保存的新版本');
        break;
      }
      case 'keepCopy': {
        if (!remoteConflict) return;
        // 两份内容都保留：当前内存内容另存为副本，新版本仍在原 ID 下
        const copy = CORE.cloneValue(R);
        copy.id = CORE.uid();
        copy.meta = copy.meta || {};
        copy.meta.revision = 0;
        copy.meta.updatedAt = new Date().toISOString();
        if (copy.basic) {
          copy.basic.name = (copy.basic.name || '未命名') + '（副本）';
        }
        LIST = CORE.upsertRecord(LIST, copy, new Date().toISOString()).list;
        saveList();
        R = copy;
        remoteConflict = null;
        storageAlert = '';
        saveCurrent();
        render();
        toast('已保留为副本；原病历的新版本仍在病历列表中');
        break;
      }
      case 'draftSoap': {
        snapshot('生成首次病程录');
        const soap = ensureSoap();
        // 四段各自用生成器里对外的兜底草稿函数，避免把成品文本再切回来。
        // 只补空白段，已有手写内容一律不动。
        const fillSeg = (seg, key, text) => {
          if (String(soap[key] || '').trim()) return;
          if (!text) return;
          soap[key] = text;
          CORE.markDocumentGenerated(R, 'firstCourse', seg);
        };
        fillSeg('s', 'summary', GENERATOR.draftCaseSummary(R) || '');
        fillSeg('oPe', 'pe', GENERATOR.draftObjectivePE(R) || '');
        fillSeg('oAux', 'aux', GENERATOR.draftObjectiveAux(R) || '');
        fillSeg('basis', 'basis', GENERATOR.buildBasisSection(R) || '');
        if (!soap.a.basisDetail.length && typeof GENERATOR.draftBasisDetail === 'function') {
          soap.a.basisDetail = GENERATOR.draftBasisDetail(R) || [];
        }
        saveCurrent();
        render();
        toast('已补全空白段落，已有手写内容未改动');
        break;
      }
      case 'updateSoapSeg': {
        const seg = String(el.dataset.seg || '');
        if (!SOAP_SEG_DRAFT[seg]) return;
        const soap = ensureSoap();
        const key = { s: 'summary', oPe: 'pe', oAux: 'aux', basis: 'basis' }[seg];
        snapshot('更新 SOAP ' + seg);
        soap[key] = SOAP_SEG_DRAFT[seg](R) || '';
        CORE.markDocumentGenerated(R, 'firstCourse', seg);
        saveCurrent();
        render();
        toast('已更新该段，其他段落未改动');
        break;
      }
      case 'reviewSoapSeg': {
        const seg = String(el.dataset.seg || '');
        CORE.markDocumentReviewed(R, 'firstCourse', seg);
        saveCurrent();
        render();
        toast('已按当前文字标记核对');
        break;
      }
      case 'addSoapBasis': {
        ensureSoap().a.basisDetail.push({ diagnosis: '', history: '', pe: '', aux: '' });
        saveCurrent();
        render();
        break;
      }
      case 'addSoapDiff': {
        ensureSoap().a.diff.push({ diagnosis: '', why: '', against: '', points: '' });
        saveCurrent();
        render();
        break;
      }
      case 'addSoapPlan': {
        ensureSoap().p.perDiagnosis.push({ diagnosis: '', exam: '', treatment: '' });
        saveCurrent();
        render();
        break;
      }
      case 'addDischargeDiag': {
        const d = ensureDischarge();
        d.diagnoses.push('');
        d.diagnosesConfirmed = false;
        saveCurrent();
        render();
        break;
      }
      case 'importDischargeDx': {
        const src = (R.diagnosis && R.diagnosis.confirmed) || [];
        const cleaned = src.map(x => String(x || '').trim()).filter(Boolean);
        if (!cleaned.length) { toast('初步诊断还没有内容，先填写初步诊断'); return; }
        const msg = '将把以下初步诊断带入出院诊断（保留「？」等待查标记）：\n\n'
          + cleaned.map((x, i) => `${i + 1}. ${x}`).join('\n')
          + '\n\n带入后仍可逐条修改、排序、删除，并需要单独确认。';
        if (!window.confirm(msg)) return;
        snapshot('从初步诊断带入出院诊断');
        const d = ensureDischarge();
        d.diagnoses = cleaned.slice();
        d.diagnosesConfirmed = false;
        CORE.markDocumentGenerated(R, 'discharge', 'diagnoses');
        saveCurrent();
        render();
        toast('已带入，请核对后点「确认出院诊断」');
        break;
      }
      case 'confirmDischargeDx': {
        const d = ensureDischarge();
        const list = (d.diagnoses || []).map(x => String(x || '').trim()).filter(Boolean);
        if (!list.length) { toast('出院诊断还没有内容'); return; }
        d.diagnosesConfirmed = true;
        CORE.markDocumentReviewed(R, 'discharge', 'diagnoses');
        saveCurrent();
        render();
        toast('出院诊断已确认；初步诊断再变化时会提示差异');
        break;
      }
      case 'updateAdmitCondition': {
        snapshot('更新入院情况');
        R.discharge.admitCondition = GENERATOR.draftAdmitCondition(R) || '';
        CORE.markDocumentGenerated(R, 'discharge', 'admitCondition');
        saveCurrent();
        render();
        toast('已按当前资料重写入院情况；旧文字可通过撤销恢复');
        break;
      }
      case 'copyText': {
        const cur = currentOutput();
        copyToClipboard(cur.text);
        break;
      }
      case 'downloadTxt': {
        const cur = currentOutput();
        downloadText(cur.text, cur.label);
        break;
      }
      case 'copySection': {
        showSectionPicker();
        break;
      }
    }
  }

  /** 取（必要时补建）SOAP 结构，兼容旧存档缺字段的情况 */
  function ensureSoap() {
    if (!R.soap || typeof R.soap !== 'object') R.soap = {};
    const s = R.soap;
    ['s', 'o', 'a', 'p'].forEach(k => {
      if (!s[k] || typeof s[k] !== 'object') s[k] = {};
    });
    ['summary', 'consistency'].forEach(k => { if (typeof s.s[k] !== 'string') s.s[k] = ''; });
    ['pe', 'aux'].forEach(k => { if (typeof s.o[k] !== 'string') s.o[k] = ''; });
    ['basis', 'ranking', 'diffNote'].forEach(k => { if (typeof s.a[k] !== 'string') s.a[k] = ''; });
    ['principle', 'individual'].forEach(k => { if (typeof s.p[k] !== 'string') s.p[k] = ''; });
    if (!Array.isArray(s.a.basisDetail)) s.a.basisDetail = [];
    if (!Array.isArray(s.a.diff)) s.a.diff = [];
    if (!Array.isArray(s.p.perDiagnosis)) s.p.perDiagnosis = [];
    return s;
  }

  /** 取（必要时补建）重点查体结构，兼容旧存档 */
  function ensureFocusPE() {
    if (!R.focusPE || typeof R.focusPE !== 'object') R.focusPE = { keys: [], note: '' };
    if (!Array.isArray(R.focusPE.keys)) R.focusPE.keys = [];
    if (typeof R.focusPE.note !== 'string') R.focusPE.note = '';
    return R.focusPE;
  }

  /** 取（必要时补建）出院记录结构 */
  function ensureDischarge() {
    if (!R.discharge || typeof R.discharge !== 'object') R.discharge = {};
    const d = R.discharge;
    if (!d.advice || typeof d.advice !== 'object') d.advice = {};
    ['drug', 'nonDrug', 'lifestyle', 'followUp'].forEach(k => {
      if (typeof d.advice[k] !== 'string') d.advice[k] = '';
    });
    if (!Array.isArray(d.diagnoses)) d.diagnoses = [];
    ['dischargeDate', 'admitCondition', 'course', 'dischargeStatus'].forEach(k => {
      if (typeof d[k] !== 'string') d[k] = '';
    });
    return d;
  }

  /* ========================= 复制 / 下载 ========================= */

  function toast(msg) {
    let box = $('#toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    box.classList.add('show');
    clearTimeout(box.__t);
    box.__t = setTimeout(() => box.classList.remove('show'), 1800);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 兼容 file:// 打开的情况
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const copied = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!copied) throw new Error('复制未成功');
      }
      toast('已复制到剪贴板');
    } catch (err) {
      // 最后兜底：弹出手动复制框
      showManualCopy(text);
    }
  }

  function showManualCopy(text) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">请长按全选后复制</div>
        <textarea class="modal-ta" readonly>${esc(text)}</textarea>
        <div class="btn-row">
          <button class="btn" data-close>关闭</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', async ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) wrap.remove();
    });
    const ta = wrap.querySelector('textarea');
    ta.focus();
    ta.select();
  }

  function showSectionPicker() {
    const res = GENERATOR.generate(R);
    const names = GENERATOR.SECTION_ORDER.filter(n => res.sections[n]);
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">选择要复制的段落</div>
        <div class="sec-pick">
          ${names.map(n => `<button class="btn btn-ghost" data-sec="${esc(n)}">${esc(n)}</button>`).join('')}
        </div>
        <div class="btn-row"><button class="btn" data-close>关闭</button></div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', async ev => {
      if (ev.target.hasAttribute('data-close') || ev.target === wrap) wrap.remove();
      const sec = ev.target.dataset.sec;
      if (sec) {
        copyToClipboard(`${sec}：${res.sections[sec]}`);
        wrap.remove();
      }
    });
  }

  function downloadText(text, label) {
    const name = (R.basic.name || '患者') + '_' + (label || '大病历') + '_' +
      (R.basic.recordDate || SCHEMA.todayStr()) + '.txt';
    const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已开始下载');
  }

  /* ========================= 病历列表 ========================= */

  // 对比整个病历与空白记录，忽略自动生成的元数据及界面设置。
  function hasRecordContent(record) {
    const blank = SCHEMA.emptyRecord();
    function differs(value, base, path) {
      if (path === 'meta' || path === 'id' || path === 'updatedAt' || path.startsWith('__')) return false;
      if (value && typeof value === 'object') {
        return Object.keys(value).some(k => differs(value[k], base && base[k], path ? path + '.' + k : k));
      }
      if (base === undefined && (value === '' || value == null || value === false)) return false;
      return value !== base;
    }
    return differs(record, blank, '');
  }

  /** 打开病历：优先读该 id 的最新草稿，草稿缺失/损坏时才退回列表快照 */
  function recordForOpen(id, fallback) {
    const draft = CORE.loadCurrent(localStorage, SCHEMA.emptyRecord, deptKeys(), id);
    if (draft.ok && draft.record) return draft.record;
    if (fallback) {
      try {
        return CORE.normalizeRecord(JSON.parse(JSON.stringify(fallback)), SCHEMA.emptyRecord, deptKeys());
      } catch (e) {
        return deepMerge(SCHEMA.emptyRecord(), JSON.parse(JSON.stringify(fallback)));
      }
    }
    return null;
  }

  function switchRecord(next) {
    const previous = R;
    const go = saved => {
      if (!saved) return false;
      R = next;
      setSessionId(next.id);
      step = 0;
      return true;
    };
    // 先落盘上一份（有锁时等锁内比较完成），避免切换后只留下下一份。
    // 内容没改过就不写：无意义的修订号自增会让另一个标签页的正常编辑变成冲突。
    if (!previous) return go(true);
    if (CORE.draftMatches(localStorage, previous)) return go(true);
    return afterSave(saveCurrentAwait(), go);
  }

  function openList() {
    loadList();
    const rows = CORE.sortByUpdated(LIST).map(item => {
      const s = CORE.summarize(item);
      const dept = (SCHEMA.DEPARTMENTS.find(d => d.key === s.department) || {}).name || '通用';
      return `
        <div class="list-row">
          <div class="list-main" data-open="${esc(s.id)}">
            <div class="list-name">${esc(s.name)}
              <span class="list-meta">${esc(s.gender)} ${esc(AGE.display({ age: s.age, birthDate: s.birthDate, admitDate: s.admitDate }))}</span>
            </div>
            <div class="list-sub">${esc(dept)} · ${esc((s.chiefComplaint || '无主诉').slice(0, 20))}</div>
            <div class="list-sub muted">更新于 ${esc(fmtTime(s.updatedAt))}</div>
          </div>
          <button class="btn-del" data-del="${esc(s.id)}">删除</button>
        </div>`;
    }).join('');

    const alertHtml = storageAlert
      ? `<div class="warn-item" style="margin-bottom:10px">${esc(storageAlert)}</div>` : '';

    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `
      <div class="modal">
        <div class="modal-title">我的病历（${LIST.length}）</div>
        ${alertHtml}
        <div class="list-box">${rows || '<div class="empty">还没有保存的病历</div>'}</div>
        <div class="btn-row">
          <button class="btn" data-new>新建病历</button>
          <button class="btn btn-ghost" data-backup>导出备份</button>
          <button class="btn btn-ghost" data-backup-current>导出当前病历</button>
          <button class="btn btn-ghost" data-import-file>导入备份</button>
          <button class="btn btn-ghost" data-close>关闭</button>
        </div>
        <div class="hint">病历和备份文件未加密，请妥善保管。数据只存在本机浏览器；换设备或清理数据前请先备份。</div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.addEventListener('click', async ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) { wrap.remove(); return; }
      if (ev.target.hasAttribute('data-backup')) { exportBackup(); return; }
      if (ev.target.hasAttribute('data-backup-current')) { exportCurrentBackup(); return; }
      if (ev.target.hasAttribute('data-import-file')) { wrap.remove(); importBackup(); return; }
      if (ev.target.hasAttribute('data-new')) {
        if (hasRecordContent(R)) {
          if (!confirm('新建病历？当前病历会先保存。')) return;
          if (!(await saveToLibrary())) { wrap.remove(); render(); return; }
        }
        if (!(await switchRecord(newRecord()))) { wrap.remove(); render(); return; }
        wrap.remove();
        render();
        return;
      }
      const delId = ev.target.dataset.del;
      if (delId) {
        if (!confirm('确定删除这份病历？删除后无法恢复，建议先导出备份。')) return;
        LIST = CORE.removeRecord(LIST, delId);
        await saveListAwait({ replace: true });
        wrap.remove();
        openList();
        return;
      }
      const openId = ev.target.closest('[data-open]') && ev.target.closest('[data-open]').dataset.open;
      if (openId) {
        let found = CORE.findRecord(LIST, openId);
        if (!found) return;
        if (!confirm('打开这份病历？当前病历会先保存。')) return;
        if (hasRecordContent(R) && !(await saveToLibrary())) { wrap.remove(); render(); return; }
        // 保存当前记录可能刚好更新了用户选择的那一条。
        found = CORE.findRecord(LIST, openId) || found;
        // 用 core 规范化，兼容旧版本存档
        const next = recordForOpen(found.id, found.data || found);
        if (!next) { wrap.remove(); render(); return; }
        next.id = found.id;
        if (!(await switchRecord(next))) { wrap.remove(); render(); return; }
        wrap.remove();
        render();
      }
    });
  }

  function saveToLibrary() {
    if (!R) return false;
    loadList();
    // 已知损坏时不写任何槽，避免覆盖原始数据。
    if (listSaveBlocked || currentSaveBlocked) {
      storageAlert = listSaveBlocked
        ? '病历列表读不出来，已停止写入以免覆盖原数据。这次保存没有写入任何内容，'
          + '当前编辑的病历也保持原样。请先导出原始数据或新建列表。'
        : '当前病历读不出来，已停止写入以免覆盖损坏的原始数据。这次保存没有写入任何内容。'
          + '请先导出原始数据，或确认后新建空白病历。';
      return false;
    }
    const before = { id: R.id, updatedAt: R.updatedAt };
    const res = CORE.upsertRecord(LIST, R, new Date().toISOString());
    R.id = res.id;
    R.updatedAt = res.list.find(x => x.id === res.id).updatedAt;
    // 先保存当前记录和稳定 ID；若列表写失败，重试会更新同一条记录。
    // 有 Web Locks 时 saveCurrentAwait 返回 Promise，必须等草稿真正落盘再写列表，
    // 否则「列表已保存、草稿没保存」会被当成成功。
    const finish = saved => {
      if (!saved) {
        R.id = before.id;
        R.updatedAt = before.updatedAt;
        return false;
      }
      LIST = res.list;
      const listed = ok => {
        if (!ok) {
          storageAlert = '当前病历已保存在本机编辑槽，但未能写入病历列表。请先导出当前病历，再重试保存。';
          return false;
        }
        storageAlert = '';
        return true;
      };
      return afterSave(saveListAwait(), listed);
    };
    return afterSave(saveCurrentAwait(), finish);
  }

  /* ========================= 备份导出 / 导入 ========================= */

  function exportBackup() {
    // 当前草稿可能比列表里的版本更新，导出前必须让用户明确选择
    const includeDraft = !!R && window.confirm(
      '备份默认包含已保存到「病历列表」的记录。\n\n' +
      '是否同时包含当前正在编辑的最新草稿？\n' +
      '（选「确定」= 包含最新草稿；选「取消」= 只导出病历列表）'
    );
    const payload = CORE.buildExport(LIST, new Date().toISOString(), { includeDraft, draft: R });
    if (!payload.records.length) {
      toast('还没有保存的病历可导出');
      return;
    }
    const name = `大病历备份_${SCHEMA.todayStr()}.json`;
    downloadBlob(JSON.stringify(payload, null, 2), name, 'application/json');
    toast(`已导出 ${payload.records.length} 份病历${payload.includesDraft ? '（含当前草稿）' : ''}`);
  }

  function exportCurrentBackup() {
    const record = CORE.upsertRecord([], R, new Date().toISOString()).list;
    const payload = CORE.buildExport(record, new Date().toISOString());
    downloadBlob(JSON.stringify(payload, null, 2), `当前病历备份_${SCHEMA.todayStr()}.json`, 'application/json');
    toast('已导出当前病历，请妥善保管未加密的备份');
  }

  function downloadBlob(text, filename, mime) {
    const blob = new Blob(['\ufeff' + text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** 选择备份文件并预览，用户确认后才真正合并 */
  function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let parsed;
        try {
          parsed = CORE.parseImport(String(reader.result), SCHEMA.emptyRecord, deptKeys());
        } catch (e) {
          showModal('导入失败', `<div class="warn-item">${esc(e.message)}</div>
            <div class="hint">你的现有病历没有任何改动。</div>`);
          return;
        }
        previewImport(parsed);
      };
      reader.onerror = () => showModal('导入失败', '<div class="warn-item">无法读取该文件</div>');
      reader.readAsText(file, 'utf-8');
    });
    input.click();
  }

  /**
   * 把导入结果落盘，返回 { ok, res }。
   * 单独抽出来是因为「合并」和「替换」对写入锁的态度相反：
   *   · 合并要读现有列表，列表读不出来时读到的空数组会覆盖掉原来的记录 → 一律不写
   *   · 替换是用户明确选择的破坏行为，是列表损坏时唯一允许覆盖的入口 → 先解锁再写
   */
  function applyImport(mode, records) {
    loadList();
    if (mode === 'merge') {
      if (listSaveBlocked) {
        storageAlert = '病历列表读不出来，已停止合并导入以免覆盖原数据。'
          + '这次导入没有写入任何内容。请先导出原始列表或新建列表。';
        return { ok: false, blocked: true };
      }
      const res = CORE.mergeImport(LIST, records);
      LIST = res.list;
      return { ok: saveList(), res };
    }
    if (listSaveBlocked) {
      listSaveBlocked = false;
      corruptListRaw = '';
    }
    LIST = CORE.replaceImport(records);
    return { ok: saveList({ replace: true }), replaced: LIST.length };
  }

  /** 导入预览：显示条数与摘要，让用户选择合并或替换 */
  function previewImport(parsed) {
    const rows = parsed.records.map(r => {
      const s = CORE.summarize(r);
      const dept = (SCHEMA.DEPARTMENTS.find(d => d.key === s.department) || {}).name || '通用';
      return `<div class="list-row">
        <div class="list-main">
          <div class="list-name">${esc(s.name)} <span class="list-meta">${esc(s.gender)} ${esc(AGE.display({ age: s.age, birthDate: s.birthDate, admitDate: s.admitDate }))}</span></div>
          <div class="list-sub">${esc(dept)} · ${esc((s.chiefComplaint || '无主诉').slice(0, 18))}</div>
        </div>
      </div>`;
    }).join('');

    showModal('导入预览', `
      <div class="hint">共 ${parsed.records.length} 份病历。选择处理方式：</div>
      <div class="list-box">${rows}</div>
      <div class="hint">· <b>合并</b>：保留现有病历，同 ID 时以更新时间较新的为准<br>
      · <b>替换</b>：清空当前列表，只保留导入的内容</div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn" data-import="merge">合并导入</button>
        <button class="btn btn-ghost" data-import="replace">替换全部</button>
        <button class="btn btn-ghost" data-close>取消</button>
      </div>
    `, wrap => {
      wrap.addEventListener('click', async ev => {
        const mode = ev.target.dataset.import;
        if (!mode) return;
        if (mode === 'replace') {
          if (!confirm('替换会清空当前列表中的全部病历，确定继续？')) return;
          // 列表已损坏时多问一句，并提示先留底
          if (listSaveBlocked && !confirm('现有列表已经读不出来，替换会连原始数据一起清掉。'
            + '建议先点顶部横幅里的「导出原始列表」留底。仍要继续？')) return;
        }
        const out = applyImport(mode, parsed.records);
        wrap.remove();
        if (mode === 'merge') {
          toast(out.ok
            ? `已导入：新增 ${out.res.added}，更新 ${out.res.updated}，跳过 ${out.res.skipped}`
            : '导入没有写入，请查看页面顶部提示');
        } else {
          toast(out.ok ? `已替换为导入的 ${out.replaced} 份病历` : '替换没有写入，请查看页面顶部提示');
        }
        openList();
      });
    });
  }

  /** 通用弹窗 */
  function showModal(title, bodyHtml, setup) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-mask';
    wrap.innerHTML = `<div class="modal">
      <div class="modal-title">${esc(title)}</div>
      ${bodyHtml}
    </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', async ev => {
      if (ev.target === wrap || ev.target.hasAttribute('data-close')) wrap.remove();
    });
    if (setup) setup(wrap);
    return wrap;
  }

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ========================= 初始化 ========================= */

  /**
   * 在线版离线缓存：只在 http(s) 下注册 Service Worker。
   * 本地 HTML（file://）不依赖 SW 才能工作。
   */
  function registerOffline() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        if (reg.active) toast('已可离线使用');
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              // 不强制刷新：用户可能正在编辑，下次打开生效
              toast('新版本已准备好，下次打开本页时生效');
            }
          });
        });
      }).catch(() => { /* 注册失败不影响正常使用 */ });
    });
  }

  function init() {
    loadSettings();
    if (!loadCurrent()) {
      R = newRecord();
    }

    // 回到上次停留的那一步。键不认识（改过步骤、旧存档）就退回第一步，
    // 不因为一个字符串对不上就让页面白屏。
    step = stepIndexOf(settings.lastStep);

    bindEvents();
    render();

    // 顶部按钮
    $('#btnPrev').addEventListener('click', () => {
      if (step > 0) { step--; render(); }
    });
    $('#btnNext').addEventListener('click', () => {
      if (step < STEPS.length - 1) { step++; render(); }
      else saveWithFeedback();
    });
    $('#btnSave').addEventListener('click', saveWithFeedback);
    $('#btnList').addEventListener('click', openList);
    // 整条 stepbar 都可以点开目录：手机上「目录 ▾」这几个字太小，
    // 手指落点低一两毫米就点空了，把标题行整条做成热区。
    // 只绑 stepBar 一处——btnNav 在它里面，再单独绑一次会冒泡成弹两层。
    $('#stepBar').addEventListener('click', openNav);
    $('#btnExport').addEventListener('click', () => {
      step = STEPS.length - 1;
      render();
    });

    // 版本号：手机端要能判断自己是不是还在用旧版
    const ver = document.getElementById('appVer');
    if (ver) ver.textContent = 'v' + APP_VERSION;
    registerOffline();

    // 自动保存
    setInterval(() => { saveCurrent(); }, 10000);

    // 防误关：尝试保存一次
    window.addEventListener('beforeunload', () => { saveCurrent(); });

    // 多标签页：只关心「同一份病历」的草稿键；不同病历各写各的槽位。
    window.addEventListener('storage', ev => {
      if (!ev || !ev.key || !ev.newValue) return;
      if (ev.key.indexOf(K.draftPrefix) !== 0) return;
      const id = ev.key.slice(K.draftPrefix.length);
      if (!R || id !== R.id) return;
      let rec = null;
      try { rec = JSON.parse(ev.newValue); } catch (e) { return; }
      if (!rec || rec.id !== R.id) return;
      const remoteRev = Number(rec.meta && rec.meta.revision) || 0;
      const mineRev = Number(R.meta && R.meta.revision) || 0;
      if (remoteRev <= mineRev) return;
      remoteConflict = { remote: rec, remoteRevision: remoteRev };
      storageAlert = '其他页面已保存了这份病历的更新版本（修订号 ' + remoteRev
        + '）。为避免互相覆盖，本页已暂停保存。';
      render();
    });

    // 回到前台时若之前有存储异常，重新渲染让提示可见
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && storageAlert) render();
    });
  }

  /** 保存并给出真实反馈（失败时绝不能提示"已保存"） */
  function saveWithFeedback() {
    const ok = saveToLibrary();
    if (ok) toast('已保存到本机');
    else {
      toast('保存失败，请查看页面顶部提示');
      render();
    }
    return ok;
  }

  return {
    init, getRecord: () => R, STEPS,
    // 供测试使用
    _test: {
      saveToLibrary,
      loadList: () => loadList(),
      getList: () => LIST,
      render,
      setRecord: r => { R = r; },
      newRecord: () => {
        const rec = newRecord();
        return afterSave(switchRecord(rec), ok => { if (ok) render(); return ok; });
      },
      openRecord: id => {
        loadList();
        const item = LIST.find(x => x.id === id) || CORE.findRecord(LIST, id);
        if (!item) return false;
        const next = recordForOpen(id, item.data || item);
        if (!next) return false;
        next.id = id;
        return afterSave(switchRecord(next), ok => { if (ok) render(); return ok; });
      },
      openList,
      gotoStep,
      stepIndexOf,
      getStepKey: () => (STEPS[step] || {}).key,
      getSettings: () => settings,
      // 模板病例：供测试直接调用（界面走 data-tpl 点击）
      applyTemplate,
      templatesOf: dept => (typeof TEMPLATES !== 'undefined' ? TEMPLATES.listByDept(dept) : []),
      // 生成视图：仅供测试断言三种视图各自可复制，不参与业务
      setOutputView: v => { OUT_VIEW = v; },
      getOutputView: () => OUT_VIEW,
      outputTextOf: v => outputTextOf(v || OUT_VIEW, null),
      // 问诊深度自查（界面走生成页的 renderDepthCard）
      depthOf: r => (typeof DEPTH !== 'undefined' ? DEPTH.check(r || R) : []),
      // 步骤导航：界面走 stepbar 点击，测试直接断言状态判定
      stepState,
      openNav,
      navRowsHtml: () => navRowsHtml(),
      // 存储写入锁：测试要能直接触发自动保存、普通保存，并读到锁状态
      saveCurrent, saveCurrentAwait, saveWithFeedback, saveList,
      currentSaveBlocked: () => currentSaveBlocked,
      listSaveBlocked: () => listSaveBlocked,
      corruptCurrentRaw: () => corruptCurrentRaw,
      corruptListRaw: () => corruptListRaw,
      storageAlertText: () => storageAlert,
      remoteConflict: () => remoteConflict,
      sessionId: () => getSessionId(),
      discardCorruptCurrent, discardCorruptList,
      // 导入合并/替换的落盘入口：列表损坏时合并必须整单不写，替换要能解锁
      applyImport
    }
  };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => APP.init());
}
