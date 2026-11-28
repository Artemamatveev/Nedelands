// Gesprekken with AI (api/_talk.js through /api/check?kind=talk): one check per conversation, a signed ticket for the
// turns after it, the prompt built on the server, Google's voice optional; and the page's topics match the server's.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {root,app} from './app-harness.mjs';

async function load(options={}){
  const guards=[],usage=[],quotas=[],bodies=[],fetches=[],logs=[];
  class APIError extends Error{}
  class AuthenticationError extends APIError{}
  class RateLimitError extends APIError{}
  class Anthropic {
    static APIError=APIError;static AuthenticationError=AuthenticationError;static RateLimitError=RateLimitError;
    beta={messages:{stream:(body)=>{bodies.push(body);const on={};
      return {on(e,f){on[e]=f},async finalMessage(){
        if(options.fail)throw new APIError('down');
        const full=options.raw||JSON.stringify(options.out||{reply:'Leuk! "Ja" zei ik.',done:false,fix:{wrong:'ik heb gegaan',right:'ik ben gegaan',why:'Gaan krijgt zijn.'}});
        if(options.fallback)on.streamEvent?.({type:'content_block_start',content_block:{type:'fallback'}});
        for(let i=1;i<=full.length;i++)on.text?.(full[i-1],full.slice(0,i));
        if(options.hold)await options.hold;
        return {stop_reason:options.stop||'end_turn',model:'test-model',usage:{input_tokens:50,output_tokens:20},content:[{type:'text',text:full}]};
      }}},create:async(body)=>{bodies.push(body);
      if(options.fail)throw new APIError('down');
      const out=options.out||(body.system.includes('teacher')?{verdict:'Goed gedaan.',good:['Je stelde vragen.'],tips:[{wrong:'ik heb gegaan',right:'ik ben gegaan',why:'Gaan krijgt zijn.'},{wrong:'x',right:'x',why:'same'}]}
        :{reply:'Leuk! Wat heb je gegeten?',fix:{wrong:'ik heb gegaan',right:'ik ben gegaan',why:'Gaan krijgt zijn.'},done:false});
      return {stop_reason:options.stop||'end_turn',model:'test-model',usage:{input_tokens:50,output_tokens:20},content:[{type:'text',text:JSON.stringify(out)}]};
    }}};
  }
  const values={
    accounts:true,caller:async()=>options.guest?null:{id:options.uid||'user-1'},LIMIT:7,PLUS:60,FREE:2,plusOn:!!options.plan,
    visitor:()=>'visitor-hash',sameOrigin:()=>true,
    useChecks:async(_id,cost)=>{usage.push(cost);return options.left??5},useFree:async(_id,cost)=>{usage.push(cost);return options.free??1},
    useTotal:async cost=>{quotas.push(cost);return 'total' in options?options.total:300},addSpend:options.addSpend|| (async()=>true),bonusFor:async()=>0,
    PLUS_MONTH:200,PASS_TOTAL:250,YEAR_TOTAL:600,TALK_PLUS:3,monthOf:()=>'2026-11-01',amsterdamDay:()=>'2026-11-25',
    useGuard:async(k,_d,cost,lim)=>{guards.push([k,cost]);const g=options.guard?.[k[0]];return g??lim-cost},
    plusFor:async()=>options.plan||null,coversLevel:(p,l)=>!!p&&(p.level==='B1'||l==='A2'),
    talkSign:x=>crypto.createHmac('sha256','test-secret').update('bittertalen-talk|'+x).digest('base64url'),
  };
  const context=vm.createContext({process:{env:{ANTHROPIC_API_KEY:'test-only',...(options.env||{})}},Buffer,Date,AbortSignal,
    console:{info:x=>logs.push(x),error:(...x)=>logs.push(x.join(' '))},
    fetch:async(url,init)=>{fetches.push([url,init]);if(options.ttsFail)return {ok:false,status:500};
      return {ok:true,json:async()=>({audioContent:'QUJD'}),arrayBuffer:async()=>Uint8Array.from([65,66,67]).buffer}}});
  const sdk=new vm.SyntheticModule(['default'],function(){this.setExport('default',Anthropic)},{context});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context});
  const cr=new vm.SyntheticModule(['timingSafeEqual','randomBytes'],function(){this.setExport('timingSafeEqual',crypto.timingSafeEqual);this.setExport('randomBytes',crypto.randomBytes)},{context});
  const mod=new vm.SourceTextModule(fs.readFileSync(new URL('api/_talk.js',root),'utf8'),{context});
  const scenes=new vm.SourceTextModule(fs.readFileSync(new URL('api/_scenes.js',root),'utf8'),{context});
  const azure=new vm.SourceTextModule(fs.readFileSync(new URL('api/_azure.js',root),'utf8'),{context});
  await mod.link(n=>n==='@anthropic-ai/sdk'?sdk:n==='node:crypto'?cr:n==='./_scenes.js'?scenes:n==='./_azure.js'?azure:supa);await mod.evaluate();
  const call=async body=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this},headers:{},headersSent:false,setHeader(k,v){this.headers[k]=v},lines:[],write(x){this.headersSent=true;this.lines.push(...x.trim().split('\n').map(l=>JSON.parse(l)));options.onLine?.(this.lines)},end(){this.ended=true;return this}};
    await mod.namespace.talk({method:'POST',headers:{},body},res);return res};
  return {call,usage,quotas,bodies,fetches,logs,ns:mod.namespace};
}

test('Starting a conversation takes one check and returns the opener with a ticket', async()=>{
  const t=await load();
  const r=await t.call({go:'start',topic:'saskia',level:'A2'});
  assert.equal(r.statusCode,200);assert.deepEqual(t.usage,[1]);assert.deepEqual(t.quotas,[1]);
  assert.ok(t.ns.TOPICS.saskia.open.includes(r.body.reply));assert.equal(r.body.left,5);assert.ok(r.body.token);
  assert.equal(t.bodies.length,0,'the opener needs no model call');
  assert.equal(r.body.audio,null,'without GOOGLE_TTS_KEY the page uses the phone voice');
});

test('Turns with a valid ticket take no further checks and use the cheap model for free accounts', async()=>{
  const t=await load({env:{GOOGLE_TTS_KEY:'k'}});
  const {body:{token,audio}}=await t.call({go:'start',topic:'spreekkamer',level:'A2'});
  assert.equal(audio,'QUJD');assert.match(t.fetches[0][1].body,/Chirp3-HD-Charon/);
  const r=await t.call({go:'say',token,history:[{me:false,t:'Wat kan ik voor u doen?'},{me:true,t:'ik heb gegaan naar huis'}]});
  assert.equal(r.statusCode,200);assert.equal(r.body.reply,'Leuk! Wat heb je gegeten?');assert.equal(r.body.fix.right,'ik ben gegaan');
  assert.deepEqual(t.usage,[1],'only the start took a check');
  assert.equal(t.bodies[0].model,'claude-haiku-5-5');assert.equal(t.bodies[0].fallbacks,undefined);
  assert.match(t.bodies[0].system,/huisarts/);assert.match(t.bodies[0].system,/Use u \(formal\)/);
  assert.match(t.bodies[0].system,/model version of this conversation/,'the checked script guides the situation');
  assert.ok(t.logs.every(x=>!String(x).includes('ik heb gegaan')),'learner text is never logged');
});

test('Plus conversations use the better model with refusal fallback and skip the daily ceiling', async()=>{
  const t=await load({plan:{status:'active',level:'A2'}});
  const {body:{token,period,limit}}=await t.call({go:'start',topic:'saskia',level:'A2'});
  assert.equal(period,'day');assert.equal(limit,60);assert.deepEqual(t.quotas,[]);
  assert.deepEqual(t.usage,[3],'a Plus conversation takes TALK_PLUS checks');
  await t.call({go:'say',token,history:[{t:'Hoi'},{me:true,t:'Goed!'}]});
  assert.equal(t.bodies[0].model,'claude-sonnet-5-5');assert.equal(t.bodies[0].fallbacks,'default');
});

test('A forged, expired or someone else\'s ticket is refused before calling the model', async()=>{
  const t=await load();
  const {body:{token}}=await t.call({go:'start',topic:'saskia',level:'A2'});
  const h=[{t:'Hoi'},{me:true,t:'Hallo'}];
  const [p,sig]=token.split('.');
  const forged=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(p,'base64url')),p:1})).toString('base64url')+'.'+sig;
  assert.equal((await t.call({go:'say',token:forged,history:h})).statusCode,401);
  const other=await load({uid:'user-2'});
  assert.equal((await other.call({go:'say',token,history:h})).statusCode,401);
  const old=Buffer.from(JSON.stringify({s:'u:user-1',t:'saskia',l:'A2',p:0,x:Date.now()-1})).toString('base64url');
  assert.equal((await t.call({go:'say',token:old+'.'+crypto.createHmac('sha256','test-secret').update('bittertalen-talk|'+old).digest('base64url'),history:h})).statusCode,401);
  assert.equal(t.bodies.length+other.bodies.length,0);
});

test('Unknown topics, empty or over-long conversations are refused', async()=>{
  const t=await load();
  assert.equal((await t.call({go:'start',topic:'nope'})).statusCode,400);
  const {body:{token}}=await t.call({go:'start',topic:'saskia',level:'A2'});
  assert.equal((await t.call({go:'say',token,history:[{t:'Hoi'}]})).statusCode,400);
  const long=Array.from({length:40},(_, i)=>({me:i%2===1,t:'zin '+i}));
  assert.equal((await t.call({go:'say',token,history:long})).statusCode,400);
  assert.equal(t.bodies.length,0);
});

test('Quota limits stop a conversation before it starts and give the check back', async()=>{
  const full=await load({left:-1});const r=await full.call({go:'start',topic:'saskia'});
  assert.equal(r.statusCode,429);assert.equal(r.body.error,'limit');assert.deepEqual(full.quotas,[]);
  const busy=await load({total:-1});assert.equal((await busy.call({go:'start',topic:'saskia'})).statusCode,429);assert.deepEqual(busy.usage,[1,-1]);
  const guest=await load({guest:true,free:-1});assert.equal((await guest.call({go:'start',topic:'saskia'})).body.error,'login');
});

test('The review returns verdict, good points and only real corrections', async()=>{
  const t=await load();
  const {body:{token}}=await t.call({go:'start',topic:'saskia',level:'B1'});
  const r=await t.call({go:'end',token,history:[{t:'Hoi'},{me:true,t:'ik heb gegaan'},{t:'O ja?'},{me:true,t:'ja'}]});
  assert.equal(r.statusCode,200);assert.equal(r.body.verdict,'Goed gedaan.');assert.equal(r.body.tips.length,1);
  assert.match(t.bodies[0].system,/level B1/);
});

test('A failing model call reports an error without spending another check', async()=>{
  const t=await load({fail:true});
  const {body:{token}}=await t.call({go:'start',topic:'saskia'});
  const r=await t.call({go:'say',token,history:[{t:'Hoi'},{me:true,t:'Hallo'}]});
  assert.equal(r.statusCode,502);assert.deepEqual(t.usage,[1]);
});

test('The page lists the same topics, people and tasks as the server, and the scenes are up to date', async()=>{
  const t=await load();const T=t.ns.TOPICS;
  const a=await app();
  const page=JSON.parse(a.run('JSON.stringify(PEOPLE.concat(GP.filter(c=>!c.ona).map(c=>({id:c.id,who:c.w,task:c.o}))))'));
  assert.equal(JSON.stringify(page.map(c=>c.id).sort()),JSON.stringify(Object.keys(T).sort()));
  for(const c of page){assert.equal(c.who,T[c.id].who,c.id);assert.equal(c.task||null,T[c.id].task||null,c.id)}
  const {source}=await import(new URL('tools/build-scenes.mjs',root));
  assert.equal(fs.readFileSync(new URL('api/_scenes.js',root),'utf8'),source(),'run node tools/build-scenes.mjs');
});

test('The route is a rewrite, so the function count stays within the Hobby plan', ()=>{
  const v=JSON.parse(fs.readFileSync(new URL('vercel.json',root),'utf8'));
  assert.ok(v.rewrites.some(r=>r.source==='/api/talk'&&r.destination==='/api/check?kind=talk'));
  assert.match(fs.readFileSync(new URL('api/check.js',root),'utf8'),/kind === "talk"/);
});

test('The app holds a whole conversation: start, a spoken turn with a fix, hanging up with tips', async()=>{
  const sent=[];
  const fetch=async(url,init)=>{
    if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);sent.push(b);
    const out=b.go==='start'?{token:'tok',reply:'Goedemorgen, wat kan ik voor u doen?',audio:null,left:1,limit:2,period:'once',free:1}
      :b.go==='say'?{reply:'Sinds wanneer heeft u koorts?',fix:{wrong:'ik heb koorts sinds gisteren',right:'ik heb sinds gisteren koorts',why:'Eerst de tijd.'},done:false}
      :{verdict:'Goed gedaan.',good:['Je vertelde wat je had.'],tips:[{wrong:'ik heb koorts sinds gisteren',right:'ik heb sinds gisteren koorts',why:'Eerst de tijd.'}]};
    return new Response(JSON.stringify(out));
  };
  const a=await app({fetch});
  a.run('aiList()');
  assert.ok(a.document.querySelector('#aiany'),'the random button');
  assert.equal(a.document.querySelectorAll('#tbody [data-ai]').length,0);
  a.document.querySelector('[data-aimenu="scenes"]').click();
  assert.equal(a.document.querySelectorAll('#tbody [data-ai]').length,a.run('GP.filter(c=>!c.ona).length'));
  a.run('aiTalk("spreekkamer")');
  assert.ok(a.document.querySelector('#tbody').textContent.includes(a.run('GP.find(c=>c.id==="spreekkamer").o')));
  assert.equal(a.document.querySelector('#tbody [lang=nl]')!=null,true,'the conversation is Dutch content');
  await a.run('aiStart()');await a.flush();
  assert.equal(sent[0].topic,'spreekkamer');assert.equal(a.run('acc.free'),1);
  assert.match(a.document.querySelector('#tlog').textContent,/wat kan ik voor u doen/);
  await a.run('aiSend("ik heb koorts sinds gisteren")');await a.flush();
  assert.deepEqual(JSON.parse(JSON.stringify(sent[1].history)),[{me:false,t:'Goedemorgen, wat kan ik voor u doen?'},{me:true,t:'ik heb koorts sinds gisteren'}]);
  assert.match(a.document.querySelector('#tlog').textContent,/Beter: ik heb sinds gisteren koorts/);
  assert.match(a.document.querySelector('#tlog').textContent,/Sinds wanneer/);
  await a.run('aiSend("sinds gisteren")');await a.flush();
  await a.run('aiEnd()');await a.flush();
  assert.equal(sent.at(-1).go,'end');
  assert.match(a.document.querySelector('#tctl').textContent,/Goed gedaan/);
  assert.equal(a.run('S.ai.spreekkamer.n'),1);
  assert.equal(a.run('S.errs[0].r'),'ik heb sinds gisteren koorts');
  assert.deepEqual(a.errors,[]);
});

test('The main conversation opens Bittie with the voice dial; legacy avatars remain readable',async()=>{
  const a=await app();
  for(let i=0;i<3;i++){a.run('aiAny()');assert.equal(a.run('AK.c.id'),'saskia')}
  assert.ok(a.document.querySelector('.bittie-call #aiav .voice-mark-dial'));
  assert.match(a.document.querySelector('#tbody h2').textContent,/Bittie/);
  assert.equal(a.run('aiIds().filter(id=>PEOPLE.some(p=>p.id===id)).join(",")'),'saskia');
  assert.ok(fs.existsSync(new URL('voice-mark-v1.css',root)));
  a.run('aiTalk("vangogh")');
  assert.equal(a.document.querySelector('#aiav img').getAttribute('src'),'/art/avatars/vangogh.jpg');
  for(const av of JSON.parse(a.run('JSON.stringify(PEOPLE.map(p=>p.av).filter(Boolean))')))assert.ok(fs.existsSync(new URL(`art/avatars/${av}.jpg`,root)),av);
  assert.deepEqual(a.errors,[]);
});

test('Every person has a persona and openers; historical people stay in their own time', async()=>{
  const t=await load();
  for(const id of ['saskia','jansen','slager','vangogh','rembrandt','vermeer','visser','sint']){
    const T=t.ns.TOPICS[id];assert.ok(T.persona&&Array.isArray(T.open)&&T.open.length>=2,id);
  }
  const {body:{token,reply}}=await t.call({go:'start',topic:'vangogh',level:'A2'});
  assert.ok(t.ns.TOPICS.vangogh.open.includes(reply));
  await t.call({go:'say',token,history:[{t:reply},{me:true,t:'Ja, ik hou van schilderen.'}]});
  assert.match(t.bodies[0].system,/Arles/);assert.match(t.bodies[0].system,/stay in your own time/);
});

test('Bittie and practice situations wait for explicit confirmation before spending a check', async()=>{
  const sent=[];
  const fetch=async(url,init)=>{if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);sent.push(b);return new Response(JSON.stringify({token:'tok',reply:'Hoi!',audio:null,left:1,limit:2,period:'once'}))};
  const a=await app({fetch});
  a.run('S.words=[{w:"de afspraak",en:"appointment"}];aiAny()');await a.flush();
  assert.equal(sent.length,0);
  const controls=a.document.querySelector('#tctl');
  assert.match(controls.textContent,/Dit kost 1 nakijkbeurt/);
  assert.ok(controls.querySelector('#aipractice'));
  controls.querySelector('#aipractice').checked=true;
  controls.querySelector('#aigo').click();
  await a.flush();
  assert.equal(a.run('AK.practice.word'),'de afspraak');
  assert.equal(sent.length,1);assert.equal(sent[0].go,'start');
  assert.match(a.document.querySelector('#tlog').textContent,/Hoi!/);
  a.run('aiTalk("apotheek")');await a.flush();
  assert.equal(sent.length,1,'no start before Begin het gesprek');
  assert.ok(a.document.querySelector('#aigo'));
});

async function voiceConversation({failOnce=false,refuse=false,globals={},audio=null,topic="saskia"}={}){
  const requests=[],instances=[];
  class Recognition{
    constructor(){instances.push(this);this.starts=0;this.aborts=0}
    start(){this.starts++;if(refuse)throw Error('gesture required')}
    stop(){this.onend?.()}
    abort(){this.aborts++;this.onend?.()}
    result(text,final=true,confidence=.9){const r=[{transcript:text,confidence}];r.isFinal=final;this.onresult?.({results:[r]})}
  }
  const fetch=async(url,init)=>{
    if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);requests.push(b);
    if(b.go==='say'&&failOnce){failOnce=false;throw Error('offline')}
    const clip=typeof audio==='function'?audio(b,requests.length):audio;
    return new Response(JSON.stringify(b.go==='start'?{token:'tok',reply:'Hoe was je dag?',audio:clip}:{reply:'Ik heb vandaag gewerkt.',audio:clip,done:false}));
  };
  const a=await app({fetch,globals:{SpeechRecognition:Recognition,...globals}});
  a.run(`aiTalk(${JSON.stringify(topic)})`);await a.run('aiStart()');await a.flush();
  return {a,requests,instances};
}

test('The greeting opens the microphone, Klaar sends the visible answer, and the next turn listens',async()=>{
  const {a,instances,requests}=await voiceConversation();
  assert.ok(a.run('rec'),'the first answer needs no extra Spreek tap');
  instances[0].result('Ik ben naar de markt geweest');
  assert.match(a.document.getElementById('recp').textContent,/naar de markt/);
  const r=a.run('rec');assert.equal(r.quiet,undefined);
  // Some browsers send an empty result while finalising; it must not erase speech.
  instances[0].result('');
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik ben naar de markt geweest');
  assert.match(a.document.getElementById('tlog').textContent,/Ik ben naar de markt geweest/);
  assert.ok(a.run('rec'),'the next answer is hands free too');
  assert.deepEqual(a.errors,[]);
});

test('A failed spoken request preserves the answer and retry sends it only once',async()=>{
  const {a,instances,requests}=await voiceConversation({failOnce:true});
  instances[0].result('Ik heb gewerkt');a.document.getElementById('recb').click();await a.flush();
  assert.match(a.document.getElementById('tlog').textContent,/Ik heb gewerkt/);
  assert.equal(a.document.getElementById('tin').value,'Ik heb gewerkt');
  await a.run('aiSend("Ik heb vandaag gewerkt")');await a.flush();
  assert.equal(requests.at(-1).history.filter(l=>l.me).length,1);
  assert.equal(requests.at(-1).history.at(-1).t,'Ik heb vandaag gewerkt');
  assert.equal(a.run('AK.n'),1);assert.equal(a.run('AK.pending'),null);
});

test('A browser refusing automatic recognition offers the microphone button again',async()=>{
  const {a}=await voiceConversation({refuse:true});
  const retry=[...a.timers.values()].find(t=>t.delay===400);assert.ok(retry);retry.fn();
  const fallback=[...a.timers.values()].find(t=>t.delay===1500);assert.ok(fallback);fallback.fn();
  assert.equal(a.run('rec'),null);
  assert.equal(a.document.getElementById('recb').disabled,false);
  assert.match(a.document.getElementById('recn').textContent,/Tik op Spreek/);
});


test('Voice synthesis begins while spend accounting is still pending',async()=>{
  let release;
  const saved=new Promise(resolve=>{release=resolve});
  const t=await load({env:{GOOGLE_TTS_KEY:'k'},addSpend:()=>saved});
  const {body:{token}}=await t.call({go:'start',topic:'saskia'});
  const pending=t.call({go:'say',token,history:[{t:'Hoi!'},{me:true,t:'Ik heb gewerkt.'}]});
  try{
    for(let i=0;i<8;i++)await new Promise(setImmediate);
    assert.equal(t.fetches.length,2,'the reply voice starts before accounting resolves');
    assert.equal(t.bodies[0].max_tokens,700);
  }finally{release(true)}
  const r=await pending;assert.equal(r.statusCode,200);assert.equal(r.body.audio,'QUJD');
});

test('Final and interim results never submit a conversation before Klaar',async()=>{
  const {a,instances,requests}=await voiceConversation();const native=instances[0],r=a.run('rec');
  native.result('Ik heb gewerkt',true);assert.equal(r.quiet,undefined);assert.equal(requests.length,1);
  native.result('Ik heb gewerkt en daarna',false);assert.equal(requests.length,1);
  native.result('Ik heb gewerkt en daarna gekookt',true);assert.ok(a.run('rec')===r);
  assert.equal(requests.length,1);assert.match(a.document.getElementById('recb').textContent,/Klaar/);
  a.document.getElementById('recb').click();await a.flush();assert.equal(requests.length,2);
});


test('Conversation menus separate random people from grouped daily situations and remember the menu on return',async()=>{
  const a=await app();a.run('aiList("people")');
  assert.equal(a.document.querySelector('[data-aimenu="people"]').getAttribute('aria-pressed'),'true');
  assert.ok(a.document.getElementById('aiany'));
  a.document.querySelector('[data-aimenu="scenes"]').click();
  assert.equal(a.document.getElementById('aiany'),null);
  const groups=[...a.document.querySelectorAll('[data-aigroup]')];assert.ok(groups.length>=4);
  for(const b of groups)assert.equal(a.document.getElementById(b.dataset.aigroup).hidden,true);
  const first=groups[0],panel=a.document.getElementById(first.dataset.aigroup);
  first.click();assert.equal(panel.hidden,false);assert.equal(first.getAttribute('aria-expanded'),'true');
  const choice=panel.querySelector('[data-ai]'),id=choice.dataset.ai;
  choice.click();assert.equal(a.run('AK.c.id'),id);assert.ok(a.document.getElementById('aigo'));
  a.run('aiList()');
  assert.equal(a.document.querySelector('[data-aimenu="scenes"]').getAttribute('aria-pressed'),'true');
  const again=a.document.querySelector('[data-aigroup]');again.click();again.click();
  assert.equal(a.document.getElementById(again.dataset.aigroup).hidden,true);
  a.document.querySelector('[data-aimenu="people"]').click();assert.ok(a.document.getElementById('aiany'));
  assert.deepEqual(a.errors,[]);
});


function bufferVoice(){
  const sources=[];let mediaPlays=0,decodes=0;
  class Context{
    state='running';sampleRate=24000;destination={};
    resume(){return Promise.resolve()}
    createBuffer(){return {silence:true}}
    createGain(){return {gain:{value:1},connect(){},disconnect(){this.disconnected=true}}}
    async decodeAudioData(){decodes++;return {voice:true,numberOfChannels:1,getChannelData:()=>new Float32Array([.06,-.06])}}
    createBufferSource(){const s={playbackRate:{value:1},connect(output){this.output=output},disconnect(){},start(){sources.push(this)},stop(){this.stopped=true}};return s}
  }
  class Audio{
    paused=true;ended=false;
    pause(){this.paused=true}
    play(){mediaPlays++;this.paused=false;return Promise.resolve()}
    addEventListener(){}
  }
  return {sources,globals:{AudioContext:Context,Audio,atob:s=>Buffer.from(s,'base64').toString('binary')},get mediaPlays(){return mediaPlays},get decodes(){return decodes}};
}

test('Five spoken replies including the third use fresh recognition after Web Audio playback',async()=>{
  const voice=bufferVoice();
  const {a,instances,requests}=await voiceConversation({globals:voice.globals,audio:'QUJD'});
  assert.equal(a.run('rec'),null,'do not listen over the greeting');
  for(let turn=1;turn<=5;turn++){
    const source=voice.sources.at(-1);assert.equal(source.buffer.voice,true);source.onended();await a.flush();
    assert.equal(instances.length,turn,'each answer gets a fresh recogniser');
    const native=instances.at(-1),take=a.run('rec');assert.ok(take);
    native.result('Dit is antwoord '+turn);
    a.document.getElementById('recb').click();await a.flush();
    assert.equal(requests.at(-1).history.filter(l=>l.me).length,turn);
    assert.equal(requests.at(-1).history.at(-1).t,'Dit is antwoord '+turn);
    assert.equal(native.aborts,1,'release recognition before playing the reply');
    assert.equal(native.onresult,null,'old recogniser cannot leak results into the next take');
  }
  assert.equal(voice.mediaPlays,0,'HTML audio must never play between microphone turns');
  assert.equal(voice.decodes,6);assert.deepEqual(a.errors,[]);
});

test('An iOS recogniser that silently goes deaf offers a fresh retry without losing conversation history',async()=>{
  const {a,instances,requests}=await voiceConversation();
  for(let i=0;i<2;i++){
    const take=a.run('rec');instances.at(-1).result('Mijn antwoord '+i);
    a.document.getElementById('recb').click();await a.flush();
  }
  const third=a.run('rec'),dead=instances.at(-1);assert.equal(instances.length,3);
  a.timers.get(third.watchTimer).fn();await a.flush();
  assert.equal(a.run('rec'),null);assert.equal(a.run('AK.n'),2);assert.equal(requests.length,3);
  assert.equal(dead.onresult,null);
  assert.match(a.document.getElementById('recn').textContent,/Tik op Spreek/);
  a.document.getElementById('recb').click();await a.flush();assert.equal(instances.length,4);
  const retry=a.run('rec');instances.at(-1).result('Mijn derde antwoord');
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(a.run('AK.n'),3);assert.equal(requests.at(-1).history.at(-1).t,'Mijn derde antwoord');
  assert.equal(requests.at(-1).history.filter(l=>l.me).length,3);
});

test('Old permission and silence timers cannot stop a newer answer',async()=>{
  const {a,instances}=await voiceConversation();const first=a.run('rec');
  const permission=[...a.timers.values()].find(t=>t.delay===1500).fn,watch=a.timers.get(first.watchTimer).fn;
  instances[0].result('Mijn eerste antwoord');a.document.getElementById('recb').click();await a.flush();
  const second=a.run('rec');second.fail=true;
  permission();watch();assert.equal(a.run('rec'),second);assert.equal(second.fin,false);
});

test('Stopping a conversation stops Web Audio and a late decode cannot reopen its microphone',async()=>{
  const voice=bufferVoice(),{a}=await voiceConversation({globals:voice.globals,audio:'QUJD'});
  const source=voice.sources.at(-1);assert.equal(source.buffer.voice,true);
  a.run('home()');assert.equal(source.stopped,true);assert.equal(source.onended,null);assert.equal(a.run('rec'),null);
  a.run('aiTalk("saskia");AK.tok="tok";aiHear("Hoi!","QUJD",false);home()');await a.flush();
  assert.equal(a.run('rec'),null);assert.equal(voice.sources.at(-1),source);
});


test('A microphone that stops without Klaar leaves a draft with close words from the situation',async()=>{
  const {a,instances,requests}=await voiceConversation({topic:'haring'});
  instances[0].result('Ik wil kering met uitjes');instances[0].onerror({error:'network'});
  [...a.timers.values()].find(t=>t.delay===0).fn();await a.flush();
  assert.equal(requests.length,1);assert.equal(a.document.getElementById('tin').value,'Ik wil kering met uitjes');
  const choice=a.document.querySelector('[data-aichoice]');assert.equal(choice.textContent,'Ik wil haring met uitjes');
  choice.click();assert.equal(requests.length,1,'choosing a suggestion only edits the draft');
  a.document.getElementById('tsend').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik wil haring met uitjes');
});

test('Klaar always sends: interim, low-confidence and misheard words need no Stuur',async()=>{
  const {a,instances,requests}=await voiceConversation({topic:'haring'});
  instances[0].result('Ik wil kering',false);a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests.length,2);assert.equal(requests[1].history.at(-1).t,'Ik wil kering');
  instances.at(-1).result('Met uitjes',true,.2);a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests.length,3);assert.equal(requests[2].history.at(-1).t,'Met uitjes');
});

test('Words that arrive after Klaar are still sent, on a phone that is slow and never says end',async()=>{
  const {a,instances,requests}=await voiceConversation(),native=instances[0];
  native.stop=()=>{};native.abort=()=>{};native.onstart();
  a.document.getElementById('recb').click();await a.flush();
  const r=a.run('rec');assert.equal(a.timers.get(r.finishTimer).delay,4000,'nothing heard yet: wait longest');
  native.result('Ik ben',false);assert.equal(a.timers.get(r.finishTimer).delay,1500);
  native.result('Ik ben moe',true);assert.equal(a.timers.get(r.finishTimer).delay,150);
  assert.equal(requests.length,1);a.timers.get(r.finishTimer).fn();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik ben moe');
});

test('Thinking for a long time keeps the microphone open; a deaf recogniser is replaced under the same answer',async()=>{
  const {a,instances,requests}=await voiceConversation(),r=a.run('rec');
  const check=()=>a.timers.get(r.watchTimer).fn();
  instances[0].onstart();check();assert.ok(a.run('rec')===r);assert.equal(instances.length,1,'eight seconds of thinking changes nothing');
  check();check();assert.ok(a.run('rec')===r,'still the same answer');assert.equal(instances.length,2);assert.equal(instances[0].onresult,null);
  instances[1].onstart();instances[1].onspeechstart();check();assert.equal(instances.length,2,'a voice that just began is never cut off');
  r.soundAt=Date.now()-6000;check();assert.equal(instances.length,3,'a voice without words: replaced');
  instances[2].onstart();instances[2].result('Ik heb even nagedacht');check();
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik heb even nagedacht');
});

test('A recogniser that stays deaf ends with a retry and says why',async()=>{
  const {a,instances}=await voiceConversation(),r=a.run('rec');
  for(let i=0;i<16&&!r.fin;i++){instances.at(-1).onstart?.();a.timers.get(r.watchTimer).fn();await a.flush()}
  assert.equal(r.fin,true);assert.equal(instances.length,4);assert.match(a.document.getElementById('recn').textContent,/Tik op Spreek.*\(no-text\)/);
});

test('A microphone not yet handed over after the voice is tried again before giving up',async()=>{
  const {a,instances,requests}=await voiceConversation(),r=a.run('rec');
  for(let i=1;i<=2;i++){const n=instances.at(-1);n.onerror({error:'audio-capture'});n.onend();
    assert.equal(r.fail,undefined);assert.equal(a.timers.get(r.restart).delay,600);a.timers.get(r.restart).fn();assert.equal(instances.length,i+1)}
  instances.at(-1).result('Nu hoor je mij');a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Nu hoor je mij');
});

test('Klaar between two recognition sessions sends at once; typed text counts when nothing was heard',async()=>{
  const {a,instances,requests}=await voiceConversation();
  instances[0].result('Ik werk morgen');instances[0].stop=()=>{};instances[0].onend();
  a.document.getElementById('recb').click();await a.flush();assert.equal(requests[1].history.at(-1).t,'Ik werk morgen');
  a.document.getElementById('tin').value='Ik typ dit';a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[2].history.at(-1).t,'Ik typ dit');
});

test('A final correction replaces interim words without duplication or an unnecessary review',async()=>{
  const {a,instances,requests}=await voiceConversation();
  instances[0].result('Ik heb een hand',false);instances[0].result('Ik heb een hond',true);
  a.document.getElementById('recb').click();await a.flush();assert.equal(requests[1].history.at(-1).t,'Ik heb een hond');
});

test('Recognition receives Dutch domain hints only where contextual biasing is supported',async()=>{
  class Phrase{constructor(phrase,boost){this.phrase=phrase;this.boost=boost}}
  const {a,instances}=await voiceConversation({topic:'haring',globals:{SpeechRecognitionPhrase:Phrase}});
  // Simulate a browser exposing phrases on a subsequently created recogniser.
  a.run('recEnd(false);SR.prototype.phrases=[];aiRec()');await a.flush();
  const native=instances.at(-1);assert.equal(native.lang,'nl-NL');assert.equal(native.maxAlternatives,3);
  assert.ok(native.phrases.some(p=>p.phrase==='haring'));assert.ok(native.phrases.some(p=>p.phrase==='kibbeling'));
  native.onerror({error:'phrases-not-supported'});assert.equal(a.run('rec.fail'),undefined);assert.equal(native.phrases.length,0);
  assert.equal(a.run('rec.hints'),false);
});

test('The microphone ready message names Klaar and silence never arms a submit timer',async()=>{
  const {a,instances,requests}=await voiceConversation();const native=instances[0];
  assert.match(a.document.getElementById('recn').textContent,/microfoon start/);
  assert.match(a.document.getElementById('recb').textContent,/Wacht/);
  native.onstart();assert.match(a.document.getElementById('recn').textContent,/microfoon start/,'started is not yet recording');
  native.onaudiostart();assert.match(a.document.getElementById('recn').textContent,/Tik op Klaar/);assert.match(a.document.getElementById('recb').textContent,/Klaar/);
  native.result('Ik wil een afspraak');assert.equal(a.run('rec.quiet'),undefined);assert.equal(requests.length,1);
});


test('A long pause, recognition restart and expired old minute never send without Klaar',async()=>{
  const intervals=[];
  const {a,instances,requests}=await voiceConversation({globals:{setInterval:(fn,ms)=>{intervals.push({fn,ms});return intervals.length}}});
  const r=a.run('rec'),native=instances[0];native.result('Ik wil graag');native.onend();
  const restart=a.timers.get(r.restart);assert.ok(restart);restart.fn();
  native.result('een afspraak maken');r.start-=120000;r.end=Date.now()-60000;
  intervals.filter(t=>t.ms===250).forEach(t=>t.fn());
  assert.ok(a.run('rec')===r);assert.equal(requests.length,1);assert.equal(r.stopping,undefined);
  assert.equal(a.document.getElementById('rect').textContent,'2:00');
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik wil graag een afspraak maken');
});

test('A microphone error keeps a partial answer as a draft instead of making AI reply without Klaar',async()=>{
  const {a,instances,requests}=await voiceConversation();instances[0].result('Ik ben nog aan het praten');
  instances[0].onerror({error:'network'});
  const finish=[...a.timers.values()].find(t=>t.delay===0);assert.ok(finish);finish.fn();await a.flush();
  assert.equal(requests.length,1);assert.equal(a.document.getElementById('tin').value,'Ik ben nog aan het praten');
});

test('Speech loudness is matched across quiet and loud buffers while peaks and silence stay bounded',async()=>{
  const a=await app();
  const gain=amplitude=>a.run(`aiLevel({numberOfChannels:1,getChannelData:()=>new Float32Array([${amplitude},-${amplitude}])})`);
  const quiet=gain(.06),loud=gain(.3);
  assert.ok(Math.abs(.06*quiet-.12)<.00001);assert.ok(Math.abs(.3*loud-.12)<.00001);
  assert.equal(gain(0),1);assert.equal(gain(.001),1);assert.ok(gain(.01)<=3);
  const peak=a.run('aiLevel({numberOfChannels:1,getChannelData:()=>new Float32Array([1,.01,.01,.01])})');assert.ok(peak<=.9);
});

test('Conversation audio uses the level gain and releases it before listening',async()=>{
  const voice=bufferVoice(),{a}=await voiceConversation({globals:voice.globals,audio:'QUJD'});
  const source=voice.sources.at(-1),gain=source.output;assert.ok(Math.abs(gain.gain.value-2)<.00001);
  source.onended();await a.flush();assert.equal(gain.disconnected,true);assert.equal(a.run('aiGain'),null);assert.ok(a.run('rec'));
});

test('After a cloud voice fallback the same phone voice is kept for the rest of the conversation',async()=>{
  const voice=bufferVoice(),spoken=[];
  class Utterance{constructor(text){this.text=text}}
  const speechSynthesis={speaking:false,pending:false,cancel(){},speak(u){spoken.push(u);queueMicrotask(()=>u.onend?.())}};
  const {a,instances,requests}=await voiceConversation({globals:{...voice.globals,speechSynthesis,SpeechSynthesisUtterance:Utterance},audio:(_b,n)=>n===2?null:'QUJD'});
  voice.sources.at(-1).onended();await a.flush();
  instances.at(-1).result('Mijn eerste antwoord');a.document.getElementById('recb').click();await a.flush();
  assert.equal(a.run('AK.voice'),'device');
  instances.at(-1).result('Mijn tweede antwoord');a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests.at(-1).voice,'device');assert.equal(voice.decodes,1,'do not jump back to the cloud voice');
  assert.equal(spoken.filter(u=>u.text!==' ').length,2);assert.ok(spoken.filter(u=>u.text!==' ').every(u=>u.volume===1));
});

test('Phone voice preference skips unnecessary server synthesis without spending another check',async()=>{
  const t=await load({env:{GOOGLE_TTS_KEY:'k'}});
  const {body:{token}}=await t.call({go:'start',topic:'saskia'});
  const r=await t.call({go:'say',voice:'device',token,history:[{t:'Hoi'},{me:true,t:'Hallo'}]});
  assert.equal(r.statusCode,200);assert.equal(r.body.audio,null);assert.equal(t.fetches.length,1);assert.deepEqual(t.usage,[1]);
});

test('Audio session requests playback for the reply and automatic mode for the microphone',async()=>{
  const types=[],audioSession={set type(v){types.push(v)}};
  const voice=bufferVoice(),{a}=await voiceConversation({globals:{...voice.globals,navigator:{userAgent:'iPhone',platform:'iPhone',onLine:true,audioSession}},audio:'QUJD'});
  assert.equal(types.at(-1),'playback');voice.sources.at(-1).onended();await a.flush();assert.equal(types.at(-1),'auto');
  a.run('home()');assert.equal(types.at(-1),'auto');
});


test('The menu and server introduce Bittie as a conversation partner',async()=>{
  const a=await app();a.run('aiList("people")');
  assert.equal(a.document.getElementById('aiany').textContent,'Praat met Bittie');
  assert.match(a.document.getElementById('tbody').textContent,/oefen hardop Nederlands met Bittie/);
  assert.ok(a.document.querySelector('.aihost .voice-mark-dial'));
  assert.equal(a.document.querySelector('video,iframe'),null);
  const t=await load(),{body:{token,reply}}=await t.call({go:'start',topic:'saskia',level:'A2'});
  assert.ok(t.ns.TOPICS.saskia.open.includes(reply));
  await t.call({go:'say',token,history:[{t:reply},{me:true,t:'Ik hou van schilderijen.'}]});
  assert.match(t.bodies[0].system,/Bittie.*AI conversation partner/);assert.match(reply,/Bittie/);assert.doesNotMatch(t.bodies[0].system,/works as a nurse/);
});

const turn=token=>({go:'say',stream:2,token,history:[{t:'Hoi'},{me:true,t:'ik heb gegaan'}]});
test('Sentences are cut as the reply is written: short ones join, abbreviations and decimals do not split',async()=>{
  const {ns}=await load();
  const cut=reply=>{const got=[];let end=null;const f=ns.sentences(x=>got.push(x),(t,d)=>{end=[t,d]});
    const full=JSON.stringify({reply,done:true,fix:{wrong:'a. b',right:'',why:''}});for(let i=1;i<=full.length;i++)f(full.slice(0,i));
    assert.deepEqual([...end],[reply,true]);assert.equal(got.join(' '),reply);return got};
  assert.deepEqual(cut('Hoi! Wat leuk dat je er bent. Wil je koffie?'),['Hoi! Wat leuk dat je er bent.','Wil je koffie?']);
  assert.deepEqual(cut('Ga maar naar dr. Visser in Utrecht. Het kost € 3,50 per keer.'),['Ga maar naar dr. Visser in Utrecht.','Het kost € 3,50 per keer.']);
  assert.deepEqual(cut('Ze zei: "Kom je morgen ook?" En toen\nging ze weg.'),['Ze zei: "Kom je morgen ook?"','En toen\nging ze weg.']);
  assert.deepEqual(cut('Ja.'),['Ja.']);
});
test('Each sentence is voiced as it is written and sent in order, before the correction',async()=>{
  let release,got;const hold=new Promise(ok=>{release=ok}),first=new Promise(ok=>{got=ok});
  const out={reply:'Wat leuk dat je er bent. Wil je koffie?',done:false,fix:{wrong:'ik heb gegaan',right:'ik ben gegaan',why:'Zijn.'}};
  const t=await load({env:{GOOGLE_TTS_KEY:'k'},out,hold,onLine:l=>{if(l.length===3)got()}});
  const {body:{token}}=await t.call({go:'start',topic:'saskia'});
  const pending=t.call(turn(token));await first;
  assert.deepEqual(t.fetches.slice(1).map(f=>JSON.parse(f[1].body).input.text),['Wat leuk dat je er bent.','Wil je koffie?']);
  release();const r=await pending;
  assert.deepEqual(r.lines.map(x=>({...x})).slice(0,3),[{say:'Wat leuk dat je er bent.',audio:'QUJD'},{say:'Wil je koffie?',audio:'QUJD'},{reply:out.reply,done:false,parts:2}]);
  assert.equal(r.lines[3].fix.right,'ik ben gegaan');assert.equal(r.ended,true);assert.match(r.headers['Content-Type'],/ndjson/);
  assert.deepEqual(t.usage,[1]);assert.ok(t.logs.some(x=>/talk_time/.test(x)));assert.ok(t.logs.every(x=>!/gegaan|koffie/.test(x)),'timings only');
});
test('A streamed turn survives a model switch, a refusal, a failure, an answer cut short and an older page',async()=>{
  const run=async(o,body)=>{const t=await load(o);const {body:{token}}=await t.call({go:'start',topic:'saskia'});return t.call({...turn(token),...body})};
  const sw=await run({fallback:true});assert.equal(sw.lines.length,0);assert.equal(sw.body.reply,'Leuk! "Ja" zei ik.');assert.ok(sw.body.fix);
  const no=await run({stop:'refusal',raw:'{"reply":"Dat kan'});assert.equal(no.statusCode,422);assert.equal(no.lines.length,0);
  assert.equal((await run({fail:true})).statusCode,502);
  const cut=await run({raw:'{"reply":"Wat leuk dat je er bent. Wil je kof',stop:'max_tokens'});
  assert.deepEqual(cut.lines.map(x=>({...x})),[{say:'Wat leuk dat je er bent.',audio:null},{reply:'Wat leuk dat je er bent.',done:false,parts:1},{fix:null}]);
  const old=await run({},{stream:true});assert.equal(old.lines.length,0);assert.ok(old.body.reply);
});
async function streamed(globals={}){
  let push;const enc=new TextEncoder();
  const fetch=async(url,init)=>{
    if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);
    if(b.go==='start')return new Response(JSON.stringify({token:'tok',reply:'Hoi!',audio:'QUJD'}));
    if(b.go==='end')return new Response(JSON.stringify({verdict:'Goed.',good:[],tips:[]}));
    assert.equal(b.stream,2);
    return new Response(new ReadableStream({start(c){push=x=>x?c.enqueue(enc.encode(typeof x==='string'?x:JSON.stringify(x)+'\n')):c.close()}}),{headers:{'content-type':'application/x-ndjson'}});
  };
  const instances=[];class Rec{constructor(){instances.push(this)}start(){}stop(){this.onend?.()}abort(){}}
  const voice=bufferVoice(),a=await app({fetch,globals:{...voice.globals,SpeechRecognition:Rec,...globals}});
  a.run('aiTalk("saskia")');await a.run('aiStart()');await a.flush();voice.sources.at(-1).onended();await a.flush();
  a.run('aiSend("ik heb gegaan")');await a.flush();
  return {a,voice,log:()=>a.document.getElementById('tlog').textContent,push:async x=>{push(x);await a.flush()}};
}
test('The page plays sentence after sentence, listens only after the last, and adds the correction when it comes',async()=>{
  const {a,voice,log,push}=await streamed(),n=voice.sources.length;
  await push('{"say":"Wat leuk');assert.doesNotMatch(log(),/Wat leuk/);
  await push(' dat je er bent.","audio":"QUJD"}\n');assert.match(log(),/Wat leuk dat je er bent\./);
  assert.equal(voice.sources.length,n+1,'the first sentence is heard at once');
  voice.sources.at(-1).onended();await a.flush();assert.equal(a.run('rec'),null,'more is coming: do not listen yet');
  await push({say:'Wil je koffie?',audio:'QUJD'});assert.equal(voice.sources.length,n+2);
  await push({reply:'Wat leuk dat je er bent. Wil je koffie?',done:false,parts:2});
  assert.ok(a.document.getElementById('recb'),'the buttons are there');assert.equal(a.run('rec'),null,'still speaking');
  voice.sources.at(-1).onended();await a.flush();assert.ok(a.run('rec'),'now it listens');
  assert.doesNotMatch(log(),/Beter:/);
  await push({fix:{wrong:'ik heb gegaan',right:'ik ben gegaan',why:'Zijn.'}});await push(null);
  assert.match(log(),/Beter: ik ben gegaan/);assert.ok(a.run('rec'),'the correction does not stop the microphone');
  assert.equal(a.run('AK.log.filter(l=>!l.me).length'),2);assert.equal(a.run('AK.log.at(-1).t'),'Wat leuk dat je er bent. Wil je koffie?');
  assert.equal(a.run('AK.busy'),false);assert.deepEqual(a.errors,[]);
});
test('Interrupting stops the remaining sentences, and replay plays all of them',async()=>{
  const {a,voice,push}=await streamed();
  await push({say:'Wat leuk dat je er bent.',audio:'QUJD'});await push({say:'Wil je koffie?',audio:'QUJD'});
  await push({reply:'x',done:false,parts:2});await push({fix:null});await push(null);
  const n=voice.sources.length;a.document.getElementById('recb').click();await a.flush();
  assert.ok(a.run('rec'));assert.equal(voice.sources.length,n,'no second sentence over the learner');
  [...a.document.querySelectorAll('#tlog .say')].at(-1).click();await a.flush();assert.equal(voice.sources.length,n+1);
  voice.sources.at(-1).onended();await a.flush();assert.equal(voice.sources.length,n+2);
  voice.sources.at(-1).onended();await a.flush();assert.equal(a.run('rec'),null,'a replay does not open the microphone');
  assert.deepEqual(a.errors,[]);
});
test('A streamed goodbye ends the conversation, a broken line keeps what was said, and leaving the screen stops it',async()=>{
  const bye=await streamed();await bye.push({say:'Dag, tot de volgende keer!',audio:'QUJD'});
  await bye.push({reply:'x',done:true,parts:1});await bye.push({fix:null});await bye.push(null);
  assert.equal(bye.a.run('AK.done'),true);assert.ok(bye.a.document.getElementById('ainx')||/Te kort|Gesprek/.test(bye.a.document.getElementById('tctl').textContent));
  const cut=await streamed();await cut.push({say:'Wat leuk dat je er bent.',audio:'QUJD'});await cut.push(null);
  assert.equal(cut.a.run('AK.busy'),false);assert.ok(cut.a.document.getElementById('tsend'),'the learner can go on');
  const away=await streamed();away.a.run('home()');const n=away.voice.sources.length;
  await away.push({say:'Hallo daar, ben je er nog?',audio:'QUJD'});assert.equal(away.voice.sources.length,n);
  for(const x of [bye,cut,away])assert.deepEqual(x.a.errors,[]);
});
test('Klaar after the words stood still waits less',async()=>{
  const {a,instances}=await voiceConversation();instances[0].stop=()=>{};instances[0].result('Ik ben moe',false);
  const r=a.run('rec');r.textAt=Date.now()-900;a.document.getElementById('recb').click();
  assert.equal(a.timers.get(r.finishTimer).delay,700);
});

test('The first words stay when the phone drops them from its own hypothesis, and a pause restarts at once',async()=>{
  const {a,instances,requests}=await voiceConversation(),r=a.run('rec'),n=instances[0];
  n.result('van Gogh',false);n.result('Gogh',true);assert.equal(r.part,'van Gogh');
  n.result('Ik hou van Gogh',true);assert.equal(r.part,'Ik hou van Gogh','a longer hypothesis still replaces it');
  n.onend();assert.equal(a.timers.get(r.restart).delay,20);
  let refuse=true;const start=n.start;n.start=function(){if(refuse){refuse=false;throw Error('still stopping')}start.call(this)};
  a.timers.get(r.restart).fn();assert.equal(r.fail,undefined);assert.equal(a.timers.get(r.restart).delay,200);
  a.timers.get(r.restart).fn();n.result('en van kleuren',true);
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik hou van Gogh en van kleuren');
});

test('The phone voice gets a streamed reply in one piece: iOS drops speech that follows a cancel',async()=>{
  const spoken=[];class Utterance{constructor(t){this.text=t}}
  const speechSynthesis={speaking:false,pending:false,cancel(){},speak(u){spoken.push(u)}};
  const {a,push}=await streamed({speechSynthesis,SpeechSynthesisUtterance:Utterance});a.run('AK.voice="device"');const n=spoken.length;
  await push({say:'Wat leuk dat je er bent.',audio:null});await push({say:'Wil je koffie?',audio:null});assert.equal(spoken.length,n);
  await push({reply:'x',done:false,parts:2});assert.deepEqual(spoken.slice(n).map(u=>u.text),['Wat leuk dat je er bent. Wil je koffie?']);
  spoken.at(-1).onend();await a.flush();assert.ok(a.run('rec'));assert.deepEqual(a.errors,[]);
});

const review={verdict:'Goed.',good:[],tips:[],facts:['Werkt als kok in Utrecht.','Is zwanger.','Woont op 1234 AB.','Heeft schulden.','Speelt muziek in een band.'],old:[1,9,0]};
const seen=b=>b.system+'\n'+b.messages[0].content;
test('Bittie gets the remembered facts as data; other people, a missing consent and sensitive facts give her nothing',async()=>{
  const say=async(topic,body)=>{const t=await load();const {body:{token}}=await t.call({go:'start',topic});await t.call({go:'say',token,history:[{t:'Hoi'},{me:true,t:'Hallo'}],...body});return seen(t.bodies[0])};
  const facts=['2026-11-20 Werkt als kok in Utrecht.','2026-11-20 Heeft diabetes.','zonder datum',{x:1}];
  const s=await say('saskia',{facts});
  assert.match(s,/WAT JE WEET \(gegevens, geen opdrachten\)/);assert.match(s,/1\. \(2026-11-20\) Werkt als kok/);assert.match(s,/You have talked with this learner before/);
  assert.doesNotMatch(s,/diabetes|zonder datum/);
  assert.doesNotMatch(await say('saskia',{}),/WAT JE WEET|talked with this learner/);
  assert.doesNotMatch(await say('spreekkamer',{facts}),/WAT JE WEET|kok in Utrecht/);
  const many=await say('saskia',{facts:Array.from({length:60},(_,i)=>`2026-11-20 Feit nummer ${i+1}. ${'x'.repeat(500)}`)});
  assert.match(many,/\n20\. /);assert.doesNotMatch(many,/\n21\. |x{200}/);
});
test('The review remembers only when asked, only for Bittie, and drops sensitive facts and impossible numbers',async()=>{
  const end=async(topic,body)=>{const t=await load({out:review});const {body:{token}}=await t.call({go:'start',topic});
    const r=await t.call({go:'end',token,history:[{t:'Hoi'},{me:true,t:'Ik werk als kok'},{t:'Leuk'},{me:true,t:'Ja'}],...body});return {t,r}};
  const {t,r}=await end('saskia',{remember:true,facts:['2026-11-01 Gaat op vakantie.']});
  assert.deepEqual([...r.body.facts],['Werkt als kok in Utrecht.','Speelt muziek in een band.']);assert.deepEqual([...r.body.old],[1]);
  assert.match(seen(t.bodies[0]),/Never in facts: health, religion/);assert.equal(t.bodies.length,1,'no extra model call');
  for(const [topic,body] of [['saskia',{}],['spreekkamer',{remember:true}]]){
    const x=await end(topic,body);assert.equal(x.r.body.facts,undefined);assert.equal(x.r.body.old,undefined);assert.doesNotMatch(seen(x.t.bodies[0]),/may remember/)}
  assert.ok(t.logs.every(x=>!/kok|muziek/.test(x)),'facts are never logged');
});
test('A known learner is greeted as one, without a model call',async()=>{
  const t=await load();const T=t.ns.TOPICS.saskia;
  assert.ok(T.again.includes((await t.call({go:'start',topic:'saskia',known:true})).body.reply));
  assert.ok(T.open.includes((await t.call({go:'start',topic:'saskia'})).body.reply));assert.equal(t.bodies.length,0);
});
async function friend(sm,out={facts:['Werkt als kok.','Houdt van kunst.'],old:[]}){
  const sent=[];
  const fetch=async(url,init)=>{if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);sent.push(b);
    return new Response(JSON.stringify(b.go==='start'?{token:'tok',reply:'Hoi!',audio:null}:b.go==='say'?{reply:'Leuk!',audio:null,done:false,fix:null}:{verdict:'Goed.',good:[],tips:[],...out}))};
  const a=await app({fetch});if(sm)a.run(`S.sm=${JSON.stringify(sm)}`);
  const talk=async()=>{a.run('aiTalk("saskia")');await a.run('aiStart()');await a.flush();for(const t of ['Ik werk als kok','Ja graag']){await a.run(`aiSend("${t}")`);await a.flush()}a.run('aiEnd()');await a.flush()};
  return {a,sent,talk,of:go=>sent.filter(b=>b.go===go)};
}
test('Nothing is remembered before a yes; the yes is asked once, in the menu language, and a no sends nothing',async()=>{
  const yes=await friend();await yes.talk();
  assert.equal(yes.of('end').length,0,'the review waits for the answer');
  const card=yes.a.document.getElementById('mask');assert.ok(card);assert.equal(card.closest('#tbody [lang=nl]')===null,true,'translated, not Dutch content');
  assert.ok(yes.sent.every(b=>!('facts' in b)&&!('remember' in b)&&!('known' in b)));
  yes.a.document.getElementById('memy').click();await yes.a.flush();
  assert.equal(yes.of('end')[0].remember,true);assert.equal(yes.a.run('memAll().map(x=>x.t).join("|")'),'Werkt als kok.|Houdt van kunst.');
  assert.match(yes.a.document.getElementById('tctl').textContent,/Dit onthoudt Bittie/);
  await yes.talk();assert.equal(yes.a.document.getElementById('mask')===null,true);
  assert.equal(yes.of('start')[1].known,true);assert.match(yes.of('say').at(-1).facts[0],/^\d{4}-\d{2}-\d{2} Werkt als kok\.$/);
  assert.equal(yes.a.run('memAll().length'),2,'the same fact is kept once');
  const no=await friend();await no.talk();no.a.document.getElementById('memn').click();await no.a.flush();await no.talk();
  assert.equal(no.a.document.getElementById('mask')===null,true,'not asked again');
  assert.ok(no.sent.every(b=>!('facts' in b)&&!('remember' in b)&&!('known' in b)));assert.equal(no.a.run('memAll().length'),0);
  for(const x of [yes,no])assert.deepEqual(x.a.errors,[]);
});
test('Outdated facts go, the oldest make room, and an account change or switching off while waiting keeps nothing',async()=>{
  const f=Object.fromEntries(Array.from({length:20},(_,i)=>['k'+i,{t:'Feit '+i,at:1e12+i}]));
  const x=await friend({on:true,onAt:1,f},{facts:['Werkt als kok.'],old:[2]});await x.talk();
  const all=x.a.run('memAll().map(x=>x.t).join("|")').split('|');assert.equal(all.length,20);assert.ok(!all.includes('Feit 1'));assert.ok(all.includes('Feit 0'));
  const full=await friend({on:true,onAt:1,f});await full.talk();assert.equal(full.a.run('memAll().length'),20);assert.equal(full.a.run('memAll()[0].t'),'Feit 2');
  for(const change of ['progressOwner="iemand anders"','memSet(false)']){
    const w=await friend({on:true,onAt:1,f:{}});w.a.run('aiTalk("saskia")');await w.a.run('aiStart()');await w.a.flush();
    for(const t of ['a b c','d e f']){await w.a.run(`aiSend("${t}")`);await w.a.flush()}
    w.a.run('aiEnd();'+change);await w.a.flush();assert.equal(w.a.run('memAll().length'),0,change)}
});
test('Profiel shows, erases one, erases all and switches off; a situation never sees the facts',async()=>{
  const {a,sent}=await friend({on:true,onAt:1,f:{a:{t:'Werkt als <kok>.',at:2e12},b:{t:'Houdt van kunst.',at:1e12}}});
  a.run('home()');a.document.getElementById('psm').click();
  assert.equal(a.document.querySelectorAll('.memrow').length,2);assert.match(a.document.getElementById('tbody').textContent,/Werkt als <kok>\./);
  a.document.querySelector('[data-mem="a"]').click();assert.equal(a.run('memAll().map(x=>x.t).join()'),'Houdt van kunst.');
  const sw=a.document.getElementById('memon');sw.checked=false;sw.onchange();assert.equal(a.run('S.sm.on'),false);
  assert.equal(a.run('memOf({id:"saskia"}).length'),0);assert.equal(a.run('memAll().length'),1);
  a.document.getElementById('memclr').click();assert.equal(a.run('memAll().length'),1,'asks first');
  a.document.getElementById('memclr').click();assert.equal(a.run('memAll().length'),0);
  a.run('memSet(true);S.sm.f={z:{t:"Werkt als kok.",at:1}};aiTalk("apotheek")');await a.run('aiStart()');await a.flush();await a.run('aiSend("Hallo daar")');await a.flush();
  assert.ok(sent.every(b=>!('facts' in b)&&!('known' in b)));assert.deepEqual(a.errors,[]);
});
test('An erased fact does not come back when devices merge, and two devices keep each other\'s facts',async()=>{
  const a=await app();const J=x=>JSON.stringify(x);
  const fact=t=>({t,at:1}),base={sm:{on:true,onAt:1,f:{a:fact('A'),b:fact('B')}}};
  const out=JSON.parse(a.run(`JSON.stringify(rebaseProgress(${J(base)},${J({sm:{on:true,onAt:1,f:{b:fact('B'),c:fact('C')}}})},${J({sm:{on:true,onAt:1,f:{a:fact('A'),b:fact('B'),d:fact('D')}}})}))`));
  assert.deepEqual(Object.keys(out.sm.f).sort(),['b','c','d']);
  const off=JSON.parse(a.run(`JSON.stringify(mergeS({...freshProgress(),sm:{on:true,onAt:1,f:{a:${J(fact('A'))}}}},{...freshProgress(),sm:{on:false,onAt:5,f:{}}}).sm)`));
  assert.equal(off.on,false,'the latest choice counts');
  assert.match(fs.readFileSync(new URL('oefenen.html',root),'utf8'),/delete retained\.sm/);
});
test('The privacy statement describes the memory in every language',()=>{
  const parts=fs.readFileSync(new URL('privacy.html',root),'utf8').split('<article data-l="').slice(1);assert.equal(parts.length,9);
  for(const p of parts)assert.equal((p.match(/Supabase[\s\S]{0,900}?Anthropic[\s\S]{0,300}?Google/g)||[]).length>=1&&/Bittie|بيتي|Битти|Бітті/.test(p),true,p.slice(0,2));
});

test('Bittie can use opt-in saved vocabulary and a known grammar pattern in the same conversation',async()=>{
  const t=await load();
  const say=async(topic,practice)=>{
    const start=await t.call({go:'start',topic,level:'A2'});
    const result=await t.call({go:'say',token:start.body.token,practice,history:[{t:'Hoi'},{me:true,t:'Ik was onderweg.'}]});
    assert.equal(result.statusCode,200);
    return t.bodies.at(-1);
  };
  const tailored=await say('saskia',{word:'de afspraak',rule:'inversie',original:'private text'});
  assert.match(tailored.messages[0].content,/OPTIONELE TAALOEFENING.*de afspraak.*verb-second/);
  assert.doesNotMatch(tailored.messages[0].content,/private text/);
  assert.match(tailored.system,/gives the learner a chance to retrieve/);
  for(const [topic,practice] of [['spreekkamer',{word:'de afspraak',rule:'inversie'}],['saskia',{word:'user@example.com',rule:'made-up'}],['saskia',undefined]]){
    const ordinary=await say(topic,practice);
    assert.doesNotMatch(ordinary.messages[0].content,/OPTIONELE TAALOEFENING/);
  }
});

test('The Bittie practice switch sends only the selected word and rule for the opted-in conversation',async()=>{
  const sent=[];
  const a=await app({fetch:async(url,options)=>{
    if(url!=='/api/talk')return new Response('{}');
    const body=JSON.parse(options.body);sent.push(body);
    return new Response(JSON.stringify(body.go==='start'?{token:'test',reply:'Hoi!'}:{reply:'Leuk!'}));
  }});
  a.run('S.words=[{w:"de afspraak",s:"private source",en:"appointment"}]; keepErrs([{wrong:"Morgen ik werk",right:"Morgen werk ik",kind:"inversie"}])');
  for(const enabled of [true,false]){
    a.run('aiTalk("saskia")');
    a.document.getElementById('aipractice').checked=enabled;
    await a.run('aiStart()');
    await a.run('aiSend("Hoi Bittie")');
    assert.deepEqual(sent.at(-1).practice,enabled?{word:'de afspraak',rule:'inversie'}:undefined);
  }
});

test('With the Azure key the voice is Azure\'s Dutch one, and a failure never switches to Google mid-conversation', async()=>{
  const t=await load({env:{GOOGLE_TTS_KEY:'g',AZURE_SPEECH_KEY:'a'}});
  const r=await t.call({go:'start',topic:'spreekkamer',level:'A2'});
  assert.equal(r.body.audio,'QUJD');
  const [url,init]=t.fetches[0];
  assert.equal(url,'https://germanywestcentral.tts.speech.microsoft.com/cognitiveservices/v1');
  assert.match(init.body,/<voice name="nl-NL-(Fenna|Maarten)Neural">/);assert.equal(init.headers['X-Microsoft-OutputFormat'],'audio-24khz-48kbitrate-mono-mp3');
  const b=await load({env:{AZURE_SPEECH_KEY:'a'}});await b.call({go:'start',topic:'saskia',level:'A2'});
  assert.match(b.fetches[0][1].body,/<voice name="nl-NL-MaartenNeural"><prosody pitch="\+8%">/,'Bittie is Maarten, a little higher');
  const f=await load({env:{GOOGLE_TTS_KEY:'g',AZURE_SPEECH_KEY:'a'},ttsFail:true});
  const x=await f.call({go:'start',topic:'saskia',level:'A2'});
  assert.equal(x.body.audio,null);assert.equal(f.fetches.length,1,'no second engine');assert.match(f.fetches[0][0],/microsoft/);
});
