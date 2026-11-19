-- Invite a friend: an account's share code, and who joined with whose code. The inviter gets 3 extra free checks per
-- friend (at most 10 friends) and the friend 3 extra. Only the server reads or writes these tables; deleting either
-- account deletes the row (and with it the bonus).
create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  created_at timestamptz not null default now()
);
create table if not exists public.referrals (
  invitee uuid primary key references auth.users on delete cascade,
  inviter uuid not null references auth.users on delete cascade,
  at timestamptz not null default now(),
  check (invitee <> inviter)
);
create index if not exists referrals_inviter on public.referrals(inviter);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
revoke all on public.referral_codes, public.referrals from public, anon, authenticated;
grant all on public.referral_codes, public.referrals to service_role;

-- The account's code, made on first use (8 letters and digits without 0, 1, I and O)
create or replace function public.referral_code(uid uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  c text;
  abc text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select code into c from public.referral_codes where user_id = uid;
  if c is not null then return c; end if;
  loop
    c := '';
    for i in 1..8 loop c := c || substr(abc, 1 + floor(random() * 32)::int, 1); end loop;
    begin
      insert into public.referral_codes (user_id, code) values (uid, c);
      return c;
    exception when unique_violation then
      select code into c from public.referral_codes where user_id = uid;
      if c is not null then return c; end if;
    end;
  end loop;
end;
$$;

-- A new account joins with a friend's code: 'ok', 'unknown' (no such code), 'self' or 'already' (it has an inviter).
create or replace function public.claim_referral(uid uuid, ref text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  owner uuid;
begin
  select user_id into owner from public.referral_codes where code = upper(ref);
  if owner is null then return 'unknown'; end if;
  if owner = uid then return 'self'; end if;
  insert into public.referrals (invitee, inviter) values (uid, owner) on conflict do nothing;
  if not found then return 'already'; end if;
  return 'ok';
end;
$$;

-- Extra free checks: 3 per invited friend (at most 10) and 3 for having been invited; how many friends joined
create or replace function public.referral_bonus(uid uuid)
returns table (bonus int, invited int) language sql stable security invoker set search_path = '' as $$
  select (3 * least((select count(*) from public.referrals where inviter = uid), 10)
          + 3 * (select count(*) from public.referrals where invitee = uid))::int,
         (select count(*) from public.referrals where inviter = uid)::int;
$$;
revoke execute on function public.referral_code(uuid), public.claim_referral(uuid, text), public.referral_bonus(uuid) from public, anon, authenticated;
grant execute on function public.referral_code(uuid), public.claim_referral(uuid, text), public.referral_bonus(uuid) to service_role;
