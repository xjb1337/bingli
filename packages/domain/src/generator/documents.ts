import { cloneValue, getPath, setPath } from '../core';
import type {
  BasisDetailItem,
  DabingliRecord,
  DocumentSection,
  DocumentWarning,
  FirstCourseDiffItem,
  FirstCoursePlanItem
} from '../types';
import { documentFromSections } from './document-ir';
import {
  buildAdmissionHPI,
  buildAdmissionMarriageChildbirth,
  buildBasicInfo,
  buildChiefComplaint,
  buildFamily,
  buildPersonal,
  buildPMH,
  negativeHistoryText
} from './sections-basic-history';
import {
  abnormalPE,
  anyPEExamined,
  auxItems,
  buildAuxiliary,
  buildDiagnosis,
  buildPE,
  diagnosisList
} from './sections-pe-aux-diag';
import {
  abnormalVitalFindings,
  ADMISSION_CONSENT,
  ageWithUnit,
  asRecord,
  dedupeClauses,
  deLabel,
  diagnostic,
  ensureSentence,
  HISTORY_FIELD_PATHS,
  HISTORY_SECTION_KEYS,
  hospitalDays,
  joinSentences,
  PH,
  SECTION_ORDER,
  sentenceKey,
  splitSentences,
  stripTail,
  subjectOf
} from './utils';
import { validate } from './validators';

let registeredHintRuleNames: string[] = [];

export function registerHintRuleNames(names: readonly string[]): void {
  registeredHintRuleNames = names.filter(Boolean);
}

function resolveHintRuleNames(): readonly string[] {
  if (registeredHintRuleNames.length) return registeredHintRuleNames;
  const g = typeof globalThis !== 'undefined'
    ? (globalThis as { HINTS?: { RULES?: ReadonlyArray<{ name?: unknown }> } })
    : undefined;
  if (g && g.HINTS && Array.isArray(g.HINTS.RULES)) {
    return g.HINTS.RULES.map((item) => String(item.name || '')).filter(Boolean);
  }
  return [];
}

/** S 段：凝练的病例特点 */
export function draftCaseSummary(r: DabingliRecord): string {
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const seg: string[] = [];
  const who = [b.gender, ageWithUnit(r)].filter(Boolean).join('，');
  const subj = subjectOf(r);
  let head = who ? `${subj}，${who}` : subj;
  const cc = stripTail(buildChiefComplaint(r));
  if (cc) head += `，因“${cc}”入院`;
  seg.push(head);

  const keyPoints = [h.symptoms, h.evolution].map((s) => stripTail(s)).filter(Boolean);
  if (keyPoints.length) seg.push(keyPoints.join('，'));

  const negative = negativeHistoryText(h);
  if (negative) seg.push(negative);

  const abn = abnormalPE(r);
  if (abn.length) seg.push(`查体：${dedupeClauses(abn.slice(0, 3).map((a) => a.text)).join('，')}`);
  const aux = auxItems(r);
  if (aux.length) {
    seg.push(
      `辅助检查：${aux
        .slice(0, 2)
        .map((it) => (it.name && it.result ? `${it.name}（${it.result}）` : it.name || it.result))
        .join('；')}`
    );
  }
  return joinSentences(seg);
}

/** O 段：对诊断有意义的体格检查（只取阳性，阴性不进 O 段） */
export function draftObjectivePE(r: DabingliRecord): string {
  const abn = abnormalPE(r);
  const parts = abnormalVitalFindings(r);
  const texts = dedupeClauses(parts.concat(abn.map((a) => a.text).filter(Boolean)));
  if (!texts.length) return anyPEExamined(r) ? '未见与诊断相关的阳性体征' : PH;
  return texts.join('，');
}

/** O 段：与疾病相关的辅助检查结果 */
export function draftObjectiveAux(r: DabingliRecord): string {
  const aux = auxItems(r);
  if (!aux.length) return '相关辅助检查结果暂缺';
  return aux
    .map((it) => (it.name && it.result ? `${it.name}${it.result}` : it.name || it.result))
    .join('；');
}

/** 三依据（病史/体检/辅助检查）齐全的逐诊断依据 */
export function draftBasisDetail(r: DabingliRecord, opts: { fresh?: boolean } = {}): BasisDetailItem[] {
  const items = ((r.soap || {}).a || {}).basisDetail;
  if (!opts.fresh && Array.isArray(items) && items.length) {
    return items.filter((x): x is BasisDetailItem => Boolean(x && stripTail(x.diagnosis)));
  }
  const dx = diagnosisList(r);
  if (!dx.length) return [];
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const hpiText = [stripTail(h.onset), stripTail(h.symptoms), stripTail(h.accompanying), negativeHistoryText(h)]
    .filter(Boolean)
    .join('，');
  const abn = abnormalPE(r);
  const aux = auxItems(r);
  return dx.map((d, i) =>
    i === 0
      ? {
          diagnosis: d,
          history: hpiText,
          pe: abn.length ? dedupeClauses(abn.map((a) => a.text)).join('，') : '',
          aux: aux.length ? `${aux[0].name}${aux[0].result}` : ''
        }
      : { diagnosis: d, history: '', pe: '', aux: '' }
  );
}

/** 判断鉴别诊断是否与现有诊断相关 */
export function diffRelatedToDiagnosis(r: DabingliRecord): { total: number; unrelated: string[] } {
  const dx = diagnosisList(r);
  const diffs = (((r.soap || {}).a || {}).diff) || [];
  if (!Array.isArray(diffs) || !diffs.length) return { total: 0, unrelated: [] };

  const joined = dx.join('|');
  const h = r.hpi || ({} as Partial<DabingliRecord['hpi']>);
  const b = r.basic || ({} as Partial<DabingliRecord['basic']>);
  const narrative = [stripTail(b.chiefComplaint), stripTail(h.symptoms), stripTail(h.accompanying), stripTail(h.evolution)].join('|');
  const ruleNames = resolveHintRuleNames();

  const sharesFragment = (name: string, pool: string): boolean => {
    if (!pool) return false;
    for (let i = 0; i + 2 <= name.length; i++) {
      if (pool.includes(name.slice(i, i + 2))) return true;
    }
    return false;
  };

  const unrelated = diffs
    .filter((d): d is FirstCourseDiffItem => Boolean(d && stripTail(d.diagnosis)))
    .filter((d) => {
      const name = stripTail(d.diagnosis);
      if (sharesFragment(name, joined)) return false;
      if (ruleNames.some((rn) => rn && rn.includes(name))) return false;
      if (narrative && narrative.includes(name)) return false;
      return true;
    })
    .map((d) => stripTail(d.diagnosis));
  return { total: diffs.length, unrelated };
}

/** 首次病程录的自查提醒（结构化条目，不进入病历正文） */
export function firstCourseSelfCheckDiagnostics(r: DabingliRecord): DocumentWarning[] {
  const out: DocumentWarning[] = [];
  const a = ((r.soap || {}).a) || {};
  if (!stripTail(a.diffNote)) {
    const check = diffRelatedToDiagnosis(r);
    if (check.unrelated.length) {
      const diffs = Array.isArray(a.diff) ? a.diff : [];
      out.push(
        diagnostic({
          code: 'SOAP_DIFF_UNRELATED',
          severity: 'warning',
          document: 'firstCourse',
          path: 'soap.a.diff',
          action: '核对鉴别诊断',
          message: `${check.unrelated.join('、')} 与现有诊断的关联不明确，请结合病情核对是否保留。`,
          evidence: diffs
            .map((row, index) => ({
              path: `soap.a.diff.${index}.diagnosis`,
              text: stripTail(row && row.diagnosis)
            }))
            .filter((item) => Boolean(item.text))
        })
      );
    }
  }
  return out;
}

export function firstCourseSelfCheck(r: DabingliRecord): string[] {
  return firstCourseSelfCheckDiagnostics(r).map((item) => item.message);
}

export interface DocumentPartsResult {
  prefix: string;
  sections: Array<{ title: string; heading: string; paragraphs: string[] }>;
}

/** 生成首次病程录结构化分段 */
export function firstCourseDocumentParts(r: DabingliRecord, opts: { date?: string } = {}): DocumentPartsResult {
  const rec = r || ({} as DabingliRecord);
  const soap = rec.soap || {};
  const s = soap.s || {};
  const o = soap.o || {};
  const a = soap.a || {};
  const p = soap.p || {};

  const sections: Array<{ title: string; heading: string; paragraphs: string[] }> = [];
  const add = (title: string, paragraphs: string[]): void => {
    sections.push({ title, heading: title, paragraphs });
  };
  const stamp = stripTail(opts.date) || stripTail(soap.recordTime || '');
  const prefix = stamp ? `【首次病程录】${stamp}` : '【首次病程录】';

  const summary = stripTail(s.summary) || draftCaseSummary(rec);
  const feature = [ensureSentence(summary) || '（待补充：请概括现病史要点）'];
  const consistency = stripTail(s.consistency);
  if (consistency) feature.push(ensureSentence(consistency));
  add('一、病历特点（S）', feature);

  const peText = deLabel(o.pe || draftObjectivePE(rec), ['查体', '体格检查']);
  const auxText = deLabel(o.aux || draftObjectiveAux(rec), ['辅助检查', '检查']);
  add('二、客观记录（O）', [`1. 体格检查：${ensureSentence(peText)}`, `2. 辅助检查：${ensureSentence(auxText)}`]);

  const basisParagraphs: string[] = [];
  const basis = stripTail(a.basis);
  if (basis) basisParagraphs.push(ensureSentence(basis));
  const details = draftBasisDetail(rec);
  if (details.length) {
    details.forEach((d) => {
      const bits: string[] = [];
      if (stripTail(d.history)) bits.push(`①病史：${stripTail(d.history)}`);
      if (stripTail(d.pe)) bits.push(`②体检：${stripTail(d.pe)}`);
      if (stripTail(d.aux)) bits.push(`③辅助检查：${stripTail(d.aux)}`);
      const body = bits.length ? bits.join('；') : '（待补充病史、体检、辅助检查三方面依据）';
      basisParagraphs.push(`· ${stripTail(d.diagnosis)}：${ensureSentence(body)}`);
    });
  } else {
    basisParagraphs.push('· （待补充初步诊断，再逐条列出诊断依据）');
  }
  const ranking = stripTail(a.ranking);
  if (ranking) basisParagraphs.push(`主次：${ensureSentence(ranking)}`);
  add('三、诊断依据（A）', basisParagraphs);

  const diffParagraphs: string[] = [];
  const diffs = Array.isArray(a.diff)
    ? a.diff.filter((d): d is FirstCourseDiffItem => Boolean(d && stripTail(d.diagnosis)))
    : [];
  if (diffs.length) {
    diffs.forEach((d) => {
      const bits: string[] = [];
      if (stripTail(d.why)) bits.push(`支持点：${stripTail(d.why)}`);
      if (stripTail(d.against)) bits.push(`不支持点：${stripTail(d.against)}`);
      if (stripTail(d.points)) bits.push(`鉴别要点：${stripTail(d.points)}`);
      const tail = bits.length ? `：${bits.join('；')}` : '';
      diffParagraphs.push(`· 需与${stripTail(d.diagnosis)}鉴别${ensureSentence(tail)}`);
    });
  } else {
    diffParagraphs.push('· （待补充：结合主要诊断展开鉴别，可参考诊断参考提示中的候选疾病）');
  }
  const diffNote = stripTail(a.diffNote);
  if (diffNote) diffParagraphs.push(ensureSentence(diffNote));
  add('四、鉴别诊断（A）', diffParagraphs);

  const planParagraphs: string[] = [];
  const principle = stripTail(p.principle);
  if (principle) planParagraphs.push(ensureSentence(principle));
  const plans = Array.isArray(p.perDiagnosis)
    ? p.perDiagnosis.filter((x): x is FirstCoursePlanItem => Boolean(x && stripTail(x.diagnosis)))
    : [];
  if (plans.length) {
    plans.forEach((x) => {
      const bits: string[] = [];
      if (stripTail(x.exam)) bits.push(`检查：${stripTail(x.exam)}`);
      if (stripTail(x.treatment)) bits.push(`治疗：${stripTail(x.treatment)}`);
      const body = bits.length ? bits.join('；') : '（待补充具体检查与治疗措施）';
      planParagraphs.push(`· ${stripTail(x.diagnosis)}：${ensureSentence(body)}`);
    });
  } else {
    planParagraphs.push('· （待补充：按诊断逐条列出拟完善检查与治疗措施）');
  }
  const individual = stripTail(p.individual);
  if (individual) planParagraphs.push(`个体化：${ensureSentence(individual)}`);
  add('五、诊疗计划（P）', planParagraphs);

  return { prefix, sections };
}

export function buildFirstCourseRecord(r: DabingliRecord, opts: { date?: string } = {}): string {
  const parts = firstCourseDocumentParts(r, opts);
  return documentFromSections('firstCourse', '首次病程录', parts.sections as DocumentSection[], [], parts.prefix).text;
}

/** 入院情况草稿：只写入院当时的主诉、体征与入院诊断 */
export function draftAdmitCondition(r: DabingliRecord): string {
  const rec = asRecord(r);
  if (!rec) return '';
  const seg: string[] = [];
  const cc = stripTail(buildChiefComplaint(rec));
  if (cc) seg.push(`因“${cc}”入院`);
  const abn = abnormalPE(rec);
  if (abn.length) seg.push(`入院查体${abn.slice(0, 3).map((a) => a.text).join('，')}`);
  const dx = diagnosisList(rec);
  if (dx.length) seg.push(`入院诊断：${dx.join('、')}`);
  return seg.length ? joinSentences(seg) : '';
}

export function dischargeDocumentParts(r: DabingliRecord): DocumentPartsResult {
  const rec = r || ({} as DabingliRecord);
  const b = rec.basic || ({} as Partial<DabingliRecord['basic']>);
  const d = rec.discharge || {};
  const advice = d.advice || {};
  const sections: Array<{ title: string; heading: string; paragraphs: string[] }> = [];
  const add = (title: string, paragraphs: string[]): void => {
    sections.push({ title, heading: title, paragraphs });
  };

  const general: string[] = [];
  if (stripTail(b.name)) general.push(`姓名：${stripTail(b.name)}`);
  if (stripTail(b.gender)) general.push(`性别：${stripTail(b.gender)}`);
  if (ageWithUnit(rec)) general.push(`年龄：${ageWithUnit(rec)}`);
  if (stripTail(b.recordNo)) general.push(`病历号：${stripTail(b.recordNo)}`);
  if (stripTail(b.admitDate)) general.push(`入院日期：${stripTail(b.admitDate)}`);
  const disDate = stripTail(d.dischargeDate);
  if (disDate) general.push(`出院日期：${disDate}`);
  const days = hospitalDays(b.admitDate, d.dischargeDate);
  if (days !== null) general.push(`住院天数：${days}天`);
  add('一、一般情况', [
    general.length ? joinSentences([general.join('，')]) : '（待补充姓名、性别、年龄、入院及出院日期）'
  ]);

  const admit = stripTail(d.admitCondition) || draftAdmitCondition(rec);
  add('二、入院情况', [admit ? ensureSentence(admit) : '（待补充：入院时主要症状、体征与入院诊断）']);

  add('三、诊疗经过', [
    d.course ? ensureSentence(d.course) : '（待补充：住院期间病情变化、检查结果、治疗经过及效果）'
  ]);

  add('四、出院情况', [
    d.dischargeStatus ? ensureSentence(d.dischargeStatus) : '（待补充：出院时主要症状、体征、辅助检查结果）'
  ]);

  const outDx = (Array.isArray(d.diagnoses) ? d.diagnoses : []).map((s) => stripTail(s)).filter(Boolean);
  add('五、出院诊断', [
    outDx.length
      ? outDx.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '（待补充：出院诊断未填写；如与初步诊断一致，请使用「从初步诊断带入」后核对确认）'
  ]);

  const orders: string[] = [];
  if (stripTail(advice.drug)) orders.push(`药物治疗：${stripTail(advice.drug)}`);
  if (stripTail(advice.nonDrug)) orders.push(`非药物治疗：${stripTail(advice.nonDrug)}`);
  if (stripTail(advice.lifestyle)) orders.push(`生活指导：${stripTail(advice.lifestyle)}`);
  if (stripTail(advice.followUp)) orders.push(`复诊时间：${stripTail(advice.followUp)}`);
  add('六、出院医嘱', [
    orders.length ? joinSentences(orders) : '（待补充：药物、非药物治疗、生活指导、复诊时间）'
  ]);

  return { prefix: '【出院记录】', sections };
}

export function buildDischargeRecord(r: DabingliRecord): string {
  const parts = dischargeDocumentParts(r);
  return documentFromSections('discharge', '出院记录', parts.sections as DocumentSection[], [], parts.prefix).text;
}

export function buildBasisSection(r: DabingliRecord, opts: { fresh?: boolean } = {}): string {
  const items = draftBasisDetail(r, opts);
  if (!items.length) return '待补充：先填写初步诊断，再逐条列出诊断依据。';
  const lines: string[] = [];
  items.forEach((it, i) => {
    const parts: string[] = [];
    if (stripTail(it.history)) parts.push(`病史：${stripTail(it.history)}`);
    if (stripTail(it.pe)) parts.push(`体格检查：${stripTail(it.pe)}`);
    if (stripTail(it.aux)) parts.push(`辅助检查：${stripTail(it.aux)}`);
    const body = parts.length ? parts.join('；') : '（待补充病史、体检、辅助检查三方面依据）';
    lines.push(`${i + 1}. ${stripTail(it.diagnosis)}：${body}`);
  });
  return lines.join('\n');
}

/** 跨病史栏目去掉完全重复的句子 */
export function dedupeHistorySections(sections: Record<string, string>): Record<string, string> {
  const seenAcross = new Set<string>();
  HISTORY_SECTION_KEYS.forEach((key) => {
    const body = sections[key];
    if (!body || body === PH) return;
    const seenHere = new Set<string>();
    const kept: string[] = [];
    String(body)
      .split('\n')
      .forEach((line) => {
        const sentences = splitSentences(line);
        if (!sentences.length) {
          kept.push(line);
          return;
        }
        const out: string[] = [];
        sentences.forEach((sentence) => {
          const k = sentenceKey(sentence);
          if (!k) {
            out.push(sentence);
            return;
          }
          if (seenHere.has(k)) {
            out.push(sentence);
            return;
          }
          if (seenAcross.has(k)) return;
          seenHere.add(k);
          seenAcross.add(k);
          out.push(sentence);
        });
        if (out.length) kept.push((line.match(/^[ \t\u3000]*/) || [''])[0] + out.join(''));
      });
    sections[key] = kept.join('\n') || PH;
  });
  return sections;
}

/** 跨字段去重：同一句完整的话填进多个病史字段时，只保留第一次出现 */
export function dedupeRecordFields(record: DabingliRecord): DabingliRecord {
  const out = cloneValue(record || ({} as DabingliRecord));
  const owner = new Map<string, string>();
  HISTORY_FIELD_PATHS.forEach((path) => {
    const v = getPath(out, path);
    if (typeof v !== 'string' || !v.trim()) return;
    const kept: string[] = [];
    v.split('\n').forEach((line) => {
      const sentences = splitSentences(line);
      if (!sentences.length) {
        kept.push(line);
        return;
      }
      const parts: string[] = [];
      sentences.forEach((s) => {
        const k = sentenceKey(s);
        if (!k || k.length <= 2 || /^(?:无|否认|正常|不详|未问|未查|阴性|阳性|有|已戒)$/.test(k)) {
          parts.push(s);
          return;
        }
        const prev = owner.get(k);
        if (prev && prev !== path) return;
        if (!prev) owner.set(k, path);
        parts.push(s);
      });
      if (parts.length) kept.push(parts.join(''));
    });
    const next = kept.join('\n');
    if (next !== v) setPath(out, path, next);
  });
  return out;
}

export function generate(
  r: DabingliRecord,
  _opts: Record<string, unknown> = {}
): { text: string; sections: Record<string, string>; warnings: string[] } {
  const rec = dedupeRecordFields(r);
  const sections: Record<string, string> = {};
  sections['一般项目'] = buildBasicInfo(rec, { template: true });
  sections['主诉'] = buildChiefComplaint(rec);
  sections['现病史'] = buildAdmissionHPI(rec);
  sections['既往史'] = buildPMH(rec, { template: true });
  sections['个人史'] = buildPersonal(rec, { template: true });
  sections['婚育史'] = buildAdmissionMarriageChildbirth(rec);
  const family = String(buildFamily(rec) || '').trim();
  sections['家族史'] = family ? `${family}\n${ADMISSION_CONSENT}` : ADMISSION_CONSENT;
  const pe = buildPE(rec, { admission: true });
  sections['体格检查（一）'] = pe.common;
  sections['体格检查（二）：补充及专科情况'] = pe.special;
  sections['实验室检查'] = buildAuxiliary(rec, { category: 'lab' });
  sections['特殊检查'] = buildAuxiliary(rec, { category: 'special' });
  sections['初步诊断'] = buildDiagnosis(rec);

  dedupeHistorySections(sections);

  const lines = ['【入院记录】', ''];
  SECTION_ORDER.forEach((name) => {
    if (!Object.prototype.hasOwnProperty.call(sections, name)) return;
    const body = sections[name] || PH;
    sections[name] = body;
    lines.push(`【${name}】`);
    lines.push(body);
    lines.push('');
  });
  return { text: `${lines.join('\n').trim()}\n`, sections, warnings: validate(r) };
}

export function generatePlain(r: DabingliRecord, opts: Record<string, unknown> = {}): string {
  const { sections } = generate(r, opts);
  const out = ['入院记录', ''];
  SECTION_ORDER.forEach((n) => {
    const body = sections[n];
    if (!body) return;
    if (body.includes('\n')) out.push(`${n}：\n${body}`);
    else out.push(`${n}：${body}`);
  });
  return `${out.join('\n')}\n`;
}
