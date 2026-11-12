import { describe, expect, it } from 'vitest';
import { RECORD_CORE, SCHEMA, type DabingliRecord } from '@dabingli/domain';
import {
  adoptAiSuggestions,
  confirmAiField,
  createAiResult,
  createAiAdoptionUndo,
  undoAiAdoption,
  listAdoptedAiFields,
  normalizeRecognizeValue,
  prepareAiRequest,
  recognitionTargets,
  redactionDiff,
  redactText,
  validateAiResponse,
} from '../src';

function makeRecord(): DabingliRecord {
  const record = SCHEMA.emptyRecord();
  record.id = 'case_a';
  return record;
}

function organizeRequest(record: DabingliRecord, note = '患者诉咳嗽3天，发热未问') {
  return prepareAiRequest('organize', record, note);
}

function response(
  text = '患者诉咳嗽3天。',
  quote = '患者诉咳嗽3天',
  path = 'hpi.symptoms',
) {
  return {
    suggestions: [{ path, text, evidence: [{ source: 'note', quote }] }],
    issues: [],
    questions: [],
  };
}

describe('AI request boundary', () => {
  it('redacts known identifiers and never sends the local record id', () => {
    const record = makeRecord();
    Object.assign(record.basic, {
      name: '张三',
      phone: '13812345678',
      address: '测试路99号',
      recordNo: 'ABC12345',
    });
    const request = organizeRequest(
      record,
      '张三住测试路99号，病历号ABC12345，电话13812345678，证件110101199001010011，咳嗽3天',
    );
    ['张三', '测试路99号', 'ABC12345', '13812345678', '110101199001010011', 'case_a'].forEach(
      (privateText) => expect(request.user).not.toContain(privateText),
    );
    expect(request.sources).toHaveLength(1);
    expect(request.baseline.recordId).toBe('case_a');
    expect(request.baseline.contentHash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('redacts labelled identifiers and leaves clinical text untouched', () => {
    const request = organizeRequest(makeRecord(), '姓名：张三 住院号：12345 床号：8，咳嗽3天');
    expect(request.user).not.toContain('张三');
    expect(request.user).not.toContain('12345');
    expect(request.user).toContain('姓名：[已隐去]');
    expect(request.user).toContain('住院号：[已隐去]');
    expect(request.user).toContain('床号：[已隐去]');
    expect(request.user).toContain('咳嗽3天');
  });

  it('excludes unreviewed template, default, example and prior AI content', () => {
    const record = makeRecord();
    record.hpi.symptoms = '咳嗽3天';
    ['template', 'default', 'example', 'ai'].forEach((source) => {
      RECORD_CORE.setFieldState(record, 'hpi.symptoms', { source, reviewed: false });
      expect(() => prepareAiRequest('summary', record)).toThrow(/尚无可发送/);
      RECORD_CORE.markFieldReviewed(record, 'hpi.symptoms', source);
      expect(prepareAiRequest('summary', record).user).toContain('咳嗽3天');
    });
  });

  it('only sends actually checked nonempty physical findings and de-identified aux data', () => {
    const record = makeRecord();
    record.pe.chest = { breath: '右肺湿啰音', normal: '' };
    record.pe.checked.chest = { breath: true, normal: true };
    record.auxiliary.items = [{
      name: '血常规',
      result: '白细胞升高',
      hospital: '不应发送医院',
      no: '不应发送检查号',
    }];
    const request = prepareAiRequest('check', record);
    expect(request.user).toContain('右肺湿啰音');
    expect(request.user).toContain('白细胞升高');
    expect(request.user).not.toContain('不应发送');
    expect(request.allowed).toEqual([]);
  });
});

describe('AI result validation and adoption', () => {
  it('accepts only exact evidence and rejects unsafe or unsupported fields', () => {
    const request = organizeRequest(makeRecord());
    expect(validateAiResponse(response(), request).suggestions).toHaveLength(1);
    expect(validateAiResponse(response('张三', '患者诉咳嗽3天', 'basic.name'), request).dropped[0]?.reason).toMatch(/越界/);
    expect(validateAiResponse(response('无发热', '无发热'), request).dropped[0]?.reason).toMatch(/无法核实/);
    expect(validateAiResponse(response('咳嗽5天', '咳嗽3天'), request).dropped[0]?.reason).toMatch(/数字/);
  });

  it('stores the request revision/hash and evidence paths when adopted', () => {
    const record = makeRecord();
    const request = organizeRequest(record);
    const result = createAiResult(validateAiResponse(response(), request), request, 'deepseek-flash');
    const next = adoptAiSuggestions(record, request, result, [0], false, '2026-11-01T00:00:00.000Z');
    const state = RECORD_CORE.fieldState(next, 'hpi.symptoms');

    expect(next.hpi.symptoms).toBe('患者诉咳嗽3天。');
    expect(state.source).toBe('ai');
    expect(state.reviewed).toBe(false);
    expect(JSON.parse(state.sourceRef)).toMatchObject({
      provider: 'DeepSeek',
      baseline: request.baseline,
      evidencePaths: ['note'],
    });
    expect(listAdoptedAiFields(next)).toEqual([
      expect.objectContaining({
        path: 'hpi.symptoms',
        reviewed: false,
        baseline: request.baseline,
        evidencePaths: ['note'],
      }),
    ]);
  });

  it('keeps adopted content unverified until the user confirms it', () => {
    const record = makeRecord();
    const request = organizeRequest(record);
    const result = createAiResult(validateAiResponse(response(), request), request, 'deepseek-flash');
    const adopted = adoptAiSuggestions(record, request, result, [0], false);
    const confirmed = confirmAiField(adopted, 'hpi.symptoms');

    expect(listAdoptedAiFields(adopted)[0]?.reviewed).toBe(false);
    expect(listAdoptedAiFields(confirmed)[0]?.reviewed).toBe(true);
    expect(RECORD_CORE.fieldState(confirmed, 'hpi.symptoms').source).toBe('ai');
  });

  it('blocks stale writes after clinical content or the record id changes', () => {
    const record = makeRecord();
    const request = organizeRequest(record);
    const result = createAiResult(validateAiResponse(response(), request), request, 'deepseek-flash');

    record.hpi.onset = '刚补充的内容';
    expect(() => adoptAiSuggestions(record, request, result, [0], true)).toThrow(/已过期/);

    record.hpi.onset = '';
    record.id = 'case_b';
    expect(() => adoptAiSuggestions(record, request, result, [0], true)).toThrow(/已过期/);
  });

  it('does not treat metadata-only autosave revisions as content changes', () => {
    const record = makeRecord();
    const request = organizeRequest(record);
    const result = createAiResult(validateAiResponse(response(), request), request, 'deepseek-flash');
    record.meta.revision = (record.meta.revision ?? 0) + 1;
    expect(() => adoptAiSuggestions(record, request, result, [0], false)).not.toThrow();
  });
});

describe('AI image/text recognition boundary', () => {
  const image = { mimeType: 'image/jpeg', dataBase64: 'aGVsbG8=' };
  const recognizeRequest = (
    record: DabingliRecord,
    note = '体温 37.8℃，心律不齐。',
    attachment: { mimeType: string; dataBase64: string } | null = image,
  ) => prepareAiRequest('recognize', record, note, 'hpi.symptoms', attachment);

  function recognized(
    path: string,
    text: string,
    evidence: Array<{ source: string; quote: string }> = [],
  ) {
    return {
      suggestions: [{ path, text, evidence }],
      issues: [],
      questions: [],
    };
  }

  it('prepares a multimodal request without duplicating base64 in user JSON', () => {
    const request = recognizeRequest(makeRecord());
    expect(request.operation).toBe('recognize');
    expect(request.image).toEqual(image);
    expect(request.sources.map((source) => source.source)).toEqual(['note', 'image']);
    expect(request.user).not.toContain(image.dataBase64);
    expect(request.allowed).toContain('pe.vitals.temperature');
    expect(request.allowed).toContain('ros.resp.fever.status');
    expect(request.system).toContain('asked_positive');
  });

  it('offers 未初潮 as a whitelisted menstruation choice', () => {
    const request = recognizeRequest(makeRecord(), '月经史：未初潮。');
    expect(request.user).toContain('未初潮');
    const validated = validateAiResponse(recognized('menstruation.applicable', '未初潮'), request);
    expect(validated.suggestions[0]?.text).toBe('未初潮');
  });

  it('supports text-only or image-only and enforces image type/size/base64 limits', () => {
    expect(recognizeRequest(makeRecord(), '患者诉咳嗽3天', null).image).toBeUndefined();
    expect(recognizeRequest(makeRecord(), '', image).image).toEqual(image);
    expect(() => recognizeRequest(makeRecord(), '', null)).toThrow(/拍照|粘贴/);
    expect(() => recognizeRequest(makeRecord(), 'x', { mimeType: 'image/bmp', dataBase64: 'aGVsbG8=' }))
      .toThrow(/格式/);
    expect(() => recognizeRequest(makeRecord(), 'x', { mimeType: 'image/png', dataBase64: 'abc' }))
      .toThrow(/图片数据/);
    expect(() => recognizeRequest(makeRecord(), 'x', {
      mimeType: 'image/png',
      dataBase64: 'A'.repeat(6 * 1024 * 1024 + 4),
    })).toThrow(/过大/);
  });

  it('drops one invalid recognition suggestion and keeps the valid ones', () => {
    const request = recognizeRequest(makeRecord());
    const result = validateAiResponse({
      suggestions: [
        { path: 'basic.gender', text: '男', evidence: [] },
        { path: 'pe.vitals.temperature', text: '99', evidence: [] },
        { path: 'basic.age', text: '45岁', evidence: [] },
      ],
      issues: [],
      questions: [],
    }, request);
    expect(result.suggestions.map((suggestion) => [suggestion.path, suggestion.text])).toEqual([
      ['basic.gender', '男'],
      ['basic.age', '45'],
    ]);
    expect(result.dropped).toEqual([
      { path: 'pe.vitals.temperature', reason: expect.stringMatching(/可信范围/) },
    ]);
  });

  it('normalizes supported units and rejects kPa, 斤 and ℉ with reasons', () => {
    expect(normalizeRecognizeValue('pe.vitals.temperature', '37.8°C')).toBe('37.8');
    expect(normalizeRecognizeValue('pe.vitals.temperature', '37.8 ℃')).toBe('37.8');
    expect(normalizeRecognizeValue('basic.age', '45岁')).toBe('45');
    expect(normalizeRecognizeValue('pe.vitals.pulse', '98%')).toBe('98');
    expect(() => normalizeRecognizeValue('pe.vitals.pulse', '1,234次/分钟')).toThrow(/可信范围/);
    expect(() => normalizeRecognizeValue('pe.vitals.sbp', '16 kPa')).toThrow(/kPa/);
    expect(() => normalizeRecognizeValue('pe.vitals.weight', '120斤')).toThrow(/斤/);
    expect(() => normalizeRecognizeValue('pe.vitals.temperature', '98.6℉')).toThrow(/℉/);
  });

  it('drops out-of-scope fields, invalid enums, and out-of-range vitals individually', () => {
    const request = recognizeRequest(makeRecord());
    const result = validateAiResponse({
      suggestions: [
        { path: 'basic.gender', text: '男性', evidence: [] },
        { path: 'basic.gender', text: '男', evidence: [] },
        { path: 'diagnosis.confirmed.0', text: '肺炎', evidence: [] },
        { path: 'basic.name', text: '张三', evidence: [] },
        { path: 'pe.vitals.temperature', text: '99', evidence: [] },
      ],
      issues: [],
      questions: [],
    }, request);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]?.text).toBe('男');
    expect(result.dropped.map((entry) => entry.path)).toEqual([
      'basic.gender',
      'diagnosis.confirmed.0',
      'basic.name',
      'pe.vitals.temperature',
    ]);
    expect(result.dropped[0]?.reason).toMatch(/允许值/);
    expect(result.dropped[1]?.reason).toMatch(/越界/);
    expect(result.dropped[3]?.reason).toMatch(/可信范围/);
  });

  it('requires verified note evidence and only accepts image evidence with an image', () => {
    const request = recognizeRequest(makeRecord());
    const badQuote = validateAiResponse(recognized(
      'hpi.symptoms',
      '咳嗽3天',
      [{ source: 'note', quote: '不存在的原文' }],
    ), request);
    expect(badQuote.suggestions).toHaveLength(0);
    expect(badQuote.dropped[0]?.reason).toMatch(/无法核实/);
    const textOnly = recognizeRequest(makeRecord(), '患者诉咳嗽3天', null);
    const badImage = validateAiResponse(recognized(
      'hpi.symptoms',
      '咳嗽3天',
      [{ source: 'image', quote: '图片' }],
    ), textOnly);
    expect(badImage.suggestions).toHaveLength(0);
    expect(badImage.dropped[0]?.reason).toMatch(/图片依据/);
  });

  it('drops text-only recognition suggestions without note evidence or with inconsistent facts', () => {
    const request = recognizeRequest(makeRecord(), '患者诉咳嗽3天，无发热。', null);
    const missing = validateAiResponse(recognized('hpi.symptoms', '咳嗽3天'), request);
    expect(missing.suggestions).toHaveLength(0);
    expect(missing.dropped[0]?.reason).toMatch(/缺少有效原文依据/);

    const numberMismatch = validateAiResponse(recognized(
      'hpi.onset',
      '咳嗽5天',
      [{ source: 'note', quote: '患者诉咳嗽3天，无发热。' }],
    ), request);
    expect(numberMismatch.suggestions).toHaveLength(0);
    expect(numberMismatch.dropped[0]?.reason).toMatch(/数字/);

    const negation = validateAiResponse(recognized(
      'hpi.symptoms',
      '发热',
      [{ source: 'note', quote: '无发热' }],
    ), request);
    expect(negation.suggestions).toHaveLength(0);
    expect(negation.dropped[0]?.reason).toMatch(/否定/);
  });

  it('marks image-based recognition suggestions as not machine-verifiable', () => {
    const request = recognizeRequest(makeRecord());
    const result = validateAiResponse(recognized('hpi.symptoms', '咳嗽3天'), request);
    expect(result.suggestions[0]?.fromImage).toBe(true);
    expect(request.system).toContain('逐字摘录');
    expect(request.system).toContain('至少一条 source="note"');
  });

  it('keeps a 16000-character quoted note within the prompt budget', () => {
    const note = '"\n'.repeat(8000);
    expect(note).toHaveLength(16000);
    const request = recognizeRequest(makeRecord(), note, null);
    expect(request.user.length).toBeLessThanOrEqual(42000);
    const payload = JSON.parse(request.user) as {
      targets: Record<string, unknown>;
      valueSets: string[][];
      groupLabels: Record<string, string>;
    };
    expect(Array.isArray(payload.targets)).toBe(false);
    expect(payload.valueSets).toContainEqual(['有', '无', '未初潮']);
    expect(payload.groupLabels['ros.resp']).toContain('呼吸系统');
    expect(request.user).not.toContain('pe.vitals.temperature');
    expect(request.system).toContain('valueSets');
  });

  it('keeps recognitionTargets as the legacy object list for callers and tests', () => {
    const targets = recognitionTargets();
    expect(targets.length).toBeGreaterThan(300);
    const temperature = targets.find((target) => target.path === 'pe.vitals.temperature');
    expect(temperature).toMatchObject({ path: 'pe.vitals.temperature', kind: 'number' });
    expect(typeof temperature?.label).toBe('string');
    expect(typeof temperature?.min).toBe('number');
    expect(typeof temperature?.max).toBe('number');
    expect(Array.isArray(targets[0])).toBe(false);
  });

  it('does not replace existing content without explicit consent', () => {
    const record = makeRecord();
    record.hpi.symptoms = '原始症状';
    const request = recognizeRequest(record, '咳嗽3天');
    const result = createAiResult(validateAiResponse(recognized(
      'hpi.symptoms',
      '咳嗽3天',
      [{ source: 'note', quote: '咳嗽3天' }],
    ), request), request, 'deepseek-flash');
    expect(() => adoptAiSuggestions(record, request, result, [0], false)).toThrow(/已有内容/);
    const next = adoptAiSuggestions(record, request, result, [0], true);
    expect(next.hpi.symptoms).toBe('咳嗽3天');
    expect(RECORD_CORE.fieldState(next, 'hpi.symptoms').source).toBe('ai');
    expect(RECORD_CORE.fieldReviewValid(next, 'hpi.symptoms')).toBe(false);
  });

  it('synchronizes PE checked state and ROS fact state when adopted', () => {
    const record = makeRecord();
    const request = recognizeRequest(record, '查体记录');
    const responseBody = {
      suggestions: [
        { path: 'pe.chest.heartAuscultation', text: '心律不齐，可闻及早搏', evidence: [] },
        { path: 'ros.resp.fever.status', text: 'asked_positive', evidence: [] },
        { path: 'ros.gi.nausea.status', text: 'asked_negative', evidence: [] },
      ],
      issues: [],
      questions: [],
    };
    const result = createAiResult(validateAiResponse(responseBody, request), request, 'deepseek-flash');
    const next = adoptAiSuggestions(record, request, result, [0, 1, 2], false);

    expect(next.pe.chest.heartAuscultation).toBe('心律不齐，可闻及早搏');
    expect(SCHEMA.peChecked(next, 'chest', 'heartAuscultation')).toBe(true);
    expect(SCHEMA.rosFactState(next.ros.resp?.fever)).toBe('asked_positive');
    expect(SCHEMA.rosFactState(next.ros.gi?.nausea)).toBe('asked_negative');
  });
});


describe('redaction change descriptions', () => {
  it('reports actual replacements, keeps clinical content and returns no raw identifiers', () => {
    const record = makeRecord();
    Object.assign(record.basic, { name: '张三', phone: '13812345678', recordNo: 'MR12345', address: '测试路99号' });
    const raw = '张三住测试路99号，病历号MR12345，电话13812345678，证件110101199001010011，咳嗽3天';
    const diff = redactionDiff(raw, record);
    expect(new Set(diff.categories)).toEqual(new Set(['姓名', '地址', '病历号', '电话', '身份证']));
    expect(diff.text).toBe(redactText(raw, record));
    expect(diff.text).toContain('咳嗽3天');
    for (const identifier of ['张三', '测试路99号', 'MR12345', '13812345678', '110101199001010011']) {
      expect(JSON.stringify(diff)).not.toContain(identifier);
    }
  });

  it('describes label-based redactions and unknown phones, without false changes for clean or masked text', () => {
    const record = makeRecord();
    const diff = redactionDiff('姓名：张三 住院号：12345 床号：8，电话13912345678，咳嗽3天', record);
    expect(diff.categories).toEqual(['姓名', '住院号', '床号', '电话']);
    expect(diff.text).toBe('姓名：[已隐去] 住院号：[已隐去] 床号：[已隐去]，电话[电话已隐去]，咳嗽3天');
    expect(redactionDiff('姓名：[已隐去]，咳嗽3天', record).categories).toEqual([]);
    expect(redactionDiff('咳嗽3天，无发热', record)).toEqual({ text: '咳嗽3天，无发热', categories: [] });
  });
});

describe('additional identifier redaction', () => {
  it('redacts space-separated labels, phones, ID and birthplace through the county', () => {
    const text = '姓名 李小虚 住院号 0012345 病案号 BA00057 床号 08，身份证号 99000020000101001X，手机13900001111，座机0577-88001234，出生地 虚构省虚构市虚构县。';
    const sent = organizeRequest(makeRecord(), text).user;
    for (const value of ['李小虚', '0012345', 'BA00057', '08', '99000020000101001X', '13900001111', '0577-88001234', '虚构省虚构市虚构县']) {
      expect(sent).not.toContain(value);
    }
    for (const label of ['姓名', '住院号', '病案号', '床号', '出生地']) expect(sent).toContain(`${label}：[已隐去]`);
  });

  it('redacts patient names without a basic name and detailed addresses', () => {
    const text = '患者王小虚，患者周小虚于就诊。现住址 虚构省虚构市虚构区和平路99号3室；患者住虚构省虚构市虚构县星光村17号，出生于虚构省虚构市虚构县。';
    const diff = redactionDiff(text, makeRecord());
    for (const value of ['王小虚', '周小虚', '虚构省虚构市虚构区和平路99号3室', '虚构省虚构市虚构县星光村17号']) {
      expect(diff.text).not.toContain(value);
    }
    expect(diff.text).toContain('患者[已隐去]，患者[已隐去]于就诊');
    expect(diff.text).toContain('患者住[地址已隐去]');
    expect(diff.text).toContain('出生于[已隐去]');
    expect(diff.categories).toContain('姓名');
    expect(diff.categories).toContain('地址');
    expect(redactText(diff.text, makeRecord())).toBe(diff.text);
    const spaced = redactText('出生地 虚构省 虚构市 虚构县，现住址 虚构省 虚构市 虚构区 和平路 99号 3室。', makeRecord());
    expect(spaced).toBe('出生地：[已隐去]，现住址：[已隐去]。');
  });

  it('leaves medication, dates, clinical measurements and non-name patient phrases untouched', () => {
    const text = '阿司匹林 100mg qd；2026-10-01，3天前；WBC 12.3×10^9/L，血压 150/90mmHg，脉搏96次/分。患者3天前咳嗽，患者于2026-10-01就诊，患者无明显诱因，患者诉胸闷，患者陈述：无发热。患者高血压，患者曾于2026-10-01就诊，患者经常咳嗽，患者张口呼吸。';
    const record = makeRecord();
    Object.assign(record.basic, { bedNo: '12', recordNo: '3', phone: '96' });
    expect(redactionDiff(text, record)).toEqual({ text, categories: [] });
    expect(organizeRequest(record, text).user).toContain(text);
    expect(redactText('床号12，病历号3，咳嗽3天', record)).toBe('床号：[已隐去]，病历号：[已隐去]，咳嗽3天');
  });
});

describe('structured note evidence and undo regression', () => {
  const image = { mimeType: 'image/jpeg', dataBase64: 'aGVsbG8=' };
  const single = (path: string, text: string, quote: string) => ({
    suggestions: [{ path, text, evidence: [{ source: 'note', quote }] }], issues: [], questions: [],
  });

  it('compares whole numbers, units and the correct member of blood pressure pairs', () => {
    const request = prepareAiRequest('recognize', makeRecord(), '脉搏96次/分，体温37.8℃，血压126/94mmHg。');
    const check = (path: string, text: string, quote: string) => validateAiResponse(single(path, text, quote), request);
    expect(check('pe.vitals.pulse', '96', '脉搏96次/分').suggestions).toHaveLength(1);
    expect(check('pe.vitals.temperature', '37.8℃', '体温37.8℃').suggestions).toHaveLength(1);
    expect(check('pe.vitals.sbp', '126', '血压126/94mmHg').suggestions).toHaveLength(1);
    expect(check('pe.vitals.dbp', '94', '血压126/94mmHg').suggestions).toHaveLength(1);
    [
      ['pe.vitals.pulse', '69', '脉搏96次/分'],
      ['pe.vitals.temperature', '38.9', '体温37.8℃'],
      ['pe.vitals.pulse', '96℃', '脉搏96次/分'],
      ['pe.vitals.sbp', '94', '94'],
      ['pe.vitals.dbp', '126', '126'],
      ['pe.vitals.sbp', '126', '血压126/95mmHg'],
    ].forEach(([path, text, quote]) => expect(check(path!, text!, quote!).suggestions).toHaveLength(0));
    const long = prepareAiRequest('recognize', makeRecord(), '脉搏196次/分。');
    expect(validateAiResponse(single('pe.vitals.pulse', '96', '96'), long).suggestions).toHaveLength(0);
    const wrongUnit = prepareAiRequest('recognize', makeRecord(), '体温37.8℉。');
    expect(validateAiResponse(single('pe.vitals.temperature', '37.8', '37.8'), wrongUnit).suggestions).toHaveLength(0);
  });

  it('requires choice evidence and keeps cropped negation or mixed image evidence from bypassing checks', () => {
    const request = prepareAiRequest('recognize', makeRecord(), '否认吸烟，饮酒史：有，性别女。', 'hpi.symptoms', image);
    expect(validateAiResponse(single('personal.smoking', '无', '否认吸烟'), request).suggestions).toHaveLength(1);
    expect(validateAiResponse(single('personal.drinking', '有', '饮酒史：有'), request).suggestions).toHaveLength(1);
    expect(validateAiResponse(single('basic.gender', '女', '性别女'), request).suggestions).toHaveLength(1);
    for (const quote of ['吸烟史：有', '否认吸烟', '吸烟']) {
      expect(validateAiResponse(single('personal.smoking', '有', quote), request).suggestions).toHaveLength(0);
    }
    const mixed = single('personal.smoking', '有', '否认吸烟');
    mixed.suggestions[0]?.evidence.push({source: 'image', quote: '吸烟'});
    expect(validateAiResponse(mixed, request).suggestions).toHaveLength(0);
    const no = prepareAiRequest('recognize', makeRecord(), '吸烟史：否，未戒烟。');
    expect(validateAiResponse(single('personal.smoking', '有', '吸烟史：否'), no).suggestions).toHaveLength(0);
    expect(validateAiResponse(single('personal.smoking', '无', '吸烟史：否'), no).suggestions).toHaveLength(1);
    expect(validateAiResponse(single('personal.smoking', '已戒', '未戒烟'), no).suggestions).toHaveLength(0);
    const ambiguous = prepareAiRequest('recognize', makeRecord(), '否认吸烟。吸烟史：有。');
    expect(validateAiResponse(single('personal.smoking', '有', '吸烟'), ambiguous).suggestions).toHaveLength(0);
    for (const note of ['吸烟史未记录。', '是否吸烟。']) {
      const unknown = prepareAiRequest('recognize', makeRecord(), note);
      for (const value of ['有', '无']) expect(validateAiResponse(single('personal.smoking', value, note), unknown).suggestions).toHaveLength(0);
    }
    const textOnly = prepareAiRequest('recognize', makeRecord(), '否认吸烟。');
    expect(validateAiResponse({suggestions:[{path:'personal.smoking', text:'无', evidence:[]}], issues:[], questions:[]}, textOnly).suggestions).toHaveLength(0);
    expect(validateAiResponse({suggestions:[{path:'personal.smoking', text:'有', evidence:[{source:'image', quote:'吸烟'}]}], issues:[], questions:[]}, request).suggestions[0]?.fromImage).toBe(true);
  });

  it('organizes text and structured values together and undoes only unchanged adopted fields', () => {
    const record = makeRecord();
    record.hpi.symptoms = '旧症状';
    const note = '患者诉咳嗽3天，否认发热。体温37.8℃，否认吸烟，外生殖器包皮过长。';
    const request = prepareAiRequest('organize', record, note);
    expect(request.allowed).toContain('pe.vitals.temperature');
    expect(request.allowed).toContain('personal.smoking');
    expect(request.allowed.some((path) => path.startsWith('ros.'))).toBe(false);
    const pairs = [
      ['hpi.symptoms', '患者诉咳嗽3天。', '患者诉咳嗽3天'],
      ['hpi.negativeDiscriminating', '否认发热。', '否认发热'],
      ['pe.vitals.temperature', '37.8', '体温37.8℃'],
      ['personal.smoking', '无', '否认吸烟'],
      ['pe.genital.genitalia', '包皮过长', '外生殖器包皮过长'],
      ['ros.resp.fever.status', 'asked_negative', '否认发热'],
    ];
    const content = {suggestions: pairs.map(([path, text, quote]) => ({path, text, evidence:[{source:'note', quote}]})), issues:[], questions:[]};
    const validated = validateAiResponse(content, request);
    expect(validated.suggestions.map((entry) => entry.kind)).toEqual(['text', 'text', 'number', 'choice', 'choice']);
    expect(validated.dropped[0]?.path).toBe('ros.resp.fever.status');
    const result = createAiResult(validated, request, 'deepseek-flash');
    expect(() => adoptAiSuggestions(record, request, result, [], true)).toThrow(/勾选/);
    expect(() => adoptAiSuggestions(record, request, result, [0, 2], false)).toThrow(/已有/);
    const applied = adoptAiSuggestions(record, request, result, [0, 2, 3, 4], true);
    expect(applied.pe.vitals.temperature).toBe('37.8');
    expect(applied.personal.smoking).toBe('无');
    expect(SCHEMA.peChecked(applied, 'genital', 'genitalia')).toBe(true);
    expect(applied.hpi.negativeDiscriminating).toBe('');
    const undo = createAiAdoptionUndo(record, applied, [0, 2, 3, 4].map((i) => validated.suggestions[i]!.path));
    applied.hpi.symptoms = '之后手改的症状'; RECORD_CORE.markFieldManual(applied, 'hpi.symptoms');
    applied.hpi.onset = '之后补录的起病';
    const restored = undoAiAdoption(applied, undo);
    expect([restored.restored, restored.kept]).toEqual([3, 1]);
    expect(restored.record.hpi.symptoms).toBe('之后手改的症状');
    expect(restored.record.hpi.onset).toBe('之后补录的起病');
    expect(restored.record.pe.vitals.temperature).toBe(record.pe.vitals.temperature);
    expect(restored.record.personal.smoking).toBe(record.personal.smoking);
    expect(SCHEMA.peChecked(restored.record, 'genital', 'genitalia')).toBe(false);
    const replacement = adoptAiSuggestions(record, request, result, [0], true);
    const oldState = RECORD_CORE.fieldState(record, 'hpi.symptoms');
    const replacementUndo = createAiAdoptionUndo(record, replacement, ['hpi.symptoms']);
    const rolledBack = undoAiAdoption(replacement, replacementUndo).record;
    expect(rolledBack.hpi.symptoms).toBe('旧症状');
    expect(RECORD_CORE.fieldState(rolledBack, 'hpi.symptoms')).toEqual(oldState);
    expect(() => undoAiAdoption({ ...applied, id: 'other' }, undo)).toThrow(/另一份/);
  });
});
