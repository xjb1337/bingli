'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('P0-1 stroke 模板的侧别占位符会进入 validate 与 validateStructured', () => {
  const { SCHEMA, TEMPLATES, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.name = '测试患者';
  record.basic.gender = '女';
  record.basic.age = '68';
  assert.equal(TEMPLATES.apply(record, 'stroke').ok, true);

  const messages = GENERATOR.validate(record);
  assert.ok(messages.some(message => /^【模板】仍有 \d+ 处侧别占位符（患侧\/对侧\/健侧）未改成左或右：.+。$/.test(message)),
    `validate 应提示侧别占位符，实际：${messages.join(' | ')}`);

  const structured = GENERATOR.validateStructured(record);
  const hit = structured.find(item => item.code === 'SIDE_PLACEHOLDER_UNFILLED');
  assert.ok(hit, 'validateStructured 应包含 SIDE_PLACEHOLDER_UNFILLED');
  assert.equal(hit.severity, 'error');
  assert.equal(hit.document, 'record');
  assert.equal(hit.action, '把占位符改成左或右');
  assert.ok(Array.isArray(hit.paths) && hit.paths.length > 0, 'paths 应为命中的唯一字段路径');
  assert.ok(hit.paths.includes('basic.chiefComplaint'), `paths 应包含 basic.chiefComplaint，实际：${hit.paths.join(',')}`);
  assert.ok(Array.isArray(hit.evidence) && hit.evidence.length >= 1, 'evidence 应逐次记录命中');
  assert.ok(hit.evidence.every(item => item.path && typeof item.text === 'string' && item.text.length));
  assert.match(hit.message, /^【模板】仍有 \d+ 处侧别占位符/);
});

test('P0-1 全部改成左/右后不再报，其他模板与空病历不误报', () => {
  const { SCHEMA, TEMPLATES, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.name = '测试患者';
  record.basic.gender = '女';
  record.basic.age = '68';
  assert.equal(TEMPLATES.apply(record, 'stroke').ok, true);
  const fixed = JSON.parse(JSON.stringify(record)
    .replace(/（患侧）/g, '左')
    .replace(/（对侧）/g, '右')
    .replace(/（健侧）/g, '左'));
  assert.equal(GENERATOR.validateStructured(fixed).filter(item => item.code === 'SIDE_PLACEHOLDER_UNFILLED').length, 0);
  assert.equal(GENERATOR.validate(fixed).filter(message => message.indexOf('【模板】仍有') === 0).length, 0);

  assert.equal(GENERATOR.validateStructured(SCHEMA.emptyRecord()).filter(item => item.code === 'SIDE_PLACEHOLDER_UNFILLED').length, 0);
  for (const template of TEMPLATES.all()) {
    if (template.key === 'stroke') continue;
    const other = SCHEMA.emptyRecord();
    other.basic.gender = '女';
    other.basic.age = '40';
    assert.equal(TEMPLATES.apply(other, template.key).ok, true, `模板 ${template.key} 应可套用`);
    assert.equal(GENERATOR.validateStructured(other).filter(item => item.code === 'SIDE_PLACEHOLDER_UNFILLED').length, 0,
      `模板 ${template.key} 不应误报侧别占位符`);
  }
});

test('P0-3 月经史支持未初潮，已绝经保留初潮/绝经年龄/末次月经', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  const make = (applicable, extra) => {
    const record = SCHEMA.emptyRecord();
    record.basic.gender = '女';
    record.basic.age = '60';
    record.menstruation.applicable = applicable;
    if (extra) Object.assign(record.menstruation, extra);
    return record;
  };

  const girl = make('未初潮');
  girl.basic.age = '3';
  assert.equal(GENERATOR.buildMenstruation(girl), '月经史：未初潮。');
  const girlExtra = make('未初潮', { extra: '尚未发育' });
  girlExtra.basic.age = '3';
  assert.equal(GENERATOR.buildMenstruation(girlExtra), '月经史：未初潮，尚未发育。');

  const menopause = make('无', { age: '14', menopauseAge: '50', lmp: '2026-01-01' });
  assert.equal(GENERATOR.buildMenstruation(menopause), '月经史：初潮14岁，50岁绝经，末次月经2026-01-01。');

  assert.equal(GENERATOR.buildMenstruation(make('无')), '已绝经。');
  assert.equal(GENERATOR.buildMenstruation(make('无', { extra: '50岁绝经' })), '50岁绝经。');
});

test('P0-3 女童写已绝经时 validate 给出 warning 并结构化登记', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.name = '测试女童';
  record.basic.gender = '女';
  record.basic.age = '3';
  record.menstruation.applicable = '无';

  const messages = GENERATOR.validate(record);
  assert.ok(messages.some(message => message === '【月经史】患儿 3岁却写「已绝经」，请核对。'),
    `应提示女童已绝经，实际：${messages.join(' | ')}`);
  const hit = GENERATOR.validateStructured(record).find(item => item.code === 'MENSTRUATION_CHILD_MENOPAUSE');
  assert.ok(hit, 'validateStructured 应包含 MENSTRUATION_CHILD_MENOPAUSE');
  assert.equal(hit.severity, 'warning');

  const adult = SCHEMA.emptyRecord();
  adult.basic.gender = '女';
  adult.basic.age = '60';
  adult.menstruation.applicable = '无';
  adult.menstruation.age = '14';
  adult.menstruation.menopauseAge = '50';
  assert.equal(GENERATOR.validate(adult).filter(message => message.indexOf('【月经史】') === 0).length, 0);
});

function vitalRecord(age, vitals) {
  const { SCHEMA } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.gender = '男';
  record.basic.age = age;
  record.pe.vitals = Object.assign({
    temperature: '36.5', pulse: '80', respiration: '16', sbp: '110', dbp: '70'
  }, vitals);
  return record;
}

test('P0-4 儿童生命体征按 PALS 年龄分层判断', () => {
  const { GENERATOR } = bootGlobals();
  const infant = GENERATOR.draftSummary(vitalRecord('8月', { pulse: '130', respiration: '35', sbp: '85', dbp: '50' }));
  assert.ok(!infant.includes('P 130'), `8月龄 P130 不应列入异常：${infant}`);
  assert.ok(!infant.includes('R 35'), `8月龄 R35 不应列入异常：${infant}`);
  assert.ok(!infant.includes('BP 85'), `8月龄 BP85/50 不应列入异常：${infant}`);

  const infantHigh = GENERATOR.draftSummary(vitalRecord('8月', { pulse: '180' }));
  assert.ok(infantHigh.includes('P 180次/分'), `8月龄 P180 应列入异常：${infantHigh}`);

  const toddler = GENERATOR.draftSummary(vitalRecord('3岁', { pulse: '120', respiration: '24', sbp: '85' }));
  assert.ok(!toddler.includes('P 120'), `3岁 P120 不应列入异常：${toddler}`);
  assert.ok(!toddler.includes('R 24'), `3岁 R24 不应列入异常：${toddler}`);
  assert.ok(!toddler.includes('BP 85'), `3岁 SBP85 不应列入低血压：${toddler}`);
});

test('P0-4 成人阈值覆盖低体温与舒张压异常', () => {
  const { GENERATOR } = bootGlobals();
  const hypertension = GENERATOR.draftSummary(vitalRecord('45岁', { sbp: '130', dbp: '115' }));
  assert.ok(hypertension.includes('BP 130/115mmHg'), `成人 DBP115 应列入异常：${hypertension}`);

  const hypothermia = GENERATOR.draftSummary(vitalRecord('45岁', { temperature: '35.0' }));
  assert.ok(hypothermia.includes('T 35.0℃'), `成人 T35.0 应列入异常：${hypothermia}`);

  const normal = GENERATOR.draftSummary(vitalRecord('45岁', { pulse: '88', sbp: '120', dbp: '80' }));
  assert.ok(!normal.includes('P 88'), `成人 P88 不应列入异常：${normal}`);
  assert.ok(!normal.includes('BP 120'), `成人 BP120/80 不应列入异常：${normal}`);
});

test('P1-1 ageWithUnit 对无法解析的年龄原样返回', () => {
  const { GENERATOR } = bootGlobals();
  assert.equal(GENERATOR.ageWithUnit({ age: 'abc' }), 'abc');
  assert.equal(GENERATOR.ageWithUnit({ age: '-3' }), '-3');
  assert.equal(GENERATOR.ageWithUnit({ age: '45' }), '45岁');
  assert.equal(GENERATOR.ageWithUnit({ age: '1岁3个月' }), '1岁3个月');
  assert.equal(GENERATOR.ageWithUnit({ age: '14日龄' }), '14日龄');
});

test('P1-1 subjectOf 对无效年龄按患者称呼', () => {
  const { GENERATOR } = bootGlobals();
  assert.equal(GENERATOR.subjectOf({ age: '-3' }), '患者');
  assert.equal(GENERATOR.subjectOf({ age: 'abc' }), '患者');
  assert.equal(GENERATOR.subjectOf({ age: '45' }), '患者');
  assert.equal(GENERATOR.subjectOf({ age: '3' }), '患儿');
});

test('P1-1 validate 校验年龄文本并结构化登记 AGE_INVALID', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  for (const age of ['-3', 'abc', '200']) {
    const record = SCHEMA.emptyRecord();
    record.basic.name = '测试患者';
    record.basic.gender = '男';
    record.basic.age = age;
    const messages = GENERATOR.validate(record);
    assert.ok(messages.includes(`【一般项目】年龄「${age}」无法识别或不合理，请核对。`), `${age} 应提示年龄不合理：${messages.join(' | ')}`);
    const hit = GENERATOR.validateStructured(record).find(item => item.code === 'AGE_INVALID');
    assert.ok(hit, `${age} 应结构化登记 AGE_INVALID`);
    assert.equal(hit.severity, 'warning');
  }
  const ok = SCHEMA.emptyRecord();
  ok.basic.name = '测试患者';
  ok.basic.gender = '男';
  ok.basic.age = '45';
  assert.equal(GENERATOR.validate(ok).filter(message => message.includes('无法识别或不合理')).length, 0);
});

test('P1-2 admissionPid 不把内部记录 id 当住院号', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.id = 'legacy-v1-respiratory';
  record.basic.name = '测试患者';
  record.basic.gender = '男';
  record.basic.age = '45';
  record.basic.department = 'respiratory';
  const text = GENERATOR.generate(record).text;
  assert.ok(text.includes('PID：／'), `无记录号时 PID 应输出／：${text.split('\n')[1]}`);
  assert.ok(!text.includes('PID：legacy-v1-respiratory'), '内部记录 id 不应出现在 PID');
  record.basic.recordNo = 'ZY-0001';
  assert.ok(GENERATOR.generate(record).text.includes('PID：ZY-0001'));
});

test('P1-3 过敏原手写文本先去尾标点再拼「过敏」', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.name = '测试患者';
  record.basic.gender = '男';
  record.basic.age = '45';
  record.pmh.allergy = '有';
  record.pmh.allergenOther = '青霉素。';
  const text = GENERATOR.generate(record).text;
  assert.ok(text.includes('过敏史：青霉素过敏'), `应拼成青霉素过敏：${text}`);
  assert.ok(!text.includes('青霉素。过敏'), '不应出现「青霉素。过敏」');
});

test('P1-3 系统回顾详情先去尾标点再拼逗号', () => {
  const { SCHEMA, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  record.basic.name = '测试患者';
  record.basic.gender = '男';
  record.basic.age = '45';
  record.ros.resp = record.ros.resp || {};
  record.ros.resp.fever = { checked: true, time: '3天', detail: '最高39℃，' };
  const text = GENERATOR.generate(record).text;
  assert.ok(text.includes('发热3天，最高39℃'), `应拼成「发热3天，最高39℃」：${text}`);
  assert.ok(!text.includes('，；'), '不应出现「，；」');
  assert.ok(!text.includes('。，'), '不应出现「。，」');
});
