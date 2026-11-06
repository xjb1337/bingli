import type { DabingliRecord } from '@dabingli/domain';

export type AiOperation = 'organize' | 'polish' | 'check' | 'summary' | 'recognize';

export type AiSuggestionKind = 'text' | 'choice' | 'number';

export type AiErrorCode =
  | 'missing_key'
  | 'unauthorized'
  | 'forbidden'
  | 'insufficient_balance'
  | 'rate_limited'
  | 'server_unavailable'
  | 'http_error'
  | 'timeout'
  | 'network'
  | 'cancelled'
  | 'invalid_response'
  | 'truncated_response'
  | 'content_filtered'
  | 'request_failed'
  | 'record_stale'
  | 'invalid_input'
  | 'out_of_scope'
  | 'invalid_selection'
  | 'existing_content';

export interface AiSource {
  source: string;
  label: string;
  text: string;
}

export interface AiRequestBaseline {
  recordId: string;
  revision: number;
  contentHash: string;
}

export interface AiRequest {
  operation: AiOperation;
  target: string;
  baseline: AiRequestBaseline;
  sources: AiSource[];
  allowed: string[];
  system: string;
  user: string;
  image?: AiImagePayload;
}

export interface AiImagePayload {
  mimeType: string;
  dataBase64: string;
}

export interface AiEvidence {
  source: string;
  quote: string;
}

export interface AiSuggestion {
  path: string;
  text: string;
  evidence: AiEvidence[];
  kind?: AiSuggestionKind;
  /** True when the suggestion is based on an image and cannot be machine-verified. */
  fromImage?: boolean;
}

export interface AiDroppedSuggestion {
  path: string;
  reason: string;
}

export interface AiIssue {
  path: string;
  message: string;
}

export interface AiValidatedContent {
  suggestions: AiSuggestion[];
  issues: AiIssue[];
  questions: string[];
  dropped: AiDroppedSuggestion[];
}

export interface AiResult extends AiValidatedContent {
  baseline: AiRequestBaseline;
  model: string;
  createdAt: string;
  reviewed: false;
}

export interface AiAdoptedField {
  path: string;
  label: string;
  text: string;
  reviewed: boolean;
  model: string;
  adoptedAt: string;
  baseline: AiRequestBaseline | null;
  evidence: AiEvidence[];
  evidencePaths: string[];
}

export interface AiTransportRequest {
  system: string;
  user: string;
  image?: AiImagePayload;
  /** Optional operation hint; transports fall back to the operation encoded in user JSON. */
  operation?: AiOperation;
}

export interface AiTransportResponse {
  content: unknown;
  model: string;
}

export interface AiTransportStatus {
  configured: boolean;
  model: string;
}

export interface AiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AiTransport {
  readonly kind: 'web' | 'android';
  status(): Promise<AiTransportStatus>;
  request(request: AiTransportRequest, options?: AiRequestOptions): Promise<AiTransportResponse>;
}

export type AiTransportFactory = (apiKey: string) => AiTransport;

export interface AiRecordContext {
  record: DabingliRecord;
}
