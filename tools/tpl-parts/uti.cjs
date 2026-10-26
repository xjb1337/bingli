/* 模板病例：急性肾盂肾炎（大肠埃希菌）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：全身感染症状（寒战、高热）＋ 泌尿系统症状（尿频尿急尿痛）＋ 肾区叩击痛，
 * 三者同时具备即可临床诊断上尿路感染；与膀胱炎的分界就看有无全身症状与肾区叩击痛。
 * 尿亚硝酸盐阳性、尿培养大肠埃希菌 ≥10⁵CFU/ml 可确诊，用药前留取清洁中段尿是关键。
 */
module.exports = {
  key: 'uti',
  dept: 'nephrology',
  name: '急性肾盂肾炎',
  alias: ['急性肾盂肾炎', '上尿路感染', '泌尿系感染', '尿路感染'],
  hint: '寒战高热伴尿频尿急尿痛，肾区叩击痛阳性，尿培养见大肠埃希菌',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江金华',
      birthPlace: '浙江金华',
      occupation: '小学教师',
      reliability: '可靠',
      chiefComplaint: '突发寒战、发热伴尿频尿急尿痛2天',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '2天前无明显诱因出现尿频，每日排尿10余次，每次尿量少，伴尿道烧灼样疼痛及明显尿急，憋不住尿',
      cause: '发病前3天因工作繁忙饮水少、有憋尿习惯；无导尿及泌尿系器械操作史',
      symptoms: '当日下午出现寒战，随后体温升至39.2℃，伴右侧腰部持续性胀痛，叩击时加重；尿液浑浊，有异味，未见肉眼血尿',
      relief: '多饮水后尿痛稍减轻，退热药可短暂降温',
      evolution: '入院前1天热峰升至39.5℃，寒战频繁，腰痛加剧，不能直立行走，伴恶心未吐',
      accompanying: '伴乏力、食欲差、恶心',
      negativeDiscriminating: '无肉眼血尿，无排尿困难及尿线中断，无腰腹部绞痛及向会阴放射痛，无腹泻及里急后重，无阴道分泌物增多，无皮疹及关节痛，无近期泌尿系手术及留置导尿史',
      treatment: '社区诊所予左氧氟沙星0.5g每日1次口服2天，体温未控制，腰痛加重，遂来我院急诊；入院后改为静脉抗感染并留取尿培养',
      generalCondition: '发病以来精神差，食欲明显减退，睡眠因腰痛及排尿频繁受影响，大便正常，体重无明显变化',
      extra: '入院当日留取清洁中段尿培养及药敏，完善泌尿系超声除外梗阻'
    },
    ros: {
      gu: {
        dysuria: { checked: true, detail: '排尿时尿道烧灼样疼痛' },
        discharge: { checked: true, detail: '尿道口少量分泌物，尿液浑浊有异味' },
        flankPain: { checked: true, detail: '右侧腰部持续性胀痛，叩击加重' },
        hematuria: { negative: true },
        oliguria: { negative: true },
        polyuria: { negative: true },
        nocturia: { negative: true }
      },
      resp: {
        fever: { checked: true, detail: '体温最高39.5℃，持续2天' },
        chills: { checked: true, detail: '寒战频繁，每日2～3次' },
        cough: { negative: true },
        soreThroat: { negative: true }
      },
      gi: {
        nausea: { checked: true, detail: '伴恶心，未呕吐' },
        vomiting: { negative: true },
        diarrhea: { negative: true },
        abdominalPain: { checked: true, detail: '右下腹隐痛，与腰痛相连' },
        appetiteLoss: { checked: true, detail: '食欲明显减退' }
      },
      hemat: {
        fatigue: { checked: true, detail: '全身乏力' }
      },
      cardio: { palpitation: { checked: true, detail: '发热时心慌' } },
      joint: { backPain: { checked: true, detail: '右侧腰部疼痛，活动受限' } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认糖尿病、慢性肾脏病、泌尿系结石病史；否认反复尿路感染史',
      longTermMeds: '无长期服药史；近2天服左氧氟沙星0.5g每日1次',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史；否认留置导尿及膀胱镜检查史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '否认食物、药物过敏史；否认喹诺酮类药物过敏',
      relatedHistory: '否认妊娠；否认阴道炎及盆腔炎病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江金华，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认有毒有害物质接触史',
      environment: '',
      habits: '工作期间饮水少，常有憋尿习惯，每日饮水量约800ml',
      sexualHistory: '已婚，否认不洁性接触史',
      occupationEnv: '小学教学工作，无粉尘及放射性物质接触'
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
        conscious: '神志清楚，精神差',
        posture: '被动体位',
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
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音',
        abdPalpation: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
        kidneyPalpation: '季肋点压痛'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常'
      },
      special_nephrology: {
        renalPercussion: '右肾区叩击痛',
        renalTenderPoint: '上输尿管点压痛',
        renalBladder: '耻骨上区压痛',
        renalFacialEdema: '颜面无水肿，双眼睑无水肿',
        renalLegEdema: '双下肢无水肿',
        renalBP: '血压正常，双上肢对称'
      }
    },
    auxiliary: {
      items: [
        { name: '尿常规', result: '外观浑浊，尿蛋白 1+，尿潜血 1+，白细胞满视野/HP，红细胞 5～8/HP，亚硝酸盐阳性', date: '', hospital: '', no: '' },
        { name: '清洁中段尿培养及药敏', result: '大肠埃希菌生长，菌落计数 >10⁵CFU/ml，对左氧氟沙星耐药、对头孢曲松敏感', date: '', hospital: '', no: '' },
        { name: '血常规及炎症指标', result: 'WBC 15.2×10⁹/L，N 88%，Hb 122g/L，PLT 210×10⁹/L；CRP 96mg/L，PCT 1.8ng/ml', date: '', hospital: '', no: '' },
        { name: '泌尿系超声', result: '双肾大小形态正常，皮髓质分界清晰，双侧肾盂肾盏未见扩张积水，未见结石及占位', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性肾盂肾炎', '大肠埃希菌尿路感染']
    }
  }
};
