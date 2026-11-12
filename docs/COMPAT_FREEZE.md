# 兼容性冻结基线（PR0）

本文件冻结大病历生成器 v3.0.0.8 的兼容性边界。PR0 只增加测试、合成样本和文档，不修改
`src/` 与 `android/` 的行为。以后拆分领域模型、重做 UI、迁移 IndexedDB 或升级 Android
原生迁移器时，以下内容必须继续成立；如需改变，必须先评审并给出旧数据迁移方案。

第 3 批模板对齐增量：入院记录文本版式按完善医院模板更新，黄金样本仅更新
`dabingli.txt`；首次病程录、出院记录基线不变。schemaVersion 仍为 3，检查分类为
可选字段，旧辅助检查列表保留，未知分类可见且默认归实验室；旧 `ros` 原样参与存储
和 JSON 备份，但不显示、不导出为病历正文，也不再要求补问。冻结的六份旧 JSON fixture、
包名、签名、origin、存储键和 Android 原生迁移协议均不变。详细映射见《数据迁移说明》。

## 一、不可变更的运行时约束

### 1. Android 包名、签名与 WebView 来源

| 项目 | 冻结值 | 代码位置 |
|---|---|---|
| Android applicationId | `com.xjb.bingli` | `android/app/build.gradle` |
| Android namespace | `com.xjb.bingli` | `android/app/build.gradle` |
| WebView origin | `https://appassets.androidplatform.net` | `MainActivity.java` 的 `ORIGIN` |
| 网页入口路径 | `/assets/index.html` | `MainActivity.java` |
| 页面内存储 | 该固定 origin 下的 localStorage | WebView DOM storage |

`MainActivity` 只接受上述 origin 与 `/assets/index.html`，其他请求返回 403，外部 URL 不交给
WebView 继续加载。浏览器 localStorage 按 origin 隔离；**改变 origin 等于换一套空存储**，
旧病历不会自动出现在新 origin 下。因此 Android 端 origin 必须保持
`https://appassets.androidplatform.net`，不能在普通升级中改用 `file://`、`localhost` 或
任何新的域名。若未来确实需要迁移 origin，必须先实现 PR4 的暂存、校验、事务和回滚迁移器，
不能在切换 origin 后再尝试读取旧数据。

`applicationId` 同时决定 Android 包名、应用数据目录和 `FileProvider` authority
（`${applicationId}.files`）。改包名会被 Android 视为另一个应用，覆盖安装会失败，本机病历
也不会自动继承。正式安装包必须继续使用 `com.xjb.bingli`。

### 2. localStorage 键名

记录结构已升级到 `schemaVersion: 3`，但存储键名从 v1 起一直沿用，不能因结构升级改名：

| 常量 | 值 | 含义 |
|---|---|---|
| `STORAGE_KEYS.list` | `dabingli.records.v1` | 病历列表快照 |
| `STORAGE_KEYS.current` | `dabingli.current.v1` | 只保存 `{ id, at }` 指针；旧版整份病历会被迁移到草稿键 |
| `STORAGE_KEYS.draftPrefix` | `dabingli.draft.v1.` | 每份病历草稿的键前缀，完整键为 `dabingli.draft.v1.<id>` |
| `STORAGE_KEYS.settings` | `dabingli.settings.v1` | 阅读模式、字号、上次步骤等设置 |

`dabingli.current.v1` 不再存整份病历。读取到旧版整份病历对象时，现有代码会把它规范化后写入
`dabingli.draft.v1.<id>`，再把 `current` 改成指针；返回 `migrated: true`。损坏的 current
原文或列表原文不得被自动写入覆盖，界面应允许用户原样导出后再决定。

### 3. 模板数量与科室归属

模板总数冻结为 **57**。科室表共有 14 项：13 个有模板的专科，加上 `general`（通用/全科）。
通用科刻意没有模板。各科数量如下，`tests/compat-freeze.test.cjs` 以字面量逐项锁定：

| 科室键 | 科室名 | 模板数 |
|---|---|---:|
| `general` | 通用/全科 | 0 |
| `respiratory` | 呼吸内科 | 6 |
| `digestive` | 消化内科 | 6 |
| `cardiology` | 心血管内科 | 5 |
| `endocrinology` | 内分泌科 | 5 |
| `nephrology` | 肾内科 | 5 |
| `hematology` | 血液内科 | 3 |
| `neurology` | 神经内科 | 5 |
| `surgery` | 外科（普外/骨科等） | 7 |
| `obstetrics` | 产科 | 3 |
| `gynecology` | 妇科 | 3 |
| `pediatrics` | 儿科 | 3 |
| `emergency` | 急诊/ICU | 3 |
| `psychiatry` | 精神科 | 3 |

合计 57。模板的 `dept` 必须属于上表，且每份模板只能出现在自己科室的 `listByDept()` 结果中。

### 4. `update.json` 清单

更新清单自身的 `schemaVersion` 固定为 **1**，与病历数据的 `schemaVersion: 3` 是两套独立版本。
发布脚本生成下列字段：

| 字段 | 约束 |
|---|---|
| `schemaVersion` | 必须为 `1` |
| `applicationId` | 必须为 `com.xjb.bingli` |
| `versionCode` | 正整数；必须高于本机版本和最新已发布版本 |
| `versionName` | 必须与 APK 内版本名完全一致 |
| `minSdk` | 必须不高于当前设备 SDK，当前发布基线为 26 |
| `apkAssetName` | 当前为 `bingli.apk` |
| `apkSizeBytes` | 1 至 100 MiB；下载后实际大小必须完全一致 |
| `apkSha256` | 64 位十六进制；下载后实际 SHA-256 必须完全一致 |
| `signingCertSha256` | 64 位十六进制；必须等于本机已安装证书及下载 APK 的证书 |
| `commitSha` | 候选发布对应的源码提交 |
| `publishedAt` | 发布时间（元数据） |
| `releaseNotes` | 更新提示文字（元数据） |

`UpdateManager` 只从 `https://github.com/xjb1337/bingli/releases/download/` 下的 Release asset
读取 APK；拒绝 draft/prerelease，要求文件名唯一，使用 HTTPS，限制重定向次数，拒绝降级。
下载前后同时校验大小、SHA-256、包名、版本号、版本名和唯一签名证书。校验通过后仍由 Android
系统安装器要求用户确认，不允许静默安装。

### 5. 签名证书与发布检查

- 现有发布记录中的固定签名证书 SHA-256 为
  `075942a992312f98cbb7c4c3072729d22d9c3846979757c27fe0d3be06e7cdae`。实际流水线以
  GitHub Secret `ANDROID_EXPECTED_CERT_SHA256` 为准；两者不一致时必须停止发布，不能重新生成
  使用新证书。
- `.github/workflows/release.yml` 在发布前要求 5 项签名 Secret，构建后执行
  `apksigner verify --print-certs-pem`，再由 `scripts/release/certificate-sha256.py` 确认
  只有一张唯一证书，并与 `ANDROID_EXPECTED_CERT_SHA256` 比较。
- `scripts/release/generate-update-json.sh` 通过 `aapt dump badging` 读取 APK 包名、
  `versionCode`、`versionName` 和 `minSdk`，逐项与发布参数比较；通过 `apksigner` 读取证书并
  写入 `update.json`。包名参数固定为 `com.xjb.bingli`。
- `UpdateManager` 在发现更新时比较“本机已安装证书”和 manifest 的
  `signingCertSha256`；下载后又比较“本机证书”和“归档 APK 证书”，并要求 APK 包名等于
  `BuildConfig.APPLICATION_ID`、`versionCode` 严格增大、版本名一致。任何一项不符都删除下载
  文件并拒绝安装。
- 发布流程还要求候选提交仍是 `origin/main` 当前头、候选 `versionCode` 高于最新 Release 的
  `update.json`、候选 tag 不存在，并在发布前再次检查 main 头。当前仓库版本的主工作流仍同时
  响应 main push 与 `workflow_dispatch`；PR8 才收紧为仅手动触发和环境审批。无论触发方式如何，
  包名、证书、版本和 `update.json` 校验不能放宽。

## 二、历史格式与迁移基线

合成样本全部位于 `tests/fixtures/legacy/`，姓名均为“测试患者甲～己”，不含真实患者数据：

| 样本 | 外形 | 数据版本 | 说明 |
|---|---|---:|---|
| `v1-record.json` | 单份病历 | 1 | 早期结构；无 v3 的 `documentMeta`，科室使用中文名，年龄/主诉时长为数字 |
| `v1-backup.json` | `{ records: [...] }` 备份包 | 1 | v1 包装格式；儿科样本 |
| `v2-record.json` | 单份病历 | 2 | v2 的 `summary` / `soap` / `discharge` 旧位置；无 v3 元数据 |
| `v2-backup.json` | `{ records: [...] }` 备份包 | 2 | v2 包装格式；神经内科样本 |
| `v3-record.json` | 单份病历 | 3 | 当前完整结构，含 `meta`、`documentMeta`、旧文书与固定日期 |
| `v3-backup.json` | `{ records: [...] }` 备份包 | 3 | 当前包装格式，带 `includesDraft: true` 标记 |

`v1-record.json` 与 `v1-backup.json` 故意各有未知字段 `legacyUnknown`，前者还带有
`basic.legacyBasicTag`，用于锁定“未知旧字段不能丢”。这些字段在迁移后应逐字保留，并在字段
来源中标记为 `legacy`。

现有迁移边界（`src/core.js`）：

- `RECORD_CORE.SCHEMA_VERSION = 3`；`schemaVersion > 3` 明确拒绝，旧版本或缺少版本的记录补结构。
- v1/v2 记录迁移后写入 `meta.migratedFrom` 和 `meta.migrationNotes`；当前版本为 3。
- 未识别的额外对象/字段由 `deepMerge` 原样保留；现有旧字段不因结构补齐而删除。
- 旧摘要、首次病程录的 S / O / 诊断依据、出院入院情况和出院诊断保留原文，对应
  `documentMeta.*.origin = 'legacy'`，不自动视为已核对；旧出院诊断的
  `confirmed` 为 `false`。
- 旧字段有内容但没有来源记录时，`meta.fieldStates[path].source = 'legacy'`；不伪造模板来源或
  生成指纹。
- 婚姻状态 `basic.marital` 与 `marriage.status` 一致时统一到基本情况；不一致时两值都保留在
  `meta.conflicts.marriage`，由用户选择，不能静默选一个。
- 中文科室名、简称和大小写变体归一化；未知科室回退 `general`。年龄和主诉时长数字转为字符串，
  诊断列表去空并 trim；空辅助检查补一行可编辑空行。
- 旧版 `current` 槽存整份病历的格式迁移为 `dabingli.draft.v1.<id>` 草稿加指针。

`tests/compat-freeze.test.cjs` 会逐份导入六个样本并检查上述关键字段、文书原文、未知字段和迁移
标记；还会把 v1/v2 单份病历放进旧 current 槽，验证草稿键迁移。

## 三、文本黄金样本

`tests/golden/` 保存三个代表病历（v1 呼吸内科、v2 消化内科、v3 产科）的三种文书：

- `dabingli.txt`：`GENERATOR.generate(record).text` 的大病历全文；
- `first-course.txt`：`GENERATOR.buildFirstCourseRecord(record, { date })` 的首次病程录；
- `discharge.txt`：`GENERATOR.buildDischargeRecord(record)` 的出院记录。

样本使用固定的入院日期、记录日期、出院日期和首次病程录时间，因此不依赖运行当天日期、时区或
用户设置。`tests/golden.test.cjs` 逐字比较，不做空白或换行归一化。正常测试命令：

```bash
node --test tests/golden.test.cjs
```

只有在差异已经人工评审并确认是预期变化后，才可重新生成：

```bash
UPDATE_GOLDEN=1 node --test tests/golden.test.cjs
```

重新生成后必须人工查看三份文书的 diff；不能用更新黄金样本掩盖生成器的回归。

## 四、迁移与覆盖安装验收清单

以下清单用于当前基线和后续 PR；PR0 本身不构建、签名或发布 APK。

### 数据与导入

- [ ] `tests/fixtures/legacy/` 的 v1/v2/v3 单病历和备份包全部可通过 `parseImport`。
- [ ] 导入后 `schemaVersion` 为 3，v1/v2 的 `meta.migratedFrom` 正确，v3 不被误标为迁移。
- [ ] 姓名、性别、年龄、科室、主诉、现病史、诊断、体征、辅助检查、三类旧文书原文逐项保留。
- [ ] `legacyUnknown` 与 `basic.legacyBasicTag` 等未知旧字段逐字保留，不因迁移删除或改名。
- [ ] 旧摘要/SOAP/出院文字的 `origin` 为 `legacy`，旧出院诊断未被自动确认。
- [ ] 旧版整份 current 槽迁移后，数据在 `dabingli.draft.v1.<id>`，current 只是指针。
- [ ] 损坏的 current、列表或导入 JSON 不会被静默覆盖；原始字符串仍可供用户导出。
- [ ] 合并导入在列表损坏时整单不写；替换全部必须用户明确确认，不能隐式执行。
- [ ] 覆盖升级前先导出 JSON 备份；升级后再次导出，记录数量、ID、姓名、主诉、诊断和文书内容一致。

### 覆盖安装

- [ ] 使用同一 `applicationId` `com.xjb.bingli`、同一签名证书覆盖安装，不卸载、不清除应用数据。
- [ ] 覆盖安装前后 WebView origin 都是 `https://appassets.androidplatform.net`。
- [ ] 升级后仍能读取 `dabingli.records.v1`、`dabingli.current.v1`、对应 draft 键和
  `dabingli.settings.v1`，不出现“列表为空但旧数据仍在别处”的假成功。
- [ ] 旧病历可打开、编辑、生成三种文书并再次保存；导出的 JSON 仍是当前 v3 包装格式。
- [ ] 失败路径保留原始数据：迁移失败时进入恢复/导出界面，不能用空记录覆盖旧键。
- [ ] 重装、清除应用数据或更换签名证书不算覆盖安装；这些操作会丢数据或无法升级，必须另行告知。

### 发布与自动更新

- [ ] `update.json` 的 `schemaVersion` 为 1，`applicationId` 为 `com.xjb.bingli`。
- [ ] `versionCode` 严格大于本机版本和最新 Release；不支持降级。
- [ ] `apkSizeBytes`、`apkSha256`、`apkAssetName` 与实际 Release asset 完全一致。
- [ ] `signingCertSha256` 与已安装应用和候选 APK 的唯一证书完全一致。
- [ ] `versionName`、`minSdk`、包名、目标架构和 APK 可解析性通过发布脚本检查。
- [ ] 应用内更新只接受 HTTPS 和指定 GitHub Release 下载前缀；系统安装器仍需用户确认。
- [ ] 更新后本机病历数量、ID 和关键字段与更新前一致，并可用导出 JSON 复核。

## 五、v4 及以后的数据保留规则

1. **Android origin 保持 `https://appassets.androidplatform.net`。** 新 UI、Cloudflare/网页端或
   Android 原生迁移器不得直接在普通升级中更换 WebView origin。需要换 origin 时，先完成旧 origin
   的暂存、哈希、事务、回滚和失败导出设计。
2. **未知旧字段逐字保留。** v4 规范化不得删除、改名、压平或重新推断未知字段；嵌套对象里的未知
   键也必须保留。当前 `deepMerge` 的“保留额外键”行为是兼容性保证，后续重构需有同样测试。
3. **旧字段不能因为新模型没有对应位置而静默丢弃。** 无法映射的字段进入保留区并标记来源，至少
   可导出原文。
4. **升级失败不覆盖旧数据。** v4 迁移必须先读旧键、验证、写暂存、校验后再提交；失败时保留旧键
   并提供原始备份导出。
5. **已弃用字段清单必须在实现 v4 前填写完整。** 每一项都要有旧路径、替代路径、迁移规则、何时
   可删除以及测试样本；未列入清单的字段按“未知旧字段”保留。当前占位如下：

| 旧字段路径 | 原因 | v4 处理 | 替代字段 | 可删除条件 | 测试样本 |
|---|---|---|---|---|---|
| 待填（v4 设计评审时补齐） | 待填 | 待填 | 待填 | 待填 | 待填 |

6. 每次新增历史格式，都增加 `tests/fixtures/legacy/` 样本、兼容性断言，并在人工评审后更新黄金
   样本；不得只更新黄金样本而跳过迁移字段检查。
