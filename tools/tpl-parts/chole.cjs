/* 模板病例：急性结石性胆囊炎
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：进食油腻后右上腹绞痛向右肩背放射、Murphy 征阳性、超声见胆囊壁增厚与结石嵌顿，
 * 是结石性胆囊炎的核心证据链；无黄疸、无寒战高热用于与胆总管结石并胆管炎鉴别。
 */
module.exports = {
  key: 'chole',
  dept: 'digestive',
  name: '急性结石性胆囊炎',
  alias: ['急性胆囊炎', '胆囊炎', '胆囊结石', '胆石症', '胆绞痛'],
  hint: '进食油腻后右上腹痛向右肩背放射，Murphy 征阳性，超声见胆囊壁增厚与结石',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '小学教师',
      reliability: '可靠',
      chiefComplaint: '右上腹疼痛伴恶心呕吐2天',
      chiefComplaintDuration: '2',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '2天前晚餐进食油炸食物后1小时出现右上腹持续性胀痛，阵发性加重，程度中等',
      cause: '既往体检发现胆囊结石5年',
      symptoms: '疼痛位于右上腹，向右肩及右腰背部放射，改变体位及弯腰均不能缓解，右上腹拒按',
      relief: '自服「消炎利胆片」及局部热敷后无明显缓解',
      evolution: '1天前疼痛加重，牵涉至右肩背，夜间因疼痛不能入睡，遂来院急诊',
      accompanying: '伴恶心、呕吐胃内容物2次，呕吐后腹痛稍减轻；自觉发热，未测体温；无寒战',
      negativeDiscriminating: '无皮肤及巩膜黄染，无皮肤瘙痒，无寒战高热，无呕血黑便，无腹泻，无尿频尿痛，无胸痛',
      treatment: '急诊予禁食、解痉、静脉抗感染（头孢呋辛+甲硝唑），现疼痛较前减轻',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠差，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '右上腹持续胀痛，向右肩背放射' },
        nausea: { checked: true },
        vomiting: { checked: true, detail: '呕吐胃内容物2次，吐后稍减轻' },
        bloating: { checked: true, detail: '进食后明显' },
        reflux: { checked: true, detail: '餐后为主' },
        appetiteLoss: { checked: true, detail: '进食油腻后明显厌恶' },
        jaundiceGi: { negative: true },
        jaundice: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true }
      },
      resp: { fever: { checked: true, detail: '体温未测' }, chills: { negative: true } },
      cardio: { palpitation: { negative: true } },
      hemat: { fatigue: { negative: true }, pallorSkin: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 胆囊结石: true },
      diseaseDetail: '5年前体检超声发现胆囊结石，最大约1.2cm，偶有餐后右上腹不适，未行手术',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '胆囊结石为本次急性胆囊炎的直接病因',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江温州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '喜食油腻及油炸食物，运动少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事小学教学工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        nutrition: '肥胖',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '急性病容',
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
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      special_digestive: {
        giTenderness: '右上腹压痛，胆囊点压痛',
        giRebound: '局部腹肌紧张',
        giGallbladderPalp: 'Murphy征阳性',
        giLiverPalp: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
        giBowelSound: '未闻及振水音及血管杂音'
      }
    },
    auxiliary: {
      items: [
        { name: '腹部超声', result: '胆囊9.2×4.0cm，壁厚0.6cm，呈双层；腔内见多枚强回声伴声影，最大约1.2cm，颈部一枚结石嵌顿；胆总管内径0.5cm，未见结石；胰腺未见异常', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 14.6×10⁹/L，N 87%，Hb 138g/L，PLT 232×10⁹/L', date: '', hospital: '', no: '' },
        { name: '肝功能', result: 'ALT 46U/L，AST 38U/L，TBil 22μmol/L，DBil 8μmol/L，Alb 41g/L', date: '', hospital: '', no: '' },
        { name: '腹部CT', result: '胆囊增大，壁增厚水肿，胆囊周围脂肪间隙模糊，腔内见高密度结石影；未见胆总管扩张', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性结石性胆囊炎', '胆囊结石']
    }
  }
};
