/**
 * 字段落地测试 —— 「学生填的字，最后有没有出现在病历里」
 *
 * 来历：用户报「生育史中子女情况填了之后，最后没有写到病历里面」。
 * 查下去发现真相比想象的更糟——不是这一处，而是一整类问题：
 * 界面上有输入框、localStorage 存得住、导出备份里也带着，
 * 但生成病历的那个函数里有一条 early return 把它挡在门外。
 * 学生填得越仔细，被吃掉的越多，而且**界面上没有任何提示**。
 *
 * 所以这一组测试不看「格式好不好看」，只看一件事：
 * **给某个字段填一个唯一值，generate() 的输出里能不能找到它。**
 * 任何一个字段做不到，就是「填了等于没填」。
 *
 * 配套的批量扫描工具是 tools/check-field-reach.js，它把 85 个字段逐个试一遍；
 * 这里挑的是几处真实踩过的坑，作为回归锁。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, GENERATOR } = bootGlobals();
// checker.js 不在 bootGlobals 的返回里（它不进浏览器全局链的返回值），单独 require
const CHECKER = require('../src/checker.js');
const G = GENERATOR;
const S = SCHEMA;

function mk(deptKey, gender) {
  const r = S.emptyRecord();
  r.basic.department = deptKey || 'general';
  r.basic.gender = gender || '男';
  return r;
}

/* ========================= 生育史：男性也要能写 ========================= */

test('男性患者的子女数与子女健康状况要写进生育史', () => {
  // 界面上男性那一栏是两个框：「子女数」「子女健康状况」。
  // 它们分别绑 childbirth.gravida 与 childbirth.details（复用女性字段）。
  // 旧实现 buildChildbirth 第一行是 `if (b.gender !== '女') return '';`，
  // 于是父亲填的两个格子一个都没进病历 —— 用户报的就是这个。
  const r = mk('surgery', '男');
  r.childbirth = { gravida: '2', details: '一子一女体健' };
  const t = G.buildChildbirth(r);
  assert.match(t, /生育史/);
  assert.match(t, /育有子女2人/);
  assert.match(t, /一子一女体健/);
  // 绝不能把父亲写成产妇
  assert.doesNotMatch(t, /孕\d+产/, '男性不能出现「孕X产Y」');
});

test('男性完全不填生育史时这一节不出现，也不凭空断言「无生育史」', () => {
  const r = mk('surgery', '男');
  r.childbirth = {};
  assert.equal(G.buildChildbirth(r), '');
});

test('女性仍按四项式写，不被男性分支影响', () => {
  const r = mk('gynecology', '女');
  r.childbirth = { fullTerm: '1', premature: '0', abortion: '1', alive: '1' };
  const t = G.buildChildbirth(r);
  assert.match(t, /1-0-1-1/);
  assert.doesNotMatch(t, /育有子女/, '女性不该走「育有子女N人」那条分支');
});

/* ========================= 生育史有独立标签 ========================= */

test('月经史与生育史各自带标签，不混成一句', () => {
  // 旧实现把「月经史：」「生育史：」两个前缀 replace 掉再拿逗号连成一句，
  // 输出「初潮14岁，周期28天，经量中等，1-0-0-1，顺产1子体健。」
  // 数字和子女情况粘在一起，学生看不出后半句是生育史，
  // 于是以为「子女情况没写进去」——用户报的现象就是这么来的。
  const r = mk('gynecology', '女');
  r.menstruation = { applicable: '有', age: '14', cycle: '28', duration: '5', quantity: '中等', dysmenorrhea: '无' };
  r.childbirth = { fullTerm: '1', premature: '0', abortion: '0', alive: '1', details: '顺产1子体健' };
  const t = G.buildMenstruationChildbirth(r);
  assert.match(t, /月经史：/, '月经史要有自己的标签');
  assert.match(t, /生育史：/, '生育史要有自己的标签');
  assert.match(t, /顺产1子体健/, '子女情况要在生育史那一段里');
});

test('只有生育史没有月经史时，也只写生育史那一段', () => {
  // 男性、绝经后女性、青春期前女孩都可能只有生育史。
  const r = mk('surgery', '男');
  r.childbirth = { gravida: '1', details: '一子体健' };
  const t = G.buildMenstruationChildbirth(r);
  assert.match(t, /生育史/);
  assert.doesNotMatch(t, /月经史/);
});

/* ========================= 婚姻史：开头不是必要条件 ========================= */

test('没选婚姻状况时，已填的结婚年龄与配偶健康仍要写出来', () => {
  // 旧实现 `if (!status) return '';` —— 婚姻状况是「叙述的开头」，
  // 不是「这一节是否成立」的前提。学生忘了点那个下拉框，
  // 后面认真填的四个格子就全被吃掉了。
  const r = mk('general', '男');
  r.marriage = { age: '25', spouseHealth: '体健' };
  const t = G.buildMarriageHistory(r);
  assert.match(t, /25岁结婚/);
  assert.match(t, /配偶体健/);
  // 没有婚姻状况打头时，不能拼出以逗号开头的残句
  assert.doesNotMatch(t, /^，/, `不能以逗号开头：${t}`);
});

test('只填性生活情况时也能单独成句', () => {
  const r = mk('general', '男');
  r.marriage = { sexLife: '正常' };
  assert.match(G.buildMarriageHistory(r), /性生活正常/);
});

test('婚姻相关字段全空时整节不出现', () => {
  const r = mk('general', '男');
  r.marriage = {};
  assert.equal(G.buildMarriageHistory(r), '');
});

/* ========================= 主诉时长：写在正文里 ========================= */

test('时长写在主诉正文里时直接采用，不再拼接单独字段', () => {
  // 用户要求去掉「持续时间 / 单位」两个选择框：他自己会写「发热咳嗽3天」。
  const r = mk('respiratory');
  r.basic.chiefComplaint = '发热、咳嗽、咳黄痰3天';
  assert.equal(G.buildChiefComplaint(r), '发热、咳嗽、咳黄痰3天。');
});

test('正文已有「三年余」这种约数写法时不重复拼时长', () => {
  // 旧正则只认数字结尾，「反复上腹痛三年余」+ 时长「3年」
  // 会拼成「反复上腹痛三年余3年。」——一句话里两个时长。
  const r = mk('digestive');
  r.basic.chiefComplaint = '反复上腹部疼痛三年余';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '年';
  assert.equal(G.buildChiefComplaint(r), '反复上腹部疼痛三年余。');
});

test('旧存档把时长单独存着时仍能拼出来（兼容）', () => {
  const r = mk('digestive');
  r.basic.chiefComplaint = '反复上腹部疼痛';
  r.basic.chiefComplaintDuration = '2';
  r.basic.chiefComplaintDurationUnit = '年';
  assert.equal(G.buildChiefComplaint(r), '反复上腹部疼痛2年。');
});

test('现病史初稿从主诉正文取时长，且不把时长留在症状名里', () => {
  const r = mk('digestive');
  r.basic.chiefComplaint = '反复上腹部疼痛2年';
  const onset = G.draftHPI(r).onset;
  assert.match(onset, /^2年前/);
  assert.match(onset, /反复上腹部疼痛/);
  // 不能写成「2年前无明显诱因出现反复上腹部疼痛2年」
  assert.doesNotMatch(onset, /疼痛2年/, `时长在句中被重复了：${onset}`);
});

test('约数词「余」不能孤零零掉在句尾', () => {
  // 「咳嗽3月余」→「3月前无明显诱因出现咳嗽」，
  // 不能剩下「3月前无明显诱因出现咳嗽余」。
  const r = mk('respiratory');
  r.basic.chiefComplaint = '咳嗽3月余';
  const onset = G.draftHPI(r).onset;
  assert.equal(onset, '3月前无明显诱因出现咳嗽');
});

test('主诉只有时长没有症状时，现病史用「上述症状」兜底', () => {
  const r = mk('digestive');
  r.basic.chiefComplaint = '2年';
  assert.match(G.draftHPI(r).onset, /上述症状/);
});

/* ========================= 评分自查跟着改 ========================= */

test('时长只写在主诉正文里，起病时间那一项照样给分', () => {
  // checker 原来只认 basic.chiefComplaintDuration 字段。
  // 输入框删掉以后，如果这里不跟着改，
  // 一份「反复上腹痛2年」的规范主诉会被判「还缺持续时间」，白扣 2.5 分。
  const r = mk('digestive');
  r.basic.chiefComplaint = '反复上腹部疼痛2年';
  r.hpi.onset = '2年前无明显诱因出现上腹部疼痛';
  const text = JSON.stringify(CHECKER.summary(r));
  assert.doesNotMatch(text, /主诉末尾还缺持续时间/);
});

test('主诉完全没有时长时仍会提醒补', () => {
  const r = mk('digestive');
  r.basic.chiefComplaint = '反复上腹部疼痛';
  r.hpi.onset = '无明显诱因出现上腹部疼痛';
  const text = JSON.stringify(CHECKER.summary(r));
  assert.match(text, /持续时间/);
});
