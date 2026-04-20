'use client';

import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useStars } from '../hooks/useStars';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { playGrammarAudio } from '@/utils/grammarAudio';

type Copy = { uz: string; ru: string; en: string };

type Card =
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
      options?: (string | Copy)[];
      correct?: number;
      bullets?: Copy[];
      audio?: string;
      questions?: { zh: string; pinyin: string; tr: Copy }[];
    };

const cards: Card[] = [
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '什么 = nima?', ru: '什么 = что?', en: '什么 = what?' },
    body: {
      uz: "`什么` (shénme) — «nima?» degan so'roq so'zi. Javob bo'ladigan so'z o'rniga qo'ying — gap savolga aylanadi. Masalan: «Bu — kitob» → «Bu — 什么?»",
      ru: '`什么` (shénme) — вопросительное слово «что?». Поставьте его на место слова-ответа, и предложение превратится в вопрос. Например: «Это книга» → «Это 什么?»',
      en: '`什么` (shénme) means "what?". Drop it into the slot where the answer would go, and the sentence becomes a question. For example: "This is a book" → "This is 什么?"',
    },
    formula: {
      uz: "Javob bo'ladigan so'z → 什么",
      ru: 'место ответа → 什么',
      en: 'shénme',
    },
  },
  {
    kind: 'example',
    id: 'this',
    step: '02',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: '这是什么？',
      ru: '这是什么？',
      en: '这是什么？',
    },
    sentence: {
      zh: '这是什么？',
      pinyin: 'Zhè shì shénme?',
      tr: {
        uz: 'Bu nima?',
        ru: 'Что это?',
        en: 'What is this?',
      },
    },
    body: {
      uz: "`这` — «bu», `是` — «...dir», `什么` — «nima». So'zma-so'z: «Bu — nima?» Biror narsaga ishora qilib ishlating.",
      ru: '`这` — «это», `是` — «есть/является», `什么` — «что». Дословно: «Это есть что?» Используйте, указывая на предмет.',
      en: '`这` = this, `是` = is, `什么` = what. Literally "This is what?" — use it while pointing at any object you want to identify.',
    },
  },
  {
    kind: 'example',
    id: 'that',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: 'U narsa nima ekanini so‘rash',
      ru: 'Спросить, что это там',
      en: 'Ask what that is',
    },
    sentence: {
      zh: '那是什么？',
      pinyin: 'Nà shì shénme?',
      tr: {
        uz: 'Ana u nima?',
        ru: 'Что это там?',
        en: 'What is that?',
      },
    },
    body: {
      uz: '`那` — «ana u», `是` — «...dir», `什么` — «nima». So\'zma-so\'z: «Ana u — nima?»',
      ru: '`那` — «то», `是` — «есть/является», `什么` — «что». Дословно: «То есть что?»',
      en: '`那` = that, `是` = is, `什么` = what. Literally "That is what?"',
    },
  },
  {
    kind: 'example',
    id: 'book',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: "Kitob nomini so'rash",
      ru: 'Спросить название книги',
      en: 'Ask about a book',
    },
    sentence: {
      zh: '这是什么书？',
      pinyin: 'Zhè shì shénme shū?',
      tr: {
        uz: 'Bu qanday kitob?',
        ru: 'Какая это книга?',
        en: 'What book is this?',
      },
    },
    body: {
      uz: "`书` — «kitob». Uning o'rniga boshqa otni qo'ying — yangi savol paydo bo'ladi. Masalan: `这是什么颜色 (yánsè)？` — «Bu qanday rang?»",
      ru: '`书` — «книга». Замените на любое другое существительное — получите новый вопрос. Например: `这是什么颜色 (yánsè)？` — «Какой это цвет?»',
      en: '`书` means "book". Swap it for a different noun to get a new question. For example: `这是什么颜色 (yánsè)？` — "What color is this?"',
    },
  },
  {
    kind: 'example',
    id: 'color',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: "Rangni so'rash",
      ru: 'Спросить про цвет',
      en: 'Ask about a color',
    },
    sentence: {
      zh: '这是什么颜色？',
      pinyin: 'Zhè shì shénme yánsè?',
      tr: {
        uz: 'Bu qanday rang?',
        ru: 'Какой это цвет?',
        en: 'What color is this?',
      },
    },
    body: {
      uz: "`颜色` (yánsè) — «rang». Xuddi `书` kabi — `什么` dan keyin istagan otni qo'ysangiz bo'ladi.",
      ru: '`颜色` (yánsè) — «цвет». Так же как `书`, после `什么` можно поставить любое существительное.',
      en: '`颜色` (yánsè) means "color". Just like `书`, you can place any noun after `什么`.',
    },
  },
  {
    kind: 'example',
    id: 'name',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: "Ismni so'rash",
      ru: 'Спросить имя',
      en: "Ask someone's name",
    },
    sentence: {
      zh: '你叫什么名字？',
      pinyin: 'Nǐ jiào shénme míngzi?',
      tr: {
        uz: 'Ismingiz nima?',
        ru: 'Как вас зовут?',
        en: 'What is your name?',
      },
    },
    body: {
      uz: "`你` — «sen», `叫` — «atalmoq», `名字` — «ism». So'zma-so'z: «Sen qanday ism bilan atalasan?» — tayyor ibora sifatida yodlang.",
      ru: '`你` — «ты», `叫` — «называться», `名字` — «имя». Дословно: «Ты называешься каким именем?» Запоминайте как готовую фразу.',
      en: '`你` = you, `叫` = to be called, `名字` = name. Literally "You are called what name?" — memorize it as a set phrase.',
    },
  },
  {
    kind: 'practice',
    id: 'check',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: {
      uz: '那是什么？',
      ru: '那是什么？',
      en: '那是什么？',
    },
    options: [
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-this',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是什么？', ru: '这是什么？', en: '这是什么？' },
    options: [
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-book',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是什么书？', ru: '这是什么书？', en: '这是什么书？' },
    options: [
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-name',
    step: '10',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你叫什么名字？', ru: '你叫什么名字？', en: '你叫什么名字？' },
    options: [
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 3,
  },
  {
    kind: 'practice',
    id: 'check-color-that',
    step: '11',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '那是什么颜色？', ru: '那是什么颜色？', en: '那是什么颜色？' },
    options: [
      { uz: 'Ana u qanday rang?',  ru: 'Какой это цвет там?', en: 'What color is that?' },
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'audio-that',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '那是什么？', ru: '那是什么？', en: '那是什么？' },
    audio: '那是什么',
    options: [
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-this',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是什么？', ru: '这是什么？', en: '这是什么？' },
    audio: '这是什么',
    options: [
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-book',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是什么书？', ru: '这是什么书？', en: '这是什么书？' },
    audio: '这是什么书',
    options: [
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
    ],
    correct: 3,
  },
  {
    kind: 'practice',
    id: 'audio-name',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你叫什么名字？', ru: '你叫什么名字？', en: '你叫什么名字？' },
    audio: '你叫什么名字',
    options: [
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'audio-color-that',
    step: '16',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '那是什么颜色？', ru: '那是什么颜色？', en: '那是什么颜色？' },
    audio: '那是什么颜色',
    options: [
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Ana u qanday rang?',  ru: 'Какой это цвет там?', en: 'What color is that?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
    ],
    correct: 1,
  },
  {
    kind: 'recap',
    id: 'recap',
    step: '17',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: {
      uz: "5 ta foydali savol",
      ru: '5 полезных вопросов',
      en: '5 useful questions',
    },
    questions: [
      {
        zh: '这是什么？',
        pinyin: 'Zhè shì shénme?',
        tr: { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
      },
      {
        zh: '那是什么？',
        pinyin: 'Nà shì shénme?',
        tr: { uz: 'Ana u nima?', ru: 'Что это там?', en: 'What is that?' },
      },
      {
        zh: '这是什么书？',
        pinyin: 'Zhè shì shénme shū?',
        tr: { uz: 'Bu qanday kitob?', ru: 'Какая это книга?', en: 'What book is this?' },
      },
      {
        zh: '你叫什么名字？',
        pinyin: 'Nǐ jiào shénme míngzi?',
        tr: { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?' },
      },
      {
        zh: '那是什么颜色？',
        pinyin: 'Nà shì shénme yánsè?',
        tr: { uz: 'Ana u qanday rang?', ru: 'Какой это цвет там?', en: 'What color is that?' },
      },
    ],
  },
];

export function GrammarShenmePolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const sceneIds = new Set([
    'this', 'that', 'book', 'color', 'name',
    'check', 'check-this', 'check-book', 'check-name', 'check-color-that',
    'audio-that', 'audio-this', 'audio-book', 'audio-name', 'audio-color-that',
  ]);
  const isSceneCard = sceneIds.has(card.id);
  const progress = ((index + 1) / cards.length) * 100;
  const t = (copy: Copy) => copy[language] ?? copy.uz;
  const quizAnswer = quizAnswers[card.id] ?? null;
  const isLastCard = index === cards.length - 1;
  const setCard = (nextIndex: number) => {
    setIndex(nextIndex);
  };
  const pickAnswer = (cardId: string, optionIndex: number) => {
    setQuizAnswers(prev => (prev[cardId] !== undefined ? prev : { ...prev, [cardId]: optionIndex }));
  };
  const handleComplete = () => {
    const testCards = cards.filter(c => c.kind === 'practice' && c.correct !== undefined);
    const total = testCards.length;
    const correct = testCards.filter(c => quizAnswers[c.id] === c.correct).length;
    let stars = 0;
    if (total > 0) {
      if (correct === total) stars = 3;
      else if (correct / total >= 0.7) stars = 2;
      else if (correct > 0) stars = 1;
    }
    const existing = getStars('shenme');
    if (existing === undefined || stars > existing) saveStars('shenme', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      {/* Original grammar page hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">什么</div>
        <div className="dr-hero__top-row">
          <Link href="/chinese?tab=grammar" className="dr-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <BannerMenu />
        </div>
        <div className="dr-hero__body">
          <div className="dr-hero__level">
            HSK 1 · {language === 'ru' ? 'Грамматика' : language === 'en' ? 'Grammar' : 'Grammatika'}
          </div>
          <h1 className="dr-hero__title">什么</h1>
          <div className="dr-hero__pinyin">shénme</div>
          <div className="dr-hero__translation">
            — {language === 'ru' ? 'что?' : language === 'en' ? 'what?' : 'nima?'} —
          </div>
        </div>
      </div>

      {/* Progress + step map */}
      <div className="shenme-polished__hero">
        <div className="shenme-polished__progress">
          <div className="shenme-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="shenme-polished__map">
          {cards.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={`shenme-polished__map-dot ${itemIndex === index ? 'shenme-polished__map-dot--active' : ''}`}
              onClick={() => setCard(itemIndex)}
              aria-label={`${item.step}`}
            >
              {item.step}
            </button>
          ))}
        </div>
      </div>

      <div className="shenme-polished__stage">
        <article className={`shenme-polished-card shenme-polished-card--${card.kind} shenme-polished-card--${card.id}${isSceneCard || card.id === 'meaning' ? ' shenme-polished-card--scene' : ''}`}>
          <div className="shenme-polished-card__header">
            <div className="shenme-polished-card__meta">
              <span className="shenme-polished-card__step">{card.step}</span>
              <span className="shenme-polished-card__kicker">{t(card.kicker)}</span>
            </div>
          </div>

          <div className="shenme-polished-card__main">
            {isSceneCard ? (
              (() => {
                const rubyEl =
                  card.id === 'this' || card.id === 'check-this' || card.id === 'audio-this' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shénme?">
                      <ruby>这<rt>zh&egrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : card.id === 'book' || card.id === 'check-book' || card.id === 'audio-book' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shénme shū?">
                      <ruby>这<rt>zh&egrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <ruby>书<rt>sh&#363;</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : card.id === 'color' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shénme yánsè?">
                      <ruby>这<rt>zh&egrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <ruby>颜<rt>y&aacute;n</rt></ruby>
                      <ruby>色<rt>s&egrave;</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : card.id === 'name' || card.id === 'check-name' || card.id === 'audio-name' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Nǐ jiào shénme míngzi?">
                      <ruby>你<rt>n&#464;</rt></ruby>
                      <ruby>叫<rt>ji&agrave;o</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <ruby>名<rt>m&iacute;ng</rt></ruby>
                      <ruby>字<rt>zi</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : card.id === 'check-color-that' || card.id === 'audio-color-that' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Nà shì shénme yánsè?">
                      <ruby>那<rt>n&agrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <ruby>颜<rt>y&aacute;n</rt></ruby>
                      <ruby>色<rt>s&egrave;</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : (
                    <div className="shenme-polished-card__ruby-title" aria-label="Nà shì shénme?">
                      <ruby>那<rt>n&agrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  );

                if (card.audio) {
                  return (
                    <div className="shenme-polished-card__title-stack">
                      <button
                        type="button"
                        className="shenme-polished-card__audio-btn"
                        onClick={() => playGrammarAudio(card.audio!)}
                        aria-label={t({ uz: "Tinglash", ru: 'Слушать', en: 'Listen' } as Copy)}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                      <div className="shenme-polished-card__audio-hint">
                        {t({ uz: "Bosib tinglang", ru: 'Нажмите, чтобы послушать', en: 'Tap to listen' } as Copy)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="shenme-polished-card__title-stack">
                    {rubyEl}
                    {card.sentence ? (
                      <div className="shenme-polished-card__title-translation">{card.sentence.tr[language]}</div>
                    ) : null}
                  </div>
                );
              })()
            ) : card.id === 'meaning' ? (
              <div className="shenme-polished-card__title-stack">
                <div className="shenme-polished-card__ruby-title" aria-label="shénme">
                  <ruby>什<rt>sh&eacute;n</rt></ruby>
                  <ruby>么<rt>me</rt></ruby>
                </div>
                <div className="shenme-polished-card__title-translation">
                  {language === 'ru' ? 'что?' : language === 'en' ? 'what?' : 'nima?'}
                </div>
              </div>
            ) : (
              <h2 className="shenme-polished-card__title">{t(card.title)}</h2>
            )}

            {'formula' in card && card.formula && card.id !== 'meaning' ? (
              <div className="shenme-polished-card__formula">{typeof card.formula === 'string' ? card.formula : t(card.formula)}</div>
            ) : null}

            {'sentence' in card && card.sentence && !isSceneCard ? (
              <button
                type="button"
                className="shenme-polished-card__sentence"
                onClick={() => playGrammarAudio(card.sentence!.zh)}
              >
                <div className="shenme-polished-card__sentence-zh">{card.sentence.zh}</div>
                <div className="shenme-polished-card__sentence-py">{card.sentence.pinyin}</div>
                <div className="shenme-polished-card__sentence-tr">{card.sentence.tr[language]}</div>
              </button>
            ) : null}

            {'wrong' in card && card.wrong && 'right' in card && card.right ? (
              <div className="shenme-polished-card__contrast">
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--bad">
                  <strong>{language === 'ru' ? 'Неверно' : language === 'en' ? 'Wrong' : "Noto'g'ri"}</strong>
                  <span>{card.wrong}</span>
                </div>
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--good">
                  <strong>{language === 'ru' ? 'Верно' : language === 'en' ? 'Right' : "To'g'ri"}</strong>
                  <span>{card.right}</span>
                </div>
              </div>
            ) : null}

            {'options' in card && card.options ? (
              <>
                {card.prompt ? <div className="shenme-polished-card__prompt">{card.prompt[language]}</div> : null}
                <div className="shenme-polished-card__options">
                  {card.options.map((option, optionIndex) => {
                    const optionLabel = typeof option === 'string' ? option : option[language];
                    const selected = quizAnswer === optionIndex;
                    const isCorrect = card.correct === optionIndex;
                    const className = [
                      'shenme-polished-card__option',
                      selected ? 'shenme-polished-card__option--selected' : '',
                      quizAnswer !== null && isCorrect ? 'shenme-polished-card__option--correct' : '',
                      quizAnswer !== null && selected && !isCorrect ? 'shenme-polished-card__option--wrong' : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <button
                        key={optionLabel}
                        type="button"
                        className={className}
                        onClick={() => pickAnswer(card.id, optionIndex)}
                      >
                        {optionLabel}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {'bullets' in card && card.bullets ? (
              <div className="shenme-polished-card__bullets">
                {card.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="shenme-polished-card__bullet">
                    {bullet[language]}
                  </div>
                ))}
              </div>
            ) : null}

            {'questions' in card && card.questions ? (
              <div className="shenme-polished-card__questions">
                {card.questions.map((q, qIndex) => (
                  <button
                    key={qIndex}
                    type="button"
                    className="shenme-polished-card__question"
                    onClick={() => playGrammarAudio(q.zh)}
                  >
                    <div className="shenme-polished-card__question-zh">{q.zh}</div>
                    <div className="shenme-polished-card__question-py">{q.pinyin}</div>
                    <div className="shenme-polished-card__question-tr">{q.tr[language]}</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="shenme-polished-card__footer">
            {'body' in card && card.body ? (
              <p className="shenme-polished-card__body">{card.body[language]}</p>
            ) : null}
            {'note' in card && card.note ? (
              <div className="shenme-polished-card__note">{card.note[language]}</div>
            ) : null}
          </div>
        </article>
      </div>

      <div className="shenme-polished__nav">
        <button
          type="button"
          className="shenme-polished__nav-btn shenme-polished__nav-btn--ghost"
          onClick={() => setCard(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          {language === 'ru' ? 'Назад' : language === 'en' ? 'Back' : 'Orqaga'}
        </button>
        <button
          type="button"
          className="shenme-polished__nav-btn shenme-polished__nav-btn--solid"
          onClick={() => {
            if (isLastCard) handleComplete();
            else setCard(Math.min(cards.length - 1, index + 1));
          }}
          disabled={card.kind === 'practice' && !!card.options && quizAnswer === null}
        >
          {isLastCard
            ? (language === 'ru' ? 'Завершить' : language === 'en' ? 'Complete' : 'Tugatish')
            : (language === 'ru' ? 'Дальше' : language === 'en' ? 'Next' : 'Keyingi')}
        </button>
      </div>

      <PageFooter />
    </div>
  );
}
