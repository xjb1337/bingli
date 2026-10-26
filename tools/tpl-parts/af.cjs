/* 模板病例：非瓣膜性心房颤动（CHA₂DS₂-VASc 4 分，拟抗凝）
 *
 * 依据《内科学》第10版 p221-240（心律失常）心房颤动部分：
 *   症状轻重受心室率快慢的影响，心室率超过150次/分时可有心绞痛与充血性心力衰竭；
 *   心室率不快时可无症状（p223）。
 *   体征：第一心音强弱不等，心律绝对不规则，脉搏短绌（p223-224）。
 *   房颤易并发体循环栓塞，以脑栓塞最常见（p224）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'af',
  dept: 'cardiology',
  name: '非瓣膜性心房颤动（CHA₂DS₂-VASc 4 分）',
  alias: ['心房颤动', '房颤', 'AF', '心律失常', '阵发性心房颤动'],
  hint: '阵发性心悸伴胸闷，心律绝对不齐、第一心音强弱不等、脉搏短绌，心电图见 f 波、R-R 间期绝对不齐',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '山东济南',
      birthPlace: '山东济南',
      occupation: '退休教师',
      reliability: '可靠',
      // 主诉只写症状+时间，「房颤/心律失常」属诊断性词语，不能出现在主诉里。
      chiefComplaint: '阵发性心悸伴胸闷2年'
    },
    hpi: {
      onset: '2年前无明显诱因出现阵发性心悸，每次持续数十分钟至数小时，可自行终止，发作时自数脉搏快而不齐',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因，不会拼成「…发病诱因」。
      cause: '无明显诱因，多于劳累及情绪激动后发作',
      symptoms: '发作时心悸明显，心率快而不规则，伴胸闷、乏力，偶有头晕，无黑矇及晕倒',
      relief: '发作时静坐休息或深呼吸后可逐渐缓解；曾自服美托洛尔片 25mg 1次，心悸可减轻',
      evolution: '近1年发作次数增多，由每月1～2次增至每周2～3次；近1周发作持续不缓解，心悸伴胸闷明显加重',
      accompanying: '伴活动后气短、乏力、睡眠差，无胸痛及大汗',
      // 对应《内科学》p223-224 需与阵发性室上性心动过速、房扑、甲状腺功能亢进、
      // 病态窦房结综合征鉴别的关键点。
      negativeDiscriminating: '无胸痛及压榨样不适，无大汗及濒死感，无黑矇及晕厥，无发热，无怕热多汗及手抖，无体重明显下降，无咯血及下肢水肿，无夜间阵发性呼吸困难',
      treatment: '2年来间断口服美托洛尔缓释片 47.5mg 每日1次，发作频繁时加服普罗帕酮片 150mg，心悸可部分缓解；未规律抗凝治疗；1周前门诊心电图证实为心房颤动，为进一步诊治收入院',
      generalCondition: '发病以来精神一般，食欲可，睡眠差（夜间心悸易醒），大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      cardio: {
        // 房颤最常见的症状，命中 af 规则的匹配项 ros:cardio.palpitation。
        palpitation: { checked: true, detail: '阵发性心悸，发作时心率快而不规则，自数脉搏有漏搏感' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        cyanosis: { negative: true },
        syncope: { negative: true },
        intermittentClaudication: { negative: true },
        edemaSys: { negative: true }
      },
      resp: {
        dyspnea: { checked: true, detail: '发作时及活动后气短，休息可缓解' },
        cough: { negative: true },
        hemoptysis: { negative: true },
        pleurisy: { negative: true },
        wheeze: { negative: true },
        fever: { negative: true }
      },
      gi: {
        appetiteLoss: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true }
      },
      gu: {
        nocturia: { negative: true },
        oliguria: { negative: true },
        hematuria: { negative: true },
        dysuria: { negative: true },
        edemaGu: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '活动后乏力，上两层楼即需休息' }
      },
      endocrine: {
        // 甲亢是房颤必须排除的继发原因，此处明确记录为阴性。
        heatIntolerance: { negative: true },
        weightLoss: { negative: true },
        polyphagia: { negative: true },
        hairLoss: { negative: true },
        neckMass: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '发作时轻度头晕，持续数分钟，无黑矇' },
        // 房颤最需警惕脑栓塞，神经系统症状必须逐一问过并记为阴性。
        syncopeNerve: { negative: true },
        weakness: { negative: true },
        numbness: { negative: true },
        speech: { negative: true },
        headache: { negative: true },
        insomnia: { checked: true, detail: '夜间心悸易醒，入睡困难' }
      }
    },
    pmh: {
      health: '既往体健，可胜任日常工作',
      diseaseChecks: { 高血压: true },
      diseaseOther: '',
      diseaseDetail: '高血压病史8年，最高血压 158/92mmHg，长期口服苯磺酸氨氯地平片 5mg 每日1次，血压控制在 135/80mmHg 左右',
      longTermMeds: '苯磺酸氨氯地平片 5mg 每日1次（8年）；美托洛尔缓释片 47.5mg 每日1次（2年，间断）',
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
      relatedHistory: '否认风湿热及心脏瓣膜病史，否认甲状腺功能亢进病史，否认长期大量饮酒史，否认睡眠呼吸暂停诊断史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '山东济南，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '饮食清淡，平素饮浓茶每日2～3杯，睡眠欠佳',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事中学语文教学35年，已退休5年，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健', sexLife: '近2年较少', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true, 冠心病: true },
      other: '',
      deceased: '母亲因脑卒中去世，享年76岁；父亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '母亲生前有高血压及心房颤动病史',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
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
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        // 甲亢是房颤的常见继发原因，甲状腺须明确记录为无肿大（同时命中 pe:neck.thyroid）。
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
        // 房颤的核心听诊体征（《内科学》p223-224），命中 af 规则的 must 与匹配项。
        heartAuscultation: '心律不齐，可闻及早搏'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如',
        // 脉搏短绌是房颤的特征性体征（《内科学》p224）。
        radialPulse: '脉搏短绌',
        dorsalisPedis: '双侧足背动脉搏动对称有力'
      },
      // 专科查体：cardioExtra 声明了 summaryOf，写了会让细则项让位，本模板只写明细项。
      special_cardiology: {
        cardioApex: '心尖搏动位置正常，搏动范围无明显扩大',
        cardioThrill: '心尖搏动无抬举感，未触及震颤及心包摩擦感',
        cardioBorder: '心浊音界各径线在正常范围',
        // 心律绝对不齐是房颤的定义性体征。
        cardioRate: '心律不齐，心房颤动',
        cardioHeartSound: '第一心音减弱',
        cardioMurmur: '各瓣膜听诊区未闻及病理性杂音',
        cardioPericardium: '未闻及心包摩擦音',
        cardioJVP: '肝颈静脉回流征阴性',
        cardioPeripheralSign: '水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性'
      },
      nervousPE: {
        // 房颤并发脑栓塞风险高，神经系统查体必须记录阴性。
        nerve: '生理反射存在，病理反射未引出',
        // 值必须逐字取自该子项的 nor=/opt=（这里只有「巴氏征阴性/阳性/双侧巴氏征阳性」三种写法）。
        babinski: '巴氏征阴性'
      }
    },
    auxiliary: {
      items: [
        {
          name: '心电图',
          result: 'P 波消失，代之以大小不等、形态各异的 f 波，频率约 420次/分；R-R 间期绝对不规则；心室率约 118次/分；未见 ST 段抬高',
          date: '', hospital: '', no: ''
        },
        {
          name: '动态心电图',
          result: '全程心房颤动，总心搏 112400 次，平均心室率 96次/分，最快 156次/分，最慢 62次/分，未见长于 2.0 秒的停搏',
          date: '', hospital: '', no: ''
        },
        {
          name: '心脏超声',
          result: '左心房前后径 44mm，左心室舒张末期内径 50mm，左心室射血分数 58%；各瓣膜未见明显增厚及反流；未见心包积液；左心耳未见明确血栓',
          date: '', hospital: '', no: ''
        },
        {
          name: '甲状腺功能',
          result: 'FT3 4.4pmol/L，FT4 16.1pmol/L，TSH 2.36mIU/L，均在正常范围',
          date: '', hospital: '', no: ''
        },
        {
          name: '凝血功能',
          result: '凝血酶原时间 12.1秒，国际标准化比值 1.02，活化部分凝血活酶时间 32秒，D-二聚体 0.42mg/L',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '非瓣膜性心房颤动（CHA₂DS₂-VASc 4 分，HAS-BLED 1 分）',
        '高血压病2级（高危）'
      ]
    }
  }
};
