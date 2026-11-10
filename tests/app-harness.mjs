import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { parseHTML, NodeFilter } from 'linkedom';
import { IDBFactory } from 'fake-indexeddb';

export const root = new URL('../', import.meta.url);
export function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key),
    key: index => [...data.keys()][index],
    get length() { return data.size; },
    data,
  };
}
export async function app(options = {}) {
  const html = fs.readFileSync(new URL('oefenen.html', root), 'utf8');
  const {window, document} = parseHTML(html);
  const errors = [];
  const timers = new Map();
  let timerId = 0;
  const sandbox = {
    document,
    navigator: {userAgent:'test', platform:'test', storage:{persist:async()=>false}, onLine:true},
    location: {hostname:'localhost', origin:'http://localhost', pathname:'/', search:'', hash:''},
    history:{replaceState(){}},
    localStorage:options.storage || storage(), sessionStorage:storage(),
    indexedDB:options.indexedDB || new IDBFactory(),
    performance:{timeOrigin:Date.now(),getEntriesByType:()=>[]},
    crypto:webcrypto,
    URL, URLSearchParams, TextEncoder, TextDecoder, Blob, Response,
    MutationObserver:window.MutationObserver,
    NodeFilter,
    Audio:class {pause(){} play(){return Promise.resolve()} addEventListener(){}},
    console:{log(){},info(){},warn(){},error:(...e)=>errors.push(e.join(' '))},
    getComputedStyle:()=>({getPropertyValue:()=>'',direction:'ltr'}),
    matchMedia:()=>({matches:false,addEventListener(){}}),
    addEventListener(){}, requestAnimationFrame:fn=>fn(),
    setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId},
    clearTimeout:id=>timers.delete(id), setInterval:()=>++timerId, clearInterval(){},
    scrollTo(){},scrollY:0,innerWidth:390,innerHeight:844,
    fetch:options.fetch || (async url=>new Response(JSON.stringify(url==='/api/config'?{}:[]))),
    ...options.globals,
  };
  sandbox.window=sandbox;
  sandbox.self=sandbox;
  document.defaultView.HTMLElement.prototype.scrollIntoView=()=>{};
  const context=vm.createContext(sandbox);
  let index=0;
  for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
    if(match[1].includes('ld+json'))continue;
    const src=match[1].match(/src="([^"]+)"/);
    const code=src?fs.readFileSync(new URL(src[1].slice(1).split('?')[0],root),'utf8'):match[2];
    vm.runInContext(code,context,{filename:src?src[1]:`inline-${index++}.js`});
  }
  // Let IndexedDB and the auth/config promises finish without waiting for app timers.
  for(let i=0;i<8;i++)await new Promise(setImmediate);
  return {context,document,errors,timers,run:code=>vm.runInContext(code,context),async flush(){for(let i=0;i<8;i++)await new Promise(setImmediate)}};
}
