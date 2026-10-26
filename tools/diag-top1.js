/* ===========================================================================
 * 诊断提示的「差在哪」诊断器
 * 运行：node tools/diag-top1.js <模板key> [模板key...]
 *
 * 只回答一个问题：这份模板的病历，为什么第一条提示不是它自己的病？
 * 输出三块：命中的特征集、每条规则的得分与命中项、它需要的必要条件还差什么。
 * =========================================================================== */
const path = require('node:path');
const boot = require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs'));
const { SCHEMA: S, CORE, TEMPLATES: T, HINTS: H } = boot.bootGlobals();

const keys = process.argv.slice(2);
if (!keys.length) { console.log('用法：node tools/diag-top1.js myoma ectopic'); process.exit(0); }

keys.forEach(key => {
  const t = T.get(key);
  if (!t) { console.log(`\n【${key}】没有这份模板`); return; }
  const r = S.emptyRecord();
  r.basic.department = t.dept;
  CORE.fillBlanks(r, t.record);
  const F = H.extractFindings(r);
  const out = H.analyze(r);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`【${key}】${t.name}   科室=${t.dept}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`第一条提示：${out[0] ? out[0].name + `（score ${out[0].score.toFixed(2)}）` : '(无)'}`);

  console.log(`\n--- 前 5 条提示 ---`);
  out.slice(0, 5).forEach((h, i) => {
    console.log(`${i + 1}. ${h.name.padEnd(24)} score=${h.score.toFixed(2)} 命中 ${h.matched.length} 项`);
    console.log(`   ${h.matched.join(' , ')}`);
  });

  // 目标规则的规则体本身（按 id 或名字找）
  const target = H.RULES.find(x => x.id === key) ||
                 H.RULES.find(x => t.name.startsWith(x.name.split(' ')[0]) || x.name.startsWith(t.name.split('（')[0]));
  if (target) {
    const matched = target.match.filter(m => F.has(m));
    const mustHit = (target.must || []).filter(m => F.has(m));
    console.log(`\n--- 目标规则「${target.name}」---`);
    console.log(`  need=${target.need || 2} 实命中 ${matched.length} 项 ${matched.length >= (target.need || 2) ? '✓ 够' : '✗ 不够'}`);
    console.log(`  命中：${matched.join(' , ') || '(空)'}`);
    console.log(`  未命中：${target.match.filter(m => !F.has(m)).join(' , ') || '(无)'}`);
    if (target.must && target.must.length) {
      console.log(`  must 命中 ${mustHit.length}/${target.must.length}：${mustHit.join(' , ') || '(一条都没中 → 规则直接不出现)'}`);
    }
  } else {
    console.log(`\n--- 没有 id=${key} 的规则，也没有名字对得上的 ---`);
  }
});
