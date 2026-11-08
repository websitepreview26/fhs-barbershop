const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'telegram-layout.js'), 'utf8');

function boot({platform = 'ios', supported = true, telegram = true} = {}) {
  const css = new Map(), native = {}, appEvents = {}, lifecycle = {}, calls = [];
  const root = {dataset: {}, style: {setProperty: (key, value) => css.set(key, value)}};
  const app = {
    platform, version: '9.1',
    safeAreaInset: {top: 0, left: 0, right: 0, bottom: 0},
    contentSafeAreaInset: {top: 0, left: 0, right: 0, bottom: 0},
    isVersionAtLeast: () => supported,
    onEvent: (name, callback) => { appEvents[name] = callback; },
    ready() {
      calls.push('ready');
      // Native iOS can reply during initialization, before first render.
      if (supported) {
        native.safe_area_changed('safe_area_changed', {top: 47, bottom: 34});
        native.content_safe_area_changed('content_safe_area_changed', {top: 54});
      }
    },
    expand() { calls.push('expand'); }
  };
  const bridge = {
    onEvent: (name, callback) => { native[name] = callback; },
    postEvent: name => calls.push(name)
  };
  const document = {
    readyState: 'loading', documentElement: root,
    querySelector: () => null,
    addEventListener: (name, callback) => { lifecycle[name] = callback; }
  };
  vm.runInNewContext(source, {window: telegram ? {Telegram: {WebApp: app, WebView: bridge}} : {}, document, URLSearchParams, location: {search: ''}, requestAnimationFrame: fn => fn()});
  return {css, native, appEvents, root, calls, app, ready: lifecycle.DOMContentLoaded};
}

test('receives synchronous native insets during ready, then requests both safe areas', () => {
  const env = boot();
  env.ready();
  assert.equal(env.css.get('--host-system-safe-top'), '47px');
  assert.equal(env.css.get('--host-content-safe-top'), '54px');
  assert.deepEqual(env.calls, ['ready', 'expand', 'web_app_request_safe_area', 'web_app_request_content_safe_area']);
});

test('raw native measurements survive a stable viewport event when SDK getters lag', () => {
  const env = boot();env.ready();
  env.appEvents.viewportChanged({isStateStable: true});
  assert.equal(env.css.get('--host-content-safe-top'), '54px');
  assert.equal(env.css.get('--host-system-safe-top'), '47px');
});

test('rotation, fullscreen exit, explicit zero, and invalid/partial data', () => {
  const env = boot();env.ready();
  env.native.safe_area_changed('safe_area_changed', {top: 0, left: 47});
  env.native.content_safe_area_changed('content_safe_area_changed', {top: 28, left: 0});
  assert.equal(env.css.get('--host-system-safe-top'), '0px');
  assert.equal(env.css.get('--host-system-safe-left'), '47px');
  env.native.content_safe_area_changed('content_safe_area_changed', {top: -1, right: NaN});
  assert.equal(env.css.get('--host-content-safe-top'), '28px');
  env.native.content_safe_area_changed('content_safe_area_changed', {top: 0});
  assert.equal(env.css.get('--host-content-safe-top'), '0px');
  assert.equal(env.css.get('--host-system-safe-bottom'), '34px');
});

test('does not request unsupported APIs in old clients or outside Telegram', () => {
  for (const options of [{supported: false}, {platform: 'unknown'}, {telegram: false}]) {
    const env = boot(options);env.ready();
    assert(!env.calls.some(name => name.startsWith('web_app_request_')));
  }
});

test('public WebApp events update current values without requiring raw events', () => {
  const env = boot();
  env.app.contentSafeAreaInset = {top: 60};
  env.appEvents.contentSafeAreaChanged();
  assert.equal(env.css.get('--host-content-safe-top'), '60px');
});
