import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {app, root, storage} from './app-harness.mjs';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('study/writing-v1.js',root),'utf8'),context);
const pure=(name,...args)=>JSON.parse(vm.runInContext(`JSON.stringify(${name}(...${JSON.stringify(args)}))`,context));
const a2=(id=0)=>({sec:'wr',k:`wr|${id}`});
const b1=(kind,id=0)=>({sec:'wb',k:`wb|${id}`,kind,mx:kind==='z'?{inhoud:1,grammatica:1}:kind==='f'?{inhoud:3,woorden:1,grammatica:2,spelling:1}:{inhoud:3,woorden:1,grammatica:2,spelling:1,samenhang:1}});
const perfect={inhoud:3,woorden:2,grammatica:2,spelling:2,samenhang:1};
const answer=q=>({q,form:'',text:'Dit is mijn eigen antwoord.'});
const grade=(scores=perfect,errors=[])=>({scores,errors,passed:true,verdict:'Goed gedaan.',corrected:'Dit is mijn verbeterde antwoord.'});
const review=(tasks,scores,errors=[])=>pure('reviewWriting',tasks,tasks.map(answer),scores.map(s=>grade(s,errors)));
function type(a,selector,text){const el=a.document.querySelector(selector);el.value=text;el.oninput();}
function checker(transform=x=>x){
  const calls=[];
  return {calls,fetch:async(url,options)=>{
    if(url!=='/api/check')return new Response(JSON.stringify(url==='/api/config'?{}:[]));
    const body=JSON.parse(options.body);calls.push(body);
    const tasks=body.tasks.map(task=>grade(body.part==='wb'?b1(task.kind).mx:{...perfect,grammatica:1},
      [{wrong:'Morgen ik kom',right:'Morgen kom ik',why:'Woordvolgorde: de persoonsvorm staat op plaats twee.'}]));
    return new Response(JSON.stringify({tasks:transform(tasks),free:1}));
  }};
}
async function submit(a,part='wr',filled=()=>true){
  a.run(`startExam(${JSON.stringify(part)},true)`);
  const count=a.run('queue.length');
  for(let i=0;i<count;i++){
    if(filled(i)){
      for(const input of a.document.querySelectorAll('#card input[id^="f"]'))type(a,`#${input.id}`,'Antwoord');
      type(a,'#txt','Morgen ik kom naar de afspraak. Ik heb een vraag over het formulier.');
    }
    a.document.querySelector('#nxt').click();
  }
  a.document.querySelector('#lever').click();
  if(a.document.querySelector('#lever'))a.document.querySelector('#lever').click();
  await a.flush();
}

test('All stable writing keys have explicit task types, and B1 uses only its applicable criteria',async()=>{
  const a=await app();
  assert.equal(a.run('ITEMS.filter(q=>q.sec==="wr").length'),66);
  assert.equal(a.run('ITEMS.filter(q=>q.sec==="wr").every(q=>writingTaskType(q)!=="other" && (writingTaskType(q)==="form")===!!q.fields)'),true);
  assert.deepEqual(pure('writingMax',b1('z')),{inhoud:1,woorden:0,grammatica:1,spelling:0,samenhang:0});
  assert.equal(pure('writingTaskType',b1('f')),'form');
  assert.equal(pure('writingTaskType',b1('m')),'email');
});
test('A2 totals and type breakdown include skipped tasks without shifting the next answer',()=>{
  const tasks=[a2(11),a2(0),a2(3),a2(4)];
  const r=pure('reviewWriting',tasks,[answer(tasks[1]),answer(tasks[3])],[grade(),grade({...perfect,grammatica:1})]);
  assert.deepEqual([r.earned,r.max,r.percent,r.unfinished],[19,40,48,2]);
  assert.deepEqual(r.rows.map(r=>r.status),['empty','scored','empty','scored']);
  assert.equal(r.types.find(t=>t.id==='message').earned,10);
  assert.equal(r.types.find(t=>t.id==='formal').earned,9);
  assert.equal(r.criteria.find(c=>c.id==='grammatica').earned,3);
  assert.equal(r.priorities[0].criterion,'unfinished');
});
test('B1 sums 47 available points, ignores non-applicable values, and weights types by points',()=>{
  const tasks=[...Array.from({length:8},(_,i)=>b1('z',i)),b1('f',8),...Array.from({length:3},(_,i)=>b1('m',i+9))];
  const scores=tasks.map(q=>({...q.mx,woorden:q.kind==='z'?99:q.mx.woorden}));
  scores[8].grammatica=0;
  const r=review(tasks,scores);
  assert.deepEqual([r.earned,r.max,r.percent],[45,47,96]);
  assert.deepEqual(r.types.map(t=>[t.id,t.earned,t.max]),[['sentence',16,16],['form',5,7],['email',24,24]]);
  assert.equal(r.criteria.find(c=>c.id==='woorden').max,4);
  assert.equal(r.criteria.find(c=>c.id==='woorden').earned,4);
});
test('Missing or malformed scores never become a failed score or a fabricated recommendation',()=>{
  for(const scores of [undefined,{}, {...perfect,inhoud:'3'},{...perfect,woorden:3},{...perfect,grammatica:-1},{...perfect,spelling:1.5}]){
    const r=pure('reviewWriting',[a2()],[answer(a2())],[grade(scores===undefined?null:scores)]);
    assert.equal(r.complete,false);
    assert.equal(r.percent,null);
    assert.equal(pure('writingSnapshot',r),null);
    assert.deepEqual(r.priorities,[]);
  }
});
test('Recommendations prioritise critical content, then actual lost points, without inferring grammar from zero content',()=>{
  const r=review([a2(0),a2(4),a2(3)],[{...perfect,inhoud:1},{...perfect,grammatica:0},{...perfect,grammatica:0}]);
  assert.deepEqual(r.priorities.map(p=>[p.criterion,p.lost]),[['inhoud',2],['grammatica',4]]);
  const next=review([a2(0),a2(4)],[{...perfect,inhoud:2},{...perfect,grammatica:0}]);
  assert.equal(next.priorities[0].criterion,'grammatica');
  const emptyContent=review([a2()],[Object.fromEntries(Object.keys(perfect).map(k=>[k,0]))]);
  assert.deepEqual(emptyContent.priorities.map(p=>p.criterion),['inhoud']);
  assert.deepEqual(review([a2()],[perfect]).priorities,[]);
});
test('Word-order practice requires an identified word-order error; other grammar returns to writing',()=>{
  const scores={...perfect,grammatica:1};
  const evidence={wrong:'Morgen ik kom',right:'Morgen kom ik',why:'Woordvolgorde: inversie na morgen.'};
  const r=review([a2()],[scores],[null,evidence]);
  assert.deepEqual(r.priorities[0].action,{kind:'section',section:'wo'});
  assert.deepEqual(r.priorities[0].evidence,evidence);
  const actualReason={...evidence,why:"Begint de zin met een tijd, zoals 'volgende week'? Dan komt het werkwoord op plaats 2 en het onderwerp daarna."};
  assert.deepEqual(review([a2()],[scores],[actualReason]).priorities[0].action,{kind:'section',section:'wo'});
  const other=review([a2()],[scores],[{wrong:'ik werken',right:'ik werk',why:'Werkwoordsvorm.'}]);
  assert.deepEqual(other.priorities[0].action,{kind:'task',key:'wr|0'});
  assert.equal(review([b1('z')],[{inhoud:1,grammatica:0}],[evidence]).priorities[0].action.section,'w1');
});
test('History uses the last five detailed attempts, counts evidence, and snapshots contain no learner text',()=>{
  const first=pure('writingSnapshot',review([a2(0),a2(1)],[perfect,{...perfect,grammatica:0}]));
  const second=pure('writingSnapshot',review([a2(0)],[{...perfect,inhoud:2,grammatica:0}]));
  const results=[{writing:first},{pc:100},{writing:second},{writing:{v:1,types:{}}},{writing:{v:1,types:[null,{id:'message',max:0,earned:99,tasks:1}]}}];
  const h=pure('writingHistory',results);
  assert.equal(h.attempts,2);
  assert.deepEqual(h.types,[{id:'message',earned:25,max:30,tasks:3,attempts:2}]);
  assert.equal(/Dit is|wrong|corrected|text|form"\s*:"/.test(JSON.stringify(first)),false);
  assert.equal(pure('writingHistory',[{pc:100}]).types.length,0);
  assert.equal(pure('writingHistory',Array.from({length:8},()=>({writing:first}))).types[0].attempts,5);
});
test('A2 exam renders the summary, saves it once and returns from practice and rewriting without another AI check',async()=>{
  const mock=checker(),a=await app({fetch:mock.fetch});
  await submit(a);
  assert.equal(mock.calls.length,1);
  assert.match(a.document.querySelector('#card .big').textContent,/90%/);
  assert.equal(a.run('S.res.wr[0].writing.types.reduce((n,r)=>n+r.max,0)'),40);
  assert.ok(a.document.querySelector('#writingReview'));
  const html=a.document.querySelector('#card').innerHTML;
  const xs=a.run('JSON.stringify(S.xs)');
  a.document.querySelector('[data-write-focus]').click();
  assert.equal(a.run('cur.id'),'wo');
  a.document.querySelector('#back').click();
  assert.equal(a.document.querySelector('#card').innerHTML,html);
  a.document.querySelector('.rdo').click();
  assert.ok(a.document.querySelector('#rwchk'));
  a.document.querySelector('#rwgo').click();
  assert.ok(a.document.querySelector('#writingReview'));
  assert.equal(a.run('S.res.wr.length'),1);
  assert.equal(a.run('JSON.stringify(S.xs)'),xs);
  assert.equal(mock.calls.length,1);
  a.document.querySelector('#back').click();
  assert.equal(a.document.querySelector('#home').hidden,false);
  assert.deepEqual(a.errors,[]);
});
test('Full B1 exam renders a 47-point total through the existing normal exam flow',async()=>{
  const mock=checker(),a=await app({fetch:mock.fetch});
  await submit(a,'wb');
  assert.equal(mock.calls.length,1);
  assert.equal(mock.calls[0].tasks.length,12);
  assert.match(a.document.querySelector('#card').textContent,/47 van 47 punten/);
  assert.equal(a.document.querySelectorAll('.writing-type').length,3);
  assert.equal(a.run('S.res.wb[0].pc'),100);
  assert.deepEqual(a.errors,[]);
});
test('An entirely blank exam needs no model call and returns from its recommended task without recording twice',async()=>{
  const mock=checker(),a=await app({fetch:mock.fetch});
  await submit(a,'wb',()=>false);
  assert.equal(mock.calls.length,0);
  assert.equal(a.document.querySelector('#card .big').textContent,'0%');
  assert.match(a.document.querySelector('#writingReview').textContent,/Niet gemaakt · 47 punten verloren/);
  a.document.querySelector('[data-write-focus]').click();
  assert.equal(a.run('queue[0].kind'),'m');
  a.document.querySelector('#back').click();
  assert.equal(a.run('S.res.wb.length'),1);
  assert.equal(a.run('Object.values(S.xs).every(n=>n===1)'),true);
  assert.equal(mock.calls.length,0);
});
test('Partial grading keeps the exam draft and avoids saving a misleading total',async()=>{
  const mock=checker(tasks=>tasks.slice(0,1)),a=await app({fetch:mock.fetch});
  await submit(a);
  assert.equal(a.document.querySelector('#card .big').textContent,'–');
  assert.match(a.document.querySelector('#writingReview').textContent,/Je concept blijft bewaard/);
  assert.equal(a.run('!!getDraft("wr",true)'),true);
  assert.equal(a.run('S.res?.wr?.length || 0'),0);
  assert.equal(a.document.querySelector('[data-write-focus]'),null);
});
test('Focused writing has its own resumable draft and preserves an ordinary writing draft',async()=>{
  const store=storage(),mock=checker(tasks=>tasks.map(task=>({...task,scores:{...perfect,inhoud:1}})));
  const a=await app({storage:store,fetch:mock.fetch});
  a.run('build("wr")');type(a,'#txt','Dit gewone concept moet blijven.');
  const ordinary=store.getItem(a.run('draftKey("wr",false)'));
  a.run('home()');await submit(a);
  a.document.querySelector('[data-write-focus]').click();
  type(a,'#txt','Dit is mijn gerichte oefening.');
  const focusKey=a.run('queue[0].k');
  a.document.querySelector('#back').click();
  a.document.querySelector('#tohome').click();
  assert.equal(store.getItem(a.run('draftKey("wr",false)')),ordinary);
  const b=await app({storage:store});
  b.document.querySelector('[data-draft-slot^="focus/"]').click();
  assert.equal(b.run('queue[0].k'),focusKey);
  assert.equal(b.document.querySelector('#txt').value,'Dit is mijn gerichte oefening.');
  assert.equal(b.document.querySelector('#timer').textContent,'');
});
test('Profiel has no results tile any more (removed at the user\'s wish); the scores stay in S.res',async()=>{
  const a=await app();
  a.run('S.res={wr:[{id:"old",at:Date.now(),pc:80,nw:100}]};drawProfile()');
  assert.equal(a.document.querySelector('#myres'),null);
  assert.equal(a.run('typeof drawResults'),'undefined');
});


test('B1 accepts a two-word sentence ending and submits its complete task context',async()=>{
  const c=checker(),a=await app({fetch:c.fetch});
  a.run('build("custom",{id:"custom",n:1,pool:()=>[ITEMS.find(q=>q.k==="wb|0")]})');
  type(a,'#txt','ik werk');a.document.querySelector('#chk').click();await a.flush();
  assert.equal(c.calls.length,1);assert.equal(c.calls[0].tasks[0].text,'ik werk');
  assert.match(c.calls[0].tasks[0].task,/omdat/);
});
test('Long pasted writing remains editable and survives reload without a grading call',async()=>{
  const c=checker(),store=storage(),a=await app({fetch:c.fetch,storage:store});
  a.run('build("wr")');const original='Dit is mijn antwoord. '.repeat(150);
  type(a,'#txt',original);a.document.querySelector('#chk').click();await a.flush();
  assert.equal(c.calls.length,0);assert.equal(a.document.querySelector('#txt').value,original);
  assert.match(a.document.querySelector('#fb').textContent,/2500/);
  assert.match(a.document.querySelector('#writingLimit').textContent,/2500/);
  assert.ok(!a.document.querySelector('#txt').readOnly);
  a.document.querySelector('#back').click();
  const b=await app({fetch:c.fetch,storage:store});b.document.querySelector('[data-draft="wr"]').click();
  assert.equal(b.document.querySelector('#txt').value,original);
  type(b,'#txt','Ik kan morgen niet komen. Kunnen wij een nieuwe afspraak maken?');b.document.querySelector('#chk').click();await b.flush();
  assert.equal(c.calls.length,1);
});
test('An oversized exam answer returns to its editor without submitting or recording an exam score',async()=>{
  const c=checker(),a=await app({fetch:c.fetch});a.run('startExam("wr",true)');
  type(a,'#txt','x'.repeat(2501));a.run('overview();submitExam()');await a.flush();
  assert.equal(c.calls.length,0);assert.equal(a.document.querySelector('#txt').value.length,2501);
  assert.equal(a.run('!!cur.sent'),false);assert.equal(a.run('(S.res?.wr||[]).length'),0);
  assert.match(a.document.querySelector('#fb').textContent,/2500/);
});

test('An expired oversized exam offers an explicit full-text download before shortening, never silent truncation',async()=>{
  const c=checker(),a=await app({fetch:c.fetch});a.run('startExam("wr",true)');
  type(a,'#txt','x'.repeat(2501));a.run('cur.expired=true;overview();submitExam()');await a.flush();
  assert.ok(a.document.querySelector('#shorten'));
  assert.equal(a.document.querySelector('#txt').value.length,2501);assert.equal(c.calls.length,0);
  a.run('var downloadedText=null;saveDocx=items=>downloadedText=items[0].text');
  a.document.querySelector('#shorten').click();
  assert.equal(a.run('downloadedText.length'),2501);assert.equal(a.document.querySelector('#txt').value.length,2500);
  assert.ok(a.document.querySelector('#txt').readOnly);assert.equal(c.calls.length,0);
});
