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
  /* ─ 01 rule: both 几岁 and 多大 ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "几岁 (jǐ suì) — 10 yoshgacha bo'lgan bolalarning yoshini so'rash uchun ishlatiladi.\n\n多大 (duō dà) — kattalarning yoshini so'rash uchun ishlatiladi.",
      ru: '几岁 (jǐ suì) — используется, чтобы спросить возраст ребёнка (до 10 лет).\n\n多大 (duō dà) — используется, чтобы спросить возраст взрослого.',
      en: '几岁 (jǐ suì) — used to ask the age of a child (under 10).\n\n多大 (duō dà) — used to ask the age of an adult.',
    },
  },
  /* ─ 02 rule: answer with 岁 ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: 'Javob: raqam + 岁', ru: 'Ответ: число + 岁', en: 'Answer: number + 岁' },
    body: {
      uz: "Yoshni aytish uchun raqam + 岁 (suì) qo'shiladi.\n\nMasalan:\n我八岁。(Wǒ bā suì.) — Men 8 yoshdaman.\n我二十岁。(Wǒ èrshí suì.) — Men 20 yoshdaman.\n他三十五岁。(Tā sānshíwǔ suì.) — U 35 yoshda.",
      ru: 'Чтобы сказать возраст — число + 岁 (suì).\n\nНапример:\n我八岁。(Wǒ bā suì.) — Мне 8 лет.\n我二十岁。(Wǒ èrshí suì.) — Мне 20 лет.\n他三十五岁。(Tā sānshíwǔ suì.) — Ему 35 лет.',
      en: 'To give an age — number + 岁 (suì).\n\nFor example:\n我八岁。(Wǒ bā suì.) — I am 8.\n我二十岁。(Wǒ èrshí suì.) — I am 20.\n他三十五岁。(Tā sānshíwǔ suì.) — He is 35.',
    },
  },

  /* ─ 04-06: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-adult',
    step: '03',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: 'Kattaga savol', ru: 'Вопрос взрослому', en: 'Ask an adult' },
    prompt: { uz: "Kattaning yoshini qanday so'raysiz?", ru: 'Как спросить возраст взрослого?', en: 'How do you ask an adult their age?' },
    options: [
      '你几岁？',
      '你多大？',
      '你什么？',
      '你哪？',
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-child',
    step: '04',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: 'Bolaga savol', ru: 'Вопрос ребёнку', en: 'Ask a child' },
    prompt: { uz: "Bolaning yoshini qanday so'raysiz?", ru: 'Как спросить возраст ребёнка?', en: 'How do you ask a child their age?' },
    options: [
      '你多大？',
      '你谁？',
      '你几岁？',
      '你呢？',
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-answer',
    step: '05',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: 'Men 20 yoshdaman', ru: 'Мне 20 лет', en: 'I am 20' },
    prompt: { uz: "Qaysi javob to'g'ri?", ru: 'Какой ответ верный?', en: 'Which answer is correct?' },
    options: [
      '我二十。',
      '我二十岁。',
      '我岁二十。',
      '我多大。',
    ],
    correct: 1,
  },

  /* ─ 07-09: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-duoda',
    step: '06',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Siz necha yoshdasiz?', ru: 'Сколько вам лет?', en: 'How old are you?' },
    tokens: [
      { zh: '你', pinyin: 'nǐ' },
      { zh: '多大', pinyin: 'duō dà' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-jisui',
    step: '07',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Uking necha yoshda?', ru: 'Сколько лет твоему брату?', en: 'How old is your brother?' },
    tokens: [
      { zh: '你弟弟', pinyin: 'nǐ dìdi' },
      { zh: '几岁', pinyin: 'jǐ suì' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-answer',
    step: '08',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men 25 yoshdaman.', ru: 'Мне 25 лет.', en: 'I am 25.' },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '二十五', pinyin: 'èrshíwǔ' },
      { zh: '岁', pinyin: 'suì' },
      { zh: '。', pinyin: '' },
    ],
  },

  /* ─ 10-12: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-duoda',
    step: '09',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你多大？', ru: '你多大？', en: '你多大？' },
    audio: '你多大？',
    options: [
      'Sen nechanchisan?',
      'Siz necha yoshdasiz?',
      'Sen kimsan?',
      'Sen qayerdasan?',
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-jisui',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你几岁？', ru: '你几岁？', en: '你几岁？' },
    audio: '你几岁？',
    options: [
      'Sen necha yoshdasan? (bolaga)',
      'Siz necha yoshdasiz? (kattaga)',
      'Nechtasan?',
      'Qaysi birisan?',
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'audio-answer',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我二十岁。', ru: '我二十岁。', en: '我二十岁。' },
    audio: '我二十岁。',
    options: [
      'Men 2 yoshdaman.',
      'Men 12 yoshdaman.',
      'Men 20 yoshdaman.',
      'Men 22 yoshdaman.',
    ],
    correct: 2,
  },

  /* ─ 13 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '12',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '你多大？',
        pinyin: 'Nǐ duō dà?',
        tr: { uz: 'Siz necha yoshdasiz? (katta)', ru: 'Сколько вам лет? (взрослый)', en: 'How old are you? (adult)' },
      },
      {
        zh: '你几岁？',
        pinyin: 'Nǐ jǐ suì?',
        tr: { uz: 'Sen necha yoshdasan? (bola)', ru: 'Сколько тебе лет? (ребёнок)', en: 'How old are you? (child)' },
      },
      {
        zh: '我二十岁。',
        pinyin: 'Wǒ èrshí suì.',
        tr: { uz: 'Men 20 yoshdaman.', ru: 'Мне 20 лет.', en: 'I am 20 years old.' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarDuodaPolishedPage() {
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
    'check-adult', 'check-child', 'check-answer',
    'audio-duoda', 'audio-jisui', 'audio-answer',
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
    const existing = getStars('duoda');
    if (existing === undefined || stars > existing) saveStars('duoda', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">几岁</div>
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
          <h1 className="dr-hero__title">几岁 / 多大</h1>
          <div className="dr-hero__pinyin">jǐ suì / duō dà</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'сколько лет?' : lang === 'en' ? 'how old?' : 'necha yoshda?'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="jǐ suì / duō dà">
                  <ruby>几<rt>j&#464;</rt></ruby>
                  <ruby>岁<rt>su&igrave;</rt></ruby>
                  <span style={{ margin: '0 0.3em', opacity: 0.6 }}>/</span>
                  <ruby>多<rt>du&#333;</rt></ruby>
                  <ruby>大<rt>d&agrave;</rt></ruby>
                </div>
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
