# 模板撰写简报（每个写模板的子代理先读这一份）

项目：`E:\bingli` —— 单文件离线网页「大病历生成器」，给医学生把问诊查体整理成规范大病历。
现在要给「选完科室后一键套用标准病例」这个功能补模板。

## 你要读的三份文件（按顺序）

1. `tools/tpl-parts/CONTRACT.md` —— 撰写契约，写什么、不许写什么，**逐条照做**
2. `tools/tpl-parts/pud.cjs` —— 样板，密度与写法照它
3. `tools/pe-options.txt` —— 查体项的全部 `def=` / `nor=` / `opt=`，**查体值必须逐字来自这里**

## 教材原文怎么查

```bash
export PYTHONPATH='E:\Lib\site-packages' PYTHONIOENCODING=utf-8
python tools/bookgrep.py 内科 消化性溃疡 --pages 405-410
python tools/bookgrep.py 外科 急性阑尾炎 --pages 441-448 --max 3
```

页码对照表在 `tools/tpl-parts/TEXTBOOK-MAP.md`。
**不要整章 dump**——内科 982 页、外科 834 页，整章导出几万字会爆上下文。
每个病种查 3～6 次关键词（临床表现、体格检查、实验室、诊断、鉴别）就够写了。

## 每个模板要包含

- `hpi.negativeDiscriminating`：**必须有**，写与该病鉴别最相关的阴性症状
- `hpi.treatment`：写清用药名称、剂量、疗程、疗效
- `ros`：只写**问过**的症状。阳性 `{checked:true, detail:'…'}`，明确问过且没有 `{negative:true}`，
  没问的整个键不写
- `pmh`：`health` / `diseaseDetail` / `infection` / `allergy` 必写，其余按病种
- `pe`：`general` 六项 + 本系统阳性体征 + 有鉴别意义的阴性。**不写 `vitals`**
- `auxiliary.items`：2～5 条该病的典型检查结果（`date`/`hospital`/`no` 一律空串）
- `diagnosis.confirmed`：2～3 条，第一条是主诊断，**不许写「可能」「疑似」**

## 交付前必须自检

```bash
node tools/check-templates.js tools/tpl-parts/<你的文件>.cjs
```

要求：**`0 个问题`**。提醒（`!`）里允许且只有这 5 条：缺姓名、缺性别、缺年龄、缺医师签名、摘要初稿。
`check-templates.js` 会告诉你查体值不在 opt 里、键名不存在、ros 状态不合法——**照它说的改，不要绕过**。

## 硬红线

1. `pe.vitals` 一律 `{}`。不许出现 ℃ / mmHg / 次/分 / 身高 / 体重 / 腹围 的数字
2. `basic` 不许写 name/gender/age/recordNo/bedNo/admitDate/recordDate/department
3. 查体值必须逐字抄 `pe-options.txt`，**一个字都不许改**（诊断提示是精确匹配）
4. 只写你负责的文件，**不许改 src/、tests/、其他 tpl-parts 文件**
5. 不许用 sed / perl 批量替换（上一轮有人把 JSDoc 注释头截断了）
6. 不许跑 `node build.js`、不许 git 提交

## 一个高频坑

`abdomen.abdPalpation` 有 8 个子项（abdPalpSuperficial / abdPalpDeep / liverPalpation /
spleenPalpation / gallbladderPalpation / kidneyPalpation / bladderPalpation / fluidThrill）,
已填写的父项与子项都会保留；编写模板时应核对两处是否重复或冲突。

## 第二批起的补充约定（2026-10-25 加）

写别的科室时，`dept` 必须是 `SCHEMA.DEPARTMENTS` 里的键之一：
`general` `respiratory` `digestive` `cardiology` `endocrinology` `nephrology`
`hematology` `neurology` `surgery` `obstetrics` `gynecology` `pediatrics` `emergency`

专科查体的存储路径是 `pe.special_<dept>.<itemKey>`。比如外科的 `surgPeritoneum`
写成 `pe['special_surgery'].surgPeritoneum = '全腹压痛、反跳痛，腹肌紧张呈板状'`。
**注意 storeKey 是 `special_` + 科室键**，不是中文名。

写之前先确认那个 item 的 key 和可选值：
```bash
grep -A3 "special_surgery" tools/pe-options.txt | head -60
```
（`pe-options.txt` 若没更新到含新科室，直接 `node tools/dump-pe-options.js` 重新生成）
