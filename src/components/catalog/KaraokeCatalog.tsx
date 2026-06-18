'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';

const karaokeItems = [
  { title: '月亮代表我的心', pinyin: 'Yuèliàng dàibiǎo wǒ de xīn', translation: 'Oy yuragimni ifodalaydi', translation_ru: 'Луна выражает моё сердце', translation_en: 'The Moon Represents My Heart', href: '/chinese/karaoke/yueliang' },
  { title: '朋友', pinyin: 'Péngyou', translation: 'Do\'st', translation_ru: 'Друг', translation_en: 'Friend', href: '/chinese/karaoke/pengyou' },
  { title: '童话', pinyin: 'Tónghuà', translation: 'Ertak', translation_ru: 'Сказка', translation_en: 'Fairy Tale', href: '/chinese/karaoke/tonghua' },
  { title: '后来', pinyin: 'Hòulái', translation: 'Keyinroq', translation_ru: 'Потом', translation_en: 'Later', href: '/chinese/karaoke/houlai' },
  { title: '老鼠爱大米', pinyin: 'Lǎoshǔ Ài Dàmǐ', translation: 'Sichqon guruchni sevadi', translation_ru: 'Мышка любит рис', translation_en: 'Mouse Loves Rice', href: '/chinese/karaoke/laoshuaidami' },
  { title: '小苹果', pinyin: 'Xiǎo Píngguǒ', translation: 'Kichkina olma', translation_ru: 'Маленькое яблочко', translation_en: 'Little Apple', href: '/chinese/karaoke/xiaopinguo' },
  { title: '世界这么大还是遇见你', pinyin: 'Shìjiè Zhème Dà Háishi Yùjiàn Nǐ', translation: 'Dunyo shuncha katta, baribir senga duch keldim', translation_ru: 'Мир так велик, но я встретил тебя', translation_en: 'The World Is So Big, Yet I Met You', href: '/chinese/karaoke/shijiezhemeda' },
  { title: '我的歌声里', pinyin: 'Wǒ De Gēshēng Lǐ', translation: "Mening qo'shig'imda", translation_ru: 'В моей песне', translation_en: 'In My Song', href: '/chinese/karaoke/wodeshengli' },
];

export function KaraokeCatalog() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [karaokeSearch, setKaraokeSearch] = useState('');

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <main className="home">
      <CatalogHeader currentTab="karaoke" hskLevel="1" />

      <section className="home__content">
        <div className="dialogues__search">
          <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dialogues__search-input"
            aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
            placeholder={({ uz: 'Qo\'shiqlarni qidirish...', ru: 'Поиск песен...', en: 'Search songs...' } as Record<string, string>)[language]}
            value={karaokeSearch}
            onChange={(e) => setKaraokeSearch(e.target.value)}
          />
          {karaokeSearch && (
            <button className="dialogues__search-clear" onClick={() => setKaraokeSearch('')} aria-label="Clear">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="lp__list">
          {karaokeItems.filter((k) => {
            const q = karaokeSearch.trim().toLowerCase();
            if (!q) return true;
            return k.title.toLowerCase().includes(q) || k.pinyin.toLowerCase().includes(q) || k.translation.toLowerCase().includes(q) || k.translation_ru.toLowerCase().includes(q) || k.translation_en.toLowerCase().includes(q);
          }).map((k) => (
            <Link key={k.href} href={k.href} prefetch={false} className="lp__card">
              <div className="lp__card-deco" aria-hidden="true">{k.title.slice(0, 3)}</div>
              <div className="lp__card-main">
                <div className="lp__card-title">{k.title}</div>
                <div className="lp__card-pinyin">{k.pinyin}</div>
                <div className="lp__card-sub">{({ uz: k.translation, ru: k.translation_ru, en: k.translation_en } as Record<string, string>)[language]}</div>
              </div>
              <div className="lp__card-arrow">›</div>
            </Link>
          ))}
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
