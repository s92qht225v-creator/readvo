'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const COLOR = '#e11d48';
const COLOR_DARK = '#be123c';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparison' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  {
    zh: '我想吃pizza。',
    pinyin: 'Wǒ xiǎng chī pizza.',
    uz: 'Men pizza yemoqchiman.',
    ru: 'Я хочу есть пиццу.',
    note_uz: '想 + fe\'l (吃) = xohish bildiradi. Pizza = pizza 😄',
    note_ru: '想 + глагол (吃) = желание. 我想吃 = я хочу есть.',
  },
  {
    zh: '她想去北京。',
    pinyin: 'Tā xiǎng qù Běijīng.',
    uz: 'U Pekinga bormoqchi.',
    ru: 'Она хочет поехать в Пекин.',
    note_uz: '想去 = bormoqchi. 北京 (Běijīng) = Pekin.',
    note_ru: '想去 = хочет поехать. 北京 (Běijīng) = Пекин.',
  },
  {
    zh: '我想妈妈。',
    pinyin: 'Wǒ xiǎng māma.',
    uz: 'Men onamni sog\'inaman.',
    ru: 'Я скучаю по маме.',
    note_uz: '想 + inson ismi = sog\'inish. Fe\'l emas — ot bilan.',
    note_ru: '想 + человек = скучать по кому-то. Не глагол после — существительное.',
  },
  {
    zh: '你想我吗？',
    pinyin: 'Nǐ xiǎng wǒ ma?',
    uz: 'Siz meni sog\'inasizmi?',
    ru: 'Ты скучаешь по мне?',
    note_uz: '想 + inson + 吗 = sog\'inish haqida savol.',
    note_ru: '想 + человек + 吗 = вопрос о скуке по кому-то.',
  },
  {
    zh: '我想一想。',
    pinyin: 'Wǒ xiǎng yì xiǎng.',
    uz: 'Men bir oz o\'ylab ko\'raman.',
    ru: 'Дайте мне подумать.',
    note_uz: '想一想 = "xohlamoq"ni ikkilantirish = biroz urinib ko\'rish. Xushmuomalalik iborasi.',
    note_ru: '想一想 = удвоение глагола = попробовать немного. Вежливая фраза.',
  },
  {
    zh: '我不想去。',
    pinyin: 'Wǒ bù xiǎng qù.',
    uz: 'Men bormoqchi emasman.',
    ru: 'Я не хочу идти.',
    note_uz: '不想 = xohlamaslik. Muloyim inkor — 不要 ga nisbatan yumshoqroq.',
    note_ru: '不想 = не хочу. Мягкое отрицание — мягче чем 不要.',
  },
  {
    zh: '你想学什么？',
    pinyin: 'Nǐ xiǎng xué shénme?',
    uz: 'Siz nimani o\'rganmoqchisiz?',
    ru: 'Что вы хотите изучать?',
    note_uz: '想 + fe\'l + 什么 = xohish haqida savol so\'zi bilan savol.',
    note_ru: '想 + глагол + 什么 = вопрос о желании с вопросительным словом.',
  },
  {
    zh: '他想当老师。',
    pinyin: 'Tā xiǎng dāng lǎoshī.',
    uz: 'U o\'qituvchi bo\'lmoqchi.',
    ru: 'Он хочет стать учителем.',
    note_uz: '想当 = bo\'lmoqchi (kelajakdagi kasb orzusi). 当 (dāng) = bo\'lmoq.',
    note_ru: '想当 = хочет стать (мечтает о профессии). 当 (dāng) = быть, стать.',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men uyga bormoqchiman" xitoycha qanday?',
    q_ru: 'Как сказать "Я хочу идти домой"?',
    options: ['我去想家', '我想去家', '我想回家', '想我回家'],
    correct: 2,
  },
  {
    q_uz: '想 + inson = qanday ma\'no?',
    q_ru: '想 + человек = какой смысл?',
    options_uz: ['birovni xohlash', 'birovni sog\'inish', 'birov bilan gaplashish', 'birovni ko\'rish'],
    options_ru: ['хотеть кого-то', 'скучать по кому-то', 'говорить с кем-то', 'видеть кого-то'],
    correct: 1,
  },
  {
    q_uz: '"Men bormoqchi emasman" qanday?',
    q_ru: 'Как сказать "Я не хочу идти"?',
    options: ['我很想去', '我想不去', '我不想去', '我想去不'],
    correct: 2,
  },
  {
    q_uz: '想 qanday o\'qiladi?',
    q_ru: 'Как читается 想?',
    options_uz: ['xiāng (1-ton)', 'xiáng (2-ton)', 'xiǎng (3-ton)', 'xiàng (4-ton)'],
    options_ru: ['xiāng (1-й тон)', 'xiáng (2-й тон)', 'xiǎng (3-й тон)', 'xiàng (4-й тон)'],
    correct: 2,
  },
  {
    q_uz: '想 va 要 farqi nima?',
    q_ru: 'В чём разница между 想 и 要?',
    options_uz: [
      '想 = qat\'iy qaror, 要 = arzu',
      '想 = yumshoq xohish/arzu, 要 = qat\'iy qaror/ehtiyoj',
      'Ikkalasi bir xil ma\'no',
      '想 = inkor, 要 = ijobiy',
    ],
    options_ru: [
      '想 = твёрдое решение, 要 = желание',
      '想 = мягкое желание/мечта, 要 = твёрдое решение/необходимость',
      'Оба имеют одинаковое значение',
      '想 = отрицание, 要 = утверждение',
    ],
    correct: 1,
  },
  {
    q_uz: 'Qaysi gap "Siz Pekinga bormoqchimisiz?" degan savol?',
    q_ru: 'Какое предложение значит "Вы хотите поехать в Пекин?"',
    options: ['你想去北京吗？', '你去北京想吗？', '你想北京去吗？', '想你去北京吗？'],
    correct: 0,
  },
];

export function GrammarXiangPage() {
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
        <div className="grammar-page__hero-bg">想</div>
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
          <div className="grammar-page__hero-char">想</div>
          <div className="grammar-page__hero-pinyin">xiǎng</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'xohlamoq / sog\'inmoq / o\'ylamoq', ru: 'хотеть / скучать / думать', en: 'xohlamoq / sog\'inmoq / o\'ylamoq' } as Record<string, string>)[language]} —</div>
        </div>
      </div>

      <div className="grammar-page__tabs">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`grammar-page__tab ${activeTab === s.id ? 'grammar-page__tab--active' : ''}`}
            style={activeTab === s.id ? { borderBottomColor: COLOR, color: COLOR } : undefined}
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
                <div className="grammar-block__big-char" style={{ color: COLOR }}>想</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">xiǎng</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '3-ton (pastga-yuqoriga ↘↗)', ru: '3-й тон (вниз-вверх ↘↗)', en: '3-ton (pastga-yuqoriga ↘↗)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'xohlamoq; sog\'inmoq; o\'ylamoq', ru: 'хотеть; скучать; думать', en: 'xohlamoq; sog\'inmoq; o\'ylamoq' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">13</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Turi', ru: 'Тип слова', en: 'Word Type' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'Fe\'l / modal fe\'l', ru: 'Глагол / Модальный глагол', en: 'Fe\'l / modal fe\'l' } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '想 ning 3 ta ma\'nosi', ru: '3 значения 想', en: '想 ning 3 ta ma\'nosi' } as Record<string, string>)[language]}</div>
              {[
                {
                  num: '1',
                  color: COLOR,
                  title_uz: 'Xohlamoq (+ fe\'l)',
                  title_ru: 'Хотеть (+ глагол)',
                  zh: '我<span style="color:' + COLOR + '">想</span>吃。',
                  uz: 'Men yemoqchiman.',
                  ru: 'Я хочу есть.',
                },
                {
                  num: '2',
                  color: '#2563eb',
                  title_uz: 'Sog\'inmoq (+ inson)',
                  title_ru: 'Скучать (+ человек)',
                  zh: '我<span style="color:#2563eb">想</span>你。',
                  uz: 'Men seni sog\'inaman.',
                  ru: 'Я скучаю по тебе.',
                },
                {
                  num: '3',
                  color: '#059669',
                  title_uz: 'O\'ylamoq / mulohaza qilmoq',
                  title_ru: 'Думать / размышлять',
                  zh: '我<span style="color:#059669">想</span>一想。',
                  uz: 'Men bir oz o\'ylab ko\'raman.',
                  ru: 'Дайте подумать.',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8, borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                    {item.num}. {({ uz: item.title_uz, ru: item.title_ru, en: (item as any).title_en || item.title_uz } as Record<string, string>)[language]}
                  </div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{({ uz: item.uz, ru: item.ru, en: (item as any).en || item.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Formula 1: Xohish', ru: 'Формула 1: Желание', en: 'Formula 1: Xohish' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>想</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
                {' (+ '}
                <span className="grammar-block__formula-a">{({ uz: 'To\'ldiruvchi', ru: 'Допол.', en: 'To\'ldiruvchi' } as Record<string, string>)[language]}</span>
                {')'}
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: '想 fe\'ldan oldin turadi: u xohish bildiruvchi modal fe\'l.', ru: '想 стоит перед глаголом: это модальный глагол желания.', en: '想 fe\'ldan oldin turadi: u xohish bildiruvchi modal fe\'l.' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '我想睡觉。', py: 'Wǒ xiǎng shuìjiào.', uz: 'Men uxlamoqchiman.', ru: 'Я хочу спать.' },
                { zh: '她想学汉语。', py: 'Tā xiǎng xué Hànyǔ.', uz: 'U xitoy tilini o\'rganmoqchi.', ru: 'Она хочет учить китайский.' },
                { zh: '我们想看电影。', py: 'Wǒmen xiǎng kàn diànyǐng.', uz: 'Biz film ko\'rmoqchimiz.', ru: 'Мы хотим посмотреть фильм.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Formula 2: Sog\'inish', ru: 'Формула 2: Скука по кому-то', en: 'Formula 2: Sog\'inish' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#2563eb', fontWeight: 700 }}>想</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Inson / joy', ru: 'Человек / место', en: 'Person / place' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: '想 dan keyin fe\'l yo\'q — bevosita ob\'ekt (inson yoki joy).', ru: 'После 想 нет глагола — сразу объект (человек или место).', en: '想 dan keyin fe\'l yo\'q — bevosita ob\'ekt (inson yoki joy).' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '我想家。', py: 'Wǒ xiǎng jiā.', uz: 'Men uyimni sog\'inaman.', ru: 'Я скучаю по дому.' },
                { zh: '她想朋友。', py: 'Tā xiǎng péngyou.', uz: 'U do\'stlarini sog\'inadi.', ru: 'Она скучает по друзьям.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: '想 + fe\'l = qilmoqchi; 想 + ot (inson/joy) = sog\'inish.', ru: '想 + глагол = хотеть делать; 想 + существительное (человек/место) = скучать.', en: '想 + fe\'l = qilmoqchi; 想 + ot (inson/joy) = sog\'inish.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Xohish: 想 + fe\'l', ru: '1. Желание: 想 + глагол', en: '1. Xohish: 想 + fe\'l' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>想</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l + To\'ldiruvchi', ru: 'Глагол + Объект', en: 'Fe\'l + To\'ldiruvchi' } as Record<string, string>)[language]}</span>
              </div>
              {[
                { zh: '我想喝水。', py: 'Wǒ xiǎng hē shuǐ.', uz: 'Men suv ichmoqchiman.', ru: 'Я хочу пить воды.' },
                { zh: '她想买新衣服。', py: 'Tā xiǎng mǎi xīn yīfu.', uz: 'U yangi kiyim sotib olmoqchi.', ru: 'Она хочет купить новую одежду.' },
                { zh: '我想休息一下。', py: 'Wǒ xiǎng xiūxi yīxià.', uz: 'Men biroz dam olmoqchiman.', ru: 'Я хочу немного отдохнуть.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Sog\'inish: 想 + inson/joy', ru: '2. Скука: 想 + человек/место', en: '2. Sog\'inish: 想 + inson/joy' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#2563eb', fontWeight: 700 }}>想</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Inson / joy', ru: 'Человек / место', en: 'Person / place' } as Record<string, string>)[language]}</span>
              </div>
              {[
                { zh: '我想你。', py: 'Wǒ xiǎng nǐ.', uz: 'Men seni sog\'inaman.', ru: 'Я скучаю по тебе.' },
                { zh: '我想中国。', py: 'Wǒ xiǎng Zhōngguó.', uz: 'Men Xitoyni sog\'inaman.', ru: 'Я скучаю по Китаю.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. O\'ylamoq (想一想)', ru: '3. Думать (想一想)', en: '3. O\'ylamoq (想一想)' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: '想 ni ikkilantirish mumkin: 想想 yoki 想一想 = "biroz o\'ylab ko\'rish" (muloyim).', ru: '想 можно удвоить: 想想 или 想一想 = "подумать немного" (вежливо).', en: '想 ni ikkilantirish mumkin: 想想 yoki 想一想 = "biroz o\'ylab ko\'rish" (muloyim).' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '我想想。', py: 'Wǒ xiǎng xiǎng.', uz: 'Men o\'ylab ko\'raman.', ru: 'Дайте подумать.' },
                { zh: '让我想一想。', py: 'Ràng wǒ xiǎng yì xiǎng.', uz: 'Menga o\'ylab ko\'rish uchun ruxsat bering.', ru: 'Позвольте мне подумать.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. Inkor: 不想', ru: '4. Отрицание: 不想', en: '4. Inkor: 不想' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不想</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              {[
                { pos: '我想去。', neg: '我不想去。', uz: 'Bormoqchiman. → Bormoqchi emasman.', ru: 'Я хочу идти. → Я не хочу идти.' },
                { pos: '她想吃。', neg: '她不想吃。', uz: 'U yemoqchi. → U yemoqchi emas.', ru: 'Она хочет есть. → Она не хочет есть.' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: `1px solid #fecdd3` }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'IJOBIY', ru: 'УТВЕРЖДЕНИЕ', en: 'IJOBIY' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.pos}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                    <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'INKOR', ru: 'ОТРИЦАНИЕ', en: 'INKOR' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.neg}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block__usage-tr" style={{ marginTop: 6 }}>
                {({ uz: '不想 yumshoqroq, 不要 esa buyruq kabi eshitiladi.', ru: '不想 мягче, чем 不要 (которое звучит как приказ).', en: '不想 yumshoqroq, 不要 esa buyruq kabi eshitiladi.' } as Record<string, string>)[language]}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. 想 bilan savollar', ru: '5. Вопросы с 想', en: '5. 想 bilan savollar' } as Record<string, string>)[language]}</div>
              {[
                {
                  type_uz: '吗 savoli',
                  type_ru: 'Вопрос с 吗',
                  q: '你想来吗？',
                  py: 'Nǐ xiǎng lái ma?',
                  uz: 'Siz kelmoqchimisiz?',
                  ru: 'Вы хотите прийти?',
                },
                {
                  type_uz: 'Qarama-qarshi savol',
                  type_ru: 'Альтернативный вопрос',
                  q: '你想不想来？',
                  py: 'Nǐ xiǎng bù xiǎng lái?',
                  uz: 'Kelmoqchimisiz yoki yo\'qmi?',
                  ru: 'Хотите прийти или нет?',
                },
                {
                  type_uz: 'Savol so\'zi',
                  type_ru: 'Вопросительное слово',
                  q: '你想去哪里？',
                  py: 'Nǐ xiǎng qù nǎlǐ?',
                  uz: 'Siz qayerga bormoqchisiz?',
                  ru: 'Куда вы хотите пойти?',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 600, marginBottom: 4 }}>{({ uz: x.type_uz, ru: x.type_ru, en: (x as any).type_en || x.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ color: COLOR }}>{x.q}</div>
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Dam olish kuni rejalari', ru: 'Мини-диалог 1: Планы на выходные', en: 'Mini dialog 1: Dam olish kuni rejalari' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你周末想做什么？', py: 'Nǐ zhōumò xiǎng zuò shénme?', uz: 'Dam olish kunida nima qilmoqchisiz?', ru: 'Что вы хотите делать в выходные?' },
                  { speaker: 'B', zh: '我想去公园，你呢？', py: 'Wǒ xiǎng qù gōngyuán, nǐ ne?', uz: 'Men parkka bormoqchiman, senchi?', ru: 'Я хочу пойти в парк, а ты?' },
                  { speaker: 'A', zh: '我想在家看电影。', py: 'Wǒ xiǎng zài jiā kàn diànyǐng.', uz: 'Men uyda film ko\'rmoqchiman.', ru: 'Я хочу дома посмотреть кино.' },
                  { speaker: 'B', zh: '那我们一起吧！', py: 'Nà wǒmen yīqǐ ba!', uz: 'Unda birga qilaylik!', ru: 'Тогда давай вместе!' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#2563eb' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: O\'qish', ru: 'Мини-диалог 2: Учёба', en: 'Mini dialog 2: O\'qish' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你毕业后想做什么？', py: 'Nǐ bìyè hòu xiǎng zuò shénme?', uz: 'Bitiruvdan keyin nima qilmoqchisiz?', ru: 'Что вы хотите делать после окончания?' },
                  { speaker: 'B', zh: '我想当医生。你呢？', py: 'Wǒ xiǎng dāng yīshēng. Nǐ ne?', uz: 'Men shifokor bo\'lmoqchiman. Senchi?', ru: 'Я хочу стать врачом. А ты?' },
                  { speaker: 'A', zh: '我想去中国工作。', py: 'Wǒ xiǎng qù Zhōngguó gōngzuò.', uz: 'Men Xitoyga ishlash uchun bormoqchiman.', ru: 'Я хочу поехать работать в Китай.' },
                  { speaker: 'B', zh: '好主意！你的中文很好。', py: 'Hǎo zhǔyi! Nǐ de Zhōngwén hěn hǎo.', uz: 'Yaxshi g\'oya! Sizning xitoychangiz juda yaxshi.', ru: 'Хорошая идея! Ваш китайский очень хороший.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#2563eb' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ko\'p ishlatiladigan 想 iboralar', ru: 'Частые сочетания с 想', en: 'Ko\'p ishlatiladigan 想 iboralar' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '想去', py: 'xiǎng qù', uz: 'bormoqchi', ru: 'хочет пойти' },
                  { zh: '想吃', py: 'xiǎng chī', uz: 'yemoqchi', ru: 'хочет есть' },
                  { zh: '想喝', py: 'xiǎng hē', uz: 'ichmoqchi', ru: 'хочет пить' },
                  { zh: '想买', py: 'xiǎng mǎi', uz: 'sotib olmoqchi', ru: 'хочет купить' },
                  { zh: '想看', py: 'xiǎng kàn', uz: 'ko\'rmoqchi', ru: 'хочет посмотреть' },
                  { zh: '想学', py: 'xiǎng xué', uz: 'o\'rganmoqchi', ru: 'хочет учить' },
                  { zh: '不想', py: 'bù xiǎng', uz: 'xohlamaslik', ru: 'не хочет' },
                  { zh: '很想', py: 'hěn xiǎng', uz: 'juda xohlamoq', ru: 'очень хочет' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#fff1f2', border: `1px solid #fecdd3` }}>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em', color: COLOR }}>{w.zh}</div>
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
              <div className="grammar-block__label">{({ uz: '想 vs 要', ru: '想 vs 要', en: '想 vs 要' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Ikkalasi ham «xohlamoq» degan ma\'noda, lekin farq bor:', ru: 'Оба означают «хотеть», но по-разному:', en: 'Ikkalasi ham «xohlamoq» degan ma\'noda, lekin farq bor:' } as Record<string, string>)[language]}
              </p>
              {[
                {
                  word: '想',
                  py: 'xiǎng',
                  color: COLOR,
                  title_uz: 'Yumshoq xohish / arzu',
                  title_ru: 'Мягкое желание / мечта',
                  desc_uz: 'Ichki istak, orzu. Amalga oshishi noaniq.',
                  desc_ru: 'Внутреннее желание, мечта. Реализация не очевидна.',
                  ex: '我想去法国。',
                  py_ex: 'Wǒ xiǎng qù Fǎguó.',
                  uz: 'Men Fransiyaga bormoqchiman. (orzu)',
                  ru: 'Я хочу поехать во Францию. (мечта)',
                },
                {
                  word: '要',
                  py: 'yào',
                  color: '#2563eb',
                  title_uz: 'Qat\'iy qaror / zaruriyat',
                  title_ru: 'Твёрдое решение / необходимость',
                  desc_uz: 'Qat\'iy qaror yoki zaruriyat. Amalga oshadi.',
                  desc_ru: 'Твёрдое решение или необходимость. Будет выполнено.',
                  ex: '我要去法国。',
                  py_ex: 'Wǒ yào qù Fǎguó.',
                  uz: 'Men Fransiyaga boraman. (qaror)',
                  ru: 'Я еду во Францию. (решение)',
                },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `4px solid ${r.color}`, border: `1px solid #e0e0e6`, borderLeftWidth: 4, borderLeftColor: r.color }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.word}</div>
                    <div>
                      <div style={{ fontSize: '0.8em', fontWeight: 700, color: r.color }}>{r.py} — {({ uz: r.title_uz, ru: r.title_ru, en: (r as any).title_en || r.title_uz } as Record<string, string>)[language]}</div>
                      <div style={{ fontSize: '0.75em', color: '#666' }}>{({ uz: r.desc_uz, ru: r.desc_ru, en: (r as any).desc_en || r.desc_uz } as Record<string, string>)[language]}</div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-item">
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-py">{r.py_ex}</div>
                    <div className="grammar-block__usage-tr">{({ uz: r.uz, ru: r.ru, en: (r as any).en || r.uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '不想 vs 不要', ru: '不想 vs 不要', en: '不想 vs 不要' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: 'Inkorda ham farq muhim:', ru: 'В отрицании разница тоже важна:', en: 'Inkorda ham farq muhim:' } as Record<string, string>)[language]}
              </p>
              {[
                {
                  word: '不想',
                  py: 'bù xiǎng',
                  color: COLOR,
                  uz: 'Xohlamaslik (yumshoq)',
                  ru: 'Не хочу (мягко)',
                  ex: '我不想吃。',
                  ex_uz: 'Men yemoqchi emasman.',
                  ex_ru: 'Я не хочу есть.',
                },
                {
                  word: '不要',
                  py: 'bù yào',
                  color: '#dc2626',
                  uz: 'Xohlamaslik / rad etish (kuchli)',
                  ru: 'Не хочу / отказ (сильно)',
                  ex: '不要！',
                  ex_uz: 'Kerak emas! / Yo\'q!',
                  ex_ru: 'Не надо! / Нет!',
                },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, borderLeft: `3px solid ${r.color}`, paddingLeft: 8 }}>
                    <div style={{ fontSize: '0.7em', fontWeight: 700, color: r.color, marginBottom: 2 }}>{r.word} ({r.py})</div>
                    <div style={{ fontSize: '0.75em', color: '#555', marginBottom: 4 }}>{({ uz: r.uz, ru: r.ru, en: (r as any).en || r.uz } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-tr">{({ uz: r.ex_uz, ru: r.ex_ru, en: (r as any).ex_en || r.ex_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Modal fe\'llar taqqoslash jadvali', ru: 'Сравнительная таблица модальных глаголов', en: 'Modal fe\'llar taqqoslash jadvali' } as Record<string, string>)[language]}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f8' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'So\'z', ru: 'Слово', en: 'Word' } as Record<string, string>)[language]}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'Ma\'nosi', ru: 'Значение', en: 'Meaning' } as Record<string, string>)[language]}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'Kuchi', ru: 'Сила', en: 'Kuchi' } as Record<string, string>)[language]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { word: '想', py: 'xiǎng', uz: 'xohlamoq (yumshoq)', ru: 'хотеть (мягко)', level: '★☆☆', color: COLOR },
                      { word: '要', py: 'yào', uz: 'xohlamoq / kerak (qat\'iy)', ru: 'хотеть / нужно (твёрдо)', level: '★★☆', color: '#2563eb' },
                      { word: '能', py: 'néng', uz: 'qila olmoq (imkoniyat)', ru: 'мочь (возможность)', level: '★★☆', color: '#059669' },
                      { word: '可以', py: 'kěyǐ', uz: 'qilsa bo\'ladi (ruxsat)', ru: 'можно (разрешение)', level: '★★☆', color: '#7c3aed' },
                    ].map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e0e0e6' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: r.color }}>{r.word} ({r.py})</td>
                        <td style={{ padding: '6px 8px', color: '#444' }}>{({ uz: r.uz, ru: r.ru, en: (r as any).en || r.uz } as Record<string, string>)[language]}</td>
                        <td style={{ padding: '6px 8px', letterSpacing: 2, color: r.color }}>{r.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">⚠️ {({ uz: 'Ko\'p uchraydigan xato', ru: 'Частая ошибка', en: 'Ko\'p uchraydigan xato' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Ko\'pchilik aralashtirib yuboradi: fe\'l oldida 想 = xohish, ism oldida 想 = sog\'inish.', ru: 'Студенты часто путают: 想 перед глаголом — желание, 想 перед именем — скука.', en: 'Ko\'pchilik aralashtirib yuboradi: fe\'l oldida 想 = xohish, ism oldida 想 = sog\'inish.' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: `1px solid #fecdd3` }}>
                  <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 3 }}>想 + {({ uz: 'FE\'L', ru: 'ГЛ.', en: 'FE\'L' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR }}>想</span>去。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Bormoqchiman.', ru: 'Я хочу идти.', en: 'Bormoqchiman.' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.65em', color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>想 + {({ uz: 'ISM', ru: 'ИМЯ', en: 'ISM' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: '#2563eb' }}>想</span>你。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Seni sog\'inaman.', ru: 'Скучаю по тебе.', en: 'Seni sog\'inaman.' } as Record<string, string>)[language]}</div>
                </div>
              </div>
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
