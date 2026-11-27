// Zeg het na with Azure Speech (api/_pron.js through /api/check?kind=pron): signed-in only, a day's allowance and a
// shared ceiling in seconds, the model text in the Pronunciation-Assessment header; and the page's word marks.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root,app} from './app-harness.mjs';

const wav=(secs,rate=16000)=>{const n=Math.round(secs*rate),b=Buffer.alloc(44+n*2);
  b.write('RIFF',0,'ascii');b.writeUInt32LE(36+n*2,4);b.write('WAVE',8,'ascii');b.write('fmt ',12,'ascii');b.writeUInt32LE(16,16);
  b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);
  b.write('data',36,'ascii');b.writeUInt32LE(n*2,40);return b};
const AZURE={RecognitionStatus:'Success',NBest:[{PronunciationAssessment:{AccuracyScore:71,FluencyScore:88,CompletenessScore:100,PronScore:76},
  Words:[{Word:'ik',PronunciationAssessment:{AccuracyScore:98,ErrorType:'None'}},{Word:'ga',PronunciationAssessment:{AccuracyScore:93,ErrorType:'None'}},
    {Word:'met',PronunciationAssessment:{AccuracyScore:70,ErrorType:'None'}},{Word:'de',PronunciationAssessment:{AccuracyScore:0,ErrorType:'Omission'}},
    {Word:'eh',PronunciationAssessment:{AccuracyScore:0,ErrorType:'Insertion'}},{Word:'trein',PronunciationAssessment:{AccuracyScore:41,ErrorType:'Mispronunciation'}}]}]};

async function load(options={}){
  const guards=[],spend=[],fetches=[];
  const values={accounts:true,caller:async()=>options.guest?null:{id:'user-1'},addSpend:async(m,u)=>{spend.push([m,u.input_tokens]);return true},
    amsterdamDay:()=>'2026-11-27',
    useGuard:async(k,_d,cost,lim)=>{guards.push([k,cost]);const g=options.guard?.[k.split(':')[1]==='all'?'all':'user'];return g??lim-cost}};
  const context=vm.createContext({process:{env:{AZURE_SPEECH_KEY:'test-only',...(options.env||{})}},Buffer,AbortSignal,console:{error(){}},
    fetch:async(url,init)=>{fetches.push([url,init]);if(options.fail)return {ok:false,status:500,json:async()=>({})};
      return {ok:true,json:async()=>options.azure||AZURE}}});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context});
  const mod=new vm.SourceTextModule(fs.readFileSync(new URL('api/_pron.js',root),'utf8'),{context});
  await mod.link(()=>supa);await mod.evaluate();
  const call=async body=>{const res={statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v}};
    await mod.namespace.pron({method:'POST',headers:{},body},res);return res};
  return {call,guards,spend,fetches,ns:mod.namespace};
}
const audio=wav(2.2).toString('base64');
const plain=x=>JSON.parse(JSON.stringify(x)); // objects from the module's own realm

test('A signed-in learner gets Azure scores per word; the model text goes in the assessment header', async()=>{
  const t=await load();
  const r=await t.call({text:'Ik ga met de trein.',audio});
  assert.equal(r.statusCode,200);assert.equal(r.headers['Cache-Control'],'private, no-store');
  assert.deepEqual(plain(r.body.scores),{accuracy:71,fluency:88,completeness:100,pron:76});
  assert.equal(r.body.heard,true);assert.equal(r.body.left,29);
  assert.deepEqual(plain(r.body.words.map(w=>w.e)),['None','None','None','Omission','Insertion','Mispronunciation']);
  assert.deepEqual(t.guards,[['pron:user-1',1],['pron:all',3]],'one check a day and the seconds, rounded up, for everyone');
  const [url,init]=t.fetches[0];
  assert.match(url,/^https:\/\/germanywestcentral\.stt\.speech\.microsoft\.com\/.*language=nl-NL/);
  assert.equal(init.headers['Content-Type'],'audio/wav; codecs=audio/pcm; samplerate=16000');
  const pa=JSON.parse(Buffer.from(init.headers['Pronunciation-Assessment'],'base64').toString('utf8'));
  assert.equal(pa.ReferenceText,'Ik ga met de trein.');assert.equal(pa.EnableMiscue,true);
  assert.deepEqual(t.spend,[['azure-speech-pron',3]]);
});

test('Guests, a missing key, bad audio and a used-up day never reach Azure', async()=>{
  assert.equal((await (await load({guest:true})).call({text:'Hallo',audio})).statusCode,401);
  assert.equal((await (await load({env:{AZURE_SPEECH_KEY:''}})).call({text:'Hallo',audio})).statusCode,503);
  const t=await load();
  for(const body of [{text:'Hallo',audio:wav(0.1).toString('base64')},{text:'Hallo',audio:wav(31).toString('base64')},
    {text:'Hallo',audio:wav(2,44100).toString('base64')},{text:'',audio},{text:'x'.repeat(401),audio}])
    assert.equal((await t.call(body)).statusCode,400);
  assert.equal(t.fetches.length,0);
  const day=await load({guard:{user:-1}});
  const r=await day.call({text:'Hallo',audio});
  assert.equal(r.statusCode,429);assert.equal(r.body.error,'limit');assert.equal(day.fetches.length,0);
  const busy=await load({guard:{all:-1}});
  assert.equal((await busy.call({text:'Hallo',audio})).body.error,'busy');
  assert.deepEqual(busy.guards,[['pron:user-1',1],['pron:all',3],['pron:user-1',-1]],'a full day gives the learner\'s check back');
});

test('A failed Azure call gives the check and the seconds back', async()=>{
  const t=await load({fail:true});
  const r=await t.call({text:'Hallo',audio});
  assert.equal(r.statusCode,502);
  assert.deepEqual(t.guards.slice(2).sort(),[['pron:all',-3],['pron:user-1',-1]]);assert.deepEqual(t.spend,[]);
});

test('Azure answers without speech, or with flat scores, are read safely', async()=>{
  const t=await load();
  assert.deepEqual(plain(t.ns.readAssessment({RecognitionStatus:'NoMatch'})),{heard:false});
  const flat=t.ns.readAssessment({RecognitionStatus:'Success',NBest:[{AccuracyScore:'90.4',FluencyScore:120,CompletenessScore:-3,PronScore:88,
    Words:[{Word:'hoi',AccuracyScore:90,ErrorType:'Weird'}]}]});
  assert.deepEqual(plain(flat.scores),{accuracy:90,fluency:100,completeness:0,pron:88});assert.deepEqual(plain(flat.words),[{w:'hoi',s:90,e:'None'}]);
  assert.equal(t.ns.wavSeconds(wav(1.5)),1.5);assert.equal(t.ns.wavSeconds(Buffer.from('nope')),0);
});

test('The route is a rewrite to check.js, and config tells the page', ()=>{
  const v=JSON.parse(fs.readFileSync(new URL('vercel.json',root),'utf8'));
  assert.ok(v.rewrites.some(r=>r.source==='/api/pron'&&r.destination==='/api/check?kind=pron'));
  assert.match(fs.readFileSync(new URL('api/check.js',root),'utf8'),/kind === "pron"/);
  assert.match(fs.readFileSync(new URL('api/config.js',root),'utf8'),/pronOn \? \{ pron:/);
  const p=fs.readFileSync(new URL('privacy.html',root),'utf8');
  assert.equal((p.match(/Zeg het na[^<]*Azure AI Speech/g)||[]).length,9,'privacy.html names Azure for Zeg het na in all nine languages');
  assert.equal((p.match(/Azure AI Speech[^<]*Cloud Text-to-Speech/g)||[]).length,9,'and for the conversation voices, next to Google');
});

// The page: a recorder instead of the phone's recognition, Azure's words onto the model text
async function page(answer){
  const posts=[];
  class MediaRecorder{constructor(){this.state='inactive';this.mimeType='audio/mp4'}
    start(){this.state='recording'} stop(){this.state='inactive';this.ondataavailable?.({data:{size:10}});this.onstop?.()}}
  const a=await app({globals:{
    navigator:{userAgent:'test',platform:'test',storage:{persist:async()=>false},onLine:true,
      mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}},
    MediaRecorder,OfflineAudioContext:class{},SpeechRecognition:class{start(){}stop(){}abort(){}},
    fetch:async(url,init)=>{if(url==='/api/pron'){posts.push(JSON.parse(init.body));return new Response(JSON.stringify(answer.body),{status:answer.status||200})}
      return new Response(JSON.stringify(url==='/api/config'?{}:[]))},
  }});
  a.run(`acc.cfg={pron:{day:30,seconds:30}};acc.user={id:'u'};acc.sb={auth:{getSession:async()=>({data:{session:{access_token:'t'}}})}};
    pronWav=async()=>'UklGRg==';URL.createObjectURL=()=>'blob:x';URL.revokeObjectURL=()=>{}`);
  a.run('build("sp",{...SEC.find(s=>s.id==="sp"),n:1,keep:1,pool:()=>[{...ITEMS.find(q=>q.k==="sp|3"),right:"Ik ga met de trein."}]});reveal(queue[pos])');
  return {a,posts,item:id=>a.document.getElementById(id)};
}

test('Zeg het na sends the recording and marks weak and missing words', async()=>{
  const {a,posts,item}=await page({body:{heard:true,scores:{accuracy:71,fluency:88,completeness:100,pron:76},left:29,
    words:[{w:'ik',s:98,e:'None'},{w:'ga',s:93,e:'None'},{w:'met',s:70,e:'None'},{w:'de',s:0,e:'Omission'},{w:'eh',s:0,e:'Insertion'},{w:'trein',s:41,e:'Mispronunciation'}]}});
  assert.match(item('echo').parentElement.textContent,/per woord een score/);
  item('echo').click();await a.flush();
  item('echo').click();await a.flush();
  assert.deepEqual(posts,[{text:'Ik ga met de trein.',audio:'UklGRg=='}]);
  const out=item('echor');
  assert.match(out.textContent,/Uitspraak: 76 van 100/);assert.match(out.textContent,/geen examencijfer/);
  assert.deepEqual([...out.querySelectorAll('.miss')].map(m=>[m.textContent,m.classList.contains('mid')]),[['met',true],['de',false],['trein',false]]);
});

test('A used-up day sends the rest of the visit back to the phone\'s recognition', async()=>{
  const {a,item}=await page({status:429,body:{error:'limit'}});
  item('echo').click();await a.flush();item('echo').click();await a.flush();
  assert.match(item('echor').textContent,/uitspraakcontroles van vandaag zijn op/);
  assert.equal(a.run('pronOn()'),false);
});
