# Android 升级验收清单

每次正式发布都在真实 Android 设备上执行本清单。每项必须勾选并填写证据；没有证据的勾选
不视为通过。若某项不适用，写明原因并附上证明，不要直接删除该项。

## 发布信息

| 字段 | 记录 |
|---|---|
| 候选 Release tag / versionName |  |
| 候选 versionCode |  |
| 候选提交 SHA |  |
| 上一正式版 tag / versionCode |  |
| 设备型号 / Android / WebView 版本 |  |
| 执行人 / 日期 |  |
| 证据目录或链接 |  |

## 覆盖安装与数据

- [ ] **从上一正式签名版覆盖安装**：不卸载、不清除应用数据，使用系统安装器或应用内更新覆盖
  安装候选 APK，确认安装成功且包名仍为 `com.xjb.bingli`。
  - 证据：安装前后版本截图、安装器成功截图/录屏，以及 `adb shell dumpsys package com.xjb.bingli`
    中的 `versionCode` 输出路径或原始文本。

- [ ] **本机病历可读取**：升级后打开病历列表，逐项查看姓名、主诉、现病史、诊断和文书正文，
  保存后重新打开仍一致；导出 JSON 并核对关键字段。
  - 证据：升级前后同一条合成病历的截图、导出 JSON 文件名/哈希，以及字段比对记录。

- [ ] **旧版迁移标记正确**：如设备有 v1/v2/v3 旧数据，检查 IndexedDB 的
  `meta.browserLegacyMigration`、`meta.migratedFrom`、`documentMeta.*.origin = legacy`、
  `meta.fieldStates[path].source = legacy`；如走 Android 旧 Origin 暂存，检查
  `filesDir/legacy-migration/` 的状态从 `STAGED/IMPORTED` 到 `CONFIRMED`，且 manifest、键数、
  记录 ID 与暂存 SHA-256 一致。无旧数据时标记 N/A 并说明。
  - 证据：截图、状态日志、manifest 摘要、迁移 harness/原生日志路径；不要附真实患者信息。

## 更新链路

- [ ] **检查更新发现新版本**：在上一正式版 App 中点击“检查更新”，能读取 GitHub Release 的
  `update.json`，显示候选 `versionName`，且 `versionCode` 高于本机；下载后大小、SHA-256、
  包名、版本和签名校验通过，并打开系统安装器。
  - 证据：检查更新弹窗、下载/校验进度、安装器包名与版本截图，以及公共 `update.json` URL。

- [ ] **身份、证书和版本校验**：对公共下载的 APK 执行下列检查并记录原始输出；四项都必须
  与 Release 清单和历史固定值一致。
  - `aapt2 dump badging bingli.apk` 的 `package: name='com.xjb.bingli'`。
  - `apksigner verify --print-certs-pem bingli.apk | python3 scripts/release/certificate-sha256.py`
    等于 `ANDROID_EXPECTED_CERT_SHA256` 和 `update.json.signingCertSha256`。
  - `update.json.versionCode` 严格大于上一正式版，且等于 APK 的 `versionCode`。
  - APK 文件大小和 SHA-256 等于 `update.json`。
  - 证据：命令、原始输出、执行时间；建议保存为 `identity-checks.txt`。

## 网页与 AI 边界

- [ ] **Pages 离线冒烟**：在线打开 `https://xjb1337.github.io/bingli/` 一次，确认 Service Worker
  已接管；断网后刷新仍能打开应用、读取本机记录并保存/生成文书。记录浏览器版本、缓存名和
  离线截图。Android 升级不要求 Pages 重新发布。
  - 证据：浏览器版本、Service Worker 状态截图、断网前后页面和记录截图、测试时间。

- [ ] **AI Key 未被持久化到病历或网页存储**：导出 JSON 中搜索不到 API Key；浏览器
  IndexedDB/localStorage 不含 API Key；Android 的密钥只在 Keystore 加密存储，不进入 JSON
  备份、`update.json` 或日志。升级后常规离线功能不依赖 AI Key。
  - 证据：脱敏后的搜索命令和 “no matches” 输出、导出 JSON 检查截图、Keystore/设置截图；
    严禁把真实 Key 写入证据。

## 结论

- [ ] 全部适用项通过，证据齐全，候选 Release 可标记为验收通过。
- [ ] 任一阻断项失败时停止推荐该版本，按 `docs/RELEASE.md` 的回滚流程标记 pre-release，
  恢复上一正式版为 Latest，并以更高 `versionCode` 发布热修复。

验收人签名：____________________　　日期：____________________

备注/未覆盖边界：

________________________________________________________________________________
