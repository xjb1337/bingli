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
test('AI：按标签直接隐去姓名、病历号、住院号、床号等值', () => {
  const q = request(record(), '姓名：张三 住院号：12345 床号：8，咳嗽3天');
  for (const privateText of ['张三', '12345', '床号：8']) assert.ok(!q.user.includes(privateText));
  assert.match(q.user, /姓名：\[已隐去\]/);
  assert.match(q.user, /住院号：\[已隐去\]/);
  assert.match(q.user, /床号：\[已隐去\]/);
  assert.match(q.user, /咳嗽3天/);
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
  assert.match(AI.validate(response('张三', '患者诉咳嗽3天', 'basic.name'), q).dropped[0].reason, /越界/);
  const duplicate = response(); duplicate.suggestions.push(duplicate.suggestions[0]);
  assert.match(AI.validate(duplicate, q).dropped[0].reason, /重复/);
  assert.match(AI.validate(response('无发热', '无发热'), q).dropped[0].reason, /无法核实/);
  assert.match(AI.validate(response('正常', ''), q).dropped[0].reason, /无法核实/);
});
test('AI：阻止新增数字、偷换时间单位、丢失不详来源与否定限定', () => {
  const q = request(record(), '患者诉咳嗽3天，药名不详，否认胸痛');
  assert.match(AI.validate(response('咳嗽5天', '咳嗽3天'), q).dropped[0].reason, /数字/);
  assert.match(AI.validate(response('咳嗽3年', '咳嗽3天'), q).dropped[0].reason, /单位/);
  assert.match(AI.validate(response('用药治疗', '药名不详'), q).dropped[0].reason, /限定/);
  assert.match(AI.validate(response('咳嗽3天', '患者诉咳嗽3天'), q).dropped[0].reason, /限定/);
  assert.match(AI.validate(response('胸痛', '否认胸痛'), q).dropped[0].reason, /否定/);
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


test('AI：脱敏变化仅报告实际替换类别，不返回原始身份信息', () => {
  const r = record();
  Object.assign(r.basic, {name: '张三', phone: '13812345678', recordNo: 'MR12345'});
  const raw = '张三，电话13812345678，病历号MR12345，证件110101199001010011，咳嗽3天';
  const diff = AI.redactionDiff(raw, r);
  assert.deepEqual(new Set(diff.categories), new Set(['姓名', '电话', '病历号', '身份证']));
  assert.equal(diff.text, AI.redact(raw, r));
  assert.match(diff.text, /咳嗽3天/);
  for (const identifier of ['张三', '13812345678', 'MR12345', '110101199001010011']) assert.ok(!JSON.stringify(diff).includes(identifier));
  assert.deepEqual(AI.redactionDiff('姓名：张三 住院号：12345 床号：8，电话13912345678，咳嗽3天', record()), {
    text: '姓名：[已隐去] 住院号：[已隐去] 床号：[已隐去]，电话[电话已隐去]，咳嗽3天',
    categories: ['姓名', '住院号', '床号', '电话']
  });
  assert.deepEqual(AI.redactionDiff('姓名：[已隐去]，咳嗽3天', record()).categories, []);
});

test('AI：空格标签、电话、证件和县区级出生地均在发送前脱敏', () => {
  const text = '姓名 李小虚 住院号 0012345 病案号 BA00057 床号 08，身份证号 99000020000101001X，手机13900001111，座机0577-88001234，出生地 虚构省虚构市虚构县。';
  const sent = request(record(), text).user;
  for (const value of ['李小虚', '0012345', 'BA00057', '08', '99000020000101001X', '13900001111', '0577-88001234', '虚构省虚构市虚构县']) {
    assert.ok(!sent.includes(value), `不应发送身份信息：${value}`);
  }
  for (const label of ['姓名', '住院号', '病案号', '床号', '出生地']) assert.ok(sent.includes(`${label}：[已隐去]`));
});

test('AI：姓名未填写时仍隐去患者称呼后的姓名和详细地址', () => {
  const text = '患者王小虚，患者周小虚于就诊。现住址 虚构省虚构市虚构区和平路99号3室；患者住虚构省虚构市虚构县星光村17号，出生于虚构省虚构市虚构县。';
  const diff = AI.redactionDiff(text, record());
  for (const value of ['王小虚', '周小虚', '虚构省虚构市虚构区和平路99号3室', '虚构省虚构市虚构县星光村17号']) {
    assert.ok(!diff.text.includes(value), `不应保留：${value}`);
  }
  assert.match(diff.text, /患者\[已隐去\]，患者\[已隐去\]于就诊/);
  assert.match(diff.text, /患者住\[地址已隐去\]/);
  assert.match(diff.text, /出生于\[已隐去\]/);
  assert.ok(diff.categories.includes('姓名'));
  assert.ok(diff.categories.includes('地址'));
  assert.equal(AI.redact(diff.text, record()), diff.text);
  const spaced = AI.redact('出生地 虚构省 虚构市 虚构县，现住址 虚构省 虚构市 虚构区 和平路 99号 3室。', record());
  assert.equal(spaced, '出生地：[已隐去]，现住址：[已隐去]。');
});

test('AI：脱敏不改变药物、剂量、日期、时间、化验和生命体征', () => {
  const text = '阿司匹林 100mg qd；2026-10-01，3天前；WBC 12.3×10^9/L，血压 150/90mmHg，脉搏96次/分。患者3天前咳嗽，患者于2026-10-01就诊，患者无明显诱因，患者诉胸闷，患者陈述：无发热。患者高血压，患者曾于2026-10-01就诊，患者经常咳嗽，患者张口呼吸。';
  const r = record();
  Object.assign(r.basic, { bedNo: '12', recordNo: '3', phone: '96' });
  assert.deepEqual(AI.redactionDiff(text, r), { text, categories: [] });
  assert.ok(request(r, text).user.includes(text));
  assert.equal(AI.redact('床号12，病历号3，咳嗽3天', r), '床号：[已隐去]，病历号：[已隐去]，咳嗽3天');
});
