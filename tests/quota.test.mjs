import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('Postgres enforces weekly, daily and one-time budgets, refunds, resets and permissions', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to authenticated;
      insert into auth.users values('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');
      create table public.check_usage(user_id uuid references auth.users,day date,n int default 0,primary key(user_id,day));
      create table public.plus(user_id uuid references auth.users,status text,until timestamptz);
    `);
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261112192552_weekly_free_checks.sql',import.meta.url),'utf8'));
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261119140000_free_total_checks.sql',import.meta.url),'utf8'));
    await db.exec('begin');
    await db.exec(fs.readFileSync(new URL('../supabase/verify-weekly-checks.sql',import.meta.url),'utf8'));
    await db.exec('rollback');
    assert.equal((await db.query('select count(*)::int as n from check_week_usage')).rows[0].n,0);
    // Free accounts: seven in all. A new week or year gives nothing back; a refund goes to the same total.
    await db.exec('begin');
    const once=async(cost,at)=>(await db.query(`select use_plan_checks('11111111-1111-1111-1111-111111111111',$1,7,'once',$2) as n`,[cost,at])).rows[0].n;
    assert.equal(await once(6,'2099-01-05T10:00Z'),1);
    assert.equal(await once(1,'2099-01-12T10:00Z'),0);
    assert.equal(await once(1,'2100-06-01T10:00Z'),-1);
    assert.equal(await once(-1,'2099-01-12T10:00Z'),1);
    assert.equal(await once(0,'2101-01-01T10:00Z'),1);
    assert.equal((await db.query(`select week::text from check_week_usage`)).rows[0].week,'2000-01-03');
    await assert.rejects(db.query(`select use_plan_checks('11111111-1111-1111-1111-111111111111',1,7,'month',now())`),/Invalid allowance/);
    await db.exec('rollback');
    await db.exec(`set role service_role;
      select use_plan_checks('11111111-1111-1111-1111-111111111111',1,7,'week','2099-01-05T10:00Z');
      select use_plan_checks('22222222-2222-2222-2222-222222222222',1,7,'week','2099-01-05T10:00Z');
      reset role;
      set role authenticated;
      select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);`);
    const rows=await db.query('select user_id,n from check_week_usage');
    assert.equal(rows.rows.length,1); assert.equal(rows.rows[0].user_id,'11111111-1111-1111-1111-111111111111');
    await assert.rejects(db.query(`select use_plan_checks('11111111-1111-1111-1111-111111111111',-1,7,'week',now())`),/permission denied/);
    await assert.rejects(db.query('select * from trial_checks'),/permission denied/);
    await db.exec('reset role');
  } finally { await db.close(); }
});

test('Grading receipts replay completed work only to the same owner and expire before re-use', async () => {
  const db = new PGlite();
  const first = '11111111-1111-1111-1111-111111111111', second = '22222222-2222-2222-2222-222222222222';
  const id = '33333333-3333-3333-3333-333333333333';
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users values ('${first}'), ('${second}');`);
    await db.exec(fs.readFileSync(new URL('../supabase/migrations/20261125123000_grading_receipts.sql', import.meta.url), 'utf8'));
    const claim = async (owner, digest = 'digest') => (await db.query(
      'select public.claim_grading_receipt($1, $2, $3) as receipt', [owner, id, digest])).rows[0].receipt;
    assert.deepEqual(await claim(first), {state:'new'});
    assert.deepEqual(await claim(first), {state:'pending'});
    await db.query('update public.grading_receipts set result=$1 where owner=$2', [JSON.stringify({tasks:[]}), first]);
    assert.deepEqual(await claim(first), {state:'done',result:{tasks:[]}});
    assert.deepEqual(await claim(second), {state:'new'});
    assert.deepEqual(await claim(first, 'edited'), {state:'new'});
    await db.exec("update public.grading_receipts set created_at=now()-interval '25 hours'");
    assert.deepEqual(await claim(first), {state:'new'});
    await db.exec('set role authenticated');
    await assert.rejects(claim(first), /permission denied/);
  } finally { await db.close(); }
});
