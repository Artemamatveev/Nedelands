// The owner's model comparison (api/compare.js): only the owner, only POST from the site itself; every made-up answer is
// graded by the free and the paid model, and one failing call doesn't stop the others.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';
import {SAMPLES} from '../api/_samples.js';

async function ask({user = null, method = 'POST', same = true, fails = ''} = {}) {
  const calls = [];
  const deps = {
    './_supa.js': {accounts: true, caller: async () => user, sameOrigin: () => same},
    './admin.js': {admins: () => ['eigenaar@example.nl']},
    './check.js': {MODELS: {free: 'claude-haiku-5-5', paid: 'claude-sonnet-5-5'}, gradeWriting: async (s, model) => {
      calls.push([s.id, model]);
      if (s.id === fails && model.includes('haiku')) throw Error('refusal');
      const total = model.includes('haiku') ? 7 : 8;
      return {model, scores: {}, total, passed: total >= 7, errors: 2};
    }},
    './_samples.js': {SAMPLES},
  };
  const context = vm.createContext({String, Math, Promise});
  const mods = Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, new vm.SyntheticModule(Object.keys(v), function () { for (const [n, x] of Object.entries(v)) this.setExport(n, x); }, {context})]));
  const module = new vm.SourceTextModule(fs.readFileSync(new URL('api/compare.js', root), 'utf8'), {context});
  await module.link(s => mods[s]); await module.evaluate();
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(b) { this.body = b; return this; }};
  await module.namespace.default({method, headers: {}}, res);
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
  assert.equal(r.res.body.summary.meanDiff, 1); assert.equal(r.res.body.summary.maxDiff, 1);
});
test('The samples are made-up A2 answers with a task and a text', () => {
  assert.ok(SAMPLES.length >= 8);
  assert.equal(new Set(SAMPLES.map(s => s.id)).size, SAMPLES.length);
  for (const s of SAMPLES) { assert.ok(s.task.length > 40); assert.ok(s.text.length > 20); }
});
