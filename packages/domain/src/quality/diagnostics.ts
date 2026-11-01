/* ===========================================================================
 * 结构化质控提醒（纯数据，无 DOM 依赖）
 * ---------------------------------------------------------------------------
 * 所有质控、深度自查和首次病程录自查共用这一协议：
 *   { code, severity, path, paths, message, document?, action?, evidence? }
 *
 * `path` 是唯一的主定位字段；`paths` 仅为旧 UI 兼容保留，创建时自动同步。
 * 规则本身应当直接创建诊断对象，不再把展示字符串当作内部协议。
 * ========================================================================= */

var DIAGNOSTICS = (function () {
  'use strict';

  var SEVERITIES = ['error', 'warning', 'info'];

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalizePath(path, paths) {
    var list = [];
    if (Array.isArray(paths)) list = paths.map(text).filter(Boolean);
    var primary = text(path) || list[0] || '';
    if (primary && list.indexOf(primary) < 0) list.unshift(primary);
    return { path: primary, paths: list };
  }

  function normalizeEvidence(evidence) {
    if (!Array.isArray(evidence)) return [];
    return evidence.map(function (item) {
      if (typeof item === 'string') return { path: '', text: item };
      return {
        path: text(item && item.path),
        text: text(item && item.text),
        source: text(item && item.source) || undefined
      };
    }).filter(function (item) { return item.text || item.path; });
  }

  /**
   * 创建一条质控提醒。严格校验 code/severity/path/message，避免界面收到
   * 无法定位或无法分级的新提醒。
   */
  function create(input) {
    var source = input || {};
    var code = text(source.code);
    var severity = text(source.severity) || 'warning';
    var message = text(source.message);
    var loc = normalizePath(source.path, source.paths);
    if (!code) throw new Error('质控提醒缺少 code');
    if (SEVERITIES.indexOf(severity) < 0) throw new Error('质控提醒 severity 非法：' + severity);
    if (!loc.path) throw new Error('质控提醒缺少 path：' + code);
    if (!message) throw new Error('质控提醒缺少 message：' + code);
    return {
      code: code,
      severity: severity,
      path: loc.path,
      paths: loc.paths,
      message: message,
      document: text(source.document) || undefined,
      action: text(source.action) || undefined,
      evidence: normalizeEvidence(source.evidence)
    };
  }

  /** 把旧的 {code,severity,paths,message} 形状补成统一协议。 */
  function fromWarning(warning, defaults) {
    var source = warning && typeof warning === 'object' ? warning : { message: warning };
    var fallback = defaults || {};
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

  function isDiagnostic(value) {
    return !!(value && text(value.code) && SEVERITIES.indexOf(text(value.severity)) >= 0 &&
      text(value.path) && text(value.message));
  }

  function assertValid(list) {
    (Array.isArray(list) ? list : []).forEach(function (item) {
      if (!isDiagnostic(item)) throw new Error('质控提醒结构不完整：' + JSON.stringify(item));
      if (!Array.isArray(item.paths) || item.paths[0] !== item.path) {
        throw new Error('质控提醒 paths 与 path 不一致：' + item.code);
      }
    });
    return list;
  }

  function codes(list) {
    return (Array.isArray(list) ? list : []).map(function (item) { return item && item.code; }).filter(Boolean);
  }

  return {
    SEVERITIES: SEVERITIES.slice(),
    create: create,
    fromWarning: fromWarning,
    isDiagnostic: isDiagnostic,
    assertValid: assertValid,
    codes: codes
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DIAGNOSTICS;
}
