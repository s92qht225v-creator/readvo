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
  /* ─ 01 rule: meaning ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: '很 = juda / (bog‘lovchi yuklama)',
      ru: '很 = очень / (связочная частица)',
      en: '很 = very / (linking particle)',
    },
  },
  /* ─ 02 rule: formula ─ */
  {
    kind: 'rule',
    id: 'meaning-2',
    step: '02',
    kicker: { uz: 'Shablon', ru: 'Шаблон', en: 'Pattern' },
    title: { uz: 'Ega + 很 + sifat', ru: 'Подлежащее + 很 + прилагательное', en: 'Subject + 很 + adjective' },
    body: {
      uz: "Masalan: 我很好。\n(Wǒ hěn hǎo.)\nMen yaxshiman.\n\nBu gapda 很 «juda» ma'nosida emas, balki ega va sifatni bog'lovchi vazifasida kelyapti.",
      ru: 'Например: 我很好。\n(Wǒ hěn hǎo.)\nУ меня всё хорошо.\n\nВ этом предложении 很 не означает «очень», а выступает как связка между подлежащим и прилагательным.',
      en: 'For example: 我很好。\n(Wǒ hěn hǎo.)\nI am fine.\n\nIn this sentence 很 does not mean "very" — it functions as a link between the subject and the adjective.',
    },
  },
  /* ─ 03 summary: 是 vs 很 ─ */
  {
    kind: 'rule',
    id: 'meaning-5',
    step: '03',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Summary' },
    title: { uz: '是 va 很', ru: '是 и 很', en: '是 vs 很' },
    body: {
      uz: "Ega va otni bog'lash uchun 是 ishlatiladi:\n我是学生。(Wǒ shì xuéshēng.) — Men talabaman.\n\nEga va sifatni bog'lash uchun 很 ishlatiladi:\n我很好。(Wǒ hěn hǎo.) — Men yaxshiman.",
      ru: 'Для связи подлежащего с существительным используется 是:\n我是学生。(Wǒ shì xuéshēng.) — Я студент.\n\nДля связи подлежащего с прилагательным используется 很:\n我很好。(Wǒ hěn hǎo.) — У меня всё хорошо.',
      en: 'To link a subject with a noun — use 是:\n我是学生。(Wǒ shì xuéshēng.) — I am a student.\n\nTo link a subject with an adjective — use 很:\n我很好。(Wǒ hěn hǎo.) — I am fine.',
    },
  },
  /* ─ 04 breakdown: 她很漂亮 ─ */
  {
    kind: 'rule',
    id: 'meaning-3',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Tā hěn piàoliang.)\nU chiroyli.\n\n她 (tā) — u (ayol)\n很 (hěn) — bog'lovchi\n漂亮 (piàoliang) — chiroyli",
      ru: '(Tā hěn piàoliang.)\nОна красивая.\n\n她 (tā) — она\n很 (hěn) — связка\n漂亮 (piàoliang) — красивый',
      en: '(Tā hěn piàoliang.)\nShe is beautiful.\n\n她 (tā) — she\n很 (hěn) — linker\n漂亮 (piàoliang) — beautiful',
    },
  },
  /* ─ 05 breakdown: 他很忙 ─ */
  {
    kind: 'rule',
    id: 'meaning-4',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: '', ru: '', en: '' },
    body: {
      uz: "(Tā hěn máng.)\nU band.\n\n他 (tā) — u\n很 (hěn) — bog'lovchi\n忙 (máng) — band",
      ru: '(Tā hěn máng.)\nОн занят.\n\n他 (tā) — он\n很 (hěn) — связка\n忙 (máng) — занятый',
      en: '(Tā hěn máng.)\nHe is busy.\n\n他 (tā) — he\n很 (hěn) — linker\n忙 (máng) — busy',
    },
  },

  /* ─ 06-08: three multiple-choice checks ─ */
  {
    kind: 'practice',
    id: 'check-hao',
    step: '06',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '我很好。', ru: '我很好。', en: '我很好。' },
    options: [
      { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      { uz: 'Men bandman.', ru: 'Я занят.', en: 'I am busy.' },
      { uz: 'Men balandman.', ru: 'Я высокий.', en: 'I am tall.' },
      { uz: 'U yaxshi.', ru: 'Он хороший.', en: 'He is good.' },
    ],
    correct: 0,
  },
  {
    kind: 'practice',
    id: 'check-piaoliang',
    step: '07',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '她很漂亮。', ru: '她很漂亮。', en: '她很漂亮。' },
    options: [
      { uz: 'U juda band.', ru: 'Она очень занята.', en: 'She is very busy.' },
      { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.' },
      { uz: 'U juda yaxshi.', ru: 'Она очень хорошая.', en: 'She is very good.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'check-mang',
    step: '08',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: { uz: '他很忙。', ru: '他很忙。', en: '他很忙。' },
    options: [
      { uz: 'U juda chiroyli.', ru: 'Он очень красивый.', en: 'He is very handsome.' },
      { uz: 'U juda band.', ru: 'Он очень занят.', en: 'He is very busy.' },
      { uz: 'U yaxshi.', ru: 'Он хороший.', en: 'He is good.' },
      { uz: 'Men bandman.', ru: 'Я занят.', en: 'I am busy.' },
    ],
    correct: 1,
  },

  /* ─ 08-10: three scramble tests ─ */
  {
    kind: 'scramble',
    id: 'scramble-hao',
    step: '09',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
    tokens: [
      { zh: '我', pinyin: 'wǒ' },
      { zh: '很', pinyin: 'hěn' },
      { zh: '好', pinyin: 'hǎo' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-piaoliang',
    step: '10',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.' },
    tokens: [
      { zh: '她', pinyin: 'tā' },
      { zh: '很', pinyin: 'hěn' },
      { zh: '漂亮', pinyin: 'piàoliang' },
      { zh: '。', pinyin: '' },
    ],
  },
  {
    kind: 'scramble',
    id: 'scramble-mang',
    step: '11',
    kicker: { uz: 'Terib chiqing', ru: 'Соберите', en: 'Build it' },
    title: { uz: 'U juda band.', ru: 'Он очень занят.', en: 'He is very busy.' },
    tokens: [
      { zh: '他', pinyin: 'tā' },
      { zh: '很', pinyin: 'hěn' },
      { zh: '忙', pinyin: 'máng' },
      { zh: '。', pinyin: '' },
    ],
  },

  /* ─ 11-13: three audio tests ─ */
  {
    kind: 'practice',
    id: 'audio-hao',
    step: '12',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '我很好。', ru: '我很好。', en: '我很好。' },
    audio: '我很好。',
    options: [
      { uz: 'U juda baland.', ru: 'Он очень высокий.', en: 'He is very tall.' },
      { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      { uz: 'U juda band.', ru: 'Она очень занята.', en: 'She is very busy.' },
      { uz: 'Men bandman.', ru: 'Я занят.', en: 'I am busy.' },
    ],
    correct: 1,
  },
  {
    kind: 'practice',
    id: 'audio-piaoliang',
    step: '13',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '她很漂亮。', ru: '她很漂亮。', en: '她很漂亮。' },
    audio: '她很漂亮。',
    options: [
      { uz: 'U juda band.', ru: 'Она очень занята.', en: 'She is very busy.' },
      { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.' },
      { uz: 'U juda yaxshi.', ru: 'Она очень хорошая.', en: 'She is very good.' },
    ],
    correct: 2,
  },
  {
    kind: 'practice',
    id: 'audio-mang',
    step: '14',
    kicker: { uz: 'Eshitish', ru: 'Слушание', en: 'Listening' },
    title: { uz: '他很忙。', ru: '他很忙。', en: '他很忙。' },
    audio: '他很忙。',
    options: [
      { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      { uz: 'U juda band.', ru: 'Он очень занят.', en: 'He is very busy.' },
      { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.' },
      { uz: 'Men bandman.', ru: 'Я занят.', en: 'I am busy.' },
    ],
    correct: 1,
  },

  /* ─ 14 recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '15',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: { uz: '3 ta asosiy namuna', ru: '3 ключевых образца', en: '3 key patterns' },
    questions: [
      {
        zh: '我很好。',
        pinyin: 'Wǒ hěn hǎo.',
        tr: { uz: 'Men yaxshiman.', ru: 'У меня всё хорошо.', en: 'I am fine.' },
      },
      {
        zh: '她很漂亮。',
        pinyin: 'Tā hěn piàoliang.',
        tr: { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.' },
      },
      {
        zh: '他很忙。',
        pinyin: 'Tā hěn máng.',
        tr: { uz: 'U juda band.', ru: 'Он очень занят.', en: 'He is very busy.' },
      },
    ],
  },
];

type Lang = 'uz' | 'ru' | 'en';

export function GrammarHenPolishedPage() {
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
    'check-hao', 'check-piaoliang', 'check-mang',
    'audio-hao', 'audio-piaoliang', 'audio-mang',
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
    const existing = getStars('hen');
    if (existing === undefined || stars > existing) saveStars('hen', stars);
    setQuizAnswers({});
    router.push('/chinese?tab=grammar');
  };

  return (
    <div className="grammar-page shenme-polished">
      <div className="dr-hero">
        <div className="dr-hero__watermark">很</div>
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
          <h1 className="dr-hero__title">很</h1>
          <div className="dr-hero__pinyin">hěn</div>
          <div className="dr-hero__translation">
            — {lang === 'ru' ? 'очень' : lang === 'en' ? 'very' : 'juda'} —
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
                {card.id === 'meaning-3' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Tā hěn piàoliang">
                    <ruby>她<rt>t&#257;</rt></ruby>
                    <ruby>很<rt>h&#283;n</rt></ruby>
                    <ruby>漂<rt>pi&agrave;o</rt></ruby>
                    <ruby>亮<rt>liang</rt></ruby>
                  </div>
                ) : card.id === 'meaning-4' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="Tā hěn máng">
                    <ruby>他<rt>t&#257;</rt></ruby>
                    <ruby>很<rt>h&#283;n</rt></ruby>
                    <ruby>忙<rt>m&aacute;ng</rt></ruby>
                  </div>
                ) : card.id === 'meaning-5' ? (
                  <div className="shenme-polished-card__ruby-title" aria-label="shì / hěn">
                    <ruby>是<rt>sh&igrave;</rt></ruby>
                    <span style={{ margin: '0 0.3em', opacity: 0.6 }}>/</span>
                    <ruby>很<rt>h&#283;n</rt></ruby>
                  </div>
                ) : (
                  <div className="shenme-polished-card__ruby-title" aria-label="hěn">
                    <ruby>很<rt>h&#283;n</rt></ruby>
                  </div>
                )}
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
            ) : card.id === 'check-hao' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Wǒ hěn hǎo">
                <ruby>我<rt>w&#466;</rt></ruby>
                <ruby>很<rt>h&#283;n</rt></ruby>
                <ruby>好<rt>h&#462;o</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-piaoliang' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Tā hěn piàoliang">
                <ruby>她<rt>t&#257;</rt></ruby>
                <ruby>很<rt>h&#283;n</rt></ruby>
                <ruby>漂<rt>pi&agrave;o</rt></ruby>
                <ruby>亮<rt>liang</rt></ruby>
                <span>。</span>
              </div>
            ) : card.id === 'check-mang' ? (
              <div className="shenme-polished-card__ruby-title" aria-label="Tā hěn máng">
                <ruby>他<rt>t&#257;</rt></ruby>
                <ruby>很<rt>h&#283;n</rt></ruby>
                <ruby>忙<rt>m&aacute;ng</rt></ruby>
                <span>。</span>
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
