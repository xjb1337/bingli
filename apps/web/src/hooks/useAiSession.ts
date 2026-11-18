import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiImagePayload, AiOperation, AiRequest, AiResult } from '@dabingli/ai';

export interface AiImageAttachment extends AiImagePayload {
  previewDataUrl: string;
  name: string;
}

export type OrganizeStep = 1 | 2 | 3 | 4;

export interface AiSessionState {
  operation: AiOperation;
  organizeStep: OrganizeStep;
  resultAdopted: boolean;
  target: string;
  fallbackNotes: string;
  recognizeText: string;
  recognizeImage: AiImageAttachment | null;
  processingImage: boolean;
  request: AiRequest | null;
  redactions: { label: string; categories: string[] }[];
  consent: boolean;
  result: AiResult | null;
  selected: ReadonlySet<number>;
  allowReplace: boolean;
  busy: boolean;
  status: string;
  error: string;
  retryAfterSeconds: number | null;
  elapsedSeconds: number;
}

export function createInitialAiSession(initialTarget = 'hpi.symptoms'): AiSessionState {
  return {
    operation: 'organize',
    organizeStep: 1,
    resultAdopted: false,
    target: initialTarget,
    fallbackNotes: '',
    recognizeText: '',
    recognizeImage: null,
    processingImage: false,
    request: null,
    redactions: [],
    consent: false,
    result: null,
    selected: new Set(),
    allowReplace: false,
    busy: false,
    status: '',
    error: '',
    retryAfterSeconds: null,
    elapsedSeconds: 0,
  };
}

export function useAiSession(recordId: string | undefined, initialTarget = 'hpi.symptoms') {
  const [session, setSession] = useState<AiSessionState>(() => createInitialAiSession(initialTarget));
  const [transportEpoch, setTransportEpoch] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const recordIdRef = useRef(recordId);

  const patchSession = useCallback((patch: Partial<AiSessionState> | ((prev: AiSessionState) => AiSessionState)) => {
    setSession((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const resetForRecordSwitch = useCallback(
    (nextTarget = 'hpi.symptoms') => {
      abortRef.current?.abort();
      abortRef.current = null;
      setSession(createInitialAiSession(nextTarget));
    },
    [],
  );

  const resetTransportAndAbort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setTransportEpoch((epoch) => epoch + 1);
    setSession((prev) => ({
      ...prev,
      busy: false,
      elapsedSeconds: 0,
      status: prev.busy ? '已清空密钥并终止当前请求' : prev.status,
    }));
  }, []);

  useEffect(() => {
    if (recordIdRef.current !== recordId) {
      recordIdRef.current = recordId;
      resetForRecordSwitch(initialTarget);
    }
  }, [initialTarget, recordId, resetForRecordSwitch]);

  // Track elapsed waiting seconds during active requests
  useEffect(() => {
    if (!session.busy) return;
    const interval = window.setInterval(() => {
      setSession((prev) => (prev.busy ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : prev));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session.busy]);

  // Countdown HTTP 429 Retry-After seconds
  useEffect(() => {
    if (!session.retryAfterSeconds || session.retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setSession((prev) => {
        const next = prev.retryAfterSeconds && prev.retryAfterSeconds > 1 ? prev.retryAfterSeconds - 1 : null;
        return { ...prev, retryAfterSeconds: next };
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [session.retryAfterSeconds]);

  const hasUnsentWork = session.busy || Boolean(session.recognizeImage && !session.resultAdopted);

  return {
    session,
    patchSession,
    abortRef,
    transportEpoch,
    resetTransportAndAbort,
    resetForRecordSwitch,
    hasUnsentWork,
  };
}
