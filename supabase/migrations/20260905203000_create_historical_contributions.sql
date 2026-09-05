create table if not exists public.historical_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  page_path text not null check (char_length(page_path) between 1 and 200 and page_path like '/%'),
  page_title text not null check (char_length(page_title) between 1 and 180),
  event_year smallint null check (event_year is null or event_year between 1800 and 2100),
  kind text not null check (kind in ('source','photo','document','testimony','correction','measurement','other')),
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 10 and 8000),
  location_text text null check (location_text is null or char_length(location_text) <= 240),
  date_label text null check (date_label is null or char_length(date_label) <= 120),
  source_url text null check (source_url is null or char_length(source_url) <= 1200),
  credit_name text null check (credit_name is null or char_length(credit_name) <= 120),
  publish_anonymously boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  rights_confirmed boolean not null,
  publication_authorized boolean not null,
  status text not null default 'pending' check (status in ('pending','reviewing','accepted','rejected')),
  moderation_note text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  constraint historical_contributions_attachments_array check (
    jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5
  ),
  constraint historical_contributions_rights_confirmed check (rights_confirmed),
  constraint historical_contributions_publication_authorized check (publication_authorized)
);

create index if not exists historical_contributions_user_created_idx
  on public.historical_contributions (user_id, created_at desc);
create index if not exists historical_contributions_page_status_idx
  on public.historical_contributions (page_path, status, created_at desc);

alter table public.historical_contributions enable row level security;

revoke all on table public.historical_contributions from public;
revoke all on table public.historical_contributions from anon;
grant select, insert on table public.historical_contributions to authenticated;

create policy "historical_contributions_select_own"
  on public.historical_contributions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "historical_contributions_insert_own"
  on public.historical_contributions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and moderation_note is null
    and reviewed_at is null
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'historical-contributions',
  'historical-contributions',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp','image/avif','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "historical_contributions_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'historical-contributions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "historical_contributions_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'historical-contributions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "historical_contributions_storage_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'historical-contributions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
