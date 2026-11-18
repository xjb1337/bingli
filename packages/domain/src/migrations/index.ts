/** Pure adapters for the v1/v2/v3 legacy record and backup formats. */

import { buildExport as coreBuildExport, normalizeRecord, parseImport as coreParseImport, SCHEMA_VERSION } from '../core';
import { DEPARTMENTS, emptyRecord as schemaEmptyRecord } from '../schema';
import type { DabingliRecord, ExportBundle, ImportResult, RecordListItem } from '../types';

export { SCHEMA_VERSION };

export interface MigrationOptions {
  emptyRecord?: () => DabingliRecord;
  validDeptKeys?: readonly string[];
}

function deptKeys(): string[] {
  return DEPARTMENTS.map((d) => d.key);
}

export function migrateRecord(raw: unknown, options: MigrationOptions = {}): DabingliRecord {
  const empty = options.emptyRecord || schemaEmptyRecord;
  const valid = options.validDeptKeys || deptKeys();
  return normalizeRecord(raw, empty, valid);
}

export function parseImport(rawText: string, options: MigrationOptions = {}): ImportResult {
  const empty = options.emptyRecord || schemaEmptyRecord;
  const valid = options.validDeptKeys || deptKeys();
  return coreParseImport(rawText, empty, valid);
}

export function buildExport(
  records: readonly RecordListItem[],
  isoNow?: string,
  options: { includeDraft?: boolean; draft?: DabingliRecord; includeNotes?: boolean } = {}
): ExportBundle {
  return coreBuildExport(records, isoNow, options);
}

export const MIGRATIONS = {
  migrateRecord,
  parseImport,
  buildExport,
  SCHEMA_VERSION
};

export default MIGRATIONS;
