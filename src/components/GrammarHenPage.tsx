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

const C_SUB  = '#3b82f6'; // Subject / Ega
const C_HEN  = '#b45309'; // 很 (amber)
const C_ADJ  = '#16a34a'; // Adjective / Sifat
const C_NEG  = '#ea580c'; // 不 negation
const C_MA   = '#0891b2'; // 吗 question
const C_PUNC = '#888';    // Punctuation

const speakingQuestionsData = [
  { uz: 'U juda chiroyli.', ru: 'Она очень красивая.', en: 'She is very beautiful.', zh: '她很漂亮。', pinyin: 'Tā hěn piàoliang.' },
  { uz: 'Men juda xursandman.', ru: 'Я очень рад.', en: 'I am very happy.', zh: '我很高兴。', pinyin: 'Wǒ hěn gāoxìng.' },
  { uz: 'Bu kitob juda qiziqarli.', ru: 'Эта книга очень интересная.', en: 'This book is very interesting.', zh: '这本书很有意思。', pinyin: 'Zhè běn shū hěn yǒu yìsi.' },
  { uz: 'Bugun ob-havo juda yaxshi.', ru: 'Сегодня погода очень хорошая.', en: 'The weather is very good today.', zh: '今天天气很好。', pinyin: 'Jīntiān tiānqì hěn hǎo.' },
  { uz: 'Xitoy tili juda qiyin emas.', ru: 'Китайский язык не очень сложный.', en: 'Chinese is not very difficult.', zh: '中文不很难。', pinyin: 'Zhōngwén bù hěn nán.' },
  { uz: 'U juda bandmi?', ru: 'Он очень занят?', en: 'Is he very busy?', zh: '他很忙吗？', pinyin: 'Tā hěn máng ma?' },
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
    parts: [{ text:'她',color:C_SUB },{ text:'很',color:C_HEN },{ text:'漂亮',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Tā hěn piàoliang.', uz:'U juda chiroyli.', ru:'Она очень красивая.', en:'She is very beautiful.',
    note_uz:'她 (tā) = u (ayol) · 漂亮 (piàoliang) = chiroyli',
    note_ru:'她 (tā) = она · 漂亮 (piàoliang) = красивая',
    note_en:'她 (tā) = she · 漂亮 (piàoliang) = beautiful',
  },
  {
    parts: [{ text:'我',color:C_SUB },{ text:'很',color:C_HEN },{ text:'高兴',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Wǒ hěn gāoxìng.', uz:'Men juda xursandman.', ru:'Я очень рад.', en:'I am very happy.',
    note_uz:'高兴 (gāoxìng) = xursand, xushvaqt',
    note_ru:'高兴 (gāoxìng) = радостный, довольный',
    note_en:'高兴 (gāoxìng) = happy, glad',
  },
  {
    parts: [{ text:'今天',color:C_SUB },{ text:'很',color:C_HEN },{ text:'热',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Jīntiān hěn rè.', uz:'Bugun juda issiq.', ru:'Сегодня очень жарко.', en:'Today is very hot.',
    note_uz:'今天 (jīntiān) = bugun · 热 (rè) = issiq',
    note_ru:'今天 (jīntiān) = сегодня · 热 (rè) = жарко',
    note_en:'今天 (jīntiān) = today · 热 (rè) = hot',
  },
  {
    parts: [{ text:'这本书',color:C_SUB },{ text:'很',color:C_HEN },{ text:'有意思',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Zhè běn shū hěn yǒu yìsi.', uz:'Bu kitob juda qiziqarli.', ru:'Эта книга очень интересная.', en:'This book is very interesting.',
    note_uz:'这本书 (zhè běn shū) = bu kitob · 有意思 (yǒu yìsi) = qiziqarli',
    note_ru:'这本书 (zhè běn shū) = эта книга · 有意思 (yǒu yìsi) = интересный',
    note_en:'这本书 (zhè běn shū) = this book · 有意思 (yǒu yìsi) = interesting',
  },
  {
    parts: [{ text:'他',color:C_SUB },{ text:'不',color:C_NEG },{ text:'很',color:C_HEN },{ text:'高',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Tā bù hěn gāo.', uz:'U unchalik baland emas.', ru:'Он не очень высокий.', en:'He is not very tall.',
    note_uz:'不 (bù) = emas · 高 (gāo) = baland',
    note_ru:'不 (bù) = не · 高 (gāo) = высокий',
    note_en:'不 (bù) = not · 高 (gāo) = tall',
  },
  {
    parts: [{ text:'你',color:C_SUB },{ text:'很',color:C_HEN },{ text:'忙',color:C_ADJ },{ text:'吗？',color:C_MA }],
    pinyin:'Nǐ hěn máng ma?', uz:'Siz juda bandmisiz?', ru:'Вы очень заняты?', en:'Are you very busy?',
    note_uz:'忙 (máng) = band · 吗 (ma) = savol yuklamasi',
    note_ru:'忙 (máng) = занятый · 吗 (ma) = вопросительная частица',
    note_en:'忙 (máng) = busy · 吗 (ma) = question particle',
  },
  {
    parts: [{ text:'中文',color:C_SUB },{ text:'很',color:C_HEN },{ text:'难',color:C_ADJ },{ text:'吗？',color:C_MA }],
    pinyin:'Zhōngwén hěn nán ma?', uz:'Xitoy tili juda qiyinmi?', ru:'Китайский очень сложный?', en:'Is Chinese very difficult?',
    note_uz:'中文 (Zhōngwén) = xitoy tili · 难 (nán) = qiyin',
    note_ru:'中文 (Zhōngwén) = китайский язык · 难 (nán) = сложный',
    note_en:'中文 (Zhōngwén) = Chinese (language) · 难 (nán) = difficult',
  },
  {
    parts: [{ text:'今天天气',color:C_SUB },{ text:'很',color:C_HEN },{ text:'好',color:C_ADJ },{ text:'。',color:C_PUNC }],
    pinyin:'Jīntiān tiānqì hěn hǎo.', uz:'Bugun ob-havo juda yaxshi.', ru:'Сегодня погода очень хорошая.', en:'The weather is very good today.',
    note_uz:'天气 (tiānqì) = ob-havo · 好 (hǎo) = yaxshi',
    note_ru:'天气 (tiānqì) = погода · 好 (hǎo) = хороший',
    note_en:'天气 (tiānqì) = weather · 好 (hǎo) = good',
  },
];

type PatternRow = { parts: Part[]; py: string; uz: string; ru: string; en: string };

// Pattern 1: A 很 Adj (basic)
const pattern1Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'很',color:C_HEN},{text:'好',color:C_ADJ},{text:'。',color:C_PUNC}],  py:'Wǒ hěn hǎo.',        uz:'Men yaxshiman.',          ru:'Я в порядке.',         en:'I am fine.' },
  { parts:[{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'漂亮',color:C_ADJ},{text:'。',color:C_PUNC}],  py:'Tā hěn piàoliang.',  uz:'U juda chiroyli.',        ru:'Она очень красивая.',  en:'She is very beautiful.' },
  { parts:[{text:'今天',color:C_SUB},{text:'很',color:C_HEN},{text:'冷',color:C_ADJ},{text:'。',color:C_PUNC}],  py:'Jīntiān hěn lěng.',  uz:'Bugun juda sovuq.',       ru:'Сегодня очень холодно.', en:'Today is very cold.' },
  { parts:[{text:'中文',color:C_SUB},{text:'很',color:C_HEN},{text:'难',color:C_ADJ},{text:'。',color:C_PUNC}],  py:'Zhōngwén hěn nán.',  uz:'Xitoy tili juda qiyin.',  ru:'Китайский очень сложный.', en:'Chinese is very difficult.' },
];

// Pattern 2: A 不 很 Adj (negation)
const pattern2Rows: PatternRow[] = [
  { parts:[{text:'我',color:C_SUB},{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'忙',color:C_ADJ},{text:'。',color:C_PUNC}],    py:'Wǒ bù hěn máng.',      uz:'Men unchalik band emasman.',   ru:'Я не очень занят.',            en:'I am not very busy.' },
  { parts:[{text:'他',color:C_SUB},{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'高',color:C_ADJ},{text:'。',color:C_PUNC}],    py:'Tā bù hěn gāo.',       uz:'U unchalik baland emas.',      ru:'Он не очень высокий.',         en:'He is not very tall.' },
  { parts:[{text:'今天',color:C_SUB},{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'热',color:C_ADJ},{text:'。',color:C_PUNC}],  py:'Jīntiān bù hěn rè.',   uz:'Bugun unchalik issiq emas.',   ru:'Сегодня не очень жарко.',      en:'Today is not very hot.' },
];

// Pattern 3: A 很 Adj 吗？ (question)
const pattern3Rows: PatternRow[] = [
  { parts:[{text:'你',color:C_SUB},{text:'很',color:C_HEN},{text:'忙',color:C_ADJ},{text:'吗？',color:C_MA}],    py:'Nǐ hěn máng ma?',       uz:'Siz juda bandmisiz?',      ru:'Вы очень заняты?',           en:'Are you very busy?' },
  { parts:[{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'高兴',color:C_ADJ},{text:'吗？',color:C_MA}],  py:'Tā hěn gāoxìng ma?',    uz:'U juda xursandmi?',        ru:'Она очень рада?',            en:'Is she very happy?' },
  { parts:[{text:'中文',color:C_SUB},{text:'很',color:C_HEN},{text:'难',color:C_ADJ},{text:'吗？',color:C_MA}],  py:'Zhōngwén hěn nán ma?',  uz:'Xitoy tili juda qiyinmi?', ru:'Китайский очень сложный?',   en:'Is Chinese very difficult?' },
];

const dialog1: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你好！今天天气',color:C_SUB},{text:'很',color:C_HEN},{text:'好',color:C_ADJ},{text:'。',color:C_PUNC}],                      py:'Nǐ hǎo! Jīntiān tiānqì hěn hǎo.',    uz:'Salom! Bugun ob-havo juda yaxshi.',       ru:'Привет! Сегодня погода очень хорошая.',    en:'Hi! The weather is very nice today.' },
  { s:'B', parts:[{text:'是的。你',color:C_SUB},{text:'很',color:C_HEN},{text:'高兴',color:C_ADJ},{text:'吗？',color:C_MA}],                           py:'Shì de. Nǐ hěn gāoxìng ma?',          uz:'Ha. Siz juda xursandmisiz?',              ru:'Да. Вы очень рады?',                      en:'Yes. Are you very happy?' },
  { s:'A', parts:[{text:'是的，我',color:C_SUB},{text:'很',color:C_HEN},{text:'高兴',color:C_ADJ},{text:'。你呢？',color:C_PUNC}],                     py:'Shì de, wǒ hěn gāoxìng. Nǐ ne?',     uz:'Ha, men juda xursandman. Sizchi?',        ru:'Да, я очень рад. А вы?',                  en:'Yes, I am very happy. And you?' },
  { s:'B', parts:[{text:'我也',color:C_SUB},{text:'很',color:C_HEN},{text:'高兴',color:C_ADJ},{text:'。',color:C_PUNC}],                               py:'Wǒ yě hěn gāoxìng.',                  uz:'Men ham juda xursandman.',                ru:'Я тоже очень рад.',                       en:'I am also very happy.' },
];

const dialog2: { s: string; parts: Part[]; py: string; uz: string; ru: string; en: string }[] = [
  { s:'A', parts:[{text:'你',color:C_SUB},{text:'很',color:C_HEN},{text:'忙',color:C_ADJ},{text:'吗？',color:C_MA}],                                   py:'Nǐ hěn máng ma?',                     uz:'Siz juda bandmisiz?',                    ru:'Вы очень заняты?',                        en:'Are you very busy?' },
  { s:'B', parts:[{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'忙',color:C_ADJ},{text:'。你呢？',color:C_PUNC}],                             py:'Bù hěn máng. Nǐ ne?',                 uz:'Unchalik emas. Sizchi?',                  ru:'Не очень. А вы?',                         en:'Not very busy. And you?' },
  { s:'A', parts:[{text:'我',color:C_SUB},{text:'很',color:C_HEN},{text:'忙',color:C_ADJ},{text:'。中文',color:C_SUB},{text:'很',color:C_HEN},{text:'难',color:C_ADJ},{text:'。',color:C_PUNC}], py:'Wǒ hěn máng. Zhōngwén hěn nán.', uz:'Men juda bandman. Xitoy tili juda qiyin.', ru:'Я очень занят. Китайский очень сложный.', en:'I am very busy. Chinese is very difficult.' },
  { s:'B', parts:[{text:'中文',color:C_SUB},{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'难',color:C_ADJ},{text:'！',color:C_PUNC}],         py:'Zhōngwén bù hěn nán!',                uz:'Xitoy tili unchalik qiyin emas!',         ru:'Китайский не очень сложный!',              en:'Chinese is not very difficult!' },
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

export function GrammarHenPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const { getStars, saveStars } = useStars('grammar');
  const handleQuizComplete = ({ scores, shadowingUsed }: { scores: import('./SpeakingMashq').Score[]; shadowingUsed: boolean }) => {
    const newStars = calculateStars(scores, shadowingUsed);
    const existing = getStars('hen');
    if (existing === undefined || newStars > existing) saveStars('hen', newStars);
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
        <div className="dr-hero__watermark">很</div>
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
          <h1 className="dr-hero__title">很</h1>
          <div className="dr-hero__pinyin">hěn</div>
          <div className="dr-hero__translation">
            — {t('juda / …dir', 'очень', 'very')} —
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
                <div className="grammar-block__big-char">很</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">hěn</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Ton','Тон','Tone')}</span>
                    <span className="grammar-block__tone">{t('3-ton (pasayib-ko\'tariluvchi) ˇ','3-й тон (низкий восходящий) ˇ','3rd tone (dipping) ˇ')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t("Ma'nosi",'Перевод','Meaning')}</span>
                    <span className="grammar-block__info-val">{t('juda, …dir','очень','very')}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{t('Chiziqlar','Черт','Strokes')}</span>
                    <span className="grammar-block__info-val">9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What it is */}
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{t('很 nima?','很 — что это?','What is 很?')}</div>
              <p className="grammar-block__tip-text">
                <strong style={{ color: C_HEN }}>很</strong> = <strong>{t('juda','очень','very')}</strong><br />
                {t(
                  'Sifat oldiga qo\'yiladi. Xitoy tilida "U chiroyli" deyish uchun ham 很 kerak — aks holda gap chala bo\'ladi.',
                  'Ставится перед прилагательным. В китайском для "Она красивая" тоже нужен 很 — без него предложение звучит незавершённым.',
                  'Placed before an adjective. In Chinese, even "She is pretty" needs 很 — without it the sentence sounds incomplete.',
                )}
              </p>
            </div>

            {/* Key rule: 很 as neutral copula */}
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{t('Muhim qoida','Важное правило','Key Rule')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  'Xitoy tilida 是 sifat oldida ishlatilmaydi. "U chiroyli" deyish uchun 很 kerak:',
                  'В китайском 是 не ставится перед прилагательными. Для "Она красивая" нужен 很:',
                  'In Chinese, 是 is not used before adjectives. To say "She is pretty", you need 很:',
                )}
              </p>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-py">Tā hěn piàoliang.</div>
                <div className="grammar-block__usage-zh">
                  <ColorParts parts={[{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'漂亮',color:C_ADJ},{text:'。',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('U (juda) chiroyli.','Она (очень) красивая.','She is (very) pretty.')}</div>
              </div>
              <div className="grammar-block__usage-item" style={{ background:'#fee2e2' }}>
                <div className="grammar-block__usage-zh" style={{ textDecoration:'line-through', color:'#991b1b' }}>她是漂亮。</div>
                <div className="grammar-block__usage-py" style={{ color:'#991b1b' }}>
                  ✗ {t('Sifat oldida 是 ishlatilmaydi!','是 не ставится перед прилагательными!','是 is not used before adjectives!')}
                </div>
              </div>
            </div>

            {/* Neutral vs emphatic */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Neytral va kuchli ma\'no','Нейтральное и усиленное значение','Neutral vs Emphatic')}</div>
              <p className="grammar-block__tip-text">
                {t(
                  '很 odatda "juda" emas, balki neytral bog\'lovchi vazifasini bajaradi. "Juda" demoqchi bo\'lsangiz, 很 ni ta\'kidlab aytasiz.',
                  '很 обычно не значит "очень", а служит нейтральной связкой. Чтобы сказать именно "очень", нужно выделить 很 интонацией.',
                  '很 usually does not mean "very" — it acts as a neutral link. To truly mean "very", stress 很 with intonation.',
                )}
              </p>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh">
                  <ColorParts parts={[{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'漂亮',color:C_ADJ},{text:'。',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('U chiroyli. (neytral)','Она красивая. (нейтрально)','She is pretty. (neutral)')}</div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh">
                  <ColorParts parts={[{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'漂亮',color:C_ADJ},{text:'！',color:C_PUNC}]} />
                </div>
                <div className="grammar-block__usage-tr">{t('U JUDA chiroyli! (ta\'kidlangan)','Она ОЧЕНЬ красивая! (с ударением)','She is VERY beautiful! (stressed)')}</div>
              </div>
            </div>

            {/* Color legend */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('Rang belgilari','Цветовые обозначения','Color Legend')}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {([
                  { color: C_SUB,  uz:'Ega (kim/nima?)',      ru:'Подлежащее (кто/что?)',  en:'Subject (who/what?)' },
                  { color: C_HEN,  uz:'很 (juda)',              ru:'很 (очень)',               en:'很 (very)' },
                  { color: C_ADJ,  uz:'Sifat (qanday?)',       ru:'Прилагательное (какой?)', en:'Adjective (what kind?)' },
                  { color: C_NEG,  uz:'不 (emas)',              ru:'不 (отрицание)',            en:'不 (negation)' },
                  { color: C_MA,   uz:'吗 (savol)',             ru:'吗 (вопрос)',               en:'吗 (question)' },
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
            {/* Pattern 1: A 很 Adj */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('1-shablon — A (juda) Adj','Шаблон 1 — A (очень) Adj','Pattern 1 — A (very) Adj')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#fef3c7', color:C_HEN }}>很</span>
                {' '}
                <span style={{ color:C_ADJ, fontWeight:700 }}>Adj</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">{t('A juda Adj (A — Adj dir)','A очень Adj','A is (very) Adj')}</p>
              {pattern1Rows.map((r, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-py">{r.py}</div>
                  <div className="grammar-block__usage-zh"><ColorParts parts={r.parts} /></div>
                  <div className="grammar-block__usage-tr">{t(r.uz, r.ru, r.en)}</div>
                </div>
              ))}
            </div>

            {/* Pattern 2: A 不很 Adj (negation) */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('2-shablon — Inkor (不很)','Шаблон 2 — Отрицание (不很)','Pattern 2 — Negation (不很)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-neg">不</span>
                <span className="grammar-block__formula-verb" style={{ background:'#fef3c7', color:C_HEN }}>很</span>
                {' '}
                <span style={{ color:C_ADJ, fontWeight:700 }}>Adj</span>
                {'。'}
              </div>
              <p className="grammar-block__formula-desc">
                {t('A unchalik Adj emas','A не очень Adj','A is not very Adj')}
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
                  '不 doim 很 oldiga qo\'yiladi, sifat oldiga emas.',
                  '不 всегда ставится перед 很, а не перед прилагательным.',
                  '不 always goes before 很, not before the adjective.',
                )}
              </p>
            </div>

            {/* Pattern 3: A 很 Adj 吗？ */}
            <div className="grammar-block">
              <div className="grammar-block__label">{t('3-shablon — Savol (吗)','Шаблон 3 — Вопрос (吗)','Pattern 3 — Question (吗)')}</div>
              <div className="grammar-block__formula">
                <span style={{ color:C_SUB, fontWeight:700 }}>A</span>
                {' '}
                <span className="grammar-block__formula-verb" style={{ background:'#fef3c7', color:C_HEN }}>很</span>
                {' '}
                <span style={{ color:C_ADJ, fontWeight:700 }}>Adj</span>
                {' '}
                <span className="grammar-block__formula-ma">吗</span>
                {'？'}
              </div>
              <p className="grammar-block__formula-desc">
                {t("Gap oxiriga 吗 qo'shilsa — savol.",'Добавьте 吗 в конец — получится вопрос.','Add 吗 at the end to form a question.')}
              </p>
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
            <div className="grammar-block__label">{t('Namuna gaplar','Примеры предложений','Example Sentences')}</div>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#b45309"><path d="M8 5v14l11-7z"/></svg>
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
              <div className="grammar-block__label">{t('Dialog 1 — Ob-havo','Диалог 1 — Погода','Dialogue 1 — Weather')}</div>
              {dialog1.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev1, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev1[i] ? '#fffbeb' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_HEN,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Dialog 2 — Bandlik','Диалог 2 — Занятость','Dialogue 2 — Being Busy')}</div>
              {dialog2.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  className="grammar-block__usage-item grammar-block__usage-item--tap"
                  onClick={() => toggleRev(setRev2, i)}
                  style={{ width:'100%', textAlign:'left', cursor:'pointer', background: rev2[i] ? '#fffbeb' : undefined }}
                >
                                                      <div style={{display:"flex",gap:6,alignItems:"flex-start"}}>
                    <span style={{fontWeight:700,color:line.s==='A'?C_SUB:C_HEN,flexShrink:0,paddingTop:3}}>{line.s}:</span>
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
              <div className="grammar-block__label">{t('Eslab qoling','Запомните','Remember')}</div>
              {([
                {
                  parts: [{text:'她',color:C_SUB},{text:'很',color:C_HEN},{text:'漂亮',color:C_ADJ},{text:'。',color:C_PUNC}],
                  note: t('U chiroyli. (很 majburiy)','Она красивая. (很 обязателен)','She is pretty. (很 required)'),
                  ok: true,
                },
                {
                  parts: [{text:'她漂亮。',color:'#991b1b'}],
                  note: t('很 ni tushirib bo\'lmaydi!','很 нельзя пропускать!','很 cannot be omitted!'),
                  ok: false,
                },
                {
                  parts: [{text:'她是漂亮。',color:'#991b1b'}],
                  note: t('Sifat oldida 是 ishlatilmaydi!','是 не ставится перед прилагательными!','是 is not used before adjectives!'),
                  ok: false,
                },
                {
                  parts: [{text:'他',color:C_SUB},{text:'不',color:C_NEG},{text:'很',color:C_HEN},{text:'高',color:C_ADJ},{text:'。',color:C_PUNC}],
                  note: t('Inkor uchun 不很 ishlatiladi.','Для отрицания используется 不很.','Use 不很 for negation.'),
                  ok: true,
                },
              ] as { parts: Part[]; note: string; ok: boolean }[]).map((item, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{ borderLeft:`3px solid ${item.ok ? '#16a34a' : '#ef4444'}`, background: item.ok ? '#f0fdf4' : '#fff1f2' }}
                >
                  <div className="grammar-block__usage-zh" style={{ textDecoration: item.ok ? undefined : 'line-through' }}>
                    <ColorParts parts={item.parts} />
                  </div>
                  <div className="grammar-block__usage-note" style={{ color: item.ok ? '#166534' : '#991b1b' }}>
                    {item.ok ? '✓' : '✗'} {item.note}
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
            accentColor="#b45309"
            accentBg="#fef3c7"
            onComplete={handleQuizComplete}
            onDone={() => router.push('/chinese?tab=grammar')}
          />
        )}

      </div>

      <PageFooter />
    </div>
  );
}
