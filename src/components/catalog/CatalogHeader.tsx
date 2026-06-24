'use client';
import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../../hooks/useLanguage';
import { BannerMenu } from '../BannerMenu';
import type { Tab } from './types';

// Grammar is reachable from the menu (BannerMenu "Sections"), not the tab bar.
const tabs: { id: Tab; label: string; label_ru?: string; label_en?: string }[] = [
  { id: 'dialogues', label: 'Dialog', label_ru: 'Диалог', label_en: 'Dialogues' },
  { id: 'writing', label: 'Yozish', label_ru: 'Письмо', label_en: 'Writing' },
  { id: 'flashcards', label: 'Fleshkarta', label_ru: 'Флешкарты', label_en: 'Flashcards' },
  { id: 'karaoke', label: 'KTV' },
];

/* Icons for the mobile bottom tab bar. Inactive tabs show only the icon; the
   active tab swaps the icon for its text label (see .lp__tab rules). */
const TAB_ICONS: Record<string, React.ReactNode> = {
  dialogues: <svg viewBox="0 0 32 32" width="24" height="24" style={{ width: 24, height: 24 }} fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16.003 0.6c-4.118 0-7.979 1.595-10.895 4.51-5.582 5.582-6.013 14.465-1.113 20.541l0.246 0.305-0.18 0.348c-0.674 1.3-1.531 2.253-2.574 2.77v0.002h-0.002c-0.434 0.213-0.67 0.672-0.598 1.148 0.073 0.484 0.43 0.843 0.918 0.922h0.002c0.379 0.060 0.785 0.092 1.205 0.092 1.084 0 3.143-0.215 5.203-1.58l0.297-0.197 0.316 0.166c2.2 1.163 4.67 1.775 7.174 1.775 4.118 0 7.978-1.601 10.887-4.51s4.51-6.77 4.51-10.887-1.601-7.98-4.51-10.889c-2.916-2.922-6.769-4.516-10.887-4.516zM16.003 1.633c3.835 0 7.444 1.498 10.154 4.209s4.207 6.318 4.207 10.152c0 3.828-1.496 7.443-4.207 10.154s-6.32 4.209-10.154 4.209c-2.564 0-5.075-0.682-7.271-1.973v-0.002h-0.002c-0.082-0.049-0.169-0.072-0.262-0.072-0.114 0-0.222 0.036-0.316 0.109h-0.002c-1.621 1.256-3.305 1.645-4.453 1.744l-1.789 0.154 1.338-1.199c0.81-0.726 1.513-1.746 2.088-3.059v-0.002c0.082-0.187 0.051-0.393-0.086-0.545l-0.004-0.004c-5.017-5.664-4.751-14.311 0.607-19.668 2.711-2.71 6.318-4.209 10.152-4.209zM9.378 10.928c-0.296 0-0.525 0.229-0.525 0.525s0.228 0.523 0.525 0.523h13.252c0.298 0 0.523-0.226 0.523-0.523s-0.227-0.525-0.523-0.525zM9.378 15.471c-0.298 0-0.525 0.227-0.525 0.523s0.224 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518s-0.23-0.523-0.523-0.523zM9.378 20.012c-0.296 0-0.525 0.229-0.525 0.525 0 0.286 0.229 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518 0-0.298-0.227-0.525-0.523-0.525z"/></svg>,
  writing: <svg viewBox="0 0 100 100" width="24" height="24" style={{ width: 24, height: 24 }} fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m88.387 4.2852c-1.9102-0.003906-3.8164 0.71484-5.2617 2.1641l-4.2617 4.2539-2.2305-2.2305c-1.9375-1.9375-4.4883-2.9141-7.043-2.9141-2.5547 0-5.1055 0.97266-7.0469 2.9141l-22.223 22.219c-0.26953 0.26953-0.42187 0.63281-0.42187 1.0156 0 0.37891 0.15234 0.74219 0.42187 1.0117 0.26953 0.26953 0.63281 0.42188 1.0117 0.42188 0.38281 0 0.74609-0.15234 1.0156-0.42188l22.219-22.234c2.6055-2.6055 6.6914-2.7734 9.4883-0.50391-0.41406 0.19922-0.80469 0.46875-1.1484 0.80859l-59.605 59.609c-0.14453 0.14844-0.25391 0.32422-0.32422 0.51562l-8.5117 22.875c-0.19531 0.52344-0.066406 1.1133 0.32812 1.5078s0.98438 0.52344 1.5078 0.32812l22.871-8.5117c0.19141-0.074219 0.36328-0.18359 0.50781-0.32812l59.617-59.613c1.6289-1.6289 1.6523-4.2891 0.082031-5.9531l4.2539-4.2539c2.6133-2.5898 2.5391-6.5625 0.45313-9.4688l-0.003907-0.003906c0.003907-0.38281-0.14844-0.75391-0.42188-1.0234v-0.003906-0.003906c-1.4492-1.4492-3.3633-2.1719-5.2734-2.1719zm0 2.8359c1.1719 0.003906 2.3438 0.45312 3.25 1.3594 1.793 1.8086 1.7852 4.6758-0.011719 6.4531l0.003906 0.003906h-0.011718l-4.2539 4.2539-6.4688-6.4688 4.2617-4.25h-0.003906v-0.003906-0.003906-0.003906c0.89844-0.89844 2.0664-1.3398 3.2383-1.3398zm-12.453 5.2695c0.35938 0 0.71875 0.14062 1 0.42578l10.336 10.336c0.56641 0.56641 0.56641 1.4375 0 2.0039l-58.594 58.594-12.34-12.336 58.598-58.598c0.28125-0.28125 0.64062-0.42578 1-0.42578zm-61.055 61.605 11.211 11.211-17.859 6.6367z"/></svg>,
  flashcards: <svg viewBox="0 0 100 100" width="28" height="28" style={{ width: 28, height: 28 }} fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m79.91 9h-41.82c-2.8086 0-5.0898 2.2812-5.0898 5.0898v2.9102h-12.91c-2.8086 0-5.0898 2.2812-5.0898 5.0898v63.82c0 2.8086 2.2812 5.0898 5.0898 5.0898h43.82c2.8086 0 5.0898-2.2812 5.0898-5.0898v-2.9102h10.91c2.8086 0 5.0898-2.2812 5.0898-5.0898v-63.82c0-2.8086-2.2812-5.0898-5.0898-5.0898zm-44.91 5.0898c0-1.6992 1.3906-3.0898 3.0898-3.0898h41.82c1.6992 0 3.0898 1.3906 3.0898 3.0898v40.91h-48zm-2 35.059-3.8984-3.8281c-1.3516-1.3281-2.1016-3.1016-2.1016-5 0-1.8906 0.75-3.6719 2.1094-5l0.23828-0.23828c1.0117-0.98828 2.2812-1.6484 3.6484-1.9219zm-12.91-30.148h12.91v12.121c-1.8984 0.30078-3.6719 1.1719-5.0586 2.5312l-0.24219 0.24609c-1.7383 1.7109-2.6992 3.9883-2.6992 6.4219 0 2.4297 0.96094 4.7188 2.6992 6.4219l5.3008 5.2109v13.047h-16v-42.91c0-1.6992 1.3906-3.0898 3.0898-3.0898zm46.91 66.91c0 1.6992-1.3906 3.0898-3.0898 3.0898h-43.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-18.91h16v6h-7c-0.55078 0-1 0.44922-1 1s0.44922 1 1 1h7v2.9102c0 2.8086 2.2812 5.0898 5.0898 5.0898h28.91zm12.91-4.9102h-41.82c-1.6992 0-3.0898-1.3906-3.0898-3.0898v-20.91h48v20.91c0 1.6992-1.3906 3.0898-3.0898 3.0898zm-4.9102-17c0 0.55078-0.44922 1-1 1h-30c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h30c0.55078 0 1 0.44922 1 1zm-8 8c0 0.55078-0.44922 1-1 1h-14c-0.55078 0-1-0.44922-1-1s0.44922-1 1-1h14c0.55078 0 1 0.44922 1 1zm-23.57-41.648 7.9102 5.4688-3.2891 9.8594c-0.12891 0.39062-0.011719 0.82031 0.30859 1.0781 0.32031 0.26172 0.76172 0.30859 1.1211 0.10938l9.5195-5.1562 9.5195 5.1719c0.15234 0.078126 0.32031 0.11719 0.48047 0.11719 0.23047 0 0.46094-0.078125 0.64062-0.23047 0.30859-0.26172 0.44141-0.69141 0.30859-1.0781l-3.2891-9.8594 7.9102-5.4688c0.32813-0.23047 0.48828-0.62891 0.41016-1.0195s-0.39062-0.69922-0.78125-0.78125l-9.8203-2-4.4883-8.9883c-0.33984-0.67969-1.4492-0.67969-1.7891 0l-4.4883 8.9883-9.8203 2c-0.39062 0.078125-0.69922 0.39062-0.78125 0.78125-0.070313 0.375 0.089843 0.77734 0.41797 1.0078zm11.059-1.9414c0.30078-0.058594 0.55859-0.26172 0.69922-0.53125l3.8125-7.6406 3.8086 7.6406c0.14062 0.28125 0.39062 0.46875 0.69922 0.53125l8 1.6289-6.6016 4.5703c-0.37109 0.25-0.51953 0.71875-0.37891 1.1406l2.7305 8.1719-7.7695-4.2188c-0.14844-0.078125-0.30859-0.12109-0.48047-0.12109-0.17187 0-0.32812 0.039063-0.48047 0.12109l-7.7695 4.2188 2.7305-8.1719c0.14062-0.42188-0.011719-0.89062-0.37891-1.1406l-6.6016-4.5703z"/></svg>,
  karaoke: <svg viewBox="0 0 24 24" width="26" height="26" style={{ width: 26, height: 26 }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18V5l12-2v13"/></svg>,
};

function hrefFor(id: Tab): string {
  return `/chinese/${id}`;
}

export function CatalogHeader({ currentTab, hskLevel = '1' }: { currentTab: Tab; hskLevel?: string }) {
  const [language] = useLanguage();
  return (
    <>
      {/* Banner */}
      <header className="home__hero home__hero--lang">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">中</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            {/* Mobile-only: the active tab's Chinese label, centered between
                logo and menu so the slim hero isn't empty. Desktop shows the
                full hero character in .dr-hero__body instead. */}
            <span className="lp__hero-mobile-title" aria-hidden="true">- {
              currentTab === 'dialogues' ? '对话' :
              currentTab === 'writing' ? '写字' :
              currentTab === 'flashcards' ? '词卡' :
              currentTab === 'karaoke' ? 'KTV' :
              currentTab === 'grammar' ? '语法' :
              '测验'
            } -</span>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <h1 className="sr-only">{({ uz: 'Xitoy tili — HSK 1 darslari, dialoglar va mashqlar', ru: 'Китайский язык — уроки HSK 1, диалоги и упражнения', en: 'Chinese — HSK 1 lessons, dialogues and exercises' } as Record<string, string>)[language]}</h1>
            <div className="dr-hero__level">HSK {hskLevel}</div>
            <div className="dr-hero__title" aria-hidden="true">{
              currentTab === 'dialogues' ? '对话' :
              currentTab === 'writing' ? '写字' :
              currentTab === 'flashcards' ? '词卡' :
              currentTab === 'karaoke' ? '歌曲' :
              currentTab === 'grammar' ? '语法' :
              '测验'
            }</div>
            <div className="dr-hero__pinyin">{
              currentTab === 'dialogues' ? 'duìhuà' :
              currentTab === 'writing' ? 'xiězì' :
              currentTab === 'flashcards' ? 'cíkǎ' :
              currentTab === 'karaoke' ? 'gēqǔ' :
              currentTab === 'grammar' ? 'yǔfǎ' :
              'cèyàn'
            }</div>
            <div className="dr-hero__translation">— {({
              uz: currentTab === 'dialogues' ? 'Dialoglar' : currentTab === 'writing' ? 'Yozish' : currentTab === 'flashcards' ? 'Fleshkartalar' : currentTab === 'karaoke' ? 'Qo\'shiqlar' : currentTab === 'grammar' ? 'Grammatika' : 'Testlar',
              ru: currentTab === 'dialogues' ? 'Диалоги' : currentTab === 'writing' ? 'Письмо' : currentTab === 'flashcards' ? 'Флешкарты' : currentTab === 'karaoke' ? 'Песни' : currentTab === 'grammar' ? 'Грамматика' : 'Тесты',
              en: currentTab === 'dialogues' ? 'Dialogues' : currentTab === 'writing' ? 'Writing' : currentTab === 'flashcards' ? 'Flashcards' : currentTab === 'karaoke' ? 'Songs' : currentTab === 'grammar' ? 'Grammar' : 'Tests',
            } as Record<string, string>)[language]} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
        <div className="lp__tabs-inner">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={hrefFor(tab.id)}
              className={`lp__tab ${currentTab === tab.id ? 'lp__tab--active' : ''}`}
              aria-current={currentTab === tab.id ? 'page' : undefined}
              aria-label={language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}
            >
              <span className="lp__tab-icon" aria-hidden="true">{TAB_ICONS[tab.id]}</span>
              <span className="lp__tab-label">{language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}</span>
            </Link>
          ))}
          {/* Mobile-only menu (the hero — which holds the desktop menu — is
              hidden on mobile). */}
          <div className="lp__tabs-menu">
            <BannerMenu />
          </div>
        </div>
      </nav>
    </>
  );
}
