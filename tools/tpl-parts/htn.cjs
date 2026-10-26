/* 模板病例：高血压病3级（很高危）伴左心室肥厚
 *
 * 依据《内科学》第10版 p291-305（原发性高血压）：
 *   大多数起病缓慢，缺乏特殊临床表现，常见症状有头晕、头痛、颈项板紧、
 *   疲劳、心悸等，也可出现视物模糊、鼻出血等较重症状（p292）。
 *   体征：一般较少，心脏听诊可有主动脉瓣区第二心音亢进、收缩期杂音或收缩早期喀喇音；
 *   长期持续高血压使左心室肥厚、扩大，形成高血压性心脏病（p292-293）。
 *   靶器官损害评估包括心脏（左心室肥厚）、肾脏、眼底、血管（p294）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'htn',
  dept: 'cardiology',
  name: '高血压病3级（很高危）伴左心室肥厚',
  alias: ['高血压', '原发性高血压', '高血压病', '高血压性心脏病'],
  hint: '头晕头痛、颈项板紧多年，血压长期 180/110mmHg 左右，心界向左下扩大、主动脉瓣区第二心音亢进',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河南郑州',
      birthPlace: '河南郑州',
      occupation: '机关干部',
      reliability: '可靠',
      // 主诉只写症状+时间；「高血压」是诊断性词语，不能写进主诉（validate 会拦）。
      chiefComplaint: '间断头晕、头痛8年，加重1周'
    },
    hpi: {
      onset: '8年前单位体检时发现血压升高，最高 180/110mmHg，当时无明显不适，未规律服药',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因。
      cause: '无明显诱因，多于劳累、熬夜及情绪激动后加重',
      symptoms: '头晕呈头部昏沉感，多于晨起及午后出现，伴枕部胀痛、颈项板紧，每次持续约半小时至数小时，休息后可缓解',
      relief: '曾口服硝苯地平控释片 30mg 每日1次，服药后头晕可缓解，因无明显不适自行停药多次',
      evolution: '近1周工作紧张后头晕加重，每日发作2～3次，伴视物模糊一次，持续约1分钟后自行恢复',
      accompanying: '伴心悸、乏力、睡眠欠佳，无恶心呕吐，无肢体活动障碍',
      // 对应《内科学》p292-294：需与继发性高血压（肾性、肾血管性、嗜铬细胞瘤、
      // 原发性醛固酮增多症、皮质醇增多症）及脑血管意外鉴别的关键点。
      negativeDiscriminating: '无阵发性头痛伴心悸大汗，无发作性乏力及周期性麻痹，无向心性肥胖及满月脸，无颜面及双下肢水肿，无肉眼血尿及尿量减少，无胸痛及压榨样不适，无夜间不能平卧，无言语不清及肢体无力，无发热',
      treatment: '8年来间断口服硝苯地平控释片 30mg 每日1次、缬沙坦胶囊 80mg 每日1次，服药不规律，血压波动在 150～180/90～110mmHg；1周前门诊测血压 178/108mmHg，为进一步诊治收入院',
      // 「睡眠欠佳」已在 accompanying 写过，这里改用不同措辞，避免现病史重复分句。
      generalCondition: '发病以来精神可，食欲正常，入睡困难且易醒，大小便正常，夜尿1～2次，体重近1年增加约4kg',
      extra: ''
    },
    ros: {
      cardio: {
        // 心悸是高血压常见症状，也是本例的主诉伴随症状。
        palpitation: { checked: true, detail: '活动及情绪激动时心悸，休息后可缓解' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        cyanosis: { negative: true },
        syncope: { negative: true },
        intermittentClaudication: { negative: true },
        edemaSys: { negative: true }
      },
      resp: {
        dyspnea: { negative: true },
        cough: { negative: true },
        hemoptysis: { negative: true },
        pleurisy: { negative: true },
        wheeze: { negative: true },
        fever: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        appetiteLoss: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true }
      },
      gu: {
        nocturia: { checked: true, detail: '夜尿1～2次，量中等' },
        // 靶器官损害评估：肾脏受累的表现须逐一问过并记为阴性。
        oliguria: { negative: true },
        hematuria: { negative: true },
        edemaGu: { negative: true },
        dysuria: { negative: true },
        polyuria: { negative: true }
      },
      hemat: {
        // 鼻出血是血压显著升高的表现之一（《内科学》p292），本例无。
        epistaxis: { negative: true },
        fatigue: { checked: true, detail: '近1年易疲劳，工作耐力下降' }
      },
      endocrine: {
        // 继发性高血压的筛查点，逐项记为阴性。
        hairChange: { negative: true },
        weightGain: { checked: true, detail: '近1年体重增加约4kg，腹型肥胖明显' },
        weightLoss: { negative: true },
        neckMass: { negative: true },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true }
      },
      nervous: {
        // 头晕头痛是主诉；脑血管并发症相关症状必须逐一问过。
        headache: { checked: true, detail: '枕部胀痛，多于晨起及午后出现，持续半小时至数小时' },
        dizziness: { checked: true, detail: '头部昏沉感，休息后可缓解' },
        visualBlur: { checked: true, detail: '1周前出现视物模糊1次，持续约1分钟后自行恢复' },
        numbness: { negative: true },
        weakness: { negative: true },
        speech: { negative: true },
        syncopeNerve: { negative: true },
        insomnia: { checked: true, detail: '入睡困难，夜间易醒' }
      }
    },
    pmh: {
      health: '既往体健，可胜任日常工作',
      diseaseChecks: { 高血压: true, 高脂血症: true },
      diseaseOther: '',
      diseaseDetail: '高血压病史8年，最高血压 180/110mmHg，服药不规律，血压控制不佳；高脂血症3年，未规律治疗',
      longTermMeds: '硝苯地平控释片 30mg 每日1次（间断）；缬沙坦胶囊 80mg 每日1次（间断）',
      infection: '否认肝炎、结核、伤寒等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及特殊化学物质接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '否认肾炎及泌尿系统疾病史，否认阵发性头痛心悸大汗发作史，否认长期服用糖皮质激素及甘草制剂史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '河南郑州，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '有',
      smokingAmount: '吸烟25年，每日约15支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮白酒每周2～3次，每次约150mL，共20年',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '口味偏咸，每日食盐摄入量估计超过10g，应酬较多，运动少，睡眠不足',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事行政管理工作30年，长期伏案、精神紧张，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '27', spouseHealth: '配偶体健', sexLife: '近1年较少', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true, 脑卒中: true, 糖尿病: true },
      other: '',
      deceased: '父亲因脑出血去世，享年70岁；母亲患高血压，健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '父母均有高血压病史，父亲生前因脑出血去世',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        // 高血压患者多超重，本例 BMI 偏高，记为肥胖更贴近实际。
        nutrition: '肥胖',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        // 眼底改变是高血压靶器官损害的重要评估内容（《内科学》p294），
        // 本例暂无出血渗出，记录为阴性描述。
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
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
        // 长期高血压致左心室肥厚、心尖搏动向左下移位（《内科学》p293）。
        heartInspect: '心尖搏动向左下移位',
        heartPalpation: '可触及抬举性心尖搏动',
        // 左心室肥厚、扩大 → 心界向左下扩大；此值同时命中诊断提示的 pe: 与 pev: 两个特征。
        heartPercussion: '心界向左下扩大',
        // 主动脉瓣区第二心音亢进是高血压的典型听诊所见（《内科学》p292），
        // 但 chest.heartAuscultation 的可用值里不含「P2亢进」，故此处只记录主动脉瓣区杂音阴性，
        // P2 亢进写在专科查体 cardioHeartSound（该处有「P2亢进」选项）。
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        // 肾动脉狭窄是继发性高血压的常见原因，腹部血管杂音须明确记录为阴性。
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        dorsalisPedis: '双侧足背动脉搏动对称有力'
      },
      // 专科查体：不写 cardioExtra（它有 summaryOf，会让 cardioHeartSound/cardioPeripheralSign 让位）。
      special_cardiology: {
        cardioApex: '心尖搏动向左下移位',
        cardioThrill: '心尖搏动呈抬举样',
        cardioBorder: '心界向左下扩大',
        cardioRate: '心率正常，心律齐',
        // 主动脉瓣区第二心音亢进是高血压的标志性听诊所见（《内科学》p292）。
        cardioHeartSound: 'P2亢进',
        cardioMurmur: '各瓣膜听诊区未闻及病理性杂音',
        cardioPericardium: '未闻及心包摩擦音',
        cardioJVP: '肝颈静脉回流征阴性',
        cardioEdema: '双下肢无水肿'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        // 高血压是脑卒中的首要危险因素，病理征必须记录阴性。
        babinski: '巴氏征阴性'
      }
    },
    auxiliary: {
      items: [
        {
          name: '尿常规',
          result: '尿蛋白阴性，尿糖阴性，尿潜血阴性，镜检未见红细胞及白细胞',
          date: '', hospital: '', no: ''
        },
        {
          name: '肾功能',
          result: '血肌酐 88μmol/L，尿素氮 5.6mmol/L，估算肾小球滤过率 92mL/(min·1.73m²)',
          date: '', hospital: '', no: ''
        },
        {
          name: '心脏超声',
          result: '室间隔厚度 13mm，左心室后壁厚度 12mm，左心室舒张末期内径 52mm，左心室射血分数 62%；主动脉瓣轻度反流；提示左心室肥厚',
          date: '', hospital: '', no: ''
        },
        {
          name: '心电图',
          result: '窦性心律，心率 76次/分，左心室高电压（Rv5 2.8mV），ST-T 改变',
          date: '', hospital: '', no: ''
        },
        {
          name: '血脂',
          result: '总胆固醇 6.2mmol/L，甘油三酯 2.6mmol/L，低密度脂蛋白胆固醇 4.1mmol/L',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '高血压病3级（很高危）',
        '高血压性心脏病（左心室肥厚）',
        '高脂血症'
      ]
    }
  }
};
