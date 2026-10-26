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
  /* 系统回顾：按《诊断学》第10版（第556页）的 8 个系统划分。
   *
   * 教材原文的 8 个系统：
   *   1 呼吸  2 循环  3 消化  4 泌尿  5 血液  6 内分泌及代谢  7 神经精神  8 肌肉骨骼
   *
   * 原来的 12 个系统里有 4 个（一般情况/皮肤粘膜/头部及五官/精神心理）
   * 教材并不单列，其症状已按教材条文并入下列 8 个系统。
   * 映射关系见 tools/ros-map.js。
   *
   * 注意：hints.js 里有 26 条规则引用 ros:系统.症状 键，
   * 改动症状 key 会让规则静默失效。改动前先跑 node tools/check-ros-keys.js。
   */
  const ROS = [
    {
      // 教材：慢性咳嗽、咳痰、呼吸困难、咯血、低热、盗汗等。
      key: 'resp',
      name: '呼吸系统',
      symptoms: [
        { key: 'cough', label: '咳嗽', detail: '性质/频率' },
        { key: 'sputum', label: '咳痰', detail: '量/色/性状' },
        { key: 'hemoptysis', label: '咯血', detail: '量' },
        { key: 'dyspnea', label: '呼吸困难' },
        { key: 'chestPainResp', label: '胸痛' },
        { key: 'wheeze', label: '喘息' },
        { key: 'pleurisy', label: '胸膜炎性胸痛' },
        { key: 'fever', label: '发热', detail: '热峰' },
        { key: 'chills', label: '畏寒寒战' },
        { key: 'nightSweat', label: '盗汗' },
        { key: 'nasalObstruction', label: '鼻塞流涕' },
        { key: 'soreThroat', label: '咽痛' },
        { key: 'hoarseness', label: '声音嘶哑' }
      ]
    },
    {
      // 教材：心悸、气急、咯血、发绀，心前区疼痛、晕厥、水肿及高血压、动脉硬化、
      //       心脏疾病、风湿热病史等。
      key: 'cardio',
      name: '循环系统',
      symptoms: [
        { key: 'palpitation', label: '心悸' },
        { key: 'chestPainCardio', label: '心前区疼痛' },
        { key: 'orthopnea', label: '夜间阵发性呼吸困难/端坐呼吸' },
        { key: 'intermittentClaudication', label: '间歇性跛行' },
        { key: 'edemaCardio', label: '下肢水肿' },
        { key: 'cyanosis', label: '发绀' },
        { key: 'syncope', label: '晕厥' },
        { key: 'edemaSys', label: '全身水肿' }
      ]
    },
    {
      // 教材：慢性腹胀、腹痛、嗳气、反酸、呕血、便血、黄疸和慢性腹泻、便秘史等。
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
        { key: 'jaundiceGi', label: '黄疸' },
        { key: 'jaundice', label: '皮肤黏膜黄染' },
        { key: 'appetiteLoss', label: '食欲减退' },
        { key: 'toothache', label: '牙痛' }
      ]
    },
    {
      // 教材：尿频、尿急、尿痛、排尿不畅或淋沥，尿色（洗肉水样或酱油色）、清浊度，
      //       水肿，肾毒性药物应用史，铅、汞化学毒物接触或中毒史，下疳、淋病、梅毒等性病史。
      key: 'gu',
      name: '泌尿系统',
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
      // 教材：头晕、乏力，皮肤或黏膜瘀点、紫癜、血肿，反复鼻出血，牙龈出血，骨骼痛。
      // 原「一般情况」的乏力、「皮肤粘膜」的出血相关症状并入此处。
      key: 'hemat',
      name: '血液系统',
      symptoms: [
        { key: 'anemia', label: '乏力、面色苍白' },
        { key: 'fatigue', label: '疲乏无力' },
        { key: 'bleeding', label: '易出血/出血难止' },
        { key: 'bruise', label: '皮下瘀斑' },
        { key: 'purpura', label: '瘀点瘀斑' },
        { key: 'epistaxis', label: '鼻出血' },
        { key: 'lymphNode', label: '淋巴结肿大' },
        { key: 'bonePain', label: '骨痛' },
        { key: 'transfusion', label: '输血史' },
        { key: 'rash', label: '皮疹', detail: '部位/形态' },
        { key: 'pruritus', label: '皮肤瘙痒' },
        { key: 'pallorSkin', label: '皮肤苍白' },
        { key: 'ulcer', label: '皮肤溃疡' }
      ]
    },
    {
      // 教材：畏寒、怕热、多汗、食欲异常、烦渴、多饮、多尿、头痛、视力障碍、
      //       肌肉震颤、性格、体重、皮肤、毛发和第二性征改变史等。
      // 原「一般情况」的体重/食欲、「皮肤粘膜」的脱发并入此处。
      key: 'endocrine',
      name: '内分泌及代谢系统',
      symptoms: [
        { key: 'polydipsia', label: '多饮' },
        { key: 'polyphagia', label: '多食' },
        { key: 'polyuriaEndo', label: '多尿' },
        { key: 'heatIntolerance', label: '怕热多汗' },
        { key: 'coldIntolerance', label: '怕冷少汗' },
        { key: 'hairChange', label: '毛发改变' },
        { key: 'neckMass', label: '颈部肿块' },
        { key: 'growthChange', label: '身高明显改变' },
        { key: 'weightLoss', label: '体重下降', detail: '约下降' },
        { key: 'weightGain', label: '体重增加', detail: '约增加' },
        { key: 'hairLoss', label: '脱发' }
      ]
    },
    {
      // 教材：头痛、失眠或嗜睡、意识障碍、晕厥、痉挛、瘫痪、视力障碍、
      //       感觉及运动异常、性格改变、记忆力和智力减退等。
      // 原「头部及五官」「精神心理」两系统的症状并入此处。
      key: 'nervous',
      name: '神经精神系统',
      symptoms: [
        { key: 'headache', label: '头痛' },
        { key: 'dizziness', label: '头晕' },
        { key: 'vertigo', label: '眩晕' },
        { key: 'syncopeNerve', label: '晕厥' },
        { key: 'visualBlur', label: '视物模糊' },
        { key: 'eyePain', label: '眼痛/畏光' },
        { key: 'hearingLoss', label: '听力下降' },
        { key: 'tinnitus', label: '耳鸣' },
        { key: 'numbness', label: '肢体麻木' },
        { key: 'weakness', label: '肢体无力' },
        { key: 'seizure', label: '抽搐' },
        { key: 'tremor', label: '震颤' },
        { key: 'memoryLoss', label: '记忆力减退' },
        { key: 'sleepDisorder', label: '睡眠障碍' },
        { key: 'speech', label: '言语不清' },
        { key: 'incontinence', label: '大小便失禁' },
        { key: 'insomnia', label: '失眠' },
        { key: 'moodLow', label: '情绪低落' },
        { key: 'anxiety', label: '焦虑' },
        { key: 'hallucination', label: '幻觉妄想' },
        /* 下面五项是为精神科补的。教材的神经精神系统系统回顾只到"情绪状态、
           睡眠、记忆"这一层，写得下抑郁和焦虑，但问不出精神科真正要问的东西：
           兴趣减退、精力下降、自杀观念、食欲体重改变、行为异常。
           这几项在精神科门诊是必问项，缺了它们，抑郁发作的整段病史就无从下手。 */
        { key: 'interestLoss', label: '兴趣减退/愉快感缺失' },
        { key: 'energyLoss', label: '精力下降/易疲劳' },
        { key: 'suicidal', label: '自杀自伤观念' },
        { key: 'appetiteChange', label: '食欲及体重改变' },
        { key: 'behaviorAbnormal', label: '行为异常' }
      ]
    },
    {
      // 教材：关节肿痛，运动障碍，肢体麻木、痉挛、萎缩、瘫痪史等。
      key: 'joint',
      name: '肌肉骨骼系统',
      symptoms: [
        { key: 'jointPain', label: '关节疼痛/肿胀' },
        { key: 'morningStiff', label: '晨僵' },
        { key: 'backPain', label: '腰背痛' },
        { key: 'muscleWeak', label: '肌肉酸痛无力' }
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
    // min/max 是「可信范围」，不是正常范围。超出可信范围基本是打错字或多按一位；
    // 输入时就地标红，不用等到第 11 步生成时才发现。
    // 工具不判断正常异常——正常参考值因人而异，这里只拦明显输错。
    { key: 'temperature', label: '体温', unit: '℃', placeholder: '36.5', type: 'number', min: 34, max: 43 },
    { key: 'pulse', label: '脉搏', unit: '次/分', placeholder: '78', type: 'number', min: 20, max: 250 },
    { key: 'respiration', label: '呼吸', unit: '次/分', placeholder: '18', type: 'number', min: 5, max: 80 },
    { key: 'sbp', label: '收缩压', unit: 'mmHg', placeholder: '120', type: 'number', min: 50, max: 300 },
    { key: 'dbp', label: '舒张压', unit: 'mmHg', placeholder: '80', type: 'number', min: 20, max: 200 },
    { key: 'height', label: '身高', unit: 'cm', placeholder: '170', type: 'number', min: 30, max: 250 },
    { key: 'weight', label: '体重', unit: 'kg', placeholder: '60', type: 'number', min: 1, max: 300 },
    // 腹围：教材《病历书写》「腹部」一节明确列出「腹围（妊娠、肥胖、腹腔积液等情况时测量）」，
    // 测量方法为「让病人排尿后平卧，用软尺经脐绕腹一周」。放在生命体征卡里与身高体重同排，
    // 消化内科/产科/儿科都常用，因此不加 dept 限制。
    { key: 'abdCirc', label: '腹围', unit: 'cm', placeholder: '80', type: 'number', min: 20, max: 200 },
    // 儿科专用
    { key: 'headCirc', label: '头围', unit: 'cm', placeholder: '34', type: 'number', min: 20, max: 70, dept: 'pediatrics' },
    { key: 'chestCirc', label: '胸围', unit: 'cm', placeholder: '33', type: 'number', min: 20, max: 120, dept: 'pediatrics' }
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
      name: '一般状况',
      // 顺序按《诊断学》（第10版）第六篇病历书写「一般状况」原文：
      //   发育（正常、异常），营养（良好、中等、不良），神志（清晰、模糊、嗜睡…），
      //   体位（自主、被动、强迫），面容与表情，检查能否合作。
      // 生成病历时就按这个顺序逐项列举，读起来与教材、医院模板一致。
      //
      // joinWith：教材与医院模板里一般状况是**一整句逗号连写**
      // （「发育正常，营养良好，神志清楚，自主体位。」），不是逐句句号断开。
      // 其余查体组仍是句号分隔，所以把分隔符放在组上，不在 generator 里硬编码组名。
      joinWith: '，',
      items: [
        {
          // 教材「一般状况」第一项就是「发育（正常、异常）」，原 schema 缺此项。
          key: 'development', label: '发育', default: '发育正常',
          options: ['发育正常', '发育不良', '发育迟缓', '发育异常']
        },
        {
          key: 'nutrition', label: '营养', default: '营养中等',
          options: ['营养良好', '营养中等', '营养不良', '肥胖']
        },
        {
          key: 'conscious', label: '神志', default: '神志清楚，精神可',
          options: ['神志清楚，精神可', '神志清楚，精神一般', '神志清楚，精神差', '嗜睡', '昏睡', '浅昏迷', '深昏迷']
        },
        {
          // 教材原文是「体位（自主、被动、强迫）」，医院模板写成「自主体位」。
          // 旧版这里写的是「自动体位」（不规范说法），已按教材改为「自主体位」。
          key: 'posture', label: '体位', default: '自主体位',
          options: ['自主体位', '被动体位', '强迫体位'],
          legacyDefault: '自动体位'
        },
        {
          key: 'face', label: '面容', default: '面容自然',
          options: ['面容自然', '急性病容', '慢性病容', '贫血面容', '二尖瓣面容', '甲亢面容', '满月面容']
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
          key: 'spider', label: '蜘蛛痣与肝掌', default: '未见蜘蛛痣及肝掌',
          options: ['未见蜘蛛痣及肝掌', '可见蜘蛛痣', '肝掌阳性', '可见蜘蛛痣，肝掌阳性']
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
          key: 'eyes', label: '眼', default: '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
          options: [
            '眼睑无水肿，巩膜无黄染，双侧瞳孔等大等圆，对光反射灵敏',
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
          key: 'lungPercussion', label: '肺—叩诊', default: '双肺叩诊清音，肺下界位置正常',
          options: ['双肺叩诊清音，肺下界位置正常', '双肺叩诊过清音', '局部叩诊浊音', '局部叩诊实音', '肺下界下移']
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
          key: 'heartInspect', label: '心—视诊', default: '心前区无隆起，心尖搏动位置正常，未超出正常范围',
          options: ['心前区无隆起，心尖搏动位置正常，未超出正常范围', '心尖搏动向左下移位', '心前区隆起']
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
          key: 'heartAuscultation', label: '心—听诊', default: '心律齐，各瓣膜听诊区未闻及病理性杂音',
          options: [
            '心律齐，各瓣膜听诊区未闻及病理性杂音',
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
          key: 'abdAuscultation', label: '听诊', default: '肠鸣音正常，未闻及血管杂音',
          legacyDefault: '肠鸣音正常，约4次/分',
          options: ['肠鸣音正常，未闻及血管杂音', '肠鸣音活跃', '肠鸣音减弱', '肠鸣音消失', '可闻及血管杂音']
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
        },
        {
          // 胆囊触诊与 Murphy 征。教材腹部触诊原文：「医师以拇指指腹勾压于右肋下
          // 胆囊点为胆囊触痛点，然后嘱病人缓慢深吸气。在吸气过程中发炎的胆囊下移
          // 时碰到用力按压的拇指，即可引起疼痛，此为胆囊触痛；如因剧烈疼痛而致
          // 吸气中止称墨菲征（Murphy sign）阳性」。
          key: 'gallbladderPalpation', label: '触诊—胆囊（Murphy征）', default: '', parent: 'abdPalpation',
          normal: '胆囊未触及，Murphy征阴性',
          options: ['胆囊未触及，Murphy征阴性', '胆囊触痛阳性', 'Murphy征阳性', '胆囊可触及']
        },
        {
          // 肾脏触诊。教材：「双手触诊法…病人取仰卧位，屈髋屈膝…」正常不可触及。
          key: 'kidneyPalpation', label: '触诊—肾', default: '', parent: 'abdPalpation',
          normal: '双肾未触及，季肋点及肋脊点无压痛',
          options: ['双肾未触及，季肋点及肋脊点无压痛', '右肾下极可触及', '双肾可触及', '季肋点压痛', '肋脊点压痛']
        },
        {
          // 膀胱触诊。教材：「膀胱膨胀时可在下腹部触到圆形或椭圆形肿物…」
          key: 'bladderPalpation', label: '触诊—膀胱', default: '', parent: 'abdPalpation',
          normal: '膀胱未触及，耻骨上区无压痛',
          options: ['膀胱未触及，耻骨上区无压痛', '膀胱充盈可触及', '耻骨上区压痛']
        },
        {
          // 液波震颤。教材：「需 3000ml 以上液量才能查出，不如移动性浊音敏感，
          // 肥胖者可出现假阳性」。放在触诊块内，紧接在腹部触诊细分之后。
          key: 'fluidThrill', label: '触诊—液波震颤', default: '', parent: 'abdPalpation',
          normal: '液波震颤阴性',
          options: ['液波震颤阴性', '液波震颤阳性']
        },
        {
          // 振水音。教材：「餐后 6～8 小时以上仍有此音，提示幽门梗阻或胃扩张，
          // 是幽门梗阻的特征性体征」。属听诊内容，父项挂 abdAuscultation。
          key: 'succussionSplash', label: '听诊—振水音', default: '', parent: 'abdAuscultation',
          normal: '振水音阴性',
          options: ['振水音阴性', '振水音阳性']
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
          options: ['三凹征阴性，语音传导正常', '三凹征阳性', '语音传导增强', '语音传导减弱', '可闻及支气管呼吸音'],
          summaryOf: ['respAccessory', 'respVocalResonance'],
        },
        {
          key: 'respShape', label: '胸廓外形与呼吸运动',
          default: '呼吸运动两侧对称，呼吸平稳，未见桶状胸',
          options: ['呼吸运动两侧对称，呼吸平稳，未见桶状胸', '桶状胸', '肋间隙增宽', '肋间隙变窄', '一侧呼吸运动减弱', '胸廓不对称']
        },
        {
          key: 'respAccessory', label: '辅助呼吸肌与三凹征',
          default: '未见辅助呼吸肌参与呼吸运动，三凹征阴性',
          options: ['未见辅助呼吸肌参与呼吸运动，三凹征阴性', '可见辅助呼吸肌参与呼吸运动', '吸气性三凹征', '端坐呼吸']
        },
        {
          key: 'respVocalFremitus', label: '语音震颤',
          default: '双侧语音震颤对称，无明显增强或减弱',
          options: ['双侧语音震颤对称，无明显增强或减弱', '患侧语音震颤增强', '患侧语音震颤减弱', '双侧语音震颤减弱']
        },
        {
          key: 'respPercussion', label: '叩诊音与肺下界',
          default: '双肺叩诊清音，肺下界位置正常',
          options: ['双肺叩诊清音，肺下界位置正常', '局部叩诊浊音', '局部叩诊实音', '局部叩诊过清音', '肺下界下移', '肺下界上移']
        },
        {
          key: 'respChestExpansion', label: '肺下界移动度',
          default: '肺下界移动度正常，两侧对称',
          options: ['肺下界移动度正常，两侧对称', '肺下界移动度减小', '一侧肺下界移动度消失']
        },
        {
          key: 'respBreathSound', label: '呼吸音',
          default: '双肺呼吸音清晰，未闻及异常呼吸音',
          options: ['双肺呼吸音清晰，未闻及异常呼吸音', '双肺呼吸音减弱', '可闻及支气管呼吸音', '可闻及湿啰音', '可闻及干啰音']
        },
        {
          key: 'respVocalResonance', label: '语音共振',
          default: '双侧语音共振对称，无增强或减弱',
          options: ['双侧语音共振对称，无增强或减弱', '患侧语音共振增强', '患侧语音共振减弱']
        },
        {
          key: 'respPleuralRub', label: '胸膜摩擦音',
          default: '未闻及胸膜摩擦音',
          options: ['未闻及胸膜摩擦音', '可闻及胸膜摩擦音']
        },
        {
          key: 'respCyanosis', label: '发绀与杵状指',
          default: '无杵状指，无球结膜水肿',
          options: ['无杵状指，无球结膜水肿', '口唇发绀', '杵状指', '球结膜水肿']
        }
      ]
    },
    cardiology: {
      name: '心血管内科专科查体',
      items: [
        {
          key: 'cardioExtra', label: '心血管专科', default: '未闻及额外心音，毛细血管搏动征阴性，水冲脉阴性',
          options: ['未闻及额外心音，毛细血管搏动征阴性，水冲脉阴性', '可闻及奔马律', '毛细血管搏动征阳性', '水冲脉阳性', '交替脉', '奇脉', '周围血管搏动征阳性'],
          summaryOf: ['cardioHeartSound', 'cardioPeripheralSign'],
        },
        {
          key: 'cardioApex', label: '心前区视诊与心尖搏动',
          default: '心尖搏动位置正常，搏动范围无明显扩大',
          options: ['心尖搏动位置正常，搏动范围无明显扩大', '心尖搏动向左下移位', '心尖搏动弥散', '心前区隆起', '心尖搏动消失']
        },
        {
          key: 'cardioThrill', label: '心前区触诊与震颤',
          default: '心尖搏动无抬举感，未触及震颤及心包摩擦感',
          options: ['心尖搏动无抬举感，未触及震颤及心包摩擦感', '可触及收缩期震颤', '可触及舒张期震颤', '心尖搏动呈抬举样', '可触及心包摩擦感']
        },
        {
          key: 'cardioBorder', label: '心脏叩诊与心界',
          default: '心浊音界各径线在正常范围',
          options: ['心浊音界各径线在正常范围', '心界向左下扩大', '心界向两侧扩大', '心界向左侧扩大', '心界缩小']
        },
        {
          key: 'cardioRate', label: '心率与心律',
          default: '心率正常，心律齐',
          options: ['心率正常，心律齐', '心动过速', '心动过缓', '心律不齐，心房颤动', '早搏']
        },
        {
          key: 'cardioHeartSound', label: '心音与额外心音',
          default: '第一心音正常，P2与A2强度相等，未闻及额外心音及奔马律',
          options: ['第一心音正常，P2与A2强度相等，未闻及额外心音及奔马律', '第一心音减弱', 'P2亢进', 'P2减弱', '可闻及第三心音', '可闻及奔马律']
        },
        {
          key: 'cardioMurmur', label: '心脏杂音',
          default: '各瓣膜听诊区未闻及病理性杂音',
          options: ['各瓣膜听诊区未闻及病理性杂音', '二尖瓣区可闻及2/6级收缩期杂音', '二尖瓣区可闻及3/6级收缩期杂音', '主动脉瓣区可闻及舒张期杂音', '全收缩期杂音伴传导']
        },
        {
          key: 'cardioPericardium', label: '心包摩擦音',
          default: '未闻及心包摩擦音',
          options: ['未闻及心包摩擦音', '可闻及心包摩擦音']
        },
        {
          key: 'cardioJVP', label: '颈静脉与肝颈静脉回流征',
          default: '肝颈静脉回流征阴性',
          options: ['肝颈静脉回流征阴性', '颈静脉充盈', '颈静脉怒张', '肝颈静脉回流征阳性']
        },
        {
          key: 'cardioPeripheralSign', label: '周围血管征',
          default: '水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性',
          options: ['水冲脉、枪击音、毛细血管搏动征、交替脉、奇脉均阴性', '水冲脉阳性', '枪击音阳性', '毛细血管搏动征阳性', '交替脉', '奇脉']
        },
        {
          key: 'cardioEdema', label: '下肢水肿',
          default: '双下肢无水肿',
          options: ['双下肢无水肿', '双下肢凹陷性水肿', '双下肢非凹陷性水肿', '单侧下肢水肿']
        }
      ]
    },
    digestive: {
      name: '消化内科专科查体',
      items: [
        {
          key: 'giExtra', label: '消化专科', default: '肝颈静脉回流征阴性',
          // 只留「肝颈静脉回流征」——这一句没有别的项会写。
          // Murphy 征归下面的胆囊触诊，两边都写会在一段话里出现两遍。
          // 肝掌与蜘蛛痣是肝硬化最有价值的体表体征，通用查体的「皮疹」项写不了这两样，
          // 只能放在这里，否则学生遇到这类病人只能手打，选项里看不见就容易被漏掉。
          options: ['肝颈静脉回流征阴性', '肝颈静脉回流征阳性', 'Murphy征阳性', '麦氏点压痛', '液波震颤阳性', '振水音阳性']
        },
        {
          key: 'giAbdShape', label: '腹部视诊',
          default: '腹部平坦，未见胃肠型及蠕动波，未见腹壁静脉曲张',
          options: ['腹部平坦，未见胃肠型及蠕动波，未见腹壁静脉曲张', '腹部膨隆', '呈蛙状腹', '可见胃肠型及蠕动波', '腹壁静脉曲张，血流方向自下而上', '可见手术瘢痕']
        },
        {
          key: 'giTenderness', label: '压痛点',
          default: '麦氏点、胆囊点、上输尿管点及中输尿管点均无压痛',
          options: ['麦氏点、胆囊点、上输尿管点及中输尿管点均无压痛', '麦氏点压痛', '右上腹压痛，胆囊点压痛', '上腹部压痛', '脐周压痛', '全腹压痛']
        },
        {
          key: 'giRebound', label: '反跳痛与腹肌紧张',
          default: '全腹无反跳痛，腹肌柔软',
          options: ['全腹无反跳痛，腹肌柔软', '右下腹反跳痛', '全腹反跳痛伴腹肌紧张', '局部腹肌紧张', '板状腹']
        },
        {
          key: 'giLiverPalp', label: '肝脏触诊',
          default: '肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛',
          options: ['肝肋下未触及，剑突下未触及，肝区无压痛及叩击痛', '肝肋下可触及，质软，边缘钝', '肝肋下可触及，质韧，边缘结节状', '肝区压痛', '肝区叩击痛', '肝浊音界缩小']
        },
        {
          key: 'giSpleenPalp', label: '脾脏触诊',
          default: '脾脏未触及，脾区无摩擦感',
          options: ['脾脏未触及，脾区无摩擦感', '脾肋下可触及，质软', '脾肋下可触及，质硬', '脾区摩擦感', '脾浊音区扩大']
        },
        {
          key: 'giGallbladderPalp', label: '胆囊触诊与Murphy征',
          default: '胆囊未触及，Murphy征阴性，无胆囊触痛',
          options: ['胆囊未触及，Murphy征阴性，无胆囊触痛', '胆囊触痛阳性', 'Murphy征阳性', '可触及肿大胆囊，无压痛', '库瓦西耶征阳性']
        },
        {
          key: 'giFluidThrill', label: '液波震颤',
          default: '液波震颤阴性',
          options: ['液波震颤阴性', '液波震颤阳性']
        },
        {
          key: 'giShiftingDullness', label: '移动性浊音',
          default: '移动性浊音阴性',
          options: ['移动性浊音阴性', '移动性浊音阳性', '移动性浊音可疑']
        },
        {
          key: 'giBowelSound', label: '肠鸣音与振水音',
          default: '未闻及振水音及血管杂音',
          options: ['未闻及振水音及血管杂音', '肠鸣音活跃', '肠鸣音减弱', '肠鸣音消失', '可闻及金属音', '振水音阳性', '可闻及腹部血管杂音']
        },
        {
          key: 'giRectal', label: '直肠指检',
          default: '直肠指检未触及肿物，指套无染血',
          options: ['直肠指检未触及肿物，指套无染血', '直肠内可触及肿物', '指套染血', '肛门括约肌松弛', '直肠前壁触痛', '未行直肠指检']
        }
      ]
    },
    endocrinology: {
      name: '内分泌科专科查体',
      items: [
        {
          key: 'endoExtra', label: '内分泌专科', default: '皮肤细腻，无明显满月脸、水牛背',
          options: ['皮肤细腻，无明显满月脸、水牛背', '满月脸、水牛背', '皮肤粗糙', '手足增大', '胫前黏液性水肿', '突眼']
        },
        {
          key: 'endoBody', label: '体型与脂肪分布',
          default: '体型匀称，脂肪分布正常，无向心性肥胖',
          options: ['体型匀称，脂肪分布正常，无向心性肥胖', '向心性肥胖', '满月脸', '水牛背', '消瘦', '巨人症体型']
        },
        {
          key: 'endoSkin', label: '皮肤改变',
          default: '皮肤无紫纹、痤疮及色素沉着，毛发分布正常',
          options: ['皮肤无紫纹、痤疮及色素沉着，毛发分布正常', '可见紫纹', '痤疮', '多毛', '色素沉着', '皮肤菲薄', '胫前黏液性水肿']
        },
        {
          key: 'endoThyroid', label: '甲状腺',
          default: '甲状腺不大，质软，未触及结节，未闻及血管杂音',
          options: ['甲状腺不大，质软，未触及结节，未闻及血管杂音', '甲状腺Ⅰ度肿大', '甲状腺Ⅱ度肿大', '甲状腺Ⅲ度肿大', '可触及甲状腺结节', '可闻及甲状腺血管杂音', '可触及甲状腺震颤']
        },
        {
          key: 'endoEye', label: '眼部征象',
          default: '双眼球无突出，眼征阴性',
          options: ['双眼球无突出，眼征阴性', '双眼球突出', '单侧眼球突出', 'Graefe征阳性', 'Stellwag征阳性', '眼睑闭合不全']
        },
        {
          key: 'endoHandFoot', label: '手足改变',
          default: '手足无畸形，指端无增粗',
          options: ['手足无畸形，指端无增粗', '手指增粗呈杵状', '手足增大', '指端粗隆', '掌骨增宽']
        },
        {
          key: 'endoBreast', label: '男性乳房发育',
          default: '男性乳房未发育',
          options: ['男性乳房未发育', '男性乳房发育', '乳房可触及结节']
        },
        {
          key: 'endoPulseBP', label: '脉搏与血压',
          default: '脉搏节律规整，双上肢血压对称',
          options: ['脉搏节律规整，双上肢血压对称', '脉搏增快', '脉搏缓慢', '双上肢血压不对称', '血压升高', '体位性低血压']
        },
        {
          key: 'endoWound', label: '皮肤伤口与溃疡',
          default: '全身皮肤完整，未见溃疡及伤口愈合不良',
          options: ['全身皮肤完整，未见溃疡及伤口愈合不良', '足部溃疡', '伤口愈合不良', '皮肤感染']
        }
      ]
    },
    nephrology: {
      name: '肾脏专科查体',
      items: [
        {
          key: 'renalExtra', label: '肾脏专科', default: '颜面及双下肢无水肿，未见皮下出血点',
          options: ['颜面及双下肢无水肿，未见皮下出血点', '双侧眼睑水肿', '双下肢水肿', '双肾区叩击痛'],
          summaryOf: ['renalFacialEdema', 'renalLegEdema', 'renalSkin'],
        },
        {
          key: 'renalFacialEdema', label: '颜面及眼睑水肿',
          default: '颜面无水肿，双眼睑无水肿',
          options: ['颜面无水肿，双眼睑无水肿', '双眼睑水肿', '颜面水肿', '晨起眼睑水肿']
        },
        {
          key: 'renalLegEdema', label: '下肢水肿',
          default: '双下肢无水肿',
          options: ['双下肢无水肿', '双下肢凹陷性水肿', '双下肢非凹陷性水肿', '单侧下肢水肿', '腰骶部水肿']
        },
        {
          key: 'renalPercussion', label: '肾区叩击痛',
          default: '双肾区无叩击痛',
          options: ['双肾区无叩击痛', '左肾区叩击痛', '右肾区叩击痛', '双肾区叩击痛']
        },
        {
          key: 'renalTenderPoint', label: '季肋点与输尿管点压痛',
          default: '季肋点、上输尿管点、中输尿管点均无压痛',
          options: ['季肋点、上输尿管点、中输尿管点均无压痛', '季肋点压痛', '上输尿管点压痛', '中输尿管点压痛']
        },
        {
          key: 'renalBladder', label: '膀胱充盈',
          default: '膀胱未触及，耻骨上区无压痛',
          options: ['膀胱未触及，耻骨上区无压痛', '膀胱充盈可触及', '耻骨上区压痛']
        },
        {
          key: 'renalSkin', label: '皮肤与贫血貌',
          default: '皮肤黏膜无苍白、出血点及尿素霜',
          options: ['皮肤黏膜无苍白、出血点及尿素霜', '睑结膜苍白', '皮肤可见瘀点瘀斑', '皮肤可见尿素霜', '皮肤瘙痒抓痕']
        },
        {
          key: 'renalCardio', label: '心肺（容量负荷）',
          default: '双肺未闻及湿啰音，未闻及心包摩擦音',
          options: ['双肺未闻及湿啰音，未闻及心包摩擦音', '双肺底可闻及湿啰音', '可闻及心包摩擦音', '颈静脉怒张']
        },
        {
          key: 'renalBP', label: '血压',
          default: '血压正常，双上肢对称',
          options: ['血压正常，双上肢对称', '血压升高', '血压偏低', '双上肢血压不对称']
        }
      ]
    },
    hematology: {
      name: '血液专科查体',
      items: [
        {
          key: 'hemExtra', label: '血液专科', default: '胸骨无压痛，无皮下出血点，牙龈无渗血',
          options: ['胸骨无压痛，无皮下出血点，牙龈无渗血', '胸骨压痛', '浅表淋巴结肿大', '皮下瘀点瘀斑', '牙龈渗血'],
          summaryOf: ['hemSternum', 'hemBleeding', 'hemGum'],
        },
        {
          key: 'hemAnemia', label: '贫血体征',
          default: '睑结膜、口唇及甲床无苍白',
          options: ['睑结膜、口唇及甲床无苍白', '睑结膜苍白', '口唇苍白', '甲床苍白', '面色苍白']
        },
        {
          key: 'hemBleeding', label: '皮肤黏膜出血',
          default: '皮肤黏膜未见瘀点、瘀斑及紫癜',
          options: ['皮肤黏膜未见瘀点、瘀斑及紫癜', '可见瘀点', '可见瘀斑', '可见紫癜', '可见血肿']
        },
        {
          key: 'hemNode', label: '浅表淋巴结',
          default: '全身浅表淋巴结未触及肿大',
          options: ['全身浅表淋巴结未触及肿大', '颈部淋巴结肿大', '腋窝淋巴结肿大', '腹股沟淋巴结肿大', '全身多发淋巴结肿大']
        },
        {
          key: 'hemSternum', label: '胸骨压痛',
          default: '胸骨无压痛',
          options: ['胸骨无压痛', '胸骨中下段压痛', '肋骨压痛']
        },
        {
          key: 'hemHepatospleen', label: '肝脾触诊',
          default: '肝脾肋下未触及',
          options: ['肝脾肋下未触及', '脾肋下可触及', '肝肋下可触及', '巨脾']
        },
        {
          key: 'hemGum', label: '牙龈与口腔黏膜',
          default: '牙龈无增生、渗血',
          options: ['牙龈无增生、渗血', '牙龈增生', '牙龈渗血', '口腔黏膜溃疡', '口腔黏膜血疱']
        },
        {
          key: 'hemJaundice', label: '黄疸',
          default: '皮肤巩膜无黄染',
          options: ['皮肤巩膜无黄染', '皮肤巩膜轻度黄染', '皮肤巩膜明显黄染', '尿色加深']
        },
        {
          key: 'hemBoneTender', label: '骨与关节压痛',
          default: '四肢长骨及关节无压痛',
          options: ['四肢长骨及关节无压痛', '长骨压痛', '关节肿痛', '病理性骨折体征']
        }
      ]
    },
    neurology: {
      name: '神经内科专科查体',
      items: [
        {
          key: 'neuroExtra1', label: '高级神经活动', default: '言语流利，定向力、记忆力、计算力正常',
          options: ['言语流利，定向力、记忆力、计算力正常', '言语不利', '记忆力减退', '计算力减退', '失语']
        },
        {
          key: 'neuroExtra2', label: '颅神经', default: '十二对颅神经检查未见异常',
          options: ['十二对颅神经检查未见异常', '面部感觉减退', '面瘫', '伸舌偏斜', '眼睑下垂']
        },
        {
          key: 'neuroExtra3', label: '运动系统', default: '四肢肌张力正常，肌力正常，未见肌萎缩',
          options: ['四肢肌张力正常，肌力正常，未见肌萎缩', '四肢肌力4级', '偏瘫', '肌张力增高', '肌张力减低', '肌萎缩']
        },
        {
          key: 'neuroExtra4', label: '感觉系统', default: '痛温觉、触觉、深感觉检查未见异常',
          options: ['痛温觉、触觉、深感觉检查未见异常', '偏身感觉减退', '手套袜套样感觉减退', '感觉过敏']
        },
        {
          key: 'neuroExtra5', label: '共济运动', default: '指鼻试验、跟膝胫试验稳准，Romberg征阴性',
          options: ['指鼻试验、跟膝胫试验稳准，Romberg征阴性', '指鼻试验欠稳准', 'Romberg征阳性', '共济失调']
        },
        {
          key: 'neuroSuperficialReflex', label: '浅反射',
          default: '腹壁反射、提睾反射存在且对称',
          options: ['腹壁反射、提睾反射存在且对称', '腹壁反射减弱', '腹壁反射消失', '提睾反射消失']
        },
        {
          key: 'neuroDeepReflex', label: '深反射',
          default: '肱二头肌反射、肱三头肌反射、膝腱反射、跟腱反射正常对称',
          options: ['肱二头肌反射、肱三头肌反射、膝腱反射、跟腱反射正常对称', '深反射减弱', '深反射消失', '深反射亢进', '反射不对称']
        },
        {
          key: 'neuroPathologic', label: '病理反射',
          default: 'Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性',
          options: ['Babinski征、Oppenheim征、Gordon征、Chaddock征、Hoffmann征均阴性', 'Babinski征阳性', 'Hoffmann征阳性', '踝阵挛阳性', '髌阵挛阳性']
        },
        {
          key: 'neuroMeningeal', label: '脑膜刺激征',
          default: '颈项强直阴性，Kernig征阴性，Brudzinski征阴性',
          options: ['颈项强直阴性，Kernig征阴性，Brudzinski征阴性', '颈项强直阳性', 'Kernig征阳性', 'Brudzinski征阳性']
        },
        {
          key: 'neuroGait', label: '步态',
          default: '步态正常，行走平稳',
          options: ['步态正常，行走平稳', '偏瘫步态', '共济失调步态', '慌张步态', '跨阈步态', '剪刀步态']
        },
        {
          key: 'neuroAutonomic', label: '自主神经功能',
          default: '皮肤划痕试验阴性，出汗正常，无体位性低血压',
          options: ['皮肤划痕试验阴性，出汗正常，无体位性低血压', '皮肤划痕试验阳性', '出汗减少', '出汗增多', '体位性低血压']
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
          key: 'pedExtra2', label: '皮肤黏膜', default: '皮肤无黄染、花纹，毛细血管充盈良好',
          options: ['皮肤无黄染、花纹，毛细血管充盈良好', '皮肤黄染', '皮肤花纹', '毛细血管充盈时间延长']
        },
        {
          key: 'pedExtra3', label: '小儿特殊体征', default: '咽无充血，扁桃体无肿大',
          options: ['咽无充血，扁桃体无肿大', '咽充血，扁桃体肿大', '假性脑膜刺激征阳性']
        },
        {
          key: 'pedGrowth', label: '体格生长指标',
          default: '身高、体重、头围在同龄儿正常范围内',
          options: ['身高、体重、头围在同龄儿正常范围内', '体重低于同龄儿', '身高低于同龄儿', '头围异常', '生长迟缓']
        },
        {
          key: 'pedFontanel', label: '前囟与颅缝',
          default: '前囟平坦，大小正常，颅缝无分离',
          options: ['前囟平坦，大小正常，颅缝无分离', '前囟饱满隆起', '前囟凹陷', '前囟已闭', '颅缝分离', '方颅']
        },
        {
          key: 'pedResp', label: '呼吸与三凹征',
          default: '呼吸平稳，无三凹征，无鼻翼扇动',
          options: ['呼吸平稳，无三凹征，无鼻翼扇动', '呼吸急促', '三凹征阳性', '鼻翼扇动', '呼气性呻吟']
        },
        {
          key: 'pedHeart', label: '心率与心音',
          default: '心率在正常范围，心音有力，律齐，未闻及杂音',
          options: ['心率在正常范围，心音有力，律齐，未闻及杂音', '心率增快', '心率减慢', '心音低钝', '可闻及心脏杂音']
        },
        {
          key: 'pedAbdomen', label: '腹部',
          default: '腹部平软，肝脾未超出同龄儿正常范围',
          options: ['腹部平软，肝脾未超出同龄儿正常范围', '腹部膨隆', '肝肋下可触及', '脾肋下可触及', '可触及腹部包块']
        },
        {
          key: 'pedNeuro', label: '神经系统',
          default: '原始反射已消失，脑膜刺激征阴性',
          options: ['原始反射已消失，脑膜刺激征阴性', '原始反射未消失', '生理反射减弱', '脑膜刺激征阳性', '肌张力异常']
        },
        {
          key: 'pedRickets', label: '佝偻病体征',
          default: '未见方颅、肋骨串珠、手镯及足镯征',
          options: ['未见方颅、肋骨串珠、手镯及足镯征', '方颅', '肋骨串珠', '手镯征', '足镯征', '鸡胸', '漏斗胸']
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
        },
        {
          key: 'surgWound', label: '切口与引流',
          default: '切口对合良好，无渗血渗液，引流管通畅',
          options: ['切口对合良好，无渗血渗液，引流管通畅', '切口裂开', '切口渗血', '切口渗液', '引流液浑浊', '引流管堵塞']
        },
        {
          key: 'surgMass', label: '浅表肿块',
          default: '全身未触及异常浅表肿块',
          options: ['全身未触及异常浅表肿块', '可触及皮下肿块，质软，活动度好', '可触及皮下肿块，质硬，活动度差', '肿块伴红肿压痛']
        },
        {
          key: 'surgPeritoneum', label: '腹膜刺激征',
          default: '全腹无压痛、反跳痛及腹肌紧张',
          options: ['全腹无压痛、反跳痛及腹肌紧张', '局部压痛伴反跳痛', '全腹压痛、反跳痛伴板状腹', '肝浊音界消失']
        },
        {
          key: 'surgAbdomenMass', label: '腹部包块',
          default: '腹部未触及包块',
          options: ['腹部未触及包块', '右上腹可触及包块', '右下腹可触及包块', '中腹部可触及包块', '包块随呼吸移动']
        },
        {
          key: 'surgLymph', label: '局部淋巴结',
          default: '引流区域淋巴结未触及肿大',
          options: ['引流区域淋巴结未触及肿大', '引流区域淋巴结肿大伴压痛', '引流区域淋巴结质硬固定']
        },
        {
          key: 'surgTrauma', label: '创伤部位',
          default: '未见皮肤软组织损伤、畸形及异常活动',
          options: ['未见皮肤软组织损伤、畸形及异常活动', '局部肿胀压痛', '皮肤裂伤', '肢体畸形', '反常活动', '骨擦音']
        },
        {
          key: 'surgVessel', label: '患肢血运',
          default: '患肢远端动脉搏动可及，毛细血管充盈良好，皮温正常',
          options: ['患肢远端动脉搏动可及，毛细血管充盈良好，皮温正常', '远端动脉搏动减弱', '远端动脉搏动消失', '毛细血管充盈时间延长', '皮温降低', '肢体肿胀']
        },
        {
          key: 'surgJoint', label: '关节活动度',
          default: '各关节活动度正常，无红肿及压痛',
          options: ['各关节活动度正常，无红肿及压痛', '关节活动受限', '关节红肿', '关节压痛', '关节畸形']
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
          key: 'obsExtra2', label: '胎心', default: '胎心音可闻及，律齐',
          options: ['胎心音可闻及，律齐', '胎心音偏快', '胎心音偏慢', '未闻及胎心']
        },
        {
          key: 'obsLeopold', label: '四步触诊法',
          default: '宫底为胎臀，胎背位于左侧，先露为头，未入盆',
          options: ['宫底为胎臀，胎背位于左侧，先露为头，未入盆', '宫底为胎头', '先露已入盆', '胎位不清', '跨耻征阳性']
        },
        {
          key: 'obsContraction', label: '子宫收缩',
          default: '无规律宫缩，子宫无压痛',
          options: ['无规律宫缩，子宫无压痛', '有不规律宫缩', '规律宫缩', '宫缩过强', '子宫压痛', '板状腹']
        },
        {
          key: 'obsCervix', label: '宫颈（Bishop评分）',
          default: '宫颈未消，宫口未开，质地中等，位置居中',
          options: ['宫颈未消，宫口未开，质地中等，位置居中', '宫颈部分消退', '宫颈完全消退', '宫口开大2cm', '宫口开全', '宫颈质硬']
        },
        {
          key: 'obsPelvis', label: '骨盆测量',
          default: '骨盆外测量各径线在正常范围',
          options: ['骨盆外测量各径线在正常范围', '骶耻外径偏小', '坐骨结节间径偏小', '骨盆出口狭窄', '均小骨盆']
        },
        {
          key: 'obsEdema', label: '水肿与体重',
          default: '双下肢无水肿，体重增长在正常范围',
          options: ['双下肢无水肿，体重增长在正常范围', '双下肢凹陷性水肿', '全身水肿', '体重增长过快', '体重增长不足']
        },
        {
          key: 'obsBP', label: '血压与尿蛋白',
          default: '血压正常，尿蛋白阴性',
          options: ['血压正常，尿蛋白阴性', '血压升高', '尿蛋白阳性', '尿蛋白强阳性', '血压升高伴尿蛋白阳性']
        },
        {
          key: 'obsBreast', label: '乳房与乳头',
          default: '双侧乳房对称，乳头无凹陷，无红肿及结节',
          options: ['双侧乳房对称，乳头无凹陷，无红肿及结节', '乳头凹陷', '乳房红肿', '可触及乳房结节', '乳汁分泌']
        },
        {
          key: 'obsFetalMovement', label: '胎动与胎心监护',
          default: '胎动正常，胎心监护反应型',
          options: ['胎动正常，胎心监护反应型', '胎动减少', '胎动频繁', '胎心监护无反应型', '胎心监护见减速']
        }
      ]
    },
    gynecology: {
      name: '妇科专科查体',
      items: [
        {
          key: 'gynExtra1', label: '外阴及阴道', default: '外阴发育正常；阴道通畅，分泌物不多',
          options: ['外阴发育正常；阴道通畅，分泌物不多', '阴道分泌物增多', '阴道可见异常分泌物', '宫颈糜烂样改变'],
          summaryOf: ['gynVulva', 'gynVagina'],
        },
        {
          key: 'gynExtra2', label: '双合诊（直肠-腹部）', default: '子宫前倾前屈，正常大小，无压痛，双附件未触及包块',
          options: ['子宫前倾前屈，正常大小，无压痛，双附件未触及包块', '子宫压痛', '附件区可触及包块', '附件区压痛'],
          summaryOf: ['gynUterus', 'gynAdnexa'],
        },
        {
          key: 'gynVulva', label: '外阴',
          default: '外阴发育正常，未见赘生物、溃疡及色素减退',
          options: ['外阴发育正常，未见赘生物、溃疡及色素减退', '外阴赘生物', '外阴溃疡', '外阴色素减退', '外阴静脉曲张', '处女膜完整']
        },
        {
          key: 'gynVagina', label: '阴道',
          default: '阴道通畅，黏膜光滑，分泌物量少、色白、无异味',
          options: ['阴道通畅，黏膜光滑，分泌物量少、色白、无异味', '阴道分泌物增多伴异味', '阴道分泌物呈豆腐渣样', '阴道分泌物呈泡沫状', '阴道壁充血', '阴道狭窄']
        },
        {
          key: 'gynCervix', label: '宫颈',
          default: '宫颈光滑，大小正常，无举痛，无接触性出血',
          options: ['宫颈光滑，大小正常，无举痛，无接触性出血', '宫颈糜烂样改变', '宫颈息肉', '宫颈举痛', '接触性出血', '宫颈质硬']
        },
        {
          key: 'gynUterus', label: '子宫',
          default: '子宫前倾前屈，正常大小，质中，活动度好，无压痛',
          options: ['子宫前倾前屈，正常大小，质中，活动度好，无压痛', '子宫增大', '子宫压痛', '子宫活动度差', '子宫后倾后屈', '子宫质硬']
        },
        {
          key: 'gynAdnexa', label: '双附件',
          default: '双附件区未触及包块，无压痛',
          options: ['双附件区未触及包块，无压痛', '左附件区可触及包块', '右附件区可触及包块', '双附件区压痛', '附件区增厚']
        },
        {
          key: 'gynTriple', label: '三合诊',
          default: '三合诊未触及异常，直肠黏膜光滑',
          options: ['三合诊未触及异常，直肠黏膜光滑', '宫骶韧带增厚结节', '直肠窝可触及结节', '直肠黏膜不平']
        },
        {
          key: 'gynBreast', label: '乳房检查',
          default: '双侧乳房对称，未触及肿块，乳头无溢液',
          options: ['双侧乳房对称，未触及肿块，乳头无溢液', '乳房可触及肿块', '乳头溢液', '乳房皮肤橘皮样改变', '腋窝淋巴结肿大']
        },
        {
          key: 'gynAbdomen', label: '腹部检查',
          default: '腹平软，未触及包块，移动性浊音阴性',
          options: ['腹平软，未触及包块，移动性浊音阴性', '下腹部可触及包块', '下腹部压痛', '移动性浊音阳性', '腹部膨隆']
        }
      ]
    },
    emergency: {
      name: '急诊/重症专科查体',
      items: [
        {
          key: 'emExtra1', label: '病情评估', default: '生命体征平稳，格拉斯哥昏迷评分正常',
          options: ['生命体征平稳，格拉斯哥昏迷评分正常', 'GCS评分下降', '休克表现', '意识障碍']
        },
        {
          key: 'emExtra2', label: '创伤评估', default: '全身未见明显创伤',
          options: ['全身未见明显创伤', '皮肤软组织损伤', '骨折表现', '腹部闭合性损伤']
        },
        {
          key: 'emConscious', label: '意识与瞳孔',
          default: '神志清楚，双侧瞳孔等大等圆，对光反射灵敏',
          options: ['神志清楚，双侧瞳孔等大等圆，对光反射灵敏', '嗜睡', '昏睡', '昏迷', '双侧瞳孔不等大', '瞳孔对光反射迟钝', '瞳孔散大固定']
        },
        {
          key: 'emAirway', label: '气道与呼吸',
          default: '气道通畅，呼吸平稳，双肺呼吸音对称',
          options: ['气道通畅，呼吸平稳，双肺呼吸音对称', '气道不畅', '呼吸困难', '一侧呼吸音减弱', '三凹征阳性']
        },
        {
          key: 'emCirculation', label: '循环与灌注',
          default: '脉搏有力，毛细血管充盈良好，四肢温暖',
          options: ['脉搏有力，毛细血管充盈良好，四肢温暖', '脉搏细速', '毛细血管充盈时间延长', '四肢湿冷', '皮肤花斑', '血压测不出']
        },
        {
          key: 'emShock', label: '休克指数与末梢',
          default: '休克指数<0.5，末梢循环良好',
          options: ['休克指数<0.5，末梢循环良好', '休克指数0.5～1.0', '休克指数>1.0', '末梢发绀']
        },
        {
          key: 'emTraumaABC', label: '创伤初级评估（ABCDE）',
          default: '按ABCDE顺序评估，各环节未见致命性损伤',
          options: ['按ABCDE顺序评估，各环节未见致命性损伤', '气道梗阻', '张力性气胸', '开放性气胸', '活动性出血', '连枷胸']
        },
        {
          key: 'emTraumaSurvey', label: '全身系统筛查',
          default: '头、颈、胸、腹、脊柱、骨盆及四肢系统筛查未见异常',
          options: ['头、颈、胸、腹、脊柱、骨盆及四肢系统筛查未见异常', '头部血肿', '颈部压痛', '胸部压痛', '腹部压痛', '骨盆挤压痛', '脊柱压痛']
        },
        {
          key: 'emSkin', label: '皮肤与出血',
          default: '皮肤完整，未见出血点及伤口',
          options: ['皮肤完整，未见出血点及伤口', '皮肤湿冷', '皮肤出血点', '皮肤裂伤', '皮下血肿', '烧伤创面']
        },
        {
          key: 'emAbdomen', label: '腹部（急腹症）',
          default: '腹部平软，无压痛及反跳痛，肠鸣音正常',
          options: ['腹部平软，无压痛及反跳痛，肠鸣音正常', '腹部压痛', '腹膜刺激征阳性', '肠鸣音消失', '腹围增大']
        }
      ]
    },
    psychiatry: {
      // 精神科的「查体」就是精神状况检查（mental status examination, MSE），
      // 不是触诊叩诊，所以这十项按 MSE 的通行维度排：外表与接触 → 意识定向 →
      // 言语 → 思维形式 → 思维内容 → 感知觉 → 情感 → 认知 → 自知力 → 意志行为。
      //
      // 《诊断学》第 10 版没有精神检查章节（它只在全身体格检查里提了一句
      // 「初步的精神状态检查」），所以这里不逐字抄教材，按精神病学的常规写法定。
      // 每一档都写成「正常 / 轻 / 中 / 重」可选的整句，学生点一下就能改，
      // 也方便他按自己病人的实际程度换一个更贴切的。
      name: '精神状况检查',
      items: [
        {
          key: 'psyAppearance', label: '仪表与接触',
          default: '衣着整洁，接触主动，合作',
          options: ['衣着整洁，接触主动，合作', '衣着不整，接触被动', '接触被动，问话少答', '接触违拗，拒绝检查', '仪表邋遢，蓬头垢面']
        },
        {
          key: 'psyOrientation', label: '意识与定向力',
          default: '定向力完整，意识清晰',
          options: ['定向力完整，意识清晰', '定向力不完整', '意识模糊', '谵妄状态']
        },
        {
          key: 'psySpeech', label: '言语',
          default: '语速适中，语音清晰，对答切题',
          options: ['语速适中，语音清晰，对答切题', '语速增快，言语增多', '语速缓慢，语音低微', '言语零乱，答不切题', '缄默不语']
        },
        {
          key: 'psyThoughtForm', label: '思维形式',
          default: '思维连贯，逻辑正常',
          options: ['思维连贯，逻辑正常', '思维散漫', '思维破裂', '思维贫乏', '思维奔逸', '思维中断']
        },
        {
          key: 'psyThoughtContent', label: '思维内容',
          default: '未引出妄想',
          options: ['未引出妄想', '有关系妄想', '被害妄想', '夸大妄想', '嫉妒妄想', '自罪妄想', '强迫观念']
        },
        {
          key: 'psyPerception', label: '感知觉',
          default: '未引出幻觉',
          options: ['未引出幻觉', '幻听', '幻视', '幻嗅', '错觉', '内脏幻觉']
        },
        {
          key: 'psyMood', label: '情感',
          default: '情感反应协调，情绪平稳',
          options: ['情感反应协调，情绪平稳', '情感低落', '情感高涨', '情感淡漠', '情感倒错', '焦虑紧张', '情感不稳，易激惹']
        },
        {
          key: 'psyCognition', label: '认知功能',
          default: '记忆、计算与理解力尚可',
          options: ['记忆、计算与理解力尚可', '近事记忆力减退', '远近记忆均减退', '计算力下降', '智能减退']
        },
        {
          key: 'psyInsight', label: '自知力',
          default: '自知力完整，承认有病并愿意接受治疗',
          options: ['自知力完整，承认有病并愿意接受治疗', '自知力部分存在', '自知力缺失，否认有病']
        },
        {
          key: 'psyBehavior', label: '意志与行为',
          default: '意志活动正常，未见怪异行为',
          options: ['意志活动正常，未见怪异行为', '意志减退，生活懒散', '意志增强，活动增多', '冲动毁物行为', '自伤自杀行为', '木僵状态']
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
    { key: 'emergency', name: '急诊/ICU', group: '急诊', special: ['emergency'] },
    { key: 'psychiatry', name: '精神科', group: '精神', special: ['psychiatry'] }
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
        // 民族 / 病史可靠程度原来是 '汉族' / '可靠'。它们会让空记录直接写出
        // 「民族：汉族」「病史可靠程度：可靠」——两个学生根本没问过的结论。
        // 病历必须「避免任何臆断或虚构」，所以默认值清空，由 buildBasicInfo 写「／」。
        nationality: '',
        occupation: '',
        workUnit: '',
        // 通讯地址
        address: '',
        phone: '',
        // 病历号/住院号（评分表第2页「询问患者…病历号…」1分；第6页一般项目 2分）
        recordNo: '',
        // 床号：《诊断学》第10版「每张记录用纸均须完整填写眉栏（病人姓名、住院号、
        // 科别、床号）及页码，以避免与其他病人混淆」。此前 schema 里根本没有这一栏，
        // 用户选了科室、住了几床，病历正文里完全不体现，属于静默丢信息。
        bedNo: '',
        admitDate: '',
        recordDate: todayStr(),
        reliability: '',
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
        // 平素健康状况：原来默认 '良好'，于是空记录会生成「既往健康状况：平素良好」。
        // 《诊断学》第10版：病历必须客观真实地反映病情，「避免任何臆断或虚构」——
        // 学生没问过「平时身体怎么样」，工具就不能替他写「良好」。改成空串，
        // 由 buildPMH 在用户没填时输出「／」占位。
        health: '',
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
        smoking: '',             // 无 / 有 / 已戒（原默认 '无'，会让空记录凭空生成「吸烟史：无」）
        smokingAmount: '',
        drinking: '',            // 原默认 '无'，同上
        drinkingAmount: '',
        drugs: '',
        environment: '',
        habits: '',
        // 冶游史：《诊断学》第10版 个人史「……职业与工作条件及有无工业毒物、粉尘、
        // 放射性物质接触史，有无冶游史」。此前 schema 与界面都没有这一栏，属于
        // 教材点名要求、工具却采集不到的缺项（grep「冶游」全项目零命中）。
        sexualHistory: '',
        // 职业与工作条件：教材同一句里点名，和 basic.occupation（职业名称）不是一回事
        // ——这里记的是工作环境、是否接触毒物粉尘放射线。
        occupationEnv: '',
        // 病前性格与应激事件：精神科病历的必写项。教材《诊断学》的个人史里
        // 没有这两栏（它面向综合医院），但精神科查房第一句就问"病前性格怎么样、
        // 这次发病前有没有遇到什么事"。留在这里而不是单开一步，是为了不打断
        // 那 11 个步骤的节奏——不用精神科的人留空即可，空着不输出。
        premorbidPersonality: '',
        stressEvent: ''
      },
      // 婚姻史
      marriage: {
        // 留空表示「跟一般项目一致」；填了才覆盖，避免两处默认值打架
        status: '',
        age: '',
        spouseHealth: '',
        // 教材《诊断学》第10版 第六篇·病历书写：
        //   「婚姻史包括婚姻状况，结婚年龄，配偶健康状况、性生活情况、夫妻关系等。」
        // 这两项是教材点名要写的，但过去 schema 里没有。
        sexLife: '',
        relation: ''
      },
      // 月经史
      menstruation: {
        applicable: '',          // '有' / '无' / ''
        age: '',
        cycle: '',
        duration: '',
        quantity: '',
        // 《诊断学》第10版 月经史「并记录月经量、颜色，有无血块、痛经、白带等情况」。
        // quantity 原先已有，color/clot/leukorrhea 三项此前缺失，采集不到也写不出。
        color: '',
        clot: '',
        leukorrhea: '',
        lmp: '',
        menopauseAge: '',
        // 原默认 '无'，导致空记录输出「无痛经。」——又是凭空虚构（见缺陷1）。
        dysmenorrhea: ''
      },
      // 生育史
      childbirth: {
        applicable: '',
        // 教材要求的四项式：「足月分娩数-早产数-流产或人流数-存活数」
        fullTerm: '',
        premature: '',
        abortion: '',
        alive: '',
        // 旧字段：孕次/产次。保留是为了不破坏已存的病历，
        // 生成时四项式齐全就以四项式为准，否则回退到「孕X产Y」。
        gravida: '',
        para: '',
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
        similarDisease: '',
        // 教材：「家族中有无结核、肝炎、性病等传染性疾病」，
        // 与「遗传性疾病」是两个独立问题，不能合并成一句。
        infectionHistory: ''
      },
      // 体格检查
      pe: {
        // 勾选制：本次实际检查了哪些项。{ [组键]: { [项键]: bool } }
        // ⚠️ 语义（本轮修改）：没勾 = 本次没查 = 病历里一个字都不写。
        // 不再「缺省时通用查体视为已勾」——那样等于工具替学生认定「查过且正常」，
        // 属于虚构。旧存档里已经写过字的项仍自动视为已勾（peChecked 第②级）。
        checked: {},
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
        // 每项：{ name 项目名, result 结果, date 检查日期, hospital 检查机构, no 检查号 }
        // 《诊断学》第10版 辅助检查「应分类按检查时间顺序记录检查结果，如系在其他
        // 医疗机构所做检查，应当写明该机构名称及检查号」——原先只有 name/result
        // 两个字段，外院名称和检查号无处可填。
        items: [ { name: '', result: '', date: '', hospital: '', no: '' } ]
      },
      // 病历摘要
      summary: '',
      // 初步诊断
      diagnosis: {
        confirmed: [],     // 已确认诊断（字符串数组，顺序即主次）
        newLine: '',
        // 医师签名。《诊断学》第10版 第六篇：「书写入院记录的医师在初步诊断的
        // 右下角签全名」。留空则不输出——不代填、不默认，签谁的名只有本人知道。
        signature: ''
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

  /* ---------------------- 查体项「是否本次检查了」 ---------------------- */

  /**
   * 一个查体项到底做没做——这是「勾选制」的唯一真相。
   *
   * 为什么要这个：教材第十章要求「重点体格检查」按病情取舍，不是每个病人都
   * 从头查到脚。见习时在消化内科只查腹部、在呼吸内科只查肺，都是正常的。
   * 但病历里绝不能把没查的项目写成正常——那等于伪造体征。
   * 所以没勾的项**一个字都不写**，勾了没填的才补正常描述。
   *
   * 判定顺序（缺省值的取舍是刻意设计，不要「统一」成一条）：
   *   1) 用户显式勾过 / 取消过 → 听用户的；
   *   2) 这一项里已经有学生自己写的文字 → 视为查过。旧存档里写过的体征
   *      不能因为改造而凭空消失，这是最深的一条底线；
   *   3) 专科查体 special_* → 不勾；
   *   4) 通用查体里 parent 下的子项 → 不勾（父项已经概括，子项要主动勾）；
   *   5) 其余一律**不勾**。
   *
   * ⚠️ 2026-10 本轮改动：原来还有一级「通用查体里有默认正常描述的 → 默认已勾」。
   * 那一级的作用是让空记录直接长出一整段「发育正常，营养中等……双肺呼吸音清……」
   * 的通用查体——用户一个字没填，病历就宣称「查过且正常」，这是虚构，
   * 也是本项目最严重的缺陷。现按用户决定（「改成默认全不勾，我勾了才算查过」）
   * 整级删除：没勾 = 本次没查 = 病历里不出现该项。
   * 代价是填写工作量上升（详见本轮报告），但宁可空着，也不能编。
   *
   * @param {object} record 整份病历（不是 pe 子树）
   * @param {string} groupKey 组键，专科形如 'special_digestive'
   * @param {string} itemKey 项键
   * @returns {boolean}
   */
  function peChecked(record, groupKey, itemKey) {
    const pe = (record || {}).pe || {};
    const ck = pe.checked || {};
    const g = ck[groupKey];
    const raw = g && typeof g === 'object' ? g[itemKey] : undefined;
    if (raw === true || raw === false) return raw;
    // 学生已经写了字 → 一定是查过的
    const store = pe[groupKey];
    const val = store && typeof store === 'object' ? store[itemKey] : undefined;
    if (val !== undefined && val !== null && String(val).trim() !== '') return true;
    if (String(groupKey).startsWith('special_')) return false;
    const item = findPEItem(groupKey + '.' + itemKey);
    if (!item) return false;
    if (item.parent) return false;              // 父项已经概括，子项要主动勾
    // 原第 5 级 `return String(item.default||'').trim() !== ''`（有默认正常描述就
    // 当已查）本轮删除。现在走到这里的都是「用户没勾、也没写过字」的项，
    // 一定是没查 —— 不许替学生认定正常。
    return false;
  }

  /**
   * 写入勾选状态。直接改 record.pe.checked，返回值是同一个 record（便于链式调用）。
   */
  function setPeChecked(record, groupKey, itemKey, on) {
    if (!record) return record;
    const pe = record.pe || (record.pe = {});
    const checked = pe.checked || (pe.checked = {});
    const g = checked[groupKey] || (checked[groupKey] = {});
    g[itemKey] = !!on;
    return record;
  }

  /**
   * 勾了但没写具体所见时，病历里自动补的那句话。
   *
   * 优先用 normal（「胆囊未触及，Murphy征阴性」这类子项的规范正常描述），
   * 再退回 default。两项都没声明就返回 ''——此时病历里不会出现这一项，
   * 不会出现「查了但什么都没写」的空条目。
   */
  function peNormalText(item) {
    if (!item) return '';
    return String(item.normal || item.default || '').trim();
  }

  return {
    GENDERS, MARITAL, OCCUPATIONS, NATIONALITY, RELIABILITY, DURATION_UNITS,
    ROS, COMMON_PMH, ALLERGENS, ALLERGY_REACTIONS, FAMILY_DISEASES,
    VITALS, PE_COMMON, PE_SPECIAL, DEPARTMENTS,
    emptyRecord, todayStr,
    // 查体项查询辅助
    PE_INDEX, findPEItem, childPEItems, peItemFilled, parentSupersededByChild,
    peValueIsDefault,
    // 勾选制（本次检查了哪些项）
    peChecked, setPeChecked, peNormalText
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHEMA;
}
