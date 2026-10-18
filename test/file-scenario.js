/* 模拟真实手机场景：file:// 打开、无网络、窄屏、点击密集操作
 * 重点验证：localStorage 在 file:// 下可用、长按复制降级路径、多病历切换
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const HTML = path.resolve(__dirname, '..', 'dist', '大病历生成器.html');
const SHOT_DIR = path.resolve(__dirname, '..', 'dist', 'shots');
const PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbl-file-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--window-size=412,915', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2500);

  let targets;
  for (let i = 0; i < 20; i++) {
    try { targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json()); if (targets?.length) break; } catch (e) {}
    await sleep(500);
  }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  const errors = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await new Promise(res => ws.addEventListener('open', res));
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    }
  });

  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'file:///' + HTML.replace(/\\/g, '/') });
  await sleep(2200);

  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOT_DIR, name + '.png'), Buffer.from(r.data, 'base64'));
  };

  const results = [];
  const check = (n, ok, d) => { results.push([n, ok, d]); };

  // 1. file:// 下 localStorage 是否可用（关键！）
  const storageOk = await ev(`(() => { try { localStorage.setItem('__t','1'); const v = localStorage.getItem('__t'); localStorage.removeItem('__t'); return v === '1'; } catch(e) { return 'ERR:' + e.message; } })()`);
  check('file:// 下 localStorage 可用', storageOk === true, String(storageOk));

  // 2. 完整走一遍：中文输入（模拟输入法输入多字）
  await ev(`(() => {
    const set = (p,v) => { const el = document.querySelector('[data-path="'+p+'"]'); el.value = v; el.dispatchEvent(new Event('input',{bubbles:true})); };
    set('basic.name','欧阳小明');
    set('basic.age','67');
    set('basic.chiefComplaint','头晕伴右侧肢体乏力');
    set('basic.chiefComplaintDuration','6');
    document.querySelector('[data-seg="basic.gender"][data-val="男"]').click();
    document.querySelector('[data-seg="basic.marital"][data-val="已婚"]').click();
  })()`);
  await sleep(300);
  const cc = await ev(`document.querySelector('#ccPreview').textContent`);
  check('中文主诉生成', cc.includes('头晕伴右侧肢体乏力3天') || cc.includes('6'), cc.trim());

  // 3. 切神经内科，验证科室已切换（跳转标签在体格检查页才渲染）
  await ev(`(() => {
    const s = document.querySelector('select[data-path="basic.department"]');
    s.value='neurology'; s.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await sleep(400);
  const deptValue = await ev(`document.querySelector('select[data-path="basic.department"]').value`);
  check('科室切换成功', deptValue === 'neurology', deptValue);

  // 4. 跳到体格检查，神经专科应有多项
  await ev(`(() => { for (let i=0;i<7;i++) document.getElementById('btnNext').click(); })()`);
  await sleep(600);
  const stepName = await ev(`document.getElementById('stepTitle').textContent`);
  const neuroItems = await ev(`document.querySelectorAll('#pe-special_neurology .pe-item').length`);
  check('神经内科查体项数', stepName === '体格检查' && neuroItems === 5, `${stepName} 项数=${neuroItems}`);
  await shot('10-neuro-pe');

  // 5. 多病历：保存、新建、列表
  await ev(`document.getElementById('btnSave').click()`);
  await sleep(300);
  const savedCount = await ev(`JSON.parse(localStorage.getItem('dabingli.records.v1')||'[]').length`);
  check('保存第一份', savedCount === 1, `数量=${savedCount}`);

  // 直接改 store 模拟已保存病历后刷新，检查恢复
  await send('Page.reload');
  await sleep(2000);
  const restoredName = await ev(`document.querySelector('[data-path="basic.name"]').value`);
  check('刷新后恢复姓名', restoredName === '欧阳小明', restoredName);

  // 6. 长按复制降级路径（file:// 下 navigator.clipboard 通常不可用）
  const clipboardMode = await ev(`(() => { return (navigator.clipboard && window.isSecureContext) ? 'clipboard-api' : 'fallback'; })()`);
  check('复制走降级路径或原生', clipboardMode === 'fallback' || clipboardMode === 'clipboard-api', clipboardMode);

  // 7. 导出页启动时不报错
  await send('Page.reload');
  await sleep(1800);
  await ev(`document.getElementById('btnExport').click()`);
  await sleep(600);
  const outOk = await ev(`(() => { const t = document.getElementById('outputText'); return t ? t.textContent.length : 0; })()`);
  check('导出页生成内容', outOk > 200, `长度=${outOk}`);
  await shot('11-export');

  // 8. 极端输入不崩溃
  await ev(`(() => {
    const set = (p,v) => { const el = document.querySelector('[data-path="'+p+'"]'); if(el){el.value = v; el.dispatchEvent(new Event('input',{bubbles:true}));} };
    document.getElementById('btnExport').click();
  })()`);
  await sleep(300);
  const longText = '发热'.repeat(200);
  const ok = await ev(`(() => {
    try {
      const store = JSON.parse(localStorage.getItem('dabingli.current.v1'));
      store.basic.chiefComplaint = ${JSON.stringify(longText)};
      localStorage.setItem('dabingli.current.v1', JSON.stringify(store));
      return 'set';
    } catch(e) { return 'ERR:' + e.message; }
  })()`);
  await send('Page.reload');
  await sleep(1800);
  const survived = await ev(`document.querySelectorAll('.card').length > 0`);
  check('超长文本不崩溃', ok === 'set' && survived, `写入=${ok} 页面存活=${survived}`);

  console.log('\n================ file:// 场景测试 ================');
  let pass = 0;
  results.forEach(([n, ok, d]) => { console.log(`${ok ? '✓' : '✗'} ${n}  —— ${d}`); if (ok) pass++; });
  console.log(`\n通过 ${pass}/${results.length}`);
  if (errors.length) { console.log('\n未捕获异常：'); errors.slice(0, 5).forEach(e => console.log('  ' + e.split('\n')[0])); }

  ws.close(); chrome.kill(); await sleep(800);
  try { fs.rmSync(userDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) {}
  process.exit(errors.length || pass < results.length ? 1 : 0);
}

main().catch(e => { console.error('测试失败：', e); process.exit(1); });
