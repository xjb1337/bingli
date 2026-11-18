import {
  RECORD_CORE,
  SCHEMA,
  type AppSettings,
  type DabingliRecord,
  type LoadListResult,
  type RecordListItem,
  type StorageLike,
} from '@dabingli/domain';
import type { CorruptLegacyEntry } from './repository.js';

type EnumerableStorage = StorageLike & {
  readonly length?: number;
  key?(index: number): string | null;
  _dump?(): Map<string, string>;
};

export interface LegacyBrowserSnapshot {
  hasLegacyData: boolean;
  records: RecordListItem[];
  drafts: DabingliRecord[];
  currentId: string | null;
  settings: AppSettings | null;
  legacyKeys: string[];
  corruptEntries: CorruptLegacyEntry[];
}

function clone<T>(value: T): T {
  return RECORD_CORE.cloneValue(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function asRecord(value: unknown, label: string): DabingliRecord {
  try {
    return RECORD_CORE.normalizeRecord(
      value,
      SCHEMA.emptyRecord,
      SCHEMA.DEPARTMENTS.map((item) => item.key),
    );
  } catch (error) {
    throw new Error(`${label}无法迁移：${errorMessage(error)}`);
  }
}

function readText(storage: StorageLike, key: string): string | null {
  const got = RECORD_CORE.readRaw(storage, key);
  if (!got.ok) throw new Error(`无法读取旧 localStorage：${got.error ?? key}`);
  return got.missing ? null : got.raw;
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label}损坏，未执行迁移`);
  }
}

function storageKeys(storage: StorageLike): string[] {
  const candidate = storage as EnumerableStorage;
  const keys: string[] = [];

  if (typeof candidate.key === 'function' && typeof candidate.length === 'number') {
    for (let index = 0; index < candidate.length; index += 1) {
      const key = candidate.key(index);
      if (typeof key === 'string') keys.push(key);
    }
    return keys;
  }

  if (typeof candidate._dump === 'function') {
    return [...candidate._dump().keys()];
  }

  return Object.keys(storage as unknown as Record<string, unknown>).filter(
    (key) => !['getItem', 'setItem', 'removeItem', 'length', 'key', '_dump'].includes(key),
  );
}

function timestampOf(item: Partial<RecordListItem>, record: DabingliRecord, fallback: string): string {
  const fromItem = String(item.updatedAt || '');
  if (fromItem) return fromItem;
  const fromRecord = String(record.updatedAt || '');
  if (fromRecord) return fromRecord;
  const fromMeta = String(record.meta?.updatedAt || '');
  return fromMeta || fallback;
}

function legacyList(storage: StorageLike): RecordListItem[] {
  const loaded: LoadListResult = RECORD_CORE.loadList(storage);
  if (!loaded.ok) throw new Error(loaded.reason ?? '旧病历列表损坏，未执行迁移');
  if (!Array.isArray(loaded.list)) throw new Error('旧病历列表格式错误，未执行迁移');
  return loaded.list;
}

/**
 * Read and normalize legacy localStorage keys without mutating them.
 * Top-level list JSON corruption throws before touching IndexedDB, while
 * individual corrupt record/draft/pointer/settings entries are quarantined
 * into `corruptEntries` so valid records still migrate cleanly.
 */
export function readLegacyLocalStorage(
  storage: StorageLike,
  now: () => string = () => new Date().toISOString(),
): LegacyBrowserSnapshot {
  const keys = RECORD_CORE.STORAGE_KEYS;
  const presentKeys = storageKeys(storage).filter(
    (key) =>
      key === keys.list
      || key === keys.current
      || key === keys.settings
      || key.startsWith(keys.draftPrefix),
  );
  const listItems = legacyList(storage);
  const records: RecordListItem[] = [];
  const drafts = new Map<string, DabingliRecord>();
  const corruptEntries: CorruptLegacyEntry[] = [];

  for (const item of listItems) {
    if (!item || typeof item.id !== 'string' || !item.id) {
      corruptEntries.push({
        key: keys.list,
        reason: '旧病历列表条目缺少有效 ID',
        raw: safeStringify(item),
      });
      continue;
    }
    const id = item.id;
    const draftStorageKey = RECORD_CORE.draftKey(id);
    let draftRaw: string | null = null;
    try {
      draftRaw = readText(storage, draftStorageKey);
    } catch (error) {
      corruptEntries.push({
        key: draftStorageKey,
        id,
        reason: errorMessage(error),
        raw: '',
      });
    }

    let draft: DabingliRecord | null = null;
    if (draftRaw !== null) {
      try {
        draft = asRecord(parseJson(draftRaw, `旧草稿 ${id} `), `旧草稿 ${id} `);
      } catch (error) {
        corruptEntries.push({
          key: draftStorageKey,
          id,
          reason: errorMessage(error),
          raw: draftRaw,
        });
      }
    }

    if (!draft) {
      try {
        draft = asRecord(item.data, `旧病历 ${id} `);
      } catch (error) {
        if (draftRaw === null) {
          corruptEntries.push({
            key: keys.list,
            id,
            reason: errorMessage(error),
            raw: safeStringify(item),
          });
        }
        continue;
      }
    }

    draft.id = id;
    drafts.set(id, draft);
    records.push({
      id,
      updatedAt: timestampOf(item, draft, now()),
      schemaVersion: draft.schemaVersion,
      basic: clone(draft.basic),
      data: clone(draft),
    });
  }

  for (const key of presentKeys) {
    if (!key.startsWith(keys.draftPrefix)) continue;
    const id = key.slice(keys.draftPrefix.length);
    if (!id || drafts.has(id)) continue;
    let raw: string | null = null;
    try {
      raw = readText(storage, key);
    } catch (error) {
      corruptEntries.push({ key, id, reason: errorMessage(error), raw: '' });
      continue;
    }
    if (raw === null) continue;
    try {
      const draft = asRecord(parseJson(raw, `旧草稿 ${id} `), `旧草稿 ${id} `);
      draft.id = id;
      drafts.set(id, draft);
    } catch (error) {
      corruptEntries.push({ key, id, reason: errorMessage(error), raw });
    }
  }

  let currentId: string | null = null;
  let currentRaw: string | null = null;
  try {
    currentRaw = readText(storage, keys.current);
  } catch (error) {
    corruptEntries.push({ key: keys.current, reason: errorMessage(error), raw: '' });
  }
  if (currentRaw !== null) {
    try {
      const parsed = parseJson(currentRaw, '旧当前病历指针');
      if (RECORD_CORE.lookLikeRecord(parsed)) {
        const migrated = asRecord(parsed, '旧当前病历 ');
        const id = String(migrated.id || RECORD_CORE.uid());
        migrated.id = id;
        drafts.set(id, migrated);
        currentId = id;
      } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const id = String((parsed as { id?: unknown }).id || '').trim();
        if (id) currentId = drafts.has(id) || records.some((item) => item.id === id) ? id : null;
      } else {
        throw new Error('旧当前病历指针格式错误');
      }
    } catch (error) {
      corruptEntries.push({ key: keys.current, reason: errorMessage(error), raw: currentRaw });
    }
  }

  let settings: AppSettings | null = null;
  let settingsRaw: string | null = null;
  try {
    settingsRaw = readText(storage, keys.settings);
  } catch (error) {
    corruptEntries.push({ key: keys.settings, reason: errorMessage(error), raw: '' });
  }
  if (settingsRaw !== null) {
    try {
      const parsed = parseJson(settingsRaw, '旧设置');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('旧设置格式错误');
      }
      settings = RECORD_CORE.normalizeSettings(parsed);
    } catch (error) {
      corruptEntries.push({ key: keys.settings, reason: errorMessage(error), raw: settingsRaw });
    }
  }

  return {
    hasLegacyData: presentKeys.length > 0,
    records,
    drafts: [...drafts.values()],
    currentId,
    settings,
    legacyKeys: presentKeys,
    corruptEntries,
  };
}
