# 大病历 Web UI

React 18 + TypeScript + Vite 工作区，业务逻辑统一来自 `@dabingli/domain`。

```bash
npm run dev:web
npm run test:web
npm run build:web
```

Vite 默认以 `/bingli/` 为发布基路径；部署到其他路径时设置 `VITE_BASE`，例如：

```bash
VITE_BASE=/ npm run build:web
```

病历、当前草稿和设置保存在 IndexedDB（Dexie）。首次启动时，如果旧的
`dabingli.records.v1`、`dabingli.current.v1`、`dabingli.draft.v1.<id>` 和
`dabingli.settings.v1` 存在且新数据库为空，会通过 `@dabingli/domain` 迁移并保留旧键，
作为回滚来源。替换导入会先写入可恢复的替换前副本。AI 助手由 `@dabingli/ai` 提供，
DeepSeek 密钥在 Web 版只保留于当前页面内存；Android 版使用原生 Keystore，网页拿不到密钥。
生产构建会生成 Service Worker，首次打开后预缓存全部页面和懒加载块，支持断网刷新与继续使用。
发布只通过手动触发的 GitHub Pages 工作流完成；基路径、更新策略、Android 边界和数据迁移见
[`docs/PAGES.md`](../../docs/PAGES.md)。

存储边界位于 `@dabingli/storage`；旧 localStorage 适配器只作为迁移输入和测试回退。
