-- Run inside a transaction/savepoint and roll back: no learner allowance or trial is changed.
do $$
declare
  uid uuid := (select id from auth.users order by id limit 1);
  who_a text := md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
  who_b text := md5(gen_random_uuid()::text) || md5(gen_random_uuid()::text);
  t timestamptz := '2099-01-05 10:00:00+00';
  sunday timestamptz := '2099-01-11 22:59:00+00';
  monday timestamptz := '2099-01-11 23:00:00+00';
  i int;
  r int;
  relation text;
begin
  if uid is null then raise exception 'An account is required for quota verification'; end if;
  if public.use_plan_checks(uid, 6, 7, 'week', t) <> 1 then raise exception 'Full speaking trial'; end if;
  if public.use_plan_checks(uid, 1, 7, 'week', sunday) <> 0 then raise exception 'Shared weekly budget'; end if;
  if public.use_plan_checks(uid, 1, 7, 'week', sunday) <> -1 then raise exception 'Weekly overspend'; end if;
  if public.use_plan_checks(uid, 1, 7, 'week', monday) <> 6 then raise exception 'Amsterdam Monday reset'; end if;
  if public.use_plan_checks(uid, -1, 7, 'week', sunday) <> 1 then raise exception 'Refund original week'; end if;
  if public.use_plan_checks(uid, 0, 7, 'week', monday) <> 6 then raise exception 'Refund must not change new week'; end if;
  for i in 1..10 loop
    r := public.use_plan_checks(uid, 6, 60, 'day', t);
    if r <> 60 - i * 6 then raise exception 'Independent paid daily budget'; end if;
  end loop;
  if public.use_plan_checks(uid, 1, 60, 'day', t) <> -1 then raise exception 'Paid daily overspend'; end if;
  if public.use_plan_checks(uid, 0, 7, 'week', sunday) <> 1 then raise exception 'Paid checks spent free weekly budget'; end if;
  if public.use_plan_checks(uid, 1, 60, 'day', t + interval '1 day') <> 59 then raise exception 'Paid daily reset'; end if;
  if public.use_plan_checks(uid, -6, 60, 'day', t) <> 6 then raise exception 'Paid refund'; end if;
  if public.use_trial_checks(who_a, 1, 2, 50, t) <> 1 then raise exception 'First browser trial'; end if;
  if public.use_trial_checks(who_a, 1, 2, 50, t + interval '1 day') <> 0 then raise exception 'Second browser trial'; end if;
  if public.use_trial_checks(who_a, 1, 2, 50, t + interval '2 days') <> -1 then raise exception 'Trial renewed next day'; end if;
  if public.use_trial_checks(who_a, -1, 2, 50, t + interval '1 day') <> 1 then raise exception 'Trial refund'; end if;
  if public.use_trial_checks(who_a, 1, 2, 50, t + interval '2 days') <> 0 then raise exception 'Refunded trial usable'; end if;
  if public.use_trial_checks(who_b, 1, 2, 1, t + interval '2 days') <> -2 then raise exception 'Trial global cap'; end if;
  if public.use_trial_checks(who_b, 1, 2, 1, t + interval '3 days') <> 1 then raise exception 'Trial global cap reset'; end if;
  foreach relation in array array['check_day_usage', 'check_week_usage', 'trial_checks', 'trial_check_total'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || relation)::regclass) then
      raise exception 'RLS missing';
    end if;
    if has_table_privilege('anon', 'public.' || relation, 'SELECT') then raise exception 'Anonymous table access'; end if;
    if not has_table_privilege('service_role', 'public.' || relation, 'UPDATE') then raise exception 'Server cannot reserve'; end if;
  end loop;
  if has_function_privilege('authenticated', 'public.use_plan_checks(uuid,integer,integer,text,timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.use_trial_checks(text,integer,integer,integer,timestamptz)', 'EXECUTE') then
    raise exception 'Client can edit allowance';
  end if;
  if exists(select 1 from pg_proc where oid in (
    'public.use_plan_checks(uuid,integer,integer,text,timestamptz)'::regprocedure,
    'public.use_trial_checks(text,integer,integer,integer,timestamptz)'::regprocedure
  ) and prosecdef) then raise exception 'Quota functions must use invoker permissions'; end if;
end;
$$;
