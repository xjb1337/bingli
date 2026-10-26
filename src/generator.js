/* ===========================================================================
 * 大病历生成器 —— 核心生成逻辑（纯函数，可在 Node 中单测）
 * 输入：record（见 schema.emptyRecord）
 * 输出：{ text, sections, warnings, summaryDraft }
 * =========================================================================== */

const GENERATOR = (() => {
  'use strict';

  /* ---------------------------- 文本工具 ---------------------------- */

  const stripTail = s => String(s || '').trim().replace(/[，,；;。\s]+$/g, '');

  /** 把若干短句拼成一段，自动补句号 */
  function joinSentences(parts, sep = '') {
    return parts
      .map(p => stripTail(p))
      .filter(Boolean)
      .map(p => p + '。')
      .join(sep);
  }

  /**
   * 把若干分句用逗号串成一句连贯的话，用户原文自己写了句号的另起一句。
   *
   * 《诊断学》第10版要求现病史「应当按时间顺序书写……应结合问诊内容，经整理分析后，
   * 围绕主诉进行描写」——是「一段话」，不是「一条字段一句」。旧实现每个结构化字段
   * 各占一句，输出「患者3天前。中上腹持续性隐痛，进食后加重。服奥美拉唑可缓解。」，
   * 其中「患者3天前。」是断句错误的残句，读起来不像病历（已复现）。
   * 这里按「同一件事的分句用逗号连起来」处理，同时尊重用户自己写的句号。
   *
   * @param {string[]} parts 分句（各字段原文，可为空串）
   * @returns {string[]} 句子数组，每项末尾不带标点
   */
  function joinClauses(parts) {
    const sentences = [];
    let cur = [];
    parts.forEach(p => {
      const t = stripTail(p);
      if (!t) return;
      t.split(/。/).map(s => stripTail(s)).filter(Boolean).forEach((unit, i) => {
        if (i > 0) {
          if (cur.length) sentences.push(cur);
          cur = [];
        }
        cur.push(unit);
      });
    });
    if (cur.length) sentences.push(cur);
    return sentences.map(cs => cs.join('，')).filter(Boolean);
  }

  /** 拼短语，用顿号连接 */
  const joinList = arr => arr.filter(Boolean).join('、');

  /** 中医/中文数字：中文病历里年龄用阿拉伯数字即可 */
  const num = v => (v === 0 || v ? String(v) : '');

  /** 文本归一化：去掉标点与空白，只用来判断「是不是写重了」 */
  const squash = s => String(s || '').replace(/[\s，,。；;、：:]+/g, '');

  /**
   * 现病史内部去重。
   *
   * 「缓解因素」「具有鉴别诊断意义的阴性病史」是评分表明确单列的两个要素
   * （第6页现病史、第2页「伴随症状和阴性鉴别症状」），但它们很容易和
   * 「伴随症状」写重——写重了既啰嗦，又显得问诊思路不清。
   * 这里按「整句已覆盖 → 列表逐项去重」两级处理：
   *   1) 整句已被前面的句子包含 → 整句省略；
   *   2) 列表里某一项已写过 → 只保留没写过的项。
   *
   * 「无咯血、盗汗、消瘦」这种中文省略式否定要特别处理：后项本身不带否定词，
   * 但语义上继承前项的「无」。去重后如果只剩「消瘦」，必须补回「无」，
   * 否则「消瘦。」单独成句会被读成阳性表现，与事实相反。
   *
   * @param {string[]} seg 已经写进现病史的句子
   * @param {string} text 准备写入的句子（用户填的原文）
   * @returns {string} 去重后的句子；完全重复时返回 ''
   */
  function mergeIntoHistory(seg, text) {
    const t = stripTail(text);
    if (!t) return '';
    const existing = squash(seg.join(''));
    if (!existing) return t;
    if (existing.includes(squash(t))) return '';
    // 含分号的复合句不拆：拆开会丢掉分句之间的语义关系
    if (/[；;]/.test(t)) return t;
    const clauses = t.split(/[、，,]/).map(s => s.trim()).filter(Boolean);
    if (clauses.length < 2) return t;

    const NEG_HEAD = /^(无|未|否认|没有|未见)/;
    const NEG_ANY = /(无|未|否认|没有|未见)/;
    const effective = [];      // [{ core, neg, text, standAlone }]
    let prevNeg = '';
    clauses.forEach(c => {
      const head = (c.match(NEG_HEAD) || [''])[0];
      const core = c.replace(NEG_HEAD, '').trim();
      // 句中出现否定词（"体重无明显下降"）按独立分句看待，不继承前项否定
      const standAlone = !head && NEG_ANY.test(c);
      // 「无咯血、盗汗、消瘦」：后面不带否定词的分句继承前一项的「无」
      const neg = head || (standAlone ? '' : prevNeg);
      if (head) prevNeg = head;
      effective.push({ core, neg, text: standAlone ? c : core, standAlone });
    });

    const kept = effective.filter(e => !(e.core.length >= 2 && existing.includes(squash(e.core))));
    if (kept.length === effective.length) return t;
    if (!kept.length) return '';

    // 同一否定词开头的连续项合并，保持「无A、B」的写法
    const groups = [];
    kept.forEach(e => {
      const last = groups[groups.length - 1];
      if (last && last.neg === e.neg && !e.standAlone) last.items.push(e.text);
      else groups.push({ neg: e.neg, items: [e.text] });
    });
    return groups.map(g => g.neg + g.items.join('、')).join('，');
  }

  /* ---------------------------- 一般项目 ---------------------------- */

  /**
   * 诱因写成完整句子。
   *
   * 用户在「发病诱因」里通常只写「受凉后」「进食油腻食物后」这样的短语，
   * 直接拼进现病史会得到一个孤零零的短句（"受凉后。"），读起来像病句。
   * 这里补足谓词让它成为完整分句；已经写成完整句的保持原样。
   *
   * 「无明显诱因」不是诱因，是「没有诱因」的表述，属于起病情况那一句的内容，
   * 所以这里直接返回空串，交由 onset 去说，避免出现两句「无明显诱因」。
   */
  function normalizeCause(v) {
    const t = stripTail(v);
    if (!t) return '';
    if (/^(无明显诱因|无诱因|无明显原因|诱因不明)/.test(t)) return '';
    // 已经是完整分句（含谓词或连接词）就不再加工
    if (/[。；;]/.test(t) || /(出现|发生|诱发|起病|引起)/.test(t)) return t;
    if (/后$/.test(t)) return `${t}起病`;
    return `${t}为本次发病诱因`;
  }

  /**
   * 起病与诱因不能自相矛盾。
   *
   * 「起病情况」常被草稿成「无明显诱因出现腹痛」；如果用户随后又填了「受凉后」，
   * 两句话并列就成了「无明显诱因…受凉后…」的矛盾表述。有明确诱因时，
   * 把起病描述里的「无明显诱因」去掉，诱因由 cause 单独交代。
   */
  function reconcileOnsetWithCause(onset, cause) {
    const o = stripTail(onset);
    if (!o || !stripTail(cause)) return o;
    return stripTail(
      o.replace(/，?(无明显诱因|无诱因|无明显原因)/g, '')
       .replace(/^(无明显诱因|无诱因|无明显原因)/, '')
    );
  }

  /**
   * 年龄文本：已经带单位就原样返回，否则补「岁」。
   *
   * 儿科病历写「7月」「3天」，成人写「58」。以前统一拼「岁」，
   * 儿科会输出「7月岁」这种不存在的写法。
   */
  function ageWithUnit(basic) {
    const raw = stripTail((basic || {}).age);
    if (!raw) return '';
    return /[岁月天周时]/.test(raw) ? raw : raw + '岁';
  }

  /** 中文数字转数值（年龄常见写法「十四」「二十三」「一百」够用即可） */
  function cnNumber(text) {
    const D = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    let total = 0;
    let cur = 0;
    for (const ch of String(text || '')) {
      if (D[ch]) cur = D[ch];
      else if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
      else if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
    }
    return total + cur;
  }

  /**
   * 年龄换算成周岁数，供「患儿 / 患者」这类按年龄判断的地方使用。
   *
   * 「7月」「3天」「28周」这类儿科写法按 0 岁处理；取不出来返回 NaN，
   * 由调用方按成人兜底（不猜）。
   *
   * @param {object} basic record.basic
   * @returns {number} 周岁；无法判断时为 NaN
   */
  function ageYears(basic) {
    const raw = stripTail((basic || {}).age);
    if (!raw) return NaN;
    if (!/岁/.test(raw) && /[天日周月时]/.test(raw)) return 0;
    const ar = raw.match(/[0-9０-９]+(?:\.[0-9]+)?/);
    if (ar) return parseFloat(ar[0].replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)));
    const cn = raw.match(/[一二三四五六七八九十百]+/);
    if (cn) return cnNumber(cn[0]);
    return NaN;
  }

  /**
   * 病历主语：按年龄判断，不按科室。
   *
   * 旧实现写死 `department === 'pediatrics' ? '患儿' : '患者'`，于是 70 岁病人
   * 只要挂在儿科就输出「患儿，男，70岁」——主语和年龄自相矛盾（已复现）。
   * 儿科收 14 岁以上的青少年也很常见，年龄才是唯一可靠的判据。
   *
   * @param {object} basic record.basic
   * @returns {string} '患儿' 或 '患者'
   */
  function subjectOf(basic) {
    return ageYears(basic) < 14 ? '患儿' : '患者';
  }

  /**
   * 缺项占位符。
   *
   * 《诊断学》第10版 病历书写：「所有表格项都应详细填写，无内容者画"/"或"—"」，
   * 一般项目更是明确「需逐项填写，不可空缺」。但工具**不能替学生编内容**——
   * 于是「没填」必须和「填了」在正文里区分得出来：项目名照写，值写「／」。
   *
   * 用全角「／」（U+FF0F）而不是半角 `/`：中文病历里全角更整齐，也不会在
   * 「BP /mmHg」这种地方和半角斜杠混淆。
   */
  const PH = '／';

  /** 取文本值，空则返回占位符 */
  const filledOrPH = v => stripTail(v) || PH;

  /**
   * 一般项目。
   *
   * 按病历书写规范一行一项（见用户提供的模板），不再挤成一句。
   *
   * ⚠️ 本轮改动（缺陷2/缺陷3）：
   *   1) 每一项都**固定输出**，没填就写「／」。原来全是 `if (x) lines.push(...)`，
   *      空记录只剩民族/记录日期/可靠程度三行——教材要求「需逐项填写，不可空缺」，
   *      整项消失比写「／」更糟：看病历的人分不清是「没问」还是「漏印」。
   *   2) 新增「科别」「床号」两栏。教材：「每张记录用纸均须完整填写眉栏
   *      （病人姓名、住院号、科别、床号）及页码，以避免与其他病人混淆」。
   *      此前 schema 里连字段都没有，用户选了科室、住了几床，正文里完全不体现。
   *
   * @param {object} r record
   * @returns {string} 多行文本
   */
  function buildBasicInfo(r) {
    const b = r.basic || {};
    const lines = [];
    const age = ageWithUnit(b);

    // 科别：从 DEPARTMENTS 查中文名，绝不把内部 key（digestive）写进病历。
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === b.department);
    const deptName = dept ? dept.name : '';

    lines.push(`姓名：${filledOrPH(b.name)}`);
    lines.push(`性别：${filledOrPH(b.gender)}`);
    lines.push(`年龄：${filledOrPH(age)}`);
    lines.push(`科别：${filledOrPH(deptName)}`);
    lines.push(`床号：${filledOrPH(b.bedNo)}`);
    lines.push(`住院号：${filledOrPH(b.recordNo)}`);
    // 民族/病史可靠程度原来是 schema 里的默认值（'汉族' / '可靠'），
    // 空记录会直接写成「民族：汉族」「病史可靠程度：可靠」——学生没问过民族、
    // 也没判断过病史可靠性，工具不能替他下结论。默认值已清空，这里写「／」。
    lines.push(`民族：${filledOrPH(b.nationality)}`);
    lines.push(`籍贯：${filledOrPH(b.nativePlace)}`);
    lines.push(`出生地：${filledOrPH(b.birthPlace)}`);
    const marital = (r.marriage || {}).status || b.marital;
    lines.push(`婚姻：${filledOrPH(marital)}`);
    lines.push(`职业：${filledOrPH(b.occupation)}`);
    lines.push(`工作单位：${filledOrPH(b.workUnit)}`);
    lines.push(`通讯地址：${filledOrPH(b.address)}`);
    lines.push(`电话号码：${filledOrPH(b.phone)}`);
    lines.push(`入院日期：${filledOrPH(b.admitDate)}`);
    lines.push(`记录日期：${filledOrPH(b.recordDate)}`);
    // 病史陈述者：成人默认「患者本人」。14 岁以下患儿说不清自己的病史，
    // 按《诊断学》第10版问诊要求应由家属代述；但「母亲/父亲/祖父」这类具体关系
    // 系统无从得知，编造等于伪造病历，所以未填写时只写「家属」。
    // ⚠️ 这段主语/代述逻辑归 narrative 同事维护，本轮保持原样不动；
    //    只在最终为空时补占位符，保证一行不缺。
    const informant = stripTail(b.informant);
    const isChildInformant = ageYears(b) < 14;
    const who = informant || (isChildInformant ? '家属' : (b.name ? `患者本人（${b.name}）` : ''));
    lines.push(`病史陈述者：${filledOrPH(who)}`);
    lines.push(`病史可靠程度：${filledOrPH(b.reliability)}`);
    return lines.join('\n');
  }

  /* ---------------------------- 主诉 ---------------------------- */

  /**
   * 一段文字里有没有「持续时间」——数字/中文数字 + 时间单位。
   *
   * 缺陷H4 用：主诉正文已经写了「反复上腹痛3年」，只是没在「持续时间」输入框里
   * 再抄一遍时，validate 不该报「缺少持续时间」。
   * 认的形态：3天 / 3天余 / 三年 / 半个月 / 1周多 / 2小时 / 十余年 / 数日。
   *
   * @param {string} text
   * @returns {boolean}
   */
  function hasDurationInText(text) {
    const t = stripTail(text);
    if (!t) return false;
    return /[0-9０-９一二三四五六七八九十百千万两半十几数余]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|h|min)/.test(t);
  }

  function buildChiefComplaint(r) {
    const b = r.basic || {};
    const cc = stripTail(b.chiefComplaint);
    if (!cc) return '';
    // 用户要求把「持续时间 + 单位」两个控件去掉：时间直接写在主诉这一句里。
    // 所以这里的第一原则变成**主诉正文是什么就写什么**，不再往后面拼字段。
    //
    // 仍然保留 duration 字段的拼接能力，只为两件事：
    //   1) 套用模板时模板把时长放在单独字段里（53 份模板有 13 份这么写）；
    //   2) 旧存档里已经存了 duration。
    // 这两种情况下用户看到的是「正文 + 时长」，不是他手写的，属于历史数据兼容。
    let dur = stripTail(b.chiefComplaintDuration);
    if (!dur) return `${cc}。`;

    const unit = b.chiefComplaintDurationUnit || '';
    // 用户已经写了单位就不再加
    if (!/[天日周月年小时分]/.test(dur)) dur += unit;
    // 主诉正文里已包含该时长（"停经34周" + 34周）时不再重复
    if (cc.includes(dur)) return `${cc}。`;
    // 主诉以某个时间结束（"发现血压升高1周"），又单独填了时长时，直接以主诉为准。
    // 末尾允许带「余/多/左右/来」等约数词——旧正则只认数字结尾，
    // 「反复上腹痛三年余」+ 时长「3年」会拼成「反复上腹痛三年余3年。」（已复现）。
    if (/[0-9一二三四五六七八九十百]+(天|日|周|月|年|小时|分钟)(?:余|多|左右|来)?$/.test(cc)) return `${cc}。`;
    return `${cc}${dur}。`;
  }

  /* ---------------------------- 现病史 ---------------------------- */

  const HPI_DEFAULTS = {
    generalCondition: '发病以来，精神、食欲、睡眠可，大小便正常，体重无明显变化'
  };

  /**
   * 现病史末句「发病以来一般情况」该写什么。
   *
   * ⚠️ 指令B 已复现：空记录时 buildHPI 仍凭空写
   * 「患者发病以来，精神、食欲、睡眠可，大小便正常，体重无明显变化。」，
   * 摘要又复述一遍。学生一个字都没填，程序却断言病人吃喝睡大小便体重全都正常，
   * 正是《诊断学》第10版禁止的「臆断或虚构」（「无内容者画"/"或"—"」）。
   *
   * 规则：
   *   ① 用户自己填了就按原话写（不加工）；
   *   ② 没填时，只有本次现病史本身已有实质内容（起病、症状、诊疗经过…），
   *      才用默认句式兜底——此时这一段是真实病人，默认句起到
   *      「这一项必须问」的提示作用；
   *   ③ 现病史为空 → 返回空串，由 generate() 统一补「／」占位，
   *      绝不替病人写「一切正常」。
   *
   * ⚠️ 判据里**不再包含主诉**（已复现的缺陷B1）：只填「上腹痛3天」、hpi 全空时，
   * 旧判据 `hasHistory || hasCC` 把主诉当成「问过现病史」的证据，于是凭空写出
   * 「发病以来，精神、食欲、睡眠可，大小便正常，体重无明显变化」。
   * 主诉有内容 ≠ 问过食欲睡眠体重；这句话只有在学生真的写了现病史时才作为
   * 「这一项该问」的提示存在。只填主诉时 buildHPI 返回空串，正文由 generate() 补「／」。
   *
   * 注意：起病时间只有一个光秃秃的时间短语（「3天前」）不算实质内容，见 buildHPI。
   *
   * @param {object} r record
   * @returns {string} 一句话（不带句号），空串表示不写
   */
  function hpiGeneralSentence(r) {
    const h = r.hpi || {};
    const own = stripTail(h.generalCondition);
    if (own) return own;
    const fields = ['onset', 'cause', 'symptoms', 'relief', 'evolution',
      'accompanying', 'negativeDiscriminating', 'treatment', 'extra'];
    const hasHistory = fields.some(k => {
      const v = stripTail(h[k]);
      // 只有「3天前」这类裸时间短语，不足以证明问过一般情况（缺陷B1/H6）
      return v && !isBareOnsetPhrase(v);
    });
    return hasHistory ? HPI_DEFAULTS.generalCondition : '';
  }

  /**
   * 是不是一个「光秃秃的时间短语」——没有症状、没有谓语。
   *
   * 缺陷H6 已复现：学生在起病时间里只写「3天前」，旧实现拼出
   * 「患者3天前。」（主语+时间，没有谓语），后面再接一般情况句，读起来是断句错误。
   * 这里只认「数字/约数 + 时间单位 + 前后缀」这种纯时间片段；
   * 「3天前出现咳嗽」含症状，不属于裸时间短语。
   *
   * @param {string} text
   * @returns {boolean}
   */
  function isBareOnsetPhrase(text) {
    const t = stripTail(text);
    if (!t) return false;
    return /^(?:约|大约|近|距今|迄今)?[0-9０-９一二三四五六七八九十百千万两半十几数余]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|h|min)(?:余|多|来|左右|之后|以后|前|以前)?$/.test(t);
  }

  /**
   * 根据结构化字段组装现病史。
   *
   * 字段顺序对照评分表第6页「现病史」逐字排列：
   *   起病时间 → 诱因 → 症状特点 → 缓解因素 → 病情进展 → 伴随症状
   *   → 有鉴别诊断意义的阴性病史 → 治疗经过 → 发病后一般情况 →（补充）
   * 其中「诱因」「缓解因素」「鉴别阴性」是本次新接上的评分要素，
   * 前两者与伴随症状写重时会自动去重，避免同一句在病历里出现两遍。
   */
  function buildHPI(r) {
    const h = r.hpi || {};
    if (h.mode === 'manual') {
      return h.manual ? joinSentences([h.manual]) : '';
    }
    const seg = [];
    const causeText = normalizeCause(h.cause);
    const onset = reconcileOnsetWithCause(h.onset, causeText);
    if (onset) seg.push(onset);

    // 诱因：起病描述里已经写了「受凉后/进食后」等就不再重复
    const cause = mergeIntoHistory(seg, causeText);
    if (cause) seg.push(cause);

    if (stripTail(h.symptoms)) seg.push(stripTail(h.symptoms));

    // 缓解因素（评分表第6页现病史明确列出；第2页未列，属加分项）
    const relief = mergeIntoHistory(seg, h.relief);
    if (relief) seg.push(relief);

    if (stripTail(h.evolution)) seg.push(stripTail(h.evolution));
    if (stripTail(h.accompanying)) seg.push(stripTail(h.accompanying));

    // 具有鉴别诊断意义的阴性病史（第2页 5 分、第6页现病史）
    const neg = mergeIntoHistory(seg, h.negativeDiscriminating);
    if (neg) seg.push(neg);

    if (stripTail(h.treatment)) seg.push(stripTail(h.treatment));

    // 与本病无关但仍需治疗的其他疾病（第6页现病史末项）。
    // 《诊断学》第10版：「与本次疾病虽无密切关系，但仍需治疗的其他疾病情况，
    // 应在现病史后另起一行描述」——它是独立的一句，不能混进病史主体。
    const other = stripTail((r.pmh || {}).otherTreatDiseases);
    // 发病后一般情况（精神、食欲、睡眠、大小便、体重）：教材同样单列一句。
    // 旧实现在这里无条件回落默认值，空记录就会凭空断言「精神食欲睡眠可，
    // 大小便正常，体重无明显变化」——见 hpiGeneralSentence 的说明。
    const gc = hpiGeneralSentence(r);

    // 病史主体用逗号连成 1～3 句连贯叙述。
    // 旧实现每个结构化字段各占一句，输出「患者3天前。中上腹持续性隐痛，进食后加重。」
    // ——「患者3天前。」是断句错误的残句（已复现）。《诊断学》第10版要求现病史
    // 「按时间顺序书写……经整理分析后，围绕主诉进行描写」，是连贯叙述而非字段罗列。
    //
    // ⚠️ 缺陷H6（已复现）：起病时间只写了「3天前」时，seg 里就只剩这一个裸时间短语，
    // joinClauses 拼出「患者3天前。」——主语+时间，没有谓语，后面还直接接一般情况句。
    // 处理：整段病史主体只有一个裸时间短语时，把这句丢掉（不写残句）。
    let bodySeg = seg;
    if (seg.length === 1 && isBareOnsetPhrase(seg[0])) bodySeg = [];
    const sentences = joinClauses(bodySeg);
    const tail = [];
    if (gc) tail.push(gc);
    if (other) tail.push(`另有${other}，需继续治疗`);
    if (stripTail(h.extra)) tail.push(stripTail(h.extra));
    if (!sentences.length && !tail.length) return '';
    let text = joinSentences(sentences.concat(tail));

    // 开头不写主语时补上；已含"患者/孕妇/患儿"等主语则不再重复。
    // 主语按年龄判（见 subjectOf）：旧实现按科室判，70 岁挂儿科会写成「患儿，男，70岁」。
    if (!/^(患者|患儿|产妇|孕妇|本人|家属|该)/.test(text)) {
      text = subjectOf(r.basic || {}) + text;
    }
    return text;
  }

  /**
   * 一键生成现病史初稿（只补齐空字段，不覆盖已写内容）。
   *
   * 起病时间的来源优先级：
   *   1) 主诉正文里已经写了时长（"反复上腹痛2年" → 取「2年」）；
   *   2) 旧存档 / 模板里单独的 duration 字段。
   * 界面上已经没有时长输入框了，所以 ① 是主路径；② 只为兼容旧数据。
   */
  function draftHPI(r) {
    const h = r.hpi || {};
    const b = r.basic || {};
    // 先从主诉正文里提时长，「反复上腹痛2年」「咳嗽3月余」都能提出来
    const m = String(b.chiefComplaint || '').match(
      /([0-9０-９一二三四五六七八九十百千万两半十几数]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟))/i
    );
    let cc = stripTail(b.chiefComplaint) || '上述症状';
    const durText = m ? m[1]
      : (stripTail(b.chiefComplaintDuration)
        ? stripTail(b.chiefComplaintDuration) + (b.chiefComplaintDurationUnit || '')
        : '');
    const out = { ...h };
    if (!stripTail(out.onset)) {
      // 时长已经从主诉里提走了，症状名里就不能再带一遍，
      // 否则会写出「2年前无明显诱因出现反复上腹痛2年」这种自己重复自己的句子。
      // 连着后面的约数词一起吃掉：「咳嗽3月余」→「3月前…咳嗽」，
      // 不能剩个「余」孤零零挂在句尾（「3月前…咳嗽余」，读着像错字）。
      if (m && durText === m[1]) {
        const esc = m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rest = stripTail(cc.replace(new RegExp(esc + '(?:余|多|左右|来|许)?'), ''));
        cc = rest || '上述症状';
      }
      out.onset = `${durText ? durText + '前' : ''}无明显诱因出现${cc}`;
    }
    if (!stripTail(out.generalCondition)) {
      out.generalCondition = HPI_DEFAULTS.generalCondition;
    }
    return out;
  }

  /* ---------------------------- 系统回顾 ---------------------------- */

  /**
   * 收集系统回顾数据，区分**三态**。
   *
   * 数据结构：r.ros = { [系统key]: { [症状key]: { checked, negative, time, detail } } }
   *
   *   checked:true   → 阳性，写症状本身（可带时间、补充描述）
   *   negative:true  → 学生明确点了「阴性」，可以写「无X」
   *   两者都没有     → **未问**，一个字都不写
   *
   * ⚠️ 这是本轮最关键的修复（缺陷1第2条）。旧实现是二态：
   *   `if (v.checked) positives.push(...) else negatives.push(...)`
   * 于是「没勾」被当成「阴性」，空记录直接生成 8 行共 91 个症状的「无X、Y、Z」。
   * 学生根本没过问诊，工具却替他写了 91 个「否认」。这是伪造病历，
   * 《诊断学》第10版要求「客观地、真实地反映病情……避免任何臆断或虚构」。
   *
   * 阴性从哪来？只能是学生在界面上显式点「阴性」（写入 negative:true），
   * 或者用「全部标记为阴性」按钮一次性标记。默认状态是**未问**。
   *
   * @param {object} r record
   * @returns {Array<{key:string,name:string,positives:string[],negatives:string[],asked:boolean}>}
   */
  function collectROS(r) {
    const res = []; // [{ name, positives:[], negatives:[], asked }]
    SCHEMA.ROS.forEach(sys => {
      const store = (r.ros || {})[sys.key] || {};
      const positives = [];
      const negatives = [];
      let asked = false;
      sys.symptoms.forEach(sym => {
        const v = store[sym.key] || {};
        if (v.checked) {
          asked = true;
          let s = sym.label;
          if (v.time) s += v.time;
          if (v.detail) s += '，' + v.detail;
          positives.push(s);
        } else if (v.negative) {
          asked = true;
          negatives.push(sym.label);
        }
        // 既没勾阳性、也没标阴性 = 没问过 → 既不进 positives 也不进 negatives
      });
      res.push({ key: sys.key, name: sys.name, positives, negatives, asked });
    });
    return res;
  }

  /**
   * 生成系统回顾。
   *
   * 逐系统成行，三种情形：
   *   ① 有阳性 → 「呼吸系统：咳嗽3天；无咯血、呼吸困难。」（只否定与阳性不冲突的）
   *   ② 无阳性但学生标过阴性 → 「呼吸系统：无咳嗽、咳痰。」
   *   ③ 整系统一个字没问过 → **整行不输出**（既不写「无」，也不写占位符：
   *      系统回顾 8 个系统全列成「／」会变成 8 行噪音，而这里「不写」
   *      与「问了且阴性」在语义上并不冲突——问诊本来就可以按病情取舍）。
   *
   * @param {object} r record
   * @param {string} mode 'detail' | 'brief'
   * @returns {string}
   */
  function buildROS(r, mode) {
    const data = collectROS(r);
    const allPositives = data.some(d => d.positives.length > 0);
    const anyAsked = data.some(d => d.asked);
    // 简洁模式：没有任何阳性时不再罗列阴性清单，但必须说明是「未问」还是「阴性」，
    // 不能像旧实现那样断言「各系统回顾未见阳性症状」——没问过就无从「未见」。
    if (!allPositives && mode === 'brief') {
      return anyAsked ? '各系统回顾未见阳性症状。' : '';
    }
    const lines = [];
    data.forEach(d => {
      if (d.positives.length) {
        // 去掉与阳性项重复的阴性项（如阳性"头痛，偶有头晕"时不再写"无头晕"）
        const posText = d.positives.join('');
        const negs = d.negatives.filter(n => !posText.includes(n));
        const line = `${d.name}：${d.positives.join('；')}` +
          (negs.length ? `；无${joinList(negs)}` : '') + '。';
        lines.push(line);
      } else if (d.negatives.length && mode !== 'brief') {
        lines.push(`${d.name}：无${joinList(d.negatives)}。`);
      }
      // 没有阳性也没有标记阴性 = 未问 → 该行不出现
    });
    return lines.join('\n');
  }

  /* ---------------------------- 既往史 ---------------------------- */

  /**
   * 既往史。
   *
   * 按模板逐项成行：既往健康状况、疾病史、传染病史、预防接种史、过敏史、
   * 手术史、外伤史、输血史、中毒史、长期用药、与本病相关病史、其它。
   * 分项书写便于带教老师逐条核对，也符合病历书写规范。
   *
   * ⚠️ 本轮改动（缺陷1第1条）：**每一项都固定成行，没填的写「／」。**
   * 旧实现里每个子项都有一个硬编码的默认否定句——「平素体健」「否认高血压、糖尿病、
   * 冠心病等慢性病史」「否认肝炎、结核、伤寒等传染病史」「按计划预防接种」
   * 「否认食物、药物过敏史」「否认手术史」「否认外伤史」「否认输血史」「否认中毒史」
   * 「否认长期用药史」。空记录因此直接产出 10 行「否认」。
   *
   * 这是本项目最严重的问题：学生连问都没问，工具替他向带教老师保证「病人否认」。
   * 《诊断学》第10版：「病历必须客观地、真实地反映病情和诊疗经过，避免任何臆断或虚构」。
   * 现在这些否定句只能来自用户实际输入（textarea 里自己写的字），或者用户点了
   * 界面上明确的「无」选项（如 pmh.allergy === '无'）。
   *
   * @param {object} r record
   * @returns {string}
   */
  function buildPMH(r) {
    const p = r.pmh || {};
    const lines = [];

    // 1) 既往健康状况：填了「良好」写「平素良好」，没填写「／」。
    //    旧实现没填时写「平素体健」，同样是替学生下结论。
    //    学生自己写「既往体健」时不能再冠一次「平素」，否则变成「平素既往体健」。
    const health = stripTail(p.health);
    lines.push(`既往健康状况：${health ? (/^(平素|既往)/.test(health) ? health : `平素${health}`) : PH}`);

    // 2) 疾病史：手写详情优先，其次勾选；都没有就写「／」而不是「否认…」。
    //
    // ⚠️ 缺陷4（已复现）：学生把「高血压3年」填在「与本病无关但仍需治疗的其他疾病」
    // 时，旧实现一边在现病史写「另有高血压3年，需继续治疗」，一边在既往史写
    // 「否认高血压、糖尿病、冠心病等慢性病史」——同一份病历里否定句和肯定句并存。
    // 《诊断学》第10版：「与本次疾病虽无密切关系，但仍需治疗的其他疾病情况，
    // 应在现病史后另起一行描述」——它既然是「已患的病」，就应该并入疾病史，
    // 而不是留在「其它」里与疾病史各行其是。
    const checked = Object.keys(p.diseaseChecks || {}).filter(k => p.diseaseChecks[k] && k !== '其他');
    const other = stripTail(p.diseaseOther);
    const detail = stripTail(p.diseaseDetail);
    const treat = stripTail(p.otherTreatDiseases);
    const known = checked.concat(other ? [other] : []);
    let disease;
    if (detail) disease = detail;
    else if (known.length || treat) {
      // treat 往往带病程（「高血压3年」），勾选项只有病名（「高血压」）。
      // 两者同时存在时保留信息更全的 treat，避免写成「高血压、高血压3年」。
      const rest = treat ? known.filter(k => !treat.includes(k)) : known;
      disease = `既往患${joinList(rest.concat(treat ? [treat] : []))}`;
    } else disease = PH;
    lines.push(`疾病史：${disease}`);

    // 3) 传染病史  4) 预防接种史
    lines.push(`传染病史：${filledOrPH(p.infection)}`);
    lines.push(`预防接种史：${filledOrPH(p.vaccine)}`);

    // 5) 过敏史：
    //    '有' → 按勾选/手写描述组装；
    //    '无' → 学生明确点过「无」，这时写「否认食物、药物过敏史」才是诚实的；
    //    未选 → 「／」，不许替学生否认。
    if (p.allergy === '有') {
      const allergens = Object.keys(p.allergenChecks || {}).filter(k => p.allergenChecks[k] && k !== '其他');
      if (p.allergenOther) allergens.push(p.allergenOther);
      let s = allergens.length ? `${joinList(allergens)}过敏` : '有药物或食物过敏史';
      const reactions = Object.keys(p.allergenReactionChecks || {})
        .filter(k => p.allergenReactionChecks[k] && k !== '其他');
      const reactionText = stripTail(p.allergyReaction);
      if (reactionText) s += `，表现为${reactionText}`;
      else if (reactions.length) s += `，表现为${joinList(reactions)}`;
      lines.push(`过敏史：${s}`);
    } else if (p.allergy === '无') {
      lines.push('过敏史：否认食物、药物过敏史');
    } else {
      lines.push(`过敏史：${PH}`);
    }

    // 6) 手术史  7) 外伤史  8) 输血史  9) 中毒史
    lines.push(`手术史：${filledOrPH(p.surgery)}`);
    lines.push(`外伤史：${filledOrPH(p.trauma)}`);
    lines.push(`输血史：${filledOrPH(p.transfusion)}`);
    lines.push(`中毒史：${filledOrPH(p.poisoning)}`);

    // 10) 长期用药
    lines.push(`长期用药：${filledOrPH(p.longTermMeds)}`);

    // 11) 与本病相关病史：只有这一项是「可选行」——它是补充性质，
    //     不像上面那些是教材规定的固定栏目，没内容时整行不出现不算缺项。
    if (stripTail(p.relatedHistory)) lines.push(`与本病相关病史：${stripTail(p.relatedHistory)}`);

    // 12) 其它（补充说明）
    //     「其他需治疗的疾病」已经并入上面的疾病史（见缺陷4），这里只留补充说明，
    //     否则同一句话会在既往史里出现两遍。
    if (stripTail(p.special)) lines.push(`其它：${stripTail(p.special)}`);

    return lines.join('\n');
  }

  /* ---------------------------- 个人史 ---------------------------- */

  /**
   * 个人史。
   *
   * ⚠️ 本轮改动（缺陷1 + 缺陷4）：
   *   1) 吸烟/饮酒：schema 默认值已清空（原来默认 '无'，空记录凭空输出「吸烟史：无」）。
   *      现在只有用户点了「无 / 有 / 已戒」才成行，没选就写「／」。
   *   2) 毒物接触史：旧实现没填时硬写「否认毒物、粉尘及放射性物质接触史」→ 改「／」。
   *      同理，学生没问就别替他否认。
   *   3) 新增两项教材点名要求、此前全项目缺失的栏目：冶游史、职业与工作条件。
   *      《诊断学》第10版 个人史：「记录出生地及长期居留地，生活习惯及有无烟、酒、
   *      药物等嗜好，职业与工作条件及有无工业毒物、粉尘、放射性物质接触史，有无冶游史。」
   *
   * 母孕史/出生史/喂养史/生长发育史/疫区接触史属于补充栏目，没内容整行不出现。
   */
  function buildPersonal(r) {
    const p = r.personal || {};
    const seg = [];
    // 母孕史 / 出生史 / 喂养史 / 生长发育史：儿科病历必写，成人可留空。
    // 只写真的填了内容的项——成人留空时这几行不出现，不会在病历里留下
    // 一串「母孕史：／」（那对成人病历毫无意义）。
    if (stripTail(p.maternal)) seg.push(`母孕史：${stripTail(p.maternal)}`);
    if (stripTail(p.birth)) seg.push(`出生史：${stripTail(p.birth)}`);
    if (stripTail(p.feeding)) seg.push(`喂养史：${stripTail(p.feeding)}`);
    if (stripTail(p.growth)) seg.push(`生长发育史：${stripTail(p.growth)}`);
    // 籍贯已在一般项目，个人史这里只写居住情况
    if (stripTail(p.residence) && !/^久居/.test(stripTail(p.residence))) {
      seg.push(`居住史：久居${stripTail(p.residence)}`);
    } else if (stripTail(p.residence)) {
      seg.push(`居住史：${stripTail(p.residence)}`);
    }
    if (stripTail(p.travel)) seg.push(`疫区接触史：近期${stripTail(p.travel)}`);
    // 吸烟：三态都可能来自用户选择；没选（''）写占位符，不能默认成「无」。
    // 旧代码 `else if (p.smoking === '无' || p.smoking)` 会把任何回答（含空串以外的杂值）
    // 一律写成「无」，本次收紧成严格三态。
    //
    // 缺陷M4（已复现）：旧版 schema 里 smoking 是**自由文本**，老存档里存的是
    // 「吸烟20年，每日10支」这种整句。严格三态只看 '有/已戒/无'，这类老数据全都落到
    // else 分支，变成「吸烟史：／」——用户亲手写的内容被静默丢弃。
    // 现在：认出枚举值（含「吸烟/不吸烟/已戒烟」这类同义写法）就按三态写，
    // 认不出的非空值一律当自由文本原样保留（原话里已经有「吸烟」字样就不再冠项目名，
    // 避免写成「吸烟史：吸烟20年」）。
    const smoke = stripTail(p.smoking);
    if (smoke === '有' || smoke === '吸烟') {
      seg.push(`吸烟史：有${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (smoke === '已戒' || smoke === '已戒烟' || smoke === '戒烟') {
      seg.push(`吸烟史：已戒烟${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (smoke === '无' || smoke === '不吸烟') {
      seg.push('吸烟史：无');
    } else if (smoke) {
      seg.push(/吸烟|抽烟|戒烟|香烟|烟草/.test(smoke) ? smoke : `吸烟史：${smoke}`);
    } else {
      seg.push(`吸烟史：${PH}`);
    }
    const drink = stripTail(p.drinking);
    if (drink === '有' || drink === '饮酒') {
      seg.push(`饮酒史：有${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (drink === '已戒' || drink === '已戒酒' || drink === '戒酒') {
      seg.push(`饮酒史：已戒酒${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (drink === '无' || drink === '不饮酒') {
      seg.push('饮酒史：无');
    } else if (drink) {
      seg.push(/饮酒|喝酒|酗酒|戒酒|白酒|啤酒|黄酒|红酒/.test(drink) ? drink : `饮酒史：${drink}`);
    } else {
      seg.push(`饮酒史：${PH}`);
    }
    // 职业与工作条件（教材点名要求，此前字段缺失）
    seg.push(`职业与工作条件：${filledOrPH(p.occupationEnv)}`);
    // 冶游史（教材点名要求，此前全项目 grep 零命中）
    seg.push(`冶游史：${filledOrPH(p.sexualHistory)}`);
    seg.push(`毒物接触史：${filledOrPH(p.drugs)}`);
    if (stripTail(p.environment)) seg.push(stripTail(p.environment));
    if (stripTail(p.habits)) seg.push(stripTail(p.habits));
    return seg.join('\n');
  }

  /* ---------------------------- 婚育史（婚、月经、生育合并） ---------------------------- */

  function buildMarriage(r) {
    const m = r.marriage || {};
    const b = r.basic || {};
    if (m.status === '未婚') return '未婚。';
    let s = m.status || b.marital || '';
    if (!s) return '';
    if (m.age) s += `，${m.age}岁结婚`;
    if (m.spouseHealth) s += `，${stripTail(m.spouseHealth)}`;
    appendMarriageExtra(m, part => { s += `，${part}`; });
    return s + '。';
  }

  /**
   * 婚姻史里教材点名、但容易漏采的两项：性生活情况、夫妻关系。
   *
   * 《诊断学》第10版 第六篇·病历书写：「婚姻史包括婚姻状况，结婚年龄，
   * 配偶健康状况、性生活情况、夫妻关系等。」这两项属于隐私，用户不填就不出现，
   * 绝不代填、绝不默认成「正常」——问没问只有填的人知道。
   */
  function appendMarriageExtra(m, push) {
    // 用户可能只写值（「正常」），也可能写整句（「性生活正常，夫妻关系和睦」）。
    // 已经有标签的就不再重复加，避免出现「性生活性生活正常」。
    const withLabel = (label, raw) => {
      const v = stripTail(raw);
      if (!v) return '';
      return v.startsWith(label) ? v : label + v;
    };
    const sex = withLabel('性生活', m.sexLife);
    if (sex) push(sex);
    const rel = withLabel('夫妻关系', m.relation);
    if (rel) push(rel);
  }

  /**
   * 婚姻史（模板里与月经生育史分开成两节）。
   * 儿科/未婚者写「无」即可。
   */
  function buildMarriageHistory(r) {
    const m = r.marriage || {};
    const b = r.basic || {};
    // 婚姻状况只有一个真相：婚姻史页填了就以它为准（会写详细情况），
    // 没填则回退到一般项目。两处默认值不同时打架，避免同一份病历自相矛盾。
    const status = m.status || b.marital || '';
    // ⚠️ 已修（用户报「填了却写不进病历」）：这一行原来是 `if (!status) return ''`，
    // 于是只填了结婚年龄/配偶健康/性生活/夫妻关系、忘了点婚姻状况下拉框时，
    // 整节婚姻史直接消失——用户填的每一个字都被吃掉，还查不出原因。
    // 婚姻状况是「叙述的开头」，不是「这一节是否成立」的前提：只要还有一个字段
    // 有内容，就该把它写出来，缺开头就从句中事实写起（「配偶体健」而不是「已婚，配偶体健」）。
    if (status === '未婚') return '未婚。';
    // 用数组拼再用「，」连，而不是一路 `s += '，' + x`：没有婚姻状况打头时，
    // 前者会拼出「，配偶体健」这种以逗号开头的残句，后者天然没有这个问题。
    const seg = [];
    if (status) seg.push(status);
    if (m.age) seg.push(`${m.age}岁结婚`);
    // 学生常直接写「配偶体健」，再冠一次「配偶」就成了「配偶配偶体健」。
    if (m.spouseHealth) {
      const sp = stripTail(m.spouseHealth);
      seg.push(/^配偶/.test(sp) ? sp : `配偶${sp}`);
    }
    appendMarriageExtra(m, part => { seg.push(part); });
    if (!seg.length) return '';
    return seg.join('，') + '。';
  }

  /** 月经与生育史（模板里的独立一节） */
  function buildMenstruationChildbirth(r) {
    const parts = [];
    // 以前这里把「月经史：」「生育史：」两个标签剥掉再用逗号连成一句，
    // 结果是「初潮14岁，周期28天，1-0-0-1，顺产1子体健。」
    // —— 学生填的「子女情况」确实写进去了，但混在月经史一串数字后面，
    // 没人看得出那句是生育史。用户报的「填了没写进病历」就是这个观感造成的。
    // 现在两个标签都留着，各写各的；这一节的标题本来就是【月经与生育史】，
    // 里面再分「月经史：…」「生育史：…」正好对上教材和医院模板的写法。
    const men = buildMenstruation(r);
    if (men) parts.push(men);
    const cb = buildChildbirth(r);
    if (cb) parts.push(cb);
    if (!parts.length) {
      // ⚠️ 缺陷2：旧实现在这里返回「无。」（男性）或空串（女性）。
      // 「无。」既不是用户写的内容，也不构成任何有效信息（男性本来就没有月经史，
      // 生育史却可能实打实存在），属于典型的凭空成文；空串则让整节消失。
      // 现在统一返回占位符，由 generate 拼成「【月经与生育史】／」。
      return PH;
    }
    return parts.join('\n');
  }

  /**
   * 兼容旧调用：婚姻 + 月经 + 生育合成一段。
   *
   * 只被导出给旧调用方 / 测试用，正文里两节是分开写的。
   * 注意占位符：buildMenstruationChildbirth 现在无内容时返回「／」，
   * 不能再给它补句号拼成「未婚，／。」这种怪句子。
   *
   * 另外，月经史和生育史现在各带标签、各占一行，不能再拿「，」往婚姻史后面接，
   * 否则会拼出「已婚，25岁结婚，月经史：初潮14岁，…」这样一整句的长串，
   * 而下一行又冒出「生育史：」——读起来像排版坏了。
   */
  function buildMarriageChildbirth(r) {
    const lines = [];
    const mar = buildMarriageHistory(r);
    if (mar) lines.push(mar);
    const mc = buildMenstruationChildbirth(r);
    if (mc && mc !== PH) lines.push(mc);
    if (!lines.length) return PH;
    return lines.join('\n');
  }

  /**
   * 月经史。
   *
   * ⚠️ 本轮改动（缺陷5）：
   *   1) 新增月经量以外的三个教材点名项：颜色、有无血块、白带。
   *      《诊断学》第10版：「并记录月经量、颜色，有无血块、痛经、白带等情况。」
   *   2) 旧实现里 `else if (m.dysmenorrhea === '无') parts.push('无痛经')` 之所以会
   *      凭空冒出「无痛经」，是因为 schema 的默认值就是 '无'——用户根本没回答过。
   *      现在 schema 默认改成空串，只有用户真的点了「有/无」才写。
   *   3) 完全没填时返回空串，由上层（generate）补「／」占位，不再凭空一句「无痛经。」
   */
  function buildMenstruation(r) {
    const m = r.menstruation || {};
    const b = r.basic || {};
    if (b.gender !== '女') return '';
    if (m.applicable === '无') {
      return /绝经|停经/.test(m.extra || '') ? `${stripTail(m.extra)}。` : '已绝经。';
    }
    const parts = [];
    if (m.age) parts.push(`初潮${m.age}岁`);
    if (m.cycle) parts.push(`周期${m.cycle}天`);
    if (m.duration) parts.push(`经期${m.duration}天`);
    if (m.quantity) parts.push(`经量${m.quantity}`);
    // 颜色 / 血块 / 白带：教材点名要求，有填才写（缺陷5第1、2条）
    if (stripTail(m.color)) parts.push(`经血${stripTail(m.color)}`);
    if (stripTail(m.clot)) parts.push(`血块：${stripTail(m.clot)}`);
    // 痛经：三态。没回答过（空串）一个字都不写，绝不默认「无痛经」。
    if (m.dysmenorrhea === '有') parts.push('有痛经');
    else if (m.dysmenorrhea === '无') parts.push('无痛经');
    if (stripTail(m.leukorrhea)) parts.push(`白带：${stripTail(m.leukorrhea)}`);
    if (m.menopauseAge) parts.push(`${m.menopauseAge}岁绝经`);
    if (m.lmp) parts.push(`末次月经${m.lmp}`);
    if (m.extra) parts.push(stripTail(m.extra));
    if (!parts.length) return '';
    return '月经史：' + parts.join('，') + '。';
  }

  function buildChildbirth(r) {
    const c = r.childbirth || {};
    const b = r.basic || {};
    // 缺陷M1（已复现）：男性记录里残留着 childbirth 数据（旧存档、切换性别、误填）时，
    // 旧实现照样输出「生育史：2-0-0-2。」——男性没有生育史，这是凭空成文。
    //
    // ⚠️ 已修（用户报「子女情况填了却写不进病历」）：原来的第一行是
    //   `if (b.gender !== '女') return '';`
    // 一刀切掉了男性。可是男性患者的「子女数」「子女健康状况」确实要问、要写
    // （《诊断学》第10版 第六篇：婚姻史一节的「配偶健康状况」之外，
    //   男性生育史就是记子女情况）。于是男生在这两个框里填的字被整段吞掉，
    // 界面上却照样显示「已填」——学生永远发现不了。
    // 现在按性别分两条路：女性走四项式/孕产次，男性只写子女情况。
    // 性别还没选（空串）时仍不写：猜错性别比留空更糟。
    if (!b.gender) return '';

    if (b.gender !== '女') {
      const mp = [];
      // 男性界面把「子女数」存进 gravida（历史字段复用），这里按「人」来写，
      // 绝不能走女性的「孕X产Y」——那会把父亲写成产妇。
      if (String(c.gravida || '').trim()) mp.push(`育有子女${String(c.gravida).trim()}人`);
      if (stripTail(c.details)) mp.push(stripTail(c.details));
      if (!mp.length) return '';
      return '生育史：' + mp.join('，') + '。';
    }

    const parts = [];
    // 教材《诊断学》第10版 第六篇·病历书写：
    //   「生育史按下列顺序写明：足月分娩数-早产数-流产或人流数-存活数，并记录避孕措施。」
    // 为什么触发条件不含 abortion：abortion 这个键同时属于旧写法（孕X产Y，流产Z次）
    // 和四项式（第三位），它在旧存档里几乎必然有值。若让它触发四项式，
    // 一份只有「孕2产1，流产1次」的老病历会被改写成「0-0-1-0」，信息反而丢了。
    // 所以只由 fullTerm/premature/alive 这三个「新字段」触发，它们的出现即代表用户在用四项式。
    const triggers = ['fullTerm', 'premature', 'alive'];
    const hasQuad = triggers.some(k => String(c[k] || '').trim() !== '');
    if (hasQuad) {
      const n = k => String(c[k] || '').trim() || '0';
      parts.push(`${n('fullTerm')}-${n('premature')}-${n('abortion')}-${n('alive')}`);
    } else if (c.gravida) {
      // 旧存档兼容：没填四项式时仍按「孕X产Y」写，不能因为升级把已有内容丢了。
      parts.push(`孕${c.gravida}产${c.para || '0'}`);
      if (c.abortion) parts.push(`流产${c.abortion}次`);
    }
    if (c.details) parts.push(stripTail(c.details));
    if (c.lastBirth) parts.push(`末次分娩${stripTail(c.lastBirth)}`);
    if (c.contraception) parts.push(`避孕措施：${stripTail(c.contraception)}`);
    if (!parts.length) {
      if (c.applicable === '无') return '无生育史。';
      return '';
    }
    return '生育史：' + parts.join('，') + '。';
  }

  /* ---------------------------- 家族史 ---------------------------- */

  /**
   * 家族史一行：**保留项目名**。
   *
   * 缺陷H2（已复现）：三项都填「无」时，旧实现直接输出 `seg.push(infect)`，
   * 家庭史变成「无。无。无。」——考官看不出这三个「无」分别回答的是哪一问，
   * 得分点（类似疾病史、传染性疾病史、两系三代遗传性疾病史）在纸面上全部消失。
   * 按「所有表格项都应详细填写，无内容者画"/"或"—"」的同一条原则，项目名必须留。
   *
   * 唯一例外：用户原话里已经带着这一项的名字（「家族中无类似疾病患者」），
   * 再冠一次会写成「家族中类似疾病史：家族中无类似疾病患者」，读起来像机器拼接；
   * 此时项目名本来就在，原样输出即可。
   *
   * @param {string} label 项目名（教材原词）
   * @param {RegExp} already 用户原话里已含项目名时的识别正则
   * @param {string} value 用户填的内容
   * @returns {string}
   */
  function familyLine(label, already, value) {
    const v = stripTail(value);
    if (!v) return `${label}：／`;
    return already.test(v) ? v : `${label}：${v}`;
  }

  /**
   * 家族史。
   *
   * 评分表第2页家族史 5 分 = 「与本病相似的病情」2.5 + 「两系三代遗传性疾病史」2.5。
   * 这两项都单列，所以默认句必须是两句，不能再用一句「家族中无类似疾病患者」糊过去。
   */
  function buildFamily(r) {
    const f = r.family || {};
    const checked = Object.keys(f.diseaseChecks || {}).filter(k => f.diseaseChecks[k]);
    const seg = [];
    const deceased = stripTail(f.deceased);
    // 健康状况（含已故亲属的死因与年龄）单独成句。
    // 它非空时下面的「类似疾病史」占位句会被抑制（见缺陷3的注释）。
    if (deceased) seg.push(deceased);

    // ① 与本病相似的病情（手写优先，勾选兜底）
    //
    // ⚠️ 缺陷3（已复现）：用户在「父母、兄弟姐妹健康状况」里写了
    // 「父亲因胃癌去世，65岁」，旧实现紧接着输出「家族中无类似疾病患者」——
    // 上一句是胃癌家族史、下一句否认家族类似疾病，同一段里自相矛盾。
    // 《诊断学》第10版 家族史：「父母、兄弟、姐妹及子女的健康情况，有无与病人
    // 类似的疾病。如已死亡，应记录死亡原因及年龄。」——「健康状况」这一栏
    // 本身就已经回答了「有无类似疾病」，它填了就不该再补一句否定。
    const similar = stripTail(f.similarDisease);
    if (similar) seg.push(familyLine('家族中类似疾病史', /类似疾病|相似疾病/, similar));
    else if (checked.length) seg.push(`家族中${joinList(checked)}病史`);
    // 只有健康状况一栏是空的，才需要单独写「类似疾病」这一栏。
    // 没填时不写「家族中无类似疾病患者」——那是替病人否定，属臆断/虚构
    // （《诊断学》第10版：「病历必须客观地、真实地反映病情……避免任何臆断或虚构」；
    // 「无内容者画"/"或"—"」）。改为占位符，但保留「类似疾病」四个字，
    // 让考官看到这一栏被问过（评分表第2页的得分点正是「与本病相似的病情」）。
    else if (!deceased) seg.push('家族中类似疾病史：／');

    // ② 家族传染病史。《诊断学》第10版原文：
    //    「家族中有无结核、肝炎、性病等传染性疾病」——这与遗传病是两个独立问题。
    //    用户不填时旧实现写「家族中否认结核、肝炎、性病等传染性疾病史」，
    //    同样是替病人否定；改为占位符，但保留「结核、肝炎、性病等传染性疾病」
    //    这段教材原文，因为考官就是按这句找得分点。
    const infect = stripTail(f.infectionHistory);
    seg.push(infect
      ? familyLine('家族中结核、肝炎、性病等传染性疾病史', /传染性疾病|传染病史/, infect)
      : '家族中结核、肝炎、性病等传染性疾病史：／');

    // ③ 两系三代遗传性疾病史（手写优先；未填给占位符，
    //    但「两系三代」字样必须出现——评分表第2页 2.5 分就看这四个字）
    const three = stripTail(f.threeGeneration);
    seg.push(three
      ? familyLine('两系三代遗传性疾病史', /遗传性疾病|遗传病|两系三代/, three)
      : '两系三代遗传性疾病史：／');

    if (stripTail(f.other)) seg.push(stripTail(f.other));
    return joinSentences(seg);
  }

  /* ---------------------------- 体格检查 ---------------------------- */

  function vitalValue(v) {
    return v === undefined || v === null || v === '' ? '' : String(v).trim();
  }

  /**
   * 生命体征行。
   *
   * ⚠️ 本轮改动（缺陷2第4条）：旧实现「有一项才输出一行」，空记录时整行不存在，
   * 于是体格检查直接从「一般状况：…」开始，缺了教材要求的首行。
   * 《诊断学》第10版 体格检查书写顺序第一行就是
   * 「体温 ℃ 脉搏 次/分 呼吸 次/分 血压 /mmHg 身高 cm 体重 kg」。
   * 现在这 6 项固定成行，没填的写「／」占位，项目名与单位都保留。
   * 头围/胸围/腹围是儿科与腹部专科的补充项，没填时不出现在这一行里（不做占位，避免噪音）。
   */
  function buildVitals(r) {
    const v = (r.pe || {}).vitals || {};
    // 缺项统一写成「／」，与一般项目、既往史的占位符保持同一个字符（全角斜杠）。
    const val = k => vitalValue(v[k]) || PH;
    /**
     * 写进病历的数字要再过一道可信范围。
     *
     * 输入框已经会标红，但那只是视觉提示——学生一路点下去，`T -5℃`、`T 999999999℃`
     * 照样会进病历正文，打印出来就是硬伤。这里在生成侧再挡一次：
     * 明显不是人体数据的值按「未填」处理（写成「／」），validate() 里会同步说明
     * 哪个数被跳过了、为什么。
     *
     * 为什么不直接改正：不知道学生想填 37.5 还是 375，猜就是编造。
     * 为什么不原样保留：一个不可能的数字比一个空格更有害——空格学生自己会补，
     * 离谱的数字他多半看不见。
     */
    const safe = k => {
      const raw = vitalValue(v[k]);
      if (!raw) return PH;
      const rng = VITAL_RANGE[k];
      if (!rng) return raw;
      if (!/^-?\d+(\.\d+)?$/.test(raw)) return PH;   // 不是数字，写了也是错
      const n = Number(raw);
      return n >= rng[0] && n <= rng[1] ? raw : PH;
    };
    const parts = [
      `T ${safe('temperature')}℃`,
      `P ${safe('pulse')}次/分`,
      `R ${safe('respiration')}次/分`,
      // 血压中间用半角 / 分隔收缩压与舒张压，这是病历书写惯例；
      // 未填时两侧都是「／」，呈现为「BP ／/／mmHg」。
      `BP ${safe('sbp')}/${safe('dbp')}mmHg`,
      `身高 ${safe('height')}cm`,
      `体重 ${safe('weight')}kg`
    ];
    // 头围/胸围/腹围没填时整项不出现（不做占位，避免噪音）；
    // 填了但超出可信范围时也当没填——否则会输出「头围 ／cm」这种半截。
    if (vitalValue(v.headCirc) && safe('headCirc') !== PH) parts.push(`头围 ${safe('headCirc')}cm`);
    if (vitalValue(v.chestCirc) && safe('chestCirc') !== PH) parts.push(`胸围 ${safe('chestCirc')}cm`);
    if (vitalValue(v.abdCirc) && safe('abdCirc') !== PH) parts.push(`腹围 ${safe('abdCirc')}cm`);
    return parts.join('，') + '。';
  }

  /**
   * 某个查体条目的当前值：用户填的优先，否则用默认。
   *
   * 注意：这个函数**不管勾没勾**。勾选过滤在 peEntries()/buildPE() 里做，
   * 因为 hints 需要用「原值」判断阳性体征（没勾的项不算阳性，见 hints.js）。
   */
  function peValue(r, groupKey, item) {
    const g = ((r.pe || {})[groupKey]) || {};
    const raw = g[item.key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      const d = (r.peDefaults || {})[groupKey] || {};
      return d[item.key] || item.default || '';
    }
    return String(raw).trim();
  }

  /**
   * 一组查体里，哪些条目应该参与输出。
   *
   *  1) 没勾选的项一律不参与（勾选制：没查的不能写成正常，见 SCHEMA.peChecked）；
   *  2) 勾了但没写具体所见 → 补该项的规范正常描述（peNormalText）；
   *  3) abdomen.abdPalpation 这类「父项 + 子项」结构：子项一旦被填写，父项必须让位，
   *     否则病历里会同时出现「全腹无压痛」和「右下腹浅触诊压痛」两种互相打架的描述。
   *     这里统一用 schema 导出的 parentSupersededByChild 判断，不在 generator 里
   *     再散落一套自己的规则。
   *
   * @returns {Array<{item:object, value:string}>} 只保留有值（要输出）的条目
   */
  function peEntries(r, groupKey, items) {
    const store = (r.pe || {})[groupKey] || {};
    return items
      // 没勾 = 这一次没查，不能出现在病历里
      .filter(it => SCHEMA.peChecked(r, groupKey, it.key))
      // 父项被已填写的子项接管时，整项跳过
      .filter(it => !(SCHEMA.childPEItems(groupKey, it.key).length &&
        SCHEMA.parentSupersededByChild(store, groupKey, it.key)))
      .map(it => {
        const own = stripTail(peValue(r, groupKey, it));
        // 勾了却没写所见 → 用规范正常描述兜底；连正常描述都没有就跳过
        const value = own || stripTail(SCHEMA.peNormalText(it));
        return { item: it, value };
      })
      .filter(e => e.value);
  }

  /**
   * 把一组的查体条目渲染成「大节 + 小节」的格式，贴近纸质病历的写法：
   *
   *   胸部：胸廓对称，无畸形。乳房两侧对称。
   *   肺：
   *   　视诊：…
   *   　听诊：…
   *   心脏：
   *   　视诊：…
   *
   * 分块依据完全来自 schema 里的 item.label（形如「肺—视诊」），
   * 以及「视诊/触诊/叩诊/听诊」这类模态词。生成器不额外维护一套映射表。
   */
  function renderPEGroup(group, entries) {
    const DASH = /^(.+?)—(.+)$/;
    const MODALITY = /^(视诊|触诊|叩诊|听诊|嗅诊)$/;
    const blocked = [];
    const plain = [];
    entries.forEach(e => {
      const label = e.item.label || '';
      const m = DASH.exec(label);
      if (m) blocked.push({ block: m[1], label: m[2], value: e.value });
      else if (MODALITY.test(label)) blocked.push({ block: label, label: '', value: e.value });
      else plain.push(e.value);
    });

    if (!blocked.length) {
      const texts = dedupeTexts(plain);
      // 一般状况这类组在教材里是**一整句逗号连写**（组上带 joinWith: '，'），
      // 其余组仍是句号分隔。分隔符由 schema 决定，这里不写死组名。
      const glue = group.joinWith || '。';
      return [`${group.name}：${texts.join(glue)}。`];
    }

    const lines = [];
    if (plain.length) lines.push(`${group.name}：${dedupeTexts(plain).join('。')}。`);
    else lines.push(`${group.name}：`);

    let last = null;
    blocked.forEach(b => {
      const isNew = b.block !== last;
      if (isNew) {
        last = b.block;
        if (b.label) {
          // 新块且带子标签：「　肺：」单独一行，再写第一个子项的值
          lines.push(`　${b.block}：`);
          lines.push(`　　${b.label}：${b.value}`);
        } else {
          // 模态词本身就是子标签：「　视诊：腹部平坦…」
          lines.push(`　${b.block}：${b.value}`);
        }
      } else if (b.label) {
        lines.push(`\u3000\u3000${b.label}：${b.value}`);
      } else {
        lines.push(`　${b.value}`);
      }
    });
    return lines;
  }

  /**
   * 生成体格检查。
   *
   * 输出顺序 = SCHEMA.PE_COMMON 里 items 的数组顺序，
   * 因此腹部天然就是「视诊 → 听诊 → 叩诊 → 触诊」（评分表第3页要求）。
   * 生成逻辑不要在这里重排，次序的唯一真相在 schema。
   */
  function buildPE(r) {
    const deptKey = (r.basic || {}).department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    const out = [];
    const vit = buildVitals(r);
    if (vit) out.push(vit);

    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      if (!items.length) return;
      const entries = peEntries(r, group.key, items);
      if (!entries.length) return;
      renderPEGroup(group, entries).forEach(line => out.push(line));
    });

    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      const storeKey = 'special_' + spKey;
      // 勾选制：只写这次真查过的项；一个都没勾就整段不出现
      const store = (r.pe || {})[storeKey] || {};
      const checkedItems = sp.items.filter(it => SCHEMA.peChecked(r, storeKey, it.key));
      // 汇总项让位：
      // 专科清单里有一批历史遗留的汇总项（respExtra / gynExtra1 之类），内容已被后来的
      // 明细项完整覆盖。学生点「全选」时两边都会写，同一句话出现两遍。
      // 判据三条全满足才跳过：①声明了 summaryOf ②它列的明细项全都勾了 ③它自己没被改写。
      // 第三条是底线：学生亲手填的字，一个字都不许因为「去重」丢掉。
      const keepItems = checkedItems.filter(it => {
        const subs = it.summaryOf;
        if (!Array.isArray(subs) || !subs.length) return true;
        if (String(store[it.key] || '').trim()) return true;
        return !subs.every(k => SCHEMA.peChecked(r, storeKey, k));
      });
      const vals = keepItems
        .map(it => stripTail(peValue(r, storeKey, it)) || stripTail(SCHEMA.peNormalText(it)));
      // 教材「前面体格检查中的相应项目不必重复书写」：
      // 通用查体已写过的就别再写一遍。
      //
      // 按**整项**比对，不按分句删——
      // 分句级删除会留下缺主语的残句：「子宫前倾前屈，正常大小，质中，活动度好，无压痛」
      // 前半句被通用查体占掉后，剩下的「质中，活动度好」单独成句，读病历的人根本不知道
      // 说的是子宫。残句比重复严重得多：重复只是啰嗦，残句是信息损坏。
      //
      // 判据：这一项的所有分句都已在前面出现过（含本科室前面几项），整项跳过；
      // 只要还有一个新分句，就整项照写——宁可重复半个分句，也不切出残句。
      const seen = out.join('\n');
      const acc = [seen];
      const own = [];
      vals.forEach(v => {
        const allSeen = splitClauses(v).every(c => acc.some(s => s.includes(c)));
        if (allSeen) return;
        own.push(v);
        acc.push(v);
      });
      if (!own.length) {
        // 勾了，但这一科每一项的每个分句都已经在通用查体里写过一遍。
        // 教材对这种情形的处理办法是明写的：「只写见××科情况」。
        // 静默什么都不写会让学生以为勾选没生效，给一句指向比空着好。
        if (checkedItems.length) out.push(`${sp.name}：见前述体格检查。`);
        return;
      }
      out.push(`${sp.name}：${own.join('。')}。`);
    });

    const focus = buildFocusPE(r);
    if (focus) out.push(focus);
    return out.join('\n');
  }

  /** 去掉完全重复的条目（如「外生殖器」与「肛门」都写「未见异常」） */
  function dedupeTexts(texts) {
    return texts.filter((t, i) => t && texts.indexOf(t) === i);
  }

  /** 把一段查体描述切成最小分句，用于判断「这句是不是已经在别处写过了」。 */
  function splitClauses(text) {
    return String(text || '').split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
  }

  /**
   * 按**分句**去重（缺陷H1，已复现）。
   *
   * 通用腹部触诊写「上腹部压痛」，消化专科查体 giTenderness 也写「上腹部压痛」，
   * 摘要就成了「查体：上腹部压痛，上腹部压痛」，诊断依据里同样重复一遍。
   * abnormalPE 按条目返回，条目内部的 `text` 已经是分句拼接的结果，跨条目重复它看不见。
   *
   * 只在**拼摘要/诊断依据字符串时**按分句去重，不动 abnormalPE 的返回结构
   * （buildPE 里必须按整项判重，见那里的注释：分句级删除会留下缺主语的残句）。
   * 这里拼出来的是逗号罗列的体征清单，分句本身就是完整短语，切碎不会产生残句。
   *
   * @param {string[]} list 若干段查体描述
   * @returns {string[]} 分句数组（顺序按首次出现，已归一化去重）
   */
  function dedupeClauses(list) {
    const seen = [];
    const out = [];
    (list || []).forEach(t => {
      splitClauses(t).forEach(c => {
        const key = squash(c);
        if (!key || seen.includes(key)) return;
        seen.push(key);
        out.push(c);
      });
    });
    return out;
  }

  /**
   * 这次到底查没查体（缺陷B2/B3 的判据）。
   *
   * 摘要与首次病程录 O 段原来无条件写「查体未见明显阳性体征」/「未见与诊断相关的
   * 阳性体征」——空记录、只填主诉时也是如此，等于替学生宣布查体阴性。学生一个查体
   * 项都没勾，这两句话就是《诊断学》第10版禁止的「臆断或虚构」。
   *
   * 判据（与 schema 的勾选制一致）：`r.pe` 下除 `vitals`（生命体征另算）、`checked`
   * 之外的任何一组里，只要有任何一个**非空/真值**（用户勾了并落了值，或者专科项
   * 写了字），就算查过体；`pe.checked` 里任一项为 true 也算。
   *
   * @param {object} r record
   * @returns {boolean}
   */
  function anyPEExamined(r) {
    const pe = (r || {}).pe || {};
    const examined = Object.keys(pe)
      .filter(k => k !== 'vitals' && k !== 'checked')
      .some(k => {
        const g = pe[k];
        if (!g || typeof g !== 'object') return false;
        return Object.keys(g).some(itemKey => {
          const v = g[itemKey];
          if (v === true) return true;
          if (v === false || v === undefined || v === null) return false;
          return String(v).trim() !== '';
        });
      });
    if (examined) return true;
    const ck = pe.checked || {};
    return Object.keys(ck).some(g => {
      const row = ck[g];
      return !!row && typeof row === 'object' &&
        Object.keys(row).some(itemKey => row[itemKey] === true);
    });
  }

  /**
   * 重点查体（评分表第4页 15 分）。
   * focusPE.keys 存 '组.key' 引用；普通查体形如 'chest.lungAuscultation'，
   * 专科查体形如 'special_respiratory.respExtra'。note 是补充说明。
   * 留空时整段不输出，不会在病历里留一个空标题。
   */
  function buildFocusPE(r) {
    const f = r.focusPE || {};
    const parts = [];
    (f.keys || []).forEach(ref => {
      const text = String(ref || '');
      const dot = text.indexOf('.');
      if (dot <= 0) return;
      const groupKey = text.slice(0, dot);
      const itemKey = text.slice(dot + 1);
      let item = null;
      let groupName = '';
      if (groupKey.startsWith('special_')) {
        const sp = SCHEMA.PE_SPECIAL[groupKey.slice('special_'.length)];
        if (!sp) return;
        item = (sp.items || []).find(it => it.key === itemKey) || null;
        groupName = sp.name;
      } else {
        const group = SCHEMA.PE_COMMON.find(g => g.key === groupKey);
        if (!group) return;
        item = group.items.find(it => it.key === itemKey) || null;
        groupName = group.name;
      }
      if (!item) return;

      // 父项已被子项接管时跳过：否则重点查体会输出父项的默认"全腹无压痛、反跳痛"，
      // 而同一次查体里又写着"右下腹浅触诊压痛"，同一份病历自相矛盾。
      const store = (r.pe || {})[groupKey] || {};
      if (!groupKey.startsWith('special_') &&
        typeof SCHEMA.parentSupersededByChild === 'function' &&
        SCHEMA.parentSupersededByChild(store, groupKey, itemKey)) {
        return;
      }

      // 只写用户真正填过的项，默认值不写进"重点查体"（否则等于把没查的也列成重点）；
      // 同时必须是通过勾选的项——把没勾（这次没查）的项列进重点查体是自相矛盾的。
      // app.js 在「加入重点查体」时会自动置为已勾，所以正常流程不会互相打架。
      if (!SCHEMA.peChecked(r, groupKey, itemKey)) return;
      const filled = typeof SCHEMA.peItemFilled === 'function'
        ? SCHEMA.peItemFilled(store, item)
        : !!String(store[itemKey] || '').trim();
      const val = stripTail(peValue(r, groupKey, item));
      if (!filled || !val) return;
      parts.push(`${groupName}：${item.label}${val}`);
    });
    const note = stripTail(f.note);
    if (!parts.length && !note) return '';
    const body = parts.length ? parts.join('；') + '。' : '';
    return `重点查体：${body}${note ? ensureSentence(note) : ''}`;
  }

  /**
   * 返回与默认值不同的异常体征列表（用于摘要与 SOAP 的 O 段）。
   *
   * 三条判定规则：
   *   1) 用户没改过的（等于 default 或旧的 legacyDefault）不算阳性——t2 重写了
   *      腹部四项默认文案，旧存档里存的是旧文案，只认 default 会把它误判成阳性；
   *   2) 被填写的子项接管的父项不再参与，避免同一条体征重复出现；
   *   3) 只挑真正阳性的短句：逐句拆分后剔除「无…/未见…」等否定句。
   */
  function abnormalPE(r) {
    const deptKey = (r.basic || {}).department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    const res = [];

    // 摘要只取真正的阳性描述。
    //
    // 判定策略：**默认认为是阳性**，只排除能明确认出是阴性的短句。
    //
    // 为什么不用「白名单异常词」：schema 里内置了上百个异常描述（急性病容、
    // 颈静脉怒张、桶状胸、杵状指、肠鸣音活跃……），白名单永远列不全，
    // 漏一个就是摘要丢一个阳性体征，比误报更危险。默认阳性 + 精确排除更稳。
    //
    // 几个必须小心的地方（都是实测踩过的坑）：
    //   1) 顿号必须切开：「右下腹压痛、无反跳痛」里前半是阳性，
    //      不切就会被后半的「无」整句吞掉。
    //   2) 「未闻及」不能一律当否定：未闻及胎心/呼吸音/心音/肠鸣音是阳性体征。
    //   3) 「无痛性包块」的「无」是否定「痛」，不是否定「包块」。
    //   4) 否定词可能在名词之后：肝脾未及、Murphy征阴性。
    const POSITIVE_OVERRIDE = /未(?:闻及|探及|引出)(?:胎心|胎动|呼吸音|心音|肠鸣音)/;
    const NEG_PREFIX = /^(?:无(?!痛性)|未见(?!异常)|未发现|未查(?!见)|否认|没有|正常|阴性)/;
    const NEG_FINDING = /(?:无(?!痛性)|未见(?!异常)|未发现|未闻及|未触及|未引出|未扪及|不能触及|没有|否认)[^，。；、]{0,6}(?:压痛|反跳痛|包块|肿块|肿大|杂音|啰音|哮鸣音|摩擦音|震颤|结节|水肿|黄染|发绀|皮疹|出血点|畸形|抵抗|分泌物|充盈|渗出|溃疡|萎缩|异常|浊音|实音|充血|叩击痛|触痛|膨隆|隆起|肝|脾)/;
    // 否定词在体征名词之后的：肝脾未及、Murphy征阴性、双下肢不肿
    const NEG_SUFFIX = /(?:肝|脾|包块|肿块|淋巴结|结节|异常|压痛|反跳痛|杂音|啰音|肿大|水肿|黄染|征|试验|反射)[^，。；、]{0,4}(?:未触及|未闻及|未引出|未及|阴性)|不肿$|不粗$|不高$/;
    // 出现这些词说明「换了个部位/对象」，前面的否定不再覆盖它
    // （「双下肢无水肿、右上肢轻度水肿」里右边是另一个部位）
    const NEW_SUBJECT = /^(?:左|右|双|两侧|患侧|对侧|头部|颈|胸|腹|背|腰|上肢|下肢|四肢|全身|局部|前|后)/;
    // 检查受限 ≠ 阳性体征（描述"没查清楚"，不是"查出异常"）
    const NOT_A_FINDING = /(触诊不满意|无法检查|拒查|未查)/;
    // 整句就是一个正常状态（必须整句匹配，避免「包块不大」被「不大」吞掉）
    const NORMAL_EXACT = [
      /^腹部平坦$/, /^腹软$/, /^腹平软$/, /^腹部柔软$/,
      /^肠鸣音正常$/, /^肠鸣音正常[，,]?约?\d+次\/分$/,
      /^心界不大$/, /^心律齐$/, /^律齐$/
    ];
    // 公认的「正常」表述
    const NORMAL_PHRASE = /(营养良好|营养中等|营养一般|发育正常|发育良好|神志清楚|精神一般|精神可|自主体位|自动体位|面容自然|查体合作|皮肤弹性良好|毛发分布均匀|气管居中|颈软|腹平软|脊柱生理弯曲存在|生理反射存在|肌力正常|肌力5级|肌力Ⅴ级|双肺呼吸音清|呼吸音清|前囟平软|愈合良好)/;

    /** 单个片段是否明确是阴性/正常 */
    const isNegativeClause = c =>
      NEG_PREFIX.test(c) || NEG_FINDING.test(c) || NEG_SUFFIX.test(c) ||
      NOT_A_FINDING.test(c) ||
      NORMAL_EXACT.some(rx => rx.test(c)) || NORMAL_PHRASE.test(c);

    const isPositiveFinding = (item, val) => {
      if (!val) return false;
      if (SCHEMA.peValueIsDefault(item, val)) return false;
      const norm = s => String(s).trim().replace(/[，,；;。.、\s]+$/g, '');
      if (item.normal && norm(val) === norm(item.normal)) return false;

      const positiveClauses = [];
      // 顿号也要切开：「压痛、无反跳痛」是两件事
      val.split(/[。；;]/).forEach(sentence => {
        // negScope：前一个片段是否把否定作用到了后面的列举项上。
        // 「全腹无压痛、反跳痛」两个都阴性；「右下腹压痛、无反跳痛」前阳后阴。
        let negScope = false;
        sentence.split(/[，,、]/).forEach(clause => {
          const c = clause.trim();
          if (!c) return;
          if (POSITIVE_OVERRIDE.test(c)) {          // 未闻及胎心等属阳性
            positiveClauses.push(c);
            negScope = false;
            return;
          }
          if (isNegativeClause(c)) {
            // 这一片段本身是阴性；若它含否定词，否定可能延续到后面的列举项
            if (/(无|未见|未闻及|未触及|未引出|否认|没有)/.test(c)) negScope = true;
            return;
          }
          if (negScope && !NEW_SUBJECT.test(c)) {
            // 继承上一片段的否定：「无压痛、反跳痛」里的「反跳痛」
            return;
          }
          negScope = false;
          positiveClauses.push(c);                  // 其余一律按阳性处理
        });
      });
      if (!positiveClauses.length) return false;
      item.__positive = positiveClauses.join('，');
      return true;
    };

    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      peEntries(r, group.key, items).forEach(({ item: it, value }) => {
        if (!isPositiveFinding(it, value)) return;
        res.push({ group: group.name, label: it.label, text: it.__positive, key: it.key });
      });
    });
    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      sp.items.forEach(it => {
        // 没勾的专科项这次没查，不能参与阳性体征筛选
        if (!SCHEMA.peChecked(r, 'special_' + spKey, it.key)) return;
        const val = stripTail(peValue(r, 'special_' + spKey, it)) || stripTail(SCHEMA.peNormalText(it));
        if (!isPositiveFinding(it, val)) return;
        res.push({ group: sp.name, label: it.label, text: it.__positive, key: it.key });
      });
    });
    return res;
  }

  /* ---------------------------- 辅助检查 ---------------------------- */

  /**
   * 规整后的辅助检查列表。
   *
   * ⚠️ 本轮改动（缺陷6）：
   *   1) 每项新增 date（检查日期）、hospital（检查机构）、no（检查号）三个字段。
   *      《诊断学》第10版：「辅助检查……应分类按检查时间顺序记录检查结果，
   *      如系在其他医疗机构所做检查，应当写明该机构名称及检查号。」
   *   2) **按检查日期升序排列**；没填日期的保持用户输入顺序，排在所有有日期的条目之后。
   *      dates 用 YYYY-MM-DD（input type=date），字符串比较即时间比较，不必 new Date。
   *   3) 旧存档兼容：core.deepMerge 对数组是直接取用户值、不逐元素合并，
   *      所以老存档的 items 元素里压根没有这三个键——一律 String(x||'') 防御式取值，
   *      缺字段时既要保证不崩，也要保证输出与改动前一致。
   *
   * @param {object} r record
   * @returns {Array<{name:string,result:string,date:string,hospital:string,no:string}>}
   */
  function auxItems(r) {
    const raw = (((r.auxiliary || {}).items) || [])
      .map(it => {
        const o = it || {};
        return {
          name: stripTail(o.name),
          result: stripTail(o.result),
          date: String(o.date || '').trim(),
          hospital: stripTail(o.hospital),
          no: String(o.no || '').trim()
        };
      })
      // 只保留真正写了检查项目/结果的条目；空行（含只剩日期的行）不输出
      .filter(it => it.name || it.result);

    // 按检查时间升序：有日期的排前面并排序，没日期的按原顺序跟在后面。
    // 排序必须是稳定语义，所以用「带原始下标的副本」而不能直接 sort 原数组。
    const dated = [];
    const undated = [];
    raw.forEach((it, i) => {
      if (it.date) dated.push({ it, i });
      else undated.push({ it, i });
    });
    dated.sort((a, b) => (a.it.date === b.it.date ? a.i - b.i : (a.it.date < b.it.date ? -1 : 1)));
    return dated.concat(undated).map(x => x.it);
  }

  /**
   * 辅助检查一节。
   *
   * 每条的写法：
   *   「2026-10-01 外院病理号 H12345 血常规：WBC 12×10^9/L。」
   * 即 日期 → 机构 → 检查号 → 项目名：结果。
   * 机构与检查号通常成对出现，但用户只写其一也照写，不强绑。
   * 三个新字段都没填时，输出与改动前完全一致（「血常规：WBC 12×10^9/L。」）。
   */
  function buildAuxiliary(r) {
    const items = auxItems(r);
    // 空节保留原来的「暂缺。」而不是改成「／」：
    // 辅助检查整节为空时，「暂缺」本身就是病历里的规范写法（医生也这么写），
    // 不构成编造；而它的 hint 与既有测试都按「暂缺」写，改成「／」只有风险没有收益。
    if (!items.length) return '暂缺。';
    return items.map(it => {
      const head = [];
      if (it.date) head.push(it.date);
      if (it.hospital) head.push(it.hospital);
      if (it.no) head.push(`检查号 ${it.no}`);
      // 只填了项目名、没填结果时写「／」占位：原来会输出
      // 「2026-10-20 温州市人民医院 血常规。」——读起来像已经做过而且没异常，
      // 实际上恰恰是漏填了最要紧的那一半。
      const body = it.name && it.result
        ? `${it.name}：${it.result}。`
        : (it.name ? `${it.name}：${PH}。` : `${it.result}。`);
      return head.length ? head.join(' ') + ' ' + body : body;
    }).join('\n');
  }

  /* ---------------------------- 病历摘要 ---------------------------- */

  function buildSummary(r, opts) {
    const manual = stripTail((r.summary || '').trim());
    if (manual) return manual + '。';
    return draftSummary(r);
  }

  /**
   * 摘要里的「病史要点」。
   *
   * 《诊断学》第10版 病历摘要：「简明扼要、高度概述病史要点，体格检查、实验室及
   * 其他辅助检查的重要阳性和具有重要鉴别意义的阴性结果。」
   *
   * 旧实现是 `hpi.split(/。/).slice(0, 2)`——只取现病史前两句，两个毛病都已复现：
   *   ① 具有鉴别意义的阴性通常写在病史后半段，被整段丢掉
   *      （用户填了「无体重下降」，摘要里搜不到）；
   *   ② 现病史逐字段成句时，前两句常是残句，摘要跟着残。
   * 现在按「阳性要点（1～2 句）+ 显式阴性鉴别（1 句）」组织；
   * 「发病以来精神食欲…」一般情况和「另有高血压需继续治疗」不进摘要——
   * 摘要要的是与本次诊断相关的要点，这两句既不体现特点，也挤占篇幅。
   *
   * 用户手写整段现病史（mode === 'manual'）时不做任何加工，只截前两句。
   *
   * @param {object} r record
   * @param {string} hpi buildHPI(r) 的结果（已做过字段间去重）
   * @returns {string[]} 句子数组，每项末尾不带标点
   */
  function summaryHistory(r, hpi) {
    const h = r.hpi || {};
    const sentences = String(hpi || '').split(/。/).map(s => s.trim()).filter(Boolean);
    if (h.mode === 'manual') return sentences.slice(0, 2);

    // 摘掉「一般情况」与「其他需治疗疾病」两句（教材里它们不属于摘要要点）。
    // 一般情况句改用 hpiGeneralSentence 取，空记录时它返回空串，
    // 不会把一句根本不存在的「发病以来…」当成要剔除的句子。
    const gc = hpiGeneralSentence(r);
    const other = stripTail((r.pmh || {}).otherTreatDiseases);
    // 现病史只有一句「发病以来，精神…」时，buildHPI 会把主语「患者」冠在它前面，
    // 于是同一句话有两种写法。比对时统一剥掉句首主语，否则摘要会把它再复述一遍
    // （已复现：只填主诉时摘要输出「…来院。患者发病以来，精神、食欲、睡眠可…」）。
    const SUBJ = /^(患者|患儿|产妇|孕妇|本人|家属|该)/;
    const core = s => squash(String(s || '').replace(SUBJ, ''));
    const skip = [gc, other ? `另有${other}，需继续治疗` : ''].map(core).filter(Boolean);
    const out = sentences.filter(s => !skip.includes(core(s))).slice(0, 2);

    // 显式保留有鉴别意义的阴性：未被上面要点覆盖的项补成一句
    const neg = stripTail(h.negativeDiscriminating);
    if (neg) {
      const covered = squash(out.join(''));
      const NEG = /^(无|未|否认|没有|未见)/;
      const rest = neg.split(/[、，,]/).map(s => stripTail(s)).filter(Boolean)
        // 只看「核心词」有没有写过：「无发热」的核心是「发热」
        .filter(c => !covered.includes(squash(c.replace(NEG, ''))));
      if (rest.length) {
        // 只剩后半段时补回否定词，否则「消瘦。」会被读成阳性表现
        const head = (neg.match(NEG) || ['无'])[0];
        out.push(NEG.test(rest[0]) ? rest.join('、') : head + rest.join('、'));
      }
    }
    return out;
  }

  /** 自动生成病历摘要初稿 */
  function draftSummary(r) {
    const b = r.basic || {};
    const seg = [];

    // 1) 患者身份 + 主诉（直接复用主诉生成逻辑，避免时长重复追加）
    const who = [b.gender, ageWithUnit(b)].filter(Boolean).join('，');
    const ccFull = stripTail(buildChiefComplaint(r));  // 已含时长和句号
    // 主语按年龄判（subjectOf）：旧实现按科室判，儿科收 70 岁病人会写成「患儿，男，70岁」
    const subj = subjectOf(b);
    // 只有「患者」两个字的开头没有信息量，会生成「患者。」这种残句——干脆不写，
    // 让别人看得出这一段还是空的，比读到一个半截句子强。
    if (who || ccFull) {
      let head = who ? `${subj}，${who}` : subj;
      // 没有性别年龄时「患者」后面不该再跟逗号，否则读成「患者，因“腹痛3天”来院」
      if (ccFull) head += who ? `，因“${ccFull}”来院` : `因“${ccFull}”来院`;
      seg.push(head);
    }

    // 2) 现病史要点（含显式阴性鉴别，见 summaryHistory）
    const hpi = buildHPI(r);
    if (hpi) {
      const points = summaryHistory(r, hpi);
      if (points.length) seg.push(points.join('。'));
    }

    // 3) 主要阳性体征（生命体征异常 + 查体异常）
    const abn = abnormalPE(r);
    const v = (r.pe || {}).vitals || {};
    const abnormalVitals = [];
    const t = parseFloat(v.temperature);
    if (!isNaN(t) && t >= 37.3) abnormalVitals.push(`T ${v.temperature}℃`);
    const p = parseFloat(v.pulse);
    if (!isNaN(p) && (p > 100 || p < 60)) abnormalVitals.push(`P ${v.pulse}次/分`);
    const rr = parseFloat(v.respiration);
    if (!isNaN(rr) && (rr > 20 || rr < 12)) abnormalVitals.push(`R ${v.respiration}次/分`);
    const sbp = parseFloat(v.sbp), dbp = parseFloat(v.dbp);
    if (!isNaN(sbp) && (sbp >= 140 || sbp < 90)) abnormalVitals.push(`BP ${v.sbp || '—'}/${v.dbp || '—'}mmHg`);
    const peAll = abnormalVitals.concat(abn.map(a => a.text).filter(Boolean));
    // 心率去重：查体描述里已经写了「心率108次/分」时，不要再pushed一个「P 108次/分」
    const dedup = dedupeClauses(peAll.filter((txt, i) => {
      if (!/^P \d+次\/分$/.test(txt)) return true;
      const num = txt.match(/\d+/)[0];
      return !peAll.some((other, j) => j !== i && /心率/.test(other) && other.includes(num));
    }));
    // 缺陷B2（已复现）：空记录、只填主诉时这里照样写「查体未见明显阳性体征」，
    // 而整份病历一个查体项都没勾——这是替学生宣布查体阴性，属凭空成文。
    // 三种情形：查到了阳性体征照旧罗列；查过体但没异常才写阴性；没查体就整段不提。
    if (dedup.length) seg.push(`查体：${dedup.join('，')}`);
    else if (anyPEExamined(r)) seg.push('查体未见明显阳性体征');
    // else：这段整体不 push —— 摘要里不提查体，比写一句假的阴性强。

    // 4) 辅助检查
    const aux = ((r.auxiliary || {}).items || []).filter(it => stripTail(it.name) || stripTail(it.result));
    if (aux.length) {
      seg.push('辅助检查：' + aux.map(it => {
        const n = stripTail(it.name);
        const vv = stripTail(it.result);
        return n && vv ? `${n}（${vv}）` : (n || vv);
      }).join('；'));
    }
    return joinSentences(seg);
  }

  /* ---------------------------- 初步诊断 ---------------------------- */

  /**
   * 初步诊断的书写查对。
   *
   * 只查「格式对不对」，绝不判断「诊断对不对」——那是带教老师的事。
   * 依据《诊断学》第10版 第六篇·病历书写「诊断」一节：
   *   · 分清主次：主要疾病在前，次要疾病在后，并发症列于有关主病之后，伴发病最后；
   *   · 一时难以确定的，病名后加「？」；
   *   · 查不清病因的，可写「某症状待查」，并在其后注明一两个可能性较大的病名，
   *     如「发热待查，肠结核？」；
   *   · 医师在初步诊断右下角签全名。
   */
  const PENDING_WORDS = ['待查', '待诊', '待排', '原因待查', '性质待查'];

  function warnDiagnosisOrder(r, w) {
    const d = r.diagnosis || {};
    const list = (d.confirmed || []).map(s => stripTail(s)).filter(Boolean);
    if (!list.length) return;

    // ① 「待查/待诊」后面必须跟可能性较大的病名，否则这条诊断等于没写方向
    const bare = list.filter(s => {
      const hasPending = PENDING_WORDS.some(k => s.includes(k));
      if (!hasPending) return false;
      // 「发热待查，肠结核？」这种写法里已经有候选病名（逗号后 + 问号）
      return !/[，,]\s*\S+？?\s*$/.test(s) && !s.includes('？');
    });
    if (bare.length) {
      w.push(`【初步诊断】「${bare.join('」「')}」是待查类诊断，按其书写要求应在其后注明一两个可能性较大或待排除的病名，如"发热待查，肠结核？"。`);
    }

    // ② 主次顺序：症状待查排在第一、后面却有明确诊断时，多半是顺序反了
    const firstPending = PENDING_WORDS.some(k => list[0].includes(k));
    const laterSolid = list.slice(1).filter(s => !PENDING_WORDS.some(k => s.includes(k)));
    if (firstPending && laterSolid.length) {
      w.push(`【初步诊断】第 1 条是待查类诊断，后面却有明确诊断（${laterSolid.length} 条）。请确认主次：主要疾病应排在前面，待查放在明确诊断之后通常更合适。`);
    }

    // ③ 「？」占位符：教材要求用中文问号，且只在病名末尾
    const badMark = list.filter(s => /[?]/.test(s));
    if (badMark.length) {
      w.push(`【初步诊断】「${badMark.join('」「')}」里用了英文问号，病历里应写成中文「？」。`);
    }
    const midMark = list.filter(s => /？.+[^\s]/.test(s) && !/[，,]\s*\S+？/.test(s));
    if (midMark.length) {
      w.push(`【初步诊断】「${midMark.join('」「')}」的问号不在病名末尾，待定标记应写在诊断名称之后，如"肠结核？"。`);
    }

    // ④ 医师签名（教材：初步诊断右下角签全名）。只提醒一次，不阻断生成。
    if (!stripTail(d.signature)) {
      w.push('【初步诊断】末尾还没有医师签名。入院记录要求书写者在初步诊断右下角签全名。');
    }
  }


  /**
   * 初步诊断。
   *
   * 《诊断学》第10版 第六篇·病历书写：
   *   「诊断名称应确切，分清主次，按顺序排列，主要疾病在前，次要疾病在后，
   *     并发症列于有关主病之后，伴发病排列在最后。诊断应尽可能包括病因诊断、
   *     病理解剖诊断和功能诊断。对一时难以确定诊断的疾病，可在病名后加"？"。
   *     一时既查不清病因也难以判定在形态和功能方面改变的疾病，可暂以某症状待诊
   *     或待查作为诊断，并应在其后注明一两个可能性较大或待排除疾病的病名，
   *     如"发热待查，肠结核？"。」
   *   「书写入院记录的医师在初步诊断的右下角签全名。」
   *
   * 这是全篇最容易出错的地方，也是最不该由程序替用户做主的地方——
   * 哪个是主病、哪个是并发症，只有接诊的人知道。所以这里只做两件事：
   *   ① 原样保留用户排好的顺序（列表顺序即主次顺序），逐条编号；
   *   ② 把签名行补上（教材要求，但很容易忘）。
   * 排序是否合规、该不该加"？"，交给 checker 提示，不在这里猜。
   */
  function buildDiagnosis(r) {
    const d = r.diagnosis || {};
    const list = (d.confirmed || []).map(s => stripTail(s)).filter(Boolean);
    const sign = stripTail(d.signature);
    if (!list.length) return sign ? `待补充。\n\n医师签名：${sign}` : '待补充。';
    const body = list.map((s, i) => `${i + 1}. ${s}`).join('\n');
    // 签名放在初步诊断右下角，空两行留出手写位置
    return sign ? `${body}\n\n医师签名：${sign}` : body;
  }

  /* ===================================================================
   * 首次病程录（评分表第5页 100 分；同时服务第6页「首次病程记录」20 分）
   *
   * 四段结构固定，段内顺序也按评分表逐条排列：
   *   一、病历特点（S）  概括简练重点突出 10 + 与病史采集一致 5
   *   二、客观记录（O）  有意义的查体 5 + 相关辅助检查 5
   *   三、诊断依据（A）  依据概括 5 + 不堆砌 5 + 三依据齐全 5 + 主次 10
   *   四、鉴别诊断（A）  结合主要诊断有条理 10 + 无无关鉴别 5
   *   五、诊疗计划（P）  符合原则 10 + 与诊断对应 10 + 个体化 5
   *
   * 设计约束：
   *   - 纯函数：不读 DOM、不读时钟、不写存储，同样入参永远同样出参；
   *   - 用户填的字段优先，留空的部分由已有结构化数据自动补，不编造事实；
   *   - 四段标题必须始终出现（哪怕某段内容自动生成得很少），
   *     因为评分表是按「段」给分的，缺段直接零分。
   * =================================================================== */

  /**
   * 去掉句首重复的标签。
   *
   * 自动草稿的文本自带「查体：」「辅助检查：」前缀，而 SOAP 段落本身又有一个
   * 「1. 体格检查：」「2. 辅助检查：」的编号标签，直接拼会变成
   * 「1. 体格检查：查体：右下肺…」。用户手写的字段也可能自带同样的前缀。
   */
  function deLabel(text, labels) {
    let t = stripTail(text);
    labels.forEach(l => {
      const re = new RegExp('^' + l + '[：:]\\s*');
      t = t.replace(re, '');
    });
    return stripTail(t);
  }

  /** 把一段自由文本收尾成完整句子（缺句末标点就补一个） */
  function ensureSentence(text) {
    const raw = String(text || '').trim();
    const t = stripTail(raw);
    if (!t) return '';
    return /[。！？!?；;…]$/.test(raw) ? raw : t + '。';
  }

  /** 取诊断列表（用户没填就是空数组） */
  function diagnosisList(r) {
    return ((r.diagnosis || {}).confirmed || []).map(s => stripTail(s)).filter(Boolean);
  }

  /**
   * 病历特点（S 段）：把现病史压缩成「主诉 + 关键阳性 + 关键阴性」。
   * 用户填了 soap.s.summary 就直接用——手写的永远比压缩的好。
   *
   * 压缩原则（对应评分表「概括简练、重点突出」）：
   *   - 只保留起病、主要症状、有鉴别意义的阴性、阳性体征、关键辅助检查；
   *   - 一般情况、系统回顾之类不进 S 段（它们不体现「特点」）；
   *   - 同一句不重复：主诉已经在标题句里出现，正文不再抄一遍起病原文。
   */
  function draftCaseSummary(r) {
    const b = r.basic || {};
    const h = r.hpi || {};
    const seg = [];
    const who = [b.gender, ageWithUnit(b)].filter(Boolean).join('，');
    // 主语按年龄判（subjectOf）：与 draftSummary 保持一致，
    // 旧实现两处都按科室判，儿科 70 岁病人会写成「患儿，男，70岁」（已复现）。
    const subj = subjectOf(b);
    let head = who ? `${subj}，${who}` : subj;
    const cc = stripTail(buildChiefComplaint(r));
    if (cc) head += `，因“${cc}”入院`;
    seg.push(head);

    // 关键阳性：症状特点 + 进展（起病时间已在主诉里，不重复）
    const keyPoints = [h.symptoms, h.evolution].map(s => stripTail(s)).filter(Boolean);
    if (keyPoints.length) seg.push(keyPoints.join('，'));

    // 关键阴性：有鉴别意义的阴性病史最能体现思路，必须保留
    if (stripTail(h.negativeDiscriminating)) seg.push(stripTail(h.negativeDiscriminating));

    // 阳性体征与辅助检查各留一句，细节放到 O 段，避免 S/O 两段重复
    const abn = abnormalPE(r);
    if (abn.length) seg.push(`查体：${dedupeClauses(abn.slice(0, 3).map(a => a.text)).join('，')}`);
    const aux = auxItems(r);
    if (aux.length) {
      seg.push(`辅助检查：${aux.slice(0, 2).map(it =>
        it.name && it.result ? `${it.name}（${it.result}）` : (it.name || it.result)).join('；')}`);
    }
    return joinSentences(seg);
  }

  /** O 段：对诊断有意义的体格检查（只取阳性，阴性不进 O 段） */
  function draftObjectivePE(r) {
    const abn = abnormalPE(r);
    const v = (r.pe || {}).vitals || {};
    const parts = [];
    const t = parseFloat(v.temperature);
    if (!isNaN(t) && t >= 37.3) parts.push(`T ${v.temperature}℃`);
    const p = parseFloat(v.pulse);
    if (!isNaN(p) && (p > 100 || p < 60)) parts.push(`P ${v.pulse}次/分`);
    const rr = parseFloat(v.respiration);
    if (!isNaN(rr) && (rr > 20 || rr < 12)) parts.push(`R ${v.respiration}次/分`);
    const sbp = parseFloat(v.sbp);
    if (!isNaN(sbp) && (sbp >= 140 || sbp < 90)) {
      parts.push(`BP ${v.sbp || '—'}/${v.dbp || '—'}mmHg`);
    }
    const texts = dedupeClauses(parts.concat(abn.map(a => a.text).filter(Boolean)));
    // 缺陷B3（已复现）：一个查体项都没勾时，这里原本写「未见与诊断相关的阳性体征」，
    // 等于替学生下了阴性结论。没查过体就只留项目名（调用处已带「体格检查：」前缀，
    // 返回「／」读作「1. 体格检查：／」），不替学生宣布查体阴性。
    if (!texts.length) return anyPEExamined(r) ? '未见与诊断相关的阳性体征' : PH;
    return texts.join('，');
  }

  /** O 段：与疾病相关的辅助检查结果 */
  function draftObjectiveAux(r) {
    const aux = auxItems(r);
    if (!aux.length) return '相关辅助检查结果暂缺';
    return aux.map(it => {
      if (it.name && it.result) return `${it.name}${it.result}`;
      return it.name || it.result;
    }).join('；');
  }

  /**
   * 三依据（病史/体检/辅助检查）齐全的逐诊断依据。
   *
   * 自动草稿只在第一条（主诊断）上给依据——多条诊断共用同一段「体检/辅助检查」
   * 正是评分表「诊断依据堆砌、内容空洞」要扣分的写法。其余诊断明确留空，
   * 提示用户各自补，宁可空着也不复制粘贴。
   */
  function draftBasisDetail(r) {
    const items = ((r.soap || {}).a || {}).basisDetail;
    if (Array.isArray(items) && items.length) {
      return items.filter(x => x && stripTail(x.diagnosis));
    }
    const dx = diagnosisList(r);
    if (!dx.length) return [];
    const hpiText = [
      stripTail((r.hpi || {}).onset), stripTail((r.hpi || {}).symptoms),
      stripTail((r.hpi || {}).accompanying), stripTail((r.hpi || {}).negativeDiscriminating)
    ].filter(Boolean).join('，');
    const abn = abnormalPE(r);
    const aux = auxItems(r);
    return dx.map((d, i) => i === 0
      ? {
        diagnosis: d,
        history: hpiText,
        // 缺陷H1（已复现）：通用腹部触诊与专科 giTenderness 常写同一句，
        // 诊断依据就成了「上腹部压痛，上腹部压痛」。这里按分句去重（dedupeClauses）。
        pe: abn.length ? dedupeClauses(abn.slice(0, 2).map(a => a.text)).join('，') : '',
        aux: aux.length ? `${aux[0].name}${aux[0].result}` : ''
      }
      : { diagnosis: d, history: '', pe: '', aux: '' });
  }

  /**
   * 判断鉴别诊断是否与现有诊断相关。
   *
   * 这是给「自查」用的**保守**启发式，只在明显跑题时返回结果——它宁可漏报，
   * 也不能把临床合理的鉴别误判成无关（假阳性会让用户不敢用这个提示）。
   * 判为相关的三条途径：
   *   ① 鉴别病名与任一诊断名有 ≥2 字的公共片段（急性胆囊炎 / 急性阑尾炎）；
   *   ② 鉴别病名本身就是诊断参考提示里的候选疾病（47 条规则覆盖了内科常见鉴别）；
   *   ③ 鉴别病名直接出现在主诉或现病史里（如以「咯血」为主诉时的肺结核）。
   * 三条都不满足才算「关联不明确」，且只用于质控提醒，绝不写进病历正文。
   */
  function diffRelatedToDiagnosis(r) {
    const dx = diagnosisList(r);
    const diffs = (((r.soap || {}).a || {}).diff) || [];
    if (!Array.isArray(diffs) || !diffs.length) return { total: 0, unrelated: [] };

    const joined = dx.join('|');
    const narrative = [
      stripTail((r.basic || {}).chiefComplaint),
      stripTail((r.hpi || {}).symptoms),
      stripTail((r.hpi || {}).accompanying),
      stripTail((r.hpi || {}).evolution)
    ].join('|');
    // 诊断提示规则里的候选病名（hints.js 在浏览器里晚于 generator 加载，
    // 所以这里用运行时的 typeof 判断，拿不到就退化为前两条途径）
    const ruleNames = (typeof globalThis !== 'undefined' &&
      globalThis.HINTS && Array.isArray(globalThis.HINTS.RULES))
      ? globalThis.HINTS.RULES.map(x => String(x.name || ''))
      : [];

    const sharesFragment = (name, pool) => {
      if (!pool) return false;
      for (let i = 0; i + 2 <= name.length; i++) {
        if (pool.includes(name.slice(i, i + 2))) return true;
      }
      return false;
    };

    const unrelated = diffs
      .filter(d => d && stripTail(d.diagnosis))
      .filter(d => {
        const name = stripTail(d.diagnosis);
        if (sharesFragment(name, joined)) return false;           // ①
        if (ruleNames.some(rn => rn && rn.includes(name))) return false; // ②
        if (narrative && narrative.includes(name)) return false;  // ③
        return true;
      })
      .map(d => stripTail(d.diagnosis));
    return { total: diffs.length, unrelated };
  }

  /**
   * 首次病程录的「自查提醒」——只给界面提示，**不进入病历正文**。
   *
   * 之所以单独成函数：buildFirstCourseRecord 的返回值会被用户整段复制进
   * 病历系统，任何「请确认是否保留」之类的话混进去都会变成病历的一部分。
   *
   * @returns {string[]} 需要提醒用户的事项，没有则返回空数组
   */
  function firstCourseSelfCheck(r) {
    const out = [];
    const a = (((r.soap || {}).a) || {});
    if (!stripTail(a.diffNote)) {
      const check = diffRelatedToDiagnosis(r);
      if (check.unrelated.length) {
        out.push(`${check.unrelated.join('、')} 与现有诊断的关联不明确，`
          + '请确认是否保留（评分表对「与诊断无关的鉴别诊断」扣 5 分）。');
      }
    }
    return out;
  }

  /**
   * 生成首次病程录。
   *
   * @param {object} r record
   * @param {object} [opts] { date: 'YYYY-MM-DD HH:mm' } 只用于标题时间，不填则不写时间
   * @returns {string} 含「病历特点」「诊断依据」「鉴别诊断」「诊疗计划」四个小标题的纯文本
   */
  function buildFirstCourseRecord(r, opts = {}) {
    const rec = r || {};
    const soap = rec.soap || {};
    const s = soap.s || {};
    const o = soap.o || {};
    const a = soap.a || {};
    const p = soap.p || {};

    const lines = [];
    const stamp = stripTail(opts.date);
    lines.push(stamp ? `【首次病程录】${stamp}` : '【首次病程录】');

    /* ---------- 一、病历特点（S） ---------- */
    lines.push('一、病历特点（S）');
    const summary = stripTail(s.summary) || draftCaseSummary(rec);
    lines.push(ensureSentence(summary) || '（待补充：请概括现病史要点）');
    // 「与病史采集一致」这一项不写额外事实，只做一句自检说明
    const consistency = stripTail(s.consistency);
    if (consistency) lines.push(ensureSentence(consistency));

    /* ---------- 二、客观体检记录/检查结果（O） ---------- */
    lines.push('二、客观记录（O）');
    const peText = deLabel(o.pe || draftObjectivePE(rec), ['查体', '体格检查']);
    const auxText = deLabel(o.aux || draftObjectiveAux(rec), ['辅助检查', '检查']);
    lines.push(`1. 体格检查：${ensureSentence(peText)}`);
    lines.push(`2. 辅助检查：${ensureSentence(auxText)}`);

    /* ---------- 三、诊断依据（A） ---------- */
    lines.push('三、诊断依据（A）');
    const basis = stripTail(a.basis);
    if (basis) lines.push(ensureSentence(basis));
    const details = draftBasisDetail(rec);
    if (details.length) {
      details.forEach(d => {
        const bits = [];
        if (stripTail(d.history)) bits.push(`①病史：${stripTail(d.history)}`);
        if (stripTail(d.pe)) bits.push(`②体检：${stripTail(d.pe)}`);
        if (stripTail(d.aux)) bits.push(`③辅助检查：${stripTail(d.aux)}`);
        const body = bits.length ? bits.join('；') : '（待补充病史、体检、辅助检查三方面依据）';
        lines.push(`· ${stripTail(d.diagnosis)}：${ensureSentence(body)}`);
      });
    } else {
      lines.push('· （待补充初步诊断，再逐条列出诊断依据）');
    }
    const ranking = stripTail(a.ranking);
    if (ranking) lines.push(`主次：${ensureSentence(ranking)}`);

    /* ---------- 四、鉴别诊断（A） ---------- */
    lines.push('四、鉴别诊断（A）');
    const diffs = Array.isArray(a.diff) ? a.diff.filter(d => d && stripTail(d.diagnosis)) : [];
    if (diffs.length) {
      diffs.forEach(d => {
        const bits = [];
        if (stripTail(d.why)) bits.push(`支持点：${stripTail(d.why)}`);
        if (stripTail(d.against)) bits.push(`不支持点：${stripTail(d.against)}`);
        if (stripTail(d.points)) bits.push(`鉴别要点：${stripTail(d.points)}`);
        const tail = bits.length ? '：' + bits.join('；') : '';
        lines.push(`· 需与${stripTail(d.diagnosis)}鉴别${ensureSentence(tail)}`);
      });
    } else {
      // 没填鉴别诊断时用 HINTS 的「该鉴别什么」作提示，绝不自动写进病历正文
      lines.push('· （待补充：结合主要诊断展开鉴别，可参考诊断参考提示中的候选疾病）');
    }
    const diffNote = stripTail(a.diffNote);
    if (diffNote) {
      lines.push(ensureSentence(diffNote));
    }
    // 注意：与诊断无关的鉴别诊断属于「自查提醒」，是给考生看的话，不是病历内容。
    // 它绝不能写进本函数的返回值——用户会整段复制进病历系统。
    // 需要的界面请调用 firstCourseSelfCheck(rec) 单独取用。

    /* ---------- 五、诊疗计划（P） ---------- */
    lines.push('五、诊疗计划（P）');
    const principle = stripTail(p.principle);
    if (principle) lines.push(ensureSentence(principle));
    const plans = Array.isArray(p.perDiagnosis) ? p.perDiagnosis.filter(x => x && stripTail(x.diagnosis)) : [];
    if (plans.length) {
      plans.forEach(x => {
        const bits = [];
        if (stripTail(x.exam)) bits.push(`检查：${stripTail(x.exam)}`);
        if (stripTail(x.treatment)) bits.push(`治疗：${stripTail(x.treatment)}`);
        const body = bits.length ? bits.join('；') : '（待补充具体检查与治疗措施）';
        lines.push(`· ${stripTail(x.diagnosis)}：${ensureSentence(body)}`);
      });
    } else {
      lines.push('· （待补充：按诊断逐条列出拟完善检查与治疗措施）');
    }
    const individual = stripTail(p.individual);
    if (individual) lines.push(`个体化：${ensureSentence(individual)}`);

    return lines.join('\n') + '\n';
  }

  /* ===================================================================
   * 出院记录（评分表第6–7页 15 分）
   *
   * 六项小标题固定：一般情况 / 入院情况 / 诊疗经过 / 出院情况 / 出院诊断 / 出院医嘱。
   * 出院医嘱拆成药物、非药物、生活指导、复诊时间四句，对应评分表括号里的四项。
   * =================================================================== */

  /** 住院天数：两个 'YYYY-MM-DD' 之差；算不出来返回 0 */
  function hospitalDays(admitDate, dischargeDate) {
    const parse = s => {
      const m = String(s || '').match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);
      if (!m) return null;
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return isNaN(d.getTime()) ? null : d;
    };
    const a = parse(admitDate);
    const b = parse(dischargeDate);
    if (!a || !b) return 0;
    const diff = Math.round((b - a) / 86400000);
    return diff > 0 ? diff : 0;
  }

  /**
   * 生成出院记录。
   * @param {object} r record
   * @returns {string} 含六项小标题的纯文本
   */
  function buildDischargeRecord(r) {
    const rec = r || {};
    const b = rec.basic || {};
    const d = rec.discharge || {};
    const advice = d.advice || {};
    const lines = [];
    lines.push('【出院记录】');

    /* ---------- 一般情况 ---------- */
    const general = [];
    if (stripTail(b.name)) general.push(`姓名：${stripTail(b.name)}`);
    if (stripTail(b.gender)) general.push(`性别：${stripTail(b.gender)}`);
    if (ageWithUnit(b)) general.push(`年龄：${ageWithUnit(b)}`);
    if (stripTail(b.recordNo)) general.push(`病历号：${stripTail(b.recordNo)}`);
    if (stripTail(b.admitDate)) general.push(`入院日期：${stripTail(b.admitDate)}`);
    const disDate = stripTail(d.dischargeDate);
    if (disDate) general.push(`出院日期：${disDate}`);
    const days = hospitalDays(b.admitDate, d.dischargeDate);
    if (days) general.push(`住院天数：${days}天`);
    lines.push('一、一般情况');
    lines.push(general.length ? joinSentences([general.join('，')]) : '（待补充姓名、性别、年龄、入院及出院日期）');

    /* ---------- 入院情况 ---------- */
    lines.push('二、入院情况');
    const admit = stripTail(d.admitCondition) || (() => {
      // 自动草稿：主诉 + 主要阳性体征 + 入院诊断（只写入院当时的状态）
      const seg = [];
      const cc = stripTail(buildChiefComplaint(rec));
      if (cc) seg.push(`因“${cc}”入院`);
      const abn = abnormalPE(rec);
      if (abn.length) seg.push(`入院查体${abn.slice(0, 3).map(a => a.text).join('，')}`);
      const dx = diagnosisList(rec);
      if (dx.length) seg.push(`入院诊断：${dx.join('、')}`);
      return seg.length ? joinSentences(seg) : '';
    })();
    lines.push(admit ? ensureSentence(admit) : '（待补充：入院时主要症状、体征与入院诊断）');

    /* ---------- 诊疗经过 ---------- */
    lines.push('三、诊疗经过');
    lines.push(d.course ? ensureSentence(d.course) : '（待补充：住院期间病情变化、检查结果、治疗经过及效果）');

    /* ---------- 出院情况 ---------- */
    lines.push('四、出院情况');
    lines.push(d.dischargeStatus ? ensureSentence(d.dischargeStatus) : '（待补充：出院时主要症状、体征、辅助检查结果）');

    /* ---------- 出院诊断 ---------- */
    lines.push('五、出院诊断');
    const outDx = (Array.isArray(d.diagnoses) ? d.diagnoses : [])
      .map(s => stripTail(s)).filter(Boolean);
    const dxList = outDx.length ? outDx : diagnosisList(rec);
    lines.push(dxList.length
      ? dxList.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '（待补充出院诊断）');

    /* ---------- 出院医嘱 ---------- */
    lines.push('六、出院医嘱');
    const orders = [];
    if (stripTail(advice.drug)) orders.push(`药物治疗：${stripTail(advice.drug)}`);
    if (stripTail(advice.nonDrug)) orders.push(`非药物治疗：${stripTail(advice.nonDrug)}`);
    if (stripTail(advice.lifestyle)) orders.push(`生活指导：${stripTail(advice.lifestyle)}`);
    if (stripTail(advice.followUp)) orders.push(`复诊时间：${stripTail(advice.followUp)}`);
    lines.push(orders.length ? joinSentences(orders) : '（待补充：药物、非药物治疗、生活指导、复诊时间）');

    return lines.join('\n') + '\n';
  }

  /* ---------------------------- 组装全文 ---------------------------- */

  const SECTION_ORDER = [
    '一般项目', '主诉', '现病史', '既往史', '系统回顾', '个人史',
    '婚姻史', '月经与生育史', '家庭史', '体格检查', '实验室检查',
    '摘要', '诊断依据', '初步诊断'
  ];

  /**
   * 诊断依据：把每条诊断的病史/体检/辅助检查三方面依据逐条列出。
   * 这是模板里的独立一节（位于摘要之后、初步诊断之前）。
   */
  function buildBasisSection(r) {
    const items = draftBasisDetail(r);
    if (!items.length) return '待补充：先填写初步诊断，再逐条列出诊断依据。';
    const lines = [];
    items.forEach((it, i) => {
      const parts = [];
      if (stripTail(it.history)) parts.push(`病史：${stripTail(it.history)}`);
      if (stripTail(it.pe)) parts.push(`体格检查：${stripTail(it.pe)}`);
      if (stripTail(it.aux)) parts.push(`辅助检查：${stripTail(it.aux)}`);
      const body = parts.length ? parts.join('；') : '（待补充病史、体检、辅助检查三方面依据）';
      lines.push(`${i + 1}. ${stripTail(it.diagnosis)}：${body}`);
    });
    return lines.join('\n');
  }

  /**
   * 生成大病历全文
   *
   * ⚠️ 本轮改动（缺陷2第2、3条）：旧实现是 `if (!body) return;`——某一节生成结果为空，
   * 连【节标题】带内容整节蒸发。学生看不出「本来就没有这一节」还是「漏印了」，
   * 反映到带教老师那边就是一份缺项的入院记录。
   * 《诊断学》第10版：「所有表格项都应详细填写，无内容者画"/"或"—"」。
   *
   * 现在 14 节标题恒在，正文为空时写占位符「／」。
   * 这样既满足「不可空缺」，也让用户一眼看到自己还有哪几节没填。
   *
   * 注意：sections 里存的也是占位符而非空串，所以 app.js 的「复制某节」
   * 列表（GENERATOR.SECTION_ORDER.filter(n => res.sections[n])）会列出全部 14 节，
   * 与正文保持一致，不会出现"正文有、复制列表里没有"的错位。
   *
   * @param {object} r record
   * @param {object} opts { rosMode: 'detail'|'brief' }
   */
  function generate(r, opts = {}) {
    const rosMode = opts.rosMode || 'detail';
    const sections = {};
    sections['一般项目'] = buildBasicInfo(r);
    sections['主诉'] = buildChiefComplaint(r);
    sections['现病史'] = buildHPI(r);
    sections['既往史'] = buildPMH(r);
    sections['系统回顾'] = buildROS(r, rosMode);
    sections['个人史'] = buildPersonal(r);
    sections['婚姻史'] = buildMarriageHistory(r);
    sections['月经与生育史'] = buildMenstruationChildbirth(r);
    sections['家庭史'] = buildFamily(r);
    sections['体格检查'] = buildPE(r);
    sections['实验室检查'] = buildAuxiliary(r);
    sections['摘要'] = buildSummary(r);
    sections['诊断依据'] = buildBasisSection(r);
    sections['初步诊断'] = buildDiagnosis(r);

    const lines = [];
    SECTION_ORDER.forEach(name => {
      // 空节不再整节消失：标题照出，正文补「／」占位。
      const body = sections[name] || PH;
      sections[name] = body;
      lines.push(`【${name}】`);
      lines.push(body);
      lines.push('');
    });
    return { text: lines.join('\n').trim() + '\n', sections, warnings: validate(r) };
  }

  /**
   * 纯文本导出：不用【】标题，接近纸质病历的书写格式。
   * 单句章节（主诉、现病史）写成「名称：正文」；
   * 分项章节（一般项目、既往史、个人史…）写成「名称：」换行再列各项。
   */
  function generatePlain(r, opts = {}) {
    const { sections } = generate(r, opts);
    const out = [];
    SECTION_ORDER.forEach(n => {
      const body = sections[n];
      if (!body) return;
      if (body.includes('\n')) out.push(`${n}：\n${body}`);
      else out.push(`${n}：${body}`);
    });
    return out.join('\n') + '\n';
  }


  /* ---------------------------- 质控提醒 ---------------------------- */

  const DIAG_WORDS = [
    // 心血管
    '高血压', '糖尿病', '冠心病', '心梗', '心肌梗死', '心绞痛', '心衰', '心力衰竭',
    '房颤', '心房颤动', '心律失常', '瓣膜病',
    // 呼吸
    '肺炎', '肺结核', '哮喘', '慢阻肺', 'COPD', '支气管炎', '气胸', '肺栓塞',
    // 消化
    '胃炎', '胃溃疡', '十二指肠溃疡', '胆囊炎', '胆结石', '胰腺炎', '阑尾炎',
    '肠梗阻', '肠炎', '肝炎', '肝硬化', '消化道出血',
    // 泌尿
    '肾炎', '肾病', '肾衰', '肾功能不全', '泌尿系感染', '尿路感染', '肾结石',
    // 血液
    '贫血', '白血病', '淋巴瘤', '血小板减少',
    // 神经
    '脑梗', '脑梗死', '脑出血', '脑卒中', '偏头痛', '癫痫', '帕金森',
    // 内分泌/风湿
    '甲亢', '甲减', '甲状腺功能', '风湿', '类风湿', '痛风', '红斑狼疮',
    // 外科/骨科
    '骨折', '脱位', '疝', '痔疮',
    // 肿瘤
    '肿瘤', '癌', '肉瘤', '白血病',
    // 妇产
    '妊娠期高血压', '子痫', '宫外孕', '异位妊娠', '盆腔炎'
  ];

  /**
   * 通用查体与专科查体对同一体征给出互相矛盾的描述时，列出提示。
   *
   * 为什么需要（缺陷5 的残留部分）：用户把「消化内科专科查体：压痛点」填成
   * 「中上腹压痛，无反跳痛」，通用腹部触诊却还是系统默认的
   * 「腹平软，全腹无压痛、反跳痛」——同一份病历里既「全腹无压痛」又「中上腹压痛」，
   * 肠鸣音也一处 4 次/分、一处 3 次/分（均已复现）。
   *
   * 处理原则：
   *   1) 判据必须是「通用项取的是系统默认值」。通用项一旦是用户自己手填的，
   *      那就是用户自己的判断，程序不置一词——既不删也不提示。
   *   2) 不擅自删改任何一方。查体阳性所见是学生亲手查到的，
   *      删掉默认值等于替他做决定；改他的描述更不行。所以只提醒「请确认以哪一份为准」。
   *   3) 宁可漏报不可误报：只有「同一个体征词」且「否定/肯定相反」或
   *      「同一项数值不同」才算冲突，纯措辞差异不管。
   *
   * @param {object} r record
   * @returns {string[]} 每条一句话的中文提醒
   */
  function peConflicts(r) {
    const deptKey = (r.basic || {}).department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    const res = [];
    const seenKey = new Set();

    // 只收集「用户没写、取的是 schema 默认值」且这次确实输出的通用项。
    const generalDefaults = [];
    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      items.forEach(it => {
        if (!SCHEMA.peChecked(r, group.key, it.key)) return;
        // 用户亲手写过的项直接跳过——那不是系统默认值
        if (stripTail(((r.pe || {})[group.key] || {})[it.key])) return;
        const val = stripTail(peValue(r, group.key, it));
        if (!val) return;
        if (!SCHEMA.peValueIsDefault(it, val)) return;
        generalDefaults.push({ group: group.name, label: it.label, val });
      });
    });
    if (!generalDefaults.length) return res;

    // 同一体征可能出现在多个部位/多个专科项里，按这个表配对。
    //
    // 这里刻意不放单字「肝」「脾」：它们会命中「肝颈静脉回流征」「肝浊音界」之类的
    // 复合词，把不相干的项配到一起。要配就写全一点。
    const CONFLICT_KEYS = [
      '压痛', '反跳痛', '肠鸣音', '浊音', '震颤', '包块', '杂音', '啰音', '水肿',
      '肝肋下', '脾肋下', '肝大', '脾大', '肝区叩击痛', '肾区叩击痛',
    ];
    /**
     * 从一句话里认出它说的部位。
     *
     * 加这个是因为终审判出的假冲突：头颅查体默认写「无压痛及包块」，
     * 专科又写了「中上腹压痛」，两者都含「压痛」但根本不是同一个地方，
     * 一报就是「同一体征前后矛盾」——报得越多，学生越会整体无视提醒。
     */
    const REGIONS = [
      ['头颅', /头颅|头部|额部|颞部|枕部|头顶/],
      ['颈部', /颈部|颈前|颈侧|甲状腺|颈静脉|颈动脉|气管/],
      ['胸部', /胸壁|胸廓|前胸|乳房|双乳/],
      ['心脏', /心前区|心尖|心界|心音|心脏|瓣膜/],
      ['肺部', /双肺|肺下界|胸膜|呼吸音|语颤|语音共振/],
      ['腹部', /腹部|腹壁|全腹|上腹|下腹|中腹|脐周|脐部|麦氏点|胆囊点|季肋|肝区|脾区|腹水|移动性浊音/],
      ['腰背部', /腰部|腰背|背部|脊柱|胸椎|腰椎|骶部/],
      ['四肢', /四肢|上肢|下肢|双足|足背|手指|关节|膝|踝/],
      ['会阴', /外阴|阴道|宫颈|子宫|附件|直肠|肛门|会阴/],
      ['皮肤', /皮肤|皮疹|黏膜|巩膜/],
    ];
    const regionsOf = clause => REGIONS.filter(([, re]) => re.test(clause)).map(([n]) => n);
    // 只用当前分句认部位是不够的：「头颅大小、形态正常，无压痛及包块」切出来以后，
    // 「无压痛及包块」那一段自己没提部位，认不出来就只能照旧比对，假冲突又回来了。
    // 所以两边都带上项目自己的上下文（组名 + 项目名）一起认。
    const differentSite = (aText, bText) => {
      const ra = regionsOf(aText);
      const rb = regionsOf(bText);
      if (!ra.length || !rb.length) return false;   // 有一边说不上部位，仍按原逻辑比对
      return !ra.some(x => rb.includes(x));
    };
    // 只按逗号/分号/句号切，不按顿号切：「全腹无压痛、反跳痛」里的「反跳痛」
    // 是被前面那个「无」管着的，切碎了就会把「反跳痛」当成独立阳性。
    const splitAll = t => String(t || '').split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
    const numOf = c => (c.match(/(\d+)\s*次\s*\/?\s*分/) || [])[1];
    const NEG_WORD = /(无|未见|未触及|未闻及|未引出|未扪及|否认|没有|正常|阴性|不)/;
    const SEG = /[、，,；;。：:]/;
    /**
     * 这个分句里的 key 是否被否定了。
     *
     * 不能只看句首：「全腹无压痛、反跳痛」以「全腹」开头，句首不是否定词，
     * 但「压痛」确实被「无」否掉了。所以取 key 前面那一小段（到上一个顿号/逗号为止）
     * 里有没有否定词；key 后面紧跟着「阴性/未触及」这类后缀也算否定。
     */
    const negated = (clause, key) => {
      const idx = clause.indexOf(key);
      if (idx < 0) return false;
      // 取 key 之前最后一个分隔符之后的那一小段（「全腹无压痛、反跳痛」里的「无压痛」）
      const head = clause.slice(0, idx).split(SEG).pop() || '';
      if (NEG_WORD.test(head)) return true;
      // 否定词也可能落在体征名词之后：肝脾未及、Murphy征阴性、肠鸣音正常
      // 「正常」也算一种否定：写「肠鸣音正常」而专科写「肠鸣音活跃」就是矛盾。
      const tail = clause.slice(idx + key.length, idx + key.length + 5);
      return /^(阴性|正常|未触及|未闻及|未引出|未及)/.test(tail);
    };

    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      const store = ((r.pe || {})['special_' + spKey]) || {};
      sp.items.forEach(it => {
        const raw = stripTail(store[it.key]);
        if (!raw) return;                       // 专科侧也必须是用户亲手写的
        splitAll(raw).forEach(spClause => {
          CONFLICT_KEYS.forEach(k => {
            if (!spClause.includes(k)) return;
            generalDefaults.forEach(g => {
              splitAll(g.val).forEach(gClause => {
                if (!gClause.includes(k)) return;
                // 「同一个体征 + 说法相反」或「同一个体征 + 数值不同」才算冲突。
                // 用 negated 而不是看句首：默认值「全腹无压痛、反跳痛」以「全腹」开头，
                // 只看句首会把阴性误判成阳性，提示就会变成假冲突。
                const opposite = negated(gClause, k) !== negated(spClause, k);
                const numG = numOf(gClause);
                const numS = numOf(spClause);
                const numDiff = !!(numG && numS && numG !== numS);
                if (!opposite && !numDiff) return;
                // 说两个地方就别配对：头颅「无压痛及包块」和「中上腹压痛」都含「压痛」，
                // 但不是同一个体征，报出来只是噪音。
                // 带上组名和项目名再认部位，因为切出来的分句本身常常没提部位。
                if (differentSite(`${g.group}${g.label}：${gClause}`, `${sp.name}${it.label}：${spClause}`)) return;
                // 同一对「通用项 × 专科段」只提示一次，避免一大串雷同条目
                const id = `${g.group}|${g.label}|${sp.name}`;
                if (seenKey.has(id)) return;
                seenKey.add(id);
                res.push(`【体格检查】${g.group}「${g.label}」取的是系统默认描述「${gClause}」，`
                  + `而${sp.name}写的是「${spClause}」，同一体征前后矛盾，请确认以哪一份为准（程序不替你删改）。`);
              });
            });
          });
        });
      });
    });
    return res;
  }

  /**
   * 生命体征/一般项目的取值范围检查。
   *
   * 这些数字最终会一个不漏地进病历正文，而 validate 以前一位都不看：
   * T 368℃、P 780次/分、BP 80/130 都能原样写进「体格检查」，
   * 70 岁的人挂儿科也照生成儿科个人史。这些不需要医学知识就能判断，
   * 属于「写了肯定不对」而不是「写得对不对要看病人」——所以只报错不修改。
   */
  const VITAL_RANGE = {
    temperature: [34, 43, '体温'],
    pulse: [20, 250, '脉搏'],
    respiration: [5, 80, '呼吸'],
    sbp: [50, 300, '收缩压'],
    dbp: [20, 200, '舒张压'],
    height: [30, 250, '身高'],
    weight: [1, 300, '体重'],
    abdCirc: [20, 200, '腹围'],
    headCirc: [20, 70, '头围'],
    chestCirc: [20, 120, '胸围'],
  };

  function checkVitals(r, w) {
    const v = ((r.pe || {}).vitals) || {};
    Object.keys(VITAL_RANGE).forEach(k => {
      const [lo, hi, label] = VITAL_RANGE[k];
      const raw = String(v[k] === undefined || v[k] === null ? '' : v[k]).trim();
      if (!raw) return;
      if (!/^-?\d+(\.\d+)?$/.test(raw)) {
        w.push(`【生命体征】${label}填的是「${raw}」，不是数字。病历里这一项已按「／」留空，请补填。`);
        return;
      }
      const n = Number(raw);
      if (n < lo || n > hi) {
        w.push(`【生命体征】${label} ${raw} 超出可信范围（${lo}～${hi}），`
          + `病历里这一项已按「／」留空，请核对是否多打或少打了一位后再填。`);
      }
    });
    // 收缩压必须高于舒张压：写反了是最常见的手误，两个数都在范围内时查不出来
    const sbp = Number(String(v.sbp === undefined ? '' : v.sbp).trim());
    const dbp = Number(String(v.dbp === undefined ? '' : v.dbp).trim());
    if (sbp && dbp && Number.isFinite(sbp) && Number.isFinite(dbp) && sbp <= dbp) {
      w.push(`【生命体征】收缩压 ${sbp} 不高于舒张压 ${dbp}，两者可能写反了。`);
    }
  }

  /** 日期必须是 YYYY-MM-DD 且真实存在；顺序上入院不晚于记录、出院不早于入院 */
  function checkDates(r, w) {
    const b = r.basic || {};
    const okDate = s => {
      const t = stripTail(s);
      if (!t) return null;
      const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (!m) {
        w.push(`【日期】「${t}」不是 YYYY-MM-DD 格式，请核对。`);
        return null;
      }
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const dt = new Date(Date.UTC(y, mo - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
        w.push(`【日期】「${t}」不是一个真实存在的日期，请核对。`);
        return null;
      }
      // 补零后再比较，否则 '2026-9-1' 这类写法按字符串比会排错
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    const admit = okDate(b.admitDate);
    const record = okDate(b.recordDate);
    const discharge = okDate((r.discharge || {}).dischargeDate);
    if (admit && record && record < admit) {
      w.push(`【日期】记录日期 ${record} 早于入院日期 ${admit}，请核对。`);
    }
    if (admit && discharge && discharge < admit) {
      w.push(`【日期】出院日期 ${discharge} 早于入院日期 ${admit}，请核对。`);
    }
  }

  /** 科室与年龄是否对得上：儿科接成人、成人科接 14 岁以下都值得问一句 */
  function checkDeptAge(r, w) {
    const b = r.basic || {};
    const m = String(b.age === undefined ? '' : b.age).match(/\d+/);
    if (!m) return;
    const age = Number(m[0]);
    if (!Number.isFinite(age) || age <= 0) return;
    const dept = b.department;
    const name = (SCHEMA.DEPARTMENTS.find(d => d.key === dept) || {}).name || '';
    if (dept === 'pediatrics' && age >= 14) {
      w.push(`【一般项目】科室是${name}，但年龄 ${age} 岁，请确认是否选错科室（儿科一般指 14 岁以下）。`);
    } else if (dept && dept !== 'pediatrics' && dept !== 'emergency' && age < 14) {
      w.push(`【一般项目】年龄 ${age} 岁，科室却是${name}；14 岁以下建议选儿科。`);
    }
  }

  function validate(r) {
    const w = [];
    const b = r.basic || {};
    if (!b.name) w.push('【一般项目】缺少姓名。');
    if (!b.gender) w.push('【一般项目】缺少性别。');
    if (!b.age) w.push('【一般项目】缺少年龄。');
    const cc = stripTail(b.chiefComplaint);
    if (!cc) {
      w.push('【主诉】未填写。');
    } else {
      if (cc.length > 20) w.push(`【主诉】文字偏长（${cc.length}字），一般要求不超过20字，只写症状+时间、不写诊断。`);
      const hit = DIAG_WORDS.filter(dw => cc.includes(dw));
      if (hit.length) w.push(`【主诉】疑似包含诊断性词语（${hit.join('、')}），主诉应写症状，建议改为症状描述。`);
      // 缺陷H4（已复现）：学生在主诉正文里直接写了「反复上腹痛3年」，
      // 只是没再去下面的「持续时间」输入框里重复填一遍，旧判据只看那个输入框，
      // 于是照样报「缺少持续时间」。持续时间本来就在正文里，重复填才奇怪。
      // 现在先看正文：正文里已经出现「数字+时间单位」（含中文数字、半个月之类）就不报。
      if (!stripTail(b.chiefComplaintDuration) && !hasDurationInText(buildChiefComplaint(r))) {
        w.push('【主诉】缺少持续时间。');
      }
    }
    if (!(buildHPI(r) || '').trim()) w.push('【现病史】未填写。');
    // 系统回顾：只有完全没动过才提醒。
    // ⚠️ 措辞随本轮语义改动（缺陷1第2条）：旧文案「默认为阴性，勾选阳性症状即可」
    // 已经不成立——现在没勾不等于阴性，没问过就是未问，一个字都不写。
    // 同时把「标阴性」这条路径也认进来（v.negative），否则用户全点阴性还会被反复提醒。
    const rosTouched = Object.keys(r.ros || {}).some(sysKey =>
      Object.values(r.ros[sysKey] || {}).some(v => v && (v.checked || v.negative || v.detail || v.time))
    );
    if (!rosTouched) {
      w.push('【系统回顾】尚未问诊。未点选的症状不会写进病历；过一遍问诊后，阳性点红、明确阴性的点「阴性」。');
    }
    // 【婚姻史】静默丢失（缺陷2第3条）：
    // 这一节以前 `if (!status) return ''`，空就整节消失，而 validate 里没有任何一项检查它，
    // 用户完全不知道自己漏了婚姻史。现在正文有占位符，同时这里补一条提醒。
    if (!stripTail((r.marriage || {}).status) && !stripTail((r.basic || {}).marital)) {
      w.push('【婚姻史】未填写。');
    }
    // 【个人史】冶游史属隐私项，不填不算缺项，但完全没填个人史时要提示（缺陷4）
    const per = r.personal || {};
    if (!stripTail(per.residence) && !stripTail(per.travel) && !per.smoking && !per.drinking &&
        !stripTail(per.occupationEnv) && !stripTail(per.sexualHistory) && !stripTail(per.drugs)) {
      w.push('【个人史】未填写（至少需要居住情况、烟酒嗜好、职业与工作条件、冶游史）。');
    }
    const abn = abnormalPE(r);
    if (!abn.length && !Object.keys((r.pe || {}).vitals || {}).length) {
      w.push('【体格检查】未录入异常或生命体征。');
    }
    // 缺陷B4（已复现）：心脏听诊的默认描述里带具体数值（「心率78次/分」），
    // 学生勾了这一项却没改数字，病历里就会出现「心脏听诊：心率78次/分」与
    // 「P 88次/分」并存，两条数字互相矛盾，而 validate 一条提醒都不给。
    // 程序不替学生改数字（改了就是编造），只把矛盾指出来让他自己核对。
    const pulseRaw = String((((r.pe || {}).vitals) || {}).pulse || '').match(/\d+/);
    if (pulseRaw) {
      const hr = (buildPE(r) || '').match(/心率\s*(\d+)\s*次\/分/);
      if (hr && hr[1] !== pulseRaw[0]) {
        w.push(`【体格检查】心脏听诊写的心率 ${hr[1]} 次/分 与生命体征 P ${pulseRaw[0]} 次/分 不一致，请核对。`);
      }
    }
    // 通用查体（系统默认值）与专科查体互相否定时只提醒、不改正文，见 peConflicts。
    peConflicts(r).forEach(msg => w.push(msg));
    // 数值、日期、科室与年龄——这三类不需要看病人就能判断「写错了」
    checkVitals(r, w);
    checkDates(r, w);
    checkDeptAge(r, w);
    if (!((r.diagnosis || {}).confirmed || []).length) w.push('【初步诊断】未填写，可参考"诊断提示"。');
    else warnDiagnosisOrder(r, w);
    if (!stripTail(r.summary || '')) {
      w.push('【摘要】目前为自动生成的初稿，请核对并润色后再定稿。');
    }

    // 首次病程录（第5页/第6页）：只提醒「有缺项」，不把提示写进病历正文
    const soap = r.soap || {};
    const a = soap.a || {};
    const p = soap.p || {};
    if (!(Array.isArray(a.diff) && a.diff.some(d => d && stripTail(d.diagnosis)))) {
      w.push('【首次病程录】鉴别诊断未填写，建议围绕主要诊断写 2 条左右，说明为什么考虑、哪一点不支持。');
    }
    if (!(Array.isArray(p.perDiagnosis) && p.perDiagnosis.some(x => x && stripTail(x.diagnosis)))) {
      w.push('【首次病程录】诊疗计划尚未按诊断逐条列出检查与治疗措施。');
    }
    if (Array.isArray(a.diff) && a.diff.length) {
      const chk = diffRelatedToDiagnosis(r);
      if (chk.unrelated.length) {
        w.push(`【首次病程录】${chk.unrelated.join('、')} 与现有诊断关联不明确，请确认是否保留。`);
      }
    }

    // 出院记录：六项缺任一项都会让记录不完整
    const d = r.discharge || {};
    const adv = d.advice || {};
    if (!stripTail(d.dischargeStatus)) w.push('【出院记录】出院情况未填写。');
    if (!stripTail(d.dischargeDate)) w.push('【出院记录】出院日期未填写，住院天数无法计算。');
    const advMissing = ['drug', 'nonDrug', 'lifestyle', 'followUp'].filter(k => !stripTail(adv[k]));
    if (advMissing.length === 4) {
      w.push('【出院记录】出院医嘱未填写（药物、非药物、生活指导、复诊时间四项）。');
    } else if (advMissing.length) {
      w.push(`【出院记录】出院医嘱缺：${advMissing.map(k => ({
        drug: '药物治疗', nonDrug: '非药物治疗', lifestyle: '生活指导', followUp: '复诊时间'
      })[k]).join('、')}。`);
    }
    return w;
  }

  return {
    generate, generatePlain, validate,
    buildBasicInfo, buildChiefComplaint, buildHPI, buildROS, buildPMH,
    buildPersonal, buildMarriage, buildMenstruation, buildChildbirth,
    buildMarriageChildbirth,
    buildFamily, buildPE, buildVitals, buildAuxiliary, buildSummary,
    buildDiagnosis, draftSummary, draftHPI, abnormalPE, peValue, collectROS, firstCourseSelfCheck, diffRelatedToDiagnosis, buildMarriageHistory, buildMenstruationChildbirth, buildBasisSection, renderPEGroup,
    // 查体项聚合（父项 / 子项去重）
    peEntries, buildFocusPE,
    // 首次病程录（SOAP）与出院记录
    buildFirstCourseRecord, buildDischargeRecord,
    draftCaseSummary, draftObjectivePE, draftObjectiveAux, draftBasisDetail,
    diffRelatedToDiagnosis, diagnosisList, auxItems, hospitalDays,
    mergeIntoHistory,
    joinSentences, stripTail, SECTION_ORDER
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GENERATOR;
}
