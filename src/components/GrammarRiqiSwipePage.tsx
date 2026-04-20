'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { playGrammarAudio } from '@/utils/grammarAudio';

type Copy = { uz: string; ru: string; en: string };

type Card =
  | {
      kind: 'concept';
      eyebrow: Copy;
      title: Copy;
      accent: 'blue' | 'red' | 'violet' | 'amber';
      body: Copy;
      chips?: string[];
      audio?: { zh: string; pinyin: string };
    }
  | {
      kind: 'pattern';
      eyebrow: Copy;
      title: Copy;
      accent: 'blue' | 'red' | 'violet' | 'amber';
      formula: string | Copy;
      example: { zh: string; pinyin: string; tr: Copy };
      body: Copy;
    }
  | {
      kind: 'contrast';
      eyebrow: Copy;
      title: Copy;
      accent: 'blue' | 'red' | 'violet' | 'amber';
      wrong: string;
      right: string;
      body: Copy;
    }
  | {
      kind: 'quiz';
      eyebrow: Copy;
      title: Copy;
      accent: 'blue' | 'red' | 'violet' | 'amber';
      prompt: Copy;
      options: string[];
      correct: number;
      explain: Copy;
    }
  | {
      kind: 'recap';
      eyebrow: Copy;
      title: Copy;
      accent: 'blue' | 'red' | 'violet' | 'amber';
      bullets: Copy[];
    };

const cards: Card[] = [
  {
    kind: 'concept',
    eyebrow: { uz: '01 · Belgi', ru: '01 · Сигнал', en: '01 · Signal' },
    title: { uz: '月', ru: '月', en: '月' },
    accent: 'blue',
    body: {
      uz: '`月` oy uchun ishlatiladi. Xitoychada oy son bilan keladi: `九月` = sentyabr.',
      ru: '`月` используется для месяца. В китайском месяц идёт как число: `九月` = сентябрь.',
      en: '`月` marks the month. In Chinese, the month is expressed as a number: `九月` = September.',
    },
    chips: ['一月', '三月', '九月'],
    audio: { zh: '九月', pinyin: 'Jiǔ yuè' },
  },
  {
    kind: 'concept',
    eyebrow: { uz: '02 · Belgi', ru: '02 · Сигнал', en: '02 · Signal' },
    title: { uz: '号', ru: '号', en: '号' },
    accent: 'red',
    body: {
      uz: '`号` sana kuni uchun ishlatiladi: `二号` = 2-kun.',
      ru: '`号` используется для числа месяца: `二号` = второе число.',
      en: '`号` marks the day number in a date: `二号` = the 2nd.',
    },
    chips: ['一号', '八号', '十五号'],
    audio: { zh: '二号', pinyin: 'Èr hào' },
  },
  {
    kind: 'pattern',
    eyebrow: { uz: '03 · Tartib', ru: '03 · Порядок', en: '03 · Order' },
    title: { uz: 'Xitoycha sana tartibi', ru: 'Порядок даты в китайском', en: 'Chinese date order' },
    accent: 'violet',
    formula: { uz: 'oy → kun', ru: 'месяц → число', en: 'month → day' },
    example: {
      zh: '九月二号',
      pinyin: 'Jiǔ yuè èr hào',
      tr: {
        uz: '2-sentyabr',
        ru: '2 сентября',
        en: 'September 2nd',
      },
    },
    body: {
      uz: "Katta birlik oldin, kichigi keyin: avval oy, keyin kun.",
      ru: 'Сначала более крупная единица, потом меньшая: сперва месяц, потом число.',
      en: 'Bigger unit first, smaller unit second: month first, then day.',
    },
  },
  {
    kind: 'pattern',
    eyebrow: { uz: '04 · Savol', ru: '04 · Вопрос', en: '04 · Ask' },
    title: { uz: 'Sanani qanday so‘rash', ru: 'Как спросить дату', en: 'How to ask the date' },
    accent: 'blue',
    formula: '今天 + 几月几号？',
    example: {
      zh: '今天几月几号？',
      pinyin: 'Jīntiān jǐ yuè jǐ hào?',
      tr: {
        uz: 'Bugun nechanchi oy nechanchi kun?',
        ru: 'Какое сегодня число?',
        en: 'What is today’s date?',
      },
    },
    body: {
      uz: '`几月几号` = qaysi oy, qaysi kun.',
      ru: '`几月几号` = какой месяц, какое число.',
      en: '`几月几号` means which month, which day number.',
    },
  },
  {
    kind: 'pattern',
    eyebrow: { uz: '05 · Javob', ru: '05 · Ответ', en: '05 · Answer' },
    title: { uz: 'Qanday javob berish', ru: 'Как ответить', en: 'How to answer' },
    accent: 'red',
    formula: {
      uz: '今天 + oy + kun。',
      ru: '今天 + месяц + число。',
      en: '今天 + month + day。',
    },
    example: {
      zh: '今天九月二号。',
      pinyin: 'Jīntiān jiǔ yuè èr hào.',
      tr: {
        uz: 'Bugun 2-sentyabr.',
        ru: 'Сегодня 2 сентября.',
        en: 'Today is September 2nd.',
      },
    },
    body: {
      uz: "Savolda `几月几号`, javobda haqiqiy sana keladi.",
      ru: 'В вопросе `几月几号`, в ответе — настоящая дата.',
      en: 'The question uses `几月几号`; the answer uses the actual date.',
    },
  },
  {
    kind: 'contrast',
    eyebrow: { uz: '06 · Xato', ru: '06 · Ошибка', en: '06 · Mistake' },
    title: { uz: 'Tartibni teskarisiga aylantirmang', ru: 'Не переворачивайте порядок', en: 'Do not reverse it' },
    accent: 'amber',
    wrong: '二号九月',
    right: '九月二号',
    body: {
      uz: "Sana inglizchadagi kabi emas. `day → month` emas, `month → day`.",
      ru: 'Порядок не как в английском. Не `число → месяц`, а `месяц → число`.',
      en: 'Do not use English-style order. Not `day → month`, but `month → day`.',
    },
  },
  {
    kind: 'pattern',
    eyebrow: { uz: '07 · Hafta kuni', ru: '07 · День недели', en: '07 · Weekday' },
    title: { uz: 'Hafta kunini so‘rang', ru: 'Спросите день недели', en: 'Ask the weekday' },
    accent: 'violet',
    formula: '今天星期几？',
    example: {
      zh: '今天星期几？',
      pinyin: 'Jīntiān xīngqī jǐ?',
      tr: {
        uz: 'Bugun haftaning qaysi kuni?',
        ru: 'Какой сегодня день недели?',
        en: 'What day of the week is it today?',
      },
    },
    body: {
      uz: '`星期几` butun qolip sifatida o‘rganiladi.',
      ru: '`星期几` лучше учить как цельную модель.',
      en: '`星期几` is best learned as one fixed frame.',
    },
  },
  {
    kind: 'pattern',
    eyebrow: { uz: '08 · Javob', ru: '08 · Ответ', en: '08 · Answer' },
    title: { uz: 'Hafta kuniga javob', ru: 'Ответ на день недели', en: 'Answer the weekday' },
    accent: 'blue',
    formula: '今天星期四。',
    example: {
      zh: '今天星期四。',
      pinyin: 'Jīntiān xīngqī sì.',
      tr: {
        uz: 'Bugun payshanba.',
        ru: 'Сегодня четверг.',
        en: 'Today is Thursday.',
      },
    },
    body: {
      uz: 'Xitoychada hafta kunlari odatda `星期 + son` bilan ketadi.',
      ru: 'В китайском дни недели обычно строятся как `星期 + число`.',
      en: 'In Chinese, weekdays are usually built as `星期 + number`.',
    },
  },
  {
    kind: 'quiz',
    eyebrow: { uz: '09 · Tekshiruv', ru: '09 · Проверка', en: '09 · Check' },
    title: { uz: 'Tez tekshiruv', ru: 'Быстрая проверка', en: 'Quick check' },
    accent: 'amber',
    prompt: {
      uz: '“15-iyun” qaysi variant?',
      ru: 'Какой вариант означает «15 июня»?',
      en: 'Which option means “June 15th”?',
    },
    options: ['十五号六月', '六月十五号', '星期六月十五'],
    correct: 1,
    explain: {
      uz: 'To‘g‘ri tartib: oy → kun.',
      ru: 'Правильный порядок: месяц → число.',
      en: 'Correct order: month → day.',
    },
  },
  {
    kind: 'recap',
    eyebrow: { uz: '10 · Xulosa', ru: '10 · Итог', en: '10 · Recap' },
    title: { uz: 'Uchta asosiy fikr', ru: 'Три главные идеи', en: 'You only need three ideas' },
    accent: 'red',
    bullets: [
      {
        uz: '`月` = oy, `号` = sana kuni, `星期` = hafta kuni',
        ru: '`月` = месяц, `号` = число, `星期` = день недели',
        en: '`月` = month, `号` = day number, `星期` = weekday',
      },
      {
        uz: 'sana tartibi: `oy → kun`',
        ru: 'порядок даты: `месяц → число`',
        en: 'date order: `month → day`',
      },
      {
        uz: 'savollar: `今天几月几号？` va `今天星期几？`',
        ru: 'вопросы: `今天几月几号？` и `今天星期几？`',
        en: 'core questions: `今天几月几号？` and `今天星期几？`',
      },
    ],
  },
];

const accentClass: Record<Card['accent'], string> = {
  blue: 'riqi-swipe-card--blue',
  red: 'riqi-swipe-card--red',
  violet: 'riqi-swipe-card--violet',
  amber: 'riqi-swipe-card--amber',
};

export function GrammarRiqiSwipePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const touchStartX = useRef<number | null>(null);

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;
  const t = (copy: Copy) => copy[language] ?? copy.uz;

  const next = () => setIndex((value) => Math.min(cards.length - 1, value + 1));
  const prev = () => setIndex((value) => Math.max(0, value - 1));

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const endX = event.changedTouches[0]?.clientX ?? null;
    if (touchStartX.current == null || endX == null) return;
    const delta = endX - touchStartX.current;
    if (delta < -40) next();
    if (delta > 40) prev();
    touchStartX.current = null;
  };

  const quizAnswer = card.kind === 'quiz' ? quizAnswers[index] : undefined;

  return (
    <div className="grammar-page riqi-swipe">
      <div className="riqi-swipe__shell">
        <div className="riqi-swipe__topbar">
          <Link href="/chinese/hsk1/grammar/riqi" className="dr-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="riqi-swipe__meta">
            <div className="riqi-swipe__meta-title">
              {language === 'ru' ? 'Riqi swipe lesson' : language === 'en' ? 'Riqi swipe lesson' : 'Riqi swipe dars'}
            </div>
            <div className="riqi-swipe__meta-sub">
              {index + 1} / {cards.length}
            </div>
          </div>
          <BannerMenu />
        </div>

        <div className="riqi-swipe__progress">
          <div className="riqi-swipe__progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="riqi-swipe__viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <article className={`riqi-swipe-card ${accentClass[card.accent]}`}>
            <div className="riqi-swipe-card__eyebrow">{t(card.eyebrow)}</div>
            <h1 className="riqi-swipe-card__title">{t(card.title)}</h1>

            {card.kind === 'concept' ? (
              <>
                <p className="riqi-swipe-card__body">{card.body[language]}</p>
                {card.chips ? (
                  <div className="riqi-swipe-card__chips">
                    {card.chips.map((chip) => <span key={chip}>{chip}</span>)}
                  </div>
                ) : null}
                {card.audio ? (
                  <button type="button" className="riqi-swipe-card__audio" onClick={() => playGrammarAudio(card.audio!.zh)}>
                    {card.audio.zh} · {card.audio.pinyin}
                  </button>
                ) : null}
              </>
            ) : null}

            {card.kind === 'pattern' ? (
              <>
                <div className="riqi-swipe-card__formula">{typeof card.formula === 'string' ? card.formula : t(card.formula)}</div>
                <button type="button" className="riqi-swipe-card__example" onClick={() => playGrammarAudio(card.example.zh)}>
                  <span className="riqi-swipe-card__example-zh">{card.example.zh}</span>
                  <span className="riqi-swipe-card__example-py">{card.example.pinyin}</span>
                  <span className="riqi-swipe-card__example-tr">{card.example.tr[language]}</span>
                </button>
                <p className="riqi-swipe-card__body">{card.body[language]}</p>
              </>
            ) : null}

            {card.kind === 'contrast' ? (
              <>
                <div className="riqi-swipe-card__contrast">
                  <div className="riqi-swipe-card__contrast-box riqi-swipe-card__contrast-box--bad">
                    <strong>{language === 'ru' ? 'Неверно' : language === 'en' ? 'Wrong' : "Noto'g'ri"}</strong>
                    <span>{card.wrong}</span>
                  </div>
                  <div className="riqi-swipe-card__contrast-box riqi-swipe-card__contrast-box--good">
                    <strong>{language === 'ru' ? 'Верно' : language === 'en' ? 'Right' : "To'g'ri"}</strong>
                    <span>{card.right}</span>
                  </div>
                </div>
                <p className="riqi-swipe-card__body">{card.body[language]}</p>
              </>
            ) : null}

            {card.kind === 'quiz' ? (
              <>
                <div className="riqi-swipe-card__prompt">{card.prompt[language]}</div>
                <div className="riqi-swipe-card__options">
                  {card.options.map((option, optionIndex) => {
                    const selected = quizAnswer === optionIndex;
                    const className = [
                      'riqi-swipe-card__option',
                      selected ? 'riqi-swipe-card__option--selected' : '',
                      quizAnswer !== undefined && optionIndex === card.correct ? 'riqi-swipe-card__option--correct' : '',
                      quizAnswer !== undefined && selected && optionIndex !== card.correct ? 'riqi-swipe-card__option--wrong' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <button
                        key={option}
                        type="button"
                        className={className}
                        onClick={() => setQuizAnswers((state) => ({ ...state, [index]: optionIndex }))}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {quizAnswer !== undefined ? (
                  <div className="riqi-swipe-card__feedback">{card.explain[language]}</div>
                ) : null}
              </>
            ) : null}

            {card.kind === 'recap' ? (
              <div className="riqi-swipe-card__recap">
                {card.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="riqi-swipe-card__recap-item">
                    {bullet[language]}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        </div>

        <div className="riqi-swipe__controls">
          <button type="button" className="riqi-swipe__nav riqi-swipe__nav--ghost" onClick={prev} disabled={index === 0}>
            {language === 'ru' ? 'Назад' : language === 'en' ? 'Back' : 'Orqaga'}
          </button>
          <button type="button" className="riqi-swipe__nav riqi-swipe__nav--solid" onClick={next} disabled={index === cards.length - 1}>
            {language === 'ru' ? 'Дальше' : language === 'en' ? 'Next' : 'Keyingi'}
          </button>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
