/* ============================================================
 * 问诊深度自查（DEPTH）
 * ------------------------------------------------------------
 * 来历：学生把四份见习带教笔记交过来，里面带教老师反复纠正的
 * 不是「你没问」，而是「你问到了，但没问深」——
 *
 *   · 主诉写「解黑便3日」，其实患者正月里饮酒后就有上腹胀痛伴头晕，
 *     主诉漏掉了前驱症状，带教说「这才是他的一个完整的病史」；
 *   · 现病史写「伴呕吐」，带教追问的是「一天吐几次？吐的是什么？
 *     和吃饭有没有关系？」；
 *   · 既往史勾了「高血压」，带教说「高血压的药尽量要问出来，
 *     因为就涉及到接下来这个血压高我们要用什么药」；
 *   · 手术史写「结肠肿瘤手术」，带教问「几几年做的？在哪里做的？
 *     手术过程是怎样的？」；
 *   · 阴性症状一条都没写，带教说「你这里面没有写任何的阴性症状」。
 *
 * 这个模块只做一件事：把「提到了但没写细」的位置指出来。
 * 它**绝不替学生补内容**——没问到的就是没问到，编一句「无发热」
 * 比空着危险得多（病历「避免任何臆断或虚构」，《诊断学》第10版）。
 *
 * 三条边界：
 *   1. 只读学生自己写的自由文本（现病史、既往史、手术史等），
 *      不读模板、不读系统默认描述，所以不会把默认文案当成学生的话。
 *   2. 否定的提及不算提及——「无呕吐」不会被要求补呕吐次数。
 *   3. 全部结论都是**提示**，进不了病历正文。
 * ============================================================ */

var DEPTH = (function () {
  'use strict';

  // ---------- 基础工具 ----------

  function isText(v) {
    return typeof v === 'string' && v.trim() !== '';
  }

  function t(v) {
    return isText(v) ? v.trim() : '';
  }

  /** 把一段叙述切成最小分句 */
  function splitClauses(text) {
    return String(text || '')
      .split(/[，,；;。\n]/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  // 否定词。注意不能放单字「不」：「不洁饮食后呕吐」里呕吐是阳性。
  var NEG_TOKENS = /(?:无|未见|未出现|未诉|否认|没有|不伴|无明显|未曾|未)/;

  /** 触发词在这一分句里是否被前面的否定词管着 */
  function negatedAt(clause, idx) {
    var before = clause.slice(Math.max(0, idx - 8), idx);
    return NEG_TOKENS.test(before);
  }

  /**
   * 取出年龄的数值。
   *
   * ⚠️ 不能写 Number(String(age||'').match(/\d+/))：没填年龄时 match 返回 null，
   * Number(null) === 0，于是每个没填年龄的病人都会被当成 0 岁儿童，
   * 「儿科个人史没填」这条提示会对着成人病历天天喊（实测踩过）。
   * 取不到就必须返回 NaN，让调用方自己决定跳过。
   */
  function ageOf(r) {
    var b = (r || {}).basic || {};
    var m = String(b.age === undefined || b.age === null ? '' : b.age).match(/\d+/);
    if (!m) return NaN;
    var n = Number(m[0]);
    return isFinite(n) && n > 0 ? n : NaN;
  }

  /** 找出所有「没被否定的提及」，返回分句下标 */
  function mentions(clauses, trig) {
    var hits = [];
    clauses.forEach(function (c, i) {
      var m = c.match(trig);
      if (!m) return;
      if (negatedAt(c, m.index)) return;
      hits.push(i);
    });
    return hits;
  }

  /**
   * 症状的「作用域」。
   *
   * 中文病历里症状和它的量化描述常常被逗号分开：
   *   「伴呕吐，每日3～4次，为胃内容物」
   * 只在触发分句里找量化，会把写清楚的也报出来（原型阶段实测踩过）。
   * 所以从触发分句往后延伸，直到遇见含**别的**症状触发词的分句为止。
   */
  function scopeText(clauses, startIdx, allTriggers, ownTrigger) {
    var parts = [clauses[startIdx]];
    for (var i = startIdx + 1; i < clauses.length; i++) {
      var c = clauses[i];
      var other = allTriggers.some(function (re) {
        return re !== ownTrigger && re.test(c);
      });
      if (other) break;
      parts.push(c);
    }
    return parts.join('，');
  }

  // ---------- 数字与时长 ----------

  var CN_NUM = {
    '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '半': 0.5
  };

  function parseNum(s) {
    if (!s) return NaN;
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s === '半') return 0.5;
    if (s === '数' || s === '几') return 3;
    if (/^十[一二三四五六七八九]?$/.test(s)) return 10 + (CN_NUM[s.charAt(1)] || 0);
    if (/^[一二三四五六七八九]十[一二三四五六七八九]?$/.test(s)) {
      return CN_NUM[s.charAt(0)] * 10 + (CN_NUM[s.charAt(2)] || 0);
    }
    return CN_NUM[s] || NaN;
  }

  function toDays(num, unit) {
    if (!isFinite(num)) return NaN;
    if (unit === '年') return num * 365;
    if (unit === '月') return num * 30;
    if (unit === '周') return num * 7;
    if (unit === '日' || unit === '天') return num;
    if (unit === '小时') return num / 24;
    return NaN;
  }

  var DUR_RE = /(\d+(?:\.\d+)?|[一二两三四五六七八九十半数几]+)\s*(?:个)?\s*(年|月|周|日|天|小时)/;

  /** 从一段文字里取出第一个时长，换算成天；取不到返回 NaN */
  function durationDays(text) {
    var m = String(text || '').match(DUR_RE);
    if (!m) return NaN;
    return toDays(parseNum(m[1]), m[2]);
  }

  /**
   * 从一段文字里取出**最长**的时长，换算成天。
   *
   * 现病史里通常先写本次病程（「3天前」）、后面才交代前驱症状（「正月饮酒后」），
   * 用第一个时长判断「有没有追溯到更早的病程」永远只看得到 3 天（实测踩过）。
   */
  function maxDurationDays(text) {
    var re = new RegExp(DUR_RE.source, 'g');
    var best = NaN;
    var m;
    while ((m = re.exec(String(text || ''))) !== null) {
      var d = toDays(parseNum(m[1]), m[2]);
      if (isFinite(d) && (!isFinite(best) || d > best)) best = d;
    }
    return best;
  }

  // ---------- 症状清单 ----------
  //
  // 每个症状列出「带教认为必须写清的几件事」，缺任何一项就提示。
  // 词表全部取自四份笔记的原文要求，没有自己加戏。

  var SYMPTOMS = [
    {
      key: 'vomit', name: '呕吐', trig: /呕吐/,
      aspects: [
        {
          name: '次数',
          re: /(每日|每天|一日|一天|1日)\s*[0-9一二三四五六七八九十]+|[0-9一二三四五六七八九十]+\s*次|偶有|频繁|多次|次数/
        },
        {
          name: '呕吐物性状',
          re: /胃内容物|胆汁|咖啡样|咖啡色|血性|宿食|食物残渣|酸水|黄绿色|米汤样/
        }
      ],
      tip: '呕吐要写清每天几次、吐出的是什么（胃内容物／胆汁／咖啡样／血性／宿食），以及与进食、腹痛的关系。'
    },
    {
      key: 'melena', name: '黑便', trig: /黑便|柏油样?便/,
      aspects: [
        {
          name: '次数或量',
          re: /[0-9一二三四五六七八九十]+\s*次|每次|量约|[0-9]+\s*(?:ml|毫升|g|克)|鸡蛋|拳头|瓶|碗|较多|少量|量多|量少/
        },
        {
          name: '性状',
          re: /柏油样|柏油|成形|稀|糊状|黑亮|发亮|暗红/
        }
      ],
      tip: '黑便要说清每天几次、每次大概多少（用「一个鸡蛋大小」「半瓶矿泉水」这种具象说法最好）、是成形还是稀糊。出血量评估全靠这个。'
    },
    {
      key: 'hematemesis', name: '呕血', trig: /呕血|呕咖啡/,
      aspects: [
        { name: '量', re: /[0-9]+\s*(?:ml|毫升)|量约|每次|少量|大量|一口|数口/ },
        { name: '颜色', re: /鲜红|咖啡|暗红|暗褐|紫红/ }
      ],
      tip: '呕血要写清量（约多少毫升）和颜色（鲜红／咖啡样），这两项直接决定出血量和出血速度的判断。'
    },
    {
      key: 'abdpain', name: '腹痛', trig: /腹[^，。；]{0,4}(?:疼|痛)/,
      aspects: [
        { name: '是持续性还是阵发性', re: /持续性|阵发性|间歇性|反复|持续|阵发/ }
      ],
      tip: '腹痛必须写清是持续性还是阵发性——只写「隐痛」「胀痛」不够，这一项决定鉴别方向。'
    },
    {
      key: 'diarrhea', name: '腹泻', trig: /腹泻/,
      aspects: [
        { name: '次数', re: /[0-9一二三四五六七八九十]+\s*次|每日|每天|多次/ },
        { name: '性状', re: /水样|糊状|稀便|稀水|黏液|脓血|蛋花|米泔/ }
      ],
      tip: '腹泻要写清每天几次、大便什么性状（水样／糊状／黏液／脓血）。'
    },
    {
      key: 'fever', name: '发热', trig: /发热|发烧/,
      aspects: [
        {
          name: '体温或热型',
          re: /最高|体温[^，。；]{0,6}[0-9]|[0-9]+\.?[0-9]*\s*℃|[0-9]+\s*度|热型|弛张|稽留|间歇热|午后低热|寒战/
        }
      ],
      tip: '发热要写清最高多少度、什么热型、有没有寒战。'
    },
    {
      key: 'cough', name: '咳嗽', trig: /咳嗽/,
      aspects: [
        { name: '干咳还是湿咳（有没有痰）', re: /干咳|湿咳|湿性|咳痰|无痰|有痰|痰/ },
        { name: '昼夜节律', re: /夜间|日间|白天|晨起|阵发|连咳|持续/ }
      ],
      tip: '咳嗽要写清是干咳还是湿咳、痰的颜色和量、白天重还是夜间重。'
    }
  ];

  var TRIGGERS = SYMPTOMS.map(function (s) { return s.trig; });

  // ---------- 规则：症状量化 ----------

  function checkSymptoms(r) {
    var out = [];
    var h = r.hpi || {};
    var narrative = [h.onset, h.cause, h.symptoms, h.relief, h.evolution, h.accompanying]
      .filter(isText).join('，');
    if (!narrative) return out;

    var clauses = splitClauses(narrative);
    var cc = t((r.basic || {}).chiefComplaint);

    SYMPTOMS.forEach(function (sym) {
      var hits = mentions(clauses, sym.trig);
      if (!hits.length) return;

      var scope = hits.map(function (i) {
        return scopeText(clauses, i, TRIGGERS, sym.trig);
      }).join('，');

      var missing = sym.aspects.filter(function (a) { return !a.re.test(scope); })
        .map(function (a) { return a.name; });
      if (!missing.length) return;

      // 主诉里也写了这个症状 → 这一项是核心症状，缺细节更严重
      var inCC = sym.trig.test(cc);
      out.push({
        id: 'sym:' + sym.key,
        level: inCC ? 'high' : 'mid',
        section: '现病史',
        message: '写了「' + sym.name + '」，但没写' + missing.join('、') + '。' + sym.tip
      });
    });

    return out;
  }

  // ---------- 规则：阴性鉴别症状 ----------

  var NEG_SYMPTOM_WORDS = [
    '发热', '发烧', '呕血', '黑便', '腹痛', '腹胀', '胸痛', '胸闷', '心悸', '气促',
    '呼吸困难', '恶心', '呕吐', '腹泻', '便秘', '黄疸', '体重下降', '消瘦', '盗汗',
    '咳嗽', '咳痰', '咯血', '头晕', '头痛', '水肿', '尿频', '尿急', '尿痛', '皮疹',
    '关节痛', '乏力', '食欲', '晕厥', '黑矇'
  ];

  var NEG_SYMPTOM_RE = new RegExp(
    '(?:无|未见|未出现|否认|没有|不伴|无明显)[^，。；]{0,8}(?:' +
    NEG_SYMPTOM_WORDS.join('|') + ')'
  );

  function checkNegative(r) {
    var out = [];
    var h = r.hpi || {};
    if (t(h.negativeDiscriminating)) return out;

    var narrative = [h.onset, h.symptoms, h.evolution, h.accompanying, h.treatment]
      .filter(isText).join('，');
    if (!narrative) return out;
    if (NEG_SYMPTOM_RE.test(narrative)) return out;

    out.push({
      id: 'neg-symptom',
      level: 'high',
      section: '现病史',
      message: '现病史里一条有鉴别诊断意义的阴性症状都没有。带教原话：「你这里面没有写任何的阴性症状」。' +
        '至少补上与本病例最需要排除的那几个（例如消化科的上消化道出血要写无呕血、无发热、无体重下降）。'
    });
    return out;
  }

  // ---------- 规则：慢病只写了病名 ----------

  var CHRONIC = [
    '高血压', '糖尿病', '冠心病', '心力衰竭', '高脂血症', '脑卒中',
    '慢性阻塞性肺疾病', '哮喘', '痛风', '甲状腺功能亢进', '甲状腺功能减退',
    '类风湿关节炎', '慢性肾脏病', '肝硬化'
  ];

  var MED_RE = /药|服用|口服|用药|治疗|控制/;

  function checkChronic(r) {
    var out = [];
    var p = r.pmh || {};
    var checks = p.diseaseChecks || {};
    var hit = CHRONIC.filter(function (d) { return checks[d]; });
    if (!hit.length) return out;

    var meds = t(p.longTermMeds);
    var detail = t(p.diseaseDetail);
    var hasMed = !!meds || MED_RE.test(detail);

    if (!hasMed) {
      out.push({
        id: 'chronic-meds',
        level: 'high',
        section: '既往史',
        message: '「' + hit.join('」「') + '」只写了病名，没写用什么药、多大剂量、控制得怎么样。' +
          '带教原话：「高血压的药尽量要问出来，因为就涉及到接下来这个血压高我们要用什么药」。' +
          '还要问一句家里有没有监测血压／血糖。'
      });
      return out;
    }

    // 写了用药，但没写控制情况
    if (!/控制|监测|平稳|达标|良好|欠佳|不佳|正常/.test(meds + detail)) {
      out.push({
        id: 'chronic-control',
        level: 'mid',
        section: '既往史',
        message: '「' + hit.join('」「') + '」写了用药，但没写控制情况（家里是否监测、血压／血糖大概多少、控制得满意不满意）。'
      });
    }
    return out;
  }

  // ---------- 规则：手术史缺年份／地点／术式 ----------

  function checkSurgery(r) {
    var out = [];
    var p = r.pmh || {};
    var s = t(p.surgery);
    if (!s) return out;
    // 「否认手术史」这类不算
    if (/^(否认|无|未|没有)/.test(s)) return out;

    var missing = [];
    if (!/(\d{4}|[0-9一二三四五六七八九十]+)\s*年/.test(s)) missing.push('哪一年做的');
    if (!/(医院|卫生院|保健院|卫生院|中心|诊所)/.test(s)) missing.push('在哪家医院做的');
    if (!/(术|切除|修补|吻合|置换|结扎|探查|引流|固定|方式)/.test(s)) missing.push('做的什么手术');

    if (!missing.length) return out;
    out.push({
      id: 'surgery-detail',
      level: 'high',
      section: '既往史',
      message: '手术史写了「' + s + '」，但没写' + missing.join('、') + '。' +
        '带教原话：「你们问手术的时候没有问几几年做的，在哪里做的手术，手术过程是怎样的，这些也要写进去」。'
    });
    return out;
  }

  // ---------- 规则：心血管病人漏问抗栓药 ----------

  var CARDIO_HISTORY = ['冠心病', '脑卒中', '心力衰竭'];
  var ANTITHROMBOTIC_RE = /阿司匹林|氯吡格雷|替格瑞洛|华法林|利伐沙班|达比加群|抗凝|抗血小板|双抗/;

  function checkAntithrombotic(r) {
    var out = [];
    var p = r.pmh || {};
    var checks = p.diseaseChecks || {};
    var text = [t(p.diseaseDetail), t(p.diseaseOther), t(p.longTermMeds), t(p.relatedHistory)].join('，');
    var risky = CARDIO_HISTORY.some(function (d) { return checks[d]; }) ||
      /房颤|心房颤动|支架|起搏器|瓣膜|换瓣/.test(text);
    if (!risky) return out;
    if (ANTITHROMBOTIC_RE.test(text)) return out;

    out.push({
      id: 'antithrombotic',
      level: 'mid',
      section: '既往史',
      message: '病人有心血管病史，但没问抗血小板／抗凝药（阿司匹林、氯吡格雷、华法林、利伐沙班等）。' +
        '这类药术前一般要停 5～7 天，停不了的要改用低分子肝素桥接——直接影响手术能不能做、什么时候做。'
    });
    return out;
  }

  // ---------- 规则：主诉与现病史时间对不上 ----------

  function checkDurationMatch(r) {
    var out = [];
    var b = r.basic || {};
    var h = r.hpi || {};
    var ccDays = durationDays(b.chiefComplaintDuration);
    if (!isFinite(ccDays)) ccDays = durationDays(b.chiefComplaint);
    var onsetDays = durationDays(h.onset);
    if (!isFinite(ccDays) || !isFinite(onsetDays)) return out;
    if (ccDays <= 0 || onsetDays <= 0) return out;

    var lo = Math.min(ccDays, onsetDays);
    var hi = Math.max(ccDays, onsetDays);
    if (hi - lo <= 1) return out;        // 一天以内不算矛盾
    if (hi <= lo * 1.3) return out;      // 三成以内属写法差异

    out.push({
      id: 'duration-mismatch',
      level: 'mid',
      section: '主诉',
      message: '主诉写的时长和现病史的起病时间对不上（主诉约 ' + fmtDays(ccDays) +
        '，现病史起病于 ' + fmtDays(onsetDays) + ' 前）。' +
        '带教原话：「上面七天，下面不要写六天」——上下必须一致。'
    });
    return out;
  }

  function fmtDays(d) {
    if (d >= 365) return round1(d / 365) + ' 年';
    if (d >= 30) return round1(d / 30) + ' 个月';
    if (d >= 1) return round1(d) + ' 天';
    return round1(d * 24) + ' 小时';
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  // ---------- 规则：主诉没追溯到完整病程 ----------

  function checkOnsetTrace(r) {
    var out = [];
    var b = r.basic || {};
    var h = r.hpi || {};
    var ccDays = durationDays(b.chiefComplaintDuration);
    if (!isFinite(ccDays)) ccDays = durationDays(b.chiefComplaint);
    if (!isFinite(ccDays) || ccDays > 30) return out;   // 主诉本身就长，不存在"没追溯"

    var narrative = [h.onset, h.cause, h.symptoms, h.evolution].filter(isText).join('，');
    if (!narrative) return out;

    // 取最长的那个时长，而不是第一个：现病史总是先写本次病程。
    var days = maxDurationDays(narrative);
    if (!isFinite(days) || days < 60) return out;
    // 还要差得够远才算「没追溯」。主诉 1 个月、现病史里写「数月来体重下降」
    // 只差三倍，那多半是另一个症状的病程，不是主诉该往前算——报出来就是冤枉人。
    // 真正的漏追溯（主诉 3 天 vs 病史数月）差的是十倍以上。
    if (days < ccDays * 4) return out;

    // 找出那个最长时长的原文，好在提示里引用
    var re = new RegExp(DUR_RE.source, 'g');
    var m;
    var shown = '';
    while ((m = re.exec(narrative)) !== null) {
      if (toDays(parseNum(m[1]), m[2]) === days) { shown = m[0]; break; }
    }

    out.push({
      id: 'onset-trace',
      level: 'high',
      section: '主诉',
      message: '主诉只写了 ' + fmtDays(ccDays) + '，但现病史里提到「' + (shown || fmtDays(days)) + '」。' +
        '这段时间里有没有症状？带教的原话是「这个病史就要从之前他的头晕开始讲，那才是他一个完整的病史」——' +
        '主诉很可能要从更早那次算起，比如「上腹胀痛数月，加重伴解黑便3日」。'
    });
    return out;
  }

  // ---------- 规则：时间表述歧义 ----------

  function checkAmbiguousDate(r) {
    var out = [];
    var h = r.hpi || {};
    var narrative = [h.onset, h.symptoms, h.evolution, h.treatment].filter(isText).join('，');
    if (!narrative) return out;

    // 「14日」到底是 14 号还是 14 天前？13 以上的裸「日」几乎一定是日期写法。
    // 排除「10月14日」（前面有月）和「14日前／14日余」（后面跟量词）。
    var re = /(?<![月年\d])(\d{1,2})\s*日(?![前后余来左右内])/g;
    var m;
    while ((m = re.exec(narrative)) !== null) {
      var n = Number(m[1]);
      if (!(n > 12)) continue;
      out.push({
        id: 'ambiguous-date',
        level: 'low',
        section: '现病史',
        message: '现病史里的「' + m[0] + '」有歧义——是 14 号，还是 14 天前？' +
          '带教要求写成「三天前」或「10月14号」，别让读病历的人猜。'
      });
      break;
    }
    return out;
  }

  // ---------- 规则：辅助检查没写在哪做的 ----------

  function checkAuxHospital(r) {
    var out = [];
    var items = ((r.auxiliary || {}).items) || [];
    var named = items.filter(function (it) { return it && isText(it.name); });
    if (!named.length) return out;
    var noHospital = named.filter(function (it) { return !isText(it.hospital); });
    if (noHospital.length < named.length) return out;   // 只要写了一家就不啰嗦

    out.push({
      id: 'aux-hospital',
      level: 'mid',
      section: '辅助检查',
      message: '辅助检查都没写是在哪做的。带教反复强调要区分「本院」和「外院」——' +
        '外院做的要写清机构名称和检查号，入院后做的检查不能出现在入院时的大病历里。'
    });
    return out;
  }

  // ---------- 规则：影像／内镜报告只写了「异常」，没抄分级 ----------

  // 带教原话（笔记3）：学生只写「外院 B 超异常」，把 BI-RADS 等级、
  // 建议手术的完整经过全丢了；甲状腺那位也是漏了 TI-RADS 4A 和穿刺建议。
  // 这些分级直接决定手术指征，不是可有可无的修饰。
  var GRADED_EXAMS = [
    { re: /乳腺|乳房|钼靶|BI-?RADS/i, grade: /BI-?RADS|0类|1类|2类|3类|4[ABC]?类?|5类|6类|RADS/i, name: 'BI-RADS 分级' },
    { re: /甲状腺|TI-?RADS/i, grade: /TI-?RADS|4[ABC]?类?|C?-?TIRADS/i, name: 'TI-RADS 分级' },
    { re: /胃镜|内镜|十二指肠镜/i, grade: /Forrest|Ⅰ[abc]?|Ⅱ[abc]?|Ⅲ|A[12]期|H[12]期|S[12]期|活动期|愈合期|瘢痕期/i, name: 'Forrest 分级或溃疡分期' }
  ];

  function checkAuxGrade(r) {
    var out = [];
    var items = ((r.auxiliary || {}).items) || [];
    GRADED_EXAMS.forEach(function (g) {
      // 这一科的检查写了几条
      var hit = items.filter(function (it) {
        return it && g.re.test(t(it.name) + '，' + t(it.result));
      });
      if (!hit.length) return;
      // 只要有一条写了分级就不啰嗦
      var graded = hit.some(function (it) { return g.grade.test(t(it.result)); });
      if (graded) return;
      out.push({
        id: 'aux-grade:' + g.name,
        level: 'mid',
        section: '辅助检查',
        message: '做了' + hit[0].name + '，但没抄' + g.name + '。带教原话：「你只写了外院 B 超异常，' +
          'BI-RADS 几级、建议手术这一段全丢了」——分级直接决定要不要手术，必须原样抄进病历。'
      });
    });
    return out;
  }

  // ---------- 规则：乳腺／甲状腺病人漏问月经史 ----------

  function checkMenstrual(r) {
    var out = [];
    var b = r.basic || {};
    if (b.gender !== '女') return out;
    var age = ageOf(r);
    if (!isFinite(age) || age < 14) return out;

    var cc = t(b.chiefComplaint);
    var diag = (((r.diagnosis || {}).confirmed) || []).join('，');
    // 主诉常常写「发现右乳肿块」「左乳结节」，不写「乳腺」两个字（实测踩过），
    // 所以「乳」后面跟肿块/结节/癌/溢液/疼痛也要认。
    var breastOrThyroid = /乳腺|乳房|乳[^，。；]{0,4}(?:肿块|包块|结节|癌|溢液|疼痛)|甲状腺|颈[部前][^，。；]{0,4}(?:肿块|肿物|结节|包块)/;
    if (!breastOrThyroid.test(cc + '，' + diag)) return out;

    var men = r.menstruation || {};
    if (men.applicable === false) return out;
    if (isText(men.lmp) || isText(men.menopauseAge) || isText(men.age)) return out;

    out.push({
      id: 'menstrual',
      level: 'mid',
      section: '月经史',
      message: '乳腺／甲状腺的病人要问月经史——月经来潮早晚是乳腺肿瘤的相关因素，' +
        '而且手术要尽量避开月经期。50～55 岁的直接问是否绝经，年轻的问末次月经。' +
        '带教原话：「不要不好意思问，病历上面都要写下来」。'
    });
    return out;
  }

  // ---------- 规则：儿科个人史 ----------

  function checkPediatric(r) {
    var out = [];
    var age = ageOf(r);
    if (!isFinite(age) || age >= 14) return out;

    var p = r.personal || {};
    if (isText(p.birth) || isText(p.feeding) || isText(p.growth)) return out;

    out.push({
      id: 'pediatric-personal',
      level: 'high',
      section: '个人史',
      message: '儿科病人的个人史是核心模块，现在出生史、喂养史、生长发育史一项都没填。' +
        '带教原话：「六个月了，他这个抬头还抬不稳，那你要想到他可能会有什么，我们发育落后」——' +
        '这三项直接对应发育落后、体重不达标、神经系统异常的鉴别。'
    });
    return out;
  }

  // ---------- 规则：过敏史／传染病史没问 ----------

  function checkMissedHistory(r) {
    var out = [];
    var p = r.pmh || {};
    // 既往史整体一个字没写时，交给 GENERATOR.validate 报「未填写」，这里不重复
    var any = t(p.health) || t(p.diseaseDetail) || t(p.infection) ||
      t(p.surgery) || t(p.allergy) || t(p.longTermMeds) ||
      Object.keys(p.diseaseChecks || {}).length;
    if (!any) return out;

    if (!t(p.allergy)) {
      out.push({
        id: 'allergy-missed',
        level: 'mid',
        section: '既往史',
        message: '过敏史还没问（药物、食物都要问）。这一项漏了，出院带药时可能开出病人过敏的药。'
      });
    }
    if (!t(p.infection)) {
      out.push({
        id: 'infection-missed',
        level: 'low',
        section: '既往史',
        message: '传染病史还没问（乙肝、结核等）。外科和消化科尤其要问——乙肝关系到手术安排和抗病毒治疗。'
      });
    }
    return out;
  }

  // ---------- 汇总 ----------

  var ORDER = { high: 0, mid: 1, low: 2 };
  var LABEL = { high: '必补', mid: '建议补', low: '留意' };

  /**
   * 跑全部规则。
   * @param {object} r 记录
   * @returns {{id:string, level:string, label:string, section:string, message:string}[]}
   */
  function check(r) {
    if (!r || typeof r !== 'object') return [];
    var all = [];
    [
      checkSymptoms,
      checkNegative,
      checkChronic,
      checkSurgery,
      checkAntithrombotic,
      checkDurationMatch,
      checkOnsetTrace,
      checkAmbiguousDate,
      checkAuxHospital,
      checkAuxGrade,
      checkMenstrual,
      checkPediatric,
      checkMissedHistory
    ].forEach(function (fn) {
      try {
        all = all.concat(fn(r) || []);
      } catch (e) {
        // 单条规则出错不能把整页搞崩：深度自查是提示，不是病历正文
        all.push({
          id: 'internal',
          level: 'low',
          section: '自查',
          message: '这一项自查没能跑完（' + (e && e.message ? e.message : '未知错误') + '），请忽略。'
        });
      }
    });

    all.forEach(function (f) { f.label = LABEL[f.level] || ''; });
    all.sort(function (a, b) { return (ORDER[a.level] || 0) - (ORDER[b.level] || 0); });
    return all;
  }

  /** 按级别计数，供界面显示「必补 N 条」 */
  function count(r) {
    var list = check(r);
    return {
      total: list.length,
      high: list.filter(function (f) { return f.level === 'high'; }).length,
      mid: list.filter(function (f) { return f.level === 'mid'; }).length,
      low: list.filter(function (f) { return f.level === 'low'; }).length
    };
  }

  return {
    check: check,
    count: count,
    LABEL: LABEL,
    SYMPTOMS: SYMPTOMS,
    // 供测试用
    _internals: {
      splitClauses: splitClauses,
      durationDays: durationDays,
      fmtDays: fmtDays,
      parseNum: parseNum
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DEPTH;
}
