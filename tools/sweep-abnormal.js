/* 全量扫描：schema 里所有查体选项，abnormalPE 的判定是否符合预期。
 *
 * 这是对「摘要漏掉阳性体征 / 正常描述误报」的穷举检查——
 * 白名单式实现会在这里大面积失败（历史上就栽过：41/41 漏报）。
 *
 * 用法：node tools/sweep-abnormal.js
 */
const path = require('node:path');
require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs')).bootGlobals();
const { SCHEMA, GENERATOR } = globalThis;

function mk() {
  const r = SCHEMA.emptyRecord();
  r.basic.name = 'x';
  r.basic.gender = '男';
  r.basic.age = '60';
  r.basic.chiefComplaint = '乏力';
  r.basic.chiefComplaintDuration = '1';
  r.basic.chiefComplaintDurationUnit = '月';
  r.hpi.onset = '乏力1月';
  return r;
}

/** 明确是「正常状态」的选项——不应被当成阳性 */
const NORMAL_OPTIONS = new Set([
  '营养良好', '营养中等', '营养一般', '查体合作',
  '神志清楚', '神志清楚，精神可', '神志清楚，精神一般',
  '自动体位', '面容自然', '皮肤弹性良好', '毛发分布均匀',
  '颈软，无抵抗', '气管居中', '腹平软，未见腹壁静脉曲张', '肛门指检未触及异常'
]);

/** 含否定词、但其实是阳性体征的选项（"摸不到脉搏"是体征，不是"没查"） */
const POSITIVE_DESPITE_NEG = new Set([
  '单侧足背动脉搏动未触及'
]);

/** 含阳性成分的选项（前半句阴性、后半句阳性），应至少识别出阳性部分 */
const MIXED = new Set(['上腹部压痛，无反跳痛']);

const NEG_START = /^(无|未见|未闻及|未触及|未引出|未扪及|否认|没有|正常|阴性|不)/;

let expectPositive = 0;
let expectNegative = 0;
const missed = [];
const falsePos = [];

SCHEMA.PE_COMMON.forEach(g => {
  g.items.forEach(it => {
    // 只测通用科室能看到的项（带 depts 限制的项在别的科室才出现）
    if (it.depts && !it.depts.includes('general')) return;

    (it.options || []).forEach(o => {
      if (o === it.default || o === it.normal) return;

      const r = mk();
      r.pe[g.key] = { [it.key]: o };
      const found = GENERATOR.abnormalPE(r).length > 0;

      const shouldBePositive = POSITIVE_DESPITE_NEG.has(o) || MIXED.has(o) ||
        (!NORMAL_OPTIONS.has(o) && !NEG_START.test(o));

      if (shouldBePositive) {
        expectPositive++;
        if (!found) missed.push(`${g.key}.${it.key} = ${o}`);
      } else {
        expectNegative++;
        if (found) falsePos.push(`${g.key}.${it.key} = ${o}`);
      }
    });
  });
});

console.log(`预期识别为阳性的选项：${expectPositive} 个`);
console.log(`  漏报：${missed.length}`);
missed.slice(0, 20).forEach(m => console.log('     ✗ ' + m));
console.log('');
console.log(`预期不应识别的（阴性/正常）：${expectNegative} 个`);
console.log(`  误报：${falsePos.length}`);
falsePos.slice(0, 20).forEach(m => console.log('     ✗ ' + m));

const ok = missed.length === 0 && falsePos.length === 0;
console.log('');
console.log(ok ? '✓ 全部通过' : '✗ 存在问题');
process.exit(ok ? 0 : 1);
