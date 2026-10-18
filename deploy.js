/* GitHub Pages 部署准备
 *
 * Pages 从仓库根目录（/）提供静态文件，入口必须是 index.html。
 * 这里把 dist/ 里的成品复制成根目录的 index.html，
 * 并额外放一个 .nojekyll 防止 Jekyll 处理下划线开头的文件。
 *
 * 用法：node deploy.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist', '大病历生成器.html');
const OUT_HTML = path.join(ROOT, 'index.html');
const NOJEKYLL = path.join(ROOT, '.nojekyll');

function main() {
  if (!fs.existsSync(DIST)) {
    console.error('找不到 dist/ 产物，请先运行：node build.js');
    process.exit(1);
  }

  const html = fs.readFileSync(DIST, 'utf8');

  // 在线版与离线版的唯一差别：告诉页面它可以被缓存
  // 其余内容完全一致，保证"本地能用"和"上线能用"是同一份代码。
  fs.writeFileSync(OUT_HTML, html, 'utf8');
  fs.writeFileSync(NOJEKYLL, '', 'utf8');

  const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`已生成在线入口：${OUT_HTML}  (${kb} KB)`);
  console.log(`已生成 ${NOJEKYLL}`);
  console.log('');
  console.log('下一步：git add -A && git commit && git push');
}

main();
