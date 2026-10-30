/* App-only assistant UI. Credentials and networking remain in Android. */
const AI_ASSIST = (() => {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  let panel = null, pending = null, request = null, result = null, model = '', timer = null;
  let busy = false;
  const bridge = () => window.BingliAndroid;
  const $ = id => panel.querySelector('#' + id);
  function status(text) { if (panel) { $('aiStatus').textContent = text; $('aiStatus').focus(); } }
  function close(force = false) {
    if (!force && panel && (pending || $('aiNotes').value.trim()) && !window.confirm('关闭会取消请求并清除本窗口的原始笔记。已采纳到病历的内容会保留。确定关闭？')) return;
    if (pending) bridge().aiCancel(pending);
    clearTimeout(timer); pending = null; request = null; result = null; busy = false;
    if (panel) { panel.remove(); panel = null; }
  }
  function invalidate() { request = null; result = null; if (panel) { $('aiPreview').hidden = true; $('aiResult').innerHTML = ''; } }
  function pendingFields() {
    if (!panel) return;
    const r = APP.getRecord();
    const paths = Object.keys((r.meta && r.meta.fieldStates) || {}).filter(p => AI_CORE.fields[p] && RECORD_CORE.fieldState(r, p).source === 'ai' && !RECORD_CORE.fieldReviewValid(r, p));
    $('aiReview').innerHTML = paths.length ? '<h3>已采纳、待核对</h3>' + paths.map(p => {
      let provenance = {}; try { provenance = JSON.parse(RECORD_CORE.fieldState(r, p).sourceRef); } catch (e) { }
      return `<div class="ai-review"><strong>${esc(AI_CORE.fields[p])}</strong><p>${esc(RECORD_CORE.getPath(r, p))}</p><details><summary>AI 来源与原文依据</summary><small>${esc(provenance.model || 'DeepSeek')}</small>${(provenance.evidence || []).map(e => '<blockquote>' + esc(e.quote) + '</blockquote>').join('')}</details><button class="btn btn-ghost" data-review="${esc(p)}">已逐字核对，确认本项</button></div>`;
    }).join('') : '';
    $('aiReview').querySelectorAll('[data-review]').forEach(button => button.onclick = () => { APP.reviewAI(button.dataset.review); pendingFields(); status('本项已标记核对；内容再次修改后需要重新核对'); });
  }
  function open() {
    if (!bridge() || !bridge().aiRequest) return;
    if (panel) return;
    panel = document.createElement('div'); panel.className = 'ai-mask';
    panel.innerHTML = `<section class="ai-sheet" role="dialog" aria-modal="true" aria-labelledby="aiTitle">
      <div class="ai-heading"><div><span class="ai-eyebrow">DEEPSEEK · 填写辅助</span><h2 id="aiTitle">AI 病历助手</h2></div><button id="aiClose" class="btn btn-ghost">关闭</button></div>
      <p class="ai-note">只处理你选择的资料。结果须核对后采纳；未问、未查、不详不得当成正常。联网内容将发送至 DeepSeek。当前辅助填写文本病史，过敏、吸烟饮酒等选择项仍需手动确认。</p>
      <div class="ai-settings-row"><button id="aiSettings" class="btn btn-ghost">API 设置 / 测试连接</button><span id="aiModel"></span></div>
      <label for="aiOperation">需要什么帮助</label><select id="aiOperation">${Object.entries(AI_CORE.operations).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <div id="aiTargetWrap" hidden><label for="aiTarget">选择要润色的段落</label><select id="aiTarget">${Object.entries(AI_CORE.fields).filter(([k]) => k !== 'summary').map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
      <div id="aiNotesWrap"><label for="aiNotes">原始问诊笔记（仅在本次窗口保留）</label><textarea id="aiNotes" rows="5" maxlength="16000" placeholder="如：患者诉咳嗽3天，昨晚加重，发热情况未问，既往有高血压，具体用药不详。"></textarea></div>
      <p class="hint">已录入的姓名、电话、住址、病历号等会尽量屏蔽；自由文本中的身份信息可能遗漏，发送前请检查预览。未核对的模板、默认内容和 AI 字段不作为事实发送。</p>
      <button id="aiPrepare" class="btn">预览将发送的资料</button>
      <div id="aiPreview" hidden><h3>实际发送内容</h3><pre id="aiSources" class="ai-source"></pre><label class="ai-check"><input id="aiConsent" type="checkbox">我已检查上述内容，确认可发送至 DeepSeek</label><button id="aiSend" class="btn">发送并生成建议</button></div>
      <p id="aiStatus" role="status" tabindex="-1"></p><button id="aiCancel" class="btn btn-ghost" hidden>取消请求</button>
      <div id="aiResult"></div><div id="aiReview"></div>
      <button id="aiUndo" class="btn btn-ghost">撤销上一步可撤销操作</button>
    </section>`;
    document.body.appendChild(panel);
    $('aiClose').onclick = close;
    $('aiSettings').onclick = () => bridge().aiSettings();
    const updateMode = () => {
      invalidate(); const op = $('aiOperation').value;
      $('aiTargetWrap').hidden = op !== 'polish'; $('aiNotesWrap').hidden = op !== 'organize';
      status('');
    };
    $('aiOperation').onchange = updateMode;
    $('aiTarget').onchange = invalidate; $('aiNotes').oninput = invalidate;
    $('aiPrepare').onclick = prepare;
    $('aiSend').onclick = send;
    $('aiCancel').onclick = () => { if (pending) bridge().aiCancel(pending); pending = null; clearTimeout(timer); setBusy(false); status('已取消，病历未改动；可再次发送'); };
    $('aiUndo').onclick = () => { if (!busy) { APP.undoAI(); invalidate(); pendingFields(); status('已请求撤销，请检查病历及保存状态'); } };
    pendingFields(); refreshModel(); $('aiClose').focus();
  }
  function refreshModel() {
    try { const s = JSON.parse(bridge().aiStatus()); model = s.model || ''; $('aiModel').textContent = s.configured ? model : '尚未设置 API Key'; return s.configured; }
    catch (e) { status('无法读取 AI 设置'); return false; }
  }
  function prepare() {
    if (busy) return;
    try {
      request = AI_CORE.prepare($('aiOperation').value, APP.getRecord(), $('aiOperation').value === 'organize' ? $('aiNotes').value : '', $('aiTarget').value);
      result = null; $('aiResult').innerHTML = '';
      $('aiSources').textContent = request.sources.map(s => '[' + s.label + ']\n' + s.text).join('\n\n');
      $('aiConsent').checked = false; $('aiPreview').hidden = false;
      status('请核对实际发送内容；本次不发送姓名、病历号等身份字段');
    } catch (e) { request = null; $('aiPreview').hidden = true; status(e.message); }
  }
  function setBusy(value) {
    busy = value;
    ['aiOperation', 'aiTarget', 'aiNotes', 'aiPrepare', 'aiSend', 'aiSettings', 'aiUndo'].forEach(id => { $(id).disabled = value; });
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
    try { bridge().aiRequest(pending, JSON.stringify({system: AI_CORE.system, user: request.user})); }
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
      $('aiResult').innerHTML = '<h3>建议对照 · 尚未写入</h3><p class="hint">引用真实不代表建议一定正确。逐项检查否定词、时间、药名、剂量和来源。</p>' + result.suggestions.map((s, i) => {
        const original = RECORD_CORE.getPath(r, s.path) || '';
        return `<article class="ai-suggestion"><label class="ai-check"><input type="checkbox" data-ai-choice="${i}"><strong>${esc(AI_CORE.fields[s.path])}</strong></label><div class="ai-compare"><div><small>原内容</small><p>${esc(original || '（空白）')}</p></div><div><small>AI 建议 · 待核对</small><p>${esc(s.text)}</p></div></div><details><summary>查看原文依据</summary>${s.evidence.map(e => `<blockquote>${esc(e.quote)}</blockquote>`).join('')}</details></article>`;
      }).join('') + (result.issues.length ? '<h3>待核实的问题</h3><ul>' + result.issues.map(i => `<li>${i.path ? esc(AI_CORE.fields[i.path]) + '：' : ''}${esc(i.message)}</li>`).join('') + '</ul>' : '') +
        (result.questions.length ? '<h3>建议补问</h3><ul>' + result.questions.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' : '') +
        (result.suggestions.length ? '<label class="ai-check"><input id="aiReplace" type="checkbox">允许用勾选建议替换已有内容（操作可撤销）</label><button id="aiApply" class="btn">采纳勾选项</button>' : '<p>没有可直接填写的建议。</p>');
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
  function init() {
    const button = document.getElementById('btnAI');
    if (!button || !bridge() || !bridge().aiRequest) return;
    button.hidden = false; button.addEventListener('click', open);
  }
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
  return {open, close, receive, isOpen: () => !!panel};
})();
