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
      /** Scramble card: tokens shown in correct order; UI shuffles and user reconstructs. */
      tokens?: { zh: string; pinyin: string }[];
    };

const cards: Card[] = [
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '什么 = nima?', ru: '什么 = что?', en: '什么 = what?' },
    body: {
      uz: "`什么` (shénme) — «nima?» degan so'roq so'zi. Javob bo'ladigan so'z o'rniga qo'ying — gap savolga aylanadi. Masalan: «Bu — kitob» → «Bu — 什么?»",
      ru: '`什么` (shénme) — вопросительное слово «что?». Поставьте его на место слова-ответа, и предложение превратится в вопрос. Например: «Это книга» → «Это 什么?»',
      en: '`什么` (shénme) means "what?". Drop it into the slot where the answer would go, and the sentence becomes a question. For example: "This is a book" → "This is 什么?"',
    },
    formula: {
      uz: "Javob bo'ladigan so'z → 什么",
      ru: 'место ответа → 什么',
      en: 'shénme',
    },
  },
  {
    kind: 'example',
    id: 'this',
    step: '02',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: '这是什么？',
      ru: '这是什么？',
      en: '这是什么？',
    },
    sentence: {
      zh: '这是什么？',
      pinyin: 'Zhè shì shénme?',
      tr: {
        uz: 'Bu nima?',
        ru: 'Что это?',
        en: 'What is this?',
      },
    },
    body: {
      uz: "`这` — «bu», `是` — «...dir», `什么` — «nima». So'zma-so'z: «Bu — nima?» Biror narsaga ishora qilib ishlating.",
      ru: '`这` — «это», `是` — «есть/является», `什么` — «что». Дословно: «Это есть что?» Используйте, указывая на предмет.',
      en: '`这` = this, `是` = is, `什么` = what. Literally "This is what?" — use it while pointing at any object you want to identify.',
    },
  },
  {
    kind: 'example',
    id: 'that',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: 'U narsa nima ekanini so‘rash',
      ru: 'Спросить, что это там',
      en: 'Ask what that is',
    },
    sentence: {
      zh: '那是什么？',
      pinyin: 'Nà shì shénme?',
      tr: {
        uz: 'Ana u nima?',
        ru: 'Что это там?',
        en: 'What is that?',
      },
    },
    body: {
      uz: '`那` — «ana u», `是` — «...dir», `什么` — «nima». So\'zma-so\'z: «Ana u — nima?»',
      ru: '`那` — «то», `是` — «есть/является», `什么` — «что». Дословно: «То есть что?»',
      en: '`那` = that, `是` = is, `什么` = what. Literally "That is what?"',
    },
  },
  {
    kind: 'example',
    id: 'name',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: {
      uz: "Ismni so'rash",
      ru: 'Спросить имя',
      en: "Ask someone's name",
    },
    sentence: {
      zh: '你叫什么名字？',
      pinyin: 'Nǐ jiào shénme míngzi?',
      tr: {
        uz: 'Ismingiz nima?',
        ru: 'Как вас зовут?',
        en: 'What is your name?',
      },
    },
    body: {
      uz: "`你` — «sen», `叫` — «atalmoq», `名字` — «ism». So'zma-so'z: «Sen qanday ism bilan atalasan?» — tayyor ibora sifatida yodlang.",
      ru: '`你` — «ты», `叫` — «называться», `名字` — «имя». Дословно: «Ты называешься каким именем?» Запоминайте как готовую фразу.',
      en: '`你` = you, `叫` = to be called, `名字` = name. Literally "You are called what name?" — memorize it as a set phrase.',
    },
  },
  {
    kind: 'practice',
    id: 'check',
    step: '05',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: {
      uz: '那是什么？',
      ru: '那是什么？',
      en: '那是什么？',
    },
    options: [
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-this',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是什么？', ru: '这是什么？', en: '这是什么？' },
    options: [
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-name',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你叫什么名字？', ru: '你叫什么名字？', en: '你叫什么名字？' },
    options: [
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 3,
  },
  {
    kind: 'scramble',
    id: 'scramble-this',
    step: '08',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
    tokens: [
      { zh: '这', pinyin: 'zhè' },
      { zh: '是', pinyin: 'shì' },
      { zh: '什么', pinyin: 'shénme' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-that',
    step: '09',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Ana u nima?', ru: 'Что это там?', en: 'What is that?' },
    tokens: [
      { zh: '那', pinyin: 'nà' },
      { zh: '是', pinyin: 'shì' },
      { zh: '什么', pinyin: 'shénme' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-name',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?' },
    tokens: [
      { zh: '你', pinyin: 'nǐ' },
      { zh: '叫', pinyin: 'jiào' },
      { zh: '什么', pinyin: 'shénme' },
      { zh: '名字', pinyin: 'míngzi' },
      { zh: '？', pinyin: '' },
    ],
  },
  {
    kind: 'practice',
    id: 'audio-that',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '那是什么？', ru: '那是什么？', en: '那是什么？' },
    audio: '那是什么',
    options: [
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-this',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是什么？', ru: '这是什么？', en: '这是什么？' },
    audio: '这是什么',
    options: [
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Ana u nima?',         ru: 'Что это там?',       en: 'What is that?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-name',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你叫什么名字？', ru: '你叫什么名字？', en: '你叫什么名字？' },
    audio: '你叫什么名字',
    options: [
      { uz: 'Ismingiz nima?',      ru: 'Как вас зовут?',     en: 'What is your name?' },
      { uz: 'Bu qanday rang?',     ru: 'Какой это цвет?',    en: 'What color is this?' },
      { uz: 'Bu nima?',            ru: 'Что это?',           en: 'What is this?' },
      { uz: 'Bu qanday kitob?',    ru: 'Какая это книга?',   en: 'What book is this?' },
    ],
    correct: 0,
  },
  {
    kind: 'recap',
    id: 'recap',
    step: '14',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: {
      uz: "3 ta foydali savol",
      ru: '3 полезных вопроса',
      en: '3 useful questions',
    },
    questions: [
      {
        zh: '这是什么？',
        pinyin: 'Zhè shì shénme?',
        tr: { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
      },
      {
        zh: '那是什么？',
        pinyin: 'Nà shì shénme?',
        tr: { uz: 'Ana u nima?', ru: 'Что это там?', en: 'What is that?' },
      },
      {
        zh: '你叫什么名字？',
        pinyin: 'Nǐ jiào shénme míngzi?',
        tr: { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?' },
      },
    ],
  },
];

export function GrammarShenmePolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [scrambleSel, setScrambleSel] = useState<Record<string, number[]>>({});

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const sceneIds = new Set([
    'this', 'that', 'name',
    'check', 'check-this', 'check-name',
    'audio-that', 'audio-this', 'audio-name',
  ]);
  const isSceneCard = sceneIds.has(card.id);
  const progress = ((index + 1) / cards.length) * 100;
  const t = (copy: Copy) => copy[language] ?? copy.uz;
  const quizAnswer = quizAnswers[card.id] ?? null;
  const isLastCard = index === cards.length - 1;
  const setCard = (nextIndex: number) => {
    setIndex(nextIndex);
  };
  const pickAnswer = (cardId: string, optionIndex: number) => {
    setQuizAnswers(prev => (prev[cardId] !== undefined ? prev : { ...prev, [cardId]: optionIndex }));
  };

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
      // If already selected, remove it (and anything after it)
      const pos = current.indexOf(tokenIdx);
      if (pos !== -1) {
        return { ...prev, [card.id]: current.slice(0, pos).concat(current.slice(pos + 1)) };
      }
      // Don't allow new picks once complete-and-correct (locked)
      if (scrambleCorrect) return prev;
      return { ...prev, [card.id]: [...current, tokenIdx] };
    });
  };

  const resetScramble = () => {
    setScrambleSel(prev => ({ ...prev, [card.id]: [] }));
  };
  const handleComplete = () => {
    const testCards = cards.filter(c => c.kind === 'practice' && c.correct !== undefined);
    const total = testCards.length;
    const correct = testCards.filter(c => quizAnswers[c.id] === c.correct).length;
    let stars = 0;
    if (total > 0) {
      if (correct === total) stars = 3;
      else if (correct / total >= 0.7) stars = 2;
      else if (correct > 0) stars = 1;
    }
    const existing = getStars('shenme');
    if (existing === undefined || stars > existing) saveStars('shenme', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      {/* Original grammar page hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">什么</div>
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
            HSK 1 · {language === 'ru' ? 'Грамматика' : language === 'en' ? 'Grammar' : 'Grammatika'}
          </div>
          <h1 className="dr-hero__title">什么</h1>
          <div className="dr-hero__pinyin">shénme</div>
          <div className="dr-hero__translation">
            — {language === 'ru' ? 'что?' : language === 'en' ? 'what?' : 'nima?'} —
          </div>
        </div>
      </div>

      {/* Progress + step map */}
      <div className="shenme-polished__hero">
        <div className="shenme-polished__progress">
          <div className="shenme-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>

      </div>

      <div className="shenme-polished__stage">
        <article className={`shenme-polished-card shenme-polished-card--${card.kind} shenme-polished-card--${card.id}${isSceneCard || card.id === 'meaning' ? ' shenme-polished-card--scene' : ''}`}>
          <div className="shenme-polished-card__header">
            <div className="shenme-polished-card__meta">
              <span className="shenme-polished-card__step">{card.step}</span>
              <span className="shenme-polished-card__kicker">{t(card.kicker)}</span>
            </div>
          </div>

          <div className="shenme-polished-card__main">
            {isSceneCard ? (
              (() => {
                const rubyEl =
                  card.id === 'this' || card.id === 'check-this' || card.id === 'audio-this' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shénme?">
                      <ruby>这<rt>zh&egrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : card.id === 'name' || card.id === 'check-name' || card.id === 'audio-name' ? (
                    <div className="shenme-polished-card__ruby-title" aria-label="Nǐ jiào shénme míngzi?">
                      <ruby>你<rt>n&#464;</rt></ruby>
                      <ruby>叫<rt>ji&agrave;o</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <ruby>名<rt>m&iacute;ng</rt></ruby>
                      <ruby>字<rt>zi</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  ) : (
                    <div className="shenme-polished-card__ruby-title" aria-label="Nà shì shénme?">
                      <ruby>那<rt>n&agrave;</rt></ruby>
                      <ruby>是<rt>sh&igrave;</rt></ruby>
                      <ruby>什<rt>sh&eacute;n</rt></ruby>
                      <ruby>么<rt>me</rt></ruby>
                      <span className="shenme-polished-card__ruby-punct">？</span>
                    </div>
                  );

                if (card.audio) {
                  return (
                    <div className="shenme-polished-card__title-stack">
                      <button
                        type="button"
                        className="shenme-polished-card__audio-btn"
                        onClick={() => playGrammarAudio(card.audio!)}
                        aria-label={t({ uz: "Tinglash", ru: 'Слушать', en: 'Listen' } as Copy)}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                      <div className="shenme-polished-card__audio-hint">
                        {t({ uz: "Bosib tinglang", ru: 'Нажмите, чтобы послушать', en: 'Tap to listen' } as Copy)}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="shenme-polished-card__title-stack">
                    {rubyEl}
                    {card.sentence ? (
                      <div className="shenme-polished-card__title-translation">{card.sentence.tr[language]}</div>
                    ) : null}
                    {card.kind === 'example' && card.body ? (
                      <p className="shenme-polished-card__meaning-body">{card.body[language]}</p>
                    ) : null}
                  </div>
                );
              })()
            ) : card.id === 'meaning' ? (
              <div className="shenme-polished-card__title-stack">
                <div className="shenme-polished-card__ruby-title" aria-label="shénme">
                  <ruby>什<rt>sh&eacute;n</rt></ruby>
                  <ruby>么<rt>me</rt></ruby>
                </div>
                <div className="shenme-polished-card__title-translation">
                  {language === 'ru' ? 'что?' : language === 'en' ? 'what?' : 'nima?'}
                </div>
                {card.body ? (
                  <p className="shenme-polished-card__meaning-body">{card.body[language]}</p>
                ) : null}
              </div>
            ) : (
              <h2 className="shenme-polished-card__title">{t(card.title)}</h2>
            )}

            {'formula' in card && card.formula && card.id !== 'meaning' ? (
              <div className="shenme-polished-card__formula">{typeof card.formula === 'string' ? card.formula : t(card.formula)}</div>
            ) : null}

            {'sentence' in card && card.sentence && !isSceneCard ? (
              <button
                type="button"
                className="shenme-polished-card__sentence"
                onClick={() => playGrammarAudio(card.sentence!.zh)}
              >
                <div className="shenme-polished-card__sentence-zh">{card.sentence.zh}</div>
                <div className="shenme-polished-card__sentence-py">{card.sentence.pinyin}</div>
                <div className="shenme-polished-card__sentence-tr">{card.sentence.tr[language]}</div>
              </button>
            ) : null}

            {'wrong' in card && card.wrong && 'right' in card && card.right ? (
              <div className="shenme-polished-card__contrast">
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--bad">
                  <strong>{language === 'ru' ? 'Неверно' : language === 'en' ? 'Wrong' : "Noto'g'ri"}</strong>
                  <span>{card.wrong}</span>
                </div>
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--good">
                  <strong>{language === 'ru' ? 'Верно' : language === 'en' ? 'Right' : "To'g'ri"}</strong>
                  <span>{card.right}</span>
                </div>
              </div>
            ) : null}

            {'options' in card && card.options ? (
              <>
                {card.prompt ? <div className="shenme-polished-card__prompt">{card.prompt[language]}</div> : null}
                <div className="shenme-polished-card__options">
                  {card.options.map((option, optionIndex) => {
                    const optionLabel = typeof option === 'string' ? option : option[language];
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

            {'bullets' in card && card.bullets ? (
              <div className="shenme-polished-card__bullets">
                {card.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="shenme-polished-card__bullet">
                    {bullet[language]}
                  </div>
                ))}
              </div>
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
                    <div className="shenme-polished-card__question-tr">{q.tr[language]}</div>
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
                      {language === 'ru' ? 'Нажмите слова ниже' : language === 'en' ? 'Tap words below' : 'Pastdagi so‘zlarni bosing'}
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
                      {language === 'ru' ? 'Попробовать ещё раз' : language === 'en' ? 'Try again' : 'Qaytadan'}
                    </button>
                  ) : null}
                  {scrambleCorrect ? (
                    <div className="scramble__success">
                      {language === 'ru' ? 'Верно!' : language === 'en' ? 'Correct!' : "To'g'ri!"}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="shenme-polished-card__footer">
            {'body' in card && card.body && card.kind !== 'example' && card.id !== 'meaning' ? (
              <p className="shenme-polished-card__body">{card.body[language]}</p>
            ) : null}
            {'note' in card && card.note ? (
              <div className="shenme-polished-card__note">{card.note[language]}</div>
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
          {language === 'ru' ? 'Назад' : language === 'en' ? 'Back' : 'Orqaga'}
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
            ? (language === 'ru' ? 'Завершить' : language === 'en' ? 'Complete' : 'Tugatish')
            : (language === 'ru' ? 'Дальше' : language === 'en' ? 'Next' : 'Keyingi')}
        </button>
      </div>

      <PageFooter />
    </div>
  );
}
