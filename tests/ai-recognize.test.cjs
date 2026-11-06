const {test} = require('node:test');
const assert = require('node:assert/strict');
const {SCHEMA, CORE} = require('./bootstrap.cjs').bootGlobals();
const AI = require('../src/ai-core.js');

const image = () => ({mimeType: 'image/jpeg', dataBase64: Buffer.from('synthetic image').toString('base64')});
const record = () => { const r = SCHEMA.emptyRecord(); r.id = 'recognize_case'; return r; };
const recognize = (r = record(), text = '体温 37.8℃，心律不齐。', img = image()) =>
  AI.prepare('recognize', r, text, undefined, img);
const response = (suggestions = []) => ({suggestions, issues: [], questions: []});
const suggestion = (path, text, evidence = [{source: 'image', quote: 'T 37.8℃'}]) => ({path, text, evidence});

test('识别：图片与文字进入同一预览，图片数据不重复塞进文本正文', () => {
  const q = recognize();
  assert.deepEqual(q.image, image());
  assert.equal(q.operation, 'recognize');
  assert.deepEqual(q.sources.map(s => s.source), ['note', 'image']);
  assert.ok(q.allowed.includes('pe.vitals.temperature'));
  assert.ok(q.allowed.includes('ros.resp.fever.status'));
  assert.ok(!q.user.includes(image().dataBase64));
  assert.match(q.user, /呼吸系统/);
  assert.match(q.system, /asked_positive/);
});

test('识别：月经史白名单包含「未初潮」', () => {
  const q = recognize(record(), '月经史：未初潮。');
  assert.match(q.user, /未初潮/);
  const result = AI.validate(response([suggestion('menstruation.applicable', '未初潮', [])]), q);
  assert.equal(result.suggestions[0].text, '未初潮');
});

test('识别：支持 text-only 和图片-only，格式/大小/base64 均有边界校验', () => {
  assert.doesNotThrow(() => AI.prepare('recognize', record(), '患者诉咳嗽3天', undefined, null));
  assert.doesNotThrow(() => AI.prepare('recognize', record(), '', undefined, image()));
  assert.throws(() => AI.prepare('recognize', record(), '', undefined, null), /拍照|粘贴/);
  assert.throws(() => AI.prepare('recognize', record(), 'x', undefined, {mimeType: 'image/bmp', dataBase64: 'aGVsbG8='}), /格式/);
  assert.throws(() => AI.prepare('recognize', record(), 'x', undefined, {mimeType: 'image/png', dataBase64: 'not base64'}), /图片数据/);
  assert.throws(() => AI.normalizeImagePayload({mimeType: 'image/png', dataBase64: 'A'.repeat(AI.MAX_IMAGE_BASE64 + 4)}), /过大/);
  assert.throws(() => AI.prepare('organize', record(), '患者诉咳嗽3天', undefined, image()), /只有识别/);
});

test('识别：逐条丢弃不合格建议并保留合规项', () => {
  const q = recognize();
  const result = AI.validate(response([
    suggestion('basic.gender', '男', []),
    suggestion('pe.vitals.temperature', '99', []),
    suggestion('basic.age', '45岁', []),
  ]), q);
  assert.deepEqual(result.suggestions.map(s => [s.path, s.text]), [['basic.gender', '男'], ['basic.age', '45']]);
  assert.deepEqual(result.dropped, [{path: 'pe.vitals.temperature', reason: 'AI 返回的生命体征或年龄超出可信范围，未写入病历'}]);
});

test('识别：数值支持常见单位后缀，拒绝 kPa、斤、℉', () => {
  assert.equal(AI.normalizeRecognizeValue('pe.vitals.temperature', '37.8°C'), '37.8');
  assert.equal(AI.normalizeRecognizeValue('pe.vitals.temperature', '37.8 ℃'), '37.8');
  assert.equal(AI.normalizeRecognizeValue('basic.age', '45岁'), '45');
  assert.equal(AI.normalizeRecognizeValue('pe.vitals.pulse', '98%'), '98');
  assert.throws(() => AI.normalizeRecognizeValue('pe.vitals.sbp', '16 kPa'), /kPa/);
  assert.throws(() => AI.normalizeRecognizeValue('pe.vitals.weight', '120斤'), /斤/);
  assert.throws(() => AI.normalizeRecognizeValue('pe.vitals.temperature', '98.6℉'), /℉/);
});

test('识别：白名单只允许可核对的字段，诊断/处方/身份/摘要均拒绝', () => {
  const q = recognize();
  for (const path of ['diagnosis.confirmed.0', 'soap.p.principle', 'basic.name', 'basic.phone', 'summary']) {
    const evidence = [{source: 'note', quote: '体温 37.8℃'}];
    const result = AI.validate(response([suggestion(path, '测试', evidence)]), q);
    assert.equal(result.suggestions.length, 0);
    assert.equal(result.dropped[0].path, path);
    assert.match(result.dropped[0].reason, /越界/);
  }
});

test('识别：选择项严格匹配 schema 枚举，生命体征校验可信范围', () => {
  const q = recognize();
  assert.equal(AI.validate(response([suggestion('basic.gender', '男', [])]), q).suggestions[0].text, '男');
  const badEnum = AI.validate(response([suggestion('basic.gender', '男性', [])]), q);
  assert.equal(badEnum.suggestions.length, 0);
  assert.match(badEnum.dropped[0].reason, /允许值/);
  assert.equal(AI.validate(response([suggestion('pe.vitals.temperature', '37.8')]), q).suggestions[0].kind, 'number');
  const badRange = AI.validate(response([suggestion('pe.vitals.temperature', '99')]), q);
  assert.equal(badRange.suggestions.length, 0);
  assert.match(badRange.dropped[0].reason, /可信范围/);
  assert.equal(AI.validate(response([suggestion('pe.vitals.temperature', '37.8℃')]), q).suggestions[0].text, '37.8');
});

test('识别：校验图片/文字引用，不合格建议逐条丢弃', () => {
  const q = recognize();
  assert.doesNotThrow(() => AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [{source: 'note', quote: '体温 37.8℃'}])]), q));
  const badQuote = AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [{source: 'note', quote: '不存在的原文'}])]), q);
  assert.equal(badQuote.suggestions.length, 0);
  assert.match(badQuote.dropped[0].reason, /无法核实/);
  const textOnly = AI.prepare('recognize', record(), '患者诉咳嗽3天', undefined, null);
  const badImage = AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [{source: 'image', quote: '图片'}])]), textOnly);
  assert.equal(badImage.suggestions.length, 0);
  assert.match(badImage.dropped[0].reason, /图片依据/);
});

test('识别：纯文字来源必须逐字引用，数字与否定不一致逐条丢弃', () => {
  const q = AI.prepare('recognize', record(), '患者诉咳嗽3天，无发热。', undefined, null);
  const missing = AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [])]), q);
  assert.equal(missing.suggestions.length, 0);
  assert.match(missing.dropped[0].reason, /缺少有效原文依据/);
  const numberMismatch = AI.validate(response([suggestion('hpi.onset', '咳嗽5天', [{source: 'note', quote: '患者诉咳嗽3天，无发热。'}])]), q);
  assert.equal(numberMismatch.suggestions.length, 0);
  assert.match(numberMismatch.dropped[0].reason, /数字/);
  const negation = AI.validate(response([suggestion('hpi.symptoms', '发热', [{source: 'note', quote: '无发热'}])]), q);
  assert.equal(negation.suggestions.length, 0);
  assert.match(negation.dropped[0].reason, /否定/);
});

test('识别：图片来源建议标记为依据未能自动核实，提示词要求逐字引用', () => {
  const q = recognize();
  const result = AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [])]), q);
  assert.equal(result.suggestions[0].fromImage, true);
  assert.match(q.system, /逐字摘录/);
  assert.match(q.system, /至少一条 source="note"/);
});

test('识别：已有内容默认不覆盖，勾选允许替换后才写入并标记 AI 未核对', () => {
  const r = record(); r.hpi.symptoms = '原始症状';
  const q = recognize(r, '咳嗽3天');
  const result = AI.validate(response([suggestion('hpi.symptoms', '咳嗽3天', [{source: 'note', quote: '咳嗽3天'}])]), q);
  assert.throws(() => AI.apply(r, q, result, [0], false, 'deepseek-flash'), /已有/);
  const next = AI.apply(r, q, result, [0], true, 'deepseek-flash');
  assert.equal(next.hpi.symptoms, '咳嗽3天');
  assert.equal(CORE.fieldState(next, 'hpi.symptoms').source, 'ai');
  assert.equal(CORE.fieldReviewValid(next, 'hpi.symptoms'), false);
});

test('识别：勾选查体项同步本次检查状态，未查则保持未勾', () => {
  const r = record();
  const q = recognize(r);
  const result = AI.validate(response([
    suggestion('pe.chest.heartAuscultation', '心律不齐，可闻及早搏', []),
    suggestion('pe.genital.genitalia', '未查', []),
  ]), q);
  const next = AI.apply(r, q, result, [0, 1], false, 'deepseek-flash');
  assert.equal(next.pe.chest.heartAuscultation, '心律不齐，可闻及早搏');
  assert.equal(SCHEMA.peChecked(next, 'chest', 'heartAuscultation'), true);
  assert.equal(SCHEMA.peChecked(next, 'genital', 'genitalia'), false);
});

test('识别：ROS 状态同步事实状态，阳性/阴性/未问均按三态落库', () => {
  const r = record();
  const q = recognize(r);
  const result = AI.validate(response([
    suggestion('ros.resp.fever.status', 'asked_positive', []),
    suggestion('ros.gi.nausea.status', 'asked_negative', []),
    suggestion('ros.cardio.syncope.status', 'not_asked', []),
  ]), q);
  const next = AI.apply(r, q, result, [0, 1, 2], false, 'deepseek-flash');
  assert.equal(next.ros.resp.fever.status, 'asked_positive');
  assert.equal(next.ros.resp.fever.checked, true);
  assert.equal(SCHEMA.rosFactState(next.ros.resp.fever), 'asked_positive');
  assert.equal(next.ros.gi.nausea.negative, true);
  assert.equal(SCHEMA.rosFactState(next.ros.gi.nausea), 'asked_negative');
  assert.equal(SCHEMA.rosFactState(next.ros.cardio.syncope), 'not_asked');
});

test('识别：专科查体只开放当前科室，其他科室目标不进入请求', () => {
  const r = record();
  const specialKeys = Object.keys(SCHEMA.PE_SPECIAL);
  assert.ok(specialKeys.length >= 2);
  r.basic.department = specialKeys[0];
  const q = recognize(r);
  assert.ok(q.allowed.some(path => path.startsWith('pe.special_' + specialKeys[0] + '.')));
  assert.ok(!q.allowed.some(path => path.startsWith('pe.special_' + specialKeys[1] + '.')));
  assert.ok(AI.recognizeTargets(q.allowed).some(target => target.kind === 'choice'));
  assert.ok(AI.recognizeTargets(q.allowed).some(target => target.kind === 'number'));
});

test('识别：非白名单选择项与空白值在写边界再次校验', () => {
  const r = record();
  const q = recognize(r);
  const result = AI.validate(response([suggestion('basic.gender', '男', [])]), q);
  const tampered = {...result, suggestions: [{...result.suggestions[0], path: 'diagnosis.confirmed.0'}]};
  assert.throws(() => AI.apply(r, q, tampered, [0], true, ''), /越界/);
  const blank = AI.validate(response([suggestion('basic.gender', '', [])]), q);
  assert.equal(blank.suggestions.length, 0);
  assert.match(blank.dropped[0].reason, /建议值无效|空白/);
});
