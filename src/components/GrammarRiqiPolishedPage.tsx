'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { playGrammarAudio } from '@/utils/grammarAudio';

type Copy = { uz: string; ru: string; en: string };

type LessonCard =
  | {
      kind: 'rule' | 'example' | 'contrast' | 'practice' | 'recap';
      id: string;
      step: string;
      kicker: Copy;
      title: Copy;
      body?: Copy;
      formula?: string | Copy;
      sentence?: { zh: string; pinyin: string; tr: Copy };
      wrong?: string;
      right?: string;
      note?: Copy;
      prompt?: Copy;
      options?: string[];
      correct?: number;
      bullets?: Copy[];
    };

const cards: LessonCard[] = [
  {
    kind: 'rule',
    id: 'signals',
    step: '01',
    kicker: { uz: 'Belgilar', ru: 'Сигналы', en: 'Signals' },
    title: { uz: '月 + 号 + 星期', ru: '月 + 号 + 星期', en: '月 + 号 + 星期' },
    body: {
      uz: "Sana uchun uchta belgi yetadi: `月` oy, `号` sana kuni, `星期` hafta kuni.",
      ru: 'Для этой темы достаточно трёх сигналов: `月` месяц, `号` число, `星期` день недели.',
      en: 'You only need three signals here: `月` for month, `号` for date number, and `星期` for weekday.',
    },
    formula: {
      uz: '月 = oy · 号 = sana kuni · 星期 = hafta kuni',
      ru: '月 = месяц · 号 = число · 星期 = день недели',
      en: '月 = month · 号 = day number · 星期 = weekday',
    },
  },
  {
    kind: 'rule',
    id: 'order',
    step: '02',
    kicker: { uz: 'Tartib', ru: 'Порядок', en: 'Order' },
    title: {
      uz: 'Xitoycha sana katta → kichik',
      ru: 'Китайская дата идёт от большего к меньшему',
      en: 'Chinese dates move big → small',
    },
    body: {
      uz: "Tartib oddiy: avval oy, keyin kun. Xitoycha sana odatda `oy → kun`.",
      ru: 'Порядок простой: сначала месяц, потом число. В китайском обычно `месяц → число`.',
      en: 'The order is simple: month first, then day. Chinese dates usually use `month → day`.',
    },
    formula: '九月二号',
    note: {
      uz: '2-sentyabr',
      ru: '2 сентября',
      en: 'September 2nd',
    },
  },
  {
    kind: 'example',
    id: 'ask-date',
    step: '03',
    kicker: { uz: "Savol", ru: 'Вопрос', en: 'Ask' },
    title: {
      uz: 'Sanani so‘rang',
      ru: 'Как спросить дату',
      en: 'Ask for the date',
    },
    sentence: {
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
      en: '`几月几号` means which month and which day number.',
    },
  },
  {
    kind: 'example',
    id: 'answer-date',
    step: '04',
    kicker: { uz: 'Javob', ru: 'Ответ', en: 'Answer' },
    title: {
      uz: 'Haqiqiy sana bilan javob bering',
      ru: 'Ответьте настоящей датой',
      en: 'Answer with the real date',
    },
    sentence: {
      zh: '今天九月二号。',
      pinyin: 'Jīntiān jiǔ yuè èr hào.',
      tr: {
        uz: 'Bugun 2-sentyabr.',
        ru: 'Сегодня 2 сентября.',
        en: 'Today is September 2nd.',
      },
    },
    body: {
      uz: "Savolda `几月几号`, javobda esa haqiqiy sana keladi.",
      ru: 'В вопросе `几月几号`, в ответе — настоящая дата.',
      en: 'The question uses `几月几号`; the answer uses the actual date.',
    },
  },
  {
    kind: 'contrast',
    id: 'mistake',
    step: '05',
    kicker: { uz: 'Xato', ru: 'Ошибка', en: 'Common Mistake' },
    title: {
      uz: 'Tartibni teskarisiga aylantirmang',
      ru: 'Не переворачивайте порядок',
      en: 'Do not reverse the order',
    },
    wrong: '二号九月',
    right: '九月二号',
    body: {
      uz: "Inglizcha yoki ruscha tartibni ko‘chirmang. Bu yerda `kun → oy` emas.",
      ru: 'Не переносите русский или английский порядок. Здесь не `число → месяц`.',
      en: 'Do not copy English or Russian order. This is not `day → month`.',
    },
  },
  {
    kind: 'example',
    id: 'weekday',
    step: '06',
    kicker: { uz: 'Hafta kuni', ru: 'День недели', en: 'Weekday' },
    title: {
      uz: 'Hafta kunini alohida so‘rang',
      ru: 'Спрашивайте день недели отдельно',
      en: 'Ask the weekday separately',
    },
    sentence: {
      zh: '今天星期几？',
      pinyin: 'Jīntiān xīngqī jǐ?',
      tr: {
        uz: 'Bugun haftaning qaysi kuni?',
        ru: 'Какой сегодня день недели?',
        en: 'What day of the week is it today?',
      },
    },
    body: {
      uz: '`星期几` tayyor qolip. Uni butun blok sifatida yodlang.',
      ru: '`星期几` — готовая модель. Лучше учить её как целый блок.',
      en: '`星期几` is a fixed frame. Learn it as one chunk.',
    },
  },
  {
    kind: 'practice',
    id: 'check',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: {
      uz: 'Bitta tez tekshiruv',
      ru: 'Одна быстрая проверка',
      en: 'One fast check',
    },
    prompt: {
      uz: '“15-iyun” qaysi variant?',
      ru: 'Какой вариант означает «15 июня»?',
      en: 'Which option means “June 15th”?',
    },
    options: ['十五号六月', '六月十五号', '星期六月十五'],
    correct: 1,
    note: {
      uz: 'To‘g‘ri tartib: oy → kun',
      ru: 'Правильный порядок: месяц → число',
      en: 'Correct order: month → day',
    },
  },
  {
    kind: 'recap',
    id: 'recap',
    step: '08',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: {
      uz: 'Sizga uchta fikr kifoya',
      ru: 'Вам нужны только три идеи',
      en: 'You only need three ideas',
    },
    bullets: [
      {
        uz: '`月` = oy, `号` = kun, `星期` = hafta kuni',
        ru: '`月` = месяц, `号` = число, `星期` = день недели',
        en: '`月` = month, `号` = day number, `星期` = weekday',
      },
      {
        uz: 'sana tartibi: `oy → kun`',
        ru: 'порядок даты: `месяц → число`',
        en: 'date order: `month → day`',
      },
      {
        uz: 'asosiy savollar: `今天几月几号？` va `今天星期几？`',
        ru: 'главные вопросы: `今天几月几号？` и `今天星期几？`',
        en: 'core questions: `今天几月几号？` and `今天星期几？`',
      },
    ],
  },
];

const cardThemeClass: Record<LessonCard['kind'], string> = {
  rule: 'riqi-polished-card--rule',
  example: 'riqi-polished-card--example',
  contrast: 'riqi-polished-card--contrast',
  practice: 'riqi-polished-card--practice',
  recap: 'riqi-polished-card--recap',
};

export function GrammarRiqiPolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [index, setIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;
  const t = (copy: Copy) => copy[language] ?? copy.uz;
  const setCard = (nextIndex: number) => {
    setIndex(nextIndex);
    setQuizAnswer(null);
  };

  return (
    <div className="grammar-page riqi-polished">
      <div className="riqi-polished__hero">
        <div className="riqi-polished__hero-top">
          <Link href="/chinese/hsk1/grammar/riqi" className="dr-back-btn riqi-polished__back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
            <div className="riqi-polished__hero-meta">
            <div className="riqi-polished__eyebrow">
              {language === 'ru' ? 'HSK 1 · Улучшенный sample' : language === 'en' ? 'HSK 1 · Polished Sample' : 'HSK 1 · Sayqallangan namuna'}
            </div>
            <h1 className="riqi-polished__title">
              {language === 'ru' ? 'Даты маленькими шагами' : language === 'en' ? 'Dates In Small Steps' : 'Sanalarni kichik qadamlarda'}
            </h1>
            <p className="riqi-polished__subtitle">
              {language === 'ru'
                ? 'Короткий карточный урок без перегруза'
                : language === 'en'
                  ? 'A compact card lesson with less noise'
                  : "Qisqa va tiniq kartochka darsi"}
            </p>
          </div>
          <BannerMenu />
        </div>

        <div className="riqi-polished__progress">
          <div className="riqi-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="riqi-polished__map">
          {cards.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={`riqi-polished__map-dot ${itemIndex === index ? 'riqi-polished__map-dot--active' : ''}`}
              onClick={() => setCard(itemIndex)}
              aria-label={`${item.step} ${item.title}`}
            >
              {item.step}
            </button>
          ))}
        </div>
      </div>

      <div className="riqi-polished__stage">
        <article className={`riqi-polished-card ${cardThemeClass[card.kind]}`}>
          <div className="riqi-polished-card__header">
            <div className="riqi-polished-card__meta">
              <span className="riqi-polished-card__step">{card.step}</span>
              <span className="riqi-polished-card__kicker">{t(card.kicker)}</span>
            </div>
          </div>

          <div className="riqi-polished-card__main">
            <h2 className="riqi-polished-card__title">{t(card.title)}</h2>

            {'formula' in card && card.formula ? (
              <div className="riqi-polished-card__formula">{typeof card.formula === 'string' ? card.formula : t(card.formula)}</div>
            ) : null}

            {'sentence' in card && card.sentence ? (
              <button
                type="button"
                className="riqi-polished-card__sentence"
                onClick={() => playGrammarAudio(card.sentence!.zh)}
              >
                <div className="riqi-polished-card__sentence-zh">{card.sentence.zh}</div>
                <div className="riqi-polished-card__sentence-py">{card.sentence.pinyin}</div>
                <div className="riqi-polished-card__sentence-tr">{card.sentence.tr[language]}</div>
              </button>
            ) : null}

            {'wrong' in card && card.wrong && 'right' in card && card.right ? (
              <div className="riqi-polished-card__contrast">
                <div className="riqi-polished-card__contrast-box riqi-polished-card__contrast-box--bad">
                  <strong>{language === 'ru' ? 'Неверно' : language === 'en' ? 'Wrong' : "Noto'g'ri"}</strong>
                  <span>{card.wrong}</span>
                </div>
                <div className="riqi-polished-card__contrast-box riqi-polished-card__contrast-box--good">
                  <strong>{language === 'ru' ? 'Верно' : language === 'en' ? 'Right' : "To'g'ri"}</strong>
                  <span>{card.right}</span>
                </div>
              </div>
            ) : null}

            {'prompt' in card && card.prompt && card.options ? (
              <>
                <div className="riqi-polished-card__prompt">{card.prompt[language]}</div>
                <div className="riqi-polished-card__options">
                  {card.options.map((option, optionIndex) => {
                    const selected = quizAnswer === optionIndex;
                    const isCorrect = card.correct === optionIndex;
                    const className = [
                      'riqi-polished-card__option',
                      selected ? 'riqi-polished-card__option--selected' : '',
                      quizAnswer !== null && isCorrect ? 'riqi-polished-card__option--correct' : '',
                      quizAnswer !== null && selected && !isCorrect ? 'riqi-polished-card__option--wrong' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <button
                        key={option}
                        type="button"
                        className={className}
                        onClick={() => setQuizAnswer(optionIndex)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {'bullets' in card && card.bullets ? (
              <div className="riqi-polished-card__bullets">
                {card.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="riqi-polished-card__bullet">
                    {bullet[language]}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="riqi-polished-card__footer">
            {'body' in card && card.body ? (
              <p className="riqi-polished-card__body">{card.body[language]}</p>
            ) : null}

            {'note' in card && card.note ? (
              <div className="riqi-polished-card__note">{card.note[language]}</div>
            ) : null}
          </div>
        </article>
      </div>

      <div className="riqi-polished__nav">
        <button
          type="button"
          className="riqi-polished__nav-btn riqi-polished__nav-btn--ghost"
          onClick={() => setCard(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          {language === 'ru' ? 'Назад' : language === 'en' ? 'Back' : 'Orqaga'}
        </button>
        <button
          type="button"
          className="riqi-polished__nav-btn riqi-polished__nav-btn--solid"
          onClick={() => setCard(Math.min(cards.length - 1, index + 1))}
          disabled={index === cards.length - 1}
        >
          {language === 'ru' ? 'Дальше' : language === 'en' ? 'Next' : 'Keyingi'}
        </button>
      </div>

      <PageFooter />
    </div>
  );
}
