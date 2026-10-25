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

  const SCHEMA_VERSION = 2;
  /** 存储键：v1 起沿用，升级不改变键名 */
  const STORAGE_KEYS = {
    list: 'dabingli.records.v1',
    current: 'dabingli.current.v1',
    settings: 'dabingli.settings.v1'
  };

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
  function buildExport(list, isoNow) {
    const records = (Array.isArray(list) ? list : [])
      .filter(x => x && isObject(x.data))
      .map(x => {
        assertSafeKeys(x.data);
        return { id: x.id, updatedAt: x.updatedAt, data: x.data };
      });
    return {
      app: 'dabingli',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: isoNow || new Date().toISOString(),
      records
    };
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
   * 载入病历列表。损坏时**不覆盖原存档**，返回 ok:false 让界面提示用户。
   * 这是参考项目强调的行为：损坏数据不能静默丢弃。
   */
  function loadList(storage) {
    const rawText = storage.getItem(STORAGE_KEYS.list);
    if (rawText === null) return { ok: true, list: [], fresh: true };
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
   */
  function loadCurrent(storage, emptyRecord, validDeptKeys) {
    const rawText = storage.getItem(STORAGE_KEYS.current);
    if (rawText === null) return { ok: true, record: null, fresh: true };
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, record: null, corrupt: true, reason: '正在编辑的病历存档已损坏' };
    }
    try {
      return { ok: true, record: normalizeRecord(parsed, emptyRecord, validDeptKeys) };
    } catch (e) {
      return { ok: false, record: null, corrupt: true, reason: e.message };
    }
  }

  const api = {
    SCHEMA_VERSION, STORAGE_KEYS, SETTINGS_DEFAULTS,
    assertSafeKeys, deepMerge, normalizeDeptKey,
    isBlankValue, cloneValue, fillBlanks,
    normalizeRecord, lookLikeRecord,
    uid, summarize, sortByUpdated, upsertRecord, removeRecord, findRecord,
    buildExport, parseImport, mergeImport, replaceImport,
    normalizeSettings,
    memoryStorage, safeSet, safeGetJSON, loadList, loadCurrent
  };

  return api;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RECORD_CORE;
}
