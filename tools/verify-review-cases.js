/* 终审报告里列出的全部自由文本用例，逐条复核。
 * 每条都写清来源，便于对照评审报告。
 * 用法：node tools/verify-review-cases.js
 */
const path = require('node:path');
require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs')).bootGlobals();
const { SCHEMA, GENERATOR } = globalThis;

function mk(dept) {
  const r = SCHEMA.emptyRecord();
  r.basic.name = 'x';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.department = dept || 'general';
  r.basic.chiefComplaint = '不适';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '1天前出现不适';
  return r;
}

function detect(value, group, key, dept) {
  const r = mk(dept);
  r.pe[group || 'abdomen'] = { [key || 'abdPalpation']: value };
  return GENERATOR.abnormalPE(r).length > 0;
}

// [输入, 期望阳性?, 字段组, 字段键, 科室, 说明]
const CASES = [
  // —— 2.1 含「不」字的正常描述 ——
  ['双肺呼吸音不粗', false, 'chest', 'lungAuscultation', null, '不粗 = 正常'],
  ['心界不大', false, 'chest', 'chestShape', null, '正常'],
  ['肝脾未及', false, null, null, null, '未及 = 未触及'],
  ['双下肢不肿', false, 'spine', 'edemaAnkle', null, '不肿'],
  ['腹软，无压痛', false, null, null, null, '正常+阴性'],
  ['肠鸣音正常', false, 'abdomen', 'abdAuscultation', null, '正常'],

  // —— 2.2 含否定词但实为阳性 ——
  ['未闻及胎心', true, 'special_obstetrics', 'obsExtra2', 'obstetrics', '胎心消失是异常'],
  ['未闻及心音', true, 'chest', 'heartAuscultation', null, '心音消失是异常'],
  ['未闻及呼吸音', true, 'chest', 'lungAuscultation', null, '呼吸音消失是异常'],
  ['未闻及肠鸣音', true, 'abdomen', 'abdAuscultation', null, '肠鸣音消失是异常'],
  ['未触及搏动', true, 'spine', 'dorsalisPedis', null, '摸不到脉搏'],
  ['单侧足背动脉搏动未触及', true, 'spine', 'dorsalisPedis', null, '同上'],

  // —— 2.3 并列否定 ——
  ['无发热、无咳嗽、无咳痰', false, 'abdomen', 'abdPalpation', null, '全阴'],
  ['无发热、咳嗽、咳痰', false, 'abdomen', 'abdPalpation', null, '否定作用于并列'],
  ['右下腹压痛、无反跳痛', true, null, null, null, '前阳后阴'],
  ['肝区叩击痛阳性、Murphy征阴性', true, null, null, null, '前阳后阴'],
  ['右上腹可触及包块、无反跳痛', true, null, null, null, '包块是阳性'],

  // —— 2.4 部分否定 ——
  ['双下肢无水肿，右上肢轻度水肿', true, 'spine', 'edemaAnkle', null, '右上肢是另一部位'],
  ['双下肢无水肿、右上肢轻度水肿', true, 'spine', 'edemaAnkle', null, '同上（顿号）'],
  ['腹平软，全腹无压痛、右下腹压痛', true, 'abdomen', 'abdPalpSuperficial', null, '右下腹有压痛'],
  ['上腹部压痛、无反跳痛，腹肌紧张', true, null, null, null, '两处阳性'],

  // —— 2.5 中文否定变体 ——
  ['未扪及包块', false, null, null, null, '阴性'],
  ['未扪及肝脾', false, null, null, null, '阴性'],
  ['不能触及包块', false, null, null, null, '阴性'],
  ['触诊不满意', false, null, null, null, '检查受限，不是体征'],
  ['未发现异常', false, null, null, null, '阴性'],
  ['未发现包块', false, null, null, null, '阴性'],
  ['未查', false, null, null, null, '没检查'],

  // —— 2.6 真正的异常描述 ——
  ['可触及肿大淋巴结', true, 'skin', 'lymph', null, '阳性'],
  ['叩诊呈浊音', true, 'chest', 'lungPercussion', null, '阳性'],
  ['肝区叩击痛阳性', true, 'abdomen', 'abdPercussion', null, '阳性'],
  ['颈静脉怒张', true, 'neck', 'neckVessel', null, '阳性'],
  ['桶状胸', true, 'chest', 'chestShape', null, '阳性'],
  ['杵状指', true, 'spine', 'limbs', null, '阳性'],
  ['双肺可闻及哮鸣音', true, 'chest', 'lungAuscultation', null, '阳性'],
  ['心音低钝', true, 'chest', 'heartAuscultation', null, '阳性'],
  ['无痛性包块', true, null, null, null, '无痛性≠没有包块'],
  ['右下腹无痛性包块', true, null, null, null, '同上'],
  ['无痛性淋巴结肿大', true, 'skin', 'lymph', null, '同上'],

  // —— 3. 规则副作用点名项 ——
  ['右上腹可触及包块', true, null, null, null, '阳性'],
  ['压痛阳性', true, null, null, null, '阳性'],
  ['肝区叩击痛', true, 'abdomen', 'abdPercussion', null, '阳性'],
  ['肝区叩击痛阴性', false, 'abdomen', 'abdPercussion', null, '阴性'],
  ['包块未触及', false, null, null, null, '阴性'],
  ['右下腹可触及包块不大', true, null, null, null, '包块不论大小都是体征'],
  ['心律齐心音低钝', true, 'chest', 'heartAuscultation', null, '含异常'],

  // —— low-2 专科正常选项 ——
  ['前囟平软', false, 'special_pediatrics', 'pedExtra1', 'pediatrics', '婴儿正常表现'],
  ['手术切口愈合良好', false, 'special_surgery', 'surgExtra1', 'surgery', '术后正常']
];

let pass = 0;
const fails = [];
CASES.forEach(([value, expectPos, group, key, dept, why]) => {
  let got;
  try {
    got = detect(value, group, key, dept);
  } catch (e) {
    fails.push(`${value} → 抛错 ${e.message}`);
    return;
  }
  if (got === expectPos) pass++;
  else fails.push(`${value} → 期望${expectPos ? '阳性' : '阴性'}，实际${got ? '阳性' : '阴性'}（${why}）`);
});

console.log(`终审用例 ${CASES.length} 个，通过 ${pass} 个，失败 ${fails.length} 个`);
fails.forEach(f => console.log('  ✗ ' + f));
process.exit(fails.length ? 1 : 0);
