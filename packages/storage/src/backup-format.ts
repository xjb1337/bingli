import {
  RECORD_CORE,
  SCHEMA,
  type DabingliRecord,
  type ExportBundle,
  type ImportResult,
  type RecordListItem,
} from '@dabingli/domain';

const DEPARTMENT_KEYS = SCHEMA.DEPARTMENTS.map((department) => department.key);

/** Build the same `{ app, schemaVersion, exportedAt, records }` bundle as the legacy app. */
export function createBackupBundle(
  list: readonly RecordListItem[],
  draft?: DabingliRecord | null,
  exportedAt?: string,
): ExportBundle {
  return RECORD_CORE.buildExport(
    [...list],
    exportedAt,
    draft ? { includeDraft: true, draft } : {},
  );
}

export function serializeBackup(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/** Parse both legacy backup bundles and single legacy record files. */
export function parseBackup(raw: string): ImportResult {
  return RECORD_CORE.parseImport(raw, SCHEMA.emptyRecord, DEPARTMENT_KEYS);
}
