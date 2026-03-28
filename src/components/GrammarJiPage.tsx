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

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_VERB = '#1d4ed8'; // Verb (有, 买)
const C_JI   = '#059669'; // 几 (emerald — featured)
const C_OBJ  = '#dc2626'; // Object / Noun
const C_PUNC = '#888';    // Punctuation
const C_NE   = '#7c3aed'; // 呢

const speakingQuestionsData = [
  { uz: 'Sizda nechta kitob bor?', ru: 'Сколько у вас книг?', en: 'How many books do you have?', zh: '你有几本书？', pinyin: 'Nǐ yǒu jǐ běn shū?' },
  { uz: 'Oilangda necha kishi bor?', ru: 'Сколько человек в вашей семье?', en: 'How many people are in your family?', zh: '你家有几个人？', pinyin: 'Nǐ jiā yǒu jǐ gè rén?' },
  { uz: 'Hozir soat necha?', ru: 'Который сейчас час?', en: 'What time is it now?', zh: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?' },
  { uz: 'Sizda nechta do\'st bor?', ru: 'Сколько у вас друзей?', en: 'How many friends do you have?', zh: '你有几个朋友？', pinyin: 'Nǐ yǒu jǐ gè péngyǒu?' },
  { uz: 'Siz necha yoshdasiz?', ru: 'Сколько вам лет?', en: 'How old are you?', zh: '你几岁？', pinyin: 'Nǐ jǐ suì?' },
  { uz: 'Sizning nechta akangiz bor?', ru: 'Сколько у вас старших братьев?', en: 'How many older brothers do you have?', zh: '你有几个哥哥？', pinyin: 'Nǐ yǒu jǐ gè gēge?' },
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
    parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几本',color:C_JI},{text:'书',color:C_OBJ},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ yǒu jǐ běn shū?',
    uz:'Sizda nechta kitob bor?',              ru:'Сколько у вас книг?',                en:'How many books do you have?',
    note_uz:'几本 (jǐ běn) = nechtasi · 本 (běn) = kitob uchun son-o\'lchov so\'zi',
    note_ru:'几本 (jǐ běn) = сколько · 本 (běn) = счётное слово для книг',
    note_en:'几本 (jǐ běn) = how many · 本 (běn) = measure word for books',
  },
  {
    parts:[{text:'你家',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ jiā yǒu jǐ gè rén?',
    uz:'Oilangda necha kishi bor?',            ru:'Сколько человек в семье?',            en:'How many people in your family?',
    note_uz:'家 (jiā) = oila/uy · 几个 (jǐ gè) = nechtasi · 人 (rén) = kishi',
    note_ru:'家 (jiā) = семья/дом · 几个 (jǐ gè) = сколько · 人 (rén) = человек',
    note_en:'家 (jiā) = family/home · 几个 (jǐ gè) = how many · 人 (rén) = person',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'朋友',color:C_OBJ},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ yǒu jǐ gè péngyǒu?',
    uz:'Sizda nechta do\'st bor?',             ru:'Сколько у вас друзей?',               en:'How many friends do you have?',
    note_uz:'朋友 (péngyǒu) = do\'st · 个 (gè) = umumiy son-o\'lchov so\'zi',
    note_ru:'朋友 (péngyǒu) = друг · 个 (gè) = универсальное счётное слово',
    note_en:'朋友 (péngyǒu) = friend · 个 (gè) = general measure word',
  },
  {
    parts:[{text:'现在',color:C_SUB},{text:'几点',color:C_JI},{text:'？',color:C_PUNC}],
    pinyin:'Xiànzài jǐ diǎn?',
    uz:'Hozir soat necha?',                    ru:'Который сейчас час?',                en:'What time is it now?',
    note_uz:'几点 (jǐ diǎn) = soat necha · 现在 (xiànzài) = hozir',
    note_ru:'几点 (jǐ diǎn) = который час · 现在 (xiànzài) = сейчас',
    note_en:'几点 (jǐ diǎn) = what time · 现在 (xiànzài) = now',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'哥哥',color:C_OBJ},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ yǒu jǐ gè gēge?',
    uz:'Sizning nechta akangiz bor?',          ru:'Сколько у вас старших братьев?',      en:'How many older brothers do you have?',
    note_uz:'哥哥 (gēge) = aka',
    note_ru:'哥哥 (gēge) = старший брат',
    note_en:'哥哥 (gēge) = older brother',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'今年',color:C_VERB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ jīnnián jǐ suì?',
    uz:'Bu yil siz necha yoshdasiz?',          ru:'Сколько вам лет в этом году?',        en:'How old are you this year?',
    note_uz:'几岁 (jǐ suì) = necha yosh · 今年 (jīnnián) = bu yil',
    note_ru:'几岁 (jǐ suì) = сколько лет · 今年 (jīnnián) = в этом году',
    note_en:'几岁 (jǐ suì) = how old · 今年 (jīnnián) = this year',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'买了',color:C_VERB},{text:'几个',color:C_JI},{text:'苹果',color:C_OBJ},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ mǎi le jǐ gè píngguǒ?',
    uz:'Siz nechta olma sotib oldingiz?',      ru:'Сколько яблок вы купили?',            en:'How many apples did you buy?',
    note_uz:'苹果 (píngguǒ) = olma · 买了 (mǎi le) = sotib oldi',
    note_ru:'苹果 (píngguǒ) = яблоко · 买了 (mǎi le) = купил',
    note_en:'苹果 (píngguǒ) = apple · 买了 (mǎi le) = bought',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'朋友',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ yǒu jǐ gè péngyǒu?', uz:'Sizda nechta do\'st bor?', ru:'Сколько у вас друзей?', en:'How many friends do you have?' },
  { parts:[{text:'你家',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ jiā yǒu jǐ gè rén?', uz:'Oilangda necha kishi bor?', ru:'Сколько человек в семье?', en:'How many people in your family?' },
  { parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几本',color:C_JI},{text:'书',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ yǒu jǐ běn shū?', uz:'Sizda nechta kitob bor?', ru:'Сколько у вас книг?', en:'How many books do you have?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'现在',color:C_SUB},{text:'几点',color:C_JI},{text:'？',color:C_PUNC}], py:'Xiànzài jǐ diǎn?', uz:'Hozir soat necha?', ru:'Который сейчас час?', en:'What time is it now?' },
  { parts:[{text:'现在',color:C_SUB},{text:'三点',color:C_JI},{text:'。',color:C_PUNC}], py:'Xiànzài sān diǎn.', uz:'Hozir uch.', ru:'Сейчас три часа.', en:'It\'s three o\'clock.' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}], py:'Nǐ jǐ suì?', uz:'Siz necha yoshsiz?', ru:'Сколько вам лет?', en:'How old are you?' },
  { parts:[{text:'他',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}], py:'Tā jǐ suì?', uz:'U necha yoshda?', ru:'Сколько ему лет?', en:'How old is he?' },
  { parts:[{text:'你弟弟',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}], py:'Nǐ dìdi jǐ suì?', uz:'Ukangiz necha yoshda?', ru:'Сколько лет вашему брату?', en:'How old is your brother?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你家',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ jiā yǒu jǐ gè rén?', uz:'Oilangda necha kishi bor?', ru:'Сколько человек в семье?', en:'How many people in your family?' },
  { s:'B', parts:[{text:'我家有五个人。',color:C_SUB}], py:'Wǒ jiā yǒu wǔ gè rén.', uz:'Oilamda besh kishi bor.', ru:'В моей семье пять человек.', en:'There are five people in my family.' },
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'哥哥',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ yǒu jǐ gè gēge?', uz:'Sizning nechta akangiz bor?', ru:'Сколько у вас братьев?', en:'How many older brothers do you have?' },
  { s:'B', parts:[{text:'我有一个哥哥。',color:C_SUB},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ yǒu yī gè gēge. Nǐ ne?', uz:'Mening bitta akam bor. Sizchi?', ru:'У меня один старший брат. А у вас?', en:'I have one older brother. And you?' },
  { s:'A', parts:[{text:'我没有哥哥，有两个妹妹。',color:C_SUB}], py:'Wǒ méiyǒu gēge, yǒu liǎng gè mèimei.', uz:'Mening akam yo\'q, ikkita singlim bor.', ru:'У меня нет братьев, есть две сестры.', en:'I don\'t have brothers, I have two sisters.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'现在',color:C_SUB},{text:'几点',color:C_JI},{text:'？',color:C_PUNC}], py:'Xiànzài jǐ diǎn?', uz:'Hozir soat necha?', ru:'Который сейчас час?', en:'What time is it now?' },
  { s:'B', parts:[{text:'现在三点。',color:C_SUB}], py:'Xiànzài sān diǎn.', uz:'Hozir uch.', ru:'Сейчас три часа.', en:'It\'s three o\'clock.' },
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几本',color:C_JI},{text:'汉语书',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Nǐ yǒu jǐ běn Hànyǔ shū?', uz:'Sizda nechta xitoy tili kitobi bor?', ru:'Сколько у вас учебников китайского?', en:'How many Chinese books do you have?' },
  { s:'B', parts:[{text:'我有两本。',color:C_SUB},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ yǒu liǎng běn. Nǐ ne?', uz:'Menda ikkita bor. Sizchi?', ru:'У меня две. А у вас?', en:'I have two. And you?' },
  { s:'A', parts:[{text:'我有三本。',color:C_SUB}], py:'Wǒ yǒu sān běn.', uz:'Menda uchta bor.', ru:'У меня три.', en:'I have three.' },
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

export function GrammarJiPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('ji');
    if (existing === undefined || newStars > existing) saveStars('ji', newStars);
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
        <div className="dr-hero__watermark">几</div>
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
          <h1 className="dr-hero__title">几</h1>
          <div className="dr-hero__pinyin">jǐ</div>
          <div className="dr-hero__translation">
            — {t('nechta?','сколько?','how many?')} —
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
                <div className="grammar-block__big-char">几</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">jǐ</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t("3-ton (tushuvchi-ko'tariluvchi) ↘↗",'3-й тон (нисходяще-восходящий) ↘↗','3rd tone (falling-rising) ↘↗')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('2 ta','2','2')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('nechta? / necha?','сколько?','how many?')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 几 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('几 nima?','几 — что это?','What is 几?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_JI }}>几</strong> = <strong>{t('nechta / necha','сколько','how many')}</strong>
                <br />
                {t(
                  "Son so'rashda ishlatiladi — odatda kichik yoki taxminiy sonlar (10 dan kam). O'zbek tilidagi «nechta?» so'ziga to'g'ri keladi.",
                  'Используется для вопросов о количестве — обычно о небольших или приблизительных числах (до 10). Соответствует русскому «сколько?» (для небольших чисел).',
                  'Used to ask about quantity — typically for small or approximate numbers (under 10). Like asking "how many?" when you expect a small number.',
                )}
              </p>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Sizda nechta kitob bor?» desak, «nechta» soni oldindan so'raydi. Xitoy tilida 几 xuddi shunday ishlaydi, lekin son bilan ot orasida maxsus o'lchov so'z (量词) kerak:",
                  "В русском «Сколько у вас книг?» слово «сколько» стоит перед существительным. В китайском 几 работает так же, но между числом и существительным нужен счётный суффикс (量词):",
                  "In English, \"How many books do you have?\" puts the question before the noun. In Chinese, 几 works similarly, but requires a measure word (量词) between the number and the noun:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Darak gap','Повествование','Statement')}</div>
                  <div className="grammar-block__usage-py">Wǒ yǒu sān běn shū.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'我',color:C_SUB},{text:'有',color:C_VERB},{text:'三本',color:C_JI},{text:'书。',color:C_OBJ}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Menda uchta kitob bor.','У меня три книги.','I have three books.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>+几→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_JI }}>{t('Savol','Вопрос','Question')}</div>
                  <div className="grammar-block__usage-py">Nǐ yǒu jǐ běn shū?</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几本',color:C_JI},{text:'书',color:C_OBJ},{text:'？',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Sizda nechta kitob bor?','Сколько у вас книг?','How many books do you have?')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "«三本» (uchta) o'rniga 几本 qo'yildi — boshqa hech narsa o'zgarmadi.",
                  "«三本» (три) заменили на 几本 — больше ничего не изменилось.",
                  "\"三本\" (three) was replaced with 几本 — nothing else changed.",
                )}
              </p>
            </div>

            {/* 几 + measure word */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("几 + son-o'lchov so'zi","几 + счётное слово","几 + Measure Word")}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom:10 }}>
                {t(
                  "Son bilan ot orasida maxsus so'z (量词) ishlatiladi. 几 ham xuddi shunday ishlaydi:",
                  'Между числом и существительным используется счётное слово (量词). 几 работает так же:',
                  'A measure word (量词) goes between the number and the noun. 几 follows the same rule:',
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:12 }}>
                {([
                  { mw:'个', py:'gè', uz:'umumiy (kishi, narsa)', ru:'универсальное (люди, вещи)', en:'general (people, things)', ex:'几个人', exUz:'necha kishi', exRu:'сколько людей', exEn:'how many people' },
                  { mw:'本', py:'běn', uz:'kitob uchun', ru:'для книг', en:'for books', ex:'几本书', exUz:'nechta kitob', exRu:'сколько книг', exEn:'how many books' },
                  { mw:'只', py:'zhī', uz:'hayvon uchun', ru:'для животных', en:'for animals', ex:'几只猫', exUz:'nechta mushuk', exRu:'сколько кошек', exEn:'how many cats' },
                  { mw:'个', py:'gè', uz:'vaqt: oy, kun', ru:'время: месяцы, дни', en:'time: months, days', ex:'几个月', exUz:'necha oy', exRu:'сколько месяцев', exEn:'how many months' },
                ] as { mw:string; py:string; uz:string; ru:string; en:string; ex:string; exUz:string; exRu:string; exEn:string }[]).map((r, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none', fontSize:13 }}>
                    <div style={{ minWidth:28, fontSize:20, fontWeight:700, color:C_JI }}>{r.mw}</div>
                    <div style={{ minWidth:32, fontSize:11, color:'#888' }}>{r.py}</div>
                    <div style={{ minWidth:90, fontSize:11, color:'#555' }}>{t(r.uz, r.ru, r.en)}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#1a1a2e' }}>{r.ex}</div>
                    <div style={{ fontSize:11, color:'#888' }}>= {t(r.exUz, r.exRu, r.exEn)}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:8 }}>
                💡 {t(
                  "Eng muhimi: 几个 — kishi va umumiy narsalar uchun eng ko'p ishlatiladi",
                  'Главное: 几个 — самая частая форма для людей и общих предметов',
                  'Key point: 几个 is the most common form for people and general objects',
                )}
              </p>
            </div>

            {/* 几 vs 多少 */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("几 va 多少 — Farq qiling!","几 и 多少 — Не путайте!","几 vs 多少 — Know the Difference!")}</div>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <div style={{ flex:1, textAlign:'center', background:'#ecfdf5', border:'2px solid #059669', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:C_JI, fontWeight:700 }}>几</div>
                  <div style={{ color:C_JI, fontWeight:600 }}>jǐ</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('3-ton ↘↗','3-й тон ↘↗','3rd tone ↘↗')}</div>
                  <div style={{ marginTop:6, color:C_JI, fontWeight:600, fontSize:14 }}>{t('kichik son (1-9)','небольшое число (1-9)','small number (1-9)')}</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#f5f3ff', border:'2px solid #7c3aed', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:'#7c3aed', fontWeight:700 }}>多少</div>
                  <div style={{ color:'#7c3aed', fontWeight:600 }}>duōshǎo</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('1+3 ton','1+3 тон','1st+3rd tone')}</div>
                  <div style={{ marginTop:6, color:'#7c3aed', fontWeight:600, fontSize:14 }}>{t('istalgan son','любое число','any number')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                ⚠️ {t(
                  "Narx va miqdor so'raganda odatda 多少 ishlatiladi (多少钱？). Oila a'zolari, kitoblar, do'stlar — 几 bilan so'raladi.",
                  'Для цен и больших количеств обычно используется 多少 (多少钱？). Члены семьи, книги, друзья — спрашивают через 几.',
                  'For prices and large quantities, 多少 is used (多少钱？). Family members, books, friends — use 几.',
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim/nima?)',     ru:'Подлежащее (кто/что?)', en:'Subject (who/what?)' },
                  { color:C_VERB, uz:"Fe'l (有, 买)",        ru:'Глагол (有, 买)',        en:'Verb (有, 买)' },
                  { color:C_JI,   uz:'几 (nechta?)',          ru:'几 (сколько?)',          en:'几 (how many?)' },
                  { color:C_OBJ,  uz:'Ot (narsa/kishi)',     ru:'Сущ. (предмет/человек)', en:'Noun (thing/person)' },
                  { color:C_NE,   uz:'呢 (…chi?)',            ru:'呢 (…а вы?)',            en:'呢 (…and you?)' },
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
            {/* Pattern 1 — 有 + 几 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("1-shablon — 有 + 几 (nechta bor?)",'Шаблон 1 — 有 + 几 (сколько есть?)','Pattern 1 — 有 + 几 (how many?)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>有</span>
                {' '}
                <span style={{ color:C_JI, fontWeight:700 }}>几</span>
                <span style={{ color:'#888' }}>+{t("o'lch.","сч.сл.","MW")}+</span>
                <span style={{ color:C_OBJ, fontWeight:700 }}>{t('Ot','Сущ.','Noun')}</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("o'lch. = son-o'lchov so'zi (个, 本, 只…)",'сч.сл. = счётное слово (个, 本, 只…)','MW = measure word (个, 本, 只…)')}
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
                  "几个 eng ko'p ishlatiladigan shakl. Javob: 我有三个朋友。(Menda uchta do'st bor.)",
                  "几个 — самая частая форма. Ответ: 我有三个朋友。(У меня три друга.)",
                  "几个 is the most common form. Answer: 我有三个朋友。(I have three friends.)",
                )}
              </p>
            </div>

            {/* Extra — standalone */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("Qo'shimcha — 几个/几本 yolg'iz (tez so'rash)","Дополнительно — 几个/几本 отдельно (быстрый вопрос)","Extra — 几个/几本 alone (quick question)")}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom:8 }}>
                {t(
                  "Oddiy suhbatda 几个/几本 yolg'iz ham ishlatiladi — 有 shart emas:",
                  'В разговорной речи 几个/几本 можно использовать и без 有:',
                  'In casual speech, 几个/几本 can be used alone — 有 is not required:',
                )}
              </p>
              {([
                { parts:[{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Jǐ gè rén?', uz:'Nechta kishi?', ru:'Сколько людей?', en:'How many people?' },
                { parts:[{text:'几本',color:C_JI},{text:'书',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Jǐ běn shū?', uz:'Nechta kitob?', ru:'Сколько книг?', en:'How many books?' },
                { parts:[{text:'几个',color:C_JI},{text:'苹果',color:C_OBJ},{text:'？',color:C_PUNC}], py:'Jǐ gè píngguǒ?', uz:'Nechta olma?', ru:'Сколько яблок?', en:'How many apples?' },
              ] as PatternRow[]).map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 2 — 几点 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — 几点 (soat necha?)','Шаблон 2 — 几点 (который час?)','Pattern 2 — 几点 (what time?)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>现在</span>
                {' '}
                <span style={{ color:C_JI, fontWeight:700 }}>几点</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Vaqt so'rash — eng ko'p ishlatiladigan 几 savoli","Вопрос о времени — самый частый вопрос с 几","Asking the time — the most common 几 question")}
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
                  "几点 = soat necha? · 点 (diǎn) = soat. Javob: 现在两点。/ 现在八点。",
                  "几点 = который час? · 点 (diǎn) = час. Ответ: 现在两点。/ 现在八点。",
                  "几点 = what time? · 点 (diǎn) = o'clock. Answer: 现在两点。/ 现在八点。",
                )}
              </p>
            </div>

            {/* Pattern 3 — 几岁 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — 几岁 (necha yosh?)','Шаблон 3 — 几岁 (сколько лет?)','Pattern 3 — 几岁 (how old?)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_JI, fontWeight:700 }}>几岁</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Yosh so'rash","Спросить о возрасте","Ask about age")}
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
                  "几岁 = necha yosh — bolalar yoshini so'rashda. Kattalar uchun 多大 (duō dà) ishlatiladi.",
                  "几岁 = сколько лет — для детей. Для взрослых используется 多大 (duō dà).",
                  "几岁 = how old — for children. For adults, use 多大 (duō dà).",
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
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#d1fae5'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#059669"><path d="M8 5v14l11-7z"/></svg>
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
              <div className="grammar-block__label">{t('Dialog 1 — Oila haqida','Диалог 1 — О семье','Dialogue 1 — About Family')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#ecfdf5' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_JI:C_OBJ,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Vaqt va kitoblar','Диалог 2 — Время и книги','Dialogue 2 — Time and Books')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#ecfdf5' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_JI:C_OBJ,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
                  parts:[{text:'你家',color:C_SUB},{text:'有',color:C_VERB},{text:'几个',color:C_JI},{text:'人',color:C_OBJ},{text:'？',color:C_PUNC}],
                  note: t("几个 = nechta (kishi/narsa)","几个 = сколько (людей/предметов)","几个 = how many (people/things)"),
                },
                {
                  parts:[{text:'现在',color:C_SUB},{text:'几点',color:C_JI},{text:'？',color:C_PUNC}],
                  note: t("几点 = soat necha?","几点 = который час?","几点 = what time?"),
                },
                {
                  parts:[{text:'你',color:C_SUB},{text:'有',color:C_VERB},{text:'几本',color:C_JI},{text:'书',color:C_OBJ},{text:'？',color:C_PUNC}],
                  note: t("几本 = nechta kitob?","几本 = сколько книг?","几本 = how many books?"),
                },
                {
                  parts:[{text:'你',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}],
                  note: t("几岁 = necha yosh?","几岁 = сколько лет?","几岁 = how old?"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #059669', background:'#ecfdf5' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#065f46' }}>
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
            accentColor="#059669"
            accentBg="#ecfdf5"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
