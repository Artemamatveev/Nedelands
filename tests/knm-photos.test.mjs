import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('every KNM question has a separate local JPEG', () => {
  const bank = readFileSync(new URL('../data/knm.js', import.meta.url), 'utf8');
  const questions = runInNewContext(bank + '\nKNM');
  const used = new Map();
  for (const [, question, , , , , photo] of questions) {
    assert.match(photo ?? '', /^[a-z0-9-]+$/, question);
    const bytes = readFileSync(new URL('../foto/' + photo + '.jpg', import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, question);
    const hash = createHash('sha256').update(bytes).digest('hex');
    assert.ok(!used.has(hash), question + ' shares its photo with ' + used.get(hash));
    used.set(hash, question);
  }
});

test('KNM photos come with the question as on DUO\'s exam, except the ones that give the answer away',async()=>{
  const {app}=await import('./app-harness.mjs');
  const a=await app();
  assert.equal(a.run('ITEMS.filter(q=>q.sec==="knm"&&q.late).length'),44);
  a.run('build("knm",{...SEC.find(s=>s.id==="knm"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.sec==="knm"&&q.pics&&!q.late&&FOTO[q.pics[0]])]})');
  const img=a.document.querySelector('#card .pics img');
  assert.ok(img,'an ordinary photo shows before the answer');
  assert.equal(img.getAttribute('alt'),'','without a description that could name the answer');
  a.run('build("knm",{...SEC.find(s=>s.id==="knm"),n:1,keep:1,pool:()=>[ITEMS.find(q=>q.sec==="knm"&&q.pics?.[0]==="ambulance")]})');
  assert.equal(a.document.querySelector('#knmpic').hidden,true,'"112" on the ambulance waits until the answer');
  a.run('startExam("knm",true)');
  const lateInExam=a.run('queue.findIndex(q=>q.late)');
  if(lateInExam>=0){a.run(`pos=${lateInExam};show()`);assert.equal(a.document.querySelector('#card .pics'),null)}
});
