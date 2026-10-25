/**
 * 找出「同一科室内，汇总项与明细项之间」的重复。
 *
 * 为什么单独查这个：通用查体 vs 专科的重合已有整项去重兜底（见 buildPE），
 * 但**专科段内部**的重复不归它管——汇总项排在明细项前面，
 * 它先写进 out，明细项再写一遍，从头到尾没人拦。
 *
 * 用法：node tools/check-special-internal.js
 */
const { bootGlobals } = require('../tests/bootstrap.cjs');
bootGlobals();
const S = globalThis.SCHEMA;

function clauses(t) {
  return String(t || '').split(/[，,；;。]/).map(s => s.trim()).filter(Boolean);
}

let total = 0;
Object.keys(S.PE_SPECIAL).forEach(deptKey => {
  const sp = S.PE_SPECIAL[deptKey];
  const items = sp.items || [];
  const report = [];
  items.forEach(it => {
    const mine = clauses(it.default);
    if (mine.length < 2) return; // 单句的谈不上「汇总」
    // 我的每个分句是否出现在**其他**项的 default 里
    const covered = mine.map(c => {
      const owners = items.filter(o => o !== it && clauses(o.default).some(x => x.includes(c) || c.includes(x)));
      return { clause: c, owners: owners.map(o => o.key) };
    });
    const hit = covered.filter(x => x.owners.length);
    if (hit.length >= 2) {
      report.push({ item: it, hit, miss: covered.filter(x => !x.owners.length) });
    }
  });
  if (!report.length) return;
  console.log(`\n=== ${deptKey}（${sp.name}）`);
  report.forEach(r => {
    total += 1;
    const pct = `${r.hit.length}/${r.hit.length + r.miss.length}`;
    console.log(`· ${r.item.key} 「${r.item.default}」  被其他项覆盖 ${pct}`);
    r.miss.forEach(m => console.log(`    ✗ 无人覆盖：「${m.clause}」`));
  });
});
console.log(`\n共 ${total} 个疑似汇总项`);
