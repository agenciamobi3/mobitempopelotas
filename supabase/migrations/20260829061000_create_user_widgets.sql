create table public.user_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_token uuid not null default gen_random_uuid() unique,
  widget_type text not null,
  title text not null default 'Widget Tempo Pelotas',
  theme text not null default 'auto',
  config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_widgets_type_length check (char_length(trim(widget_type)) between 1 and 64),
  constraint user_widgets_title_length check (char_length(trim(title)) between 1 and 100),
  constraint user_widgets_theme_check check (theme in ('auto', 'light', 'dark')),
  constraint user_widgets_status_check check (status in ('active', 'inactive')),
  constraint user_widgets_version_check check (version > 0),
  constraint user_widgets_config_object check (jsonb_typeof(config) = 'object')
);

create index user_widgets_user_id_idx
  on public.user_widgets (user_id, created_at desc);

create index user_widgets_active_idx
  on public.user_widgets (status, public_token)
  where status = 'active';

alter table public.user_widgets enable row level security;

create policy "Users can read own widgets"
on public.user_widgets
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own widgets"
on public.user_widgets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own widgets"
on public.user_widgets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own widgets"
on public.user_widgets
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_widgets from anon;
grant select, insert, update, delete on table public.user_widgets to authenticated;

create or replace function public.set_user_widgets_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_widgets_set_updated_at
before update on public.user_widgets
for each row execute function public.set_user_widgets_updated_at();

create or replace function public.get_public_widget(p_token uuid)
returns table (
  public_token uuid,
  widget_type text,
  title text,
  theme text,
  config jsonb,
  version integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.public_token,
    w.widget_type,
    w.title,
    w.theme,
    w.config,
    w.version,
    w.updated_at
  from public.user_widgets as w
  where w.public_token = p_token
    and w.status = 'active'
  limit 1;
$$;

revoke all on function public.get_public_widget(uuid) from public;
grant execute on function public.get_public_widget(uuid) to anon;
grant execute on function public.get_public_widget(uuid) to authenticated;
