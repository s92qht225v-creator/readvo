-- Saved admin-generated TTS clips (the Audio tab "saved library").
-- Each row points at a file in the `audio` bucket under tts/library/.
create table if not exists public.tts_library (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  style      text not null default '',
  path       text not null,
  url        text not null,
  created_at timestamptz not null default now()
);
-- Service-role only (admin API). RLS on with no policies blocks anon/auth.
alter table public.tts_library enable row level security;
