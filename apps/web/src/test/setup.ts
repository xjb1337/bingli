import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

function createMemoryWebStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(String(key)) ? (store.get(String(key)) ?? null) : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
  };
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof window !== 'undefined' && typeof window[name]?.clear !== 'function') {
    const storage = createMemoryWebStorage();
    Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
    Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
  }
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
