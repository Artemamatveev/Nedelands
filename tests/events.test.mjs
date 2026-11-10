// Anonymous usage counts (api/event.js): only known events, levels and languages are counted, nothing about the person
// reaches the database, other sites can't send, and the pages send nothing unless the server offers it.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';

async function send(body, {origin = 'https://example.test', env = {}, accounts = true, bump = true, len} = {}) {
  const bumps = [];
  const values = {accounts, sameOrigin: req => new URL(req.headers.origin).host === req.headers.host,
    bumpEvent: async x => { bumps.push(x); if (bump === null) throw Error('down'); return bump; }};
  const context = vm.createContext({process: {env}, URL});
  const supa = new vm.SyntheticModule(Object.keys(values), function () { for (const [k, v] of Object.entries(values)) this.setExport(k, v); }, {context});
  const module = new vm.SourceTextModule(fs.readFileSync(new URL('api/event.js', root), 'utf8'), {context});
  await module.link(() => supa); await module.evaluate();
  const req = {method: 'POST', headers: {host: 'example.test', origin, 'content-length': String(len ?? JSON.stringify(body).length)}, body};
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; },
    json(b) { this.body = b; return this; }, end() { return this; }};
  await module.namespace.default(req, res);
  return {res, bumps, events: module.namespace.EVENTS};
}

test('A known event is counted with only its name, level and menu language', async () => {
  const r = await send({ev: 'done_knm', lvl: 'A2', ui: 'ru', id: 'someone', email: 'x@y.z'});
  assert.equal(r.res.statusCode, 204);
  assert.equal(JSON.stringify(r.bumps), JSON.stringify([{ev: 'done_knm', lvl: 'A2', ui: 'ru'}]));
});
test('Unknown events, levels, languages and other sites are refused', async () => {
  for (const body of [{ev: 'hack'}, {ev: 'open', lvl: 'C1'}, {ev: 'open', ui: 'fr'}, {ev: 'exam_xx'}, {}]) {
    const r = await send(body); assert.equal(r.res.statusCode, 400, JSON.stringify(body)); assert.equal(r.bumps.length, 0);
  }
  const other = await send({ev: 'open'}, {origin: 'https://evil.test'}); assert.equal(other.res.statusCode, 403); assert.equal(other.bumps.length, 0);
  const big = await send({ev: 'open'}, {len: 5000}); assert.equal(big.res.statusCode, 413);
});
test('Off without accounts or with EVENTS=0; a full count says busy', async () => {
  assert.equal((await send({ev: 'open'}, {accounts: false})).res.statusCode, 503);
  assert.equal((await send({ev: 'open'}, {env: {EVENTS: '0'}})).res.statusCode, 503);
  assert.equal((await send({ev: 'open'}, {bump: false})).res.statusCode, 429);
  assert.equal((await send({ev: 'open'}, {bump: null})).res.statusCode, 502);
});
test('Every event the pages send is one the server knows', async () => {
  const {events} = await send({ev: 'open'});
  const app = fs.readFileSync(new URL('oefenen.html', root), 'utf8'), home = fs.readFileSync(new URL('landing.js', root), 'utf8');
  const sent = [...(app + home).matchAll(/track\("([a-z_]+)"(\+[a-zA-Z]+)?\)/g)].map(m => m[1] + (m[2] ? 'knm' : ''));
  assert.ok(sent.length >= 8, sent.join());
  for (const ev of sent) assert.ok(events.has(ev), ev);
  // and the schema allows the same names
  const sql = fs.readFileSync(new URL('supabase/schema.sql', root), 'utf8');
  assert.match(sql, /create table if not exists public\.usage_counts/);
  for (const ev of events) assert.match(ev, /^[a-z0-9_]{2,16}$/);
});
