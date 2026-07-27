'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { PageFooter } from './PageFooter';

export interface DictEntry {
  zh: string;
  pinyin: string;
  level: number | null;
  meaning: string;
}

const T = (l: string, uz: string, ru: string, en: string) =>
  (l === 'ru' ? ru : l === 'en' ? en : uz);

/** Level chip text. 7 is the 七–九级 band, so it renders as a range.
 *  `null` = the word isn't in the HSK 3.0 list → no chip at all (see the
 *  dictionary spec: an absent chip claims nothing, "beyond HSK" would be a
 *  false difficulty claim for everyday words like 点菜). */
const levelLabel = (l: number | null) => (l == null ? null : l >= 7 ? 'HSK 7–9' : `HSK ${l}`);
const levelBand = (l: number) => (l <= 2 ? 'a' : l <= 4 ? 'b' : l <= 6 ? 'c' : 'd');

function Row({ e }: { e: DictEntry }) {
  const label = levelLabel(e.level);
  return (
    <li className="dict__row">
      <div className="dict__head">
        <span className="dict__zh" lang="zh-Hans">{e.zh}</span>
        <span className="dict__py">{e.pinyin}</span>
        {label && <span className={`dict__badge dict__badge--${levelBand(e.level as number)}`}>{label}</span>}
      </div>
      <div className="dict__meaning">{e.meaning}</div>
    </li>
  );
}

/**
 * Public dictionary search (M5). Searches 汉字, toneless pinyin ("kongtiao")
 * or the learner's own language against `/api/dictionary`.
 *
 * `initial` is a server-rendered starter list (common HSK 1 words) so the page
 * has real indexable content before anyone types — the search page is meant to
 * be indexed immediately, and an empty search box is exactly the thin/empty
 * shell that got the catalogs stuck in "crawled – not indexed".
 */
export function DictionarySearch({ initial }: { initial: DictEntry[] }) {
  const [language] = useLanguage();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (query: string, lang: string) => {
    const term = query.trim();
    abortRef.current?.abort();
    if (!term) { setResults([]); setSearched(false); setLoading(false); return; }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(`/api/dictionary?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ac.signal });
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
      setSearched(true);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { setResults([]); setSearched(true); }
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  // Debounce typing; re-run when the UI language changes so glosses follow it.
  useEffect(() => {
    const id = setTimeout(() => { void run(q, language); }, 250);
    return () => clearTimeout(id);
  }, [q, language, run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const showStarter = !q.trim() && !searched;
  const list = showStarter ? initial : results;

  return (
    <main className="dict">
      <h1 className="dict__title">
        {T(language, "Xitoycha lug'at", 'Китайский словарь', 'Chinese Dictionary')}
      </h1>
      <p className="dict__intro">
        {T(language,
          "Iyeroglif, pinyin (belgilarsiz — masalan “kongtiao”) yoki o‘zbekcha so‘z bo‘yicha qidiring. HSK 3.0 darajasi bilan 11 000 dan ortiq so‘z.",
          'Ищите по иероглифу, пиньиню (без тонов — например «kongtiao») или русскому слову. Более 11 000 слов с уровнем HSK 3.0.',
          'Search by character, pinyin (no tone marks — e.g. “kongtiao”), or a word in your language. 11,000+ words with their HSK 3.0 level.')}
      </p>

      <input
        className="dict__input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={T(language, '汉字, pinyin yoki so‘z…', 'иероглиф, пиньинь или слово…', 'character, pinyin, or word…')}
        aria-label={T(language, 'Lug‘atdan qidirish', 'Поиск в словаре', 'Search the dictionary')}
        autoComplete="off"
        enterKeyHint="search"
      />

      {showStarter && initial.length > 0 && (
        <h2 className="dict__subhead">
          {T(language, 'Ommabop so‘zlar', 'Частые слова', 'Common words')}
        </h2>
      )}

      {loading && <div className="dict__note">{T(language, 'Qidirilmoqda…', 'Поиск…', 'Searching…')}</div>}

      {!loading && searched && results.length === 0 && (
        <div className="dict__note">
          {T(language, 'Hech narsa topilmadi.', 'Ничего не найдено.', 'No matches found.')}
        </div>
      )}

      {list.length > 0 && (
        <ul className="dict__list">
          {list.map((e) => <Row key={`${e.zh}|${e.pinyin}`} e={e} />)}
        </ul>
      )}

      <PageFooter />
    </main>
  );
}
