import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AI_ERROR_MESSAGES,
  ANDROID_AI_RECEIVE,
  AndroidBridgeTransport,
  WebFetchTransport,
  type AndroidAiBridge,
} from '../src';

function response(status: number, body = ''): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as Response;
}

function successBody(text = '患者诉咳嗽3天。'): string {
  return JSON.stringify({
    model: 'deepseek-flash',
    choices: [{
      finish_reason: 'stop',
      message: {
        content: JSON.stringify({
          suggestions: [{
            path: 'hpi.symptoms',
            text,
            evidence: [{ source: 'note', quote: '患者诉咳嗽3天' }],
          }],
          issues: [],
          questions: [],
        }),
      },
    }],
  });
}

const request = { system: 'system', user: '{"sources":[]}' };
const image = { mimeType: 'image/jpeg', dataBase64: 'aGVsbG8=' };

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.useRealTimers();
});

describe('WebFetchTransport', () => {
  it('fails locally without calling fetch when the key is empty', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const transport = new WebFetchTransport({ apiKey: '', fetchImpl });
    await expect(transport.request(request)).rejects.toMatchObject({ code: 'missing_key' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('calls the default global fetch without rebinding this (browser Illegal invocation)', async () => {
    const original = globalThis.fetch;
    const strictFetch = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
      return Promise.resolve(response(200, successBody()));
    });
    globalThis.fetch = strictFetch as unknown as typeof fetch;
    try {
      const transport = new WebFetchTransport({ apiKey: 'sk-test-memory-only' });
      const result = await transport.request(request);
      expect(result.model).toBe('deepseek-flash');
      expect(strictFetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('sends the key only in the authorization header and parses final JSON', async () => {
    const fetchImpl = vi.fn(async () => response(200, successBody())) as unknown as typeof fetch;
    const transport = new WebFetchTransport({
      apiKey: 'sk-test-memory-only',
      fetchImpl,
      endpoint: 'https://api.deepseek.com/chat/completions',
    });
    const result = await transport.request(request);

    expect(result.model).toBe('deepseek-flash');
    expect(result.content).toMatchObject({ suggestions: [{ path: 'hpi.symptoms' }] });
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer sk-test-memory-only' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('builds DeepSeek multimodal content parts for image requests', async () => {
    const fetchImpl = vi.fn(async () => response(200, successBody())) as unknown as typeof fetch;
    const transport = new WebFetchTransport({ apiKey: 'sk-test-image', fetchImpl });
    await transport.request({ ...request, image });

    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      messages: Array<{ role: string; content: unknown }>;
    };
    expect(body.messages[1]?.content).toEqual([
      { type: 'text', text: request.user },
      {
        type: 'image_url',
        image_url: { url: 'data:image/jpeg;base64,aGVsbG8=', detail: 'high' },
      },
    ]);
  });

  it('rejects an invalid image before making a network request', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const transport = new WebFetchTransport({ apiKey: 'sk-test-image', fetchImpl });
    await expect(transport.request({
      ...request,
      image: { mimeType: 'image/bmp', dataBase64: 'aGVsbG8=' },
    })).rejects.toMatchObject({ code: 'invalid_input' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [402, 'insufficient_balance'],
    [429, 'rate_limited'],
    [500, 'server_unavailable'],
    [503, 'server_unavailable'],
  ] as const)('maps HTTP %i to %s with a stable message', async (status, code) => {
    const transport = new WebFetchTransport({
      apiKey: 'sk-test',
      fetchImpl: (async () => response(status)) as unknown as typeof fetch,
    });
    await expect(transport.request(request)).rejects.toMatchObject({
      code,
      message: AI_ERROR_MESSAGES[code],
    });
  });

  it('maps an actual timeout distinctly from cancellation', async () => {
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })) as unknown as typeof fetch;
    const transport = new WebFetchTransport({ apiKey: 'sk-test', fetchImpl, timeoutMs: 5 });
    await expect(transport.request(request)).rejects.toMatchObject({
      code: 'timeout',
      message: AI_ERROR_MESSAGES.timeout,
    });
  });

  it('maps network failures without echoing credentials', async () => {
    const transport = new WebFetchTransport({
      apiKey: 'sk-never-log-this',
      fetchImpl: (async () => { throw new TypeError('network down sk-never-log-this'); }) as unknown as typeof fetch,
    });
    await expect(transport.request(request)).rejects.toMatchObject({
      code: 'network',
      message: AI_ERROR_MESSAGES.network,
    });
  });
});

describe('AndroidBridgeTransport', () => {
  it('returns only native content/model and never asks the bridge for a key', async () => {
    (globalThis as { window?: unknown }).window = {};
    const bridge: AndroidAiBridge = {
      aiStatus: () => JSON.stringify({ configured: true, model: 'deepseek-flash' }),
      aiRequest: (id, payload) => {
        expect(JSON.parse(payload)).toEqual({ system: request.system, user: request.user });
        const receive = (window as unknown as Record<string, unknown>)[ANDROID_AI_RECEIVE] as (
          id: string,
          response: unknown,
        ) => void;
        receive(id, {
          ok: true,
          model: 'deepseek-flash',
          content: { suggestions: [], issues: [], questions: [] },
        });
      },
      aiCancel: vi.fn(),
    };
    const transport = new AndroidBridgeTransport({ bridge, requestId: () => 'req_1' });
    await expect(transport.request(request)).resolves.toEqual({
      model: 'deepseek-flash',
      content: { suggestions: [], issues: [], questions: [] },
    });
  });

  it('uses the native stable error code and message', async () => {
    (globalThis as { window?: unknown }).window = {};
    const bridge: AndroidAiBridge = {
      aiStatus: () => JSON.stringify({ configured: true, model: 'deepseek-flash' }),
      aiRequest: (id) => {
        const receive = (window as unknown as Record<string, unknown>)[ANDROID_AI_RECEIVE] as (
          id: string,
          response: unknown,
        ) => void;
        receive(id, { ok: false, code: 'rate_limited', error: AI_ERROR_MESSAGES.rate_limited });
      },
      aiCancel: vi.fn(),
    };
    const transport = new AndroidBridgeTransport({ bridge, requestId: () => 'req_2' });
    await expect(transport.request(request)).rejects.toMatchObject({
      code: 'rate_limited',
      message: AI_ERROR_MESSAGES.rate_limited,
    });
  });

  it('passes validated image fields through the Android bridge payload', async () => {
    (globalThis as { window?: unknown }).window = {};
    let payload: unknown;
    const bridge: AndroidAiBridge = {
      aiStatus: () => JSON.stringify({ configured: true, model: 'deepseek-flash' }),
      aiRequest: (id, raw) => {
        payload = JSON.parse(raw);
        const receive = (window as unknown as Record<string, unknown>)[ANDROID_AI_RECEIVE] as (
          id: string,
          response: unknown,
        ) => void;
        receive(id, {
          ok: true,
          model: 'deepseek-flash',
          content: { suggestions: [], issues: [], questions: [] },
        });
      },
      aiCancel: vi.fn(),
    };
    const transport = new AndroidBridgeTransport({ bridge, requestId: () => 'req_image' });
    await transport.request({ ...request, image });
    expect(payload).toEqual({ ...request, image });
  });

  it('cancels native work on timeout', async () => {
    (globalThis as { window?: unknown }).window = {};
    const aiCancel = vi.fn();
    const bridge: AndroidAiBridge = {
      aiStatus: () => JSON.stringify({ configured: true, model: 'deepseek-flash' }),
      aiRequest: () => undefined,
      aiCancel,
    };
    const transport = new AndroidBridgeTransport({ bridge, timeoutMs: 5, requestId: () => 'req_3' });
    await expect(transport.request(request)).rejects.toMatchObject({ code: 'timeout' });
    expect(aiCancel).toHaveBeenCalledWith('req_3');
  });
});
