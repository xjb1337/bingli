// Simulated-origin Android migration harness (no emulator, no APK).
// Serves legacy-migrate.html on https://appassets.androidplatform.net, seeds old localStorage
// with fixtures written by the legacy core, stubs the BingliLegacyMigrate bridge (stand-in for Kotlin
// staging: records bytes + SHA-256), then imports into a fresh IndexedDB and compares.
const path = require('path'), fs = require('fs'), crypto = require('crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const out = process.argv[2] || path.join(root, 'tmp-harness');
fs.mkdirSync(out, { recursive: true });
const core = require(path.join(root, 'src/core.js')), schema = require(path.join(root, 'src/schema.js'));
const deptKeys = schema.DEPARTMENTS.map(d => d.key);
const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const ORIGIN = 'https://appassets.androidplatform.net';
const bundle = require('esbuild').buildSync({ entryPoints: [path.join(__dirname, 'entry.ts')], bundle: true, write: false, format: 'iife', platform: 'browser' }).outputFiles[0].text;
const assets = path.join(root, 'android/app/src/main/assets');

function seedFor(name) {
  const st = core.memoryStorage();
  if (name === 'corrupt') {
    st.setItem('dabingli.records.v1', '[{"id":"broken",');
    st.setItem('dabingli.settings.v1', '{"rosMode":"detail"}');
  } else if (name === 'mixed') {
    const recs = ['v1','v2','v3'].flatMap(v => JSON.parse(fs.readFileSync(path.join(root, `tests/fixtures/legacy/${v}-backup.json`), 'utf8')).records);
    st.setItem('dabingli.records.v1', JSON.stringify(recs));
    for (const r of recs) st.setItem('dabingli.draft.v1.' + r.id, JSON.stringify({ ...r.data, id: r.id }));
  } else {
    const raw = fs.readFileSync(path.join(root, `tests/fixtures/legacy/${name}-backup.json`), 'utf8');
    const parsed = JSON.parse(raw);
    // Write exactly what the old app wrote: the list key holds the stored records.
    st.setItem('dabingli.records.v1', JSON.stringify(parsed.records));
    const first = parsed.records[0];
    st.setItem('dabingli.current.v1', JSON.stringify({ ...first.data, id: first.id }));
    st.setItem('dabingli.draft.v1.' + first.id, JSON.stringify({ ...first.data, id: first.id }));
    st.setItem('dabingli.settings.v1', JSON.stringify({ rosMode: 'detail' }));
  }
  const keys = {}; for (const [k, v] of st._dump ? st._dump() : []) keys[k] = v;
  return keys;
}

(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const name of ['v1', 'v2', 'v3', 'mixed', 'corrupt']) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 800 } });
    await ctx.route(ORIGIN + '/**', route => {
      const p = new URL(route.request().url()).pathname;
      if (p === '/assets/legacy-migrate.html' || p === '/assets/migrate-recovery.html')
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(assets, p.slice(8))) });
      if (p === '/assets/blank.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset=utf-8>' });
      if (p === '/assets/harness.js') return route.fulfill({ contentType: 'text/javascript', body: bundle });
      if (p === '/assets/import.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset=utf-8><body><pre id=o>导入中…</pre><script src="harness.js"></script>' });
      return route.fulfill({ status: 403, body: 'Blocked' });
    });
    const seed = seedFor(name);
    const page = await ctx.newPage();
    await page.goto(ORIGIN + '/assets/blank.html');
    await page.evaluate(k => { for (const [a, v] of Object.entries(k)) localStorage.setItem(a, v); }, seed);
    const before = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    const beforeHash = sha(JSON.stringify(Object.keys(before).sort().map(k => [k, before[k]])));
    // Bridge stub = Kotlin LegacyMigrator.stage(): keep raw bytes + SHA-256.
    let staged = null, failed = null;
    await page.exposeFunction('__submit', s => { staged = s; });
    await page.exposeFunction('__fail', r => { failed = r; });
    await page.addInitScript(() => { window.BingliLegacyMigrate = { submit: s => window.__submit(s), fail: r => window.__fail(r) }; });
    await page.goto(ORIGIN + '/assets/legacy-migrate.html'); await page.waitForTimeout(400);
    const stagedSha = staged ? sha(staged) : null;
    await page.goto(ORIGIN + '/assets/import.html');
    const res = staged ? await page.evaluate(p => window.runImport(p), staged) : { ok: false, error: failed };
    const dump = await page.evaluate(() => window.dumpDb());
    await page.evaluate(r => { document.getElementById('o').textContent = JSON.stringify(r, null, 1); }, { case: name, res, dump: dump.list });
    await page.screenshot({ path: path.join(out, `import-${name}.png`), fullPage: true });
    const after = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
    const afterHash = sha(JSON.stringify(Object.keys(after).sort().map(k => [k, after[k]])));
    let legacyCount = null; try { legacyCount = JSON.parse(before['dabingli.records.v1']).length; } catch { legacyCount = 'corrupt'; }
    if (!res.ok) {
      await page.goto(ORIGIN + '/assets/migrate-recovery.html'); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(out, `recovery-${name}.png`), fullPage: true });
    }
    report.push({ case: name, legacyKeys: Object.keys(before).length, legacyRecordCount: legacyCount,
      localStorageSha256Before: beforeHash, localStorageSha256After: afterHash, localStorageUnchanged: beforeHash === afterHash,
      stagedBytes: staged ? Buffer.byteLength(staged) : 0, stagedSha256: stagedSha,
      importOk: res.ok, error: res.ok ? undefined : res.error,
      indexedDbRecordCount: dump.list.length, ids: dump.list.map(x => x.id),
      comparison: res.ok ? res.result.comparison : undefined,
      indexedDbExportSha256: dump.list.length ? sha(typeof dump.exportJson === 'string' ? dump.exportJson : JSON.stringify(dump.exportJson)) : null });
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.map(r => ({ case: r.case, legacy: r.legacyRecordCount, idb: r.indexedDbRecordCount, ok: r.importOk, unchanged: r.localStorageUnchanged, staged: r.stagedSha256 && r.stagedSha256.slice(0, 12), err: r.error })), null, 1));
  if (report.some(r => r.case !== 'corrupt' && (!r.importOk || r.legacyRecordCount !== r.indexedDbRecordCount || !r.localStorageUnchanged))) process.exit(1);
  const c = report.find(r => r.case === 'corrupt'); if (c.importOk || c.indexedDbRecordCount || !c.localStorageUnchanged) process.exit(1);
})();
