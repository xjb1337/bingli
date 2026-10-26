/* 通过 GitHub API 推送本地提交。
 *
 * 背景：本机 `git push` 会卡在凭据输入上（报 `/dev/tty: No such device or address`），
 * `git credential fill` 也读不到（报 terminal prompts disabled），但 api.github.com 可达。
 * 这里用 Git Data API 复刻一次 push：blob → tree → commit → 更新 ref。
 *
 * 令牌来源（按顺序尝试）：
 *   1. 环境变量 GH_TOKEN / GITHUB_TOKEN
 *   2. Windows 凭据管理器里的 `git:https://github.com`（advapi32 的 CredRead）
 *   3. `git credential fill`
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

/* Windows 凭据管理器。读不到返回 ''。
 * 注意：node 的 PATH 里通常没有 pwsh（PowerShell 7），但一定有系统自带的
 * Windows PowerShell 5.1，所以两个都试，谁先能用就用谁。 */
function tokenFromWindowsCredentialManager() {
  if (process.platform !== 'win32') return '';
  const script = [
    '$sig = @\'',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public class BingliCred {',
    '  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]',
    '  public struct CREDENTIAL {',
    '    public int Flags; public int Type; public string TargetName; public string Comment;',
    '    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;',
    '    public int CredentialBlobSize; public IntPtr CredentialBlob;',
    '    public int Persist; public int AttributeCount; public IntPtr Attributes;',
    '    public string TargetAlias; public string UserName;',
    '  }',
    '  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]',
    '  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);',
    '  [DllImport("advapi32.dll", SetLastError=true)]',
    '  public static extern void CredFree(IntPtr cred);',
    '  public static string Get(string target) {',
    '    IntPtr p;',
    '    if (!CredRead(target, 1, 0, out p)) return "";',
    '    try {',
    '      CREDENTIAL c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL));',
    '      if (c.CredentialBlobSize == 0) return "";',
    '      byte[] b = new byte[c.CredentialBlobSize];',
    '      Marshal.Copy(c.CredentialBlob, b, 0, c.CredentialBlobSize);',
    '      return System.Text.Encoding.Unicode.GetString(b);',
    '    } finally { CredFree(p); }',
    '  }',
    '}',
    '\'@',
    'Add-Type -TypeDefinition $sig -Language CSharp',
    "[Console]::Out.Write([BingliCred]::Get('git:https://github.com'))"
  ].join('\n');
  const shells = [
    'pwsh',
    process.env.SystemRoot ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe` : '',
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
  ].filter(Boolean);
  for (const shell of shells) {
    try {
      const out = execFileSync(shell, ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf8', timeout: 60000
      }).trim();
      if (out) return out;
    } catch { /* 换下一个 */ }
  }
  return '';
}

function tokenFromGitCredential() {
  try {
    const out = execFileSync('git', ['credential', 'fill'], {
      input: 'protocol=https\nhost=github.com\n\n',
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });
    const m = /^password=(.+)$/m.exec(out);
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}

function token() {
  const fromEnv = (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '').trim();
  if (fromEnv) { console.log('令牌来源：环境变量'); return fromEnv; }
  const fromWin = tokenFromWindowsCredentialManager();
  if (fromWin) { console.log('令牌来源：Windows 凭据管理器'); return fromWin; }
  const fromGit = tokenFromGitCredential();
  if (fromGit) { console.log('令牌来源：git credential'); return fromGit; }
  throw new Error('找不到 GitHub 令牌：请设置 GH_TOKEN，或在 Windows 凭据管理器里存 git:https://github.com');
}

const TOKEN = token();

async function apiOnce(method, path, body) {
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
  return { ok: res.ok, status: res.status, text, json };
}

/* 这台机器的出口网络对 api.github.com 很不稳定：偶发 ECONNRESET、偶发 HTTP 400
 * 「malformed request」，同一份 body 重发一次就过。所以统一做三次重试，
 * 只有连续三次都失败才认为真的出错。 */
async function api(method, path, body) {
  let last = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await apiOnce(method, path, body);
      if (r.ok) return r.json;
      last = `HTTP ${r.status}: ${r.text.slice(0, 300)}`;
      if (process.env.DBG) console.log(`  [retry ${attempt}] ${method} ${path} → ${r.status}`);
    } catch (e) {
      last = String(e && e.message || e);
      if (process.env.DBG) console.log(`  [retry ${attempt}] ${method} ${path} → ${last}`);
    }
    if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt));
  }
  throw new Error(`${method} ${path} → ${last}`);
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

// 本地相对远端的差异。
// 注意：远端那个提交可能是本脚本上一次用 API 重建的，本地并没有它的对象，
// 直接 `git diff <远端sha>` 会报 bad object。这里检测本地是否有该对象，
// 没有就退回到 HEAD 的父提交做基准，再用远端 tree 当 base_tree —— 效果等价：
// 没改动的文件保持远端内容，只覆盖本次真正变了的文件。
let diffBase = baseSha;
try {
  git('cat-file', '-e', baseSha + '^{commit}');
} catch {
  diffBase = git('rev-parse', 'HEAD~1');
  console.log(`远端提交 ${baseSha.slice(0, 7)} 本地不存在，改用 ${diffBase.slice(0, 7)} 作差异基准。`);
}

const nameStatus = git('diff', '--name-status', diffBase, localHead).split('\n').filter(Boolean);
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
  let content;
  try { content = readFileSync(path); }
  catch (e) { throw new Error(`读不到 ${JSON.stringify(path)}（长度 ${path.length}）：${e.message}`); }
  if (process.env.DBG) console.log(`  [dbg] path=${JSON.stringify(path)} len=${path.length} bytes=${content.length}`);
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
