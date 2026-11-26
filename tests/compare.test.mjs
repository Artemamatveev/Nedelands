// The owner's model comparison (api/compare.js): only the owner, only POST from the site itself; every made-up answer is
// graded by the free and the paid model, and one failing call doesn't stop the others.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';
import {SAMPLES} from '../api/_samples.js';

async function ask({user = null, method = 'POST', same = true, fails = '', body = {}, samples = SAMPLES} = {}) {
  const calls = [];
  const deps = {
    './_supa.js': {accounts: true, caller: async () => user, sameOrigin: () => same},
    './admin.js': {admins: () => ['eigenaar@example.nl'],
      verifiedMail: u => (u && u.email_confirmed_at ? String(u.email || '').toLowerCase() : ''),
      isOwner: u => !!(u && u.email_confirmed_at && String(u.email || '').toLowerCase() === 'eigenaar@example.nl')},
    './check.js': {MODELS: {free: 'claude-haiku-5-5', paid: 'claude-sonnet-5-5'}, gradeWriting: async (s, model) => {
      calls.push([s.id, model]);
      if (s.id === fails && model.includes('haiku')) throw Error('refusal');
      const total = model.includes('haiku') ? 7 : 8;
      const scores={inhoud:s.id==='sleutel-ontbreekt'?2:3,woorden:2,grammatica:2,spelling:2,samenhang:1};
      if(model.includes('haiku')&&s.id==='sleutel-alternatief')scores.woorden=1;
      return {model, scores, total, passed: total >= 7, errors: 2};
    }},
    './_samples.js': {SAMPLES: samples},
  };
  const context = vm.createContext({String, Math, Promise});
  const mods = Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, new vm.SyntheticModule(Object.keys(v), function () { for (const [n, x] of Object.entries(v)) this.setExport(n, x); }, {context})]));
  const module = new vm.SourceTextModule(fs.readFileSync(new URL('api/_compare.js', root), 'utf8'), {context});
  await module.link(s => mods[s]); await module.evaluate();
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(b) { this.body = b; return this; }};
  await module.namespace.default({method, headers: {}, body}, res);
  return {res, calls};
}
const owner = {id: '1', email: 'Eigenaar@example.nl', email_confirmed_at: '2026-11-01T00:00:00Z'};

test('Only the owner can run the comparison, by POST from the site', async () => {
  for (const [opts, code] of [[{}, 401], [{user: {...owner, email: 'x@y.z'}}, 403], [{user: {...owner, email_confirmed_at: null}}, 403], [{user: owner, method: 'GET'}, 405], [{user: owner, same: false}, 403]]) {
    const r = await ask(opts); assert.equal(r.res.statusCode, code, JSON.stringify(opts)); assert.equal(r.calls.length, 0);
  }
});
test('Every sample is graded by both models; a failed call is reported, not fatal', async () => {
  const r = await ask({user: owner, fails: SAMPLES[0].id});
  assert.equal(r.res.statusCode, 200); assert.equal(r.res.headers['Cache-Control'], 'no-store');
  assert.equal(r.calls.length, SAMPLES.length * 2);
  assert.equal(r.res.body.rows.length, SAMPLES.length);
  assert.match(r.res.body.rows[0].free.error, /refusal/);
  assert.equal(r.res.body.summary.compared, SAMPLES.length - 1);
  assert.equal(r.res.body.summary.samePassed, SAMPLES.length - 1);
  assert.equal(r.res.body.summary.keyChecks.free.content,true);
  assert.equal(r.res.body.summary.keyChecks.free.language,false);
  assert.equal(r.res.body.summary.keyChecks.paid.language,true);
  assert.equal(r.res.body.summary.meanDiff, 1); assert.equal(r.res.body.summary.maxDiff, 1);
});
test('The samples are made-up A2 answers with a task and a text', () => {
  assert.ok(SAMPLES.length >= 8);
  assert.equal(new Set(SAMPLES.map(s => s.id)).size, SAMPLES.length);
  for (const s of SAMPLES) { assert.ok(s.task.length > 40); assert.ok(s.text.length > 20); }
});
test('The owner can download the answers without any model result, for a blind NT2 review', async () => {
  const r = await ask({user: owner, body: {list: true}});
  assert.equal(r.res.statusCode, 200); assert.equal(r.calls.length, 0);
  assert.equal(r.res.body.samples.length, SAMPLES.length);
  assert.deepEqual(Object.keys(r.res.body.samples[0]).sort(), ['id', 'task', 'text']);
  const stranger = await ask({body: {list: true}}); assert.equal(stranger.res.statusCode, 401);
});
test('Without teacher scores there is no teacher comparison; with them the models are measured against the teacher', async () => {
  const none = await ask({user: owner});
  assert.equal(none.res.body.summary.teacher.free, null);
  const scored = SAMPLES.map((s, i) => i < 2 ? {...s, expected: {inhoud: 3, woorden: 2, grammatica: 1, spelling: 2, samenhang: 1}} : s);
  const r = await ask({user: owner, samples: scored});
  const t = r.res.body.summary.teacher.paid;
  assert.equal(t.n, 2); assert.equal(t.within1, 100); assert.equal(t.samePass, 100);
  assert.equal(t.criteria.grammatica, 0); assert.equal(t.criteria.inhoud, 50); // the second sample misses the key: the mock model gives inhoud 2
  assert.ok(r.res.body.rows[0].expected);
});
test('No sample carries a teacher score that a teacher did not give', () => {
  for (const s of SAMPLES.filter(s => s.expected)) assert.ok(s.expected.by && s.expected.date, s.id);
});
