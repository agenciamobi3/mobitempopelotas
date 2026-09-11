create table public.widget_installations (
  widget_id uuid not null references public.user_widgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_host text not null,
  total_loads bigint not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (widget_id, site_host),
  constraint widget_installations_site_host_length check (char_length(site_host) between 1 and 253),
  constraint widget_installations_site_host_normalized check (site_host = lower(btrim(site_host))),
  constraint widget_installations_total_loads_check check (total_loads >= 0)
);

create index widget_installations_user_activity_idx
  on public.widget_installations (user_id, last_seen_at desc);

alter table public.widget_installations enable row level security;

create policy "Users can read own widget installations"
on public.widget_installations
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.widget_installations from anon, authenticated;
grant select on table public.widget_installations to authenticated;

create table public.widget_usage_daily (
  widget_id uuid not null references public.user_widgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  site_host text not null,
  day date not null,
  loads bigint not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (widget_id, site_host, day),
  constraint widget_usage_daily_site_host_length check (char_length(site_host) between 1 and 253),
  constraint widget_usage_daily_site_host_normalized check (site_host = lower(btrim(site_host))),
  constraint widget_usage_daily_loads_check check (loads >= 0)
);

create index widget_usage_daily_user_day_idx
  on public.widget_usage_daily (user_id, day desc);

create index widget_usage_daily_widget_day_idx
  on public.widget_usage_daily (widget_id, day desc);

alter table public.widget_usage_daily enable row level security;

create policy "Users can read own widget daily usage"
on public.widget_usage_daily
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.widget_usage_daily from anon, authenticated;
grant select on table public.widget_usage_daily to authenticated;

create or replace function public.record_widget_load(
  p_token uuid,
  p_site_host text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_widget_id uuid;
  v_user_id uuid;
  v_host text;
  v_day date := (current_timestamp at time zone 'America/Sao_Paulo')::date;
begin
  v_host := lower(btrim(coalesce(p_site_host, '')));
  v_host := regexp_replace(v_host, '^www\.', '');
  v_host := regexp_replace(v_host, '\.$', '');

  if v_host = ''
    or char_length(v_host) > 253
    or v_host !~ '^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$'
  then
    return false;
  end if;

  if v_host = 'tempopelotas.com.br' or v_host like '%.tempopelotas.com.br' then
    return false;
  end if;

  select w.id, w.user_id
    into v_widget_id, v_user_id
  from public.user_widgets as w
  where w.public_token = p_token
    and w.status = 'active'
  limit 1;

  if not found then
    return false;
  end if;

  insert into public.widget_installations as wi (
    widget_id,
    user_id,
    site_host,
    total_loads,
    first_seen_at,
    last_seen_at
  )
  values (
    v_widget_id,
    v_user_id,
    v_host,
    1,
    now(),
    now()
  )
  on conflict (widget_id, site_host)
  do update set
    total_loads = wi.total_loads + 1,
    last_seen_at = excluded.last_seen_at;

  insert into public.widget_usage_daily as wd (
    widget_id,
    user_id,
    site_host,
    day,
    loads,
    first_seen_at,
    last_seen_at
  )
  values (
    v_widget_id,
    v_user_id,
    v_host,
    v_day,
    1,
    now(),
    now()
  )
  on conflict (widget_id, site_host, day)
  do update set
    loads = wd.loads + 1,
    last_seen_at = excluded.last_seen_at;

  return true;
end;
$$;

revoke all on function public.record_widget_load(uuid, text) from public;
grant execute on function public.record_widget_load(uuid, text) to service_role;
