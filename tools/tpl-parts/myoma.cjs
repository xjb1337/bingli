module.exports = {
  key: 'myoma',
  dept: 'gynecology',
  name: '子宫肌瘤（多发性，拟手术）',
  alias: ['子宫肌瘤', '多发性子宫肌瘤', '肌瘤', '子宫平滑肌瘤', 'myoma'],
  hint: '经量增多、经期延长伴贫血，下腹可触及包块，超声示多发肌瘤',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '教师',
      reliability: '可靠',
      informant: '本人',
      chiefComplaint: '月经量增多伴经期延长1年',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: ''
    },
    hpi: {
      onset: '1年前无明显诱因出现月经量增多，较前约增加一倍，经期由5天延长至9～10天',
      cause: '无明显诱因，否认近期精神应激、剧烈运动及服用激素类药物',
      symptoms: '经量增多以第2～3天为著，需每1～2小时更换卫生巾，伴大量暗红色血块，经期延长至9～10天',
      relief: '经期卧床休息及口服氨甲环酸片1.0g每日3次后经量可略减少，停药后复现',
      evolution: '近半年症状加重，经期延长至10天，周期缩短至22～25天；3个月前自行扪及下腹正中包块，逐渐增大',
      accompanying: '伴头晕、乏力、活动后心悸，伴尿频、夜尿增多，无排尿困难，无便秘',
      negativeDiscriminating: '无停经史，无阴道不规则流血及接触性出血，无下腹剧痛，无发热，无消瘦及食欲下降',
      treatment: '半年前于我院门诊查血常规示血红蛋白86g/L，予琥珀酸亚铁0.1g每日3次口服并口服氨甲环酸，疗程3个月，复查血红蛋白升至102g/L，经量无明显减少',
      generalCondition: '发病以来精神可，食欲正常，睡眠可，大小便正常，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { negative: true },
        constipation: { negative: true },
        diarrhea: { negative: true },
        nausea: { negative: true },
        vomiting: { negative: true },
        appetiteLoss: { negative: true },
        bloating: { checked: true, detail: '下腹坠胀感，午后及久站后明显' },
        jaundiceGi: { negative: true }
      },
      gu: {
        dysuria: { checked: true, detail: '尿频、夜尿2～3次，无尿急尿痛' },
        hematuria: { negative: true },
        oliguria: { negative: true },
        flankPain: { negative: true },
        edemaGu: { negative: true },
        discharge: { negative: true }
      },
      hemat: {
        anemia: { checked: true, detail: '面色苍白、头晕、活动后心悸，血红蛋白最低86g/L' },
        fatigue: { checked: true, detail: '近半年易疲乏，上二楼即感气短' },
        bleeding: { checked: true, detail: '经量增多、经期延长1年' },
        pallorSkin: { checked: true, detail: '面色及口唇苍白' },
        bruise: { negative: true },
        lymphNode: { negative: true }
      },
      resp: { fever: { negative: true }, cough: { negative: true }, dyspnea: { negative: true } },
      cardio: { palpitation: { checked: true, detail: '活动后心悸，休息后可缓解' }, edemaCardio: { negative: true }, orthopnea: { negative: true } },
      endocrine: { polydipsia: { negative: true }, polyuriaEndo: { negative: true }, weightLoss: { negative: true }, weightGain: { negative: true } },
      nervous: { headache: { checked: true, detail: '经期及劳累后头晕、头痛' }, dizziness: { checked: true, detail: '体位改变时头晕，无晕厥' }, visualBlur: { negative: true }, sleepDisorder: { negative: true } },
      joint: { backPain: { checked: true, detail: '腰骶部酸痛，经期加重' }, jointPain: { negative: true } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: { '贫血': '贫血' },
      diseaseDetail: '1年前于我院诊断为缺铁性贫血，否认高血压、糖尿病、心脏病病史',
      longTermMeds: '间断口服琥珀酸亚铁及氨甲环酸，无其他长期用药',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及放射线接触史',
      vaccine: '按计划预防接种',
      allergy: '有',
      allergenChecks: { '磺胺类': '磺胺类' },
      allergenReactionChecks: { '皮疹': '皮疹' },
      allergyReaction: '服用磺胺类药后出现全身散在红色皮疹，停药后消退',
      relatedHistory: '否认长期服用激素类药物及保健品，否认宫腔操作史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '浙江温州',
      travel: '否认疫区及传染病接触史',
      smoking: '无',
      drinking: '无',
      drugs: '否认毒品及成瘾性药物滥用史',
      environment: '',
      habits: '工作以站立为主，饮食偏素，近半年注意补充含铁食物',
      sexualHistory: '已婚，配偶固定，否认不洁性接触史',
      occupationEnv: '小学教师，无粉尘、毒物及放射线接触'
    },
    marriage: { status: '已婚', age: '29', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    menstruation: {
      applicable: '有',
      age: '13',
      cycle: '23',
      duration: '9',
      quantity: '增多，约为既往两倍',
      color: '暗红',
      clot: '有，量多',
      leukorrhea: '量稍多，色白，无异味',
      lmp: '2025年10月8日',
      menopauseAge: '',
      dysmenorrhea: '有，经期第1～2天下腹坠痛，需服止痛药'
    },
    childbirth: {
      applicable: '有',
      fullTerm: '1',
      premature: '0',
      abortion: '0',
      alive: '1',
      gravida: '1',
      para: '1',
      details: '10年前足月顺产一男婴，产程顺利，无产后出血',
      lastBirth: '末次分娩于10年前',
      contraception: '宫内节育器已取出，现用避孕套'
    },
    family: {
      diseaseChecks: { '高血压': '高血压', '糖尿病': '糖尿病' },
      other: '母亲患高血压，父亲患2型糖尿病，均规律服药',
      deceased: '祖父母已故，死因不详；外祖父母健在',
      threeGeneration: '两系三代否认遗传性疾病及妇科肿瘤病史',
      similarDisease: '否认家族中有子宫肌瘤及类似疾病患者',
      infectionHistory: '否认结核、肝炎等传染病接触史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神可',
        posture: '自主体位',
        face: '贫血面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性良好',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: {
        headShape: '头颅大小、形态正常，无压痛及包块',
        hair: '毛发稀疏',
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
        heartAuscultation: '心尖区可闻及收缩期杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPercussion: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
        abdPalpation: '可触及腹部包块'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      nervousPE: {
        nerve: '生理反射存在，病理反射未引出'
      },
      special_gynecology: {
        gynVulva: '外阴发育正常，未见赘生物、溃疡及色素减退',
        gynVagina: '阴道通畅，黏膜光滑，分泌物量少、色白、无异味',
        gynCervix: '宫颈光滑，大小正常，无举痛，无接触性出血',
        gynUterus: '子宫增大',
        gynAdnexa: '双附件区未触及包块，无压痛',
        gynTriple: '三合诊未触及异常，直肠黏膜光滑',
        gynBreast: '双侧乳房对称，未触及肿块，乳头无溢液',
        gynAbdomen: '下腹部可触及包块'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'Hb 88g/L，MCV 71fl，MCH 22pg，WBC 5.6×10⁹/L，PLT 268×10⁹/L', date: '', hospital: '', no: '' },
        { name: '铁代谢', result: '血清铁蛋白 8ng/ml，血清铁 5.2μmol/L，总铁结合力升高', date: '', hospital: '', no: '' },
        { name: '盆腔超声', result: '子宫前位，增大如孕12周大小，肌层回声不均，可见多个低回声结节，最大者位于前壁肌层，大小约5.6cm×4.8cm，边界清；双附件未见异常', date: '', hospital: '', no: '' },
        { name: '盆腔增强MRI', result: '子宫多发肌瘤，最大者约5.8cm，结合带完整，未见附件区异常信号', date: '', hospital: '', no: '' },
        { name: '宫颈液基细胞学（TCT）', result: '未见上皮内病变及恶性细胞（NILM）', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['子宫肌瘤（多发性，肌壁间为主）', '缺铁性贫血（中度）', '慢性失血性贫血']
    }
  }
};
