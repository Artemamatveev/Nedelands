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
test('Incorrect answers and exam answers never receive success praise',async()=>{
  const a=await app();practice(a);a.run('grade("__wrong__")');
  assert.equal(a.document.getElementById('quick-praise').hidden,true);
  a.run('startExam("knm",true)');a.document.querySelector('#card .opt').click();
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
