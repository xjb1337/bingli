/* 模板病例：急性肠梗阻（粘连性，不完全性）
 *
 * 教学要点：痛、吐、胀、闭四大症状齐全 + 腹部手术史（粘连的解剖基础）；
 * 查体写腹部膨隆、可见胃肠型及蠕动波、肠鸣音活跃/可闻及金属音（气过水声）；
 * 影像写立位腹部平片的多发气液平面与肠管扩张——这是本病的金标准影像。
 *
 * 查体值逐字取自 tools/pe-options.txt 的 def= / opt=，不要改词。
 */
module.exports = {
  key: 'obstruction',
  dept: 'digestive',
  name: '急性肠梗阻（粘连性）',
  alias: ['肠梗阻', '粘连性肠梗阻', '机械性肠梗阻', '肠粘连', '痛吐胀闭'],
  hint: '腹部手术史，阵发性腹痛、呕吐、腹胀、停止排气排便，肠鸣音活跃、可闻及金属音',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '建筑工人',
      reliability: '可靠',
      chiefComplaint: '腹痛伴腹胀、呕吐',
      chiefComplaintDuration: '2',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '2天前进食大量粗纤维食物后出现脐周阵发性绞痛，每5～10分钟发作一次，每次持续约1分钟，间歇期完全缓解',
      cause: '5年前曾行开腹阑尾切除术，术后常有腹部隐痛；本次发病前曾进食大量粗纤维食物并受凉',
      symptoms: '腹痛发作时脐周鼓起包块、可见肠型，疼痛缓解后包块消失；伴腹胀，进行性加重，腹围增大',
      relief: '屈膝侧卧位、腹部热敷可稍缓解，腹痛间歇期完全无痛',
      evolution: '1天前开始呕吐，初始为胃内容物，后为黄绿色液体，混有粪渣、有粪臭味，共呕吐4次，量共约600ml；起病后未再排气排便，腹胀进行性加重',
      accompanying: '伴恶心、呕吐，呕吐后腹痛可短暂减轻；伴口干、尿少，无发热、寒战',
      negativeDiscriminating: '无发热、寒战，无呕血、黑便及血便，无尿频尿痛，无腰背部放射痛，无停止排便后腹块固定不动',
      treatment: '急诊予禁食、胃肠减压（引出黄绿色液体约400ml）、静脉补液及抗感染治疗，腹痛较前减轻，仍未排气排便',
      generalCondition: '发病以来精神差，未进食，睡眠差，近1日尿量约400ml，体重无明显变化',
      extra: ''
    },
    ros: {
      gi: {
        abdominalPain: { checked: true, detail: '脐周阵发性绞痛，发作时可见肠型' },
        vomiting: { checked: true, detail: '呕吐4次，初为胃内容物，后为黄绿色液体、有粪臭味' },
        nausea: { checked: true, detail: '腹痛发作时伴恶心' },
        bloating: { checked: true, detail: '腹胀进行性加重，腹围增大' },
        constipation: { checked: true, detail: '起病后停止排气排便2天' },
        appetiteLoss: { checked: true, detail: '完全无食欲' },
        diarrhea: { negative: true },
        hematochezia: { negative: true },
        melena: { negative: true },
        hematemesis: { negative: true }
      },
      resp: { fever: { negative: true } },
      gu: { oliguria: { checked: true, detail: '近1日尿量约400ml' }, dysuria: { negative: true } },
      hemat: { fatigue: { checked: true, detail: '乏力，活动后明显' } }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病等慢性病史',
      longTermMeds: '无长期服药史',
      infection: '否认肝炎、结核等传染病史',
      surgery: '5年前因「急性阑尾炎」行开腹阑尾切除术，术后恢复可，右下腹留纵行手术瘢痕；否认其他手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '腹部手术史形成的肠粘连是本次肠梗阻的解剖基础',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟12年，每日约20支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮啤酒每周2～3次，每次约500ml',
      drugs: '',
      environment: '',
      habits: '饮食偏粗糙，进食速度快，饮水少，饭后常立即从事体力劳动',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '从事建筑施工作业，体力劳动强度大，无粉尘及放射性物质接触史'
    },
    marriage: { status: '已婚', age: '26', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养中等',
        conscious: '神志清楚，精神差',
        posture: '强迫体位',
        face: '急性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        elasticity: '皮肤弹性减退',
        lymph: '全身浅表淋巴结未触及肿大'
      },
      head: { eyes: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏' },
      neck: { neckVessel: '颈静脉无充盈，颈动脉无异常搏动' },
      chest: {
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部膨隆',
        abdAuscultation: '肠鸣音活跃',
        abdPercussion: '鼓音区缩小'
      },
      special_digestive: {
        giAbdShape: '可见胃肠型及蠕动波',
        giTenderness: '脐周压痛',
        giRebound: '全腹无反跳痛，腹肌柔软',
        giBowelSound: '可闻及金属音',
        giRectal: '直肠指检未触及肿物，指套无染血'
      }
    },
    auxiliary: {
      items: [
        { name: '腹部立位平片', result: '中腹部可见多个阶梯状气液平面，小肠肠管明显扩张、最大内径约 3.5cm，结肠内气体减少', date: '', hospital: '', no: '' },
        { name: '腹部CT', result: '小肠肠管扩张积液，移行带位于右下腹回盲部附近，局部肠管与前腹壁粘连，其远端肠管萎陷；未见明确肿物及肠壁缺血征象；腹腔少量积液', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'WBC 11.2×10⁹/L，N 78%，Hb 148g/L，PLT 226×10⁹/L', date: '', hospital: '', no: '' },
        { name: '电解质', result: 'K⁺ 3.2mmol/L，Na⁺ 134mmol/L，Cl⁻ 92mmol/L，提示低钾低氯', date: '', hospital: '', no: '' },
        { name: '肾功能', result: 'Cr 88μmol/L，BUN 8.6mmol/L，乳酸 1.6mmol/L', date: '', hospital: '', no: '' },
        { name: '腹部超声', result: '腹腔内见扩张肠管，内容物呈往返运动，肠蠕动增强；腹腔少量无回声区', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: [
        '急性肠梗阻（粘连性，不完全性）',
        '低钾血症',
        '阑尾切除术后'
      ]
    }
  }
};
