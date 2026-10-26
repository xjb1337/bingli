/* 模板病例：缺铁性贫血（重度）
 *
 * 教材依据：《内科学》第10版 第六篇 血液系统疾病 第三章 缺铁性贫血 p580-583
 *   - 贫血表现：乏力、易疲倦、头晕、头痛、眼花、耳鸣、心悸、气短、食欲缺乏；皮肤黏膜苍白、心率增快
 *   - 组织缺铁表现：烦躁易怒、注意力不集中、异食癖；体力耐力下降；易感染；
 *     口腔炎、舌炎、舌乳头萎缩、口角皲裂、吞咽困难；毛发干枯脱落；皮肤干燥皱缩；指/趾甲变平下凹呈匙状甲
 *   - 实验室：小细胞低色素（MCV<80fl、MCH<27pg、MCHC<320g/L）；骨髓「核老浆幼」；血清铁、铁蛋白降低
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 */
module.exports = {
  key: 'anemia',
  dept: 'hematology',
  name: '缺铁性贫血（重度）',
  alias: ['缺铁性贫血', 'IDA', '小细胞低色素性贫血', '营养性缺铁性贫血'],
  hint: '乏力、头晕、面色苍白，小细胞低色素性贫血伴铁蛋白降低 —— 缺铁性贫血',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河北保定',
      birthPlace: '河北保定',
      occupation: '纺织厂工人',
      reliability: '可靠',
      chiefComplaint: '乏力、头晕伴面色苍白',
      chiefComplaintDuration: '3',
      chiefComplaintDurationUnit: '月'
    },
    hpi: {
      onset: '3个月前无明显诱因出现乏力，劳累后加重，休息后可稍缓解，未予重视',
      cause: '平素以素食为主，长期饮浓茶，无偏食及异食癖，无长期服用非甾体抗炎药史',
      symptoms: '乏力逐渐加重，伴头晕、眼花、耳鸣，登二层楼即感心悸、气短；同事发现其面色渐苍白，指甲变平',
      relief: '卧床休息后头晕可稍减轻，未曾服用铁剂以外的补血药物',
      evolution: '近半个月乏力明显加重，日常家务亦感吃力，双踝部出现轻度水肿，晨轻暮重',
      accompanying: '伴注意力不集中、易烦躁，偶有口角皲裂，进食固体食物时感吞咽不畅',
      negativeDiscriminating: '无黑便、呕血，无牙龈出血及皮肤瘀斑，无发热、盗汗，无体重明显下降',
      treatment: '2个月前于当地医院查血常规示血红蛋白78g/L，自行服用琥珀酸亚铁0.1g每日3次口服，疗程4周，服药后头晕稍好转，未复查血常规',
      generalCondition: '发病以来精神稍差，食欲欠佳，睡眠一般，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      hemat: {
        anemia: { checked: true, detail: '活动后乏力、面色苍白3个月' },
        fatigue: { checked: true, detail: '易疲倦，登二层楼即感心悸气短' },
        pallorSkin: { checked: true, detail: '同事发现面色渐苍白，甲床色淡' },
        bleeding: { negative: true },
        bruise: { negative: true },
        epistaxis: { negative: true },
        transfusion: { negative: true }
      },
      resp: { dyspnea: { checked: true, detail: '活动后气短' } },
      cardio: { palpitation: { checked: true, detail: '活动后心悸' } },
      gi: {
        appetiteLoss: { checked: true, detail: '食欲欠佳，进食量较前减少约三分之一' },
        melena: { negative: true },
        hematemesis: { negative: true },
        diarrhea: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '起身及劳累时头晕、眼花' },
        tinnitus: { checked: true, detail: '双耳间歇性低调耳鸣' }
      },
      endocrine: { weightLoss: { negative: true } },
      gu: { hematuria: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史，否认痔疮及消化性溃疡病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射性物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期饮浓茶外的其他偏嗜，否认消化道息肉及肿瘤家族史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于河北保定，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '婴幼儿期母乳喂养，辅食添加较晚',
      growth: '生长发育与同龄人相仿',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '素食10余年，每日饮浓茶约1000ml，饮食结构单一',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '纺织车间工作，有棉尘接触，无放射性物质接触'
    },
    marriage: { status: '已婚', age: '31', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: { applicable: '否' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有类似贫血患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神可',
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
        hair: '毛发稀疏',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        teeth: '口腔黏膜无溃疡，舌质淡红、苔薄白'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        thyroid: '甲状腺无肿大',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心尖区可闻及收缩期杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '双下肢凹陷性水肿'
      },
      special_hematology: {
        hemAnemia: '睑结膜苍白',
        hemBleeding: '皮肤黏膜未见瘀点、瘀斑及紫癜',
        hemNode: '全身浅表淋巴结未触及肿大',
        hemSternum: '胸骨无压痛',
        hemGum: '牙龈无增生、渗血',
        hemHepatospleen: '肝脾肋下未触及',
        hemBoneTender: '四肢长骨及关节无压痛'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 62g/L，RBC 3.1×10¹²/L，MCV 71fl，MCH 20pg，MCHC 285g/L，WBC 5.6×10⁹/L，PLT 246×10⁹/L', date: '', hospital: '', no: '' },
        { name: '铁代谢（血清铁、铁蛋白、总铁结合力）', result: '血清铁 5.2μmol/L，铁蛋白 8μg/L，总铁结合力 82μmol/L，转铁蛋白饱和度 8%', date: '', hospital: '', no: '' },
        { name: '骨髓穿刺+铁染色', result: '增生活跃，红系增生明显，中晚幼红细胞体积小、胞浆少，呈「核老浆幼」；骨髓小粒可染铁消失，铁粒幼细胞 5%', date: '', hospital: '', no: '' },
        { name: '粪便隐血', result: '阴性', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['缺铁性贫血（重度）', '铁缺乏症']
    }
  }
};
