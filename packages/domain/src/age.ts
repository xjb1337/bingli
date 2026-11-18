/* ===========================================================================
 * 年龄解析与换算 —— 界面、生成器、诊断提示共用同一套口径
 *
 * 解决的问题：
 *   - 列表页把「14日龄」再拼一个「岁」，显示成「14日龄岁」
 *   - 出生日期 + 入院日期能算年龄，但生成时只看手填的 age
 *   - 儿科/成人判断各写一套 parseInt，月龄、日龄被当成 0 岁或 14 岁
 *   - 电脑当天日期变化会让同一个病历的年龄漂移
 * =========================================================================== */

import {
  cnToNumber,
  parseDate as sharedParseDate,
  toHalfWidth,
  type ParsedDate
} from './shared/text-utils';
import type { BasicSection, DabingliRecord } from './types';

export type AgeKind = 'years' | 'months' | 'days' | 'weeks' | 'ym' | 'none';

export interface ParsedAge {
  ok: boolean;
  kind: AgeKind;
  value: number;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  text: string;
  raw: string;
  reason: string;
}

export interface AgePartsInput {
  days?: number;
  months?: number;
  years?: number;
}

export interface ComputedAge {
  ok: boolean;
  reason?: string;
  birthDate: string;
  refDate: string;
  totalDays?: number;
  days?: number;
  months?: number;
  years?: number;
  text?: string;
}

export interface ResolvedAge {
  ok: boolean;
  text: string;
  years: number;
  kind: AgeKind;
  source: 'birthDate' | 'manual' | 'none';
  refDate: string;
  pending: boolean;
  computed: ComputedAge | null;
  manual: ParsedAge;
  mismatch: boolean;
  birthDate: string;
  reason: string;
}

export type AgeRecordInput =
  | DabingliRecord
  | { basic?: Partial<BasicSection> | null }
  | Partial<BasicSection>
  | null
  | undefined;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 去掉数值尾部的小数点/零，用于展示 */
function trimNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(Math.round(n * 100) / 100);
}

export { cnToNumber };

/** 严格解析 YYYY-MM-DD / YYYY/MM/DD / YYYY年M月D日 / YYYYMMDD */
export function parseDate(input: unknown): ParsedDate | null {
  return sharedParseDate(input);
}

/**
 * 统一展示口径：
 *   < 30 天 → 「X日龄」
 *   < 12 月 → 「X月龄」
 *   学龄前（< 6 岁）有零头月份 → 儿科习惯写法「X岁X个月」，不写成小数岁（覆盖「3岁半」→「3岁6个月」）
 *   其余    → 「X岁」（成人保持整岁，避免「62岁7个月」；「6岁半」等显式小数仍保留）
 */
export function formatAge(parts?: AgePartsInput | null): string {
  const p = parts || {};
  const days = Number(p.days);
  const months = Number(p.months);
  const years = Number(p.years);
  if (Number.isFinite(days) && days >= 0 && days < 30) return `${Math.round(days)}日龄`;
  if (Number.isFinite(months) && months >= 0 && months < 12) {
    const roundedMonths = Math.round(months);
    if (roundedMonths === 0 && Number.isFinite(days) && days >= 30) return '1月龄';
    return `${roundedMonths}月龄`;
  }
  if (Number.isFinite(years) && years >= 0) {
    const totalMonths = (Number.isFinite(months) && months >= 0) ? months : years * 12;
    let wholeYears = Math.floor(totalMonths / 12 + 1e-9);
    let extraMonths = Math.round(totalMonths - wholeYears * 12);
    if (extraMonths >= 12) {
      wholeYears += 1;
      extraMonths -= 12;
    }
    if (wholeYears >= 1 && wholeYears < 6 && extraMonths > 0) return `${wholeYears}岁${extraMonths}个月`;
    if (wholeYears === 0 && extraMonths > 0) return `${extraMonths}月龄`;
    return `${trimNumber(years)}岁`;
  }
  if (Number.isFinite(months) && months >= 0) return `${Math.round(months)}月龄`;
  if (Number.isFinite(days) && days >= 0) return `${Math.round(days)}日龄`;
  return '';
}

/**
 * 解析年龄文本。支持：
 *   65 / 65岁 / 65周岁 / 六十五岁
 *   7月 / 7个月 / 7月龄 / 六个月
 *   14天 / 14日 / 14日龄
 *   3周 / 3星期
 *   1岁3月 / 1岁3个月 / 1岁半 / 3岁半
 */
export function parseAge(input: unknown): ParsedAge {
  const raw = toHalfWidth(input).trim();
  const empty: ParsedAge = {
    ok: false,
    kind: 'none',
    value: NaN,
    years: NaN,
    months: NaN,
    days: NaN,
    totalDays: NaN,
    text: '',
    raw,
    reason: 'empty'
  };
  if (!raw) return empty;

  const clean = raw.replace(/\s+/g, '').replace(/。$/, '');

  // 1岁3个月 / 1岁半 / 1岁3月
  let m = clean.match(/^(.+?)岁(半|(.+?)(?:个)?月)?$/);
  if (m) {
    const y = cnToNumber(m[1]);
    if (!Number.isFinite(y) || y < 0) return { ...empty, ok: false, reason: 'invalid' };
    let extraMonths = 0;
    if (m[2] === '半') extraMonths = 6;
    else if (m[3] !== undefined) {
      const mm = cnToNumber(m[3]);
      if (!Number.isFinite(mm) || mm < 0 || mm >= 12) return { ...empty, ok: false, reason: 'invalid' };
      extraMonths = mm;
    }
    const yrs = y + extraMonths / 12;
    return {
      ok: true,
      kind: extraMonths ? 'ym' : 'years',
      value: yrs,
      years: yrs,
      months: y * 12 + extraMonths,
      days: Math.round(yrs * 365.2425),
      totalDays: Math.round(yrs * 365.2425),
      text: formatAge({ years: yrs, months: y * 12 + extraMonths }),
      raw,
      reason: ''
    };
  }

  // 7月 / 7个月 / 7月龄
  m = clean.match(/^(.+?)(?:个)?月(?:龄)?$/);
  if (m) {
    const v = cnToNumber(m[1]);
    if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
    return {
      ok: true,
      kind: 'months',
      value: v,
      years: v / 12,
      months: v,
      days: Math.round(v * 30.436875),
      totalDays: Math.round(v * 30.436875),
      text: formatAge({ months: v }),
      raw,
      reason: ''
    };
  }

  // 14天 / 14日 / 14日龄
  m = clean.match(/^(.+?)(?:天|日)(?:龄)?$/);
  if (m) {
    const v = cnToNumber(m[1]);
    if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
    return {
      ok: true,
      kind: 'days',
      value: v,
      years: v / 365.2425,
      months: v / 30.436875,
      days: v,
      totalDays: v,
      text: formatAge({ days: v }),
      raw,
      reason: ''
    };
  }

  // 3周 / 3星期
  m = clean.match(/^(.+?)(?:周|星期|礼拜)$/);
  if (m) {
    const v = cnToNumber(m[1]);
    if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
    return {
      ok: true,
      kind: 'weeks',
      value: v,
      years: v * 7 / 365.2425,
      months: v * 7 / 30.436875,
      days: v * 7,
      totalDays: v * 7,
      text: formatAge({ days: v * 7 }),
      raw,
      reason: ''
    };
  }

  // 纯数字 / 65岁 / 65周岁
  m = clean.match(/^(.+?)(?:周)?岁$/);
  const bare = m ? m[1] : clean;
  if (/^[\d.]+$/.test(bare) || /^[零〇一二两三四五六七八九十百千]+$/.test(bare)) {
    const v = cnToNumber(bare);
    if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
    return {
      ok: true,
      kind: 'years',
      value: v,
      years: v,
      months: v * 12,
      days: Math.round(v * 365.2425),
      totalDays: Math.round(v * 365.2425),
      text: formatAge({ years: v }),
      raw,
      reason: ''
    };
  }

  return { ...empty, ok: false, reason: 'unrecognized' };
}

/** 两个日期之间的完整年/月/日（按日历，不按 365 天近似） */
export function ageFromDates(
  birthInput: ParsedDate | string | null | undefined,
  refInput: ParsedDate | string | null | undefined
): ComputedAge {
  const birth = typeof birthInput === 'object' && birthInput ? birthInput : parseDate(birthInput);
  const ref = typeof refInput === 'object' && refInput ? refInput : parseDate(refInput);
  if (!birth || !ref) {
    return { ok: false, reason: 'invalid-date', birthDate: birth ? birth.text : '', refDate: ref ? ref.text : '' };
  }
  if (ref.ms < birth.ms) {
    return { ok: false, reason: 'before-birth', birthDate: birth.text, refDate: ref.text };
  }

  const totalDays = Math.round((ref.ms - birth.ms) / DAY_MS);
  let yr = ref.y - birth.y;
  if (ref.m < birth.m || (ref.m === birth.m && ref.d < birth.d)) yr--;
  let mo = (ref.y - birth.y) * 12 + (ref.m - birth.m);
  if (ref.d < birth.d) mo--;
  if (mo < 0) mo = 0;
  if (yr < 0) yr = 0;

  return {
    ok: true,
    totalDays,
    days: totalDays,
    months: mo,
    years: yr,
    birthDate: birth.text,
    refDate: ref.text,
    text: formatAge({ days: totalDays, months: mo, years: yr })
  };
}

function yearsOf(parsed: ParsedAge | null | undefined): number {
  if (!parsed || !parsed.ok) return NaN;
  return parsed.years;
}

/** 人工年龄与出生日期算出的年龄是否「明显不一致」 */
export function isMismatch(manual: ParsedAge | null | undefined, computed: ComputedAge | null | undefined): boolean {
  if (!manual || !manual.ok || !computed || !computed.ok) return false;
  if (manual.kind === 'years' || manual.kind === 'ym') {
    return Math.abs(manual.years - (computed.years ?? 0)) >= 1;
  }
  if (manual.kind === 'months') {
    return Math.abs(manual.months - (computed.months ?? 0)) >= 2;
  }
  if (manual.kind === 'days' || manual.kind === 'weeks') {
    return Math.abs(manual.totalDays - (computed.totalDays ?? 0)) > 14;
  }
  return false;
}

function extractBasic(record: AgeRecordInput): Partial<BasicSection> {
  if (!record || typeof record !== 'object') return {};
  if ('basic' in record && record.basic && typeof record.basic === 'object') {
    return record.basic;
  }
  return record as Partial<BasicSection>;
}

/**
 * 解析一份病历的年龄。参考日期只用入院日期/记录日期，**不用电脑当天**，
 * 保证同一份病历在任何时间打开都是同一个年龄。
 */
export function resolveAge(record: AgeRecordInput): ResolvedAge {
  const b = extractBasic(record);
  const manual = parseAge(b.age);
  const birth = parseDate(b.birthDate);
  const refRaw = b.admitDate || b.recordDate || '';
  const ref = parseDate(refRaw);

  if (birth) {
    if (ref) {
      const computed = ageFromDates(birth, ref);
      if (computed.ok) {
        const cTotalDays = computed.totalDays ?? 0;
        const cMonths = computed.months ?? 0;
        const kind: AgeKind = cTotalDays < 30 ? 'days' : (cMonths < 12 ? 'months' : 'years');
        return {
          ok: true,
          text: computed.text || '',
          years: computed.years ?? 0,
          kind,
          source: 'birthDate',
          refDate: computed.refDate,
          pending: false,
          computed,
          manual,
          mismatch: isMismatch(manual, computed),
          birthDate: computed.birthDate,
          reason: ''
        };
      }
      return {
        ok: false,
        text: manual.ok ? manual.text : '',
        years: yearsOf(manual),
        kind: manual.kind,
        source: manual.ok ? 'manual' : 'none',
        refDate: String(refRaw),
        pending: false,
        computed: null,
        manual,
        mismatch: false,
        birthDate: birth.text,
        reason: computed.reason || 'invalid'
      };
    }
    // 有出生日期但没有入院日期：明确标记「待计算」，不用今天兜底
    return {
      ok: manual.ok,
      text: manual.ok ? manual.text : '',
      years: yearsOf(manual),
      kind: manual.kind,
      source: manual.ok ? 'manual' : 'none',
      refDate: '',
      pending: true,
      computed: null,
      manual,
      mismatch: false,
      birthDate: birth.text,
      reason: 'no-reference-date'
    };
  }

  if (manual.ok) {
    return {
      ok: true,
      text: manual.text,
      years: manual.years,
      kind: manual.kind,
      source: 'manual',
      refDate: ref ? ref.text : '',
      pending: false,
      computed: null,
      manual,
      mismatch: false,
      birthDate: '',
      reason: ''
    };
  }

  return {
    ok: false,
    text: '',
    years: NaN,
    kind: 'none',
    source: 'none',
    refDate: ref ? ref.text : '',
    pending: false,
    computed: null,
    manual,
    mismatch: false,
    birthDate: '',
    reason: manual.reason || 'empty'
  };
}

/** 生成器/提示共用的岁数：月龄日龄按 0 岁处理，未知返回 NaN */
export function years(record: AgeRecordInput): number {
  const r = resolveAge(record);
  if (!r.ok) return NaN;
  if (r.kind === 'days' || r.kind === 'months') return 0;
  return r.years;
}

export function isChild(record: AgeRecordInput): boolean {
  const y = years(record);
  return Number.isFinite(y) ? y < 14 : false;
}

export function isInfant(record: AgeRecordInput): boolean {
  const r = resolveAge(record);
  if (!r.ok) return false;
  if (r.computed && r.computed.totalDays !== undefined) return r.computed.totalDays < 365;
  return r.kind === 'days' || r.kind === 'months';
}

export function isElderly(record: AgeRecordInput): boolean {
  const y = years(record);
  return Number.isFinite(y) ? y >= 65 : false;
}

/** 展示「年龄：X」时统一走这里，避免各处再拼单位 */
export function display(record: AgeRecordInput): string {
  return resolveAge(record).text;
}

export const AGE = {
  DAY_MS,
  parseAge,
  parseDate,
  ageFromDates,
  formatAge,
  resolveAge,
  years,
  isChild,
  isInfant,
  isElderly,
  display,
  isMismatch,
  cnToNumber
};

export default AGE;
