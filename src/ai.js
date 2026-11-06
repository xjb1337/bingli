/* App-only assistant UI. Credentials and networking remain in Android. */
const AI_ASSIST = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  let panel = null, pending = null, request = null, result = null, model = '', timer = null;
  let busy = false, processingImage = false, recognizeImage = null;
  const bridge = () => window.BingliAndroid;
  const $ = id => panel.querySelector('#' + id);
  function status(text) { if (panel) { $('aiStatus').textContent = text; $('aiStatus').focus(); } }
  function close(force = false) {
    const hasDraft = panel && (($('aiNotes') && $('aiNotes').value.trim()) || ($('aiRecognizeText') && $('aiRecognizeText').value.trim()) || recognizeImage);
    if (force !== true && panel && (pending || hasDraft) && !window.confirm('关闭会取消请求并清除本窗口的原始笔记和图片。已采纳到病历的内容会保留。确定关闭？')) return;
    if (pending) bridge().aiCancel(pending);
    clearTimeout(timer); pending = null; request = null; result = null; busy = false; processingImage = false; recognizeImage = null;
    if (panel) { panel.remove(); panel = null; }
  }
  function invalidate() { request = null; result = null; if (panel) { $('aiPreview').hidden = true; $('aiResult').innerHTML = ''; } }
  function pendingFields() {
    if (!panel) return;
    const r = APP.getRecord();
    const paths = Object.keys((r.meta && r.meta.fieldStates) || {}).filter(p => AI_CORE.labels[p] && RECORD_CORE.fieldState(r, p).source === 'ai' && !RECORD_CORE.fieldReviewValid(r, p));
    $('aiReview').innerHTML = paths.length ? '<h3>已采纳、待核对</h3>' + paths.map(p => {
      let provenance = {}; try { provenance = JSON.parse(RECORD_CORE.fieldState(r, p).sourceRef); } catch (e) { }
      return `<div class="ai-review"><strong>${esc(AI_CORE.labels[p])}</strong><p>${esc(AI_CORE.displayValue(p, RECORD_CORE.getPath(r, p)))}</p><details><summary>AI 来源与原文依据</summary><small>${esc(provenance.model || 'DeepSeek')}</small>${(provenance.evidence || []).map(e => '<blockquote>' + esc(e.quote) + '</blockquote>').join('')}</details><button class="btn btn-ghost" data-review="${esc(p)}">已逐字核对，确认本项</button></div>`;
    }).join('') : '';
    $('aiReview').querySelectorAll('[data-review]').forEach(button => button.onclick = () => { APP.reviewAI(button.dataset.review); pendingFields(); status('本项已标记核对；内容再次修改后需要重新核对'); });
  }
  function renderRecognizeImage() {
    if (!panel) return;
    const box = $('aiImagePreview');
    if (!box) return;
    box.hidden = !recognizeImage;
    if (!recognizeImage) { $('aiThumb').removeAttribute('src'); $('aiImageMeta').textContent = ''; return; }
    $('aiThumb').src = recognizeImage.previewDataUrl;
    $('aiImageMeta').textContent = `${recognizeImage.name || '病历图片'} · ${Math.round(recognizeImage.dataBase64.length * 3 / 4 / 1024)} KB · 发送前已压缩`;
  }
  function loadBrowserImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(Error('无法读取图片，请换一张重试')); };
      img.src = url;
    });
  }
  async function downscaleImage(file) {
    if (!file || !/^image\//.test(file.type || '')) throw Error('请选择 JPEG、PNG、GIF 或 WebP 图片');
    if (file.size > 25 * 1024 * 1024) throw Error('原始图片过大，请选择 25 MB 以内的图片');
    const img = await loadBrowserImage(file);
    const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
    if (!longest) throw Error('无法读取图片尺寸，请换一张重试');
    const scale = Math.min(1, 1600 / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) throw Error('当前环境无法压缩图片，请使用“选择图片”或粘贴文字');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const match = previewDataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) throw Error('图片压缩失败，请换一张重试');
    const normalized = AI_CORE.normalizeImagePayload({mimeType: match[1], dataBase64: match[2]});
    return {...normalized, previewDataUrl: `data:${normalized.mimeType};base64,${normalized.dataBase64}`, name: file.name || '相机照片'};
  }
  async function handleImageFile(file) {
    if (!file || processingImage) return;
    processingImage = true; invalidate();
    $('aiCameraButton').disabled = true; $('aiGalleryButton').disabled = true; $('aiPrepare').disabled = true;
    if ($('aiImageProgress')) $('aiImageProgress').hidden = false;
    status('正在压缩图片…');
    try {
      recognizeImage = await downscaleImage(file);
      renderRecognizeImage();
      status('图片已压缩，请预览并确认图片可以外发');
    } catch (e) {
      recognizeImage = null; renderRecognizeImage(); status(e.message || '图片处理失败');
    } finally {
      processingImage = false;
      if (panel) {
        $('aiCameraButton').disabled = busy; $('aiGalleryButton').disabled = busy; $('aiPrepare').disabled = busy;
        if ($('aiImageProgress')) $('aiImageProgress').hidden = true;
        $('aiCameraInput').value = ''; $('aiGalleryInput').value = '';
      }
    }
  }
  function open() {
    if (!bridge() || !bridge().aiRequest) return;
    if (panel) return;
    panel = document.createElement('div'); panel.className = 'ai-mask';
    panel.innerHTML = `<section class="ai-sheet" role="dialog" aria-modal="true" aria-labelledby="aiTitle" aria-describedby="aiIntro" aria-busy="false">
      <div class="ai-heading"><div class="ai-heading-copy"><span class="ai-eyebrow">DEEPSEEK · 填写辅助</span><h2 id="aiTitle">AI 病历助手</h2><p class="ai-subtitle">整理、润色或识别资料，确认后才写入病历。</p></div><button id="aiClose" type="button" class="btn btn-ghost ai-close">关闭</button></div>
      <div class="ai-note" id="aiIntro"><span class="ai-note-icon" aria-hidden="true">i</span><p>只处理你选择的资料。结果须核对后采纳；未问、未查、不详不得当成正常。联网内容将发送至 DeepSeek。识别结果只填病史、生命体征、查体与系统回顾等白名单字段，不写诊断或处方。</p></div>
      <div class="ai-settings-row"><button id="aiSettings" class="btn btn-ghost">API 设置 / 测试连接</button><span id="aiModel"></span></div>
      <div id="aiOnboarding" class="ai-onboarding" hidden>
        <strong>首次使用 AI</strong>
        <ol><li>打开「API 设置」，按教程创建 DeepSeek API Key。</li><li>粘贴密钥并保存，点击「保存并测试连接」。</li><li>回到这里预览资料，确认后再发送。</li></ol>
        <p>密钥只保存在本机加密存储中，不会写入病历备份；联网前请检查预览内容。</p>
      </div>
      <div class="ai-field"><label for="aiOperation">需要什么帮助</label><select id="aiOperation">${Object.entries(AI_CORE.operations).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div id="aiTargetWrap" class="ai-field" hidden><label for="aiTarget">选择要润色的段落</label><select id="aiTarget">${Object.entries(AI_CORE.fields).filter(([k]) => k !== 'summary').map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
      <div id="aiNotesWrap" class="ai-field"><label for="aiNotes">原始问诊笔记（仅在本次窗口保留）</label><textarea id="aiNotes" rows="5" maxlength="16000" placeholder="如：患者诉咳嗽3天，昨晚加重，发热情况未问，既往有高血压，具体用药不详。"></textarea></div>
      <div id="aiRecognizeWrap" hidden>
        <div class="ai-section-head"><strong>识别来源</strong><span>图片与文字可同时发送</span></div>
        <div class="ai-image-actions" role="group" aria-label="添加识别资料">
          <input id="aiCameraInput" type="file" accept="image/*" capture="environment" hidden>
          <input id="aiGalleryInput" type="file" accept="image/*" hidden>
          <button id="aiCameraButton" type="button" class="ai-source-card ai-source-card-primary">
            <span class="ai-source-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
            <span><strong>拍照</strong><small>拍摄纸质病历</small></span>
          </button>
          <button id="aiGalleryButton" type="button" class="ai-source-card">
            <span class="ai-source-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 4"/></svg></span>
            <span><strong>选择图片</strong><small>从相册选择</small></span>
          </button>
        </div>
        <div id="aiImageProgress" class="ai-inline-loading" role="status" hidden><span class="ai-spinner" aria-hidden="true"></span><span>正在压缩并生成缩略图…</span></div>
        <div id="aiImagePreview" class="ai-image-preview" hidden>
          <img id="aiThumb" alt="待发送病历图片缩略图">
          <div class="ai-image-copy"><strong>已加入待发送资料</strong><p id="aiImageMeta"></p><button id="aiImageClear" type="button" class="btn btn-ghost btn-sm">移除图片</button></div>
        </div>
        <p class="ai-warning"><span class="ai-warning-icon" aria-hidden="true">!</span><span>图片会以压缩后的版本发送，无法自动遮去姓名、病历号、床号等身份信息。请先确认图片只含允许外发的数据，并自行裁掉无关区域。图片最长边会压缩到约 1600 像素、JPEG 质量约 85%。</span></p>
        <div class="ai-field"><label for="aiRecognizeText">粘贴文字（可选）</label><textarea id="aiRecognizeText" rows="5" maxlength="16000" placeholder="也可以粘贴病历文字，或同时粘贴用于补充图片中看不清的内容。"></textarea></div>
      </div>
      <p class="hint">已录入的姓名、电话、住址、病历号等会尽量屏蔽；自由文本中的身份信息可能遗漏，发送前请检查预览。未核对的模板、默认内容和 AI 字段不作为事实发送。</p>
      <button id="aiPrepare" class="btn">预览将发送的资料</button>
      <div id="aiPreview" class="ai-preview" hidden>
        <div class="ai-section-head"><h3>实际发送内容</h3><span class="ai-badge">发送前确认</span></div>
        <div id="aiImageSendPreview" class="ai-image-send" hidden><img id="aiSendThumb" alt="将发送的病历图片缩略图"><p class="ai-warning"><span class="ai-warning-icon" aria-hidden="true">!</span><span>图片为压缩后的版本，可能含患者身份信息，且无法自动脱敏。</span></p></div>
        <pre id="aiSources" class="ai-source"></pre>
        <label class="ai-check ai-consent-box"><input id="aiConsent" type="checkbox"><span id="aiConsentLabel">我已检查上述内容，确认可发送至 DeepSeek</span></label>
        <button id="aiSend" class="btn" disabled>发送并生成建议</button>
      </div>
      <div class="ai-status-wrap"><p id="aiStatus" role="status" aria-live="polite" tabindex="-1"></p><div id="aiLoading" class="ai-loading" role="status" aria-live="polite" hidden><div class="ai-loading-head"><span class="ai-spinner" aria-hidden="true"></span><div><strong>AI 正在整理资料</strong><span>请保持本页打开，生成期间不会写入病历。</span></div></div><div class="ai-skeleton" aria-hidden="true"><span></span><span></span><span></span></div></div></div>
      <button id="aiCancel" class="btn btn-ghost" hidden>取消请求</button>
      <div id="aiResult"></div><div id="aiReview"></div>
      <button id="aiUndo" class="btn btn-ghost">撤销上一步可撤销操作</button>
    </section>`;
    document.body.appendChild(panel);
    $('aiClose').onclick = () => close();
    $('aiSettings').onclick = () => bridge().aiSettings();
    const updateMode = () => {
      invalidate(); const op = $('aiOperation').value;
      $('aiTargetWrap').hidden = op !== 'polish'; $('aiNotesWrap').hidden = op !== 'organize';
      $('aiRecognizeWrap').hidden = op !== 'recognize';
      status('');
    };
    $('aiOperation').onchange = updateMode;
    $('aiTarget').onchange = invalidate; $('aiNotes').oninput = invalidate;
    $('aiRecognizeText').oninput = invalidate;
    $('aiCameraButton').onclick = () => $('aiCameraInput').click();
    $('aiGalleryButton').onclick = () => $('aiGalleryInput').click();
    $('aiCameraInput').onchange = e => handleImageFile(e.target.files && e.target.files[0]);
    $('aiGalleryInput').onchange = e => handleImageFile(e.target.files && e.target.files[0]);
    $('aiImageClear').onclick = () => { recognizeImage = null; invalidate(); renderRecognizeImage(); status('已移除图片'); };
    $('aiConsent').onchange = () => { if ($('aiSend')) $('aiSend').disabled = busy || !$('aiConsent').checked; };
    $('aiPrepare').onclick = prepare;
    $('aiSend').onclick = send;
    $('aiCancel').onclick = () => { if (pending) bridge().aiCancel(pending); pending = null; clearTimeout(timer); setBusy(false); status('已取消，病历未改动；可再次发送'); };
    $('aiUndo').onclick = () => { if (!busy) { APP.undoAI(); invalidate(); pendingFields(); status('已请求撤销，请检查病历及保存状态'); } };
    renderRecognizeImage(); pendingFields(); refreshModel(); $('aiClose').focus();
  }
  function refreshModel() {
    try { const s = JSON.parse(bridge().aiStatus()); model = s.model || ''; $('aiModel').textContent = s.configured ? model + '（图片识别固定使用 Flash，Pro 不支持图片）' : '尚未设置 API Key'; $('aiOnboarding').hidden = !!s.configured; return s.configured; }
    catch (e) { status('无法读取 AI 设置'); return false; }
  }
  function prepare() {
    if (busy) return;
    try {
      const operation = $('aiOperation').value;
      const text = operation === 'organize' ? $('aiNotes').value : operation === 'recognize' ? $('aiRecognizeText').value : '';
      request = AI_CORE.prepare(operation, APP.getRecord(), text, $('aiTarget').value, operation === 'recognize' ? recognizeImage : null);
      result = null; $('aiResult').innerHTML = '';
      $('aiSources').textContent = request.sources.map(s => '[' + s.label + ']\n' + s.text).join('\n\n');
      $('aiImageSendPreview').hidden = !request.image;
      if (request.image) $('aiSendThumb').src = recognizeImage.previewDataUrl;
      $('aiConsentLabel').textContent = request.image
        ? '我已确认图片可能含患者身份信息、图片无法自动脱敏，并确认可发送这张图片和上述文字至 DeepSeek'
        : '我已检查上述内容，确认可发送至 DeepSeek';
      $('aiConsent').checked = false; if ($('aiSend')) $('aiSend').disabled = true; $('aiPreview').hidden = false;
      status(request.image ? '图片无法自动脱敏；请确认缩略图和说明后勾选发送' : '请核对实际发送内容；本次不发送姓名、病历号等身份字段');
    } catch (e) { request = null; $('aiPreview').hidden = true; status(e.message); }
  }
  function setBusy(value) {
    busy = value;
    ['aiOperation', 'aiTarget', 'aiNotes', 'aiRecognizeText', 'aiPrepare', 'aiSend', 'aiSettings', 'aiUndo', 'aiCameraButton', 'aiGalleryButton', 'aiImageClear'].forEach(id => { if ($(id)) $(id).disabled = value || (id === 'aiPrepare' && processingImage); });
    if (panel) {
      const sheet = panel.querySelector('.ai-sheet');
      if (sheet) sheet.setAttribute('aria-busy', value ? 'true' : 'false');
      if ($('aiLoading')) $('aiLoading').hidden = !value;
      if ($('aiSend')) $('aiSend').disabled = value || !$('aiConsent').checked;
    }
    $('aiCancel').hidden = !value;
  }
  function send() {
    if (busy || !request) return;
    if (!$('aiConsent').checked) { status('请先确认可以发送预览中的资料'); return; }
    if (!refreshModel()) { status('请先打开 API 设置，保存密钥并测试连接'); return; }
    if (request.caseId !== APP.getRecord().id || AI_CORE.baseline(APP.getRecord()) !== request.baseline) { invalidate(); status('病历已改变，请重新预览资料'); return; }
    result = null; $('aiResult').innerHTML = ''; pending = 'ai_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    setBusy(true); status('正在生成建议…可以取消，期间不会写入病历');
    timer = setTimeout(() => { if (!pending) return; bridge().aiCancel(pending); pending = null; setBusy(false); status('等待超过两分钟，已取消；原内容保留，可重试'); }, 120000);
    try {
      const payload = {system: request.system, user: request.user};
      if (request.image) payload.image = request.image;
      bridge().aiRequest(pending, JSON.stringify(payload));
    }
    catch (e) { pending = null; clearTimeout(timer); setBusy(false); status('请求无法开始，请重试'); }
  }
  function receive(id, response) {
    if (!panel || id !== pending) return;
    pending = null; clearTimeout(timer); setBusy(false);
    if (!response || !response.ok) { status(response && response.error || '生成失败，请重试'); return; }
    try {
      if (APP.getRecord().id !== request.caseId || AI_CORE.baseline(APP.getRecord()) !== request.baseline) throw Error('病历已改变；本次结果已丢弃，请重新预览');
      result = AI_CORE.validate(response.content, request); model = response.model || model;
      const r = APP.getRecord();
      $('aiResult').innerHTML = '<div class="ai-result-heading"><h3>建议对照 · 尚未写入</h3><span class="ai-badge">未核对</span></div><p class="hint">引用真实不代表建议一定正确。逐项检查否定词、时间、药名、剂量和来源。</p>' + result.suggestions.map((s, i) => {
        const original = AI_CORE.displayValue(s.path, RECORD_CORE.getPath(r, s.path)) || '';
        const kindLabel = s.kind === 'choice' ? '选择项 · 默认不勾选' : s.kind === 'number' ? '数值项 · 待核对' : '文本项 · 待核对';
        return `<article class="ai-suggestion"><label class="ai-check"><input type="checkbox" data-ai-choice="${i}"><strong>${esc(AI_CORE.labels[s.path])}</strong><small>${kindLabel}</small></label><div class="ai-compare"><div><small>原内容</small><p>${esc(original || '（空白）')}</p></div><div><small>AI 建议 · 待核对</small><p>${esc(AI_CORE.displayValue(s.path, s.text))}</p></div></div><details><summary>查看原文依据</summary>${s.evidence.map(e => `<blockquote>${esc(e.quote)}</blockquote>`).join('')}</details></article>`;
      }).join('') + (result.issues.length ? '<h3>待核实的问题</h3><ul>' + result.issues.map(i => `<li>${i.path ? esc(AI_CORE.labels[i.path]) + '：' : ''}${esc(i.message)}</li>`).join('') + '</ul>' : '') +
        (result.questions.length ? '<h3>建议补问</h3><ul>' + result.questions.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' : '') +
        (result.suggestions.length ? '<label class="ai-check ai-consent-box"><input id="aiReplace" type="checkbox">允许用勾选建议替换已有内容（操作可撤销）</label><button id="aiApply" class="btn">采纳勾选项</button>' : '<div class="ai-empty-inline"><strong>没有可直接填写的建议</strong><p>可以补充更具体的原文依据，或先返回病历继续核对。</p></div>');
      if (result.suggestions.length) $('aiApply').onclick = apply;
      status('生成完成；请核对后勾选采纳。AI 检查不能证明病历正确或完整');
    } catch (e) { result = null; status(e.message || '结果校验失败，未写入病历'); }
  }
  async function apply() {
    if (busy || !request || !result) return;
    try {
      const selected = Array.from(panel.querySelectorAll('[data-ai-choice]:checked')).map(el => Number(el.dataset.aiChoice));
      $('aiApply').disabled = true;
      const applied = await APP.applyAI(request, result, selected, $('aiReplace').checked, model);
      if (!panel) return;
      invalidate(); pendingFields();
      status(applied.saved ? '已采纳 ' + applied.count + ' 项并保存到草稿，仍待逐项核对；可撤销上一步' : '已采纳到内存，但保存失败；请立即导出备份并处理主页面提示');
    } catch (e) { if (!panel) return; if ($('aiApply')) $('aiApply').disabled = false; status(e.message); }
  }
  return {open, close, receive, isOpen: () => !!panel};
})();
