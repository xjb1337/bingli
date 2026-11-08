/* Offline browser layout regression. First run `node build.js`.
 * CLI writes a self-contained Playwright probe for an existing browser tool:
 *   node tools/verify-ai-layout.cjs tmp-review/ai-probe.js /absolute/screenshot-dir
 * Or require this module and call checkAiLayout(page, assetUrl, output).
 * Uses installed Chrome/CDP, synthetic data, and local build output only.
 * No browser download, server, API call, or real patient data is required.
 */
async function checkAiLayout(page, assetUrl, output) {
  const tab = await page.context().newPage();
  const session = await tab.context().newCDPSession(tab);
  const cdp = (method, params = {}) => session.send(method, params);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const equal = (actual, expected) => { if (actual !== expected) throw Error(`Expected ${expected}, got ${actual}`); };
  const checks = [], errors = [], failures = [];
  tab.on('pageerror', error => errors.push(String(error)));
  await tab.route(/^https?:/, route => { errors.push('Unexpected network: ' + route.request().url()); return route.abort(); });
  try {
    const ev = async code => {
      const r = await cdp('Runtime.evaluate', {expression: `(async () => {${code}})()`, returnByValue: true, awaitPromise: true});
      if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    const settle = () => ev(`
      await document.fonts.ready;
      let previous = '', stable = 0;
      for (let frame = 0; frame < 30 && stable < 5; frame++) {
        await new Promise(r => requestAnimationFrame(r));
        const p = document.querySelector('.ai-page');
        const next = [document.documentElement.scrollHeight, p?.getBoundingClientRect().height,
          p && getComputedStyle(p).fontSize, document.querySelector('.ai-heading')?.getBoundingClientRect().height].join();
        stable = next === previous ? stable + 1 : 0; previous = next;
      }
    `);
    await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
    await cdp('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}, {name: 'prefers-color-scheme', value: 'light'}]});
    await cdp('Page.navigate', {url: assetUrl});
    for (let i = 0; i < 100; i++) {
      if (await ev('return typeof APP !== "undefined" && !!APP.getRecord();')) break;
      if (i === 99) throw Error('App did not initialize');
      await delay(50);
    }
    await ev(`localStorage.clear(); window.confirm = () => true;
      window.BingliAndroid = {
        aiStatus: () => JSON.stringify({configured: true, model: 'deepseek-flash'}),
        aiSettings() {}, aiCancel(id) { window.__canceled = id; },
        aiRequest(id, payload) { window.__wire = {id, payload: JSON.parse(payload)}; }
      };
      window.__safe = document.createElement('style');
      __safe.textContent = ':root { --safe-top: 28px; --safe-bottom: 24px; }';
      document.head.append(__safe);
      window.__file = (() => {
        const canvas = document.createElement('canvas'); canvas.width = 420; canvas.height = 560;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#f6fbf9'; ctx.fillRect(0, 0, 420, 560);
        ctx.fillStyle = '#17332d'; ctx.font = '24px sans-serif';
        ['合成测试病历', '性别：女', '主诉：咳嗽3天', '无发热，既往有高血压。', '用药情况待核实。', '仅供布局验证'].forEach((line, i) => ctx.fillText(line, 24, 60 + i * 65));
        return fetch(canvas.toDataURL('image/png')).then(r => r.blob()).then(b => new File([b], 'synthetic-record.png', {type: 'image/png'}));
      })();`);
    const measure = async (state, config) => {
      await settle();
      const m = await ev(`
        const page = document.querySelector('.ai-page');
        const style = el => getComputedStyle(el);
        const visible = [...page.querySelectorAll('*')].filter(el => el.getClientRects().length && el.clientHeight);
        const label = el => el.id || el.className || el.tagName;
        const outside = visible.filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(label);
        const clipped = visible.filter(el => !['TEXTAREA','SELECT','INPUT','SVG','PATH'].includes(el.tagName) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(label);
        const scrollers = [page, ...visible].filter(el => el.tagName !== 'TEXTAREA' && /auto|scroll/.test(style(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(label);
        const smallButtons = visible.filter(el => ['BUTTON','SUMMARY'].includes(el.tagName) && el.getBoundingClientRect().height < 44).map(label);
        const heading = page.querySelector('.ai-heading');
        return {width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          outside, clipped, scrollers, smallButtons, pagePosition: style(page).position,
          headingHeight: heading.getBoundingClientRect().height, headingTopPadding: style(heading).paddingTop,
          pageBottomPadding: style(page).paddingBottom, background: style(heading).backgroundColor,
          footerHidden: style(document.querySelector('footer')).display === 'none',
          editorHidden: style(document.querySelector('#content')).display === 'none',
          headerHidden: style(document.querySelector('body > header')).display === 'none',
          compareColumns: page.querySelector('.ai-compare') ? style(page.querySelector('.ai-compare')).gridTemplateColumns.split(' ').length : null,
          shortLabelWidth: page.querySelector('.ai-suggestion strong')?.getBoundingClientRect().width,
          fontSize: style(page).fontSize};
      `);
      await ev('scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"});'); await settle();
      await ev('scrollTo({top: document.documentElement.scrollHeight, behavior: "instant"});'); await settle();
      const tail = await ev(`const p = document.querySelector('.ai-page'), last = document.querySelector('#aiUndo');
        return {scroll: document.scrollingElement.scrollTop, pageScroll: p.scrollTop,
          lastBottom: last.getBoundingClientRect().bottom, height: innerHeight,
          bottomGap: p.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom};`);
      await ev('scrollTo({top: 300, behavior: "instant"});'); await settle();
      const sticky = await ev('return document.querySelector(".ai-heading").getBoundingClientRect().top;');
      const pass = m.width === m.scrollWidth && !m.outside.length && !m.clipped.length && !m.scrollers.length && !m.smallButtons.length
        && Math.abs(parseFloat(m.fontSize) - 16 * config.scale) < .1
        && m.pagePosition === 'static' && m.footerHidden && m.editorHidden && m.headerHidden
        && m.headingTopPadding === (config.native ? '10px' : '38px')
        && m.pageBottomPadding === (config.native ? '24px' : '48px')
        && (!m.compareColumns || m.compareColumns === 1)
        && (!m.shortLabelWidth || m.shortLabelWidth > 60)
        && tail.scroll > 0 && tail.pageScroll === 0 && tail.lastBottom <= tail.height && tail.bottomGap >= (config.native ? 24 : 48)
        && Math.abs(sticky) < 1;
      const item = {state, ...config, pass, ...m, tail, sticky}; checks.push(item);
      if (!pass) failures.push(item);
    };
    const shot = async (name, target, full = false) => {
      if (target === '.ai-heading') await ev('scrollTo({top: 0, behavior: "instant"});');
      else await ev(`document.querySelector(${JSON.stringify(target)}).scrollIntoView({block: 'start', behavior: 'instant'});`);
      await settle();

      if (full) {
        await ev('scrollTo({top: 0, behavior: "instant"});'); await settle();

      }
      await tab.screenshot({path: output + '/' + name, fullPage: full});
    };
    const configs = [
      ...[320, 360, 375, 390, 430].flatMap(width => [1, 1.4, 2].map(scale => ({width, height: 800, scale, native: true}))),
      {width: 667, height: 375, scale: 1.4, native: true},
      {width: 375, height: 800, scale: 1.4, native: false},
    ];
    for (const config of configs) {
      await cdp('Emulation.setDeviceMetricsOverride', {width: config.width, height: config.height, deviceScaleFactor: 1, mobile: true});
      await ev(`AI_ASSIST.close(true); document.documentElement.classList.toggle('native-insets', ${config.native});
        document.documentElement.style.setProperty('--fs-scale', ${JSON.stringify(String(config.scale))});
        document.body.classList.toggle('large-font', ${config.scale > 1.05});
        const r = SCHEMA.emptyRecord(); r.id = 'ai-layout-synthetic'; APP._test.setRecord(r); APP._test.render();
        // render applies the persisted scale; restore the scenario after rendering.
        document.documentElement.style.setProperty('--fs-scale', ${JSON.stringify(String(config.scale))});
        document.body.classList.toggle('large-font', ${config.scale > 1.05});
        document.querySelector('#btnAi').focus(); window.__returnScroll = scrollY;
        document.querySelector('#btnAi').click();
        document.querySelector('#aiOperation').value = 'recognize'; document.querySelector('#aiOperation').dispatchEvent(new Event('change'));
        document.querySelector('#aiRecognizeText').value = '患者诉咳嗽3天，无发热。既往有高血压，用药情况待核实。';
        const dt = new DataTransfer(); dt.items.add(await __file);
        document.querySelector('#aiGalleryInput').files = dt.files;
        document.querySelector('#aiGalleryInput').dispatchEvent(new Event('change'));`);
      for (let i = 0; i < 100; i++) {
        if (await ev('return !document.querySelector("#aiImagePreview").hidden;')) break;
        if (i === 99) throw Error('Image compression failed');
        await delay(30);
      }
      const shots = config.width === 375 && config.scale === 1 && config.native;
      await measure('input', config);
      if (shots) { await shot('01-input.png', '.ai-heading'); await shot('01-input-full.png', '.ai-heading', true); }
      await ev('document.querySelector("#aiPrepare").click();');
      await measure('confirm', config);
      if (shots) { await shot('02-confirm.png', '#aiPreview'); await shot('02-confirm-full.png', '#aiPreview', true); }
      await ev('document.querySelector("#aiConsent").click(); document.querySelector("#aiSend").click();');
      await measure('generating', config);
      equal(await ev('return document.querySelector(".ai-page").getAttribute("aria-busy");'), 'true');
      if (shots) await shot('03-generating.png', '#aiStatus');
      await ev(`AI_ASSIST.receive(__wire.id, {ok: true, model: 'deepseek-flash', content: {
        suggestions: [
          {path: 'basic.gender', text: '女', evidence: [{source: 'image', quote: '性别：女'}]},
          {path: 'hpi.symptoms', text: '患者诉咳嗽3天，无发热。', evidence: [{source: 'note', quote: '患者诉咳嗽3天，无发热。'}]}
        ], issues: [{path: 'pmh.diseaseDetail', message: '高血压病程与长期用药情况需核实。'}],
        questions: ['请补问具体用药名称、剂量及频次。']
      }});`);
      equal(await ev('return document.querySelectorAll(".ai-suggestion").length;'), 2);
      await measure('result', config);
      if (shots) { await shot('04-result.png', '#aiStatus'); await shot('04-result-full.png', '#aiResult', true); await shot('05-issues.png', '#aiResult > ul'); }
      if (config.width === 320 && config.scale === 2) await shot('06-result-320-200pct.png', '#aiResult');
      if (config.width === 667) await shot('07-result-landscape.png', '#aiResult');
      if (!config.native) await shot('08-result-safe-area.png', '#aiResult');
      await ev('APP.handleBack();');
      equal(await ev('return document.body.classList.contains("ai-view");'), false);
      equal(await ev('return getComputedStyle(document.querySelector("footer")).display !== "none";'), true);
      equal(await ev('return document.activeElement.id;'), 'btnAi');
      equal(await ev('return scrollY === __returnScroll;'), true);
    }
    // Opening from settings must not inherit its main padding or lose its return route.
    await ev('document.documentElement.classList.add("native-insets"); APP._test.openSettings(); document.querySelector("#btnAi").click();');
    await measure('settings-input', {width: 375, height: 800, scale: 1.4, native: true});
    equal(await ev('return getComputedStyle(document.querySelector(".ai-page")).paddingTop;'), '0px');
    await ev('APP.handleBack();');
    equal(await ev('return APP._test.isSettingsView();'), true);
    equal(await ev('return document.body.classList.contains("ai-view");'), false);
    await ev('APP.handleBack();');
    equal(await ev('return APP._test.isSettingsView();'), false);
    // The same result remains readable in dark mode, with an opaque sticky header.
    await cdp('Emulation.setEmulatedMedia', {features: [{name: 'prefers-color-scheme', value: 'dark'}, {name: 'prefers-reduced-motion', value: 'reduce'}]});
    await ev('document.documentElement.classList.add("native-insets"); AI_ASSIST.open();');
    await shot('09-dark-input.png', '.ai-heading');
    await ev('AI_ASSIST.close(true);');
    return {pass: checks.every(check => check.pass) && !errors.length, cases: checks.length, errors, failures, checks};
  } finally {
    await session.detach();
    await tab.close();
  }
}
module.exports = checkAiLayout;
if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const {pathToFileURL} = require('node:url');
  const probe = path.resolve(process.argv[2] || 'tmp-review/ai-probe.js');
  const output = path.resolve(process.argv[3] || 'tmp-review/ai-page');
  fs.mkdirSync(output, {recursive: true});
  fs.mkdirSync(path.dirname(probe), {recursive: true});
  const url = pathToFileURL(path.resolve(__dirname, '../android/app/src/main/assets/index.html')).href;
  fs.writeFileSync(probe, `async (page) => (${checkAiLayout.toString()})(page, ${JSON.stringify(url)}, ${JSON.stringify(output)})\n`);
  console.log(probe);
}
