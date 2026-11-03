export const STEPS = [
  { key: 'basic', name: '基本情况' },
  { key: 'hpi', name: '现病史' },
  { key: 'pmh', name: '既往史' },
  { key: 'personal', name: '个人史' },
  { key: 'marriage', name: '婚姻与生育史' },
  { key: 'family', name: '家庭史' },
  { key: 'pe', name: '体格检查' },
  { key: 'ros', name: '系统回顾' },
  { key: 'aux', name: '辅助检查' },
  { key: 'summary', name: '摘要与诊断' },
  { key: 'output', name: '生成病历' },
] as const;

export type StepKey = (typeof STEPS)[number]['key'];
export type StepDefinition = (typeof STEPS)[number];

export function stepIndexOf(key: string): number {
  const index = STEPS.findIndex((step) => step.key === key);
  return index >= 0 ? index : 0;
}

export function stepKeyForPath(path: string): StepKey {
  if (path === 'basic' || path.startsWith('basic.')) return 'basic';
  if (path === 'hpi' || path.startsWith('hpi.')) return 'hpi';
  if (path === 'pmh' || path.startsWith('pmh.')) return 'pmh';
  if (path === 'ros' || path.startsWith('ros.')) return 'ros';
  if (path === 'personal' || path.startsWith('personal.')) return 'personal';
  if (
    path.startsWith('marriage.') ||
    path.startsWith('menstruation.') ||
    path.startsWith('childbirth.')
  ) {
    return 'marriage';
  }
  if (path === 'family' || path.startsWith('family.')) return 'family';
  if (path === 'pe' || path.startsWith('pe.') || path.startsWith('focusPE.')) return 'pe';
  if (path === 'auxiliary' || path.startsWith('auxiliary.')) return 'aux';
  if (
    path === 'summary' ||
    path.startsWith('summary.') ||
    path === 'diagnosis' ||
    path.startsWith('diagnosis.') ||
    path === 'soap' ||
    path.startsWith('soap.') ||
    path === 'discharge' ||
    path.startsWith('discharge.')
  ) {
    return 'summary';
  }
  return 'output';
}

export const STEP_DESCRIPTIONS: Readonly<Record<StepKey, string>> = {
  basic: '先确认患者身份、科室与主诉。所有步骤都可随时跳转。',
  hpi: '按时间顺序记录本次疾病的发生、演变和诊疗经过。',
  pmh: '记录既往疾病、用药、过敏、手术、外伤和输血等情况。',
  ros: '三态记录：阳性、明确阴性、未问。未点选的内容不会写入病历。',
  personal: '记录居住、烟酒、职业接触和相关个人史。',
  marriage: '记录婚姻、月经与生育史，按患者实际情况填写。',
  family: '记录家族疾病、传染病和遗传性疾病史。',
  pe: '只有勾选“本次检查”的项目才会写入病历；未查不生成正常结论。',
  aux: '记录本次就诊已有的辅助检查结果，可按检查日期排序。',
  summary: '核对摘要、诊断、首次病程录与出院记录，再生成最终文书。',
  output: '预览、复制或下载三份独立文书。输出完全由领域生成器产生。',
};
