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
