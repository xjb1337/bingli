/* 模板病例：继发性肺结核（右上肺，涂片阳性，初治）
 *
 * 只写教科书典型病例，不写某个真实病人；患者身份信息一律留空。
 * 教学要点：咳嗽咳痰持续两周以上、咯血、午后低热、盗汗、乏力、体重下降，是肺结核的可疑症状组合。
 * 继发性肺结核好发于上叶尖后段与下叶背段，影像为斑片状浸润、可融合并形成空洞，常伴支气管播散。
 * 涂片阳性即痰涂片抗酸染色找到抗酸杆菌，是传染性最强、也是确诊与化疗方案选择的依据。
 * 诊断按「结核病分类、病变部位、范围、痰菌情况、化疗史」书写：继发性肺结核，右上肺，涂（+），初治。
 *
 * 说明：胸部查体的可选描述是固定词汇表，没有「右上肺叩诊浊音」这类带侧别的写法，
 * 侧别与病变范围写在现病史与影像里，查体段只写词表里逐字有的那几条。
 * 生命体征（体温/脉搏/呼吸/血压/身高/体重）一律留空，由学生自己测、自己填。
 */
module.exports = {
  key: 'tb',
  dept: 'respiratory',
  name: '继发性肺结核（右上肺，涂阳，初治）',
  alias: ['肺结核', '继发性肺结核', '浸润性肺结核', '涂阳肺结核', '结核病'],
  hint: '咳嗽咳痰 2 月余伴咯血，午后低热、盗汗、乏力、体重下降；右上肺叩诊浊音伴湿啰音，CT 见上叶尖后段斑片影及空洞，痰抗酸染色阳性',
  record: {
    basic: {
      marital: '已婚',
      nationality: '汉族',
      nativePlace: '河南信阳',
      birthPlace: '河南信阳',
      occupation: '建筑工人',
      reliability: '可靠',
      chiefComplaint: '咳嗽、咳痰2月余，痰中带血半月',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    hpi: {
      onset: '2月前无明显诱因出现咳嗽、咳少量白色黏痰，自认为「感冒」，未就诊',
      cause: '起病前1月曾在集体宿舍居住，同住工友中有长期咳嗽者，否认明确结核病人接触史，无糖尿病及长期使用糖皮质激素史',
      symptoms: '咳嗽为阵发性单声咳，夜间及晨起明显，痰量每日约30ml，为白色黏液痰，近半月痰中带血，每日2至3次，量少；午后及傍晚出现低热，体温波动于37.3至37.8度，夜间入睡后出汗、醒后汗止，需更换衣物',
      relief: '自服复方甘草片及阿莫西林胶囊0.5g每日3次共7天，咳嗽及低热均无缓解',
      evolution: '近1月乏力明显，上楼时气促，遂来门诊就诊',
      accompanying: '伴乏力、食欲减退，无明显胸痛及呼吸困难',
      negativeDiscriminating: '无高热及寒战，无咯大量鲜血，无胸痛及呼吸困难，无下肢水肿及长期卧床史，无糖尿病及长期使用糖皮质激素史，无腹泻及腹痛',
      treatment: '门诊已制定异烟肼0.3g每日1次、利福平0.45g每日1次、吡嗪酰胺0.5g每日3次、乙胺丁醇0.75g每日1次联合抗结核方案，尚未开始服药，等待痰菌结果期间先行保肝及对症治疗',
      generalCondition: '发病以来精神差，食欲明显减退，夜间盗汗影响睡眠，大小便正常，体重下降约5kg',
      extra: '门诊已按《中华人民共和国传染病防治法》乙类传染病要求于24小时内完成网络直报，嘱其居家隔离、佩戴口罩，家属行胸片筛查'
    },
    ros: {
      resp: {
        cough: { checked: true, detail: '咳嗽2月余，夜间及晨起明显' },
        sputum: { checked: true, detail: '白色黏液痰，每日约30ml，近半月痰中带血' },
        hemoptysis: { checked: true, detail: '痰中带血半月，每日2至3次，量少' },
        nightSweat: { checked: true, detail: '夜间入睡后出汗、醒后汗止，需更换衣物' },
        fever: { checked: true, detail: '午后低热，体温波动于37.3至37.8度' },
        dyspnea: { checked: true, detail: '近1月上楼时气促' },
        chestPainResp: { negative: true },
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
      hemat: {
        anemia: { negative: true }
      },
      endocrine: { weightLoss: { checked: true, detail: '1月内体重下降约5kg' } },
      nervous: {
        insomnia: { checked: true, detail: '夜间盗汗影响睡眠' }
      }
    },
    pmh: {
      health: '平素体健',
      diseaseChecks: {},
      diseaseDetail: '否认高血压、糖尿病、冠心病史；否认病毒性肝炎、肝硬化病史；否认既往结核病史及抗结核治疗史',
      longTermMeds: '无长期口服药物，否认长期使用糖皮质激素及免疫抑制剂',
      infection: '否认肝炎等传染病史；本次为首次发现肺部结核病灶，否认既往结核病史',
      surgery: '否认手术史',
      trauma: '否认外伤史',
      transfusion: '否认输血史',
      poisoning: '否认毒物及有害气体接触史',
      vaccine: '幼年接种卡介苗，成年后未复种',
      allergy: '无',
      relatedHistory: '否认糖尿病、硅肺、胃大部切除术后等结核易感因素，否认酗酒',
      otherTreatDiseases: '',
      special: '同住工友中有长期咳嗽者，已建议其就诊筛查'
    },
    personal: {
      residence: '河南信阳，近2年在城市集体宿舍居住，否认疫区及地方病流行区久居史',
      smoking: '有',
      smokingAmount: '吸烟15年，每日约20支，未戒烟',
      drinking: '有',
      drinkingAmount: '饮白酒10年，每日约150ml，未戒酒',
      drugs: '否认粉尘、石棉及放射性物质接触史',
      environment: '集体宿舍居住，房间通风较差、人员密集',
      habits: '',
      sexualHistory: '否认不洁性接触史',
      occupationEnv: '建筑工地务工10年，有长期水泥粉尘接触史，工作强度大、营养及休息欠佳'
    },
    marriage: { status: '已婚', age: '23', spouseHealth: '配偶体健，胸片未见异常', sexLife: '正常', relation: '和睦' },
    family: {
      diseaseChecks: {},
      other: '',
      deceased: '父母健在',
      threeGeneration: '两系三代否认遗传性疾病史',
      similarDisease: '否认家族中类似疾病患者',
      infectionHistory: '否认家族中结核、肝炎、性病等传染性疾病史'
    },
    pe: {
      vitals: {},
      general: {
        development: '发育正常',
        nutrition: '营养不良',
        conscious: '神志清楚，精神一般',
        posture: '自主体位',
        face: '慢性病容',
        cooperation: '查体合作'
      },
      skin: {
        color: '全身皮肤黏膜无黄染、苍白、发绀',
        rash: '未见皮疹及出血点',
        lymph: '双侧颈部可触及肿大淋巴结'
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
        lungInspect: '呼吸运动对称，节律规整',
        lungPalpation: '语颤增强',
        lungPercussion: '局部叩诊浊音',
        lungAuscultation: '双肺可闻及湿性啰音',
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
        limbs: '四肢无畸形，关节无红肿，活动自如',
      },
      special_respiratory: {
        respVocalResonance: '患侧语音共振增强',
        respChestExpansion: '肺下界移动度减小',
        respCyanosis: '无杵状指，无球结膜水肿'
      }
    },
    auxiliary: {
      items: [
        { name: '胸部CT（平扫）', result: '右上肺尖后段见斑片状、斑点状高密度影，密度不均，其内见空洞形成，壁较厚，周围见卫星灶及树芽征，右下肺背段见少量播散灶', date: '', hospital: '', no: '' },
        { name: '痰涂片抗酸染色', result: '连续三次痰涂片抗酸染色均阳性（1+至2+），痰结核分枝杆菌培养阳性', date: '', hospital: '', no: '' },
        { name: '结核感染T细胞检测（T-SPOT.TB）', result: '阳性，每孔斑点数明显高于阴性对照，提示存在结核分枝杆菌感染', date: '', hospital: '', no: '' },
        { name: '血常规及红细胞沉降率', result: 'WBC 7.8×10⁹/L，中性粒细胞 68.2%，Hb 112g/L，PLT 268×10⁹/L，ESR 68mm/h', date: '', hospital: '', no: '' },
        { name: '肝肾功能', result: 'ALT 28U/L，AST 24U/L，总胆红素 12μmol/L，肌酐 68μmol/L，尿素氮 5.2mmol/L', date: '', hospital: '', no: '' }
      ]
    },
    summary: '患者因“咳嗽、咳痰2月余，痰中带血半月”入院。2月前起阵发性咳嗽、咳白色黏液痰，近半月痰中带血，伴午后低热（37.3至37.8度）、夜间盗汗、乏力，1月内体重下降约5kg。吸烟15年，集体宿舍居住，同住工友有长期咳嗽者。查体：营养不良，慢性病容，双侧颈部可触及肿大淋巴结，右上肺语颤增强、局部叩诊浊音、双肺可闻及湿性啰音，肺下界移动度减小。胸部CT示右上肺尖后段斑片状影伴空洞及卫星灶；痰涂片抗酸染色三次阳性；T-SPOT.TB阳性；ESR 68mm/h，Hb 112g/L。无高热及寒战、无咯大量鲜血，可与细菌性肺炎鉴别；无腹泻及腹痛，可与克罗恩病、淋巴瘤等鉴别',
    soap: {
      a: {
        basisDetail: [
          {
            diagnosis: '继发性肺结核（右上肺，涂片阳性，初治）',
            history: '咳嗽咳痰2月余、痰中带血半月，伴午后低热、夜间盗汗、乏力、1月内体重下降约5kg；吸烟15年，集体宿舍居住，同住工友有长期咳嗽者',
            pe: '营养不良，慢性病容，双侧颈部可触及肿大淋巴结，右上肺语颤增强、局部叩诊浊音，双肺可闻及湿性啰音，肺下界移动度减小',
            aux: '胸部CT示右上肺尖后段斑片状、斑点状高密度影伴厚壁空洞及卫星灶、树芽征，右下肺背段少量播散灶；连续三次痰涂片抗酸染色阳性；T-SPOT.TB阳性；ESR 68mm/h'
          },
          {
            diagnosis: '慢性病贫血',
            history: '慢性感染消耗，病程2月余',
            pe: '',
            aux: '血常规Hb 112g/L，WBC 7.8×10⁹/L，血小板正常范围'
          }
        ]
      }
    },
    diagnosis: {
      confirmed: ['继发性肺结核（右上肺，涂片阳性，初治）', '慢性病贫血']
    }
  }
};
