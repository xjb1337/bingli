/* 本轮改造的回归用例：跨文书一致性、来源与核对、去重、迁移、存储冲突。
 * 全部使用合成病例，不含真实患者信息。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { AGE, SCHEMA, CORE, TEMPLATES, GENERATOR } = bootGlobals();

function baseRecord() {
  const r = SCHEMA.emptyRecord();
  r.id = 'test-record-1';
  Object.assign(r.basic, {
    name: '测试患者',
    gender: '男',
    age: '45',
    admitDate: '2026-10-01',
    recordDate: '2026-10-01',
    chiefComplaint: '咳嗽',
    chiefComplaintDuration: '3',
    chiefComplaintDurationUnit: '天'
  });
  r.hpi.symptoms = '咳嗽3天';
  r.diagnosis.confirmed = ['急性支气管炎'];
  return r;
}

/* ---------------- 摘要：过期与人工修改 ---------------- */

test('A01 生成摘要后修改现病史，摘要标记为需更新', () => {
  const r = baseRecord();
  r.summary = GENERATOR.draftSummary(r);
  CORE.markDocumentGenerated(r, 'summary');
  assert.equal(CORE.documentState(r, 'summary').state, 'fresh');

  r.hpi.symptoms = '咳嗽5天，伴发热';
  const st = CORE.documentState(r, 'summary');
  assert.equal(st.state, 'stale');
  assert.ok(st.changed.includes('现病史'), '变化组应包含现病史');
});

test('A01 生成摘要后修改主诉，摘要也标记为需更新', () => {
  const r = baseRecord();
  r.summary = GENERATOR.draftSummary(r);
  CORE.markDocumentGenerated(r, 'summary');
  r.basic.chiefComplaint = '发热';
  assert.equal(CORE.documentState(r, 'summary').state, 'stale');
});

test('A02 手改摘要后资料再变：保留原文，状态为人工修改且已变化', () => {
  const r = baseRecord();
  r.summary = '患者因咳嗽来院，一般情况可。';
  CORE.markDocumentManual(r, 'summary');
  assert.equal(CORE.documentState(r, 'summary').state, 'manual');

  r.hpi.symptoms = '咳嗽5天';
  assert.equal(CORE.documentState(r, 'summary').state, 'manual-stale');
  assert.match(GENERATOR.buildSummary(r), /一般情况可/);
});

test('A02 摘要核对后资料变化，核对状态失效', () => {
  const r = baseRecord();
  r.summary = GENERATOR.draftSummary(r);
  CORE.markDocumentGenerated(r, 'summary');
  CORE.markDocumentReviewed(r, 'summary');
  assert.equal(CORE.documentState(r, 'summary').state, 'reviewed');

  r.hpi.symptoms = '咳嗽5天';
  assert.equal(CORE.documentState(r, 'summary').state, 'reviewed-stale');
});

/* ---------------- SOAP 分段 ---------------- */

test('A03 SOAP 某段过期不影响其他段', () => {
  const r = baseRecord();
  r.soap.s.summary = '患者因咳嗽3天来院。';
  r.soap.o.pe = '双肺呼吸音清。';
  CORE.markDocumentGenerated(r, 'firstCourse', 's');
  CORE.markDocumentGenerated(r, 'firstCourse', 'oPe');

  r.pe.vitals.temperature = '38.5';
  assert.equal(CORE.documentState(r, 'firstCourse', 'oPe').state, 'stale');
  assert.equal(CORE.documentState(r, 'firstCourse', 's').state, 'fresh');
});

test('A03 修改检查结果，辅助检查段过期而 S 段不动', () => {
  const r = baseRecord();
  r.soap.s.summary = '患者因咳嗽3天来院。';
  r.soap.o.aux = '血常规：白细胞 10×10^9/L。';
  CORE.markDocumentGenerated(r, 'firstCourse', 's');
  CORE.markDocumentGenerated(r, 'firstCourse', 'oAux');

  r.auxiliary.items = [{ name: '血常规', result: '白细胞 12×10^9/L', date: '', hospital: '', no: '' }];
  assert.equal(CORE.documentState(r, 'firstCourse', 'oAux').state, 'stale');
  assert.equal(CORE.documentState(r, 'firstCourse', 's').state, 'fresh');
});

/* ---------------- 出院诊断 ---------------- */

test('A05 只填初步诊断时，出院诊断保持待填，不静默沿用', () => {
  const r = baseRecord();
  r.diagnosis.confirmed = ['肺炎？'];
  const text = GENERATOR.buildDischargeRecord(r);
  const tail = text.split('五、出院诊断')[1] || '';
  assert.match(tail, /出院诊断未填写/);
  assert.doesNotMatch(tail.split('（待补充：药物')[0], /肺炎？/);
  assert.equal(r.discharge.diagnosesConfirmed, false);
});

test('A05 明确带入并确认的出院诊断照常输出，保留「？」', () => {
  const r = baseRecord();
  r.diagnosis.confirmed = ['肺炎？'];
  r.discharge.diagnoses = r.diagnosis.confirmed.slice();
  r.discharge.diagnosesConfirmed = true;
  const text = GENERATOR.buildDischargeRecord(r);
  assert.match(text.split('五、出院诊断')[1], /肺炎？/);
});

/* ---------------- 年龄 ---------------- */

test('A11 年龄显示不再出现「14日龄岁」，月龄也按中文单位显示', () => {
  assert.equal(AGE.display({ age: '14日龄' }), '14日龄');
  assert.equal(AGE.display({ age: '7月' }), '7月龄');
  assert.equal(AGE.display({ age: '45' }), '45岁');
  assert.equal(AGE.display({ birthDate: '2026-10-16', admitDate: '2026-10-30' }), '14日龄');
  const text = GENERATOR.generate((() => {
    const r = baseRecord();
    r.basic.age = '14日龄';
    return r;
  })()).text;
  assert.doesNotMatch(text, /日龄岁/);
});

test('A11 出生日期与年龄明显不一致时给出结构化提醒', () => {
  const r = baseRecord();
  r.basic.birthDate = '1950-01-01';
  r.basic.age = '20';
  r.basic.admitDate = '2026-10-01';
  const list = GENERATOR.validateStructured(r);
  const hit = list.find(x => x.code === 'AGE_BIRTHDATE_MISMATCH');
  assert.ok(hit, '应给出 AGE_BIRTHDATE_MISMATCH');
  assert.ok(hit.paths.includes('basic.age'));
});

/* ---------------- 病史去重 ---------------- */

test('A08 同一句话填进两个病史字段，生成时只输出一次', () => {
  const r = baseRecord();
  r.hpi.symptoms = '咳嗽3天';
  r.hpi.negativeDiscriminating = '咳嗽3天';
  const { sections } = GENERATOR.generate(r);
  const n = (sections['现病史'].match(/咳嗽3天/g) || []).length;
  assert.equal(n, 1);
});

test('A08 同一字段内重复保留，只提示不删', () => {
  const r = baseRecord();
  r.hpi.symptoms = '咳嗽3天。咳嗽3天。';
  const { sections } = GENERATOR.generate(r);
  const n = (sections['现病史'].match(/咳嗽3天/g) || []).length;
  assert.equal(n, 2);
  assert.ok(GENERATOR.validate(r).some(x => /在同一栏里重复/.test(x)));
});

test('A09 肯定与否定同时存在时两个事实都保留', () => {
  const r = baseRecord();
  r.hpi.symptoms = '无胸痛';
  r.hpi.negativeDiscriminating = '胸痛';
  const { sections } = GENERATOR.generate(r);
  assert.match(sections['现病史'], /无胸痛/);
  assert.match(sections['现病史'], /胸痛/);
});

test('A09 左右侧与时间进展不被当成重复', () => {
  const r = baseRecord();
  r.hpi.symptoms = '左下肢无力';
  r.hpi.evolution = '右下肢无力';
  const { sections } = GENERATOR.generate(r);
  assert.match(sections['现病史'], /左下肢无力/);
  assert.match(sections['现病史'], /右下肢无力/);
});

test('生成器是纯函数：去重不改传入的病历', () => {
  const r = baseRecord();
  r.hpi.symptoms = '咳嗽3天';
  r.hpi.negativeDiscriminating = '咳嗽3天';
  const before = JSON.stringify(r);
  GENERATOR.generate(r);
  assert.equal(JSON.stringify(r), before);
});

/* ---------------- 模板用途分离 ---------------- */

test('A06 患者录入模式不写入任何模板事实', () => {
  const tpl = TEMPLATES.all().find(t => t.dept !== 'general');
  assert.ok(tpl, '应有可用的专科模板');
  const r = SCHEMA.emptyRecord();
  const before = JSON.stringify(r);
  const res = TEMPLATES.apply(r, tpl.key, { mode: 'patient' });
  assert.equal(res.ok, true);
  assert.equal(res.count, 0);
  assert.ok(res.outline.length > 0, '应返回问诊提纲');
  assert.equal(JSON.stringify(r), before, '患者模式不得修改病历');
});

test('A06 教学范例模式逐字段记录模板来源且默认未核对', () => {
  const tpl = TEMPLATES.all().find(t => t.dept !== 'general');
  const r = SCHEMA.emptyRecord();
  const res = TEMPLATES.apply(r, tpl.key, { mode: 'example' });
  assert.equal(res.ok, true);
  assert.ok(res.count > 0);
  const first = res.filled.find(p => typeof CORE.getPath(r, p) === 'string');
  assert.ok(first, '应有写入的文本字段');
  const st = CORE.fieldState(r, first);
  assert.equal(st.source, 'template');
  assert.equal(st.reviewed, false);
  assert.equal(st.sourceRef, tpl.key);
  assert.ok(r.meta.lastTemplateFill);
});

/* ---------------- 字段核对与失效 ---------------- */

test('A07 核对状态与实际内容绑定，内容一改即失效', () => {
  const r = baseRecord();
  const path = 'pmh.allergy';
  r.pmh.allergy = '无药物过敏史';
  CORE.setFieldState(r, path, {
    source: 'template',
    reviewed: true,
    reviewedValueHash: CORE.fingerprint('无药物过敏史')
  });
  assert.equal(CORE.fieldReviewValid(r, path), true);

  r.pmh.allergy = '青霉素过敏';
  CORE.markFieldManual(r, path);
  assert.equal(CORE.fieldReviewValid(r, path), false);
});

/* ---------------- 迁移 ---------------- */

test('A16 v2 旧存档：婚姻两处一致时合并到基本情况', () => {
  const old = baseRecord();
  old.schemaVersion = 2;
  old.basic.marital = '已婚';
  old.marriage.status = '已婚';
  const r = CORE.normalizeRecord(old, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
  assert.equal(r.schemaVersion, 3);
  assert.equal(r.basic.marital, '已婚');
  assert.equal(r.marriage.status, '');
  assert.equal(r.meta.migratedFrom, 2);
});

test('A16 v2 旧存档：婚姻两处冲突时保留两个原值', () => {
  const old = baseRecord();
  old.schemaVersion = 2;
  old.basic.marital = '已婚';
  old.marriage.status = '离异';
  const r = CORE.normalizeRecord(old, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
  const c = CORE.marriageConflict(r);
  assert.ok(c);
  assert.equal(c.basicValue, '已婚');
  assert.equal(c.marriageValue, '离异');
  assert.equal(c.resolved, false);
});

test('A16 未来版本存档明确拒绝，不清空现有数据', () => {
  const future = baseRecord();
  future.schemaVersion = 99;
  assert.throws(
    () => CORE.normalizeRecord(future, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key)),
    /更新版本/
  );
});

test('A16 旧存档的手写文字保留，来源标为 legacy', () => {
  const old = baseRecord();
  old.schemaVersion = 2;
  old.summary = '旧存档里手写的摘要。';
  old.soap.s.summary = '旧存档里手写的 S 段。';
  const r = CORE.normalizeRecord(old, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
  assert.equal(r.summary, '旧存档里手写的摘要。');
  assert.equal(r.soap.s.summary, '旧存档里手写的 S 段。');
  assert.equal(r.documentMeta.summary.origin, 'legacy');
  assert.equal(r.documentMeta.firstCourse.s.origin, 'legacy');
});

/* ---------------- 存储异常与冲突 ---------------- */

test('A13 localStorage 读取抛错时返回可导出的损坏原文，不抛异常', () => {
  const bad = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  const list = CORE.loadList(bad);
  assert.equal(list.ok, false);
  assert.equal(list.error, true);
  assert.match(list.reason, /无法读取浏览器存储/);
  const cur = CORE.loadCurrent(bad, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
  assert.equal(cur.ok, false);
  assert.equal(cur.error, true);
  assert.match(cur.reason, /无法读取浏览器存储/);
});

test('A13 JSON 损坏时保留原文供导出，不抛异常', () => {
  const broken = CORE.memoryStorage([['dabingli.current.v1', '{不是 JSON']]);
  const cur = CORE.loadCurrent(broken, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key));
  assert.equal(cur.ok, false);
  assert.equal(cur.corrupt, true);
  assert.equal(cur.raw, '{不是 JSON');
  const list = CORE.loadList(CORE.memoryStorage([['dabingli.records.v1', '[1,']]));
  assert.equal(list.ok, false);
  assert.equal(list.corrupt, true);
  assert.equal(list.raw, '[1,');
});

test('A13 写入失败时返回错误，不假装保存成功', () => {
  const bad = {
    getItem() { return null; },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() {}
  };
  const res = CORE.saveCurrent(bad, baseRecord(), 0);
  assert.equal(res.ok, false);
  assert.match(res.reason, /保存失败/);
});

test('A14 修订号不一致时拒绝覆盖，返回 conflict', () => {
  const storage = CORE.memoryStorage();
  const first = baseRecord();
  const saved = CORE.saveCurrent(storage, first, 0);
  assert.equal(saved.ok, true);
  assert.equal(saved.revision, 1);

  const stale = CORE.cloneValue(saved.record);
  const conflict = CORE.saveCurrent(storage, stale, 0);
  assert.equal(conflict.ok, false);
  assert.equal(conflict.conflict, true);
  assert.equal(conflict.remoteRevision, 1);
});

test('A15 导出可包含当前最新草稿', () => {
  const r = baseRecord();
  r.summary = '最新草稿内容。';
  const out = CORE.buildExport([], '2026-10-30T00:00:00.000Z', { includeDraft: true, draft: r });
  assert.equal(out.includesDraft, true);
  assert.equal(out.records.length, 1);
  assert.equal(out.records[0].data.summary, '最新草稿内容。');
});

/* ---------------- 撤销 ---------------- */

test('更新后可撤销：快照栈按病历绑定并限制数量', () => {
  const h = CORE.createHistory(2);
  const r = baseRecord();
  r.summary = '第一版';
  assert.equal(h.push(r, '生成摘要'), true);
  r.summary = '第二版';
  assert.equal(h.push(r, '更新摘要'), true);
  r.summary = '第三版';
  assert.equal(h.push(r, '再更新'), true);

  const popped = h.pop(r.id);
  assert.equal(popped.snapshot.summary, '第三版');
  assert.equal(h.size(r.id), 1);
});

/* ---------------- 诊断与依据的关联 ---------------- */

test('A04 删除诊断后，诊断依据段提示原始资料已变化', () => {
  const r = baseRecord();
  r.diagnosis.confirmed = ['急性支气管炎', '高血压病'];
  r.soap.a.basis = '依据咳嗽、双肺呼吸音粗及胸片，考虑急性支气管炎。';
  CORE.markDocumentGenerated(r, 'firstCourse', 'basis');
  assert.equal(CORE.documentState(r, 'firstCourse', 'basis').state, 'fresh');

  r.diagnosis.confirmed = ['急性支气管炎'];
  const st = CORE.documentState(r, 'firstCourse', 'basis');
  assert.equal(st.state, 'stale');
  assert.ok(st.changed.includes('诊断'), '变化组应包含诊断');
});

test('A04 删除诊断后结构化提醒可定位到诊断依据', () => {
  const r = baseRecord();
  r.diagnosis.confirmed = ['急性支气管炎', '高血压病'];
  r.soap.a.basis = '依据咳嗽及血压升高，考虑上述诊断。';
  CORE.markDocumentGenerated(r, 'firstCourse', 'basis');
  r.diagnosis.confirmed = ['急性支气管炎'];
  const list = GENERATOR.validateStructured(r);
  const hit = list.find(w => w.paths && w.paths.indexOf('soap.a.basis') >= 0);
  assert.ok(hit, '应有指向诊断依据的提醒');
  assert.equal(hit.severity, 'warning');
});

test('A12 首次病程记录时间随病历保存，不跨病历沿用', () => {
  const a = baseRecord();
  a.soap.recordTime = '2026-10-18 09:30';
  assert.match(GENERATOR.buildFirstCourseRecord(a), /2026-10-18 09:30/);

  const b = baseRecord();
  b.basic.name = '另一患者';
  const text = GENERATOR.buildFirstCourseRecord(b);
  assert.doesNotMatch(text, /2026-10-18 09:30/);
  assert.equal(b.soap.recordTime, '', '生成过程不写病历');
});
