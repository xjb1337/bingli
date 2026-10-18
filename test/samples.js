/* 生成 3 份不同科室的完整示例大病历，用于人工检查文本质量
 * 用法：node test/samples.js
 */
const fs = require('fs');
const path = require('path');

global.SCHEMA = require('../src/schema.js');
global.GENERATOR = require('../src/generator.js');
global.HINTS = require('../src/hints.js');

const OUT_DIR = path.join(__dirname, '..', 'samples');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ---------------- 示例 1：呼吸内科 ---------------- */
function sampleRespiratory() {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, {
    department: 'respiratory', name: '张三', gender: '男', age: '58',
    marital: '已婚', occupation: '退休', birthPlace: '浙江温州',
    admitDate: '2026-10-15', recordDate: '2026-10-15',
    chiefComplaint: '发热、咳嗽、咳黄痰',
    chiefComplaintDuration: '3', chiefComplaintDurationUnit: '天'
  });
  Object.assign(r.hpi, {
    onset: '3天前受凉后出现发热，体温最高39.2℃，伴畏寒，无寒战',
    symptoms: '咳嗽呈阵发性连声咳，咳黄色黏痰，量中等，不易咳出',
    evolution: '症状逐渐加重，夜间咳嗽明显，影响睡眠',
    accompanying: '伴右侧胸痛，咳嗽及深呼吸时加重；无咯血、盗汗及呼吸困难',
    treatment: '自服布洛芬后体温可暂时下降，未到医院就诊',
    generalCondition: '发病以来精神欠佳，食欲下降，睡眠差，大小便正常，体重无明显变化'
  });
  r.ros.resp = { cough: { checked: true }, sputum: { checked: true, detail: '黄色黏痰' } };
  r.ros.general = { fever: { checked: true, detail: '最高39.2℃' } };

  Object.assign(r.pmh, {
    health: '良好',
    diseaseChecks: { '高血压': true },
    diseaseDetail: '高血压病史5年，长期口服氨氯地平5mg qd，血压控制在130/80mmHg左右',
    allergy: '无'
  });
  Object.assign(r.personal, {
    birth: '出生于浙江温州，无疫区长期居留史',
    residence: '温州',
    smoking: '有',
    smokingAmount: '吸烟30年，每日约20支，未戒烟',
    drinking: '无'
  });
  r.marriage = { ...r.marriage, status: '已婚', age: '25' };
  r.family = { diseaseChecks: { '高血压': true }, deceased: '父母健在，兄弟1人均体健' };
  r.pe.vitals = {
    temperature: '38.6', pulse: '102', respiration: '22',
    sbp: '126', dbp: '78', height: '172', weight: '70'
  };
  r.pe.general = { conscious: '神志清楚，精神一般' };
  r.pe.chest = {
    lungAuscultation: '右下肺可闻及湿性啰音，双肺未闻及哮鸣音',
    heartAuscultation: '心率102次/分，律齐，各瓣膜听诊区未闻及病理性杂音'
  };
  r.auxiliary.items = [
    { name: '血常规', result: 'WBC 13.2×10⁹/L，N 82.4%，Hb 132g/L' },
    { name: '胸部CT', result: '右下肺大片实变影，可见支气管充气征' }
  ];
  r.diagnosis.confirmed = ['社区获得性肺炎（右下肺）', '高血压病2级（中危）'];
  return r;
}

/* ---------------- 示例 2：妇产科（女性，含月经生育史） ---------------- */
function sampleObstetrics() {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, {
    department: 'obstetrics', name: '李某某', gender: '女', age: '29',
    marital: '已婚', occupation: '职员', birthPlace: '浙江温州',
    admitDate: '2026-10-16', recordDate: '2026-10-16',
    chiefComplaint: '停经34周，发现血压升高1周',
    chiefComplaintDuration: '34', chiefComplaintDurationUnit: '周'
  });
  Object.assign(r.hpi, {
    onset: '孕妇平素月经规律，末次月经2026-02-20，停经34周，孕期规律产检',
    symptoms: '1周前产检发现血压148/96mmHg，休息后复测仍高，偶有头晕，无视物模糊',
    evolution: '头晕间断发作，休息后可缓解',
    accompanying: '无头痛、无视物模糊、无上腹不适，胎动正常',
    treatment: '未予药物治疗，今为进一步诊治入院',
    generalCondition: '发病以来精神可，食欲、睡眠正常，大小便正常，体重较孕前增加11kg'
  });
  r.ros.head = { headache: { checked: true, detail: '偶有头晕' } };
  r.ros.gu = { dysuria: { checked: false }, hematuria: { checked: false } };

  Object.assign(r.pmh, {
    health: '良好',
    diseaseChecks: {},
    diseaseDetail: '',
    allergy: '无'
  });
  Object.assign(r.personal, {
    birth: '出生于浙江温州，无疫区长期居留史',
    residence: '温州',
    smoking: '无',
    drinking: '无'
  });
  r.marriage = { ...r.marriage, status: '已婚', age: '26', spouseHealth: '配偶体健' };
  r.menstruation = {
    applicable: '有', age: '14', cycle: '28-30', duration: '5',
    quantity: '中等', lmp: '2026-02-20', dysmenorrhea: '无'
  };
  r.childbirth = { gravida: '2', para: '1', abortion: '1', details: '2022年顺产1女，健康', contraception: '无' };
  r.family = { diseaseChecks: { '高血压': true }, deceased: '父母健在' };
  r.pe.vitals = {
    temperature: '36.8', pulse: '88', respiration: '18',
    sbp: '152', dbp: '98', height: '160', weight: '71'
  };
  r.pe.chest = { heartAuscultation: '心率88次/分，律齐，各瓣膜听诊区未闻及病理性杂音' };
  r.pe.spine = { limbs: '双下肢非凹陷性水肿' };
  r.pe.special_obstetrics = {
    obsExtra1: '宫高、腹围与孕周相符，胎位纵产式',
    obsExtra2: '胎心音148次/分，律齐'
  };
  r.auxiliary.items = [
    { name: '尿常规', result: '蛋白（+），余未见异常' },
    { name: '产科超声', result: '单活胎，头位，双顶径8.6cm，羊水指数12cm' }
  ];
  r.diagnosis.confirmed = ['妊娠期高血压疾病', '孕2产1 孕34周 头位单活胎'];
  return r;
}

/* ---------------- 示例 3：儿科 ---------------- */
function samplePediatrics() {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, {
    department: 'pediatrics', name: '王某某（患儿）', gender: '男', age: '3',
    marital: '未婚', occupation: '无业', birthPlace: '浙江温州',
    admitDate: '2026-10-17', recordDate: '2026-10-17',
    informant: '患儿母亲（代述）', reliability: '供史者代述，部分可靠',
    chiefComplaint: '发热伴咳嗽',
    chiefComplaintDuration: '2', chiefComplaintDurationUnit: '天'
  });
  Object.assign(r.hpi, {
    onset: '2天前受凉后出现发热，体温最高39.5℃，服退热药后可暂时下降',
    symptoms: '咳嗽，呈阵发性，咳后有痰声，精神较平时差',
    evolution: '发热反复，今日咳嗽加重，食欲明显下降',
    accompanying: '无抽搐、无呕吐白沫、无皮疹',
    treatment: '家中口服布洛芬混悬液及头孢克洛，效果不佳',
    generalCondition: '2天来食欲下降，睡眠不安，大小便正常，体重无明显下降'
  });
  r.ros.general = { fever: { checked: true, detail: '最高39.5℃' } };
  r.ros.resp = { cough: { checked: true }, sputum: { checked: true } };

  Object.assign(r.pmh, {
    health: '良好',
    diseaseChecks: {},
    allergy: '无',
    infection: '否认肝炎、结核等传染病史',
    vaccine: '预防接种史按计划完成'
  });
  Object.assign(r.personal, {
    birth: '第1胎第1产，足月顺产，出生体重3.2kg，无窒息抢救史',
    residence: '温州',
    smoking: '无',
    drinking: '无'
  });
  r.family = { diseaseChecks: {}, deceased: '父母体健' };
  r.pe.vitals = {
    temperature: '38.9', pulse: '130', respiration: '34',
    sbp: '96', dbp: '60', height: '98', weight: '15',
    headCirc: '50', chestCirc: '53'
  };
  r.pe.general = { conscious: '神志清楚，精神差' };
  r.pe.head = { ent: '耳廓无畸形，外耳道无分泌物；咽充血，双侧扁桃体Ⅰ度肿大' };
  r.pe.chest = {
    lungAuscultation: '右下肺可闻及湿性啰音',
    heartAuscultation: '心率130次/分，律齐，各瓣膜听诊区未闻及病理性杂音'
  };
  r.auxiliary.items = [
    { name: '血常规', result: 'WBC 15.8×10⁹/L，N 78%，CRP 28mg/L' },
    { name: '胸片', result: '右下肺片状模糊影' }
  ];
  r.diagnosis.confirmed = ['小儿肺炎（右下肺）'];
  return r;
}

/* ---------------- 输出 ---------------- */
const samples = [
  ['呼吸内科_社区获得性肺炎', sampleRespiratory()],
  ['产科_妊娠期高血压', sampleObstetrics()],
  ['儿科_小儿肺炎', samplePediatrics()]
];

samples.forEach(([name, r]) => {
  const out = GENERATOR.generate(r, { rosMode: 'brief' });
  const header = `${'='.repeat(60)}\n${name}\n生成时间：${new Date().toLocaleString('zh-CN')}\n${'='.repeat(60)}\n\n`;
  const warn = out.warnings.length
    ? '\n\n' + '-'.repeat(40) + '\n【质控提醒】\n' + out.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')
    : '';
  const hint = HINTS.analyze(r);
  const hintTxt = hint.length
    ? '\n\n' + '-'.repeat(40) + '\n【参考诊断提示（仅供参考）】\n' +
      hint.map(h => `· ${h.name}\n  ${h.hint}\n  ${h.note}`).join('\n\n')
    : '';
  const file = path.join(OUT_DIR, name + '.txt');
  fs.writeFileSync(file, header + out.text + warn + hintTxt, 'utf8');
  console.log(`已生成：${file}`);
});

console.log('\n提示：这些是示例文件，用来看生成效果，不是真实病历。');
