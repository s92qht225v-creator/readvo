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
const C_PRED = '#16a34a'; // Predicate / B
const C_NEG  = '#ea580c'; // 不是 negation
const C_MA   = '#b45309'; // 吗 question
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Men talabaman.', ru: 'Я студент.', en: 'I am a student.', zh: '我是学生。', pinyin: 'Wǒ shì xuésheng.' },
  { uz: "U o'qituvchi.", ru: 'Он учитель.', en: 'He is a teacher.', zh: '他是老师。', pinyin: 'Tā shì lǎoshī.' },
  { uz: 'Bu kitob.', ru: 'Это книга.', en: 'This is a book.', zh: '这是书。', pinyin: 'Zhè shì shū.' },
  { uz: 'U talaba emas.', ru: 'Она не студентка.', en: 'She is not a student.', zh: '她不是学生。', pinyin: 'Tā bú shì xuésheng.' },
  { uz: 'Siz xitoylikmisiz?', ru: 'Вы китаец?', en: 'Are you Chinese?', zh: '你是中国人吗？', pinyin: 'Nǐ shì Zhōngguórén ma?' },
  { uz: "U mening do'stim.", ru: 'Он мой друг.', en: 'He is my friend.', zh: '他是我的朋友。', pinyin: 'Tā shì wǒ de péngyǒu.' },
];

const sections = [
  { id: 'intro',    uz: 'Asosiy',   ru: 'Основное', en: 'Overview'  },
  { id: 'usage',    uz: 'Shablon',  ru: 'Шаблоны',  en: 'Patterns'  },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const examples: {
  parts: Part[];
  pinyin: string;
  uz: string; ru: string; en: string;
  note_uz: string; note_ru: string; note_en: string;
}[] = [
  {
    parts: [{ text:'我',color:C_SUB },{ text:'是',color:C_SHI },{ text:'学生',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Wǒ shì xuésheng.', uz:'Men talabaman.', ru:'Я студент.', en:'I am a student.',
    note_uz:'我 (wǒ) = men · 学生 (xuésheng) = talaba',
    note_ru:'我 (wǒ) = я · 学生 (xuésheng) = студент',
    note_en:'我 (wǒ) = I · 学生 (xuésheng) = student',
  },
  {
    parts: [{ text:'她',color:C_SUB },{ text:'是',color:C_SHI },{ text:'老师',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Tā shì lǎoshī.', uz:"U o'qituvchi.", ru:'Она учитель.', en:'She is a teacher.',
    note_uz:"她 (tā) = u (ayol) · 老师 (lǎoshī) = o'qituvchi",
    note_ru:'她 (tā) = она · 老师 (lǎoshī) = учитель',
    note_en:'她 (tā) = she · 老师 (lǎoshī) = teacher',
  },
  {
    parts: [{ text:'我',color:C_SUB },{ text:'是',color:C_SHI },{ text:'中国人',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Wǒ shì Zhōngguó rén.', uz:'Men xitoylikman.', ru:'Я китаец.', en:'I am Chinese.',
    note_uz:'中国 (Zhōngguó) = Xitoy · 人 (rén) = kishi',
    note_ru:'中国 (Zhōngguó) = Китай · 人 (rén) = человек',
    note_en:'中国 (Zhōngguó) = China · 人 (rén) = person',
  },
  {
    parts: [{ text:'他',color:C_SUB },{ text:'是',color:C_SHI },{ text:'我的朋友',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:"Tā shì wǒ de péngyǒu.", uz:"U mening do'stim.", ru:'Он мой друг.', en:'He is my friend.',
    note_uz:"的 (de) = ning · 朋友 (péngyǒu) = do'st",
    note_ru:'的 (de) = притяжательная частица · 朋友 (péngyǒu) = друг',
    note_en:'的 (de) = possessive · 朋友 (péngyǒu) = friend',
  },
  {
    parts: [{ text:'这',color:C_SUB },{ text:'是',color:C_SHI },{ text:'书',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Zhè shì shū.', uz:'Bu kitob.', ru:'Это книга.', en:'This is a book.',
    note_uz:'这 (zhè) = bu · 书 (shū) = kitob',
    note_ru:'这 (zhè) = это · 书 (shū) = книга',
    note_en:'这 (zhè) = this · 书 (shū) = book',
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'是',color:C_SHI },{ text:'学生',color:C_PRED },{ text:'吗？',color:C_MA }],
    pinyin:'Nǐ shì xuésheng ma?', uz:'Siz talabamisiz?', ru:'Вы студент?', en:'Are you a student?',
    note_uz:'吗 (ma) = savol yuklamasi — gap oxiriga qo\'yiladi',
    note_ru:'吗 (ma) = вопросительная частица — ставится в конце',
    note_en:'吗 (ma) = question particle — placed at the end',
  },
  {
    parts: [{ text:'我',color:C_SUB },{ text:'不是',color:C_NEG },{ text:'医生',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Wǒ bú shì yīshēng.', uz:'Men shifokor emasman.', ru:'Я не врач.', en:'I am not a doctor.',
    note_uz:"不是 (bú shì) = emas · 医生 (yīshēng) = shifokor",
    note_ru:'不是 (bú shì) = не является · 医生 (yīshēng) = врач',
    note_en:'不是 (bú shì) = is not · 医生 (yīshēng) = doctor',
  },
  {
    parts: [{ text:'我们',color:C_SUB },{ text:'是',color:C_SHI },{ text:'同学',color:C_PRED },{ text:'。',color:C_PUNC }],
    pinyin:'Wǒmen shì tóngxué.', uz:'Biz sinfdoshimiz.', ru:'Мы однокласники.', en:'We are classmates.',
    note_uz:"我们 (wǒmen) = biz · 同学 (tóngxué) = sinfdosh",
    note_ru:'我们 (wǒmen) = мы · 同学 (tóngxué) = одноклассник',
    note_en:'我们 (wǒmen) = we · 同学 (tóngxué) = classmate',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}],  py:'Wǒ shì xuésheng.',       uz:'Men talabaman.',       ru:'Я студент.',       en:'I am a student.' },
  { parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'。',color:C_PUNC}],  py:'Tā shì lǎoshī.',         uz:"U o'qituvchi.",        ru:'Она учитель.',     en:'She is a teacher.' },
  { parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'乌兹别克人',color:C_PRED},{text:'。',color:C_PUNC}], py:'Wǒ shì Wūzībiékè rén.', uz:"Men o'zbekman.",        ru:'Я узбек.',         en:"I am Uzbek." },
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'书',color:C_PRED},{text:'。',color:C_PUNC}],    py:'Zhè shì shū.',           uz:'Bu kitob.',            ru:'Это книга.',       en:'This is a book.' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],    py:'Nǐ shì xuésheng ma?',   uz:'Siz talabamisiz?',         ru:'Вы студент?',              en:'Are you a student?' },
  { parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'吗？',color:C_MA}],    py:'Tā shì lǎoshī ma?',     uz:"U o'qituvchimi?",          ru:'Она учитель?',             en:'Is she a teacher?' },
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'你的书',color:C_PRED},{text:'吗？',color:C_MA}],  py:'Zhè shì nǐ de shū ma?', uz:'Bu sizning kitobingizmi?', ru:'Это ваша книга?',          en:'Is this your book?' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'不是',color:C_NEG},{text:'老师',color:C_PRED},{text:'。',color:C_PUNC}],  py:'Wǒ bú shì lǎoshī.',    uz:"Men o'qituvchi emasman.", ru:'Я не учитель.',   en:'I am not a teacher.' },
  { parts:[{text:'他',color:C_SUB},{text:'不是',color:C_NEG},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}],  py:'Tā bú shì xuésheng.',  uz:'U talaba emas.',          ru:'Он не студент.',  en:'He is not a student.' },
  { parts:[{text:'这',color:C_SUB},{text:'不是',color:C_NEG},{text:'我的',color:C_PRED},{text:'。',color:C_PUNC}],  py:'Zhè bú shì wǒ de.',    uz:'Bu meniki emas.',         ru:'Это не моё.',     en:'This is not mine.' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你好！你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],              py:'Nǐ hǎo! Nǐ shì xuésheng ma?',       uz:'Salom! Siz talabamisiz?',            ru:'Привет! Вы студент?',                  en:'Hi! Are you a student?' },
  { s:'B', parts:[{text:'是的，我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。你呢？',color:C_PUNC}],         py:'Shì de, wǒ shì xuésheng. Nǐ ne?',   uz:'Ha, men talabaman. Sizchi?',         ru:'Да, я студент. А вы?',                 en:'Yes, I am a student. And you?' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'不是',color:C_NEG},{text:'学生，我',color:C_PRED},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'。',color:C_PUNC}], py:'Wǒ bú shì xuésheng, wǒ shì lǎoshī.', uz:"Men talaba emasman, men o'qituvchiman.", ru:'Я не студент, я учитель.', en:"I am not a student, I am a teacher." },
  { s:'B', parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'中国人',color:C_PRED},{text:'吗？',color:C_MA}],                   py:'Nǐ shì Zhōngguó rén ma?',            uz:'Siz xitoylikmisiz?',                ru:'Вы китаец?',                           en:'Are you Chinese?' },
  { s:'A', parts:[{text:'不是，我',color:C_SUB},{text:'是',color:C_SHI},{text:'乌兹别克人',color:C_PRED},{text:'。',color:C_PUNC}],          py:'Bú shì, wǒ shì Wūzībiékè rén.',     uz:"Yo'q, men o'zbekman.",               ru:'Нет, я узбек.',                        en:"No, I am Uzbek." },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'什么',color:'#d97706'},{text:'？',color:C_PUNC}],                  py:'Zhè shì shénme?',                uz:'Bu nima?',                           ru:'Что это?',                            en:'What is this?' },
  { s:'B', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'书',color:C_PRED},{text:'。',color:C_PUNC}],                        py:'Zhè shì shū.',                   uz:'Bu kitob.',                          ru:'Это книга.',                           en:'This is a book.' },
  { s:'A', parts:[{text:'是你的书',color:C_PRED},{text:'吗？',color:C_MA}],                                                                  py:'Shì nǐ de shū ma?',              uz:'Bu sizning kitobingizmi?',           ru:'Это ваша книга?',                      en:'Is this your book?' },
  { s:'B', parts:[{text:'不是',color:C_NEG},{text:'，是我朋友的书',color:C_PRED},{text:'。',color:C_PUNC}],                                  py:'Bú shì, shì wǒ péngyǒu de shū.', uz:"Yo'q, do'stimning kitobi.",         ru:'Нет, это книга моего друга.',          en:"No, it's my friend's book." },
];

const quizQuestions = [
  {
    q_uz:'"Men talabaman" xitoycha qanday?',
    q_ru:'Как сказать «Я студент» по-китайски?',
    q_en:'How do you say "I am a student" in Chinese?',
    options: ['我学生是。', '我是学生。', '是我学生。', '我学是生。'],
    correct: 1,
  },
  {
    q_uz:'是 qanday o\'qiladi?',
    q_ru:'Как читается 是?',
    q_en:'How is 是 pronounced?',
    options: ['sì', 'xì', 'shì', 'zhì'],
    correct: 2,
  },
  {
    q_uz:'"U o\'qituvchi emas" qanday?',
    q_ru:'Как сказать «Она не учитель»?',
    q_en:'How do you say "She is not a teacher"?',
    options: ['她是不老师。', '她不是老师。', '不她是老师。', '她是老师不。'],
    correct: 1,
  },
  {
    q_uz:'"Bu kitobmi?" deb qanday so\'raysiz?',
    q_ru:'Как спросить «Это книга?»?',
    q_en:'How do you ask "Is this a book?"?',
    options: ['这书是吗？', '这是书吗？', '吗这是书？', '这是吗书？'],
    correct: 1,
  },
  {
    q_uz:'是 ning inkor shakli qaysi?',
    q_ru:'Как образуется отрицание от 是?',
    q_en:'What is the negative form of 是?',
    options: ['没是', '无是', '不是', '非是'],
    correct: 2,
  },
  {
    q_uz:'"Siz xitoylikmisiz?" qanday?',
    q_ru:'Как сказать «Вы китаец?» по-китайски?',
    q_en:'How do you say "Are you Chinese?" in Chinese?',
    options: ['你中国人是吗？', '你是中国人吗？', '你吗是中国人？', '是你中国人？'],
    correct: 1,
  },
];

function ColorParts({ parts }: { parts: Part[] }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color, fontWeight: p.color === C_PUNC ? 400 : 600 }}>
          {p.text}
        </span>
      ))}
    </span>
  );
}

export function GrammarShiPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('shi');
    if (existing === undefined || newStars > existing) saveStars('shi', newStars);
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
        <div className="dr-hero__watermark">是</div>
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
          <h1 className="dr-hero__title">是</h1>
          <div className="dr-hero__pinyin">shì</div>
          <div className="dr-hero__translation">
            — {t("bo'lmoq / …dir", 'быть / являться', 'to be')} —
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
                <div className="grammar-block__big-char">是</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">shì</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('4-ton (tushuvchi) ↘','4-й тон (нисходящий) ↘','4th tone (falling) ↘')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t("bo'lmoq, …dir","быть, являться",'to be')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What it is */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('是 nima?','是 — что это?','What is 是?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color: C_SHI }}>是</strong> = <strong>{t("bo'lmoq","быть",'to be')}</strong>
                {' '}({t('inglizcha "to be"','в английском "to be"','the English "to be"')})<br />
                {t('A = B deyish uchun ishlatiladi.','Используется для утверждения A = B.','Used to state A = B.')}
              </p>
            </div>

            {/* Difference from Uzbek/Russian */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("O'zbek tilidan farqi",'Отличие от русского','Key Difference')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Men talabaman» desak, fe'l otga qo'shimcha sifatida qo'shiladi. Xitoy tilida esa 是 har doim alohida so'z — uni tushirib qoldirish mumkin emas:",
                  "В русском «Я студент» глагол «быть» опускается. В китайском 是 всегда обязателен — его нельзя пропустить:",
                  "Unlike English where 'to be' can sometimes be dropped in casual speech, in Chinese 是 is always required — you cannot omit it:",
                )}
              </p>
              <div className="grammar-block__usage-item">
                                <div className="grammar-block__usage-py">Wǒ shì xuésheng.</div>
                <div className="grammar-block__usage-zh">
                  <ColorParts parts={[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('Men talabaman.','Я студент.','I am a student.')}</div>
              </div>
              <div className="grammar-block__usage-item" style={{ background:'#fee2e2' }}>
                <div className="grammar-block__usage-zh" style={{ textDecoration:'line-through', color:'#991b1b' }}>我学生。</div>
                <div className="grammar-block__usage-py" style={{ color:'#991b1b' }}>
                  ✗ {t("是 ni tushirib bo'lmaydi!","是 нельзя пропускать!",'是 cannot be omitted!')}
                </div>
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color: C_SUB,  uz:"Ega (kim?)",       ru:"Подлежащее (кто?)", en:"Subject (who?)" },
                  { color: C_SHI,  uz:"是 (bo'lmoq)",      ru:"是 (быть)",          en:"是 (to be)" },
                  { color: C_PRED, uz:"Xabar (nima?)",     ru:"Сказуемое (что?)",  en:"Predicate (what?)" },
                  { color: C_NEG,  uz:"不是 (emas)",        ru:"不是 (не является)", en:"不是 (is not)" },
                  { color: C_MA,   uz:"吗 (savol)",         ru:"吗 (вопрос)",        en:"吗 (question)" },
                ] as { color: string; uz: string; ru: string; en: string }[]).map((r, i) => (
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
            {/* Pattern 1: A 是 B */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-shablon — A = B','Шаблон 1 — A = B','Pattern 1 — A = B')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>B</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">{t('A = B (A — B dir)','A = B (A является B)','A = B (A is B)')}</p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 2: A 是 B 吗 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Savol (吗)','Шаблон 2 — Вопрос (吗)','Pattern 2 — Question (吗)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>B</span>
                {' '}
                <span className="grammar-block__formula-ma">吗</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Gap oxiriga 吗 qo'shilsa — savol.",'Добавьте 吗 в конец — получится вопрос.','Add 吗 at the end to form a question.')}
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
                  "吗 (ma) faqat gap oxiriga qo'yiladi. So'z tartibi o'zgarmaydi.",
                  "吗 (ma) ставится только в конце. Порядок слов не меняется.",
                  "吗 (ma) is placed only at the end. Word order does not change.",
                )}
              </p>
            </div>

            {/* Pattern 3: A 不是 B */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — Inkor (不是)','Шаблон 3 — Отрицание (不是)','Pattern 3 — Negation (不是)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-neg">不是</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>B</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">{t('A ≠ B (A — B emas)','A ≠ B (A не является B)','A ≠ B (A is not B)')}</p>
              {pattern3Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ marginTop:10, marginBottom:0 }}>
                <div className="grammar-block__label">{t('Ton o\'zgarishi','Изменение тона','Tone Change')}</div>
                <p className="grammar-block__tip-text">
                  {t(
                    '不 odatda 4-ton (bù), lekin 是 oldida 2-tonga o\'zgaradi:',
                    '不 обычно 4-й тон (bù), но перед 是 меняется на 2-й тон:',
                    '不 is normally 4th tone (bù), but before 是 it changes to 2nd tone:',
                  )}
                </p>
                <div className="grammar-block__tone-change">
                  bù → <span className="grammar-block__tone-new">bú</span> shì
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MISOLLAR ── */}
        {activeTab === 'examples' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
            {examples.map((ex, i) => (
              <button
                key={i}
                type="button"
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1}}><ColorParts parts={ex.parts} /></span>
                  <span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</span>
                </div>
                <div className="grammar-block__example-py">{ex.pinyin}</div>
                <div className="grammar-block__example-tr">{t(ex.uz, ex.ru, ex.en)}</div>
                {expandedEx === i && (
                  <div className="grammar-block__example-note">
                    💡 {t(ex.note_uz, ex.note_ru, ex.note_en)}
                  </div>
                )}
              </button>
            ))}
            <p className="grammar-block__hint">
              {t("Bosing — izoh ko'rinadi",'Нажмите — увидите пояснение','Tap to see explanation')}
            </p>
          </div>
        )}

        {/* ── DIALOG ── */}
        {activeTab === 'dialog' && (
          <>
            {/* Dialog 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 1 — Tanishish','Диалог 1 — Знакомство','Dialogue 1 — Introductions')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fff8f8' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh"><ColorParts parts={line.parts} /></div>
                      {rev1[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t("Tarjima uchun bosing…","Нажмите для перевода…","Tap for translation…")}
                      </div>
                  }
                    </div>
                  </div>
                </button>
              ))}
              <p className="grammar-block__hint">{t("Tarjima uchun bosing","Нажмите для перевода","Tap for translation")}</p>
            </div>

            {/* Dialog 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 2 — Narsalar haqida','Диалог 2 — О предметах','Dialogue 2 — About Objects')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fff8f8' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
                    <div style={{flex:1}}>
                      <div className="grammar-block__usage-py">{line.py}</div>
                      <div className="grammar-block__usage-zh"><ColorParts parts={line.parts} /></div>
                      {rev2[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t("Tarjima uchun bosing…","Нажмите для перевода…","Tap for translation…")}
                      </div>
                  }
                    </div>
                  </div>
                </button>
              ))}
              <p className="grammar-block__hint">{t("Tarjima uchun bosing","Нажмите для перевода","Tap for translation")}</p>
            </div>

            {/* Remember */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts: [{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}],
                  note: t('Men talabaman. (是 majburiy)','Я студент. (是 обязателен)','I am a student. (是 required)'),
                  ok: true,
                },
                {
                  parts: [{text:'我学生。',color:'#991b1b'}],
                  note: t("是 ni tushirib bo'lmaydi!",'是 нельзя пропускать!','是 cannot be omitted!'),
                  ok: false,
                },
                {
                  parts: [{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],
                  note: t("吗 qo'shilsa — savol.",'吗 в конце — вопрос.','Add 吗 for a question.'),
                  ok: true,
                },
                {
                  parts: [{text:'我',color:C_SUB},{text:'不是',color:C_NEG},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}],
                  note: t('Inkor uchun 不是 ishlatiladi.','Для отрицания используется 不是.','Use 不是 for negation.'),
                  ok: true,
                },
              ] as { parts: Part[]; note: string; ok: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:`3px solid ${item.ok ? '#16a34a' : '#ef4444'}`, background: item.ok ? '#f0fdf4' : '#fff1f2' }}
                >
                  <div className="grammar-block__usage-zh" style={{ textDecoration: item.ok ? undefined : 'line-through' }}>
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color: item.ok ? '#166534' : '#991b1b' }}>
                    {item.ok ? '✓' : '✗'} {item.note}
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
            accentColor="#dc2626"
            accentBg="#fee2e2"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
