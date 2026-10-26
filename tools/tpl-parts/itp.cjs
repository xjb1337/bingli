/* 模板病例：原发免疫性血小板减少症（ITP）
 *
 * 教材依据：《内科学》第10版 第六篇 血液系统疾病 第十五章 紫癜性疾病
 *   第二节 原发免疫性血小板减少症 p651-657
 *   - 临床表现：①反复皮肤黏膜出血：皮肤黏膜瘀点、瘀斑、鼻出血、牙龈出血、外伤后止血不易；
 *     ②乏力；③出血过多可致失血性贫血
 *   - 实验室：血小板减少、MPV 偏大、血细胞形态无异常；凝血功能正常、出血时间延长、束臂试验阳性；
 *     骨髓巨核细胞数正常或增加、伴成熟障碍、产板型巨核细胞显著减少；约 70% 抗血小板糖蛋白自身抗体阳性
 *   - 诊断要点：至少 2 次 PLT 减少且血细胞形态无异常；体检脾一般不大；骨髓巨核细胞数正常或增多伴成熟障碍；排除继发性
 *   - 治疗：糖皮质激素为一线，泼尼松 1mg/(kg·d)
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 */
module.exports = {
  key: 'itp',
  dept: 'hematology',
  name: '原发免疫性血小板减少症（ITP）',
  alias: ['ITP', '免疫性血小板减少症', '特发性血小板减少性紫癜', '血小板减少性紫癜'],
  hint: '反复皮肤瘀点瘀斑、鼻衄及牙龈出血，血小板明显减少而脾不大 —— ITP',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南通',
      birthPlace: '江苏南通',
      occupation: '小学教师',
      reliability: '可靠',
      chiefComplaint: '反复皮肤瘀点、瘀斑伴牙龈出血',
      chiefComplaintDuration: '2',
      chiefComplaintDurationUnit: '月'
    },
    hpi: {
      onset: '2个月前无明显诱因发现双下肢散在针尖样出血点，压之不褪色，无痛痒，未予重视',
      cause: '发病前1个月曾有上呼吸道感染，自服感冒清热颗粒后痊愈，否认近期服用阿司匹林等药物，否认苯及射线接触',
      symptoms: '出血点逐渐增多并融合成瘀斑，分布于双下肢及臀部；刷牙时牙龈渗血，需压迫数分钟方止；偶有晨起鼻衄，量少可自止',
      relief: '局部压迫后牙龈及鼻腔出血可止，瘀斑自行消退需2周左右，此起彼伏',
      evolution: '近半月瘀斑数量较前增多，轻微碰撞即出现大片瘀斑，洗脸后眼睑亦出现出血点',
      accompanying: '伴乏力、易疲倦，活动后明显；无发热，无关节肿痛',
      negativeDiscriminating: '无黑便、呕血及血尿，无月经过多，无发热盗汗，无骨痛及淋巴结肿大，无皮疹及皮肤瘙痒',
      treatment: '1个月前于当地医院查血常规示血小板 28×10⁹/L，予氨肽素及维生素C口服2周，未复查；未用过糖皮质激素及免疫抑制剂',
      generalCondition: '发病以来精神可，食欲睡眠正常，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      hemat: {
        bruise: { checked: true, detail: '双下肢及臀部散在瘀点瘀斑，轻微碰撞即出现大片瘀斑' },
        bleeding: { checked: true, detail: '刷牙时牙龈渗血，需压迫数分钟方止' },
        purpura: { checked: true, detail: '双下肢散在针尖样出血点，压之不褪色' },
        epistaxis: { checked: true, detail: '晨起偶有鼻衄，量少可自止' },
        fatigue: { checked: true, detail: '乏力、易疲倦，活动后明显' },
        anemia: { negative: true },
        lymphNode: { negative: true },
        bonePain: { negative: true },
        rash: { negative: true },
        transfusion: { negative: true }
      },
      resp: { fever: { negative: true }, nightSweat: { negative: true } },
      gi: {
        melena: { negative: true },
        hematemesis: { negative: true },
        abdominalPain: { negative: true },
        diarrhea: { negative: true }
      },
      gu: { hematuria: { negative: true } },
      joint: { jointPain: { negative: true } },
      nervous: { headache: { negative: true }, visualBlur: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病等慢性病史，否认系统性红斑狼疮、类风湿关节炎等自身免疫性疾病史',
      longTermMeds: '无长期服药史，否认近期服用肝素、奎宁、磺胺等药物',
      infection: '否认肝炎、结核、HIV 等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认苯、甲苯及放射性物质接触史',
      vaccine: '按计划预防接种，近期未接种疫苗',
      allergy: '无',
      relatedHistory: '否认家族中有出血性疾病患者，否认酗酒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于江苏南通，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '母乳喂养',
      growth: '生长发育与同龄人相仿',
      smoking: '无',
      drinking: '无',
      drugs: '否认苯、甲醛及有机磷农药接触史',
      environment: '',
      habits: '作息规律，饮食正常，无特殊偏嗜',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '小学教学工作，无粉尘、射线及化学毒物接触'
    },
    marriage: { status: '已婚', age: '29', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有血小板减少及出血性疾病患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '可见瘀点瘀斑',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发分布均匀',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        thyroid: '甲状腺无肿大',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        liverPalpation: '肝肋下未触及，肝区无压痛',
        spleenPalpation: '脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      special_hematology: {
        hemAnemia: '睑结膜、口唇及甲床无苍白',
        hemBleeding: '可见瘀点',
        hemNode: '全身浅表淋巴结未触及肿大',
        hemSternum: '胸骨无压痛',
        hemGum: '牙龈渗血',
        hemHepatospleen: '肝脾肋下未触及',
        hemJaundice: '皮肤巩膜无黄染',
        hemBoneTender: '四肢长骨及关节无压痛'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规（两次，间隔2周）', result: '第一次 PLT 24×10⁹/L；第二次 PLT 31×10⁹/L；两次 Hb 126～131g/L，WBC 6.2～7.1×10⁹/L，红细胞及白细胞形态未见异常，MPV 13.2fl', date: '', hospital: '', no: '' },
        { name: '凝血功能与束臂试验', result: 'PT 12.6s，APTT 30s，纤维蛋白原 3.1g/L；出血时间延长，束臂试验阳性', date: '', hospital: '', no: '' },
        { name: '骨髓穿刺+活检', result: '骨髓增生活跃，巨核细胞数增多，产板型巨核细胞显著减少，呈成熟障碍；红系及粒系形态未见异常', date: '', hospital: '', no: '' },
        { name: '血小板自身抗体与免疫学', result: '抗血小板糖蛋白 GPⅡb/Ⅲa 抗体阳性；ANA、抗 dsDNA 抗体阴性；HIV、HCV、HBV 筛查阴性', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '肝、胆、胰、脾未见异常，脾厚 32mm，肋下未及', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['原发免疫性血小板减少症（ITP，新诊断）', '血小板减少症（重度）']
    }
  }
};
