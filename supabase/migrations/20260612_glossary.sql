create table if not exists public.glossary (
  id         uuid primary key default gen_random_uuid(),
  zh         text not null,
  py         text not null,
  -- py_norm is GENERATED so callers never set it and it can never drift from py.
  -- (SQL can't do Unicode NFC; writers store py already in NFC form, and the app's
  --  normPy() also applies NFC, so app-side matching and this column stay consistent.)
  py_norm    text generated always as (lower(btrim(regexp_replace(py, '\s+', ' ', 'g')))) stored,
  uz         text not null,
  ru         text not null,
  en         text not null,
  hsk        smallint check (hsk between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zh, py_norm)
);
create index if not exists glossary_zh_idx on public.glossary (zh);

-- Enable RLS with NO policies: the service-role key (server + admin API) bypasses
-- RLS and keeps full access, while anon/authenticated roles get zero access. The
-- table is never queried from the browser. (RLS *disabled* would expose the table
-- to the public anon key — read AND write — which is the opposite of what we want.)
alter table public.glossary enable row level security;
