// Lines without a recording are said by Azure (api/_say.js through /api/check?kind=say), so the phone's own voice is
// only a fallback; and the page asks for them instead of using speechSynthesis.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root,app} from './app-harness.mjs';

async function load(options={}){
  const guards=[],spend=[],fetches=[];
  const values={accounts:true,caller:async()=>options.guest?null:{id:'user-1'},amsterdamDay:()=>'2026-11-28',
    addSpend:async(m,u)=>{spend.push([m,u.input_tokens]);return true},
    useGuard:async(k,_d,cost,lim)=>{guards.push([k,cost]);const g=options.guard?.[k];return g??lim-cost}};
  const context=vm.createContext({process:{env:{AZURE_SPEECH_KEY:'test-only',...(options.env||{})}},Buffer,AbortSignal,console:{error(){}},
    fetch:async(url,init)=>{fetches.push([url,init]);return options.fail?{ok:false,status:500}:{ok:true,arrayBuffer:async()=>Uint8Array.from([1,2,3]).buffer}}});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context});
  const azure=new vm.SourceTextModule(fs.readFileSync(new URL('api/_azure.js',root),'utf8'),{context});
  const mod=new vm.SourceTextModule(fs.readFileSync(new URL('api/_say.js',root),'utf8'),{context});
  await mod.link(n=>n==='./_azure.js'?azure:supa);await mod.evaluate();
  const call=async body=>{const res={statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v},end(b){this.sent=b;return this}};
    await mod.namespace.say({method:'POST',headers:{},body},res);return res};
  return {call,guards,spend,fetches};
}

test('A line is said in the recordings\' voice and counted per 100 characters', async()=>{
  const t=await load();
  const r=await t.call({t:'Ik ben gisteren naar de markt gegaan.',v:'M'});
  assert.equal(r.statusCode,200);assert.equal(r.headers['Content-Type'],'audio/mpeg');assert.equal(r.sent.length,3);
  assert.match(t.fetches[0][1].body,/<voice name="nl-NL-MaartenNeural">Ik ben gisteren naar de markt gegaan\.<\/voice>/);
  assert.deepEqual(t.guards,[['say:user-1',1],['say:all',1]]);assert.deepEqual(t.spend,[['azure-speech-say',37]]);
  const g=await load({guest:true});await g.call({t:'x'.repeat(250)});
  assert.deepEqual(g.guards,[['say:guests',3],['say:all',3]],'guests share one pool, no cookie');
  assert.match(g.fetches[0][1].body,/nl-NL-FennaNeural/,'Fenna when no voice is given');
});

test('Empty, too long or letterless text, a full day and a failure never cost anything', async()=>{
  const t=await load();
  for(const body of [{t:''},{t:'x'.repeat(401)},{t:'123 !?'}])assert.equal((await t.call(body)).statusCode,400);
  assert.equal(t.fetches.length,0);
  const full=await load({guard:{'say:user-1':-1}});
  assert.equal((await full.call({t:'Hallo'})).statusCode,429);assert.equal(full.fetches.length,0);
  const f=await load({fail:true});
  assert.equal((await f.call({t:'Hallo daar'})).statusCode,502);
  assert.deepEqual(f.guards.slice(2).sort(),[['say:all',-1],['say:user-1',-1]]);assert.deepEqual(f.spend,[]);
  assert.equal((await (await load({env:{AZURE_SPEECH_KEY:''}})).call({t:'Hallo'})).statusCode,503);
});

async function page({fail=false}={}){
  const says=[],phone=[];
  class Audio{constructor(){this.paused=true}pause(){this.paused=true}play(){this.paused=false;this.played=(this.played||[]).concat(this.src);return Promise.resolve()}addEventListener(){}}
  const a=await app({globals:{Audio,btoa:s=>Buffer.from(s,'binary').toString('base64'),
    speechSynthesis:{speak:u=>phone.push(u.text),cancel(){},getVoices:()=>[],speaking:false,pending:false},
    SpeechSynthesisUtterance:class{constructor(t){this.text=t}},
    fetch:async(url,init)=>{
      if(url==='/api/say'){says.push(JSON.parse(init.body));return fail?new Response('{}',{status:502}):new Response(new Blob([new Uint8Array([1,2,3])],{type:'audio/mpeg'}))}
      return new Response(JSON.stringify(url==='/api/config'?{}:[]))}}});
  a.run(`acc.cfg={say:1};URL.createObjectURL=()=>'blob:say'`);
  return {a,says,phone};
}

test('An unrecorded line is fetched from Azure and played; the phone\'s voice stays silent', async()=>{
  const {a,says,phone}=await page();
  a.run('speak("Dit zinnetje is nergens opgenomen.")');await a.flush();
  assert.deepEqual(says,[{t:'Dit zinnetje is nergens opgenomen.',v:'F'}]);
  assert.deepEqual(phone,[]);
  const played=a.run('sayA.played');
  assert.match(played[0],/^data:audio\/wav;base64,/,'the tap starts a moment of silence first (iPhone)');
  assert.equal(played.at(-1),'blob:say');
  a.run('speak("A: Goedemorgen, zegt de man.\\nB: Goedemorgen, zegt de vrouw.",true)');await a.flush();
  assert.deepEqual(says.slice(1).map(x=>x.v),['M','F'],'a dialogue keeps a voice per person');
  assert.deepEqual(phone,[]);
});

test('Only when Azure fails does the phone\'s voice say the line', async()=>{
  const {a,phone}=await page({fail:true});
  a.run('speak("Dit zinnetje is nergens opgenomen.")');await a.flush();
  assert.deepEqual(phone,['Dit zinnetje is nergens opgenomen.']);
});
