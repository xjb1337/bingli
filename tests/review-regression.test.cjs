/* ===========================================================================
 * 评审回归测试（node:test）
 *
 * 每个用例对应独立评审发现的一个缺陷，防止修复被无意改回。
 * 编号与评审报告一致（B1/H1/M1/M8）。
 *
 * 曾有一批 H2/H3/H4 用例测的是评分模块（checker.js）的计分，
 * 评分自查功能移除后，这些用例连同被删的模块一起下线。
 *
 * 这些测试的价值在于：它们描述的是「曾经错过一次」的具体行为，
 * 而不是泛泛的冒烟检查。改回去必须让测试失败。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR, HINTS } = bootGlobals();

function mk(over) {
  const r = SCHEMA.emptyRecord();
  r.basic.name = '测试';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '腹痛';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '1天前出现腹痛';
  return Object.assign(r, over || {});
}

/* ======================= B1：重点查体不得自相矛盾 ======================= */

test('B1 父项被重点查体引用时，若已被子项接管则不输出（避免"全腹无压痛"与"右下腹压痛"并存）', () => {
  const r = mk({ basic: { ...SCHEMA.emptyRecord().basic, department: 'surgery', name: 'x', gender: '男', age: '50' } });
  r.pe.abdomen = { abdPalpSuperficial: '右下腹浅触诊压痛' };
  r.focusPE = { keys: ['abdomen.abdPalpation', 'abdomen.abdPalpSuperficial'], note: '腹部为重点' };

  const pe = GENERATOR.buildPE(r);
  assert.ok(!pe.includes('全腹无压痛'), '不得输出父项的默认正常描述');
  assert.ok(pe.includes('右下腹浅触诊压痛'), '应输出用户实际填写的阳性体征');
});

test('B1 重点查体只列用户真正填过的项，不把默认值当成查过的', () => {
  const r = mk();
  r.focusPE = { keys: ['abdomen.abdPalpation'], note: '腹部' };
  const pe = GENERATOR.buildPE(r);
  const focusLine = (pe.match(/^重点查体：.*$/m) || [''])[0];
  // 主查体段落仍会输出默认描述（它描述的是「本例的查体结果」，属正常行为）；
  // 但「重点查体」是用户声明要重点看的内容，没填就不该凭空列出来。
  assert.ok(!focusLine.includes('全腹无压痛'),
    `未填写的项不应以默认文案出现在重点查体里，实际：${focusLine}`);
  assert.ok(focusLine.includes('腹部'), 'note 应仍然保留');
});

/* ======================= H1：真阳性体征不得被漏掉 ======================= */

test('H1 "足背动脉搏动未触及"是阳性体征，必须进摘要', () => {
  const r = mk({ basic: { ...SCHEMA.emptyRecord().basic, name: 'x', gender: '男', age: '60', chiefComplaint: '下肢疼痛' } });
  r.hpi.onset = '下肢疼痛1月';
  r.pe.spine = { dorsalisPedis: '单侧足背动脉搏动未触及' };

  const summary = GENERATOR.draftSummary(r);
  assert.ok(summary.includes('未触及'), `摘要应写出该阳性体征，实际：${summary}`);
  assert.ok(!summary.includes('查体未见明显阳性体征'), '有阳性体征时不得写"未见阳性体征"');
});

test('H1 正常描述"营养良好"不得被当成阳性体征写进摘要', () => {
  const r = mk();
  r.pe.general = { nutrition: '营养良好' };
  const summary = GENERATOR.draftSummary(r);
  assert.ok(!summary.includes('营养良好'), `摘要不应把正常描述当阳性，实际：${summary}`);
});

test('H1 阴性描述"未闻及病理性杂音"仍应被排除', () => {
  const r = mk();
  r.pe.chest = { heartAuscultation: '各瓣膜听诊区未闻及病理性杂音' };
  const summary = GENERATOR.draftSummary(r);
  assert.ok(!summary.includes('未闻及病理性杂音'), '阴性描述不应进摘要阳性段落');
});

/* ======================= M1：尾部标点不得引发假提示 ======================= */

test('M1 旧默认文案带结尾句号时不得触发诊断提示', () => {
  const base = () => {
    const r = mk();
    r.basic.chiefComplaint = '转移性右下腹痛';
    r.hpi.onset = '1天前转移性右下腹痛';
    r.pe.vitals = { temperature: '38.5' };
    return r;
  };
  const withDot = base();
  withDot.pe.abdomen = { abdPalpation: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及。' };
  const withoutDot = base();
  withoutDot.pe.abdomen = { abdPalpation: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及' };

  const a = HINTS.analyze(withDot).map(x => x.name);
  const b = HINTS.analyze(withoutDot).map(x => x.name);
  assert.deepEqual(a, b, `带不带句号结论应一致：带句号=${a.join(',')} 不带=${b.join(',')}`);
  assert.ok(!a.includes('急性阑尾炎'), '正常的腹部查体不应触发阑尾炎提示');
});

/* ======================= M8：自查提示不得混入病历正文 ======================= */

test('M8 首次病程录正文不得包含任何自查提示文字', () => {
  const r = mk();
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  r.basic.chiefComplaint = '咳嗽';
  r.soap.a.diff = [{ diagnosis: '股骨颈骨折', against: '无外伤史' }];

  const out = GENERATOR.buildFirstCourseRecord(r);
  ['自查', '不写入病历', '请确认是否保留'].forEach(k => {
    assert.ok(!out.includes(k), `正文不应包含「${k}」，用户会整段复制进病历`);
  });

  const notes = GENERATOR.firstCourseSelfCheck(r);
  assert.ok(notes.length > 0, '无关鉴别应通过独立接口给出提醒');
});

/* ======================= 附加：H1 回归（穷举） ======================= */

/**
 * 这条测试是上一轮评审发现的回归防线：
 * 曾经用「异常关键词白名单」判定阳性，结果 41/41 个内置异常选项全部漏报。
 * 现在改为「默认阳性、只排除明确阴性」，这里穷举 schema 里所有选项验证。
 *
 * 注意两点（都是评审踩过的坑）：
 *   1) 必须遍历专科查体（PE_SPECIAL）。产科内置项「未闻及胎心」是阳性体征，
 *      只测 PE_COMMON 会把它漏掉。
 *   2) 不能把「未闻及」当成"期望阴性"的话头——「未闻及胎心」是阳性，
 *      「未闻及病理性杂音」才是阴性。NEG_START 里不列「未闻及」。
 */
test('H1 回归：schema 里所有非默认异常选项都应被识别为阳性体征（含专科）', () => {
  const NOT_A_FINDING = new Set([
    '未查', '未查见',
    '营养良好', '营养中等', '营养一般', '查体合作',
    '神志清楚', '神志清楚，精神可', '神志清楚，精神一般',
    '自动体位', '面容自然', '皮肤弹性良好', '毛发分布均匀',
    '颈软，无抵抗', '气管居中', '腹平软，未见腹壁静脉曲张', '肛门指检未触及异常',
    '前囟平软', '手术切口愈合良好'
  ]);
  const POSITIVE_DESPITE_NEG = new Set(['单侧足背动脉搏动未触及', '未闻及胎心']);
  const MIXED = new Set(['上腹部压痛，无反跳痛']);
  const NEG_START = /^(无|未见|未触及|未引出|未扪及|否认|没有|正常|阴性|不)/;

  const missed = [];
  const check = (groupKey, it, dept) => {
    (it.options || []).forEach(o => {
      if (o === it.default || o === it.normal || (it.normalVariants || []).includes(o)) return;
      const positive = POSITIVE_DESPITE_NEG.has(o) || MIXED.has(o) ||
        (!NOT_A_FINDING.has(o) && !NEG_START.test(o));
      if (!positive) return;

      const r = mk();
      if (dept) r.basic.department = dept;
      r.pe[groupKey] = { [it.key]: o };
      if (!GENERATOR.abnormalPE(r).length) missed.push(`${groupKey}.${it.key} = ${o}`);
    });
  };

  SCHEMA.PE_COMMON.forEach(g => {
    g.items.forEach(it => check(g.key, it, (it.depts && it.depts[0]) || 'general'));
  });
  Object.keys(SCHEMA.PE_SPECIAL).forEach(spKey => {
    const sp = SCHEMA.PE_SPECIAL[spKey];
    (sp.items || []).forEach(it => check('special_' + spKey, it, spKey));
  });

  assert.deepEqual(missed.slice(0, 5), [],
    `有 ${missed.length} 个异常选项未被识别为阳性体征（会导致摘要漏报）`);
});

test('院内简短正常所见不补写额外体征、不产生阳性提示', () => {
  const r = mk();
  SCHEMA.PE_COMMON.forEach(group => group.items.forEach(item => {
    (item.normalVariants || []).forEach(value => {
      r.pe = { [group.key]: { [item.key]: value } };
      assert.equal(SCHEMA.peValueIsDefault(item, value + '。'), true);
      assert.deepEqual(GENERATOR.abnormalPE(r), [], `${group.key}.${item.key}: ${value}`);
      assert.deepEqual(HINTS.analyze(r), [], `正常所见不得产生诊断提示: ${value}`);
      assert.ok(GENERATOR.generate(r).text.includes(value), '正文仍保留简短原文');
    });
  }));
});

test('H1 回归：阴性/正常描述不得被识别为阳性体征', () => {
  const cases = [
    ['abdomen', 'abdPalpation', '肝脾肋下未触及'],
    ['abdomen', 'abdPercussion', '肝区及双肾区无叩击痛'],
    ['head', 'ent', '咽无充血'],
    ['general', 'nutrition', '营养良好'],
    ['chest', 'lungAuscultation', '双肺呼吸音清'],
    ['chest', 'heartAuscultation', '各瓣膜听诊区未闻及病理性杂音'],
    ['general', 'conscious', '神志清楚，精神一般'],
    ['genital', 'anus', '肛门指检未触及异常']
  ];
  const bad = [];
  cases.forEach(([g, k, v]) => {
    const r = mk();
    r.pe[g] = { [k]: v };
    const found = GENERATOR.abnormalPE(r);
    if (found.length) bad.push(`${g}.${k} = ${v} → ${found.map(x => x.text).join('|')}`);
  });
  assert.deepEqual(bad, [], '这些阴性/正常描述被误判成阳性体征');
});

/* ======================= 标点容错 ======================= */

test('M1 扩展：查体值尾部标点不得改变诊断提示集合', () => {
  const base = () => {
    const r = mk();
    r.basic.chiefComplaint = '转移性右下腹痛';
    r.hpi.onset = '1天前转移性右下腹痛';
    r.pe.vitals = { temperature: '38.5' };
    return r;
  };
  const plain = base();
  plain.pe.abdomen = { abdPalpation: '右下腹压痛、反跳痛' };
  const dotted = base();
  dotted.pe.abdomen = { abdPalpation: '右下腹压痛、反跳痛。' };

  const a = HINTS.analyze(plain).map(x => x.name).sort();
  const b = HINTS.analyze(dotted).map(x => x.name).sort();
  assert.deepEqual(a, b, '带不带结尾句号，提示结论应当一致');
});

test('low-1：只有标点的查体值不算阳性', () => {
  const r = mk();
  r.basic.chiefComplaint = '转移性右下腹痛';
  r.hpi.onset = '1天前转移性右下腹痛';
  r.pe.vitals = { temperature: '38.5' };
  r.pe.abdomen = { abdPalpation: '。' };
  assert.ok(!HINTS.analyze(r).map(x => x.name).includes('急性阑尾炎'),
    '只有一个句号不应触发阑尾炎提示');
});
