import { parseAge, parseDate as ageParseDate, resolveAge } from '../age';
import { documentState, getPath, marriageValue } from '../core';
import {
  childPEItems,
  DEPARTMENTS,
  normalizeFactState,
  PE_COMMON,
  PE_SPECIAL,
  peChecked,
  peItemFilled,
  peNormalText,
  peValueIsDefault
} from '../schema';
import { isBareTimeFragment, normalizeNegationScope } from '../shared/text-utils';
import { findUnfilledPlaceholders } from '../templates';
import type { DabingliRecord, DocumentWarning, VitalSnapshotEntry } from '../types';
import { diffRelatedToDiagnosis, draftObjectivePE } from './documents';
import {
  buildChiefComplaint,
  buildHPI,
  hasDurationInText,
  negativeHistoryText
} from './sections-basic-history';
import {
  abnormalPE,
  auxItems,
  buildPE,
  buildSummary,
  peParentChildConflict,
  peValue,
  rawPeFactState,
  type AbnormalPeFinding,
  type NormalizedAuxItem
} from './sections-pe-aux-diag';
import {
  ageWithUnit,
  diagnostic,
  sentenceKey,
  splitSentences,
  squash,
  stripTail,
  VITAL_RANGE,
  vitalSnapshot
} from './utils';

export { diffRelatedToDiagnosis, firstCourseSelfCheck, firstCourseSelfCheckDiagnostics } from './documents';
export { rawPeFactState } from './sections-pe-aux-diag';

interface ValidationContext {
  r: DabingliRecord;
  vitals: () => Record<string, VitalSnapshotEntry>;
  peText: () => string;
  vitalsText: () => string;
  summaryText: () => string;
  objectivePeText: () => string;
  abnormalPe: () => AbnormalPeFinding[];
  aux: () => NormalizedAuxItem[];
}

function createValidationContext(r: DabingliRecord): ValidationContext {
  let vitalsCache: Record<string, VitalSnapshotEntry> | null = null;
  let peTextCache: string | null = null;
  let vitalsTextCache: string | null = null;
  let summaryTextCache: string | null = null;
  let objectivePeTextCache: string | null = null;
  let abnormalPeCache: AbnormalPeFinding[] | null = null;
  let auxCache: NormalizedAuxItem[] | null = null;

  return {
    r,
    vitals: () => (vitalsCache ??= vitalSnapshot(((r.pe || {}).vitals || {}) as Record<string, unknown>)),
    peText: () => (peTextCache ??= buildPE(r)),
    vitalsText: () => {
      if (vitalsTextCache !== null) return vitalsTextCache;
      // Avoid duplicating vital rendering logic; buildVitals reads the same vital snapshot
      const v = ((r.pe || {}).vitals || {}) as Record<string, unknown>;
      const snap = vitalSnapshot(v);
      const safe = (k: string): string => (snap[k] ? snap[k].raw : '／');
      const parts = [
        `T ${safe('temperature')}℃`,
        `P ${safe('pulse')}次/分`,
        `R ${safe('respiration')}次/分`,
        `BP ${safe('sbp')}/${safe('dbp')}mmHg`,
        `身高 ${safe('height')}cm`,
        `体重 ${safe('weight')}kg`
      ];
      if (snap.headCirc) parts.push(`头围 ${snap.headCirc.raw}cm`);
      if (snap.chestCirc) parts.push(`胸围 ${snap.chestCirc.raw}cm`);
      if (snap.abdCirc) parts.push(`腹围 ${snap.abdCirc.raw}cm`);
      vitalsTextCache = `${parts.join('，')}。`;
      return vitalsTextCache;
    },
    summaryText: () => (summaryTextCache ??= buildSummary(r)),
    objectivePeText: () =>
      (objectivePeTextCache ??= stripTail(((r.soap || {}).o || {}).pe) || draftObjectivePE(r)),
    abnormalPe: () => (abnormalPeCache ??= abnormalPE(r)),
    aux: () => (auxCache ??= auxItems(r))
  };
}

const DIAG_WORDS: readonly string[] = [
  '高血压', '糖尿病', '冠心病', '心梗', '心肌梗死', '心绞痛', '心衰', '心力衰竭',
  '房颤', '心房颤动', '心律失常', '瓣膜病',
  '肺炎', '肺结核', '哮喘', '慢阻肺', 'COPD', '支气管炎', '气胸', '肺栓塞',
  '胃炎', '胃溃疡', '十二指肠溃疡', '胆囊炎', '胆结石', '胰腺炎', '阑尾炎',
  '肠梗阻', '肠炎', '肝炎', '肝硬化', '消化道出血',
  '肾炎', '肾病', '肾衰', '肾功能不全', '泌尿系感染', '尿路感染', '肾结石',
  '贫血', '白血病', '淋巴瘤', '血小板减少',
  '脑梗', '脑梗死', '脑出血', '脑卒中', '偏头痛', '癫痫', '帕金森',
  '甲亢', '甲减', '甲状腺功能', '风湿', '类风湿', '痛风', '红斑狼疮',
  '骨折', '脱位', '疝', '痔疮',
  '肿瘤', '癌', '肉瘤',
  '妊娠期高血压', '子痫', '宫外孕', '异位妊娠', '盆腔炎'
];

const PENDING_WORDS: readonly string[] = ['待查', '待诊', '待排', '原因待查', '性质待查'];

/** 初步诊断排序、问号与签名检查（推送纯字符串提醒） */
export function warnDiagnosisOrder(r: DabingliRecord, w: string[]): void {
  warnDiagnosisOrderDiagnostics(r).forEach((item) => w.push(item.message));
}

export function warnDiagnosisOrderDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const d = r.diagnosis || {};
  const list = (d.confirmed || []).map((s) => stripTail(s)).filter(Boolean);
  if (!list.length) return out;

  const bare = list.filter((s) => {
    const hasPending = PENDING_WORDS.some((k) => s.includes(k));
    if (!hasPending) return false;
    return !/[，,]\s*\S+？?\s*$/.test(s) && !s.includes('？');
  });
  if (bare.length) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_PENDING_HINT',
        severity: 'warning',
        document: 'record',
        path: 'diagnosis.confirmed',
        paths: ['diagnosis.confirmed'],
        action: '补待查诊断的候选病名',
        message: `【初步诊断】「${bare.join('」「')}」是待查类诊断，按其书写要求应在其后注明一两个可能性较大或待排除的病名，如"发热待查，肠结核？"。`
      })
    );
  }

  const firstPending = PENDING_WORDS.some((k) => list[0].includes(k));
  const laterSolid = list.slice(1).filter((s) => !PENDING_WORDS.some((k) => s.includes(k)));
  if (firstPending && laterSolid.length) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_ORDER',
        severity: 'warning',
        document: 'record',
        path: 'diagnosis.confirmed',
        paths: ['diagnosis.confirmed'],
        action: '核对诊断主次顺序',
        message: `【初步诊断】第 1 条是待查类诊断，后面却有明确诊断（${laterSolid.length} 条）。请确认主次：主要疾病应排在前面，待查放在明确诊断之后通常更合适。`
      })
    );
  }

  const badMark = list.filter((s) => /[?]/.test(s));
  if (badMark.length) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_QUESTION_MARK_EN',
        severity: 'warning',
        document: 'record',
        path: 'diagnosis.confirmed',
        paths: ['diagnosis.confirmed'],
        action: '改用中文问号',
        message: `【初步诊断】「${badMark.join('」「')}」里用了英文问号，病历里应写成中文「？」。`
      })
    );
  }
  const midMark = list.filter((s) => /？.+[^\s]/.test(s) && !/[，,]\s*\S+？/.test(s));
  if (midMark.length) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_QUESTION_MARK_POSITION',
        severity: 'warning',
        document: 'record',
        path: 'diagnosis.confirmed',
        paths: ['diagnosis.confirmed'],
        action: '把问号移到病名末尾',
        message: `【初步诊断】「${midMark.join('」「')}」的问号不在病名末尾，待定标记应写在诊断名称之后，如"肠结核？"。`
      })
    );
  }

  if (!stripTail(d.signature)) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_SIGNATURE_MISSING',
        severity: 'warning',
        document: 'record',
        path: 'diagnosis.signature',
        paths: ['diagnosis.signature'],
        action: '补医师签名',
        message: '【初步诊断】末尾还没有医师签名。入院记录要求书写者在初步诊断右下角签全名。'
      })
    );
  }
  return out;
}

const PE_CONFLICT_KEYS: readonly string[] = [
  '压痛', '反跳痛', '肠鸣音', '浊音', '震颤', '包块', '杂音', '啰音', '水肿',
  '肝肋下', '脾肋下', '肝大', '脾大', '肝区叩击痛', '肾区叩击痛'
];

const PE_REGIONS: ReadonlyArray<readonly [string, RegExp]> = [
  ['头颅', /头颅|头部|额部|颞部|枕部|头顶/],
  ['颈部', /颈部|颈前|颈侧|甲状腺|颈静脉|颈动脉|气管/],
  ['胸部', /胸壁|胸廓|前胸|乳房|双乳/],
  ['心脏', /心前区|心尖|心界|心音|心脏|瓣膜/],
  ['肺部', /双肺|肺下界|胸膜|呼吸音|语颤|语音共振/],
  ['腹部', /腹部|腹壁|全腹|上腹|下腹|中腹|脐周|脐部|麦氏点|胆囊点|季肋|肝区|脾区|腹水|移动性浊音/],
  ['腰背部', /腰部|腰背|背部|脊柱|胸椎|腰椎|骶部/],
  ['四肢', /四肢|上肢|下肢|双足|足背|手指|关节|膝|踝/],
  ['会阴', /外阴|阴道|宫颈|子宫|附件|直肠|肛门|会阴/],
  ['皮肤', /皮肤|皮疹|黏膜|巩膜/]
];

/** 通用查体（系统默认值）与专科查体互相矛盾时的冲突提醒 */
export function peConflictDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const deptKey = (r.basic || {}).department || 'general';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
  const res: DocumentWarning[] = [];
  const seenKey = new Set<string>();

  const generalDefaults: Array<{ group: string; label: string; val: string }> = [];
  PE_COMMON.forEach((group) => {
    const items = group.items.filter((it) => !it.depts || it.depts.includes(deptKey));
    items.forEach((it) => {
      if (!peChecked(r, group.key, it.key)) return;
      const store = ((r.pe || {}) as unknown as Record<string, Record<string, unknown> | undefined>)[group.key];
      if (stripTail(store && store[it.key])) return;
      const val = stripTail(peValue(r, group.key, it));
      if (!val || !peValueIsDefault(it, val)) return;
      generalDefaults.push({ group: group.name, label: it.label, val });
    });
  });
  if (!generalDefaults.length) return res;

  const regionsOf = (clause: string): string[] => PE_REGIONS.filter(([, re]) => re.test(clause)).map(([n]) => n);
  const differentSite = (aText: string, bText: string): boolean => {
    const ra = regionsOf(aText);
    const rb = regionsOf(bText);
    if (!ra.length || !rb.length) return false;
    return !ra.some((x) => rb.includes(x));
  };
  const splitAll = (t: string): string[] =>
    String(t || '')
      .split(/[，,；;。]/)
      .map((s) => s.trim())
      .filter(Boolean);
  const numOf = (c: string): string | undefined => (c.match(/(\d+)\s*次\s*\/?\s*分/) || [])[1];
  const NEG_WORD = /(无|未见|未触及|未闻及|未引出|未扪及|否认|没有|正常|阴性|不)/;
  const SEG = /[、，,；;。：:]/;
  const negated = (clause: string, key: string): boolean => {
    const idx = clause.indexOf(key);
    if (idx < 0) return false;
    const head = clause.slice(0, idx).split(SEG).pop() || '';
    if (NEG_WORD.test(head)) return true;
    const tail = clause.slice(idx + key.length, idx + key.length + 5);
    return /^(阴性|正常|未触及|未闻及|未引出|未及)/.test(tail);
  };

  (dept.special || []).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (!sp) return;
    const store = ((r.pe || {})[`special_${spKey}`] || {}) as Record<string, unknown>;
    sp.items.forEach((it) => {
      const raw = stripTail(store[it.key]);
      if (!raw) return;
      splitAll(raw).forEach((spClause) => {
        PE_CONFLICT_KEYS.forEach((k) => {
          if (!spClause.includes(k)) return;
          generalDefaults.forEach((g) => {
            splitAll(g.val).forEach((gClause) => {
              if (!gClause.includes(k)) return;
              const opposite = negated(gClause, k) !== negated(spClause, k);
              const numG = numOf(gClause);
              const numS = numOf(spClause);
              const numDiff = Boolean(numG && numS && numG !== numS);
              if (!opposite && !numDiff) return;
              if (differentSite(`${g.group}${g.label}：${gClause}`, `${sp.name}${it.label}：${spClause}`)) return;
              const id = `${g.group}|${g.label}|${sp.name}`;
              if (seenKey.has(id)) return;
              seenKey.add(id);
              res.push(
                diagnostic({
                  code: 'PE_CONFLICT',
                  severity: 'warning',
                  document: 'record',
                  path: 'pe',
                  paths: ['pe'],
                  action: '核对查体描述',
                  message: `【体格检查】${g.group}「${g.label}」取的是系统默认描述「${gClause}」，而${sp.name}写的是「${spClause}」，同一体征前后矛盾，请确认以哪一份为准（程序不替你删改）。`
                })
              );
            });
          });
        });
      });
    });
  });
  return res;
}

export function peConflicts(r: DabingliRecord): string[] {
  return peConflictDiagnostics(r).map((item) => item.message);
}

const HPI_DIAGNOSTIC_FIELDS: ReadonlyArray<readonly [keyof DabingliRecord['hpi'], string]> = [
  ['onset', '起病情况'],
  ['cause', '发病诱因'],
  ['symptoms', '主要症状特点'],
  ['aggravating', '加重因素'],
  ['relief', '缓解因素'],
  ['evolution', '病情进展'],
  ['accompanying', '伴随症状'],
  ['negativeDiscriminating', '阴性鉴别病史'],
  ['negativePertinent', '阴性鉴别病史'],
  ['treatment', '诊治经过'],
  ['generalCondition', '一般情况'],
  ['extra', '补充内容']
];

/** 现病史的结构化质量提醒：残句、否定范围和有定位的重复片段 */
export function hpiQualityDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const h = (r || {}).hpi || ({} as Partial<DabingliRecord['hpi']>);
  const out: DocumentWarning[] = [];
  const seen = new Map<string, { path: string; text: string }>();
  const fields: ReadonlyArray<readonly [keyof DabingliRecord['hpi'], string]> =
    h.mode === 'manual' ? [['manual', '现病史原文']] : HPI_DIAGNOSTIC_FIELDS;

  fields.forEach(([key, label]) => {
    const value = stripTail(h[key]);
    if (!value) return;
    const path = `hpi.${String(key)}`;
    value
      .split(/[。；;]/)
      .map(stripTail)
      .filter(Boolean)
      .forEach((unit) => {
        if (isBareTimeFragment(unit)) {
          out.push(
            diagnostic({
              code: 'HPI_BARE_TIME_FRAGMENT',
              severity: 'warning',
              document: 'record',
              path,
              action: '补成完整病史句',
              message: `【现病史】${label}只写了「${unit}」，没有症状或谓语；生成时会省略这个时间残句，请补成完整描述。`,
              evidence: [{ path, text: unit }]
            })
          );
        }

        const normalized = normalizeNegationScope(unit);
        if (normalized !== stripTail(unit)) {
          out.push(
            diagnostic({
              code: 'HPI_NEGATION_SCOPE',
              severity: 'warning',
              document: 'record',
              path,
              action: '核对否定词范围',
              message: `【现病史】${label}的「${unit}」否定作用范围有歧义；生成时按「${normalized}」拆开阴性项和阳性变化，请核对原意。`,
              evidence: [{ path, text: unit }]
            })
          );
        }

        const keyText = squash(unit);
        if (!keyText) return;
        const previous = seen.get(keyText);
        if (previous && previous.path !== path) {
          out.push(
            diagnostic({
              code: 'HPI_DUPLICATE_FRAGMENT',
              severity: 'warning',
              document: 'record',
              path,
              action: '删除重复片段',
              message: `【现病史】「${unit}」同时写在 ${previous.path} 和 ${path}，生成时只保留首次出现，请核对是否应删除一处。`,
              evidence: [
                { path: previous.path, text: previous.text },
                { path, text: unit }
              ]
            })
          );
        } else if (!previous) {
          seen.set(keyText, { path, text: unit });
        }
      });
  });
  return out;
}

export function factStateDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const deptKey = (r.basic || {}).department || 'general';
  const dept = DEPARTMENTS.find((d) => d.key === deptKey) || DEPARTMENTS[0];
  const groups = PE_COMMON.map((group) => ({ groupKey: group.key, items: group.items }));
  (dept.special || []).forEach((spKey) => {
    const sp = PE_SPECIAL[spKey];
    if (sp) groups.push({ groupKey: `special_${spKey}`, items: sp.items });
  });

  groups.forEach((group) => {
    const store = (((r.pe || {}) as unknown as Record<string, unknown>)[group.groupKey] || {}) as Record<string, unknown>;
    group.items.forEach((item) => {
      const explicit = rawPeFactState(r, group.groupKey, item.key);
      const path = `peFactStates.${group.groupKey}.${item.key}`;
      const hasValue = peItemFilled(store, item);
      const checked = Boolean((r.pe || {}).checked && ((r.pe || {}).checked || {})[group.groupKey]?.[item.key]);
      if (explicit === 'not_asked' && (hasValue || checked)) {
        out.push(
          diagnostic({
            code: 'PE_FACT_STATE_CONFLICT',
            severity: 'warning',
            document: 'record',
            path,
            action: '核对查体状态',
            message: `【体格检查】${group.groupKey}.${item.key} 标为“未查”，但仍保留勾选或文字；生成时以“未查”为准，不会写入正常描述。`,
            evidence: [{ path: `pe.${group.groupKey}.${item.key}`, text: String(store[item.key] || '') }]
          })
        );
      }
      if (explicit === 'asked_positive' && !hasValue) {
        out.push(
          diagnostic({
            code: 'PE_POSITIVE_DETAIL_MISSING',
            severity: 'warning',
            document: 'record',
            path: `pe.${group.groupKey}.${item.key}`,
            action: '补阳性体征描述',
            message: `【体格检查】${group.groupKey}.${item.key} 已标记为阳性，但未填写具体所见；不会用正常描述代替。`,
            evidence: [{ path, text: explicit }]
          })
        );
      }
    });
  });
  return out;
}

/** 同一生命体征在正文、查体、摘要和 SOAP 中的数值必须一致 */
function vitalConsistencyDiagnosticsWithContext(ctx: ValidationContext): DocumentWarning[] {
  const vitals = ctx.vitals();
  if (!Object.keys(vitals).length) return [];
  const contexts = [
    { document: 'record' as const, path: 'pe.vitals', label: '生命体征', text: ctx.vitalsText() },
    { document: 'record' as const, path: 'pe', label: '查体', text: ctx.peText() },
    { document: 'record' as const, path: 'summary', label: '摘要', text: ctx.summaryText() },
    { document: 'firstCourse' as const, path: 'soap.o.pe', label: 'SOAP', text: ctx.objectivePeText() }
  ];
  const scalarPatterns: Record<string, RegExp> = {
    temperature: /(?:T|体温)\s*([0-9]+(?:\.[0-9]+)?)\s*℃/g,
    pulse: /(?:P|脉搏|心率)\s*([0-9]+(?:\.[0-9]+)?)\s*次\/分/g,
    respiration: /(?:R|呼吸)\s*([0-9]+(?:\.[0-9]+)?)\s*次\/分/g
  };
  const bloodPressure = /(?:BP|血压)\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/g;
  const out: DocumentWarning[] = [];

  contexts.forEach((context) => {
    if (!context.text) return;
    Object.keys(scalarPatterns).forEach((key) => {
      if (!vitals[key]) return;
      const re = scalarPatterns[key];
      re.lastIndex = 0;
      const match = re.exec(context.text);
      if (!match || Number(match[1]) === vitals[key].num) return;
      out.push(
        diagnostic({
          code: 'VITAL_CROSS_DOCUMENT_MISMATCH',
          severity: 'warning',
          document: context.document,
          path: context.path,
          action: '统一生命体征数值',
          message: `【生命体征】${context.label}写的 ${match[1]} 与生命体征录入值 ${vitals[key].raw} 不一致，同一份病历前后数值应相同。`,
          evidence: [
            { path: `pe.vitals.${key}`, text: vitals[key].raw },
            { path: context.path, text: match[0] }
          ]
        })
      );
    });

    if (!vitals.sbp && !vitals.dbp) return;
    bloodPressure.lastIndex = 0;
    const bp = bloodPressure.exec(context.text);
    if (!bp) return;
    const sbpMismatch = Boolean(vitals.sbp && Number(bp[1]) !== vitals.sbp.num);
    const dbpMismatch = Boolean(vitals.dbp && Number(bp[2]) !== vitals.dbp.num);
    if (!sbpMismatch && !dbpMismatch) return;
    const expected = `${vitals.sbp ? vitals.sbp.raw : '—'}/${vitals.dbp ? vitals.dbp.raw : '—'}`;
    out.push(
      diagnostic({
        code: 'VITAL_CROSS_DOCUMENT_MISMATCH',
        severity: 'warning',
        document: context.document,
        path: context.path,
        action: '统一生命体征数值',
        message: `【生命体征】${context.label}写的血压 ${bp[1]}/${bp[2]} 与生命体征录入值 ${expected} 不一致，同一份病历前后数值应相同。`,
        evidence: [
          { path: 'pe.vitals.sbp', text: vitals.sbp ? vitals.sbp.raw : '' },
          { path: 'pe.vitals.dbp', text: vitals.dbp ? vitals.dbp.raw : '' },
          { path: context.path, text: bp[0] }
        ]
      })
    );
  });
  return out;
}

export function vitalConsistencyDiagnostics(r: DabingliRecord): DocumentWarning[] {
  return vitalConsistencyDiagnosticsWithContext(createValidationContext(r));
}

export function qualityDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const ctx = createValidationContext(r);
  return hpiQualityDiagnostics(r).concat(factStateDiagnostics(r), vitalConsistencyDiagnosticsWithContext(ctx));
}

function vitalDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const v = ((r.pe || {}).vitals || {}) as Record<string, unknown>;
  Object.keys(VITAL_RANGE).forEach((k) => {
    const [lo, hi, label] = VITAL_RANGE[k];
    const raw = String(v[k] === undefined || v[k] === null ? '' : v[k]).trim();
    if (!raw) return;
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      out.push(
        diagnostic({
          code: 'VITAL_RANGE',
          severity: 'warning',
          document: 'record',
          path: 'pe.vitals',
          paths: ['pe.vitals'],
          action: '核对生命体征',
          message: `【生命体征】${label}填的是「${raw}」，不是数字。病历里这一项已按「／」留空，请补填。`
        })
      );
      return;
    }
    const n = Number(raw);
    if (n < lo || n > hi) {
      out.push(
        diagnostic({
          code: 'VITAL_RANGE',
          severity: 'warning',
          document: 'record',
          path: 'pe.vitals',
          paths: ['pe.vitals'],
          action: '核对生命体征',
          message: `【生命体征】${label} ${raw} 超出可信范围（${lo}～${hi}），病历里这一项已按「／」留空，请核对是否多打或少打了一位后再填。`
        })
      );
    }
  });
  const sbp = Number(String(v.sbp === undefined ? '' : v.sbp).trim());
  const dbp = Number(String(v.dbp === undefined ? '' : v.dbp).trim());
  if (sbp && dbp && Number.isFinite(sbp) && Number.isFinite(dbp) && sbp <= dbp) {
    out.push(
      diagnostic({
        code: 'VITAL_RANGE',
        severity: 'warning',
        document: 'record',
        path: 'pe.vitals',
        paths: ['pe.vitals'],
        action: '核对生命体征',
        message: `【生命体征】收缩压 ${sbp} 不高于舒张压 ${dbp}，两者可能写反了。`
      })
    );
  }
  return out;
}

function dateDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const pushDateWarn = (message: string): void => {
    out.push(
      diagnostic({
        code: 'DATE_INVALID',
        severity: 'warning',
        document: 'record',
        path: 'basic.admitDate',
        paths: ['basic.admitDate', 'discharge.dischargeDate'],
        action: '核对日期',
        message
      })
    );
  };
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const okDate = (s: unknown): string | null => {
    const t = stripTail(s);
    if (!t) return null;
    const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) {
      pushDateWarn(`【日期】「${t}」不是 YYYY-MM-DD 格式，请核对。`);
      return null;
    }
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
      pushDateWarn(`【日期】「${t}」不是一个真实存在的日期，请核对。`);
      return null;
    }
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const admit = okDate(b.admitDate);
  const record = okDate(b.recordDate);
  const birth = okDate(b.birthDate);
  const discharge = okDate((r.discharge || {}).dischargeDate);
  if (birth && admit && birth > admit) pushDateWarn('【日期】出生日期晚于入院日期，请核对。');
  (
    [
      ['入院', b.admitTime, admit],
      ['记录', b.recordTime, record]
    ] as ReadonlyArray<readonly [string, unknown, string | null]>
  ).forEach(([label, value, date]) => {
    const time = stripTail(value);
    if (!time) return;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      pushDateWarn(`【日期】${label}时间「${time}」格式有误，请核对。`);
    }
    if (!date) pushDateWarn(`【日期】已填写${label}时间，请同时核对${label}日期。`);
  });
  if (admit && record && record < admit) {
    pushDateWarn(`【日期】记录日期 ${record} 早于入院日期 ${admit}，请核对。`);
  }
  if (
    admit &&
    record &&
    admit === record &&
    /^\d\d:\d\d$/.test(b.admitTime || '') &&
    /^\d\d:\d\d$/.test(b.recordTime || '') &&
    (b.recordTime || '') < (b.admitTime || '')
  ) {
    pushDateWarn('【日期】记录时间早于入院时间，请核对。');
  }
  if (admit && discharge && discharge < admit) {
    pushDateWarn(`【日期】出院日期 ${discharge} 早于入院日期 ${admit}，请核对。`);
  }
  return out;
}

function deptAgeDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const info = resolveAge(r);
  if (!info.ok) return [];
  const age = info.kind === 'days' || info.kind === 'months' ? 0 : info.years;
  const ageLabel = info.kind === 'years' ? `${info.text.replace(/岁$/, '')} 岁` : info.text;
  if (!Number.isFinite(age) || age < 0 || !ageLabel) return [];
  const dept = b.department;
  const name = (DEPARTMENTS.find((d) => d.key === dept) || {}).name || '';
  if (dept === 'pediatrics' && age >= 14) {
    return [
      diagnostic({
        code: 'DEPT_AGE_MISMATCH',
        severity: 'warning',
        document: 'record',
        path: 'basic.department',
        paths: ['basic.department', 'basic.age'],
        action: '核对科室与年龄',
        message: `【一般项目】科室是${name}，但年龄 ${ageLabel}，请确认是否选错科室（儿科一般指 14 岁以下）。`
      })
    ];
  }
  if (dept && dept !== 'pediatrics' && dept !== 'emergency' && age < 14) {
    return [
      diagnostic({
        code: 'DEPT_AGE_MISMATCH',
        severity: 'warning',
        document: 'record',
        path: 'basic.department',
        paths: ['basic.department', 'basic.age'],
        action: '核对科室与年龄',
        message: `【一般项目】年龄 ${ageLabel}，科室却是${name}；14 岁以下建议选儿科。`
      })
    ];
  }
  return [];
}

function recordConsistencyDiagnostics(ctx: ValidationContext): DocumentWarning[] {
  const { r } = ctx;
  const out: DocumentWarning[] = [];
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const history = [
    h.onset,
    h.symptoms,
    h.aggravating,
    h.relief,
    h.evolution,
    h.accompanying,
    negativeHistoryText(h),
    h.treatment,
    h.extra
  ]
    .filter(Boolean)
    .join('。');

  const laterality = /([左右])(?:侧)?(?:上下|上|下|四)?肢(?:体)?[^，。；;]{0,8}(?:无力|乏力|瘫痪)/g;
  const sides = new Set<string>();
  for (const match of history.matchAll(laterality)) {
    const before = history.slice(0, match.index).split(/[，,。；;、]/).pop() || '';
    if (!/(无|否认|未见|没有)[^，。；、]{0,6}$/.test(before)) sides.add(match[1]);
  }
  if (sides.has('左') && sides.has('右')) {
    out.push(
      diagnostic({
        code: 'HISTORY_LATERALITY',
        severity: 'warning',
        document: 'record',
        path: 'hpi',
        paths: ['hpi'],
        action: '核对患侧与时间',
        message: '【现病史】左右侧肢体无力均被提及，请核对患侧及是否为不同时间的表现。'
      })
    );
  }

  ['视物模糊', '头痛', '呛咳', '发热'].forEach((symptom) => {
    const seen = { positive: false, negative: false };
    history.split(/[。；;]/).forEach((sentence) => {
      let negative = false;
      sentence.split(/[，,、]/).forEach((raw) => {
        const clause = raw.trim().replace(/无明显诱因|无诱因/g, '');
        if (!clause) return;
        if (/^(无|否认|没有|未见|未出现)/.test(clause)) negative = true;
        else if (/出现|伴有|伴|诉|存在|有症状/.test(clause)) negative = false;
        if (!clause.includes(symptom)) return;
        const prefix = clause.slice(0, clause.indexOf(symptom));
        const localNeg = /(无|否认|没有|未见|未出现)[^，。；、]{0,8}$/.test(prefix);
        if (localNeg || negative) seen.negative = true;
        else seen.positive = true;
      });
    });
    if (seen.positive && seen.negative) {
      out.push(
        diagnostic({
          code: 'HISTORY_POLARITY_CONFLICT',
          severity: 'warning',
          document: 'record',
          path: 'hpi',
          paths: ['hpi'],
          action: '核对是否对应不同时间',
          message: `【现病史】「${symptom}」同时出现有和无的描述，请核对是否对应不同时间。`
        })
      );
    }
  });

  const cause = stripTail(h.cause);
  const explicitTrigger = /受凉|进食|饮食|劳累|外伤|摔倒|搬重|情绪激动|饮酒后|感染后|服药后|诱发/.test(cause);
  if (
    /无明显诱因|无诱因/.test(String(h.onset || '')) &&
    explicitTrigger &&
    !/^(无明显诱因|无诱因|无明显原因|诱因不明)/.test(cause)
  ) {
    out.push(
      diagnostic({
        code: 'HISTORY_CAUSE_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'hpi.onset',
        paths: ['hpi.onset', 'hpi.cause'],
        action: '核对诱因',
        message: '【现病史】起病描述写无明显诱因，诱因栏又填写了其他内容，请核对。'
      })
    );
  }
  if (/症状同前/.test(history) && /较(?:上述|前).{0,4}好转/.test(history)) {
    out.push(
      diagnostic({
        code: 'HISTORY_PROGRESS_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'hpi.evolution',
        paths: ['hpi.evolution'],
        action: '核对时间',
        message: '【现病史】同时写了症状同前和较前好转，请核对各自对应的时间。'
      })
    );
  }
  if (/发病至入院(?:时间)?[^。；;]{0,12}(?:小时|分钟)/.test(history)) {
    out.push(
      diagnostic({
        code: 'HISTORY_DURATION_CHECK',
        severity: 'warning',
        document: 'record',
        path: 'hpi',
        paths: ['hpi'],
        action: '核对时长',
        message: '【现病史】请按起病、就诊、治疗和入院的实际时间核对所写的时长。'
      })
    );
  }
  if (!ctx.aux().length && /(?:血常规|生化|血糖|凝血|头颅CT|CTA|MRI|磁共振)/i.test(history)) {
    out.push(
      diagnostic({
        code: 'AUX_MISSING',
        severity: 'warning',
        document: 'record',
        path: 'auxiliary.items',
        paths: ['auxiliary.items'],
        action: '补检查结果',
        message: '【辅助检查】现病史提到了检查，但辅助检查栏目尚未录入结果；请按实际报告补充或确认。'
      })
    );
  }

  PE_COMMON.forEach((group) => {
    const store = (((r.pe || {}) as unknown as Record<string, unknown>)[group.key] || {}) as Record<string, unknown>;
    group.items.forEach((parent) => {
      if (!peChecked(r, group.key, parent.key)) return;
      const parentText = stripTail(peValue(r, group.key, parent)) || stripTail(peNormalText(parent));
      childPEItems(group.key, parent.key).forEach((child) => {
        if (!peChecked(r, group.key, child.key)) return;
        const childText = stripTail(peValue(r, group.key, child)) || stripTail(peNormalText(child));
        if (!peParentChildConflict(group.key, parent.key, parentText, child.key, childText)) return;
        const detail = peItemFilled(store, parent)
          ? '两项内容可能不一致，请核对后修改。'
          : '默认描述与细项可能冲突，默认描述未写入，请填写实际所见。';
        out.push(
          diagnostic({
            code: 'PE_CONFLICT',
            severity: 'warning',
            document: 'record',
            path: 'pe',
            paths: ['pe'],
            action: '核对查体描述',
            message: `【体格检查】${group.name}「${parent.label}」与「${child.label}」：${detail}`
          })
        );
      });
    });
  });

  return out;
}

function newConsistencyDiagnostics(ctx: ValidationContext): DocumentWarning[] {
  const { r } = ctx;
  const out: DocumentWarning[] = [];

  const info = resolveAge(r);
  if (info.ok && info.mismatch && info.manual) {
    out.push(
      diagnostic({
        code: 'AGE_BIRTHDATE_MISMATCH',
        severity: 'warning',
        document: 'record',
        path: 'basic.age',
        paths: ['basic.age', 'basic.birthDate', 'basic.admitDate'],
        action: '核对年龄与出生日期',
        message: `【一般项目】年龄写「${info.manual.text}」，按出生日期 ${info.birthDate} 和参考日期 ${info.refDate} 算出「${info.text}」，两者明显不一致，请核对。`
      })
    );
  }

  const mc = r.meta && r.meta.conflicts && r.meta.conflicts.marriage;
  if (mc && !mc.resolved && stripTail(mc.basicValue) && stripTail(mc.marriageValue) && stripTail(mc.basicValue) !== stripTail(mc.marriageValue)) {
    out.push(
      diagnostic({
        code: 'MARITAL_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'basic.marital',
        paths: ['basic.marital', 'marriage.status'],
        action: '选择以哪个为准',
        message: `【婚姻史】基本信息写「${stripTail(mc.basicValue)}」，婚姻史写「${stripTail(mc.marriageValue)}」，两处不一致，请选择以哪个为准。`
      })
    );
  }

  const pmh = r.pmh || ({} as Partial<DabingliRecord['pmh']>);
  const allergyText = stripTail(pmh.allergy);
  const allergenPicked =
    Object.keys(pmh.allergenChecks || {}).some((k) => Boolean((pmh.allergenChecks || {})[k])) ||
    Boolean(stripTail(pmh.allergenOther));
  if (allergyText && /^(无|否认|没有|未见|未发现)/.test(allergyText) && allergenPicked) {
    out.push(
      diagnostic({
        code: 'ALLERGY_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'pmh.allergy',
        paths: ['pmh.allergy', 'pmh.allergenChecks'],
        action: '核对过敏史',
        message: '【既往史】过敏史写的是「无/否认」，但又勾选或填写了具体过敏原，请核对。'
      })
    );
  }

  const per = r.personal || ({} as Partial<DabingliRecord['personal']>);
  const smoke = stripTail(per.smoking);
  const smokeAmount = stripTail(per.smokingAmount);
  if (smoke && /^(无|不|否|从未|已戒)/.test(smoke) && /\d/.test(smokeAmount)) {
    out.push(
      diagnostic({
        code: 'SMOKING_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'personal.smoking',
        paths: ['personal.smoking', 'personal.smokingAmount'],
        action: '核对吸烟状态与数量',
        message: `【个人史】吸烟写「${smoke}」，数量却填了「${smokeAmount}」，请核对。`
      })
    );
  }
  const drink = stripTail(per.drinking);
  const drinkAmount = stripTail(per.drinkingAmount);
  if (drink && /^(无|不|否|从未|已戒)/.test(drink) && /\d/.test(drinkAmount)) {
    out.push(
      diagnostic({
        code: 'DRINKING_CONFLICT',
        severity: 'warning',
        document: 'record',
        path: 'personal.drinking',
        paths: ['personal.drinking', 'personal.drinkingAmount'],
        action: '核对饮酒状态与数量',
        message: `【个人史】饮酒写「${drink}」，数量却填了「${drinkAmount}」，请核对。`
      })
    );
  }

  const d = r.discharge || {};
  const outDx = (Array.isArray(d.diagnoses) ? d.diagnoses : []).map((s) => stripTail(s)).filter(Boolean);
  if (!outDx.length) {
    out.push(
      diagnostic({
        code: 'DISCHARGE_DX_MISSING',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.diagnoses',
        paths: ['discharge.diagnoses'],
        action: '从初步诊断带入并确认',
        message: '【出院记录】出院诊断未填写；如与初步诊断一致，请使用「从初步诊断带入」后核对确认。'
      })
    );
  } else if (d.diagnosesConfirmed !== true) {
    out.push(
      diagnostic({
        code: 'DISCHARGE_DX_UNCONFIRMED',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.diagnoses',
        paths: ['discharge.diagnoses', 'discharge.diagnosesConfirmed'],
        action: '确认出院诊断',
        message: '【出院记录】出院诊断已填写但尚未确认，请核对后再定稿。'
      })
    );
  }

  const dated = ctx.aux().filter((it) => Boolean(stripTail(it.date)));
  const parsed: number[] = [];
  dated.forEach((it) => {
    const p = ageParseDate(it.date);
    if (!p) {
      out.push(
        diagnostic({
          code: 'AUX_DATE_INVALID',
          severity: 'warning',
          document: 'record',
          path: 'auxiliary.items',
          paths: ['auxiliary.items'],
          action: '改成 YYYY-MM-DD',
          message: `【辅助检查】「${stripTail(it.name) || '未命名检查'}」的日期「${stripTail(it.date)}」无法识别，请按 YYYY-MM-DD 填写。`
        })
      );
    } else {
      parsed.push(p.ms);
    }
  });
  for (let i = 1; i < parsed.length; i++) {
    if (parsed[i] < parsed[i - 1]) {
      out.push(
        diagnostic({
          code: 'AUX_DATE_ORDER',
          severity: 'warning',
          document: 'record',
          path: 'auxiliary.items',
          paths: ['auxiliary.items'],
          action: '按时间排序',
          message: '【辅助检查】检查日期不是按时间先后排列，请核对每条结果对应的日期。'
        })
      );
      break;
    }
  }

  const hpiFields: ReadonlyArray<keyof DabingliRecord['hpi']> = [
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
  ];
  const counts = new Map<string, Set<string>>();
  hpiFields.forEach((key) => {
    const text = stripTail((((r.hpi || {}) as unknown as Record<string, unknown>)[key]));
    if (!text) return;
    const local = new Map<string, number>();
    splitSentences(text).forEach((sentence) => {
      const k = sentenceKey(sentence);
      if (!k) return;
      local.set(k, (local.get(k) || 0) + 1);
      if (!counts.has(k)) counts.set(k, new Set());
      counts.get(k)!.add(String(key));
    });
    local.forEach((count, k) => {
      if (count > 1) {
        out.push(
          diagnostic({
            code: 'HISTORY_DUPLICATE',
            severity: 'warning',
            document: 'record',
            path: 'hpi',
            paths: ['hpi'],
            action: '删除多余的一句',
            message: `【现病史】「${k}」在同一栏里重复了 ${count} 次，请删除多余的一句。`
          })
        );
      }
    });
  });
  counts.forEach((set, k) => {
    if (set.size > 1) {
      out.push(
        diagnostic({
          code: 'HISTORY_DUPLICATE_ACROSS',
          severity: 'warning',
          document: 'record',
          path: 'hpi',
          paths: ['hpi'],
          action: '合并重复病史',
          message: `【现病史】「${k}」同时写在 ${set.size} 个栏目里，生成时只保留一次，请核对是否需要合并。`
        })
      );
    }
  });

  return out;
}

const SIDE_SCAN_SKIP = new Set([
  'meta',
  'documentMeta',
  'peDefaults',
  'peFactStates',
  'peChecked',
  'fieldStates',
  'aiProvenance'
]);

const SIDE_SECTION_NAMES: Readonly<Record<string, string>> = {
  basic: '一般项目',
  hpi: '现病史',
  ros: '系统回顾',
  pmh: '既往史',
  personal: '个人史',
  marriage: '婚姻史',
  menstruation: '月经史',
  childbirth: '生育史',
  family: '家族史',
  pe: '体格检查',
  auxiliary: '辅助检查',
  diagnosis: '初步诊断',
  soap: '首次病程记录',
  discharge: '出院记录'
};

interface PlaceholderHit {
  path: string;
  text: string;
}

function sidePlaceholderHits(r: DabingliRecord): PlaceholderHit[] {
  const scan: Record<string, unknown> = {};
  const raw = (r || {}) as unknown as Record<string, unknown>;
  Object.keys(raw).forEach((key) => {
    if (!SIDE_SCAN_SKIP.has(key)) scan[key] = raw[key];
  });
  try {
    return (findUnfilledPlaceholders(scan as unknown as DabingliRecord) || []) as PlaceholderHit[];
  } catch {
    return [];
  }
}

function sidePlaceholderMessage(hits: readonly PlaceholderHit[]): string {
  const names: string[] = [];
  hits.forEach((hit) => {
    const top = String(hit.path || '').split(/[.[]/)[0];
    const name = SIDE_SECTION_NAMES[top] || top || '病历';
    if (!names.includes(name) && names.length < 5) names.push(name);
  });
  return `【模板】仍有 ${hits.length} 处侧别占位符（患侧/对侧/健侧）未改成左或右：${names.join('、')}。`;
}

/** 文书过期属于「资料变了、文字没跟上」，不在 validate 的缺项里重复刷屏 */
export function staleDocumentWarnings(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const summaryState = documentState(r, 'summary');
  if (summaryState && /(^|-)stale$/.test(summaryState.state)) {
    out.push(
      diagnostic({
        code: 'DOC_STALE_SUMMARY',
        severity: 'warning',
        document: 'record',
        path: 'summary',
        message: `【摘要】原始资料已变化（${(summaryState.changed || []).join('、') || '资料'}），当前摘要可能过期，请比较后更新。`,
        action: '查看摘要更新',
        evidence: [{ path: 'summary', text: String(r.summary || '').trim() }]
      })
    );
  }
  (['s', 'oPe', 'oAux', 'basis'] as const).forEach((seg) => {
    const st = documentState(r, 'firstCourse', seg);
    if (st && /(^|-)stale$/.test(st.state)) {
      const path = `soap.${seg === 's' ? 's.summary' : seg === 'oPe' ? 'o.pe' : seg === 'oAux' ? 'o.aux' : 'a.basis'}`;
      out.push(
        diagnostic({
          code: 'DOC_STALE_SOAP',
          severity: 'warning',
          document: 'firstCourse',
          path,
          message: `【首次病程录】${seg === 's' ? 'S 段' : seg === 'oPe' ? 'O 段体检' : seg === 'oAux' ? 'O 段辅助检查' : '诊断依据'}的原始资料已变化，当前文字可能过期。`,
          action: '查看该段更新',
          evidence: [{ path, text: String(getPath(r, path) || '') }]
        })
      );
    }
  });
  const dState = documentState(r, 'discharge', 'admitCondition');
  if (dState && /(^|-)stale$/.test(dState.state)) {
    out.push(
      diagnostic({
        code: 'DOC_STALE_DISCHARGE',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.admitCondition',
        message: '【出院记录】入院情况是按较早的资料生成的，之后资料有变化；当前文字保留不改，请核对是否需要更新。',
        action: '核对入院情况',
        evidence: [{ path: 'discharge.admitCondition', text: String((r.discharge || {}).admitCondition || '').trim() }]
      })
    );
  }
  return out;
}

/**
 * 结构化校验的唯一事实源。
 * 所有校验规则在这里直接产出 DocumentWarning，不再经正则表二次反推。
 */
export function validateStructured(
  r: DabingliRecord,
  opts: { includeStale?: boolean } = {}
): DocumentWarning[] {
  const ctx = createValidationContext(r);
  const out: DocumentWarning[] = [];
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);

  const sideHits = sidePlaceholderHits(r);
  if (sideHits.length) {
    const sidePaths: string[] = [];
    sideHits.forEach((hit) => {
      if (hit.path && !sidePaths.includes(hit.path)) sidePaths.push(hit.path);
    });
    out.push(
      diagnostic({
        code: 'SIDE_PLACEHOLDER_UNFILLED',
        severity: 'error',
        document: 'record',
        path: sideHits[0].path || 'record',
        paths: sidePaths.length ? sidePaths : ['record'],
        message: sidePlaceholderMessage(sideHits),
        action: '把占位符改成左或右',
        evidence: sideHits.map((hit) => ({ path: hit.path || '', text: hit.text || '' }))
      })
    );
  }

  if (!b.name) {
    out.push(
      diagnostic({
        code: 'NAME_MISSING',
        severity: 'error',
        document: 'record',
        path: 'basic.name',
        paths: ['basic.name'],
        action: '填写姓名',
        message: '【一般项目】缺少姓名。'
      })
    );
  }
  if (!b.gender) {
    out.push(
      diagnostic({
        code: 'GENDER_MISSING',
        severity: 'error',
        document: 'record',
        path: 'basic.gender',
        paths: ['basic.gender'],
        action: '选择性别',
        message: '【一般项目】缺少性别。'
      })
    );
  }
  if (!b.age) {
    out.push(
      diagnostic({
        code: 'AGE_MISSING',
        severity: 'error',
        document: 'record',
        path: 'basic.age',
        paths: ['basic.age', 'basic.birthDate'],
        action: '填写年龄或出生日期',
        message: '【一般项目】缺少年龄。'
      })
    );
  } else if (!stripTail(b.birthDate)) {
    const ageText = stripTail(b.age);
    const parsed = parseAge(ageText);
    if (!parsed.ok || parsed.years < 0 || parsed.years > 130) {
      out.push(
        diagnostic({
          code: 'AGE_INVALID',
          severity: 'warning',
          document: 'record',
          path: 'basic.age',
          paths: ['basic.age'],
          action: '核对年龄',
          message: `【一般项目】年龄「${ageText}」无法识别或不合理，请核对。`
        })
      );
    }
  }

  if ((r.menstruation || {}).applicable === '无') {
    const ageInfo = resolveAge(r);
    if (ageInfo && ageInfo.ok && Number.isFinite(ageInfo.years) && ageInfo.years < 14) {
      const ageText = ageWithUnit(r) || `${Math.round(ageInfo.years * 10) / 10}岁`;
      out.push(
        diagnostic({
          code: 'MENSTRUATION_CHILD_MENOPAUSE',
          severity: 'warning',
          document: 'record',
          path: 'menstruation.applicable',
          paths: ['menstruation.applicable', 'basic.age'],
          action: '核对月经史',
          message: `【月经史】患儿 ${ageText}却写「已绝经」，请核对。`
        })
      );
    }
  }

  const cc = stripTail(b.chiefComplaint);
  if (!cc) {
    out.push(
      diagnostic({
        code: 'CHIEF_COMPLAINT_MISSING',
        severity: 'error',
        document: 'record',
        path: 'basic.chiefComplaint',
        paths: ['basic.chiefComplaint'],
        action: '填写主诉',
        message: '【主诉】未填写。'
      })
    );
  } else {
    if (cc.length > 20) {
      out.push(
        diagnostic({
          code: 'CHIEF_COMPLAINT_TOO_LONG',
          severity: 'warning',
          document: 'record',
          path: 'basic.chiefComplaint',
          paths: ['basic.chiefComplaint'],
          action: '压缩到 20 字以内',
          message: `【主诉】文字偏长（${cc.length}字），一般要求不超过20字，只写症状+时间、不写诊断。`
        })
      );
    }
    const hit = DIAG_WORDS.filter((dw) => cc.includes(dw));
    if (hit.length) {
      out.push(
        diagnostic({
          code: 'CHIEF_COMPLAINT_DIAGNOSIS_WORD',
          severity: 'warning',
          document: 'record',
          path: 'basic.chiefComplaint',
          paths: ['basic.chiefComplaint'],
          action: '改成症状描述',
          message: `【主诉】疑似包含诊断性词语（${hit.join('、')}），主诉应写症状，建议改为症状描述。`
        })
      );
    }
    if (!stripTail(b.chiefComplaintDuration) && !hasDurationInText(buildChiefComplaint(r))) {
      out.push(
        diagnostic({
          code: 'CHIEF_COMPLAINT_DURATION_MISSING',
          severity: 'warning',
          document: 'record',
          path: 'basic.chiefComplaint',
          paths: ['basic.chiefComplaint', 'basic.chiefComplaintDuration'],
          action: '补持续时间',
          message: '【主诉】缺少持续时间。'
        })
      );
    }
  }

  if (!(buildHPI(r) || '').trim()) {
    out.push(
      diagnostic({
        code: 'HPI_MISSING',
        severity: 'error',
        document: 'record',
        path: 'hpi',
        paths: ['hpi'],
        action: '填写现病史',
        message: '【现病史】未填写。'
      })
    );
  }

  if (!marriageValue(r)) {
    out.push(
      diagnostic({
        code: 'MARITAL_MISSING',
        severity: 'warning',
        document: 'record',
        path: 'basic.marital',
        paths: ['basic.marital', 'marriage.status'],
        action: '填写婚姻状态',
        message: '【婚姻史】未填写。'
      })
    );
  }

  const per = r.personal || ({} as Partial<DabingliRecord['personal']>);
  if (
    !stripTail(per.residence) &&
    !stripTail(per.travel) &&
    !per.smoking &&
    !per.drinking &&
    !stripTail(per.occupationEnv) &&
    !stripTail(per.sexualHistory) &&
    !stripTail(per.drugs)
  ) {
    out.push(
      diagnostic({
        code: 'PERSONAL_MISSING',
        severity: 'warning',
        document: 'record',
        path: 'personal',
        paths: ['personal'],
        action: '补个人史',
        message: '【个人史】未填写（至少需要居住情况、烟酒嗜好、职业与工作条件、冶游史）。'
      })
    );
  }

  if (!ctx.abnormalPe().length && !Object.keys((r.pe || {}).vitals || {}).length) {
    out.push(
      diagnostic({
        code: 'PE_MISSING',
        severity: 'warning',
        document: 'record',
        path: 'pe',
        paths: ['pe'],
        action: '录入查体',
        message: '【体格检查】未录入异常或生命体征。'
      })
    );
  }

  const pulseRaw = String((((r.pe || {}).vitals) || {}).pulse || '').match(/\d+/);
  if (pulseRaw) {
    const hr = ctx.peText().match(/心率\s*(\d+)\s*次\/分/);
    if (hr && hr[1] !== pulseRaw[0]) {
      out.push(
        diagnostic({
          code: 'PE_CONFLICT',
          severity: 'warning',
          document: 'record',
          path: 'pe',
          paths: ['pe'],
          action: '核对查体描述',
          message: `【体格检查】心脏听诊写的心率 ${hr[1]} 次/分 与生命体征 P ${pulseRaw[0]} 次/分 不一致，请核对。`
        })
      );
    }
  }

  out.push(
    ...peConflictDiagnostics(r),
    ...vitalDiagnostics(r),
    ...dateDiagnostics(r),
    ...deptAgeDiagnostics(r),
    ...recordConsistencyDiagnostics(ctx),
    ...newConsistencyDiagnostics(ctx)
  );

  if (!((r.diagnosis || {}).confirmed || []).length) {
    out.push(
      diagnostic({
        code: 'DIAGNOSIS_MISSING',
        severity: 'error',
        document: 'record',
        path: 'diagnosis.confirmed',
        paths: ['diagnosis.confirmed'],
        action: '填写初步诊断',
        message: '【初步诊断】未填写，可参考"诊断提示"。'
      })
    );
  } else {
    out.push(...warnDiagnosisOrderDiagnostics(r));
  }

  if (!stripTail(r.summary || '')) {
    out.push(
      diagnostic({
        code: 'SUMMARY_DRAFT',
        severity: 'info',
        document: 'record',
        path: 'summary',
        paths: ['summary'],
        action: '核对并定稿',
        message: '【摘要】目前为自动生成的初稿，请核对并润色后再定稿。'
      })
    );
  }

  const soap = r.soap || {};
  const a = soap.a || {};
  const p = soap.p || {};
  if (!(Array.isArray(a.diff) && a.diff.some((d) => d && stripTail(d.diagnosis)))) {
    out.push(
      diagnostic({
        code: 'SOAP_DIFF_MISSING',
        severity: 'warning',
        document: 'firstCourse',
        path: 'soap.a.diff',
        paths: ['soap.a.diff'],
        action: '补鉴别诊断',
        message: '【首次病程录】鉴别诊断未填写，建议围绕主要诊断写 2 条左右，说明为什么考虑、哪一点不支持。'
      })
    );
  }
  if (!(Array.isArray(p.perDiagnosis) && p.perDiagnosis.some((x) => x && stripTail(x.diagnosis)))) {
    out.push(
      diagnostic({
        code: 'SOAP_PLAN_MISSING',
        severity: 'warning',
        document: 'firstCourse',
        path: 'soap.p.perDiagnosis',
        paths: ['soap.p.perDiagnosis'],
        action: '按诊断列计划',
        message: '【首次病程录】诊疗计划尚未按诊断逐条列出检查与治疗措施。'
      })
    );
  }
  if (Array.isArray(a.diff) && a.diff.length) {
    const chk = diffRelatedToDiagnosis(r);
    if (chk.unrelated.length) {
      out.push(
        diagnostic({
          code: 'SOAP_DIFF_UNRELATED',
          severity: 'warning',
          document: 'firstCourse',
          path: 'soap.a.diff',
          paths: ['soap.a.diff'],
          action: '核对鉴别诊断',
          message: `【首次病程录】${chk.unrelated.join('、')} 与现有诊断关联不明确，请确认是否保留。`
        })
      );
    }
  }

  const d = r.discharge || {};
  const adv = d.advice || {};
  if (!stripTail(d.dischargeStatus)) {
    out.push(
      diagnostic({
        code: 'DISCHARGE_STATUS_MISSING',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.dischargeStatus',
        paths: ['discharge.dischargeStatus'],
        action: '填写出院情况',
        message: '【出院记录】出院情况未填写。'
      })
    );
  }
  if (!stripTail(d.dischargeDate)) {
    out.push(
      diagnostic({
        code: 'DISCHARGE_DATE_MISSING',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.dischargeDate',
        paths: ['discharge.dischargeDate'],
        action: '填写出院日期',
        message: '【出院记录】出院日期未填写，住院天数无法计算。'
      })
    );
  }
  const advMissing = (['drug', 'nonDrug', 'lifestyle', 'followUp'] as const).filter((k) => !stripTail(adv[k]));
  if (advMissing.length === 4) {
    out.push(
      diagnostic({
        code: 'DISCHARGE_ADVICE_MISSING',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.advice',
        paths: ['discharge.advice'],
        action: '填写出院医嘱',
        message: '【出院记录】出院医嘱未填写（药物、非药物、生活指导、复诊时间四项）。'
      })
    );
  } else if (advMissing.length) {
    const advLabel: Record<(typeof advMissing)[number], string> = {
      drug: '药物治疗',
      nonDrug: '非药物治疗',
      lifestyle: '生活指导',
      followUp: '复诊时间'
    };
    out.push(
      diagnostic({
        code: 'DISCHARGE_ADVICE_MISSING',
        severity: 'warning',
        document: 'discharge',
        path: 'discharge.advice',
        paths: ['discharge.advice'],
        action: '补出院医嘱',
        message: `【出院记录】出院医嘱缺：${advMissing.map((k) => advLabel[k]).join('、')}。`
      })
    );
  }

  if (opts.includeStale !== false) {
    out.push(...staleDocumentWarnings(r));
  }

  out.push(
    ...hpiQualityDiagnostics(r),
    ...factStateDiagnostics(r),
    ...vitalConsistencyDiagnosticsWithContext(ctx)
  );

  return out;
}

/** 兼容旧调用的纯字符串列表，直接由 validateStructured 投影生成 */
export function validate(r: DabingliRecord): string[] {
  return validateStructured(r, { includeStale: false }).map((item) => item.message);
}
