/* ===========================================================================
 * v3.0.0.10 review 修复回归：P1-5 旧存档形态迁移（deepMerge 类型不匹配）
 *
 * 背景：旧版本把若干字段存成了与当前 schema 不同的类型（诊断/勾选表是数组、
 * ROS 症状是布尔、过敏史是布尔）。直接深合并会合成 {"0": ...} 或让生成器
 * 把数组下标当病名、把 true 当「未问」，因此归一化入口必须先显式转换；
 * 无法映射的「默认是对象、旧值是非对象」字段保留默认结构，原值登记到
 * meta.legacyUnmapped，保证不丢数据。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();
const CORE = require('../src/core.js');

const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(d => d.key);

/** 造一份可迁移的最小旧存档 */
function legacyRecord(over) {
  return Object.assign({
    schemaVersion: 2,
    basic: { name: '迁移测试', gender: '男', age: '45' }
  }, over || {});
}

function normalize(over) {
  return CORE.normalizeRecord(legacyRecord(over), SCHEMA.emptyRecord, DEPT_KEYS);
}

/* ------------------------- 四个验收复现 ------------------------- */

test('P1-5 复现一：diagnosis 为字符串数组时迁入 confirmed', () => {
  const out = normalize({ diagnosis: ['冠心病'] });
  assert.deepEqual(out.diagnosis.confirmed, ['冠心病']);
  const text = GENERATOR.generate(out).text;
  assert.match(text, /冠心病/);
});

test('P1-5 复现二：pmh.diseaseChecks 为字符串数组时不再出现「既往患0」', () => {
  const out = normalize({ pmh: { diseaseChecks: ['高血压'] } });
  assert.deepEqual(out.pmh.diseaseChecks, { 高血压: true });
  const pmh = GENERATOR.generate(out).sections['既往史'];
  assert.match(pmh, /疾病史：既往患高血压/);
  assert.doesNotMatch(pmh, /既往患0/);
});

test('P1-5 复现二补充：family.diseaseChecks 同样按勾选表迁移', () => {
  const out = normalize({ family: { diseaseChecks: ['糖尿病'] } });
  assert.deepEqual(out.family.diseaseChecks, { 糖尿病: true });
  assert.match(GENERATOR.generate(out).text, /糖尿病/);
});

test('P1-5 旧 ROS 布尔原样保留但不再输出', () => {
  const out = normalize({ ros: { cardio: { palpitation: true } } });
  assert.equal(out.ros.cardio.palpitation, true);
  assert.equal(GENERATOR.generate(out).sections['系统回顾'], undefined);
});

test('P1-5 复现四：pmh.allergy 布尔 true 输出「有」而不是「／」', () => {
  const out = normalize({ pmh: { allergy: true } });
  assert.equal(out.pmh.allergy, '有');
  const pmh = GENERATOR.generate(out).sections['既往史'];
  assert.doesNotMatch(pmh, /过敏史：／/);
  assert.match(pmh, /过敏史：有/);

  const negative = normalize({ pmh: { allergy: false } });
  assert.equal(negative.pmh.allergy, '无');
  assert.match(GENERATOR.generate(negative).sections['既往史'], /过敏史：否认食物、药物过敏史/);
});

/* ------------------- 未知形态不合成错误结构、不丢数据 ------------------- */

test('P1-5：默认是对象、旧值是非对象时保留默认结构并登记 meta.legacyUnmapped', () => {
  const out = normalize({ auxiliary: '旧版辅助检查文本' });
  // 默认结构仍在，没有被合成 {"0": ...}
  assert.equal(typeof out.auxiliary, 'object');
  assert.ok(Array.isArray(out.auxiliary.items));
  assert.equal(out.auxiliary['0'], undefined);
  // 原值不丢：legacyUnmapped + migrationNotes 都留档
  assert.deepEqual(out.meta.legacyUnmapped, { auxiliary: '旧版辅助检查文本' });
  assert.ok(out.meta.migrationNotes.some(n => n.includes('auxiliary') && n.includes('旧版辅助检查文本')));
});

test('P1-5：deepMerge 遇到对象默认值 + 数组旧值时不会生成下标对象', () => {
  const merged = CORE.deepMerge(SCHEMA.emptyRecord(), { auxiliary: ['血常规：正常'] });
  assert.equal(Array.isArray(merged.auxiliary), false);
  assert.equal(typeof merged.auxiliary, 'object');
  assert.equal(merged.auxiliary['0'], undefined);
  assert.ok(Array.isArray(merged.auxiliary.items));
});

test('P1-5：默认是数组、旧值是非数组时也保留默认数组并留档', () => {
  const out = normalize({ diagnosis: { confirmed: '冠心病' } });
  assert.deepEqual(out.diagnosis.confirmed, []);
  assert.equal(out.meta.legacyUnmapped['diagnosis.confirmed'], '冠心病');
});

test('P1-5：空串/空数组不算需要留档的旧数据', () => {
  const out = normalize({ pe: { vitals: '' }, family: { diseaseChecks: [] } });
  assert.deepEqual(out.meta.legacyUnmapped, {});
  assert.deepEqual(out.family.diseaseChecks, {});
});
