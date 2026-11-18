import type { DocumentTemplateMap } from '../types';

/**
 * 文书模板的核对状态。病历模板与教学病例模板是两套数据：前者描述
 * 「文书长什么样」，后者描述「某种疾病通常怎么写」。医院已提供入院记录
 * 结构照片，因此只有入院记录标为已对照；首次病程录、出院记录仍待核对。
 */
export const DOCUMENT_TEMPLATES: DocumentTemplateMap = Object.freeze({
  record: Object.freeze({
    kind: 'record' as const,
    title: '入院记录',
    verified: true,
    verificationStatus: 'verified' as const,
    verificationLabel: '已对照',
    source: Object.freeze({
      kind: 'hospital-template',
      label: '温州市人民医院入院记录模板（完善版结构对照）'
    })
  }),
  firstCourse: Object.freeze({
    kind: 'firstCourse' as const,
    title: '首次病程录',
    verified: false,
    verificationStatus: 'unverified' as const,
    verificationLabel: '待医院模板核对'
  }),
  discharge: Object.freeze({
    kind: 'discharge' as const,
    title: '出院记录',
    verified: false,
    verificationStatus: 'unverified' as const,
    verificationLabel: '待医院模板核对'
  })
});
