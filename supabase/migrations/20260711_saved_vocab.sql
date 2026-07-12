-- "My Vocabulary": words a user saves from dialogue Words tabs, reviewed in a
-- personal swipe deck. Service-role only (accessed via /api/vocab with JWT),
-- mirroring glossary / flashcard_reviews. Full word stored so the review deck
-- renders without re-resolving the glossary.
create table if not exists public.saved_vocab (
  user_id    uuid        not null,
  zh         text        not null,
  py         text        not null default '',
  uz         text        not null default '',
  ru         text        not null default '',
  en         text        not null default '',
  hsk        int,
  created_at timestamptz not null default now(),
  primary key (user_id, zh, py)
);
alter table public.saved_vocab enable row level security;
