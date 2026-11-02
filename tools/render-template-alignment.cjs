'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { bootGlobals } = require('../tests/bootstrap.cjs');

const outDir = process.argv[2];
if (!outDir) {
  console.error('用法：node tools/render-template-alignment.cjs <outdir>');
  process.exit(1);
}

const { SCHEMA, CORE, GENERATOR } = bootGlobals();
const fixturePath = path.join(
  __dirname,
  '..',
  'tests',
  'fixtures',
  'template-alignment',
  'wzrm-neuro-fictional.json'
);
const deptKeys = SCHEMA.DEPARTMENTS.map(department => department.key);
const parsed = CORE.parseImport(
  fs.readFileSync(fixturePath, 'utf8'),
  SCHEMA.emptyRecord,
  deptKeys
);
const record = parsed.records[0].data;

const documents = {
  'dabingli.txt': GENERATOR.generate(record).text,
  'first-course.txt': GENERATOR.buildFirstCourseRecord(record, { date: '2026-10-20 10:30' }),
  'discharge.txt': GENERATOR.buildDischargeRecord(record)
};

fs.mkdirSync(outDir, { recursive: true });
for (const [filename, text] of Object.entries(documents)) {
  fs.writeFileSync(path.join(outDir, filename), text, 'utf8');
  console.log(`已生成：${path.join(outDir, filename)}`);
}
