import { RECORD_CORE, type DabingliRecord, type FieldStore } from '@dabingli/domain';

export function stringAt(record: DabingliRecord, path: string): string {
  const value = RECORD_CORE.getPath(record, path);
  return typeof value === 'string' ? value : value === undefined || value === null ? '' : String(value);
}

export function booleanAt(record: DabingliRecord, path: string): boolean {
  return RECORD_CORE.getPath(record, path) === true;
}

export function fieldStoreAt(record: DabingliRecord, path: string): FieldStore {
  const value = RECORD_CORE.getPath(record, path);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as FieldStore;
}

export function withoutTrailingPunctuation(text: string): string {
  return text.trim().replace(/[。；;]+$/u, '');
}
