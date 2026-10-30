/* Android WebView interaction acceptance with synthetic AI responses.
 * Requires a debuggable App and adb forward tcp:19225 localabstract:webview_devtools_remote_<pid>.
 * Never sends real API requests or changes credential settings. Does not prove model quality.
 */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const port = Number(process.env.BINGLI_WEBVIEW_PORT || 19225);
async function main() {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const target = targets.find(t => t.url === 'https://appassets.androidplatform.net/assets/index.html');
  assert.ok(target, 'App WebView not found');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  let serial = 0; const pending = new Map(); let count = 0;
  ws.addEventListener('message', event => { const m = JSON.parse(event.data); const p = pending.get(m.id); if (p) { clearTimeout(p.timeout); pending.delete(m.id); m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } });
  const send = (method, params) => new Promise((resolve, reject) => {
    const id = ++serial; const timeout = setTimeout(() => { pending.delete(id); reject(Error(method + ' timed out')); }, 10000);
    pending.set(id, {resolve, reject, timeout}); ws.send(JSON.stringify({id, method, params}));
  });
  const ev = async expression => {
    const r = await send('Runtime.evaluate', {expression: `(async()=>{${expression}})()`, returnByValue: true, awaitPromise: true});
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const check = (title, value) => { assert.ok(value, title); console.log('PASS ' + title); count++; };
  const wait = async expression => {
    for (let i = 0; i < 80; i++) { if (await ev('return ' + expression)) return; await new Promise(r => setTimeout(r, 50)); }
    throw Error('Timed out: ' + expression);
  };
  let original;
  try {
    original = await ev('return JSON.parse(JSON.stringify(APP.getRecord()));');
    check('native AI bridge and assistant entry available', await ev('return !!BingliAndroid.aiSettings && !document.querySelector("#btnAI").hidden;'));
    console.log('Native config (no key exposed):', await ev('return JSON.parse(BingliAndroid.aiStatus());'));
    await ev(`window.__nativeAI = window.BingliAndroid;
      window.BingliAndroid = {aiStatus:()=>JSON.stringify({configured:true,model:'deepseek-flash'}),aiSettings:()=>{},aiRequest:(id,payload)=>{window.__wire={id,payload}},aiCancel:id=>{window.__canceled=id}};
      const r=SCHEMA.emptyRecord();r.id='ai-synthetic-'+Date.now();r.basic.name='合成姓名';r.basic.phone='13812345678';r.hpi.symptoms='旧症状';APP._test.setRecord(r);APP._test.render();AI_ASSIST.open();
      document.querySelector('#aiNotes').value='合成姓名电话13812345678。患者诉咳嗽3天，药名不详。';document.querySelector('#aiPrepare').click();`);
    check('preview redacts known identity', await ev(`const s=document.querySelector('#aiSources').textContent;return !s.includes('合成姓名')&&!s.includes('13812345678')&&s.includes('患者诉咳嗽3天');`));
    await ev("document.querySelector('#aiSend').click();");
    check('explicit send consent required', await ev('return !window.__wire;'));
    await ev("document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();");
    check('generation does not modify original record', await ev("return APP.getRecord().hpi.symptoms==='旧症状'&&!!window.__wire;"));
    await ev(`window.__answer={ok:true,model:'deepseek-flash',content:{suggestions:[{path:'hpi.symptoms',text:'患者诉咳嗽3天。',evidence:[{source:'note',quote:'患者诉咳嗽3天'}]}],issues:[],questions:['请补问有无发热']}};
      AI_ASSIST.receive('wrong_request',window.__answer);`);
    check('late/foreign request ignored', await ev('return !document.querySelector("#aiApply");'));
    await ev(`AI_ASSIST.receive(window.__wire.id,window.__answer);`);
    const preview = await send('Page.captureScreenshot', {format: 'png'});
    fs.mkdirSync('tmp-review', {recursive: true}); fs.writeFileSync('tmp-review/deepseek-suggestions.png', Buffer.from(preview.data, 'base64'));
    await ev(`document.querySelector('[data-ai-choice="0"]').checked=true;document.querySelector('#aiApply').click();`);
    await wait("document.querySelector('#aiStatus').textContent.includes('已有内容')");
    check('existing text not silently overwritten', await ev("return APP.getRecord().hpi.symptoms==='旧症状';"));
    await ev("document.querySelector('#aiReplace').checked=true;document.querySelector('#aiApply').click();");
    await wait("document.querySelector('#aiStatus').textContent.includes('已采纳 1 项并保存')");
    check('accepted suggestion persisted with unreviewed AI source', await ev(`const r=APP.getRecord();const d=JSON.parse(localStorage.getItem('dabingli.draft.v1.'+r.id));return d.hpi.symptoms==='患者诉咳嗽3天。'&&RECORD_CORE.fieldState(r,'hpi.symptoms').source==='ai'&&!RECORD_CORE.fieldReviewValid(r,'hpi.symptoms');`));
    await ev("document.querySelector('[data-review=" + '"hpi.symptoms"' + "]').click();");
    check('manual per-field review supported', await ev("return RECORD_CORE.fieldReviewValid(APP.getRecord(),'hpi.symptoms');"));
    await ev("document.querySelector('#aiUndo').click();");
    check('undo restores prior text', await ev("return APP.getRecord().hpi.symptoms==='旧症状';"));
    await ev("document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();APP.getRecord().hpi.onset='请求期间新增';AI_ASSIST.receive(window.__wire.id,window.__answer);");
    check('changed record rejects old result', await ev("return document.querySelector('#aiStatus').textContent.includes('病历已改变')&&!document.querySelector('#aiApply');"));
    await ev("document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();window.__late=window.__wire.id;document.querySelector('#aiCancel').click();AI_ASSIST.receive(window.__late,window.__answer);");
    check('cancel ignores late callback', await ev("return document.querySelector('#aiStatus').textContent.includes('已取消')&&!document.querySelector('#aiApply');"));
    await ev("document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();AI_ASSIST.receive(window.__wire.id,{ok:false,error:'网络连接失败，请检查联网后重试'});");
    check('request errors preserve input for retry', await ev("return document.querySelector('#aiNotes').value.includes('咳嗽3天')&&document.querySelector('#aiStatus').textContent.includes('网络连接失败');"));
    await ev("document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();window.__bad=JSON.parse(JSON.stringify(window.__answer));window.__bad.content.suggestions[0].evidence[0].quote='伪造原文';AI_ASSIST.receive(window.__wire.id,window.__bad);");
    check('fabricated citation blocked in actual UI', await ev("return document.querySelector('#aiStatus').textContent.includes('无法核实')&&!document.querySelector('#aiApply');"));
    await ev("document.querySelector('#aiOperation').value='polish';document.querySelector('#aiOperation').onchange();document.querySelector('#aiTarget').value='hpi.symptoms';document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();");
    check('polish sends only selected paragraph', await ev("const p=JSON.parse(JSON.parse(window.__wire.payload).user);return p.sources.length===1&&p.sources[0].source==='hpi.symptoms'&&p.targets.length===1;"));
    await ev("document.querySelector('#aiCancel').click();document.querySelector('#aiOperation').value='check';document.querySelector('#aiOperation').onchange();document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();AI_ASSIST.receive(window.__wire.id,{ok:true,model:'deepseek-flash',content:{suggestions:[],issues:[{path:'hpi.onset',message:'<img src=x onerror=alert(1)>起病时间待核实'}],questions:['请补问发热情况']}});");
    check('check is read-only and model text is escaped', await ev("return !document.querySelector('#aiApply')&&!document.querySelector('#aiResult img')&&document.querySelector('#aiResult').textContent.includes('起病时间待核实');"));
    await ev("document.querySelector('#aiOperation').value='summary';document.querySelector('#aiOperation').onchange();document.querySelector('#aiPrepare').click();document.querySelector('#aiConsent').checked=true;document.querySelector('#aiSend').click();AI_ASSIST.receive(window.__wire.id,{ok:true,model:'deepseek-flash',content:{suggestions:[{path:'summary',text:'旧症状。',evidence:[{source:'hpi.symptoms',quote:'旧症状'}]}],issues:[],questions:[]}});document.querySelector('[data-ai-choice=" + '"0"' + "]').checked=true;document.querySelector('#aiApply').click();");
    await wait("document.querySelector('#aiStatus').textContent.includes('已采纳 1 项并保存')");
    check('summary draft has provenance and stale tracking', await ev("return APP.getRecord().summary==='旧症状。'&&RECORD_CORE.documentState(APP.getRecord(),'summary').state==='fresh'&&RECORD_CORE.fieldState(APP.getRecord(),'summary').source==='ai';"));
    await ev("document.querySelector('#aiUndo').click();");
    const metrics = await ev('return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,sheet:document.querySelector(".ai-sheet").getBoundingClientRect().width};');
    check('portrait assistant fits viewport', !metrics.overflow && metrics.sheet <= metrics.width + 1);
    console.log('Layout:', JSON.stringify(metrics));
    const image = await send('Page.captureScreenshot', {format: 'png'});
    fs.mkdirSync('tmp-review', {recursive: true}); fs.writeFileSync('tmp-review/deepseek-assistant.png', Buffer.from(image.data, 'base64'));
  } finally {
    if (original) await ev(`AI_ASSIST.close(true);const testId=APP.getRecord().id;APP._test.setRecord(${JSON.stringify(original)});await APP._test.saveCurrentAwait();APP._test.render();if(testId.startsWith('ai-synthetic-'))localStorage.removeItem('dabingli.draft.v1.'+testId);if(window.__nativeAI)window.BingliAndroid=window.__nativeAI;`);
    ws.close();
  }
  console.log(`${count}/${count} Android WebView synthetic-response checks passed`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
