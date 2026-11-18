/* 把 packages/domain/dist/ 与 src/ 下的模块内联成单独的 HTML 文件。
 *
 * 内联顺序即运行期依赖顺序，不可随意调整：
 *   AGE → SCHEMA → CORE → REPOSITORY → TEMPLATE_DATA → TEMPLATES → DIAGNOSTICS → DEPTH → DOC_IR → GENERATOR → HINTS → ACTIONS → APP
 * AGE（年龄解析）零依赖，放在最前面，供 schema/core/generator/hints/app 共用。
 * TEMPLATE_DATA 是纯数据，必须在 TEMPLATES（读它的逻辑）之前。
 * DEPTH（问诊深度自查）只读记录、不依赖别的模块，位置宽松。
 * DIAGNOSTICS 只提供结构化提醒协议；DEPTH/GENERATOR 必须排在它之后。
 * DOC_IR 是文档中间表示，GENERATOR 必须排在它之后。
 *
 * 用法：node build.js
 */
const fs = require('fs');
const path = require('path');

let esbuild = null;
try {
  esbuild = require('esbuild');
} catch (_) {
  // Optional minification fallback when esbuild is unavailable.
}

const SRC = path.join(__dirname, 'src');
const OUT_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets');
const OUT = path.join(OUT_DIR, 'index.html');

function read(name) {
  return fs.readFileSync(path.join(SRC, name), 'utf8');
}

function readDomain(name) {
  return fs.readFileSync(path.join(__dirname, 'packages', 'domain', 'dist', name), 'utf8');
}

/** 去掉 node 的 module.exports 尾巴，避免浏览器里报错 */
function stripModule(code) {
  return code.replace(/\nif\s*\(typeof\s+module[\s\S]*?\n\}\s*$/m, '\n');
}

function minifyJs(code) {
  if (!esbuild) return code;
  return esbuild.transformSync(code, {
    loader: 'js',
    minify: true,
    target: 'es2020',
  }).code;
}

function main() {
  require('./scripts/build-domain.cjs').build();

  const age = minifyJs(stripModule(readDomain('age.js')));
  const schema = minifyJs(stripModule(readDomain('schema.js')));
  const core = minifyJs(stripModule(readDomain('core.js')));
  const repository = minifyJs(stripModule(read('record-repository.js')));
  const tplData = minifyJs(stripModule(readDomain('template-data.js')));
  const templates = minifyJs(stripModule(readDomain('templates.js')));
  const diagnostics = minifyJs(stripModule(readDomain('quality/diagnostics.js')));
  const depth = minifyJs(stripModule(readDomain('depth.js')));
  const documentIr = minifyJs(stripModule(readDomain('generator/document-ir.js')));
  const generator = minifyJs(stripModule(readDomain('generator.js')));
  const hints = minifyJs(stripModule(readDomain('hints.js')));
  const actionHandlers = minifyJs(stripModule(read('action-handlers.js')));
  const app = minifyJs(read('app.js'));
  const aiCore = minifyJs(stripModule(read('ai-core.js')));
  const ai = minifyJs(read('ai.js'));
  const css = read('style.css');
  const html = read('index.html');

  const out = html
    .replace('/*__CSS__*/', () => css)
    .replace('/*__AGE__*/', () => age)
    .replace('/*__SCHEMA__*/', () => schema)
    .replace('/*__CORE__*/', () => core)
    .replace('/*__REPOSITORY__*/', () => repository)
    .replace('/*__TPL_DATA__*/', () => tplData)
    .replace('/*__TEMPLATES__*/', () => templates)
    .replace('/*__DIAGNOSTICS__*/', () => diagnostics)
    .replace('/*__DEPTH__*/', () => depth)
    .replace('/*__DOC_IR__*/', () => documentIr)
    .replace('/*__GENERATOR__*/', () => generator)
    .replace('/*__HINTS__*/', () => hints)
    .replace('/*__ACTION_HANDLERS__*/', () => actionHandlers)
    .replace('/*__APP__*/', () => app)
    .replace('/*__AI_CORE__*/', () => aiCore)
    .replace('/*__AI__*/', () => ai);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, out, 'utf8');

  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
  console.log(`已生成：${OUT}`);
  console.log(`文件大小：${kb} KB`);
}

if (require.main === module) main();

module.exports = { main, minifyJs, stripModule };
