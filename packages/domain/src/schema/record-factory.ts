import type { DabingliRecord, DocumentEntryMeta } from '../types';

/** 生成段落的来源元数据：记录「由哪些资料、哪一版生成」 */
export function emptyDocMeta(): DocumentEntryMeta & {
  inputGroups: Record<string, string>;
  generatedTextHash: string;
} {
  return {
    origin: '',
    inputFingerprint: '',
    inputGroups: {},
    generatedTextHash: '',
    textHash: '',
    reviewedFingerprint: '',
    updatedAt: ''
  };
}

export function emptyRecord(): DabingliRecord {
  return {
    schemaVersion: 3,
    // AI 页原始笔记随病历保存；不写入任何展示文书。
    rawNotes: '',
    // 元数据
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 0,
      fieldStates: {},
      conflicts: {},
      migratedFrom: null,
      migrationNotes: [],
      legacyUnmapped: {},
      lastTemplateFill: null
    },
    // 文书级元数据：摘要 / 首次病程录分段 / 出院记录
    documentMeta: {
      summary: emptyDocMeta(),
      firstCourse: {
        s: emptyDocMeta(),
        oPe: emptyDocMeta(),
        oAux: emptyDocMeta(),
        basis: emptyDocMeta()
      },
      discharge: {
        admitCondition: emptyDocMeta(),
        diagnoses: {
          origin: '',
          inputFingerprint: '',
          textHash: '',
          confirmed: false,
          confirmedFingerprint: ''
        }
      }
    },
    // 基本信息
    basic: {
      department: 'general',
      name: '',
      gender: '',
      age: '',
      birthDate: '',
      marital: '',
      nativePlace: '',
      birthPlace: '',
      nationality: '',
      occupation: '',
      workUnit: '',
      address: '',
      phone: '',
      recordNo: '',
      bedNo: '',
      admitDate: '',
      admitTime: '',
      recordDate: '',
      recordTime: '',
      reliability: '',
      informant: '',
      chiefComplaint: '',
      chiefComplaintDuration: '',
      chiefComplaintDurationUnit: '天'
    },
    // 现病史
    hpi: {
      onset: '',
      cause: '',
      symptoms: '',
      aggravating: '',
      relief: '',
      evolution: '',
      accompanying: '',
      negativeDiscriminating: '',
      negativePertinent: '',
      treatment: '',
      generalCondition: '',
      extra: ''
    },
    // 系统回顾
    ros: {},
    // 既往史
    pmh: {
      health: '',
      diseaseChecks: {},
      diseaseOther: '',
      diseaseDetail: '',
      longTermMeds: '',
      infection: '',
      surgery: '',
      trauma: '',
      transfusion: '',
      poisoning: '',
      vaccine: '',
      allergy: '',
      allergenChecks: {},
      allergenOther: '',
      allergenReactionChecks: {},
      allergyReaction: '',
      relatedHistory: '',
      otherTreatDiseases: '',
      special: ''
    },
    // 个人史
    personal: {
      maternal: '',
      birth: '',
      feeding: '',
      growth: '',
      residence: '',
      travel: '',
      smoking: '',
      smokingAmount: '',
      drinking: '',
      drinkingAmount: '',
      drugs: '',
      environment: '',
      habits: '',
      sexualHistory: '',
      occupationEnv: '',
      premorbidPersonality: '',
      stressEvent: ''
    },
    // 婚姻史
    marriage: {
      status: '',
      age: '',
      spouseHealth: '',
      sexLife: '',
      relation: ''
    },
    // 月经史
    menstruation: {
      applicable: '',
      age: '',
      cycle: '',
      duration: '',
      quantity: '',
      color: '',
      clot: '',
      leukorrhea: '',
      lmp: '',
      menopauseAge: '',
      dysmenorrhea: ''
    },
    // 生育史
    childbirth: {
      applicable: '',
      fullTerm: '',
      premature: '',
      abortion: '',
      alive: '',
      children: '',
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
      threeGeneration: '',
      similarDisease: '',
      infectionHistory: ''
    },
    // 体格检查
    pe: {
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
    // 查体事实状态
    peFactStates: {},
    // 辅助检查
    auxiliary: {
      items: [{ name: '', result: '', date: '', hospital: '', no: '' }]
    },
    // 病历摘要
    summary: '',
    // 初步诊断
    diagnosis: {
      confirmed: [],
      newLine: '',
      signature: ''
    },
    // 首次病程录 SOAP
    soap: {
      recordTime: '',
      s: { summary: '', consistency: '' },
      o: { pe: '', aux: '' },
      a: {
        basis: '',
        basisDetail: [],
        ranking: '',
        diff: [],
        diffNote: ''
      },
      p: {
        principle: '',
        perDiagnosis: [],
        individual: ''
      }
    },
    // 出院记录
    discharge: {
      dischargeDate: '',
      admitCondition: '',
      course: '',
      dischargeStatus: '',
      diagnoses: [],
      diagnosesConfirmed: false,
      advice: {
        drug: '',
        nonDrug: '',
        lifestyle: '',
        followUp: ''
      }
    },
    // 重点查体
    focusPE: {
      keys: [],
      note: ''
    },
    // 诊断参考提示
    suggestions: { accepted: [] }
  };
}

export function todayStr(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
