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
  /* ─ 01 rule: 会 = can (learned skill) ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: '会 = qila olmoq / qila olishni bilmoq',
      ru: '会 = уметь / мочь (что-то делать)',
      en: '会 = can / know how to do',
    },
  },
  /* ─ 02 rule: positive formula ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: "Ega + 会 + fe'l", ru: 'Подлежащее + 会 + глагол', en: 'Subject + 会 + verb' },
    body: {
      uz: "Masalan: 我会说中文。\n(Wǒ huì shuō Zhōngwén.)\nMen Xitoycha gapira olaman.\n\n我 (wǒ) — men\n会 (huì) — qila olmoq\n说 (shuō) — gapirmoq\n中文 (Zhōngwén) — Xitoy tili",
      ru: 'Например: 我会说中文。\n(Wǒ huì shuō Zhōngwén.)\nЯ умею говорить по-китайски.\n\n我 (wǒ) — я\n会 (huì) — уметь / мочь\n说 (shuō) — говорить\n中文 (Zhōngwén) — китайский язык',
      en: 'For example: 我会说中文。\n(Wǒ huì shuō Zhōngwén.)\nI can speak Chinese.\n\n我 (wǒ) — I\n会 (huì) — can / know how to\n说 (shuō) — to speak\n中文 (Zhōngwén) — Chinese language',
    },
  },
  /* ─ 03 rule: negation formula 不会 ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: "Ega + 不会 + fe'l", ru: 'Подлежащее + 不会 + глагол', en: 'Subject + 不会 + verb' },
    body: {
      uz: "Masalan: 我不会说中文。\n(Wǒ bú huì shuō Zhōngwén.)\nMen Xitoycha gapira olmayman.\n\n我 (wǒ) — men\n不会 (bú huì) — qila olmaslik\n说 (shuō) — gapirmoq\n中文 (Zhōngwén) — Xitoy tili",
      ru: 'Например: 我不会说中文。\n(Wǒ bú huì shuō Zhōngwén.)\nЯ не умею говорить по-китайски.\n\n我 (wǒ) — я\n不会 (bú huì) — не уметь\n说 (shuō) — говорить\n中文 (Zhōngwén) — китайский язык',
      en: 'For example: 我不会说中文。\n(Wǒ bú huì shuō Zhōngwén.)\nI can\'t speak Chinese.\n\n我 (wǒ) — I\n不会 (bú huì) — cannot / don\'t know how to\n说 (shuō) — to speak\n中文 (Zhōngwén) — Chinese language',
    },
  },

  /* ─ 04 rule: question formula 会…吗? ─ */
  {
    kind: 'rule',
    id: 'meaning-4',
    step: '04',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: "Ega + 会 + fe'l + 吗?", ru: 'Подлежащее + 会 + глагол + 吗?', en: 'Subject + 会 + verb + 吗?' },
    body: {
      uz: "Masalan: 你会说中文吗？\n(Nǐ huì shuō Zhōngwén ma?)\nSen Xitoycha gapira olasanmi?\n\n你 (nǐ) — sen\n会 (huì) — qila olmoq\n说 (shuō) — gapirmoq\n中文 (Zhōngwén) — Xitoy tili\n吗 (ma) — savol yuklamasi",
      ru: 'Например: 你会说中文吗？\n(Nǐ huì shuō Zhōngwén ma?)\nТы умеешь говорить по-китайски?\n\n你 (nǐ) — ты\n会 (huì) — уметь / мочь\n说 (shuō) — говорить\n中文 (Zhōngwén) — китайский язык\n吗 (ma) — вопросительная частица',
      en: 'For example: 你会说中文吗？\n(Nǐ huì shuō Zhōngwén ma?)\nCan you speak Chinese?\n\n你 (nǐ) — you\n会 (huì) — can / know how to\n说 (shuō) — to speak\n中文 (Zhōngwén) — Chinese language\n吗 (ma) — question particle',
    },
  },

  /* ─ 05 breakdown: 我会写汉字 ─ */
  {
    kind: 'rule',
    id: 'meaning-5',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Wǒ huì xiě Hànzì.)\nMen iyerogliflarni yoza olaman.\n\n我 (wǒ) — men\n会 (huì) — qila olmoq\n写 (xiě) — yozmoq\n汉字 (Hànzì) — iyerogliflar",
      ru: '(Wǒ huì xiě Hànzì.)\nЯ умею писать иероглифы.\n\n我 (wǒ) — я\n会 (huì) — уметь / мочь\n写 (xiě) — писать\n汉字 (Hànzì) — иероглифы',
      en: '(Wǒ huì xiě Hànzì.)\nI can write Chinese characters.\n\n我 (wǒ) — I\n会 (huì) — can / know how to\n写 (xiě) — to write\n汉字 (Hànzì) — Chinese characters',
    },
  },
  /* ─ 06 breakdown: 我会做饭 ─ */
  {
    kind: 'rule',
    id: 'meaning-6',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Wǒ huì zuò fàn.)\nMen ovqat pishira olaman.\n\n我 (wǒ) — men\n会 (huì) — qila olmoq\n做 (zuò) — qilmoq\n饭 (fàn) — ovqat\n做饭 (zuò fàn) — ovqat pishirmoq",
      ru: '(Wǒ huì zuò fàn.)\nЯ умею готовить.\n\n我 (wǒ) — я\n会 (huì) — уметь / мочь\n做 (zuò) — делать\n饭 (fàn) — еда\n做饭 (zuò fàn) — готовить еду',
      en: '(Wǒ huì zuò fàn.)\nI can cook.\n\n我 (wǒ) — I\n会 (huì) — can / know how to\n做 (zuò) — to do / make\n饭 (fàn) — meal / rice\n做饭 (zuò fàn) — to cook',
    },
  },
  /* ─ 07-09: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-positive',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我会说中文。', ru: '我会说中文。', en: '我会说中文。' },
    options: [
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Men iyerogliflarni yoza olaman.', ru: 'Я умею писать иероглифы.', en: 'I can write Chinese characters.' },
      { uz: 'Men ovqat pishira olaman.', ru: 'Я умею готовить.', en: 'I can cook.' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-negative',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我不会说中文。', ru: '我不会说中文。', en: '我不会说中文。' },
    options: [
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Men ovqat pishira olmayman.', ru: 'Я не умею готовить.', en: "I can't cook." },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-question',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你会说中文吗？', ru: '你会说中文吗？', en: '你会说中文吗？' },
    options: [
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      { uz: 'Sen ovqat pishira olasanmi?', ru: 'Ты умеешь готовить?', en: 'Can you cook?' },
    ],
    correct: 2,
  },

  /* ─ 10-12: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-positive',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men xitoy tilida gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '会', pinyin: 'huì' },
      { zh: '说', pinyin: 'shuō' },
      { zh: '中文', pinyin: 'Zhōngwén' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-negative',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '不会', pinyin: 'bú huì' },
      { zh: '说', pinyin: 'shuō' },
      { zh: '中文', pinyin: 'Zhōngwén' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-question',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
    tokens: [
      { zh: '你', pinyin: 'nǐ' },
      { zh: '会', pinyin: 'huì' },
      { zh: '说', pinyin: 'shuō' },
      { zh: '中文', pinyin: 'Zhōngwén' },
      { zh: '吗', pinyin: 'ma' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ 13-15: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-positive',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我会说中文。', ru: '我会说中文。', en: '我会说中文。' },
    audio: '我会说中文。',
    options: [
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      { uz: 'Men ovqat pishira olaman.', ru: 'Я умею готовить.', en: 'I can cook.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-negative',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我不会说中文。', ru: '我不会说中文。', en: '我不会说中文。' },
    audio: '我不会说中文。',
    options: [
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      { uz: 'Men ovqat pishira olmayman.', ru: 'Я не умею готовить.', en: "I can't cook." },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-question',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你会说中文吗？', ru: '你会说中文吗？', en: '你会说中文吗？' },
    audio: '你会说中文吗？',
    options: [
      { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      { uz: 'Sen ovqat pishira olasanmi?', ru: 'Ты умеешь готовить?', en: 'Can you cook?' },
    ],
    correct: 2,
  },

  /* ─ 13 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '16',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '我会说中文。',
        pinyin: 'Wǒ huì shuō Zhōngwén.',
        tr: { uz: 'Men Xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
      },
      {
        zh: '我不会说中文。',
        pinyin: 'Wǒ bú huì shuō Zhōngwén.',
        tr: { uz: 'Men Xitoycha gapira olmayman.', ru: 'Я не умею говорить по-китайски.', en: "I can't speak Chinese." },
      },
      {
        zh: '你会说中文吗？',
        pinyin: 'Nǐ huì shuō Zhōngwén ma?',
        tr: { uz: 'Sen Xitoycha gapira olasanmi?', ru: 'Ты умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarHuiPolishedPage() {
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
    'check-question',
    'audio-speak', 'audio-drive', 'audio-question',
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
    const existing = getStars('hui');
    if (existing === undefined || stars > existing) saveStars('hui', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">会</div>
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
          <h1 className="dr-hero__title">会</h1>
          <div className="dr-hero__pinyin">huì</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'уметь / мочь' : lang === 'en' ? 'can / be able to' : 'qila olmoq'} —
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
                  <div className="shenme-polished-card__ruby-title" aria-label="bú huì">
                    <ruby>不<rt>b&uacute;</rt></ruby>
                    <ruby>会<rt>hu&igrave;</rt></ruby>
                  </div>
                ) : card.id === 'meaning-4' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="huì ma">
                    <ruby>会<rt>hu&igrave;</rt></ruby>
                    <ruby>吗<rt>ma</rt></ruby>
                  </div>
                ) : card.id === 'meaning-5' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Wǒ huì xiě Hànzì">
                    <ruby>我<rt>w&#466;</rt></ruby>
                    <ruby>会<rt>hu&igrave;</rt></ruby>
                    <ruby>写<rt>xi&#283;</rt></ruby>
                    <ruby>汉<rt>H&agrave;n</rt></ruby>
                    <ruby>字<rt>z&igrave;</rt></ruby>
                  </div>
                ) : card.id === 'meaning-6' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Wǒ huì zuò fàn">
                    <ruby>我<rt>w&#466;</rt></ruby>
                    <ruby>会<rt>hu&igrave;</rt></ruby>
                    <ruby>做<rt>zu&ograve;</rt></ruby>
                    <ruby>饭<rt>f&agrave;n</rt></ruby>
                  </div>
                ) : (
                  <div className="shenme-polished-card__ruby-title" aria-label="huì">
                    <ruby>会<rt>hu&igrave;</rt></ruby>
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
            ) : card.id === 'check-positive' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Wǒ huì shuō Zhōngwén">
                <ruby>我<rt>w&#466;</rt></ruby>
                <ruby>会<rt>hu&igrave;</rt></ruby>
                <ruby>说<rt>shu&#333;</rt></ruby>
                <ruby>中<rt>zh&#333;ng</rt></ruby>
                <ruby>文<rt>w&eacute;n</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-negative' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Wǒ bú huì shuō Zhōngwén">
                <ruby>我<rt>w&#466;</rt></ruby>
                <ruby>不<rt>b&uacute;</rt></ruby>
                <ruby>会<rt>hu&igrave;</rt></ruby>
                <ruby>说<rt>shu&#333;</rt></ruby>
                <ruby>中<rt>zh&#333;ng</rt></ruby>
                <ruby>文<rt>w&eacute;n</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-question' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Nǐ huì shuō Zhōngwén ma">
                <ruby>你<rt>n&#464;</rt></ruby>
                <ruby>会<rt>hu&igrave;</rt></ruby>
                <ruby>说<rt>shu&#333;</rt></ruby>
                <ruby>中<rt>zh&#333;ng</rt></ruby>
                <ruby>文<rt>w&eacute;n</rt></ruby>
                <ruby>吗<rt>ma</rt></ruby>
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
