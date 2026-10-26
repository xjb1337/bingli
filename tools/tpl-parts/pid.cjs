module.exports = {
  key: 'pid',
  dept: 'gynecology',
  name: '盆腔炎性疾病（急性）',
  alias: ['盆腔炎', '盆腔炎性疾病', 'PID', '急性盆腔炎', '输卵管炎', '子宫内膜炎'],
  hint: '下腹持续疼痛伴阴道分泌物增多、发热，宫颈举痛、子宫及附件区压痛',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '下腹疼痛伴阴道分泌物增多5天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '5天前月经干净后第2天无明显诱因出现下腹持续性坠痛，以右下腹为著',
      cause: '发病前有劳累及会阴局部卫生不良，可诱发本病',
      symptoms: '疼痛呈持续性胀坠感，程度中等，行走、久站及性交时加重，卧床休息后可略减轻',
      relief: '自行口服布洛芬缓释胶囊0.3g每日2次，服药3天疼痛无明显缓解',
      evolution: '近2天疼痛较前加重，伴畏寒、发热，最高体温38.6℃，阴道分泌物明显增多',
      accompanying: '分泌物色黄、有异味，伴尿频、尿急，无尿痛，伴恶心、食欲下降',
      negativeDiscriminating: '无阴道流血，无停经史，无晕厥及肛门坠胀感，无腹泻及里急后重，无右下腹转移性疼痛',
      treatment: '5天前于社区卫生服务中心查血常规示白细胞升高，予头孢克肟0.1g每日2次口服，疗程3天，服药后体温一度降至正常，停药后复升，疗效不佳',
      generalCondition: '发病以来精神稍差，食欲下降，睡眠欠佳，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '下腹持续性坠痛，右下腹为著，行走及性交时加重' },
        nausea: { checked: true, detail: '进食后恶心，未呕吐' },
        vomiting: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        appetiteLoss: { checked: true, detail: '近3天食欲明显下降' },
        jaundiceGi: { negative: true },
        bloating: { negative: true }
      },
      gu: {
        discharge: { checked: true, detail: '阴道分泌物增多，色黄，有异味' },
        dysuria: { checked: true, detail: '尿频、尿急，无尿痛' },
        hematuria: { negative: true },
        oliguria: { negative: true },
        flankPain: { negative: true },
        edemaGu: { negative: true }
      },
      resp: { fever: { checked: true, detail: '畏寒、发热，最高体温38.6℃' }, cough: { negative: true }, dyspnea: { negative: true } },
      cardio: { palpitation: { negative: true }, edemaCardio: { negative: true }, orthopnea: { negative: true } },
      hemat: { anemia: { negative: true }, fatigue: { checked: true, detail: '近2天乏力明显' }, bleeding: { negative: true } },
      endocrine: { polydipsia: { negative: true }, polyuriaEndo: { negative: true }, weightLoss: { negative: true } },
      nervous: { headache: { negative: true }, visualBlur: { negative: true }, dizziness: { checked: true, detail: '发热时感头晕，无晕厥' }, sleepDisorder: { checked: true, detail: '因腹痛夜间入睡困难' } },
      joint: { backPain: { checked: true, detail: '腰骶部酸胀，与下腹痛同时出现' }, jointPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史，否认人工流产及宫腔操作史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认不洁性接触史，否认多个性伴侣，配偶否认泌尿生殖道感染史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江温州',
      travel: '否认疫区及传染病接触史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物滥用史',
      environment: '',
      habits: '工作久坐，饮水少，偶有憋尿习惯',
      sexualHistory: '已婚，配偶固定，否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘、毒物及放射线接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: {
      applicable: '有',
      age: '13',
      cycle: '28',
      duration: '5',
      quantity: '中等',
      color: '暗红',
      clot: '无',
      leukorrhea: '平素量少，色白，无异味；近5天量增多，色黄，有异味',
      lmp: '2025年10月1日',
      menopauseAge: '',
      dysmenorrhea: '有，经期第1天明显，需服止痛药'
    },
    childbirth: {
      applicable: '有',
      fullTerm: '0',
      premature: '0',
      abortion: '0',
      alive: '0',
      gravida: '0',
      para: '0',
      details: '结婚2年未避孕未孕',
      lastBirth: '',
      contraception: '避孕套'
    },
    family: {
      diseaseChecks: {},
      other: '父母体健',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有类似疾病患者',
      infectionHistory: '否认结核、肝炎等传染病接触史'
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
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '双侧腹股沟可触及肿大淋巴结'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发分布均匀',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '舌质红、苔黄腻'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        thyroid: '甲状腺无肿大',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        heartPalpation: '心尖搏动无抬举性，未触及震颤',
        heartPercussion: '心界不大',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '右下腹压痛、反跳痛'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出'
      },
      special_gynecology: {
        gynVagina: '阴道分泌物增多伴异味',
        gynCervix: '宫颈举痛',
        gynUterus: '子宫压痛',
        gynAdnexa: '双附件区压痛',
        gynTriple: '宫骶韧带增厚结节',
        gynBreast: '双侧乳房对称，未触及肿块，乳头无溢液'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 14.2×10⁹/L，N 82.4%，Hb 118g/L，PLT 236×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白', result: '68mg/L，降钙素原 0.18ng/ml', date: '', hospital: '', no: '' },
        { name: '血hCG', result: '阴性', date: '', hospital: '', no: '' },
        { name: '阴道分泌物常规', result: '清洁度Ⅲ度，白细胞满视野，未见滴虫及假丝酵母菌孢子', date: '', hospital: '', no: '' },
        { name: '盆腔超声', result: '子宫大小形态正常，宫腔线清晰；双附件区增厚，右侧输卵管增粗，盆腔少量积液（深约1.8cm）', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['盆腔炎性疾病（急性）', '右侧输卵管炎', '盆腔少量积液']
    }
  }
};
