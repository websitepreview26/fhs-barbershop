const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const test = require('node:test'), path = require('node:path');
const root = path.join(__dirname, '..');
function boot() {
  class Element {
    constructor() { this.innerHTML='';this.scrollTop=0;this.open=false;this.dataset={};this.listeners={}; }
    addEventListener(name, fn, options) { this.listeners[name]={fn,options}; }
    querySelector() { return new Element(); }
    querySelectorAll() { return []; }
    setAttribute() {} insertAdjacentHTML(_position, html) { this.innerHTML=html+this.innerHTML; }
    getBoundingClientRect() { return {left:0,right:390,top:0,bottom:600,width:390,height:600}; }
    focus() {} showModal() { this.open=true; } close() { this.open=false; } scrollIntoView() {}
    closest() { return null; }
    cloneNode() { throw Error('Screen cloning is forbidden in the scroll/navigation path'); }
  }
  const elements=new Map(),events={},saved=new Map();
  const document={body:new Element(),querySelector(s){if(s.startsWith('#client-'))return null;if(!elements.has(s))elements.set(s,new Element());return elements.get(s);},querySelectorAll(){return [];},addEventListener(){throw Error('Document-level input handlers are forbidden');}};
  const window={addEventListener(name,fn){events[name]=fn;}};
  const entries=[];let index=0;
  window.history={replaceState(s){entries[index]=s;},pushState(s){entries.splice(index+1);entries.push(s);index++;},back(){if(index>0)events.popstate({state:entries[--index]});},forward(){if(index<entries.length-1)events.popstate({state:entries[++index]});}};
  const ctx=vm.createContext({window,document,Intl,Date,Math,URL,Blob,console,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},setTimeout(){},clearTimeout(){}});
  for(const file of ['reviews.js','app.js','navigation.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
  const run=s=>vm.runInContext(s,ctx),scroll=elements.get('#app-scroll');
  function pointer(type,x,y=100) { const event={pointerType:'touch',isPrimary:true,pointerId:1,clientX:x,clientY:y,target:new Element()};scroll.listeners[type].fn(event); }
  return {run,scroll,elements,saved,pointer};
}

test('complete booking, contact preservation, and real route back/forward',()=>{
  const {run,saved,scroll}=boot();
  run("selectMaster('leonid');state.selected=['hair'];go('services');go('date');state.date=key(new Date(today.getFullYear(),today.getMonth(),today.getDate()+1,12));state.time=slots()[0];go('details');state.name='Тест';state.phone='+375291234567';state.consent=true");
  scroll.scrollTop=280;run("go('about');navigateBack()");
  assert.equal(run('state.screen'),'details');assert.equal(scroll.scrollTop,280);assert.equal(run('state.name'),'Тест');
  run('window.history.forward()');assert.equal(run('state.screen'),'about');run('navigateBack();submit()');
  assert.equal(run('state.screen'),'success');assert.equal(run('visits.length'),1);assert(saved.has('fhs-bookings-v2'));
});

test('short/vertical gestures leave routes intact, edge back completes, pointercancel clears',()=>{
  const {run,pointer,scroll}=boot();run("selectMaster('max');go('services')");
  assert(!scroll.listeners.touchmove);assert(!scroll.listeners.pointermove);
  assert.equal(scroll.listeners.pointerdown.options.passive,true);
  pointer('pointerdown',10);pointer('pointerup',90);assert.equal(run('state.screen'),'services');
  pointer('pointerdown',10);pointer('pointerup',200,400);assert.equal(run('state.screen'),'services');
  pointer('pointerdown',10);scroll.listeners.pointercancel.fn();pointer('pointerup',200);assert.equal(run('state.screen'),'services');
  pointer('pointerdown',10);pointer('pointerup',200);assert.equal(run('state.screen'),'masters');
});

test('repeated navigation never clones screens or grows hidden rendering layers',()=>{
  const {run,scroll}=boot();run("selectMaster('max');go('services')");
  for(let i=0;i<200;i++){scroll.scrollTop=i;run("go('about');navigateBack()");assert.equal(scroll.scrollTop,i);}
  assert.equal(run('routes.length'),3);assert.equal(run('position'),1);
});

test('profile focuses and closes with a native dialog, no animation lifecycle',()=>{
  const {run,elements}=boot();run("showProfile('nikita')");
  assert(run('modal.open'));assert(elements.get('#modal').innerHTML.includes('10 из 10!'));
  run('navigateBack()');assert(!run('modal.open'));assert.equal(run('state.screen'),'masters');
});
