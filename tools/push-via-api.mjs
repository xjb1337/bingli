/* 通过 GitHub API 推送本地提交。
 *
 * 背景：本机到 github.com:443 的 Git 协议线路不通（直连超时、代理程序未运行），
 * 但 api.github.com 可达。这里用 Git Data API 复刻一次 push：
 *   blob → tree → commit → 更新 ref
 *
 * 用法：
 *   node tools/push-via-api.mjs                   # 推送 HEAD 到 origin/main
 *   node tools/push-via-api.mjs --dry-run         # 只打印将要推送的文件
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const OWNER = 'xjb1337';
const REPO = 'bingli';
const BRANCH = 'main';
const API = 'https://api.github.com';
const dryRun = process.argv.includes('--dry-run');

function git(...args) {
  // core.quotepath=false：否则中文路径会被转义成 "dist/\345..." 这种形式，读文件会失败
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], { encoding: 'utf8' }).trim();
}

function token() {
  // 复用 git 已保存的凭据（credential.helper = manager）
  const out = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8'
  });
  const m = /^password=(.+)$/m.exec(out);
  if (!m) throw new Error('未能从 git 凭据读取 GitHub token');
  return m[1].trim();
}

const TOKEN = token();

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'dsh-push',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 非 JSON */ }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return json;
}

const localHead = git('rev-parse', 'HEAD');
const message = git('log', '-1', '--pretty=%B');

// 远端当前指向
const ref = await api('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const baseSha = ref.object.sha;

if (baseSha === localHead) {
  console.log('远端已是本地 HEAD，无需推送。');
  process.exit(0);
}

const baseCommit = await api('GET', `/repos/${OWNER}/${REPO}/git/commits/${baseSha}`);
const baseTree = baseCommit.tree.sha;

// 本地相对远端的差异
const nameStatus = git('diff', '--name-status', baseSha, localHead).split('\n').filter(Boolean);
if (!nameStatus.length) {
  console.log('本地与远端内容一致，无需推送。');
  process.exit(0);
}

const tree = [];
for (const line of nameStatus) {
  const parts = line.split('\t');
  const status = parts[0][0];
  const path = parts[parts.length - 1];

  if (status === 'D') {
    tree.push({ path, mode: '100644', type: 'blob', sha: null });
    console.log(`  删除 ${path}`);
    continue;
  }
  const content = readFileSync(path);
  // Git blob 存的是原始字节；文本文件用 UTF-8 编码后 base64
  const b64 = content.toString('base64');
  const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
    content: b64,
    encoding: 'base64'
  });
  // 保留可执行位（Windows 上一般用不到，但别丢）
  let mode = '100644';
  try {
    const m = git('ls-tree', localHead, path).split(/\s+/)[0];
    if (m === '100755') mode = '100755';
  } catch { /* 用默认 */ }
  tree.push({ path, mode, type: 'blob', sha: blob.sha });
  console.log(`  ${status === 'A' ? '新增' : '修改'} ${path} (${content.length} 字节)`);
}

if (dryRun) {
  console.log('\n--dry-run：以上为将要推送的文件，未实际写入。');
  process.exit(0);
}

const newTree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, { base_tree: baseTree, tree });

const newCommit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
  message,
  tree: newTree.sha,
  parents: [baseSha]
});

await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  sha: newCommit.sha,
  force: false
});

console.log('');
console.log(`推送成功：${baseSha.slice(0, 7)} → ${newCommit.sha.slice(0, 7)}`);
console.log(`本地 HEAD 是 ${localHead.slice(0, 7)}；若两者不同，说明内容一致但提交对象不同（API 重建的提交 SHA 会变）。`);
console.log('接着执行：git fetch origin && git reset --soft origin/main  可让本地指向远端提交。');
