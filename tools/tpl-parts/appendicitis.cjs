/* 模板病例：急性阑尾炎（急性化脓性阑尾炎）
 *
 * 依据《外科学》第10版 p441-448：
 *   典型腹痛始于上腹、逐渐移向脐部，数小时（6～8 小时）后转移并局限在右下腹，
 *   约 70%～80% 的病人具有这种转移性腹痛（p442）。
 *   右下腹压痛是急性阑尾炎最常见的重要体征，压痛点通常位于麦氏点，且始终固定（p443）。
 *   腹膜刺激征象（反跳痛、腹肌紧张、肠鸣音减弱或消失）、结肠充气试验、腰大肌试验阳性（p443）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词。
 */
module.exports = {
  key: 'appendicitis',
  dept: 'surgery',
  name: '急性阑尾炎（急性化脓性阑尾炎）',
  alias: ['急性阑尾炎', '阑尾炎', '化脓性阑尾炎', '盲肠炎'],
  hint: '转移性右下腹痛，麦氏点固定压痛伴反跳痛，伴恶心呕吐、低热',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南京',
      birthPlace: '江苏南京',
      occupation: '公司职员',
      reliability: '可靠',
      // 时长直接写进主诉正文：emptyRecord() 的默认时长单位是「天」，
      // fillBlanks 只填空值，模板里另写 unit:'小时' 会被默认值顶掉，输出「18天」。
      chiefComplaint: '转移性右下腹疼痛18小时'
    },
    hpi: {
      onset: '18小时前出现上腹部疼痛，位于剑突下及脐周，程度中等，可忍受',
      // 以「后」结尾，normalizeCause 补成「剧烈活动及进食后起病」，不会拼成「…为本次发病诱因」。
      cause: '剧烈活动及进食后',
      symptoms: '约6小时后转移并固定于右下腹，呈持续性胀痛，阵发性加重，行走、咳嗽及翻身时加剧',
      relief: '静卧屈膝位时稍减轻，服山莨菪碱后无明显缓解',
      evolution: '腹痛逐渐加重，12小时前出现发热，无寒战',
      accompanying: '伴恶心、呕吐胃内容物2次，伴食欲明显减退',
      negativeDiscriminating: '无尿频、尿急、尿痛，无腰背部放射痛，无腹泻及黑便，无呕血，无皮肤巩膜黄染',
      treatment: '8小时前于社区卫生服务中心就诊，查血常规示白细胞及中性粒细胞比例升高，予头孢呋辛酯0.25g每日2次口服、山莨菪碱10mg肌内注射1次，腹痛无缓解，为进一步诊治来院',
      generalCondition: '发病以来精神欠佳，食欲减退，睡眠差，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '持续性胀痛，阵发性加重，行走、咳嗽时加剧' },
        nausea: { checked: true },
        vomiting: { checked: true, detail: '胃内容物2次，呕吐后腹痛不缓解' },
        appetiteLoss: { checked: true, detail: '近期明显减退，厌油腻' },
        diarrhea: { negative: true },
        constipation: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true },
        jaundiceGi: { negative: true },
        reflux: { negative: true }
      },
      resp: {
        fever: { checked: true, detail: '12小时前起，未测体温' },
        chills: { negative: true },
        cough: { negative: true }
      },
      gu: {
        dysuria: { negative: true },
        hematuria: { negative: true },
        flankPain: { negative: true }
      },
      cardio: { palpitation: { negative: true } },
      joint: { backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期服用泻药及非甾体抗炎药史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南京，否认疫区及地方病流行区居住史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      habits: '三餐尚规律，近期工作较忙',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '28', spouseHealth: '配偶体健' },
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
        conscious: '神志清楚，精神可',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: { color: '全身皮肤黏膜无黄染、苍白、发绀', rash: '未见皮疹及出血点' },
      head: { eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏' },
      neck: { neckResist: '颈软，无抵抗' },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '右下腹压痛、反跳痛'
      },
      special_surgery: {
        surgPeritoneum: '局部压痛伴反跳痛',
        surgAbdomenMass: '腹部未触及包块',
        surgLymph: '引流区域淋巴结未触及肿大'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 138g/L，WBC 15.6×10⁹/L，N 88%，PLT 226×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白', result: '62mg/L', date: '', hospital: '', no: '' },
        { name: '尿常规', result: '未见红细胞、白细胞及蛋白', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '右下腹可见阑尾直径约9mm，壁增厚呈双层，周围少量积液，未见结石影', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性化脓性阑尾炎', '局限性腹膜炎']
    }
  }
};
