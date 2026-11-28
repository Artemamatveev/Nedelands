-- Purchases in the App Store and Google Play. Same block as in supabase/schema.sql; run once in the SQL editor.

-- What a learner bought in the store apps (api/_store.js): one row per user, the best access their purchases give now,
-- worked out by the server from RevenueCat's record each time a purchase, renewal, cancellation or refund comes in.
-- Plus as a monthly subscription (kind 'sub') or an Examenpas / Jaarpas (kind 'pass' / 'year'). Written only by the
-- server; the user may read their own row. Deleting the account deletes it (Apple and Google keep their own records).
create table if not exists public.store_plus (
  user_id uuid primary key references auth.users on delete cascade,
  level text not null check (level in ('A2', 'B1')),
  kind text not null check (kind in ('sub', 'pass', 'year')),
  store text not null,                        -- RevenueCat's store: app_store, play_store
  until timestamptz not null,                 -- end of the access
  ends boolean not null default false,        -- not renewed (a cancelled subscription, or a pass)
  updated_at timestamptz not null default now()
);
alter table public.store_plus enable row level security;
revoke all on public.store_plus from public, anon, authenticated;
grant select on public.store_plus to authenticated;
grant select, insert, update, delete on public.store_plus to service_role;
drop policy if exists "own store plus: read" on public.store_plus;
create policy "own store plus: read" on public.store_plus for select to authenticated using ((select auth.uid()) = user_id);
