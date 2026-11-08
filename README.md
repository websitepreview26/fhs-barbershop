# Fucking Stylish Haircut — booking prototype

Live site: https://websitepreview26.github.io/fhs-barbershop/

Static HTML/CSS/JavaScript, no build or dependencies. Serve this directory over HTTP(S), or open index.html for a basic local preview.

## Current architecture: v9

One fixed-height flex application shell contains three normal-flow siblings: header, a single overflow-y:auto scroll view, and action bar. The document itself never scrolls. The header/action bar are not sticky or fixed; they remain visible because only the middle sibling scrolls. The action bar does not cover the final row of content.

There are no CSS blur filters, transformed screen layers, cloned DOM trees, gesture-time layout reads, animation timers, or global touch handlers. History stores only route names and scroll offsets. Edge-back uses passive pointerdown/up/cancel listeners scoped to the content view. CSS pan-y gives vertical gestures to WebKit; short/vertical/cancelled gestures do not navigate. Browser and Telegram Back buttons use the same route history. Native dialog handles modal focus and scrolling, without custom animation layers.

The official Telegram SDK is vendored unchanged at assets/telegram-web-app.js (downloaded from https://telegram.org/js/telegram-web-app.js on 2026-11-08). It owns viewport/safe-area updates. The app calls ready once after deferred application scripts run and disables Telegram's content-level vertical minimize gesture on supported clients. It does not request fullscreen, expand the viewport, repeatedly request insets, or infer toolbar heights. Header spacing combines the maximum of browser/Telegram device insets with Telegram content insets. SDK and app scripts are deferred; a dark HTML background is available before scripts/styles load.

## Functionality and data

Master → services → date/time → review and contacts. Includes specialist profiles and real review excerpts, price/duration totals, contact validation, local demo-booking storage, rescheduling, cancellation and calendar export. Appointments are demonstrations stored in localStorage (`fhs-bookings-v2`), not real YCLIENTS bookings; SMS and email are not sent.

All five specialists, photographs and review counts were checked against https://b125329.yclients.com/ on 2026-11-08. Long comments are short excerpts; each profile links to the full original list. Leonid's services/prices were taken from supplied screenshots. Other specialists' prices and all availability remain demonstration data. Address/contact/opening hours were taken from supplied screenshots.

## Validation

Run `node --test tests/*.test.cjs`. Coverage includes booking persistence, form/scroll preservation, browser navigation, edge gesture cancellation/completion, 200 repeat routes without DOM cloning, modal lifecycle, and protection against native request/viewport feedback loops. Browser validation is separate from these tests. Real Telegram WKWebView behavior cannot be established by mocked host tests alone.

## Telegram Mini App

Use the HTTPS site URL for the bot's app button. Real bookings require a backend, YCLIENTS integration, verified Telegram initData, authoritative availability and atomic reservation. Keep all integration secrets off the frontend.
