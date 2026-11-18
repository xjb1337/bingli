import type {
  DabingliRecord,
  FactState,
  FieldStore,
  PeGroup,
  PeItem,
  PeSpecialGroup,
  RosEntry
} from '../types';
import { PE_COMMON } from './pe-common';
import { PE_SPECIAL } from './pe-special';

export interface PeIndexEntry {
  group: PeGroup | PeSpecialGroup;
  groupName: string;
  item: PeItem;
  special?: boolean;
}

/** 展平 PE_COMMON + PE_SPECIAL 为索引，便于 O(1) 按 key 查找 */
export const PE_INDEX: Readonly<Record<string, PeIndexEntry>> = (() => {
  const idx: Record<string, PeIndexEntry> = {};
  PE_COMMON.forEach((group) => {
    group.items.forEach((item) => {
      idx[`${group.key}.${item.key}`] = { group, groupName: group.name, item, special: false };
    });
  });
  Object.keys(PE_SPECIAL).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (!sp) return;
    (sp.items || []).forEach((item) => {
      idx[`special_${spKey}.${item.key}`] = { group: sp, groupName: sp.name, item, special: true };
    });
  });
  return idx;
})();

/** 预建父项 -> 子项列表索引，避免每次线性过滤 PE_COMMON */
const PE_CHILDREN_INDEX: Readonly<Record<string, readonly PeItem[]>> = (() => {
  const idx: Record<string, PeItem[]> = {};
  PE_COMMON.forEach((group) => {
    group.items.forEach((item) => {
      if (!item.parent) return;
      const key = `${group.key}.${item.parent}`;
      if (!idx[key]) idx[key] = [];
      idx[key].push(item);
    });
  });
  return idx;
})();

/** 查找某个 '组.key'（含 'special_科室.key'）对应的查体项对象，找不到返回 null */
export function findPEItem(ref: unknown): PeItem | null {
  const text = String(ref == null ? '' : ref);
  const hit = PE_INDEX[text];
  return hit ? hit.item : null;
}

/** 取一组下以 parent 归属某父项的所有子项 */
export function childPEItems(groupKey: string, parentKey: string): PeItem[] {
  const list = PE_CHILDREN_INDEX[`${groupKey}.${parentKey}`];
  return list ? list.slice() : [];
}

/** 某个子项是否属于「已填写」状态 */
export function peItemFilled(store: FieldStore | Record<string, unknown> | undefined, item: PeItem | null | undefined): boolean {
  if (!item) return false;
  const raw = (store || {})[item.key];
  return raw !== undefined && raw !== null && String(raw).trim() !== '';
}

/** 父项是否应该让位给子项 */
export function parentSupersededByChild(
  store: FieldStore | Record<string, unknown> | undefined,
  groupKey: string,
  parentKey: string
): boolean {
  return childPEItems(groupKey, parentKey).some((it) => peItemFilled(store, it));
}

function normPeText(s: unknown): string {
  return String(s == null ? '' : s).trim().replace(/[，,；;。.、\s]+$/g, '');
}

/** 判断某个查体值是否「仍是默认描述」（即用户没改过） */
export function peValueIsDefault(item: PeItem | null | undefined, val: unknown): boolean {
  if (!item || !val) return false;
  const v = normPeText(val);
  if (item.default && v === normPeText(item.default)) return true;
  if (item.legacyDefault && v === normPeText(item.legacyDefault)) return true;
  if ((item.normalVariants || []).some((text) => v === normPeText(text))) return true;
  return false;
}

/* ---------------------- 查体项「是否本次检查了」 ---------------------- */

export const FACT_STATES: readonly FactState[] = [
  'asked_positive',
  'asked_negative',
  'not_asked',
  'default_normal_pending_review',
  'manual_text'
];

/** 统一事实状态；同时接受连字符写法 */
export function normalizeFactState(value: unknown): FactState | '' {
  const key = String(value == null ? '' : value).trim().toLowerCase().replace(/-/g, '_');
  return (FACT_STATES as readonly string[]).indexOf(key) >= 0 ? (key as FactState) : '';
}

/** ROS 条目状态：显式 status 优先，旧 checked/negative 仅作回退 */
export function rosFactState(entry: RosEntry | undefined): FactState {
  const item = entry || {};
  const explicit = normalizeFactState(item.status || item.factState);
  if (explicit) return explicit;
  if (item.checked) return 'asked_positive';
  if (item.negative) return 'asked_negative';
  return 'not_asked';
}

function peStoredFactState(
  record: Partial<DabingliRecord> | null | undefined,
  groupKey: string,
  itemKey: string
): FactState | '' {
  const all = (record || {}).peFactStates || {};
  const group = all[groupKey];
  if (!group || typeof group !== 'object') return '';
  const raw = group[itemKey];
  if (raw && typeof raw === 'object') return normalizeFactState(raw.state || raw.status);
  return normalizeFactState(raw);
}

/** 勾选/填写内容推导出的保守状态；显式状态永远优先 */
export function inferPeFactState(item: PeItem | null | undefined, value: unknown): FactState {
  const shown = String(value == null ? '' : value).trim();
  if (!shown) return 'asked_negative';
  return peValueIsDefault(item, shown) ? 'asked_negative' : 'asked_positive';
}

function ensurePeCheckedEntry(record: DabingliRecord, groupKey: string, itemKey: string, on: boolean): void {
  const pe = record.pe || (record.pe = {
    checked: {}, vitals: {}, general: {}, skin: {}, head: {}, neck: {},
    chest: {}, abdomen: {}, genital: {}, spine: {}, nervousPE: {}
  });
  const checked = pe.checked || (pe.checked = {});
  const g = checked[groupKey] || (checked[groupKey] = {});
  g[itemKey] = on;
}

function ensurePeFactStateEntry(record: DabingliRecord, groupKey: string, itemKey: string, state: FactState): void {
  const all = record.peFactStates || (record.peFactStates = {});
  const group = all[groupKey] || (all[groupKey] = {});
  group[itemKey] = state;
}

/**
 * 写入查体事实状态，并双向同步 `record.pe.checked[groupKey][itemKey]`，
 * 避免 `setPeFactState` 与 `setPeChecked` 状态撕裂。
 */
export function setPeFactState(
  record: DabingliRecord,
  groupKey: string,
  itemKey: string,
  state: FactState | string
): DabingliRecord {
  if (!record) return record;
  const normalized = normalizeFactState(state);
  if (!normalized) return record;
  ensurePeFactStateEntry(record, groupKey, itemKey, normalized);
  ensurePeCheckedEntry(record, groupKey, itemKey, normalized !== 'not_asked');
  return record;
}

/** 一个查体项到底做没做——「勾选制」的唯一真相 */
export function peChecked(
  record: Partial<DabingliRecord> | null | undefined,
  groupKey: string,
  itemKey: string
): boolean {
  const pe = (record || {}).pe;
  const explicit = peStoredFactState(record, groupKey, itemKey);
  if (explicit) return explicit !== 'not_asked';
  const ck = (pe && pe.checked) || {};
  const g = ck[groupKey];
  const raw = g && typeof g === 'object' ? g[itemKey] : undefined;
  if (raw === true || raw === false) return raw;
  const store = pe && (pe as unknown as Record<string, FieldStore | Record<string, FieldStore | undefined> | undefined>)[groupKey];
  const val = store && typeof store === 'object' ? (store as FieldStore)[itemKey] : undefined;
  if (val !== undefined && val !== null && String(val).trim() !== '') return true;
  if (String(groupKey).startsWith('special_')) return false;
  const item = findPEItem(`${groupKey}.${itemKey}`);
  if (!item) return false;
  if (item.parent) return false;
  return false;
}

/** 查体事实状态 */
export function peFactState(
  record: Partial<DabingliRecord> | null | undefined,
  groupKey: string,
  itemKey: string,
  itemOverride?: PeItem | null
): FactState {
  const explicit = peStoredFactState(record, groupKey, itemKey);
  if (explicit) return explicit;
  if (!peChecked(record, groupKey, itemKey)) return 'not_asked';
  const item = itemOverride || findPEItem(`${groupKey}.${itemKey}`);
  const pe = (record || {}).pe as unknown as Record<string, FieldStore | undefined> | undefined;
  const store = (pe && pe[groupKey]) || {};
  return inferPeFactState(item, store[itemKey]);
}

/**
 * 写入勾选状态，并双向同步 `record.peFactStates[groupKey][itemKey]`，
 * 确保即使此前显式写入过 `peFactStates`，调用 `setPeChecked` 也能生效。
 */
export function setPeChecked(
  record: DabingliRecord,
  groupKey: string,
  itemKey: string,
  on: boolean
): DabingliRecord {
  if (!record) return record;
  const flag = !!on;
  ensurePeCheckedEntry(record, groupKey, itemKey, flag);
  if (!flag) {
    ensurePeFactStateEntry(record, groupKey, itemKey, 'not_asked');
  } else if (peStoredFactState(record, groupKey, itemKey) === 'not_asked') {
    // 解除显式“未查”标记；若此前没有显式 peFactStates 条目则保持轻量，兼容未同步快照 peFactStates 的撤销逻辑
    if (record.peFactStates && record.peFactStates[groupKey]) {
      delete record.peFactStates[groupKey]![itemKey];
    }
  }
  return record;
}

/** 勾了但没写具体所见时，病历里自动补的那句话 */
export function peNormalText(item: PeItem | null | undefined): string {
  if (!item) return '';
  return String(item.normal || item.default || '').trim();
}
