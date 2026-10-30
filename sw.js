/* 大病历生成器 —— 在线版离线缓存
 *
 * 只做两件事：
 *   1. 首次访问后缓存应用本体（单文件 HTML），断网也能打开；
 *   2. 有新版本时把新文件放进缓存，等用户下次打开生效，不强制刷新。
 *
 * 本地 HTML（file://）不会注册 Service Worker，也不依赖它。
 *
 * 缓存边界：
 *   - 只缓存同源、GET、res.ok、basic 类型的响应；404/500 和 opaque 响应不写入。
 *   - 导航请求网络失败或返回非 2xx 时，回退到已经缓存的有效 index.html。
 *   - activate 只清理本应用 `dabingli-` 前缀的旧缓存，不动同源其他应用的缓存。
 *   - 所有 cache.put 都挂在 event.waitUntil 上，页面关闭时不会被中途掐断。
 */
const CACHE_PREFIX = 'dabingli-';
const CACHE = CACHE_PREFIX + 'v3';
const APP_SHELL = ['./', './index.html'];

function cacheable(res) {
  return !!res && res.ok && res.type === 'basic';
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：先取网络；网络失败或非 2xx 时用缓存，保证能打开并继续编辑
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (!cacheable(res)) {
            return caches.match('./index.html')
              .then(hit => hit || caches.match('./'))
              .then(hit => hit || res);
          }
          const copy = res.clone();
          event.waitUntil(
            caches.open(CACHE).then(cache => cache.put('./index.html', copy)).catch(() => {})
          );
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // 其他静态资源：缓存优先，后台更新；只缓存有效响应
  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (cacheable(res)) {
          const copy = res.clone();
          event.waitUntil(
            caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {})
          );
        }
        return res;
      });
    })
  );
});
