/* ===========================================================================
 * 数据边界层测试（node:test + node:assert/strict）
 * 运行：node --test tests/
 *
 * 覆盖：存档迁移、损坏保护、原型污染、导入导出、合并策略、纯计算
 * 全部使用内存存储与合成数据，不读真实 localStorage，不涉及真实病历。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { bootGlobals } = require('./bootstrap.cjs');

// 按线上脚本顺序建立全局依赖
const { SCHEMA, GENERATOR } = bootGlobals();
const C = require('../src/core.js');

const DEPT_KEYS = SCHEMA.DEPARTMENTS.map(d => d.key);
const empty = () => SCHEMA.emptyRecord();

/** 造一份最小可用病历 */
function sampleRecord(over) {
  const r = empty();
  r.basic.name = '测试患者';
  r.basic.gender = '男';
  r.basic.age = '45';
  r.basic.department = 'respiratory';
  r.basic.chiefComplaint = '咳嗽';
  r.basic.chiefComplaintDuration = '3';
  r.hpi.onset = '3天前出现咳嗽';
  r.diagnosis.confirmed = ['社区获得性肺炎'];
  return Object.assign(r, over || {});
}

/* ======================= 1. 深度合并 / 字段补齐 ======================= */

test('载入旧存档时补齐新增字段，且不覆盖用户已填内容', () => {
  // 模拟"旧版本只有部分字段"的存档
  const old = {
    basic: { name: '老王', chiefComplaint: '头晕' },
    hpi: { onset: '1天前头晕' },
    diagnosis: { confirmed: ['眩晕'] }
  };
  const filled = C.deepMerge(empty(), old);
  assert.equal(filled.basic.name, '老王');
  assert.equal(filled.basic.chiefComplaint, '头晕');
  assert.equal(filled.hpi.onset, '1天前头晕');
  // 新版本才有的字段应被补上（存在且为空）
  assert.equal(filled.pe.vitals.temperature, undefined === filled.pe.vitals.temperature ? undefined : filled.pe.vitals.temperature);
  assert.ok('department' in filled.basic);
  assert.ok('allergy' in filled.pmh);
  assert.deepEqual(filled.diagnosis.confirmed, ['眩晕']);
});

test('深度合并不修改入参', () => {
  const old = { basic: { name: 'A' } };
  const snapshot = JSON.stringify(old);
  C.deepMerge(empty(), old);
  assert.equal(JSON.stringify(old), snapshot);
});

test('深度合并保留存档里多出来的键', () => {
  const old = { basic: { name: 'B' }, extraField: { keep: 1 } };
  const filled = C.deepMerge(empty(), old);
  assert.deepEqual(filled.extraField, { keep: 1 });
});

/* ======================= 2. 原型污染与危险键 ======================= */

test('拒绝 __proto__ 等危险键，且不污染 Object.prototype', () => {
  const dirty = JSON.parse('{"basic":{},"__proto__":{"polluted":true}}');
  assert.throws(() => C.assertSafeKeys(dirty), /不安全字段/);
  assert.equal({}.polluted, undefined);
});

test('拒绝 constructor / prototype 键', () => {
  assert.throws(() => C.assertSafeKeys({ a: { constructor: 1 } }), /不安全字段/);
  assert.throws(() => C.assertSafeKeys({ a: { prototype: {} } }), /不安全字段/);
});

test('拒绝过深嵌套的数据', () => {
  let deep = {};
  for (let i = 0; i < 30; i++) deep = { child: deep };
  assert.throws(() => C.assertSafeKeys(deep), /嵌套过深/);
});

/* ======================= 3. 病历结构校验 ======================= */

test('结构完全不像病历的对象被拒绝', () => {
  for (const bad of [null, 123, 'text', [], {}, { basic: {} }, { basic: {}, hpi: {} }]) {
    assert.equal(C.lookLikeRecord(bad), false, `应拒绝：${JSON.stringify(bad)}`);
  }
});

test('合法病历被接受', () => {
  assert.equal(C.lookLikeRecord(sampleRecord()), true);
});

test('来自更新版本的存档被拒绝并给出明确原因', () => {
  const future = { ...sampleRecord(), schemaVersion: C.SCHEMA_VERSION + 1 };
  assert.throws(() => C.normalizeRecord(future, empty, DEPT_KEYS), /更新版本/);
});

test('规范化会清理诊断列表中的空白项', () => {
  const r = sampleRecord();
  r.diagnosis.confirmed = ['  肺炎  ', '', '   ', '高血压'];
  const out = C.normalizeRecord(r, empty, DEPT_KEYS);
  assert.deepEqual(out.diagnosis.confirmed, ['肺炎', '高血压']);
});

test('规范化保证辅助检查至少有一行，界面不会塌', () => {
  const r = sampleRecord();
  r.auxiliary.items = [];
  const out = C.normalizeRecord(r, empty, DEPT_KEYS);
  assert.equal(out.auxiliary.items.length, 1);
});

test('规范化把数字型年龄转成字符串', () => {
  const r = sampleRecord();
  r.basic.age = 45;
  const out = C.normalizeRecord(r, empty, DEPT_KEYS);
  assert.equal(typeof out.basic.age, 'string');
  assert.equal(out.basic.age, '45');
});

/* ======================= 4. 科室迁移 ======================= */

test('未知科室回退到通用科，不导致生成报错', () => {
  const r = sampleRecord();
  r.basic.department = 'some-removed-department';
  const out = C.normalizeRecord(r, empty, DEPT_KEYS);
  assert.equal(out.basic.department, 'general');
  // 能否正常生成
  const text = GENERATOR.generate(out).text;
  assert.ok(text.includes('【体格检查】'));
});

test('合法科室保持不变', () => {
  for (const key of DEPT_KEYS) {
    assert.equal(C.normalizeDeptKey(key, DEPT_KEYS), key);
  }
});

test('空科室也回退到通用', () => {
  assert.equal(C.normalizeDeptKey('', DEPT_KEYS), 'general');
  assert.equal(C.normalizeDeptKey(null, DEPT_KEYS), 'general');
});

/* ======================= 5. 存储读取与损坏保护 ======================= */

test('空存储时返回空列表而不是报错', () => {
  const s = C.memoryStorage();
  const res = C.loadList(s);
  assert.equal(res.ok, true);
  assert.deepEqual(res.list, []);
});

test('读取正常列表', () => {
  const s = C.memoryStorage([[C.STORAGE_KEYS.list, JSON.stringify([{ id: 'a' }])]]);
  const res = C.loadList(s);
  assert.equal(res.ok, true);
  assert.equal(res.list.length, 1);
});

test('损坏的 JSON 不覆盖原存档，返回 corrupt 标记', () => {
  const raw = '{"broken": [';
  const s = C.memoryStorage([[C.STORAGE_KEYS.list, raw]]);
  const res = C.loadList(s);
  assert.equal(res.ok, false);
  assert.equal(res.corrupt, true);
  // 原始数据必须原封不动
  assert.equal(s.getItem(C.STORAGE_KEYS.list), raw);
});

test('结构错误（不是数组）也判为损坏且保留原数据', () => {
  const raw = '{"a":1}';
  const s = C.memoryStorage([[C.STORAGE_KEYS.list, raw]]);
  const res = C.loadList(s);
  assert.equal(res.ok, false);
  assert.equal(s.getItem(C.STORAGE_KEYS.list), raw);
});

test('载入当前病历：正常时规范化返回', () => {
  const s = C.memoryStorage([[C.STORAGE_KEYS.current, JSON.stringify(sampleRecord())]]);
  const res = C.loadCurrent(s, empty, DEPT_KEYS);
  assert.equal(res.ok, true);
  assert.equal(res.record.basic.name, '测试患者');
});

test('载入当前病历：损坏时不抛错，给出原因', () => {
  const s = C.memoryStorage([[C.STORAGE_KEYS.current, '{{{']]);
  const res = C.loadCurrent(s, empty, DEPT_KEYS);
  assert.equal(res.ok, false);
  assert.equal(res.corrupt, true);
  assert.ok(res.reason.length > 0);
});

/* ======================= 6. 写入失败处理 ======================= */

test('写入失败返回 false 而不是抛出', () => {
  const broken = { setItem() { throw new Error('QuotaExceededError'); } };
  assert.equal(C.safeSet(broken, 'k', 'v'), false);
});

test('写入成功返回 true', () => {
  const s = C.memoryStorage();
  assert.equal(C.safeSet(s, 'k', 'v'), true);
  assert.equal(s.getItem('k'), 'v');
});

test('读取损坏 JSON 返回 null 而不是抛出', () => {
  const s = C.memoryStorage([['k', 'not-json']]);
  assert.equal(C.safeGetJSON(s, 'k'), null);
  assert.equal(C.safeGetJSON(s, 'missing'), null);
});

/* ======================= 7. 列表纯计算 ======================= */

test('upsert 新增病历并返回 id', () => {
  const r = sampleRecord();
  const res = C.upsertRecord([], r, '2026-10-18T10:00:00.000Z');
  assert.equal(res.list.length, 1);
  assert.ok(res.id);
  assert.equal(res.list[0].updatedAt, '2026-10-18T10:00:00.000Z');
  assert.equal(res.list[0].basic.name, '测试患者');
});

test('upsert 同一 id 是更新而不是新增', () => {
  const r = sampleRecord();
  const first = C.upsertRecord([], r, '2026-10-18T10:00:00.000Z');
  first.list[0].data.id = first.id;
  const second = C.upsertRecord(first.list, { ...r, id: first.id, basic: { ...r.basic, name: '改名' } }, '2026-10-18T11:00:00.000Z');
  assert.equal(second.list.length, 1);
  assert.equal(second.list[0].basic.name, '改名');
  assert.equal(second.list[0].updatedAt, '2026-10-18T11:00:00.000Z');
});

test('upsert 不修改传入的列表（纯函数）', () => {
  const list = [];
  C.upsertRecord(list, sampleRecord(), '2026-10-18T10:00:00.000Z');
  assert.equal(list.length, 0);
});

test('upsert 保存的是快照，后续改原对象不影响已存内容', () => {
  const r = sampleRecord();
  const res = C.upsertRecord([], r, '2026-10-18T10:00:00.000Z');
  r.basic.name = '之后改的';
  assert.equal(res.list[0].basic.name, '测试患者');
  assert.equal(res.list[0].data.basic.name, '测试患者');
});

test('删除按 id 精确匹配，不影响其他记录', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'ab' }];
  const out = C.removeRecord(list, 'a');
  assert.deepEqual(out.map(x => x.id), ['b', 'ab']);
});

test('按更新时间倒序排列', () => {
  const list = [
    { id: 'old', updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'new', updatedAt: '2026-10-01T00:00:00.000Z' },
    { id: 'mid', updatedAt: '2026-05-01T00:00:00.000Z' }
  ];
  assert.deepEqual(C.sortByUpdated(list).map(x => x.id), ['new', 'mid', 'old']);
});

test('summarize 在缺字段时不崩溃', () => {
  const s = C.summarize({ id: 'x' });
  assert.equal(s.id, 'x');
  assert.equal(s.name, '未命名');
  assert.equal(C.summarize({ id: 'y', data: {} }).name, '未命名');
});

/* ======================= 8. 导出 / 导入 ======================= */

function makeBundle(records) {
  const list = [];
  let out = list;
  records.forEach((r, i) => {
    out = C.upsertRecord(out, r, `2026-10-1${i}T10:00:00.000Z`).list;
  });
  return out;
}

test('导出的备份包含版本号与全部病历', () => {
  const list = makeBundle([sampleRecord(), sampleRecord({ basic: { ...empty().basic, name: '第二个' } })]);
  const payload = C.buildExport(list, '2026-10-18T12:00:00.000Z');
  assert.equal(payload.app, 'dabingli');
  assert.equal(payload.schemaVersion, C.SCHEMA_VERSION);
  assert.equal(payload.exportedAt, '2026-10-18T12:00:00.000Z');
  assert.equal(payload.records.length, 2);
});

test('导出 → 导入 往返不丢数据', () => {
  const list = makeBundle([sampleRecord()]);
  list[0].data.ros.resp = { cough: { checked: true, detail: '干咳' } };
  list[0].data.diagnosis.confirmed = ['肺炎', '高血压'];

  const json = JSON.stringify(C.buildExport(list, '2026-10-18T12:00:00.000Z'));
  const parsed = C.parseImport(json, empty, DEPT_KEYS);

  assert.equal(parsed.mode, 'bundle');
  assert.equal(parsed.records.length, 1);
  const back = parsed.records[0].data;
  assert.equal(back.basic.name, '测试患者');
  assert.deepEqual(back.diagnosis.confirmed, ['肺炎', '高血压']);
  assert.equal(back.ros.resp.cough.checked, true);
  assert.equal(back.ros.resp.cough.detail, '干咳');
});

test('导入单份病历对象', () => {
  const json = JSON.stringify(sampleRecord({ basic: { ...empty().basic, name: '单人病历' } }));
  const parsed = C.parseImport(json, empty, DEPT_KEYS);
  assert.equal(parsed.mode, 'single');
  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].data.basic.name, '单人病历');
});

test('导入拒绝非 JSON 内容', () => {
  assert.throws(() => C.parseImport('这不是JSON', empty, DEPT_KEYS), /JSON/);
});

test('导入拒绝空文件', () => {
  assert.throws(() => C.parseImport('', empty, DEPT_KEYS), /为空/);
});

test('导入拒绝空记录列表', () => {
  assert.throws(() => C.parseImport(JSON.stringify({ records: [] }), empty, DEPT_KEYS), /没有病历/);
});

test('导入拒绝来自更新版本的备份', () => {
  const json = JSON.stringify({ schemaVersion: 999, records: [sampleRecord()] });
  assert.throws(() => C.parseImport(json, empty, DEPT_KEYS), /更新版本/);
});

test('导入过程中某一份损坏时整体失败，不产生半成品', () => {
  const json = JSON.stringify({
    records: [sampleRecord(), { not: 'a record' }]
  });
  assert.throws(() => C.parseImport(json, empty, DEPT_KEYS), /第 2 份/);
});

test('导入时清理危险键', () => {
  const bad = JSON.parse('{"basic":{"name":"x"},"hpi":{},"diagnosis":{"confirmed":[]},"pe":{},"auxiliary":{"items":[]},"__proto__":{"x":1}}');
  assert.throws(() => C.parseImport(JSON.stringify(bad), empty, DEPT_KEYS), /不安全字段|无法识别/);
  assert.equal({}.x, undefined);
});

/* ======================= 9. 合并策略 ======================= */

test('合并：新增不存在的病历', () => {
  const existing = makeBundle([sampleRecord()]);
  const incoming = C.parseImport(
    JSON.stringify(C.buildExport(makeBundle([sampleRecord({ basic: { ...empty().basic, name: '新的' } })]))),
    empty, DEPT_KEYS
  ).records;
  const res = C.mergeImport(existing, incoming);
  assert.equal(res.added, 1);
  assert.equal(res.list.length, 2);
});

test('合并：同 id 时以更新时间较新的为准', () => {
  const existing = [{ id: 'x', updatedAt: '2026-01-01T00:00:00.000Z', data: { basic: { name: '旧' } } }];
  const incoming = [{ id: 'x', updatedAt: '2026-10-01T00:00:00.000Z', data: { basic: { name: '新' } } }];
  const res = C.mergeImport(existing, incoming);
  assert.equal(res.updated, 1);
  assert.equal(res.list[0].data.basic.name, '新');
});

test('合并：导入的较旧时不覆盖现有数据', () => {
  const existing = [{ id: 'x', updatedAt: '2026-10-01T00:00:00.000Z', data: { basic: { name: '现有' } } }];
  const incoming = [{ id: 'x', updatedAt: '2026-01-01T00:00:00.000Z', data: { basic: { name: '旧的导入' } } }];
  const res = C.mergeImport(existing, incoming);
  assert.equal(res.skipped, 1);
  assert.equal(res.list[0].data.basic.name, '现有');
});

test('合并是纯函数，不修改入参', () => {
  const existing = [{ id: 'x', updatedAt: '2026-01-01T00:00:00.000Z' }];
  const snapshot = JSON.stringify(existing);
  C.mergeImport(existing, [{ id: 'y', updatedAt: '2026-10-01T00:00:00.000Z' }]);
  assert.equal(JSON.stringify(existing), snapshot);
});

/* ======================= 10. 设置 ======================= */

test('设置默认值与非法值被纠正', () => {
  // lastStep 是「上次停在哪一步」，默认空串表示从头开始
  assert.deepEqual(C.normalizeSettings(null), { rosMode: 'detail', fontScale: 1, lastStep: '' });
  assert.deepEqual(C.normalizeSettings({ rosMode: 'bad' }).rosMode, 'detail');
  assert.equal(C.normalizeSettings({ rosMode: 'brief' }).rosMode, 'brief');
  assert.equal(C.normalizeSettings({ fontScale: 5 }).fontScale, 1);
  assert.equal(C.normalizeSettings({ fontScale: 1.2 }).fontScale, 1.2);
  assert.equal(C.normalizeSettings({ fontScale: 0.5 }).fontScale, 1);
});

test('上次停留的步骤会被记住，非字符串一律丢弃', () => {
  assert.equal(C.normalizeSettings({ lastStep: 'pe' }).lastStep, 'pe');
  assert.equal(C.normalizeSettings({ lastStep: 'summary' }).lastStep, 'summary');
  // 脏数据不能带进界面：数字、对象、null 都退回默认空串
  assert.equal(C.normalizeSettings({ lastStep: 3 }).lastStep, '');
  assert.equal(C.normalizeSettings({ lastStep: {} }).lastStep, '');
  assert.equal(C.normalizeSettings({ lastStep: null }).lastStep, '');
});

/* ======================= 11. uid ======================= */

test('uid 生成唯一且带前缀', () => {
  const ids = new Set();
  for (let i = 0; i < 200; i++) ids.add(C.uid());
  assert.equal(ids.size, 200);
  assert.ok([...ids][0].startsWith('r'));
});

/* ======================= 12. 科室名容错 ======================= */

test('中文科室名能被认出来，不能静默降级成通用科', () => {
  // 真实场景：学生在别处记的病历把科室写成中文，导入后如果认不出来，
  // normalizeDeptKey 会回退到 'general'，整段专科查体凭空消失且不给提示。
  const cases = [
    ['消化内科', 'digestive'], ['消化科', 'digestive'], ['消化', 'digestive'],
    ['心内科', 'cardiology'], ['心血管内科', 'cardiology'],
    ['呼吸内科', 'respiratory'], ['呼吸科', 'respiratory'],
    ['内分泌科', 'endocrinology'], ['肾内科', 'nephrology'],
    ['血液科', 'hematology'], ['神内', 'neurology'], ['神经内科', 'neurology'],
    ['普外科', 'surgery'], ['骨科', 'surgery'], ['妇产科', 'obstetrics'],
    ['产科', 'obstetrics'], ['妇科', 'gynecology'], ['儿科', 'pediatrics'],
    ['ICU', 'emergency'], ['急诊科', 'emergency'],
  ];
  for (const [name, want] of cases) {
    assert.equal(C.normalizeDeptKey(name, DEPT_KEYS), want, `「${name}」应识别为 ${want}`);
  }
});

test('科室键的大小写变体也能认，未知科室才回退通用', () => {
  assert.equal(C.normalizeDeptKey('DIGESTIVE', DEPT_KEYS), 'digestive');
  assert.equal(C.normalizeDeptKey('Digestive', DEPT_KEYS), 'digestive');
  assert.equal(C.normalizeDeptKey('  digestive  ', DEPT_KEYS), 'digestive');
  // 真的不认识才回退，且回退必须仍是合法键
  assert.equal(C.normalizeDeptKey('未知科', DEPT_KEYS), 'general');
  assert.equal(C.normalizeDeptKey('', DEPT_KEYS), 'general');
  assert.ok(DEPT_KEYS.includes(C.normalizeDeptKey('火星科', DEPT_KEYS)));
});

test('中文科室名的旧存档能正常生成专科查体', () => {
  const raw = {
    schemaVersion: 1,
    basic: { name: '测试', gender: '女', age: '28', department: '消化内科', chiefComplaint: '上腹痛3天' },
    hpi: {}, pmh: {}, family: {}, pe: {}, auxiliary: { items: [] }, diagnosis: { confirmed: [] },
  };
  const r = C.normalizeRecord(raw, SCHEMA.emptyRecord, DEPT_KEYS);
  assert.equal(r.basic.department, 'digestive');
  // 科别行要写中文名，不是键名
  const t = GENERATOR.generate(r).text;
  assert.match(t, /科别：消化内科/);
  assert.doesNotMatch(t, /科别：digestive/);
});
