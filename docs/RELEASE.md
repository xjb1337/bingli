# Android 发布流程

本文件描述 `.github/workflows/release.yml` 的人工发布、审批、版本与回滚流程。普通
`push`、Pull Request、定时任务和 GitHub Release 事件都不会触发 APK 构建；只有具有仓库
写权限的人手动运行 `workflow_dispatch`，并通过 `release` Environment 审批后才可能发布。

## 谁可以发布

- **发起人**：仓库所有者，或所有者明确指定的维护者。发起人必须具有运行 Actions 工作流的
  仓库写权限。
- **审批人**：`release` Environment 的 required reviewer。审批人必须独立核对提交、版本和
  发布说明；建议至少指定两名维护者并启用 **Prevent self-review**，避免发起人自行批准。
- **配置人**：只有仓库所有者/管理员可以创建 Environment、指定审批人和写入签名 Secrets。
  这些保护无法由仓库内的 YAML 自行授予或绕过。

任何 PR 合并都不等于发布授权。不要把发布权限改成无人审批，也不要让机器人自动批准部署。

## 必需的 GitHub Environment

这是一个必须由仓库所有者手动完成的仓库设置，工作流本身不能代为创建：

1. 打开 **Settings → Environments → New environment**，名称必须是 `release`。
2. 在 **Deployment branches and tags** 中只允许 `main`。
3. 在 **Required reviewers** 中加入所有者指定的审批人；建议启用 **Prevent self-review**。
4. 将下述签名 Secrets 放在该 Environment（推荐）或仓库 Secrets 中。
5. 保存后，手动运行 release workflow 的 `release` job 会停在审批门禁，未批准不会构建或
   发布签名的 Release APK。

如果 `release` Environment 不存在、没有 required reviewer，或 Secrets 不完整，发布必须
中止。不得通过临时移除审批人或改用其他环境来绕过门禁。

## Secrets

以下 Secrets 必须属于同一份固定签名密钥：

| Secret | 用途 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | release keystore 的 Base64 内容，例如 `base64 -w0 release.jks`。 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 口令。 |
| `ANDROID_KEY_ALIAS` | 签名 key alias。 |
| `ANDROID_KEY_PASSWORD` | key 口令。 |
| `ANDROID_EXPECTED_CERT_SHA256` | APK 签名证书的固定 SHA-256，大小写不敏感。 |

`GITHUB_TOKEN` 由 Actions 自动提供，不需要另建 PAT。顶层权限为空，只有 `verify` job 读取
仓库内容，`release` job 获得 `contents: write` 以创建 Release；其他 job 没有写权限。

签名文件只在 runner 的临时目录中解码，成功或失败都会在 `if: always()` 清理步骤中删除。
不要把 keystore、口令、Base64 内容或临时证书输出提交到仓库、Issue、日志或普通附件。

## 版本与身份约束

发布 workflow 固定使用：

```text
versionCode = 300000 + GITHUB_RUN_NUMBER
versionName = 3.0.0.<GITHUB_RUN_NUMBER>
applicationId = com.xjb.bingli
minSdk = 26
```

- `versionCode` 必须严格递增。workflow 下载当前最新正式 Release 的 `update.json`，由
  `scripts/release/check-release.py` 拒绝相等或更低的值，同时拒绝复用已有 tag。
- 已发布的 run 不能靠重复 rerun 再发一次；相同 run number 会得到相同 `versionCode`，检查会
  拒绝。需要修复时先合并修复，再发起新的 workflow run。
- 每次发布前仍应人工确认当前 `update.json` 的 `versionCode` 低于候选值；不能使用
  `force` 推送 tag 或手工改写已发布清单来绕过检查。
- `android/app/build.gradle` 的默认 `300008` 只用于本地构建；release workflow 会用本次 run
  number 覆盖它。

构建后 workflow 使用 Android build-tools 中的 `aapt2 dump badging` 校验首行包名为
`com.xjb.bingli`，并在 `update.json` 中再次验证包名、`versionCode`、`versionName`、minSdk
和 APK 哈希。包名或版本不符必须失败。

## 签名证书固定

升级只能继续使用历史版本的同一张签名证书。`ANDROID_EXPECTED_CERT_SHA256` 与
`update.json` 的 `signingCertSha256` 必须一致；App 下载 APK 后也会再次比较本机签名，拒绝
不同证书或降级包。

当前历史固定证书 SHA-256（以现有 Release 和 Secret 为准）：

```text
075942a992312f98cbb7c4c3072729d22d9c3846979757c27fe0d3be06e7cdae
```

发布前后可独立核对：

```bash
apksigner verify --print-certs-pem bingli.apk | python3 scripts/release/certificate-sha256.py
```

不要在日常发布中轮换签名 key，也不要重新生成 keystore。密钥和口令必须离线备份；丢签名
key 后，已安装用户无法通过普通覆盖安装升级，只能走另行规划的数据导出与迁移。

## 手动发布步骤

1. 确认改动已经合并到 `main`，普通 `verify.yml` 全部通过，当前分支没有未提交改动。
2. 打开 **Actions → Release APK → Run workflow**。
3. 选择 `Branch: main`。在 `confirm` 中必须准确输入 `RELEASE`，否则 `verify` job 第一步就
   失败；`notes` 可选，会追加到 GitHub Release 和 `update.json.releaseNotes`。
4. 运行后先执行 `verify` job：它运行 Node 全套验证和 Android debug 单测/lint/debug APK，
   不构建 release APK，也不需要签名 Secrets。
5. `release` job 进入 `release` Environment，等待 required reviewer 批准。审批人应核对
   候选提交、版本、说明和验证结果；不批准则不会生成签名 Release。
6. 批准后，`release` job 校验提交仍是 `main` 当前头、要求全部签名 Secrets、构建签名 APK、
   用 `aapt2` 校验 `com.xjb.bingli`、生成并校验 `update.json`、核对证书与版本。
7. 发布前再次检查 `main` 没有前进且 tag 未被占用，创建 draft Release，上传
   `update.json`、`bingli.apk`（及可选的 `mapping.txt`），再标记为正式 latest。
8. 发布后核验公共下载、`update.json`、证书和真机升级，并按
   [升级验收清单](UPGRADE_ACCEPTANCE.md)记录证据。

`notes` 只通过环境变量传给 shell，workflow 不在 `run:` 脚本中直接插值
`${{ inputs.* }}`，避免发布说明造成脚本注入。

## 发布后检查

- 从 Release 公共地址下载 APK 和 `update.json`，不要只信本地构建产物。
- 核对 `applicationId`、严格递增的 `versionCode`、固定证书 SHA-256、APK 大小和 SHA-256。
- 在真实设备上从上一正式版执行应用内检查更新、下载、校验和系统覆盖安装。
- 确认病历列表、正文和导出 JSON 均可读；旧版迁移标记符合预期。
- 网页 Pages 只按 `docs/PAGES.md` 独立手发；它不使用 APK 签名，也不会被这些 Secrets 影响。

本仓库不自动构建 APK。任何验收若只验证了本地 debug 或 adb 安装，不能替代应用内更新和真实
设备覆盖安装的发布结论。

## 回滚

发布是前向修复，不允许把用户的 `versionCode` 降回去。Android 安装器和 App 的更新逻辑都会
拒绝降级，因此回滚的目标是“停止传播坏版本，再发布更高版本的热修复”：

1. 发现坏 Release 后立即停止继续发布，不要删除 tag/asset，也不要改写旧 `update.json`。
2. 在 GitHub Release 页面把坏版本标为 **pre-release**，并把上一个已验证的正式版恢复为
   **Latest**；App 读取 `/releases/latest`，不应再看到坏版本。也可使用：

   ```bash
   gh release edit vBAD --prerelease
   gh release edit vGOOD --latest
   ```

3. 在 `main` 修复问题，重新执行 `verify.yml`，再手动发起新的 release run。热修复必须有更高
   `versionCode`，由 `check-release.py` 再次校验。
4. 如果问题涉及签名密钥丢失、证书变化或数据损坏，停止发布并先恢复离线备份/制定迁移方案；
   不得用新 key 直接覆盖已安装版本。
5. 保留失败 run、Release、日志和真机证据，完成原因分析后再更新本文件或验收清单。

用户遇到坏版本时，优先指导其先导出 JSON 备份，再安装更高版本；不要建议卸载重装，因为卸载
会清除本机 WebView/IndexedDB 病历。
