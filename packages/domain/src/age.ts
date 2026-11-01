/* ===========================================================================
 * 年龄解析与换算 —— 界面、生成器、诊断提示共用同一套口径
 *
 * 解决的问题（旧实现散落在 generator / hints / app 三处正则里）：
 *   - 列表页把「14日龄」再拼一个「岁」，显示成「14日龄岁」
 *   - 出生日期 + 入院日期能算年龄，但生成时只看手填的 age
 *   - 儿科/成人判断各写一套 parseInt，月龄、日龄被当成 0 岁或 14 岁
 *   - 电脑当天日期变化会让同一个病历的年龄漂移
 *
 * 本文件零依赖、不读写存储、不碰 DOM，可以在 node:test 里直接测。
 * =========================================================================== */

const AGE = (() => {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;

  const CN_DIGITS = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const CN_UNITS = { 十: 10, 百: 100, 千: 1000 };

  /** 中文数字（一 ~ 九百九十九）转数值；认不出返回 NaN */
  function cnToNumber(text) {
    const s = String(text || '').trim();
    if (!s) return NaN;
    if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
    let total = 0;
    let section = 0;
    let number = 0;
    let seen = false;
    for (const ch of s) {
      if (ch in CN_DIGITS) {
        number = CN_DIGITS[ch];
        seen = true;
      } else if (ch in CN_UNITS) {
        const unit = CN_UNITS[ch];
        if (number === 0 && unit === 10) number = 1; // 十五 → 15
        section += number * unit;
        number = 0;
        seen = true;
      } else if (ch === '零' || ch === '〇') {
        seen = true;
      } else {
        return NaN;
      }
    }
    if (!seen) return NaN;
    total += section + number;
    return total;
  }

  function toHalfWidth(text) {
    return String(text == null ? '' : text)
      .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/\u3000/g, ' ');
  }

  /** 去掉数值尾部的小数点/零，用于展示 */
  function trimNumber(n) {
    if (!Number.isFinite(n)) return '';
    return String(Math.round(n * 100) / 100);
  }

  /**
   * 解析年龄文本。支持：
   *   65 / 65岁 / 65周岁 / 六十五岁
   *   7月 / 7个月 / 7月龄 / 六个月
   *   14天 / 14日 / 14日龄
   *   3周 / 3星期
   *   1岁3月 / 1岁3个月 / 1岁半
   * @returns {{ok:boolean, kind:'years'|'months'|'days'|'weeks'|'ym'|'none',
   *            value:number, years:number, months:number, days:number,
   *            totalDays:number, text:string, raw:string, reason:string}}
   */
  function parseAge(input) {
    const raw = toHalfWidth(input).trim();
    const empty = { ok: false, kind: 'none', value: NaN, years: NaN, months: NaN, days: NaN, totalDays: NaN, text: '', raw, reason: 'empty' };
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
      const years = y + extraMonths / 12;
      return {
        ok: true, kind: extraMonths ? 'ym' : 'years', value: years,
        years, months: y * 12 + extraMonths, days: Math.round(years * 365.2425),
        totalDays: Math.round(years * 365.2425), text: formatAge({ years }), raw, reason: ''
      };
    }

    // 7月 / 7个月 / 7月龄
    m = clean.match(/^(.+?)(?:个)?月(?:龄)?$/);
    if (m) {
      const v = cnToNumber(m[1]);
      if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
      return {
        ok: true, kind: 'months', value: v,
        years: v / 12, months: v, days: Math.round(v * 30.436875),
        totalDays: Math.round(v * 30.436875), text: formatAge({ months: v }), raw, reason: ''
      };
    }

    // 14天 / 14日 / 14日龄
    m = clean.match(/^(.+?)(?:天|日)(?:龄)?$/);
    if (m) {
      const v = cnToNumber(m[1]);
      if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
      return {
        ok: true, kind: 'days', value: v,
        years: v / 365.2425, months: v / 30.436875, days: v,
        totalDays: v, text: formatAge({ days: v }), raw, reason: ''
      };
    }

    // 3周 / 3星期
    m = clean.match(/^(.+?)(?:周|星期|礼拜)$/);
    if (m) {
      const v = cnToNumber(m[1]);
      if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
      return {
        ok: true, kind: 'weeks', value: v,
        years: v * 7 / 365.2425, months: v * 7 / 30.436875, days: v * 7,
        totalDays: v * 7, text: formatAge({ days: v * 7 }), raw, reason: ''
      };
    }

    // 纯数字 / 65岁 / 65周岁
    m = clean.match(/^(.+?)(?:周)?岁$/);
    const bare = m ? m[1] : clean;
    if (/^[\d.]+$/.test(bare) || /^[零〇一二两三四五六七八九十百千]+$/.test(bare)) {
      const v = cnToNumber(bare);
      if (!Number.isFinite(v) || v < 0) return { ...empty, ok: false, reason: 'invalid' };
      return {
        ok: true, kind: 'years', value: v,
        years: v, months: v * 12, days: Math.round(v * 365.2425),
        totalDays: Math.round(v * 365.2425), text: formatAge({ years: v }), raw, reason: ''
      };
    }

    return { ...empty, ok: false, reason: 'unrecognized' };
  }

  /**
   * 统一展示口径：
   *   < 30 天 → 「X日龄」
   *   < 12 月 → 「X月龄」
   *   其余    → 「X岁」
   * 这样列表页/生成器再拼单位也不会出现「14日龄岁」。
   */
  function formatAge(parts) {
    const p = parts || {};
    const days = Number(p.days);
    const months = Number(p.months);
    const years = Number(p.years);
    if (Number.isFinite(days) && days >= 0 && days < 30) return `${Math.round(days)}日龄`;
    if (Number.isFinite(months) && months >= 0 && months < 12) return `${Math.round(months)}月龄`;
    if (Number.isFinite(years) && years >= 0) return `${trimNumber(years)}岁`;
    if (Number.isFinite(months) && months >= 0) return `${Math.round(months)}月龄`;
    if (Number.isFinite(days) && days >= 0) return `${Math.round(days)}日龄`;
    return '';
  }

  /** 严格解析 YYYY-MM-DD / YYYY/MM/DD / YYYY年M月D日 / YYYYMMDD */
  function parseDate(input) {
    const s = toHalfWidth(input).trim();
    if (!s) return null;
    let m = s.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
    if (!m) m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const ms = Date.UTC(y, mo - 1, d);
    const check = new Date(ms);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    return { y, m: mo, d, ms, text: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}` };
  }

  /** 两个日期之间的完整年/月/日（按日历，不按 365 天近似） */
  function ageFromDates(birthInput, refInput) {
    const birth = typeof birthInput === 'object' && birthInput ? birthInput : parseDate(birthInput);
    const ref = typeof refInput === 'object' && refInput ? refInput : parseDate(refInput);
    if (!birth || !ref) return { ok: false, reason: 'invalid-date', birthDate: birth ? birth.text : '', refDate: ref ? ref.text : '' };
    if (ref.ms < birth.ms) return { ok: false, reason: 'before-birth', birthDate: birth.text, refDate: ref.text };

    const totalDays = Math.round((ref.ms - birth.ms) / DAY_MS);
    let years = ref.y - birth.y;
    if (ref.m < birth.m || (ref.m === birth.m && ref.d < birth.d)) years--;
    let months = (ref.y - birth.y) * 12 + (ref.m - birth.m);
    if (ref.d < birth.d) months--;
    if (months < 0) months = 0;
    if (years < 0) years = 0;

    return {
      ok: true,
      totalDays,
      days: totalDays,
      months,
      years,
      birthDate: birth.text,
      refDate: ref.text,
      text: formatAge({ days: totalDays, months, years })
    };
  }

  function yearsOf(parsed) {
    if (!parsed || !parsed.ok) return NaN;
    return parsed.years;
  }

  /** 人工年龄与出生日期算出的年龄是否「明显不一致」 */
  function isMismatch(manual, computed) {
    if (!manual || !manual.ok || !computed || !computed.ok) return false;
    if (manual.kind === 'years' || manual.kind === 'ym') {
      return Math.abs(manual.years - computed.years) >= 1;
    }
    if (manual.kind === 'months') {
      return Math.abs(manual.months - computed.months) >= 2;
    }
    if (manual.kind === 'days' || manual.kind === 'weeks') {
      return Math.abs(manual.totalDays - computed.totalDays) > 14;
    }
    return false;
  }

  /**
   * 解析一份病历的年龄。参考日期只用入院日期/记录日期，**不用电脑当天**，
   * 保证同一份病历在任何时间打开都是同一个年龄。
   *
   * @returns {{ok:boolean, text:string, years:number, kind:string, source:'birthDate'|'manual'|'none',
   *            refDate:string, pending:boolean, computed:object|null, manual:object,
   *            mismatch:boolean, birthDate:string, reason:string}}
   */
  function resolveAge(record) {
    const r = record && record.basic ? record : { basic: record || {} };
    const b = r.basic || {};
    const manual = parseAge(b.age);
    const birth = parseDate(b.birthDate);
    const refRaw = b.admitDate || b.recordDate || '';
    const ref = parseDate(refRaw);

    if (birth) {
      if (ref) {
        const computed = ageFromDates(birth, ref);
        if (computed.ok) {
          return {
            ok: true,
            text: computed.text,
            years: computed.years,
            kind: computed.totalDays < 30 ? 'days' : (computed.months < 12 ? 'months' : 'years'),
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
          ok: false, text: manual.ok ? manual.text : '', years: yearsOf(manual), kind: manual.kind,
          source: manual.ok ? 'manual' : 'none', refDate: refRaw, pending: false,
          computed: null, manual, mismatch: false, birthDate: birth.text, reason: computed.reason
        };
      }
      // 有出生日期但没有入院日期：明确标记「待计算」，不用今天兜底
      return {
        ok: manual.ok, text: manual.ok ? manual.text : '', years: yearsOf(manual), kind: manual.kind,
        source: manual.ok ? 'manual' : 'none', refDate: '', pending: true,
        computed: null, manual, mismatch: false, birthDate: birth.text, reason: 'no-reference-date'
      };
    }

    if (manual.ok) {
      return {
        ok: true, text: manual.text, years: manual.years, kind: manual.kind,
        source: 'manual', refDate: ref ? ref.text : '', pending: false,
        computed: null, manual, mismatch: false, birthDate: '', reason: ''
      };
    }

    return {
      ok: false, text: '', years: NaN, kind: 'none', source: 'none',
      refDate: ref ? ref.text : '', pending: false, computed: null, manual,
      mismatch: false, birthDate: '', reason: manual.reason || 'empty'
    };
  }

  /** 生成器/提示共用的岁数：月龄日龄按 0 岁处理，未知返回 NaN */
  function years(record) {
    const r = resolveAge(record);
    if (!r.ok) return NaN;
    if (r.kind === 'days' || r.kind === 'months') return 0;
    return r.years;
  }

  function isChild(record) {
    const y = years(record);
    return Number.isFinite(y) ? y < 14 : false;
  }

  function isInfant(record) {
    const r = resolveAge(record);
    if (!r.ok) return false;
    if (r.computed) return r.computed.totalDays < 365;
    return r.kind === 'days' || r.kind === 'months';
  }

  function isElderly(record) {
    const y = years(record);
    return Number.isFinite(y) ? y >= 65 : false;
  }

  /** 展示「年龄：X」时统一走这里，避免各处再拼单位 */
  function display(record) {
    return resolveAge(record).text;
  }

  return {
    DAY_MS, parseAge, parseDate, ageFromDates, formatAge, resolveAge,
    years, isChild, isInfant, isElderly, display, isMismatch, cnToNumber
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AGE;
}
