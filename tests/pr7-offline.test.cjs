/* PR7 GitHub Pages offline build audit.
 * Run after: npx vite build apps/web
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.join(__dirname, '..', 'apps', 'web', 'dist');
const SKIP_MESSAGE = 'apps/web/dist 不存在；请先运行 npx vite build apps/web';

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(fullPath) : [fullPath];
  });
}

function relativePath(fileName) {
  return path.relative(DIST, fileName).split(path.sep).join('/');
}

if (!fs.existsSync(DIST)) {
  test('PR7 offline build audit', { skip: SKIP_MESSAGE }, () => {});
} else {
  const serviceWorkerPath = path.join(DIST, 'sw.js');

  test('PR7-01 service worker precaches every emitted asset and the app shell', () => {
    assert.ok(fs.existsSync(serviceWorkerPath), 'dist/sw.js 必须存在');
    const source = fs.readFileSync(serviceWorkerPath, 'utf8');
    const match = source.match(/const PRECACHE_URLS = (\[[^;]*\]);/);
    assert.ok(match, 'sw.js 必须包含静态 PRECACHE_URLS 列表');
    const precache = JSON.parse(match[1]);
    const cached = new Set(precache.map((url) => url.replace(/^\.\//, '')));

    assert.ok(cached.has(''), '预缓存必须包含相对基路径 ./');
    assert.ok(cached.has('index.html'), '预缓存必须包含 index.html');

    const assets = filesBelow(path.join(DIST, 'assets'));
    for (const asset of assets) {
      assert.ok(cached.has(relativePath(asset)), `预缓存缺少 ${relativePath(asset)}`);
    }

    assert.match(source, /const CACHE_PREFIX = "bingli-pages-"/);
    assert.match(source, /const CACHE_NAME = CACHE_PREFIX \+ "[0-9a-f]+"/);
    assert.match(
      source,
      /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/,
      'activate 只能清理本应用的旧缓存',
    );
    assert.match(source, /url\.origin !== self\.location\.origin/);
    assert.match(source, /request\.mode === 'navigate'/);
  });

  test('PR7-02 HTML, CSS and app JS load no external resources except DeepSeek AI', () => {
    const textFiles = [
      path.join(DIST, 'index.html'),
      ...filesBelow(path.join(DIST, 'assets')).filter((fileName) => /\.(?:css|js)$/.test(fileName)),
    ];
    const deepSeek = 'https://api.deepseek.com';
    const inertVendorStrings = [
      'http://www.w3.org/',
      'https://reactjs.org/docs/error-decoder.html',
      'http://bit.ly/2kdckMn',
      'https://tinyurl.com/y2uuvskb',
    ];

    for (const fileName of textFiles) {
      const text = fs.readFileSync(fileName, 'utf8');
      const urls = text.match(/https?:\/\/[^\s"'`<>)]*/g) ?? [];
      for (const url of urls) {
        const allowed = url.startsWith(deepSeek)
          || inertVendorStrings.some((prefix) => url.startsWith(prefix));
        assert.ok(allowed, `${relativePath(fileName)} 引用了外部 URL：${url}`);
      }
      assert.doesNotMatch(text, /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com/i);
    }

    const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    assert.doesNotMatch(indexHtml, /https?:\/\//, 'index.html 不得引用远程资源');
  });

  test('PR7-03 no JavaScript chunk exceeds 500 kB', () => {
    const chunks = filesBelow(path.join(DIST, 'assets')).filter((fileName) => fileName.endsWith('.js'));
    assert.ok(chunks.length > 0, '构建产物必须包含 JavaScript chunk');
    for (const chunk of chunks) {
      const bytes = fs.statSync(chunk).size;
      assert.ok(bytes <= 500 * 1024, `${relativePath(chunk)} 为 ${(bytes / 1024).toFixed(1)} kB，超过 500 kB`);
    }
  });
}

test('PR7-SW cache lookups ignore Vary so offline reload serves crossorigin module scripts', { skip: !require('node:fs').existsSync(require('node:path').join(__dirname, '..', 'apps/web/dist/sw.js')) && 'apps/web/dist missing; run npx vite build apps/web' }, () => {
  const sw = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'apps/web/dist/sw.js'), 'utf8');
  const matches = sw.match(/caches\.match\([^)]*\)/g) || [];
  require('node:assert/strict').ok(matches.length >= 2, 'expected cache lookups');
  for (const m of matches) require('node:assert/strict').match(m, /ignoreVary:\s*true/);
});
