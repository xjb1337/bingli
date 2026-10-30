/* ===========================================================================
 * 数据边界层 —— 可独立测试
 *
 * 职责（对应参考项目 core.js 的定位）：
 *   1. 载入时把旧版本存档迁移/补齐到当前结构，损坏存档拒绝覆盖
 *   2. 严格校验导入的 JSON，拒绝危险键（原型污染）与非法结构
 *   3. 纯计算：病历列表增删改、去重、排序
 *   4. 导出/导入格式与恢复副本
 *
 * 本文件不接触 DOM、不读 localStorage，全部通过参数传入，因此可以在
 * node:test 里直接测试。副作用（真正读写存储）由 app.js 负责。
 * =========================================================================== */

const RECORD_CORE = (() => {
  'use strict';

  const SCHEMA_VERSION = 3;
  /** 存储键：v1 起沿用，升级不改变键名 */
  const STORAGE_KEYS = {
    list: 'dabingli.records.v1',
    // current 只存「上次打开的病历 id」指针；草稿本体按 id 分开存，
    // 这样两个标签页编辑不同病历时不会互相覆盖同一个槽位。
    current: 'dabingli.current.v1',
    draftPrefix: 'dabingli.draft.v1.',
    settings: 'dabingli.settings.v1'
  };

  function draftKey(id) {
    return STORAGE_KEYS.draftPrefix + String(id || '');
  }

  const fail = msg => { throw new Error(msg); };
  const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const isText = (x, max = 2 * 1024 * 1024) => typeof x === 'string' && x.length <= max;
  const isNum = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;

  /* ---------------------- 安全键检查（防原型污染） ---------------------- */

  const DANGEROUS = ['__proto__', 'constructor', 'prototype'];

  function assertSafeKeys(value, depth = 0) {
    if (depth > 20) fail('数据嵌套过深');
    if (!value || typeof value !== 'object') return;
    Object.keys(value).forEach(k => {
      if (DANGEROUS.includes(k)) fail('数据包含不安全字段：' + k);
      assertSafeKeys(value[k], depth + 1);
    });
  }

  /* ---------------------- 深度合并（补齐新增字段） ---------------------- */

  /**
   * 用 defaults 的结构补齐 obj，保留 obj 已有值。
   * 注意：新增的嵌套对象会被补齐，但 obj 中多出来的键也会保留，
   * 这样旧版本里已填的内容不会因结构变化而丢失。
   */
  function deepMerge(defaults, obj) {
    if (Array.isArray(defaults)) return Array.isArray(obj) ? obj : defaults;
    if (defaults && typeof defaults === 'object') {
      const out = {};
      const src = (obj && typeof obj === 'object') ? obj : {};
      Object.keys(defaults).forEach(k => { out[k] = deepMerge(defaults[k], src[k]); });
      Object.keys(src).forEach(k => { if (!(k in out)) out[k] = src[k]; });
      return out;
    }
    return obj === undefined ? defaults : obj;
  }

  /* ---------------------- 只填空白的合并（套用模板用） ---------------------- */

  /**
   * 「空」的判定。模板套用时只有空的字段才会被写入。
   *
   * 口径是刻意的：
   *   - 空串、纯空白串、undefined、null → 空
   *   - 数组：长度为 0，或所有元素都是「空」→ 空（辅助检查预置了一行空行）
   *   - 对象：所有值都是「空」→ 空
   *   - `false` 和 `0` **不算空**：false 是一个明确的「否」，
   *     0 可能真是测出来的 0，覆盖它就是篡改。
   */
  function isBlankValue(v) {
    if (v === undefined || v === null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.every(isBlankValue);
    if (isObject(v)) return Object.keys(v).every(k => isBlankValue(v[k]));
    return false;
  }

  function cloneValue(v) {
    if (Array.isArray(v)) return v.map(cloneValue);
    if (isObject(v)) {
      const out = {};
      Object.keys(v).forEach(k => { out[k] = cloneValue(v[k]); });
      return out;
    }
    return v;
  }

  /**
   * 把 source 里「有内容」的值填进 target 里「还是空的」字段，返回本次真正写入的路径列表。
   *
   * 为什么不是 deepMerge：
   *   deepMerge 是「用新结构补齐旧数据」，只要有键就保留旧值；
   *   而模板套用要的是「我填过的别动，我没填的按模板补」——判据是**值是否为空**，
   *   不是**键是否存在**。两者差一个「用户点过但留空」的场景，必须分开实现。
   *
   * 写入是原地改 target，返回值只用于告诉用户「这次补了多少项」。
   */
  function fillBlanks(target, source, path = '') {
    const filled = [];
    if (!isObject(target) || !isObject(source)) return filled;
    Object.keys(source).forEach(k => {
      const p = path ? path + '.' + k : k;
      const s = source[k];
      // 模板里没有内容的键直接跳过，避免把空值写成「已填过」
      if (isBlankValue(s)) return;
      if (isObject(s)) {
        if (!isObject(target[k])) target[k] = {};
        filled.push(...fillBlanks(target[k], s, p));
        return;
      }
      // 数组按整体套用：诊断列表、辅助检查列表这类，只要用户还没写就整组换成模板的。
      // 不做逐元素合并——用户的 1 条和模板的 3 条混在一起，主次就乱了。
      if (Array.isArray(s)) {
        if (isBlankValue(target[k])) {
          target[k] = cloneValue(s);
          filled.push(p);
        }
        return;
      }
      if (isBlankValue(target[k])) {
        target[k] = s;
        filled.push(p);
      }
    });
    return filled;
  }

  /* ---------------------- 指纹 / 字段状态 / 文书元数据 ---------------------- */

  /**
   * 稳定序列化：对象键排序，保证同样的资料得到同样的指纹。
   * 只用于判断「资料是否变化」，不是密码学哈希。
   */
  function stableStringify(value) {
    if (value === undefined) return 'undefined';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }

  /** FNV-1a 32 位，输出 8 位十六进制 */
  function hashText(text) {
    const s = String(text == null ? '' : text);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function fingerprint(value) {
    return hashText(stableStringify(value));
  }

  /** 取嵌套路径的值；路径不存在返回 undefined */
  function getPath(obj, path) {
    const parts = String(path || '').split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
      if (cur === null || cur === undefined) return undefined;
      if (DANGEROUS.includes(p)) return undefined;
      cur = cur[p];
    }
    return cur;
  }

  /** 写嵌套路径；中间对象不存在则创建 */
  function setPath(obj, path, value) {
    const parts = String(path || '').split('.').filter(Boolean);
    if (!parts.length || DANGEROUS.includes(parts[0])) return obj;
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (DANGEROUS.includes(p)) return obj;
      if (!isObject(cur[p])) cur[p] = {};
      cur = cur[p];
    }
    const last = parts[parts.length - 1];
    if (!DANGEROUS.includes(last)) cur[last] = value;
    return obj;
  }

  const FIELD_SOURCES = ['manual', 'template', 'default', 'example', 'generated', 'legacy', ''];

  function defaultFieldState() {
    return { source: '', reviewed: false, reviewedValueHash: '', sourceRef: '' };
  }

  function normalizeFieldState(raw) {
    const s = isObject(raw) ? raw : {};
    return {
      source: FIELD_SOURCES.includes(s.source) ? s.source : '',
      reviewed: s.reviewed === true,
      reviewedValueHash: isText(s.reviewedValueHash) ? s.reviewedValueHash : '',
      sourceRef: isText(s.sourceRef) ? s.sourceRef : ''
    };
  }

  function fieldState(record, path) {
    const states = (record && record.meta && record.meta.fieldStates) || {};
    return normalizeFieldState(states[path]);
  }

  function setFieldState(record, path, patch) {
    if (!record) return record;
    if (!isObject(record.meta)) record.meta = {};
    if (!isObject(record.meta.fieldStates)) record.meta.fieldStates = {};
    const prev = normalizeFieldState(record.meta.fieldStates[path]);
    record.meta.fieldStates[path] = { ...prev, ...(patch || {}) };
    return record;
  }

  /** 用户手改某字段：来源改成 manual，旧核对状态立即失效 */
  function markFieldManual(record, path, value) {
    setFieldState(record, path, {
      source: 'manual',
      reviewed: false,
      reviewedValueHash: '',
      sourceRef: ''
    });
    return record;
  }

  /** 确认某字段当前内容；核对状态与当前值指纹绑定 */
  function markFieldReviewed(record, path, source) {
    const v = getPath(record, path);
    const st = fieldState(record, path);
    return setFieldState(record, path, {
      source: source || st.source || 'manual',
      reviewed: true,
      reviewedValueHash: fingerprint(v)
    });
  }

  /** 核对是否仍然有效：内容变过就失效 */
  function fieldReviewValid(record, path, value) {
    const st = fieldState(record, path);
    // 默认查体的「实际输出文字」不在字段值里，核对状态要按生成时会写出的文字判断
    const v = value === undefined ? getPath(record, path) : value;
    return !!(st.reviewed && st.reviewedValueHash === fingerprint(v));
  }

  /** 把旧存档里所有有内容、但没有来源记录的字段标成 legacy */
  function markLegacyFields(record) {
    if (!record || !isObject(record.meta)) return record;
    if (!isObject(record.meta.fieldStates)) record.meta.fieldStates = {};
    const skip = new Set(['meta', 'documentMeta', 'schemaVersion', 'id']);
    const walk = (obj, path) => {
      Object.keys(obj).forEach(k => {
        if (!path && skip.has(k)) return;
        const p = path ? path + '.' + k : k;
        const v = obj[k];
        if (isObject(v)) { walk(v, p); return; }
        if (isBlankValue(v)) return;
        if (!record.meta.fieldStates[p]) {
          record.meta.fieldStates[p] = {
            source: 'legacy', reviewed: false, reviewedValueHash: '', sourceRef: ''
          };
        }
      });
    };
    walk(record, '');
    return record;
  }

  /* ---------------------- 生成段落的输入分组 ---------------------- */

  const GROUP_LABELS = {
    identity: '基本情况与主诉',
    hpi: '现病史',
    pe: '体格检查',
    aux: '辅助检查',
    diagnosis: '诊断'
  };

  function peValueGroups(record) {
    const pe = (record && record.pe) || {};
    const out = {};
    Object.keys(pe).forEach(k => {
      if (k === 'checked' || k === 'vitals') return;
      out[k] = pe[k];
    });
    return out;
  }

  function identityGroup(record) {
    const b = (record && record.basic) || {};
    return {
      department: b.department || '',
      name: b.name || '',
      gender: b.gender || '',
      age: b.age || '',
      birthDate: b.birthDate || '',
      admitDate: b.admitDate || '',
      marital: b.marital || '',
      chiefComplaint: b.chiefComplaint || '',
      chiefComplaintDuration: b.chiefComplaintDuration || '',
      chiefComplaintDurationUnit: b.chiefComplaintDurationUnit || '',
      admitDate: b.admitDate || '',
      recordDate: b.recordDate || ''
    };
  }

  function auxGroup(record) {
    const items = (record && record.auxiliary && record.auxiliary.items) || [];
    return items.map(it => ({
      name: (it && it.name) || '',
      result: (it && it.result) || '',
      date: (it && it.date) || '',
      hospital: (it && it.hospital) || '',
      no: (it && it.no) || ''
    }));
  }

  function summaryGroups(record) {
    return {
      identity: identityGroup(record),
      hpi: (record && record.hpi) || {},
      pe: {
        vitals: (record && record.pe && record.pe.vitals) || {},
        checked: (record && record.pe && record.pe.checked) || {},
        values: peValueGroups(record)
      },
      aux: auxGroup(record)
    };
  }

  function firstCourseGroups(record, section) {
    if (section === 's') return { identity: identityGroup(record), hpi: (record && record.hpi) || {} };
    if (section === 'oPe') return { pe: summaryGroups(record).pe };
    if (section === 'oAux') return { aux: auxGroup(record) };
    return {
      diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || [],
      hpi: (record && record.hpi) || {},
      pe: summaryGroups(record).pe,
      aux: auxGroup(record)
    };
  }

  function dischargeGroups(record, part) {
    if (part === 'diagnoses') return { diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || [] };
    return {
      identity: identityGroup(record),
      hpi: (record && record.hpi) || {},
      pe: summaryGroups(record).pe,
      diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || []
    };
  }

  /** 把分组数据折算成 {groups:{组:指纹}, fingerprint:总指纹} */
  function groupFingerprints(groups) {
    const out = {};
    Object.keys(groups).forEach(k => { out[k] = fingerprint(groups[k]); });
    return { groups: out, fingerprint: fingerprint(out) };
  }

  /** 对比保存时的分组指纹与当前分组，返回变化组标签 */
  function changedGroups(savedGroups, currentGroups) {
    const saved = isObject(savedGroups) ? savedGroups : {};
    const labels = [];
    Object.keys(currentGroups).forEach(k => {
      if (saved[k] !== currentGroups[k]) labels.push(GROUP_LABELS[k] || k);
    });
    return labels;
  }

  function emptyDocMeta() {
    return {
      origin: '', inputFingerprint: '', inputGroups: {},
      generatedTextHash: '', reviewedFingerprint: '', updatedAt: ''
    };
  }

  function docMeta(record, kind, section) {
    const dm = (record && record.documentMeta) || {};
    if (kind === 'summary') return { ...emptyDocMeta(), ...(dm.summary || {}) };
    if (kind === 'firstCourse') {
      const fc = dm.firstCourse || {};
      return { ...emptyDocMeta(), ...(fc[section || 's'] || {}) };
    }
    if (kind === 'discharge') {
      const d = dm.discharge || {};
      const key = section || 'admitCondition';
      return { ...emptyDocMeta(), ...(d[key] || {}) };
    }
    return emptyDocMeta();
  }

  function ensureDocMeta(record, kind, section) {
    if (!isObject(record.documentMeta)) record.documentMeta = {};
    if (kind === 'summary') {
      if (!isObject(record.documentMeta.summary)) record.documentMeta.summary = emptyDocMeta();
      return record.documentMeta.summary;
    }
    if (kind === 'firstCourse') {
      if (!isObject(record.documentMeta.firstCourse)) record.documentMeta.firstCourse = {};
      const key = section || 's';
      if (!isObject(record.documentMeta.firstCourse[key])) record.documentMeta.firstCourse[key] = emptyDocMeta();
      return record.documentMeta.firstCourse[key];
    }
    if (kind === 'discharge') {
      if (!isObject(record.documentMeta.discharge)) record.documentMeta.discharge = {};
      const key = section || 'admitCondition';
      if (!isObject(record.documentMeta.discharge[key])) {
        record.documentMeta.discharge[key] = key === 'diagnoses'
          ? { origin: '', inputFingerprint: '', textHash: '', confirmed: false, confirmedFingerprint: '' }
          : emptyDocMeta();
      }
      return record.documentMeta.discharge[key];
    }
    return emptyDocMeta();
  }

  function docText(record, kind, section) {
    if (kind === 'summary') return String((record && record.summary) || '');
    if (kind === 'firstCourse') {
      const s = (record && record.soap) || {};
      if (section === 's') return String((s.s && s.s.summary) || '');
      if (section === 'oPe') return String((s.o && s.o.pe) || '');
      if (section === 'oAux') return String((s.o && s.o.aux) || '');
      const basisText = String((s.a && s.a.basis) || '');
      const detail = (s.a && s.a.basisDetail) || [];
      return basisText + (detail.length ? '\n' + stableStringify(detail) : '');
    }
    if (kind === 'discharge') {
      if (section === 'diagnoses') return stableStringify((record.discharge && record.discharge.diagnoses) || []);
      return String((record.discharge && record.discharge.admitCondition) || '');
    }
    return '';
  }

  function docGroups(record, kind, section) {
    if (kind === 'summary') return summaryGroups(record);
    if (kind === 'firstCourse') return firstCourseGroups(record, section || 's');
    if (kind === 'discharge') return dischargeGroups(record, section || 'admitCondition');
    return {};
  }

  /**
   * 生成段落状态：
   *   empty | legacy | fresh | stale | manual | manual-stale | reviewed | reviewed-stale
   */
  function documentState(record, kind, section) {
    const meta = docMeta(record, kind, section);
    const text = docText(record, kind, section);
    let hasText = text.trim() !== '';
    if (kind === 'discharge' && section === 'diagnoses') {
      try { hasText = JSON.parse(text || '[]').length > 0; } catch (e) { hasText = false; }
    }
    const cur = groupFingerprints(docGroups(record, kind, section));
    const changed = changedGroups(meta.inputGroups, cur.groups);
    const base = { meta, changed, current: cur, text };
    if (!hasText) return { ...base, state: 'empty' };
    if (!meta.origin) return { ...base, state: 'legacy' };
    const textHash = hashText(text);
    if (meta.origin === 'manual') {
      return { ...base, state: changed.length ? 'manual-stale' : 'manual' };
    }
    // 标记为生成，但文字已经和生成时不同 → 实际是人工改过（旧版本可能没记状态）
    if (meta.generatedTextHash && meta.generatedTextHash !== textHash) {
      return { ...base, state: changed.length ? 'manual-stale' : 'manual' };
    }
    if (changed.length) {
      return { ...base, state: meta.reviewedFingerprint ? 'reviewed-stale' : 'stale' };
    }
    if (meta.reviewedFingerprint && meta.reviewedFingerprint === cur.fingerprint) {
      return { ...base, state: 'reviewed' };
    }
    return { ...base, state: 'fresh' };
  }

  function markDocumentGenerated(record, kind, section, text) {
    const m = ensureDocMeta(record, kind, section);
    const cur = groupFingerprints(docGroups(record, kind, section));
    const body = text === undefined ? docText(record, kind, section) : String(text);
    m.origin = 'generated';
    m.inputGroups = cur.groups;
    m.inputFingerprint = cur.fingerprint;
    m.generatedTextHash = hashText(body);
    m.reviewedFingerprint = '';
    m.updatedAt = new Date().toISOString();
    return m;
  }

  /** 用户手改：以当前资料为基线，之后资料再变才算「过期」 */
  function markDocumentManual(record, kind, section) {
    const m = ensureDocMeta(record, kind, section);
    const cur = groupFingerprints(docGroups(record, kind, section));
    m.origin = 'manual';
    m.inputGroups = cur.groups;
    m.inputFingerprint = cur.fingerprint;
    m.generatedTextHash = hashText(docText(record, kind, section));
    m.reviewedFingerprint = '';
    m.updatedAt = new Date().toISOString();
    return m;
  }

  function markDocumentReviewed(record, kind, section) {
    const m = ensureDocMeta(record, kind, section);
    const cur = groupFingerprints(docGroups(record, kind, section));
    m.inputGroups = cur.groups;
    m.inputFingerprint = cur.fingerprint;
    m.reviewedFingerprint = cur.fingerprint;
    m.updatedAt = new Date().toISOString();
    return m;
  }

  /* ---------------------- 婚姻状态：唯一来源 ---------------------- */

  function marriageValue(record) {
    const b = (record && record.basic) || {};
    const m = (record && record.marriage) || {};
    return b.marital || m.status || '';
  }

  function marriageConflict(record) {
    const c = record && record.meta && record.meta.conflicts && record.meta.conflicts.marriage;
    if (!c || c.resolved) return null;
    return c;
  }

  /** 用户选择后落定：basic.marital 是唯一来源，旧的 marriage.status 清空 */
  function resolveMarriage(record, value) {
    if (!record.basic) record.basic = {};
    if (!record.marriage) record.marriage = {};
    record.basic.marital = value || '';
    record.marriage.status = '';
    if (!record.meta) record.meta = {};
    if (!isObject(record.meta.conflicts)) record.meta.conflicts = {};
    record.meta.conflicts.marriage = {
      basicValue: value || '',
      marriageValue: '',
      resolved: true,
      chosen: value || '',
      resolvedAt: new Date().toISOString()
    };
    markFieldManual(record, 'basic.marital');
    return record;
  }

  /* ---------------------- 科室键的迁移 ---------------------- */

  /**
   * 旧的科室键 → 当前科室键。
   * 早期版本用过 'surgery' 指代全部外科，后来拆成更细的科室时，
   * 这里给出映射，保证旧病历仍能正常生成（不会因为科室不存在而丢失专科查体）。
   */
  const DEPT_ALIASES = {
    // 旧键 → 新键（当前版本尚未拆分，先留空作为扩展位）
  };

  /**
   * 中文科室名 / 常见简称 → 科室键。
   *
   * 这不是「旧版本遗留」，而是实打实会遇到的：学生在别处记的病历把科室写成
   * 「消化内科」，导入后 normalizeDeptKey 找不到这个键就静默回退到 'general'，
   * 结果整段专科查体凭空消失，还不给任何提示。宁可多认几种写法。
   */
  const DEPT_NAME_ALIASES = {
    通用: 'general', 全科: 'general', 通用全科: 'general',
    呼吸内科: 'respiratory', 呼吸科: 'respiratory', 呼吸: 'respiratory',
    消化内科: 'digestive', 消化科: 'digestive', 消化: 'digestive',
    心血管内科: 'cardiology', 心内科: 'cardiology', 心内: 'cardiology', 循环内科: 'cardiology',
    内分泌科: 'endocrinology', 内分泌: 'endocrinology', 内分泌代谢科: 'endocrinology',
    肾内科: 'nephrology', 肾脏内科: 'nephrology', 肾内: 'nephrology', 肾病科: 'nephrology',
    血液内科: 'hematology', 血液科: 'hematology', 血液: 'hematology', 血内: 'hematology',
    神经内科: 'neurology', 神内科: 'neurology', 神内: 'neurology', 神经科: 'neurology',
    外科: 'surgery', 普外科: 'surgery', 普外: 'surgery', 骨科: 'surgery', 泌尿外科: 'surgery',
    神经外科: 'surgery', 心胸外科: 'surgery', 肝胆外科: 'surgery', 胃肠外科: 'surgery',
    产科: 'obstetrics', 妇产科: 'obstetrics',
    妇科: 'gynecology', 妇瘤科: 'gynecology',
    儿科: 'pediatrics', 小儿内科: 'pediatrics', 新生儿科: 'pediatrics', 小儿科: 'pediatrics',
    急诊: 'emergency', ICU: 'emergency', 重症医学科: 'emergency',
    急诊ICU: 'emergency', 急诊科: 'emergency', 重症监护室: 'emergency',
    // 「精神科」不是「神经科」：前者看精神障碍，后者看神经系统疾病，
    // 写错了会把整段精神状况检查换成神经系统查体，所以单独列全。
    精神科: 'psychiatry', 精神心理科: 'psychiatry', 心理科: 'psychiatry',
    心理咨询科: 'psychiatry', 心身医学科: 'psychiatry', 精神卫生科: 'psychiatry',
    精神病科: 'psychiatry', 精神医学: 'psychiatry',
  };

  // 英文/缩写大小写不敏感：DIGESTIVE、Digestive、icu 都应认
  const DEPT_NAME_ALIASES_LC = {};
  Object.keys(DEPT_NAME_ALIASES).forEach(k => {
    DEPT_NAME_ALIASES_LC[k.toLowerCase()] = DEPT_NAME_ALIASES[k];
  });

  /** 把任意科室键规范成当前存在的科室键 */
  function normalizeDeptKey(key, validKeys) {
    const k = isText(key) ? key.trim() : '';
    if (validKeys.includes(k)) return k;
    if (DEPT_ALIASES[k] && validKeys.includes(DEPT_ALIASES[k])) return DEPT_ALIASES[k];
    // 中文科室名 / 常见简称 / 大小写不同的英文键 —— 都先认一遍再回退
    const lc = k.toLowerCase();
    // 大小写变体：DIGESTIVE / Digestive 应该等同于 digestive
    const exactKey = validKeys.find(v => String(v).toLowerCase() === lc);
    if (exactKey) return exactKey;
    const byName = DEPT_NAME_ALIASES[k] || DEPT_NAME_ALIASES_LC[lc];
    if (byName && validKeys.includes(byName)) return byName;
    // 未知科室（如导入别的版本的数据）回退到通用，避免生成时报错
    return 'general';
  }

  /* ---------------------- 病历结构校验 ---------------------- */

  /** 结构抽查：只检查会影响生成逻辑的关键字段，不逐字段死抠，避免过度拒绝 */
  function lookLikeRecord(r) {
    if (!isObject(r)) return false;
    if (!isObject(r.basic)) return false;
    if (!isObject(r.hpi)) return false;
    if (!isObject(r.diagnosis)) return false;
    if (!Array.isArray(r.diagnosis.confirmed)) return false;
    if (!isObject(r.pe)) return false;
    if (!isObject(r.auxiliary)) return false;
    if (!Array.isArray(r.auxiliary.items)) return false;
    if (r.ros !== undefined && !isObject(r.ros)) return false;
    return true;
  }

  /**
   * 把任意来源的对象规范成当前版本的完整病历。
   * @throws 结构完全不像病历时抛错（调用方应保留原存档、提示用户）
   */
  function normalizeRecord(raw, emptyRecord, validDeptKeys) {
    assertSafeKeys(raw);

    // 先补齐结构再校验：旧版本存档可能缺少 pe / auxiliary 等后来新增的分支，
    // 这类存档应该被迁移而不是被拒绝。
    if (!isObject(raw) || !isObject(raw.basic)) {
      fail('不是有效的大病历存档（缺少基本信息）');
    }
    // 至少要有基本信息里的某个字段，或现病史内容，否则视为空/错误文件
    const hasAnyContent = Object.keys(raw.basic).some(k =>
      isText(raw.basic[k]) ? raw.basic[k].trim() !== '' : raw.basic[k] !== undefined && raw.basic[k] !== null
    ) || (isObject(raw.hpi) && Object.values(raw.hpi).some(v => isText(v) && v.trim() !== ''));

    const filled = deepMerge(emptyRecord(), raw);

    if (!lookLikeRecord(filled)) fail('不是有效的大病历存档（缺少基本信息/现病史/诊断等关键结构）');
    if (raw.schemaVersion !== undefined && raw.schemaVersion > SCHEMA_VERSION) {
      fail('存档来自更新版本的应用，请先更新后再打开');
    }
    if (!hasAnyContent && !isObject(raw.hpi)) {
      // 完全空的对象交给调用方当作"新建"处理，而不是静默当成一份空病历
      fail('存档内容为空');
    }

    filled.schemaVersion = SCHEMA_VERSION;

    // ---- 元数据与迁移（v2 → v3）----
    if (!isObject(filled.meta)) filled.meta = {};
    if (!isObject(filled.meta.fieldStates)) filled.meta.fieldStates = {};
    if (!isObject(filled.meta.conflicts)) filled.meta.conflicts = {};
    if (!Array.isArray(filled.meta.migrationNotes)) filled.meta.migrationNotes = [];
    const rev = Number(filled.meta.revision);
    filled.meta.revision = Number.isFinite(rev) && rev >= 0 ? Math.floor(rev) : 0;
    const rawVersion = Number(raw.schemaVersion);
    if (Number.isFinite(rawVersion) && rawVersion < SCHEMA_VERSION) {
      filled.meta.migratedFrom = rawVersion;
      if (!filled.meta.migrationNotes.includes('已从 v' + rawVersion + ' 迁移到 v' + SCHEMA_VERSION)) {
        filled.meta.migrationNotes.push('已从 v' + rawVersion + ' 迁移到 v' + SCHEMA_VERSION);
      }
    } else if (filled.meta.migratedFrom === undefined) {
      filled.meta.migratedFrom = null;
    }
    if (!isObject(filled.documentMeta)) filled.documentMeta = {};

    // 婚姻状态：basic.marital 是唯一来源。两处一致直接合并；
    // 不一致保留两个原值，等用户选择，绝不静默舍弃。
    const bMarital = isText(filled.basic.marital) ? filled.basic.marital.trim() : '';
    const mStatus = filled.marriage && isText(filled.marriage.status) ? filled.marriage.status.trim() : '';
    const existingConflict = filled.meta.conflicts.marriage;
    if (bMarital && mStatus) {
      if (bMarital === mStatus) {
        filled.marriage.status = '';
        if (!filled.meta.migrationNotes.includes('婚姻状态两处一致，已统一到基本情况')) {
          filled.meta.migrationNotes.push('婚姻状态两处一致，已统一到基本情况');
        }
      } else if (!existingConflict || !existingConflict.resolved) {
        filled.meta.conflicts.marriage = {
          basicValue: bMarital,
          marriageValue: mStatus,
          resolved: false,
          chosen: ''
        };
        if (!filled.meta.migrationNotes.includes('婚姻状态两处不一致，已保留两个原值待选择')) {
          filled.meta.migrationNotes.push('婚姻状态两处不一致，已保留两个原值待选择');
        }
      }
    } else if (!bMarital && mStatus) {
      filled.basic.marital = mStatus;
      filled.marriage.status = '';
      if (!filled.meta.migrationNotes.includes('婚姻状态已从婚姻史迁移到基本情况')) {
        filled.meta.migrationNotes.push('婚姻状态已从婚姻史迁移到基本情况');
      }
    } else if (bMarital && !mStatus) {
      // 已经是唯一来源，无需处理
    }

    // 生成段落：旧存档里已有文字但没有来源 → legacy，保留原文、不判为已核对
    const fc = isObject(filled.documentMeta.firstCourse) ? filled.documentMeta.firstCourse : {};
    ['s', 'oPe', 'oAux', 'basis'].forEach(sec => {
      if (!isObject(fc[sec])) fc[sec] = emptyDocMeta();
      if (docText(filled, 'firstCourse', sec).trim() && !fc[sec].origin) fc[sec].origin = 'legacy';
    });
    filled.documentMeta.firstCourse = fc;
    if (!isObject(filled.documentMeta.summary)) filled.documentMeta.summary = emptyDocMeta();
    if (docText(filled, 'summary').trim() && !filled.documentMeta.summary.origin) {
      filled.documentMeta.summary.origin = 'legacy';
    }
    if (!isObject(filled.documentMeta.discharge)) filled.documentMeta.discharge = {};
    if (!isObject(filled.documentMeta.discharge.admitCondition)) {
      filled.documentMeta.discharge.admitCondition = emptyDocMeta();
    }
    if (docText(filled, 'discharge', 'admitCondition').trim() && !filled.documentMeta.discharge.admitCondition.origin) {
      filled.documentMeta.discharge.admitCondition.origin = 'legacy';
    }
    if (!isObject(filled.documentMeta.discharge.diagnoses)) {
      filled.documentMeta.discharge.diagnoses = {
        origin: '', inputFingerprint: '', textHash: '', confirmed: false, confirmedFingerprint: ''
      };
    }
    if ((filled.discharge && filled.discharge.diagnoses || []).length &&
        !filled.documentMeta.discharge.diagnoses.origin) {
      filled.documentMeta.discharge.diagnoses.origin = 'legacy';
    }

    // 旧字段来源统一标 legacy（只补缺失的来源，不覆盖已有状态）
    markLegacyFields(filled);
    Object.keys(filled.meta.fieldStates).forEach(k => {
      filled.meta.fieldStates[k] = normalizeFieldState(filled.meta.fieldStates[k]);
    });

    // 科室键规范化
    if (validDeptKeys && validDeptKeys.length) {
      filled.basic.department = normalizeDeptKey(filled.basic.department, validDeptKeys);
    }
    // 数值字段统一成字符串（输入框里可能被存成数字）
    ['age', 'chiefComplaintDuration'].forEach(k => {
      if (typeof filled.basic[k] === 'number') filled.basic[k] = String(filled.basic[k]);
    });
    // 诊断列表去空、去首尾空白
    // 注意：不能写成 .filter(isText)，否则下标会被当成 isText 的 max 参数传入
    filled.diagnosis.confirmed = (filled.diagnosis.confirmed || [])
      .filter(s => isText(s))
      .map(s => s.trim())
      .filter(Boolean);
    // 辅助检查至少保留一行空行，保证界面可用
    if (!filled.auxiliary.items.length) filled.auxiliary.items = [{ name: '', result: '' }];
    return filled;
  }

  /* ---------------------- 病历列表操作（纯函数） ---------------------- */

  function uid(now = Date.now(), rand = Math.random) {
    return 'r' + now.toString(36) + rand().toString(36).slice(2, 7);
  }

  /** 列表项摘要（用于列表页展示，不依赖界面） */
  function summarize(item) {
    const d = item && item.data ? item.data : (item || {});
    const b = (d && d.basic) || {};
    return {
      id: item.id,
      name: b.name || '未命名',
      gender: b.gender || '',
      age: b.age || '',
      birthDate: b.birthDate || '',
      admitDate: b.admitDate || '',
      department: b.department || '',
      chiefComplaint: b.chiefComplaint || '',
      updatedAt: item.updatedAt || ''
    };
  }

  /** 按更新时间倒序 */
  function sortByUpdated(list) {
    return [...list].sort((a, b) =>
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
    );
  }

  /**
   * 新增或更新一份病历（返回新数组，不修改入参）
   * @param {object} record 当前病历（会被写入 data 快照）
   * @param {string} isoNow
   */
  function upsertRecord(list, record, isoNow) {
    if (!isObject(record)) fail('病历内容无效');
    const id = record.id || uid();
    const stamp = isoNow || new Date().toISOString();
    const payload = {
      id,
      updatedAt: stamp,
      schemaVersion: SCHEMA_VERSION,
      basic: JSON.parse(JSON.stringify(record.basic || {})),
      data: JSON.parse(JSON.stringify({ ...record, id, updatedAt: stamp }))
    };
    const out = Array.isArray(list) ? [...list] : [];
    const idx = out.findIndex(x => x && x.id === id);
    if (idx >= 0) out[idx] = payload;
    else out.unshift(payload);
    return { list: out, id };
  }

  /**
   * 列表写入前合并：以 id 为键，修订号大者优先，其次 updatedAt 较新者。
   * 两个标签页编辑不同病历同时保存时，不会把对方刚写入的记录挤掉。
   */
  function mergeListForWrite(stored, local) {
    const map = new Map();
    const put = item => {
      if (!item || !item.id) return;
      const prev = map.get(item.id);
      if (!prev) { map.set(item.id, item); return; }
      const pr = Number(prev.data && prev.data.meta && prev.data.meta.revision) || 0;
      const nr = Number(item.data && item.data.meta && item.data.meta.revision) || 0;
      if (nr > pr) { map.set(item.id, item); return; }
      if (nr === pr && String(item.updatedAt || '') > String(prev.updatedAt || '')) map.set(item.id, item);
    };
    (Array.isArray(stored) ? stored : []).forEach(put);
    (Array.isArray(local) ? local : []).forEach(put);
    return Array.from(map.values()).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  function removeRecord(list, id) {
    return (Array.isArray(list) ? list : []).filter(x => x && x.id !== id);
  }

  function findRecord(list, id) {
    return (Array.isArray(list) ? list : []).find(x => x && x.id === id) || null;
  }

  /* ---------------------- 导出 / 导入 ---------------------- */

  /**
   * 导出格式：带包装的 JSON，含版本与时间，便于以后迁移
   * { schemaVersion, exportedAt, app, records:[...] }
   */
  function buildExport(list, isoNow, opts) {
    const options = isObject(opts) ? opts : {};
    let base = Array.isArray(list) ? list : [];
    if (options.includeDraft && isObject(options.draft)) {
      base = upsertRecord(base, options.draft, isoNow).list;
    }
    const records = base
      .filter(x => x && isObject(x.data))
      .map(x => {
        assertSafeKeys(x.data);
        return { id: x.id, updatedAt: x.updatedAt, data: x.data };
      });
    const out = {
      app: 'dabingli',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: isoNow || new Date().toISOString(),
      records
    };
    if (options.includeDraft && isObject(options.draft)) out.includesDraft = true;
    return out;
  }

  /**
   * 解析导入文件。支持两种格式：
   *   1. 本应用导出的包装格式 { records: [...] }
   *   2. 单份病历对象（早期版本直接导出的 record）
   * @returns {{records: Array, mode: 'bundle'|'single'}}
   * @throws 格式不合法
   */
  function parseImport(rawText, emptyRecord, validDeptKeys) {
    if (!isText(rawText) || !rawText.trim()) fail('文件内容为空');
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      fail('不是有效的 JSON 文件');
    }
    assertSafeKeys(parsed);

    // 包装格式
    if (isObject(parsed) && Array.isArray(parsed.records)) {
      if (parsed.schemaVersion !== undefined && parsed.schemaVersion > SCHEMA_VERSION) {
        fail('备份来自更新版本的应用，请先更新后再导入');
      }
      if (!parsed.records.length) fail('备份中没有病历数据');
      const records = parsed.records.map((item, i) => {
        const body = isObject(item) && isObject(item.data) ? item.data : item;
        try {
          return {
            id: (isObject(item) && isText(item.id) && item.id) || uid(),
            updatedAt: (isObject(item) && isText(item.updatedAt) && item.updatedAt) || '',
            data: normalizeRecord(body, emptyRecord, validDeptKeys)
          };
        } catch (e) {
          fail(`第 ${i + 1} 份病历无法识别：${e.message}`);
        }
      });
      return { records, mode: 'bundle' };
    }

    // 单份病历
    if (lookLikeRecord(parsed)) {
      return {
        records: [{
          id: isText(parsed.id) ? parsed.id : uid(),
          updatedAt: isText(parsed.updatedAt) ? parsed.updatedAt : '',
          data: normalizeRecord(parsed, emptyRecord, validDeptKeys)
        }],
        mode: 'single'
      };
    }

    fail('无法识别的文件格式（既不是备份包，也不是单份病历）');
  }

  /**
   * 合并导入结果到现有列表。
   * 策略：id 相同则比较 updatedAt，以较新者为准（不静默丢弃较旧的用户数据，
   * 较旧的一方不覆盖，但也不会删除已有记录）。
   */
  function mergeImport(list, imported) {
    const out = Array.isArray(list) ? [...list] : [];
    let added = 0, updated = 0, skipped = 0;
    (imported || []).forEach(item => {
      const idx = out.findIndex(x => x && x.id === item.id);
      if (idx < 0) {
        out.unshift(item);
        added++;
        return;
      }
      const existingTime = String(out[idx].updatedAt || '');
      const incomingTime = String(item.updatedAt || '');
      if (incomingTime > existingTime) {
        out[idx] = item;
        updated++;
      } else {
        skipped++;
      }
    });
    return { list: out, added, updated, skipped };
  }

  /**
   * 完整恢复（替换）导入结果
   */
  function replaceImport(imported) {
    return Array.isArray(imported) ? [...imported] : [];
  }

  /* ---------------------- 设置 ---------------------- */

  const SETTINGS_DEFAULTS = { rosMode: 'detail', fontScale: 1, lastStep: '' };

  function normalizeSettings(raw) {
    const out = { ...SETTINGS_DEFAULTS };
    if (isObject(raw)) {
      if (raw.rosMode === 'detail' || raw.rosMode === 'brief') out.rosMode = raw.rosMode;
      const fs = Number(raw.fontScale);
      // 字号缩放限制在合理区间，防止界面被撑坏
      if (Number.isFinite(fs) && fs >= 0.8 && fs <= 1.4) out.fontScale = Math.round(fs * 100) / 100;
      // 上次停留的步骤键。刷新后回到原处，不要每次都从「基本情况」重新点 7 下。
      // 只收字符串，具体是哪一步由 app 校验（不认识的键会被忽略，退回第一步）。
      if (typeof raw.lastStep === 'string') out.lastStep = raw.lastStep;
    }
    return out;
  }

  /* ---------------------- 存储读写帮助（无副作用版本） ---------------------- */

  /** 只在内存 Map 上运行的存储适配器，测试用 */
  function memoryStorage(initial) {
    const map = new Map(initial || []);
    return {
      getItem: k => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => { map.set(k, String(v)); },
      removeItem: k => { map.delete(k); },
      _dump: () => new Map(map)
    };
  }

  /**
   * 安全写入：失败时返回 false 而不是抛出（存储满 / 隐私模式会失败）
   */
  function safeSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** 安全读取 JSON：损坏时返回 null 而不是抛出 */
  function safeGetJSON(storage, key) {
    try {
      const raw = storage.getItem(key);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * 读取原始字符串：storage.getItem 本身也可能抛错（隐私模式、被禁用），
   * 这里统一包住，调用方据此区分「没有存档」和「读不了存档」。
   */
  function readRaw(storage, key) {
    try {
      const raw = storage.getItem(key);
      if (raw === null || raw === undefined) return { ok: true, raw: null, missing: true };
      return { ok: true, raw: String(raw), missing: false };
    } catch (e) {
      return { ok: false, raw: '', missing: false, error: String((e && e.message) || e) };
    }
  }

  function writeRaw(storage, key, value) {
    try {
      storage.setItem(key, value);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  }

  /**
   * 载入病历列表。损坏时**不覆盖原存档**，返回 ok:false 让界面提示用户。
   * 这是参考项目强调的行为：损坏数据不能静默丢弃。
   */
  function loadList(storage) {
    const got = readRaw(storage, STORAGE_KEYS.list);
    if (!got.ok) {
      return { ok: false, list: [], error: true, reason: '无法读取浏览器存储：' + got.error, raw: '' };
    }
    if (got.missing) return { ok: true, list: [], fresh: true };
    const rawText = got.raw;
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, list: [], corrupt: true, raw: rawText };
    }
    if (!Array.isArray(parsed)) return { ok: false, list: [], corrupt: true, raw: rawText };
    try {
      assertSafeKeys(parsed);
    } catch (e) {
      return { ok: false, list: [], corrupt: true, raw: rawText };
    }
    return { ok: true, list: parsed };
  }

  /**
   * 载入当前正在编辑的病历，失败时返回 reason 供界面提示
   *
   * 三种结果必须分得开，界面靠它们决定「能不能写回」：
   *   { ok:true, fresh:true }  —— key 根本不存在（第一次用），写回去是安全的
   *   { ok:true, record }      —— 读出来了
   *   { ok:false, corrupt:true, raw } —— key 在、但读不出来，raw 是原文，
   *                                      界面要留着它给用户导出，并且停止写入
   * 早先只用 ok 一个布尔值，调用方分不清「没有存档」和「存档坏了」，
   * 于是空白病历被当成正常的空存档保存，把损坏的原文整个覆盖掉。
   */
  function loadCurrent(storage, emptyRecord, validDeptKeys, preferredId) {
    const got = readRaw(storage, STORAGE_KEYS.current);
    if (!got.ok) {
      return { ok: false, record: null, error: true, reason: '无法读取浏览器存储：' + got.error };
    }
    let pointer = null;
    if (!got.missing) {
      try {
        pointer = JSON.parse(got.raw);
      } catch (e) {
        return { ok: false, record: null, corrupt: true, raw: got.raw, reason: '正在编辑的病历存档已损坏' };
      }
    }

    // 旧版 current 槽直接存整份病历：迁移到按 id 的草稿键，再按新格式读。
    if (isObject(pointer) && isObject(pointer.basic)) {
      const legacyRaw = got.raw;
      let migrated;
      try {
        migrated = normalizeRecord(pointer, emptyRecord, validDeptKeys);
      } catch (e) {
        return { ok: false, record: null, corrupt: true, raw: legacyRaw, reason: e.message };
      }
      if (!migrated.id) migrated.id = uid();
      if (!isObject(migrated.meta)) migrated.meta = {};
      if (!Number.isFinite(Number(migrated.meta.revision))) migrated.meta.revision = 0;
      const draft = saveCurrent(storage, migrated, migrated.meta.revision);
      if (!draft.ok) {
        return { ok: false, record: null, corrupt: true, raw: legacyRaw, reason: '旧存档迁移失败：' + (draft.reason || '无法写入') };
      }
      return { ok: true, record: draft.record, migrated: true };
    }

    const id = String(preferredId || (isObject(pointer) ? pointer.id : pointer) || '').trim();
    if (!id) return { ok: true, record: null, fresh: true };

    const dgot = readRaw(storage, draftKey(id));
    if (!dgot.ok) {
      return { ok: false, record: null, error: true, reason: '无法读取浏览器存储：' + dgot.error };
    }
    if (dgot.missing) return { ok: true, record: null, fresh: true, missingDraft: true };
    try {
      return { ok: true, record: normalizeRecord(JSON.parse(dgot.raw), emptyRecord, validDeptKeys) };
    } catch (e) {
      return { ok: false, record: null, corrupt: true, raw: dgot.raw, reason: e.message };
    }
  }


  function loadSettings(storage) {
    const got = readRaw(storage, STORAGE_KEYS.settings);
    if (!got.ok || got.missing) return { ok: got.ok, settings: { ...SETTINGS_DEFAULTS }, raw: got.raw || '' };
    try {
      return { ok: true, settings: normalizeSettings(JSON.parse(got.raw)), raw: got.raw };
    } catch (e) {
      return { ok: false, settings: { ...SETTINGS_DEFAULTS }, corrupt: true, raw: got.raw };
    }
  }

  /**
   * 保存当前病历草稿，带修订号检查。
   *
   * 每份病历写入自己的 `dabingli.draft.v1.<id>`，不同病历互不覆盖；
   * `dabingli.current.v1` 只是「上次打开哪一份」的指针。
   * 同一份病历的并发写入由调用方的跨标签页锁（app.js）串行化，
   * 锁内仍用这里的修订号做第二道检查。
   */
  function saveCurrent(storage, record, expectedRevision) {
    if (!isObject(record)) return { ok: false, error: true, reason: '病历内容无效' };
    if (!record.id) record.id = uid();
    const key = draftKey(record.id);
    const got = readRaw(storage, key);
    if (!got.ok) return { ok: false, error: true, reason: '无法读取当前存档：' + got.error };
    let existing = null;
    if (!got.missing) {
      try {
        existing = JSON.parse(got.raw);
      } catch (e) {
        return { ok: false, corrupt: true, raw: got.raw, reason: '现有存档无法解析，未覆盖' };
      }
    }
    const remoteRev = Number(existing && existing.meta && existing.meta.revision) || 0;
    const expect = expectedRevision === undefined || expectedRevision === null
      ? null : Number(expectedRevision);
    if (existing && expect !== null && remoteRev !== expect) {
      return {
        ok: false, conflict: true, remote: existing, remoteRevision: remoteRev,
        reason: '其他页面已保存新版本'
      };
    }
    const now = new Date().toISOString();
    const next = cloneValue(record);
    if (!isObject(next.meta)) next.meta = {};
    next.schemaVersion = SCHEMA_VERSION;
    next.meta.revision = Math.max(remoteRev, Number(next.meta.revision) || 0) + 1;
    next.meta.updatedAt = now;
    const wrote = writeRaw(storage, key, JSON.stringify(next));
    if (!wrote.ok) return { ok: false, error: true, reason: '保存失败：' + wrote.error };
    // 指针写失败不影响草稿本身；下次仍可按 sessionStorage 里的 id 找回。
    writeRaw(storage, STORAGE_KEYS.current, JSON.stringify({ id: next.id, at: now }));
    return { ok: true, record: next, revision: next.meta.revision };
  }

  /** 当前内存记录与已落盘草稿内容是否一致（忽略修订号/时间戳） */
  function draftMatches(storage, record) {
    if (!isObject(record) || !record.id) return false;
    const got = readRaw(storage, draftKey(record.id));
    if (!got.ok || got.missing) return false;
    try {
      const existing = JSON.parse(got.raw);
      const strip = r => { const c = cloneValue(r); delete c.meta; return c; };
      return stableStringify(strip(existing)) === stableStringify(strip(record));
    } catch (e) {
      return false;
    }
  }

  function saveList(storage, list) {
    if (!Array.isArray(list)) return { ok: false, error: true, reason: '病历列表无效' };
    const wrote = writeRaw(storage, STORAGE_KEYS.list, JSON.stringify(list));
    if (!wrote.ok) return { ok: false, error: true, reason: '保存失败：' + wrote.error };
    return { ok: true };
  }

  function saveSettings(storage, settings) {
    const wrote = writeRaw(storage, STORAGE_KEYS.settings, JSON.stringify(normalizeSettings(settings)));
    if (!wrote.ok) return { ok: false, error: true, reason: '设置保存失败：' + wrote.error };
    return { ok: true };
  }

  /**
   * 内存快照栈（按病历 id 绑定）。历史只在本机内存里，刷新即失效，
   * 不能当作异地备份；这一点必须在界面上说清楚。
   */
  function createHistory(limit) {
    const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
    const stacks = new Map();
    return {
      push(record, label) {
        if (!record || !record.id) return false;
        let text;
        try { text = JSON.stringify(record); } catch (e) { return false; }
        if (text.length > 4 * 1024 * 1024) return false;
        const arr = stacks.get(record.id) || [];
        arr.push({ label: label || '编辑', at: new Date().toISOString(), snapshot: cloneValue(record) });
        while (arr.length > cap) arr.shift();
        stacks.set(record.id, arr);
        return true;
      },
      pop(id) {
        const arr = stacks.get(id) || [];
        const item = arr.pop() || null;
        return item;
      },
      peek(id) {
        const arr = stacks.get(id) || [];
        return arr[arr.length - 1] || null;
      },
      list(id) {
        return (stacks.get(id) || []).map(x => ({ label: x.label, at: x.at }));
      },
      size(id) { return (stacks.get(id) || []).length; },
      clear(id) { stacks.delete(id); }
    };
  }

  const api = {
    SCHEMA_VERSION, STORAGE_KEYS, SETTINGS_DEFAULTS,
    assertSafeKeys, deepMerge, normalizeDeptKey,
    isBlankValue, cloneValue, fillBlanks,
    stableStringify, hashText, fingerprint, getPath, setPath,
    fieldState, setFieldState, markFieldManual, markFieldReviewed, fieldReviewValid,
    markLegacyFields, normalizeFieldState,
    summaryGroups, firstCourseGroups, dischargeGroups, groupFingerprints, changedGroups,
    docMeta, ensureDocMeta, docText, docGroups, documentState,
    markDocumentGenerated, markDocumentManual, markDocumentReviewed,
    marriageValue, marriageConflict, resolveMarriage,
    normalizeRecord, lookLikeRecord,
    uid, summarize, sortByUpdated, upsertRecord, removeRecord, findRecord, mergeListForWrite,
    buildExport, parseImport, mergeImport, replaceImport,
    normalizeSettings,
    memoryStorage, safeSet, safeGetJSON,
    readRaw, writeRaw, loadList, loadCurrent, loadSettings, draftKey, draftMatches,
    saveCurrent, saveList, saveSettings, createHistory
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RECORD_CORE;
}
