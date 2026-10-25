/* 从 tools/tpl-parts/*.cjs 生成 src/template-data.js
 *
 * 为什么要这一步：
 *   模板内容是「纯数据 + 长中文」，手写进 src/ 容易和撰写者的工作区打架；
 *   而浏览器端是单文件内联，不能 require。所以把撰写区（tools/tpl-parts）当源，
 *   src/template-data.js 当产物。测试里会重跑本逻辑比对，产物过期就红。
 *
 * 用法：node tools/gen-templates.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTS = path.join(__dirname, 'tpl-parts');
const OUT = path.join(ROOT, 'src/template-data.js');

function main() {
  if (!fs.existsSync(PARTS)) {
    console.error('找不到 tools/tpl-parts/');
    process.exit(1);
  }
  const files = fs.readdirSync(PARTS).filter(f => f.endsWith('.cjs')).sort();
  const list = [];

  files.forEach(f => {
    const full = path.join(PARTS, f);
    delete require.cache[require.resolve(full)];
    let part;
    try {
      part = require(full);
    } catch (e) {
      console.error(`加载失败 ${f}: ${e.message}`);
      process.exit(1);
    }
    if (!part || !part.key || !part.record) {
      console.error(`${f} 缺少 key 或 record`);
      process.exit(1);
    }
    // 只保留契约里许可的字段，避免撰写者顺手塞进来的东西混进产物
    list.push({
      key: String(part.key),
      dept: String(part.dept || ''),
      name: String(part.name || ''),
      alias: Array.isArray(part.alias) ? part.alias.map(String) : [],
      hint: String(part.hint || ''),
      record: part.record
    });
  });

  const header = `/* 模板病例数据 —— 由 tools/gen-templates.js 从 tools/tpl-parts/*.cjs 生成，请勿手改。
 *
 * 改模板的正确方式：改 tools/tpl-parts/<key>.cjs，然后 node tools/gen-templates.js。
 * 共 ${list.length} 个模板：${list.map(t => t.key).join(', ')}
 */
`;

  const body = `var TEMPLATE_DATA = ${JSON.stringify(list, null, 2)};\n\n`
    + `if (typeof module !== 'undefined' && module.exports) {\n  module.exports = TEMPLATE_DATA;\n}\n`;

  fs.writeFileSync(OUT, header + body, 'utf8');
  const kb = (Buffer.byteLength(header + body, 'utf8') / 1024).toFixed(1);
  console.log(`已生成：${OUT}`);
  console.log(`${list.length} 个模板（${list.map(t => t.key).join(', ')}），${kb} KB`);
}

main();