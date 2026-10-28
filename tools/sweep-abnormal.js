/* 全量扫描：schema 里所有查体选项（含专科），abnormalPE 的判定是否符合预期。
 *
 * 注意：这个扫描器只能证明「实现没有退回到关键词白名单」这类整体性回归，
 * 不能作为阳性判定正确性的唯一依据——它的期望值也是按规则推出来的。
 * 真正判对错的依据是 tools/case-table.js 里手工写死的真值表。
 *
 * 用法：node tools/sweep-abnormal.js
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

/** 「不是体征」或「正常状态」——不应被当成阳性 */
const NOT_A_FINDING = new Set([
  // 根本不算体征（没查、看不出来）
  '未查', '未查见',
  // 正常状态
  '营养良好', '营养中等', '营养一般', '查体合作',
  '神志清楚', '神志清楚，精神可', '神志清楚，精神一般',
  '自动体位', '面容自然', '皮肤弹性良好', '毛发分布均匀',
  '颈软，无抵抗', '气管居中', '腹平软，未见腹壁静脉曲张',
  '双肺呼吸音清，未闻及干湿性啰音', '肠鸣音正常',
  '腹平软，全腹无压痛、反跳痛，肝脾肋下未触及', '双下肢无水肿', '神经系统常见阴性',
  '肛门指检未触及异常', '前囟平软', '手术切口愈合良好'
]);

/** 含否定词、但其实是阳性体征的选项 */
const POSITIVE_DESPITE_NEG = new Set([
  '单侧足背动脉搏动未触及',
  '未闻及胎心'
]);

/** 含阳性成分的选项（前半阴性后半阳性） */
const MIXED = new Set(['上腹部压痛，无反跳痛']);

// 不能把「未闻及」列进来：「未闻及胎心」是阳性体征。
const NEG_START = /^(无|未见|未触及|未引出|未扪及|否认|没有|正常|阴性|不)/;

let expectPositive = 0;
let expectNegative = 0;
const missed = [];
const falsePos = [];

function testOption(groupKey, item, option) {
  if (option === item.default || option === item.normal) return;
  const dept = groupKey.startsWith('special_')
    ? groupKey.slice('special_'.length)
    : ((item.depts && item.depts[0]) || 'general');
  const r = mk(dept);
  r.pe[groupKey] = { [item.key]: option };

  let found = false;
  try {
    found = GENERATOR.abnormalPE(r).length > 0;
  } catch (e) {
    falsePos.push(`${groupKey}.${item.key} = ${option} → 抛错 ${e.message}`);
    return;
  }

  const normalVariant = (item.normalVariants || []).includes(option);
  const shouldBePositive = POSITIVE_DESPITE_NEG.has(option) || MIXED.has(option) ||
    (!normalVariant && !NOT_A_FINDING.has(option) && !NEG_START.test(option));

  if (shouldBePositive) {
    expectPositive++;
    if (!found) missed.push(`${groupKey}.${item.key} = ${option}`);
  } else {
    expectNegative++;
    if (found) falsePos.push(`${groupKey}.${item.key} = ${option}`);
  }
}

SCHEMA.PE_COMMON.forEach(g => g.items.forEach(it => {
  (it.options || []).forEach(o => testOption(g.key, it, o));
}));

Object.keys(SCHEMA.PE_SPECIAL).forEach(spKey => {
  const sp = SCHEMA.PE_SPECIAL[spKey];
  (sp.items || []).forEach(it => {
    (it.options || []).forEach(o => testOption('special_' + spKey, it, o));
  });
});

console.log(`预期识别为阳性的选项：${expectPositive} 个`);
console.log(`  漏报：${missed.length}`);
missed.slice(0, 20).forEach(m => console.log('     ✗ ' + m));
console.log('');
console.log(`预期不应识别的（阴性/正常/非体征）：${expectNegative} 个`);
console.log(`  误报：${falsePos.length}`);
falsePos.slice(0, 20).forEach(m => console.log('     ✗ ' + m));

const ok = missed.length === 0 && falsePos.length === 0;
console.log('');
console.log(ok ? '✓ 全部通过' : '✗ 存在问题');
process.exit(ok ? 0 : 1);
