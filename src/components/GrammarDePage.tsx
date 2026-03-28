'use client';

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useStars } from '../hooks/useStars';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';
import { calculateStars } from '@/utils/calculateStars';

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_SHI  = '#dc2626'; // 是 (Blim red)
const C_DE   = '#be185d'; // 的 (possessive)
const C_PRED = '#16a34a'; // Predicate / Narsa
const C_SHEI = '#d97706'; // 谁 (who?)
const C_NEG  = '#ea580c'; // Negation
const C_MA   = '#0891b2'; // 吗 question particle
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Bu mening kitobim.', ru: 'Это моя книга.', en: 'This is my book.', zh: '这是我的书。', pinyin: 'Zhè shì wǒ de shū.' },
  { uz: 'Bu sizning telefoningizmi?', ru: 'Это ваш телефон?', en: 'Is this your phone?', zh: '这是你的手机吗？', pinyin: 'Zhè shì nǐ de shǒujī ma?' },
  { uz: "U mening do'stim.", ru: 'Он мой друг.', en: 'He is my friend.', zh: '他是我的朋友。', pinyin: 'Tā shì wǒ de péngyǒu.' },
  { uz: "Bu o'qituvchining kitobi.", ru: 'Это книга учителя.', en: "This is the teacher's book.", zh: '这是老师的书。', pinyin: 'Zhè shì lǎoshī de shū.' },
  { uz: 'U kimniki?', ru: 'Чьё это?', en: 'Whose is that?', zh: '那是谁的？', pinyin: 'Nà shì shéi de?' },
  { uz: 'Bu bizning maktabimiz.', ru: 'Это наша школа.', en: 'This is our school.', zh: '这是我们的学校。', pinyin: 'Zhè shì wǒmen de xuéxiào.' },
];

const sections = [
  { id: 'intro',    uz: 'Asosiy',   ru: 'Основное', en: 'Overview'  },
  { id: 'usage',    uz: 'Shablon',  ru: 'Шаблоны',  en: 'Patterns'  },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const examples: { parts: Part[]; pinyin: string; uz: string; ru: string; en: string; note_uz: string; note_ru: string; note_en: string }[] = [
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'书',color:C_PRED},{text:'。',color:C_PUNC}],
    pinyin:'Zhè shì wǒ de shū.',
    uz:'Bu mening kitobim.',                    ru:'Это моя книга.',                    en:'This is my book.',
    note_uz:"我的 (wǒ de) = mening · 书 (shū) = kitob",
    note_ru:"我的 (wǒ de) = мой/моя/моё · 书 (shū) = книга",
    note_en:"我的 (wǒ de) = my · 书 (shū) = book",
  },
  {
    parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'你的',color:C_DE},{text:'手机',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Nà shì nǐ de shǒujī ma?',
    uz:'U sizning telefoningizmi?',             ru:'Это ваш телефон?',                  en:'Is that your phone?',
    note_uz:"你的 (nǐ de) = sizning · 手机 (shǒujī) = telefon · 吗 = savol yuklamasi",
    note_ru:"你的 (nǐ de) = ваш/ваша · 手机 (shǒujī) = телефон · 吗 = вопросительная частица",
    note_en:"你的 (nǐ de) = your · 手机 (shǒujī) = phone · 吗 = question particle",
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'朋友',color:C_PRED},{text:'。',color:C_PUNC}],
    pinyin:'Tā shì wǒ de péngyǒu.',
    uz:"U mening do'stim.",                     ru:'Он мой друг.',                      en:'He is my friend.',
    note_uz:"朋友 (péngyǒu) = do'st · 我的朋友 = mening do'stim",
    note_ru:"朋友 (péngyǒu) = друг · 我的朋友 = мой друг",
    note_en:"朋友 (péngyǒu) = friend · 我的朋友 = my friend",
  },
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'老师的',color:C_DE},{text:'书',color:C_PRED},{text:'。',color:C_PUNC}],
    pinyin:'Zhè shì lǎoshī de shū.',
    uz:"Bu o'qituvchining kitobi.",              ru:'Это книга учителя.',                en:"This is the teacher's book.",
    note_uz:"老师的 (lǎoshī de) = o'qituvchining · ism + 的 + narsa",
    note_ru:"老师的 (lǎoshī de) = учителя · имя + 的 + предмет",
    note_en:"老师的 (lǎoshī de) = teacher's · name + 的 + object",
  },
  {
    parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁的',color:C_DE},{text:'？',color:C_PUNC}],
    pinyin:'Nà shì shéi de?',
    uz:'U kimniki?',                            ru:'Чьё это?',                          en:'Whose is that?',
    note_uz:"谁的 (shéi de) = kimning / kimniki — 的 yolg'iz qolgan",
    note_ru:"谁的 (shéi de) = чьё/чей/чья — 的 стоит одно",
    note_en:"谁的 (shéi de) = whose — 的 stands alone",
  },
  {
    parts:[{text:'这本书',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'。',color:C_PUNC}],
    pinyin:'Zhè běn shū shì wǒ de.',
    uz:'Bu kitob meniki.',                      ru:'Эта книга — моя.',                  en:'This book is mine.',
    note_uz:"Ot tushirilganda 的 yolg'iz qoladi: 是我的 = meniki",
    note_ru:"Когда существительное опускается, 的 стоит одно: 是我的 = моё",
    note_en:"When the noun is dropped, 的 stands alone: 是我的 = mine",
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'的',color:C_DE},{text:'妈妈',color:C_PRED},{text:'是老师。',color:C_SHI}],
    pinyin:'Wǒ de māma shì lǎoshī.',
    uz:"Mening onam o'qituvchi.",               ru:'Моя мама — учитель.',               en:'My mother is a teacher.',
    note_uz:"妈妈 (māma) = ona · 我的妈妈 = mening onam",
    note_ru:"妈妈 (māma) = мама · 我的妈妈 = моя мама",
    note_en:"妈妈 (māma) = mom · 我的妈妈 = my mom",
  },
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'我们的',color:C_DE},{text:'学校',color:C_PRED},{text:'。',color:C_PUNC}],
    pinyin:'Zhè shì wǒmen de xuéxiào.',
    uz:'Bu bizning maktabimiz.',                ru:'Это наша школа.',                   en:'This is our school.',
    note_uz:"我们的 (wǒmen de) = bizning · 学校 (xuéxiào) = maktab",
    note_ru:"我们的 (wǒmen de) = наш/наша/наше · 学校 (xuéxiào) = школа",
    note_en:"我们的 (wǒmen de) = our · 学校 (xuéxiào) = school",
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'的',color:C_DE},{text:'书',color:C_PRED}],            py:'wǒ de shū',        uz:'mening kitobim',        ru:'моя книга',      en:'my book'     },
  { parts:[{text:'你',color:C_SUB},{text:'的',color:C_DE},{text:'手机',color:C_PRED}],          py:'nǐ de shǒujī',     uz:'sizning telefoningiz',  ru:'ваш телефон',    en:'your phone'  },
  { parts:[{text:'他',color:C_SUB},{text:'的',color:C_DE},{text:'老师',color:C_PRED}],          py:'tā de lǎoshī',     uz:"uning o'qituvchisi",    ru:'его учитель',    en:'his teacher' },
  { parts:[{text:'我们',color:C_SUB},{text:'的',color:C_DE},{text:'学校',color:C_PRED}],        py:'wǒmen de xuéxiào', uz:'bizning maktabimiz',    ru:'наша школа',     en:'our school'  },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'老师',color:C_SUB},{text:'的',color:C_DE},{text:'书',color:C_PRED}],          py:'lǎoshī de shū',       uz:"o'qituvchining kitobi", ru:'книга учителя',   en:"teacher's book" },
  { parts:[{text:'朋友',color:C_SUB},{text:'的',color:C_DE},{text:'手机',color:C_PRED}],        py:'péngyǒu de shǒujī',   uz:"do'stning telefoni",    ru:'телефон друга',   en:"friend's phone" },
  { parts:[{text:'妈妈',color:C_SUB},{text:'的',color:C_DE},{text:'书',color:C_PRED}],          py:'māma de shū',         uz:"onamning kitobi",       ru:'мамина книга',    en:"mom's book"     },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'。',color:C_PUNC}],     py:'Zhè shì wǒ de.',   uz:'Bu meniki.',    ru:'Это моё.',    en:'This is mine.'  },
  { parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'你的',color:C_DE},{text:'。',color:C_PUNC}],     py:'Nà shì nǐ de.',    uz:'U sizniki.',    ru:'То ваше.',    en:'That is yours.' },
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'谁的',color:C_DE},{text:'？',color:C_PUNC}],     py:'Zhè shì shéi de?', uz:'Bu kimniki?',   ru:'Чьё это?',    en:'Whose is this?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'你的',color:C_DE},{text:'书',color:C_PRED},{text:'吗？',color:C_MA}],                                          py:'Zhè shì nǐ de shū ma?',              uz:'Bu sizning kitobingizmi?',            ru:'Это ваша книга?',                     en:'Is this your book?'             },
  { s:'B', parts:[{text:'是的，这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'书。',color:C_PRED}],                                                           py:'Shì de, zhè shì wǒ de shū.',         uz:'Ha, bu mening kitobim.',              ru:'Да, это моя книга.',                  en:'Yes, this is my book.'          },
  { s:'A', parts:[{text:'那',color:C_SUB},{text:'也是',color:C_SHI},{text:'你的',color:C_DE},{text:'吗？',color:C_MA}],                                                                py:'Nà yě shì nǐ de ma?',                uz:'U ham siznikimi?',                    ru:'То тоже ваше?',                       en:'Is that also yours?'            },
  { s:'B', parts:[{text:'不是，那',color:C_NEG},{text:'是',color:C_SHI},{text:'我朋友的',color:C_DE},{text:'书。',color:C_PRED}],                                                      py:"Bú shì, nà shì wǒ péngyǒu de shū.", uz:"Yo'q, u do'stimning kitobi.",         ru:'Нет, это книга моего друга.',         en:"No, that's my friend's book."   },
  { s:'A', parts:[{text:'你朋友',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],                                                              py:'Nǐ péngyǒu shì shéi?',               uz:"Do'stingiz kim?",                     ru:'Кто ваш друг?',                       en:'Who is your friend?'            },
  { s:'B', parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'同学。',color:C_PRED}],                                                              py:'Tā shì wǒ de tóngxué.',              uz:'U mening sinfdoshim.',                ru:'Он мой одноклассник.',                en:'He is my classmate.'            },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁的',color:C_DE},{text:'手机',color:C_PRED},{text:'？',color:C_PUNC}],                                       py:'Nà shì shéi de shǒujī?',             uz:'Bu kimning telefoni?',                ru:'Чей это телефон?',                    en:'Whose phone is that?'           },
  { s:'B', parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'我妈妈的',color:C_DE},{text:'手机。',color:C_PRED}],                                                          py:'Nà shì wǒ māma de shǒujī.',          uz:'Bu mening onamning telefoni.',        ru:'Это телефон моей мамы.',              en:"That is my mom's phone."        },
  { s:'A', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'你的',color:C_DE},{text:'吗？',color:C_MA}],                                                                  py:'Zhè shì nǐ de ma?',                  uz:'Bu siznikimi?',                       ru:'Это ваше?',                           en:'Is this yours?'                 },
  { s:'B', parts:[{text:'是，这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的。',color:C_DE}],                                                                                     py:'Shì, zhè shì wǒ de.',                uz:'Ha, bu meniki.',                      ru:'Да, это моё.',                        en:'Yes, this is mine.'             },
];

const pronounTable: { sub_uz: string; sub_ru: string; sub_en: string; zh: string; noun: string; full: string; tr_uz: string; tr_ru: string; tr_en: string }[] = [
  { sub_uz:'men',       sub_ru:'я',   sub_en:'I',   zh:'我',   noun:'书',    full:'我的书',    tr_uz:'mening kitobim',     tr_ru:'моя книга',   tr_en:'my book'    },
  { sub_uz:'siz',       sub_ru:'вы',  sub_en:'you', zh:'你',   noun:'书',    full:'你的书',    tr_uz:'sizning kitobingiz', tr_ru:'ваша книга',  tr_en:'your book'  },
  { sub_uz:'u (erkak)', sub_ru:'он',  sub_en:'he',  zh:'他',   noun:'书',    full:'他的书',    tr_uz:"uning kitobi",       tr_ru:'его книга',   tr_en:'his book'   },
  { sub_uz:'u (ayol)',  sub_ru:'она', sub_en:'she', zh:'她',   noun:'书',    full:'她的书',    tr_uz:"uning kitobi",       tr_ru:'её книга',    tr_en:'her book'   },
  { sub_uz:'biz',       sub_ru:'мы',  sub_en:'we',  zh:'我们', noun:'学校',  full:'我们的学校', tr_uz:'bizning maktabimiz', tr_ru:'наша школа',  tr_en:'our school' },
];

const quizQuestions: {
  q_uz: string; q_ru: string; q_en: string;
  options?: string[]; options_uz?: string[]; options_ru?: string[]; options_en?: string[];
  correct: number;
}[] = [
  {
    q_uz:"的 qanday o'qiladi?",
    q_ru:'Как читается 的?',
    q_en:'How is 的 pronounced?',
    options:['dé (2-ton)','dě (3-ton)','de (yengil ton)','dè (4-ton)'],
    correct:2,
  },
  {
    q_uz:'"Mening kitobim" xitoycha qanday?',
    q_ru:'Как сказать «моя книга» по-китайски?',
    q_en:'How do you say "my book" in Chinese?',
    options:['我书的','书我的','我的书','的我书'],
    correct:2,
  },
  {
    q_uz:'"Bu kimniki?" deb qanday so\'raysiz?',
    q_ru:'Как спросить «Чьё это?» по-китайски?',
    q_en:'How do you ask "Whose is this?" in Chinese?',
    options:['这是什么的？','这是谁的？','这是哪个的？','这谁的是？'],
    correct:1,
  },
  {
    q_uz:'"U mening do\'stim" xitoycha qanday?',
    q_ru:'Как сказать «Он мой друг» по-китайски?',
    q_en:'How do you say "He is my friend" in Chinese?',
    options:['他是朋友我的。','他是我朋友。','他是我的朋友。','他我的是朋友。'],
    correct:2,
  },
  {
    q_uz:"的 ning asosiy vazifasi nima?",
    q_ru:'Какова основная функция 的?',
    q_en:'What is the main function of 的?',
    options_uz:["Savol belgisi","Inkor shakli","Egalikni bildirish (ningniki)","Fe'l yasash"],
    options_ru:['Вопросительная частица','Отрицание','Выражение принадлежности','Образование глагола'],
    options_en:['Question marker','Negation','Expressing possession','Forming verbs'],
    correct:2,
  },
  {
    q_uz:'"Bu bizning maktabimiz" xitoycha qanday?',
    q_ru:'Как сказать «Это наша школа» по-китайски?',
    q_en:'How do you say "This is our school" in Chinese?',
    options:['这是我们学校的。','这是的我们学校。','这是我们的学校。','我们的这是学校。'],
    correct:2,
  },
];

function ColorParts({ parts }: { parts: Part[] }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2, flexWrap:'wrap' }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color, fontWeight: p.color === C_PUNC ? 400 : 600 }}>
          {p.text}
        </span>
      ))}
    </span>
  );
}

export function GrammarDePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('de');
    if (existing === undefined || newStars > existing) saveStars('de', newStars);
  };

  const speakingQuestions = speakingQuestionsData.map(q => ({
    uz: language === 'ru' ? q.ru : language === 'en' ? q.en : q.uz,
    zh: q.zh,
    pinyin: q.pinyin,
  }));
  const [activeTab, setActiveTab] = useState('intro');
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [rev1, setRev1] = useState<Record<number, boolean>>({});
  const [rev2, setRev2] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (isLoading) return <div className="loading-spinner" />;

  const pick = (qi: number, ai: number) => {
    if (!showResults) setAnswers(p => ({ ...p, [qi]: ai }));
  };
  const score       = Object.entries(answers).filter(([qi, ai]) => quizQuestions[+qi].correct === +ai).length;
  const allAnswered = Object.keys(answers).length === quizQuestions.length;
  const toggleRev = (setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>, i: number) =>
    setter(p => ({ ...p, [i]: !p[i] }));

  const t = (uz: string, ru: string, en: string) =>
    ({ uz, ru, en } as Record<string, string>)[language] ?? uz;

  return (
    <div className="grammar-page">
      {/* Hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">的</div>
        <div className="dr-hero__top-row">
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
        </div>
        <div className="dr-hero__body">
          <div className="dr-hero__level">
            HSK 1 · {t('Grammatika','Грамматика','Grammar')}
          </div>
          <h1 className="dr-hero__title">的</h1>
          <div className="dr-hero__pinyin">de</div>
          <div className="dr-hero__translation">
            — {t('egalik belgisi','частица принадлежности','possessive particle')} —
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grammar-page__tabs">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveTab(s.id)}
            className={`grammar-page__tab ${activeTab === s.id ? 'grammar-page__tab--active' : ''}`}
          >
            {t(s.uz, s.ru, s.en)}
          </button>
        ))}
      </div>

      <div className="grammar-page__content">

        {/* ── ASOSIY ── */}
        {activeTab === 'intro' && (
          <>
            {/* Character info */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Ieroglif','Иероглиф','Character')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">的</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">de</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('Yengil ton (neytral)','Лёгкий тон (нейтральный)','Neutral tone (unstressed)')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('8 ta','8','8')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('…ning (egalik)','…-его/-её (принадлежность)',"…'s (possession)")}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Turi",'Тип','Type')}</span>
                    <span className="grammar-block__info-val">{t("Yuklama — mustaqil ma'nosi yo'q",'Частица — самостоятельного значения нет','Particle — no independent meaning')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 的 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('的 nima?','的 — что это?','What is 的?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_DE }}>的</strong> — {t(
                  "egalikni bildiradi. O'zbek tilidagi «-ning» qo'shimchasiga o'xshaydi.",
                  'выражает принадлежность. Аналог русских притяжательных форм (мой, твой, его…).',
                  "expresses possession. Like English apostrophe-s ('s) or possessive pronouns (my, your, his…).",
                )}
              </p>
            </div>

            {/* Qanday ishlaydi — pronoun table */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «mening kitobim» desak, qo'shimcha otga qo'shiladi. Xitoy tilida esa 的 egasi va narsa o'rtasiga qo'yiladi:",
                  "По-русски «моя книга» — притяжательное слово перед существительным. В китайском 的 ставится между владельцем и предметом:",
                  "In English \"my book\" — the possessive comes first. In Chinese, 的 is placed between the owner and the object:",
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:'8px 12px', marginTop:8 }}>
                {pronounTable.map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 0', borderBottom: i < pronounTable.length - 1 ? '1px solid #ebebeb' : 'none', flexWrap:'wrap' }}>
                    <div style={{ minWidth:68, color:'#888', fontSize:11 }}>{t(r.sub_uz, r.sub_ru, r.sub_en)}</div>
                    <span style={{ color:C_SUB, fontWeight:700, fontSize:18 }}>{r.zh}</span>
                    <span style={{ color:'#aaa', fontSize:14 }}>+</span>
                    <span style={{ color:C_DE, fontWeight:700, fontSize:18 }}>的</span>
                    <span style={{ color:'#aaa', fontSize:14 }}>+</span>
                    <span style={{ color:C_PRED, fontWeight:700, fontSize:18 }}>{r.noun}</span>
                    <span style={{ color:'#aaa', fontSize:14 }}>=</span>
                    <span style={{ color:'#1a1a2e', fontWeight:700, fontSize:18 }}>{r.full}</span>
                    <span style={{ color:'#666', fontSize:12, marginLeft:4 }}>{t(r.tr_uz, r.tr_ru, r.tr_en)}</span>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "Sxema: Egasi + 的 + Narsa. «Mening kitobim» → 我 + 的 + 书 = 我的书.",
                  "Схема: Владелец + 的 + Предмет. «Моя книга» → 我 + 的 + 书 = 我的书.",
                  "Pattern: Owner + 的 + Object. \"My book\" → 我 + 的 + 书 = 我的书.",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega / Olmosh',        ru:'Подлежащее / Местоимение', en:'Subject / Pronoun' },
                  { color:C_SHI,  uz:"是 (bo'lmoq)",         ru:'是 (быть)',                 en:'是 (to be)' },
                  { color:C_DE,   uz:'的 (egalik, -ning)',   ru:'的 (принадлежность)',       en:"的 (possession, 's)" },
                  { color:C_PRED, uz:'Narsa (ot)',            ru:'Предмет (сущ.)',            en:'Object (noun)' },
                  { color:C_SHEI, uz:'谁 (kim?)',             ru:'谁 (кто?)',                 en:'谁 (who?)' },
                  { color:C_MA,   uz:'吗 (savol)',            ru:'吗 (вопрос)',               en:'吗 (question)' },
                ] as { color:string; uz:string; ru:string; en:string }[]).map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f5f8', borderRadius:6, padding:'5px 10px' }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:r.color, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#555' }}>{t(r.uz, r.ru, r.en)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SHABLON ── */}
        {activeTab === 'usage' && (
          <>
            {/* Pattern 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-shablon — Olmosh + 的 + Narsa','Шаблон 1 — Местоимение + 的 + Предмет','Pattern 1 — Pronoun + 的 + Noun')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>我 / 你 / 他 / 她 / 我们</span>
                {' '}
                <span style={{ color:C_DE, fontWeight:700 }}>的</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Narsa','Предмет','Noun')}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t("Kim egasi ekanligini bildirish","Кто является владельцем","Indicating who the owner is")}
              </p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "我 → 我的 (mening), 你 → 你的 (sizning), 他/她 → 他的/她的 (uning). Barcha olmoshlar shunday ishlaydi.",
                  "我 → 我的 (мой/моя), 你 → 你的 (твой/ваш), 他/她 → 他的/她的 (его/её). Все местоимения работают одинаково.",
                  "我 → 我的 (my), 你 → 你的 (your), 他/她 → 他的/她的 (his/her). All pronouns work the same way.",
                )}
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Ism/Ot + 的 + Narsa','Шаблон 2 — Имя/Сущ. + 的 + Предмет','Pattern 2 — Name/Noun + 的 + Noun')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ism / Ot','Имя / Сущ.','Name / Noun')}</span>
                {' '}
                <span style={{ color:C_DE, fontWeight:700 }}>的</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Narsa','Предмет','Object')}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t("Kishining narsasi — ism + 的 + narsa","Предмет, принадлежащий кому-то — имя + 的 + предмет","Something belonging to someone — name + 的 + object")}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "Diqqat: Ikki marta 的 ishlatmang. ✗ 我的朋友的书 → ✓ 我朋友的书 — Birinchi 的 ni tushirish tabiiy.",
                  "Внимание: Не используйте 的 дважды подряд. ✗ 我的朋友的书 → ✓ 我朋友的书 — первое 的 опускается.",
                  "Note: Don't use 的 twice in a row. ✗ 我的朋友的书 → ✓ 我朋友的书 — drop the first 的.",
                )}
              </p>
            </div>

            {/* Pattern 3 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("3-shablon — 的 yolg'iz (ot tushiriladi)","Шаблон 3 — 的 одно (сущ. опускается)","Pattern 3 — 的 Alone (noun dropped)")}</div>
              <div className="grammar-block__formula">
                <span style={{ color:'#555' }}>这 / 那 是</span>
                {' '}
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Olmosh','Местоимение','Pronoun')}</span>
                <span style={{ color:C_DE, fontWeight:700 }}>的</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t("Narsa allaqachon ma'lum bo'lsa, ot tushiriladi","Когда предмет понятен из контекста, существительное опускается","When the object is clear from context, the noun is dropped")}
              </p>
              {pattern3Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "「我的书」 → narsa (书) ma'lum bo'lsa: 「这是我的」 — O'zbek tilida ham: «mening kitobim» → «meniki».",
                  "「我的书」 → когда предмет (书) известен: 「这是我的」 — В русском тоже: «моя книга» → «моя».",
                  "「我的书」 → when the object (书) is known: 「这是我的」 — Same in English: \"my book\" → \"mine\".",
                )}
              </p>
            </div>
          </>
        )}

        {/* ── MISOLLAR ── */}
        {activeTab === 'examples' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
            <p className="grammar-block__hint" style={{ marginBottom:8 }}>
              💡 {t(
                "Avval harflarni o'qing, keyin bosing — pinyin va tarjima ko'rinadi",
                'Сначала прочитайте иероглифы, затем нажмите — увидите пиньинь и перевод',
                'Read the characters first, then tap — pinyin and translation appear',
              )}
            </p>
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{width:32,height:32,borderRadius:'50%',background:'#fdf2f8',border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',padding:0}} aria-label="Play">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#be185d"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{flex:1}}><ColorParts parts={ex.parts} /></span>
                </div>
                {expandedEx === i ? (
                  <>
                    <div className="grammar-block__example-py">{ex.pinyin}</div>
                    <div className="grammar-block__example-tr">{t(ex.uz, ex.ru, ex.en)}</div>
                    <div className="grammar-block__example-note">💡 {t(ex.note_uz, ex.note_ru, ex.note_en)}</div>
                  </>
                ) : (
                  <div className="grammar-block__usage-tr" style={{ color:'#bbb', fontStyle:'italic' }}>
                    {t('Pinyin va tarjima uchun bosing…','Нажмите для пиньиня и перевода…','Tap for pinyin and translation…')}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── DIALOG ── */}
        {activeTab === 'dialog' && (
          <>
            {/* Dialog 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 1 — Kimning kitobi?','Диалог 1 — Чья книга?','Dialogue 1 — Whose Book?')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fdf2f8' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_DE:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh"><ColorParts parts={line.parts} /></div>
                      {rev1[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t('Tarjima uchun bosing…','Нажмите для перевода…','Tap for translation…')}
                      </div>
                  }
                    </div>
                  </div>
                </button>
              ))}
              <p className="grammar-block__hint">{t('Tarjima uchun har bir satrga bosing','Нажмите на каждую строку для перевода','Tap each line for translation')}</p>
            </div>

            {/* Dialog 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 2 — Kimning telefoni?','Диалог 2 — Чей телефон?','Dialogue 2 — Whose Phone?')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fdf2f8' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_DE:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh"><ColorParts parts={line.parts} /></div>
                      {rev2[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t('Tarjima uchun bosing…','Нажмите для перевода…','Tap for translation…')}
                      </div>
                  }
                    </div>
                  </div>
                </button>
              ))}
              <p className="grammar-block__hint">{t('Tarjima uchun har bir satrga bosing','Нажмите на каждую строку для перевода','Tap each line for translation')}</p>
            </div>

            {/* Eslab qoling */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts:[{text:'我',color:C_SUB},{text:'的',color:C_DE},{text:'书',color:C_PRED}],
                  note: t("Olmosh + 的 + ot: 我的书 → mening kitobim","Местоимение + 的 + сущ.: 我的书 → моя книга","Pronoun + 的 + noun: 我的书 → my book"),
                },
                {
                  parts:[{text:'老师',color:C_SUB},{text:'的',color:C_DE},{text:'书',color:C_PRED}],
                  note: t("Ism + 的 + ot: 老师的书 → o'qituvchining kitobi","Имя + 的 + сущ.: 老师的书 → книга учителя","Name + 的 + noun: 老师的书 → teacher's book"),
                },
                {
                  parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的',color:C_DE},{text:'。',color:C_PUNC}],
                  note: t("的 yolg'iz → meniki (ot tushirildi)","的 одно → моё (существительное опущено)","的 alone → mine (noun dropped)"),
                },
                {
                  parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'谁的',color:C_DE},{text:'？',color:C_PUNC}],
                  note: t("谁的 = kimniki? (谁 + 的)","谁的 = чьё/чей/чья? (谁 + 的)","谁的 = whose? (谁 + 的)"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #be185d', background:'#fdf2f8' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#9d174d' }}>
                    💡 {item.note}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MASHQ ── */}
        {activeTab === 'quiz' && (
          <SpeakingMashq
            language={language}
            questions={speakingQuestions}
            accentColor="#be185d"
            accentBg="#fce7f3"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
