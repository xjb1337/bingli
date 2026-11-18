import type { RosSystem } from '../types';

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
export const ROS: readonly RosSystem[] = [
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
