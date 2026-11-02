'use strict';

/*
 * PR0 文本黄金样本。
 *
 * 输入固定为 v1/v2/v3 合成病历，首次病程录时间也显式传入，
 * 因此输出不依赖运行当天的日期、时区或用户设置。
 * 比较是完全逐字比较，不做换行或空白归一化。
 *
 * 重新生成：
 *   UPDATE_GOLDEN=1 node --test tests/golden.test.cjs
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();
const CORE = globalThis.RECORD_CORE;
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === '1';
const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'legacy');
const GOLDEN_DIR = path.join(__dirname, 'golden');
const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(d => d.key);

const GOLDEN_CASES = [
  {
    name: 'v1-respiratory',
    fixture: 'v1-record.json',
    firstCourseDate: '2026-03-01 10:30'
  },
  {
    name: 'v2-digestive',
    fixture: 'v2-record.json',
    firstCourseDate: '2026-04-02 10:30'
  },
  {
    name: 'v3-obstetrics',
    fixture: 'v3-record.json',
    firstCourseDate: '2026-05-03 11:00'
  }
];

const DOCUMENTS = [
  {
    file: 'dabingli.txt',
    generate: (record, testCase) => GENERATOR.generate(record).text,
    heading: '【入院记录】'
  },
  {
    file: 'first-course.txt',
    generate: (record, testCase) =>
      GENERATOR.buildFirstCourseRecord(record, { date: testCase.firstCourseDate }),
    heading: '【首次病程录】'
  },
  {
    file: 'discharge.txt',
    generate: record => GENERATOR.buildDischargeRecord(record),
    heading: '【出院记录】'
  }
];

function loadRecord(fixture) {
  const raw = fs.readFileSync(path.join(FIXTURE_DIR, fixture), 'utf8');
  const parsed = CORE.parseImport(raw, SCHEMA.emptyRecord, DEPT_KEYS);
  return parsed.records[0].data;
}

test('三种文书在 v1/v2/v3 代表病历上的输出与黄金样本逐字一致', async t => {
  for (const testCase of GOLDEN_CASES) {
    const record = loadRecord(testCase.fixture);
    await t.test(testCase.name, async t2 => {
      for (const document of DOCUMENTS) {
        await t2.test(document.file, () => {
          const actual = document.generate(record, testCase);
          assert.ok(actual.startsWith(document.heading),
            `${testCase.name}/${document.file} 开头不是 ${document.heading}`);
          assert.ok(actual.endsWith('\n'), '生成文本应保留末尾换行');

          const goldenPath = path.join(GOLDEN_DIR, testCase.name, document.file);
          if (UPDATE_GOLDEN) {
            fs.mkdirSync(path.dirname(goldenPath), { recursive: true });
            fs.writeFileSync(goldenPath, actual, 'utf8');
          }

          const expected = fs.readFileSync(goldenPath, 'utf8');
          assert.equal(
            actual,
            expected,
            `黄金样本不一致：${path.relative(process.cwd(), goldenPath)}\n` +
              '如差异已评审，运行 UPDATE_GOLDEN=1 node --test tests/golden.test.cjs 更新。'
          );
        });
      }
    });
  }
});
