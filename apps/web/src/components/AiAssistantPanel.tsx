import { useEffect, useRef, useState } from 'react';
import {
  AI_FIELDS,
  AI_IMAGE_MIMES,
  AI_LABELS,
  AI_OPERATIONS,
  adoptAiSuggestions,
  assertAiRequestCurrent,
  createAiResult,
  displayAiValue,
  errorMessage,
  listAdoptedAiFields,
  normalizeAiImage,
  prepareAiRequest,
  redactionDiff,
  validateAiResponse,
  type AiImagePayload,
  type AiOperation,
  type AiRequest,
  type AiResult,
  type AiTransport,
} from '@dabingli/ai';
import { RECORD_CORE, type DabingliRecord } from '@dabingli/domain';
import { Card } from './StepShell';
import { AiEmptyState } from './AiEmptyState';

interface AiImageAttachment extends AiImagePayload {
  previewDataUrl: string;
  name: string;
}

const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;
const ORGANIZE_STEPS = ['贴笔记', '预览确认', '建议对照', '已采纳/回表单'];
type OrganizeStep = 1 | 2 | 3 | 4;

const rectHeight = (element: Element | null) =>
  element && typeof element.getBoundingClientRect === 'function' ? element.getBoundingClientRect().height : 0;

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片，请换一张重试'));
    };
    image.src = url;
  });
}

async function downscaleImage(file: File): Promise<AiImageAttachment> {
  if (!(AI_IMAGE_MIMES as readonly string[]).includes(file.type)) {
    throw new Error('请选择 JPEG、PNG、GIF 或 WebP 图片');
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('原始图片过大，请选择 25 MB 以内的图片');
  }
  const image = await loadImageFile(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const longest = Math.max(width, height);
  if (!longest) throw new Error('无法读取图片尺寸，请换一张重试');
  const scale = Math.min(1, MAX_IMAGE_EDGE / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前环境无法压缩图片，请直接粘贴文字');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const match = previewDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match?.[1] || !match[2]) throw new Error('图片压缩失败，请换一张重试');
  const normalized = normalizeAiImage({ mimeType: match[1], dataBase64: match[2] });
  if (!normalized) throw new Error('图片压缩失败，请换一张重试');
  return {
    ...normalized,
    previewDataUrl: `data:${normalized.mimeType};base64,${normalized.dataBase64}`,
    name: file.name || '相机照片',
  };
}

export interface AiAssistantPanelProps {
  record: DabingliRecord;
  configured: boolean;
  securityContext: 'web' | 'android';
  model: string;
  loadingAndroidStatus?: boolean;
  createTransport: () => AiTransport;
  initialTarget?: string;
  onAdoptRecord: (record: DabingliRecord, paths: readonly string[]) => Promise<boolean>;
  onRawNotesChange?: (value: string) => void;
  canUndoAdoption?: boolean;
  onUndoAdoption?: () => Promise<boolean>;
  onConfirmField: (path: string) => Promise<boolean>;
  onJumpToPath: (path: string) => void;
  onOpenApiSettings?: () => void;
}

function noKeyMessage(securityContext: 'web' | 'android', loading: boolean): string {
  if (securityContext === 'android') {
    return loading
      ? '正在读取 Android 安全存储中的 AI 配置…'
      : 'Android 安全存储中尚未配置 API Key。请通过本页顶部「API 设置」打开原生配置；普通填写、保存和文书生成不受影响。';
  }
  return '未配置 API Key。普通填写、保存和文书生成不受影响；请在本页顶部「API 设置」中输入密钥。';
}

export function AiAssistantPanel({
  record,
  configured,
  securityContext,
  model,
  loadingAndroidStatus = false,
  createTransport,
  initialTarget = 'hpi.symptoms',
  onAdoptRecord,
  onRawNotesChange,
  canUndoAdoption = false,
  onUndoAdoption,
  onConfirmField,
  onJumpToPath,
  onOpenApiSettings,
}: AiAssistantPanelProps) {
  const [operation, setOperation] = useState<AiOperation>('organize');
  const [organizeStep, setOrganizeStep] = useState<OrganizeStep>(1);
  const [resultAdopted, setResultAdopted] = useState(false);
  const [target, setTarget] = useState(initialTarget);
  const [fallbackNotes, setFallbackNotes] = useState('');
  const notes = onRawNotesChange ? String(record.rawNotes ?? '') : fallbackNotes;
  const [recognizeText, setRecognizeText] = useState('');
  const [recognizeImage, setRecognizeImage] = useState<AiImageAttachment | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [request, setRequest] = useState<AiRequest | null>(null);
  const [redactions, setRedactions] = useState<{ label: string; categories: string[] }[]>([]);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [allowReplace, setAllowReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const recordRef = useRef(record);
  const abortRef = useRef<AbortController | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const notesInputRef = useRef<HTMLTextAreaElement | null>(null);
  const reminderRef = useRef<HTMLDivElement | null>(null);
  const [focusNotes, setFocusNotes] = useState(false);
  const [jumpToUnreviewed, setJumpToUnreviewed] = useState(false);
  recordRef.current = record;

  useEffect(() => () => abortRef.current?.abort(), []);

  const adopted = listAdoptedAiFields(record);
  const unreviewedCount = adopted.filter((field) => !field.reviewed).length;
  const writableTargets = Object.entries(AI_FIELDS).filter(([path]) => path !== 'summary');

  useEffect(() => {
    const header = document.querySelector('.app-header');
    const updateOffset = () => {
      if (reminderRef.current) reminderRef.current.style.top = `${rectHeight(header) + 8}px`;
    };
    updateOffset();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOffset) : null;
    if (header) observer?.observe(header);
    window.addEventListener('resize', updateOffset);
    return () => { observer?.disconnect(); window.removeEventListener('resize', updateOffset); };
  }, [unreviewedCount]);

  useEffect(() => {
    if (!jumpToUnreviewed) return;
    const list = document.getElementById('ai-adopted-unreviewed');
    const headerHeight = rectHeight(document.querySelector('.app-header'));
    const reminderHeight = rectHeight(reminderRef.current);
    if (list) list.style.scrollMarginTop = `${headerHeight + reminderHeight + 24}px`;
    list?.focus({ preventScroll: true });
    list?.scrollIntoView?.({ block: 'start' });
    setJumpToUnreviewed(false);
  }, [jumpToUnreviewed, organizeStep]);

  useEffect(() => {
    if (!focusNotes) return;
    const input = operation === 'recognize'
      ? document.getElementById('ai-recognize-text') : notesInputRef.current;
    input?.focus();
    input?.scrollIntoView?.({ block: 'center' });
    setFocusNotes(false);
  }, [focusNotes, operation, organizeStep]);

  function startNotes(): void {
    if (operation !== 'recognize' && operation !== 'organize') {
      setOperation('organize');
      resetPreview();
    }
    setOrganizeStep(1);
    setFocusNotes(true);
  }

  function changeNotes(value: string): void {
    if (onRawNotesChange) onRawNotesChange(value);
    else setFallbackNotes(value);
    resetPreview();
  }

  function resetPreview(): void {
    setOrganizeStep(1);
    setResultAdopted(false);
    setRequest(null);
    setRedactions([]);
    setConsent(false);
    setResult(null);
    setSelected(new Set());
    setAllowReplace(false);
    setError('');
  }

  async function selectImage(file: File | undefined): Promise<void> {
    if (!file || processingImage) return;
    setProcessingImage(true);
    resetPreview();
    setStatus('正在压缩图片…');
    try {
      const next = await downscaleImage(file);
      setRecognizeImage(next);
      setStatus('图片已压缩。请预览缩略图，并确认图片允许发送。');
    } catch (reason) {
      setRecognizeImage(null);
      setError(errorMessage(reason));
      setStatus('');
    } finally {
      setProcessingImage(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }

  function removeImage(): void {
    setRecognizeImage(null);
    resetPreview();
    setStatus('已移除图片');
  }

  function prepare(): void {
    try {
      const next = prepareAiRequest(
        operation,
        recordRef.current,
        operation === 'recognize' ? recognizeText : notes,
        target,
        operation === 'recognize' ? recognizeImage : null,
      );
      setRequest(next);
      setRedactions(next.sources.filter((source) => source.source !== 'image').map((source) => ({
        label: source.label,
        categories: redactionDiff(source.source === 'note'
          ? (operation === 'recognize' ? recognizeText : notes).trim()
          : RECORD_CORE.getPath(recordRef.current, source.source), recordRef.current).categories,
      })).filter((entry) => entry.categories.length));
      setOrganizeStep(2);
      setResultAdopted(false);
      setConsent(false);
      setResult(null);
      setSelected(new Set());
      setError('');
      setStatus(next.image
        ? '预览已生成。图片无法自动脱敏，请确认缩略图和发送文字后再勾选。'
        : '资料预览已生成。请确认实际发送内容后再生成。');
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
        {
          system: request.system,
          user: request.user,
          ...(request.image ? { image: request.image } : {}),
        },
        { signal: controller.signal },
      );
      assertAiRequestCurrent(recordRef.current, request);
      const nextResult = createAiResult(
        validateAiResponse(response.content, request),
        request,
        response.model,
      );
      setResult(nextResult);
      setOrganizeStep(3);
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
    if (!request || !result || busy || resultAdopted) return;
    try {
      const next = adoptAiSuggestions(
        recordRef.current,
        request,
        result,
        Array.from(selected),
        allowReplace,
      );
      const paths = Array.from(selected).map((index) => result.suggestions[index]?.path).filter((path): path is string => Boolean(path));
      const saved = await onAdoptRecord(next, paths);
      if (!saved) return;
      setStatus('已采纳并保存到草稿，内容仍为「未核对」；请逐项确认。');
      setResultAdopted(true);
      setOrganizeStep(4);
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

  function goToOrganizeStep(step: OrganizeStep): void {
    if (busy || processingImage) return;
    // A saved adoption changes the request baseline. Preview again before another request.
    if (step === 2 && resultAdopted) {
      prepare();
      return;
    }
    setOrganizeStep(step);
  }

  return (
    <Card
      title="AI 辅助（DeepSeek）"
      description="AI 只会提出白名单字段建议，不会写入诊断或处方；识别出的生命体征、查体与选择项也必须逐项勾选并人工核对。"
      className="ai-panel"
    >
      {unreviewedCount > 0 ? (
        <div className="ai-review-reminder" ref={reminderRef}>
          <button type="button" className="button secondary" onClick={() => {
            setOrganizeStep(4);
            setJumpToUnreviewed(true);
          }}>{unreviewedCount} 项未核对</button>
          <span>已采纳内容需逐项确认，点击前往核对。</span>
        </div>
      ) : null}
      <p className="field-hint">当前润色字段：{AI_FIELDS[target]}；选择「润色本段」可调整。</p>
      {operation === 'organize' ? (
        <nav aria-label="整理填表进度" className="ai-progress">
          <ol>
            {ORGANIZE_STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  aria-current={organizeStep === index + 1 ? 'step' : undefined}
                  disabled={busy || processingImage || (index === 1 && !request)
                    || (index === 2 && !result) || (index === 3 && !adopted.length)}
                  onClick={() => goToOrganizeStep((index + 1) as OrganizeStep)}
                >
                  <span aria-hidden="true">{index + 1}</span>{label}
                </button>
              </li>
            ))}
          </ol>
          <p className="field-hint">第 {organizeStep} 步 / 共 4 步 · {ORGANIZE_STEPS[organizeStep - 1]}</p>
        </nav>
      ) : null}
      {!configured ? (
        <AiEmptyState title="AI 助手尚未启用" description={noKeyMessage(securityContext, loadingAndroidStatus)}
          action="去配置 API" disabled={loadingAndroidStatus}
          onAction={() => {
            if (onOpenApiSettings) onOpenApiSettings();
            else document.getElementById('ai-api-settings')?.scrollIntoView({ block: 'start' });
          }} />
      ) : (
        <div className="ai-controls">
          <div className="ai-model-row">
            <span className="ai-model-pill">模型：<code>{model}</code></span>
            <span className="ai-model-pill">图片识别固定使用 Flash（Pro 不支持图片）</span>
            <span className="ai-model-pill">{securityContext === 'android' ? '密钥由 Android Keystore 保管，网页不可读取' : '密钥仅保存在本页内存'}</span>
          </div>
          <div className="form-grid">
            <label className="ai-field">
              <span>AI 操作</span>
              <select
                value={operation}
                disabled={busy || processingImage}
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
          {operation === 'organize' && organizeStep === 1 ? (
            <>
              {!notes.trim() ? <AiEmptyState title="从一段问诊笔记开始"
                description="贴上原始笔记，AI 会大致填入病历，再由你逐项修改核对。"
                action="粘贴笔记开始" disabled={busy || processingImage} onAction={startNotes} /> : null}
              <label className="ai-field">
                <span>问诊笔记（随病历保存在本机）</span>
                <textarea
                  ref={notesInputRef}
                  rows={4}
                  value={notes}
                  onChange={(event) => changeNotes(event.target.value)}
                  placeholder="输入需要整理的问诊笔记；姓名、电话、地址等会尝试在发送前隐去"
                />
              </label>
              <div className="ai-field-actions">
                <button type="button" className="button secondary" disabled={busy || processingImage || !notes.trim()} onClick={prepare}>
                  重新整理
                </button>
                <span className="field-hint">笔记会随当前病历自动保存；修改后可随时重新整理。</span>
              </div>
            </>
          ) : null}
          {operation === 'recognize' ? (
            <div className="ai-recognize">
              <div className="ai-section-head">
                <strong>识别来源</strong>
                <span>拍照、选图或粘贴文字</span>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="拍照识别病历"
                hidden
                onChange={(event) => void selectImage(event.target.files?.[0])}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                aria-label="选择病历图片"
                hidden
                onChange={(event) => void selectImage(event.target.files?.[0])}
              />
              <div className="ai-source-grid" role="group" aria-label="添加识别资料">
                <button
                  type="button"
                  className="ai-source-card ai-source-card-primary"
                  aria-label="拍照"
                  disabled={busy || processingImage}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <span className="ai-source-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  </span>
                  <span><strong>拍照</strong><small>拍摄纸质病历</small></span>
                </button>
                <button
                  type="button"
                  className="ai-source-card"
                  aria-label="选择图片"
                  disabled={busy || processingImage}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <span className="ai-source-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-5 4 4 2-2 5 4" /></svg>
                  </span>
                  <span><strong>选择图片</strong><small>从相册选择</small></span>
                </button>
              </div>
              {processingImage ? (
                <div className="ai-inline-loading" role="status">
                  <span className="loading-spinner" aria-hidden="true" />
                  <span>正在压缩并生成缩略图…</span>
                </div>
              ) : null}
              {recognizeImage ? (
                <div className="ai-image-preview">
                  <img src={recognizeImage.previewDataUrl} alt="待发送病历图片缩略图" />
                  <div className="ai-image-copy">
                    <strong>已加入待发送资料</strong>
                    <p>
                      {recognizeImage.name} · {Math.round(recognizeImage.dataBase64.length * 3 / 4 / 1024)} KB · 发送前已压缩
                    </p>
                    <button type="button" className="button ghost compact-button" disabled={busy} onClick={removeImage}>
                      移除图片
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="ai-image-warning" role="note">
                <span className="ai-warning-icon" aria-hidden="true">!</span>
                <span>图片会以压缩后的版本发送，无法自动遮去姓名、病历号、床号等身份信息。请先确认图片只含允许外发的数据，并自行裁掉无关区域。最长边约 1600 像素、JPEG 质量约 85%。</span>
              </p>
              <label className="ai-field">
                <span>粘贴病历文字（可选，可与图片同时发送）</span>
                <textarea
                  id="ai-recognize-text"
                  rows={4}
                  value={recognizeText}
                  onChange={(event) => { setRecognizeText(event.target.value); resetPreview(); }}
                  placeholder="也可以粘贴病历文字；姓名、电话、地址等会尝试在发送前隐去，图片中的身份信息无法自动隐去"
                />
              </label>
            </div>
          ) : null}
          <div className="button-row ai-actions">
            {operation !== 'organize' || organizeStep === 1 ? (
              <button type="button" className="button secondary" disabled={busy || processingImage} onClick={prepare}>预览发送内容</button>
            ) : null}
            {operation === 'organize' && organizeStep === 2 ? (
              <button type="button" className="button ghost" disabled={busy} onClick={() => goToOrganizeStep(1)}>返回贴笔记</button>
            ) : null}
            {request && (operation !== 'organize' || organizeStep === 2) ? (
              <button type="button" className="button primary" disabled={busy || !consent || resultAdopted} onClick={() => void generate()}>
                生成建议
              </button>
            ) : null}
            {busy ? <button type="button" className="button ghost" onClick={cancel}>取消</button> : null}
          </div>
          {request && (operation !== 'organize' || organizeStep === 2) ? (
            <div className="ai-preview">
              <label className="ai-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                <span>{request.image
                  ? '我已确认图片可能含患者身份信息、图片无法自动脱敏，并确认可发送这张图片和上述文字至 DeepSeek。'
                  : '我已核对下方实际发送内容，确认可以发送给 DeepSeek。'}</span>
              </label>
              <section className="ai-send-preview" aria-labelledby="ai-send-heading">
                <div className="ai-section-head">
                  <h4 id="ai-send-heading">实际发送内容（{request.sources.length} 条资料）</h4>
                  <span className="ai-badge">发送前确认</span>
                </div>
                <section className="ai-redaction-summary" aria-label="脱敏变化">
                  <strong>脱敏前后变化</strong>
                  {redactions.length ? <ul>{redactions.map((entry, index) => (
                    <li key={index}>{entry.label}：{entry.categories.join('、')}已隐去</li>
                  ))}</ul> : <p>本次文字未检测到可自动隐去的身份信息。</p>}
                  <p>下方显示脱敏后内容，以 [已隐去]、[电话已隐去] 或 [身份证已隐去] 标记替换处；仍可能遗漏，请检查后确认。</p>
                </section>
                {request.image && recognizeImage ? (
                  <div className="ai-image-preview ai-image-send">
                    <img src={recognizeImage.previewDataUrl} alt="将发送的病人图片缩略图" />
                    <p className="ai-image-warning">
                      <span className="ai-warning-icon" aria-hidden="true">!</span>
                      <span>图片为压缩后的版本，可能含患者身份信息，且无法自动脱敏。</span>
                    </p>
                  </div>
                ) : null}
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
      {busy ? (
        <div className="ai-loading" role="status" aria-live="polite">
          <div className="ai-loading-head">
            <span className="loading-spinner" aria-hidden="true" />
            <div>
              <strong>AI 正在整理资料</strong>
              <span>请保持本页打开，生成期间不会写入病历。</span>
            </div>
          </div>
          <div className="ai-skeleton" aria-hidden="true"><span /><span /><span /></div>
        </div>
      ) : null}

      {result && (operation !== 'organize' || organizeStep === 3) ? (
        <section className="ai-result" aria-labelledby="ai-result-heading">
          <div className="ai-result-heading">
            <h4 id="ai-result-heading">{resultAdopted ? '建议对照 · 本轮已采纳' : '建议对照 · 尚未写入'}</h4>
            <span className="ai-badge">{resultAdopted ? '本轮已处理' : '未核对'}</span>
          </div>
          {operation === 'organize' ? (
            <div className="button-row">
              <button type="button" className="button ghost" onClick={() => goToOrganizeStep(2)}>{resultAdopted ? '重新预览发送内容' : '返回预览确认'}</button>
              <button type="button" className="button ghost" onClick={() => goToOrganizeStep(1)}>返回贴笔记</button>
              {adopted.length ? <button type="button" className="button secondary" onClick={() => goToOrganizeStep(4)}>查看已采纳</button> : null}
            </div>
          ) : null}
          {resultAdopted ? <p className="field-hint">本轮勾选项已采纳。若需继续填表，请重新预览并生成建议。</p> : null}
          <p className="field-hint">引用真实不代表建议一定正确。请逐项核对否定词、时间、药名、剂量和来源。</p>
          {result.suggestions.length ? (
            <div className="ai-suggestion-list">
              {result.suggestions.map((suggestion, index) => (
                <article className="ai-suggestion" key={suggestion.path}>
                  <label className="ai-check">
                    <input
                      type="checkbox"
                      aria-label={`选择${AI_LABELS[suggestion.path] ?? suggestion.path}`}
                      checked={selected.has(index)}
                      disabled={resultAdopted}
                      onChange={(event) => toggleSuggestion(index, event.target.checked)}
                    />
                    <strong>{AI_LABELS[suggestion.path] ?? suggestion.path}</strong>
                    <small>{suggestion.kind === 'choice'
                      ? '选择项 · 默认不勾选'
                      : suggestion.kind === 'number' ? '数值项 · 待核对' : '文本项 · 待核对'}</small>
                    {suggestion.fromImage ? <small className="ai-image-note">来自图片，依据未能自动核实</small> : null}
                  </label>
                  <div className="ai-compare">
                    <div>
                      <small>原内容</small>
                      <p>{displayAiValue(suggestion.path, RECORD_CORE.getPath(record, suggestion.path)) || '（空白）'}</p>
                    </div>
                    <div>
                      <small>AI 建议 · 待核对</small>
                      <p>{displayAiValue(suggestion.path, suggestion.text)}</p>
                    </div>
                    <div>
                      <small>原文依据</small>
                      {suggestion.evidence.map((evidence, evidenceIndex) => (
                        <blockquote key={`${evidence.source}-${evidenceIndex}`}>
                          <code>{evidence.source}</code>
                          <p>{evidence.quote}</p>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <AiEmptyState title="没有可直接填写的建议" description="补充更具体的原文依据，再预览生成建议。"
              action="补充原文" disabled={busy || processingImage} onAction={startNotes} />
          )}
          {result.dropped.length ? (
            <details className="ai-dropped">
              <summary>{result.dropped.length} 条建议未通过核对，未采用</summary>
              <ul>
                {result.dropped.map((entry, index) => (
                  <li key={`${entry.path}-${index}`}>
                    {entry.path ? `${AI_LABELS[entry.path] ?? entry.path}：` : ''}{entry.reason}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {result.issues.length ? (
            <div>
              <h5>待核实的问题</h5>
              <ul>
                {result.issues.map((issue, index) => (
                  <li key={`${issue.path}-${index}`}>
                    {issue.path ? `${AI_LABELS[issue.path] ?? issue.path}：` : ''}{issue.message}
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
          {result.suggestions.length && !resultAdopted ? (
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

      {canUndoAdoption && onUndoAdoption ? (
        <div className="button-row">
          <button type="button" className="button ghost" disabled={busy} onClick={() => void onUndoAdoption()}>撤销本次 AI 采纳</button>
          <span className="field-hint">只撤销本次采纳，保留后来修改的字段；刷新后失效。</span>
        </div>
      ) : null}

      {operation !== 'organize' || organizeStep === 4 ? (
        <section className="ai-adopted" aria-labelledby="ai-adopted-heading">
          <div className="ai-result-heading">
            <h4 id="ai-adopted-heading">已采纳的 AI 内容</h4>
            <span className="ai-badge">{unreviewedCount ? '请逐项核对' : '0 项未核对'}</span>
          </div>
          {operation === 'organize' ? (
            <div className="button-row">
              {result ? <button type="button" className="button ghost" onClick={() => goToOrganizeStep(3)}>返回建议对照</button> : null}
              <button type="button" className="button ghost" onClick={() => goToOrganizeStep(1)}>返回贴笔记</button>
            </div>
          ) : null}
          {adopted.length ? (
            <ul className="ai-adopted-list" id="ai-adopted-unreviewed" tabIndex={-1} aria-label="已采纳待核对列表">
              {[...adopted].sort((left, right) => Number(left.reviewed) - Number(right.reviewed)).map((field) => (
                <li key={field.path}>
                  <div className="ai-adopted-head">
                    <strong>{field.label}</strong>
                    <span className={`ai-badge${field.reviewed ? ' is-reviewed' : ''}`}>
                      {field.reviewed ? '已核对' : '未核对'}
                    </span>
                  </div>
                  <p>{displayAiValue(field.path, field.text) || '（空白）'}</p>
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
                  <div className="button-row">
                    <button type="button" className="button secondary compact-button" onClick={() => onJumpToPath(field.path)}>去改该字段</button>
                    {!field.reviewed ? (
                      <button type="button" className="button ghost compact-button" onClick={() => void confirm(field.path)}>
                        确认已核对：{field.label}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <AiEmptyState title="尚未采纳 AI 内容" description="先贴笔记生成建议；采纳后会保留来源、时间和核对状态。"
              action="粘贴笔记开始" disabled={busy || processingImage} onAction={startNotes} />
          )}
        </section>
      ) : null}
    </Card>
  );
}
