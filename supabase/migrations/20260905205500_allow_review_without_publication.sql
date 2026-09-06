alter table public.historical_contributions
  drop constraint if exists historical_contributions_publication_authorized;

comment on column public.historical_contributions.publication_authorized is
  'True only when the contributor authorized public reproduction of the submitted material. False still permits private editorial review and use as a research lead.';
