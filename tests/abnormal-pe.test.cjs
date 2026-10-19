/* ===========================================================================
 * 病历摘要「阳性体征识别」的真值表测试
 *
 * 这张表是**手工写死的临床判断**，不从实现的正则里反推。
 * 上一轮评审专门批评过：如果测试和实现共用同一套规则，
 * 实现错了测试会跟着一起错，看起来全绿但毫无保护作用。
 *
 * 所以这里每一条都写清了「为什么应该是阳性/阴性」，
 * 修改实现时如果这些用例失败，是实现在退步，不是测试写错了。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();

function mk(dept) {
  const r = SCHEMA.emptyRecord();
  r.basic.name = '测试';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.department = dept || 'general';
  r.basic.chiefComplaint = '不适';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '1天前出现不适';
  return r;
}

/** 在指定字段写入一个查体值，返回 abnormalPE 是否识别为阳性 */
function detect(group, key, value, dept) {
  const r = mk(dept);
  r.pe[group] = { [key]: value };
  return GENERATOR.abnormalPE(r).length > 0;
}

/* ======================= 必须识别为阳性 ======================= */

const MUST_BE_POSITIVE = [
  // 顿号并列：前半阳性、后半阴性，不能因为后半的否定吞掉前半
  ['abdomen', 'abdPalpation', '右下腹压痛、无反跳痛', '阑尾炎最典型的写法'],
  ['abdomen', 'abdPalpation', '肝区叩击痛阳性、Murphy征阴性', '胆囊炎常见写法'],
  ['abdomen', 'abdPalpation', '右上腹可触及包块、无反跳痛', '包块是阳性'],
  ['abdomen', 'abdPalpation', '上腹部压痛、无反跳痛，腹肌紧张', '两处阳性'],

  // 「无痛性」是否定「痛」，不是否定「包块」
  ['abdomen', 'abdPalpation', '无痛性包块', '无痛性肿块本身就是体征'],
  ['abdomen', 'abdPalpation', '无痛性淋巴结肿大', '同上'],
  ['abdomen', 'abdPalpation', '右下腹无痛性包块', '同上'],

  // 「未闻及」后接生理性声音消失 = 阳性
  ['special_obstetrics', 'obsExtra2', '未闻及胎心', '听不到胎心提示胎儿窘迫', 'obstetrics'],
  ['chest', 'lungAuscultation', '未闻及呼吸音', '呼吸音消失提示气胸/肺不张'],

  // 普通阳性
  ['abdomen', 'abdPalpation', '压痛阳性', '阳性'],
  ['abdomen', 'abdPalpation', '全腹压痛、反跳痛', '腹膜炎体征'],
  ['abdomen', 'abdPalpation', '腹肌紧张，呈板状腹', '腹膜炎体征'],
  ['spine', 'dorsalisPedis', '单侧足背动脉搏动未触及', '摸不到脉搏是体征'],
  ['chest', 'lungAuscultation', '双肺可闻及哮鸣音', '阳性'],
  ['chest', 'heartAuscultation', '心音低钝', '阳性'],
  ['general', 'face', '急性病容', '阳性'],
  ['neck', 'neckVessel', '颈静脉怒张', '阳性'],
  ['chest', 'chestShape', '桶状胸', '阳性'],
  ['spine', 'limbs', '杵状指', '阳性'],
  ['abdomen', 'abdAuscultation', '肠鸣音活跃', '阳性'],

  // 部分否定：否定只作用于它前面的部位
  ['spine', 'edemaAnkle', '双下肢无水肿、右上肢轻度水肿', '右上肢是另一个部位']
];

MUST_BE_POSITIVE.forEach(([g, k, v, why, dept]) => {
  test(`阳性：${v}（${why}）`, () => {
    assert.equal(detect(g, k, v, dept), true, `「${v}」应识别为阳性体征：${why}`);
  });
});

/* ======================= 不得识别为阳性 ======================= */

const MUST_BE_NEGATIVE = [
  ['abdomen', 'abdPalpation', '全腹无压痛、反跳痛', '否定作用于并列项'],
  ['abdomen', 'abdPalpation', '肝脾未及', '「未及」= 未触及'],
  ['abdomen', 'abdPalpation', '腹软，无压痛', '两个都是正常/阴性'],
  ['abdomen', 'abdPalpation', '肝脾肋下未触及', '否定词在后'],
  ['abdomen', 'abdPalpation', 'Murphy征阴性', '阴性'],
  ['abdomen', 'abdPalpation', '未触及包块', '否定 + 名词'],
  ['abdomen', 'abdPalpation', '未发现异常', '未发现'],
  ['abdomen', 'abdPalpation', '未查', '没检查，不是体征'],
  ['spine', 'edemaAnkle', '双下肢不肿', '不肿'],
  ['abdomen', 'abdAuscultation', '腹部平坦，未见腹壁静脉曲张', '正常描述'],
  ['abdomen', 'abdAuscultation', '肠鸣音正常', '正常'],
  ['spine', 'limbs', '四肢肌力正常', '正常'],
  ['chest', 'heartAuscultation', '各瓣膜听诊区未闻及病理性杂音', '未闻及杂音'],
  ['chest', 'lungAuscultation', '双肺呼吸音清', '正常'],
  ['general', 'nutrition', '营养良好', '正常'],
  ['general', 'conscious', '神志清楚，精神一般', '正常'],
  ['chest', 'chestShape', '心界不大', '正常']
];

MUST_BE_NEGATIVE.forEach(([g, k, v, why]) => {
  test(`阴性：${v}（${why}）`, () => {
    assert.equal(detect(g, k, v), false, `「${v}」不应被当成阳性体征：${why}`);
  });
});

/* ======================= 正常表述不得被子串误伤 ======================= */

test('「包块不大」不能说成正常（不大是形容包块大小，不是"没有包块"）', () => {
  assert.equal(detect('abdomen', 'abdPalpation', '右下腹可触及包块不大'), true,
    '包块不管大小都是阳性体征');
});

test('「心律齐心音低钝」不能因为含「律齐」就整句判正常', () => {
  assert.equal(detect('chest', 'heartAuscultation', '心律齐心音低钝'), true,
    '句中有心音低钝这个异常');
});

/* ======================= 端到端：摘要不能自相矛盾 ======================= */

test('端到端：产科「未闻及胎心」必须进摘要与首次病程录 O 段', () => {
  const r = mk('obstetrics');
  r.basic.gender = '女';
  r.basic.age = '28';
  r.basic.chiefComplaint = '停经34周，胎动减少2天';
  r.basic.chiefComplaintDuration = '2';
  r.hpi.onset = '2天前自觉胎动减少';
  r.pe.special_obstetrics = { obsExtra2: '未闻及胎心' };

  const summary = GENERATOR.draftSummary(r);
  assert.ok(summary.includes('未闻及胎心'), `摘要应写出该体征，实际：${summary}`);
  assert.ok(!summary.includes('查体未见明显阳性体征'), '不得写成没有阳性体征');

  const fc = GENERATOR.buildFirstCourseRecord(r);
  assert.ok(fc.includes('未闻及胎心'), '首次病程录 O 段应写出该体征');
  assert.ok(!fc.includes('未见与诊断相关的阳性体征'), 'O 段不得写成没有阳性体征');
});

test('端到端：阑尾炎「右下腹压痛、无反跳痛」必须进摘要', () => {
  const r = mk('surgery');
  r.basic.chiefComplaint = '转移性右下腹痛';
  r.hpi.onset = '1天前脐周痛，6小时后转移至右下腹';
  r.pe.abdomen = { abdPalpSuperficial: '右下腹压痛、无反跳痛' };

  const summary = GENERATOR.draftSummary(r);
  assert.ok(summary.includes('压痛'), `摘要应包含压痛，实际：${summary}`);
  assert.ok(!summary.includes('查体未见明显阳性体征'), '不得写成没有阳性体征');
});
