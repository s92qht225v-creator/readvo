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
const C_ZM   = '#0f766e'; // 怎么 (teal)
const C_VERB = '#dc2626'; // Verb / Fe'l (red)
const C_OBJ  = '#888';    // Object / Punctuation
const C_SM   = '#7c3aed'; // 什么 (purple, for comparison)
const C_VERB2= '#1d4ed8'; // Secondary verb (blue)
const C_PUNC = '#888';

const speakingQuestionsData = [
  { uz: 'Bu qanday o\'qiladi?', ru: 'Как это читается?', en: 'How do you read this?', zh: '这个怎么读？', pinyin: 'Zhège zěnme dú?' },
  { uz: 'Bu qanday yoziladi?', ru: 'Как это пишется?', en: 'How do you write this?', zh: '这个怎么写？', pinyin: 'Zhège zěnme xiě?' },
  { uz: 'Bu qanday aytiladi?', ru: 'Как это сказать?', en: 'How do you say this?', zh: '这个怎么说？', pinyin: 'Zhège zěnme shuō?' },
  { uz: 'Siz maktabga qanday borasiz?', ru: 'Как вы едете в школу?', en: 'How do you go to school?', zh: '你怎么去学校？', pinyin: 'Nǐ zěnme qù xuéxiào?' },
  { uz: 'Bu qanday qilinadi?', ru: 'Как это делается?', en: 'How is this done?', zh: '这个怎么做？', pinyin: 'Zhège zěnme zuò?' },
  { uz: 'Siz kasalxonaga qanday borasiz?', ru: 'Как вы едете в больницу?', en: 'How do you get to the hospital?', zh: '你怎么去医院？', pinyin: 'Nǐ zěnme qù yīyuàn?' },
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
    parts: [{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}],
    pinyin:'Zhège zěnme dú?', uz:'Bu qanday o\'qiladi?', ru:'Как это читается?', en:'How do you read this?',
    note_uz:'读 (dú) = o\'qimoq · 这个 = bu · 怎么读 = qanday o\'qiladi?',
    note_ru:'读 (dú) = читать · 这个 = это · 怎么读 = как читается?',
    note_en:'读 (dú) = to read · 这个 = this · 怎么读 = how to read?',
  },
  {
    parts: [{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'写',color:C_VERB},{text:'？',color:C_PUNC}],
    pinyin:'Zhège zěnme xiě?', uz:'Bu qanday yoziladi?', ru:'Как это пишется?', en:'How do you write this?',
    note_uz:'写 (xiě) = yozmoq · 怎么写 = qanday yoziladi?',
    note_ru:'写 (xiě) = писать · 怎么写 = как пишется?',
    note_en:'写 (xiě) = to write · 怎么写 = how to write?',
  },
  {
    parts: [{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'说',color:C_VERB},{text:'？',color:C_PUNC}],
    pinyin:'Zhège zěnme shuō?', uz:'Bu qanday aytiladi?', ru:'Как это сказать?', en:'How do you say this?',
    note_uz:'说 (shuō) = gapirmoq · 怎么说 = qanday aytiladi?',
    note_ru:'说 (shuō) = говорить · 怎么说 = как сказать?',
    note_en:'说 (shuō) = to say/speak · 怎么说 = how to say?',
  },
  {
    parts: [{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'学校？',color:C_OBJ}],
    pinyin:'Nǐ zěnme qù xuéxiào?', uz:'Siz maktabga qanday borasiz?', ru:'Как вы едете в школу?', en:'How do you go to school?',
    note_uz:'去 (qù) = bormoq · 学校 (xuéxiào) = maktab',
    note_ru:'去 (qù) = идти/ехать · 学校 (xuéxiào) = школа',
    note_en:'去 (qù) = to go · 学校 (xuéxiào) = school',
  },
  {
    parts: [{text:'这个字',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}],
    pinyin:'Zhège zì zěnme dú?', uz:'Bu belgi qanday o\'qiladi?', ru:'Как читается этот иероглиф?', en:'How do you read this character?',
    note_uz:'字 (zì) = ieroglif, belgi · 怎么读 = qanday o\'qiladi?',
    note_ru:'字 (zì) = иероглиф, знак · 怎么读 = как читается?',
    note_en:'字 (zì) = character, symbol · 怎么读 = how to read?',
  },
  {
    parts: [{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'医院？',color:C_OBJ}],
    pinyin:'Nǐ zěnme qù yīyuàn?', uz:'Siz kasalxonaga qanday borasiz?', ru:'Как вы едете в больницу?', en:'How do you get to the hospital?',
    note_uz:'医院 (yīyuàn) = kasalxona · 怎么去 = qanday borish',
    note_ru:'医院 (yīyuàn) = больница · 怎么去 = как добраться',
    note_en:'医院 (yīyuàn) = hospital · 怎么去 = how to get there',
  },
  {
    parts: [{text:'你',color:C_SUB},{text:'叫',color:C_VERB2},{text:'什么',color:C_SM},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ jiào shénme?', uz:'Ismingiz nima?', ru:'Как вас зовут?', en:'What is your name?',
    note_uz:'Taqqoslash: 什么 = nima (narsa/ism) — 怎么 emas',
    note_ru:'Сравнение: 什么 = что (предмет/имя) — не 怎么',
    note_en:'Comparison: 什么 = what (thing/name) — not 怎么',
  },
  {
    parts: [{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'做',color:C_VERB},{text:'？',color:C_PUNC}],
    pinyin:'Zhège zěnme zuò?', uz:'Bu qanday qilinadi?', ru:'Как это делается?', en:'How is this done?',
    note_uz:'做 (zuò) = qilmoq · 怎么做 = qanday qilinadi?',
    note_ru:'做 (zuò) = делать · 怎么做 = как делается?',
    note_en:'做 (zuò) = to do/make · 怎么做 = how to do?',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

// Pattern 1: 怎么读/写/说 (pronunciation/literacy)
const pattern1Rows: PatternRow[] = [
  { parts:[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}],  py:'Zhège zěnme dú?',   uz:'Bu qanday o\'qiladi?',  ru:'Как это читается?',  en:'How do you read this?' },
  { parts:[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'写',color:C_VERB},{text:'？',color:C_PUNC}],  py:'Zhège zěnme xiě?',  uz:'Bu qanday yoziladi?',   ru:'Как это пишется?',   en:'How do you write this?' },
  { parts:[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'说',color:C_VERB},{text:'？',color:C_PUNC}],  py:'Zhège zěnme shuō?', uz:'Bu qanday aytiladi?',    ru:'Как это сказать?',   en:'How do you say this?' },
];

// Pattern 2: 怎么去 (transport/directions)
const pattern2Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'学校？',color:C_OBJ}],    py:'Nǐ zěnme qù xuéxiào?',   uz:'Siz maktabga qanday borasiz?',      ru:'Как вы едете в школу?',     en:'How do you go to school?' },
  { parts:[{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'医院？',color:C_OBJ}],    py:'Nǐ zěnme qù yīyuàn?',   uz:'Siz kasalxonaga qanday borasiz?',   ru:'Как вы едете в больницу?',  en:'How do you get to the hospital?' },
  { parts:[{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'商店？',color:C_OBJ}],    py:'Nǐ zěnme qù shāngdiàn?', uz:'Siz do\'konga qanday borasiz?',     ru:'Как вы едете в магазин?',   en:'How do you get to the store?' },
];

// Pattern 3: 怎么做 (method)
const pattern3Rows: PatternRow[] = [
  { parts:[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'做',color:C_VERB},{text:'？',color:C_PUNC}],  py:'Zhège zěnme zuò?', uz:'Bu qanday qilinadi?', ru:'Как это делается?', en:'How is this done?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}],
    py:'Zhège zěnme dú?', uz:'Bu qanday o\'qiladi?', ru:'Как это читается?', en:'How do you read this?' },
  { s:'B', parts:[{text:'这个',color:C_SUB},{text:'读',color:C_VERB},{text:'"学"',color:C_ZM},{text:'。',color:C_PUNC}],
    py:'Zhège dú "xué".', uz:'Bu "xué" deb o\'qiladi.', ru:'Это читается "xué".', en:'This reads as "xué".' },
  { s:'A', parts:[{text:'这个字',color:C_SUB},{text:'怎么',color:C_ZM},{text:'写',color:C_VERB},{text:'？',color:C_PUNC}],
    py:'Zhège zì zěnme xiě?', uz:'Bu ieroglif qanday yoziladi?', ru:'Как пишется этот иероглиф?', en:'How do you write this character?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'写',color:C_VERB},{text:'，你',color:C_SUB},{text:'看',color:C_VERB2},{text:'。',color:C_PUNC}],
    py:'Wǒ xiě, nǐ kàn.', uz:'Men yozaman, siz qarang.', ru:'Я напишу, вы смотрите.', en:'I\'ll write, you look.' },
  { s:'A', parts:[{text:'谢谢！',color:C_SUB}],
    py:'Xièxie!', uz:'Rahmat!', ru:'Спасибо!', en:'Thanks!' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'学校？',color:C_OBJ}],
    py:'Nǐ zěnme qù xuéxiào?', uz:'Siz maktabga qanday borasiz?', ru:'Как вы едете в школу?', en:'How do you go to school?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'坐',color:C_VERB2},{text:'车',color:C_OBJ},{text:'去。',color:C_VERB},{text:'你',color:C_SUB},{text:'呢',color:C_SM},{text:'？',color:C_PUNC}],
    py:'Wǒ zuò chē qù. Nǐ ne?', uz:'Men mashinada boraman. Sizchi?', ru:'Я еду на машине. А вы?', en:'I go by car. And you?' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'也',color:C_SM},{text:'坐',color:C_VERB2},{text:'车',color:C_OBJ},{text:'去。',color:C_VERB}],
    py:'Wǒ yě zuò chē qù.', uz:'Men ham mashinada boraman.', ru:'Я тоже еду на машине.', en:'I also go by car.' },
  { s:'B', parts:[{text:'好',color:C_SUB},{text:'，',color:C_PUNC},{text:'我们',color:C_SUB},{text:'一起',color:C_VERB2},{text:'去',color:C_VERB},{text:'！',color:C_PUNC}],
    py:'Hǎo, wǒmen yìqǐ qù!', uz:'Yaxshi, birga boramiz!', ru:'Хорошо, поедем вместе!', en:'Great, let\'s go together!' },
];

function ColorParts({ parts }: { parts: Part[] }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'baseline', gap:2 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.color, fontWeight: p.color === C_PUNC || p.color === C_OBJ ? 400 : 600 }}>
          {p.text}
        </span>
      ))}
    </span>
  );
}

export function GrammarZenmePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('zenme');
    if (existing === undefined || newStars > existing) saveStars('zenme', newStars);
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
      <div className="dr-hero" style={{ background:'linear-gradient(135deg, #0f766e, #0d9488)' }}>
        <div className="dr-hero__watermark">怎么</div>
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
          <h1 className="dr-hero__title">怎么</h1>
          <div className="dr-hero__pinyin">zěnme</div>
          <div className="dr-hero__translation">
            — {t('qanday? / qanday qilib?', 'как? / каким образом?', 'how? / in what way?')} —
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grammar-page__tabs" style={{ background:'linear-gradient(180deg,#0d9488 0%,#0f766e 100%)' }}>
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
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Ieroglif','Иероглиф','Character')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char" style={{ background:`linear-gradient(135deg,${C_ZM},#2dd4bf)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>怎么</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">zěnme</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('怎 3-ton · 么 yengil ton','怎 3-й тон · 么 лёгкий тон','怎 3rd tone · 么 neutral tone')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('qanday, qanday qilib','как, каким образом','how, in what way')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('怎 9 ta · 么 3 ta','怎 9 · 么 3','怎 9 · 么 3')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What it is */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('怎么 nima?','怎么 — что это?','What is 怎么?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color: C_ZM }}>怎么</strong> = <strong>{t('qanday','как','how')}</strong><br />
                {t(
                  'Usul yoki yo\'l haqida savol beradi. Har doim fe\'ldan oldin turadi.',
                  'Спрашивает о способе или методе. Всегда стоит перед глаголом.',
                  'Asks about method or manner. Always placed before the verb.',
                )}
              </p>
            </div>

            {/* How it works */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  '怎么 har doim fe\'ldan oldin turadi. So\'raladigan fe\'l o\'rniga qo\'yiladi:',
                  '怎么 всегда стоит перед глаголом. Задаёт вопрос о способе действия:',
                  '怎么 always goes before the verb. It asks about the manner of doing something:',
                )}
              </p>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-py">Zhège zěnme dú?</div>
                <div className="grammar-block__usage-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onClick={()=>playGrammarAudio('这个怎么读？')} style={{background:'#ccfbf1'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_ZM}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <ColorParts parts={[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('Bu qanday o\'qiladi?','Как это читается?','How do you read this?')}</div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-py">Nǐ zěnme qù xuéxiào?</div>
                <div className="grammar-block__usage-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onClick={()=>playGrammarAudio('你怎么去学校？')} style={{background:'#ccfbf1'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_ZM}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <ColorParts parts={[{text:'你',color:C_SUB},{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:'学校？',color:C_OBJ}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('Siz maktabga qanday borasiz?','Как вы едете в школу?','How do you go to school?')}</div>
              </div>
            </div>

            {/* 怎么 vs 什么 */}
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('怎么 va 什么 — farqi','怎么 и 什么 — разница','怎么 vs 什么 — difference')}</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, background:'#ccfbf1', borderRadius:8, padding:12, border:'1px solid #5eead4', textAlign:'center' }}>
                  <div style={{ fontSize:30, color:C_ZM, fontWeight:700, marginBottom:2 }}>怎么</div>
                  <div style={{ fontSize:10, color:C_ZM, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('QANDAY','КАК','HOW')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('Usul yoki yo\'l\nhaqida savol','Способ или метод\nдействия','Manner or method\nof doing')}</div>
                </div>
                <div style={{ flex:1, background:'#f5f3ff', borderRadius:8, padding:12, border:'1px solid #e9d5ff', textAlign:'center' }}>
                  <div style={{ fontSize:30, color:C_SM, fontWeight:700, marginBottom:2 }}>什么</div>
                  <div style={{ fontSize:10, color:C_SM, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('NIMA','ЧТО','WHAT')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('Narsa yoki ism\nhaqida savol','Предмет или название','Thing or name')}</div>
                </div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh"><ColorParts parts={[{text:'这个',color:C_SUB},{text:'怎么',color:C_ZM},{text:'读',color:C_VERB},{text:'？',color:C_PUNC}]} /></div>
                <div className="grammar-block__usage-tr">{t('Bu qanday o\'qiladi? (usul)','Как это читается? (способ)','How do you read this? (manner)')}</div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh"><ColorParts parts={[{text:'这个',color:C_SUB},{text:'是',color:C_VERB2},{text:'什么',color:C_SM},{text:'？',color:C_PUNC}]} /></div>
                <div className="grammar-block__usage-tr">{t('Bu nima? (narsa)','Что это? (предмет)','What is this? (thing)')}</div>
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color: C_SUB,   uz:'Ega / Mavzu',         ru:'Подлежащее / Тема',    en:'Subject / Topic' },
                  { color: C_ZM,    uz:'怎么 (qanday?)',       ru:'怎么 (как?)',            en:'怎么 (how?)' },
                  { color: C_VERB,  uz:'Fe\'l (asosiy)',       ru:'Глагол (основной)',     en:'Verb (main)' },
                  { color: C_SM,    uz:'什么 (nima?)',          ru:'什么 (что?)',             en:'什么 (what?)' },
                  { color: C_VERB2, uz:'Fe\'l (boshqa)',       ru:'Глагол (другой)',       en:'Verb (other)' },
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
            {/* Pattern 1: 怎么读/写/说 */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('1-shablon — Talaffuz (怎么读/写/说)','Шаблон 1 — Произношение (怎么读/写/说)','Pattern 1 — Pronunciation (怎么读/写/说)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Mavzu','Тема','Topic')}</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#ccfbf1', color:C_ZM }}>怎么</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>读/写/说</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Qanday o\'qiladi / yoziladi / aytiladi?','Как читается / пишется / произносится?','How to read / write / say?')}</p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  'Til o\'rganishda eng ko\'p ishlatiladigan 怎么 shakllari. Yangi so\'z yoki harf ko\'rganingizda shu savollarni bering.',
                  'Самые частые формы 怎么 при изучении языка. Используйте их, встретив новое слово или иероглиф.',
                  'The most common 怎么 forms in language learning. Use them when you encounter a new word or character.',
                )}
              </p>
            </div>

            {/* Pattern 2: 怎么去 */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('2-shablon — Yo\'l (怎么去)','Шаблон 2 — Направление (怎么去)','Pattern 2 — Directions (怎么去)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлежащее','Subject')}</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#ccfbf1', color:C_ZM }}>怎么</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>去</span>
                {' '}
                <span style={{ color:C_OBJ }}>{t('Joy','Место','Place')}</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Qanday borasiz? — transport yoki yo\'l usuli','Как добраться? — транспорт или маршрут','How to get there? — transport or route')}</p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  'Javob: 我坐车去。(Mashinada boraman.) · 去 = bormoq · 坐车 = mashinada',
                  'Ответ: 我坐车去。(Еду на машине.) · 去 = идти/ехать · 坐车 = на машине',
                  'Answer: 我坐车去。(I go by car.) · 去 = to go · 坐车 = by car',
                )}
              </p>
            </div>

            {/* Pattern 3: 怎么做 */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('3-shablon — Usul (怎么做)','Шаблон 3 — Способ (怎么做)','Pattern 3 — Method (怎么做)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Mavzu','Тема','Topic')}</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#ccfbf1', color:C_ZM }}>怎么</span>
                {' '}
                <span style={{ color:C_VERB, fontWeight:700 }}>做</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Qanday qilinadi?','Как делается?','How is it done?')}</p>
              {pattern3Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MISOLLAR ── */}
        {activeTab === 'examples' && (
          <div className="grammar-block">
            <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
            {examples.map((ex, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#ccfbf1'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_ZM}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{flex:1}}><ColorParts parts={ex.parts} /></span>
                </div>
                <div className="grammar-block__example-py">{ex.pinyin}</div>
                <div className="grammar-block__example-tr">{t(ex.uz, ex.ru, ex.en)}</div>
                {expandedEx === i && (
                  <div className="grammar-block__example-note">
                    💡 {t(ex.note_uz, ex.note_ru, ex.note_en)}
                  </div>
                )}
              </div>
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
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Dialog 1 — Xitoy harflari','Диалог 1 — Китайские иероглифы','Dialogue 1 — Chinese Characters')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#f0fdfa' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_ZM:C_VERB,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Dialog 2 — Maktabga qanday borasiz?','Диалог 2 — Как едете в школу?','Dialogue 2 — How do you go to school?')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#f0fdfa' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_ZM:C_VERB,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label" style={{ color:C_ZM }}>{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts: [{text:'怎么',color:C_ZM},{text:' + fe\'l',color:C_VERB}],
                  note: t('怎么 + fe\'l = qanday + fe\'l qilinadi?','怎么 + глагол = как делается?','怎么 + verb = how to do?'),
                  ok: true,
                },
                {
                  parts: [{text:'怎么',color:C_ZM},{text:'去',color:C_VERB},{text:' = qanday borish',color:C_OBJ}],
                  note: t('怎么去 = qanday borasiz? (yo\'l/transport)','怎么去 = как добраться? (маршрут/транспорт)','怎么去 = how to get there? (route/transport)'),
                  ok: true,
                },
                {
                  parts: [{text:'怎么',color:C_ZM},{text:'做',color:C_VERB},{text:' = qanday qilish',color:C_OBJ}],
                  note: t('怎么做 = qanday qilinadi?','怎么做 = как делается?','怎么做 = how is it done?'),
                  ok: true,
                },
                {
                  parts: [{text:'怎么',color:C_ZM},{text:' ≠ ',color:C_PUNC},{text:'什么',color:C_SM}],
                  note: t('怎么 = qanday (usul), 什么 = nima (narsa/ism)','怎么 = как (способ), 什么 = что (предмет/имя)','怎么 = how (manner), 什么 = what (thing/name)'),
                  ok: true,
                },
              ] as { parts: Part[]; note: string; ok: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:`3px solid ${C_ZM}`, background:'#f0fdfa' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#0f766e' }}>
                    {item.note}
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
            accentColor="#0f766e"
            accentBg="#ccfbf1"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
