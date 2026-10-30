/* 大病历生成器 —— 在线版离线缓存
 *
 * 只做两件事：
 *   1. 首次访问后缓存应用本体（单文件 HTML），断网也能打开；
 *   2. 有新版本时把新文件放进缓存，等用户下次打开生效，不强制刷新。
 *
 * 本地 HTML（file://）不会注册 Service Worker，也不依赖它。
 */
const CACHE = 'dabingli-v3';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 页面导航：先取网络，断网时用缓存，保证能打开并继续编辑
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // 其他静态资源：缓存优先，后台更新
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
