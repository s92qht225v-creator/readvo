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
    title: { uz: '不是 = emas', ru: '不是 = не быть', en: '不是 = is not' },
    body: {
      uz: "`不是` bu `是` ning inkor shakli bo'lib `是` oldiga `不` qo'shilganda «我是学生» (Men talabaman) → «我不是学生» (Men talaba emasman) ga aylanib qoladi.",
      ru: '`不是` (bú shì) — отрицательная форма `是`. Ставим `不` перед `是` — получается «не быть». Например: «我是学生» (Я студент) → «我不是学生» (Я не студент). Обратите внимание: `不` перед 4-м тоном `是` меняется на 2-й тон (bú).',
      en: '`不是` (bú shì) is the negation of `是`. Put `不` before `是` to mean "is not". Example: "我是学生" (I am a student) → "我不是学生" (I am not a student). Note: `不` becomes 2nd tone (bú) before the 4th-tone `是`.',
    },
    formula: {
      uz: 'A + 不是 + B',
      ru: 'A + 不是 + B',
      en: 'A + 不是 + B',
    },
  },

  /* ─ 02-05: four example scene cards ─ */
  {
    kind: 'example',
    id: 'student',
    step: '02',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '我不是学生。', ru: '我不是学生。', en: '我不是学生。' },
    sentence: {
      zh: '我不是学生。',
      pinyin: 'Wǒ bú shì xuéshēng.',
      tr: { uz: 'Men talaba emasman.', ru: 'Я не студент.', en: 'I am not a student.' },
    },
    body: {
      uz: "«我是学生» ga `不` qo'shib: «我不是学生». So'zma-so'z: «Men emasman talaba» ya'ni «Men talaba emasman» ga aylantirdik.",
      ru: 'К «我是学生» добавили `不`: «我不是学生». Дословно: «Я не студент».',
      en: 'Added `不` to "我是学生": "我不是学生". Literally "I not am student" → "I am not a student."',
    },
  },
  {
    kind: 'example',
    id: 'teacher',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '他不是老师。', ru: '他不是老师。', en: '他不是老师。' },
    sentence: {
      zh: '他不是老师。',
      pinyin: 'Tā bú shì lǎoshī.',
      tr: { uz: 'U o\'qituvchi emas.', ru: 'Он не учитель.', en: 'He is not a teacher.' },
    },
    body: {
      uz: "`他` — «u» (erkak), `不是老师` — «o'qituvchi emas». Shablon o'sha-o'sha: A + 不是 + B.",
      ru: '`他` — «он», `不是老师` — «не учитель». Модель та же: A + 不是 + B.',
      en: '`他` = he, `不是老师` = not a teacher. Same pattern: A + 不是 + B.',
    },
  },
  {
    kind: 'example',
    id: 'chinese',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '她不是中国人。', ru: '她不是中国人。', en: '她不是中国人。' },
    sentence: {
      zh: '她不是中国人。',
      pinyin: 'Tā bú shì Zhōngguórén.',
      tr: { uz: 'U Xitoylik emas.', ru: 'Она не китаянка.', en: 'She is not Chinese.' },
    },
    body: {
      uz: "Ushbu misolda ham xuddi shunday: `不是` + `中国人` (Xitoylik emas).",
      ru: 'Отрицание национальности — так же: `不是` + `中国人` (китаец).',
      en: 'Negating nationality works the same: `不是` + `中国人` (Chinese).',
    },
  },
  {
    kind: 'example',
    id: 'book',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '这不是书。', ru: '这不是书。', en: '这不是书。' },
    sentence: {
      zh: '这不是书。',
      pinyin: 'Zhè bú shì shū.',
      tr: { uz: 'Bu kitob emas.', ru: 'Это не книга.', en: 'This is not a book.' },
    },
    body: {
      uz: "`这不是书`: «Bu — kitob emas». Jonsiz narsalar bilan ham xuddi shunday ishlaydi.",
      ru: '`这不是书`: «Это не книга». Работает и с предметами.',
      en: '`这不是书`: "This is not a book." Works with objects too.',
    },
  },

  /* ─ 06-09: four visual tests ─ */
  {
    kind: 'practice',
    id: 'check-student',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我不是学生。', ru: '我不是学生。', en: '我不是学生。' },
    options: [
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-teacher',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '他不是老师。', ru: '他不是老师。', en: '他不是老师。' },
    options: [
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-chinese',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '她不是中国人。', ru: '她不是中国人。', en: '她不是中国人。' },
    options: [
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-book',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这不是书。', ru: '这不是书。', en: '这不是书。' },
    options: [
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
    ],
    correct: 3,
  },

  /* ─ 10-13: four audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-student',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我不是学生。', ru: '我不是学生。', en: '我不是学生。' },
    audio: '我不是学生',
    options: [
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-teacher',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '他不是老师。', ru: '他不是老师。', en: '他不是老师。' },
    audio: '他不是老师',
    options: [
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-chinese',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '她不是中国人。', ru: '她不是中国人。', en: '她不是中国人。' },
    audio: '她不是中国人',
    options: [
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
    ],
    correct: 3,
  },
  {
    kind: 'practice',
    id: 'audio-book',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这不是书。', ru: '这不是书。', en: '这不是书。' },
    audio: '这不是书',
    options: [
      { uz: 'Bu kitob emas.',         ru: 'Это не книга.',         en: 'This is not a book.' },
      { uz: 'U Xitoylik emas.',       ru: 'Она не китаянка.',      en: 'She is not Chinese.' },
      { uz: 'Men talaba emasman.',    ru: 'Я не студент.',         en: 'I am not a student.' },
      { uz: 'U o\'qituvchi emas.',    ru: 'Он не учитель.',        en: 'He is not a teacher.' },
    ],
    correct: 0,
  },

  /* ─ 14 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '14',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '4 ta inkor gap', ru: '4 отрицательных предложения', en: '4 negative sentences' },
    questions: [
      {
        zh: '我不是学生。',
        pinyin: 'Wǒ bú shì xuéshēng.',
        tr: { uz: 'Men talaba emasman.', ru: 'Я не студент.', en: 'I am not a student.' },
      },
      {
        zh: '他不是老师。',
        pinyin: 'Tā bú shì lǎoshī.',
        tr: { uz: 'U o\'qituvchi emas.', ru: 'Он не учитель.', en: 'He is not a teacher.' },
      },
      {
        zh: '她不是中国人。',
        pinyin: 'Tā bú shì Zhōngguórén.',
        tr: { uz: 'U Xitoylik emas.', ru: 'Она не китаянка.', en: 'She is not Chinese.' },
      },
      {
        zh: '这不是书。',
        pinyin: 'Zhè bú shì shū.',
        tr: { uz: 'Bu kitob emas.', ru: 'Это не книга.', en: 'This is not a book.' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarBushiPolishedPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const [index, setIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  if (isLoading) return <div className="loading-spinner" />;

  const card = cards[index];
  const sceneIds = new Set<string>([
    'student', 'teacher', 'chinese', 'book',
    'check-student', 'check-teacher', 'check-chinese', 'check-book',
    'audio-student', 'audio-teacher', 'audio-chinese', 'audio-book',
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
    const existing = getStars('bushi');
    if (existing === undefined || stars > existing) saveStars('bushi', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    student: (
      <div className="shenme-polished-card__ruby-title" aria-label="Wǒ bú shì xuéshēng.">
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>不<rt>b&uacute;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>学<rt>xu&eacute;</rt></ruby>
        <ruby>生<rt>sh&#275;ng</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    teacher: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā bú shì lǎoshī.">
        <ruby>他<rt>t&#257;</rt></ruby>
        <ruby>不<rt>b&uacute;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>老<rt>l&#462;o</rt></ruby>
        <ruby>师<rt>sh&#299;</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    chinese: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā bú shì Zhōngguórén.">
        <ruby>她<rt>t&#257;</rt></ruby>
        <ruby>不<rt>b&uacute;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>中<rt>zh&#333;ng</rt></ruby>
        <ruby>国<rt>gu&oacute;</rt></ruby>
        <ruby>人<rt>r&eacute;n</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    book: (
      <div className="shenme-polished-card__ruby-title" aria-label="Zhè bú shì shū.">
        <ruby>这<rt>zh&egrave;</rt></ruby>
        <ruby>不<rt>b&uacute;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>书<rt>sh&#363;</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
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
        <div className="dr-hero__watermark">不是</div>
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
          <h1 className="dr-hero__title">不是</h1>
          <div className="dr-hero__pinyin">bú shì</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'не быть' : lang === 'en' ? 'is not' : 'emas'} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="bú shì">
                  <ruby>不<rt>b&uacute;</rt></ruby>
                  <ruby>是<rt>sh&igrave;</rt></ruby>
                </div>
                <div className="shenme-polished-card__title-translation">
                  {lang === 'ru' ? 'не быть' : lang === 'en' ? 'is not' : 'emas'}
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
