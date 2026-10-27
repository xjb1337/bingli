# 模板病例撰写契约（tools/tpl-parts/）

模板是可复用的病历初稿，支持「典型教学病例」和标有来源的「院内范例」。学生选科室后套用已有内容，
再**按当前患者实际问到的、查到的逐项核对补充**。教学模板展示典型表现；院内范例按原始证据保留缺项和不确定性。

## 文件形式

写 `tools/tpl-parts/<key>.cjs`，内容是：

```js
module.exports = {
  key: 'pud',                       // 英文小写，唯一
  dept: 'digestive',                // 科室键，必须是 SCHEMA.DEPARTMENTS 里的 key
  name: '消化性溃疡（十二指肠球部溃疡）',
  alias: ['十二指肠溃疡', '胃溃疡'],  // 学生可能怎么叫它，用于搜索
  hint: '慢性、周期性、节律性上腹痛，进食后缓解',   // 一句话：典型表现，帮学生选对模板
  // 可选来源元数据；仅院内范例使用，生成器保留此三字段对象
  source: {
    kind: 'hospital-example',       // 来源类型，当前支持 hospital-example
    label: '院内范例',
    note: '依据来源整理；列明缺项与需按实际材料补录的内容。'
  },
  record: { ... }                   // 见下
};
```

不要写 `require`、不要写函数、不要写注释以外的逻辑——这是纯数据。

## 来源与院内范例

`source` 是可选的来源说明对象，结构为 `{ kind, label, note }`。普通教学模板省略它；来源于院内原始病例材料的模板使用 `kind: 'hospital-example'`，并提供面向使用者的 `label` 与 `note`。生成数据会原样保留此对象；模板卡片展示来源和缺项说明，套用确认框也提示 `note`，来源元数据不进入病历正文。

院内范例遵循原始材料的证据边界，而不是为了满足完整教学模板的字段数而补写：未给出的身份人口学资料、生命体征、阳性查体、个人/婚育/家族史、病理、分期、病灶尺寸或 SUV 均留空；未提供的病史不得套用通用典型描述。保留影像原有的“可能”等不确定性与病理暂缺状态，诊断只记录材料支持的结节/疾病表述。明确记载的既往病史与长期用药（包括原有剂量和频次）仍作为既往史。辅助检查保留来源文本中的项目和结果，不补造日期、机构或检查号；套用时已有检查内容（即使只有日期、机构或编号）整组原样保留，默认全空预置行则允许模板填入。

## record 里只能出现这些键

```js
record: {
  basic: {
    // ❌ 绝对不写：name / gender / age / recordNo / bedNo / admitDate / recordDate / department
    //    （患者身份信息由学生自己填，模板不许猜）
    // ✅ 可以写：
    marital: '已婚',
    nationality: '汉族',
    nativePlace: '浙江温州',
    birthPlace: '浙江温州',
    occupation: '工人',
    workUnit: '',
    address: '',
    phone: '',
    reliability: '可靠',
    informant: '',
    chiefComplaint: '反复上腹痛',        // 只写症状+部位，不写诊断，不带时间
    chiefComplaintDuration: '2',          // 纯数字，字符串
    chiefComplaintDurationUnit: '年'      // 天/周/月/年
  },
  hpi: {
    onset: '',                 // 起病时间，如「2年前无明显诱因」
    cause: '',                 // 诱因
    symptoms: '',              // 主要症状特点（部位/性质/程度/频度/持续时间/加重缓解因素）
    relief: '',                // 缓解方式
    evolution: '',             // 病情演变
    accompanying: '',          // 伴随症状
    negativeDiscriminating: '',// ⭐ 有鉴别意义的阴性症状，必须写
    treatment: '',             // 诊治经过（用药名称、剂量、疗效）
    generalCondition: '',      // 发病以来一般情况
    extra: ''                  // 其他
  },
  ros: {
    // 系统 key 见 SCHEMA.ROS 8 系统：resp cardio gi gu hemat endocrine nervous joint
    // 阳性：{ checked: true, detail: '补充说明' }
    // 阴性：{ negative: true }
    // 没问的：整个键不写（不要写 negative —— 那等于替学生断言「问过且没有」）
    gi: { abdominalPain: { checked: true }, reflux: { negative: true } }
  },
  pmh: {
    health: '平素体健',
    diseaseChecks: { '消化性溃疡': true },  // 名必须逐字取自 SCHEMA.COMMON_PMH
    diseaseOther: '',
    diseaseDetail: '',
    longTermMeds: '',
    infection: '',
    surgery: '',
    trauma: '',
    transfusion: '',
    poisoning: '',
    vaccine: '',
    allergy: '无',              // '无' → 生成「否认食物、药物过敏史」；'有' → 用 allergenChecks
    allergenChecks: {},
    allergenOther: '',
    allergenReactionChecks: {},
    allergyReaction: '',
    relatedHistory: '',
    otherTreatDiseases: '',
    special: ''
  },
  personal: {
    maternal: '', birth: '', feeding: '', growth: '',   // 儿科才写
    residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
    travel: '',
    smoking: '无',              // '有' / '无' / '已戒'
    smokingAmount: '',
    drinking: '无',
    drinkingAmount: '',
    drugs: '',
    environment: '',
    habits: '',
    sexualHistory: '否认不洁性接触史',
    occupationEnv: ''
  },
  marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健' },
  // 男性不写 menstruation / childbirth；女性按需写
  family: {
    diseaseChecks: {},          // 名必须逐字取自 SCHEMA.FAMILY_DISEASES
    other: '',
    deceased: '',               // 如「父亲因胃癌去世，65岁」
    threeGeneration: '',
    similarDisease: '',
    infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
  },
  pe: {
    vitals: {},                 // ❌ 一律留空，不写数字
    general: {}, skin: {}, head: {}, neck: {}, chest: {},
    abdomen: {}, genital: {}, spine: {}, nervousPE: {},
    special_digestive: {}       // 专科查体，路径 pe.special_<科室键>.<项key>
  },
  auxiliary: {
    items: [
      { name: '血常规', result: 'Hb 118g/L，WBC 6.2×10⁹/L，N 62%', date: '', hospital: '', no: '' }
    ]
  },
  diagnosis: { confirmed: ['消化性溃疡（十二指肠球部溃疡）'] }
}
```

## 查体怎么写（最关键，必须逐字对表）

**打开 `tools/pe-options.txt`**，每一项都有 `def=`（系统默认正常描述）和 `opt=`
（快捷描述候选）。写入 `pe` 的值必须是：

- **正常项**：直接把 `def=` 抄进去（或省略不写，让学生自己勾）
- **异常项**：从 `opt=` 里**逐字**挑一条（诊断提示用的是精确匹配，一个字不同就命中不了）

只写这个病**相关**的查体，不要把 57 项通用查体全抄一遍——那是学生按自己实际查到的勾。
但要写够，让整份查体读起来像完整的入院记录：
1. `general` 六项（发育/营养/神志/体位/面容/查体合作）——除非病人有相应异常
2. 与本系统有关的阳性 + 有鉴别意义的阴性
3. 示例（消化性溃疡）：
   ```js
   pe: {
     general: { development:'发育正常', nutrition:'营养中等', conscious:'神志清楚，精神可', posture:'自主体位', face:'面容自然', cooperation:'查体合作' },
     skin: { color:'皮肤黏膜苍白' },              // ← 如果有贫血
     abdomen: {
       abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
       abdAuscultation: '肠鸣音正常，未闻及血管杂音',
       abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性'
       // 触诊既不用写父项也不用写子项：用专科的 giTenderness 表达压痛即可
     },
     special_digestive: {
       giTenderness: '上腹部压痛'                  // ← 逐字来自 opt
     }
   }
   ```
   注意 `abdomen.abdPalpation` 的 opt 里写的是「**上腹部**压痛，无反跳痛」，
   没有「中上腹压痛」这个值——照抄 `opt=` 里的字，别自己改词。
   ⚠️ `abdomen.abdPalpation` 有 8 个子项（abdPalpSuperficial/abdPalpDeep/liverPalpation/
   spleenPalpation/gallbladderPalpation/kidneyPalpation/bladderPalpation/fluidThrill），
   **写了子项，父项 abdPalpation 就会被让位**（不输出）。要么只写父项，要么写子项组合，
   不要既写父项又写子项。

## 绝对禁止

1. ❌ 生命体征数字（体温/脉搏/呼吸/血压/身高/体重/腹围）——学生自己测
2. ❌ 患者姓名/性别/年龄/住院号/床号/日期
3. ❌ 编造具体的检验数值以外的检查号、医院名（`hospital`/`no` 留空）
4. ❌ 完整教学模板的诊断写「可能」「疑似」——典型教学病例诊断要确定；院内范例必须忠实保留原材料的影像不确定性及性质待定，不得改写成确诊
5. ❌ 完整教学模板大段复述——每段控制在教材病历的常见长度（现病史 150～300 字）；院内范例不得为了凑字数或补齐字段而添加来源未提供的内容

## 交付前自检

```bash
node tools/check-templates.js tools/tpl-parts/<key>.cjs
```
（我会写这个脚本；它检查键名合法、查体值在 opt 里、诊断能被 hints 命中、生成结果无矛盾）
