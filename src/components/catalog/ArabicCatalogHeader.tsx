'use client';
import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../../hooks/useLanguage';
import { BannerMenu } from '../BannerMenu';

type ArTab = 'dialogues' | 'flashcards';

// Mirrors the Chinese CatalogHeader so the Arabic catalogs share the same
// slim-hero + icon-tab-bar chrome. Bare (unvowelized) Arabic in the hero
// title; the transliteration line carries the pronunciation (same shape as
// Chinese hanzi + pinyin).
const TAB_ICONS: Record<ArTab, React.ReactNode> = {
  dialogues: <svg viewBox="0 0 32 32" width="26" height="26" style={{ width: 26, height: 26 }} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16.003 0.6c-4.118 0-7.979 1.595-10.895 4.51-5.582 5.582-6.013 14.465-1.113 20.541l0.246 0.305-0.18 0.348c-0.674 1.3-1.531 2.253-2.574 2.77v0.002h-0.002c-0.434 0.213-0.67 0.672-0.598 1.148 0.073 0.484 0.43 0.843 0.918 0.922h0.002c0.379 0.060 0.785 0.092 1.205 0.092 1.084 0 3.143-0.215 5.203-1.58l0.297-0.197 0.316 0.166c2.2 1.163 4.67 1.775 7.174 1.775 4.118 0 7.978-1.601 10.887-4.51s4.51-6.77 4.51-10.887-1.601-7.98-4.51-10.889c-2.916-2.922-6.769-4.516-10.887-4.516zM16.003 1.633c3.835 0 7.444 1.498 10.154 4.209s4.207 6.318 4.207 10.152c0 3.828-1.496 7.443-4.207 10.154s-6.32 4.209-10.154 4.209c-2.564 0-5.075-0.682-7.271-1.973v-0.002h-0.002c-0.082-0.049-0.169-0.072-0.262-0.072-0.114 0-0.222 0.036-0.316 0.109h-0.002c-1.621 1.256-3.305 1.645-4.453 1.744l-1.789 0.154 1.338-1.199c0.81-0.726 1.513-1.746 2.088-3.059v-0.002c0.082-0.187 0.051-0.393-0.086-0.545l-0.004-0.004c-5.017-5.664-4.751-14.311 0.607-19.668 2.711-2.71 6.318-4.209 10.152-4.209zM9.378 10.928c-0.296 0-0.525 0.229-0.525 0.525s0.228 0.523 0.525 0.523h13.252c0.298 0 0.523-0.226 0.523-0.523s-0.227-0.525-0.523-0.525zM9.378 15.471c-0.298 0-0.525 0.227-0.525 0.523s0.224 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518s-0.23-0.523-0.523-0.523zM9.378 20.012c-0.296 0-0.525 0.229-0.525 0.525 0 0.286 0.229 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518 0-0.298-0.227-0.525-0.523-0.525z"/></svg>,
  flashcards: <svg viewBox="0 0 100 100" width="28" height="28" style={{ width: 28, height: 28 }} fill="currentColor" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m79.91 9h-41.82c-2.8086 0-5.0898 2.2812-5.0898 5.0898v2.9102h-12.91c-2.8086 0-5.0898 2.2812-5.0898 5.0898v63.82c0 2.8086 2.2812 5.0898 5.0898 5.0898h43.82c2.8086 0 5.0898-2.2812 5.0898-5.0898v-2.9102h10.91c2.8086 0 5.0898-2.2812 5.0898-5.0898v-63.82c0-2.8086-2.2812-5.0898-5.0898-5.0898zm-44.91 5.0898c0-1.6992 1.3906-3.0898 3.0898-3.0898h41.82c1.6992 0 3.0898 1.3906 3.0898 3.0898v40.91h-48zm-2 35.059-3.8984-3.8281c-1.3516-1.3281-2.1016-3.1016-2.1016-5 0-1.8906 0.75-3.6719 2.1094-5l0.23828-0.23828c1.0117-0.98828 2.2812-1.6484 3.6484-1.9219zm-12.91-30.148h12.91v12.121c-1.8984 0.30078-3.6719 1.1719-5.0586 2.5312l-0.24219 0.24609c-1.7383 1.7109-2.6992 3.9883-2.6992 6.4219 0 2.4297 0.96094 4.7188 2.6992 6.4219l5.3008 5.2109v13.047h-16v-42.91c0-1.6992 1.3906-3.0898 3.0898-3.0898zm46.91 66.91c0 1.6992-1.3906 3.0898-3.0898 3.0898h-43.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-18.91h16v6h-7c-0.55078 0-1 0.44922-1 1s0.44922 1 1 1h7v2.9102c0 2.8086 2.2812 5.0898 5.0898 5.0898h28.91zm12.91-4.9102h-41.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-20.91h48v20.91c0 1.6992-1.3906 3.0898-3.0898 3.0898zm-4.9102-17c0 0.55078-0.44922 1-1 1h-30c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h30c0.55078 0 1 0.44922 1 1zm-8 8c0 0.55078-0.44922 1-1 1h-14c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h14c0.55078 0 1 0.44922 1 1zm-23.57-41.648 7.9102 5.4688-3.2891 9.8594c-0.12891 0.39062-0.011719 0.82031 0.30859 1.0781 0.32031 0.26172 0.76172 0.30859 1.1211 0.10938l9.5195-5.1562 9.5195 5.1719c0.15234 0.078126 0.32031 0.11719 0.48047 0.11719 0.23047 0 0.46094-0.078125 0.64062-0.23047 0.30859-0.26172 0.44141-0.69141 0.30859-1.0781l-3.2891-9.8594 7.9102-5.4688c0.32813-0.23047 0.48828-0.62891 0.41016-1.0195s-0.39062-0.69922-0.78125-0.78125l-9.8203-2-4.4883-8.9883c-0.33984-0.67969-1.4492-0.67969-1.7891 0l-4.4883 8.9883-9.8203 2c-0.39062 0.078125-0.69922 0.39062-0.78125 0.78125-0.070313 0.375 0.089843 0.77734 0.41797 1.0078zm11.059-1.9414c0.30078-0.058594 0.55859-0.26172 0.69922-0.53125l3.8125-7.6406 3.8086 7.6406c0.14062 0.28125 0.39062 0.46875 0.69922 0.53125l8 1.6289-6.6016 4.5703c-0.37109 0.25-0.51953 0.71875-0.37891 1.1406l2.7305 8.1719-7.7695-4.2188c-0.14844-0.078125-0.30859-0.12109-0.48047-0.12109-0.17187 0-0.32812 0.039063-0.48047 0.12109l-7.7695 4.2188 2.7305-8.1719c0.14062-0.42188-0.011719-0.89062-0.37891-1.1406l-6.6016-4.5703z"/></svg>,
};

const TAB_META: Record<ArTab, { href: string; ar: string; translit: string; uz: string; ru: string; en: string }> = {
  dialogues: { href: '/arabic/dialogues', ar: 'حوار', translit: 'ḥiwār', uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' },
  flashcards: { href: '/arabic/flashcards', ar: 'بطاقات', translit: 'biṭāqāt', uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' },
};

const TAB_LABELS: Record<ArTab, { uz: string; ru: string; en: string }> = {
  dialogues: { uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  flashcards: { uz: 'Fleshkarta', ru: 'Флешкарты', en: 'Flashcards' },
};

const ORDER: ArTab[] = ['dialogues', 'flashcards'];

export function ArabicCatalogHeader({ currentTab }: { currentTab: ArTab }) {
  const [language] = useLanguage();
  const meta = TAB_META[currentTab];
  const langLabel = ({ uz: 'Arab tili', ru: 'Арабский', en: 'Arabic' } as Record<string, string>)[language];
  return (
    <>
      <header className="home__hero home__hero--lang">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true" dir="rtl">ع</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <span className="lp__hero-mobile-title" aria-hidden="true" dir="rtl">- {meta.ar} -</span>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <h1 className="sr-only">{({ uz: 'Arab tili — dialoglar, fleshkartalar va mashqlar', ru: 'Арабский язык — диалоги, флешкарты и упражнения', en: 'Arabic — dialogues, flashcards and exercises' } as Record<string, string>)[language]}</h1>
            <div className="dr-hero__level">{langLabel}</div>
            <div className="dr-hero__title" aria-hidden="true" dir="rtl">{meta.ar}</div>
            <div className="dr-hero__pinyin" dir="ltr">{meta.translit}</div>
            <div className="dr-hero__translation">— {({ uz: meta.uz, ru: meta.ru, en: meta.en } as Record<string, string>)[language]} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
        <div className="lp__tabs-inner">
          {ORDER.map((id) => {
            const label = (TAB_LABELS[id] as Record<string, string>)[language];
            return (
              <Link
                key={id}
                href={TAB_META[id].href}
                className={`lp__tab ${currentTab === id ? 'lp__tab--active' : ''}`}
                aria-current={currentTab === id ? 'page' : undefined}
                aria-label={label}
                prefetch={false}
              >
                <span className="lp__tab-icon" aria-hidden="true">{TAB_ICONS[id]}</span>
                <span className="lp__tab-label">{label}</span>
              </Link>
            );
          })}
          <div className="lp__tabs-menu">
            <BannerMenu />
          </div>
        </div>
      </nav>
    </>
  );
}
