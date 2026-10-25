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
const DIST = path.join(ROOT, 'dist', '大病历生成器.html');

const readSrc = name => fs.readFileSync(path.join(SRC, name), 'utf8');
const distHtml = () => fs.readFileSync(DIST, 'utf8');

/** 与 build.js 保持一致的剥离逻辑 */
function stripModule(code) {
  return code.replace(/\nif\s*\(typeof\s+module[\s\S]*?\n\}\s*$/m, '\n');
}

/* ======================= 产物存在性 ======================= */

test('发布产物存在', () => {
  assert.ok(fs.existsSync(DIST), 'dist/大病历生成器.html 不存在，请先运行 node build.js');
});

/* ======================= 逐个源文件比对 ======================= */

const MODULES = [
  ['schema.js', 'SCHEMA'],
  ['core.js', 'RECORD_CORE'],
  ['templates.js', 'TEMPLATES'],
  ['checker.js', 'CHECKER'],
  ['generator.js', 'GENERATOR'],
  ['hints.js', 'HINTS']
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

test('产物中六个模块按正确顺序内联', () => {
  const html = distHtml();
  const iSchema = html.indexOf('const SCHEMA =');
  const iCore = html.indexOf('const RECORD_CORE =');
  const iTplData = html.indexOf('var TEMPLATE_DATA =');
  const iTpl = html.indexOf('var TEMPLATES =');
  const iChecker = html.indexOf('const CHECKER =');
  const iGen = html.indexOf('const GENERATOR =');
  const iHints = html.indexOf('const HINTS =');
  const iApp = html.indexOf('const APP =');

  for (const [name, idx] of [['SCHEMA', iSchema], ['CORE', iCore], ['TEMPLATE_DATA', iTplData],
    ['TEMPLATES', iTpl], ['CHECKER', iChecker], ['GENERATOR', iGen], ['HINTS', iHints], ['APP', iApp]]) {
    assert.ok(idx > 0, `产物中缺少 ${name} 模块`);
  }
  // 依赖顺序：schema → core → 模板数据 → 模板逻辑 → checker → generator → hints → app
  assert.ok(iSchema < iCore, 'SCHEMA 应在 CORE 之前');
  assert.ok(iCore < iTplData, 'CORE 应在 TEMPLATE_DATA 之前');
  // templates.js 读 TEMPLATE_DATA，顺序反了会静默拿到空数组
  assert.ok(iTplData < iTpl, 'TEMPLATE_DATA 应在 TEMPLATES 之前');
  assert.ok(iTpl < iChecker, 'TEMPLATES 应在 CHECKER 之前');
  assert.ok(iChecker < iGen, 'CHECKER 应在 GENERATOR 之前');
  assert.ok(iGen < iHints, 'GENERATOR 应在 HINTS 之前');
  assert.ok(iHints < iApp, 'HINTS 应在 APP 之前');
});

test('产物里没有残留的模板占位符', () => {
  const html = distHtml();
  assert.doesNotMatch(html, /\/\*__(CSS|SCHEMA|CORE|TPL_DATA|TEMPLATES|GENERATOR|HINTS|APP)__\*\//);
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
  const kb = fs.statSync(DIST).size / 1024;
  // 这个断言只用来兜住「模块被重复内联」这类失控增长，不是精确预算。
  // 参考：2026-10 加入 checker.js（四个考站的自查规则库）后约 390KB，
  // 加模板病例（消化内科 6 个病种，纯数据约 10KB/个）后约 620KB，
  // 经 GitHub Pages 传输时 gzip 后不到 120KB，手机上可接受。
  assert.ok(kb < 900, `产物 ${kb.toFixed(1)}KB 偏大，先检查是否模块被重复内联`);
  assert.ok(kb > 50, `产物 ${kb.toFixed(1)}KB 异常偏小，可能内容缺失`);
});
