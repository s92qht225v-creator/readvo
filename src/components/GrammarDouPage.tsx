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
  { id: 'position', uz: 'O\'rni', ru: 'Позиция', en: 'Position' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我们都是学生。', pinyin: 'Wǒmen dōu shì xuésheng.', uz: 'Biz hammamiz talabamiz.', ru: 'Мы все студенты.', en: 'We are all students.', note_uz: '我们 (wǒmen) = biz → 都 = hammamiz', note_ru: '我们 (wǒmen) = мы → 都 = все', note_en: '我们 (wǒmen) = we → 都 = all' },
  { zh: '他们都喜欢中国菜。', pinyin: 'Tāmen dōu xǐhuan Zhōngguó cài.', uz: 'Ularning hammasi xitoy ovqatini yoqtiradi.', ru: 'Им всем нравится китайская еда.', en: 'They all like Chinese food.', note_uz: '他们 (tāmen) = ular → 都 hammasi', note_ru: '他们 (tāmen) = они → 都 все', note_en: '他们 (tāmen) = they → 都 all' },
  { zh: '爸爸和妈妈都工作。', pinyin: 'Bàba hé māma dōu gōngzuò.', uz: 'Otam va onam ikkalasi ham ishlaydi.', ru: 'Папа и мама оба работают.', en: 'Dad and Mom both work.', note_uz: 'A 和 B 都 = A va B ikkalasi ham', note_ru: 'A 和 B 都 = и A, и B', note_en: 'A 和 B 都 = both A and B' },
  { zh: '我什么都吃。', pinyin: 'Wǒ shénme dōu chī.', uz: 'Men hammasini yeb yuboraman.', ru: 'Я ем всё что угодно.', en: 'I eat everything.', note_uz: '什么都 = nimani bo\'lsa ham, hammasini', note_ru: '什么都 = что угодно, всё', note_en: '什么都 = anything, everything' },
  { zh: '她都不想去。', pinyin: 'Tā dōu bù xiǎng qù.', uz: 'U umuman bormoqchi emas.', ru: 'Она вообще не хочет идти.', en: 'She doesn\'t want to go at all.', note_uz: '都不 = umuman ...maydi (kuchli inkor)', note_ru: '都不 = вообще не (сильное отрицание)', note_en: '都不 = not at all (strong negation)' },
  { zh: '我们都很高兴。', pinyin: 'Wǒmen dōu hěn gāoxìng.', uz: 'Biz hammamiz xursandmiz.', ru: 'Мы все очень рады.', en: 'We are all very happy.', note_uz: '都 + 很 + sifat = hammasi ...dir', note_ru: '都 + 很 + прилагательное = все очень...', note_en: '都 + 很 + adjective = all very...' },
  { zh: '这些书都是我的。', pinyin: 'Zhèxiē shū dōu shì wǒ de.', uz: 'Bu kitoblarning hammasi meniki.', ru: 'Все эти книги мои.', en: 'All these books are mine.', note_uz: '这些 (zhèxiē) = bular → 都 = hammasi', note_ru: '这些 (zhèxiē) = эти → 都 = все', note_en: '这些 (zhèxiē) = these → 都 = all' },
  { zh: '谁都知道。', pinyin: 'Shéi dōu zhīdào.', uz: 'Hamma biladi.', ru: 'Все знают.', en: 'Everyone knows.', note_uz: '谁都 = kim bo\'lsa ham, hamma', note_ru: '谁都 = кто угодно, все', note_en: '谁都 = anyone, everyone' },
];

const quizQuestions = [
  {
    q_uz: '"Biz hammamiz talabamiz" xitoycha qanday?',
    q_ru: 'Как сказать "Мы все студенты" по-китайски?',
    q_en: 'How do you say "We are all students" in Chinese?',
    options: ['都我们是学生', '我们都是学生', '我们是都学生', '我们是学生都'],
    correct: 1,
  },
  {
    q_uz: '都 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 都 в предложении?',
    q_en: 'Where is 都 placed in a sentence?',
    options_uz: ['Gap oxiriga', 'Ob\'yektdan keyin', 'Egadan keyin, fe\'ldan oldin', 'Gap boshiga'],
    options_ru: ['В конце предложения', 'После объекта', 'После подлежащего, перед глаголом', 'В начале предложения'],
    options_en: ['At the end of the sentence', 'After the object', 'After the subject, before the verb', 'At the beginning of the sentence'],
    correct: 2,
  },
  {
    q_uz: '"Ularning hammasi bordi" qanday?',
    q_ru: 'Как сказать "Они все пошли"?',
    q_en: 'How do you say "They all went"?',
    options: ['他们去都了', '都他们去了', '他们都去了', '去了他们都'],
    correct: 2,
  },
  {
    q_uz: '都 qanday o\'qiladi?',
    q_ru: 'Как читается 都?',
    q_en: 'How is 都 pronounced?',
    options_uz: ['dōu (1-ton)', 'dóu (2-ton)', 'dǒu (3-ton)', 'dòu (4-ton)'],
    options_ru: ['dōu (1-й тон)', 'dóu (2-й тон)', 'dǒu (3-й тон)', 'dòu (4-й тон)'],
    options_en: ['dōu (1st tone)', 'dóu (2nd tone)', 'dǒu (3rd tone)', 'dòu (4th tone)'],
    correct: 0,
  },
  {
    q_uz: '也 va 都 birgalikda qanday tartibda?',
    q_ru: 'В каком порядке стоят 也 и 都 вместе?',
    q_en: 'In what order do 也 and 都 appear together?',
    options_uz: ['都也', '也都', 'Farqi yo\'q', 'Birgalikda ishlatilmaydi'],
    options_ru: ['都也', '也都', 'Нет разницы', 'Нельзя использовать вместе'],
    options_en: ['都也', '也都', 'No difference', 'They can\'t be used together'],
    correct: 1,
  },
  {
    q_uz: '"Hamma biladi" xitoycha qanday?',
    q_ru: 'Как сказать "Все знают" по-китайски?',
    q_en: 'How do you say "Everyone knows" in Chinese?',
    options: ['都谁知道', '知道谁都', '谁都知道', '谁知道都'],
    correct: 2,
  },
];

export function GrammarDouPage() {
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
        <div className="grammar-page__hero-bg">都</div>
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
          <h1 className="grammar-page__hero-char">都</h1>
          <div className="grammar-page__hero-pinyin">dōu</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'hammasi / barchasi', ru: 'все / всё', en: 'all / both' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">都</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">dōu</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '1-ton (tekis, baland) ¯', ru: '1-й тон (ровный, высокий) ¯', en: '1st tone (flat, high) ¯' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'hammasi, barchasi', ru: 'все, всё, оба', en: 'all, both, every' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">10</span>
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
                {({ uz: '都 — xitoy tilida «hammasi» ma\'nosini beruvchi eng muhim so\'z. Bir necha kishi yoki narsa haqida umumlashtirib gapirganda ishlatiladi:', ru: '都 — одно из самых частых слов в китайском. Используется для обобщения нескольких людей или вещей:', en: '都 is one of the most common words in Chinese. It is used to generalize about multiple people or things:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  他们喜欢茶。→ 他们<span className="grammar-block__highlight">都</span>喜欢茶。
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'Ular choy yoqtiradi. → Ularning hammasi choy yoqtiradi.', ru: 'Они любят чай. → Они все любят чай.', en: 'They like tea. → They all like tea.' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy qoida', ru: 'Основное правило', en: 'Basic Rule' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega (ko\'plik)', ru: 'Подлеж. (мн.ч.)', en: 'Subj. (plural)' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l / Sifat', ru: 'Глагол / Прилаг.', en: 'Verb / Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: '都 har doim egadan keyin, fe\'ldan oldin turadi — xuddi 也 kabi.', ru: '都 всегда после подлежащего, перед глаголом — как и 也.', en: '都 always comes after the subject and before the verb — just like 也.' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '都 vs 也 — farqi', ru: '都 vs 也 — отличие', en: '都 vs 也 — Difference' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdfa', border: '1px solid #99f6e4' }}>
                  <div style={{ fontSize: 28, color: '#0d9488', fontWeight: 600, marginBottom: 2 }}>也</div>
                  <div style={{ fontSize: 10, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {({ uz: 'HAM', ru: 'ТОЖЕ', en: 'ALSO' } as Record<string, string>)[language]}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {({ uz: 'A qiladi, B ham qiladi', ru: 'A делает, B тоже делает', en: 'A does it, B does it too' } as Record<string, string>)[language]}
                  </div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff', border: '1px solid #93c5fd' }}>
                  <div style={{ fontSize: 28, color: '#2563eb', fontWeight: 600, marginBottom: 2 }}>都</div>
                  <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {({ uz: 'HAMMASI', ru: 'ВСЕ', en: 'ALL' } as Record<string, string>)[language]}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {({ uz: 'A va B hammasi qiladi', ru: 'A и B оба делают', en: 'A and B all do it' } as Record<string, string>)[language]}
                  </div>
                </div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh">
                  他<span style={{ color: '#0d9488', fontWeight: 700 }}>也</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'U ham talaba. (yana bir kishi)', ru: 'Он тоже студент. (ещё один человек)', en: 'He is also a student. (one more person)' } as Record<string, string>)[language]}
                </div>
                <div className="grammar-block__usage-zh" style={{ marginTop: 6 }}>
                  他们<span style={{ color: '#2563eb', fontWeight: 700 }}>都</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'Ularning hammasi talaba. (butun guruh)', ru: 'Они все студенты. (вся группа)', en: 'They are all students. (the whole group)' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Guruhdagi hamma (hammasi)', ru: '1. Все в группе', en: '1. Everyone in a group (all)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: '我们/他们/大家', ru: '我们/他们/大家', en: '我们/他们/大家' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Hammasi bir xil ish qiladi', ru: 'Все делают одно и то же', en: 'Everyone does the same thing' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我们都喜欢吃中国菜。', py: 'Wǒmen dōu xǐhuan chī Zhōngguó cài.', uz: 'Biz hammamiz xitoy ovqatini yoqtiramiz.', ru: 'Мы все любим есть китайскую еду.', en: 'We all like eating Chinese food.' },
                { zh: '他们都是我的朋友。', py: 'Tāmen dōu shì wǒ de péngyǒu.', uz: 'Ularning hammasi mening do\'stim.', ru: 'Они все мои друзья.', en: 'They are all my friends.' },
                { zh: '大家都来了。', py: 'Dàjiā dōu lái le.', uz: 'Hamma keldi.', ru: 'Все пришли.', en: 'Everyone came.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. A va B — ikkalasi ham', ru: '2. A и B — оба', en: '2. A and B — both' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' + '}
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>和</span>
                {' + '}
                <span className="grammar-block__formula-a">B</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A va B ikkalasi ham', ru: 'И A, и B', en: 'Both A and B' } as Record<string, string>)[language]}</p>
              {[
                { zh: '爸爸和妈妈都工作。', py: 'Bàba hé māma dōu gōngzuò.', uz: 'Otam va onam ikkalasi ham ishlaydi.', ru: 'Папа и мама оба работают.', en: 'Dad and Mom both work.' },
                { zh: '茶和咖啡我都喜欢。', py: 'Chá hé kāfēi wǒ dōu xǐhuan.', uz: 'Choy va qahva — ikkalasini ham yoqtiraman.', ru: 'Чай и кофе — оба люблю.', en: 'Tea and coffee — I like both.' },
                { zh: '猫和狗都很可爱。', py: 'Māo hé gǒu dōu hěn kě\'ài.', uz: 'Mushuk va it ikkalasi ham yoqimli.', ru: 'Кошка и собака — оба милые.', en: 'Cats and dogs are both cute.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: '«茶和咖啡我都喜欢» — ob\'yekt oldinga chiqsa ham, 都 fe\'ldan oldin turadi!', ru: '«茶和咖啡我都喜欢» — объект вынесен вперёд, но 都 всё равно стоит перед глаголом!', en: 'In "茶和咖啡我都喜欢" the object is fronted, but 都 still comes before the verb!' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. 都不 — umuman ...maydi (kuchli inkor)', ru: '3. 都不 — вообще не (сильное отрицание)', en: '3. 都不 — not at all (strong negation)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '都不 = umuman ...maydi / hech biri ...maydi', ru: '都不 = никто не / вообще не', en: '都不 = none of them / not at all' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我什么都不想吃。', py: 'Wǒ shénme dōu bù xiǎng chī.', uz: 'Men umuman hech narsa yegim kelmayapti.', ru: 'Я вообще ничего не хочу есть.', en: 'I don\'t want to eat anything at all.' },
                { zh: '他们都不喝酒。', py: 'Tāmen dōu bù hē jiǔ.', uz: 'Ularning hech biri ichkilik ichmaydi.', ru: 'Никто из них не пьёт алкоголь.', en: 'None of them drink alcohol.' },
                { zh: '这些都不贵。', py: 'Zhèxiē dōu bú guì.', uz: 'Bularning hech biri qimmat emas.', ru: 'Ничего из этого не дорого.', en: 'None of these are expensive.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. 不都 — hammasi emas (qisman inkor)', ru: '4. 不都 — не все (частичное отрицание)', en: '4. 不都 — not all (partial negation)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '不都 = hammasi emas, bir qismi', ru: '不都 = не все, только некоторые', en: '不都 = not all, only some' } as Record<string, string>)[language]}</p>
              {[
                { zh: '他们不都是学生。', py: 'Tāmen bù dōu shì xuésheng.', uz: 'Ularning hammasi talaba emas. (ba\'zilari)', ru: 'Не все из них студенты. (некоторые)', en: 'Not all of them are students. (some are)' },
                { zh: '我们不都喜欢。', py: 'Wǒmen bù dōu xǐhuan.', uz: 'Biz hammamiz ham yoqtirmaydi. (ba\'zilar yoqtiradi)', ru: 'Нам не всем нравится. (некоторым нравится)', en: 'Not all of us like it. (some do)' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ <strong>{({ uz: 'Tartib juda muhim — ma\'no o\'zgaradi!', ru: 'Порядок меняет смысл!', en: 'Word order matters — meaning changes!' } as Record<string, string>)[language]}</strong>
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff' }}>
                    <div style={{ fontSize: 9, color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>
                      {({ uz: '都不 = UMUMAN EMAS', ru: '都不 = ВООБЩЕ НЕ', en: '都不 = NOT AT ALL' } as Record<string, string>)[language]}
                    </div>
                    <div className="grammar-block__usage-zh">他们<strong style={{ color: '#2563eb' }}>都不</strong>去</div>
                    <div className="grammar-block__usage-tr">{({ uz: 'Hech biri bormaydi', ru: 'Никто не идёт', en: 'Nobody goes' } as Record<string, string>)[language]}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed' }}>
                    <div style={{ fontSize: 9, color: '#d97706', fontWeight: 700, marginBottom: 3 }}>
                      {({ uz: '不都 = HAMMASI EMAS', ru: '不都 = НЕ ВСЕ', en: '不都 = NOT ALL' } as Record<string, string>)[language]}
                    </div>
                    <div className="grammar-block__usage-zh">他们<strong style={{ color: '#d97706' }}>不都</strong>去</div>
                    <div className="grammar-block__usage-tr">{({ uz: 'Hammasi bormaydi (ba\'zilari boradi)', ru: 'Не все идут', en: 'Not everyone goes (some do)' } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. Savol so\'zi + 都 (hamma narsa)', ru: '5. Вопросительное слово + 都 (всё/все)', en: '5. Question word + 都 (everything/everyone)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#9333ea', fontWeight: 700 }}>{({ uz: 'Savol so\'zi', ru: 'Вопр. слово', en: 'Question word' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '= hamma / hammasi / har qanday', ru: '= все / всё / что угодно', en: '= everyone / everything / anywhere' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我什么都吃。', py: 'Wǒ shénme dōu chī.', uz: 'Men hammasini yeyman.', ru: 'Я ем всё что угодно.', en: 'I eat everything.', word: '什么都 = что угодно' },
                { zh: '谁都知道。', py: 'Shéi dōu zhīdào.', uz: 'Hamma biladi.', ru: 'Все знают.', en: 'Everyone knows.', word: '谁都 = кто угодно' },
                { zh: '哪儿都有。', py: 'Nǎr dōu yǒu.', uz: 'Hamma joyda bor.', ru: 'Везде есть.', en: 'It\'s everywhere.', word: '哪儿都 = везде' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#7c3aed', marginTop: 3, fontStyle: 'italic' }}>{x.word}</div>
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Oila haqida', ru: 'Мини-диалог 1: О семье', en: 'Mini dialogue 1: About family' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你家有几个人？', py: 'Nǐ jiā yǒu jǐ gè rén?', uz: 'Oilangda necha kishi bor?', ru: 'Сколько человек в твоей семье?', en: 'How many people are in your family?' },
                  { speaker: 'B', zh: '五个人。爸爸、妈妈、哥哥、姐姐和我。', py: 'Wǔ gè rén. Bàba, māma, gēge, jiějie hé wǒ.', uz: 'Besh kishi. Otam, onam, akam, opam va men.', ru: 'Пять человек. Папа, мама, брат, сестра и я.', en: 'Five people. Dad, Mom, older brother, older sister, and me.' },
                  { speaker: 'A', zh: '你们都住在北京吗？', py: 'Nǐmen dōu zhù zài Běijīng ma?', uz: 'Hammangiz Pekinda yashaymisiz?', ru: 'Вы все живёте в Пекине?', en: 'Do you all live in Beijing?' },
                  { speaker: 'B', zh: '不都在。爸爸妈妈在北京，我们都在上海。', py: 'Bù dōu zài. Bàba māma zài Běijīng, wǒmen dōu zài Shànghǎi.', uz: 'Hammamiz emas. Ota-onam Pekinda, biz hammamiz Shanxayda.', ru: 'Не все. Родители в Пекине, мы все в Шанхае.', en: 'Not all. My parents are in Beijing, we are all in Shanghai.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Ovqat buyurtma', ru: 'Мини-диалог 2: Заказ еды', en: 'Mini dialogue 2: Ordering food' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你们想吃什么？', py: 'Nǐmen xiǎng chī shénme?', uz: 'Nima yemoqchisiz?', ru: 'Что вы хотите есть?', en: 'What would you like to eat?' },
                  { speaker: 'B', zh: '我们都想吃面条。', py: 'Wǒmen dōu xiǎng chī miàntiáo.', uz: 'Biz hammamiz noodle yemoqchimiz.', ru: 'Мы все хотим лапшу.', en: 'We all want noodles.' },
                  { speaker: 'A', zh: '喝的呢？都喝茶吗？', py: 'Hē de ne? Dōu hē chá ma?', uz: 'Ichimlikchi? Hammangiz choy ichasizmi?', ru: 'А напитки? Все будете чай?', en: 'And drinks? All having tea?' },
                  { speaker: 'B', zh: '不都喝茶。我喝茶，他喝咖啡。', py: 'Bù dōu hē chá. Wǒ hē chá, tā hē kāfēi.', uz: 'Hammamiz emas. Men choy, u qahva ichadi.', ru: 'Не все. Я чай, он кофе.', en: 'Not all. I\'ll have tea, he\'ll have coffee.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── POSITION ── */}
        {activeTab === 'position' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '都 ning aniq o\'rni', ru: 'Точная позиция 都', en: 'Exact position of 都' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {({ uz: '都 har doim egadan keyin, fe\'ldan oldin turadi — xuddi 也 kabi. Lekin muhim: 都 o\'zidan OLDINGI narsalarni umumlashtiradi!', ru: '都 всегда после подлежащего, перед глаголом — как и 也. Но важно: 都 обобщает то, что стоит ПЕРЕД ним!', en: '都 always comes after the subject and before the verb — just like 也. But importantly: 都 generalizes what comes BEFORE it!' } as Record<string, string>)[language]}
              </p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', background: '#f5f5f8', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ background: '#dcfce7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                    {({ uz: 'Ega (ko\'plik)', ru: 'Подлеж. (мн.ч.)', en: 'Subj. (plural)' } as Record<string, string>)[language]}
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#dbeafe', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, color: '#2563eb', border: '2px solid #2563eb' }}>都</span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fee2e2', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}
                  </span>
                </div>
              </div>
              <div className="grammar-block grammar-block--warning">
                <p className="grammar-block__tip-text">
                  ⚠️ {({ uz: '都 faqat o\'zidan OLDINGI narsalarni umumlashtiradi!', ru: '都 обобщает только то, что стоит ПЕРЕД ним!', en: '都 only generalizes what comes BEFORE it!' } as Record<string, string>)[language]}
                  <br />
                  他们<strong style={{ color: '#2563eb' }}>都</strong>喜欢茶 ✓ = {({ uz: 'Ular hammasi choy yoqtiradi', ru: 'Они все любят чай', en: 'They all like tea' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Xato va to\'g\'ri joylashtirish', ru: 'Ошибки и правильные варианты', en: 'Common mistakes and corrections' } as Record<string, string>)[language]}</div>
              {[
                { wrong: '都我们是学生。', right: '我们都是学生。', rule_uz: '都 gap boshiga qo\'yilmaydi — egadan keyin!', rule_ru: '都 не ставится в начало — только после подлежащего!', rule_en: '都 doesn\'t go at the beginning — only after the subject!' },
                { wrong: '我们是都学生。', right: '我们都是学生。', rule_uz: '都 fe\'l va ob\'yekt orasiga tushmaydi — fe\'ldan oldin!', rule_ru: '都 не между глаголом и объектом — только перед глаголом!', rule_en: '都 doesn\'t go between verb and object — only before the verb!' },
                { wrong: '我们是学生都。', right: '我们都是学生。', rule_uz: '都 gap oxiriga qo\'yilmaydi!', rule_ru: '都 не ставится в конец предложения!', rule_en: '都 doesn\'t go at the end of the sentence!' },
              ].map((ex, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                      <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {({ uz: 'XATO', ru: 'ОШИБКА', en: 'ERROR' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>{ex.wrong}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh">{ex.right}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{({ uz: ex.rule_uz, ru: ex.rule_ru, en: (ex as any).rule_en || ex.rule_uz } as Record<string, string>)[language]}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Boshqa so\'zlar bilan tartib', ru: 'Порядок с другими словами', en: 'Word order with other words' } as Record<string, string>)[language]}</div>
              {[
                { combo: '也 + 都', ex: '他们也都去了', ex_uz: 'Ular ham hammasi bordi', ex_ru: 'Они тоже все пошли', ex_en: 'They also all went' },
                { combo: '都 + 不', ex: '他们都不去', ex_uz: 'Hech biri bormaydi', ex_ru: 'Никто не идёт', ex_en: 'None of them are going' },
                { combo: '不 + 都', ex: '他们不都去', ex_uz: 'Hammasi bormaydi (ba\'zilari)', ex_ru: 'Не все идут', ex_en: 'Not all of them are going' },
                { combo: '都 + 没', ex: '我们都没去', ex_uz: 'Hech birimiz bormadik', ex_ru: 'Никто из нас не пошёл', ex_en: 'None of us went' },
                { combo: '都 + 很', ex: '她们都很漂亮', ex_uz: 'Ularning hammasi chiroyli', ex_ru: 'Они все красивые', ex_en: 'They are all beautiful' },
                { combo: '都 + 会', ex: '他们都会说中文', ex_uz: 'Hammasi xitoycha gapira oladi', ex_ru: 'Все умеют говорить по-китайски', ex_en: 'They can all speak Chinese' },
              ].map((r, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #f0f0f3' : 'none', alignItems: 'center' }}>
                  <span style={{ minWidth: 60, background: '#eff6ff', borderRadius: 4, padding: '2px 6px', textAlign: 'center', fontSize: '0.85em', fontWeight: 700, color: '#2563eb' }}>{r.combo}</span>
                  <div style={{ flex: 1, fontSize: '0.85em' }}>
                    <span className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{r.ex}</span>
                    <span className="grammar-block__usage-tr" style={{ display: 'inline', marginLeft: 6 }}>— {({ uz: r.ex_uz, ru: r.ex_ru, en: (r as any).ex_en || r.ex_uz } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Agar 也 va 都 birga kelsa — tartib 也都, hech qachon 都也.', ru: '💡 Если 也 и 都 вместе — порядок 也都, никогда 都也.', en: '💡 If 也 and 都 appear together, the order is 也都, never 都也.' } as Record<string, string>)[language]}
                </p>
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
