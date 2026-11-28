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
    keepErrs([{wrong:"ik ga",right:"ga ik",kind:"inversie",why:"x"},{wrong:"ligd",right:"ligt",kind:"spelling",why:"x"},{wrong:"De boeken ligt",right:"De boeken liggen",kind:"meervoud",why:"x"},{wrong:"hij lopen",right:"hij loopt",kind:"spelling",why:"y"}]);
    setTab("herhalen");home()`);
  const m=a.document.querySelector('#mine'),t=m.textContent;
  assert.match(m.querySelector('.ring').textContent,/80%/,'40 of 50 right');
  assert.match(t,/Dagen geoefend/);assert.match(t,/1,5/,'hours');
  assert.match(t,/Per onderdeel/);assert.match(m.querySelector('[data-vp="lz"]').textContent,/8\/10/,'the last proefexamen as an oefencijfer');
  assert.match(t,/Hier ben je goed in/);assert.match(t,/Hier maak je de meeste fouten/);
  assert.match(t,/Soorten fouten in je teksten en antwoorden/);
  const kinds=[...m.querySelectorAll('[data-vc]')].map(b=>b.dataset.vc);
  assert.equal(kinds[0],'spelling','the most frequent kind first');
  assert.equal(a.run('S.errs.every(e=>e.c)'),true);
  m.querySelector('[data-vc="spelling"]').click();
  assert.equal(a.document.querySelector('#play').hidden,false);
  assert.equal(a.run('queue.every(q=>q.sec==="er")&&queue.length'),2);
  a.run('setTab("herhalen");home()');
  a.document.querySelector('#mine [data-vw="0"]').click();
  assert.equal(a.document.querySelector('#play').hidden,false);
});
