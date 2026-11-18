const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN_DIR = path.join(ROOT, 'packages', 'domain');
const SRC = path.join(DOMAIN_DIR, 'src');
const OUT = path.join(DOMAIN_DIR, 'dist');
const ESM_OUT = path.join(OUT, 'esm');
const TSC_BIN = require.resolve('typescript/bin/tsc');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** 递归剔除对象中的空字符串属性，用于 ESM / 按需子路径瘦身 */
function stripEmptyStrings(val, stats = { removed: 0 }) {
  if (Array.isArray(val)) {
    return val.map((item) => stripEmptyStrings(item, stats));
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (v === '') {
        stats.removed += 1;
        continue;
      }
      out[k] = stripEmptyStrings(v, stats);
    }
    return out;
  }
  return val;
}

/** 收集每个领域入口模块实际导出的 runtime 标识符，用于生成无 module.exports 的 ESM 跨模块桥接桩 */
async function collectExports(fileAbs) {
  const res = await esbuild.build({
    entryPoints: [fileAbs],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    metafile: true,
    logLevel: 'silent',
    plugins: [
      {
        name: 'ignore-template-data',
        setup(build) {
          build.onResolve({ filter: /template-data(?:-module)?$/ }, () => ({
            path: 'template-data-stub',
            namespace: 'stub'
          }));
          build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
            contents: 'export default [];',
            loader: 'js'
          }));
        }
      }
    ]
  });
  const outputs = Object.values(res.metafile.outputs);
  const exports = (outputs[0] && outputs[0].exports) || [];
  return exports.filter((name) => name !== 'default');
}

const LEGACY_BUNDLES = [
  { src: 'age.ts', out: 'age.js', globalName: 'AGE', declKind: 'const' },
  { src: 'schema.ts', out: 'schema.js', globalName: 'SCHEMA', declKind: 'const' },
  { src: 'core.ts', out: 'core.js', globalName: 'RECORD_CORE', declKind: 'const' },
  { src: 'templates.ts', out: 'templates.js', globalName: 'TEMPLATES', declKind: 'var' },
  { src: 'quality/diagnostics.ts', out: 'quality/diagnostics.js', globalName: 'DIAGNOSTICS', declKind: 'var' },
  { src: 'depth.ts', out: 'depth.js', globalName: 'DEPTH', declKind: 'var' },
  { src: 'generator/document-ir.ts', out: 'generator/document-ir.js', globalName: 'DOCUMENT_IR', declKind: 'const' },
  { src: 'generator.ts', out: 'generator.js', globalName: 'GENERATOR', declKind: 'const' },
  { src: 'hints.ts', out: 'hints.js', globalName: 'HINTS', declKind: 'const' }
];

const ALL_TARGETS = new Map(
  LEGACY_BUNDLES.map((item) => [path.resolve(SRC, item.src), item])
);
ALL_TARGETS.set(path.resolve(SRC, 'template-data.ts'), {
  src: 'template-data.ts',
  out: 'template-data.js',
  globalName: 'TEMPLATE_DATA',
  declKind: 'var',
  isDefaultOnly: true
});
ALL_TARGETS.set(path.resolve(SRC, 'template-data-module.js'), {
  src: 'template-data.ts',
  out: 'template-data.js',
  globalName: 'TEMPLATE_DATA',
  declKind: 'var',
  isDefaultOnly: true
});

const EXPORT_CACHE = new Map();
async function initExportCache() {
  for (const bundle of LEGACY_BUNDLES) {
    const abs = path.resolve(SRC, bundle.src);
    EXPORT_CACHE.set(abs, await collectExports(abs));
  }
}

function resolveImportCandidate(importerDir, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(importerDir, spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.js')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.resolve(candidate);
    }
  }
  return null;
}

function createCrossBundlePlugin(entryAbs, outFileAbs, allowDefaultGlobal = true, usedTargets = null) {
  return {
    name: 'domain-cross-bundle-links',
    setup(build) {
      build.onResolve({ filter: /\.js$/, namespace: 'domain-global-ref' }, (args) => ({
        path: args.path,
        external: true
      }));

      build.onResolve({ filter: /^\./ }, (args) => {
        const resolved = resolveImportCandidate(args.resolveDir, args.path);
        if (!resolved || resolved === entryAbs) return null;
        const target = ALL_TARGETS.get(resolved);
        if (!target) return null;
        return {
          path: resolved,
          namespace: 'domain-global-ref'
        };
      });

      build.onLoad({ filter: /.*/, namespace: 'domain-global-ref' }, (args) => {
        const target = ALL_TARGETS.get(args.path);
        if (usedTargets) usedTargets.add(target.globalName);
        const targetOutAbs = path.resolve(OUT, target.out);
        let rel = toPosix(path.relative(path.dirname(outFileAbs), targetOutAbs));
        if (!rel.startsWith('.')) rel = `./${rel}`;
        const gName = target.globalName;
        const lookup = allowDefaultGlobal
          ? `(__DOMAIN_GLOBALS__.${gName} || (_g && _g.${gName}) || require(${JSON.stringify(rel)}))`
          : `(_g.${gName} || require(${JSON.stringify(rel)}))`;
        const lines = [
          `const _g = typeof globalThis !== 'undefined' ? globalThis : {};`,
          `const _mod = ${lookup};`,
          `export default _mod;`
        ];
        if (!target.isDefaultOnly) {
          const names = EXPORT_CACHE.get(args.path) || [];
          names.forEach((name) => {
            lines.push(`export const ${name} = _mod.${name};`);
          });
        }
        return { contents: lines.join('\n'), loader: 'js' };
      });
    }
  };
}

async function buildLegacyBundle(item) {
  const entryAbs = path.resolve(SRC, item.src);
  const outFileAbs = path.resolve(OUT, item.out);
  ensureDir(path.dirname(outFileAbs));

  const usedTargets = new Set();
  const wrapper = `export { ${item.globalName} as __DOMAIN_EXPORT__ } from ${JSON.stringify(toPosix(entryAbs))};`;
  const result = await esbuild.build({
    stdin: {
      contents: wrapper,
      resolveDir: SRC,
      loader: 'ts'
    },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: '__DOMAIN_MOD__',
    platform: 'neutral',
    target: 'es2022',
    mainFields: ['module', 'main'],
    plugins: [createCrossBundlePlugin(entryAbs, outFileAbs, true, usedTargets)]
  });

  let code = result.outputFiles[0].text.trim();
  if (!code.startsWith('var __DOMAIN_MOD__ = ')) {
    throw new Error(`Unexpected esbuild IIFE header for ${item.src}`);
  }
  const globalEntries = [...usedTargets]
    .filter((g) => g !== item.globalName)
    .map((g) => `${g}: typeof ${g} !== "undefined" ? ${g} : undefined`);
  const body = code.replace(/;\s*$/, '');
  const wrapped = `${item.declKind} ${item.globalName} = ((__DOMAIN_GLOBALS__) => {\n${body}\nreturn __DOMAIN_MOD__.__DOMAIN_EXPORT__;\n})({ ${globalEntries.join(', ')} });\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = ${item.globalName};\n}\n`;
  fs.writeFileSync(outFileAbs, wrapped, 'utf8');
}

async function buildCjsEntry(srcRel, outRel) {
  const entryAbs = path.resolve(SRC, srcRel);
  const outFileAbs = path.resolve(OUT, outRel);
  ensureDir(path.dirname(outFileAbs));
  const result = await esbuild.build({
    entryPoints: [entryAbs],
    write: false,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'es2022',
    plugins: [createCrossBundlePlugin(entryAbs, outFileAbs, false)]
  });
  fs.writeFileSync(outFileAbs, result.outputFiles[0].text, 'utf8');
}

async function buildEsmEntry(srcRel, outRel) {
  const entryAbs = path.resolve(SRC, srcRel);
  const outFileAbs = path.resolve(ESM_OUT, outRel);
  ensureDir(path.dirname(outFileAbs));
  const result = await esbuild.build({
    entryPoints: [entryAbs],
    write: false,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    target: 'es2022',
    plugins: [
      {
        name: 'external-slim-template-data',
        setup(build) {
          build.onResolve({ filter: /template-data-module$/ }, () => ({
            path: './template-data.js',
            external: true
          }));
        }
      }
    ]
  });
  fs.writeFileSync(outFileAbs, result.outputFiles[0].text, 'utf8');
}

async function build() {
  await initExportCache();
  // 清理旧的手写 .d.ts，完全改为由 tsc 自动生成
  fs.rmSync(path.join(SRC, 'index.d.ts'), { force: true });
  fs.rmSync(path.join(SRC, 'template-data.d.ts'), { force: true });

  ensureDir(OUT);
  ensureDir(ESM_OUT);

  // 1. 生成严格 TypeScript 声明文件 (.d.ts)
  execFileSync(
    process.execPath,
    [
      TSC_BIN,
      '-p',
      path.join(DOMAIN_DIR, 'tsconfig.json'),
      '--emitDeclarationOnly',
      '--noEmit',
      'false',
      '--declaration',
      '--declarationDir',
      OUT
    ],
    { cwd: ROOT, stdio: 'inherit' }
  );
  fs.copyFileSync(
    path.join(SRC, 'template-data-module.d.ts'),
    path.join(OUT, 'template-data-module.d.ts')
  );

  // 2. 构建 template-data.js (CJS/IIFE 保持全量冻结字段) 与 dist/esm/template-data.js (剔除空串字段)
  const rawTplCode = fs.readFileSync(path.join(SRC, 'template-data.ts'), 'utf8');
  const sandbox = { module: { exports: null } };
  vm.runInNewContext(rawTplCode, sandbox);
  const tplData = sandbox.TEMPLATE_DATA || sandbox.module.exports;
  if (!Array.isArray(tplData) || tplData.length !== 57) {
    throw new Error(`Expected 57 templates in template-data.ts, got ${tplData && tplData.length}`);
  }
  const cjsTplOut = `var TEMPLATE_DATA = ${JSON.stringify(tplData)};\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = TEMPLATE_DATA;\n}\n`;
  fs.writeFileSync(path.join(OUT, 'template-data.js'), cjsTplOut, 'utf8');

  const slimStats = { removed: 0 };
  const slimTplData = stripEmptyStrings(tplData, slimStats);
  const esmTplOut = `const TEMPLATE_DATA = ${JSON.stringify(slimTplData)};\nexport default TEMPLATE_DATA;\n`;
  fs.writeFileSync(path.join(ESM_OUT, 'template-data.js'), esmTplOut, 'utf8');

  // 3. 构建 9 个 CJS/IIFE 兼容模块
  for (const bundle of LEGACY_BUNDLES) {
    await buildLegacyBundle(bundle);
  }

  // 4. 构建 CJS 入口与子路径入口
  await buildCjsEntry('migrations/index.ts', 'migrations/index.js');
  await buildCjsEntry('index.ts', 'index.js');
  await buildCjsEntry('templates-subpath.ts', 'templates-subpath.js');

  // 5. 构建 ESM 入口与 @dabingli/domain/templates 按需子路径
  fs.writeFileSync(path.join(ESM_OUT, 'package.json'), '{\n  "type": "module"\n}\n', 'utf8');
  await buildEsmEntry('templates-subpath.ts', 'templates.js');
  await buildEsmEntry('index.ts', 'index.js');

  console.log(
    `Built @dabingli/domain into ${OUT} (ESM template-data stripped ${slimStats.removed} empty string fields)`
  );
}

if (require.main === module) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  module.exports = {
    build() {
      execFileSync(process.execPath, [__filename], { stdio: 'inherit' });
    },
    buildAsync: build
  };
}
