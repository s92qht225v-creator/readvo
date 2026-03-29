'use client';

import React, { useState } from 'react';
import { playGrammarAudio } from '@/utils/grammarAudio';
import { Link, useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useStars } from '../hooks/useStars';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { SpeakingMashq } from './SpeakingMashq';
import { calculateStars } from '@/utils/calculateStars';

const C_SUB  = '#16a34a'; // Subject / Ega (green)
const C_HUI  = '#4338ca'; // 会 (indigo-700 — featured)
const C_NEG  = '#ef4444'; // 不会 (red — negation)
const C_VERB = '#dc2626'; // Verb / action
const C_MA   = '#0d9488'; // 吗 (question)
const C_NE   = '#7c3aed'; // 呢
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Men xitoy tilida gaplasha olaman.', ru: 'Я могу говорить по-китайски.', en: 'I can speak Chinese.', zh: '我会说汉语。', pinyin: 'Wǒ huì shuō Hànyǔ.' },
  { uz: 'Siz suzishni bilasizmi?', ru: 'Вы умеете плавать?', en: 'Can you swim?', zh: '你会游泳吗？', pinyin: 'Nǐ huì yóuyǒng ma?' },
  { uz: 'U mashina haydashni qila olmaydi.', ru: 'Он не умеет водить машину.', en: 'He cannot drive a car.', zh: '他不会开车。', pinyin: 'Tā bú huì kāi chē.' },
  { uz: 'Men ovqat pishira olaman.', ru: 'Я умею готовить.', en: 'I can cook.', zh: '我会做饭。', pinyin: 'Wǒ huì zuò fàn.' },
  { uz: "Siz xitoy harflarini yoza olasizmi?", ru: 'Вы умеете писать иероглифы?', en: 'Can you write Chinese characters?', zh: '你会写汉字吗？', pinyin: 'Nǐ huì xiě Hànzì ma?' },
  { uz: "U qo'shiq ayta oladi.", ru: 'Она умеет петь.', en: 'She can sing.', zh: '她会唱歌。', pinyin: 'Tā huì chàng gē.' },
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
    parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'说汉语',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ huì shuō Hànyǔ.',
    uz:'Men xitoy tilida gaplasha olaman.', ru:'Я могу говорить по-китайски.', en:'I can speak Chinese.',
    note_uz:'会 (huì) = qila olmoq · 说 (shuō) = gapirmoq · 汉语 = xitoy tili',
    note_ru:'会 (huì) = уметь · 说 (shuō) = говорить · 汉语 = китайский язык',
    note_en:'会 (huì) = can/able to · 说 (shuō) = to speak · 汉语 = Chinese language',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'游泳',color:C_VERB},{text:'吗？',color:C_MA}],
    pinyin:'Nǐ huì yóuyǒng ma?',
    uz:'Siz suzishni bilasizmi?', ru:'Вы умеете плавать?', en:'Can you swim?',
    note_uz:'游泳 (yóuyǒng) = suzmoq · 吗 = ha/yo\'q savoli',
    note_ru:'游泳 (yóuyǒng) = плавать · 吗 = вопросительная частица',
    note_en:'游泳 (yóuyǒng) = to swim · 吗 = yes/no question particle',
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'不会',color:C_NEG},{text:'开车',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Tā bú huì kāi chē.',
    uz:'U mashina haydashni qila olmaydi.', ru:'Он не умеет водить машину.', en:'He cannot drive a car.',
    note_uz:'不会 (bú huì) = qila olmaydi · 开车 (kāi chē) = mashina haydamoq',
    note_ru:'不会 (bú huì) = не уметь · 开车 (kāi chē) = водить машину',
    note_en:'不会 (bú huì) = cannot · 开车 (kāi chē) = to drive a car',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'做饭',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ huì zuò fàn.',
    uz:'Men ovqat pishira olaman.', ru:'Я умею готовить.', en:'I can cook.',
    note_uz:'做饭 (zuò fàn) = ovqat pishirmoq · 做 = qilmoq · 饭 = ovqat',
    note_ru:'做饭 (zuò fàn) = готовить · 做 = делать · 饭 = еда',
    note_en:'做饭 (zuò fàn) = to cook · 做 = to do/make · 饭 = food/meal',
  },
  {
    parts:[{text:'她',color:C_SUB},{text:'会',color:C_HUI},{text:'唱歌',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Tā huì chàng gē.',
    uz:"U qo'shiq ayta oladi.", ru:'Она умеет петь.', en:'She can sing.',
    note_uz:"唱歌 (chàng gē) = qo'shiq aytmoq · 唱 = kuylash · 歌 = qo'shiq",
    note_ru:'唱歌 (chàng gē) = петь · 唱 = петь · 歌 = песня',
    note_en:'唱歌 (chàng gē) = to sing · 唱 = to sing · 歌 = song',
  },
  {
    parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'写',color:C_VERB},{text:'汉字吗？',color:C_MA}],
    pinyin:'Nǐ huì xiě Hànzì ma?',
    uz:'Siz xitoy harflarini yoza olasizmi?', ru:'Вы умеете писать иероглифы?', en:'Can you write Chinese characters?',
    note_uz:'写 (xiě) = yozmoq · 汉字 (Hànzì) = xitoy harflari (ierogliflar)',
    note_ru:'写 (xiě) = писать · 汉字 (Hànzì) = китайские иероглифы',
    note_en:'写 (xiě) = to write · 汉字 (Hànzì) = Chinese characters',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'不会',color:C_NEG},{text:'说英语',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ bú huì shuō Yīngyǔ.',
    uz:'Men ingliz tilida gaplasha olmayman.', ru:'Я не могу говорить по-английски.', en:'I cannot speak English.',
    note_uz:'英语 (Yīngyǔ) = ingliz tili · 不会 = qila olmaydi',
    note_ru:'英语 (Yīngyǔ) = английский язык · 不会 = не уметь',
    note_en:'英语 (Yīngyǔ) = English language · 不会 = cannot',
  },
  {
    parts:[{text:'他们',color:C_SUB},{text:'都会',color:C_HUI},{text:'打篮球',color:C_VERB},{text:'。',color:C_PUNC}],
    pinyin:'Tāmen dōu huì dǎ lánqiú.',
    uz:"Ular hammasi basketbol o'ynay oladi.", ru:'Они все умеют играть в баскетбол.', en:'They can all play basketball.',
    note_uz:"都会 = hammasi qila oladi · 打篮球 (dǎ lánqiú) = basketbol o'ynash",
    note_ru:'都会 = все умеют · 打篮球 (dǎ lánqiú) = играть в баскетбол',
    note_en:'都会 = all can · 打篮球 (dǎ lánqiú) = to play basketball',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'说汉语',color:C_VERB},{text:'。',color:C_PUNC}], py:'Wǒ huì shuō Hànyǔ.', uz:'Men xitoy tilida gaplasha olaman.', ru:'Я могу говорить по-китайски.', en:'I can speak Chinese.' },
  { parts:[{text:'她',color:C_SUB},{text:'会',color:C_HUI},{text:'做饭',color:C_VERB},{text:'。',color:C_PUNC}], py:'Tā huì zuò fàn.', uz:'U ovqat pishira oladi.', ru:'Она умеет готовить.', en:'She can cook.' },
  { parts:[{text:'他',color:C_SUB},{text:'会',color:C_HUI},{text:'开车',color:C_VERB},{text:'。',color:C_PUNC}], py:'Tā huì kāi chē.', uz:'U mashina hayday oladi.', ru:'Он умеет водить.', en:'He can drive.' },
  { parts:[{text:'我们',color:C_SUB},{text:'都会',color:C_HUI},{text:'唱歌',color:C_VERB},{text:'。',color:C_PUNC}], py:'Wǒmen dōu huì chàng gē.', uz:"Biz hammamiz qo'shiq ayta olamiz.", ru:'Мы все умеем петь.', en:'We can all sing.' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'不会',color:C_NEG},{text:'游泳',color:C_VERB},{text:'。',color:C_PUNC}], py:'Wǒ bú huì yóuyǒng.', uz:'Men suzishni bilmayman.', ru:'Я не умею плавать.', en:'I cannot swim.' },
  { parts:[{text:'他',color:C_SUB},{text:'不会',color:C_NEG},{text:'说英语',color:C_VERB},{text:'。',color:C_PUNC}], py:'Tā bú huì shuō Yīngyǔ.', uz:'U ingliz tilida gaplasha olmaydi.', ru:'Он не умеет говорить по-английски.', en:'He cannot speak English.' },
  { parts:[{text:'我',color:C_SUB},{text:'不会',color:C_NEG},{text:'写汉字',color:C_VERB},{text:'。',color:C_PUNC}], py:'Wǒ bú huì xiě Hànzì.', uz:'Men xitoy harflarini yoza olmayman.', ru:'Я не умею писать иероглифы.', en:'I cannot write Chinese characters.' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'游泳',color:C_VERB},{text:'吗？',color:C_MA}], py:'Nǐ huì yóuyǒng ma?', uz:'Siz suzishni bilasizmi?', ru:'Вы умеете плавать?', en:'Can you swim?' },
  { parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'做饭',color:C_VERB},{text:'吗？',color:C_MA}], py:'Nǐ huì zuò fàn ma?', uz:'Siz ovqat pishira olasizmi?', ru:'Вы умеете готовить?', en:'Can you cook?' },
  { parts:[{text:'她',color:C_SUB},{text:'会',color:C_HUI},{text:'说汉语',color:C_VERB},{text:'吗？',color:C_MA}], py:'Tā huì shuō Hànyǔ ma?', uz:'U xitoy tilida gaplasha oladimi?', ru:'Она умеет говорить по-китайски?', en:'Can she speak Chinese?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'说汉语',color:C_VERB},{text:'吗？',color:C_MA}], py:'Nǐ huì shuō Hànyǔ ma?', uz:'Siz xitoy tilida gaplasha olasizmi?', ru:'Вы умеете говорить по-китайски?', en:'Can you speak Chinese?' },
  { s:'B', parts:[{text:'会，我',color:C_SUB},{text:'会',color:C_HUI},{text:'说一点儿。你',color:C_VERB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Huì, wǒ huì shuō yīdiǎnr. Nǐ ne?', uz:'Ha, biroz gaplasha olaman. Sizchi?', ru:'Да, могу немного. А вы?', en:'Yes, I can speak a little. And you?' },
  { s:'A', parts:[{text:'我也',color:C_SUB},{text:'会',color:C_HUI},{text:'说，但是我',color:C_VERB},{text:'不会',color:C_NEG},{text:'写汉字。',color:C_VERB}], py:'Wǒ yě huì shuō, dànshì wǒ bú huì xiě Hànzì.', uz:'Men ham gaplasha olaman, lekin xitoy harflarini yoza olmayman.', ru:'Я тоже могу говорить, но не умею писать иероглифы.', en:'I can also speak, but I cannot write Chinese characters.' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'写一点儿。',color:C_VERB}], py:'Wǒ huì xiě yīdiǎnr.', uz:'Men biroz yoza olaman.', ru:'Я немного умею писать.', en:'I can write a little.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'做饭',color:C_VERB},{text:'吗？',color:C_MA}], py:'Nǐ huì zuò fàn ma?', uz:'Siz ovqat pishira olasizmi?', ru:'Вы умеете готовить?', en:'Can you cook?' },
  { s:'B', parts:[{text:'会，我',color:C_SUB},{text:'会',color:C_HUI},{text:'做中国菜。',color:C_VERB}], py:'Huì, wǒ huì zuò Zhōngguó cài.', uz:'Ha, men xitoy taomlarini pishira olaman.', ru:'Да, я умею готовить китайскую еду.', en:'Yes, I can cook Chinese food.' },
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'做饺子',color:C_VERB},{text:'吗？',color:C_MA}], py:'Nǐ huì zuò jiǎozi ma?', uz:'Siz chuchvara qila olasizmi?', ru:'Вы умеете лепить пельмени?', en:'Can you make dumplings?' },
  { s:'B', parts:[{text:'不会，我',color:C_SUB},{text:'不会',color:C_NEG},{text:'做饺子。',color:C_VERB}], py:'Bú huì, wǒ bú huì zuò jiǎozi.', uz:'Bilmayman, men chuchvara qila olmayman.', ru:'Не умею, я не умею лепить пельмени.', en:'No, I cannot make dumplings.' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'做！我教你。',color:C_VERB}], py:'Wǒ huì zuò! Wǒ jiāo nǐ.', uz:"Men qila olaman! O'rgataman.", ru:'Я умею! Научу вас.', en:'I can make them! I\'ll teach you.' },
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

export function GrammarHuiPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('hui');
    if (existing === undefined || newStars > existing) saveStars('hui', newStars);
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
      <div className="dr-hero" style={{ background:'linear-gradient(135deg, #4338ca, #3730a3)' }}>
        <div className="dr-hero__watermark">会</div>
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
          <h1 className="dr-hero__title">会</h1>
          <div className="dr-hero__pinyin">huì</div>
          <div className="dr-hero__translation">
            — {t('qila olmoq','уметь','can / be able to')} —
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grammar-page__tabs" style={{ background:'linear-gradient(180deg, #3730a3 0%, #312e81 100%)' }}>
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
              <div className="grammar-block__label">{t('Asosiy so\'z','Ключевое слово','Key Word')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char" style={{ color:C_HUI }}>会</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">huì</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('4-ton (tushuvchi) ↘','4-й тон (нисходящий) ↘','4th tone (falling) ↘')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Штрихов','Strokes')}</span>
                    <span className="grammar-block__info-val">6</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('qila olmoq, uddalay olmoq','уметь, мочь','can, be able to')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 会 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('会 nima?','Что такое 会?','What is 会?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_HUI }}>会</strong> = <strong>{t('qila olmoq','уметь','can / be able to')}</strong>
                <br />
                {t(
                  "O'rganib olingan mahorat uchun ishlatiladi. Modal fe'l — har doim fe'ldan oldin turadi. O'zbek tilidagi «…a olmoq» ga to'g'ri keladi.",
                  "Используется для приобретённых навыков. Модальный глагол — всегда стоит перед глаголом. Соответствует русскому «уметь».",
                  'Used for learned/acquired skills. A modal verb — always placed before the main verb. Corresponds to English "can" (ability).',
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:12, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio('我会说汉语。');}} style={{background:'#e0e7ff'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_HUI}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{ fontSize:14 }}>我<strong style={{color:C_HUI}}>会</strong>说汉语。— {t('Men xitoy tilida gaplasha olaman.','Я могу говорить по-китайски.','I can speak Chinese.')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio('我不会游泳。');}} style={{background:'#e0e7ff'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_HUI}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{ fontSize:14 }}>我<strong style={{color:C_NEG}}>不会</strong>游泳。— {t('Men suzishni bilmayman.','Я не умею плавать.','I cannot swim.')}</span>
                </div>
              </div>
            </div>

            {/* 会 vs 能 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('会 va 能 — farqi','会 и 能 — разница','会 vs 能 — Difference')}</div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <div style={{ flex:1, textAlign:'center', background:'#e0e7ff', border:'2px solid #4338ca', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:28, color:C_HUI, fontWeight:700, marginBottom:2 }}>会</div>
                  <div style={{ fontSize:10, color:C_HUI, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('MAHORAT','НАВЫК','SKILL')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t("O'rganilgan ko'nikma\nsuzish, haydash, gapirish","Приобретённый навык\nплавать, водить, говорить","Learned ability\nswim, drive, speak")}</div>
                  <div style={{ fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' }}>我会游泳。</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#fff7ed', border:'2px solid #ea580c', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:28, color:'#ea580c', fontWeight:700, marginBottom:2 }}>能</div>
                  <div style={{ fontSize:10, color:'#ea580c', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('IMKON','ВОЗМОЖНОСТЬ','ABILITY')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t("Jismoniy imkoniyat,\nruxsat, sharoit","Физическая возможность,\nразрешение, условие","Physical ability,\npermission, condition")}</div>
                  <div style={{ fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' }}>我能游泳。</div>
                </div>
              </div>
              <div style={{ background:'#fffbeb', borderRadius:6, padding:8, fontSize:11, color:'#92400e', lineHeight:1.7 }}>
                💡 {t(
                  "会游泳 = suzishni bilaman (mahorat). 能游泳 = hozir suzishim mumkin (sharoit). 能 keyingi darslarda o'rganiladi.",
                  "会游泳 = умею плавать (навык). 能游泳 = могу плавать сейчас (условие). 能 будет в следующих уроках.",
                  '会游泳 = know how to swim (skill). 能游泳 = can swim right now (condition). 能 will be covered in later lessons.',
                )}
              </div>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "会 har doim fe'ldan oldin turadi. O'zbek tilidagi «…a olmoq» ga to'g'ri keladi. Inkor uchun 不会 ishlatiladi:",
                  "会 всегда ставится перед глаголом. Соответствует «уметь» в русском. Для отрицания — 不会:",
                  '会 always comes before the main verb. It means "can" (learned ability). For negation, use 不会:',
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Tasdiq','Утверждение','Affirmative')}</div>
                  <div className="grammar-block__usage-py">Wǒ huì shuō.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'说。',color:C_VERB}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Gaplasha olaman.','Умею говорить.','I can speak.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>↔</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_NEG }}>{t('Inkor','Отрицание','Negative')}</div>
                  <div className="grammar-block__usage-py">Wǒ bú huì shuō.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'我',color:C_SUB},{text:'不会',color:C_NEG},{text:'说。',color:C_VERB}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Gaplasha olmayman.','Не умею говорить.','I cannot speak.')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "不 toni o'zgaradi: 不 (bù) + 会 (huì) = bú huì (4-ton oldida 2-tonga o'tadi)",
                  "Тон 不 меняется: 不 (bù) + 会 (huì) = bú huì (перед 4-м тоном → 2-й тон)",
                  'The tone of 不 changes: 不 (bù) + 会 (huì) = bú huì (before 4th tone → becomes 2nd tone)',
                )}
              </p>
            </div>

            {/* Verb list */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("会 bilan ko'p ishlatiladigan fe'llar","Глаголы, часто используемые с 会","Verbs commonly used with 会")}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {[
                  { zh:'说', py:'shuō', uz:'gapirmoq', ru:'говорить', en:'to speak' },
                  { zh:'写', py:'xiě',  uz:'yozmoq',   ru:'писать',   en:'to write' },
                  { zh:'游泳', py:'yóuyǒng', uz:'suzmoq', ru:'плавать', en:'to swim' },
                  { zh:'做饭', py:'zuò fàn', uz:'ovqat pishirmoq', ru:'готовить', en:'to cook' },
                  { zh:'开车', py:'kāi chē', uz:'mashina haydamoq', ru:'водить машину', en:'to drive' },
                  { zh:'唱歌', py:'chàng gē', uz:"qo'shiq aytmoq", ru:'петь', en:'to sing' },
                ].map((v, i) => (
                  <div key={i} role="button" tabIndex={0} onClick={() => playGrammarAudio('会' + v.zh)}
                    style={{ background:'#e0e7ff', borderRadius:8, padding:'8px 10px', cursor:'pointer', userSelect:'none', border:'1px solid #a5b4fc' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:C_HUI }}>会{v.zh}</div>
                    <div style={{ fontSize:10, color:'#6366f1' }}>huì {v.py}</div>
                    <div style={{ fontSize:10, color:'#888', marginTop:2 }}>{t(v.uz, v.ru, v.en)}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__hint" style={{ textAlign:'center', marginTop:8 }}>
                {t('Bosing — eshiting','Нажмите — послушайте','Tap — listen')}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim?)',             ru:'Подлежащее (кто?)',   en:'Subject (who?)' },
                  { color:C_HUI,  uz:'会 (qila olmoq)',        ru:'会 (уметь)',           en:'会 (can/able to)' },
                  { color:C_NEG,  uz:'不会 (qila olmaydi)',     ru:'不会 (не уметь)',      en:'不会 (cannot)' },
                  { color:C_VERB, uz:"Fe'l / Xabar",           ru:'Глагол / Сообщение',  en:'Verb / Message' },
                  { color:C_MA,   uz:'吗 (savol)',              ru:'吗 (вопрос)',          en:'吗 (question)' },
                  { color:C_NE,   uz:'呢 (…chi?)',              ru:'呢 (…а вы?)',          en:'呢 (…and you?)' },
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
            {/* Pattern 1 — 会 + Fe'l (tasdiq) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("1-shablon — 会 + Fe'l (tasdiq)",'Шаблон 1 — 会 + Глагол (утверждение)','Pattern 1 — 会 + Verb (affirmative)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_HUI, fontWeight:700 }}>会</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>{t("Fe'l","Глагол","Verb")}</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Bila olaman / uddalay olaman","Умею / могу","Can / am able to")}
              </p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 2 — 不会 + Fe'l (inkor) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("2-shablon — 不会 + Fe'l (inkor)",'Шаблон 2 — 不会 + Глагол (отрицание)','Pattern 2 — 不会 + Verb (negative)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_NEG, fontWeight:700 }}>不会</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>{t("Fe'l","Глагол","Verb")}</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Bila olmayman","Не умею","Cannot")}</p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  "不会 = qila olmayman. 不 toni o'zgaradi: 不 (bù) + 会 (huì) = bú huì (4-ton oldida 2-tonga o'tadi)",
                  "不会 = не умею. Тон 不 меняется: 不 (bù) + 会 (huì) = bú huì (перед 4-м тоном → 2-й тон)",
                  'не会 = cannot. Tone of 不 changes: 不 (bù) + 会 (huì) = bú huì (before 4th tone → becomes 2nd tone)',
                )}
              </p>
            </div>

            {/* Pattern 3 — 会…吗？ (savol) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — 会…吗？ (savol)','Шаблон 3 — 会…吗？ (вопрос)','Pattern 3 — 会…吗？ (question)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_HUI, fontWeight:700 }}>会</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>{t("Fe'l","Глагол","Verb")}</span>
                {' '}
                <span style={{ color:C_MA, fontWeight:700 }}>吗</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Bila olasizmi? — ha/yo'q javobi kutiladi","Умеете ли? — ожидается ответ да/нет","Can you...? — yes/no answer expected")}
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
                  "Qisqa javob: 会。= Ha, qila olaman. 不会。= Yo'q, qila olmayman.",
                  "Краткий ответ: 会。= Да, умею. 不会。= Нет, не умею.",
                  'Short answer: 会。= Yes, I can. 不会。= No, I cannot.',
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
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#e0e7ff'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_HUI}><path d="M8 5v14l11-7z"/></svg>
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
              <div className="grammar-block__label">{t('Dialog 1 — Til bilish haqida','Диалог 1 — О знании языков','Dialogue 1 — About Language Skills')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#e0e7ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_HUI:'#dc2626',flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Ovqat pishirish haqida','Диалог 2 — О готовке','Dialogue 2 — About Cooking')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#e0e7ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_HUI:'#dc2626',flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
                  parts:[{text:'我',color:C_SUB},{text:'会',color:C_HUI},{text:'说汉语',color:C_VERB},{text:'。',color:C_PUNC}],
                  note: t("会 + fe'l = qila olaman","会 + глагол = умею","会 + verb = I can"),
                },
                {
                  parts:[{text:'我',color:C_SUB},{text:'不会',color:C_NEG},{text:'游泳',color:C_VERB},{text:'。',color:C_PUNC}],
                  note: t("不会 + fe'l = qila olmayman","不会 + глагол = не умею","不会 + verb = I cannot"),
                },
                {
                  parts:[{text:'你',color:C_SUB},{text:'会',color:C_HUI},{text:'做饭',color:C_VERB},{text:'吗？',color:C_MA}],
                  note: t("会…吗？ = qila olasizmi?","会…吗？ = умеете ли?","会…吗？ = can you...?"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #4338ca', background:'#e0e7ff' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#312e81' }}>
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
            accentColor="#4338ca"
            accentBg="#e0e7ff"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
