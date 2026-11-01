# @dabingli/storage

浏览器存储边界。Web 应用使用 `createIndexedDbRepository()`；Dexie 数据库按
`records`、`drafts`、`current`、`settings`、`meta` 分表，记录与草稿写入、删除、导入和
恢复均通过单个 IndexedDB 事务完成。

## 迁移与回滚

- 首次初始化时只读扫描旧 localStorage 键；只有 IndexedDB 数据为空才迁移。
- 旧记录先经过 `@dabingli/domain` 的 `normalizeRecord`，未知字段原样保留。
- 迁移成功后写 `meta.browserLegacyMigration`；旧 localStorage 从不修改或删除。
- 任一旧记录损坏时，迁移在写入事务前失败，IndexedDB 与 localStorage 均保持原样。

## 导入导出

- `exportBackup()` 在单个只读事务中同时读取病历列表、当前草稿和设置，使用旧版
  `{ app, schemaVersion, exportedAt, records }` 格式输出。
- `importBackup(raw, 'merge' | 'replace')` 先完成整包解析和校验，再开启写入事务。
- 替换导入在清空旧数据前，将原列表、所有草稿、当前指针和设置写入 `meta` 恢复副本。
- `listRecoveryCopies()` 与 `restoreRecovery(id)` 提供恢复入口。
