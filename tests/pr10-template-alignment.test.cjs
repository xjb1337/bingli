'use strict';

/*
 * PR10 医院入院记录模板对齐。
 * 只约束大病历（generate / record IR）；首次病程录与出院记录保持逐字不变。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, CORE, GENERATOR, TEMPLATES } = bootGlobals();

const ROOT = path.join(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'template-alignment', 'wzrm-neuro-fictional.json');
const BEFORE = path.join(ROOT, 'docs', 'template-alignment', 'before');
const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(dept => dept.key);

function loadFixture() {
  const parsed = CORE.parseImport(fs.readFileSync(FIXTURE, 'utf8'), SCHEMA.emptyRecord, DEPT_KEYS);
  return parsed.records[0].data;
}

function sectionTitles(text) {
  return Array.from(text.matchAll(/^【([^】]+)】$/gm), match => match[1]);
}

test('PR10-01 入院记录标题、眉栏、一般项目与章节顺序符合医院模板', () => {
  const record = loadFixture();
  const text = GENERATOR.generate(record).text;
  const ir = GENERATOR.buildDocumentIR(record, 'record');

  assert.ok(text.startsWith('【入院记录】\n\n【一般项目】\n姓名：虚构患者丙\n'));
  assert.equal(ir.title, '入院记录');
  assert.equal(ir.text, text);

  const expected = [
    '入院记录', '一般项目', '主诉', '现病史', '既往史', '个人史', '婚育史',
    '家族史', '体格检查（一）', '体格检查（二）：补充及专科情况', '实验室检查', '特殊检查', '初步诊断'
  ];
  assert.deepEqual(sectionTitles(text), expected);
  assert.deepEqual(ir.sections.map(section => section.title), expected.slice(1));

  assert.match(text, /姓名：虚构患者丙\n/);
  assert.match(text, /性别：男\n/);
  assert.match(text, /出生地：合成市\n/);
  assert.match(text, /年龄：62岁\n/);
  assert.match(text, /病史陈述者：本人\n病史可靠程度：可靠\n/);
  assert.match(text, /入院日期：2026-10-20 09:50\n/);
  assert.match(text, /记录日期：2026-10-20 10:00\n/);
  assert.match(text, /科别：神经内科\n床号：08\n住院号：TEST-0001\n/);
  ['工作单位', '通讯地址', '电话号码', '籍贯：', '出生日期：', 'PID：'].forEach(label => {
    assert.ok(!text.includes(label), `一般项目不应再输出 ${label}`);
  });
});

test('PR10-02 现病史增加收住入院句、独立一般情况段，且不打印书写规则', () => {
  const record = loadFixture();
  const text = GENERATOR.generate(record).text;
  const hpi = GENERATOR.generate(record).sections['现病史'];
  const [narrative, general] = hpi.split('\n');

  assert.match(hpi, /现为求进一步诊治，遂至我院就诊，拟“脑梗死”收住入院。/);
  assert.match(narrative, /无头痛、恶心呕吐及意识障碍。现为求进一步诊治，遂至我院就诊，拟“脑梗死”收住入院。$/);
  assert.equal(general, '　　起病来，精神稍差，食欲减退，睡眠一般，大小便正常，体重无明显变化。');
  assert.doesNotMatch(general, /发病以来|病来，病来/);
  assert.doesNotMatch(text, /书写规则/);
  assert.doesNotMatch(text, /发生时间、有无诱因/);

  const emptyOther = loadFixture();
  emptyOther.pmh.otherTreatDiseases = '';
  assert.doesNotMatch(GENERATOR.generate(emptyOther).text, /伴发疾病：/);
  emptyOther.pmh.otherTreatDiseases = '高血压病需继续治疗';
  assert.match(GENERATOR.generate(emptyOther).text, /　　伴发疾病：高血压病需继续治疗。/);
});

test('PR10-03 空系统回顾、专项评估、摘要、诊断依据与空可选既往史不输出', () => {
  const record = SCHEMA.emptyRecord();
  Object.assign(record.basic, {
    name: '空白测试', gender: '男', age: '45', department: 'general', chiefComplaint: '咳嗽3天'
  });
  const text = GENERATOR.generate(record).text;

  ['系统回顾', '专项评估', '摘要', '诊断依据'].forEach(title => {
    assert.ok(!text.includes(`【${title}】`), `空内容不应输出【${title}】`);
  });
  assert.ok(text.includes('与本病相关病史：／'));
  assert.ok(!text.includes('其它：'));
  assert.ok(!text.includes('现在需要治疗的其他现病史'));
  assert.ok(!text.includes('书写规则'));

  record.ros.resp = { cough: { status: 'asked_positive', detail: '咳嗽3天' } };
  const withRos = GENERATOR.generate(record).text;
  const titles = sectionTitles(withRos);
  assert.equal(titles.includes('系统回顾'), false);
  assert.equal(record.ros.resp.cough.detail, '咳嗽3天');
});

test('PR10-04 辅助检查按实验室/特殊/病理分组，保留原有 ↑↓ 且不新增箭头', () => {
  const record = loadFixture();
  const text = GENERATOR.generate(record).text;

  assert.match(text, /【实验室检查】\n均于合成市人民医院 2026-10-20 (?:检查号 \S+ )?血常规 /);
  assert.match(text, /【特殊检查】\n2026-10-20 合成市人民医院 检查号 CT-TEST-0001 头颅CT：/);
  assert.ok(!text.includes('病理检查：'), '没有病理条目时不输出空亚组');
  assert.equal((text.match(/↑/g) || []).length, 4, '↑ 只来自原始结果');
  assert.equal((text.match(/↓/g) || []).length, 0, '不得凭空新增 ↓');

  record.auxiliary.items.push({
    name: '病理检查', result: '慢性炎性改变', date: '2026-10-21', hospital: '本院', no: 'PATH-1'
  });
  const withPathology = GENERATOR.generate(record).text;
  assert.match(withPathology, /2026-10-21 本院 检查号 PATH-1 病理检查：慢性炎性改变。/);
});

test('PR10-05 首次病程录与出院记录在虚构模板病例上逐字保持基线', () => {
  const record = loadFixture();
  assert.equal(
    GENERATOR.buildFirstCourseRecord(record, { date: '2026-10-20 10:30' }),
    fs.readFileSync(path.join(BEFORE, 'first-course.txt'), 'utf8')
  );
  assert.equal(
    GENERATOR.buildDischargeRecord(record),
    fs.readFileSync(path.join(BEFORE, 'discharge.txt'), 'utf8')
  );
});

test('PR10-06 文书模板元数据只把入院记录标为已对照', () => {
  const meta = GENERATOR.DOCUMENT_TEMPLATES;
  assert.equal(meta.record.verified, true);
  assert.equal(meta.record.verificationStatus, 'verified');
  assert.equal(meta.record.verificationLabel, '已对照');
  assert.deepEqual(meta.record.source, {
    kind: 'hospital-template',
    label: '温州市人民医院入院记录模板（完善版结构对照）'
  });
  [meta.firstCourse, meta.discharge].forEach(item => {
    assert.equal(item.verified, false);
    assert.equal(item.verificationStatus, 'unverified');
    assert.equal(item.verificationLabel, '待医院模板核对');
  });
  assert.equal(TEMPLATES.DOCUMENT_TEMPLATES.record.verificationStatus, 'verified');
});

test('PR10-07 既往健康状况归一为完整句，自由文本不重复主语，空值不输出', () => {
  const cases = [
    ['平素体健', '患者既往体健。'],
    ['体健', '患者既往体健。'],
    ['健康', '患者既往体健。'],
    ['一般', '患者既往健康状况一般。'],
    ['平素一般', '患者既往健康状况一般。'],
    ['较差', '患者既往健康状况较差。'],
    ['差', '患者既往健康状况较差。'],
    ['患者既往有慢性胃炎', '患者既往有慢性胃炎。'],
    ['既往有慢性胃炎', '患者既往有慢性胃炎。'],
    ['患者有慢性胃炎', '患者既往有慢性胃炎。'],
    ['长期服药', '患者既往长期服药。']
  ];

  cases.forEach(([health, expected]) => {
    const record = loadFixture();
    record.pmh.health = health;
    const pmh = GENERATOR.generate(record).sections['既往史'];
    assert.equal(pmh.split('\n')[0], expected, health);
  });

  const empty = loadFixture();
  empty.pmh.health = '';
  const emptyPMH = GENERATOR.generate(empty).sections['既往史'];
  assert.ok(!emptyPMH.includes('患者既往健康状况'));
  assert.match(emptyPMH, /^既往健康状况：／\n疾病史：/);
});

test('PR10-08 一般情况中的病来分句单独成段且去除重复起句', () => {
  const cases = [
    ['发病以来精神可', '　　起病来，精神可。'],
    ['病来，精神可', '　　起病来，精神可。'],
    ['病来精神可', '　　起病来，精神可。'],
    ['病来以来精神可', '　　起病来，精神可。'],
    ['起病以来精神可', '　　起病来，精神可。'],
    ['起病来，精神可', '　　起病来，精神可。'],
    ['精神可', '　　起病来，精神可。']
  ];

  cases.forEach(([generalCondition, expected]) => {
    const record = loadFixture();
    record.hpi.generalCondition = generalCondition;
    const hpi = GENERATOR.generate(record).sections['现病史'];
    const lines = hpi.split('\n');
    assert.equal(lines[lines.length - 1], expected, generalCondition);
    assert.equal((hpi.match(/起病来，/g) || []).length, 1, generalCondition);
    assert.doesNotMatch(lines[lines.length - 1], /发病以来|起病以来|病来以来|病来，病来/);
  });

  const split = loadFixture();
  split.hpi.generalCondition = '入院时精神可；发病以来食欲差';
  const [narrative, general] = GENERATOR.generate(split).sections['现病史'].split('\n');
  assert.match(narrative, /入院时精神可。现为求进一步诊治，遂至我院就诊，拟“脑梗死”收住入院。$/);
  assert.equal(general, '　　起病来，食欲差。');
});
