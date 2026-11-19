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
