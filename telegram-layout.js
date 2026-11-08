'use strict';
// Telegram owns viewport/safe-area notifications. The app never requests them
// from resize callbacks, changes fullscreen mode, or writes their measurements.
(() => {
  const app = window.Telegram?.WebApp;
  if (!app || app.platform === 'unknown') return;
  function start() {
    // Let the app's single native scroll view own vertical content gestures.
    if (app.isVersionAtLeast?.('7.7')) app.disableVerticalSwipes?.();
    app.ready();
  }
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
