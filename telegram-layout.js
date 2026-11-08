'use strict';
(() => {
  const root = document.documentElement;
  const telegram = window.Telegram;
  const app = telegram?.WebApp;
  const bridge = telegram?.WebView;
  const edges = ['top', 'right', 'bottom', 'left'];
  const nativeEvents = [];
  const receivedNative = {system: false, content: false};
  const system = {};
  const content = {};
  // Insets are display measurements only; never read initData or user data.
  const embedded = Boolean(app && ((typeof app.platform === 'string' && app.platform !== 'unknown') || bridge?.initParams?.tgWebAppPlatform));
  const supported = embedded && Boolean(app.isVersionAtLeast?.('8.0'));

  function apply(kind, input) {
    if (!input || typeof input !== 'object') return;
    const current = kind === 'system' ? system : content;
    for (const edge of edges) {
      const value = input[edge];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
      current[edge] = value;
      root.style.setProperty(`--host-${kind}-safe-${edge}`, `${value}px`);
    }
    updateDiagnostics();
  }

  function sync() {
    if (!receivedNative.system) apply('system', app?.safeAreaInset);
    if (!receivedNative.content) apply('content', app?.contentSafeAreaInset);
  }

  function requestInsets() {
    if (!supported || !bridge?.postEvent) return;
    bridge.postEvent('web_app_request_safe_area', false);
    bridge.postEvent('web_app_request_content_safe_area', false);
  }

  // Subscribe before calling ready/expand: iOS may answer synchronously.
  for (const [event, kind] of [['safe_area_changed', 'system'], ['content_safe_area_changed', 'content']]) {
    bridge?.onEvent?.(event, (_eventType, data) => {
      receivedNative[kind] = true;
      nativeEvents.push(event);
      if (nativeEvents.length > 8) nativeEvents.shift();
      apply(kind, data);
    });
  }
  app?.onEvent?.('safeAreaChanged', () => apply('system', app.safeAreaInset));
  app?.onEvent?.('contentSafeAreaChanged', () => apply('content', app.contentSafeAreaInset));
  app?.onEvent?.('viewportChanged', event => {
    if (event?.isStateStable === false) return;
    sync();
    requestInsets();
  });
  for (const event of ['fullscreenChanged', 'activated']) {
    app?.onEvent?.(event, () => { sync(); requestInsets(); });
  }
  root.dataset.telegram = String(embedded);
  sync();

  function start() {
    if (embedded) {
      app.ready?.();
      app.expand?.();
      requestInsets();
    }
    showDiagnostics();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();

  function diagnosticSnapshot() {
    const header = document.querySelector('.header');
    return {
      build: 'telegram-layout-v7',
      platform: app?.platform ?? 'browser',
      version: app?.version ?? null,
      embedded,
      safeAreasSupported: supported,
      fullscreen: Boolean(app?.isFullscreen),
      system: {...system},
      content: {...content},
      nativeEvents: [...nativeEvents],
      headerPaddingTop: header ? getComputedStyle(header).paddingTop : null
    };
  }

  function showDiagnostics() {
    if (!new URLSearchParams(location.search).has('layout-debug')) return;
    const panel = document.createElement('details');
    panel.id = 'layout-diagnostics';
    panel.open = true;
    const title = document.createElement('summary');
    title.textContent = 'Проверка отступов Telegram';
    const data = document.createElement('pre');
    panel.append(title, data);
    document.querySelector('#content')?.after(panel);
    updateDiagnostics();
  }

  function updateDiagnostics() {
    const data = document.querySelector('#layout-diagnostics pre');
    if (data) requestAnimationFrame(() => { data.textContent = JSON.stringify(diagnosticSnapshot(), null, 2); });
  }
})();
