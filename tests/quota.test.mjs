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
    await db.exec('begin');
    await db.exec(fs.readFileSync(new URL('../supabase/verify-weekly-checks.sql',import.meta.url),'utf8'));
    await db.exec('rollback');
    assert.equal((await db.query('select count(*)::int as n from check_week_usage')).rows[0].n,0);
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
