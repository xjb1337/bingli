module.exports = {
  key: 'ectopic',
  dept: 'gynecology',
  name: '异位妊娠（输卵管妊娠）',
  alias: ['异位妊娠', '宫外孕', '输卵管妊娠', '宫外孕破裂', 'EP'],
  hint: '停经、一侧下腹撕裂样痛、少量阴道流血，宫颈举痛、附件区包块，后穹隆穿刺抽出不凝血',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '停经45天，下腹痛2天，阴道少量流血1天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '平素月经规律，周期28天，末次月经2025年9月10日，停经至今45天未行经；停经38天时自测尿妊娠试验阳性，未行超声检查。2天前搬抬重物后出现右下腹持续性隐痛，阵发性加重',
      cause: '本次妊娠未采取避孕措施，为非计划妊娠；既往人工流产史致输卵管慢性炎症、管腔通而不畅，可诱发本病',
      symptoms: '1天前腹痛由隐痛转为撕裂样剧痛，向肛门及腰骶部放射，站立、咳嗽及排大便时明显加剧，每次持续数十分钟，间歇期仍有坠痛',
      relief: '卧床休息后腹痛无缓解，屈曲卧位可略减轻，服用布洛芬缓释胶囊0.3g后疼痛无明显改善',
      evolution: '腹痛呈持续性并阵发性加剧，入院前6小时疼痛扩散至全下腹，出现头晕、眼前发黑，曾短暂意识丧失约1分钟并自行恢复，此后乏力进行性加重',
      accompanying: '伴肛门坠胀感及里急后重样排便感，伴恶心、呕吐胃内容物2次，伴心慌、出冷汗',
      negativeDiscriminating: '无发热、寒战，无腹泻，无尿频、尿急、尿痛，无呕血及黑便，无外阴瘙痒及阴道异常分泌物，无乳房胀痛及泌乳',
      treatment: '1天前于当地医院就诊，查尿妊娠试验阳性，血β-hCG 2860mIU/ml，经阴道超声示宫腔内未见孕囊、右附件区混合回声包块；予静脉输注复方氯化钠注射液500ml留观，未行手术及输血，腹痛无缓解',
      generalCondition: '发病以来精神差，食欲明显下降，睡眠差，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '右下腹持续性隐痛转为撕裂样剧痛，向肛门及腰骶部放射' },
        nausea: { checked: true, detail: '腹痛发作时恶心明显，进食后加重' },
        vomiting: { checked: true, detail: '呕吐胃内容物2次，量少' },
        constipation: { negative: true },
        diarrhea: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        hematochezia: { negative: true },
        appetiteLoss: { checked: true, detail: '近2天几乎未进食' },
        jaundiceGi: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { checked: true, detail: '近1天尿量偏少，色深' },
        flankPain: { negative: true },
        edemaGu: { negative: true }
      },
      resp: { fever: { negative: true }, cough: { negative: true }, dyspnea: { checked: true, detail: '活动后气促，平卧时明显' } },
      cardio: {
        palpitation: { checked: true, detail: '腹痛加剧时心慌、出冷汗' },
        syncope: { checked: true, detail: '1天前体位改变后短暂意识丧失约1分钟，自行恢复' },
        edemaCardio: { negative: true },
        orthopnea: { negative: true },
        cyanosis: { negative: true }
      },
      hemat: {
        anemia: { checked: true, detail: '口唇、睑结膜及甲床色淡' },
        fatigue: { checked: true, detail: '近1天乏力明显，轻微活动即感疲惫' },
        bleeding: { checked: true, detail: '阴道少量暗红色流血，淋漓不尽' },
        bruise: { negative: true },
        purpura: { negative: true },
        bonePain: { negative: true }
      },
      endocrine: { polyuriaEndo: { negative: true }, weightLoss: { negative: true }, coldIntolerance: { negative: true } },
      nervous: {
        dizziness: { checked: true, detail: '起身时头晕、站立不稳' },
        visualBlur: { checked: true, detail: '头晕时眼前发黑，数秒后缓解' },
        syncopeNerve: { checked: true, detail: '与体位改变相关的短暂意识丧失1次' },
        headache: { negative: true },
        seizure: { negative: true },
        numbness: { negative: true },
        sleepDisorder: { checked: true, detail: '因腹痛及恐惧夜间难以入睡' }
      },
      joint: { backPain: { checked: true, detail: '腰骶部酸胀，与下腹痛同时出现' }, jointPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史；否认盆腔炎性疾病史',
      surgery: '3年前因早孕行人工流产术1次，否认其他手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认不洁性接触史，配偶固定，否认多个性伴侣',
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
      habits: '工作久坐，作息欠规律，近半年有搬抬重物等体力劳动',
      sexualHistory: '已婚，配偶固定，婚后性生活正常，否认不洁性接触史',
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
      leukorrhea: '平素量少，色白，无异味；近1天为少量暗红色血性分泌物',
      lmp: '2025年9月10日，停经至今45天未行经',
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
      details: '3年前人工流产1次，本次为第2次妊娠，孕早期即出现腹痛及阴道流血',
      lastBirth: '',
      contraception: '未避孕'
    },
    family: {
      diseaseChecks: {},
      other: '父母体健',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有异位妊娠及不孕症患者',
      infectionHistory: '否认结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        face: '贫血面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性减退',
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
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '移动性浊音阳性',
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
        gynCervix: '宫颈举痛',
        gynExtra2: '附件区压痛',
        gynAdnexa: '右附件区可触及包块',
        gynAbdomen: '下腹部压痛',
        gynBreast: '双侧乳房对称，未触及肿块，乳头无溢液'
      }
    },
    auxiliary: {
      items: [
        { name: '血β-hCG', result: '2860mIU/ml；48小时前为1980mIU/ml，上升幅度不足66%，倍增时间延长', date: '', hospital: '', no: '' },
        { name: '血清孕酮', result: '8.6ng/ml，低于同孕周正常范围', date: '', hospital: '', no: '' },
        { name: '经阴道超声', result: '宫腔内未见孕囊，子宫内膜厚12mm；右附件区可见3.2cm×2.6cm混合回声包块，边界欠清，其内见无回声区；盆腔游离积液，深约3.5cm，透声差', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'Hb 92g/L，RBC 3.12×10¹²/L，WBC 9.8×10⁹/L，N 71.2%，PLT 236×10⁹/L', date: '', hospital: '', no: '' },
        { name: '后穹隆穿刺', result: '抽出暗红色不凝血5ml，放置6分钟不凝固', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['异位妊娠（右侧输卵管妊娠）', '腹腔内出血', '失血性贫血（中度）']
    }
  }
};
