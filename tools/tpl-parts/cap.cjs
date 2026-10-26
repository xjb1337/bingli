/* 模板病例：社区获得性肺炎（右下肺，非重症）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：受凉后急起高热、寒战、咳嗽、咳黄脓痰、患侧胸痛，是肺炎链球菌肺炎的
 * 典型起病方式；肺实变的三大体征是叩诊浊音、语颤增强、语音共振增强，加上湿啰音。
 * 非重症的判据是没有休克、没有明显呼吸窘迫与意识改变，可在普通病房治疗。
 *
 * 说明：胸部查体的可选描述是固定词汇表，没有「右下肺叩诊浊音」这类带侧别的写法，
 * 侧别写在现病史与影像里，查体只写词汇表里逐字有的那几条。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'cap',
  dept: 'respiratory',
  name: '社区获得性肺炎（右下肺）',
  alias: ['社区获得性肺炎', 'CAP', '肺炎链球菌肺炎', '大叶性肺炎', '右下肺炎'],
  hint: '受凉后高热寒战、咳嗽咳黄脓痰、患侧胸痛，右下肺湿啰音伴语颤增强、叩诊浊音',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '江苏南京',
      birthPlace: '江苏南京',
      occupation: '公司职员',
      reliability: '可靠',
      chiefComplaint: '发热伴咳嗽、咳痰5天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '5天前淋雨受凉后出现发热，起病急，体温最高39.4度，伴畏寒、寒战，同日出现咳嗽、咳痰',
      cause: '起病前1天有淋雨及受凉史，无醉酒、呕吐及误吸，近期无外出旅行及禽类接触史',
      symptoms: '咳嗽为阵发性连声咳，咳黄色脓痰，每日约30ml，痰液黏稠不易咳出；发热以午后及夜间为著，服退热药后可短暂下降，数小时后复升；胸痛位于右侧下胸部，深呼吸及咳嗽时加重',
      relief: '自服布洛芬混悬液后体温可短暂下降，咳嗽及胸痛无缓解',
      evolution: '入院前2天热峰进一步升高，咳痰量增多，静息时亦有气促，平地行走百余米即感呼吸困难，遂来我院急诊',
      accompanying: '伴乏力、食欲减退，无恶心及呕吐',
      negativeDiscriminating: '无咯血及痰中带血，无夜间盗汗及明显消瘦，无尿频、尿急、尿痛，无下肢水肿及长期卧床史，无胸痛放射至肩背',
      treatment: '社区诊所予阿莫西林胶囊0.5g每日3次口服，连用4天，体温未降至正常，咳嗽咳痰无好转',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠因发热及咳嗽受影响，小便正常，大便偏干，体重无明显下降',
      extra: '入院后留取痰培养、血培养及痰抗酸染色，暂未使用抗结核药物'
    },
    ros: {
      resp: {
        cough: { checked: true, detail: '阵发性连声咳，咳黄色脓痰' },
        sputum: { checked: true, detail: '黄色脓痰，每日约30ml，黏稠不易咳出' },
        fever: { checked: true, detail: '体温最高39.4度，午后及夜间为著' },
        chills: { checked: true, detail: '起病时伴畏寒、寒战' },
        chestPainResp: { checked: true, detail: '右侧下胸部疼痛，深呼吸及咳嗽时加重' },
        dyspnea: { checked: true, detail: '活动后气促，平地行走百余米即感呼吸困难' },
        hemoptysis: { negative: true },
        nightSweat: { negative: true },
        wheeze: { negative: true }
      },
      cardio: {
        palpitation: { negative: true },
        edemaCardio: { negative: true }
      },
      gi: {
        nausea: { negative: true },
        vomiting: { negative: true },
        diarrhea: { negative: true }
      },
      gu: { dysuria: { negative: true } },
      endocrine: { weightLoss: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { 高血压: true },
      diseaseDetail: '高血压病史8年，长期口服苯磺酸氨氯地平5mg每日1次，血压控制尚可；否认糖尿病、冠心病史',
      longTermMeds: '苯磺酸氨氯地平5mg每日1次口服，服药规律',
      infection: '否认肝炎、结核等传染病史，否认结核病人密切接触史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '按计划预防接种，未接种肺炎链球菌疫苗及流感疫苗',
      allergy: '无',
      relatedHistory: '否认长期使用糖皮质激素及免疫抑制剂，否认酗酒',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '江苏南京，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟20年，每日约20支，未戒烟',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '办公室工作，无工业毒物及粉尘接触，工作节奏紧张、久坐、饮水量少'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
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
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '咽充血，扁桃体肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungInspect: '呼吸浅快',
        lungPalpation: '语颤增强',
        lungPercussion: '局部叩诊浊音',
        lungAuscultation: '右下肺可闻及湿性啰音',
        heartInspect: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
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
      special_respiratory: {
        respVocalResonance: '患侧语音共振增强',
        respChestExpansion: '肺下界移动度减小',
        respCyanosis: '无杵状指，无球结膜水肿'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 14.2×10⁹/L，中性粒细胞 88.6%，Hb 132g/L，PLT 218×10⁹/L', date: '', hospital: '', no: '' },
        { name: 'C反应蛋白及降钙素原', result: 'CRP 86mg/L，PCT 1.8ng/ml', date: '', hospital: '', no: '' },
        { name: '胸部CT（平扫）', result: '右下肺见大片状高密度实变影，内见支气管充气征，边界模糊，右侧胸膜腔少量积液', date: '', hospital: '', no: '' },
        { name: '痰培养', result: '检出肺炎链球菌，对青霉素、头孢曲松敏感', date: '', hospital: '', no: '' },
        { name: '动脉血气分析', result: 'pH 7.45，PaO2 68mmHg，PaCO2 36mmHg，HCO3⁻ 24mmol/L，SaO2 94%', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“发热伴咳嗽、咳痰5天”入院。5天前淋雨受凉后急起发热，体温最高39.4度，伴畏寒、寒战，咳黄色脓痰，右侧下胸部疼痛，深呼吸及咳嗽时加重，活动后气促。既往高血压病史8年。查体：急性病容，咽充血，右下肺语颤增强、局部叩诊浊音、可闻及湿性啰音，患侧语音共振增强。血常规示白细胞及中性粒细胞比例升高，CRP 86mg/L，PCT 1.8ng/ml；胸部CT示右下肺大片实变影伴支气管充气征；痰培养检出肺炎链球菌。无咯血、无夜间盗汗及消瘦，无下肢水肿及长期卧床史，可与肺结核、肺栓塞等鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '社区获得性肺炎（右下肺，非重症）',
            history: '淋雨受凉后急起发热，体温最高39.4度，伴畏寒、寒战，咳黄色脓痰，右侧下胸部疼痛，深呼吸及咳嗽时加重，活动后气促；无咯血、无夜间盗汗及消瘦，无下肢水肿及长期卧床史',
            pe: '急性病容，右下肺语颤增强、局部叩诊浊音、可闻及湿性啰音，患侧语音共振增强',
            aux: '血常规WBC 14.2×10⁹/L、中性粒细胞88.6%，CRP 86mg/L，PCT 1.8ng/ml；胸部CT示右下肺大片实变影伴支气管充气征；痰培养检出肺炎链球菌'
          },
          {
            diagnosis: '高血压病2级（高危）',
            history: '高血压病史8年，长期口服苯磺酸氨氯地平5mg每日1次，血压控制尚可',
            pe: '',
            aux: ''
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['社区获得性肺炎（右下肺，非重症）', '高血压病2级（高危）']
    }
  }
};
