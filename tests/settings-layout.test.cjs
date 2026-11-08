const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const css = read('src/style.css');
const html = read('src/index.html');
const native = read('android/app/src/main/java/com/xjb/bingli/MainActivity.java');

test('APK packages the legacy source, including its settings layout', () => {
  const gradle = read('android/app/build.gradle');
  const build = read('build.js');
  assert.match(gradle, /tasks\.register\('buildWeb', Exec\)[^\n]*'node', 'build\.js'/);
  assert.match(gradle, /preBuild[^\n]*dependsOn 'buildWeb'/);
  assert.match(build, /const SRC = path\.join\(__dirname, 'src'\)/);
  assert.match(build, /'android', 'app', 'src', 'main', 'assets'/);
  assert.match(native, /web\.loadUrl\(ORIGIN \+ "\/assets\/index\.html"\)/);
  const asset = read('android/app/src/main/assets/index.html');
  assert.ok(asset.includes(css), 'APK asset must contain the current legacy stylesheet');
  assert.ok(asset.includes('class="settings-page"'));
});

test('Android owns bars, cutout and keyboard insets once; browsers retain safe areas', () => {
  assert.match(native, /WindowCompat\.setDecorFitsSystemWindows\(getWindow\(\), false\)/);
  assert.match(native, /ViewCompat\.setOnApplyWindowInsetsListener\(root/);
  assert.match(native, /getInsets\(WindowInsetsCompat\.Type\.systemBars\(\)\s*\| WindowInsetsCompat\.Type\.displayCutout\(\)\s*\| WindowInsetsCompat\.Type\.ime\(\)\)/);
  assert.match(native, /setPadding\(safe\.left, safe\.top, safe\.right, safe\.bottom\)/);
  assert.match(native, /return WindowInsetsCompat\.CONSUMED/);
  assert.doesNotMatch(native, /return insets;|getSystemWindowInset/);
  assert.match(native, /ViewCompat\.requestApplyInsets\(root\)/);

  const firstScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.ok(html.indexOf(firstScript) < html.indexOf('<style>'), 'ownership is set before first paint');
  for (const android of [false, true]) {
    const classes = new Set();
    vm.runInNewContext(firstScript, {
      window: android ? { BingliAndroid: {} } : {},
      document: { documentElement: { classList: { add: name => classes.add(name) } } },
    });
    assert.equal(classes.has('native-insets'), android);
  }
  assert.match(css, /:root\.native-insets\s*\{\s*--safe-top: 0px;\s*--safe-bottom: 0px;/);
  assert.match(css, /--safe-top: env\(safe-area-inset-top, 0px\)/);
  assert.match(css, /--safe-bottom: env\(safe-area-inset-bottom, 0px\)/);
  // All consumers share ownership, rather than bypassing it with direct env().
  assert.equal((css.match(/env\(safe-area-inset-/g) || []).length, 2);
  assert.match(css, /padding: calc\(12px \+ var\(--safe-top\)\) 18px 10px/);
});

test('settings hides the editor footer without keeping its spacer or creating a scroller', () => {
  assert.match(css, /body\.settings-view footer\s*\{ display: none;/);
  const mainRules = [...css.matchAll(/body\.settings-view main\s*\{([^}]+)\}/g)];
  assert.ok(mainRules.length > 0);
  for (const [, rule] of mainRules) {
    assert.match(rule, /padding-bottom: calc\(20px \+ var\(--safe-bottom\)\)/);
    assert.doesNotMatch(rule, /footer-height|96px/);
  }
  // Include generic ancestor rules and media-query overrides, not only settings-view.
  for (const [, selector, rule] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selector.split(',').some(s => /^(?:html|body|html, body|main|body\.settings-view main|\.settings-page|\.settings-card)$/.test(s.trim()))) {
      assert.doesNotMatch(rule, /(?:^|;)\s*(?:(?:min-|max-)?height\s*:|overflow(?:-y|-x)?\s*:\s*(?:auto|scroll|hidden))/);
    }
  }
  assert.match(css, /\.settings-page > \.settings-card\s*\{ margin: 0;/);
  assert.match(css, /\.settings-page\s*\{[^}]*display: grid;[^}]*gap: 14px;/);
});

test('settings controls avoid inherited auto margins and can wrap at larger font sizes', () => {
  assert.match(css, /\.settings-scale\s*\{[^}]*grid-template-columns: 48px minmax\(56px, auto\) 48px/);
  assert.match(css, /\.settings-scale \.btn\s*\{[^}]*margin: 0;/);
  assert.match(css, /\.settings-actions\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.settings-actions \.btn\s*\{[^}]*min-width: 0;[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
  assert.match(css, /\.settings-actions \[data-settings-action="exportCurrentBackup"\],[^}]*grid-column: 1 \/ -1/);
  assert.match(css, /body\.large-font \.settings-actions\s*\{ grid-template-columns: minmax\(0, 1fr\)/);
});
