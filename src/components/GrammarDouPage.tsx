'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры' },
  { id: 'position', uz: 'O\'rni', ru: 'Позиция' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '我们都是学生。', pinyin: 'Wǒmen dōu shì xuésheng.', uz: 'Biz hammamiz talabamiz.', ru: 'Мы все студенты.', note_uz: '我们 (wǒmen) = biz → 都 = hammamiz', note_ru: '我们 (wǒmen) = мы → 都 = все' },
  { zh: '他们都喜欢中国菜。', pinyin: 'Tāmen dōu xǐhuan Zhōngguó cài.', uz: 'Ularning hammasi xitoy ovqatini yoqtiradi.', ru: 'Им всем нравится китайская еда.', note_uz: '他们 (tāmen) = ular → 都 hammasi', note_ru: '他们 (tāmen) = они → 都 все' },
  { zh: '爸爸和妈妈都工作。', pinyin: 'Bàba hé māma dōu gōngzuò.', uz: 'Otam va onam ikkalasi ham ishlaydi.', ru: 'Папа и мама оба работают.', note_uz: 'A 和 B 都 = A va B ikkalasi ham', note_ru: 'A 和 B 都 = и A, и B' },
  { zh: '我什么都吃。', pinyin: 'Wǒ shénme dōu chī.', uz: 'Men hammasini yeb yuboraman.', ru: 'Я ем всё что угодно.', note_uz: '什么都 = nimani bo\'lsa ham, hammasini', note_ru: '什么都 = что угодно, всё' },
  { zh: '她都不想去。', pinyin: 'Tā dōu bù xiǎng qù.', uz: 'U umuman bormoqchi emas.', ru: 'Она вообще не хочет идти.', note_uz: '都不 = umuman ...maydi (kuchli inkor)', note_ru: '都不 = вообще не (сильное отрицание)' },
  { zh: '我们都很高兴。', pinyin: 'Wǒmen dōu hěn gāoxìng.', uz: 'Biz hammamiz xursandmiz.', ru: 'Мы все очень рады.', note_uz: '都 + 很 + sifat = hammasi ...dir', note_ru: '都 + 很 + прилагательное = все очень...' },
  { zh: '这些书都是我的。', pinyin: 'Zhèxiē shū dōu shì wǒ de.', uz: 'Bu kitoblarning hammasi meniki.', ru: 'Все эти книги мои.', note_uz: '这些 (zhèxiē) = bular → 都 = hammasi', note_ru: '这些 (zhèxiē) = эти → 都 = все' },
  { zh: '谁都知道。', pinyin: 'Shéi dōu zhīdào.', uz: 'Hamma biladi.', ru: 'Все знают.', note_uz: '谁都 = kim bo\'lsa ham, hamma', note_ru: '谁都 = кто угодно, все' },
];

const quizQuestions = [
  {
    q_uz: '"Biz hammamiz talabamiz" xitoycha qanday?',
    q_ru: 'Как сказать "Мы все студенты" по-китайски?',
    options: ['都我们是学生', '我们都是学生', '我们是都学生', '我们是学生都'],
    correct: 1,
  },
  {
    q_uz: '都 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 都 в предложении?',
    options_uz: ['Gap oxiriga', 'Ob\'yektdan keyin', 'Egadan keyin, fe\'ldan oldin', 'Gap boshiga'],
    options_ru: ['В конце предложения', 'После объекта', 'После подлежащего, перед глаголом', 'В начале предложения'],
    correct: 2,
  },
  {
    q_uz: '"Ularning hammasi bordi" qanday?',
    q_ru: 'Как сказать "Они все пошли"?',
    options: ['他们去都了', '都他们去了', '他们都去了', '去了他们都'],
    correct: 2,
  },
  {
    q_uz: '都 qanday o\'qiladi?',
    q_ru: 'Как читается 都?',
    options_uz: ['dōu (1-ton)', 'dóu (2-ton)', 'dǒu (3-ton)', 'dòu (4-ton)'],
    options_ru: ['dōu (1-й тон)', 'dóu (2-й тон)', 'dǒu (3-й тон)', 'dòu (4-й тон)'],
    correct: 0,
  },
  {
    q_uz: '也 va 都 birgalikda qanday tartibda?',
    q_ru: 'В каком порядке стоят 也 и 都 вместе?',
    options_uz: ['都也', '也都', 'Farqi yo\'q', 'Birgalikda ishlatilmaydi'],
    options_ru: ['都也', '也都', 'Нет разницы', 'Нельзя использовать вместе'],
    correct: 1,
  },
  {
    q_uz: '"Hamma biladi" xitoycha qanday?',
    q_ru: 'Как сказать "Все знают" по-китайски?',
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
          <div className="grammar-page__hero-label">HSK 1 · {language === 'ru' ? 'Грамматика' : 'Grammatika'}</div>
          <div className="grammar-page__hero-char">都</div>
          <div className="grammar-page__hero-pinyin">dōu</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'все / всё' : 'hammasi / barchasi'} —</div>
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
            {language === 'ru' ? s.ru : s.uz}
          </button>
        ))}
      </div>

      <div className="grammar-page__content">

        {/* ── INTRO ── */}
        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Hieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">都</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">dōu</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '1-й тон (ровный, высокий) ¯' : '1-ton (tekis, baland) ¯'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'все, всё, оба' : 'hammasi, barchasi'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">10</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Наречие' : 'Ravish (adverb)'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '都 — одно из самых частых слов в китайском. Используется для обобщения нескольких людей или вещей:'
                  : '都 — xitoy tilida «hammasi» ma\'nosini beruvchi eng muhim so\'z. Bir necha kishi yoki narsa haqida umumlashtirib gapirganda ishlatiladi:'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  他们喜欢茶。→ 他们<span className="grammar-block__highlight">都</span>喜欢茶。
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru'
                    ? 'Они любят чай. → Они все любят чай.'
                    : 'Ular choy yoqtiradi. → Ularning hammasi choy yoqtiradi.'}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основное правило' : 'Asosiy qoida'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж. (мн.ч.)' : 'Ega (ko\'plik)'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол / Прилаг.' : 'Fe\'l / Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru'
                  ? '都 всегда после подлежащего, перед глаголом — как и 也.'
                  : '都 har doim egadan keyin, fe\'ldan oldin turadi — xuddi 也 kabi.'}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '都 vs 也 — отличие' : '都 vs 也 — farqi'}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdfa', border: '1px solid #99f6e4' }}>
                  <div style={{ fontSize: 28, color: '#0d9488', fontWeight: 600, marginBottom: 2 }}>也</div>
                  <div style={{ fontSize: 10, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {language === 'ru' ? 'ТОЖЕ' : 'HAM'}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {language === 'ru' ? 'A делает, B тоже делает' : 'A qiladi, B ham qiladi'}
                  </div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff', border: '1px solid #93c5fd' }}>
                  <div style={{ fontSize: 28, color: '#2563eb', fontWeight: 600, marginBottom: 2 }}>都</div>
                  <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                    {language === 'ru' ? 'ВСЕ' : 'HAMMASI'}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>
                    {language === 'ru' ? 'A и B оба делают' : 'A va B hammasi qiladi'}
                  </div>
                </div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-zh">
                  他<span style={{ color: '#0d9488', fontWeight: 700 }}>也</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? 'Он тоже студент. (ещё один человек)' : 'U ham talaba. (yana bir kishi)'}
                </div>
                <div className="grammar-block__usage-zh" style={{ marginTop: 6 }}>
                  他们<span style={{ color: '#2563eb', fontWeight: 700 }}>都</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? 'Они все студенты. (вся группа)' : 'Ularning hammasi talaba. (butun guruh)'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Все в группе' : '1. Guruhdagi hamma (hammasi)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? '我们/他们/大家' : '我们/他们/大家'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Все делают одно и то же' : 'Hammasi bir xil ish qiladi'}</p>
              {[
                { zh: '我们都喜欢吃中国菜。', py: 'Wǒmen dōu xǐhuan chī Zhōngguó cài.', uz: 'Biz hammamiz xitoy ovqatini yoqtiramiz.', ru: 'Мы все любим есть китайскую еду.' },
                { zh: '他们都是我的朋友。', py: 'Tāmen dōu shì wǒ de péngyǒu.', uz: 'Ularning hammasi mening do\'stim.', ru: 'Они все мои друзья.' },
                { zh: '大家都来了。', py: 'Dàjiā dōu lái le.', uz: 'Hamma keldi.', ru: 'Все пришли.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. A и B — оба' : '2. A va B — ikkalasi ham'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' + '}
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>和</span>
                {' + '}
                <span className="grammar-block__formula-a">B</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'И A, и B' : 'A va B ikkalasi ham'}</p>
              {[
                { zh: '爸爸和妈妈都工作。', py: 'Bàba hé māma dōu gōngzuò.', uz: 'Otam va onam ikkalasi ham ishlaydi.', ru: 'Папа и мама оба работают.' },
                { zh: '茶和咖啡我都喜欢。', py: 'Chá hé kāfēi wǒ dōu xǐhuan.', uz: 'Choy va qahva — ikkalasini ham yoqtiraman.', ru: 'Чай и кофе — оба люблю.' },
                { zh: '猫和狗都很可爱。', py: 'Māo hé gǒu dōu hěn kě\'ài.', uz: 'Mushuk va it ikkalasi ham yoqimli.', ru: 'Кошка и собака — оба милые.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? '«茶和咖啡我都喜欢» — объект вынесен вперёд, но 都 всё равно стоит перед глаголом!'
                    : '«茶和咖啡我都喜欢» — ob\'yekt oldinga chiqsa ham, 都 fe\'ldan oldin turadi!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. 都不 — вообще не (сильное отрицание)' : '3. 都不 — umuman ...maydi (kuchli inkor)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '都不 = никто не / вообще не' : '都不 = umuman ...maydi / hech biri ...maydi'}</p>
              {[
                { zh: '我什么都不想吃。', py: 'Wǒ shénme dōu bù xiǎng chī.', uz: 'Men umuman hech narsa yegim kelmayapti.', ru: 'Я вообще ничего не хочу есть.' },
                { zh: '他们都不喝酒。', py: 'Tāmen dōu bù hē jiǔ.', uz: 'Ularning hech biri ichkilik ichmaydi.', ru: 'Никто из них не пьёт алкоголь.' },
                { zh: '这些都不贵。', py: 'Zhèxiē dōu bú guì.', uz: 'Bularning hech biri qimmat emas.', ru: 'Ничего из этого не дорого.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. 不都 — не все (частичное отрицание)' : '4. 不都 — hammasi emas (qisman inkor)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '不都 = не все, только некоторые' : '不都 = hammasi emas, bir qismi'}</p>
              {[
                { zh: '他们不都是学生。', py: 'Tāmen bù dōu shì xuésheng.', uz: 'Ularning hammasi talaba emas. (ba\'zilari)', ru: 'Не все из них студенты. (некоторые)' },
                { zh: '我们不都喜欢。', py: 'Wǒmen bù dōu xǐhuan.', uz: 'Biz hammamiz ham yoqtirmaydi. (ba\'zilar yoqtiradi)', ru: 'Нам не всем нравится. (некоторым нравится)' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ <strong>{language === 'ru' ? 'Порядок меняет смысл!' : 'Tartib juda muhim — ma\'no o\'zgaradi!'}</strong>
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff' }}>
                    <div style={{ fontSize: 9, color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>
                      {language === 'ru' ? '都不 = ВООБЩЕ НЕ' : '都不 = UMUMAN EMAS'}
                    </div>
                    <div className="grammar-block__usage-zh">他们<strong style={{ color: '#2563eb' }}>都不</strong>去</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? 'Никто не идёт' : 'Hech biri bormaydi'}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed' }}>
                    <div style={{ fontSize: 9, color: '#d97706', fontWeight: 700, marginBottom: 3 }}>
                      {language === 'ru' ? '不都 = НЕ ВСЕ' : '不都 = HAMMASI EMAS'}
                    </div>
                    <div className="grammar-block__usage-zh">他们<strong style={{ color: '#d97706' }}>不都</strong>去</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? 'Не все идут' : 'Hammasi bormaydi (ba\'zilari boradi)'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. Вопросительное слово + 都 (всё/все)' : '5. Savol so\'zi + 都 (hamma narsa)'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#9333ea', fontWeight: 700 }}>{language === 'ru' ? 'Вопр. слово' : 'Savol so\'zi'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '= все / всё / что угодно' : '= hamma / hammasi / har qanday'}</p>
              {[
                { zh: '我什么都吃。', py: 'Wǒ shénme dōu chī.', uz: 'Men hammasini yeyman.', ru: 'Я ем всё что угодно.', word: '什么都 = что угодно' },
                { zh: '谁都知道。', py: 'Shéi dōu zhīdào.', uz: 'Hamma biladi.', ru: 'Все знают.', word: '谁都 = кто угодно' },
                { zh: '哪儿都有。', py: 'Nǎr dōu yǒu.', uz: 'Hamma joyda bor.', ru: 'Везде есть.', word: '哪儿都 = везде' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Примеры предложений' : 'Namuna gaplar'}</div>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className={`grammar-block__example ${expandedEx === i ? 'grammar-block__example--open' : ''}`}
                  onClick={() => setExpandedEx(expandedEx === i ? null : i)}
                  type="button"
                >
                  <div className="grammar-block__example-zh">{ex.zh}</div>
                  <div className="grammar-block__example-py">{ex.pinyin}</div>
                  <div className="grammar-block__example-tr">{language === 'ru' ? ex.ru : ex.uz}</div>
                  {expandedEx === i && (
                    <div className="grammar-block__example-note">
                      💡 {language === 'ru' ? ex.note_ru : ex.note_uz}
                    </div>
                  )}
                </button>
              ))}
              <p className="grammar-block__hint">{language === 'ru' ? 'Нажмите — увидите пояснение' : 'Bosing — izoh ko\'rinadi'}</p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: О семье' : 'Mini dialog 1: Oila haqida'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你家有几个人？', py: 'Nǐ jiā yǒu jǐ gè rén?', uz: 'Oilangda necha kishi bor?', ru: 'Сколько человек в твоей семье?' },
                  { speaker: 'B', zh: '五个人。爸爸、妈妈、哥哥、姐姐和我。', py: 'Wǔ gè rén. Bàba, māma, gēge, jiějie hé wǒ.', uz: 'Besh kishi. Otam, onam, akam, opam va men.', ru: 'Пять человек. Папа, мама, брат, сестра и я.' },
                  { speaker: 'A', zh: '你们都住在北京吗？', py: 'Nǐmen dōu zhù zài Běijīng ma?', uz: 'Hammangiz Pekinda yashaymisiz?', ru: 'Вы все живёте в Пекине?' },
                  { speaker: 'B', zh: '不都在。爸爸妈妈在北京，我们都在上海。', py: 'Bù dōu zài. Bàba māma zài Běijīng, wǒmen dōu zài Shànghǎi.', uz: 'Hammamiz emas. Ota-onam Pekinda, biz hammamiz Shanxayda.', ru: 'Не все. Родители в Пекине, мы все в Шанхае.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Заказ еды' : 'Mini dialog 2: Ovqat buyurtma'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你们想吃什么？', py: 'Nǐmen xiǎng chī shénme?', uz: 'Nima yemoqchisiz?', ru: 'Что вы хотите есть?' },
                  { speaker: 'B', zh: '我们都想吃面条。', py: 'Wǒmen dōu xiǎng chī miàntiáo.', uz: 'Biz hammamiz noodle yemoqchimiz.', ru: 'Мы все хотим лапшу.' },
                  { speaker: 'A', zh: '喝的呢？都喝茶吗？', py: 'Hē de ne? Dōu hē chá ma?', uz: 'Ichimlikchi? Hammangiz choy ichasizmi?', ru: 'А напитки? Все будете чай?' },
                  { speaker: 'B', zh: '不都喝茶。我喝茶，他喝咖啡。', py: 'Bù dōu hē chá. Wǒ hē chá, tā hē kāfēi.', uz: 'Hammamiz emas. Men choy, u qahva ichadi.', ru: 'Не все. Я чай, он кофе.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Точная позиция 都' : '都 ning aniq o\'rni'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {language === 'ru'
                  ? '都 всегда после подлежащего, перед глаголом — как и 也. Но важно: 都 обобщает то, что стоит ПЕРЕД ним!'
                  : '都 har doim egadan keyin, fe\'ldan oldin turadi — xuddi 也 kabi. Lekin muhim: 都 o\'zidan OLDINGI narsalarni umumlashtiradi!'}
              </p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center', background: '#f5f5f8', borderRadius: 8, padding: '10px 14px' }}>
                  <span style={{ background: '#dcfce7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                    {language === 'ru' ? 'Подлеж. (мн.ч.)' : 'Ega (ko\'plik)'}
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#dbeafe', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, color: '#2563eb', border: '2px solid #2563eb' }}>都</span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fee2e2', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {language === 'ru' ? 'Глагол' : 'Fe\'l'}
                  </span>
                </div>
              </div>
              <div className="grammar-block grammar-block--warning">
                <p className="grammar-block__tip-text">
                  ⚠️ {language === 'ru'
                    ? '都 обобщает только то, что стоит ПЕРЕД ним!'
                    : '都 faqat o\'zidan OLDINGI narsalarni umumlashtiradi!'}
                  <br />
                  他们<strong style={{ color: '#2563eb' }}>都</strong>喜欢茶 ✓ = {language === 'ru' ? 'Они все любят чай' : 'Ular hammasi choy yoqtiradi'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Ошибки и правильные варианты' : 'Xato va to\'g\'ri joylashtirish'}</div>
              {[
                { wrong: '都我们是学生。', right: '我们都是学生。', rule_uz: '都 gap boshiga qo\'yilmaydi — egadan keyin!', rule_ru: '都 не ставится в начало — только после подлежащего!' },
                { wrong: '我们是都学生。', right: '我们都是学生。', rule_uz: '都 fe\'l va ob\'yekt orasiga tushmaydi — fe\'ldan oldin!', rule_ru: '都 не между глаголом и объектом — только перед глаголом!' },
                { wrong: '我们是学生都。', right: '我们都是学生。', rule_uz: '都 gap oxiriga qo\'yilmaydi!', rule_ru: '都 не ставится в конец предложения!' },
              ].map((ex, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                      <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {language === 'ru' ? 'ОШИБКА' : 'XATO'}</div>
                      <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>{ex.wrong}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                      <div className="grammar-block__usage-zh">{ex.right}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{language === 'ru' ? ex.rule_ru : ex.rule_uz}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Порядок с другими словами' : 'Boshqa so\'zlar bilan tartib'}</div>
              {[
                { combo: '也 + 都', ex: '他们也都去了', ex_uz: 'Ular ham hammasi bordi', ex_ru: 'Они тоже все пошли' },
                { combo: '都 + 不', ex: '他们都不去', ex_uz: 'Hech biri bormaydi', ex_ru: 'Никто не идёт' },
                { combo: '不 + 都', ex: '他们不都去', ex_uz: 'Hammasi bormaydi (ba\'zilari)', ex_ru: 'Не все идут' },
                { combo: '都 + 没', ex: '我们都没去', ex_uz: 'Hech birimiz bormadik', ex_ru: 'Никто из нас не пошёл' },
                { combo: '都 + 很', ex: '她们都很漂亮', ex_uz: 'Ularning hammasi chiroyli', ex_ru: 'Они все красивые' },
                { combo: '都 + 会', ex: '他们都会说中文', ex_uz: 'Hammasi xitoycha gapira oladi', ex_ru: 'Все умеют говорить по-китайски' },
              ].map((r, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #f0f0f3' : 'none', alignItems: 'center' }}>
                  <span style={{ minWidth: 60, background: '#eff6ff', borderRadius: 4, padding: '2px 6px', textAlign: 'center', fontSize: '0.85em', fontWeight: 700, color: '#2563eb' }}>{r.combo}</span>
                  <div style={{ flex: 1, fontSize: '0.85em' }}>
                    <span className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{r.ex}</span>
                    <span className="grammar-block__usage-tr" style={{ display: 'inline', marginLeft: 6 }}>— {language === 'ru' ? r.ex_ru : r.ex_uz}</span>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {language === 'ru'
                    ? '💡 Если 也 и 都 вместе — порядок 也都, никогда 都也.'
                    : '💡 Agar 也 va 都 birga kelsa — tartib 也都, hech qachon 都也.'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── QUIZ ── */}
        {activeTab === 'quiz' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{language === 'ru' ? 'Проверьте себя' : 'O\'zingizni sinang'}</div>
            {quizQuestions.map((q, qi) => {
              const opts = 'options' in q ? q.options : (language === 'ru' ? q.options_ru : q.options_uz);
              return (
                <div key={qi} className="grammar-quiz__question">
                  <div className="grammar-quiz__q">
                    {qi + 1}. {language === 'ru' ? q.q_ru : q.q_uz}
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
                  ? (language === 'ru' ? 'Проверить' : 'Tekshirish')
                  : `${Object.keys(answers).length} / ${quizQuestions.length} ${language === 'ru' ? 'выбрано' : 'tanlandi'}`}
              </button>
            ) : (
              <div className={`grammar-quiz__result ${score === quizQuestions.length ? 'grammar-quiz__result--perfect' : ''}`}>
                <div className="grammar-quiz__result-emoji">{score === quizQuestions.length ? '🎉' : score >= 4 ? '👍' : '📚'}</div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? (language === 'ru' ? 'Отлично! Всё правильно!' : 'Ajoyib! Barchasini to\'g\'ri topdingiz!')
                    : score >= 4
                    ? (language === 'ru' ? 'Хорошо! Повторите немного.' : 'Yaxshi! Biroz takrorlang.')
                    : (language === 'ru' ? 'Повторите урок.' : 'Darsni qayta ko\'ring.')}
                </div>
                <button
                  className="grammar-quiz__retry"
                  onClick={() => { setAnswers({}); setShowResults(false); }}
                  type="button"
                >
                  {language === 'ru' ? 'Попробовать снова' : 'Qayta urinish'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
