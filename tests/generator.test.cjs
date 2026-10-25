/* ===========================================================================
 * 病历生成逻辑测试（node:test）
 * 运行：node --test tests/
 *
 * 覆盖：各科室章节完整性、专科查体隔离、婚育史分支、
 *       系统回顾三模式、否定表述处理、质控规则、主诉单位处理
 * 全部使用合成数据。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR, HINTS } = bootGlobals();

// 章节顺序对齐用户提供的病历模板（2026-10）
const REQUIRED_SECTIONS = [
  '一般项目', '主诉', '现病史', '既往史', '系统回顾',
  '个人史', '婚姻史', '月经与生育史', '家庭史', '体格检查', '实验室检查',
  '摘要', '诊断依据', '初步诊断'
];

function makeRecord(deptKey, over) {
  const r = SCHEMA.emptyRecord();
  r.basic.department = deptKey;
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.marital = '已婚';
  r.basic.chiefComplaint = '咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '3天前出现咳嗽';
  r.hpi.generalCondition = '发病以来精神可';
  r.diagnosis.confirmed = ['待完善'];
  return Object.assign(r, over || {});
}

/* ======================= 科室完整性 ======================= */

test('每个科室都能生成全部14个章节', async t => {
  for (const dept of SCHEMA.DEPARTMENTS) {
    await t.test(dept.name, () => {
      const text = GENERATOR.generate(makeRecord(dept.key)).text;
      const missing = REQUIRED_SECTIONS.filter(s => !text.includes(`【${s}】`));
      assert.deepEqual(missing, [], `缺少章节：${missing.join(',')}`);
    });
  }
});

test('专科查体默认不写，勾选后才写进病历', async t => {
  // 勾选制的核心保证：见习时没做的专科检查，病历里一个字都不许出现。
  // 不勾就写，等于替学生编造没做过的查体——这是最不能容忍的一类错误。
  for (const dept of SCHEMA.DEPARTMENTS) {
    if (!dept.special || !dept.special.length) continue;
    await t.test(dept.name, () => {
      const blank = makeRecord(dept.key);
      const blankText = GENERATOR.buildPE(blank);
      for (const sp of dept.special) {
        assert.ok(!blankText.includes(SCHEMA.PE_SPECIAL[sp].name),
          `未勾选时不应出现 ${SCHEMA.PE_SPECIAL[sp].name}`);
      }

      // 只勾第一项 → 只有这一项的内容出现，且用的是它自己的正常描述
      const one = makeRecord(dept.key);
      for (const sp of dept.special) {
        const first = SCHEMA.PE_SPECIAL[sp].items[0];
        SCHEMA.setPeChecked(one, 'special_' + sp, first.key, true);
        const text = GENERATOR.buildPE(one);
        // 专科段是单独一行「××专科查体：…」。只在这一段里查串台，
        // 否则会和通用查体的默认描述撞车——例如心内科 cardioMurmur 的默认
        // 「各瓣膜听诊区未闻及病理性杂音」本来就包含在通用心脏听诊的默认里。
        const line = text.split('\n').find(l => l.startsWith(SCHEMA.PE_SPECIAL[sp].name)) || '';
        assert.ok(line, `勾选后应出现 ${SCHEMA.PE_SPECIAL[sp].name}`);
        assert.ok(line.includes(first.default),
          `勾了没填，应补该项目的正常描述：${first.default}`);
        // 同组其它项没勾，其描述不得出现在专科段。
        // 跳过两种「撞车」情形，它们不是串台：
        //   ①文案完全相同（同一条正常描述被两个项共用）；
        //   ②其它项的描述是 first 的子串——专科汇总项（renalExtra/hemExtra）
        //     本来就会把后面各项的正常描述压缩在一句话里，不是没勾的项混进来。
        SCHEMA.PE_SPECIAL[sp].items.slice(1).forEach(other => {
          if (!other.default || other.default === first.default) return;
          if (first.default.includes(other.default)) return;
          assert.ok(!line.includes(other.default),
            `未勾选的 ${other.key} 不应写进病历`);
        });
      }
    });
  }
});

test('勾了但没填具体所见 → 写该项正常描述；没勾 → 完全不写', () => {
  // 用腹部胆囊（教材要求、Student 最常漏的一项）做正反例
  const r = makeRecord('general');
  const blank = GENERATOR.buildPE(r);
  assert.ok(!blank.includes('Murphy征'), '没勾胆囊时不应凭空出现 Murphy 征');

  SCHEMA.setPeChecked(r, 'abdomen', 'gallbladderPalpation', true);
  const checked = GENERATOR.buildPE(r);
  assert.ok(checked.includes('胆囊未触及，Murphy征阴性'),
    `勾了没填应写正常描述，实际：${checked}`);
});

test('科室之间专科查体不互相串台', () => {
  // 勾选制后专科段默认不输出，所以要显式勾上才能验证「串台」
  const build = key => {
    const r = makeRecord(key);
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === key);
    (dept.special || []).forEach(sp => {
      SCHEMA.PE_SPECIAL[sp].items.forEach(it =>
        SCHEMA.setPeChecked(r, 'special_' + sp, it.key, true));
    });
    return GENERATOR.buildPE(r);
  };
  const resp = build('respiratory');
  const card = build('cardiology');
  const neuro = build('neurology');

  assert.ok(!resp.includes('心血管专科查体'));
  assert.ok(!card.includes('呼吸内科专科查体'));
  assert.ok(!neuro.includes('呼吸内科专科查体'));
  assert.ok(!resp.includes('神经内科专科查体'));
  assert.ok(neuro.includes('神经内科专科查体'));
});

test('外科专属查体项（乳房）只在普外科出现', () => {
  // 默认全不勾之后，不勾就什么都不写——所以这条要显式勾上再看科室限制。
  const surg = makeRecord('surgery');
  const gen = makeRecord('general');
  SCHEMA.setPeChecked(surg, 'chest', 'breast', true);
  SCHEMA.setPeChecked(gen, 'chest', 'breast', true);
  assert.ok(GENERATOR.buildPE(surg).includes('乳房'));
  assert.ok(!GENERATOR.buildPE(gen).includes('乳房'));
});

/* ======================= 婚育史分支 ======================= */

test('女性患者包含月经史与生育史', () => {
  const r = makeRecord('gynecology', {
    menstruation: {
      applicable: '有', age: '14', cycle: '28', duration: '5',
      quantity: '中等', lmp: '2026-09-28', dysmenorrhea: '无'
    },
    childbirth: { gravida: '2', para: '1', abortion: '1' }
  });
  r.basic.gender = '女';
  const t = GENERATOR.buildMarriageChildbirth(r);
  assert.match(t, /初潮14岁/);
  assert.match(t, /孕2产1/);
  assert.match(t, /末次月经2026-09-28/);
});

test('男性患者不出现月经史', () => {
  const r = makeRecord('general');
  r.basic.gender = '男';
  assert.doesNotMatch(GENERATOR.buildMarriageChildbirth(r), /初潮/);
});

test('未婚患者婚育史写"未婚"', () => {
  const r = makeRecord('general');
  r.marriage.status = '未婚';
  assert.match(GENERATOR.buildMarriageChildbirth(r), /^未婚/);
});

/* ======================= 系统回顾三模式 ======================= */

test('详细模式同时写出阳性和阴性症状', () => {
  // 三态：checked=阳性，negative=学生显式标了阴性，两者都没有=没问。
  // 「没问」绝不能当阴性写进病历——那是替病人编病史。
  const r = makeRecord('respiratory');
  r.ros.resp = { cough: { checked: true, detail: '干咳' }, hemoptysis: { negative: true } };
  const detail = GENERATOR.buildROS(r, 'detail');
  assert.match(detail, /咳嗽/);
  assert.match(detail, /无咯血/);
});

test('没问过的症状不写成阴性', () => {
  const r = makeRecord('respiratory');
  r.ros.resp = { cough: { checked: true } };
  const detail = GENERATOR.buildROS(r, 'detail');
  assert.match(detail, /咳嗽/);
  assert.doesNotMatch(detail, /无/);
  assert.equal(GENERATOR.buildROS(makeRecord('general'), 'detail'), '');
});

test('精简模式只写阳性', () => {
  const r = makeRecord('respiratory');
  r.ros.resp = { cough: { checked: true } };
  const brief = GENERATOR.buildROS(r, 'brief');
  assert.match(brief, /咳嗽/);
  assert.doesNotMatch(brief, /无咯血/);
});

test('全阴性时精简模式给统一话术', () => {
  // 「一条没问」和「问过、全是阴性」是两回事，话术也必须分开。
  const none = makeRecord('general');
  assert.equal(GENERATOR.buildROS(none, 'brief'), '');

  const allNeg = makeRecord('general');
  SCHEMA.ROS.forEach(sys => {
    allNeg.ros[sys.key] = {};
    sys.symptoms.forEach(sym => { allNeg.ros[sys.key][sym.key] = { negative: true }; });
  });
  assert.match(GENERATOR.buildROS(allNeg, 'brief'), /未见阳性症状/);
});

test('阳性症状与阴性列表不重复（避免"头痛；无头晕"式矛盾）', () => {
  const r = makeRecord('neurology');
  // 教材 8 系统后，「头部及五官」并入「神经精神系统」；
  // 同一系统内既有阳性又有阴性时，阴性列表不得把阳性症状再重复否定一遍。
  r.ros.nervous = { headache: { checked: true, detail: '偶有头晕' } };
  const t = GENERATOR.buildROS(r, 'detail');
  const line = t.split('\n').find(l => l.startsWith('神经精神系统'));
  assert.ok(line, '应有神经精神系统行');
  assert.doesNotMatch(line, /无[^；]*头晕/);
});

/* ======================= 否定表述与提示 ======================= */

test('否定表述不被计为阳性发现', () => {
  const r = makeRecord('respiratory');
  r.basic.chiefComplaint = '咳嗽';
  r.hpi.accompanying = '无咯血、无胸痛、无发热';
  r.ros.resp = { cough: { checked: true } };
  const findings = HINTS.extractFindings(r);
  assert.equal(findings.has('cc:咯血'), false);
  assert.equal(findings.has('cc:胸痛'), false);
  assert.equal(findings.has('cc:发热'), false);
});

test('健康人不产生任何诊断提示', () => {
  const r = makeRecord('general');
  r.basic.gender = '男';
  r.basic.age = '30';
  r.basic.chiefComplaint = '体检咨询';
  r.hpi.onset = '体检咨询';
  assert.deepEqual(HINTS.analyze(r).map(x => x.name), []);
});

test('典型心梗病历能提示急性冠脉综合征', () => {
  const r = makeRecord('cardiology');
  r.basic.gender = '男';
  r.basic.age = '62';
  r.basic.chiefComplaint = '胸闷胸痛';
  r.hpi.symptoms = '突发心前区压榨样疼痛，持续不缓解';
  r.ros.cardio = { chestPainCardio: { checked: true }, palpitation: { checked: true } };
  r.pe.chest = { heartAuscultation: '心音低钝' };
  r.personal.smoking = '有';
  const names = HINTS.analyze(r).map(x => x.name);
  assert.ok(names.includes('急性冠脉综合征'), `实际提示：${names.join(',')}`);
});

test('成人肺炎病历不误报小儿肺炎', () => {
  const r = makeRecord('respiratory');
  r.basic.age = '58';
  r.basic.chiefComplaint = '发热、咳嗽、咳黄痰';
  r.ros.general = { fever: { checked: true } };
  r.ros.resp = { cough: { checked: true }, sputum: { checked: true } };
  r.pe.chest = { lungAuscultation: '右下肺可闻及湿性啰音' };
  const names = HINTS.analyze(r).map(x => x.name);
  assert.ok(!names.includes('小儿肺炎'), `不应出现小儿肺炎：${names.join(',')}`);
});

/* ======================= 质控规则 ======================= */

test('主诉含诊断性词语时提示', () => {
  const r = makeRecord('general');
  r.basic.chiefComplaint = '急性阑尾炎';
  const w = GENERATOR.validate(r);
  assert.ok(w.some(x => /诊断性词语/.test(x)), w.join(' | '));
});

test('主诉过长时提示', () => {
  const r = makeRecord('general');
  r.basic.chiefComplaint = '反复咳嗽咳痰气促胸闷心悸头晕乏力纳差腹胀恶心呕吐20余年';
  assert.ok(GENERATOR.validate(r).some(x => /偏长/.test(x)));
});

test('主诉缺持续时间时提示', () => {
  const r = makeRecord('general');
  r.basic.chiefComplaintDuration = '';
  assert.ok(GENERATOR.validate(r).some(x => /缺少持续时间/.test(x)));
});

test('缺姓名性别年龄时分别提示', () => {
  const r = makeRecord('general');
  r.basic.name = '';
  r.basic.gender = '';
  r.basic.age = '';
  const w = GENERATOR.validate(r).join(' | ');
  assert.match(w, /缺少姓名/);
  assert.match(w, /缺少性别/);
  assert.match(w, /缺少年龄/);
});

/* ======================= 主诉单位处理 ======================= */

test('主诉时长拼接的边界情况', async t => {
  const cases = [
    { cc: '发热', d: '3', u: '天', expect: '发热3天。' },
    { cc: '发热', d: '3天', u: '天', expect: '发热3天。' },
    { cc: '咳嗽', d: '2', u: '周', expect: '咳嗽2周。' },
    { cc: '胸痛', d: '6', u: '小时', expect: '胸痛6小时。' },
    { cc: '头痛', d: '', u: '天', expect: '头痛。' }
  ];
  for (const c of cases) {
    await t.test(`${c.cc} + ${c.d}${c.u}`, () => {
      const r = makeRecord('general');
      r.basic.chiefComplaint = c.cc;
      r.basic.chiefComplaintDuration = c.d;
      r.basic.chiefComplaintDurationUnit = c.u;
      assert.equal(GENERATOR.buildChiefComplaint(r), c.expect);
    });
  }
});

test('主诉正文已含时长时不重复追加', () => {
  const r = makeRecord('obstetrics');
  r.basic.chiefComplaint = '停经34周，发现血压升高1周';
  r.basic.chiefComplaintDuration = '34';
  r.basic.chiefComplaintDurationUnit = '周';
  assert.equal(GENERATOR.buildChiefComplaint(r), '停经34周，发现血压升高1周。');
});

/* ======================= 儿科/成人主语 ======================= */

test('儿科现病史与摘要使用"患儿"', () => {
  const r = makeRecord('pediatrics');
  r.basic.age = '5';
  r.hpi.onset = '3天前出现发热';
  assert.ok(GENERATOR.buildHPI(r).startsWith('患儿'));
  assert.match(GENERATOR.draftSummary(r), /患儿/);
});

test('成人使用"患者"', () => {
  const r = makeRecord('general');
  r.basic.age = '45';
  r.hpi.onset = '3天前出现咳嗽';
  assert.ok(GENERATOR.buildHPI(r).startsWith('患者'));
});

/* ======================= 既往史 ======================= */

test('勾选疾病被列出', () => {
  const r = makeRecord('cardiology');
  r.pmh.diseaseChecks = { '高血压': true, '糖尿病': true };
  const t = GENERATOR.buildPMH(r);
  assert.match(t, /高血压/);
  assert.match(t, /糖尿病/);
});

test('手写疾病详情优先于勾选描述', () => {
  const r = makeRecord('cardiology');
  r.pmh.diseaseChecks = { '高血压': true };
  r.pmh.diseaseDetail = '高血压病史10年，口服缬沙坦';
  assert.match(GENERATOR.buildPMH(r), /口服缬沙坦/);
});

test('未勾选疾病时写占位符，不替学生编「否认」', () => {
  // 教材《诊断学》第10版 第六篇：病历必须客观真实，「避免任何臆断或虚构」；
  // 「所有表格项都应详细填写，无内容者画“/”或“—”」。
  // 学生没勾高血压，不代表他问过、更不代表病人否认——只能写占位符。
  const r = makeRecord('general');
  const t = GENERATOR.buildPMH(r);
  assert.doesNotMatch(t, /否认高血压/);
  assert.match(t, /疾病史：／/);
});

test('过敏史正确生成', () => {
  const r = makeRecord('general');
  r.pmh.allergy = '有';
  r.pmh.allergenChecks = { '青霉素': true };
  r.pmh.allergyReaction = '全身皮疹';
  const t = GENERATOR.buildPMH(r);
  assert.match(t, /青霉素/);
  assert.match(t, /全身皮疹/);
});

/* ======================= 摘要只写阳性 ======================= */

test('病历摘要不把阴性描述当阳性体征', () => {
  const r = makeRecord('pediatrics');
  r.basic.age = '3';
  r.pe.head = { ent: '耳廓无畸形，外耳道无分泌物；咽充血，双侧扁桃体Ⅰ度肿大' };
  const summary = GENERATOR.draftSummary(r);
  assert.match(summary, /咽充血/);
  assert.match(summary, /扁桃体/);
  assert.doesNotMatch(summary, /耳廓无畸形/);
});

/* ======================= 空数据健壮性 ======================= */

test('空病历可正常生成且不抛错', () => {
  const emptyRecord = SCHEMA.emptyRecord();
  assert.doesNotThrow(() => {
    const out = GENERATOR.generate(emptyRecord);
    assert.ok(out.text.length > 0);
    GENERATOR.generatePlain(emptyRecord);
    GENERATOR.draftSummary(emptyRecord);
    HINTS.analyze(emptyRecord);
  });
});

test('超长文本不导致生成失败', () => {
  const r = makeRecord('general');
  r.basic.chiefComplaint = '咳嗽'.repeat(300);
  r.hpi.onset = '很长的描述'.repeat(500);
  assert.doesNotThrow(() => GENERATOR.generate(r));
});

test('纯文本导出不含【】标题', () => {
  const plain = GENERATOR.generatePlain(makeRecord('digestive'));
  assert.doesNotMatch(plain, /【/);
  assert.match(plain, /初步诊断：/);
});
