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
const C_NA     = '#0891b2'; // 哪 (which?)
const C_PRED   = '#16a34a'; // Predicate / Xabar
const C_PUNC   = '#888';    // Punctuation
const C_SHENME = '#7c3aed'; // 什么

const speakingQuestionsData = [
  { uz: 'Siz qaysi davlatdansiz?', ru: 'Вы из какой страны?', en: 'Which country are you from?', zh: '你是哪国人？', pinyin: 'Nǐ shì nǎ guó rén?' },
  { uz: 'Siz qayerga borasiz?', ru: 'Куда вы идёте?', en: 'Where are you going?', zh: '你去哪里？', pinyin: 'Nǐ qù nǎlǐ?' },
  { uz: 'Siz qayerdasiz?', ru: 'Где вы?', en: 'Where are you?', zh: '你在哪里？', pinyin: 'Nǐ zài nǎlǐ?' },
  { uz: 'Qaysi sizniki?', ru: 'Какое ваше?', en: 'Which one is yours?', zh: '哪个是你的？', pinyin: 'Nǎ ge shì nǐ de?' },
  { uz: 'Bu qaysi kitob?', ru: 'Какая это книга?', en: 'Which book is this?', zh: '这是哪本书？', pinyin: 'Zhè shì nǎ běn shū?' },
  { uz: 'Qaysi yaxshi?', ru: 'Какой лучше?', en: 'Which one is good?', zh: '哪个好？', pinyin: 'Nǎ ge hǎo?' },
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
    parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ shì nǎ guó rén?',
    uz:'Siz qaysi mamlakatdansiz?',        ru:'Из какой вы страны?',              en:'Which country are you from?',
    note_uz:'哪国人 = qaysi mamlakatdan · 国 (guó) = mamlakat · 人 (rén) = kishi',
    note_ru:'哪国人 = из какой страны · 国 (guó) = страна · 人 (rén) = человек',
    note_en:'哪国人 = from which country · 国 (guó) = country · 人 (rén) = person',
  },
  {
    parts:[{text:'哪个',color:C_NA},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],
    pinyin:'Nǎ ge shì nǐ de?',
    uz:'Qaysi biri sizniki?',              ru:'Которое ваше?',                    en:'Which one is yours?',
    note_uz:"哪个 (nǎ ge) = qaysi biri · 个 (ge) = eng keng tarqalgan o'lchov so'z",
    note_ru:'哪个 (nǎ ge) = которое из них · 个 (ge) = самый распространённый счётный суффикс',
    note_en:'哪个 (nǎ ge) = which one · 个 (ge) = most common measure word',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_PRED},{text:'哪个',color:C_NA},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ xǐhuān nǎ ge?',
    uz:"Siz qaysi birini yaxshi ko'rasiz?", ru:'Который вам нравится?',           en:'Which one do you like?',
    note_uz:"哪个 ob'yekt o'rnida: 喜欢 (xǐhuān) = yaxshi ko'rmoq",
    note_ru:'哪个 в роли дополнения: 喜欢 (xǐhuān) = нравиться, любить',
    note_en:'哪个 as object: 喜欢 (xǐhuān) = to like, to love',
  },
  {
    parts:[{text:'哪个',color:C_NA},{text:'老师',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],
    pinyin:'Nǎ ge lǎoshī shì nǐ de?',
    uz:"Qaysi o'qituvchi sizniki?",        ru:'Какой учитель ваш?',               en:'Which teacher is yours?',
    note_uz:"哪个 + ism = qaysi + ism: 哪个老师 = qaysi o'qituvchi",
    note_ru:'哪个 + существительное = какой + существительное: 哪个老师 = какой учитель',
    note_en:'哪个 + noun = which + noun: 哪个老师 = which teacher',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'买',color:C_PRED},{text:'哪个',color:C_NA},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ mǎi nǎ ge?',
    uz:'Siz qaysi birini olasiz?',         ru:'Которое вы купите?',               en:'Which one will you buy?',
    note_uz:"买 (mǎi) = sotib olmoq · 哪个 ob'yekt o'rnida",
    note_ru:'买 (mǎi) = покупать · 哪个 в роли дополнения',
    note_en:'买 (mǎi) = to buy · 哪个 as object',
  },
  {
    parts:[{text:'哪本',color:C_NA},{text:'书',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],
    pinyin:'Nǎ běn shū shì nǐ de?',
    uz:'Qaysi kitob sizniki?',             ru:'Какая книга ваша?',                en:'Which book is yours?',
    note_uz:"哪本 = qaysi (kitob uchun) · 本 (běn) = kitob uchun o'lchov so'z",
    note_ru:'哪本 = какая (для книг) · 本 (běn) = счётный суффикс для книг',
    note_en:'哪本 = which (for books) · 本 (běn) = measure word for books',
  },
  {
    parts:[{text:'这',color:C_SUB},{text:'是',color:C_SHI},{text:'哪个',color:C_NA},{text:'国家',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Zhè shì nǎ ge guójiā?',
    uz:'Bu qaysi davlat?',                 ru:'Какая это страна?',                en:'Which country is this?',
    note_uz:'国家 (guójiā) = davlat · 哪个 + 国家 = qaysi davlat',
    note_ru:'国家 (guójiā) = страна · 哪个 + 国家 = какая страна',
    note_en:'国家 (guójiā) = country · 哪个 + 国家 = which country',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_PRED},{text:'哪个',color:C_NA},{text:'颜色',color:C_PRED},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ xǐhuān nǎ ge yánsè?',
    uz:"Siz qaysi rangni yaxshi ko'rasiz?", ru:'Какой цвет вам нравится?',        en:'Which color do you like?',
    note_uz:'颜色 (yánsè) = rang · 哪个 + 颜色 = qaysi rang',
    note_ru:'颜色 (yánsè) = цвет · 哪个 + 颜色 = какой цвет',
    note_en:'颜色 (yánsè) = color · 哪个 + 颜色 = which color',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}], py:'Nǐ shì nǎ guó rén?', uz:'Siz qaysi mamlakatdansiz?',    ru:'Из какой вы страны?',   en:'Which country are you from?' },
  { parts:[{text:'他',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}], py:'Tā shì nǎ guó rén?',  uz:'U qaysi mamlakatdan?',         ru:'Из какой он страны?',   en:'Which country is he from?' },
  { parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}], py:'Tā shì nǎ guó rén?',  uz:'U (ayol) qaysi mamlakatdan?',  ru:'Из какой она страны?',  en:'Which country is she from?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'哪个',color:C_NA},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],                           py:'Nǎ ge shì nǐ de?',        uz:'Qaysi biri sizniki?',           ru:'Которое ваше?',          en:'Which one is yours?' },
  { parts:[{text:'哪个',color:C_NA},{text:'老师',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],  py:'Nǎ ge lǎoshī shì nǐ de?',  uz:"Qaysi o'qituvchi sizniki?",   ru:'Какой учитель ваш?',     en:'Which teacher is yours?' },
  { parts:[{text:'哪本',color:C_NA},{text:'书',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],   py:'Nǎ běn shū shì nǐ de?',    uz:'Qaysi kitob sizniki?',          ru:'Какая книга ваша?',      en:'Which book is yours?' },
  { parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_PRED},{text:'哪个',color:C_NA},{text:'？',color:C_PUNC}],                          py:'Nǐ xǐhuān nǎ ge?',         uz:"Qaysi birini yaxshi ko'rasiz?", ru:'Который вам нравится?',  en:'Which one do you like?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你好！你',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}],                            py:'Nǐ hǎo! Nǐ shì nǎ guó rén?',        uz:'Salom! Siz qaysi mamlakatdansiz?',       ru:'Привет! Из какой вы страны?',         en:'Hello! Which country are you from?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'中国人。你呢',color:C_PRED},{text:'？',color:C_PUNC}],                                               py:'Wǒ shì Zhōngguórén. Nǐ ne?',         uz:"Men xitoylikman. Siz-chi?",              ru:'Я китаец. А вы?',                     en:"I'm Chinese. What about you?" },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'乌兹别克人。',color:C_PRED}],                                                                        py:'Wǒ shì Wūzībiékèrén.',               uz:"Men o'zbekman.",                         ru:'Я узбек.',                            en:"I'm Uzbek." },
  { s:'B', parts:[{text:'你喜欢',color:C_SUB},{text:'哪个',color:C_NA},{text:'城市',color:C_PRED},{text:'？',color:C_PUNC}],                                                  py:'Nǐ xǐhuān nǎ ge chéngshì?',          uz:"Siz qaysi shaharni yaxshi ko'rasiz?",    ru:'Какой город вам нравится?',           en:'Which city do you like?' },
  { s:'A', parts:[{text:'我喜欢',color:C_SUB},{text:'北京。',color:C_PRED}],                                                                                                  py:'Wǒ xǐhuān Běijīng.',                 uz:"Men Pekinni yaxshi ko'raman.",           ru:'Мне нравится Пекин.',                 en:'I like Beijing.' },
  { s:'B', parts:[{text:'北京很好！',color:C_PRED}],                                                                                                                          py:'Běijīng hěn hǎo!',                   uz:"Pekin juda yaxshi!",                     ru:'Пекин очень хороший!',                en:'Beijing is great!' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你喜欢',color:C_SUB},{text:'哪个',color:C_NA},{text:'？',color:C_PUNC}],                                                                             py:'Nǐ xǐhuān nǎ ge?',                   uz:"Siz qaysi birini yaxshi ko'rasiz?",      ru:'Который вам нравится?',               en:'Which one do you like?' },
  { s:'B', parts:[{text:'我喜欢',color:C_SUB},{text:'这个。那个',color:C_PRED},{text:'是',color:C_SHI},{text:'什么',color:C_SHENME},{text:'？',color:C_PUNC}],               py:'Wǒ xǐhuān zhè ge. Nà ge shì shénme?', uz:"Men buni yaxshi ko'raman. Ana u nima?",    ru:'Мне нравится этот. А что то?',        en:"I like this one. What is that?" },
  { s:'A', parts:[{text:'那个',color:C_SUB},{text:'是',color:C_SHI},{text:'书。',color:C_PRED}],                                                                              py:'Nà ge shì shū.',                     uz:"U kitob.",                               ru:'То — книга.',                         en:"That's a book." },
  { s:'B', parts:[{text:'哪本',color:C_NA},{text:'书',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],                             py:'Nǎ běn shū shì nǐ de?',              uz:'Qaysi kitob sizniki?',                   ru:'Какая книга ваша?',                   en:'Which book is yours?' },
  { s:'A', parts:[{text:'这本',color:C_SUB},{text:'是',color:C_SHI},{text:'我的。你买',color:C_PRED},{text:'哪个',color:C_NA},{text:'？',color:C_PUNC}],                     py:'Zhè běn shì wǒ de. Nǐ mǎi nǎ ge?',  uz:"Bu biri meniki. Siz qaysi birini olasiz?", ru:'Эта — моя. Которое вы купите?',    en:"This one is mine. Which one will you buy?" },
  { s:'B', parts:[{text:'我买',color:C_SUB},{text:'这个。',color:C_PRED}],                                                                                                    py:'Wǒ mǎi zhè ge.',                     uz:"Men buni olaman.",                       ru:'Я куплю это.',                        en:"I'll buy this one." },
];

const quizQuestions: {
  q_uz: string; q_ru: string; q_en: string;
  options?: string[]; options_uz?: string[]; options_ru?: string[]; options_en?: string[];
  correct: number;
}[] = [
  {
    q_uz:"哪 qanday o'qiladi?",
    q_ru:'Как читается 哪?',
    q_en:'How is 哪 pronounced?',
    options:['nà','nǎ','ná','nā'],
    correct:1,
  },
  {
    q_uz:'"Qaysi biri sizniki?" xitoycha qanday?',
    q_ru:'Как сказать «Которое ваше?» по-китайски?',
    q_en:'How do you say "Which one is yours?" in Chinese?',
    options:['那个是你的？','哪个是你的？','什么是你的？','谁的是？'],
    correct:1,
  },
  {
    q_uz:"哪 va 那 — qaysi to'g'ri?",
    q_ru:'哪 и 那 — что верно?',
    q_en:'哪 and 那 — which is correct?',
    options_uz:["Ikkalasi bir xil","哪 = qaysi?, 那 = u/o'sha","哪 = bu, 那 = qaysi?","Hech qanday farq yo'q"],
    options_ru:['Они одинаковы','哪 = который?, 那 = тот/та','哪 = этот, 那 = который?','Нет разницы'],
    options_en:['They are the same','哪 = which?, 那 = that','哪 = this, 那 = which?','No difference'],
    correct:1,
  },
  {
    q_uz:'"Siz qaysi mamlakatdansiz?" xitoycha qanday?',
    q_ru:'Как сказать «Из какой вы страны?» по-китайски?',
    q_en:'How do you say "Which country are you from?" in Chinese?',
    options:['你是那国人？','你在哪国？','你是哪国人？','哪国你是？'],
    correct:2,
  },
  {
    q_uz:'哪个 nima degani?',
    q_ru:'Что означает 哪个?',
    q_en:'What does 哪个 mean?',
    options_uz:['Bu','Qaysi biri','Kimniki','Narsa'],
    options_ru:['Это','Который/Которое','Чей','Вещь'],
    options_en:['This','Which one','Whose','Thing'],
    correct:1,
  },
  {
    q_uz:'"哪本书是你的?" gapda 本 nima uchun ishlatiladi?',
    q_ru:'Для чего используется 本 в предложении "哪本书是你的?"?',
    q_en:'What is the role of 本 in "哪本书是你的?"?',
    options_uz:["Kitob so'zidan oldin","O'lchov so'z sifatida (kitob uchun)","Fe'l sifatida","Ot sifatida"],
    options_ru:['Перед словом книга','Как счётный суффикс (для книг)','Как глагол','Как существительное'],
    options_en:['Before the word book','As a measure word (for books)','As a verb','As a noun'],
    correct:1,
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

export function GrammarNaPage() {
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
        <div className="grammar-page__hero-bg">哪</div>
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
          <h1 className="grammar-page__hero-char">哪</h1>
          <div className="grammar-page__hero-pinyin">nǎ</div>
          <div className="grammar-page__hero-meaning">
            — {t('qaysi?','который?','which?')} —
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
                <div className="grammar-block__big-char">哪</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">nǎ</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t("3-ton (tushuvchi-ko'tariluvchi) ↘↗",'3-й тон (нисходяще-восходящий) ↘↗','3rd tone (falling-rising) ↘↗')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('9 ta','9','9')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('qaysi?','который?','which?')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 哪 vs 那 comparison */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("哪 va 那 — Farq qiling!","哪 и 那 — Не путайте!","哪 vs 那 — Don't Confuse Them!")}</div>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <div style={{ flex:1, textAlign:'center', background:'#f0f9ff', border:'2px solid #0891b2', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:C_NA, fontWeight:700 }}>哪</div>
                  <div style={{ color:C_NA, fontWeight:600 }}>nǎ</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('3-ton ↘↗','3-й тон ↘↗','3rd tone ↘↗')}</div>
                  <div style={{ marginTop:6, color:C_NA, fontWeight:600, fontSize:14 }}>{t('qaysi?','который?','which?')}</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#fef9f0', border:'2px solid #d97706', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:'#d97706', fontWeight:700 }}>那</div>
                  <div style={{ color:'#d97706', fontWeight:600 }}>nà</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('4-ton ↘','4-й тон ↘','4th tone ↘')}</div>
                  <div style={{ marginTop:6, color:'#d97706', fontWeight:600, fontSize:14 }}>{t("u/o'sha",'тот/та/то','that')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "哪 (nǎ, 3-ton) = savol so'zi. 那 (nà, 4-ton) = ko'rsatish olmoshi. Faqat ton va ma'no farq qiladi — yozuvi o'xshash!",
                  "哪 (nǎ, 3-й тон) = вопросительное слово. 那 (nà, 4-й тон) = указательное местоимение. Разница только в тоне и значении — иероглифы похожи!",
                  "哪 (nǎ, 3rd tone) = question word. 那 (nà, 4th tone) = demonstrative pronoun. Only the tone and meaning differ — the characters look similar!",
                )}
              </p>
            </div>

            {/* 哪 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('哪 nima?','哪 — что это?','What is 哪?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_NA }}>哪</strong> = <strong>{t('qaysi?','который?','which?')}</strong>
                <br />
                {t(
                  "Bir nechta narsadan birini tanlashda yoki kelib chiqishni so'rashda ishlatiladi.",
                  'Используется для выбора из нескольких вариантов или уточнения происхождения.',
                  'Used to select from multiple options or ask about origin.',
                )}
              </p>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Qaysi biri sizniki?» desak, gap tuzilishi o'zgarmaydi. Xitoy tilida ham 哪 faqat so'raladigan narsa o'rniga qo'yiladi — boshqa hech narsa o'zgarmaydi:",
                  "В русском «Которое ваше?» тоже не меняет порядок слов. В китайском 哪 просто заменяет нужное слово на том же месте — ничего не меняется:",
                  "In English \"Which one is yours?\" changes word order. In Chinese, 哪 simply replaces the known word in the same spot — no inversion needed:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Darak gap','Повествование','Statement')}</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'那个',color:C_SUB},{text:'是',color:C_SHI},{text:'我的。',color:C_PRED}]} />
                  </div>
                  <div className="grammar-block__usage-py">Nà ge shì wǒ de.</div>
                  <div className="grammar-block__usage-tr">{t("U/o'sha meniki.",'То — моё.','That one is mine.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>+哪→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_NA }}>{t('Savol','Вопрос','Question')}</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'哪个',color:C_NA},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-py">Nǎ ge shì nǐ de?</div>
                  <div className="grammar-block__usage-tr">{t('Qaysi biri sizniki?','Которое ваше?','Which one is yours?')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "«那个» (u/o'sha) o'rniga 哪个 qo'yildi — boshqa hech narsa o'zgarmadi.",
                  "«那个» (тот/то) заменили на 哪个 — больше ничего не изменилось.",
                  "\"那个\" (that one) was replaced with 哪个 — nothing else changed.",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,    uz:'Ega (kim/nima?)',     ru:'Подлежащее (кто/что?)', en:'Subject (who/what?)' },
                  { color:C_SHI,    uz:"是 (bo'lmoq)",        ru:'是 (быть)',              en:'是 (to be)' },
                  { color:C_NA,     uz:'哪 (qaysi?)',          ru:'哪 (который?)',          en:'哪 (which?)' },
                  { color:C_PRED,   uz:'Xabar / Fe\'l',        ru:'Сказуемое / Глагол',    en:'Predicate / Verb' },
                  { color:C_SHENME, uz:'什么 (nima?)',          ru:'什么 (что?)',            en:'什么 (what?)' },
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
              <div className="grammar-block__label">{t('1-shablon — Qaysi mamlakatdan?','Шаблон 1 — Из какой страны?','Pattern 1 — Which Country?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>你 / 他 / 她</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span style={{ color:C_NA, fontWeight:700 }}>哪</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>国人？</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t('Millat yoki kelib chiqishni so\'rash','Спросить о национальности или происхождении','Ask about nationality or origin')}
              </p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "他 (erkak) va 她 (ayol) ikkalasi ham tā deb o'qiladi — faqat yozuvda farq bor.",
                  "他 (муж.) и 她 (жен.) оба читаются как tā — разница только на письме.",
                  "他 (male) and 她 (female) are both pronounced tā — the difference is only in writing.",
                )}
              </p>
            </div>

            {/* Pattern 2 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Qaysi (biri)?','Шаблон 2 — Который/Какой?','Pattern 2 — Which One?')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_NA, fontWeight:700 }}>哪个</span>
                {' / '}
                <span style={{ color:C_NA, fontWeight:700 }}>哪本</span>
                {' '}
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('(+ ism)','(+ сущ.)','(+ noun)')}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "哪个 = qaysi biri (umumiy) · 哪本 = qaysi (kitob uchun) · 哪 + o'lchov so'z + ism",
                  '哪个 = который/которое (общий) · 哪本 = какая (для книг) · 哪 + счётный суффикс + сущ.',
                  '哪个 = which one (general) · 哪本 = which (for books) · 哪 + measure word + noun',
                )}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "哪个 eng ko'p ishlatiladigan shakl. 哪本 — kitoblar uchun. Boshqa narsalar uchun boshqa o'lchov so'zlar ishlatiladi.",
                  "哪个 — самая распространённая форма. 哪本 — для книг. Для других предметов используются другие счётные суффиксы.",
                  "哪个 is the most common form. 哪本 is for books. Other objects use different measure words.",
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
                  <button type="button" onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</button>
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
              <div className="grammar-block__label">{t('Dialog 1 — Millat haqida','Диалог 1 — О национальности','Dialogue 1 — About Nationality')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#f0f9ff' : undefined }}
                >
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_NA : C_SHI, marginRight:6 }}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Narsa tanlash','Диалог 2 — Выбор предмета','Dialogue 2 — Choosing an Item')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#f0f9ff' : undefined }}
                >
                  <div className="grammar-block__usage-zh">
                    <span style={{ fontWeight:700, color: line.s === 'A' ? C_NA : C_SHI, marginRight:6 }}>{line.s}:</span>
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
              {([
                {
                  parts:[{text:'你',color:C_SUB},{text:'是',color:C_SHI},{text:'哪',color:C_NA},{text:'国人',color:C_PRED},{text:'？',color:C_PUNC}],
                  note: t("哪 + 国人: 你是哪国人？→ Siz qaysi mamlakatdansiz?","哪 + 国人: 你是哪国人？→ Из какой вы страны?","哪 + 国人: 你是哪国人？→ Which country are you from?"),
                  ok: true,
                },
                {
                  parts:[{text:'哪个',color:C_NA},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],
                  note: t("哪个 ega o'rnida: Qaysi biri sizniki?","哪个 как подлежащее: Которое ваше?","哪个 as subject: Which one is yours?"),
                  ok: true,
                },
                {
                  parts:[{text:'哪本',color:C_NA},{text:'书',color:C_PRED},{text:'是',color:C_SHI},{text:'你的',color:C_SUB},{text:'？',color:C_PUNC}],
                  note: t("哪本 = qaysi (kitob uchun): Qaysi kitob sizniki?","哪本 = какая (для книг): Какая книга ваша?","哪本 = which (for books): Which book is yours?"),
                  ok: true,
                },
              ] as { parts: Part[]; note: string; ok: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #0891b2', background:'#f0f9ff' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#0c4a6e' }}>
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
            accentColor="#0891b2"
            accentBg="#f0f9ff"
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
