/* ============================================================
 * 模板病例（TEMPLATES）
 * ------------------------------------------------------------
 * 三条铁律：
 *   1. 套用模板只填空白的，一个字都不覆盖。
 *   2. 模板不写患者身份（姓名/性别/年龄/住院号/床号）与生命体征数字。
 *   3. 模板数据是数据，不是逻辑。这个文件只负责「查、套、报」。
 * ============================================================ */

import { fillBlanks, getPath, setFieldState } from './core';
import { DOCUMENT_TEMPLATES } from './generator/document-templates';
import { DEPARTMENTS, findPEItem } from './schema';
import TEMPLATE_DATA from './template-data-module';
import type {
  DabingliRecord,
  DocumentTemplateMap,
  Template,
  TemplateApplyResult,
  TemplateOutlineItem,
  TemplatePlaceholder
} from './types';

const DEFAULT_SOURCE = {
  kind: 'textbook-template',
  label: '教学模板',
  note: '依据《诊断学》常见病典型表现整理，尚未与医院正式病历模板核对。'
};

function normalizeTemplate(template: Template): Template {
  const source =
    template.source && typeof template.source === 'object'
      ? { ...template.source }
      : { ...DEFAULT_SOURCE };
  const verified = template.verified === true;
  return {
    ...template,
    source,
    verified,
    verificationStatus: verified ? 'verified' : 'unverified',
    verificationLabel: verified ? '已核对' : '待医院模板核对'
  };
}

const RAW_DATA: readonly Template[] = Array.isArray(TEMPLATE_DATA) ? TEMPLATE_DATA : [];
const NORMALIZED: readonly Template[] = RAW_DATA.map(normalizeTemplate);

export const SIDE_PLACEHOLDERS: readonly string[] = ['（患侧）', '（对侧）', '（健侧）'];
const SIDE_PLACEHOLDER_RE = /（(?:患侧|对侧|健侧)）/g;

export const SECTION_LABEL: Readonly<Record<string, string>> = {
  basic: '基本情况',
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
  soap: '首次病程录',
  discharge: '出院记录'
};

export function findUnfilledPlaceholders(value: unknown): TemplatePlaceholder[] {
  const out: TemplatePlaceholder[] = [];
  function walk(node: unknown, path: string): void {
    if (typeof node === 'string') {
      const matches = node.match(SIDE_PLACEHOLDER_RE);
      if (matches) matches.forEach((placeholder) => out.push({ path, placeholder, text: node }));
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      Object.keys(obj).forEach((key) => walk(obj[key], path ? `${path}.${key}` : key));
    }
  }
  walk(value, '');
  return out;
}

export function unfilledPlaceholders(key: string): TemplatePlaceholder[] {
  const t = get(key);
  if (!t) return [];
  return findUnfilledPlaceholders({
    name: t.name,
    alias: t.alias || [],
    hint: t.hint || '',
    record: t.record || {}
  });
}

export function listByDept(deptKey: string): Template[] {
  const k = String(deptKey || '');
  if (!k || k === 'general') return [];
  return NORMALIZED.filter((t) => t.dept === k);
}

export function get(key: string): Template | null {
  const k = String(key || '');
  return NORMALIZED.find((t) => t.key === k) || null;
}

export function all(): Template[] {
  return NORMALIZED.slice();
}

export function deptName(deptKey: string): string {
  const d = DEPARTMENTS.find((x) => x.key === deptKey);
  return d ? d.name : deptKey;
}

export function outlineOf(t: Template): TemplateOutlineItem[] {
  const out: TemplateOutlineItem[] = [];
  const add = (path: string, section: string, label: string): void => {
    out.push({ path, section, label });
  };
  const r = (t.record || {}) as {
    basic?: { chiefComplaint?: string };
    pe?: Record<string, Record<string, unknown> | undefined>;
    auxiliary?: { items?: Array<{ name?: string }> };
  };
  const chief = (r.basic || {}).chiefComplaint;
  if (chief) {
    add(
      'basic.chiefComplaint',
      '本范例的问诊线索',
      `围绕范例主诉「${chief}」询问当前患者：是否存在相关症状？何时开始、如何变化？不要照抄范例的时长。`
    );
  }
  add(
    'hpi',
    '现病史',
    '逐项询问起病时间与诱因、症状部位与性质、程度、持续时间、加重缓解因素、伴随症状、诊疗经过及一般情况；按患者实际回答记录。'
  );
  add(
    'pmh',
    '病史补充',
    '询问既往疾病、手术外伤、用药及过敏史，补充个人史、婚育史和家族史；不把范例中的阴性病史当作已询问。'
  );
  Object.entries(r.pe || {}).forEach(([group, fields]) => {
    if (!fields || typeof fields !== 'object' || group === 'vitals') return;
    Object.keys(fields).forEach((key) => {
      const item = findPEItem(`${group}.${key}`);
      const label = item && item.label;
      if (label) add(`pe.${group}.${key}`, '体格检查', `检查并记录：${label}（以本次实际查体为准）`);
    });
  });
  add('pe.vitals', '体格检查', '测量并记录本次生命体征；未检查的项目保持待查。');
  ((r.auxiliary || {}).items || []).forEach((item, i) => {
    if (item && item.name) {
      add(
        `auxiliary.items.${i}`,
        '本范例涉及的检查核实项目',
        `${item.name}：当前患者是否已有报告？核对日期、来源和实际结果；是否需要检查由临床判断。`
      );
    }
  });
  add('diagnosis', '诊断与记录', '根据当前患者的病史、查体和实际检查资料整理诊断依据、鉴别诊断与待完善项目，不直接套用范例诊断。');
  return out;
}

export function previewPaths(key: string): string[] {
  const t = get(key);
  if (!t) return [];
  const out: string[] = [];
  function walk(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    Object.keys(obj).forEach((k) => {
      const p = path ? `${path}.${k}` : k;
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p);
      else out.push(p);
    });
  }
  walk(t.record, '');
  return out;
}

function snapshotNonEmpty(record: DabingliRecord): string[] {
  const out: string[] = [];
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const rec = record as unknown as Record<string, unknown>;
  Object.keys(rec || {}).forEach((k) => {
    const sub = rec[k];
    if (!isObj(sub)) return;
    Object.keys(sub).forEach((k2) => {
      const v = sub[k2];
      const nonEmpty =
        (typeof v === 'string' && v.trim() !== '') ||
        (Array.isArray(v) && v.length > 0) ||
        (isObj(v) && Object.keys(v).length > 0);
      if (nonEmpty) out.push(`${k}.${k2}`);
    });
  });
  return out;
}

export function apply(
  record: DabingliRecord,
  key: string,
  opts?: { mode?: 'example' | 'patient' }
): TemplateApplyResult & { outline?: TemplateOutlineItem[] } {
  const t = get(key);
  const mode = opts && opts.mode === 'patient' ? 'patient' : 'example';
  if (!t || !record) return { filled: [], count: 0, skipped: [], ok: false, mode };
  if (mode === 'patient') {
    return {
      ok: true,
      mode,
      filled: [],
      count: 0,
      skipped: [],
      outline: outlineOf(t),
      name: t.name,
      dept: t.dept
    };
  }

  const before = snapshotNonEmpty(record);
  const beforeDur = String((record.basic && record.basic.chiefComplaintDuration) || '').trim();
  const tplBasic = ((t.record as Record<string, unknown>).basic || {}) as {
    chiefComplaintDuration?: unknown;
    chiefComplaintDurationUnit?: unknown;
  };

  const filled = fillBlanks(record, t.record);

  if (!beforeDur && String(tplBasic.chiefComplaintDuration || '').trim()) {
    const unit = String(tplBasic.chiefComplaintDurationUnit || '').trim();
    if (unit && record.basic.chiefComplaintDurationUnit !== unit) {
      record.basic.chiefComplaintDurationUnit = unit;
      if (filled.indexOf('basic.chiefComplaintDurationUnit') < 0) {
        filled.push('basic.chiefComplaintDurationUnit');
      }
    }
  }

  if (t.dept && (!record.basic.department || record.basic.department === 'general')) {
    record.basic.department = t.dept;
    if (filled.indexOf('basic.department') < 0) filled.push('basic.department');
  }

  if (record.meta) {
    filled.forEach((p) => {
      setFieldState(record, p, {
        source: 'template',
        reviewed: false,
        reviewedValueHash: '',
        sourceRef: key
      });
    });
  }

  const values: Record<string, string> = {};
  filled.forEach((p) => {
    const v = getPath(record, p);
    if (typeof v === 'string') values[p] = v;
  });
  if (record.meta) {
    record.meta.lastTemplateFill = {
      key,
      name: t.name,
      at: new Date().toISOString(),
      filled: filled.slice(),
      values
    };
  }

  return {
    ok: true,
    mode,
    filled,
    count: filled.length,
    skipped: before,
    name: t.name,
    dept: t.dept,
    values
  };
}

export { DOCUMENT_TEMPLATES };

export const TEMPLATES: {
  DOCUMENT_TEMPLATES: DocumentTemplateMap;
  listByDept: typeof listByDept;
  get: typeof get;
  all: typeof all;
  apply: typeof apply;
  previewPaths: typeof previewPaths;
  deptName: typeof deptName;
  outlineOf: typeof outlineOf;
  SECTION_LABEL: typeof SECTION_LABEL;
  SIDE_PLACEHOLDERS: typeof SIDE_PLACEHOLDERS;
  findUnfilledPlaceholders: typeof findUnfilledPlaceholders;
  unfilledPlaceholders: typeof unfilledPlaceholders;
} = {
  DOCUMENT_TEMPLATES,
  listByDept,
  get,
  all,
  apply,
  previewPaths,
  deptName,
  outlineOf,
  SECTION_LABEL,
  SIDE_PLACEHOLDERS,
  findUnfilledPlaceholders,
  unfilledPlaceholders
};

export default TEMPLATES;
