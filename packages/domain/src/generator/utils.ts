import { parseAge, resolveAge, years as ageYearsApi } from '../age';
import { getPath as coreGetPath, setPath as coreSetPath } from '../core';
import { create as createDiagnostic } from '../quality/diagnostics';
import {
  cnToNumber as sharedCnToNumber,
  NEG_HEAD_RE,
  parseDate as sharedParseDate,
  squashText,
  stripTail as sharedStripTail
} from '../shared/text-utils';
import type {
  DabingliRecord,
  DocumentWarning,
  PeVitalsKey,
  RecordBasicOrRecord
} from '../types';

export type { RecordBasicOrRecord };

export const PH = '／';

export const stripTail = sharedStripTail;
export const squash = squashText;

export function filledOrPH(v: unknown): string {
  return stripTail(v) || PH;
}

export function joinSentences(parts: readonly unknown[], sep = ''): string {
  return parts
    .map((p) => stripTail(p))
    .filter(Boolean)
    .map((p) => `${p}。`)
    .join(sep);
}

export function ensureSentence(text: unknown): string {
  const raw = String(text == null ? '' : text).trim();
  const t = stripTail(raw);
  if (!t) return '';
  if (/^[／/—–-]+$/.test(t)) return t;
  return /[。！？!?；;…]$/.test(raw) ? raw : `${t}。`;
}

export function joinClauses(parts: readonly unknown[]): string[] {
  const sentences: string[][] = [];
  let cur: string[] = [];
  parts.forEach((p) => {
    const t = stripTail(p);
    if (!t) return;
    t.split(/。/)
      .map((s) => stripTail(s))
      .filter(Boolean)
      .forEach((unit, i) => {
        if (i > 0) {
          if (cur.length) sentences.push(cur);
          cur = [];
        }
        cur.push(unit);
      });
  });
  if (cur.length) sentences.push(cur);
  return sentences.map((cs) => cs.join('，')).filter(Boolean);
}

export function joinList(arr: readonly string[]): string {
  return arr.filter(Boolean).join('、');
}

export function splitClauses(text: unknown): string[] {
  return String(text == null ? '' : text)
    .split(/[，,；;。]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function dedupeTexts(texts: readonly string[]): string[] {
  return texts.filter((t, i) => Boolean(t) && texts.indexOf(t) === i);
}

export function dedupeClauses(list: readonly string[]): string[] {
  const seen: string[] = [];
  const out: string[] = [];
  (list || []).forEach((t) => {
    splitClauses(t).forEach((c) => {
      const key = squash(c);
      if (!key || seen.includes(key)) return;
      seen.push(key);
      out.push(c);
    });
  });
  return out;
}

export function deLabel(text: unknown, labels: readonly string[]): string {
  let t = stripTail(text);
  labels.forEach((l) => {
    const re = new RegExp(`^${l}[：:]\\s*`);
    t = t.replace(re, '');
  });
  return stripTail(t);
}

export function splitSentences(text: unknown): string[] {
  const s = String(text == null ? '' : text);
  if (!s) return [];
  const out = s.match(/[^。；;！？!?]+[。；;！？!?]?/g) || [s];
  return out.map((x) => x.trim()).filter(Boolean);
}

export function sentenceKey(sentence: unknown): string {
  return String(sentence == null ? '' : sentence)
    .replace(/\s+/g, '')
    .replace(/[。；;！？!?]+$/, '');
}

export function getPath(obj: unknown, path: string): unknown {
  return coreGetPath(obj, path);
}

export function setPath<T>(obj: T, path: string, value: unknown): T {
  return coreSetPath(obj, path, value);
}

export function diagnostic(input: Parameters<typeof createDiagnostic>[0]): DocumentWarning {
  return createDiagnostic(input);
}

export function asRecord(input: unknown): DabingliRecord | null {
  return input &&
    typeof input === 'object' &&
    'basic' in input &&
    (input as { basic?: unknown }).basic &&
    typeof (input as { basic?: unknown }).basic === 'object'
    ? (input as DabingliRecord)
    : null;
}

export function ageWithUnit(input: RecordBasicOrRecord): string {
  const rec = asRecord(input);
  const basic = rec ? rec.basic : ((input || {}) as Partial<DabingliRecord['basic']>);
  if (rec) {
    const resolved = resolveAge(rec);
    if (resolved.text) return resolved.text;
  }
  const raw = stripTail(basic.age);
  if (!raw) return '';
  const parsed = parseAge(raw);
  if (!parsed.ok) return raw;
  return /[岁月天周时日]/.test(raw) ? raw : `${raw}岁`;
}

export function ageYears(input: RecordBasicOrRecord): number {
  const rec = asRecord(input);
  const basic = rec ? rec.basic : ((input || {}) as Partial<DabingliRecord['basic']>);
  if (rec) {
    const y = ageYearsApi(rec);
    if (Number.isFinite(y)) return y;
  }
  const raw = stripTail(basic.age);
  if (!raw) return NaN;
  if (!/岁/.test(raw) && /[天日周月时]/.test(raw)) return 0;
  const ar = raw.match(/[0-9０-９]+(?:\.[0-9]+)?/);
  if (ar) return parseFloat(ar[0].replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)));
  const cn = raw.match(/[一二三四五六七八九十百]+/);
  if (cn) return sharedCnToNumber(cn[0]);
  return NaN;
}

export function subjectOf(input: RecordBasicOrRecord): string {
  const rec = asRecord(input);
  const basic = rec ? rec.basic : ((input || {}) as Partial<DabingliRecord['basic']>);
  if (rec) {
    const info = resolveAge(rec);
    if (!info.ok) return '患者';
    return info.years < 14 ? '患儿' : '患者';
  }
  const raw = stripTail(basic.age);
  if (!raw) return '患者';
  const parsed = parseAge(raw);
  if (!parsed || !parsed.ok) return '患者';
  return parsed.years < 14 ? '患儿' : '患者';
}

/** 现病史内部去重（含中文省略式否定继承） */
export function mergeIntoHistory(seg: readonly string[], text: unknown): string {
  const t = stripTail(text);
  if (!t) return '';
  const existing = squash(seg.join(''));
  if (!existing) return t;
  const NEG_ANY = /(无|未|否认|没有|未见)/;
  const previous: Array<{ core: string; neg: boolean }> = [];
  seg.forEach((part) => {
    String(part || '')
      .split(/[。；;]/)
      .forEach((sentence) => {
        let negScope = '';
        sentence.split(/[、，,]/).forEach((piece) => {
          const clause = piece.trim();
          if (!clause) return;
          const head = (clause.match(NEG_HEAD_RE) || [''])[0];
          if (head) negScope = head;
          else if (/(出现|伴有|伴|存在|诉|有|患者)/.test(clause)) negScope = '';
          previous.push({ core: squash(clause.replace(NEG_HEAD_RE, '')), neg: !!(head || negScope) });
        });
      });
  });

  if (existing.includes(squash(t))) {
    const tNeg = NEG_HEAD_RE.test(t);
    const tCore = squash(t.replace(NEG_HEAD_RE, ''));
    if (tNeg || previous.some((p) => !p.neg && p.core.includes(tCore))) return '';
  }
  if (/[；;]/.test(t)) return t;
  const clauses = t
    .split(/[、，,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (clauses.length < 2) return t;

  const effective: Array<{ core: string; neg: string; text: string; standAlone: boolean }> = [];
  let prevNeg = '';
  clauses.forEach((c) => {
    const head = (c.match(NEG_HEAD_RE) || [''])[0];
    const core = c.replace(NEG_HEAD_RE, '').trim();
    const standAlone = !head && NEG_ANY.test(c);
    const neg = head || (standAlone ? '' : prevNeg);
    if (head) prevNeg = head;
    effective.push({ core, neg, text: standAlone ? c : core, standAlone });
  });

  const kept = effective.filter((e) => {
    if (e.standAlone) return !existing.includes(squash(e.text));
    const core = squash(e.core);
    return !previous.some((p) => p.core === core && p.neg === !!e.neg);
  });
  if (kept.length === effective.length) return t;
  if (!kept.length) return '';

  const groups: Array<{ neg: string; items: string[] }> = [];
  kept.forEach((e) => {
    const last = groups[groups.length - 1];
    if (last && last.neg === e.neg && !e.standAlone) last.items.push(e.text);
    else groups.push({ neg: e.neg, items: [e.text] });
  });
  return groups.map((g) => g.neg + g.items.join('、')).join('，');
}

/* ---------------------- 生命体征 ---------------------- */

export const VITAL_RANGE: Readonly<Record<string, readonly [number, number, string]>> = {
  temperature: [34, 43, '体温'],
  pulse: [20, 250, '脉搏'],
  respiration: [5, 80, '呼吸'],
  sbp: [50, 300, '收缩压'],
  dbp: [20, 200, '舒张压'],
  height: [30, 250, '身高'],
  weight: [1, 300, '体重'],
  abdCirc: [20, 200, '腹围'],
  headCirc: [20, 70, '头围'],
  chestCirc: [20, 120, '胸围']
};

export const VITAL_TEXT_KEYS: readonly string[] = [
  'temperature',
  'pulse',
  'respiration',
  'sbp',
  'dbp',
  'height',
  'weight',
  'headCirc',
  'chestCirc',
  'abdCirc'
];

export interface VitalNumValue {
  raw: string;
  num: number;
}

export function vitalValue(v: unknown): string {
  return v === undefined || v === null || v === '' ? '' : String(v).trim();
}

export function vitalNum(v: Record<string, unknown> | null | undefined, key: string): VitalNumValue | null {
  const raw = vitalValue((v || {})[key]);
  if (!raw) return null;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  const rng = VITAL_RANGE[key];
  if (rng && (num < rng[0] || num > rng[1])) return null;
  return { raw, num };
}

export function vitalSnapshot(vitals: Record<string, unknown> | null | undefined): Record<string, VitalNumValue> {
  const out: Record<string, VitalNumValue> = {};
  VITAL_TEXT_KEYS.forEach((key) => {
    const hit = vitalNum(vitals || {}, key);
    if (hit) out[key] = hit;
  });
  return out;
}

interface VitalAgeRule {
  maxAge: number;
  adult?: boolean;
  pulse: readonly [number, number];
  respiration: readonly [number, number];
  sbpLow: (age: number) => number;
}

const VITAL_ABNORMAL_BY_AGE: readonly VitalAgeRule[] = [
  { maxAge: 1, pulse: [100, 160], respiration: [30, 53], sbpLow: () => 70 },
  { maxAge: 3, pulse: [90, 150], respiration: [22, 37], sbpLow: (age) => 70 + 2 * age },
  { maxAge: 6, pulse: [80, 140], respiration: [20, 28], sbpLow: (age) => 70 + 2 * age },
  { maxAge: 12, pulse: [70, 120], respiration: [18, 25], sbpLow: (age) => Math.min(90, 70 + 2 * age) },
  { maxAge: 14, pulse: [60, 100], respiration: [12, 20], sbpLow: () => 90 },
  { maxAge: Infinity, adult: true, pulse: [60, 100], respiration: [12, 20], sbpLow: () => 90 }
];

function resolvedVitalYears(r: DabingliRecord): number {
  const info = resolveAge(r);
  if (info && info.ok && Number.isFinite(info.years)) return info.years;
  return ageYears(r);
}

function vitalAgeRule(r: DabingliRecord): VitalAgeRule {
  const years = resolvedVitalYears(r);
  const adult = VITAL_ABNORMAL_BY_AGE[VITAL_ABNORMAL_BY_AGE.length - 1];
  if (!Number.isFinite(years)) return adult;
  const age = Math.max(0, Math.floor(years));
  for (const rule of VITAL_ABNORMAL_BY_AGE) {
    if (age < rule.maxAge) return rule;
  }
  return adult;
}

export function abnormalVitalFindings(
  r: DabingliRecord,
  precomputedVitals?: Record<string, VitalNumValue>
): string[] {
  const vitals = precomputedVitals || vitalSnapshot(((r.pe || {}).vitals || {}) as Record<string, unknown>);
  const rule = vitalAgeRule(r);
  const years = resolvedVitalYears(r);
  const age = Number.isFinite(years) ? Math.max(0, Math.floor(years)) : 0;
  const parts: string[] = [];
  if (vitals.temperature && (vitals.temperature.num >= 37.3 || vitals.temperature.num < 36.0)) {
    parts.push(`T ${vitals.temperature.raw}℃`);
  }
  if (vitals.pulse && (vitals.pulse.num > rule.pulse[1] || vitals.pulse.num < rule.pulse[0])) {
    parts.push(`P ${vitals.pulse.raw}次/分`);
  }
  if (vitals.respiration && (vitals.respiration.num > rule.respiration[1] || vitals.respiration.num < rule.respiration[0])) {
    parts.push(`R ${vitals.respiration.raw}次/分`);
  }
  let bpAbnormal = false;
  if (rule.adult) {
    if (vitals.sbp && (vitals.sbp.num >= 140 || vitals.sbp.num < 90)) bpAbnormal = true;
    if (vitals.dbp && (vitals.dbp.num >= 90 || vitals.dbp.num < 60)) bpAbnormal = true;
  } else if (vitals.sbp && vitals.sbp.num < rule.sbpLow(age)) {
    bpAbnormal = true;
  }
  if (bpAbnormal) {
    parts.push(`BP ${vitals.sbp ? vitals.sbp.raw : '—'}/${vitals.dbp ? vitals.dbp.raw : '—'}mmHg`);
  }
  return parts;
}

/* ---------------------- 日期计算（统一使用 shared/text-utils） ---------------------- */

export function parseDateStrict(s: unknown): { y: number; mo: number; d: number; stamp: number; text: string } | null {
  const t = stripTail(s);
  if (!t) return null;
  const p = sharedParseDate(t, { dashOnly: true });
  if (!p) return null;
  return { y: p.y, mo: p.m, d: p.d, stamp: p.ms, text: p.text };
}

export function hospitalDays(admitDate: unknown, dischargeDate: unknown): number | null {
  const a = parseDateStrict(admitDate);
  const b = parseDateStrict(dischargeDate);
  if (!a || !b) return null;
  const diff = Math.round((b.stamp - a.stamp) / 86400000);
  if (diff < 0) return null;
  return diff;
}

export const SECTION_ORDER: readonly string[] = [
  '一般项目',
  '主诉',
  '现病史',
  '既往史',
  '个人史',
  '婚育史',
  '家族史',
  '体格检查（一）',
  '体格检查（二）：补充及专科情况',
  '实验室检查',
  '特殊检查',
  '初步诊断'
];

export const ADMISSION_CONSENT = '患者确认以上病史签名：＿＿＿＿';

export const HISTORY_SECTION_KEYS: readonly string[] = ['现病史', '既往史', '个人史', '系统回顾'];

export const HISTORY_FIELD_PATHS: readonly string[] = [
  'hpi.onset', 'hpi.cause', 'hpi.symptoms', 'hpi.aggravating', 'hpi.relief', 'hpi.evolution',
  'hpi.accompanying', 'hpi.negativeDiscriminating', 'hpi.negativePertinent', 'hpi.treatment',
  'hpi.generalCondition', 'hpi.extra',
  'pmh.diseaseDetail', 'pmh.longTermMeds', 'pmh.infection',
  'pmh.surgery', 'pmh.trauma', 'pmh.transfusion', 'pmh.poisoning',
  'pmh.vaccine', 'pmh.allergenOther', 'pmh.allergyReaction',
  'pmh.relatedHistory', 'pmh.otherTreatDiseases', 'pmh.special',
  'personal.maternal', 'personal.birth', 'personal.feeding', 'personal.growth',
  'personal.residence', 'personal.travel',
  'personal.drugs', 'personal.environment', 'personal.habits', 'personal.sexualHistory',
  'personal.occupationEnv', 'personal.premorbidPersonality', 'personal.stressEvent'
];

// Keep PeVitalsKey referenced cleanly
export type _VitalKeyRef = PeVitalsKey;
