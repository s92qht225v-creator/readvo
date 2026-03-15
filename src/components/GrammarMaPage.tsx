'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_SHI  = '#dc2626'; // 是 / verb (Blim red)
const C_PRED = '#16a34a'; // Predicate / Xabar
const C_NEG  = '#ea580c'; // 不是 negation
const C_MA   = '#b45309'; // 吗 question particle
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Yaxshimisiz?', ru: 'Как вы?', en: 'How are you?', zh: '你好吗？', pinyin: 'Nǐ hǎo ma?' },
  { uz: 'Bu kitobmi?', ru: 'Это книга?', en: 'Is this a book?', zh: '这是书吗？', pinyin: 'Zhè shì shū ma?' },
  { uz: "U o'qituvchimi?", ru: 'Он учитель?', en: 'Is he a teacher?', zh: '他是老师吗？', pinyin: 'Tā shì lǎoshī ma?' },
  { uz: 'Siz talabamisiz?', ru: 'Вы студент?', en: 'Are you a student?', zh: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?' },
  { uz: 'U siznikimi?', ru: 'Это ваше?', en: 'Is that yours?', zh: '那是你的吗？', pinyin: 'Nà shì nǐ de ma?' },
  { uz: 'Siz xitoylikmisiz?', ru: 'Вы китаец?', en: 'Are you Chinese?', zh: '你是中国人吗？', pinyin: 'Nǐ shì Zhōngguórén ma?' },
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
    parts:[{text:'你好',color:C_SUB},{text:'吗',color:C_MA},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ hǎo ma?',
    uz:'Yaxshimisiz?',               ru:'Как дела?',                      en:'How are you?',
    note_uz:'你好 (nǐ hǎo) = salom / yaxshi · 吗 savol qiladi',
    note_ru:'你好 (nǐ hǎo) = привет / хорошо · 吗 превращает фразу в вопрос',
    note_en:'你好 (nǐ hǎo) = hello / good · 吗 turns the phrase into a question',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Nǐ shì xuésheng ma?',
    uz:'Siz talabamisiz?',            ru:'Вы студент?',                    en:'Are you a student?',
    note_uz:"是 (shì) = bo'lmoq · 学生 (xuésheng) = talaba",
    note_ru:'是 (shì) = быть · 学生 (xuésheng) = студент',
    note_en:'是 (shì) = to be · 学生 (xuésheng) = student',
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Tā shì lǎoshī ma?',
    uz:"U o'qituvchimi?",             ru:'Он учитель?',                    en:'Is he a teacher?',
    note_uz:"他 (tā) = u (erkak) · 老师 (lǎoshī) = o'qituvchi",
    note_ru:'他 (tā) = он · 老师 (lǎoshī) = учитель',
    note_en:'他 (tā) = he · 老师 (lǎoshī) = teacher',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_SHI},{text:'茶',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Nǐ xǐhuan chá ma?',
    uz:'Siz choy yoqtirasizmi?',      ru:'Вам нравится чай?',              en:'Do you like tea?',
    note_uz:"喜欢 (xǐhuan) = yoqtirmoq · 茶 (chá) = choy",
    note_ru:'喜欢 (xǐhuan) = нравиться · 茶 (chá) = чай',
    note_en:'喜欢 (xǐhuan) = to like · 茶 (chá) = tea',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'有',color:C_SHI},{text:'书',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Nǐ yǒu shū ma?',
    uz:'Sizda kitob bormi?',          ru:'У вас есть книга?',              en:'Do you have a book?',
    note_uz:"有 (yǒu) = bo'lmoq, ega bo'lmoq · 书 (shū) = kitob",
    note_ru:'有 (yǒu) = иметь, быть (у кого-то) · 书 (shū) = книга',
    note_en:'有 (yǒu) = to have, to exist · 书 (shū) = book',
  },
  {
    parts:[{text:'她',color:C_SUB},{text:'来',color:C_SHI},{text:'吗？',color:C_MA}],
    pinyin:'Tā lái ma?',
    uz:'U keladimi?',                 ru:'Она придёт?',                    en:'Is she coming?',
    note_uz:'来 (lái) = kelmoq',
    note_ru:'来 (lái) = приходить, прийти',
    note_en:'来 (lái) = to come',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'吃',color:C_SHI},{text:'面条',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:"Nǐ chī miàntiáo ma?",
    uz:"Siz lag'mon yeyasizmi?",      ru:'Вы едите лапшу?',                en:'Do you eat noodles?',
    note_uz:"吃 (chī) = yemoq · 面条 (miàntiáo) = lag'mon",
    note_ru:'吃 (chī) = есть (кушать) · 面条 (miàntiáo) = лапша',
    note_en:'吃 (chī) = to eat · 面条 (miàntiáo) = noodles',
  },
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'你的',color:C_PRED},{text:'吗？',color:C_MA}],
    pinyin:'Zhè shì nǐ de ma?',
    uz:'Bu siznikimi?',               ru:'Это ваше?',                      en:'Is this yours?',
    note_uz:'你的 (nǐ de) = sizniki · 的 (de) = egalik belgisi',
    note_ru:'你的 (nǐ de) = ваше/твоё · 的 (de) = показатель принадлежности',
    note_en:'你的 (nǐ de) = yours · 的 (de) = possessive particle',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],   py:'Nǐ shì xuésheng ma?',   uz:'Siz talabamisiz?',         ru:'Вы студент?',          en:'Are you a student?' },
  { parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'老师',color:C_PRED},{text:'吗？',color:C_MA}],   py:'Tā shì lǎoshī ma?',     uz:"U o'qituvchimi?",          ru:'Она учитель?',         en:'Is she a teacher?' },
  { parts:[{text:'他',color:C_SUB},{text:'来',color:C_SHI},{text:'吗？',color:C_MA}],                             py:'Tā lái ma?',            uz:'U keladimi?',              ru:'Он придёт?',           en:'Is he coming?' },
  { parts:[{text:'你',color:C_SUB},{text:'喝',color:C_SHI},{text:'茶',color:C_PRED},{text:'吗？',color:C_MA}],    py:'Nǐ hē chá ma?',         uz:'Siz choy ichasizmi?',      ru:'Вы пьёте чай?',        en:'Do you drink tea?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'有',color:C_SHI},{text:'书',color:C_PRED},{text:'吗？',color:C_MA}],    py:'Nǐ yǒu shū ma?',        uz:'Sizda kitob bormi?',       ru:'У вас есть книга?',    en:'Do you have a book?' },
  { parts:[{text:'你',color:C_SUB},{text:'有',color:C_SHI},{text:'手机',color:C_PRED},{text:'吗？',color:C_MA}],  py:'Nǐ yǒu shǒujī ma?',     uz:'Sizda telefon bormi?',     ru:'У вас есть телефон?',  en:'Do you have a phone?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你好',color:C_SUB},{text:'吗',color:C_MA},{text:'？',color:C_PUNC}],                                            py:'Nǐ hǎo ma?',                           uz:'Yaxshimisiz?',                                   ru:'Как дела?',                              en:'How are you?' },
  { s:'B', parts:[{text:'我很好，谢谢。你',color:C_SUB},{text:'呢',color:C_MA},{text:'？',color:C_PUNC}],                                py:"Wǒ hěn hǎo, xièxie. Nǐ ne?",           uz:'Men yaxshiman, rahmat. Sizchi?',                  ru:'Я хорошо, спасибо. А вы?',               en:"I'm fine, thank you. And you?" },
  { s:'A', parts:[{text:'我也很好。你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}],          py:'Wǒ yě hěn hǎo. Nǐ shì xuésheng ma?',  uz:'Men ham yaxshiman. Siz talabamisiz?',              ru:'Я тоже хорошо. Вы студент?',             en:"I'm fine too. Are you a student?" },
  { s:'B', parts:[{text:'是的，我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}],             py:'Shì de, wǒ shì xuésheng.',             uz:'Ha, men talabaman.',                              ru:'Да, я студент.',                         en:"Yes, I'm a student." },
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_SHI},{text:'汉语',color:C_PRED},{text:'吗？',color:C_MA}],                 py:'Nǐ xǐhuan Hànyǔ ma?',                  uz:'Siz xitoy tilini yoqtirasizmi?',                  ru:'Вам нравится китайский язык?',           en:'Do you like Chinese?' },
  { s:'B', parts:[{text:'喜欢！汉语很好！',color:C_PRED}],                                                                               py:'Xǐhuan! Hànyǔ hěn hǎo!',               uz:"Yoqtiraman! Xitoy tili zo'r!",                    ru:'Нравится! Китайский отличный!',          en:"I like it! Chinese is great!" },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'有',color:C_SHI},{text:'书',color:C_PRED},{text:'吗？',color:C_MA}],                    py:'Nǐ yǒu shū ma?',                       uz:'Sizda kitob bormi?',                              ru:'У вас есть книга?',                      en:'Do you have a book?' },
  { s:'B', parts:[{text:'有，我有书。',color:C_PRED}],                                                                                   py:'Yǒu, wǒ yǒu shū.',                     uz:'Bor, menda kitob bor.',                           ru:'Есть, у меня есть книга.',               en:"Yes, I have a book." },
  { s:'A', parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'你的书',color:C_PRED},{text:'吗？',color:C_MA}],                 py:'Zhè shì nǐ de shū ma?',                uz:'Bu sizning kitobingizmi?',                         ru:'Это ваша книга?',                        en:'Is this your book?' },
  { s:'B', parts:[{text:'不是，',color:C_NEG},{text:'是我朋友的书。',color:C_PRED}],                                                     py:"Bú shì, shì wǒ péngyǒu de shū.",       uz:"Yo'q, bu do'stimning kitobi.",                    ru:"Нет, это книга моего друга.",            en:"No, it's my friend's book." },
  { s:'A', parts:[{text:'你朋友',color:C_SUB},{text:'来',color:C_SHI},{text:'吗？',color:C_MA}],                                         py:'Nǐ péngyǒu lái ma?',                   uz:"Do'stingiz keladimi?",                            ru:'Ваш друг придёт?',                       en:'Is your friend coming?' },
  { s:'B', parts:[{text:'来，他今天来。',color:C_PRED}],                                                                                 py:'Lái, tā jīntiān lái.',                 uz:'Keladi, u bugun keladi.',                         ru:'Придёт, он сегодня придёт.',             en:"He's coming, he'll come today." },
];

const quizQuestions: {
  q_uz: string; q_ru: string; q_en: string;
  options?: string[]; options_uz?: string[]; options_ru?: string[]; options_en?: string[];
  correct: number;
}[] = [
  {
    q_uz:"吗 gapda qayerga qo'yiladi?",
    q_ru:'Куда ставится 吗 в предложении?',
    q_en:'Where is 吗 placed in a sentence?',
    options_uz:["Gap boshiga","Fe'ldan oldin","Gap oxiriga","Egadan keyin"],
    options_ru:["В начало предложения","Перед глаголом","В конец предложения","После подлежащего"],
    options_en:["At the beginning","Before the verb","At the end","After the subject"],
    correct:2,
  },
  {
    q_uz:"吗 qanday o'qiladi?",
    q_ru:'Как читается 吗?',
    q_en:'How is 吗 pronounced?',
    options_uz:["mā (1-ton)","má (2-ton)","mǎ (3-ton)","ma (yengil ton)"],
    options_ru:["mā (1-й тон)","má (2-й тон)","mǎ (3-й тон)","ma (нейтральный тон)"],
    options_en:["mā (1st tone)","má (2nd tone)","mǎ (3rd tone)","ma (neutral tone)"],
    correct:3,
  },
  {
    q_uz:'"Siz talabamisiz?" xitoycha qanday?',
    q_ru:'"Вы студент?" по-китайски?',
    q_en:'"Are you a student?" in Chinese?',
    options:["你吗是学生？","你是学生吗？","吗你是学生？","你是吗学生？"],
    correct:1,
  },
  {
    q_uz:'"Ha" deb qanday javob berasiz?',
    q_ru:'Как ответить "Да"?',
    q_en:'How do you say "Yes"?',
    options:["不是","没有","是的","不吗"],
    correct:2,
  },
  {
    q_uz:'"Sizda kitob bormi?" qanday?',
    q_ru:'"У вас есть книга?" по-китайски?',
    q_en:'"Do you have a book?" in Chinese?',
    options:["你有吗书？","吗你有书？","你书有吗？","你有书吗？"],
    correct:3,
  },
  {
    q_uz:'"Yo\'q" deb qanday javob berasiz (是 savoli)?',
    q_ru:'Как ответить "Нет" (на вопрос с 是)?',
    q_en:'How do you say "No" (for a 是 question)?',
    options:["不是","没有","不吗","无是"],
    correct:0,
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

export function GrammarMaPage() {
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
        <div className="grammar-page__hero-bg">吗</div>
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
          <h1 className="grammar-page__hero-char">吗</h1>
          <div className="grammar-page__hero-pinyin">ma</div>
          <div className="grammar-page__hero-meaning">
            — {t('savol yuklamasi','вопросительная частица','question particle')} —
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
                <div className="grammar-block__big-char">吗</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ma</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('Yengil ton (neytral)','Нейтральный тон','Neutral tone')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('6 ta','6','6')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t("savol yuklamasi (ha/yo'q javobi kutiladi)",'вопросительная частица (ожидается ответ да/нет)','question particle (yes/no answer expected)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 吗 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('吗 nima?','吗 — что это?','What is 吗?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_MA }}>吗</strong> — {t(
                  "gap oxiriga qo'yiladi. Oddiy gap savol gapga aylanadi.",
                  "ставится в конец предложения. Обычное предложение становится вопросом.",
                  "is placed at the end of a sentence. A regular statement becomes a question.",
                )}
              </p>
              <p className="grammar-block__tip-text" style={{ marginTop:6 }}>
                <strong>{t('Turi:','Тип:','Type:')}</strong> {t(
                  "Yuklama — mustaqil ma'nosi yo'q",
                  "Частица — самостоятельного значения не имеет",
                  "Particle — has no independent meaning",
                )}
              </p>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida savol qilish uchun «-mi» qo'shimchasi qo'shiladi. Xitoy tilida esa faqat 吗 ni gap oxiriga qo'ying — boshqa hech narsa o'zgarmaydi:",
                  "В русском вопрос образуется интонацией или порядком слов. В китайском ещё проще — просто добавьте 吗 в конец, ничего не меняя:",
                  "In English you need auxiliary verbs like \"do\", \"does\", \"are\" to form questions. In Chinese it's simpler — just add 吗 at the end, nothing else changes:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Darak gap','Повествование','Statement')}</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'。',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-py">Nǐ shì xuésheng.</div>
                  <div className="grammar-block__usage-tr">{t('Siz talabamisiz.','Вы студент.','You are a student.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>+吗→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#fefce8', border:'1px solid #fde68a', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_MA }}>{t('Savol','Вопрос','Question')}</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}]} />
                  </div>
                  <div className="grammar-block__usage-py">Nǐ shì xuésheng ma?</div>
                  <div className="grammar-block__usage-tr">{t('Siz talabamisiz?','Вы студент?','Are you a student?')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "Faqat 吗 qo'yildi — boshqa hech narsa o'zgarmadi.",
                  "Только добавили 吗 — больше ничего не изменилось.",
                  "Only 吗 was added — nothing else changed.",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim?)',        ru:'Подлежащее (кто?)',  en:'Subject (who?)' },
                  { color:C_SHI,  uz:"是 (bo'lmoq)",      ru:'是 (быть)',           en:'是 (to be/verb)' },
                  { color:C_PRED, uz:'Xabar (nima?)',     ru:'Сказуемое (что?)',   en:'Predicate (what?)' },
                  { color:C_MA,   uz:'吗 (savol)',         ru:'吗 (вопрос)',         en:'吗 (question)' },
                  { color:C_NEG,  uz:"不是 (emas)",        ru:'不是 (не является)', en:'不是 (is not)' },
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
              <div className="grammar-block__label">{t('1-shablon — Oddiy gap + 吗','Шаблон 1 — Обычное предл. + 吗','Pattern 1 — Statement + 吗')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:'#555', fontWeight:700 }}>{t('Gap','Предл.','Statement')}</span>
                {' + '}
                <span className="grammar-block__formula-ma">吗</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Har qanday oddiy gapga 吗 qo'shish kifoya",
                  "Добавьте 吗 в конец любого предложения",
                  "Add 吗 to the end of any statement",
                )}
              </p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 <strong>吗</strong> {t(
                  "faqat gap oxiriga qo'yiladi — boshqa hech narsani o'zgartirmang.",
                  "ставится только в конце — ничего больше не меняйте.",
                  "is placed only at the end — don't change anything else.",
                )}
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — 有 bilan savol','Шаблон 2 — Вопрос с 有','Pattern 2 — Question with 有')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subj.')}</span>
                {' '}
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Narsa','Предмет','Object')}</span>
                {' '}
                <span className="grammar-block__formula-ma">吗</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Biror narsa bormi-yo'qmi deb so'rash","Спросить, есть ли что-то у кого-то","Ask whether someone has something")}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Answer card */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('Qanday javob beriladi?','Как отвечать?','How to answer?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "吗 savollariga odatda qisqa javob beriladi:",
                  "На вопросы с 吗 отвечают кратко:",
                  "Answer 吗 questions briefly:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <div style={{ flex:1, background:'#dcfce7', borderRadius:8, padding:12, border:'1px solid #86efac', textAlign:'center' }}>
                  <div style={{ fontSize:'0.6em', fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                    {t('HA','ДА','YES')}
                  </div>
                  <div className="grammar-block__usage-zh" style={{ color:'#16a34a' }}>是的</div>
                  <div className="grammar-block__usage-py" style={{ color:'#16a34a' }}>shì de</div>
                  <div className="grammar-block__usage-tr">{t('Ha (shunday)','Да (именно)','Yes (correct)')}</div>
                </div>
                <div style={{ flex:1, background:'#fee2e2', borderRadius:8, padding:12, border:'1px solid #fca5a5', textAlign:'center' }}>
                  <div style={{ fontSize:'0.6em', fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                    {t("YO'Q","НЕТ","NO")}
                  </div>
                  <div className="grammar-block__usage-zh" style={{ color:'#dc2626' }}>不是</div>
                  <div className="grammar-block__usage-py" style={{ color:'#dc2626' }}>bú shì</div>
                  <div className="grammar-block__usage-tr">{t("Yo'q (emas)",'Нет (не является)','No (is not)')}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <div style={{ flex:1, background:'#dcfce7', borderRadius:8, padding:12, border:'1px solid #86efac', textAlign:'center' }}>
                  <div style={{ fontSize:'0.6em', fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                    {t("有 savoliga HA","有 вопрос — ДА","有 question — YES")}
                  </div>
                  <div className="grammar-block__usage-zh" style={{ color:'#16a34a' }}>有</div>
                  <div className="grammar-block__usage-py" style={{ color:'#16a34a' }}>yǒu</div>
                  <div className="grammar-block__usage-tr">{t('Bor','Есть','Yes, have')}</div>
                </div>
                <div style={{ flex:1, background:'#fee2e2', borderRadius:8, padding:12, border:'1px solid #fca5a5', textAlign:'center' }}>
                  <div style={{ fontSize:'0.6em', fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                    {t("有 savoliga YO'Q","有 вопрос — НЕТ","有 question — NO")}
                  </div>
                  <div className="grammar-block__usage-zh" style={{ color:'#dc2626' }}>没有</div>
                  <div className="grammar-block__usage-py" style={{ color:'#dc2626' }}>méiyǒu</div>
                  <div className="grammar-block__usage-tr">{t("Yo'q",'Нет','No, don\'t have')}</div>
                </div>
              </div>
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
                <div className="grammar-block__example-zh"><ColorParts parts={ex.parts} /></div>
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
              <div className="grammar-block__label">{t('Dialog 1 — Tanishish','Диалог 1 — Знакомство','Dialogue 1 — Introduction')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fefce8' : undefined }}
                >
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_SUB : C_MA, marginRight:6 }}>{line.s}:</span>
                    <ColorParts parts={line.parts} />
                  </div>
                  <div className="grammar-block__usage-py">{line.py}</div>
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
              <div className="grammar-block__label">{t('Dialog 2 — Kitob haqida','Диалог 2 — О книге','Dialogue 2 — About a Book')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fefce8' : undefined }}
                >
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_SUB : C_MA, marginRight:6 }}>{line.s}:</span>
                    <ColorParts parts={line.parts} />
                  </div>
                  <div className="grammar-block__usage-py">{line.py}</div>
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
              <div className="grammar-block__usage-item" style={{ borderLeft:'3px solid #16a34a', background:'#f0fdf4' }}>
                <div className="grammar-block__usage-zh">
                  <ColorParts parts={[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'学生',color:C_PRED},{text:'吗？',color:C_MA}]} />
                </div>
                <div className="grammar-block__usage-note" style={{ color:'#166534' }}>
                  ✓ {t('吗 — gap oxiriga qo\'yiladi.','吗 — ставится в конец.','吗 — placed at the end.')}
                </div>
              </div>
              <div className="grammar-block__usage-item" style={{ borderLeft:'3px solid #ef4444', background:'#fff1f2' }}>
                <div className="grammar-block__usage-zh" style={{ textDecoration:'line-through' }}>
                  <ColorParts parts={[{text:'吗',color:'#ef4444'},{text:'你是学生',color:C_PRED},{text:'？',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-note" style={{ color:'#991b1b' }}>
                  ✗ {t("吗 gap boshiga qo'yilmaydi!",'吗 нельзя ставить в начало!','吗 cannot go at the beginning!')}
                </div>
              </div>
              <div className="grammar-block__usage-item" style={{ borderLeft:'3px solid #16a34a', background:'#f0fdf4' }}>
                <div className="grammar-block__usage-note" style={{ color:'#166534', marginBottom:8 }}>
                  ✓ {t('Javob berish:','Ответы:','Answers:')}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['是的','不是','有','没有'].map((w, i) => (
                    <div key={i} style={{ background:'#fff', borderRadius:6, padding:'6px 12px', fontSize:'1em', color: i % 2 === 0 ? '#16a34a' : '#dc2626', fontWeight:700, border:'1px solid #e5e7eb' }}>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── MASHQ ── */}
        {activeTab === 'quiz' && (
          <SpeakingMashq
            questions={speakingQuestions}
            accentColor="#b45309"
            accentBg="#fef3c7"
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
