/* 模板病例：右侧输尿管上段结石伴肾绞痛
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：突发一侧腰腹部绞痛、阵发性加剧、向会阴部放射，伴恶心呕吐与肉眼血尿，
 * 辗转不安、腹软无反跳痛是关键体征（与急腹症鉴别）；
 * 泌尿系 CT 平扫是首选检查，可同时显示结石位置、大小与梗阻积水程度。
 */
module.exports = {
  key: 'stone',
  dept: 'nephrology',
  name: '输尿管结石伴肾绞痛',
  alias: ['输尿管结石', '肾绞痛', '泌尿系结石', '尿石症'],
  hint: '突发一侧腰腹部绞痛向会阴放射，辗转不安，伴血尿，CT 见输尿管结石伴积水',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江西南昌',
      birthPlace: '江西南昌',
      occupation: '货车司机',
      reliability: '可靠',
      chiefComplaint: '突发右侧腰腹部绞痛伴肉眼血尿6小时',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '小时'
    },
    hpi: {
      onset: '6小时前开车途中突发右侧腰部刀割样疼痛，阵发性加剧，难以忍受，坐卧不安、辗转不止',
      cause: '发病前1天长时间驾驶，饮水少、憋尿时间长；既往有泌尿系结石病史',
      symptoms: '疼痛位于右侧腰部，向下腹部及会阴部放射，每次发作持续20～40分钟后稍缓解，间隔十余分钟再次发作；排尿时尿道刺痛，尿色呈洗肉水样',
      relief: '改变体位及热敷不能缓解，疼痛发作时伴大汗',
      evolution: '近2小时疼痛发作更频繁，伴恶心并呕吐2次，为胃内容物',
      accompanying: '伴大汗、心慌',
      negativeDiscriminating: '无发热及寒战，无尿频尿急尿痛，无排便异常及里急后重，无腹泻，无腹肌紧张及反跳痛，无黄疸，无腰背部外伤史，无长期服用磺胺类及过量维生素C史',
      treatment: '急诊予山莨菪碱10mg肌内注射、双氯芬酸钠栓50mg纳肛，疼痛部分缓解；未使用强阿片类镇痛药',
      generalCondition: '发病以来精神紧张，未进食，睡眠缺失，小便量少色深，大便正常，体重无明显变化',
      extra: '急诊完善泌尿系 CT 平扫及尿常规后收入院'
    },
    ros: {
      gu: {
        flankPain: { checked: true, detail: '右侧腰部刀割样绞痛，向会阴部放射' },
        hematuria: { checked: true, detail: '尿色呈洗肉水样' },
        dysuria: { checked: true, detail: '排尿时尿道刺痛' },
        oliguria: { checked: true, detail: '6小时内仅排尿1次，量约150ml' },
        polyuria: { negative: true },
        nocturia: { negative: true }
      },
      gi: {
        nausea: { checked: true, detail: '伴恶心' },
        vomiting: { checked: true, detail: '呕吐2次为胃内容物' },
        abdominalPain: { checked: true, detail: '右下腹牵涉痛，与腰痛相连' },
        diarrhea: { negative: true },
        constipation: { negative: true },
        jaundiceGi: { negative: true },
        appetiteLoss: { checked: true, detail: '疼痛发作期间未进食' }
      },
      resp: {
        fever: { negative: true },
        chills: { negative: true },
        cough: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '疼痛发作时心慌' }
      },
      joint: { backPain: { checked: true, detail: '右侧腰部疼痛，活动受限' } },
      nervous: { dizziness: { checked: true, detail: '疼痛剧烈时头晕' }, headache: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病病史；3年前曾排出结石1枚，未行成分分析；否认反复尿路感染史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认腰背部外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认长期服用磺胺类、乙酰唑胺及过量维生素C、钙剂史；否认痛风及甲状旁腺疾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于江西南昌，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟12年，每日约20支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮啤酒每周3～4次，每次约500ml',
      drugs: '否认有毒有害物质接触史',
      environment: '长期在车内高温环境工作',
      habits: '每日饮水量约800ml，喜食高蛋白及高盐饮食，长时间驾驶常憋尿',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '货运驾驶工作，久坐，饮水不便'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '父亲曾患泌尿系结石',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '强迫体位',
        face: '急性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性良好',
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
        abdAuscultation: '肠鸣音活跃',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '胸腰椎叩击痛'
      },
      special_nephrology: {
        renalPercussion: '右肾区叩击痛',
        renalTenderPoint: '中输尿管点压痛',
        renalBladder: '膀胱未触及，耻骨上区无压痛',
        renalFacialEdema: '颜面无水肿，双眼睑无水肿',
        renalLegEdema: '双下肢无水肿',
        renalBP: '血压正常，双上肢对称'
      }
    },
    auxiliary: {
      items: [
        { name: '泌尿系CT平扫', result: '右侧输尿管上段（L3椎体水平）见一枚直径约0.6cm高密度结石影，其上右肾盂肾盏扩张积水，右肾周脂肪间隙模糊；左肾及膀胱未见异常', date: '', hospital: '', no: '' },
        { name: '尿常规', result: '外观淡红色，尿蛋白 1+，尿潜血 3+，红细胞满视野/HP，白细胞 8～12/HP，未见管型', date: '', hospital: '', no: '' },
        { name: '血常规及肾功能', result: 'WBC 11.2×10⁹/L，N 78%，Hb 148g/L；血肌酐 96μmol/L，尿素氮 6.1mmol/L，尿酸 468μmol/L', date: '', hospital: '', no: '' },
        { name: '泌尿系超声', result: '右肾集合系统分离约1.4cm，右输尿管上段可见强回声伴声影，左肾及膀胱未见异常', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['右侧输尿管上段结石伴右肾积水', '肾绞痛', '高尿酸血症']
    }
  }
};
