import {
  RECORD_CORE,
  type DabingliRecord,
  type RecordListItem,
  type StorageLike,
} from '@dabingli/domain';
import { readLegacyLocalStorage } from './browser-migration.js';
import { createBackupBundle, serializeBackup } from './backup-format.js';
import type { RecordRepository } from './repository.js';

export interface StagedLegacyPayload {
  keys: Record<string, string | null>;
  manifest?: unknown;
}

export interface LegacyComparison {
  records: boolean;
  exportJson: boolean;
  perRecord: Array<{ id: string; idMatch: boolean; name: boolean; chiefComplaint: boolean; diagnosis: boolean }>;
}

export interface StagedImportResult {
  recordCount: number;
  ids: string[];
  comparison: LegacyComparison;
}

function asPayload(payload: StagedLegacyPayload | string): StagedLegacyPayload {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('迁移暂存格式错误');
  const envelope = (parsed as { payload?: unknown }).payload;
  const source = envelope && typeof envelope === 'object' && !Array.isArray(envelope) ? envelope : parsed;
  const keys = (source as { keys?: unknown }).keys;
  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) throw new Error('迁移暂存缺少 keys');
  for (const [key, value] of Object.entries(keys as Record<string, unknown>)) {
    const allowed = key === RECORD_CORE.STORAGE_KEYS.list || key === RECORD_CORE.STORAGE_KEYS.current || key === RECORD_CORE.STORAGE_KEYS.settings || key.startsWith(RECORD_CORE.STORAGE_KEYS.draftPrefix);
    if (!allowed) throw new Error(`迁移数据包含未知键：${key}`);
    if (value !== null && typeof value !== 'string') throw new Error(`迁移键 ${key} 不是字符串或 null`);
  }
  return { keys: keys as Record<string, string | null>, manifest: (parsed as { manifest?: unknown }).manifest };
}

function storageFrom(payload: StagedLegacyPayload): StorageLike {
  const values = new Map(Object.entries(payload.keys));
  const storage: StorageLike & { readonly length: number; key(index: number): string | null } = {
    get length() { return values.size; },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key) => values.has(key) ? values.get(key) ?? null : null,
    setItem: (key, value) => { values.set(key, String(value)); },
    removeItem: (key) => { values.delete(key); },
  };
  return storage;
}

function itemFor(record: DabingliRecord, now: string): RecordListItem {
  const id = String(record.id || '');
  return { id, updatedAt: String(record.updatedAt || record.meta?.updatedAt || now), schemaVersion: record.schemaVersion, basic: RECORD_CORE.cloneValue(record.basic), data: RECORD_CORE.cloneValue(record) };
}

function comparable(record: DabingliRecord | null | undefined): Record<string, unknown> {
  return {
    id: record?.id ?? null,
    name: record?.basic?.name ?? '',
    chiefComplaint: record?.basic?.chiefComplaint ?? '',
    diagnosis: record?.diagnosis?.confirmed ?? [],
  };
}

/**
 * Import Kotlin's raw localStorage envelope through the same read/normalize path
 * used by browser migration. Validation completes before the repository is touched.
 */
export async function importStagedLegacy(
  payload: StagedLegacyPayload | string,
  repo: RecordRepository,
): Promise<StagedImportResult> {
  const parsed = asPayload(payload);
  const snapshot = readLegacyLocalStorage(storageFrom(parsed));
  const existing = await repo.loadList();
  if (!existing.ok) throw new Error(existing.reason || '无法读取现有病历');
  const current = await repo.loadCurrent();
  const settings = await repo.loadSettings();
  if (existing.list.length || current.record || settings.raw) throw new Error('IndexedDB 已有数据，未覆盖');

  const now = new Date().toISOString();
  const byId = new Map<string, DabingliRecord>();
  for (const item of snapshot.records) byId.set(item.id, RECORD_CORE.cloneValue(item.data));
  for (const record of snapshot.drafts) if (record.id && !byId.has(record.id)) byId.set(record.id, RECORD_CORE.cloneValue(record));
  const records = [...byId.values()];
  const list = records.map((record) => itemFor(record, now));
  const bundle = createBackupBundle(list, null, now);
  // importBackup is transactional for IndexedDbRecordRepository and keeps its recovery semantics.
  await repo.importBackup(serializeBackup(bundle), 'replace');
  if (snapshot.currentId) {
    const selected = byId.get(snapshot.currentId);
    if (selected) await repo.saveCurrent(selected);
  }
  if (snapshot.settings) await repo.saveSettings(snapshot.settings);

  const imported = await repo.loadList();
  if (!imported.ok) throw new Error(imported.reason || '读取迁移结果失败');
  const importedById = new Map(imported.list.map((item) => [item.id, item.data]));
  const perRecord = records.map((record) => {
    const got = importedById.get(String(record.id));
    const before = comparable(record);
    const after = comparable(got);
    return {
      id: String(record.id),
      idMatch: before.id === after.id,
      name: before.name === after.name,
      chiefComplaint: before.chiefComplaint === after.chiefComplaint,
      diagnosis: JSON.stringify(before.diagnosis) === JSON.stringify(after.diagnosis),
    };
  });
  const actualBundle = await repo.exportBackup('all');
  // Repository writes refresh timestamps/revisions when restoring the current draft;
  // compare the exported document content while ignoring those generated fields.
  const stripVolatile = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stripVolatile);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'updatedAt' && key !== 'revision' && key !== 'exportedAt')
      .map(([key, item]) => [key, stripVolatile(item)]));
  };
  const exportShape = (value: typeof bundle) => JSON.stringify(stripVolatile({
    app: value.app,
    schemaVersion: value.schemaVersion,
    records: value.records,
  }));
  const expected = exportShape(bundle);
  const actual = exportShape(actualBundle);
  return {
    recordCount: records.length,
    ids: records.map((record) => String(record.id)),
    comparison: {
      records: perRecord.every((item) => item.idMatch && item.name && item.chiefComplaint && item.diagnosis),
      exportJson: expected === actual,
      perRecord,
    },
  };
}
