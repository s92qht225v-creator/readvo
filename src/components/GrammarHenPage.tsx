'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparison' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '她很漂亮。', pinyin: 'Tā hěn piàoliang.', uz: 'U chiroyli.', ru: 'Она красивая.', en: 'She is beautiful.', note_uz: '很 bu yerda «juda» emas — shunchaki ega + sifatni bog\'lovchi. Neytral ma\'no.', note_ru: '很 здесь не «очень» — просто нейтральная связка между подлежащим и прилагательным.', note_en: '很 here doesn\'t mean "very" — it\'s just a neutral link between subject and adjective.' },
  { zh: '今天很冷。', pinyin: 'Jīntiān hěn lěng.', uz: 'Bugun sovuq.', ru: 'Сегодня холодно.', en: 'It\'s cold today.', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq → 很 = neytral bog\'lovchi', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный → 很 = нейтральная связка', note_en: '今天 (jīntiān) = today, 冷 (lěng) = cold → 很 = neutral copula' },
  { zh: '这本书很好。', pinyin: 'Zhè běn shū hěn hǎo.', uz: 'Bu kitob yaxshi.', ru: 'Эта книга хорошая.', en: 'This book is good.', note_uz: '很好 = yaxshi (oddiy holat). Agar ta\'kidlash kerak: 非常好 yoki 真好', note_ru: '很好 = хорошо (нейтрально). Для усиления: 非常好 или 真好', note_en: '很好 = good (neutral). To emphasize: 非常好 or 真好' },
  { zh: '他很高。', pinyin: 'Tā hěn gāo.', uz: 'U baland bo\'yli.', ru: 'Он высокий.', en: 'He is tall.', note_uz: '很高 = baland (neytral). Taqqoslash emas — shunchaki sifat.', note_ru: '很高 = высокий (нейтрально). Не сравнение — просто признак.', note_en: '很高 = tall (neutral). Not a comparison — just a description.' },
  { zh: '中国菜很好吃。', pinyin: 'Zhōngguó cài hěn hǎo chī.', uz: 'Xitoy ovqati mazali.', ru: 'Китайская еда вкусная.', en: 'Chinese food is delicious.', note_uz: '好吃 (hǎo chī) = mazali → 很好吃 = mazali (neytral)', note_ru: '好吃 (hǎo chī) = вкусный → 很好吃 = вкусный (нейтрально)', note_en: '好吃 (hǎo chī) = delicious → 很好吃 = delicious (neutral)' },
  { zh: '我很忙。', pinyin: 'Wǒ hěn máng.', uz: 'Men bandman.', ru: 'Я занят.', en: 'I\'m busy.', note_uz: '很忙 = band (neytral). Juda band = 非常忙 yoki 太忙了', note_ru: '很忙 = занят (нейтрально). Очень занят = 非常忙 или 太忙了', note_en: '很忙 = busy (neutral). Very busy = 非常忙 or 太忙了' },
  { zh: '学中文很有意思。', pinyin: 'Xué Zhōngwén hěn yǒu yìsi.', uz: 'Xitoycha o\'rganish qiziqarli.', ru: 'Учить китайский интересно.', en: 'Learning Chinese is interesting.', note_uz: '有意思 = qiziqarli → bu yerda 很 = neytral', note_ru: '有意思 = интересный → здесь 很 = нейтральная связка', note_en: '有意思 = interesting → here 很 = neutral copula' },
  { zh: '妈妈很高兴。', pinyin: 'Māma hěn gāoxìng.', uz: 'Onam xursand.', ru: 'Мама рада.', en: 'Mom is happy.', note_uz: '高兴 (gāoxìng) = xursand → 很 = neytral bog\'lovchi', note_ru: '高兴 (gāoxìng) = радостный → 很 = нейтральная связка', note_en: '高兴 (gāoxìng) = happy → 很 = neutral copula' },
];

const quizQuestions = [
  {
    q_uz: '"Men bandman" xitoycha qanday?',
    q_ru: 'Как сказать "Я занят" по-китайски?',
    q_en: 'How do you say "I\'m busy" in Chinese?',
    options: ['我是忙', '我忙很', '我很忙', '很我忙'],
    correct: 2,
  },
  {
    q_uz: '很 gapda qanday vazifa bajaradi?',
    q_ru: 'Какую роль играет 很 в предложении?',
    q_en: 'What role does 很 play in a sentence?',
    options_uz: ['Fe\'l', 'Ot (noun)', 'Ega + sifat bog\'lovchi', 'Inkor yuklamasi'],
    options_ru: ['Глагол', 'Существительное', 'Связка подлежащего и прилагательного', 'Отрицательная частица'],
    options_en: ['Verb', 'Noun', 'Subject + adjective copula', 'Negative particle'],
    correct: 2,
  },
  {
    q_uz: '"U chiroyli" qanday aytiladi?',
    q_ru: 'Как сказать "Она красивая"?',
    q_en: 'How do you say "She is beautiful"?',
    options: ['她是漂亮', '她很漂亮', '很她漂亮', '她漂亮很'],
    correct: 1,
  },
  {
    q_uz: '很 qanday o\'qiladi?',
    q_ru: 'Как читается 很?',
    q_en: 'How is 很 pronounced?',
    options_uz: ['hén (2-ton)', 'hěn (3-ton)', 'hèn (4-ton)', 'hen (tonsiz)'],
    options_ru: ['hén (2-й тон)', 'hěn (3-й тон)', 'hèn (4-й тон)', 'hen (нейтральный)'],
    options_en: ['hén (2nd tone)', 'hěn (3rd tone)', 'hèn (4th tone)', 'hen (neutral)'],
    correct: 1,
  },
  {
    q_uz: 'Qaysi gapda 很 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 很 использован ПРАВИЛЬНО?',
    q_en: 'In which sentence is 很 used CORRECTLY?',
    options: ['很他高', '他高很', '他很是高', '他很高'],
    correct: 3,
  },
  {
    q_uz: '"Juda sovuq" qanday ta\'kidlanadi?',
    q_ru: 'Как усилить "очень холодно"?',
    q_en: 'How do you emphasize "very cold"?',
    options_uz: ['很冷', '冷很', '非常冷', '不冷'],
    options_ru: ['很冷', '冷很', '非常冷', '不冷'],
    options_en: ['很冷', '冷很', '非常冷', '不冷'],
    correct: 2,
  },
];

export function GrammarHenPage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [activeTab, setActiveTab] = useState('intro');
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  if (isLoading) return <div className="loading-spinner" />;

  const pick = (qi: number, ai: number) => {
    if (!showResults) setAnswers(p => ({ ...p, [qi]: ai }));
  };
  const score = Object.entries(answers).filter(([qi, ai]) => quizQuestions[+qi].correct === +ai).length;
  const allAnswered = Object.keys(answers).length === quizQuestions.length;

  return (
    <div className="grammar-page">
      <div className="grammar-page__hero">
        <div className="grammar-page__hero-bg">很</div>
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">HSK 1 · {({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</div>
          <h1 className="grammar-page__hero-char">很</h1>
          <div className="grammar-page__hero-pinyin">hěn</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'juda / bog\'lovchi', ru: 'очень / связка', en: 'very / copula' } as Record<string, string>)[language]} —</div>
        </div>
      </div>

      <div className="grammar-page__tabs">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`grammar-page__tab ${activeTab === s.id ? 'grammar-page__tab--active' : ''}`}
            type="button"
          >
            {({ uz: s.uz, ru: s.ru, en: s.en } as Record<string, string>)[language]}
          </button>
        ))}
      </div>

      <div className="grammar-page__content">

        {/* ── INTRO ── */}
        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ieroglif', ru: 'Иероглиф', en: 'Character' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">很</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">hěn</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '3-ton (pastga-yuqoriga ↘↗)', ru: '3-й тон (вниз-вверх ↘↗)', en: '3rd tone (dip ↘↗)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'juda; neytral bog\'lovchi', ru: 'очень; нейтральная связка', en: 'very; neutral copula' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">9</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Turi', ru: 'Тип слова', en: 'Word Type' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'Ravish (adverb)', ru: 'Наречие', en: 'Adverb' } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '很 — xitoy tilida eng ko\'p ishlatiladigan ravishlardan biri. Lekin u har doim «juda» degani emas!', ru: '很 — одно из самых частых слов в китайском. Но оно не всегда означает «очень»!', en: '很 is one of the most common words in Chinese. But it doesn\'t always mean "very"!' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  她<span className="grammar-block__highlight">很</span>漂亮。
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'U chiroyli. («juda» emas — shunchaki neytral bog\'lovchi)', ru: 'Она красивая. (не «очень» — просто нейтральная связка)', en: 'She is beautiful. (not "very" — just a neutral copula)' } as Record<string, string>)[language]}
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8 }}>
                {({ uz: 'Xitoy tilida ega va sifat orasiga doimo biror ravish kerak. 很 = eng oddiy, neytral variant.', ru: 'В китайском между подлежащим и прилагательным нужно наречие. 很 — самый нейтральный вариант.', en: 'In Chinese, an adverb is always needed between the subject and adjective. 很 is the most neutral option.' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: '⚡ Kalit tushuncha', ru: 'Ключевое', en: '⚡ Key concept' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Xitoy tilida shunchaki «U baland» deb bo\'lmaydi 很 siz:', ru: 'Нельзя просто сказать «Он высокий» без 很:', en: 'In Chinese, you can\'t just say "He is tall" without 很:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'XATO', ru: 'НЕВЕРНО', en: 'WRONG' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>他高。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Tugallanmagan gap!', ru: 'Незавершённая фраза!', en: 'Incomplete sentence!' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">他<span className="grammar-block__highlight">很</span>高。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'U baland bo\'yli.', ru: 'Он высокий.', en: 'He is tall.' } as Record<string, string>)[language]}</div>
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8, color: '#b45309' }}>
                💡 {({ uz: '他高 很 siz = taqqoslash: «U balandroq (boshqalarga nisbatan)»', ru: '他高 без 很 = сравнение: «Он выше (чем кто-то)»', en: '他高 without 很 = comparison: "He is taller (than someone)"' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy qoida', ru: 'Основное правило', en: 'Basic Rule' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">很</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Xitoy tilida: Ega + Sifat emas, Ega + 很 + Sifat.', ru: 'Не Подлеж. + Прилаг., а Подлеж. + 很 + Прилаг.', en: 'In Chinese: not Subj. + Adj., but Subj. + 很 + Adj.' } as Record<string, string>)[language]}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Neytral: ega + 很 + sifat', ru: '1. Нейтрально: подлеж. + 很 + прилаг.', en: '1. Neutral: subj. + 很 + adj.' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">很</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '很 = neytral bog\'lovchi (ko\'pincha «juda» emas!)', ru: '很 = нейтральная связка (чаще всего не «очень»!)', en: '很 = neutral copula (usually not "very"!)' } as Record<string, string>)[language]}</p>
              {[
                { zh: '他很高。', py: 'Tā hěn gāo.', uz: 'U baland bo\'yli.', ru: 'Он высокий.', en: 'He is tall.' },
                { zh: '这个很好。', py: 'Zhège hěn hǎo.', uz: 'Bu yaxshi.', ru: 'Это хорошее.', en: 'This is good.' },
                { zh: '今天很热。', py: 'Jīntiān hěn rè.', uz: 'Bugun issiq.', ru: 'Сегодня жарко.', en: 'It\'s hot today.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Bu gaplarda 很 = «juda» degani emas. U shunchaki ega va sifatni bog\'laydi — o\'zbekchada kerak emas.', ru: 'В этих предложениях 很 ≠ «очень». Это просто нейтральная связка — в русском она не нужна.', en: 'In these sentences 很 does not mean "very". It simply links the subject and adjective — not needed in English.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Ta\'kidlash: 很 = «juda»', ru: '2. С ударением: 很 = «очень»', en: '2. With emphasis: 很 = "very"' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: 'Agar 很 ni kuchli (stressed) o\'qisangiz — u «juda» ma\'nosini beradi. Yozuvda farq yo\'q — kontekstdan tushuniladi.', ru: 'Если произнести 很 с ударением — оно означает «очень». В письме разница не видна — понятно из контекста.', en: 'If you stress 很 when speaking, it means "very". In writing there\'s no difference — understood from context.' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '这个菜很好吃！', py: 'Zhège cài hěn hǎo chī!', uz: 'Bu ovqat juda mazali!', ru: 'Это блюдо очень вкусное!', en: 'This dish is really delicious!' },
                { zh: '我很喜欢你！', py: 'Wǒ hěn xǐhuan nǐ!', uz: 'Men seni juda yoqtiraman!', ru: 'Ты мне очень нравишься!', en: 'I really like you!' },
                { zh: '他跑得很快。', py: 'Tā pǎo de hěn kuài.', uz: 'U juda tez yuguradi.', ru: 'Он бегает очень быстро.', en: 'He runs very fast.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. Inkor: 不 + sifat (很 tushadi!)', ru: '3. Отрицание: 不 + прилаг. (без 很!)', en: '3. Negation: 不 + adj. (drop 很!)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Inkor gapda 很 ishlatilmaydi!', ru: 'В отрицании 很 не нужно!', en: 'In negation, 很 is not used!' } as Record<string, string>)[language]}</p>
              {[
                { pos: '他很高。', neg: '他不高。', uz: 'U baland. → U baland emas.', ru: 'Он высокий. → Он невысокий.', en: 'He is tall. → He is not tall.' },
                { pos: '今天很冷。', neg: '今天不冷。', uz: 'Bugun sovuq. → Bugun sovuq emas.', ru: 'Сегодня холодно. → Сегодня не холодно.', en: 'It\'s cold today. → It\'s not cold today.' },
                { pos: '这个很贵。', neg: '这个不贵。', uz: 'Bu qimmat. → Bu qimmat emas.', ru: 'Это дорого. → Это недорого.', en: 'This is expensive. → This is not expensive.' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f3ff' }}>
                    <div style={{ fontSize: '0.65em', color: '#7c3aed', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'IJOBIY', ru: 'УТВЕРЖДЕНИЕ', en: 'AFFIRMATIVE' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.pos}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                    <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'INKOR', ru: 'ОТРИЦАНИЕ', en: 'NEGATION' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.neg}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{({ uz: '不很 ham to\'g\'ri', ru: '不很 тоже правильно', en: '不很 is also correct' } as Record<string, string>)[language]}</strong> — {({ uz: 'lekin ma\'nosi boshqa:', ru: 'но другой смысл:', en: 'but with a different meaning:' } as Record<string, string>)[language]}
                  {' '}<span style={{ color: '#1a1a2e' }}>他不高</span> = {({ uz: 'u baland emas', ru: 'он не высокий', en: 'he is not tall' } as Record<string, string>)[language]} |{' '}
                  <span style={{ color: '#1a1a2e' }}>他不很高</span> = {({ uz: 'u juda baland emas', ru: 'он не очень высокий', en: 'he is not very tall' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. Savol: ...吗？', ru: '4. Вопрос: ...吗？', en: '4. Question: ...吗？' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-ma">吗？</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Savol gapda ham 很 tushadi!', ru: 'В вопросе 很 тоже убирается!', en: 'In questions, 很 is also dropped!' } as Record<string, string>)[language]}</p>
              {[
                { q: '你忙吗？', a1: '很忙。', a2: '不忙。', uz: 'Bandmisan? — Bandman. / Band emasman.', ru: 'Ты занят? — Занят. / Не занят.', en: 'Are you busy? — Yes, busy. / Not busy.' },
                { q: '今天冷吗？', a1: '很冷。', a2: '不冷。', uz: 'Bugun sovuqmi? — Sovuq. / Sovuq emas.', ru: 'Сегодня холодно? — Холодно. / Не холодно.', en: 'Is it cold today? — Cold. / Not cold.' },
                { q: '贵吗？', a1: '很贵。', a2: '不贵。', uz: 'Qimmatmi? — Qimmat. / Qimmat emas.', ru: 'Дорого? — Дорого. / Недорого.', en: 'Is it expensive? — Expensive. / Not expensive.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh" style={{ color: '#7c3aed', marginBottom: 6 }}>{x.q}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700 }}>{({ uz: 'HA', ru: 'ДА', en: 'YES' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{x.a1}</div>
                    </div>
                    <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#dc2626', fontWeight: 700 }}>{({ uz: 'YO\'Q', ru: 'НЕТ', en: 'NO' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{x.a2}</div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-tr" style={{ marginTop: 4 }}>{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Savolda: 你忙吗？ (很 yo\'q). Javobda «ha»: 很忙 (很 qaytadi). «Yo\'q»: 不忙 (很 yo\'q).', ru: 'Вопрос: 你忙吗？ (без 很). Ответ «да»: 很忙 (很 возвращается). Ответ «нет»: 不忙 (без 很).', en: 'Question: 你忙吗？ (no 很). Answer "yes": 很忙 (很 returns). "No": 不忙 (no 很).' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. 很 + fe\'l (his-tuyg\'u)', ru: '5. 很 + глагол (чувства)', en: '5. 很 + verb (feelings)' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: '很 ba\'zi fe\'llar bilan ham ishlatiladi — asosan his-tuyg\'u fe\'llari:', ru: '很 используется и с некоторыми глаголами — в основном выражающими чувства:', en: '很 is also used with some verbs — mainly those expressing feelings:' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '我很喜欢。', py: 'Wǒ hěn xǐhuan.', uz: 'Men juda yoqtiraman.', ru: 'Мне очень нравится.', en: 'I really like it.' },
                { zh: '他很想你。', py: 'Tā hěn xiǎng nǐ.', uz: 'U seni juda sog\'inadi.', ru: 'Он очень скучает по тебе.', en: 'He misses you a lot.' },
                { zh: '我很想去。', py: 'Wǒ hěn xiǎng qù.', uz: 'Men juda bormoqchiman.', ru: 'Я очень хочу пойти.', en: 'I really want to go.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── EXAMPLES ── */}
        {activeTab === 'examples' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Namuna gaplar', ru: 'Примеры предложений', en: 'Example Sentences' } as Record<string, string>)[language]}</div>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                  onClick={() => setExpandedEx(expandedEx === i ? null : i)}
                  type="button"
                >
                  <div className="grammar-block__example-zh">{ex.zh}</div>
                  <div className="grammar-block__example-py">{ex.pinyin}</div>
                  <div className="grammar-block__example-tr">{({ uz: ex.uz, ru: ex.ru, en: (ex as any).en || ex.uz } as Record<string, string>)[language]}</div>
                  {expandedEx === i && (
                    <div className="grammar-block__example-note">
                      💡 {({ uz: ex.note_uz, ru: ex.note_ru, en: (ex as any).note_en || ex.note_uz } as Record<string, string | undefined>)[language]}
                    </div>
                  )}
                </button>
              ))}
              <p className="grammar-block__hint">{({ uz: 'Bosing — izoh ko\'rinadi', ru: 'Нажмите — увидите пояснение', en: 'Tap to see explanation' } as Record<string, string>)[language]}</p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Tanishuv', ru: 'Мини-диалог 1: Знакомство', en: 'Mini dialogue 1: Meeting' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你好！你是新同学吗？', py: 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', uz: 'Salom! Sen yangi sinfdoshmisan?', ru: 'Привет! Ты новый одноклассник?', en: 'Hi! Are you the new classmate?' },
                  { speaker: 'B', zh: '是的。这个学校很大！', py: 'Shì de. Zhège xuéxiào hěn dà!', uz: 'Ha. Bu maktab juda katta!', ru: 'Да. Эта школа очень большая!', en: 'Yes. This school is really big!' },
                  { speaker: 'A', zh: '是的，老师们都很好。', py: 'Shì de, lǎoshīmen dōu hěn hǎo.', uz: 'Ha, o\'qituvchilar hammasi yaxshi.', ru: 'Да, учителя все хорошие.', en: 'Yes, all the teachers are great.' },
                  { speaker: 'B', zh: '太好了！我很高兴。', py: 'Tài hǎo le! Wǒ hěn gāoxìng.', uz: 'Ajoyib! Men juda xursandman.', ru: 'Отлично! Я очень рад.', en: 'Wonderful! I\'m very happy.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#7c3aed' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Ob-havo', ru: 'Мини-диалог 2: Погода', en: 'Mini dialogue 2: Weather' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '今天冷吗？', py: 'Jīntiān lěng ma?', uz: 'Bugun sovuqmi?', ru: 'Сегодня холодно?', en: 'Is it cold today?' },
                  { speaker: 'B', zh: '不冷，但是很热。', py: 'Bù lěng, dànshì hěn rè.', uz: 'Sovuq emas, lekin juda issiq.', ru: 'Не холодно, но очень жарко.', en: 'Not cold, but very hot.' },
                  { speaker: 'A', zh: '你渴吗？', py: 'Nǐ kě ma?', uz: 'Chanqadingmi?', ru: 'Ты хочешь пить?', en: 'Are you thirsty?' },
                  { speaker: 'B', zh: '很渴！我们去喝水吧。', py: 'Hěn kě! Wǒmen qù hē shuǐ ba.', uz: 'Juda chanqadim! Suv ichgani boraylik.', ru: 'Очень хочу! Пойдём попьём воды.', en: 'Very thirsty! Let\'s go get some water.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#7c3aed' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ko\'p ishlatiladigan 很 iboralar', ru: 'Частые сочетания с 很', en: 'Common phrases with 很' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '很好', py: 'hěn hǎo', uz: 'yaxshi', ru: 'хорошо', en: 'good' },
                  { zh: '很大', py: 'hěn dà', uz: 'katta', ru: 'большой', en: 'big' },
                  { zh: '很多', py: 'hěn duō', uz: 'ko\'p', ru: 'много', en: 'many' },
                  { zh: '很少', py: 'hěn shǎo', uz: 'kam', ru: 'мало', en: 'few' },
                  { zh: '很忙', py: 'hěn máng', uz: 'band', ru: 'занят', en: 'busy' },
                  { zh: '很冷', py: 'hěn lěng', uz: 'sovuq', ru: 'холодно', en: 'cold' },
                  { zh: '很热', py: 'hěn rè', uz: 'issiq', ru: 'жарко', en: 'hot' },
                  { zh: '很快', py: 'hěn kuài', uz: 'tez', ru: 'быстро', en: 'fast' },
                  { zh: '很高兴', py: 'hěn gāoxìng', uz: 'xursand', ru: 'рад', en: 'happy' },
                  { zh: '很漂亮', py: 'hěn piàoliang', uz: 'chiroyli', ru: 'красивый', en: 'beautiful' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em' }}>{w.zh}</div>
                    <div className="grammar-block__usage-py">{w.py}</div>
                    <div className="grammar-block__usage-tr">{({ uz: w.uz, ru: w.ru, en: (w as any).en || w.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── COMPARE ── */}
        {activeTab === 'compare' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '很 vs 真 vs 非常 vs 太', ru: '很 vs 真 vs 非常 vs 太', en: '很 vs 真 vs 非常 vs 太' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Xitoy tilida daraja bildiruvchi bir necha ravish bor. Kuchi turlicha:', ru: 'В китайском несколько наречий степени. Разная сила:', en: 'Chinese has several degree adverbs with different intensities:' } as Record<string, string>)[language]}
              </p>
              {[
                { word: '很', py: 'hěn', level_uz: 'Neytral / biroz', level_ru: 'Нейтрально / немного', level_en: 'Neutral / slightly', bar: 40, color: '#7c3aed', ex: '他很高。', ex_uz: 'U baland bo\'yli.', ex_ru: 'Он высокий.', ex_en: 'He is tall.' },
                { word: '真', py: 'zhēn', level_uz: 'Haqiqatan', level_ru: 'Действительно', level_en: 'Really / truly', bar: 65, color: '#2563eb', ex: '他真高！', ex_uz: 'U haqiqatan baland!', ex_ru: 'Он действительно высокий!', ex_en: 'He\'s really tall!' },
                { word: '非常', py: 'fēicháng', level_uz: 'Juda / g\'oyat', level_ru: 'Очень / чрезвычайно', level_en: 'Very / extremely', bar: 85, color: '#ea580c', ex: '他非常高！', ex_uz: 'U juda baland!', ex_ru: 'Он очень высокий!', ex_en: 'He\'s very tall!' },
                { word: '太', py: 'tài', level_uz: 'Haddan tashqari', level_ru: 'Слишком / чересчур', level_en: 'Too / excessively', bar: 100, color: '#dc2626', ex: '他太高了！', ex_uz: 'U haddan tashqari baland!', ex_ru: 'Он слишком высокий!', ex_en: 'He\'s too tall!' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 6, border: '1px solid #e0e0e6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: r.color, minWidth: 50, textAlign: 'center' }}>{r.word}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.7em', color: '#888' }}>{r.py} — {({ uz: r.level_uz, ru: r.level_ru, en: (r as any).level_en || r.level_uz } as Record<string, string>)[language]}</div>
                      <div style={{ height: 6, background: '#f0f0f3', borderRadius: 3, marginTop: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.bar}%`, background: r.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-item">
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-tr">{({ uz: r.ex_uz, ru: r.ex_ru, en: (r as any).ex_en || r.ex_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '很 siz sifat = taqqoslash', ru: '很 без прилагательного = сравнение', en: 'Adj. without 很 = comparison' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Agar 很 qo\'ymasangiz — gap taqqoslash ma\'nosini beradi:', ru: 'Если убрать 很 — предложение приобретает смысл сравнения:', en: 'If you omit 很, the sentence implies comparison:' } as Record<string, string>)[language]}
              </p>
              {[
                { with: '他很高。', with_uz: 'U baland bo\'yli. (oddiy fakt)', with_ru: 'Он высокий. (просто факт)', with_en: 'He is tall. (simple fact)', without: '他高。', without_uz: 'U balandroq. (boshqalarga nisbatan)', without_ru: 'Он высокий (чем кто-то). (сравнение)', without_en: 'He is taller. (compared to others)' },
                { with: '今天很冷。', with_uz: 'Bugun sovuq. (oddiy fakt)', with_ru: 'Сегодня холодно. (просто факт)', with_en: 'It\'s cold today. (simple fact)', without: '今天冷。', without_uz: 'Bugun sovuqroq. (nisbatan)', without_ru: 'Сегодня холоднее. (сравнение)', without_en: 'It\'s colder today. (comparison)' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <div style={{ fontSize: '0.65em', color: '#7c3aed', fontWeight: 700, marginBottom: 3 }}>{({ uz: '很 BILAN', ru: 'С 很', en: 'WITH 很' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.with}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.with_uz, ru: x.with_ru, en: (x as any).with_en || x.with_uz } as Record<string, string>)[language]}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.65em', color: '#d97706', fontWeight: 700, marginBottom: 3 }}>{({ uz: '很 SIZ', ru: 'Без 很', en: 'WITHOUT 很' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.without}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.without_uz, ru: x.without_ru, en: (x as any).without_en || x.without_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: '很 vs 是', ru: '很 vs 是', en: '很 vs 是' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                ⚠️ {({ uz: 'Ko\'p o\'rganuvchilar xato qiladi: sifat bilan 是 emas, 很 ishlatiladi!', ru: 'Частая ошибка: с прилагательными используется 很, а не 是!', en: 'Common mistake: use 很 with adjectives, not 是!' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'XATO', ru: 'ОШИБКА', en: 'ERROR' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>他<span style={{ color: '#ef4444' }}>是</span>高。</div>
                  <div className="grammar-block__usage-tr">{({ uz: '是 = ot bilan', ru: '是 = с существительным', en: '是 = with nouns' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">他<span className="grammar-block__highlight">很</span>高。</div>
                  <div className="grammar-block__usage-tr">{({ uz: '很 = sifat bilan', ru: '很 = с прилагательным', en: '很 = with adjectives' } as Record<string, string>)[language]}</div>
                </div>
              </div>
              <p className="grammar-block__tip-text">
                <strong>是</strong> = {({ uz: 'ot bilan: ', ru: 'с существительным: ', en: 'with nouns: ' } as Record<string, string>)[language]}他<strong>是</strong>老师。 ({({ uz: 'U o\'qituvchi.', ru: 'Он учитель.', en: 'He is a teacher.' } as Record<string, string>)[language]})
                {'  '}
                <strong>很</strong> = {({ uz: 'sifat bilan: ', ru: 'с прилагательным: ', en: 'with adjectives: ' } as Record<string, string>)[language]}他<strong>很</strong>高。 ({({ uz: 'U baland bo\'yli.', ru: 'Он высокий.', en: 'He is tall.' } as Record<string, string>)[language]})
              </p>
            </div>
          </>
        )}

        {/* ── QUIZ ── */}
        {activeTab === 'quiz' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{({ uz: 'O\'zingizni sinang', ru: 'Проверьте себя', en: 'Test Yourself' } as Record<string, string>)[language]}</div>
            {quizQuestions.map((q, qi) => {
              const opts = 'options' in q ? q.options : ({ uz: q.options_uz, ru: q.options_ru, en: (q as any).options_en || q.options_uz } as Record<string, string[]>)[language]!;
              return (
                <div key={qi} className="grammar-quiz__question">
                  <div className="grammar-quiz__q">
                    {qi + 1}. {({ uz: q.q_uz, ru: q.q_ru, en: (q as any).q_en || q.q_uz } as Record<string, string>)[language]}
                  </div>
                  <div className="grammar-quiz__options">
                    {(opts as string[]).map((opt, ai) => {
                      const sel = answers[qi] === ai;
                      const correct = q.correct === ai;
                      let cls = 'grammar-quiz__option';
                      if (showResults && sel && correct) cls += ' grammar-quiz__option--correct';
                      else if (showResults && sel) cls += ' grammar-quiz__option--wrong';
                      else if (showResults && correct) cls += ' grammar-quiz__option--correct';
                      else if (sel) cls += ' grammar-quiz__option--selected';
                      return (
                        <button key={ai} className={cls} onClick={() => pick(qi, ai)} type="button">{opt}</button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!showResults ? (
              <button
                className={`grammar-quiz__submit ${allAnswered ? 'grammar-quiz__submit--ready' : ''}`}
                onClick={() => { if (allAnswered) setShowResults(true); }}
                type="button"
              >
                {allAnswered
                  ? (({ uz: 'Tekshirish', ru: 'Проверить', en: 'Check' } as Record<string, string>)[language])
                  : `${Object.keys(answers).length} / ${quizQuestions.length} ${({ uz: 'tanlandi', ru: 'выбрано', en: 'selected' } as Record<string, string>)[language]}`}
              </button>
            ) : (
              <div className={`grammar-quiz__result ${score === quizQuestions.length ? 'grammar-quiz__result--perfect' : ''}`}>
                <div className="grammar-quiz__result-emoji">{score === quizQuestions.length ? '🎉' : score >= 4 ? '👍' : '📚'}</div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? (({ uz: 'Ajoyib! Barchasini to\'g\'ri topdingiz!', ru: 'Отлично! Всё правильно!', en: 'Excellent! All correct!' } as Record<string, string>)[language])
                    : score >= 4
                    ? (({ uz: 'Yaxshi! Biroz takrorlang.', ru: 'Хорошо! Повторите немного.', en: 'Good! Review a bit more.' } as Record<string, string>)[language])
                    : (({ uz: 'Darsni qayta ko\'ring.', ru: 'Повторите урок.', en: 'Review the lesson.' } as Record<string, string>)[language])}
                </div>
                <button
                  className="grammar-quiz__retry"
                  onClick={() => { setAnswers({}); setShowResults(false); }}
                  type="button"
                >
                  {({ uz: 'Qayta urinish', ru: 'Попробовать снова', en: 'Try again' } as Record<string, string>)[language]}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
