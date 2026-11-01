# Android 旧 Origin 迁移

Android 始终使用 `https://appassets.androidplatform.net`。启动时，应用先用一个临时、隐藏的 WebView 打开 `legacy-migrate.html`。页面只枚举四类旧 localStorage 键，并把原始字符串交给受限的 `BingliLegacyMigrate` bridge；它不加载旧业务代码，也不删除任何键。

`LegacyMigrator` 位于 `android/app/src/main/java/com/xjb/bingli/migration/LegacyMigrator.kt`。它是无 `android.*` 依赖的 JVM 核心，写入 `filesDir/legacy-migration/legacy-staging.json`、manifest 和状态日志。暂存和状态均使用临时文件、`fsync`、rename；manifest 保存字节数、SHA-256、时间、应用版本、键数、记录 ID 和损坏键。损坏的 JSON 原样保存并报告，不会被修复或覆盖。

状态流转为 `NONE → STAGED → IMPORTED → CONFIRMED`；连续两次成功启动才进入 `CONFIRMED`。校验或导入失败进入 `FAILED`，并保留暂存文件。`rollback()` 用上一份状态文件恢复状态，`exportRaw()` 为恢复界面提供原始 payload。失败时主 WebView 打开 `migrate-recovery.html`，用户可以导出原始数据或重试。

`MainActivity` 的主 bridge 提供只读 `stagedLegacy()`，网页导入成功后可调用 `legacyImportSucceeded()`；后续两次成功启动由原生确认。`packages/storage/src/android-staged-import.ts` 把暂存 payload 适配成 `StorageLike`，复用浏览器迁移读取和 v1/v2/v3 规范化路径，再以事务导入 IndexedDB。导入前验证所有键，因此损坏数据不会写入；已有数据库数据也不会被覆盖。导入结果包括记录数、ID 和姓名、主诉、诊断及导出 JSON 对比。

相关资产是 `legacy-migrate.html` 和 `migrate-recovery.html`；`index.html` 仍由 `build.js` 生成并被忽略。CI 的 `android-unit` 只运行 `:app:testDebugUnitTest`，并在 Gradle 的 `buildWeb` 前安装 Node 依赖和生成网页资产。

真实设备上的覆盖安装测试仍待完成，需验证旧 WebView 存储、记录正文、ID、更新时间和导出 JSON 在升级后保持一致。清除应用数据仍会按 Android 预期清除 WebView 存储。

## 模拟 Origin 验证（无模拟器、无 APK）

`NODE_PATH=<playwright 所在 node_modules> npm run harness:android-migration -- <输出目录>`

Playwright 在 `https://appassets.androidplatform.net` 上提供 `legacy-migrate.html`，用 v1/v2/v3 夹具写入旧 localStorage 键，用桥接桩代替 Kotlin 暂存（记录字节数和 SHA-256），再导入新的 IndexedDB 并比对记录数、ID、姓名、主诉、诊断和导出 JSON。结果见 `docs/screenshots/pr4/report.json`。

**真机覆盖安装测试仍待完成。**
