import { afterEach, describe, expect, it } from 'vitest';
import { createIndexedDbRepository, serializeBackup, type IndexedDbRecordRepository } from '../src/index.js';
import { databaseName, removeDatabase } from './helpers.js';
import v1Backup from '../../../tests/fixtures/legacy/v1-backup.json';
import v2Backup from '../../../tests/fixtures/legacy/v2-backup.json';
import v3Backup from '../../../tests/fixtures/legacy/v3-backup.json';

const FIXED_NOW = '2026-11-01T12:00:00.000Z';
const repositories: IndexedDbRecordRepository[] = [];
const databaseNames: string[] = [];

function makeRepository(label: string, now = FIXED_NOW): IndexedDbRecordRepository {
  const name = databaseName(label);
  databaseNames.push(name);
  const repository = createIndexedDbRepository({
    databaseName: name,
    legacyStorage: false,
    now: () => now,
  });
  repositories.push(repository);
  return repository;
}

async function openRepository(label: string, now = FIXED_NOW): Promise<IndexedDbRecordRepository> {
  const repository = makeRepository(label, now);
  const initialized = await repository.initialize();
  expect(initialized.ok).toBe(true);
  return repository;
}

function newNamedRecord(repository: IndexedDbRecordRepository, name: string) {
  const record = repository.newRecord();
  record.basic.name = name;
  record.basic.gender = '女';
  record.basic.age = '36';
  record.hpi.onset = '3天前出现发热';
  return record;
}

afterEach(async () => {
  await Promise.all(repositories.splice(0).map((repository) => repository.close()));
  await Promise.all(databaseNames.splice(0).map((name) => removeDatabase(name)));
});

describe('IndexedDB repository', () => {
  it('continuously saves, opens, and deletes 100 records', async () => {
    const repository = await openRepository('hundred-records');
    const ids: string[] = [];

    for (let index = 0; index < 100; index += 1) {
      const saved = await repository.saveToLibrary(newNamedRecord(repository, `连续保存患者${index}`), 0);
      expect(saved.ok).toBe(true);
      if (!saved.record?.id) throw new Error(saved.reason ?? 'save failed');
      const id = saved.record.id;
      ids.push(id);

      const opened = await repository.loadCurrent(id);
      expect(opened.ok).toBe(true);
      expect(opened.record?.basic.name).toBe(`连续保存患者${index}`);
      expect(opened.record?.meta.revision).toBe(1);
    }

    expect(new Set(ids).size).toBe(100);
    expect((await repository.loadList()).list).toHaveLength(100);

    for (const id of ids) {
      const deleted = await repository.deleteRecord(id);
      expect(deleted.ok).toBe(true);
    }

    expect((await repository.loadList()).list).toHaveLength(0);
  });

  it('restores records and settings in a new repository instance', async () => {
    const name = databaseName('restart');
    databaseNames.push(name);
    const first = createIndexedDbRepository({ databaseName: name, legacyStorage: false, now: () => FIXED_NOW });
    repositories.push(first);
    await first.initialize();
    const saved = await first.saveToLibrary(newNamedRecord(first, '重启后仍在'), 0);
    expect(saved.ok).toBe(true);
    await first.saveSettings({ rosMode: 'brief', fontScale: 1.15, lastStep: 'pe' });
    await first.close();

    const second = createIndexedDbRepository({ databaseName: name, legacyStorage: false, now: () => FIXED_NOW });
    repositories.push(second);
    await second.initialize();
    expect((await second.loadCurrent()).record?.basic.name).toBe('重启后仍在');
    expect((await second.loadList()).list[0]?.data.basic.name).toBe('重启后仍在');
    expect((await second.loadSettings()).settings).toMatchObject({
      rosMode: 'brief',
      fontScale: 1.15,
      lastStep: 'pe',
    });
  });

  it('leaves existing data unchanged when an import fails', async () => {
    const repository = await openRepository('failed-import');
    const saved = await repository.saveToLibrary(newNamedRecord(repository, '不能被失败导入覆盖'), 0);
    expect(saved.ok).toBe(true);
    const before = JSON.stringify(await repository.exportBackup('all'));

    await expect(repository.importBackup('{not-json', 'replace')).rejects.toThrow();
    await expect(
      repository.importBackup(
        JSON.stringify({ ...v1Backup, schemaVersion: 999 }),
        'replace',
      ),
    ).rejects.toThrow();

    const after = JSON.stringify(await repository.exportBackup('all'));
    expect(after).toBe(before);
    expect(await repository.listRecoveryCopies()).toHaveLength(0);
  });

  it('creates a restorable recovery copy before replace-import', async () => {
    const repository = await openRepository('recovery');
    const first = await repository.saveToLibrary(newNamedRecord(repository, '替换前甲'), 0);
    const second = await repository.saveToLibrary(newNamedRecord(repository, '替换前乙'), 0);
    expect(first.ok && second.ok).toBe(true);
    await repository.saveSettings({ rosMode: 'brief', fontScale: 1.15, lastStep: 'summary' });
    const before = JSON.stringify(await repository.exportBackup('all'));

    const summary = await repository.importBackup(JSON.stringify(v2Backup), 'replace');
    expect(summary.recoveryId).toMatch(/^recovery-/);
    expect((await repository.loadList()).list.map((item) => item.id)).toEqual(['legacy-v2-neurology']);

    const recoveries = await repository.listRecoveryCopies();
    expect(recoveries).toHaveLength(1);
    expect(recoveries[0]).toMatchObject({ id: summary.recoveryId, recordCount: 2, reason: 'replace-import' });

    await repository.restoreRecovery(summary.recoveryId!);
    expect((await repository.loadList()).list).toHaveLength(2);
    expect((await repository.loadCurrent()).record?.basic.name).toBe('替换前乙');
    expect((await repository.loadSettings()).settings).toMatchObject({
      rosMode: 'brief',
      fontScale: 1.15,
      lastStep: 'summary',
    });
    expect(JSON.stringify(await repository.exportBackup('all'))).toBe(before);
  });

  it('exports a consistent snapshot that re-imports identically', async () => {
    const source = await openRepository('export-source');
    await source.saveToLibrary(newNamedRecord(source, '快照甲'), 0);
    await source.saveToLibrary(newNamedRecord(source, '快照乙'), 0);
    const snapshot = await source.exportBackup('all');
    const serialized = serializeBackup(snapshot);

    const target = await openRepository('export-target');
    await target.importBackup(serialized, 'replace');
    const roundTrip = await target.exportBackup('all');

    expect(roundTrip).toEqual(snapshot);
    expect(serializeBackup(roundTrip)).toBe(serialized);
  });

  it('imports the v1, v2, and v3 legacy backup fixtures', async () => {
    const repository = await openRepository('legacy-backups');
    await repository.importBackup(JSON.stringify(v1Backup), 'merge');
    await repository.importBackup(JSON.stringify(v2Backup), 'merge');
    await repository.importBackup(JSON.stringify(v3Backup), 'merge');

    const ids = (await repository.loadList()).list.map((item) => item.id).sort();
    expect(ids).toEqual([
      'legacy-v1-pediatrics',
      'legacy-v2-neurology',
      'legacy-v3-psychiatry',
    ]);
  });
});
