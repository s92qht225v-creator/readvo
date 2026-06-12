create table if not exists public.glossary (
  id         uuid primary key default gen_random_uuid(),
  zh         text not null,
  py         text not null,
  py_norm    text not null,
  uz         text not null,
  ru         text not null,
  en         text not null,
  hsk        smallint check (hsk between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zh, py_norm)
);
-- No RLS policies: the table is read/written only by the service-role key
-- (server + admin API). Keep RLS disabled so anon/auth roles have no access.
create index if not exists glossary_zh_idx on public.glossary (zh);
