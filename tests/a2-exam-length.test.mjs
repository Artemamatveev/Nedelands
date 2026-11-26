import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

test('A2 reading fills all exam slots without splitting passages when greedy selection falls short',async()=>{
  const a=await app();
  a.run(`{
    const reading=ITEMS.filter(q=>q.sec==="lz"), passages=new Map();
    for(const q of reading){
      if(!passages.has(q.text))passages.set(q.text,[]);
      passages.get(q.text).push(q);
    }
    const groups=[...passages.values()];
    const selected=groups.filter(g=>g.length===3).slice(0,8)
      .concat(groups.filter(g=>g.length===2).slice(0,2));
    for(const q of reading)if(!selected.some(g=>g.includes(q)))q.sec="fixture";
    S.xs=Object.fromEntries(selected.slice(8).flat().map(q=>[q.k,1]));
    startExam("lz",true);
  }`);
  assert.equal(a.run('queue.length'),25);
  assert.equal(a.run('queue.every(q=>queue.filter(item=>item.text===q.text).length===ITEMS.filter(item=>item.sec==="lz"&&item.text===q.text).length)'),true);
});
