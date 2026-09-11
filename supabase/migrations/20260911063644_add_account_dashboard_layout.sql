alter table public.user_preferences
  add column if not exists dashboard_layout jsonb not null default '{}'::jsonb;

alter table public.user_preferences
  drop constraint if exists user_preferences_dashboard_layout_object;
alter table public.user_preferences
  add constraint user_preferences_dashboard_layout_object
  check (jsonb_typeof(dashboard_layout) = 'object');

alter table public.user_preferences
  drop constraint if exists user_preferences_dashboard_layout_size;
alter table public.user_preferences
  add constraint user_preferences_dashboard_layout_size
  check (octet_length(dashboard_layout::text) <= 16384);

comment on column public.user_preferences.dashboard_layout is
  'Layout versionado do painel autenticado: ordem de seções e cards e tamanhos de apresentação. Validado pela aplicação; não contém dados meteorológicos.';
