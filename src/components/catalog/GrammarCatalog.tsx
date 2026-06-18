'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useStars } from '../../hooks/useStars';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';
import { trackAll } from '@/utils/analytics';

const grammarItems = [
  { char: '什么', pinyin: 'shénme', href: '/chinese/hsk1/grammar/shenme', translation: 'nima?', translation_ru: 'что?', translation_en: 'what?', color: '#dc2626', active: true },
  { char: '是', pinyin: 'shì', href: '/chinese/hsk1/grammar/shi', translation: 'bo\'lmoq', translation_ru: 'быть', translation_en: 'to be', color: '#dc2626', active: true },
  { char: '不是', pinyin: 'bú shì', href: '/chinese/hsk1/grammar/bushi-polished', translation: 'emas', translation_ru: 'не быть', translation_en: 'is not', color: '#dc2626', active: true },
  { char: '吗', pinyin: 'ma', href: '/chinese/hsk1/grammar/ma', translation: 'savol yuklamasi', translation_ru: 'вопросительная частица', translation_en: 'question particle', color: '#0891b2', active: true },
  { char: '谁', pinyin: 'shéi', href: '/chinese/hsk1/grammar/shei', translation: 'kim?', translation_ru: 'кто?', translation_en: 'who?', color: '#d97706', active: true },
  { char: '哪', pinyin: 'nǎ', href: '/chinese/hsk1/grammar/na', translation: 'qaysi?', translation_ru: 'который?', translation_en: 'which?', color: '#0284c7', active: true },
  { char: '的', pinyin: 'de', href: '/chinese/hsk1/grammar/de', translation: 'egalik belgisi', translation_ru: 'частица принадлежности', translation_en: 'possessive particle', color: '#be185d', active: true },
  { char: '呢', pinyin: 'ne', href: '/chinese/hsk1/grammar/ne', translation: '…chi?', translation_ru: '…а вы?', translation_en: '…and you?', color: '#7c3aed', active: true },
  { char: '几', pinyin: 'jǐ', href: '/chinese/hsk1/grammar/ji', translation: 'nechta?', translation_ru: 'сколько?', translation_en: 'how many?', color: '#059669', active: true },
  { char: '数字', pinyin: 'shùzì', href: '/chinese/hsk1/grammar/shuzi', translation: '1-99 sonlar', translation_ru: 'числа 1-99', translation_en: 'numbers 1-99', color: '#f59e0b', active: true },
  { char: '几岁 / 多大', pinyin: 'jǐ suì / duō dà', ghost: '几岁', href: '/chinese/hsk1/grammar/duoda', translation: 'necha yoshda?', translation_ru: 'сколько лет?', translation_en: 'how old?', color: '#0369a1', active: true },
  { char: '会', pinyin: 'huì', href: '/chinese/hsk1/grammar/hui', translation: 'qila olmoq', translation_ru: 'уметь', translation_en: 'can / be able to', color: '#dc2626', active: true },
  { char: '很', pinyin: 'hěn', href: '/chinese/hsk1/grammar/hen', translation: 'juda', translation_ru: 'очень', translation_en: 'very', color: '#b45309', active: true },
  { char: '怎么', pinyin: 'zěnme', href: '/chinese/hsk1/grammar/zenme', translation: 'qanday?', translation_ru: 'как?', translation_en: 'how?', color: '#0f766e', active: true },
  { char: '日期', pinyin: 'rìqī', href: '/chinese/hsk1/grammar/riqi', translation: 'sanalar', translation_ru: 'даты', translation_en: 'dates', color: '#7c3aed', active: true },
];

export function GrammarCatalog() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const { getStars: getGrammarStars } = useStars('grammar');
  const [grammarSearch, setGrammarSearch] = useState('');

  // Analytics: debounced search tracking (mirrors LanguagePage's grammarSearch effect)
  useEffect(() => {
    const q = grammarSearch.trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [grammarSearch]);

  if (isLoading) return <div className="loading-spinner" />;

  const gq = grammarSearch.trim().toLowerCase();
  const filteredGrammar = gq
    ? grammarItems.filter((item) =>
        item.char.includes(gq) ||
        item.pinyin.toLowerCase().includes(gq) ||
        item.translation.toLowerCase().includes(gq) ||
        item.translation_ru.toLowerCase().includes(gq) ||
        item.translation_en.toLowerCase().includes(gq)
      )
    : grammarItems;

  return (
    <main className="home">
      <CatalogHeader currentTab="grammar" hskLevel="1" />

      <section className="home__content">
        <div className="dialogues__search">
          <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dialogues__search-input"
            aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
            placeholder={({ uz: 'Grammatikani qidirish...', ru: 'Поиск грамматики...', en: 'Search grammar...' } as Record<string, string>)[language]}
            value={grammarSearch}
            onChange={(e) => setGrammarSearch(e.target.value)}
          />
        </div>
        <div className="home__lessons">
          {filteredGrammar.map((item) => (
            <Link key={item.char} href={item.active ? item.href : '#'} prefetch={false} className="grammar-card">
              <span className="grammar-card__bg">{('ghost' in item && item.ghost) || item.char}</span>
              <div className="grammar-card__top">
                <p className="grammar-card__title">{item.char} {item.pinyin}</p>
                {!item.active && <span className="grammar-card__badge">{({ uz: 'Tez kunda', ru: 'Скоро', en: 'Soon' } as Record<string, string>)[language]}</span>}
              </div>
              <p className="grammar-card__translation">{({ uz: item.translation, ru: item.translation_ru, en: item.translation_en } as Record<string, string>)[language]}</p>
              {(() => {
                // No star row until attempted; gold for earned count.
                const slug = item.href.split('/').pop()!;
                const stars = getGrammarStars(slug);
                if (stars == null) return null;
                return (
                  <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                    {[1, 2, 3].map(n => (
                      <span key={n} style={{ fontSize: 28, color: n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>
                        ★
                      </span>
                    ))}
                  </div>
                );
              })()}
            </Link>
          ))}
          {filteredGrammar.length === 0 && (
            <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
          )}
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
