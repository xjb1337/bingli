/* ===========================================================================
 * 构建产物一致性测试（node:test）
 * 运行：node --test tests/
 *
 * 解决的问题：本项目把多个源文件内联成单个 HTML 发布。
 * 如果改了 src/ 或 packages/domain/src/ 却忘了 node build.js，产物里的就是旧代码，
 * 而"手机能打开"并不能证明发布的是最新逻辑。
 *
 * 这里把每个源文件与产物逐段比对，不一致就失败。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { minifyJs, stripModule } = require('../build.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DOMAIN_SRC = path.join(ROOT, 'packages', 'domain', 'src');
const DOMAIN_DIST = path.join(ROOT, 'packages', 'domain', 'dist');
const DIST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'index.html');

const readSrc = name => fs.readFileSync(path.join(SRC, name), 'utf8');
const distHtml = () => fs.readFileSync(DIST, 'utf8');

function assertEmbeddedCode(html, rawCode, label) {
  const expected = minifyJs(rawCode).trim();
  assert.ok(expected.length > 0, `${label} 内容异常`);
  assert.ok(
    html.includes(expected),
    `产物中的 ${label} 与源码不一致，可能忘记执行 node build.js`
  );
}

/* ======================= 产物存在性 ======================= */

test('发布产物存在', () => {
  assert.ok(fs.existsSync(DIST), 'android/app/src/main/assets/index.html 不存在，请先运行 node build.js');
});

/* ======================= 逐个源文件比对 ======================= */

const MODULES = [
  ['record-repository.js', 'RECORD_REPOSITORY'],
  ['action-handlers.js', 'ACTION_HANDLERS'],
  ['ai-core.js', 'AI_CORE'],
  ['ai.js', 'AI_ASSIST']
];

for (const [file, globalName] of MODULES) {
  test(`产物中的 ${file} 与源码一致（未过期的构建）`, () => {
    const html = distHtml();
    const expected = stripModule(readSrc(file));
    assertEmbeddedCode(html, expected, `${file} (${globalName})`);
  });
}

const DOMAIN_MODULES = [
  ['age', 'AGE'],
  ['schema', 'SCHEMA'],
  ['core', 'RECORD_CORE'],
  ['template-data', 'TEMPLATE_DATA'],
  ['templates', 'TEMPLATES'],
  ['quality/diagnostics', 'DIAGNOSTICS'],
  ['depth', 'DEPTH'],
  ['generator/document-ir', 'DOCUMENT_IR'],
  ['generator', 'GENERATOR'],
  ['hints', 'HINTS']
];

for (const [rel, globalName] of DOMAIN_MODULES) {
  test(`产物中的 domain ${rel} 与已构建源码一致（未过期的构建）`, () => {
    const sourcePath = path.join(DOMAIN_SRC, `${rel}.ts`);
    const distPath = path.join(DOMAIN_DIST, `${rel}.js`);
    assert.ok(fs.existsSync(sourcePath), `缺少 domain 源码 ${rel}.ts`);
    assert.ok(fs.existsSync(distPath), `缺少 domain 构建产物 ${rel}.js，请先运行 node build.js`);
    const built = stripModule(fs.readFileSync(distPath, 'utf8')).trim();

    assertEmbeddedCode(distHtml(), built, `${globalName} (${rel})`);
  });
}

test('产物中的 app.js 与源码一致', () => {
  assertEmbeddedCode(distHtml(), readSrc('app.js'), 'app.js (APP)');
});

test('产物中的样式与源码一致', () => {
  const html = distHtml();
  const expected = readSrc('style.css');
  // 样式比对：抽查若干规则块
  const probes = ['.storage-alert', '.chip-sym.on', '.pe-special', '.jump-btn.has-pos',
    '.tpl-verify', '.dl-path'];
  for (const p of probes) {
    assert.ok(expected.includes(p), `源码样式中缺少 ${p}（测试本身过期了）`);
    assert.ok(html.includes(p), `产物样式中缺少 ${p}，可能忘记重新构建`);
  }
});

/* ======================= 结构完整性 ======================= */

test('产物中核心模块按正确顺序内联', () => {
  const html = distHtml();
  const findDecl = name => html.search(new RegExp(`\\b(?:const|var)\\s+${name}\\s*=`));

  const iAge = findDecl('AGE');
  const iSchema = findDecl('SCHEMA');
  const iCore = findDecl('RECORD_CORE');
  const iRepo = findDecl('RECORD_REPOSITORY');
  const iTplData = findDecl('TEMPLATE_DATA');
  const iTpl = findDecl('TEMPLATES');
  const iDiagnostics = findDecl('DIAGNOSTICS');
  const iDepth = findDecl('DEPTH');
  const iDocIr = findDecl('DOCUMENT_IR');
  const iGen = findDecl('GENERATOR');
  const iHints = findDecl('HINTS');
  const iActions = findDecl('ACTION_HANDLERS');
  const iApp = findDecl('APP');

  for (const [name, idx] of [
    ['AGE', iAge], ['SCHEMA', iSchema], ['CORE', iCore], ['RECORD_REPOSITORY', iRepo],
    ['TEMPLATE_DATA', iTplData], ['TEMPLATES', iTpl], ['DIAGNOSTICS', iDiagnostics],
    ['DEPTH', iDepth], ['DOC_IR', iDocIr], ['GENERATOR', iGen],
    ['HINTS', iHints], ['ACTION_HANDLERS', iActions], ['APP', iApp]
  ]) {
    assert.ok(idx > 0, `产物中缺少 ${name} 模块`);
  }
  // 依赖顺序：age → schema → core → repository → 模板数据 → 模板逻辑 → diagnostics → depth → doc IR → generator → hints → actions → app
  assert.ok(iAge < iSchema, 'AGE 应在 SCHEMA 之前');
  assert.ok(iSchema < iCore, 'SCHEMA 应在 CORE 之前');
  assert.ok(iCore < iRepo, 'CORE 应在 RECORD_REPOSITORY 之前');
  assert.ok(iRepo < iTplData, 'RECORD_REPOSITORY 应在 TEMPLATE_DATA 之前');
  // templates.js 读 TEMPLATE_DATA，顺序反了会静默拿到空数组
  assert.ok(iTplData < iTpl, 'TEMPLATE_DATA 应在 TEMPLATES 之前');
  assert.ok(iTpl < iDiagnostics, 'TEMPLATES 应在 DIAGNOSTICS 之前');
  assert.ok(iDiagnostics < iDepth, 'DIAGNOSTICS 应在 DEPTH 之前');
  assert.ok(iDepth < iGen, 'DEPTH 应在 GENERATOR 之前');
  assert.ok(iDepth < iDocIr, 'DEPTH 应在 DOC_IR 之前');
  assert.ok(iDocIr < iGen, 'DOC_IR 应在 GENERATOR 之前');
  assert.ok(iGen < iHints, 'GENERATOR 应在 HINTS 之前');
  assert.ok(iHints < iActions, 'HINTS 应在 ACTION_HANDLERS 之前');
  assert.ok(iActions < iApp, 'ACTION_HANDLERS 应在 APP 之前');
});

test('产物里没有残留的模板占位符', () => {
  const html = distHtml();
  assert.doesNotMatch(
    html,
    /\/\*__(CSS|AGE|SCHEMA|CORE|REPOSITORY|TPL_DATA|TEMPLATES|DIAGNOSTICS|DEPTH|DOC_IR|GENERATOR|HINTS|ACTION_HANDLERS|APP|AI_CORE|AI)__\*\//
  );
});

test('产物里没有 Node 专用的 module.exports', () => {
  assert.doesNotMatch(distHtml(), /module\.exports/);
});

test('产物不引用任何外部资源（离线可用）', () => {
  const html = distHtml();
  const external = html.match(/(?:src|href)\s*=\s*["'](?:https?:)?\/\/[^"']+/g) || [];
  assert.deepEqual(external, [], '不应有外部 JS/CSS/图片引用');
});

test('产物不发起网络请求', () => {
  const html = distHtml();
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest/);
});

test('产物声明 UTF-8 编码与移动端 viewport', () => {
  const html = distHtml();
  assert.match(html, /charset=["']?utf-8/i);
  assert.match(html, /name="viewport"[^>]*width=device-width/);
});

/* ======================= 体积约束 ======================= */

test('产物体积在合理范围（手机加载要快）', () => {
  const buf = fs.readFileSync(DIST);
  const rawKb = buf.length / 1024;
  // App 资源随 APK 压缩打包；检查压缩体积，避免资源异常膨胀。
  const gzipKb = require('node:zlib').gzipSync(buf, { level: 9 }).length / 1024;

  // 原始体积：兜住模块重复内联或失控膨胀，经压缩后应远低于 1600 KB 红线。
  assert.ok(rawKb < 1600, `产物原始体积 ${rawKb.toFixed(1)}KB 偏大，先检查是否模块被重复内联`);
  assert.ok(rawKb > 50, `产物 ${rawKb.toFixed(1)}KB 异常偏小，可能内容缺失`);

  // 压缩体积：限制 APK 内置资源体积，远低于 410 KB 红线。
  assert.ok(gzipKb < 410, `产物 gzip 后 ${gzipKb.toFixed(1)}KB，手机上首次打开会明显变慢`);
});

// Security & hygiene boundary: Android WebView asset stays strictly offline and
// root directory does not retain retired legacy root-level HTML/SW outputs
// (modern web builds are isolated under apps/web/ and deployed by pages.yml).
test('Android 离线包边界与根目录退役产物清理', () => {
  for (const name of ['index.html', 'sw.js', 'deploy.js', '.nojekyll', 'dist/大病历生成器.html', 'dist/dabingli.html']) {
    assert.equal(fs.existsSync(path.join(ROOT, name)), false, name + ' 不应再在仓库根目录生成');
  }
  const scripts = require('../package.json').scripts;
  assert.equal(scripts.deploy, undefined);
  assert.equal(scripts['e2e:online'], undefined);
  assert.doesNotMatch(distHtml(), /serviceWorker\.register/);
});
