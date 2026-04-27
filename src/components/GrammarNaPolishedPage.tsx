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
    title: { uz: '哪 = qaysi?', ru: '哪 = какой?', en: '哪 = which?' },
    body: {
      uz: "哪 (nǎ) — «qaysi?»",
      ru: '哪 (nǎ) — «какой?»',
      en: '哪 (nǎ) — "which?"',
    },
  },
  /* ─ 02 meaning (part 2: purpose) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '哪 = qaysi?', ru: '哪 = какой?', en: '哪 = which?' },
    body: {
      uz: "哪 (nǎ) bir nechta variantdan birini tanlash uchun ishlatiladi.\n\nMasalan: 哪个? (nǎ ge?) — Qaysi biri?",
      ru: '哪 (nǎ) используется, чтобы выбрать один вариант из нескольких.\n\nНапример: 哪个? (nǎ ge?) — Какой именно?',
      en: '哪 (nǎ) is used to pick one out of several options.\n\nFor example: 哪个? (nǎ ge?) — Which one?',
    },
  },
  /* ─ 03 meaning (part 3: how it works) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '哪 = qaysi?', ru: '哪 = какой?', en: '哪 = which?' },
    body: {
      uz: "哪 odatda ot yoki sanoq so'z bilan birga ishlatiladi.\n\n哪 + ot: 哪国 (nǎ guó) — qaysi mamlakat?\n哪 + sanoq so'z: 哪个 (nǎ ge) — qaysi biri?",
      ru: '哪 обычно идёт вместе с существительным или счётным словом.\n\n哪 + существительное: 哪国 (nǎ guó) — какая страна?\n哪 + счётное слово: 哪个 (nǎ ge) — какой именно?',
      en: '哪 usually pairs with a noun or a measure word.\n\n哪 + noun: 哪国 (nǎ guó) — which country?\n哪 + measure word: 哪个 (nǎ ge) — which one?',
    },
  },

  /* ─ 04-06: three example scene cards ─ */
  {
    kind: 'example',
    id: 'country',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '你是哪国人？', ru: '你是哪国人？', en: '你是哪国人？' },
    sentence: {
      zh: '你是哪国人？',
      pinyin: 'Nǐ shì nǎ guó rén?',
      tr: { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?', en: 'Which country are you from?' },
    },
    body: {
      uz: "你 — «siz, sen», 是 — «…siz», 哪国 — «qaysi davlat», 人 — «odam».\nSo'zma-so'z: «Siz qaysi davlat odamisiz?».",
      ru: '你 — «ты/вы», 是 — «быть», 哪国 — «какая страна», 人 — «человек».\nДословно: «Ты какой страны человек?».',
      en: '你 = you, 是 = to be, 哪国 = which country, 人 = person.\nLiterally "You are which-country person?".',
    },
  },
  {
    kind: 'example',
    id: 'one',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '哪个是你的？', ru: '哪个是你的？', en: '哪个是你的？' },
    sentence: {
      zh: '哪个是你的？',
      pinyin: 'Nǎ ge shì nǐ de?',
      tr: { uz: 'Qaysi biri sizniki?', ru: 'Какой из них твой?', en: 'Which one is yours?' },
    },
    body: {
      uz: "哪个 — «qaysi biri». 个 (ge) — universal sanoq so'z. 你的 — «sizniki».",
      ru: '哪个 — «какой именно». 个 (ge) — универсальное счётное слово. 你的 — «твой».',
      en: '哪个 = which one. 个 (ge) is the universal measure word. 你的 = yours.',
    },
  },

  /* ─ visual tests ─ */
  {
    kind: 'practice',
    id: 'check-country',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你是哪国人？', ru: '你是哪国人？', en: '你是哪国人？' },
    options: [
      { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?',  en: 'Which country are you from?' },
      { uz: 'Qaysi biri sizniki?',     ru: 'Какой из них твой?',    en: 'Which one is yours?' },
      { uz: 'U kim?',                 ru: 'Кто он?',               en: 'Who is he?' },
      { uz: 'Bu nima?',               ru: 'Что это?',              en: 'What is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-one',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '哪个是你的？', ru: '哪个是你的？', en: '哪个是你的？' },
    options: [
      { uz: 'U kim?',                 ru: 'Кто он?',               en: 'Who is he?' },
      { uz: 'Qaysi biri sizniki?',     ru: 'Какой из них твой?',    en: 'Which one is yours?' },
      { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?',  en: 'Which country are you from?' },
      { uz: 'Bu nima?',               ru: 'Что это?',              en: 'What is this?' },
    ],
    correct: 1,
  },

  /* ─ scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-country',
    step: '08',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?', en: 'Which country are you from?' },
    tokens: [
      { zh: '你', pinyin: 'nǐ' },
      { zh: '是', pinyin: 'shì' },
      { zh: '哪', pinyin: 'nǎ' },
      { zh: '国', pinyin: 'guó' },
      { zh: '人', pinyin: 'rén' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-one',
    step: '09',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Qaysi biri sizniki?', ru: 'Какой из них твой?', en: 'Which one is yours?' },
    tokens: [
      { zh: '哪', pinyin: 'nǎ' },
      { zh: '个', pinyin: 'ge' },
      { zh: '是', pinyin: 'shì' },
      { zh: '你的', pinyin: 'nǐ de' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-country',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你是哪国人？', ru: '你是哪国人？', en: '你是哪国人？' },
    audio: '你是哪国人',
    options: [
      { uz: 'Qaysi biri sizniki?',     ru: 'Какой из них твой?',    en: 'Which one is yours?' },
      { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?',  en: 'Which country are you from?' },
      { uz: 'U kim?',                 ru: 'Кто он?',               en: 'Who is he?' },
      { uz: 'Bu nima?',               ru: 'Что это?',              en: 'What is this?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-one',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '哪个是你的？', ru: '哪个是你的？', en: '哪个是你的？' },
    audio: '哪个是你的',
    options: [
      { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?',  en: 'Which country are you from?' },
      { uz: 'U kim?',                 ru: 'Кто он?',               en: 'Who is he?' },
      { uz: 'Qaysi biri sizniki?',     ru: 'Какой из них твой?',    en: 'Which one is yours?' },
      { uz: 'Bu nima?',               ru: 'Что это?',              en: 'What is this?' },
    ],
    correct: 2,
  },

  /* ─ recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '12',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '2 ta asosiy savol', ru: '2 ключевых вопроса', en: '2 key questions' },
    questions: [
      {
        zh: '你是哪国人？',
        pinyin: 'Nǐ shì nǎ guó rén?',
        tr: { uz: 'Siz qaysi davlatdansiz?', ru: 'Ты из какой страны?', en: 'Which country are you from?' },
      },
      {
        zh: '哪个是你的？',
        pinyin: 'Nǎ ge shì nǐ de?',
        tr: { uz: 'Qaysi biri sizniki?', ru: 'Какой из них твой?', en: 'Which one is yours?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarNaPolishedPage() {
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
    'country', 'one',
    'check-country', 'check-one',
    'audio-country', 'audio-one',
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
    const existing = getStars('na');
    if (existing === undefined || stars > existing) saveStars('na', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    country: (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǐ shì nǎ guó rén?">
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>哪<rt>n&#462;</rt></ruby>
        <ruby>国<rt>gu&oacute;</rt></ruby>
        <ruby>人<rt>r&eacute;n</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    one: (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǎ ge shì nǐ de?">
        <ruby>哪<rt>n&#462;</rt></ruby>
        <ruby>个<rt>ge</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>的<rt>de</rt></ruby>
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
        <div className="dr-hero__watermark">哪</div>
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
          <h1 className="dr-hero__title">哪</h1>
          <div className="dr-hero__pinyin">nǎ</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'какой?' : lang === 'en' ? 'which?' : 'qaysi?'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="nǎ">
                  <ruby>哪<rt>n&#462;</rt></ruby>
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
