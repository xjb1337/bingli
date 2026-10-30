/* ===========================================================================
 * 构建产物一致性测试（node:test）
 * 运行：node --test tests/
 *
 * 解决的问题：本项目把多个源文件内联成单个 HTML 发布。
 * 如果改了 src/ 却忘了 node build.js，dist/ 里的就是旧代码，
 * 而"手机能打开"并不能证明发布的是最新逻辑。
 *
 * 这里把每个源文件与产物逐段比对，不一致就失败。
 * =========================================================================== */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'index.html');

const readSrc = name => fs.readFileSync(path.join(SRC, name), 'utf8');
const distHtml = () => fs.readFileSync(DIST, 'utf8');

/** 与 build.js 保持一致的剥离逻辑 */
function stripModule(code) {
  return code.replace(/\nif\s*\(typeof\s+module[\s\S]*?\n\}\s*$/m, '\n');
}

/* ======================= 产物存在性 ======================= */

test('发布产物存在', () => {
  assert.ok(fs.existsSync(DIST), 'android/app/src/main/assets/index.html 不存在，请先运行 node build.js');
});

/* ======================= 逐个源文件比对 ======================= */

const MODULES = [
  ['schema.js', 'SCHEMA'],
  ['core.js', 'RECORD_CORE'],
  ['templates.js', 'TEMPLATES'],
  ['depth.js', 'DEPTH'],
  ['generator.js', 'GENERATOR'],
  ['hints.js', 'HINTS'],
  ['ai-core.js', 'AI_CORE'],
  ['ai.js', 'AI_ASSIST']
];

for (const [file, globalName] of MODULES) {
  test(`产物中的 ${file} 与源码一致（未过期的构建）`, () => {
    const html = distHtml();
    const expected = stripModule(readSrc(file)).trim();
    assert.ok(expected.length > 0, `${file} 内容异常`);

    // 取源码里的一段特征片段做比对，避免整体字符串比对受空白影响
    // 用模块内部一个较长的稳定标识做锚点
    const anchor = expected.split('\n').filter(l => l.trim().length > 30).slice(0, 3).join('\n');
    assert.ok(anchor.length > 0, `${file} 找不到可用于比对的片段`);

    // 逐行检查源码中每一条非空行都出现在产物里
    const srcLines = expected.split('\n').map(l => l.trim()).filter(l => l.length > 20);
    const missing = srcLines.filter(l => !html.includes(l));
    assert.deepEqual(
      missing.slice(0, 3), [],
      `${file} 有 ${missing.length} 行没有出现在产物里，可能忘记执行 node build.js`
    );
  });
}

test('产物中的 app.js 与源码一致', () => {
  const html = distHtml();
  const expected = readSrc('app.js');
  const srcLines = expected.split('\n').map(l => l.trim()).filter(l => l.length > 20);
  const missing = srcLines.filter(l => !html.includes(l));
  assert.deepEqual(
    missing.slice(0, 3), [],
    `app.js 有 ${missing.length} 行没有出现在产物里，可能忘记执行 node build.js`
  );
});

test('产物中的样式与源码一致', () => {
  const html = distHtml();
  const expected = readSrc('style.css');
  // 样式比对：抽查若干规则块
  const probes = ['.storage-alert', '.chip-sym.on', '.pe-special', '.jump-btn.has-pos'];
  for (const p of probes) {
    assert.ok(expected.includes(p), `源码样式中缺少 ${p}（测试本身过期了）`);
    assert.ok(html.includes(p), `产物样式中缺少 ${p}，可能忘记重新构建`);
  }
});

/* ======================= 结构完整性 ======================= */

test('产物中八个模块按正确顺序内联', () => {
  const html = distHtml();
  const iSchema = html.indexOf('const SCHEMA =');
  const iCore = html.indexOf('const RECORD_CORE =');
  const iTplData = html.indexOf('var TEMPLATE_DATA =');
  const iTpl = html.indexOf('var TEMPLATES =');
  const iDepth = html.indexOf('var DEPTH =');
  const iGen = html.indexOf('const GENERATOR =');
  const iHints = html.indexOf('const HINTS =');
  const iApp = html.indexOf('const APP =');

  for (const [name, idx] of [['SCHEMA', iSchema], ['CORE', iCore], ['TEMPLATE_DATA', iTplData],
    ['TEMPLATES', iTpl], ['DEPTH', iDepth], ['GENERATOR', iGen],
    ['HINTS', iHints], ['APP', iApp]]) {
    assert.ok(idx > 0, `产物中缺少 ${name} 模块`);
  }
  // 依赖顺序：schema → core → 模板数据 → 模板逻辑 → depth → generator → hints → app
  assert.ok(iSchema < iCore, 'SCHEMA 应在 CORE 之前');
  assert.ok(iCore < iTplData, 'CORE 应在 TEMPLATE_DATA 之前');
  // templates.js 读 TEMPLATE_DATA，顺序反了会静默拿到空数组
  assert.ok(iTplData < iTpl, 'TEMPLATE_DATA 应在 TEMPLATES 之前');
  assert.ok(iTpl < iDepth, 'TEMPLATES 应在 DEPTH 之前');
  assert.ok(iDepth < iGen, 'DEPTH 应在 GENERATOR 之前');
  assert.ok(iGen < iHints, 'GENERATOR 应在 HINTS 之前');
  assert.ok(iHints < iApp, 'HINTS 应在 APP 之前');
});

test('产物里没有残留的模板占位符', () => {
  const html = distHtml();
  assert.doesNotMatch(html, /\/\*__(CSS|SCHEMA|CORE|TPL_DATA|TEMPLATES|DEPTH|GENERATOR|HINTS|APP)__\*\//);
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

  // 原始体积：只兜住「模块被重复内联」这类失控增长。模板病例是纯中文长文本，
  // 重复度高、压得极狠——42 份模板让原始体积从 620KB 涨到 1040KB，
  // 但 gzip 后只从 74KB 涨到 262KB，所以原始体积的上限必须留得足够宽。
  assert.ok(rawKb < 1600, `产物原始体积 ${rawKb.toFixed(1)}KB 偏大，先检查是否模块被重复内联`);
  assert.ok(rawKb > 50, `产物 ${rawKb.toFixed(1)}KB 异常偏小，可能内容缺失`);

  // 压缩体积：限制 APK 内置资源体积。留 400KB 余量，
  // 够再加 20 份模板而不必回来改这个数字。
  assert.ok(gzipKb < 400, `产物 gzip 后 ${gzipKb.toFixed(1)}KB，手机上首次打开会明显变慢`);
});

// Product boundary: building an APK must not revive the retired website.
test('仅交付 App：独立网页入口与部署脚本已移除', () => {
  for (const name of ['index.html', 'sw.js', 'deploy.js', '.nojekyll', 'dist/大病历生成器.html', 'dist/dabingli.html']) {
    assert.equal(fs.existsSync(path.join(ROOT, name)), false, name + ' 不应再生成');
  }
  const scripts = require('../package.json').scripts;
  assert.equal(scripts.deploy, undefined);
  assert.equal(scripts['e2e:online'], undefined);
  assert.doesNotMatch(distHtml(), /serviceWorker\.register/);
});
