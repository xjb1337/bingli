/* 模板病例：胆总管结石伴急性胆管炎
 *
 * 依据《外科学》第10版 p499-524：
 *   肝外胆管结石平时可无症状，结石造成梗阻时出现反复腹痛或黄疸；继发胆管炎时出现
 *   典型的 Charcot 三联征——腹痛、寒战高热、黄疸（p508）。
 *   急性胆管炎剑突下及右上腹有压痛，可有腹膜刺激征；梗阻未解除可进展为
 *   急性梗阻性化脓性胆管炎，出现 Reynolds 五联征（p514）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'cholelith',
  dept: 'surgery',
  name: '胆总管结石伴急性胆管炎',
  alias: ['胆总管结石', '胆管结石', '急性胆管炎', '胆道感染'],
  hint: '右上腹绞痛伴寒战高热与黄疸（Charcot 三联征），Murphy 征阳性',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏徐州',
      birthPlace: '江苏徐州',
      occupation: '个体工商户',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      chiefComplaint: '右上腹绞痛伴寒战发热、皮肤黄染3天'
    },
    hpi: {
      onset: '3天前出现右上腹绞痛，呈阵发性，向右肩背部放射，程度剧烈，难以忍受',
      // 诱因单独一句：写进 onset 会和这里重复，两处都写「进食油腻」就会读成两次发病。
      // 以「后」结尾，normalizeCause 补成「…后起病」。
      cause: '进食油腻食物后',
      symptoms: '持续约半小时后自行缓解，每日发作3～4次，发作时伴恶心、呕吐胃内容物',
      relief: '改变体位及呕吐后无明显缓解，肌内注射解痉药后可短暂减轻',
      evolution: '2天前出现寒战、发热，同日发现皮肤及巩膜黄染，尿色加深如浓茶，腹痛转为持续性胀痛',
      accompanying: '伴皮肤瘙痒，伴尿色加深及大便颜色变浅',
      negativeDiscriminating: '无胸痛及心悸，无呕血及黑便，无腹泻，无尿频尿急尿痛，无意识模糊',
      treatment: '1天前于当地卫生院予头孢曲松2g静脉滴注每日1次、间苯三酚40mg静脉滴注，腹痛稍减轻但仍有发热，为进一步诊治来院',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠差，小便色深，大便色浅，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '右上腹绞痛，向右肩背部放射' },
        nausea: { checked: true, detail: '发作时明显' },
        vomiting: { checked: true, detail: '胃内容物，非喷射性' },
        jaundiceGi: { checked: true, detail: '2天前出现，尿色加深' },
        jaundice: { checked: true, detail: '皮肤及巩膜黄染' },
        appetiteLoss: { checked: true, detail: '进食油腻食物后加重' },
        diarrhea: { negative: true },
        constipation: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true },
        reflux: { negative: true }
      },
      resp: {
        fever: { checked: true, detail: '2天前起，伴寒战' },
        chills: { checked: true, detail: '发热前明显' },
        cough: { negative: true },
        dyspnea: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        chestPainCardio: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        flankPain: { negative: true }
      },
      hemat: {
        bleeding: { negative: true },
        bruise: { negative: true }
      },
      joint: { backPain: { checked: true, detail: '与腹痛同时出现，向右肩背部放射' } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 胆囊结石: true },
      diseaseOther: '',
      diseaseDetail: '胆囊结石5年，间断右上腹隐痛，未手术',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期饮酒及服用肝毒性药物史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏徐州，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '平素喜食油腻食物，早餐常不规律',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '经营店铺，无粉尘及毒物接触'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜黄染',
        rash: '未见皮疹及出血点'
      },
      head: {
        eyes: '巩膜黄染'
      },
      neck: { neckResist: '颈软，无抵抗' },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        // 肝区叩击痛是胆系感染的定位体征，同时命中诊断提示的精确匹配点。
        abdPercussion: '肝区叩击痛',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      special_surgery: {
        surgPeritoneum: '局部压痛伴反跳痛',
        surgAbdomenMass: '腹部未触及包块',
        surgLymph: '引流区域淋巴结未触及肿大'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 126g/L，WBC 18.2×10⁹/L，N 90%，PLT 176×10⁹/L', date: '', hospital: '', no: '' },
        {
          name: '肝功能',
          result: 'TBIL 68μmol/L，DBIL 46μmol/L，ALT 186U/L，AST 132U/L，ALP 268U/L，GGT 412U/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '腹部超声',
          result: '肝外胆管扩张，内径约12mm，管腔内可见强回声伴声影，胆囊壁增厚，胆囊内多发结石',
          date: '', hospital: '', no: ''
        },
        {
          name: 'MRCP',
          result: '胆总管下段见充盈缺损，胆总管及肝内胆管扩张，未见胰管扩张',
          date: '', hospital: '', no: ''
        },
        { name: 'C反应蛋白', result: '148mg/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['胆总管结石伴急性胆管炎', '胆囊结石伴慢性胆囊炎']
    }
  }
};
