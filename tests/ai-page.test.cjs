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

test('整理填表同屏确认文字、数值和选择项，撤销保留之后的手改', async t => {
  const a = await boot(t); a.$('btnAi').click(); prepare(a, 'organize');
  const note = '患者诉咳嗽3天，否认发热。体温37.8℃，脉搏96次/分，否认吸烟。';
  a.$('aiNotes').value = note;
  a.$('aiNotes').dispatchEvent(new a.w.Event('input'));
  a.$('aiPrepare').click(); send(a);
  const content = {ok:true, model:'deepseek-flash', content:{suggestions:[
    {path:'hpi.symptoms', text:'患者诉咳嗽3天。', evidence:[{source:'note', quote:'患者诉咳嗽3天'}]},
    {path:'pe.vitals.temperature', text:'37.8', evidence:[{source:'note', quote:'体温37.8℃'}]},
    {path:'personal.smoking', text:'无', evidence:[{source:'note', quote:'否认吸烟'}]},
    {path:'pe.vitals.pulse', text:'69', evidence:[{source:'note', quote:'脉搏96次/分'}]},
  ], issues:[], questions:[]}};
  a.run(`AI_ASSIST.receive(${JSON.stringify(a.wire.sent.at(-1).id)}, ${JSON.stringify(content)})`);
  assert.match(a.$('aiResult').textContent, /数值项/);
  assert.match(a.$('aiResult').textContent, /选择项/);
  assert.match(a.$('aiResult').textContent, /未通过核对/);
  const inputs = [...a.d.querySelectorAll('[data-ai-choice]')];
  assert.equal(inputs.length, 3); assert.ok(inputs.every(input => !input.checked));
  inputs.forEach(input => { input.checked = true; }); a.$('aiApply').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.run('APP.getRecord().pe.vitals.temperature'), '37.8');
  assert.equal(a.run('APP.getRecord().personal.smoking'), '无');
  assert.equal(a.run('APP.getRecord().pe.vitals.pulse') ?? '', '');
  a.d.querySelector('[data-ai-edit="hpi.symptoms"]').click();
  const symptoms = a.d.querySelector('[data-path="hpi.symptoms"]');
  symptoms.value = '手改后的症状'; symptoms.dispatchEvent(new a.w.Event('input', {bubbles:true}));
  a.run('APP._test.gotoStep("personal")');
  a.d.querySelector('[data-seg="personal.smoking"][data-val="无"]').click();
  a.$('btnAi').click(); a.$('aiUndo').click();
  assert.equal(a.run('APP.getRecord().hpi.symptoms'), '手改后的症状');
  assert.equal(a.run('APP.getRecord().pe.vitals.temperature') ?? '', '');
  assert.equal(a.run('APP.getRecord().personal.smoking'), '无');
});

test('AI 页说明不再出现系统回顾，原始笔记提示随病历保存', async t => {
  const a = await boot(t);
  a.$('btnAi').click();
  const intro = a.$('aiIntro').textContent;
  assert.match(intro, /只填病史、生命体征与查体等白名单字段/);
  assert.doesNotMatch(intro, /系统回顾/);
  assert.match(a.$('aiNotesWrap').textContent, /随病历保存在本机/);
  assert.ok(a.$('aiReorganize'), 'AI 页应提供“重新整理”按钮');
  assert.equal(a.$('aiReorganize').textContent.trim(), '重新整理');
});

test('原始笔记及时落盘，pagehide 立即写入，重开恢复且删除病历一起删除', async t => {
  const a = await boot(t);
  a.$('btnAi').click();
  const note = '虚构原始笔记：咳嗽三天，夜间加重。';
  a.$('aiNotes').value = note;
  a.$('aiNotes').dispatchEvent(new a.w.Event('input'));
  a.w.dispatchEvent(new a.w.Event('pagehide'));

  const id = a.run('APP.getRecord().id');
  const draftKey = a.run(`RECORD_CORE.draftKey(${JSON.stringify(id)})`);
  assert.equal(JSON.parse(a.w.localStorage.getItem(draftKey)).rawNotes, note);

  a.run('AI_ASSIST.close(true)');
  a.$('btnAi').click();
  assert.equal(a.$('aiNotes').value, note);

  a.run('APP.getRecord().basic.name = "虚构原始笔记患者"');
  a.run('APP._test.saveToLibrary()');
  assert.equal(JSON.parse(a.w.localStorage.getItem(draftKey)).rawNotes, note);
  a.run('APP._test.openList()');
  a.w.confirm = () => true;
  const listHtml = a.d.querySelector('#recordListBox').innerHTML;
  assert.match(listHtml, /虚构原始笔记患者/);
  a.d.querySelector(`[data-del="${id}"]`).click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.w.localStorage.getItem(draftKey), null);
  assert.equal(a.run('APP.getRecord().rawNotes') || '', '');
});

test('病历列表支持部分搜索，复制为新病历保留结构并清空身份和原始笔记', async t => {
  const a = await boot(t);
  a.run(`(() => {
    const first = APP.getRecord();
    first.id = 'search-a';
    first.basic.name = '虚构搜索甲';
    first.basic.department = 'respiratory';
    first.basic.chiefComplaint = '咳嗽伴发热';
    first.hpi.symptoms = '受凉后咳嗽。';
    first.pe.general.conscious = '神志清楚，精神可';
    first.diagnosis.confirmed = ['社区获得性肺炎'];
    first.rawNotes = '虚构笔记甲';
    APP._test.saveToLibrary();
    APP._test.newRecord();
    const second = APP.getRecord();
    second.id = 'search-b';
    second.basic.name = '虚构搜索乙';
    second.basic.department = 'digestive';
    second.basic.chiefComplaint = '上腹隐痛';
    second.discharge.diagnoses = ['慢性胃炎'];
    APP._test.saveToLibrary();
  })()`);

  a.run('APP._test.openList()');
  const search = a.d.querySelector('#recordSearch');
  search.value = '肺炎';
  search.dispatchEvent(new a.w.Event('input'));
  let html = a.d.querySelector('#recordListBox').innerHTML;
  assert.match(html, /虚构搜索甲/);
  assert.doesNotMatch(html, /虚构搜索乙/);

  search.value = '不存在';
  search.dispatchEvent(new a.w.Event('input'));
  html = a.d.querySelector('#recordListBox').innerHTML;
  assert.match(html, /没有匹配的病历/);

  search.value = '虚构搜索';
  search.dispatchEvent(new a.w.Event('input'));
  html = a.d.querySelector('#recordListBox').innerHTML;
  assert.match(html, /虚构搜索甲/);
  assert.match(html, /虚构搜索乙/);

  const copyButton = a.d.querySelector('[data-copy="search-a"]');
  assert.ok(copyButton, '每份病历应有复制为新病历按钮');
  a.w.confirm = () => true;
  copyButton.click();
  await new Promise(resolve => setImmediate(resolve));

  const copied = a.run('APP.getRecord()');
  assert.notEqual(copied.id, 'search-a');
  assert.equal(copied.basic.name, '');
  assert.equal(copied.basic.bedNo, '');
  assert.equal(copied.basic.recordNo, '');
  assert.equal(copied.rawNotes, '');
  assert.equal(copied.basic.department, 'respiratory');
  assert.equal(copied.basic.chiefComplaint, '咳嗽伴发热');
  assert.equal(copied.hpi.symptoms, '受凉后咳嗽。');
  assert.equal(copied.pe.general.conscious, '神志清楚，精神可');
  assert.equal(copied.diagnosis.confirmed.join('|'), '社区获得性肺炎');
  const listed = a.run('APP._test.getList().length');
  assert.equal(listed, 3);
});

test('导出文件名不含患者姓名，分享与打印调用 Android bridge', async t => {
  const a = await boot(t);
  const wire = {shared: [], printed: []};
  a.w.BingliAndroid.share = (text, filename, mime) => wire.shared.push({text, filename, mime});
  a.w.BingliAndroid.printDocument = (html, title) => wire.printed.push({html, title});
  a.run(`(() => {
    const r = APP.getRecord();
    r.id = 'general-record-123456';
    r.basic.name = '绝不能出现在文件名里的姓名';
    r.basic.department = 'general';
    r.basic.recordDate = '2026-11-11';
    APP._test.gotoStep('output');
  })()`);

  const filename = a.run('APP._test.outputFileName("大病历")');
  assert.equal(filename, '大病历_123456_2026-11-11.txt');
  assert.doesNotMatch(filename, /姓名/);

  a.run('APP._test.handleAction("shareText", {})');
  assert.equal(wire.shared.length, 1);
  assert.equal(wire.shared[0].filename, filename);
  assert.equal(wire.shared[0].mime, 'text/plain');
  assert.match(wire.shared[0].text, /【入院记录】/);

  a.run('APP._test.handleAction("printText", {})');
  assert.equal(wire.printed.length, 1);
  assert.equal(wire.printed[0].title, '大病历');
  assert.match(wire.printed[0].html, /pre/);
  assert.match(wire.printed[0].html, /大病历/);
});

test('备份导出默认不带原始笔记，勾选后带笔记且导入可还原', async t => {
  const a = await boot(t);
  const exported = [];
  a.w.BingliAndroid.export = (text, filename, mime) => exported.push({text, filename, mime});
  a.run(`(() => {
    const r = APP.getRecord();
    r.basic.name = '虚构备份患者';
    r.rawNotes = '虚构备份笔记';
    APP._test.saveToLibrary();
  })()`);
  a.run('APP._test.openList()');

  a.d.querySelector('[data-backup]').click();
  assert.equal(exported.length, 1);
  let bundle = JSON.parse(exported[0].text);
  assert.equal(bundle.records.every(record => !('rawNotes' in record.data)), true);
  assert.equal(bundle.includesNotes, undefined);

  a.d.querySelector('#exportIncludeNotes').checked = true;
  a.d.querySelector('[data-backup]').click();
  assert.equal(exported.length, 2);
  bundle = JSON.parse(exported[1].text);
  assert.equal(bundle.includesNotes, true);
  assert.equal(bundle.records[0].data.rawNotes, '虚构备份笔记');

  const parsed = a.run(`RECORD_CORE.parseImport(${JSON.stringify(exported[1].text)}, SCHEMA.emptyRecord, SCHEMA.DEPARTMENTS.map(d => d.key))`);
  assert.equal(parsed.records[0].data.rawNotes, '虚构备份笔记');
});
