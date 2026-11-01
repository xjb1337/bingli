/**
 * Document intermediate representation. This module is deliberately free of
 * DOM APIs: generators produce this JSON-shaped tree and renderers decide how
 * to display it (plain text, HTML, or a future editor).
 */

/** @typedef {'record'|'firstCourse'|'discharge'} DocumentKind */

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function warningList(warnings) {
  return (Array.isArray(warnings) ? warnings : []).map((w) => {
    if (typeof w === 'string') return { code: 'GENERAL', severity: 'info', message: w, paths: [] };
    return {
      code: clean(w && w.code) || 'GENERAL',
      severity: clean(w && w.severity) || 'info',
      message: clean(w && w.message),
      paths: Array.isArray(w && w.paths) ? w.paths.slice() : []
    };
  });
}

function section(title, body, facts, warnings) {
  const text = clean(body);
  return {
    title,
    paragraphs: text ? text.split(/\n+/).map(clean).filter(Boolean) : [],
    facts: Array.isArray(facts) ? facts.slice() : [],
    warnings: warningList(warnings)
  };
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

const DOCUMENT_IR = { section, fromRecordText, fromPlainText, renderPlain, renderRecord, warningList };
if (typeof module !== 'undefined' && module.exports) module.exports = DOCUMENT_IR;
