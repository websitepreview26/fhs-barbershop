const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'telegram-layout.js'), 'utf8');

function boot({platform = 'ios', telegram = true, readyState = 'loading'} = {}) {
  let readyCalls = 0, nativeRequests = 0, styleWrites = 0;
  const events = {}, lifecycle = {};
  const viewportChanged = () => events.viewportChanged?.({isStateStable: true});
  const app = {
    platform, safeAreaInset: {top: 47}, contentSafeAreaInset: {top: 54},
    isVersionAtLeast: () => true,
    onEvent: (name, callback) => { events[name] = callback; },
    ready() { readyCalls++;viewportChanged(); },
    expand: viewportChanged
  };
  const bridge = {
    onEvent() {},
    postEvent() {
      if (++nativeRequests > 100) throw Error('Native request/viewport feedback loop');
      viewportChanged();
    }
  };
  const document = {
    readyState,
    documentElement: {dataset: {}, style: {setProperty() { styleWrites++; }}},
    querySelector: () => null,
    addEventListener(name, callback) { lifecycle[name] = callback; }
  };
  vm.runInNewContext(source, {window: telegram ? {Telegram: {WebApp: app, WebView: bridge}} : {}, document});
  return {start: lifecycle.DOMContentLoaded, viewportChanged, counts: () => ({readyCalls, nativeRequests, styleWrites})};
}

test('native responses to viewport events cannot cause a request feedback loop', () => {
  const env = boot();env.start();
  for (let i = 0; i < 1000; i++) env.viewportChanged();
  assert.deepEqual(env.counts(), {readyCalls: 1, nativeRequests: 0, styleWrites: 0});
});

test('initializes once when DOM is already ready', () => {
  const env = boot({readyState: 'complete'});
  assert.deepEqual(env.counts(), {readyCalls: 1, nativeRequests: 0, styleWrites: 0});
});

test('normal browsers do not call native methods', () => {
  for (const options of [{platform: 'unknown'}, {telegram: false}]) {
    const env = boot(options);
    env.start?.();
    assert.deepEqual(env.counts(), {readyCalls: 0, nativeRequests: 0, styleWrites: 0});
  }
});
