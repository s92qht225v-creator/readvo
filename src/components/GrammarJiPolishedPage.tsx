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
    title: { uz: '几 = nechta?', ru: '几 = сколько?', en: '几 = how many?' },
    body: {
      uz: "几 (jǐ) — «necha?»",
      ru: '几 (jǐ) — «сколько?»',
      en: '几 (jǐ) — "how many?"',
    },
  },
  /* ─ 02 meaning (part 2) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '几 = nechta?', ru: '几 = сколько?', en: '几 = how many?' },
    body: {
      uz: "几 odatda kichik sonlar haqida so'raganda ishlatiladi.",
      ru: '几 обычно используется, когда спрашивают о небольших числах.',
      en: '几 is usually used when asking about small numbers.',
    },
  },
  /* ─ 03 meaning (part 3) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '几 = nechta?', ru: '几 = сколько?', en: '几 = how many?' },
    body: {
      uz: "几 hamisha sanoq so'z bilan birga keladi.\nFormula: 几 + sanoq so'z + ot\nMasalan: 几个人 (jǐ ge rén) — nechta odam?",
      ru: '几 всегда идёт со счётным словом.\nФормула: 几 + счётное слово + существительное\nНапример: 几个人 (jǐ ge rén) — сколько человек?',
      en: '几 always pairs with a measure word.\nFormula: 几 + measure word + noun\nFor example: 几个人 (jǐ ge rén) — how many people?',
    },
  },

  /* ─ 04-06: three example scene cards ─ */
  {
    kind: 'example',
    id: 'people',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '几个人？', ru: '几个人？', en: '几个人？' },
    sentence: {
      zh: '几个人？',
      pinyin: 'Jǐ ge rén?',
      tr: { uz: 'Nechta odam?', ru: 'Сколько человек?', en: 'How many people?' },
    },
    body: {
      uz: "个 (ge) — universal sanoq so'z, 人 — «odam».\nUmumiy tuzilma: 几 + 个 + ot.",
      ru: '个 (ge) — универсальное счётное слово, 人 — «человек».\nОбщая модель: 几 + 个 + существительное.',
      en: '个 (ge) = the universal measure word, 人 = person.\nGeneral pattern: 几 + 个 + noun.',
    },
  },
  {
    kind: 'example',
    id: 'students',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '几个学生？', ru: '几个学生？', en: '几个学生？' },
    sentence: {
      zh: '几个学生？',
      pinyin: 'Jǐ ge xuéshēng?',
      tr: { uz: 'Nechta talaba?', ru: 'Сколько студентов?', en: 'How many students?' },
    },
    body: {
      uz: "学生 — «talaba». Xuddi shu qolip: 几 + 个 + 学生.",
      ru: '学生 — «студент». Та же модель: 几 + 个 + 学生.',
      en: '学生 = student. Same pattern: 几 + 个 + 学生.',
    },
  },
  {
    kind: 'example',
    id: 'friends',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '几个朋友？', ru: '几个朋友？', en: '几个朋友？' },
    sentence: {
      zh: '几个朋友？',
      pinyin: 'Jǐ ge péngyou?',
      tr: { uz: "Nechta do'st?", ru: 'Сколько друзей?', en: 'How many friends?' },
    },
    body: {
      uz: "朋友 — «do'st». Sanoq so'z 个 o'zgarmaydi, faqat ot almashadi.",
      ru: '朋友 — «друг». Счётное слово 个 не меняется, меняется только существительное.',
      en: '朋友 = friend. The measure word 个 stays the same, only the noun changes.',
    },
  },

  /* ─ 07-09: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-people',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '几个人？', ru: '几个人？', en: '几个人？' },
    options: [
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-students',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '几个学生？', ru: '几个学生？', en: '几个学生？' },
    options: [
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-friends',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '几个朋友？', ru: '几个朋友？', en: '几个朋友？' },
    options: [
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 2,
  },

  /* ─ 10-12: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-people',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Nechta odam?', ru: 'Сколько человек?', en: 'How many people?' },
    tokens: [
      { zh: '几', pinyin: 'jǐ' },
      { zh: '个', pinyin: 'ge' },
      { zh: '人', pinyin: 'rén' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-students',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Nechta talaba?', ru: 'Сколько студентов?', en: 'How many students?' },
    tokens: [
      { zh: '几', pinyin: 'jǐ' },
      { zh: '个', pinyin: 'ge' },
      { zh: '学生', pinyin: 'xuéshēng' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-friends',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: "Nechta do'st?", ru: 'Сколько друзей?', en: 'How many friends?' },
    tokens: [
      { zh: '几', pinyin: 'jǐ' },
      { zh: '个', pinyin: 'ge' },
      { zh: '朋友', pinyin: 'péngyou' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ 13-15: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-people',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '几个人？', ru: '几个人？', en: '几个人？' },
    audio: '几个人',
    options: [
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-students',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '几个学生？', ru: '几个学生？', en: '几个学生？' },
    audio: '几个学生',
    options: [
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-friends',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '几个朋友？', ru: '几个朋友？', en: '几个朋友？' },
    audio: '几个朋友',
    options: [
      { uz: "Nechta do'st?",     ru: 'Сколько друзей?',    en: 'How many friends?' },
      { uz: 'Nechta odam?',      ru: 'Сколько человек?',   en: 'How many people?' },
      { uz: 'Nechta talaba?',    ru: 'Сколько студентов?', en: 'How many students?' },
      { uz: 'Bu nima?',          ru: 'Что это?',           en: 'What is this?' },
    ],
    correct: 0,
  },

  /* ─ 16 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '16',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy savol', ru: '3 ключевых вопроса', en: '3 key questions' },
    questions: [
      {
        zh: '几个人？',
        pinyin: 'Jǐ ge rén?',
        tr: { uz: 'Nechta odam?', ru: 'Сколько человек?', en: 'How many people?' },
      },
      {
        zh: '几个学生？',
        pinyin: 'Jǐ ge xuéshēng?',
        tr: { uz: 'Nechta talaba?', ru: 'Сколько студентов?', en: 'How many students?' },
      },
      {
        zh: '几个朋友？',
        pinyin: 'Jǐ ge péngyou?',
        tr: { uz: "Nechta do'st?", ru: 'Сколько друзей?', en: 'How many friends?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarJiPolishedPage() {
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
    'people', 'students', 'friends',
    'check-people', 'check-students', 'check-friends',
    'audio-people', 'audio-students', 'audio-friends',
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
    const existing = getStars('ji');
    if (existing === undefined || stars > existing) saveStars('ji', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    people: (
      <div className="shenme-polished-card__ruby-title" aria-label="Jǐ ge rén?">
        <ruby>几<rt>j&#464;</rt></ruby>
        <ruby>个<rt>ge</rt></ruby>
        <ruby>人<rt>r&eacute;n</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    students: (
      <div className="shenme-polished-card__ruby-title" aria-label="Jǐ ge xuéshēng?">
        <ruby>几<rt>j&#464;</rt></ruby>
        <ruby>个<rt>ge</rt></ruby>
        <ruby>学<rt>xu&eacute;</rt></ruby>
        <ruby>生<rt>sh&#275;ng</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    friends: (
      <div className="shenme-polished-card__ruby-title" aria-label="Jǐ ge péngyou?">
        <ruby>几<rt>j&#464;</rt></ruby>
        <ruby>个<rt>ge</rt></ruby>
        <ruby>朋<rt>p&eacute;ng</rt></ruby>
        <ruby>友<rt>you</rt></ruby>
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
        <div className="dr-hero__watermark">几</div>
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
          <h1 className="dr-hero__title">几</h1>
          <div className="dr-hero__pinyin">jǐ</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'сколько?' : lang === 'en' ? 'how many?' : 'nechta?'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="jǐ">
                  <ruby>几<rt>j&#464;</rt></ruby>
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
