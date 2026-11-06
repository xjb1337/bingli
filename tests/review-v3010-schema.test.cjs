'use strict';
/* ===========================================================================
 * v3.0.0.10 审查修复：schema / types 回归测试
 * 覆盖 P0-3（menstruation.applicable 新增「未初潮」）与
 * P1-4（childbirth.children 新增字段）。
 * 运行：node --test --test-isolation=none tests/review-v3010-schema.test.cjs
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const fs = require('node:fs');
const path = require('node:path');

const { SCHEMA, CORE } = bootGlobals();
const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(d => d.key);

function readTypesDts() {
  return fs.readFileSync(
    path.join(__dirname, '..', 'packages', 'domain', 'dist', 'types.d.ts'),
    'utf8'
  );
}

/** 最小可迁移记录：normalizeRecord 要求至少有 basic 信息 */
function recordWith(extra) {
  return Object.assign({
    schemaVersion: 3,
    basic: { name: '测试患者', gender: '女', age: '30' }
  }, extra || {});
}

test('P0-3 schema：menstruation.applicable 默认空串，且「未初潮」可保存', () => {
  assert.equal(SCHEMA.emptyRecord().menstruation.applicable, '');
  const out = CORE.normalizeRecord(
    recordWith({ menstruation: { applicable: '未初潮' } }),
    SCHEMA.emptyRecord,
    DEPT_KEYS
  );
  assert.equal(out.menstruation.applicable, '未初潮');
});

test('P0-3 schema：旧数据 applicable 的布尔 true/false 保持原样（迁移兼容）', () => {
  for (const value of [true, false]) {
    const out = CORE.normalizeRecord(
      recordWith({ menstruation: { applicable: value } }),
      SCHEMA.emptyRecord,
      DEPT_KEYS
    );
    assert.equal(out.menstruation.applicable, value);
  }
});

test('P0-3 types：生成的类型声明包含 MenstruationApplicable 与「未初潮」', () => {
  const dts = readTypesDts();
  assert.match(dts, /MenstruationApplicable = '有' \| '无' \| '未初潮' \| ''/);
});

test('P1-4 schema：childbirth.children 默认空串，且可保存', () => {
  assert.equal(SCHEMA.emptyRecord().childbirth.children, '');
  assert.ok('children' in SCHEMA.emptyRecord().childbirth);
  const out = CORE.normalizeRecord(
    recordWith({ childbirth: { children: '2' } }),
    SCHEMA.emptyRecord,
    DEPT_KEYS
  );
  assert.equal(out.childbirth.children, '2');
  // 旧字段 gravida/para 必须保留，兼容旧数据
  assert.ok('gravida' in out.childbirth);
  assert.ok('para' in out.childbirth);
});

test('P1-4 types：生成的类型声明包含 childbirth.children', () => {
  assert.match(readTypesDts(), /children: string/);
});
