import type { AiErrorCode } from './types';

export const AI_ERROR_MESSAGES: Readonly<Record<AiErrorCode, string>> = Object.freeze({
  missing_key: '请在 AI 助手顶部「API 设置」中输入 DeepSeek API Key',
  unauthorized: 'API Key 无效，请检查 AI 设置后重试',
  forbidden: 'API Key 无权限，请检查 AI 设置后重试',
  insufficient_balance: 'DeepSeek 余额不足，请充值后重试',
  rate_limited: '请求过于频繁，请稍后重试',
  server_unavailable: 'DeepSeek 服务暂不可用，请稍后重试',
  http_error: 'DeepSeek 请求失败，请检查模型设置后重试',
  timeout: '请求超时，原病历未改动；可缩短资料后重试',
  network: '网络连接失败，请检查联网后重试',
  cancelled: '已取消 AI 请求',
  invalid_response: 'AI 返回格式异常，未写入病历；请重试',
  truncated_response: 'AI 结果未完整结束，未写入病历；请缩短资料后重试',
  content_filtered: '内容被服务端安全策略拦截',
  request_failed: 'AI 请求无法完成，请重试',
  record_stale: '病历已改变，此 AI 结果已过期，无法写入；请重新生成',
  invalid_input: '请求内容无效，请检查后重试',
  out_of_scope: 'AI 返回了越界字段，未写入病历',
  invalid_selection: '请选择有效的 AI 建议',
  existing_content: '目标字段已有内容；请明确允许替换，或取消该项',
});

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status?: number;

  constructor(code: AiErrorCode, message = AI_ERROR_MESSAGES[code], status?: number) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

export function aiError(code: AiErrorCode, message?: string, status?: number): AiError {
  return new AiError(code, message, status);
}

export function mapHttpStatus(status: number): AiError {
  if (status === 401) return new AiError('unauthorized', AI_ERROR_MESSAGES.unauthorized, status);
  if (status === 403) return new AiError('forbidden', AI_ERROR_MESSAGES.forbidden, status);
  if (status === 402) return new AiError('insufficient_balance', AI_ERROR_MESSAGES.insufficient_balance, status);
  if (status === 429) return new AiError('rate_limited', AI_ERROR_MESSAGES.rate_limited, status);
  if (status >= 500) return new AiError('server_unavailable', AI_ERROR_MESSAGES.server_unavailable, status);
  return new AiError('http_error', `DeepSeek 请求失败（HTTP ${status}），请检查模型设置后重试`, status);
}

export function isAiError(value: unknown): value is AiError {
  return value instanceof AiError;
}

export function toAiError(value: unknown, fallback: AiErrorCode = 'request_failed'): AiError {
  if (value instanceof AiError) return value;
  return new AiError(fallback);
}

export function isKnownErrorCode(value: unknown): value is AiErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(AI_ERROR_MESSAGES, value);
}
