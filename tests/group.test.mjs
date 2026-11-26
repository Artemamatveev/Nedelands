// Groups for schools and employers (api/group.js, the groups migration): the owner makes a group, a learner joins once
// while there are places and the group runs, and the teacher sees only their own groups' members.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PGlite } from '@electric-sql/pglite';
import {root} from './app-harness.mjs';

const A='11111111-1111-1111-1111-111111111111',B='22222222-2222-2222-2222-222222222222',C='33333333-3333-3333-3333-333333333333';
test('Postgres: codes, places, end dates and the teacher overview', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key, email text);
      insert into auth.users values('${A}','a@x.nl'),('${B}','b@x.nl'),('${C}','c@x.nl');
      create function public.admin_overview() returns jsonb language sql as $$
        select jsonb_agg(jsonb_build_object('email', email, 'name', upper(email), 'checks', 5, 'plus', 'active')) from auth.users $$;`);
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261119170000_groups.sql', import.meta.url), 'utf8'));
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    const code = (await q(`select public.make_group('Taalschool Delft','B1',2,current_date + 30,'Docent@School.nl') as c`))[0].c;
    assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
    const join = async (u, c) => (await q(`select public.join_group($1,$2) as r`, [u, c]))[0].r;
    assert.equal(await join(A, 'ZZZZZZZZ'), 'unknown');
    assert.equal(await join(A, code.toLowerCase()), 'ok');
    assert.equal(await join(A, code), 'already');
    assert.equal(await join(B, code), 'ok');
    assert.equal(await join(C, code), 'full');
    assert.deepEqual((await q(`select level from public.group_access($1)`, [A])).map(r => r.level), ['B1']);
    assert.deepEqual(await q(`select * from public.group_access($1)`, [C]), []);
    const old = (await q(`select public.make_group('Oud','A2',5,current_date - 1,'docent@school.nl') as c`))[0].c;
    assert.equal(await join(C, old), 'ended');
    const t = (await q(`select public.teacher_overview('docent@school.nl') as o`))[0].o;
    const g = t.find(x => x.name === 'Taalschool Delft');
    assert.deepEqual(g.members.map(m => m.email).sort(), ['a@x.nl', 'b@x.nl']);
    assert.equal(g.members[0].checks, undefined, 'the teacher does not see checks or Plus');
    assert.equal(g.members[0].plus, undefined);
    assert.deepEqual((await q(`select public.teacher_overview('iemand@anders.nl') as o`))[0].o, []);
    assert.equal((await q(`select public.group_list() as l`))[0].l.find(x => x.code === code).members, 2);
    await db.exec(`set role authenticated`);
    await assert.rejects(db.query(`select * from public.groups`), /permission denied/);
    await assert.rejects(db.query(`select public.teacher_overview('docent@school.nl')`), /permission denied/);
    await db.exec('reset role');
  } finally { await db.close(); }
});

async function ask({user, method = 'POST', body = {}, query = {}}) {
  const calls = [];
  const deps = {
    './_supa.js': {accounts: true, caller: async () => user, sameOrigin: () => true,
      joinGroup: async (uid, code) => { calls.push(['join', uid, code]); return 'ok'; },
      makeGroup: async g => { calls.push(['make', g]); return 'ABCDEFGH'; },
      groupList: async () => { calls.push(['list']); return []; },
      teacherOverview: async mail => { calls.push(['teach', mail]); return []; }},
    './admin.js': {admins: () => ['eigenaar@example.nl'],
      verifiedMail: u => (u && u.email_confirmed_at ? String(u.email || '').toLowerCase() : ''),
      isOwner: u => !!(u && u.email_confirmed_at && String(u.email || '').toLowerCase() === 'eigenaar@example.nl')},
    './_referral.js': {default: async (req, res) => res.status(200).json({referral: true})},
  };
  const context = vm.createContext({String, Math, parseInt});
  const mods = Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, new vm.SyntheticModule(Object.keys(v), function () { for (const [n, x] of Object.entries(v)) this.setExport(n, x); }, {context})]));
  const module = new vm.SourceTextModule(fs.readFileSync(new URL('api/group.js', root), 'utf8'), {context});
  await module.link(s => mods[s]); await module.evaluate();
  const res = {statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(b) { this.body = b; return this; }};
  await module.namespace.default({method, headers: {}, body, query}, res);
  return {res, calls};
}
const owner = {id: 'o', email: 'Eigenaar@example.nl', email_confirmed_at: '2026-11-01T00:00:00Z'};
const learner = {id: 'l', email: 'leerling@example.nl', email_confirmed_at: '2026-11-01T00:00:00Z'};

test('Only the owner makes or lists groups; anyone logged in can join; a teacher sees only their own e-mail', async () => {
  assert.equal((await ask({user: null, body: {go: 'join', code: 'ABCDEFGH'}})).res.statusCode, 401);
  const j = await ask({user: learner, body: {go: 'join', code: 'ABCDEFGH'}});
  assert.equal(j.res.body.result, 'ok'); assert.deepEqual(j.calls, [['join', 'l', 'ABCDEFGH']]);
  const g = {go: 'make', name: 'Taalschool', level: 'B1', seats: '20', until: '2027-06-30', teacher: 'Docent@School.nl'};
  assert.equal((await ask({user: learner, body: g})).res.statusCode, 403);
  const m = await ask({user: owner, body: g});
  assert.equal(m.res.body.code, 'ABCDEFGH'); assert.equal(m.calls[0][1].teacher, 'docent@school.nl'); assert.equal(m.calls[0][1].seats, 20);
  assert.equal((await ask({user: owner, body: {...g, until: 'morgen'}})).res.statusCode, 400);
  assert.equal((await ask({user: learner, method: 'GET', query: {list: 1}})).res.statusCode, 403);
  const t = await ask({user: learner, method: 'GET', query: {teach: 1}});
  assert.deepEqual(t.calls, [['teach', 'leerling@example.nl']]);
  assert.equal((await ask({user: {...learner, email_confirmed_at: null}, method: 'GET', query: {teach: 1}})).res.statusCode, 403);
});

test('/api/referral is rewritten to the group function as ?kind=ref and handled by _referral.js', async () => {
  const r = await ask({user: learner, method: 'GET', query: {kind: 'ref'}});
  assert.deepEqual(r.res.body, {referral: true}); assert.deepEqual(r.calls, []);
  const v = JSON.parse(fs.readFileSync(new URL('vercel.json', root), 'utf8'));
  assert.ok(v.rewrites.some(x => x.source === '/api/referral' && x.destination === '/api/group?kind=ref'));
  const fns = fs.readdirSync(new URL('api/', root)).filter(f => f.endsWith('.js') && !f.startsWith('_'));
  assert.ok(fns.length <= 12, `the Hobby plan allows 12 functions, there are ${fns.length}`);
});
