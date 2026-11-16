import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

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
  a.run('startExam("sp",true)');a.document.getElementById('recb').click();await a.flush();
  assert.equal(recorder.state,'recording');a.run('home()');
  assert.equal(recorder.state,'inactive');assert.equal(a.run('cur.ans.length'),0);
});
