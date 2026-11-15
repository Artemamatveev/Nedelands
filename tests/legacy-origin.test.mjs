import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {app,storage} from './app-harness.mjs';

for(const hostname of ['bittertalen.vercel.app','nedelands.vercel.app']){
  test(`Legacy ${hostname} transfers browser progress and cannot reopen practice`,async()=>{
    const data=storage({'ww-v1':JSON.stringify({items:{'knm|0':{r:2,w:1,b:1,d:10}},words:[{w:'de fiets',en:'bicycle'}],streak:3})});
    const replacements=[],events=[];
    const location={hostname,origin:`https://${hostname}`,pathname:'/oefenen',search:'?open=a2',hash:'',replace:u=>replacements.push(u)};
    const a=await app({storage:data,globals:{location,btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary')},fetch:async(u,o)=>{
      if(u==='/api/event')events.push(o);
      return new Response(JSON.stringify(u==='/api/config'?{events:true}:{}));
    }});
    await a.flush();assert.equal(a.errors.length,0);assert.equal(replacements.length,1);
    const to=new URL(replacements[0]);assert.equal(to.origin,'https://bittertalen.nl');assert.equal(to.pathname,'/oefenen');assert.equal(to.searchParams.get('open'),'a2');
    const packed=await a.run(`unpackProgress(${JSON.stringify(to.hash)})`);
    assert.equal(packed.s.items['knm|0'].r,2);assert.equal(packed.s.words[0].w,'de fiets');
    assert.ok(data.getItem('ww-v1'),'the original local backup is retained');assert.deepEqual(events,[]);
    a.run('home();build("knm");startExam("knm",true)');await a.flush();
    assert.equal(a.document.getElementById('home').hidden,true);assert.equal(a.document.getElementById('play').hidden,true);
    assert.equal(a.document.getElementById('mvlater'),null);
  });
}

test('Legacy installed app only offers migration/login and cannot return to exercises',async()=>{
  const location={hostname:'bittertalen.vercel.app',origin:'https://bittertalen.vercel.app',pathname:'/oefenen',search:'',hash:'',replace(){throw Error('Installed app should show reinstall instructions')}};
  const a=await app({globals:{location,navigator:{standalone:true,userAgent:'test',platform:'test',onLine:true}}});
  await a.flush();assert.equal(a.errors.length,0);
  assert.equal(a.document.getElementById('mvlater'),null);
  assert.match(a.document.getElementById('move').textContent,/opnieuw op je beginscherm/);
  assert.equal(a.document.querySelector('#move a').getAttribute('href'),'https://bittertalen.nl/');
  a.run('home();build("knm");startExam("knm",true)');await a.flush();
  assert.equal(a.document.getElementById('play').hidden,true);assert.equal(a.document.getElementById('home').hidden,true);
});

test('Legacy worker replaces cached practice with migration and preserves old data',async()=>{
  const handlers={},navigated=[],waits=[],origin='https://bittertalen.vercel.app';let claimed=false;
  const self={addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting(){},clients:{claim:async()=>{claimed=true},matchAll:async()=>[{url:origin+'/oefenen?open=a2',navigate:async u=>navigated.push(u)}]}};
  const cached=new Map([['/oefenen','old cached practice']]);
  const context=vm.createContext({self,location:{origin},URL,Response,Map,Set,Promise,setTimeout,fetch:async()=>{throw Error('offline')},caches:{open:async()=>{throw Error('Legacy navigation must not read cached exercises')},delete:async k=>cached.delete(k)}});
  vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
  handlers.install({waitUntil:p=>waits.push(p)});assert.equal(waits.length,0);
  handlers.activate({waitUntil:p=>waits.push(p)});await Promise.all(waits);
  assert.equal(claimed,true);assert.deepEqual(navigated,[origin+'/oefenen?open=a2']);
  let response;handlers.fetch({request:{method:'GET',url:origin+'/oefenen',mode:'navigate'},respondWith:p=>{response=p}});
  const body=await(await response).text();assert.match(body,/bittertalen.nl/);assert.match(body,/niet meer oefenen/);
  assert.equal(cached.get('/oefenen'),'old cached practice');
});

test('A failed legacy transfer retains progress and only offers retry',async()=>{
  const saved=JSON.stringify({items:{'knm|0':{r:1}}}),data=storage({'ww-v1':saved}),replacements=[];
  const a=await app({storage:data,globals:{location:{hostname:'bittertalen.vercel.app',origin:'https://bittertalen.vercel.app',pathname:'/oefenen',search:'',hash:'',replace:u=>replacements.push(u)},btoa(){throw Error('packing unavailable')}}});
  await a.flush();assert.deepEqual(replacements,[]);assert.equal(data.getItem('ww-v1'),saved);
  assert.equal(a.document.getElementById('mvgo').disabled,false);assert.equal(a.document.getElementById('mvlater'),null);
  assert.match(a.document.getElementById('mvnote').textContent,/blijft hier bewaard/);assert.equal(a.document.getElementById('home').hidden,true);
});
