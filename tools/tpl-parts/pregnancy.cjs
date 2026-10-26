module.exports = {
  key: 'pregnancy',
  dept: 'obstetrics',
  name: '妊娠待产（孕38周 G1P0）',
  alias: ['妊娠待产', '足月妊娠', '孕38周', 'G1P0', '待产', '正常妊娠'],
  hint: '停经38周，下腹规律阵痛伴见红，无阴道流血流液',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '停经38周，下腹阵痛伴见红3小时',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '停经38周，3小时前出现下腹规律阵痛，间隔约5～6分钟，持续约30秒',
      cause: '无明显诱因，孕早期于我院建卡并规律产检',
      symptoms: '腹痛呈阵发性下坠感，伴少量阴道血性分泌物',
      relief: '休息后宫缩不能缓解，改变体位亦无减轻',
      evolution: '宫缩间隔由10分钟逐渐缩短至5～6分钟，强度逐渐增强',
      accompanying: '伴腰骶部酸胀、下腹坠胀，胎动正常，无恶心呕吐',
      negativeDiscriminating: '无阴道大量流血，无阴道流液，无头痛、视物模糊，无上腹不适及皮肤瘙痒',
      treatment: '孕期规律产检9次，孕28周起口服多糖铁复合物0.1g每日1次，疗程8周，复查血红蛋白维持在110g/L以上，疗效可',
      generalCondition: '发病以来精神可，食欲正常，睡眠因宫缩受影响，大小便正常，孕期体重增长在正常范围',
      extra: ''
    },
    ros: {
      gi: {
        nausea: { checked: true, detail: '孕早期晨起恶心，偶有呕吐，孕3个月后自行缓解' },
        vomiting: { negative: true },
        abdominalPain: { checked: true, detail: '下腹阵发性坠痛，间隔5～6分钟' },
        diarrhea: { negative: true },
        constipation: { negative: true },
        appetiteLoss: { negative: true },
        jaundiceGi: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { negative: true },
        edemaGu: { negative: true },
        discharge: { negative: true }
      },
      resp: { fever: { negative: true }, cough: { negative: true }, dyspnea: { negative: true } },
      cardio: { palpitation: { negative: true }, edemaCardio: { negative: true }, orthopnea: { negative: true } },
      hemat: { anemia: { negative: true }, fatigue: { negative: true }, bleeding: { negative: true } },
      endocrine: { polydipsia: { negative: true }, polyuriaEndo: { negative: true }, weightGain: { negative: true } },
      nervous: { headache: { negative: true }, visualBlur: { negative: true }, dizziness: { negative: true }, sleepDisorder: { negative: true } },
      joint: { backPain: { checked: true, detail: '腰骶部酸胀，随宫缩加重' }, jointPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、心脏病及慢性肾脏病病史',
      longTermMeds: '孕期服用多糖铁复合物，无其他长期用药',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认不良孕产史',
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
      habits: '生活规律，饮食可，孕期坚持适量活动',
      sexualHistory: '已婚，配偶固定，否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘、毒物及放射线接触'
    },
    marriage: { status: '已婚', age: '28', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: {
      applicable: '有',
      age: '14',
      cycle: '28',
      duration: '5',
      quantity: '中等',
      color: '暗红',
      clot: '无',
      leukorrhea: '量少，色白，无异味',
      lmp: '2025年1月20日，停经至今38周',
      menopauseAge: '',
      dysmenorrhea: '无'
    },
    childbirth: {
      applicable: '有',
      fullTerm: '0',
      premature: '0',
      abortion: '0',
      alive: '0',
      gravida: '1',
      para: '0',
      details: '',
      lastBirth: '',
      contraception: '未避孕'
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
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
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
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        liverPalpation: '肝肋下未触及，肝区无压痛',
        spleenPalpation: '脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出'
      },
      special_obstetrics: {
        obsExtra1: '宫高、腹围与孕周相符，胎位纵产式',
        obsExtra2: '胎心音可闻及，律齐',
        obsLeopold: '先露已入盆',
        obsContraction: '规律宫缩',
        obsCervix: '宫颈部分消退',
        obsPelvis: '骨盆外测量各径线在正常范围',
        obsEdema: '双下肢无水肿，体重增长在正常范围',
        obsBP: '血压正常，尿蛋白阴性',
        obsBreast: '双侧乳房对称，乳头无凹陷，无红肿及结节',
        obsFetalMovement: '胎动正常，胎心监护反应型'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 112g/L，WBC 9.8×10⁹/L，N 72%，PLT 198×10⁹/L', date: '', hospital: '', no: '' },
        { name: '尿常规', result: '尿蛋白阴性，尿糖阴性，尿酮体阴性', date: '', hospital: '', no: '' },
        { name: '产科超声', result: '宫内单活胎，头位，双顶径9.2cm，股骨长7.1cm，羊水指数12.6cm，胎盘Ⅱ级', date: '', hospital: '', no: '' },
        { name: '胎心监护', result: '反应型，可见加速，无晚期减速及变异减速', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['妊娠38周 G1P0 头位待产', '单活胎']
    }
  }
};
