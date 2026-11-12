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
  assert.ok(!q.allowed.some(path => path.startsWith('ros.')));
  assert.ok(!q.user.includes(image().dataBase64));
  assert.doesNotMatch(q.user, /ros\./);
  assert.match(q.system, /识别和整理填表均禁止输出系统回顾字段/);
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

test('识别：已有内容默认不覆盖，勾选允许替换后才写入并标记 AI 未核对', () => {  const r = record(); r.hpi.symptoms = '原始症状';
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

test('识别和整理填表均拒绝 ROS 建议，保留旧 ROS 原值', () => {
  const r = record();
  r.ros.resp = { fever: { checked: true, detail: '虚构旧症状' } };
  for (const operation of ['recognize', 'organize']) {
  const q = AI.prepare(operation, r, '否认发热', undefined, operation === 'recognize' ? image() : null);
  const result = AI.validate(response([
    suggestion('ros.resp.fever.status', 'asked_positive', []),
    suggestion('ros.gi.nausea.status', 'asked_negative', []),
    suggestion('ros.cardio.syncope.status', 'not_asked', []),
  ]), q);
  assert.equal(result.suggestions.length, 0);
  assert.equal(result.dropped.length, 3);
  assert.throws(() => AI.apply(r, q, result, [0], false, 'deepseek-flash'));
  assert.deepEqual(r.ros, { resp: { fever: { checked: true, detail: '虚构旧症状' } } });
  }
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

test('识别：压缩字段目录控制提示词长度并保留旧版对象接口', () => {
  const note = '"\n'.repeat(8000);
  assert.equal(note.length, 16000);
  const q = AI.prepare('recognize', record(), note, undefined, null);
  assert.ok(q.user.length <= 42000);
  const payload = JSON.parse(q.user);
  assert.equal(Array.isArray(payload.targets), false);
  assert.ok(payload.valueSets.some(values => values.includes('未初潮')));
  assert.doesNotMatch(q.user, /ros\./);
  assert.match(q.system, /valueSets/);
  const legacy = AI.recognizeTargets();
  assert.ok(Array.isArray(legacy));
  assert.equal(Array.isArray(legacy[0]), false);
  assert.equal(typeof legacy[0].path, 'string');
  assert.equal(typeof legacy[0].label, 'string');
});

test('数值核对：完整数字、单位及血压高低压顺序都必须与原文一致', () => {
  const q = recognize(record(), '脉搏96次/分，体温37.8℃，血压126/94mmHg。', null);
  const check = (path, text, quote) => AI.validate(response([suggestion(path, text, [{source: 'note', quote}])]), q);
  assert.equal(check('pe.vitals.pulse', '96', '脉搏96次/分').suggestions.length, 1);
  assert.equal(check('pe.vitals.temperature', '37.8℃', '体温37.8℃').suggestions.length, 1);
  for (const [path, value, quote] of [
    ['pe.vitals.pulse', '69', '脉搏96次/分'],
    ['pe.vitals.temperature', '38.9', '体温37.8℃'],
    ['pe.vitals.pulse', '96℃', '脉搏96次/分'],
    ['pe.vitals.sbp', '94', '94'],
    ['pe.vitals.dbp', '126', '126'],
    ['pe.vitals.sbp', '126', '血压126/95mmHg'],
  ]) assert.equal(check(path, value, quote).suggestions.length, 0, `${path} ${value}`);
  assert.equal(check('pe.vitals.sbp', '126', '血压126/94mmHg').suggestions.length, 1);
  assert.equal(check('pe.vitals.dbp', '94', '血压126/94mmHg').suggestions.length, 1);
  const longNumber = recognize(record(), '脉搏196次/分。', null);
  assert.equal(AI.validate(response([suggestion('pe.vitals.pulse', '96', [{source:'note', quote:'96'}])]), longNumber).suggestions.length, 0);
  const wrongUnit = recognize(record(), '体温37.8℉。', null);
  assert.equal(AI.validate(response([suggestion('pe.vitals.temperature', '37.8', [{source:'note', quote:'37.8'}])]), wrongUnit).suggestions.length, 0);
});

test('选择项核对：逐字依据、否定上下文和混合图片不能绕过文字校验', () => {
  const q = recognize(record(), '否认吸烟，饮酒史：有，性别女。', image());
  const check = (path, text, evidence) => AI.validate(response([suggestion(path, text, evidence)]), q);
  assert.equal(check('personal.smoking', '无', [{source:'note', quote:'否认吸烟'}]).suggestions.length, 1);
  assert.equal(check('personal.drinking', '有', [{source:'note', quote:'饮酒史：有'}]).suggestions.length, 1);
  assert.equal(check('basic.gender', '女', [{source:'note', quote:'性别女'}]).suggestions.length, 1);
  for (const evidence of [[], [{source:'note', quote:'吸烟史：有'}], [{source:'note', quote:'否认吸烟'}], [{source:'note', quote:'吸烟'}], [{source:'note', quote:'否认吸烟'}, {source:'image', quote:'吸烟'}]]) {
    // A pure image without evidence is allowed only as explicitly unverified; check text cases here.
    if (!evidence.length) continue;
    assert.equal(check('personal.smoking', '有', evidence).suggestions.length, 0);
  }
  const no = recognize(record(), '吸烟史：否，未戒烟。', null);
  assert.equal(AI.validate(response([suggestion('personal.smoking', '有', [{source:'note', quote:'吸烟史：否'}])]), no).suggestions.length, 0);
  assert.equal(AI.validate(response([suggestion('personal.smoking', '无', [{source:'note', quote:'吸烟史：否'}])]), no).suggestions.length, 1);
  assert.equal(AI.validate(response([suggestion('personal.smoking', '已戒', [{source:'note', quote:'未戒烟'}])]), no).suggestions.length, 0);
  const ambiguous = recognize(record(), '否认吸烟。吸烟史：有。', null);
  assert.equal(AI.validate(response([suggestion('personal.smoking', '有', [{source:'note', quote:'吸烟'}])]), ambiguous).suggestions.length, 0);
  for (const note of ['吸烟史未记录。', '是否吸烟。']) {
    const unknown = recognize(record(), note, null);
    for (const value of ['有', '无']) assert.equal(AI.validate(response([suggestion('personal.smoking', value, [{source:'note', quote:note}])]), unknown).suggestions.length, 0);
  }
  const textOnly = recognize(record(), '否认吸烟。', null);
  assert.equal(AI.validate(response([suggestion('personal.smoking', '无', [])]), textOnly).suggestions.length, 0);
  const imageOnly = check('personal.smoking', '有', [{source:'image', quote:'吸烟'}]);
  assert.equal(imageOnly.suggestions[0].fromImage, true);
});

test('整理填表一次建议文字和结构化字段，不开放系统回顾，采纳与撤销保留手改', () => {
  const r = record();
  r.hpi.symptoms = '旧症状';
  const note = '患者诉咳嗽3天，否认发热。体温37.8℃，否认吸烟，外生殖器包皮过长。';
  const q = AI.prepare('organize', r, note);
  assert.ok(q.allowed.includes('pe.vitals.temperature'));
  assert.ok(q.allowed.includes('personal.smoking'));
  assert.ok(!q.allowed.some(path => path.startsWith('ros.')));
  const entries = [
    suggestion('hpi.symptoms', '患者诉咳嗽3天。', [{source:'note', quote:'患者诉咳嗽3天'}]),
    suggestion('hpi.negativeDiscriminating', '否认发热。', [{source:'note', quote:'否认发热'}]),
    suggestion('pe.vitals.temperature', '37.8', [{source:'note', quote:'体温37.8℃'}]),
    suggestion('personal.smoking', '无', [{source:'note', quote:'否认吸烟'}]),
    suggestion('pe.genital.genitalia', '包皮过长', [{source:'note', quote:'外生殖器包皮过长'}]),
    suggestion('ros.resp.fever.status', 'asked_negative', [{source:'note', quote:'否认发热'}]),
  ];
  const result = AI.validate(response(entries), q);
  assert.deepEqual(result.suggestions.map(s => s.kind), ['text', 'text', 'number', 'choice', 'choice']);
  assert.equal(result.dropped[0].path, 'ros.resp.fever.status');
  assert.throws(() => AI.apply(r, q, result, [], true, ''), /勾选/);
  assert.throws(() => AI.apply(r, q, result, [0, 2], false, ''), /已有/);
  const applied = AI.apply(r, q, result, [0, 2, 3, 4], true, 'deepseek-flash');
  assert.equal(applied.pe.vitals.temperature, '37.8');
  assert.equal(applied.personal.smoking, '无');
  assert.equal(SCHEMA.peChecked(applied, 'genital', 'genitalia'), true);
  assert.equal(applied.hpi.negativeDiscriminating, '');
  const undo = AI.createAdoptionUndo(r, applied, [0, 2, 3, 4].map(i => result.suggestions[i].path));
  applied.hpi.symptoms = '之后手改的症状'; CORE.markFieldManual(applied, 'hpi.symptoms');
  applied.hpi.onset = '之后补录的起病';
  const restored = AI.undoAdoption(applied, undo);
  assert.deepEqual([restored.restored, restored.kept], [3, 1]);
  assert.equal(restored.record.hpi.symptoms, '之后手改的症状');
  assert.equal(restored.record.hpi.onset, '之后补录的起病');
  assert.equal(restored.record.pe.vitals.temperature, r.pe.vitals.temperature);
  assert.equal(restored.record.personal.smoking, r.personal.smoking);
  assert.equal(SCHEMA.peChecked(restored.record, 'genital', 'genitalia'), false);
  const replacement = AI.apply(r, q, result, [0], true, 'deepseek-flash');
  const oldState = CORE.fieldState(r, 'hpi.symptoms');
  const replacementUndo = AI.createAdoptionUndo(r, replacement, ['hpi.symptoms']);
  const rolledBack = AI.undoAdoption(replacement, replacementUndo).record;
  assert.equal(rolledBack.hpi.symptoms, '旧症状');
  assert.deepEqual(CORE.fieldState(rolledBack, 'hpi.symptoms'), oldState);
  assert.throws(() => AI.undoAdoption({...applied, id:'other'}, undo), /另一份/);
});
