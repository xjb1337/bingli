import { afterEach, describe, expect, it } from 'vitest';
import { RECORD_CORE, SCHEMA, type DabingliRecord, type RecordListItem } from '@dabingli/domain';
import {
  createIndexedDbRepository,
  type IndexedDbRecordRepository,
  type LegacyMigrationResult,
} from '../src/index.js';
import { databaseName, memoryStorage, removeDatabase, type MemoryStorage } from './helpers.js';
import v1Record from '../../../tests/fixtures/legacy/v1-record.json';
import v2Record from '../../../tests/fixtures/legacy/v2-record.json';
import v3Record from '../../../tests/fixtures/legacy/v3-record.json';
import mergedRecord from '../../../tests/fixtures/template-alignment/legacy-v2-merged.json';

const FIXED_NOW = '2026-11-01T13:00:00.000Z';
const repositories: IndexedDbRecordRepository[] = [];
const databaseNames: string[] = [];

function nextDatabaseName(label: string): string {
  const name = databaseName(label);
  databaseNames.push(name);
  return name;
}

function makeRepository(
  name: string,
  storage: MemoryStorage,
  autoMigrate = true,
): IndexedDbRecordRepository {
  const repository = createIndexedDbRepository({
    databaseName: name,
    legacyStorage: storage,
    autoMigrate,
    now: () => FIXED_NOW,
  });
  repositories.push(repository);
  return repository;
}

function records(): DabingliRecord[] {
  return [v1Record, v2Record, v3Record] as unknown as DabingliRecord[];
}

function seedLegacy(storage: MemoryStorage): void {
  const keys = RECORD_CORE.STORAGE_KEYS;
  const fixtures = records();
  const list: RecordListItem[] = fixtures.map((record) => ({
    id: record.id!,
    updatedAt: record.updatedAt!,
    schemaVersion: record.schemaVersion,
    data: record,
  }));
  storage.setItem(keys.list, JSON.stringify(list));
  for (const record of fixtures) {
    storage.setItem(RECORD_CORE.draftKey(record.id!), JSON.stringify(record));
  }
  storage.setItem(keys.current, JSON.stringify({ id: 'legacy-v3-obstetrics', at: FIXED_NOW }));
  storage.setItem(
    keys.settings,
    JSON.stringify({ rosMode: 'brief', fontScale: 1.15, lastStep: 'pe' }),
  );
}

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.close()));
  await Promise.all(databaseNames.splice(0).map((name) => removeDatabase(name)));
});

describe('browser legacy localStorage migration', () => {
  it('retains raw ROS and merged history across IndexedDB migration, backup and reopening', async () => {
    const storage = memoryStorage();
    const keys = RECORD_CORE.STORAGE_KEYS;
    storage.setItem(keys.list, JSON.stringify([{ id: mergedRecord.id, data: mergedRecord }]));
    storage.setItem(keys.current, JSON.stringify({ id: mergedRecord.id, at: FIXED_NOW }));
    const before = storage.snapshot();
    const name = nextDatabaseName('hospital-legacy');
    const repository = makeRepository(name, storage);
    expect((await repository.initialize()).ok).toBe(true);
    const migrated = (await repository.loadCurrent(mergedRecord.id)).record;
    expect(migrated?.ros).toEqual(mergedRecord.ros);
    expect(migrated?.pmh.diseaseDetail).toBe(mergedRecord.pmh);
    expect(migrated?.auxiliary.items).toHaveLength(4);
    const bundle = await repository.exportBackup('all');
    const imported = RECORD_CORE.parseImport(JSON.stringify(bundle), SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(item => item.key));
    expect(imported.records[0]?.data.ros).toEqual(mergedRecord.ros);
    expect(imported.records[0]?.data.auxiliary.items).toEqual(migrated?.auxiliary.items);
    await repository.close();
    const reopened = makeRepository(name, storage);
    expect((await reopened.initialize()).ok).toBe(true);
    expect((await reopened.loadCurrent(mergedRecord.id)).record?.ros).toEqual(mergedRecord.ros);
    expect(storage.snapshot()).toEqual(before);
  });
  it('migrates v1/v2/v3 fixtures, preserves unknown fields, and leaves localStorage untouched', async () => {
    const storage = memoryStorage();
    seedLegacy(storage);
    const before = storage.snapshot();
    const repository = makeRepository(nextDatabaseName('migrate-fixtures'), storage);

    const initialized = await repository.initialize();
    expect(initialized.ok).toBe(true);
    expect(initialized.migration).toMatchObject({
      status: 'migrated',
      recordCount: 3,
      draftCount: 3,
      currentId: 'legacy-v3-obstetrics',
      settingsMigrated: true,
    });

    const list = await repository.loadList();
    expect(list.list).toHaveLength(3);
    expect((await repository.loadCurrent()).record?.basic.name).toBe('测试患者戊');
    expect((await repository.loadSettings()).settings).toMatchObject({
      rosMode: 'brief',
      fontScale: 1.15,
      lastStep: 'pe',
    });

    const v1 = await repository.loadCurrent('legacy-v1-respiratory');
    expect(v1.ok).toBe(true);
    expect(v1.record?.schemaVersion).toBe(RECORD_CORE.SCHEMA_VERSION);
    expect(v1.record?.legacyUnknown).toEqual(v1Record.legacyUnknown);
    expect(v1.record?.basic.legacyBasicTag).toBe('旧版基本字段-合成');
    expect(v1.record?.meta.migratedFrom).toBe(1);
    expect(v1.record?.meta.migrationNotes).toContain('已从 v1 迁移到 v3');

    const meta = await repository.readMeta<LegacyMigrationResult>('browserLegacyMigration');
    expect(meta).toMatchObject({ status: 'migrated', recordCount: 3 });
    expect(storage.snapshot()).toEqual(before);

    const reopened = makeRepository(repository.databaseName, storage);
    const second = await reopened.initialize();
    expect(second.migration?.status).toBe('already-complete');
    expect((await reopened.loadList()).list).toHaveLength(3);
    expect(storage.snapshot()).toEqual(before);
  });

  it('migrates a legacy full current record without rewriting localStorage', async () => {
    const storage = memoryStorage();
    storage.setItem(RECORD_CORE.STORAGE_KEYS.current, JSON.stringify(v1Record));
    const before = storage.snapshot();
    const repository = makeRepository(nextDatabaseName('migrate-current'), storage);

    const initialized = await repository.initialize();
    expect(initialized.ok).toBe(true);
    expect(initialized.migration).toMatchObject({
      status: 'migrated',
      draftCount: 1,
      currentId: 'legacy-v1-respiratory',
    });
    expect((await repository.loadCurrent()).record?.basic.name).toBe('测试患者甲');
    expect(storage.snapshot()).toEqual(before);
  });

  it('does not overwrite a non-empty IndexedDB database', async () => {
    const name = nextDatabaseName('non-empty');
    const storage = memoryStorage();
    const seeded = makeRepository(name, memoryStorage(), false);
    await seeded.initialize();
    const record = seeded.newRecord();
    record.basic.name = 'IndexedDB 原有患者';
    expect((await seeded.saveToLibrary(record, 0)).ok).toBe(true);
    await seeded.close();

    seedLegacy(storage);
    const beforeLegacy = storage.snapshot();
    const repository = makeRepository(name, storage);
    const initialized = await repository.initialize();
    expect(initialized.ok).toBe(true);
    expect(initialized.migration?.status).toBe('skipped');
    expect((await repository.loadList()).list.map((item) => item.id)).toEqual([record.id]);
    expect((await repository.loadCurrent()).record?.basic.name).toBe('IndexedDB 原有患者');
    expect(storage.snapshot()).toEqual(beforeLegacy);
  });

  it('leaves existing IndexedDB data and localStorage unchanged when legacy data is corrupt', async () => {
    const name = nextDatabaseName('corrupt-legacy');
    const storage = memoryStorage();
    const seeded = makeRepository(name, memoryStorage(), false);
    await seeded.initialize();
    const record = seeded.newRecord();
    record.basic.name = '损坏迁移前患者';
    expect((await seeded.saveToLibrary(record, 0)).ok).toBe(true);
    const beforeIdb = JSON.stringify(await seeded.exportBackup('all'));
    await seeded.close();

    storage.setItem(RECORD_CORE.STORAGE_KEYS.list, '{broken-json');
    const beforeLegacy = storage.snapshot();
    const repository = makeRepository(name, storage);
    const initialized = await repository.initialize();
    expect(initialized.ok).toBe(false);
    expect(initialized.migration?.status).toBe('failed');

    expect(JSON.stringify(await repository.exportBackup('all'))).toBe(beforeIdb);
    expect((await repository.loadCurrent()).record?.basic.name).toBe('损坏迁移前患者');
    expect(storage.snapshot()).toEqual(beforeLegacy);
  });
});
