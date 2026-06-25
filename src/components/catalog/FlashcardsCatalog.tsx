'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';
import type { WritingSetMeta } from './types';
import { trackAll } from '@/utils/analytics';

// Props kept for the page that renders this (writing-set data), though the
// Flashcards tab now shows only topic decks.
interface Props {
  writingSets: WritingSetMeta[];
  writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[];
}

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

export function FlashcardsCatalog(_props: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [topicSearch, setTopicSearch] = useState('');

  // "Due today" summary — count the user's flashcard review states that are due.
  const { getAccessToken } = useAuth();
  const [dueCount, setDueCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;
      try {
        const res = await fetch('/api/flashcards/reviews', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (cancelled) return;
        const now = Date.now();
        const due = (data.reviews ?? []).filter((r: { due_at: string }) => new Date(r.due_at).getTime() <= now).length;
        setDueCount(due);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  // Debounced topic-search analytics.
  useEffect(() => {
    const q = topicSearch.trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [topicSearch]);

  if (isLoading) return <div className="loading-spinner" />;

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
    <main className="home">
      <CatalogHeader currentTab="flashcards" />

      {dueCount != null && dueCount > 0 && (
        <div style={{ maxWidth: 520, margin: '12px auto 0', padding: '0 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6,
            padding: '10px 14px', color: '#15803d', fontSize: 14, fontWeight: 600,
          }}>
            <span style={{ fontSize: 18 }}>🔁</span>
            <span>
              {({
                uz: `Bugun takrorlash uchun ${dueCount} ta karta tayyor`,
                ru: `${dueCount} карточек готовы к повторению`,
                en: `${dueCount} cards due for review today`,
              } as Record<string, string>)[language]}
            </span>
          </div>
        </div>
      )}

      <section className="home__content">
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
              href={`/chinese/flashcards/topics/${topic.slug}`}
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
      </section>

      {/* Logo moves to the footer on mobile (the hero is hidden there). */}
      <Link href="/" className="lp__footer-logo" aria-label="Blim">
        <Image src="/logo-red.svg" alt="Blim" width={72} height={25} />
      </Link>
      <PageFooter />
    </main>
  );
}
