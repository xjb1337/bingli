/* 模板病例：精神分裂症（偏执型）
 *
 * 诊断依据按 ICD-10 / DSM-5 的「精神分裂症」条目组织（本仓库教材语料无精神科专章，
 * 故不标页码）：至少 1 个月的特征性症状（幻觉、妄想、思维散漫、阴性症状等）
 * 加上社会功能受损与病程要求；本例病程 1 年余，社会功能明显受损。
 *
 * 写法要点：
 *   ① 主诉只能是症状学描述：「凭空闻声、疑人害己」——不能写「精神分裂症」。
 *   ② 偏执型的核心是「幻觉 + 被害妄想 + 自知力缺失」，这三项必须进精神检查，
 *      并且逐字对上 hints.js 中 schizophrenia 规则的 pev: 值，才能命中诊断提示。
 *   ③ pe 只写 special_psychiatry；通用查体除 general.conscious 外一律不勾写
 *      （精神科病人不做腹部触诊，写了也是编造）。
 *   ④ 物质使用必须交代：长期大麻/酒精是精神病性症状最常见的排除项，
 *      本例写明「否认」，并写进 hpi.negativeDiscriminating 与 pmh.special。
 *   ⑤ 起病年龄、病前性格、应激事件三样齐全，才能体现「素质因素 + 应激」的病程叙述。
 */
module.exports = {
  key: 'schizophrenia',
  dept: 'psychiatry',
  name: '精神分裂症（偏执型）',
  alias: ['精神分裂症', '偏执型精神分裂症', '分裂症', '思觉失调'],
  hint: '青壮年起病，幻听与被害妄想并存，自知力缺失，社会功能明显受损',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '河南洛阳',
      birthPlace: '河南洛阳',
      occupation: '无业',
      reliability: '尚可靠',
      // 患者否认有病、叙述不合作，病史由家属代述——精神科必须写清陈述者，
      // 这直接决定病史可靠性（本例故作「尚可靠」）。
      informant: '患者母亲',
      chiefComplaint: '凭空闻声、疑人害己1年'
    },
    hpi: {
      onset: '1年前无明显诱因渐起，夜间独处时诉耳边有人说话，内容多为议论和辱骂自己',
      // 以「后」结尾，normalizeCause 才会补成「…后起病」；
      // 若写成名词短语，会被拼成「X为本次发病诱因」。
      cause: '毕业后求职受挫、独自在外租房居住后',
      symptoms: '坚信邻居与同事串通要害自己，认为饭菜被人下毒，拒绝进食家中以外送来的食物，多次报警称被跟踪',
      relief: '独处房间、关紧门窗时稍感安全，余无缓解方式',
      evolution: '近半年加重，对家人亦起疑，曾持刀守在门口不许母亲外出，夜间几乎不眠',
      accompanying: '情感反应平淡，对家人受伤住院亦无相应关切，生活懒散，需家人督促洗漱更衣',
      // 有鉴别意义的阴性：排除器质性、物质所致与心境障碍伴精神病性症状。
      negativeDiscriminating: '无发热、头痛、呕吐及抽搐，无颅脑外伤史，无长期饮酒及吸食新型毒品史，无持续情绪高涨或持续情绪低落发作',
      treatment: '半年前于当地精神专科医院门诊就诊，予奥氮平10mg每晚口服，因自觉「没病」服药1个月后自行停药，停药后症状加重',
      generalCondition: '发病以来精神差，睡眠差，饮食需督促，生活懒散，体重较前下降，社会功能明显受损，无法工作',
      extra: ''
    },
    ros: {
      nervous: {
        // 精分必须写幻觉：这条同时是 hints 里 schizophrenia 规则的 must 之一。
        hallucination: { checked: true, detail: '以言语性幻听为主，夜间明显，诉「有人隔着墙骂我」' },
        behaviorAbnormal: { checked: true, detail: '曾持刀守门，夜间外出行走，反复报警' },
        sleepDisorder: { checked: true, detail: '入睡困难，夜间仅睡2～3小时，白天困倦' },
        memoryLoss: { negative: true },
        moodLow: { negative: true },
        anxiety: { negative: true },
        suicidal: { negative: true },
        tremor: { negative: true },
        headache: { negative: true },
        dizziness: { negative: true }
      },
      // 其余系统只写问过的项；未问的整键不写。
      resp: { fever: { negative: true }, cough: { negative: true } },
      cardio: { palpitation: { negative: true } },
      gi: { appetiteLoss: { checked: true, detail: '因怀疑饭菜被下毒而拒食，体重下降' }, vomiting: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史，否认癫痫及颅脑外伤史',
      longTermMeds: '否认长期服用激素、抗结核药及其他药物史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认一氧化碳中毒及农药接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认既往精神障碍发作史及精神科住院史',
      otherTreatDiseases: '',
      // 物质使用：精神科必须问到，且要写明是「否认」而不是留空。
      special: '否认长期饮酒史，否认吸食大麻、冰毒等精神活性物质史'
    },
    personal: {
      residence: '河南洛阳，否认疫区及地方病流行区居住史',
      smoking: '有',
      smokingAmount: '每日约10支，共5年',
      drinking: '无',
      drugs: '否认乙醇依赖及吸食大麻、苯丙胺类物质史',
      // habits 会被 generator 原样输出成一行，故这里不重复写性格
      // （性格已单列在 premorbidPersonality），只写日常生活与社交状况。
      habits: '日常起居需家人督促，白天多卧床或来回踱步，夜间常独自外出，几乎不与朋友来往',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '毕业后从事销售工作半年即离职，现无业，无粉尘及毒物接触',
      premorbidPersonality: '内向、孤僻、敏感多疑，不善与人交往，遇事易往坏处想',
      stressEvent: '1年前求职受挫并独自在外租房，与家人联系减少'
    },
    // 未婚时 generator 只输出「未婚。」，但仍保留年龄与性生活等附加信息位。
    marriage: { status: '未婚' },
    family: {
      // 精神分裂症有明确遗传倾向，家族史必须勾到「精神病」。
      diseaseChecks: { 精神病: true },
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病病史',
      similarDisease: '外祖母年轻时有「精神失常」史，未系统诊治',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病家族史'
    },
    pe: {
      // 精神科不写生命体征；通用查体除神志外一律不写。
      vitals: {},
      general: { conscious: '神志清楚，精神一般' },
      special_psychiatry: {
        // 仪表与接触：不合作、问话少答是偏执型的典型接触方式。
        psyAppearance: '衣着不整，接触被动',
        psyOrientation: '定向力完整，意识清晰',
        psySpeech: '言语零乱，答不切题',
        psyThoughtForm: '思维散漫',
        // 被害妄想：hints 里 schizophrenia 规则的 must 与 match 都认这一条。
        psyThoughtContent: '被害妄想',
        // 幻听：另一条 must。
        psyPerception: '幻听',
        psyMood: '情感淡漠',
        psyCognition: '记忆、计算与理解力尚可',
        // 自知力缺失是精分与抑郁、焦虑鉴别的关键，必须写。
        psyInsight: '自知力缺失，否认有病',
        psyBehavior: '冲动毁物行为'
      }
    },
    auxiliary: {
      items: [
        // 头颅影像与甲功用于排除器质性、内分泌所致精神障碍，不是诊断依据。
        { name: '头颅MRI', result: '脑实质未见异常信号，脑室系统无扩大，未见占位性病变', date: '', hospital: '', no: '' },
        { name: '甲状腺功能', result: 'FT3 4.9pmol/L，FT4 16.1pmol/L，TSH 1.8mIU/L，均在正常范围', date: '', hospital: '', no: '' },
        // 抗精神病药前必查心电图与血常规、肝功，属用药安全基线。
        { name: '心电图', result: '窦性心律，QT间期0.38s，大致正常心电图', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 6.4×10⁹/L，N 62%，Hb 132g/L，PLT 218×10⁹/L', date: '', hospital: '', no: '' },
        // 量表只评估症状严重程度与疗效，诊断仍依据病史与精神检查。
        { name: '阳性与阴性症状量表（PANSS）', result: '总分86分，阳性症状分明显升高，供病情评估与随访比较', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['精神分裂症（偏执型）', '社会功能受损']
    }
  }
};
