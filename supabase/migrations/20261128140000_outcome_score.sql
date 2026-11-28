-- The grade or score of a real exam in Mijn examen. Same block as in supabase/schema.sql; run once in the SQL editor.

-- sc: what the learner fills in from DUO's letter, if they want: a grade of 1 to 10 for an A2 part or KNM, a score for a
-- Staatsexamen NT2 part (500 or more is a pass). Empty when they only tell passed or not.
alter table public.exam_outcomes add column if not exists sc numeric(5,1) check (sc between 0 and 1000);
-- put_outcome with the grade (api/_supa.js uses this one, and the old put_outcome while this has not been run)
create or replace function public.put_outcome_sc(o_id uuid, o_part text, o_ok boolean, o_pc int, o_rd int, o_sc numeric, cap int)
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
  insert into public.exam_outcomes (id, part, ok, pc, rd, sc, month) values (o_id, o_part, o_ok, o_pc, o_rd, o_sc, m)
    on conflict (id) do update set part = excluded.part, ok = excluded.ok, pc = excluded.pc, rd = excluded.rd, sc = excluded.sc;
  return true;
end;
$$;
revoke execute on function public.put_outcome_sc(uuid, text, boolean, int, int, numeric, int) from public, anon, authenticated;
grant execute on function public.put_outcome_sc(uuid, text, boolean, int, int, numeric, int) to service_role;
