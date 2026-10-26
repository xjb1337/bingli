/* 模板病例：急性髓系白血病（AML，M2）
 *
 * 教材依据：《内科学》第10版 第六篇 血液系统疾病 第九章 急性髓系白血病 p607-622
 *   - 正常造血功能受抑制：贫血（乏力、面色苍白）、感染发热、出血（皮肤瘀点瘀斑、鼻衄、牙龈出血、月经过多）
 *   - 白血病细胞增殖浸润：淋巴结和肝脾大；胸骨下段局部压痛（常有）；骨与关节疼痛；
 *     粒细胞肉瘤；口腔和皮肤（M4/M5 牙龈增生肿胀、皮肤蓝灰色斑丘疹或紫蓝色结节）；中枢神经系统白血病；睾丸
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 */
module.exports = {
  key: 'leukemia',
  dept: 'hematology',
  name: '急性髓系白血病（AML-M2）',
  alias: ['急性白血病', '白血病', 'AML', '急性髓系白血病', 'M2'],
  hint: '发热、乏力伴皮肤瘀点瘀斑，胸骨下段压痛，淋巴结及脾肿大 —— 急性白血病',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '河南周口',
      birthPlace: '河南周口',
      occupation: '货运司机',
      reliability: '可靠',
      chiefComplaint: '发热伴皮肤瘀点、乏力',
      chiefComplaintDuration: '20',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '20天前无明显诱因出现发热，体温最高39.2℃，以下午及夜间为著，无畏寒寒战，自服对乙酰氨基酚后可暂时降至正常',
      cause: '发病前2周曾因「感冒」在社区诊所静滴抗菌药物，无明显诱因，否认近期装修及化学毒物接触',
      symptoms: '发热反复，伴全身乏力、活动后气促；同时双下肢及腹部出现散在瘀点、瘀斑，刷牙时牙龈渗血，晨起偶有鼻衄，可自行停止',
      relief: '退热药物可暂时退热，但数小时后又复升；牙龈渗血需局部压迫方能止住',
      evolution: '近1周乏力明显加重，需卧床休息，行走十余米即感心慌气短，瘀点瘀斑较前增多',
      accompanying: '伴食欲明显下降、夜间盗汗，左侧卧位时左上腹有坠胀感',
      negativeDiscriminating: '无黑便、呕血，无尿血，无关节肿痛及骨痛，无皮疹及皮肤瘙痒，无头痛呕吐及视物模糊',
      treatment: '社区诊所予头孢曲松2g每日1次静滴3天、地塞米松5mg静推1次，体温可短暂下降，停药后复升，疗效不佳',
      generalCondition: '发病以来精神差，食欲差，睡眠欠佳，大小便正常，体重下降约4kg',
      extra: ''
    },
    ros: {
      hemat: {
        bleeding: { checked: true, detail: '刷牙时牙龈渗血，晨起偶有鼻衄' },
        bruise: { checked: true, detail: '双下肢及腹部散在瘀点、瘀斑' },
        lymphNode: { checked: true, detail: '自觉颈部及腹股沟可扪及黄豆大小结节' },
        fatigue: { checked: true, detail: '乏力明显，行走十余米即感心慌气短' },
        anemia: { checked: true, detail: '面色苍白，活动后气促' },
        bonePain: { negative: true },
        epistaxis: { checked: true, detail: '晨起偶有鼻衄，可自行停止' },
        rash: { negative: true },
        pruritus: { negative: true }
      },
      resp: {
        fever: { checked: true, detail: '发热20天，最高39.2℃' },
        cough: { negative: true },
        sputum: { negative: true },
        hemoptysis: { negative: true },
        nightSweat: { checked: true, detail: '夜间盗汗，需更换衣物' }
      },
      cardio: { palpitation: { checked: true, detail: '活动后心悸' } },
      gi: {
        appetiteLoss: { checked: true, detail: '食欲明显下降，进食量不足平日一半' },
        abdominalPain: { checked: true, detail: '左侧卧位时左上腹坠胀感' },
        melena: { negative: true },
        hematemesis: { negative: true },
        diarrhea: { negative: true }
      },
      endocrine: { weightLoss: { checked: true, detail: '20天体重下降约4kg' } },
      nervous: {
        headache: { negative: true },
        visualBlur: { negative: true },
        dizziness: { negative: true }
      },
      joint: { jointPain: { negative: true }, backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病等慢性病史，否认结核、肝炎等传染病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认苯及放射性物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认肿瘤家族史，否认长期服用氯霉素等药物史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于河南周口，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '母乳喂养',
      growth: '生长发育与同龄人相仿',
      smoking: '有',
      smokingAmount: '吸烟5年，每日约15支，未戒烟',
      drinking: '有',
      drinkingAmount: '偶尔饮啤酒，每次约500ml，每周1～2次',
      drugs: '否认苯、甲醛及有机磷农药接触史',
      environment: '',
      habits: '长期跑长途货运，作息不规律，常熬夜',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '货运驾驶工作，否认射线及化学毒物接触'
    },
    marriage: { status: '未婚', age: '', spouseHealth: '', sexLife: '否认性生活史', relation: '' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有白血病及血液系统疾病患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        face: '贫血面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
        rash: '可见瘀点瘀斑',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '双侧颈部可触及肿大淋巴结'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发分布均匀',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '口腔黏膜溃疡'
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
        spleenPalpation: '脾肋下可触及且质硬'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      special_hematology: {
        hemAnemia: '睑结膜苍白',
        hemBleeding: '可见瘀点',
        hemNode: '颈部淋巴结肿大',
        hemSternum: '胸骨中下段压痛',
        hemGum: '牙龈渗血',
        hemHepatospleen: '脾肋下可触及',
        hemJaundice: '皮肤巩膜无黄染',
        hemBoneTender: '四肢长骨及关节无压痛'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 32.6×10⁹/L，Hb 68g/L，PLT 38×10⁹/L，外周血涂片见原始细胞 46%', date: '', hospital: '', no: '' },
        { name: '骨髓穿刺+活检', result: '骨髓增生极度活跃，原始粒细胞占 52%，可见 Auer 小体，红系及巨核系受抑；活检示骨髓增生极度活跃，原始细胞弥漫性增生', date: '', hospital: '', no: '' },
        { name: '免疫分型（流式细胞术）', result: 'CD13⁺、CD33⁺、CD117⁺、MPO⁺、HLA-DR⁺、CD34⁺，符合髓系表达', date: '', hospital: '', no: '' },
        { name: '染色体及融合基因', result: '46,XY,t(8;21)(q22;q22)；RUNX1-RUNX1T1 融合基因阳性', date: '', hospital: '', no: '' },
        { name: '凝血功能与乳酸脱氢酶', result: 'PT 13.8s，APTT 32s，纤维蛋白原 3.4g/L；LDH 682U/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性髓系白血病（AML-M2，伴 t(8;21)）', '贫血（重度）', '血小板减少症']
    }
  }
};
