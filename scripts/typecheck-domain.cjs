const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tscBin = require.resolve('typescript/bin/tsc');

function runTsc(tsconfigRel) {
  execFileSync(
    process.execPath,
    [tscBin, '--noEmit', '-p', path.join(root, tsconfigRel)],
    { cwd: root, stdio: 'inherit' }
  );
}

runTsc('packages/domain/tsconfig.json');
runTsc('tsconfig.json');
console.log('domain typecheck passed (strict TypeScript)');
