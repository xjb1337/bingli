/* ===========================================================================
 * 评分表对齐回归测试（node:test）
 * 运行：node --test tests/*.test.cjs
 *
 * 覆盖本任务（t3）的四类改动：
 *   1. 腹部查体次序 视诊 → 听诊 → 叩诊 → 触诊（评分表第3页）
 *   2. 首次病程录 SOAP 四段 / 出院记录六项（评分表第5页、第6-7页）
 *   3. 现病史的缓解因素与鉴别意义阴性病史（评分表第6页）
 *   4. 查体项拆分后旧诊断提示规则不静默失效（P1-14）
 *
 * 全部使用合成数据，不依赖浏览器。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR, HINTS } = bootGlobals();

/** 一份填了基本信息的病历，避免各处重复 */
function makeRecord(deptKey) {
  const r = SCHEMA.emptyRecord();
  r.basic.department = deptKey || 'general';
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
  return r;
}

/** 只取某一组查体的那一行 */
/**
 * 把某一组查体全部勾上。
 *
 * 通用查体现在默认全不勾（没勾=本次没查=病历里一个字都不写），
 * 所以凡是要看查体正文的用例都得先显式勾上，否则拿到的是空行。
 */
function checkGroup(r, groupKey) {
  const group = SCHEMA.PE_COMMON.find(g => g.key === groupKey);
  if (group) group.items.forEach(it => SCHEMA.setPeChecked(r, groupKey, it.key, true));
  return r;
}

/**
 * 取出某一节的完整文本。
 *
 * 查体现在按「大节 + 小节」分段输出（例如「肺：」下面缩进写视诊/触诊/听诊），
 * 所以不能只取一行——要把该节标题行连同后续缩进子行一起取出来，
 * 否则次序断言会拿到空字符串而变成假通过。
 */
function groupLine(text, name) {
  const lines = text.split('\n');
  const start = lines.findIndex(l => l.startsWith(name + '：'));
  if (start < 0) return '';
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    // 子行以全角空格缩进
    if (/^\u3000/.test(lines[i])) out.push(lines[i]);
    else break;
  }
  return out.join('\n');
}

/* ======================= 1. 腹部查体次序 ======================= */

test('腹部查体输出次序为 视诊→听诊→叩诊→触诊', () => {
  const pe = GENERATOR.buildPE(checkGroup(makeRecord('digestive'), 'abdomen'));
  const line = groupLine(pe, '腹部');
  assert.ok(line, '应有腹部查体行');

  const iInspect = line.indexOf('腹部平坦');      // 视诊
  const iAusc = line.indexOf('肠鸣音');            // 听诊
  const iPerc = line.indexOf('逆时针叩诊');         // 叩诊
  const iPalp = line.indexOf('腹平软');            // 触诊
  for (const [name, idx] of [['视诊', iInspect], ['听诊', iAusc], ['叩诊', iPerc], ['触诊', iPalp]]) {
    assert.ok(idx > 0, `腹部查体缺 ${name}`);
  }
  assert.ok(iInspect < iAusc, '视诊应在听诊之前');
  assert.ok(iAusc < iPerc, '听诊应在叩诊之前（触诊叩诊会改变肠鸣音）');
  assert.ok(iPerc < iPalp, '叩诊应在触诊之前');
});

test('只有腹部改次序，胸部仍是视诊→触诊→叩诊→听诊', () => {
  const pe = GENERATOR.buildPE(checkGroup(makeRecord('respiratory'), 'chest'));
  const line = groupLine(pe, '胸部');
  const iInspect = line.indexOf('胸廓对称');
  const iPalp = line.indexOf('语颤对称');
  const iPerc = line.indexOf('双肺叩诊清音');
  const iAusc = line.indexOf('双肺呼吸音清');
  assert.ok(iInspect < iPalp && iPalp < iPerc && iPerc < iAusc,
    `胸部次序应保持 视→触→叩→听，实际：${line}`);
});

test('腹部触诊子项被填写后，父项让位（不同时输出两种描述）', () => {
  // 整组都勾上（含父项 abdPalpation），再单独填一个子项——
  // 这样才真正测到「父项让位」，否则父项本来就没勾，让位是假通过。
  const r = checkGroup(makeRecord('surgery'), 'abdomen');
  r.pe.abdomen.abdPalpSuperficial = '右下腹浅触诊压痛';
  const line = groupLine(GENERATOR.buildPE(r), '腹部');
  assert.match(line, /右下腹浅触诊压痛/);
  assert.doesNotMatch(line, /全腹无压痛、反跳痛/, `父项应让位，实际：${line}`);
});

/* ======================= 2. 神经系统分项输出 ======================= */

test('布氏征/克氏征/巴氏征分别成句，不合并成一句', () => {
  const r = makeRecord('neurology');
  r.pe.nervousPE = { brudzinski: '布氏征阳性', kernig: '克氏征阳性', babinski: '巴氏征阳性' };
  const line = groupLine(GENERATOR.buildPE(r), '神经系统');
  assert.match(line, /布氏征阳性/);
  assert.match(line, /克氏征阳性/);
  assert.match(line, /巴氏征阳性/);
  // 各自独立成句：三个阳性之间应有两个句号分隔，而不是被合并成一条
  assert.equal((line.match(/征阳性/g) || []).length, 3, `应三项分列，实际：${line}`);
  assert.doesNotMatch(line, /生理反射存在，病理反射未引出/, '父项 nerve 应让位');
});

/* ======================= 3. 现病史新要素 ======================= */

test('现病史包含缓解因素与鉴别意义阴性病史', () => {
  const r = makeRecord('respiratory');
  r.hpi.cause = '受凉后';
  r.hpi.symptoms = '咳嗽呈阵发性，伴咳黄痰';
  r.hpi.accompanying = '无咯血、无胸痛';
  r.hpi.relief = '服布洛芬后体温可降至正常';
  r.hpi.negativeDiscriminating = '无盗汗、消瘦';
  const hpi = GENERATOR.buildHPI(r);

  assert.match(hpi, /缓解|降至正常/, '应包含缓解因素');
  assert.match(hpi, /无盗汗/, '应包含鉴别意义阴性病史');
  assert.match(hpi, /受凉/, '应包含发病诱因');

  // 缓解因素在伴随症状之后、治疗经过之前，符合评分表第6页的顺序
  assert.ok(hpi.indexOf('降至正常') < hpi.indexOf('无盗汗'), '缓解因素应写在阴性病史之前');
});

test('缓解因素/阴性病史与伴随症状写重时自动去重，不重复啰嗦', () => {
  const r = makeRecord('respiratory');
  r.hpi.accompanying = '无咯血、无胸痛';
  r.hpi.relief = '服布洛芬后体温可降至正常';
  // 与伴随症状完全重复
  r.hpi.negativeDiscriminating = '无咯血、无胸痛';
  const hpi = GENERATOR.buildHPI(r);
  assert.equal((hpi.match(/无咯血/g) || []).length, 1, `「无咯血」不应重复出现：${hpi}`);

  // 部分重复：只保留没写过的那一项，并且不能丢掉否定词
  const r2 = makeRecord('respiratory');
  r2.hpi.accompanying = '无咯血、无胸痛';
  r2.hpi.negativeDiscriminating = '无咯血、盗汗、消瘦';
  const hpi2 = GENERATOR.buildHPI(r2);
  assert.equal((hpi2.match(/无咯血/g) || []).length, 1, `「无咯血」不应重复：${hpi2}`);
  assert.match(hpi2, /无盗汗、消瘦/, `剩余项必须保留否定词，否则会被读成阳性：${hpi2}`);
});

test('发病诱因补成完整分句，且与起病描述不矛盾', () => {
  // 短语诱因补谓词
  const r = makeRecord('respiratory');
  r.hpi.onset = '3天前出现咳嗽';
  r.hpi.cause = '受凉后';
  assert.match(GENERATOR.buildHPI(r), /受凉后起病/);
  assert.doesNotMatch(GENERATOR.buildHPI(r), /受凉后。/, '不应出现孤立的短语短句');

  // 两处录入有冲突时不能擅自删除原话，必须提醒用户核对。
  const r2 = makeRecord('respiratory');
  r2.hpi.onset = '3天前无明显诱因出现咳嗽';
  r2.hpi.cause = '受凉后';
  const hpi = GENERATOR.buildHPI(r2);
  assert.match(hpi, /无明显诱因/);
  assert.match(hpi, /受凉后起病/);
  assert.ok(GENERATOR.validate(r2).some(w => /诱因.*核对/.test(w)));

  // 「无明显诱因」本身不是诱因，只保留起病句里那一处
  const r3 = makeRecord('respiratory');
  r3.hpi.onset = '3天前无明显诱因出现咳嗽';
  r3.hpi.cause = '无明显诱因';
  const hpi3 = GENERATOR.buildHPI(r3);
  assert.equal((hpi3.match(/无明显诱因/g) || []).length, 1, `不应重复：${hpi3}`);
});

/* ======================= 4. 首次病程录（SOAP） ======================= */

const SOAP_TITLES = ['病历特点', '诊断依据', '鉴别诊断', '诊疗计划'];

test('空病历也能生成含四个小标题的首次病程录', () => {
  const out = GENERATOR.buildFirstCourseRecord(SCHEMA.emptyRecord());
  SOAP_TITLES.forEach(k => assert.ok(out.includes(k), `缺小标题：${k}`));
});

test('首次病程录四段都有实质内容（不是只有标题）', () => {
  const r = makeRecord('respiratory');
  r.basic.age = '58';
  r.pe.chest = { lungAuscultation: '右下肺可闻及湿性啰音' };
  r.auxiliary.items = [{ name: '胸部CT', result: '右下肺斑片状浸润影' }];
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  const out = GENERATOR.buildFirstCourseRecord(r);

  const sections = {};
  const lines = out.split('\n');
  let cur = null;
  lines.forEach(l => {
    const hit = ['病历特点', '客观记录', '诊断依据', '鉴别诊断', '诊疗计划'].find(k => l.includes(k));
    if (hit) { cur = hit; sections[cur] = []; return; }
    if (cur) sections[cur].push(l);
  });
  Object.keys(sections).forEach(k => {
    const body = sections[k].join('').trim();
    assert.ok(body.length > 0, `${k} 段为空`);
  });
  assert.match(sections['病历特点'].join(''), /咳嗽/, 'S 段应概括现病史');
  assert.match(sections['客观记录'].join(''), /湿性啰音/, 'O 段应含阳性体征');
  assert.match(sections['诊断依据'].join(''), /社区获得性肺炎/, 'A 段应逐条列诊断依据');
});

test('首次病程录：手写字段优先于自动草稿', () => {
  const r = makeRecord('respiratory');
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  r.soap.s.summary = '老年男性，急性起病，发热咳嗽咳黄痰3天';
  r.soap.a.diff = [{ diagnosis: '肺结核', why: '有咳嗽', against: '无低热盗汗、痰抗酸染色阴性', points: '查痰抗酸杆菌' }];
  r.soap.p.perDiagnosis = [{ diagnosis: '社区获得性肺炎', exam: '血培养、痰培养', treatment: '头孢曲松 2g qd 静滴' }];
  const out = GENERATOR.buildFirstCourseRecord(r);

  assert.match(out, /老年男性，急性起病/);
  assert.match(out, /需与肺结核鉴别/, '鉴别诊断段应展开');
  assert.match(out, /头孢曲松/, '诊疗计划段应展开');
  assert.match(out, /不支持点/, '鉴别诊断应写不支持点');
});

test('首次病程录：无关鉴别只进自查提醒，绝不混入病历正文', () => {
  const r = makeRecord('respiratory');
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  r.basic.chiefComplaint = '咳嗽';
  r.soap.a.diff = [{ diagnosis: '股骨颈骨折', against: '无外伤史' }];

  const out = GENERATOR.buildFirstCourseRecord(r);
  // 正文必须干净：用户会整段复制进病历系统，不能带「请确认是否保留」这类话
  assert.doesNotMatch(out, /自查/, '自查提示不得出现在病历正文');
  assert.doesNotMatch(out, /不写入病历/, '自查提示不得出现在病历正文');
  assert.doesNotMatch(out, /【自查/, '自查提示不得出现在病历正文');

  // 提醒通过独立接口给出，供界面展示
  const notes = GENERATOR.firstCourseSelfCheck(r);
  assert.ok(notes.length > 0, '无关鉴别应产生自查提醒');
  assert.match(notes.join(''), /股骨颈骨折/, '提醒应点名该鉴别诊断');
});

test('与主要诊断同一疾病谱的鉴别不会被误判为无关', () => {
  const r = makeRecord('surgery');
  r.basic.chiefComplaint = '转移性右下腹痛';
  r.hpi.symptoms = '疼痛6小时后转移并固定于右下腹';
  r.diagnosis.confirmed = ['急性阑尾炎'];
  r.soap.a.diff = [
    { diagnosis: '急性胆囊炎', against: '疼痛固定于右下腹' },
    { diagnosis: '泌尿系结石', against: '无腰腹部绞痛及血尿' },
    { diagnosis: '急性胃肠炎', against: '压痛固定于右下腹' }
  ];
  const check = GENERATOR.diffRelatedToDiagnosis(r);
  assert.deepEqual(check.unrelated, [], `不应误判：${check.unrelated.join(',')}`);
});

test('首次病程录是纯函数：重复调用结果一致且不修改入参', () => {
  const r = makeRecord('digestive');
  r.diagnosis.confirmed = ['急性阑尾炎'];
  const snapshot = JSON.stringify({ soap: r.soap, diagnosis: r.diagnosis });
  const a = GENERATOR.buildFirstCourseRecord(r);
  const b = GENERATOR.buildFirstCourseRecord(r);
  assert.equal(a, b);
  assert.equal(JSON.stringify({ soap: r.soap, diagnosis: r.diagnosis }), snapshot, '不应修改入参');
});

test('首次病程录：不传 record 也不抛错', () => {
  assert.doesNotThrow(() => GENERATOR.buildFirstCourseRecord());
  assert.doesNotThrow(() => GENERATOR.buildFirstCourseRecord(null));
});

/* ======================= 5. 出院记录 ======================= */

const DISCHARGE_TITLES = ['一般情况', '入院情况', '诊疗经过', '出院情况', '出院诊断', '出院医嘱'];

test('出院记录含六个小标题', () => {
  const out = GENERATOR.buildDischargeRecord(SCHEMA.emptyRecord());
  DISCHARGE_TITLES.forEach(k => assert.ok(out.includes(k), `缺小标题：${k}`));
});

test('出院记录：一般情况含姓名性别年龄与住院天数', () => {
  const r = makeRecord('respiratory');
  r.basic.admitDate = '2026-10-01';
  r.basic.recordNo = 'ZY2026100001';
  r.discharge.dischargeDate = '2026-10-10';
  const out = GENERATOR.buildDischargeRecord(r);
  assert.match(out, /姓名：测试患者/);
  assert.match(out, /性别：男/);
  assert.match(out, /年龄：45岁/);
  assert.match(out, /病历号：ZY2026100001/);
  assert.match(out, /住院天数：9天/);
});

test('出院记录：出院医嘱四子项分别出现', () => {
  const r = makeRecord('respiratory');
  r.discharge.advice = {
    drug: '头孢克洛 0.25g tid',
    nonDrug: '雾化吸入',
    lifestyle: '戒烟、避免受凉',
    followUp: '2周后门诊复诊'
  };
  const out = GENERATOR.buildDischargeRecord(r);
  assert.match(out, /药物治疗：头孢克洛/);
  assert.match(out, /非药物治疗：雾化吸入/);
  assert.match(out, /生活指导：戒烟/);
  assert.match(out, /复诊时间：2周后门诊复诊/);
});

test('出院记录：出院诊断留空时保持待填，不再静默继承初步诊断', () => {
  const r = makeRecord('respiratory');
  r.diagnosis.confirmed = ['社区获得性肺炎', '慢性胃炎'];
  const out = GENERATOR.buildDischargeRecord(r);
  assert.doesNotMatch(out, /1\. 社区获得性肺炎/, '未确认的初步诊断不能直接变成出院诊断');
  assert.match(out, /待补充：出院诊断未填写/);
  assert.match(out, /从初步诊断带入/);
});

test('出院记录：明确带入并确认的出院诊断照常输出，且保留「？」', () => {
  const r = makeRecord('respiratory');
  r.diagnosis.confirmed = ['社区获得性肺炎？'];
  r.discharge.diagnoses = ['社区获得性肺炎？', '慢性胃炎'];
  r.discharge.diagnosesConfirmed = true;
  const out = GENERATOR.buildDischargeRecord(r);
  assert.match(out, /1\. 社区获得性肺炎？/);
  assert.match(out, /2\. 慢性胃炎/);
});

test('住院天数计算：跨月、非法日期、倒序都不出错', () => {
  assert.equal(GENERATOR.hospitalDays('2026-09-28', '2026-10-03'), 5);
  assert.equal(GENERATOR.hospitalDays('', '2026-10-03'), 0);
  assert.equal(GENERATOR.hospitalDays('2026-10-03', '2026-09-28'), 0);
  assert.equal(GENERATOR.hospitalDays('不是日期', '2026-10-03'), 0);
});

/* ======================= 6. 重点查体（第4页 15 分） ======================= */

test('重点查体留空时不出现在体格检查里', () => {
  const pe = GENERATOR.buildPE(makeRecord('general'));
  assert.doesNotMatch(pe, /重点查体/);
});

test('重点查体按 focusPE.keys 输出，普通与专科查体都能引用', () => {
  const r = makeRecord('respiratory');
  r.focusPE.keys = ['chest.lungAuscultation', 'special_respiratory.respExtra'];
  r.focusPE.note = '右上肺呼吸音明显减弱';
  const pe = GENERATOR.buildPE(r);
  assert.match(pe, /重点查体：/);
  assert.match(pe, /右上肺呼吸音明显减弱/);
});

/* ======================= 7. hints 兼容：旧默认文案不误报 ======================= */

test('旧存档的腹部默认文案不产生任何阳性查体发现', () => {
  const r = makeRecord('digestive');
  // 模拟 t2 改默认文案之前保存的存档
  r.pe.abdomen = {
    abdInspect: '腹平软，未见腹壁静脉曲张',
    abdAuscultation: '肠鸣音正常，约4次/分',
    abdPercussion: '肝区及双肾区无叩击痛，移动性浊音阴性',
    abdPalpation: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
  };
  const findings = [...HINTS.extractFindings(r)];
  const peFindings = findings.filter(k => k.startsWith('pe:') || k.startsWith('pev:'));
  assert.deepEqual(peFindings, [], `旧默认文案被误判为阳性：${peFindings.join(', ')}`);
});

test('子项选了「正常」描述时也不产生阳性发现', () => {
  const r = makeRecord('neurology');
  const babinski = SCHEMA.findPEItem('nervousPE.babinski');
  const brudzinski = SCHEMA.findPEItem('nervousPE.brudzinski');
  r.pe.nervousPE = { babinski: babinski.normal, brudzinski: brudzinski.normal };
  const findings = [...HINTS.extractFindings(r)];
  assert.equal(findings.some(k => k.startsWith('pe:nervousPE') || k.startsWith('pev:nervousPE')),
    false, `选了正常描述却产生阳性：${findings.filter(k => k.startsWith('pe')).join(', ')}`);
});

/* ======================= 8. hints 兼容：新子项阳性时旧规则仍命中 ======================= */

test('用 abdomen 新子项构造右下腹压痛，急性阑尾炎规则仍命中', () => {
  const r = makeRecord('surgery');
  r.basic.age = '25';
  r.basic.chiefComplaint = '转移性右下腹痛';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '天';
  r.ros.general = { fever: { checked: true } };
  r.pe.vitals = { temperature: '38.2' };
  // 关键：不写父项 abdPalpation，只填子项
  r.pe.abdomen = { abdPalpSuperficial: '右下腹浅触诊压痛' };

  const names = HINTS.analyze(r).map(x => x.name);
  assert.ok(names.includes('急性阑尾炎'),
    `子项阳性应激活旧聚合 key，实际提示：${names.join(',') || '（无）'}`);
});

test('用 nervousPE 新子项构造脑膜刺激征，中枢神经系统感染规则仍命中', () => {
  const r = makeRecord('neurology');
  r.basic.age = '30';
  r.basic.chiefComplaint = '发热伴头痛';
  r.ros.head = { headache: { checked: true } };
  r.pe.vitals = { temperature: '38.9' };
  r.pe.neck = { neckResist: '颈抵抗阳性' };
  // 关键：不写父项 nervousPE.nerve，只填布氏征/克氏征/巴氏征
  r.pe.nervousPE = { brudzinski: '布氏征阳性', kernig: '克氏征阳性', babinski: '巴氏征阳性' };

  const names = HINTS.analyze(r).map(x => x.name);
  assert.ok(names.includes('中枢神经系统感染'),
    `子项阳性应激活 nervousPE.nerve，实际提示：${names.join(',') || '（无）'}`);
});

test('用 spine 水肿子项构造双下肢水肿，肾脏相关规则仍命中', () => {
  const r = makeRecord('nephrology');
  r.basic.age = '55';
  r.basic.chiefComplaint = '双下肢水肿';
  r.ros.gu = { edemaGu: { checked: true }, oliguria: { checked: true } };
  r.pe.abdomen = { abdPercussion: '双肾区叩击痛' };
  // 关键：不写父项 spine.limbs，只填踝部/胫前两个子项
  r.pe.spine = { edemaAnkle: '双侧踝部凹陷性水肿', edemaPretibial: '双侧胫前凹陷性水肿' };

  const names = HINTS.analyze(r).map(x => x.name);
  assert.ok(names.includes('慢性肾脏病'), `实际提示：${names.join(',') || '（无）'}`);
  assert.ok(names.includes('肾病综合征'), `实际提示：${names.join(',') || '（无）'}`);
});

test('hints 别名映射覆盖了 schema 里全部带 parent 的子项', () => {
  const childRefs = [];
  SCHEMA.PE_COMMON.forEach(g => {
    g.items.forEach(it => { if (it.parent) childRefs.push(`${g.key}.${it.key}`); });
  });
  assert.ok(childRefs.length >= 10, `应有至少 10 个细分子项，实际 ${childRefs.length}`);
  const unmapped = childRefs.filter(ref => !HINTS.PE_ALIAS[ref]);
  assert.deepEqual(unmapped, [], `以下子项缺别名映射，会让旧规则静默失效：${unmapped.join(', ')}`);
});

test('腹部触诊不做值级折算：绝不凭空补出「反跳痛」等未检查的体征', () => {
  // 这是一个**刻意的设计决定**，不是遗漏。详见 hints.js PE_VALUE_ALIAS 上方注释：
  // 病历是医疗记录，工具可以少提示（漏报只是少一个提醒），
  // 但绝不能替医生补上没做过的查体发现（「压痛」不能推出「反跳痛」）。
  // 本测试用于防止将来有人把「不折算」当成 bug「修好」它。
  const abdValueAliases = Object.keys(HINTS.PE_VALUE_ALIAS)
    .filter(k => k.startsWith('abdomen.'))
    .filter(k => !/=(肝肋下|脾肋下)/.test(k));
  assert.deepEqual(abdValueAliases, [],
    `腹部触诊不允许做值级折算，发现：${abdValueAliases.join(', ')}`);

  const r = makeRecord('surgery');
  r.basic.chiefComplaint = '转移性右下腹痛';
  r.pe.abdomen = { abdPalpSuperficial: '右下腹浅触诊压痛' };
  const findings = [...HINTS.extractFindings(r)];
  // 只做了浅触诊压痛，就不能出现任何含「反跳痛」的折算值
  const rebound = findings.filter(k => k.startsWith('pev:abdomen.') && k.includes('反跳痛'));
  assert.deepEqual(rebound, [], `不得凭空生成反跳痛：${rebound.join(', ')}`);
  // 但 must 依赖的 pe: 键必须仍在，否则阑尾炎规则会静默失效
  assert.ok(findings.includes('pe:abdomen.abdPalpation'),
    'key 级别名仍必须激活，否则阑尾炎等规则会失效');
});

/* ======================= 9. 家族史两系三代 ======================= */

test('家族史同时写出类似病情与两系三代两项', () => {
  const r = makeRecord('general');
  const t = GENERATOR.buildFamily(r);
  assert.match(t, /类似疾病/, '应有「与本病相似的病情」表述');
  assert.match(t, /两系三代/, '应有「两系三代」表述');
});
