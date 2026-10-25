/**
 * 专科查体与通用查体重复扫描。
 *
 * 《诊断学》第10版 第六篇·病历书写，专科情况原文：
 *   「主要记录与本专科有关的体征，前面体格检查中的相应项目不必重复书写，
 *     只写"见××科情况"。」
 *
 * 所以专科项里凡是通用查体已经写过的分句，都不该再出现在专科段。
 * 这个脚本把每个科室专科项全部勾上，输出「哪些专科项的哪些分句与通用查体重合」，
 * 供人工改写 schema（**改内容，不是改生成逻辑**——生成时删分句会留下缺主语残句）。
 *
 * 用法：node tools/check-special-overlap.js
 * 退出码 1 表示仍有重复。
 */
const path = require('path');
const { bootGlobals } = require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs'));

bootGlobals();
const SCHEMA = globalThis.SCHEMA;
const GENERATOR = globalThis.GENERATOR;

// 少于这个字数的分句（「律齐」「质软」「无压痛」）在查体描述里是修饰短语，
// 它们单独看和别处重复很正常，不算问题。真正要治的是完整体征句的重复。
const MIN_DUP_LEN = 4;

function splitClauses(text) {
  return String(text || '').split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
}

// 生成通用查体段落（不含专科段）的文本
function generalPEText(r) {
  const deptKey = r.basic.department || 'general';
  const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
  const lines = [];
  SCHEMA.PE_COMMON.forEach(group => {
    const items = group.items.filter(it => !it.depts || it.depts.includes(deptKey));
    const entries = items
      .filter(it => SCHEMA.peChecked(r, group.key, it.key))
      .map(it => it.value !== undefined ? it : it);
    if (!entries.length) return;
    items.forEach(it => {
      if (!SCHEMA.peChecked(r, group.key, it.key)) return;
      const v = GENERATOR.peValue(r, group.key, it);
      if (v) lines.push(v);
    });
    void dept;
  });
  return lines.join('，');
}

function run() {
  const report = [];
  let dupCount = 0;

  SCHEMA.DEPARTMENTS.forEach(dept => {
    if (!(dept.special || []).length) return;
    const r = SCHEMA.emptyRecord();
    r.basic.department = dept.key;
    const general = generalPEText(r);

    dept.special.forEach(spKey => {
      const sp = SCHEMA.PE_SPECIAL[spKey];
      if (!sp) return;
      sp.items.forEach(it => {
        const text = it.default || it.normal || '';
        const dups = splitClauses(text).filter(c => c.length >= MIN_DUP_LEN && general.includes(c));
        if (!dups.length) return;
        const total = splitClauses(text).length;
        dupCount += dups.length;
        report.push({
          dept: dept.key,
          sp: spKey,
          key: it.key,
          label: it.label,
          default: text,
          dups,
          coverage: dups.length + '/' + total
        });
      });
    });
  });

  if (!report.length) {
    console.log('专科项里没有与通用查体重合的分句。');
    return 0;
  }

  console.log(`发现 ${report.length} 个专科项、共 ${dupCount} 个分句与通用查体重合：\n`);
  report.forEach(r => {
    console.log(`· ${r.dept}.${r.key}（${r.label}）覆盖 ${r.coverage}`);
    console.log(`    现：${r.default}`);
    console.log(`    重：${r.dups.join(' / ')}`);
  });
  return 1;
}

process.exit(run());
