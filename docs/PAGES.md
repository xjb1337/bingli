# GitHub Pages 离线网页

网页版发布地址为 <https://xjb1337.github.io/bingli/>，Vite 基路径固定为
`/bingli/`。它只生成静态文件，不使用服务端运行时。

## 构建与检查

```bash
npm ci
npm run build:domain
npx vite build apps/web
node --test tests/pr7-offline.test.cjs
```

产物位于 `apps/web/dist`。构建会同时生成 `sw.js`，其缓存名由本次资源列表计算，
格式为 `bingli-pages-<hash>`。

## 离线行为

- 首次在线打开后，Service Worker 会预缓存入口 HTML、`./`、CSS、JavaScript 以及所有懒加载页面块。
- 页面导航采用网络优先，断网时回退到已缓存的 `index.html`；同源静态资源采用缓存优先。
- 新建、编辑、保存、导入导出和三份文书生成均使用本机 IndexedDB 与本地领域代码，断网可继续使用。
- Service Worker 只处理同源 GET 请求。`https://api.deepseek.com` 等跨域请求不会被拦截或缓存，AI 功能仍需联网。
- 页面不加载外部字体、CDN 或第三方脚本。DeepSeek 是唯一的显式外部业务请求。
- Service Worker 只在生产构建的 HTTPS 页面或本地调试地址注册，作用域为 `/bingli/`。

## 更新与版本

每次静态构建都会按完整预缓存列表生成新缓存名。新 Service Worker 安装时重新预缓存当前构建，
激活时只删除 `bingli-pages-` 前缀下不是当前版本的旧缓存，不会清理同源下其他应用的缓存。
发布新版本后刷新页面即可获取新入口；已打开的旧页面建议在更新提示或重新加载后继续使用。

`sw.js` 本身不进入预缓存，避免浏览器长期使用旧缓存清单。浏览器仍按自身策略检查脚本更新。

## 手动发布

发布是手动动作，不会因推送 `main` 自动发生：

1. 在 GitHub 仓库的 **Actions → Deploy GitHub Pages → Run workflow** 中选择目标分支并运行。
2. 工作流依次执行 `npm ci`、`npm run build:domain`、`npx vite build apps/web`，再上传 `apps/web/dist`。
3. 仓库 Pages 的 Source 应设置为 **GitHub Actions**。

工作流仅支持 `workflow_dispatch`，权限限定为 `pages: write` 和 `id-token: write`。Android APK
发布继续使用独立的 `release.yml`，两者互不触发。

## Android 与数据迁移

Android APK 继续使用内置 `assets/index.html`，不会注册网页 Service Worker。注册守卫会排除
`appassets.androidplatform.net`、`file:` 以及存在 `AndroidBridge` / `BingliAndroid` 的 WebView，
因此 Android 离线机制和现有数据目录不受影响。

网页和 Android 是两套独立的本机存储，不会自动同步。需要迁移时，在网页“设置”或“病历列表”中导出
JSON，再在 Android 中选择导入；反向迁移同理。API Key 不包含在 JSON 中，需要分别在两端配置。
