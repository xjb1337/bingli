import { deleteIndexedDbDatabase } from '../src/indexeddb-repository.js';
import type { StorageLike } from '@dabingli/domain';

let sequence = 0;

export function databaseName(label: string): string {
  sequence += 1;
  return `dabingli-test-${label}-${Date.now()}-${sequence}`;
}

export async function removeDatabase(name: string): Promise<void> {
  await deleteIndexedDbDatabase(name);
}

export interface MemoryStorage extends StorageLike {
  readonly length: number;
  key(index: number): string | null;
  snapshot(): Record<string, string>;
}

export function memoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, String(value));
    },
    removeItem(key: string) {
      values.delete(key);
    },
    snapshot() {
      return Object.fromEntries(values);
    },
  };
}
