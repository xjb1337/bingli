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

本阶段使用兼容旧版的 `localStorage` 键：
`dabingli.records.v1`、`dabingli.current.v1`、`dabingli.draft.v1.<id>` 和
`dabingli.settings.v1`。索引数据库、Service Worker 与 AI 助手不在本 PR 范围内。
