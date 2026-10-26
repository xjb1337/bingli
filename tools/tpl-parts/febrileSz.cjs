module.exports = {
  key: 'febrileSz',
  dept: 'pediatrics',
  name: '热性惊厥（单纯型，2岁）',
  alias: ['热性惊厥', '高热惊厥', '单纯型热性惊厥', '惊厥'],
  hint: '发热初期突发全身抽搐，双眼上翻、四肢强直抖动，数分钟内自行缓解',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '幼儿',
      reliability: '可靠',
      informant: '母亲',
      chiefComplaint: '发热1天，抽搐1次',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '1天前受凉后出现发热，体温最高39.5℃，伴流涕，精神稍差；6小时前体温升至39.5℃时突发抽搐',
      cause: '发病前有上呼吸道感染接触史，抽搐于体温快速上升期出现，无外伤及误服药物史',
      symptoms: '抽搐表现为双眼向上凝视、呼之不应、四肢对称性强直抖动，口周发绀，牙关紧闭，无口吐白沫及大小便失禁',
      relief: '予侧卧、松解衣领并温水擦浴后，抽搐持续约2分钟后自行缓解；退热后未再发作',
      evolution: '抽搐缓解后入睡约20分钟，醒后神志清楚，能认人、能说简单词语，肢体活动对称，无残留无力',
      accompanying: '伴流涕、轻咳，伴食欲下降，无呕吐及腹泻；抽搐后测体温39.5℃',
      negativeDiscriminating: '无反复抽搐及抽搐持续状态，无喷射性呕吐，无颈项强直，无皮疹，无腹泻，无头部外伤史，既往无热性惊厥及癫痫病史',
      treatment: '抽搐当时未予止惊药物，缓解后予对乙酰氨基酚混悬液1.5ml口服，约40分钟后体温降至38.2℃；起病以来口服小儿豉翘清热颗粒，疗效一般',
      generalCondition: '发病以来精神稍差，食欲下降，睡眠可，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      nervous: {
        seizure: { checked: true, detail: '发热39.5℃时突发全身抽搐1次，持续约2分钟，双眼上翻、四肢强直抖动、口周发绀' },
        headache: { negative: true },
        dizziness: { negative: true },
        sleepDisorder: { checked: true, detail: '抽搐后入睡约20分钟，夜间睡眠易惊醒' },
        weakness: { negative: true },
        numbness: { negative: true },
        memoryLoss: { negative: true },
        visualBlur: { negative: true }
      },
      resp: {
        fever: { checked: true, detail: '发热1天，最高体温39.5℃' },
        cough: { checked: true, detail: '轻咳，每日数次，无痰' },
        nasalObstruction: { checked: true, detail: '鼻塞、流清涕' },
        soreThroat: { negative: true },
        dyspnea: { negative: true },
        sputum: { negative: true },
        wheeze: { negative: true },
        chills: { checked: true, detail: '体温上升时畏寒、寒战' }
      },
      gi: {
        vomiting: { negative: true },
        nausea: { negative: true },
        diarrhea: { negative: true },
        abdominalPain: { negative: true },
        constipation: { negative: true },
        appetiteLoss: { checked: true, detail: '近1天进食量减少约一半' }
      },
      cardio: { palpitation: { negative: true }, cyanosis: { checked: true, detail: '抽搐时口周发绀，缓解后消失' }, edemaCardio: { negative: true } },
      gu: { oliguria: { negative: true }, dysuria: { negative: true }, edemaGu: { negative: true } },
      hemat: { anemia: { negative: true }, rash: { negative: true }, bleeding: { negative: true }, lymphNode: { negative: true } },
      endocrine: { polydipsia: { negative: true }, weightLoss: { negative: true } },
      joint: { jointPain: { negative: true }, backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认癫痫、脑炎、脑膜炎及颅脑外伤史，否认既往热性惊厥发作史，否认智力及运动发育落后',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、水痘等传染病史',
      surgery: '否认手术史',
      trauma: '否认头部外伤及坠落史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及药物误服史',
      vaccine: '按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗、乙脑疫苗均已按程序完成',
      allergy: '无',
      relatedHistory: '否认家族性癫痫及热性惊厥史，否认近期疫苗接种后发热',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      maternal: '母孕期体健，无妊娠期高血压及糖尿病，无宫内感染及产伤史，孕足月',
      birth: '足月顺产，出生体重3.4kg，出生时无窒息、无产伤及抢救史，Apgar评分正常',
      feeding: '生后母乳喂养至8月龄，6月龄起添加辅食，现与家人同餐，食欲一般',
      growth: '3月龄会抬头，6月龄会独坐，12月龄会独走，18月龄会说单词，现能说短句、能独走稳，生长发育与同龄儿相仿',
      residence: '浙江温州',
      travel: '否认疫区及外地旅居史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物接触史',
      environment: '家中无吸烟者，居室通风良好，无宠物接触史',
      habits: '作息规律，每日户外活动约1.5小时，夜间睡眠10～11小时',
      sexualHistory: '',
      occupationEnv: '幼儿，未入托'
    },
    marriage: { status: '未婚' },
    family: {
      diseaseChecks: {},
      other: '父母体健，否认近亲结婚，否认家族性癫痫及热性惊厥史',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病、癫痫及智力低下病史',
      similarDisease: '否认家族中有热性惊厥及癫痫患者',
      infectionHistory: '否认家庭内结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '急性病容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发分布均匀',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
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
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
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
        pedExtra3: '咽无充血，扁桃体无肿大',
        pedGrowth: '身高、体重、头围在同龄儿正常范围内',
        pedFontanel: '前囟已闭',
        pedResp: '呼吸平稳，无三凹征，无鼻翼扇动',
        pedHeart: '心率在正常范围，心音有力，律齐，未闻及杂音',
        pedAbdomen: '腹部平软，肝脾未超出同龄儿正常范围',
        pedNeuro: '原始反射已消失，脑膜刺激征阴性',
        pedRickets: '未见方颅、肋骨串珠、手镯及足镯征'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 12.6×10⁹/L，N 68.4%，L 26.2%，Hb 122g/L，PLT 268×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白', result: '12mg/L', date: '', hospital: '', no: '' },
        { name: '血生化', result: '血糖 5.2mmol/L，血钙 2.32mmol/L，血钠 136mmol/L，血钾 4.1mmol/L', date: '', hospital: '', no: '' },
        { name: '头颅CT', result: '脑实质未见异常密度影，脑室系统大小形态正常，中线结构居中', date: '', hospital: '', no: '' },
        { name: '脑电图', result: '背景活动正常，未见痫样放电', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['热性惊厥（单纯型）', '急性上呼吸道感染']
    }
  }
};
