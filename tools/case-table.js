/* 摘要阳性/阴性判定的对照表测试。
 *
 * 关键设计：这张表是「手工写死的期望值」，**不从实现里反推**。
 * 曾经吃过亏：测试和实现共用同一套正则，实现错了测试跟着一起错，看起来全绿。
 *
 * 用法：node tools/case-table.js
 */
const path = require('node:path');
require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs')).bootGlobals();
const { SCHEMA, GENERATOR } = globalThis;

function mk() {
  const r = SCHEMA.emptyRecord();
  r.basic.name = 'x';
  r.basic.gender = '男';
  r.basic.age = '50';
  r.basic.chiefComplaint = '不适';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '天';
  r.hpi.onset = '1天前出现不适';
  return r;
}

// [字段, 值, 期望是否识别为阳性, 说明]
const CASES = [
  // ---- 阳性：必须识别出来（漏了就丢体征）----
  ['abdPalpation', '右下腹压痛、无反跳痛', true, '顿号前半是阳性'],
  ['abdPalpation', '肝区叩击痛阳性、Murphy征阴性', true, '顿号前半是阳性'],
  ['abdPalpation', '上腹部压痛、无反跳痛，腹肌紧张', true, '多处阳性混阴性'],
  ['abdPalpation', '无痛性包块', true, '无痛性≠没有包块'],
  ['abdPalpation', '无痛性淋巴结肿大', true, '同上'],
  ['abdPalpation', '右上腹可触及包块、无反跳痛', true, '可触及包块是阳性'],
  ['abdPalpation', '压痛阳性', true, '阳性'],
  ['abdPalpation', '全腹压痛、反跳痛', true, '两个都是阳性'],
  ['abdPalpation', '腹肌紧张，呈板状腹', true, '阳性'],
  ['spine2', '单侧足背动脉搏动未触及', true, '摸不到脉搏是体征'],
  ['special', '未闻及胎心', true, '听不到胎心是异常'],
  ['chest2', '未闻及呼吸音', true, '呼吸音消失是异常'],
  ['chest2', '双肺可闻及哮鸣音', true, '阳性'],
  ['chest2', '心音低钝', true, '阳性'],
  ['general2', '急性病容', true, '阳性'],
  ['general2', '颈静脉怒张', true, '阳性'],
  ['general2', '桶状胸', true, '阳性'],
  ['general2', '杵状指', true, '阳性'],
  ['abdomen2', '肠鸣音活跃', true, '阳性'],

  // ---- 阴性：不得当成阳性 ----
  ['abdPalpation', '全腹无压痛、反跳痛', false, '全阴'],
  ['abdPalpation', '肝脾未及', false, '未及'],
  ['abdPalpation', '腹软，无压痛', false, '含正常+阴性'],
  ['abdPalpation', '肝脾肋下未触及', false, '否定词在后'],
  ['abdPalpation', 'Murphy征阴性', false, '阴性'],
  ['abdPalpation', '未触及包块', false, '否定+名词'],
  ['abdPalpation', '未发现异常', false, '未发现'],
  ['abdPalpation', '未查', false, '未查'],
  ['spine2', '双下肢不肿', false, '不肿'],
  ['abdomen2', '腹部平坦，未见腹壁静脉曲张', false, '正常描述'],
  ['abdomen2', '肠鸣音正常', false, '正常'],
  ['spine2', '四肢肌力正常', false, '正常'],
  ['chest2', '各瓣膜听诊区未闻及病理性杂音', false, '未闻及杂音'],
  ['chest2', '双肺呼吸音清', false, '正常'],
  ['general2', '营养良好', false, '正常'],
  ['general2', '神志清楚，精神一般', false, '正常'],
  ['general2', '心界不大', false, '正常']
];

const FIELDS = {
  abdPalpation: ['abdomen', 'abdPalpation'],
  abdomen2: ['abdomen', 'abdAuscultation'],
  chest2: ['chest', 'heartAuscultation'],
  spine2: ['spine', 'dorsalisPedis'],
  general2: ['general', 'face'],
  special: ['special_obstetrics', 'obsExtra2']
};

let pass = 0;
const fails = [];
CASES.forEach(([field, value, expect, why]) => {
  const [g, k] = FIELDS[field] || ['abdomen', 'abdPalpation'];
  const r = mk();
  if (g.startsWith('special_')) r.basic.department = g.slice('special_'.length);
  r.pe[g] = { [k]: value };
  let got = false;
  try {
    got = GENERATOR.abnormalPE(r).length > 0;
  } catch (e) {
    fails.push(`${value} → 抛错 ${e.message}`);
    return;
  }
  if (got === expect) pass++;
  else fails.push(`${value}  → 期望${expect ? '阳性' : '阴性'}，实际${got ? '阳性' : '阴性'}（${why}）`);
});

console.log(`用例 ${CASES.length} 个，通过 ${pass} 个，失败 ${fails.length} 个`);
fails.forEach(f => console.log('  ✗ ' + f));
process.exit(fails.length ? 1 : 0);
