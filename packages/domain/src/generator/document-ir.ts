/**
 * Document intermediate representation. This module is deliberately free of
 * DOM APIs: generators produce this JSON-shaped tree and renderers decide how
 * to display it (plain text, HTML, or a future editor).
 */

/** @typedef {'record'|'firstCourse'|'discharge'} DocumentKind */

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function stripTail(value) {
  return clean(value).replace(/[，,；;。\s]+$/g, '');
}

function bodyLines(value) {
  const lines = String(value == null ? '' : value).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines;
}

function warningList(warnings) {
  return (Array.isArray(warnings) ? warnings : []).map((w) => {
    if (typeof w === 'string') {
      return { code: 'GENERAL', severity: 'info', message: clean(w), path: 'document', paths: ['document'] };
    }
    const paths = Array.isArray(w && w.paths) ? w.paths.map(clean).filter(Boolean) : [];
    const path = clean(w && w.path) || paths[0] || 'document';
    if (!paths.includes(path)) paths.unshift(path);
    return {
      code: clean(w && w.code) || 'GENERAL',
      severity: clean(w && w.severity) || 'info',
      message: clean(w && w.message),
      path,
      paths,
      document: w && w.document,
      action: w && w.action,
      evidence: Array.isArray(w && w.evidence) ? w.evidence.slice() : []
    };
  });
}

function section(title, body, facts, warnings, heading) {
  return {
    title,
    heading: clean(heading) || title,
    paragraphs: bodyLines(body),
    facts: Array.isArray(facts) ? facts.slice() : [],
    warnings: warningList(warnings)
  };
}

function createFact(input) {
  const source = input || {};
  const text = clean(source.text);
  const path = clean(source.path);
  if (!path || !text) return null;
  return {
    path,
    text,
    polarity: source.polarity === 'positive' || source.polarity === 'negative' ? source.polarity : 'unknown',
    state: clean(source.state) || '',
    source: clean(source.source) || 'unknown',
    reviewed: source.reviewed === true,
    evidence: Array.isArray(source.evidence) ? source.evidence.slice() : [{ path, text }],
    onset: clean(source.onset) || undefined,
    duration: clean(source.duration) || undefined,
    laterality: clean(source.laterality) || undefined
  };
}

function documentFromSections(kind, title, sections, warnings, prefix) {
  const list = (Array.isArray(sections) ? sections : []).map((item) => {
    if (!item) return null;
    if (typeof item === 'string') return section(item, '', [], []);
    return {
      title: clean(item.title),
      heading: clean(item.heading) || clean(item.title),
      paragraphs: Array.isArray(item.paragraphs)
        ? bodyLines(item.paragraphs.join('\n'))
        : bodyLines(item.body),
      facts: Array.isArray(item.facts) ? item.facts.map(createFact).filter(Boolean) : [],
      warnings: warningList(item.warnings)
    };
  }).filter((item) => item && item.title);
  const ir = {
    kind,
    title,
    prefix: clean(prefix) || undefined,
    sections: list,
    text: '',
    warnings: warningList(warnings)
  };
  ir.text = renderDocument(ir);
  return ir;
}

function fromRecordText(kind, title, text, warnings, sectionTitles) {
  const raw = clean(text);
  const chunks = raw.split(/\n(?=【[^】]+】)/).filter(Boolean);
  const sections = chunks.map((chunk) => {
    const match = chunk.match(/^【([^】]+)】\n?([\s\S]*)$/);
    return match ? section(match[1], match[2], [], warnings) : section(title, chunk, [], warnings);
  });
  if (!sections.length) sections.push(section(title, raw, [], warnings));
  if (Array.isArray(sectionTitles)) {
    for (const name of sectionTitles) {
      if (!sections.some((s) => s.title === name)) sections.push(section(name, '', [], warnings));
    }
  }
  return { kind, title, sections, text: raw ? raw + (raw.endsWith('\n') ? '' : '\n') : '', warnings: warningList(warnings) };
}

function fromPlainText(kind, title, text, warnings) {
  const raw = clean(text);
  const sections = raw.split(/\n(?=\S+：)/).filter(Boolean).map((chunk) => {
    const match = chunk.match(/^([^：\n]+)：\n?([\s\S]*)$/);
    return match ? section(match[1], match[2], [], warnings) : section(title, chunk, [], warnings);
  });
  return { kind, title, sections: sections.length ? sections : [section(title, raw, [], warnings)], text: raw ? raw + '\n' : '', warnings: warningList(warnings) };
}

function renderPlain(ir) {
  return (ir && Array.isArray(ir.sections) ? ir.sections : []).map((s) => {
    const body = (s.paragraphs || []).join('\n');
    return body ? `${s.title}：\n${body}` : `${s.title}：`;
  }).join('\n') + '\n';
}

function renderRecord(ir) {
  return (ir && Array.isArray(ir.sections) ? ir.sections : []).map((s) => `【${s.title}】\n${(s.paragraphs || []).join('\n')}`).join('\n\n') + '\n';
}

function renderNumbered(ir) {
  const head = clean(ir && ir.prefix) ? `${clean(ir.prefix)}\n` : '';
  const body = (ir && Array.isArray(ir.sections) ? ir.sections : []).map((s) => {
    const heading = clean(s.heading) || clean(s.title);
    const paragraphs = (s.paragraphs || []).join('\n');
    return paragraphs ? `${heading}\n${paragraphs}` : heading;
  }).join('\n');
  return head + body + (head || body ? '\n' : '');
}

/** Render all three document kinds from the same IR contract. */
function renderDocument(ir) {
  if (!ir) return '';
  if (ir.kind === 'record') return renderRecord(ir);
  if (ir.kind === 'firstCourse' || ir.kind === 'discharge') return renderNumbered(ir);
  return renderPlain(ir);
}

/**
 * 把「一、病历特点」这类编号文书切成 IR 小节。三份文书共用这一入口，
 * 生成器的字符串 API 只作为兼容输出，不再成为数据源。
 */
function fromNumberedText(kind, title, text, warnings, factsByTitle) {
  const raw = clean(text);
  const lines = raw.split(/\n/);
  const prefix = lines[0] && /^【[^】]+】/.test(lines[0].trim()) ? lines.shift().trim() : '';
  const sections = [];
  let current = null;
  lines.forEach((line) => {
    const match = line.match(/^([一二三四五六七八九十]+、[^\n]+)$/);
    if (match) {
      current = { title: match[1], heading: match[1], paragraphs: [] };
      sections.push(current);
      return;
    }
    if (clean(line) && current) current.paragraphs.push(clean(line));
  });
  const supplied = Array.isArray(factsByTitle) ? factsByTitle : [];
  sections.forEach((item) => {
    const pool = factsByTitle && typeof factsByTitle === 'object' && !Array.isArray(factsByTitle)
      ? (factsByTitle[item.title] || [])
      : supplied;
    item.facts = Array.isArray(pool) ? pool.slice() : [];
  });
  return documentFromSections(kind, title, sections, warnings, prefix);
}

function isBareTimeFragment(text) {
  const value = stripTail(text);
  if (!value) return false;
  return /^(?:约|大约|近|距今|迄今)?[0-9０-９一二三四五六七八九十百千万两半十几数余]+(?:个)?(?:天|日|周|星期|月|年|小时|分钟|h|min)(?:余|多|来|左右|之后|以后|前|以前)?$/.test(value);
}

function squashed(text) {
  return clean(text).replace(/[\s，,。；;、：:]+/g, '');
}

function isNegatedClause(text) {
  return /^(?:无|未见|未出现|未诉|否认|没有|不伴|无明显|未曾|未)/.test(clean(text));
}

/**
 * 修正中文阴性清单的作用域。例：
 *   「无发热、咳嗽加重」会被读成「发热和咳嗽都没有」，
 *   但「加重」是阳性病程词，应输出「无发热；咳嗽加重」。
 * 只在后续分句含明确阳性病程词时断开，普通阴性清单（无咯血、盗汗、消瘦）
 * 保持原样，避免把用户原意改坏。
 */
function normalizeNegationScope(text) {
  const sentences = clean(text).split(/。/).map(stripTail).filter(Boolean);
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
      const negated = isNegatedClause(clause);
      const positiveTurn = /(?:加重|加剧|缓解|好转|减轻|恶化|出现|发生|伴有|伴|再发|复发|增多|减少|持续|反复|转为|变为)/.test(clause);
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

function polarityKey(text) {
  return (isNegatedClause(text) ? 'neg:' : 'pos:') + squashed(text);
}

/**
 * Assemble structured HPI fields into clinical sentences.
 *
 * - A field containing only a time fragment ("3天前") is dropped, never rendered
 *   as "3天前。".
 * - Negation scope is repaired before punctuation assembly.
 * - Exact fragments repeated across different fields are emitted once; repeated
 *   fragments inside one user field are kept because validate() must be able to
 *   warn about them rather than silently destroying the user's original text.
 */
function assembleClinicalNarrative(parts) {
  const sourceParts = (Array.isArray(parts) ? parts : []).map(clean).filter(Boolean);
  const prior = [];
  const sentences = [];
  let current = [];

  const flush = () => {
    if (current.length) sentences.push(current.join('，'));
    current = [];
  };
  const redundant = (unit) => {
    const key = polarityKey(unit);
    const core = key.slice(4);
    if (prior.includes(key)) return true;
    if (core.length < 2) return false;
    const neg = key.slice(0, 4);
    return prior.some((seen) => seen.slice(0, 4) === neg && seen.slice(4).includes(core));
  };

  sourceParts.forEach((part) => {
    const units = part.split(/。/).map(stripTail).filter(Boolean);
    const seenInPart = [];
    units.forEach((unit, index) => {
      const normalized = normalizeNegationScope(unit);
      // A repaired negation scope can contain two independent facts
      // ("无发热；咳嗽加重"). Dedupe each fact against earlier *fields*, while
      // retaining duplicates that the user typed inside this same field.
      const kept = normalized.split(/[；;]/).map(stripTail).filter(Boolean)
        .filter((clause) => !isBareTimeFragment(clause))
        .filter((clause) => !redundant(clause));
      if (!kept.length) return;
      if (index > 0 && current.length) flush();
      current.push(kept.join('；'));
      kept.forEach((clause) => seenInPart.push(polarityKey(clause)));
    });
    prior.push(...seenInPart);
  });
  flush();
  return sentences;
}

const DOCUMENT_IR = {
  section,
  createFact,
  documentFromSections,
  fromRecordText,
  fromPlainText,
  fromNumberedText,
  renderPlain,
  renderRecord,
  renderNumbered,
  renderDocument,
  warningList,
  isBareTimeFragment,
  normalizeNegationScope,
  assembleClinicalNarrative
};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOCUMENT_IR;
}
