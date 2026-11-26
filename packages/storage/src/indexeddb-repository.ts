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
  CorruptLegacyEntry,
  ImportMode,
  ImportSummary,
  LegacyMigrationResult,
  RecordRepository,
  RecoveryCopySummary,
  RepositoryChangeEvent,
  RepositoryInitResult,
  RestoreSummary,
  StorageQuotaInfo,
} from './repository.js';

import { StagedImportConflictError } from './repository.js';

export const DEFAULT_DATABASE_NAME = 'dabingli.indexeddb.v1';
export const LEGACY_MIGRATION_META_KEY = 'browserLegacyMigration';
export const CORRUPT_LEGACY_META_KEY = 'corruptLegacyEntries';
export const MAX_RECOVERY_COPIES = 5;
const CURRENT_KEY = 'current';
const SETTINGS_KEY = 'settings';
const RECOVERY_PREFIX = 'recovery:';
const SYNC_CHANNEL_PREFIX = 'dabingli.sync:';
const ANDROID_STAGED_RECEIPT_KEY = 'androidStagedImportReceipt';
const QUOTA_LOW_SPACE_RATIO = 0.85;

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
}

export interface StagedImportCommitInput {
  snapshot: LegacyBrowserSnapshot;
  records: DabingliRecord[];
  list: RecordListItem[];
  now: string;
  receipt?: string;
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
  broadcast?: boolean;
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

export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return /QuotaExceededError/i.test(String(error ?? ''));
  const candidate = error as { name?: unknown; code?: unknown; message?: unknown; inner?: unknown };
  if (candidate.name === 'QuotaExceededError' || candidate.code === 22) return true;
  if (typeof candidate.message === 'string' && /QuotaExceededError|quota/i.test(candidate.message)) return true;
  return candidate.inner ? isQuotaExceededError(candidate.inner) : false;
}

function quotaFailureMessage(prefix: string): string {
  return `${prefix}：本地存储空间不足（QuotaExceededError），请先导出备份并清理历史记录或恢复副本`;
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
    corruptCount: 0,
  };
}

function storedMigration(value: unknown): LegacyMigrationResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const migration = value as Partial<LegacyMigrationResult>;
  if (
    migration.status !== 'migrated'
    && migration.status !== 'no-legacy-data'
    && migration.status !== 'already-complete'
  ) {
    return null;
  }
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
    corruptCount: Number(migration.corruptCount) || 0,
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

function mergeCorruptEntries(
  existing: readonly CorruptLegacyEntry[],
  incoming: readonly CorruptLegacyEntry[],
): CorruptLegacyEntry[] {
  const seen = new Set<string>();
  const out: CorruptLegacyEntry[] = [];
  for (const entry of [...existing, ...incoming]) {
    if (!entry || typeof entry.key !== 'string') continue;
    const signature = `${entry.key}\0${entry.id ?? ''}\0${entry.raw}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push({ ...entry });
  }
  return out;
}

function buildListItem(record: DabingliRecord, now: string): RecordListItem {
  const id = String(record.id || RECORD_CORE.uid());
  return {
    id,
    updatedAt: now,
    schemaVersion: RECORD_CORE.SCHEMA_VERSION,
    basic: clone(record.basic),
    data: clone({ ...record, id, updatedAt: now }),
  };
}

export class IndexedDbRecordRepository implements RecordRepository {
  readonly kind = 'indexeddb' as const;
  readonly keys = RECORD_CORE.STORAGE_KEYS;
  readonly databaseName: string;
  private readonly db: DabingliDatabase;
  private readonly legacyStorage: StorageLike | null;
  private readonly autoMigrate: boolean;
  private readonly now: () => string;
  private readonly tabId: string;
  private readonly changeListeners = new Set<(event: RepositoryChangeEvent) => void>();
  private channel: BroadcastChannel | null = null;
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
    this.tabId = `tab_${RECORD_CORE.uid()}_${Math.random().toString(36).slice(2, 8)}`;
    if (options.broadcast !== false) {
      this.openSyncChannel();
    }
  }

  private openSyncChannel(): void {
    try {
      const Ctor = (globalThis as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel;
      if (typeof Ctor !== 'function') return;
      this.channel = new Ctor(`${SYNC_CHANNEL_PREFIX}${this.databaseName}`);
      this.channel.onmessage = (message: MessageEvent<unknown>) => {
        const data = message?.data as Partial<RepositoryChangeEvent> | undefined;
        if (!data || typeof data.type !== 'string' || data.tabId === this.tabId) return;
        for (const listener of this.changeListeners) {
          try {
            listener(data as RepositoryChangeEvent);
          } catch {
            // Isolate listener failures from repository operations.
          }
        }
      };
    } catch {
      this.channel = null;
    }
  }

  private notifyChange(
    type: RepositoryChangeEvent['type'],
    details: { recordId?: string; revision?: number } = {},
  ): void {
    if (!this.channel) return;
    const event: RepositoryChangeEvent = {
      type,
      databaseName: this.databaseName,
      at: this.now(),
      tabId: this.tabId,
      ...(details.recordId ? { recordId: details.recordId } : {}),
      ...(details.revision !== undefined ? { revision: details.revision } : {}),
    };
    try {
      this.channel.postMessage(event);
    } catch {
      // Ignore closed channel or serialization errors.
    }
  }

  onChange(listener: (event: RepositoryChangeEvent) => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  async estimateStorageQuota(): Promise<StorageQuotaInfo> {
    try {
      const estimateFn = (globalThis.navigator as { storage?: { estimate?: () => Promise<{ usage?: number; quota?: number }> } } | undefined)?.storage?.estimate;
      if (typeof estimateFn !== 'function') {
        return { supported: false, usage: 0, quota: 0, ratio: 0, lowSpace: false };
      }
      const result = await estimateFn.call(globalThis.navigator.storage);
      const usage = Number(result?.usage) || 0;
      const quota = Number(result?.quota) || 0;
      const ratio = quota > 0 ? usage / quota : 0;
      return {
        supported: true,
        usage,
        quota,
        ratio,
        lowSpace: quota > 0 && ratio >= QUOTA_LOW_SPACE_RATIO,
      };
    } catch {
      return { supported: false, usage: 0, quota: 0, ratio: 0, lowSpace: false };
    }
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
      const storageQuota = await this.estimateStorageQuota();
      if (!this.autoMigrate) {
        return {
          ok: true,
          migration: emptyMigration('not-applicable', '自动迁移已关闭'),
          ...(storageQuota.supported ? { storageQuota } : {}),
        };
      }
      const migration = await this.migrateLegacyLocalStorage();
      return {
        ok: migration.ok,
        ...(migration.reason ? { reason: migration.reason } : {}),
        migration,
        ...(storageQuota.supported ? { storageQuota } : {}),
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
      const result = await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        this.db.settings,
        this.db.meta,
        async () => {
          const raced = await this.db.meta.get(LEGACY_MIGRATION_META_KEY);
          if (raced) {
            const done = storedMigration(raced.value);
            if (done) return done;
          }

          const [recordCount, draftCount, currentCount, settingsCount] = await Promise.all([
            this.db.records.count(),
            this.db.drafts.count(),
            this.db.current.count(),
            this.db.settings.count(),
          ]);

          // Do not lock out future explicit mergeLegacyLocalStorage() when DB already has rows.
          if (recordCount + draftCount + currentCount + settingsCount > 0) {
            return emptyMigration('skipped', 'IndexedDB 已有数据，未自动覆盖；可手动合并导入旧本地数据');
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
          if (snapshot.corruptEntries.length) {
            const existingCorrupt = await this.db.meta.get(CORRUPT_LEGACY_META_KEY);
            const mergedCorrupt = mergeCorruptEntries(
              Array.isArray(existingCorrupt?.value) ? (existingCorrupt.value as CorruptLegacyEntry[]) : [],
              snapshot.corruptEntries,
            );
            await this.db.meta.put({
              key: CORRUPT_LEGACY_META_KEY,
              value: mergedCorrupt,
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
            corruptCount: snapshot.corruptEntries.length,
            ...(snapshot.corruptEntries.length ? { corruptEntries: snapshot.corruptEntries } : {}),
          };
          await this.db.meta.put({
            key: LEGACY_MIGRATION_META_KEY,
            value: migrated,
            updatedAt: this.now(),
          });
          return migrated;
        },
      );
      if (result.status === 'migrated') this.notifyChange('legacy-merged');
      return result;
    } catch (error) {
      return emptyMigration('failed', `迁移事务失败：${errorMessage(error)}`);
    }
  }

  /** Explicitly merge legacy localStorage data into an existing (possibly non-empty) IndexedDB. */
  async mergeLegacyLocalStorage(storageOverride?: StorageLike): Promise<LegacyMigrationResult> {
    const sourceStorage = storageOverride ?? this.legacyStorage;
    if (!sourceStorage) return emptyMigration('not-applicable');

    let snapshot: LegacyBrowserSnapshot;
    try {
      snapshot = readLegacyLocalStorage(sourceStorage, this.now);
    } catch (error) {
      return emptyMigration('failed', errorMessage(error));
    }

    if (!snapshot.hasLegacyData && snapshot.corruptEntries.length === 0) {
      return emptyMigration('no-legacy-data');
    }

    try {
      const result = await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        this.db.settings,
        this.db.meta,
        async () => {
          const existingList = await this.db.records.toArray();
          const existingById = new Map(existingList.map((item) => [item.id, item]));
          const now = this.now();

          const byId = new Map<string, RecordListItem>();
          for (const item of snapshot.records) byId.set(item.id, clone(item));
          for (const draft of snapshot.drafts) {
            if (!draft.id) continue;
            const listed = byId.get(draft.id);
            const draftTime = String(draft.meta.updatedAt || draft.updatedAt || '');
            if (!listed || draftTime > listed.updatedAt) byId.set(draft.id, buildListItem(draft, draftTime || now));
          }
          const incomingItems = [...byId.values()];
          const merged = RECORD_CORE.mergeImport(existingList, incomingItems);
          const changed = merged.list.filter((item) => existingById.get(item.id) !== item);

          if (changed.length) {
            await this.rebaseReplacedRevisions(changed, existingById);
            await this.db.records.bulkPut(changed.map((item) => clone(item)));
            await this.db.drafts.bulkPut(changed.map((item) => clone(item.data)));
          }

          const existingPointer = await this.db.current.get(CURRENT_KEY);
          if (!existingPointer && snapshot.currentId) {
            await this.db.current.put({ key: CURRENT_KEY, id: snapshot.currentId, at: now });
          }

          let settingsMigrated = false;
          const existingSettings = await this.db.settings.get(SETTINGS_KEY);
          if (!existingSettings && snapshot.settings) {
            await this.db.settings.put({ key: SETTINGS_KEY, data: snapshot.settings, updatedAt: now });
            settingsMigrated = true;
          }

          if (snapshot.corruptEntries.length) {
            const existingCorrupt = await this.db.meta.get(CORRUPT_LEGACY_META_KEY);
            const mergedCorrupt = mergeCorruptEntries(
              Array.isArray(existingCorrupt?.value) ? (existingCorrupt.value as CorruptLegacyEntry[]) : [],
              snapshot.corruptEntries,
            );
            await this.db.meta.put({
              key: CORRUPT_LEGACY_META_KEY,
              value: mergedCorrupt,
              updatedAt: now,
            });
          }

          const resultValue: LegacyMigrationResult = {
            ok: true,
            status: 'migrated',
            recordCount: incomingItems.length,
            draftCount: snapshot.drafts.length,
            settingsMigrated,
            currentId: existingPointer?.id ?? snapshot.currentId,
            legacyKeys: snapshot.legacyKeys,
            corruptCount: snapshot.corruptEntries.length,
            ...(snapshot.corruptEntries.length ? { corruptEntries: snapshot.corruptEntries } : {}),
            added: merged.added,
            updated: merged.updated,
            skipped: merged.skipped,
          };
          await this.db.meta.put({
            key: LEGACY_MIGRATION_META_KEY,
            value: resultValue,
            updatedAt: now,
          });
          return resultValue;
        },
      );
      this.notifyChange('legacy-merged');
      return result;
    } catch (error) {
      return emptyMigration(
        'failed',
        isQuotaExceededError(error) ? quotaFailureMessage('合并导入失败') : `合并迁移失败：${errorMessage(error)}`,
      );
    }
  }

  /** Atomically commit an Android-staged legacy payload in one IndexedDB transaction. */
  async importStagedSnapshot(input: StagedImportCommitInput): Promise<boolean> {
    const applied = await this.db.transaction(
      'rw',
      this.db.records,
      this.db.drafts,
      this.db.current,
      this.db.settings,
      this.db.meta,
      async () => {
        if (input.receipt) {
          const previous = await this.db.meta.get(ANDROID_STAGED_RECEIPT_KEY);
          if (previous?.value === input.receipt) return false;
        }
        const [recordCount, draftCount, currentCount, settingsCount] = await Promise.all([
          this.db.records.count(),
          this.db.drafts.count(),
          this.db.current.count(),
          this.db.settings.count(),
        ]);
        if (recordCount + draftCount + currentCount + settingsCount > 0) {
          throw new StagedImportConflictError();
        }

        const listItems = input.list.map((item) => ({
          ...clone(item),
          updatedAt: item.updatedAt || input.now,
          schemaVersion: RECORD_CORE.SCHEMA_VERSION,
        }));
        const draftItems = input.records.map((record) => canonicalRecord(record));

        if (listItems.length) await this.db.records.bulkPut(listItems);
        if (draftItems.length) await this.db.drafts.bulkPut(draftItems);
        if (input.snapshot.currentId) {
          const hasTarget = draftItems.some((item) => item.id === input.snapshot.currentId);
          if (hasTarget) {
            await this.db.current.put({
              key: CURRENT_KEY,
              id: input.snapshot.currentId,
              at: input.now,
            });
          }
        } else if (listItems[0]?.id) {
          await this.db.current.put({
            key: CURRENT_KEY,
            id: listItems[0].id,
            at: input.now,
          });
        }
        if (input.snapshot.settings) {
          await this.db.settings.put({
            key: SETTINGS_KEY,
            data: RECORD_CORE.normalizeSettings(input.snapshot.settings),
            updatedAt: input.now,
          });
        }
        if (input.snapshot.corruptEntries.length) {
          await this.db.meta.put({
            key: CORRUPT_LEGACY_META_KEY,
            value: input.snapshot.corruptEntries,
            updatedAt: input.now,
          });
        }
        const migrationMeta: LegacyMigrationResult = {
          ok: true,
          status: 'migrated',
          recordCount: listItems.length,
          draftCount: draftItems.length,
          settingsMigrated: input.snapshot.settings !== null,
          currentId: input.snapshot.currentId,
          legacyKeys: input.snapshot.legacyKeys,
          corruptCount: input.snapshot.corruptEntries.length,
        };
        await this.db.meta.put({
          key: LEGACY_MIGRATION_META_KEY,
          value: migrationMeta,
          updatedAt: input.now,
        });
        if (input.receipt) {
          await this.db.meta.put({
            key: ANDROID_STAGED_RECEIPT_KEY,
            value: input.receipt,
            updatedAt: input.now,
          });
        }
        return true;
      },
    );
    if (applied) this.notifyChange('backup-imported');
    return applied;
  }

  async exportCorruptLegacyEntries(): Promise<CorruptLegacyEntry[]> {
    const entries = await this.readMeta<CorruptLegacyEntry[]>(CORRUPT_LEGACY_META_KEY);
    return Array.isArray(entries) ? entries : [];
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
      return await this.db.transaction('r', this.db.drafts, this.db.records, this.db.current, async () => {
        const pointer = preferredId ? null : await this.db.current.get(CURRENT_KEY);
        const id = String(preferredId || pointer?.id || '').trim();
        if (!id) return { ok: true, record: null, fresh: true };

        const stored = (await this.db.drafts.get(id)) ?? (await this.db.records.get(id))?.data;
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

  async activateRecord(id: string): Promise<LoadCurrentResult> {
    try {
      return await this.db.transaction('rw', this.db.drafts, this.db.records, this.db.current, async () => {
        const result = await this.loadCurrent(id);
        if (result.ok && result.record) {
          await this.db.current.put({ key: CURRENT_KEY, id, at: this.now() });
        }
        return result;
      });
    } catch (error) {
      return { ok: false, record: null, error: true, reason: `打开病历失败：${errorMessage(error)}` };
    }
  }

  async saveCurrent(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
    if (!record || typeof record !== 'object') {
      return { ok: false, error: true, reason: '病历内容无效' };
    }

    try {
      const result = await this.db.transaction(
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

          if (expected !== null && remoteRevision !== expected) {
            return {
              ok: false,
              conflict: true,
              ...(existing ? { remote: existing } : {}),
              remoteRevision,
              reason: existing ? '其他页面已保存新版本' : '这份病历已从本机移除',
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
      if (result.ok && result.record?.id) {
        this.notifyChange('record-saved', { recordId: result.record.id, revision: result.revision });
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        error: true,
        reason: isQuotaExceededError(error) ? quotaFailureMessage('保存草稿失败') : `保存草稿失败：${errorMessage(error)}`,
      };
    }
  }

  async saveToLibrary(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult> {
    if (!record || typeof record !== 'object') {
      return { ok: false, error: true, reason: '病历内容无效' };
    }

    try {
      const result = await this.db.transaction(
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

          if (expected !== null && remoteRevision !== expected) {
            return {
              ok: false,
              conflict: true,
              ...(existing ? { remote: existing } : {}),
              remoteRevision,
              reason: existing ? '其他页面已保存新版本' : '这份病历已从本机移除',
            };
          }

          const now = this.now();
          if (!next.meta || typeof next.meta !== 'object') next.meta = {};
          next.schemaVersion = RECORD_CORE.SCHEMA_VERSION;
          next.meta.revision = Math.max(remoteRevision, Number(next.meta.revision) || 0) + 1;
          next.meta.updatedAt = now;
          next.updatedAt = now;
          const canonical = canonicalRecord(next);
          canonical.id = id;
          canonical.updatedAt = now;
          canonical.schemaVersion = RECORD_CORE.SCHEMA_VERSION;

          await this.db.drafts.put(canonical);
          await this.db.current.put({ key: CURRENT_KEY, id, at: now });
          await this.db.records.put(buildListItem(canonical, now));

          return { ok: true, record: canonical, revision: canonical.meta.revision };
        },
      );
      if (result.ok && result.record?.id) {
        this.notifyChange('record-saved', { recordId: result.record.id, revision: result.revision });
      }
      return result;
    } catch (error) {
      return {
        ok: false,
        error: true,
        reason: isQuotaExceededError(error) ? quotaFailureMessage('保存病历失败') : `保存病历失败：${errorMessage(error)}`,
      };
    }
  }

  async saveList(list: RecordListItem[]): Promise<SaveResult> {
    if (!Array.isArray(list)) return { ok: false, error: true, reason: '病历列表无效' };
    try {
      const result = await this.db.transaction('rw', this.db.records, async () => {
        await this.db.records.clear();
        if (list.length) await this.db.records.bulkPut(clone(list));
        return { ok: true };
      });
      this.notifyChange('list-saved');
      return result;
    } catch (error) {
      return {
        ok: false,
        error: true,
        reason: isQuotaExceededError(error) ? quotaFailureMessage('保存病历列表失败') : `保存病历列表失败：${errorMessage(error)}`,
      };
    }
  }

  async deleteRecord(id: string): Promise<SaveResult> {
    try {
      const result = await this.db.transaction(
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
      this.notifyChange('record-deleted', { recordId: id });
      return result;
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
      this.notifyChange('settings-saved');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: true,
        reason: isQuotaExceededError(error) ? quotaFailureMessage('保存设置失败') : `保存设置失败：${errorMessage(error)}`,
      };
    }
  }

  async importBackup(raw: string, mode: ImportMode): Promise<ImportSummary> {
    const parsed = parseBackup(raw);
    const importedItems: Array<RecordListItem & { rawNotesIncluded?: boolean }> = parsed.records.map((item) => {
      const data = clone(item.data);
      data.id = item.id;
      if (!data.updatedAt) data.updatedAt = item.updatedAt;
      return {
        id: item.id,
        updatedAt: item.updatedAt,
        rawNotesIncluded: item.rawNotesIncluded,
        schemaVersion: data.schemaVersion,
        basic: clone(data.basic),
        data,
      };
    });

    try {
      const summary = await this.db.transaction(
        'rw',
        this.db.records,
        this.db.drafts,
        this.db.current,
        this.db.settings,
        this.db.meta,
        async () => {
          const existingList = await this.db.records.toArray();
          const existingById = new Map(existingList.map((item) => [item.id, item]));
          const now = this.now();

          if (mode === 'replace') {
            const pointer = await this.db.current.get(CURRENT_KEY);
            const existingDrafts = await this.db.drafts.toArray();
            const replacedItems = RECORD_CORE.replaceImport(importedItems, existingList);
            await this.rebaseReplacedRevisions(replacedItems, existingById);
            const storedSettings = await this.db.settings.get(SETTINGS_KEY);
            const hasExistingData = existingList.length > 0 || existingDrafts.length > 0;
            let recoveryId: string | undefined;

            if (hasExistingData) {
              recoveryId = `recovery-${now.replace(/[^0-9A-Za-z]/g, '')}-${RECORD_CORE.uid()}`;
              const recovery: RecoveryCopy = {
                id: recoveryId,
                createdAt: now,
                reason: 'replace-import',
                records: clone(existingList),
                drafts: clone(existingDrafts),
                currentId: pointer?.id ?? null,
                settings: storedSettings ? clone(storedSettings.data) : null,
              };

              await this.db.meta.put({
                key: `${RECOVERY_PREFIX}${recoveryId}`,
                value: recovery,
                updatedAt: now,
              });

              const allRecoveries = await this.db.meta.where('key').startsWith(RECOVERY_PREFIX).toArray();
              if (allRecoveries.length > MAX_RECOVERY_COPIES) {
                const staleKeys = allRecoveries
                  .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
                  .slice(MAX_RECOVERY_COPIES)
                  .map((entry) => entry.key);
                if (staleKeys.length) await this.db.meta.bulkDelete(staleKeys);
              }
            }

            await this.db.records.clear();
            await this.db.drafts.clear();
            await this.db.current.clear();

            if (replacedItems.length) await this.db.records.bulkPut(replacedItems);
            if (replacedItems.length) {
              await this.db.drafts.bulkPut(replacedItems.map((item) => clone(item.data)));
            }

            const firstRecordId = replacedItems[0]?.id;
            if (firstRecordId) {
              await this.db.current.put({ key: CURRENT_KEY, id: firstRecordId, at: now });
            }

            return {
              mode,
              recordCount: parsed.records.length,
              ...(recoveryId ? { recoveryId } : {}),
              ...(firstRecordId ? { firstRecordId } : {}),
            };
          }

          const merged = RECORD_CORE.mergeImport(existingList, importedItems);
          const changed = merged.list.filter((item) => existingById.get(item.id) !== item);
          if (changed.length) {
            await this.rebaseReplacedRevisions(changed, existingById);
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
      this.notifyChange('backup-imported');
      return summary;
    } catch (error) {
      if (isQuotaExceededError(error)) throw new Error(quotaFailureMessage('导入备份失败'));
      throw error;
    }
  }

  private async rebaseReplacedRevisions(items: RecordListItem[], previousById: ReadonlyMap<string, RecordListItem>) {
    const drafts = await this.db.drafts.bulkGet(items.map((item) => item.id));
    items.forEach((item, index) => {
      const previous = drafts[index] ?? previousById.get(item.id)?.data;
      if (previous) {
        item.data.meta.revision = Math.max(Number(previous.meta.revision) || 0, Number(item.data.meta.revision) || 0) + 1;
      }
    });
  }

  async exportBackup(
    scope: BackupScope = 'all',
    options: { includeNotes?: boolean; draft?: DabingliRecord } = {},
  ): Promise<ExportBundle> {
    return this.db.transaction('r', this.db.records, this.db.drafts, this.db.current, async () => {
      const list = scope === 'current' ? [] : await this.db.records.toArray();
      const pointer = options.draft ? null : await this.db.current.get(CURRENT_KEY);
      const draft = options.draft ?? (pointer
        ? (await this.db.drafts.get(pointer.id)) ?? (await this.db.records.get(pointer.id))?.data
        : undefined);
      return createBackupBundle(list, draft, this.now(), options);
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
    const summary = await this.db.transaction(
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

        const restoredRecords = clone(recovery.records);
        const restoredDrafts = clone(recovery.drafts);
        const restoredIds = [...new Set([...restoredRecords, ...restoredDrafts]
          .map(({ id }) => id).filter((id): id is string => Boolean(id)))];
        const [currentRecords, currentDrafts] = await Promise.all([
          this.db.records.bulkGet(restoredIds),
          this.db.drafts.bulkGet(restoredIds),
        ]);
        const overwrittenRevisions = new Map<string, number>();
        restoredIds.forEach((id, index) => {
          const previous = currentDrafts[index] ?? currentRecords[index]?.data;
          if (previous) overwrittenRevisions.set(id, Number(previous.meta.revision) || 0);
        });
        for (const restored of [...restoredRecords.map((item) => item.data), ...restoredDrafts]) {
          const previous = restored.id ? overwrittenRevisions.get(restored.id) : undefined;
          if (previous !== undefined) restored.meta.revision = Math.max(previous, Number(restored.meta.revision) || 0) + 1;
        }

        await this.db.records.clear();
        await this.db.drafts.clear();
        await this.db.current.clear();
        await this.db.settings.clear();

        if (restoredRecords.length) await this.db.records.bulkPut(restoredRecords);
        if (restoredDrafts.length) await this.db.drafts.bulkPut(restoredDrafts);
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
    this.notifyChange('recovery-restored');
    return summary;
  }

  async readMeta<T = unknown>(key: string): Promise<T | null> {
    const entry = await this.db.meta.get(key);
    return entry ? (entry.value as T) : null;
  }

  async close(): Promise<void> {
    this.changeListeners.clear();
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignore close errors.
      }
      this.channel = null;
    }
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
