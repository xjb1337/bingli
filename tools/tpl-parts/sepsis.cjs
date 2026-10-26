/* 模板病例：脓毒症（脓毒性休克早期 / 胆道感染来源）
 *
 * 教材依据：《外科学》第10版 第五章 外科休克 p67-88（感染性休克的临床分期与监测）
 *   - 休克代偿期：精神紧张、兴奋或烦躁不安、皮肤苍白、四肢厥冷、心率加快、脉压减小、呼吸加快、尿量减少
 *   - 休克失代偿期：神情淡漠、反应迟钝，甚至意识模糊或昏迷；出冷汗、口唇肢端发绀；脉搏细速、血压进行性下降
 *   - 精神状态是脑灌注的反映：表情淡漠、不安、谵妄、嗜睡、昏迷提示脑循环障碍
 *   - 脓毒症 qSOFA：感染灶 + 心率增快、呼吸急促、意识改变
 * 教科书病例为「胆道感染继发脓毒症」，故科室取急诊/ICU。
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 */
module.exports = {
  key: 'sepsis',
  dept: 'emergency',
  name: '脓毒症（胆道感染继发）',
  alias: ['脓毒症', 'sepsis', '全身感染', '脓毒性休克', '感染性休克'],
  hint: '寒战高热伴右上腹痛、意识淡漠、呼吸急促 —— 感染灶继发脓毒症，需警惕脓毒性休克',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '山东潍坊',
      birthPlace: '山东潍坊',
      occupation: '农民',
      reliability: '家属代诉，基本可靠',
      chiefComplaint: '寒战、高热伴右上腹疼痛',
      chiefComplaintDuration: '3',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '3天前进食油腻食物后出现右上腹持续性胀痛，2小时后出现寒战、高热，体温最高40.1℃，伴恶心、呕吐胃内容物2次',
      cause: '起病前1天曾进食大量油炸食物，既往有胆囊结石病史5年，间断右上腹不适',
      symptoms: '腹痛为持续性胀痛，向右肩背部放射，无缓解体位；寒战与高热交替，热退时大汗淋漓；尿量较平日减少，色深黄',
      relief: '自服布洛芬混悬液10ml后体温可暂降至38.5℃，约3小时后复升，腹痛无缓解',
      evolution: '近12小时精神明显转差，由烦躁转为嗜睡，呼之能应但答话迟缓，家属诉其「说胡话」一次；呼吸逐渐急促',
      accompanying: '伴口干、皮肤湿冷，无呕血、黑便，无胸痛咳嗽',
      negativeDiscriminating: '无胸痛及咯血，无腹泻及里急后重，无皮肤黄染，无尿频尿急尿痛，无头痛呕吐及肢体抽搐',
      treatment: '2天前于当地卫生院静滴头孢呋辛1.5g每日2次、补液500ml，症状无缓解；昨日加用地塞米松5mg静推1次，体温短暂下降后复升',
      generalCondition: '发病以来精神差，由烦躁渐转为嗜睡，食欲明显下降，近24小时尿量约400ml，大便未解',
      extra: ''
    },
    ros: {
      resp: {
        chills: { checked: true, detail: '寒战与高热交替，热退时大汗' },
        fever: { checked: true, detail: '体温最高40.1℃，3天' },
        dyspnea: { checked: true, detail: '近12小时呼吸急促，稍活动即感气短' },
        cough: { negative: true },
        sputum: { negative: true },
        chestPainResp: { negative: true },
        hemoptysis: { negative: true }
      },
      gi: {
        abdominalPain: { checked: true, detail: '右上腹持续性胀痛，向右肩背部放射' },
        nausea: { checked: true, detail: '恶心，呕吐胃内容物2次' },
        vomiting: { checked: true, detail: '呕吐胃内容物2次，非喷射性' },
        jaundiceGi: { negative: true },
        diarrhea: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true },
        appetiteLoss: { checked: true, detail: '食欲明显下降，3天几乎未进食' }
      },
      cardio: {
        palpitation: { checked: true, detail: '心跳加快，自觉心慌' },
        chestPainCardio: { negative: true },
        syncope: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '近24小时尿量约400ml，色深黄' },
        dysuria: { negative: true },
        hematuria: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '起身时头晕，家属诉其答话迟缓' },
        headache: { negative: true },
        seizure: { negative: true },
        weakness: { checked: true, detail: '全身乏力，四肢无力' }
      },
      joint: { jointPain: { negative: true } },
      hemat: { bleeding: { negative: true }, bruise: { negative: true } }
    },
    pmh: {
      health: '平时体健，近5年反复右上腹不适',
      diseaseChecks: { '胆囊结石': true, '糖尿病': true },
      diseaseDetail: '2型糖尿病6年，平素口服二甲双胍0.5g每日2次，空腹血糖波动于8～11mmol/L，未规律监测',
      longTermMeds: '二甲双胍0.5g每日2次口服，服法规律',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期饮酒史，否认胆道手术史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于山东潍坊，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '母乳喂养',
      growth: '生长发育与同龄人相仿',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒物及有机磷农药接触史',
      environment: '',
      habits: '喜食油腻，饮食不规律，体力活动少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '田间劳动，无粉尘及射线接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有胆道疾病及糖尿病患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
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
        lungInspect: '呼吸浅快',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      special_emergency: {
        emExtra1: '休克表现',
        emConscious: '神志清楚，双侧瞳孔等大等圆，对光反射灵敏',
        emAirway: '气道通畅，呼吸平稳，双肺呼吸音对称',
        emCirculation: '脉搏细速',
        emShock: '休克指数0.5～1.0',
        emSkin: '皮肤湿冷',
        emAbdomen: '腹部压痛'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规+CRP+PCT', result: 'WBC 21.4×10⁹/L，N 89%，Hb 128g/L，PLT 112×10⁹/L；CRP 186mg/L；PCT 12.4ng/ml', date: '', hospital: '', no: '' },
        { name: '血培养（抗菌药物使用前）', result: '需氧瓶培养48小时报告革兰阴性杆菌生长，后鉴定为大肠埃希菌，对头孢曲松敏感', date: '', hospital: '', no: '' },
        { name: '肝功能与胆道酶学', result: 'ALT 96U/L，AST 82U/L，总胆红素 24.6μmol/L，直接胆红素 12.1μmol/L，ALP 168U/L，GGT 214U/L', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '胆囊 92mm×38mm，壁厚 5mm 呈双边，腔内可见多枚强回声伴声影，最大约 12mm；胆总管上段轻度扩张，直径 7mm', date: '', hospital: '', no: '' },
        { name: '动脉血气分析+乳酸', result: 'pH 7.31，PaO₂ 68mmHg，PaCO₂ 31mmHg，HCO₃⁻ 18mmol/L，乳酸 4.8mmol/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['脓毒症（胆道感染继发）', '急性结石性胆囊炎', '2型糖尿病']
    }
  }
};
