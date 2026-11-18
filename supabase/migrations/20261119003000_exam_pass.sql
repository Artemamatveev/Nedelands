-- The Examenpas (one-time payment). Same block as in supabase/schema.sql; run once in the SQL editor.

-- The Examenpas (api/plus.js, api/stripe.js): one row per paid one-time Checkout, keyed by the session, so a repeated
-- webhook adds nothing. Gives the Plus checks of its level until `until`. Written only by the server; the user may
-- read their own rows. Deleting the account deletes them (Stripe keeps its own payment record).
create table if not exists public.exam_pass (
  session text primary key,                   -- Stripe's Checkout session id (cs_…)
  user_id uuid not null references auth.users on delete cascade,
  level text not null check (level in ('A2', 'B1')),
  until timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists exam_pass_user on public.exam_pass (user_id, until desc);
alter table public.exam_pass enable row level security;
revoke all on public.exam_pass from public, anon, authenticated;
grant select on public.exam_pass to authenticated;
grant select, insert on public.exam_pass to service_role;
drop policy if exists "own pass: read" on public.exam_pass;
create policy "own pass: read" on public.exam_pass for select to authenticated using ((select auth.uid()) = user_id);
