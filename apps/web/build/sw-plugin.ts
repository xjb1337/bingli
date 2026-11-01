import type { Plugin } from 'vite';

const CACHE_PREFIX = 'bingli-pages-';

function hashPrecacheUrls(urls: readonly string[]): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const character of urls.join('\n')) {
    const code = character.charCodeAt(0);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ code, 0x85ebca6b) >>> 0;
  }
  return first.toString(16).padStart(8, '0') + second.toString(16).padStart(8, '0');
}

function serviceWorkerSource(precacheUrls: readonly string[], version: string): string {
  return `'use strict';

const CACHE_PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};
const INDEX_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(
        PRECACHE_URLS.map((path) => new URL(path, self.registration.scope).href),
      ))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match(INDEX_URL, { ignoreVary: true })) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request.url, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstAsset(request));
});
`;
}

export function offlineServiceWorker(): Plugin {
  return {
    name: 'bingli-offline-service-worker',
    generateBundle(_options, bundle) {
      const emittedFiles = Object.values(bundle)
        .map((output) => output.fileName)
        .filter((fileName) => fileName !== 'sw.js')
        .sort((left, right) => left.localeCompare(right));
      const precacheUrls = [...new Set([
        './',
        './index.html',
        ...emittedFiles.map((fileName) => `./${fileName}`),
      ])];
      const version = hashPrecacheUrls(precacheUrls);

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: serviceWorkerSource(precacheUrls, version),
      });
    },
  };
}
