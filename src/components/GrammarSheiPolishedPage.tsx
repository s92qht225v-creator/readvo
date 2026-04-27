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
  /* ─ 01 meaning (part 1: what it is) ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '谁 = kim?', ru: '谁 = кто?', en: '谁 = who?' },
    body: {
      uz: "`谁` (shéi) — «kim?»",
      ru: '`谁` (shéi) — «кто?»',
      en: '`谁` (shéi) — "who?"',
    },
  },
  /* ─ 02 meaning (part 2: scope) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '谁 = kim?', ru: '谁 = кто?', en: '谁 = who?' },
    body: {
      uz: "`谁` (shéi) faqat odamga nisbatan ishlatiladi.",
      ru: '`谁` (shéi) используется только по отношению к людям.',
      en: '`谁` (shéi) is used only for people.',
    },
  },
  /* ─ 03 meaning (part 3: how it works) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '谁 = kim?', ru: '谁 = кто?', en: '谁 = who?' },
    body: {
      uz: "Savol tuzish uchun `谁` (shéi) javob o'rnida qo'yiladi. Masalan: 她是老师 (U o'qituvchi) → 她是谁? (U kim?)",
      ru: 'Чтобы задать вопрос, `谁` (shéi) ставится на место ответа. Например: 她是老师 (Она учитель) → 她是谁? (Кто она?)',
      en: 'To ask a question, `谁` (shéi) goes in the slot where the answer would be. Example: 她是老师 (She is a teacher) → 她是谁? (Who is she?)',
    },
  },

  /* ─ 02-05: four example scene cards ─ */
  {
    kind: 'example',
    id: 'you',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '你是谁？', ru: '你是谁？', en: '你是谁？' },
    sentence: {
      zh: '你是谁？',
      pinyin: 'Nǐ shì shéi?',
      tr: { uz: 'Sen kimsan?', ru: 'Ты кто?', en: 'Who are you?' },
    },
    body: {
      uz: "`你` — «sen», `是` — «dir», `谁` — «kim». So'zma-so'z: «Sen dir kim?» ya'ni «Sen kimsan?».",
      ru: '`你` — «ты», `是` — «быть», `谁` — «кто». Дословно: «Ты есть кто?» → «Ты кто?».',
      en: '`你` = you, `是` = to be, `谁` = who. Literally "You are who?" → "Who are you?"',
    },
  },
  {
    kind: 'example',
    id: 'he',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '他是谁？', ru: '他是谁？', en: '他是谁？' },
    sentence: {
      zh: '他是谁？',
      pinyin: 'Tā shì shéi?',
      tr: { uz: 'U kim?', ru: 'Кто он?', en: 'Who is he?' },
    },
    body: {
      uz: "`他` — «u» (erkak). Uchinchi shaxs haqida so'rashda ham xuddi shunday: A + 是 + 谁?",
      ru: '`他` — «он». Про третье лицо спрашиваем так же: A + 是 + 谁?',
      en: '`他` = he. Asking about a third person works the same: A + 是 + 谁?',
    },
  },
  {
    kind: 'example',
    id: 'this',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '这是谁？', ru: '这是谁？', en: '这是谁？' },
    sentence: {
      zh: '这是谁？',
      pinyin: 'Zhè shì shéi?',
      tr: { uz: 'Bu kim?', ru: 'Кто это?', en: 'Who is this?' },
    },
    body: {
      uz: "Rasmga qarab «Bu kim?» deb so'rash uchun `这是谁？` deymiz. `这` — «bu», `是` — «dir», `谁` — «kim».",
      ru: 'Чтобы спросить «Кто это?» (глядя на фотографию), говорим `这是谁？`. `这` — «это».',
      en: 'To ask "Who is this?" (looking at a photo), say `这是谁？`. `这` = this.',
    },
  },

  /* ─ visual tests ─ */
  {
    kind: 'practice',
    id: 'check-you',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你是谁？', ru: '你是谁？', en: '你是谁？' },
    options: [
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-he',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '他是谁？', ru: '他是谁？', en: '他是谁？' },
    options: [
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-this',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是谁？', ru: '这是谁？', en: '这是谁？' },
    options: [
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
    ],
    correct: 2,
  },

  /* ─ scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-you',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Sen kimsan?', ru: 'Ты кто?', en: 'Who are you?' },
    tokens: [
      { zh: '你', pinyin: 'nǐ' },
      { zh: '是', pinyin: 'shì' },
      { zh: '谁', pinyin: 'shéi' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-he',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'U kim?', ru: 'Кто он?', en: 'Who is he?' },
    tokens: [
      { zh: '他', pinyin: 'tā' },
      { zh: '是', pinyin: 'shì' },
      { zh: '谁', pinyin: 'shéi' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-this',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bu kim?', ru: 'Кто это?', en: 'Who is this?' },
    tokens: [
      { zh: '这', pinyin: 'zhè' },
      { zh: '是', pinyin: 'shì' },
      { zh: '谁', pinyin: 'shéi' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-you',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你是谁？', ru: '你是谁？', en: '你是谁？' },
    audio: '你是谁',
    options: [
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-he',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '他是谁？', ru: '他是谁？', en: '他是谁？' },
    audio: '他是谁',
    options: [
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-this',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是谁？', ru: '这是谁？', en: '这是谁？' },
    audio: '这是谁',
    options: [
      { uz: 'Bu kim?',           ru: 'Кто это?',        en: 'Who is this?' },
      { uz: 'Sen kimsan?',       ru: 'Ты кто?',         en: 'Who are you?' },
      { uz: 'U kim?',            ru: 'Кто он?',         en: 'Who is he?' },
      { uz: 'Bu nima?',          ru: 'Что это?',        en: 'What is this?' },
    ],
    correct: 0,
  },

  /* ─ recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '16',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy savol', ru: '3 ключевых вопроса', en: '3 key questions' },
    questions: [
      {
        zh: '你是谁？',
        pinyin: 'Nǐ shì shéi?',
        tr: { uz: 'Sen kimsan?', ru: 'Ты кто?', en: 'Who are you?' },
      },
      {
        zh: '他是谁？',
        pinyin: 'Tā shì shéi?',
        tr: { uz: 'U kim?', ru: 'Кто он?', en: 'Who is he?' },
      },
      {
        zh: '这是谁？',
        pinyin: 'Zhè shì shéi?',
        tr: { uz: 'Bu kim?', ru: 'Кто это?', en: 'Who is this?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarSheiPolishedPage() {
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
    'you', 'he', 'this',
    'check-you', 'check-he', 'check-this',
    'audio-you', 'audio-he', 'audio-this',
  ]);
  const isSceneCard = sceneIds.has(card.id);
  const progress = ((index + 1) / cards.length) * 100;
  const lang = language as Lang;
  const t = (copy: Copy) => copy[lang] ?? copy.uz;
  const quizAnswer = quizAnswers[card.id] ?? null;
  const isLastCard = index === cards.length - 1;
  const setCard = (nextIndex: number) => setIndex(nextIndex);

  // Deterministic per-card shuffled pool
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
    const existing = getStars('shei');
    if (existing === undefined || stars > existing) saveStars('shei', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    you: (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǐ shì shéi?">
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>谁<rt>sh&eacute;i</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    he: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā shì shéi?">
        <ruby>他<rt>t&#257;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>谁<rt>sh&eacute;i</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    this: (
      <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shéi?">
        <ruby>这<rt>zh&egrave;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>谁<rt>sh&eacute;i</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
  };

  const rubyPhraseKey = card.id
    .replace(/^check-/, '')
    .replace(/^audio-/, '');
  const rubyEl = rubyByPhrase[rubyPhraseKey] ?? null;

  return (
    <div className="grammar-page shenme-polished">
      {/* Original grammar page hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">谁</div>
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
          <h1 className="dr-hero__title">谁</h1>
          <div className="dr-hero__pinyin">shéi</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'кто?' : lang === 'en' ? 'who?' : 'kim?'} —
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shenme-polished__hero">
        <div className="shenme-polished__progress">
          <div className="shenme-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Stage */}
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
                <div className="shenme-polished-card__ruby-title" aria-label="shéi">
                  <ruby>谁<rt>sh&eacute;i</rt></ruby>
                </div>
                {card.body ? (
                  <p className="shenme-polished-card__meaning-body">{card.body[lang]}</p>
                ) : null}
              </div>
            ) : (
              <h2 className="shenme-polished-card__title">{t(card.title)}</h2>
            )}

            {'formula' in card && card.formula && !card.id.startsWith('meaning') ? (
              <div className="shenme-polished-card__formula">
                {typeof card.formula === 'string' ? card.formula : t(card.formula)}
              </div>
            ) : null}

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
                          <span className={`scramble__token-zh${/^[？。！,、；：]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
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
                        <span className={`scramble__token-zh${/^[？。！,、；：]+$/.test(tok.zh) ? ' scramble__token-zh--punct' : ''}`}>{tok.zh}</span>
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
