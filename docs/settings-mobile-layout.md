# 设置页移动端布局取证与验证

基线：`a36f0e3`，分支 `feat/fix-settings-mobile-ui`。没有修改版本号，没有执行 Gradle、APK 构建、推送或发版。

## 实际 APK 入口

- `android/app/build.gradle:42` 注册 `buildWeb` 执行仓库根目录的 `node build.js`，第 44 行接到 `preBuild`。
- `build.js:18` 从 legacy `src/` 读取源码，第 19–20 行输出到 `android/app/src/main/assets/index.html`；第 54–62 行读取并内联 app.js/style.css/index.html。
- `MainActivity.java:148` 将请求映射到 assets/index.html，第 160 行加载该页面。
- `apps/web` 独立构建到 `apps/web/dist`，不在上述 APK 打包链中。因此本次修复 legacy 入口，未修改 React 设置页；仍运行其测试、构建和类型检查。

## 根因证据与修复

以下“基线行号”用 `git show a36f0e3:<文件> | nl -ba` 核对；其他行号是修改后位置。MainActivity.java 路径为 `android/app/src/main/java/com/xjb/bingli/MainActivity.java`。

### 顶部：安全区归属不明确

基线 `MainActivity.java:35–38` 给原生根布局加四边 inset padding，却原样 `return insets`，使子 WebView 仍可收到相同 insets。基线 `src/style.css:2222` 又给 topbar 添加 `12px + env(safe-area-inset-top)`；`src/index.html:5` 启用 viewport-fit=cover。Activity 没有显式设置 decor fitting，也没有 fitsSystemWindows 或 CSS 安全区归属标记。主题为 NoActionBar，未发现另一个标题栏占位。

**已证实的是多层处理安全区、缺少消费/归属契约；仅凭截图不能证明 Mate 80 Pro 上究竟哪两层重复，或精确重建约 40 CSS px 的数值。** 普通 Chromium 的 env 顶部为零，基线 topbar padding 为 12px，未复现真机顶部空白。

修复 `MainActivity.java:40–49`：显式关闭 decor fitting，由根布局对系统栏、挖孔和键盘的联合 insets 取逐边最大值，设置 padding 后返回 CONSUMED。`src/index.html:10` 首帧前添加 native-insets 类；`src/style.css:1893–1898` 和第 2229 行使 APK 的 CSS 不再重复计入安全区，浏览器继续使用 env()。所有安全区消费者（含底栏和弹层）统一读这两个变量，未修改 AI 功能逻辑。

CSS 模拟非零安全区（顶部 48px、底部 24px）时，浏览器 topbar/main 底部为 60px/44px，Android 桥接模拟入口为 12px/20px。这验证归属和 CSS 级联，**不验证实际 Android 状态栏、挖孔或 IME 分发**。

### 底部：隐藏底栏后仍保留占位

基线 `src/style.css:2130` 隐藏设置页 footer，第 2736 行却仍给 main 保留 `--footer-height + --safe-bottom + 30px`，第 1894 行定义 footer height 为 72px。末卡片还继承 `.card` 的 14px 底 margin（第 2299 行）。390px/100% 的基线实测：main 底 padding **102px**，末卡片边框至文档末尾 **116px = 72 + 30 + 14**，safe-bottom 为零。

修复 `src/style.css:2140`、第 2743 行，只保留 `20px + 尚未处理的安全区`；第 2153 行移除卡片 margin，第 2144 行用 14px grid gap 统一卡片间距。48 组实测末卡片至文档末尾均为 **20px**。内容不足一屏时，剩余视口背景仍自然可见，不人为拉长页面。

### 滚动条：未证实存在内层设置滚动容器

`src/index.html:40` 的 main#content 直接位于 body；`src/app.js:2634` 的 settings-page 直接包裹三个设置 section。样式中 body/main/settings-page 没有固定 height、min-height:100vh/100dvh 或 overflow:auto/scroll。

基线 390px 实测三个容器 overflow 均为 visible、min-height 为 0、max-height 为 none；内层滚动容器 **0**。不能把截图的滚动条直接认定为 CSS 嵌套滚动根因，也没有用隐藏滚动条的方式掩盖现象。

保持自然文档滚动，增加祖先容器 CSS 断言与浏览器量测。修复后 48 组滚动到底均为 document.scrollTop > 0、main.scrollTop/settings-page.scrollTop 为 0，最后卡片下方仅余 20px。真机仍需区分 WebView 自带文档滚动指示条与当前代码中未复现的 OEM 行为；单张长截图无法判定。

### 字号控件与按钮行

基线 `src/style.css:487` 的 `.btn-mini { margin-left:auto }` 同时作用于 A−/A＋，字号容器又是铺满行宽的 flex。390px 实测两个按钮左 margin 约 **80.77px/80.75px**，导致百分比不能自然居中。

`src/style.css:2160–2162` 改为三列 grid，按钮宽 48px，局部重置 margin，两个间隔固定 8px。第 2166–2170 行改为等宽、可收缩的按钮列，当前病历导出占整行，长文字与环境信息允许换行；第 3045 行在窄屏且放大字号时改为单列。标题区允许换行、卡片标题间距收紧，卡片统一间隔 14px。业务行为不变。

## 自动验证

| 命令/检查 | 结果 |
| --- | --- |
| `node build.js && npm test` | 通过，35 个测试文件通过，含新增 legacy 布局/打包/安全区契约测试及字号操作回归 |
| `npm run test:web` | 通过，packages/ai 47 项、apps/web 54 项 |
| `npm run build:web` | 通过 |
| `npm run typecheck` | 通过，domain/ai/storage/web |
| `git diff --check` | 通过 |
| 已连接 Chromium + Playwright 离线排版量测 | 48 组通过，无 JS 页面异常 |

量测使用实际构建的完整 APK HTML，通过请求拦截提供内容，不是 jsdom 或手工复刻页面。未安装/下载浏览器。本地 Chrome 因 socket 操作被沙箱拒绝，HTTP 服务也因 PermissionError 无法监听；改用已连接浏览器完成。该浏览器不支持 CDP Emulation.setSafeAreaInsets，因此非零安全区只做上述 CSS 默认值模拟。

48 组：浏览器/Android 桥接模拟 × 360/390/430px × 80/90/100/110/120/130/140% + 恢复默认 100%。检查横向越界、scrollWidth/clientWidth 裁切、按钮至少 44px、卡片 gap 14px、字号 gap 8px、文档独立滚动及返回病历后底栏恢复。legacy 行为测试另验证字号上下限、默认字号恢复后的存储和 CSS 变量，以及病历未被字号操作改写。

逐组证据：[量测 JSON](settings-mobile-layout-results.json)。截图中的 Android 桥接与版本是测试桩，不代表构建/运行过新 APK：

- [390px / 100%](screenshots/settings-mobile/w390-font100.png)
- [360px / 140%](screenshots/settings-mobile/w360-font140.png)

生成供已有 Playwright page 执行的离线探针：

```sh
node build.js
mkdir -p tmp-review
node tools/verify-settings-layout.cjs tmp-review/settings-layout-browser.js
```

将生成文件交给已有 browser_run_code 工具；或在已有 Playwright 中 `require('./tools/verify-settings-layout.cjs')(page, html)`。生成的临时函数包含本地 HTML，不提交该文件；生成步骤不安装浏览器、不监听端口。

## 人工复核与未验证项

在允许监听的本地环境启动 legacy 页面：

```sh
cd /workspace/bingli
node build.js
python3 -m http.server 8765 --bind 127.0.0.1 --directory android/app/src/main/assets
```

打开 `http://127.0.0.1:8765/index.html`，点击“设置”。不要用 npm run dev:web 验收 APK 入口，那会启动另一个 React 应用。

- 360/390/430px，字号到 80%/140% 再恢复默认：检查卡片、按钮和中文完整；在卡片上滑动应移动整份文档；到底后末卡片后约 20px（浏览器有安全区时另加安全区）。
- Mate 80 Pro 及不同 Android API：首次打开、旋转、恢复应用后，标题位于状态栏/挖孔下方且不再重复留白；三键/手势导航不遮按钮。
- 真机观察右侧滚动指示条；可调试 WebView 中对照 document.scrollingElement.scrollTop、main/settings-page.scrollTop，确认是否与浏览器一致。
- 返回录入页，弹出/收起键盘，检查底栏、目录和弹层仍位于安全区内。原生归属修复影响共用 WebView 边界，需要这项人工回归。
- 未运行 Android/Gradle 编译或 instrumentation，未构建 APK；Android 二进制编译及 Huawei WebView 实际 insets 分发未验证。CSS 模拟和 Chromium 量测不能替代这些检查。
