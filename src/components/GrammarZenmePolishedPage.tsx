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
  /* ─ 01 rule: meaning ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "怎么 = qanday? (savol so'zi)",
      ru: '怎么 = как? (вопросительное слово)',
      en: '怎么 = how? (question word)',
    },
  },
  /* ─ 02 formula ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: "Ega + 怎么 + fe'l?", ru: 'Подлежащее + 怎么 + глагол?', en: 'Subject + 怎么 + verb?' },
    body: {
      uz: "Masalan: 这个怎么说？\n(Zhège zěnme shuō?)\nBuni qanday aytiladi?\n\n这个 (zhège) — bu\n怎么 (zěnme) — qanday\n说 (shuō) — aytmoq",
      ru: 'Например: 这个怎么说？\n(Zhège zěnme shuō?)\nКак это сказать?\n\n这个 (zhège) — это\n怎么 (zěnme) — как\n说 (shuō) — говорить',
      en: 'For example: 这个怎么说？\n(Zhège zěnme shuō?)\nHow do you say this?\n\n这个 (zhège) — this\n怎么 (zěnme) — how\n说 (shuō) — to say',
    },
  },
  /* ─ 03 breakdown: 这个怎么读 ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Zhège zěnme dú?)\nBuni qanday o'qiladi?\n\n这个 (zhège) — bu\n怎么 (zěnme) — qanday\n读 (dú) — o'qimoq",
      ru: '(Zhège zěnme dú?)\nКак это читается?\n\n这个 (zhège) — это\n怎么 (zěnme) — как\n读 (dú) — читать',
      en: '(Zhège zěnme dú?)\nHow do you read this?\n\n这个 (zhège) — this\n怎么 (zěnme) — how\n读 (dú) — to read',
    },
  },
  /* ─ 04 breakdown: 这个怎么写 ─ */
  {
    kind: 'rule',
    id: 'meaning-4',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Zhège zěnme xiě?)\nBuni qanday yoziladi?\n\n这个 (zhège) — bu\n怎么 (zěnme) — qanday\n写 (xiě) — yozmoq",
      ru: '(Zhège zěnme xiě?)\nКак это пишется?\n\n这个 (zhège) — это\n怎么 (zěnme) — как\n写 (xiě) — писать',
      en: '(Zhège zěnme xiě?)\nHow do you write this?\n\n这个 (zhège) — this\n怎么 (zěnme) — how\n写 (xiě) — to write',
    },
  },

  /* ─ 05-07: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-shuo',
    step: '05',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这个怎么说？', ru: '这个怎么说？', en: '这个怎么说？' },
    options: [
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-du',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这个怎么读？', ru: '这个怎么读？', en: '这个怎么读？' },
    options: [
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Bu qanday?', ru: 'Какой это?', en: 'What is this like?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-xie',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这个怎么写？', ru: '这个怎么写？', en: '这个怎么写？' },
    options: [
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: 'Bu qayerda?', ru: 'Где это?', en: 'Where is this?' },
    ],
    correct: 1,
  },

  /* ─ 08-10: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-shuo',
    step: '08',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
    tokens: [
      { zh: '这个', pinyin: 'zhège' },
      { zh: '怎么', pinyin: 'zěnme' },
      { zh: '说', pinyin: 'shuō' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-du',
    step: '09',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
    tokens: [
      { zh: '这个', pinyin: 'zhège' },
      { zh: '怎么', pinyin: 'zěnme' },
      { zh: '读', pinyin: 'dú' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-xie',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
    tokens: [
      { zh: '这个', pinyin: 'zhège' },
      { zh: '怎么', pinyin: 'zěnme' },
      { zh: '写', pinyin: 'xiě' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ 11-13: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-shuo',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这个怎么说？', ru: '这个怎么说？', en: '这个怎么说？' },
    audio: '这个怎么说？',
    options: [
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-du',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这个怎么读？', ru: '这个怎么读？', en: '这个怎么读？' },
    audio: '这个怎么读？',
    options: [
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Bu qanday?', ru: 'Какой это?', en: 'What is this like?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-xie',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这个怎么写？', ru: '这个怎么写？', en: '这个怎么写？' },
    audio: '这个怎么写？',
    options: [
      { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      { uz: 'Bu qayerda?', ru: 'Где это?', en: 'Where is this?' },
    ],
    correct: 1,
  },

  /* ─ 14 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '14',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '这个怎么说？',
        pinyin: 'Zhège zěnme shuō?',
        tr: { uz: 'Buni qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?' },
      },
      {
        zh: '这个怎么读？',
        pinyin: 'Zhège zěnme dú?',
        tr: { uz: "Buni qanday o'qiladi?", ru: 'Как это читается?', en: 'How do you read this?' },
      },
      {
        zh: '这个怎么写？',
        pinyin: 'Zhège zěnme xiě?',
        tr: { uz: 'Buni qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarZenmePolishedPage() {
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
    'check-shuo', 'check-du', 'check-xie',
    'audio-shuo', 'audio-du', 'audio-xie',
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
    const existing = getStars('zenme');
    if (existing === undefined || stars > existing) saveStars('zenme', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">怎么</div>
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
          <h1 className="dr-hero__title">怎么</h1>
          <div className="dr-hero__pinyin">zěnme</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'как?' : lang === 'en' ? 'how?' : 'qanday?'} —
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
                  <div className="shenme-polished-card__ruby-title" aria-label="Zhège zěnme dú">
                    <ruby>这<rt>zh&egrave;</rt></ruby>
                    <ruby>个<rt>ge</rt></ruby>
                    <ruby>怎<rt>z&#283;n</rt></ruby>
                    <ruby>么<rt>me</rt></ruby>
                    <ruby>读<rt>d&uacute;</rt></ruby>
                    <span>？</span>
                  </div>
                ) : card.id === 'meaning-4' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Zhège zěnme xiě">
                    <ruby>这<rt>zh&egrave;</rt></ruby>
                    <ruby>个<rt>ge</rt></ruby>
                    <ruby>怎<rt>z&#283;n</rt></ruby>
                    <ruby>么<rt>me</rt></ruby>
                    <ruby>写<rt>xi&#283;</rt></ruby>
                    <span>？</span>
                  </div>
                ) : (
                  <div className="shenme-polished-card__ruby-title" aria-label="zěnme">
                    <ruby>怎<rt>z&#283;n</rt></ruby>
                    <ruby>么<rt>me</rt></ruby>
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
            ) : card.id === 'check-shuo' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Zhège zěnme shuō">
                <ruby>这<rt>zh&egrave;</rt></ruby>
                <ruby>个<rt>ge</rt></ruby>
                <ruby>怎<rt>z&#283;n</rt></ruby>
                <ruby>么<rt>me</rt></ruby>
                <ruby>说<rt>shu&#333;</rt></ruby>
                <span>？</span>
              </div>
            ) : card.id === 'check-du' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Zhège zěnme dú">
                <ruby>这<rt>zh&egrave;</rt></ruby>
                <ruby>个<rt>ge</rt></ruby>
                <ruby>怎<rt>z&#283;n</rt></ruby>
                <ruby>么<rt>me</rt></ruby>
                <ruby>读<rt>d&uacute;</rt></ruby>
                <span>？</span>
              </div>
            ) : card.id === 'check-xie' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Zhège zěnme xiě">
                <ruby>这<rt>zh&egrave;</rt></ruby>
                <ruby>个<rt>ge</rt></ruby>
                <ruby>怎<rt>z&#283;n</rt></ruby>
                <ruby>么<rt>me</rt></ruby>
                <ruby>写<rt>xi&#283;</rt></ruby>
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
