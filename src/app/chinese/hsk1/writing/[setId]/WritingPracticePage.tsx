'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { HanziWriterPractice } from '@/components/HanziWriterPractice';
import type { HanziWord } from '@/services/writing';
import { trackAll } from '@/utils/analytics';

interface Props {
  setId: string;
  title: string;
  title_ru: string;
  words: HanziWord[];
}

export function WritingPracticePage({ setId, title, title_ru, words }: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const [subtab, setSubtab] = useState<'writing' | 'chars'>('writing');

  // Analytics: track writing practice view
  useEffect(() => {
    trackAll('ViewContent', 'writing_view', 'writing_view', {
      content_name: `Writing: ${title}`,
      content_category: 'Writing',
      content_type: 'product',
    });
  }, [title]);

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <main className="home">
      <header className="home__hero">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">中</span>
          <div className="home__hero-top-row">
            <button
              className="dr-back-btn"
              type="button"
              onClick={() => router.push('/chinese?tab=writing')}
              aria-label="Orqaga"
            >
              ‹
            </button>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1</div>
            <h1 className="dr-hero__title">书写</h1>
            <div className="dr-hero__pinyin">shūxiě</div>
            <div className="dr-hero__translation">— {language === 'ru' ? title_ru : title} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
        <div className="lp__tabs-inner">
          <button
            className={`lp__tab ${subtab === 'writing' ? 'lp__tab--active' : ''}`}
            onClick={() => setSubtab('writing')}
            type="button"
          >
            {language === 'ru' ? 'Письмо' : 'Yozish'}
          </button>
          <button
            className={`lp__tab ${subtab === 'chars' ? 'lp__tab--active' : ''}`}
            onClick={() => setSubtab('chars')}
            type="button"
          >
            {language === 'ru' ? 'Иероглифы' : 'Ierogliflar'}
          </button>
        </div>
      </nav>
      <section className="home__content">
        <HanziWriterPractice
          lang={language}
          words={words}
          onBack={() => router.push('/chinese?tab=writing')}
          autoStart
          hideSubtabs
          subtab={subtab}
          onSubtabChange={setSubtab}
        />
      </section>
      <PageFooter />
    </main>
  );
}
