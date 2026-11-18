/**
 * Document intermediate representation. This module is deliberately free of
 * DOM APIs: generators produce this JSON-shaped tree and renderers decide how
 * to display it (plain text, HTML, or a future editor).
 */

import {
  isBareTimeFragment as sharedIsBareTimeFragment,
  NEG_HEAD_RE,
  normalizeNegationScope as sharedNormalizeNegationScope,
  squashText,
  stripTail
} from '../shared/text-utils';
import type {
  DiagnosticSeverity,
  DocumentIR,
  DocumentKind,
  DocumentSection,
  DocumentWarning,
  Evidence,
  Fact,
  FactState,
  Polarity,
  SourceKind
} from '../types';

export interface DocumentIRWithPrefix extends DocumentIR {
  prefix?: string;
}

export interface RawSectionInput {
  title: string;
  heading?: string;
  body?: string;
  paragraphs?: string[];
  facts?: Array<Fact | RawFactInput | null>;
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>;
}

export interface RawFactInput {
  path?: string;
  text?: string;
  polarity?: Polarity | string;
  state?: FactState | string;
  source?: SourceKind | string;
  reviewed?: boolean;
  evidence?: Evidence[];
  onset?: string;
  duration?: string;
  laterality?: string;
}

function clean(value: unknown): string {
  return String(value == null ? '' : value).trim();
}

function bodyLines(value: unknown): string[] {
  const lines = String(value == null ? '' : value).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  return lines;
}

export function warningList(warnings?: ReadonlyArray<Partial<DocumentWarning> | string> | null): DocumentWarning[] {
  return (Array.isArray(warnings) ? warnings : []).map((w): DocumentWarning => {
    if (typeof w === 'string') {
      return { code: 'GENERAL', severity: 'info', message: clean(w), path: 'document', paths: ['document'] };
    }
    const obj = (w || {}) as Partial<DocumentWarning>;
    const paths = Array.isArray(obj.paths) ? obj.paths.map(clean).filter(Boolean) : [];
    const path = clean(obj.path) || paths[0] || 'document';
    if (!paths.includes(path)) paths.unshift(path);
    return {
      code: clean(obj.code) || 'GENERAL',
      severity: (clean(obj.severity) || 'info') as DiagnosticSeverity,
      message: clean(obj.message),
      path,
      paths,
      document: obj.document,
      action: obj.action,
      evidence: Array.isArray(obj.evidence) ? obj.evidence.slice() : []
    };
  });
}

export function section(
  title: string,
  body: string,
  facts?: readonly Fact[],
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>,
  heading?: string
): DocumentSection {
  return {
    title,
    heading: clean(heading) || title,
    paragraphs: bodyLines(body),
    facts: Array.isArray(facts) ? facts.slice() : [],
    warnings: warningList(warnings)
  };
}

export function createFact(input: RawFactInput | null | undefined): Fact | null {
  const source = input || {};
  const text = clean(source.text);
  const path = clean(source.path);
  if (!path || !text) return null;
  const polarity: Polarity =
    source.polarity === 'positive' || source.polarity === 'negative' ? source.polarity : 'unknown';
  const state = clean(source.state) as FactState | '';
  return {
    path,
    text,
    polarity,
    state: (state || undefined) as FactState | undefined,
    source: (clean(source.source) || 'unknown') as SourceKind,
    reviewed: source.reviewed === true,
    evidence: Array.isArray(source.evidence) ? source.evidence.slice() : [{ path, text }],
    onset: clean(source.onset) || undefined,
    duration: clean(source.duration) || undefined,
    laterality: clean(source.laterality) || undefined
  };
}

export function documentFromSections(
  kind: DocumentKind,
  title: string,
  sections: ReadonlyArray<RawSectionInput | string | null>,
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>,
  prefix?: string
): DocumentIRWithPrefix {
  const list: DocumentSection[] = (Array.isArray(sections) ? sections : [])
    .map((item): DocumentSection | null => {
      if (!item) return null;
      if (typeof item === 'string') return section(item, '', [], []);
      return {
        title: clean(item.title),
        heading: clean(item.heading) || clean(item.title),
        paragraphs: Array.isArray(item.paragraphs)
          ? bodyLines(item.paragraphs.join('\n'))
          : bodyLines(item.body),
        facts: Array.isArray(item.facts)
          ? item.facts.map((f: RawFactInput) => createFact(f)).filter((f: Fact | null): f is Fact => f !== null)
          : [],
        warnings: warningList(item.warnings)
      };
    })
    .filter((item): item is DocumentSection => item !== null && Boolean(item.title));

  const ir: DocumentIRWithPrefix = {
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

export function fromRecordText(
  kind: DocumentKind,
  title: string,
  text: string,
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>,
  sectionTitles?: readonly string[]
): DocumentIR {
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
  return {
    kind,
    title,
    sections,
    text: raw ? raw + (raw.endsWith('\n') ? '' : '\n') : '',
    warnings: warningList(warnings)
  };
}

export function fromPlainText(
  kind: DocumentKind,
  title: string,
  text: string,
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>
): DocumentIR {
  const raw = clean(text);
  const sections = raw
    .split(/\n(?=\S+：)/)
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(/^([^：\n]+)：\n?([\s\S]*)$/);
      return match ? section(match[1], match[2], [], warnings) : section(title, chunk, [], warnings);
    });
  return {
    kind,
    title,
    sections: sections.length ? sections : [section(title, raw, [], warnings)],
    text: raw ? raw + '\n' : '',
    warnings: warningList(warnings)
  };
}

export function renderPlain(ir: DocumentIR | null | undefined): string {
  return (
    (ir && Array.isArray(ir.sections) ? ir.sections : [])
      .map((s) => {
        const body = (s.paragraphs || []).join('\n');
        return body ? `${s.title}：\n${body}` : `${s.title}：`;
      })
      .join('\n') + '\n'
  );
}

export function renderRecord(ir: DocumentIRWithPrefix | null | undefined): string {
  const head = clean(ir && ir.prefix);
  const body = (ir && Array.isArray(ir.sections) ? ir.sections : [])
    .map((s) => `【${s.title}】\n${(s.paragraphs || []).join('\n')}`)
    .join('\n\n');
  return (head ? `${head}\n\n` : '') + body + '\n';
}

export function renderNumbered(ir: DocumentIRWithPrefix | null | undefined): string {
  const head = clean(ir && ir.prefix) ? `${clean(ir && ir.prefix)}\n` : '';
  const body = (ir && Array.isArray(ir.sections) ? ir.sections : [])
    .map((s) => {
      const heading = clean(s.heading) || clean(s.title);
      const paragraphs = (s.paragraphs || []).join('\n');
      return paragraphs ? `${heading}\n${paragraphs}` : heading;
    })
    .join('\n');
  return head + body + (head || body ? '\n' : '');
}

/** Render all three document kinds from the same IR contract. */
export function renderDocument(ir: DocumentIRWithPrefix | null | undefined): string {
  if (!ir) return '';
  if (ir.kind === 'record') return renderRecord(ir);
  if (ir.kind === 'firstCourse' || ir.kind === 'discharge') return renderNumbered(ir);
  return renderPlain(ir);
}

/**
 * 把「一、病历特点」这类编号文书切成 IR 小节。三份文书共用这一入口，
 * 生成器的字符串 API 只作为兼容输出，不再成为数据源。
 */
export function fromNumberedText(
  kind: DocumentKind,
  title: string,
  text: string,
  warnings?: ReadonlyArray<Partial<DocumentWarning> | string>,
  factsByTitle?: Readonly<Record<string, Fact[]>> | readonly Fact[]
): DocumentIRWithPrefix {
  const raw = clean(text);
  const lines = raw.split(/\n/);
  const prefix = lines[0] && /^【[^】]+】/.test(lines[0].trim()) ? clean(lines.shift()) : '';
  const sections: RawSectionInput[] = [];
  let current: RawSectionInput | null = null;
  lines.forEach((line) => {
    const match = line.match(/^([一二三四五六七八九十]+、[^\n]+)$/);
    if (match) {
      current = { title: match[1], heading: match[1], paragraphs: [] };
      sections.push(current);
      return;
    }
    if (clean(line) && current && current.paragraphs) current.paragraphs.push(clean(line));
  });
  const supplied = Array.isArray(factsByTitle) ? factsByTitle : [];
  sections.forEach((item) => {
    const pool =
      factsByTitle && typeof factsByTitle === 'object' && !Array.isArray(factsByTitle)
        ? ((factsByTitle as Readonly<Record<string, Fact[]>>)[item.title] || [])
        : supplied;
    item.facts = Array.isArray(pool) ? pool.slice() : [];
  });
  return documentFromSections(kind, title, sections, warnings, prefix);
}

export function isBareTimeFragment(text: unknown): boolean {
  return sharedIsBareTimeFragment(text);
}

export function normalizeNegationScope(text: unknown): string {
  return sharedNormalizeNegationScope(text);
}

function polarityKey(text: string): string {
  return (NEG_HEAD_RE.test(clean(text)) ? 'neg:' : 'pos:') + squashText(text);
}

/**
 * Assemble structured HPI fields into clinical sentences.
 */
export function assembleClinicalNarrative(parts: readonly string[]): string[] {
  const sourceParts = (Array.isArray(parts) ? parts : []).map(clean).filter(Boolean);
  const prior: string[] = [];
  const sentences: string[] = [];
  let current: string[] = [];

  const flush = (): void => {
    if (current.length) sentences.push(current.join('，'));
    current = [];
  };
  const redundant = (unit: string): boolean => {
    const key = polarityKey(unit);
    const core = key.slice(4);
    if (prior.includes(key)) return true;
    if (core.length < 2) return false;
    const neg = key.slice(0, 4);
    return prior.some((seen) => seen.slice(0, 4) === neg && seen.slice(4).includes(core));
  };

  sourceParts.forEach((part) => {
    const units = part.split(/。/).map(stripTail).filter(Boolean);
    const seenInPart: string[] = [];
    units.forEach((unit, index) => {
      const normalized = normalizeNegationScope(unit);
      const kept = normalized
        .split(/[；;]/)
        .map(stripTail)
        .filter(Boolean)
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

export const DOCUMENT_IR = {
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

export default DOCUMENT_IR;
