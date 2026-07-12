'use client';

import { useMemo, useState } from 'react';
import type { Language } from '../types/ui-state';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '../hooks/useAuth';
import { useSavedVocab } from '../hooks/useSavedVocab';

export interface VocabItem {
  zh: string; py: string; uz: string; ru: string; en: string;
}

const meaningOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);

type Dir = 'zh-native' | 'native-zh';

/**
 * Words tab: every vocab word as a flip-card, stacked vertically. Tap a card →
 * it 3D-rotates to show the other side. Only one is open at a time.
 *
 * The Chinese side carries a "+" button that saves the word to the user's
 * personal vocabulary ("My Vocabulary" — reviewed at /chinese/vocabulary). Once
 * saved the button shows a ✓. Saving requires login (the button routes to
 * /login for anonymous readers). Per-word audio was removed here — single-word
 * TTS generation was unreliable.
 *
 * A direction toggle sits above the stack:
 *  - 汉字 → native: front = pinyin + 汉字 (+save), back = meaning.
 *  - native → 汉字: front = meaning, back = pinyin + 汉字 (+save).
 */
export function DialogueVocab({ words, language }: { words: VocabItem[]; language: Language }) {
  const { user } = useAuth();
  const router = useRouter();
  const { words: saved, add } = useSavedVocab();
  const savedSet = useMemo(() => new Set(saved.map((w) => `${w.zh}|${w.py}`)), [saved]);

  // Show vocab alphabetically by pinyin (tone marks ignored for ordering).
  const sorted = useMemo(() => {
    const key = (v: VocabItem) => (v.py || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return [...words].sort((a, b) => key(a).localeCompare(key(b)));
  }, [words]);
  const [open, setOpen] = useState<number | null>(null);
  const [dir, setDir] = useState<Dir>('zh-native');

  const saveLabel = ({ uz: "Lug'atga qo'shish", ru: 'Добавить в словарь', en: 'Add to vocabulary' } as Record<string, string>)[language];
  const savedLabel = ({ uz: "Lug'atga qo'shilgan", ru: 'В словаре', en: 'In vocabulary' } as Record<string, string>)[language];

  const handleSave = async (e: React.MouseEvent, v: VocabItem) => {
    e.stopPropagation();
    if (savedSet.has(`${v.zh}|${v.py}`)) return;
    if (!user) { router.push('/login'); return; }
    await add({ zh: v.zh, py: v.py, uz: v.uz, ru: v.ru, en: v.en });
  };

  const modes: { id: Dir; label: string }[] = [
    { id: 'zh-native', label: ({ uz: "汉字 → O'zbekcha", ru: '汉字 → Русский', en: '汉字 → English' } as Record<string, string>)[language] },
    { id: 'native-zh', label: ({ uz: "O'zbekcha → 汉字", ru: 'Русский → 汉字', en: 'English → 汉字' } as Record<string, string>)[language] },
  ];

  const chineseSide = (v: VocabItem) => {
    const isSaved = savedSet.has(`${v.zh}|${v.py}`);
    return (
      <>
        <button
          type="button"
          className={`dr-flip__save ${isSaved ? 'dr-flip__save--done' : ''}`}
          onClick={(e) => handleSave(e, v)}
          aria-label={isSaved ? savedLabel : saveLabel}
          aria-pressed={isSaved}
          title={isSaved ? savedLabel : saveLabel}
        >
          {isSaved
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>}
        </button>
        <span className="dr-flip__py">{v.py}</span>
        <span className="dr-flip__zh" lang="zh-Hans">{v.zh}</span>
      </>
    );
  };
  const meaningSide = (v: VocabItem) => <span className="dr-flip__meaning">{meaningOf(v, language)}</span>;

  return (
    <>
      <div className="dr-vocab-dir">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`dr-vocab-dir__btn ${dir === m.id ? 'dr-vocab-dir__btn--active' : ''}`}
            onClick={() => { setDir(m.id); setOpen(null); }}
          >{m.label}</button>
        ))}
      </div>
      <div className="dr-flips">
        {sorted.map((v, i) => (
          <div
            key={i}
            className={`dr-flip ${open === i ? 'dr-flip--open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(open === i ? null : i);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={open === i}
          >
            <div className="dr-flip__inner">
              <div className="dr-flip__face dr-flip__front">
                {dir === 'zh-native' ? chineseSide(v) : meaningSide(v)}
              </div>
              <div className="dr-flip__face dr-flip__back">
                {dir === 'zh-native' ? meaningSide(v) : chineseSide(v)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
