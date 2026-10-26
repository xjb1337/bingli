module.exports = {
  key: 'pedDiarrhea',
  dept: 'pediatrics',
  name: '轮状病毒肠炎伴中度脱水（1岁2月）',
  alias: ['轮状病毒肠炎', '小儿腹泻', '腹泻病', '秋季腹泻', '婴幼儿腹泻'],
  hint: '蛋花汤样大便每日十余次，伴呕吐、尿少、前囟凹陷，秋冬季多见',
  record: {
    basic: {
      marital: '未婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '婴幼儿',
      reliability: '可靠',
      informant: '母亲',
      chiefComplaint: '腹泻伴呕吐3天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '3天前无明显诱因出现腹泻，初为稀糊便，当日转为蛋花汤样，无脓血及黏液',
      cause: '发病前1天家中进食隔夜米糊，且正值秋冬季腹泻流行季节、幼儿园有类似患儿，可诱发本病',
      symptoms: '大便每日10～12次，量多，呈黄色蛋花汤样，水分多，有酸臭味，无黏液脓血，每次排便前哭闹不安',
      relief: '口服蒙脱石散及口服补液盐后大便次数略减至每日8次，呕吐仍频繁，进食及饮水后即吐',
      evolution: '近1天呕吐加重，每日呕吐5～6次，为胃内容物，非喷射性；尿量明显减少，6小时未排尿',
      accompanying: '伴低热，体温最高38.1℃；伴精神萎靡、哭时泪少，伴口渴喜饮',
      negativeDiscriminating: '无黏液脓血便，无里急后重，无剧烈哭闹及果酱样便，无抽搐及意识障碍，无皮肤黄染，无尿痛及血尿',
      treatment: '2天前于当地诊所口服蒙脱石散1g每日3次、口服补液盐Ⅲ少量多次喂服，疗程2天；并予枯草杆菌二联活菌颗粒口服，呕吐及尿少未见改善，疗效不佳',
      generalCondition: '发病以来精神萎靡，食欲明显下降，睡眠差，小便量明显减少，3天来体重下降约0.4kg',
      extra: ''
    },
    ros: {
      gi: {
        diarrhea: { checked: true, detail: '每日10～12次，黄色蛋花汤样，量多，有酸臭味，无脓血' },
        vomiting: { checked: true, detail: '每日5～6次，为胃内容物，非喷射性，进食后加重' },
        nausea: { checked: true, detail: '喂食后干呕，随即呕吐' },
        abdominalPain: { checked: true, detail: '排便前哭闹不安，排便后缓解' },
        appetiteLoss: { checked: true, detail: '近3天拒食，仅少量饮水' },
        bloating: { checked: true, detail: '腹部较平时饱满，排气增多' },
        constipation: { negative: true },
        hematochezia: { negative: true },
        melena: { negative: true },
        jaundiceGi: { negative: true },
        toothache: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '近6小时未排尿，尿量明显减少' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        edemaGu: { negative: true },
        flankPain: { negative: true },
        discharge: { negative: true }
      },
      resp: { fever: { checked: true, detail: '低热，最高体温38.1℃' }, cough: { negative: true }, dyspnea: { negative: true } },
      cardio: { palpitation: { negative: true }, edemaCardio: { negative: true }, cyanosis: { negative: true } },
      nervous: {
        seizure: { negative: true },
        dizziness: { negative: true },
        sleepDisorder: { checked: true, detail: '因腹部不适及呕吐夜间频繁惊醒' },
        moodLow: { checked: true, detail: '精神萎靡，哭声弱，对逗引反应差' }
      },
      hemat: { anemia: { negative: true }, fatigue: { checked: true, detail: '活动明显减少，嗜睡状' }, bleeding: { negative: true } },
      endocrine: { weightLoss: { checked: true, detail: '3天内体重下降约0.4kg' }, polydipsia: { checked: true, detail: '口渴明显，频繁索水' }, polyuriaEndo: { negative: true } },
      joint: { jointPain: { negative: true }, backPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认反复腹泻、慢性腹泻及食物过敏史，否认热性惊厥史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核、水痘等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及异物误服史',
      vaccine: '按国家免疫规划接种，卡介苗、乙肝疫苗、脊灰疫苗、百白破疫苗、麻腮风疫苗均已按程序完成，轮状病毒疫苗未接种',
      allergy: '无',
      relatedHistory: '否认乳糖不耐受及牛奶蛋白过敏史，否认近期使用抗生素史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      maternal: '母孕期体健，无妊娠期高血压及糖尿病，无感染及用药史，孕足月',
      birth: '足月顺产，出生体重3.1kg，出生时无窒息及抢救史，Apgar评分正常',
      feeding: '生后母乳喂养至6月龄，6月龄起添加辅食，由米粉、菜泥逐步过渡至软食，现以软饭为主，仍母乳喂养每日2次',
      growth: '3月龄会抬头，6月龄会独坐，10月龄会独走，1岁会说简单单词，现能扶走数步，生长发育与同龄儿相仿',
      residence: '浙江温州',
      travel: '否认疫区及外地旅居史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物接触史',
      environment: '家中无吸烟者，居室通风良好，饮水为煮沸后自来水，无宠物接触史',
      habits: '作息规律，每日户外活动约1小时，饭前便后已训练洗手',
      sexualHistory: '',
      occupationEnv: '婴幼儿，未入托'
    },
    marriage: { status: '未婚' },
    family: {
      diseaseChecks: {},
      other: '父母体健，否认近亲结婚，母亲幼时有类似腹泻病史',
      deceased: '祖父母、外祖父母均健在',
      threeGeneration: '两系三代否认遗传性疾病及免疫缺陷病史',
      similarDisease: '否认家族中有慢性腹泻及炎症性肠病患者',
      infectionHistory: '否认家庭内结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神差',
        posture: '被动体位',
        face: '急性病容',
        cooperation: '查体不合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发稀疏',
        eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
        teeth: '舌质红、少苔'
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
        heartAuscultation: '心音低钝'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音活跃',
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
        pedExtra1: '前囟平软',
        pedExtra2: '毛细血管充盈时间延长',
        pedExtra3: '咽无充血，扁桃体无肿大',
        pedGrowth: '体重低于同龄儿',
        pedFontanel: '前囟凹陷',
        pedResp: '呼吸平稳，无三凹征，无鼻翼扇动',
        pedHeart: '心音低钝',
        pedAbdomen: '腹部膨隆',
        pedNeuro: '原始反射已消失，脑膜刺激征阴性',
        pedRickets: '未见方颅、肋骨串珠、手镯及足镯征'
      }
    },
    auxiliary: {
      items: [
        { name: '大便常规', result: '黄色稀水便，白细胞 0～2/HP，红细胞阴性，脂肪球（+）', date: '', hospital: '', no: '' },
        { name: '大便轮状病毒抗原检测', result: '阳性', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 8.6×10⁹/L，N 38.5%，L 55.2%，Hb 112g/L，PLT 312×10⁹/L', date: '', hospital: '', no: '' },
        { name: '血电解质', result: 'Na⁺ 133mmol/L，K⁺ 3.3mmol/L，Cl⁻ 98mmol/L，HCO₃⁻ 17mmol/L', date: '', hospital: '', no: '' },
        { name: '血气分析', result: 'pH 7.31，BE -6mmol/L，提示轻度代谢性酸中毒', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['轮状病毒肠炎', '中度等渗性脱水', '轻度代谢性酸中毒伴低钾血症']
    }
  }
};
