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

  /* ---------------------------- 一般项目 ---------------------------- */

  function buildBasicInfo(r) {
    const b = r.basic || {};
    const lines = [];
    const age = num(b.age);
    if (b.name) lines.push(`姓名：${b.name}`);
    if (b.gender) lines.push(`性别：${b.gender}`);
    if (age) lines.push(`年龄：${age}岁`);
    lines.push(`民族：${SCHEMA.NATIONALITY}`);
    if (b.marital) lines.push(`婚姻：${b.marital}`);
    if (b.occupation) lines.push(`职业：${b.occupation}`);
    if (b.birthPlace) lines.push(`籍贯：${b.birthPlace}`);
    if (b.address) lines.push(`现住址：${b.address}`);
    if (b.admitDate) lines.push(`入院日期：${b.admitDate}`);
    if (b.recordDate) lines.push(`记录日期：${b.recordDate}`);
    const who = b.informant || (b.name ? `患者本人（${b.name}）` : '患者本人');
    if (b.informant || b.name) lines.push(`病史陈述者：${who}`);
    if (b.reliability) lines.push(`病史可靠程度：${b.reliability}`);
    return lines.join('，') + '。';
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

  /** 根据结构化字段组装现病史 */
  function buildHPI(r) {
    const h = r.hpi || {};
    if (h.mode === 'manual') {
      return h.manual ? joinSentences([h.manual]) : '';
    }
    const seg = [];
    if (stripTail(h.onset)) seg.push(stripTail(h.onset));
    if (stripTail(h.symptoms)) seg.push(stripTail(h.symptoms));
    if (stripTail(h.evolution)) seg.push(stripTail(h.evolution));
    if (stripTail(h.accompanying)) seg.push(stripTail(h.accompanying));
    if (stripTail(h.treatment)) seg.push(stripTail(h.treatment));
    const gc = stripTail(h.generalCondition) || HPI_DEFAULTS.generalCondition;
    if (gc) seg.push(gc);
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

  function buildPMH(r) {
    const p = r.pmh || {};
    const seg = [];
    if (p.health) seg.push(`平素健康状况${p.health}`);

    // 慢性病史
    const checked = Object.keys(p.diseaseChecks || {}).filter(k => p.diseaseChecks[k] && k !== '其他');
    const other = stripTail(p.diseaseOther);
    const detail = stripTail(p.diseaseDetail);
    if (detail) {
      seg.push(detail);
    } else if (checked.length || other) {
      const list = checked.concat(other ? [other] : []);
      seg.push(`既往患${joinList(list)}`);
    } else {
      seg.push('否认高血压、糖尿病、冠心病等慢性病史');
    }

    if (stripTail(p.infection)) seg.push(`传染病史：${stripTail(p.infection)}`);
    else seg.push('否认肝炎、结核等传染病史');

    const surg = stripTail(p.surgery);
    const trauma = stripTail(p.trauma);
    if (surg && trauma) seg.push(`手术外伤史：${surg}；${trauma}`);
    else if (surg) seg.push(`手术史：${surg}`);
    else if (trauma) seg.push(`外伤史：${trauma}`);
    else seg.push('否认手术、外伤史');

    if (stripTail(p.transfusion)) seg.push(`输血史：${stripTail(p.transfusion)}`);
    else seg.push('否认输血史');

    if (stripTail(p.vaccine)) seg.push(`预防接种史：${stripTail(p.vaccine)}`);

    // 过敏史
    if (p.allergy === '有') {
      const allergens = Object.keys(p.allergenChecks || {}).filter(k => p.allergenChecks[k] && k !== '其他');
      if (p.allergenOther) allergens.push(p.allergenOther);
      let s = '有药物或食物过敏史';
      if (allergens.length) s += `，对${joinList(allergens)}过敏`;
      if (p.allergyReaction) s += `，表现为${p.allergyReaction}`;
      seg.push(s);
    } else {
      seg.push('否认食物、药物过敏史');
    }
    if (stripTail(p.special)) seg.push(stripTail(p.special));
    return joinSentences(seg);
  }

  /* ---------------------------- 个人史 ---------------------------- */

  function buildPersonal(r) {
    const p = r.personal || {};
    const seg = [];
    if (stripTail(p.birth)) seg.push(stripTail(p.birth));
    // 籍贯已在一般项目，个人史这里只写居住情况
    if (stripTail(p.residence) && !/^久居/.test(stripTail(p.residence))) {
      seg.push(`久居${stripTail(p.residence)}`);
    } else if (stripTail(p.residence)) {
      seg.push(stripTail(p.residence));
    }
    if (stripTail(p.travel)) seg.push(`近期${stripTail(p.travel)}`);
    // 吸烟
    if (p.smoking === '有') {
      seg.push(`有吸烟史${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (p.smoking === '已戒') {
      seg.push(`有吸烟史，已戒烟${p.smokingAmount ? '，' + stripTail(p.smokingAmount) : ''}`);
    } else if (p.smoking === '无' || p.smoking) {
      seg.push('无吸烟史');
    }
    if (p.drinking === '有') {
      seg.push(`有饮酒史${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (p.drinking === '已戒') {
      seg.push(`有饮酒史，已戒酒${p.drinkingAmount ? '，' + stripTail(p.drinkingAmount) : ''}`);
    } else if (p.drinking === '无' || p.drinking) {
      seg.push('无饮酒史');
    }
    if (stripTail(p.drugs)) seg.push(`毒物接触史：${stripTail(p.drugs)}`);
    else seg.push('否认毒物、粉尘及放射性物质接触史');
    if (stripTail(p.environment)) seg.push(stripTail(p.environment));
    if (stripTail(p.habits)) seg.push(stripTail(p.habits));
    return joinSentences(seg);
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

  /** 婚育史整段：婚姻 + 月经 + 生育 */
  function buildMarriageChildbirth(r) {
    const m = r.marriage || {};
    const b = r.basic || {};
    const parts = [];

    // 婚姻
    if (m.status === '未婚') {
      parts.push('未婚');
    } else {
      let s = m.status || b.marital || '';
      if (s) {
        if (m.age) s += `，${m.age}岁结婚`;
        parts.push(s);
      }
    }
    // 月经
    const men = buildMenstruation(r);
    if (men) parts.push(men.replace(/^月经史：/, '').replace(/。$/, ''));
    // 生育
    const cb = buildChildbirth(r);
    if (cb) parts.push(cb.replace(/^生育史：/, '').replace(/。$/, ''));

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

  function buildFamily(r) {
    const f = r.family || {};
    const checked = Object.keys(f.diseaseChecks || {}).filter(k => f.diseaseChecks[k]);
    const seg = [];
    if (f.deceased) seg.push(stripTail(f.deceased));
    if (checked.length) {
      seg.push(`家族中${joinList(checked)}病史`);
    } else {
      seg.push('家族中无类似疾病患者');
    }
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

  function buildPE(r) {
    const deptKey = (r.basic || {}).department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    const out = [];
    const vit = buildVitals(r);
    if (vit) out.push(vit);

    SCHEMA.PE_COMMON.forEach(group => {
      const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
      if (!items.length) return;
      let texts = items.map(it => stripTail(peValue(r, group.key, it))).filter(Boolean);
      // 去掉完全重复的条目（如「外生殖器」与「肛门」都写「未见异常」）
      texts = texts.filter((t, i) => texts.indexOf(t) === i);
      if (!texts.length) return;
      out.push(`${group.name}：${texts.join('。')}。`);
    });

    (dept.special || []).forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      let texts = sp.items.map(it => stripTail(peValue(r, 'special_' + spKey, it))).filter(Boolean);
      texts = texts.filter((t, i) => texts.indexOf(t) === i);
      if (!texts.length) return;
      out.push(`${sp.name}：${texts.join('。')}。`);
    });
    return out.join('\n');
  }

  /** 返回与默认值不同的异常体征列表（用于摘要和诊断提示） */
  function abnormalPE(r) {
    const deptKey = (r.basic || {}).department || 'general';
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
    const res = [];
    const push = (groupName, item, val) => {
      if (!val) return;
      if (item.default && val === item.default) return;
      res.push({ group: groupName, label: item.label, text: val, key: item.key });
    };

    // 摘要只取真正的阳性描述：逐句拆分，剔除"无…/未见…"等阴性句
    // 否定可能出现在句中（"各瓣膜听诊区未闻及病理性杂音"），因此按短句+否定词位置双重判断
    const NEG_VERB = /(未闻及|未触及|未引出|未查见|未见|未扪及|无|没有|否认|阴性)/;
    const isPositiveFinding = (item, val) => {
      if (!val) return false;
      if (item.default && val === item.default) return false;
      const positiveClauses = [];
      val.split(/[。；;]/).forEach(sentence => {
        sentence.split(/[，,]/).forEach(clause => {
          const c = clause.trim();
          if (!c) return;
          if (NEG_VERB.test(c)) return;
          positiveClauses.push(c);
        });
      });
      if (!positiveClauses.length) return false;
      item.__positive = positiveClauses.join('，');
      return true;
    };

    SCHEMA.PE_COMMON.forEach(group => {
      group.items
        .filter(it => !it.depts || it.depts.includes(deptKey))
        .forEach(it => {
          const val = stripTail(peValue(r, group.key, it));
          if (!isPositiveFinding(it, val)) return;
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

  function buildAuxiliary(r) {
    const items = ((r.auxiliary || {}).items || []).filter(
      it => stripTail(it.name) || stripTail(it.result)
    );
    if (!items.length) return '暂缺。';
    return items.map(it => {
      const n = stripTail(it.name);
      const v = stripTail(it.result);
      if (n && v) return `${n}：${v}。`;
      return (n || v) + '。';
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
    const who = [b.gender, b.age ? b.age + '岁' : ''].filter(Boolean).join('，');
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
    seg.push(peAll.length ? `查体：${peAll.join('，')}` : '查体未见明显阳性体征');

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

  /* ---------------------------- 组装全文 ---------------------------- */

  const SECTION_ORDER = [
    '一般项目', '主诉', '现病史', '既往史', '系统回顾', '个人史',
    '婚育史', '家族史', '体格检查', '辅助检查',
    '病历摘要', '初步诊断'
  ];

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
    sections['婚育史'] = buildMarriageChildbirth(r);
    sections['家族史'] = buildFamily(r);
    sections['体格检查'] = buildPE(r);
    sections['辅助检查'] = buildAuxiliary(r);
    sections['病历摘要'] = buildSummary(r);
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

  /** 纯文本导出（不用【】标题，接近纸质大病历的书写格式） */
  function generatePlain(r, opts = {}) {
    const { sections } = generate(r, opts);
    const out = [];
    SECTION_ORDER.forEach(n => {
      const body = sections[n];
      if (!body) return;
      if (n === '初步诊断') out.push('初步诊断：\n' + body);
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
      w.push('【病历摘要】目前为自动生成的初稿，请核对并润色后再定稿。');
    }
    return w;
  }

  return {
    generate, generatePlain, validate,
    buildBasicInfo, buildChiefComplaint, buildHPI, buildROS, buildPMH,
    buildPersonal, buildMarriage, buildMenstruation, buildChildbirth,
    buildMarriageChildbirth,
    buildFamily, buildPE, buildVitals, buildAuxiliary, buildSummary,
    buildDiagnosis, draftSummary, draftHPI, abnormalPE, peValue, collectROS,
    joinSentences, stripTail, SECTION_ORDER
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GENERATOR;
}
