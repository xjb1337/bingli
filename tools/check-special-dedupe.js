/**
 * 专科情况去重检查。
 *
 * 目标有两层，缺一不可：
 *   ① 不重复——通用查体（或同一科室前面几项）已经写过的，不再写第二遍
 *      （《诊断学》第10版 第六篇：专科情况「前面体格检查中的相应项目不必重复书写」）
 *   ② 不出残句——不能因为删了一句就留下「质中，活动度好」这种没有主语的碎句
 *
 * 这个脚本把 14 个科室的全部专科项都勾上，逐个检查生成的专科行：
 *   · 有没有分句与通用查体段落逐字重复
 *   · 有没有「以逗号开头 / 分句数只剩 1 且不是完整主谓」的可疑残句
 *
 * 用法：node tools/check-special-dedupe.js
 * 退出码 1 表示有重复或残句。
 */
const path = require('path');
const { bootGlobals } = require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs'));

bootGlobals();
const SCHEMA = globalThis.SCHEMA;
const GENERATOR = globalThis.GENERATOR;

function makeRecord(deptKey) {
  const r = SCHEMA.emptyRecord();
  r.basic.name = '测试';
  r.basic.gender = '男';
  r.basic.age = '40岁';
  r.basic.department = deptKey;
  // 把该科室所有专科项都勾上
  const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey) || SCHEMA.DEPARTMENTS[0];
  (dept.special || []).forEach(spKey => {
    const sp = SCHEMA.PE_SPECIAL[spKey];
    if (!sp) return;
    sp.items.forEach(it => SCHEMA.setPeChecked(r, 'special_' + spKey, it.key, true));
  });
  return r;
}

// 一句正常的查体描述至少该有个名词主干；这里只抓最明显的破绽：
// 以逗号/句号开头、以逗号结尾、或整句少于 4 个字符。
function suspectClause(line) {
  const reasons = [];
  if (/^[，,。；;]/.test(line)) reasons.push('以标点开头');
  if (/[，,；;]$/.test(line)) reasons.push('以标点结尾');
  const clauses = line.split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
  clauses.forEach(c => {
    if (c.length < 4) reasons.push(`分句过短「${c}」`);
  });
  return reasons;
}

function run() {
  const problems = [];
  let totalSpecialLines = 0;
  let totalClauses = 0;

  ['general'].concat(SCHEMA.DEPARTMENTS.map(d => d.key).filter(k => k !== 'general')).forEach(deptKey => {
    const dept = SCHEMA.DEPARTMENTS.find(d => d.key === deptKey);
    if (!dept) return;
    const r = makeRecord(deptKey);
    const text = GENERATOR.generate(r).text;
    const lines = text.split('\n');
    // 通用查体段落 = 专科行之前的所有行
    const specialNames = (dept.special || []).map(k => (SCHEMA.PE_SPECIAL[k] || {}).name).filter(Boolean);
    if (!specialNames.length) return;
    const firstIdx = lines.findIndex(l => specialNames.some(n => l.startsWith(n + '：')));
    if (firstIdx < 0) return;   // 一勾都没写出来说明别处已坏，另有测试管
    const generalText = lines.slice(0, firstIdx).join('\n');

    specialNames.forEach(name => {
      const line = lines.find(l => l.startsWith(name + '：'));
      if (!line) return;
      totalSpecialLines += 1;
      const body = line.slice(name.length + 1).replace(/。$/, '');
      const clauses = body.split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
      totalClauses += clauses.length;

      // ① 与通用查体逐字重复
      clauses.forEach(c => {
        if (c && generalText.includes(c)) {
          problems.push(`[${deptKey}] 与通用查体重复：「${c}」`);
        }
      });

      // ② 残句
      suspectClause(body).forEach(reason => {
        problems.push(`[${deptKey}] ${reason} → ${line}`);
      });
    });
  });

  console.log(`检查了 ${totalSpecialLines} 行专科查体，共 ${totalClauses} 个分句。`);
  if (!problems.length) {
    console.log('没有重复，也没有残句。');
    return 0;
  }
  console.log(`\n发现 ${problems.length} 处问题：`);
  problems.forEach(p => console.log('  · ' + p));
  return 1;
}

process.exit(run());
