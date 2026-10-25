/* 模板病例：肝硬化失代偿期（腹水）—— 乙型肝炎后肝硬化
 *
 * 教学要点：明确病因（乙肝，我国最常见）+ 门脉高压（腹水、脾大脾功能亢进、食管胃底静脉曲张）
 * + 肝功能减退（黄疸、低白蛋白、凝血酶原时间延长、牙龈出血）。
 * 腹水靠「腹部膨隆 + 移动性浊音阳性 + 液波震颤阳性」三项落地，不能只写「腹水」两个字；
 * 肝颈静脉回流征阴性是与心源性腹水的关键鉴别阴性，必须写。
 *
 * 查体值逐字取自 tools/pe-options.txt 的 def= / opt=，不要改词。
 */
module.exports = {
  key: 'cirrhosis',
  dept: 'digestive',
  name: '肝硬化失代偿期（腹水）',
  alias: ['肝硬化', '腹水', '肝腹水', '失代偿期肝硬化', '乙型肝炎肝硬化', '门脉高压'],
  hint: '乙型肝炎病史，腹胀、尿少、双下肢水肿，脾大，移动性浊音阳性',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '退休工人',
      reliability: '可靠',
      chiefComplaint: '腹胀伴双下肢水肿',
      chiefComplaintDuration: '1',
      chiefComplaintDurationUnit: '月'
    },
    hpi: {
      onset: '1个月前无明显诱因出现腹胀，进食后加重，夜间平卧时明显，同时发现双踝部水肿，晨轻暮重',
      cause: '既往乙型病毒性肝炎20年，近3个月自行停用恩替卡韦，未再复查肝功能',
      symptoms: '腹胀进行性加重，腹围渐增大，尿量减至每日约800ml，双下肢凹陷性水肿由踝部向上发展至胫前',
      relief: '自服呋塞米20mg每日1次共3天，尿量增多、腹胀略减轻，停药后反复',
      evolution: '近1周腹胀明显加重，进食量减至平时一半，平地行走即感气促，夜间需垫高枕头方能入睡',
      accompanying: '伴乏力、食欲减退，刷牙时偶有牙龈出血，无鼻衄',
      negativeDiscriminating: '无呕血、黑便，无发热、腹痛，无皮肤瘙痒及陶土样大便，无神志淡漠、计算力下降及扑翼样震颤',
      treatment: '门诊予螺内酯40mg每日1次、呋塞米20mg每日1次口服，未行腹腔穿刺放液',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠差，尿量减少，体重较前增加约4kg',
      extra: ''
    },
    ros: {
      gi: {
        bloating: { checked: true, detail: '腹胀进行性加重，进食后明显' },
        appetiteLoss: { checked: true, detail: '进食量减至平时一半' },
        jaundiceGi: { checked: true, detail: '家属发现巩膜轻度发黄' },
        jaundice: { checked: true, detail: '巩膜及皮肤轻度黄染' },
        abdominalPain: { negative: true },
        vomiting: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true }
      },
      cardio: { edemaCardio: { checked: true, detail: '双下肢凹陷性水肿，晨轻暮重' } },
      gu: { oliguria: { checked: true, detail: '每日尿量约800ml' } },
      hemat: {
        fatigue: { checked: true, detail: '明显乏力，日常活动受限' },
        bleeding: { checked: true, detail: '刷牙时牙龈渗血，量少可自止' },
        epistaxis: { negative: true },
        purpura: { negative: true }
      },
      resp: { dyspnea: { checked: true, detail: '平地行走即气促，平卧加重' }, fever: { negative: true } },
      nervous: {
        sleepDisorder: { checked: true, detail: '夜间腹胀影响入睡' },
        tremor: { negative: true },
        memoryLoss: { negative: true }
      },
      endocrine: { weightGain: { checked: true, detail: '1个月内体重增加约4kg' } }
    },
    pmh: {
      health: '一般',
      diseaseChecks: { 病毒性肝炎: true },
      diseaseDetail: '20年前体检发现 HBsAg 阳性，诊断「乙型病毒性肝炎」，未规律抗病毒治疗；5年前查腹部超声提示「肝实质回声增粗、脾大」，诊断「乙型肝炎肝硬化」，间断服恩替卡韦，近3个月自行停药',
      longTermMeds: '恩替卡韦0.5mg每日1次，间断服用，近3个月已停',
      infection: '乙型病毒性肝炎20年，否认结核、疟疾等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认长期饮酒及肝毒性药物、毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '乙型肝炎后肝硬化是本次腹水、脾大及凝血功能减退的基础病因',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
      smoking: '已戒',
      smokingAmount: '吸烟30年，每日约20支，5年前已戒烟',
      drinking: '无',
      drinkingAmount: '',
      drugs: '',
      environment: '',
      habits: '饮食偏咸，喜食腌制食品，近1个月因腹胀进食明显减少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '退休前从事机械加工工作，无粉尘、毒物及放射性物质接触史'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健，HBsAg 阴性', sexLife: '近半年性欲减退，近1个月因腹胀进一步减少', relation: '和睦' },
    family: {
      diseaseChecks: { 病毒性肝炎: true, 恶性肿瘤: true },
      other: '',
      deceased: '父亲因肝癌去世，68岁；母亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '',
      infectionHistory: '母亲 HBsAg 阳性，家族中乙型肝炎呈聚集现象'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '慢性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜黄染',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: { eyes: '巩膜黄染' },
      neck: { neckVessel: '颈静脉无充盈，颈动脉无异常搏动' },
      chest: {
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '移动性浊音阳性'
      },
      spine: { limbs: '双下肢凹陷性水肿' },
      special_digestive: {
        giExtra: '肝颈静脉回流征阴性',
        giAbdShape: '腹壁静脉曲张，血流方向自下而上',
        giTenderness: '上腹部压痛',
        giLiverPalp: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
        giSpleenPalp: '脾肋下可触及，质硬',
        giFluidThrill: '液波震颤阳性',
        giShiftingDullness: '移动性浊音阳性'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 3.2×10⁹/L，N 58%，Hb 106g/L，PLT 62×10⁹/L，三系减少', date: '', hospital: '', no: '' },
        { name: '肝功能', result: 'ALT 68U/L，AST 94U/L，Alb 27g/L，TBil 46μmol/L，DBil 26μmol/L，ALP 168U/L，GGT 132U/L', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 17.8s，较正常对照延长 4.2s，INR 1.52，APTT 41s', date: '', hospital: '', no: '' },
        { name: '乙肝五项', result: 'HBsAg 阳性，HBeAg 阴性，抗-HBe 阳性，抗-HBc 阳性，抗-HBs 阴性', date: '', hospital: '', no: '' },
        { name: 'HBV-DNA', result: '3.6×10⁵ IU/ml', date: '', hospital: '', no: '' },
        { name: '甲胎蛋白', result: '38ng/ml（轻度升高）', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '肝体积缩小，表面呈锯齿状，实质回声增粗不均，门静脉内径 1.4cm，血流速度减慢；脾 15.2×6.8cm；腹腔内见大量无回声区，最深约 9.8cm', date: '', hospital: '', no: '' },
        { name: '胃镜', result: '食管中下段可见 3 条曲张静脉，呈串珠样，红色征阳性（中度）；胃底未见明显曲张；门脉高压性胃病（轻度）', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: [
        '乙型肝炎后肝硬化失代偿期',
        '腹腔积液',
        '食管胃底静脉曲张（中度）',
        '脾功能亢进',
        '低白蛋白血症'
      ]
    }
  }
};
