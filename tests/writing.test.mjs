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
  // the form is scored as DUO scores forms (7 points, no grammatica), the three texts 9 of 10: 34 of 37
  assert.match(a.document.querySelector('#card .big').textContent,/92%/);
  assert.equal(a.run('S.res.wr[0].writing.types.reduce((n,r)=>n+r.max,0)'),37);
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

test('A2 writing explains full spelling points and practises an identified rule in a different sentence the next day', async()=>{
  const a=await app();
  assert.match(a.run('scoreHTML({inhoud:3,spelling:2},null,[{kind:"spelling"}])'),/Kleine spelfouten kunnen bij deze score/);
  a.run('S.lvl="A2"; S.writingRules=scheduleWritingRules(null,[{kind:"inversie"}],today(),1);drawPlan()');
  assert.equal(a.document.querySelector('#dayrule'),null);
  a.run('S.writingRules.inversie.day=today();drawPlan()');
  a.document.querySelector('#dayrule').click();
  assert.match(a.document.querySelector('#tbody').textContent,/Schrijf aan een collega/);
  a.document.querySelector('#ruleanswer').value='Morgen ik begin om negen uur';
  a.document.querySelector('#rulecheck').click();
  assert.match(a.document.querySelector('#rulestatus').textContent,/Morgen krijg je een nieuwe zin/);
  a.run('S.writingRules.inversie.day=today();home();drawPlan()');
  a.document.querySelector('#dayrule').click();
  assert.match(a.document.querySelector('#tbody').textContent,/Schrijf aan een buur/);
  a.document.querySelector('#ruleanswer').value='Vanavond breng ik de sleutel.';
  a.document.querySelector('#rulecheck').click();
  assert.match(a.document.querySelector('#rulestatus').textContent,/goed toegepast/);
  assert.equal(a.run('S.writingRules.inversie.ok'),true);
});

test('A2 writing exam can retry the same draft after a timeout and record the result once',async()=>{
  const mock=checker();
  let attempts=0;
  const a=await app({fetch:(url,options)=>{
    if(url==='/api/check'&&++attempts===1)return new Response('{"error":"timeout"}',{status:504});
    return mock.fetch(url,options);
  }});
  await submit(a);
  assert.equal(a.run('!!getDraft("wr",true)'),true);
  assert.equal(a.run('S.res?.wr?.length || 0'),0);
  a.document.querySelector('#retrycheck').click();
  await a.flush();
  assert.equal(attempts,2);
  assert.equal(a.run('!!getDraft("wr",true)'),false);
  assert.equal(a.run('S.res.wr.length'),1);
  assert.equal(a.run('Object.values(S.xs).every(n=>n===1)'),true);
});

test('A2 writing uses the most frequent exam rule for two different day-plan sentences',async()=>{
  const check=checker(grades=>grades.map((row,i)=>({...row,errors:[
    {...row.errors[0],kind:'inversie'},...(i===0?[{wrong:'De fietsen staat',right:'De fietsen staan',kind:'meervoud'}]:[])
  ]})));
  const a=await app({fetch:check.fetch});
  await submit(a);
  assert.match(a.document.querySelector('#card').textContent,/Woordvolgorde ging 4 keer mis/);
  assert.equal(a.run('Object.keys(S.writingRules).join()'),'inversie');
  assert.equal(a.run('dueWritingRule(S.writingRules,today())'),undefined);
  for(const [i,answer] of ['Morgen begin ik om negen uur.','Vanavond breng ik de sleutel.'].entries()){
    a.run('S.writingRules.inversie.day=today();setTab("vandaag");home();drawPlan()');
    a.document.querySelector('#dayrule').click();
    a.document.querySelector('#ruleanswer').value=answer;
    a.document.querySelector('#rulecheck').click();
    assert.equal(a.run('S.writingRules.inversie.hits'),i+1);
  }
  assert.match(a.run('planHTML()'),/2 keer goed toegepast/);
  assert.equal(a.run('dueWritingRule(S.writingRules,today()+1)'),undefined);
});

test('A2 guest can add missing content and compare without paying for a second check',async()=>{
  const original='Hoi buurvrouw, ik ga een week op vakantie. Kun je mijn planten water geven? Bedankt!';
  const mock=checker(()=>[{...grade({...perfect,inhoud:2}),corrected:original,verdict:'Schrijf ook waar de sleutel ligt.'}]);
  const a=await app({fetch:mock.fetch});
  a.run('build("wr",{...SEC.find(s=>s.id==="wr"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.k==="wr|0")],draftSlot:"landing"})');
  type(a,'#txt',original);
  a.document.querySelector('#chk').click();
  await a.flush();
  assert.doesNotMatch(a.document.querySelector('#fb').textContent,/Verbeterde tekst/);
  a.document.querySelector('#reviseContent').click();
  assert.equal(a.document.querySelector('#revision').value,original);
  assert.ok(a.document.querySelector('#compareRevision').disabled);
  type(a,'#revision',original+' De sleutel ligt bij de achterdeur.');
  a.document.querySelector('#compareRevision').click();
  assert.match(a.document.querySelector('#revisionExample').textContent,/Voorbeeldantwoord/);
  assert.equal(mock.calls.length,1);
});

test('A2 practice: up to three corrections on one screen, punctuation-only ones left out',async()=>{
  const errors=[
    {wrong:'Morgen ik kom',right:'Morgen kom ik',why:'De persoonsvorm staat op plaats twee.'},
    {wrong:'de huis',right:'het huis',why:'Huis is een het-woord.'},
    {wrong:'Ik ben gisteren',right:'Ik ben gisteren.',why:'Aan het eind van een zin staat een punt.'},
    {wrong:'ik heb gewerkt',right:'Ik heb gewerkt',why:'Een zin begint met een hoofdletter.'},
    {wrong:'hij werk',right:'hij werkt',why:'Bij hij komt er een t achter.'},
  ];
  const mock=checker(()=>[{...grade({...perfect,grammatica:1},errors),corrected:'Morgen kom ik naar het huis. Ik heb gewerkt en hij werkt.'}]);
  const a=await app({fetch:mock.fetch});
  a.run('build("wr",{...SEC.find(s=>s.id==="wr"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.k==="wr|0")]})');
  type(a,'#txt','Morgen ik kom naar de huis. ik heb gewerkt en hij werk. Ik ben gisteren');
  a.document.querySelector('#chk').click();
  await a.flush();
  assert.doesNotMatch(a.document.querySelector('#fb').textContent,/Aan het eind van een zin staat een punt/);
  const go=a.document.querySelector('#next');
  assert.match(go.textContent,/Verbeter je 3 belangrijkste fouten/);
  go.click();
  assert.ok(a.document.querySelector('#fix0')&&a.document.querySelector('#fix2'));
  assert.equal(a.document.querySelector('#fix3'),null);
  assert.match(a.document.querySelector('#card').textContent,/De andere fout staat in de uitleg/);
  a.document.querySelector('#fix0').value='Morgen kom ik';
  a.document.querySelector('#fix1').value='het huis';
  a.document.querySelector('#fixcheck').click();
  assert.equal(a.document.querySelector('#fixcheck').textContent,'Controleer');
  a.document.querySelector('#fix2').value='Ik heb gewerkt';
  a.document.querySelector('#fixcheck').click();
  assert.equal(a.document.querySelector('#fixcheck').textContent,'Verder');
  assert.equal(mock.calls.length,1);
});

test('A2 practice shows the learner\'s text beside the corrected one, the changed words marked, to listen to',async()=>{
  const mine='Volgende week ik ga op vakantie. De sleutel ligd onder de mat.';
  const fixed='Volgende week ga ik op vakantie. De sleutel ligt onder de mat.';
  const mock=checker(tasks=>tasks.map(t=>({...t,corrected:fixed,errors:[{wrong:'ik ga',right:'ga ik',kind:'inversie',why:'Na een tijd komt eerst het werkwoord.'},{wrong:'ligd',right:'ligt',kind:'spelling',why:'Met een t.'}]})));
  const a=await app({fetch:mock.fetch});
  a.run('build("wr",{...SEC.find(s=>s.id==="wr"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.k==="wr|0")],draftSlot:"landing"})');
  type(a,'#txt',mine);
  a.document.querySelector('#chk').click();
  await a.flush();
  const fb=a.document.querySelector('#fb'),panes=fb.querySelectorAll('.wdiff .sample');
  assert.equal(panes.length,2);
  assert.equal(panes[0].querySelectorAll('mark.err').length,2,'the mistakes are marked in the learner\'s text');
  assert.equal(panes[1].textContent,fixed);
  assert.deepEqual([...panes[1].querySelectorAll('ins')].map(x=>x.textContent),['ga ik','ligt']);
  assert.ok(fb.querySelector('#wlisten'));
  assert.ok(fb.innerHTML.indexOf('wdiff')<fb.innerHTML.indexOf('class="dpts"'),'before the points');
  assert.match(fb.textContent,/Het belangrijkste om te verbeteren:/);
});
