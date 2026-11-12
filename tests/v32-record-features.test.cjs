'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCHEMA = require(path.join(ROOT, 'packages', 'domain', 'dist', 'schema.js'));
globalThis.SCHEMA = SCHEMA;
const CORE = require(path.join(ROOT, 'packages', 'domain', 'dist', 'core.js'));

const DEPARTMENT_KEYS = SCHEMA.DEPARTMENTS.map(department => department.key);

function blankRecord() {
  return CORE.cloneValue(SCHEMA.emptyRecord());
}

function listItem(id, data) {
  return { id, updatedAt: '2026-11-11T00:00:00.000Z', data: { ...data, id } };
}

function setPath(target, pathName, value) {
  const parts = pathName.split('.');
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor = cursor[parts[index]] || (cursor[parts[index]] = {});
  }
  cursor[parts[parts.length - 1]] = value;
}

function getPath(target, pathName) {
  return pathName.split('.').reduce((value, key) => value == null ? undefined : value[key], target);
}

function departmentName(key) {
  return (SCHEMA.DEPARTMENTS.find(department => department.key === key) || {}).name || '';
}

test('病历搜索：姓名、主诉、科室显示名和诊断支持部分匹配并支持多词 AND', () => {
  const first = blankRecord();
  first.basic.name = '虚构患者甲';
  first.basic.chiefComplaint = '咳嗽伴发热三天';
  first.basic.department = 'respiratory';
  first.diagnosis.confirmed = ['社区获得性肺炎'];

  const second = blankRecord();
  second.basic.name = '虚构患者乙';
  second.basic.chiefComplaint = '上腹隐痛';
  second.basic.department = 'digestive';
  second.discharge.diagnoses = ['慢性胃炎'];

  const list = [listItem('record-a', first), listItem('record-b', second)];
  const ids = query => CORE.searchRecords(list, query, { departmentName }).map(item => item.id);

  assert.deepEqual(ids('患者甲'), ['record-a']);
  assert.deepEqual(ids('咳嗽'), ['record-a']);
  assert.deepEqual(ids('呼吸'), ['record-a']);
  assert.deepEqual(ids('肺炎'), ['record-a']);
  assert.deepEqual(ids('胃炎'), ['record-b']);
  assert.deepEqual(ids('虚构患者'), ['record-a', 'record-b']);
  assert.deepEqual(ids('虚构 咳嗽'), ['record-a']);
  assert.deepEqual(ids('   '), ['record-a', 'record-b']);
  assert.deepEqual(ids('不存在的诊断'), []);
});

test('复制为新病历：清空身份、日期、号码和生命体征，保留科室与病种结构', () => {
  const source = blankRecord();
  source.id = 'source-record';
  source.rawNotes = '虚构原始笔记，不得复制';
  source.basic.department = 'respiratory';
  source.basic.chiefComplaint = '咳嗽3天';
  source.hpi.symptoms = '患者受凉后出现咳嗽，夜间加重。';
  source.hpi.onset = '3天前';
  source.pmh.surgery = '阑尾切除术';
  source.family.similarDisease = '家族中无类似疾病患者';
  source.pe.general.conscious = '神志清楚，精神可';
  source.pe.checked = { general: { conscious: true } };
  source.pe.vitals.temperature = '37.8';
  source.pe.vitals.pulse = '96';
  source.pe.vitals.sbp = '120';
  source.pe.vitals.dbp = '80';
  source.diagnosis.confirmed = ['社区获得性肺炎'];
  source.auxiliary.items = [{
    name: '虚构胸部影像',
    result: '未见异常',
    date: '2026-11-01',
    hospital: '虚构医院',
    no: '检查号-001',
  }];
  source.discharge.dischargeDate = '2026-11-08';
  source.discharge.diagnoses = ['社区获得性肺炎'];
  source.discharge.diagnosesConfirmed = true;
  source.meta.conflicts.marriage = {
    basicValue: '已婚',
    marriageValue: '离异',
    resolved: false,
    chosen: '',
  };
  source.meta.legacyUnmapped = {
    'basic.name': '虚构旧姓名',
    patientName: '虚构旧患者',
    guardianName: '虚构旧监护人',
    homeAddress: '虚构旧家庭地址',
    emergencyContact: '虚构旧紧急联系人',
    insuranceNumber: '虚构旧保险号码',
    recordNo: '虚构旧住院号',
    idCard: '虚构旧身份证号',
    sex: '女',
    dob: '1990-01-01',
    'auxiliary.items.0.date': '2026-01-01',
    'pe.vitals.temperature': '38.2',
    ros: '旧版系统回顾：无殊',
    'hpi.onset': '3天前',
    'auxiliary.items.0.result': '虚构旧影像结果',
  };
  source.meta.migratedFrom = 2;
  source.meta.migrationNotes = ['旧版迁移留下的患者身份说明'];

  const identity = {
    'basic.name': '虚构患者甲',
    'basic.gender': '女',
    'basic.age': '36',
    'basic.birthDate': '1990-01-01',
    'basic.marital': '已婚',
    'basic.nativePlace': '虚构出生地',
    'basic.birthPlace': '虚构籍贯',
    'basic.nationality': '汉族',
    'basic.occupation': '虚构职业',
    'basic.workUnit': '虚构工作单位',
    'basic.address': '虚构地址',
    'basic.phone': '13800000000',
    'basic.recordNo': '住院号-001',
    'basic.bedNo': '床号-08',
    'basic.admitDate': '2026-11-01',
    'basic.admitTime': '08:30',
    'basic.recordDate': '2026-11-01',
    'basic.recordTime': '09:00',
    'basic.informant': '虚构家属',
    'basic.reliability': '可靠',
    'menstruation.lmp': '2026-10-01',
    'childbirth.lastBirth': '2020年顺产一子',
    'soap.recordTime': '2026-11-01 10:00',
    'discharge.dischargeDate': '2026-11-08'
  };
  Object.entries(identity).forEach(([field, value]) => setPath(source, field, value));
  const optionalIdentityFields = ['idCard', 'idNumber', 'medicalRecordNo', 'caseNo', 'admissionNo', 'outpatientNo'];
  optionalIdentityFields.forEach(field => {
    source.basic[field] = '虚构号码-' + field;
  });
  Object.keys(identity).forEach(field => { source.meta.legacyUnmapped[field] = '虚构旧值-' + field; });
  optionalIdentityFields.forEach(field => {
    source.meta.legacyUnmapped['basic.' + field] = '虚构旧号码-' + field;
  });
  Object.keys(source.pe.vitals).forEach(field => {
    source.meta.legacyUnmapped['pe.vitals.' + field] = '虚构旧生命体征-' + field;
  });
  const clearedFieldStatePaths = [
    ...Object.keys(identity),
    ...optionalIdentityFields.map(field => 'basic.' + field),
    ...Object.keys(source.pe.vitals).map(field => 'pe.vitals.' + field),
    'auxiliary.items.0.date',
    'auxiliary.items.0.no',
  ];
  source.meta.fieldStates = {};
  clearedFieldStatePaths.forEach(field => { source.meta.fieldStates[field] = { source: 'ai' }; });
  source.meta.fieldStates['hpi.symptoms'] = { source: 'ai', reviewRequired: true };
  source.meta.fieldStates['pe.general.conscious'] = { source: 'manual' };
  source.meta.fieldStates['auxiliary.items.0.result'] = { source: 'manual' };

  const copy = CORE.copyRecordAsNew(source, { id: 'copy-record', now: '2026-11-11T00:00:00.000Z' });

  assert.equal(copy.id, 'copy-record');
  assert.notStrictEqual(copy, source);
  assert.equal(copy.rawNotes, '');
  Object.keys(identity).forEach(field => assert.equal(getPath(copy, field), '', field));
  ['idCard', 'idNumber', 'medicalRecordNo', 'caseNo', 'admissionNo', 'outpatientNo'].forEach(field => {
    assert.equal(copy.basic[field], '', field);
  });
  Object.keys(copy.pe.vitals).forEach(key => assert.equal(copy.pe.vitals[key], '', 'vital ' + key));
  assert.equal(copy.auxiliary.items[0].date, '');
  assert.equal(copy.auxiliary.items[0].no, '');
  assert.equal(copy.discharge.dischargeDate, '');
  assert.equal(copy.discharge.diagnosesConfirmed, false);
  assert.equal(copy.meta.createdAt, '2026-11-11T00:00:00.000Z');
  assert.equal(copy.meta.revision, 0);
  assert.deepEqual(copy.meta.conflicts, {});
  assert.equal(copy.meta.migratedFrom, null);
  assert.deepEqual(copy.meta.migrationNotes, []);
  clearedFieldStatePaths.forEach(field => {
    assert.equal(copy.meta.fieldStates[field], undefined, 'fieldState ' + field);
  });
  assert.deepEqual(copy.meta.fieldStates['hpi.symptoms'], { source: 'ai', reviewRequired: true });
  assert.deepEqual(copy.meta.fieldStates['pe.general.conscious'], { source: 'manual' });
  assert.deepEqual(copy.meta.fieldStates['auxiliary.items.0.result'], { source: 'manual' });
  [
    ...Object.keys(identity),
    ...optionalIdentityFields.map(field => 'basic.' + field),
    ...Object.keys(source.pe.vitals).map(field => 'pe.vitals.' + field),
    'auxiliary.items.0.date',
    'auxiliary.items.0.no',
    'patientName',
    'guardianName',
    'homeAddress',
    'emergencyContact',
    'insuranceNumber',
    'recordNo',
    'idCard',
    'sex',
    'dob',
  ].forEach(field => assert.equal(copy.meta.legacyUnmapped[field], undefined, 'legacyUnmapped ' + field));
  assert.equal(copy.meta.legacyUnmapped.ros, '旧版系统回顾：无殊');
  assert.equal(copy.meta.legacyUnmapped['hpi.onset'], '3天前');
  assert.equal(copy.meta.legacyUnmapped['auxiliary.items.0.result'], '虚构旧影像结果');

  assert.equal(copy.basic.department, 'respiratory');
  assert.equal(copy.basic.chiefComplaint, '咳嗽3天');
  assert.equal(copy.hpi.symptoms, source.hpi.symptoms);
  assert.equal(copy.hpi.onset, '3天前');
  assert.equal(copy.pmh.surgery, '阑尾切除术');
  assert.equal(copy.family.similarDisease, source.family.similarDisease);
  assert.equal(copy.pe.general.conscious, '神志清楚，精神可');
  assert.deepEqual(copy.pe.checked, { general: { conscious: true } });
  assert.deepEqual(copy.diagnosis.confirmed, ['社区获得性肺炎']);
  assert.deepEqual(copy.discharge.diagnoses, ['社区获得性肺炎']);
  assert.equal(copy.auxiliary.items[0].name, '虚构胸部影像');
  assert.equal(copy.auxiliary.items[0].result, '未见异常');

  assert.equal(source.basic.name, '虚构患者甲');
  assert.equal(source.rawNotes, '虚构原始笔记，不得复制');
  assert.equal(source.pe.vitals.temperature, '37.8');
});

test('备份默认不含原始笔记，勾选后包含且导入能还原', () => {
  const record = blankRecord();
  record.rawNotes = '虚构笔记：仅用于回归测试';
  record.basic.name = '虚构患者甲';
  const list = [listItem('record-notes', record)];

  const withoutNotes = CORE.buildExport(list, '2026-11-11T00:00:00.000Z');
  assert.equal('rawNotes' in withoutNotes.records[0].data, false);
  assert.equal(withoutNotes.includesNotes, undefined);

  const withNotes = CORE.buildExport(list, '2026-11-11T00:00:00.000Z', { includeNotes: true });
  assert.equal(withNotes.includesNotes, true);
  assert.equal(withNotes.records[0].data.rawNotes, '虚构笔记：仅用于回归测试');

  const imported = CORE.parseImport(JSON.stringify(withNotes), SCHEMA.emptyRecord, DEPARTMENT_KEYS);
  assert.equal(imported.records.length, 1);
  assert.equal(imported.records[0].data.rawNotes, '虚构笔记：仅用于回归测试');

  const withoutNotesImported = CORE.parseImport(
    JSON.stringify(withoutNotes),
    SCHEMA.emptyRecord,
    DEPARTMENT_KEYS,
  );
  assert.equal(withoutNotesImported.records[0].data.rawNotes, '');

  const markedWithoutRecordNotes = CORE.cloneValue(withNotes);
  delete markedWithoutRecordNotes.records[0].data.rawNotes;
  const markedImport = CORE.parseImport(
    JSON.stringify(markedWithoutRecordNotes),
    SCHEMA.emptyRecord,
    DEPARTMENT_KEYS,
  );
  assert.equal(markedImport.includesNotes, true);
  assert.equal(markedImport.records[0].rawNotesIncluded, false);
  const local = blankRecord();
  local.rawNotes = '虚构本机保留笔记';
  local.basic.name = '虚构本机旧患者';
  local.updatedAt = '2020-01-01T00:00:00.000Z';
  const markedMerged = CORE.mergeImport(
    [listItem('record-notes', local)],
    markedImport.records,
  );
  assert.equal(markedMerged.list[0].data.rawNotes, '虚构本机保留笔记');
});

test('旧病历与旧备份没有 rawNotes 时无损兼容为空白', () => {
  const legacy = SCHEMA.emptyRecord();
  delete legacy.rawNotes;
  legacy.basic.name = '旧病历虚构患者';
  const normalized = CORE.normalizeRecord(legacy, SCHEMA.emptyRecord, DEPARTMENT_KEYS);
  assert.equal(normalized.rawNotes, '');
  assert.equal(normalized.basic.name, '旧病历虚构患者');
});

test('3.2.0 / 320000 版本号在代码与文档中同步', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '3.2.0');
  for (const workspace of ['apps/web', 'packages/ai', 'packages/domain']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, workspace, 'package.json'), 'utf8'));
    assert.equal(manifest.version, '3.2.0', workspace);
  }
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));
  assert.equal(lock.version, '3.2.0');
  assert.equal(lock.packages[''].version, '3.2.0');
  assert.equal(lock.packages['apps/web'].version, '3.2.0');
  assert.equal(lock.packages['packages/ai'].version, '3.2.0');
  assert.equal(lock.packages['packages/domain'].version, '3.2.0');

  const gradle = fs.readFileSync(path.join(ROOT, 'android', 'app', 'build.gradle'), 'utf8');
  assert.match(gradle, /versionCode\s*=\s*\(project\.findProperty\('versionCode'\)\s*\?:\s*'320000'\)/);
  assert.match(gradle, /versionName\s*=\s*\(project\.findProperty\('versionName'\)\s*\?:\s*'3\.2\.0'\)/);
  const app = fs.readFileSync(path.join(ROOT, 'src', 'app.js'), 'utf8');
  assert.match(app, /const APP_VERSION = '3\.2\.0'/);
  const powershell = fs.readFileSync(path.join(ROOT, 'tools', 'build-android.ps1'), 'utf8');
  assert.match(powershell, /VersionName = '3\.2\.0'[\s\S]*VersionCode = 320000/);
  const release = fs.readFileSync(path.join(ROOT, 'docs', 'RELEASE.md'), 'utf8');
  assert.match(release, /3\.2\.0 \/ versionCode 320000/);
  assert.match(release, /默认 `320000`/);
});
