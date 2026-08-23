create table if not exists public.security_rate_limit_buckets (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_started_at),
  constraint security_rate_limit_scope_length check (char_length(scope) between 1 and 80),
  constraint security_rate_limit_key_length check (char_length(key_hash) between 32 and 128),
  constraint security_rate_limit_count_nonnegative check (request_count >= 0)
);

create index if not exists security_rate_limit_buckets_updated_at_idx
  on public.security_rate_limit_buckets (updated_at);

alter table public.security_rate_limit_buckets enable row level security;

revoke all on table public.security_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table public.security_rate_limit_buckets to service_role;

create or replace function public.consume_security_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_now timestamptz default now()
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_started_at timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_scope is null or char_length(p_scope) < 1 or char_length(p_scope) > 80 then
    raise exception 'invalid rate-limit scope';
  end if;
  if p_key_hash is null or char_length(p_key_hash) < 32 or char_length(p_key_hash) > 128 then
    raise exception 'invalid rate-limit key';
  end if;
  if p_limit < 1 or p_limit > 10000 then
    raise exception 'invalid rate-limit ceiling';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate-limit window';
  end if;

  v_window_started_at := to_timestamp(
    floor(extract(epoch from p_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.security_rate_limit_buckets (
    scope,
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_scope,
    p_key_hash,
    v_window_started_at,
    1,
    p_now
  )
  on conflict (scope, key_hash, window_started_at)
  do update set
    request_count = public.security_rate_limit_buckets.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  v_retry := greatest(
    1,
    ceil(
      extract(
        epoch from (
          v_window_started_at + make_interval(secs => p_window_seconds) - p_now
        )
      )
    )::integer
  );

  if v_count = 1 then
    delete from public.security_rate_limit_buckets
    where updated_at < p_now - interval '2 days';
  end if;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_retry;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, text, integer, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, text, integer, integer, timestamptz)
  to service_role;
