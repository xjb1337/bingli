/**
 * validate() 的「写了肯定不对」类检查。
 *
 * 这些跟「写得对不对要看病人」不同：T 368℃、P 780次/分、BP 80/130、
 * 70 岁挂儿科，不需要任何医学判断就能确定是手误。以前 validate 一位数字都不看，
 * 这些值会原样进病历正文。
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();

function mk(opts) {
  const o = opts || {};
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, { name: '测试', gender: '男', age: '45', department: 'digestive' }, o.basic || {});
  if (o.vitals) Object.assign(r.pe.vitals, o.vitals);
  if (o.discharge) Object.assign(r.discharge, o.discharge);
  return r;
}

/** 只取本次新增的三类提醒，避免被其他历史提醒干扰 */
function hits(r) {
  return GENERATOR.validate(r).filter(x => /^【生命体征】|^【日期】|^【一般项目】(科室|年龄)/.test(x));
}

test('正常生命体征不报错', () => {
  assert.deepEqual(hits(mk({ vitals: { temperature: '36.8', pulse: '78', respiration: '18', sbp: '120', dbp: '80' } })), []);
});

test('体温多打一位会被拦下', () => {
  const w = hits(mk({ vitals: { temperature: '368' } }));
  assert.equal(w.length, 1);
  assert.match(w[0], /体温 368 超出可信范围/);
});

test('脉搏 780 次/分会被拦下', () => {
  assert.match(hits(mk({ vitals: { pulse: '780' } }))[0], /脉搏 780 超出可信范围/);
});

test('收缩压不高于舒张压时提示可能写反了', () => {
  const w = hits(mk({ vitals: { sbp: '80', dbp: '130' } }));
  assert.equal(w.length, 1, '两个数都在各自范围内，只有交叉比较才能发现');
  assert.match(w[0], /收缩压 80 不高于舒张压 130/);
});

test('非数字的生命体征会被拦下', () => {
  assert.match(hits(mk({ vitals: { pulse: '七八' } }))[0], /不是数字/);
});

test('日期必须真实存在，2 月 30 日不算', () => {
  assert.match(hits(mk({ basic: { admitDate: '2026-02-30' } }))[0], /不是一个真实存在的日期/);
});

test('日期格式不对会被拦下', () => {
  assert.match(hits(mk({ basic: { admitDate: '2026/10/20' } }))[0], /不是 YYYY-MM-DD 格式/);
});

test('记录日期早于入院日期会被拦下', () => {
  const w = hits(mk({ basic: { admitDate: '2026-10-20', recordDate: '2026-10-18' } }));
  assert.match(w.join(''), /记录日期 2026-10-18 早于入院日期 2026-10-20/);
});

test('未补零的日期也能正确比较先后', () => {
  // 按字符串比 '2026-9-1' < '2026-10-1' 会判错，必须先标准化
  const w = hits(mk({ basic: { admitDate: '2026-9-1', recordDate: '2026-10-1' } }));
  assert.deepEqual(w, [], '9 月 1 日早于 10 月 1 日，属于正常情况，不应报警');
  const w2 = hits(mk({ basic: { admitDate: '2026-10-1', recordDate: '2026-9-1' } }));
  assert.match(w2.join(''), /记录日期 .* 早于入院日期/);
});

test('出院日期早于入院日期会被拦下', () => {
  const w = hits(mk({ basic: { admitDate: '2026-10-20' }, discharge: { dischargeDate: '2026-10-15' } }));
  assert.match(w.join(''), /出院日期 2026-10-15 早于入院日期 2026-10-20/);
});

test('70 岁的病人挂在儿科会被问一句', () => {
  const w = hits(mk({ basic: { department: 'pediatrics', age: '70' } }));
  assert.match(w.join(''), /科室是儿科，但年龄 70 岁/);
});

test('8 岁挂在成人科会被问一句', () => {
  const w = hits(mk({ basic: { age: '8' } }));
  assert.match(w.join(''), /14 岁以下建议选儿科/);
});

test('急诊不按 14 岁卡，儿科年龄段进急诊不报警', () => {
  assert.deepEqual(hits(mk({ basic: { department: 'emergency', age: '8' } })), []);
});

test('年龄写成「45岁」也能取到数字', () => {
  assert.deepEqual(hits(mk({ basic: { age: '45岁' } })), []);
  assert.match(hits(mk({ basic: { age: '70岁', department: 'pediatrics' } })).join(''), /年龄 70 岁/);
});

/* ---------- 通用查体默认值 vs 专科查体：矛盾提示的准确率 ---------- */

const { GENERATOR: G2 } = bootGlobals();

function mkDept(dept) {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, { name: '测试', gender: '男', age: '45', department: dept });
  return r;
}
const conflicts = r => G2.validate(r).filter(x => /前后矛盾/.test(x));

test('系统默认说「全腹无压痛」、专科写「中上腹压痛」→ 必须报', () => {
  const r = mkDept('digestive');
  SCHEMA.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  SCHEMA.setPeChecked(r, 'special_digestive', 'giTenderness', true);
  r.pe.special_digestive = { giTenderness: '中上腹压痛' };
  assert.equal(conflicts(r).length, 1);
});

test('矛盾提示只针对系统默认值，学生手写的不算', () => {
  // 手写的通用项就是学生自己的判断，程序没有立场说他自相矛盾
  const r = mkDept('digestive');
  SCHEMA.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  r.pe.abdomen.abdPalpation = '全腹无压痛、反跳痛';
  SCHEMA.setPeChecked(r, 'special_digestive', 'giTenderness', true);
  r.pe.special_digestive = { giTenderness: '中上腹压痛' };
  assert.deepEqual(conflicts(r), []);
});

test('部位不同的「压痛」不算矛盾', () => {
  // 头颅默认「头颅大小、形态正常，无压痛及包块」里也含「压痛」，
  // 但它说的是头，跟中上腹压痛不是同一件事。报这种假冲突，学生会整体无视提醒。
  const r = mkDept('digestive');
  SCHEMA.setPeChecked(r, 'head', 'headShape', true);
  SCHEMA.setPeChecked(r, 'special_digestive', 'giTenderness', true);
  r.pe.special_digestive = { giTenderness: '中上腹压痛' };
  assert.deepEqual(conflicts(r), []);
});

test('说法一致时不报', () => {
  const r = mkDept('digestive');
  SCHEMA.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  SCHEMA.setPeChecked(r, 'special_digestive', 'giTenderness', true);
  r.pe.special_digestive = { giTenderness: '全腹无压痛' };
  assert.deepEqual(conflicts(r), []);
});

test('「肠鸣音正常」与「肠鸣音活跃」是同一条体征，要报', () => {
  const r = mkDept('digestive');
  SCHEMA.setPeChecked(r, 'abdomen', 'abdAuscultation', true);
  SCHEMA.setPeChecked(r, 'special_digestive', 'giBowelSound', true);
  r.pe.special_digestive = { giBowelSound: '肠鸣音活跃，8次/分' };
  assert.equal(conflicts(r).length, 1);
  assert.match(conflicts(r)[0], /肠鸣音/);
});

/* ---------- 文案不自相重复 ---------- */

test('既往健康状况不会写成「平素既往体健」', () => {
  const mk2 = health => {
    const r = SCHEMA.emptyRecord();
    Object.assign(r.basic, { name: '测试', gender: '男', age: '45', department: 'digestive' });
    r.pmh.health = health;
    return G2.buildPMH(r).split('\n')[0];
  };
  assert.equal(mk2('体健'), '既往健康状况：平素体健');
  assert.equal(mk2('良好'), '既往健康状况：平素良好');
  // 学生自己写了「既往」就打头了，不能再冠「平素」
  assert.equal(mk2('既往体健'), '既往健康状况：既往体健');
  assert.equal(mk2('平素体健'), '既往健康状况：平素体健');
  assert.equal(mk2(''), '既往健康状况：／');
});

test('实验室检查只填项目名、没填结果时写占位', () => {
  const r = SCHEMA.emptyRecord();
  Object.assign(r.basic, { name: '测试', gender: '男', age: '45', department: 'digestive' });
  r.auxiliary.items = [{ name: '血常规', result: '', date: '2026-10-20', hospital: '温州市人民医院', no: '' }];
  const t = G2.buildAuxiliary(r);
  // 原来输出「2026-10-20 温州市人民医院 血常规。」——看着像做过了、结果正常
  assert.match(t, /血常规：／/);
  assert.doesNotMatch(t, /血常规。$/);
});
