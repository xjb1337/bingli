/* 模板病例：消化性溃疡（十二指肠球部溃疡）—— 标准样例
 *
 * 这份是「管网管 6 个模板里的样板」，其余病种照它的密度与写法写。
 * 原则：只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 */
module.exports = {
  key: 'pud',
  dept: 'digestive',
  name: '消化性溃疡（十二指肠球部溃疡）',
  alias: ['十二指肠溃疡', '胃溃疡', '消化性溃疡', 'DU', 'GU'],
  hint: '慢性、周期性、节律性上腹痛，空腹痛、夜间痛，进食后缓解',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '反复上腹部疼痛',
      chiefComplaintDuration: '2',
      chiefComplaintDurationUnit: '年'
    },
    hpi: {
      onset: '2年前无明显诱因出现上腹部疼痛，位于剑突下偏右，呈烧灼样，程度中等，可忍受',
      cause: '多于季节交替、劳累及精神紧张时发作，进食辛辣食物后可诱发',
      symptoms: '疼痛多于餐后2～4小时出现，即空腹及夜间明显，进食或服用抗酸药后可缓解，每次持续约半小时至1小时，每周发作2～3次',
      relief: '进食、服用奥美拉唑后可缓解',
      evolution: '近1个月发作较前频繁，疼痛程度加重，夜间常被痛醒',
      accompanying: '伴反酸、嗳气，无恶心呕吐',
      negativeDiscriminating: '无呕血、黑便，无发热、黄疸，无体重明显下降',
      treatment: '曾于当地医院查胃镜示「十二指肠球部溃疡」，予奥美拉唑20mg每日1次口服，疗程6周，服药期间症状缓解，停药后复发',
      generalCondition: '发病以来精神、食欲尚可，睡眠因夜间疼痛受影响，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '剑突下偏右烧灼样痛，空腹痛、夜间痛' },
        reflux: { checked: true, detail: '伴反酸、嗳气' },
        nausea: { negative: true },
        vomiting: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        jaundiceGi: { negative: true },
        appetiteLoss: { negative: true }
      },
      hemat: {
        fatigue: { negative: true },
        pallorSkin: { negative: true }
      },
      resp: { fever: { negative: true } },
      cardio: { palpitation: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期服用非甾体抗炎药及糖皮质激素史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟10年，每日约10支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮白酒每周2～3次，每次约100ml',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '饮食不规律，工作压力较大',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '27', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: { eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏' },
      neck: { neckVessel: '颈静脉无充盈，颈动脉无异常搏动' },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性'
      },
      special_digestive: {
        giTenderness: '上腹部压痛',
        giRebound: '全腹无反跳痛，腹肌柔软',
        giLiverPalp: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
        giBowelSound: '未闻及振水音及血管杂音'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 128g/L，WBC 6.8×10⁹/L，N 63%，PLT 210×10⁹/L', date: '', hospital: '', no: '' },
        { name: '粪便隐血', result: '阴性', date: '', hospital: '', no: '' },
        { name: '胃镜', result: '十二指肠球部前壁可见一直径约1.0cm溃疡，覆白苔，周边黏膜充血水肿，球部变形；胃窦黏膜轻度充血', date: '', hospital: '', no: '' },
        { name: '幽门螺杆菌检测（13C尿素呼气试验）', result: '阳性，DOB 18.6', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['十二指肠球部溃疡（活动期，A1期）', '幽门螺杆菌感染', '慢性非萎缩性胃炎']
    }
  }
};