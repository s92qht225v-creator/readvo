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

const C_NUM  = '#f59e0b'; // Numbers (amber — featured)
const C_SUB  = '#3b82f6'; // Subject
const C_VERB = '#1d4ed8'; // Verb
const C_OBJ  = '#dc2626'; // Object/Noun
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
  { id: 'usage',    uz: 'Shablon',  ru: 'Шаблоны',  en: 'Patterns'  },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const numbersTable = [
  { char: '一', pinyin: 'yī', num: 1 },
  { char: '二', pinyin: 'èr', num: 2 },
  { char: '三', pinyin: 'sān', num: 3 },
  { char: '四', pinyin: 'sì', num: 4 },
  { char: '五', pinyin: 'wǔ', num: 5 },
  { char: '六', pinyin: 'liù', num: 6 },
  { char: '七', pinyin: 'qī', num: 7 },
  { char: '八', pinyin: 'bā', num: 8 },
  { char: '九', pinyin: 'jiǔ', num: 9 },
  { char: '十', pinyin: 'shí', num: 10 },
];

const examples: { parts: Part[]; pinyin: string; uz: string; ru: string; en: string; note_uz: string; note_ru: string; note_en: string }[] = [
  {
    parts:[{text:'我',color:C_SUB},{text:'今年',color:C_VERB},{text:'二十五',color:C_NUM},{text:'岁。',color:C_OBJ}],
    pinyin:'Wǒ jīnnián èrshíwǔ suì.',
    uz:'Men bu yil yigirma besh yoshdaman.',       ru:'Мне в этом году двадцать пять лет.',      en:"I'm twenty-five years old this year.",
    note_uz:'二十五 (èrshíwǔ) = 2×10+5 = 25 · 岁 (suì) = yosh',
    note_ru:'二十五 (èrshíwǔ) = 2×10+5 = 25 · 岁 (suì) = лет',
    note_en:'二十五 (èrshíwǔ) = 2×10+5 = 25 · 岁 (suì) = years old',
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'有',color:C_VERB},{text:'三十',color:C_NUM},{text:'本',color:C_PUNC},{text:'书。',color:C_OBJ}],
    pinyin:'Tā yǒu sānshí běn shū.',
    uz:'Uning o\'ttizta kitobi bor.',               ru:'У него тридцать книг.',                  en:'He has thirty books.',
    note_uz:'三十 (sānshí) = 3×10 = 30 · 本 (běn) = kitob son-o\'lchov so\'zi',
    note_ru:'三十 (sānshí) = 3×10 = 30 · 本 (běn) = счётное слово для книг',
    note_en:'三十 (sānshí) = 3×10 = 30 · 本 (běn) = measure word for books',
  },
  {
    parts:[{text:'现在',color:C_SUB},{text:'八点',color:C_NUM},{text:'十五',color:C_NUM},{text:'分。',color:C_OBJ}],
    pinyin:'Xiànzài bā diǎn shíwǔ fēn.',
    uz:'Hozir soat sakkiz o\'n besh.',              ru:'Сейчас восемь часов пятнадцать минут.',   en:"It's 8:15 now.",
    note_uz:'八 (bā) = 8 · 十五 (shíwǔ) = 15 · 分 (fēn) = daqiqa',
    note_ru:'八 (bā) = 8 · 十五 (shíwǔ) = 15 · 分 (fēn) = минут',
    note_en:'八 (bā) = 8 · 十五 (shíwǔ) = 15 · 分 (fēn) = minutes',
  },
  {
    parts:[{text:'我们班',color:C_SUB},{text:'有',color:C_VERB},{text:'四十',color:C_NUM},{text:'个',color:C_PUNC},{text:'学生。',color:C_OBJ}],
    pinyin:'Wǒmen bān yǒu sìshí gè xuéshēng.',
    uz:'Bizning sinfda qirqta talaba bor.',         ru:'В нашем классе сорок студентов.',         en:'Our class has forty students.',
    note_uz:'四十 (sìshí) = 4×10 = 40 · 个 (gè) = umumiy son-o\'lchov so\'zi',
    note_ru:'四十 (sìshí) = 4×10 = 40 · 个 (gè) = универсальное счётное слово',
    note_en:'四十 (sìshí) = 4×10 = 40 · 个 (gè) = general measure word',
  },
  {
    parts:[{text:'这个苹果',color:C_OBJ},{text:'五',color:C_NUM},{text:'块',color:C_PUNC},{text:'钱。',color:C_OBJ}],
    pinyin:'Zhège píngguǒ wǔ kuài qián.',
    uz:'Bu olma besh yuan.',                        ru:'Это яблоко стоит пять юаней.',            en:'This apple costs five yuan.',
    note_uz:'五 (wǔ) = 5 · 块 (kuài) = yuan (pul birligi)',
    note_ru:'五 (wǔ) = 5 · 块 (kuài) = юань (денежная единица)',
    note_en:'五 (wǔ) = 5 · 块 (kuài) = yuan (currency unit)',
  },
  {
    parts:[{text:'她',color:C_SUB},{text:'今年',color:C_VERB},{text:'十八',color:C_NUM},{text:'岁。',color:C_OBJ}],
    pinyin:'Tā jīnnián shíbā suì.',
    uz:'U bu yil o\'n sakkiz yoshda.',              ru:'Ей в этом году восемнадцать лет.',        en:"She's eighteen this year.",
    note_uz:'十八 (shíbā) = 10+8 = 18',
    note_ru:'十八 (shíbā) = 10+8 = 18',
    note_en:'十八 (shíbā) = 10+8 = 18',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'买了',color:C_VERB},{text:'二十',color:C_NUM},{text:'个',color:C_PUNC},{text:'苹果。',color:C_OBJ}],
    pinyin:'Wǒ mǎi le èrshí gè píngguǒ.',
    uz:'Men yigirmata olma sotib oldim.',            ru:'Я купил двадцать яблок.',                 en:'I bought twenty apples.',
    note_uz:'二十 (èrshí) = 2×10 = 20 · 买了 (mǎi le) = sotib oldi',
    note_ru:'二十 (èrshí) = 2×10 = 20 · 买了 (mǎi le) = купил',
    note_en:'二十 (èrshí) = 2×10 = 20 · 买了 (mǎi le) = bought',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'十一',color:C_NUM}], py:'shíyī', uz:'11 (o\'n bir)', ru:'11 (одиннадцать)', en:'11 (eleven)' },
  { parts:[{text:'十二',color:C_NUM}], py:'shíèr', uz:'12 (o\'n ikki)', ru:'12 (двенадцать)', en:'12 (twelve)' },
  { parts:[{text:'十五',color:C_NUM}], py:'shíwǔ', uz:'15 (o\'n besh)', ru:'15 (пятнадцать)', en:'15 (fifteen)' },
  { parts:[{text:'十九',color:C_NUM}], py:'shíjiǔ', uz:'19 (o\'n to\'qqiz)', ru:'19 (девятнадцать)', en:'19 (nineteen)' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'二十',color:C_NUM}], py:'èrshí', uz:'20 (yigirma)', ru:'20 (двадцать)', en:'20 (twenty)' },
  { parts:[{text:'三十',color:C_NUM}], py:'sānshí', uz:'30 (o\'ttiz)', ru:'30 (тридцать)', en:'30 (thirty)' },
  { parts:[{text:'五十',color:C_NUM}], py:'wǔshí', uz:'50 (ellik)', ru:'50 (пятьдесят)', en:'50 (fifty)' },
  { parts:[{text:'九十',color:C_NUM}], py:'jiǔshí', uz:'90 (to\'qson)', ru:'90 (девяносто)', en:'90 (ninety)' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'二十一',color:C_NUM}], py:'èrshíyī', uz:'21 (yigirma bir)', ru:'21 (двадцать один)', en:'21 (twenty-one)' },
  { parts:[{text:'三十五',color:C_NUM}], py:'sānshíwǔ', uz:'35 (o\'ttiz besh)', ru:'35 (тридцать пять)', en:'35 (thirty-five)' },
  { parts:[{text:'六十八',color:C_NUM}], py:'liùshíbā', uz:'68 (oltmish sakkiz)', ru:'68 (шестьдесят восемь)', en:'68 (sixty-eight)' },
  { parts:[{text:'九十九',color:C_NUM}], py:'jiǔshíjiǔ', uz:'99 (to\'qson to\'qqiz)', ru:'99 (девяносто девять)', en:'99 (ninety-nine)' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'这个苹果',color:C_OBJ},{text:'多少',color:C_NUM},{text:'钱？',color:C_OBJ}], py:'Zhège píngguǒ duōshǎo qián?', uz:'Bu olma necha pul?', ru:'Сколько стоит это яблоко?', en:'How much is this apple?' },
  { s:'B', parts:[{text:'五',color:C_NUM},{text:'块。',color:C_OBJ}], py:'Wǔ kuài.', uz:'Besh yuan.', ru:'Пять юаней.', en:'Five yuan.' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'要',color:C_VERB},{text:'三',color:C_NUM},{text:'个。',color:C_OBJ}], py:'Wǒ yào sān gè.', uz:'Menga uchta kerak.', ru:'Мне нужно три.', en:'I want three.' },
  { s:'B', parts:[{text:'好，一共',color:C_VERB},{text:'十五',color:C_NUM},{text:'块。',color:C_OBJ}], py:'Hǎo, yīgòng shíwǔ kuài.', uz:'Xo\'p, hammasi bo\'lib o\'n besh yuan.', ru:'Хорошо, всего пятнадцать юаней.', en:'OK, fifteen yuan in total.' },
  { s:'A', parts:[{text:'给你',color:C_VERB},{text:'二十',color:C_NUM},{text:'块。',color:C_OBJ}], py:'Gěi nǐ èrshí kuài.', uz:'Mana yigirma yuan.', ru:'Вот двадцать юаней.', en:'Here\'s twenty yuan.' },
  { s:'B', parts:[{text:'找你',color:C_VERB},{text:'五',color:C_NUM},{text:'块。',color:C_OBJ}], py:'Zhǎo nǐ wǔ kuài.', uz:'Qaytim besh yuan.', ru:'Сдача пять юаней.', en:'Five yuan change.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'今年',color:C_VERB},{text:'多大？',color:C_NUM}], py:'Nǐ jīnnián duō dà?', uz:'Bu yil necha yoshdasiz?', ru:'Сколько вам лет в этом году?', en:'How old are you this year?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'今年',color:C_VERB},{text:'二十三',color:C_NUM},{text:'岁。',color:C_OBJ}], py:'Wǒ jīnnián èrshísān suì.', uz:'Men bu yil yigirma uch yoshdaman.', ru:'Мне в этом году двадцать три года.', en:"I'm twenty-three this year." },
  { s:'A', parts:[{text:'你家',color:C_SUB},{text:'有',color:C_VERB},{text:'几',color:C_NUM},{text:'个',color:C_PUNC},{text:'人？',color:C_OBJ}], py:'Nǐ jiā yǒu jǐ gè rén?', uz:'Oilangizda necha kishi bor?', ru:'Сколько человек в вашей семье?', en:'How many people in your family?' },
  { s:'B', parts:[{text:'五',color:C_NUM},{text:'个人。',color:C_OBJ}], py:'Wǔ gè rén.', uz:'Beshta kishi.', ru:'Пять человек.', en:'Five people.' },
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几',color:C_NUM},{text:'个',color:C_PUNC},{text:'兄弟姐妹？',color:C_OBJ}], py:'Nǐ yǒu jǐ gè xiōngdì jiěmèi?', uz:'Sizning nechta aka-uka, opa-singilingiz bor?', ru:'Сколько у вас братьев и сестёр?', en:'How many siblings do you have?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'有',color:C_VERB},{text:'两',color:C_NUM},{text:'个',color:C_PUNC},{text:'姐姐。',color:C_OBJ}], py:'Wǒ yǒu liǎng gè jiějie.', uz:'Mening ikkita opam bor.', ru:'У меня две старшие сестры.', en:'I have two older sisters.' },
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

  if (isLoading) return <div className="loading-spinner" />;

  const toggleRev = (setter: React.Dispatch<React.SetStateAction<Record<number, boolean>>>, i: number) =>
    setter(p => ({ ...p, [i]: !p[i] }));

  const t = (uz: string, ru: string, en: string) =>
    ({ uz, ru, en } as Record<string, string>)[language] ?? uz;

  return (
    <div className="grammar-page">
      {/* Hero */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">数</div>
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
          <h1 className="dr-hero__title">数字 1-99</h1>
          <div className="dr-hero__pinyin">shùzì</div>
          <div className="dr-hero__translation">
            — {t('sonlar','числа','numbers')} —
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

        {/* -- ASOSIY -- */}
        {activeTab === 'intro' && (
          <>
            {/* Character info */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Ieroglif','Иероглиф','Character')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">一</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">yī</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t("1-ton (tekis-baland) ā","1-й тон (высокий ровный) ā","1st tone (high level) ā")}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">1</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('bir (1)','один (1)','one (1)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What are Chinese numbers? */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('Xitoy raqamlari nima?','Что такое китайские числа?','What are Chinese numbers?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "Xitoy tilida raqamlar juda oddiy tizimga ega — faqat 一 dan 十 gacha o'rgansangiz, 1 dan 99 gacha hamma sonni tuzishingiz mumkin. Bu o'zbek tilidagi «o'n bir, o'n ikki, yigirma bir» ga o'xshaydi — lekin yanada mantiqiyroq!",
                  'Китайская система чисел очень логична — выучив всего 10 иероглифов (от 一 до 十), вы сможете составить любое число от 1 до 99. Это похоже на русские «одиннадцать, двенадцать, двадцать один» — но ещё проще!',
                  "Chinese numbers follow a beautifully simple system — learn just 10 characters (一 to 十) and you can form any number from 1 to 99. Unlike English with its irregular \"eleven, twelve, thirteen\", Chinese is perfectly logical!",
                )}
              </p>
            </div>

            {/* Numbers 1-10 table */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-10 raqamlar','Числа 1-10','Numbers 1-10')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}>
                {numbersTable.map(n => (
                  <div key={n.num} style={{ textAlign:'center', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'10px 4px' }}>
                    <button type="button" onClick={() => playGrammarAudio(n.char)} style={{width:28,height:28,borderRadius:'50%',background:'#fef3c7',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,margin:'0 auto 4px'}} aria-label="Play">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <div style={{ fontSize:28, fontWeight:700, color:C_NUM }}>{n.char}</div>
                    <div style={{ fontSize:11, color:'#92400e', marginTop:2 }}>{n.pinyin}</div>
                    <div style={{ fontSize:12, color:'#888', fontWeight:600 }}>{n.num}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "Har bir raqamni bosib, talaffuzini eshiting!",
                  'Нажмите на каждую цифру, чтобы услышать произношение!',
                  'Tap each number to hear the pronunciation!',
                )}
              </p>
            </div>

            {/* Key rule */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('Asosiy qoida','Основное правило','Key Rule')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "Xitoy tili o'nlik tizimga asoslangan. 十 (shí) = o'n. Hamma raqamlar shu asosda tuziladi:",
                  'Китайский язык основан на десятичной системе. 十 (shí) = десять. Все числа строятся на этой основе:',
                  'Chinese uses a base-10 system. 十 (shí) = ten. All numbers are built from this:',
                )}
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:8 }}>
                <div style={{ textAlign:'center', background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:8, padding:12, flex:'1 1 120px', maxWidth:160 }}>
                  <div style={{ fontSize:22, fontWeight:700, color:C_NUM }}>十一</div>
                  <div style={{ fontSize:11, color:'#92400e' }}>shíyī</div>
                  <div style={{ fontSize:13, color:'#555', marginTop:4 }}>10 + 1 = <strong>11</strong></div>
                </div>
                <div style={{ textAlign:'center', background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:8, padding:12, flex:'1 1 120px', maxWidth:160 }}>
                  <div style={{ fontSize:22, fontWeight:700, color:C_NUM }}>二十</div>
                  <div style={{ fontSize:11, color:'#92400e' }}>èrshí</div>
                  <div style={{ fontSize:13, color:'#555', marginTop:4 }}>2 × 10 = <strong>20</strong></div>
                </div>
                <div style={{ textAlign:'center', background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:8, padding:12, flex:'1 1 120px', maxWidth:160 }}>
                  <div style={{ fontSize:22, fontWeight:700, color:C_NUM }}>二十一</div>
                  <div style={{ fontSize:11, color:'#92400e' }}>èrshíyī</div>
                  <div style={{ fontSize:13, color:'#555', marginTop:4 }}>2 × 10 + 1 = <strong>21</strong></div>
                </div>
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim/nima?)',     ru:'Подлежащее (кто/что?)', en:'Subject (who/what?)' },
                  { color:C_VERB, uz:"Fe'l (有, 买)",        ru:'Глагол (有, 买)',        en:'Verb (有, 买)' },
                  { color:C_NUM,  uz:'Son (raqamlar)',       ru:'Число (цифры)',          en:'Number (digits)' },
                  { color:C_OBJ,  uz:'Ot (narsa/kishi)',     ru:'Сущ. (предмет/человек)', en:'Noun (thing/person)' },
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

        {/* -- SHABLON -- */}
        {activeTab === 'usage' && (
          <>
            {/* Pattern 1 — 11-19 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("1-shablon — 11-19 (o'n + raqam)",'Шаблон 1 — 11-19 (десять + цифра)','Pattern 1 — 11-19 (ten + digit)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>{t('raqam','цифра','digit')}</span>
                {' = '}
                <span style={{ color:'#555' }}>11-19</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "O'zbek tilida «o'n bir, o'n ikki» — xitoy tilida ham xuddi shunday: 十 + raqam",
                  'Как в русском «одиннадцать» (десять + один), в китайском: 十 + цифра',
                  'Just like saying "ten-one, ten-two" — simply add the digit after 十',
                )}
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
                  "Oddiy: 十 (10) + 一 (1) = 十一 (11). Ingliz tilidagi «eleven, twelve» ga o'xshamaydi — ancha mantiqiy!",
                  'Просто: 十 (10) + 一 (1) = 十一 (11). В отличие от русского, никаких исключений!',
                  'Simple: 十 (10) + 一 (1) = 十一 (11). No irregular words like "eleven" or "twelve"!',
                )}
              </p>
            </div>

            {/* Pattern 2 — 20-90 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("2-shablon — 20-90 (raqam × o'n)",'Шаблон 2 — 20-90 (цифра × десять)','Pattern 2 — 20-90 (digit × ten)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_NUM, fontWeight:700 }}>{t('raqam','цифра','digit')}</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
                {' = '}
                <span style={{ color:'#555' }}>20, 30, … 90</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Raqamni 十 oldiga qo'ying: 二十 = «ikki o'n» = 20",
                  'Поставьте цифру перед 十: 二十 = «два-десять» = 20',
                  'Put the digit before 十: 二十 = "two-ten" = 20',
                )}
              </p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 3 — 21-99 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("3-shablon — 21-99 (to'liq raqam)",'Шаблон 3 — 21-99 (полное число)','Pattern 3 — 21-99 (full number)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_NUM, fontWeight:700 }}>{t('raqam','цифра','digit')}</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>十</span>
                {' + '}
                <span style={{ color:C_NUM, fontWeight:700 }}>{t('raqam','цифра','digit')}</span>
                {' = '}
                <span style={{ color:'#555' }}>21-99</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Ikkalasini birlashtiring: 二十一 = «ikki o'n bir» = 21",
                  'Объедините оба шаблона: 二十一 = «два-десять-один» = 21',
                  'Combine both patterns: 二十一 = "two-ten-one" = 21',
                )}
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
                  "九十九 = 9×10+9 = 99 — eng katta ikki xonali son!",
                  '九十九 = 9×10+9 = 99 — самое большое двузначное число!',
                  '九十九 = 9×10+9 = 99 — the largest two-digit number!',
                )}
              </p>
            </div>

            {/* 二 vs 两 */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("二 va 两 — Farq qiling!",'二 и 两 — Не путайте!','二 vs 两 — Know the Difference!')}</div>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <div style={{ flex:1, textAlign:'center', background:'#fffbeb', border:'2px solid #f59e0b', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:C_NUM, fontWeight:700 }}>二</div>
                  <div style={{ color:C_NUM, fontWeight:600 }}>èr</div>
                  <div style={{ marginTop:6, color:'#92400e', fontWeight:600, fontSize:14 }}>{t("Son o'zida: 12, 20, 52",'Само число: 12, 20, 52','The number itself: 12, 20, 52')}</div>
                  <div style={{ fontSize:12, color:'#555', marginTop:4 }}>{t('十二, 二十, 五十二','十二, 二十, 五十二','十二, 二十, 五十二')}</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#ecfdf5', border:'2px solid #059669', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:'#059669', fontWeight:700 }}>两</div>
                  <div style={{ color:'#059669', fontWeight:600 }}>liǎng</div>
                  <div style={{ marginTop:6, color:'#065f46', fontWeight:600, fontSize:14 }}>{t("Son-o'lchov so'zi bilan: 2ta",'Со счётным словом: 2 шт.','With measure word: 2 of...')}</div>
                  <div style={{ fontSize:12, color:'#555', marginTop:4 }}>{t("两个人, 两本书","два человека, две книги","two people, two books")}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                ⚠️ {t(
                  "二十 (20), lekin 两个人 (2 kishi). Son-o'lchov so'zi bilan doim 两 ishlating!",
                  '二十 (20), но 两个人 (2 человека). Со счётными словами всегда используйте 两!',
                  '二十 (20), but 两个人 (2 people). Always use 两 before measure words!',
                )}
              </p>
            </div>
          </>
        )}

        {/* -- MISOLLAR -- */}
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
                  <button type="button" onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{width:32,height:32,borderRadius:'50%',background:'#fef3c7',border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',padding:0}} aria-label="Play">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b"><path d="M8 5v14l11-7z"/></svg>
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

        {/* -- DIALOG -- */}
        {activeTab === 'dialog' && (
          <>
            {/* Dialog 1 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("Dialog 1 — Do'konda",'Диалог 1 — В магазине','Dialogue 1 — At the Store')}</div>
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
              <div className="grammar-block__label">{t('Dialog 2 — Tanishuv','Диалог 2 — Знакомство','Dialogue 2 — Getting to Know')}</div>
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
                  parts:[{text:'十一',color:C_NUM}],
                  note: t("十 + 一 = 11 (o'n bir)","十 + 一 = 11 (одиннадцать)","十 + 一 = 11 (eleven)"),
                },
                {
                  parts:[{text:'二十',color:C_NUM}],
                  note: t("二 + 十 = 20 (yigirma)","二 + 十 = 20 (двадцать)","二 + 十 = 20 (twenty)"),
                },
                {
                  parts:[{text:'二十一',color:C_NUM}],
                  note: t("二 + 十 + 一 = 21 (yigirma bir)","二 + 十 + 一 = 21 (двадцать один)","二 + 十 + 一 = 21 (twenty-one)"),
                },
                {
                  parts:[{text:'两',color:'#059669'},{text:'个人',color:C_OBJ}],
                  note: t("两 (liǎng) = son-o'lchov so'zi bilan · 二 (èr) = sonning o'zida","两 (liǎng) = со счётным словом · 二 (èr) = само число","两 (liǎng) = with measure words · 二 (èr) = for the number itself"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #f59e0b', background:'#fffbeb' }}
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

        {/* -- MASHQ -- */}
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
