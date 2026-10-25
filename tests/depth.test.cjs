/* 问诊深度自查（src/depth.js）测试
 *
 * 这个模块的每一条结论都是给学生的提醒，所以最容易出的错不是崩溃，
 * 而是「明明问了还说你没问」——学生被冤枉两次就会关掉整页。
 * 因此这里的用例大部分是**反例**：写清楚了就不许报。
 *
 * 判据全部来自四份见习笔记（带教老师的原话），不是我自己想的：
 *   · 黑便量/次数未量化      ——「一个鸡蛋大小」「半瓶矿泉水」
 *   · 阴性鉴别症状全缺        ——「你这里面没有写任何的阴性症状」
 *   · 高血压用药未问出        ——「高血压的药尽量要问出来」
 *   · 手术史没年份/医院/术式  ——「几几年做的，在哪里做的手术，手术过程是怎样的」
 *   · 主诉未追溯              ——「这个病史就要从之前他的头晕开始讲」
 *   · 主诉与现病史天数不一致  ——「上面七天，下面不要写六天」
 *   · 抗凝药单独追问          —— 术前停 5-7 天
 *   · 乳腺甲状腺必问月经史    ——「不要不好意思问，病历上面都要写下来」
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const DEPTH = require(path.join(__dirname, '..', 'src', 'depth.js'));
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA } = bootGlobals();

/** 按块覆盖构造记录：只写测试关心的块，其余保持 emptyRecord 的空状态 */
function mk(parts) {
  const r = SCHEMA.emptyRecord();
  ['basic', 'hpi', 'pmh', 'personal', 'menstruation', 'marriage', 'childbirth', 'family'].forEach(k => {
    if (parts[k]) Object.assign(r[k], parts[k]);
  });
  if (parts.auxiliary) r.auxiliary.items = parts.auxiliary;
  if (parts.diagnosis) r.diagnosis.confirmed = parts.diagnosis;
  return r;
}

/** 跑规则，返回 id 数组 */
const ids = r => DEPTH.check(r).map(f => f.id);

/** 断言某条规则**没有**被触发（比断言触发了更重要） */
function noRule(r, id, why) {
  assert.ok(!ids(r).includes(id), `不该报 ${id}：${why}\n实际报出：${ids(r).join(', ') || '（无）'}`);
}

/** 断言某条规则被触发 */
function hasRule(r, id, why) {
  assert.ok(ids(r).includes(id), `应该报 ${id}：${why}\n实际报出：${ids(r).join(', ') || '（无）'}`);
}

/* ======================= 基本契约 ======================= */

test('空记录不报任何问题（没写就没有可挑剔的）', () => {
  assert.deepEqual(ids(SCHEMA.emptyRecord()), []);
});

test('每条结论都带 level / label / section / message', () => {
  const r = mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便' }
  });
  const list = DEPTH.check(r);
  assert.ok(list.length > 0, '这个用例本身就该报出问题');
  for (const f of list) {
    assert.ok(['high', 'mid', 'low'].includes(f.level), `level 非法：${f.level}`);
    assert.equal(f.label, DEPTH.LABEL[f.level]);
    assert.ok(f.section && f.section.length > 0, '缺少栏目名');
    assert.ok(f.message && f.message.length > 6, '提示太短，等于没说');
  }
});

test('结论按 必补 → 建议补 → 留意 排序', () => {
  const order = { high: 0, mid: 1, low: 2 };
  const list = DEPTH.check(mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便' },
    pmh: { health: '一般', diseaseChecks: { 高血压: true } }
  }));
  const seq = list.map(f => order[f.level]);
  assert.deepEqual(seq, [...seq].sort((a, b) => a - b), '排序不对，学生第一眼看到的不是最该补的');
});

test('count() 的分档计数与 check() 一致', () => {
  const r = mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便' },
    pmh: { health: '一般', diseaseChecks: { 高血压: true } }
  });
  const list = DEPTH.check(r);
  const c = DEPTH.count(r);
  assert.equal(c.total, list.length);
  assert.equal(c.high, list.filter(f => f.level === 'high').length);
  assert.equal(c.mid, list.filter(f => f.level === 'mid').length);
  assert.equal(c.low, list.filter(f => f.level === 'low').length);
});

/* ======================= 症状量化 ======================= */

test('黑便只写「解柏油样黑便」→ 报没写次数或量', () => {
  hasRule(mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便' }
  }), 'sym:melena', '带教要求写到「一个鸡蛋大小」这种程度');
});

test('黑便写清次数和量 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便，每日2次，每次约一个鸡蛋大小，成形' }
  }), 'sym:melena', '次数和量都写了');
});

test('呕吐写清次数与性状 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '呕吐', chiefComplaintDuration: '1天' },
    hpi: { onset: '1天前', cause: '不洁饮食后', symptoms: '呕吐，每日5次，为胃内容物' }
  }), 'sym:vomit', '「每日5次，为胃内容物」已经答完带教的两问');
});

test('量化信息写在下一个分句里也要认（中文病历常这么断句）', () => {
  // 「伴呕吐，每日3～4次，为胃内容物」被逗号切成三段，
  // 只在触发词所在的那一句找数字会全部误报。
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '2天' },
    hpi: { onset: '2天前', symptoms: '上腹持续性胀痛', accompanying: '伴呕吐，每日3～4次，为胃内容物' }
  }), 'sym:vomit', '次数和性状在后面的分句里');
});

test('腹痛没区分持续性/阵发性 → 报', () => {
  hasRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹隐痛', negativeDiscriminating: '无发热' }
  }), 'sym:abdpain', '带教点名「腹痛未区分持续性还是阵发性」');
});

test('腹痛写了「持续性」→ 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' }
  }), 'sym:abdpain', '已经区分了持续性');
});

test('否定的提及不算提及：「无呕吐，无黑便」不许触发呕吐/黑便的量化提醒', () => {
  const r = mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '3天' },
    hpi: { onset: '3天前', symptoms: '上腹持续性隐痛', accompanying: '无呕吐，无黑便，无发热' }
  });
  assert.ok(!ids(r).some(id => id.startsWith('sym:')), `阴性症状被当阳性报了：${ids(r).join(', ')}`);
});

/* ======================= 阴性鉴别症状 ======================= */

test('一条阴性症状都没有 → 必补', () => {
  const list = DEPTH.check(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '3天' },
    hpi: { onset: '3天前', symptoms: '上腹持续性隐痛' }
  }));
  const f = list.find(x => x.id === 'neg-symptom');
  assert.ok(f, '带教原话：「你这里面没有写任何的阴性症状」');
  assert.equal(f.level, 'high');
});

test('写了阴性症状 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '3天' },
    hpi: { onset: '3天前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热、无呕血黑便' }
  }), 'neg-symptom', '已经写了阴性鉴别症状');
});

/* ======================= 慢性病用药 ======================= */

test('高血压只勾病名没写药 → 必补', () => {
  const list = DEPTH.check(mk({
    basic: { chiefComplaint: '头晕', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '头晕，持续性', negativeDiscriminating: '无发热' },
    pmh: { health: '一般', diseaseChecks: { 高血压: true }, allergy: '无', infection: '否认肝炎结核' }
  }));
  const f = list.find(x => x.id === 'chronic-meds');
  assert.ok(f, '带教原话：「涉及到接下来这个血压高我们要用什么药」');
  assert.equal(f.level, 'high');
});

test('写了降压药但没写控制情况 → 降为建议补', () => {
  const list = DEPTH.check(mk({
    basic: { chiefComplaint: '头晕', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '头晕，持续性', negativeDiscriminating: '无发热' },
    pmh: {
      health: '一般', diseaseChecks: { 高血压: true }, longTermMeds: '氨氯地平5mg每日1次',
      allergy: '无', infection: '否认肝炎结核'
    }
  }));
  const f = list.find(x => x.id === 'chronic-control');
  assert.ok(f, '药名写了，血压控制得怎么样还没写');
  assert.equal(f.level, 'mid');
});

test('写了药且写了控制情况 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '头晕', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '头晕，持续性', negativeDiscriminating: '无发热' },
    pmh: {
      health: '一般', diseaseChecks: { 高血压: true },
      longTermMeds: '氨氯地平5mg每日1次，血压控制在130/80mmHg左右',
      allergy: '无', infection: '否认肝炎结核'
    }
  }), 'chronic-control', '药名与控制情况都写了');
});

/* ======================= 手术史 ======================= */

test('手术史只写「阑尾切除术」缺年份医院 → 必补', () => {
  hasRule(mk({
    basic: { chiefComplaint: '腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: { health: '一般', surgery: '阑尾切除术', allergy: '无', infection: '否认肝炎结核' }
  }), 'surgery-detail', '带教要求年份、医院、术式、过程');
});

test('手术史写全年份与医院 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: {
      health: '一般', surgery: '2019年在温州市人民医院行阑尾切除术',
      allergy: '无', infection: '否认肝炎结核'
    }
  }), 'surgery-detail', '年份、医院、术式都有');
});

test('「否认手术史」不算没问清 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: { health: '良好', surgery: '否认手术史', allergy: '无', infection: '否认肝炎结核' }
  }), 'surgery-detail', '明确否认了，不需要年份医院');
});

/* ======================= 抗栓药 ======================= */

test('冠心病没问抗血小板药 → 提醒', () => {
  hasRule(mk({
    basic: { chiefComplaint: '腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: {
      health: '一般', diseaseChecks: { 冠心病: true }, longTermMeds: '阿托伐他汀20mg',
      allergy: '无', infection: '否认肝炎结核'
    }
  }), 'antithrombotic', '术前要停 5-7 天，漏问会直接影响手术安排');
});

test('问了阿司匹林 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: {
      health: '一般', diseaseChecks: { 冠心病: true },
      longTermMeds: '阿司匹林100mg每日1次，阿托伐他汀20mg，病情平稳',
      allergy: '无', infection: '否认肝炎结核'
    }
  }), 'antithrombotic', '已经问到抗血小板药');
});

/* ======================= 主诉与现病史的一致性 ======================= */

test('主诉写 1 月、现病史写 3 天 → 报不一致', () => {
  hasRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '3天前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' }
  }), 'duration-mismatch', '带教原话：「上面七天，下面不要写六天」');
});

test('主诉与现病史天数一致 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便，每日2次，量约100g', negativeDiscriminating: '无呕血' }
  }), 'duration-mismatch', '上下都是 3 天');
});

test('主诉 3 天但现病史提到数月前 → 建议从更早讲起', () => {
  hasRule(mk({
    basic: { chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: {
      onset: '3天前', symptoms: '解柏油样黑便，每日2次，量约100g',
      negativeDiscriminating: '无呕血，无发热',
      evolution: '数月前曾出现上腹部持续性胀痛，未就诊'
    }
  }), 'onset-trace', '带教原话：「这个病史就要从之前他的头晕开始讲」');
});

test('主诉本身就有 1 个月 → 不需要再往前追溯', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: {
      onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热',
      evolution: '数月来体重下降3kg'
    }
  }), 'onset-trace', '主诉时长已经覆盖了病程');
});

/* ======================= 儿科 ======================= */

test('3 岁患儿没填出生史喂养史 → 必补', () => {
  const list = DEPTH.check(mk({
    basic: { department: 'pediatrics', age: '3', chiefComplaint: '咳嗽', chiefComplaintDuration: '3天' },
    hpi: { onset: '3天前', symptoms: '咳嗽，干咳，夜间为著', negativeDiscriminating: '无发热' }
  }));
  const f = list.find(x => x.id === 'pediatric-personal');
  assert.ok(f, '儿科个人史三块是必填项');
  assert.equal(f.level, 'high');
});

test('3 岁患儿填了出生史喂养史生长发育史 → 不报', () => {
  noRule(mk({
    basic: { department: 'pediatrics', age: '3', chiefComplaint: '咳嗽', chiefComplaintDuration: '3天' },
    hpi: { onset: '3天前', symptoms: '咳嗽，干咳，夜间为著', negativeDiscriminating: '无发热' },
    personal: {
      birth: '足月顺产，无窒息，Apgar 9分',
      feeding: '母乳喂养至1岁',
      growth: '6个月会坐，1岁会走'
    }
  }), 'pediatric-personal', '三块都写了');
});

test('成人不报儿科个人史（没填年龄的成人也不能被当成 0 岁）', () => {
  // 曾经的真 bug：Number(null) === 0，于是没填年龄的病人全被当儿童
  noRule(mk({
    basic: { department: 'respiratory', gender: '男', chiefComplaint: '咳嗽', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '咳嗽，干咳', negativeDiscriminating: '无发热' }
  }), 'pediatric-personal', '没填年龄不等于 0 岁');
});

/* ======================= 乳腺/甲状腺必问月经史 ======================= */

test('乳腺肿块没问月经史 → 提醒', () => {
  hasRule(mk({
    basic: { department: 'surgery', gender: '女', age: '46', chiefComplaint: '发现右乳肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现右乳无痛性肿块，持续性增大', negativeDiscriminating: '无发热' }
  }), 'menstrual', '主诉写「右乳」不写「乳腺」，判据要认得出');
});

test('问了末次月经 → 不报', () => {
  noRule(mk({
    basic: { department: 'surgery', gender: '女', age: '46', chiefComplaint: '发现右乳肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现右乳无痛性肿块，持续性增大', negativeDiscriminating: '无发热' },
    menstruation: { age: '14', lmp: '2026-10-01' }
  }), 'menstrual', '已经问了末次月经');
});

test('已绝经 → 不报', () => {
  noRule(mk({
    basic: { department: 'surgery', gender: '女', age: '56', chiefComplaint: '发现右乳肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现右乳无痛性肿块，持续性增大', negativeDiscriminating: '无发热' },
    menstruation: { age: '14', menopauseAge: '52' }
  }), 'menstrual', '绝经年龄就是答案');
});

test('男性甲状腺病人 → 不报月经史', () => {
  noRule(mk({
    basic: { department: 'surgery', gender: '男', age: '46', chiefComplaint: '发现颈部肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现颈前肿物，持续性增大', negativeDiscriminating: '无发热' }
  }), 'menstrual', '男性没有月经史');
});

test('普通腹痛的女性 → 不报月经史（不是所有女病人都要问）', () => {
  noRule(mk({
    basic: { department: 'digestive', gender: '女', age: '46', chiefComplaint: '上腹痛', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' }
  }), 'menstrual', '只有乳腺/甲状腺手术相关才强制问');
});

/* ======================= 影像/内镜分级 ======================= */

test('做了乳腺 B 超但没抄 BI-RADS 分级 → 建议补', () => {
  const list = DEPTH.check(mk({
    basic: { department: 'surgery', gender: '女', age: '46', chiefComplaint: '发现右乳肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现右乳无痛性肿块，持续性增大', negativeDiscriminating: '无发热' },
    menstruation: { age: '14', lmp: '2026-10-01' },
    auxiliary: [{ name: '乳腺B超', result: '右乳外上象限低回声结节，边界不清', hospital: '永嘉县人民医院' }]
  }));
  const f = list.find(x => x.id.startsWith('aux-grade:'));
  assert.ok(f, '带教点名：只写「B超异常」把 BI-RADS 等级丢了');
  assert.equal(f.level, 'mid');
  assert.ok(f.message.includes('BI-RADS'), `提示里要说清缺的是哪个分级：${f.message}`);
});

test('抄了 BI-RADS 4A → 不报', () => {
  const r = mk({
    basic: { department: 'surgery', gender: '女', age: '46', chiefComplaint: '发现右乳肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现右乳无痛性肿块，持续性增大', negativeDiscriminating: '无发热' },
    menstruation: { age: '14', lmp: '2026-10-01' },
    auxiliary: [{ name: '乳腺B超', result: '右乳外上象限低回声结节，BI-RADS 4A 类，建议穿刺', hospital: '永嘉县人民医院' }]
  });
  assert.ok(!ids(r).some(x => x.startsWith('aux-grade:')), `已经写了分级还被报：${ids(r).join(', ')}`);
});

test('甲状腺结节没抄 TI-RADS → 报', () => {
  hasRule(mk({
    basic: { department: 'surgery', gender: '男', age: '46', chiefComplaint: '发现颈部肿块', chiefComplaintDuration: '2月' },
    hpi: { onset: '2月前', symptoms: '发现颈前肿物，持续性增大', negativeDiscriminating: '无发热' },
    auxiliary: [{ name: '甲状腺B超', result: '右叶结节 1.2cm，边界不清，可见点状钙化', hospital: '本院' }]
  }), 'aux-grade:TI-RADS 分级', '带教点名漏了 TI-RADS 4A 与穿刺建议');
});

test('胃镜没写 Forrest 分级或溃疡分期 → 报', () => {
  hasRule(mk({
    basic: { department: 'digestive', chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便，每日2次，量约100g', negativeDiscriminating: '无呕血' },
    auxiliary: [{ name: '胃镜', result: '十二指肠球部溃疡伴出血', hospital: '本院' }]
  }), 'aux-grade:Forrest 分级或溃疡分期', 'Forrest 分级决定要不要内镜下止血');
});

test('胃镜写了「Forrest Ⅱa」→ 不报', () => {
  noRule(mk({
    basic: { department: 'digestive', chiefComplaint: '解黑便', chiefComplaintDuration: '3日' },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便，每日2次，量约100g', negativeDiscriminating: '无呕血' },
    auxiliary: [{ name: '胃镜', result: '十二指肠球部溃疡，Forrest Ⅱa 级，予钛夹止血', hospital: '本院' }]
  }), 'aux-grade:Forrest 分级或溃疡分期', '已经写了 Forrest 分级');
});

test('没做相关检查 → 不报分级（不能凭空要求抄一个没做的报告）', () => {
  const r = mk({
    basic: { department: 'digestive', chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    auxiliary: [{ name: '血常规', result: 'Hb 128g/L', hospital: '本院' }]
  });
  assert.ok(!ids(r).some(x => x.startsWith('aux-grade:')), '只做了血常规，不该要求抄影像分级');
});

/* ======================= 辅助检查与遗漏项 ======================= */

test('辅助检查全都没写医院 → 建议补', () => {
  hasRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    auxiliary: [{ name: '血常规', result: 'Hb 128g/L' }]
  }), 'aux-hospital', '带教要求分清本院与外院');
});

test('写了医院 → 不报', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    auxiliary: [{ name: '血常规', result: 'Hb 128g/L', hospital: '徐熙卫生院' }]
  }), 'aux-hospital', '写明是外院');
});

test('既往史有内容但没问过敏史 / 传染病史 → 分别提醒', () => {
  const list = DEPTH.check(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', negativeDiscriminating: '无发热' },
    pmh: { health: '一般', surgery: '2019年在温州市人民医院行阑尾切除术' }
  }));
  const got = list.filter(f => f.id === 'allergy-missed' || f.id === 'infection-missed').map(f => f.id);
  assert.deepEqual(got.sort(), ['allergy-missed', 'infection-missed']);
});

/* ======================= 判据边界 ======================= */

test('「14日」这种歧义日期 → 留意（应写成「三天前」或「10月14号」）', () => {
  hasRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', treatment: '14日于外院就诊', negativeDiscriminating: '无发热' }
  }), 'ambiguous-date', '带教点名「14日」有歧义');
});

test('写「10月14号」不报（已经说清是哪个月）', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', treatment: '10月14号于外院就诊', negativeDiscriminating: '无发热' }
  }), 'ambiguous-date', '写清了月份');
});

test('「14天前」不报（不是日期是时长）', () => {
  noRule(mk({
    basic: { chiefComplaint: '上腹痛', chiefComplaintDuration: '1月' },
    hpi: { onset: '1月前', symptoms: '上腹持续性隐痛', treatment: '14天前曾服奥美拉唑', negativeDiscriminating: '无发热' }
  }), 'ambiguous-date', '这是时长不是日期');
});

test('记录结构缺失也不崩（check 对每个字段都做防御）', () => {
  assert.deepEqual(DEPTH.check(null), []);
  assert.deepEqual(DEPTH.check({}), []);
  assert.deepEqual(DEPTH.check({ basic: null, hpi: null, pmh: null }), []);
});

/* ======================= 带教原话的落地效果 ======================= */

test('笔记1 的真实病例：四件被扣分的事全都点出来', () => {
  // 52 岁男，「解黑便」3 日，只勾了高血压、只写了「解柏油样黑便，伴呕吐」
  const list = DEPTH.check(mk({
    basic: {
      department: 'digestive', gender: '男', age: '52',
      chiefComplaint: '解黑便', chiefComplaintDuration: '3日'
    },
    hpi: { onset: '3天前', symptoms: '解柏油样黑便，伴呕吐' },
    pmh: { health: '一般', diseaseChecks: { 高血压: true } }
  }));
  const got = list.map(f => f.id);
  assert.ok(got.includes('sym:melena'), '黑便没量化');
  assert.ok(got.includes('sym:vomit'), '呕吐没写次数与性状');
  assert.ok(got.includes('neg-symptom'), '一条阴性症状都没写');
  assert.ok(got.includes('chronic-meds'), '高血压没问用药');
  // 而且这些必须是「必补」级，不能混在「留意」里被忽略
  const high = list.filter(f => f.level === 'high').map(f => f.id);
  assert.ok(high.includes('neg-symptom') && high.includes('chronic-meds'));
});
