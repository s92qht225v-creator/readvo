'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSavedVocab } from '../hooks/useSavedVocab';
import { PageFooter } from './PageFooter';

export interface DictEntry {
  zh: string;
  pinyin: string;
  level: number | null;
  uz: string;
  ru: string;
  en: string;
}

/** Written for the headword and capped at its HSK level — see
 *  `scripts/gen-word-examples.py`. Not mined from the dialogues: those gave
 *  level-6 sentences for level-1 words. */
interface Example {
  ex_zh: string; ex_py: string; uz: string; ru: string; en: string; level: number;
}

const T = (l: string, uz: string, ru: string, en: string) => (l === 'ru' ? ru : l === 'en' ? en : uz);
const glossOf = (e: { uz: string; ru: string; en: string }, l: string) =>
  (l === 'ru' ? e.ru : l === 'en' ? e.en : e.uz) || e.en || e.uz;

/** 7 is the 七–九级 band. `null` → no chip at all: the word isn't in HSK 3.0,
 *  and "beyond HSK" would be a false difficulty claim for everyday words. */
const levelLabel = (l: number | null) => (l == null ? null : l >= 7 ? 'HSK 7–9' : `HSK ${l}`);
const levelBand = (l: number) => (l <= 2 ? 'a' : l <= 4 ? 'b' : l <= 6 ? 'c' : 'd');

/**
 * Public dictionary search (M5). Rows expand in place — a dictionary is used in
 * bursts (look up three words in a row), so a page navigation per word would be
 * friction. Word pages come later, for the subset substantive enough to index.
 */
export function DictionarySearch({ initial }: { initial: DictEntry[] }) {
  const [language] = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { isSaved, add } = useSavedVocab();

  const [q, setQ] = useState('');
  const [results, setResults] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [examples, setExamples] = useState<Record<string, Example[] | 'loading'>>({});
  const [savedTick, setSavedTick] = useState(0);   // re-render after an optimistic save
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

  useEffect(() => {
    const id = setTimeout(() => { void run(q, language); }, 250);
    return () => clearTimeout(id);
  }, [q, language, run]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { setOpen(null); }, [q]);

  const toggle = useCallback(async (e: DictEntry) => {
    const key = `${e.zh}|${e.pinyin}`;
    if (open === key) { setOpen(null); return; }
    setOpen(key);
    if (examples[key]) return;                       // already fetched
    setExamples((m) => ({ ...m, [key]: 'loading' }));
    try {
      const res = await fetch(
        `/api/dictionary/examples?zh=${encodeURIComponent(e.zh)}&py=${encodeURIComponent(e.pinyin)}`);
      const data = await res.json();
      setExamples((m) => ({ ...m, [key]: data.examples ?? [] }));
    } catch {
      setExamples((m) => ({ ...m, [key]: [] }));
    }
  }, [open, examples]);

  const save = useCallback(async (ev: React.MouseEvent, e: DictEntry) => {
    ev.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (isSaved(e.zh, e.pinyin)) return;
    await add({ zh: e.zh, py: e.pinyin, uz: e.uz, ru: e.ru, en: e.en, hsk: e.level });
    setSavedTick((t) => t + 1);
  }, [user, router, isSaved, add]);

  const showStarter = !q.trim() && !searched;
  const list = showStarter ? initial : results;

  return (
    <main className="dict">
      <h1 className="dict__title">{T(language, "Xitoycha lug'at", 'Китайский словарь', 'Chinese Dictionary')}</h1>
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
        <h2 className="dict__subhead">{T(language, 'Ommabop so‘zlar', 'Частые слова', 'Common words')}</h2>
      )}
      {loading && <div className="dict__note">{T(language, 'Qidirilmoqda…', 'Поиск…', 'Searching…')}</div>}
      {!loading && searched && results.length === 0 && (
        <div className="dict__note">{T(language, 'Hech narsa topilmadi.', 'Ничего не найдено.', 'No matches found.')}</div>
      )}

      {list.length > 0 && (
        <ul className="dict__list">
          {list.map((e) => {
            const key = `${e.zh}|${e.pinyin}`;
            const label = levelLabel(e.level);
            const isOpen = open === key;
            const ex = examples[key];
            const saved = isSaved(e.zh, e.pinyin);
            return (
              <li key={key + savedTick} className={`dict__row${isOpen ? ' dict__row--open' : ''}`}>
                <div
                  className="dict__click"
                  onClick={() => void toggle(e)}
                  onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); void toggle(e); } }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                >
                  <div className="dict__head">
                    <span className="dict__zh" lang="zh-Hans">{e.zh}</span>
                    <span className="dict__py">{e.pinyin}</span>
                    {label && <span className={`dict__badge dict__badge--${levelBand(e.level as number)}`}>{label}</span>}
                  </div>
                  <div className="dict__meaning">{glossOf(e, language)}</div>
                </div>

                {isOpen && (
                  <div className="dict__detail">
                    <button
                      type="button"
                      className={`dict__save${saved ? ' dict__save--done' : ''}`}
                      onClick={(ev) => void save(ev, e)}
                      aria-pressed={saved}
                    >
                      {saved
                        ? `✓ ${T(language, "Lug'atimda", 'В словаре', 'In my vocabulary')}`
                        : `+ ${T(language, "Lug'atimga qo'shish", 'Добавить в словарь', 'Add to my vocabulary')}`}
                    </button>

                    {ex === 'loading' && <div className="dict__exnote">{T(language, 'Yuklanmoqda…', 'Загрузка…', 'Loading…')}</div>}
                    {Array.isArray(ex) && ex.length === 0 && (
                      <div className="dict__exnote">{T(language, 'Bu so‘z uchun misol hali yo‘q.', 'Примеров для этого слова пока нет.', 'No examples for this word yet.')}</div>
                    )}
                    {Array.isArray(ex) && ex.length > 0 && (
                      <div className="dict__ex">
                        <div className="dict__exhead">{T(language, 'Misollar', 'Примеры', 'Examples')}</div>
                        {ex.map((s, i) => (
                          <div key={i} className="dict__exitem">
                            <span className="dict__exzh" lang="zh-Hans">{s.ex_zh}</span>
                            {s.ex_py && <span className="dict__expy">{s.ex_py}</span>}
                            <span className="dict__extr">{glossOf(s, language)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <PageFooter />
    </main>
  );
}
