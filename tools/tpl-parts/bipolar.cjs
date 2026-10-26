/* 模板病例：双相情感障碍，目前为躁狂发作
 *
 * 诊断依据按 ICD-10 / DSM-5 的「双相情感障碍、目前为躁狂发作」条目组织
 * （本仓库教材语料无精神科专章，故不标页码）：躁狂发作以情感高涨、思维奔逸、
 * 活动增多（「躁狂三联」）为核心，伴睡眠需要减少、言语增多、注意力随境转移、
 * 行为鲁莽等；双相诊断还需一次或多次既往抑郁发作——本例的抑郁发作史写在
 * 既往史与现病史的诊疗经过里，而不是本次精神检查的阳性项。
 *
 * 写法要点：
 *   ① 主诉只能是症状学描述：「情绪高涨、言语增多」——不能写「躁狂」「双相」。
 *   ② 精神检查必须写出「躁狂三联」三项，且逐字对上 hints.js 里 bipolar 规则的
 *      pev: 值（情感高涨 / 思维奔逸 / 意志增强，活动增多），才能命中诊断提示。
 *   ③ 本例刻意**不写** ros.nervous.moodLow：本次是躁狂相，问「情绪低落」得到的
 *      只是一个阴性答案，写进去反而让病历读起来像抑郁发作；既往抑郁发作已由
 *      现病史的诊疗经过与既往史交代，鉴别线索不会丢。
 *   ④ 甲功必须查：甲亢是躁狂样表现最常见的躯体原因，模板里写出正常结果。
 *   ⑤ 心境稳定剂的血药浓度是双相病历的常规随访项，可写；但量表（YMRS）
 *      只作严重程度与疗效评估，不能写成靠量表确诊。
 */
module.exports = {
  key: 'bipolar',
  dept: 'psychiatry',
  name: '双相情感障碍（目前为躁狂发作）',
  alias: ['双相情感障碍', '双相障碍', '躁狂发作', '躁郁症'],
  hint: '情感高涨、思维奔逸、活动增多（躁狂三联），睡眠需要减少、言行鲁莽',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '湖北武汉',
      birthPlace: '湖北武汉',
      occupation: '个体经营者',
      reliability: '尚可靠',
      // 躁狂患者常夸大、言语滔滔不绝但内容不实，病史需家属补充，故写清陈述者。
      informant: '患者配偶',
      chiefComplaint: '情绪高涨、言语增多2周'
    },
    hpi: {
      onset: '2周前无诱因出现情绪异常高涨，自觉心情特别好，整日兴高采烈',
      // 以「后」结尾，normalizeCause 才会补成「…后起病」。
      cause: '连续熬夜筹办店铺开业后',
      symptoms: '言语明显增多，滔滔不绝，别人插不上话，话题随境转移；自觉脑子转得飞快，想法一个接一个',
      relief: '无缓解方式，夜间仅睡2～3小时仍不觉疲乏',
      evolution: '近1周加重，自认「能力超常」，计划同时开三家分店，4天内刷卡消费十余万元购设备',
      accompanying: '易激惹，家人劝阻即发脾气摔物，但未伤人；食欲亢进，进食量明显增多',
      // 有鉴别意义的阴性：排除器质性、物质所致（甲状腺功能亢进、酒精及兴奋剂）。
      negativeDiscriminating: '无发热、头痛、呕吐及抽搐，无颅脑外伤史，无饮酒及吸食冰毒等物质使用史，无甲状腺疾病史，本次发作前未服用激素及抗抑郁药',
      treatment: '1周前于外院门诊，查甲状腺功能正常，予碳酸锂0.25g每日2次口服、喹硫平0.1g每晚口服，服药不规律，症状未控制',
      generalCondition: '发病以来精神兴奋，睡眠需要明显减少，食欲亢进，体重无明显下降，工作与社交活动显著增多',
      extra: ''
    },
    ros: {
      nervous: {
        // 精神检查之外，系统回顾把「言语增多」「易激惹」这类行为层面表现也问到；
        // moodLow 刻意不写（见文件头第③条）。
        behaviorAbnormal: { checked: true, detail: '四处筹款扩张店铺，夜间外出不归，驾车超速' },
        sleepDisorder: { checked: true, detail: '每夜仅睡2～3小时，醒后精力充沛' },
        hallucination: { negative: true },
        anxiety: { negative: true },
        tremor: { checked: true, detail: '双手细颤，持筷时明显' },
        headache: { negative: true },
        dizziness: { negative: true },
        memoryLoss: { negative: true }
      },
      // 其余系统只写问过的项；未问的整键不写。
      resp: { fever: { negative: true }, cough: { negative: true } },
      cardio: { palpitation: { checked: true, detail: '活动后心悸，休息可缓解' } },
      gi: { appetiteLoss: { negative: true }, vomiting: { negative: true }, abdominalPain: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史，否认甲状腺疾病及颅脑外伤史',
      longTermMeds: '否认长期服用激素、抗抑郁药及其他药物史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认一氧化碳中毒及重金属接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      // 双相诊断的关键依据：必须有一次或多次既往抑郁发作。
      relatedHistory: '3年前曾有一次持续4个月的抑郁发作，表现为情绪低落、兴趣减退、整日卧床，于外院诊断「抑郁发作」并服舍曲林治疗，后自行停药，其间无躁狂或轻躁狂发作',
      otherTreatDiseases: '',
      // 物质使用：精神科必须问到，兴奋剂与酒精都可致躁狂样表现。
      special: '否认长期饮酒史，否认吸食冰毒、大麻等精神活性物质史，否认咖啡因大量摄入'
    },
    personal: {
      residence: '湖北武汉，否认疫区及地方病流行区居住史',
      smoking: '有',
      smokingAmount: '每日约20支，共12年',
      drinking: '已戒',
      drinkingAmount: '戒酒3年，此前每周饮白酒约500ml',
      drugs: '否认吸毒及滥用镇静催眠药物史',
      // habits 会被 generator 原样输出成一行，故这里不重复写病前性格
      // （性格已单列在 premorbidPersonality），只写作息与社交变化。
      habits: '平素作息规律，应酬较多；近2周几乎不眠，夜间外出谈生意，电话不断',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '经营服装店，近1个月筹备新店开业，作息不规律，无粉尘及毒物接触',
      premorbidPersonality: '外向、健谈、精力旺盛，做事急躁、好胜心强，情绪起伏较明显',
      stressEvent: '2周前为筹备新店连续熬夜，与合伙人就资金问题发生争执'
    },
    marriage: { status: '已婚', age: '27', spouseHealth: '配偶体健', relation: '近1个月因消费与投资问题多次争吵' },
    family: {
      // 双相障碍遗传度在精神障碍中最高，家族史必须勾到「精神病」。
      diseaseChecks: { 精神病: true },
      other: '',
      deceased: '父亲因意外事故去世，时年 58 岁',
      threeGeneration: '两系三代否认遗传性疾病病史',
      similarDisease: '父亲生前有「情绪大起大落」表现，未就诊；胞兄有抑郁发作史，服抗抑郁药治疗',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病家族史'
    },
    pe: {
      // 精神科不写生命体征；通用查体除神志外一律不写。
      vitals: {},
      general: { conscious: '神志清楚，精神可' },
      special_psychiatry: {
        psyAppearance: '衣着整洁，接触主动，合作',
        psyOrientation: '定向力完整，意识清晰',
        // 言语增多是躁狂的行为学标志之一。
        psySpeech: '语速增快，言语增多',
        // 思维奔逸：bipolar 规则的 must 之一。
        psyThoughtForm: '思维奔逸',
        psyThoughtContent: '夸大妄想',
        psyPerception: '未引出幻觉',
        // 情感高涨：躁狂三联的第一条。
        psyMood: '情感高涨',
        psyCognition: '记忆、计算与理解力尚可',
        psyInsight: '自知力部分存在',
        // 意志增强，活动增多：躁狂三联的第三条。
        psyBehavior: '意志增强，活动增多'
      }
    },
    auxiliary: {
      items: [
        // 甲功是躁狂样表现最必须排除的躯体原因，结果必须写在病历里。
        { name: '甲状腺功能', result: 'FT3 5.2pmol/L，FT4 17.4pmol/L，TSH 1.6mIU/L，均在正常范围', date: '', hospital: '', no: '' },
        // 心境稳定剂的血药浓度是双相病历的常规随访项。
        { name: '血锂浓度', result: '0.42mmol/L，处于治疗参考范围下限', date: '', hospital: '', no: '' },
        { name: '头颅MRI', result: '脑实质未见异常信号，未见占位性病变', date: '', hospital: '', no: '' },
        { name: '心电图', result: '窦性心动过速，QT间期0.36s，未见明显ST-T改变', date: '', hospital: '', no: '' },
        // 量表只评估躁狂严重程度与疗效，诊断仍依据病史与精神检查。
        { name: '杨氏躁狂评定量表（YMRS）', result: '总分32分，提示明显躁狂症状，供病情评估与随访比较', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['双相情感障碍，目前为躁狂发作', '既往抑郁发作']
    }
  }
};
