import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

const practice=a=>a.run('build("knm",{...SEC.find(s=>s.id==="knm"),n:3})');
test('A correct practice answer flashes Dutch praise without delaying the next question',async()=>{
  const a=await app();practice(a);a.run('grade(queue[pos].right)');
  const flash=a.document.getElementById('quick-praise'),next=a.document.getElementById('next');
  assert.equal(flash.hidden,false);assert.equal(flash.getAttribute('lang'),'nl');
  assert.equal(flash.getAttribute('aria-hidden'),'true');assert.ok(flash.dataset.phrase);
  assert.equal(next.disabled,false);assert.equal(a.run('pos'),0);
  next.onclick();
  assert.equal(a.run('pos'),1);assert.equal(flash.hidden,true);
  assert.equal(a.run('S.qr[String(today())]'),1);
});
test('A mistake shows Dutch retry encouragement and keeps the correction and Next available',async()=>{
  const a=await app();practice(a);a.run('grade("__wrong__")');
  const el=a.document.getElementById('quick-praise');
  assert.equal(el.hidden,false);assert.equal(el.dataset.tone,'try');
  assert.ok(['Wat jammer!','Helaas!','Oeps!','Geeft niks!','Nog een keer!','Volgende keer beter!'].includes(el.dataset.phrase));
  assert.match(a.document.getElementById('fb').textContent,/Goed is:/);
  const next=a.document.getElementById('next');assert.equal(next.disabled,false);next.onclick();
  assert.equal(a.run('pos'),1);assert.equal(el.hidden,true);
  assert.equal(a.run('S.items[queue[0].k].w'),1);
});
test('Exam selections do not reveal whether an answer is correct',async()=>{
  const a=await app();a.run('startExam("knm",true)');a.document.querySelector('#card .opt').click();
  assert.equal(a.document.getElementById('quick-praise').hidden,true);
});
test('The 650ms pulse cleans up, rapid pulses replace each other, and consecutive phrases differ',async()=>{
  const a=await app();practice(a);a.run('quickPraise.show()');
  const el=a.document.getElementById('quick-praise'),first=el.dataset.phrase;
  a.run('quickPraise.show()');assert.notEqual(el.dataset.phrase,first);
  assert.equal(el.querySelectorAll('svg').length,1);
  const timers=[...a.timers.values()].filter(t=>t.delay===650);
  assert.equal(timers.length,1);timers[0].fn();
  assert.equal(el.hidden,true);assert.equal(el.childElementCount,0);
});
test('Navigation dismisses praise and late grading cannot flash it over the home screen',async()=>{
  const a=await app();practice(a);a.run('quickPraise.show();home()');
  assert.equal(a.document.getElementById('quick-praise').hidden,true);
  a.run('quickPraise.show()');assert.equal(a.document.getElementById('quick-praise').hidden,true);
});

test('Retry phrases do not repeat consecutively and a new reaction replaces the previous tone',async()=>{
  const a=await app();practice(a);a.run('quickPraise.show(false)');
  const el=a.document.getElementById('quick-praise'),first=el.dataset.phrase;
  a.run('quickPraise.show(false)');assert.notEqual(el.dataset.phrase,first);
  a.run('quickPraise.show(true)');assert.equal(el.dataset.tone,'good');assert.equal(el.querySelectorAll('svg').length,1);
  a.run('quickPraise.hide()');assert.equal(el.dataset.tone,undefined);
});
