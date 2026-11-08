/*
 * 离线浏览器量测：先 node build.js，再运行本脚本生成 Playwright 可执行函数。
 * 将输出的文件交给已有的 browser_run_code 工具，或在已有 Playwright 中调用：
 *   const probe = require('./tools/verify-settings-layout.cjs');
 *   const result = await probe(page, fs.readFileSync(assetPath, 'utf8'));
 * 不下载浏览器、不监听端口。拦截测试域名，仅载入本地 APK HTML。
 */
async function checkSettingsLayout(page, html) {
  const results = [];
  const errors = [];
  const simulatedSafeAreas = [];
  for (const native of [false, true]) {
    const tab = await page.context().newPage();
    try {
      tab.on('pageerror', error => errors.push(String(error)));
      await tab.route('**/*', route => route.fulfill({
        contentType: 'text/html; charset=utf-8', body: html,
      }));
      await tab.addInitScript(isNative => {
        localStorage.clear();
        if (isNative) window.BingliAndroid = { versionName: () => '布局测试', checkUpdates() {} };
      }, native);
      await tab.goto('http://bingli-layout.test/index.html');
      await tab.locator('#btnSettings').click();
      for (const width of [360, 390, 430]) {
        await tab.setViewportSize({ width, height: 844 });
        for (const scale of [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1]) {
          // Exercise real event handlers, including reset at the end of each width.
          let current = Number((await tab.locator('.settings-scale-value').textContent()).replace('%', ''));
          if (scale === 1 && current === 140) {
            await tab.locator('[data-settings-action="resetFont"]').click();
          } else {
            let clicks = 0;
            while (Math.abs(current - scale * 100) > 1) {
              if (++clicks > 8) throw Error('字号按钮没有按预期改变字号');
              await tab.locator(`[data-setting-font="${current < scale * 100 ? 'up' : 'down'}"]`).click();
              current = Number((await tab.locator('.settings-scale-value').textContent()).replace('%', ''));
            }
          }
          const measure = await tab.evaluate(() => {
            const main = document.querySelector('main');
            const last = document.querySelector('.settings-card:last-child');
            const style = el => getComputedStyle(el);
            const visible = [...document.querySelectorAll('header *, main *')].filter(el => el.getClientRects().length && el.clientHeight);
            const label = el => el.id || el.getAttribute('data-settings-action') || el.className || el.tagName;
            const clipped = visible.filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(label);
            const outside = visible.filter(el => {
              const r = el.getBoundingClientRect();
              return r.left < -1 || r.right > innerWidth + 1;
            }).map(label);
            const scrollers = visible.filter(el => /auto|scroll/.test(style(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(label);
            const buttons = [...document.querySelectorAll('.settings-page button')].map(el => ({
              text: el.textContent, height: el.getBoundingClientRect().height,
            }));
            const scaleItems = [...document.querySelector('.settings-scale').children].map(el => el.getBoundingClientRect());
            const cards = [...document.querySelectorAll('.settings-card')].map(el => el.getBoundingClientRect());
            return {
              width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
              topPadding: style(document.querySelector('.topbar')).paddingTop,
              bottomPadding: style(main).paddingBottom,
              tail: main.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom,
              cardGaps: cards.slice(1).map((r, i) => r.top - cards[i].bottom),
              scaleGaps: scaleItems.slice(1).map((r, i) => r.left - scaleItems[i].right),
              nativeClass: document.documentElement.classList.contains('native-insets'),
              footerDisplay: style(document.querySelector('footer')).display,
              scale: document.querySelector('.settings-scale-value').textContent,
              clipped, outside, scrollers, buttons,
              ua: navigator.userAgent,
            };
          });
          await tab.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
          const scrolling = await tab.evaluate(() => ({
            documentScroll: document.scrollingElement.scrollTop,
            mainScroll: document.querySelector('main').scrollTop,
            settingsScroll: document.querySelector('.settings-page').scrollTop,
            lastBottom: document.querySelector('.settings-card:last-child').getBoundingClientRect().bottom,
            height: innerHeight,
          }));
          const failure = measure.scrollWidth > width || measure.outside.length || measure.clipped.length
            || measure.scrollers.length || measure.tail !== 20 || measure.topPadding !== '12px'
            || measure.footerDisplay !== 'none' || measure.nativeClass !== native
            || measure.scale !== `${Math.round(scale * 100)}%`
            || measure.cardGaps.some(gap => gap !== 14) || measure.scaleGaps.some(gap => gap !== 8)
            || measure.buttons.some(button => button.height < 44)
            || scrolling.mainScroll || scrolling.settingsScroll || scrolling.documentScroll <= 0
            || scrolling.lastBottom > scrolling.height || scrolling.lastBottom < scrolling.height - 21;
          results.push({ native, scale, ...measure, scrolling, pass: !failure });
        }
      }
      // This browser cannot emulate physical cutouts. Inject nonzero CSS defaults
      // to verify ownership/cascade separately from actual Android inset delivery.
      const safeAreaStyle = await tab.addStyleTag({ content: ':root { --safe-top: 48px; --safe-bottom: 24px; }' });
      const safe = await tab.evaluate(() => ({
        top: getComputedStyle(document.querySelector('.topbar')).paddingTop,
        bottom: getComputedStyle(document.querySelector('main')).paddingBottom,
      }));
      const safePass = safe.top === (native ? '12px' : '60px') && safe.bottom === (native ? '20px' : '44px');
      simulatedSafeAreas.push({ native, ...safe, pass: safePass });
      await safeAreaStyle.evaluate(el => el.remove());
      // Settings footer hiding must be reversible when returning to the record.
      await tab.locator('[data-settings-action="back"]').click();
      if (await tab.locator('body').evaluate(el => el.classList.contains('settings-view'))) {
        throw Error('返回病历后仍是设置视图');
      }
      if (await tab.locator('footer').evaluate(el => getComputedStyle(el).display === 'none')) {
        throw Error('返回病历后底栏未恢复');
      }
    } finally {
      await tab.close();
    }
  }
  return { pass: errors.length === 0 && results.every(result => result.pass)
    && simulatedSafeAreas.every(result => result.pass), errors, simulatedSafeAreas, results };
}

module.exports = checkSettingsLayout;
if (require.main === module) {
  const fs = require('node:fs');
  const path = require('node:path');
  const os = require('node:os');
  const html = fs.readFileSync(path.join(__dirname, '../android/app/src/main/assets/index.html'), 'utf8');
  const output = process.argv[2] || path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bingli-layout-')), 'probe.js');
  fs.writeFileSync(output, `async (page) => (${checkSettingsLayout.toString()})(page, ${JSON.stringify(html)})\n`);
  console.log(output);
}
