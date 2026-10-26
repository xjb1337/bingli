/* 模板病例：吉兰-巴雷综合征（急性炎性脱髓鞘性多发性神经病）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：前驱感染后 1～3 周起病，对称性弛缓性肢体无力由下肢向上进展，
 * 腱反射减弱或消失、可有手套袜套样感觉减退、病理反射阴性；
 * 脑脊液蛋白-细胞分离与神经传导速度减慢支持诊断；
 * 最危险的是呼吸肌麻痹与自主神经不稳定，入院后要盯着肺活量。
 */
module.exports = {
  key: 'gb',
  dept: 'neurology',
  name: '吉兰-巴雷综合征',
  alias: ['吉兰-巴雷综合征', '格林巴利综合征', 'GBS', '急性炎性脱髓鞘性多发性神经病', 'AIDP'],
  hint: '前驱感染后对称性弛缓性肢体无力，腱反射消失，脑脊液蛋白-细胞分离',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '安徽合肥',
      birthPlace: '安徽合肥',
      occupation: '建筑工人',
      reliability: '可靠',
      chiefComplaint: '双下肢无力进行性加重5天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '5天前晨起觉双足发麻、走路发飘，当日仍能坚持上班；次日出现双下肢无力，上楼需扶栏杆',
      cause: '发病前2周有腹泻3天，每日排稀水样便4～5次，未服药自愈；未查大便常规',
      symptoms: '无力自双足开始，对称性向上发展，现双下肢仅能在床面平移、不能抬离床面；持物时双手亦觉乏力，梳头、拧毛巾费力；四肢发麻呈手套袜套样分布，远端明显',
      relief: '卧床休息无缓解',
      evolution: '症状逐日加重，5天内由能独立行走发展至需人搀扶，近1天出现起床费力、抬头稍感吃力',
      accompanying: '伴双小腿肌肉酸痛',
      negativeDiscriminating: '无肢体抽搐，无视力下降及视物成双，无吞咽困难及饮水呛咳，无言语不清，无大小便失禁，无发热及头痛，无皮疹',
      treatment: '当地医院予维生素B1、甲钴胺口服3天，症状仍进行性加重，遂转我院',
      generalCondition: '发病以来神志清楚，食欲尚可，睡眠一般，小便正常，大便3日未解，体重无明显变化',
      extra: '入院后监测肺活量，完善肌电图与腰椎穿刺'
    },
    ros: {
      nervous: {
        weakness: { checked: true, detail: '双下肢无力进行性加重，双上肢亦觉乏力' },
        numbness: { checked: true, detail: '四肢末端手套袜套样麻木' },
        speech: { negative: true },
        visualBlur: { negative: true },
        headache: { negative: true },
        seizure: { negative: true },
        tremor: { negative: true },
        incontinence: { negative: true },
        vertigo: { negative: true },
        hearingLoss: { negative: true }
      },
      gi: {
        diarrhea: { checked: true, detail: '发病前2周腹泻3天，每日4～5次稀水样便' },
        constipation: { checked: true, detail: '近3日未解大便' },
        vomiting: { negative: true },
        abdominalPain: { negative: true }
      },
      resp: {
        fever: { negative: true },
        dyspnea: { negative: true },
        cough: { negative: true }
      },
      cardio: { palpitation: { checked: true, detail: '偶觉心慌，未测心率' } },
      joint: { muscleWeak: { checked: true, detail: '双小腿肌肉酸痛' } }
    },
    pmh: {
      health: '平素体健，可从事重体力劳动',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、甲状腺疾病病史；否认反复手足麻木病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史；发病前2周有腹泻史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认有机磷农药、重金属及一氧化碳接触史；近期未食用来源不明食物',
      vaccine: '按计划预防接种；近3个月未接种疫苗',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认长期饮酒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于安徽合肥，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟15年，每日约15支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮白酒每周2次，每次约150ml',
      drugs: '否认有毒有害物质接触史',
      environment: '工作场所通风一般',
      habits: '在外就餐较多，饮水以瓶装水及自来水为主',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '建筑工地作业，粉尘接触较多，无放射性物质接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        conscious: '神志清楚，精神一般',
        posture: '被动体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
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
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        limbMuscle: '双上肢肌力正常、双下肢肌力减退'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        tendonReflex: '腱反射普遍减弱',
        babinski: '巴氏征阴性',
        kernig: '克氏征阴性'
      },
      special_neurology: {
        neuroExtra1: '言语流利，定向力、记忆力、计算力正常',
        neuroExtra2: '十二对颅神经检查未见异常',
        neuroExtra3: '肌张力减低',
        neuroExtra4: '手套袜套样感觉减退',
        neuroExtra5: '指鼻试验、跟膝胫试验稳准，Romberg征阴性',
        neuroSuperficialReflex: '腹壁反射、提睾反射存在且对称',
        neuroDeepReflex: '深反射消失',
        neuroPathologic: 'Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性',
        neuroMeningeal: '颈项强直阴性，Kernig征阴性，Brudzinski征阴性',
        neuroGait: '步态正常，行走平稳'
      }
    },
    auxiliary: {
      items: [
        { name: '腰椎穿刺（脑脊液）', result: '初压140mmH₂O，外观清亮，白细胞5×10⁶/L，蛋白1.2g/L，葡萄糖3.6mmol/L，氯化物123mmol/L，蛋白-细胞分离', date: '', hospital: '', no: '' },
        { name: '肌电图及神经传导速度', result: '双侧腓总神经、胫神经运动传导速度减慢至32～36m/s，远端潜伏期延长，F波潜伏期延长；感觉神经动作电位波幅下降', date: '', hospital: '', no: '' },
        { name: '血常规及电解质', result: 'WBC 7.2×10⁹/L，N 62%，Hb 138g/L，K⁺ 3.8mmol/L，Na⁺ 138mmol/L', date: '', hospital: '', no: '' },
        { name: '粪便常规及培养', result: '白细胞0～2/HP，培养未见沙门菌及志贺菌生长', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['吉兰-巴雷综合征（急性炎性脱髓鞘性多发性神经病）']
    }
  }
};
