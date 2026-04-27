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
  /* ─ 01 meaning (digits 1-10) ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '1-9', ru: '1-9', en: '1-9' },
    body: {
      uz: "一 (yī) 1 · 二 (èr) 2 · 三 (sān) 3 · 四 (sì) 4 · 五 (wǔ) 5 · 六 (liù) 6 · 七 (qī) 7 · 八 (bā) 8 · 九 (jiǔ) 9 · 十 (shí) 10",
      ru: '一 (yī) 1 · 二 (èr) 2 · 三 (sān) 3 · 四 (sì) 4 · 五 (wǔ) 5 · 六 (liù) 6 · 七 (qī) 7 · 八 (bā) 8 · 九 (jiǔ) 9 · 十 (shí) 10',
      en: '一 (yī) 1 · 二 (èr) 2 · 三 (sān) 3 · 四 (sì) 4 · 五 (wǔ) 5 · 六 (liù) 6 · 七 (qī) 7 · 八 (bā) 8 · 九 (jiǔ) 9 · 十 (shí) 10',
    },
  },
  /* ─ 02 meaning (teens 11-19) ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '11-19', ru: '11-19', en: '11-19' },
    body: {
      uz: "11 dan 19 gacha sanash uchun\n10 (shí) + 1 dan 9 gacha bo'lgan sonlar qo'shib o'qiladi.\n\nMasalan:\n10 (shí) + 1 (yī) = 11 (shíyī)\n10 (shí) + 8 (bā) = 18 (shíbā)\nva hokazo.",
      ru: 'Чтобы считать от 11 до 19,\nк 10 (shí) прибавляется цифра от 1 до 9.\n\nНапример:\n10 (shí) + 1 (yī) = 11 (shíyī)\n10 (shí) + 8 (bā) = 18 (shíbā)\nи так далее.',
      en: 'To count from 11 to 19,\nadd a digit 1-9 to 10 (shí).\n\nFor example:\n10 (shí) + 1 (yī) = 11 (shíyī)\n10 (shí) + 8 (bā) = 18 (shíbā)\nand so on.',
    },
  },
  /* ─ 03 meaning (tens & compound 20-99) ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '03',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '20-99', ru: '20-99', en: '20-99' },
    body: {
      uz: "20 dan 99 gacha sanash uchun 2 dan 9 gacha bo'lgan sonlar + 10 (shí) + 2 dan 9 gacha bo'lgan sonlar qo'shib aytiladi.\n\nMasalan:\n2 (èr) + 10 (shí) = 20 (èr shí)\n2 (èr) + 10 (shí) + 1 (yī) = 21 (èr shí yī)\n2 (èr) + 10 (shí) + 2 (èr) = 22 (èr shí èr)\nva hokazo.",
      ru: 'Чтобы считать от 20 до 99, к цифре от 2 до 9 прибавляется 10 (shí), а затем цифра от 2 до 9.\n\nНапример:\n2 (èr) + 10 (shí) = 20 (èr shí)\n2 (èr) + 10 (shí) + 1 (yī) = 21 (èr shí yī)\n2 (èr) + 10 (shí) + 2 (èr) = 22 (èr shí èr)\nи так далее.',
      en: 'To count from 20 to 99, add a digit 2-9 + 10 (shí) + a digit 2-9.\n\nFor example:\n2 (èr) + 10 (shí) = 20 (èr shí)\n2 (èr) + 10 (shí) + 1 (yī) = 21 (èr shí yī)\n2 (èr) + 10 (shí) + 2 (èr) = 22 (èr shí èr)\nand so on.',
    },
  },

  /* ─ 04-06: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-thirteen',
    step: '04',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '十三', ru: '十三', en: '十三' },
    options: [
      '3',
      '13',
      '30',
      '33',
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-thirty',
    step: '05',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '三十', ru: '三十', en: '三十' },
    options: [
      '3',
      '13',
      '30',
      '33',
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-fifty-three',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '五十三', ru: '五十三', en: '五十三' },
    options: [
      '35',
      '503',
      '53',
      '13',
    ],
    correct: 2,
  },

  /* ─ 07-09: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-thirteen',
    step: '07',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: '13', ru: '13', en: '13' },
    tokens: [
      { zh: '十', pinyin: 'shí' },
      { zh: '三', pinyin: 'sān' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-thirty',
    step: '08',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: '30', ru: '30', en: '30' },
    tokens: [
      { zh: '三', pinyin: 'sān' },
      { zh: '十', pinyin: 'shí' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-fifty-three',
    step: '09',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: '53', ru: '53', en: '53' },
    tokens: [
      { zh: '五', pinyin: 'wǔ' },
      { zh: '十', pinyin: 'shí' },
      { zh: '三', pinyin: 'sān' },
    ],
  },

  /* ─ 10-12: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-thirteen',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '十三', ru: '十三', en: '十三' },
    audio: '十三',
    options: [
      '3',
      '30',
      '13',
      '33',
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-thirty',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '三十', ru: '三十', en: '三十' },
    audio: '三十',
    options: [
      '30',
      '3',
      '13',
      '33',
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'audio-fifty-three',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '五十三', ru: '五十三', en: '五十三' },
    audio: '五十三',
    options: [
      '35',
      '53',
      '503',
      '13',
    ],
    correct: 1,
  },

  /* ─ 13 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '13',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '十三',
        pinyin: 'shí sān',
        tr: { uz: '13 — 十 + 3', ru: '13 — 十 + 3', en: '13 — 十 + 3' },
      },
      {
        zh: '三十',
        pinyin: 'sān shí',
        tr: { uz: '30 — 3 × 十', ru: '30 — 3 × 十', en: '30 — 3 × 十' },
      },
      {
        zh: '五十三',
        pinyin: 'wǔ shí sān',
        tr: { uz: '53 — 5 × 十 + 3', ru: '53 — 5 × 十 + 3', en: '53 — 5 × 十 + 3' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarShuziPolishedPage() {
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
    'check-thirteen', 'check-thirty', 'check-fifty-three',
    'audio-thirteen', 'audio-thirty', 'audio-fifty-three',
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
    const existing = getStars('shuzi');
    if (existing === undefined || stars > existing) saveStars('shuzi', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    thirteen: (
      <div className="shenme-polished-card__ruby-title" aria-label="shí sān">
        <ruby>十<rt>sh&iacute;</rt></ruby>
        <ruby>三<rt>s&#257;n</rt></ruby>
      </div>
    ),
    thirty: (
      <div className="shenme-polished-card__ruby-title" aria-label="sān shí">
        <ruby>三<rt>s&#257;n</rt></ruby>
        <ruby>十<rt>sh&iacute;</rt></ruby>
      </div>
    ),
    'fifty-three': (
      <div className="shenme-polished-card__ruby-title" aria-label="wǔ shí sān">
        <ruby>五<rt>w&#466;</rt></ruby>
        <ruby>十<rt>sh&iacute;</rt></ruby>
        <ruby>三<rt>s&#257;n</rt></ruby>
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
        <div className="dr-hero__watermark">数字</div>
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
          <h1 className="dr-hero__title">数字</h1>
          <div className="dr-hero__pinyin">shùzì</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'числа 1-99' : lang === 'en' ? 'numbers 1-99' : 'sonlar 1-99'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="shùzì">
                  <ruby>数<rt>sh&ugrave;</rt></ruby>
                  <ruby>字<rt>z&igrave;</rt></ruby>
                </div>
                {card.title ? (
                  <div className="shenme-polished-card__title-translation">{t(card.title)}</div>
                ) : null}
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
