import { afterEach, describe, expect, it } from 'vitest';
import { RECORD_CORE } from '@dabingli/domain';
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

  it('keeps raw notes with the record, hides them by default, and round-trips them when requested', async () => {
    const source = await openRepository('raw-notes-source');
    const record = newNamedRecord(source, '虚构笔记患者');
    record.rawNotes = '虚构原始笔记：随病历保存';
    const saved = await source.saveToLibrary(record, 0);
    expect(saved.ok).toBe(true);
    const id = saved.record?.id;
    if (!id) throw new Error(saved.reason ?? 'save failed');

    expect((await source.loadCurrent(id)).record?.rawNotes).toBe('虚构原始笔记：随病历保存');
    const withoutNotes = await source.exportBackup('all');
    expect(withoutNotes.records.every((entry) => !('rawNotes' in entry.data))).toBe(true);
    expect(withoutNotes.includesNotes).toBeUndefined();

    const withNotes = await source.exportBackup('all', { includeNotes: true });
    expect(withNotes.includesNotes).toBe(true);
    expect(withNotes.records.find((entry) => entry.id === id)?.data.rawNotes)
      .toBe('虚构原始笔记：随病历保存');

    const target = await openRepository('raw-notes-target');
    await target.importBackup(serializeBackup(withNotes), 'replace');
    const restored = (await target.loadList()).list.find((item) => item.id === id);
    expect(restored?.data.rawNotes).toBe('虚构原始笔记：随病历保存');
    expect((await target.loadCurrent(id)).record?.rawNotes).toBe('虚构原始笔记：随病历保存');

    const deleted = await target.deleteRecord(id);
    expect(deleted.ok).toBe(true);
    expect((await target.loadList()).list.some((item) => item.id === id)).toBe(false);
    const afterDelete = await target.loadCurrent(id);
    expect(afterDelete.ok).toBe(true);
    expect(afterDelete.record?.id).not.toBe(id);
  });

  it('preserves local raw notes when a newer merge-import backup has no notes', async () => {
    const repository = await openRepository('raw-notes-merge');
    const record = newNamedRecord(repository, '虚构本机较旧患者');
    record.rawNotes = '虚构本机原始笔记';
    const saved = await repository.saveToLibrary(record, 0);
    if (!saved.record?.id) throw new Error(saved.reason ?? 'save failed');

    const incoming = RECORD_CORE.cloneValue(saved.record);
    incoming.basic.name = '虚构备份较新患者';
    const bundle = RECORD_CORE.buildExport([{
      id: saved.record.id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      data: incoming,
    }], '2099-01-01T00:00:00.000Z');
    await repository.importBackup(serializeBackup(bundle), 'merge');

    const restored = (await repository.loadList()).list.find((item) => item.id === saved.record?.id);
    expect(restored?.data.basic.name).toBe('虚构备份较新患者');
    expect(restored?.data.rawNotes).toBe('虚构本机原始笔记');
    expect(restored && 'rawNotesIncluded' in restored).toBe(false);
  });

  it('preserves local raw notes on replacement import of the same id without notes', async () => {
    const repository = await openRepository('raw-notes-replace');
    const record = newNamedRecord(repository, '虚构替换前患者');
    record.rawNotes = '虚构替换前本机笔记';
    const saved = await repository.saveToLibrary(record, 0);
    if (!saved.record?.id) throw new Error(saved.reason ?? 'save failed');

    const incoming = RECORD_CORE.cloneValue(saved.record);
    incoming.basic.name = '虚构替换后患者';
    const bundle = RECORD_CORE.buildExport([{
      id: saved.record.id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      data: incoming,
    }], '2099-01-01T00:00:00.000Z');
    await repository.importBackup(serializeBackup(bundle), 'replace');

    const restored = (await repository.loadList()).list.find((item) => item.id === saved.record?.id);
    expect(restored?.data.basic.name).toBe('虚构替换后患者');
    expect(restored?.data.rawNotes).toBe('虚构替换前本机笔记');
    expect((await repository.loadCurrent(saved.record.id)).record?.rawNotes).toBe('虚构替换前本机笔记');
  });

  it('restores notes from a notes-enabled backup even when local notes differ', async () => {
    const repository = await openRepository('raw-notes-restore');
    const record = newNamedRecord(repository, '虚构笔记还原患者');
    record.rawNotes = '虚构本机旧笔记';
    const saved = await repository.saveToLibrary(record, 0);
    if (!saved.record?.id) throw new Error(saved.reason ?? 'save failed');

    const incoming = RECORD_CORE.cloneValue(saved.record);
    incoming.basic.name = '虚构笔记还原患者（导入）';
    incoming.rawNotes = '虚构备份新笔记';
    const bundle = RECORD_CORE.buildExport([{
      id: saved.record.id,
      updatedAt: '2099-01-01T00:00:00.000Z',
      data: incoming,
    }], '2099-01-01T00:00:00.000Z', { includeNotes: true });
    expect(bundle.includesNotes).toBe(true);
    await repository.importBackup(serializeBackup(bundle), 'merge');

    const restored = (await repository.loadList()).list.find((item) => item.id === saved.record?.id);
    expect(restored?.data.basic.name).toBe('虚构笔记还原患者（导入）');
    expect(restored?.data.rawNotes).toBe('虚构备份新笔记');
  });
});
