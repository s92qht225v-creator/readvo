'use client';

let _ga: HTMLAudioElement | null = null;
function playGrammarAudio(zh: string) {
  if (!_ga) _ga = new Audio();
  _ga.src = `/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`;
  _ga.currentTime = 0;
  _ga.play().catch(() => {});
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

const C_NUM  = '#f59e0b'; // Numbers (amber — featured)
const C_SUB  = '#16a34a'; // Subject / context (green)
const C_VERB = '#1d4ed8'; // Verb (blue)
const C_JI   = '#059669'; // 几 (emerald)
const C_OBJ  = '#dc2626'; // Object / Noun (red)
const C_NE   = '#7c3aed'; // 呢 / 两 (violet)
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Sizning telefon raqamingiz necha?', ru: 'Какой у вас номер телефона?', en: 'What is your phone number?', zh: '你的电话号码是多少？', pinyin: 'Nǐ de diànhuà hàomǎ shì duōshǎo?' },
  { uz: 'Hozir soat necha?', ru: 'Который сейчас час?', en: 'What time is it now?', zh: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?' },
  { uz: 'Siz necha yoshdasiz?', ru: 'Сколько вам лет?', en: 'How old are you?', zh: '你多大？', pinyin: 'Nǐ duō dà?' },
  { uz: 'Bu necha pul?', ru: 'Сколько это стоит?', en: 'How much is this?', zh: '这个多少钱？', pinyin: 'Zhège duōshǎo qián?' },
  { uz: 'Sinfingizda nechta talaba bor?', ru: 'Сколько студентов в вашем классе?', en: 'How many students are in your class?', zh: '你们班有多少个学生？', pinyin: 'Nǐmen bān yǒu duōshǎo gè xuéshēng?' },
  { uz: 'Bugun necha-sanasi?', ru: 'Какое сегодня число?', en: "What's today's date?", zh: '今天几号？', pinyin: 'Jīntiān jǐ hào?' },
];

const sections = [
  { id: 'intro',    uz: 'Asosiy',   ru: 'Основное', en: 'Overview'  },
  { id: 'usage',    uz: 'Raqamlar', ru: 'Числа',    en: 'Numbers'   },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const ones = [
  { n:'一', py:'yī',  uz:'bir',     ru:'один',  en:'one' },
  { n:'二', py:'èr',  uz:'ikki',    ru:'два',   en:'two' },
  { n:'三', py:'sān', uz:'uch',     ru:'три',   en:'three' },
  { n:'四', py:'sì',  uz:"to'rt",   ru:'четыре',en:'four' },
  { n:'五', py:'wǔ',  uz:'besh',    ru:'пять',  en:'five' },
  { n:'六', py:'liù', uz:'olti',    ru:'шесть', en:'six' },
  { n:'七', py:'qī',  uz:'yetti',   ru:'семь',  en:'seven' },
  { n:'八', py:'bā',  uz:'sakkiz',  ru:'восемь',en:'eight' },
  { n:'九', py:'jiǔ', uz:"to'qqiz", ru:'девять',en:'nine' },
  { n:'十', py:'shí', uz:"o'n",     ru:'десять',en:'ten' },
];

const examples: { parts: Part[]; pinyin: string; uz: string; ru: string; en: string; note_uz: string; note_ru: string; note_en: string }[] = [
  {
    parts:[{text:'我家有',color:C_SUB},{text:'三',color:C_NUM},{text:'个人。',color:C_OBJ}],
    pinyin:'Wǒ jiā yǒu sān gè rén.',
    uz:'Oilamda uch kishi bor.',               ru:'В моей семье три человека.',              en:'My family has three people.',
    note_uz:'三 (sān) = uch · 个 (gè) = son-o\'lchov so\'zi',
    note_ru:'三 (sān) = три · 个 (gè) = счётное слово',
    note_en:'三 (sān) = three · 个 (gè) = measure word',
  },
  {
    parts:[{text:'我有',color:C_SUB},{text:'两',color:C_NE},{text:'个朋友。',color:C_OBJ}],
    pinyin:'Wǒ yǒu liǎng gè péngyǒu.',
    uz:'Menda ikki do\'st bor.',                ru:'У меня два друга.',                       en:'I have two friends.',
    note_uz:'两 (liǎng) = ikki — son-o\'lchov so\'zi bilan: 两个, 两本…',
    note_ru:'两 (liǎng) = два — со счётным словом: 两个, 两本…',
    note_en:'两 (liǎng) = two — with measure words: 两个, 两本…',
  },
  {
    parts:[{text:'现在',color:C_SUB},{text:'八',color:C_NUM},{text:'点。',color:C_OBJ}],
    pinyin:'Xiànzài bā diǎn.',
    uz:'Hozir soat sakkiz.',                   ru:'Сейчас восемь часов.',                   en:"It's eight o'clock.",
    note_uz:'八 (bā) = sakkiz · 点 (diǎn) = soat',
    note_ru:'八 (bā) = восемь · 点 (diǎn) = час',
    note_en:'八 (bā) = eight · 点 (diǎn) = o\'clock',
  },
  {
    parts:[{text:'我今年',color:C_SUB},{text:'二十',color:C_NUM},{text:'岁。',color:C_OBJ}],
    pinyin:'Wǒ jīnnián èrshí suì.',
    uz:'Men bu yil yigirma yoshdaman.',         ru:'Мне в этом году двадцать лет.',           en:"I'm twenty years old this year.",
    note_uz:'今年 (jīnnián) = bu yil · 二十 (èrshí) = yigirma · 岁 (suì) = yosh',
    note_ru:'今年 (jīnnián) = в этом году · 二十 (èrshí) = двадцать · 岁 (suì) = лет',
    note_en:'今年 (jīnnián) = this year · 二十 (èrshí) = twenty · 岁 (suì) = years old',
  },
  {
    parts:[{text:'这个',color:C_SUB},{text:'是',color:C_VERB},{text:'五',color:C_NUM},{text:'块钱。',color:C_OBJ}],
    pinyin:'Zhège shì wǔ kuài qián.',
    uz:'Bu besh yuan.',                         ru:'Это пять юаней.',                         en:'This is five yuan.',
    note_uz:'块 (kuài) = yuan (pul birligi) · 钱 (qián) = pul',
    note_ru:'块 (kuài) = юань (денежная единица) · 钱 (qián) = деньги',
    note_en:'块 (kuài) = yuan (currency unit) · 钱 (qián) = money',
  },
  {
    parts:[{text:'今天',color:C_SUB},{text:'十五',color:C_NUM},{text:'号。',color:C_OBJ}],
    pinyin:'Jīntiān shíwǔ hào.',
    uz:'Bugun o\'n beshinchi (sana).',           ru:'Сегодня пятнадцатое число.',              en:"Today is the 15th.",
    note_uz:'号 (hào) = sana/raqam · 十五 = 10+5',
    note_ru:'号 (hào) = число/дата · 十五 = 10+5',
    note_en:'号 (hào) = date/number · 十五 = 10+5',
  },
  {
    parts:[{text:'我买了',color:C_SUB},{text:'三十',color:C_NUM},{text:'个苹果。',color:C_OBJ}],
    pinyin:'Wǒ mǎi le sānshí gè píngguǒ.',
    uz:'Men o\'ttiz ta olma sotib oldim.',       ru:'Я купил тридцать яблок.',                 en:'I bought thirty apples.',
    note_uz:'三十 (sānshí) = o\'ttiz · 苹果 (píngguǒ) = olma',
    note_ru:'三十 (sānshí) = тридцать · 苹果 (píngguǒ) = яблоко',
    note_en:'三十 (sānshí) = thirty · 苹果 (píngguǒ) = apple',
  },
  {
    parts:[{text:'我们班有',color:C_SUB},{text:'四十五',color:C_NUM},{text:'个学生。',color:C_OBJ}],
    pinyin:'Wǒmen bān yǒu sìshíwǔ gè xuéshēng.',
    uz:'Sinfimizda qirq besh talaba bor.',       ru:'В нашем классе сорок пять студентов.',    en:'Our class has forty-five students.',
    note_uz:'班 (bān) = sinf · 四十五 = 40+5',
    note_ru:'班 (bān) = класс · 四十五 = 40+5',
    note_en:'班 (bān) = class · 四十五 = 40+5',
  },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你家有',color:C_SUB},{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ jiā yǒu jǐ gè rén?', uz:'Oilangda necha kishi bor?', ru:'Сколько человек в вашей семье?', en:'How many people in your family?' },
  { s:'B', parts:[{text:'我家有',color:C_SUB},{text:'四',color:C_NUM},{text:'个人。',color:C_OBJ}], py:'Wǒ jiā yǒu sì gè rén.', uz:"Oilamda to'rt kishi bor.", ru:'В моей семье четыре человека.', en:'My family has four people.' },
  { s:'A', parts:[{text:'你有',color:C_SUB},{text:'几本',color:C_JI},{text:'汉语书',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ yǒu jǐ běn Hànyǔ shū?', uz:'Sizda nechta xitoy tili kitobi bor?', ru:'Сколько у вас учебников китайского?', en:'How many Chinese books do you have?' },
  { s:'B', parts:[{text:'我有',color:C_SUB},{text:'两',color:C_NE},{text:'本。你',color:C_OBJ},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ yǒu liǎng běn. Nǐ ne?', uz:'Menda ikkita bor. Sizchi?', ru:'У меня две. А у вас?', en:'I have two. And you?' },
  { s:'A', parts:[{text:'我有',color:C_SUB},{text:'三',color:C_NUM},{text:'本。',color:C_OBJ}], py:'Wǒ yǒu sān běn.', uz:'Menda uchta bor.', ru:'У меня три.', en:'I have three.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'现在',color:C_SUB},{text:'几点',color:C_JI},{text:'？',color:C_PUNC}], py:'Xiànzài jǐ diǎn?', uz:'Hozir soat necha?', ru:'Который сейчас час?', en:'What time is it now?' },
  { s:'B', parts:[{text:'现在',color:C_SUB},{text:'十一',color:C_NUM},{text:'点。',color:C_OBJ}], py:'Xiànzài shíyī diǎn.', uz:"Hozir o'n bir.", ru:'Сейчас одиннадцать часов.', en:"It's eleven o'clock." },
  { s:'A', parts:[{text:'这个多少钱',color:C_SUB},{text:'？',color:C_PUNC}], py:'Zhège duōshǎo qián?', uz:'Bu qancha?', ru:'Сколько это стоит?', en:'How much is this?' },
  { s:'B', parts:[{text:'三十五',color:C_NUM},{text:'块。',color:C_OBJ}], py:'Sānshíwǔ kuài.', uz:"O'ttiz besh yuan.", ru:'Тридцать пять юаней.', en:'Thirty-five yuan.' },
  { s:'A', parts:[{text:'很贵！',color:C_SUB}], py:'Hěn guì!', uz:'Qimmat!', ru:'Дорого!', en:'Expensive!' },
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

/* ── Number builder helpers ── */
const uzTens = ['','o\'n','yigirma','o\'ttiz','qirq','ellik','oltmish','yetmish','sakson','to\'qson'];
const uzOnes = ['','bir','ikki','uch','to\'rt','besh','olti','yetti','sakkiz','to\'qqiz'];
const ruTens = ['','десять','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
const ruOnes = ['','один','два','три','четыре','пять','шесть','семь','восемь','девять'];
const enTens = ['','ten','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const enOnes = ['','one','two','three','four','five','six','seven','eight','nine'];
const enTeens: Record<number,string> = {11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen'};
const ruTeens: Record<number,string> = {11:'одиннадцать',12:'двенадцать',13:'тринадцать',14:'четырнадцать',15:'пятнадцать',16:'шестнадцать',17:'семнадцать',18:'восемнадцать',19:'девятнадцать'};

function buildNumber(tens: number, onesD: number | null) {
  const o = onesD || 0;
  const num = tens * 10 + o;
  const zh = tens === 1
    ? (o ? `十${ones[o - 1].n}` : '十')
    : o ? `${ones[tens - 1].n}十${ones[o - 1].n}` : `${ones[tens - 1].n}十`;
  const py = tens === 1
    ? (o ? `shí${ones[o - 1].py}` : 'shí')
    : o ? `${ones[tens - 1].py}shí${ones[o - 1].py}` : `${ones[tens - 1].py}shí`;
  const uz = tens === 1
    ? (o ? `o'n ${uzOnes[o]}` : 'o\'n')
    : o ? `${uzTens[tens]} ${uzOnes[o]}` : uzTens[tens];
  const ru = (num >= 11 && num <= 19) ? ruTeens[num]
    : o ? `${ruTens[tens]} ${ruOnes[o]}` : ruTens[tens];
  const en = (num >= 11 && num <= 19) ? enTeens[num]
    : o ? `${enTens[tens]}-${enOnes[o]}` : enTens[tens];
  return { zh, py, num, uz, ru, en };
}

export function GrammarShuziPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('shuzi');
    if (existing === undefined || newStars > existing) saveStars('shuzi', newStars);
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
  // Number builder
  const [builtTens, setBuiltTens] = useState<number | null>(null);
  const [builtOnes, setBuiltOnes] = useState<number | null>(null);

  if (isLoading) return <div className="loading-spinner" />;

  const toggleRev = (setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>, i: number) =>
    setter(p => ({ ...p, [i]: !p[i] }));

  const t = (uz: string, ru: string, en: string) =>
    ({ uz, ru, en } as Record<string, string>)[language] ?? uz;

  const built = builtTens !== null && builtOnes !== null ? buildNumber(builtTens, builtOnes) : null;

  return (
    <div className="grammar-page">
      {/* Hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark" style={{ fontSize:120, letterSpacing:8 }}>一二三</div>
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
          <h1 className="dr-hero__title" style={{ fontSize:42, letterSpacing:6, fontWeight:300 }}>一 — 九十九</h1>
          <div className="dr-hero__pinyin">yī — jiǔshíjiǔ</div>
          <div className="dr-hero__translation">
            — {t('1 dan 99 gacha','от 1 до 99','from 1 to 99')} —
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
            {/* 1–10 grid */}
            <div className="grammar-block">
              <div className="grammar-block__label">1 — 10</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
                {ones.map((o, i) => (
                  <div key={i} style={{ textAlign:'center', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 4px', cursor:'pointer', userSelect:'none' }}
                    onClick={() => playGrammarAudio(o.n)}>
                    <div style={{ fontSize:28, fontWeight:700, color:C_NUM }}>{o.n}</div>
                    <div style={{ fontSize:11, color:'#92400e', marginTop:2 }}>{o.py}</div>
                    <div style={{ fontSize:10, color:'#888', marginTop:1 }}>{t(o.uz, o.ru, o.en)}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10, textAlign:'center' }}>
                {t("Bosing — eshiting","Нажмите — слушайте","Tap — listen")}
              </p>
            </div>

            {/* 二 vs 两 */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("Muhim: ikki = 二 yoki 两？","Важно: два = 二 или 两？","Important: two = 二 or 两？")}</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, textAlign:'center', background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:34, color:C_NUM, fontWeight:700 }}>二</div>
                  <div style={{ color:C_NUM, fontWeight:600, fontSize:12 }}>èr</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6, marginTop:6 }}>
                    {t("Sanashda","При счёте","For counting")}
                    <br />十二, 二十二
                  </div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#f5f3ff', border:'2px solid #7c3aed', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:34, color:'#7c3aed', fontWeight:700 }}>两</div>
                  <div style={{ color:'#7c3aed', fontWeight:600, fontSize:12 }}>liǎng</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6, marginTop:6 }}>
                    {t("Son-o'lchov so'zi bilan","Со счётным словом","With measure words")}
                    <br />两个, 两本
                  </div>
                </div>
              </div>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:10, fontSize:12, lineHeight:1.9 }}>
                <div style={{ marginBottom:4 }}>✓ &nbsp;<strong style={{color:'#7c3aed'}}>两</strong>个人 — {t('ikki kishi','два человека','two people')}</div>
                <div style={{ marginBottom:4 }}>✗ &nbsp;<span style={{textDecoration:'line-through'}}>二个人</span> — {t('bu xato!','это неправильно!','this is wrong!')}</div>
                <div>✓ &nbsp;<strong style={{color:C_NUM}}>二</strong>十<strong style={{color:C_NUM}}>二</strong> — {t('yigirma ikki (sanoq)','двадцать два (счёт)','twenty-two (counting)')}</div>
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega',                 ru:'Подлежащее',   en:'Subject' },
                  { color:C_NUM,  uz:"Son (bir…to'qqiz)",   ru:'Число (1-9)',   en:'Number (1-9)' },
                  { color:C_JI,   uz:'几 (nechta?)',         ru:'几 (сколько?)', en:'几 (how many?)' },
                  { color:C_OBJ,  uz:'Ot / Xabar',           ru:'Сущ. / Предикат',en:'Noun / Predicate' },
                  { color:C_NE,   uz:'呢 (…chi?) / 两',      ru:'呢 (…а вы?) / 两',en:'呢 (…and you?) / 两' },
                  { color:C_VERB, uz:"Fe'l",                 ru:'Глагол',       en:'Verb' },
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

        {/* ── RAQAMLAR ── */}
        {activeTab === 'usage' && (
          <>
            {/* 11–19 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("11 — 19: 十 + birlik","11 — 19: 十 + единица","11 — 19: 十 + digit")}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
                {' + '}
                <span style={{ color:'#555' }}>{t('birlik raqam','единица','digit')}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "O'n + birlik = o'n bir … o'n to'qqiz",
                  'Десять + единица = одиннадцать … девятнадцать',
                  'Ten + digit = eleven … nineteen',
                )}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
                {([
                  { zh:'十一', py:'shíyī',  uz:"o'n bir",     ru:'11', en:'11', n:11 },
                  { zh:'十二', py:'shíèr',  uz:"o'n ikki",    ru:'12', en:'12', n:12 },
                  { zh:'十三', py:'shísān', uz:"o'n uch",     ru:'13', en:'13', n:13 },
                  { zh:'十五', py:'shíwǔ',  uz:"o'n besh",    ru:'15', en:'15', n:15 },
                  { zh:'十八', py:'shíbā',  uz:"o'n sakkiz",  ru:'18', en:'18', n:18 },
                  { zh:'十九', py:'shíjiǔ', uz:"o'n to'qqiz", ru:'19', en:'19', n:19 },
                ]).map((r, i) => (
                  <div key={i} style={{ background:'#f5f5f8', borderRadius:8, padding:'8px 6px', textAlign:'center', cursor:'pointer', userSelect:'none' }}
                    onClick={() => playGrammarAudio(r.zh)}>
                    <div style={{ fontSize:18, fontWeight:700, color:C_NUM }}>{r.zh}</div>
                    <div style={{ fontSize:10, color:'#92400e' }}>{r.py}</div>
                    <div style={{ fontSize:10, color:'#888' }}>{t(r.uz, r.ru, r.en)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 20–90 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("20 — 90: birlik + 十","20 — 90: единица + 十","20 — 90: digit + 十")}</div>
              <div className="grammar-block__formula">
                <span style={{ color:'#555' }}>{t("o'nlik raqam",'цифра','digit')}</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Ikki × o'n = yigirma; uch × o'n = o'ttiz…",
                  'Два × десять = двадцать; три × десять = тридцать…',
                  'Two × ten = twenty; three × ten = thirty…',
                )}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6 }}>
                {([
                  { zh:'二十', py:'èrshí',  n:'20' },
                  { zh:'三十', py:'sānshí', n:'30' },
                  { zh:'四十', py:'sìshí',  n:'40' },
                  { zh:'五十', py:'wǔshí',  n:'50' },
                  { zh:'六十', py:'liùshí', n:'60' },
                  { zh:'七十', py:'qīshí',  n:'70' },
                  { zh:'八十', py:'bāshí',  n:'80' },
                  { zh:'九十', py:'jiǔshí', n:'90' },
                ]).map((r, i) => (
                  <div key={i} style={{ background:'#f5f5f8', borderRadius:8, padding:'8px 4px', textAlign:'center', cursor:'pointer', userSelect:'none' }}
                    onClick={() => playGrammarAudio(r.zh)}>
                    <div style={{ fontSize:16, fontWeight:700, color:C_NUM }}>{r.zh}</div>
                    <div style={{ fontSize:10, color:'#92400e' }}>{r.py}</div>
                    <div style={{ fontSize:11, color:'#888', fontWeight:600 }}>{r.n}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 21–99 compound */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("21 — 99: o'nlik + 十 + birlik","21 — 99: десятки + 十 + единица","21 — 99: tens + 十 + ones")}</div>
              <div className="grammar-block__formula">
                <span style={{ color:'#555' }}>{t("o'nlik","десятки","tens")}</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
                {' + '}
                <span style={{ color:'#555' }}>{t('birlik','единица','ones')}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Masalan: 三十五 = sān + shí + wǔ = 35",
                  'Например: 三十五 = sān + shí + wǔ = 35',
                  'Example: 三十五 = sān + shí + wǔ = 35',
                )}
              </p>
              {([
                { zh:'二十一', py:'èrshíyī',   uz:'yigirma bir',     ru:'двадцать один',      en:'twenty-one',    n:21 },
                { zh:'三十五', py:'sānshíwǔ',  uz:"o'ttiz besh",     ru:'тридцать пять',      en:'thirty-five',   n:35 },
                { zh:'四十八', py:'sìshíbā',   uz:'qirq sakkiz',     ru:'сорок восемь',       en:'forty-eight',   n:48 },
                { zh:'六十六', py:'liùshíliù', uz:'oltmish olti',    ru:'шестьдесят шесть',   en:'sixty-six',     n:66 },
                { zh:'九十九', py:'jiǔshíjiǔ', uz:"to'qson to'qqiz", ru:'девяносто девять',   en:'ninety-nine',   n:99 },
              ]).map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none' }}>
                  <button type="button" className="grammar-play-btn" onClick={() => playGrammarAudio(r.zh)} style={{background:'#fef3c7'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <div style={{ fontSize:22, fontWeight:700, color:C_NUM, minWidth:60 }}>{r.zh}</div>
                  <div>
                    <div style={{ fontSize:11, color:'#92400e' }}>{r.py}</div>
                    <div style={{ fontSize:11, color:'#888' }}>{t(r.uz, r.ru, r.en)} ({r.n})</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive number builder */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("Raqam yasang!","Составьте число!","Build a Number!")}</div>
              <p style={{ fontSize:12, color:'#555', marginBottom:10 }}>{t("O'nlik tanlang:","Выберите десятки:","Choose tens:")}</p>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} type="button" onClick={() => { setBuiltTens(d); setBuiltOnes(null); }} style={{
                    width:40, height:40, borderRadius:8, border:`2px solid ${builtTens === d ? C_NUM : '#e0e0e6'}`,
                    background: builtTens === d ? C_NUM : '#f5f5f8', color: builtTens === d ? '#fff' : '#1a1a2e',
                    fontSize:16, fontWeight:700, cursor:'pointer',
                  }}>{ones[d-1].n}</button>
                ))}
              </div>
              <p style={{ fontSize:12, color:'#555', marginBottom:10 }}>{t("Birlik tanlang (0 = nol):","Выберите единицу (0 = ноль):","Choose ones (0 = zero):")}</p>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                <button type="button" onClick={() => setBuiltOnes(0)} style={{
                  width:40, height:40, borderRadius:8, border:`2px solid ${builtOnes === 0 ? '#6b7280' : '#e0e0e6'}`,
                  background: builtOnes === 0 ? '#6b7280' : '#f5f5f8', color: builtOnes === 0 ? '#fff' : '#1a1a2e',
                  fontSize:13, fontWeight:600, cursor:'pointer',
                }}>0</button>
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} type="button" onClick={() => setBuiltOnes(d)} style={{
                    width:40, height:40, borderRadius:8, border:`2px solid ${builtOnes === d ? C_NUM : '#e0e0e6'}`,
                    background: builtOnes === d ? C_NUM : '#f5f5f8', color: builtOnes === d ? '#fff' : '#1a1a2e',
                    fontSize:16, fontWeight:700, cursor:'pointer',
                  }}>{ones[d-1].n}</button>
                ))}
              </div>
              {built ? (
                <div style={{ background:'#fffbeb', borderRadius:10, padding:16, textAlign:'center', border:`2px solid ${C_NUM}` }}>
                  <div style={{ fontSize:48, fontWeight:700, color:C_NUM, letterSpacing:4, marginBottom:4 }}>{built.zh}</div>
                  <div style={{ fontSize:16, color:'#92400e', marginBottom:4 }}>{built.py}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'#555' }}>{built.num}</div>
                  <div style={{ fontSize:14, color:'#555', marginTop:2 }}>{t(built.uz, built.ru, built.en)}</div>
                  <button type="button" className="grammar-play-btn" onClick={() => playGrammarAudio(built.zh)} style={{background:'#fef3c7'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              ) : (
                <div style={{ background:'#f5f5f8', borderRadius:10, padding:20, textAlign:'center', color:'#bbb', fontSize:13 }}>
                  {t("O'nlik va birlik tanlang…","Выберите десятки и единицу…","Choose tens and ones…")}
                </div>
              )}
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
              <div
                key={i}
                role="button"
                tabIndex={0}
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#fef3c7'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z"/></svg>
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
              </div>
            ))}
          </div>
        )}

        {/* ── DIALOG ── */}
        {activeTab === 'dialog' && (
          <>
            {/* Dialog 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Dialog 1 — Oila va kitoblar','Диалог 1 — Семья и книги','Dialogue 1 — Family and Books')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fffbeb' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_NUM:C_OBJ,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Vaqt va narx','Диалог 2 — Время и цена','Dialogue 2 — Time and Price')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fffbeb' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_NUM:C_OBJ,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
                  zh: t('十 + birlik','十 + единица','十 + digit'),
                  ex: '十五 = 15',
                  desc: t(
                    "O'n va birlik orasida hech narsa qo'shilmaydi",
                    'Между десятью и единицей ничего не добавляется',
                    'Nothing is added between ten and the digit',
                  ),
                },
                {
                  zh: t("o'nlik + 十","десятки + 十","tens digit + 十"),
                  ex: '三十 = 30',
                  desc: t(
                    "O'nlikdan keyin 十, keyin birlik (agar bor bo'lsa)",
                    'После десятков 十, потом единица (если есть)',
                    'After the tens digit comes 十, then ones (if any)',
                  ),
                },
                {
                  zh: t("o'nlik + 十 + birlik","десятки + 十 + единица","tens + 十 + ones"),
                  ex: '四十八 = 48',
                  desc: t(
                    "Uchta qism birga yoziladi — bo'sh joy yo'q",
                    'Три части пишутся слитно — без пробелов',
                    'Three parts written together — no spaces',
                  ),
                },
              ]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #f59e0b', background:'#fffbeb' }}
                >
                  <div style={{ fontSize:16, fontWeight:700, color:C_NUM }}>{item.zh}</div>
                  <div style={{ fontSize:14, color:'#92400e', marginTop:2 }}>{item.ex}</div>
                  <div className="grammar-block__usage-note" style={{ color:'#555', marginTop:2 }}>
                    {item.desc}
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
            accentColor="#f59e0b"
            accentBg="#fffbeb"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
