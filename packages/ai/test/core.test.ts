import { describe, expect, it } from 'vitest';
import { RECORD_CORE, SCHEMA, type DabingliRecord } from '@dabingli/domain';
import {
  adoptAiSuggestions,
  confirmAiField,
  createAiResult,
  listAdoptedAiFields,
  prepareAiRequest,
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
    expect(() => validateAiResponse(response('张三', '患者诉咳嗽3天', 'basic.name'), request)).toThrow(/越界/);
    expect(() => validateAiResponse(response('无发热', '无发热'), request)).toThrow(/无法核实/);
    expect(() => validateAiResponse(response('咳嗽5天', '咳嗽3天'), request)).toThrow(/数字/);
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

  it('rejects out-of-scope fields, invalid enums, and out-of-range vitals', () => {
    const request = recognizeRequest(makeRecord());
    expect(validateAiResponse(recognized('basic.gender', '男'), request).suggestions[0]?.text).toBe('男');
    expect(() => validateAiResponse(recognized('basic.gender', '男性'), request)).toThrow(/允许值/);
    expect(() => validateAiResponse(recognized('diagnosis.confirmed.0', '肺炎'), request)).toThrow(/越界/);
    expect(() => validateAiResponse(recognized('basic.name', '张三'), request)).toThrow(/越界/);
    expect(() => validateAiResponse(recognized('pe.vitals.temperature', '99'), request)).toThrow(/可信范围/);
  });

  it('requires verified note evidence and only accepts image evidence with an image', () => {
    const request = recognizeRequest(makeRecord());
    expect(() => validateAiResponse(recognized(
      'hpi.symptoms',
      '咳嗽3天',
      [{ source: 'note', quote: '不存在的原文' }],
    ), request)).toThrow(/无法核实/);
    const textOnly = recognizeRequest(makeRecord(), '患者诉咳嗽3天', null);
    expect(() => validateAiResponse(recognized(
      'hpi.symptoms',
      '咳嗽3天',
      [{ source: 'image', quote: '图片' }],
    ), textOnly)).toThrow(/图片依据/);
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
