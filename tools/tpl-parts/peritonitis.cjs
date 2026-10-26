/* 模板病例：急性弥漫性腹膜炎（消化性溃疡穿孔）
 *
 * 依据《外科学》第10版 p402-408：
 *   腹部压痛、反跳痛和腹肌紧张即腹膜刺激征，是腹膜炎的典型体征，以原发病灶部位最明显；
 *   胃肠或胆囊穿孔可引起强烈的腹肌紧张，甚至呈「木板样」强直（p403）。
 *   胃十二指肠穿孔时肝浊音界缩小或消失，听诊肠鸣音减弱或消失；立位腹部平片
 *   多可见膈下游离气体（p404）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'peritonitis',
  dept: 'surgery',
  name: '急性弥漫性腹膜炎（消化道穿孔）',
  alias: ['急性弥漫性腹膜炎', '消化道穿孔', '胃穿孔', '十二指肠穿孔', '弥漫性腹膜炎'],
  hint: '突发上腹刀割样剧痛并迅速波及全腹，全腹压痛反跳痛伴板状腹、肝浊音界消失',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '山东济南',
      birthPlace: '山东济南',
      occupation: '货车驾驶员',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      chiefComplaint: '突发上腹剧痛并波及全腹6小时'
    },
    hpi: {
      onset: '6小时前突发上腹部刀割样剧痛，程度剧烈，难以忍受，蜷曲体位不能缓解',
      // 以「后」结尾，normalizeCause 补成「…后起病」。诱因按教材：精神紧张、过度劳累、
      // 刺激性食物都可诱发溃疡穿孔，这里取前两项；不写「空腹」这类与「突发剧痛」矛盾的慢性诱因。
      cause: '精神紧张及过度劳累后',
      symptoms: '疼痛起始于剑突下偏右，约2小时后迅速波及全腹，呈持续性刀割样，深呼吸、咳嗽及翻身时加剧',
      relief: '屈膝卧位及静卧后无缓解，服铝碳酸镁咀嚼片后无减轻',
      evolution: '6小时内腹痛由剑突下扩展至全腹，程度逐渐加重，4小时前出现发热，无疼痛间歇期',
      accompanying: '伴恶心、呕吐胃内容物1次，伴发热、口渴',
      negativeDiscriminating: '无呕血及黑便，无皮肤巩膜黄染，无尿频尿急尿痛，无胸痛及呼吸困难',
      treatment: '3小时前于社区诊所予山莨菪碱10mg肌内注射、奥美拉唑40mg静脉滴注1次，腹痛无缓解，为进一步诊治急诊来院',
      generalCondition: '发病以来精神差，未进食，睡眠差，小便量少，未解大便，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '剑突下起，迅速波及全腹，持续性刀割样' },
        nausea: { checked: true, detail: '持续存在' },
        vomiting: { checked: true, detail: '胃内容物1次，量少' },
        appetiteLoss: { checked: true, detail: '完全不能进食' },
        melena: { negative: true },
        hematemesis: { negative: true },
        diarrhea: { negative: true },
        constipation: { negative: true },
        jaundiceGi: { negative: true },
        reflux: { checked: true, detail: '反复反酸、烧心2年' }
      },
      resp: {
        fever: { checked: true, detail: '4小时前起，未测体温' },
        cough: { negative: true },
        dyspnea: { negative: true },
        chestPainResp: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '腹痛发作时明显' },
        chestPainCardio: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        oliguria: { checked: true, detail: '近3小时尿量明显减少' }
      },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '平素尚可',
      diseaseChecks: { 消化性溃疡: true },
      diseaseOther: '',
      diseaseDetail: '十二指肠球部溃疡8年，间断服奥美拉唑，未规律复查',
      longTermMeds: '间断口服奥美拉唑20mg每日1次，未规律服药',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期服用非甾体抗炎药及糖皮质激素史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '山东济南，否认疫区及地方病流行区居住史',
      smoking: '有',
      smokingAmount: '每日20支，共15年',
      drinking: '有',
      drinkingAmount: '每周饮白酒约250ml，共10年',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '长期饮食不规律，出车时常空腹或暴饮暴食',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '长途驾驶，作息不规律'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健' },
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
        cooperation: '查体欠合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
        rash: '未见皮疹及出血点'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏'
      },
      neck: { neckResist: '颈软，无抵抗' },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音消失',
        abdPercussion: '鼓音区缩小',
        abdPalpation: '全腹压痛、反跳痛，腹肌紧张'
      },
      // 肝浊音界消失是消化道穿孔的定位体征，也是诊断提示与诊断依据的关键点。
      special_surgery: {
        surgPeritoneum: '肝浊音界消失',
        surgAbdomenMass: '腹部未触及包块',
        surgLymph: '引流区域淋巴结未触及肿大'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 132g/L，WBC 19.4×10⁹/L，N 92%，PLT 214×10⁹/L', date: '', hospital: '', no: '' },
        {
          name: '立位腹部平片',
          result: '双侧膈下可见游离气体影，呈新月形，肠管未见明显扩张及液气平面',
          date: '', hospital: '', no: ''
        },
        {
          name: '腹部CT',
          result: '腹腔内大量游离气体，肝前间隙及小网膜囊内积液，十二指肠球部前壁增厚，周围脂肪间隙模糊',
          date: '', hospital: '', no: ''
        },
        { name: '血淀粉酶', result: '86U/L', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 13.2s，APTT 32.6s，INR 1.08，纤维蛋白原 3.6g/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性弥漫性腹膜炎（消化道穿孔）', '十二指肠球部溃疡穿孔']
    }
  }
};
