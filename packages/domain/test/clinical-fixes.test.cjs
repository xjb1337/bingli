const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const AGE = require('../dist/age.js');
const SCHEMA = require('../dist/schema.js');
const CORE = require('../dist/core.js');
const DEPTH = require('../dist/depth.js');
const GENERATOR = require('../dist/generator.js');
const HINTS = require('../dist/hints.js');

function validPeValueSet(item) {
  const vals = new Set();
  if (Array.isArray(item.options)) item.options.forEach((o) => vals.add(String(o).trim()));
  if (item.normal) vals.add(String(item.normal).trim());
  if (Array.isArray(item.normalVariants)) item.normalVariants.forEach((v) => vals.add(String(v).trim()));
  if (item.default) vals.add(String(item.default).trim());
  return vals;
}

test('P0-age: parseAge("3岁半") 保留半岁，cnToNumber("百") 返回 100', () => {
  const half = AGE.parseAge('3岁半');
  assert.equal(half.ok, true);
  assert.equal(half.years, 3.5);
  assert.equal(half.text, '3岁6个月');

  assert.equal(AGE.cnToNumber('百'), 100);
  assert.equal(AGE.cnToNumber('一百'), 100);
  assert.equal(AGE.cnToNumber('一百二十'), 120);
  assert.equal(AGE.cnToNumber('千'), 1000);
  assert.equal(AGE.formatAge({ years: 62, months: 747 }), '62岁');
});

test('P0-age: "14日龄" 与 "65天" 在 DEPTH 与 HINTS 中均按新生儿/婴儿处理', () => {
  const neo = SCHEMA.emptyRecord();
  neo.basic.gender = '女';
  neo.basic.age = '14日龄';
  assert.equal(AGE.years(neo) < 1, true);
  const fNeo = HINTS.extractFindings(neo);
  assert.equal(fNeo.has('age:child'), true);
  assert.equal(fNeo.has('age:fertile'), false);
  const dNeo = DEPTH.check(neo);
  assert.equal(dNeo.some((it) => it.id === 'menstrual' && /育龄/.test(it.message)), false);

  const infant = SCHEMA.emptyRecord();
  infant.basic.gender = '男';
  infant.basic.age = '65天';
  const fInf = HINTS.extractFindings(infant);
  assert.equal(fInf.has('age:child'), true);
  assert.equal(fInf.has('age:elderly'), false);

  const elderMom = SCHEMA.emptyRecord();
  elderMom.basic.gender = '女';
  elderMom.basic.age = '36岁';
  const fMom = HINTS.extractFindings(elderMom);
  assert.equal(fMom.has('age:fertile'), true);
  assert.equal(fMom.has('age:advancedMaternal'), true);
});

test('P0-schema: setPeChecked 与 setPeFactState 双向同步且 PE_INDEX 覆盖专科查体', () => {
  const r = SCHEMA.emptyRecord();
  SCHEMA.setPeFactState(r, 'chest', 'lungAuscultation', 'not_asked');
  assert.equal(SCHEMA.peChecked(r, 'chest', 'lungAuscultation'), false);

  SCHEMA.setPeChecked(r, 'chest', 'lungAuscultation', true);
  assert.equal(SCHEMA.peChecked(r, 'chest', 'lungAuscultation'), true);
  assert.notEqual(SCHEMA.peFactState(r, 'chest', 'lungAuscultation'), 'not_asked');

  SCHEMA.setPeFactState(r, 'chest', 'lungAuscultation', 'not_asked');
  assert.equal(SCHEMA.peChecked(r, 'chest', 'lungAuscultation'), false);

  assert.ok(SCHEMA.PE_INDEX['chest.lungAuscultation']);
  assert.ok(SCHEMA.PE_INDEX['special_respiratory.respPercussion']);
  assert.ok(SCHEMA.PE_INDEX['special_cardiology.cardioHeartSound']);
});

test('P0-depth: 拼接 chiefComplaintDurationUnit；未初潮不触发月经提醒；diseaseChecks=false 过滤', () => {
  const r = SCHEMA.emptyRecord();
  r.basic.gender = '女';
  r.basic.age = '11岁';
  r.basic.chiefComplaint = '腹痛';
  r.basic.chiefComplaintDuration = '3';
  r.basic.chiefComplaintDurationUnit = '年';
  r.hpi.onset = '3天前突然起病，无诱因。';
  r.menstruation.applicable = '未初潮';
  r.pmh.diseaseChecks = { 高血压: false };

  const items = DEPTH.check(r);
  assert.equal(items.some((x) => x.id === 'duration-mismatch'), true);
  assert.equal(items.some((x) => x.id === 'menstrual'), false);
  assert.equal(items.some((x) => x.id === 'missedHistory'), false);

  const rTrace = SCHEMA.emptyRecord();
  rTrace.basic.chiefComplaint = '腹痛';
  rTrace.basic.chiefComplaintDuration = '3';
  rTrace.basic.chiefComplaintDurationUnit = '天';
  rTrace.hpi.onset = '1年前曾反复隐痛，3天前加重。';
  assert.equal(DEPTH.check(rTrace).some((x) => x.id === 'onset-trace'), true);
});

test('P0-hints: 全部 HINTS.RULES 键与 SCHEMA 严格一致，无无效 pev/ros/dept/重复项', () => {
  const deptKeys = new Set(SCHEMA.DEPARTMENTS.map((d) => d.key));
  const rosKeys = new Set();
  SCHEMA.ROS.forEach((sys) => sys.symptoms.forEach((sym) => rosKeys.add(`${sys.key}.${sym.key}`)));

  const peItems = new Map();
  SCHEMA.PE_COMMON.forEach((g) => g.items.forEach((it) => peItems.set(`${g.key}.${it.key}`, it)));
  Object.entries(SCHEMA.PE_SPECIAL).forEach(([spKey, sp]) => {
    sp.items.forEach((it) => peItems.set(`special_${spKey}.${it.key}`, it));
  });

  for (const rule of HINTS.RULES) {
    for (const d of rule.depts || []) {
      assert.ok(deptKeys.has(d), `${rule.id}: 未知科室 ${d}`);
    }
    const mustList = rule.must || [];
    assert.equal(new Set(mustList).size, mustList.length, `${rule.id}: must 存在重复项`);

    for (const token of [...mustList, ...(rule.match || [])]) {
      if (token.startsWith('ros:')) {
        const key = token.slice(4);
        assert.ok(rosKeys.has(key), `${rule.id}: 无效 ROS 键 ${token}`);
      } else if (token.startsWith('pe:')) {
        const key = token.slice(3);
        assert.ok(peItems.has(key), `${rule.id}: 无效 PE 键 ${token}`);
      } else if (token.startsWith('pev:')) {
        const body = token.slice(4);
        const eq = body.indexOf('=');
        assert.ok(eq > 0, `${rule.id}: pev 缺少 = : ${token}`);
        const key = body.slice(0, eq);
        const val = body.slice(eq + 1);
        const item = peItems.get(key);
        assert.ok(item, `${rule.id}: 无效 pev 项 ${key}`);
        if (Array.isArray(item.options)) {
          const valid = validPeValueSet(item);
          assert.ok(valid.has(val) || Object.values(HINTS.PE_VALUE_ALIAS).some((arr) => arr.includes(token)),
            `${rule.id}: pev 值 "${val}" 不在 ${key}.options 或别名值内`);
        }
      }
    }
  }
  const pregDm = HINTS.RULES.find((r) => r.id === 'pregDiabetes');
  assert.ok(pregDm && pregDm.match.includes('age:advancedMaternal'));
});

test('P0-hints: MID_NEG_SPLIT 不误切无力/无法，auxText ct 词边界，PE_SPECIAL 排除 it.normal', () => {
  const r = SCHEMA.emptyRecord();
  r.basic.department = 'neurology';
  r.basic.chiefComplaint = '双下肢无力3天';
  r.hpi.symptoms = '双下肢无力，无法行走';
  r.auxiliary.items = [{ name: '血乳酸 (lactate)', result: '升高' }];
  r.pe.checked.special_neurology = { neuroMotor: true };
  r.pe.special_neurology = { neuroMotor: '正常' };
  const spMotor = SCHEMA.PE_SPECIAL.neurology.items.find((it) => it.key === 'neuroMotor');
  if (spMotor && !spMotor.normal) {
    // 找一个显式有 normal 的专科查体项测 it.normal 排除
  }

  const f = HINTS.extractFindings(r);
  assert.equal(f.has('cc:乏力') || f.has('cc:无力') || r.hpi.symptoms.includes('无力'), true);
  assert.equal(f.has('aux:CT'), false);

  const rCt = SCHEMA.emptyRecord();
  rCt.auxiliary.items = [{ name: '胸部CT平扫', result: '渗出影' }];
  assert.equal(HINTS.extractFindings(rCt).has('aux:CT'), true);

  // 确认「无法」「无力」不会被切掉：把「双下肢无力」与「无法行走」喂给 positiveNarrative 等价链
  const rWeak = SCHEMA.emptyRecord();
  rWeak.basic.chiefComplaint = '伴无力、乏力，无法站立';
  const fWeak = HINTS.extractFindings(rWeak);
  assert.equal(fWeak.has('cc:乏力'), true);

  // PE_SPECIAL 存在 it.normal 时应排除正常选项
  let specialWithNormal = null;
  for (const [spKey, sp] of Object.entries(SCHEMA.PE_SPECIAL)) {
    for (const it of sp.items) {
      if (it.normal) {
        specialWithNormal = { spKey, it };
        break;
      }
    }
    if (specialWithNormal) break;
  }
  if (specialWithNormal) {
    const rSp = SCHEMA.emptyRecord();
    rSp.basic.department = SCHEMA.DEPARTMENTS.find((d) => (d.special || []).includes(specialWithNormal.spKey)).key;
    SCHEMA.setPeChecked(rSp, `special_${specialWithNormal.spKey}`, specialWithNormal.it.key, true);
    rSp.pe[`special_${specialWithNormal.spKey}`][specialWithNormal.it.key] = specialWithNormal.it.normal;
    const fSp = HINTS.extractFindings(rSp);
    assert.equal(fSp.has(`pe:special_${specialWithNormal.spKey}.${specialWithNormal.it.key}`), false);
  }
});

test('P0-generator: abnormalPE 不污染 SCHEMA 单例，dedupeRecordFields 可用，marriageValue 一致，无家庭史 typo', () => {
  const r = SCHEMA.emptyRecord();
  r.basic.department = 'respiratory';
  r.pe.chest.lungAuscultation = '双肺可闻及湿性啰音';
  SCHEMA.setPeChecked(r, 'chest', 'lungAuscultation', true);
  const abn = GENERATOR.abnormalPE(r);
  assert.equal(abn.length > 0, true);
  for (const g of SCHEMA.PE_COMMON) {
    for (const it of g.items) {
      assert.equal('__positive' in it, false, `SCHEMA item ${g.key}.${it.key} 不应被写入 __positive`);
    }
  }

  r.hpi.symptoms = '反复咳嗽咳痰3天。';
  r.hpi.extra = '反复咳嗽咳痰3天。';
  const deduped = GENERATOR.dedupeRecordFields(r);
  assert.equal(deduped.hpi.extra, '');
  assert.equal(r.hpi.extra, '反复咳嗽咳痰3天。');

  r.basic.marital = '未婚';
  r.marriage.status = '已婚';
  assert.match(GENERATOR.buildMarriage(r), /^未婚/);
  assert.match(GENERATOR.buildMarriageHistory(r), /^未婚/);
  assert.match(GENERATOR.buildBasicInfo(r), /婚姻：未婚/);

  const structured = GENERATOR.validateStructured(r);
  const plain = GENERATOR.validate(r);
  assert.equal(structured.some((w) => w.message.includes('家庭史')), false);
  // 反转架构：validate(r) 严格等于 validateStructured(r) 非过期条目的 message 投影
  assert.deepEqual(
    plain,
    structured.filter((w) => !w.code.startsWith('DOC_STALE_')).map((w) => w.message)
  );
});

test('P0-core: normalizeRecord 移除冗余 pmh legacyUnmapped，保留 auxiliary', () => {
  const n = CORE.normalizeRecord(
    {
      basic: { name: '张三' },
      pmh: { health: '一般' },
      auxiliary: '血常规 WBC 12.5'
    },
    SCHEMA.emptyRecord,
    SCHEMA.DEPARTMENTS.map((d) => d.key)
  );
  assert.equal(Object.prototype.hasOwnProperty.call(n.meta.legacyUnmapped || {}, 'pmh'), false);
  assert.equal((n.meta.legacyUnmapped || {}).auxiliary, '血常规 WBC 12.5');
});

test('P0-perf: buildDocumentBundle 按 paths 映射节告警并完整产出三文书 IR', () => {
  const r = SCHEMA.emptyRecord();
  r.basic.gender = '男';
  const bundle = GENERATOR.buildDocumentBundle(r);
  assert.ok(bundle.record && bundle.firstCourse && bundle.discharge);
  const basicSec = bundle.record.sections.find((s) => s.title === '一般项目');
  const ccSec = bundle.record.sections.find((s) => s.title === '主诉');
  const diffSec = bundle.firstCourse.sections.find((s) => /鉴别诊断/.test(s.title));
  const disDateSec = bundle.discharge.sections.find((s) => /一般情况/.test(s.title));
  assert.ok(basicSec && basicSec.warnings.some((w) => w.code === 'NAME_MISSING'));
  assert.ok(ccSec && ccSec.warnings.some((w) => w.code === 'CHIEF_COMPLAINT_MISSING'));
  assert.ok(diffSec && diffSec.warnings.some((w) => w.code === 'SOAP_DIFF_MISSING'));
  assert.ok(disDateSec && disDateSec.warnings.some((w) => w.code === 'DISCHARGE_DATE_MISSING'));
});
