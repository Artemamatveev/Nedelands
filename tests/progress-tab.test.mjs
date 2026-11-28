import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

// Voortgang (the fourth tab, 28 November 2026): a report from the progress, with buttons to work on the mistakes.
test('Nothing practised: a short empty state', async()=>{
  const a=await app();a.run('setTab("herhalen");home()');
  assert.match(a.document.querySelector('#mine').textContent,/Hier komt je voortgang/);
  assert.match(a.document.querySelector('[data-t="herhalen"]').textContent,/Voortgang/);
});

test('The report: share right, numbers, per part, strong and weak groups, kinds of mistakes, and practice from each', async()=>{
  const a=await app();
  a.run(`const d=today();S.qd={[d]:40,[d-1]:10};S.qr={[d]:30,[d-1]:10};S.tm={[d]:3600,[d-1]:1800};
    ITEMS.filter(q=>q.sec==="knm").slice(0,6).forEach(q=>S.items[q.k]={b:3,d:d+4,r:5,w:0});
    ITEMS.filter(q=>q.sec==="lz").slice(0,4).forEach(q=>S.items[q.k]={b:0,d,r:1,w:3});
    S.res={lz:[{at:Date.now(),pc:88}]};
    keepErrs([{wrong:"ik ga",right:"ga ik",kind:"inversie",why:"x"},{wrong:"geeven",right:"geven",kind:"spelling",why:"x"},{wrong:"De boeken ligt",right:"De boeken liggen",kind:"meervoud",why:"x"},{wrong:"hij lopen",right:"hij loopt",kind:"spelling",why:"y"},{wrong:"het tafel",right:"de tafel",kind:"grammatica",why:"z"}]);
    ITEMS.filter(q=>q.sec==="gs").slice(0,5).forEach(q=>S.items[q.k]={b:0,d,r:0,w:4});
    setTab("herhalen");home()`);
  const m=a.document.querySelector('#mine'),t=m.textContent;
  assert.match(m.querySelector('.ring').textContent,/80%/,'40 of 50 right');
  assert.match(t,/Dagen geoefend/);assert.match(t,/1,5/,'hours');
  assert.match(t,/Per onderdeel/);assert.match(m.querySelector('[data-vp="lz"]').textContent,/8\/10/,'the last proefexamen as an oefencijfer');
  assert.match(t,/Hier ben je goed in/);assert.match(t,/Hier maak je de meeste fouten/);
  assert.match(t,/Grammatica/);assert.doesNotMatch(t,/Geschiedenis/,'history is not an exam topic');
  const kinds=[...m.querySelectorAll('[data-vc]')].map(b=>b.dataset.vc);
  assert.equal(kinds[0],'sp','the rule with the most own mistakes first');assert.ok(kinds.includes('wo')&&kinds.includes('dh')&&kinds.includes('mv'));
  assert.equal(a.run('S.errs.every(e=>e.c)'),true);
  m.querySelector('[data-vc="sp"]').click();
  assert.equal(a.document.querySelector('#play').hidden,false);
  assert.equal(a.run('queue.every(q=>q.sec==="er")&&queue.length'),2);
  a.run('setTab("herhalen");home()');
  a.document.querySelector('#mine [data-vw="0"]').click();
  assert.equal(a.document.querySelector('#play').hidden,false);
});

test('Growth: a line of the share right per week, practice minutes per week, the trend and each part\'s proefexamens', async()=>{
  const a=await app();
  a.run(`const d=today();S.qd={[d]:20,[d-8]:20,[d-15]:10};S.qr={[d]:18,[d-8]:12,[d-15]:5};S.tm={[d]:1800,[d-8]:1200};
    S.res={lz:[{at:1,pc:60},{at:2,pc:72},{at:3,pc:84}]};setTab("herhalen");home()`);
  const m=a.document.querySelector('#mine');
  assert.match(m.textContent,/Zo ga je vooruit/);
  assert.match(m.textContent,/30% beter dan vorige week/,'90% this week against 60% the week before');
  const charts=m.querySelectorAll('svg.chart');
  assert.equal(charts.length,3,'share right, minutes, one part');
  assert.equal(charts[0].querySelectorAll('circle').length,3,'only weeks with answers get a point');
  assert.match(charts[0].getAttribute('aria-label'),/90%/);
  assert.equal(charts[1].querySelectorAll('rect').length,8,'eight weeks of minutes');
  assert.ok(charts[2].querySelector('.cgoal'),'the oefendoel line on the proefexamen chart');
  assert.match(charts[2].getAttribute('aria-label'),/60%, 72%, 84%/);
});

test('One place for the weak topics: the weakest five, the rest under Meer onderwerpen, no separate screen', async()=>{
  const a=await app();
  a.run(`const d=today();[...new Set(ITEMS.filter(q=>q.sec==="knm").map(q=>q.label))].slice(0,8).forEach((l,j)=>ITEMS.filter(q=>q.label===l).slice(0,3).forEach(q=>S.items[q.k]={b:0,d,r:j,w:7-j}));
    S.qd={[d]:60};S.qr={[d]:20};setTab("herhalen");home()`);
  const m=a.document.querySelector('#mine');
  assert.equal(a.document.querySelector('#stats'),null);assert.equal(m.querySelector('[data-x="stats"]'),null);
  const top=m.querySelectorAll('h3+.list [data-vw]').length,rest=m.querySelectorAll('.vmore [data-vw]').length;
  assert.ok(top<=5&&top>0);assert.ok(rest>0,'the other topics under Meer onderwerpen');
  m.querySelector('.vmore [data-vw]').click();
  assert.equal(a.document.querySelector('#play').hidden,false);
});

test('Own mistakes are sorted into grammar rules from the words themselves', async()=>{
  const a=await app();
  const c=(w,r,k='grammatica')=>a.run(`grammarCat(${JSON.stringify({w,r,c:k})})`);
  assert.equal(c('ik ga morgen','morgen ga ik'),'wo');assert.equal(c('het tafel','de tafel'),'dh');assert.equal(c('ik ga naar winkel','ik ga naar de winkel'),'dh');
  assert.equal(c('een mooi fiets','een mooie fiets'),'bn');assert.equal(c('hij word','hij wordt'),'ww');assert.equal(c('ik heb gewerkd','ik heb gewerkt'),'ww');
  assert.equal(c('geeven','geven','spelling'),'sp');assert.equal(c('De boeken ligt','De boeken liggen','meervoud'),'mv');
  assert.equal(c('ik ben blij','ik voel me blij','woorden'),'wd');assert.equal(c('x','y','inhoud'),null);
});
