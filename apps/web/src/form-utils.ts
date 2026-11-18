import { useRef } from 'react';
import { RECORD_CORE, SCHEMA, type DabingliRecord, type FieldStore } from '@dabingli/domain';
import type { StepKey } from '../steps';

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

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function setNestedImmutable(current: unknown, parts: readonly string[], index: number, value: unknown): unknown {
  if (index >= parts.length) return value;
  const key = parts[index]!;
  if (UNSAFE_KEYS.has(key)) return current;

  if (Array.isArray(current)) {
    const numIndex = Number(key);
    if (!Number.isInteger(numIndex) || numIndex < 0) return current;
    const copy = current.slice();
    copy[numIndex] = setNestedImmutable(copy[numIndex], parts, index + 1, value);
    return copy;
  }

  const base = current && typeof current === 'object' ? (current as Record<string, unknown>) : {};
  const nextChild = setNestedImmutable(base[key], parts, index + 1, value);
  return { ...base, [key]: nextChild };
}

/**
 * Structural-sharing path update so typing in a single field does not deep-clone
 * the entire DabingliRecord on every keystroke.
 */
export function setPathImmutable(record: DabingliRecord, path: string, value: unknown): DabingliRecord {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length || parts.some((part) => UNSAFE_KEYS.has(part))) return record;
  return setNestedImmutable(record, parts, 0, value) as DabingliRecord;
}

export function markFieldManualImmutable(record: DabingliRecord, path: string): DabingliRecord {
  const prevMeta = record.meta;
  const prevStates = prevMeta.fieldStates ?? {};
  const next: DabingliRecord = {
    ...record,
    meta: {
      ...prevMeta,
      fieldStates: { ...prevStates },
    },
  };
  RECORD_CORE.markFieldManual(next, path);
  return next;
}

export function useStableListKeys(length: number, resetToken?: string | number) {
  const seqRef = useRef(0);
  const tokenRef = useRef(resetToken);
  const keysRef = useRef<string[]>([]);

  if (tokenRef.current !== resetToken) {
    tokenRef.current = resetToken;
    keysRef.current = [];
  }

  while (keysRef.current.length < length) {
    seqRef.current += 1;
    keysRef.current.push(`row-${seqRef.current}`);
  }
  if (keysRef.current.length > length) {
    keysRef.current = keysRef.current.slice(0, length);
  }

  function removeKeyAt(index: number) {
    keysRef.current = keysRef.current.filter((_, rowIndex) => rowIndex !== index);
  }

  return {
    keys: keysRef.current,
    removeKeyAt,
  };
}

export type StepCompletionState = 'done' | 'part' | 'empty' | 'none';

export function stepState(record: DabingliRecord, key: StepKey): StepCompletionState {
  const basic = record.basic;
  const hasText = (value: unknown) => String(value === undefined || value === null ? '' : value).trim() !== '';
  const anyContent = (obj: unknown): boolean => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj as Record<string, unknown>).some((value) => {
      if (typeof value === 'string') return hasText(value);
      if (typeof value === 'boolean') return value;
      if (value && typeof value === 'object') return anyContent(value);
      return false;
    });
  };

  switch (key) {
    case 'basic': {
      const filled = (['name', 'gender', 'age', 'chiefComplaint'] as const).filter((k) => hasText(basic[k])).length;
      return filled >= 3 ? 'done' : filled > 0 ? 'part' : 'empty';
    }
    case 'hpi': {
      const filled = (['onset', 'symptoms'] as const).filter((k) => hasText(record.hpi[k])).length;
      return filled === 2 ? 'done' : filled > 0 ? 'part' : 'empty';
    }
    case 'pmh': {
      if (hasText(record.pmh.health) && hasText(record.pmh.diseaseDetail)) return 'done';
      return anyContent(record.pmh) ? 'part' : 'empty';
    }
    case 'personal':
      return hasText(record.personal.smoking) || hasText(record.personal.environment)
        ? 'done'
        : anyContent(record.personal) ? 'part' : 'empty';
    case 'marriage':
      return hasText(basic.marital) ? 'done' : anyContent(record.marriage) ? 'part' : 'empty';
    case 'family':
      return anyContent(record.family) ? 'part' : 'empty';
    case 'pe': {
      const deptKey = basic.department || 'general';
      const dept = SCHEMA.DEPARTMENTS.find((item) => item.key === deptKey) ?? SCHEMA.DEPARTMENTS[0];
      let total = 0;
      let checked = 0;
      SCHEMA.PE_COMMON.forEach((group) => {
        group.items
          .filter((item) => !item.depts || item.depts.includes(deptKey))
          .forEach((item) => {
            total += 1;
            if (SCHEMA.peChecked(record, group.key, item.key)) checked += 1;
          });
      });
      (dept?.special ?? []).forEach((specialKey) => {
        const special = SCHEMA.PE_SPECIAL[specialKey];
        if (!special) return;
        special.items.forEach((item) => {
          total += 1;
          if (SCHEMA.peChecked(record, `special_${specialKey}`, item.key)) checked += 1;
        });
      });
      if (!checked) return 'empty';
      return checked >= Math.ceil(total * 0.6) ? 'done' : 'part';
    }
    case 'aux':
      return record.auxiliary.items.some((item) => hasText(item.name) || hasText(item.result)) ? 'done' : 'empty';
    case 'summary':
      return record.diagnosis.confirmed.some(hasText) ? 'done' : 'empty';
    case 'output':
      return 'none';
  }
}
