'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';
import { parseHskLevel, type WritingSetMeta } from './types';
import { trackAll } from '@/utils/analytics';

interface Props {
  writingSets: WritingSetMeta[];
  writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[];
}

const FLASHCARD_MODE_KEY = 'blim-flashcard-mode';

const TOPIC_ITEMS = [
  { uz: 'Oila', ru: 'Семья', en: 'Family', icon: '👨‍👩‍👧', slug: 'family' },
  { uz: 'Tana a\'zolari', ru: 'Части тела', en: 'Body Parts', icon: '🫀', slug: 'body' },
  { uz: 'Oziq-ovqat', ru: 'Еда', en: 'Food', icon: '🍜', slug: 'food' },
  { uz: 'Hayvonlar', ru: 'Животные', en: 'Animals', icon: '🐼', slug: 'animals' },
  { uz: 'Ranglar', ru: 'Цвета', en: 'Colors', icon: '🎨', slug: 'colors' },
  { uz: 'Sonlar', ru: 'Числа', en: 'Numbers', icon: '🔢', slug: 'numbers' },
  { uz: 'Vaqt', ru: 'Время', en: 'Time', icon: '⏰', slug: 'time' },
  { uz: 'Kasblar', ru: 'Профессии', en: 'Professions', icon: '👩‍🏫', slug: 'professions' },
  { uz: 'Ofis jihozlari', ru: 'Офис. оборудование', en: 'Office Equipment', icon: '🖨️', slug: 'office' },
  { uz: 'Ofis harakatlari', ru: 'Офисные действия', en: 'Office Actions', icon: '📋', slug: 'office-actions' },
  { uz: 'Biznes atamalar', ru: 'Бизнес-термины', en: 'Business Terms', icon: '💼', slug: 'business' },
  { uz: 'Ofis lavozimlari', ru: 'Должности', en: 'Workplace Roles', icon: '👔', slug: 'workplace-roles' },
  { uz: 'Ish-yozuv anjomlari', ru: 'Канцтовары', en: 'Stationery', icon: '✏️', slug: 'stationery' },
  { uz: 'Ofis xonalari', ru: 'Офис. помещения', en: 'Office Spaces', icon: '🏢', slug: 'office-spaces' },
  { uz: 'Savdo atamalar', ru: 'Торговля', en: 'Trade', icon: '🤝', slug: 'trade' },
  { uz: "Narx va to'lov", ru: 'Цены и оплата', en: 'Pricing & Payment', icon: '💰', slug: 'pricing' },
  { uz: 'Shartnoma atamalar', ru: 'Договоры', en: 'Contracts', icon: '📝', slug: 'contracts' },
  { uz: 'Buyurtma va ishlab chiqarish', ru: 'Заказы и произв.', en: 'Orders & Production', icon: '📦', slug: 'orders' },
  { uz: 'Logistika', ru: 'Логистика', en: 'Logistics', icon: '🚚', slug: 'logistics' },
  { uz: 'Mehmonxona', ru: 'Гостиница', en: 'Hotel', icon: '🏨', slug: 'hotel' },
  { uz: 'Hujjatlar', ru: 'Документы', en: 'Documents', icon: '🪪', slug: 'documents' },
  { uz: 'Transport turlari', ru: 'Виды транспорта', en: 'Transportation', icon: '✈️', slug: 'transportation' },
  { uz: 'Avtomobil turlari', ru: 'Виды автомобилей', en: 'Vehicle Types', icon: '🚗', slug: 'vehicles' },
  { uz: 'Mashina tashqi qismlari', ru: 'Наруж. части авто', en: 'Car Exterior', icon: '🚙', slug: 'car-exterior' },
  { uz: 'Dvigatel va mexanika', ru: 'Двигатель и мех.', en: 'Engine & Mechanics', icon: '⚙️', slug: 'car-engine' },
  { uz: 'Mashina ichki qismlari', ru: 'Салон авто', en: 'Car Interior', icon: '🪑', slug: 'car-interior' },
  { uz: "Yo'nalishlar", ru: 'Направления', en: 'Directions', icon: '🧭', slug: 'directions' },
  { uz: "His-tuyg'ular", ru: 'Эмоции', en: 'Emotions', icon: '😊', slug: 'emotions' },
];

function FlashcardModeBar({ flashcardMode, setFlashcardMode }: { flashcardMode: string; setFlashcardMode: (m: string) => void }) {
  const [language] = useLanguage();
  const modes = [
    { id: 'zh-uz', label: ({ uz: "汉字 → O'zbekcha", ru: "汉字 → Русский", en: "汉字 → English" } as Record<string, string>)[language] },
    { id: 'uz-zh', label: ({ uz: "O'zbekcha → 汉字", ru: "Русский → 汉字", en: "English → 汉字" } as Record<string, string>)[language] },
  ];
  return (
    <div style={{ display: 'flex', background: '#f5f5f8', borderRadius: 3, overflow: 'hidden', marginBottom: 14, border: '1px solid #e0e0e6' }}>
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => {
            setFlashcardMode(m.id);
            localStorage.setItem(FLASHCARD_MODE_KEY, m.id);
          }}
          style={{
            flex: 1, padding: '10px 8px', border: 'none',
            background: flashcardMode === m.id ? '#dc2626' : 'transparent',
            color: flashcardMode === m.id ? '#fff' : '#666',
            fontSize: 13, fontWeight: flashcardMode === m.id ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          type="button"
        >{m.label}</button>
      ))}
    </div>
  );
}

export function FlashcardsCatalog({ writingSets, writingSetsHsk2L2, writingSetsHsk3 }: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const searchParams = useSearchParams();

  // Flashcard mode — init from localStorage EXACTLY as LanguagePage does
  const [flashcardMode, setFlashcardMode] = useState<string>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(FLASHCARD_MODE_KEY) || 'zh-uz' : 'zh-uz';
    } catch {
      return 'zh-uz';
    }
  });

  // Subtab: 'lessons' | 'topics' — init from searchParams exactly as LanguagePage
  const initialSubTab = searchParams.get('subtab');
  const [flashcardSubTab, setFlashcardSubTab] = useState<'lessons' | 'topics'>(initialSubTab === 'topics' ? 'topics' : 'lessons');

  // HSK level: only levels 1-3 have flashcard decks; parseHskLevel max=3 clamp (verbatim from LanguagePage)
  const [flashcardHskLevel, setFlashcardHskLevel] = useState<'1' | '2' | '3'>(parseHskLevel(searchParams.get('flashhsk'), 3) as '1' | '2' | '3');

  const [topicSearch, setTopicSearch] = useState('');

  // Meta Pixel / Yandex / GA4: debounced topic-search tracking (parity with LanguagePage)
  useEffect(() => {
    const q = topicSearch.trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [topicSearch]);

  if (isLoading) return <div className="loading-spinner" />;

  const activeFlashSets = flashcardHskLevel === '3' ? writingSetsHsk3 : flashcardHskLevel === '2' ? writingSetsHsk2L2 : writingSets;
  const hskPath = flashcardHskLevel === '3' ? 'hsk3' : flashcardHskLevel === '2' ? 'hsk2' : 'hsk1';

  return (
    <main className="home">
      <CatalogHeader currentTab="flashcards" hskLevel={flashcardHskLevel} />

      {/* HSK level pills + Topics button */}
      <div className={`lp__seg-bar lp__seg-bar--col`}>
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lv) => {
            const hasContent = lv === 'HSK 1' || (flashcardSubTab === 'lessons' && (lv === 'HSK 2' || lv === 'HSK 3'));
            const isActive = flashcardSubTab === 'lessons' && (
              (lv === 'HSK 1' && flashcardHskLevel === '1') ||
              (lv === 'HSK 2' && flashcardHskLevel === '2') ||
              (lv === 'HSK 3' && flashcardHskLevel === '3')
            );
            return (
              <button
                key={lv}
                type="button"
                disabled={!hasContent}
                onClick={() => {
                  if (hasContent) {
                    setFlashcardSubTab('lessons');
                    setFlashcardHskLevel(lv === 'HSK 3' ? '3' : lv === 'HSK 2' ? '2' : '1');
                  }
                }}
                className={`lp__hsk-pill ${isActive ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
              >
                {lv}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setFlashcardSubTab('topics')}
          className={`lp__hsk-pill lp__hsk-pill--full ${flashcardSubTab === 'topics' ? 'lp__hsk-pill--active' : ''}`}
        >
          {({ uz: 'Mavzular', ru: 'Темы', en: 'Topics' } as Record<string, string>)[language]}
        </button>
      </div>

      {/* Content */}
      <section className="home__content">

        {/* Lessons subtab */}
        {flashcardSubTab === 'lessons' && (
          <>
            <FlashcardModeBar flashcardMode={flashcardMode} setFlashcardMode={setFlashcardMode} />
            <div className="lp__writing-sets">
              {activeFlashSets.map((set, idx) => {
                const sampleTrans = language === 'ru' ? (set.sampleRu || set.sampleUz) : language === 'en' ? (set.sampleEn || set.sampleUz) : (set.sampleUz || '');
                const ghost = flashcardMode === 'uz-zh'
                  ? `${sampleTrans} – ${set.sampleChar || ''}`
                  : `${set.sampleChar || ''} – ${sampleTrans}`;
                const num = idx + 1;
                return (
                  <Link
                    key={set.id}
                    className="lp__writing-card"
                    href={`/chinese/${hskPath}/flashcards/${set.id}`}
                    prefetch={false}
                  >
                    <div className="lp__writing-card-deco" aria-hidden="true">{ghost}</div>
                    <div className="lp__writing-card__title">
                      {({ uz: `${num}-to'plam`, ru: `Набор ${num}`, en: `Set ${num}` } as Record<string, string>)[language]}
                    </div>
                    <div className="lp__writing-card__sub">
                      {set.wordCount || 10} {({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Topics subtab */}
        {flashcardSubTab === 'topics' && (() => {
          const tq = topicSearch.trim().toLowerCase();
          const filteredTopics = tq
            ? TOPIC_ITEMS.filter((t) =>
                t.uz.toLowerCase().includes(tq) ||
                t.ru.toLowerCase().includes(tq) ||
                t.en.toLowerCase().includes(tq) ||
                t.slug.includes(tq)
              )
            : TOPIC_ITEMS;
          return (
            <>
              <FlashcardModeBar flashcardMode={flashcardMode} setFlashcardMode={setFlashcardMode} />
              <div className="dialogues__search">
                <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="dialogues__search-input"
                  aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
                  placeholder={({ uz: 'Mavzularni qidirish...', ru: 'Поиск тем...', en: 'Search topics...' } as Record<string, string>)[language]}
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {filteredTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/chinese/hsk1/flashcards/topic/${topic.slug}`}
                    prefetch={false}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '14px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{topic.icon}</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                      {(topic as Record<string, string>)[language] ?? topic.uz}
                    </div>
                  </Link>
                ))}
                {filteredTopics.length === 0 && (
                  <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
                )}
              </div>
            </>
          );
        })()}

      </section>

      {/* Logo moves to the footer on mobile (the hero is hidden there). */}
      <Link href="/" className="lp__footer-logo" aria-label="Blim">
        <Image src="/logo-red.svg" alt="Blim" width={72} height={25} />
      </Link>
      <PageFooter />
    </main>
  );
}
