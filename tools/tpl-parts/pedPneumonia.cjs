module.exports = {
  key: 'pedPneumonia',
  dept: 'pediatrics',
  name: '支气管肺炎（3岁）',
  alias: ['支气管肺炎', '小儿肺炎', '肺炎', 'pediatric pneumonia'],
  hint: '发热、咳嗽伴气促，双肺可闻及固定中细湿啰音',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '学龄前儿童',
      reliability: '可靠',
      informant: '母亲',
      chiefComplaint: '发热伴咳嗽5天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '5天前受凉后出现发热，体温最高39.2℃，每日发热2～3次，服退热药后可暂降至正常',
      cause: '幼儿园同班有呼吸道感染患儿接触史，可诱发本病',
      symptoms: '咳嗽呈阵发性连声咳，夜间及晨起为著，初为干咳，近2天咳出白色黏痰，尚能咳出',
      relief: '口服布洛芬混悬液后体温可降至正常，4～6小时后复升；咳嗽雾化后略减轻',
      evolution: '近2天咳嗽加重，出现气促，活动及哭闹后口周发青，夜间不能安睡',
      accompanying: '伴鼻塞、流涕，伴食欲下降，精神较前萎靡',
      negativeDiscriminating: '无抽搐，无意识障碍，无皮疹，无呕吐及腹泻，无耳痛及耳流脓，无盗汗及消瘦',
      treatment: '5天前于当地诊所口服阿莫西林颗粒0.25g每日3次，疗程3天，并口服小儿氨酚黄那敏颗粒，服药后体温反复，咳嗽未见好转，疗效不佳',
      generalCondition: '发病以来精神较前萎靡，食欲下降，睡眠差，大小便正常，尿量略减少，体重无明显变化',
      extra: ''
    },
    ros: {
      resp: {
        fever: { checked: true, detail: '发热5天，最高体温39.2℃，每日发热2～3次' },
        cough: { checked: true, detail: '阵发性连声咳，夜间及晨起加重，咳白色黏痰' },
        sputum: { checked: true, detail: '白色黏痰，量中等，尚能咳出' },
        dyspnea: { checked: true, detail: '活动及哭闹后气促，口周发青' },
        nasalObstruction: { checked: true, detail: '鼻塞、流清涕' },
        wheeze: { negative: true },
        hemoptysis: { negative: true },
        chestPainResp: { negative: true },
        chills: { checked: true, detail: '体温上升时畏寒、寒战' },
        nightSweat: { negative: true },
        soreThroat: { negative: true },
        hoarseness: { negative: true },
        pleurisy: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        diarrhea: { negative: true },
        abdominalPain: { negative: true },
        appetiteLoss: { checked: true, detail: '近3天进食量约为平时一半' },
        constipation: { negative: true },
        bloating: { negative: true }
      },
      cardio: { palpitation: { negative: true }, cyanosis: { checked: true, detail: '哭闹后口周轻度发青' }, edemaCardio: { negative: true } },
      nervous: {
        seizure: { negative: true },
        headache: { negative: true },
        dizziness: { negative: true },
        sleepDisorder: { checked: true, detail: '夜间咳嗽频繁，入睡困难、易醒' }
      },
      gu: { oliguria: { checked: true, detail: '近2天尿量较平时减少约三分之一' }, dysuria: { negative: true }, edemaGu: { negative: true } },
      hemat: { anemia: { negative: true }, fatigue: { checked: true, detail: '活动减少，易疲倦' }, lymphNode: { negative: true } },
      endocrine: { weightLoss: { negative: true }, polydipsia: { negative: true } },
      joint: { jointPain: { negative: true }, backPain: { negative: true } }
    },
    pmh: {
      health: '平素体质一般，近1年患呼吸道感染3次',
      diseaseChecks: {},
      diseaseDetail: '否认哮喘、先天性心脏病、结核等病史，否认热性惊厥史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、水痘等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及异物误服史',
      vaccine: '按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗均已按程序完成，流感疫苗未接种',
      allergy: '无',
      relatedHistory: '否认反复肺炎及迁延性腹泻史，否认异物吸入史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      maternal: '母孕期体健，无妊娠期高血压及糖尿病，无感染及用药史，孕足月',
      birth: '足月顺产，出生体重3.2kg，出生时无窒息及抢救史，Apgar评分正常',
      feeding: '生后母乳喂养至10月龄，4月龄起添加辅食，由米粉、蛋黄逐步过渡至软食，现与家人同餐',
      growth: '3月龄会抬头，6月龄会独坐，12月龄会独走，18月龄会说简单单词，现能说短句，生长发育与同龄儿相仿',
      residence: '浙江温州',
      travel: '否认疫区及外地旅居史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物接触史',
      environment: '家中无吸烟者，居室通风良好，无宠物接触史',
      habits: '入幼儿园1年，作息规律，户外活动每日约1小时',
      sexualHistory: '',
      occupationEnv: '学龄前儿童，在园就读'
    },
    marriage: { status: '未婚' },
    family: {
      diseaseChecks: { '哮喘': '哮喘' },
      other: '父亲患支气管哮喘，母亲体健，否认近亲结婚',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病及免疫缺陷病史',
      similarDisease: '否认家族中有类似反复肺炎患者',
      infectionHistory: '否认家庭内结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '双侧颈部可触及肿大淋巴结'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发分布均匀',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '咽充血，扁桃体肿大',
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
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出'
      },
      special_pediatrics: {
        pedExtra1: '生长发育与同龄儿相仿',
        pedExtra2: '皮肤无黄染、花纹，毛细血管充盈良好',
        pedExtra3: '咽充血，扁桃体肿大',
        pedGrowth: '身高、体重、头围在同龄儿正常范围内',
        pedFontanel: '前囟已闭',
        pedResp: '呼吸急促',
        pedHeart: '心率在正常范围，心音有力，律齐，未闻及杂音',
        pedAbdomen: '腹部平软，肝脾未超出同龄儿正常范围',
        pedNeuro: '原始反射已消失，脑膜刺激征阴性',
        pedRickets: '未见方颅、肋骨串珠、手镯及足镯征'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 15.8×10⁹/L，N 74.2%，L 20.5%，Hb 118g/L，PLT 286×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白', result: '32mg/L，降钙素原 0.35ng/ml', date: '', hospital: '', no: '' },
        { name: '胸部正位片', result: '双肺纹理增粗，右下肺野可见斑片状模糊影，边缘不清，心影大小形态正常，双侧肋膈角锐利', date: '', hospital: '', no: '' },
        { name: '呼吸道病原体检测', result: '肺炎支原体IgM阴性，呼吸道合胞病毒抗原阴性，流感病毒抗原阴性', date: '', hospital: '', no: '' },
        { name: '血气分析', result: 'pH 7.38，PaO₂ 78mmHg，PaCO₂ 36mmHg，SpO₂ 96%', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['支气管肺炎', '急性上呼吸道感染', '轻度贫血']
    }
  }
};
