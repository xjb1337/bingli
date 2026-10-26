module.exports = {
  key: 'preeclampsia',
  dept: 'obstetrics',
  name: '重度子痫前期',
  alias: ['子痫前期', '重度子痫前期', '妊娠期高血压疾病', '妊高症', '妊娠高血压'],
  hint: '孕晚期血压明显升高伴蛋白尿、头痛、视物模糊',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '安徽阜阳',
      birthPlace: '安徽阜阳',
      occupation: '个体经营',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '停经34周，头痛伴视物模糊2天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '停经34周，2天前产检时发现血压160/110mmHg，休息30分钟后复测为155/105mmHg',
      cause: '本次妊娠未规律产检，近1个月工作劳累、睡眠不足，摄盐偏多',
      symptoms: '此后出现持续性头部胀痛，以额枕部为主，伴视物模糊、眼前黑影，无抽搐，无上腹疼痛',
      relief: '卧床休息后头痛稍减轻，但不能完全缓解',
      evolution: '今日自测血压170/112mmHg，头痛加重伴恶心，无呕吐，遂来院',
      accompanying: '伴双下肢水肿，晨起眼睑水肿，尿量较前减少，胎动较前减少',
      negativeDiscriminating: '无抽搐及意识丧失，无右上腹疼痛，无阴道流血及流液，无皮肤瘙痒及黄疸',
      treatment: '昨日起于当地诊所口服拉贝洛尔100mg每日2次，共服4次，血压下降不明显；未用过硫酸镁',
      generalCondition: '发病以来精神差，食欲减退，睡眠差，尿量偏少，近1周体重增加明显',
      extra: ''
    },
    ros: {
      nervous: {
        headache: { checked: true, detail: '持续性额枕部胀痛，休息后不缓解' },
        visualBlur: { checked: true, detail: '视物模糊，眼前黑影' },
        dizziness: { checked: true, detail: '起身时头晕' },
        seizure: { negative: true },
        sleepDisorder: { negative: true },
        tinnitus: { negative: true }
      },
      gi: {
        nausea: { checked: true, detail: '近2天晨起恶心，未呕吐' },
        vomiting: { negative: true },
        abdominalPain: { checked: true, detail: '上腹部隐痛，无绞痛' },
        appetiteLoss: { checked: true, detail: '近1周食欲减退' },
        jaundiceGi: { negative: true },
        diarrhea: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '尿量较前减少，每日约800ml' },
        edemaGu: { checked: true, detail: '双下肢及眼睑水肿' },
        dysuria: { negative: true },
        hematuria: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '活动后心悸' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { checked: true, detail: '双下肢凹陷性水肿' }
      },
      resp: { dyspnea: { negative: true }, cough: { negative: true }, fever: { negative: true } },
      hemat: { bleeding: { negative: true }, bruise: { negative: true }, pallorSkin: { negative: true } },
      endocrine: { weightGain: { checked: true, detail: '近1周体重增加约2kg' }, polydipsia: { negative: true } },
      joint: { backPain: { negative: true }, jointPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认慢性高血压、糖尿病、慢性肾脏病及甲状腺疾病史，孕前及孕早期血压均正常',
      longTermMeds: '现口服拉贝洛尔，无其他长期用药',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '3年前孕1产1，孕期无高血压及蛋白尿，足月顺产一女婴，体健',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '安徽阜阳',
      travel: '否认疫区及传染病接触史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物滥用史',
      environment: '',
      habits: '口味偏咸，每日食盐量较多；近1个月经营店铺劳累，睡眠每日约5小时',
      sexualHistory: '已婚，配偶固定，否认不洁性接触史',
      occupationEnv: '个体经营，无粉尘、毒物及放射线接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: {
      applicable: '有',
      age: '13',
      cycle: '30',
      duration: '5',
      quantity: '中等',
      color: '暗红',
      clot: '无',
      leukorrhea: '量少，色白，无异味',
      lmp: '2024年12月1日，停经至今34周',
      menopauseAge: '',
      dysmenorrhea: '有'
    },
    childbirth: {
      applicable: '有',
      fullTerm: '1',
      premature: '0',
      abortion: '0',
      alive: '1',
      gravida: '2',
      para: '1',
      details: '3年前足月顺产一活女婴，产程顺利，无产后出血',
      lastBirth: '3年前',
      contraception: '工具避孕'
    },
    family: {
      diseaseChecks: { '高血压': true },
      other: '母亲患高血压，长期服药控制',
      deceased: '祖父母已故，死因不详',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有妊娠期高血压疾病患者',
      infectionHistory: '否认结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
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
        eyes: '眼睑水肿',
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
        limbs: '双下肢凹陷性水肿'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出'
      },
      special_obstetrics: {
        obsExtra1: '宫高、腹围与孕周相符，胎位纵产式',
        obsExtra2: '胎心音可闻及，律齐',
        obsLeopold: '宫底为胎臀，胎背位于左侧，先露为头，未入盆',
        obsContraction: '有不规律宫缩',
        obsCervix: '宫颈未消，宫口未开，质地中等，位置居中',
        obsPelvis: '骨盆外测量各径线在正常范围',
        obsEdema: '双下肢凹陷性水肿',
        obsBP: '血压升高伴尿蛋白阳性',
        obsBreast: '双侧乳房对称，乳头无凹陷，无红肿及结节',
        obsFetalMovement: '胎动减少'
      }
    },
    auxiliary: {
      items: [
        { name: '尿常规', result: '尿蛋白（++），24小时尿蛋白定量2.8g，尿红细胞阴性，尿白细胞阴性', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'Hb 108g/L，WBC 9.2×10⁹/L，N 70%，PLT 92×10⁹/L', date: '', hospital: '', no: '' },
        { name: '肝肾功能及电解质', result: 'ALT 68U/L，AST 52U/L，LDH 386U/L，肌酐 96μmol/L，尿酸 486μmol/L，钾 3.9mmol/L', date: '', hospital: '', no: '' },
        { name: '产科超声', result: '宫内单活胎，头位，双顶径8.4cm，股骨长6.5cm，羊水指数9.2cm，胎盘Ⅱ级，胎儿估重约2150g，脐动脉S/D 3.2', date: '', hospital: '', no: '' },
        { name: '胎心监护', result: '反应型，基线145次/分，可见加速，未见晚期减速', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['重度子痫前期', '胎儿生长受限', '妊娠34周 G2P1 头位']
    }
  }
};
