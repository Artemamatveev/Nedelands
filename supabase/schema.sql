-- Bittertalen accounts: run once in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).
-- Safe to run again: everything is "if not exists" / "or replace".

-- Progress: one row per user, the same JSON the page keeps in localStorage (ww-v1).
-- The page reads and writes its own row directly; row level security keeps everyone to their own.
create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  t bigint not null default 0,                -- S.t: when the page last changed it (ms)
  updated_at timestamptz not null default now(),
  constraint progress_size check (octet_length(data::text) < 3000000)
);
alter table public.progress enable row level security;
drop policy if exists "own progress: read" on public.progress;
drop policy if exists "own progress: insert" on public.progress;
drop policy if exists "own progress: update" on public.progress;
create policy "own progress: read" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own progress: insert" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own progress: update" on public.progress for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Claude checks per user per day (Amsterdam time). Only the server (service role) writes it;
-- the page may read its own count to show what is left.
create table if not exists public.check_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.check_usage enable row level security;
drop policy if exists "own usage: read" on public.check_usage;
create policy "own usage: read" on public.check_usage for select to authenticated using ((select auth.uid()) = user_id);

-- Takes `cost` checks from today's allowance and returns how many are left, or -1 when there are not enough
-- (nothing is taken then). A negative cost gives checks back, after a failed grading.
create or replace function public.use_checks(uid uuid, cost int, lim int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Amsterdam')::date;
  used int;
begin
  insert into public.check_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
  if cost < 0 then
    update public.check_usage set n = greatest(0, n + cost) where user_id = uid and day = d returning n into used;
    return lim - used;
  end if;
  update public.check_usage set n = n + cost where user_id = uid and day = d and n + cost <= lim returning n into used;
  if not found then return -1; end if;
  return lim - used;
end;
$$;
revoke execute on function public.use_checks(uuid, int, int) from public, anon, authenticated;
grant execute on function public.use_checks(uuid, int, int) to service_role;

-- Bittertalen Plus: the user's Stripe subscription (api/plus.js starts it, api/stripe.js keeps this row up to date from
-- Stripe's webhook). While status is active, trialing or past_due and `until` (the end of the paid month) has not passed,
-- Claude checks PLUS_LIMIT a day instead of CHECK_LIMIT. Only the server writes it; the page may read its own row.
-- No payment details: those stay at Stripe. Deleting the account cancels the subscription first (api/account.js).
create table if not exists public.plus (
  user_id uuid primary key references auth.users on delete cascade,
  customer text not null,                     -- Stripe's customer id (cus_…)
  sub text not null,                          -- Stripe's subscription id (sub_…)
  status text not null,                       -- Stripe's status: active, past_due, canceled, …
  until timestamptz,                          -- end of the paid period
  ends boolean not null default false,        -- cancelled, runs until `until`
  updated_at timestamptz not null default now()
);
alter table public.plus enable row level security;
drop policy if exists "own plus: read" on public.plus;
create policy "own plus: read" on public.plus for select to authenticated using ((select auth.uid()) = user_id);

-- Free checks without an account: a few a day per visitor and a cap for everyone together, so people can try Claude's
-- grading before they make an account. "who" is a hash of the visitor's IP address with a secret (never the address
-- itself), '*' is everyone together. Rows older than yesterday are deleted on every call. Only the server uses it.
create table if not exists public.free_checks (
  who text not null,
  day date not null,
  n int not null default 0,
  primary key (who, day)
);
alter table public.free_checks enable row level security; -- no policies: nobody but the service role

-- Takes `cost` free checks; returns how many this visitor has left today, -1 when the visitor's are used up, -2 when
-- everyone's are (nothing is taken then). A negative cost gives them back, after a failed grading.
create or replace function public.use_free_checks(who text, cost int, lim int, cap int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Amsterdam')::date;
  used int;
  total int;
begin
  delete from public.free_checks where day < d - 1;
  insert into public.free_checks (who, day, n) values (use_free_checks.who, d, 0), ('*', d, 0) on conflict do nothing;
  if cost < 0 then
    update public.free_checks f set n = greatest(0, f.n + cost) where f.day = d and f.who in (use_free_checks.who, '*');
    select f.n into used from public.free_checks f where f.who = use_free_checks.who and f.day = d;
    return lim - used;
  end if;
  select f.n into total from public.free_checks f where f.who = '*' and f.day = d for update;
  if total + cost > cap then return -2; end if;
  update public.free_checks f set n = f.n + cost
    where f.who = use_free_checks.who and f.day = d and f.n + cost <= lim returning f.n into used;
  if not found then return -1; end if;
  update public.free_checks f set n = f.n + cost where f.who = '*' and f.day = d;
  return lim - used;
end;
$$;
revoke execute on function public.use_free_checks(text, int, int, int) from public, anon, authenticated;
grant execute on function public.use_free_checks(text, int, int, int) to service_role;

-- All Claude checks of a day together (logged-in and free), so a crowd of new accounts can't run up the bill:
-- CHECK_CAP a day (default 400). One row per day; old rows are deleted. Only the server uses it.
create table if not exists public.check_total (
  day date primary key,
  n int not null default 0
);
alter table public.check_total enable row level security; -- no policies: nobody but the service role

-- Takes `cost` checks from today's total; returns what is left, -1 when the day's cap is reached (nothing is taken
-- then). A negative cost gives them back, after a failed grading.
create or replace function public.use_total(cost int, cap int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Amsterdam')::date;
  used int;
begin
  delete from public.check_total where day < d - 1;
  insert into public.check_total (day, n) values (d, 0) on conflict do nothing;
  if cost < 0 then
    update public.check_total set n = greatest(0, n + cost) where day = d returning n into used;
    return cap - used;
  end if;
  update public.check_total set n = n + cost where day = d and n + cost <= cap returning n into used;
  if not found then return -1; end if;
  return cap - used;
end;
$$;
revoke execute on function public.use_total(int, int) from public, anon, authenticated;
grant execute on function public.use_total(int, int) to service_role;

-- Logging in with Google or Apple from an iPhone home-screen app may come back in a separate Safari window: that window
-- leaves the one-time login code here under a random nonce the app made, and the app takes it (and deletes it). The code
-- is useless without the PKCE secret that only the app holds. Rows older than 10 minutes are deleted. Only the server uses it.
create table if not exists public.handoff (
  nonce text primary key,
  code text not null,
  at timestamptz not null default now()
);
alter table public.handoff enable row level security; -- no policies: nobody but the service role

-- The result of a real exam, as learners tell it in Mijn examen, to see whether the proefexamens and "Klaar voor het
-- examen" predict it. Nothing about the person: id is a random uuid that stays on their device (never in the progress), pc
-- the last proefexamen score of that part, rd the status then (0 nog niet, 1 bijna, 2 klaar), month only the month.
-- Rows older than three years are deleted (privacy.html says so). Only the server writes it; read it here, for example:
--   select part, ok, rd, count(*), round(avg(pc)) as pc from public.exam_outcomes group by 1, 2, 3 order by 1, 2, 3;
create table if not exists public.exam_outcomes (
  id uuid primary key,
  part text not null check (part in ('lz', 'ls', 'wr', 'sp', 'knm', 'l1', 'lb', 'wb', 'sb')),
  ok boolean not null,
  pc smallint check (pc between 0 and 100),
  rd smallint check (rd between 0 and 2),
  month date not null
);
alter table public.exam_outcomes enable row level security; -- no policies: nobody but the service role

-- Keeps a result, or corrects it when the id is known. Returns false when this month already has `cap` rows (nothing is
-- kept then), so a stranger can't fill the table.
create or replace function public.put_outcome(o_id uuid, o_part text, o_ok boolean, o_pc int, o_rd int, cap int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  m date := date_trunc('month', now() at time zone 'Europe/Amsterdam')::date;
begin
  delete from public.exam_outcomes where month < m - interval '3 years';
  if not exists (select 1 from public.exam_outcomes where id = o_id)
     and (select count(*) from public.exam_outcomes where month = m) >= cap then
    return false;
  end if;
  insert into public.exam_outcomes (id, part, ok, pc, rd, month) values (o_id, o_part, o_ok, o_pc, o_rd, m)
    on conflict (id) do update set part = excluded.part, ok = excluded.ok, pc = excluded.pc, rd = excluded.rd;
  return true;
end;
$$;
revoke execute on function public.put_outcome(uuid, text, boolean, int, int, int) from public, anon, authenticated;
grant execute on function public.put_outcome(uuid, text, boolean, int, int, int) to service_role;


-- Anonymous usage counts (api/event.js): how many devices open the app or the homepage a day, finish the starttest or
-- today's lesson, start and hand in a proefexamen. Only a number per day, event, level and menu language: no id, cookie,
-- account, IP address or anything else about a person. Rows older than two years are deleted (privacy.html says so).
-- Only the server writes it; read it here, for example:
--   select day, ev, sum(n) from public.usage_counts where day > current_date - 30 group by 1, 2 order by 1, 2;
create table if not exists public.usage_counts (
  day date not null,
  ev text not null check (ev ~ '^[a-z0-9_]{2,16}$'),
  lvl text not null check (lvl in ('', 'A2', 'B1')),
  ui text not null check (ui in ('nl', 'en', 'ar', 'tr', 'hi', 'zh', 'es', 'ru')),
  n int not null default 0,
  primary key (day, ev, lvl, ui)
);
alter table public.usage_counts enable row level security; -- no policies: nobody but the service role

-- Adds one. Returns false when that count already reached `cap` today (nothing is added), so a stranger can't run it up.
create or replace function public.bump_event(e_ev text, e_lvl text, e_ui text, cap int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Amsterdam')::date;
  k int;
begin
  if extract(hour from now() at time zone 'Europe/Amsterdam') = 3 then
    delete from public.usage_counts where day < d - interval '2 years';
  end if;
  insert into public.usage_counts as u (day, ev, lvl, ui, n) values (d, e_ev, e_lvl, e_ui, 1)
    on conflict (day, ev, lvl, ui) do update set n = u.n + 1 where u.n < cap
    returning n into k;
  return k is not null;
end;
$$;
revoke execute on function public.bump_event(text, text, text, int) from public, anon, authenticated;
grant execute on function public.bump_event(text, text, text, int) to service_role;

-- The owner's overview (api/admin.js, admin.html): per account what it did, worked out here so the large progress rows
-- never leave the database. Only the server calls it, and api/admin.js only for the e-mails in ADMIN_EMAILS.
-- items: questions practised; right / wrong: answers; res: per part the number of proefexamens and the last score;
-- tm: study seconds per day (day number since 1970 → seconds); qd / qr: answers / right answers per day; checks: Claude checks in all, and in the last 7 days.
create or replace function public.admin_overview()
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(x order by coalesce(x->>'seen', x->>'login') desc nulls last), '[]'::jsonb) from (
    select jsonb_build_object(
      'email', u.email,
      'provider', u.raw_app_meta_data->>'provider',
      'name', nullif(trim(concat_ws(' ', coalesce(nullif(p.data->'me'->>'name', ''), u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name'), p.data->'me'->>'last')), ''),
      'created', u.created_at, 'login', u.last_sign_in_at, 'seen', p.updated_at,
      'lvl', p.data->>'lvl', 'streak', p.data->'streak', 'last', p.data->'last',
      'items', (select count(*) from jsonb_each(case when jsonb_typeof(p.data->'items') = 'object' then p.data->'items' else '{}' end)),
      'right', (select coalesce(sum(case when (v->>'r') ~ '^\d+$' then (v->>'r')::bigint end), 0)
        from jsonb_each(case when jsonb_typeof(p.data->'items') = 'object' then p.data->'items' else '{}' end) e(k, v)),
      'wrong', (select coalesce(sum(case when (v->>'w') ~ '^\d+$' then (v->>'w')::bigint end), 0)
        from jsonb_each(case when jsonb_typeof(p.data->'items') = 'object' then p.data->'items' else '{}' end) e(k, v)),
      'res', (select jsonb_object_agg(k, jsonb_build_object('n', jsonb_array_length(v), 'pc', v->-1->'pc', 'at', v->-1->'at'))
        from jsonb_each(case when jsonb_typeof(p.data->'res') = 'object' then p.data->'res' else '{}' end) e(k, v)
        where jsonb_typeof(v) = 'array' and jsonb_array_length(v) > 0),
      'tm', case when jsonb_typeof(p.data->'tm') = 'object' then p.data->'tm' end,
      'qd', case when jsonb_typeof(p.data->'qd') = 'object' then p.data->'qd' end,
      'qr', case when jsonb_typeof(p.data->'qr') = 'object' then p.data->'qr' end,
      'checks', (select coalesce(sum(n), 0) from public.check_usage c where c.user_id = u.id),
      'checks7', (select coalesce(sum(n), 0) from public.check_usage c where c.user_id = u.id
        and c.day > (now() at time zone 'Europe/Amsterdam')::date - 7),
      'plus', pl.status
    ) as x
    from auth.users u
    left join public.progress p on p.user_id = u.id
    left join public.plus pl on pl.user_id = u.id
  ) s;
$$;
revoke execute on function public.admin_overview() from public, anon, authenticated;
grant execute on function public.admin_overview() to service_role;


-- Free accounts: seven checks per Amsterdam calendar week. Plus retains its daily allowance.
-- New ledgers start with this policy; historical daily usage remains available to the owner.
create table if not exists public.check_week_usage (
  user_id uuid not null references auth.users on delete cascade,
  week date not null,
  n int not null default 0 check (n >= 0),
  primary key (user_id, week)
);
alter table public.check_week_usage enable row level security;
revoke all on public.check_week_usage from public, anon, authenticated;
grant select on public.check_week_usage to authenticated;
grant all on public.check_week_usage to service_role;
drop policy if exists "own weekly usage: read" on public.check_week_usage;
create policy "own weekly usage: read" on public.check_week_usage
  for select to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update on public.check_usage to service_role;

create table if not exists public.check_day_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  n int not null default 0 check (n >= 0),
  primary key (user_id, day)
);
alter table public.check_day_usage enable row level security;
revoke all on public.check_day_usage from public, anon, authenticated;
grant select on public.check_day_usage to authenticated;
grant all on public.check_day_usage to service_role;
drop policy if exists "own daily usage: read" on public.check_day_usage;
create policy "own daily usage: read" on public.check_day_usage
  for select to authenticated using ((select auth.uid()) = user_id);
-- Preserve today's existing allowance for subscribers during the switch.
insert into public.check_day_usage (user_id, day, n)
  select c.user_id, c.day, c.n from public.check_usage c join public.plus p on p.user_id = c.user_id
  where c.day = (now() at time zone 'Europe/Amsterdam')::date
    and p.status in ('active', 'trialing', 'past_due') and (p.until is null or p.until + interval '1 day' > now())
  on conflict do nothing;

-- checked_at is captured before reservation, and reused on refunds across a day/week boundary.
create or replace function public.use_plan_checks(uid uuid, cost int, lim int, window_kind text, checked_at timestamptz)
returns int language plpgsql security invoker set search_path = '' as $$
declare
  d date := (checked_at at time zone 'Europe/Amsterdam')::date;
  w date := date_trunc('week', checked_at at time zone 'Europe/Amsterdam')::date;
  used int;
  delta int;
begin
  if uid is null or cost is null or lim is null or checked_at is null or window_kind is null or window_kind not in ('day', 'week') or lim < 1 or lim > 10000 or abs(cost) > 6 then
    raise exception 'Invalid allowance request';
  end if;
  if window_kind = 'week' then
    insert into public.check_week_usage (user_id, week, n) values (uid, w, 0) on conflict do nothing;
    select n into used from public.check_week_usage where user_id = uid and week = w for update;
    if cost > 0 and used + cost > lim then return -1; end if;
    delta := case when cost < 0 then -least(used, -cost) else cost end;
    update public.check_week_usage set n = n + delta where user_id = uid and week = w;
    -- Daily totals remain available to the owner; the paid allowance has its own ledger.
    insert into public.check_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
    update public.check_usage set n = greatest(0, n + delta) where user_id = uid and day = d;
    return lim - used - delta;
  end if;
  insert into public.check_day_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
  select n into used from public.check_day_usage where user_id = uid and day = d for update;
  if cost > 0 and used + cost > lim then return -1; end if;
  delta := case when cost < 0 then -least(used, -cost) else cost end;
  update public.check_day_usage set n = n + delta where user_id = uid and day = d;
  insert into public.check_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
  update public.check_usage set n = greatest(0, n + delta) where user_id = uid and day = d;
  return lim - used - delta;
end;
$$;
revoke execute on function public.use_plan_checks(uuid, int, int, text, timestamptz) from public, anon, authenticated;
grant execute on function public.use_plan_checks(uuid, int, int, text, timestamptz) to service_role;

-- The trial belongs to a signed, functional browser cookie, never to a shared IP address.
create table if not exists public.trial_checks (
  who text primary key check (who ~ '^[0-9a-f]{64}$'),
  n int not null default 0 check (n >= 0),
  created_at timestamptz not null default now()
);
create index if not exists trial_checks_created on public.trial_checks(created_at);
create table if not exists public.trial_check_total (
  day date primary key,
  n int not null default 0 check (n >= 0)
);
alter table public.trial_checks enable row level security;
alter table public.trial_check_total enable row level security;
revoke all on public.trial_checks, public.trial_check_total from public, anon, authenticated;
grant all on public.trial_checks, public.trial_check_total to service_role;

create or replace function public.use_trial_checks(who text, cost int, lim int, cap int, checked_at timestamptz)
returns int language plpgsql security invoker set search_path = '' as $$
declare
  d date := (checked_at at time zone 'Europe/Amsterdam')::date;
  used int := 0;
  total int;
  delta int;
begin
  if who is null or cost is null or lim is null or cap is null or who !~ '^[0-9a-f]{64}$' or checked_at is null or lim < 0 or cap < 1 or abs(cost) > 1 then
    raise exception 'Invalid trial request';
  end if;
  -- Looking up the remaining trial never spends a check or creates a usage row.
  if cost = 0 then
    select n into used from public.trial_checks t where t.who = use_trial_checks.who;
    return greatest(0, lim - coalesce(used, 0));
  end if;
  delete from public.trial_checks where created_at < now() - interval '400 days';
  delete from public.trial_check_total where day < (now() at time zone 'Europe/Amsterdam')::date - 2;
  insert into public.trial_check_total (day, n) values (d, 0) on conflict do nothing;
  select n into total from public.trial_check_total where day = d for update;
  insert into public.trial_checks (who, n) values (use_trial_checks.who, 0) on conflict do nothing;
  select n into used from public.trial_checks t where t.who = use_trial_checks.who for update;
  if cost > 0 and used + cost > lim then return -1; end if;
  if cost > 0 and total + cost > cap then return -2; end if;
  delta := case when cost < 0 then -least(used, -cost) else cost end;
  update public.trial_checks t set n = n + delta where t.who = use_trial_checks.who;
  update public.trial_check_total set n = greatest(0, n + delta) where day = d;
  return lim - used - delta;
end;
$$;
revoke execute on function public.use_trial_checks(text, int, int, int, timestamptz) from public, anon, authenticated;
grant execute on function public.use_trial_checks(text, int, int, int, timestamptz) to service_role;

-- What Claude's grading costs (api/check.js → add_ai_spend()): tokens per Amsterdam day and model, nothing else
-- (no account, answer or IP). The owner's overview (admin.html) turns them into dollars. Rows go after two years.
--   select day, model, calls, input, output from public.ai_spend order by day desc limit 30;
create table if not exists public.ai_spend (
  day date not null,
  model text not null,
  calls int not null default 0,
  input bigint not null default 0,
  output bigint not null default 0,
  cache_read bigint not null default 0,
  cache_write bigint not null default 0,
  primary key (day, model)
);
alter table public.ai_spend enable row level security; -- no policies: nobody but the service role
revoke all on public.ai_spend from public, anon, authenticated;
grant select on public.ai_spend to service_role;

create or replace function public.add_ai_spend(s_model text, s_in bigint, s_out bigint, s_cache_read bigint, s_cache_write bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if extract(hour from now() at time zone 'Europe/Amsterdam') = 3 then
    delete from public.ai_spend where day < d - interval '2 years';
  end if;
  insert into public.ai_spend as a (day, model, calls, input, output, cache_read, cache_write)
    values (d, left(s_model, 80), 1, greatest(s_in, 0), greatest(s_out, 0), greatest(s_cache_read, 0), greatest(s_cache_write, 0))
    on conflict (day, model) do update set
      calls = a.calls + 1, input = a.input + excluded.input, output = a.output + excluded.output,
      cache_read = a.cache_read + excluded.cache_read, cache_write = a.cache_write + excluded.cache_write;
end;
$$;
revoke execute on function public.add_ai_spend(text, bigint, bigint, bigint, bigint) from public, anon, authenticated;
grant execute on function public.add_ai_spend(text, bigint, bigint, bigint, bigint) to service_role;

-- The Examenpas (api/plus.js, api/stripe.js): one row per paid one-time Checkout, keyed by the session, so a repeated
-- webhook adds nothing. Gives the Plus checks of its level until `until`. Written only by the server; the user may
-- read their own rows. Deleting the account deletes them (Stripe keeps its own payment record).
create table if not exists public.exam_pass (
  session text primary key,                   -- Stripe's Checkout session id (cs_…)
  user_id uuid not null references auth.users on delete cascade,
  level text not null check (level in ('A2', 'B1')),
  until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists exam_pass_user on public.exam_pass (user_id, until desc);
alter table public.exam_pass enable row level security;
revoke all on public.exam_pass from public, anon, authenticated;
grant select on public.exam_pass to authenticated;
grant select, insert on public.exam_pass to service_role;
drop policy if exists "own pass: read" on public.exam_pass;
create policy "own pass: read" on public.exam_pass for select to authenticated using ((select auth.uid()) = user_id);

-- Free accounts: seven checks in all (not per week). The lifetime total is one row of check_week_usage per user,
-- under the fixed bucket date 2000-01-03, so no new table is needed. Old weekly rows stay for the owner's history.
-- 'week' is still accepted so pages and functions from before this change keep working during the deploy.
create or replace function public.use_plan_checks(uid uuid, cost int, lim int, window_kind text, checked_at timestamptz)
returns int language plpgsql security invoker set search_path = '' as $$
declare
  d date := (checked_at at time zone 'Europe/Amsterdam')::date;
  w date := case when window_kind = 'once' then date '2000-01-03'
                 else date_trunc('week', checked_at at time zone 'Europe/Amsterdam')::date end;
  used int;
  delta int;
begin
  if uid is null or cost is null or lim is null or checked_at is null or window_kind is null or window_kind not in ('day', 'week', 'once') or lim < 1 or lim > 10000 or abs(cost) > 6 then
    raise exception 'Invalid allowance request';
  end if;
  if window_kind in ('week', 'once') then
    insert into public.check_week_usage (user_id, week, n) values (uid, w, 0) on conflict do nothing;
    select n into used from public.check_week_usage where user_id = uid and week = w for update;
    if cost > 0 and used + cost > lim then return -1; end if;
    delta := case when cost < 0 then -least(used, -cost) else cost end;
    update public.check_week_usage set n = n + delta where user_id = uid and week = w;
    -- Daily totals remain available to the owner; the paid allowance has its own ledger.
    insert into public.check_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
    update public.check_usage set n = greatest(0, n + delta) where user_id = uid and day = d;
    return lim - used - delta;
  end if;
  insert into public.check_day_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
  select n into used from public.check_day_usage where user_id = uid and day = d for update;
  if cost > 0 and used + cost > lim then return -1; end if;
  delta := case when cost < 0 then -least(used, -cost) else cost end;
  update public.check_day_usage set n = n + delta where user_id = uid and day = d;
  insert into public.check_usage (user_id, day, n) values (uid, d, 0) on conflict do nothing;
  update public.check_usage set n = greatest(0, n + delta) where user_id = uid and day = d;
  return lim - used - delta;
end;
$$;
revoke execute on function public.use_plan_checks(uuid, int, int, text, timestamptz) from public, anon, authenticated;
grant execute on function public.use_plan_checks(uuid, int, int, text, timestamptz) to service_role;

-- Invite a friend: an account's share code, and who joined with whose code. The inviter gets 3 extra free checks per
-- friend (at most 10 friends) and the friend 3 extra. Only the server reads or writes these tables; deleting either
-- account deletes the row (and with it the bonus).
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  invitee uuid primary key references auth.users on delete cascade,
  inviter uuid not null references auth.users on delete cascade,
  at timestamptz not null default now(),
  check (invitee <> inviter)
);
create index if not exists referrals_inviter on public.referrals(inviter);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
revoke all on public.referral_codes, public.referrals from public, anon, authenticated;
grant all on public.referral_codes, public.referrals to service_role;

-- The account's code, made on first use (8 letters and digits without 0, 1, I and O)
create or replace function public.referral_code(uid uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  c text;
  abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select code into c from public.referral_codes where user_id = uid;
  if c is not null then return c; end if;
  loop
    c := '';
    for i in 1..8 loop c := c || substr(abc, 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.referral_codes (user_id, code) values (uid, c);
      return c;
    exception when unique_violation then
      select code into c from public.referral_codes where user_id = uid;
      if c is not null then return c; end if;
    end;
  end loop;
end;
$$;

-- A new account joins with a friend's code: 'ok', 'unknown' (no such code), 'self' or 'already' (it has an inviter).
create or replace function public.claim_referral(uid uuid, ref text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid;
begin
  select user_id into owner from public.referral_codes where code = upper(ref);
  if owner is null then return 'unknown'; end if;
  if owner = uid then return 'self'; end if;
  insert into public.referrals (invitee, inviter) values (uid, owner) on conflict do nothing;
  if not found then return 'already'; end if;
  return 'ok';
end;
$$;

-- Extra free checks: 3 per invited friend (at most 10) and 3 for having been invited; how many friends joined
create or replace function public.referral_bonus(uid uuid)
returns table (bonus int, invited int) language sql stable security invoker set search_path = '' as $$
  select (3 * least((select count(*) from public.referrals where inviter = uid), 10)
          + 3 * (select count(*) from public.referrals where invitee = uid))::int,
         (select count(*) from public.referrals where inviter = uid)::int;
$$;
revoke execute on function public.referral_code(uuid), public.claim_referral(uuid, text), public.referral_bonus(uuid) from public, anon, authenticated;
grant execute on function public.referral_code(uuid), public.claim_referral(uuid, text), public.referral_bonus(uuid) to service_role;

-- Groups for schools and employers (B2B): the owner makes a group with a code, a level, a number of places and an end
-- date; a learner who enters the code gets the Plus checks of that level until the end date (api/_supa.js plusFor()),
-- and the group's teacher (an e-mail address) sees the members' practice in /docent. Only the server reads or writes
-- these tables. Leaving or deleting the account removes the membership.
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  level text not null check (level in ('A2', 'B1')),
  seats int not null check (seats between 1 and 500),
  until date not null,
  teacher text not null check (teacher = lower(teacher) and teacher like '%@%'),
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user on public.group_members(user_id);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
revoke all on public.groups, public.group_members from public, anon, authenticated;
grant all on public.groups, public.group_members to service_role;

-- A new group; returns its code (8 letters and digits without 0, 1, I and O)
create or replace function public.make_group(g_name text, g_level text, g_seats int, g_until date, g_teacher text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  c text;
  abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    c := '';
    for i in 1..8 loop c := c || substr(abc, 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.groups (name, code, level, seats, until, teacher) values (trim(g_name), c, g_level, g_seats, g_until, lower(trim(g_teacher)));
      return c;
    exception when unique_violation then null;
    end;
  end loop;
end;
$$;

-- A learner enters a group's code: 'ok', 'unknown', 'ended', 'full' or 'already'
create or replace function public.join_group(uid uuid, ref text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  g public.groups;
  n int;
begin
  select * into g from public.groups where code = upper(ref) for update;
  if g.id is null then return 'unknown'; end if;
  if g.until < (now() at time zone 'Europe/Amsterdam')::date then return 'ended'; end if;
  if exists (select 1 from public.group_members where group_id = g.id and user_id = uid) then return 'already'; end if;
  select count(*) into n from public.group_members where group_id = g.id;
  if n >= g.seats then return 'full'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, uid);
  return 'ok';
end;
$$;

-- The learner's running groups (the highest level first)
create or replace function public.group_access(uid uuid)
returns table (name text, level text, until date) language sql stable security invoker set search_path = '' as $$
  select g.name, g.level, g.until from public.group_members m join public.groups g on g.id = m.group_id
  where m.user_id = uid and g.until >= (now() at time zone 'Europe/Amsterdam')::date
  order by g.level desc, g.until desc;
$$;

-- What a teacher sees: their groups, each with its members' practice (the same summary as the owner's overview)
create or replace function public.teacher_overview(mail text)
returns jsonb language sql stable security definer set search_path = '' as $$
  with o as (select x from jsonb_array_elements(public.admin_overview()) x)
  select coalesce(jsonb_agg(jsonb_build_object('name', g.name, 'code', g.code, 'level', g.level, 'seats', g.seats,
    'until', g.until, 'members', coalesce((
      select jsonb_agg(o.x - 'provider' - 'checks' - 'checks7' - 'plus' - 'login' order by o.x->>'name')
      from public.group_members m join auth.users u on u.id = m.user_id join o on o.x->>'email' = u.email
      where m.group_id = g.id), '[]'::jsonb)) order by g.until desc), '[]'::jsonb)
  from public.groups g where g.teacher = lower(mail);
$$;

-- The owner's list of groups with how many places are taken
create or replace function public.group_list()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', g.name, 'code', g.code, 'level', g.level, 'seats', g.seats, 'until', g.until,
    'teacher', g.teacher, 'members', (select count(*) from public.group_members m where m.group_id = g.id)) order by g.created_at desc), '[]'::jsonb)
  from public.groups g;
$$;
revoke execute on function public.make_group(text, text, int, date, text), public.join_group(uuid, text), public.group_access(uuid),
  public.teacher_overview(text), public.group_list() from public, anon, authenticated;
grant execute on function public.make_group(text, text, int, date, text), public.join_group(uuid, text), public.group_access(uuid),
  public.teacher_overview(text), public.group_list() to service_role;

-- Limits on what one paying learner can cost (api/check.js, api/_talk.js), on top of the daily PLUS_LIMIT:
--   m:<uid>   Plus checks per Amsterdam month (PLUS_MONTH, default 200), day = the first of the month
--   o:<uid>   proefexamens graded by the exam model per day (OPUS_DAY, default 2); after that the practice model grades
--   t:<id>    calls per conversation ticket (say and end), so a ticket can't be replayed for 40 minutes
-- Only counters: no answer, text or IP. Rows go after about two months. Only the server uses it.
create table if not exists public.ai_guard (
  k text not null check (length(k) <= 80),
  day date not null,
  n int not null default 0 check (n >= 0),
  primary key (k, day)
);
create index if not exists ai_guard_day on public.ai_guard(day);
alter table public.ai_guard enable row level security; -- no policies: nobody but the service role
revoke all on public.ai_guard from public, anon, authenticated;
grant all on public.ai_guard to service_role;

-- Takes `cost` from the counter (g_k, g_day) with limit `lim`: what is left, -1 when it would go over (nothing taken).
-- A negative cost gives back, never below zero.
create or replace function public.use_guard(g_k text, g_day date, cost int, lim int)
returns int language plpgsql security invoker set search_path = '' as $$
declare
  used int;
  delta int;
begin
  if g_k is null or g_day is null or cost is null or lim is null or length(g_k) > 80 or abs(cost) > 100 or lim < 1 or lim > 100000 then
    raise exception 'Invalid guard request';
  end if;
  if random() < 0.02 then
    delete from public.ai_guard where day < (now() at time zone 'Europe/Amsterdam')::date - 62;
  end if;
  insert into public.ai_guard (k, day, n) values (g_k, g_day, 0) on conflict do nothing;
  select n into used from public.ai_guard where k = g_k and day = g_day for update;
  if cost > 0 and used + cost > lim then return -1; end if;
  delta := case when cost < 0 then -least(used, -cost) else cost end;
  update public.ai_guard set n = n + delta where k = g_k and day = g_day;
  return lim - used - delta;
end;
$$;
revoke execute on function public.use_guard(text, date, int, int) from public, anon, authenticated;
grant execute on function public.use_guard(text, date, int, int) to service_role;

-- Withdrawals (migration 20261125200000_withdrawals.sql)
create table if not exists public.withdrawals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('sub', 'pass')),
  ref text not null,                           -- Stripe subscription id (sub_…) or Checkout session (cs_…)
  at timestamptz not null default now(),
  refunded_at timestamptz                      -- set by hand when the money is back
);
create index if not exists withdrawals_user on public.withdrawals (user_id, at desc);
create unique index if not exists withdrawals_ref on public.withdrawals (ref);
alter table public.withdrawals enable row level security;
revoke all on public.withdrawals from public, anon, authenticated;
grant select, insert, update on public.withdrawals to service_role;
grant update (until) on public.exam_pass to service_role;
