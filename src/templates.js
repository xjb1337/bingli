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

  /**
   * 某个科室有哪些模板。general（通用/全科）返回空数组——
   * 通用科没有「标准病例」这回事，只能从头问。
   */
  function listByDept(deptKey) {
    const k = String(deptKey || '');
    if (!k || k === 'general') return [];
    // 所有模板都挂在具体科室下；不跨科室给，免得学生拿消化科的模板套儿科病历
    return DATA.filter(t => t.dept === k);
  }

  function get(key) {
    const k = String(key || '');
    return DATA.find(t => t.key === k) || null;
  }

  function all() {
    return DATA.slice();
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
   * 注意：模板里的 record 是**完整对象**，但 fillBlanks 只填空位，
   * 所以「先填一半再套模板」也不会把已填的内容冲掉。
   */
  function apply(record, key) {
    const t = get(key);
    if (!t || !record) return { filled: [], count: 0, skipped: [], ok: false };
    if (!RECORD_CORE || !RECORD_CORE.fillBlanks) {
      return { filled: [], count: 0, skipped: [], ok: false };
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

    return {
      ok: true,
      filled,
      count: filled.length,
      skipped: before,
      name: t.name,
      dept: t.dept
    };
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

  return { listByDept, get, all, apply, previewPaths, deptName };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATES;
}