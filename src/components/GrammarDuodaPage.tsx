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
const C_AGE  = '#0369a1'; // 多大 / 岁 (sky-700 — featured)
const C_JI   = '#059669'; // 几岁 (emerald — children)
const C_VERB = '#1d4ed8'; // Verb
const C_NE   = '#7c3aed'; // 呢
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'Siz necha yoshdasiz?', ru: 'Сколько вам лет?', en: 'How old are you?', zh: '你多大？', pinyin: 'Nǐ duō dà?' },
  { uz: 'Onangiz necha yoshda?', ru: 'Сколько лет вашей маме?', en: 'How old is your mother?', zh: '你妈妈多大？', pinyin: 'Nǐ māma duō dà?' },
  { uz: 'Bu yil siz necha yoshdasiz?', ru: 'Сколько вам лет в этом году?', en: 'How old are you this year?', zh: '你今年多大？', pinyin: 'Nǐ jīnnián duō dà?' },
  { uz: 'Men yigirma besh yoshdaman.', ru: 'Мне двадцать пять лет.', en: 'I am twenty-five years old.', zh: '我二十五岁。', pinyin: 'Wǒ èrshíwǔ suì.' },
  { uz: 'Ukangiz necha yoshda?', ru: 'Сколько лет вашему брату?', en: 'How old is your brother?', zh: '你弟弟几岁？', pinyin: 'Nǐ dìdi jǐ suì?' },
  { uz: 'U ellik yoshda.', ru: 'Ей пятьдесят лет.', en: 'She is fifty years old.', zh: '她五十岁。', pinyin: 'Tā wǔshí suì.' },
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
    parts:[{text:'你',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ duō dà?',
    uz:'Siz necha yoshdasiz?',              ru:'Сколько вам лет?',                en:'How old are you?',
    note_uz:'多大 (duō dà) = necha yosh? · kattalar yoshini so\'rash',
    note_ru:'多大 (duō dà) = сколько лет? · для взрослых',
    note_en:'多大 (duō dà) = how old? · used for adults',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'二十岁',color:C_AGE},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ èrshí suì.',
    uz:'Men yigirma yoshdaman.',            ru:'Мне двадцать лет.',               en:'I am twenty years old.',
    note_uz:'岁 (suì) = yosh · raqam + 岁 = necha yoshda',
    note_ru:'岁 (suì) = лет · число + 岁 = возраст',
    note_en:'岁 (suì) = years old · number + 岁 = age',
  },
  {
    parts:[{text:'他',color:C_SUB},{text:'三十五岁',color:C_AGE},{text:'。',color:C_PUNC}],
    pinyin:'Tā sānshíwǔ suì.',
    uz:'U o\'ttiz besh yoshda.',            ru:'Ему тридцать пять лет.',          en:'He is thirty-five years old.',
    note_uz:'三十五岁 = o\'ttiz besh yosh',
    note_ru:'三十五岁 = тридцать пять лет',
    note_en:'三十五岁 = thirty-five years old',
  },
  {
    parts:[{text:'我妈妈',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ māma duō dà?',
    uz:'Onam necha yoshda?',                ru:'Сколько лет моей маме?',          en:'How old is my mom?',
    note_uz:'妈妈 (māma) = ona · 多大 = necha yoshda?',
    note_ru:'妈妈 (māma) = мама · 多大 = сколько лет?',
    note_en:'妈妈 (māma) = mom · 多大 = how old?',
  },
  {
    parts:[{text:'你今年',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ jīnnián duō dà?',
    uz:'Bu yil siz necha yoshdasiz?',       ru:'Сколько вам лет в этом году?',    en:'How old are you this year?',
    note_uz:'今年 (jīnnián) = bu yil',
    note_ru:'今年 (jīnnián) = в этом году',
    note_en:'今年 (jīnnián) = this year',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'今年二十八岁',color:C_AGE},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ jīnnián èrshíbā suì.',
    uz:'Men bu yil yigirma sakkiz yoshdaman.',  ru:'В этом году мне двадцать восемь.', en:'I am twenty-eight this year.',
    note_uz:'今年 + raqam + 岁 = bu yil necha yoshga to\'ldim',
    note_ru:'今年 + число + 岁 = в этом году сколько лет',
    note_en:'今年 + number + 岁 = age this year',
  },
  {
    parts:[{text:'你弟弟',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ dìdi jǐ suì?',
    uz:'Ukangiz necha yoshda?',              ru:'Сколько лет вашему брату?',       en:'How old is your younger brother?',
    note_uz:'几岁 (jǐ suì) = necha yosh (bolalar uchun) · 多大 kattalar uchun',
    note_ru:'几岁 (jǐ suì) = сколько лет (для детей) · 多大 для взрослых',
    note_en:'几岁 (jǐ suì) = how old (for children) · 多大 for adults',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ duō dà?', uz:'Siz necha yoshdasiz?', ru:'Сколько вам лет?', en:'How old are you?' },
  { parts:[{text:'你妈妈',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ māma duō dà?', uz:'Onangiz necha yoshda?', ru:'Сколько лет вашей маме?', en:'How old is your mother?' },
  { parts:[{text:'你今年',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ jīnnián duō dà?', uz:'Bu yil siz necha yoshdasiz?', ru:'Сколько вам лет в этом году?', en:'How old are you this year?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'二十岁',color:C_AGE},{text:'。',color:C_PUNC}], py:'Wǒ èrshí suì.', uz:'Men yigirma yoshdaman.', ru:'Мне двадцать лет.', en:'I am twenty years old.' },
  { parts:[{text:'我今年',color:C_SUB},{text:'三十岁',color:C_AGE},{text:'。',color:C_PUNC}], py:'Wǒ jīnnián sānshí suì.', uz:'Bu yil men o\'ttiz yoshga to\'ldim.', ru:'В этом году мне тридцать.', en:'I turn thirty this year.' },
  { parts:[{text:'她',color:C_SUB},{text:'四十五岁',color:C_AGE},{text:'。',color:C_PUNC}], py:'Tā sìshíwǔ suì.', uz:'U qirq besh yoshda.', ru:'Ей сорок пять лет.', en:'She is forty-five years old.' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ duō dà?', uz:'Siz necha yoshdasiz?', ru:'Сколько вам лет?', en:'How old are you?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'二十三岁',color:C_AGE},{text:'。',color:C_PUNC},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ èrshísān suì. Nǐ ne?', uz:'Men yigirma uch yoshdaman. Sizchi?', ru:'Мне двадцать три. А вам?', en:'I\'m twenty-three. And you?' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'今年二十五岁',color:C_AGE},{text:'。',color:C_PUNC}], py:'Wǒ jīnnián èrshíwǔ suì.', uz:'Men bu yil yigirma besh yoshdaman.', ru:'В этом году мне двадцать пять.', en:'I\'m twenty-five this year.' },
  { s:'B', parts:[{text:'你妈妈',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ māma duō dà?', uz:'Onangiz necha yoshda?', ru:'Сколько лет вашей маме?', en:'How old is your mother?' },
  { s:'A', parts:[{text:'她',color:C_SUB},{text:'五十岁',color:C_AGE},{text:'。',color:C_PUNC}], py:'Tā wǔshí suì.', uz:'U ellik yoshda.', ru:'Ей пятьдесят.', en:'She is fifty.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你弟弟',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}], py:'Nǐ dìdi jǐ suì?', uz:'Ukangiz necha yoshda?', ru:'Сколько лет вашему брату?', en:'How old is your younger brother?' },
  { s:'B', parts:[{text:'他',color:C_SUB},{text:'八岁',color:C_JI},{text:'。',color:C_PUNC}], py:'Tā bā suì.', uz:'U sakkiz yoshda.', ru:'Ему восемь лет.', en:'He is eight years old.' },
  { s:'A', parts:[{text:'你今年',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}], py:'Nǐ jīnnián duō dà?', uz:'Bu yil siz necha yoshdasiz?', ru:'Сколько вам лет в этом году?', en:'How old are you this year?' },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'今年三十岁',color:C_AGE},{text:'！',color:C_PUNC}], py:'Wǒ jīnnián sānshí suì!', uz:'Men bu yil o\'ttiz yoshdaman!', ru:'В этом году мне тридцать!', en:'I\'m turning thirty this year!' },
  { s:'A', parts:[{text:'生日快乐！',color:C_SUB}], py:'Shēngrì kuàilè!', uz:'Tug\'ilgan kuningiz bilan!', ru:'С днём рождения!', en:'Happy birthday!' },
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

export function GrammarDuodaPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('duoda');
    if (existing === undefined || newStars > existing) saveStars('duoda', newStars);
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
        <div className="dr-hero__watermark">多大</div>
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
          <h1 className="dr-hero__title">多大</h1>
          <div className="dr-hero__pinyin">duō dà</div>
          <div className="dr-hero__translation">
            — {t('necha yoshda?','сколько лет?','how old?')} —
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
              <div className="grammar-block__label">{t('Asosiy so\'z','Ключевое слово','Key Word')}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char" style={{ color:C_AGE }}>多大</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">duō dà</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t("1+4 ton (tekis + tushuvchi) ¯ \\","1+4 тон (ровный + нисходящий) ¯ \\","1st+4th tone (flat + falling) ¯ \\")}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('necha yoshda?','сколько лет?','how old?')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 多大 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('多大 nima?','多大 — что это?','What is 多大?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_AGE }}>多大</strong> = <strong>{t('necha yoshda?','сколько лет?','how old?')}</strong>
                <br />
                {t(
                  "Kattalar (18+ yoshdagilar) yoshini so'raganda ishlatiladi. So'zma-so'z: 多 (qancha) + 大 (katta) = \"qanchalik katta?\"",
                  "Используется для вопроса о возрасте взрослых (18+). Дословно: 多 (сколько) + 大 (большой) = «насколько большой?»",
                  "Used to ask adults (18+) about their age. Literally: 多 (how much) + 大 (big) = \"how big?\" — meaning \"how old?\"",
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:12, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio('你多大？');}} style={{background:'#e0f2fe'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_AGE}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{ fontSize:14 }}>你<strong style={{color:C_AGE}}>多大</strong>？— {t('Necha yoshdasiz?','Сколько вам лет?','How old are you?')}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio('我二十五岁。');}} style={{background:'#e0f2fe'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_AGE}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <span style={{ fontSize:14 }}>我二十五<strong style={{color:C_AGE}}>岁</strong>。— {t('Men yigirma besh yoshdaman.','Мне двадцать пять лет.','I am twenty-five years old.')}</span>
                </div>
              </div>
            </div>

            {/* 多大 vs 几岁 */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('多大 va 几岁 — farqi','多大 и 几岁 — разница','多大 vs 几岁 — Difference')}</div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <div style={{ flex:1, textAlign:'center', background:'#e0f2fe', border:'2px solid #0369a1', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:28, color:C_AGE, fontWeight:700, marginBottom:2 }}>多大</div>
                  <div style={{ fontSize:10, color:C_AGE, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('KATTALAR','ВЗРОСЛЫЕ','ADULTS')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('18+ yoshdagilar\nuchun tabiiy','Для взрослых\n(18+)','Natural for\nadults (18+)')}</div>
                  <div style={{ fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' }}>你多大？</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#ecfdf5', border:'2px solid #059669', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:28, color:C_JI, fontWeight:700, marginBottom:2 }}>几岁</div>
                  <div style={{ fontSize:10, color:C_JI, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{t('BOLALAR','ДЕТИ','CHILDREN')}</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('Kichik bolalar\nyoshi uchun','Для маленьких\nдетей','For young\nchildren')}</div>
                  <div style={{ fontSize:12, color:'#888', marginTop:6, fontStyle:'italic' }}>你几岁？</div>
                </div>
              </div>
              <div style={{ background:'#fffbeb', borderRadius:6, padding:8, fontSize:11, color:'#92400e', lineHeight:1.7 }}>
                💡 {t(
                  "Ikkalasi ham to'g'ri — lekin katta odamga 几岁 deyish qo'pol tuyulishi mumkin.",
                  'Оба варианта правильны — но 几岁 для взрослого звучит грубо.',
                  'Both are correct — but using 几岁 for an adult sounds rude.',
                )}
              </div>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Siz necha yoshdasiz?» desak, javob «Men … yoshdaman» bo'ladi. Xitoy tilida ham xuddi shunday — javobda raqamdan keyin 岁 (suì = yosh) qo'shiladi:",
                  "В русском «Сколько вам лет?» — ответ «Мне … лет». В китайском так же — после числа ставится 岁 (suì = лет):",
                  "In English, \"How old are you?\" — \"I am … years old.\" In Chinese, the number is followed by 岁 (suì = years old):",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Savol','Вопрос','Question')}</div>
                  <div className="grammar-block__usage-py">Nǐ duō dà?</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'你',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Siz necha yoshdasiz?','Сколько вам лет?','How old are you?')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#e0f2fe', border:'1px solid #7dd3fc', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_AGE }}>{t('Javob','Ответ','Answer')}</div>
                  <div className="grammar-block__usage-py">Wǒ èrshíwǔ suì.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'我',color:C_SUB},{text:'二十五岁',color:C_AGE},{text:'。',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Men yigirma besh yoshdaman.','Мне двадцать пять лет.','I am twenty-five.')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "Xitoy tilida «Men … yoshdaman» deyish uchun 是 kerak emas — shunchaki: 我 + raqam + 岁",
                  "В китайском для «Мне … лет» не нужно 是 — просто: 我 + число + 岁",
                  "In Chinese, \"I am … years old\" doesn't need 是 — just: 我 + number + 岁",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim/nima?)',     ru:'Подлежащее (кто/что?)', en:'Subject (who/what?)' },
                  { color:C_AGE,  uz:'多大 / 岁 (yosh)',     ru:'多大 / 岁 (возраст)',    en:'多大 / 岁 (age)' },
                  { color:C_JI,   uz:'几岁 (bolalar)',        ru:'几岁 (для детей)',       en:'几岁 (for children)' },
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
            {/* Pattern 1 — 多大 (savol) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t("1-shablon — 你多大？ (savol)",'Шаблон 1 — 你多大？ (вопрос)','Pattern 1 — 你多大？ (question)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega','Подлеж.','Subject')}</span>
                {' '}
                <span style={{ color:C_AGE, fontWeight:700 }}>多大</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Yoshni so'rash","Вопрос о возрасте","Asking about age")}
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
                  "多大 yolg'iz ham ishlatiladi — 是 yoki boshqa fe'l kerak emas.",
                  "多大 используется без глагола — 是 или другой глагол не нужен.",
                  "多大 is used alone — no 是 or other verb needed.",
                )}
              </p>
            </div>

            {/* Pattern 2 — N岁 (javob) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — N岁 (javob)','Шаблон 2 — N岁 (ответ)','Pattern 2 — N岁 (answer)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Men','Я','I')}</span>
                {' '}
                <span style={{ color:C_AGE, fontWeight:700 }}>{t('Raqam','Число','Number')}</span>
                <span style={{ color:C_AGE, fontWeight:700 }}> + 岁</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Yoshni aytish — raqam + 岁","Ответ о возрасте — число + 岁","Stating age — number + 岁")}
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
                  "今年 (jīnnián = bu yil) qo'shsa: 我今年二十五岁。= Bu yil men yigirma besh yoshdaman.",
                  "Добавьте 今年 (jīnnián = в этом году): 我今年二十五岁。= В этом году мне двадцать пять.",
                  "Add 今年 (jīnnián = this year): 我今年二十五岁。= I'm twenty-five this year.",
                )}
              </p>
            </div>

            {/* 几岁 vs 多大 tip */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t("Qachon 几岁, qachon 多大?","Когда 几岁, когда 多大?","When to use 几岁 vs 多大?")}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "几岁 (jǐ suì) — kichik bolalar yoshini so'raganda ishlatiladi (taxminan 10 yoshgacha). Katta odamga 几岁 deyish qo'pol — 多大 ishlating.",
                  "几岁 (jǐ suì) — для вопроса о возрасте маленьких детей (примерно до 10 лет). Для взрослого 几岁 грубо — используйте 多大.",
                  "几岁 (jǐ suì) — for asking children's age (roughly up to 10). Using 几岁 for an adult is rude — use 多大 instead.",
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:12, marginTop:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:11, color:C_JI, fontWeight:700 }}>{t('Bolaga:','Ребёнку:','To a child:')}</span>
                  <span style={{ fontSize:14 }}>你<span style={{color:C_JI,fontWeight:600}}>几岁</span>？</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:C_AGE, fontWeight:700 }}>{t('Kattaga:','Взрослому:','To an adult:')}</span>
                  <span style={{ fontSize:14 }}>你<span style={{color:C_AGE,fontWeight:600}}>多大</span>？</span>
                </div>
              </div>
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
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#e0f2fe'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_AGE}><path d="M8 5v14l11-7z"/></svg>
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
              <div className="grammar-block__label">{t('Dialog 1 — Yosh haqida','Диалог 1 — О возрасте','Dialogue 1 — About Age')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#e0f2fe' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_AGE:'#dc2626',flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Tug\'ilgan kun','Диалог 2 — День рождения','Dialogue 2 — Birthday')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#e0f2fe' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_AGE:'#dc2626',flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
                  parts:[{text:'你',color:C_SUB},{text:'多大',color:C_AGE},{text:'？',color:C_PUNC}],
                  note: t("Kattaga: necha yoshdasiz?","Взрослому: сколько вам лет?","To an adult: how old are you?"),
                },
                {
                  parts:[{text:'你弟弟',color:C_SUB},{text:'几岁',color:C_JI},{text:'？',color:C_PUNC}],
                  note: t("Bolaga: necha yoshda?","Ребёнку: сколько лет?","To a child: how old?"),
                },
                {
                  parts:[{text:'我',color:C_SUB},{text:'二十五岁',color:C_AGE},{text:'。',color:C_PUNC}],
                  note: t("Javob: Raqam + 岁","Ответ: число + 岁","Answer: number + 岁"),
                },
                {
                  parts:[{text:'我今年',color:C_SUB},{text:'三十岁',color:C_AGE},{text:'！',color:C_PUNC}],
                  note: t("今年 qo'shsa: bu yil necha yoshga to'ldim","С 今年: в этом году мне исполняется","With 今年: this year I turn"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #0369a1', background:'#e0f2fe' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#075985' }}>
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
            accentColor="#0369a1"
            accentBg="#e0f2fe"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
