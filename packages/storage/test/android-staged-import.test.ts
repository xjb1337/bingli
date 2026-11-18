import { afterEach, describe, expect, it } from 'vitest';
import { RECORD_CORE, type RecordListItem } from '@dabingli/domain';
import { createIndexedDbRepository, importStagedLegacy, type IndexedDbRecordRepository } from '../src/index.js';
import { databaseName, removeDatabase } from './helpers.js';
import v1Record from '../../../tests/fixtures/legacy/v1-record.json';
import v2Record from '../../../tests/fixtures/legacy/v2-record.json';
import v3Record from '../../../tests/fixtures/legacy/v3-record.json';

const repositories: IndexedDbRecordRepository[] = [];
const databases: string[] = [];
function repo(label: string) {
  const name = databaseName(label); databases.push(name);
  const r = createIndexedDbRepository({ databaseName: name, autoMigrate: false });
  repositories.push(r); return r;
}
function payload(mutate?: (records: any[]) => void): string {
  const records = JSON.parse(JSON.stringify([v1Record, v2Record, v3Record])) as any[];
  if (mutate) mutate(records);
  const keys: Record<string, string> = {
    [RECORD_CORE.STORAGE_KEYS.list]: JSON.stringify(records.map((data) => ({ id: data.id, updatedAt: data.updatedAt, schemaVersion: data.schemaVersion, basic: data.basic, data } as RecordListItem))),
    [RECORD_CORE.STORAGE_KEYS.current]: JSON.stringify({ id: records[2].id }),
    [RECORD_CORE.STORAGE_KEYS.settings]: JSON.stringify({ rosMode: 'brief' }),
  };
  for (const record of records) keys[RECORD_CORE.draftKey(record.id)] = JSON.stringify(record);
  return JSON.stringify({ keys });
}
afterEach(async () => { await Promise.all(repositories.splice(0).map((r) => r.close())); await Promise.all(databases.splice(0).map(removeDatabase)); });

describe('Android staged legacy import', () => {
  it('imports v1/v2/v3 fixtures and compares key fields', async () => {
    const r = repo('android-fixtures'); await r.initialize();
    const result = await importStagedLegacy(payload(), r);
    expect(result.recordCount).toBe(3);
    expect(result.ids).toEqual(['legacy-v1-respiratory', 'legacy-v2-digestive', 'legacy-v3-obstetrics']);
    expect(result.comparison.records).toBe(true);
    expect(result.comparison.exportJson).toBe(true);
    expect(result.comparison.perRecord.every((x) => x.name && x.chiefComplaint && x.diagnosis)).toBe(true);
  });
  it('rejects corrupt JSON before writing', async () => {
    const r = repo('android-corrupt'); await r.initialize();
    const broken = JSON.parse(payload()); broken.keys[RECORD_CORE.STORAGE_KEYS.list] = '{broken';
    await expect(importStagedLegacy(JSON.stringify(broken), r)).rejects.toThrow();
    expect((await r.loadList()).list).toHaveLength(0);
  });
  it('does not overwrite a non-empty database', async () => {
    const r = repo('android-nonempty'); await r.initialize();
    const record = r.newRecord(); record.basic.name = '已有患者';
    await r.saveToLibrary(record, 0);
    await expect(importStagedLegacy(payload(), r)).rejects.toThrow(/已有数据/);
    expect((await r.loadList()).list[0]!.data.basic.name).toBe('已有患者');
  });
  it('retries acknowledgement of the same staged payload without rewriting IndexedDB', async () => {
    const r = repo('android-acknowledgement'); await r.initialize();
    const staged = { payload: JSON.parse(payload()), manifest: { sha256: 'a'.repeat(64) } };
    const applied = await importStagedLegacy(JSON.stringify(staged), r);
    expect(applied.alreadyImported).toBeUndefined();
    const before = (await r.loadList()).list;

    const resumed = await importStagedLegacy(JSON.stringify(staged), r);
    expect(resumed.alreadyImported).toBe(true);
    expect((await r.loadList()).list).toEqual(before);

    const otherStage = { ...staged, manifest: { sha256: 'b'.repeat(64) } };
    await expect(importStagedLegacy(JSON.stringify(otherStage), r)).rejects.toThrow(/已有数据/);
  });
  it('keeps raw notes when migrating staged Android legacy data', async () => {
    const r = repo('android-raw-notes'); await r.initialize();
    const result = await importStagedLegacy(payload((records) => {
      records[2].rawNotes = '虚构迁移原始笔记';
    }), r);
    expect(result.comparison.records).toBe(true);
    expect(result.comparison.exportJson).toBe(true);
    const migrated = (await r.loadList()).list.find((item) => item.id === result.ids[2]);
    expect(migrated?.data.rawNotes).toBe('虚构迁移原始笔记');
    const exported = await r.exportBackup('all', { includeNotes: true });
    expect(exported.includesNotes).toBe(true);
    expect(exported.records.find((item) => item.id === result.ids[2])?.data.rawNotes)
      .toBe('虚构迁移原始笔记');
  });

  it('commits atomically and quarantines single corrupt staged drafts for export', async () => {
    const r = repo('android-quarantine'); await r.initialize();
    const staged = JSON.parse(payload()) as { keys: Record<string, string> };
    staged.keys[RECORD_CORE.draftKey('corrupt-orphan')] = '{not-valid-json';
    const result = await importStagedLegacy(JSON.stringify(staged), r);
    expect(result.recordCount).toBe(3);
    expect(result.corruptCount).toBe(1);
    expect(result.corruptEntries[0]?.raw).toBe('{not-valid-json');
    expect(await r.exportCorruptLegacyEntries()).toHaveLength(1);
  });
});
