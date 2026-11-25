-- Short-lived receipts for signed-in learners retrying the same grading request.
create table if not exists public.grading_receipts (
  owner uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  digest text not null,
  created_at timestamptz not null default now(),
  result jsonb,
  primary key (owner, request_id, digest)
);
create index if not exists grading_receipts_created_idx on public.grading_receipts(created_at);
alter table public.grading_receipts enable row level security;
revoke all on table public.grading_receipts from public, anon, authenticated;
grant select, insert, update, delete on table public.grading_receipts to service_role;

create or replace function public.claim_grading_receipt(p_owner uuid, p_id uuid, p_digest text)
returns jsonb language plpgsql set search_path = public as $$
declare
  n integer;
  cached jsonb;
begin
  delete from public.grading_receipts where created_at < now() - interval '24 hours';
  insert into public.grading_receipts(owner, request_id, digest) values (p_owner, p_id, p_digest)
    on conflict do nothing;
  get diagnostics n = row_count;
  if n = 1 then return jsonb_build_object('state', 'new'); end if;
  select result into cached from public.grading_receipts where owner = p_owner and request_id = p_id and digest = p_digest;
  if cached is null then return jsonb_build_object('state', 'pending'); end if;
  return jsonb_build_object('state', 'done', 'result', cached);
end;
$$;
revoke all on function public.claim_grading_receipt(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_grading_receipt(uuid, uuid, text) to service_role;
