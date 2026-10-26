/* 诊断提示质量度量：把全部模板套用一遍，看提示第一名叫什么。
 * 用法：node tools/check-top1.js
 * 输出命中数 + 未命中清单（期望名来自 EXPECT 表，即每个教学病例的出院主诊断）。
 * 这不是断言测试——提示只给参考，排在 #2 也算提示到位；它用来发现
 * 「规则写反了 / 被别的规则抢榜」这类需要人看一眼的问题。
 */
const { bootGlobals } = require("../tests/bootstrap.cjs");
bootGlobals();
const S = require('../src/schema.js');
const CORE = require('../src/core.js');
const T = require('../src/templates.js');
const H = require('../src/hints.js');
// 每个模板应有的主诊断（教学病例的出院主诊断），用于衡量提示质量
const EXPECT = {
  acs:'急性冠脉综合征', af:'心房颤动', aki:'急性肾损伤', anemia:'贫血', appendicitis:'急性阑尾炎',
  asthma:'支气管哮喘', bronchiectasis:'支气管扩张', cap:'社区获得性肺炎', chole:'急性结石性胆囊炎',
  cholelith:'胆囊结石伴急性胆囊炎', cirrhosis:'乙型肝炎后肝硬化失代偿期', ckd:'慢性肾脏病',
  copd:'慢性阻塞性肺疾病', cushing:'库欣综合征', dementia:'认知障碍 / 痴呆', dka:'糖尿病酮症酸中毒',
  dm:'糖尿病', ectopic:'异位妊娠', febrileSz:'热性惊厥', fracture:'骨折', gb:'吉兰-巴雷',
  hernia:'腹股沟疝', hf:'心力衰竭', htn:'高血压病', hyperthyroid:'甲状腺功能亢进症',
  hypothyroid:'甲状腺功能减退症', itp:'血小板减少相关出血',
  leukemia:'白血病 / 血液系统恶性肿瘤', meningitis:'中枢神经系统感染',
  myoma:'子宫肌瘤', nephrotic:'肾病综合征', obstruction:'粘连性肠梗阻',
  organophosphate:'有机磷中毒', pancreatitis:'急性胰腺炎', pedDiarrhea:'小儿腹泻病 / 脱水',
  pedPneumonia:'小儿肺炎', peritonitis:'急性腹膜炎', pid:'盆腔炎性疾病',
  preeclampsia:'妊娠期高血压疾病 / 子痫前期', pregDiabetes:'妊娠期糖尿病', pregnancy:'妊娠相关',
  ptx:'自发性气胸', pud:'消化性溃疡', sepsis:'脓毒症', shock:'休克', stone:'泌尿系结石',
  stroke:'脑卒中', tb:'肺结核', thyroidNodule:'甲状腺结节', ugib:'上消化道出血',
  uti:'泌尿系感染', valve:'心脏瓣膜病', vertigo:'眩晕 / 前庭疾病'
};
let hit=0, miss=[];
T.all().forEach(t=>{
  const r = S.emptyRecord(); r.basic.department = t.dept; CORE.fillBlanks(r, t.record);
  const out = H.analyze(r);
  const top1 = out[0] ? out[0].name : '(无)';
  const want = EXPECT[t.key] || '?';
  const ok = top1.startsWith(want.split(' ')[0]) || want.startsWith(top1.split(' ')[0]);
  if (ok) hit++; else miss.push(`${t.key.padEnd(16)} 期望「${want}」 实际「${top1}」`);
});
console.log(`top1 命中 ${hit}/${T.all().length}`);
if (miss.length) console.log(miss.join('\n'));
