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

-- Bittertalen Plus: one row per user, written only by the server (api/stripe.js, Stripe's webhook). The page may read
-- its own row to show the subscription in Profiel. Payment details stay at Stripe; here only the ids and the status.
create table if not exists public.plans (
  user_id uuid primary key references auth.users on delete cascade,
  customer text unique,                       -- Stripe customer id (cus_…)
  sub text,                                   -- Stripe subscription id (sub_…)
  status text,                                -- trialing, active, past_due, canceled, …
  period text,                                -- month or year
  ends_at timestamptz,                        -- end of the trial or of the paid period
  cancel_at_end boolean not null default false,
  trial_used boolean not null default false,  -- one free week per person
  updated_at timestamptz not null default now()
);
alter table public.plans enable row level security;
drop policy if exists "own plan: read" on public.plans;
create policy "own plan: read" on public.plans for select to authenticated using ((select auth.uid()) = user_id);
