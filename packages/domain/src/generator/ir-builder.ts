import { fieldState } from '../core';
import { DEPARTMENTS, PE_COMMON, PE_SPECIAL, peFactState, peNormalText } from '../schema';
import type {
  DabingliRecord,
  DocumentBundle,
  DocumentIR,
  DocumentKind,
  DocumentSection,
  DocumentWarning,
  Fact,
  FactPolarity,
  FactSource,
  FactState
} from '../types';
import { createFact, documentFromSections, type DocumentIRWithPrefix } from './document-ir';
import {
  dischargeDocumentParts,
  firstCourseDocumentParts,
  generate
} from './documents';
import { buildChiefComplaint, collectROS } from './sections-basic-history';
import { auxiliaryCategory, buildSummary, diagnosisList } from './sections-pe-aux-diag';
import { PH, SECTION_ORDER, stripTail, vitalSnapshot } from './utils';
import { validateStructured } from './validators';

const IR_FACT_SOURCE: Readonly<Record<string, FactSource>> = {
  manual: 'manual',
  template: 'template',
  legacy: 'legacy',
  generated: 'generated',
  ai: 'unknown'
};

interface FactInputEntry {
  path: string;
  text: unknown;
  polarity?: FactPolarity;
  state?: FactState;
  source?: FactSource;
}

function irFactSource(r: DabingliRecord, path: string, fallback?: FactSource): FactSource {
  const state = fieldState(r, path);
  return (state && IR_FACT_SOURCE[state.source]) || fallback || 'manual';
}

export function irFact(
  r: DabingliRecord,
  path: string,
  text: unknown,
  polarity?: FactPolarity,
  state?: FactState,
  fallbackSource?: FactSource
): Fact | null {
  const value = stripTail(text);
  if (!value) return null;
  const source = irFactSource(r, path, fallbackSource);
  const st = fieldState(r, path);
  return createFact({
    path,
    text: value,
    polarity:
      polarity || (/^(?:无|未见|未出现|未诉|否认|没有|不伴|无明显|未曾|未)/.test(value) ? 'negative' : 'positive'),
    state: state || 'manual_text',
    source,
    reviewed: Boolean(st && st.reviewed),
    evidence: [{ path, text: value, source }]
  });
}

function addFacts(list: Fact[], r: DabingliRecord, entries: readonly (FactInputEntry | null | undefined)[]): Fact[] {
  entries.forEach((entry) => {
    if (!entry) return;
    const fact = irFact(r, entry.path, entry.text, entry.polarity, entry.state, entry.source);
    if (fact) list.push(fact);
  });
  return list;
}

export function hpiFacts(r: DabingliRecord): Fact[] {
  const h = (r.hpi || {}) as unknown as Record<string, unknown>;
  const fields = [
    'onset',
    'cause',
    'symptoms',
    'aggravating',
    'relief',
    'evolution',
    'accompanying',
    'negativeDiscriminating',
    'negativePertinent',
    'treatment',
    'generalCondition',
    'extra'
  ] as const;
  const facts: Fact[] = [];
  fields.forEach((key) => addFacts(facts, r, [{ path: `hpi.${key}`, text: h[key] }]));
  return facts;
}

export function rosFacts(r: DabingliRecord): Fact[] {
  const facts: Fact[] = [];
  collectROS(r).forEach((system) => {
    system.entries.forEach((entry) => {
      if (!entry.text || entry.state === 'not_asked') return;
      const fact = irFact(
        r,
        entry.path,
        entry.text,
        entry.state === 'asked_negative' ? 'negative' : 'positive',
        entry.state
      );
      if (fact) facts.push(fact);
    });
  });
  return facts;
}

export function peFacts(r: DabingliRecord): Fact[] {
  const facts: Fact[] = [];
  const deptKey = (r.basic || {}).department || 'general';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
  const groups = PE_COMMON.map((group) => ({ key: group.key, items: group.items }));
  (dept.special || []).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (sp) groups.push({ key: `special_${spKey}`, items: sp.items });
  });

  groups.forEach((group) => {
    const store = (((r.pe || {}) as unknown as Record<string, unknown>)[group.key] || {}) as Record<string, unknown>;
    group.items.forEach((item) => {
      const state = peFactState(r, group.key, item.key, item);
      if (state === 'not_asked') return;
      const own = stripTail(store[item.key]);
      const normal = stripTail(peNormalText(item));
      const value = own || (state === 'asked_negative' ? normal : '');
      if (!value) return;
      const fact = irFact(
        r,
        `pe.${group.key}.${item.key}`,
        value,
        state === 'asked_negative' ? 'negative' : 'positive',
        state,
        own ? 'manual' : 'generated'
      );
      if (fact) facts.push(fact);
    });
  });

  const vitals = vitalSnapshot(((r.pe || {}).vitals || {}) as Record<string, unknown>);
  const labels: Readonly<Record<string, readonly [string, string]>> = {
    temperature: ['T ', '℃'],
    pulse: ['P ', '次/分'],
    respiration: ['R ', '次/分'],
    sbp: ['BP ', '/mmHg'],
    dbp: ['BP /', 'mmHg'],
    height: ['身高 ', 'cm'],
    weight: ['体重 ', 'kg'],
    headCirc: ['头围 ', 'cm'],
    chestCirc: ['胸围 ', 'cm'],
    abdCirc: ['腹围 ', 'cm']
  };
  Object.keys(vitals).forEach((key) => {
    const pair = labels[key];
    if (!pair) return;
    const text =
      key === 'dbp'
        ? `BP ${vitals.sbp ? vitals.sbp.raw : PH}/${vitals.dbp.raw}mmHg`
        : `${pair[0]}${vitals[key].raw}${pair[1]}`;
    const fact = irFact(r, `pe.vitals.${key}`, text, 'positive', 'manual_text');
    if (fact) facts.push(fact);
  });
  return facts;
}

export function basicFacts(r: DabingliRecord): Fact[] {
  const b = (r.basic || {}) as unknown as Record<string, unknown>;
  const fields = [
    'name',
    'gender',
    'age',
    'birthDate',
    'department',
    'bedNo',
    'recordNo',
    'nationality',
    'nativePlace',
    'birthPlace',
    'marital',
    'occupation',
    'workUnit',
    'address',
    'phone',
    'admitDate',
    'admitTime',
    'recordDate',
    'recordTime',
    'reliability',
    'informant'
  ] as const;
  const facts: Fact[] = [];
  fields.forEach((key) => addFacts(facts, r, [{ path: `basic.${key}`, text: b[key] }]));
  addFacts(facts, r, [
    { path: 'basic.chiefComplaint', text: b.chiefComplaint },
    {
      path: 'basic.chiefComplaintDuration',
      text: stripTail(b.chiefComplaintDuration) ? buildChiefComplaint(r) : ''
    }
  ]);
  return facts;
}

export function pmhFacts(r: DabingliRecord): Fact[] {
  const p = (r.pmh || {}) as unknown as Record<string, unknown>;
  const fields = [
    'health',
    'diseaseDetail',
    'diseaseOther',
    'longTermMeds',
    'infection',
    'surgery',
    'trauma',
    'transfusion',
    'poisoning',
    'vaccine',
    'allergy',
    'allergenOther',
    'allergyReaction',
    'relatedHistory',
    'otherTreatDiseases',
    'special'
  ] as const;
  const facts: Fact[] = [];
  fields.forEach((key) => addFacts(facts, r, [{ path: `pmh.${key}`, text: p[key] }]));
  const diseaseChecks = (p.diseaseChecks || {}) as Record<string, unknown>;
  Object.keys(diseaseChecks).forEach((key) => {
    if (diseaseChecks[key]) addFacts(facts, r, [{ path: `pmh.diseaseChecks.${key}`, text: key }]);
  });
  const allergenChecks = (p.allergenChecks || {}) as Record<string, unknown>;
  Object.keys(allergenChecks).forEach((key) => {
    if (allergenChecks[key]) addFacts(facts, r, [{ path: `pmh.allergenChecks.${key}`, text: key, polarity: 'positive' }]);
  });
  return facts;
}

export function personalFacts(r: DabingliRecord): Fact[] {
  const p = (r.personal || {}) as unknown as Record<string, unknown>;
  const fields = [
    'maternal',
    'birth',
    'feeding',
    'growth',
    'residence',
    'travel',
    'smoking',
    'smokingAmount',
    'drinking',
    'drinkingAmount',
    'drugs',
    'environment',
    'habits',
    'sexualHistory',
    'occupationEnv',
    'premorbidPersonality',
    'stressEvent'
  ] as const;
  const facts: Fact[] = [];
  fields.forEach((key) => addFacts(facts, r, [{ path: `personal.${key}`, text: p[key] }]));
  return facts;
}

export function familyFacts(r: DabingliRecord): Fact[] {
  const f = (r.family || {}) as unknown as Record<string, unknown>;
  const fields = ['other', 'deceased', 'threeGeneration', 'similarDisease', 'infectionHistory'] as const;
  const facts: Fact[] = [];
  fields.forEach((key) => addFacts(facts, r, [{ path: `family.${key}`, text: f[key] }]));
  const diseaseChecks = (f.diseaseChecks || {}) as Record<string, unknown>;
  Object.keys(diseaseChecks).forEach((key) => {
    if (diseaseChecks[key]) addFacts(facts, r, [{ path: `family.diseaseChecks.${key}`, text: key, polarity: 'positive' }]);
  });
  return facts;
}

export function auxiliaryFacts(r: DabingliRecord, category?: 'lab' | 'special'): Fact[] {
  const facts: Fact[] = [];
  ((r.auxiliary || {}).items || []).forEach((item, index) => {
    if (!item || (category && (category === 'lab' ? auxiliaryCategory(item) !== 'lab' : auxiliaryCategory(item) === 'lab'))) {
      return;
    }
    const text = [stripTail(item.name), stripTail(item.result)].filter(Boolean).join('：');
    if (!text) return;
    addFacts(facts, r, [
      { path: `auxiliary.items.${index}.name`, text: item.name },
      { path: `auxiliary.items.${index}.result`, text: item.result, polarity: 'positive' }
    ]);
  });
  return facts;
}

export function recordSectionFacts(r: DabingliRecord, title: string): Fact[] {
  if (title === '一般项目') return basicFacts(r);
  if (title === '主诉') return basicFacts(r).filter((item) => item.path.startsWith('basic.chiefComplaint'));
  if (title === '现病史') return hpiFacts(r);
  if (title === '既往史') return pmhFacts(r);
  if (title === '系统回顾') return rosFacts(r);
  if (title === '个人史') return personalFacts(r);
  if (title === '婚育史') {
    const facts: Fact[] = [];
    const m = r.marriage || {};
    addFacts(facts, r, [
      { path: 'marriage.status', text: m.status },
      { path: 'marriage.age', text: m.age },
      { path: 'marriage.spouseHealth', text: m.spouseHealth },
      { path: 'marriage.sexLife', text: m.sexLife },
      { path: 'marriage.relation', text: m.relation }
    ]);
    const men = (r.menstruation || {}) as unknown as Record<string, unknown>;
    (['applicable', 'age', 'cycle', 'duration', 'quantity', 'color', 'clot', 'leukorrhea', 'lmp', 'menopauseAge', 'dysmenorrhea', 'extra'] as const)
      .forEach((key) => addFacts(facts, r, [{ path: `menstruation.${key}`, text: men[key] }]));
    const cb = (r.childbirth || {}) as unknown as Record<string, unknown>;
    (['applicable', 'fullTerm', 'premature', 'abortion', 'alive', 'gravida', 'para', 'details', 'lastBirth', 'contraception'] as const)
      .forEach((key) => addFacts(facts, r, [{ path: `childbirth.${key}`, text: cb[key] }]));
    return facts;
  }
  if (title === '家族史') return familyFacts(r);
  if (title.startsWith('体格检查')) {
    return peFacts(r).filter((fact) =>
      title === '体格检查（一）' ? !fact.path.startsWith('pe.special_') : fact.path.startsWith('pe.special_')
    );
  }
  if (title === '实验室检查' || title === '特殊检查') {
    return auxiliaryFacts(r, title === '实验室检查' ? 'lab' : 'special');
  }
  if (title === '摘要') {
    const manual = stripTail(r.summary);
    return addFacts([], r, [{ path: 'summary', text: manual || buildSummary(r), source: manual ? 'manual' : 'generated' }]);
  }
  if (title === '诊断依据') {
    const facts: Fact[] = [];
    const a = (r.soap || {}).a || {};
    addFacts(facts, r, [{ path: 'soap.a.basis', text: a.basis }]);
    (Array.isArray(a.basisDetail) ? a.basisDetail : []).forEach((row, index) => {
      (['diagnosis', 'history', 'pe', 'aux'] as const).forEach((key) =>
        addFacts(facts, r, [{ path: `soap.a.basisDetail.${index}.${key}`, text: row && row[key] }])
      );
    });
    return facts;
  }
  if (title === '初步诊断') {
    const facts: Fact[] = [];
    (diagnosisList(r) || []).forEach((name, index) =>
      addFacts(facts, r, [{ path: `diagnosis.confirmed.${index}`, text: name, polarity: 'positive' }])
    );
    if (stripTail((r.diagnosis || {}).signature)) {
      addFacts(facts, r, [{ path: 'diagnosis.signature', text: (r.diagnosis || {}).signature }]);
    }
    return facts;
  }
  return [];
}

export function firstCourseSectionFacts(r: DabingliRecord, title: string): Fact[] {
  const soap = r.soap || {};
  const facts: Fact[] = [];
  if (/病历特点/.test(title)) {
    facts.push(...hpiFacts(r));
  } else if (/客观记录/.test(title)) {
    facts.push(...peFacts(r), ...auxiliaryFacts(r));
  } else if (/诊断依据/.test(title)) {
    addFacts(facts, r, [{ path: 'soap.a.basis', text: (soap.a || {}).basis }]);
    (Array.isArray((soap.a || {}).basisDetail) ? (soap.a || {}).basisDetail! : []).forEach((row, index) => {
      (['diagnosis', 'history', 'pe', 'aux'] as const).forEach((key) =>
        addFacts(facts, r, [{ path: `soap.a.basisDetail.${index}.${key}`, text: row && row[key] }])
      );
    });
  } else if (/鉴别诊断/.test(title)) {
    (Array.isArray((soap.a || {}).diff) ? (soap.a || {}).diff! : []).forEach((row, index) => {
      (['diagnosis', 'why', 'against', 'points'] as const).forEach((key) =>
        addFacts(facts, r, [{ path: `soap.a.diff.${index}.${key}`, text: row && row[key] }])
      );
    });
    addFacts(facts, r, [{ path: 'soap.a.diffNote', text: (soap.a || {}).diffNote }]);
  } else if (/诊疗计划/.test(title)) {
    addFacts(facts, r, [{ path: 'soap.p.principle', text: (soap.p || {}).principle }]);
    (Array.isArray((soap.p || {}).perDiagnosis) ? (soap.p || {}).perDiagnosis! : []).forEach((row, index) => {
      (['diagnosis', 'exam', 'treatment'] as const).forEach((key) =>
        addFacts(facts, r, [{ path: `soap.p.perDiagnosis.${index}.${key}`, text: row && row[key] }])
      );
    });
    addFacts(facts, r, [{ path: 'soap.p.individual', text: (soap.p || {}).individual }]);
  }
  return facts;
}

export function dischargeSectionFacts(r: DabingliRecord, title: string): Fact[] {
  const d = r.discharge || {};
  const advice = d.advice || {};
  if (/一般情况/.test(title)) {
    return basicFacts(r).filter((item) => /basic\.(name|gender|age|recordNo|admitDate)$/.test(item.path));
  }
  if (/入院情况/.test(title)) return addFacts([], r, [{ path: 'discharge.admitCondition', text: d.admitCondition }]);
  if (/诊疗经过/.test(title)) return addFacts([], r, [{ path: 'discharge.course', text: d.course }]);
  if (/出院情况/.test(title)) return addFacts([], r, [{ path: 'discharge.dischargeStatus', text: d.dischargeStatus }]);
  if (/出院诊断/.test(title)) {
    const facts: Fact[] = [];
    (Array.isArray(d.diagnoses) ? d.diagnoses : []).forEach((name, index) =>
      addFacts(facts, r, [{ path: `discharge.diagnoses.${index}`, text: name, polarity: 'positive' }])
    );
    return facts;
  }
  if (/出院医嘱/.test(title)) {
    return addFacts([], r, [
      { path: 'discharge.advice.drug', text: advice.drug },
      { path: 'discharge.advice.nonDrug', text: advice.nonDrug },
      { path: 'discharge.advice.lifestyle', text: advice.lifestyle },
      { path: 'discharge.advice.followUp', text: advice.followUp }
    ]);
  }
  return [];
}

function warningPaths(warning: DocumentWarning): string[] {
  const list = Array.isArray(warning.paths) && warning.paths.length ? warning.paths : [warning.path];
  return list.filter((p): p is string => Boolean(p));
}

function pathMatchesPrefixes(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`));
}

function recordSectionMatchesPath(title: string, path: string): boolean {
  switch (title) {
    case '一般项目':
      return (
        path === 'basic' ||
        (path.startsWith('basic.') && !path.startsWith('basic.chiefComplaint') && path !== 'basic.marital')
      );
    case '主诉':
      return path.startsWith('basic.chiefComplaint');
    case '现病史':
      return pathMatchesPrefixes(path, ['hpi']);
    case '既往史':
      return pathMatchesPrefixes(path, ['pmh']);
    case '个人史':
      return pathMatchesPrefixes(path, ['personal']);
    case '婚育史':
      return path === 'basic.marital' || pathMatchesPrefixes(path, ['marriage', 'menstruation', 'childbirth']);
    case '家族史':
      return pathMatchesPrefixes(path, ['family']);
    case '体格检查（一）':
      return path === 'pe' || (path.startsWith('pe.') && !path.startsWith('pe.special_')) || (path.startsWith('peFactStates.') && !path.startsWith('peFactStates.special_'));
    case '体格检查（二）：补充及专科情况':
      return path.startsWith('pe.special_') || path.startsWith('peFactStates.special_');
    case '实验室检查':
    case '特殊检查':
      return pathMatchesPrefixes(path, ['auxiliary']);
    case '初步诊断':
      return pathMatchesPrefixes(path, ['diagnosis']);
    default:
      return false;
  }
}

function firstCourseSectionMatchesPath(title: string, path: string): boolean {
  if (/病历特点/.test(title)) return pathMatchesPrefixes(path, ['soap.s', 'hpi', 'basic.chiefComplaint']);
  if (/客观记录/.test(title)) return pathMatchesPrefixes(path, ['soap.o', 'pe', 'auxiliary']);
  if (/诊断依据/.test(title)) return pathMatchesPrefixes(path, ['soap.a.basis']);
  if (/鉴别诊断/.test(title)) return pathMatchesPrefixes(path, ['soap.a.diff']);
  if (/诊疗计划/.test(title)) return pathMatchesPrefixes(path, ['soap.p']);
  return false;
}

function dischargeSectionMatchesPath(title: string, path: string): boolean {
  if (/一般情况/.test(title)) return pathMatchesPrefixes(path, ['basic', 'discharge.dischargeDate']);
  if (/入院情况/.test(title)) return pathMatchesPrefixes(path, ['discharge.admitCondition']);
  if (/诊疗经过/.test(title)) return pathMatchesPrefixes(path, ['discharge.course']);
  if (/出院情况/.test(title)) return pathMatchesPrefixes(path, ['discharge.dischargeStatus']);
  if (/出院诊断/.test(title)) return pathMatchesPrefixes(path, ['discharge.diagnoses']);
  if (/出院医嘱/.test(title)) return pathMatchesPrefixes(path, ['discharge.advice']);
  return false;
}

/** 按路径映射表 + 标题前缀筛选章节告警，避免 26 次重复全量校验 */
function filterSectionWarnings(
  docWarnings: readonly DocumentWarning[],
  kind: DocumentKind,
  title: string
): DocumentWarning[] {
  const prefix = `【${title}】`;
  return docWarnings.filter((warning) => {
    if (warning.message.startsWith(prefix)) return true;
    const paths = warningPaths(warning);
    if (kind === 'firstCourse') return paths.some((p) => firstCourseSectionMatchesPath(title, p));
    if (kind === 'discharge') return paths.some((p) => dischargeSectionMatchesPath(title, p));
    return paths.some((p) => recordSectionMatchesPath(title, p));
  });
}

export interface BuildDocumentIROptions {
  date?: string;
  _structuredWarnings?: readonly DocumentWarning[];
}

export function buildDocumentIR(
  r: DabingliRecord,
  kind: DocumentKind = 'record',
  opts: BuildDocumentIROptions = {}
): DocumentIRWithPrefix {
  const allWarnings = Array.isArray(opts._structuredWarnings) ? opts._structuredWarnings : validateStructured(r);
  const warnings = allWarnings.filter((item) => !item.document || item.document === kind);

  if (kind === 'firstCourse' || kind === 'discharge') {
    const parts = kind === 'firstCourse' ? firstCourseDocumentParts(r, opts) : dischargeDocumentParts(r);
    const factFn = kind === 'firstCourse' ? firstCourseSectionFacts : dischargeSectionFacts;
    const sections = parts.sections.map((item) => ({
      title: item.title,
      heading: item.heading,
      paragraphs: item.paragraphs,
      facts: factFn(r, item.title),
      warnings: filterSectionWarnings(warnings, kind, item.title)
    })) as DocumentSection[];
    return documentFromSections(
      kind,
      kind === 'firstCourse' ? '首次病程录' : '出院记录',
      sections,
      warnings,
      parts.prefix
    );
  }

  const generated = generate(r, opts as Record<string, unknown>);
  const sections = SECTION_ORDER.filter((sectionTitle) =>
    Object.prototype.hasOwnProperty.call(generated.sections, sectionTitle)
  ).map((sectionTitle) => {
    const body = generated.sections[sectionTitle] || PH;
    return {
      title: sectionTitle,
      paragraphs: [body],
      facts: recordSectionFacts(r, sectionTitle),
      warnings: filterSectionWarnings(warnings, kind, sectionTitle)
    };
  }) as DocumentSection[];
  return documentFromSections(kind, '入院记录', sections, warnings, '【入院记录】');
}

export function buildDocumentBundle(
  r: DabingliRecord,
  opts: BuildDocumentIROptions = {}
): DocumentBundle & { record: DocumentIR; firstCourse: DocumentIR; discharge: DocumentIR } {
  const structuredWarnings = Array.isArray(opts._structuredWarnings) ? opts._structuredWarnings : validateStructured(r);
  const sharedOpts: BuildDocumentIROptions = { ...opts, _structuredWarnings: structuredWarnings };
  return {
    record: buildDocumentIR(r, 'record', sharedOpts),
    firstCourse: buildDocumentIR(r, 'firstCourse', sharedOpts),
    discharge: buildDocumentIR(r, 'discharge', sharedOpts)
  };
}
