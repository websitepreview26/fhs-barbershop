'use strict';
// The official SDK owns safe-area requests, native subscriptions and --tg-*.
// Do not request native measurements from viewport/resize callbacks: some
// clients answer those requests with another viewport notification.
(() => {
  const app = window.Telegram?.WebApp;
  if (!app || app.platform === 'unknown') return;
  const ready = () => app.ready();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, {once: true});
  } else {
    ready();
  }
})();
