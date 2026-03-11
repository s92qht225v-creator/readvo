'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';

const COLOR = '#dc2626';
const COLOR_DARK = '#b91c1c';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparison' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  {
    zh: '你几岁？', pinyin: 'Nǐ jǐ suì?',
    uz: 'Sen necha yoshdasan?', ru: 'Сколько тебе лет?',
    note_uz: '几 + 岁 = necha yosh? (10 dan kichik bolalarga)', note_ru: '几 + 岁 = сколько лет? (для детей до 10)',
  },
  {
    zh: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?',
    uz: 'Hozir soat necha?', ru: 'Который сейчас час?',
    note_uz: '几点 = soat necha? (1-12 orasida — shuning uchun 几)', note_ru: '几点 = который час? (1-12, поэтому 几)',
  },
  {
    zh: '你有几个孩子？', pinyin: 'Nǐ yǒu jǐ ge háizi?',
    uz: 'Nechta farzandingiz bor?', ru: 'Сколько у вас детей?',
    note_uz: '几 + 个 (o\'lchov so\'z) + ot → kichik son kutilganda', note_ru: '几 + 个 (счётное слово) + сущ. → ожидается малое число',
  },
  {
    zh: '你家有几口人？', pinyin: 'Nǐ jiā yǒu jǐ kǒu rén?',
    uz: 'Oilangizda necha kishi bor?', ru: 'Сколько человек в вашей семье?',
    note_uz: '几口人 = necha kishi? (口 = oila a\'zolari uchun maxsus so\'z)', note_ru: '几口人 = сколько человек? (口 — спец. счётное для членов семьи)',
  },
  {
    zh: '这个多少钱？', pinyin: 'Zhège duōshǎo qián?',
    uz: 'Bu qancha turadi?', ru: 'Сколько это стоит?',
    note_uz: '多少钱 = qancha pul? (narx so\'rash — eng ko\'p ishlatiladigan savol)', note_ru: '多少钱 = сколько денег? (спрашиваем цену — самый частый вопрос)',
  },
  {
    zh: '你们班有多少学生？', pinyin: 'Nǐmen bān yǒu duōshǎo xuéshēng?',
    uz: 'Sinfingizda nechta talaba bor?', ru: 'Сколько студентов в вашей группе?',
    note_uz: '多少 = nechta? (10 dan ko\'p kutilganda)', note_ru: '多少 = сколько? (когда ожидается большое число, больше 10)',
  },
  {
    zh: '你的电话号码是多少？', pinyin: 'Nǐ de diànhuà hàomǎ shì duōshǎo?',
    uz: 'Telefon raqamingiz necha?', ru: 'Какой у вас номер телефона?',
    note_uz: '多少 = necha/qancha? (katta son kutilganda)', note_ru: '多少 = сколько/какой? (ожидается большое число)',
  },
  {
    zh: '今天几号？', pinyin: 'Jīntiān jǐ hào?',
    uz: 'Bugun nechanchi sana?', ru: 'Какое сегодня число?',
    note_uz: '几号 = nechanchi sana? (1-31 orasida)', note_ru: '几号 = какое число? (в диапазоне 1-31)',
  },
];

const quizQuestions = [
  {
    q_uz: '"Bu qancha turadi?" xitoycha qanday?',
    q_ru: 'Как сказать "Сколько это стоит?" по-китайски?',
    options: ['这个几钱？', '这个多少钱？', '多少这个钱？', '钱多少这个？'],
    correct: 1,
  },
  {
    q_uz: '几 qachon ishlatiladi?',
    q_ru: 'Когда используется 几?',
    options_uz: ['Har doim', '10 dan kichik son kutilganda', 'Faqat pul haqida', 'Faqat vaqt haqida'],
    options_ru: ['Всегда', 'Когда ожидается число меньше 10', 'Только о деньгах', 'Только о времени'],
    correct: 1,
  },
  {
    q_uz: '"Hozir soat necha?" qanday?',
    q_ru: 'Как сказать "Который сейчас час?"?',
    options: ['现在多少点？', '几点现在？', '现在几点？', '多少现在点？'],
    correct: 2,
  },
  {
    q_uz: '几 bilan qanday so\'z kerak?',
    q_ru: 'Что нужно использовать с 几?',
    options_uz: ['Hech narsa', 'O\'lchov so\'z (量词)', '的', '了'],
    options_ru: ['Ничего', 'Счётное слово (量词)', '的', '了'],
    correct: 1,
  },
  {
    q_uz: '"Nechta talaba bor?" (30+ kutilsa)',
    q_ru: '"Сколько студентов?" (ожидается 30+)',
    options: ['有几个学生？', '有多少学生？', '几学生有？', '多少有学生？'],
    correct: 1,
  },
  {
    q_uz: '多少 bilan o\'lchov so\'z kerakmi?',
    q_ru: 'Нужно ли счётное слово с 多少?',
    options_uz: ['Ha, har doim', 'Yo\'q, hech qachon', 'Ixtiyoriy — qo\'ysa ham bo\'ladi', 'Faqat 个 bilan'],
    options_ru: ['Да, всегда', 'Нет, никогда', 'Необязательно — можно ставить', 'Только с 个'],
    correct: 2,
  },
];

export function GrammarJiPage() {
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
        <div className="grammar-page__hero-bg">几</div>
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
          <h1 className="grammar-page__hero-char">几/多少</h1>
          <div className="grammar-page__hero-pinyin">jǐ / duōshǎo</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'necha? / qancha?', ru: 'сколько? / как много?', en: 'necha? / qancha?' } as Record<string, string>)[language]} —</div>
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
              <div className="grammar-block__label">{({ uz: 'Ikki ieroglif — bitta mavzu', ru: 'Два иероглифа — одна тема', en: 'Ikki ieroglif — bitta mavzu' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, color: COLOR, fontWeight: 400, lineHeight: 1.2 }}>几</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>jǐ</div>
                  <div style={{ fontSize: 11, color: COLOR }}>{({ uz: '3-ton', ru: '3-й тон', en: '3-ton' } as Record<string, string>)[language]}</div>
                </div>
                <div style={{ width: 1, background: '#e0e0e6' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, color: COLOR_DARK, fontWeight: 400, lineHeight: 1.4 }}>多少</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e' }}>duōshǎo</div>
                  <div style={{ fontSize: 11, color: COLOR_DARK }}>{({ uz: '1-ton + 3-ton', ru: '1-й + 3-й тон', en: '1-ton + 3-ton' } as Record<string, string>)[language]}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                <b style={{ color: '#1a1a2e' }}>{({ uz: 'Ma\'nosi', ru: 'Значение', en: 'Meaning' } as Record<string, string>)[language]}:</b>{' '}
                {({ uz: 'necha? qancha? nechta?', ru: 'сколько? как много? какое количество?', en: 'necha? qancha? nechta?' } as Record<string, string>)[language]}<br />
                <b style={{ color: '#1a1a2e' }}>{({ uz: '几 chiziqlar', ru: 'Черт 几', en: '几 chiziqlar' } as Record<string, string>)[language]}:</b> 2{' '}
                &nbsp;|&nbsp;{' '}
                <b style={{ color: '#1a1a2e' }}>{({ uz: '多少 chiziqlar', ru: 'Черт 多少', en: '多少 chiziqlar' } as Record<string, string>)[language]}:</b> 6 + 4<br />
                <b style={{ color: '#1a1a2e' }}>{({ uz: 'Turi', ru: 'Тип', en: 'Turi' } as Record<string, string>)[language]}:</b>{' '}
                {({ uz: 'Savol so\'zlari (sonlar haqida)', ru: 'Вопросительные слова о количестве', en: 'Savol so\'zlari (sonlar haqida)' } as Record<string, string>)[language]}
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Asosiy farq', ru: 'Главное отличие', en: 'Asosiy farq' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <div style={{
                  flex: 1, background: '#fff', borderRadius: 8, padding: 10, textAlign: 'center',
                  border: `1px solid ${COLOR}30`,
                }}>
                  <div style={{ fontSize: 28, color: COLOR, fontWeight: 700, marginBottom: 4 }}>几</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 4 }}>1 — 9</div>
                  <div style={{ fontSize: 10, color: '#555' }}>
                    {({ uz: 'Kichik son kutilganda', ru: 'Когда ожидается малое число', en: 'Kichik son kutilganda' } as Record<string, string>)[language]}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>
                    {({ uz: 'O\'lchov so\'z KERAK', ru: 'Счётное слово НУЖНО', en: 'O\'lchov so\'z KERAK' } as Record<string, string>)[language]}
                  </div>
                </div>
                <div style={{
                  flex: 1, background: '#fff', borderRadius: 8, padding: 10, textAlign: 'center',
                  border: `1px solid ${COLOR_DARK}30`,
                }}>
                  <div style={{ fontSize: 24, color: COLOR_DARK, fontWeight: 700, marginBottom: 4 }}>多少</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLOR_DARK, marginBottom: 4 }}>10+</div>
                  <div style={{ fontSize: 10, color: '#555' }}>
                    {({ uz: 'Katta yoki noma\'lum son', ru: 'Большое или неизвестное число', en: 'Katta yoki noma\'lum son' } as Record<string, string>)[language]}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>
                    {({ uz: 'O\'lchov so\'z IXTIYORIY', ru: 'Счётное слово НЕОБЯЗАТЕЛЬНО', en: 'O\'lchov so\'z IXTIYORIY' } as Record<string, string>)[language]}
                  </div>
                </div>
              </div>
              <p className="grammar-block__tip-note" style={{ textAlign: 'center', marginTop: 10 }}>
                💡 {({ uz: 'Javob 10 dan kichik bo\'lsa → 几. Katta yoki noma\'lum → 多少.', ru: 'Ответ меньше 10 → 几. Большой или неизвестный → 多少.', en: 'Javob 10 dan kichik bo\'lsa → 几. Katta yoki noma\'lum → 多少.' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'O\'lchov so\'z (量词) nima?', ru: 'Что такое счётное слово (量词)?', en: 'O\'lchov so\'z (量词) nima?' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__tip-text">
                {({ uz: 'Xitoy tilida son va ot orasiga maxsus so\'z kerak. O\'zbek tilidagi «ta» ga o\'xshash:', ru: 'В китайском языке между числом и существительным нужно специальное слово — как «штука», «голова» в русском:', en: 'Xitoy tilida son va ot orasiga maxsus so\'z kerak. O\'zbek tilidagi «ta» ga o\'xshash:' } as Record<string, string>)[language]}
              </div>
              <div style={{ textAlign: 'center', margin: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#888' }}>{({ uz: 'uch', ru: 'три', en: 'uch' } as Record<string, string>)[language]}</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{' '}{({ uz: ' ta ', ru: ' штуки ', en: ' ta ' } as Record<string, string>)[language]}</span>
                <span style={{ color: '#888' }}>{({ uz: 'kitob', ru: 'книги', en: 'kitob' } as Record<string, string>)[language]}</span>
                {' = '}
                <span style={{ color: '#888' }}>三</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}> 本 </span>
                <span style={{ color: '#888' }}>书</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
                {[
                  { mw: '个', py: 'ge', uz: 'odamlar, narsalar', ru: 'люди, предметы' },
                  { mw: '本', py: 'běn', uz: 'kitoblar', ru: 'книги' },
                  { mw: '口', py: 'kǒu', uz: 'oila a\'zolari', ru: 'члены семьи' },
                  { mw: '岁', py: 'suì', uz: 'yosh', ru: 'лет (возраст)' },
                  { mw: '块', py: 'kuài', uz: 'pul (yuan)', ru: 'деньги (юань)' },
                  { mw: '杯', py: 'bēi', uz: 'stakan', ru: 'стакан' },
                ].map((w, i) => (
                  <div key={i} style={{
                    background: '#fff8', borderRadius: 6, padding: 6, textAlign: 'center',
                    border: '1px solid #fde68a',
                  }}>
                    <div style={{ fontSize: 16, color: '#1a1a2e', fontWeight: 500 }}>{w.mw}</div>
                    <div style={{ fontSize: 9, color: '#f59e0b' }}>{w.py}</div>
                    <div style={{ fontSize: 9, color: '#888' }}>{({ uz: w.uz, ru: w.ru, en: (w as any).en || w.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-note">
                💡 {({ uz: '个 (ge) — eng universal o\'lchov so\'z. Bilmasangiz — 个 ishlating!', ru: '个 (ge) — самое универсальное. Если не знаете — используйте 个!', en: '个 (ge) — eng universal o\'lchov so\'z. Bilmasangiz — 个 ishlating!' } as Record<string, string>)[language]}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. 几 + O\'lchov so\'z + Ot (kichik son)', ru: '1. 几 + счётное слово + существительное', en: '1. 几 + O\'lchov so\'z + Ot (kichik son)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb" style={{ color: COLOR }}>几</span>
                {' + '}
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{({ uz: '量词', ru: 'СС', en: 'MW' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Сущ', en: 'Noun' } as Record<string, string>)[language]}</span>
                {' ？'}
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Javob 10 dan kichik kutilganda (1-9)', ru: 'Когда ожидается ответ меньше 10 (1-9)', en: 'Javob 10 dan kichik kutilganda (1-9)' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '你有几个孩子？', py: 'Nǐ yǒu jǐ ge háizi?', uz: 'Nechta farzandingiz bor?', ru: 'Сколько у вас детей?', mw: '个' },
                { ex: '你几岁？', py: 'Nǐ jǐ suì?', uz: 'Sen necha yoshdasan?', ru: 'Сколько тебе лет?', mw: '岁' },
                { ex: '你要几杯咖啡？', py: 'Nǐ yào jǐ bēi kāfēi?', uz: 'Nechta qahva olasiz?', ru: 'Сколько чашек кофе вам?', mw: '杯' },
                { ex: '你家有几口人？', py: 'Nǐ jiā yǒu jǐ kǒu rén?', uz: 'Oilangizda necha kishi?', ru: 'Сколько человек в семье?', mw: '口' },
                { ex: '你买了几本书？', py: 'Nǐ mǎi le jǐ běn shū?', uz: 'Nechta kitob sotib olding?', ru: 'Сколько книг ты купил?', mw: '本' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      background: `${COLOR}15`, borderRadius: 4, padding: '1px 6px',
                      fontSize: 11, fontWeight: 700, color: COLOR,
                    }}>量词: {x.mw}</span>
                  </div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ marginTop: 8 }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <b>{({ uz: '几 bilan o\'lchov so\'z MAJBURIY!', ru: 'С 几 счётное слово ОБЯЗАТЕЛЬНО!', en: '几 bilan o\'lchov so\'z MAJBURIY!' } as Record<string, string>)[language]}</b>{' '}
                  {({ uz: '几人？ emas → 几口人？ yoki 几个人？', ru: '几人？ нельзя → 几口人？ или 几个人？', en: '几人？ emas → 几口人？ yoki 几个人？' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. 几 vaqt va sana bilan', ru: '2. 几 для времени и дат', en: '2. 几 vaqt va sana bilan' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '几 vaqt va sana so\'rashda juda ko\'p ishlatiladi:', ru: '几 очень часто используется для вопросов о времени и дате:', en: '几 vaqt va sana so\'rashda juda ko\'p ishlatiladi:' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '现在几点？', py: 'Xiànzài jǐ diǎn?', uz: 'Hozir soat necha?', ru: 'Который сейчас час?', note: '1-12' },
                { ex: '今天几号？', py: 'Jīntiān jǐ hào?', uz: 'Bugun nechanchi sana?', ru: 'Какое сегодня число?', note: '1-31' },
                { ex: '今天星期几？', py: 'Jīntiān xīngqī jǐ?', uz: 'Bugun haftaning nechasi?', ru: 'Какой сегодня день недели?', note: '1-7' },
                { ex: '你几月来？', py: 'Nǐ jǐ yuè lái?', uz: 'Nechanchi oyda kelasan?', ru: 'В каком месяце придёшь?', note: '1-12' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</span>
                    <span style={{ fontSize: 9, color: COLOR, background: `${COLOR}15`, padding: '1px 6px', borderRadius: 3 }}>{x.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. 多少 + (量词) + Ot (katta son)', ru: '3. 多少 + (счётное слово) + существительное', en: '3. 多少 + (量词) + Ot (katta son)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb" style={{ color: COLOR_DARK }}>多少</span>
                {' + '}
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>({({ uz: '量词', ru: 'СС', en: 'MW' } as Record<string, string>)[language]})</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Сущ', en: 'Noun' } as Record<string, string>)[language]}</span>
                {' ？'}
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Javob 10 dan ko\'p yoki noma\'lum. O\'lchov so\'z ixtiyoriy.', ru: 'Ответ больше 10 или неизвестен. Счётное слово необязательно.', en: 'Javob 10 dan ko\'p yoki noma\'lum. O\'lchov so\'z ixtiyoriy.' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '你们学校有多少学生？', py: 'Nǐmen xuéxiào yǒu duōshǎo xuéshēng?', uz: 'Maktabingizda nechta o\'quvchi bor?', ru: 'Сколько учеников в вашей школе?' },
                { ex: '中国有多少人？', py: 'Zhōngguó yǒu duōshǎo rén?', uz: 'Xitoyda necha kishi bor?', ru: 'Сколько людей в Китае?' },
                { ex: '你认识多少汉字？', py: 'Nǐ rènshi duōshǎo Hànzì?', uz: 'Nechta ieroglif bilasan?', ru: 'Сколько иероглифов ты знаешь?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. 多少钱？ = qancha turadi?', ru: '4. 多少钱？ = Сколько стоит?', en: '4. 多少钱？ = qancha turadi?' } as Record<string, string>)[language]}</div>
              <div style={{
                background: `${COLOR}10`, borderRadius: 8, padding: 14, textAlign: 'center',
                border: `1px solid ${COLOR}30`, marginBottom: 10,
              }}>
                <div style={{ fontSize: 26, color: COLOR, fontWeight: 600, marginBottom: 4 }}>多少钱？</div>
                <div style={{ fontSize: 13, color: COLOR_DARK }}>duōshǎo qián?</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {({ uz: 'Qancha turadi? / Narxi qancha?', ru: 'Сколько стоит? / Какая цена?', en: 'Qancha turadi? / Narxi qancha?' } as Record<string, string>)[language]}
                </div>
              </div>
              {[
                { ex: '这个多少钱？', py: 'Zhège duōshǎo qián?', uz: 'Bu qancha turadi?', ru: 'Сколько это стоит?' },
                { ex: '一斤苹果多少钱？', py: 'Yì jīn píngguǒ duōshǎo qián?', uz: 'Bir jin olma qancha?', ru: 'Сколько стоит один цзинь яблок?' },
                { ex: '那件衣服多少钱？', py: 'Nà jiàn yīfu duōshǎo qián?', uz: 'Anavi kiyim qancha turadi?', ru: 'Сколько стоит та одежда?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 <b>多少钱</b> —{' '}
                {({ uz: 'xitoy tilida eng foydali iboralardan biri! Do\'konda, bozorda, taksida — hamma joyda kerak.', ru: 'одна из самых полезных фраз! В магазине, на рынке, в такси — везде нужна.', en: 'xitoy tilida eng foydali iboralardan biri! Do\'konda, bozorda, taksida — hamma joyda kerak.' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. 多 + Sifat = qanchalik?', ru: '5. 多 + прилагательное = Насколько?', en: '5. 多 + Sifat = qanchalik?' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-verb" style={{ color: COLOR_DARK }}>多</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прил', en: 'Sifat' } as Record<string, string>)[language]}</span>
                {' ？'}
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Qanchalik baland? Qanchalik uzoq? va h.k.', ru: 'Насколько высокий? Насколько далеко? и т.д.', en: 'Qanchalik baland? Qanchalik uzoq? va h.k.' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '你多大？', py: 'Nǐ duō dà?', uz: 'Siz necha yoshdasiz?', ru: 'Сколько вам лет?', note_uz: '多大 = necha yosh? (kattalar uchun — 几岁 dan farqli)', note_ru: '多大 = сколько лет? (для взрослых — в отличие от 几岁)' },
                { ex: '多远？', py: 'Duō yuǎn?', uz: 'Qanchalik uzoq?', ru: 'Как далеко?', note_uz: '多远 = qanchalik uzoq? (masofa)', note_ru: '多远 = насколько далеко? (расстояние)' },
                { ex: '多长时间？', py: 'Duō cháng shíjiān?', uz: 'Qancha vaqt?', ru: 'Сколько времени?', note_uz: '多长时间 = qancha vaqt davom etadi?', note_ru: '多长时间 = сколько времени это занимает?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-note">💡 {({ uz: x.note_uz, ru: x.note_ru, en: (x as any).note_en || x.note_uz } as Record<string, string>)[language]}</div>
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Do\'konda', ru: 'Диалог: В магазине', en: 'Mini dialog 1: Do\'konda' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', color: '#2563eb', zh: '你好，这个多少钱？', py: 'Nǐ hǎo, zhège duōshǎo qián?', uz: 'Salom, bu qancha turadi?', ru: 'Здравствуйте, сколько это стоит?' },
                  { speaker: 'B', color: COLOR, zh: '五十块。', py: 'Wǔshí kuài.', uz: 'Ellik yuan.', ru: 'Пятьдесят юаней.' },
                  { speaker: 'A', color: '#2563eb', zh: '太贵了！那个呢？', py: 'Tài guì le! Nàge ne?', uz: 'Juda qimmat! Anovi-chi?', ru: 'Слишком дорого! А то?' },
                  { speaker: 'B', color: COLOR, zh: '那个二十块。你要几个？', py: 'Nàge èrshí kuài. Nǐ yào jǐ ge?', uz: 'Anovi yigirma yuan. Nechta olasiz?', ru: 'То двадцать юаней. Сколько возьмёте?' },
                  { speaker: 'A', color: '#2563eb', zh: '要两个。', py: 'Yào liǎng ge.', uz: 'Ikkita olaman.', ru: 'Возьму два.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: line.color }}>{line.speaker}:</span>
                      <span style={{ fontSize: 16, color: '#1a1a2e' }}>{line.zh}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#4338ca', marginLeft: 20 }}>{line.py}</div>
                    <div style={{ fontSize: 10, color: '#888', marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Yangi tanish', ru: 'Диалог: Знакомство', en: 'Mini dialog 2: Yangi tanish' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', color: '#2563eb', zh: '你家有几口人？', py: 'Nǐ jiā yǒu jǐ kǒu rén?', uz: 'Oilangizda necha kishi?', ru: 'Сколько человек в семье?' },
                  { speaker: 'B', color: COLOR, zh: '五口人。你呢？', py: 'Wǔ kǒu rén. Nǐ ne?', uz: 'Besh kishi. Senam?', ru: 'Пять человек. А ты?' },
                  { speaker: 'A', color: '#2563eb', zh: '我家四口人。你有几个孩子？', py: 'Wǒ jiā sì kǒu rén. Nǐ yǒu jǐ ge háizi?', uz: 'Biznikida to\'rt kishi. Nechta farzanding bor?', ru: 'У нас четыре человека. Сколько у тебя детей?' },
                  { speaker: 'B', color: COLOR, zh: '三个。两个女儿，一个儿子。', py: 'Sān ge. Liǎng ge nǚér, yí ge érzi.', uz: 'Uchta. Ikkita qiz, bitta o\'g\'il.', ru: 'Трое. Две дочери, один сын.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: line.color }}>{line.speaker}:</span>
                      <span style={{ fontSize: 16, color: '#1a1a2e' }}>{line.zh}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#4338ca', marginLeft: 20 }}>{line.py}</div>
                    <div style={{ fontSize: 10, color: '#888', marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Eng ko\'p ishlatiladigan savollar', ru: 'Самые частые вопросы', en: 'Eng ko\'p ishlatiladigan savollar' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '几点？', py: 'jǐ diǎn?', uz: 'Soat necha?', ru: 'Который час?', type: 'ji' },
                  { zh: '几号？', py: 'jǐ hào?', uz: 'Nechanchi sana?', ru: 'Какое число?', type: 'ji' },
                  { zh: '星期几？', py: 'xīngqī jǐ?', uz: 'Haftaning nechasi?', ru: 'Какой день?', type: 'ji' },
                  { zh: '几岁？', py: 'jǐ suì?', uz: 'Necha yosh?', ru: 'Сколько лет?', type: 'ji' },
                  { zh: '多少钱？', py: 'duōshǎo qián?', uz: 'Qancha turadi?', ru: 'Сколько стоит?', type: 'duo' },
                  { zh: '多少人？', py: 'duōshǎo rén?', uz: 'Necha kishi?', ru: 'Сколько людей?', type: 'duo' },
                  { zh: '多大？', py: 'duō dà?', uz: 'Necha yoshda?', ru: 'Сколько лет?', type: 'duo' },
                  { zh: '多远？', py: 'duō yuǎn?', uz: 'Qanchalik uzoq?', ru: 'Как далеко?', type: 'duo' },
                ].map((w, i) => (
                  <div key={i} style={{
                    background: w.type === 'ji' ? `${COLOR}10` : `${COLOR_DARK}15`,
                    borderRadius: 8, padding: 8, textAlign: 'center',
                    border: `1px solid ${w.type === 'ji' ? COLOR : COLOR_DARK}30`,
                  }}>
                    <div style={{ fontSize: 16, color: '#1a1a2e', fontWeight: 500 }}>{w.zh}</div>
                    <div style={{ fontSize: 10, color: w.type === 'ji' ? COLOR : COLOR_DARK }}>{w.py}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>{({ uz: w.uz, ru: w.ru, en: (w as any).en || w.uz } as Record<string, string>)[language]}</div>
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
              <div className="grammar-block__label">{({ uz: '几 vs 多少 — batafsil', ru: '几 vs 多少 — подробно', en: '几 vs 多少 — batafsil' } as Record<string, string>)[language]}</div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, background: `${COLOR}20`, color: COLOR, textAlign: 'center', borderBottom: '2px solid #e0e0e6', fontWeight: 700 }}>几</th>
                      <th style={{ padding: 8, background: `${COLOR_DARK}20`, color: COLOR_DARK, textAlign: 'center', borderBottom: '2px solid #e0e0e6', fontWeight: 700 }}>多少</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { ji: ({ uz: '1-9 (kichik son)', ru: '1-9 (малое число)', en: '1-9 (kichik son)' } as Record<string, string>)[language], duo: ({ uz: '10+ (katta yoki noma\'lum)', ru: '10+ (большое или неизвестное)', en: '10+ (katta yoki noma\'lum)' } as Record<string, string>)[language] },
                      { ji: ({ uz: 'O\'lchov so\'z KERAK: 几个、几本', ru: 'Счётное слово НУЖНО: 几个、几本', en: 'O\'lchov so\'z KERAK: 几个、几本' } as Record<string, string>)[language], duo: ({ uz: 'O\'lchov so\'z ixtiyoriy: 多少(个)人', ru: 'Счётное слово необязательно: 多少(个)人', en: 'O\'lchov so\'z ixtiyoriy: 多少(个)人' } as Record<string, string>)[language] },
                      { ji: ({ uz: 'Aniq savol (javob taxminan ma\'lum)', ru: 'Конкретный вопрос (ответ приблизительно известен)', en: 'Aniq savol (javob taxminan ma\'lum)' } as Record<string, string>)[language], duo: ({ uz: 'Ochiq savol (javob noma\'lum)', ru: 'Открытый вопрос (ответ неизвестен)', en: 'Ochiq savol (javob noma\'lum)' } as Record<string, string>)[language] },
                      { ji: '几点、几号、几岁', duo: '多少钱、多少人、多少个' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f3' }}>
                        <td style={{ padding: 8, color: '#555', borderRightWidth: 1, borderRightColor: '#f0f0f3', borderRightStyle: 'solid' as const }}>{row.ji}</td>
                        <td style={{ padding: 8, color: '#555' }}>{row.duo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Bir xil savol — ikki variant', ru: 'Одинаковый вопрос — два варианта', en: 'Bir xil savol — ikki variant' } as Record<string, string>)[language]}</div>
              {[
                {
                  ji: '你有几个朋友？', jiuz: ({ uz: 'Nechta do\'sting bor? (3-5 kutilsa)', ru: 'Сколько у тебя друзей? (3-5 ожидается)', en: 'Nechta do\'sting bor? (3-5 kutilsa)' } as Record<string, string>)[language],
                  duo: '你有多少个朋友？', duouz: ({ uz: 'Nechta do\'sting bor? (ko\'p kutilsa)', ru: 'Сколько у тебя друзей? (много ожидается)', en: 'Nechta do\'sting bor? (ko\'p kutilsa)' } as Record<string, string>)[language],
                },
                {
                  ji: '你买了几本书？', jiuz: ({ uz: 'Nechta kitob olding? (biroz)', ru: 'Сколько книг ты купил? (мало)', en: 'Nechta kitob olding? (biroz)' } as Record<string, string>)[language],
                  duo: '你买了多少本书？', duouz: ({ uz: 'Nechta kitob olding? (ko\'p)', ru: 'Сколько книг ты купил? (много)', en: 'Nechta kitob olding? (ko\'p)' } as Record<string, string>)[language],
                },
                {
                  ji: '教室里有几个人？', jiuz: ({ uz: 'Xonada nechta kishi? (biroz)', ru: 'Сколько человек в классе? (мало)', en: 'Xonada nechta kishi? (biroz)' } as Record<string, string>)[language],
                  duo: '教室里有多少人？', duouz: ({ uz: 'Xonada nechta kishi? (ko\'p)', ru: 'Сколько человек в классе? (много)', en: 'Xonada nechta kishi? (ko\'p)' } as Record<string, string>)[language],
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div style={{
                    flex: 1, background: `${COLOR}10`, borderRadius: 8, padding: 8, textAlign: 'center',
                    border: `1px solid ${COLOR}30`,
                  }}>
                    <div style={{ fontSize: 9, color: COLOR, fontWeight: 700, marginBottom: 2 }}>
                      几 ({({ uz: 'kichik', ru: 'малое', en: 'kichik' } as Record<string, string>)[language]})
                    </div>
                    <div style={{ fontSize: 13, color: '#1a1a2e' }}>{x.ji}</div>
                    <div style={{ fontSize: 9, color: '#888' }}>{x.jiuz}</div>
                  </div>
                  <div style={{
                    flex: 1, background: `${COLOR_DARK}10`, borderRadius: 8, padding: 8, textAlign: 'center',
                    border: `1px solid ${COLOR_DARK}30`,
                  }}>
                    <div style={{ fontSize: 9, color: COLOR_DARK, fontWeight: 700, marginBottom: 2 }}>
                      多少 ({({ uz: 'katta', ru: 'большое', en: 'katta' } as Record<string, string>)[language]})
                    </div>
                    <div style={{ fontSize: 13, color: '#1a1a2e' }}>{x.duo}</div>
                    <div style={{ fontSize: 9, color: '#888' }}>{x.duouz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Yosh so\'rash — uch usul', ru: 'Три способа спросить возраст', en: 'Yosh so\'rash — uch usul' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'Xitoy tilida yosh so\'rash yoshga qarab o\'zgaradi:', ru: 'В китайском вопрос о возрасте меняется в зависимости от возраста собеседника:', en: 'Xitoy tilida yosh so\'rash yoshga qarab o\'zgaradi:' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '你几岁？', py: 'Nǐ jǐ suì?', uz: 'Necha yoshdasan?', ru: 'Сколько тебе лет?', who_uz: 'Bolalarga (< 10)', who_ru: 'Детям (< 10)', color: COLOR },
                { ex: '你多大？', py: 'Nǐ duō dà?', uz: 'Necha yoshdasan?', ru: 'Сколько вам лет?', who_uz: 'Tengdoshlarga / kattalarga', who_ru: 'Ровесникам / взрослым', color: COLOR_DARK },
                { ex: '您多大年纪？', py: 'Nín duō dà niánjì?', uz: 'Nechinchi yoshdasiz?', ru: 'Сколько вам лет?', who_uz: 'Keksalarga (hurmatli)', who_ru: 'Пожилым (вежливо)', color: '#059669' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ borderLeftWidth: 3, borderLeftColor: x.color, borderLeftStyle: 'solid' as const }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <div className="grammar-block__usage-zh">{x.ex}</div>
                    <span style={{ fontSize: 9, color: x.color, background: `${x.color}15`, padding: '1px 6px', borderRadius: 3 }}>
                      {({ uz: x.who_uz, ru: x.who_ru, en: (x as any).who_en || x.who_uz } as Record<string, string>)[language]}
                    </span>
                  </div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: 'Xato qilmaslik uchun', ru: 'Типичные ошибки', en: 'Xato qilmaslik uchun' } as Record<string, string>)[language]}</div>
              {[
                { wrong: '你有几朋友？', right: '你有几个朋友？', note_uz: '几 bilan o\'lchov so\'z kerak!', note_ru: 'С 几 нужно счётное слово!' },
                { wrong: '这个几钱？', right: '这个多少钱？', note_uz: 'Narx = 多少钱 (10+ bo\'lishi mumkin)', note_ru: 'Цена = 多少钱 (может быть больше 10)' },
                { wrong: '中国有几人？', right: '中国有多少人？', note_uz: 'Milliardlab kishi = 多少!', note_ru: 'Миллиарды людей = 多少!' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <div style={{ flex: 1, background: '#fee2e2', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {({ uz: 'XATO', ru: 'ОШИБКА', en: 'ERROR' } as Record<string, string>)[language]}</div>
                    <div style={{ fontSize: 13, color: '#1a1a2e', textDecoration: 'line-through' }}>{x.wrong}</div>
                  </div>
                  <div style={{ flex: 1, background: '#dcfce7', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ПРАВИЛЬНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                    <div style={{ fontSize: 13, color: '#1a1a2e' }}>{x.right}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 3 }}>{({ uz: x.note_uz, ru: x.note_ru, en: (x as any).note_en || x.note_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
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
                  <p className="grammar-quiz__q">{qi + 1}. {({ uz: q.q_uz, ru: q.q_ru, en: (q as any).q_en || q.q_uz } as Record<string, string>)[language]}</p>
                  <div className="grammar-quiz__options">
                    {(opts ?? []).map((opt, ai) => {
                      const selected = answers[qi] === ai;
                      const correct = q.correct === ai;
                      let cls = 'grammar-quiz__option';
                      if (showResults && selected && correct) cls += ' grammar-quiz__option--correct';
                      else if (showResults && selected) cls += ' grammar-quiz__option--wrong';
                      else if (showResults && correct) cls += ' grammar-quiz__option--correct';
                      else if (selected) cls += ' grammar-quiz__option--selected';
                      return (
                        <button key={ai} className={cls} onClick={() => pick(qi, ai)} type="button">
                          {opt}
                        </button>
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

      <PageFooter />
    </div>
  );
}
