'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
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
  const isHsk2L2 = setId.startsWith('hsk2-l2-');
  const isHsk2 = setId.startsWith('hsk2-') && !isHsk2L2;
  const isHsk3 = setId.startsWith('hsk3-');
  const isHsk4 = setId.startsWith('hsk4-');
  const isHsk5 = setId.startsWith('hsk5-');
  const backUrl = isHsk5 ? '/chinese?tab=writing&version=2.0&hsk=5' : isHsk4 ? '/chinese?tab=writing&version=2.0&hsk=4' : isHsk2L2 ? '/chinese?tab=writing&version=2.0&hsk=2' : isHsk3 ? '/chinese?tab=writing&version=2.0&hsk=3' : isHsk2 ? '/chinese?tab=writing&version=2.0' : '/chinese?tab=writing';

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
              onClick={() => router.push(backUrl)}
              aria-label="Orqaga"
            >
              ‹
            </button>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{isHsk5 ? 'HSK 5' : isHsk4 ? 'HSK 4' : isHsk3 ? 'HSK 3' : isHsk2L2 || isHsk2 ? 'HSK 2' : 'HSK 1'}</div>
            <h1 className="dr-hero__title">{({ uz: 'Ieroglif yozish', ru: 'Писать иероглифы', en: 'Writing Characters' } as Record<string, string>)[language] || 'Writing Characters'}</h1>
            <div className="dr-hero__pinyin">写字 · xiězì</div>
            <div className="dr-hero__translation">— {language === 'ru' ? title_ru : language === 'en' ? title_ru.replace('Набор', 'Set') : title} —</div>
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
            {({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[language]}
          </button>
          <button
            className={`lp__tab ${subtab === 'chars' ? 'lp__tab--active' : ''}`}
            onClick={() => setSubtab('chars')}
            type="button"
          >
            {({ uz: 'Ierogliflar', ru: 'Иероглифы', en: 'Characters' } as Record<string, string>)[language]}
          </button>
        </div>
      </nav>
      <section className="home__content">
        <HanziWriterPractice
          lang={language}
          words={words}
          onBack={() => router.push(backUrl)}
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
