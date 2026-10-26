/* 模板病例：肾病综合征（微小病变型）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：「三高一低」——大量蛋白尿、低白蛋白血症、水肿、高脂血症；
 * 水肿多从眼睑及颜面开始，蔓延至全身，可伴胸腹腔积液；
 * 微小病变型对糖皮质激素敏感，成人需肾活检确诊并与膜性肾病、局灶节段性肾小球硬化鉴别。
 */
module.exports = {
  key: 'nephrotic',
  dept: 'nephrology',
  name: '肾病综合征（微小病变型）',
  alias: ['肾病综合征', '微小病变型肾病', '微小病变', 'NS'],
  hint: '大量蛋白尿、低白蛋白血症、全身凹陷性水肿、高脂血症，肾活检示微小病变',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '福建厦门',
      birthPlace: '福建厦门',
      occupation: '在读研究生',
      reliability: '可靠',
      chiefComplaint: '眼睑水肿伴尿泡沫增多1个月',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '月'
    },
    hpi: {
      onset: '1个月前晨起发现双眼睑水肿，洗脸后不易消退，午后自行减轻；同时尿中泡沫明显增多，静置10分钟不消散',
      cause: '发病前3周有咽痛、发热2天，自服感冒药后好转；无过敏及药物接触史',
      symptoms: '水肿由眼睑开始，1周内蔓延至颜面及双下肢，晨起颜面明显、午后下肢明显；现体重较发病前增加6kg，尿量较前减少，每日约900ml；尿泡沫多，呈细密状',
      relief: '卧床休息后水肿略减轻，利尿药效果不明显',
      evolution: '近1周腹部渐膨隆，平卧时气短，夜间不能平卧入睡',
      accompanying: '伴腹胀、乏力、食欲减退',
      negativeDiscriminating: '无肉眼血尿，无尿频尿急尿痛，无腰痛，无关节肿痛及皮疹，无脱发及口腔溃疡，无发热盗汗，无皮肤紫癜，无长期服用非甾体抗炎药及汞制剂史',
      treatment: '社区医院诊为「急性肾炎」，予氢氯噻嗪25mg每日2次口服1周，水肿无明显减轻，遂转我院',
      generalCondition: '发病以来精神一般，食欲减退，睡眠因夜间气短受影响，尿量减少，大便正常，体重较前增加6kg',
      extra: '入院后限盐限水、利尿，并完善24小时尿蛋白定量，行肾穿刺活检'
    },
    ros: {
      gu: {
        edemaGu: { checked: true, detail: '眼睑、颜面及双下肢水肿，晨起颜面为著' },
        oliguria: { checked: true, detail: '24小时尿量约900ml' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        flankPain: { negative: true },
        nocturia: { negative: true }
      },
      cardio: {
        edemaCardio: { checked: true, detail: '双下肢凹陷性水肿，夜间不能平卧' },
        orthopnea: { checked: true, detail: '夜间不能平卧入睡' },
        palpitation: { negative: true }
      },
      resp: {
        dyspnea: { checked: true, detail: '平卧时气短' },
        fever: { negative: true },
        cough: { negative: true },
        pleurisy: { negative: true },
        soreThroat: { checked: true, detail: '发病前3周咽痛、发热2天' }
      },
      gi: {
        bloating: { checked: true, detail: '腹部膨隆，腹胀' },
        appetiteLoss: { checked: true, detail: '食欲减退' },
        nausea: { negative: true },
        vomiting: { negative: true },
        abdominalPain: { checked: true, detail: '腹胀伴轻度全腹隐痛' },
        diarrhea: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '乏力，活动后明显' }
      },
      joint: {
        jointPain: { negative: true },
        morningStiff: { negative: true }
      },
      nervous: { headache: { negative: true }, dizziness: { checked: true, detail: '体位改变时头晕' } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、肝炎、结核病史；否认过敏性紫癜及系统性红斑狼疮病史',
      longTermMeds: '无长期服药史；近1个月服氢氯噻嗪25mg每日2次',
      infection: '否认肝炎、结核等传染病史；发病前3周有上呼吸道感染',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认汞、金制剂及青霉胺接触史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认过敏性疾病及关节炎病史；否认关节痛、脱发、光过敏',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于福建厦门，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认非甾体抗炎药、中草药及重金属接触史',
      environment: '',
      habits: '长期熬夜，饮食不规律，近期学业压力大',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '在校学习，无粉尘及放射性物质接触'
    },
    marriage: { status: '未婚', age: '', spouseHealth: '', sexLife: '未涉及', relation: '' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '面容自然',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑水肿',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉充盈'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '呼吸音减弱',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '移动性浊音阳性',
        fluidThrill: '液波震颤阳性'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '双下肢凹陷性水肿'
      },
      special_nephrology: {
        renalFacialEdema: '颜面水肿',
        renalLegEdema: '双下肢凹陷性水肿',
        renalSkin: '皮肤黏膜无苍白、出血点及尿素霜',
        renalPercussion: '双肾区无叩击痛',
        renalBladder: '膀胱未触及，耻骨上区无压痛',
        renalCardio: '双肺未闻及湿啰音，未闻及心包摩擦音'
      }
    },
    auxiliary: {
      items: [
        { name: '24小时尿蛋白定量', result: '6.8g/24h，尿量 900ml，尿蛋白 4+', date: '', hospital: '', no: '' },
        { name: '血生化', result: '血浆白蛋白 18g/L，总胆固醇 9.2mmol/L，甘油三酯 3.6mmol/L，血肌酐 72μmol/L，尿素氮 5.2mmol/L', date: '', hospital: '', no: '' },
        { name: '肾穿刺活检（光镜及电镜）', result: '光镜下肾小球基本正常，近端小管上皮细胞空泡及脂肪变性；免疫荧光阴性；电镜下足突广泛融合，未见电子致密物沉积', date: '', hospital: '', no: '' },
        { name: '泌尿系超声', result: '双肾大小形态正常，皮髓质分界清晰，双肾实质回声略增强，未见结石及积水', date: '', hospital: '', no: '' },
        { name: '免疫学检查', result: '抗核抗体阴性，抗双链DNA阴性，补体C3 1.12g/L、C4 0.28g/L，乙肝表面抗原阴性', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['肾病综合征（微小病变型）', '胸腔积液', '腹腔积液']
    }
  }
};
