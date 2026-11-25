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
