/* ===========================================================================
 * 数据边界层 —— 可独立测试
 *
 * 职责：
 *   1. 载入时把旧版本存档迁移/补齐到当前结构，损坏存档拒绝覆盖
 *   2. 严格校验导入的 JSON，拒绝危险键（原型污染）与非法结构
 *   3. 纯计算：病历列表增删改、去重、排序
 *   4. 导出/导入格式与恢复副本
 * =========================================================================== */

import type {
  AppSettings,
  DabingliRecord,
  DocumentEntryMeta,
  DocumentKind,
  ExportBundle,
  FieldSource,
  FieldState,
  ImportRecord,
  ImportResult,
  LoadCurrentResult,
  LoadListResult,
  MarriageConflict,
  RecordListItem,
  RecordMeta,
  RecordSummary,
  SaveResult,
  SettingsResult,
  StorageLike
} from './types';

export const SCHEMA_VERSION = 3;

/** 存储键：v1 起沿用，升级不改变键名 */
export const STORAGE_KEYS = {
  list: 'dabingli.records.v1',
  current: 'dabingli.current.v1',
  draftPrefix: 'dabingli.draft.v1.',
  settings: 'dabingli.settings.v1'
} as const;

export const SETTINGS_DEFAULTS: AppSettings = {
  rosMode: 'detail',
  fontScale: 1,
  lastStep: ''
};

export function draftKey(id: string): string {
  return STORAGE_KEYS.draftPrefix + String(id || '');
}

function fail(msg: string): never {
  throw new Error(msg);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function isText(x: unknown, max = 2 * 1024 * 1024): x is string {
  return typeof x === 'string' && x.length <= max;
}

function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/* ---------------------- 安全键检查（防原型污染） ---------------------- */

const DANGEROUS = ['__proto__', 'constructor', 'prototype'];

export function assertSafeKeys(value: unknown, depth = 0): void {
  if (depth > 20) fail('数据嵌套过深');
  if (!value || typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  Object.keys(obj).forEach((k) => {
    if (DANGEROUS.includes(k)) fail('数据包含不安全字段：' + k);
    assertSafeKeys(obj[k], depth + 1);
  });
}

/* ---------------------- 深度合并（补齐新增字段） ---------------------- */

function hasLegacyValue(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function deepMerge<T>(
  defaults: T,
  obj: unknown,
  onMismatch?: (path: string, value: unknown) => void,
  path?: string
): T {
  const p = path || '';
  if (Array.isArray(defaults)) {
    if (Array.isArray(obj)) return obj as unknown as T;
    if (obj !== undefined && obj !== null && onMismatch && hasLegacyValue(obj)) onMismatch(p, obj);
    return defaults;
  }
  if (defaults && typeof defaults === 'object') {
    if (obj !== undefined && obj !== null && !isObject(obj)) {
      if (onMismatch && hasLegacyValue(obj)) onMismatch(p, obj);
      return defaults;
    }
    const out: Record<string, unknown> = {};
    const defObj = defaults as Record<string, unknown>;
    const src = isObject(obj) ? obj : {};
    Object.keys(defObj).forEach((k) => {
      out[k] = deepMerge(defObj[k], src[k], onMismatch, p ? `${p}.${k}` : k);
    });
    Object.keys(src).forEach((k) => {
      if (!(k in out)) out[k] = src[k];
    });
    return out as T;
  }
  return (obj === undefined ? defaults : obj) as T;
}

function adaptLegacyShapes(raw: unknown): unknown {
  if (!isObject(raw)) return raw;
  const out = cloneValue(raw);

  if (Array.isArray(out.diagnosis)) {
    out.diagnosis = { confirmed: out.diagnosis };
  }

  if (isObject(out.pmh) && typeof out.pmh.allergy === 'boolean') {
    out.pmh.allergy = out.pmh.allergy ? '有' : '无';
  }

  const checkMapKeys = ['diseaseChecks', 'allergenChecks', 'allergenReactionChecks'];
  [out.pmh, out.family].forEach((section) => {
    if (!isObject(section)) return;
    checkMapKeys.forEach((key) => {
      const val = section[key];
      if (!Array.isArray(val)) return;
      const map: Record<string, boolean> = {};
      val.forEach((item) => {
        if (typeof item === 'string' && item.trim()) map[item.trim()] = true;
      });
      section[key] = map;
    });
  });

  if (isText(out.pmh)) out.pmh = { diseaseDetail: out.pmh };
  if (Array.isArray(out.auxiliary)) out.auxiliary = { items: out.auxiliary };
  if (isText(out.auxiliary)) out.auxiliary = { items: [{ name: '旧辅助检查', result: out.auxiliary }] };
  if (isObject(out.auxiliary) && Array.isArray(out.auxiliary.items)) {
    out.auxiliary.items = out.auxiliary.items.map((item) =>
      isText(item) ? { name: '旧辅助检查', result: item } : item
    );
  }

  return out;
}

/* ---------------------- 只填空白的合并（套用模板用） ---------------------- */

export function isBlankValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.every(isBlankValue);
  if (isObject(v)) return Object.keys(v).every((k) => isBlankValue(v[k]));
  return false;
}

export function cloneValue<T>(v: T): T {
  if (Array.isArray(v)) return v.map((item) => cloneValue(item)) as unknown as T;
  if (isObject(v)) {
    const out: Record<string, unknown> = {};
    Object.keys(v).forEach((k) => {
      out[k] = cloneValue(v[k]);
    });
    return out as T;
  }
  return v;
}

export function fillBlanks(target: unknown, source: unknown, path = ''): string[] {
  const filled: string[] = [];
  if (!isObject(target) || !isObject(source)) return filled;
  Object.keys(source).forEach((k) => {
    const p = path ? `${path}.${k}` : k;
    const s = source[k];
    if (isBlankValue(s)) return;
    if (isObject(s)) {
      if (!isObject(target[k])) target[k] = {};
      filled.push(...fillBlanks(target[k], s, p));
      return;
    }
    if (Array.isArray(s)) {
      if (isBlankValue(target[k])) {
        target[k] = cloneValue(s);
        filled.push(p);
      }
      return;
    }
    if (isBlankValue(target[k])) {
      target[k] = s;
      filled.push(p);
    }
  });
  return filled;
}

/* ---------------------- 指纹 / 字段状态 / 文书元数据 ---------------------- */

export function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',') + '}';
}

export function hashText(text: unknown): string {
  const s = String(text == null ? '' : text);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

export function fingerprint(value: unknown): string {
  return hashText(stableStringify(value));
}

export function getPath(obj: unknown, path: string): unknown {
  const parts = String(path || '').split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (DANGEROUS.includes(p)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length || DANGEROUS.includes(parts[0])) return obj;
  let cur = obj as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (DANGEROUS.includes(p)) return obj;
    if (!isObject(cur[p]) && !Array.isArray(cur[p])) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  const last = parts[parts.length - 1];
  if (!DANGEROUS.includes(last)) cur[last] = value;
  return obj;
}

const FIELD_SOURCES: readonly FieldSource[] = ['manual', 'template', 'default', 'example', 'generated', 'legacy', 'ai', ''];

export function normalizeFieldState(raw: unknown): FieldState {
  const s = isObject(raw) ? raw : {};
  const src = typeof s.source === 'string' && (FIELD_SOURCES as readonly string[]).includes(s.source)
    ? (s.source as FieldSource)
    : '';
  return {
    source: src,
    reviewed: s.reviewed === true,
    reviewedValueHash: isText(s.reviewedValueHash) ? s.reviewedValueHash : '',
    sourceRef: isText(s.sourceRef) ? s.sourceRef : ''
  };
}

export function fieldState(record: DabingliRecord | null | undefined, path: string): FieldState {
  const states = (record && record.meta && record.meta.fieldStates) || {};
  return normalizeFieldState(states[path]);
}

export function setFieldState(
  record: DabingliRecord,
  path: string,
  patch?: Partial<FieldState>
): DabingliRecord {
  if (!record) return record;
  if (!isObject(record.meta)) record.meta = {} as RecordMeta;
  if (!isObject(record.meta.fieldStates)) record.meta.fieldStates = {};
  const prev = normalizeFieldState(record.meta.fieldStates[path]);
  record.meta.fieldStates[path] = { ...prev, ...(patch || {}) };
  return record;
}

export function markFieldManual(record: DabingliRecord, path: string, _value?: unknown): DabingliRecord {
  setFieldState(record, path, {
    source: 'manual',
    reviewed: false,
    reviewedValueHash: '',
    sourceRef: ''
  });
  return record;
}

export function markFieldReviewed(record: DabingliRecord, path: string, source?: FieldSource | string): DabingliRecord {
  const v = getPath(record, path);
  const st = fieldState(record, path);
  return setFieldState(record, path, {
    source: (source || st.source || 'manual') as FieldSource,
    reviewed: true,
    reviewedValueHash: fingerprint(v)
  });
}

export function fieldReviewValid(record: DabingliRecord, path: string, value?: unknown): boolean {
  const st = fieldState(record, path);
  const v = value === undefined ? getPath(record, path) : value;
  return !!(st.reviewed && st.reviewedValueHash === fingerprint(v));
}

export function markLegacyFields(record: DabingliRecord): DabingliRecord {
  if (!record || !isObject(record.meta)) return record;
  if (!isObject(record.meta.fieldStates)) record.meta.fieldStates = {};
  const fieldStates = record.meta.fieldStates as Record<string, Partial<FieldState> | undefined>;
  const skip = new Set(['meta', 'documentMeta', 'schemaVersion', 'id']);
  const walk = (obj: Record<string, unknown>, path: string): void => {
    Object.keys(obj).forEach((k) => {
      if (!path && skip.has(k)) return;
      const p = path ? `${path}.${k}` : k;
      const v = obj[k];
      if (isObject(v)) {
        walk(v, p);
        return;
      }
      if (isBlankValue(v)) return;
      if (!fieldStates[p]) {
        fieldStates[p] = {
          source: 'legacy',
          reviewed: false,
          reviewedValueHash: '',
          sourceRef: ''
        };
      }
    });
  };
  walk(record as unknown as Record<string, unknown>, '');
  return record;
}

/* ---------------------- 生成段落的输入分组 ---------------------- */

const GROUP_LABELS: Record<string, string> = {
  identity: '基本情况与主诉',
  hpi: '现病史',
  pe: '体格检查',
  aux: '辅助检查',
  diagnosis: '诊断'
};

function peValueGroups(record: DabingliRecord | null | undefined): Record<string, unknown> {
  const pe = (record && record.pe) || {};
  const out: Record<string, unknown> = {};
  Object.keys(pe).forEach((k) => {
    if (k === 'checked' || k === 'vitals') return;
    out[k] = (pe as Record<string, unknown>)[k];
  });
  return out;
}

function identityGroup(record: DabingliRecord | null | undefined): Record<string, string> {
  const b = (record && record.basic) || ({} as DabingliRecord['basic']);
  return {
    department: b.department || '',
    name: b.name || '',
    gender: b.gender || '',
    age: b.age || '',
    birthDate: b.birthDate || '',
    admitDate: b.admitDate || '',
    marital: b.marital || '',
    chiefComplaint: b.chiefComplaint || '',
    chiefComplaintDuration: b.chiefComplaintDuration || '',
    chiefComplaintDurationUnit: b.chiefComplaintDurationUnit || '',
    recordDate: b.recordDate || ''
  };
}

function auxGroup(record: DabingliRecord | null | undefined): Array<Record<string, string>> {
  const items = (record && record.auxiliary && record.auxiliary.items) || [];
  return items.map((it) => ({
    name: (it && it.name) || '',
    result: (it && it.result) || '',
    date: (it && it.date) || '',
    hospital: (it && it.hospital) || '',
    no: (it && it.no) || ''
  }));
}

export function summaryGroups(record: DabingliRecord | null | undefined): Record<string, unknown> {
  return {
    identity: identityGroup(record),
    hpi: (record && record.hpi) || {},
    pe: {
      vitals: (record && record.pe && record.pe.vitals) || {},
      checked: (record && record.pe && record.pe.checked) || {},
      values: peValueGroups(record)
    },
    aux: auxGroup(record)
  };
}

export function firstCourseGroups(record: DabingliRecord | null | undefined, section?: string): Record<string, unknown> {
  if (section === 's') return { identity: identityGroup(record), hpi: (record && record.hpi) || {} };
  if (section === 'oPe') return { pe: summaryGroups(record).pe };
  if (section === 'oAux') return { aux: auxGroup(record) };
  return {
    diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || [],
    hpi: (record && record.hpi) || {},
    pe: summaryGroups(record).pe,
    aux: auxGroup(record)
  };
}

export function dischargeGroups(record: DabingliRecord | null | undefined, part?: string): Record<string, unknown> {
  if (part === 'diagnoses') return { diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || [] };
  return {
    identity: identityGroup(record),
    hpi: (record && record.hpi) || {},
    pe: summaryGroups(record).pe,
    diagnosis: (record && record.diagnosis && record.diagnosis.confirmed) || []
  };
}

export function groupFingerprints(groups: Record<string, unknown>): {
  groups: Record<string, string>;
  fingerprint: string;
} {
  const out: Record<string, string> = {};
  Object.keys(groups).forEach((k) => {
    out[k] = fingerprint(groups[k]);
  });
  return { groups: out, fingerprint: fingerprint(out) };
}

export function changedGroups(
  savedGroups: Record<string, string> | undefined,
  currentGroups: Record<string, string>
): string[] {
  const saved = isObject(savedGroups) ? (savedGroups as Record<string, string>) : {};
  const labels: string[] = [];
  Object.keys(currentGroups).forEach((k) => {
    if (saved[k] !== currentGroups[k]) labels.push(GROUP_LABELS[k] || k);
  });
  return labels;
}

export interface InternalDocMeta extends DocumentEntryMeta {
  inputGroups: Record<string, string>;
  generatedTextHash: string;
}

function emptyDocMeta(): InternalDocMeta {
  return {
    origin: '',
    inputFingerprint: '',
    inputGroups: {},
    generatedTextHash: '',
    textHash: '',
    reviewedFingerprint: '',
    updatedAt: ''
  };
}

export function docMeta(
  record: DabingliRecord | null | undefined,
  kind: DocumentKind | 'summary' | string,
  section?: string
): InternalDocMeta {
  const dm = (record && record.documentMeta) || {};
  if (kind === 'summary') return { ...emptyDocMeta(), ...((dm.summary as Partial<InternalDocMeta>) || {}) };
  if (kind === 'firstCourse') {
    const fc = dm.firstCourse || {};
    return { ...emptyDocMeta(), ...((fc[section || 's'] as Partial<InternalDocMeta>) || {}) };
  }
  if (kind === 'discharge') {
    const d = dm.discharge || {};
    const key = section || 'admitCondition';
    return { ...emptyDocMeta(), ...((d[key] as Partial<InternalDocMeta>) || {}) };
  }
  return emptyDocMeta();
}

export function ensureDocMeta(
  record: DabingliRecord,
  kind: DocumentKind | 'summary' | string,
  section?: string
): InternalDocMeta {
  if (!isObject(record.documentMeta)) record.documentMeta = {};
  const dm = record.documentMeta;
  if (kind === 'summary') {
    if (!isObject(dm.summary)) dm.summary = emptyDocMeta();
    return dm.summary as InternalDocMeta;
  }
  if (kind === 'firstCourse') {
    if (!isObject(dm.firstCourse)) dm.firstCourse = {};
    const key = section || 's';
    if (!isObject(dm.firstCourse[key])) dm.firstCourse[key] = emptyDocMeta();
    return dm.firstCourse[key] as InternalDocMeta;
  }
  if (kind === 'discharge') {
    if (!isObject(dm.discharge)) dm.discharge = {};
    const key = section || 'admitCondition';
    if (!isObject(dm.discharge[key])) {
      dm.discharge[key] =
        key === 'diagnoses'
          ? { origin: '', inputFingerprint: '', textHash: '', confirmed: false, confirmedFingerprint: '' }
          : emptyDocMeta();
    }
    return dm.discharge[key] as InternalDocMeta;
  }
  return emptyDocMeta();
}

export function docText(
  record: DabingliRecord | null | undefined,
  kind: DocumentKind | 'summary' | string,
  section?: string
): string {
  if (kind === 'summary') return String((record && record.summary) || '');
  if (kind === 'firstCourse') {
    const s = (record && record.soap) || ({} as DabingliRecord['soap']);
    if (section === 's') return String((s.s && s.s.summary) || '');
    if (section === 'oPe') return String((s.o && s.o.pe) || '');
    if (section === 'oAux') return String((s.o && s.o.aux) || '');
    const basisText = String((s.a && s.a.basis) || '');
    const detail = (s.a && s.a.basisDetail) || [];
    return basisText + (detail.length ? '\n' + stableStringify(detail) : '');
  }
  if (kind === 'discharge') {
    if (section === 'diagnoses') return stableStringify((record && record.discharge && record.discharge.diagnoses) || []);
    return String((record && record.discharge && record.discharge.admitCondition) || '');
  }
  return '';
}

export function docGroups(
  record: DabingliRecord | null | undefined,
  kind: DocumentKind | 'summary' | string,
  section?: string
): Record<string, unknown> {
  if (kind === 'summary') return summaryGroups(record);
  if (kind === 'firstCourse') return firstCourseGroups(record, section || 's');
  if (kind === 'discharge') return dischargeGroups(record, section || 'admitCondition');
  return {};
}

export interface DocumentStateResult {
  meta: InternalDocMeta;
  changed: string[];
  current: { groups: Record<string, string>; fingerprint: string };
  text: string;
  state: 'empty' | 'legacy' | 'fresh' | 'stale' | 'manual' | 'manual-stale' | 'reviewed' | 'reviewed-stale';
}

export function documentState(
  record: DabingliRecord | null | undefined,
  kind: DocumentKind | 'summary' | string,
  section?: string
): DocumentStateResult {
  const meta = docMeta(record, kind, section);
  const text = docText(record, kind, section);
  let hasText = text.trim() !== '';
  if (kind === 'discharge' && section === 'diagnoses') {
    try {
      hasText = (JSON.parse(text || '[]') as unknown[]).length > 0;
    } catch {
      hasText = false;
    }
  }
  const cur = groupFingerprints(docGroups(record, kind, section));
  const changed = changedGroups(meta.inputGroups, cur.groups);
  const base = { meta, changed, current: cur, text };
  if (!hasText) return { ...base, state: 'empty' };
  if (!meta.origin) return { ...base, state: 'legacy' };
  const textHash = hashText(text);
  if (meta.origin === 'manual') {
    return { ...base, state: changed.length ? 'manual-stale' : 'manual' };
  }
  if (meta.generatedTextHash && meta.generatedTextHash !== textHash) {
    return { ...base, state: changed.length ? 'manual-stale' : 'manual' };
  }
  if (changed.length) {
    return { ...base, state: meta.reviewedFingerprint ? 'reviewed-stale' : 'stale' };
  }
  if (meta.reviewedFingerprint && meta.reviewedFingerprint === cur.fingerprint) {
    return { ...base, state: 'reviewed' };
  }
  return { ...base, state: 'fresh' };
}

export function markDocumentGenerated(
  record: DabingliRecord,
  kind: DocumentKind | 'summary' | string,
  section?: string,
  text?: string
): InternalDocMeta {
  const m = ensureDocMeta(record, kind, section);
  const cur = groupFingerprints(docGroups(record, kind, section));
  const body = text === undefined ? docText(record, kind, section) : String(text);
  m.origin = 'generated';
  m.inputGroups = cur.groups;
  m.inputFingerprint = cur.fingerprint;
  m.generatedTextHash = hashText(body);
  m.reviewedFingerprint = '';
  m.updatedAt = new Date().toISOString();
  return m;
}

export function markDocumentManual(
  record: DabingliRecord,
  kind: DocumentKind | 'summary' | string,
  section?: string
): InternalDocMeta {
  const m = ensureDocMeta(record, kind, section);
  const cur = groupFingerprints(docGroups(record, kind, section));
  m.origin = 'manual';
  m.inputGroups = cur.groups;
  m.inputFingerprint = cur.fingerprint;
  m.generatedTextHash = hashText(docText(record, kind, section));
  m.reviewedFingerprint = '';
  m.updatedAt = new Date().toISOString();
  return m;
}

export function markDocumentReviewed(
  record: DabingliRecord,
  kind: DocumentKind | 'summary' | string,
  section?: string
): InternalDocMeta {
  const m = ensureDocMeta(record, kind, section);
  const cur = groupFingerprints(docGroups(record, kind, section));
  m.inputGroups = cur.groups;
  m.inputFingerprint = cur.fingerprint;
  m.reviewedFingerprint = cur.fingerprint;
  m.updatedAt = new Date().toISOString();
  return m;
}

/* ---------------------- 婚姻状态：唯一来源 ---------------------- */

export function marriageValue(record: DabingliRecord | null | undefined): string {
  const b = (record && record.basic) || ({} as Partial<DabingliRecord['basic']>);
  const m = (record && record.marriage) || ({} as Partial<DabingliRecord['marriage']>);
  return b.marital || m.status || '';
}

export function marriageConflict(record: DabingliRecord | null | undefined): MarriageConflict | null {
  const c = record && record.meta && record.meta.conflicts && record.meta.conflicts.marriage;
  if (!c || c.resolved) return null;
  return c;
}

export function resolveMarriage(record: DabingliRecord, value: string): DabingliRecord {
  if (!record.basic) record.basic = {} as DabingliRecord['basic'];
  if (!record.marriage) record.marriage = {} as DabingliRecord['marriage'];
  record.basic.marital = value || '';
  record.marriage.status = '';
  if (!record.meta) record.meta = {} as RecordMeta;
  if (!isObject(record.meta.conflicts)) record.meta.conflicts = {};
  record.meta.conflicts.marriage = {
    basicValue: value || '',
    marriageValue: '',
    resolved: true,
    chosen: value || '',
    resolvedAt: new Date().toISOString()
  };
  markFieldManual(record, 'basic.marital');
  return record;
}

/* ---------------------- 科室键的迁移 ---------------------- */

const DEPT_ALIASES: Record<string, string> = {};

const DEPT_NAME_ALIASES: Record<string, string> = {
  通用: 'general', 全科: 'general', 通用全科: 'general',
  呼吸内科: 'respiratory', 呼吸科: 'respiratory', 呼吸: 'respiratory',
  消化内科: 'digestive', 消化科: 'digestive', 消化: 'digestive',
  心血管内科: 'cardiology', 心内科: 'cardiology', 心内: 'cardiology', 循环内科: 'cardiology',
  内分泌科: 'endocrinology', 内分泌: 'endocrinology', 内分泌代谢科: 'endocrinology',
  肾内科: 'nephrology', 肾脏内科: 'nephrology', 肾内: 'nephrology', 肾病科: 'nephrology',
  血液内科: 'hematology', 血液科: 'hematology', 血液: 'hematology', 血内: 'hematology',
  神经内科: 'neurology', 神内科: 'neurology', 神内: 'neurology', 神经科: 'neurology',
  外科: 'surgery', 普外科: 'surgery', 普外: 'surgery', 骨科: 'surgery', 泌尿外科: 'surgery',
  神经外科: 'surgery', 心胸外科: 'surgery', 肝胆外科: 'surgery', 胃肠外科: 'surgery',
  产科: 'obstetrics', 妇产科: 'obstetrics',
  妇科: 'gynecology', 妇瘤科: 'gynecology',
  儿科: 'pediatrics', 小儿内科: 'pediatrics', 新生儿科: 'pediatrics', 小儿科: 'pediatrics',
  急诊: 'emergency', ICU: 'emergency', 重症医学科: 'emergency',
  急诊ICU: 'emergency', 急诊科: 'emergency', 重症监护室: 'emergency',
  精神科: 'psychiatry', 精神心理科: 'psychiatry', 心理科: 'psychiatry',
  心理咨询科: 'psychiatry', 心身医学科: 'psychiatry', 精神卫生科: 'psychiatry',
  精神病科: 'psychiatry', 精神医学: 'psychiatry'
};

const DEPT_NAME_ALIASES_LC: Record<string, string> = {};
Object.keys(DEPT_NAME_ALIASES).forEach((k) => {
  DEPT_NAME_ALIASES_LC[k.toLowerCase()] = DEPT_NAME_ALIASES[k];
});

export function normalizeDeptKey(key: unknown, validKeys: readonly string[]): string {
  const k = isText(key) ? key.trim() : '';
  if (validKeys.includes(k)) return k;
  if (DEPT_ALIASES[k] && validKeys.includes(DEPT_ALIASES[k])) return DEPT_ALIASES[k];
  const lc = k.toLowerCase();
  const exactKey = validKeys.find((v) => String(v).toLowerCase() === lc);
  if (exactKey) return exactKey;
  const byName = DEPT_NAME_ALIASES[k] || DEPT_NAME_ALIASES_LC[lc];
  if (byName && validKeys.includes(byName)) return byName;
  return 'general';
}

/* ---------------------- 病历结构校验 ---------------------- */

export function lookLikeRecord(r: unknown): r is DabingliRecord {
  if (!isObject(r)) return false;
  if (!isObject(r.basic)) return false;
  if (!isObject(r.hpi)) return false;
  if (!isObject(r.diagnosis)) return false;
  if (!Array.isArray(r.diagnosis.confirmed)) return false;
  if (!isObject(r.pe)) return false;
  if (!isObject(r.auxiliary)) return false;
  if (!Array.isArray(r.auxiliary.items)) return false;
  if (r.ros !== undefined && !isObject(r.ros)) return false;
  return true;
}

export function normalizeRecord(
  raw: unknown,
  emptyRecord: () => DabingliRecord,
  validDeptKeys: readonly string[]
): DabingliRecord {
  assertSafeKeys(raw);

  if (!isObject(raw) || !isObject(raw.basic)) {
    fail('不是有效的大病历存档（缺少基本信息）');
  }
  const hasAnyContent =
    Object.keys(raw.basic).some((k) => {
      const val = (raw.basic as Record<string, unknown>)[k];
      return isText(val) ? val.trim() !== '' : val !== undefined && val !== null;
    }) ||
    (isObject(raw.hpi) && Object.values(raw.hpi).some((v) => isText(v) && v.trim() !== ''));

  const legacyUnmapped: Record<string, unknown> = {};
  // `auxiliary` 字符串原值由 review-v3010-migration.test.cjs 显式锁定留档；`pmh` 已由 adaptLegacyShapes 迁移不再冗余写入。
  if (isText(raw.auxiliary)) legacyUnmapped.auxiliary = raw.auxiliary;

  const filled = deepMerge(emptyRecord(), adaptLegacyShapes(raw), (path, value) => {
    legacyUnmapped[path] = cloneValue(value);
  });

  if (!lookLikeRecord(filled)) fail('不是有效的大病历存档（缺少基本信息/现病史/诊断等关键结构）');
  if (raw.schemaVersion !== undefined && Number(raw.schemaVersion) > SCHEMA_VERSION) {
    fail('存档来自更新版本的应用，请先更新后再打开');
  }
  if (!hasAnyContent && !isObject(raw.hpi)) {
    fail('存档内容为空');
  }

  filled.schemaVersion = SCHEMA_VERSION;
  filled.rawNotes = isText(filled.rawNotes) ? filled.rawNotes : '';

  if (!isObject(filled.meta)) filled.meta = {} as RecordMeta;
  if (!isObject(filled.meta.fieldStates)) filled.meta.fieldStates = {};
  if (!isObject(filled.meta.conflicts)) filled.meta.conflicts = {};
  if (!Array.isArray(filled.meta.migrationNotes)) filled.meta.migrationNotes = [];
  if (!isObject(filled.meta.legacyUnmapped)) filled.meta.legacyUnmapped = {};
  const metaUnmapped = filled.meta.legacyUnmapped;
  const migrationNotes = filled.meta.migrationNotes;
  Object.keys(legacyUnmapped).forEach((p) => {
    metaUnmapped[p] = legacyUnmapped[p];
    const note = `旧数据字段 ${p} 的类型与当前结构不符，原值已保留在 meta.legacyUnmapped：${JSON.stringify(legacyUnmapped[p])}`;
    if (!migrationNotes.includes(note)) migrationNotes.push(note);
  });
  const rev = Number(filled.meta.revision);
  filled.meta.revision = Number.isFinite(rev) && rev >= 0 ? Math.floor(rev) : 0;
  const rawVersion = Number(raw.schemaVersion);
  if (Number.isFinite(rawVersion) && rawVersion < SCHEMA_VERSION) {
    filled.meta.migratedFrom = rawVersion;
    const note = `已从 v${rawVersion} 迁移到 v${SCHEMA_VERSION}`;
    if (!migrationNotes.includes(note)) migrationNotes.push(note);
  } else if (filled.meta.migratedFrom === undefined) {
    filled.meta.migratedFrom = null;
  }
  if (!isObject(filled.documentMeta)) filled.documentMeta = {};

  // 婚姻状态冲突合并
  const bMarital = isText(filled.basic.marital) ? filled.basic.marital.trim() : '';
  const mStatus = filled.marriage && isText(filled.marriage.status) ? filled.marriage.status.trim() : '';
  const existingConflict = filled.meta.conflicts.marriage;
  if (bMarital && mStatus) {
    if (bMarital === mStatus) {
      filled.marriage.status = '';
      const note = '婚姻状态两处一致，已统一到基本情况';
      if (!migrationNotes.includes(note)) migrationNotes.push(note);
    } else if (!existingConflict || !existingConflict.resolved) {
      filled.meta.conflicts.marriage = {
        basicValue: bMarital,
        marriageValue: mStatus,
        resolved: false,
        chosen: ''
      };
      const note = '婚姻状态两处不一致，已保留两个原值待选择';
      if (!migrationNotes.includes(note)) migrationNotes.push(note);
    }
  } else if (!bMarital && mStatus) {
    filled.basic.marital = mStatus;
    filled.marriage.status = '';
    const note = '婚姻状态已从婚姻史迁移到基本情况';
    if (!migrationNotes.includes(note)) migrationNotes.push(note);
  }

  // 文书元数据（v2 → v3）
  const fc = (isObject(filled.documentMeta.firstCourse) ? filled.documentMeta.firstCourse : {}) as NonNullable<
    NonNullable<DabingliRecord['documentMeta']>['firstCourse']
  >;
  (['s', 'oPe', 'oAux', 'basis'] as const).forEach((sec) => {
    if (!isObject(fc[sec])) fc[sec] = emptyDocMeta();
    const entry = fc[sec];
    if (entry && docText(filled, 'firstCourse', sec).trim() && !entry.origin) entry.origin = 'legacy';
  });
  filled.documentMeta.firstCourse = fc;
  if (!isObject(filled.documentMeta.summary)) filled.documentMeta.summary = emptyDocMeta();
  if (docText(filled, 'summary').trim() && !filled.documentMeta.summary.origin) {
    filled.documentMeta.summary.origin = 'legacy';
  }
  if (!isObject(filled.documentMeta.discharge)) filled.documentMeta.discharge = {};
  if (!isObject(filled.documentMeta.discharge.admitCondition)) {
    filled.documentMeta.discharge.admitCondition = emptyDocMeta();
  }
  if (
    docText(filled, 'discharge', 'admitCondition').trim() &&
    !filled.documentMeta.discharge.admitCondition.origin
  ) {
    filled.documentMeta.discharge.admitCondition.origin = 'legacy';
  }
  if (!isObject(filled.documentMeta.discharge.diagnoses)) {
    filled.documentMeta.discharge.diagnoses = {
      origin: '',
      inputFingerprint: '',
      textHash: '',
      confirmed: false,
      confirmedFingerprint: ''
    };
  }
  if (
    (filled.discharge && filled.discharge.diagnoses && filled.discharge.diagnoses.length) &&
    !filled.documentMeta.discharge.diagnoses.origin
  ) {
    filled.documentMeta.discharge.diagnoses.origin = 'legacy';
  }

  markLegacyFields(filled);
  Object.keys(filled.meta.fieldStates).forEach((k) => {
    if (filled.meta.fieldStates) {
      filled.meta.fieldStates[k] = normalizeFieldState(filled.meta.fieldStates[k]);
    }
  });

  if (validDeptKeys && validDeptKeys.length) {
    filled.basic.department = normalizeDeptKey(filled.basic.department, validDeptKeys);
  }
  (['age', 'chiefComplaintDuration'] as const).forEach((k) => {
    const val = filled.basic[k] as unknown;
    if (typeof val === 'number') filled.basic[k] = String(val);
  });
  filled.diagnosis.confirmed = (filled.diagnosis.confirmed || [])
    .filter((s) => isText(s))
    .map((s) => s.trim())
    .filter(Boolean);
  if (!filled.auxiliary.items.length) filled.auxiliary.items = [{ name: '', result: '' }];
  return filled;
}

/* ---------------------- 病历列表操作（纯函数） ---------------------- */

function secureUidPart(): string {
  try {
    const g = typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { crypto?: { getRandomValues?: (arr: Uint32Array) => void } })
      : undefined;
    const cryptoApi = g ? g.crypto : undefined;
    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
      const bytes = new Uint32Array(2);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes).map((n) => n.toString(36)).join('');
    }
  } catch {
    // 旧 WebView 没有 Web Crypto 时退回 Math.random
  }
  return '';
}

export function uid(now = Date.now(), rand: () => number = Math.random): string {
  const secure = rand === Math.random ? secureUidPart() : '';
  const entropy = secure || rand().toString(36).slice(2, 9);
  return 'r' + now.toString(36) + entropy;
}

export function summarize(item: RecordListItem | DabingliRecord): RecordSummary {
  const maybeItem = item as RecordListItem;
  const d = maybeItem && maybeItem.data ? maybeItem.data : (item as DabingliRecord) || ({} as DabingliRecord);
  const b = (d && d.basic) || ({} as Partial<DabingliRecord['basic']>);
  return {
    id: item.id || '',
    name: b.name || '未命名',
    gender: b.gender || '',
    age: b.age || '',
    birthDate: b.birthDate || '',
    admitDate: b.admitDate || '',
    department: b.department || '',
    chiefComplaint: b.chiefComplaint || '',
    updatedAt: item.updatedAt || ''
  };
}

export function sortByUpdated(list: readonly RecordListItem[]): RecordListItem[] {
  return [...list].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export function upsertRecord(
  list: readonly RecordListItem[],
  record: DabingliRecord,
  isoNow?: string
): { list: RecordListItem[]; id: string } {
  if (!isObject(record)) fail('病历内容无效');
  const id = record.id || uid();
  const stamp = isoNow || new Date().toISOString();
  const payload: RecordListItem = {
    id,
    updatedAt: stamp,
    schemaVersion: SCHEMA_VERSION,
    basic: JSON.parse(JSON.stringify(record.basic || {})) as Partial<DabingliRecord['basic']>,
    data: JSON.parse(JSON.stringify({ ...record, id, updatedAt: stamp })) as DabingliRecord
  };
  const out = Array.isArray(list) ? [...list] : [];
  const idx = out.findIndex((x) => x && x.id === id);
  if (idx >= 0) out[idx] = payload;
  else out.unshift(payload);
  return { list: out, id };
}

export function mergeListForWrite(
  stored: readonly RecordListItem[],
  local: readonly RecordListItem[]
): RecordListItem[] {
  const map = new Map<string, RecordListItem>();
  const put = (item: RecordListItem): void => {
    if (!item || !item.id) return;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      return;
    }
    const pr = Number(prev.data && prev.data.meta && prev.data.meta.revision) || 0;
    const nr = Number(item.data && item.data.meta && item.data.meta.revision) || 0;
    if (nr > pr) {
      map.set(item.id, item);
      return;
    }
    if (nr === pr && String(item.updatedAt || '') > String(prev.updatedAt || '')) map.set(item.id, item);
  };
  (Array.isArray(stored) ? stored : []).forEach(put);
  (Array.isArray(local) ? local : []).forEach(put);
  return Array.from(map.values()).sort((a, b) =>
    String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  );
}

export function removeRecord(list: readonly RecordListItem[], id: string): RecordListItem[] {
  return (Array.isArray(list) ? list : []).filter((x) => x && x.id !== id);
}

export function findRecord(list: readonly RecordListItem[], id: string): RecordListItem | null {
  return (Array.isArray(list) ? list : []).find((x) => x && x.id === id) || null;
}

export function searchRecords(
  list: readonly RecordListItem[],
  query: string,
  options?: { departmentName?: (key: string) => string }
): RecordListItem[] {
  const source = Array.isArray(list) ? list : [];
  const terms = String(query == null ? '' : query)
    .trim()
    .toLocaleLowerCase('zh-CN')
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return source.slice();
  const departmentName = options && typeof options.departmentName === 'function' ? options.departmentName : null;
  return source.filter((item) => {
    const data = item && item.data ? item.data : ((item as unknown as DabingliRecord) || {});
    const basic = data.basic || {};
    const diagnoses = [
      ...((data.diagnosis && data.diagnosis.confirmed) || []),
      ...((data.discharge && data.discharge.diagnoses) || [])
    ];
    const dept = String(basic.department || '');
    const text = [
      basic.name,
      basic.chiefComplaint,
      dept,
      departmentName ? departmentName(dept) : '',
      ...diagnoses
    ]
      .map((value) => String(value == null ? '' : value).toLocaleLowerCase('zh-CN'))
      .join('\n');
    return terms.every((term) => text.includes(term));
  });
}

const COPY_CLEARED_PATHS = Object.freeze([
  'basic.name',
  'basic.gender',
  'basic.age',
  'basic.birthDate',
  'basic.marital',
  'basic.nativePlace',
  'basic.birthPlace',
  'basic.nationality',
  'basic.occupation',
  'basic.workUnit',
  'basic.address',
  'basic.phone',
  'basic.recordNo',
  'basic.bedNo',
  'basic.admitDate',
  'basic.admitTime',
  'basic.recordDate',
  'basic.recordTime',
  'basic.informant',
  'basic.reliability',
  'menstruation.lmp',
  'childbirth.lastBirth',
  'soap.recordTime',
  'discharge.dischargeDate'
]);

const COPY_OPTIONAL_IDENTITY_PATHS = Object.freeze([
  'basic.idCard',
  'basic.idNumber',
  'basic.medicalRecordNo',
  'basic.caseNo',
  'basic.admissionNo',
  'basic.outpatientNo'
]);

const SENSITIVE_LEGACY_SEGMENTS = new Set([
  'basic', 'name', 'patientname', 'gender', 'age', 'birthdate', 'birthplace', 'nativeplace',
  'marital', 'marriage', 'nationality', 'occupation', 'workunit', 'address', 'phone',
  'tel', 'telephone', 'mobile', 'contact', 'recordno', 'bedno', 'admissionno',
  'medicalrecordno', 'caseno', 'outpatientno', 'id', 'idcard', 'idnumber', 'informant',
  'reliability', 'lmp', 'lastbirth', 'patient', 'patientid', 'sex', 'dob', 'mrn',
  'email', 'wechat', 'qq', 'insurance'
]);

function isClearedFieldStatePath(path: string): boolean {
  const key = String(path || '');
  if ((COPY_CLEARED_PATHS as readonly string[]).includes(key) || (COPY_OPTIONAL_IDENTITY_PATHS as readonly string[]).includes(key)) {
    return true;
  }
  if (key === 'pe.vitals' || key.indexOf('pe.vitals.') === 0) return true;
  return /^auxiliary\.items(?:\.\d+)?\.(?:date|no)$/i.test(key);
}

function isSensitiveLegacyPath(path: string): boolean {
  return String(path || '').split('.').some((raw) => {
    const key = raw.toLowerCase().replace(/[\s_-]+/g, '');
    if (!key) return false;
    if (key.indexOf('basic') === 0 || SENSITIVE_LEGACY_SEGMENTS.has(key)) return true;
    return /(date|time|number|phone|mobile|tel|address|birth|name|patient|contact|recordno|bedno|admissionno|medicalrecordno|caseno|outpatientno|marital|nationality|occupation|workunit|informant|reliability|lmp|lastbirth|idcard|idnumber|sex|dob|mrn|email|wechat|qq|insurance|no)$/.test(
      key
    );
  });
}

function blankValueShape<T>(value: T): T {
  if (Array.isArray(value)) return value.map(blankValueShape) as unknown as T;
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    Object.keys(value).forEach((key) => {
      out[key] = blankValueShape(value[key]);
    });
    return out as T;
  }
  return '' as unknown as T;
}

export function copyRecordAsNew(
  record: DabingliRecord,
  options?: { id?: string; now?: string }
): DabingliRecord {
  if (!isObject(record)) fail('病历内容无效');
  const opts = isObject(options) ? options : {};
  const copy = cloneValue(record);
  const now = opts.now || new Date().toISOString();
  copy.id = opts.id || uid();
  copy.updatedAt = now;
  copy.schemaVersion = SCHEMA_VERSION;
  copy.rawNotes = '';
  if (!isObject(copy.meta)) copy.meta = {} as RecordMeta;
  copy.meta.createdAt = now;
  copy.meta.updatedAt = now;
  copy.meta.revision = 0;
  copy.meta.lastTemplateFill = null;
  delete (copy.meta as Record<string, unknown>).importDraftCopy;
  delete (copy as unknown as Record<string, unknown>).__importGuard;
  copy.meta.conflicts = {};
  copy.meta.migratedFrom = null;
  copy.meta.migrationNotes = [];
  if (!isObject(copy.meta.fieldStates)) copy.meta.fieldStates = {};
  const fs = copy.meta.fieldStates;
  Object.keys(fs).forEach((p) => {
    if (isClearedFieldStatePath(p)) delete fs[p];
  });
  if (!isObject(copy.meta.legacyUnmapped)) copy.meta.legacyUnmapped = {};
  const lu = copy.meta.legacyUnmapped;
  Object.keys(lu).forEach((p) => {
    if (isSensitiveLegacyPath(p) || isClearedFieldStatePath(p)) {
      delete lu[p];
    }
  });
  COPY_CLEARED_PATHS.forEach((p) => {
    if (getPath(copy, p) !== undefined) setPath(copy, p, '');
  });
  COPY_OPTIONAL_IDENTITY_PATHS.forEach((p) => {
    if (getPath(copy, p) !== undefined) setPath(copy, p, '');
  });
  if (copy.pe && isObject(copy.pe.vitals)) copy.pe.vitals = blankValueShape(copy.pe.vitals);
  if (copy.auxiliary && Array.isArray(copy.auxiliary.items)) {
    copy.auxiliary.items = copy.auxiliary.items.map((item) => {
      if (!isObject(item)) return item;
      const next = cloneValue(item);
      if (next.date !== undefined) next.date = '';
      if (next.no !== undefined) next.no = '';
      return next;
    });
  }
  if (copy.discharge && copy.discharge.diagnosesConfirmed !== undefined) {
    copy.discharge.diagnosesConfirmed = false;
  }
  return copy;
}

/* ---------------------- 导出 / 导入 ---------------------- */

export function buildExport(
  list: readonly RecordListItem[],
  isoNow?: string,
  opts?: { includeDraft?: boolean; draft?: DabingliRecord; includeNotes?: boolean }
): ExportBundle {
  const options = isObject(opts) ? opts : {};
  const includeNotes = options.includeNotes === true;
  let base: RecordListItem[] = Array.isArray(list) ? list.slice() : [];
  if (options.includeDraft && isObject(options.draft)) {
    base = upsertRecord(base, options.draft, isoNow).list;
  }
  const records = base
    .filter((x) => x && isObject(x.data))
    .map((x) => {
      assertSafeKeys(x.data);
      const data = cloneValue(x.data);
      if (!includeNotes) delete data.rawNotes;
      return { id: x.id, updatedAt: x.updatedAt, data };
    });
  const out: ExportBundle = {
    app: 'dabingli',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: isoNow || new Date().toISOString(),
    records
  };
  if (options.includeDraft && isObject(options.draft)) out.includesDraft = true;
  if (includeNotes) out.includesNotes = true;
  return out;
}

export function parseImport(
  rawText: string,
  emptyRecord: () => DabingliRecord,
  validDeptKeys: readonly string[]
): ImportResult {
  if (!isText(rawText) || !rawText.trim()) fail('文件内容为空');
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    fail('不是有效的 JSON 文件');
  }
  assertSafeKeys(parsed);

  if (isObject(parsed) && Array.isArray(parsed.records)) {
    if (parsed.schemaVersion !== undefined && Number(parsed.schemaVersion) > SCHEMA_VERSION) {
      fail('备份来自更新版本的应用，请先更新后再导入');
    }
    if (!parsed.records.length) fail('备份中没有病历数据');
    const records: ImportRecord[] = parsed.records.map((item, i) => {
      const itemObj = isObject(item) ? item : null;
      const body = itemObj && isObject(itemObj.data) ? itemObj.data : item;
      const rawNotesIncluded = isObject(body) && parsed.includesNotes === true && hasOwn(body, 'rawNotes');
      try {
        return {
          id: (itemObj && isText(itemObj.id) && itemObj.id) || uid(),
          updatedAt: (itemObj && isText(itemObj.updatedAt) && itemObj.updatedAt) || '',
          rawNotesIncluded,
          data: normalizeRecord(body, emptyRecord, validDeptKeys)
        };
      } catch (e) {
        fail(`第 ${i + 1} 份病历无法识别：${(e as Error).message}`);
      }
    });
    return { records, mode: 'bundle', includesNotes: parsed.includesNotes === true };
  }

  if (lookLikeRecord(parsed)) {
    return {
      records: [
        {
          id: isText(parsed.id) ? parsed.id : uid(),
          updatedAt: isText(parsed.updatedAt) ? parsed.updatedAt : '',
          rawNotesIncluded: false,
          data: normalizeRecord(parsed, emptyRecord, validDeptKeys)
        }
      ],
      mode: 'single',
      includesNotes: false
    };
  }

  fail('无法识别的文件格式（既不是备份包，也不是单份病历）');
}

function finalizeImportedItem(item: ImportRecord, existing: RecordListItem | null): RecordListItem {
  if (!isObject(item)) return item as unknown as RecordListItem;
  const out = cloneValue(item) as ImportRecord & RecordListItem;
  const data = isObject(out.data) ? (out.data as DabingliRecord) : (out as unknown as DabingliRecord);
  const existingData = existing && (isObject(existing.data) ? existing.data : (existing as unknown as DabingliRecord));
  if (
    out.rawNotesIncluded !== true &&
    isObject(data) &&
    isObject(existingData) &&
    typeof existingData.rawNotes === 'string'
  ) {
    data.rawNotes = existingData.rawNotes;
  }
  delete out.rawNotesIncluded;
  return out;
}

export function mergeImport(
  list: readonly RecordListItem[],
  imported: readonly ImportRecord[]
): { list: RecordListItem[]; added: number; updated: number; skipped: number } {
  const out = Array.isArray(list) ? [...list] : [];
  let added = 0;
  let updated = 0;
  let skipped = 0;
  (imported || []).forEach((item) => {
    const idx = out.findIndex((x) => x && x.id === item.id);
    if (idx < 0) {
      out.unshift(finalizeImportedItem(item, null));
      added++;
      return;
    }
    const existingTime = String(out[idx].updatedAt || '');
    const incomingTime = String(item.updatedAt || '');
    if (incomingTime > existingTime) {
      out[idx] = finalizeImportedItem(item, out[idx]);
      updated++;
    } else {
      skipped++;
    }
  });
  return { list: out, added, updated, skipped };
}

export function replaceImport(
  imported: readonly ImportRecord[],
  existingList?: readonly RecordListItem[]
): RecordListItem[] {
  const existingById = new Map(
    (Array.isArray(existingList) ? existingList : [])
      .filter((item) => item && item.id)
      .map((item) => [item.id, item] as const)
  );
  return (Array.isArray(imported) ? imported : []).map((item) =>
    finalizeImportedItem(item, existingById.get(item && item.id) || null)
  );
}

/* ---------------------- 设置 ---------------------- */

export function normalizeSettings(raw: unknown): AppSettings {
  const out: AppSettings = { ...SETTINGS_DEFAULTS };
  if (isObject(raw)) {
    if (raw.rosMode === 'detail' || raw.rosMode === 'brief') out.rosMode = raw.rosMode;
    const fs = Number(raw.fontScale);
    if (Number.isFinite(fs) && fs >= 0.8 && fs <= 1.4) out.fontScale = Math.round(fs * 100) / 100;
    if (typeof raw.lastStep === 'string') out.lastStep = raw.lastStep;
  }
  return out;
}

/* ---------------------- 存储读写帮助（无副作用版本） ---------------------- */

export function memoryStorage(
  initial?: Iterable<readonly [string, string]>
): StorageLike & { _dump: () => Map<string, string> } {
  const map = new Map<string, string>(initial || []);
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) ?? null) : null),
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    _dump: () => new Map(map)
  };
}

export function safeSet(storage: StorageLike, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeGetJSON(storage: StorageLike, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readRaw(
  storage: StorageLike,
  key: string
): { ok: boolean; raw: string | null; missing?: boolean; error?: string } {
  try {
    const raw = storage.getItem(key);
    if (raw === null || raw === undefined) return { ok: true, raw: null, missing: true };
    return { ok: true, raw: String(raw), missing: false };
  } catch (e) {
    return { ok: false, raw: '', missing: false, error: String((e && (e as Error).message) || e) };
  }
}

export function writeRaw(storage: StorageLike, key: string, value: string): { ok: boolean; error?: string } {
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String((e && (e as Error).message) || e) };
  }
}

export function loadList(storage: StorageLike): LoadListResult {
  const got = readRaw(storage, STORAGE_KEYS.list);
  if (!got.ok) {
    return { ok: false, list: [], error: true, reason: '无法读取浏览器存储：' + got.error, raw: '' };
  }
  if (got.missing) return { ok: true, list: [], fresh: true };
  const rawText = got.raw || '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, list: [], corrupt: true, raw: rawText };
  }
  if (!Array.isArray(parsed)) return { ok: false, list: [], corrupt: true, raw: rawText };
  try {
    assertSafeKeys(parsed);
  } catch {
    return { ok: false, list: [], corrupt: true, raw: rawText };
  }
  return { ok: true, list: parsed as RecordListItem[] };
}

export function loadCurrent(
  storage: StorageLike,
  emptyRecord: () => DabingliRecord,
  validDeptKeys: readonly string[],
  preferredId?: string
): LoadCurrentResult {
  const got = readRaw(storage, STORAGE_KEYS.current);
  if (!got.ok) {
    return { ok: false, record: null, error: true, reason: '无法读取浏览器存储：' + got.error };
  }
  let pointer: unknown = null;
  if (!got.missing) {
    try {
      pointer = JSON.parse(got.raw || '');
    } catch {
      return { ok: false, record: null, corrupt: true, raw: got.raw || '', reason: '正在编辑的病历存档已损坏' };
    }
  }

  if (isObject(pointer) && isObject(pointer.basic)) {
    const legacyRaw = got.raw || '';
    let migrated: DabingliRecord;
    try {
      migrated = normalizeRecord(pointer, emptyRecord, validDeptKeys);
    } catch (e) {
      return { ok: false, record: null, corrupt: true, raw: legacyRaw, reason: (e as Error).message };
    }
    if (!migrated.id) migrated.id = uid();
    if (!isObject(migrated.meta)) migrated.meta = {} as RecordMeta;
    if (!Number.isFinite(Number(migrated.meta.revision))) migrated.meta.revision = 0;
    const draft = saveCurrent(storage, migrated, migrated.meta.revision);
    if (!draft.ok) {
      return {
        ok: false,
        record: null,
        corrupt: true,
        raw: legacyRaw,
        reason: '旧存档迁移失败：' + (draft.reason || '无法写入')
      };
    }
    return { ok: true, record: draft.record || null, migrated: true };
  }

  const id = String(preferredId || (isObject(pointer) ? pointer.id : pointer) || '').trim();
  if (!id) return { ok: true, record: null, fresh: true };

  const dgot = readRaw(storage, draftKey(id));
  if (!dgot.ok) {
    return { ok: false, record: null, error: true, reason: '无法读取浏览器存储：' + dgot.error };
  }
  if (dgot.missing) return { ok: true, record: null, fresh: true, missingDraft: true };
  try {
    return { ok: true, record: normalizeRecord(JSON.parse(dgot.raw || ''), emptyRecord, validDeptKeys) };
  } catch (e) {
    return { ok: false, record: null, corrupt: true, raw: dgot.raw || '', reason: (e as Error).message };
  }
}

export function loadSettings(storage: StorageLike): SettingsResult {
  const got = readRaw(storage, STORAGE_KEYS.settings);
  if (!got.ok || got.missing) return { ok: got.ok, settings: { ...SETTINGS_DEFAULTS }, raw: got.raw || '' };
  try {
    return { ok: true, settings: normalizeSettings(JSON.parse(got.raw || '')), raw: got.raw || '' };
  } catch {
    return { ok: false, settings: { ...SETTINGS_DEFAULTS }, corrupt: true, raw: got.raw || '' };
  }
}

export function saveCurrent(
  storage: StorageLike,
  record: DabingliRecord,
  expectedRevision?: number
): SaveResult {
  if (!isObject(record)) return { ok: false, error: true, reason: '病历内容无效' };
  if (!record.id) record.id = uid();
  const key = draftKey(record.id);
  const got = readRaw(storage, key);
  if (!got.ok) return { ok: false, error: true, reason: '无法读取当前存档：' + got.error };
  let existing: DabingliRecord | null = null;
  if (!got.missing) {
    try {
      existing = JSON.parse(got.raw || '') as DabingliRecord;
    } catch {
      return { ok: false, corrupt: true, raw: got.raw || '', reason: '现有存档无法解析，未覆盖' };
    }
  }
  const remoteRev = Number(existing && existing.meta && existing.meta.revision) || 0;
  const expect = expectedRevision === undefined || expectedRevision === null ? null : Number(expectedRevision);
  if (existing && expect !== null && remoteRev !== expect) {
    return {
      ok: false,
      conflict: true,
      remote: existing,
      remoteRevision: remoteRev,
      reason: '其他页面已保存新版本'
    };
  }
  const now = new Date().toISOString();
  const next = cloneValue(record);
  if (!isObject(next.meta)) next.meta = {} as RecordMeta;
  next.schemaVersion = SCHEMA_VERSION;
  next.meta.revision = Math.max(remoteRev, Number(next.meta.revision) || 0) + 1;
  next.meta.updatedAt = now;
  const wrote = writeRaw(storage, key, JSON.stringify(next));
  if (!wrote.ok) return { ok: false, error: true, reason: '保存失败：' + wrote.error };
  writeRaw(storage, STORAGE_KEYS.current, JSON.stringify({ id: next.id, at: now }));
  return { ok: true, record: next, revision: next.meta.revision };
}

export function draftMatches(storage: StorageLike, record: DabingliRecord): boolean {
  if (!isObject(record) || !record.id) return false;
  const got = readRaw(storage, draftKey(record.id));
  if (!got.ok || got.missing) return false;
  try {
    const existing = JSON.parse(got.raw || '') as Record<string, unknown>;
    const strip = (r: unknown): Record<string, unknown> => {
      const c = cloneValue(r) as Record<string, unknown>;
      delete c.meta;
      delete c.updatedAt;
      return c;
    };
    return stableStringify(strip(existing)) === stableStringify(strip(record));
  } catch {
    return false;
  }
}

export function saveList(storage: StorageLike, list: readonly RecordListItem[]): SaveResult {
  if (!Array.isArray(list)) return { ok: false, error: true, reason: '病历列表无效' };
  const wrote = writeRaw(storage, STORAGE_KEYS.list, JSON.stringify(list));
  if (!wrote.ok) return { ok: false, error: true, reason: '保存失败：' + wrote.error };
  return { ok: true };
}

export function saveSettings(storage: StorageLike, settings: AppSettings): SaveResult {
  const wrote = writeRaw(storage, STORAGE_KEYS.settings, JSON.stringify(normalizeSettings(settings)));
  if (!wrote.ok) return { ok: false, error: true, reason: '设置保存失败：' + wrote.error };
  return { ok: true };
}

export interface HistorySnapshot {
  label: string;
  at: string;
  snapshot: DabingliRecord;
}

export function createHistory(limit?: number) {
  const cap = Number.isFinite(limit) && (limit as number) > 0 ? Math.floor(limit as number) : 20;
  const stacks = new Map<string, HistorySnapshot[]>();
  return {
    push(record: DabingliRecord, label?: string): boolean {
      if (!record || !record.id) return false;
      let text: string;
      try {
        text = JSON.stringify(record);
      } catch {
        return false;
      }
      if (text.length > 4 * 1024 * 1024) return false;
      const arr = stacks.get(record.id) || [];
      arr.push({ label: label || '编辑', at: new Date().toISOString(), snapshot: cloneValue(record) });
      while (arr.length > cap) arr.shift();
      stacks.set(record.id, arr);
      return true;
    },
    pop(id: string): HistorySnapshot | null {
      const arr = stacks.get(id) || [];
      return arr.pop() || null;
    },
    peek(id: string): HistorySnapshot | null {
      const arr = stacks.get(id) || [];
      return arr[arr.length - 1] || null;
    },
    list(id: string): Array<{ label: string; at: string }> {
      return (stacks.get(id) || []).map((x) => ({ label: x.label, at: x.at }));
    },
    size(id: string): number {
      return (stacks.get(id) || []).length;
    },
    clear(id: string): void {
      stacks.delete(id);
    }
  };
}

export const RECORD_CORE = {
  SCHEMA_VERSION,
  STORAGE_KEYS,
  SETTINGS_DEFAULTS,
  assertSafeKeys,
  deepMerge,
  normalizeDeptKey,
  isBlankValue,
  cloneValue,
  fillBlanks,
  stableStringify,
  hashText,
  fingerprint,
  getPath,
  setPath,
  fieldState,
  setFieldState,
  markFieldManual,
  markFieldReviewed,
  fieldReviewValid,
  markLegacyFields,
  normalizeFieldState,
  summaryGroups,
  firstCourseGroups,
  dischargeGroups,
  groupFingerprints,
  changedGroups,
  docMeta,
  ensureDocMeta,
  docText,
  docGroups,
  documentState,
  markDocumentGenerated,
  markDocumentManual,
  markDocumentReviewed,
  marriageValue,
  marriageConflict,
  resolveMarriage,
  normalizeRecord,
  lookLikeRecord,
  uid,
  summarize,
  sortByUpdated,
  upsertRecord,
  removeRecord,
  findRecord,
  mergeListForWrite,
  searchRecords,
  copyRecordAsNew,
  buildExport,
  parseImport,
  mergeImport,
  replaceImport,
  normalizeSettings,
  memoryStorage,
  safeSet,
  safeGetJSON,
  readRaw,
  writeRaw,
  loadList,
  loadCurrent,
  loadSettings,
  draftKey,
  draftMatches,
  saveCurrent,
  saveList,
  saveSettings,
  createHistory
};

export default RECORD_CORE;
