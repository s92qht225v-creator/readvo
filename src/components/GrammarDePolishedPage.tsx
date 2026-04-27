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
    title: { uz: '的 = -niki, -ning', ru: '的 = принадлежность', en: '的 = possessive' },
    body: {
      uz: "的 (de) — «-niki, -ning», «…ga tegishli».",
      ru: '的 (de) — «чей?», «принадлежит …».',
      en: '的 (de) — "-\'s", "belongs to …".',
    },
  },
  /* ─ 02 meaning (part 2) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '的 = -niki, -ning', ru: '的 = принадлежность', en: '的 = possessive' },
    body: {
      uz: "的 ikki so'z orasida qo'llanib, A 的 B ya'ni B A ga tegishli ma'nosini anglatadi.",
      ru: '的 ставится между двумя словами — A 的 B, то есть «B принадлежит A».',
      en: '的 sits between two words — A 的 B, meaning "B belongs to A".',
    },
  },
  /* ─ 03 meaning (part 3) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '的 = -niki, -ning', ru: '的 = принадлежность', en: '的 = possessive' },
    body: {
      uz: "Formula: A + 的 + B = «A ning B si».\nMasalan: 我的书 (wǒ de shū) — mening kitobim.",
      ru: 'Формула: A + 的 + B = «B кого — A-а».\nНапример: 我的书 (wǒ de shū) — моя книга.',
      en: 'Formula: A + 的 + B = "A\'s B".\nFor example: 我的书 (wǒ de shū) — my book.',
    },
  },

  /* ─ 04-06: three example scene cards ─ */
  {
    kind: 'example',
    id: 'book',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '这是我的书。', ru: '这是我的书。', en: '这是我的书。' },
    sentence: {
      zh: '这是我的书。',
      pinyin: 'Zhè shì wǒ de shū.',
      tr: { uz: 'Bu mening kitobim.', ru: 'Это моя книга.', en: 'This is my book.' },
    },
    body: {
      uz: "我 — «men», 的 — «-ning», 书 — «kitob».\nSo'zma-so'z: «Bu — mening kitobim».",
      ru: '我 — «я», 的 — показатель принадлежности, 书 — «книга».\nДословно: «Это — моя книга».',
      en: '我 = I, 的 = possessive, 书 = book.\nLiterally "This is my book."',
    },
  },
  {
    kind: 'example',
    id: 'friend',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '他是我的朋友。', ru: '他是我的朋友。', en: '他是我的朋友。' },
    sentence: {
      zh: '他是我的朋友。',
      pinyin: 'Tā shì wǒ de péngyou.',
      tr: { uz: "U mening do'stim.", ru: 'Он мой друг.', en: 'He is my friend.' },
    },
    body: {
      uz: "朋友 — «do'st». A + 的 + B qolipi: «men + 的 + do'st» = «mening do'stim».",
      ru: '朋友 — «друг». Модель A + 的 + B: «я + 的 + друг» = «мой друг».',
      en: '朋友 = friend. A + 的 + B pattern: "I + 的 + friend" = "my friend".',
    },
  },
  {
    kind: 'example',
    id: 'yours',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '这是你的吗？', ru: '这是你的吗？', en: '这是你的吗？' },
    sentence: {
      zh: '这是你的吗？',
      pinyin: 'Zhè shì nǐ de ma?',
      tr: { uz: 'Bu sizniki mi?', ru: 'Это ваше?', en: 'Is this yours?' },
    },
    body: {
      uz: "的 dan keyin ot kelmasa ham — «-niki» ma'nosini beradi.\n我的 — «meniki», 你的 — «sizniki».",
      ru: 'После 的 существительное можно опустить — он сам даёт значение «-ий/-ше».\n我的 — «моё», 你的 — «ваше».',
      en: 'The noun after 的 can be dropped — 的 alone means "-\'s".\n我的 = mine, 你的 = yours.',
    },
  },

  /* ─ 07-09: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-book',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是我的书。', ru: '这是我的书。', en: '这是我的书。' },
    options: [
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-friend',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '他是我的朋友。', ru: '他是我的朋友。', en: '他是我的朋友。' },
    options: [
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-yours',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是你的吗？', ru: '这是你的吗？', en: '这是你的吗？' },
    options: [
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
    ],
    correct: 2,
  },

  /* ─ 10-12: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-book',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bu mening kitobim.', ru: 'Это моя книга.', en: 'This is my book.' },
    tokens: [
      { zh: '这', pinyin: 'zhè' },
      { zh: '是', pinyin: 'shì' },
      { zh: '我的', pinyin: 'wǒ de' },
      { zh: '书', pinyin: 'shū' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-friend',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: "U mening do'stim.", ru: 'Он мой друг.', en: 'He is my friend.' },
    tokens: [
      { zh: '他', pinyin: 'tā' },
      { zh: '是', pinyin: 'shì' },
      { zh: '我的', pinyin: 'wǒ de' },
      { zh: '朋友', pinyin: 'péngyou' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-yours',
    step: '12',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bu sizniki mi?', ru: 'Это ваше?', en: 'Is this yours?' },
    tokens: [
      { zh: '这', pinyin: 'zhè' },
      { zh: '是', pinyin: 'shì' },
      { zh: '你的', pinyin: 'nǐ de' },
      { zh: '吗', pinyin: 'ma' },
      { zh: '？', pinyin: '' },
    ],
  },

  /* ─ 13-15: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-book',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是我的书。', ru: '这是我的书。', en: '这是我的书。' },
    audio: '这是我的书',
    options: [
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-friend',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '他是我的朋友。', ru: '他是我的朋友。', en: '他是我的朋友。' },
    audio: '他是我的朋友',
    options: [
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-yours',
    step: '15',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是你的吗？', ru: '这是你的吗？', en: '这是你的吗？' },
    audio: '这是你的吗',
    options: [
      { uz: 'Bu sizniki mi?',     ru: 'Это ваше?',           en: 'Is this yours?' },
      { uz: 'Bu mening kitobim.', ru: 'Это моя книга.',     en: 'This is my book.' },
      { uz: "U mening do'stim.",  ru: 'Он мой друг.',        en: 'He is my friend.' },
      { uz: 'U kim?',             ru: 'Кто он?',             en: 'Who is he?' },
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
        zh: '这是我的书。',
        pinyin: 'Zhè shì wǒ de shū.',
        tr: { uz: 'Bu mening kitobim.', ru: 'Это моя книга.', en: 'This is my book.' },
      },
      {
        zh: '他是我的朋友。',
        pinyin: 'Tā shì wǒ de péngyou.',
        tr: { uz: "U mening do'stim.", ru: 'Он мой друг.', en: 'He is my friend.' },
      },
      {
        zh: '这是你的吗？',
        pinyin: 'Zhè shì nǐ de ma?',
        tr: { uz: 'Bu sizniki mi?', ru: 'Это ваше?', en: 'Is this yours?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarDePolishedPage() {
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
    'book', 'friend', 'yours',
    'check-book', 'check-friend', 'check-yours',
    'audio-book', 'audio-friend', 'audio-yours',
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
    const existing = getStars('de');
    if (existing === undefined || stars > existing) saveStars('de', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    book: (
      <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì wǒ de shū.">
        <ruby>这<rt>zh&egrave;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>的<rt>de</rt></ruby>
        <ruby>书<rt>sh&#363;</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    friend: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā shì wǒ de péngyou.">
        <ruby>他<rt>t&#257;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>的<rt>de</rt></ruby>
        <ruby>朋<rt>p&eacute;ng</rt></ruby>
        <ruby>友<rt>you</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    yours: (
      <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì nǐ de ma?">
        <ruby>这<rt>zh&egrave;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>的<rt>de</rt></ruby>
        <ruby>吗<rt>ma</rt></ruby>
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
        <div className="dr-hero__watermark">的</div>
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
          <h1 className="dr-hero__title">的</h1>
          <div className="dr-hero__pinyin">de</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'принадлежность' : lang === 'en' ? 'possessive' : '-niki, -ning'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="de">
                  <ruby>的<rt>de</rt></ruby>
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
