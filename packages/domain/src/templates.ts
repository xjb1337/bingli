/* ============================================================
 * 模板病例（TEMPLATES）
 * ------------------------------------------------------------
 * 学生选好科室后，可以挑一份「标准大病历初稿」，得到一个已经写满
 * 典型病例内容的病历，再按自己实际问到的、查到的删改。
 *
 * 三条铁律：
 *   1. 套用模板**只填空白的**，一个字都不覆盖。学生已经写的东西比他
 *      随便点的模板更接近真相。
 *   2. 模板不写患者身份（姓名/性别/年龄/住院号/床号）与生命体征数字。
 *      那些只能由学生自己测、自己问。
 *   3. 模板数据是数据，不是逻辑。这个文件只负责「查、套、报」。
 *
 * 依赖：SCHEMA（科室名）、RECORD_CORE（fillBlanks / cloneValue）。
 * 数据来自 template-data.js（由 tools/gen-templates.js 生成）。
 * ============================================================ */

var TEMPLATES = (function () {
  const DATA = (typeof TEMPLATE_DATA !== 'undefined' ? TEMPLATE_DATA : []);
  const DEFAULT_SOURCE = {
    kind: 'textbook-template',
    label: '教学模板',
    note: '依据《诊断学》常见病典型表现整理，尚未与医院正式病历模板核对。'
  };

  /**
   * 模板事实的来源与核对状态必须随模板一起流动。医院模板尚未提供，所以
   * 默认一律标为未核对；即使院内范例有截图来源，也仍需按正式模板复核。
   * source 原对象保持原样，避免把核对状态混进来源说明里。
   */
  function normalizeTemplate(template) {
    const source = template.source && typeof template.source === 'object'
      ? Object.assign({}, template.source)
      : Object.assign({}, DEFAULT_SOURCE);
    const verified = template.verified === true;
    return Object.assign({}, template, {
      source,
      verified,
      verificationStatus: verified ? 'verified' : 'unverified',
      verificationLabel: verified ? '已核对' : '待医院模板核对'
    });
  }

  const NORMALIZED = DATA.map(normalizeTemplate);

  const SIDE_PLACEHOLDERS = ['（患侧）', '（对侧）', '（健侧）'];
  const SIDE_PLACEHOLDER_RE = /（(?:患侧|对侧|健侧)）/g;

  /**
   * 列出模板里尚未由学生填写的侧别占位符。占位符只是提示，不猜、
   * 不自动选边；套用时按模板原文写入，由学生按实际患者改成左或右。
   */
  function findUnfilledPlaceholders(value) {
    const out = [];
    (function walk(node, path) {
      if (typeof node === 'string') {
        const matches = node.match(SIDE_PLACEHOLDER_RE);
        if (matches) matches.forEach(placeholder => out.push({ path, placeholder, text: node }));
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((item, index) => walk(item, `${path}[${index}]`));
        return;
      }
      if (node && typeof node === 'object') {
        Object.keys(node).forEach(key => walk(node[key], path ? `${path}.${key}` : key));
      }
    })(value, '');
    return out;
  }

  function unfilledPlaceholders(key) {
    const t = get(key);
    if (!t) return [];
    return findUnfilledPlaceholders({
      name: t.name,
      alias: t.alias || [],
      hint: t.hint || '',
      record: t.record || {}
    });
  }

  /**
   * 某个科室有哪些模板。general（通用/全科）返回空数组——
   * 通用科没有「标准病例」这回事，只能从头问。
   */
  function listByDept(deptKey) {
    const k = String(deptKey || '');
    if (!k || k === 'general') return [];
    // 所有模板都挂在具体科室下；不跨科室给，免得学生拿消化科的模板套儿科病历
    return NORMALIZED.filter(t => t.dept === k);
  }

  function get(key) {
    const k = String(key || '');
    return NORMALIZED.find(t => t.key === k) || null;
  }

  function all() {
    return NORMALIZED.slice();
  }

  /** 科室的中文名，用于界面文案与提示 */
  function deptName(deptKey) {
    const d = (SCHEMA.DEPARTMENTS || []).find(x => x.key === deptKey);
    return d ? d.name : deptKey;
  }

  /**
   * 把模板套进当前病历。返回 { filled: [...], count, skipped }：
   *   filled  实际写入的字段路径（如 'hpi.onset'），用于给用户看「补了哪些」
   *   count   写入项数
   *   skipped 非空而未覆盖的路径（用于提示「这些是你自己写的，没动」）
   *
   * opts.mode:
   *   'example'（默认）—— 教学范例：只填空位，逐字段记来源 template
   *   'patient'        —— 患者录入提纲：**不写入任何内容**，只返回应问、应查的清单
   *
   * 注意：模板里的 record 是**完整对象**，但 fillBlanks 只填空位，
   * 所以「先填一半再套模板」也不会把已填的内容冲掉。
   */
  function apply(record, key, opts) {
    const t = get(key);
    const mode = (opts && opts.mode) === 'patient' ? 'patient' : 'example';
    if (!t || !record) return { filled: [], count: 0, skipped: [], ok: false, mode };
    if (mode === 'patient') {
      // 患者录入模式只给提纲：模板里的阴性病史、阳性体征、检查结果、诊断
      // 都是「教学范例的事实」，不能当成这位患者的事实写进病历。
      return {
        ok: true,
        mode,
        filled: [],
        count: 0,
        skipped: [],
        outline: outlineOf(t),
        name: t.name,
        dept: t.dept
      };
    }
    if (!RECORD_CORE || !RECORD_CORE.fillBlanks) {
      return { filled: [], count: 0, skipped: [], ok: false, mode };
    }

    // 记录套用前的空/非空状态，用于统计「本来就有内容的没被动过」
    const before = snapshotNonEmpty(record);

    // 主诉时长和它的单位是一体的，必须一起看。
    // 坑：emptyRecord() 把 basic.chiefComplaintDurationUnit 的默认值写成了「天」，
    // 而 fillBlanks 只填空位 —— 模板写「3 / 月」时，时长填上了，单位却被默认的「天」
    // 顶掉，于是主诉变成「乏力 3天」，现病史却写「3个月前」。（13 个模板踩过这条）
    // 所以：只有时长本来就是空的（即这个时长来自模板）才跟着写单位；
    // 学生自己填过的时长，单位也归学生，不动。
    const beforeDur = String((record.basic && record.basic.chiefComplaintDuration) || '').trim();
    const tplBasic = t.record.basic || {};

    const filled = RECORD_CORE.fillBlanks(record, t.record);

    if (!beforeDur && String(tplBasic.chiefComplaintDuration || '').trim()) {
      const unit = String(tplBasic.chiefComplaintDurationUnit || '').trim();
      if (unit && record.basic.chiefComplaintDurationUnit !== unit) {
        record.basic.chiefComplaintDurationUnit = unit;
        if (filled.indexOf('basic.chiefComplaintDurationUnit') < 0) {
          filled.push('basic.chiefComplaintDurationUnit');
        }
      }
    }

    // 套用时科室若还停在 general，顺手把模板的科室填上，否则专科查体出不来
    if (t.dept && (!record.basic.department || record.basic.department === 'general')) {
      record.basic.department = t.dept;
      if (filled.indexOf('basic.department') < 0) filled.push('basic.department');
    }

    // 逐字段记来源：以后「批量核对」必须能看到具体文字，而不是凭「来自模板」就当真
    if (record.meta && RECORD_CORE.setFieldState) {
      filled.forEach(p => {
        RECORD_CORE.setFieldState(record, p, {
          source: 'template',
          reviewed: false,
          reviewedValueHash: '',
          sourceRef: key
        });
      });
    }

    // 记下本次带入的文字，供「查看本次带入内容」与「撤销本次带入」使用
    const values = {};
    filled.forEach(p => {
      const v = RECORD_CORE.getPath ? RECORD_CORE.getPath(record, p) : undefined;
      if (typeof v === 'string') values[p] = v;
    });
    if (record.meta) {
      record.meta.lastTemplateFill = {
        key, name: t.name, at: new Date().toISOString(),
        filled: filled.slice(), values
      };
    }

    return {
      ok: true,
      mode,
      filled,
      count: filled.length,
      skipped: before,
      name: t.name,
      dept: t.dept,
      values
    };
  }

  const SECTION_LABEL = {
    basic: '基本情况', hpi: '现病史', ros: '系统回顾', pmh: '既往史',
    personal: '个人史', marriage: '婚姻史', menstruation: '月经史',
    childbirth: '生育史', family: '家族史', pe: '体格检查',
    auxiliary: '辅助检查', diagnosis: '初步诊断', soap: '首次病程录',
    discharge: '出院记录'
  };

  /** 患者录入提纲：只列「应该问/应该查什么」，不含模板里的具体事实 */
  function outlineOf(t) {
    const out = [];
    const add = (path, section, label) => out.push({ path, section, label });
    const r = t.record || {};
    const chief = (r.basic || {}).chiefComplaint;
    if (chief) add('basic.chiefComplaint', '本范例的问诊线索',
      `围绕范例主诉「${chief}」询问当前患者：是否存在相关症状？何时开始、如何变化？不要照抄范例的时长。`);
    add('hpi', '现病史', '逐项询问起病时间与诱因、症状部位与性质、程度、持续时间、加重缓解因素、伴随症状、诊疗经过及一般情况；按患者实际回答记录。');
    add('pmh', '病史补充', '询问既往疾病、手术外伤、用药及过敏史，补充个人史、婚育史和家族史；不把范例中的阴性病史当作已询问。');
    Object.entries(r.pe || {}).forEach(([group, fields]) => {
      if (!fields || typeof fields !== 'object' || group === 'vitals') return;
      Object.keys(fields).forEach(key => {
        const item = SCHEMA.findPEItem && SCHEMA.findPEItem(group + '.' + key);
        const label = item && (item.item || item).label;
        if (label) add('pe.' + group + '.' + key, '体格检查', `检查并记录：${label}（以本次实际查体为准）`);
      });
    });
    add('pe.vitals', '体格检查', '测量并记录本次生命体征；未检查的项目保持待查。');
    ((r.auxiliary || {}).items || []).forEach((item, i) => {
      if (item.name) add('auxiliary.items.' + i, '本范例涉及的检查核实项目',
        `${item.name}：当前患者是否已有报告？核对日期、来源和实际结果；是否需要检查由临床判断。`);
    });
    add('diagnosis', '诊断与记录', '根据当前患者的病史、查体和实际检查资料整理诊断依据、鉴别诊断与待完善项目，不直接套用范例诊断。');
    return out;
  }

  /**
   * 模板会填哪些路径（不实际写入）。用于界面预览「这份模板大概写了些什么」。
   */
  function previewPaths(key) {
    const t = get(key);
    if (!t) return [];
    const out = [];
    (function walk(node, path) {
      if (!node || typeof node !== 'object') return;
      Object.keys(node).forEach(k => {
        const p = path ? path + '.' + k : k;
        const v = node[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
        else out.push(p);
      });
    })(t.record, '');
    return out;
  }

  /** 记录里已经「有内容」的顶层-二级路径，用于报告「这些没动」 */
  function snapshotNonEmpty(record) {
    const out = [];
    const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
    Object.keys(record || {}).forEach(k => {
      if (!isObj(record[k])) return;
      Object.keys(record[k]).forEach(k2 => {
        const v = record[k][k2];
        const nonEmpty = (typeof v === 'string' && v.trim() !== '')
          || (Array.isArray(v) && v.length > 0)
          || (isObj(v) && Object.keys(v).length > 0);
        if (nonEmpty) out.push(k + '.' + k2);
      });
    });
    return out;
  }

  return {
    listByDept, get, all, apply, previewPaths, deptName, outlineOf, SECTION_LABEL,
    SIDE_PLACEHOLDERS, findUnfilledPlaceholders, unfilledPlaceholders
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATES;
}
