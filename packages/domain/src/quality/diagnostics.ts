/* ===========================================================================
 * 结构化质控提醒（纯数据，无 DOM 依赖）
 * ---------------------------------------------------------------------------
 * 所有质控、深度自查和首次病程录自查共用这一协议：
 *   { code, severity, path, paths, message, document?, action?, evidence? }
 *
 * `path` 是唯一的主定位字段；`paths` 仅为旧 UI 兼容保留，创建时自动同步。
 * 规则本身应当直接创建诊断对象，不再把展示字符串当作内部协议。
 * ========================================================================= */

import type { DiagnosticSeverity, DocumentKind, DocumentWarning, Evidence, SourceKind } from '../types';

export const SEVERITIES: readonly DiagnosticSeverity[] = ['error', 'warning', 'info'];

function cleanText(value: unknown): string {
  return String(value == null ? '' : value).trim();
}

function normalizePath(path: unknown, paths: unknown): { path: string; paths: string[] } {
  let list: string[] = [];
  if (Array.isArray(paths)) list = paths.map(cleanText).filter(Boolean);
  const primary = cleanText(path) || list[0] || '';
  if (primary && list.indexOf(primary) < 0) list.unshift(primary);
  return { path: primary, paths: list };
}

function normalizeEvidence(evidence: unknown): Evidence[] {
  if (!Array.isArray(evidence)) return [];
  return evidence.map((item): Evidence => {
    if (typeof item === 'string') return { path: '', text: item };
    const obj = (item && typeof item === 'object' ? item : {}) as {
      path?: unknown;
      text?: unknown;
      source?: unknown;
    };
    const sourceText = cleanText(obj.source);
    return {
      path: cleanText(obj.path),
      text: cleanText(obj.text),
      source: (sourceText || undefined) as SourceKind | undefined
    };
  }).filter((item) => item.text || item.path);
}

export interface CreateDiagnosticInput {
  code?: unknown;
  severity?: DiagnosticSeverity | string;
  path?: unknown;
  paths?: unknown;
  message?: unknown;
  document?: DocumentKind | string;
  action?: unknown;
  evidence?: unknown;
}

/**
 * 创建一条质控提醒。严格校验 code/severity/path/message，避免界面收到
 * 无法定位或无法分级的新提醒。
 */
export function create(input: CreateDiagnosticInput): DocumentWarning {
  const source = input || {};
  const code = cleanText(source.code);
  const severity = (cleanText(source.severity) || 'warning') as DiagnosticSeverity;
  const message = cleanText(source.message);
  const loc = normalizePath(source.path, source.paths);
  if (!code) throw new Error('质控提醒缺少 code');
  if (SEVERITIES.indexOf(severity) < 0) throw new Error('质控提醒 severity 非法：' + severity);
  if (!loc.path) throw new Error('质控提醒缺少 path：' + code);
  if (!message) throw new Error('质控提醒缺少 message：' + code);
  const docText = cleanText(source.document);
  const actionText = cleanText(source.action);
  return {
    code,
    severity,
    path: loc.path,
    paths: loc.paths,
    message,
    document: (docText || undefined) as DocumentKind | undefined,
    action: actionText || undefined,
    evidence: normalizeEvidence(source.evidence)
  };
}

/** 把旧的 {code,severity,paths,message} 形状补成统一协议。 */
export function fromWarning(
  warning: Partial<DocumentWarning> | string | null | undefined,
  defaults?: Partial<DocumentWarning>
): DocumentWarning {
  const source: Partial<DocumentWarning> =
    warning && typeof warning === 'object' ? warning : { message: String(warning ?? '') };
  const fallback = defaults || {};
  return create({
    code: source.code || fallback.code,
    severity: source.severity || fallback.severity,
    path: source.path || (Array.isArray(source.paths) ? source.paths[0] : '') || fallback.path,
    paths: source.paths || fallback.paths,
    message: source.message,
    document: source.document || fallback.document,
    action: source.action || fallback.action,
    evidence: source.evidence || fallback.evidence
  });
}

export function isDiagnostic(value: unknown): value is DocumentWarning {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<DocumentWarning>;
  return !!(
    cleanText(item.code) &&
    SEVERITIES.indexOf(cleanText(item.severity) as DiagnosticSeverity) >= 0 &&
    cleanText(item.path) &&
    cleanText(item.message)
  );
}

export function assertValid(list: unknown[]): DocumentWarning[] {
  const items = Array.isArray(list) ? list : [];
  items.forEach((item) => {
    if (!isDiagnostic(item)) throw new Error('质控提醒结构不完整：' + JSON.stringify(item));
    if (!Array.isArray(item.paths) || item.paths[0] !== item.path) {
      throw new Error('质控提醒 paths 与 path 不一致：' + item.code);
    }
  });
  return items as DocumentWarning[];
}

export function codes(list: readonly (DocumentWarning | null | undefined)[]): string[] {
  return (Array.isArray(list) ? list : [])
    .map((item) => item && item.code)
    .filter((c): c is string => Boolean(c));
}

export const DIAGNOSTICS = {
  SEVERITIES: SEVERITIES.slice(),
  create,
  fromWarning,
  isDiagnostic,
  assertValid,
  codes
};

export default DIAGNOSTICS;
