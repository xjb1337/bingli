const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, '../android/app/src/main/assets/index.html'), 'utf8');

async function boot(t) {
  const wire = {sent: [], canceled: [], settings: 0, scrolls: []};
  const dom = new JSDOM(html, {
    url: 'https://ai-page.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.scrollTo = value => wire.scrolls.push(value.top);
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.confirm = () => true;
      w.BingliAndroid = {
        aiStatus: () => JSON.stringify({configured: true, model: 'deepseek-flash'}),
        aiRequest: (id, payload) => wire.sent.push({id, payload: JSON.parse(payload)}),
        aiCancel: id => wire.canceled.push(id), aiSettings: () => wire.settings++,
      };
    },
  });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  const w = dom.window, d = w.document;
  const run = code => w.eval(code);
  const $ = id => d.getElementById(id);
  return {w, d, $, wire, run};
}

function prepare(app, operation = 'recognize') {
  const {$, w} = app;
  $('aiOperation').value = operation;
  $('aiOperation').dispatchEvent(new w.Event('change'));
  const input = $(operation === 'organize' ? 'aiNotes' : 'aiRecognizeText');
  input.value = '患者诉咳嗽3天，无发热。';
  input.dispatchEvent(new w.Event('input'));
  $('aiPrepare').click();
}
function send(app) {
  app.$('aiConsent').checked = true;
  app.$('aiConsent').dispatchEvent(new app.w.Event('change'));
  app.$('aiSend').click();
}
const answer = {ok: true, model: 'deepseek-flash', content: {suggestions: [
  {path: 'hpi.symptoms', text: '患者诉咳嗽3天，无发热。', evidence: [{source: 'note', quote: '患者诉咳嗽3天，无发热。'}]},
], issues: [], questions: ['请补问有无咳痰']}};

test('AI 是独立 main 页，重复打开不叠加；关闭恢复表单、焦点和滚动位置', async t => {
  const a = await boot(t);
  a.run('APP._test.gotoStep("hpi")');
  const field = a.d.querySelector('[data-path="hpi.symptoms"]');
  field.value = '保留主表单草稿';
  field.dispatchEvent(new a.w.Event('input', {bubbles: true}));
  a.$('btnAi').focus();
  Object.defineProperty(a.w, 'scrollY', {value: 234, configurable: true});
  a.$('btnAi').click(); a.run('AI_ASSIST.open()');
  assert.equal(a.d.querySelectorAll('main.ai-page').length, 1);
  assert.equal(a.d.querySelector('.ai-mask, .ai-sheet, [aria-modal="true"]'), null);
  assert.ok(a.d.body.classList.contains('ai-view'));
  assert.equal(a.d.querySelector('.ai-page').getAttribute('aria-labelledby'), 'aiTitle');
  assert.equal(a.d.activeElement.id, 'aiClose');
  assert.equal(a.wire.scrolls.at(-1), 0);
  a.$('aiSettings').click(); assert.equal(a.wire.settings, 1);
  assert.equal(a.run('APP.handleBack()'), true);
  assert.ok(!a.d.body.classList.contains('ai-view'));
  assert.equal(a.d.querySelector('.ai-page'), null);
  assert.equal(a.d.activeElement.id, 'btnAi');
  assert.equal(a.wire.scrolls.at(-1), 234);
  assert.equal(a.d.querySelector('[data-path="hpi.symptoms"]'), field);
  assert.equal(a.run('APP.getRecord().hpi.symptoms'), '保留主表单草稿');
});

test('AI 可从设置页往返；取消关闭保留原始资料，系统返回遵守关闭确认', async t => {
  const a = await boot(t);
  a.run('APP._test.openSettings()'); a.$('btnAi').click(); prepare(a);
  a.w.confirm = () => false;
  assert.equal(a.run('APP.handleBack()'), true);
  assert.ok(a.d.body.classList.contains('ai-view'));
  assert.equal(a.$('aiRecognizeText').value, '患者诉咳嗽3天，无发热。');
  a.w.confirm = () => true; a.$('aiClose').click();
  assert.ok(!a.d.body.classList.contains('ai-view'));
  assert.equal(a.run('APP._test.isSettingsView()'), true);
  a.run('APP.handleBack()');
  assert.equal(a.run('APP._test.isSettingsView()'), false);
});

test('独立页保留确认、busy/cancel 和迟到响应保护，关闭会取消请求', async t => {
  const a = await boot(t); a.$('btnAi').click(); prepare(a);
  assert.equal(a.$('aiPreview').hidden, false);
  assert.equal(a.$('aiSend').disabled, true);
  send(a);
  const page = a.d.querySelector('.ai-page');
  assert.equal(page.getAttribute('aria-busy'), 'true');
  assert.equal(a.$('aiLoading').hidden, false);
  assert.equal(a.$('aiPreview').hidden, true);
  assert.equal(a.$('aiReview').hidden, true);
  assert.equal(a.$('aiCancel').hidden, false);
  const id = a.wire.sent[0].id;
  a.$('aiCancel').click();
  assert.deepEqual(a.wire.canceled, [id]);
  a.run(`AI_ASSIST.receive(${JSON.stringify(id)}, ${JSON.stringify(answer)})`);
  assert.equal(a.$('aiApply'), null);
  assert.equal(page.getAttribute('aria-busy'), 'false');
  send(a); const next = a.wire.sent.at(-1).id;
  a.run('APP.handleBack()');
  assert.equal(a.wire.canceled.at(-1), next);
  assert.ok(!a.d.body.classList.contains('ai-view'));
});

test('整理进度、建议采纳、未核对提醒、核对、撤销和返回字段保持可用', async t => {
  const a = await boot(t); a.$('btnAi').click(); prepare(a, 'organize');
  assert.equal(a.$('aiProgress').hidden, false);
  assert.equal(a.d.querySelector('[aria-current="step"]').dataset.aiStep, '2');
  send(a);
  a.run(`AI_ASSIST.receive(${JSON.stringify(a.wire.sent[0].id)}, ${JSON.stringify(answer)})`);
  assert.equal(a.d.querySelector('[aria-current="step"]').dataset.aiStep, '3');
  assert.equal(a.d.querySelector('[data-ai-choice]').checked, false);
  a.d.querySelector('[data-ai-choice]').checked = true; a.$('aiApply').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.run('APP.getRecord().hpi.symptoms'), '患者诉咳嗽3天，无发热。');
  assert.equal(a.d.querySelector('[aria-current="step"]').dataset.aiStep, '4');
  assert.equal(a.$('aiUnreviewed').hidden, false);
  a.$('aiUnreviewed').click();
  a.d.querySelector('[data-review]').click();
  assert.equal(a.$('aiUnreviewed').hidden, true);
  a.d.querySelector('[data-ai-edit]').click();
  assert.ok(!a.d.body.classList.contains('ai-view'));
  assert.equal(a.run('APP._test.getStepKey()'), 'hpi');
  a.$('btnAi').click();
  a.$('aiUndo').click();
  assert.equal(a.run('APP.getRecord().hpi.symptoms'), '');
  assert.ok(a.d.body.classList.contains('ai-view'), 'APP.render 不得破坏 AI 页');
  a.run('AI_ASSIST.close(true)');
  assert.ok(!a.d.body.classList.contains('ai-view'));
});
