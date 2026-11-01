'use strict';

/*
 * PR0 兼容性冻结：
 *   1. v1 / v2 / v3 单份病历与备份包都能导入并迁移到 v3；
 *   2. 关键字段、旧文书与未知旧字段不被丢弃；
 *   3. 57 份模板、13 个专科的归属以及通用科无模板这一事实不再变化；
 *   4. Android 包名、WebView origin 与 localStorage 键名保持不变。
 *
 * 全部为合成数据，不读取真实患者资料。
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { bootGlobals } = require('./bootstrap.cjs');

const { SCHEMA, TEMPLATES } = bootGlobals();
const CORE = globalThis.RECORD_CORE;
const ROOT = path.join(__dirname, '..');
const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'legacy');
const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(d => d.key);

const LEGACY_FIXTURES = [
  {
    file: 'v1-record.json',
    format: 'record',
    version: 1,
    mode: 'single',
    expected: {
      name: '测试患者甲',
      gender: '男',
      age: '45',
      department: 'respiratory',
      chiefComplaint: '咳嗽、咳痰',
      diagnoses: ['急性支气管炎']
    },
    unknown: {
      legacyUnknown: { source: '旧版HIS', syntheticTag: '测试患者甲-未知字段' },
      basicTag: '旧版基本字段-合成'
    }
  },
  {
    file: 'v1-backup.json',
    format: 'backup',
    version: 1,
    mode: 'bundle',
    expected: {
      name: '测试患者乙',
      gender: '女',
      age: '5岁',
      department: 'pediatrics',
      chiefComplaint: '发热伴咽痛',
      diagnoses: ['急性化脓性扁桃体炎']
    },
    unknown: {
      legacyUnknown: { source: '旧版HIS', syntheticTag: '测试患者乙-备份未知字段' }
    }
  },
  {
    file: 'v2-record.json',
    format: 'record',
    version: 2,
    mode: 'single',
    expected: {
      name: '测试患者丙',
      gender: '女',
      age: '38',
      department: 'digestive',
      chiefComplaint: '上腹痛',
      diagnoses: ['急性胃炎', '胆囊炎待排']
    }
  },
  {
    file: 'v2-backup.json',
    format: 'backup',
    version: 2,
    mode: 'bundle',
    expected: {
      name: '测试患者丁',
      gender: '男',
      age: '67',
      department: 'neurology',
      chiefComplaint: '右侧肢体无力',
      diagnoses: ['急性脑梗死', '高血压3级']
    }
  },
  {
    file: 'v3-record.json',
    format: 'record',
    version: 3,
    mode: 'single',
    expected: {
      name: '测试患者戊',
      gender: '女',
      age: '31',
      department: 'obstetrics',
      chiefComplaint: '停经34周，发现血压升高',
      diagnoses: ['妊娠期高血压疾病', '孕1产0 34周']
    }
  },
  {
    file: 'v3-backup.json',
    format: 'backup',
    version: 3,
    mode: 'bundle',
    expected: {
      name: '测试患者己',
      gender: '女',
      age: '24',
      department: 'psychiatry',
      chiefComplaint: '情绪低落伴失眠',
      diagnoses: ['抑郁障碍待查']
    }
  }
];

const PRESERVED_PATHS = [
  'basic.name',
  'basic.gender',
  'basic.chiefComplaint',
  'hpi.onset',
  'summary',
  'soap.s.summary',
  'soap.o.pe',
  'soap.o.aux',
  'soap.a.basis',
  'soap.p.principle',
  'discharge.dischargeDate',
  'discharge.admitCondition',
  'discharge.course',
  'discharge.dischargeStatus',
  'discharge.diagnoses',
  'pe.vitals.temperature',
  'auxiliary.items'
];

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8'));
}

function recordBody(source) {
  if (source && Array.isArray(source.records)) return source.records[0].data;
  return source;
}

function importFixture(fixture) {
  const source = readJSON(fixture.file);
  const parsed = CORE.parseImport(
    JSON.stringify(source),
    SCHEMA.emptyRecord,
    DEPT_KEYS
  );
  return { source, parsed, body: recordBody(source), record: parsed.records[0].data };
}

test('legacy 目录只包含已冻结的 v1/v2/v3 单病历与备份样本', () => {
  const actual = fs.readdirSync(FIXTURE_DIR)
    .filter(name => name.endsWith('.json'))
    .sort();
  const expected = LEGACY_FIXTURES.map(x => x.file).sort();
  assert.deepEqual(actual, expected);
});

test('所有旧版单病历和备份包均可导入、迁移到 v3，关键内容不丢失', async t => {
  for (const fixture of LEGACY_FIXTURES) {
    await t.test(fixture.file, () => {
      const { source, parsed, body, record } = importFixture(fixture);

      assert.equal(parsed.mode, fixture.mode, '导入模式应与文件外形一致');
      assert.equal(parsed.records.length, 1);
      assert.equal(record.schemaVersion, CORE.SCHEMA_VERSION);
      assert.equal(record.schemaVersion, 3);
      assert.equal(record.basic.name, fixture.expected.name);
      assert.equal(record.basic.gender, fixture.expected.gender);
      assert.equal(record.basic.age, fixture.expected.age);
      assert.equal(record.basic.department, fixture.expected.department);
      assert.equal(record.basic.chiefComplaint, fixture.expected.chiefComplaint);
      assert.deepEqual(record.diagnosis.confirmed, fixture.expected.diagnoses);

      if (fixture.version < 3) {
        assert.equal(record.meta.migratedFrom, fixture.version);
        assert.ok(record.meta.migrationNotes.includes(
          `已从 v${fixture.version} 迁移到 v3`
        ));
      } else {
        assert.equal(record.meta.migratedFrom, null);
      }

      for (const fieldPath of PRESERVED_PATHS) {
        const before = CORE.getPath(body, fieldPath);
        if (before === undefined) continue;
        assert.deepEqual(
          CORE.getPath(record, fieldPath),
          before,
          `${fixture.file} 的 ${fieldPath} 在迁移后发生了变化`
        );
      }

      if (fixture.unknown) {
        assert.deepEqual(record.legacyUnknown, fixture.unknown.legacyUnknown);
        if (fixture.unknown.basicTag) {
          assert.equal(record.basic.legacyBasicTag, fixture.unknown.basicTag);
        }
        assert.equal(CORE.fieldState(record, 'legacyUnknown.source').source, 'legacy');
      }

      if (fixture.version < 3) {
        assert.equal(
          record.documentMeta.summary.origin,
          String(body.summary || '').trim() ? 'legacy' : ''
        );
        const soap = body.soap || {};
        assert.equal(
          record.documentMeta.firstCourse.s.origin,
          String((soap.s || {}).summary || '').trim() ? 'legacy' : ''
        );
        assert.equal(
          record.documentMeta.firstCourse.oPe.origin,
          String((soap.o || {}).pe || '').trim() ? 'legacy' : ''
        );
        assert.equal(
          record.documentMeta.firstCourse.oAux.origin,
          String((soap.o || {}).aux || '').trim() ? 'legacy' : ''
        );
        assert.equal(
          record.documentMeta.firstCourse.basis.origin,
          (String((soap.a || {}).basis || '').trim() ||
            ((soap.a || {}).basisDetail || []).length) ? 'legacy' : ''
        );
        assert.equal(
          record.documentMeta.discharge.admitCondition.origin,
          String((body.discharge || {}).admitCondition || '').trim() ? 'legacy' : ''
        );
        assert.equal(
          record.documentMeta.discharge.diagnoses.origin,
          ((body.discharge || {}).diagnoses || []).length ? 'legacy' : ''
        );
        assert.equal(record.documentMeta.discharge.diagnoses.confirmed, false);
      }
    });
  }
});

test('旧版整份 current 槽会迁到按病历 id 保存的草稿键', async t => {
  for (const fixture of LEGACY_FIXTURES.filter(x => x.format === 'record' && x.version < 3)) {
    await t.test(fixture.file, () => {
      const raw = fs.readFileSync(path.join(FIXTURE_DIR, fixture.file), 'utf8');
      const storage = CORE.memoryStorage([[CORE.STORAGE_KEYS.current, raw]]);
      const loaded = CORE.loadCurrent(storage, SCHEMA.emptyRecord, DEPT_KEYS);

      assert.equal(loaded.ok, true);
      assert.equal(loaded.migrated, true);
      assert.equal(loaded.record.basic.name, fixture.expected.name);
      assert.equal(loaded.record.schemaVersion, 3);

      const draftRaw = storage.getItem(CORE.draftKey(loaded.record.id));
      assert.ok(draftRaw, '迁移后的草稿应写入 dabingli.draft.v1.<id>');
      assert.equal(JSON.parse(draftRaw).basic.name, fixture.expected.name);

      const pointer = JSON.parse(storage.getItem(CORE.STORAGE_KEYS.current));
      assert.equal(pointer.id, loaded.record.id);
      assert.equal(typeof pointer.at, 'string');
      assert.equal(pointer.basic, undefined, 'current 槽应只保留指针，不再保存整份病历');
    });
  }
});

/* 科室 -> 模板数。通用科是刻意保留的空科室，不参与 57 份模板。 */
const EXPECTED_DEPARTMENT_TEMPLATE_COUNTS = Object.freeze({
  general: 0,
  respiratory: 6,
  digestive: 6,
  cardiology: 5,
  endocrinology: 5,
  nephrology: 5,
  hematology: 3,
  neurology: 5,
  surgery: 7,
  obstetrics: 3,
  gynecology: 3,
  pediatrics: 3,
  emergency: 3,
  psychiatry: 3
});

const EXPECTED_DEPARTMENT_NAMES = Object.freeze({
  general: '通用/全科',
  respiratory: '呼吸内科',
  digestive: '消化内科',
  cardiology: '心血管内科',
  endocrinology: '内分泌科',
  nephrology: '肾内科',
  hematology: '血液内科',
  neurology: '神经内科',
  surgery: '外科（普外/骨科等）',
  obstetrics: '产科',
  gynecology: '妇科',
  pediatrics: '儿科',
  emergency: '急诊/ICU',
  psychiatry: '精神科'
});

test('模板总数冻结为 57，13 个专科与通用科的归属和数量不变', () => {
  assert.equal(TEMPLATES.all().length, 57);
  assert.equal(TEMPLATES.listByDept('general').length, 0);
  assert.equal(SCHEMA.DEPARTMENTS.length, 14);

  const actualCounts = {};
  const actualNames = {};
  SCHEMA.DEPARTMENTS.forEach(dept => {
    actualCounts[dept.key] = TEMPLATES.listByDept(dept.key).length;
    actualNames[dept.key] = dept.name;
  });

  assert.deepEqual(actualCounts, EXPECTED_DEPARTMENT_TEMPLATE_COUNTS);
  assert.deepEqual(actualNames, EXPECTED_DEPARTMENT_NAMES);
  assert.equal(
    Object.values(EXPECTED_DEPARTMENT_TEMPLATE_COUNTS)
      .filter((_, i) => Object.keys(EXPECTED_DEPARTMENT_TEMPLATE_COUNTS)[i] !== 'general')
      .reduce((sum, count) => sum + count, 0),
    57
  );

  const templateDepts = new Set(TEMPLATES.all().map(t => t.dept));
  assert.deepEqual(
    [...templateDepts].sort(),
    Object.keys(EXPECTED_DEPARTMENT_TEMPLATE_COUNTS)
      .filter(key => key !== 'general')
      .sort()
  );
});

test('localStorage 键名自 v1 起保持不变', () => {
  assert.deepEqual(CORE.STORAGE_KEYS, {
    list: 'dabingli.records.v1',
    current: 'dabingli.current.v1',
    draftPrefix: 'dabingli.draft.v1.',
    settings: 'dabingli.settings.v1'
  });
  assert.equal(CORE.draftKey('legacy-v1-respiratory'), 'dabingli.draft.v1.legacy-v1-respiratory');
});

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

test('Android applicationId 固定为 com.xjb.bingli，WebView origin 固定为 appassets', () => {
  const androidAppDir = path.join(ROOT, 'android', 'app');
  const gradleFiles = fs.readdirSync(androidAppDir)
    .filter(name => /^build\.gradle(?:\.kts)?$/.test(name));
  assert.ok(gradleFiles.length > 0, '未找到 android/app/build.gradle*');

  const applicationIds = [];
  for (const file of gradleFiles) {
    const text = fs.readFileSync(path.join(androidAppDir, file), 'utf8');
    const matches = [...text.matchAll(/\bapplicationId\s*=?\s*['"]([^'"]+)['"]/g)]
      .map(match => match[1]);
    assert.ok(matches.length > 0, `${file} 中未声明 applicationId`);
    applicationIds.push(...matches);
  }
  assert.deepEqual([...new Set(applicationIds)], ['com.xjb.bingli']);

  const javaFiles = walkFiles(path.join(androidAppDir, 'src', 'main'))
    .filter(file => file.endsWith('.java'));
  const mainActivity = javaFiles.find(file => path.basename(file) === 'MainActivity.java');
  assert.ok(mainActivity, '未找到 MainActivity.java');
  const source = fs.readFileSync(mainActivity, 'utf8');
  assert.match(source, /https:\/\/appassets\.androidplatform\.net/);
  assert.match(
    source,
    /private static final String ORIGIN = "https:\/\/appassets\.androidplatform\.net"/
  );
});
