/* 模板病例：急性缺血性脑卒中（左侧大脑中动脉供血区）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：「突发」+ 局灶性神经功能缺损（偏瘫、中枢性面舌瘫、偏身感觉减退）+
 * 同向偏盲/失语，三联提示大脑中动脉；头颅 CT 先除外出血，DWI 见高信号即确诊梗死。
 * 溶栓时间窗（发病 4.5 小时内）是这一病种最要紧的一句。
 *
 * 说明：神经内科专科查体的可选描述是固定词汇表，没有「肌力2级」「右侧」这类写法，
 * 分级与侧别写在现病史与辅助检查里，查体只写词汇表里逐字有的那几条。
 */
module.exports = {
  key: 'stroke',
  dept: 'neurology',
  name: '急性缺血性脑卒中（左侧大脑中动脉）',
  alias: ['脑梗死', '脑梗塞', '缺血性脑卒中', '脑卒中', '中风', '急性脑血管病', 'CIS'],
  hint: '突发偏侧肢体无力、言语不清，头颅CT未见出血，DWI见高信号',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '浙江温州',
      birthPlace: '浙江温州',
      occupation: '退休工人',
      reliability: '可靠',
      chiefComplaint: '突发右侧肢体无力伴言语不清3小时',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '小时'
    },
    hpi: {
      onset: '3小时前晨起时无明显诱因出现右侧肢体无力，右手不能持物，右下肢不能抬离床面，同时出现言语含糊不清，症状持续不缓解',
      cause: '既往高血压病史10年，平素服药不规律，血压控制不佳；3年前发现心房颤动，未规律抗凝',
      symptoms: '右侧上下肢无力程度较重，上肢不能抬起、手指不能伸直，下肢不能在床面移动；言语含糊，能听懂他人问话，但只能说出简短词句，不能成句；无肢体疼痛',
      relief: '卧床休息后症状无减轻',
      evolution: '症状在1小时内进行性加重，出现口角向左歪斜，家属发现后立即送至急诊',
      accompanying: '伴头晕、右侧面部及右侧肢体麻木',
      negativeDiscriminating: '无剧烈头痛，无呕吐，无意识丧失及肢体抽搐，无发热，无胸痛及心悸加重，无大小便失禁，无外伤史',
      treatment: '急诊予阿司匹林300mg嚼服、阿托伐他汀钙40mg口服，甘露醇125ml静脉滴注，并监测血压、指尖血糖，症状无明显好转',
      generalCondition: '发病以来神志清楚，未进食，睡眠如常，小便正常，大便未解，体重无明显变化',
      extra: '发病至入院时间3小时，在静脉溶栓时间窗内'
    },
    ros: {
      nervous: {
        weakness: { checked: true, detail: '右侧上下肢无力，进行性加重' },
        speech: { checked: true, detail: '言语含糊，仅能说出简短词句' },
        numbness: { checked: true, detail: '右侧面部及肢体麻木' },
        headache: { negative: true },
        seizure: { negative: true },
        visualBlur: { negative: true },
        syncopeNerve: { negative: true },
        incontinence: { negative: true }
      },
      cardio: { palpitation: { checked: true, detail: '阵发性心悸3年，未规律服药' } },
      resp: { fever: { negative: true } },
      gi: { nausea: { negative: true }, vomiting: { negative: true } }
    },
    pmh: {
      health: '平素体健，生活自理',
      diseaseChecks: { 高血压: true },
      diseaseDetail: '高血压病史10年，最高血压达180/110mmHg，长期口服苯磺酸氨氯地平5mg每日1次，未规律监测；3年前心电图发现心房颤动，未规律抗凝治疗',
      longTermMeds: '苯磺酸氨氯地平5mg每日1次口服，近1年服药不规律',
      infection: '否认肝炎、结核等传染病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物接触史',
      vaccine: '按计划预防接种',
      allergy: '无',
      relatedHistory: '否认糖尿病、高脂血症病史，否认吸烟、饮酒史',
      otherTreatDiseases: '',
      special: ''
    },
    personal: {
      residence: '出生并居住于浙江温州，否认疫区及地方病流行区久居史',
      smoking: '无',
      smokingAmount: '',
      drinking: '无',
      drinkingAmount: '',
      drugs: '否认铅、汞等重金属及有机磷农药接触史',
      environment: '',
      habits: '口味偏咸，喜食腌制食品，活动量少',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '退休前从事纺织车间工作，无粉尘及放射性物质接触'
    },
    marriage: { status: '已婚', age: '24', spouseHealth: '配偶体健', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: { 高血压: true },
      other: '',
      deceased: '父亲因脑卒中去世，73岁；母亲健在',
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
        ent: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大'
      },
      neck: {
        neckResist: '颈软，无抵抗',
        neckVessel: '颈静脉无充盈，颈动脉无异常搏动',
        trachea: '气管居中'
      },
      chest: {
        chestShape: '胸廓对称，无畸形，肋间隙正常',
        lungAuscultation: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
        heartPercussion: '心界向左下扩大'
      },
      abdomen: {
        abdInspect: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
        abdAuscultation: '肠鸣音正常，未闻及血管杂音'
      },
      spine: {
        spineCol: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
        radialPulse: '脉搏短绌'
      },
      nervousPE: {
        babinski: '巴氏征阳性'
      },
      special_neurology: {
        neuroExtra1: '失语',
        neuroExtra2: '面瘫',
        neuroExtra3: '偏瘫',
        neuroExtra4: '偏身感觉减退',
        neuroGait: '偏瘫步态',
        neuroAutonomic: '皮肤划痕试验阴性，出汗正常，无体位性低血压'
      }
    },
    auxiliary: {
      items: [
        { name: '头颅CT（平扫）', result: '左侧基底节区见片状低密度影，边界模糊，未见高密度出血灶，脑沟变浅，中线结构居中', date: '', hospital: '', no: '' },
        { name: '头颅MRI（DWI、FLAIR）', result: '左侧基底节区及放射冠见斑片状异常信号，DWI呈明显高信号，ADC图信号减低，符合急性脑梗死', date: '', hospital: '', no: '' },
        { name: '心电图', result: '心房颤动，心室率绝对不齐，未见ST-T动态改变', date: '', hospital: '', no: '' },
        { name: 'NIHSS评分', result: '12分（意识0分、凝视1分、视野0分、面瘫2分、右上肢3分、右下肢2分、共济0分、感觉1分、语言2分、构音1分、忽视0分）', date: '', hospital: '', no: '' },
        { name: '凝血功能', result: 'PT 11.8s，INR 1.02，APTT 28.6s，纤维蛋白原 3.2g/L', date: '', hospital: '', no: '' }
      ]
    },
    diagnosis: {
      confirmed: ['急性缺血性脑卒中（左侧大脑中动脉供血区）', '高血压病3级（极高危）', '心房颤动']
    }
  }
};
