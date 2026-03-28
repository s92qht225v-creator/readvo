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

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_SHI  = '#dc2626'; // 是 (Blim red)
const C_NE   = '#7c3aed'; // 呢 (violet — featured)
const C_PRED = '#16a34a'; // Predicate / Xabar
const C_PUNC = '#888';    // Punctuation
const C_MA   = '#0891b2'; // 吗 (cyan)

const speakingQuestionsData = [
  { uz: 'Sizchi?', ru: 'А вы?', en: 'And you?', zh: '你呢？', pinyin: 'Nǐ ne?' },
  { uz: 'Men yaxshiman. Sizchi?', ru: 'У меня хорошо. А у вас?', en: "I'm fine. And you?", zh: '我很好。你呢？', pinyin: 'Wǒ hěn hǎo. Nǐ ne?' },
  { uz: 'Men talabaman. U-chi?', ru: 'Я студент. А он?', en: "I'm a student. And him?", zh: '我是学生。他呢？', pinyin: 'Wǒ shì xuéshēng. Tā ne?' },
  { uz: 'Men choy ichishni yoqtiraman. Sizchi?', ru: 'Мне нравится пить чай. А вам?', en: 'I like drinking tea. And you?', zh: '我喜欢喝茶。你呢？', pinyin: 'Wǒ xǐhuān hē chá. Nǐ ne?' },
  { uz: "Men xitoy tilini o'qiyapman. Sizchi?", ru: 'Я изучаю китайский. А вы?', en: "I'm learning Chinese. And you?", zh: '我学汉语。你呢？', pinyin: 'Wǒ xué Hànyǔ. Nǐ ne?' },
  { uz: 'Ular-chi?', ru: 'А они?', en: 'And them?', zh: '他们呢？', pinyin: 'Tāmen ne?' },
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
    parts:[{text:'我很好。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ hěn hǎo. Nǐ ne?',
    uz:'Men yaxshiman. Sizchi?',            ru:'У меня хорошо. А у вас?',           en:"I'm fine. And you?",
    note_uz:"呢 oldingi gap kontekstini qaytaradi: «Men yaxshiman» → «Sizchi?»",
    note_ru:'呢 возвращает контекст: «У меня хорошо» → «А у вас?»',
    note_en:'呢 bounces back the context: "I\'m fine" → "And you?"',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生。',color:C_PRED},{text:'他',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ shì xuéshēng. Tā ne?',
    uz:'Men talabaman. U-chi?',            ru:'Я студент. А он?',                  en:"I'm a student. And him?",
    note_uz:"他呢 = U-chi? · 他 (tā) = u (erkak)",
    note_ru:'他呢 = А он? · 他 (tā) = он',
    note_en:'他呢 = And him? · 他 (tā) = he/him',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'喜欢',color:C_PRED},{text:'喝茶。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ xǐhuān hē chá. Nǐ ne?',
    uz:"Men choy ichishni yoqtiraman. Sizchi?", ru:'Мне нравится пить чай. А вам?',  en:'I like drinking tea. And you?',
    note_uz:"呢 qo'shilganda yangi savol yaratiladi: «Siz ham choy ichishni yoqtirasizmi?»",
    note_ru:'呢 создаёт новый вопрос: «А вам тоже нравится пить чай?»',
    note_en:'呢 creates a new question: "Do you also like drinking tea?"',
  },
  {
    parts:[{text:'她',color:C_SUB},{text:'是',color:C_SHI},{text:'老师。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Tā shì lǎoshī. Nǐ ne?',
    uz:"U o'qituvchi. Sizchi?",            ru:'Она учитель. А вы?',                en:"She's a teacher. And you?",
    note_uz:"呢 savoli gap kontekstiga qarab tushuniladi: «Siz-chi, kim bo'lasiz?»",
    note_ru:'Вопрос с 呢 понимается из контекста: «А вы кто по профессии?»',
    note_en:'The 呢 question is understood from context: "And what about you?"',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'学',color:C_PRED},{text:'汉语。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ xué Hànyǔ. Nǐ ne?',
    uz:"Men xitoy tilini o'qiyapman. Sizchi?",  ru:'Я изучаю китайский. А вы?',     en:"I'm learning Chinese. And you?",
    note_uz:"学 (xué) = o'qimoq · 汉语 (Hànyǔ) = xitoy tili",
    note_ru:'学 (xué) = изучать · 汉语 (Hànyǔ) = китайский язык',
    note_en:'学 (xué) = to study · 汉语 (Hànyǔ) = Chinese language',
  },
  {
    parts:[{text:'他们',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Tāmen ne?',
    uz:'Ular-chi?',                        ru:'А они?',                            en:'And them?',
    note_uz:"Yakka o'zi ishlatilsa ham bo'ladi — oldingi kontekstdan tushuniladi",
    note_ru:'Можно использовать отдельно — понимается из предыдущего контекста',
    note_en:'Can be used standalone — understood from the preceding context',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'不',color:C_SHI},{text:'喝',color:C_PRED},{text:'咖啡。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ bù hē kāfēi. Nǐ ne?',
    uz:"Men qahva ichmayman. Sizchi?",     ru:'Я не пью кофе. А вы?',              en:"I don't drink coffee. And you?",
    note_uz:"不 (bù) = inkor · 咖啡 (kāfēi) = qahva",
    note_ru:'不 (bù) = отрицание · 咖啡 (kāfēi) = кофе',
    note_en:'不 (bù) = negation · 咖啡 (kāfēi) = coffee',
  },
  {
    parts:[{text:'我',color:C_SUB},{text:'去',color:C_PRED},{text:'北京。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
    pinyin:'Wǒ qù Běijīng. Nǐ ne?',
    uz:'Men Pekinga boraman. Sizchi?',     ru:'Я еду в Пекин. А вы?',              en:"I'm going to Beijing. And you?",
    note_uz:"去 (qù) = bormoq · 北京 (Běijīng) = Pekin",
    note_ru:'去 (qù) = ехать · 北京 (Běijīng) = Пекин',
    note_en:'去 (qù) = to go · 北京 (Běijīng) = Beijing',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

const pattern1Rows: PatternRow[] = [
  { parts:[{text:'我很好。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ hěn hǎo. Nǐ ne?', uz:'Men yaxshiman. Sizchi?',         ru:'У меня хорошо. А вы?',     en:"I'm fine. And you?" },
  { parts:[{text:'我是学生。',color:C_PRED},{text:'他',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ shì xuéshēng. Tā ne?', uz:'Men talabaman. U-chi?',   ru:'Я студент. А он?',         en:"I'm a student. And him?" },
  { parts:[{text:'我喜欢喝茶。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ xǐhuān hē chá. Nǐ ne?', uz:'Men choy ichishni yoqtiraman. Sizchi?', ru:'Мне нравится чай. А вам?', en:'I like tea. And you?' },
];

const pattern2Rows: PatternRow[] = [
  { parts:[{text:'他们',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Tāmen ne?',     uz:'Ular-chi?',                    ru:'А они?',               en:'And them?' },
  { parts:[{text:'老师',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Lǎoshī ne?',    uz:"O'qituvchi-chi?",              ru:'А учитель?',           en:'And the teacher?' },
  { parts:[{text:'你的朋友',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Nǐ de péngyou ne?', uz:"Do'stingiz-chi?",        ru:'А ваш друг?',          en:'And your friend?' },
];

const pattern3Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'去不去',color:C_PRED},{text:'？',color:C_PUNC}], py:'Nǐ qù bú qù?',  uz:'Borasizmi?',               ru:'Вы пойдёте?',         en:'Are you going?' },
  { parts:[{text:'你',color:C_SUB},{text:'去',color:C_PRED},{text:'吗',color:C_MA},{text:'？',color:C_PUNC}], py:'Nǐ qù ma?',    uz:'Borasizmi?',               ru:'Вы пойдёте?',         en:'Are you going?' },
  { parts:[{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Nǐ ne?',             uz:'Sizchi?',                      ru:'А вы?',               en:'And you?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你好！',color:C_PRED},{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'李明。',color:C_PRED}],           py:'Nǐ hǎo! Wǒ shì Lǐ Míng.',         uz:'Salom! Men Li Mingman.',          ru:'Привет! Я Ли Мин.',              en:"Hi! I'm Li Ming." },
  { s:'B', parts:[{text:'你好！',color:C_PRED},{text:'我',color:C_SUB},{text:'叫',color:C_PRED},{text:'大卫。',color:C_PRED}],           py:'Nǐ hǎo! Wǒ jiào Dàwèi.',          uz:"Salom! Mening ismim Dovud.",      ru:'Привет! Меня зовут Дэвид.',      en:"Hi! My name is David." },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'中国人。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}], py:'Wǒ shì Zhōngguórén. Nǐ ne?', uz:"Men xitoylikman. Sizchi?",     ru:'Я китаец. А вы?',               en:"I'm Chinese. And you?" },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'美国人。',color:C_PRED}],                                      py:'Wǒ shì Měiguórén.',                uz:'Men amerikalikman.',              ru:'Я американец.',                  en:"I'm American." },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'学',color:C_PRED},{text:'英语。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],   py:'Wǒ xué Yīngyǔ. Nǐ ne?',    uz:"Men ingliz tilini o'qiyapman. Sizchi?", ru:'Я учу английский. А вы?',  en:"I'm learning English. And you?" },
  { s:'B', parts:[{text:'我',color:C_SUB},{text:'学',color:C_PRED},{text:'汉语！',color:C_PRED}],                                      py:'Wǒ xué Hànyǔ!',                    uz:"Men xitoy tilini o'qiyapman!",    ru:'Я учу китайский!',               en:"I'm learning Chinese!" },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'喜欢',color:C_PRED},{text:'喝茶',color:C_PRED},{text:'吗',color:C_MA},{text:'？',color:C_PUNC}],                     py:'Nǐ xǐhuān hē chá ma?',            uz:'Choy ichishni yoqtirasizmi?',     ru:'Вам нравится пить чай?',         en:'Do you like drinking tea?' },
  { s:'B', parts:[{text:'喜欢。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],                                             py:'Xǐhuān. Nǐ ne?',                  uz:'Yoqtiraman. Sizchi?',             ru:'Нравится. А вам?',               en:'I do. And you?' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'也',color:C_PRED},{text:'喜欢。',color:C_PRED}],                                                                   py:'Wǒ yě xǐhuān.',                   uz:'Men ham yoqtiraman.',             ru:'Мне тоже нравится.',             en:'I like it too.' },
  { s:'B', parts:[{text:'咖啡',color:C_PRED},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],                                                                     py:'Kāfēi ne?',                        uz:'Qahva-chi?',                      ru:'А кофе?',                        en:'And coffee?' },
  { s:'A', parts:[{text:'咖啡',color:C_PRED},{text:'也',color:C_PRED},{text:'喜欢！',color:C_PRED}],                                                                py:'Kāfēi yě xǐhuān!',                uz:"Qahvani ham yoqtiraman!",         ru:'Кофе тоже нравится!',            en:'I like coffee too!' },
  { s:'B', parts:[{text:'你的朋友',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],                                                                   py:'Nǐ de péngyou ne?',                uz:"Do'stingiz-chi?",                 ru:'А ваш друг?',                    en:'And your friend?' },
  { s:'A', parts:[{text:'他',color:C_SUB},{text:'不',color:C_SHI},{text:'喝',color:C_PRED},{text:'咖啡。',color:C_PRED}],                                           py:'Tā bù hē kāfēi.',                 uz:'U qahva ichmaydi.',               ru:'Он не пьёт кофе.',               en:"He doesn't drink coffee." },
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

export function GrammarNePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('ne');
    if (existing === undefined || newStars > existing) saveStars('ne', newStars);
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
        <div className="dr-hero__watermark">呢</div>
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
          <h1 className="dr-hero__title">呢</h1>
          <div className="dr-hero__pinyin">ne</div>
          <div className="dr-hero__translation">
            — {t('…chi?','…а вы?','…and you?')} —
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
                <div className="grammar-block__big-char">呢</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ne</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('Neytral ton (yengil)','Нейтральный тон (лёгкий)','Neutral tone (light)')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">{t('8 ta','8','8')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('…chi? (qaytarish savol yuklamasi)','…а вы? (частица переспроса)','…and you? (bounce-back particle)')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 呢 nima */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('呢 nima?','呢 — что это?','What is 呢?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color:C_NE }}>呢</strong> = <strong>{t('…chi? (qaytarish savol yuklamasi)','…а вы? (частица переспроса)','…and you? (bounce-back particle)')}</strong>
                <br />
                {t(
                  "Oldingi gapning savolini suhbatdoshga qaytarish uchun ishlatiladi. O'zbek tilidagi «-chi?» suffiksiga to'g'ri keladi: «Sizchi?», «U-chi?»",
                  "Используется для переадресации вопроса собеседнику. Соответствует русскому «А вы?», «А он?» — конструкция «А + местоимение?»",
                  "Used to redirect a question back to the other person. Like English \"And you?\", \"What about him?\" — a follow-up question based on the previous statement.",
                )}
              </p>
            </div>

            {/* Qanday ishlaydi */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Qanday ishlaydi?','Как работает?','How does it work?')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  "O'zbek tilida «Men talabaman. Sizchi?» desak, «-chi» savolni qaytaradi. Xitoy tilida 呢 xuddi shunday ishlaydi — ega + 呢 = qaytarish savoli:",
                  "В русском «Я студент. А вы?» слово «а» + местоимение переадресует вопрос. В китайском 呢 работает точно так же — подлежащее + 呢 = переспрос:",
                  "In English, \"I'm a student. And you?\" redirects the question. In Chinese, 呢 works the same way — subject + 呢 = bounce-back question:",
                )}
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center' }}>
                  <div className="grammar-block__usage-type">{t('Darak gap','Повествование','Statement')}</div>
                  <div className="grammar-block__usage-py">Wǒ shì xuéshēng.</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'我',color:C_SUB},{text:'是',color:C_SHI},{text:'学生。',color:C_PRED}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Men talabaman.','Я студент.','I\'m a student.')}</div>
                </div>
                <div style={{ fontSize:'1.4em', color:'#888' }}>+呢→</div>
                <div className="grammar-block__usage-item" style={{ flex:1, textAlign:'center', background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:8 }}>
                  <div className="grammar-block__usage-type" style={{ color:C_NE }}>{t('Qaytarish','Переспрос','Bounce-back')}</div>
                  <div className="grammar-block__usage-py">Nǐ ne?</div>
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={[{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}]} />
                  </div>
                  <div className="grammar-block__usage-tr">{t('Sizchi?','А вы?','And you?')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "呢 hech qachon yakka ishlatilmaydi — oldin darak gap bo'lishi kerak. Suhbatdosh kontekstdan tushunadi.",
                  "呢 никогда не используется отдельно — перед ним должно быть утверждение. Собеседник понимает из контекста.",
                  "呢 is never used alone — there must be a statement before it. The listener understands from context.",
                )}
              </p>
            </div>

            {/* 呢 vs 吗 comparison */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('呢 va 吗 — Farq qiling!','呢 и 吗 — Не путайте!','呢 vs 吗 — Know the Difference!')}</div>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <div style={{ flex:1, textAlign:'center', background:'#f5f3ff', border:'2px solid #7c3aed', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:C_NE, fontWeight:700 }}>呢</div>
                  <div style={{ color:C_NE, fontWeight:600 }}>ne</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('neytral ton','нейтр. тон','neutral tone')}</div>
                  <div style={{ marginTop:6, color:C_NE, fontWeight:600, fontSize:14 }}>{t('…chi? (qaytarish)','…а вы? (переспрос)','…and you? (bounce-back)')}</div>
                </div>
                <div style={{ flex:1, textAlign:'center', background:'#f0f9ff', border:'2px solid #0891b2', borderRadius:8, padding:12 }}>
                  <div style={{ fontSize:'2.2em', color:C_MA, fontWeight:700 }}>吗</div>
                  <div style={{ color:C_MA, fontWeight:600 }}>ma</div>
                  <div style={{ color:'#555', fontSize:12, marginTop:2 }}>{t('neytral ton','нейтр. тон','neutral tone')}</div>
                  <div style={{ marginTop:6, color:C_MA, fontWeight:600, fontSize:14 }}>{t('…mi? (ha/yo\'q savol)','…ли? (вопрос да/нет)','…? (yes/no question)')}</div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ marginTop:10 }}>
                💡 {t(
                  "吗 — yangi savol beradi: «Sen talabamisanmi?» 呢 — avvalgi gapni qaytaradi: «Men talabaman. Sizchi?» Ikkalasi gap oxiriga qo'yiladi, lekin vazifasi boshqa!",
                  "吗 — задаёт новый вопрос: «Ты студент?» 呢 — возвращает предыдущий контекст: «Я студент. А вы?» Обе частицы ставятся в конец, но функции разные!",
                  "吗 asks a new question: \"Are you a student?\" 呢 bounces back the previous context: \"I'm a student. And you?\" Both go at the end, but serve different purposes!",
                )}
              </p>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color:C_SUB,  uz:'Ega (kim/nima?)',     ru:'Подлежащее (кто/что?)', en:'Subject (who/what?)' },
                  { color:C_SHI,  uz:"是 (bo'lmoq)",        ru:'是 (быть)',              en:'是 (to be)' },
                  { color:C_NE,   uz:'呢 (…chi?)',          ru:'呢 (…а вы?)',            en:'呢 (…and you?)' },
                  { color:C_PRED, uz:'Xabar / Fe\'l',       ru:'Сказуемое / Глагол',    en:'Predicate / Verb' },
                  { color:C_MA,   uz:'吗 (…mi?)',           ru:'吗 (…ли?)',              en:'吗 (yes/no?)' },
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
            {/* Pattern 1 — Bounce-back with statement */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-shablon — Gapdan keyin qaytarish','Шаблон 1 — Переспрос после утверждения','Pattern 1 — Bounce-back After Statement')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_PRED, fontWeight:700 }}>{t('Darak gap','Утверждение','Statement')}</span>
                {' + '}
                <span style={{ color:C_SUB, fontWeight:700 }}>你 / 他 / 她</span>
                {' '}
                <span style={{ color:C_NE, fontWeight:700 }}>呢？</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t("Avval o'z gapingizni aytasiz, keyin suhbatdoshga qaytarasiz","Сначала говорите своё утверждение, затем переадресуете собеседнику","First state your own situation, then redirect to the other person")}
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
                  "呢 doimo gap oxirida turadi, undan keyin savol belgisi qo'yiladi.",
                  "呢 всегда стоит в конце предложения, после него — вопросительный знак.",
                  "呢 always comes at the end of the sentence, followed by a question mark.",
                )}
              </p>
            </div>

            {/* Pattern 2 — Standalone bounce-back */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Mustaqil qaytarish','Шаблон 2 — Самостоятельный переспрос','Pattern 2 — Standalone Bounce-back')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>{t('Ega / Ism','Подлежащее / Сущ.','Subject / Noun')}</span>
                {' '}
                <span style={{ color:C_NE, fontWeight:700 }}>呢？</span>
              </div>
              <p className="grammar-block__formula-desc">
                {t(
                  "Kontekstdan tushunilganda darak gapsiz ham ishlatiladi: «Ular-chi?» «O'qituvchi-chi?»",
                  "Когда понятно из контекста, можно без утверждения: «А они?» «А учитель?»",
                  "When understood from context, can be used without a statement: \"And them?\" \"And the teacher?\"",
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

            {/* Pattern 3 — 呢 vs 吗 comparison */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — 呢 va 吗 farqi','Шаблон 3 — Разница 呢 и 吗','Pattern 3 — 呢 vs 吗 Difference')}</div>
              <p className="grammar-block__formula-desc">
                {t(
                  "吗 — yangi ha/yo'q savol beradi. 呢 — kontekstdan qaytarish savoli. Ikkalasi gap oxirida turadi, lekin vazifasi boshqa:",
                  "吗 — задаёт новый вопрос да/нет. 呢 — переспрос из контекста. Обе в конце предложения, но с разными функциями:",
                  "吗 asks a new yes/no question. 呢 redirects from context. Both go at the end, but serve different purposes:",
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
                  "吗 — to'liq savol yaratadi (ha/yo'q javob). 呢 — faqat qaytarish (javob kontekstga bog'liq).",
                  "吗 — создаёт полный вопрос (ответ да/нет). 呢 — только переспрос (ответ зависит от контекста).",
                  "吗 creates a full question (yes/no answer). 呢 only bounces back (answer depends on context).",
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
              <div
                key={i}
                role="button"
                tabIndex={0}
                className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                onClick={() => setExpandedEx(expandedEx === i ? null : i)}
              >
                <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:8}}>
                  <button type="button" onPointerDown={e=>{e.stopPropagation();}} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.parts.map((p:{text:string;color:string})=>p.text).join(''));}} style={{width:44,height:44,borderRadius:'50%',background:'#f5f3ff',border:'none',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',padding:0,WebkitTapHighlightColor:'transparent'}} aria-label="Play">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#7c3aed"><path d="M8 5v14l11-7z"/></svg>
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
              <div className="grammar-block__label">{t('Dialog 1 — Tanishuv','Диалог 1 — Знакомство','Dialogue 1 — Getting to Know Each Other')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#f5f3ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_NE:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Ichimliklar haqida','Диалог 2 — О напитках','Dialogue 2 — About Drinks')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#f5f3ff' : undefined }}
                >
                  <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_NE:C_SHI,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
                  parts:[{text:'我很好。',color:C_PRED},{text:'你',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
                  note: t("呢 qaytarish uchun: Men yaxshiman → Sizchi?","呢 для переспроса: У меня хорошо → А у вас?","呢 to bounce back: I'm fine → And you?"),
                },
                {
                  parts:[{text:'他们',color:C_SUB},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
                  note: t("Mustaqil qaytarish: Ular-chi? (kontekstdan tushuniladi)","Самостоятельный переспрос: А они? (понятно из контекста)","Standalone bounce-back: And them? (understood from context)"),
                },
                {
                  parts:[{text:'咖啡',color:C_PRED},{text:'呢',color:C_NE},{text:'？',color:C_PUNC}],
                  note: t("Narsa haqida qaytarish: Qahva-chi?","Переспрос о предмете: А кофе?","Bounce-back about a thing: And coffee?"),
                },
              ] as { parts: Part[]; note: string }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:'3px solid #7c3aed', background:'#f5f3ff' }}
                >
                  <div className="grammar-block__usage-zh">
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color:'#4c1d95' }}>
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
