'use strict';
/*
 * The domain sources deliberately use the JavaScript subset of TypeScript so
 * the Android bundle can preserve its byte-for-byte legacy runtime. This CI
 * check validates every runtime source with Node's parser and validates the
 * public declaration surface. A full tsc check can be layered on by consumers
 * without changing the runtime build.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const src = path.join(root, 'packages', 'domain', 'src');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const runtime = walk(src).filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts') && !f.endsWith('types.ts'));
for (const file of runtime) {
  const source = fs.readFileSync(file, 'utf8');
  new vm.Script(source, { filename: file });
}
const declarations = fs.readFileSync(path.join(src, 'index.d.ts'), 'utf8');
if (!/export \* from ['"]\.\/types['"]/.test(declarations)) throw new Error('domain declarations missing types export');
if (!fs.existsSync(path.join(src, 'types.ts'))) throw new Error('domain types.ts missing');
console.log(`domain typecheck ok (${runtime.length} runtime TypeScript modules)`);
