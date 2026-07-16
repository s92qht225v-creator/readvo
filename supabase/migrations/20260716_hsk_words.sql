-- HSK 3.0 word database — reference spine.
-- Source: ivankra/hsk30 (MIT), derived from the PRC MoE standard 《国际中文教育中文水平等级标准》.
-- Count gate verified 2026-07-16: 500/772/973/1000/1071/1140/5636 = 11,092 exactly.
--
-- NOTE: apply this MANUALLY in the Supabase dashboard SQL editor.
-- `supabase db push` is blocked by migration drift on this project.

create table if not exists public.hsk_words (
  id          bigint generated always as identity primary key,
  hsk_id      text not null unique,           -- dataset ID, e.g. L1-0056 (natural key)
  zh          text not null,
  traditional text,
  pinyin      text not null,                  -- tone-marked, e.g. kōngtiáo
  -- toneless + lowercase + despaced + apostrophe/ellipsis-stripped
  -- kōngtiáo -> kongtiao ; nǐ hǎo -> nihao ; kě'ài -> keai ; …jí le -> jile
  py_norm     text generated always as (
                replace(replace(replace(lower(translate(pinyin,
                  'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ',
                  'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu')),
                ' ', ''), '''', ''), '…', '')
              ) stored,
  pos         text,                           -- part of speech: V, N, Adj, M, Prep…
  level       smallint not null check (level between 1 and 7),  -- 7 == the 七–九级 band
  uz          text,                           -- machine-generated later (M4)
  ru          text,
  en          text,
  source      text not null default 'ivankra/hsk30',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- IMPORTANT: no unique(zh, py_norm). The standard lists polysemous words once per
-- sense at different levels (打 = L1 V dǎ / L4 M dá / L5 Prep dǎ). 112 such groups,
-- 79 spanning different levels. Uniqueness would reject them.

alter table public.hsk_words enable row level security;  -- service-role only; never queried from the browser

create index if not exists hsk_words_py_norm_idx on public.hsk_words (py_norm);
create index if not exists hsk_words_level_idx   on public.hsk_words (level);
create index if not exists hsk_words_zh_idx      on public.hsk_words (zh);

-- "First introduced at" level per word form. The ONLY level source for the
-- admin analyzer and progressive pinyin: if 打 is introduced at L1, an L2
-- learner knows the form and must not be shown pinyin for it.
create or replace view public.hsk_word_levels as
  select zh, py_norm, min(level) as level
  from public.hsk_words
  group by zh, py_norm;

-- Official HSK 3.0 level for curated glossary words. NULL = not in HSK 3.0
-- (proper nouns / modern terms: 微信, 定位, 上海, 大盘鸡).
alter table public.glossary add column if not exists hsk30_level smallint;
