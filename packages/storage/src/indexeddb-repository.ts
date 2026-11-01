import Dexie, { type Table } from 'dexie';
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
import { createBackupBundle, parseBackup } from './backup-format.js';
import { readLegacyLocalStorage, type LegacyBrowserSnapshot } from './browser-migration.js';
import type {
  BackupScope,
  ImportMode,
  ImportSummary,
  LegacyMigrationResult,
  RecordRepository,
  RecoveryCopySummary,
  RepositoryInitResult,
  RestoreSummary,
} from './repository.js';

export const DEFAULT_DATABASE_NAME = 'dabingli.indexeddb.v1';
export const LEGACY_MIGRATION_META_KEY = 'browserLegacyMigration';
const CURRENT_KEY = 'current';
const SETTINGS_KEY = 'settings';
const RECOVERY_PREFIX = 'recovery:';

interface StoredCurrent {
  key: typeof CURRENT_KEY;
  id: string;
  at: string;
}

interface StoredSettings {
  key: typeof SETTINGS_KEY;
  data: AppSettings;
  updatedAt: string;
}

interface StoredMeta<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
}

interface RecoveryCopy {
  id: string;
  createdAt: string;
  reason: 'replace-import';
  records: RecordListItem[];
  drafts: DabingliRecord[];
  currentId: string | null;
  settings: AppSettings | null;
  bundle: ExportBundle;
}

export class DabingliDatabase extends Dexie {
  records!: Table<RecordListItem, string>;
  drafts!: Table<DabingliRecord, string>;
  current!: Table<StoredCurrent, string>;
  settings!: Table<StoredSettings, string>;
  meta!: Table<StoredMeta, string>;

  constructor(name = DEFAULT_DATABASE_NAME) {
    super(name);
    this.version(1).stores({
      records: 'id, updatedAt',
      drafts: 'id, updatedAt',
      current: 'key',
      settings: 'key',
      meta: 'key',
    });
  }
}

export interface IndexedDbRepositoryOptions {
  databaseName?: string;
  /** Legacy localStorage is read-only. Pass false/null to disable migration. */
  legacyStorage?: StorageLike | null | false;
  /** Alias used by callers that already have a StorageLike instance. */
  storage?: StorageLike | null | false;
  autoMigrate?: boolean;
  now?: () => string;
}

function clone<T>(value: T): T {
  return RECORD_CORE.cloneValue(value);
}

const DEPARTMENT_KEYS = SCHEMA.DEPARTMENTS.map((department) => department.key);

function canonicalRecord(record: DabingliRecord): DabingliRecord {
  const next = clone(record);
  if (!next.id) next.id = RECORD_CORE.uid();
  try {
    return RECORD_CORE.normalizeRecord(next, SCHEMA.emptyRecord, DEPARTMENT_KEYS);
  } catch {
    // A brand-new blank record is valid to save but normalizeRecord treats it
    // as "empty input". Non-blank legacy/current records take the canonical path.
    return next;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultLegacyStorage(): StorageLike | null {
  try {
    const storage = (globalThis as { localStorage?: StorageLike }).localStorage;
    if (storage) return storage;
  } catch {
    return null;
  }
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function emptyMigration(
  status: LegacyMigrationResult['status'],
  reason?: string,
): LegacyMigrationResult {
  return {
    ok: status !== 'failed',
    status,
    ...(reason ? { reason } : {}),
    recordCount: 0,
    draftCount: 0,
    settingsMigrated: false,
    currentId: null,
    legacyKeys: [],
  };
}

function storedMigration(value: unknown): LegacyMigrationResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const migration = value as Partial<LegacyMigrationResult>;
  if (typeof migration.status !== 'string') return null;
  return {
    ok: true,
    status: 'already-complete',
    recordCount: Number(migration.recordCount) || 0,
    draftCount: Number(migration.draftCount) || 0,
    settingsMigrated: migration.settingsMigrated === true,
    currentId: typeof migration.currentId === 'string' ? migration.currentId : null,
    legacyKeys: Array.isArray(migration.legacyKeys)
      ? migration.legacyKeys.filter((key): key is string => typeof key === 'string')
      : [],
  };
}

function asRecovery(value: unknown): RecoveryCopy | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const recovery = value as Partial<RecoveryCopy>;
  if (
    typeof recovery.id !== 'string'
    || typeof recovery.createdAt !== 'string'
    || recovery.reason !== 'replace-import'
    || !Array.isArray(recovery.records)
    || !Array.isArray(recovery.drafts)
  ) {
    return null;
  }
  return recovery as RecoveryCopy;
}

export class IndexedDbRecordRepository implements RecordRepository {
  readonly kind = 'indexeddb' as const;
  readonly keys = RECORD_CORE.STORAGE_KEYS;
  readonly databaseName: string;
  private readonly db: DabingliDatabase;
  private readonly legacyStorage: StorageLike | null;
  private readonly autoMigrate: boolean;
  private readonly now: () => string;
  private initPromise: Promise<RepositoryInitResult> | null = null;

  constructor(options: IndexedDbRepositoryOptions = {}) {
    this.databaseName = options.databaseName ?? DEFAULT_DATABASE_NAME;
    this.db = new DabingliDatabase(this.databaseName);
    const configuredStorage = options.legacyStorage ?? options.storage;
    this.legacyStorage =
      configuredStorage === false || configuredStorage === null
        ? null
        : configuredStorage ?? defaultLegacyStorage();
    this.autoMigrate = options.autoMigrate !== false;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  initialize(): Promise<RepositoryInitResult> {
    if (!this.initPromise) {
      this.initPromise = this.initializeOnce().then((result) => {
        if (!result.ok) this.initPromise = null;
        return result;
      });
    }
    return this.initPromise;
  }

  private async initializeOnce(): Promise<RepositoryInitResult> {
    try {
      await this.db.open();
      if (!this.autoMigrate) {
        return { ok: true, migration: emptyMigration('not-applicable', '自动迁移已关闭') };
      }
      const migration = await this.migrateLegacyLocalStorage();
      return {
        ok: migration.ok,
        ...(migration.reason ? { reason: migration.reason } : {}),
        migration,
      };
    } catch (error) {
      return { ok: false, reason: `IndexedDB 初始化失败：${errorMessage(error)}` };
    }
  }

  private async migrateLegacyLocalStorage(): Promise<LegacyMigrationResult> {
    if (!this.legacyStorage) return emptyMigration('not-applicable');

    const previous = await this.db.meta.get(LEGACY_MIGRATION_META_KEY);
    if (previous) {
      const migration = storedMigration(previous.value);
      if (migration) return migration;
    }

    let snapshot: LegacyBrowserSnapshot;
    try {
      snapshot = readLegacyLocalStorage(this.legacyStorage, this.now);
    } catch (error) {
      return emptyMigration('failed', errorMessage(error));
    }

    try {
      return await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        this.db.settings,
        this.db.meta,
        async () => {
          const raced = await this.db.meta.get(LEGACY_MIGRATION_META_KEY);
          if (raced) {
            return storedMigration(raced.value) ?? emptyMigration('already-complete');
          }

          const [recordCount, draftCount, currentCount, settingsCount] = await Promise.all([
            this.db.records.count(),
            this.db.drafts.count(),
            this.db.current.count(),
            this.db.settings.count(),
          ]);

          if (recordCount + draftCount + currentCount + settingsCount > 0) {
            const skipped = emptyMigration('skipped', 'IndexedDB 已有数据，未覆盖');
            await this.db.meta.put({
              key: LEGACY_MIGRATION_META_KEY,
              value: skipped,
              updatedAt: this.now(),
            });
            return skipped;
          }

          if (!snapshot.hasLegacyData) {
            const noData = emptyMigration('no-legacy-data');
            await this.db.meta.put({
              key: LEGACY_MIGRATION_META_KEY,
              value: noData,
              updatedAt: this.now(),
            });
            return noData;
          }

          if (snapshot.records.length) await this.db.records.bulkPut(snapshot.records);
          if (snapshot.drafts.length) await this.db.drafts.bulkPut(snapshot.drafts);
          if (snapshot.currentId) {
            await this.db.current.put({
              key: CURRENT_KEY,
              id: snapshot.currentId,
              at: this.now(),
            });
          }
          if (snapshot.settings) {
            await this.db.settings.put({
              key: SETTINGS_KEY,
              data: snapshot.settings,
              updatedAt: this.now(),
            });
          }

          const migrated: LegacyMigrationResult = {
            ok: true,
            status: 'migrated',
            recordCount: snapshot.records.length,
            draftCount: snapshot.drafts.length,
            settingsMigrated: snapshot.settings !== null,
            currentId: snapshot.currentId,
            legacyKeys: snapshot.legacyKeys,
          };
          await this.db.meta.put({
            key: LEGACY_MIGRATION_META_KEY,
            value: migrated,
            updatedAt: this.now(),
          });
          return migrated;
        },
      );
    } catch (error) {
      return emptyMigration('failed', `迁移事务失败：${errorMessage(error)}`);
    }
  }

  newRecord(): DabingliRecord {
    const record = SCHEMA.emptyRecord();
    record.id = RECORD_CORE.uid();
    return record;
  }

  async loadList(): Promise<LoadListResult> {
    try {
      const list = await this.db.records.toArray();
      return { ok: true, list: RECORD_CORE.sortByUpdated(list) };
    } catch (error) {
      return { ok: false, list: [], error: true, reason: `读取病历列表失败：${errorMessage(error)}` };
    }
  }

  async loadCurrent(preferredId?: string): Promise<LoadCurrentResult> {
    try {
      return await this.db.transaction('r', this.db.drafts, this.db.current, async () => {
        const pointer = preferredId ? null : await this.db.current.get(CURRENT_KEY);
        const id = String(preferredId || pointer?.id || '').trim();
        if (!id) return { ok: true, record: null, fresh: true };

        const stored = await this.db.drafts.get(id);
        if (!stored) return { ok: true, record: null, fresh: true, missingDraft: true };
        try {
          const record = RECORD_CORE.normalizeRecord(
            stored,
            SCHEMA.emptyRecord,
            SCHEMA.DEPARTMENTS.map((department) => department.key),
          );
          return {
            ok: true,
            record,
            ...(Number(stored.schemaVersion) < RECORD_CORE.SCHEMA_VERSION ? { migrated: true } : {}),
          };
        } catch (error) {
          return {
            ok: false,
            record: null,
            corrupt: true,
            raw: JSON.stringify(stored),
            reason: errorMessage(error),
          };
        }
      });
    } catch (error) {
      return { ok: false, record: null, error: true, reason: `读取当前病历失败：${errorMessage(error)}` };
    }
  }

  async saveCurrent(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
    if (!record || typeof record !== 'object') {
      return { ok: false, error: true, reason: '病历内容无效' };
    }

    try {
      return await this.db.transaction(
        'rw',
        this.db.drafts,
        this.db.current,
        this.db.records,
        async () => {
          const next = clone(record);
          if (!next.id) next.id = RECORD_CORE.uid();
          const id = next.id;
          const existingDraft = await this.db.drafts.get(id);
          const existingRecord = existingDraft ? null : await this.db.records.get(id);
          const existing = existingDraft ?? existingRecord?.data ?? null;
          const remoteRevision = Number(existing?.meta?.revision) || 0;
          const expected =
            expectedRevision === undefined || expectedRevision === null
              ? null
              : Number(expectedRevision);

          if (existing && expected !== null && remoteRevision !== expected) {
            return {
              ok: false,
              conflict: true,
              remote: existing,
              remoteRevision,
              reason: '其他页面已保存新版本',
            };
          }

          const now = this.now();
          if (!next.meta || typeof next.meta !== 'object') next.meta = {};
          next.schemaVersion = RECORD_CORE.SCHEMA_VERSION;
          next.meta.revision = Math.max(remoteRevision, Number(next.meta.revision) || 0) + 1;
          next.meta.updatedAt = now;
          next.updatedAt = now;
          const canonical = canonicalRecord(next);

          await this.db.drafts.put(canonical);
          await this.db.current.put({ key: CURRENT_KEY, id, at: now });
          return { ok: true, record: canonical, revision: canonical.meta.revision };
        },
      );
    } catch (error) {
      return { ok: false, error: true, reason: `保存草稿失败：${errorMessage(error)}` };
    }
  }

  async saveToLibrary(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
    if (!record || typeof record !== 'object') {
      return { ok: false, error: true, reason: '病历内容无效' };
    }

    try {
      return await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        async () => {
          const next = clone(record);
          if (!next.id) next.id = RECORD_CORE.uid();
          const id = next.id;
          const existingDraft = await this.db.drafts.get(id);
          const existingRecord = await this.db.records.get(id);
          const existing = existingDraft ?? existingRecord?.data ?? null;
          const remoteRevision = Number(existing?.meta?.revision) || 0;
          const expected =
            expectedRevision === undefined || expectedRevision === null
              ? null
              : Number(expectedRevision);

          if (existing && expected !== null && remoteRevision !== expected) {
            return {
              ok: false,
              conflict: true,
              remote: existing,
              remoteRevision,
              reason: '其他页面已保存新版本',
            };
          }

          const now = this.now();
          if (!next.meta || typeof next.meta !== 'object') next.meta = {};
          next.schemaVersion = RECORD_CORE.SCHEMA_VERSION;
          next.meta.revision = Math.max(remoteRevision, Number(next.meta.revision) || 0) + 1;
          next.meta.updatedAt = now;
          next.updatedAt = now;
          const canonical = canonicalRecord(next);

          await this.db.drafts.put(canonical);
          await this.db.current.put({ key: CURRENT_KEY, id, at: now });

          const currentItems = await this.db.records.toArray();
          const merged = RECORD_CORE.upsertRecord(currentItems, canonical, now);
          const item = merged.list.find((candidate) => candidate.id === id);
          if (item) await this.db.records.put(clone(item));

          return { ok: true, record: canonical, revision: canonical.meta.revision };
        },
      );
    } catch (error) {
      return { ok: false, error: true, reason: `保存病历失败：${errorMessage(error)}` };
    }
  }

  async saveList(list: RecordListItem[]): Promise<SaveResult> {
    if (!Array.isArray(list)) return { ok: false, error: true, reason: '病历列表无效' };
    try {
      return await this.db.transaction('rw', this.db.records, async () => {
        await this.db.records.clear();
        if (list.length) await this.db.records.bulkPut(clone(list));
        return { ok: true };
      });
    } catch (error) {
      return { ok: false, error: true, reason: `保存病历列表失败：${errorMessage(error)}` };
    }
  }

  async deleteRecord(id: string): Promise<SaveResult> {
    try {
      return await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        async () => {
          await this.db.records.delete(id);
          await this.db.drafts.delete(id);
          const pointer = await this.db.current.get(CURRENT_KEY);
          if (pointer?.id === id) await this.db.current.delete(CURRENT_KEY);
          return { ok: true };
        },
      );
    } catch (error) {
      return { ok: false, error: true, reason: `删除病历失败：${errorMessage(error)}` };
    }
  }

  async loadSettings(): Promise<SettingsResult> {
    try {
      const stored = await this.db.settings.get(SETTINGS_KEY);
      if (!stored) {
        return { ok: true, settings: { ...RECORD_CORE.SETTINGS_DEFAULTS }, raw: '' };
      }
      return {
        ok: true,
        settings: RECORD_CORE.normalizeSettings(stored.data),
        raw: JSON.stringify(stored.data),
      };
    } catch (error) {
      return {
        ok: false,
        settings: { ...RECORD_CORE.SETTINGS_DEFAULTS },
        corrupt: true,
        raw: errorMessage(error),
      };
    }
  }

  async saveSettings(settings: AppSettings): Promise<SaveResult> {
    try {
      const normalized = RECORD_CORE.normalizeSettings(settings);
      await this.db.settings.put({
        key: SETTINGS_KEY,
        data: normalized,
        updatedAt: this.now(),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: true, reason: `保存设置失败：${errorMessage(error)}` };
    }
  }

  async importBackup(raw: string, mode: ImportMode): Promise<ImportSummary> {
    const parsed = parseBackup(raw);
    const importedItems: RecordListItem[] = parsed.records.map((item) => {
      const data = clone(item.data);
      data.id = item.id;
      if (!data.updatedAt) data.updatedAt = item.updatedAt;
      return {
        id: item.id,
        updatedAt: item.updatedAt,
        schemaVersion: data.schemaVersion,
        basic: clone(data.basic),
        data,
      };
    });

    return this.db.transaction(
      'rw',
      this.db.records,
      this.db.drafts,
      this.db.current,
      this.db.settings,
      this.db.meta,
      async () => {
        const existingList = await this.db.records.toArray();
        const now = this.now();

        if (mode === 'replace') {
          const pointer = await this.db.current.get(CURRENT_KEY);
          const currentDraft = pointer ? await this.db.drafts.get(pointer.id) : undefined;
          const existingDrafts = await this.db.drafts.toArray();
          const storedSettings = await this.db.settings.get(SETTINGS_KEY);
          const recoveryId = `recovery-${now.replace(/[^0-9A-Za-z]/g, '')}-${RECORD_CORE.uid()}`;
          const recovery: RecoveryCopy = {
            id: recoveryId,
            createdAt: now,
            reason: 'replace-import',
            records: clone(existingList),
            drafts: clone(existingDrafts),
            currentId: pointer?.id ?? null,
            settings: storedSettings ? clone(storedSettings.data) : null,
            bundle: createBackupBundle(existingList, currentDraft, now),
          };

          await this.db.meta.put({
            key: `${RECOVERY_PREFIX}${recoveryId}`,
            value: recovery,
            updatedAt: now,
          });

          await this.db.records.clear();
          await this.db.drafts.clear();
          await this.db.current.clear();

          if (importedItems.length) await this.db.records.bulkPut(importedItems);
          if (importedItems.length) {
            await this.db.drafts.bulkPut(importedItems.map((item) => clone(item.data)));
          }

          const firstRecordId = importedItems[0]?.id;
          if (firstRecordId) {
            await this.db.current.put({ key: CURRENT_KEY, id: firstRecordId, at: now });
          }

          return {
            mode,
            recordCount: parsed.records.length,
            recoveryId,
            ...(firstRecordId ? { firstRecordId } : {}),
          };
        }

        const merged = RECORD_CORE.mergeImport(existingList, importedItems);
        const changed = importedItems.filter((item) => merged.list.includes(item));
        if (changed.length) {
          await this.db.records.bulkPut(changed.map((item) => clone(item)));
          await this.db.drafts.bulkPut(changed.map((item) => clone(item.data)));
        }

        const pointer = await this.db.current.get(CURRENT_KEY);
        const firstChanged = changed[0]?.id;
        if (!pointer && firstChanged) {
          await this.db.current.put({ key: CURRENT_KEY, id: firstChanged, at: now });
        }

        return {
          mode,
          recordCount: parsed.records.length,
          added: merged.added,
          updated: merged.updated,
          skipped: merged.skipped,
          ...(firstChanged ? { firstRecordId: firstChanged } : {}),
        };
      },
    );
  }

  async exportBackup(scope: BackupScope = 'all'): Promise<ExportBundle> {
    return this.db.transaction('r', this.db.records, this.db.drafts, this.db.current, async () => {
      const list = scope === 'current' ? [] : await this.db.records.toArray();
      const pointer = await this.db.current.get(CURRENT_KEY);
      const draft = pointer ? await this.db.drafts.get(pointer.id) : undefined;
      return createBackupBundle(list, draft, this.now());
    });
  }

  async listRecoveryCopies(): Promise<RecoveryCopySummary[]> {
    const entries = await this.db.meta.where('key').startsWith(RECOVERY_PREFIX).toArray();
    return entries
      .map((entry) => asRecovery(entry.value))
      .filter((recovery): recovery is RecoveryCopy => recovery !== null)
      .map((recovery) => ({
        id: recovery.id,
        createdAt: recovery.createdAt,
        reason: recovery.reason,
        recordCount: recovery.records.length,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async restoreRecovery(id: string): Promise<RestoreSummary> {
    return this.db.transaction(
      'rw',
      this.db.records,
      this.db.drafts,
      this.db.current,
      this.db.settings,
      this.db.meta,
      async () => {
        const entry = await this.db.meta.get(`${RECOVERY_PREFIX}${id}`);
        const recovery = entry ? asRecovery(entry.value) : null;
        if (!recovery) throw new Error('找不到恢复副本');

        await this.db.records.clear();
        await this.db.drafts.clear();
        await this.db.current.clear();
        await this.db.settings.clear();

        if (recovery.records.length) await this.db.records.bulkPut(clone(recovery.records));
        if (recovery.drafts.length) await this.db.drafts.bulkPut(clone(recovery.drafts));
        if (recovery.currentId) {
          await this.db.current.put({
            key: CURRENT_KEY,
            id: recovery.currentId,
            at: this.now(),
          });
        }
        if (recovery.settings) {
          await this.db.settings.put({
            key: SETTINGS_KEY,
            data: clone(recovery.settings),
            updatedAt: this.now(),
          });
        }

        return {
          recoveryId: id,
          recordCount: recovery.records.length,
          ...(recovery.currentId ? { firstRecordId: recovery.currentId } : {}),
        };
      },
    );
  }

  async readMeta<T = unknown>(key: string): Promise<T | null> {
    const entry = await this.db.meta.get(key);
    return entry ? (entry.value as T) : null;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export function createIndexedDbRepository(
  options: IndexedDbRepositoryOptions = {},
): IndexedDbRecordRepository {
  return new IndexedDbRecordRepository(options);
}

export const createIndexedDBRepository = createIndexedDbRepository;

export async function deleteIndexedDbDatabase(
  name: string = DEFAULT_DATABASE_NAME,
): Promise<void> {
  await Dexie.delete(name);
}


