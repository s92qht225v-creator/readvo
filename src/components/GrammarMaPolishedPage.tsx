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
      kind: 'rule' | 'example' | 'contrast' | 'practice' | 'recap';
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
    };

const cards: Card[] = [
  /* ─ 01 meaning ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '吗 = -mi?', ru: '吗 = ли?', en: '吗 = ? (yes/no)' },
    body: {
      uz: "`吗` (ma) — so'roq yuklamasi bo'lib uni gap oxiriga qo'shsangiz, darak gap ha/yo'q savoliga aylanadi. Masalan: «你是学生» (Sen talabasan) → «你是学生吗？» (Sen talabamisan?).",
      ru: '`吗` (ma) — вопросительная частица. Поставьте её в конце утверждения, и оно превратится в вопрос «да/нет». Например: «你是学生» (Ты студент) → «你是学生吗？» (Ты студент?).',
      en: '`吗` (ma) is a question particle. Add it at the end of a statement to turn it into a yes/no question. Example: "你是学生" (You are a student) → "你是学生吗？" (Are you a student?).',
    },
    formula: {
      uz: "Darak gap + 吗？",
      ru: 'Утверждение + 吗？',
      en: 'statement + 吗?',
    },
  },

  /* ─ 02-05: four example scene cards ─ */
  {
    kind: 'example',
    id: 'how-are-you',
    step: '02',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '你好吗？', ru: '你好吗？', en: '你好吗？' },
    sentence: {
      zh: '你好吗？',
      pinyin: 'Nǐ hǎo ma?',
      tr: { uz: 'Qalaysiz?', ru: 'Как у тебя дела?', en: 'How are you?' },
    },
    body: {
      uz: "`你` — «sen, siz», `好` — «yaxshi», `吗` — so'roq yuklamasi. So'zma-so'z: «Sen yaxshi mi?» ya'ni «Yaxshimisan?» — eng oddiy salomlashuv.",
      ru: '`你` — «ты», `好` — «хорошо», `吗` — вопросительная частица. Дословно: «Ты хорошо?» — самое простое приветствие.',
      en: '`你` = you, `好` = good, `吗` = question particle. Literally "You good?" — the most basic greeting question.',
    },
  },
  {
    kind: 'example',
    id: 'are-student',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '你是学生吗？', ru: '你是学生吗？', en: '你是学生吗？' },
    sentence: {
      zh: '你是学生吗？',
      pinyin: 'Nǐ shì xuéshēng ma?',
      tr: { uz: 'Sen talabamisan?', ru: 'Ты студент?', en: 'Are you a student?' },
    },
    body: {
      uz: "Darak gap «你是学生» (Sen talabasan) oxiriga `吗` qo'shib savolga aylantirdik. Tartib o'zgarmaydi.",
      ru: 'Добавляем `吗` в конец утверждения «你是学生» (Ты студент), и оно становится вопросом. Порядок слов не меняется.',
      en: 'Add `吗` to the end of the statement "你是学生" (You are a student) and it becomes a question. Word order stays the same.',
    },
  },
  {
    kind: 'example',
    id: 'is-teacher',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '她是老师吗？', ru: '她是老师吗？', en: '她是老师吗？' },
    sentence: {
      zh: '她是老师吗？',
      pinyin: 'Tā shì lǎoshī ma?',
      tr: { uz: 'U o\'qituvchimi?', ru: 'Она учительница?', en: 'Is she a teacher?' },
    },
    body: {
      uz: "Uchinchi shaxs haqida so'rash uchun ham xuddi shunday — darak gap + `吗`.",
      ru: 'Чтобы спросить о ком-то в третьем лице — та же схема: утверждение + `吗`.',
      en: 'Asking about someone else works the same way: statement + `吗`.',
    },
  },
  {
    kind: 'example',
    id: 'are-chinese',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '你是中国人吗？', ru: '你是中国人吗？', en: '你是中国人吗？' },
    sentence: {
      zh: '你是中国人吗？',
      pinyin: 'Nǐ shì Zhōngguórén ma?',
      tr: { uz: 'Sen Xitoylikmisan?', ru: 'Ты китаец?', en: 'Are you Chinese?' },
    },
    body: {
      uz: "`中国人` — «Xitoylik». Millati haqida so'rashda ham xuddi o'sha qolip: darak gap + `吗`.",
      ru: '`中国人` — «китаец/китаянка». Спросить о национальности — та же модель: утверждение + `吗`.',
      en: '`中国人` = Chinese (person). To ask about nationality, same pattern: statement + `吗`.',
    },
  },

  /* ─ 06-09: four visual tests ─ */
  {
    kind: 'practice',
    id: 'check-how-are-you',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你好吗？', ru: '你好吗？', en: '你好吗？' },
    options: [
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-are-student',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你是学生吗？', ru: '你是学生吗？', en: '你是学生吗？' },
    options: [
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-is-teacher',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '她是老师吗？', ru: '她是老师吗？', en: '她是老师吗？' },
    options: [
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-are-chinese',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '你是中国人吗？', ru: '你是中国人吗？', en: '你是中国人吗？' },
    options: [
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
    ],
    correct: 3,
  },

  /* ─ 10-13: four audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-how-are-you',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你好吗？', ru: '你好吗？', en: '你好吗？' },
    audio: '你好吗',
    options: [
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-are-student',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你是学生吗？', ru: '你是学生吗？', en: '你是学生吗？' },
    audio: '你是学生吗',
    options: [
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-is-teacher',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '她是老师吗？', ru: '她是老师吗？', en: '她是老师吗？' },
    audio: '她是老师吗',
    options: [
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
    ],
    correct: 3,
  },
  {
    kind: 'practice',
    id: 'audio-are-chinese',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '你是中国人吗？', ru: '你是中国人吗？', en: '你是中国人吗？' },
    audio: '你是中国人吗',
    options: [
      { uz: 'Sen Xitoylikmisan?',  ru: 'Ты китаец?',         en: 'Are you Chinese?' },
      { uz: 'Sen talabamisan?',    ru: 'Ты студент?',        en: 'Are you a student?' },
      { uz: 'U o\'qituvchimi?',    ru: 'Она учительница?',   en: 'Is she a teacher?' },
      { uz: 'Qalaysiz?',           ru: 'Как у тебя дела?',   en: 'How are you?' },
    ],
    correct: 0,
  },

  /* ─ 14 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '14',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '4 ta asosiy savol', ru: '4 ключевых вопроса', en: '4 key questions' },
    questions: [
      {
        zh: '你好吗？',
        pinyin: 'Nǐ hǎo ma?',
        tr: { uz: 'Qalaysiz?', ru: 'Как у тебя дела?', en: 'How are you?' },
      },
      {
        zh: '你是学生吗？',
        pinyin: 'Nǐ shì xuéshēng ma?',
        tr: { uz: 'Sen talabamisan?', ru: 'Ты студент?', en: 'Are you a student?' },
      },
      {
        zh: '她是老师吗？',
        pinyin: 'Tā shì lǎoshī ma?',
        tr: { uz: 'U o\'qituvchimi?', ru: 'Она учительница?', en: 'Is she a teacher?' },
      },
      {
        zh: '你是中国人吗？',
        pinyin: 'Nǐ shì Zhōngguórén ma?',
        tr: { uz: 'Sen Xitoylikmisan?', ru: 'Ты китаец?', en: 'Are you Chinese?' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarMaPolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const sceneIds = new Set<string>([
    'how-are-you', 'are-student', 'is-teacher', 'are-chinese',
    'check-how-are-you', 'check-are-student', 'check-is-teacher', 'check-are-chinese',
    'audio-how-are-you', 'audio-are-student', 'audio-is-teacher', 'audio-are-chinese',
  ]);
  const isSceneCard = sceneIds.has(card.id);
  const progress = ((index + 1) / cards.length) * 100;
  const lang = language as Lang;
  const t = (copy: Copy) => copy[lang] ?? copy.uz;
  const quizAnswer = quizAnswers[card.id] ?? null;
  const isLastCard = index === cards.length - 1;
  const setCard = (nextIndex: number) => setIndex(nextIndex);
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
    const existing = getStars('ma');
    if (existing === undefined || stars > existing) saveStars('ma', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    'how-are-you': (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǐ hǎo ma?">
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>好<rt>h&#462;o</rt></ruby>
        <ruby>吗<rt>ma</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    'are-student': (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǐ shì xuéshēng ma?">
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>学<rt>xu&eacute;</rt></ruby>
        <ruby>生<rt>sh&#275;ng</rt></ruby>
        <ruby>吗<rt>ma</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    'is-teacher': (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā shì lǎoshī ma?">
        <ruby>她<rt>t&#257;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>老<rt>l&#462;o</rt></ruby>
        <ruby>师<rt>sh&#299;</rt></ruby>
        <ruby>吗<rt>ma</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">？</span>
      </div>
    ),
    'are-chinese': (
      <div className="shenme-polished-card__ruby-title" aria-label="Nǐ shì Zhōngguórén ma?">
        <ruby>你<rt>n&#464;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>中<rt>zh&#333;ng</rt></ruby>
        <ruby>国<rt>gu&oacute;</rt></ruby>
        <ruby>人<rt>r&eacute;n</rt></ruby>
        <ruby>吗<rt>ma</rt></ruby>
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
        <div className="dr-hero__watermark">吗</div>
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
          <h1 className="dr-hero__title">吗</h1>
          <div className="dr-hero__pinyin">ma</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'ли?' : lang === 'en' ? '? (yes/no)' : "-mi?"} —
          </div>
        </div>
      </div>

      {/* Progress + step map */}
      <div className="shenme-polished__hero">
        <div className="shenme-polished__progress">
          <div className="shenme-polished__progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="shenme-polished__map">
          {cards.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={`shenme-polished__map-dot ${itemIndex === index ? 'shenme-polished__map-dot--active' : ''}`}
              onClick={() => setCard(itemIndex)}
              aria-label={item.step}
            >
              {item.step}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div className="shenme-polished__stage">
        <article className={`shenme-polished-card shenme-polished-card--${card.kind} shenme-polished-card--${card.id}${isSceneCard || card.id === 'meaning' ? ' shenme-polished-card--scene' : ''}`}>
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
                </div>
              )
            ) : card.id === 'meaning' ? (
              <div className="shenme-polished-card__title-stack">
                <div className="shenme-polished-card__ruby-title" aria-label="ma">
                  <ruby>吗<rt>ma</rt></ruby>
                </div>
                <div className="shenme-polished-card__title-translation">
                  {lang === 'ru' ? 'ли?' : lang === 'en' ? '? (yes/no)' : "-mi?"}
                </div>
              </div>
            ) : (
              <h2 className="shenme-polished-card__title">{t(card.title)}</h2>
            )}

            {'formula' in card && card.formula && card.id !== 'meaning' ? (
              <div className="shenme-polished-card__formula">
                {typeof card.formula === 'string' ? card.formula : t(card.formula)}
              </div>
            ) : null}

            {'wrong' in card && card.wrong && 'right' in card && card.right ? (
              <div className="shenme-polished-card__contrast">
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--bad">
                  <strong>{lang === 'ru' ? 'Неверно' : lang === 'en' ? 'Wrong' : "Noto'g'ri"}</strong>
                  <span>{card.wrong}</span>
                </div>
                <div className="shenme-polished-card__contrast-box shenme-polished-card__contrast-box--good">
                  <strong>{lang === 'ru' ? 'Верно' : lang === 'en' ? 'Right' : "To'g'ri"}</strong>
                  <span>{card.right}</span>
                </div>
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

            {'bullets' in card && card.bullets ? (
              <div className="shenme-polished-card__bullets">
                {card.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="shenme-polished-card__bullet">
                    {bullet[lang]}
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
                    <div className="shenme-polished-card__question-tr">{q.tr[lang]}</div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="shenme-polished-card__footer">
            {'body' in card && card.body ? (
              <p className="shenme-polished-card__body">{card.body[lang]}</p>
            ) : null}
            {'note' in card && card.note ? (
              <div className="shenme-polished-card__note">{card.note[lang]}</div>
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
          disabled={card.kind === 'practice' && !!card.options && quizAnswer === null}
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
