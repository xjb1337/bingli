/* 模板病例：慢性心力衰竭急性加重（NYHA Ⅲ级，射血分数降低）
 *
 * 依据《内科学》第10版 p207-220（心力衰竭总论）：
 *   左心衰竭以肺淤血为特征：劳力性呼吸困难、夜间阵发性呼吸困难、端坐呼吸、
 *   咳嗽咳痰咯血、乏力疲倦（p208）。
 *   右心衰竭以体循环淤血为特征：消化道症状、劳力性呼吸困难、水肿（下肢凹陷性、
 *   下午出现、晨起减轻）、颈静脉怒张、肝颈静脉回流征阳性、肝大（p209）。
 *   查体：心脏扩大（左心室增大时心界向左下扩大）、肺动脉瓣区第二心音亢进、
 *   心尖区舒张期奔马律、两肺底湿啰音（p209-210）。
 * 查体值逐字取自 tools/pe-options.txt 的 def=/opt=，不要改词；不写生命体征（由学生测）。
 */
module.exports = {
  key: 'hf',
  dept: 'cardiology',
  name: '慢性心力衰竭急性加重（NYHA Ⅲ级）',
  alias: ['心力衰竭', '心衰', '慢性心功能不全', '充血性心力衰竭', 'CHF'],
  hint: '活动后气促伴双下肢水肿，夜间不能平卧、需垫高枕，颈静脉怒张、心界向左下扩大、双肺底湿啰音',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南通',
      birthPlace: '江苏南通',
      occupation: '退休工人',
      reliability: '可靠',
      // 时长写进主诉正文：emptyRecord() 的默认时长单位是「天」，另写 unit 会被默认值顶掉。
      // 主诉只写症状+时间，不含「心衰/心力衰竭」等诊断性词语（validate 会拦）。
      chiefComplaint: '活动后气短伴双下肢水肿2年'
    },
    hpi: {
      onset: '2年前开始出现快步走或上三楼时气短，休息数分钟可缓解，未系统诊治',
      // 以「无诱因」开头时 normalizeCause 判定为无诱因，不会拼成「…发病诱因」。
      cause: '无诱因，逐渐出现',
      symptoms: '气短呈劳力性，活动耐量逐年下降；1年前起出现双下肢对称性凹陷性水肿，午后加重、晨起减轻；夜间需垫高枕入睡，近1周出现夜间憋醒，需坐起约半小时方能缓解',
      relief: '曾于外院口服呋塞米片 20mg 每日1次、螺内酯片 20mg 每日1次，尿量增多后水肿可减轻，但停药即复发',
      evolution: '近1周受凉后气短加重，平地慢走百余米即需停下休息，夜间不能平卧，需半卧位入睡',
      accompanying: '伴夜间阵发性干咳、乏力、食欲减退、夜尿增多',
      // BRIEF 要求每个模板必须写鉴别阴性：这里的否定项对应《内科学》p208-210 需与
      // 支气管哮喘、心包积液、肝硬化腹水、肾病综合征鉴别的关键点。
      negativeDiscriminating: '无咯血及粉红色泡沫痰，无胸痛及压榨样不适，无发热，无午后低热及盗汗，无尿频尿急尿痛，无颜面部水肿，无皮肤黄染，无呕血黑便',
      treatment: '入院前已口服呋塞米片 20mg 每日1次共7天、螺内酯片 20mg 每日1次共7天、单硝酸异山梨酯缓释片 40mg 每日1次共3个月，气短可部分缓解；未规律服用β受体阻滞剂及血管紧张素转换酶抑制剂',
      // 「食欲减退」已在 accompanying 里写过，这里换成不同措辞，避免现病史出现重复分句。
      generalCondition: '发病以来精神一般，食欲较前减少，睡眠差（夜间憋醒），大便正常，夜尿2～3次，体重近1个月增加约3kg',
      extra: ''
    },
    ros: {
      cardio: {
        orthopnea: { checked: true, detail: '夜间不能平卧，需垫高枕，近1周需半卧位入睡，夜间憋醒后坐起约半小时缓解' },
        edemaCardio: { checked: true, detail: '双下肢对称性凹陷性水肿，午后加重、晨起减轻' },
        palpitation: { checked: true, detail: '活动后感心悸，休息后可缓解' },
        chestPainCardio: { negative: true },
        cyanosis: { negative: true },
        syncope: { negative: true },
        intermittentClaudication: { negative: true },
        edemaSys: { negative: true }
      },
      resp: {
        dyspnea: { checked: true, detail: '劳力性气短，平地慢走百余米即需休息' },
        cough: { checked: true, detail: '夜间阵发性干咳，坐起后减轻' },
        sputum: { negative: true },
        hemoptysis: { negative: true },
        wheeze: { negative: true },
        pleurisy: { negative: true },
        fever: { negative: true }
      },
      gi: {
        appetiteLoss: { checked: true, detail: '近1个月食欲明显减退，进食量约为平日一半' },
        bloating: { checked: true, detail: '饭后上腹胀满' },
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true }
      },
      gu: {
        nocturia: { checked: true, detail: '夜尿2～3次，量中等' },
        // 尿量减少是心衰低灌注的表现之一，本例无明显少尿，记为阴性。
        oliguria: { negative: true },
        edemaGu: { negative: true },
        hematuria: { negative: true },
        dysuria: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '活动后乏力明显，日常家务受限' }
      },
      nervous: {
        insomnia: { checked: true, detail: '夜间憋醒后难以再次入睡' },
        dizziness: { negative: true },
        syncopeNerve: { negative: true }
      }
    },
    pmh: {
      health: '既往体健，可从事日常家务',
      diseaseChecks: { 高血压: true, 冠心病: true, 高脂血症: true },
      diseaseOther: '',
      diseaseDetail: '高血压病史12年，最高血压 170/100mmHg，长期口服苯磺酸氨氯地平片 5mg 每日1次，血压控制在 140/85mmHg 左右；冠心病史6年，间断服用阿司匹林肠溶片 100mg 每日1次；高脂血症4年，未规律降脂治疗',
      longTermMeds: '苯磺酸氨氯地平片 5mg 每日1次（12年）；阿司匹林肠溶片 100mg 每日1次（6年，间断）；呋塞米片 20mg 每日1次（近7天）',
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
      relatedHistory: '否认风湿热及心肌炎病史，否认长期饮酒史，否认甲状腺疾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南通，否认疫区及地方病流行区长期居住史',
      travel: '',
      // 吸烟是冠心病的独立危险因素，也是诊断提示 acs 规则的特征之一，本例如实记录。
      smoking: '有',
      smokingAmount: '吸烟40年，每日约20支，未戒烟',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '饮食偏咸，喜食腌制食品，平素活动量少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '长期从事机械加工工作，已退休8年，无粉尘及电离辐射接触'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '近1年因气短较少', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true, 冠心病: true },
      other: '',
      deceased: '父亲因急性心肌梗死去世，享年68岁；母亲健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '父亲生前有高血压及冠心病史',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        // 端坐呼吸的病人不能平卧，体位记为强迫体位。
        conscious: '神志清楚，精神可',
        posture: '强迫体位',
        face: '慢性病容',
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
        // 右心衰竭的核心体征，同时命中诊断提示 hf 的 pev:neck.neckVessel=颈静脉怒张。
        neckVessel: '颈静脉怒张',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤对称，无胸膜摩擦感',
        lungPercussion: '双肺叩诊清音，肺下界位置正常',
        // 肺淤血体征，命中 hf 的匹配项。
        lungAuscultation: '双肺可闻及湿性啰音',
        heartInspect: '心尖搏动向左下移位',
        heartPalpation: '可触及抬举性心尖搏动',
        // 左心室增大时心界向左下扩大（《内科学》p209），命中 hf 的匹配项。
        heartPercussion: '心界向左下扩大',
        // 心音低钝，命中 hf 的匹配项；不写「可闻及奔马律」以免与专科 cardioHeartSound 重复计分。
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
        // 右心衰竭的体循环淤血体征，命中 hf 的匹配项。
        limbs: '双下肢凹陷性水肿',
        dorsalisPedis: '双侧足背动脉搏动对称有力'
      },
      // 专科查体：cardioExtra 声明了 summaryOf=[cardioHeartSound, cardioPeripheralSign]，
      // 写了它会让这两个明细项让位，所以本模板只写明细项，不写 cardioExtra。
      special_cardiology: {
        cardioApex: '心尖搏动向左下移位',
        cardioThrill: '心尖搏动呈抬举样',
        cardioBorder: '心界向左下扩大',
        cardioRate: '心率正常，心律齐',
        cardioHeartSound: '可闻及奔马律',
        cardioMurmur: '各瓣膜听诊区未闻及病理性杂音',
        cardioPericardium: '未闻及心包摩擦音',
        // 肝颈静脉回流征阳性：右心衰竭的可靠体征（《内科学》p209）。
        cardioJVP: '肝颈静脉回流征阳性',
        cardioEdema: '双下肢凹陷性水肿'
      },
      nervousPE: { nerve: '生理反射存在，病理反射未引出' }
    },
    auxiliary: {
      items: [
        {
          name: 'B型利钠肽（BNP）',
          result: 'B型利钠肽 1280pg/mL，显著升高',
          date: '', hospital: '', no: ''
        },
        {
          name: '心脏超声',
          result: '左心房前后径 46mm，左心室舒张末期内径 62mm，左心室射血分数 36%；室壁运动弥漫性减弱；二尖瓣轻度反流；下腔静脉增宽，呼吸变化率减低',
          date: '', hospital: '', no: ''
        },
        {
          name: '心电图',
          result: '窦性心律，心率 92次/分，Ⅱ、Ⅲ、aVF 导联呈 QS 型，ST-T 改变，左心室高电压',
          date: '', hospital: '', no: ''
        },
        {
          name: '胸部正位片',
          result: '两肺纹理增多增粗，肺门影增大模糊，双侧肋膈角变钝，心影增大，心胸比 0.62',
          date: '', hospital: '', no: ''
        },
        {
          name: '血常规',
          result: '血红蛋白 128g/L，白细胞 6.8×10⁹/L，中性粒细胞 68%，血小板 216×10⁹/L',
          date: '', hospital: '', no: ''
        }
      ]
    },
    diagnosis: {
      confirmed: [
        '慢性心力衰竭急性加重（NYHA Ⅲ级，射血分数降低）',
        '冠状动脉粥样硬化性心脏病',
        '高血压病2级（很高危）',
        '高脂血症'
      ]
    }
  }
};
