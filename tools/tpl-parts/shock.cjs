/* 模板病例：失血性休克（外伤性脾破裂）
 *
 * 教材依据：《外科学》第10版 第五章 外科休克 p67-88
 *   - 休克代偿期：精神紧张、兴奋或烦躁不安、皮肤苍白、四肢厥冷、心率加快、脉压减小、呼吸加快、尿量减少
 *   - 休克失代偿期：神情淡漠、反应迟钝；出冷汗、口唇肢端发绀；脉搏细速、血压进行性下降
 *   - 低血容量性休克第二节：大量出血或体液丢失致 CVP 降低、回心血量减少、心排血量下降；
 *     治疗关键是及时补充血容量、处理病因、制止继续失血
 *   - 腹腔内实质脏器（脾）破裂出血是外科最常见的失血性休克病因之一，腹穿抽出不凝血即可确诊
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 查体描述逐字取自 tools/pe-options.txt，不得自造。
 */
module.exports = {
  key: 'shock',
  dept: 'emergency',
  name: '失血性休克（外伤性脾破裂）',
  alias: ['失血性休克', '休克', '脾破裂', '外伤性脾破裂', '低血容量性休克'],
  hint: '外伤后左上腹痛、面色苍白、脉搏细速、腹穿不凝血 —— 提示腹腔实质脏器破裂出血并发失血性休克',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河南周口',
      birthPlace: '河南周口',
      occupation: '建筑工人',
      reliability: '患者本人陈述，家属补充，可靠',
      chiefComplaint: '外伤后左上腹疼痛伴头晕、心悸',
      chiefComplaintDuration: '5',
      chiefComplaintDurationUnit: '小时'
    },
    hpi: {
      onset: '5小时前骑电动车摔倒，左上腹撞击车把，当即感左上腹持续性胀痛，尚能自行站起',
      cause: '5小时前车祸外伤，左上腹钝性撞击，无皮肤破损',
      symptoms: '腹痛为持续性胀痛，向左肩部放射，蜷曲体位可稍缓解；伤后1小时站立时突发头晕、眼前发黑，短暂意识丧失约10秒后自行清醒；伴心悸、口干',
      relief: '卧倒休息后头晕稍减轻，腹痛无缓解；来院途中予平卧位、鼻导管吸氧3L/min',
      evolution: '近2小时面色渐苍白，心悸加重，说话无力，四肢发凉，头晕由活动后出现转为静卧时亦存在',
      accompanying: '伴恶心2次，未呕吐；无呕血、黑便，无胸痛及呼吸困难，无血尿',
      negativeDiscriminating: '无头痛及喷射性呕吐，无四肢麻木及活动障碍，无发热寒战，无腹泻及里急后重',
      treatment: '伤后未用止血药物，当地卫生院建立静脉通路输注复方氯化钠500ml，头晕无改善；未输血',
      generalCondition: '伤后精神差，未进食，排尿1次量约100ml、色深黄，未解大便'
    },
    ros: {
      resp: {
        dyspnea: { checked: true, detail: '平卧时稍感气短，坐起可缓解' },
        cough: { negative: true },
        chestPainResp: { negative: true },
        hemoptysis: { negative: true }
      },
      cardio: {
        palpitation: { checked: true, detail: '心悸，活动后加重' },
        chestPainCardio: { negative: true },
        orthopnea: { negative: true },
        syncope: { checked: true, detail: '伤后1小时站立时短暂意识丧失约10秒' }
      },
      gi: {
        abdominalPain: { checked: true, detail: '左上腹持续性胀痛，向左肩部放射' },
        nausea: { checked: true, detail: '恶心2次，未呕吐' },
        vomiting: { negative: true },
        hematemesis: { negative: true },
        melena: { negative: true },
        diarrhea: { negative: true }
      },
      gu: {
        oliguria: { checked: true, detail: '伤后5小时仅排尿1次，量约100ml' },
        hematuria: { negative: true },
        dysuria: { negative: true }
      },
      nervous: {
        dizziness: { checked: true, detail: '站立时头晕、眼前发黑' },
        weakness: { checked: true, detail: '四肢无力，说话无力' },
        headache: { negative: true },
        seizure: { negative: true }
      },
      hemat: {
        anemia: { checked: true, detail: '面色苍白，家人诉较平日明显' },
        fatigue: { checked: true, detail: '乏力明显，不愿活动' }
      },
      joint: { backPain: { checked: true, detail: '左肩部酸痛，活动尚可' } }
    },
    pmh: {
      health: '平素体健，从事建筑工作，无慢性病用药',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病、血液病及肝病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '5小时前左上腹钝性外伤（电动车车把撞击）',
      transfusion: '否认输血及输血反应史',
      poisoning: '否认毒物及农药接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认长期饮酒史，否认服用抗凝及抗血小板药物',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于河南周口，否认疫区及地方病流行区久居史',
      maternal: '',
      birth: '足月顺产，出生体重正常',
      feeding: '',
      growth: '生长发育与同龄人相仿',
      smoking: '有',
      smokingAmount: '吸烟10年，每日约10支',
      drinking: '无',
      drugs: '否认毒物及药物滥用史',
      environment: '',
      habits: '长期从事建筑体力劳动，饮食不规律',
      sexualHistory: '',
      occupationEnv: '建筑工地作业，有高处坠落及钝性外伤风险'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中有血液病及肿瘤患者',
      infectionHistory: '否认结核、肝炎等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '被动体位',
        face: '贫血面容',
        cooperation: '查体欠合作'
      },
      skin: {
        color: '口唇及肢端发绀',
        rash: '未见皮疹及出血点',
        spider: '未见蜘蛛痣及肝掌',
        elasticity: '皮肤弹性减退',
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
        lungInspect: '呼吸浅快',
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
        abdAuscultation: '肠鸣音减弱',
        abdPercussion: '移动性浊音阳性',
        abdPalpation: '全腹压痛、反跳痛，腹肌紧张'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '四肢无畸形，关节无红肿，活动自如'
      },
      special_emergency: {
        emExtra1: '休克表现',
        emExtra2: '腹部闭合性损伤',
        emConscious: '神志清楚，双侧瞳孔等大等圆，对光反射灵敏',
        emAirway: '气道通畅，呼吸平稳，双肺呼吸音对称',
        emCirculation: '脉搏细速',
        emShock: '休克指数>1.0',
        emTraumaABC: '活动性出血',
        emTraumaSurvey: '腹部压痛',
        emSkin: '皮肤湿冷',
        emAbdomen: '腹膜刺激征阳性'
      }
    },
    auxiliary: {
      items: [
        { name: '血常规', result: 'WBC 14.2×10⁹/L，N 82%，Hb 58g/L，PLT 148×10⁹/L，红细胞压积 18%', date: '', hospital: '', no: '' },
        { name: '腹腔穿刺', result: '左下腹穿刺抽出暗红色不凝血 5ml，放置 5 分钟不凝固', date: '', hospital: '', no: '' },
        { name: '床旁超声（FAST）', result: '脾周及左结肠旁沟可见无回声区，深约 42mm，脾实质回声不均，考虑脾破裂合并腹腔积血', date: '', hospital: '', no: '' },
        { name: '腹部CT（平扫+增强）', result: '脾包膜下及脾周血肿，腹腔积血，脾实质强化不均，提示脾破裂（Ⅳ级）', date: '', hospital: '', no: '' },
        { name: '血型与交叉配血', result: 'O型，Rh阳性，抗体筛查阴性，已备红细胞悬液4U', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['失血性休克（外伤性脾破裂）', '脾破裂（Ⅳ级）', '失血性贫血（重度）']
    }
  }
};
