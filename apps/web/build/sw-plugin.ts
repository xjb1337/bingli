import type { Plugin } from 'vite';

const CACHE_PREFIX = 'bingli-pages-';

function cacheVersion(parts: readonly string[]): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (const character of parts.join('\n')) {
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
        PRECACHE_URLS.map((path) => new Request(new URL(path, self.registration.scope), {
          cache: path === './' || path === './index.html' ? 'reload' : 'default',
        })),
      )),
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

async function cacheFirstNavigation(request) {
  const shell = await caches.match(INDEX_URL, { cacheName: CACHE_NAME, ignoreVary: true });
  return shell || fetch(request);
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request.url, { cacheName: CACHE_NAME, ignoreVary: true });
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
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  if (request.mode === 'navigate') {
    event.respondWith(cacheFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirstAsset(request));
});
`;
}

export function offlineServiceWorker(): Plugin {
  return {
    name: 'bingli-offline-service-worker',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const emittedFiles = Object.values(bundle)
          .map((output) => output.fileName)
          .filter((fileName) => fileName !== 'sw.js')
          .sort((left, right) => left.localeCompare(right));
        const precacheUrls = [...new Set([
          './',
          './index.html',
          ...emittedFiles.map((fileName) => `./${fileName}`),
        ])];
        const shell = bundle['index.html'];
        const shellSource = shell?.type === 'asset' ? shell.source.toString() : '';
        const version = cacheVersion([...precacheUrls, shellSource, serviceWorkerSource(precacheUrls, '')]);

        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: serviceWorkerSource(precacheUrls, version),
        });
      },
    },
  };
}
