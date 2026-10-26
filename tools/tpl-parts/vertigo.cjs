/* 模板病例：良性阵发性位置性眩晕（右侧后半规管）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：头位改变诱发的短暂旋转性眩晕，多在数十秒内自行缓解，
 * 无耳鸣及听力下降（与梅尼埃病区分）、无中枢体征（与后循环缺血区分）；
 * Dix-Hallpike 试验诱发特征性眼震即可确诊，手法复位有效。
 */
module.exports = {
  key: 'vertigo',
  dept: 'neurology',
  name: '良性阵发性位置性眩晕（后半规管）',
  alias: ['良性阵发性位置性眩晕', '耳石症', 'BPPV', '位置性眩晕'],
  hint: '头位改变诱发短暂眩晕，伴特征性眼震，无耳鸣听力下降及中枢体征',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏苏州',
      birthPlace: '江苏苏州',
      occupation: '会计',
      reliability: '可靠',
      chiefComplaint: '反复发作性眩晕伴恶心2周',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '周'
    },
    hpi: {
      onset: '2周前夜间翻身时突发旋转性眩晕，自觉自身旋转、周围景物晃动，持续约30秒后自行缓解',
      cause: '多在躺下、起床、翻身及抬头晾衣时诱发，与体位改变关系明确；发病前有连续熬夜加班史',
      symptoms: '每次发作持续数十秒，最长不超过1分钟，发作时不敢睁眼，需立即制动；发作间期无不适，日常行走如常，但快速转头时仍有短暂头昏',
      relief: '保持头部不动、静坐数分钟后缓解，闭眼休息可减轻',
      evolution: '近1周发作频次增多，每日3～4次，程度较前加重，因惧怕发作而不敢独自出门',
      accompanying: '伴恶心，发作时呕吐1次，伴冷汗、心悸',
      negativeDiscriminating: '无耳鸣、耳闷及听力下降，无耳流脓，无头痛，无言语不清及肢体无力，无面部麻木及吞咽困难，无行走不稳，无黑矇及意识丧失',
      treatment: '社区医院按「颈椎病」予氟桂利嗪5mg每晚口服1周，症状无明显缓解，遂来诊',
      generalCondition: '发病以来精神略紧张，食欲尚可，睡眠因惧怕夜间发作而变差，大小便正常，体重无明显变化',
      extra: '门诊行Dix-Hallpike试验右侧诱发典型眼震，随即行Epley手法复位'
    },
    ros: {
      nervous: {
        vertigo: { checked: true, detail: '体位改变诱发旋转性眩晕，持续数十秒' },
        dizziness: { checked: true, detail: '发作间期快速转头时短暂头昏' },
        tinnitus: { negative: true },
        hearingLoss: { negative: true },
        headache: { negative: true },
        visualBlur: { negative: true },
        numbness: { negative: true },
        weakness: { negative: true },
        speech: { negative: true },
        syncopeNerve: { negative: true },
        seizure: { negative: true }
      },
      cardio: { palpitation: { checked: true, detail: '发作时伴心悸，数分钟后缓解' } },
      gi: { nausea: { checked: true, detail: '发作时恶心，呕吐1次' }, vomiting: { checked: true, detail: '发作时呕吐1次为胃内容物' } },
      resp: { fever: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病病史；否认头部外伤及中耳炎病史；否认偏头痛病史',
      longTermMeds: '氟桂利嗪5mg每晚口服1周（近期）',
      infection: '否认肝炎、结核等传染病史；近1个月无上呼吸道感染',
      surgery: '否认手术史',
      trauma: '否认头部及耳部外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及耳毒性药物接触史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认使用氨基糖苷类等耳毒性药物',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于江苏苏州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认有毒有害物质接触史',
      environment: '',
      habits: '长期伏案工作，每日使用电脑约10小时，睡眠不足，喜饮浓咖啡',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘及噪声接触'
    },
    marriage: { status: '已婚', age: '28', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        babinski: '巴氏征阴性',
        kernig: '克氏征阴性'
      },
      special_neurology: {
        neuroExtra1: '言语流利，定向力、记忆力、计算力正常',
        neuroExtra2: '十二对颅神经检查未见异常',
        neuroExtra3: '四肢肌张力正常，肌力正常，未见肌萎缩',
        neuroExtra4: '痛温觉、触觉、深感觉检查未见异常',
        neuroExtra5: '指鼻试验、跟膝胫试验稳准，Romberg征阴性',
        neuroPathologic: 'Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性',
        neuroMeningeal: '颈项强直阴性，Kernig征阴性，Brudzinski征阴性',
        neuroGait: '步态正常，行走平稳'
      }
    },
    auxiliary: {
      items: [
        { name: 'Dix-Hallpike试验', result: '右侧卧位诱发旋转性眼震，以垂直向上成分为主伴旋转，潜伏期约5秒，持续约20秒后疲劳，伴眩晕及恶心；左侧未诱发', date: '', hospital: '', no: '' },
        { name: '纯音测听', result: '双耳各频率气导、骨导阈值均在20dB以内，无听力下降', date: '', hospital: '', no: '' },
        { name: '前庭功能检查（视频眼震图）', result: '右侧后半规管诱发眼震阳性，冷热试验双侧半规管反应对称', date: '', hospital: '', no: '' },
        { name: '头颅MRI', result: '脑实质未见异常信号，脑干及小脑未见梗死灶，内听道未见占位', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['良性阵发性位置性眩晕（右侧后半规管）']
    }
  }
};
