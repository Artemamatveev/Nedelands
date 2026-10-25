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
