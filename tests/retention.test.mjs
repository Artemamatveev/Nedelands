import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

// Three things that bring learners back (28 November 2026): a lost streak won back with three rounds, their own mistakes
// returning by themselves on Mijn dag, and practising KNM and Luisteren by voice.

test('A lost streak of 3+ days comes back after three rounds on one day, once a month', async()=>{
  const a=await app();
  a.run('S.last=today()-5;S.streak=12;delete S.frz;complete()');
  assert.equal(a.run('S.streak'),1);
  assert.deepEqual(a.run('JSON.stringify([S.lost.n,S.lost.c])'),'[12,1]');
  a.run('setTab("vandaag");home()');
  assert.match(a.document.querySelector('#plan').textContent,/Je reeks van 12 dagen is gestopt/);
  a.run('complete();complete()');
  assert.equal(a.run('S.streak'),13,'the old days and today');
  assert.equal(a.run('S.lost'),undefined);
  assert.equal(a.run('S.revAt===today()&&S.revived===today()'),true);
  a.run('home()');
  assert.match(a.document.querySelector('#plan').textContent,/Je reeks is terug: 13 dagen op rij!/);
  // lost again within the month: no second revival
  a.run('S.last=today()-4;S.streak=5;complete()');
  assert.equal(a.run('S.lost'),undefined);
});

test('A short streak or an old loss gives nothing back', async()=>{
  const a=await app();
  a.run('S.last=today()-5;S.streak=2;complete()');
  assert.equal(a.run('S.lost'),undefined);
  a.run('S.lost={n:9,d:today()-8,c:0,cd:0};complete()');
  assert.equal(a.run('S.lost'),undefined,'more than a week ago');
});

test('Own mistakes come back on Mijn dag from the next day, by their spaced repetition', async()=>{
  const a=await app();
  a.run('keepErrs([{wrong:"ik ga morgen niet",right:"ga ik morgen niet",why:"Woordvolgorde."}])');
  assert.equal(a.run('S.errs[0].d===today()'),true);
  assert.equal(a.run('dueErrs().length'),0,'not on the day itself');
  a.run('S.errs[0].d=today()-1;setTab("vandaag");home()');
  assert.equal(a.run('dueErrs().length'),1);
  assert.ok(a.document.querySelector('#dayerrs'));
  // right once: back after the gap of its box; known after four times right
  a.run('S.items["er|"+S.errs[0].r]={b:1,d:today()+2,r:1}');
  assert.equal(a.run('dueErrs().length'),0);
  a.run('S.items["er|"+S.errs[0].r]={b:4,d:today()-1,r:4}');
  assert.equal(a.run('dueErrs().length'),0);
});

test('Hands-free: A, B or C (or the words of an answer) is understood, and the screen says when it can\'t listen', async()=>{
  const a=await app();
  const pick=(said)=>a.run(`hfPick(${JSON.stringify(said)},["De gemeente","De huisarts","De politie"])`);
  assert.equal(pick('B'),1);assert.equal(pick('ik denk antwoord c'),2);assert.equal(pick('twee'),1);assert.equal(pick('A.'),0);
  assert.equal(pick('herhaal'),'again');assert.equal(pick('stop'),'stop');
  assert.equal(a.run('hfPick("naar de huisarts natuurlijk",["Naar de gemeente gaan","Naar de huisarts gaan","Naar de politie gaan"])'),1);
  assert.equal(pick('ehm'),-1);
  a.run('hfScreen()');
  assert.match(a.document.querySelector('#tbody').textContent,/Oefenen zonder handen/);
  if(!a.run('hfOK()'))assert.match(a.document.querySelector('#tbody').textContent,/kan Bittertalen niet luisteren/);
});
