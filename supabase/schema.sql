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
-- tm: study seconds per day (day number since 1970 → seconds); checks: Claude checks in all, and in the last 7 days.
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
