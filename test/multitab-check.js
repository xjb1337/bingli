/* 真实双标签页验收（B01–B03）
 *
 * 用 Chrome headless + CDP 打开两个真实页面，共享同一 localStorage、
 * 各自独立 sessionStorage，验证：
 *   B01 两个标签页编辑不同病历，交替保存/刷新互不替换；
 *   B02 同一病历并发保存，一份成功、另一份明确冲突而不是静默覆盖；
 *   B03 第二标签页打开时，第一份还没进病历列表的草稿能找回。
 *
 * 用法：node test/multitab-check.js
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const PORT = 9333;
const HTTP_PORT = 8137;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function startServer() {
  const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url === '/' || url === '/index.html') {
      const body = fs.readFileSync(HTML);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(body);
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
    for (let i = 0; i < 80; i++) {
      await sleep(100);
      try {
        const ok = await this.eval('return document.readyState === "complete" && typeof APP !== "undefined" && !!APP.getRecord();');
        if (ok) return;
      } catch (e) { /* 还在加载 */ }
    }
    throw new Error(this.name + ' 页面没有就绪');
  }
  async reload() {
    await this.send('Page.reload', { ignoreCache: true });
    for (let i = 0; i < 80; i++) {
      await sleep(100);
      try {
        const ok = await this.eval('return document.readyState === "complete" && typeof APP !== "undefined" && !!APP.getRecord();');
        if (ok) return;
      } catch (e) { /* retry */ }
    }
    throw new Error(this.name + ' 刷新后没有就绪');
  }
}

async function newPage(name) {
  const target = await json(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  console.log('target', name, target.id, target.webSocketDebuggerUrl);
  const page = new Page(target.webSocketDebuggerUrl, name);
  await page.ready;
  return page;
}

async function main() {
  const server = await startServer();
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbl-multitab-'));
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

    const p1 = await newPage('p1');
    const p2 = await newPage('p2');
    pages = [p1, p2];
    await p1.eval('window.__marker = "p1"; return 1;');
    console.log('marker seen by p2:', await p2.eval('return window.__marker || "";'));
    const url = `http://127.0.0.1:${HTTP_PORT}/`;

    await p1.goto(url);
    await p1.eval('localStorage.clear(); sessionStorage.clear(); return true;');
    await p1.reload();

    // B01：两个标签页编辑不同病历，交替保存后互不替换
    await p1.eval(`
      APP.getRecord().basic.name = '患者A';
      APP.getRecord().basic.chiefComplaint = '咳嗽';
      await APP._test.saveCurrentAwait();
      return true;
    `);
    const idA = await p1.eval('return APP.getRecord().id;');
    check('B03 草稿未进入病历列表', await p1.eval('return APP._test.getList().length === 0;'));

    await p2.goto(url);
    const p2Start = await p2.eval('return APP.getRecord().basic.name;');
    check('B03 第二标签页能找回未入列表的草稿', p2Start === '患者A', `读到「${p2Start}」`);

    await p1.eval('return await APP._test.saveToLibrary();');
    const p2dbg = await p2.eval(`
      await APP._test.newRecord();
      const id0 = APP.getRecord().id;
      APP.getRecord().basic.name = '患者B';
      const name0 = APP.getRecord().basic.name;
      await APP._test.saveCurrentAwait();
      const name1 = APP.getRecord().basic.name;
      await APP._test.saveToLibrary();
      const name2 = APP.getRecord().basic.name;
      return { id0, name0, name1, name2, id: APP.getRecord().id };
    `);
    console.log('p2dbg', JSON.stringify(p2dbg));
    const idB = await p2.eval('return APP.getRecord().id;');

    const p1dbg = await p1.eval(`
      const before = { id: APP.getRecord().id, name: APP.getRecord().basic.name, n: window.name };
      APP.getRecord().basic.name = '患者A2';
      const mid = { id: APP.getRecord().id, name: APP.getRecord().basic.name, n: window.name };
      await APP._test.saveCurrentAwait();
      const after = { id: APP.getRecord().id, name: APP.getRecord().basic.name, n: window.name, rev: APP.getRecord().meta.revision };
      return { before, mid, after };
    `);
    console.log('p1dbg', JSON.stringify(p1dbg));

    console.log('state1', JSON.stringify(await p1.eval('return {n:window.name,id:APP.getRecord().id,rev:APP.getRecord().meta.revision,name:APP.getRecord().basic.name,keys:Object.keys(localStorage).filter(k=>k.indexOf("dabingli.draft")===0)};')));
    console.log('state2', JSON.stringify(await p2.eval('return {n:window.name,id:APP.getRecord().id,rev:APP.getRecord().meta.revision,name:APP.getRecord().basic.name,keys:Object.keys(localStorage).filter(k=>k.indexOf("dabingli.draft")===0)};')));
    await p2.reload();
    const p2Name = await p2.eval('return APP.getRecord().basic.name;');
    check('B01 不同病历交替保存：标签页 2 刷新后仍是自己的病历', p2Name === '患者B', `读到「${p2Name}」`);

    console.log('draftA before reload', await p1.eval(`return JSON.parse(localStorage.getItem('dabingli.draft.v1.${idA}')).basic.name;`));
    await p1.reload();
    console.log('p1 after reload', JSON.stringify(await p1.eval('return {n:window.name,id:APP.getRecord().id,name:APP.getRecord().basic.name,rev:APP.getRecord().meta.revision};')));
    const p1Name = await p1.eval('return APP.getRecord().basic.name;');
    check('B01 不同病历交替保存：标签页 1 刷新后仍是自己的病历', p1Name === '患者A2', `读到「${p1Name}」`);

    const stored = await p1.eval(`
      const a = localStorage.getItem('dabingli.draft.v1.${idA}');
      const b = localStorage.getItem('dabingli.draft.v1.${idB}');
      return { a: !!a, b: !!b };
    `);
    check('B01 两份草稿各自落盘', stored.a && stored.b, JSON.stringify(stored));

    // B02：同一病历并发保存，后写者必须收到冲突而不是覆盖
    const opened = await p2.eval(`
      const ids = APP._test.getList().map(x => x.id);
      const r = await APP._test.openRecord(${JSON.stringify(idA)});
      return { ids, r, id: APP.getRecord().id, name: APP.getRecord().basic.name };
    `);
    console.log('opened', JSON.stringify(opened));
    const baseRev = await p2.eval('return {rev:APP.getRecord().meta.revision,id:APP.getRecord().id,name:APP.getRecord().basic.name,conflict:!!APP._test.remoteConflict()};');
    console.log('p2 base', JSON.stringify(baseRev));

    const saves = await Promise.all([p1.eval(`
      APP.getRecord().basic.chiefComplaint = '甲改过的主诉';
      return await APP._test.saveCurrentAwait();
    `), p2.eval(`
      APP.getRecord().basic.chiefComplaint = '乙改过的主诉';
      return await APP._test.saveCurrentAwait();
    `)]);
    check('B02 同时发起保存只有一个成功', saves.filter(Boolean).length === 1, JSON.stringify(saves));
    const losingPage = saves[0] ? p2 : p1;
    // 冲突后「保留为副本」应生成独立病历，且不污染原病历
    const copy = await losingPage.eval(`
      document.querySelector('[data-act="keepCopy"]').click();
      const list = APP._test.getList();
      return { count: list.length, isArr: Array.isArray(list), keys: Object.keys(list), name: APP.getRecord().basic.name, id: APP.getRecord().id };
    `);
    check('B02 冲突后保留副本：生成独立病历', copy.count === 3 && copy.id !== idA && /副本/.test(copy.name), JSON.stringify(copy));
  } catch (e) {
    check('多标签页脚本执行', false, e.message);
  } finally {
    for (const p of pages) { try { p.ws.close(); } catch (e) {} }
    chrome.kill();
    server.close();
  }

  console.log(`\n${results.filter(r => r.ok).length}/${results.length} 通过`);
  if (errors.length) {
    console.log('失败项：' + errors.join('、'));
    process.exit(1);
  }
}

main();
