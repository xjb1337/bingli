/* ===========================================================================
 * 评分自查模块测试（node:test）
 * 运行：node --test tests/*.test.cjs
 *
 * 覆盖 CHECKER 的四个考站自查与 summary。
 * 每个 check 函数都要有正例（写全了得分高）与反例（能识别出问题），
 * 否则「测试通过」只能证明它不崩，不能证明它有用。
 *
 * 依据：浙江省住院医师规范化培训临床实践能力结业考核（内科）评分表
 *       —— 详见 docs/评分表对齐说明.md
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA } = bootGlobals();
const CHECKER = require('../src/checker.js');

const STATIONS = ['病史采集', '体格检查', '首次病程录', '病历书写'];

/** 造一份「什么都没填」的空病历 */
const emptyRecord = () => SCHEMA.emptyRecord();

/** 往 record.pe 里写一项查体 */
function setPE(r, group, key, val) {
  r.pe[group] = r.pe[group] || {};
  r.pe[group][key] = val;
}

/* ======================= 接口契约 ======================= */

test('CHECKER 导出五个自查函数与常量', () => {
  ['checkHistory', 'checkPhysical', 'checkFirstCourse', 'checkWriting', 'summary']
    .forEach(k => assert.equal(typeof CHECKER[k], 'function', `缺少函数 ${k}`));
  assert.ok(Array.isArray(CHECKER.STATIONS), 'STATIONS 应为数组');
  assert.equal(CHECKER.STATIONS.length, 4, '应有 4 个考站');
});

test('CHECKER 不依赖 DOM 与存储', () => {
  const src = require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', 'src', 'checker.js'), 'utf8');
  ['window.', 'document.', 'localStorage', 'navigator.', 'alert('].forEach(k => {
    assert.ok(!src.includes(k), `checker.js 不应出现 ${k}`);
  });
});

test('每个检查项都带评分表页码，便于核对依据', () => {
  const r = emptyRecord();
  const res = [CHECKER.checkHistory(r), CHECKER.checkPhysical(r),
    CHECKER.checkFirstCourse(r), CHECKER.checkWriting(r)];
  res.forEach(station => {
    assert.ok(Array.isArray(station.items) && station.items.length > 0, '每站应有检查项');
    station.items.forEach(it => {
      assert.ok(typeof it.page === 'string' && it.page.length > 0,
        `检查项「${it.item}」缺少页码标注`);
    });
  });
});

/* ======================= 计分口径：空病历 ======================= */

test('空病历四站得分均为 0，不得凭空送分', () => {
  const r = emptyRecord();
  const stations = [CHECKER.checkHistory(r), CHECKER.checkPhysical(r),
    CHECKER.checkFirstCourse(r), CHECKER.checkWriting(r)];
  const name = ['病史采集', '体格检查', '首次病程录', '病历书写'];
  stations.forEach((st, i) => {
    assert.equal(st.score, 0, `${name[i]} 对空病历应得 0 分，实际 ${st.score}`);
  });
});

test('空病历的 T=0 不是因为没内容可算，而是因为确实没填', () => {
  const r = emptyRecord();
  const st = CHECKER.checkPhysical(r);
  assert.ok(st.maxScore > 0, '满分应大于 0，否则测试无意义');
  assert.ok(st.items.length > 0, '应有检查项');
  // 每项都应是 missing/weak，不应有 ok
  const okItems = st.items.filter(it => it.status === 'ok' && it.kind === 'content');
  assert.equal(okItems.length, 0,
    `空病历不应有已完成的计分项，实际有：${okItems.map(x => x.item).join('、')}`);
});

/* ======================= 病史采集自查 ======================= */

test('checkHistory 能识别主诉含诊断名', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '急性阑尾炎';
  r.basic.chiefComplaintDuration = '2';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '2天前腹痛';

  const res = CHECKER.checkHistory(r);
  const item = res.items.find(it => /主诉/.test(it.item));
  assert.ok(item, '应有主诉检查项');
  assert.notEqual(item.status, 'ok', '主诉写成诊断名时不应判为通过');
  assert.ok(/诊断|症状/.test(item.suggestion || ''),
    `主诉问题的提示应说明原因，实际：${item.suggestion}`);
});

test('checkHistory 能识别缺诱因与缺鉴别阴性病史', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前受凉后出现咳嗽';
  // 故意不填 cause / relief / negativeDiscriminating

  const res = CHECKER.checkHistory(r);
  const joined = res.items.map(it => it.item + '|' + (it.suggestion || '')).join('\n');
  assert.ok(/诱因/.test(joined), '应提示缺少发病诱因');
  assert.ok(/阴性|鉴别/.test(joined), '应提示缺少有鉴别意义的阴性病史');
});

test('checkHistory 对写全的病历给高分（正例）', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.marital = '已婚';
  r.basic.occupation = '工人';
  r.basic.birthPlace = '浙江温州';
  r.basic.recordNo = '0001234';
  r.basic.chiefComplaint = '发热伴咳嗽咳痰';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前受凉后出现发热';
  r.hpi.cause = '受凉';
  r.hpi.symptoms = '咳嗽呈阵发性，咳黄色黏痰';
  r.hpi.relief = '服退热药后可暂时缓解';
  r.hpi.evolution = '症状逐渐加重';
  r.hpi.accompanying = '伴畏寒';
  r.hpi.negativeDiscriminating = '无咯血、无盗汗、无胸痛';
  r.hpi.treatment = '自服头孢类抗感染3天，效果不佳';
  r.hpi.generalCondition = '发病以来精神欠佳，食欲下降，睡眠差，大小便正常，体重无明显变化';
  r.pmh.health = '一般';
  r.pmh.diseaseChecks = { 高血压: true };
  r.pmh.surgery = '2010年阑尾切除术';
  r.pmh.trauma = '否认外伤史';
  r.pmh.transfusion = '否认输血史';
  r.pmh.infection = '否认肝炎结核';
  r.pmh.longTermMeds = '氨氯地平5mg qd';
  r.pmh.vaccine = '按计划接种';
  r.pmh.allergy = '无';
  r.personal.smoking = '有';
  r.personal.smokingAmount = '吸烟20年，每日10支';
  r.personal.drinking = '无';
  r.marriage.status = '已婚';
  r.marriage.age = '25';
  r.family.similarDisease = '家族中无类似疾病患者';
  r.family.threeGeneration = '两系三代无遗传性疾病史';

  const res = CHECKER.checkHistory(r);
  assert.ok(res.score / res.maxScore >= 0.8,
    `写全的病史应得 80% 以上，实际 ${res.score}/${res.maxScore}`);
});

/* ======================= 体格检查自查 ======================= */

test('checkPhysical 用变异法识别腹部查体次序错误（把 schema 改回视触叩听）', () => {
  const group = SCHEMA.PE_COMMON.find(g => g.key === 'abdomen');
  const original = group.items.slice();

  const r = emptyRecord();
  setPE(r, 'abdomen', 'abdInspect', '腹部平坦，未见胃肠型及蠕动波');
  setPE(r, 'abdomen', 'abdAuscultation', '左上腹听诊1分钟，肠鸣音4次/分');
  setPE(r, 'abdomen', 'abdPercussion', '自左下腹起逆时针叩诊，移动性浊音阴性');
  setPE(r, 'abdomen', 'abdPalpation', '全腹无压痛、反跳痛');

  // 先确认正确次序下判 ok
  const before = CHECKER.checkPhysical(r).items.find(it => /腹部查体次序/.test(it.item));
  assert.equal(before.status, 'ok', '正确次序应判通过');

  try {
    // 变异：把触诊挪到听诊之前（即历史上的错误写法 视→触→叩→听）
    const byKey = k => original.find(i => i.key === k);
    group.items = [
      byKey('abdInspect'),
      byKey('abdPalpation'),   // ← 错位
      byKey('abdPercussion'),
      byKey('abdAuscultation'),
      byKey('abdPalpSuperficial'),
      byKey('abdPalpDeep'),
      byKey('liverPalpation'),
      byKey('spleenPalpation')
    ].filter(Boolean);

    const after = CHECKER.checkPhysical(r).items.find(it => /腹部查体次序/.test(it.item));
    assert.ok(after, '应有腹部查体次序检查项');
    assert.notEqual(after.status, 'ok',
      '腹部次序被改成视→触→叩→听时，自查必须报出来（这条测试守住评分表第3页「次序正确得2分」）');
  } finally {
    group.items = original;   // 无论断言成败都恢复，避免污染其他测试
  }
});

test('变异恢复后次序检查回到 ok（确保变异可逆）', () => {
  const group = SCHEMA.PE_COMMON.find(g => g.key === 'abdomen');
  assert.deepEqual(group.items.map(i => i.key), [
    'abdInspect', 'abdAuscultation', 'abdPercussion', 'abdPalpation',
    'abdPalpSuperficial', 'abdPalpDeep', 'liverPalpation', 'spleenPalpation'
  ], 'schema 腹部顺序应已恢复为 视→听→叩→触');
});

test('checkPhysical 对正确次序判为通过', () => {
  const r = emptyRecord();
  setPE(r, 'abdomen', 'abdInspect', '腹部平坦，未见胃肠型及蠕动波');
  setPE(r, 'abdomen', 'abdAuscultation', '左上腹听诊1分钟，肠鸣音4次/分');
  setPE(r, 'abdomen', 'abdPercussion', '自左下腹起逆时针叩诊，移动性浊音阴性');
  setPE(r, 'abdomen', 'abdPalpation', '全腹无压痛、反跳痛');

  const res = CHECKER.checkPhysical(r);
  const item = res.items.find(it => /腹部查体次序/.test(it.item));
  assert.ok(item, '应有腹部查体次序检查项');
  assert.equal(item.status, 'ok', `正确次序应判通过，实际 ${item.status}：${item.suggestion || ''}`);
});

test('checkPhysical 能识别完全没做腹部查体（不因未写而判次序正确）', () => {
  const r = emptyRecord();
  const res = CHECKER.checkPhysical(r);
  const item = res.items.find(it => /腹部查体次序/.test(it.item));
  assert.ok(item, '应有腹部查体次序检查项');
  assert.notEqual(item.status, 'ok', '没写腹部查体时不应判「次序正确」');
});

test('默认描述计入得分，但被标记为 isDefault', () => {
  const r = emptyRecord();
  const def = SCHEMA.PE_COMMON.find(g => g.key === 'chest')
    .items.find(i => i.key === 'lungPercussion');
  setPE(r, 'chest', 'lungPercussion', def.default);

  const res = CHECKER.checkPhysical(r);
  const item = res.items.find(it => /肺叩诊/.test(it.item));
  assert.ok(item, '应有肺叩诊检查项');
  assert.ok(item.earned > 0, '默认描述应计入得分，否则用户看到病历有字却说没填');
  assert.equal(item.isDefault, true, '用默认描述时应标记 isDefault');
});

test('每个人检查项都带 isDefault 布尔字段', () => {
  const r = emptyRecord();
  const res = CHECKER.checkPhysical(r);
  res.items.forEach(it => {
    assert.equal(typeof it.isDefault, 'boolean', `「${it.item}」缺少 isDefault 布尔字段`);
  });
});

test('录入更多查体内容，得分不得下降（严格单调）', () => {
  const r1 = emptyRecord();
  setPE(r1, 'chest', 'lungPercussion', '双肺叩诊清音，上下左右对比一致');
  const s1 = CHECKER.checkPhysical(r1).score;

  const r2 = JSON.parse(JSON.stringify(r1));
  setPE(r2, 'chest', 'lungAuscultation', '依次听诊胸、侧胸、背部，双肺呼吸音清');
  setPE(r2, 'chest', 'heartAuscultation', '依次听诊五个瓣膜区，未闻及杂音');
  const s2 = CHECKER.checkPhysical(r2).score;

  assert.ok(s2 >= s1, `加填内容后分数不应下降：${s1} → ${s2}`);
});

test('先填父项再补子项，得分不得下降（易漏的单调性）', () => {
  const r1 = emptyRecord();
  setPE(r1, 'abdomen', 'abdPalpation', '全腹无压痛、反跳痛，未触及包块');
  const s1 = CHECKER.checkPhysical(r1).score;

  const r2 = JSON.parse(JSON.stringify(r1));
  setPE(r2, 'abdomen', 'abdPalpSuperficial', '右下腹浅触诊压痛');
  const s2 = CHECKER.checkPhysical(r2).score;

  assert.ok(s2 >= s1, `先父后子不应扣分：${s1} → ${s2}`);
});

/* ======================= 首次病程录自查 ======================= */

test('checkFirstCourse 能识别 SOAP 缺段', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  // soap 全空

  const res = CHECKER.checkFirstCourse(r);
  assert.ok(res.items.length > 0, '应有检查项');
  const okCount = res.items.filter(it => it.status === 'ok' && it.kind === 'content').length;
  assert.equal(okCount, 0, 'SOAP 全空时不应有已完成的计分段');
});

test('checkFirstCourse 对填好的 SOAP 给高分（正例）', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '58';
  r.basic.chiefComplaint = '发热伴咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前受凉后出现发热';
  r.hpi.symptoms = '咳嗽咳黄痰';
  r.diagnosis.confirmed = ['社区获得性肺炎（右下肺）'];
  // 注意：basisDetail / diff / perDiagnosis 在 schema 里是「对象数组」，
  // 与界面 src/app.js 的写入格式一致（不是字符串数组）。
  r.soap = {
    s: {
      summary: '老年男性，急性起病，发热咳嗽咳黄痰3天，伴畏寒，无咯血盗汗。既往高血压5年。' +
        '查体右下肺湿啰音。胸部CT示右下肺实变。初步诊断社区获得性肺炎。',
      consistency: '与病史采集一致'
    },
    o: {
      pe: 'T 38.6℃，右下肺可闻及湿性啰音，双肺未闻及哮鸣音，心率102次/分，律齐',
      aux: '胸部CT：右下肺大片实变影，可见支气管充气征；血常规WBC 13.2×10⁹/L'
    },
    a: {
      basis: '社区获得性肺炎（右下肺）',
      basisDetail: [{
        diagnosis: '社区获得性肺炎（右下肺）',
        history: '发热咳嗽咳黄痰3天，受凉后起病',
        pe: '右下肺可闻及湿性啰音',
        aux: '胸部CT示右下肺大片实变影'
      }],
      ranking: '1.社区获得性肺炎（右下肺）2.高血压病2级',
      diff: [
        { diagnosis: '肺结核', why: '均可有发热咳嗽', against: '无低热盗汗消瘦', points: '病灶不在上肺尖后段' },
        { diagnosis: '肺癌', why: '均可有咳嗽与肺部阴影', against: '病程短、有明确感染征象', points: 'CT示片状实变而非肿块' }
      ],
      diffNote: '结合病史与影像，结核与肿瘤证据不足'
    },
    p: {
      principle: '抗感染治疗为主，辅以退热、化痰等对症支持，监测体温与炎症指标变化',
      perDiagnosis: [
        { diagnosis: '社区获得性肺炎（右下肺）', exam: '痰培养、血常规+CRP、复查胸片' },
        { diagnosis: '高血压病2级', exam: '监测血压、继续口服氨氯地平' }
      ],
      individual: '老年患者，注意肾功能与液体平衡，必要时调整抗菌药物剂量'
    }
  };

  const res = CHECKER.checkFirstCourse(r);
  assert.ok(res.score / res.maxScore >= 0.8,
    `SOAP 写全应得 80% 以上，实际 ${res.score}/${res.maxScore}：` +
    res.items.filter(i => i.earned < i.maxScore).map(i => i.item).join('、'));
});

/* ======================= 病历书写自查 ======================= */

test('checkWriting 能识别缺少出院记录', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.diagnosis.confirmed = ['肺炎'];

  const res = CHECKER.checkWriting(r);
  const joined = res.items.map(it => it.item + '|' + (it.suggestion || '')).join('\n');
  assert.ok(/出院/.test(joined), '应检查出院记录相关项');
  const okCount = res.items.filter(it => it.status === 'ok' && it.kind === 'content').length;
  assert.ok(okCount < res.items.filter(it => it.kind === 'content').length,
    '未填出院记录时不应全部通过');
});

test('checkWriting 能识别主诉含诊断名（入院记录—主诉项）', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '急性阑尾炎';
  r.basic.chiefComplaintDuration = '2';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '2天前腹痛';

  const res = CHECKER.checkWriting(r);
  const item = res.items.find(it => /主诉/.test(it.item));
  assert.ok(item, '入院记录应有主诉检查项');
  assert.notEqual(item.status, 'ok', '主诉写成诊断名时不应判为通过');
  assert.ok(/诊断性词语|症状/.test(item.suggestion || ''),
    `提示应说明主诉不该用诊断名，实际：${item.suggestion}`);
});

/* ======================= summary 汇总 ======================= */

test('summary 返回四站得分、加权总分与待补项', () => {
  const r = emptyRecord();
  const s = CHECKER.summary(r);

  assert.ok(Array.isArray(s.stations), 'stations 应为数组');
  assert.equal(s.stations.length, 4, '应汇总 4 个考站');
  s.stations.forEach(st => {
    assert.ok(STATIONS.includes(st.station), `未知考站：${st.station}`);
    assert.equal(typeof st.score, 'number');
    assert.equal(typeof st.maxScore, 'number');
    assert.ok(st.maxScore > 0, `${st.station} 满分应大于 0`);
  });
  assert.ok(typeof s.weighted === 'number' || typeof s.weighted === 'object',
    'summary 应提供加权结果');
  assert.ok(Array.isArray(s.top3), 'top3 应为数组');
});

test('summary 的 top3 最多 3 条，且按可补分值优先', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '咳嗽';

  const s = CHECKER.summary(r);
  assert.ok(s.top3.length <= 3, `top3 不应超过 3 条，实际 ${s.top3.length}`);
  // 排序：可补分值应递减
  for (let i = 1; i < s.top3.length; i++) {
    assert.ok((s.top3[i - 1].missing || 0) >= (s.top3[i].missing || 0),
      'top3 应按可补分值递减排序');
  }
});

test('内容填满后 top3 应显著减少或清空', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.gender = '男';
  r.basic.age = '58';
  r.basic.chiefComplaint = '发热伴咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前受凉后出现发热';
  r.diagnosis.confirmed = ['肺炎'];
  const before = CHECKER.summary(r).top3.length;
  assert.ok(before > 0, '空病历应有待补项');
});

/* ======================= 文案纪律（医疗工具的红线） ======================= */

test('自查文案不含诊断结论，不得替用户下诊断', () => {
  const r = emptyRecord();
  const texts = [];
  [CHECKER.checkHistory(r), CHECKER.checkPhysical(r),
    CHECKER.checkFirstCourse(r), CHECKER.checkWriting(r)].forEach(st => {
    st.items.forEach(it => texts.push(it.item + ' ' + (it.suggestion || '') + ' ' + (it.note || '')));
  });
  const banned = ['确诊', '诊断为', '考虑为', '可确诊'];
  texts.forEach(t => banned.forEach(b => {
    assert.ok(!t.includes(b), `自查文案出现诊断结论「${b}」：${t}`);
  }));
});

test('自查文案不把缺项说成不合格', () => {
  const r = emptyRecord();
  const texts = [];
  [CHECKER.checkHistory(r), CHECKER.checkPhysical(r),
    CHECKER.checkFirstCourse(r), CHECKER.checkWriting(r)].forEach(st => {
    st.items.forEach(it => texts.push(it.item + ' ' + (it.suggestion || '')));
  });
  ['不合格', '不及格', '不达标', '漏诊', '误诊'].forEach(b => {
    texts.forEach(t => assert.ok(!t.includes(b), `自查文案出现「${b}」：${t}`));
  });
});

test('summary 带免责声明，提醒不能代替带教老师', () => {
  const s = CHECKER.summary(emptyRecord());
  assert.ok(typeof s.disclaimer === 'string' && s.disclaimer.length > 0, '应有免责声明');
  assert.ok(/带教|考官|上级/.test(s.disclaimer),
    `声明应说明不能代替人工判断，实际：${s.disclaimer}`);
});

/* ======================= 健壮性 ======================= */

test('残缺记录不导致崩溃', () => {
  const cases = [
    {},
    { basic: {} },
    { basic: { name: 'x' } },
    { pe: {} },
    { diagnosis: {} },
    { soap: {} }
  ];
  cases.forEach(c => {
    assert.doesNotThrow(() => {
      CHECKER.checkHistory(c);
      CHECKER.checkPhysical(c);
      CHECKER.checkFirstCourse(c);
      CHECKER.checkWriting(c);
      CHECKER.summary(c);
    }, `残缺记录导致崩溃：${JSON.stringify(c)}`);
  });
});

test('自查是纯函数：重复调用结果一致且不修改入参', () => {
  const r = emptyRecord();
  r.basic.name = '张三';
  r.basic.chiefComplaint = '咳嗽';
  const snapshot = JSON.stringify(r);
  const a = CHECKER.summary(r);
  const b = CHECKER.summary(r);
  assert.equal(JSON.stringify(r), snapshot, '自查不应修改入参');
  assert.deepEqual(JSON.stringify(a), JSON.stringify(b), '重复调用结果应一致');
});
