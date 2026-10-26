/* ===========================================================================
 * 诊断提示的「科室泄漏」审计
 * 运行：node tools/check-hint-leak.js [--verbose]
 *
 * 「泄漏」= 学生选了 A 科室，却弹出 B 科室的病。
 *
 * 例：在消化内科病历里弹「肾病综合征」「胆囊炎」，在精神科弹「慢性肾脏病」，
 * 在产科弹「化脓性阑尾炎」。这种提示不但没用，还会误导——学生看到提示
 * 以为要往那个方向想，实际上那个病在自己的科室里根本不在鉴别范围。
 *
 * 判定口径：某条规则在科室 D 的模板里命中，但 D 不在它的 depts 里 → 泄漏。
 * 这里的 depts 是规则自己声明的适用范围，是唯一的真相来源。
 * =========================================================================== */
const path = require('node:path');

const boot = require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs'));
// bootGlobals() 是「返回」一个对象，不是往 global 上挂东西——直接解构，
// 别写 global.CORE（会是 undefined）
const { SCHEMA: S, CORE, TEMPLATES: T, HINTS: H } = boot.bootGlobals();

const verbose = process.argv.includes('--verbose');

// 每个模板都按「学生真的选了那个科室」来跑，与界面一致
const rows = [];
const byRule = new Map();
const byDept = new Map();

T.all().forEach(t => {
  const r = S.emptyRecord();
  r.basic.department = t.dept;
  CORE.fillBlanks(r, t.record);
  const out = H.analyze(r);
  out.forEach(h => {
    const rule = H.RULES.find(x => x.id === h.id);
    const depts = (rule && rule.depts) || [];
    // 精神科规则 depts 只写 psychiatry，是最干净的对照组
    if (depts.includes(t.dept)) return;
    rows.push({ tpl: t.key, dept: t.dept, hint: h.name, depts: depts.join('/') });
    byRule.set(h.name, (byRule.get(h.name) || 0) + 1);
    byDept.set(t.dept, (byDept.get(t.dept) || 0) + 1);
  });
});

const totalHints = T.all().reduce((n, t) => {
  const r = S.emptyRecord();
  r.basic.department = t.dept;
  CORE.fillBlanks(r, t.record);
  return n + H.analyze(r).length;
}, 0);

console.log(`===== 科室泄漏审计 =====`);
console.log(`模板 ${T.all().length} 份，共给出 ${totalHints} 条提示，其中 ${rows.length} 条越界`);
console.log(`越界比例 ${(rows.length / Math.max(totalHints, 1) * 100).toFixed(1)}%`);

if (byRule.size) {
  console.log(`\n--- 越界最多的规则 ---`);
  Array.from(byRule.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([name, n]) => console.log(`${String(n).padStart(3)}  ${name}`));
}

if (byDept.size) {
  console.log(`\n--- 被越界最多的科室 ---`);
  Array.from(byDept.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([d, n]) => console.log(`${String(n).padStart(3)}  ${d}`));
}

if (verbose) {
  console.log(`\n--- 逐条明细 ---`);
  rows.forEach(x => console.log(`${x.tpl.padEnd(16)} [${x.dept}] ${x.hint}  （规则只适用于 ${x.depts}）`));
}

// 精神科是最后一个加的科室，泄漏最刺眼，单独盯一眼
const psy = rows.filter(x => x.dept === 'psychiatry');
console.log(`\n精神科病历里的越界提示：${psy.length} 条${psy.length ? ' —— ' + psy.map(x => x.hint).join('、') : ''}`);

process.exit(0);
