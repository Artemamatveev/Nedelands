import test from 'node:test';
import assert from 'node:assert/strict';
import {app,storage} from './app-harness.mjs';

function speech(){
  const instances=[];
  class Recognition{
    constructor(){instances.push(this);this.starts=0;this.stops=0;this.aborts=0}
    start(){this.starts++}
    stop(){this.stops++;if(this.throwStop)throw Error('native stop failed')}
    abort(){this.aborts++;this.onend?.()}
    result(text){this.onresult?.({results:[[{transcript:text}]]})}
    end(){this.onend?.()}
  }
  return {Recognition,instances};
}
async function exam(part='sp'){
  const native=speech(),a=await app({globals:{SpeechRecognition:native.Recognition}});
  a.run(`startExam(${JSON.stringify(part)},true)`);
  a.document.getElementById('recb').click();await a.flush();
  return {a,native,r:a.run('rec')};
}
function finishFallback(a,r){const timer=a.timers.get(r.finishTimer);assert.ok(timer);timer.fn()}

test('Speaking Stop immediately acknowledges the tap, accepts final words and enables Next once',async()=>{
  const {a,native,r}=await exam(),n=native.instances[0],b=a.document.getElementById('recb');
  n.result('Ik heb een broer');assert.match(b.textContent,/Antwoord klaar/);assert.match(a.document.getElementById('recn').textContent,/Tik op Antwoord klaar/);b.click();
  assert.equal(b.disabled,true);assert.match(b.textContent,/afronden/);assert.equal(r.stopping,true);
  n.result('Ik heb een broer en een zus');n.end();
  assert.equal(b.disabled,false);assert.match(b.textContent,/Volgende vraag/);
  assert.match(a.document.getElementById('recn').textContent,/Antwoord klaar/);
  assert.equal(a.document.getElementById('rect').textContent,'Klaar');assert.equal(a.run('cur.ans[0].text'),'Ik heb een broer en een zus');
  n.end();a.run('recEnd(true)');assert.equal(a.run('cur.ans.length'),1);assert.equal(a.run('pos'),0);
  b.click();assert.equal(a.run('pos'),1);assert.equal(a.run('cur.ans.length'),1);
});

test('Speaking missing end event finishes within the fallback and preserves the last transcript',async()=>{
  const {a,native,r}=await exam(),n=native.instances[0];n.result('Mijn ouders wonen in Nederland');
  a.document.getElementById('recb').click();assert.equal(a.timers.get(r.finishTimer).delay,800);finishFallback(a,r);
  assert.equal(a.run('cur.ans[0].text'),'Mijn ouders wonen in Nederland');assert.equal(n.aborts,1);assert.equal(a.run('sr'),null);
  a.document.getElementById('recb').click();a.document.getElementById('recb').click();await a.flush();
  assert.equal(native.instances.length,2);n.result('Late woorden');n.end();
  assert.equal(a.run('cur.ans.length'),1);assert.equal(a.run('pos'),1);assert.equal(a.run('saidText(rec)'),'');
});

test('Speaking navigation while finishing cancels the old take without aborting the next recogniser',async()=>{
  const {a,native,r}=await exam(),old=native.instances[0];old.result('Dit antwoord wordt geannuleerd');
  a.document.getElementById('recb').click();a.run('home();startExam("sp",true)');a.document.getElementById('recb').click();await a.flush();
  const current=native.instances.at(-1);assert.notEqual(current,old);assert.equal(a.timers.has(r.finishTimer),false);
  old.end();old.result('Late woorden');assert.equal(current.aborts,0);assert.equal(a.run('cur.ans.length'),0);
  current.result('Ik woon samen met mijn familie');a.document.getElementById('recb').click();current.end();
  assert.equal(a.run('cur.ans.length'),1);assert.equal(a.run('cur.ans[0].text'),'Ik woon samen met mijn familie');
});

test('Speaking a native stop error still finishes, and empty speech is reported honestly',async()=>{
  const {a,native}=await exam('sb'),n=native.instances[0];n.throwStop=true;
  a.document.getElementById('recb').click();
  assert.equal(a.document.getElementById('recb').disabled,false);
  assert.match(a.document.getElementById('recn').textContent,/Geen spraak herkend/);
  assert.equal(a.run('cur.ans.length'),1);assert.equal(a.run('cur.ans[0].text'),'');
  assert.match(a.document.getElementById('recb').textContent,/Volgende vraag/);
});

test('Speaking B1 time expiry completes a take and the final question offers submission',async()=>{
  const {a,native,r}=await exam('sb'),n=native.instances[0];n.result('Ik wil graag een afspraak maken');
  a.run('rec.start=Date.now()-rec.lim*1000;recEnd(true)');finishFallback(a,r);
  assert.match(a.document.getElementById('recn').textContent,/De tijd is om/);
  a.run('pos=queue.length-1;show()');a.document.getElementById('recb').click();await a.flush();
  const last=native.instances.at(-1);last.result('Dit is mijn laatste antwoord');a.document.getElementById('recb').click();last.end();
  assert.equal(a.document.getElementById('recb').textContent,'Antwoorden inleveren');
});

test('Speaking MediaRecorder natural stop completes the answer and releases the microphone',async()=>{
  const tracks=[{stopped:false,stop(){this.stopped=true}}];let recorder;
  class Recorder{
    constructor(){recorder=this;this.state='inactive';this.mimeType='audio/webm'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['audio'])});this.onstop?.()}
  }
  const a=await app({globals:{MediaRecorder:Recorder,navigator:{userAgent:'test',platform:'test',onLine:true,mediaDevices:{getUserMedia:async()=>({getTracks:()=>tracks})}}}});
  a.run('startExam("sp",true)');a.document.getElementById('recb').click();await a.flush();recorder.stop();
  assert.match(a.document.getElementById('recb').textContent,/Volgende vraag/);assert.equal(a.run('cur.ans.length'),1);
  assert.match(a.run('cur.ans[0].url'),/^blob:/);assert.equal(tracks[0].stopped,true);
  recorder.onstop();assert.equal(a.run('cur.ans.length'),1);
  a.run('lsSet(speakingDraftKey(),null);startExam("sp",true)');a.document.getElementById('recb').click();await a.flush();
  assert.equal(recorder.state,'recording');a.run('home()');
  assert.equal(recorder.state,'inactive');assert.equal(a.run('cur.ans.length'),0);
});

for(const part of ['sp','sb'])test(`Speaking ${part} retakes replace the current answer without advancing or extending the exam`,async()=>{
  const {a,native}=await exam(part),deadline=a.run('tEnd');
  native.instances.at(-1).result('Mijn eerste antwoord');a.document.getElementById('recb').click();native.instances.at(-1).end();
  const redo=a.document.getElementById('spredo');assert.equal(redo.hidden,false);
  redo.click();await a.flush();assert.equal(redo.hidden,true);assert.equal(a.run('cur.ans[0].text'),'Mijn eerste antwoord');
  assert.equal(a.run('rec.lim'),a.run('queue[pos].spk||SPK'));assert.equal(a.run('tEnd'),deadline);
  native.instances.at(-1).result('Mijn verbeterde antwoord');a.document.getElementById('recb').click();native.instances.at(-1).end();
  assert.equal(a.run('cur.ans.length'),1);assert.equal(a.run('cur.ans[0].text'),'Mijn verbeterde antwoord');assert.equal(a.run('pos'),0);
  redo.click();await a.flush();a.document.getElementById('recb').click();native.instances.at(-1).end();
  assert.equal(a.run('cur.ans[0].text'),'Mijn verbeterde antwoord');assert.equal(a.run('cur.ans.length'),1);
  assert.match(a.document.getElementById('recn').textContent,/Je vorige antwoord is bewaard/);
  assert.match(a.document.getElementById('recp').textContent,/Mijn verbeterde antwoord/);
  assert.equal(a.run('tEnd'),deadline);a.document.getElementById('recb').click();
  assert.equal(a.run('pos'),1);assert.equal(a.document.getElementById('spredo').hidden,true);
});

test('Speaking replaced audio is released and the final question can also be retaken',async()=>{
  const native=speech(),revoked=[];
  class ScopedURL extends URL{static revokeObjectURL(url){revoked.push(url)}}
  const a=await app({globals:{SpeechRecognition:native.Recognition,URL:ScopedURL}});
  a.run('startExam("sp",true);pos=queue.length-1;show()');a.document.getElementById('recb').click();await a.flush();
  native.instances.at(-1).result('Mijn eerste antwoord');a.document.getElementById('recb').click();native.instances.at(-1).end();
  a.run('cur.ans[pos].url="blob:old-take"');a.document.getElementById('spredo').click();await a.flush();
  native.instances.at(-1).result('Mijn laatste verbeterde antwoord');a.document.getElementById('recb').click();native.instances.at(-1).end();
  assert.deepEqual(revoked,['blob:old-take']);assert.equal(a.run('cur.ans.filter(Boolean).length'),1);
  assert.equal(a.document.getElementById('recb').textContent,'Antwoorden inleveren');assert.equal(a.document.getElementById('spredo').hidden,false);
});

test('Speaking practice checks only the transcript explicitly confirmed by the learner', async()=>{
  const native=speech(), checks=[];
  const a=await app({globals:{SpeechRecognition:native.Recognition},fetch:async(url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    checks.push(JSON.parse(options.body).tasks[0].text);
    return new Response(JSON.stringify({tasks:[{passed:true,errors:[],corrected:'Te voet.'}]}));
  }});
  a.run('build("sp",{...SEC.find(s=>s.id==="sp"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.k==="sp|3")]})');
  a.document.getElementById('spchk').click();
  await a.flush();
  native.instances[0].result('Te voetje');
  a.document.getElementById('recb').click();
  native.instances[0].end();
  assert.equal(checks.length,0);
  assert.equal(a.document.getElementById('sptranscript').value,'Te voetje');
  for(const filler of ['…','eh','a','Ehm, hm']){
    a.document.getElementById('sptranscript').value=filler;
    a.document.getElementById('spchk').click();
    assert.equal(checks.length,0,filler);
  }
  a.document.getElementById('sptranscript').value='Te voet';
  a.document.getElementById('spchk').click();
  await a.flush();
  assert.deepEqual(checks,['Te voet']);
});

test('A2 speaking exam retries the same transcript after connection loss and saves one result',async()=>{
  const requests=[];
  const a=await app({fetch:async (url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    const request=JSON.parse(options.body);
    requests.push(request);
    if(requests.length===1)throw new TypeError('connection lost');
    const result={passed:true,scores:{inhoud:3,woorden:2,grammatica:2,samenhang:1},errors:[]};
    return new Response(JSON.stringify({tasks:request.tasks.map(()=>result)}));
  }});
  a.run('startExam("sp",true);cur.ans=[{q:queue[0],text:"Ik woon in Nederland"}];pos=queue.length;finish()');
  await a.flush();
  assert.match(a.document.querySelector('#card').textContent,/Ik woon in Nederland/);
  assert.equal(a.run('S.res?.sp?.length || 0'),0);
  a.document.querySelector('#retrycheck').click();
  await a.flush();
  assert.deepEqual(requests,[requests[0],requests[0]]);
  assert.equal(a.run('S.res.sp.length'),1);
  assert.equal(a.run('Object.values(S.xs).every(n=>n===1)'),true);
});

test('A2 speaking practice retries grading without restarting recognition',async()=>{
  const requests=[];
  const native=speech();
  const a=await app({globals:{SpeechRecognition:native.Recognition},fetch:async (url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    requests.push(JSON.parse(options.body));
    if(requests.length===1)return new Response('{"error":"timeout"}',{status:504});
    return new Response('{"tasks":[{"passed":true,"corrected":"Ik woon in Nederland.","errors":[]}]}');
  }});
  a.run('build("sp")');
  a.document.querySelector("#spchk").click();
  native.instances[0].result("Ik woon in Nederland");
  a.document.querySelector("#recb").click();
  native.instances[0].end();
  await a.flush();
  a.document.querySelector('#spchk').click();
  await a.flush();
  a.document.querySelector('#retrycheck').click();
  await a.flush();
  assert.equal(requests.length,2);
  assert.deepEqual(requests,[requests[0],requests[0]]);
  assert.match(a.document.querySelector('#fb').textContent,/Voldoende/);
});

test('A2 speaking restores the current completed answer and the original deadline after reopening',async()=>{
  const store=storage(),native=speech();
  const a=await app({storage:store,globals:{SpeechRecognition:native.Recognition}});
  a.run('startExam("sp",true)');
  const initial=a.run('JSON.stringify({id:cur.spDraft.id,end:cur.spDraft.end,keys:queue.map(q=>q.k)})');
  a.document.querySelector('#recb').click();
  native.instances[0].result('Ik woon in Amsterdam');
  a.document.querySelector('#recb').click();
  native.instances[0].end();
  const reopened=await app({storage:store});
  reopened.run('startExam("sp",true)');
  assert.equal(reopened.run('JSON.stringify({id:cur.spDraft.id,end:cur.spDraft.end,keys:queue.map(q=>q.k)})'),initial);
  assert.equal(reopened.run('cur.ans[0].text'),'Ik woon in Amsterdam');
  assert.match(reopened.document.querySelector('#recb').textContent,/Volgende vraag/);
  reopened.document.querySelector('#recb').click();
  assert.equal(reopened.run('pos'),1);
  reopened.run('const expired=speakingDraft();expired.end=Date.now()-1000;lsSet(speakingDraftKey(),JSON.stringify(expired));startExam("sp",true)');
  assert.equal(reopened.run('tEnd'),0);
  assert.ok(reopened.document.querySelector('#spdeliver'));
  assert.equal(reopened.run('cur.ans[0].text'),'Ik woon in Amsterdam');
  reopened.run('openProgress("another-owner")');
  assert.equal(reopened.run('speakingDraft()'),null);
});

test('A2 speaking recommends separate practice when part of an exam answer was missing',async()=>{
  const a=await app({fetch:async(url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    const {tasks}=JSON.parse(options.body);
    return new Response(JSON.stringify({tasks:tasks.map(()=>({passed:true,errors:[],
      scores:{inhoud:2,woorden:2,grammatica:2,samenhang:1},corrected:'Ik spreek Nederlands.'}))}));
  }});
  a.run('startExam("sp",true);cur.ans=[{q:queue[0],text:"Ik spreek Nederlands"}];pos=queue.length;finish()');
  await a.flush();
  assert.match(a.document.querySelector('#card').textContent,/oefen morgen in Mijn dag/);
  assert.equal(a.run('S.speakFollow.count'),1);
  assert.equal(a.run('S.speakFollow.day'),a.run('today()+1'));
  a.run('S.speakFollow.day=today();setTab("vandaag");home();drawPlan()');
  a.document.querySelector('#dayspeak').click();
  assert.equal(a.run('S.speakFollow.examKeys.includes(queue[0].k)'),false);
  assert.match(a.run('queue[0].big+queue[0].sub'),/waarom/i);
});

test('A2 speaking compares the second answer without counting the question twice',async()=>{
  const native=speech(),checks=[];
  const a=await app({globals:{SpeechRecognition:native.Recognition},fetch:async(url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    const {text}=JSON.parse(options.body).tasks[0];
    checks.push(text);
    const inhoud=checks.length===1?2:3;
    return new Response(JSON.stringify({tasks:[{passed:inhoud===3,errors:[],corrected:text,
      scores:{inhoud,woorden:1,grammatica:2,samenhang:1}}]}));
  }});
  a.run('build("sp",{...SEC.find(s=>s.id==="sp"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.k==="sp|5")]})');
  const click=id=>a.document.getElementById(id).click();
  const take=async text=>{
    await a.flush();
    const recording=native.instances.at(-1);
    recording.result(text);click('recb');recording.end();
  };
  click('spchk');await take('Ik leer Nederlands.');
  click('spchk');await a.flush();
  const progress=a.run('JSON.stringify(S.items["sp|5"])');
  click('speakAgain');await take('Ik leer Nederlands omdat ik hier werk.');
  assert.equal(checks.length,1);
  assert.match(a.document.getElementById('spchk').textContent,/1 nakijkbeurt/);
  click('spchk');await a.flush();
  assert.equal(checks.length,2);
  assert.match(a.document.getElementById('fb').textContent,/eerste antwoord 2\/3 · tweede antwoord 3\/3/);
  assert.equal(a.run('JSON.stringify(S.items["sp|5"])'),progress);
  assert.equal(a.run('S.speakFollow.ok'),false);
  a.run('S.speakFollow.day=today(); speakingFollowUp()');
  assert.notEqual(a.run('queue[0].k'),'sp|5');
  click('spchk');await take('Ik werk morgen omdat mijn collega vrij is.');
  click('spchk');await a.flush();
  assert.equal(a.run('S.speakFollow.writePending'),true);
  a.run('setTab("vandaag");home();drawPlan()');
  assert.equal(a.document.getElementById('daytransfer'),null);
  a.run('S.speakFollow.day=today();drawPlan()');
  click('daytransfer');
  assert.equal(a.run('queue[0].sec'),'wr');
  a.document.getElementById('txt').value='Ik kan donderdag niet komen omdat ik werk. Kan ik vrijdag komen?';
  click('chk');await a.flush();
  assert.equal(a.run('S.speakFollow.writeDone'),true);
  assert.equal(a.run('S.speakFollow.writePending'),false);
});

test('A missed word can be recorded again without discarding the full speaking comparison',async()=>{
  const native=speech(),a=await app({globals:{SpeechRecognition:native.Recognition}});
  a.run('build("sp",{...SEC.find(s=>s.id==="sp"),n:1,keep:1,pool:()=>[{...ITEMS.find(q=>q.k==="sp|3"),right:"Ik ga met de trein."}]});reveal(queue[pos])');
  const item=id=>a.document.getElementById(id);
  item('echo').click();
  await a.flush();
  native.instances.at(-1).result('Ik ga met de');
  item('echo').click();
  native.instances.at(-1).end();
  const missed=a.document.querySelector('#echor .miss');
  assert.equal(missed.textContent,'trein');
  missed.click();
  item('echoRetry').click();
  await a.flush();
  native.instances.at(-1).result('trein');
  item('echoRetry').click();
  native.instances.at(-1).end();
  assert.match(item('echoWordStatus').textContent,/verstond ‘trein’/);
  assert.equal(a.document.querySelector('#echor .miss'),missed);
  item('got').click();
  assert.equal(a.run('S.items["sp|3"].r'),1);
});

test('A2 speaking exam sends the sealed sound, counts 12 points per answer and offers the right answer to hear',async()=>{
  const requests=[];
  const a=await app({fetch:async (url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    const request=JSON.parse(options.body);requests.push(request);
    const result={passed:true,verdict:'Goed.',corrected:'Ik woon in Nederland.',errors:[],
      scores:{inhoud:3,woorden:2,grammatica:2,samenhang:0,uitspraak:2,vloeiendheid:1},
      meer:[{kind:'samenhang',tip:'Verbind je zinnen.',voorbeeld:'Ik woon in Nederland, want mijn man werkt hier.'}]};
    return new Response(JSON.stringify({tasks:request.tasks.map(()=>result)}));
  }});
  a.run('startExam("sp",true);cur.ans=[{q:queue[0],text:"Ik woon in Nederland",sound:"seal-1"}];pos=queue.length;finish()');
  await a.flush();
  assert.equal(requests[0].tasks[0].sound,'seal-1');
  const card=a.document.querySelector('#card').textContent;
  assert.match(card,/Samen 10 van 12 punten/);
  assert.match(card,/10 van 192 punten/,'unanswered questions count 12 when the exam counted sound');
  assert.match(card,/Is je uitspraak duidelijk\?/);
  assert.match(card,/Voldoende is 8 punten/);
  assert.match(card,/Zo haal je meer punten/);
  assert.match(card,/Ik woon in Nederland, want mijn man werkt hier\./);
  assert.match(card,/Vloeiendheid/,'a lost fluency point gets the computer\'s own tip');
  assert.ok(a.document.querySelector('#card [data-say="0"]'),'▶ Luister naar het goede antwoord');
});
test('Without a seal a spoken answer keeps the 8 points of a transcript',async()=>{
  const a=await app();
  const html=a.run('scoreHTML({inhoud:3,woorden:2,grammatica:1,samenhang:1},undefined,[])');
  assert.match(html,/Samen <b>7 van 8 punten/);assert.match(html,/Voldoende is 6 punten/);
  const near=a.run('lineNote({checks:3})+lineNote({nearLine:true,checks:2})');
  assert.match(near,/drie keer nagekeken/);assert.match(near,/precies op de grens/);
  assert.equal(a.run('meerHTML({meer:[]})'),'');
});
test('Mijn examen says whether the last Spreken proefexamen counted the sound; the line note fits an answer',async()=>{
  const a=await app();
  a.run('S.res={sp:[{id:"a",at:Date.now(),pc:70,nw:100,snd:1}]};home()');
  assert.match(a.document.querySelector('#exam').textContent,/Uitspraak en vloeiendheid zijn door de computer gemeten/);
  a.run('S.res.sp.push({id:"b",at:Date.now(),pc:60,nw:100});home()');
  assert.match(a.document.querySelector('#exam').textContent,/Uitspraak en tempo zijn niet beoordeeld/);
  assert.match(a.run('lineNote({checks:2},false)'),/Je antwoord zat .* Daarom is het twee keer/);
});
test('A2 speaking exam: skip, go back, keep a recorded answer, and hand in from the overview after a confirmation',async()=>{
  const requests=[];
  const a=await app({fetch:async (url,options)=>{
    if(url!=='/api/check')return new Response('{}');
    const request=JSON.parse(options.body);requests.push(request);
    return new Response(JSON.stringify({tasks:request.tasks.map(()=>({passed:true,verdict:'Goed.',corrected:'Ja.',errors:[],scores:{inhoud:3,woorden:2,grammatica:2,samenhang:1}}))}));
  }});
  a.run('startExam("sp",true)');
  const $=id=>a.document.getElementById(id);
  assert.match(a.document.querySelector('#card .intro').textContent,/vier vragen/,'part 1 starts with what to do');
  assert.equal($('prv').disabled,true);
  $('spskip').click();
  assert.equal(a.run('pos'),1,'a question can be skipped');
  a.run('cur.ans[1]={q:queue[1],text:"Ik werk in een winkel",url:"blob:take",sound:"seal-2"}');
  $('prv').click();$('spskip').click();
  assert.equal(a.run('pos'),1);
  assert.match($('recp').textContent,/Ik werk in een winkel/);
  assert.equal(a.run('cur.ans[1].sound'),'seal-2','looking at a saved answer again keeps its recording and sound');
  assert.equal($('spskip').hidden,true);
  assert.match($('recb').textContent,/Volgende vraag/);
  $('ovw').click();
  const card=a.document.querySelector('#card').textContent;
  assert.match(card,/1 van 16 vragen beantwoord/);assert.match(card,/Je hebt nog \d+ minuten/);assert.match(card,/zonder antwoord: 1, 3, 4/);
  $('lever').click();
  assert.equal($('lever').textContent,'Toch inleveren','open questions: a second tap hands in');
  assert.equal(requests.length,0);
  $('lever').click();await a.flush();
  assert.equal(requests.length,1);
  assert.deepEqual(requests[0].tasks.map(t=>t.text),['Ik werk in een winkel'],'a skipped question costs no model call');
  assert.equal(requests[0].tasks[0].sound,'seal-2');
  const result=a.document.querySelector('#card').textContent;
  assert.match(result,/Vraag 1: nog niet voldoende/);assert.match(result,/Vraag 2: voldoende/);assert.match(result,/8 van 128 punten/);
});
test('Luisteren A2 proefexamen: a fragment plays as often as you like, as in DUO\'s oefenexamen; B1 plays once',async()=>{
  class SpeechSynthesisUtterance{constructor(text){this.text=text}}
  const a=await app({globals:{speechSynthesis:{speak(){},cancel(){},getVoices:()=>[],speaking:false,pending:false},SpeechSynthesisUtterance}});
  a.run('startExam("ls",true)');
  const say=a.document.getElementById('say');
  for(let i=0;i<4;i++)say.click();
  assert.equal(say.disabled,false);assert.match(say.textContent,/Nog een keer luisteren/);
  assert.match(a.document.querySelector('#card').textContent,/zo vaak beluisteren als je wilt/);
  a.run('S.lvl="B1";startExam("lb",true)');
  const once=a.document.getElementById('say');once.click();
  assert.equal(once.disabled,true);
});
test('Lezen A2: the question comes before the text, as DUO says: lees eerst de vraag, lees daarna de tekst',async()=>{
  const a=await app();
  a.run('startExam("lz",true)');
  const card=a.document.querySelector('#card'),html=card.innerHTML,q=a.run('queue[0].big');
  assert.match(card.textContent,/Lees eerst de vraag\. Lees daarna de tekst\./);
  const at=html.indexOf('class="verb long"'),doc=html.indexOf('class="doc');
  assert.ok(at>0&&doc>at,'the question is above the text');
  assert.equal(card.querySelectorAll('.verb').length,1,'the question is shown once');
  assert.ok(card.textContent.includes(q.replace(/<[^>]+>/g,'').slice(0,20)));
});
test('KNM proefexamen: each theme starts with a line, and the question is read aloud as it appears',async()=>{
  const said=[];class SpeechSynthesisUtterance{constructor(text){this.text=text}}
  const a=await app({globals:{speechSynthesis:{speak:u=>said.push(u.text),cancel(){},getVoices:()=>[],speaking:false,pending:false},SpeechSynthesisUtterance}});
  a.run('startExam("knm",true)');
  assert.match(a.document.querySelector('#card .intro').textContent,/De volgende vragen gaan over het thema ‘/);
  assert.equal(a.run('queue.filter((q,i)=>i&&q.label!==queue[i-1].label).length'),7,'eight themes, each in one block (they were shuffled apart)');
  const first=a.run('queue.findIndex((q,i)=>i>0&&q.label!==queue[i-1].label)');
  a.run('pos=1;show()');
  assert.equal(a.run('queue[1].label===queue[0].label'),true);
  assert.equal(a.document.querySelector('#card .intro'),null,'not above every question');
  a.run(`pos=${first};show()`);
  assert.ok(a.document.querySelector('#card .intro'));
  await a.flush();
  assert.ok(a.run('cur.exam&&queue[pos].sec==="knm"'));
});
