import test from 'node:test';
import assert from 'node:assert/strict';
import { app, storage } from './app-harness.mjs';

function type(a,selector,text){const el=a.document.querySelector(selector);el.value=text;el.oninput();}

test('First visit offers guest entry or login without starting a sample exercise',async()=>{
  const a=await app();a.run('acc.cfg={login:["email"]};welcome()');
  assert.equal(a.document.querySelectorAll('#welcome .wcard button').length,2);
  assert.equal(a.document.querySelector('#wtry'),null);
  assert.equal(a.document.querySelector('#welcome .wart'),null);
  a.document.querySelector('#wlogin').click();
  assert.ok(a.document.querySelector('#wmail'));
  a.run('drawWelcome()');
  assert.ok(a.document.querySelector('#wmail'),'redraw preserves the chosen login form');
  a.document.querySelector('#wlater').click();
  assert.ok(a.document.querySelector('#wlogin'),'back restores both entry choices');
  a.document.querySelector('#wlater').click();
  assert.equal(a.document.querySelector('#welcome').hidden,true);
  assert.equal(a.document.querySelector('#home').hidden,false);
  assert.equal(a.document.querySelector('#play').hidden,true);
  assert.equal(a.run('lsGet(WEL)'), '1');
  a.run('welcome()');
  assert.ok(a.document.querySelector('#wmail'),'explicit login remains direct after guest entry');
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
    [...a.document.querySelectorAll('#tbody .opt')].find(x=>x.querySelector('.tx').textContent===correct).click();
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
test('No two top-level functions share a name (the later one silently replaced the Word export)',async()=>{
  const {readFileSync}=await import('node:fs');
  const names=readFileSync(new URL('../oefenen.html',import.meta.url),'utf8').split('\n')
    .map(l=>/^(?:async )?function ([A-Za-z_$][\w$]*)/.exec(l)?.[1]).filter(Boolean);
  assert.deepEqual(names.filter((n,i)=>names.indexOf(n)!==i),[]);
  const a=await app();
  assert.equal(a.run('zipStored([["a.xml","<a/>"]],"application/zip") instanceof Blob'),true);
});
test('The right answer is not usually the longest option, so length gives nothing away',async()=>{
  const a=await app();
  const share=JSON.parse(a.run(`JSON.stringify(Object.fromEntries(["lz","l1","ls","lb","knm","gs"].map(sec=>{
    const qs=ITEMS.filter(q=>q.sec===sec&&q.type==="choice"&&q.opts);
    const longest=qs.filter(q=>{const o=q.opts().map(String),m=Math.max(...o.map(x=>x.length));return q.right.length===m&&o.filter(x=>x.length===m).length===1});
    return [sec,longest.length/qs.length]})))`));
  for(const [sec,s] of Object.entries(share))assert.ok(s<=0.42,`${sec}: the right answer is the longest in ${Math.round(s*100)}%`);
});
test('Every example answer in Gesprekken passes its own keyword check',async()=>{
  const a=await app();
  const bad=JSON.parse(a.run(`JSON.stringify(GP.flatMap(c=>c.d.map((l,i)=>[c.id+"#"+i,l]).filter(([,l])=>!gpFits(l.k,l.m.replace(/\\[[^\\]]*\\]/g,"Sara"))).map(x=>x[0])))`));
  assert.deepEqual(bad,[]);
});
test('History chapter years are translated in the menus, Dutch stays as it is',async()=>{
  const a=await app();
  const t=(l,y)=>a.run(`LANG=${JSON.stringify(l)};LI=LCODE.indexOf(LANG);uiR(${JSON.stringify(y)})`);
  assert.equal(t('en','ca. 3400–3100 v.Chr.'),'c. 3400–3100 BC');
  assert.equal(t('en','12 v.Chr. – ca. 400'),'12 BC – c. 400');
  assert.equal(t('tr','1957–nu'),'1957–bugün');
  assert.equal(t('zh','ca. 1000–1500'),'约1000–1500');
  assert.equal(t('en','1568–1648'),null);
});
test('KNM opens a theme list on Oefenen, and a theme round keeps to that theme',async()=>{
  const a=await app();a.run('home();setTab("oefenen")');
  const row=a.document.querySelector('#parts [data-knm]');
  assert.ok(row);assert.equal(a.document.querySelector('#knmsub').hidden,true);
  row.click();
  assert.equal(a.document.querySelector('#knmsub').hidden,false);
  assert.equal(row.getAttribute('aria-expanded'),'true');
  assert.equal(a.document.querySelectorAll('#knmsub [data-kt]').length,9);
  a.document.querySelector('#knmsub [data-kt="2"]').click();
  const theme=a.run('KNMT[2]');
  assert.equal(a.run('cur.theme'),theme);
  assert.ok(a.run(`queue.length>0&&queue.every(q=>q.label==="KNM: "+${JSON.stringify(theme)})`));
  a.run('build(cur.id,cur.pool||cur.back||cur.theme?cur:null)'); // "Nog een ronde"
  assert.ok(a.run(`queue.every(q=>q.label==="KNM: "+${JSON.stringify(theme)})`));
  a.run('home();setTab("oefenen")');a.document.querySelector('#knmsub [data-kt="all"]').click();
  assert.equal(a.run('cur.theme'),undefined);
  assert.ok(a.run('new Set(queue.map(q=>q.label)).size>1'));
  assert.equal(a.run('KNMT.every(t=>UI[t]&&UI[t].length===7)&&UI["Alle thema\'s"].length===7'),true);
});
test('A practice round keeps at least half new questions while unseen ones remain',async()=>{
  const a=await app();
  a.run('const d=today();ITEMS.filter(x=>x.sec==="knm").slice(0,60).forEach(x=>S.items[x.k]={b:1,d:d-1,r:1,w:0})');
  a.run('build("knm",{...SEC.find(x=>x.id==="knm"),...SHORT.knm})');
  assert.equal(a.run('queue.length'),5);
  assert.ok(a.run('queue.filter(q=>!S.items[q.k]).length')>=3);
  // situations (the exam's format since July 2025) are among the first new questions, not after all short ones
  a.run('S.items={}');
  assert.ok(a.run('[0,1,2,3,4,5,6,7,8,9].some(()=>{build("knm");return queue.some(q=>q.sit)})'));
});
test('A question answered right the first time comes back in four days; a known one rests longer',async()=>{
  const a=await app();a.run('build("knm")');
  const k=a.run('queue[0].k');
  a.run('record(true,queue[0])');
  assert.equal(a.run(`S.items[${JSON.stringify(k)}].d-today()`),4);
  a.run(`S.items[${JSON.stringify(k)}].b=5;record(true,{...queue[0],retry:false})`);
  assert.equal(a.run(`S.items[${JSON.stringify(k)}].d-today()`),30);
  a.run(`record(false,{...queue[0],retry:false})`);
  assert.equal(a.run(`S.items[${JSON.stringify(k)}].b`),0);
  assert.equal(a.run(`S.items[${JSON.stringify(k)}].d-today()`),0);
});
test('Reading and listening practice brings new texts, and a text with a mistake back first',async()=>{
  const a=await app();
  // every question of the first two Lezen texts answered right and due today: a new text still comes first
  a.run(`const d=today(),T=[...new Set(ITEMS.filter(x=>x.sec==="lz").map(x=>x.text))];
    ITEMS.filter(x=>x.sec==="lz"&&(x.text===T[0]||x.text===T[1])).forEach(x=>S.items[x.k]={b:2,d,r:1,w:0})`);
  assert.equal(a.run('someTexts("lz",1)().every(q=>!S.items[q.k])'),true);
  // a wrong answer in the second text: that text comes back first
  a.run('const T2=[...new Set(ITEMS.filter(x=>x.sec==="lz").map(x=>x.text))][1];S.items[ITEMS.find(x=>x.sec==="lz"&&x.text===T2).k]={b:0,d:today(),r:0,w:1}');
  assert.equal(a.run('someTexts("lz",1)()[0].text===[...new Set(ITEMS.filter(x=>x.sec==="lz").map(x=>x.text))][1]'),true);
});
test('Answers are counted per day for the overview; a retry after a mistake is not',async()=>{
  const a=await app();a.run('build("knm")');
  a.run('record(true,queue[0]);record(false,queue[1]);record(true,{...queue[1],retry:true})');
  const d=a.run('String(today())');
  assert.equal(a.run(`S.qd[${JSON.stringify(d)}]`),2);
  assert.equal(a.run(`S.qr[${JSON.stringify(d)}]`),1);
});
