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

  /**
   * 一般项目。
   *
   * 按病历书写规范一行一项（见用户提供的模板），不再挤成一句。
   */
  function buildBasicInfo(r) {
    const b = r.basic || {};
    const lines = [];
    const age = ageWithUnit(b);

    if (b.name) lines.push(`姓名：${b.name}`);
    if (stripTail(b.recordNo)) lines.push(`住院号：${stripTail(b.recordNo)}`);
    if (b.gender) lines.push(`性别：${b.gender}`);
    if (age) lines.push(`年龄：${age}`);
    lines.push(`民族：${stripTail(b.nationality) || SCHEMA.NATIONALITY}`);
    if (b.nativePlace) lines.push(`籍贯：${b.nativePlace}`);
    if (b.birthPlace) lines.push(`出生地：${b.birthPlace}`);
    const marital = (r.marriage || {}).status || b.marital;
    if (marital) lines.push(`婚姻：${marital}`);
    if (b.occupation) lines.push(`职业：${b.occupation}`);
    if (b.workUnit) lines.push(`工作单位：${b.workUnit}`);
    if (b.address) lines.push(`通讯地址：${b.address}`);
    if (b.phone) lines.push(`电话号码：${b.phone}`);
    if (b.admitDate) lines.push(`入院日期：${b.admitDate}`);
    if (b.recordDate) lines.push(`记录日期：${b.recordDate}`);
    const who = b.informant || (b.name ? `患者本人（${b.name}）` : '');
    if (who) lines.push(`病史陈述者：${who}`);
    if (b.reliability) lines.push(`病史可靠程度：${b.reliability}`);
    return lines.join('\n');
  }

  /* ---------------------------- 主诉 ---------------------------- */

  function buildChiefComplaint(r) {
    const b = r.basic || {};
    const cc = stripTail(b.chiefComplaint);
    if (!cc) return '';
    let dur = stripTail(b.chiefComplaintDuration);
    if (!dur) return `${cc}。`;

    const unit = b.chiefComplaintDurationUnit || '';
    // 用户已经写了单位就不再加
    if (!/[天日周月年小时分]/.test(dur)) dur += unit;
    // 主诉正文里已包含该时长（"停经34周" + 34周）时不再重复
    if (cc.includes(dur)) return `${cc}。`;
    // 主诉以某个时间结束（"发现血压升高1周"），又单独填了时长时，直接以主诉为准
    if (/[0-9一二三四五六七八九十]+(天|日|周|月|年|小时|分钟)$/.test(cc)) return `${cc}。`;
    return `${cc}${dur}。`;
  }

  /* ---------------------------- 现病史 ---------------------------- */

  const HPI_DEFAULTS = {
    generalCondition: '发病以来，精神、食欲、睡眠可，大小便正常，体重无明显变化'
  };

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
    const gc = stripTail(h.generalCondition) || HPI_DEFAULTS.generalCondition;
    if (gc) seg.push(gc);
    // 与本病无关但仍需治疗的其他疾病（第6页现病史末项）
    const other = stripTail((r.pmh || {}).otherTreatDiseases);
    if (other) seg.push(`另有${other}，需继续治疗`);
    if (stripTail(h.extra)) seg.push(stripTail(h.extra));
    if (!seg.length) return '';
    let text = joinSentences(seg);
    // 开头不写主语时补上；已含"患者/孕妇/患儿"等主语则不再重复
    if (!/^(患者|患儿|产妇|孕妇|本人|家属|该)/.test(text)) {
      const child = r.basic && r.basic.department === 'pediatrics';
      text = (child ? '患儿' : '患者') + text;
    }
    return text;
  }

  /** 一键生成现病史初稿（只补齐空字段，不覆盖已写内容） */
  function draftHPI(r) {
    const h = r.hpi || {};
    const b = r.basic || {};
    const cc = stripTail(b.chiefComplaint) || '上述症状';
    const out = { ...h };
    const durText = stripTail(b.chiefComplaintDuration)
      ? stripTail(b.chiefComplaintDuration) + (b.chiefComplaintDurationUnit || '')
      : '';
    if (!stripTail(out.onset)) {
      out.onset = `${durText ? durText + '前' : ''}无明显诱因出现${cc}`;
    }
    if (!stripTail(out.generalCondition)) {
      out.generalCondition = HPI_DEFAULTS.generalCondition;
    }
    return out;
  }

  /* ---------------------------- 系统回顾 ---------------------------- */

  function collectROS(r) {
    const res = []; // [{ name, positives:[], negatives:[] }]
    SCHEMA.ROS.forEach(sys => {
      const store = (r.ros || {})[sys.key] || {};
      const positives = [];
      const negatives = [];
      sys.symptoms.forEach(sym => {
        const v = store[sym.key] || {};
        if (v.checked) {
          let s = sym.label;
          if (v.time) s += v.time;
          if (v.detail) s += '，' + v.detail;
          positives.push(s);
        } else {
          negatives.push(sym.label);
        }
      });
      res.push({ key: sys.key, name: sys.name, positives, negatives });
    });
    return res;
  }

  function buildROS(r, mode) {
    const data = collectROS(r);
    const allPositives = data.some(d => d.positives.length > 0);
    if (!allPositives && mode === 'brief') return '各系统回顾未见阳性症状。';
    const lines = [];
    data.forEach(d => {
      if (d.positives.length) {
        // 去掉与阳性项重复的阴性项（如阳性"头痛，偶有头晕"时不再写"无头晕"）
        const posText = d.positives.join('');
        const negs = d.negatives.filter(n => !posText.includes(n));
        const line = `${d.name}：${d.positives.join('；')}` +
          (negs.length ? `；无${joinList(negs)}` : '') + '。';
        lines.push(line);
      } else if (mode !== 'brief') {
        lines.push(`${d.name}：无${joinList(d.negatives)}。`);
      }
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
   */
  function buildPMH(r) {
    const p = r.pmh || {};
    const lines = [];

    // 1) 既往健康状况
    lines.push(`既往健康状况：${stripTail(p.health) ? '平素' + stripTail(p.health) : '平素体健'}`);

    // 2) 疾病史：手写详情优先，其次勾选，最后默认否认
    const checked = Object.keys(p.diseaseChecks || {}).filter(k => p.diseaseChecks[k] && k !== '其他');
    const other = stripTail(p.diseaseOther);
    const detail = stripTail(p.diseaseDetail);
    let disease;
    if (detail) disease = detail;
    else if (checked.length || other) disease = `既往患${joinList(checked.concat(other ? [other] : []))}`;
    else disease = '否认高血压、糖尿病、冠心病等慢性病史';
    lines.push(`疾病史：${disease}`);

    // 3) 传染病史
    lines.push(`传染病史：${stripTail(p.infection) || '否认肝炎、结核、伤寒等传染病史'}`);

    // 4) 预防接种史
    lines.push(`预防接种史：${stripTail(p.vaccine) || '按计划预防接种'}`);

    // 5) 过敏史
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
    } else {
      lines.push('过敏史：否认食物、药物过敏史');
    }

    // 6) 手术史  7) 外伤史  8) 输血史  9) 中毒史
    lines.push(`手术史：${stripTail(p.surgery) || '否认手术史'}`);
    lines.push(`外伤史：${stripTail(p.trauma) || '否认外伤史'}`);
    lines.push(`输血史：${stripTail(p.transfusion) || '否认输血史'}`);
    lines.push(`中毒史：${stripTail(p.poisoning) || '否认中毒史'}`);

    // 10) 长期用药
    lines.push(`长期用药：${stripTail(p.longTermMeds) || '否认长期用药史'}`);

    // 11) 与本病相关病史
    if (stripTail(p.relatedHistory)) lines.push(`与本病相关病史：${stripTail(p.relatedHistory)}`);

    // 12) 其它（其他需治疗的疾病 + 补充说明）
    const extras = [stripTail(p.otherTreatDiseases), stripTail(p.special)].filter(Boolean);
    if (extras.length) lines.push(`其它：${extras.join('；')}`);

    return lines.join('\n');
  }

  /* ---------------------------- 个人史 ---------------------------- */

  function buildPersonal(r) {
    const p = r.personal || {};
    const seg = [];
    // 母孕史 / 出生史 / 喂养史 / 生长发育史：儿科病历必写，成人可留空
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
    // 吸烟
    if (p.smoking === '有') {
      seg.push(`吸烟史：有${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (p.smoking === '已戒') {
      seg.push(`吸烟史：已戒烟${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (p.smoking === '无' || p.smoking) {
      seg.push('吸烟史：无');
    }
    if (p.drinking === '有') {
      seg.push(`饮酒史：有${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (p.drinking === '已戒') {
      seg.push(`饮酒史：已戒酒${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (p.drinking === '无' || p.drinking) {
      seg.push('饮酒史：无');
    }
    if (stripTail(p.drugs)) seg.push(`毒物接触史：${stripTail(p.drugs)}`);
    else seg.push('毒物接触史：否认毒物、粉尘及放射性物质接触史');
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
    return s + '。';
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
    if (!status) return '';
    if (status === '未婚') return '未婚。';
    let s = status;
    if (m.age) s += `，${m.age}岁结婚`;
    if (m.spouseHealth) s += `，配偶${stripTail(m.spouseHealth)}`;
    return s + '。';
  }

  /** 月经与生育史（模板里的独立一节） */
  function buildMenstruationChildbirth(r) {
    const b = r.basic || {};
    const parts = [];
    const men = buildMenstruation(r);
    if (men) parts.push(men.replace(/^月经史：/, '').replace(/。$/, ''));
    const cb = buildChildbirth(r);
    if (cb) parts.push(cb.replace(/^生育史：/, '').replace(/。$/, ''));
    if (!parts.length) {
      // 男性或无月经史者：明确写「无」，避免整节消失后被误认为漏采
      return b.gender === '女' ? '' : '无。';
    }
    return parts.join('，') + '。';
  }

  /** 兼容旧调用：婚姻 + 月经 + 生育合成一句 */
  function buildMarriageChildbirth(r) {
    const parts = [];
    const mar = buildMarriageHistory(r);
    if (mar) parts.push(mar.replace(/。$/, ''));
    const mc = buildMenstruationChildbirth(r);
    if (mc && mc !== '无。') parts.push(mc.replace(/。$/, ''));
    if (!parts.length) return '';
    return parts.join('，') + '。';
  }

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
    if (m.dysmenorrhea && m.dysmenorrhea !== '无') parts.push('有痛经');
    else if (m.dysmenorrhea === '无') parts.push('无痛经');
    if (m.menopauseAge) parts.push(`${m.menopauseAge}岁绝经`);
    if (m.lmp) parts.push(`末次月经${m.lmp}`);
    if (m.extra) parts.push(stripTail(m.extra));
    if (!parts.length) return '';
    return '月经史：' + parts.join('，') + '。';
  }

  function buildChildbirth(r) {
    const c = r.childbirth || {};
    const b = r.basic || {};
    const parts = [];
    if (c.gravida) parts.push(`孕${c.gravida}产${c.para || '0'}`);
    if (c.abortion) parts.push(`流产${c.abortion}次`);
    if (c.details) parts.push(stripTail(c.details));
    if (c.lastBirth) parts.push(`末次分娩${stripTail(c.lastBirth)}`);
    if (c.contraception) parts.push(`避孕方式：${stripTail(c.contraception)}`);
    if (!parts.length) {
      if (b.gender === '男') return '';
      if (c.applicable === '无') return '无生育史。';
      return '';
    }
    return '生育史：' + parts.join('，') + '。';
  }

  /* ---------------------------- 家族史 ---------------------------- */

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
    if (f.deceased) seg.push(stripTail(f.deceased));

    // ① 与本病相似的病情（手写优先，勾选兜底）
    const similar = stripTail(f.similarDisease);
    if (similar) seg.push(similar);
    else if (checked.length) seg.push(`家族中${joinList(checked)}病史`);
    else seg.push('家族中无类似疾病患者');

    // ② 两系三代遗传性疾病史（手写优先，未填给标准阴性表述）
    const three = stripTail(f.threeGeneration);
    seg.push(three || '两系三代否认遗传性疾病史');

    if (stripTail(f.other)) seg.push(stripTail(f.other));
    return joinSentences(seg);
  }

  /* ---------------------------- 体格检查 ---------------------------- */

  function vitalValue(v) {
    return v === undefined || v === null || v === '' ? '' : String(v).trim();
  }

  function buildVitals(r) {
    const v = (r.pe || {}).vitals || {};
    const parts = [];
    if (vitalValue(v.temperature)) parts.push(`T ${vitalValue(v.temperature)}℃`);
    if (vitalValue(v.pulse)) parts.push(`P ${vitalValue(v.pulse)}次/分`);
    if (vitalValue(v.respiration)) parts.push(`R ${vitalValue(v.respiration)}次/分`);
    if (vitalValue(v.sbp) || vitalValue(v.dbp)) {
      parts.push(`BP ${vitalValue(v.sbp) || '—'}/${vitalValue(v.dbp) || '—'}mmHg`);
    }
    if (vitalValue(v.height)) parts.push(`身高 ${vitalValue(v.height)}cm`);
    if (vitalValue(v.weight)) parts.push(`体重 ${vitalValue(v.weight)}kg`);
    if (vitalValue(v.headCirc)) parts.push(`头围 ${vitalValue(v.headCirc)}cm`);
    if (vitalValue(v.chestCirc)) parts.push(`胸围 ${vitalValue(v.chestCirc)}cm`);
    return parts.length ? parts.join('，') + '。' : '';
  }

  /** 某个查体条目的当前值：用户填的优先，否则用默认 */
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
   *  abdomen.abdPalpation 这类「父项 + 子项」结构：子项一旦被填写，父项必须让位，
   * 否则病历里会同时出现「全腹无压痛」和「右下腹浅触诊压痛」两种互相打架的描述。
   * 这里统一用 schema 导出的 parentSupersededByChild 判断，不在 generator 里
   * 再散落一套自己的规则。
   *
   * @returns {Array<{item:object, value:string}>} 只保留有值（要输出）的条目
   */
  function peEntries(r, groupKey, items) {
    const store = (r.pe || {})[groupKey] || {};
    return items
      // 父项被已填写的子项接管时，整项跳过
      .filter(it => !(SCHEMA.childPEItems(groupKey, it.key).length &&
        SCHEMA.parentSupersededByChild(store, groupKey, it.key)))
      .map(it => ({ item: it, value: stripTail(peValue(r, groupKey, it)) }))
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
      return [`${group.name}：${texts.join('。')}。`];
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
      let texts = dedupeTexts(sp.items.map(it => stripTail(peValue(r, 'special_' + spKey, it))));
      if (!texts.length) return;
      out.push(`${sp.name}：${texts.join('。')}。`);
    });

    const focus = buildFocusPE(r);
    if (focus) out.push(focus);
    return out.join('\n');
  }

  /** 去掉完全重复的条目（如「外生殖器」与「肛门」都写「未见异常」） */
  function dedupeTexts(texts) {
    return texts.filter((t, i) => t && texts.indexOf(t) === i);
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

      // 只写用户真正填过的项，默认值不写进"重点查体"（否则等于把没查的也列成重点）
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
    const NORMAL_PHRASE = /(营养良好|营养中等|营养一般|发育正常|发育良好|神志清楚|精神一般|精神可|自动体位|面容自然|查体合作|皮肤弹性良好|毛发分布均匀|气管居中|颈软|腹平软|脊柱生理弯曲存在|生理反射存在|肌力正常|肌力5级|肌力Ⅴ级|双肺呼吸音清|呼吸音清|前囟平软|愈合良好)/;

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
        const val = stripTail(peValue(r, 'special_' + spKey, it));
        if (!isPositiveFinding(it, val)) return;
        res.push({ group: sp.name, label: it.label, text: it.__positive, key: it.key });
      });
    });
    return res;
  }

  /* ---------------------------- 辅助检查 ---------------------------- */

  /** 规整后的辅助检查列表（名称与结果都已 trim，丢掉全空行） */
  function auxItems(r) {
    return (((r.auxiliary || {}).items) || [])
      .map(it => ({ name: stripTail((it || {}).name), result: stripTail((it || {}).result) }))
      .filter(it => it.name || it.result);
  }

  function buildAuxiliary(r) {
    const items = auxItems(r);
    if (!items.length) return '暂缺。';
    return items.map(it => {
      if (it.name && it.result) return `${it.name}：${it.result}。`;
      return (it.name || it.result) + '。';
    }).join('\n');
  }

  /* ---------------------------- 病历摘要 ---------------------------- */

  function buildSummary(r, opts) {
    const manual = stripTail((r.summary || '').trim());
    if (manual) return manual + '。';
    return draftSummary(r);
  }

  /** 自动生成病历摘要初稿 */
  function draftSummary(r) {
    const b = r.basic || {};
    const seg = [];

    // 1) 患者身份 + 主诉（直接复用主诉生成逻辑，避免时长重复追加）
    const who = [b.gender, ageWithUnit(b)].filter(Boolean).join('，');
    const ccFull = stripTail(buildChiefComplaint(r));  // 已含时长和句号
    const isChild = b.department === 'pediatrics';
    const subj = isChild ? '患儿' : '患者';
    let head = who ? `${subj}，${who}` : subj;
    if (ccFull) head += `，因“${ccFull}”来院`;
    seg.push(head);

    // 2) 现病史要点（取前两句，避免摘要过长）
    const hpi = buildHPI(r);
    if (hpi) {
      const sentences = hpi.split(/。/).map(s => s.trim()).filter(Boolean);
      seg.push(sentences.slice(0, 2).join('。'));
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
    const dedup = peAll.filter((txt, i) => {
      if (!/^P \d+次\/分$/.test(txt)) return true;
      const num = txt.match(/\d+/)[0];
      return !peAll.some((other, j) => j !== i && /心率/.test(other) && other.includes(num));
    });
    seg.push(dedup.length ? `查体：${dedup.join('，')}` : '查体未见明显阳性体征');

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

  function buildDiagnosis(r) {
    const list = ((r.diagnosis || {}).confirmed || []).map(s => stripTail(s)).filter(Boolean);
    if (!list.length) return '待补充。';
    return list.map((s, i) => `${i + 1}. ${s}`).join('\n');
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
    const subj = b.department === 'pediatrics' ? '患儿' : '患者';
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
    if (abn.length) seg.push(`查体：${abn.slice(0, 3).map(a => a.text).join('，')}`);
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
    const texts = parts.concat(abn.map(a => a.text).filter(Boolean));
    if (!texts.length) return '未见与诊断相关的阳性体征';
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
        pe: abn.length ? abn.slice(0, 2).map(a => a.text).join('，') : '',
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
      const body = sections[name];
      if (!body) return;
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
      if (!stripTail(b.chiefComplaintDuration)) w.push('【主诉】缺少持续时间。');
    }
    if (!(buildHPI(r) || '').trim()) w.push('【现病史】未填写。');
    // 系统回顾：只有完全没动过才提醒
    const rosTouched = Object.keys(r.ros || {}).some(sysKey =>
      Object.values(r.ros[sysKey] || {}).some(v => v && (v.checked || v.detail || v.time))
    );
    if (!rosTouched) {
      w.push('【系统回顾】尚未勾选，建议逐系统过一遍（默认为阴性，勾选阳性症状即可）。');
    }
    const abn = abnormalPE(r);
    if (!abn.length && !Object.keys((r.pe || {}).vitals || {}).length) {
      w.push('【体格检查】未录入异常或生命体征。');
    }
    if (!((r.diagnosis || {}).confirmed || []).length) w.push('【初步诊断】未填写，可参考"诊断提示"。');
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
