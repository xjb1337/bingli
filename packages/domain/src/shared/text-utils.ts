/* ===========================================================================
 * 领域层共享文本、日期、中文数字与否定作用域原语
 *
 * 统一消除跨 age.ts / depth.ts / hints.ts / document-ir.ts / generator.ts 的
 * 重复日期解析、中文数字/时长解析及中文否定作用域判定逻辑。
 * =========================================================================== */

export interface ParsedDate {
  y: number;
  m: number;
  d: number;
  ms: number;
  text: string;
}

const CN_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

const CN_UNITS: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000
};

/** 全角数字/空格转半角 */
export function toHalfWidth(text: unknown): string {
  return String(text == null ? '' : text)
    .replace(/[\uFF10-\uFF19]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ');
}

/** 去除首尾空白及尾部常见中文标点 */
export function stripTail(s: unknown): string {
  return String(s == null ? '' : s).trim().replace(/[，,；;。\s]+$/g, '');
}

/** 归一化文本用于去重比较（去除空白与标点） */
export function squashText(s: unknown): string {
  return String(s == null ? '' : s).replace(/[\s，,。；;、：:]+/g, '');
}

/**
 * 中文数字（一 ~ 九千九百九十九，含「十」「百」「千」无前导一的写法）转数值；
 * 支持阿拉伯数字与「半」；认不出返回 NaN。
 */
export function cnToNumber(text: unknown): number {
  const s = toHalfWidth(text).trim();
  if (!s) return NaN;
  if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
  if (s === '半') return 0.5;
  let total = 0;
  let section = 0;
  let num = 0;
  let seen = false;
  for (const ch of s) {
    if (ch in CN_DIGITS) {
      num = CN_DIGITS[ch];
      seen = true;
    } else if (ch in CN_UNITS) {
      const unit = CN_UNITS[ch];
      // 「十五」→ 15，「百」→ 100，「千」→ 1000
      if (num === 0 && (unit === 10 || section === 0)) num = 1;
      section += num * unit;
      num = 0;
      seen = true;
    } else if (ch === '零' || ch === '〇') {
      seen = true;
    } else {
      return NaN;
    }
  }
  if (!seen) return NaN;
  total += section + num;
  return total;
}

/** 解析时长数字（额外支持模糊词「数」「几」→ 3） */
export function parseDurationNum(s: unknown): number {
  const clean = toHalfWidth(s).trim();
  if (!clean) return NaN;
  if (clean === '数' || clean === '几') return 3;
  return cnToNumber(clean);
}

/**
 * 统一严格日历日期解析。
 * - dashOnly=true: 仅认 YYYY-MM-DD（月/日可 1 位）
 * - 默认: 支持 YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD / YYYY年M月D日 / YYYYMMDD
 */
export function parseDate(input: unknown, opts?: { dashOnly?: boolean }): ParsedDate | null {
  const s = toHalfWidth(input).trim();
  if (!s) return null;
  let m: RegExpMatchArray | null = null;
  if (opts && opts.dashOnly) {
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  } else {
    m = s.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/) || s.match(/^(\d{4})(\d{2})(\d{2})$/);
  }
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1800 || y > 2200 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return {
    y,
    m: mo,
    d,
    ms,
    text: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  };
}

/** 将「数值 + 时间单位」换算成天数 */
export function toDays(num: number, unit: string): number {
  if (!Number.isFinite(num)) return NaN;
  if (unit === '年') return num * 365;
  if (unit === '月') return num * 30;
  if (unit === '周' || unit === '星期') return num * 7;
  if (unit === '日' || unit === '天') return num;
  if (unit === '小时') return num / 24;
  return NaN;
}

export const DURATION_PATTERN = /([0-9０-９]+(?:\.[0-9０-９]+)?|[一二两三四五六七八九十百千万半数几]+)\s*(?:个)?\s*(年|月|周|日|天|小时)/;

/** 从一段文字里取出第一个时长，换算成天数；取不到返回 NaN */
export function durationDays(text: unknown): number {
  const m = String(text == null ? '' : text).match(DURATION_PATTERN);
  if (!m) return NaN;
  return toDays(parseDurationNum(m[1]), m[2]);
}

/** 从一段文字里取出最长的时长，换算成天数 */
export function maxDurationDays(text: unknown): number {
  const re = new RegExp(DURATION_PATTERN.source, 'g');
  let best = NaN;
  let m: RegExpExecArray | null;
  const src = String(text == null ? '' : text);
  while ((m = re.exec(src)) !== null) {
    const d = toDays(parseDurationNum(m[1]), m[2]);
    if (Number.isFinite(d) && (!Number.isFinite(best) || d > best)) best = d;
  }
  return best;
}

/** 统一计算主诉时长（天数）：兼容独立 unit、带单位 duration 字符串及主诉正文 */
export function chiefComplaintDays(basic: {
  chiefComplaintDuration?: unknown;
  chiefComplaintDurationUnit?: unknown;
  chiefComplaint?: unknown;
} | null | undefined): number {
  const b = basic || {};
  const direct = durationDays(b.chiefComplaintDuration);
  if (Number.isFinite(direct)) return direct;
  const durRaw = stripTail(b.chiefComplaintDuration);
  const unitRaw = stripTail(b.chiefComplaintDurationUnit);
  if (durRaw && unitRaw) {
    const combined = durationDays(durRaw + unitRaw);
    if (Number.isFinite(combined)) return combined;
  }
  return durationDays(b.chiefComplaint);
}

/** 判断文本是否为「光秃秃的时间短语」（无症状、无谓语） */
export function isBareTimeFragment(text: unknown): boolean {
  const value = stripTail(text);
  if (!value) return false;
  return /^(?:约|大约|近|距今|迄今)?[0-9０-９一二三四五六七八九十百千万两半十几数余]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|h|min)(?:余|多|来|左右|之后|以后|前|以前)?$/.test(value);
}

/* ---------------------- 统一中文否定作用域原语 ---------------------- */

/** 句首常见否定前缀（排除「无力/无法/无痛性/无尿/不明原因/不洁」等非否定词头） */
export const NEG_HEAD_RE = /^(?:无明显|无明|未见明显|未见异常|未出现|未见|否认有|否认|没有|无(?!力|法|痛性|尿|休止|规律|奈|助|反应)|未(?!必|知|明)|不(?!(?:明原因|明诱因|详|洁|规则)))/;

/** 非否定词例外前缀 */
export const NEG_EXCEPT_RE = /^(?:不明原因|不明诱因|原因不明|不详|不洁|不规则|无力|无法|无痛性|无尿)/;

/** 起病诱因常见否定短语（「无明显诱因出现发热」只否定诱因，不否定后面的症状） */
export const CAUSE_NEG_PHRASE_RE = /^无(?:明显|何|任何)?(?:诱因|原因|明确诱因|明显原因)/;

/** 否定词作用域内、但本身是阳性表现的病程词（如「加重」「增多」「复发」等） */
export const POSITIVE_CHANGE_RE = /(?:加重|加剧|缓解|好转|减轻|恶化|出现|发生|伴有|伴|再发|复发|增多|减少|持续|反复|转为|变为)/;

/** 句中转折连接词 */
export const TURN_SPLIT_RE = /(但是|但|然而|不过|却|反而)/;
export const TURN_WORD_RE = /^(?:但是|但|然而|不过|却|反而)$/;

/** 并列连接词头 */
export const CONNECT_HEAD_RE = /^(?:同时|另外|此外|并且|伴有|伴|并|且|亦|也|还|仍|尚|又|和|及|与)/;

/** 同一短句内无标点的「阳性+否定」拆分正则（排除「无力/无法/无痛性/无尿」等症状词） */
export const MID_NEG_SPLIT_RE = /(?<=[^，,。；;、\s])(?=无(?!力|法|痛性|尿|奈|助|休止|规律|反应)|未(?!必|知|明)|否认|没有|未见)/;

/** 拆分「连接词+否定」前缀 */
export const CONNECT_NEG_SPLIT_RE = /(?=(?:同时|另外|此外|伴有|伴|并|且)(?:无(?!力|法|痛性|尿)|未|不(?!(?:详|洁|规则))|否认|没有|未见))/;

/**
 * 判断单个分句是否以否定开头（剥离连接词和「无明显诱因」后判断）。
 * 供 hints / depth / document-ir 共用。
 */
export function isNegatedClauseHead(seg: unknown): boolean {
  let t = String(seg == null ? '' : seg).trim();
  if (!t) return false;
  for (let i = 0; i < 3; i++) {
    const m = t.match(CONNECT_HEAD_RE);
    if (!m) break;
    t = t.slice(m[0].length).trim();
  }
  if (!t || NEG_EXCEPT_RE.test(t)) return false;
  let rest = t;
  while (CAUSE_NEG_PHRASE_RE.test(rest)) {
    rest = rest.replace(CAUSE_NEG_PHRASE_RE, '').trim();
  }
  if (rest !== t) {
    return rest ? NEG_HEAD_RE.test(rest) && !NEG_EXCEPT_RE.test(rest) : false;
  }
  return NEG_HEAD_RE.test(t);
}

/**
 * 提取文本中未被否定的阳性叙述片段（处理句界、转折、并列省略否定、无标点中段否定）。
 */
export function extractPositiveNarrative(text: unknown): string {
  const out: string[] = [];
  String(text == null ? '' : text).split(/[。；;\n]/).forEach(sentence => {
    const chunks: string[] = [];
    let buf = '';
    sentence.split(TURN_SPLIT_RE).forEach(piece => {
      if (TURN_WORD_RE.test(piece)) {
        chunks.push(buf);
        buf = '';
      } else {
        buf += piece;
      }
    });
    chunks.push(buf);
    chunks.forEach(chunk => {
      String(chunk || '').split(/[，,]/).forEach(rawSeg => {
        String(rawSeg || '').split(CONNECT_NEG_SPLIT_RE).forEach(seg => {
          String(seg || '').split(MID_NEG_SPLIT_RE).forEach(sub => {
            const t = String(sub || '').trim();
            if (!t || isNegatedClauseHead(t)) return;
            out.push(t);
          });
        });
      });
    });
  });
  return out.join('，');
}

/**
 * 检查某个触发位置在当前分句中是否被前置否定词覆盖。
 */
export function isNegatedBeforeIndex(clause: string, idx: number, windowSize = 8): boolean {
  const before = clause.slice(Math.max(0, idx - windowSize), idx);
  if (/(?:无力|无法|无痛性|无尿)$/.test(before)) return false;
  return /(?:无(?!力|法|痛性|尿)|未见|未出现|未诉|否认|没有|不伴|无明显|未曾|未)/.test(before);
}

/**
 * 规范化「否定范围歧义」：「无发热、咳嗽加重」→「无发热；咳嗽加重」。
 * 不含阳性变化词的普通阴性清单（如「无咯血、盗汗、消瘦」）保持原样。
 */
export function normalizeNegationScope(text: unknown): string {
  const sentences = String(text == null ? '' : text).trim().split(/。/).map(stripTail).filter(Boolean);
  return sentences.map((sentence) => {
    const tokens = sentence.split(/([、，,])/);
    if (tokens.length < 3) return sentence;
    let out = '';
    let inheritedNegative = false;
    tokens.forEach((token, index) => {
      if (index % 2 === 1) {
        out += token;
        return;
      }
      const clause = stripTail(token);
      if (!clause) return;
      const negated = NEG_HEAD_RE.test(clause);
      const positiveTurn = POSITIVE_CHANGE_RE.test(clause);
      if (index > 0 && inheritedNegative && positiveTurn && !negated) {
        out = out.replace(/[、，,]$/, '') + '；';
        inheritedNegative = false;
      }
      out += clause;
      if (negated) inheritedNegative = true;
      else if (positiveTurn) inheritedNegative = false;
    });
    return out.replace(/[、，,；]\s*$/g, '');
  }).join('。');
}
