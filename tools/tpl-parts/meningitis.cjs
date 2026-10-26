/* 模板病例：化脓性脑膜炎（肺炎链球菌性）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：发热 + 头痛 + 呕吐 + 脑膜刺激征，是中枢神经系统感染的三联表现；
 * 确诊靠腰椎穿刺——压力增高、外观浑浊、白细胞以中性为主、蛋白高糖低，
 * 涂片或培养找到致病菌才定性。腰穿前必须先做头颅影像除外占位与脑疝风险。
 */
module.exports = {
  key: 'meningitis',
  dept: 'neurology',
  name: '化脓性脑膜炎',
  alias: ['化脓性脑膜炎', '细菌性脑膜炎', '肺炎链球菌脑膜炎', '化脑'],
  hint: '发热、头痛、呕吐伴脑膜刺激征阳性，脑脊液呈化脓性改变',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江宁波',
      birthPlace: '浙江宁波',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '发热伴头痛、呕吐3天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '3天前受凉后出现发热，体温最高39.6℃，无畏寒及寒战，同时出现全头部持续性胀痛，晨起及咳嗽、弯腰时加重',
      cause: '发病前1周有咽部不适及鼻塞，未服药；发病前无头部外伤、无耳鼻流液',
      symptoms: '头痛为全头胀痛，程度剧烈，难以忍受，伴恶心，进食后呕吐3次，为胃内容物，呈喷射样；发热持续，服退热药后可短暂下降，数小时后复升',
      relief: '卧床、避光后头痛稍减轻，退热药效果短暂',
      evolution: '入院前1天出现精神萎靡、反应迟钝、答话迟缓，家属呼之能应但言语减少',
      accompanying: '伴畏光、颈部发僵、全身肌肉酸痛',
      negativeDiscriminating: '无肢体瘫痪，无肢体抽搐，无言语不能，无视物成双，无耳流脓及听力下降，无皮肤瘀点瘀斑，无腹泻，无尿频尿痛',
      treatment: '社区诊所予头孢呋辛1.5g静脉滴注2天、对乙酰氨基酚退热，体温未降至正常，头痛进行性加重，遂转我院急诊',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠因头痛受影响，小便正常，大便2日未解，体重无明显变化',
      extra: '入院后即行腰椎穿刺，术前头颅CT未见明显占位'
    },
    ros: {
      nervous: {
        headache: { checked: true, detail: '全头部持续性胀痛，咳嗽及弯腰时加重' },
        speech: { checked: true, detail: '答话迟缓，言语减少' },
        seizure: { negative: true },
        weakness: { negative: true },
        numbness: { negative: true },
        visualBlur: { checked: true, detail: '畏光，强光下头痛加重' }
      },
      resp: {
        fever: { checked: true, detail: '体温最高39.6℃，持续3天' },
        chills: { negative: true },
        cough: { negative: true },
        soreThroat: { checked: true, detail: '发病前1周咽部不适' }
      },
      gi: {
        nausea: { checked: true, detail: '伴恶心，呕吐3次为胃内容物' },
        vomiting: { checked: true, detail: '喷射样呕吐3次' },
        diarrhea: { negative: true },
        abdominalPain: { negative: true }
      },
      gu: { dysuria: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、慢性肾脏病等慢性病史；否认中耳炎、鼻窦炎反复发作史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史；近期无结核病人接触史',
      surgery: '否认手术史',
      trauma: '否认头部外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种，未接种肺炎链球菌疫苗',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认长期使用糖皮质激素及免疫抑制剂',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江宁波，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认有毒有害物质接触史',
      environment: '',
      habits: '经常熬夜，工作劳累',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '29', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体欠合作'
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
        neckResist: '颈抵抗阳性',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常'
      },
      nervousPE: {
        kernig: '克氏征阳性',
        brudzinski: '布氏征阳性',
        babinski: '巴氏征阴性'
      },
      special_neurology: {
        neuroExtra1: '言语不利',
        neuroExtra2: '十二对颅神经检查未见异常',
        neuroExtra3: '四肢肌张力正常，肌力正常，未见肌萎缩',
        neuroExtra4: '痛温觉、触觉、深感觉检查未见异常',
        neuroMeningeal: '颈项强直阳性',
        neuroGait: '步态正常，行走平稳'
      }
    },
    auxiliary: {
      items: [
        { name: '腰椎穿刺（脑脊液常规）', result: '初压280mmH₂O，外观浑浊，白细胞4800×10⁶/L，中性粒细胞92%，蛋白2.8g/L，葡萄糖1.1mmol/L，氯化物112mmol/L', date: '', hospital: '', no: '' },
        { name: '脑脊液涂片及培养', result: '涂片见革兰阳性双球菌，培养待报', date: '', hospital: '', no: '' },
        { name: '头颅CT（平扫）', result: '脑实质未见占位性病变及出血灶，脑沟略浅，中线结构居中', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 18.6×10⁹/L，N 89%，Hb 126g/L，PLT 236×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白及降钙素原', result: 'CRP 168mg/L，PCT 12.4ng/ml', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['化脓性脑膜炎（肺炎链球菌性）', '低钠血症']
    }
  }
};
