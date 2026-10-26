/* 模板病例：慢性肾脏病4期（糖尿病肾病）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：长期糖尿病史 + 夜尿增多、乏力纳差、水肿，贫血与钙磷代谢紊乱并存；
 * 诊断依据是 eGFR 持续下降、尿白蛋白排泄增多、双肾缩小皮质变薄；
 * 分期看 eGFR（4期 15～29ml/min），并要评估贫血、矿物质骨异常、容量负荷三方面并发症。
 */
module.exports = {
  key: 'ckd',
  dept: 'nephrology',
  name: '慢性肾脏病4期（糖尿病肾病）',
  alias: ['慢性肾脏病', '糖尿病肾病', 'CKD', '慢性肾功能不全', '尿毒症前期'],
  hint: '长期糖尿病史，夜尿增多、乏力纳差伴水肿，eGFR 持续下降、双肾缩小',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '退休工人',
      reliability: '可靠',
      chiefComplaint: '夜尿增多伴双下肢水肿1个月',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '月'
    },
    hpi: {
      onset: '1个月前无明显诱因发现双足踝部水肿，晨轻暮重，休息一夜后可减轻；同时夜尿次数增至3～4次，夜尿量多于白天',
      cause: '无明确诱因；近1个月因牙痛自服布洛芬3天。糖尿病饮食控制不严，近半年空腹血糖多在9～11mmol/L',
      symptoms: '水肿由双足踝向上发展至双小腿，呈凹陷性，指压后留痕；尿中泡沫增多，静置后不易消散；夜尿3～4次，每次约300ml',
      relief: '抬高下肢及减少饮水后水肿略减轻',
      evolution: '近2周乏力加重，上两层楼即感气短，食欲明显减退，晨起恶心，未呕吐',
      accompanying: '伴头晕、皮肤瘙痒',
      negativeDiscriminating: '无肉眼血尿，无排尿疼痛及烧灼感，无腰痛及肾区绞痛，无关节肿痛及皮疹，无颜面蝶形红斑，无近期咽部感染史，无剧烈腹痛及腹泻',
      treatment: '长期口服二甲双胍0.5g每日3次、格列美脲2mg每日1次，近半年未复查肾功能；1个月前查血肌酐302μmol/L，未系统诊治。本次入院后停用二甲双胍，改为胰岛素控制血糖',
      generalCondition: '发病以来精神差，食欲减退，睡眠尚可，夜尿增多，大便干结2～3日一行，体重近3个月下降3kg',
      extra: '入院后完善eGFR、尿蛋白定量、甲状旁腺激素及肾脏超声，评估并发症'
    },
    ros: {
      gu: {
        nocturia: { checked: true, detail: '夜尿3～4次，夜尿量多于白天' },
        polyuria: { checked: true, detail: '24小时尿量约2200ml' },
        edemaGu: { checked: true, detail: '双下肢凹陷性水肿' },
        dysuria: { negative: true },
        hematuria: { negative: true },
        flankPain: { negative: true },
        oliguria: { negative: true }
      },
      gi: {
        appetiteLoss: { checked: true, detail: '食欲明显减退，进食量约为平时一半' },
        nausea: { checked: true, detail: '晨起恶心，未呕吐' },
        vomiting: { negative: true },
        constipation: { checked: true, detail: '大便2～3日一行，干结' },
        abdominalPain: { negative: true }
      },
      hemat: {
        fatigue: { checked: true, detail: '乏力，活动耐量下降' },
        anemia: { checked: true, detail: '面色及睑结膜苍白' },
        pruritus: { checked: true, detail: '全身皮肤瘙痒，夜间明显' },
        pallorSkin: { checked: true, detail: '皮肤黏膜苍白' }
      },
      cardio: {
        edemaCardio: { checked: true, detail: '双下肢水肿' },
        palpitation: { negative: true },
        orthopnea: { negative: true }
      },
      endocrine: {
        polyuriaEndo: { checked: true, detail: '夜尿及日间尿量增多' },
        polydipsia: { checked: true, detail: '口干多饮，每日饮水约2500ml' },
        weightLoss: { checked: true, detail: '近3个月体重下降3kg' }
      },
      resp: { fever: { negative: true }, cough: { negative: true } },
      nervous: { dizziness: { checked: true, detail: '起身时头晕' }, headache: { negative: true } }
    },
    pmh: {
      health: '既往体健，可从事体力劳动',
      diseaseChecks: { 糖尿病: true, 高血压: true, 慢性肾脏病: true },
      diseaseDetail: '2型糖尿病15年，长期口服二甲双胍及格列美脲，未规律监测血糖；高血压病史8年，最高血压165/95mmHg，口服氨氯地平5mg每日1次；1个月前外院查血肌酐302μmol/L，未规律随访',
      longTermMeds: '二甲双胍0.5g每日3次口服（入院后停用）、格列美脲2mg每日1次口服、氨氯地平5mg每日1次口服、碳酸钙D3片1片每日1次口服',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及肾毒性药物长期接触史；近1个月曾服布洛芬3天',
      vaccine: '按计划预防接种；未接种流感疫苗',
      allergy: '否认食物、药物过敏史',
      relatedHistory: '否认反复扁桃体炎、紫癜及关节痛病史；否认家族中多囊肾病史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认马兜铃酸类中草药及解热镇痛药长期服用史',
      environment: '',
      habits: '饮食偏咸，喜食腌制食品，糖尿病饮食执行不严',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '退休前从事机械加工工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶患高血压，规律服药', sexLife: '近2年减少', relation: '和睦' },
    family: {
      diseaseChecks: { 糖尿病: true, 高血压: true },
      other: '兄长患2型糖尿病20年，未规律复查肾功能',
      deceased: '父亲因脑卒中去世，71岁；母亲健在',
      threeGeneration: '两系三代有多人患糖尿病及高血压，否认多囊肾等遗传性肾病',
      similarDisease: '否认家族中有类似肾脏疾病患者',
      infectionHistory: '否认结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神差',
        posture: '自主体位',
        face: '贫血面容',
        cooperation: '查体合作'
      },
      skin: {
        color: '皮肤黏膜苍白',
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
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartPercussion: '心界向左下扩大',
        heartAuscultation: '心律齐，各瓣膜听诊区未闻及病理性杂音'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        limbs: '双下肢凹陷性水肿'
      },
      special_nephrology: {
        renalFacialEdema: '双眼睑水肿',
        renalLegEdema: '双下肢凹陷性水肿',
        renalSkin: '睑结膜苍白',
        renalPercussion: '双肾区无叩击痛',
        renalBladder: '膀胱未触及，耻骨上区无压痛',
        renalBP: '血压升高'
      }
    },
    auxiliary: {
      items: [
        { name: '肾功能', result: '血肌酐386μmol/L，尿素氮 15.8mmol/L，尿酸 486μmol/L，eGFR 14ml/min/1.73m²', date: '', hospital: '', no: '' },
        { name: '血常规', result: 'Hb 92g/L，RBC 3.1×10¹²/L，MCV 88fl，WBC 6.2×10⁹/L，PLT 198×10⁹/L', date: '', hospital: '', no: '' },
        { name: '尿常规及尿白蛋白/肌酐比值', result: '尿蛋白 3+，尿潜血 1+，尿沉渣红细胞 3/HP；尿白蛋白/肌酐比值 1280mg/g', date: '', hospital: '', no: '' },
        { name: '钙磷代谢及甲状旁腺激素', result: '血钙 1.98mmol/L，血磷 1.86mmol/L，PTH 286pg/ml，25羟维生素D 12ng/ml', date: '', hospital: '', no: '' },
        { name: '泌尿系超声', result: '双肾缩小，右肾 8.2cm×3.6cm，左肾 8.4cm×3.8cm，皮质变薄、回声增强，皮髓质分界不清，双肾血流稀疏', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['慢性肾脏病4期（糖尿病肾病）', '2型糖尿病', '肾性贫血', '慢性肾脏病矿物质及骨异常']
    }
  }
};
