/* 模板病例：上消化道出血（消化性溃疡并出血）—— 消化内科
 *
 * 写法沿用 pud.cjs 的规格：教科书式典型病例，患者身份信息一律留空，
 * 生命体征一律留给学生自己测（pe.vitals 必须为空）。
 * 查体描述逐字取自 tools/pe-options.txt 的 def= / opt=。
 *
 * 教学要点：以呕血、黑便为主诉，写清失血量（呕血量、黑便次数与量）、
 * 周围循环状态（头晕、心慌、出冷汗、尿少），以及长期服用 NSAIDs / 阿司匹林
 * 这一最重要的病因线索；查体抓贫血貌、皮肤黏膜苍白、肠鸣音活跃、上腹压痛。
 */
module.exports = {
  key: 'ugib',
  dept: 'digestive',
  name: '上消化道出血（消化性溃疡并出血）',
  alias: ['上消化道出血', '消化道出血', '溃疡出血', '十二指肠溃疡并出血', 'UGIB'],
  hint: '呕血、柏油样黑便，伴头晕心慌、贫血貌、肠鸣音活跃，需考虑消化性溃疡并上消化道出血',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '呕血、黑便',
      chiefComplaintDuration: '2',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '2天前无明显诱因出现柏油样黑便，共3次，每次量约150～200g',
      cause: '发病前1周因膝关节疼痛自行口服布洛芬缓释胶囊0.3g每日2次、阿司匹林肠溶片100mg每日1次',
      symptoms: '黑便质稀、有腥臭味；1天前呕吐咖啡渣样胃内容物2次，共约150ml，呕吐后上腹部烧灼感稍减轻',
      relief: '平卧休息后头晕可稍缓解，黑便及呕吐未见停止',
      evolution: '2天来黑便次数增多、转为稀糊状，头晕乏力加重，起身时眼前发黑，无晕厥',
      accompanying: '伴上腹部隐痛、反酸、心慌、出冷汗、口干',
      negativeDiscriminating: '无剧烈腹痛及腹膜刺激征，无咯血、牙龈出血及皮下瘀斑，无血尿，无体重明显下降',
      treatment: '未就诊，未服止血、抑酸药，仅进食少量米汤',
      generalCondition: '发病以来精神差，食欲下降，睡眠差，尿量减少，体重无明显下降',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '上腹部隐痛，多于空腹及夜间明显，进食后可缓解' },
        reflux: { checked: true, detail: '多于餐后及夜间出现，服抑酸药后可稍缓解' },
        nausea: { checked: true, detail: '未再呕吐，进食后上腹饱胀' },
        hematemesis: { checked: true, detail: '呕吐咖啡渣样胃内容物2次，共约150ml' },
        melena: { checked: true, detail: '排柏油样黑便3次，质稀' },
        hematochezia: { negative: true },
        constipation: { negative: true },
        jaundiceGi: { negative: true },
        appetiteLoss: { checked: true, detail: '食欲明显减退' }
      },
      hemat: {
        anemia: { checked: true, detail: '活动后加重，休息后可稍缓解' },
        bleeding: { negative: true },
        bruise: { negative: true }
      },
      resp: { fever: { negative: true } },
      cardio: { syncope: { negative: true } },
      nervous: { dizziness: { checked: true, detail: '多于体位改变时出现，伴眼前发黑' } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { '消化性溃疡': true },
      diseaseDetail: '2年来反复上腹部疼痛，多于空腹及夜间发作，进食后可缓解，未系统诊治；否认其他慢性病史',
      longTermMeds: '近1年因膝关节疼痛间断口服布洛芬缓释胶囊0.3g每日2次，近3个月自行加服阿司匹林肠溶片100mg每日1次，否认糖皮质激素服用史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '长期服用非甾体抗炎药及阿司匹林，为本次溃疡出血的重要诱因',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江温州，否认疫区及地方病流行区旅居史',
      smoking: '无',
      drinking: '无',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '饮食欠规律，三餐不定时，夜间常加餐，工作压力较大',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无粉尘、毒物及放射性物质接触史'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中消化性溃疡及消化道肿瘤病史',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        face: '贫血面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
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
        abdAuscultation: '肠鸣音活跃',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '上腹部压痛，无反跳痛'
      },
      special_digestive: {
        giLiverPalp: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
        giSpleenPalp: '脾脏未触及，脾区无摩擦感',
        giRectal: '直肠指检未触及肿物，指套无染血'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: '血红蛋白 76g/L，RBC 2.68×10¹²/L，MCV 82fl，MCH 26pg；WBC 8.6×10⁹/L，N 71%；PLT 246×10⁹/L；网织红细胞 4.2%', date: '', hospital: '', no: '' },
        { name: '粪便隐血', result: '阳性（＋＋）', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 12.6s，APTT 30.2s，INR 1.05', date: '', hospital: '', no: '' },
        { name: '肝肾功能及电解质', result: 'ALT 21U/L，AST 26U/L，总胆红素 14.6μmol/L，白蛋白 38g/L；BUN 11.2mmol/L，Cr 78μmol/L，K⁺ 3.6mmol/L', date: '', hospital: '', no: '' },
        { name: '胃镜', result: '十二指肠球部前壁可见1.2cm×1.0cm溃疡，表面覆血痂，周边黏膜充血水肿，球部变形；胃腔内见少量咖啡色液体；胃窦黏膜轻度充血。Forrest Ⅱb级', date: '', hospital: '', no: '' },
        { name: '幽门螺杆菌检测（胃镜下活检快速尿素酶试验）', result: '阳性', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: [
        '十二指肠球部溃疡并出血（Forrest Ⅱb级）',
        '失血性贫血（中度）',
        '幽门螺杆菌感染',
        '慢性非萎缩性胃炎'
      ]
    }
  }
};
