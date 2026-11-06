/* ===========================================================================
 * v3.0.0.10 review 修复回归：P2-4 formatAge 儿科习惯写法
 * 「1岁3个月」不能显示成「1.25岁」，保持「X岁X个月」。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { AGE, GENERATOR } = bootGlobals();

test('P2-4 一岁三个月按「1岁3个月」显示，不显示小数岁', () => {
  assert.equal(AGE.formatAge({ years: 1.25 }), '1岁3个月');
  assert.equal(AGE.parseAge('1岁3个月').text, '1岁3个月');
  assert.equal(AGE.parseAge('1岁半').text, '1岁6个月');
  assert.equal(AGE.parseAge('1.25岁').text, '1岁3个月');
});

test('P2-4 按出生日期算出的零头月龄同样用岁+月', () => {
  const info = AGE.ageFromDates('2025-01-15', '2026-04-15');
  assert.equal(info.ok, true);
  assert.equal(info.text, '1岁3个月');
});

test('P2-4 既有日龄/月龄/整岁口径不变', () => {
  assert.equal(AGE.formatAge({ days: 14 }), '14日龄');
  assert.equal(AGE.formatAge({ months: 7 }), '7月龄');
  assert.equal(AGE.formatAge({ years: 45 }), '45岁');
  assert.equal(AGE.formatAge({ years: 62, months: 747 }), '62岁');
  assert.equal(AGE.ageFromDates('1964-03-12', '2026-10-20').text, '62岁');
  assert.equal(AGE.display({ age: '14日龄' }), '14日龄');
  assert.equal(AGE.display({ age: '7月' }), '7月龄');
  assert.equal(GENERATOR.ageWithUnit({ age: '1岁3个月' }), '1岁3个月');
});
