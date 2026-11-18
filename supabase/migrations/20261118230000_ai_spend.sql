-- Claude grading cost per day and model (api/check.js, admin.html). Same block as in supabase/schema.sql; run once in the SQL editor.

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
