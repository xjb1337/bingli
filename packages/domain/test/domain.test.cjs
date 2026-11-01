'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const schema = require(path.join(ROOT, 'packages', 'domain', 'dist', 'schema.js'));
const data = require(path.join(ROOT, 'packages', 'domain', 'dist', 'template-data.js'));
globalThis.SCHEMA = schema;
globalThis.TEMPLATE_DATA = data;
const legacy = require(path.join(ROOT, 'src', 'core.js'));
const domain = require(path.join(ROOT, 'packages', 'domain', 'dist', 'core.js'));
const templates = require(path.join(ROOT, 'packages', 'domain', 'dist', 'templates.js'));
const generator = require(path.join(ROOT, 'packages', 'domain', 'dist', 'generator.js'));
const migrations = require(path.join(ROOT, 'packages', 'domain', 'dist', 'migrations', 'index.js'));
globalThis.AGE = require(path.join(ROOT, 'packages', 'domain', 'dist', 'age.js'));
globalThis.RECORD_CORE = domain;

test('domain keeps the frozen counts', () => {
  assert.equal(schema.DEPARTMENTS.length, 14);
  assert.equal(data.length, 57);
  assert.equal(templates.all().length, 57);
});

test('migrated legacy fixture key hashes match old compatibility path', () => {
  const files = ['v1-record.json', 'v1-backup.json', 'v2-record.json', 'v2-backup.json', 'v3-record.json', 'v3-backup.json'];
  const keyPaths = ['id', 'schemaVersion', 'basic.name', 'basic.gender', 'basic.age', 'basic.department', 'basic.chiefComplaint', 'hpi', 'diagnosis', 'pe', 'auxiliary', 'summary', 'soap', 'discharge'];
  const get = (x, p) => p.split('.').reduce((v, k) => v == null ? undefined : v[k], x);
  const hash = (record) => crypto.createHash('sha256').update(JSON.stringify(keyPaths.map((p) => [p, get(record, p)]))).digest('hex');
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'legacy', file), 'utf8'));
    const records = Array.isArray(raw.records) ? raw.records.map((entry) => entry && entry.data ? entry.data : entry) : [raw];
    for (const input of records) {
      const args = [schema.emptyRecord, schema.DEPARTMENTS.map((d) => d.key)];
      const oldRecord = legacy.normalizeRecord(input, ...args);
      const newRecord = domain.normalizeRecord(input, ...args);
      assert.equal(hash(newRecord), hash(oldRecord), file);
    }
  }
});



test('migration adapters preserve single and backup import formats', () => {
  const single = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'legacy', 'v1-record.json'), 'utf8'));
  const backup = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'legacy', 'v1-backup.json'), 'utf8'));
  assert.equal(migrations.parseImport(JSON.stringify(single)).mode, 'single');
  assert.equal(migrations.parseImport(JSON.stringify(backup)).mode, 'bundle');
  const exported = migrations.buildExport([{ id: 'x', updatedAt: '', data: migrations.migrateRecord(single) }], '2026-11-01T00:00:00.000Z');
  assert.equal(exported.schemaVersion, 3);
  assert.equal(exported.records.length, 1);
});

test('document IR covers the three legacy document outputs', () => {
  const record = schema.emptyRecord();
  const bundle = generator.buildDocumentBundle(record, { date: '2026-11-01 10:00' });
  assert.deepEqual(Object.keys(bundle), ['record', 'firstCourse', 'discharge']);
  for (const [kind, ir] of Object.entries(bundle)) {
    assert.equal(ir.kind, kind);
    assert.equal(typeof ir.text, 'string');
    assert.ok(Array.isArray(ir.sections));
    assert.ok(ir.sections.every((part) => Array.isArray(part.paragraphs) && Array.isArray(part.facts)));
  }
  assert.equal(bundle.record.text, generator.generate(record).text);
});

test('domain sources contain no browser globals', () => {
  const files = fs.readdirSync(path.join(ROOT, 'packages', 'domain', 'src'), { recursive: true })
    .filter((f) => String(f).endsWith('.ts'));
  for (const rel of files) {
    const text = fs.readFileSync(path.join(ROOT, 'packages', 'domain', 'src', rel), 'utf8');
    assert.doesNotMatch(text, /\b(?:window|HTMLElement|localStorage|sessionStorage)\s*\./, rel);
    assert.doesNotMatch(text, /\b(?:window|document)\s*\[/, rel);
  }
});
