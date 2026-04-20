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
    title: { uz: '是 = ...dir, bo\'lmoq', ru: '是 = быть', en: '是 = to be' },
    body: {
      uz: "`是` (shì) — xitoy tilida bog'lovchi fe'l bo'lib «A 是 B» = «A bu B» ya'ni «Men — talabaman», «Bu — kitob» kabi gaplarda ishlatiladi.",
      ru: '`是` (shì) — глагол-связка. Используется в предложениях вида «А есть B»: «Я студент», «Это книга». Строится как «A 是 B».',
      en: '`是` (shì) is the linking verb "to be". It connects "A is B" sentences: "I am a student", "This is a book". Pattern: `A + 是 + B`.',
    },
    formula: {
      uz: 'A + 是 + B',
      ru: 'A + 是 + B',
      en: 'A + 是 + B',
    },
  },

  /* ─ 02-06: five example scene cards ─ */
  {
    kind: 'example',
    id: 'student',
    step: '02',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '我是学生。', ru: '我是学生。', en: '我是学生。' },
    sentence: {
      zh: '我是学生。',
      pinyin: 'Wǒ shì xuéshēng.',
      tr: { uz: 'Men talabaman.', ru: 'Я студент.', en: 'I am a student.' },
    },
    body: {
      uz: "`我` — «men», `是` — «man», `学生` — «talaba». So'zma-so'z: «Men man talaba».",
      ru: '`我` — «я», `学生` — «студент». Дословно: «Я есть студент».',
      en: '`我` = I, `学生` = student. Literally "I am student."',
    },
  },
  {
    kind: 'example',
    id: 'teacher',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '他是老师。', ru: '他是老师。', en: '他是老师。' },
    sentence: {
      zh: '他是老师。',
      pinyin: 'Tā shì lǎoshī.',
      tr: { uz: 'U o\'qituvchi.', ru: 'Он учитель.', en: 'He is a teacher.' },
    },
    body: {
      uz: "`他` — «u» (erkak), `是` — «dir», `老师` — «o'qituvchi». So'zma-so'z: «U dir o'qituvchi». Shablon o'sha-o'sha: A + 是 + B.",
      ru: '`他` — «он», `老师` — «учитель». Модель та же: A + 是 + B.',
      en: '`他` = he, `老师` = teacher. Same pattern: A + 是 + B.',
    },
  },
  {
    kind: 'example',
    id: 'chinese',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '她是中国人。', ru: '她是中国人。', en: '她是中国人。' },
    sentence: {
      zh: '她是中国人。',
      pinyin: 'Tā shì Zhōngguórén.',
      tr: { uz: 'U Xitoylik.', ru: 'Она китаянка.', en: 'She is Chinese.' },
    },
    body: {
      uz: "`她` — «u» (ayol), `是` — «dir», `中国` — «Xitoy», `人` — «odam». So'zma-so'z: «U dir Xitoy odam» ya'ni «U Xitoylik».",
      ru: '`她` — «она», `中国` — «Китай», `人` — «человек». `中国人` — «китаец/китаянка».',
      en: '`她` = she, `中国` = China, `人` = person. `中国人` = Chinese person.',
    },
  },
  {
    kind: 'example',
    id: 'book',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '这是书。', ru: '这是书。', en: '这是书。' },
    sentence: {
      zh: '这是书。',
      pinyin: 'Zhè shì shū.',
      tr: { uz: 'Bu kitob.', ru: 'Это книга.', en: 'This is a book.' },
    },
    body: {
      uz: "`这` — «bu», `是` — «dir», `书` — «kitob». Demak `是` nafaqat odamlar uchun balki jonsiz narsalarni ham tasvirlash uchun ishlaydi.",
      ru: '`这` — «это», `书` — «книга». `是` работает и с людьми, и с предметами.',
      en: '`这` = this, `书` = book. `是` works for both people and objects.',
    },
  },

  /* ─ 06-09: four visual tests ─ */
  {
    kind: 'practice',
    id: 'check-student',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我是学生。', ru: '我是学生。', en: '我是学生。' },
    options: [
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-teacher',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '他是老师。', ru: '他是老师。', en: '他是老师。' },
    options: [
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'check-chinese',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '她是中国人。', ru: '她是中国人。', en: '她是中国人。' },
    options: [
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-book',
    step: '09',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '这是书。', ru: '这是书。', en: '这是书。' },
    options: [
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
    ],
    correct: 3,
  },

  /* ─ 10-13: four audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-student',
    step: '10',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我是学生。', ru: '我是学生。', en: '我是学生。' },
    audio: '我是学生',
    options: [
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-teacher',
    step: '11',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '他是老师。', ru: '他是老师。', en: '他是老师。' },
    audio: '他是老师',
    options: [
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-chinese',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '她是中国人。', ru: '她是中国人。', en: '她是中国人。' },
    audio: '她是中国人',
    options: [
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
    ],
    correct: 3,
  },
  {
    kind: 'practice',
    id: 'audio-book',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '这是书。', ru: '这是书。', en: '这是书。' },
    audio: '这是书',
    options: [
      { uz: 'Bu kitob.',           ru: 'Это книга.',         en: 'This is a book.' },
      { uz: 'U Xitoylik.',         ru: 'Она китаянка.',      en: 'She is Chinese.' },
      { uz: 'Men talabaman.',      ru: 'Я студент.',         en: 'I am a student.' },
      { uz: 'U o\'qituvchi.',      ru: 'Он учитель.',        en: 'He is a teacher.' },
    ],
    correct: 0,
  },

  /* ─ 14 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '14',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '4 ta asosiy gap', ru: '4 ключевых предложения', en: '4 key sentences' },
    questions: [
      {
        zh: '我是学生。',
        pinyin: 'Wǒ shì xuéshēng.',
        tr: { uz: 'Men talabaman.', ru: 'Я студент.', en: 'I am a student.' },
      },
      {
        zh: '他是老师。',
        pinyin: 'Tā shì lǎoshī.',
        tr: { uz: 'U o\'qituvchi.', ru: 'Он учитель.', en: 'He is a teacher.' },
      },
      {
        zh: '她是中国人。',
        pinyin: 'Tā shì Zhōngguórén.',
        tr: { uz: 'U Xitoylik.', ru: 'Она китаянка.', en: 'She is Chinese.' },
      },
      {
        zh: '这是书。',
        pinyin: 'Zhè shì shū.',
        tr: { uz: 'Bu kitob.', ru: 'Это книга.', en: 'This is a book.' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarShiPolishedPage() {
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
    const existing = getStars('shi');
    if (existing === undefined || stars > existing) saveStars('shi', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  /* ─ Ruby element mapping ─ */
  const rubyByPhrase: Record<string, React.ReactNode> = {
    student: (
      <div className="shenme-polished-card__ruby-title" aria-label="Wǒ shì xuéshēng.">
        <ruby>我<rt>w&#466;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>学<rt>xu&eacute;</rt></ruby>
        <ruby>生<rt>sh&#275;ng</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    teacher: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā shì lǎoshī.">
        <ruby>他<rt>t&#257;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>老<rt>l&#462;o</rt></ruby>
        <ruby>师<rt>sh&#299;</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    chinese: (
      <div className="shenme-polished-card__ruby-title" aria-label="Tā shì Zhōngguórén.">
        <ruby>她<rt>t&#257;</rt></ruby>
        <ruby>是<rt>sh&igrave;</rt></ruby>
        <ruby>中<rt>zh&#333;ng</rt></ruby>
        <ruby>国<rt>gu&oacute;</rt></ruby>
        <ruby>人<rt>r&eacute;n</rt></ruby>
        <span className="shenme-polished-card__ruby-punct">。</span>
      </div>
    ),
    book: (
      <div className="shenme-polished-card__ruby-title" aria-label="Zhè shì shū.">
        <ruby>这<rt>zh&egrave;</rt></ruby>
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
        <div className="dr-hero__watermark">是</div>
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
          <h1 className="dr-hero__title">是</h1>
          <div className="dr-hero__pinyin">shì</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'быть' : lang === 'en' ? 'to be' : "...dir, bo'lmoq"} —
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
                <div className="shenme-polished-card__ruby-title" aria-label="shì">
                  <ruby>是<rt>sh&igrave;</rt></ruby>
                </div>
                <div className="shenme-polished-card__title-translation">
                  {lang === 'ru' ? 'быть' : lang === 'en' ? 'to be' : "...dir, bo'lmoq"}
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
