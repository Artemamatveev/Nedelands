import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './app-harness.mjs';

const authTimers = a => [...a.timers.values()].filter(t => t.fn.toString().includes('authEventVersion'));
test('A delayed sign-out event cannot override a newer signed-in session', async () => {
  const a = await app();
  a.run('acc.user={id:"one"};globalThis.changes=[];setUser=async user=>{changes.push(user?.id||null);acc.user=user}');
  a.run('accountChanged("SIGNED_OUT",null);accountChanged("SIGNED_IN",{user:{id:"one"}})');
  for (const timer of authTimers(a)) await timer.fn();
  assert.equal(a.run('acc.user.id'), 'one');
  assert.deepEqual(Array.from(a.run('changes')), []);
});
test('The latest sign-out event still clears the local account', async () => {
  const a = await app();
  a.run('acc.user={id:"one"};globalThis.changes=[];setUser=async user=>{changes.push(user?.id||null);acc.user=user}');
  a.run('accountChanged("SIGNED_IN",{user:{id:"two"}});accountChanged("SIGNED_OUT",null)');
  for (const timer of authTimers(a)) await timer.fn();
  assert.equal(a.run('acc.user'), null);
  assert.deepEqual(Array.from(a.run('changes')), [null]);
});
test('Leaving this browser does not sign out the other devices', async () => {
  const a = await app();
  a.run('acc.user={id:"one",email:"fixture@example.test"};acc.cfg={login:[]};acc.sb={auth:{signOut:async opts=>{globalThis.logoutOptions=opts;return {}}}};drawProfile()');
  await a.document.getElementById('aout').onclick();
  assert.equal(a.run('logoutOptions.scope'), 'local');
  assert.equal(a.run('acc.user'), null);
});
