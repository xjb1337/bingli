/* ===========================================================================
 * 病历自查（对照评分表）—— 纯计算，可独立测试
 *
 * 依据：浙江省住院医师规范化培训临床实践能力结业考核·内科（浙医二院 DSY 版）
 *       全文见 tools/评分表全文.txt；逐条对齐结论见 docs/评分表对齐说明.md
 *
 * 定位：把 record 里「已经写成文字的内容」逐条对照评分表，指出病历里还缺
 *       哪些能得分的要素，让使用者交卷前可以自查一遍。它不评价临床判断对
 *       不对，也不替使用者下诊断。
 *
 * 三条硬边界（改这个文件时必须守住）：
 *   1) 只说缺什么，不下诊断结论。所有文案由「还缺…／建议补…」构成，
 *      不出现任何推断性诊断，也不出现「不合格」「不及格」这类评判词。
 *      缺项只是「本工具没核对到」，不代表考官会给 0 分。
 *   2) 区分 A/B 两类要素。A 类（病历文本要素）参与打分；B 类（现场动作：
 *      自我介绍、问诊技巧、医患沟通、查体准备、整体评价）不进病历正文，
 *      只能出提醒，maxScore 固定为 0，绝不参与得分——否则用户会发现
 *      「病历写得再全也永远拿不到 100」。
 *   3) 不碰 DOM、不读写存储。与 core.js 一样，只有纯函数，输入 record，
 *      输出普通对象，可以直接在 node:test 里跑。
 *
 * 依赖：SCHEMA（查体项定义）。浏览器里由 index.html 先载入 SCHEMA；Node 里
 *       优先用 globalThis.SCHEMA，其次 require('./schema.js')。两者都没有时
 *       降级运行（区域类检查仍可工作，腹部次序一项会标注「未能核对」）。
 *
 * 每个检查项的 page 字段都写明评分表出处页码，方便日后回表核对。
 * =========================================================================== */

const CHECKER = (() => {
  'use strict';

  /* ---------------------------------------------------------------------
   * 零、公共工具
   * ------------------------------------------------------------------- */

  const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {};
  const arr = x => Array.isArray(x) ? x : [];
  const txt = x => (typeof x === 'string' ? x.trim() : (x === 0 || x ? String(x).trim() : ''));
  /** 非空字符串 */
  const isS = v => typeof v === 'string' && v.trim() !== '';
  const toNum = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
  const round1 = n => Math.round(n * 10) / 10;
  /**
   * 给一段提示语收尾：已经有句末标点就不再补，避免出现「（5 分）。。」。
   * 提示语是分多处拼起来的，有的自带句号、有的没有，统一在这里收口。
   */
  const endWithPeriod = s => {
    const t = String(s == null ? '' : s).trim();
    if (!t) return '';
    return /[。！？；：，、.!?;:,]$/.test(t) ? t : t + '。';
  };
  const hasAny = (o, keys) => keys.some(k => isS(obj(o)[k]));
  const anyChecked = o => Object.keys(obj(o)).some(k => !!obj(o)[k]);

  /** 传入的 record 容错：任何非对象都当成空病历，避免整页崩掉 */
  const norm = r => (r && typeof r === 'object' && !Array.isArray(r)) ? r : {};

  const DISCLAIMER =
    '本自查只核对「病历里还缺哪些可以写成文字的得分点」，不判断临床对错，也不给出任何诊断结论；' +
    '结果仅供参考，不能代替带教老师、考官或上级医师的现场评判。';

  const PROCESS_NOTE =
    '现场动作分（自我介绍、问诊技巧、医患沟通、查体准备、整体评价、病历卷面与病程记录频次）' +
    '不会出现在病历正文里，本工具只能提醒，不能替你打分。';

  /** 各考站元信息（供界面/自测引用） */
  const STATIONS = [
    { key: 'history', name: '病史采集', page: '第 2 页', fullMaxScore: 100 },
    { key: 'physical', name: '体格检查', page: '第 3-4 页', fullMaxScore: 100 },
    { key: 'firstCourse', name: '首次病程录', page: '第 5 页', fullMaxScore: 100 },
    { key: 'writing', name: '病历书写', page: '第 6-7 页', fullMaxScore: 100 }
  ];

  /* ---------------------------------------------------------------------
   * 一、SCHEMA 延迟获取
   *
   * 不能用顶层直接引用：checker 也要能在「只 require 了 checker」的冒烟测试里
   * 跑通（此时 SCHEMA 还没载入）。
   * ------------------------------------------------------------------- */

  function schemaOf() {
    // ① 浏览器内联顺序里 SCHEMA 是 const 全局，直接用
    try {
      // eslint-disable-next-line no-undef
      if (typeof SCHEMA !== 'undefined' && SCHEMA && Array.isArray(SCHEMA.PE_COMMON)) return SCHEMA;
    } catch (e) { /* TDZ 或未定义，走下一分支 */ }
    // ② Node 测试常用 globalThis.SCHEMA 注入
    try {
      if (typeof globalThis !== 'undefined' && globalThis.SCHEMA &&
          Array.isArray(globalThis.SCHEMA.PE_COMMON)) return globalThis.SCHEMA;
    } catch (e) { /* ignore */ }
    // ③ 兜底自己 require（浏览器里 typeof require 为 'undefined'）
    try {
      if (typeof require === 'function') {
        const S = require('./schema.js');
        if (S && Array.isArray(S.PE_COMMON)) return S;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function peGroup(groupKey) {
    const S = schemaOf();
    if (!S) return null;
    return arr(S.PE_COMMON).find(g => g && g.key === groupKey) || null;
  }

  function peItemDef(groupKey, itemKey) {
    const g = peGroup(groupKey);
    if (!g) return null;
    return arr(g.items).find(it => it && it.key === itemKey) || null;
  }

  /* ---------------------------------------------------------------------
   * 二、检查项构造
   *
   * 统一结构：{ item, page, kind, maxScore, earned, status, suggestion,
   *            priority, note? }
   *   status 只有 ok / weak / missing 三档（契约要求）
   *   suggestion 只在非 ok 时有内容，且一律是「还缺什么」的写法
   *   priority 只用于排序，不影响得分
   *
   * kind 三档（决定这一项参不参与得分）：
   *   content  —— 病历文本要素，maxScore > 0，计入 score / maxScore
   *   advisory —— 病历文本层面的硬性项，但没法折算成「还差几分」
   *               （腹部查体次序、阴性体征是否写全、专科查体是否记录）。
   *               不计分，但进提醒与「最该补」排序
   *   process  —— 现场动作分（自我介绍、问诊技巧、医患沟通、查体准备、
   *               整体评价、病程记录频次、卷面分）。不计分，只提醒，
   *               并汇总成各站的 processMaxScore 说明「这部分本工具不评」
   * ------------------------------------------------------------------- */

  const KIND_CONTENT = 'content';
  const KIND_ADVISORY = 'advisory';
  const KIND_PROCESS = 'process';

  /**
   * @param {string} name       检查项名称
   * @param {string} page       评分表出处（页码 + 评分项目）
   * @param {number} maxScore   评分表标准分；advisory / process 传 0
   * @param {number} earned     本工具核对到的分
   * @param {string} suggestion 非 ok 时的「还缺什么」/「哪些是默认描述」
   * @param {object} opts       { kind, status, weight, note, isDefault }
   */
  function item(name, page, maxScore, earned, suggestion, opts) {
    const o = opts || {};
    const m = round1(Math.max(0, toNum(maxScore)));
    let e = round1(Math.max(0, Math.min(toNum(earned), m)));
    let status = o.status;
    if (!status) {
      if (m > 0) status = e >= m - 0.05 ? 'ok' : (e > 0 ? 'weak' : 'missing');
      else status = 'ok';
    }
    // 显式判 ok 的项一律按满分记录，避免出现「ok 但只有 4.5/5」的矛盾展示
    if (status === 'ok' && m > 0) e = m;
    const weight = o.weight !== undefined ? toNum(o.weight) : m;
    const priority = status === 'ok'
      ? 0
      : round1(Math.max(m - e, m > 0 ? m * 0.3 : weight));
    const out = {
      item: name,
      page: page,
      kind: o.kind || KIND_CONTENT,
      maxScore: m,
      earned: e,
      status: status,
      // isDefault：这一项拿到的分里，内容全部来自 schema 默认描述（未经核对）。
      // 一定有这个字段，界面可以直接读，不用判 undefined。
      isDefault: !!o.isDefault,
      suggestion: status === 'ok' ? '' : String(suggestion || ''),
      priority: priority
    };
    if (o.note) out.note = o.note;
    return out;
  }

  /** 汇总成一个考站结果 */
  function finalize(meta, items, extra) {
    const content = items.filter(i => i.kind === KIND_CONTENT);
    const advisory = items.filter(i => i.kind === KIND_ADVISORY);
    const process = items.filter(i => i.kind === KIND_PROCESS);
    const score = round1(content.reduce((s, i) => s + i.earned, 0));
    const maxScore = round1(content.reduce((s, i) => s + i.maxScore, 0));
    const base = {
      station: meta.station,
      key: meta.key,
      page: meta.page,
      score: score,
      maxScore: maxScore,
      percent: maxScore > 0 ? round1(score / maxScore * 100) : 0,
      lost: round1(maxScore - score),
      // 现场动作分：不计入 score/maxScore，只用于提示
      processMaxScore: round1(meta.processMaxScore || 0),
      processItems: process.length,
      // 病历文本层的硬性提醒项（腹部次序、阴性体征等），不计分
      advisoryItems: advisory.length,
      advisoryFailed: advisory.filter(i => i.status !== 'ok').length,
      fullMaxScore: round1(meta.fullMaxScore || maxScore),
      items: items,
      disclaimer: DISCLAIMER
    };
    // 用了默认描述的项数（供界面显示「其中 N 项未核对」）
    base.defaultCount = items.filter(i => i.isDefault).length;
    base.defaultScore = round1(
      items.filter(i => i.isDefault).reduce((s, i) => s + i.earned, 0));
    const notes = (meta.notes || []).slice();
    if (PROCESS_NOTE) notes.push(PROCESS_NOTE);
    base.notes = notes;
    if (extra) Object.keys(extra).forEach(k => { base[k] = extra[k]; });
    return base;
  }

  /* ---------------------------------------------------------------------
   * 三、诊断性词语识别（只用于提醒「主诉/书写里用了诊断名称」）
   *
   * 注意：这不是在猜诊断，而是反过来——把使用者自己写进主诉里的病名挑出来，
   * 提醒他主诉应该写症状。命中只影响提示文案，不产生任何医学判断。
   * ------------------------------------------------------------------- */

  const DIAG_TERMS = [
    '高血压', '糖尿病', '冠心病', '心肌梗死', '心梗', '心绞痛', '心力衰竭', '心衰',
    '房颤', '心房颤动', '心律失常', '瓣膜病', '心内膜炎',
    '肺炎', '肺结核', '哮喘', '慢阻肺', 'COPD', '支气管炎', '气胸', '肺栓塞', '支气管扩张',
    '胃炎', '胃溃疡', '十二指肠溃疡', '胆囊炎', '胆结石', '胰腺炎', '阑尾炎',
    '肠梗阻', '肠炎', '肝炎', '肝硬化', '消化道出血', '消化性溃疡',
    '肾炎', '肾病', '肾功能不全', '肾衰竭', '尿路感染', '泌尿系感染', '肾结石',
    '贫血', '白血病', '淋巴瘤', '血小板减少', '血友病',
    '脑梗死', '脑梗', '脑出血', '脑卒中', '偏头痛', '癫痫', '帕金森',
    '甲亢', '甲减', '甲状腺功能亢进', '甲状腺功能减退', '风湿', '类风湿', '痛风', '红斑狼疮',
    '骨折', '脱位', '疝气', '痔疮',
    '肿瘤', '癌', '肉瘤',
    '妊娠期高血压', '子痫', '宫外孕', '异位妊娠', '盆腔炎'
  ];

  /** 病名常见结尾，用来兜住上面清单没覆盖到的写法 */
  const DIAG_SUFFIX = /(炎|癌|瘤|病|症|梗死|衰竭|综合征|功能不全|结石|溃疡|骨折|感染|贫血|血症)$/;

  /**
   * 从一段文字里挑出「像病名」的词。
   * @returns {string[]} 命中的词（去重）
   */
  function diagWordsIn(text) {
    const s = txt(text);
    if (!s) return [];
    const hits = [];
    DIAG_TERMS.forEach(t => { if (s.indexOf(t) >= 0 && hits.indexOf(t) < 0) hits.push(t); });
    // 按标点切成短语，去掉结尾的「数字＋时间单位」，再看结尾是不是病名尾缀
    s.split(/[，,、；;。\s]/).forEach(clause => {
      const c = clause
        .replace(/[0-9０-９一二三四五六七八九十百]+(天|日|周|月|年|小时|分钟|min|h)?$/g, '')
        .trim();
      if (c.length >= 2 && DIAG_SUFFIX.test(c) && hits.indexOf(c) < 0) hits.push(c);
    });
    return hits;
  }

  /** 是否含否定表述（用来判断「有没有写阴性体征/阴性病史」） */
  const NEG_WORDS = /(未闻及|未触及|未引出|未扪及|未查见|未见|无|没有|否认|阴性|不)/;

  /* =====================================================================
   * 四、考站一 · 病史采集（第 2 页，100 分）
   *
   * 病历文本可核对 58 分：
   *   一般情况 5（自我介绍 2 分属现场动作）
   *   现病史 30 = 主诉 5 + 诱因 2 + 症状与过程 8 + 伴随/阴性鉴别 5 + 诊疗经过 5 + 一般状况 5
   *   既往史 12（6 项 × 2）
   *   个人史 6（3 项 × 2）
   *   家族史 5（2 项 × 2.5）
   * 现场动作 42 分：自我介绍 2 + 问诊技巧 18 + 医患沟通 22
   * =================================================================== */

  function checkHistory(r) {
    const rec = norm(r);
    const b = obj(rec.basic);
    const h = obj(rec.hpi);
    const pmh = obj(rec.pmh);
    const per = obj(rec.personal);
    const fam = obj(rec.family);
    // exam 是应试自查区（B 类），本版 schema 可能还没有，缺失时按「未自评」处理
    const exam = obj(rec.exam);
    const items = [];

    /* ---------- 一般情况（第 2 页，7 分 = 自我介绍 2 + 基本信息 5） ---------- */

    // 检查者自我介绍（姓名、职务或职责，每项 1 分）2 分 ——第 2 页·一般情况
    {
      const self = obj(exam.selfIntro);
      const got = (isS(self.name) ? 1 : 0) + (isS(self.role) ? 1 : 0);
      items.push(item(
        '检查者自我介绍（姓名＋职务/职责）',
        '第 2 页·一般情况',
        0, got,
        '还缺：向患者说明自己的姓名和职务/职责（各 1 分）。这一项不会写进病历正文，' +
        '属于现场动作，请在自己的问诊流程里固定下来。',
        { kind: KIND_PROCESS, weight: 3, status: got === 2 ? 'ok' : (got === 1 ? 'weak' : 'missing') }
      ));
    }

    // 询问患者的姓名、年龄、病历号、职业、籍贯等基本情况（每项 1 分）5 分 ——第 2 页·一般情况
    {
      const cells = [
        ['姓名', isS(b.name)],
        ['年龄', isS(b.age)],
        ['病历号/住院号', isS(b.recordNo)],
        ['职业', isS(b.occupation)],
        ['籍贯', isS(b.birthPlace)]
      ];
      const got = cells.filter(c => c[1]).length;
      const miss = cells.filter(c => !c[1]).map(c => c[0]);
      items.push(item(
        '患者基本情况（姓名/年龄/病历号/职业/籍贯）',
        '第 2 页·一般情况',
        5, got,
        miss.length ? '还缺：' + miss.join('、') + '（每项 1 分）。' : '',
        { note: miss.length ? '这 5 项同时是一般项目的基本内容，写进病历也顺带把分数拿了。' : '' }
      ));
    }

    /* ---------- 现病史（第 2 页，30 分） ---------- */

    // 主诉：起病情况与时间（每项 2.5 分）5 分 ——第 2 页·现病史
    // 另参第 6 页·主诉「简明、扼要、完整，原则上不用诊断名称」
    {
      const cc = txt(b.chiefComplaint);
      const dur = txt(b.chiefComplaintDuration);
      // 主诉时长现在由学生自己写在主诉正文里（界面上已没有「持续时间/单位」两个框）。
      // 所以这里必须能从正文里认出来，否则一份「反复上腹痛2年」的规范主诉会被判成
      // 「还缺持续时间」，把 2.5 分白白扣掉。
      // 允许末尾带「余/多/左右/来/许」这类约数词——学生真的会写「咳嗽3月余」。
      const ccHasDur = /[0-9０-９一二三四五六七八九十百千万两半十几数]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|min|h)(?:余|多|左右|来|许)?$/i.test(cc);
      const onset = txt(h.onset);
      let earned = 0;
      if (cc && (dur || ccHasDur)) earned += 2.5;   // 起病时间
      if (onset) earned += 2.5;                      // 起病情况（缓急、起病情形）

      const bad = diagWordsIn(cc);
      const problems = [];
      if (!cc) {
        problems.push('还缺主诉正文：只写「症状＋时间」，不写病名');
      } else {
        if (!dur && !ccHasDur) problems.push('主诉末尾还缺持续时间（2.5 分）：例如「反复上腹痛2年」');
        if (bad.length) {
          problems.push('主诉里出现了诊断性词语「' + bad.join('、') + '」，' +
            '评分表要求主诉原则上不用诊断名称，建议改成症状描述');
        }
        if (cc.length > 20) problems.push('主诉共 ' + cc.length + ' 字，超过 20 字，建议压缩到「症状＋时间」');
      }
      if (!onset) problems.push('还缺起病情况（2.5 分）：起病缓急、在什么情形下起病');

      items.push(item(
        '主诉（起病情况与时间）',
        '第 2 页·现病史／第 6 页·主诉',
        5, earned,
        problems.length ? problems.join('；') + '。' : '',
        // 有表达问题但分值已齐时，也要提示出来（不给 0，只是提醒改写法）
        { status: problems.length ? (earned > 0 ? 'weak' : 'missing') : undefined }
      ));
    }

    // 发病诱因 2 分 ——第 2 页·现病史；第 6 页·现病史「诱因」
    {
      const cause = txt(h.cause);
      const onset = txt(h.onset);
      const CAUSE_HINT = /(受凉|感冒|进食|饭后|空腹|劳累|疲劳|熬夜|情绪|生气|激动|外伤|扭伤|感染|饮酒|酗酒|吸烟|运动|接触|服用|停药|妊娠|分娩|手术|天气|淋雨|饮食不当)/;
      const inOnset = !cause && CAUSE_HINT.test(onset);
      let earned = 0;
      if (cause) earned = 2;
      else if (inOnset) earned = 1;   // 混写在起病情况里，能得分但不好核对
      items.push(item(
        '发病诱因',
        '第 2 页·现病史／第 6 页·现病史',
        2, earned,
        cause ? '' :
          (inOnset
            ? '诱因目前混写在「起病情况」里，建议单独写一句（如「受凉后出现…」），考官按点核对时更好找。'
            : '还缺发病诱因（2 分）：发病前有无受凉、饮食不当、劳累、情绪激动、外伤等。'),
        { note: '若确实无明显诱因，写「无明显诱因」也算写了，比空着好核对。' }
      ));
    }

    // 主要症状和发病过程（每项 4 分）8 分 ——第 2 页·现病史
    {
      const symptoms = txt(h.symptoms);
      const evolution = txt(h.evolution);
      const earned = (symptoms ? 4 : 0) + (evolution ? 4 : 0);
      const miss = [];
      if (!symptoms) miss.push('主要症状的特点（部位、性质、程度、持续时间、加重或减轻的因素）4 分');
      if (!evolution) miss.push('发病过程（症状如何演变、加重或缓解）4 分');
      items.push(item(
        '主要症状和发病过程',
        '第 2 页·现病史',
        8, earned,
        miss.length ? '还缺：' + miss.join('；') + '。' : ''
      ));
    }

    // 伴随症状和阴性鉴别症状（每项 2.5 分）5 分 ——第 2 页·现病史
    // 第 6 页·现病史另有一项：「具有鉴别诊断意义的阴性病史」
    {
      const acc = txt(h.accompanying);
      const neg = txt(h.negativeDiscriminating);
      const negInsideAcc = !neg && NEG_WORDS.test(acc);
      const earned = (acc ? 2.5 : 0) + (neg ? 2.5 : (negInsideAcc ? 1.5 : 0));
      const miss = [];
      if (!acc) miss.push('伴随症状 2.5 分');
      if (!neg) {
        miss.push(negInsideAcc
          ? '阴性鉴别症状没有单独成句（看起来混写在伴随症状里，建议单列一句）'
          : '有鉴别诊断意义的阴性症状 2.5 分（如「无咯血、无盗汗、无体重下降」）');
      }
      items.push(item(
        '伴随症状和阴性鉴别症状',
        '第 2 页·现病史／第 6 页·现病史',
        5, earned,
        miss.length ? '还缺：' + miss.join('；') + '。' : ''
      ));
    }

    // 诊疗经过（诊治单位、检查结果、治疗措施、用药情况及治疗效果，每项 1 分）5 分 ——第 2 页·现病史
    {
      const t = txt(h.treatment);
      const groups = [
        { name: '在何处就诊（诊治单位）', re: /(医院|卫生院|诊所|门诊|急诊|社区卫生|当地|外院|我院|卫生室)/ },
        { name: '做过什么检查及结果', re: /(查|检查|化验|CT|B超|超声|X线|胸片|心电图|血常规|尿常规|生化|培养|胃镜|穿刺)/i },
        // 注意要认出「予…抗感染」这种不含「药」字的写法，否则会误报「没写用药」
        { name: '用了什么治疗/药物', re: /(药|服用|口服|静脉|输液|抗生素|抗菌|抗感染|点滴|中药|激素|治疗|打针|予|给予|用了|服)/ },
        { name: '治疗后效果如何', re: /(好转|缓解|无效|未见好转|加重|减轻|控制|疗效|效果|仍|未见明显)/ }
      ];
      const miss = groups.filter(g => !g.re.test(t)).map(g => g.name + ' 1 分');
      const hit = groups.length - miss.length;
      const earned = t ? 5 * hit / groups.length : 0;
      items.push(item(
        '诊疗经过（单位/检查/用药/效果）',
        '第 2 页·现病史',
        5, earned,
        t ? (miss.length ? '诊疗经过里还看不到：' + miss.join('；') + '。' : '')
          : '还缺诊疗经过（5 分）：在何处就诊、做过什么检查、用了什么药、效果如何，各 1 分。'
      ));
    }

    // 目前一般状况（饮食、睡眠、大小便、体重变化等，每项 1 分）5 分 ——第 2 页·现病史
    {
      const g = txt(h.generalCondition);
      const groups = [
        { name: '精神', re: /(精神|神志|乏力|疲乏)/ },
        { name: '饮食（食欲）', re: /(饮食|食欲|纳差|食纳|进食)/ },
        { name: '睡眠', re: /(睡眠|入睡|眠差|失眠)/ },
        { name: '大小便', re: /(大小便|二便|小便|大便|尿|便)/ },
        { name: '体重变化', re: /(体重)/ }
      ];
      const miss = groups.filter(x => !x.re.test(g)).map(x => x.name + ' 1 分');
      const hit = groups.length - miss.length;
      const earned = g ? 5 * hit / groups.length : 0;
      items.push(item(
        '发病后一般情况（饮食/睡眠/大小便/体重）',
        '第 2 页·现病史',
        5, earned,
        g ? (miss.length ? '一般情况里还看不到：' + miss.join('；') + '。' : '')
          : '还缺发病后一般情况（5 分）：精神、饮食、睡眠、大小便、体重变化，各 1 分。'
      ));
    }

    /* ---------- 既往史（第 2 页，12 分 = 6 项 × 2） ---------- */

    // 注意（t9）：generator.buildPMH 在字段为空时会自动输出「否认手术、外伤史」
    // 这类阴性句。那是**生成器的话，不是用户填的**，不能因此给分——否则空病历
    // 也能拿到既往史 12 分里的绝大部分。下面一律只认 record.pmh 里的真实输入。
    {
      // 评分表把「曾患病史」和「长期用药史」算在同一个 2 分项里，所以各按 1 分核对。
      const chronic = anyChecked(pmh.diseaseChecks) ||
        isS(pmh.diseaseDetail) || isS(pmh.diseaseOther);
      const meds = isS(pmh.longTermMeds);
      items.push(item(
        '既往史—曾患病及长期用药史',
        '第 2 页·既往史',
        2, (chronic ? 1 : 0) + (meds ? 1 : 0),
        (chronic ? '' : '还缺曾患病史（1 分）：既往患过什么病，或明确写「否认慢性病史」。') +
          (meds ? '' : '还缺长期用药史：目前长期服用哪些药、剂量与疗程。')
      ));
    }
    {
      const surgery = isS(pmh.surgery) || isS(pmh.trauma);
      items.push(item(
        '既往史—手术外伤史',
        '第 2 页·既往史',
        2, surgery ? 2 : 0,
        surgery ? '' : '还缺手术、外伤史（2 分）：做过什么手术、有无外伤；都没有也请明确写「否认」。'
      ));
    }
    {
      const allergy = txt(pmh.allergy);
      const allergen = anyChecked(pmh.allergenChecks) || isS(pmh.allergenOther);
      const reaction = isS(pmh.allergyReaction) || anyChecked(pmh.allergenReactionChecks);
      let earned = 0;
      if (allergy === '有') earned = (allergen ? 1 : 0.5) + (reaction ? 1 : 0);
      else if (allergy === '无') earned = 2;
      const tips = [];
      if (allergy === '有') {
        if (!allergen) tips.push('还缺过敏原：对什么药/食物过敏');
        if (!reaction) tips.push('还缺过敏反应的表现（皮疹、瘙痒、呼吸困难等）');
      } else if (allergy === '无') {
        tips.push('');
      } else {
        tips.push('还缺食物药物过敏史（2 分）：有过敏请写过敏原与反应表现，无过敏请明确选「无」');
      }
      items.push(item(
        '既往史—食物药物过敏史',
        '第 2 页·既往史',
        2, earned, tips.filter(Boolean).join('；') + (tips.filter(Boolean).length ? '。' : '')
      ));
    }
    {
      const inf = isS(pmh.infection);
      items.push(item(
        '既往史—传染性疾病史',
        '第 2 页·既往史',
        2, inf ? 2 : 0,
        inf ? '' : '还缺传染性疾病史（2 分）：肝炎、结核等；没有也请明确写「否认」。'
      ));
    }
    {
      const tr = isS(pmh.transfusion);
      items.push(item(
        '既往史—输血史',
        '第 2 页·既往史',
        2, tr ? 2 : 0,
        tr ? '' : '还缺输血史（2 分）：有无输血；没有也请明确写「否认」。'
      ));
    }
    {
      const vac = isS(pmh.vaccine);
      items.push(item(
        '既往史—预防接种史',
        '第 2 页·既往史',
        2, vac ? 2 : 0,
        vac ? '' : '还缺预防接种史（2 分）：这一项生成器不会自动补，需明确写出（如「按时接种，无异常反应」）。'
      ));
    }

    /* ---------- 个人史（第 2 页，6 分 = 3 项 × 2） ---------- */

    {
      // personal.smoking 在 emptyRecord 里默认就是 '无'。用户点「无」和「没点过」
      // 存下来是同一个值，无法区分，所以不能只看这个开关。
      // 判定「写过吸烟史」的证据有两条，任一条成立即可：
      //   ① 选了「有」或「已戒」
      //   ② 在「吸烟情况」里填了文字（不吸烟的人在这里写「不吸烟」同样算写过）
      const smoking = txt(per.smoking);
      const amount = isS(per.smokingAmount);
      const smoked = smoking === '有' || smoking === '已戒';
      let earned = 0;
      if (smoked) earned = amount ? 2 : 1.5;
      else if (amount) earned = 2;
      items.push(item(
        '个人史—吸烟史',
        '第 2 页·个人史',
        2, earned,
        earned === 2 ? ''
          : (smoked
            ? '还缺吸烟的量与年限（如「20 支/天×30 年」）。'
            : '还缺吸烟史（2 分）：是否吸烟、每日支数、年限；不吸烟也请在「吸烟情况」里写明「不吸烟」。')
      ));
    }
    {
      // 同吸烟史：drinking 默认 '无'，靠「有/已戒」或「饮酒情况」里的文字判定
      const drinking = txt(per.drinking);
      const amount = isS(per.drinkingAmount);
      const drank = drinking === '有' || drinking === '已戒';
      let earned = 0;
      if (drank) earned = amount ? 2 : 1.5;
      else if (amount) earned = 2;
      items.push(item(
        '个人史—饮酒史',
        '第 2 页·个人史',
        2, earned,
        earned === 2 ? ''
          : (drank
            ? '还缺饮酒的量与年限（如「白酒 2 两/天×10 年」）。'
            : '还缺饮酒史（2 分）：是否饮酒、种类、量、年限；不饮酒也请在「饮酒情况」里写明「不饮酒」。')
      ));
    }
    // 婚育史（女性为月经婚育史）2 分 ——第 2 页·个人史
    {
      const isFemale = txt(b.gender) === '女';
      // marriage.status 默认 '未婚'、basic.marital 默认 ''：
      // 只有明确不是默认值「未婚」时才算用户填过；basic.marital 是用户主动选的，直接认。
      const mStatus = txt(obj(rec.marriage).status);
      const bMarital = txt(b.marital);
      const marry = bMarital || (mStatus && mStatus !== '未婚' ? mStatus : '');
      const men = obj(rec.menstruation);
      const cb = obj(rec.childbirth);
      const menAny = hasAny(men, ['age', 'cycle', 'duration', 'quantity', 'lmp', 'menopauseAge', 'extra']) ||
        isS(men.applicable);
      const cbAny = hasAny(cb, ['gravida', 'para', 'abortion', 'details', 'lastBirth', 'contraception']) ||
        isS(cb.applicable);
      let earned = 0;
      const tips = [];
      if (isFemale) {
        earned = (marry ? 1 : 0) + (menAny ? 0.5 : 0) + (cbAny ? 0.5 : 0);
        if (!marry) tips.push('婚姻状况');
        if (!menAny) tips.push('月经史（初潮、周期、经期、末次月经）');
        if (!cbAny) tips.push('生育史（孕产次、流产、避孕方式）');
      } else {
        earned = marry ? 2 : 0;
        if (!marry) tips.push('婚姻状况（未婚/已婚/离异/丧偶）');
      }
      items.push(item(
        '个人史—婚育史（女性为月经婚育史）',
        '第 2 页·个人史',
        2, earned,
        tips.length ? '还缺：' + tips.join('；') + '。' : ''
      ));
    }

    /* ---------- 家族史（第 2 页，5 分 = 2 项 × 2.5） ---------- */

    {
      // generator.buildFamily 在没勾选时也会输出「家族中无类似疾病患者」——那是生成器的
      // 默认句，不算用户填过（t9）。只认 diseaseChecks / 手写字段。
      const famAny = anyChecked(fam.diseaseChecks) || isS(fam.other) ||
        isS(fam.similarDisease) || isS(fam.deceased);
      items.push(item(
        '家族史—家庭中与本病相似的病情',
        '第 2 页·家族史',
        2.5, famAny ? 2.5 : 0,
        famAny ? ''
          : '还缺家族史中的类似病情（2.5 分）：父母、兄弟姐妹、子女有无同类疾病；' +
            '都没有也请明确写「家族中无类似疾病患者」。',
        { note: famAny ? '' : '生成器会自动补一句「无类似疾病患者」，但那不是你的录入，不给你计分。' }
      ));
    }
    {
      const three = txt(fam.threeGeneration);
      const threeMentioned = three && /两系|三代|父系|母系|祖辈|无遗传/.test(three);
      items.push(item(
        '家族史—两系三代遗传疾病史',
        '第 2 页·家族史',
        2.5, three ? (threeMentioned ? 2.5 : 1.5) : 0,
        three
          ? (threeMentioned ? '' : '「两系三代」还缺明确表述：建议写成「两系三代无遗传性疾病史」或分别说明父系/母系。')
          : '还缺两系三代遗传疾病史（2.5 分）：父系、母系三代内有无遗传性疾病，生成器目前不会自动补这一句。'
      ));
    }

    /* ---------- 问诊技巧（第 2 页，18 分，B 类） ---------- */

    const inquiry = obj(exam.inquiry);
    const communication = obj(exam.communication);

    items.push(item(
      '问诊技巧—有条理、顺序流畅',
      '第 2 页·问诊技巧',
      0, 0,
      '这一项评的是现场问诊，不会写进病历。自查时确认：是否按「主诉→现病史→既往史→个人史→家族史」的次序走，重点突出（4 分）。',
      { kind: KIND_PROCESS, weight: 2, status: inquiry.structured ? 'ok' : 'missing' }
    ));
    items.push(item(
      '问诊技巧—体现鉴别诊断思维',
      '第 2 页·问诊技巧',
      0, 0,
      '自查时确认：是否为鉴别诊断主动追问了阴性症状（4 分）。病历里对应的落点是「有鉴别诊断意义的阴性症状」。',
      { kind: KIND_PROCESS, weight: 2, status: inquiry.diffThinking ? 'ok' : 'missing' }
    ));
    items.push(item(
      '问诊技巧—语言恰当，不过度引导或指责',
      '第 2 页·问诊技巧',
      0, 0,
      '现场动作项（5 分），自查时回放一下自己的提问方式有没有暗示性、有没有评判性措辞。',
      { kind: KIND_PROCESS, weight: 2, status: inquiry.language ? 'ok' : 'missing' }
    ));
    items.push(item(
      '问诊技巧—全程对患者境遇表示同情和鼓励',
      '第 2 页·问诊技巧',
      0, 0,
      '现场动作项（5 分），自查时确认有没有对患者的处境作出回应。',
      { kind: KIND_PROCESS, weight: 2, status: inquiry.empathy ? 'ok' : 'missing' }
    ));

    /* ---------- 医患沟通（第 2 页，22 分，B 类） ---------- */

    items.push(item(
      '医患沟通—态度和蔼、表述专业到位',
      '第 2 页·医患沟通',
      0, 0,
      '现场动作项（5 分），不进病历正文。',
      { kind: KIND_PROCESS, weight: 2, status: communication.attitude ? 'ok' : 'missing' }
    ));
    items.push(item(
      '医患沟通—总结病史并主动初步沟通',
      '第 2 页·医患沟通',
      0, 0,
      '现场动作项（总结 5 分 + 主动沟通 5 分）。自查时确认：有没有把问到的信息回述一遍给患者/家属。',
      { kind: KIND_PROCESS, weight: 3, status: (communication.summarize && communication.proactive) ? 'ok' : 'missing' }
    ));
    items.push(item(
      '医患沟通—耐心回答患者提问并给建议',
      '第 2 页·医患沟通',
      0, 0,
      '现场动作项（5 分）。',
      { kind: KIND_PROCESS, weight: 2, status: communication.advice ? 'ok' : 'missing' }
    ));
    items.push(item(
      '医患沟通—了解家庭经济与医疗保障情况',
      '第 2 页·医患沟通',
      0, 0,
      '这一项 2 分最容易漏：自查时确认有没有问一句家庭经济支付能力和医保情况。',
      { kind: KIND_PROCESS, weight: 2, status: communication.finance ? 'ok' : 'missing' }
    ));

    return finalize({
      station: '病史采集',
      key: 'history',
      page: '第 2 页',
      processMaxScore: 42,   // 自我介绍 2 + 问诊技巧 18 + 医患沟通 22
      fullMaxScore: 100,
      notes: [
        '本工具可核对的病历文本分合计 58 分；自我介绍 2 分、问诊技巧 18 分、医患沟通 22 分（合计 42 分）' +
        '属现场动作评分，不会出现在病历正文里。'
      ]
    }, items);
  }

  /* =====================================================================
   * 五、考站二 · 体格检查（第 3-4 页，100 分）
   *
   * 病历文本可核对 93 分：
   *   一般情况及头颈部 18（查体准备 2 分属现场动作）
   *   胸部 20 / 腹部 20 / 神经系统及四肢 20
   *   重点查体 15
   * 现场动作 7 分：查体准备 2 + 整体评价 5
   *
   * ★ 腹部次序：评分表第 3 页原文「腹部（20 分。腹部检查次序正确得 2 分…）」，
   *   细则顺序为 视诊→听诊→叩诊→触诊。abdomenOrder() 同时核对
   *   ①SCHEMA 里声明顺序 ②GENERATOR 实际输出的段落顺序（若已载入）。
   * =================================================================== */

  /* ---------------------------------------------------------------------
   * ★ 计分口径（t10 起，用户拍板）
   *
   * 两件事要同时给用户：
   *   ① 完成度 —— 「我填了多少」
   *   ② 核对提醒 —— 「哪些是没核对过的默认描述」
   *
   * 所以判定规则是：
   *   record.pe[组][项] 有非空值  → **计分**（哪怕这值正好等于 schema 默认文案）
   *   该值等于 default/legacyDefault → 额外打 isDefault=true 标记
   *
   * 为什么不再「默认值不给分」：病历预览里明明写着「气管居中」，自查却说
   * 「还缺记录」，用户会认为工具坏了，进而不再信任它的所有提示。
   *
   * 但空病历仍然必须是 0 分：emptyRecord() 的 pe.* 是空对象、没有任何键，
   * 所以「没录入」依然是 0——这与「录了默认值」是两件事，必须分开。
   *
   * 历史教训（t9）：更早的 peEffVal() 会回退到 schema 默认值，导致空病历
   * 自动「写全」拿 52.5/93。所以这里**只读 record.pe 的存储位**，不回退到
   * 默认值；默认值只用来打标记，不用来凭空造分。
   * ------------------------------------------------------------------- */

  /** 该查体项在 record.pe 里真正存着的原始值（不做任何默认值兜底） */
  function peUserVal(rec, groupKey, itemKey) {
    const v = obj(obj(rec.pe)[groupKey])[itemKey];
    return v === undefined || v === null ? '' : String(v).trim();
  }

  /**
   * 这一项是否「有记录」——有非空值就算（等于默认值也算）。
   * 这是计分的唯一入口；要判断「是不是默认值」请用 peIsDefault()。
   */
  function peFilled(rec, groupKey, itemKey) {
    return peUserVal(rec, groupKey, itemKey) !== '';
  }

  /** 去掉尾部标点，用来容忍「…未触及」与「…未触及。」这类录入差异 */
  const stripPunct = s => String(s == null ? '' : s).trim().replace(/[，,；;。\s]+$/g, '');

  /**
   * 该值是否就是 schema 里声明的默认描述（含 legacyDefault）。
   * peValueIsDefault() 继续用，用途从「排除计分」改为「打标记」。
   * @returns {boolean}
   */
  function peIsDefault(rec, groupKey, itemKey) {
    const raw = peUserVal(rec, groupKey, itemKey);
    if (!raw) return false;
    const def = peItemDef(groupKey, itemKey);
    if (!def) return false;
    const S = schemaOf();
    if (S && typeof S.peValueIsDefault === 'function' && S.peValueIsDefault(def, raw)) return true;
    // schema 工具未载入或未命中时，自己再比一次（含尾部标点归一化）
    const d1 = stripPunct(def.default);
    const d2 = stripPunct(def.legacyDefault);
    const v = stripPunct(raw);
    return !!((d1 && v === d1) || (d2 && v === d2));
  }

  /** 该项已记录的文字（等于默认值也照常返回，供内容要点核对用） */
  function peUserText(rec, groupKey, itemKey) {
    return peFilled(rec, groupKey, itemKey) ? peUserVal(rec, groupKey, itemKey) : '';
  }

  /**
   * 组装「用了默认值」的提示语。
   * 刻意不出现「还缺」——这一项其实是有内容的，只是没核对过。
   */
  function defaultHint(names) {
    const n = arr(names).filter(Boolean);
    if (!n.length) return '';
    return n.join('、') + ' 目前用的是默认描述，建议核对后保留，或按本例实际情况修改。';
  }

  /**
   * 一组子项 + 可选的「父项合并描述」的得分。
   *
   * 为什么要专门处理：父项（如 abdomen.abdPalpation）是一句覆盖所有子项的合并描述，
   * 子项（浅触/深触/肝/脾）才是评分表按项给分的位置。若实现成「有子项就不算父项」，
   * 用户先填父项（拿 5 分）再补一个子项，分数会从 5 掉到 2.5——**填得更多反而扣分**。
   *
   * 所以父项给一个保底分，逐项填写只会在保底之上加分，保证单调。
   *   parentVal = { share, label }，传 null/undefined 表示该组没有父项兜底。
   * @returns {{earned:number, miss:string[], defaults:string[]}}
   */
  function specScoreWithParent(rec, subs, parentRef, parentVal) {
    const r = specScore(rec, subs);
    let earned = r.earned;
    const defaults = r.defaults.slice();
    if (parentVal && parentVal.share && parentRef) {
      if (peFilled(rec, parentRef.g, parentRef.k)) {
        // 父项保底：不低于「只写了父项」时的得分
        earned = Math.max(earned, toNum(parentVal.share));
        if (peIsDefault(rec, parentRef.g, parentRef.k)) defaults.push(parentVal.label || '合并描述');
      }
    }
    return { earned: earned, miss: r.miss, defaults: defaults };
  }

  /**
   * 一个区域里若干项：有记录就按份额给分，等于默认值的另外标记。
   * @returns {{earned:number, miss:string[], defaults:string[]}}
   */
  function specScore(rec, specs) {
    let earned = 0;
    const miss = [];
    const defaults = [];
    specs.forEach(sp => {
      const label = sp.label || (sp.g + '.' + sp.k);
      if (!peFilled(rec, sp.g, sp.k)) { miss.push(label); return; }
      earned += toNum(sp.share);
      if (peIsDefault(rec, sp.g, sp.k)) defaults.push(label);
    });
    return { earned: earned, miss: miss, defaults: defaults };
  }

  /** 区域型检查项：把 specScore 的结果直接转成 item */
  function specItem(name, page, maxScore, specs, rec, opts) {
    const r = specScore(rec, specs);
    const tips = [];
    if (r.miss.length) tips.push('还缺：' + r.miss.join('、') + ' 的记录。');
    if (r.defaults.length) tips.push(defaultHint(r.defaults));
    const o = Object.assign({}, opts);
    if (o.isDefault === undefined) o.isDefault = r.defaults.length > 0 && r.miss.length === 0;
    return item(name, page, maxScore, r.earned, tips.join(''), o);
  }

  /** 腹部四项的相位（用于次序核对） */
  function abdPhase(it) {
    const k = String(obj(it).key || '');
    const label = String(obj(it).label || '');
    const s = k + ' ' + label;
    if (/Inspect|视诊/.test(s)) return 'inspect';
    if (/Auscult|听诊/.test(s)) return 'auscultation';
    if (/Percuss|叩诊/.test(s)) return 'percussion';
    if (/Palp|触诊|肝|脾/.test(s)) return 'palpation';
    return '';
  }

  const ABD_EXPECTED = ['inspect', 'auscultation', 'percussion', 'palpation'];
  const ABD_PHASE_CN = {
    inspect: '视诊', auscultation: '听诊', percussion: '叩诊', palpation: '触诊'
  };

  /**
   * 核对腹部查体次序（评分表第 3 页：腹部检查次序正确得 2 分）
   *
   * 判定分两问：
   *   ① 用户到底做了几个腹部查体相位？（写了 0 个相位，就无所谓「次序对不对」）
   *   ② 已写的那几个相位，先后顺序对不对？
   * 只有「至少写了 2 个相位」且「顺序正确」才算 ok——否则空病历会被判成
   * 「次序正确」，那等于凭空送分（t9 修的第二个泄漏点）。
   *
   * @returns {{available:boolean, ok:boolean, observed:string[], done:number, source:string}}
   */
  function abdomenOrder(rec) {
    const g = peGroup('abdomen');
    if (!g || !arr(g.items).length) {
      return { available: false, ok: false, observed: [], done: 0, source: 'no-schema' };
    }
    // 只按「各相位第一次出现的位置」比较，子项（浅触/深触/肝/脾）不干扰结果
    const seq = [];
    const done = [];   // 用户实际写过的相位
    arr(g.items).forEach(it => {
      const p = abdPhase(it);
      if (p && seq.indexOf(p) < 0) seq.push(p);
      if (p && done.indexOf(p) < 0 && peFilled(rec, 'abdomen', it.key)) done.push(p);
    });
    let ok = seq.join('>') === ABD_EXPECTED.join('>');
    // 四个相位都写到才谈得上「次序正确」，否则只是残缺记录，不能给通过
    if (done.length < 4) ok = false;

    // 若已载入 GENERATOR，再核对一遍实际输出（防止 schema 对了、输出又被打乱）。
    // 注意：这里只读顺序，不用输出的内容判断「填没填」——那件事只看 peFilled。
    try {
      const G = (typeof globalThis !== 'undefined' && globalThis.GENERATOR) ? globalThis.GENERATOR : null;
      if (G && typeof G.buildPE === 'function' && done.length >= 4) {
        const text = String(G.buildPE(rec) || '');
        const seg = (text.match(/^腹部：.*$/m) || [''])[0];
        if (seg) {
          // 定位触诊位置要用「用户实际填的触诊描述」，不能拿 schema 的默认文案当锚点：
          // 旧存档里 abdInspect 的旧默认是「腹平软，未见腹壁静脉曲张」，含"腹平软"
          // 会被当成触诊，于是正常记录被判成「次序错误」，提示还与实际要求自相矛盾。
          const store = obj(obj(rec.pe).abdomen);
          const palpText = txt(store.abdPalpation);
          const iAusc = seg.indexOf('肠鸣音');
          const iPalp = palpText ? seg.indexOf(palpText.slice(0, 8)) : -1;
          if (iAusc >= 0 && iPalp >= 0 && iAusc > iPalp) ok = false;
        }
      }
    } catch (e) { /* 生成器不可用时只按 schema 判断 */ }

    return { available: true, ok: ok, observed: seq, done: done.length, source: 'schema' };
  }

  function checkPhysical(r) {
    const rec = norm(r);
    const b = obj(rec.basic);
    const deptKey = txt(b.department) || 'general';
    const S = schemaOf();
    const dept = S ? arr(S.DEPARTMENTS).find(d => d && d.key === deptKey) : null;
    const specialKeys = dept ? arr(dept.special) : [];
    const items = [];

    /* ---------- 一般情况及头颈部（第 3 页，20 分 = 文本 18 + 查体准备 2） ---------- */

    // 面容和皮肤：口述皮肤有无黄染、发绀、皮疹、苍白病容（各 0.5 分）2 分 ——第 3 页
    items.push(specItem(
      '面容和皮肤（黄染/发绀/皮疹/苍白）',
      '第 3 页·一般情况及头颈部',
      2,
      [
        { g: 'general', k: 'face', share: 0.7, label: '面容' },
        { g: 'skin', k: 'color', share: 0.7, label: '皮肤色泽（黄染、苍白、发绀）' },
        { g: 'skin', k: 'rash', share: 0.6, label: '皮疹/出血点' }
      ],
      rec,
      { note: '这 2 分的四个点在面容、皮肤色泽、皮疹三处，写全才方便考官逐点核对。' }
    ));

    // 眼：结膜（充血 1 分）、巩膜（黄染 1 分）、瞳孔对光反射（2 分）4 分 ——第 3 页
    items.push(specItem(
      '眼（结膜/巩膜/瞳孔对光反射）',
      '第 3 页·一般情况及头颈部',
      4,
      [{ g: 'head', k: 'eyes', share: 4, label: '眼' }],
      rec,
      { note: '本工具用「眼」一段承载这 4 分；建议写全结膜有无充血、巩膜有无黄染、瞳孔对光反射。' }
    ));

    // 头颈浅表淋巴结：颌下、颏下、颈部、锁骨上（各 1 分）4 分 ——第 3 页
    items.push(specItem(
      '头颈浅表淋巴结（颌下/颏下/颈部/锁骨上）',
      '第 3 页·一般情况及头颈部',
      4,
      [{ g: 'skin', k: 'lymph', share: 4, label: '浅表淋巴结' }],
      rec,
      { note: '评分表按颌下、颏下、颈部、锁骨上四个部位各 1 分；一句话写「全身浅表淋巴结未触及肿大」也能覆盖，但逐部位写更好核对。' }
    ));

    // 口腔黏膜、舌体、咽部、扁桃体（各 1 分）4 分 ——第 3 页
    items.push(specItem(
      '口腔黏膜/舌体/咽部/扁桃体',
      '第 3 页·一般情况及头颈部',
      4,
      [
        { g: 'head', k: 'teeth', share: 2, label: '口腔黏膜与舌' },
        { g: 'head', k: 'ent', share: 2, label: '咽部与扁桃体' }
      ],
      rec
    ));

    // 颈部：气管位置、颈强直（各 2 分）4 分 ——第 3 页
    items.push(specItem(
      '颈部（气管位置/颈强直）',
      '第 3 页·一般情况及头颈部',
      4,
      [
        { g: 'neck', k: 'trachea', share: 2, label: '气管位置' },
        { g: 'neck', k: 'neckResist', share: 2, label: '颈强直' }
      ],
      rec
    ));

    /* ---------- 胸部（第 3 页，20 分） ---------- */

    // （视诊、触诊）胸壁皮肤 1 分、检查压痛 1 分、呼吸运动对称度 2 分 ——第 3 页
    items.push(specItem(
      '胸部视诊与触诊（胸壁/压痛/呼吸运动对称）',
      '第 3 页·胸部',
      4,
      [
        { g: 'chest', k: 'chestShape', share: 1, label: '胸廓与胸壁' },
        { g: 'chest', k: 'lungInspect', share: 1.5, label: '呼吸运动对称度' },
        { g: 'chest', k: 'lungPalpation', share: 1.5, label: '语颤与胸膜摩擦感' }
      ],
      rec,
      { note: '「胸壁皮肤」「胸部压痛」目前没有独立字段，如本例有相关体征，写进胸廓那一句即可。' }
    ));

    // （叩诊）上下左右对比（不要求肺尖和肺下界活动度）4 分 ——第 3 页
    {
      const v = peUserText(rec, 'chest', 'lungPercussion');
      const isDef = peIsDefault(rec, 'chest', 'lungPercussion');
      const contrast = /(上下|左右|对比|对称)/.test(v);
      const tips = [];
      if (!v) tips.push('还缺肺叩诊记录（4 分）。');
      else if (!contrast) tips.push('叩诊描述里看不出「上下左右对比」；评分表对此单列扣分点，建议补上「上下左右对比一致」。');
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '肺叩诊（上下左右对比）',
        '第 3 页·胸部',
        4, v ? (contrast ? 4 : 2) : 0,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    // （听诊）至少 2 个呼吸周期，胸、侧胸、背部，须上下左右对比（每个区域 1 分）3 分 ——第 3 页
    {
      const v = peUserText(rec, 'chest', 'lungAuscultation');
      const isDef = peIsDefault(rec, 'chest', 'lungAuscultation');
      const regions = [
        { name: '前胸', re: /(双肺|前胸|肺呼吸音)/ },
        { name: '侧胸', re: /(侧胸)/ },
        { name: '背部', re: /(背部|肩胛|后胸)/ }
      ];
      const miss = v ? regions.filter(x => !x.re.test(v)).map(x => x.name) : regions.map(x => x.name);
      const earned = v ? 3 * (regions.length - miss.length) / regions.length : 0;
      const tips = [];
      if (!v) tips.push('还缺肺听诊记录（3 分）。');
      else if (miss.length) tips.push('听诊区域还缺：' + miss.join('、') + '（每个区域 1 分），并写明上下左右对比。');
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '肺听诊（胸/侧胸/背部，上下左右对比）',
        '第 3 页·胸部',
        3, earned,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    // （视诊、触诊）心尖搏动（按切线方向视诊得 2 分）4 分 ——第 3 页
    items.push(specItem(
      '心尖搏动（视诊＋触诊）',
      '第 3 页·胸部',
      4,
      [
        { g: 'chest', k: 'heartInspect', share: 2, label: '心前区视诊（心尖搏动）' },
        { g: 'chest', k: 'heartPalpation', share: 2, label: '心尖搏动触诊（有无抬举性、震颤）' }
      ],
      rec
    ));

    // （听诊）5 个瓣膜听诊区按次序听诊（每个区域 1 分）5 分 ——第 3 页
    {
      const v = peUserText(rec, 'chest', 'heartAuscultation');
      const isDef = peIsDefault(rec, 'chest', 'heartAuscultation');
      const zones = ['二尖瓣区', '肺动脉瓣区', '主动脉瓣区', '主动脉瓣第二听诊区', '三尖瓣区'];
      const hit = v ? zones.filter(z => v.indexOf(z) >= 0).length : 0;
      const earned = v ? (hit >= 3 ? 5 : 2.5) : 0;
      const tips = [];
      if (!v) tips.push('还缺心脏听诊记录（5 分）。');
      else if (hit < 3) {
        tips.push('听诊记录里只点到了 ' + hit + ' 个瓣膜区；评分表按每个区域 1 分给，' +
          '建议写明「依次听诊二尖瓣区、肺动脉瓣区、主动脉瓣区、主动脉瓣第二听诊区、三尖瓣区」。');
      }
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '心脏听诊（5 个瓣膜听诊区按次序）',
        '第 3 页·胸部',
        5, earned,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    /* ---------- 腹部（第 3 页，20 分；另「次序正确得 2 分」） ---------- */

    // ★ 腹部检查次序正确得 2 分 ——第 3 页（细则：视诊→听诊→叩诊→触诊）
    {
      const o = abdomenOrder(rec);
      let status;
      let sug;
      if (!o.available) {
        status = 'weak';
        sug = '未能读取查体项定义，腹部次序本次没有核对到；请人工确认病历里腹部段落的顺序是「视诊→听诊→叩诊→触诊」。';
      } else if (o.ok) {
        status = 'ok';
        sug = '';
      } else {
        status = 'weak';
        if (o.done < 2) {
          // 腹部几乎没写，谈不上「次序对错」——不能因为"没写乱七八糟的顺序"就给过
          sug = '腹部查体目前只写了 ' + o.done + ' 个步骤，还谈不上「次序是否正确」。' +
            '评分表第 3 页按「视诊→听诊→叩诊→触诊」的次序给 2 分，四个步骤都写到才能核对。';
        } else {
          sug = '腹部查体次序与评分表不一致：评分表第 3 页要求「视诊→听诊→叩诊→触诊」，' +
            '当前是「' + (o.observed.map(p => ABD_PHASE_CN[p] || p).join('→') || '未知') + '」。' +
            '触诊和叩诊会刺激肠管、改变肠鸣音，所以听诊必须排在它们之前。';
        }
      }
      if (!o.ok) {
        status = 'weak';
        if (o.done < 4) {
          // 四个相位没写全，就谈不上「次序对错」——不能因为"没写乱七八糟的顺序"就给过
          sug = '腹部查体目前只写了 ' + o.done + ' 个步骤，还谈不上「次序是否正确」。' +
            '评分表第 3 页按「视诊→听诊→叩诊→触诊」的次序给 2 分，四个步骤都写到才能核对。';
        } else {
          sug = '腹部查体次序与评分表不一致：评分表第 3 页要求「视诊→听诊→叩诊→触诊」，' +
            '当前是「' + (o.observed.map(p => ABD_PHASE_CN[p] || p).join('→') || '未知') + '」。' +
            '触诊和叩诊会刺激肠管、改变肠鸣音，所以听诊必须排在它们之前。';
        }
      }
      items.push(item(
        '腹部查体次序（视诊→听诊→叩诊→触诊）',
        '第 3 页·腹部（腹部检查次序正确得 2 分）',
        0, 0,
        // 这 2 分在看守的是「工具自己别把顺序写错」，与用户填得全不全无关，
        // 因此不计入得分；但要在提示里说清楚，避免出现「93/93 却说次序错」的困惑。
        sug || '次序正确（这 2 分不计入本工具得分：它看守的是工具生成的顺序，不是你的填写量）。',
        { kind: KIND_ADVISORY, weight: 6, status: status }
      ));
    }

    // （视诊）腹部形态 2 分 ——第 3 页
    {
      const v = peUserText(rec, 'abdomen', 'abdInspect');
      const isDef = peIsDefault(rec, 'abdomen', 'abdInspect');
      const bad = v && /腹平软/.test(v) && !/平坦/.test(v);
      const tips = [];
      if (!v) tips.push('还缺腹部视诊记录（2 分）。');
      else if (bad) tips.push('「腹平软」是触诊结论，写在视诊里容易被认为项目混用；视诊只写形态（平坦/膨隆、有无腹壁静脉曲张、胃肠型及蠕动波）。');
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '腹部视诊（腹部形态）',
        '第 3 页·腹部',
        2, v ? (bad ? 1 : 2) : 0,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    // （听诊）肠鸣音：听诊部位正确并口述听诊时长（每项 2 分）4 分 ——第 3 页
    {
      const v = peUserText(rec, 'abdomen', 'abdAuscultation');
      const isDef = peIsDefault(rec, 'abdomen', 'abdAuscultation');
      const hasTime = /(分钟|min|秒)/.test(v);
      const hasSite = /(左上腹|左下腹|右下腹|右上腹|脐周|脐部|腹部听诊|听诊部位)/.test(v);
      const earned = v ? (hasTime ? 2 : 0) + (hasSite ? 2 : 0) : 0;
      const miss = [];
      if (!v) miss.push('肠鸣音听诊记录');
      else {
        if (!hasSite) miss.push('听诊部位 2 分（如「左上腹听诊」）');
        if (!hasTime) miss.push('听诊时长 2 分（如「听诊 1 分钟」）');
      }
      const tips = [];
      if (miss.length) tips.push('还缺：' + miss.join('；') + '。');
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '腹部听诊（肠鸣音的部位与时长）',
        '第 3 页·腹部',
        4, earned,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    // （叩诊）常规按逆时针次序叩诊（不要求脾区）4 分 ——第 3 页
    {
      const v = peUserText(rec, 'abdomen', 'abdPercussion');
      const isDef = peIsDefault(rec, 'abdomen', 'abdPercussion');
      const hasOrder = /逆时针/.test(v);
      const tips = [];
      if (!v) tips.push('还缺腹部叩诊记录（4 分）。');
      else if (!hasOrder) tips.push('叩诊描述里没有「逆时针」这个次序；评分表按「常规按逆时针次序叩诊」给分，建议写明「自左下腹起逆时针叩诊」。');
      if (isDef) tips.push('目前用的是默认描述，建议核对后保留，或按本例实际情况修改。');
      items.push(item(
        '腹部叩诊（逆时针次序）',
        '第 3 页·腹部',
        4, v ? (hasOrder ? 4 : 2) : 0,
        tips.join(''),
        { isDefault: !!isDef }
      ));
    }

    // （触诊）全腹浅触诊与深触诊（各 2.5 分）、肝、脾触诊（各 2.5 分）10 分 ——第 3 页
    {
      const subs = [
        { g: 'abdomen', k: 'abdPalpSuperficial', share: 2.5, label: '全腹浅触诊（含压痛反应）' },
        { g: 'abdomen', k: 'abdPalpDeep', share: 2.5, label: '全腹深触诊（含反跳痛）' },
        { g: 'abdomen', k: 'liverPalpation', share: 2.5, label: '肝触诊' },
        { g: 'abdomen', k: 'spleenPalpation', share: 2.5, label: '脾触诊' }
      ];
      const r = specScoreWithParent(rec, subs,
        { g: 'abdomen', k: 'abdPalpation' },
        { share: 5, label: '触诊（合并描述）' });
      const earned = r.earned;
      const tips = [];
      const defaults = r.defaults.slice();
      let note = '';
      if (r.earned && !subs.some(s => peFilled(rec, s.g, s.k))) {
        note = '当前用一条合并的触诊描述覆盖，病历正文能看；但评分表把浅触/深触/肝/脾分成四项各 2.5 分，逐项写更稳。';
      }
      if (r.miss.length) tips.push('还缺分行记录：' + r.miss.join('、') + '（每项 2.5 分，共 10 分）。');
      if (defaults.length) tips.push(defaultHint(defaults));
      items.push(item(
        '腹部触诊（浅触/深触/肝/脾）',
        '第 3 页·腹部',
        10, earned,
        tips.join(''),
        { note: note, isDefault: defaults.length > 0 && r.miss.length === 0 }
      ));
    }

    /* ---------- 神经系统及四肢（第 3 页，20 分） ---------- */

    // 腱反射、布氏征、克氏征、巴氏征（每项 2 分）8 分 ——第 3 页
    {
      const subs = [
        { g: 'nervousPE', k: 'tendonReflex', share: 2, label: '腱反射' },
        { g: 'nervousPE', k: 'brudzinski', share: 2, label: '布氏征（Brudzinski）' },
        { g: 'nervousPE', k: 'kernig', share: 2, label: '克氏征（Kernig）' },
        { g: 'nervousPE', k: 'babinski', share: 2, label: '巴氏征（Babinski）' }
      ];
      const r = specScoreWithParent(rec, subs,
        { g: 'nervousPE', k: 'nerve' },
        { share: 4, label: '神经反射（合并描述）' });
      const earned = r.earned;
      const tips = [];
      const defaults = r.defaults.slice();
      let note = '';
      if (r.earned && !subs.some(s => peFilled(rec, s.g, s.k))) {
        note = '当前用「生理反射存在，病理反射未引出」一句覆盖；评分表把腱反射/布氏征/克氏征/巴氏征分成四项各 2 分，逐项写更稳。';
      }
      if (r.miss.length) tips.push('还缺逐项记录：' + r.miss.join('、') + '（每项 2 分，共 8 分）。');
      if (defaults.length) tips.push(defaultHint(defaults));
      items.push(item(
        '神经系统（腱反射/布氏征/克氏征/巴氏征）',
        '第 3 页·神经系统及四肢',
        8, earned,
        tips.join(''),
        { note: note, isDefault: defaults.length > 0 && r.miss.length === 0 }
      ));
    }

    // 四肢肌力和双侧膝跳反射（每项 2 分）4 分 ——第 3 页
    {
      const subs = [
        { g: 'spine', k: 'limbMuscle', share: 2, label: '四肢肌力' },
        { g: 'spine', k: 'kneeJerk', share: 2, label: '双侧膝跳反射' }
      ];
      const r = specScoreWithParent(rec, subs,
        { g: 'spine', k: 'limbs' },
        { share: 2, label: '四肢（合并描述）' });
      const earned = r.earned;
      const tips = [];
      const defaults = r.defaults.slice();
      let note = '';
      if (r.earned && !subs.some(s => peFilled(rec, s.g, s.k))) {
        note = '当前四肢只有「无畸形、活动自如」一句；评分表另要四肢肌力和双侧膝跳反射各 2 分。';
      }
      if (r.miss.length) tips.push('还缺：' + r.miss.join('、') + '（每项 2 分）。');
      if (defaults.length) tips.push(defaultHint(defaults));
      items.push(item(
        '四肢肌力与双侧膝跳反射',
        '第 3 页·神经系统及四肢',
        4, earned,
        tips.join(''),
        { note: note, isDefault: defaults.length > 0 && r.miss.length === 0 }
      ));
    }

    // 下肢水肿的按压检查（检查双侧踝部和胫前，每项 2 分）4 分 ——第 3 页
    {
      const subs = [
        { g: 'spine', k: 'edemaAnkle', share: 2, label: '双侧踝部' },
        { g: 'spine', k: 'edemaPretibial', share: 2, label: '胫前' }
      ];
      const r = specScore(rec, subs);
      const tips = [];
      const defaults = r.defaults.slice();
      let note = '';
      // 父项兜底：spine.limbs 里写了「水肿」时给 2 分保底（取较大值，保证填更多不降分）
      let earned = r.earned;
      if (/水肿/.test(peUserText(rec, 'spine', 'limbs'))) {
        earned = Math.max(earned, 2);
        if (peIsDefault(rec, 'spine', 'limbs')) defaults.push('四肢水肿（合并描述）');
        if (!r.earned) {
          note = '当前只有一句概括的「双下肢水肿」；评分表要求分别按压双侧踝部和胫前，各 2 分。';
        }
      }
      if (r.miss.length) tips.push('还缺按压记录：' + r.miss.join('、') + '（每项 2 分）。');
      if (defaults.length) tips.push(defaultHint(defaults));
      items.push(item(
        '下肢水肿（踝部/胫前按压）',
        '第 3 页·神经系统及四肢',
        4, earned,
        tips.join(''),
        { note: note, isDefault: defaults.length > 0 && r.miss.length === 0 }
      ));
    }

    // 足背动脉、桡动脉搏动（双侧对比检查，每项 2 分）4 分 ——第 3 页
    {
      const subs = [
        { g: 'spine', k: 'dorsalisPedis', share: 2, label: '足背动脉搏动' },
        { g: 'spine', k: 'radialPulse', share: 2, label: '桡动脉搏动' }
      ];
      const r = specScore(rec, subs);
      const tips = [];
      if (r.miss.length) tips.push('还缺：' + r.miss.join('、') + '（每项 2 分，需双侧对比）。');
      if (r.defaults.length) tips.push(defaultHint(r.defaults));
      items.push(item(
        '足背动脉/桡动脉搏动（双侧对比）',
        '第 3 页·神经系统及四肢',
        4, r.earned,
        tips.join(''),
        { isDefault: r.defaults.length > 0 && r.miss.length === 0 }
      ));
    }

    /* ---------- 重点查体（第 4 页，15 分） ---------- */

    {
      // 只统计「真的能写出内容」的重点查体项：
      //  - key 能解析到 schema 里的查体项
      //  - 该项用户确实填过（默认值不算，否则等于把没查的列成重点）
      //  - 父项已被子项接管时不计（生成器也会跳过它）
      // 否则会出现「三个空子项 + 一个非法 key 也拿 15/15」，
      // 而 buildFocusPE 实际只输出一句 note（reviewer 实测 H3）。
      const focus = obj(rec.focusPE);
      const rawKeys = arr(focus.keys).map(txt).filter(Boolean);
      const noteText = txt(focus.note);
      const S = schemaOf();
      const usableKeys = [];
      rawKeys.forEach(ref => {
        const dot = ref.indexOf('.');
        if (dot <= 0) return;
        const g = ref.slice(0, dot);
        const k = ref.slice(dot + 1);
        let itemDef = null;
        if (typeof S.findPEItem === 'function') {
          itemDef = S.findPEItem(ref);
        }
        if (!itemDef) return;
        const store = obj(obj(rec.pe)[g]);
        const filled = typeof S.peItemFilled === 'function'
          ? S.peItemFilled(store, itemDef)
          : !!txt(store[k]);
        if (!filled) return;
        if (!g.startsWith('special_') && typeof S.parentSupersededByChild === 'function' &&
          S.parentSupersededByChild(store, g, k)) return;
        usableKeys.push(ref);
      });

      let earned = 0;
      const miss = [];
      if (usableKeys.length >= 3) earned += 8;
      else if (usableKeys.length > 0) earned += 4;
      else if (rawKeys.length) miss.push('已标记的项都还没有查体内容（先填写对应查体项，重点查体才有内容可写）');
      else miss.push('标记本例的重点查体部位');
      if (noteText) earned += 7;
      else miss.push('说明重点查体与诊断思路/鉴别关键点的关系');
      items.push(item(
        '重点查体（结合病史，主次分明）',
        '第 4 页·重点查体',
        15, earned,
        miss.length
          ? '还缺：' + miss.join('；') + '。这 15 分看的是「会不会挑重点」——' +
            '挑出与主诉/主要阳性体征直接相关的 3 项左右，再补一句为什么查这些。'
          : '',
        {
          note: (usableKeys.length && usableKeys.length < 3)
            ? '目前有内容可写的重点查体 ' + usableKeys.length + ' 项，建议 3 项左右。'
            : ''
        }
      ));
    }

    /* ---------- 专科查体（按科室，属于「系统查体完整」的一部分） ---------- */

    if (specialKeys.length) {
      let total = 0;
      const miss = [];
      const defaults = [];
      specialKeys.forEach(spKey => {
        const sp = S && S.PE_SPECIAL ? S.PE_SPECIAL[spKey] : null;
        if (!sp) return;
        arr(sp.items).forEach(it => {
          total += 1;
          const label = it.label || it.key;
          if (!peFilled(rec, 'special_' + spKey, it.key)) { miss.push(label); return; }
          if (peIsDefault(rec, 'special_' + spKey, it.key)) defaults.push(label);
        });
      });
      if (total > 0) {
        const tips = [];
        if (miss.length) tips.push('还缺专科查体记录：' + miss.join('、') + '。');
        if (defaults.length) tips.push(defaultHint(defaults));
        items.push(item(
          '专科查体（' + (dept ? dept.name : deptKey) + '）',
          '第 3 页·系统查体完整性／第 6 页·体格检查「专科体检记录完整」',
          0, 0,
          tips.join(''),
          {
            kind: KIND_ADVISORY, weight: 3,
            status: miss.length ? 'weak' : 'ok',
            isDefault: miss.length === 0 && defaults.length > 0
          }
        ));
      }
    }

    /* ---------- 有鉴别诊断意义的阴性体征（提醒项，计分在第 6 页书写表） ---------- */

    {
      let negCount = 0;
      let totalCount = 0;
      if (S) {
        arr(S.PE_COMMON).forEach(g => {
          arr(g.items).forEach(it => {
            if (!peFilled(rec, g.key, it.key)) return;
            totalCount += 1;
            const v = peUserVal(rec, g.key, it.key);
            // 默认描述里本来就写着「未见/无」——那是模板，不是用户写的阴性体征
            if (peIsDefault(rec, g.key, it.key)) return;
            if (NEG_WORDS.test(v)) negCount += 1;
          });
        });
      }
      let status;
      let sug;
      if (!totalCount) {
        status = 'missing';
        sug = '还缺有鉴别诊断意义的阴性体征：与主诉相关但本例没有的体征，要写明「阴性」（如「无双下肢水肿」「未闻及哮鸣音」）。';
      } else if (negCount >= 3) {
        status = 'ok';
        sug = '';
      } else {
        status = 'weak';
        sug = '目前你自己写的阴性体征只有 ' + negCount + ' 处，建议再为每个需要鉴别的方向补一句「阴性」' +
          '（第 6 页·体格检查「有鉴别诊断意义的阴性体征无遗漏」）。';
      }
      items.push(item(
        '有鉴别诊断意义的阴性体征',
        '第 6 页·入院记录·体格检查',
        0, 0, sug, { kind: KIND_ADVISORY, weight: 4, status: status }
      ));
    }

    /* ---------- 现场动作（B 类，第 3-4 页） ---------- */

    {
      const prep = obj(obj(rec.exam).pePrep);
      const got = (prep.warmHands ? 1 : 0) + (prep.tellIntent ? 1 : 0);
      items.push(item(
        '查体准备（暖手与听诊器/告知患者意图）',
        '第 3 页·一般情况及头颈部',
        0, 0,
        '还缺：查体前暖手、捂热听诊器并告知患者要做什么（各 1 分）。这是现场动作，不会写进病历。',
        { kind: KIND_PROCESS, weight: 2, status: got === 2 ? 'ok' : (got === 1 ? 'weak' : 'missing') }
      ));
    }
    {
      const overall = obj(obj(rec.exam).peOverall);
      const got = ['technique', 'fluent', 'humane', 'timely'].filter(k => overall[k]).length;
      items.push(item(
        '整体评价（手法规范/熟练有序/人文关怀/完成及时）',
        '第 4 页·整体评价',
        0, 0,
        '还缺：手法规范 1 分、查体熟练有序 1 分、人文关怀 2 分、完成及时 1 分。现场动作项，不进病历正文。',
        { kind: KIND_PROCESS, weight: 3, status: got >= 4 ? 'ok' : (got > 0 ? 'weak' : 'missing') }
      ));
    }

    return finalize({
      station: '体格检查',
      key: 'physical',
      page: '第 3-4 页',
      processMaxScore: 7,   // 查体准备 2 + 整体评价 5
      fullMaxScore: 100,
      notes: [
        '本工具可核对的病历文本分合计 93 分；查体准备 2 分、整体评价 5 分（合计 7 分）属于现场动作评分。',
        '生成器会自动补「正常」描述，所以区域类检查通常在默认状态下就已覆盖；' +
        '真正需要逐项补的是腹部四项触诊、神经四项、四肢六项这些按项给分的位置。'
      ]
    }, items);
  }

  /* =====================================================================
   * 六、考站三 · 首次病程录（第 5 页，100 分）
   *
   *   S 主观简要病史 15 = 概括简练重点突出 10 + 与病史采集一致 5
   *   O 客观记录     10 = 有意义的体格检查 5 + 相关辅助检查 5
   *   A 评估与鉴别   40 = 依据(5+5+5) + 主次排序 10 + 鉴别 10 + 不跑题 5
   *   P 诊疗计划     25 = 符合原则 10 + 与诊断对应 10 + 个体化 5
   *   总体           10 = 简洁扼要 5 + 字迹整洁 5（卷面分，本工具不计分）
   * =================================================================== */

  function soapOf(rec) {
    const s = obj(rec.soap);
    return { s: obj(s.s), o: obj(s.o), a: obj(s.a), p: obj(s.p) };
  }

  function diagnosisList(rec) {
    return arr(obj(rec.diagnosis).confirmed).map(txt).filter(Boolean);
  }

  function auxAvailable(rec) {
    return arr(obj(rec.auxiliary).items).some(it => isS(obj(it).name) || isS(obj(it).result));
  }

  /** 病历里是否已经有阳性体征（用于判断 O 段能否从查体里挑） */
  function positivePECount(rec) {
    const S = schemaOf();
    if (!S) return 0;
    let n = 0;
    arr(S.PE_COMMON).forEach(g => {
      arr(g.items).forEach(it => {
        if (!peFilled(rec, g.key, it.key)) return;
        // 默认描述写的都是「正常/未见」，不是阳性体征，不能拿来当「可摘的阳性发现」
        if (peIsDefault(rec, g.key, it.key)) return;
        const v = peUserVal(rec, g.key, it.key);
        if (NEG_WORDS.test(v)) return;
        n += 1;
      });
    });
    return n;
  }

  /** 在数组里按诊断名找一条记录（容错：包含即算命中） */
  function matchEntry(list, name) {
    const n = txt(name);
    if (!n) return null;
    return arr(list).find(e => {
      const d = txt(obj(e).diagnosis);
      return d && (d === n || n.indexOf(d) >= 0 || d.indexOf(n) >= 0);
    }) || null;
  }

  const CN_NUM = {
    '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
    '6': '六', '7': '七', '8': '八', '9': '九', '10': '十'
  };

  /**
   * 病史采集里的时长线索，用于核对 S 段与病史是否一致。
   * 返回「同义写法」数组：任一个出现在 S 段就算对上了，
   * 不能因为写了「3 天」而没写「三天」就误报不一致。
   */
  function durationVariants(rec) {
    const b = obj(rec.basic);
    const out = [];
    const units = [];
    const n = txt(b.chiefComplaintDuration);
    const u = txt(b.chiefComplaintDurationUnit);
    if (n) {
      units.push(u);
      // 单位的中文同义写法（天/日）也一并认
      if (u === '天') units.push('日');
      if (u === '日') units.push('天');
      units.filter(Boolean).forEach(x => {
        out.push(n + x);
        if (CN_NUM[n]) out.push(CN_NUM[n] + x);
      });
    }
    // 时长现在主要写在主诉正文里（界面上已没有单独的时长框）。
    // 从「反复上腹痛2年」里把「2年」提出来，S 段写了「2年」才算对得上——
    // 否则一套新写法，全部现病史都会被判成「时长与主诉不一致」。
    const fromCC = String(txt(b.chiefComplaint) || '').match(
      /([0-9０-９一二三四五六七八九十百千万两半十几数]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|min|h))/i
    );
    if (fromCC && out.indexOf(fromCC[1]) < 0) out.push(fromCC[1]);
    return out.filter(Boolean);
  }

  /** 把文字按句子切开（用于判断堆砌/重复） */
  function clauses(text) {
    return String(text || '').split(/[，,。；;、]/).map(s => s.trim()).filter(Boolean);
  }

  function checkFirstCourse(r) {
    const rec = norm(r);
    const { s, o, a, p } = soapOf(rec);
    const dx = diagnosisList(rec);
    const hasAux = auxAvailable(rec);
    const posPE = positivePECount(rec);
    const items = [];

    /* ---------- S 主观简要病史（15 分） ---------- */

    // 对现病史概括简练、重点突出 10 分 ——第 5 页·S
    {
      const v = txt(s.summary);
      const hpiAny = hasAny(obj(rec.hpi), ['onset', 'cause', 'symptoms', 'evolution', 'accompanying', 'treatment']);
      let earned = 0;
      let status;
      const tips = [];
      if (!v) {
        if (hpiAny) {
          // 现病史有内容可压缩，但 S 段本身没写就不给分——
          // 给"鼓励分"会让空 SOAP 白拿 5 分，与「自查还缺什么」的目的相反。
          earned = 0;
          status = 'missing';
          tips.push('S 段还空着：现病史已经有内容，可以按「主诉 + 关键阳性 + 关键阴性」压成 3-5 句写进来（10 分）');
        } else {
          status = 'missing';
          tips.push('S 段还空着，现病史也还没有内容（10 分）');
        }
      } else if (v.length < 30) {
        earned = 6;
        status = 'weak';
        tips.push('S 段只有 ' + v.length + ' 字，病历特点「概括简练」不等于「只写一句」');
      } else if (v.length > 400) {
        earned = 7;
        status = 'weak';
        tips.push('S 段 ' + v.length + ' 字偏长，病历特点应当比现病史短，建议压缩');
      } else {
        earned = 10;
        status = 'ok';
      }
      items.push(item('S 段—对现病史概括简练、重点突出', '第 5 页·主观简要病史(S)',
        10, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 与病史采集病案的信息一致 5 分 ——第 5 页·S
    //
    // 只读 S 段本身。原先用 `txt(s.summary) || txt(hpi.symptoms)` 兜底，
    // 导致「S 段完全没写、只要现病史有字」就能拿 5/5（reviewer 实测 H2），
    // 而且补写一句短摘要后一致性分反而从 5 降到 3，破坏单调性。
    {
      const v = txt(s.summary);
      const variants = durationVariants(rec);
      const cc = txt(obj(rec.basic).chiefComplaint);
      const ccKeys = cc ? clauses(cc).filter(x => x.length >= 2 && !/[0-9０-９]/.test(x)) : [];
      // 时长：任意一种同义写法出现在 S 段就算一致
      const missingToken = variants.length && !variants.some(t => v.indexOf(t) >= 0) ? variants[0] : '';
      const missingKeys = ccKeys.filter(k => v.indexOf(k.slice(0, Math.min(4, k.length))) < 0);
      let earned = 0;
      const tips = [];
      if (!v) {
        earned = 0;   // S 段没写就没有「与病史一致」可言
      } else {
        earned = 5;
        if (missingToken) {
          earned -= 2;
          tips.push('S 段里没看到主诉的起病时间「' + missingToken + '」，与病史采集可能对不上');
        }
        if (ccKeys.length && missingKeys.length) {
          earned -= 1;
          tips.push('S 段没提到主诉里的「' + missingKeys[0] + '」');
        }
      }
      items.push(item('S 段—与病史采集的信息一致', '第 5 页·主观简要病史(S)',
        5, Math.max(0, earned),
        v ? tips.join('；') + (tips.length ? '。' : '')
          : 'S 段还空着，无法与病史采集比对（5 分）。'));
    }

    /* ---------- O 客观体检记录/检查结果（10 分） ---------- */

    // 对疾病诊断有意义的体格检查描述正确、到位 5 分 ——第 5 页·O
    {
      const v = txt(o.pe);
      let earned = 0;
      let status;
      const tips = [];
      if (v) {
        earned = v.length >= 15 ? 5 : 3;
        status = earned === 5 ? 'ok' : 'weak';
        if (earned < 5) tips.push('O 段体格检查只写了 ' + v.length + ' 字，建议直接摘本例的关键阳性体征与关键阴性体征');
      } else if (posPE > 0) {
        earned = 2.5;
        status = 'weak';
        tips.push('O 段还空着：查体里已有 ' + posPE + ' 处阳性/非默认体征，可以直接摘过来（5 分）');
      } else {
        status = 'missing';
        tips.push('O 段还空着，查体里也还没有可摘的阳性体征（5 分）');
      }
      items.push(item('O 段—对诊断有意义的体格检查', '第 5 页·客观体检记录(O)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 与疾病相关的辅助检查结果描述正确、到位 5 分 ——第 5 页·O
    {
      const v = txt(o.aux);
      let earned = 0;
      let status;
      const tips = [];
      if (v) {
        earned = v.length >= 10 ? 5 : 3;
        status = earned === 5 ? 'ok' : 'weak';
        if (earned < 5) tips.push('O 段辅助检查写得偏简，建议写清项目＋结果');
      } else if (hasAux) {
        earned = 2.5;
        status = 'weak';
        tips.push('O 段还空着：辅助检查里已有结果，挑与诊断相关的写进来（5 分）');
      } else {
        status = 'missing';
        tips.push('O 段还空着，辅助检查也还没有结果（5 分）');
      }
      items.push(item('O 段—与疾病相关的辅助检查结果', '第 5 页·客观检查结果(O)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    /* ---------- A 诊断评估与鉴别诊断（40 分） ---------- */

    // 诊断依据概括简洁、完整 5 分 ——第 5 页·A
    {
      const v = txt(a.basis);
      let earned = 0;
      let status;
      const tips = [];
      if (!v) {
        status = 'missing';
        tips.push('还缺诊断依据段（5 分）：把支持诊断的病史、体检、辅助检查概括成一段');
      } else if (v.length < 20) {
        earned = 2.5;
        status = 'weak';
        tips.push('诊断依据只有 ' + v.length + ' 字，偏简；评分表要「简洁、完整」，不是「越短越好」');
      } else {
        earned = 5;
        status = 'ok';
      }
      items.push(item('A 段—诊断依据概括简洁、完整', '第 5 页·诊断评估与鉴别诊断(A)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 诊断依据不堆砌、内容不空洞 5 分 ——第 5 页·A
    {
      const v = txt(a.basis);
      const list = clauses(v);
      const seen = {};
      const dup = [];
      list.forEach(c => {
        if (c.length < 4) return;
        if (seen[c] && dup.indexOf(c) < 0) dup.push(c);
        seen[c] = true;
      });
      let earned = 0;
      let status;
      const tips = [];
      if (!v) {
        status = 'missing';
        tips.push('诊断依据段还没有内容，无法判断是否堆砌（5 分）');
      } else if (dup.length) {
        earned = 2.5;
        status = 'weak';
        tips.push('诊断依据里有重复的句子「' + dup[0] + '」，建议删掉重复项');
      } else if (v.length > 800) {
        earned = 2.5;
        status = 'weak';
        tips.push('诊断依据 ' + v.length + ' 字偏长，把同类信息合并成一条更像「不堆砌」');
      } else {
        earned = 5;
        status = 'ok';
      }
      items.push(item('A 段—诊断依据不堆砌、不空洞', '第 5 页·诊断评估与鉴别诊断(A)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 各项诊断均有病史、体检、辅助检查的依据 5 分 ——第 5 页·A
    {
      const details = arr(a.basisDetail);
      const miss = [];
      let covered = 0;
      dx.forEach(name => {
        const e = matchEntry(details, name);
        if (!e) { miss.push(name); return; }
        const hasH = isS(e.history);
        const hasP = isS(e.pe);
        const hasA = isS(e.aux) || !hasAux;   // 完全没有辅助检查时，不强求 aux
        if (hasH && hasP && hasA) covered += 1;
        else {
          const lack = [];
          if (!hasH) lack.push('病史');
          if (!hasP) lack.push('体检');
          if (!hasA) lack.push('辅助检查');
          miss.push(name + '（缺' + lack.join('/') + '）');
        }
      });
      const earned = dx.length ? 5 * covered / dx.length : 0;
      items.push(item('A 段—各项诊断都有病史/体检/辅助检查依据', '第 5 页·诊断评估与鉴别诊断(A)',
        5, earned,
        !dx.length
          ? '还缺初步诊断：没有诊断就没法逐条写依据（先把「初步诊断」定下来）。'
          : (miss.length ? '还缺依据：' + miss.join('；') + '。每条诊断都要有病史、体检、辅助检查三方面支撑。' : '')
      ));
    }

    // 诊断准确，主次排序合理 10 分 ——第 5 页·A
    {
      const rank = txt(a.ranking);
      let earned = 0;
      let status;
      const tips = [];
      if (!dx.length) {
        status = 'missing';
        tips.push('还缺初步诊断，主次无从体现（10 分）');
      } else if (!rank) {
        earned = dx.length > 1 ? 5 : 6;
        status = 'weak';
        tips.push('还没有写「主次排序」的说明（10 分）：按主要诊断 → 次要诊断 → 并发症/合并症的顺序列出，并说明为什么这个排第一');
      } else {
        earned = 10;
        status = 'ok';
      }
      items.push(item('A 段—诊断主次排序合理', '第 5 页·诊断评估与鉴别诊断(A)',
        10, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 鉴别诊断结合患者主要诊断展开，分析有条理 10 分 ——第 5 页·A
    {
      const diffs = arr(a.diff);
      let earned = 0;
      let status;
      const tips = [];
      if (!diffs.length) {
        status = 'missing';
        tips.push('还缺鉴别诊断段（10 分）：围绕主要诊断写 2 条左右，每条说清「为什么考虑」和「哪一点不支持」');
      } else {
        const full = diffs.filter(d => {
          const e = obj(d);
          return isS(e.diagnosis) && isS(e.why) && (isS(e.against) || isS(e.points));
        }).length;
        earned = 10 * Math.min(1, full / 2);
        status = earned >= 10 ? 'ok' : 'weak';
        if (status === 'weak') {
          tips.push('鉴别诊断已写了 ' + diffs.length + ' 条，其中 ' + full +
            ' 条同时写了「为什么考虑」和「哪一点不支持」；建议至少 2 条写全');
        }
      }
      items.push(item('A 段—鉴别诊断结合主要诊断展开', '第 5 页·诊断评估与鉴别诊断(A)',
        10, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 未出现与诊断无关的鉴别诊断 5 分 ——第 5 页·A
    {
      const note = txt(a.diffNote);
      const diffs = arr(a.diff);
      let earned = 0;
      let status;
      const tips = [];
      if (note) {
        earned = 5;
        status = 'ok';
      } else if (diffs.length) {
        earned = 2.5;
        status = 'weak';
        tips.push('建议补一句「为什么只鉴别这几条」，说明每一条都紧扣本例的主要症状/主要阳性体征（5 分）');
      } else {
        status = 'missing';
        tips.push('还缺鉴别诊断，这一项（未出现与诊断无关的鉴别诊断 5 分）也就无从体现');
      }
      items.push(item('A 段—鉴别诊断不跑题', '第 5 页·诊断评估与鉴别诊断(A)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    /* ---------- P 诊疗计划（25 分） ---------- */

    // 诊疗计划符合基本治疗原则，简明扼要 10 分 ——第 5 页·P
    {
      const v = txt(p.principle);
      let earned = 0;
      let status;
      const tips = [];
      if (!v) {
        status = 'missing';
        tips.push('还缺诊疗计划总述（10 分）：检查安排 + 治疗原则，简明扼要写清楚');
      } else if (v.length < 20) {
        earned = 5;
        status = 'weak';
        tips.push('诊疗计划只有 ' + v.length + ' 字，建议写清「查什么、怎么治、观察什么」');
      } else {
        earned = 10;
        status = 'ok';
      }
      items.push(item('P 段—诊疗计划符合治疗原则、简明扼要', '第 5 页·诊疗计划(P)',
        10, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    // 诊疗计划与相关诊断对应 10 分 ——第 5 页·P
    {
      const pds = arr(p.perDiagnosis);
      const miss = [];
      let covered = 0;
      dx.forEach(name => {
        const e = matchEntry(pds, name);
        if (!e) { miss.push(name); return; }
        if (isS(e.exam) || isS(e.treatment)) covered += 1;
        else miss.push(name + '（检查与治疗都还空着）');
      });
      const earned = dx.length ? 10 * covered / dx.length : 0;
      items.push(item('P 段—诊疗计划与相关诊断一一对应', '第 5 页·诊疗计划(P)',
        10, earned,
        !dx.length ? '还缺初步诊断，诊疗计划无法逐条对应（10 分）。'
          : (miss.length ? '还缺对应：' + miss.join('；') + '。每条诊断都要有对应的检查与治疗安排。' : '')
      ));
    }

    // 诊疗计划体现患者病情个体化原则 5 分 ——第 5 页·P
    {
      const v = txt(p.individual);
      let earned = 0;
      let status;
      const tips = [];
      if (!v) {
        status = 'missing';
        tips.push('还缺个体化说明（5 分）：本例的年龄、基础病、合并用药、依从性、经济情况怎么影响方案');
      } else if (v.length < 12) {
        earned = 2.5;
        status = 'weak';
        tips.push('个体化说明偏简，建议点明本例哪一点让方案与「常规」不同');
      } else {
        earned = 5;
        status = 'ok';
      }
      items.push(item('P 段—诊疗计划体现个体化原则', '第 5 页·诊疗计划(P)',
        5, earned, tips.join('；') + (tips.length ? '。' : ''), { status: status }));
    }

    /* ---------- 总体（10 分） ---------- */

    // 首次病程录整体书写简洁扼要、临床思路清晰 5 分 ——第 5 页·总体
    {
      const body = [txt(s.summary), txt(o.pe), txt(o.aux), txt(a.basis), txt(p.principle)].join('');
      const segFilled = [
        isS(s.summary),
        isS(a.basis),
        arr(a.diff).length > 0,
        arr(p.perDiagnosis).length > 0 || isS(p.principle)
      ].filter(Boolean).length;
      let earned = 0;
      let status;
      const tips = [];
      if (!body) {
        status = 'missing';
        tips.push('首次病程录还空着（5 分）。');
      } else if (segFilled < 3) {
        earned = 2;
        status = 'weak';
        tips.push('S/A/P 里还有段落没写，整体「思路清晰」体现不出来');
      } else if (body.length > 3000) {
        earned = 2.5;
        status = 'weak';
        tips.push('首次病程录 ' + body.length + ' 字偏长，建议压到 1500 字以内');
      } else {
        earned = 5;
        status = 'ok';
      }
      items.push(item('总体—书写简洁扼要、临床思路清晰', '第 5 页·总体',
        5, earned, endWithPeriod(tips.join('；')), { status: status }));
    }

    // 字迹整洁 5 分 ——第 5 页·总体（卷面分，本工具不能判断，故不计分）
    items.push(item(
      '字迹整洁（卷面分）',
      '第 5 页·总体',
      0, 0,
      '这 5 分是卷面分，本工具不能替你判断：如果最终要手抄到考核纸上，请注意字迹、行距、不要涂改。',
      { kind: KIND_PROCESS, weight: 1, status: 'ok' }
    ));

    return finalize({
      station: '首次病程录',
      key: 'firstCourse',
      page: '第 5 页',
      processMaxScore: 5,   // 字迹整洁 5 分（卷面分）
      fullMaxScore: 100,
      notes: [
        '本工具可核对 95 分；「字迹整洁」5 分属卷面分，不计入得分。',
        '同一份 SOAP 结构同时服务第 5 页（100 分）与第 6 页「首次病程记录」（20 分），写一次两处都用得上。'
      ]
    }, items);
  }

  /* =====================================================================
   * 七、考站四 · 病历书写（第 6-7 页，100 分）
   *
   *   入院记录 25 = 一般项目 2 + 主诉 2 + 现病史 8 + 既往史等 3 + 体格检查 4 + 辅助检查 2 + 诊断 4
   *   首次病程记录 20（复用 SOAP）
   *   病程记录 35 + 上级医师查房 5 —— 本工具没有载体，只出提醒，不计分
   *   出院记录 15 = 一般情况 2 + 入院情况 2 + 诊疗经过 5 + 出院情况 2 + 出院诊断 2 + 出院医嘱 2
   * =================================================================== */

  /** 计算住院天数（yyyy-mm-dd），算不出返回 0 */
  function daysBetween(from, to) {
    const a = Date.parse(String(from || '').replace(/[./]/g, '-'));
    const b = Date.parse(String(to || '').replace(/[./]/g, '-'));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
    return Math.round((b - a) / 86400000);
  }

  function checkWriting(r) {
    const rec = norm(r);
    const b = obj(rec.basic);
    const h = obj(rec.hpi);
    const pmh = obj(rec.pmh);
    const per = obj(rec.personal);
    const fam = obj(rec.family);
    const aux = arr(obj(rec.auxiliary).items).filter(it => isS(obj(it).name) || isS(obj(it).result));
    const dx = diagnosisList(rec);
    const { s, a, p } = soapOf(rec);
    const dis = obj(rec.discharge);
    const items = [];

    /* ---------- 入院记录（第 6 页，25 分） ---------- */

    // 一般项目：姓名、性别、年龄、职业等 2 分 ——第 6 页·入院记录
    {
      const cells = [isS(b.name), isS(b.gender), isS(b.age), isS(b.occupation)];
      const miss = [];
      if (!cells[0]) miss.push('姓名');
      if (!cells[1]) miss.push('性别');
      if (!cells[2]) miss.push('年龄');
      if (!cells[3]) miss.push('职业');
      items.push(item('入院记录—一般项目', '第 6 页·入院记录',
        2, 2 * cells.filter(Boolean).length / 4,
        miss.length ? '还缺一般项目：' + miss.join('、') + '。' : ''));
    }

    // 主诉：简明、扼要、完整，原则上不用诊断名称 2 分 ——第 6 页·入院记录
    {
      const cc = txt(b.chiefComplaint);
      const bad = diagWordsIn(cc);
      const tips = [];
      let earned = cc ? 2 : 0;
      if (cc && cc.length > 20) { earned = 1; tips.push('主诉 ' + cc.length + ' 字，超过 20 字'); }
      if (cc && bad.length) {
        earned = Math.min(earned, 1);
        tips.push('主诉里出现了诊断性词语「' + bad.join('、') + '」，应改成症状描述');
      }
      items.push(item('入院记录—主诉', '第 6 页·入院记录',
        2, earned,
        !cc ? '还缺主诉。' : (tips.length ? tips.join('；') + '。' : '')));
    }

    // 现病史 8 分：起病时间、诱因、症状、缓解因素、治疗经过、鉴别阴性、发病后一般情况、其他需治疗疾病
    // ——第 6 页·入院记录
    {
      const cells = [
        // 起病时间：时长已并入主诉正文，正文里带了「2年」也算填了
        ['起病时间', isS(b.chiefComplaintDuration) || isS(h.onset) ||
          /[0-9０-９一二三四五六七八九十百千万两半十几数]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟)/.test(txt(b.chiefComplaint))],
        ['诱因', isS(h.cause)],
        ['症状', isS(h.symptoms)],
        ['缓解因素', isS(h.relief)],
        ['治疗经过', isS(h.treatment)],
        ['有鉴别诊断意义的阴性病史', isS(h.negativeDiscriminating)],
        ['发病后一般情况', isS(h.generalCondition)],
        ['与本病无关但仍需治疗的其他疾病', isS(pmh.otherTreatDiseases)]
      ];
      const miss = cells.filter(c => !c[1]).map(c => c[0]);
      items.push(item('入院记录—现病史', '第 6 页·入院记录',
        8, cells.length - miss.length,
        miss.length ? '现病史里还缺：' + miss.join('、') + '（每项 1 分）。' : ''));
    }

    // 既往史等：既往史、个人史、过敏史、婚育史、月经史、家族史 3 分 ——第 6 页·入院记录
    {
      const isFemale = txt(b.gender) === '女';
      // 注意（t9）：pmh.health 默认就是 '良好'、marriage.status 默认就是 '未婚'，
      // personal.smoking/drinking 默认 '无'。这些默认值不算「用户写过」，必须排除。
      const cells = [
        ['既往史', anyChecked(pmh.diseaseChecks) || isS(pmh.diseaseDetail) || isS(pmh.diseaseOther) ||
          isS(pmh.infection) || isS(pmh.surgery) || isS(pmh.trauma) || isS(pmh.transfusion) ||
          isS(pmh.longTermMeds) || isS(pmh.vaccine)],
        ['个人史', hasAny(per, ['birth', 'residence', 'travel', 'smokingAmount', 'drinkingAmount',
          'drugs', 'environment', 'habits'])],
        ['过敏史', isS(pmh.allergy) || anyChecked(pmh.allergenChecks)],
        ['婚育史', isS(b.marital) || (txt(obj(rec.marriage).status) && txt(obj(rec.marriage).status) !== '未婚')],
        ['家族史', anyChecked(fam.diseaseChecks) || hasAny(fam, ['other', 'threeGeneration',
          'similarDisease', 'deceased'])]
      ];
      if (isFemale) {
        const men = obj(rec.menstruation);
        cells.splice(4, 0, ['月经史',
          hasAny(men, ['age', 'cycle', 'duration', 'quantity', 'lmp', 'menopauseAge', 'extra']) ||
          isS(men.applicable)]);
      }
      const miss = cells.filter(c => !c[1]).map(c => c[0]);
      items.push(item('入院记录—既往史/个人史/过敏史/婚育史/家族史', '第 6 页·入院记录',
        3, 3 * (cells.length - miss.length) / cells.length,
        miss.length ? '还缺：' + miss.join('、') + '。' : ''));
    }

    // 体格检查：各大系统完整、准确、规范，专科体检完整，有鉴别意义的阴性体征无遗漏 4 分 ——第 6 页
    {
      const S = schemaOf();
      const deptKey = txt(b.department) || 'general';
      const dept = S ? arr(S.DEPARTMENTS).find(d => d && d.key === deptKey) : null;
      const specials = dept ? arr(dept.special) : [];
      let groupFilled = 0;
      let groupTotal = 0;
      let groupDefaultOnly = 0;   // 整组都是默认描述（有记录但没核对过）
      let negCount = 0;
      if (S) {
        arr(S.PE_COMMON).forEach(g => {
          groupTotal += 1;
          // 「有记录」就算记过（默认描述也算，因为病历里确实有字）
          const filled = arr(g.items).filter(it => peFilled(rec, g.key, it.key));
          if (filled.length) {
            groupFilled += 1;
            if (filled.every(it => peIsDefault(rec, g.key, it.key))) groupDefaultOnly += 1;
          }
          arr(g.items).forEach(it => {
            if (!peFilled(rec, g.key, it.key)) return;
            if (peIsDefault(rec, g.key, it.key)) return;   // 默认文案里的「未见/无」不算
            if (NEG_WORDS.test(peUserVal(rec, g.key, it.key))) negCount += 1;
          });
        });
      }
      let specialOk = true;
      let specialDefaultOnly = false;
      specials.forEach(spKey => {
        const sp = S && S.PE_SPECIAL ? S.PE_SPECIAL[spKey] : null;
        if (!sp) return;
        const filled = arr(sp.items).filter(it => peFilled(rec, 'special_' + spKey, it.key));
        if (!filled.length) specialOk = false;
        else if (filled.every(it => peIsDefault(rec, 'special_' + spKey, it.key))) specialDefaultOnly = true;
      });
      // 只有该科室真的有专科查体时，才把「专科体检记录」算进分母；
      // 否则通用科室会因为「没有专科查体」白拿三分之一的分数（t9 修的泄漏点）。
      const parts = [
        { ok: groupTotal > 0 && groupFilled >= Math.ceil(groupTotal * 0.8), miss: '各大系统的查体记录' },
        { ok: negCount >= 3, miss: '有鉴别诊断意义的阴性体征' }
      ];
      if (specials.length) parts.splice(1, 0, { ok: specialOk, miss: '专科体检记录' });
      const miss = parts.filter(x => !x.ok).map(x => x.miss);
      const tips = [];
      if (miss.length) tips.push('体格检查里还缺：' + miss.join('、') + '。');
      if (groupDefaultOnly > 0 || specialDefaultOnly) {
        tips.push('其中 ' + groupDefaultOnly + ' 个系统的查体用的是默认描述，建议逐项核对后按本例实际修改。');
      }
      items.push(item('入院记录—体格检查', '第 6 页·入院记录',
        4, 4 * (parts.length - miss.length) / parts.length,
        tips.join(''),
        {
          // 整段查体全是默认描述时，标记出来供界面提示「未核对」
          isDefault: !miss.length && groupDefaultOnly > 0 && groupDefaultOnly === groupFilled && !specialDefaultOnly
        }));
    }

    // 辅助检查：与本次疾病相关的主要辅助检查及其结果 2 分 ——第 6 页·入院记录
    items.push(item('入院记录—辅助检查', '第 6 页·入院记录',
      2, aux.length ? 2 : 0,
      aux.length ? '' : '还缺与本次疾病相关的主要辅助检查及结果（2 分）；确实还没做，写「暂缺」也比空着好核对。'));

    // 诊断：书写准确，初步诊断合理规范，修正/补充记录在病程录中 4 分 ——第 6 页·入院记录
    items.push(item('入院记录—诊断', '第 6 页·入院记录',
      4, dx.length ? 4 : 0,
      dx.length ? '' : '还缺初步诊断（4 分）：按主次列出，主要诊断放第一条。',
      { note: '诊断准确与否需要带教老师判断；本工具只核对「写了没有、排了主次没有」。' }));

    /* ---------- 首次病程记录（第 6 页，20 分） ---------- */

    // 病历特点 4 分 ——第 6 页·首次病程记录
    {
      const v = txt(s.summary);
      items.push(item('首次病程记录—病历特点', '第 6 页·首次病程记录',
        4, v ? (v.length >= 30 ? 4 : 2) : 0,
        v ? (v.length >= 30 ? '' : '病历特点只有 ' + v.length + ' 字，归纳得再完整些（主诉＋关键阳性＋关键阴性）。')
          : '还缺病历特点（4 分）：把现病史归纳成几句。'));
    }

    // 诊断依据 6 分 ——第 6 页·首次病程记录
    {
      const details = arr(a.basisDetail);
      const miss = [];
      let covered = 0;
      dx.forEach(name => {
        const e = matchEntry(details, name);
        if (e && isS(e.history) && isS(e.pe)) covered += 1;
        else miss.push(name);
      });
      const earned = dx.length ? 6 * covered / dx.length : (isS(a.basis) ? 3 : 0);
      items.push(item('首次病程记录—诊断依据', '第 6 页·首次病程记录',
        6, earned,
        !dx.length ? '还缺初步诊断，诊断依据没法逐条写（6 分）。'
          : (miss.length ? '这些诊断还缺病史＋体检的依据：' + miss.join('；') + '（共 6 分）。' : '')));
    }

    // 鉴别诊断 4 分 ——第 6 页·首次病程记录
    {
      const diffs = arr(a.diff);
      let earned = 0;
      if (diffs.length) {
        const full = diffs.filter(d => isS(obj(d).diagnosis) && isS(obj(d).why)).length;
        earned = 4 * Math.min(1, full / 2);
      }
      items.push(item('首次病程记录—鉴别诊断', '第 6 页·首次病程记录',
        4, earned,
        diffs.length
          ? (earned < 4 ? '鉴别诊断还缺「为什么考虑 / 哪一点不支持」的展开（4 分）。' : '')
          : '还缺鉴别诊断段（4 分）：围绕主要诊断写 2 条，分析要有条理。'));
    }

    // 诊疗计划 6 分 ——第 6 页·首次病程记录
    {
      const pds = arr(p.perDiagnosis);
      const hasPrinciple = isS(p.principle);
      let earned = 0;
      if (hasPrinciple) earned += 2;
      if (pds.length) {
        const useful = pds.filter(d => isS(obj(d).exam) || isS(obj(d).treatment)).length;
        earned += 4 * Math.min(1, useful / Math.max(1, dx.length || 1));
      }
      items.push(item('首次病程记录—诊疗计划', '第 6 页·首次病程记录',
        6, earned,
        earned >= 6 ? ''
          : '还缺具体的检查与治疗安排' + (hasPrinciple ? '' : '（总述也还没有）') +
            '：每条诊断对应写「查什么、怎么治」，共 6 分。'));
    }

    /* ---------- 病程记录与上级查房（第 6 页，40 分，本工具无载体） ---------- */

    items.push(item(
      '病程记录—记录时间与频次',
      '第 6 页·病程记录',
      0, 0,
      '本工具不生成病程记录（5 分）：病危每日 1 次以上、病重每 2 日 1 次以上、病情稳定每 3 日 1 次，' +
      '需在医院的电子病历系统里按频次完成。',
      { kind: KIND_PROCESS, weight: 5, status: 'missing' }
    ));
    items.push(item(
      '病程记录—记录内容（6 项，每项 5 分）',
      '第 6 页·病程记录',
      0, 0,
      '本工具不生成病程记录（30 分）。自查时逐条对：①病情变化与诊治过程有分析 ②辅助检查结果有记录及分析 ' +
      '③重要医嘱更改（抗生素及专科用药）及时、理由充分 ④交接班/转科/阶段小结按时完成 ' +
      '⑤重要操作、抢救记录及时完整 ⑥病例讨论记录翔实、层次清楚。',
      { kind: KIND_PROCESS, weight: 8, status: 'missing' }
    ));
    items.push(item(
      '上级医师查房记录',
      '第 6 页·上级医师查房记录',
      0, 0,
      '本工具不生成查房记录（5 分）：规定时间内完成（主治每周 2 次、副高以上每周 1 次），记录要真实、层次清楚、重点突出。',
      { kind: KIND_PROCESS, weight: 4, status: 'missing' }
    ));

    /* ---------- 出院记录（第 6-7 页，15 分） ---------- */

    // 一般情况：姓名、性别、年龄、入院日期、出院日期、住院天数 2 分 ——第 6 页·出院记录
    {
      const days = daysBetween(b.admitDate, dis.dischargeDate);
      const cells = [
        ['姓名', isS(b.name)],
        ['性别', isS(b.gender)],
        ['年龄', isS(b.age)],
        ['入院日期', isS(b.admitDate)],
        ['出院日期', isS(dis.dischargeDate)],
        ['住院天数', days > 0]
      ];
      const miss = cells.filter(c => !c[1]).map(c => c[0]);
      items.push(item('出院记录—一般情况', '第 6 页·出院记录',
        2, 2 * (cells.length - miss.length) / cells.length,
        miss.length
          ? '还缺：' + miss.join('、') + '。' +
            (!isS(dis.dischargeDate) ? '填了出院日期，住院天数就能自动算出来。' : '')
          : ''));
    }

    // 入院情况：简洁明了、重点突出，入院诊断合理 2 分 ——第 6 页·出院记录
    items.push(item('出院记录—入院情况', '第 6 页·出院记录',
      2, isS(dis.admitCondition) ? 2 : 0,
      isS(dis.admitCondition) ? '' : '还缺入院情况（2 分）：入院时的主要症状、体征与入院诊断，简洁明了。'));

    // 诊疗经过：住院期间的病情变化、检查结果、治疗经过及效果 5 分 ——第 6 页·出院记录
    {
      const v = txt(dis.course);
      const groups = [
        { name: '病情变化', re: /(病情|症状|体温|好转|加重|稳定)/ },
        { name: '检查结果', re: /(检查|复查|化验|CT|B超|超声|胸片|心电图|血|培养|结果)/ },
        { name: '治疗经过及效果', re: /(治疗|用药|予|给予|抗感染|手术|效果|好转|治愈|出院)/ }
      ];
      const miss = v ? groups.filter(g => !g.re.test(v)).map(g => g.name) : groups.map(g => g.name);
      items.push(item('出院记录—诊疗经过', '第 6 页·出院记录',
        5, v ? 5 * (groups.length - miss.length) / groups.length : 0,
        !v ? '还缺诊疗经过（5 分）：住院期间的病情变化、检查结果、治疗经过及效果。'
          : (miss.length ? '诊疗经过里还看不到：' + miss.join('、') + '。' : '')));
    }

    // 出院情况：主要症状、体征、辅助检查结果 2 分 ——第 6 页·出院记录
    items.push(item('出院记录—出院情况', '第 6 页·出院记录',
      2, isS(dis.dischargeStatus) ? 2 : 0,
      isS(dis.dischargeStatus) ? '' : '还缺出院情况（2 分）：出院时的主要症状、体征、复查的辅助检查结果。'));

    // 出院诊断：完整、规范 2 分 ——第 7 页·出院记录
    {
      const list = arr(dis.diagnoses).map(txt).filter(Boolean);
      const finalList = list.length ? list : dx;
      items.push(item('出院记录—出院诊断', '第 7 页·出院记录',
        2, finalList.length ? 2 : 0,
        finalList.length
          ? (list.length ? '' : '出院诊断目前沿用「初步诊断」，如住院期间有修正，请写明最终的诊断。')
          : '还缺出院诊断（2 分）。',
        { note: finalList.length ? '出院诊断：' + finalList.join('；') : '' }));
    }

    // 出院医嘱：全面、具体（药物及非药物治疗、生活指导、复诊时间）2 分 ——第 7 页·出院记录
    {
      const adv = obj(dis.advice);
      const cells = [
        ['药物', isS(adv.drug)],
        ['非药物治疗', isS(adv.nonDrug)],
        ['生活指导', isS(adv.lifestyle)],
        ['复诊时间', isS(adv.followUp)]
      ];
      const miss = cells.filter(c => !c[1]).map(c => c[0]);
      items.push(item('出院记录—出院医嘱', '第 7 页·出院记录',
        2, 2 * (cells.length - miss.length) / cells.length,
        miss.length ? '出院医嘱还缺：' + miss.join('、') + '（每项 0.5 分）。' : ''));
    }

    return finalize({
      station: '病历书写',
      key: 'writing',
      page: '第 6-7 页',
      processMaxScore: 40,   // 病程记录 35 + 上级医师查房 5
      fullMaxScore: 100,
      notes: [
        '本工具可核对 60 分（入院记录 25 + 首次病程记录 20 + 出院记录 15）；' +
        '病程记录 35 分、上级医师查房 5 分（合计 40 分）本工具不生成，需要你在电子病历系统里完成。'
      ]
    }, items);
  }

  /* =====================================================================
   * 八、汇总：各考站得分 + 加权总分 + 最该补的 3 项
   *
   * 权重是本工具自定义的（用来把四个考站压成一个参考分），不是官方分值权重。
   * 排序看的是「补上这一项能拿回多少分」，与考站权重无关。
   * =================================================================== */

  const WEIGHTS = { history: 0.2, physical: 0.2, firstCourse: 0.3, writing: 0.3 };
  const WEIGHT_NOTE = '加权总分用的权重（病史 0.2 / 查体 0.2 / 首次病程 0.3 / 病历书写 0.3）' +
    '是本工具自定义的参考权重，不是官方分值权重，只用于把四个考站合成一个总览。';

  function summary(r) {
    const results = [checkHistory(r), checkPhysical(r), checkFirstCourse(r), checkWriting(r)];

    const stations = results.map(res => ({
      key: res.key,
      station: res.station,
      page: res.page,
      score: res.score,
      maxScore: res.maxScore,
      percent: res.percent,
      lost: res.lost,
      processMaxScore: res.processMaxScore,
      advisoryFailed: res.advisoryFailed,
      fullMaxScore: res.fullMaxScore
    }));

    const pending = [];
    results.forEach(res => {
      res.items.forEach(it => {
        if (it.status === 'ok') return;
        pending.push({
          stationKey: res.key,
          station: res.station,
          page: it.page,
          item: it.item,
          kind: it.kind,
          status: it.status,
          maxScore: it.maxScore,
          earned: it.earned,
          missing: round1(it.maxScore - it.earned),
          priority: it.priority,
          suggestion: it.suggestion
        });
      });
    });
    // 优先级：先看能补回多少分，再看是不是硬性项（腹部次序等 priority 已含权重）
    pending.sort((x, y) => (y.priority - x.priority) || String(x.page).localeCompare(String(y.page)));

    const weightedPercent = round1(results.reduce(
      (sum, res) => sum + toNum(WEIGHTS[res.key]) * res.percent, 0));

    // 「最该补的 3 项」只从病历文本里挑：现场动作分不在病历里，不该挤掉真正能补的内容
    const top3 = pending
      .filter(x => x.kind !== KIND_PROCESS)
      .slice(0, 3)
      .map((x, i) => {
        const y = Object.assign({}, x);
        y.rank = i + 1;
        return y;
      });

    /* ---- 默认描述统计（t10）----
     * defaultCount：所有标了 isDefault 的检查项数（供界面显示「其中 N 项未核对」）
     * defaultScore：这些项拿到的分（同样是「已填写」的分，不是虚的）
     * unverified  ：已经得分、但内容全是默认描述的项，单独列出来方便界面做「待核对」清单
     */
    const defaultItems = [];
    const unverified = [];
    results.forEach(res => {
      res.items.forEach(it => {
        if (!it.isDefault) return;
        const entry = {
          stationKey: res.key,
          station: res.station,
          page: it.page,
          item: it.item,
          kind: it.kind,
          earned: it.earned,
          maxScore: it.maxScore,
          suggestion: it.suggestion
        };
        defaultItems.push(entry);
        if (it.earned > 0) unverified.push(entry);
      });
    });
    const defaultCount = defaultItems.length;
    const defaultScore = round1(defaultItems.reduce((s, x) => s + toNum(x.earned), 0));

    return {
      stations: stations,
      weighted: {
        score: weightedPercent,
        maxScore: 100,
        percent: weightedPercent,
        weights: Object.assign({}, WEIGHTS)
      },
      top3: top3,
      pending: pending,
      pendingCount: pending.length,
      processTodo: pending.filter(x => x.kind === KIND_PROCESS),
      // ---- 默认描述统计（t10）：界面可显示「其中 N 项为未核对的默认描述」 ----
      defaultCount: defaultCount,
      defaultScore: defaultScore,
      defaultItems: defaultItems,
      // 已经拿了分、但整项内容都是默认描述的项（提示「核对后保留或修改」）
      unverifiedCount: unverified.length,
      unverified: unverified,
      disclaimer: DISCLAIMER,
      notes: [
        WEIGHT_NOTE,
        '各考站只统计「能写进病历的文字」；现场动作分与病程记录分单独列出（见各站的 processMaxScore），不计入得分。',
        '「最该补的 3 项」按「补上能拿回多少分」排序，硬性项（如腹部查体次序）会被提前；' +
        '现场动作类的提醒列在 processTodo 里，不占前三。',
        defaultCount > 0
          ? '本次得分中有 ' + defaultCount + ' 项（合计 ' + defaultScore +
            ' 分）用的是系统默认描述，尚未按本例核对；这些分算作「已填写」，但建议逐项确认。'
          : ''
      ].filter(Boolean)
    };
  }

  /* ---------------------------------------------------------------------
   * 九、导出
   * ------------------------------------------------------------------- */

  return {
    STATIONS,
    DISCLAIMER,
    WEIGHTS,
    checkHistory,
    checkPhysical,
    checkFirstCourse,
    checkWriting,
    summary,
    // 供测试/调试的小工具（不参与业务）
    _internals: {
      diagWordsIn, abdomenOrder, daysBetween, clauses,
      peFilled, peUserVal, peUserText, peIsDefault, specScore, defaultHint, schemaOf
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CHECKER;
}
