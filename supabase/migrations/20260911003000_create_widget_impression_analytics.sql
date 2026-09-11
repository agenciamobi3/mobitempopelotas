create table public.widget_impressions_daily (
  widget_id uuid not null references public.user_widgets(id) on delete cascade,
  day date not null,
  host text not null,
  impressions bigint not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (widget_id, day, host),
  constraint widget_impressions_daily_host_length check (char_length(host) between 1 and 253),
  constraint widget_impressions_daily_host_normalized check (host = lower(trim(host))),
  constraint widget_impressions_daily_impressions_positive check (impressions > 0)
);

create index widget_impressions_daily_widget_day_idx
  on public.widget_impressions_daily (widget_id, day desc);

alter table public.widget_impressions_daily enable row level security;

revoke all on table public.widget_impressions_daily from anon;
revoke all on table public.widget_impressions_daily from authenticated;
grant select on table public.widget_impressions_daily to authenticated;

create policy "Users can read analytics for own widgets"
on public.widget_impressions_daily
for select
to authenticated
using (
  exists (
    select 1
    from public.user_widgets as w
    where w.id = widget_impressions_daily.widget_id
      and w.user_id = (select auth.uid())
  )
);

create or replace function public.record_widget_impression(
  p_token uuid,
  p_host text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_host text := lower(trim(coalesce(p_host, '')));
  target_widget_id uuid;
begin
  if normalized_host = ''
    or char_length(normalized_host) > 253
    or normalized_host !~ '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
    or normalized_host in ('tempopelotas.com.br', 'www.tempopelotas.com.br', 'localhost', '127.0.0.1')
  then
    return false;
  end if;

  select w.id
  into target_widget_id
  from public.user_widgets as w
  where w.public_token = p_token
    and w.status = 'active'
  limit 1;

  if target_widget_id is null then
    return false;
  end if;

  insert into public.widget_impressions_daily as daily (
    widget_id,
    day,
    host,
    impressions,
    first_seen_at,
    last_seen_at
  )
  values (
    target_widget_id,
    (now() at time zone 'America/Sao_Paulo')::date,
    normalized_host,
    1,
    now(),
    now()
  )
  on conflict (widget_id, day, host)
  do update set
    impressions = daily.impressions + 1,
    last_seen_at = now();

  return true;
end;
$$;

revoke all on function public.record_widget_impression(uuid, text) from public;
grant execute on function public.record_widget_impression(uuid, text) to service_role;

create or replace function public.get_user_widget_analytics()
returns table (
  widget_id uuid,
  impressions_today bigint,
  impressions_7d bigint,
  impressions_30d bigint,
  active_hosts_30d bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with calendar as (
    select (now() at time zone 'America/Sao_Paulo')::date as today
  )
  select
    w.id as widget_id,
    coalesce(sum(i.impressions) filter (where i.day = c.today), 0)::bigint as impressions_today,
    coalesce(sum(i.impressions) filter (where i.day >= c.today - 6), 0)::bigint as impressions_7d,
    coalesce(sum(i.impressions) filter (where i.day >= c.today - 29), 0)::bigint as impressions_30d,
    count(distinct i.host) filter (where i.day >= c.today - 29)::bigint as active_hosts_30d
  from public.user_widgets as w
  cross join calendar as c
  left join public.widget_impressions_daily as i
    on i.widget_id = w.id
   and i.day >= c.today - 29
  where w.user_id = (select auth.uid())
  group by w.id;
$$;

revoke all on function public.get_user_widget_analytics() from public;
grant execute on function public.get_user_widget_analytics() to authenticated;
