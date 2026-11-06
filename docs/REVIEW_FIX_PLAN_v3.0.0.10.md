# v3.0.0.10 审查修复方案

- 基线：tag `v3.0.0.10`（commit `7a18f5c`）
- 分支：`review-fixes-v3-0-0-10`
- 工作目录：`E:\bingli\.agents\worktrees\review-fixes-v3-0-0-10`
- 用途：交给修复方实施，由审查方按每项的「验收」逐条检查。

---

## 0. 修复前必读

### 0.1 代码结构（改一处常常要改两处）

| 层 | 规范源码 | 说明 |
|---|---|---|
| 领域逻辑（生成、校验、模板、年龄、迁移） | `packages/domain/src/*.ts` | `src/generator.js` 等只是兼容壳，**不要改壳**。`scripts/build-domain.cjs` 把 ts 原样复制到 `packages/domain/dist`，`build.js` 再内联进 Android 单页。ts 文件必须保持 Node 可直接执行的 JS 子集，不能写类型注解。 |
| Android 界面 | `src/app.js`、`src/style.css`、`src/index.html`、`src/action-handlers.js` | 由 `node build.js` 生成 `android/app/src/main/assets/index.html`，该文件不入库。 |
| 网页界面（GitHub Pages） | `apps/web/src/**` | React 18 + Vite。 |
| AI 逻辑 | `src/ai-core.js`、`src/ai.js`（Android），`packages/ai/src/*.ts`、`apps/web/src/components/AiAssistantPanel.tsx`（网页） | **两套实现并存**。凡是改 AI 校验、prompt、脱敏的，两边都要改，并各补测试。 |
| Android 原生 | `android/app/src/main/java/com/xjb/bingli/*.java` | `DeepSeekClient.java` 是 Android 端真正发请求的地方。 |

### 0.2 换行符（必须先处理）

本机 Git 的系统级配置是 `core.autocrlf=true`（来源 `C:/Program Files/Git/etc/gitconfig`）。检出后 `tests/golden/**` 会变成 CRLF，golden、pr8、pr10 测试就会失败。

- 做法：新增 `.gitattributes`，至少写入 `tests/golden/** text eol=lf` 和 `docs/template-alignment/** text eol=lf`。
- 注意：仓库里本来就有 CRLF 文件，例如 `src/app.js` 在索引中就是 CRLF，**不要整仓库统一换行**。改这些文件时保持原有换行，diff 里不能出现整文件重写。
- 验收：`git diff --stat` 中不出现几千行只改换行的文件。

### 0.3 测试命令

```bash
npm ci                      # 网页、ai、storage 的 vitest 和 typecheck 需要
node build.js
npm test                    # 等价于 node --test tests/*.test.cjs
npm run test:web            # packages/ai + apps/web
npm run test:storage
npm run typecheck
cd android && ./gradlew testDebugUnitTest lintDebug   # 有 JDK17/SDK 时
```

在禁止子进程的沙箱里，`node --test` 会报 `spawn EPERM`。这时逐文件运行：
`for f in tests/*.test.cjs; do node --test --test-isolation=none "$f"; done`

**基线（审查方已在本分支实测）**：30 个 `tests/*.test.cjs` 文件全部通过，0 失败。修复后不得有任何回退。

### 0.4 提交规则

- 每个编号单独一个提交，或几个相关编号合成一个提交。提交信息以编号开头，例如 `P0-1: 侧别占位符未改时报错`。
- 每个修复都要补回归测试。测试优先放进已有文件（`tests/*.test.cjs`、`packages/ai/test/*.test.ts`、`apps/web/src/test/*.test.tsx`、`android/app/src/test/...`）；单独新建文件也可以，例如 `tests/review-v3010.test.cjs`。
- 输出文本有意变化时，同步更新 `tests/golden/**`，并在 `docs/template-alignment/GOLDEN_CHANGES.md` 记录改了什么、为什么改。
- 不做无关重构。CSS 大合并、AI 双实现合并不在本轮范围（见 P2）。
- 「⚠ 待用户确认」的条目先不动，等确认后再做。

---

## P0：必须修（临床安全、功能失效、数据丢失）

### P0-1 卒中模板的侧别占位符未改时没有任何提醒

**问题**：卒中模板写入「（患侧）」「（对侧）」「（健侧）」作为占位符。学生不改的话，这些字会原样进入主诉、初步诊断、NIHSS 和出院记录，而 `validate()` 一条提醒都不给。检测函数 `findUnfilledPlaceholders` 已经存在（`packages/domain/src/templates.ts:46-80`），但只有测试在调用它。

**复现**：女，68 岁，神经内科。`TEMPLATES.apply(r,'stroke')` 之后生成：主诉为「突发（患侧）肢体无力…」，诊断为「（对侧）大脑中动脉供血区急性缺血性脑卒中」，`GENERATOR.validate(r)` 不报侧别。

**改法**：
1. 在 `packages/domain/src/generator.ts:3608` 的 `validate(r)` 中，当 `typeof TEMPLATES !== 'undefined' && TEMPLATES.findUnfilledPlaceholders` 时扫描整份 record。排除不会输出的元数据，例如 `meta`、`fieldStates`、`aiProvenance` 等，以实际字段名为准。命中时追加一条：
   `【模板】仍有 N 处侧别占位符（患侧/对侧/健侧）未改成左或右：<字段中文名列表，最多 5 个>。`
2. 在 `WARNING_RULES`（约 `generator.ts:3728` 起）加规则：code `SIDE_PLACEHOLDER_UNFILLED`，document `record`，severity `error`，paths 为命中的路径，action 为「把占位符改成左或右」。由于 paths 是动态的，可以在 `validateStructured` 里单独构造这一条，不必走正则表。
3. 复制或下载正文时，如果存在这条 error，弹确认框：「病历里还有 N 处（患侧/对侧/健侧）没改，确定要复制/下载吗？」。这里只确认，不硬阻断。
   - Android：`src/app.js` 中的 `copyText`、`downloadTxt`（约 3614 行）、`copySection`。
   - 网页：`apps/web/src/pages/OutputStep.tsx` 的复制和下载按钮。
4. 确认 Node 测试环境里 generator 能拿到 TEMPLATES。拿不到时要安全降级，不能抛错。

**验收**：
- 套用 stroke 模板后，`validateStructured` 含 `SIDE_PLACEHOLDER_UNFILLED`，severity 为 `error`。
- 把所有占位符替换成「左」或「右」后，这条消失。
- 其他模板和空病历不出现这条（防误报）。
- golden 测试不受影响。

### P0-2 选 Pro 模型时图片识别必然失败

**问题**：官方[模型与价格页](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)写明 `deepseek-v4-pro` 不支持图像理解，只有 `deepseek-flash` 支持。代码在任何模型下都会附带 `image_url`：
- `android/app/src/main/java/com/xjb/bingli/DeepSeekClient.java:35-45`（请求体在 `:83`）
- `packages/ai/src/transport.ts:52-67`（请求体在 `:161`）

用户选了 Pro 之后，图片识别只会得到「HTTP 400，请检查模型设置」。

**改法**：
1. 请求含图片时，**这一次请求**强制使用 `deepseek-flash`，不修改用户保存的模型设置。Java 和 TS 两边都要改。
2. 在识别面板的模型标签旁显示提示：「图片识别固定使用 Flash（Pro 不支持图片）」。
   - Android：`src/ai.js`（`#aiModel` 附近）。
   - 网页：`AiAssistantPanel.tsx:328` 附近。
3. 采纳记录里的 model 取响应返回的实际模型（现有逻辑已经取 `response.model`），确认显示为 flash。
4. 更新 `docs/DEEPSEEK_2026-10-30.md`、`docs/AI.md`、`README.md` 的「DeepSeek 辅助填写」一节，说明 Pro 不支持图片。

**验收**：
- `DeepSeekClientTest`：model 为 pro 且带图片时，请求体的 `model` 是 `deepseek-flash`；不带图片时仍是 pro。
- `packages/ai/test/transport.test.ts`：同样两个用例。
- 文档已更新。

### P0-3 月经史：女童会被写成「已绝经」，绝经者已填的初潮和绝经年龄被丢掉

**问题**：`packages/domain/src/generator.ts:1159-1165` 的 `buildMenstruation` 在 `applicable === '无'` 时直接返回 `'已绝经。'`，忽略 `age`、`menopauseAge`、`lmp` 等字段。界面上只有「未选/有月经/已绝经」三个选项（`src/app.js:1142-1143`、`apps/web/src/pages/MarriageStep.tsx:75-84`），没有「未初潮」。

**复现**：
- 3 岁女童，选「已绝经」，输出「未婚。已绝经。」，没有警告。她也没有别的选项可选。
- 60 岁女性，初潮 14、绝经年龄 50，选「已绝经」，输出只有「已绝经。」。

**改法**：
1. 给 `menstruation.applicable` 增加取值 `'未初潮'`，同步修改 `packages/domain/src/schema.ts:1588`、`:1605` 的注释和默认值说明，以及 types 和 index.d.ts。
2. `buildMenstruation`：
   - `'未初潮'`：输出 `月经史：未初潮。`。如果 extra 有内容，追加在后面。
   - `'无'`：
     - 有 `age`、`menopauseAge`、`lmp`、`extra` 中的任一项时，按「月经史：初潮14岁，50岁绝经，末次月经…。」成句。
     - 都没有时保持原输出 `已绝经。`，保证 golden 不变。
     - extra 本身含「绝经/停经」的旧分支保留。
3. 两个界面都加上「未初潮」选项。年龄小于 14 岁（`AGE.isChild`）且 applicable 为空时，在卡片上提示「儿童可选『未初潮』」。**不要自动替用户选。**
4. `validate`：年龄小于 14 岁却选了「已绝经」时，提示 `【月经史】患儿 X 岁却写「已绝经」，请核对。`，并在 WARNING_RULES 中登记为 warning。
5. 迁移：旧数据里 `applicable: true/false`（见 `tests/fixtures/legacy/v1-record.json:69`、`v2-record.json:102`）原来怎么映射，现在仍然怎么映射，不能因为新增取值而改变。
6. 如果 AI 识别目录（`packages/ai` 和 `src/ai-core.js` 的 choice 白名单）包含 `menstruation.applicable`，把新取值加进去。

**验收**：
- 3 岁女童选「未初潮」，输出 `月经史：未初潮。`。
- 3 岁女童选「已绝经」，出现 warning。
- 60 岁、初潮 14、绝经 50、选「无」，输出含「初潮14岁」和「50岁绝经」。
- 只选「无」、其他都没填，输出仍为「已绝经。」。
- v1/v2/v3 fixtures 迁移结果不变，golden 全过。

### P0-4 异常生命体征只按成人阈值判断，还漏判舒张压和低体温

**问题**：`packages/domain/src/generator.ts:1371-1387` 的 `abnormalVitalFindings` 只判断四项：T≥37.3、P 不在 60–100、R 不在 12–20、SBP≥140 或 <90。结果写入首次病程 O 段、摘要和诊断依据。由此带来两个问题：
- 儿童的正常值被列为阳性。例如 8 月龄 P130、R35，3 岁 P120。
- 舒张压升高和低体温被漏掉。例如 BP 130/115，或 T 35.0℃。

**改法**：
1. 抽出一个常量表 `VITAL_ABNORMAL_BY_AGE`，注释写明来源。按 `AGE.resolveAge(r)` 选档；年龄未知时按成人处理。
2. 成人（≥14 岁）规则：
   - T ≥37.3 或 <36.0
   - P >100 或 <60
   - R >20 或 <12
   - SBP ≥140 或 <90，或者 DBP ≥90 或 <60。任一项命中就输出整条 BP。
3. 儿童按 AHA PALS（2020）清醒状态参考范围判断（用户已确认，见 D2）：

   | 年龄 | P 正常 | R 正常 | 低血压（SBP 低于） |
   |---|---|---|---|
   | <1 岁 | 100–160 | 30–53 | 70 |
   | 1–<3 岁 | 90–150 | 22–37 | 70 + 2×年龄 |
   | 3–<6 岁 | 80–140 | 20–28 | 70 + 2×年龄 |
   | 6–<12 岁 | 70–120 | 18–25 | 70 + 2×年龄（≥10 岁时取 90） |
   | 12–<14 岁 | 60–100 | 12–20 | 90 |

   儿童高血压要用百分位表判断，本轮**不自动判儿童高血压**。体温规则与成人相同。
4. 只改「是否算异常」的判断，不改生命体征那一行的正文写法。

**验收**：新增以下用例：
- 8 月龄 P130、R35、BP 85/50：不列入 O 段。
- 8 月龄 P180：列入。
- 成人 BP 130/115：列入。
- 成人 T 35.0：列入。
- 成人 P 88、BP 120/80：不列入。

golden 若因此变化，必须在 GOLDEN_CHANGES 中说明。

### P0-5 网页版关闭页面会丢掉最后不到 1 秒的输入

**问题**：`apps/web/src/App.tsx:636-645` 只有 900ms 防抖保存，没有 `pagehide` 或 `visibilitychange` 兜底。Android 版有兜底，见 `src/app.js:4161`、`:4182`。

**改法**：
1. 用 ref 保存最新的 dirty record。
2. 监听 `pagehide`，以及 `visibilitychange` 且 `document.visibilityState === 'hidden'`。触发时清掉防抖定时器，立刻调用 `persistRecord(false)`。
3. IndexedDB 是异步的，这里只能尽力保存。另外可以同步写一份 localStorage 应急副本，下次启动时如果它比库里的更新就恢复。这一步可选；做的话要有测试，并在启动后清理该副本。

**验收**：在 `apps/web/src/test/app.test.tsx` 中修改一个字段，不等 900ms 直接派发 `pagehide`，repository 里应读到新值。

### P0-6 系统回顾「本系统剩余项全部标为阴性」之后页面跳回顶部

**问题**：`src/app.js:3233-3248` 处理完后调用 `render()`。`render()` 末尾 `window.scrollTo({top:0})`（`:2745`），并且整页重建，展开状态全部丢失。用户逐个系统往下点时，每点一次都被甩回顶部。体检的「整组全选」已经处理过同样的问题，见 `src/app.js:3291-3309` 的注释和实现。

**改法**（二选一）：
- A，推荐：只就地刷新当前系统卡片里的症状按钮状态、系统计数和步骤完成状态，然后恢复 `scrollY`。
- B：给 `render` 加参数 `render({ keepScroll: true })`，保留 `scrollY` 和所有 `<details>` 的 open 状态。如果 `rosAllNegative`（`:3405` 起）也会跳顶，一并改掉。

**验收**：
- `tests/app.test.cjs` 新增用例：滚动到某个系统后点 rosneg，`scrollY` 不变，该系统的 details 仍然展开，按钮显示为阴性。
- 已标阳性的症状保持阳性，现有用例覆盖了这一点，不能回退。

### P0-7 Android 返回键总是弹「退出大病历？」

**问题**：`android/app/src/main/java/com/xjb/bingli/MainActivity.java:297-303` 只处理 AI 面板。病历列表、目录、设置页和各种确认框打开时按返回，都直接弹退出确认。

**改法**：
1. 在 `src/app.js` 暴露 `APP.handleBack()`，返回 boolean，按以下顺序处理，处理了就返回 true：
   1. 打开的模态框或确认框：关闭。
   2. 目录弹层：关闭。
   3. AI 面板：沿用现有 `AI_ASSIST.close()`。
   4. 设置页或病历列表：回到编辑页。
   5. 当前步骤不是第一步：回上一步，行为和点「上一步」一样，保存逻辑也一样。
   6. 以上都不满足：返回 false。
2. 原生端的 `evaluateJavascript` 改为调用 `APP.handleBack()`。返回 false 时才 flush 保存并弹退出确认。
3. 当前 Activity 继承 `android.app.Activity`，只依赖 `androidx.core`，所以继续使用 `onBackPressed`，不新增 androidx.activity 依赖。

**验收**：
- `tests/app.test.cjs` 覆盖上面每一种状态下 `APP.handleBack()` 的返回值和效果。
- `tests/android-source.test.cjs` 断言原生代码调用了 `APP.handleBack`。

### P0-8 拍下的病历照片一直留在 App 缓存里

**问题**：`MainActivity.java:100-117` 把照片写进 `cacheDir/camera`，要等下次拍照才删掉。照片里可能有患者身份信息。

**改法**：
1. 抽出 `clearCameraCache()`。
2. 在 `onCreate`、`onDestroy`，以及 `onStop` 且 `chooser == null && cameraUri == null` 时调用它。WebView 读文件是在 chooser 回调之后，**不要**在 `onActivityResult` 里立刻删，否则会读不到文件。
3. 用户取消拍照时（`RESULT_OK` 以外）立即删除那张空文件。

**验收**：通过代码审查确认；`android-source.test.cjs` 加静态断言，确认存在这几个调用点。

---

## P1：应修（正确性、健壮性、易用性）

### 病历逻辑

**P1-1 年龄不校验**
- 问题：
  - `generator.ts:3613` 只检查年龄是否为空。
  - `ageWithUnit`（`generator.ts:259-271`）对任何文本都补「岁」。
  - 主语判断（约 `generator.ts:323`）把 -3 岁判成「患儿」。
- 改法：
  1. `validate`：填了年龄、没有出生日期时，用 `AGE.parseAge` 解析。解析失败、为负数或超过 130 岁时，提示 `【一般项目】年龄「X」无法识别或不合理，请核对。`，并登记为 WARNING_RULES 中的 `AGE_INVALID`（warning）。
  2. `ageWithUnit`：parseAge 失败时原样返回，不补「岁」。
  3. 主语判断：年龄无效时一律用「患者」。
- 验收：`-3`、`abc`、`200` 都会报警告；正文中不出现「abc岁」「-3岁」；`45`、`1岁3个月`、`14日龄` 行为不变。

**P1-2 没有病历号时，PID 用了内部 id**
- 位置：`generator.ts:412-414`，`admissionPid` 在 `recordNo` 为空时回退到 `r.id`。
- 改法：没有病历号时返回空串，由版式输出「／」。
- 影响：`tests/golden/v1-respiratory/dabingli.txt:2` 的 `PID：legacy-v1-respiratory` 会变成 `PID：／`。更新 golden，并在 GOLDEN_CHANGES 中说明。

**P1-3 句尾标点重复**
- 位置：
  - `generator.ts:750`：`if (v.detail) s += '，' + v.detail;`
  - `generator.ts:892`：`allergens.push(p.allergenOther)`
- 改法：两处都先 `stripTail`。顺手 grep `push(p.`、`+ v.` 之类直接拼接用户自由文本的地方，同类问题一并修掉。
- 验收：过敏原填「青霉素。」，输出含「青霉素过敏」，不含「青霉素。过敏」；系统回顾详情填「最高39℃，」，输出不含「，；」或「。，」。

**P1-4 男性「子女数」复用了孕次字段**
- 位置：`generator.ts:1185-1210`。男性界面把子女数存进 `childbirth.gravida`。
- 改法：
  1. 新增字段 `childbirth.children`，schema 和 types 同步。
  2. 男性界面改为写 `children`，Android 和网页都改。
  3. 生成时优先读 `children`，读不到再回退 `gravida`，兼容旧数据。
  4. 性别从女改成男、且 childbirth 中有孕产数据时，toast 提示「请核对婚育史，孕产次不适用于男性」。
- 验收：
  - 男性，`gravida=2, alive=1`，没有 `children`：输出仍为旧行为，保证兼容。
  - 男性，`children=1`：输出「育有子女1人」。
  - 新界面录入后存的是 `children`。

**P1-5 迁移时类型不匹配，数据被静默丢掉**
- 位置：`packages/domain/src/core.ts:57-67` 的 `deepMerge`。默认值是对象、旧值是数组或布尔值时，会产生错误的结构。
- 复现：
  - `diagnosis:['冠心病']` → confirmed 为空。
  - `pmh.diseaseChecks:['高血压']` → 输出「既往患0」。
  - `ros.cardio.palpitation:true` → 当作未问。
  - `pmh.allergy:true` → 输出「／」。
- 改法：
  1. 在 normalize 或迁移入口，`deepMerge` 之前，对已知形态显式转换：
     - `diagnosis` 是数组 → `{ confirmed: arr }`
     - ROS 症状是布尔 true → `{ checked: true, status: 'asked_positive' }`
     - `pmh.allergy` 是布尔 → `'有'`/`'无'`
     - `diseaseChecks`：按 schema 的实际形态转换，修复方先确认它的形态
  2. `deepMerge` 遇到其他「默认是对象、旧值是非对象」的情况时，不要合成错误结构：保留默认值，把原值写进 `migrationNotes`，并存到 `meta.legacyUnmapped[path]`，保证不丢数据。
- 验收：上面 4 个复现都转换正确，或者被记录下来；v1/v2/v3 fixtures 和 compat-freeze 测试不变。

### AI 服务（每一项都要同时改 `packages/ai` 和 `src/ai-core.js`）

**P1-6 识别结果校验是全有或全无，单位解析太窄**
- 位置：
  - `packages/ai/src/core.ts:640-652`（`data.suggestions.map(... validateRecognizeSuggestion)` 中任一条抛错，整份作废）
  - `core.ts:300-313` `normalizeRecognizeValue`
  - `src/ai-core.js:120-124`、`:202-235`
- 改法：
  1. 改为逐条校验。不合规的建议丢掉，记录到 `result.dropped = [{ path, reason }]`；界面在结果区折叠显示「N 条建议因格式问题未采用」及原因。只有 JSON 顶层结构坏了才整体失败。
  2. 数值归一化：去掉千分位和空格，接受 `℃ °C ° 次/分 次/分钟 /min bpm mmHg cm kg 岁 %` 等后缀，然后取完整数字。**不接受** `kPa`、`斤`、`℉` 等需要换算的单位，这类直接丢弃该条并写明原因。
- 验收：一份结果里 1 条不合规、2 条合规时，返回 2 条加 1 条 dropped；`37.8°C`、`45岁`、`98%` 能正确解析。

**P1-7 识别结果的依据检查太弱**
- 位置：`core.ts:585-634`、`ai-core.js:202-231`。允许 evidence 为空，也没有做数字和否定词一致性检查；整理功能里的这类检查在 `core.ts:559-581`。
- 改法：
  1. 来源是粘贴文字时，每条至少 1 个 evidence，并且 quote 必须是原文的子串（现有逻辑已有）。文本字段套用整理功能的数字和否定词一致性检查，不通过就丢弃，计入 dropped。
  2. 来源是图片时，evidence 无法核对，在结果区为每条标注「来自图片，依据未能自动核实」。
  3. prompt 中明确要求 quote 逐字摘录原文。
- 验收：粘贴文字来源下，evidence 为空，或数值与原文不一致的建议被丢弃；图片来源的建议带有标注。

**P1-8 max_tokens 偏小，结束原因判断不准**
- 位置：`DeepSeekClient.java:83`、`:98`，`transport.ts:86-88`、`:163`。
- 改法：
  - 识别请求 `max_tokens: 8192`，其他请求保持 4096。
  - `finish_reason` 处理：
    - `length` → truncated_response，提示文案维持原样
    - `content_filter` → 新错误码 `content_filtered`，提示「内容被服务端安全策略拦截」
    - 其他非 stop → `request_failed`
- 验收：Java 和 TS 都有单测覆盖这三种分支。

**P1-9 识别场景下脱敏几乎不起作用**
- 位置：`core.ts:237-258`、`ai-core.js:36-44`。目前依赖病历里已经填好的姓名；新建空病历时，粘贴文字里的「姓名：张三」会原样发出。
- 改法：增加按标签脱敏，把 `(患者姓名|姓名|病历号|住院号|门诊号|床号|ID号|身份证号?)\s*[:：]\s*[^\s，。；,;]+` 替换成 `$1：[已隐去]`。界面文案保持「会尝试隐去」，并补一句「图片中的信息无法脱敏」（现有文案已有类似说明，核对一致即可）。
- 验收：「姓名：张三 住院号：12345 床号：8」脱敏后三个值都被隐去；「咳嗽3天」不受影响。

**P1-10 提示词长度预算**
- 问题：字段目录约 25K 字符。用户笔记还没到 16000 字的界面上限，总长度就可能超过 42000，用户只看到「资料过长」。
- 改法（二选一）：
  - 界面上的字数上限改为 `42000 - 目录长度 - 余量` 动态计算。
  - 或者压缩目录：去掉重复的 label，用短键，选项值只列一次。压缩目录同时能减少 token 成本，推荐这种。
- 验收：16000 字、含大量换行和引号的笔记，要么能正常发送，要么在发送前给出准确的剩余字数。

**P1-11 Android 桥接错误码**
- 位置：`MainActivity.java:193-209`。
- 改法：payload 的 `JSONException` 返回 `invalid_input`，不要落到 `missing_key`；busy 分支返回 `code: 'busy'`，JS 显示「上一次请求还在进行」。
- 验收：`DeepSeekClientTest` 或桥接测试覆盖这两种情况。

**P1-12 网页版两处小问题**
- `AiAssistantPanel.tsx:545`：「原内容」列改用 `displayAiValue`，与 Android `ai.js:219` 保持一致。
- `transport.ts:71`、`:177`：按流读取响应体，超过 256KiB 就中止，与 Android `readLimited` 一致。

### UI/UX

**P1-13 软键盘弹出时，底栏挡住输入框（Android）**
- 位置：底栏 `src/style.css:1043`（`position:fixed`，高 72px）。
- 改法：`focusin` 到 input、textarea 或 select 时给 body 加 `kbd-open` class 并隐藏 footer，`focusout` 后延迟 100ms 再移除；同时调用 `el.scrollIntoView({ block: 'center' })`。如果 `visualViewport` 可用，可以用它判断键盘是否打开。
- 验收：`tests/app.test.cjs` 断言 focusin 之后 body 有 `kbd-open`，focusout 之后被移除。真机效果由审查方人工验证。

**P1-14 Android 系统回顾三态按钮缺少无障碍信息**
- 位置：`src/app.js:895-907`。
- 改法：每个按钮加 `aria-label="<症状>：未问/阴性/阳性"`，状态变化时同步更新。本轮不改交互方式（单按钮循环切换）。
- 验收：在 `app.test.cjs` 中逐次点击，aria-label 依次变化。

**P1-15 CSS 缺陷**
- `src/style.css:2422`：`var(--accent-soft)` 变量未定义，改为 `var(--primary-soft)`。
- `src/style.css:2431`：`.btn-danger:hover{background:#ffe6e2}` 在深色模式下对比度只有 1.43。在深色模式块（约 3066 行起）里覆盖成 `var(--red-light)`，或者直接改用变量。
- `src/style.css` 约 2240 行的 `.topbar .btn-icon:active{background:#d5efea}`：同样要在深色模式下覆盖。
- `src/style.css:2359-2363`：`:focus{outline:none}` 覆盖了 `2196-2201` 的 `:focus-visible` 样式。删掉 `outline:none`，或者把 focus-visible 规则移到它后面。
- 验收：审查方用对比度脚本复算，并核对规则顺序。

**P1-16 病历列表弹窗**
- 位置：`src/app.js:3841-3853`。
- 改法：`.list-modal` 加 `role="dialog"`、`aria-modal="true"` 和 `aria-labelledby`；空状态只保留一个「新建病历」按钮。

---

## P2：可选（本轮有余力再做，或者单独提 PR）

- **P2-1** 系统回顾的计数和完成判断统一改用 `SCHEMA.rosFactState`。涉及 `src/app.js:845-894`、`:931`、`:2337-2343`，以及 `apps/web/src/pages/RosStep.tsx:186`。
- **P2-2** 空病历输出：首次病程 S 段只有「患者。」（`generator.ts:2286` 附近的 `draftCaseSummary`），以及「／。」这种占位符后面再加句号的情况。
- **P2-3** 当天入院当天出院时，`hospitalDays`（`generator.ts:2621-2628`）返回 0，`generator.ts:2666` 的 `if (days)` 把整行隐藏。按用户确认的口径（D3）：当天出院记 **0 天**，输出「住院天数：0天」。改法：`hospitalDays` 在日期无效或出院早于入院时返回 `null`，同日返回 0；调用处改为 `if (days !== null)`。验收：同日输出「住院天数：0天」；缺出院日期或日期倒置时仍不输出这一行。
- **P2-4** 「1岁3个月」被显示成「1.25岁」（`age.ts formatAge`），改用儿科习惯的写法。
- **P2-5** `peOutputValue` 中 `default_normal_pending_review` 分支会输出默认正常描述。改为不输出，防止以后有人启用这个状态时把没核对过的「正常」写进病历。
- **P2-6** `style.css` 三层样式叠加，深色模式块有三套。合并这些规则；把写死 10–11px 的小字改成 `calc(12px * var(--fs-scale))`；移动端去掉 `background-attachment:fixed`。单独提 PR。
- **P2-7** AI 双实现合并：由 `packages/ai` 生成 `src/ai-core.js`，或者至少两边共用一组 JSON 测试样例。单独提 PR。

---

## 用户已确认的决定（2026-11-06）

- **D1：签名行移到系统回顾之后。** 现状：`generator.ts:2871` 把 `ADMISSION_CONSENT` 接在家族史后面，而 `SECTION_ORDER`（`:2711-2714`）中系统回顾排在体格检查之后。
  - 改法：有系统回顾正文时（`:2866-2867` 的 `ros` 非空），签名行接在系统回顾末尾，家族史后面不再出现签名行；没有系统回顾时，仍然接在家族史后面。全文只出现一次签名行。
  - Android 和网页的预览、分段复制（copySection）、文档 IR（`buildDocumentIR`）中，签名行的位置都要一致。
  - 更新 golden，并在 GOLDEN_CHANGES 中说明。
  - 验收：有系统回顾时，签名行是系统回顾这一节的最后一行，而且全文只出现 1 次；没有系统回顾时，位置不变。
- **D2：儿童阈值采用 P0-4 表中的 PALS 值。** 按表实现，不再需要「先只做成人」的过渡方案。
- **D3：当天入院当天出院记 0 天**，并显示「住院天数：0天」，见 P2-3。P2-3 因此从可选升为**应修**。

---

## 审查方验收流程

1. `git log v3.0.0.10..HEAD`：检查每个编号是否都有对应提交。
2. 全量测试：30 个 `tests/*.test.cjs`、`test:web`、`test:storage`、`typecheck`，与基线对比，不允许回退。
3. 逐条运行本文的「复现」用例，核对输出。
4. 逐个看 diff：
   - 两套 AI 实现是否同步修改；
   - 没有整文件换行变化；
   - 没有无关改动；
   - golden 变化是否都写进了 GOLDEN_CHANGES。
5. 需要真机或截图的项（P0-6、P0-7、P1-13、P1-15）由审查方构建 APK 或网页后人工验证。
