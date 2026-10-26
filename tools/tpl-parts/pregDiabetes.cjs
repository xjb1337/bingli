module.exports = {
  key: 'pregDiabetes',
  dept: 'obstetrics',
  name: '妊娠期糖尿病',
  alias: ['妊娠期糖尿病', 'GDM', '妊娠糖尿病', '糖耐量异常（妊娠期）'],
  hint: '孕中期糖耐量试验异常，伴多饮、多尿、胎儿偏大',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南通',
      birthPlace: '江苏南通',
      occupation: '教师',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '停经28周，多饮多尿伴胎儿偏大2周',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '停经24周行75g口服葡萄糖耐量试验，空腹血糖5.6mmol/L，服糖后1小时10.8mmol/L，2小时9.2mmol/L',
      cause: '孕前体重偏重，孕期活动量少，喜食甜食及精制米面，母亲患2型糖尿病',
      symptoms: '近2周自觉口干多饮，每日饮水量约2500ml，夜尿2～3次，尿量增多',
      relief: '控制甜食后口干稍减轻，多尿无明显改善',
      evolution: '孕26周复查空腹血糖5.9mmol/L，餐后2小时血糖8.6mmol/L；孕27周超声提示胎儿腹围大于同孕周第90百分位',
      accompanying: '伴易饥、乏力，无明显消瘦，无外阴瘙痒',
      negativeDiscriminating: '无多食伴体重下降，无恶心呕吐，无腹痛及阴道流血，无头痛及视物模糊，无胎动异常',
      treatment: '孕24周确诊后予医学营养治疗，每日主食控制在200g左右，分5～6餐；孕25周起自测指尖血糖，空腹5.2～5.8mmol/L，餐后2小时7.4～8.6mmol/L，未用胰岛素',
      generalCondition: '发病以来精神可，食欲好，睡眠因夜尿增多受影响，大便正常，孕期体重增长偏多',
      extra: ''
    },
    ros: {
      endocrine: {
        polydipsia: { checked: true, detail: '口干多饮，每日饮水约2500ml' },
        polyuriaEndo: { checked: true, detail: '夜尿2～3次，尿量增多' },
        polyphagia: { checked: true, detail: '易饥，餐后2～3小时即感饥饿' },
        weightLoss: { negative: true },
        weightGain: { checked: true, detail: '孕期体重增长偏多，近1个月增加约2kg' },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true },
        hairChange: { negative: true }
      },
      gu: {
        polyuria: { checked: true, detail: '昼夜尿量均增多，夜尿2～3次' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { negative: true },
        discharge: { checked: true, detail: '白带量稍多，色白，无明显异味' },
        edemaGu: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        appetiteLoss: { negative: true }
      },
      nervous: {
        visualBlur: { negative: true },
        numbness: { checked: true, detail: '偶有双足趾麻木' },
        dizziness: { negative: true },
        headache: { negative: true }
      },
      cardio: { palpitation: { negative: true }, edemaCardio: { negative: true }, chestPainCardio: { negative: true } },
      resp: { fever: { negative: true }, cough: { negative: true }, dyspnea: { negative: true } },
      hemat: { fatigue: { checked: true, detail: '餐前偶感乏力' }, anemia: { negative: true }, pruritus: { negative: true } },
      joint: { jointPain: { negative: true }, backPain: { checked: true, detail: '久站后腰部酸胀' } }
    },
    pmh: {
      health: '平素体健，孕前体重偏重',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、冠心病、慢性肾脏病及甲状腺疾病史，孕前未查过血糖',
      longTermMeds: '孕期服用叶酸至孕3个月、多糖铁复合物，无其他长期用药',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认不良孕产史及既往巨大儿分娩史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南通',
      travel: '否认疫区及传染病接触史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物滥用史',
      environment: '',
      habits: '喜甜食及精制米面，孕前每日久坐超过8小时，孕期活动量偏少',
      sexualHistory: '已婚，配偶固定，否认不洁性接触史',
      occupationEnv: '中学教师，无粉尘、毒物及放射线接触'
    },
    marriage: { status: '已婚', age: '30', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: {
      applicable: '有',
      age: '14',
      cycle: '32',
      duration: '5',
      quantity: '中等',
      color: '暗红',
      clot: '无',
      leukorrhea: '量稍多，色白，无异味',
      lmp: '2025年4月12日，停经至今28周',
      menopauseAge: '',
      dysmenorrhea: '无'
    },
    childbirth: {
      applicable: '有',
      fullTerm: '0',
      premature: '0',
      abortion: '1',
      alive: '0',
      gravida: '2',
      para: '0',
      details: '4年前孕7周自然流产1次，行清宫术，术后恢复可',
      lastBirth: '',
      contraception: '未避孕'
    },
    family: {
      diseaseChecks: { '糖尿病': true, '高血压': true },
      other: '母亲患2型糖尿病12年，口服二甲双胍控制；父亲患高血压',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲有妊娠期糖尿病史',
      infectionHistory: '否认结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '肥胖',
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
        obsExtra1: '宫高与孕周不符',
        obsExtra2: '胎心音可闻及，律齐',
        obsLeopold: '宫底为胎臀，胎背位于左侧，先露为头，未入盆',
        obsContraction: '无规律宫缩，子宫无压痛',
        obsCervix: '宫颈未消，宫口未开，质地中等，位置居中',
        obsPelvis: '骨盆外测量各径线在正常范围',
        obsEdema: '双下肢无水肿，体重增长在正常范围',
        obsBP: '血压正常，尿蛋白阴性',
        obsBreast: '双侧乳房对称，乳头无凹陷，无红肿及结节',
        obsFetalMovement: '胎动正常，胎心监护反应型'
      }
    },
    auxiliary: {
      items: [
        { name: '75g口服葡萄糖耐量试验', result: '空腹5.6mmol/L，服糖后1小时10.8mmol/L，服糖后2小时9.2mmol/L', date: '', hospital: '', no: '' },
        { name: '空腹及餐后血糖', result: '空腹5.9mmol/L，早餐后2小时8.6mmol/L，午餐后2小时7.8mmol/L', date: '', hospital: '', no: '' },
        { name: '糖化血红蛋白', result: '5.8%', date: '', hospital: '', no: '' },
        { name: '尿常规', result: '尿蛋白阴性，尿糖（+），尿酮体阴性', date: '', hospital: '', no: '' },
        { name: '产科超声', result: '宫内单活胎，头位，双顶径7.4cm，腹围26.8cm，股骨长5.3cm，羊水指数16.2cm，胎盘Ⅰ级，胎儿估重约1480g，腹围大于同孕周第90百分位', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['妊娠期糖尿病', '妊娠28周 G2P0 头位', '胎儿偏大（大于同孕周第90百分位）']
    }
  }
};
