/* PR5 病历质量引擎回归测试。
 *
 * 覆盖现病史结构化、文档 IR、ROS/查体事实状态、生命体征单一来源、
 * typed diagnostics、模板核对状态和 HINTS 只读边界。
 * 所有患者资料均为合成数据。
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, CORE, TEMPLATES, DEPTH, DOCUMENT_IR, GENERATOR, HINTS } = bootGlobals();
const QUALITY = globalThis.DIAGNOSTICS;

function baseRecord() {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, {
    name: '合成测试患者',
    gender: '男',
    age: '45',
    admitDate: '2026-10-01',
    recordDate: '2026-10-01',
    chiefComplaint: '咳嗽3天',
    chiefComplaintDuration: '3',
    chiefComplaintDurationUnit: '天'
  });
  r.hpi.symptoms = '咳嗽3天';
  r.diagnosis.confirmed = ['急性支气管炎'];
  return r;
}

function diagnosticsWith(r, code) {
  return GENERATOR.validateStructured(r).filter(item => item.code === code);
}

function assertTyped(list) {
  QUALITY.assertValid(list);
  list.forEach(item => {
    assert.ok(item.code, '每条提醒都应有 code');
    assert.ok(['error', 'warning', 'info'].includes(item.severity), 'severity 必须在协议内');
    assert.ok(item.path, '每条提醒都应有主路径');
    assert.ok(item.paths.includes(item.path), 'paths 必须包含主路径');
    assert.ok(item.message, '每条提醒都应有 message');
  });
}

test('PR5-01 现病史分别保存并渲染诱因、加重、缓解和阴性鉴别病史', () => {
  const blank = SCHEMA.emptyRecord().hpi;
  ['cause', 'aggravating', 'relief', 'negativePertinent'].forEach(key => {
    assert.equal(blank[key], '', `${key} 必须是可省略、默认为空的字段`);
  });

  const r = baseRecord();
  Object.assign(r.hpi, {
    onset: '3天前出现发热',
    cause: '受凉后',
    symptoms: '发热、咳嗽',
    aggravating: '夜间加重',
    relief: '饮水后缓解',
    negativePertinent: '无胸痛、咯血',
    negativeDiscriminating: ''
  });

  const text = GENERATOR.buildHPI(r);
  assert.match(text, /受凉后起病/);
  assert.match(text, /夜间加重/);
  assert.match(text, /饮水后缓解/);
  assert.match(text, /无胸痛、咯血/);
  assert.ok(text.indexOf('受凉后起病') < text.indexOf('夜间加重'));
  assert.ok(text.indexOf('夜间加重') < text.indexOf('饮水后缓解'));
  assert.ok(text.indexOf('饮水后缓解') < text.indexOf('无胸痛、咯血'));

  const section = GENERATOR.buildDocumentIR(r, 'record').sections.find(item => item.title === '现病史');
  const paths = section.facts.map(fact => fact.path);
  ['hpi.cause', 'hpi.aggravating', 'hpi.relief', 'hpi.negativePertinent'].forEach(path => {
    assert.ok(paths.includes(path), `文档 IR 应保留字段来源 ${path}`);
  });
  const negative = section.facts.find(fact => fact.path === 'hpi.negativePertinent');
  assert.equal(negative.polarity, 'negative');
  assert.equal(DEPTH.check(r).some(item => item.code === 'DEPTH_NEGATIVE_MISSING'), false,
    '新字段 negativePertinent 应与旧阴性鉴别字段同等抑制漏问提醒');
});

test('PR5-02 裸时间残句不会进入现病史，并给出可定位提醒', () => {
  const r = baseRecord();
  r.hpi.onset = '3天前';
  r.hpi.symptoms = '';

  assert.equal(GENERATOR.buildHPI(r), '');
  assert.doesNotMatch(GENERATOR.generate(r).sections['现病史'], /3天前/);
  assert.deepEqual(DOCUMENT_IR.assembleClinicalNarrative(['3天前']), []);
  assert.deepEqual(DOCUMENT_IR.assembleClinicalNarrative(['3天前；发热']), ['发热']);
  assert.equal(DOCUMENT_IR.isBareTimeFragment('3天前'), true);

  const hits = diagnosticsWith(r, 'HPI_BARE_TIME_FRAGMENT');
  assert.equal(hits.length, 1);
  assertTyped(hits);
  assert.equal(hits[0].severity, 'warning');
  assert.equal(hits[0].path, 'hpi.onset');
  assert.deepEqual(hits[0].evidence.map(item => item.path), ['hpi.onset']);
});

test('PR5-03 否定范围歧义会被拆开并提示，普通阴性清单保持原样', () => {
  const r = baseRecord();
  r.hpi.symptoms = '无发热、咳嗽加重';
  r.hpi.cause = '';

  assert.equal(GENERATOR.buildHPI(r), '患者无发热；咳嗽加重。');
  assert.equal(DOCUMENT_IR.normalizeNegationScope('无咯血、盗汗、消瘦'), '无咯血、盗汗、消瘦');

  const hits = diagnosticsWith(r, 'HPI_NEGATION_SCOPE');
  assert.equal(hits.length, 1);
  assertTyped(hits);
  assert.equal(hits[0].path, 'hpi.symptoms');
  assert.match(hits[0].message, /无发热；咳嗽加重/);
});

test('PR5-04 跨栏重复片段只渲染一次，同栏重复保留并提示，正负事实不被误去重', () => {
  const cross = baseRecord();
  cross.hpi.symptoms = '发热';
  cross.hpi.accompanying = '发热';
  const crossText = GENERATOR.buildHPI(cross);
  assert.equal((crossText.match(/发热/g) || []).length, 1);
  const crossHits = diagnosticsWith(cross, 'HPI_DUPLICATE_FRAGMENT');
  assert.equal(crossHits.length, 1);
  assertTyped(crossHits);
  assert.deepEqual(crossHits[0].evidence.map(item => item.path),
    ['hpi.symptoms', 'hpi.accompanying']);

  const same = baseRecord();
  same.hpi.symptoms = '发热。发热。';
  assert.equal((GENERATOR.buildHPI(same).match(/发热/g) || []).length, 2);
  const sameHits = diagnosticsWith(same, 'HISTORY_DUPLICATE');
  assert.equal(sameHits.length, 1);
  assertTyped(sameHits);

  const opposite = baseRecord();
  opposite.hpi.symptoms = '无胸痛';
  opposite.hpi.negativeDiscriminating = '胸痛';
  assert.match(GENERATOR.buildHPI(opposite), /无胸痛，胸痛/);
});

test('PR5-05 ROS 未问不生成“无”，明确阴性才生成否定句', () => {
  const empty = baseRecord();
  assert.equal(GENERATOR.buildROS(empty), '');

  const notAsked = baseRecord();
  notAsked.ros.resp = { cough: { status: 'not_asked' } };
  assert.equal(GENERATOR.buildROS(notAsked), '');

  const negative = baseRecord();
  negative.ros.resp = { cough: { status: 'asked_negative' } };
  assert.equal(GENERATOR.buildROS(negative), '呼吸系统：无咳嗽。');

  const positive = baseRecord();
  positive.ros.resp = { cough: { status: 'asked_positive', detail: '咳嗽3天' } };
  assert.match(GENERATOR.buildROS(positive), /咳嗽3天/);

  const conflict = baseRecord();
  conflict.ros.resp = { cough: { status: 'not_asked', checked: true } };
  assert.doesNotMatch(GENERATOR.buildROS(conflict), /无咳嗽/);
  const hits = diagnosticsWith(conflict, 'ROS_FACT_STATE_CONFLICT');
  assert.equal(hits.length, 0);
  assert.doesNotMatch(GENERATOR.generate(conflict).text, /系统回顾/);
});

test('PR5-06 未勾查体不生成正常描述，显式阳性无详情不回填正常值', () => {
  const group = SCHEMA.PE_COMMON.find(item => item.key === 'general');
  const item = group.items.find(entry => entry.key === 'development');
  const normal = SCHEMA.peNormalText(item);
  assert.ok(normal);

  const unchecked = baseRecord();
  assert.ok(!GENERATOR.buildPE(unchecked).includes(normal), '未勾项不得生成正常描述');

  const checked = baseRecord();
  SCHEMA.setPeChecked(checked, group.key, item.key, true);
  assert.ok(GENERATOR.buildPE(checked).includes(normal), '明确标阴性且无文字时才补规范正常描述');

  const positive = baseRecord();
  SCHEMA.setPeChecked(positive, group.key, item.key, true);
  SCHEMA.setPeFactState(positive, group.key, item.key, 'asked_positive');
  assert.ok(!GENERATOR.buildPE(positive).includes(normal));
  const missing = diagnosticsWith(positive, 'PE_POSITIVE_DETAIL_MISSING');
  assert.equal(missing.length, 1);
  assertTyped(missing);
  assert.equal(missing[0].path, `pe.${group.key}.${item.key}`);

  const notAsked = baseRecord();
  notAsked.pe[group.key][item.key] = '合成异常所见';
  SCHEMA.setPeChecked(notAsked, group.key, item.key, true);
  SCHEMA.setPeFactState(notAsked, group.key, item.key, 'not_asked');
  assert.ok(!GENERATOR.buildPE(notAsked).includes('合成异常所见'));
  const conflict = diagnosticsWith(notAsked, 'PE_FACT_STATE_CONFLICT');
  assert.equal(conflict.length, 1);
  assertTyped(conflict);
  assert.equal(conflict[0].path, `peFactStates.${group.key}.${item.key}`);
});

test('PR5-07 生命体征在正文、查体、摘要和 SOAP 使用同一数值', () => {
  const r = baseRecord();
  Object.assign(r.pe.vitals, {
    temperature: '38.5',
    pulse: '110',
    respiration: '22',
    sbp: '150',
    dbp: '95'
  });

  const outputs = [
    GENERATOR.buildVitals(r),
    GENERATOR.buildPE(r),
    GENERATOR.buildSummary(r),
    GENERATOR.draftObjectivePE(r)
  ];
  ['T 38.5℃', 'P 110次/分', 'R 22次/分', 'BP 150/95mmHg'].forEach(value => {
    outputs.forEach(text => assert.ok(text.includes(value), `四个出口都应包含 ${value}`));
  });
  assert.deepEqual(GENERATOR.vitalConsistencyDiagnostics(r), []);

  r.summary = '患者体温 39.0℃。';
  r.soap.o.pe = '血压 130/80mmHg。';
  const mismatch = diagnosticsWith(r, 'VITAL_CROSS_DOCUMENT_MISMATCH');
  assert.equal(mismatch.length, 2);
  assertTyped(mismatch);
  assert.deepEqual(mismatch.map(item => item.path).sort(), ['soap.o.pe', 'summary']);
  assert.ok(mismatch.every(item => item.evidence.some(evidence => evidence.path.startsWith('pe.vitals.'))));
});

test('PR5-08 三种文书都从文档 IR 输出且章节顺序稳定', () => {
  const r = baseRecord();
  const bundle = GENERATOR.buildDocumentBundle(r);
  assert.deepEqual(Object.keys(bundle).sort(), ['discharge', 'firstCourse', 'record']);

  assert.equal(bundle.record.kind, 'record');
  assert.equal(bundle.record.title, '入院记录');
  assert.equal(bundle.firstCourse.kind, 'firstCourse');
  assert.equal(bundle.firstCourse.title, '首次病程录');
  assert.equal(bundle.discharge.kind, 'discharge');
  assert.equal(bundle.discharge.title, '出院记录');

  assert.equal(bundle.record.text, GENERATOR.generate(r).text);
  assert.equal(bundle.firstCourse.text, GENERATOR.buildFirstCourseRecord(r));
  assert.equal(bundle.discharge.text, GENERATOR.buildDischargeRecord(r));
  assert.deepEqual(bundle.record.sections.map(item => item.title), [
    '一般项目', '主诉', '现病史', '既往史', '个人史', '婚育史', '家族史',
    '体格检查（一）', '体格检查（二）：补充及专科情况', '实验室检查', '特殊检查', '初步诊断'
  ]);
  assert.deepEqual(bundle.firstCourse.sections.map(item => item.title), [
    '一、病历特点（S）', '二、客观记录（O）', '三、诊断依据（A）', '四、鉴别诊断（A）', '五、诊疗计划（P）'
  ]);
  assert.deepEqual(bundle.discharge.sections.map(item => item.title), [
    '一、一般情况', '二、入院情况', '三、诊疗经过', '四、出院情况', '五、出院诊断', '六、出院医嘱'
  ]);
});

test('PR5-09 所有质量、深度和首次病程自查提醒都使用 typed diagnostics', () => {
  const quality = baseRecord();
  quality.hpi.onset = '3天前';
  quality.hpi.symptoms = '无发热、咳嗽加重';
  quality.hpi.accompanying = '无发热、咳嗽加重';

  const soap = baseRecord();
  soap.soap.a.diff = [{ diagnosis: '合成不相关病名', basis: '' }];
  soap.soap.a.diffNote = '';

  [GENERATOR.validateStructured(quality), DEPTH.check(quality),
    GENERATOR.firstCourseSelfCheckDiagnostics(soap)].forEach(assertTyped);

  assert.throws(() => QUALITY.create({ code: 'NO_PATH', severity: 'warning', message: 'x' }),
    /缺少 path/);
  assert.throws(() => QUALITY.create({ code: 'NO_MESSAGE', severity: 'warning', path: 'hpi' }),
    /缺少 message/);
});

test('PR5-10 每条深度自查 code 都有可触发用例、证据路径和级别映射', async t => {
  const cases = [
    ['DEPTH_SYMPTOM_QUANTIFICATION', () => baseRecord()],
    ['DEPTH_NEGATIVE_MISSING', () => baseRecord()],
    ['DEPTH_CHRONIC_MEDS', () => {
      const r = baseRecord(); r.pmh.diseaseChecks['高血压'] = true; return r;
    }],
    ['DEPTH_CHRONIC_CONTROL', () => {
      const r = baseRecord();
      r.pmh.diseaseChecks['高血压'] = true;
      r.pmh.longTermMeds = '口服氨氯地平';
      return r;
    }],
    ['DEPTH_SURGERY_DETAIL', () => {
      const r = baseRecord(); r.pmh.surgery = '阑尾切除术'; return r;
    }],
    ['DEPTH_ANTITHROMBOTIC', () => {
      const r = baseRecord(); r.pmh.diseaseChecks['冠心病'] = true; return r;
    }],
    ['DEPTH_DURATION_MISMATCH', () => {
      const r = baseRecord(); r.hpi.onset = '10天前出现咳嗽'; return r;
    }],
    ['DEPTH_ONSET_TRACE', () => {
      const r = baseRecord();
      r.hpi.onset = '3天前咳嗽';
      r.hpi.symptoms = '3个月前曾有类似症状';
      return r;
    }],
    ['DEPTH_AMBIGUOUS_DATE', () => {
      const r = baseRecord(); r.hpi.onset = '14日出现咳嗽'; return r;
    }],
    ['DEPTH_AUX_HOSPITAL', () => {
      const r = baseRecord();
      r.auxiliary.items = [{ name: '血常规', result: '正常', hospital: '' }];
      return r;
    }],
    ['DEPTH_AUX_GRADE', () => {
      const r = baseRecord();
      r.auxiliary.items = [{ name: '乳腺超声', result: '异常', hospital: '合成医院' }];
      return r;
    }],
    ['DEPTH_MENSTRUAL', () => {
      const r = baseRecord();
      r.basic.gender = '女';
      r.basic.age = '31';
      r.basic.chiefComplaint = '发现右乳肿块';
      return r;
    }],
    ['DEPTH_PEDIATRIC_PERSONAL', () => {
      const r = baseRecord(); r.basic.age = '3'; return r;
    }],
    ['DEPTH_ALLERGY_MISSED', () => {
      const r = baseRecord(); r.pmh.health = '良好'; return r;
    }],
    ['DEPTH_INFECTION_MISSED', () => {
      const r = baseRecord();
      r.pmh.health = '良好';
      r.pmh.allergy = '无药物过敏史';
      return r;
    }],
    ['DEPTH_INTERNAL', () => new Proxy({}, {
      get(_target, property) {
        if (property === 'hpi') throw new Error('合成自查异常');
        return undefined;
      }
    })]
  ];

  assert.deepEqual(cases.map(item => item[0]).sort(), DEPTH.DIAGNOSTIC_CODES.slice().sort());
  const severityByLevel = { high: 'error', mid: 'warning', low: 'info' };
  for (const [code, makeRecord] of cases) {
    await t.test(code, () => {
      const list = DEPTH.check(makeRecord());
      const hit = list.find(item => item.code === code);
      assert.ok(hit, `未触发 ${code}`);
      assertTyped([hit]);
      assert.equal(hit.severity, severityByLevel[hit.level]);
      assert.ok(hit.path);
      assert.ok(hit.evidence.length > 0, '深度自查提醒必须带证据位置');
      assert.ok(hit.evidence.every(item => item.path), '每条证据必须有字段路径');
    });
  }
});

test('PR5-11 自查与文书过期提醒也带 code、severity 和精确路径', () => {
  const diff = baseRecord();
  diff.soap.a.diff = [{ diagnosis: '合成不相关病名', basis: '' }];
  diff.soap.a.diffNote = '';
  const unrelated = GENERATOR.firstCourseSelfCheckDiagnostics(diff);
  assert.equal(unrelated.length, 1);
  assertTyped(unrelated);
  assert.equal(unrelated[0].code, 'SOAP_DIFF_UNRELATED');
  assert.equal(unrelated[0].path, 'soap.a.diff');

  const summary = baseRecord();
  summary.summary = GENERATOR.draftSummary(summary);
  CORE.markDocumentGenerated(summary, 'summary');
  summary.hpi.symptoms = '咳嗽5天';
  const staleSummary = diagnosticsWith(summary, 'DOC_STALE_SUMMARY');
  assert.equal(staleSummary.length, 1);
  assertTyped(staleSummary);
  assert.equal(staleSummary[0].path, 'summary');

  const soap = baseRecord();
  soap.soap.o.pe = 'T 36.5℃。';
  CORE.markDocumentGenerated(soap, 'firstCourse', 'oPe');
  soap.pe.vitals.temperature = '38.5';
  const staleSoap = diagnosticsWith(soap, 'DOC_STALE_SOAP');
  assert.equal(staleSoap.length, 1);
  assertTyped(staleSoap);
  assert.equal(staleSoap[0].path, 'soap.o.pe');

  const discharge = baseRecord();
  discharge.discharge.admitCondition = '入院情况：合成内容。';
  CORE.markDocumentGenerated(discharge, 'discharge', 'admitCondition');
  discharge.hpi.symptoms = '咳嗽5天';
  const staleDischarge = diagnosticsWith(discharge, 'DOC_STALE_DISCHARGE');
  assert.equal(staleDischarge.length, 1);
  assertTyped(staleDischarge);
  assert.equal(staleDischarge[0].path, 'discharge.admitCondition');
});

test('PR5-12 所有模板默认待医院模板核对，同时保留原始来源说明', () => {
  const all = TEMPLATES.all();
  assert.equal(all.length, 57);
  all.forEach(template => {
    assert.equal(template.verified, false);
    assert.equal(template.verificationStatus, 'unverified');
    assert.equal(template.verificationLabel, '待医院模板核对');
    assert.ok(template.source && template.source.label);
    assert.equal(Object.prototype.hasOwnProperty.call(template.source, 'verified'), false,
      '核对状态不应混进来源对象');
  });

  const lung = TEMPLATES.get('lungNodule');
  assert.equal(lung.source.kind, 'hospital-example');
  assert.equal(lung.source.label, '院内范例');
  assert.match(lung.source.note, /肺结节病历截图/);
  assert.equal(lung.verified, false);
});

test('PR5-13 HINTS 只返回参考提示，不修改病历或诊断', () => {
  const r = SCHEMA.emptyRecord();
  const applied = TEMPLATES.apply(r, 'cap');
  assert.equal(applied.ok, true);
  const before = JSON.stringify(r);
  const diagnosisBefore = r.diagnosis.confirmed.slice();

  const suggestions = HINTS.analyze(r);
  assert.ok(suggestions.length > 0, '合成肺炎模板应能命中诊断提示');
  assert.equal(JSON.stringify(r), before, 'HINTS.analyze 不得修改病历');
  assert.deepEqual(r.diagnosis.confirmed, diagnosisBefore, 'HINTS 不得自动写入诊断');
});
