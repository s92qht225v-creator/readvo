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

const C_TIME = '#16a34a'; // Subject / Time (green)
const C_MON  = '#7c3aed'; // Month / Weekday (violet)
const C_DAY  = '#dc2626'; // Day (red)
const C_NUM  = '#1d4ed8'; // Number (blue)
const C_DE   = '#0d9488'; // 的 (teal)
const C_WK   = '#92400e'; // Weekday in full date (amber)
const C_PUNC = '#888';

const speakingQuestionsData = [
  { uz: 'Bugun nechanchi oy nechanchi kun?', ru: 'Какое сегодня число?', en: 'What is today\'s date?', zh: '今天几月几号？', pinyin: 'Jīntiān jǐ yuè jǐ hào?' },
  { uz: 'Bugun 2-sentyabr.', ru: 'Сегодня 2 сентября.', en: 'Today is September 2nd.', zh: '今天九月二号。', pinyin: 'Jīntiān jiǔ yuè èr hào.' },
  { uz: 'Bugun haftaning qaysi kuni?', ru: 'Какой сегодня день недели?', en: 'What day of the week is it today?', zh: '今天星期几？', pinyin: 'Jīntiān xīngqī jǐ?' },
  { uz: 'Bugun payshanba.', ru: 'Сегодня четверг.', en: 'Today is Thursday.', zh: '今天星期四。', pinyin: 'Jīntiān xīngqī sì.' },
  { uz: 'Sizning tug\'ilgan kuningiz qachon?', ru: 'Когда ваш день рождения?', en: 'When is your birthday?', zh: '你的生日几月几号？', pinyin: 'Nǐ de shēngrì jǐ yuè jǐ hào?' },
  { uz: 'Mening tug\'ilgan kunim 8-mart.', ru: 'Мой день рождения 8 марта.', en: 'My birthday is March 8th.', zh: '我的生日三月八号。', pinyin: 'Wǒ de shēngrì sān yuè bā hào.' },
];

const sections = [
  { id: 'intro',    uz: 'Asosiy',   ru: 'Основное', en: 'Overview'  },
  { id: 'usage',    uz: 'Shablon',  ru: 'Шаблоны',  en: 'Patterns'  },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры',  en: 'Examples'  },
  { id: 'dialog',   uz: 'Dialog',   ru: 'Диалог',   en: 'Dialogue'  },
  { id: 'quiz',     uz: 'Mashq',    ru: 'Тест',     en: 'Quiz'      },
];

type Part = { text: string; color: string };

const months: { zh: string; py: string; uz: string; ru: string; en: string }[] = [
  { zh:'一月',  py:'yīyuè',    uz:'Yanvar',   ru:'Январь',   en:'January' },
  { zh:'二月',  py:'èryuè',    uz:'Fevral',   ru:'Февраль',  en:'February' },
  { zh:'三月',  py:'sānyuè',   uz:'Mart',     ru:'Март',     en:'March' },
  { zh:'四月',  py:'sìyuè',    uz:'Aprel',    ru:'Апрель',   en:'April' },
  { zh:'五月',  py:'wǔyuè',    uz:'May',      ru:'Май',      en:'May' },
  { zh:'六月',  py:'liùyuè',   uz:'Iyun',     ru:'Июнь',     en:'June' },
  { zh:'七月',  py:'qīyuè',    uz:'Iyul',     ru:'Июль',     en:'July' },
  { zh:'八月',  py:'bāyuè',    uz:'Avgust',   ru:'Август',   en:'August' },
  { zh:'九月',  py:'jiǔyuè',   uz:'Sentyabr', ru:'Сентябрь', en:'September' },
  { zh:'十月',  py:'shíyuè',   uz:'Oktyabr',  ru:'Октябрь',  en:'October' },
  { zh:'十一月',py:'shíyīyuè', uz:'Noyabr',   ru:'Ноябрь',   en:'November' },
  { zh:'十二月',py:"shí'èryuè", uz:'Dekabr',   ru:'Декабрь',  en:'December' },
];

const weekdays: { zh: string; py: string; uz: string; ru: string; en: string }[] = [
  { zh:'星期一', py:'xīngqī yī',  uz:'Dushanba',   ru:'Понедельник', en:'Monday' },
  { zh:'星期二', py:'xīngqī èr',  uz:'Seshanba',   ru:'Вторник',     en:'Tuesday' },
  { zh:'星期三', py:'xīngqī sān', uz:'Chorshanba', ru:'Среда',       en:'Wednesday' },
  { zh:'星期四', py:'xīngqī sì',  uz:'Payshanba',  ru:'Четверг',     en:'Thursday' },
  { zh:'星期五', py:'xīngqī wǔ',  uz:'Juma',       ru:'Пятница',     en:'Friday' },
  { zh:'星期六', py:'xīngqī liù', uz:'Shanba',     ru:'Суббота',     en:'Saturday' },
  { zh:'星期天', py:'xīngqī tiān',uz:'Yakshanba',  ru:'Воскресенье', en:'Sunday' },
];

const examples: {
  parts: Part[];
  pinyin: string;
  uz: string; ru: string; en: string;
  note_uz: string; note_ru: string; note_en: string;
}[] = [
  {
    parts: [{text:'今天',color:C_TIME},{text:'几',color:C_MON},{text:'月',color:C_DAY},{text:'几',color:C_MON},{text:'号',color:C_DAY},{text:'？',color:C_PUNC}],
    pinyin:'Jīntiān jǐ yuè jǐ hào?', uz:'Bugun nechanchi oy nechanchi kun?', ru:'Какое сегодня число?', en:'What is today\'s date?',
    note_uz:'几 (jǐ) = necha · 月 (yuè) = oy · 号 (hào) = kun (sana)',
    note_ru:'几 (jǐ) = сколько · 月 (yuè) = месяц · 号 (hào) = число (дата)',
    note_en:'几 (jǐ) = how many · 月 (yuè) = month · 号 (hào) = date number',
  },
  {
    parts: [{text:'今天',color:C_TIME},{text:'九月',color:C_MON},{text:'二号',color:C_DAY},{text:'。',color:C_PUNC}],
    pinyin:'Jīntiān jiǔ yuè èr hào.', uz:'Bugun 2-sentyabr.', ru:'Сегодня 2 сентября.', en:'Today is September 2nd.',
    note_uz:'九月 = sentyabr (9-oy) · 二号 = 2-kun',
    note_ru:'九月 = сентябрь (9-й месяц) · 二号 = 2-е число',
    note_en:'九月 = September (month 9) · 二号 = the 2nd',
  },
  {
    parts: [{text:'今天',color:C_TIME},{text:'星期',color:C_MON},{text:'几',color:C_DAY},{text:'？',color:C_PUNC}],
    pinyin:'Jīntiān xīngqī jǐ?', uz:'Bugun haftaning qaysi kuni?', ru:'Какой сегодня день недели?', en:'What day of the week is it?',
    note_uz:'星期几 = haftaning qaysi kuni? · 几 = necha/qaysi',
    note_ru:'星期几 = какой день недели? · 几 = сколько/какой',
    note_en:'星期几 = what day of the week? · 几 = which/how many',
  },
  {
    parts: [{text:'今天',color:C_TIME},{text:'星期四',color:C_MON},{text:'。',color:C_PUNC}],
    pinyin:'Jīntiān xīngqī sì.', uz:'Bugun payshanba.', ru:'Сегодня четверг.', en:'Today is Thursday.',
    note_uz:'星期四 = payshanba (hafta-4)',
    note_ru:'星期四 = четверг (неделя-4)',
    note_en:'星期四 = Thursday (week-4)',
  },
  {
    parts: [{text:'你',color:C_TIME},{text:'的',color:C_DE},{text:'生日',color:C_DAY},{text:'几月几号',color:C_MON},{text:'？',color:C_PUNC}],
    pinyin:'Nǐ de shēngrì jǐ yuè jǐ hào?', uz:'Sizning tug\'ilgan kuningiz qachon?', ru:'Когда ваш день рождения?', en:'When is your birthday?',
    note_uz:'生日 (shēngrì) = tug\'ilgan kun · 几月几号 = nechanchi oy nechanchi kun',
    note_ru:'生日 (shēngrì) = день рождения · 几月几号 = какое число какого месяца',
    note_en:'生日 (shēngrì) = birthday · 几月几号 = what month what date',
  },
  {
    parts: [{text:'我',color:C_TIME},{text:'的',color:C_DE},{text:'生日',color:C_DAY},{text:'三月',color:C_MON},{text:'八号',color:C_NUM},{text:'。',color:C_PUNC}],
    pinyin:'Wǒ de shēngrì sān yuè bā hào.', uz:'Mening tug\'ilgan kunim 8-mart.', ru:'Мой день рождения 8 марта.', en:'My birthday is March 8th.',
    note_uz:'三月 = mart (3-oy) · 八号 = 8-kun',
    note_ru:'三月 = март (3-й месяц) · 八号 = 8-е число',
    note_en:'三月 = March (month 3) · 八号 = the 8th',
  },
  {
    parts: [{text:'明天',color:C_TIME},{text:'星期六',color:C_MON},{text:'。',color:C_PUNC}],
    pinyin:'Míngtiān xīngqī liù.', uz:'Ertaga shanba.', ru:'Завтра суббота.', en:'Tomorrow is Saturday.',
    note_uz:'明天 (míngtiān) = ertaga · 星期六 = shanba (hafta-6)',
    note_ru:'明天 (míngtiān) = завтра · 星期六 = суббота (неделя-6)',
    note_en:'明天 (míngtiān) = tomorrow · 星期六 = Saturday (week-6)',
  },
  {
    parts: [{text:'昨天',color:C_TIME},{text:'十月',color:C_MON},{text:'一号',color:C_NUM},{text:'。',color:C_PUNC}],
    pinyin:'Zuótiān shí yuè yī hào.', uz:'Kecha 1-oktyabr edi.', ru:'Вчера было 1 октября.', en:'Yesterday was October 1st.',
    note_uz:'昨天 (zuótiān) = kecha · 十月 = oktyabr · 一号 = 1-kun',
    note_ru:'昨天 (zuótiān) = вчера · 十月 = октябрь · 一号 = 1-е число',
    note_en:'昨天 (zuótiān) = yesterday · 十月 = October · 一号 = the 1st',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'今天',color:C_TIME},{text:'几月',color:C_MON},{text:'几号',color:C_DAY},{text:'？',color:C_PUNC}], py:'Jīntiān jǐ yuè jǐ hào?', uz:'Bugun nechanchi oy nechanchi kun?', ru:'Какое сегодня число?', en:'What is today\'s date?' },
  { parts:[{text:'明天',color:C_TIME},{text:'几月',color:C_MON},{text:'几号',color:C_DAY},{text:'？',color:C_PUNC}], py:'Míngtiān jǐ yuè jǐ hào?', uz:'Ertaga nechanchi oy nechanchi kun?', ru:'Какое завтра число?', en:'What is tomorrow\'s date?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'九月',color:C_MON},{text:'二号',color:C_DAY}], py:'Jiǔ yuè èr hào', uz:'2-sentyabr', ru:'2 сентября', en:'September 2nd' },
  { parts:[{text:'三月',color:C_MON},{text:'八号',color:C_DAY}], py:'Sān yuè bā hào', uz:'8-mart', ru:'8 марта', en:'March 8th' },
  { parts:[{text:'十月',color:C_MON},{text:'一号',color:C_DAY}], py:'Shí yuè yī hào', uz:'1-oktyabr', ru:'1 октября', en:'October 1st' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'今天',color:C_TIME},{text:'星期几',color:C_MON},{text:'？',color:C_PUNC}], py:'Jīntiān xīngqī jǐ?', uz:'Bugun haftaning qaysi kuni?', ru:'Какой сегодня день недели?', en:'What day is today?' },
  { parts:[{text:'明天',color:C_TIME},{text:'星期几',color:C_MON},{text:'？',color:C_PUNC}], py:'Míngtiān xīngqī jǐ?', uz:'Ertaga haftaning qaysi kuni?', ru:'Какой завтра день недели?', en:'What day is tomorrow?' },
];

const pattern4Rows: PatternRow[] = [
  { parts:[{text:'九月',color:C_MON},{text:'二号',color:C_DAY},{text:'星期四',color:C_WK}], py:'Jiǔ yuè èr hào xīngqī sì', uz:'2-sentyabr, payshanba', ru:'2 сентября, четверг', en:'September 2nd, Thursday' },
  { parts:[{text:'六月',color:C_MON},{text:'十五号',color:C_DAY},{text:'星期天',color:C_WK}], py:'Liù yuè shíwǔ hào xīngqī tiān', uz:'15-iyun, yakshanba', ru:'15 июня, воскресенье', en:'June 15th, Sunday' },
];

const pattern5Rows: PatternRow[] = [
  { parts:[{text:'你的',color:C_TIME},{text:'生日',color:C_DAY},{text:'几月几号',color:C_MON},{text:'？',color:C_PUNC}], py:'Nǐ de shēngrì jǐ yuè jǐ hào?', uz:'Tug\'ilgan kuningiz qachon?', ru:'Когда ваш день рождения?', en:'When is your birthday?' },
  { parts:[{text:'我的',color:C_TIME},{text:'生日',color:C_DAY},{text:'三月',color:C_MON},{text:'八号',color:C_NUM},{text:'。',color:C_PUNC}], py:'Wǒ de shēngrì sān yuè bā hào.', uz:'Mening tug\'ilgan kunim 8-mart.', ru:'Мой день рождения 8 марта.', en:'My birthday is March 8th.' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'今天',color:C_TIME},{text:'几月',color:C_MON},{text:'几号',color:C_DAY},{text:'？',color:C_PUNC}],
    py:'Jīntiān jǐ yuè jǐ hào?', uz:'Bugun nechanchi oy nechanchi kun?', ru:'Какое сегодня число?', en:'What is today\'s date?' },
  { s:'B', parts:[{text:'今天',color:C_TIME},{text:'九月',color:C_MON},{text:'二号',color:C_DAY},{text:'。',color:C_PUNC}],
    py:'Jīntiān jiǔ yuè èr hào.', uz:'Bugun 2-sentyabr.', ru:'Сегодня 2 сентября.', en:'Today is September 2nd.' },
  { s:'A', parts:[{text:'今天',color:C_TIME},{text:'星期几',color:C_MON},{text:'？',color:C_PUNC}],
    py:'Jīntiān xīngqī jǐ?', uz:'Bugun haftaning qaysi kuni?', ru:'Какой сегодня день недели?', en:'What day is it today?' },
  { s:'B', parts:[{text:'今天',color:C_TIME},{text:'星期四',color:C_MON},{text:'。',color:C_PUNC}],
    py:'Jīntiān xīngqī sì.', uz:'Bugun payshanba.', ru:'Сегодня четверг.', en:'Today is Thursday.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_TIME},{text:'的',color:C_DE},{text:'生日',color:C_DAY},{text:'几月几号',color:C_MON},{text:'？',color:C_PUNC}],
    py:'Nǐ de shēngrì jǐ yuè jǐ hào?', uz:'Tug\'ilgan kuningiz qachon?', ru:'Когда ваш день рождения?', en:'When is your birthday?' },
  { s:'B', parts:[{text:'我',color:C_TIME},{text:'的',color:C_DE},{text:'生日',color:C_DAY},{text:'六月',color:C_MON},{text:'十五号',color:C_NUM},{text:'。',color:C_PUNC}],
    py:'Wǒ de shēngrì liù yuè shíwǔ hào.', uz:'Mening tug\'ilgan kunim 15-iyun.', ru:'Мой день рождения 15 июня.', en:'My birthday is June 15th.' },
  { s:'A', parts:[{text:'六月',color:C_MON},{text:'十五号',color:C_NUM},{text:'星期几',color:C_DAY},{text:'？',color:C_PUNC}],
    py:'Liù yuè shíwǔ hào xīngqī jǐ?', uz:'15-iyun haftaning qaysi kuni?', ru:'15 июня — какой день недели?', en:'June 15th — what day is it?' },
  { s:'B', parts:[{text:'星期天',color:C_MON},{text:'。',color:C_PUNC}],
    py:'Xīngqī tiān.', uz:'Yakshanba.', ru:'Воскресенье.', en:'Sunday.' },
  { s:'A', parts:[{text:'好！',color:C_TIME}],
    py:'Hǎo!', uz:'Yaxshi!', ru:'Хорошо!', en:'Great!' },
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

export function GrammarRiqiPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('riqi');
    if (existing === undefined || newStars > existing) saveStars('riqi', newStars);
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
      <div className="dr-hero" style={{ background:'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
        <div className="dr-hero__watermark">月日</div>
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
          <h1 className="dr-hero__title" style={{ fontSize:48 }}>月、号、星期</h1>
          <div className="dr-hero__pinyin">yuè, hào, xīngqī</div>
          <div className="dr-hero__translation">
            — {t('sana aytish', 'даты', 'dates')} —
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grammar-page__tabs" style={{ background:'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)' }}>
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
            {/* Key words */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Asosiy so\'zlar','Ключевые слова','Key Words')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {([
                  { zh:'月', py:'yuè', uz:'oy', ru:'месяц', en:'month', tone:t('4-ton','4-й тон','4th tone') },
                  { zh:'号', py:'hào', uz:'kun (sana)', ru:'число (дата)', en:'date number', tone:t('4-ton','4-й тон','4th tone') },
                  { zh:'日', py:'rì', uz:'kun (rasmiy)', ru:'число (офиц.)', en:'date (formal)', tone:t('4-ton','4-й тон','4th tone') },
                  { zh:'星期', py:'xīngqī', uz:'hafta kuni', ru:'день недели', en:'weekday', tone:t('1+1 ton','1+1 тон','1+1 tone') },
                ] as { zh: string; py: string; uz: string; ru: string; en: string; tone: string }[]).map((item, i) => (
                  <div key={i} style={{ background:'#f5f3ff', borderRadius:10, padding:12, border:'1px solid #e9d5ff', textAlign:'center' }}>
                    <div style={{ fontSize:40, background:'linear-gradient(135deg, #7c3aed, #a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:400, lineHeight:1.2 }}>{item.zh}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1a1a2e', marginTop:4 }}>{item.py}</div>
                    <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{t(item.uz, item.ru, item.en)}</div>
                    <div style={{ fontSize:10, color:C_MON, marginTop:4 }}>{item.tone}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 号 vs 日 */}
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('号 va 日 farqi','号 и 日 — разница','号 vs 日 — difference')}</div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <div style={{ flex:1, background:'#f5f3ff', borderRadius:8, padding:12, border:'1px solid #e9d5ff', textAlign:'center' }}>
                  <div style={{ fontSize:30, color:C_MON, fontWeight:700, marginBottom:2 }}>号</div>
                  <div style={{ fontSize:10, color:C_MON, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>hào</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('Og\'zaki nutqda\nkundalik suhbatda','Разговорная речь\nповседневное общение','Spoken language\neveryday conversation')}</div>
                </div>
                <div style={{ flex:1, background:'#f0fdfa', borderRadius:8, padding:12, border:'1px solid #5eead4', textAlign:'center' }}>
                  <div style={{ fontSize:30, color:'#0f766e', fontWeight:700, marginBottom:2 }}>日</div>
                  <div style={{ fontSize:10, color:'#0f766e', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>rì</div>
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.6 }}>{t('Rasmiy yozuvda\nhujjatlarda','Официальная речь\nдокументы','Formal writing\ndocuments')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note">
                💡 {t(
                  'Ikkalasi ham bir xil ma\'no beradi — faqat uslubi farq qiladi. HSK 1 da 号 ko\'proq ishlatiladi.',
                  'Оба означают одно и то же — разница только в стиле. В HSK 1 чаще используется 号.',
                  'Both mean the same — only the register differs. In HSK 1, 号 is more commonly used.',
                )}
              </p>
            </div>

            {/* Date order */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Xitoycha sana tartibi','Порядок даты в китайском','Chinese Date Order')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  'Xitoycha sana kattadan kichikka qarab yoziladi:',
                  'В китайском дата записывается от большего к меньшему:',
                  'Chinese dates are written from largest to smallest unit:',
                )}
              </p>
              <div style={{ background:'#f5f5f8', borderRadius:8, padding:12, textAlign:'center', marginBottom:10 }}>
                <div style={{ fontSize:14, letterSpacing:2, lineHeight:2 }}>
                  <span style={{ background:'#dbeafe', padding:'4px 8px', borderRadius:6, color:'#1d4ed8', fontWeight:600 }}>{t('Yil','Год','Year')}</span>
                  {' → '}
                  <span style={{ background:'#e9d5ff', padding:'4px 8px', borderRadius:6, color:C_MON, fontWeight:600 }}>{t('Oy','Месяц','Month')}</span>
                  {' → '}
                  <span style={{ background:'#fecaca', padding:'4px 8px', borderRadius:6, color:C_DAY, fontWeight:600 }}>{t('Kun','День','Day')}</span>
                  {' → '}
                  <span style={{ background:'#fef3c7', padding:'4px 8px', borderRadius:6, color:C_WK, fontWeight:600 }}>{t('Hafta kuni','День недели','Weekday')}</span>
                </div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onClick={()=>playGrammarAudio('九月二号星期四')} style={{background:'#f5f3ff'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_MON}><path d="M8 5v14l11-7z"/></svg>
                  </button>
                  <ColorParts parts={[{text:'九月',color:C_MON},{text:'二号',color:C_DAY},{text:'星期四',color:C_WK}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('2-sentyabr, payshanba','2 сентября, четверг','September 2nd, Thursday')}</div>
              </div>
            </div>

            {/* Months */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Oylar — son + 月','Месяцы — число + 月','Months — number + 月')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  'Xitoycha oylar juda oddiy: son + 月. Yanvar = 1-oy = 一月, Fevral = 2-oy = 二月...',
                  'Месяцы в китайском очень просты: число + 月. Январь = 1-й месяц = 一月, Февраль = 2-й = 二月...',
                  'Chinese months are very simple: number + 月. January = month 1 = 一月, February = month 2 = 二月...',
                )}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
                {months.map((m, i) => (
                  <button key={i} type="button" className="grammar-block__usage-item" onClick={()=>playGrammarAudio(m.zh)}
                    style={{ textAlign:'center', cursor:'pointer', padding:'8px 6px' }}>
                    <div style={{ fontSize:18, color:C_MON, fontWeight:600 }}>{m.zh}</div>
                    <div style={{ fontSize:9, color:'#888' }}>{m.py}</div>
                    <div style={{ fontSize:9, color:'#bbb' }}>{t(m.uz, m.ru, m.en)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Weekdays */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Hafta kunlari — 星期 + son','Дни недели — 星期 + число','Weekdays — 星期 + number')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  'Hafta kunlari ham oddiy: 星期 + son. Dushanba = 星期一 (hafta-1)... Faqat yakshanba = 星期天 (天 = kun), son emas!',
                  'Дни недели тоже просты: 星期 + число. Понедельник = 星期一 (неделя-1)... Только воскресенье = 星期天 (天 = день), без числа!',
                  'Weekdays are also simple: 星期 + number. Monday = 星期一 (week-1)... Only Sunday = 星期天 (天 = day), no number!',
                )}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {weekdays.map((w, i) => (
                  <button key={i} type="button" className="grammar-block__usage-item"
                    onClick={()=>playGrammarAudio(w.zh)}
                    style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', background: i === 6 ? '#f5f3ff' : undefined, border: i === 6 ? '1px solid #e9d5ff' : undefined }}>
                    <div style={{ fontSize:20, color:C_MON, fontWeight:600, minWidth:70 }}>{w.zh}</div>
                    <div style={{ fontSize:11, color:'#888', minWidth:80 }}>{w.py}</div>
                    <div style={{ fontSize:11, color:'#555' }}>{t(w.uz, w.ru, w.en)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color: C_TIME, uz:'Ega / Vaqt',      ru:'Подлежащее / Время', en:'Subject / Time' },
                  { color: C_MON,  uz:'Oy / Hafta kuni',  ru:'Месяц / День недели', en:'Month / Weekday' },
                  { color: C_DAY,  uz:'Kun (sana)',        ru:'Число (дата)',        en:'Day (date)' },
                  { color: C_NUM,  uz:'Son',               ru:'Число',               en:'Number' },
                  { color: C_DE,   uz:'的 (egalik)',        ru:'的 (принадлежн.)',     en:'的 (possessive)' },
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
            {/* Pattern 1: Asking date */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('1-shablon — Sana so\'rash','Шаблон 1 — Спрашиваем дату','Pattern 1 — Asking the Date')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_TIME, fontWeight:700 }}>今天</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#f5f3ff', color:C_MON }}>几月</span>
                {' '}
                <span style={{ color:C_DAY, fontWeight:700 }}>几号</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Bugun nechanchi oy nechanchi kun?','Какое сегодня число?','What is today\'s date?')}</p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  '几 (jǐ) = necha/qaysi — son so\'raganda ishlatiladi. 几月 = nechanchi oy? · 几号 = nechanchi kun?',
                  '几 (jǐ) = сколько/какой — используется для вопросов о числах. 几月 = какой месяц? · 几号 = какое число?',
                  '几 (jǐ) = how many/which — used to ask about numbers. 几月 = which month? · 几号 = which date?',
                )}
              </p>
            </div>

            {/* Pattern 2: Saying a date */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('2-shablon — Sana aytish','Шаблон 2 — Называем дату','Pattern 2 — Saying the Date')}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb" style={{ background:'#f5f3ff', color:C_MON }}>X月</span>
                {' '}
                <span style={{ color:C_DAY, fontWeight:700 }}>Y号</span>
              </div>
              <p className="grammar-block__formula-desc">{t('X-oy Y-kun','X-й месяц Y-е число','Month X, Day Y')}</p>
              {pattern2Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 3: Asking weekday */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('3-shablon — Hafta kunini so\'rash','Шаблон 3 — Спрашиваем день недели','Pattern 3 — Asking the Weekday')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_TIME, fontWeight:700 }}>今天</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#f5f3ff', color:C_MON }}>星期几</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Bugun haftaning qaysi kuni?','Какой сегодня день недели?','What day of the week is today?')}</p>
              {pattern3Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 4: Full date */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('4-shablon — To\'liq sana','Шаблон 4 — Полная дата','Pattern 4 — Full Date')}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb" style={{ background:'#f5f3ff', color:C_MON }}>X月</span>
                {' '}
                <span style={{ color:C_DAY, fontWeight:700 }}>Y号</span>
                {' '}
                <span style={{ color:C_WK, fontWeight:700 }}>星期Z</span>
              </div>
              <p className="grammar-block__formula-desc">{t('X-oy Y-kun, hafta-Z','X-й месяц Y-е число, день Z','Month X, Day Y, Weekday Z')}</p>
              {pattern4Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 {t(
                  'Tartib doim: oy → kun → hafta kuni. Kattadan kichikka!',
                  'Порядок всегда: месяц → число → день недели. От большего к меньшему!',
                  'Order is always: month → date → weekday. Largest to smallest!',
                )}
              </p>
            </div>

            {/* Pattern 5: Birthday */}
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('5-shablon — Tug\'ilgan kun','Шаблон 5 — День рождения','Pattern 5 — Birthday')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_TIME, fontWeight:700 }}>{t('你的生日','你的生日','你的生日')}</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#f5f3ff', color:C_MON }}>几月几号</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">{t('Tug\'ilgan kuningiz qachon?','Когда ваш день рождения?','When is your birthday?')}</p>
              {pattern5Rows.map((r, i) => (
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
            <div className="grammar-block__label" style={{ color:C_MON }}>{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
            {examples.map((ex, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" className="grammar-play-btn" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{background:'#f5f3ff'}} aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={C_MON}><path d="M8 5v14l11-7z"/></svg>
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
            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Dialog 1 — Bugun nechanchi?','Диалог 1 — Какое сегодня число?','Dialogue 1 — What\'s today\'s date?')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#faf5ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_MON:C_DAY,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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

            <div className="grammar-block">
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Dialog 2 — Tug\'ilgan kun','Диалог 2 — День рождения','Dialogue 2 — Birthday')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#faf5ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_MON:C_DAY,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label" style={{ color:C_MON }}>{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts: [{text:'今天',color:C_TIME},{text:'几月',color:C_MON},{text:'几号',color:C_DAY},{text:'？',color:C_PUNC}] as Part[],
                  note: t('几月几号 = nechanchi oy nechanchi kun?','几月几号 = какое число какого месяца?','几月几号 = what month what date?'),
                },
                {
                  parts: [{text:'今天',color:C_TIME},{text:'星期几',color:C_MON},{text:'？',color:C_PUNC}] as Part[],
                  note: t('星期几 = haftaning qaysi kuni?','星期几 = какой день недели?','星期几 = what day of the week?'),
                },
                {
                  parts: [{text:'九月',color:C_MON},{text:'二号',color:C_DAY},{text:'星期四',color:C_WK}] as Part[],
                  note: t('Tartib: oy → kun → hafta kuni','Порядок: месяц → число → день недели','Order: month → date → weekday'),
                },
              ]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:`3px solid ${C_MON}`, background:'#faf5ff' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:C_MON }}>
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
            accentColor="#7c3aed"
            accentBg="#f5f3ff"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
