'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useStars } from '../hooks/useStars';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';
import { calculateStars } from '@/utils/calculateStars';
import { playGrammarAudio } from '@/utils/grammarAudio';

type Copy = { uz: string; ru: string; en: string };
type Lang = 'uz' | 'ru' | 'en';

type Card =
  | {
      kind: 'rule' | 'example' | 'contrast' | 'practice' | 'recap' | 'mashq';
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
      options?: string[];
      correct?: number;
      bullets?: Copy[];
    };

/* ─── Rich content journey ─── */
const cards: Card[] = [
  /* ─ Arc 1: meaning ─ */
  {
    kind: 'rule',
    id: 'meaning',
    step: '01',
    kicker: { uz: 'Belgi', ru: 'Сигнал', en: 'Signal' },
    title: { uz: '什么 = nima?', ru: '什么 = что?', en: '什么 = what?' },
    body: {
      uz: "什么 — «nima» degan so'roq so'z. Xitoychada u gap boshiga emas, javob bo'ladigan so'z o'rniga keladi.",
      ru: '什么 — вопросительное слово «что». В китайском оно ставится не в начало, а на место слова-ответа.',
      en: '什么 means "what". In Chinese, it goes where the answer word would be — not at the start of the sentence.',
    },
    formula: {
      uz: "Javob bo'ladigan so'z → 什么",
      ru: 'место ответа → 什么',
      en: 'answer word → 什么',
    },
  },

  /* ─ Arc 2: main pattern ─ */
  {
    kind: 'rule',
    id: 'pattern',
    step: '02',
    kicker: { uz: 'Qolip', ru: 'Шаблон', en: 'Pattern' },
    title: {
      uz: "So'z tartibini buzmang",
      ru: 'Не меняйте порядок слов',
      en: 'Keep the word order',
    },
    body: {
      uz: "Odatda faqat javob bo'ladigan bo'lak o'rniga `什么` qo'yiladi. Fe'l ham, ega ham o'z joyida qoladi.",
      ru: 'Обычно просто ставите `什么` на место ответа. И глагол, и подлежащее остаются на своих местах.',
      en: 'Usually you just replace the answer part with `什么`. The verb and subject stay put.',
    },
    formula: {
      uz: "Ega + fe'l + 什么？",
      ru: 'Подлежащее + глагол + 什么？',
      en: 'subject + verb + 什么?',
    },
    note: {
      uz: "`什么` gap boshiga chiqmaydi",
      ru: '`什么` не уходит в начало',
      en: '`什么` does not move to the front',
    },
  },

  /* ─ Arc 3: rapid examples ─ */
  {
    kind: 'example',
    id: 'eat',
    step: '03',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: "Fe'ldan keyin", ru: 'После глагола', en: 'After the verb' },
    sentence: {
      zh: '你吃什么？',
      pinyin: 'Nǐ chī shénme?',
      tr: { uz: 'Sen nima yeyapsan?', ru: 'Что ты ешь?', en: 'What are you eating?' },
    },
    body: {
      uz: "`吃` (yemoq) o'z o'rnida turibdi. Javob bo'ladigan taom o'rniga `什么` kelgan.",
      ru: '`吃` (есть) не сдвинулся. `什么` стоит на месте ответа.',
      en: '`吃` (to eat) stays where it is. `什么` takes the place of the answer.',
    },
  },
  {
    kind: 'example',
    id: 'drink',
    step: '04',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: "Kundalik savol", ru: 'Обычный вопрос', en: 'An everyday question' },
    sentence: {
      zh: '你喝什么？',
      pinyin: 'Nǐ hē shénme?',
      tr: { uz: 'Sen nima ichasan?', ru: 'Что ты пьёшь?', en: 'What are you drinking?' },
    },
    body: {
      uz: "Kafeda, uyda, restoranda — eng ko'p ishlatiladigan savollardan biri.",
      ru: 'В кафе, дома, в ресторане — один из самых частых вопросов.',
      en: 'In a cafe, at home, at a restaurant — one of the most used questions.',
    },
  },
  {
    kind: 'example',
    id: 'buy',
    step: '05',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: "Xaridda", ru: 'На покупках', en: 'Shopping' },
    sentence: {
      zh: '你买什么？',
      pinyin: 'Nǐ mǎi shénme?',
      tr: { uz: 'Nima sotib olayapsan?', ru: 'Что ты покупаешь?', en: 'What are you buying?' },
    },
    body: {
      uz: "`买` — «sotib olmoq». Shablon o'zgarmadi: 你 + fe'l + 什么?",
      ru: '`买` — «покупать». Шаблон тот же: 你 + глагол + 什么?',
      en: '`买` means "to buy". Same pattern as before: 你 + verb + 什么?',
    },
  },
  {
    kind: 'example',
    id: 'study',
    step: '06',
    kicker: { uz: 'Misol', ru: 'Пример', en: 'Example' },
    title: { uz: "O'qishda", ru: 'Об учёбе', en: 'About studying' },
    sentence: {
      zh: '你学什么？',
      pinyin: 'Nǐ xué shénme?',
      tr: { uz: "Nima o'rganyapsan?", ru: 'Что ты изучаешь?', en: 'What are you studying?' },
    },
    body: {
      uz: "Yangi tanishuvlarda tez-tez eshitasiz: tilmi, fanmi, kasbmi.",
      ru: 'Часто слышите при знакомстве: язык, предмет или профессия.',
      en: "You'll hear this often when meeting someone — about a language, subject, or major.",
    },
  },

  /* ─ Arc 4: the mistake ─ */
  {
    kind: 'contrast',
    id: 'mistake',
    step: '07',
    kicker: { uz: 'Xato', ru: 'Ошибка', en: 'Mistake' },
    title: {
      uz: 'Mana shu xatoni qilmang',
      ru: 'Не делайте эту ошибку',
      en: 'Do not make this mistake',
    },
    wrong: '什么你喝？',
    right: '你喝什么？',
    body: {
      uz: "Inglizchaga o'xshatib `什么` ni boshga olib chiqmang. Xitoycha bu savolda so'z tartibi o'zgarmaydi.",
      ru: 'Не ставьте `什么` в начало, как в английском. В китайском порядок слов не меняется.',
      en: "Don't move `什么` to the front like in English. In Chinese, word order stays the same.",
    },
  },

  /* ─ Arc 5: fixed frames ─ */
  {
    kind: 'rule',
    id: 'frames',
    step: '08',
    kicker: { uz: 'Tayyor qolip', ru: 'Готовая фраза', en: 'Fixed frame' },
    title: {
      uz: "Ba'zi savollar yaxlit yodlanadi",
      ru: 'Некоторые вопросы учат целиком',
      en: 'Some questions are memorized as chunks',
    },
    body: {
      uz: "`什么` + ot shaklidagi tayyor iboralar ko'p uchraydi. Bo'laklab emas, to'liq iborani yodlang.",
      ru: 'Часто встречаются готовые фразы вида `什么` + сущ. Учите их целиком.',
      en: 'Phrases like `什么` + noun come up a lot. Learn them as whole chunks.',
    },
    formula: {
      uz: "Ega + fe'l + 什么 + ot?",
      ru: 'Подлежащее + глагол + 什么 + сущ.?',
      en: 'subject + verb + 什么 + noun?',
    },
  },
  {
    kind: 'example',
    id: 'name',
    step: '09',
    kicker: { uz: 'Ism', ru: 'Знакомство', en: 'Meeting someone' },
    title: { uz: 'Tanishuvda', ru: 'При знакомстве', en: 'Introducing yourself' },
    sentence: {
      zh: '你叫什么名字？',
      pinyin: 'Nǐ jiào shénme míngzi?',
      tr: { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?' },
    },
    body: {
      uz: "叫 — «atalmoq», 名字 — «ism». To'liq iborani bir butun holda yodlang.",
      ru: '叫 — «зваться», 名字 — «имя». Запоминайте фразу целиком.',
      en: '叫 = "to be called", 名字 = "name". Memorize it as one chunk.',
    },
  },
  {
    kind: 'example',
    id: 'work',
    step: '10',
    kicker: { uz: 'Kasb', ru: 'Работа', en: 'Work' },
    title: { uz: 'Kasb haqida', ru: 'О работе', en: 'About someone\'s job' },
    sentence: {
      zh: '你做什么工作？',
      pinyin: 'Nǐ zuò shénme gōngzuò?',
      tr: { uz: 'Qanday ish qilasiz?', ru: 'Кем вы работаете?', en: 'What do you do for work?' },
    },
    body: {
      uz: "做 — «qilmoq», 工作 — «ish». Rasmiyroq suhbatlarda juda foydali.",
      ru: '做 — «делать», 工作 — «работа». Пригодится в деловом разговоре.',
      en: '做 = "to do", 工作 = "work". Very useful in formal conversation.',
    },
  },

  /* ─ Arc 6: pointing ─ */
  {
    kind: 'rule',
    id: 'pointing',
    step: '11',
    kicker: { uz: 'Narsalarni so\'rash', ru: 'О предметах', en: 'Asking about things' },
    title: {
      uz: "«Bu nima?» shabloni",
      ru: 'Шаблон «что это?»',
      en: 'The "what is this?" frame',
    },
    body: {
      uz: "Biron narsaga ishora qilib «Bu nima?» demoqchimisiz? Foydalaning: 这/那 + 是 + 什么?",
      ru: 'Указываете на что-то и хотите спросить «что это?»? Используйте 这/那 + 是 + 什么?',
      en: 'Pointing at something and asking "what is this?" Use 这/那 + 是 + 什么?',
    },
    formula: {
      uz: "这 / 那 + 是 + 什么？",
      ru: '这 / 那 + 是 + 什么？',
      en: '这 / 那 + 是 + 什么?',
    },
  },
  {
    kind: 'example',
    id: 'this',
    step: '12',
    kicker: { uz: 'Bu', ru: 'Это', en: 'This' },
    title: { uz: 'Yaqin narsa haqida', ru: 'О близком', en: 'About something near' },
    sentence: {
      zh: '这是什么？',
      pinyin: 'Zhè shì shénme?',
      tr: { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?' },
    },
    body: {
      uz: "这 (zhè) — «bu». Bozorda, muzeyda, kafedagi menyuda — doim kerak bo'ladi.",
      ru: '这 (zhè) — «это». На рынке, в музее, в меню — пригодится везде.',
      en: '这 (zhè) = "this". At a market, in a museum, on a menu — essential.',
    },
  },
  {
    kind: 'example',
    id: 'that',
    step: '13',
    kicker: { uz: 'U', ru: 'То', en: 'That' },
    title: { uz: "Uzoqdagi narsa", ru: 'О дальнем', en: 'About something far' },
    sentence: {
      zh: '那是什么？',
      pinyin: 'Nà shì shénme?',
      tr: { uz: 'U nima?', ru: 'Что это там?', en: 'What is that?' },
    },
    body: {
      uz: "那 (nà) — «u, ana u». 这 dan farqi: masofa.",
      ru: '那 (nà) — «то». Отличие от 这 — расстояние.',
      en: '那 (nà) = "that" (further away). 这 vs 那 — just distance.',
    },
  },
  {
    kind: 'example',
    id: 'color',
    step: '14',
    kicker: { uz: 'Rang', ru: 'Цвет', en: 'Color' },
    title: { uz: "Rang so'rash", ru: 'Узнать цвет', en: 'Asking a color' },
    sentence: {
      zh: '这是什么颜色？',
      pinyin: 'Zhè shì shénme yánsè?',
      tr: { uz: 'Bu qanday rang?', ru: 'Какой это цвет?', en: 'What color is this?' },
    },
    body: {
      uz: "颜色 — «rang». Tayyor qolip: 什么 + 颜色 = «qanday rang?»",
      ru: '颜色 — «цвет». Готовая фраза: 什么 + 颜色 = «какой цвет?»',
      en: '颜色 = "color". Fixed phrase: 什么 + 颜色 = "what color?"',
    },
  },

  /* ─ Arc 7: quick check ─ */
  {
    kind: 'practice',
    id: 'check',
    step: '15',
    kicker: { uz: 'Tekshiruv', ru: 'Проверка', en: 'Check' },
    title: {
      uz: 'Tez tekshiruv',
      ru: 'Быстрая проверка',
      en: 'Quick check',
    },
    prompt: {
      uz: '«Sen nima yeyapsan?» qaysi variant?',
      ru: 'Какой вариант означает «Что ты ешь?»',
      en: 'Which one means "What are you eating?"',
    },
    options: ['你吃什么？', '什么你吃？', '你什么吃？'],
    correct: 0,
    note: {
      uz: "To'g'ri qolip: 你 + fe'l + 什么",
      ru: 'Правильный шаблон: 你 + глагол + 什么',
      en: 'Correct frame: 你 + verb + 什么',
    },
  },

  /* ─ Arc 8: recap ─ */
  {
    kind: 'recap',
    id: 'recap',
    step: '16',
    kicker: { uz: 'Xulosa', ru: 'Итог', en: 'Recap' },
    title: {
      uz: 'Uchta asosiy fikr',
      ru: 'Три главные идеи',
      en: 'Three big ideas',
    },
    bullets: [
      {
        uz: "`什么` = javob bo'ladigan so'z o'rnida",
        ru: '`什么` = на месте слова-ответа',
        en: '`什么` = where the answer word goes',
      },
      {
        uz: "So'z tartibini buzmaslik kerak",
        ru: 'Не нужно ломать порядок слов',
        en: 'Do not break the word order',
      },
      {
        uz: "Eng foydalilari: `你吃什么？`, `你叫什么名字？`, `这是什么？`",
        ru: 'Самые полезные: `你吃什么？`, `你叫什么名字？`, `这是什么？`',
        en: 'Most useful frames: `你吃什么？`, `你叫什么名字？`, `这是什么？`',
      },
    ],
  },

  /* ─ Arc 9: speaking ─ */
  {
    kind: 'mashq',
    id: 'mashq',
    step: '17',
    kicker: { uz: 'Ovozli mashq', ru: 'Голосовая практика', en: 'Speaking practice' },
    title: {
      uz: "Endi — o'zingiz ayting",
      ru: 'Теперь — скажите сами',
      en: 'Now — you speak',
    },
    body: {
      uz: "6 ta savol. Tarjimani ko'rasiz — Xitoychasini ayting.",
      ru: '6 вопросов. Видите перевод — говорите по-китайски.',
      en: '6 prompts. You see the translation — you say the Chinese.',
    },
  },
];

const speakingQuestionsData = [
  { uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?', zh: '这是什么？', pinyin: 'Zhè shì shénme?' },
  { uz: 'Nima yeyasan?', ru: 'Что ты ешь?', en: 'What are you eating?', zh: '你吃什么？', pinyin: 'Nǐ chī shénme?' },
  { uz: 'Nima ichasiz?', ru: 'Что ты пьёшь?', en: 'What are you drinking?', zh: '你喝什么？', pinyin: 'Nǐ hē shénme?' },
  { uz: "Nima o'rganaysan?", ru: 'Что ты изучаешь?', en: 'What are you studying?', zh: '你学什么？', pinyin: 'Nǐ xué shénme?' },
  { uz: 'Ismingiz nima?', ru: 'Как вас зовут?', en: 'What is your name?', zh: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?' },
  { uz: 'Ana u nima?', ru: 'Что то?', en: 'What is that?', zh: '那是什么？', pinyin: 'Nà shì shénme?' },
];

export function GrammarShenmeCardPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');

  const [index, setIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  /* swipe state */
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const lang = language as Lang;
  const t = useCallback((copy: Copy) => copy[lang] ?? copy.uz, [lang]);

  const handleQuizComplete = useCallback(
    ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
      const newStars = calculateStars(scores, shadowingUsed);
      const existing = getStars('shenme');
      if (existing === undefined || newStars > existing) saveStars('shenme', newStars);
    },
    [getStars, saveStars],
  );

  const speakingQuestions = speakingQuestionsData.map(q => ({
    uz: lang === 'ru' ? q.ru : lang === 'en' ? q.en : q.uz,
    zh: q.zh,
    pinyin: q.pinyin,
  }));

  const TOTAL = cards.length;
  const progress = ((index + 1) / TOTAL) * 100;

  const setCard = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= TOTAL) return;
    setTransitioning(true);
    setIndex(nextIndex);
    setQuizAnswer(null);
    setDragOffset(0);
    setTimeout(() => setTransitioning(false), 280);
  }, [TOTAL]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDelta.current = 0;
    isHorizontal.current = null;
    setTransitioning(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (isHorizontal.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;
    touchDelta.current = dx;
    if ((index === 0 && dx > 0) || (index === TOTAL - 1 && dx < 0)) {
      setDragOffset(dx * 0.25);
    } else {
      setDragOffset(dx);
    }
  };
  const onTouchEnd = () => {
    if (!isHorizontal.current) { setDragOffset(0); return; }
    const THRESHOLD = 50;
    if (touchDelta.current < -THRESHOLD && index < TOTAL - 1) {
      setCard(index + 1);
    } else if (touchDelta.current > THRESHOLD && index > 0) {
      setCard(index - 1);
    } else {
      setTransitioning(true);
      setDragOffset(0);
      setTimeout(() => setTransitioning(false), 280);
    }
  };

  if (isLoading) return <div className="loading-spinner" />;

  const renderCardBody = (card: Card) => (
    <article className={`shenme-polished-card shenme-polished-card--${card.kind}`}>
      <div className="shenme-polished-card__header">
        <div className="shenme-polished-card__meta">
          <span className="shenme-polished-card__step">{card.step}</span>
          <span className="shenme-polished-card__kicker">{t(card.kicker)}</span>
        </div>
      </div>

      <div className="shenme-polished-card__main">
        <h2 className="shenme-polished-card__title">{t(card.title)}</h2>

        {'formula' in card && card.formula ? (
          <div className="shenme-polished-card__formula">
            {typeof card.formula === 'string' ? card.formula : t(card.formula)}
          </div>
        ) : null}

        {'sentence' in card && card.sentence ? (
          <button
            type="button"
            className="shenme-polished-card__sentence"
            onClick={() => playGrammarAudio(card.sentence!.zh)}
          >
            <div className="shenme-polished-card__sentence-zh">{card.sentence.zh}</div>
            <div className="shenme-polished-card__sentence-py">{card.sentence.pinyin}</div>
            <div className="shenme-polished-card__sentence-tr">{card.sentence.tr[lang]}</div>
          </button>
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

        {'prompt' in card && card.prompt && card.options ? (
          <>
            <div className="shenme-polished-card__prompt">{card.prompt[lang]}</div>
            <div className="shenme-polished-card__options">
              {card.options.map((option, optionIndex) => {
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
                    key={option}
                    type="button"
                    className={className}
                    onClick={() => setQuizAnswer(optionIndex)}
                  >
                    {option}
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

        {card.kind === 'mashq' ? (
          <div style={{ width:'100%', marginTop:12 }}>
            <SpeakingMashq
              language={lang}
              questions={speakingQuestions}
              accentColor="#dc2626"
              accentBg="#fee2e2"
              onComplete={handleQuizComplete}
              onDone={() => router.push('/chinese?tab=grammar')}
            />
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
  );

  return (
    <div className="grammar-page shenme-polished">
      <div className="shenme-polished__hero">
        <div className="shenme-polished__hero-top">
          <Link href="/chinese?tab=grammar" className="dr-back-btn shenme-polished__back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="shenme-polished__hero-meta">
            <div className="shenme-polished__eyebrow">
              {lang === 'ru' ? 'HSK 1 · Грамматика' : lang === 'en' ? 'HSK 1 · Grammar' : 'HSK 1 · Grammatika'}
            </div>
            <h1 className="shenme-polished__title">
              {lang === 'ru' ? '什么 — как спросить «что?»' : lang === 'en' ? '什么 — how to ask "what?"' : "什么 — «nima?» ni qanday so'rash"}
            </h1>
            <p className="shenme-polished__subtitle">
              {lang === 'ru'
                ? '17 карточек · примеры · практика'
                : lang === 'en'
                  ? '17 cards · examples · practice'
                  : '17 ta karta · misollar · mashq'}
            </p>
          </div>
          <BannerMenu />
        </div>

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

      {/* Swipeable stage */}
      <div
        className="shenme-polished__stage"
        style={{ overflow:'hidden', position:'relative', touchAction:'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div style={{
          display:'flex',
          transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))`,
          transition: transitioning ? 'transform 0.28s ease-out' : 'none',
        }}>
          {cards.map((card, i) => (
            <div key={card.id} style={{ flex:'0 0 100%', width:'100%', minWidth:0, boxSizing:'border-box' }}>
              {(Math.abs(i - index) <= 1 || i === TOTAL - 1) && renderCardBody(card)}
            </div>
          ))}
        </div>
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
          onClick={() => setCard(Math.min(TOTAL - 1, index + 1))}
          disabled={index === TOTAL - 1}
        >
          {lang === 'ru' ? 'Дальше' : lang === 'en' ? 'Next' : 'Keyingi'}
        </button>
      </div>

      <PageFooter />
    </div>
  );
}
