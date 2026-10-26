/* 模板病例：风湿性心脏瓣膜病 主动脉瓣关闭不全（重度）
 *
 * 依据《内科学》第10版 p330-345（心脏瓣膜病）：
 *   主动脉瓣关闭不全：慢性者可多年无症状，一旦出现症状则病情迅速进展；
 *   常见症状为心悸、心前区不适、头部搏动感、体位性头晕（p338）。
 *   体征：心尖搏动向左下移位，呈抬举样；心浊音界向左下扩大；
 *   主动脉瓣区可闻及舒张期吹风样递减型杂音，前倾坐位、呼气末更清楚；
 *   重度反流者可有水冲脉、枪击音、毛细血管搏动征等周围血管征（p338-339）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'valve',
  dept: 'cardiology',
  name: '风湿性心脏瓣膜病 主动脉瓣关闭不全（重度）',
  alias: ['心脏瓣膜病', '风湿性心脏病', '主动脉瓣关闭不全', '主动脉瓣反流', '瓣膜病'],
  hint: '活动后心悸气短、头部搏动感，主动脉瓣区可闻及舒张期杂音，水冲脉阳性、心界向左下扩大',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '湖南长沙',
      birthPlace: '湖南长沙',
      occupation: '小学教师',
      reliability: '可靠',
      // 主诉只写症状+时间；「瓣膜病」是诊断性词语，不能进主诉（validate 会拦）。
      chiefComplaint: '活动后心悸、气短3年，加重1个月'
    },
    hpi: {
      onset: '3年前开始出现快步走或上三楼时心悸、气短，休息数分钟可缓解，未系统诊治',
      // 「无明显诱因」开头 → normalizeCause 判为无诱因，避免拼出重复句子。
      cause: '无明显诱因，劳累及上呼吸道感染后加重',
      symptoms: '心悸为心前区搏动感，安静时亦能感觉到心跳，伴头部随心跳搏动感；气短以活动后为著，尚能平卧',
      relief: '休息后可缓解，未规律服药；1个月前受凉后症状加重，当地诊所予利尿、扩血管治疗后可减轻',
      evolution: '近1个月气短加重，上二楼即感气促，偶有夜间憋醒需坐起片刻，无咯粉红色泡沫痰',
      accompanying: '伴乏力、活动耐力下降，偶有体位性头晕，无胸痛，无黑矇及晕厥',
      // 对应《内科学》p330-339：与二尖瓣狭窄、冠心病、心肌病、感染性心内膜炎鉴别的关键点。
      negativeDiscriminating: '无胸痛及压榨样不适，无咯血，无持续发热，无关节红肿热痛，无环形红斑及皮下结节，无黑矇及晕厥，无夜间不能平卧及双下肢水肿，无尿量减少',
      treatment: '1周前门诊心脏超声提示主动脉瓣重度反流、左心室扩大，为进一步诊治收入院',
      generalCondition: '发病以来精神可，食欲正常，睡眠欠佳，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      cardio: {
        // 心悸、心前区搏动感是本例的核心症状。
        palpitation: { checked: true, detail: '心前区搏动感，安静时亦能感觉到心跳，活动后明显' },
        // 重度主动脉瓣反流可有体位性头晕，与心源性晕厥鉴别（《内科学》p338）。
        syncope: { checked: true, detail: '久蹲后站起时头晕，无黑矇及意识丧失' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        cyanosis: { negative: true },
        intermittentClaudication: { negative: true },
        edemaSys: { negative: true }
      },
      resp: {
        dyspnea: { checked: true, detail: '活动后气短，上二楼即感气促，尚能平卧' },
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
        melena: { negative: true }
      },
      gu: {
        oliguria: { negative: true },
        edemaGu: { negative: true },
        hematuria: { negative: true },
        nocturia: { negative: true },
        dysuria: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '活动耐力进行性下降，上二楼即需休息' },
        anemia: { negative: true }
      },
      endocrine: {
        weightGain: { negative: true },
        weightLoss: { negative: true },
        heatIntolerance: { negative: true },
        coldIntolerance: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '体位变动时头晕，无黑矇及意识丧失' },
        syncopeNerve: { negative: true },
        headache: { negative: true },
        numbness: { negative: true },
        weakness: { negative: true },
        speech: { negative: true },
        insomnia: { checked: true, detail: '夜间易醒，入睡尚可' }
      },
      joint: {
        // 风湿热活动期可有游走性关节痛，须问清（《内科学》p330）。
        jointPain: { negative: true },
        morningStiff: { negative: true },
        muscleWeak: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，可胜任教学工作',
      diseaseChecks: {},
      diseaseOther: '',
      // 风湿热是瓣膜病最常见的病因（《内科学》p330），须交代清楚。
      diseaseDetail: '青少年时期曾有反复咽痛、发热，未规律诊治；否认风湿热及舞蹈症病史记载',
      longTermMeds: '间断口服氢氯噻嗪 25mg 每日1次、单硝酸异山梨酯 20mg 每日2次',
      infection: '否认肝炎、结核、伤寒等传染病史；近半年无咽痛及发热',
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
      relatedHistory: '否认高血压、糖尿病、冠心病史；否认静脉药物滥用史；否认拔牙及侵入性操作后发热史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '湖南长沙，否认疫区及地方病流行区长期居住史',
      travel: '',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认毒物、粉尘及放射性物质接触史',
      environment: '',
      habits: '生活规律，饮食清淡，日常活动量中等',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事小学教学工作28年，以站立授课为主，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '25', spouseHealth: '配偶体健', sexLife: '近半年因气短减少', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母均健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '家族中无类似疾病患者',
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
        thyroid: '甲状腺无肿大',
        // 主动脉瓣关闭不全时收缩压升高、舒张压降低，颈动脉搏动增强呈「点头征」（《内科学》p339）。
        neckVessel: '颈动脉搏动增强',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        // 左心室扩大 → 心尖搏动向左下移位、呈抬举样（《内科学》p338-339）。
        heartInspect: '心尖搏动向左下移位',
        heartPalpation: '可触及抬举性心尖搏动',
        heartPercussion: '心界向左下扩大',
        // 核心体征，同时也是诊断提示 valve 规则唯一可用的匹配值。
        heartAuscultation: '主动脉瓣区可闻及舒张期杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        // 右心受累时肝大及肝颈静脉回流征阳性，本例尚未出现。
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      // 专科查体：不写 cardioExtra（它声明了 summaryOf=[cardioHeartSound,cardioPeripheralSign]，
      // 写了会让这两个明细项让位不输出）。
      special_cardiology: {
        cardioApex: '心尖搏动向左下移位',
        // 主动脉瓣关闭不全可在主动脉瓣第二听诊区触及舒张期震颤（《内科学》p339）。
        cardioThrill: '可触及舒张期震颤',
        cardioBorder: '心界向左下扩大',
        cardioRate: '心率正常，心律齐',
        cardioHeartSound: '第一心音减弱',
        cardioMurmur: '主动脉瓣区可闻及舒张期杂音',
        cardioPericardium: '未闻及心包摩擦音',
        cardioJVP: '肝颈静脉回流征阴性',
        // 周围血管征是重度主动脉瓣反流的标志性体征（《内科学》p339）。
        cardioPeripheralSign: '水冲脉阳性',
        cardioEdema: '双下肢无水肿'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出',
        babinski: '巴氏征阴性'
      }
    },
    auxiliary: {
      items: [
        {
          name: '心脏超声',
          result: '主动脉瓣增厚、回声增强，舒张期见重度反流束；左心室舒张末期内径 66mm，左心室射血分数 56%；提示主动脉瓣重度关闭不全，左心室扩大',
          date: '', hospital: '', no: ''
        },
        {
          name: '心电图',
          result: '窦性心律，心率 82次/分，左心室高电压，ST-T 改变（Ⅰ、aVL、V5、V6 导联 ST 段压低）',
          date: '', hospital: '', no: ''
        },
        {
          name: '胸部X线片',
          result: '心影向左下扩大，主动脉结突出，肺纹理清晰，未见肺淤血征象',
          date: '', hospital: '', no: ''
        },
        {
          name: '血沉及抗链球菌溶血素O',
          result: '血沉 12mm/h，抗链球菌溶血素O ＜200IU/mL，C反应蛋白 3.2mg/L，提示目前无风湿活动',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规',
          result: '白细胞 6.4×10^9/L，中性粒细胞百分比 62%，血红蛋白 132g/L，血小板 210×10^9/L',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '风湿性心脏瓣膜病 主动脉瓣关闭不全（重度）',
        '左心室扩大',
        '心功能Ⅱ级（NYHA 分级）'
      ]
    }
  }
};
