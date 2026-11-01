import { useEffect, useRef, useState } from 'react';
import {
  AI_FIELDS,
  AI_OPERATIONS,
  adoptAiSuggestions,
  assertAiRequestCurrent,
  createAiResult,
  errorMessage,
  listAdoptedAiFields,
  prepareAiRequest,
  validateAiResponse,
  type AiOperation,
  type AiRequest,
  type AiResult,
  type AiTransport,
} from '@dabingli/ai';
import { RECORD_CORE, type DabingliRecord } from '@dabingli/domain';
import { Card } from './StepShell';

export interface AiAssistantPanelProps {
  record: DabingliRecord;
  configured: boolean;
  securityContext: 'web' | 'android';
  model: string;
  loadingAndroidStatus?: boolean;
  createTransport: () => AiTransport;
  onOpenSettings: () => void;
  onAdoptRecord: (record: DabingliRecord) => Promise<boolean>;
  onConfirmField: (path: string) => Promise<boolean>;
}

function fieldValue(record: DabingliRecord, path: string): string {
  const value = RECORD_CORE.getPath(record, path);
  return typeof value === 'string' ? value : '';
}

function noKeyMessage(securityContext: 'web' | 'android', loading: boolean): string {
  if (securityContext === 'android') {
    return loading
      ? '正在读取 Android 安全存储中的 AI 配置…'
      : 'Android 安全存储中尚未配置 API Key。普通填写、保存和文书生成不受影响。';
  }
  return '未配置 API Key。普通填写、保存和文书生成不受影响；AI 功能需要先在设置中输入密钥。';
}

export function AiAssistantPanel({
  record,
  configured,
  securityContext,
  model,
  loadingAndroidStatus = false,
  createTransport,
  onOpenSettings,
  onAdoptRecord,
  onConfirmField,
}: AiAssistantPanelProps) {
  const [operation, setOperation] = useState<AiOperation>('organize');
  const [target, setTarget] = useState('hpi.symptoms');
  const [notes, setNotes] = useState('');
  const [request, setRequest] = useState<AiRequest | null>(null);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [allowReplace, setAllowReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const recordRef = useRef(record);
  const abortRef = useRef<AbortController | null>(null);
  recordRef.current = record;

  useEffect(() => () => abortRef.current?.abort(), []);

  const adopted = listAdoptedAiFields(record);
  const writableTargets = Object.entries(AI_FIELDS).filter(([path]) => path !== 'summary');

  function resetPreview(): void {
    setRequest(null);
    setConsent(false);
    setResult(null);
    setSelected(new Set());
    setAllowReplace(false);
    setError('');
  }

  function prepare(): void {
    try {
      const next = prepareAiRequest(operation, recordRef.current, notes, target);
      setRequest(next);
      setConsent(false);
      setResult(null);
      setSelected(new Set());
      setError('');
      setStatus('资料预览已生成。请确认实际发送内容后再生成。');
    } catch (reason) {
      setRequest(null);
      setResult(null);
      setError(errorMessage(reason));
      setStatus('');
    }
  }

  async function generate(): Promise<void> {
    if (busy || !request) return;
    if (!consent) {
      setError('请先确认可以发送预览中的资料');
      return;
    }
    if (!configured) {
      setError(noKeyMessage(securityContext, loadingAndroidStatus));
      return;
    }
    try {
      assertAiRequestCurrent(recordRef.current, request);
    } catch (reason) {
      setResult(null);
      setError(errorMessage(reason));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    setStatus('正在生成建议…可以取消；生成期间不会写入病历。');
    try {
      const response = await createTransport().request(
        { system: request.system, user: request.user },
        { signal: controller.signal },
      );
      assertAiRequestCurrent(recordRef.current, request);
      const nextResult = createAiResult(
        validateAiResponse(response.content, request),
        request,
        response.model,
      );
      setResult(nextResult);
      setSelected(new Set());
      setStatus('生成完成。请逐项核对引用、否定词、时间、药名和剂量后再采纳。');
    } catch (reason) {
      setError(errorMessage(reason));
      setStatus('');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }

  function cancel(): void {
    abortRef.current?.abort();
  }

  function toggleSuggestion(index: number, checked: boolean): void {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  }

  async function adopt(): Promise<void> {
    if (!request || !result || busy) return;
    try {
      const next = adoptAiSuggestions(
        recordRef.current,
        request,
        result,
        Array.from(selected),
        allowReplace,
      );
      const saved = await onAdoptRecord(next);
      if (!saved) return;
      setStatus('已采纳并保存到草稿，内容仍为「未核对」；请逐项确认。');
      setRequest(null);
      setResult(null);
      setSelected(new Set());
      setConsent(false);
      setAllowReplace(false);
      setError('');
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  async function confirm(path: string): Promise<void> {
    try {
      const saved = await onConfirmField(path);
      if (saved) {
        setStatus('已标记为已核对；该状态只绑定当前字段内容。');
        setError('');
      }
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }

  return (
    <Card
      title="AI 辅助（DeepSeek）"
      description="AI 建议不能直接修改正式诊断、处方、生命体征、身份字段或过敏烟酒选项。采纳后仍须人工逐字核对。"
      className="ai-panel"
    >
      {!configured ? (
        <div className="ai-empty" role="note">
          <p>{noKeyMessage(securityContext, loadingAndroidStatus)}</p>
          <button type="button" className="button secondary" onClick={onOpenSettings}>
            {securityContext === 'android' ? '查看 Android AI 设置' : '前往设置输入密钥'}
          </button>
        </div>
      ) : (
        <div className="ai-controls">
          <div className="ai-model-row">
            <span>模型：<code>{model}</code></span>
            <span>{securityContext === 'android' ? '密钥由 Android Keystore 保管，网页不可读取' : '密钥仅保存在本页内存'}</span>
          </div>
          <div className="form-grid">
            <label className="ai-field">
              <span>AI 操作</span>
              <select
                value={operation}
                onChange={(event) => {
                  setOperation(event.target.value as AiOperation);
                  resetPreview();
                  setStatus('');
                }}
              >
                {Object.entries(AI_OPERATIONS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            {operation === 'polish' ? (
              <label className="ai-field">
                <span>润色字段</span>
                <select value={target} onChange={(event) => { setTarget(event.target.value); resetPreview(); }}>
                  {writableTargets.map(([path, label]) => (
                    <option key={path} value={path}>{label}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {operation === 'organize' ? (
            <label className="ai-field">
              <span>问诊笔记（仅用于本次请求）</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(event) => { setNotes(event.target.value); resetPreview(); }}
                placeholder="输入需要整理的问诊笔记；姓名、电话、地址等会尝试在发送前隐去"
              />
            </label>
          ) : null}
          <div className="button-row">
            <button type="button" className="button secondary" onClick={prepare}>预览发送内容</button>
            {request ? (
              <button type="button" className="button primary" disabled={busy || !consent} onClick={() => void generate()}>
                生成建议
              </button>
            ) : null}
            {busy ? <button type="button" className="button ghost" onClick={cancel}>取消</button> : null}
          </div>
          {request ? (
            <div className="ai-preview">
              <label className="ai-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>我已核对下方实际发送内容，确认可以发送给 DeepSeek。</span>
              </label>
              <section className="ai-send-preview" aria-labelledby="ai-send-heading">
                <h4 id="ai-send-heading">实际发送内容（{request.sources.length} 条资料）</h4>
                <ul className="ai-source-list">
                  {request.sources.map((source, index) => (
                    <li key={`${source.source}-${index}`}>
                      <strong>{source.label}</strong>
                      <small><code>{source.source}</code></small>
                      <p>{source.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
              <details>
                <summary>查看原始 JSON（高级）</summary>
                <pre className="ai-json-preview">{request.user}</pre>
              </details>
            </div>
          ) : null}
        </div>
      )}

      {error ? <div className="ai-error" role="alert">{error}</div> : null}
      {status ? <p className="ai-status" role="status">{status}</p> : null}

      {result ? (
        <section className="ai-result" aria-labelledby="ai-result-heading">
          <div className="ai-result-heading">
            <h4 id="ai-result-heading">建议对照 · 尚未写入</h4>
            <span className="ai-badge">未核对</span>
          </div>
          <p className="field-hint">引用真实不代表建议一定正确。请逐项核对否定词、时间、药名、剂量和来源。</p>
          {result.suggestions.length ? (
            <div className="ai-suggestion-list">
              {result.suggestions.map((suggestion, index) => (
                <article className="ai-suggestion" key={suggestion.path}>
                  <label className="ai-check">
                    <input
                      type="checkbox"
                      aria-label={`选择${AI_FIELDS[suggestion.path] ?? suggestion.path}`}
                      checked={selected.has(index)}
                      onChange={(event) => toggleSuggestion(index, event.target.checked)}
                    />
                    <strong>{AI_FIELDS[suggestion.path] ?? suggestion.path}</strong>
                  </label>
                  <div className="ai-compare">
                    <div>
                      <small>原内容</small>
                      <p>{fieldValue(record, suggestion.path) || '（空白）'}</p>
                    </div>
                    <div>
                      <small>AI 建议 · 待核对</small>
                      <p>{suggestion.text}</p>
                    </div>
                  </div>
                  <details>
                    <summary>查看原文依据</summary>
                    {suggestion.evidence.map((evidence, evidenceIndex) => (
                      <blockquote key={`${evidence.source}-${evidenceIndex}`}>
                        <code>{evidence.source}</code>
                        <p>{evidence.quote}</p>
                      </blockquote>
                    ))}
                  </details>
                </article>
              ))}
            </div>
          ) : <p>没有可直接填写的建议。</p>}
          {result.issues.length ? (
            <div>
              <h5>待核实的问题</h5>
              <ul>
                {result.issues.map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    {issue.path ? `${AI_FIELDS[issue.path] ?? issue.path}：` : ''}{issue.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.questions.length ? (
            <div>
              <h5>建议补问</h5>
              <ul>{result.questions.map((question, index) => <li key={`${question}-${index}`}>{question}</li>)}</ul>
            </div>
          ) : null}
          {result.suggestions.length ? (
            <div className="ai-adopt-actions">
              <label className="ai-consent">
                <input
                  type="checkbox"
                  checked={allowReplace}
                  onChange={(event) => setAllowReplace(event.target.checked)}
                />
                <span>允许用勾选建议替换已有内容</span>
              </label>
              <button type="button" className="button primary" onClick={() => void adopt()}>
                采纳勾选项
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="ai-adopted" aria-labelledby="ai-adopted-heading">
        <div className="ai-result-heading">
          <h4 id="ai-adopted-heading">已采纳的 AI 内容</h4>
          <span className="ai-badge">{adopted.filter((field) => !field.reviewed).length} 项未核对</span>
        </div>
        {adopted.length ? (
          <ul className="ai-adopted-list">
            {adopted.map((field) => (
              <li key={field.path}>
                <div className="ai-adopted-head">
                  <strong>{field.label}</strong>
                  <span className={`ai-badge${field.reviewed ? ' is-reviewed' : ''}`}>
                    {field.reviewed ? '已核对' : '未核对'}
                  </span>
                </div>
                <p>{field.text || '（空白）'}</p>
                <small>
                  {field.model || 'DeepSeek'}
                  {field.adoptedAt ? ` · ${new Date(field.adoptedAt).toLocaleString('zh-CN')}` : ''}
                  {field.evidencePaths.length ? ` · 引用 ${field.evidencePaths.join('、')}` : ''}
                </small>
                {field.evidence.length ? (
                  <details>
                    <summary>查看采纳时的原文依据</summary>
                    {field.evidence.map((evidence, index) => (
                      <blockquote key={`${evidence.source}-${index}`}>
                        <code>{evidence.source}</code>
                        <p>{evidence.quote}</p>
                      </blockquote>
                    ))}
                  </details>
                ) : null}
                {!field.reviewed ? (
                  <button type="button" className="button ghost compact-button" onClick={() => void confirm(field.path)}>
                    确认已核对：{field.label}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : <p className="muted">尚未采纳 AI 内容。</p>}
      </section>
    </Card>
  );
}
