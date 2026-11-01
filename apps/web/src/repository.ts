import {
  RECORD_CORE,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type LoadCurrentResult,
  type LoadListResult,
  type RecordListItem,
  type SaveResult,
  type SettingsResult,
  type StorageLike,
} from '@dabingli/domain';

export interface RecordRepository {
  readonly keys: typeof RECORD_CORE.STORAGE_KEYS;
  newRecord(): DabingliRecord;
  loadList(): LoadListResult;
  loadCurrent(preferredId?: string): LoadCurrentResult;
  saveCurrent(record: DabingliRecord, expectedRevision?: number): SaveResult;
  saveToLibrary(record: DabingliRecord, expectedRevision?: number): SaveResult;
  saveList(list: RecordListItem[]): SaveResult;
  loadSettings(): SettingsResult;
  saveSettings(settings: AppSettings): SaveResult;
  readRaw(key: string): { ok: boolean; raw: string | null; missing?: boolean; error?: string };
  writeRaw(key: string, value: string): { ok: boolean; error?: string };
  remove(key: string): boolean;
}

export function createLocalStorageRepository(
  storage: StorageLike = window.localStorage,
): RecordRepository {
  const keys = RECORD_CORE.STORAGE_KEYS;
  const deptKeys = SCHEMA.DEPARTMENTS.map((department) => department.key);

  const repository: RecordRepository = {
    keys,
    newRecord() {
      const record = SCHEMA.emptyRecord();
      record.id = RECORD_CORE.uid();
      return record;
    },
    loadList() {
      return RECORD_CORE.loadList(storage);
    },
    loadCurrent(preferredId) {
      return RECORD_CORE.loadCurrent(storage, SCHEMA.emptyRecord, deptKeys, preferredId);
    },
    saveCurrent(record, expectedRevision) {
      return RECORD_CORE.saveCurrent(storage, record, expectedRevision);
    },
    saveToLibrary(record, expectedRevision) {
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
    saveList(list) {
      return RECORD_CORE.saveList(storage, list);
    },
    loadSettings() {
      return RECORD_CORE.loadSettings(storage);
    },
    saveSettings(settings) {
      return RECORD_CORE.saveSettings(storage, settings);
    },
    readRaw(key) {
      return RECORD_CORE.readRaw(storage, key);
    },
    writeRaw(key, value) {
      return RECORD_CORE.writeRaw(storage, key, value);
    },
    remove(key) {
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    },
  };

  return repository;
}
