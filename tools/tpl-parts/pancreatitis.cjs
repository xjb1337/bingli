/* 模板病例：急性胰腺炎（胆源性）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：上腹持续剧痛向腰背放射、弯腰抱膝可减轻、呕吐后腹痛不缓解，是胰腺炎的典型三联；
 * 诊断依据是血淀粉酶/脂肪酶显著升高 + 影像见胰腺肿胀与胰周渗出。
 */
module.exports = {
  key: 'pancreatitis',
  dept: 'digestive',
  name: '急性胰腺炎（胆源性）',
  alias: ['急性胰腺炎', '胰腺炎', '胆源性胰腺炎', '胆石性胰腺炎', 'AP'],
  hint: '饱餐或饮酒后上腹持续剧痛，向腰背放射，弯腰抱膝减轻，呕吐后不缓解',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '上腹部疼痛伴恶心呕吐10小时',
      chiefComplaintDuration: '10',
      chiefComplaintDurationUnit: '小时'
    },
    hpi: {
      onset: '10小时前晚餐饱食并饮白酒约150ml后出现上腹部持续性剧痛，呈刀割样，程度剧烈，难以忍受',
      cause: '既往胆囊结石病史',
      symptoms: '疼痛位于中上腹，向左腰背部放射，呈束带状，弯腰抱膝位可稍减轻，平卧及伸腰时加重',
      relief: '自服「山莨菪碱」后腹痛无缓解',
      evolution: '腹痛逐渐加重，频繁呕吐，呕吐后腹痛不见减轻，遂来急诊',
      accompanying: '伴恶心、呕吐胃内容物5～6次，量不多，无咖啡样物；伴腹胀，无发热、寒战',
      negativeDiscriminating: '无呕血、黑便，无腹泻，无黄疸，无胸闷、胸痛，无尿频尿痛',
      treatment: '急诊予禁食、胃肠减压、乳酸钠林格液静脉补液、盐酸布桂嗪止痛，现疼痛较前减轻',
      generalCondition: '发病以来精神差，未进食，睡眠差，小便量偏少，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '中上腹刀割样持续痛，向腰背放射' },
        nausea: { checked: true },
        vomiting: { checked: true, detail: '呕吐胃内容物5～6次，吐后腹痛不缓解' },
        bloating: { checked: true, detail: '起病后逐渐加重' },
        appetiteLoss: { checked: true, detail: '完全无食欲' },
        hematemesis: { negative: true },
        melena: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        jaundiceGi: { negative: true },
        reflux: { negative: true }
      },
      resp: { fever: { negative: true }, chills: { negative: true } },
      cardio: { palpitation: { negative: true } },
      hemat: { fatigue: { negative: true }, pallorSkin: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 胆囊结石: true },
      diseaseDetail: '3年前体检超声发现胆囊结石，最大直径约1.5cm，偶有右上腹隐痛，未行手术',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期服用糖皮质激素、噻嗪类利尿剂及硫唑嘌呤等药物史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江温州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '有',
      drinkingAmount: '饮白酒每周4～5次，每次约150～250ml，发病前1天曾一次饮白酒约500ml',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '长期饮食不规律，喜油腻食物，常有暴饮暴食',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '28', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        posture: '强迫体位',
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
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      special_digestive: {
        giTenderness: '上腹部压痛',
        giRebound: '局部腹肌紧张',
        giLiverPalp: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
        giGallbladderPalp: '胆囊未触及，Murphy征阴性，无胆囊触痛',
        giBowelSound: '肠鸣音减弱'
      }
    },
    auxiliary: {
      items: [
        { name: '血淀粉酶', result: '1180U/L（参考值35～135U/L，超过正常上限3倍以上）', date: '', hospital: '', no: '' },
        { name: '血脂肪酶', result: '1640U/L（参考值0～60U/L，超过正常上限3倍以上）', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 13.8×10⁹/L，N 86%，Hb 152g/L，PLT 218×10⁹/L', date: '', hospital: '', no: '' },
        { name: '腹部CT（增强）', result: '胰腺体积弥漫增大，实质密度不均，胰周脂肪间隙模糊并见条片状液性渗出，未见明确坏死区；胆囊内见高密度结石影，胆总管未见扩张', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '胆囊8.6×3.8cm，壁厚0.3cm，腔内见多枚强回声伴声影，最大约1.5cm；胰腺显示不清（肠气干扰）', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性胰腺炎（胆源性，轻症）', '胆囊结石']
    }
  }
};
