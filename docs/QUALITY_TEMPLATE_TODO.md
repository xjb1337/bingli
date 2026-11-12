# 病历质量规则与医院模板待核对清单

> 状态：已取得温州市人民医院“入院记录”模板结构照片，**仅大病历（入院记录）标为 `verified: true` / “已对照”**；首次病程录、出院记录及教学病例模板尚未取得完整医院模板，仍标为 `verified: false` / “待医院模板核对”。
>
> 医院模板到位后，应按本表逐项核对。标记为“文案”的条目应先确认医院用词，再决定是否改 golden；不得为了消除提示而静默放宽医学规则。

## 第 3 批：完善入院记录模板复核结论

本节及第 6 节描述本轮生效规则；历史 ROS 辅助函数只保留兼容用途，不代表仍有系统回顾表单或输出。

- **原本已一致**：入院记录文书标题；主诉、现病史、既往史、个人史、婚育史、家族史的先后；既往史各独立存储字段；生命体征、通用和专科查体数据；已有检查的日期、机构、检查号；初步诊断编号；患者病史确认签名。首次病程录、出院记录的既有结构不在本批改变。
- **本轮修改**：基本信息改为姓名、性别、年龄、科别、床号、住院号、民族、出生地、婚姻、职业、入院日期、记录日期、病史陈述者、病史可靠程度逐行；不再另加 PID 眉栏。出生日期、籍贯及联系方式仍可在补充资料编辑、存储和备份，不作为入院记录固定项目输出。
- 现病史一般情况统一为独立缩进的“起病来，…”段，提示神志、精神、饮食、睡眠、大小便、体重；伴发疾病另起缩进段。不替未问诊的患者补正常结论。
- 既往史首行总述及疾病史、传染病史、预防接种史、过敏史、手术史、外伤史、输血史、中毒史、长期用药、与本病相关病史按模板排列；未填固定项用“／”。表单示范采用医院否认史措辞，教学胰腺炎模板更新一般情况、中毒史和预防接种史用语。
- 查体拆为独立“体格检查（一）”和“体格检查（二）：补充及专科情况”。（一）首行生命体征，其后各系统逐行；外生殖器与直肠肛门分行；胸部下分肺、心；未查项目用“／”，不回填阴性事实。
- 检查拆为“实验室检查”“特殊检查”两个一级节。App/网页均支持每条检查选择分类；未指定的旧条目按项目名分类，无法判断归实验室，病理纳入特殊检查；机构、日期、检查号、结果及箭头均保留。
- **系统回顾已按确认取消**：不在表单入口、导航、预览、TXT 或病历检查要求中出现；两份 AI 内核的识别/整理白名单都排除 `ros.*`。旧 `ros` 原样留在记录与 JSON 备份，包括布尔值、旧状态及未知扩展属性；不再迁移成新事实、不删除、不输出。
- **兼容性**：保持 schemaVersion 3、存储键、Android 包名与 WebView origin；检查分类是可选字段，无需破坏性升级。旧整段既往史映射到 `pmh.diseaseDetail` 并保留原文副本；旧检查数组/文本转换为可编辑条目，未知结果不丢弃。见《数据迁移说明》及 `tests/hospital-admission.test.cjs`、存储迁移测试。
- **仍有差异/待确认**：预览以【】和“一般项目”容器突出章节，TXT 为纯文本而非医院 Word 表格/分页版式；未采集项目显示“／”，不会像完整示例那样预填全部阴性所见；既往史/查体表单仍按便于录入的卡片组织，而导出顺序严格按模板。首次病程录、出院记录及全部病种教学范例尚未取得对应医院模板，继续标记待核对。本轮不自动补齐示例患者事实或改写旧患者原文。
- **隐私**：新增示例 `tests/fixtures/template-alignment/hospital-fictional-2040.json` 和旧结构样本 `legacy-v2-merged.json` 均为完全虚构；不保存医院原件及真实身份、日期、号码。

## 1. 现病史字段、界面与生成顺序

文件/函数：`packages/domain/src/schema.ts` / `emptyRecord()`；`packages/domain/src/generator.ts` / `buildHPI()`、`normalizeCause()`、`negativeHistoryText()`、`subjectOf()`；`apps/web/src/pages/HpiStep.tsx`；`src/app.js` / `renderHpi()`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| `hpi` 字段顺序暂定：`onset → cause → symptoms → aggravating → relief → evolution → accompanying → negativeDiscriminating → negativePertinent → treatment → generalCondition → extra`。 | 按院内现病史段落及录入字段顺序调整；确认新旧阴性字段是否合并。 |
| 新增字段 `aggravating`、`negativePertinent` 均为可选、默认空串；旧字段 `cause`、`relief`、`negativeDiscriminating` 原样保留。 | 确认是否保留两个阴性字段；若合并，需设计无损迁移并保留旧存档显示。 |
| 生成主体顺序暂定：起病 → 诱因 → 主要症状 → 加重因素 → 缓解因素 → 进展 → 伴随症状 → 阴性鉴别病史 → 诊治经过。 | 核对院内模板是否把“加重/缓解”并入主要症状特点，或把阴性鉴别放在伴随症状之前。 |
| 一般情况、`pmh.otherTreatDiseases`、`hpi.extra` 放在主体后的尾段；顺序暂定为一般情况 → 其他需治疗疾病 → 补充。 | 核对院内“一般情况”“其他疾病”“补充”的段落位置及是否另起一行。 |
| 新字段界面文案暂定：“加重因素”“缓解因素”“有鉴别诊断意义的阴性病史”；旧界面和 React 界面都把阴性项写入 `hpi.negativeDiscriminating`。 | 核对医院字段名称、必填/选填标识及是否单独设置 `negativePertinent` 输入项。 |
| 界面占位文案暂定：诱因“受凉后 / 无明显诱因”；加重“进食后腹痛加重”；缓解“休息后腹痛稍缓解”；阴性“无咯血、盗汗、消瘦”。 | 改为院内示范文案或删除，避免暗示学生照抄非患者事实。 |
| `normalizeCause()` 对以“后”结尾的短语补“起病”（如“受凉后”→“受凉后起病”）；对“无明显诱因/无诱因/无明显原因/诱因不明”原样保留；其他短语不擅自补谓词。 | 核对院内是否接受短语式诱因、是否统一写“无明显诱因”。 |
| `negativeHistoryText()` 先输出旧 `negativeDiscriminating`，再输出新 `negativePertinent`，按原文顺序、仅去掉完全相同的整段文本，用中文逗号连接。 | 确认新旧字段重复时的合并优先级和标点。 |
| 主语按年龄决定：无法判龄或 ≥14 岁用“患者”，<14 岁用“患儿”；不以科室决定。 | 核对儿科是否使用“患儿”“患儿家属代诉”，以及新生儿/婴儿称谓。 |
| 现病史主体用中文逗号连成连贯叙述；用户原文中的句号保留为断句；最终每句补“。”。 | 核对院内是否要求一句一行、每字段一句或固定分段。 |

## 2. 文档中间表示与句段装配

文件/函数：`packages/domain/src/generator/document-ir.ts` / `assembleClinicalNarrative()`、`normalizeNegationScope()`、`isBareTimeFragment()`、`mergeIntoHistory()`（生成器内）；`packages/domain/src/generator.ts` / `buildDocumentIR()`、`buildDocumentBundle()`、`dedupeRecordFields()`、`dedupeHistorySections()`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| IR 事实至少含 `path/text/polarity/state/source/reviewed/evidence`；`path` 是主定位，`paths` 兼容旧 UI，`evidence[]` 保存原文及来源。 | 核对院内是否要求事实级来源、审阅人和审阅时间；是否需绑定病历行号。 |
| 大病历 IR 按医院入院记录模板生成；空系统回顾、空专项评估以及不属于模板的摘要、诊断依据不生成章节。首次病程录和出院记录由各自的分段函数生成，三者共用 `documentFromSections()` 与 `renderDocument()`。 | 已按入院记录模板照片核对大病历标题、眉栏和章节顺序；首次病程录、出院记录仍待完整医院模板核对。 |
| 纯时间分句识别正则暂定为：`^(约|大约|近|距今|迄今)?[0-9０-９一二三四五六七八九十百千万两半十几数余]+(个)?(天|日|周|星期|月|年|小时|分钟|h|min)(余|多|来|左右|之后|以后|前|以前)?$`。命中时从病史主体移除；若只剩该分句，现病史可整体为空。 | 用院内真实起病句回归；确认“3天”“3天前”“3天余”及英文单位是否都应视为残句。 |
| 否定词触发表暂定为：`无|未见|未出现|未诉|否认|没有|不伴|无明显|未曾|未`，只在分句开头判断否定作用域。 | 核对院内常用否定词（如“未闻及”“未触及”“阴性”）是否需区分症状与体征。 |
| 否定范围修正的阳性转折词暂定为：`加重|加剧|缓解|好转|减轻|恶化|出现|发生|伴有|伴|再发|复发|增多|减少|持续|反复|转为|变为`；只在顿号/逗号列表中、前项为否定且后项含转折词时改为分号。 | 用院内阳性病程写法扩充/收紧词表；确认“无发热、咳嗽”是否仍应继承否定。 |
| 跨字段句段去重按“极性 + 去标点后的文本”判断；完全重复才删；同一字段内重复保留并提示；阳性“胸痛”和阴性“无胸痛”不互相覆盖。 | 核对院内是否允许同一事实在现病史和伴随症状重复；确认矛盾事实应提示还是保留两处。 |
| `mergeIntoHistory()` 对已出现整句相同且极性相同的文本去重；顿号/逗号列表逐项去重；含分号的复合句不拆；否定列表去重后仍保留否定前缀。 | 用院内现病史样例复核；尤其核对“无A、B”与“无A；B加重”的语义边界。 |
| 全病历跨字段去重只处理病史类字段中的完整句子，同栏重复保留，近似重复不合并。 | 确认院内是否允许多栏引用同一句诊断依据，以及是否需要改为提示而不自动删。 |
| 标点暂定：生成短语用“，”，独立清单/分句用“；”，段末补“。”；记录章节标题用【】；编号文书使用“一、二……”。 | 按院内模板逐项核对中英文标点、空格、编号层级和段末句号。 |

## 3. ROS 与查体事实状态

文件/函数：`packages/domain/src/schema.ts` / `FACT_STATES`、`normalizeFactState()`、`rosFactState()`、`peChecked()`、`peFactState()`、`inferPeFactState()`；`packages/domain/src/generator.ts` / `collectROS()`、`buildROS()`、`peEntries()`、`peOutputValue()`、`buildPE()`、`factStateDiagnostics()`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| 状态值暂定为 `asked_positive`、`asked_negative`、`not_asked`、`default_normal_pending_review`、`manual_text`；同时接受连字符写法。 | 核对院内是否需要“患者拒答”“无法获得资料”“家属代诉”等独立状态。 |
| ROS 显式 `status`/`factState` 优先，旧 `checked`/`negative` 仅回退；均无则 `not_asked`。 | 确认旧勾选数据的迁移优先级及是否存在“已问不详”状态。 |
| 旧 ROS 仅原样存储、备份；所有状态均不进入入院记录，兼容辅助函数仍可读取。 | 已确认系统回顾不需要；不得恢复表单或导出。 |
| 查体未勾选或显式 `not_asked` 不输出；已勾且空白或规范正常文本才补 `peNormalText()`；显式 `asked_positive` 但无详情时留空并提示。 | 核对院内默认正常体检语是否允许自动补入，以及是否要求逐项写明“未查”。 |
| `peChecked()` 回退顺序：显式状态 → 明确勾/取消 → 已填写文字 → 专科默认未勾 → 父项子项默认未勾 → 其他未勾。 | 与院内纸质查体表核对“未查”和“正常”的表达方式。 |
| 查体事实状态同时接受 `peFactStates[组][项]` 的字符串或 `{state/status}`；旧的 `pe.checked` 与手写值继续兼容。 | 确认医院系统是否使用独立状态字段；必要时补迁移和导出映射。 |
| ROS 冲突提醒已停用；查体未查却有值是 `PE_FACT_STATE_CONFLICT`（`warning`，`peFactStates.<组>.<项>`）；阳性无详情是 `PE_POSITIVE_DETAIL_MISSING`（`warning`，`pe.<组>.<项>`）。 | 与院内质控分级核对；确认路径是否指向 UI 可编辑字段。 |

## 4. 生命体征单一来源与一致性

文件/函数：`packages/domain/src/generator.ts` / `vitalValue()`、`vitalNum()`、`vitalSnapshot()`、`buildVitals()`、`abnormalVitalFindings()`、`buildSummary()`、`draftObjectivePE()`、`vitalConsistencyDiagnostics()`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| 统一字段：`temperature`、`pulse`、`respiration`、`sbp`、`dbp`、`height`、`weight`、`headCirc`、`chestCirc`、`abdCirc`；生命体征、查体、摘要、SOAP 都只从 `vitalSnapshot()` 取有效值。 | 核对医院要求的生命体征项目、小数位、单位和是否包含头/胸/腹围。 |
| 可信范围暂定：T 34–43℃、P 20–250 次/分、R 5–80 次/分、SBP 50–300、DBP 20–200、身高 30–250cm、体重 1–300kg、腹围 20–200cm、头围 20–70cm、胸围 20–120cm；超出仅提示，生成时按“／”留空。 | 用院内成人/儿科/新生儿范围替换；为不同年龄段建立范围表。 |
| 异常阈值暂定：T ≥37.3℃；P >100 或 <60；R >20 或 <12；SBP ≥140 或 <90。 | 核对医院成人/儿科发热、心动过速、呼吸急促和低血压标准。 |
| 输出格式暂定：`T ℃，P 次/分，R 次/分，BP /mmHg，身高 cm，体重 kg`；缺失值用全角“／”；头/胸/腹围仅在填写时追加。 | 核对院内首行生命体征格式、空格、单位缩写及缺失符号。 |
| 一致性检查上下文暂定为：生命体征段、查体段、摘要、SOAP；检查 T/P/R 标量及 BP 收缩/舒张值，不一致均产生 `VITAL_CROSS_DOCUMENT_MISMATCH`（`warning`）。 | 核对是否还需检查身高/体重/头围/腹围、重复出现的同一指标及院内模板的其他数值位置。 |
| 血压另检查 SBP ≤ DBP 的可疑倒置（提示 `VITAL_RANGE`）；心率和听诊“心率”数字不一致仍由既有 `PE_CONFLICT` 路径提示。 | 核对院内“心率”与“脉搏”是否为同一数值，以及房颤等特殊情形的例外。 |

## 5. Typed diagnostics 协议

文件/函数：`packages/domain/src/quality/diagnostics.ts` / `create()`、`fromWarning()`、`isDiagnostic()`、`assertValid()`；`packages/domain/src/generator.ts` / `diagnostic()`、`validateStructured()`、`warningMeta()`、`qualityDiagnostics()`；`packages/domain/src/depth.ts` / `typedRule()`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| 每条提醒必须含非空 `code`、`severity`（仅 `error`/`warning`/`info`）、`path`、`message`；`paths[0]` 必须等于 `path`；证据为 `{path,text,source?}`。 | 与院内质控系统字段对齐；确认是否需“规则版本”“患者安全级别”“整改建议”等字段。 |
| `validate()` 继续返回字符串兼容旧调用，`validateStructured()` 才输出诊断对象；未命中规则表的旧提示回退为 `GENERAL_QUALITY`（`info`，按【章节】推断路径）。 | 盘点所有院内提示，禁止长期依赖回退代码；为每条医院规则分配稳定 code。 |
| 现病史诊断代码暂定：`HPI_BARE_TIME_FRAGMENT`、`HPI_NEGATION_SCOPE`、`HPI_DUPLICATE_FRAGMENT`，均为 `warning`，分别定位 `hpi.<字段>`。 | 与院内质控 severity、规则名称和定位字段核对。 |
| ROS/查体/生命体征代码见第 3、4 节；文书过期代码为 `DOC_STALE_SUMMARY`、`DOC_STALE_SOAP`、`DOC_STALE_DISCHARGE`；首次病程鉴别自查为 `SOAP_DIFF_UNRELATED`。 | 核对院内“内容过期”是否属于 error、是否允许携带旧值。 |
| 深度自查严重度映射暂定：`high → error`、`mid → warning`、`low → info`；每条提醒都要有 `path` 和至少一条带 path 的 evidence。 | 按院内质控分级重新映射；确认证据路径是否可用于跳转。 |

### 5.1 深度自查逐条规则

文件/函数：`packages/domain/src/depth.ts` / `RULE_META`、各 `check*()`、`typedRule()`。

| 代码 / 规则函数 | 当前路径 | severity | 当前阈值、词表或文案选择 | 医院模板核对点 |
|---|---|---|---|---|
| `DEPTH_SYMPTOM_QUANTIFICATION` / `checkSymptoms()` | `hpi.symptoms` | 主诉含该症状为 `error`，否则 `warning` | 呕吐：次数、呕吐物性状；黑便：次数/量、性状；呕血：量、颜色；腹痛：持续/阵发；腹泻：次数、性状；发热：体温/热型；咳嗽：干湿、昼夜节律 | 用院内问诊清单替换症状词表和必填维度 |
| `DEPTH_NEGATIVE_MISSING` / `checkNegative()` | `hpi.negativeDiscriminating` | `error` | 阴性症状词表 35 项；在现病史 8 字内未找到否定词+词表词时提示；已有 `negativeDiscriminating` 或 `negativePertinent` 不提示 | 核对医院要求必问的阴性症状清单 |
| `DEPTH_CHRONIC_MEDS` / `checkChronic()` | `pmh.longTermMeds` | `error` | 慢病词表 14 项；无长期用药且详情不含“药/服用/口服/用药/治疗/控制”时提示 | 核对慢病清单、用药字段和“无需用药”表达 |
| `DEPTH_CHRONIC_CONTROL` / `checkChronic()` | `pmh.longTermMeds` | `warning` | 有用药但无“控制/监测/平稳/达标/良好/欠佳/不佳/正常”时提示 | 核对控制目标、监测值和院内术语 |
| `DEPTH_SURGERY_DETAIL` / `checkSurgery()` | `pmh.surgery` | `error` | 缺年份（4 位或中文数字+年）、机构关键字（医院/卫生院/保健院/中心/诊所）、术式关键字（术/切除/修补/吻合/置换/结扎/探查/引流/固定/方式）分别提示 | 核对院内手术史必填项和“否认手术史”写法 |
| `DEPTH_ANTITHROMBOTIC` / `checkAntithrombotic()` | `pmh.longTermMeds` | `warning` | 风险词：冠心病/脑卒中/心力衰竭、房颤/心房颤动/支架/起搏器/瓣膜/换瓣；抗栓词：阿司匹林/氯吡格雷/替格瑞洛/华法林/利伐沙班/达比加群/抗凝/抗血小板/双抗；提示“术前停 5–7 天或低分子肝素桥接” | 核对院内围术期抗栓规则及是否允许在病历中写通用 5–7 天 |
| `DEPTH_DURATION_MISMATCH` / `checkDurationMatch()` | `basic.chiefComplaint` | `warning` | 主诉与现病史时长差 ≤1 天或 ≤30% 不提示；时间单位按年 365 天、月 30 天、周 7 天换算 | 核对主诉/现病史时长不一致的容忍度和换算口径 |
| `DEPTH_ONSET_TRACE` / `checkOnsetTrace()` | `hpi.onset` | `error` | 主诉 ≤30 天、现病史另有 ≥60 天且至少 4 倍更长时提示；年→365、月→30、周→7 | 核对“完整病程”的追溯规则和长期症状例外 |
| `DEPTH_AMBIGUOUS_DATE` / `checkAmbiguousDate()` | `hpi.onset` | `info` | 裸“13 日”及以上（排除“10月14日”“14日前/余/来/左右/内”）提示歧义 | 按医院日期书写规范核对“日”与“号”的用法 |
| `DEPTH_AUX_HOSPITAL` / `checkAuxHospital()` | `auxiliary.items` | `warning` | 所有有名称的检查都没有机构时提示；只要一家有机构则不提示 | 核对是否每项检查都必须写机构/检查号/日期 |
| `DEPTH_AUX_GRADE` / `checkAuxGrade()` | `auxiliary.items` | `warning` | 乳腺/BI-RADS、甲状腺/TI-RADS、胃镜/十二指肠镜/Forrest 分期词表；全组无分级时提示 | 核对院内报告必须抄录的分级体系 |
| `DEPTH_MENSTRUAL` / `checkMenstrual()` | `menstruation.lmp` | `warning` | 女性 ≥14 岁、主诉/诊断含乳腺/乳房/甲状腺相关词、`applicable !== false`、未填 lmp/绝经年龄/月经年龄时提示 | 核对乳腺/甲状腺患者月经史是否必问及年龄下限 |
| `DEPTH_PEDIATRIC_PERSONAL` / `checkPediatric()` | `personal.birth` | `error` | 年龄 <14 岁且出生、喂养、生长发育三栏均空时提示 | 核对儿科个人史字段和年龄边界 |
| `DEPTH_ALLERGY_MISSED` / `checkMissedHistory()` | `pmh.allergy` | `warning` | 既往史有任一内容但过敏史为空时提示 | 核对药物/食物过敏是否为必填及“无过敏”写法 |
| `DEPTH_INFECTION_MISSED` / `checkMissedHistory()` | `pmh.infection` | `info` | 既往史有任一内容但传染病史为空时提示 | 核对乙肝、结核、HIV 等院内必问项 |
| `DEPTH_INTERNAL` / `check()` 异常兜底 | `record` | `info` | 任一规则抛异常时生成“这一项自查没能跑完…请忽略”，不崩溃页面 | 核对院内是否要求记录规则错误/上报审计 |

### 5.2 既有字符串质控规则的结构化映射

文件/函数：`packages/domain/src/generator.ts` / `WARNING_RULES`、`warningMeta()`。

下表逐条列出当前 code、severity 和主路径。医院模板到位后应核对院内质控分级、可定位字段、提示文案及是否需要拆成更细的路径。

| code | severity | 主路径 | 当前规则/备注 |
|---|---|---|---|
| `NAME_MISSING` | error | `basic.name` | 缺少姓名 |
| `GENDER_MISSING` | error | `basic.gender` | 缺少性别 |
| `AGE_MISSING` | error | `basic.age` | 缺少年龄；路径列表同时含 `basic.birthDate` |
| `AGE_BIRTHDATE_MISMATCH` | warning | `basic.age` | 年龄与出生日期不一致 |
| `CHIEF_COMPLAINT_MISSING` | error | `basic.chiefComplaint` | 主诉未填 |
| `CHIEF_COMPLAINT_TOO_LONG` | warning | `basic.chiefComplaint` | 主诉超过 20 字提示 |
| `CHIEF_COMPLAINT_DIAGNOSIS_WORD` | warning | `basic.chiefComplaint` | 主诉疑似含诊断词 |
| `CHIEF_COMPLAINT_DURATION_MISSING` | warning | `basic.chiefComplaint` | 主诉缺持续时间 |
| `HPI_MISSING` | error | `hpi` | 现病史未填 |
| `ROS_UNTOUCHED` / `ROS_FACT_STATE_CONFLICT` | 已停用 | 旧 `ros` | 系统回顾不再是入院记录要求 |
| `MARITAL_MISSING` | warning | `basic.marital` | 婚姻史空白 |
| `MARITAL_CONFLICT` | warning | `basic.marital` | 婚姻状态两处不一致 |
| `PERSONAL_MISSING` | warning | `personal` | 个人史未填 |
| `ALLERGY_CONFLICT` | warning | `pmh.allergy` | 过敏史与具体过敏原冲突 |
| `SMOKING_CONFLICT` | warning | `personal.smoking` | 吸烟状态与数量冲突 |
| `DRINKING_CONFLICT` | warning | `personal.drinking` | 饮酒状态与数量冲突 |
| `PE_MISSING` | warning | `pe` | 未录入异常体征或生命体征 |
| `PE_CONFLICT` | warning | `pe` | 查体描述冲突/未写入 |
| `VITAL_RANGE` | warning | `pe.vitals` | 生命体征非法、超范围或 SBP≤DBP |
| `DATE_INVALID` | warning | `basic.admitDate` | 日期格式、真实性或先后顺序问题 |
| `DEPT_AGE_MISMATCH` | warning | `basic.department` | 科室与年龄不匹配；14 岁为当前边界 |
| `HISTORY_LATERALITY` | warning | `hpi` | 左右侧肢体无力同时出现 |
| `HISTORY_POLARITY_CONFLICT` | warning | `hpi` | 同一症状同时出现有/无 |
| `HISTORY_CAUSE_CONFLICT` | warning | `hpi.onset` | 起病写无明显诱因但另填诱因 |
| `HISTORY_PROGRESS_CONFLICT` | warning | `hpi.evolution` | 进展与“同前”等时间表达冲突 |
| `HISTORY_DURATION_CHECK` | warning | `hpi` | 主诉病程与现病史时间需核对 |
| `HISTORY_DUPLICATE` | warning | `hpi` | 同一栏内重复 |
| `HISTORY_DUPLICATE_ACROSS` | warning | `hpi` | 跨栏目重复 |
| `AUX_MISSING` | warning | `auxiliary.items` | 现病史提到检查但辅助检查为空 |
| `AUX_DATE_INVALID` | warning | `auxiliary.items` | 检查日期无法识别 |
| `AUX_DATE_ORDER` | warning | `auxiliary.items` | 检查日期非时间顺序 |
| `DIAGNOSIS_MISSING` | error | `diagnosis.confirmed` | 初步诊断未填 |
| `DIAGNOSIS_PENDING_HINT` | warning | `diagnosis.confirmed` | 待查诊断缺候选病名 |
| `DIAGNOSIS_ORDER` | warning | `diagnosis.confirmed` | 首条是待查类诊断 |
| `DIAGNOSIS_QUESTION_MARK_EN` | warning | `diagnosis.confirmed` | 用了英文问号 |
| `DIAGNOSIS_QUESTION_MARK_POSITION` | warning | `diagnosis.confirmed` | 问号不在病名末尾 |
| `DIAGNOSIS_SIGNATURE_MISSING` | warning | `diagnosis.signature` | 缺医师签名 |
| `SUMMARY_DRAFT` | info | `summary` | 摘要仍是自动初稿 |
| `SOAP_DIFF_MISSING` | warning | `soap.a.diff` | 首次病程鉴别诊断未填 |
| `SOAP_PLAN_MISSING` | warning | `soap.p.perDiagnosis` | 诊疗计划未按诊断列出 |
| `SOAP_DIFF_UNRELATED` | warning | `soap.a.diff` | 鉴别与现有诊断关联不明确 |
| `DISCHARGE_STATUS_MISSING` | warning | `discharge.dischargeStatus` | 出院情况未填 |
| `DISCHARGE_DATE_MISSING` | warning | `discharge.dischargeDate` | 出院日期未填 |
| `DISCHARGE_ADVICE_MISSING` | warning | `discharge.advice` | 出院医嘱整组或部分缺项（两个正则共用此 code） |
| `DISCHARGE_DX_MISSING` | warning | `discharge.diagnoses` | 出院诊断未填 |
| `DISCHARGE_DX_UNCONFIRMED` | warning | `discharge.diagnoses` | 出院诊断已填但未确认 |

## 6. 三份文书的结构、标题与固定文案

文件/函数：`packages/domain/src/generator.ts` / `SECTION_ORDER`、`generate()`、`firstCourseDocumentParts()`、`dischargeDocumentParts()`、`buildDocumentIR()`；渲染：`packages/domain/src/generator/document-ir.ts` / `renderRecord()`、`renderNumbered()`。

| 文书 | 当前章节顺序 | 当前固定文案/占位与待核对项 |
|---|---|---|
| 大病历（入院记录） | `【入院记录】 → 一般项目 → 主诉 → 现病史 → 既往史 → 个人史 → 婚育史 → 家族史 → 体格检查（一） → 体格检查（二）：补充及专科情况 → 实验室检查 → 特殊检查 → 初步诊断` | 按完善模板复核：基本信息逐行；一般情况“起病来，…”及伴发疾病段缩进；既往史固定项目保留空位；家族史后附患者签名确认行；查体及检查各拆成两个一级节。系统回顾不显示/不导出，旧值仅存储备份；摘要、诊断依据不进入入院记录，仍供首次病程使用。 |
| 首次病程录 | `一、病历特点（S） → 二、客观记录（O） → 三、诊断依据（A） → 四、鉴别诊断（A） → 五、诊疗计划（P）` | 前缀`【首次病程录】`（有记录时间则追加时间）；O 段固定“1. 体格检查：…”“2. 辅助检查：…”；A 段按诊断列①病史②体检③辅助检查；P 段按诊断列检查/治疗；核对医院首次病程录是否必须用 S/O/A/P 或另有“病例特点/拟诊讨论/诊疗计划”标题。 |
| 出院记录 | `一、一般情况 → 二、入院情况 → 三、诊疗经过 → 四、出院情况 → 五、出院诊断 → 六、出院医嘱` | 前缀`【出院记录】`；一般情况含姓名/性别/年龄/病历号/入院日期/出院日期/住院天数；出院医嘱四类：药物、非药物、生活指导、复诊时间；核对医院是否要求“入院诊断/出院诊断/医师签名/出院带药清单/复诊预约”等额外章节。 |

固定占位及文案（均需医院模板核对）：

- 入院情况空：“（待补充：入院时主要症状、体征与入院诊断）”
- 诊疗经过空：“（待补充：住院期间病情变化、检查结果、治疗经过及效果）”
- 出院情况空：“（待补充：出院时主要症状、体征、辅助检查结果）”
- 出院诊断空：“（待补充：出院诊断未填写；如与初步诊断一致，请使用「从初步诊断带入」后核对确认）”
- 出院医嘱空：“（待补充：药物、非药物治疗、生活指导、复诊时间）”
- 首次病程录各段也有“（待补充：…）”占位；住院天数按日期差、仅大于 0 时显示。

## 7. 模板来源与核对状态

文件/函数：`packages/domain/src/templates.ts` / `normalizeTemplate()`、`listByDept()`、`get()`、`all()`、`apply()`；`packages/domain/src/generator.ts` / `DOCUMENT_TEMPLATES`；`apps/web/src/pages/BasicStep.tsx`；`src/app.js` / 模板卡片；`packages/domain/src/template-data.ts`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| 无 `source` 的模板统一补 `source = { kind:'textbook-template', label:'教学模板', note:'依据《诊断学》常见病典型表现整理，尚未与医院正式病历模板核对。' }`。 | 换成医院正式来源、版本号、科室、发布日期和责任人。 |
| 所有教学病例模板 `verified` 默认为 `false`，`verificationStatus='unverified'`，`verificationLabel='待医院模板核对'`；只有源数据显式 `verified:true` 才显示“已核对”。 | 由医院逐份签署确认；确认是否允许默认 verified、是否需要双人核对。 |
| `source` 原对象保持原样，核对状态不写入 `source`，分别放在模板顶层。 | 若医院模板数据规范要求来源对象包含版本/核对字段，需做结构迁移。 |
| `lungNodule` 的院内范例来源保留为 `hospital-example / 院内范例 / 肺结节病历截图...`，但仍显示未核对。 | 核对院内范例截图对应的版本和授权；确认能否作为正式模板。 |
| 模板套用只填空位，逐字段记录 `source:'template', reviewed:false, sourceRef:模板 key`；患者录入模式只返回提纲，不写入事实。 | 核对院内模板是否允许“只填空位”、是否需要复制后强制人工审阅。 |
| 界面展示来源说明和“待医院模板核对”；模板正文不会自动成为患者事实或诊断。 | 核对医院对模板使用、版权、患者安全和审计留痕的要求。 |

文书模板核对状态（`GENERATOR.DOCUMENT_TEMPLATES`）：

- `入院记录`：`verified: true`、`verificationStatus: 'verified'`、`verificationLabel: '已对照'`；来源为 `hospital-template / 温州市人民医院入院记录模板（2026-10 照片）`。
- `首次病程录`、`出院记录`：`verified: false`、`verificationStatus: 'unverified'`、`verificationLabel: '待医院模板核对'`。

## 8. HINTS、诊断与数据兼容边界

文件/函数：`packages/domain/src/hints.ts` / `HINTS.analyze()`；`packages/domain/src/generator.ts` / `diffRelatedToDiagnosis()`、诊断生成；`packages/domain/src/schema.ts` / `emptyRecord()`；`packages/domain/src/migrations/`。

| 当前选择（必须复核） | 医院模板到位后的核对动作 |
|---|---|
| HINTS 只读记录并返回参考建议，不修改 `record`，不写 `diagnosis.confirmed`，不进入三份文书正文。 | 医院若要求诊断辅助，必须新增显式“采纳”动作并记录来源/审阅人。 |
| 新字段 `aggravating`、`negativePertinent`、`peFactStates` 均为可选；旧字段缺失时由 generator 按空值/旧勾选回退，不提升迁移版本。 | 医院模板到位后如改变字段含义，应新增 v4 迁移并保留 v1/v2/v3 可读。 |
| 未知字段、模板字段和旧自由文本保持原样；不得自动拆解旧 `hpi.treatment` 或写入虚构事实。 | 核对医院导入导出字段映射和未知字段保留白名单。 |
| 当前测试数据全部为合成数据；golden 只作为现有行为基线，不因模板未到位而重写。 | 医院审核后再决定 golden 是否需要新基线；任何 golden 变化都要逐文件说明原因。 |

## 9. 回归覆盖对照

| 验收点 | 测试位置 |
|---|---|
| 现病史分别记录诱因、缓解、加重、阴性鉴别 | `tests/pr5-quality.test.cjs` / `PR5-01` |
| 裸时间残句、否定范围、重复残句/片段 | `tests/pr5-quality.test.cjs` / `PR5-02`–`PR5-04`；`tests/new-behavior.test.cjs` / `A09` |
| ROS 未问不生成“无”，查体未勾不生成正常 | `tests/pr5-quality.test.cjs` / `PR5-05`–`PR5-06` |
| 生命体征四处一致及跨文书不一致定位 | `tests/pr5-quality.test.cjs` / `PR5-07` |
| 三份文书 IR/章节顺序 | `tests/pr5-quality.test.cjs` / `PR5-08` |
| typed diagnostics 协议、全部深度 code、自查/过期提醒 | `tests/pr5-quality.test.cjs` / `PR5-09`–`PR5-11` |
| 模板来源/核对待核对状态 | `tests/pr5-quality.test.cjs` / `PR5-12` |
| HINTS 只读、不写诊断 | `tests/pr5-quality.test.cjs` / `PR5-13` |
| Web 窄屏、44px 触控、诊断定位、模板提示 | `apps/web/src/test/app.test.tsx` |

> 医院模板到位后，建议先按本表核对并更新 `docs/QUALITY_TEMPLATE_TODO.md`，再补/改 golden；不要用“重新生成全部 golden”代替逐条医学确认。
