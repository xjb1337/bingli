# Android APK 与更新交付（2026-10-30）

## 首轮本地基线（历史记录）

- APK：`dist/bingli-3.0.0.apk`（忽略目录，不提交二进制）。
- 包名：`com.xjb.bingli`；版本：`3.0.0` / `300000`；minSdk 26，targetSdk 35。
- 大小：1835620 字节。
- SHA-256：`8dd5998dc8a0ecb0c72f07ab9a606f37f0443b3c982c24f3234ef532d873d3d6`。
- 签名证书 SHA-256：`075942a992312f98cbb7c4c3072729d22d9c3846979757c27fe0d3be06e7cdae`。
- release 不可调试；网页随 APK 打包，不依赖网站和 SW。WebView 仅加载固定 HTTPS 本地来源，阻止外部页面和子资源。

## 构建

JDK 17、Android SDK 35、Gradle 8.9 / AGP 8.7.3。

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-17'
$env:GRADLE_USER_HOME='C:\Users\liu\.gradle'
.\tools\build-android.ps1
```

`android/local.properties` 为本机 SDK 路径，不入库。签名密钥和口令仅在被忽略的 `android/.signing/`，不得提交、打印、通过普通附件发送。后续升级必须继续使用同一密钥，应由所有者妥善备份。

## 自动更新

参考 `xjb1337/medical-question-ai`，检查 `xjb1337/bingli` 最新正式 Release，读取唯一的 `update.json` 与 APK asset。启动时每天检查，顶部按钮可手动检查。下载前验证清单与当前签名；下载后验证大小、SHA-256、包名、版本号、版本名和实际 APK 签名，拒绝降级，再调用系统安装器。用户确认安装，不支持绕过系统静默安装。

`.github/workflows/release.yml` 在 main 推送或手动触发后先运行网页验证与 Android 测试/lint，再构建签名 release、校验固定证书和版本、发布 `bingli.apk` 与 `update.json`。CI versionCode 为 300000 + GITHUB_RUN_NUMBER，正常高于本地首版。

需要仓库 Secrets：ANDROID_KEYSTORE_BASE64、ANDROID_KEYSTORE_PASSWORD、ANDROID_KEY_ALIAS、ANDROID_KEY_PASSWORD、ANDROID_EXPECTED_CERT_SHA256。必须配置本机首版的同一密钥。

2026-10-30：所有者已明确授权上传签名密钥及口令到本仓库 Secrets，5 项签名配置已加密上传，固定证书指纹与本地首版一致。公共安装与自动更新全链路的结果另附发布验收记录。

## 本轮实际验证

- `npm run verify`：624/624。
- `assembleRelease testDebugUnitTest lintRelease`：通过；更新校验 9/9；lint 0 错误，兼容性/本地化等警告仍存在。
- 雷电 index 0，Android 9，WebView 91：安装同签名测试基线 versionCode 299999，用 DOM 输入事件录入合成姓名、年龄、主诉、中文现病史，保存及生成正文成功。
- `adb install -r` 升级至 release 300000 成功，实际截图仍显示此前中文现病史；不是卸载重装。
- release 包 flags 无 DEBUGGABLE。
- 原生检查更新按钮实际访问 GitHub，显示 HTTP 404（当前仓库无 Release），离线编辑仍可用。
- 截图和原始探针在本地 `tmp-review/`，不入库。

## 未验证

- 从公共 Release 发现更新、下载、校验、通过系统安装器升级的完整流程，待签名 Secrets 授权和发布。
- 上述覆盖升级由 ADB 安装，不等同于已验证应用内安装器。
- JSON 文件导入、系统文件保存选择器和手机剪贴板已接入，但尚未完成逐项实测。
- 物理 Android 手机、其他 Android/WebView 版本、中文输入法和软键盘完整回归。
- 现有浏览器数据不会自动进入 APK。需在原浏览器导出 JSON，在 APK 导入；以后同包名同签名覆盖升级保留应用数据。


## 公共发布与应用内升级验收（最终）

- 最新正式版：[v3.0.0.3](https://github.com/xjb1337/bingli/releases/tag/v3.0.0.3)。
- 自动发布：[run 41058198838](https://github.com/xjb1337/bingli/actions/runs/41058198838)，Verify source 和 Build signed release and publish 全部成功。
- APK：[bingli.apk](https://github.com/xjb1337/bingli/releases/download/v3.0.0.3/bingli.apk)。本地核验副本 `dist/bingli-3.0.0.3.apk`。
- 清单：[update.json](https://github.com/xjb1337/bingli/releases/download/v3.0.0.3/update.json)。
- 版本 `3.0.0.3` / `300003`，包名 `com.xjb.bingli`，minSdk 26，targetSdk 35。
- APK 大小 1835004 字节；SHA-256 `5cc7fdecb7a27e492e33103330772380694268344ad8e237bad37d37085654a3`。
- 签名证书 SHA-256 `075942a992312f98cbb7c4c3072729d22d9c3846979757c27fe0d3be06e7cdae`，与首轮本地签名一致。
- 对应源提交 `ce0741d46f5e9c5bf52e35af1ba4d7e9e15e41bd`。
- 公共产物验收使用不带凭据的 HTTPS 下载，独立核对 manifest、文件大小、哈希及 apksigner/aapt 输出，不以本机构建代替公共发布。

实际流程：雷电 Android 9 / WebView 91，3.0.0 应用内发现和下载 3.0.0.2，校验后通过系统安装器升级；随后 3.0.0.2 应用内发现并下载 3.0.0.3，再经系统安装器升级到 versionCode 300003。两次均非 adb install 替代应用内安装。无卸载、无清除数据。

升级后保留此前合成中文现病史。Android 系统文件保存器导出 JSON，实际拉取核对姓名 APK-UPGRADE-TEST、中文病史和 schemaVersion 3，均一致。

测试：网页 `npm run verify` 625/625；Android 更新校验 9/9；Android lint 无错误；GitHub Pages `online-check` 7/7。旧线上测试对卡片数量和 current 整份 JSON 的断言已改为验证真实输入字段、草稿指针、分键草稿及病历列表内容，保留刷新恢复验收。

现场发现并修复：部分 Android 9 的归档解析器不返回 SigningInfo，改为同时请求现代与旧签名字段，并在缺失 SigningInfo 时读取旧签名；仍要求唯一证书且与已安装版本相同。首版 v3.0.0.1 已标注被替代预发布，不再推荐。应用名称编码已移入 UTF-8 字符串资源，并有回归测试。

仍未覆盖：物理手机、其他 Android/WebView 版本、完整中文输入法/软键盘回归；原生 JSON 导入和剪贴板尚未逐项验收。上述已完成流程不能代表所有手机兼容性。
