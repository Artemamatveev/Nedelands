-- The withdrawal button (herroeping, art. 11a of the EU consumer rights directive, in force since 19 June 2026):
-- every statement a learner makes in the app, kept as proof with its time; api/plus.js writes it, the owner refunds
-- in Stripe. A withdrawn Examenpas ends at once, so the server may now change `until`.
create table if not exists public.withdrawals (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('sub', 'pass')),
  ref text not null,                           -- Stripe subscription id (sub_…) or Checkout session (cs_…)
  at timestamptz not null default now(),
  refunded_at timestamptz                      -- set by hand when the money is back
);
create index if not exists withdrawals_user on public.withdrawals (user_id, at desc);
create unique index if not exists withdrawals_ref on public.withdrawals (ref);
alter table public.withdrawals enable row level security;
revoke all on public.withdrawals from public, anon, authenticated;
grant select, insert, update on public.withdrawals to service_role;
grant update (until) on public.exam_pass to service_role;
