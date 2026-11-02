'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { bootGlobals } = require('./bootstrap.cjs');

const ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'tools', 'tpl-parts', 'stroke.cjs');
const JS_COPY = path.join(ROOT, 'src', 'template-data.js');
const TS_COPY = path.join(ROOT, 'packages', 'domain', 'src', 'template-data.ts');
const FORBIDDEN_SIDES = ['左侧', '右侧', '左上肢', '右上肢', '左下肢', '右下肢', '右手', '左手'];
const SIDE_PLACEHOLDERS = ['（患侧）', '（对侧）', '（健侧）'];

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadTsCopy() {
  const context = { module: { exports: {} } };
  vm.runInNewContext(fs.readFileSync(TS_COPY, 'utf8'), context, { filename: TS_COPY });
  return context.module.exports;
}

function strokeOf(list, label) {
  const template = list.find((item) => item.key === 'stroke');
  assert.ok(template, `${label} 中缺少 stroke 模板`);
  return template;
}

function strokeText(template) {
  return JSON.stringify({
    name: template.name,
    alias: template.alias,
    hint: template.hint,
    record: template.record,
  });
}

test('stroke template has no hard-coded side in source, generated JS, or generated TS', () => {
  delete require.cache[require.resolve(JS_COPY)];
  const source = require(SOURCE_FILE);
  const jsCopy = strokeOf(require(JS_COPY), '生成的 JS');
  const tsCopy = strokeOf(loadTsCopy(), '生成的 TS');
  const copies = [
    ['模板源文件', source],
    ['生成的 JS', jsCopy],
    ['生成的 TS', tsCopy],
  ];

  for (const [label, template] of copies) {
    const text = strokeText(template);
    for (const side of FORBIDDEN_SIDES) {
      assert.ok(!text.includes(side), `${label}的 stroke 模板仍含「${side}」`);
    }
    assert.ok(text.includes('（患侧）'), `${label}缺少患侧占位符`);
    assert.ok(text.includes('（对侧）'), `${label}缺少对侧占位符`);
    assert.ok(text.includes('（健侧）'), `${label}缺少健侧占位符`);
  }

  for (const side of FORBIDDEN_SIDES) {
    assert.ok(!fs.readFileSync(SOURCE_FILE, 'utf8').includes(side),
      `stroke 模板注释或别名仍含「${side}」`);
  }
  assert.match(source.name, /（对侧）/, '模板名称应保留可填写的病灶侧占位符');
});

test('stroke source, generated JS, and generated TS stay in sync', () => {
  const source = plain(require(SOURCE_FILE));
  const jsCopy = plain(strokeOf(require(JS_COPY), '生成的 JS'));
  const tsCopy = plain(strokeOf(loadTsCopy(), '生成的 TS'));
  const expected = {
    key: source.key,
    dept: source.dept,
    name: source.name,
    alias: source.alias,
    hint: source.hint,
    record: source.record,
  };

  assert.deepEqual(jsCopy, expected, 'src/template-data.js 副本未与模板源同步');
  assert.deepEqual(tsCopy, expected, 'packages/domain/src/template-data.ts 副本未与模板源同步');
});

test('templates helper lists side placeholders and apply keeps them verbatim', () => {
  const { SCHEMA, TEMPLATES } = bootGlobals();
  const placeholders = TEMPLATES.unfilledPlaceholders('stroke');
  const kinds = new Set(placeholders.map((item) => item.placeholder));
  assert.deepEqual([...kinds].sort(), [...SIDE_PLACEHOLDERS].sort());
  assert.ok(placeholders.some((item) => item.path === 'name'), '应能定位到模板名称里的占位符');
  assert.ok(placeholders.some((item) => item.path.startsWith('record.')), '应能定位到病历字段里的占位符');

  const record = SCHEMA.emptyRecord();
  const result = TEMPLATES.apply(record, 'stroke');
  assert.equal(result.ok, true);
  assert.match(record.basic.chiefComplaint, /（患侧）/, '患侧不得被自动改成左或右');
  assert.match(record.hpi.evolution, /向（健侧）歪斜/, '健侧不得被自动改成左或右');
  assert.match(record.auxiliary.items[0].result, /（对侧）基底节/, '影像病灶侧占位符应原样保留');
  assert.match(record.auxiliary.items[3].result, /（患侧）上肢3分、（患侧）下肢2分/, 'NIHSS 侧别占位符应原样保留');

  const appliedText = JSON.stringify(result.values);
  for (const side of FORBIDDEN_SIDES) {
    assert.ok(!appliedText.includes(side), `套用结果把占位符自动填成了「${side}」`);
  }
});

test('stroke template outputs never nest full-width parentheses around placeholders', () => {
  const { SCHEMA, TEMPLATES, GENERATOR } = bootGlobals();
  const record = SCHEMA.emptyRecord();
  assert.equal(TEMPLATES.apply(record, 'stroke').ok, true);
  const outputs = [
    ['模板源文件', strokeText(require(SOURCE_FILE))],
    ['生成的 JS', strokeText(strokeOf(require(JS_COPY), '生成的 JS'))],
    ['生成的 TS', strokeText(strokeOf(loadTsCopy(), '生成的 TS'))],
    ['套用后病历', JSON.stringify(record)],
    ['入院记录', GENERATOR.generate(record).text],
    ['首次病程录', GENERATOR.buildFirstCourseRecord(record, { date: '2026-10-20 10:30' })],
    ['出院记录', GENERATOR.buildDischargeRecord(record)],
  ];
  for (const [label, text] of outputs) {
    assert.ok(!text.includes('（（'), `${label}含嵌套括号「（（」`);
    assert.ok(!text.includes('））'), `${label}含嵌套括号「））」`);
  }
  const placeholders = TEMPLATES.unfilledPlaceholders('stroke');
  assert.ok(placeholders.some((item) => item.path === 'name' && item.placeholder === '（对侧）'));
  assert.match(record.diagnosis.confirmed[0], /^（对侧）大脑中动脉供血区急性缺血性脑卒中$/);
});
