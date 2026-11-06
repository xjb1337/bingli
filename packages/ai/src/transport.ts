import { AiError, AI_ERROR_MESSAGES, aiError, isKnownErrorCode, mapHttpStatus } from './errors';
import { normalizeAiImage, AI_OPERATIONS } from './core';
import type {
  AiErrorCode,
  AiRequestOptions,
  AiTransport,
  AiTransportRequest,
  AiTransportResponse,
  AiTransportStatus,
} from './types';

export const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';
export const DEFAULT_TIMEOUT_MS = 120_000;
export const MAX_RESPONSE_BYTES = 256 * 1024;
export const ANDROID_AI_RECEIVE = 'BINGLI_AI_TRANSPORT_RECEIVE';

interface DeepSeekChoice {
  finish_reason?: unknown;
  message?: {
    content?: unknown;
  };
}

interface DeepSeekPayload {
  choices?: unknown;
  model?: unknown;
}

interface DeepSeekContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail: 'high';
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Recognise requests get a larger completion budget; older callers only carry operation in user JSON. */
function isRecognizeTransportRequest(request: AiTransportRequest): boolean {
  if (request.operation === 'recognize') return true;
  try {
    const payload = JSON.parse(request.user);
    return isObject(payload) && payload.operation === AI_OPERATIONS.recognize;
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return isObject(error) && error.name === 'AbortError';
}

function responseSize(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/** DeepSeek multimodal content: a plain string without an image, parts with one. */
export function buildDeepSeekContent(
  request: AiTransportRequest,
): string | DeepSeekContentPart[] {
  const image = normalizeAiImage(request.image);
  if (!image) return request.user;
  return [
    { type: 'text', text: request.user },
    {
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.dataBase64}`,
        detail: 'high',
      },
    },
  ];
}

function parseDeepSeekResponse(text: string, fallbackModel: string): AiTransportResponse {
  if (!text.trim()) throw aiError('invalid_response', 'AI 返回了空白内容，请重试');
  if (responseSize(text) > MAX_RESPONSE_BYTES) {
    throw aiError('invalid_response', 'AI 返回内容过大，未写入病历');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw aiError('invalid_response');
  }
  if (!isObject(parsed)) throw aiError('invalid_response');
  const payload = parsed as DeepSeekPayload;
  if (!Array.isArray(payload.choices) || payload.choices.length !== 1) {
    throw aiError('invalid_response', 'AI 返回候选数量异常，请重试');
  }
  const choice = payload.choices[0] as DeepSeekChoice | undefined;
  if (!choice) throw aiError('invalid_response', 'AI 返回候选数量异常，请重试');
  if (choice.finish_reason === 'length') throw aiError('truncated_response');
  if (choice.finish_reason === 'content_filter') throw aiError('content_filtered');
  if (choice.finish_reason !== 'stop') throw aiError('request_failed');
  const contentText = choice.message?.content;
  if (typeof contentText !== 'string' || !contentText.trim()) {
    throw aiError('invalid_response', 'AI 返回了空白内容，请重试');
  }
  let content: unknown;
  try {
    content = JSON.parse(contentText);
  } catch {
    throw aiError('invalid_response');
  }
  return {
    content,
    model: typeof payload.model === 'string' && payload.model.trim()
      ? payload.model.trim().slice(0, 60)
      : fallbackModel,
  };
}

export interface WebFetchTransportOptions {
  apiKey: string;
  model?: string;
  endpoint?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** DeepSeek browser transport. The key stays in this instance's private field. */
export class WebFetchTransport implements AiTransport {
  readonly kind = 'web' as const;
  readonly #apiKey: string;
  private readonly model: string;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WebFetchTransportOptions) {
    this.#apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_DEEPSEEK_MODEL;
    this.endpoint = options.endpoint ?? DEEPSEEK_ENDPOINT;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  async status(): Promise<AiTransportStatus> {
    return { configured: this.#apiKey.trim().length > 0, model: this.model };
  }

  async request(
    request: AiTransportRequest,
    options: AiRequestOptions = {},
  ): Promise<AiTransportResponse> {
    if (!this.#apiKey.trim()) throw aiError('missing_key');
    if (options.signal?.aborted) throw aiError('cancelled');

    const controller = new AbortController();
    let timedOut = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cancel = (): void => controller.abort();
    options.signal?.addEventListener('abort', cancel, { once: true });
    timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeoutMs ?? this.timeoutMs);

    try {
      // DeepSeek 只有 Flash 支持图像理解；含图片时本次请求固定走 Flash，不修改已保存的模型设置。
      const requestModel = request.image ? DEFAULT_DEEPSEEK_MODEL : this.model;
      const maxTokens = isRecognizeTransportRequest(request) ? 8192 : 4096;
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          model: requestModel,
          stream: false,
          max_tokens: maxTokens,
          thinking: { type: 'disabled' },
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: request.system },
            { role: 'user', content: buildDeepSeekContent(request) },
          ],
        }),
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      if (!response.ok) throw mapHttpStatus(response.status);
      const text = await response.text();
      return parseDeepSeekResponse(text, requestModel);
    } catch (error) {
      if (error instanceof AiError) throw error;
      if (timedOut) throw aiError('timeout');
      if (options.signal?.aborted || isAbortError(error)) throw aiError('cancelled');
      throw aiError('network');
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      options.signal?.removeEventListener('abort', cancel);
    }
  }
}

export interface AndroidAiBridge {
  aiStatus(): string;
  aiSettings?(): void;
  aiRequest(id: string, payload: string): void;
  aiCancel(id: string): void;
}

interface NativeAiResponse {
  ok?: unknown;
  content?: unknown;
  model?: unknown;
  error?: unknown;
  code?: unknown;
}

interface TransportWindow extends Window {
  [ANDROID_AI_RECEIVE]?: (id: string, response: NativeAiResponse) => void;
}

export function getAndroidAiBridge(): AndroidAiBridge | null {
  if (typeof window === 'undefined') return null;
  const candidate = (window as unknown as { BingliAndroid?: unknown }).BingliAndroid;
  if (
    !isObject(candidate)
    || typeof candidate.aiStatus !== 'function'
    || typeof candidate.aiRequest !== 'function'
    || typeof candidate.aiCancel !== 'function'
  ) {
    return null;
  }
  return candidate as unknown as AndroidAiBridge;
}

function nativeCode(value: unknown, fallback: AiErrorCode): AiErrorCode {
  return isKnownErrorCode(value) ? value : fallback;
}

function nativeError(response: NativeAiResponse): AiError {
  const code = nativeCode(response.code, 'request_failed');
  const message = typeof response.error === 'string' && response.error.trim()
    ? response.error.trim()
    : AI_ERROR_MESSAGES[code];
  return new AiError(code, message);
}

export interface AndroidBridgeTransportOptions {
  bridge: AndroidAiBridge;
  model?: string;
  timeoutMs?: number;
  requestId?: () => string;
}

/** Calls only the existing BingliAndroid AI bridge; the API key never enters JS. */
export class AndroidBridgeTransport implements AiTransport {
  readonly kind = 'android' as const;
  private readonly bridge: AndroidAiBridge;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly requestId: () => string;

  constructor(options: AndroidBridgeTransportOptions) {
    this.bridge = options.bridge;
    this.model = options.model ?? DEFAULT_DEEPSEEK_MODEL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.requestId = options.requestId ?? (() => `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`);
  }

  async status(): Promise<AiTransportStatus> {
    try {
      const raw = this.bridge.aiStatus();
      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed)) return { configured: false, model: this.model };
      return {
        configured: parsed.configured === true,
        model: typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model.trim().slice(0, 60)
          : this.model,
      };
    } catch {
      return { configured: false, model: this.model };
    }
  }

  async request(
    request: AiTransportRequest,
    options: AiRequestOptions = {},
  ): Promise<AiTransportResponse> {
    if (options.signal?.aborted) throw aiError('cancelled');
    if (typeof window === 'undefined') throw aiError('request_failed');
    const status = await this.status();
    if (!status.configured) throw aiError('missing_key', '请先在 Android AI 设置中保存 API Key');
    const image = normalizeAiImage(request.image);

    const id = this.requestId();
    return await new Promise<AiTransportResponse>((resolve, reject) => {
      let settled = false;
      let timedOut = false;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const target = window as TransportWindow;

      const cleanup = (): void => {
        if (timeout !== undefined) clearTimeout(timeout);
        options.signal?.removeEventListener('abort', cancel);
        if (target[ANDROID_AI_RECEIVE] === receive) delete target[ANDROID_AI_RECEIVE];
      };
      const settle = (error: AiError | null, response?: AiTransportResponse): void => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else if (response) resolve(response);
      };
      const cancel = (): void => {
        if (settled) return;
        this.bridge.aiCancel(id);
        settle(aiError('cancelled'));
      };
      const receive = (receivedId: string, response: NativeAiResponse): void => {
        if (receivedId !== id) return;
        if (response.ok !== true) {
          settle(nativeError(response));
          return;
        }
        if (response.content === undefined || response.content === null) {
          settle(aiError('invalid_response', 'AI 返回了空白内容，请重试'));
          return;
        }
        settle(null, {
          content: response.content,
          model: typeof response.model === 'string' && response.model.trim()
            ? response.model.trim().slice(0, 60)
            : status.model,
        });
      };

      target[ANDROID_AI_RECEIVE] = receive;
      options.signal?.addEventListener('abort', cancel, { once: true });
      timeout = setTimeout(() => {
        if (settled) return;
        timedOut = true;
        this.bridge.aiCancel(id);
        settle(aiError('timeout'));
      }, options.timeoutMs ?? this.timeoutMs);

      try {
        this.bridge.aiRequest(id, JSON.stringify({
          system: request.system,
          user: request.user,
          ...(image ? { image } : {}),
        }));
      } catch {
        if (timedOut) settle(aiError('timeout'));
        else settle(aiError('request_failed'));
      }
    });
  }
}
