// The owner's overview (api/admin.js): only a logged-in, confirmed e-mail from ADMIN_EMAILS gets the data; nobody gets
// in without ADMIN_EMAILS; the answer is never cached.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';

async function ask({user = null, env = {ADMIN_EMAILS: 'Eigenaar@Example.nl, tweede@example.nl'}, accounts = true, method = 'GET', fail = false, query = {}} = {}) {
  let asked = 0;
  const values = {accounts, caller: async () => user,
    adminData: async () => { asked++; if (fail) throw Error('down'); return {users: [{email: 'a@b.c'}], counts: []}; }};
  const context = vm.createContext({process: {env}, String, URL});
  const supa = new vm.SyntheticModule(Object.keys(values), function () { for (const [k, v] of Object.entries(values)) this.setExport(k, v); }, {context});
  const module = new vm.SourceTextModule(fs.readFileSync(new URL('api/admin.js', root), 'utf8'), {context});
  await module.link(() => supa); await module.evaluate();
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(b) { this.body = b; return this; }};
  await module.namespace.default({method, headers: {}, query}, res);
  return {res, asked};
}
const owner = {id: '1', email: 'eigenaar@example.nl', email_confirmed_at: '2026-11-01T00:00:00Z'};

test('The owner gets the overview, not cached', async () => {
  const r = await ask({user: owner});
  assert.equal(r.res.statusCode, 200); assert.equal(r.asked, 1);
  assert.equal(JSON.stringify(r.res.body.users), JSON.stringify([{email: 'a@b.c'}]));
  assert.equal(r.res.headers['Cache-Control'], 'no-store');
});
test('Nobody else gets in, and nobody without ADMIN_EMAILS', async () => {
  for (const [user, env, code] of [
    [null, undefined, 401],
    [{...owner, email: 'iemand@example.nl'}, undefined, 403],
    [{...owner, email_confirmed_at: null}, undefined, 403],
    [owner, {}, 403],
    [{...owner, email: ''}, undefined, 403],
  ]) {
    const r = await ask({user, ...(env ? {env} : {})});
    assert.equal(r.res.statusCode, code, JSON.stringify([user, env])); assert.equal(r.asked, 0);
  }
  assert.equal((await ask({user: owner, method: 'POST'})).res.statusCode, 405);
  assert.equal((await ask({user: owner, accounts: false})).res.statusCode, 503);
  assert.equal((await ask({user: owner, fail: true})).res.statusCode, 502);
});
test('The overview function is only for the server', () => {
  const sql = fs.readFileSync(new URL('supabase/schema.sql', root), 'utf8');
  assert.match(sql, /create or replace function public\.admin_overview\(\)/);
  assert.match(sql, /revoke execute on function public\.admin_overview\(\) from public, anon, authenticated;/);
});
test('?me=1 only says whether the account is the owner, without reading the data', async () => {
  const r = await ask({user: owner, query: {me: '1'}});
  assert.equal(r.res.statusCode, 200); assert.equal(r.asked, 0); assert.equal(r.res.body.admin, true);
  const n = await ask({user: {...owner, email: 'iemand@example.nl'}, query: {me: '1'}});
  assert.equal(n.res.statusCode, 403); assert.equal(n.asked, 0);
});
