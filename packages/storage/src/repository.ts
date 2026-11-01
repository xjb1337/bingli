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

export interface LegacyMigrationResult {
  ok: boolean;
  status: LegacyMigrationStatus;
  reason?: string;
  recordCount: number;
  draftCount: number;
  settingsMigrated: boolean;
  currentId: string | null;
  legacyKeys: string[];
}

export interface RepositoryInitResult {
  ok: boolean;
  reason?: string;
  migration?: LegacyMigrationResult;
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
  saveCurrent(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult>;
  saveToLibrary(record: DabingliRecord, expectedRevision?: number): Promise<SaveResult>;
  saveList(list: RecordListItem[]): Promise<SaveResult>;
  deleteRecord(id: string): Promise<SaveResult>;
  loadSettings(): Promise<SettingsResult>;
  saveSettings(settings: AppSettings): Promise<SaveResult>;
  importBackup(raw: string, mode: ImportMode): Promise<ImportSummary>;
  exportBackup(scope?: BackupScope): Promise<ExportBundle>;
  listRecoveryCopies(): Promise<RecoveryCopySummary[]>;
  restoreRecovery(id: string): Promise<RestoreSummary>;
  readMeta<T = unknown>(key: string): Promise<T | null>;
  close(): Promise<void>;
}
