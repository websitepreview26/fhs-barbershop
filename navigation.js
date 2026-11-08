'use strict';
// One live scroll container. History stores routes and offsets, never DOM trees.
const scroller = document.querySelector('#app-scroll');
const telegramApp = window.Telegram?.WebApp;
let session = Date.now().toString(36), position = 0, pendingBack = false;
let routes = [{screen: state.screen, scroll: 0}];
window.history.replaceState({fhsSession: session, position: 0}, '');

function scrollContentTo(top) { scroller.scrollTop = top; }
function canNavigateBack() { return position > 0; }
function updateNativeBack() {
  const button = telegramApp?.BackButton;
  if (!button) return;
  if (canNavigateBack() || modal.open) button.show();
  else button.hide();
}
function rememberScreen(next) {
  if (state.screen === next) return;
  routes[position] = {screen: state.screen, scroll: scroller.scrollTop};
  routes.splice(position + 1);
  routes.push({screen: next, scroll: 0});
  position++;
  window.history.pushState({fhsSession: session, position}, '');
  pendingBack = false;
}
function navigateBack() {
  if (modal.open) { closeSheet(); return; }
  if (!canNavigateBack() || pendingBack) return;
  pendingBack = true;
  window.history.back();
}
function resetNavigation() {
  session = Date.now().toString(36) + Math.random().toString(36).slice(2);
  position = 0;
  routes = [{screen: 'masters', scroll: 0}];
  pendingBack = false;
  window.history.replaceState({fhsSession: session, position: 0}, '');
}
window.addEventListener('popstate', event => {
  capture();
  pendingBack = false;
  if (modal.open) closeSheet();
  if (event.state?.fhsSession !== session) {
    state.screen = 'masters';render();scrollContentTo(0);return;
  }
  const destination = routes[event.state.position];
  if (!destination) return;
  routes[position].scroll = scroller.scrollTop;
  position = event.state.position;
  state.screen = destination.screen;
  if (['services','date','details'].includes(state.screen) && !master()) state.screen = 'masters';
  if (['date','details'].includes(state.screen) && !picked().length) state.screen = 'services';
  if (state.screen === 'details' && (!state.date || !state.time)) state.screen = 'date';
  state.error = '';
  render();
  scrollContentTo(destination.scroll);
});

function openSheet() {
  const title = modal.querySelector('h2');
  if (title) {
    title.id = 'sheet-title';title.setAttribute('tabindex','-1');title.setAttribute('autofocus','');
    modal.setAttribute('aria-labelledby','sheet-title');
  }
  modal.showModal();
  title?.focus({preventScroll:true});
  modal.scrollTop = 0;
  updateNativeBack();
}
function closeSheet() {
  if (!modal.open) return;
  modal.close();
  updateNativeBack();
}
modal.addEventListener('cancel', event => { event.preventDefault();closeSheet(); });
modal.addEventListener('click', event => {
  if (event.target !== modal) return;
  const bounds = modal.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeSheet();
});

// CSS pan-y leaves vertical scrolling entirely to WebKit. No touchmove handler,
// preventDefault, pointer capture, document-wide gesture or compositing layers.
function attachEdgeBack(element, enabled, onBack) {
  let start = null;
  element.addEventListener('pointerdown', event => {
    start = null;
    if (!enabled() || !['touch','pen'].includes(event.pointerType) || !event.isPrimary) return;
    if (event.target.closest('input,textarea,select,[contenteditable=true]')) return;
    const bounds = element.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.left + 28) return;
    start = {id:event.pointerId,x:event.clientX,y:event.clientY,width:bounds.width};
  }, {passive:true});
  element.addEventListener('pointerup', event => {
    const from = start;start = null;
    if (!from || event.pointerId !== from.id || !enabled()) return;
    const dx = event.clientX - from.x, dy = Math.abs(event.clientY - from.y);
    if (dx >= from.width * .35 && dx > dy * 1.2) onBack();
  }, {passive:true});
  element.addEventListener('pointercancel', () => { start = null; }, {passive:true});
}
attachEdgeBack(scroller, () => canNavigateBack() && !modal.open, navigateBack);
attachEdgeBack(modal, () => modal.open, closeSheet);
telegramApp?.BackButton?.onClick(navigateBack);
render();
