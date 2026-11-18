import type { Department, VitalDefinition } from '../types';

// 一般情况
export const GENDERS: readonly string[] = ['男', '女'];
export const MARITAL: readonly string[] = ['未婚', '已婚', '离异', '丧偶'];
export const OCCUPATIONS: readonly string[] = ['学生', '工人', '农民', '教师', '职员', '个体', '退休', '无业', '其他'];
export const NATIONALITY: string = '汉族';
export const RELIABILITY: readonly string[] = ['可靠', '基本可靠', '供史者代述，部分可靠'];

// 常用病程时间单位
export const DURATION_UNITS: readonly string[] = ['分钟', '小时', '天', '周', '月', '年'];

export const COMMON_PMH: readonly string[] = [
  '高血压', '糖尿病', '冠心病', '心力衰竭', '高脂血症', '脑卒中', '慢性阻塞性肺疾病',
  '哮喘', '肺结核', '病毒性肝炎', '肝硬化', '慢性肾脏病', '痛风', '甲状腺功能亢进',
  '甲状腺功能减退', '类风湿关节炎', '肿瘤', '贫血', '消化性溃疡', '胆囊结石',
  '前列腺增生', '精神疾病', '其他'
];
export const ALLERGENS: readonly string[] = ['青霉素', '头孢类', '磺胺类', '解热镇痛药', '造影剂', '海鲜', '酒精', '其他'];
export const ALLERGY_REACTIONS: readonly string[] = ['皮疹', '瘙痒', '呼吸困难', '过敏性休克', '腹泻', '其他'];

export const FAMILY_DISEASES: readonly string[] = [
  '高血压', '糖尿病', '冠心病', '脑卒中', '恶性肿瘤', '精神病', '肺结核',
  '病毒性肝炎', '血友病', '哮喘', '甲状腺疾病', '痛风', '新生儿黄疸', '遗传性疾病'
];

export const VITALS: readonly VitalDefinition[] = [
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

export const DEPARTMENTS: readonly Department[] = [
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
