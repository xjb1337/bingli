/* ===========================================================================
 * 三处「同一条数字在不同章节说法不一样」的回归测试
 * 运行：node --test tests/*.test.cjs
 *
 *   1. 生命体征：正文用完整数字格式 + 范围校验，摘要 / 首次病程 O 段 /
 *      诊断提示却直接 parseFloat，于是 999 和「38foo」能当真实体征混进去。
 *   2. 年龄单位：14日龄 被补成「14日龄岁」。
 *   3. 住院天数：2026-02-31 被 Date 归一化成 3 月 3 日，算出凭空的住院天数。
 *
 * 全部使用合成数据。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR, HINTS } = bootGlobals();

function makeRecord(over) {
  const r = SCHEMA.emptyRecord();
  r.basic.department = 'general';
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.chiefComplaint = '咳嗽';
  r.hpi.onset = '3天前出现咳嗽';
  r.diagnosis.confirmed = ['待完善'];
  return Object.assign(r, over || {});
}

/** 生成正文里的生命体征行（以「T 」开头的那一行，不是第一行——第一行是节标题） */
function vitalsLine(r) {
  const line = GENERATOR.generate(r).text.split('\n').find(l => /^T /.test(l));
  return line || '';
}

/** 摘要（含「查体：」那一段） */
function summaryText(r) {
  return GENERATOR.generate(r).sections['摘要'] || '';
}

/** 首次病程录的 O 段 */
function objectivePE(r) {
  return GENERATOR.draftObjectivePE(r);
}

/* ======================= 一、生命体征：无效值一律不进任何章节 ======================= */

test('合法异常值仍按原阈值进入摘要与 O 段', () => {
  const r = makeRecord();
  Object.assign(r.pe.vitals, {
    temperature: '38.6', pulse: '112', respiration: '24', sbp: '152', dbp: '96'
  });
  const s = summaryText(r);
  assert.match(s, /T 38\.6℃/, '38.6 的体温应在摘要里');
  assert.match(s, /P 112次\/分/);
  assert.match(s, /R 24次\/分/);
  assert.match(s, /BP 152\/96mmHg/);
  assert.match(objectivePE(r), /38\.6/);
});

test('合法边界值不算异常，不会凭空进摘要', () => {
  const r = makeRecord();
  Object.assign(r.pe.vitals, {
    temperature: '37.2', pulse: '100', respiration: '20', sbp: '139', dbp: '89'
  });
  const s = summaryText(r);
  assert.doesNotMatch(s, /T 37\.2/);
  assert.doesNotMatch(s, /P 100次\/分/);
  assert.doesNotMatch(s, /R 20次\/分/);
  assert.doesNotMatch(s, /BP 139/);
});

test('超范围体温（999）不进摘要、不进 O 段、不进诊断提示', () => {
  const r = makeRecord();
  r.pe.vitals.temperature = '999';
  assert.doesNotMatch(summaryText(r), /999/);
  assert.doesNotMatch(objectivePE(r), /999/);
  assert.equal(HINTS.extractFindings(r).has('vital:tempUp'), false,
    '999 不是「体温升高」，它是打错字');
});

test('超范围脉搏（999）与呼吸（90）同样被挡在摘要和提示之外', () => {
  const r = makeRecord();
  r.pe.vitals.pulse = '999';
  r.pe.vitals.respiration = '90';
  const s = summaryText(r);
  assert.doesNotMatch(s, /999/);
  assert.doesNotMatch(s, /R 90次\/分/);
  const f = HINTS.extractFindings(r);
  assert.equal(f.has('vital:tachy'), false);
  assert.equal(f.has('vital:tachypnea'), false);
});

test('非完整数字（38foo）不得被部分解析成 38', () => {
  const r = makeRecord();
  r.pe.vitals.temperature = '38foo';
  const s = summaryText(r);
  assert.doesNotMatch(s, /38foo/, '原样抄进摘要等于把打错字写进病历');
  assert.doesNotMatch(s, /T 38℃/);
  assert.equal(HINTS.extractFindings(r).has('vital:tempUp'), false);
});

test('正文、摘要、O 段对同一个无效值说法一致：都不写它', () => {
  const r = makeRecord();
  r.pe.vitals.temperature = '999';
  r.pe.vitals.pulse = '112';
  assert.match(vitalsLine(r), /T ／℃/, '正文按既有约定留空');
  assert.doesNotMatch(summaryText(r), /999/);
  assert.doesNotMatch(objectivePE(r), /999/);
  // 同一份病历里，有效的 112 在三处都应出现，无效的 999 三处都不出现
  assert.match(vitalsLine(r), /P 112次\/分/);
  assert.match(summaryText(r), /P 112次\/分/);
});

test('血压分量各自独立：收缩压有效、舒张压无效时不能把无效那个抄进去', () => {
  const r = makeRecord();
  r.pe.vitals.sbp = '152';
  r.pe.vitals.dbp = '999';
  const s = summaryText(r);
  assert.doesNotMatch(s, /999/, '舒张压无效就不能出现在文本里');
  assert.match(vitalsLine(r), /BP 152\/／mmHg/);
});

/* ======================= 二、年龄单位 ======================= */

test('带单位的年龄原样输出，不再补「岁」', () => {
  const cases = [
    ['14日龄', '14日龄'],
    ['3日', '3日'],
    ['7月', '7月'],
    ['28周', '28周'],
    ['14岁', '14岁']
  ];
  cases.forEach(([age, want]) => {
    assert.equal(GENERATOR.ageWithUnit({ age }), want, `年龄「${age}」应原样输出`);
  });
});

test('纯数字年龄才补「岁」', () => {
  assert.equal(GENERATOR.ageWithUnit({ age: '45' }), '45岁');
  assert.equal(GENERATOR.ageWithUnit({ age: '0' }), '0岁');
  assert.equal(GENERATOR.ageWithUnit({ age: '' }), '');
});

test('日龄不会在一般项目里变成「14日龄岁」', () => {
  const r = makeRecord();
  r.basic.age = '14日龄';
  const text = GENERATOR.generate(r).text;
  assert.doesNotMatch(text, /日龄岁/);
  assert.match(text, /年龄：14日龄/);
});

test('日龄仍被算作儿童，称呼与年龄语义一致', () => {
  // ageYears 对「天/日/周/月」一律返回 0，14日龄 不该被当成 14 岁
  assert.equal(GENERATOR.ageYears({ age: '14日龄' }), 0);
  assert.equal(GENERATOR.subjectOf({ age: '14日龄' }), '患儿');
  const r = makeRecord();
  r.basic.age = '14日龄';
  const s = summaryText(r);
  assert.match(s, /^患儿/, '14日龄 的摘要开头应是「患儿」');
});

/* ======================= 三、住院天数：无效日期不产生数字 ======================= */

test('有效日期照常算住院天数', () => {
  assert.equal(GENERATOR.hospitalDays('2026-09-28', '2026-10-03'), 5);
  assert.equal(GENERATOR.hospitalDays('2026-09-28', '2026-09-28'), 0, '同日是 0 天');
});

test('闰年 2 月 29 日是真实日期', () => {
  assert.equal(GENERATOR.hospitalDays('2024-02-29', '2024-03-01'), 1);
});

test('项目原本接受的未补零日期继续能算', () => {
  assert.equal(GENERATOR.hospitalDays('2026-9-28', '2026-10-3'), 5);
});

test('无效日期不产生住院天数', () => {
  const bad = [
    ['2026-02-31', '2026-03-05'],   // 2 月没有 31 日
    ['2026-02-29', '2026-03-05'],   // 2026 不是闰年
    ['2026-00-10', '2026-03-05'],   // 月份 0
    ['2026-13-10', '2026-03-05'],   // 月份 13
    ['2026-05-00', '2026-06-05'],   // 日期 0
    ['2026-05-32', '2026-06-05']
  ];
  bad.forEach(([a, b]) => {
    assert.equal(GENERATOR.hospitalDays(a, b), 0,
      `「${a}」→「${b}」不是有效日期，不该算出天数`);
  });
});

test('出院记录不显示基于无效日期算出的住院天数', () => {
  const r = makeRecord();
  r.basic.admitDate = '2026-02-31';
  r.discharge.dischargeDate = '2026-03-05';
  const text = GENERATOR.buildDischargeRecord(r);   // 返回的是字符串，不是 {text}
  assert.doesNotMatch(text, /住院天数：4天/, '2 月 31 日归一化后会算出 4 天，这是凭空的');
  assert.doesNotMatch(text, /住院天数：\d+天/, '无效日期不该显示任何天数');
});

test('有效日期时出院记录照常写住院天数', () => {
  const r = makeRecord();
  r.basic.admitDate = '2026-09-28';
  r.discharge.dischargeDate = '2026-10-07';
  assert.match(GENERATOR.buildDischargeRecord(r), /住院天数：9天/);
});

test('无效日期会被 validate 点名，而不是悄悄当成 0 天', () => {
  const r = makeRecord();
  r.basic.admitDate = '2026-02-31';
  const w = GENERATOR.validate(r);
  assert.ok(w.some(x => /不是一个真实存在的日期/.test(x)), '应给出日期告警');
});

test('缺日期与倒序出院都维持原有行为', () => {
  assert.equal(GENERATOR.hospitalDays('', '2026-10-03'), 0);
  assert.equal(GENERATOR.hospitalDays('不是日期', '2026-10-03'), 0);
  assert.equal(GENERATOR.hospitalDays('2026-10-03', '2026-09-28'), 0, '出院早于入院按 0 天');
});

test('住院天数不受运行机器时区影响', () => {
  // 用 UTC 整数算，跨夏令时的区间也应是精确的天数差
  assert.equal(GENERATOR.hospitalDays('2026-03-07', '2026-03-09'), 2);
  assert.equal(GENERATOR.hospitalDays('2026-11-01', '2026-11-03'), 2);
});

test('只匹配到字符串里一段的情况要被拒绝', () => {
  // 旧实现用 /(\d{4})\D?(\d{1,2})\D?(\d{1,2})/ 做非锚定搜索，
  // 「2026-09-28 出院」这种带尾巴的能算，但「xx2026-09-28」也会被算。
  assert.equal(GENERATOR.hospitalDays('xx2026-09-28', '2026-10-03'), 0);
});
