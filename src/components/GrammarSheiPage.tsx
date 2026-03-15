'use client';

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';

const C_SUB    = '#3b82f6'; // Subject / Ega
const C_SHI    = '#dc2626'; // 是 (Blim red)
const C_SHEI   = '#d97706'; // 谁 (who?)
const C_PRED   = '#16a34a'; // Predicate / Xabar
const C_NEG    = '#ea580c'; // 不是 negation
const C_MA     = '#b45309'; // 吗 question particle
const C_SHENME = '#7c3aed'; // 什么
const C_PUNC   = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'U kim?', ru: 'Кто он?', en: 'Who is he?', zh: '他是谁？', pinyin: 'Tā shì shéi?' },
  { uz: 'U (ayol) kim?', ru: 'Кто она?', en: 'Who is she?', zh: '她是谁？', pinyin: 'Tā shì shéi?' },
  { uz: 'Bu kimning kitobi?', ru: 'Чья это книга?', en: 'Whose book is this?', zh: '这是谁的书？', pinyin: 'Zhè shì shéi de shū?' },
  { uz: 'U kimning telefoni?', ru: 'Чей это телефон?', en: 'Whose phone is that?', zh: '那是谁的手机？', pinyin: 'Nà shì shéi de shǒujī?' },
  { uz: 'Bu kimniki?', ru: 'Чьё это?', en: 'Whose is this?', zh: '这是谁的？', pinyin: 'Zhè shì shéi de?' },
  { uz: 'Siz kimsiz?', ru: 'Кто вы?', en: 'Who are you?', zh: '你是谁？', pinyin: 'Nǐ shì shéi?' },
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
    parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
    pinyin:'Nà shì shéi?',
    uz:'U kim?',               ru:'Кто это?',                    en:'Who is that?',
    note_uz:"那 (nà) = u/o'sha · 是 (shì) = bo'lmoq",
    note_ru:'那 (nà) = тот/та · 是 (shì) = быть',
    note_en:'那 (nà) = that · 是 (shì) = to be',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ shì shéi?',
    uz:'Siz kimsiz?',          ru:'Кто вы?',                     en:'Who are you?',
    note_uz:'Eng keng tarqalgan 谁 savoli — har kuni ishlatiladi',
    note_ru:'Самый распространённый вопрос с 谁 — используется каждый день',
    note_en:'The most common 谁 question — used every day',
  },
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
    pinyin:'Zhè shì shéi?',
    uz:'Bu kim?',              ru:'Кто это?',                    en:'Who is this?',
    note_uz:"这 (zhè) = bu · 是 (shì) = bo'lmoq",
    note_ru:'这 (zhè) = это · 是 (shì) = быть',
    note_en:'这 (zhè) = this · 是 (shì) = to be',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ shì shéi?',
    uz:'Siz kimsiz?',          ru:'Кто вы?',                     en:'Who are you?',
    note_uz:'Tanishishda yoki hayron qolganda ishlatiladi',
    note_ru:'Используется при знакомстве или удивлении',
    note_en:'Used when meeting someone or expressing surprise',
  },
  {
    parts:[{text:'谁',color:C_SHEI},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Shéi shì lǎoshī?',
    uz:"Kim o'qituvchi?",      ru:'Кто учитель?',                en:'Who is the teacher?',
    note_uz:"谁 ega o'rnida: 谁 + 是 + kim ekanligini so'rash",
    note_ru:'谁 в роли подлежащего: 谁 + 是 + спрашиваем о ком-то',
    note_en:'谁 as subject: 谁 + 是 + asking who someone is',
  },
  {
    parts:[{text:'这是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'书',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Zhè shì shéi de shū?',
    uz:'Bu kimning kitobi?',   ru:'Чья это книга?',              en:'Whose book is this?',
    note_uz:'谁的 (shéi de) = kimning · 的 (de) = egalik belgisi',
    note_ru:'谁的 (shéi de) = чей/чья/чьё · 的 (de) = притяжательная частица',
    note_en:'谁的 (shéi de) = whose · 的 (de) = possessive particle',
  },
  {
    parts:[{text:'那是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'手机',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Nà shì shéi de shǒujī?',
    uz:'Bu kimning telefoni?', ru:'Чей это телефон?',            en:'Whose phone is that?',
    note_uz:'手机 (shǒujī) = telefon',
    note_ru:'手机 (shǒujī) = телефон',
    note_en:'手机 (shǒujī) = phone',
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
    pinyin:'Tā shì shéi?',
    uz:'U kim?',               ru:'Кто он?',                     en:'Who is he?',
    note_uz:'他 (tā) = u (erkak) — uchinchi shaxs',
    note_ru:'他 (tā) = он — третье лицо',
    note_en:'他 (tā) = he — third person',
  },
  {
    parts:[{text:'谁',color:C_SHEI},{text:'是',color:C_SHI},{text:'你的朋友',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Shéi shì nǐ de péngyǒu?',
    uz:"Kim sizning do'stingiz?", ru:'Кто ваш друг?',            en:'Who is your friend?',
    note_uz:"朋友 (péngyǒu) = do'st · 你的 = sizning",
    note_ru:'朋友 (péngyǒu) = друг · 你的 = ваш/твой',
    note_en:'朋友 (péngyǒu) = friend · 你的 = your',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],  py:'Nà shì shéi?',   uz:'U kim?',        ru:'Кто это?',  en:'Who is that?' },
  { parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],  py:'Zhè shì shéi?',  uz:'Bu kim?',       ru:'Кто это?',  en:'Who is this?' },
  { parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],  py:'Tā shì shéi?',   uz:'U kim?',        ru:'Кто он?',   en:'Who is he?' },
  { parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],  py:'Tā shì shéi?',   uz:'U kim? (ayol)', ru:'Кто она?',  en:'Who is she?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'谁',color:C_SHEI},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'？',color:C_PUNC}],          py:'Shéi shì lǎoshī?',        uz:"Kim o'qituvchi?",         ru:'Кто учитель?',    en:'Who is the teacher?' },
  { parts:[{text:'谁',color:C_SHEI},{text:'是',color:C_SHI},{text:'你的朋友',color:C_PRED},{text:'？',color:C_PUNC}],      py:'Shéi shì nǐ de péngyǒu?', uz:"Kim sizning do'stingiz?", ru:'Кто ваш друг?',   en:'Who is your friend?' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'这是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'书',color:C_PRED},{text:'？',color:C_PUNC}],        py:'Zhè shì shéi de shū?',    uz:'Bu kimning kitobi?',      ru:'Чья это книга?',  en:'Whose book is this?' },
  { parts:[{text:'那是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'手机',color:C_PRED},{text:'？',color:C_PUNC}],      py:'Nà shì shéi de shǒujī?',  uz:'Bu kimning telefoni?',    ru:'Чей это телефон?',en:'Whose phone is that?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],                                        py:'Nà shì shéi?',              uz:'U kim?',                          ru:'Кто это?',                en:'Who is that?' },
  { s:'B', parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'我的老师。',color:C_PRED}],                                                          py:'Nà shì wǒ de lǎoshī.',     uz:"U mening o'qituvchim.",           ru:'Это мой учитель.',        en:'That is my teacher.' },
  { s:'A', parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'谁的',color:C_SHEI},{text:'老师',color:C_PRED},{text:'？',color:C_PUNC}],             py:'Tā shì shéi de lǎoshī?',   uz:"U kimning o'qituvchisi?",         ru:'Чей он учитель?',         en:'Whose teacher is he?' },
  { s:'B', parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'我们的老师。',color:C_PRED}],                                                        py:'Tā shì wǒmen de lǎoshī.',  uz:"U bizning o'qituvchimiz.",        ru:'Он наш учитель.',         en:'He is our teacher.' },
  { s:'A', parts:[{text:'他叫',color:C_SUB},{text:'什么',color:C_SHENME},{text:'名字？',color:C_PRED}],                                                       py:'Tā jiào shénme míngzi?',   uz:'Uning ismi nima?',                ru:'Как его зовут?',          en:'What is his name?' },
  { s:'B', parts:[{text:'他叫王老师。',color:C_SUB}],                                                                                                        py:'Tā jiào Wáng lǎoshī.',     uz:'Uni Wang ustoz deb chaqirishadi.',ru:'Его зовут учитель Ван.',  en:'His name is Teacher Wang.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'这是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'书',color:C_PRED},{text:'？',color:C_PUNC}],                                   py:'Zhè shì shéi de shū?',      uz:'Bu kimning kitobi?',              ru:'Чья это книга?',          en:'Whose book is this?' },
  { s:'B', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'我的书。',color:C_PRED}],                                                           py:'Zhè shì wǒ de shū.',        uz:'Bu mening kitobim.',              ru:'Это моя книга.',          en:'This is my book.' },
  { s:'A', parts:[{text:'那',color:C_SUB},{text:'也是',color:C_SHI},{text:'你的',color:C_SHEI},{text:'吗？',color:C_MA}],                                    py:'Nà yě shì nǐ de ma?',       uz:'U ham siznikimi?',                ru:'Это тоже ваше?',          en:'Is that also yours?' },
  { s:'B', parts:[{text:'不是，那',color:C_NEG},{text:'是',color:C_SHI},{text:'我朋友的。',color:C_PRED}],                                                   py:'Bú shì, nà shì wǒ péngyǒu de.', uz:"Yo'q, u do'stimniki.",        ru:'Нет, это моего друга.',   en:"No, that's my friend's." },
];

const quizQuestions: {
  q_uz: string; q_ru: string; q_en: string;
  options?: string[]; options_uz?: string[]; options_ru?: string[]; options_en?: string[];
  correct: number;
}[] = [
  {
    q_uz:"谁 qanday o'qiladi?",
    q_ru:'Как читается 谁?',
    q_en:'How is 谁 pronounced?',
    options:['shuì','guī','shéi','zhéi'],
    correct:2,
  },
  {
    q_uz:'"U kim?" xitoycha qanday?',
    q_ru:'Как сказать «Кто это?» по-китайски?',
    q_en:'How do you say "Who is that?" in Chinese?',
    options:['那是什么？','那是谁？','谁那是？','是谁那？'],
    correct:1,
  },
  {
    q_uz:'"Bu kimning kitobi?" qanday?',
    q_ru:'Как сказать «Чья это книга?» по-китайски?',
    q_en:'How do you say "Whose book is this?" in Chinese?',
    options:['这是谁书？','谁的这是书？','这是谁的书？','书谁的是这？'],
    correct:2,
  },
  {
    q_uz:'谁 gapda qayerda turishi mumkin?',
    q_ru:'Где может стоять 谁 в предложении?',
    q_en:'Where can 谁 appear in a sentence?',
    options_uz:["Faqat gap oxirida","Faqat gap boshida","Ega yoki ob'yekt o'rnida","Fe'ldan keyin, har doim"],
    options_ru:['Только в конце','Только в начале','На месте подлежащего или дополнения','После глагола, всегда'],
    options_en:['Only at the end','Only at the beginning','As subject or object','After the verb, always'],
    correct:2,
  },
  {
    q_uz:'"Kim o\'qituvchi?" xitoycha qanday?',
    q_ru:'Как сказать «Кто учитель?» по-китайски?',
    q_en:'How do you say "Who is the teacher?" in Chinese?',
    options:['是谁老师？','谁是老师？','老师是谁？','谁老师是？'],
    correct:1,
  },
  {
    q_uz:'谁的 nima degani?',
    q_ru:'Что означает 谁的?',
    q_en:'What does 谁的 mean?',
    options_uz:['Kim?','Kimda?','Kimning?','Kimga?'],
    options_ru:['Кто?','У кого?','Чей/Чья/Чьё?','Кому?'],
    options_en:['Who?','With whom?','Whose?','To whom?'],
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

export function GrammarSheiPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();

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
      <div className="grammar-page__hero">
        <div className="grammar-page__hero-bg">谁</div>
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">
            HSK 1 · {t('Grammatika','Грамматика','Grammar')}
          </div>
          <h1 className="grammar-page__hero-char">谁</h1>
          <div className="grammar-page__hero-pinyin">shéi</div>
          <div className="grammar-page__hero-meaning">
            — {t('kim?','кто?','who?')} —
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
                <div className="grammar-block__big-char">谁</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">shéi</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('2-ton (ko\'tariluvchi) ↗','2-й тон (восходящий) ↗','2nd tone (rising) ↗')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('10 ta','10','10')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('kim?','кто?','who?')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Boshqacha",'Вариант','Variant')}</span>
                    <span className="grammar-block__info-val">shuí {t('(ikkalasi to\'g\'ri)','(оба варианта верны)','(both correct)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 谁 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('谁 nima?','谁 — что это?','What is 谁?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_SHEI }}>谁</strong> = <strong>{t('kim','кто','who')}</strong>
                <br />
                {t(
                  'Kishi haqida savol berish uchun ishlatiladi.',
                  'Используется для вопроса о человеке.',
                  'Used to ask about a person.',
                )}
              </p>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Kim u?» desak, so'z tartibi o'zgaradi. Xitoy tilida esa 谁 faqat so'raladigan kishi o'rniga qo'yiladi — boshqa hech narsa o'zgarmaydi:",
                  "В русском «Кто он?» тоже меняется порядок слов (инверсия). В китайском 谁 просто заменяет нужное слово на том же месте — ничего не меняется:",
                  "In English \"Who is he?\" inverts word order (\"he is\" → \"who is\"). In Chinese, 谁 simply replaces the known word in the same spot — no inversion needed:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Darak gap','Повествование','Statement')}</div>
                                    <div className="grammar-block__usage-py">Nà shì wǒ de lǎoshī.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'我的老师',color:C_PRED},{text:'。',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t("U mening o'qituvchim.",'Это мой учитель.','That is my teacher.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>+谁→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#fefce8', border:'1px solid #fde68a', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_SHEI }}>{t('Savol','Вопрос','Question')}</div>
                                    <div className="grammar-block__usage-py">Nà shì shéi?</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('U kim?','Кто это?','Who is that?')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "«Mening o'qituvchim» o'rniga 谁 qo'yildi — boshqa hech narsa o'zgarmadi.",
                  "«Мой учитель» заменили на 谁 — больше ничего не изменилось.",
                  "\"My teacher\" was replaced with 谁 — nothing else changed.",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,   uz:'Ega (kim?)',        ru:'Подлежащее (кто?)',  en:'Subject (who?)' },
                  { color:C_SHI,   uz:"是 (bo'lmoq)",      ru:'是 (быть)',           en:'是 (to be)' },
                  { color:C_SHEI,  uz:'谁 (kim?)',          ru:'谁 (кто?)',           en:'谁 (who?)' },
                  { color:C_PRED,  uz:'Xabar (nima?)',      ru:'Сказуемое (что?)',   en:'Predicate (what?)' },
                  { color:C_MA,    uz:'吗 (savol)',          ru:'吗 (вопрос)',         en:'吗 (question)' },
                  { color:C_SHENME,uz:'什么 (nima?)',        ru:'什么 (что?)',         en:'什么 (what?)' },
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
              <div className="grammar-block__label">{t('1-shablon — Bu/U kim?','Шаблон 1 — Кто это/он?','Pattern 1 — Who is this/that?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>这 / 那 / 他 / 她</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span style={{ color:C_SHEI, fontWeight:700 }}>谁</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t('Ko\'rsatib kimligini so\'rash','Указать и спросить, кто это','Point to someone and ask who they are')}
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
                  "他 (erkak) va 她 (ayol) ikkalasi ham tā deb talaffuz qilinadi — faqat yozuvda farq bor.",
                  "他 (муж.) и 她 (жен.) оба читаются как tā — разница только на письме.",
                  "他 (male) and 她 (female) are both pronounced tā — the difference is only in writing.",
                )}
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Kim …dir?','Шаблон 2 — Кто является …?','Pattern 2 — Who is …?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SHEI, fontWeight:700 }}>谁</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Xabar','Сказуемое','Predicate')}</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("谁 ega o'rnida — kimligini so'rash",'谁 в роли подлежащего — спрашиваем о ком-то','谁 as subject — asking who someone is')}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 3 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — Kimning … ?','Шаблон 3 — Чей/Чья/Чьё … ?','Pattern 3 — Whose … ?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:'#555' }}>这 / 那 是</span>
                {' '}
                <span style={{ color:C_SHEI, fontWeight:700 }}>谁的</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Narsa','Предмет','Object')}</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("谁的 = kimning — egalikni so'rash",'谁的 = чей/чья/чьё — спрашиваем о принадлежности','谁的 = whose — asking about possession')}
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
                  "谁的 = kimning. Xuddi 你的 (sizning), 我的 (mening) kabi — faqat kim ekanligini bilmaymiz.",
                  "谁的 = чей. Аналогично 你的 (твой), 我的 (мой) — просто не знаем, кому принадлежит.",
                  "谁的 = whose. Just like 你的 (your), 我的 (my) — we just don't know who it belongs to.",
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
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1}}><ColorParts parts={ex.parts} /></span>
                  <span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</span>
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
              <div className="grammar-block__label">{t("Dialog 1 — O'qituvchi haqida",'Диалог 1 — Об учителе','Dialogue 1 — About the Teacher')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fefce8' : undefined }}
                >
                                    <div className="grammar-block__usage-py">{line.py}</div>
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_SHEI : C_SHI, marginRight:6 }}>{line.s}:</span>
                    <ColorParts parts={line.parts} />
                  </div>
                  {rev1[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t('Tarjima uchun bosing…','Нажмите для перевода…','Tap for translation…')}
                      </div>
                  }
                </button>
              ))}
              <p className="grammar-block__hint">{t('Tarjima uchun har bir satrga bosing','Нажмите на каждую строку для перевода','Tap each line for translation')}</p>
            </div>

            {/* Dialog 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 2 — Kimning narsasi?','Диалог 2 — Чья вещь?','Dialogue 2 — Whose Belongings?')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fefce8' : undefined }}
                >
                                    <div className="grammar-block__usage-py">{line.py}</div>
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_SHEI : C_SHI, marginRight:6 }}>{line.s}:</span>
                    <ColorParts parts={line.parts} />
                  </div>
                  {rev2[i]
                    ? <div className="grammar-block__usage-tr">{t(line.uz, line.ru, line.en)}</div>
                    : <div className="grammar-block__usage-tr" style={{ color:'#ccc', fontStyle:'italic' }}>
                        {t('Tarjima uchun bosing…','Нажмите для перевода…','Tap for translation…')}
                      </div>
                  }
                </button>
              ))}
              <p className="grammar-block__hint">{t('Tarjima uchun har bir satrga bosing','Нажмите на каждую строку для перевода','Tap each line for translation')}</p>
            </div>

            {/* Eslab qoling */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts:[{text:'那',color:C_SUB},{text:'是',color:C_SHI},{text:'谁',color:C_SHEI},{text:'？',color:C_PUNC}],
                  note: t("Ob'yekt o'rnida: 那是谁？→ U kim?",'Вместо дополнения: 那是谁？→ Кто это?','As object: 那是谁？→ Who is that?'),
                  ok: true,
                },
                {
                  parts:[{text:'谁',color:C_SHEI},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'？',color:C_PUNC}],
                  note: t("Ega o'rnida: 谁是老师？→ Kim o'qituvchi?",'Подлежащее: 谁是老师？→ Кто учитель?','As subject: 谁是老师？→ Who is the teacher?'),
                  ok: true,
                },
                {
                  parts:[{text:'这是',color:C_SUB},{text:'谁的',color:C_SHEI},{text:'书',color:C_PRED},{text:'？',color:C_PUNC}],
                  note: t('谁的 = kimning: Bu kimning kitobi?','谁的 = чей: Чья это книга?','谁的 = whose: Whose book is this?'),
                  ok: true,
                },
              ] as { parts: Part[]; note: string; ok: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #d97706', background:'#fffbeb' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#92400e' }}>
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
            accentColor="#d97706"
            accentBg="#fffbeb"
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
