/* 模板病例：急性ST段抬高型心肌梗死（下壁，Killip Ⅰ级）
 *
 * 依据《内科学》第10版 p258-280（动脉粥样硬化与冠状动脉粥样硬化性心脏病）：
 *   急性心肌梗死先兆：初发型心绞痛、原有心绞痛加重（p258）。
 *   症状：疼痛是最先出现的症状，多发生于清晨，部位与心绞痛相同，
 *   但诱因多不明显，程度较重，持续时间较长，可达数小时至数天，
 *   休息和含服硝酸甘油多不能缓解；可伴恶心、呕吐、上腹胀痛（p259）。
 *   体征：心率多增快，心尖区第一心音减弱，可出现第四心音奔马律；
 *   发生乳头肌功能失调时心尖区可出现粗糙的收缩期杂音（p261）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'acs',
  dept: 'cardiology',
  name: '急性ST段抬高型心肌梗死（下壁）',
  alias: ['急性心肌梗死', '心梗', 'STEMI', '冠心病', '冠状动脉粥样硬化性心脏病'],
  hint: '突发持续性胸骨后压榨样疼痛，含服硝酸甘油不缓解，伴大汗、恶心，心电图Ⅱ、Ⅲ、aVF 导联 ST 段抬高',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河北石家庄',
      birthPlace: '河北石家庄',
      occupation: '个体经营者',
      reliability: '可靠',
      // 主诉只写症状+时间，不含「心肌梗死/冠心病」等诊断性词语（validate 会拦）。
      chiefComplaint: '突发胸骨后压榨样疼痛3小时'
    },
    hpi: {
      // 「程度剧烈」只在 symptoms 里出现一次，避免现病史重复分句。
      onset: '3小时前于睡眠中突发胸骨后压榨样疼痛，无明确诱因，持续不缓解',
      // 「无诱因」开头 → normalizeCause 判为无诱因，不会拼成「…发病诱因」。
      cause: '无诱因，于夜间睡眠中突然出现',
      symptoms: '疼痛位于胸骨后中下段，范围约手掌大小，向左肩、左上肢内侧及下颌放射，呈压榨样，程度剧烈，难以忍受',
      relief: '自行含服硝酸甘油片 0.5mg 共2次，间隔5分钟，疼痛未见缓解；休息后亦无减轻',
      evolution: '疼痛持续约3小时无间歇，程度无减轻',
      accompanying: '伴大汗淋漓、恶心、呕吐胃内容物1次，伴胸闷、气短、心悸及濒死感',
      // 对应《内科学》p259-261 需与主动脉夹层、肺栓塞、急性心包炎、气胸、急腹症鉴别的关键点。
      negativeDiscriminating: '无撕裂样疼痛向背部放射，无咯血及晕厥，无发热及咳嗽咳痰，无深呼吸时疼痛加重，无上腹部压痛及反跳痛，无呕血黑便，无夜间阵发性呼吸困难及双下肢水肿',
      treatment: '院前予阿司匹林肠溶片 300mg 嚼服、替格瑞洛片 180mg 负荷剂量口服，硝酸甘油片含服2次无效；急救中心心电图示Ⅱ、Ⅲ、aVF 导联 ST 段弓背向上抬高，为进一步诊治收入院',
      generalCondition: '发病以来精神差，因疼痛不能平卧，未进饮食，未解大小便，体重无明显变化',
      extra: ''
    },
    ros: {
      cardio: {
        // 核心阳性症状，同时命中诊断提示 acs 的 must 项 ros:cardio.chestPainCardio。
        chestPainCardio: { checked: true, detail: '胸骨后压榨样疼痛，向左肩及左上肢内侧放射，持续3小时不缓解' },
        palpitation: { checked: true, detail: '心悸伴濒死感' },
        cyanosis: { negative: true },
        orthopnea: { negative: true },
        edemaCardio: { negative: true },
        syncope: { negative: true },
        intermittentClaudication: { negative: true },
        edemaSys: { negative: true }
      },
      resp: {
        dyspnea: { checked: true, detail: '伴气短，平卧时明显，坐起后稍减轻' },
        cough: { negative: true },
        hemoptysis: { negative: true },
        pleurisy: { negative: true },
        wheeze: { negative: true },
        fever: { negative: true },
        nightSweat: { negative: true }
      },
      gi: {
        nausea: { checked: true, detail: '伴恶心' },
        vomiting: { checked: true, detail: '呕吐胃内容物1次，量约100mL' },
        abdominalPain: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        diarrhea: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '发病后明显乏力、大汗' }
      },
      nervous: {
        dizziness: { checked: true, detail: '伴头晕，无黑矇' },
        syncopeNerve: { negative: true },
        headache: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，可从事体力劳动',
      diseaseChecks: { 高血压: true, 糖尿病: true, 高脂血症: true },
      diseaseOther: '',
      diseaseDetail: '高血压病史10年，最高血压 165/95mmHg，长期口服缬沙坦胶囊 80mg 每日1次；2型糖尿病史5年，口服二甲双胍缓释片 0.5g 每日2次，空腹血糖波动在 7.0～8.5mmol/L；高脂血症3年，未规律服药',
      longTermMeds: '缬沙坦胶囊 80mg 每日1次（10年）；二甲双胍缓释片 0.5g 每日2次（5年）；阿托伐他汀钙片 20mg 每晚1次（间断服用）',
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
      relatedHistory: '否认既往心绞痛发作史，否认风湿热、心肌炎及心肌病病史，否认长期大量饮酒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '河北石家庄，否认疫区及地方病流行区长期居住史',
      travel: '',
      // 吸烟与糖脂代谢异常都是冠心病的独立危险因素，也是 acs 规则的匹配特征。
      smoking: '有',
      smokingAmount: '吸烟30年，每日约20支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮白酒每周3～4次，每次约100mL，共20年',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '饮食偏油腻，口味偏咸，平素运动少，睡眠不规律',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '经营小商店，长期站立，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶患高血压，规律服药', sexLife: '近半年因劳累较少', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true, 糖尿病: true, 冠心病: true },
      other: '',
      deceased: '父亲因脑卒中去世，享年72岁；母亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '父亲生前有高血压、糖尿病及冠心病史',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        // 疼痛剧烈、大汗，属急性病容；不写「神志清楚，精神差」，避免给休克规则送 must 项。
        conscious: '神志清楚，精神可',
        posture: '强迫体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        // 大汗但无发绀；不写「口唇及肢端发绀」，避免触发休克规则。
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
        // 心界不大：取默认值，不会产生 pe: 特征，也不会给 hf 规则送匹配项。
        heartPercussion: '心界不大',
        // 急性心肌梗死第一心音减弱（《内科学》p261），命中 acs 的匹配项 pev:...=心音低钝。
        heartAuscultation: '心音低钝'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        // 不写「双下肢凹陷性水肿」，避免给 hf 规则送匹配项。
        limbs: '四肢无畸形，关节无红肿，活动自如',
        dorsalisPedis: '双侧足背动脉搏动对称有力'
      },
      // 专科查体：cardioExtra 声明了 summaryOf，写了会让 cardioHeartSound/cardioPeripheralSign
      // 让位，本模板只写明细项。心音减弱与第一心音改变是本例的核心听诊所见。
      special_cardiology: {
        cardioApex: '心尖搏动位置正常，搏动范围无明显扩大',
        cardioThrill: '心尖搏动无抬举感，未触及震颤及心包摩擦感',
        cardioBorder: '心浊音界各径线在正常范围',
        // 心梗后心率增快（《内科学》p261）。此处用「心动过速」。
        cardioRate: '心动过速',
        cardioHeartSound: '第一心音减弱',
        cardioMurmur: '各瓣膜听诊区未闻及病理性杂音',
        // 急性心包炎是心梗的重要鉴别诊断，心包摩擦音阴性须明确记录。
        cardioPericardium: '未闻及心包摩擦音',
        cardioJVP: '肝颈静脉回流征阴性',
        cardioPeripheralSign: '水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        {
          name: '心电图',
          result: '窦性心律，心率 98次/分，Ⅱ、Ⅲ、aVF 导联 ST 段弓背向上抬高 0.2～0.4mV，伴病理性Q波形成，Ⅰ、aVL 导联 ST 段压低',
          date: '', hospital: '', no: ''
        },
        {
          name: '心肌损伤标志物',
          result: '肌钙蛋白I 12.6ng/mL（参考值＜0.04ng/mL），肌酸激酶同工酶 186U/L，肌红蛋白 420ng/mL，均显著升高',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规',
          result: '血红蛋白 142g/L，白细胞 12.8×10⁹/L，中性粒细胞 82%，血小板 246×10⁹/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '血脂',
          result: '总胆固醇 6.8mmol/L，甘油三酯 2.4mmol/L，低密度脂蛋白胆固醇 4.6mmol/L',
          date: '', hospital: '', no: ''
        },
        {
          name: '心脏超声',
          result: '左心室下壁及后壁运动幅度减弱，左心室射血分数 52%，各瓣膜未见明显反流，未见心包积液',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '急性ST段抬高型心肌梗死（下壁，Killip Ⅰ级）',
        '冠状动脉粥样硬化性心脏病',
        '高血压病2级（很高危）',
        '2型糖尿病',
        '高脂血症'
      ]
    }
  }
};
