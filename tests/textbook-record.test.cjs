/**
 * 病历书写格式 —— 对照《诊断学》第10版 第六篇·病历书写
 *
 * 这一组测试守的是「病历写出来长什么样」，不是「诊断对不对」。
 * 每一条都注明教材原文出处，改代码前请先读那一段。
 *
 * 教材页码（人民卫生出版社《诊断学》第10版）：
 *   一般状况 558 页；婚姻史/生育史/家族史 557 页；
 *   诊断/初步诊断/修正诊断/医师签名 558-559 页。
 * 原文提取见 tools/book-record.txt。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();
const G = GENERATOR;
const S = SCHEMA;

// 与 generator.test.cjs 的 makeRecord 保持一致：一份「填得差不多」的病历，
// 让各 build 函数走正常分支，而不是全空分支。
function makeRecord(deptKey) {
  const r = S.emptyRecord();
  r.basic.department = deptKey;
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.marital = '已婚';
  r.basic.chiefComplaint = '咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  return r;
}

/* ===================== 一般状况：一整句逗号连写 ===================== */

test('一般状况写成一句逗号连写，不用句号断开', () => {
  // 教材 558 页原文：「发育（正常、异常），营养（良好、中等、不良），神志（清晰…），
  // 体位（自主、被动、强迫），面容与表情（…），检查能否合作。」——六项是一条句子。
  // 医院模板 tools/docx-dump.txt:86 同样写「发育正常，营养良好，神志清楚，自主体位。」
  const r = makeRecord('digestive');
  // 通用查体默认全不勾，要显式勾上这一组才看得到正文
  S.PE_COMMON.find(g => g.key === 'general').items
    .forEach(it => S.setPeChecked(r, 'general', it.key, true));
  const pe = G.buildPE(r);
  const line = pe.split('\n').find(l => l.startsWith('一般状况'));
  assert.ok(line, '体格检查里应有「一般状况」这一行');
  // 六项之间必须是逗号，不能是句号
  assert.match(line, /一般状况：.*，.*，/);
  assert.doesNotMatch(line, /一般状况：[^。]*。[^。]+。/,
    '一般状况应整句写完才用句号，不能逐项断开');
  assert.ok(line.endsWith('。'));
});

test('体位写作「自主体位」，不写「自动体位」', () => {
  // 教材原文体位为「自主、被动、强迫」；「自动体位」是常见误写
  const posture = S.findPEItem('general.posture');
  assert.equal(posture.default, '自主体位');
  assert.ok(posture.options.includes('自主体位'));
});

test('旧存档里的「自动体位」仍算默认值，不得被当成阳性体征', () => {
  // 升级后旧文案必须还能被认出来，否则一整批老病历会冒出「体位异常」
  const it = S.findPEItem('general.posture');
  assert.equal(S.peValueIsDefault(it, '自动体位'), true);
  const r = makeRecord('general');
  r.pe.general.posture = '自动体位';
  assert.ok(!G.abnormalPE(r).some(x => x.includes('自动体位')));
});

/* ======================= 生育史：四项式 ======================= */

test('生育史按「足月-早产-流产-存活」四项式书写', () => {
  // 教材 557 页：「生育史按下列顺序写明：足月分娩数-早产数-流产或人流数-存活数，
  // 并记录避孕措施。」
  const r = makeRecord('gynecology');
  r.basic.gender = '女';
  r.childbirth = { fullTerm: '1', premature: '0', abortion: '1', alive: '1' };
  const t = G.buildMarriageChildbirth(r);
  assert.match(t, /1-0-1-1/);
});

test('四项式缺项补 0，不写出「1---1-」这种残缺格式', () => {
  const r = makeRecord('gynecology');
  r.basic.gender = '女';
  r.childbirth = { fullTerm: '2', alive: '2' };
  const t = G.buildMarriageChildbirth(r);
  assert.match(t, /2-0-0-2/);
  assert.doesNotMatch(t, /2----2/);
});

test('避孕措施用教材原词，不写「避孕方式」', () => {
  const r = makeRecord('gynecology');
  r.basic.gender = '女';
  r.childbirth = { fullTerm: '1', alive: '1', contraception: '宫内节育器' };
  const t = G.buildMarriageChildbirth(r);
  assert.match(t, /避孕措施：宫内节育器/);
  assert.doesNotMatch(t, /避孕方式/);
});

test('旧存档只有孕次产次时仍写「孕X产Y」，不得被改写成四项式', () => {
  // 关键回归：abortion 同时属于旧写法（流产Z次）和四项式（第三位）。
  // 若让它触发四项式，一份「孕2产1，流产1次」的老病历会变成「0-0-1-0」，信息全丢。
  const r = makeRecord('gynecology');
  r.basic.gender = '女';
  r.childbirth = { gravida: '2', para: '1', abortion: '1' };
  const t = G.buildMarriageChildbirth(r);
  assert.match(t, /孕2产1/);
  assert.match(t, /流产1次/);
  assert.doesNotMatch(t, /0-0-1-0/);
});

/* ======================= 婚姻史：性生活与夫妻关系 ======================= */

test('婚姻史写出性生活情况与夫妻关系', () => {
  // 教材 557 页：「婚姻史包括婚姻状况，结婚年龄，配偶健康状况、性生活情况、夫妻关系等。」
  const r = makeRecord('general');
  r.basic.gender = '男';
  r.marriage = { status: '已婚', age: '28', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' };
  const t = G.buildMarriageHistory(r);
  assert.match(t, /性生活正常/);
  assert.match(t, /夫妻关系和睦/);
});

test('性生活/夫妻关系留空则完全不出现，绝不代填', () => {
  // 这是隐私项，没问就是没问。默认成「正常」等于替患者回答了没问过的问题。
  const r = makeRecord('general');
  r.marriage = { status: '已婚', age: '28', spouseHealth: '配偶体健' };
  const t = G.buildMarriageHistory(r);
  assert.doesNotMatch(t, /性生活/);
  assert.doesNotMatch(t, /夫妻关系/);
});

test('用户写了完整句子时不重复加标签', () => {
  const r = makeRecord('general');
  r.marriage = { status: '已婚', sexLife: '性生活正常', relation: '夫妻关系和睦' };
  const t = G.buildMarriageHistory(r);
  assert.doesNotMatch(t, /性生活性生活/);
  assert.doesNotMatch(t, /夫妻关系夫妻关系/);
});

/* ======================= 家族史：传染病史独立一条 ======================= */

test('家族史含结核、肝炎、性病等传染病史一条', () => {
  // 教材 557 页家族史三问之二：「家族中有无结核、肝炎、性病等传染性疾病」
  const r = makeRecord('general');
  const t = G.buildFamily(r);
  assert.match(t, /结核、肝炎、性病等传染性疾病/);
});

test('家族传染病史与遗传病分成两句，不能合并', () => {
  const r = makeRecord('general');
  const t = G.buildFamily(r);
  const infect = t.indexOf('传染性疾病');
  const genetic = t.indexOf('遗传性疾病');
  assert.ok(infect > -1 && genetic > -1, '两句都应存在');
  assert.ok(infect < genetic, '传染病史在前，遗传病在后');
  // 中间必须有句号分隔，否则会被读成一句话
  assert.match(t.slice(infect, genetic), /。/);
});

test('用户填的家族传染病史优先于默认阴性表述', () => {
  const r = makeRecord('general');
  r.family.infectionHistory = '父亲有肺结核病史';
  const t = G.buildFamily(r);
  assert.match(t, /父亲有肺结核病史/);
  assert.doesNotMatch(t, /否认结核、肝炎、性病/);
});

/* ======================= 诊断：排序、待查、签名 ======================= */

test('诊断按用户排的顺序编号，程序不重排', () => {
  // 教材 558 页：「分清主次，按顺序排列，主要疾病在前，次要疾病在后，
  // 并发症列于有关主病之后，伴发病排列在最后。」
  // 哪个是主病只有接诊的人知道，程序绝不替用户排序。
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['急性阑尾炎', '2型糖尿病', '阑尾周围脓肿'];
  const t = G.buildDiagnosis(r);
  assert.equal(t, '1. 急性阑尾炎\n2. 2型糖尿病\n3. 阑尾周围脓肿');
});

test('待查类诊断后面没跟候选病名时给出提示', () => {
  // 教材 558-559 页：「可暂以某症状待诊或待查作为诊断，并应在其后注明一两个
  // 可能性较大或待排除疾病的病名，如"发热待查，肠结核？"。」
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['发热待查'];
  const w = G.validate(r);
  assert.ok(w.some(x => x.includes('待查') && x.includes('肠结核？')),
    '应提示补上可能性较大的病名');
});

test('「发热待查，肠结核？」这种规范写法不报待查问题', () => {
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['发热待查，肠结核？'];
  const w = G.validate(r).filter(x => x.includes('待查'));
  assert.equal(w.length, 0);
});

test('待查排在明确诊断前面时提示确认主次', () => {
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['腹痛待查', '急性胃炎'];
  const w = G.validate(r);
  assert.ok(w.some(x => x.includes('主次')), '应提示主次可能反了');
});

test('英文问号提示改成中文「？」', () => {
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['肠结核?'];
  const w = G.validate(r);
  assert.ok(w.some(x => x.includes('英文问号')));
});

test('问号写在病名中间时提示挪到末尾', () => {
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['肠结核？可能'];
  const w = G.validate(r);
  assert.ok(w.some(x => x.includes('问号不在病名末尾')));
});

test('规范的中文问号结尾写法不报错', () => {
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['肠结核？'];
  const w = G.validate(r).filter(x => x.includes('问号'));
  assert.equal(w.length, 0);
});

test('填了医师签名就输出到初步诊断右下角', () => {
  // 教材 559 页：「书写入院记录的医师在初步诊断的右下角签全名，字迹应清楚易认。」
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['急性阑尾炎'];
  r.diagnosis.signature = '李四';
  const t = G.buildDiagnosis(r);
  assert.match(t, /^1\. 急性阑尾炎/);
  assert.match(t, /医师签名：李四/);
  assert.ok(t.indexOf('医师签名') > t.indexOf('急性阑尾炎'), '签名应在诊断之后');
});

test('没填医师签名就不出现签名行，也不提醒时必须填', () => {
  // 「不代填」原则：签谁的名只有本人知道，程序不生成占位签名
  const r = makeRecord('general');
  r.diagnosis.confirmed = ['急性阑尾炎'];
  assert.doesNotMatch(G.buildDiagnosis(r), /医师签名/);
  const w = G.validate(r);
  assert.ok(w.some(x => x.includes('医师签名')), '应在质控里提醒补签名');
});

test('完全没填诊断时仍提示待补充', () => {
  const r = makeRecord('general');
  assert.equal(G.buildDiagnosis(r), '待补充。');
});

/* ------------------------------------------------------------------ *
 * 病历摘要：不许出现「患者。」这种残句
 *
 * 摘要的第一句是「患者，男，45岁，因"腹痛3天"来院」。
 * 性别、年龄、主诉三者都没有时，这一句只剩「患者」两个字，
 * 加个句号就成了「患者。」——读者会以为病历坏了。
 * 宁可不写这一句，也不要写半个句子。
 * ------------------------------------------------------------------ */
test('空病历的摘要不出现「患者。」残句', () => {
  const r = makeRecord('digestive');
  // makeRecord 默认带了姓名性别年龄，要真正空掉才算「空病历」
  r.basic.gender = '';
  r.basic.age = '';
  r.basic.chiefComplaint = '';
  const t = G.buildSummary(r);
  assert.ok(!/^患者。/.test(t), `摘要不应以「患者。」开头，实际：${t.slice(0, 20)}`);
});

test('只有主诉没有性别年龄时，主诉句前不留多余逗号', () => {
  const r = makeRecord('digestive');
  r.basic.gender = '';
  r.basic.age = '';
  r.basic.chiefComplaint = '腹痛';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  const t = G.buildSummary(r);
  assert.ok(t.startsWith('患者因“腹痛3天”来院'), `实际开头：${t.slice(0, 30)}`);
  assert.ok(!t.startsWith('患者，因'), '没有性别年龄时「患者」后面不该跟逗号');
});

test('性别年龄主诉齐全时摘要开头完整', () => {
  const r = makeRecord('digestive');
  r.basic.gender = '女';
  r.basic.age = '32';
  r.basic.chiefComplaint = '腹痛';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  const t = G.buildSummary(r);
  assert.ok(t.startsWith('患者，女，32岁，因“腹痛3天”来院'), `实际开头：${t.slice(0, 40)}`);
});
