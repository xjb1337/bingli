/* 把 schema 里全部查体项的 key / label / normal / options 导出成纯文本，
 * 供撰写模板病例的人逐字对照——模板里的查体描述必须与 options 完全一致，
 * 否则诊断提示（hints 用 pev:组.key=值 精确匹配）永远命中不了。
 *
 * 用法：node tools/dump-pe-options.js > tools/pe-options.txt
 */
const S = require('../src/schema.js');

const out = [];
const line = s => out.push(s);

line('# 查体选项总表（由 tools/dump-pe-options.js 生成，勿手改）');
line('# 写法：组key.项key ｜ 标签 ｜ parent');
line('#   def=系统默认描述   nor=无默认值时的正常描述');
line('#   opt=快捷描述候选（模板必须逐字选用其中一项，或者自己写完整描述）');
line('');

S.PE_COMMON.forEach(g => {
  line(`===== PE_COMMON.${g.key}  ${g.name}${g.joinWith ? `（整组用「${g.joinWith}」连成一句）` : ''}`);
  g.items.forEach(it => {
    line(`  ${g.key}.${it.key} ｜ ${it.label}${it.parent ? ` ｜ parent=${it.parent}` : ''}`);
    if (it.default) line(`      def=${it.default}`);
    if (it.normal) line(`      nor=${it.normal}`);
    if (it.options && it.options.length) line(`      opt=${it.options.join(' ‖ ')}`);
    if (it.depts) line(`      depts=${it.depts.join(',')}`);
  });
  line('');
});

Object.keys(S.PE_SPECIAL).forEach(sp => {
  const spec = S.PE_SPECIAL[sp];
  line(`===== PE_SPECIAL.${sp}  ${spec.name}（写入路径 pe.special_${sp}.<项key>）`);
  spec.items.forEach(it => {
    line(`  special_${sp}.${it.key} ｜ ${it.label}`);
    if (it.default) line(`      def=${it.default}`);
    if (it.normal) line(`      nor=${it.normal}`);
    if (it.options && it.options.length) line(`      opt=${it.options.join(' ‖ ')}`);
    if (Array.isArray(it.summaryOf)) line(`      summaryOf=${it.summaryOf.join(',')}（明细项全勾时本项让位）`);
  });
  line('');
});

line('===== VITALS 生命体征（模板里一律留空，不要填数字）');
S.VITALS.forEach(v => line(`  ${v.key}  ${v.label}（${v.unit}）`));
line('');

line('===== ROS 系统回顾（8 系统）');
line('# 写法：ros.<系统key>.<症状key> = { checked:true, detail:"..." } 阳性；{ negative:true } 阴性；不写=没问');
S.ROS.forEach(sys => {
  line(`  ===== ${sys.key} ${sys.name}`);
  sys.symptoms.forEach(s => line(`      ${sys.key}.${s.key}  ${s.label}`));
});
line('');

line('===== 既往史疾病勾选（pmh.diseaseChecks.<名> = true）');
line('  ' + S.COMMON_PMH.join(' ‖ '));
line('');
line('===== 家族史疾病（family.diseaseChecks.<名> = true）');
line('  ' + S.FAMILY_DISEASES.join(' ‖ '));
line('');
line('===== 过敏原（pmh.allergenChecks.<名> = true）');
line('  ' + S.ALLERGENS.join(' ‖ '));
line('');
line('===== 过敏反应（pmh.allergenReactionChecks.<名> = true）');
line('  ' + S.ALLERGY_REACTIONS.join(' ‖ '));
line('');

line('===== 科室键（basic.department 只能填键，不能填中文名）');
S.DEPARTMENTS.forEach(d => line(`  ${d.key}  ${d.name}`));

process.stdout.write(out.join('\n') + '\n');
