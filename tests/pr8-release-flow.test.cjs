/* PR8 release-flow audit.
 *
 * The workflows are intentionally checked as text so this test has no YAML
 * dependency. The release-version check is exercised against the real Python
 * script with temporary update.json fixtures.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const RELEASE_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'release.yml');
const VERIFY_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'verify.yml');
const PAGES_WORKFLOW = path.join(ROOT, '.github', 'workflows', 'pages.yml');
const BUILD_GRADLE = path.join(ROOT, 'android', 'app', 'build.gradle');
const UPDATE_MANAGER = path.join(
  ROOT,
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'xjb',
  'bingli',
  'UpdateManager.java',
);
const CHECK_RELEASE = path.join(ROOT, 'scripts', 'release', 'check-release.py');

function read(fileName) {
  return fs.readFileSync(fileName, 'utf8');
}

function sectionByHeader(text, header, indent = 0) {
  const lines = text.split(/\r?\n/);
  const prefix = ' '.repeat(indent);
  const start = lines.findIndex((line) => line === `${prefix}${header}:`);
  assert.notEqual(start, -1, `缺少 ${prefix}${header}:`);

  const result = [lines[start]];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '') {
      result.push(line);
      continue;
    }
    const currentIndent = line.match(/^ */)[0].length;
    if (currentIndent <= indent) break;
    result.push(line);
  }
  return result.join('\n');
}

function eventNames(onBlock) {
  return [...onBlock.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)].map((match) => match[1]);
}

function jobNames(jobsBlock) {
  return [...jobsBlock.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)].map((match) => match[1]);
}

function runBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!match) continue;

    const indent = match[1].length;
    const inline = match[2].trim();
    if (inline && !/^[|>][+-]?$/.test(inline)) {
      blocks.push(inline);
      continue;
    }

    const block = [];
    let next = index + 1;
    for (; next < lines.length; next += 1) {
      const line = lines[next];
      if (line.trim() === '') {
        block.push(line);
        continue;
      }
      const lineIndent = line.match(/^ */)[0].length;
      if (lineIndent <= indent) break;
      block.push(line);
    }
    blocks.push(block.join('\n'));
    index = next - 1;
  }

  return blocks;
}

test('PR8-01 release workflow is manually confirmed and publishes only from main', () => {
  const workflow = read(RELEASE_WORKFLOW);
  const onBlock = sectionByHeader(workflow, 'on');

  assert.deepEqual(eventNames(onBlock), ['workflow_dispatch']);
  assert.match(onBlock, /^      confirm:\s*$/m);
  assert.match(onBlock, /confirm:[\s\S]*?required:\s*true/);
  assert.match(onBlock, /confirm:[\s\S]*?type:\s*string/);
  assert.match(onBlock, /^      notes:\s*$/m);
  assert.match(onBlock, /notes:[\s\S]*?required:\s*false/);
  assert.match(workflow, /^    environment: release$/m);
  assert.match(workflow, /test "\$CONFIRM" = "RELEASE"/);
  assert.match(workflow, /git fetch --no-tags origin main/);
  assert.match(workflow, /git rev-parse origin\/main/);
  assert.match(workflow, /\$GITHUB_SHA/);
  assert.match(workflow, /ANDROID_EXPECTED_CERT_SHA256/);
  assert.match(workflow, /certificate-sha256\.py/);
  assert.match(workflow, /scripts\/release\/check-release\.py/);
  assert.match(workflow, /aapt2 dump badging/);
  assert.match(workflow, /EXPECTED_APPLICATION_ID: com\.xjb\.bingli/);
  assert.match(workflow, /test "\$PACKAGE_NAME" = "\$EXPECTED_APPLICATION_ID"/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /rm -f "\$RUNNER_TEMP\/release\.keystore"/);
  assert.match(workflow, /RELEASE_NOTES_INPUT: \$\{\{ inputs\.notes \}\}/);
});

test('PR8-02 release jobs have least privilege, timeouts and no release build in verify', () => {
  const workflow = read(RELEASE_WORKFLOW);
  const jobs = sectionByHeader(workflow, 'jobs');
  const verify = sectionByHeader(jobs, 'verify', 2);
  const release = sectionByHeader(jobs, 'release', 2);

  assert.match(workflow, /^permissions:\s*\{\}\s*$/m);
  assert.match(verify, /^    permissions:\n      contents: read$/m);
  assert.match(release, /^    permissions:\n      contents: write$/m);

  const releasePermissions = sectionByHeader(release, 'permissions', 4);
  assert.deepEqual(
    [...releasePermissions.matchAll(/^      ([A-Za-z0-9_-]+):/gm)].map((match) => match[1]),
    ['contents'],
  );

  for (const job of ['verify', 'release']) {
    assert.match(sectionByHeader(jobs, job, 2), /^    timeout-minutes: \d+$/m, `${job} 缺少超时`);
  }
  assert.equal((workflow.match(/persist-credentials: false/g) ?? []).length, 2);
  assert.doesNotMatch(verify, /assembleRelease|bundleRelease|apksigner|ANDROID_KEYSTORE/);
  assert.match(verify, /assembleDebug/);
  assert.match(release, /assembleRelease/);
});

test('PR8-03 verify and pages workflows never build or sign an APK', () => {
  for (const fileName of [VERIFY_WORKFLOW, PAGES_WORKFLOW]) {
    const workflow = read(fileName);
    assert.doesNotMatch(workflow, /assemble/i, `${fileName} 不得构建 APK`);
    assert.doesNotMatch(workflow, /bundleRelease/i, `${fileName} 不得打包 release bundle`);
    assert.doesNotMatch(workflow, /apksigner/i, `${fileName} 不得执行签名校验`);
    assert.doesNotMatch(workflow, /keystore|ANDROID_KEY(?:STORE|_)/i, `${fileName} 不得读取签名 Secret`);
    assert.match(workflow, /^permissions:\n  contents: read$/m);

    const jobs = sectionByHeader(workflow, 'jobs');
    for (const job of jobNames(jobs)) {
      assert.match(sectionByHeader(jobs, job, 2), /^    timeout-minutes: \d+$/m, `${job} 缺少超时`);
    }
  }

  const pagesOn = sectionByHeader(read(PAGES_WORKFLOW), 'on');
  assert.deepEqual(eventNames(pagesOn), ['workflow_dispatch']);
});

test('PR8-04 Android identity and default versionCode remain pinned', () => {
  const gradle = read(BUILD_GRADLE);
  assert.match(gradle, /applicationId\s+['"]com\.xjb\.bingli['"]/);

  const versionCode = gradle.match(
    /versionCode\s*=\s*\(project\.findProperty\('versionCode'\)\s*\?:\s*'(\d+)'\)\.toInteger\(\)/,
  );
  assert.ok(versionCode, 'build.gradle 缺少整数默认 versionCode');
  const parsed = Number(versionCode[1]);
  assert.ok(Number.isInteger(parsed));
  assert.ok(parsed >= 300008, `默认 versionCode ${parsed} 小于 300008`);
});

test('PR8-05 run scripts never interpolate dispatch inputs', () => {
  for (const fileName of [RELEASE_WORKFLOW, VERIFY_WORKFLOW, PAGES_WORKFLOW]) {
    for (const block of runBlocks(read(fileName))) {
      assert.doesNotMatch(
        block,
        /\$\{\{\s*(?:inputs|github\.event\.inputs)\./,
        `${fileName} 在 run 脚本中直接插值了输入值`,
      );
    }
  }
});

test('PR8-06 UpdateManager still reads update.json from GitHub releases', () => {
  const source = read(UPDATE_MANAGER);
  assert.match(
    source,
    /https:\/\/api\.github\.com\/repos\/"\s*\+\s*BuildConfig\.UPDATE_REPOSITORY\s*\+\s*"\/releases\/latest/,
  );
  assert.match(source, /asset\(assets,\s*"update\.json"\)/);
});

const hasPython3 = spawnSync('python3', ['--version'], { encoding: 'utf8' }).status === 0;

test(
  'PR8-07 check-release.py rejects equal or lower versionCode and accepts higher',
  { skip: hasPython3 ? false : 'python3 is not installed' },
  () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bingli-pr8-release-'));
    const latestPath = path.join(tempDir, 'update.json');
    fs.writeFileSync(
      latestPath,
      JSON.stringify({
        schemaVersion: 1,
        applicationId: 'com.xjb.bingli',
        versionCode: 300008,
        versionName: '3.0.0.8',
        minSdk: 26,
        apkAssetName: 'bingli.apk',
        apkSizeBytes: 1,
        apkSha256: '0'.repeat(64),
        signingCertSha256: '0'.repeat(64),
        commitSha: 'latest-sha',
        publishedAt: '2026-10-31T00:00:00Z',
        releaseNotes: 'fixture',
      }),
      'utf8',
    );

    function check(candidateVersionCode) {
      return spawnSync(
        'python3',
        [
          CHECK_RELEASE,
          '--latest',
          latestPath,
          '--candidate-version-code',
          String(candidateVersionCode),
          '--candidate-tag',
          'v3.0.0.9',
          '--latest-tag',
          'v3.0.0.8',
          '--candidate-sha',
          'candidate-sha',
          '--existing-tag-sha',
          '',
        ],
        { encoding: 'utf8' },
      );
    }

    try {
      for (const versionCode of [300008, 300007]) {
        const result = check(versionCode);
        assert.notEqual(result.status, 0, `versionCode ${versionCode} 应被拒绝`);
        assert.match(`${result.stdout}${result.stderr}`, /不高于/);
      }

      const accepted = check(300009);
      assert.equal(accepted.status, 0, accepted.stderr);
      assert.match(accepted.stdout, /ok candidate=300009/);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  },
);
