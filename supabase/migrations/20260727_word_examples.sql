-- Purpose-built example sentences for the public dictionary.
--
-- WHY THIS TABLE EXISTS: the first cut of dictionary examples mined the app's own
-- dialogues. That reads well but teaches badly — 白天 is an HSK 1 word, yet the
-- only dialogue sentences containing it were HSK 5/6 ("我现在都有点神经衰弱了").
-- A learner looking up a level-1 word must not be shown a level-6 sentence.
--
-- So each example is GENERATED for its headword and constrained to vocabulary at
-- or below that headword's own HSK 3.0 level, then machine-verified against
-- `hsk_words` before it is allowed in here (see scripts/gen-word-examples.py).
--
-- NOTE: apply this MANUALLY in the Supabase dashboard SQL editor.
-- `supabase db push` is blocked by migration drift on this project.

create table if not exists public.word_examples (
  id         bigint generated always as identity primary key,
  zh         text not null,                   -- headword, e.g. 白天
  -- Toneless pinyin of the HEADWORD. Same normalisation as hsk_words.py_norm, so
  -- the two join directly. Keeps senses apart: 打 dǎ and 打 dá get their own rows.
  py_norm    text not null,
  level      smallint not null check (level between 1 and 7),  -- headword level AT GENERATION TIME
  seq        smallint not null check (seq between 1 and 5),    -- 1 = first example shown
  ex_zh      text not null,                   -- the example sentence
  ex_py      text not null,                   -- tone-marked pinyin for the sentence
  uz         text not null,
  ru         text not null,
  en         text not null,
  -- Highest HSK level of any word in ex_zh, as measured by the validator. Always
  -- <= level; stored so a later tightening of the rule can re-query rather than
  -- re-generate.
  max_level  smallint not null,
  model      text not null,                   -- which model wrote it, for later re-runs
  created_at timestamptz not null default now(),
  unique (zh, py_norm, seq)
);

alter table public.word_examples enable row level security;  -- service-role only; reached via /api/dictionary/examples

create index if not exists word_examples_lookup_idx on public.word_examples (zh, py_norm);
