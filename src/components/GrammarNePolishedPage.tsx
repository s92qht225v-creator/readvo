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
      kind: 'rule' | 'example' | 'contrast' | 'practice' | 'recap' | 'scramble';
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
      tokens?: { zh: string; pinyin: string }[];
    };

const cards: Card[] = [
  /* ─ 01 meaning (part 1) ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '呢 = …-chi?', ru: '呢 = …а?', en: '呢 = …and you?' },
    body: {
      uz: "呢 (ne) — «…-chi?»",
      ru: '呢 (ne) — «…а?»',
      en: '呢 (ne) — "…and you?"',
    },
  },
  /* ─ 02 meaning (part 2) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '呢 = …-chi?', ru: '呢 = …а?', en: '呢 = …and you?' },
    body: {
      uz: "呢 aytilgan gapni savolga aylantirish uchun ishlatiladi.\n\nMasalan: 我是学生，你呢？(wǒ shì xuéshēng, nǐ ne?) — Men talabaman, siz-chi?",
      ru: '呢 превращает уже произнесённое высказывание в короткий встречный вопрос.\n\nНапример: 我是学生，你呢？(wǒ shì xuéshēng, nǐ ne?) — Я студент, а вы?',
      en: '呢 turns a statement you just made into a follow-up question.\n\nFor example: 我是学生，你呢？(wǒ shì xuéshēng, nǐ ne?) — I\'m a student, and you?',
    },
  },
  /* ─ 03 meaning (part 3) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '呢 = …-chi?', ru: '呢 = …а?', en: '呢 = …and you?' },
    body: {
      uz: "Formula: X + 呢? = «X-chi?»\nMasalan: 你呢？(nǐ ne?) — Siz-chi?",
      ru: 'Формула: X + 呢? = «а X?»\nНапример: 你呢？(nǐ ne?) — а ты?',
      en: 'Formula: X + 呢? = "what about X?"\nFor example: 你呢？(nǐ ne?) — and you?',
    },
  },

  /* ─ 04-06: three example scene cards ─ */
  {
    kind: 'example',
    id: 'name',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '我叫阿里，你呢？', ru: '我叫阿里，你呢？', en: '我叫阿里，你呢？' },
    sentence: {
      zh: '我叫阿里，你呢？',
      pinyin: 'Wǒ jiào Ālǐ, nǐ ne?',
      tr: { uz: 'Mening ismim Ali, sizni-chi?', ru: 'Меня зовут Али, а вас?', en: 'My name is Ali, and you?' },
    },
    body: {
      uz: "叫 — «atalmoq / ism bilan atalmoq», 阿里 — «Ali».\nO'zingizni tanishtirgach, savolni qaytaring: 你呢？— «siz-chi?».",
      ru: '叫 — «зваться», 阿里 — «Али».\nПредставившись, возвращаем вопрос: 你呢？ — «а вы?».',
      en: '叫 = to be called / named, 阿里 = "Ali".\nAfter introducing yourself, bounce the question back: 你呢？ = "and you?".',
    },
  },
  {
    kind: 'example',
    id: 'student',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '我是学生，你呢？', ru: '我是学生，你呢？', en: '我是学生，你呢？' },
    sentence: {
      zh: '我是学生，你呢？',
      pinyin: 'Wǒ shì xuéshēng, nǐ ne?',
      tr: { uz: 'Men talabaman, siz-chi?', ru: 'Я студент, а ты?', en: "I'm a student, and you?" },
    },
    body: {
      uz: "Birinchi qismda o'zingiz haqingizda gapirdingiz.\nKeyin 你呢？bilan savolni suhbatdoshga qaytarasiz.",
      ru: 'Сначала говорите о себе.\nЗатем с помощью 你呢？ возвращаете вопрос собеседнику.',
      en: 'First you tell about yourself.\nThen 你呢？ bounces the question back.',
    },
  },
  {
    kind: 'example',
    id: 'chinese',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '我是中国人，你呢？', ru: '我是中国人，你呢？', en: '我是中国人，你呢？' },
    sentence: {
      zh: '我是中国人，你呢？',
      pinyin: 'Wǒ shì Zhōngguórén, nǐ ne?',
      tr: { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
    },
    body: {
      uz: "中国人 — «Xitoylik».\nO'zingiz haqingizda gapirgach, savolni qaytaring: 你呢？— «siz-chi?».",
      ru: '中国人 — «китаец».\nПосле того как сказали о себе, возвращаем вопрос: 你呢？ — «а вы?».',
      en: '中国人 = Chinese (person).\nAfter speaking about yourself, bounce the question back: 你呢？ = "and you?".',
    },
  },

  /* ─ 07-09: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-name',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我叫阿里，你呢？', ru: '我叫阿里，你呢？', en: '我叫阿里，你呢？' },
    options: [
      { uz: 'Mening ismim Ali, sizni-chi?',  ru: 'Меня зовут Али, а вас?', en: 'My name is Ali, and you?' },
      { uz: 'Men talabaman, siz-chi?',     ru: 'Я студент, а ты?',       en: "I'm a student, and you?" },
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Bu sizniki mi?',              ru: 'Это ваше?',              en: 'Is this yours?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-student',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我是学生，你呢？', ru: '我是学生，你呢？', en: '我是学生，你呢？' },
    options: [
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Men talabaman, siz-chi?',      ru: 'Я студент, а ты?',         en: "I'm a student, and you?" },
      { uz: 'Mening ismim Ali, sizni-chi?',   ru: 'Меня зовут Али, а вас?',   en: 'My name is Ali, and you?' },
      { uz: 'Bu sizniki mi?',               ru: 'Это ваше?',                en: 'Is this yours?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-chinese',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我是中国人，你呢？', ru: '我是中国人，你呢？', en: '我是中国人，你呢？' },
    options: [
      { uz: 'Mening ismim Ali, sizni-chi?',   ru: 'Меня зовут Али, а вас?',   en: 'My name is Ali, and you?' },
      { uz: 'Men talabaman, siz-chi?',      ru: 'Я студент, а ты?',         en: "I'm a student, and you?" },
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Bu sizniki mi?',               ru: 'Это ваше?',                en: 'Is this yours?' },
    ],
    correct: 2,
  },

  /* ─ 10-12: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-name',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Mening ismim Ali, sizni-chi?', ru: 'Меня зовут Али, а вас?', en: 'My name is Ali, and you?' },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '叫', pinyin: 'jiào' },
      { zh: '阿里', pinyin: 'Ālǐ' },
      { zh: '，', pinyin: '' },
      { zh: '你', pinyin: 'nǐ' },
      { zh: '呢', pinyin: 'ne' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-student',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men talabaman, siz-chi?', ru: 'Я студент, а ты?', en: "I'm a student, and you?" },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '是', pinyin: 'shì' },
      { zh: '学生', pinyin: 'xuéshēng' },
      { zh: '，', pinyin: '' },
      { zh: '你', pinyin: 'nǐ' },
      { zh: '呢', pinyin: 'ne' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-chinese',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '是', pinyin: 'shì' },
      { zh: '中国人', pinyin: 'Zhōngguórén' },
      { zh: '，', pinyin: '' },
      { zh: '你', pinyin: 'nǐ' },
      { zh: '呢', pinyin: 'ne' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ 13-15: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-name',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我叫阿里，你呢？', ru: '我叫阿里，你呢？', en: '我叫阿里，你呢？' },
    audio: '我叫阿里，你呢',
    options: [
      { uz: 'Men talabaman, siz-chi?',      ru: 'Я студент, а ты?',         en: "I'm a student, and you?" },
      { uz: 'Mening ismim Ali, sizni-chi?',   ru: 'Меня зовут Али, а вас?',   en: 'My name is Ali, and you?' },
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Bu sizniki mi?',               ru: 'Это ваше?',                en: 'Is this yours?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-student',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我是学生，你呢？', ru: '我是学生，你呢？', en: '我是学生，你呢？' },
    audio: '我是学生，你呢',
    options: [
      { uz: 'Mening ismim Ali, sizni-chi?',   ru: 'Меня зовут Али, а вас?',   en: 'My name is Ali, and you?' },
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Men talabaman, siz-chi?',      ru: 'Я студент, а ты?',         en: "I'm a student, and you?" },
      { uz: 'Bu sizniki mi?',               ru: 'Это ваше?',                en: 'Is this yours?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-chinese',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我是中国人，你呢？', ru: '我是中国人，你呢？', en: '我是中国人，你呢？' },
    audio: '我是中国人，你呢',
    options: [
      { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      { uz: 'Mening ismim Ali, sizni-chi?',   ru: 'Меня зовут Али, а вас?',   en: 'My name is Ali, and you?' },
      { uz: 'Men talabaman, siz-chi?',      ru: 'Я студент, а ты?',         en: "I'm a student, and you?" },
      { uz: 'Bu sizniki mi?',               ru: 'Это ваше?',                en: 'Is this yours?' },
    ],
    correct: 0,
  },

  /* ─ 16 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '16',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy gap', ru: '3 ключевых предложения', en: '3 key sentences' },
    questions: [
      {
        zh: '我叫阿里，你呢？',
        pinyin: 'Wǒ jiào Ālǐ, nǐ ne?',
        tr: { uz: 'Mening ismim Ali, sizni-chi?', ru: 'Меня зовут Али, а вас?', en: 'My name is Ali, and you?' },
      },
      {
        zh: '我是学生，你呢？',
        pinyin: 'Wǒ shì xuéshēng, nǐ ne?',
        tr: { uz: 'Men talabaman, siz-chi?', ru: 'Я студент, а ты?', en: "I'm a student, and you?" },
      },
      {
        zh: '我是中国人，你呢？',
        pinyin: 'Wǒ shì Zhōngguórén, nǐ ne?',
        tr: { uz: 'Men Xitoylikman, siz-chi?', ru: 'Я китаец, а вы?', en: "I'm Chinese, and you?" },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarNePolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [scrambleSel, setScrambleSel] = useState<Record<string, number[]>>({});

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const sceneIds = new Set<string>([
    'name', 'student', 'chinese',
    'check-name', 'check-student', 'check-chinese',
    'audio-name', 'audio-student', 'audio-chinese',
  ]);
  const isSceneCard = sceneIds.has(card.id);
  const progress = ((index + 1) / cards.length) * 100;
  const lang = language as Lang;
  const t = (copy: Copy) => copy[lang] ?? copy.uz;
  const quizAnswer = quizAnswers[card.id] ?? null;
  const isLastCard = index === cards.length - 1;
  const setCard = (nextIndex: number) => setIndex(nextIndex);

  const scrambledIndices = (() => {
    if (card.kind !== 'scramble' || !card.tokens) return [];
    const n = card.tokens.length;
    const idx = Array.from({ length: n }, (_, i) => i);
    let seed = 0;
    for (const ch of card.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    for (let i = n - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const j = seed % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    if (n > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift()!);
    return idx;
  })();

  const selForCard = scrambleSel[card.id] ?? [];
  const scrambleTokensLen = card.tokens?.length ?? 0;
  const scrambleComplete = selForCard.length === scrambleTokensLen && scrambleTokensLen > 0;
  const scrambleCorrect = scrambleComplete && selForCard.every((v, i) => v === i);

  const toggleScrambleToken = (tokenIdx: number) => {
    setScrambleSel(prev => {
      const current = prev[card.id] ?? [];
      const pos = current.indexOf(tokenIdx);
      if (pos !== -1) {
        return { ...prev, [card.id]: current.slice(0, pos).concat(current.slice(pos + 1)) };
      }
      if (scrambleCorrect) return prev;
      return { ...prev, [card.id]: [...current, tokenIdx] };
    });
  };

  const resetScramble = () => {
    setScrambleSel(prev => ({ ...prev, [card.id]: [] }));
  };

  const pickAnswer = (cardId: string, optionIndex: number) => {
    setQuizAnswers(prev => (prev[cardId] !== undefined ? prev : { ...prev, [cardId]: optionIndex }));
  };
  const handleComplete = () => {
    const testCards = cards.filter(c => c.kind === 'practice' && c.correct !== undefined);
    const total = testCards.length;
    const correctCount = testCards.filter(c => quizAnswers[c.id] === c.correct).length;
    let stars = 0;
    if (total > 0) {
      if (correctCount === total) stars = 3;
      else if (correctCount / total >= 0.7) stars = 2;
      else if (correctCount > 0) stars = 1;
    }
    const existing = getStars('ne');
    if (existing === undefined || stars > existing) saveStars('ne', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    name: (
      <div className="shenme-polished-card__ruby-title" aria-label="Wǒ jiào Ālǐ, nǐ ne?">
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>叫<rt>ji&agrave;o</rt></ruby>
        <ruby>阿<rt>&#256;</rt></ruby>
        <ruby>里<rt>l&#464;</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">，</span>
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>呢<rt>ne</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    student: (
      <div className="shenme-polished-card__ruby-title" aria-label="Wǒ shì xuéshēng, nǐ ne?">
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>学<rt>xu&eacute;</rt></ruby>
        <ruby>生<rt>sh&#275;ng</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">，</span>
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>呢<rt>ne</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    chinese: (
      <div className="shenme-polished-card__ruby-title" aria-label="Wǒ shì Zhōngguórén, nǐ ne?">
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>中<rt>zh&#333;ng</rt></ruby>
        <ruby>国<rt>gu&oacute;</rt></ruby>
        <span className="shenme-polished-card__ruby-glyph-group">
          <ruby>人<rt>r&eacute;n</rt></ruby>
          <span className="shenme-polished-card__ruby-punct">，</span>
        </span>
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>呢<rt>ne</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
  };

  const rubyPhraseKey = card.id
    .replace(/^check-/, '')
    .replace(/^audio-/, '')
    .replace(/^scramble-/, '');
  const rubyEl = rubyByPhrase[rubyPhraseKey] ?? null;

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">呢</div>
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
            HSK 1 · {lang === 'ru' ? 'Грамматика' : lang === 'en' ? 'Grammar' : 'Grammatika'}
          </div>
          <h1 className="dr-hero__title">呢</h1>
          <div className="dr-hero__pinyin">ne</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? '…а?' : lang === 'en' ? '…and you?' : '…-chi?'} —
          </div>
        </div>
      </div>

      <div className="shenme-polished__hero">
        <div className="shenme-polished__progress">
          <div className="shenme-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="shenme-polished__stage">
        <article className={`shenme-polished-card shenme-polished-card--${card.kind} shenme-polished-card--${card.id}${isSceneCard || card.id.startsWith('meaning') ? ' shenme-polished-card--scene' : ''}`}>
          <div className="shenme-polished-card__header">
            <div className="shenme-polished-card__meta">
              <span className="shenme-polished-card__step">{card.step}</span>
              <span className="shenme-polished-card__kicker">{t(card.kicker)}</span>
            </div>
          </div>

          <div className="shenme-polished-card__main">
            {isSceneCard && rubyEl ? (
              card.audio ? (
                <div className="shenme-polished-card__title-stack">
                  <button
                    type="button"
                    className="shenme-polished-card__audio-btn"
                    onClick={() => playGrammarAudio(card.audio!)}
                    aria-label={lang === 'ru' ? 'Слушать' : lang === 'en' ? 'Listen' : 'Tinglash'}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <div className="shenme-polished-card__audio-hint">
                    {lang === 'ru' ? 'Нажмите, чтобы послушать' : lang === 'en' ? 'Tap to listen' : "Bosib tinglang"}
                  </div>
                </div>
              ) : (
                <div className="shenme-polished-card__title-stack">
                  {rubyEl}
                  {card.sentence ? (
                    <div className="shenme-polished-card__title-translation">{card.sentence.tr[lang]}</div>
                  ) : null}
                  {card.kind === 'example' && card.body ? (
                    <p className="shenme-polished-card__meaning-body">{card.body[lang]}</p>
                  ) : null}
                </div>
              )
            ) : card.id.startsWith('meaning') ? (
              <div className="shenme-polished-card__title-stack">
                <div className="shenme-polished-card__ruby-title" aria-label="ne">
                  <ruby>呢<rt>ne</rt></ruby>
                </div>
                {card.body ? (
                  <p className="shenme-polished-card__meaning-body">{card.body[lang]}</p>
                ) : null}
              </div>
            ) : (
              <h2 className="shenme-polished-card__title">{t(card.title)}</h2>
            )}

            {'options' in card && card.options ? (
              <>
                {card.prompt ? <div className="shenme-polished-card__prompt">{card.prompt[lang]}</div> : null}
                <div className="shenme-polished-card__options">
                  {card.options.map((option, optionIndex) => {
                    const optionLabel = typeof option === 'string' ? option : option[lang];
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
                    <div className="shenme-polished-card__question-tr">{q.tr[lang]}</div>
                  </button>
                ))}
              </div>
            ) : null}

            {card.kind === 'scramble' && card.tokens ? (
              <div className="scramble">
                <div
                  className={`scramble__answer${scrambleCorrect ? ' scramble__answer--correct' : ''}${
                    scrambleComplete && !scrambleCorrect ? ' scramble__answer--wrong' : ''
                  }`}
                >
                  {selForCard.length === 0 ? (
                    <div className="scramble__answer-placeholder">
                      {lang === 'ru' ? 'Нажмите слова ниже' : lang === 'en' ? 'Tap words below' : "Pastdagi so‘zlarni bosing"}
                    </div>
                  ) : (
                    selForCard.map((tokenIdx, slotIdx) => {
                      const tok = card.tokens![tokenIdx];
                      return (
                        <button
                          key={`${slotIdx}-${tokenIdx}`}
                          type="button"
                          className="scramble__token scramble__token--placed"
                          onClick={() => toggleScrambleToken(tokenIdx)}
                          disabled={scrambleCorrect}
                        >
                          <span className="scramble__token-py" aria-hidden={!tok.pinyin}>{tok.pinyin || '\u00A0'}</span>
                          <span className={`scramble__token-zh${/^[？。！，、；：]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="scramble__pool">
                  {scrambledIndices.map(tokenIdx => {
                    const tok = card.tokens![tokenIdx];
                    const used = selForCard.includes(tokenIdx);
                    return (
                      <button
                        key={tokenIdx}
                        type="button"
                        className={`scramble__token${used ? ' scramble__token--used' : ''}`}
                        onClick={() => !used && toggleScrambleToken(tokenIdx)}
                        disabled={used || scrambleCorrect}
                        aria-hidden={used}
                      >
                        <span className="scramble__token-py" aria-hidden={!tok.pinyin}>{tok.pinyin || '\u00A0'}</span>
                        <span className={`scramble__token-zh${/^[？。！，、；：]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="scramble__feedback">
                  {scrambleComplete && !scrambleCorrect ? (
                    <button type="button" className="scramble__reset" onClick={resetScramble}>
                      {lang === 'ru' ? 'Попробовать ещё раз' : lang === 'en' ? 'Try again' : 'Qaytadan'}
                    </button>
                  ) : null}
                  {scrambleCorrect ? (
                    <div className="scramble__success">
                      {lang === 'ru' ? 'Верно!' : lang === 'en' ? 'Correct!' : "To'g'ri!"}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="shenme-polished-card__footer">
            {'body' in card && card.body && card.kind !== 'example' && !card.id.startsWith('meaning') ? (
              <p className="shenme-polished-card__body">{card.body[lang]}</p>
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
          {lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : 'Orqaga'}
        </button>
        <button
          type="button"
          className="shenme-polished__nav-btn shenme-polished__nav-btn--solid"
          onClick={() => {
            if (isLastCard) handleComplete();
            else setCard(Math.min(cards.length - 1, index + 1));
          }}
          disabled={
            (card.kind === 'practice' && !!card.options && quizAnswer === null) ||
            (card.kind === 'scramble' && !scrambleCorrect)
          }
        >
          {isLastCard
            ? (lang === 'ru' ? 'Завершить' : lang === 'en' ? 'Complete' : 'Tugatish')
            : (lang === 'ru' ? 'Дальше' : lang === 'en' ? 'Next' : 'Keyingi')}
        </button>
      </div>

      <PageFooter />
    </div>
  );
}
