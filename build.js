/* 把 src/ 下的 schema + core + templates + depth + generator + hints + app + css
 * 内联成单独的 HTML 文件。
 *
 * 内联顺序即运行期依赖顺序，不可随意调整：
 *   AGE → SCHEMA → CORE → TEMPLATE_DATA → TEMPLATES → DEPTH → GENERATOR → HINTS → APP
 * AGE（年龄解析）零依赖，放在最前面，供 schema/core/generator/hints/app 共用。
 * TEMPLATE_DATA 是纯数据，必须在 TEMPLATES（读它的逻辑）之前。
 * DEPTH（问诊深度自查）只读记录、不依赖别的模块，位置宽松。
 *
 * 用法：node build.js
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets');
const OUT = path.join(OUT_DIR, 'index.html');

function read(name) {
  return fs.readFileSync(path.join(SRC, name), 'utf8');
}

/** 去掉 node 的 module.exports 尾巴，避免浏览器里报错 */
function stripModule(code) {
  return code.replace(/\nif\s*\(typeof\s+module[\s\S]*?\n\}\s*$/m, '\n');
}

function main() {
  const age = stripModule(read('age.js'));
  const schema = stripModule(read('schema.js'));
  const core = stripModule(read('core.js'));
  const tplData = stripModule(read('template-data.js'));
  const templates = stripModule(read('templates.js'));
  const depth = stripModule(read('depth.js'));
  const generator = stripModule(read('generator.js'));
  const hints = stripModule(read('hints.js'));
  const app = read('app.js');
  const css = read('style.css');
  const html = read('index.html');

  const out = html
    .replace('/*__CSS__*/', () => css)
    .replace('/*__AGE__*/', () => age)
    .replace('/*__SCHEMA__*/', () => schema)
    .replace('/*__CORE__*/', () => core)
    .replace('/*__TPL_DATA__*/', () => tplData)
    .replace('/*__TEMPLATES__*/', () => templates)
    .replace('/*__DEPTH__*/', () => depth)
    .replace('/*__GENERATOR__*/', () => generator)
    .replace('/*__HINTS__*/', () => hints)
    .replace('/*__APP__*/', () => app);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, out, 'utf8');

  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
  console.log(`已生成：${OUT}`);
  console.log(`文件大小：${kb} KB`);
}

main();
