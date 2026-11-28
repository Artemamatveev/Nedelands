import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

// The oefencijfer on a proefexamen result (28 November 2026): 1 to 10 like DUO's Cijfer in Mijn Inburgering, the
// oefendoel a 6, only for the inburgering parts (A2 and KNM).
test('The oefendoel is a 6, everything right a 10, under the oefendoel at most a 5', async()=>{
  const a=await app();
  const c=(k,pc)=>a.run(`oefenCijfer(${JSON.stringify(k)},${pc})`);
  assert.equal(c('lz',76),6);assert.equal(c('lz',100),10);assert.equal(c('lz',0),1);assert.equal(c('lz',75),5);
  assert.equal(c('knm',70),6);assert.equal(c('knm',85),8);assert.equal(c('wr',70),6);assert.equal(c('sp',100),10);
  assert.equal(c('lb',90),null);assert.equal(c('wb',90),null);assert.equal(c('lz',null),null);
  assert.match(a.run('cijferHTML("lz",88)'),/Oefencijfer <b>8<\/b> van 10/);
  assert.match(a.run('cijferHTML("lz",88)'),/DUO maakt zijn eigen omrekening niet bekend/);
});
