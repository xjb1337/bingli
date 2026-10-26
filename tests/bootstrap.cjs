/* 测试引导：把浏览器里靠内联顺序建立的全局依赖，
 * 在 Node 环境中显式搭好，保证被测代码与线上一致。
 *
 * 线上 index.html 的脚本顺序：
 *   SCHEMA → CORE → TEMPLATE_DATA → TEMPLATES → DEPTH → GENERATOR → HINTS → APP
 * 这里照搬同样的顺序与全局名。
 */
const path = require('node:path');

function bootGlobals() {
  // generator.js / hints.js 直接引用全局 SCHEMA、GENERATOR
  globalThis.SCHEMA = require(path.join(__dirname, '..', 'src', 'schema.js'));
  globalThis.RECORD_CORE = require(path.join(__dirname, '..', 'src', 'core.js'));
  // templates.js 读 TEMPLATE_DATA，所以数据要先挂上全局
  globalThis.TEMPLATE_DATA = require(path.join(__dirname, '..', 'src', 'template-data.js'));
  globalThis.TEMPLATES = require(path.join(__dirname, '..', 'src', 'templates.js'));
  // depth.js 零依赖，先挂上供生成页的深度自查卡片调用
  globalThis.DEPTH = require(path.join(__dirname, '..', 'src', 'depth.js'));
  globalThis.GENERATOR = require(path.join(__dirname, '..', 'src', 'generator.js'));
  globalThis.HINTS = require(path.join(__dirname, '..', 'src', 'hints.js'));
  return {
    SCHEMA: globalThis.SCHEMA,
    CORE: globalThis.RECORD_CORE,
    TEMPLATES: globalThis.TEMPLATES,
    DEPTH: globalThis.DEPTH,
    GENERATOR: globalThis.GENERATOR,
    HINTS: globalThis.HINTS
  };
}

module.exports = { bootGlobals };

if (require.main === module) {
  const m = bootGlobals();
  console.log('引导完成：', Object.keys(m).join(', '));
  console.log('科室数：', m.SCHEMA.DEPARTMENTS.length);
  console.log('模板数：', m.TEMPLATES.all().length);
  console.log('诊断提示规则数：', m.HINTS.RULES.length);
}