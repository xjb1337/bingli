'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');
const { SCHEMA, CORE, GENERATOR } = bootGlobals();
const fixture = require('./fixtures/template-alignment/hospital-fictional-2040.json');
const legacy = require('./fixtures/template-alignment/legacy-v2-merged.json');
const normalize = value => CORE.normalizeRecord(value, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(item => item.key));
const titles = ['一般项目', '主诉', '现病史', '既往史', '个人史', '婚育史', '家族史', '体格检查（一）', '体格检查（二）：补充及专科情况', '实验室检查', '特殊检查', '初步诊断'];

test('医院完善入院记录：虚构 fixture 的预览、IR、TXT 章节与基本信息逐行对齐', () => {
  const record = normalize(fixture);
  const result = GENERATOR.generate(record);
  assert.deepEqual([...result.text.matchAll(/^【([^】]+)】$/gm)].map(match => match[1]), ['入院记录', ...titles]);
  assert.equal(GENERATOR.buildDocumentIR(record).text, result.text);
  assert.deepEqual(result.sections['一般项目'].split('\n').map(line => line.split('：')[0]), ['姓名', '性别', '年龄', '科别', '床号', '住院号', '民族', '出生地', '婚姻', '职业', '入院日期', '记录日期', '病史陈述者', '病史可靠程度']);
  const plain = GENERATOR.generatePlain(record);
  assert.ok(plain.startsWith('入院记录\n'));
  let previous = -1;
  titles.forEach(title => { const position = plain.indexOf(title + '：'); assert.ok(position > previous, title); previous = position; });
  assert.match(result.sections['现病史'], /\n　　起病来，神志清/);
  assert.match(result.sections['现病史'], /\n　　伴发疾病：慢性胃炎/);
  assert.match(result.sections['初步诊断'], /1[.、．]\s*急性胰腺炎/);
});

test('医院查体：生命体征在首行，通用系统顺序固定，专科独立成节', () => {
  const sections = GENERATOR.generate(normalize(fixture)).sections;
  const pe = sections['体格检查（一）'];
  assert.match(pe, /^T 36.7℃/);
  const labels = ['一般状况', '皮肤黏膜', '头颅及其器官', '颈部', '胸部', '　肺', '　心', '腹部', '外生殖器', '直肠肛门', '脊柱及四肢', '神经系统'];
  assert.deepEqual(pe.split('\n').slice(1).map(line => line.split('：')[0]), labels);
  assert.match(sections['体格检查（二）：补充及专科情况'], /中上腹压痛/);
});

test('检查分类：旧条目自动分组、未知归实验室，显式选择优先，病理不丢失', () => {
  const record = normalize(legacy);
  record.auxiliary.items.push({ name: 'CT名但实际检验', result: '显式分类结果', category: 'lab' }, { name: '活检病理', result: '病理原文' });
  const { sections } = GENERATOR.generate(record);
  ['虚构旧检验结果', '必须保持可见的旧结果', '旧版纯文本辅助检查原文', '显式分类结果'].forEach(text => assert.ok(sections['实验室检查'].includes(text), text));
  ['虚构旧影像结果', '病理原文'].forEach(text => assert.ok(sections['特殊检查'].includes(text), text));
  assert.ok(!sections['特殊检查'].includes('显式分类结果'));
  const ir = GENERATOR.buildDocumentIR(record);
  const lab = ir.sections.find(section => section.title === '实验室检查');
  const special = ir.sections.find(section => section.title === '特殊检查');
  assert.ok(lab.facts.some(fact => fact.path === 'auxiliary.items.0.result'));
  assert.ok(!lab.facts.some(fact => fact.path === 'auxiliary.items.1.result'));
  assert.ok(special.facts.some(fact => fact.path === 'auxiliary.items.1.result'));
  assert.match(sections['实验室检查'], /F-L-9/);
});

test('检查分类：实验室镜检及英文检验名不因含镜或 CT 字母误归特殊检查', () => {
  const record = SCHEMA.emptyRecord();
  record.auxiliary.items = [
    { name: '尿沉渣镜检', result: '虚构镜检结果' },
    { name: 'ACTH', result: '虚构激素检验结果' },
    { name: '增强CT', result: '虚构影像结果' },
    { name: '电子胃镜', result: '虚构内镜结果' }
  ];
  const { sections } = GENERATOR.generate(record);
  ['虚构镜检结果', '虚构激素检验结果'].forEach(text => assert.ok(sections['实验室检查'].includes(text)));
  ['虚构影像结果', '虚构内镜结果'].forEach(text => assert.ok(sections['特殊检查'].includes(text)));
  assert.doesNotMatch(sections['特殊检查'], /虚构镜检结果|虚构激素检验结果/);
});

test('旧备份：合并病史可见、检查逐项保留、ROS 原值含布尔和扩展属性完整往返', () => {
  const record = normalize(legacy);
  assert.equal(record.schemaVersion, 3);
  assert.equal(record.pmh.diseaseDetail, legacy.pmh);
  assert.deepEqual(record.ros, legacy.ros);
  legacy.auxiliary.slice(0, 3).forEach((item, index) => assert.deepEqual(record.auxiliary.items[index], item));
  assert.match(GENERATOR.generate(record).sections['既往史'], /旧版合并既往史/);
  const backup = JSON.stringify(CORE.buildExport([{ id: record.id, data: record }]));
  const restored = CORE.parseImport(backup, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(item => item.key)).records[0].data;
  assert.deepEqual(restored.ros, legacy.ros);
  assert.deepEqual(restored.auxiliary, record.auxiliary);
  assert.equal(restored.pmh.diseaseDetail, legacy.pmh);
  assert.deepEqual(normalize(record), record);
});

test('系统回顾：有内容和冲突也不显示、不导出、不要求补问，生成不改原记录', () => {
  const record = normalize(legacy);
  record.ros.resp.cough = { status: 'not_asked', checked: true, detail: '禁止出现在入院记录的旧回顾' };
  const before = JSON.stringify(record);
  [GENERATOR.generate(record).text, GENERATOR.generatePlain(record), GENERATOR.buildDocumentIR(record).text, ...GENERATOR.validate(record)].forEach(text => assert.doesNotMatch(text, /系统回顾|禁止出现在入院记录的旧回顾/));
  assert.ok(!GENERATOR.validateStructured(record).some(item => item.path.startsWith('ros') || item.code.startsWith('ROS_')));
  assert.equal(JSON.stringify(record), before);
});

test('空白入院记录不会自动否认病史或生成正常体征', () => {
  const text = GENERATOR.generate(SCHEMA.emptyRecord()).text;
  assert.doesNotMatch(text, /否认手术史|否认肝炎|神志清|神经系统：.*正常/);
  assert.match(text, /一般状况：／/);
  assert.match(text, /【实验室检查】\n暂缺。\n\n【特殊检查】\n暂缺。/);
});
