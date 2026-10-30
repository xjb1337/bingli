/* 离线缓存验收（B04–B06）
 *
 * 用真实 Chrome + 真实 Service Worker 验证：
 *   B04 已缓存后导航返回 500，再断网仍能用有效缓存打开；
 *   B05 激活新版本时只清理本应用 `dabingli-` 前缀的旧缓存；
 *   B06 更新缓存期间关闭标签页，再断网启动不会得到残缺页面。
 *
 * 用法：node test/sw-check.js
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const SW_PATH = path.join(ROOT, 'sw.js');
const PORT = 9334;
const HTTP_PORT = 8138;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const state = { mode: 'ok', swVersion: 1 };

function startServer() {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url === '/sw.js') {
      const body = fs.readFileSync(SW_PATH, 'utf8') + `\n// test-version-${state.swVersion}\n`;
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
        'Service-Worker-Allowed': '/'
      });
      res.end(body);
      return;
    }
    if (url === '/' || url === '/index.html') {
      if (state.mode === '500') {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>500</h1>');
        return;
      }
      const send = () => {
        const body = fs.readFileSync(HTML_PATH);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(body);
      };
      if (state.mode === 'slow') setTimeout(send, 3000);
      else send();
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });
  return new Promise(resolve => server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server)));
}

async function json(url, opts) {
  const res = await fetch(url, opts);
  return res.json();
}

class Page {
  constructor(wsUrl, name) {
    this.name = name;
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', reject);
    });
    this.ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async function(){${expression}})()`,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(this.name + ' 执行失败：' + (res.exceptionDetails.exception || {}).description);
    }
    return res.result.value;
  }
  async goto(url) {
    await this.send('Page.enable');
    await this.send('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      try {
        const ok = await this.eval('return document.readyState === "complete" && typeof APP !== "undefined" && !!APP.getRecord();');
        if (ok) return;
      } catch (e) { /* 还在加载 */ }
    }
    throw new Error(this.name + ' 页面没有就绪');
  }
  async reload(hard = false) {
    await this.send('Page.reload', hard ? { ignoreCache: true } : {});
    for (let i = 0; i < 100; i++) {
      await sleep(100);
      try {
        const ok = await this.eval('return document.readyState === "complete" && typeof APP !== "undefined" && !!APP.getRecord();');
        if (ok) return;
      } catch (e) { /* retry */ }
    }
    throw new Error(this.name + ' 刷新后没有就绪');
  }
  close() {
    try { this.ws.close(); } catch (e) { /* ignore */ }
  }
}

async function newPage(name) {
  const target = await json(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const page = new Page(target.webSocketDebuggerUrl, name);
  await page.ready;
  page.targetId = target.id;
  return page;
}

async function closeTarget(targetId) {
  try { await json(`http://127.0.0.1:${PORT}/json/close/${targetId}`); } catch (e) { /* ignore */ }
}

async function main() {
  const server = await startServer();
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbl-sw-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=430,932',
    'about:blank'
  ], { stdio: 'ignore' });

  const results = [];
  const errors = [];
  let pages = [];
  const check = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
    if (!ok) errors.push(name);
  };

  try {
    for (let i = 0; i < 30; i++) {
      try {
        const list = await json(`http://127.0.0.1:${PORT}/json/list`);
        if (list && list.some(t => t.type === 'page')) break;
      } catch (e) { /* retry */ }
      await sleep(300);
    }

    const url = `http://127.0.0.1:${HTTP_PORT}/`;
    const p1 = await newPage('sw1');
    pages.push(p1);
    await p1.goto(url);
    await p1.eval('localStorage.clear(); return true;');

    const ready = await p1.eval(`
      if (!navigator.serviceWorker) return { ok: false, reason: 'no sw' };
      const reg = await navigator.serviceWorker.ready;
      return { ok: !!reg.active, cache: await caches.has('dabingli-v3'), controller: !!navigator.serviceWorker.controller, keys: await caches.keys(), entries: (await (await caches.open('dabingli-v3')).keys()).map(r => r.url), matchIndex: !!(await caches.match('./index.html')), matchRoot: !!(await caches.match('./')) };
    `);
    console.log('ready', JSON.stringify(ready));
    check('B04 首次访问后应用本体进入缓存', ready.ok && ready.cache, JSON.stringify(ready));

    // B04：导航返回 500，仍应回退到有效缓存
    state.mode = '500';
    await p1.reload(false).catch(e => console.log('reload500 err', e.message));
    const after500 = await p1.eval('return { title: document.title, app: typeof APP !== "undefined", body: document.body ? document.body.innerText.slice(0,80) : "" };').catch(e => ({ err: e.message }));
    check('B04 导航返回 500 时仍用有效缓存打开', after500.app === true, JSON.stringify(after500));

    // B04：服务器完全断开，仍能打开并继续编辑
    server.close();
    await sleep(300);
    await p1.reload(false);
    const offline = await p1.eval(`
      const before = APP.getRecord().basic.chiefComplaint;
      APP.getRecord().basic.chiefComplaint = '断网继续编辑';
      const ok = await APP._test.saveCurrentAwait();
      return { app: typeof APP !== 'undefined', ok, text: APP.getRecord().basic.chiefComplaint, before };
    `);
    check('B04 断网重启后能打开并继续编辑', offline.app && offline.ok && offline.text === '断网继续编辑', JSON.stringify(offline));

    // 恢复服务器，准备 B05
    const server2 = await startServer();
    await sleep(200);
    const other = await p1.eval(`
      const c = await caches.open('other-app-v1');
      await c.put('./other.txt', new Response('other app', { headers: { 'Content-Type': 'text/plain' } }));
      const old = await caches.open('dabingli-v2');
      await old.put('./index.html', new Response('old', { headers: { 'Content-Type': 'text/html' } }));
      return { other: await caches.has('other-app-v1'), old: await caches.has('dabingli-v2') };
    `);

    // B05：换一个 sw.js 字节触发安装/激活，旧的本应用缓存应被清理，其他应用缓存保留
    state.mode = 'ok';
    state.swVersion = 2;
    const swUpdate = await p1.eval(`
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return { ok: false };
      let changed = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { changed = true; });
      await reg.unregister();
      reg = await navigator.serviceWorker.register('./sw.js');
      let gone = false;
      for (let i = 0; i < 200; i++) {
        await new Promise(r => setTimeout(r, 100));
        gone = !(await caches.has('dabingli-v2'));
        if (gone && reg.active && reg.active.state === 'activated') { changed = true; break; }
      }
      return {
        gone,
        ok: true, changed,
        installing: reg.installing && reg.installing.state,
        waiting: reg.waiting && reg.waiting.state,
        active: reg.active && reg.active.state,
        keys: await caches.keys(),
        other: await caches.has('other-app-v1'),
        old: await caches.has('dabingli-v2'),
        current: await caches.has('dabingli-v3')
      };
    `);
    check('B05 激活新版本保留同源其他应用缓存', other.other && swUpdate.other === true, JSON.stringify(swUpdate));
    check('B05 激活新版本清理本应用旧缓存', other.old && swUpdate.old === false, JSON.stringify(swUpdate));
    check('B05 当前版本缓存仍存在', swUpdate.current === true, JSON.stringify(swUpdate));

    // B06：更新缓存期间关闭标签页，再断网启动不应残缺
    state.mode = 'slow';
    p1.send('Page.reload', { ignoreCache: true }).catch(() => {});
    await sleep(300);
    p1.close();
    await closeTarget(p1.targetId);
    pages = pages.filter(p => p !== p1);
    await sleep(300);

    state.mode = '500';
    const p2 = await newPage('sw2');
    pages.push(p2);
    await p2.goto(url);
    const cached = await p2.eval(`
      const res = await caches.match('./index.html');
      const text = res ? await res.text() : '';
      return { app: typeof APP !== 'undefined', len: text.length, bytes: new Blob([text]).size, complete: /<\\/html>\\s*$/.test(text), hasApp: text.indexOf('大病历生成器') >= 0 };
    `);
    check('B06 更新中断后断网启动仍是完整页面', cached.app && cached.complete && cached.hasApp && cached.bytes > 1000000, JSON.stringify(cached));

    server2.close();
  } catch (e) {
    check('离线脚本执行', false, e.message);
  } finally {
    for (const p of pages) p.close();
    chrome.kill();
    try { server.close(); } catch (e) { /* ignore */ }
  }

  console.log(`\n${results.filter(r => r.ok).length}/${results.length} 通过`);
  if (errors.length) {
    console.log('失败项：' + errors.join('、'));
    process.exit(1);
  }
}

main();
