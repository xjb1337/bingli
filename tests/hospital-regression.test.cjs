const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA: S, GENERATOR: G, CORE } = bootGlobals();

function record() {
  const r = S.emptyRecord();
  r.basic.department = 'neurology';
  return r;
}

test('填写了腹部触诊后，肝脾细项不会删除其他已记录的腹部所见', () => {
  const r = record();
  r.pe.abdomen.abdPalpation = '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及';
  r.pe.abdomen.liverPalpation = '肝肋下未触及，肝区无压痛';
  S.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  S.setPeChecked(r, 'abdomen', 'liverPalpation', true);
  const output = G.buildPE(r);
  assert.match(output, /腹平软，全腹无压痛、反跳痛，未触及包块/);
  assert.match(output, /肝区无压痛/);
  S.setPeChecked(r, 'abdomen', 'liverPalpation', false);
  const unchecked = G.buildPE(r);
  assert.match(unchecked, /腹平软，全腹无压痛、反跳痛，未触及包块/);
  assert.doesNotMatch(unchecked, /肝区无压痛/);
});

test('手填的父子查体冲突时保留原文并提醒；空白父项不输出冲突的默认值', () => {
  const r = record();
  r.pe.abdomen.abdPalpation = '腹平软，全腹无压痛';
  r.pe.abdomen.abdPalpSuperficial = '右下腹浅触诊压痛';
  S.setPeChecked(r, 'abdomen', 'abdPalpation', true);
  S.setPeChecked(r, 'abdomen', 'abdPalpSuperficial', true);
  assert.match(G.buildPE(r), /全腹无压痛/);
  assert.match(G.buildPE(r), /右下腹浅触诊压痛/);
  assert.ok(G.validate(r).some(w => /体格检查.*触诊.*不一致/.test(w)));
  r.pe.abdomen.abdPalpation = '';
  assert.doesNotMatch(G.buildPE(r), /全腹无压痛/);
  assert.ok(G.validate(r).some(w => /默认描述未写入/.test(w)));
});

test('留空一般情况时，生成正文与初稿都不自动填写正常状态或无诱因', () => {
  const r = record();
  r.basic.chiefComplaint = '咳嗽3天';
  r.hpi.onset = '3天前出现咳嗽';
  assert.doesNotMatch(G.buildHPI(r), /精神、食欲|大小便正常/);
  const draft = G.draftHPI({ basic: r.basic, hpi: {} });
  assert.doesNotMatch(draft.onset, /无明显诱因/);
  assert.ok(!draft.generalCondition);
});

test('阴性列表去重不能删除与前文阳性相反的症状', () => {
  const r = record();
  r.hpi.onset = '患者出现视物模糊';
  r.hpi.negativeDiscriminating = '无视物模糊、呛咳';
  const text = G.buildHPI(r);
  assert.match(text, /出现视物模糊/);
  assert.match(text, /无视物模糊、呛咳/);
  assert.ok(G.validate(r).some(w => /视物模糊.*同时出现有和无/.test(w)));
});

test('诱因栏的既往病史不被程序改写为本次发病原因', () => {
  const r = record();
  r.hpi.onset = '无明显诱因出现肢体无力';
  r.hpi.cause = '既往高血压病史10年，平素用药不规律';
  assert.match(G.buildHPI(r), /既往高血压病史10年/);
  assert.doesNotMatch(G.buildHPI(r), /为本次发病诱因/);
  assert.ok(!G.validate(r).some(w => /起病描述写无明显诱因/.test(w)));
});

test('正常营养、神志和面容不被当作阳性体征或诊断依据', () => {
  const r = record();
  r.pe.general = { nutrition: '营养情况良好', conscious: '神志清，精神可', face: '自然' };
  r.pe.special_neurology = { neuroExtra1: '言语不利' };
  r.diagnosis.confirmed = ['脑梗死'];
  const findings = G.abnormalPE(r).map(x => x.text);
  assert.deepEqual(findings, ['言语不利']);
  const basis = G.draftBasisDetail(r)[0].pe;
  assert.match(basis, /言语不利/);
  assert.doesNotMatch(basis, /营养情况良好|神志清|自然/);
});

test('左右侧、病情变化、时间线和未分项填写的检查均给出核对提醒', () => {
  const r = record();
  r.hpi.onset = '患者左侧肢体无力';
  r.hpi.symptoms = '右侧上下肢无力';
  r.hpi.treatment = '头颅CT未见出血，症状同前，但较前好转';
  r.hpi.extra = '发病至入院时间2小时';
  const warnings = G.validate(r).join('\n');
  assert.match(warnings, /左右侧肢体无力/);
  assert.match(warnings, /症状同前和较前好转/);
  assert.match(warnings, /入院的实际时间/);
  assert.match(warnings, /辅助检查.*尚未录入/);
  r.hpi.onset = '无左侧肢体无力';
  assert.doesNotMatch(G.validate(r).join('\n'), /左右侧肢体无力均被提及/);
});

test('出生日期和入院、记录时间按实际填写，旧病历不被改写', () => {
  const r = record();
  assert.equal(r.basic.admitDate, '');
  assert.equal(r.basic.recordDate, '');
  Object.assign(r.basic, { birthDate: '1967-10-23', admitDate: '2026-10-20', admitTime: '14:28', recordDate: '2026-10-20', recordTime: '16:12' });
  const text = G.buildBasicInfo(r);
  assert.match(text, /出生日期：1967-10-23/);
  assert.match(text, /入院日期：2026-10-20 14:28/);
  assert.match(text, /记录日期：2026-10-20 16:12/);
  assert.match(text, /病史陈述者：／/);
  const old = CORE.normalizeRecord({ basic: { name: '测试', recordDate: '2026-10-28' } }, S.emptyRecord, S.DEPARTMENTS.map(d => d.key));
  assert.equal(old.basic.recordDate, '2026-10-28');
  assert.equal(old.basic.recordTime, '');
});
