import {
  RECORD_CORE,
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

export type RepositoryKind = 'indexeddb' | 'localstorage' | 'memory';
export type ImportMode = 'merge' | 'replace';
export type BackupScope = 'all' | 'current';
export type LegacyMigrationStatus =
  | 'migrated'
  | 'no-legacy-data'
  | 'skipped'
  | 'already-complete'
  | 'failed'
  | 'not-applicable';

export interface CorruptLegacyEntry {
  key: string;
  id?: string;
  reason: string;
  raw: string;
}

export class StagedImportConflictError extends Error {
  constructor() {
    super('IndexedDB 已有数据，未覆盖');
    this.name = 'StagedImportConflictError';
  }
}

export interface StorageQuotaInfo {
  supported: boolean;
  usage: number;
  quota: number;
  ratio: number;
  lowSpace: boolean;
}

export interface RepositoryChangeEvent {
  type:
    | 'record-saved'
    | 'record-deleted'
    | 'list-saved'
    | 'settings-saved'
    | 'backup-imported'
    | 'recovery-restored'
    | 'legacy-merged';
  databaseName: string;
  recordId?: string;
  revision?: number;
  at: string;
  tabId: string;
}

export interface LegacyMigrationResult {
  ok: boolean;
  status: LegacyMigrationStatus;
  reason?: string;
  recordCount: number;
  draftCount: number;
  settingsMigrated: boolean;
  currentId: string | null;
  legacyKeys: string[];
  corruptCount?: number;
  corruptEntries?: CorruptLegacyEntry[];
  added?: number;
  updated?: number;
  skipped?: number;
}

export interface RepositoryInitResult {
  ok: boolean;
  reason?: string;
  migration?: LegacyMigrationResult;
  storageQuota?: StorageQuotaInfo;
}

export interface ImportSummary {
  mode: ImportMode;
  recordCount: number;
  added?: number;
  updated?: number;
  skipped?: number;
  recoveryId?: string;
  firstRecordId?: string;
}

export interface RecoveryCopySummary {
  id: string;
  createdAt: string;
  reason: string;
  recordCount: number;
}

export interface RestoreSummary {
  recoveryId: string;
  recordCount: number;
  firstRecordId?: string;
}

/**
 * Browser persistence boundary. Every mutation is asynchronous so IndexedDB
 * can complete the transaction before callers update UI state.
 */
export interface RecordRepository {
  readonly kind: RepositoryKind;
  readonly keys: typeof RECORD_CORE.STORAGE_KEYS;
  initialize(): Promise<RepositoryInitResult>;
  newRecord(): DabingliRecord;
  loadList(): Promise<LoadListResult>;
  loadCurrent(preferredId?: string): Promise<LoadCurrentResult>;
  activateRecord(id: string): Promise<LoadCurrentResult>;
  saveCurrent(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult>;
  saveToLibrary(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult>;
  saveList(list: RecordListItem[]): Promise<SaveResult>;
  deleteRecord(id: string): Promise<SaveResult>;
  loadSettings(): Promise<SettingsResult>;
  saveSettings(settings: AppSettings): Promise<SaveResult>;
  importBackup(raw: string, mode: ImportMode): Promise<ImportSummary>;
  exportBackup(scope?: BackupScope, options?: { includeNotes?: boolean; draft?: DabingliRecord }): Promise<ExportBundle>;
  listRecoveryCopies(): Promise<RecoveryCopySummary[]>;
  restoreRecovery(id: string): Promise<RestoreSummary>;
  readMeta<T = unknown>(key: string): Promise<T | null>;
  mergeLegacyLocalStorage?(storage?: StorageLike): Promise<LegacyMigrationResult>;
  exportCorruptLegacyEntries?(): Promise<CorruptLegacyEntry[]>;
  estimateStorageQuota?(): Promise<StorageQuotaInfo>;
  onChange?(listener: (event: RepositoryChangeEvent) => void): () => void;
  close(): Promise<void>;
}
