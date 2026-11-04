import test from 'node:test';
import assert from 'node:assert/strict';
import { app, storage } from './app-harness.mjs';

function type(a,selector,text){const el=a.document.querySelector(selector);el.value=text;el.oninput();}

test('First visit offers a real reading question before signup',async()=>{
  const a=await app();a.run('welcome()');
  assert.ok(a.document.querySelector('#wtry'));
  a.document.querySelector('#wtry').click();
  assert.equal(a.run('queue.length'),1);
  assert.equal(a.document.querySelector('#play').hidden,false);
  assert.ok(a.document.querySelector('#card .doc'));
});
test('A2 and B1 daily plans fit all three time budgets and keep their steps after answers',async()=>{
  const a=await app();
  for(const level of ['A2','B1'])for(const minutes of [10,20,40]){
    a.run(`S.lvl=${JSON.stringify(level)};S.minutes=${minutes};delete S.lessonPlan;home()`);
    const before=a.run('JSON.stringify(planTasks())');
    assert.ok(a.run(`planTasks().minutes<=${minutes} && planTasks().T.length>0`));
    assert.equal(a.run('planTasks().T.some(t=>t.id.startsWith("e:"))'),false);
    a.document.querySelector('#plan .step').click();
    assert.equal(a.run('cur.exam||false'),false);
    a.run('home()');
    assert.equal(a.run('JSON.stringify(planTasks())'),before);
  }
});
test('Early diagnostic reports only tested questions and can continue to the end',async()=>{
  const a=await app();a.run('startTest()');
  a.document.querySelector('#tgo').click();
  for(let i=0;i<3;i++)a.document.querySelector('#bgn').click();
  assert.match(a.document.querySelector('#tbody').textContent,/0 van 3 goed/);
  assert.equal(a.run('S.start.miss.length'),3);
  assert.equal(a.run('S.start.untested.length'),9);
  assert.equal(a.run('S.start.asked'),3);
  a.document.querySelector('#bgcontinue').click();
  for(let i=3;i<12;i++){
    const correct=a.run(`START[${i}][2]`);
    [...a.document.querySelectorAll('#tbody .opt')].find(x=>x.textContent===correct).click();
  }
  assert.match(a.document.querySelector('#tbody').textContent,/9 van 12 goed/);
  assert.equal(a.run('S.start.untested.length'),0);
});
test('Ordinary writing is untimed and an unfinished draft survives exit and a full reload',async()=>{
  const store=storage(),a=await app({storage:store});
  a.run('build("wr")');
  const key=a.run('queue[0].k');
  type(a,'#txt','Mijn trein is vertraagd. Ik kom om tien uur.');
  assert.equal(a.document.querySelector('#timer').textContent,'');
  a.document.querySelector('#back').click();
  assert.ok(a.document.querySelector('[data-draft="wr"]'));
  const b=await app({storage:store});
  b.document.querySelector('[data-draft="wr"]').click();
  assert.equal(b.run('queue[0].k'),key);
  assert.equal(b.document.querySelector('#txt').value,'Mijn trein is vertraagd. Ik kom om tien uur.');
  assert.equal(b.document.querySelector('#timer').textContent,'');
});
test('Exam form fields, answers and the original deadline survive a full reload',async()=>{
  const store=storage(),a=await app({storage:store});
  a.run('startExam("wr",true)');
  while(!a.document.querySelector('#f0'))a.document.querySelector('#nxt').click();
  type(a,'#f0','Testnaam');type(a,'#txt','Dit is mijn antwoord voor het formulier.');
  const deadline=a.run('tEnd');
  const nav=a.run('pos<queue.length-1')?'#nxt':'#prv';
  a.document.querySelector(nav).click();
  type(a,'#txt','Dit is mijn tweede antwoord.');
  const b=await app({storage:store});b.run('startExam("wr",true)');
  assert.equal(b.document.querySelector('#txt').value,'Dit is mijn tweede antwoord.');
  assert.ok(Math.abs(b.run('tEnd')-deadline)<10);
  b.document.querySelector(nav==='#nxt'?'#prv':'#nxt').click();
  assert.equal(b.document.querySelector('#f0').value,'Testnaam');
  assert.equal(b.document.querySelector('#txt').value,'Dit is mijn antwoord voor het formulier.');
});
test('An expired exam draft opens a review, without starting another timed attempt',async()=>{
  const store=storage(),a=await app({storage:store});a.run('startExam("wr",true)');
  type(a,'#txt','Dit concept blijft bewaard.');
  const key=a.run('draftKey("wr",true)'),d=JSON.parse(store.getItem(key));d.end=Date.now()-1000;store.setItem(key,JSON.stringify(d));
  const b=await app({storage:store});b.run('startExam("wr",true)');
  assert.ok(b.document.querySelector('#lever'));
  assert.equal(b.run('tEnd'),0);
  assert.equal(b.run('cur.sent'),false);
  b.document.querySelector('#bk').click();
  assert.equal(b.document.querySelector('#txt').readOnly,true);
  assert.equal(b.document.querySelector('#txt').value,'Dit concept blijft bewaard.');
});
test('Legacy results need fresh attempts before the stable practice label is shown',async()=>{
  const a=await app();
  a.run('S.res={lz:[{at:Date.now(),pc:100},{at:Date.now(),pc:100},{at:Date.now(),pc:100}]}');
  assert.notEqual(a.run('ready("lz").cls'),'good');
  a.run('S.res.lz=S.res.lz.map(r=>({...r,nw:100}))');
  assert.equal(a.run('ready("lz").st'),'Stabiel oefenresultaat');
  a.run('S.res.lz=S.res.lz.map(r=>({...r,at:Date.now()-20*864e5}))');
  assert.notEqual(a.run('ready("lz").cls'),'good');
  a.run('S.res.sb=S.res.lz;S.lvl="B1";home()');
  assert.match(a.document.querySelector('#exam').textContent,/Uitspraak en tempo zijn niet beoordeeld/);
});

test('Every existing exercise section and home tab still opens through its normal route',async()=>{
  const a=await app();
  for(const tab of ['vandaag','examen','oefenen','herhalen','profiel'])a.run(`setTab(${JSON.stringify(tab)})`);
  const sections=JSON.parse(a.run('JSON.stringify(SEC.map(s=>s.id))'));
  for(const section of sections){
    a.run(`build(${JSON.stringify(section)})`);
    assert.equal(a.document.querySelector('#play').hidden,false,section);
    assert.ok(a.document.querySelector('#card').textContent.trim(),section);
    a.run('home()');
  }
  assert.deepEqual(a.errors,[]);
});
test('The level is chosen once: no A2/B1 tabs on Examen and Oefenen, a list in Profiel',async()=>{
  const a=await app();a.run('home()');
  assert.equal(a.document.querySelector('.seg.lvt'),null);
  assert.match(a.document.querySelector('#exam').textContent,/Oefenexamens van DUO/);
  const sel=a.document.querySelector('#plvl');
  assert.equal(sel.tagName,'SELECT');
  assert.equal(sel.querySelectorAll('option').length,2);
  sel.querySelectorAll('option').forEach(o=>o.value==='B1'?o.setAttribute('selected',''):o.removeAttribute('selected'));
  assert.equal(sel.value,'B1');
  sel.onchange();
  assert.equal(a.run('S.lvl'),'B1');
  assert.match(a.document.querySelector('#exam').textContent,/Staatsexamen NT2/);
  assert.doesNotMatch(a.document.querySelector('#exam').textContent,/Oefenexamens van DUO/);
  assert.equal(a.document.querySelector('#plvlv').textContent,'Staatsexamen B1');
});
test('The starttest asks the level first; at B1 it goes to today\'s lesson',async()=>{
  const a=await app();a.run('startTest()');
  assert.match(a.document.querySelector('#tbody').textContent,/Waar oefen je voor/);
  a.document.querySelector('#tlvl button[data-lvl="B1"]').click();
  assert.equal(a.run('S.lvl'),'B1');
  assert.match(a.document.querySelector('#tgo').textContent,/les van vandaag/);
  a.document.querySelector('#tlvl button[data-lvl="A2"]').click();
  a.document.querySelector('#tgo').click();
  assert.match(a.document.querySelector('#tbody').textContent,/Vraag 1 van/);
});
