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
作为回滚来源。替换导入会先写入可恢复的替换前副本。Service Worker 与 AI 助手不在本 PR 范围内。

存储边界位于 `@dabingli/storage`；旧 localStorage 适配器只作为迁移输入和测试回退。
