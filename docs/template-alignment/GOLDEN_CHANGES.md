# PR10 golden 变更说明（仅入院记录/大病历）

模板来源：温州市人民医院入院记录模板（2026-10 照片）。这是一份去标识化的结构说明，仓库中不含照片。入院记录模板状态：`verified:true`，显示“已对照”。首次病程录和出院记录模板未改动，仍为 `verified:false`，显示“待医院模板核对”。

## 变更的快照
| 文件 | 原因 |
|---|---|
| tests/golden/v1-respiratory/dabingli.txt | 入院记录模板对齐（见下方通用变更）。系统回顾有内容，所以保留。 |
| tests/golden/v2-digestive/dabingli.txt | 同上；系统回顾有内容，保留。 |
| tests/golden/v3-obstetrics/dabingli.txt | 同上。系统回顾为空（原先输出“／”），按“可选空节不打印”的规则不再输出。原【月经与生育史】并入【婚育史】。尿蛋白定量归入“实验室检查”，B超归入“特殊检查”。 |

## 通用变更（三份入院记录 golden 都有）
1. 新增标题【入院记录】和表头“PID/姓名/科室/病区/床号”。没有住院号时，PID 输出「／」（不再回退内部记录 id）。
2. 【一般项目】改为模板的两栏 11 项：姓名、职业、性别、婚姻、出生日期、出生地、年龄、病史陈述者（与可靠程度合并）、民族、入院时间、记录时间。工作单位、通讯地址、电话、籍贯、科别不在模板中，不再打印；科室移到表头。
3. 现病史主体后追加“现为求进一步诊治，遂至我院就诊，拟“<首个初步诊断>”收住入院。”；一般情况另起一段，以“病来，”开头（原“发病以来”会被替换）。模板的书写规则不打印。
4. 既往史以一句总述开头（如“患者既往体健。”），分项顺序按模板排列；“与本病相关病史/其它”为空时不打印。
5. 个人史按模板顺序：冶游史、饮酒史、吸烟史排在疫区之后。
6. 婚姻史与月经、生育史合并为【婚育史】；【家庭史】更名为【家族史】，其后加一行“患者确认以上病史签名：＿＿＿＿”。
7. 体格检查分为“体格检查表（一）”和“体格检查表（二）补充及专科情况”，后者仅在有专科内容时打印。
8. 辅助检查分为实验室检查、特殊检查、病理检查三组，空组不打印。实验室条目按“均于<机构> 日期 项目 结果”书写，原文中的 ↑↓ 原样保留，不自动添加。
9. 【摘要】和【诊断依据】不在医院入院记录模板中，入院记录不再打印。数据仍保留，首次病程录照常使用。

## 未变更
- tests/golden/*/first-course.txt、tests/golden/*/discharge.txt 逐字节不变。
- docs/template-alignment/before 与 after 中的 first-course.txt、discharge.txt 逐字节相同（由 tests/pr10-template-alignment.test.cjs 断言）。

## 对照文件
虚构患者“虚构患者丙”（tests/fixtures/template-alignment/wzrm-neuro-fictional.json）：`docs/template-alignment/{before,after}/{dabingli,first-course,discharge}.txt`。重新生成：`node build.js && node tools/render-template-alignment.cjs <outdir>`。

## v3.0.0.10 复核修复

1. P1-2：入院记录表头 PID 只取住院号（`basic.recordNo`）。没有住院号时输出「／」，不再回退内部记录 id。`tests/golden/v1-respiratory/dabingli.txt` 的 `PID：legacy-v1-respiratory` 相应改为 `PID：／`。

2. D1：有系统回顾正文时，“患者确认以上病史签名：＿＿＿＿”移到系统回顾末尾，家族史后不再出现；无系统回顾时仍接在家族史末尾。`tests/golden/v1-respiratory/dabingli.txt`、`tests/golden/v2-digestive/dabingli.txt` 随之调整。
