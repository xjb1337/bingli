const {test} = require('node:test');
const assert = require('node:assert/strict');
const {SCHEMA, CORE} = require('./bootstrap.cjs').bootGlobals();
const AI = require('../src/ai-core.js');
const record = () => { const r = SCHEMA.emptyRecord(); r.id = 'case_a'; return r; };
const request = (r, text = '患者诉咳嗽3天，药名不详，发热未问') => AI.prepare('organize', r, text);
const response = (text = '患者诉咳嗽3天。', quote = '患者诉咳嗽3天', path = 'hpi.symptoms') => ({suggestions: [{path, text, evidence: [{source: 'note', quote}]}], issues: [], questions: []});

test('AI：已知身份及常见电话身份证不进入发送内容，病例标识仅保留本地', () => {
  const r = record(); Object.assign(r.basic, {name: '张三', phone: '13812345678', address: '测试路99号', recordNo: 'ABC12345'});
  const q = request(r, '张三住测试路99号，病历号ABC12345，电话13812345678，证件110101199001010011，咳嗽3天');
  for (const privateText of ['张三', '测试路99号', 'ABC12345', '13812345678', '110101199001010011', r.id]) assert.ok(!q.user.includes(privateText));
  assert.equal(q.caseId, r.id);
});
test('AI：空白笔记与空白病历拒绝请求，不用默认正常资料凑数', () => {
  assert.throws(() => request(record(), ''), /先输入/);
  assert.throws(() => AI.prepare('summary', record()), /尚无/);
});
test('AI：未核对模板、默认值、旧 AI 字段排除，人工确认后才可使用', () => {
  const r = record(); r.hpi.symptoms = '咳嗽3天';
  for (const source of ['template', 'default', 'example', 'ai']) {
    CORE.setFieldState(r, 'hpi.symptoms', {source, reviewed: false});
    assert.throws(() => AI.prepare('summary', r), /尚无/);
    CORE.markFieldReviewed(r, 'hpi.symptoms', source);
    assert.match(AI.prepare('summary', r).user, /咳嗽3天/);
  }
});
test('AI：实际查体值与检查结果发送，空白默认查体和机构身份不发送', () => {
  const r = record(); r.pe.chest = {breath: '右肺湿啰音', normal: ''}; r.pe.checked.chest = {breath: true, normal: true};
  r.auxiliary.items = [{name: '血常规', result: '白细胞升高', hospital: '不应发送医院', no: '不应发送检查号'}];
  const q = AI.prepare('check', r);
  assert.match(q.user, /右肺湿啰音/); assert.match(q.user, /白细胞升高/);
  assert.doesNotMatch(q.user, /不应发送|未见异常/);
});
test('AI：润色只提供选中段落，检查功能没有可写入字段', () => {
  const r = record(); r.hpi.symptoms = '咳嗽3天'; r.pmh.surgery = '5年前手术';
  const q = AI.prepare('polish', r, '', 'hpi.symptoms');
  assert.deepEqual(q.allowed, ['hpi.symptoms']); assert.doesNotMatch(q.user, /5年前/);
  assert.deepEqual(AI.prepare('check', r).allowed, []);
});
test('AI：有效引用可解析，越界、重复字段与伪造引用整单拒绝', () => {
  const q = request(record()); assert.equal(AI.validate(response(), q).suggestions.length, 1);
  assert.throws(() => AI.validate(response('张三', '患者诉咳嗽3天', 'basic.name'), q), /越界/);
  const duplicate = response(); duplicate.suggestions.push(duplicate.suggestions[0]);
  assert.throws(() => AI.validate(duplicate, q), /重复/);
  assert.throws(() => AI.validate(response('无发热', '无发热'), q), /无法核实/);
  assert.throws(() => AI.validate(response('正常', ''), q), /无法核实/);
});
test('AI：阻止新增数字、偷换时间单位、丢失不详来源与否定限定', () => {
  const q = request(record(), '患者诉咳嗽3天，药名不详，否认胸痛');
  assert.throws(() => AI.validate(response('咳嗽5天', '咳嗽3天'), q), /数字/);
  assert.throws(() => AI.validate(response('咳嗽3年', '咳嗽3天'), q), /单位/);
  assert.throws(() => AI.validate(response('用药治疗', '药名不详'), q), /限定/);
  assert.throws(() => AI.validate(response('咳嗽3天', '患者诉咳嗽3天'), q), /限定/);
  assert.throws(() => AI.validate(response('胸痛', '否认胸痛'), q), /否定/);
});
test('AI：空白、截断和结构异常拒绝，不静默修补 JSON', () => {
  const q = request(record());
  for (const raw of ['', '   ', '{"suggestions":[', '{}', 'null']) assert.throws(() => AI.validate(raw, q));
});
test('AI：采纳只改选中项，先前内容默认不覆盖，原记录不原地修改', () => {
  const r = record(); r.hpi.symptoms = '原始症状'; const q = request(r); const result = AI.validate(response(), q);
  assert.throws(() => AI.apply(r, q, result, [0], false, 'deepseek-flash'), /已有/);
  const next = AI.apply(r, q, result, [0], true, 'deepseek-flash');
  assert.equal(r.hpi.symptoms, '原始症状'); assert.equal(next.hpi.symptoms, '患者诉咳嗽3天。');
  assert.equal(CORE.fieldState(next, 'hpi.symptoms').source, 'ai'); assert.equal(CORE.fieldReviewValid(next, 'hpi.symptoms'), false);
  assert.match(CORE.fieldState(next, 'hpi.symptoms').sourceRef, /患者诉咳嗽3天/);
});
test('AI：修改病历、切换患者后旧结果禁止采纳；自动保存修订不影响内容基线', () => {
  const r = record(); const q = request(r); const result = AI.validate(response(), q);
  r.meta.revision++; assert.doesNotThrow(() => AI.apply(r, q, result, [0], false, 'deepseek-flash'));
  r.hpi.onset = '刚补充的内容'; assert.throws(() => AI.apply(r, q, result, [0], false, ''), /已过期/);
  r.hpi.onset = ''; r.id = 'case_b'; assert.throws(() => AI.apply(r, q, result, [0], false, ''), /已过期/);
});
test('AI：采纳入口再次验证，DOM 篡改与空选择不能越界写入', () => {
  const r = record(), q = request(r);
  assert.throws(() => AI.apply(r, q, response(), [], true, ''), /勾选/);
  assert.throws(() => AI.apply(r, q, response(), [9], true, ''), /无效/);
  assert.throws(() => AI.apply(r, q, response('正常', '患者诉咳嗽3天', '__proto__.polluted'), [0], true, ''), /越界/);
  assert.equal({}.polluted, undefined);
});
test('AI：摘要采纳后仍待核对，源资料变化触发原文书过期机制', () => {
  const r = record(); r.hpi.symptoms = '咳嗽3天';
  const q = AI.prepare('summary', r);
  const result = AI.validate({suggestions: [{path: 'summary', text: '咳嗽3天。', evidence: [{source: 'hpi.symptoms', quote: '咳嗽3天'}]}], issues: [], questions: []}, q);
  const next = AI.apply(r, q, result, [0], false, 'deepseek-flash');
  assert.equal(CORE.documentState(next, 'summary').state, 'fresh');
  next.hpi.symptoms = '咳嗽5天'; assert.equal(CORE.documentState(next, 'summary').state, 'stale');
});
test('AI：来源信息经备份及 v3 规范化后仍保留，密钥不在病历结构中', () => {
  const r = record(), q = request(r); const next = AI.apply(r, q, response(), [0], false, 'deepseek-flash');
  const normalized = CORE.normalizeRecord(JSON.parse(JSON.stringify(next)), SCHEMA.emptyRecord, []);
  assert.equal(CORE.fieldState(normalized, 'hpi.symptoms').source, 'ai');
  assert.equal(CORE.fieldReviewValid(normalized, 'hpi.symptoms'), false);
  assert.doesNotMatch(JSON.stringify(normalized), /apiKey|ciphertext/);
});
