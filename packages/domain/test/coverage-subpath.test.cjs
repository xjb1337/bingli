const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const AGE = require('../dist/age.js');
const DIAGNOSTICS = require('../dist/quality/diagnostics.js');
const DOCUMENT_IR = require('../dist/generator/document-ir.js');
const TEMPLATES = require('../dist/templates.js');
const SCHEMA = require('../dist/schema.js');

test('ESM subpath @dabingli/domain/templates 按需加载且剔除空字符串字段', async () => {
  const mod = await import('@dabingli/domain/templates');
  assert.equal(mod.TEMPLATE_DATA.length, 57);
  assert.equal(mod.TEMPLATES.all().length, 57);
  assert.equal(typeof mod.DOCUMENT_TEMPLATES, 'object');
  assert.equal('GENERATOR' in mod, false);
  assert.equal('HINTS' in mod, false);

  const esmDataSrc = fs.readFileSync(
    path.join(__dirname, '..', 'dist', 'esm', 'template-data.js'),
    'utf8'
  );
  // 校验 ESM 瘦身版模板数据不存在 "":"" 空字符串属性
  assert.equal(/:""[,}]/.test(esmDataSrc), false);

  const r = SCHEMA.emptyRecord();
  const res = mod.apply(r, 'ptx');
  assert.equal(res.ok, true);
  assert.ok(res.count > 0);
});

test('自动生成 dist/index.d.ts 类型签名真实准确（无签名谎言）', () => {
  const indexDts = fs.readFileSync(path.join(__dirname, '..', 'dist', 'index.d.ts'), 'utf8');
  const secBasicDts = fs.readFileSync(path.join(__dirname, '..', 'dist', 'generator', 'sections-basic-history.d.ts'), 'utf8');
  const docIrDts = fs.readFileSync(path.join(__dirname, '..', 'dist', 'generator', 'document-ir.d.ts'), 'utf8');
  const schemaDts = fs.readFileSync(path.join(__dirname, '..', 'dist', 'schema.d.ts'), 'utf8');

  assert.match(indexDts, /export \{.*MIGRATIONS/);
  assert.match(secBasicDts, /draftHPI\(r: DabingliRecord\): HpiSection/);
  assert.doesNotMatch(docIrDts, /section\([^)]*\): void/);
  assert.match(schemaDts, /PE_INDEX/);
});

test('age.ts 边界覆盖：parseDate / ageFromDates / toDays / formatAge', () => {
  assert.equal(AGE.parseDate('2026-02-29'), null);
  assert.equal(AGE.parseDate('2024/02/29').text, '2024-02-29');
  assert.equal(AGE.parseDate('2024年3月5日').text, '2024-03-05');
  assert.equal(AGE.parseDate('20240305').text, '2024-03-05');

  const c1 = AGE.ageFromDates('2026-01-01', '2026-01-15');
  assert.equal(c1.days, 14);
  assert.equal(c1.text, '14日龄');
  const c2 = AGE.ageFromDates('2025-01-01', '2026-01-01');
  assert.equal(c2.years, 1);
  assert.equal(AGE.cnToNumber('二十三'), 23);
  assert.equal(AGE.formatAge({ years: 0, months: 0, days: 5 }), '5日龄');
  assert.equal(AGE.formatAge({ years: 0, months: 4 }), '4月龄');
});

test('quality/diagnostics.ts 完整分支覆盖', () => {
  assert.deepEqual(DIAGNOSTICS.SEVERITIES, ['error', 'warning', 'info']);
  assert.throws(() => DIAGNOSTICS.create({}), /code/);
  assert.throws(
    () => DIAGNOSTICS.create({ code: 'X', severity: 'bad-level', message: 'msg' }),
    /severity/
  );
  const d = DIAGNOSTICS.create({
    code: 'NAME_MISSING',
    severity: 'warning',
    path: 'basic.name',
    message: '【一般项目】缺少姓名。',
    evidence: [{ path: 'basic.name', text: '' }]
  });
  assert.equal(d.severity, 'warning');
  assert.deepEqual(d.paths, ['basic.name']);
  assert.equal(DIAGNOSTICS.isDiagnostic(d), true);
  assert.equal(DIAGNOSTICS.isDiagnostic(null), false);
  assert.deepEqual(DIAGNOSTICS.assertValid([d]), [d]);
  assert.throws(() => DIAGNOSTICS.assertValid([{ code: 'X' }]), /结构不完整/);

  const w = DIAGNOSTICS.fromWarning('【主诉】未填写。', { code: 'CHIEF_COMPLAINT_MISSING', path: 'basic.chiefComplaint' });
  assert.equal(w.code, 'CHIEF_COMPLAINT_MISSING');
  assert.deepEqual(DIAGNOSTICS.codes([d, w]), ['NAME_MISSING', 'CHIEF_COMPLAINT_MISSING']);
});

test('generator/document-ir.ts 完整渲染与解析覆盖', () => {
  const f = DOCUMENT_IR.createFact({ path: 'hpi.symptoms', text: '发热3天', polarity: 'positive' });
  assert.equal(f.polarity, 'positive');
  assert.equal(DOCUMENT_IR.createFact({ path: 'hpi.symptoms', text: '' }), null);

  const s1 = DOCUMENT_IR.section('主诉', ['咳嗽3天', ''], [f], ['【主诉】示例提醒']);
  assert.equal(s1.paragraphs.length, 1);

  const irRec = DOCUMENT_IR.documentFromSections('record', '入院记录', [s1], ['顶层提醒'], '【入院记录】');
  assert.match(DOCUMENT_IR.renderDocument(irRec), /【入院记录】[\s\S]*【主诉】/);
  const parsedRec = DOCUMENT_IR.fromRecordText('record', '入院记录', irRec.text, [], ['主诉']);
  assert.equal(parsedRec.sections.some((s) => s.title === '主诉'), true);

  const irNum = DOCUMENT_IR.fromNumberedText('firstCourse', '首次病程录', '【首次病程录】\n一、病历特点（S）\n发热3天。', [], {
    '一、病历特点（S）': [f]
  });
  assert.match(DOCUMENT_IR.renderNumbered(irNum), /一、病历特点（S）/);
  assert.match(DOCUMENT_IR.renderDocument(irNum), /一、病历特点（S）/);

  const irPlain = DOCUMENT_IR.fromPlainText('record', '入院记录', '主诉：\n咳嗽3天。');
  assert.match(DOCUMENT_IR.renderPlain(irPlain), /主诉：\n咳嗽3天。/);
  assert.equal(DOCUMENT_IR.renderDocument(null), '');

  assert.equal(DOCUMENT_IR.isBareTimeFragment('约3天'), true);
  assert.equal(DOCUMENT_IR.isBareTimeFragment('发热3天'), false);
  assert.equal(DOCUMENT_IR.normalizeNegationScope('无发热、咳嗽加重'), '无发热；咳嗽加重');
  const merged = DOCUMENT_IR.assembleClinicalNarrative(['发热3天', '发热3天', '伴咳嗽']);
  assert.deepEqual(merged, ['发热3天，伴咳嗽']);
});

test('templates.ts 查表与预览辅助覆盖', () => {
  assert.ok(TEMPLATES.listByDept('respiratory').length === 6);
  assert.ok(TEMPLATES.all().length === 57);
  assert.equal(TEMPLATES.get('nonexistent'), null);
  assert.equal(TEMPLATES.deptName('cardiology'), '心血管内科');
  assert.ok(TEMPLATES.outlineOf('ptx').length > 0);
  assert.ok(TEMPLATES.previewPaths('ptx').length > 0);
  const r = SCHEMA.emptyRecord();
  TEMPLATES.apply(r, 'stroke');
  const unfilled = TEMPLATES.unfilledPlaceholders(r);
  assert.ok(Array.isArray(unfilled));
});
