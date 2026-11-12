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
