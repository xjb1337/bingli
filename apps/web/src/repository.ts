import {
  RECORD_CORE,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type ExportBundle,
  type LoadCurrentResult,
  type LoadListResult,
  type RecordListItem,
  type SaveResult,
  type SettingsResult,
  type StorageLike,
} from '@dabingli/domain';
import {
  createBackupBundle,
  parseBackup,
  type BackupScope,
  type ImportMode,
  type ImportSummary,
  type RecordRepository,
  type RecoveryCopySummary,
  type RepositoryInitResult,
  type RestoreSummary,
} from '@dabingli/storage';

/**
 * Legacy localStorage adapter. The web app uses IndexedDB; this remains as a
 * test fallback and documents the exact migration source semantics.
 */
export function createLocalStorageRepository(
  storage: StorageLike = window.localStorage,
): RecordRepository {
  const keys = RECORD_CORE.STORAGE_KEYS;
  const deptKeys = SCHEMA.DEPARTMENTS.map((department) => department.key);

  return {
    kind: 'localstorage',
    keys,
    async initialize(): Promise<RepositoryInitResult> {
      return {
        ok: true,
        migration: {
          ok: true,
          status: 'not-applicable',
          recordCount: 0,
          draftCount: 0,
          settingsMigrated: false,
          currentId: null,
          legacyKeys: [],
        },
      };
    },
    newRecord() {
      const record = SCHEMA.emptyRecord();
      record.id = RECORD_CORE.uid();
      return record;
    },
    async loadList(): Promise<LoadListResult> {
      return RECORD_CORE.loadList(storage);
    },
    async loadCurrent(preferredId?: string): Promise<LoadCurrentResult> {
      return RECORD_CORE.loadCurrent(storage, SCHEMA.emptyRecord, deptKeys, preferredId);
    },
    async saveCurrent(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
      return RECORD_CORE.saveCurrent(storage, record, expectedRevision);
    },
    async saveToLibrary(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
      const current = RECORD_CORE.saveCurrent(storage, record, expectedRevision);
      if (!current.ok || !current.record) return current;

      const loaded = RECORD_CORE.loadList(storage);
      if (!loaded.ok) {
        return {
          ok: false,
          error: true,
          reason: loaded.reason ?? '病历列表读取失败，草稿已保存但列表未更新',
        };
      }
      const merged = RECORD_CORE.upsertRecord(loaded.list, current.record);
      const listSaved = RECORD_CORE.saveList(storage, merged.list);
      if (!listSaved.ok) {
        return {
          ok: false,
          error: true,
          reason: listSaved.reason ?? '草稿已保存，但病历列表更新失败',
          record: current.record,
          revision: current.revision,
        };
      }
      return current;
    },
    async saveList(list: RecordListItem[]): Promise<SaveResult> {
      return RECORD_CORE.saveList(storage, list);
    },
    async deleteRecord(id: string): Promise<SaveResult> {
      const loaded = RECORD_CORE.loadList(storage);
      if (!loaded.ok) return { ok: false, error: true, reason: loaded.reason ?? '删除失败' };
      const saved = RECORD_CORE.saveList(storage, RECORD_CORE.removeRecord(loaded.list, id));
      if (!saved.ok) return saved;
      try {
        storage.removeItem(RECORD_CORE.draftKey(id));
        const current = storage.getItem(keys.current);
        if (current) {
          const pointer = JSON.parse(current) as { id?: unknown };
          if (pointer.id === id) storage.removeItem(keys.current);
        }
      } catch {
        return { ok: false, error: true, reason: '病历列表已删除，但草稿清理失败' };
      }
      return { ok: true };
    },
    async loadSettings(): Promise<SettingsResult> {
      return RECORD_CORE.loadSettings(storage);
    },
    async saveSettings(settings: AppSettings): Promise<SaveResult> {
      return RECORD_CORE.saveSettings(storage, settings);
    },
    async importBackup(raw: string, mode: ImportMode): Promise<ImportSummary> {
      const parsed = parseBackup(raw);
      const loaded = RECORD_CORE.loadList(storage);
      if (!loaded.ok) throw new Error(loaded.reason ?? '病历列表读取失败');
      const nextList =
        mode === 'replace'
          ? RECORD_CORE.replaceImport(parsed.records)
          : RECORD_CORE.mergeImport(loaded.list, parsed.records).list;
      const saved = RECORD_CORE.saveList(storage, nextList);
      if (!saved.ok) throw new Error(saved.reason ?? '写入病历列表失败');

      const first = parsed.records[0];
      if (first) RECORD_CORE.saveCurrent(storage, first.data, Number(first.data.meta.revision) || 0);
      return {
        mode,
        recordCount: parsed.records.length,
        ...(first ? { firstRecordId: first.id } : {}),
      };
    },
    async exportBackup(scope: BackupScope = 'all'): Promise<ExportBundle> {
      const loaded = RECORD_CORE.loadList(storage);
      if (!loaded.ok) throw new Error(loaded.reason ?? '病历列表读取失败');
      const current = RECORD_CORE.loadCurrent(storage, SCHEMA.emptyRecord, deptKeys);
      return createBackupBundle(
        scope === 'current' ? [] : loaded.list,
        current.ok ? current.record : null,
      );
    },
    async listRecoveryCopies(): Promise<RecoveryCopySummary[]> {
      return [];
    },
    async restoreRecovery(_id: string): Promise<RestoreSummary> {
      throw new Error('localStorage 兼容仓储不保存替换恢复副本');
    },
    async readMeta<T = unknown>(_key: string): Promise<T | null> {
      return null;
    },
    async close(): Promise<void> {},
  };
}
