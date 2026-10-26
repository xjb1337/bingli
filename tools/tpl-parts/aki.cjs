/* 模板病例：急性肾损伤（肾前性，容量不足所致）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：腹泻导致胃肠道液体丢失、入量不足，有效循环血量下降使肾灌注减少，
 * 出现少尿、肌酐在短期内上升、尿钠降低（肾小管重吸收钠增强）、尿比重升高；
 * 补足容量后尿量恢复、肌酐回落，是肾前性氮质血症可逆的关键证据，
 * 与急性肾小管坏死的鉴别靠补液试验与尿钠、尿渗透压、滤过钠排泄分数。
 */
module.exports = {
  key: 'aki',
  dept: 'nephrology',
  name: '急性肾损伤（肾前性）',
  alias: ['急性肾损伤', '急性肾衰竭', '肾前性氮质血症', 'AKI'],
  hint: '腹泻后少尿、肌酐短期上升，尿钠降低，补液后尿量恢复、肌酐回落',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河南周口',
      birthPlace: '河南周口',
      occupation: '农民',
      reliability: '可靠',
      chiefComplaint: '腹泻3天，尿量减少2天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '3天前食用剩菜后出现腹泻，每日解黄色稀水样便8～10次，量多，无脓血及黏液',
      cause: '起病前有明确不洁饮食史；发病后因恶心纳差几乎未进食，饮水亦少，每日入量不足500ml',
      symptoms: '2天前起尿量明显减少，每日仅排尿1～2次，总量约300～400ml，尿色深黄；伴口干、乏力、头晕，站立时眼前发黑',
      relief: '自行口服蒙脱石散3g每日3次、口服补液盐1袋冲服，腹泻次数减至每日3～4次，尿量无明显增加',
      evolution: '入院前1天几乎无尿，仅约150ml，乏力加重，不能下床活动，由家属送来急诊',
      accompanying: '伴恶心、食欲明显减退、口渴喜冷饮',
      negativeDiscriminating: '无肉眼血尿及尿中泡沫增多，无排尿困难及尿频尿急，无腰痛及肾区叩击痛，无呕吐，无排尿疼痛，无皮疹、关节痛及发热，无水肿，无近期使用非甾体抗炎药、氨基糖苷类及造影剂史，无鱼胆及毒蕈食用史，无剧烈肌痛及酱油色尿',
      treatment: '院外口服蒙脱石散3g每日3次共2天、口服补液盐共3袋，腹泻减轻但尿量未恢复；入院后予0.9%氯化钠注射液静脉补液并监测出入量，未使用利尿剂及肾毒性药物',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠尚可，大便每日3～4次稀水样，体重3天内下降2.5kg',
      extra: '入院后留置导尿准确记录每小时尿量，补液后第1个24小时尿量增至1800ml'
    },
    ros: {
      gi: {
        diarrhea: { checked: true, detail: '每日8～10次黄色稀水样便，量多，无脓血' },
        nausea: { checked: true, detail: '伴恶心，未呕吐' },
        vomiting: { negative: true },
        appetiteLoss: { checked: true, detail: '几乎未进食' },
        abdominalPain: { checked: true, detail: '脐周阵发性隐痛，便后减轻' },
        melena: { negative: true },
        hematochezia: { negative: true },
        jaundiceGi: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '每日尿量300～400ml，入院前1天仅约150ml' },
        hematuria: { negative: true },
        dysuria: { negative: true },
        polyuria: { negative: true },
        nocturia: { negative: true },
        flankPain: { negative: true },
        edemaGu: { negative: true }
      },
      resp: {
        fever: { negative: true },
        chills: { negative: true },
        cough: { negative: true },
        dyspnea: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '站立时心慌' },
        syncope: { checked: true, detail: '起立时眼前发黑，未摔倒' },
        edemaCardio: { negative: true },
        orthopnea: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '体位改变时头晕、眼前发黑' },
        headache: { negative: true },
        insomnia: { negative: true }
      },
      endocrine: {
        polydipsia: { checked: true, detail: '口渴明显，喜冷饮' },
        polyuriaEndo: { negative: true },
        weightLoss: { checked: true, detail: '3天内体重下降2.5kg' }
      },
      hemat: {
        fatigue: { checked: true, detail: '全身乏力，不能下床' }
      },
      joint: {
        muscleWeak: { checked: true, detail: '双下肢无力' },
        jointPain: { negative: true }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、慢性肾脏病、痛风及前列腺增生病史；既往血肌酐正常',
      longTermMeds: '无长期服药史；发病后服蒙脱石散及口服补液盐，否认服非甾体抗炎药、氨基糖苷类抗生素及中草药',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物、鱼胆及毒蕈接触史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认近期造影剂检查史；否认剧烈运动及挤压伤史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于河南周口，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认有毒有害物质接触史',
      environment: '',
      habits: '平时饮水量约1500ml/日，饮食规律；近期因腹泻进食显著减少',
      sexualHistory: '已婚，否认不洁性接触史',
      occupationEnv: '务农，无粉尘及毒物接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        thyroid: '甲状腺无肿大'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音活跃',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        edemaAnkle: '双侧踝部无水肿',
        edemaPretibial: '双侧胫前无水肿'
      },
      special_nephrology: {
        renalFacialEdema: '颜面无水肿，双眼睑无水肿',
        renalLegEdema: '双下肢无水肿',
        renalPercussion: '双肾区无叩击痛',
        renalTenderPoint: '季肋点、上输尿管点、中输尿管点均无压痛',
        renalBladder: '膀胱未触及，耻骨上区无压痛',
        renalCardio: '双肺未闻及湿啰音，未闻及心包摩擦音',
        renalBP: '血压偏低'
      }
    },
    auxiliary: {
      items: [
        { name: '血生化（入院时）', result: '血肌酐 265μmol/L，尿素氮 18.6mmol/L，血钾 3.4mmol/L，血钠 132mmol/L，二氧化碳结合力 20mmol/L；既往体检血肌酐 78μmol/L', date: '', hospital: '', no: '' },
        { name: '尿常规及尿钠', result: '尿比重 1.028，尿蛋白 微量，尿潜血 阴性，未见管型；尿钠 12mmol/L，尿肌酐 8600μmol/L，滤过钠排泄分数 0.6%', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 9.8×10⁹/L，N 72%，Hb 148g/L，HCT 0.48，PLT 226×10⁹/L', date: '', hospital: '', no: '' },
        { name: '泌尿系超声', result: '双肾大小形态正常，皮髓质分界清晰，集合系统未见分离，双侧输尿管未见扩张，膀胱充盈良好，残余尿约20ml', date: '', hospital: '', no: '' },
        { name: '补液后复查血生化', result: '补液第2天尿量 1800ml/24h，血肌酐降至 132μmol/L，尿素氮 9.2mmol/L，血钾 3.9mmol/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性肾损伤（肾前性）', '急性肠炎', '低钾血症']
    }
  }
};
