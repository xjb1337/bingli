# Android 旧 Origin 迁移

Android 用 WebViewAssetLoader 从 `https://appassets.androidplatform.net/assets/` 提供 APK 内的资源。默认构建仍使用由 `build.js` 生成的旧前端。在 Android Gradle 命令中传入 `-PuseModernWeb=true` 会打包 `apps/web` 的分块产物，并启用原生暂存迁移。

新版首次启动时，应用用一个临时、隐藏的 WebView 打开 `legacy-migrate.html`，读取同源的四类旧 localStorage 键并交给 `BingliLegacyMigrate`。旧版本曾提前暂存过的数据会重新读取，以包含旧版后续保存的病历。读取和导入过程都会保留原 localStorage。

`LegacyMigrator` 位于 `android/app/src/main/java/com/xjb/bingli/migration/LegacyMigrator.kt`。它是无 `android.*` 依赖的 JVM 核心，写入 `filesDir/legacy-migration/legacy-staging.json`、manifest 和状态日志。暂存和状态均使用临时文件、`fsync`、rename；manifest 保存字节数、SHA-256、时间、应用版本、键数、记录 ID 和损坏键。损坏的 JSON 原样保存并报告，不会被修复或覆盖。

状态依次为 `NONE → STAGED → IMPORTED → CONFIRMED`。Web 读库成功后才会上报启动结果，每次 Activity 启动最多计一次，累计两次后进入 `CONFIRMED`。暂存校验或导入失败时会保留原始数据，恢复页可导出或重试。

`MainActivity` 的 `stagedLegacy()` 提供已校验的暂存数据。Web 端复用 v1/v2/v3 规范化路径，将病历、设置、隔离的坏条目与暂存 SHA-256 一并提交到 IndexedDB。若进程在提交后、原生确认前退出，下一次启动可以确认同一批暂存而无需重写数据。遇到其他来源的现有数据库时，应用保留其内容并提示导出原始暂存。整份旧病历列表无法解析时转到恢复页。

相关资产是 `legacy-migrate.html` 和 `migrate-recovery.html`。Gradle 在独立生成目录打包新版 Web 资源，`npm run build:web` 的网页产物仍使用网站基路径。

## 实体手机覆盖安装验收

1. 选用仍运行旧前端、使用同一 WebView Origin 的已安装版本。先用虚构病历记录旧版的正文、ID、更新时间和导出 JSON，并保留备份。
2. 用同一 applicationId 和签名构建更高 versionCode 的候选 APK，传入 `-PuseModernWeb=true`。在已授权的测试手机上覆盖安装并保留应用数据。
3. 检查新版病历列表、当前病历、文书正文和设置。对照升级前的 ID、更新时间及导出 JSON 的病历内容。
4. 关闭应用后重新启动，确认病历可打开、数量无重复，并验证导出仍可用。另用损坏夹具核对恢复页和原始数据导出。

## 模拟 Origin 验证（无模拟器、无 APK）

`NODE_PATH=<playwright 所在 node_modules> npm run harness:android-migration -- <输出目录>`

Playwright 用 v1/v2/v3 及损坏夹具写入旧 localStorage，用桥接桩代替 Kotlin 暂存，再导入 IndexedDB。报告记录迁移对比、隔离条目及前后 localStorage 校验值。设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 可以使用本机的 Chrome。

**真机覆盖安装测试仍待完成。**

已在 `linti_api35` 用独立测试包名完成旧版到新版的覆盖安装。虚构病历及旧草稿均完成迁移，已比对当前记录指针、病历正文、ID、更新时间与导出 JSON，并在第二次成功启动后核对到 `CONFIRMED`。
