'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'packages', 'domain', 'src');
const OUT = path.join(ROOT, 'packages', 'domain', 'dist');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file);
    if (rel.endsWith('.d.ts')) continue;
    if (rel === 'types.ts') {
      const target = path.join(OUT, 'types.d.ts');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
      continue;
    }
    if (!rel.endsWith('.ts')) continue;
    const target = path.join(OUT, rel.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Domain runtime sources intentionally use the ES/ CommonJS subset shared by
    // TypeScript and Node. Keeping the emitted text stable preserves the Android
    // single-file bundle while the .ts files remain the canonical source.
    fs.writeFileSync(target, fs.readFileSync(file, 'utf8'), 'utf8');
  }
  fs.mkdirSync(path.join(OUT, 'generator'), { recursive: true });
  fs.copyFileSync(path.join(SRC, 'index.d.ts'), path.join(OUT, 'index.d.ts'));
  return OUT;
}

if (require.main === module) console.log(`domain built: ${build()}`);
module.exports = { build };
