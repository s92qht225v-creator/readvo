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
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "月 (yuè) — oy\n号 (hào) — kun (sana)\n星期 (xīngqī) — hafta",
      ru: '月 (yuè) — месяц\n号 (hào) — число (день месяца)\n星期 (xīngqī) — неделя',
      en: '月 (yuè) — month\n号 (hào) — day (of month)\n星期 (xīngqī) — week',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: 'Oy + kun', ru: 'Месяц + число', en: 'Month + day' },
    body: {
      uz: "Xitoy tilida sana: avval oy, keyin kun.\nRaqam + 月 = oy\nRaqam + 号 = kun\n\nMasalan: 十月一号\n(shí yuè yī hào)\n1-oktyabr",
      ru: 'В китайском языке дата: сначала месяц, потом число.\nЧисло + 月 = месяц\nЧисло + 号 = день\n\nНапример: 十月一号\n(shí yuè yī hào)\n1 октября',
      en: 'In Chinese, dates go: month first, then day.\nNumber + 月 = month\nNumber + 号 = day\n\nFor example: 十月一号\n(shí yuè yī hào)\nOctober 1st',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-months',
    step: '03',
    kicker: { uz: 'Oylar', ru: 'Месяцы', en: 'Months' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "Raqam + 月 = oy nomi:\n\n一月 (yī yuè) — yanvar\n二月 (èr yuè) — fevral\n三月 (sān yuè) — mart\n四月 (sì yuè) — aprel\n五月 (wǔ yuè) — may\n六月 (liù yuè) — iyun\n七月 (qī yuè) — iyul\n八月 (bā yuè) — avgust\n九月 (jiǔ yuè) — sentyabr\n十月 (shí yuè) — oktyabr\n十一月 (shíyī yuè) — noyabr\n十二月 (shí'èr yuè) — dekabr",
      ru: 'Число + 月 = название месяца:\n\n一月 (yī yuè) — январь\n二月 (èr yuè) — февраль\n三月 (sān yuè) — март\n四月 (sì yuè) — апрель\n五月 (wǔ yuè) — май\n六月 (liù yuè) — июнь\n七月 (qī yuè) — июль\n八月 (bā yuè) — август\n九月 (jiǔ yuè) — сентябрь\n十月 (shí yuè) — октябрь\n十一月 (shíyī yuè) — ноябрь\n十二月 (shí\'èr yuè) — декабрь',
      en: 'Number + 月 = month name:\n\n一月 (yī yuè) — January\n二月 (èr yuè) — February\n三月 (sān yuè) — March\n四月 (sì yuè) — April\n五月 (wǔ yuè) — May\n六月 (liù yuè) — June\n七月 (qī yuè) — July\n八月 (bā yuè) — August\n九月 (jiǔ yuè) — September\n十月 (shí yuè) — October\n十一月 (shíyī yuè) — November\n十二月 (shí\'èr yuè) — December',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-days',
    step: '04',
    kicker: { uz: 'Sana', ru: 'Число', en: 'Day' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "Raqam + 号 = sana (oyning kuni):\n\n一号 (yī hào) — 1-kun\n二号 (èr hào) — 2-kun\n三号 (sān hào) — 3-kun\n…\n十号 (shí hào) — 10-kun\n十一号 (shíyī hào) — 11-kun\n…\n二十号 (èrshí hào) — 20-kun\n二十一号 (èrshíyī hào) — 21-kun\n…\n三十一号 (sānshíyī hào) — 31-kun",
      ru: 'Число + 号 = день месяца:\n\n一号 (yī hào) — 1-е\n二号 (èr hào) — 2-е\n三号 (sān hào) — 3-е\n…\n十号 (shí hào) — 10-е\n十一号 (shíyī hào) — 11-е\n…\n二十号 (èrshí hào) — 20-е\n二十一号 (èrshíyī hào) — 21-е\n…\n三十一号 (sānshíyī hào) — 31-е',
      en: 'Number + 号 = day of the month:\n\n一号 (yī hào) — 1st\n二号 (èr hào) — 2nd\n三号 (sān hào) — 3rd\n…\n十号 (shí hào) — 10th\n十一号 (shíyī hào) — 11th\n…\n二十号 (èrshí hào) — 20th\n二十一号 (èrshíyī hào) — 21st\n…\n三十一号 (sānshíyī hào) — 31st',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-weekdays',
    step: '05',
    kicker: { uz: 'Hafta kunlari', ru: 'Дни недели', en: 'Days of the week' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "星期 + raqam = hafta kuni:\n\n星期一 (xīngqī yī) — dushanba\n星期二 (xīngqī èr) — seshanba\n星期三 (xīngqī sān) — chorshanba\n星期四 (xīngqī sì) — payshanba\n星期五 (xīngqī wǔ) — juma\n星期六 (xīngqī liù) — shanba\n星期天 (xīngqī tiān) — yakshanba",
      ru: '星期 + число = день недели:\n\n星期一 (xīngqī yī) — понедельник\n星期二 (xīngqī èr) — вторник\n星期三 (xīngqī sān) — среда\n星期四 (xīngqī sì) — четверг\n星期五 (xīngqī wǔ) — пятница\n星期六 (xīngqī liù) — суббота\n星期天 (xīngqī tiān) — воскресенье',
      en: '星期 + number = day of the week:\n\n星期一 (xīngqī yī) — Monday\n星期二 (xīngqī èr) — Tuesday\n星期三 (xīngqī sān) — Wednesday\n星期四 (xīngqī sì) — Thursday\n星期五 (xīngqī wǔ) — Friday\n星期六 (xīngqī liù) — Saturday\n星期天 (xīngqī tiān) — Sunday',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Jīntiān shì shí yuè yī hào.)\nBugun 1-oktyabr.\n\n今天 (jīntiān) — bugun\n是 (shì) — bo'lmoq\n十月 (shí yuè) — oktyabr\n一号 (yī hào) — 1-kun",
      ru: '(Jīntiān shì shí yuè yī hào.)\nСегодня 1 октября.\n\n今天 (jīntiān) — сегодня\n是 (shì) — быть\n十月 (shí yuè) — октябрь\n一号 (yī hào) — 1-е число',
      en: '(Jīntiān shì shí yuè yī hào.)\nToday is October 1st.\n\n今天 (jīntiān) — today\n是 (shì) — to be\n十月 (shí yuè) — October\n一号 (yī hào) — 1st',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-4',
    step: '07',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Jīntiān shì xīngqī yī.)\nBugun — dushanba.\n\n今天 (jīntiān) — bugun\n是 (shì) — bo'lmoq\n星期 (xīngqī) — hafta\n星期一 (xīngqī yī) — dushanba",
      ru: '(Jīntiān shì xīngqī yī.)\nСегодня понедельник.\n\n今天 (jīntiān) — сегодня\n是 (shì) — быть\n星期 (xīngqī) — неделя\n星期一 (xīngqī yī) — понедельник',
      en: '(Jīntiān shì xīngqī yī.)\nToday is Monday.\n\n今天 (jīntiān) — today\n是 (shì) — to be\n星期 (xīngqī) — week\n星期一 (xīngqī yī) — Monday',
    },
  },
  {
    kind: 'rule',
    id: 'meaning-5',
    step: '08',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Jīntiān jǐ yuè jǐ hào?)\nBugun qaysi oyning nechanchi kuni?\n\n今天 (jīntiān) — bugun\n几 (jǐ) — nechta?\n月 (yuè) — oy\n号 (hào) — kun",
      ru: '(Jīntiān jǐ yuè jǐ hào?)\nКакое сегодня число?\n\n今天 (jīntiān) — сегодня\n几 (jǐ) — сколько?\n月 (yuè) — месяц\n号 (hào) — число',
      en: "(Jīntiān jǐ yuè jǐ hào?)\nWhat's the date today?\n\n今天 (jīntiān) — today\n几 (jǐ) — how many?\n月 (yuè) — month\n号 (hào) — day",
    },
  },

  {
    kind: 'practice',
    id: 'check-date',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '今天是十月一号。', ru: '今天是十月一号。', en: '今天是十月一号。' },
    options: [
      { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
      { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
      { uz: 'Bugun qaysi kun?', ru: 'Какой сегодня день?', en: 'What day is it today?' },
      { uz: 'Bugun 10-kun.', ru: 'Сегодня 10-е число.', en: 'Today is the 10th.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-weekday',
    step: '10',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '今天是星期一。', ru: '今天是星期一。', en: '今天是星期一。' },
    options: [
      { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
      { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
      { uz: 'Bugun bayram.', ru: 'Сегодня праздник.', en: 'Today is a holiday.' },
      { uz: 'Bugun 1-kun.', ru: 'Сегодня 1-е число.', en: 'Today is the 1st.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-question',
    step: '11',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '今天几月几号？', ru: '今天几月几号？', en: '今天几月几号？' },
    options: [
      { uz: 'Bugun qaysi kun?', ru: 'Какой сегодня день недели?', en: 'What day of the week is today?' },
      { uz: 'Bugun nima?', ru: 'Что сегодня?', en: 'What is today?' },
      { uz: 'Bugun qaysi oyning nechanchi kuni?', ru: 'Какое сегодня число?', en: "What's the date today?" },
      { uz: 'Bugun bayrammi?', ru: 'Сегодня праздник?', en: 'Is today a holiday?' },
    ],
    correct: 2,
  },

  {
    kind: 'scramble',
    id: 'scramble-date',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
    tokens: [
      { zh: '今天', pinyin: 'jīntiān' },
      { zh: '是', pinyin: 'shì' },
      { zh: '十月', pinyin: 'shí yuè' },
      { zh: '一号', pinyin: 'yī hào' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-weekday',
    step: '13',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
    tokens: [
      { zh: '今天', pinyin: 'jīntiān' },
      { zh: '是', pinyin: 'shì' },
      { zh: '星期一', pinyin: 'xīngqī yī' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-question',
    step: '14',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bugun qaysi oyning nechanchi kuni?', ru: 'Какое сегодня число?', en: "What's the date today?" },
    tokens: [
      { zh: '今天', pinyin: 'jīntiān' },
      { zh: '几月', pinyin: 'jǐ yuè' },
      { zh: '几号', pinyin: 'jǐ hào' },
      { zh: '？', pinyin: '' },
    ],
  },

  {
    kind: 'practice',
    id: 'audio-date',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '今天是十月一号。', ru: '今天是十月一号。', en: '今天是十月一号。' },
    audio: '今天是十月一号。',
    options: [
      { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
      { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
      { uz: 'Bugun qaysi kun?', ru: 'Какой сегодня день?', en: 'What day is it today?' },
      { uz: 'Bugun 10-kun.', ru: 'Сегодня 10-е число.', en: 'Today is the 10th.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-weekday',
    step: '16',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '今天是星期一。', ru: '今天是星期一。', en: '今天是星期一。' },
    audio: '今天是星期一。',
    options: [
      { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
      { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
      { uz: 'Bugun bayram.', ru: 'Сегодня праздник.', en: 'Today is a holiday.' },
      { uz: 'Bugun 1-kun.', ru: 'Сегодня 1-е число.', en: 'Today is the 1st.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-question',
    step: '17',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '今天几月几号？', ru: '今天几月几号？', en: '今天几月几号？' },
    audio: '今天几月几号？',
    options: [
      { uz: 'Bugun qaysi kun?', ru: 'Какой сегодня день недели?', en: 'What day of the week is today?' },
      { uz: 'Bugun nima?', ru: 'Что сегодня?', en: 'What is today?' },
      { uz: 'Bugun qaysi oyning nechanchi kuni?', ru: 'Какое сегодня число?', en: "What's the date today?" },
      { uz: 'Bugun bayrammi?', ru: 'Сегодня праздник?', en: 'Is today a holiday?' },
    ],
    correct: 2,
  },

  {
    kind: 'recap',
    id: 'recap',
    step: '18',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '今天是十月一号。',
        pinyin: 'Jīntiān shì shí yuè yī hào.',
        tr: { uz: 'Bugun 1-oktyabr.', ru: 'Сегодня 1 октября.', en: 'Today is October 1st.' },
      },
      {
        zh: '今天是星期一。',
        pinyin: 'Jīntiān shì xīngqī yī.',
        tr: { uz: 'Bugun — dushanba.', ru: 'Сегодня понедельник.', en: 'Today is Monday.' },
      },
      {
        zh: '今天几月几号？',
        pinyin: 'Jīntiān jǐ yuè jǐ hào?',
        tr: { uz: 'Bugun qaysi oyning nechanchi kuni?', ru: 'Какое сегодня число?', en: "What's the date today?" },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarRiqiPolishedPage() {
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
    'check-date', 'check-weekday', 'check-question',
    'audio-date', 'audio-weekday', 'audio-question',
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
    const existing = getStars('riqi');
    if (existing === undefined || stars > existing) saveStars('riqi', stars);
    setQuizAnswers({});
    router.push('/chinese/grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">日期</div>
        <div className="dr-hero__top-row">
          <Link href="/chinese/grammar" className="dr-back-btn" aria-label={({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language]}>
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
          <h1 className="dr-hero__title">日期</h1>
          <div className="dr-hero__pinyin">rìqī</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'даты' : lang === 'en' ? 'dates' : 'sanalar'} —
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
            {card.id.startsWith('meaning') ? (
              <div className="shenme-polished-card__title-stack">
                {card.id === 'meaning-3' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān shì shí yuè yī hào">
                    <ruby>今<rt>j&#299;n</rt></ruby>
                    <ruby>天<rt>ti&#257;n</rt></ruby>
                    <ruby>是<rt>sh&igrave;</rt></ruby>
                    <ruby>十<rt>sh&iacute;</rt></ruby>
                    <ruby>月<rt>yu&egrave;</rt></ruby>
                    <ruby>一<rt>y&#299;</rt></ruby>
                    <ruby>号<rt>h&agrave;o</rt></ruby>
                    <span>。</span>
                  </div>
                ) : card.id === 'meaning-4' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān shì xīngqī yī">
                    <ruby>今<rt>j&#299;n</rt></ruby>
                    <ruby>天<rt>ti&#257;n</rt></ruby>
                    <ruby>是<rt>sh&igrave;</rt></ruby>
                    <ruby>星<rt>x&#299;ng</rt></ruby>
                    <ruby>期<rt>q&#299;</rt></ruby>
                    <ruby>一<rt>y&#299;</rt></ruby>
                    <span>。</span>
                  </div>
                ) : card.id === 'meaning-5' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān jǐ yuè jǐ hào">
                    <ruby>今<rt>j&#299;n</rt></ruby>
                    <ruby>天<rt>ti&#257;n</rt></ruby>
                    <ruby>几<rt>j&#464;</rt></ruby>
                    <ruby>月<rt>yu&egrave;</rt></ruby>
                    <ruby>几<rt>j&#464;</rt></ruby>
                    <ruby>号<rt>h&agrave;o</rt></ruby>
                    <span>？</span>
                  </div>
                ) : (
                  <div className="shenme-polished-card__ruby-title" aria-label="rìqī">
                    <ruby>日<rt>r&igrave;</rt></ruby>
                    <ruby>期<rt>q&#299;</rt></ruby>
                  </div>
                )}
                {card.title && t(card.title) ? (
                  <div className="shenme-polished-card__title-translation">{t(card.title)}</div>
                ) : null}
                {card.body ? (
                  <p className="shenme-polished-card__meaning-body">{card.body[lang]}</p>
                ) : null}
              </div>
            ) : card.audio ? (
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
            ) : card.id === 'check-date' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān shì shí yuè yī hào">
                <ruby>今<rt>j&#299;n</rt></ruby>
                <ruby>天<rt>ti&#257;n</rt></ruby>
                <ruby>是<rt>sh&igrave;</rt></ruby>
                <ruby>十<rt>sh&iacute;</rt></ruby>
                <ruby>月<rt>yu&egrave;</rt></ruby>
                <ruby>一<rt>y&#299;</rt></ruby>
                <ruby>号<rt>h&agrave;o</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-weekday' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān shì xīngqī yī">
                <ruby>今<rt>j&#299;n</rt></ruby>
                <ruby>天<rt>ti&#257;n</rt></ruby>
                <ruby>是<rt>sh&igrave;</rt></ruby>
                <ruby>星<rt>x&#299;ng</rt></ruby>
                <ruby>期<rt>q&#299;</rt></ruby>
                <ruby>一<rt>y&#299;</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-question' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Jīntiān jǐ yuè jǐ hào">
                <ruby>今<rt>j&#299;n</rt></ruby>
                <ruby>天<rt>ti&#257;n</rt></ruby>
                <ruby>几<rt>j&#464;</rt></ruby>
                <ruby>月<rt>yu&egrave;</rt></ruby>
                <ruby>几<rt>j&#464;</rt></ruby>
                <ruby>号<rt>h&agrave;o</rt></ruby>
                <span>？</span>
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
                          <span className={`scramble__token-zh${/^[？。！,、;:]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
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
                        <span className={`scramble__token-zh${/^[？。！,、;:]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
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
