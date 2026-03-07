'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const COLOR = '#dc2626';
const COLOR_DARK = '#b91c1c';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  {
    zh: '我没吃饭。',
    pinyin: 'Wǒ méi chī fàn.',
    uz: 'Men ovqat yemadim.',
    ru: 'Я не ел.',
    note_uz: '没 + 吃 = yemadim (o\'tmishda bo\'lmagan harakat). 了 ishlatilMAYDI!',
    note_ru: '没 + 吃 = не ел (действие не состоялось в прошлом). 了 НЕ используется!',
  },
  {
    zh: '他没来。',
    pinyin: 'Tā méi lái.',
    uz: 'U kelmadi.',
    ru: 'Он не пришёл.',
    note_uz: '没 + 来 = kelmadi → 了 ishlatilMAYDI!',
    note_ru: '没 + 来 = не пришёл → 了 НЕ ставится!',
  },
  {
    zh: '我没有钱。',
    pinyin: 'Wǒ méiyǒu qián.',
    uz: 'Menda pul yo\'q.',
    ru: 'У меня нет денег.',
    note_uz: '没有 = yo\'q (egalik inkori). Noto\'g\'ri: ~~不有~~',
    note_ru: '没有 = нет (отрицание наличия). Нельзя: ~~不有~~',
  },
  {
    zh: '他没有车。',
    pinyin: 'Tā méiyǒu chē.',
    uz: 'Uning mashinasi yo\'q.',
    ru: 'У него нет машины.',
    note_uz: '没有 + ot = ...yo\'q (biror narsa mavjud emas)',
    note_ru: '没有 + существительное = нет чего-то (не существует)',
  },
  {
    zh: '我没去过中国。',
    pinyin: 'Wǒ méi qù guo Zhōngguó.',
    uz: 'Men Xitoyga borganim yo\'q.',
    ru: 'Я ни разу не был в Китае.',
    note_uz: '没 + 去过 = borganim yo\'q (tajriba inkori)',
    note_ru: '没 + 去过 = ни разу не был (отрицание опыта)',
  },
  {
    zh: '今天没下雨。',
    pinyin: 'Jīntiān méi xià yǔ.',
    uz: 'Bugun yomg\'ir yog\'madi.',
    ru: 'Сегодня не было дождя.',
    note_uz: '没 + 下雨 = yog\'madi (hodisa bo\'lmadi)',
    note_ru: '没 + 下雨 = не было дождя (событие не произошло)',
  },
  {
    zh: '她没说什么。',
    pinyin: 'Tā méi shuō shénme.',
    uz: 'U hech narsa demadi.',
    ru: 'Она ничего не сказала.',
    note_uz: '没 + 说 = demadi. 什么 = hech narsa (inkor bilan)',
    note_ru: '没 + 说 = не сказала. 什么 = ничего (в отрицании)',
  },
  {
    zh: '我们没有时间。',
    pinyin: 'Wǒmen méiyǒu shíjiān.',
    uz: 'Bizda vaqt yo\'q.',
    ru: 'У нас нет времени.',
    note_uz: '没有 + 时间 = vaqt yo\'q (mavjud emas)',
    note_ru: '没有 + 时间 = нет времени (не существует)',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men ovqat yemadim" qanday?',
    q_ru: 'Как сказать "Я не ел"?',
    options: ['我不吃饭', '我没吃饭', '我吃没饭', '没我吃饭'],
    correct: 1,
  },
  {
    q_uz: '没 va 不 ning asosiy farqi nima?',
    q_ru: 'В чём основная разница между 没 и 不?',
    options_uz: ['Farqi yo\'q', '没=o\'tmish/fakt, 不=odatiy/xohish', '没=kelajak, 不=o\'tmish', '没=ijobiy, 不=inkor'],
    options_ru: ['Нет разницы', '没=прошлое/факт, 不=привычка/желание', '没=будущее, 不=прошлое', '没=утверждение, 不=отрицание'],
    correct: 1,
  },
  {
    q_uz: '"Menda pul yo\'q" qanday?',
    q_ru: 'Как сказать "У меня нет денег"?',
    options: ['我不有钱', '我没钱有', '我没有钱', '没我有钱'],
    correct: 2,
  },
  {
    q_uz: '没 qanday o\'qiladi?',
    q_ru: 'Как читается 没?',
    options_uz: ['méi (2-ton)', 'měi (3-ton)', 'mèi (4-ton)', 'mēi (1-ton)'],
    options_ru: ['méi (2-й тон)', 'měi (3-й тон)', 'mèi (4-й тон)', 'mēi (1-й тон)'],
    correct: 0,
  },
  {
    q_uz: '没 + fe\'l gapda 了 ishlatiladi-mi?',
    q_ru: 'Используется ли 了 в предложении с 没 + глагол?',
    options_uz: ['Ha, har doim', 'Yo\'q, hech qachon', 'Faqat savol gapda', 'Faqat sifat bilan'],
    options_ru: ['Да, всегда', 'Нет, никогда', 'Только в вопросе', 'Только с прилагательным'],
    correct: 1,
  },
  {
    q_uz: '"U kelmadi" qanday?',
    q_ru: 'Как сказать "Он не пришёл"?',
    options: ['他不来', '他没来了', '他没来', '他来没'],
    correct: 2,
  },
];

export function GrammarMeiPage() {
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
        <div className="grammar-page__hero-bg">没</div>
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
          <div className="grammar-page__hero-char">没</div>
          <div className="grammar-page__hero-pinyin">méi</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'не (прошлое) / нет' : '...madim / yo\'q'} —</div>
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
            {language === 'ru' ? s.ru : s.uz}
          </button>
        ))}
      </div>

      <div className="grammar-page__content">

        {/* ── INTRO ── */}
        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Ieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char" style={{ color: COLOR }}>没</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">méi</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '2-й тон (вверх ↗)' : '2-ton (pastdan yuqoriga ↗)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'не (прошлое/факт); нет (отсутствие)' : '...madim (o\'tmish); yo\'q (mavjud emas)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">7</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Отрицательная частица / Глагол' : 'Inkor ravishi / Fe\'l'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Два отрицания китайского' : 'Ikki xitoy inkori'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '没 — второе отрицание китайского языка. В паре с 不:'
                  : '没 — xitoy tilining ikkinchi inkor so\'zi. 不 bilan juft:'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>没</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? 'ФАКТ / ПРОШЛОЕ' : 'FAKT / O\'TMISH'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? '...не делал\n...нет' : '...madim\n...yo\'q'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '1.8em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>不</div>
                  <div style={{ fontSize: '0.7em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? 'ПРИВЫЧКА / ЖЕЛАНИЕ' : 'ODATIY / XOHISH'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? '...не делаю\n...не хочу' : '...mayman\n...xohlamayman'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? '⚠️ Важное правило: 没 + глагол → без 了!' : '⚠️ Muhim qoida: 没 + fe\'l → 了 tushadi!'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'Когда используется 没, частица 了 не ставится:'
                  : '没 ishlatilganda 了 hech qachon qo\'yilmaydi:'}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR }}>没</span>吃饭。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я не ел.' : 'Men yemadim.'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'НЕВЕРНО' : 'XATO'}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>我没吃<span style={{ color: '#ef4444' }}>了</span>饭。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? '没 и 了 вместе не ставятся!' : '没 va 了 birga bo\'lmaydi!'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2 главных применения 没' : '没 ning 2 asosiy vazifasi'}</div>
              {[
                {
                  num: '1', color: COLOR,
                  title_uz: '没 + Fe\'l = ...madim',
                  title_ru: '没 + Глагол = не делал',
                  zh: '我<span style="color:' + COLOR + '">没</span>去。',
                  uz: 'Men bormadim.',
                  ru: 'Я не ходил.',
                },
                {
                  num: '2', color: COLOR_DARK,
                  title_uz: '没有 + Ot = ...yo\'q',
                  title_ru: '没有 + Сущ. = нет чего-то',
                  zh: '我<span style="color:' + COLOR_DARK + '">没有</span>钱。',
                  uz: 'Menda pul yo\'q.',
                  ru: 'У меня нет денег.',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8, borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                    {item.num}. {language === 'ru' ? item.title_ru : item.title_uz}
                  </div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{language === 'ru' ? item.ru : item.uz}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. 没 + Глагол = не делал (прошлое)' : '1. 没 + Fe\'l = ...madim (o\'tmish)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>没</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол (+ Объект)' : 'Fe\'l (+ To\'ldiruvchi)'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Действие не состоялось в прошлом' : 'O\'tmishda bo\'lmagan harakat'}</p>
              {[
                { zh: '我没吃饭。', py: 'Wǒ méi chī fàn.', uz: 'Men ovqat yemadim.', ru: 'Я не ел.' },
                { zh: '他没来。', py: 'Tā méi lái.', uz: 'U kelmadi.', ru: 'Он не пришёл.' },
                { zh: '我没看电影。', py: 'Wǒ méi kàn diànyǐng.', uz: 'Men kino ko\'rmadim.', ru: 'Я не смотрел кино.' },
                { zh: '她没说。', py: 'Tā méi shuō.', uz: 'U demadi.', ru: 'Она не сказала.' },
                { zh: '我们没去学校。', py: 'Wǒmen méi qù xuéxiào.', uz: 'Biz maktabga bormadik.', ru: 'Мы не ходили в школу.' },
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
                    ? 'В узбекском «-мадим / -мади» = по-китайски 没 + глагол. 了 не добавляется!'
                    : 'O\'zbek tilidagi «-madim / -madi» = xitoycha 没 + fe\'l. 了 qo\'ymang!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. 没有 + Сущ. = нет чего-то' : '2. 没有 + Ot = ...yo\'q (egalik inkori)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>没有</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Существительное' : 'Ot'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Что-то не существует / отсутствует' : 'Biror narsa mavjud emas / yo\'q'}</p>
              {[
                { zh: '我没有钱。', py: 'Wǒ méiyǒu qián.', uz: 'Menda pul yo\'q.', ru: 'У меня нет денег.' },
                { zh: '他没有车。', py: 'Tā méiyǒu chē.', uz: 'Uning mashinasi yo\'q.', ru: 'У него нет машины.' },
                { zh: '我们没有时间。', py: 'Wǒmen méiyǒu shíjiān.', uz: 'Bizda vaqt yo\'q.', ru: 'У нас нет времени.' },
                { zh: '这里没有人。', py: 'Zhèlǐ méiyǒu rén.', uz: 'Bu yerda hech kim yo\'q.', ru: 'Здесь никого нет.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{language === 'ru' ? 'Запомните:' : 'Eslab qoling:'}</strong>{' '}
                  {language === 'ru'
                    ? '有 (есть) отрицается ТОЛЬКО через 没有. Нельзя сказать ~~不有~~!'
                    : '有 (bor) ning inkori FAQAT 没有. ~~不有~~ deb bo\'lmaydi!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. 没有 → 没 (сокращение)' : '3. 没有 → 没 (qisqarishi)'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'В разговорной речи 没有 часто сокращается до 没:'
                  : 'Og\'zaki nutqda 没有 ko\'pincha 没 ga qisqaradi:'}
              </p>
              {[
                { full: '我没有钱。', short: '我没钱。', uz: 'Menda pul yo\'q.', ru: 'У меня нет денег.' },
                { full: '他没有时间。', short: '他没时间。', uz: 'Uning vaqti yo\'q.', ru: 'У него нет времени.' },
                { full: '这里没有水。', short: '这里没水。', uz: 'Bu yerda suv yo\'q.', ru: 'Здесь нет воды.' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f5f8' }}>
                    <div style={{ fontSize: '0.65em', color: '#888', fontWeight: 700, marginBottom: 2 }}>{language === 'ru' ? 'ПОЛНАЯ ФОРМА' : 'TO\'LIQ'}</div>
                    <div className="grammar-block__usage-zh">{x.full}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 2 }}>{language === 'ru' ? 'КРАТКАЯ ФОРМА' : 'QISQA'}</div>
                    <div className="grammar-block__usage-zh">{x.short}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block__usage-tr" style={{ marginTop: 4 }}>{language === 'ru' ? 'Обе формы правильны — краткая более разговорная.' : 'Ikkalasi ham to\'g\'ri — qisqasi ko\'proq og\'zaki.'}</div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. Вопрос о прошлом' : '4. O\'tmish haqida savol'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'Два способа спросить о прошлом:'
                  : 'O\'tmish haqida savol berishning ikki usuli:'}
              </p>
              {[
                {
                  type_uz: '...了吗？',
                  type_ru: '...了吗？',
                  q: '你吃了吗？',
                  py: 'Nǐ chī le ma?',
                  uz: 'Yedingmi?',
                  ru: 'Ты поел?',
                  color: '#059669',
                },
                {
                  type_uz: '...了没有？ (og\'zaki)',
                  type_ru: '...了没有？ (разговорное)',
                  q: '你吃了没有？',
                  py: 'Nǐ chī le méiyǒu?',
                  uz: 'Yeding-yemadingmi?',
                  ru: 'Поел или нет?',
                  color: COLOR,
                },
                {
                  type_uz: 'Fe\'l 没 Fe\'l',
                  type_ru: 'Глагол 没 Глагол',
                  q: '你吃没吃？',
                  py: 'Nǐ chī méi chī?',
                  uz: 'Yeding-yemadingmi?',
                  ru: 'Поел или нет?',
                  color: '#2563eb',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 4 }}>{language === 'ru' ? x.type_ru : x.type_uz}</div>
                  <div className="grammar-block__usage-zh" style={{ color: x.color }}>{x.q}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'Ответ: 吃了 (поел) / 没吃 (не ел). Коротко и ясно!'
                    : 'Javob: 吃了 (yedim) / 没吃 (yemadim). Qisqa va aniq!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. 还没 = ещё не' : '5. 还没 = hali ...madi'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: '#2563eb', fontWeight: 700 }}>还</span>
                <span style={{ color: COLOR, fontWeight: 700 }}>没</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
                {' (+ '}
                <span className="grammar-block__formula-ma">呢</span>
                {')'}
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Ещё не сделал (но должен / ожидается)' : 'Hali qilmadim (lekin qilishi kutilmoqda)'}</p>
              {[
                { zh: '我还没吃呢。', py: 'Wǒ hái méi chī ne.', uz: 'Men hali yemadim.', ru: 'Я ещё не ел.' },
                { zh: '他还没来。', py: 'Tā hái méi lái.', uz: 'U hali kelmadi.', ru: 'Он ещё не пришёл.' },
                { zh: '我还没写完。', py: 'Wǒ hái méi xiě wán.', uz: 'Men hali yozib tugatmadim.', ru: 'Я ещё не дописал.' },
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
                    ? '还没 = «ещё не» — действие ожидается, но пока не состоялось. 呢 в конце делает фразу естественнее.'
                    : '还没 = «hali» — harakat kutilmoqda, lekin hali bo\'lmagan. 呢 qo\'shilsa tabiiylashadi.'}
                </p>
              </div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Утро' : 'Mini dialog 1: Ertalab'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你吃早饭了吗？', py: 'Nǐ chī zǎofàn le ma?', uz: 'Nonushta qildingmi?', ru: 'Ты завтракал?' },
                  { speaker: 'B', zh: '还没呢。你呢？', py: 'Hái méi ne. Nǐ ne?', uz: 'Hali yo\'q. Senam?', ru: 'Ещё нет. А ты?' },
                  { speaker: 'A', zh: '我也没吃。走吧，一起去！', py: 'Wǒ yě méi chī. Zǒu ba, yìqǐ qù!', uz: 'Men ham yemadim. Yur, birga boramiz!', ru: 'Я тоже не ел. Пошли вместе!' },
                  { speaker: 'B', zh: '好！我没有钱，你能请我吗？', py: 'Hǎo! Wǒ méiyǒu qián, nǐ néng qǐng wǒ ma?', uz: 'Bo\'pti! Menda pul yo\'q, mehmon qila olasanmi?', ru: 'Хорошо! У меня нет денег, угостишь меня?' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Дома' : 'Mini dialog 2: Uyga qaytish'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '作业写了没有？', py: 'Zuòyè xiě le méiyǒu?', uz: 'Uy vazifani yozdingmi?', ru: 'Ты написал домашнее задание?' },
                  { speaker: 'B', zh: '还没写呢。', py: 'Hái méi xiě ne.', uz: 'Hali yozmadim.', ru: 'Ещё не написал.' },
                  { speaker: 'A', zh: '那你看电视了吗？', py: 'Nà nǐ kàn diànshì le ma?', uz: 'Unday bo\'lsa televizor ko\'rdingmi?', ru: 'Тогда телевизор смотрел?' },
                  { speaker: 'B', zh: '也没看。我今天什么都没做。', py: 'Yě méi kàn. Wǒ jīntiān shénme dōu méi zuò.', uz: 'Ko\'rmadim ham. Bugun hech narsa qilmadim.', ru: 'Тоже не смотрел. Сегодня ничего не делал.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
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

        {/* ── COMPARE ── */}
        {activeTab === 'compare' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '没 vs 不 — основная разница' : '没 vs 不 — asosiy farq'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'Оба отрицают, но по-разному:'
                  : 'Ikkalasi ham inkor, lekin boshqacha:'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>没</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? 'ФАКТ / ПРОШЛОЕ' : 'FAKT / O\'TMISH'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? '...не делал\n...нет' : '...madim\n...yo\'q'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '1.8em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>不</div>
                  <div style={{ fontSize: '0.7em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? 'ПРИВЫЧКА / ЖЕЛАНИЕ' : 'ODATIY / XOHISH'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? '...не делаю\n...не хочу' : '...mayman\n...xohlamayman'}</div>
                </div>
              </div>
              {[
                {
                  mei: '我没吃。', mei_uz: 'Men yemadim. (o\'tmish fakt)', mei_ru: 'Я не ел. (факт прошлого)',
                  bu: '我不吃。', bu_uz: 'Men yemayman. (xohlamayman)', bu_ru: 'Я не ем. (не хочу)',
                },
                {
                  mei: '他没来。', mei_uz: 'U kelmadi. (bo\'lmagan)', mei_ru: 'Он не пришёл. (факт)',
                  bu: '他不来。', bu_uz: 'U kelmaydi. (kelishni xohlamaydi)', bu_ru: 'Он не придёт. (не хочет)',
                },
                {
                  mei: '没下雨。', mei_uz: 'Yomg\'ir yog\'madi. (fakt)', mei_ru: 'Дождя не было. (факт)',
                  bu: '不下雨。', bu_uz: 'Yomg\'ir yog\'maydi. (prognoz)', bu_ru: 'Дождя нет. (прогноз)',
                },
                {
                  mei: '我没喝咖啡。', mei_uz: 'Men qahva ichmadim. (bugun)', mei_ru: 'Я не пил кофе. (сегодня)',
                  bu: '我不喝咖啡。', bu_uz: 'Men qahva ichmayman. (umuman)', bu_ru: 'Я не пью кофе. (вообще)',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 2 }}>没</div>
                    <div className="grammar-block__usage-zh">{x.mei}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.mei_ru : x.mei_uz}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>不</div>
                    <div className="grammar-block__usage-zh">{x.bu}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.bu_ru : x.bu_uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'С каким глаголом какое отрицание?' : 'Qaysi fe\'l bilan qaysi inkor?'}</div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85em' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f8' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{language === 'ru' ? 'Глагол' : 'Fe\'l'}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e6', color: COLOR }}>没</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e6', color: '#ef4444' }}>不</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { verb: '有 (bor/есть)', mei: '没有 ✓', bu: '不有 ✗', note_uz: '有 FAQAT 没有', note_ru: '有 только 没有' },
                      { verb: '是 (...dir/это)', mei: '没是 ✗', bu: '不是 ✓', note_uz: '是 FAQAT 不是', note_ru: '是 только 不是' },
                      { verb: '想 (xohla/хотеть)', mei: '没想 ✓', bu: '不想 ✓', note_uz: '没想=o\'ylamadim, 不想=xohlamayman', note_ru: '没想=не думал, 不想=не хочу' },
                      { verb: '去 (bor/идти)', mei: '没去 ✓', bu: '不去 ✓', note_uz: '没去=bormadim, 不去=bormayman', note_ru: '没去=не ходил, 不去=не пойду' },
                      { verb: '会 (olmoq/уметь)', mei: '没会 ✗', bu: '不会 ✓', note_uz: '会 FAQAT 不会', note_ru: '会 только 不会' },
                    ].map((r, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e0e0e6' : 'none' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#444' }}>{r.verb}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: r.mei.includes('✗') ? '#ef4444' : COLOR }}>{r.mei}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: r.bu.includes('✗') ? '#ef4444' : '#059669' }}>{r.bu}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ {language === 'ru'
                    ? 'Запомните три исключения: 有 → только 没有. 是 → только 不是. 会 → только 不会.'
                    : 'Uch istisnoni eslab qoling: 有 → faqat 没有. 是 → faqat 不是. 会 → faqat 不会.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '没 и 了 — итоговая таблица' : '没 va 了 — xulosa'}</div>
              {[
                {
                  icon: '✓', color: '#16a34a', bg: '#dcfce7',
                  label_uz: 'Ijobiy (o\'tmish)', label_ru: 'Утверждение (прошлое)',
                  ex: '我吃了。', ex_uz: 'Yedim.', ex_ru: 'Я поел.',
                },
                {
                  icon: '✓', color: COLOR, bg: '#fffbeb',
                  label_uz: 'Inkor (没)', label_ru: 'Отрицание (没)',
                  ex: '我没吃。', ex_uz: 'Yemadim. (了 YO\'Q)', ex_ru: 'Я не ел. (без 了)',
                },
                {
                  icon: '✗', color: '#ef4444', bg: '#fee2e2',
                  label_uz: 'XATO: 没 + 了', label_ru: 'ОШИБКА: 没 + 了',
                  ex: '我没吃了。', ex_uz: '❌ Mumkin emas!', ex_ru: '❌ Так нельзя!',
                },
                {
                  icon: '?', color: '#2563eb', bg: '#eff6ff',
                  label_uz: 'Savol', label_ru: 'Вопрос',
                  ex: '你吃了吗？', ex_uz: 'Yedingmi?', ex_ru: 'Ты поел?',
                },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: r.bg, borderRadius: 8, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                  <div style={{ fontSize: '1em', fontWeight: 700, color: r.color, minWidth: 20, textAlign: 'center' }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65em', fontWeight: 700, color: r.color, textTransform: 'uppercase' as const }}>{language === 'ru' ? r.label_ru : r.label_uz}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div className="grammar-block__usage-zh">{r.ex}</div>
                      <div className="grammar-block__usage-tr">{language === 'ru' ? r.ex_ru : r.ex_uz}</div>
                    </div>
                  </div>
                </div>
              ))}
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
