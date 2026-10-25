/* 对齐检查：把《诊断学》第10版体格检查书写清单与 schema 现有项目做比对。
 *
 * 用法：node tools/align-textbook.js
 *
 * 说明：书里的项目是「书写要求」，不一定每个都要做成输入框。
 * 这里只检查「书里明确要求、而我们完全没有对应字段」的缺口。
 */
const path = require('node:path');
require(path.join(__dirname, '..', 'tests', 'bootstrap.cjs')).bootGlobals();
const { SCHEMA } = globalThis;

// 教材第556-558页列出的书写项目 → 我们 schema 里的候选 key（任一命中即算覆盖）
const BOOK = [
  // 一般状况
  ['发育', ['general.development']],
  ['营养', ['general.nutrition']],
  ['神志', ['general.conscious']],
  ['体位', ['general.posture']],
  ['面容与表情', ['general.face']],
  ['检查能否合作', ['general.cooperation']],
  // 皮肤黏膜
  ['颜色', ['skin.color']],
  ['温度湿度弹性', ['skin.elasticity']],
  ['皮疹瘀点紫癜', ['skin.rash']],
  ['蜘蛛痣肝掌', ['skin.rash']],
  ['毛发', ['head.hair']],
  // 淋巴结
  ['浅表淋巴结', ['skin.lymph']],
  // 头部
  ['头颅大小形状', ['head.headShape']],
  ['眼', ['head.eyes']],
  ['耳', ['head.ent']],
  ['鼻', ['head.ent']],
  ['口腔与咽', ['head.ent', 'head.teeth']],
  // 颈部
  ['颈静脉', ['neck.neckVessel']],
  ['颈动脉搏动', ['neck.neckVessel']],
  ['气管位置', ['neck.trachea']],
  ['甲状腺', ['neck.thyroid']],
  ['肝颈静脉回流征', ['neck.neckVessel']],
  // 胸部
  ['胸廓', ['chest.chestShape']],
  ['乳房', ['chest.breast']],
  // 肺
  ['肺视诊', ['chest.lungInspect']],
  ['肺触诊', ['chest.lungPalpation']],
  ['肺叩诊', ['chest.lungPercussion']],
  ['肺听诊', ['chest.lungAuscultation']],
  ['肺下界移动度', ['chest.lungPercussion']],
  // 心
  ['心视诊', ['chest.heartInspect']],
  ['心触诊', ['chest.heartPalpation']],
  ['心叩诊', ['chest.heartPercussion']],
  ['心听诊', ['chest.heartAuscultation']],
  // 血管
  ['桡动脉脉搏', ['spine.radialPulse']],
  ['周围血管征', ['spine.dorsalisPedis']],
  // 腹部
  ['腹围', ['vitals.abdCirc']],
  ['腹部视诊', ['abdomen.abdInspect']],
  ['腹壁紧张度', ['abdomen.abdPalpation']],
  ['压痛反跳痛', ['abdomen.abdPalpation', 'abdomen.abdPalpSuperficial']],
  ['液波震颤', ['abdomen.fluidThrill', 'abdomen.abdPalpDeep']],
  ['腹部肿块', ['abdomen.abdPalpation']],
  ['肝脏触诊', ['abdomen.liverPalpation', 'abdomen.abdPalpation']],
  ['胆囊与Murphy征', ['abdomen.gallbladderPalpation', 'abdomen.abdPalpation']],
  ['脾脏触诊', ['abdomen.spleenPalpation', 'abdomen.abdPalpation']],
  ['肾脏触诊', ['abdomen.kidneyPalpation', 'abdomen.abdPalpation']],
  ['膀胱', ['abdomen.bladderPalpation', 'abdomen.abdPalpation']],
  ['肝浊音界与肝区叩击痛', ['abdomen.abdPercussion']],
  ['移动性浊音', ['abdomen.abdPercussion']],
  ['肾区叩击痛', ['abdomen.abdPercussion']],
  ['肠鸣音', ['abdomen.abdAuscultation']],
  ['振水音', ['abdomen.succussionSplash', 'abdomen.abdAuscultation']],
  ['血管杂音', ['abdomen.abdAuscultation']],
  // 肛门生殖器
  ['肛门直肠', ['genital.anus']],
  ['外生殖器', ['genital.genitalia']],
  // 脊柱四肢
  ['脊柱', ['spine.spineCol']],
  ['四肢', ['spine.limbs']],
  ['杵状指', ['spine.limbs']],
  ['肌力', ['spine.limbMuscle']],
  ['下肢水肿', ['spine.edemaAnkle', 'spine.edemaPretibial']],
  // 神经
  ['生理反射', ['nervousPE.nerve']],
  ['病理反射', ['nervousPE.babinski']],
  ['膝腱反射', ['nervousPE.tendonReflex', 'spine.kneeJerk']],
  // 教材「脑膜刺激征：颈项强直、Kernig 征、Brudzinski 征」三项。
  // 颈项强直（颈抵抗）在颈部查体里，nervousPE 没有对应项——这是有意的：
  // 查颈抵抗时人就在颈部，不该让医生再翻到神经系统卡片去填。
  ['脑膜刺激征', ['nervousPE.brudzinski', 'nervousPE.kernig', 'neck.neckResist']]
];

// 建立索引
const index = new Map();
SCHEMA.PE_COMMON.forEach(g => g.items.forEach(it => index.set(g.key + '.' + it.key, it)));
Object.keys(SCHEMA.PE_SPECIAL).forEach(sp => {
  (SCHEMA.PE_SPECIAL[sp].items || []).forEach(it => index.set('special_' + sp + '.' + it.key, it));
});
// 生命体征也是体格检查的书写内容（体温脉搏呼吸血压身高体重腹围…），单独索引
(SCHEMA.VITALS || []).forEach(v => index.set('vitals.' + v.key, v));

let covered = 0;
const missing = [];
BOOK.forEach(([name, keys]) => {
  if (!keys.length) { missing.push(name + '（无任何对应字段）'); return; }
  const hit = keys.find(k => index.has(k));
  if (hit) covered++;
  else missing.push(name + '（候选 ' + keys.join('/') + ' 都不存在）');
});

console.log(`教材书写项目：${BOOK.length} 项`);
console.log(`已覆盖：${covered} 项`);
console.log(`缺失：${missing.length} 项`);
missing.forEach(m => console.log('  ✗ ' + m));

// 反向：我们有哪些项是教材没提的
const bookKeys = new Set();
BOOK.forEach(([, keys]) => keys.forEach(k => bookKeys.add(k)));
const extra = [];
SCHEMA.PE_COMMON.forEach(g => g.items.forEach(it => {
  if (!bookKeys.has(g.key + '.' + it.key)) extra.push(g.key + '.' + it.key + '（' + it.label + '）');
}));
console.log('');
console.log(`schema 中教材未明确列出的项：${extra.length} 项`);
extra.forEach(e => console.log('  · ' + e));
