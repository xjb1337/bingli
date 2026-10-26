/* 字段落地审查：每个输入框填一个可识别的哨兵值，看它到底有没有进病历正文。
 *
 * 用法：node tools/check-field-reach.js            # 只列没落地的
 *       node tools/check-field-reach.js --all      # 连落地的一起列（含"被改写过"）
 *
 * 为什么需要这个：生育史里的「子女情况」曾经能填、能存、能导出，
 * 就是永远不出现在病历里 —— 填了等于没填，而且没有任何报错。
 * 这类沉默丢失靠人工点点点是查不出来的，只能靠机器逐个字段验一遍。
 *
 * 判定分三种：
 *   落地   —— 哨兵值原样出现在生成文本里
 *   改写   —— 没原样出现（被生成器换了说法/截断），但语义位置有内容
 *   丢失   —— 没有任何痕迹（真 bug）
 */
const path = require('node:path');
const { bootGlobals } = require('../tests/bootstrap.cjs');
const { SCHEMA, GENERATOR } = bootGlobals();

const SHOW_ALL = process.argv.includes('--all');

/* 每个字段一份「怎么填」的说明。只列自由文本与可枚举项；
 * 纯开关（如三态选择）另有测试覆盖，不在这里凑数。 */
const FIELDS = [
  // 一般项目
  ['basic.name', '张三丰'],
  ['basic.gender', '女'],
  ['basic.age', '47'],
  ['basic.birthPlace', '浙江温州'],
  ['basic.nativePlace', '浙江宁波'],
  ['basic.nationality', '汉族'],
  ['basic.workUnit', '温州市第二中学'],
  ['basic.occupation', '教师'],
  ['basic.address', '温州市鹿城区人民路 1 号'],
  ['basic.phone', '13800001111'],
  ['basic.informant', '本人'],
  ['basic.reliability', '可靠'],
  ['basic.marital', '已婚'],
  ['basic.bedNo', '32'],
  ['basic.recordNo', '2024-0088'],
  ['basic.chiefComplaint', '反复上腹部疼痛2年'],

  // 现病史
  ['hpi.onset', '两年前无明显诱因出现上腹部疼痛'],
  ['hpi.cause', '进食辛辣食物'],
  ['hpi.symptoms', '位于剑突下，呈烧灼样，程度中等'],
  ['hpi.accompanying', '伴反酸、嗳气'],
  ['hpi.evolution', '症状反复发作，近一月加重'],
  ['hpi.relief', '进食及服用抗酸药后可缓解'],
  ['hpi.treatment', '自行口服奥美拉唑'],
  ['hpi.generalCondition', '精神食欲可，大小便正常'],
  ['hpi.negativeDiscriminating', '无呕血黑便'],
  ['hpi.extra', '补充说明若干'],

  // 既往史
  ['pmh.health', '既往体健'],
  ['pmh.diseaseDetail', '高血压病史8年'],
  ['pmh.infection', '否认肝炎结核'],
  ['pmh.surgery', '阑尾切除术'],
  ['pmh.trauma', '否认外伤'],
  ['pmh.poisoning', '否认中毒'],
  ['pmh.transfusion', '否认输血'],
  // 过敏史是「有/无」选择，选了「有」才展开下面两个框。
  // 直接往 pmh.allergy 里塞「青霉素过敏」测不出真问题——真实用法是先选「有」。
  ['pmh.allergyReaction', '皮疹', { pre: r => { r.pmh.allergy = '有'; r.pmh.allergenChecks = { 青霉素: true }; } }],
  ['pmh.allergenOther', '破伤风抗毒素', { pre: r => { r.pmh.allergy = '有'; } }],
  ['pmh.vaccine', '按时接种'],
  ['pmh.longTermMeds', '氨氯地平5mg每日一次'],
  ['pmh.otherTreatDiseases', '慢性胃炎'],
  ['pmh.relatedHistory', '无特殊'],

  // 个人史
  ['personal.birth', '出生并生长于温州'],
  ['personal.residence', '久居温州'],
  ['personal.travel', '否认疫区旅居'],
  ['personal.occupationEnv', '无粉尘毒物接触'],
  ['personal.smoking', '吸烟20年每日10支'],
  ['personal.drinking', '偶尔饮酒'],
  ['personal.drugs', '否认吸毒'],
  ['personal.sexualHistory', '否认冶游史'],
  ['personal.environment', '居住环境良好'],
  ['personal.feeding', '母乳喂养'],
  ['personal.growth', '生长发育正常'],
  ['personal.maternal', '母亲孕期体健'],
  ['personal.habits', '无特殊嗜好'],

  // 婚姻史
  ['marriage.status', '已婚'],
  ['marriage.age', '25'],
  ['marriage.spouseHealth', '配偶体健'],
  ['marriage.sexLife', '正常'],
  ['marriage.relation', '和睦'],

  // 月经史
  ['menstruation.age', '14'],
  ['menstruation.cycle', '28'],
  ['menstruation.duration', '5'],
  ['menstruation.quantity', '中'],
  ['menstruation.color', '暗红'],
  ['menstruation.clot', '无血块'],
  ['menstruation.leukorrhea', '量中色白'],
  ['menstruation.lmp', '2024-03-01'],
  ['menstruation.extra', '无特殊'],

  // 生育史（性别必须为女才写）
  ['childbirth.fullTerm', '1'],
  ['childbirth.premature', '0'],
  ['childbirth.abortion', '0'],
  ['childbirth.alive', '1'],
  ['childbirth.gravida', '2'],
  ['childbirth.para', '1'],
  ['childbirth.details', '顺产1子体健'],
  ['childbirth.lastBirth', '2020年顺产一子'],
  ['childbirth.contraception', '宫内节育器'],

  // 家族史
  ['family.deceased', '父母健在，兄弟1人均体健'],
  ['family.other', '家族中无特殊'],
  ['family.similarDisease', '无类似疾病'],
  ['family.threeGeneration', '否认两系三代遗传病'],
  ['family.infectionHistory', '否认结核肝炎'],

  // 查体（选一项有默认文案的通用项，填自定义文字）
  ['pe.general.development', '发育正常'],
  ['pe.abdomen.abdPalpation', '腹软，全腹无压痛'],

  // 摘要与诊断
  ['diagnosis.signature', '李四'],
];

function setPath(obj, dotted, value) {
  const segs = dotted.split('.');
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur[segs[i]] == null || typeof cur[segs[i]] !== 'object') cur[segs[i]] = {};
    cur = cur[segs[i]];
  }
  cur[segs[segs.length - 1]] = value;
}

/* 有些值会被生成器换说法：'中' → '经量中'、'14' → '初潮14岁'。
 * 这些只要数字/关键片段在就算落地。 */
function probe(text, value) {
  if (!value) return 'skip';
  if (text.includes(value)) return 'ok';
  // 数字与短词：允许被包在别的词里（'14' 出现在 '初潮14岁'）
  if (value.length <= 4 && new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text)) {
    return 'wrapped';
  }
  return 'lost';
}

const results = [];
for (const [dotted, value, opts] of FIELDS) {
  const r = SCHEMA.emptyRecord();
  // 生育史/月经史只在女性记录里输出，所以统一按女性测
  r.basic.gender = '女';
  // 有些字段要先满足前提才显示/才生成（过敏史要先选「有」）
  if (opts && opts.pre) opts.pre(r);
  setPath(r, dotted, value);

  let text = '';
  try {
    text = GENERATOR.generate(r).text;
  } catch (e) {
    results.push([dotted, value, 'error', String(e.message).slice(0, 60)]);
    continue;
  }
  const verdict = probe(text, value);
  let where = '';
  if (verdict !== 'ok' && verdict !== 'skip') {
    // 找最接近的一行，帮助判读
    const line = text.split('\n').find(l => l.trim() && l.length > 2) || '';
    where = line.slice(0, 40);
  }
  results.push([dotted, value, verdict, where]);
}

const lost = results.filter(x => x[2] === 'lost' || x[2] === 'error');
const wrapped = results.filter(x => x[2] === 'wrapped');
const ok = results.filter(x => x[2] === 'ok');

console.log(`字段总数 ${results.length}：原样落地 ${ok.length} / 换说法 ${wrapped.length} / 丢失 ${lost.length}`);
if (wrapped.length && SHOW_ALL) {
  console.log('\n[换说法]');
  wrapped.forEach(x => console.log(`  ${x[0].padEnd(32)} ${JSON.stringify(x[1])}`));
}
if (lost.length) {
  console.log('\n[丢失 —— 填了等于没填]');
  lost.forEach(x => console.log(`  ${x[0].padEnd(32)} ${JSON.stringify(x[1])}  ${x[3]}`));
}
if (SHOW_ALL) {
  console.log('\n[原样落地]');
  ok.forEach(x => console.log(`  ${x[0]}`));
}

process.exit(lost.length ? 1 : 0);
