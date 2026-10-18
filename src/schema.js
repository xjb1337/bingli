/* ===========================================================================
 * 大病历生成器 —— 数据模型 / 字段定义
 * 所有科室共用一套「病史」字段，体格检查分为「通用查体 + 专科查体」。
 * 设计原则：手机上尽量点选，少打字；每一项都可以手写补充或改写。
 * =========================================================================== */

const SCHEMA = (() => {
  'use strict';

  /* ---------------------------------------------------------------------
   * 一、基本选项集
   * ------------------------------------------------------------------- */

  // 一般情况
  const GENDERS = ['男', '女'];
  const MARITAL = ['未婚', '已婚', '离异', '丧偶'];
  const OCCUPATIONS = ['学生', '工人', '农民', '教师', '职员', '个体', '退休', '无业', '其他'];
  const NATIONALITY = '汉族';
  const RELIABILITY = ['可靠', '基本可靠', '供史者代述，部分可靠'];

  // 常用病程时间单位
  const DURATION_UNITS = ['分钟', '小时', '天', '周', '月', '年'];

  /* ---------------------------------------------------------------------
   * 二、系统回顾（ROS）
   * 每一项：{ key, name, symptoms: [{ key, label, detail?: 录入提示 }] }
   * 勾选「有」即默认阳性，生成时按「症状 + 时间」组装；全无则写「无异常」。
   * ------------------------------------------------------------------- */
  const ROS = [
    {
      key: 'general',
      name: '一般情况',
      symptoms: [
        { key: 'fatigue', label: '疲乏无力' },
        { key: 'fever', label: '发热', detail: '热峰' },
        { key: 'chills', label: '畏寒寒战' },
        { key: 'nightSweat', label: '盗汗' },
        { key: 'weightLoss', label: '体重下降', detail: '约下降' },
        { key: 'weightGain', label: '体重增加', detail: '约增加' },
        { key: 'appetiteLoss', label: '食欲减退' },
        { key: 'edemaSys', label: '水肿' }
      ]
    },
    {
      key: 'skin',
      name: '皮肤黏膜',
      symptoms: [
        { key: 'rash', label: '皮疹', detail: '部位/形态' },
        { key: 'pruritus', label: '皮肤瘙痒' },
        { key: 'jaundice', label: '皮肤黏膜黄染' },
        { key: 'pallorSkin', label: '皮肤苍白' },
        { key: 'purpura', label: '瘀点瘀斑' },
        { key: 'ulcer', label: '皮肤溃疡' },
        { key: 'hairLoss', label: '脱发' }
      ]
    },
    {
      key: 'head',
      name: '头部及五官',
      symptoms: [
        { key: 'headache', label: '头痛' },
        { key: 'dizziness', label: '头晕' },
        { key: 'vertigo', label: '眩晕' },
        { key: 'syncope', label: '晕厥' },
        { key: 'visualBlur', label: '视物模糊' },
        { key: 'eyePain', label: '眼痛/畏光' },
        { key: 'hearingLoss', label: '听力下降' },
        { key: 'tinnitus', label: '耳鸣' },
        { key: 'nasalObstruction', label: '鼻塞流涕' },
        { key: 'epistaxis', label: '鼻出血' },
        { key: 'toothache', label: '牙痛' },
        { key: 'soreThroat', label: '咽痛' },
        { key: 'hoarseness', label: '声音嘶哑' }
      ]
    },
    {
      key: 'resp',
      name: '呼吸系统',
      symptoms: [
        { key: 'cough', label: '咳嗽', detail: '性质/频率' },
        { key: 'sputum', label: '咳痰', detail: '量/色/性状' },
        { key: 'hemoptysis', label: '咯血', detail: '量' },
        { key: 'dyspnea', label: '呼吸困难' },
        { key: 'chestPainResp', label: '胸痛' },
        { key: 'wheeze', label: '喘息' },
        { key: 'pleurisy', label: '胸膜炎性胸痛' }
      ]
    },
    {
      key: 'cardio',
      name: '循环系统',
      symptoms: [
        { key: 'palpitation', label: '心悸' },
        { key: 'chestPainCardio', label: '心前区疼痛' },
        { key: 'orthopnea', label: '夜间阵发性呼吸困难/端坐呼吸' },
        { key: 'intermittentClaudication', label: '间歇性跛行' },
        { key: 'edemaCardio', label: '下肢水肿' },
        { key: 'cyanosis', label: '发绀' }
      ]
    },
    {
      key: 'gi',
      name: '消化系统',
      symptoms: [
        { key: 'nausea', label: '恶心' },
        { key: 'vomiting', label: '呕吐', detail: '性质/次数' },
        { key: 'hematemesis', label: '呕血' },
        { key: 'abdominalPain', label: '腹痛', detail: '部位/性质' },
        { key: 'diarrhea', label: '腹泻', detail: '次数/性状' },
        { key: 'constipation', label: '便秘' },
        { key: 'melena', label: '黑便' },
        { key: 'hematochezia', label: '便血' },
        { key: 'bloating', label: '腹胀' },
        { key: 'reflux', label: '反酸烧心' },
        { key: 'jaundiceGi', label: '黄疸' }
      ]
    },
    {
      key: 'gu',
      name: '泌尿生殖系统',
      symptoms: [
        { key: 'dysuria', label: '尿频尿急尿痛' },
        { key: 'hematuria', label: '血尿' },
        { key: 'oliguria', label: '尿量减少' },
        { key: 'polyuria', label: '多尿' },
        { key: 'nocturia', label: '夜尿增多' },
        { key: 'flankPain', label: '腰痛/肾区疼痛' },
        { key: 'edemaGu', label: '颜面及双下肢水肿' },
        { key: 'discharge', label: '尿道分泌物' }
      ]
    },
    {
      key: 'hemat',
      name: '造血系统',
      symptoms: [
        { key: 'anemia', label: '乏力、面色苍白' },
        { key: 'bleeding', label: '易出血/出血难止' },
        { key: 'bruise', label: '皮下瘀斑' },
        { key: 'lymphNode', label: '淋巴结肿大' },
        { key: 'bonePain', label: '骨痛' },
        { key: 'transfusion', label: '输血史' }
      ]
    },
    {
      key: 'endocrine',
      name: '内分泌及代谢',
      symptoms: [
        { key: 'polydipsia', label: '多饮' },
        { key: 'polyphagia', label: '多食' },
        { key: 'polyuriaEndo', label: '多尿' },
        { key: 'heatIntolerance', label: '怕热多汗' },
        { key: 'coldIntolerance', label: '怕冷少汗' },
        { key: 'hairChange', label: '毛发改变' },
        { key: 'neckMass', label: '颈部肿块' },
        { key: 'growthChange', label: '身高明显改变' }
      ]
    },
    {
      key: 'nervous',
      name: '神经系统',
      symptoms: [
        { key: 'numbness', label: '肢体麻木' },
        { key: 'weakness', label: '肢体无力' },
        { key: 'seizure', label: '抽搐' },
        { key: 'tremor', label: '震颤' },
        { key: 'memoryLoss', label: '记忆力减退' },
        { key: 'sleepDisorder', label: '睡眠障碍' },
        { key: 'speech', label: '言语不清' },
        { key: 'incontinence', label: '大小便失禁' }
      ]
    },
    {
      key: 'joint',
      name: '肌肉骨骼系统',
      symptoms: [
        { key: 'jointPain', label: '关节疼痛/肿胀' },
        { key: 'morningStiff', label: '晨僵' },
        { key: 'backPain', label: '腰背痛' },
        { key: 'muscleWeak', label: '肌肉酸痛无力' }
      ]
    },
    {
      key: 'psych',
      name: '精神心理',
      symptoms: [
        { key: 'insomnia', label: '失眠' },
        { key: 'moodLow', label: '情绪低落' },
        { key: 'anxiety', label: '焦虑' },
        { key: 'hallucination', label: '幻觉妄想' }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
   * 三、既往史相关选项
   * ------------------------------------------------------------------- */
  const COMMON_PMH = [
    '高血压', '糖尿病', '冠心病', '心力衰竭', '高脂血症', '脑卒中', '慢性阻塞性肺疾病',
    '哮喘', '肺结核', '病毒性肝炎', '肝硬化', '慢性肾脏病', '痛风', '甲状腺功能亢进',
    '甲状腺功能减退', '类风湿关节炎', '肿瘤', '贫血', '消化性溃疡', '胆囊结石',
    '前列腺增生', '精神疾病', '其他'
  ];
  const ALLERGENS = ['青霉素', '头孢类', '磺胺类', '解热镇痛药', '造影剂', '海鲜', '酒精', '其他'];
  const ALLERGY_REACTIONS = ['皮疹', '瘙痒', '呼吸困难', '过敏性休克', '腹泻', '其他'];

  const FAMILY_DISEASES = [
    '高血压', '糖尿病', '冠心病', '脑卒中', '恶性肿瘤', '精神病', '肺结核',
    '病毒性肝炎', '血友病', '哮喘', '甲状腺疾病', '痛风', '新生儿黄疸', '遗传性疾病'
  ];

  /* ---------------------------------------------------------------------
   * 四、体格检查
   * vital: 生命体征
   * 通用查体：按系统分组，多为「正常/异常」二选一
   * ------------------------------------------------------------------- */

  const VITALS = [
    { key: 'temperature', label: '体温', unit: '℃', placeholder: '36.5', type: 'number' },
    { key: 'pulse', label: '脉搏', unit: '次/分', placeholder: '78', type: 'number' },
    { key: 'respiration', label: '呼吸', unit: '次/分', placeholder: '18', type: 'number' },
    { key: 'sbp', label: '收缩压', unit: 'mmHg', placeholder: '120', type: 'number' },
    { key: 'dbp', label: '舒张压', unit: 'mmHg', placeholder: '80', type: 'number' },
    { key: 'height', label: '身高', unit: 'cm', placeholder: '170', type: 'number' },
    { key: 'weight', label: '体重', unit: 'kg', placeholder: '60', type: 'number' },
    // 儿科专用
    { key: 'headCirc', label: '头围', unit: 'cm', placeholder: '34', type: 'number', dept: 'pediatrics' },
    { key: 'chestCirc', label: '胸围', unit: 'cm', placeholder: '33', type: 'number', dept: 'pediatrics' }
  ];

  /**
   * 通用体格检查。每一项有：
   *   normal: 正常时写入的文字（可直接使用）
   *   options: 异常可选描述（点了就替换）
   * 结果都写进 pe[key].text
   */
  const PE_COMMON = [
    {
      key: 'general',
      name: '一般情况',
      items: [
        {
          key: 'conscious', label: '神志', default: '神志清楚，精神可',
          options: ['神志清楚，精神可', '神志清楚，精神一般', '神志清楚，精神差', '嗜睡', '昏睡', '浅昏迷', '深昏迷']
        },
        {
          key: 'posture', label: '体位', default: '自动体位',
          options: ['自动体位', '被动体位', '强迫体位']
        },
        {
          key: 'face', label: '面容', default: '面容自然',
          options: ['面容自然', '急性病容', '慢性病容', '贫血面容', '二尖瓣面容', '甲亢面容', '满月面容']
        },
        {
          key: 'nutrition', label: '营养', default: '营养中等',
          options: ['营养良好', '营养中等', '营养不良', '肥胖']
        },
        {
          key: 'cooperation', label: '查体合作', default: '查体合作',
          options: ['查体合作', '查体欠合作', '查体不合作']
        }
      ]
    },
    {
      key: 'skin',
      name: '皮肤黏膜',
      items: [
        {
          key: 'color', label: '色泽', default: '全身皮肤黏膜无黄染、苍白、发绀',
          options: ['全身皮肤黏膜无黄染、苍白、发绀', '皮肤黏膜黄染', '皮肤黏膜苍白', '口唇及肢端发绀']
        },
        {
          key: 'rash', label: '皮疹/出血点', default: '未见皮疹及出血点',
          options: ['未见皮疹及出血点', '可见散在皮疹', '可见瘀点瘀斑']
        },
        {
          key: 'elasticity', label: '弹性', default: '皮肤弹性良好',
          options: ['皮肤弹性良好', '皮肤弹性减退']
        },
        {
          key: 'lymph', label: '浅表淋巴结', default: '全身浅表淋巴结未触及肿大',
          options: [
            '全身浅表淋巴结未触及肿大',
            '双侧颈部可触及肿大淋巴结',
            '双侧腋窝可触及肿大淋巴结',
            '双侧腹股沟可触及肿大淋巴结'
          ]
        }
      ]
    },
    {
      key: 'head',
      name: '头部及其器官',
      items: [
        {
          key: 'headShape', label: '头颅', default: '头颅大小、形态正常，无压痛及包块',
          options: ['头颅大小、形态正常，无压痛及包块', '头颅外伤', '方颅', '头颅有压痛']
        },
        {
          key: 'hair', label: '毛发', default: '毛发分布均匀',
          options: ['毛发分布均匀', '毛发稀疏', '毛发分布异常']
        },
        {
          key: 'eyes', label: '眼', default: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，直径约3mm，对光反射灵敏',
          options: [
            '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，直径约3mm，对光反射灵敏',
            '眼睑水肿',
            '巩膜黄染',
            '双侧瞳孔不等大',
            '双侧瞳孔对光反射迟钝',
            '眼睑下垂'
          ]
        },
        {
          key: 'ent', label: '耳鼻口咽', default: '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
          options: [
            '耳廓无畸形，外耳道无分泌物，乳突无压痛；鼻通气良好，鼻窦无压痛；口唇无发绀，咽无充血，扁桃体无肿大',
            '咽充血，扁桃体肿大',
            '双侧扁桃体Ⅰ度肿大',
            '外耳道有分泌物',
            '鼻窦区压痛',
            '口唇发绀'
          ]
        },
        {
          key: 'teeth', label: '口腔黏膜/舌', default: '口腔黏膜无溃疡，舌质淡红、苔薄白',
          options: ['口腔黏膜无溃疡，舌质淡红、苔薄白', '口腔黏膜溃疡', '舌质红、苔黄腻', '舌质红、少苔', '草莓舌']
        }
      ]
    },
    {
      key: 'neck',
      name: '颈部',
      items: [
        {
          key: 'neckResist', label: '颈抵抗', default: '颈软，无抵抗',
          options: ['颈软，无抵抗', '颈抵抗阳性']
        },
        {
          key: 'thyroid', label: '甲状腺', default: '甲状腺无肿大',
          options: ['甲状腺无肿大', '甲状腺Ⅰ度肿大', '甲状腺Ⅱ度肿大', '甲状腺Ⅲ度肿大', '甲状腺可触及结节']
        },
        {
          key: 'neckVessel', label: '颈静脉/颈动脉', default: '颈静脉无充盈，颈动脉无异常搏动',
          options: ['颈静脉无充盈，颈动脉无异常搏动', '颈静脉充盈', '颈静脉怒张', '颈动脉搏动增强']
        },
        {
          key: 'trachea', label: '气管', default: '气管居中',
          options: ['气管居中', '气管向左侧移位', '气管向右侧移位']
        }
      ]
    },
    {
      key: 'chest',
      name: '胸部',
      items: [
        {
          key: 'chestShape', label: '胸廓', default: '胸廓对称，无畸形，肋间隙正常',
          options: ['胸廓对称，无畸形，肋间隙正常', '桶状胸', '胸廓不对称', '肋间隙增宽', '肋间隙变窄', '鸡胸', '漏斗胸']
        },
        {
          key: 'lungInspect', label: '肺—视诊', default: '呼吸运动对称，节律规整',
          options: ['呼吸运动对称，节律规整', '呼吸运动减弱', '呼吸浅快', '呼吸深大']
        },
        {
          key: 'lungPalpation', label: '肺—触诊', default: '语颤对称，无胸膜摩擦感',
          options: ['语颤对称，无胸膜摩擦感', '语颤增强', '语颤减弱', '可触及胸膜摩擦感']
        },
        {
          key: 'lungPercussion', label: '肺—叩诊', default: '双肺叩诊清音，肺下界位于锁骨中线第6肋间',
          options: ['双肺叩诊清音，肺下界位于锁骨中线第6肋间', '双肺叩诊过清音', '局部叩诊浊音', '局部叩诊实音', '肺下界下移']
        },
        {
          key: 'lungAuscultation', label: '肺—听诊', default: '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
          options: [
            '双肺呼吸音清，未闻及干湿性啰音及胸膜摩擦音',
            '双肺呼吸音粗，可闻及散在干啰音',
            '双肺可闻及湿性啰音',
            '右下肺可闻及湿性啰音',
            '双肺可闻及哮鸣音',
            '可闻及胸膜摩擦音',
            '呼吸音减弱'
          ]
        },
        {
          key: 'heartInspect', label: '心—视诊', default: '心前区无隆起，心尖搏动位于第5肋间左锁骨中线内0.5cm',
          options: ['心前区无隆起，心尖搏动位于第5肋间左锁骨中线内0.5cm', '心尖搏动向左下移位', '心前区隆起']
        },
        {
          key: 'heartPalpation', label: '心—触诊', default: '心尖搏动无抬举性，未触及震颤',
          options: ['心尖搏动无抬举性，未触及震颤', '可触及抬举性心尖搏动', '可触及震颤']
        },
        {
          key: 'heartPercussion', label: '心—叩诊', default: '心界不大',
          options: ['心界不大', '心界向左下扩大', '心界向两侧扩大']
        },
        {
          key: 'heartAuscultation', label: '心—听诊', default: '心率78次/分，律齐，各瓣膜听诊区未闻及病理性杂音',
          options: [
            '心率78次/分，律齐，各瓣膜听诊区未闻及病理性杂音',
            '心律不齐，可闻及早搏',
            '心尖区可闻及收缩期杂音',
            '主动脉瓣区可闻及舒张期杂音',
            '心音低钝',
            '可闻及心包摩擦音'
          ]
        },
        {
          key: 'breast', label: '乳房', default: '双侧乳房对称，未触及肿块',
          options: ['双侧乳房对称，未触及肿块', '乳房可触及肿块', '乳房不对称'],
          depts: ['surgery']
        }
      ]
    },
    {
      key: 'abdomen',
      name: '腹部',
      items: [
        {
          key: 'abdInspect', label: '视诊', default: '腹平软，未见腹壁静脉曲张',
          options: ['腹平软，未见腹壁静脉曲张', '腹部膨隆', '腹壁静脉曲张', '可见胃肠型及蠕动波', '可见手术瘢痕']
        },
        {
          key: 'abdPalpation', label: '触诊', default: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
          options: [
            '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
            '上腹部压痛，无反跳痛',
            '右下腹压痛、反跳痛',
            '全腹压痛、反跳痛，腹肌紧张',
            '肝肋下可触及',
            '脾肋下可触及',
            '可触及腹部包块'
          ]
        },
        {
          key: 'abdPercussion', label: '叩诊', default: '肝区及双肾区无叩击痛，移动性浊音阴性',
          options: ['肝区及双肾区无叩击痛，移动性浊音阴性', '肝区叩击痛', '双肾区叩击痛', '移动性浊音阳性', '鼓音区缩小']
        },
        {
          key: 'abdAuscultation', label: '听诊', default: '肠鸣音正常，约4次/分',
          options: ['肠鸣音正常，约4次/分', '肠鸣音活跃', '肠鸣音减弱', '肠鸣音消失', '可闻及血管杂音']
        }
      ]
    },
    {
      key: 'genital',
      name: '生殖器、肛门及直肠',
      items: [
        {
          key: 'genitalia', label: '外生殖器', default: '未见异常',
          options: ['未见异常', '未查', '包皮过长', '外生殖器发育异常']
        },
        {
          key: 'anus', label: '肛门及直肠', default: '未见异常',
          options: ['未见异常', '未查', '肛门指检未触及异常', '肛门指检可触及肿物', '肛周红肿']
        }
      ]
    },
    {
      key: 'spine',
      name: '脊柱及四肢',
      items: [
        {
          key: 'spineCol', label: '脊柱', default: '脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常',
          options: ['脊柱生理弯曲存在，无畸形，无压痛及叩击痛，活动度正常', '脊柱侧弯', '脊柱后凸', '胸腰椎压痛', '胸腰椎叩击痛']
        },
        {
          key: 'limbs', label: '四肢', default: '四肢无畸形，关节无红肿，活动自如',
          options: ['四肢无畸形，关节无红肿，活动自如', '双下肢凹陷性水肿', '双下肢非凹陷性水肿', '关节红肿畸形', '杵状指', '四肢肌力减退']
        }
      ]
    },
    {
      key: 'nervousPE',
      name: '神经系统',
      items: [
        {
          key: 'nerve', label: '神经反射', default: '生理反射存在，病理反射未引出',
          options: ['生理反射存在，病理反射未引出', '膝反射减弱', '膝反射亢进', '病理反射阳性', '脑膜刺激征阳性']
        }
      ]
    }
  ];

  /* ---------------------------------------------------------------------
   * 五、专科查体（按科室追加）
   * 结构与通用查体一致，生成时追加在对应位置之后
   * ------------------------------------------------------------------- */
  const PE_SPECIAL = {
    respiratory: {
      name: '呼吸内科专科查体',
      items: [
        {
          key: 'respExtra', label: '呼吸专科', default: '三凹征阴性，语音传导正常',
          options: ['三凹征阴性，语音传导正常', '三凹征阳性', '语音传导增强', '语音传导减弱', '可闻及支气管呼吸音']
        }
      ]
    },
    cardiology: {
      name: '心血管专科查体',
      items: [
        {
          key: 'cardioExtra', label: '心血管专科', default: '未闻及额外心音，毛细血管搏动征阴性，水冲脉阴性',
          options: ['未闻及额外心音，毛细血管搏动征阴性，水冲脉阴性', '可闻及奔马律', '毛细血管搏动征阳性', '水冲脉阳性', '交替脉', '奇脉', '周围血管搏动征阳性']
        }
      ]
    },
    digestive: {
      name: '消化专科查体',
      items: [
        {
          key: 'giExtra', label: '消化专科', default: '肝颈静脉回流征阴性，Murphy征阴性',
          options: ['肝颈静脉回流征阴性，Murphy征阴性', 'Murphy征阳性', '肝颈静脉回流征阳性', '麦氏点压痛', '液波震颤阳性', '振水音阳性']
        }
      ]
    },
    endocrinology: {
      name: '内分泌专科查体',
      items: [
        {
          key: 'endoExtra', label: '内分泌专科', default: '皮肤细腻，无明显满月脸、水牛背',
          options: ['皮肤细腻，无明显满月脸、水牛背', '满月脸、水牛背', '皮肤粗糙', '手足增大', '胫前黏液性水肿', '突眼']
        }
      ]
    },
    nephrology: {
      name: '肾脏专科查体',
      items: [
        {
          key: 'renalExtra', label: '肾脏专科', default: '双肾区无叩击痛，颜面及双下肢无水肿，未见皮下出血点',
          options: ['双肾区无叩击痛，颜面及双下肢无水肿，未见皮下出血点', '双侧眼睑水肿', '双下肢水肿', '双肾区叩击痛']
        }
      ]
    },
    hematology: {
      name: '血液专科查体',
      items: [
        {
          key: 'hemExtra', label: '血液专科', default: '胸骨无压痛，全身浅表淋巴结未触及肿大，无皮下出血点，牙龈无渗血',
          options: ['胸骨无压痛，全身浅表淋巴结未触及肿大，无皮下出血点，牙龈无渗血', '胸骨压痛', '浅表淋巴结肿大', '皮下瘀点瘀斑', '牙龈渗血']
        }
      ]
    },
    neurology: {
      name: '神经内科专科查体',
      items: [
        {
          key: 'neuroExtra1', label: '高级神经活动', default: '神志清楚，言语流利，定向力、记忆力、计算力正常',
          options: ['神志清楚，言语流利，定向力、记忆力、计算力正常', '言语不利', '记忆力减退', '计算力减退', '失语']
        },
        {
          key: 'neuroExtra2', label: '颅神经', default: '十二对颅神经检查未见异常',
          options: ['十二对颅神经检查未见异常', '面部感觉减退', '面瘫', '伸舌偏斜', '眼睑下垂']
        },
        {
          key: 'neuroExtra3', label: '运动系统', default: '四肢肌张力正常，肌力5级，未见肌萎缩',
          options: ['四肢肌张力正常，肌力5级，未见肌萎缩', '四肢肌力4级', '偏瘫', '肌张力增高', '肌张力减低', '肌萎缩']
        },
        {
          key: 'neuroExtra4', label: '感觉系统', default: '痛温觉、触觉、深感觉检查未见异常',
          options: ['痛温觉、触觉、深感觉检查未见异常', '偏身感觉减退', '手套袜套样感觉减退', '感觉过敏']
        },
        {
          key: 'neuroExtra5', label: '共济运动', default: '指鼻试验、跟膝胫试验稳准，Romberg征阴性',
          options: ['指鼻试验、跟膝胫试验稳准，Romberg征阴性', '指鼻试验欠稳准', 'Romberg征阳性', '共济失调']
        }
      ]
    },
    pediatrics: {
      name: '儿科专科查体',
      items: [
        {
          key: 'pedExtra1', label: '发育', default: '生长发育与同龄儿相仿',
          options: ['生长发育与同龄儿相仿', '生长发育落后', '前囟未闭', '前囟平软', '前囟饱满']
        },
        {
          key: 'pedExtra2', label: '皮肤黏膜', default: '皮肤无黄染、花纹，毛细血管充盈时间<3秒',
          options: ['皮肤无黄染、花纹，毛细血管充盈时间<3秒', '皮肤黄染', '皮肤花纹', '毛细血管充盈时间延长']
        },
        {
          key: 'pedExtra3', label: '小儿特殊体征', default: '咽充血，扁桃体无肿大',
          options: ['咽充血，扁桃体无肿大', '咽充血，扁桃体肿大', '假性脑膜刺激征阳性']
        }
      ]
    },
    surgery: {
      name: '外科专科查体',
      items: [
        {
          key: 'surgExtra1', label: '手术区域', default: '手术区域皮肤完整，无红肿及分泌物',
          options: ['手术区域皮肤完整，无红肿及分泌物', '手术切口愈合良好', '手术切口红肿', '手术切口有渗出']
        },
        {
          key: 'surgExtra2', label: '疝及浅表肿块', default: '腹股沟及股区未触及肿块，站立位无咳嗽冲击感',
          options: ['腹股沟及股区未触及肿块，站立位无咳嗽冲击感', '腹股沟区可触及肿块', '肿块有咳嗽冲击感']
        }
      ]
    },
    obstetrics: {
      name: '产科专科查体',
      items: [
        {
          key: 'obsExtra1', label: '宫高腹围', default: '宫高、腹围与孕周相符，胎位纵产式',
          options: ['宫高、腹围与孕周相符，胎位纵产式', '宫高与孕周不符', '横产式', '臀先露']
        },
        {
          key: 'obsExtra2', label: '胎心', default: '胎心音145次/分，律齐',
          options: ['胎心音145次/分，律齐', '胎心音偏快', '胎心音偏慢', '未闻及胎心']
        }
      ]
    },
    gynecology: {
      name: '妇科专科查体',
      items: [
        {
          key: 'gynExtra1', label: '外阴及阴道', default: '外阴发育正常；阴道通畅，分泌物不多',
          options: ['外阴发育正常；阴道通畅，分泌物不多', '阴道分泌物增多', '阴道可见异常分泌物', '宫颈糜烂样改变']
        },
        {
          key: 'gynExtra2', label: '双合诊（直肠-腹部）', default: '子宫前倾前屈，正常大小，无压痛，双附件未触及包块',
          options: ['子宫前倾前屈，正常大小，无压痛，双附件未触及包块', '子宫压痛', '附件区可触及包块', '附件区压痛']
        }
      ]
    },
    emergency: {
      name: '急诊/重症专科查体',
      items: [
        {
          key: 'emExtra1', label: '病情评估', default: '神志清楚，生命体征平稳，GCS评分15分',
          options: ['神志清楚，生命体征平稳，GCS评分15分', 'GCS评分下降', '休克表现', '意识障碍']
        },
        {
          key: 'emExtra2', label: '创伤评估', default: '全身未见明显创伤',
          options: ['全身未见明显创伤', '皮肤软组织损伤', '骨折表现', '腹部闭合性损伤']
        }
      ]
    }
  };

  /* ---------------------------------------------------------------------
   * 六、科室定义
   * ------------------------------------------------------------------- */
  const DEPARTMENTS = [
    { key: 'general', name: '通用/全科', group: '通用', special: [] },
    { key: 'respiratory', name: '呼吸内科', group: '内科', special: ['respiratory'] },
    { key: 'digestive', name: '消化内科', group: '内科', special: ['digestive'] },
    { key: 'cardiology', name: '心血管内科', group: '内科', special: ['cardiology'] },
    { key: 'endocrinology', name: '内分泌科', group: '内科', special: ['endocrinology'] },
    { key: 'nephrology', name: '肾内科', group: '内科', special: ['nephrology'] },
    { key: 'hematology', name: '血液内科', group: '内科', special: ['hematology'] },
    { key: 'neurology', name: '神经内科', group: '内科', special: ['neurology'] },
    { key: 'surgery', name: '外科（普外/骨科等）', group: '外科', special: ['surgery'] },
    { key: 'obstetrics', name: '产科', group: '妇产', special: ['obstetrics'] },
    { key: 'gynecology', name: '妇科', group: '妇产', special: ['gynecology'] },
    { key: 'pediatrics', name: '儿科', group: '儿科', special: ['pediatrics'] },
    { key: 'emergency', name: '急诊/ICU', group: '急诊', special: ['emergency'] }
  ];

  /* ---------------------------------------------------------------------
   * 七、默认空病历数据
   * ------------------------------------------------------------------- */
  function emptyRecord() {
    return {
      // 元数据
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      // 基本信息
      basic: {
        department: 'general',
        name: '',
        gender: '',
        age: '',
        marital: '',
        birthPlace: '',
        occupation: '',
        admitDate: '',
        recordDate: todayStr(),
        reliability: '可靠',
        informant: '',
        chiefComplaint: '',
        chiefComplaintDuration: '',
        chiefComplaintDurationUnit: '天'
      },
      // 现病史
      hpi: {
        onset: '',              // 起病情况
        cause: '',              // 诱因
        symptoms: '',           // 主要症状特点
        evolution: '',          // 病情进展
        accompanying: '',       // 伴随症状
        treatment: '',          // 诊治经过
        generalCondition: '',   // 一般情况
        extra: ''               // 补充
      },
      // 系统回顾：{ [rosKey]: { [symptomKey]: { checked:bool, time:'', detail:'' } } }
      ros: {},
      // 既往史
      pmh: {
        health: '良好',          // 平素健康状况
        diseaseChecks: {},       // { '高血压': true }
        diseaseOther: '',
        infection: '',
        surgery: '',
        trauma: '',
        transfusion: '',
        vaccine: '',
        allergy: '',             // 有无过敏：无 / 有
        allergenChecks: {},      // 过敏原
        allergenOther: '',
        allergyReaction: '',
        special: ''              // 其他（如传染病接触史）
      },
      // 个人史
      personal: {
        birth: '',
        residence: '',
        travel: '',
        smoking: '无',           // 无 / 有 / 已戒
        smokingAmount: '',
        drinking: '无',
        drinkingAmount: '',
        drugs: '',
        environment: '',
        habits: ''
      },
      // 婚姻史
      marriage: {
        status: '未婚',
        age: '',
        spouseHealth: ''
      },
      // 月经史
      menstruation: {
        applicable: '',          // '有' / '无' / ''
        age: '',
        cycle: '',
        duration: '',
        quantity: '',
        lmp: '',
        menopauseAge: '',
        dysmenorrhea: '无'
      },
      // 生育史
      childbirth: {
        applicable: '',
        gravida: '',
        para: '',
        abortion: '',
        details: '',
        lastBirth: '',
        contraception: ''
      },
      // 家族史
      family: {
        diseaseChecks: {},
        other: '',
        deceased: ''
      },
      // 体格检查
      pe: {
        vitals: {},
        general: {},
        skin: {},
        head: {},
        neck: {},
        chest: {},
        abdomen: {},
        genital: {},
        spine: {},
        nervousPE: {}
      },
      // 辅助检查
      auxiliary: {
        items: [ { name: '', result: '' } ]
      },
      // 病历摘要
      summary: '',
      // 初步诊断
      diagnosis: {
        confirmed: [],     // 已确认诊断（字符串数组）
        newLine: ''
      },
      // 诊断参考提示（工具根据阳性发现给出，默认不自动写入）
      suggestions: { accepted: [] }
    };
  }

  function todayStr() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  return {
    GENDERS, MARITAL, OCCUPATIONS, NATIONALITY, RELIABILITY, DURATION_UNITS,
    ROS, COMMON_PMH, ALLERGENS, ALLERGY_REACTIONS, FAMILY_DISEASES,
    VITALS, PE_COMMON, PE_SPECIAL, DEPARTMENTS,
    emptyRecord, todayStr
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHEMA;
}
