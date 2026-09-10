create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_key text not null,
  resource_type text not null,
  created_at timestamptz not null default now(),
  constraint user_favorites_resource_key_length
    check (char_length(trim(resource_key)) between 1 and 80),
  constraint user_favorites_resource_type_check
    check (resource_type in ('page', 'location', 'station', 'tool')),
  constraint user_favorites_user_resource_unique unique (user_id, resource_key)
);

create index user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);

alter table public.user_favorites enable row level security;

create policy "Users can read own favorites"
on public.user_favorites
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own favorites"
on public.user_favorites
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete own favorites"
on public.user_favorites
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_favorites from anon;
grant select, insert, delete on table public.user_favorites to authenticated;
