// Invite a friend (api/referral.js, api/_supa.js, the referrals migration): codes, claiming once and only by a new
// account, never by yourself, and the bonus: 3 per friend for the inviter (at most 10) and 3 for the friend.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const A='11111111-1111-1111-1111-111111111111',B='22222222-2222-2222-2222-222222222222';
test('Postgres: one code per account, a friend joins once, the bonus is capped', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users select gen_random_uuid() from generate_series(1,12);
      insert into auth.users values('${A}'),('${B}');`);
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261119160000_referrals.sql', import.meta.url), 'utf8'));
    const q = async (sql, p = []) => (await db.query(sql, p)).rows;
    const code = (await q(`select public.referral_code($1) as c`, [A]))[0].c;
    assert.match(code, /^[A-HJ-NP-Z2-9]{8}$/);
    assert.equal((await q(`select public.referral_code($1) as c`, [A]))[0].c, code, 'the same code again');
    assert.equal((await q(`select public.claim_referral($1,$2) as r`, [A, code]))[0].r, 'self');
    assert.equal((await q(`select public.claim_referral($1,'ZZZZZZZZ') as r`, [B]))[0].r, 'unknown');
    assert.equal((await q(`select public.claim_referral($1,$2) as r`, [B, code.toLowerCase()]))[0].r, 'ok');
    assert.equal((await q(`select public.claim_referral($1,$2) as r`, [B, code]))[0].r, 'already');
    assert.deepEqual(await q(`select * from public.referral_bonus($1)`, [B]), [{bonus: 3, invited: 0}]);
    assert.deepEqual(await q(`select * from public.referral_bonus($1)`, [A]), [{bonus: 3, invited: 1}]);
    for (const {id} of await q(`select id from auth.users where id not in ($1,$2)`, [A, B])) await q(`select public.claim_referral($1,$2)`, [id, code]);
    assert.deepEqual(await q(`select * from public.referral_bonus($1)`, [A]), [{bonus: 30, invited: 13}], 'at most 10 friends count');
    await db.exec(`set role authenticated`);
    await assert.rejects(db.query(`select * from public.referrals`), /permission denied/);
    await assert.rejects(db.query(`select public.referral_bonus('${A}')`), /permission denied/);
    await db.exec('reset role');
  } finally { await db.close(); }
});

test('Only a new account can claim, and the server checks the code shape first', async () => {
  const calls = [];
  process.env.SUPABASE_URL = 'https://x.supabase.co'; process.env.SUPABASE_ANON_KEY = 'a'; process.env.SUPABASE_SERVICE_ROLE_KEY = 's';
  globalThis.fetch = async (url, init) => { calls.push([String(url), init && JSON.parse(init.body)]); return new Response(JSON.stringify('ok'), {status: 200}); };
  const {claimReferral} = await import('../api/_supa.js?ref');
  const fresh = {id: B, created_at: new Date().toISOString()};
  assert.equal(await claimReferral(fresh, 'abc'), 'unknown');
  assert.equal(await claimReferral({id: B, created_at: '2020-01-01T00:00:00Z'}, 'ABCDEFGH'), 'old');
  assert.equal(calls.length, 0);
  assert.equal(await claimReferral(fresh, 'abcdefgh'), 'ok');
  assert.deepEqual(calls[0], ['https://x.supabase.co/rest/v1/rpc/claim_referral', {uid: B, ref: 'ABCDEFGH'}]);
});
