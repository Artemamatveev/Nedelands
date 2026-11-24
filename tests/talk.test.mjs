// Gesprekken with AI (api/_talk.js through /api/check?kind=talk): one check per conversation, a signed ticket for the
// turns after it, the prompt built on the server, Google's voice optional; and the page's topics match the server's.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {root,app} from './app-harness.mjs';

async function load(options={}){
  const usage=[],quotas=[],bodies=[],fetches=[],logs=[];
  class APIError extends Error{}
  class AuthenticationError extends APIError{}
  class RateLimitError extends APIError{}
  class Anthropic {
    static APIError=APIError;static AuthenticationError=AuthenticationError;static RateLimitError=RateLimitError;
    beta={messages:{create:async(body)=>{bodies.push(body);
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
    plusFor:async()=>options.plan||null,coversLevel:(p,l)=>!!p&&(p.level==='B1'||l==='A2'),
    talkSign:x=>crypto.createHmac('sha256','test-secret').update('bittertalen-talk|'+x).digest('base64url'),
  };
  const context=vm.createContext({process:{env:{ANTHROPIC_API_KEY:'test-only',...(options.env||{})}},Buffer,Date,AbortSignal,
    console:{info:x=>logs.push(x),error:(...x)=>logs.push(x.join(' '))},
    fetch:async(url,init)=>{fetches.push([url,init]);return {ok:true,json:async()=>({audioContent:'QUJD'})}}});
  const sdk=new vm.SyntheticModule(['default'],function(){this.setExport('default',Anthropic)},{context});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context});
  const cr=new vm.SyntheticModule(['timingSafeEqual'],function(){this.setExport('timingSafeEqual',crypto.timingSafeEqual)},{context});
  const mod=new vm.SourceTextModule(fs.readFileSync(new URL('api/_talk.js',root),'utf8'),{context});
  const scenes=new vm.SourceTextModule(fs.readFileSync(new URL('api/_scenes.js',root),'utf8'),{context});
  await mod.link(n=>n==='@anthropic-ai/sdk'?sdk:n==='node:crypto'?cr:n==='./_scenes.js'?scenes:supa);await mod.evaluate();
  const call=async body=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(){}};
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

test('The main conversation always opens Saskia with her approved human portrait; legacy avatars remain readable',async()=>{
  const a=await app();
  for(let i=0;i<3;i++){a.run('aiAny()');assert.equal(a.run('AK.c.id'),'saskia')}
  assert.equal(a.document.querySelector('#aiav img').getAttribute('src'),'/art/characters/saskia-museum-v1.jpg');
  assert.ok(a.document.querySelector('.aiportrait'),'the human portrait is a full card rather than a plush circle');
  assert.match(a.document.querySelector('#tbody h2').textContent,/Saskia/);
  assert.equal(a.run('aiIds().filter(id=>PEOPLE.some(p=>p.id===id)).join(",")'),'saskia');
  assert.ok(fs.existsSync(new URL('art/characters/saskia-museum-v1.jpg',root)));
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

test('A random person greets at once; a situation waits until the learner has read the task', async()=>{
  const sent=[];
  const fetch=async(url,init)=>{if(url!=='/api/talk')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const b=JSON.parse(init.body);sent.push(b);return new Response(JSON.stringify({token:'tok',reply:'Hoi!',audio:null,left:1,limit:2,period:'once'}))};
  const a=await app({fetch});
  a.run('aiAny()');await a.flush();
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
  check();assert.ok(a.run('rec')===r,'still the same answer');assert.equal(instances.length,2);assert.equal(instances[0].onresult,null);
  instances[1].onstart();instances[1].onspeechstart();check();assert.equal(instances.length,3,'a voice without words: replaced at once');
  instances[2].onstart();instances[2].result('Ik heb even nagedacht');check();
  a.document.getElementById('recb').click();await a.flush();
  assert.equal(requests[1].history.at(-1).t,'Ik heb even nagedacht');
});

test('A recogniser that stays deaf ends with a retry and says why',async()=>{
  const {a,instances}=await voiceConversation(),r=a.run('rec');
  for(let i=0;i<12&&!r.fin;i++){instances.at(-1).onstart?.();a.timers.get(r.watchTimer).fn();await a.flush()}
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
  native.onstart();assert.match(a.document.getElementById('recn').textContent,/Tik op Klaar/);
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


test('Saskia menu and conversation identify the museum host without claiming a live video connection',async()=>{
  const a=await app();a.run('aiList("people")');
  assert.equal(a.document.getElementById('aiany').textContent,'Praat met Saskia');
  assert.match(a.document.getElementById('tbody').textContent,/museumcafé/);
  assert.equal(a.document.querySelector('.aihost img').getAttribute('src'),'/art/characters/saskia-museum-v1.jpg');
  assert.equal(a.document.querySelector('video,iframe'),null);
  const t=await load(),{body:{token,reply}}=await t.call({go:'start',topic:'saskia',level:'A2'});
  assert.ok(t.ns.TOPICS.saskia.open.includes(reply));
  await t.call({go:'say',token,history:[{t:reply},{me:true,t:'Ik hou van schilderijen.'}]});
  assert.match(t.bodies[0].system,/museum cafe/);assert.doesNotMatch(t.bodies[0].system,/works as a nurse/);
});
