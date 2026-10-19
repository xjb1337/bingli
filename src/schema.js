/* ===========================================================================
 * 大病历生成器 —— 数据模型 / 字段定义
 * 所有科室共用一套「病史」字段，体格检查分为「通用查体 + 专科查体」。
 * 设计原则：手机上尽量点选，少打字；每一项都可以手写补充或改写。
 *
 * 字段取舍以 docs/评分表对齐说明.md 为唯一依据（浙江省规培内科结业考核评分表）。
 * 范围约定：只覆盖「病历内容」本身（病史、查体、SOAP、出院记录）。
 * 不采集过程性评分项（检查者自我介绍、问诊技巧、医患沟通、查体手法等），
 * 这些属于现场操作评分，不进入数据模型、也不可能出现在病历正文里。
 *
 * 两条必须守住的规矩：
 *   1) 腹部查体次序必须是 视诊 → 听诊 → 叩诊 → 触诊（评分表第3页「腹部检查次序
 *      正确得2分」）。触诊、叩诊会刺激肠管、改变肠鸣音，所以听诊必须在它们之前。
 *      这条只适用于腹部：胸部/心脏仍是 视诊 → 触诊 → 叩诊 → 听诊。
 *   2) hints.js 靠 `pe:组.项` / `pev:组.项=值` 匹配 47 条诊断提示，所以既有查体项
 *      的 key、default、options 只能新增，不能改名或删除；拆分出来的新子项一律
 *      「保留父项 + 新增子项」，父项作为兼容兜底（例如 nervousPE.nerve）。
 *
 * 子项约定：细分子项（如 abdomen 的四个触诊子项）默认值为空字符串 ''，
 * 未填写时不会输出、也不会污染病历正文；正常描述放在 `normal` 字段，
 * 供界面显示占位、供 hints 判定「填的是正常还是异常」。
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
      name: '皮肤粘膜',
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
      name: '皮肤粘膜',
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
      name: '头颅及其器官',
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
      // ★ 次序铁律（评分表第3页「腹部检查次序正确得2分」）：
      //     视诊 → 听诊 → 叩诊 → 触诊
      //   触诊与叩诊会刺激肠管、改变肠鸣音，所以听诊必须排在它们之前。
      //   这个数组的顺序就是生成病历时的输出顺序，不要随意调整。
      //   胸部/心脏不适用本规则，仍为 视诊 → 触诊 → 叩诊 → 听诊。
      items: [
        {
          // ① 视诊：只写腹部形态（2分）。"腹平软"属触诊结论，已移至 abdPalpation。
          key: 'abdInspect', label: '视诊', default: '腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波',
          // legacyDefault：旧版本的 default 文本。hints.js 用 `val === item.default`
          // 判断「用户没改过」，旧存档里可能存着旧文本，两个都要认，否则会误报阳性。
          legacyDefault: '腹平软，未见腹壁静脉曲张',
          options: ['腹部平坦，未见腹壁静脉曲张，未见胃肠型及蠕动波', '腹部膨隆', '腹壁静脉曲张', '可见胃肠型及蠕动波', '可见手术瘢痕']
        },
        {
          // ② 听诊：必须在触诊、叩诊之前（4分）。评分表要求交代听诊部位与听诊时长。
          key: 'abdAuscultation', label: '听诊', default: '左上腹听诊1分钟，肠鸣音4次/分',
          legacyDefault: '肠鸣音正常，约4次/分',
          options: ['左上腹听诊1分钟，肠鸣音4次/分', '肠鸣音活跃', '肠鸣音减弱', '肠鸣音消失', '可闻及血管杂音']
        },
        {
          // ③ 叩诊：逆时针次序（4分，不要求脾区）
          key: 'abdPercussion', label: '叩诊', default: '自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性',
          legacyDefault: '肝区及双肾区无叩击痛，移动性浊音阴性',
          options: ['自左下腹起逆时针叩诊，肝区及双肾区无叩击痛，移动性浊音阴性', '肝区叩击痛', '双肾区叩击痛', '移动性浊音阳性', '鼓音区缩小']
        },
        {
          // ④ 触诊（10分）。父项保留：hints.js 有 5 条规则依赖 abdomen.abdPalpation，
          //    其中「急性阑尾炎」等规则的 must 正是它，删改会导致规则静默失效。
          key: 'abdPalpation', label: '触诊', default: '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
          legacyDefault: '全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
          options: [
            '腹平软，全腹无压痛、反跳痛，未触及包块，肝脾肋下未触及',
            '上腹部压痛，无反跳痛',
            '右下腹压痛、反跳痛',
            '全腹压痛、反跳痛，腹肌紧张',
            '肝肋下可触及',
            '脾肋下可触及',
            '可触及腹部包块'
          ]
        },
        {
          // 触诊细分（各 2.5 分）：默认留空，填了才输出；未填时以上面的 abdPalpation 兜底。
          // parent 指明聚合父项，供 generator 去重、供 hints 做别名映射。
          key: 'abdPalpSuperficial', label: '触诊—全腹浅触诊', default: '', parent: 'abdPalpation',
          normal: '全腹浅触诊无压痛，腹肌柔软',
          options: ['全腹浅触诊无压痛，腹肌柔软', '上腹部浅触诊压痛', '右下腹浅触诊压痛', '全腹浅触诊压痛，腹肌紧张']
        },
        {
          key: 'abdPalpDeep', label: '触诊—全腹深触诊', default: '', parent: 'abdPalpation',
          normal: '全腹深触诊无压痛、反跳痛，未触及包块',
          options: ['全腹深触诊无压痛、反跳痛，未触及包块', '深触诊可触及包块', '深触诊反跳痛阳性']
        },
        {
          key: 'liverPalpation', label: '触诊—肝', default: '', parent: 'abdPalpation',
          normal: '肝肋下未触及，肝区无压痛',
          options: ['肝肋下未触及，肝区无压痛', '肝肋下可触及', '肝区压痛']
        },
        {
          key: 'spleenPalpation', label: '触诊—脾', default: '', parent: 'abdPalpation',
          normal: '脾肋下未触及',
          options: ['脾肋下未触及', '脾肋下可触及', '脾肋下可触及且质硬']
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
          // 父项保留：hints.js 有 3 条规则依赖 spine.limbs（含 CKD 规则的 must）
          key: 'limbs', label: '四肢', default: '四肢无畸形，关节无红肿，活动自如',
          options: ['四肢无畸形，关节无红肿，活动自如', '双下肢凹陷性水肿', '双下肢非凹陷性水肿', '关节红肿畸形', '杵状指', '四肢肌力减退']
        },
        {
          // 以下为评分表第3-4页「神经系统及四肢」按项给分项的拆分（各 2 分）。
          // 默认留空，未填写不输出；填了才进病历，正常描述见 normal。
          // parent 指明聚合父项 limbs，供 generator 去重、供 hints 做别名映射。
          key: 'limbMuscle', label: '四肢肌力', default: '', parent: 'limbs',
          normal: '四肢肌力5级',
          options: ['四肢肌力5级', '四肢肌力4级', '四肢肌力3级', '双上肢肌力正常、双下肢肌力减退', '偏瘫侧肌力减退']
        },
        {
          key: 'kneeJerk', label: '双侧膝跳反射', default: '',
          normal: '双侧膝跳反射正常对称',
          options: ['双侧膝跳反射正常对称', '双侧膝跳反射减弱', '双侧膝跳反射亢进', '单侧膝跳反射减弱']
        },
        {
          key: 'edemaAnkle', label: '下肢水肿—踝部', default: '', parent: 'limbs',
          normal: '双侧踝部无水肿',
          options: ['双侧踝部无水肿', '双侧踝部凹陷性水肿', '单侧踝部水肿']
        },
        {
          key: 'edemaPretibial', label: '下肢水肿—胫前', default: '', parent: 'limbs',
          normal: '双侧胫前无水肿',
          options: ['双侧胫前无水肿', '双侧胫前凹陷性水肿', '单侧胫前水肿']
        },
        {
          key: 'dorsalisPedis', label: '足背动脉搏动', default: '',
          normal: '双侧足背动脉搏动对称有力',
          options: ['双侧足背动脉搏动对称有力', '双侧足背动脉搏动减弱', '单侧足背动脉搏动减弱', '单侧足背动脉搏动未触及']
        },
        {
          key: 'radialPulse', label: '桡动脉搏动', default: '',
          normal: '双侧桡动脉搏动对称',
          options: ['双侧桡动脉搏动对称', '双侧桡动脉搏动减弱', '脉搏短绌', '水冲脉']
        }
      ]
    },
    {
      key: 'nervousPE',
      name: '神经系统',
      items: [
        {
          // ★ 父项不可删除：hints.js「脑膜炎」等规则 must 依赖 nervousPE.nerve
          key: 'nerve', label: '神经反射', default: '生理反射存在，病理反射未引出',
          options: ['生理反射存在，病理反射未引出', '膝反射减弱', '膝反射亢进', '病理反射阳性', '脑膜刺激征阳性']
        },
        {
          // 以下四项按评分表「腱反射、布氏征、克氏征、巴氏征（每项2分）」分立，
          // 各 2 分，默认留空。父项 nerve 保留，四项通过 parent 关联回去。
          key: 'tendonReflex', label: '腱反射', default: '', parent: 'nerve',
          normal: '双侧肱二头肌、膝腱、跟腱反射正常对称',
          options: ['双侧肱二头肌、膝腱、跟腱反射正常对称', '腱反射普遍减弱', '腱反射普遍亢进', '单侧腱反射减弱']
        },
        {
          key: 'brudzinski', label: '布氏征（Brudzinski）', default: '', parent: 'nerve',
          normal: '布氏征阴性',
          options: ['布氏征阴性', '布氏征阳性']
        },
        {
          key: 'kernig', label: '克氏征（Kernig）', default: '', parent: 'nerve',
          normal: '克氏征阴性',
          options: ['克氏征阴性', '克氏征阳性']
        },
        {
          key: 'babinski', label: '巴氏征（Babinski）', default: '', parent: 'nerve',
          normal: '巴氏征阴性',
          options: ['巴氏征阴性', '巴氏征阳性', '双侧巴氏征阳性']
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
        // 籍贯（祖籍）与出生地在病历一般项目里是两栏，分开存
        nativePlace: '',
        birthPlace: '',
        nationality: '汉族',
        occupation: '',
        workUnit: '',
        // 通讯地址
        address: '',
        phone: '',
        // 病历号/住院号（评分表第2页「询问患者…病历号…」1分；第6页一般项目 2分）
        recordNo: '',
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
        cause: '',              // 发病诱因（评分表第2页 2 分）
        symptoms: '',           // 主要症状特点
        relief: '',             // 缓解因素（评分表第6页现病史明确列出）
        evolution: '',          // 病情进展
        accompanying: '',       // 伴随症状
        negativeDiscriminating: '', // 有鉴别诊断意义的阴性病史（第2页 5 分；第6页现病史）
        treatment: '',          // 诊治经过（整段手写，覆盖诊治单位/检查/治疗/用药/效果）
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
        diseaseDetail: '',       // 慢性病详情（手写优先于勾选；generator 与 hints 均读取）
        longTermMeds: '',        // 长期用药史（评分表第2页既往史 6 项之一）
        infection: '',
        surgery: '',
        trauma: '',
        transfusion: '',
        poisoning: '',           // 中毒史
        vaccine: '',
        allergy: '',             // 有无过敏：无 / 有
        allergenChecks: {},      // 过敏原
        allergenOther: '',
        allergenReactionChecks: {}, // 过敏反应表现勾选（app 已在渲染，此前未声明）
        allergyReaction: '',     // 过敏反应手写描述
        relatedHistory: '',      // 与本病相关病史
        otherTreatDiseases: '',  // 与本病无关但仍需治疗的其他疾病（评分表第6页现病史）
        special: ''              // 其它
      },
      // 个人史
      personal: {
        maternal: '',            // 母孕史（儿科/产科）
        birth: '',               // 出生史
        feeding: '',             // 喂养史（儿科）
        growth: '',              // 生长发育史（儿科）
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
        // 留空表示「跟一般项目一致」；填了才覆盖，避免两处默认值打架
        status: '',
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
        deceased: '',
        // 两系三代遗传疾病史（评分表第2页家族史 5 分 = 类似病情 2.5 + 两系三代 2.5）
        threeGeneration: '',
        similarDisease: ''
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
        confirmed: [],     // 已确认诊断（字符串数组，顺序即主次）
        newLine: ''
      },

      /* -------------------------------------------------------------------
       * 首次病程录 SOAP（评分表第5页 100 分；同时服务第6页「首次病程记录」20 分）
       *   S 主观简要病史 15 = 概括简练重点突出 10 + 与病史采集一致 5
       *   O 客观记录     10 = 有意义的体格检查 5 + 相关辅助检查 5
       *   A 评估与鉴别   40 = 依据(5+5+5) + 主次排序 10 + 鉴别诊断 10 + 不跑题 5
       *   P 诊疗计划     25 = 符合原则 10 + 与诊断对应 10 + 个体化 5
       * ----------------------------------------------------------------- */
      soap: {
        s: {
          summary: '',        // 病历特点：对现病史概括简练、重点突出（10）
          consistency: ''     // 与病史采集病案信息一致性的补充说明（5）
        },
        o: {
          pe: '',             // 对诊断有意义的体格检查（5）；留空则由异常体征自动生成
          aux: ''             // 与疾病相关的辅助检查结果（5）；留空则由辅助检查自动生成
        },
        a: {
          basis: '',          // 诊断依据概述：简洁完整、不堆砌（5 + 5）
          basisDetail: [],    // [{ diagnosis, history, pe, aux }] 各项诊断的三项依据（5）
          ranking: '',        // 诊断准确、主次排序合理（10）
          diff: [],           // [{ diagnosis, why, against, points }] 鉴别诊断（10）
          diffNote: ''        // 未出现与诊断无关的鉴别诊断的说明（5）
        },
        p: {
          principle: '',      // 诊疗计划符合基本治疗原则、简明扼要（10）
          perDiagnosis: [],   // [{ diagnosis, exam, treatment }] 与诊断一一对应（10）
          individual: ''      // 体现患者病情个体化原则（5）
        }
      },

      /* -------------------------------------------------------------------
       * 出院记录（评分表第6-7页 15 分）
       * ----------------------------------------------------------------- */
      discharge: {
        dischargeDate: '',    // 出院日期（住院天数由 admitDate 推算）
        admitCondition: '',   // 入院情况：简洁明了、重点突出、入院诊断合理（2）
        course: '',           // 诊疗经过：病情变化、检查结果、治疗经过及效果（5）
        dischargeStatus: '',  // 出院情况：主要症状、体征、辅助检查结果（2）
        diagnoses: [],        // 出院诊断：完整、规范（2）；留空则继承 diagnosis.confirmed
        advice: {             // 出院医嘱：全面、具体（2）
          drug: '',           // 药物
          nonDrug: '',        // 非药物治疗
          lifestyle: '',      // 生活指导
          followUp: ''        // 复诊时间
        }
      },

      /* -------------------------------------------------------------------
       * 重点查体（评分表第4页 15 分）
       * keys 存 '组.key' 形式的查体项引用，如 'chest.lungAuscultation'、
       * 'abdomen.abdPalpation'、'special_respiratory.respExtra'。
       * ----------------------------------------------------------------- */
      focusPE: {
        keys: [],
        note: ''
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

  /* ---------------------------------------------------------------------
   * 八、查体项查询辅助（供 generator / hints / checker 共用）
   *
   * 背景：为了让评分表里「按项给分」的查体项能被逐项核对，腹部触诊、神经反射、
   * 四肢等做了「保留父项 + 新增子项」的拆分。子项默认值为空，未填写就不输出；
   * 子项一旦被填写，父项就该让位（否则病历里会同时出现两种描述）。
   * 下面三个函数把这件事收敛到一处，避免各处各写一套判断。
   * ------------------------------------------------------------------- */

  /** 展平 PE_COMMON 为 [{ group, groupName, item }]，便于按 key 查找 */
  const PE_INDEX = (() => {
    const idx = {};
    PE_COMMON.forEach(group => {
      group.items.forEach(item => {
        idx[group.key + '.' + item.key] = { group, groupName: group.name, item };
      });
    });
    return idx;
  })();

  /**
   * 查找某个 '组.key' 对应的查体项对象，找不到返回 null。
   *
   * 除了普通查体（PE_COMMON），还要支持专科查体引用：
   * 重点查体里的 key 可以是 'special_neurology.neuroExtra1' 这种形式，
   * UI 与生成器都支持这种写法，索引也必须覆盖，
   * 否则专科重点项会被当成「非法 key」而不计分（评审 medium-2）。
   */
  function findPEItem(ref) {
    const text = String(ref || '');
    const hit = PE_INDEX[text];
    if (hit) return hit.item;
    if (text.startsWith('special_')) {
      const rest = text.slice('special_'.length);
      const dot = rest.indexOf('.');
      if (dot <= 0) return null;
      const spKey = rest.slice(0, dot);
      const itemKey = rest.slice(dot + 1);
      const sp = PE_SPECIAL[spKey];
      if (!sp) return null;
      return (sp.items || []).find(it => it.key === itemKey) || null;
    }
    return null;
  }

  /** 取一组下以 parent 归属某父项的所有子项 */
  function childPEItems(groupKey, parentKey) {
    const g = PE_COMMON.find(x => x.key === groupKey);
    if (!g) return [];
    return g.items.filter(it => it.parent === parentKey);
  }

  /**
   * 某个子项是否属于「已填写」状态。
   * 子项默认值为 ''，所以「有值且不等于 normal（正常描述）」才算填过。
   * 注意：用户可能填的就是 normal 文本，此时也算填过——所以判断标准是「非空」。
   */
  function peItemFilled(store, item) {
    if (!item) return false;
    const raw = (store || {})[item.key];
    return raw !== undefined && raw !== null && String(raw).trim() !== '';
  }

  /**
   * 父项是否应该让位给子项：
   * 只要该父项下有任意子项被填写，父项就不再参与输出（由子项接管）。
   */
  function parentSupersededByChild(store, groupKey, parentKey) {
    return childPEItems(groupKey, parentKey).some(it => peItemFilled(store, it));
  }

  /**
   * 判断某个查体值是否「仍是默认描述」（即用户没改过）。
   * 必须同时认 default 与 legacyDefault：本次改动把腹部四项的默认文案改成了
   * 更贴合评分表的写法，旧存档里存的是旧文案，只比 default 会把它当成阳性发现。
   *
   * 另外要忽略尾部标点差异：用户可能在 textarea 里给默认文字补了个句号，
   * 严格比较会判成「改过」→ 当成阳性体征 → 触发假诊断提示（reviewer 实测 M1）。
   * @param {object} item PE_COMMON 里的查体项
   * @param {string} val  当前值
   */
  function peValueIsDefault(item, val) {
    if (!item || !val) return false;
    const norm = s => String(s).trim().replace(/[，,；;。.、\s]+$/g, '');
    const v = norm(val);
    if (item.default && v === norm(item.default)) return true;
    if (item.legacyDefault && v === norm(item.legacyDefault)) return true;
    return false;
  }

  return {
    GENDERS, MARITAL, OCCUPATIONS, NATIONALITY, RELIABILITY, DURATION_UNITS,
    ROS, COMMON_PMH, ALLERGENS, ALLERGY_REACTIONS, FAMILY_DISEASES,
    VITALS, PE_COMMON, PE_SPECIAL, DEPARTMENTS,
    emptyRecord, todayStr,
    // 查体项查询辅助
    PE_INDEX, findPEItem, childPEItems, peItemFilled, parentSupersededByChild,
    peValueIsDefault
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHEMA;
}
