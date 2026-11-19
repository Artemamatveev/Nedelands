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
