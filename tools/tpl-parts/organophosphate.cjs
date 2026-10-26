/* 模板病例：急性有机磷农药中毒（中度，胆碱能危象）
 *
 * 教材依据：《内科学》第10版 第九篇 理化因素所致疾病 → 第二章 中毒（p906-953），
 *           有机磷杀虫药中毒专节 p921 起
 *   - 中毒机制：OPI 与胆碱酯酶结合形成磷酰化胆碱酯酶，Ach 蓄积于神经末梢，
 *     出现毒蕈碱样（M 样）、烟碱样（N 样）和中枢神经系统症状（p921）
 *   - 毒蕈碱样：瞳孔缩小、腹痛、腹泻；腺体分泌增加 → 大汗、流泪、流涎；
 *     气道分泌物增多 → 咳嗽、气促、呼吸困难、双肺干湿性啰音（p921-922）
 *   - 烟碱样：肌颤、肌力减退，呼吸肌麻痹可致呼吸衰竭；交感兴奋 → 血压增高、心律失常（p922）
 *   - 中枢：头晕、头痛、烦躁、谵妄、抽搐和昏迷（p922）
 *   - 诊断依据：OPI 暴露史 + 呼出气大蒜味、瞳孔缩小、多汗、肺水肿、肌纤颤（p922）
 *   - 分级：全血胆碱酯酶活性 30%～50% 为中度、30% 以下为重度（p922）
 *   - 治疗：洗消（5% 碳酸氢钠或肥皂水）+ 阿托品/盐酸戊乙奎醚 + 氯解磷定（p915、p924）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 * 说明：schema 的 head.eyes / special_emergency.emConscious 两个下拉里都没有
 *        「瞳孔缩小」这一项，故针尖样瞳孔写在现病史、系统回顾与辅助检查文字中。
 */
module.exports = {
  key: 'organophosphate',
  dept: 'emergency',
  name: '急性有机磷农药中毒（中度）',
  alias: ['有机磷中毒', '有机磷农药中毒', '农药中毒', '胆碱能危象', 'organophosphate'],
  hint: '喷洒有机磷农药后恶心呕吐、大汗流涎、肌纤维颤动、瞳孔针尖样缩小、呼气大蒜味 —— 急性有机磷中毒胆碱能危象',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河北邯郸',
      birthPlace: '河北邯郸',
      occupation: '农民',
      reliability: '家属代诉，基本可靠',
      chiefComplaint: '喷洒农药后恶心、呕吐伴大汗、全身肌肉跳动',
      chiefComplaintDuration: '5',
      chiefComplaintDurationUnit: '小时'
    },
    hpi: {
      onset: '5小时前于田间喷洒对硫磷乳油约2小时，未戴口罩及手套、着短袖，喷洒结束后1小时出现头晕、恶心，继而呕吐胃内容物3次，全身大汗、流涎不止',
      cause: '喷洒有机磷杀虫药（对硫磷）期间经皮肤及呼吸道接触，防护不规范，药液曾溅及前臂皮肤',
      symptoms: '头晕、视物模糊，双上肢先出现细小肌肉跳动，逐渐波及面肌及双下肢，呈持续性；伴胸闷、气促、口涎外流，内衣被汗浸透；无肢体抽搐及二便失禁',
      relief: '脱离田间后于通风处休息、更换衣物并用清水冲洗前臂，症状无缓解，出汗及肌跳反而加重',
      evolution: '近2小时精神转差，由烦躁转为思睡，呼之能应、答话迟缓；气促加重，咳大量白色泡沫痰，家属发现其呼出气有大蒜样臭味，遂送我院',
      accompanying: '伴腹痛、脐周阵发性绞痛，腹泻稀水样便2次；无发热，无胸痛及咯血，无偏瘫及言语不能',
      negativeDiscriminating: '无进食不洁食物及同餐者发病，无发热寒战及里急后重，无胸痛咯血，无头痛呕吐及肢体抽搐，无药物过敏史，无中暑环境暴露',
      treatment: '入院前未用阿托品、氯解磷定等解毒药物，仅于当地诊所静脉输注葡萄糖注射液250ml及维生素C 2g，症状无缓解',
      generalCondition: '发病以来精神差，思睡，食欲未进，小便1次量少色黄，大便稀水样2次'
    },
    ros: {
      resp: {
        dyspnea: { checked: true, detail: '胸闷、气促，活动后加重，咳白色泡沫痰' },
        sputum: { checked: true, detail: '咳大量白色泡沫痰，不能平卧' },
        cough: { checked: true, detail: '阵发性咳嗽，咳泡沫痰' },
        wheeze: { checked: true, detail: '自觉喉中有痰鸣音' },
        chestPainResp: { negative: true },
        hemoptysis: { negative: true },
        fever: { negative: true },
        chills: { negative: true }
      },
      gi: {
        nausea: { checked: true, detail: '恶心明显，反复干呕' },
        vomiting: { checked: true, detail: '呕吐胃内容物3次，非喷射性' },
        abdominalPain: { checked: true, detail: '脐周阵发性绞痛' },
        diarrhea: { checked: true, detail: '稀水样便2次，无脓血' },
        melena: { negative: true },
        hematemesis: { negative: true },
        jaundiceGi: { negative: true },
        appetiteLoss: { checked: true, detail: '发病后未进食，口干明显' }
      },
      cardio: {
        palpitation: { checked: true, detail: '心慌、心跳加快' },
        chestPainCardio: { negative: true },
        orthopnea: { checked: true, detail: '平卧时气促加重，需垫高枕头' },
        syncope: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '5小时仅排尿1次，量少色黄' },
        nocturia: { negative: true },
        dysuria: { negative: true },
        hematuria: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '头晕，起身及活动时加重' },
        visualBlur: { checked: true, detail: '视物模糊，看东西发花，瞳孔针尖样缩小' },
        tremor: { checked: true, detail: '双上肢及面肌细小肌肉跳动，持续不止' },
        weakness: { checked: true, detail: '四肢乏力，持物无力' },
        headache: { checked: true, detail: '额部胀痛，程度轻' },
        seizure: { negative: true },
        speech: { negative: true },
        numbness: { negative: true }
      },
      hemat: {
        bleeding: { negative: true },
        bruise: { negative: true }
      },
      endocrine: {
        neckMass: { negative: true }
      }
    },
    pmh: {
      health: '平素体健，长期务农，无慢性病长期用药',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病、慢性阻塞性肺疾病及肝肾疾病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血及输血反应史',
      poisoning: '5小时前喷洒有机磷杀虫药（对硫磷）时经皮肤及呼吸道接触，未规范防护；否认其他毒物及药物过量接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期饮酒及吸烟史；近1周未服用抗胆碱能药物及镇静药物',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于河北邯郸，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '',
      growth: '生长发育与同龄人相仿',
      smoking: '无',
      drinking: '无',
      drugs: '否认药物滥用及毒物长期接触史',
      environment: '',
      habits: '长期田间务农，喷洒农药时未佩戴口罩、手套及长袖衣物',
      sexualHistory: '',
      occupationEnv: '从事农业劳动20余年，每年喷洒有机磷农药数次，防护不规范'
    },
    marriage: { status: '已婚', age: '23', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有血液病及肿瘤患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '嗜睡',
        posture: '自主体位',
        face: '急性病容',
        cooperation: '查体欠合作'
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
        lungInspect: '呼吸浅快',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺可闻及湿性啰音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
        heartPalpation: '心尖搏动无抬举性，未触及震颤',
        heartPercussion: '心界不大',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音活跃',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      special_emergency: {
        emExtra1: 'GCS评分下降',
        emExtra2: '全身未见明显创伤',
        emConscious: '嗜睡',
        emAirway: '呼吸困难',
        emCirculation: '脉搏细速',
        emShock: '休克指数<0.5，末梢循环良好',
        emTraumaABC: '按ABCDE顺序评估，各环节未见致命性损伤',
        emTraumaSurvey: '头、颈、胸、腹、脊柱、骨盆及四肢系统筛查未见异常',
        emSkin: '皮肤湿冷',
        emAbdomen: '腹部压痛'
      }
    },
    auxiliary: {
      items: [
        { name: '全血胆碱酯酶活性', result: '胆碱酯酶 420U/L（相当于正常参考值的 36%），提示中度抑制', date: '', hospital: '', no: '' },
        { name: '血常规+CRP', result: 'WBC 13.8×10⁹/L，N 84%，Hb 142g/L，PLT 216×10⁹/L；CRP 22mg/L', date: '', hospital: '', no: '' },
        { name: '动脉血气分析', result: 'pH 7.28，PaO₂ 56mmHg，PaCO₂ 48mmHg，HCO₃⁻ 22mmol/L，提示Ⅱ型呼吸衰竭', date: '', hospital: '', no: '' },
        { name: '胸部CT', result: '双肺弥漫磨玻璃影及斑片状渗出，以中下肺野为著，提示肺水肿', date: '', hospital: '', no: '' },
        { name: '心电图', result: '窦性心动过速，未见ST-T动态改变及心律失常', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性有机磷农药中毒（中度，胆碱能危象）', '急性肺水肿', 'Ⅱ型呼吸衰竭']
    }
  }
};
