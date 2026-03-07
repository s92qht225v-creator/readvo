'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры' },
  { id: 'other', uz: 'Boshqa savollar', ru: 'Другие вопросы' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '你好吗？', pinyin: 'Nǐ hǎo ma?', uz: 'Yaxshimisiz?', ru: 'Как дела?', note_uz: '你 (nǐ) = sen, 好 (hǎo) = yaxshi → eng ko\'p ishlatiladigan savol', note_ru: '你 (nǐ) = ты, 好 (hǎo) = хорошо → самый частый вопрос' },
  { zh: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', uz: 'Sen talabamisan?', ru: 'Ты студент?', note_uz: '是 (shì) = ...dir → 是...吗 = ...misan?', note_ru: '是 (shì) = является → 是...吗 = является ли?' },
  { zh: '他喜欢吃鱼吗？', pinyin: 'Tā xǐhuan chī yú ma?', uz: 'U baliq yeyishni yoqtiradimi?', ru: 'Он любит есть рыбу?', note_uz: '喜欢 (xǐhuan) = yoqtirmoq → darak gap + 吗 = savol', note_ru: '喜欢 (xǐhuan) = нравиться → повествовательное + 吗 = вопрос' },
  { zh: '你忙吗？', pinyin: 'Nǐ máng ma?', uz: 'Bandmisan?', ru: 'Ты занят?', note_uz: '忙 (máng) = band → sifatli gap + 吗', note_ru: '忙 (máng) = занятой → прилагательное + 吗' },
  { zh: '今天冷吗？', pinyin: 'Jīntiān lěng ma?', uz: 'Bugun sovuqmi?', ru: 'Сегодня холодно?', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный' },
  { zh: '你有手机吗？', pinyin: 'Nǐ yǒu shǒujī ma?', uz: 'Senda telefon bormi?', ru: 'У тебя есть телефон?', note_uz: '有 (yǒu) = bor, 手机 (shǒujī) = telefon → 有...吗 = bormi?', note_ru: '有 (yǒu) = есть, 手机 (shǒujī) = телефон → 有...吗 = есть ли?' },
  { zh: '你想去吗？', pinyin: 'Nǐ xiǎng qù ma?', uz: 'Borgingmi?', ru: 'Ты хочешь идти?', note_uz: '想 (xiǎng) = xohlamoq, 去 (qù) = bormoq', note_ru: '想 (xiǎng) = хотеть, 去 (qù) = идти' },
  { zh: '这是你的吗？', pinyin: 'Zhè shì nǐ de ma?', uz: 'Bu senikimi?', ru: 'Это твоё?', note_uz: '这 (zhè) = bu, 你的 (nǐ de) = seniki', note_ru: '这 (zhè) = это, 你的 (nǐ de) = твоё' },
];

const quizQuestions = [
  {
    q_uz: '吗 gapning qayeriga qo\'yiladi?',
    q_ru: 'Куда ставится 吗?',
    options_uz: ['Boshiga', 'O\'rtasiga', 'Oxiriga', 'Fe\'ldan oldin'],
    options_ru: ['В начало', 'В середину', 'В конец', 'Перед глаголом'],
    correct: 2,
  },
  {
    q_uz: '"Sen talabamisan?" xitoycha qanday?',
    q_ru: 'Как по-китайски "Ты студент?"?',
    options: ['你是学生吗？', '吗你是学生？', '你学生是吗？', '是你学生吗？'],
    correct: 0,
  },
  {
    q_uz: '吗 bilan savol tuzish uchun nima kerak?',
    q_ru: 'Что нужно для образования вопроса с 吗?',
    options_uz: ['So\'z tartibini o\'zgartirish', 'Darak gap + 吗', 'Fe\'lni takrorlash', 'Maxsus so\'z qo\'shish'],
    options_ru: ['Изменить порядок слов', 'Повествовательное предл. + 吗', 'Повторить глагол', 'Добавить особое слово'],
    correct: 1,
  },
  {
    q_uz: 'Qaysi gapda 吗 ishlatilMAYDI?',
    q_ru: 'В каком предложении 吗 НЕ используется?',
    options: ['你好吗？', '你是谁？', '你忙吗？', '你喜欢吗？'],
    correct: 1,
  },
  {
    q_uz: '"Bugun sovuqmi?" xitoycha?',
    q_ru: 'Как по-китайски "Сегодня холодно?"?',
    options: ['今天冷吗？', '吗今天冷？', '冷今天吗？', '今天吗冷？'],
    correct: 0,
  },
  {
    q_uz: '吗 qanday o\'qiladi?',
    q_ru: 'Как читается 吗?',
    options_uz: ['mā (1-ton)', 'má (2-ton)', 'mǎ (3-ton)', 'ma (tonsiz)'],
    options_ru: ['mā (1-й тон)', 'má (2-й тон)', 'mǎ (3-й тон)', 'ma (нейтральный)'],
    correct: 3,
  },
];

export function GrammarMaPage() {
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
        <div className="grammar-page__hero-bg">吗</div>
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
          <div className="grammar-page__hero-char">吗</div>
          <div className="grammar-page__hero-pinyin">ma</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'вопросительная частица' : 'savol yuklamasi'} —</div>
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

        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Ieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">吗</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ma</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? 'нейтральный (лёгкий, короткий)' : 'Tonsiz (yengil, qisqa)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'вопросительная частица (-ли?, -а?)' : 'savol belgisi (-mi?, -misan?)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">6</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '吗 — самый простой способ задать вопрос в китайском. Добавьте 吗 в конец повествовательного предложения — и оно станет вопросом:'
                  : '吗 — xitoy tilida eng oddiy savol tuzish usuli. Darak gapning oxiriga 吗 qo\'shsangiz — savol bo\'ladi:'}
              </p>
              <div className="grammar-block__usage-item" style={{ marginTop: 8 }}>
                <div className="grammar-block__usage-zh" style={{ color: '#888', fontSize: '0.85em' }}>
                  你是学生。→ {language === 'ru' ? 'Ты студент.' : 'Sen talabasan.'}
                </div>
                <div className="grammar-block__usage-zh" style={{ marginTop: 4 }}>
                  你是学生<span className="grammar-block__highlight">吗</span>？
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? 'Ты студент?' : 'Sen talabamisan?'}
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8 }}>
                {language === 'ru' ? 'Порядок слов не меняется — только добавляется 吗!' : 'So\'z tartibi o\'zgarmaydi — faqat oxiriga 吗 qo\'shiladi!'}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основной принцип' : 'Asosiy tamoyil'}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Повествование' : 'Darak gap'}</div>
                  <div className="grammar-block__usage-zh">他是老师。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Он учитель.' : 'U o\'qituvchi.'}</div>
                </div>
                <div style={{ fontSize: '1.2em', color: '#059669' }}>→</div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                  <div className="grammar-block__usage-type" style={{ color: '#059669' }}>{language === 'ru' ? 'Вопрос' : 'Savol'}</div>
                  <div className="grammar-block__usage-zh">他是老师<span className="grammar-block__highlight">吗</span>？</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Он учитель?' : 'U o\'qituvchimi?'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. 是...吗？ (является ли?)' : '1. 是...吗？ (kimdir nimadirmi?)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-verb">是</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Существ.' : 'Ot'}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你是中国人吗？', py: 'Nǐ shì Zhōngguó rén ma?', uz: 'Sen xitoylimisan?', ru: 'Ты китаец?' },
                { zh: '她是你妈妈吗？', py: 'Tā shì nǐ māma ma?', uz: 'U sening onangmi?', ru: 'Она твоя мама?' },
                { zh: '这是你的书吗？', py: 'Zhè shì nǐ de shū ma?', uz: 'Bu sening kitobingmi?', ru: 'Это твоя книга?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Глагол...吗？ (делает ли?)' : '2. Fe\'l...吗？ (biror narsa qiladimi?)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-verb">{language === 'ru' ? 'Гл.' : 'Fe\'l'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Доп.' : 'Ob\'yekt'}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你喝茶吗？', py: 'Nǐ hē chá ma?', uz: 'Choy ichasanmi?', ru: 'Ты пьёшь чай?' },
                { zh: '他喜欢看书吗？', py: 'Tā xǐhuan kàn shū ma?', uz: 'U kitob o\'qishni yoqtiradimi?', ru: 'Он любит читать книги?' },
                { zh: '你想吃饭吗？', py: 'Nǐ xiǎng chī fàn ma?', uz: 'Ovqat yegingmi?', ru: 'Ты хочешь есть?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. Прилагательное + 吗？ (какой?)' : '3. Sifat + 吗？ (qandaymi?)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Предмет/Лицо' : 'Narsa/Kishi'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你忙吗？', py: 'Nǐ máng ma?', uz: 'Bandmisan?', ru: 'Ты занят?' },
                { zh: '今天热吗？', py: 'Jīntiān rè ma?', uz: 'Bugun issiqmi?', ru: 'Сегодня жарко?' },
                { zh: '贵吗？', py: 'Guì ma?', uz: 'Qimmatmi?', ru: 'Дорого?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '4. Ответы на вопросы с 吗' : '4. 吗 bilan javob berish'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? 'На вопрос с 吗 отвечают просто «да/нет». В ответе 吗 не используется!'
                  : '吗 savoliga oddiy ha/yo\'q javob beriladi. Javobda 吗 ishlatilmaydi!'}
              </p>
              {[
                { q: '你是学生吗？', a1: '是，我是学生。', a1uz: language === 'ru' ? 'Да, я студент.' : 'Ha, men talabaman.', a2: '不是，我是老师。', a2uz: language === 'ru' ? 'Нет, я учитель.' : 'Yo\'q, men o\'qituvchiman.' },
                { q: '你喜欢吗？', a1: '喜欢！', a1uz: language === 'ru' ? 'Нравится!' : 'Yoqtiraman!', a2: '不喜欢。', a2uz: language === 'ru' ? 'Не нравится.' : 'Yoqtirmayman.' },
                { q: '你忙吗？', a1: '忙。', a1uz: language === 'ru' ? 'Занят.' : 'Bandman.', a2: '不忙。', a2uz: language === 'ru' ? 'Не занят.' : 'Band emasman.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh" style={{ color: '#059669', fontWeight: 600 }}>{x.q}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'ДА' : 'HA'}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '0.85em' }}>{x.a1}</div>
                      <div className="grammar-block__usage-tr">{x.a1uz}</div>
                    </div>
                    <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#dc2626', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'НЕТ' : 'YO\'Q'}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '0.85em' }}>{x.a2}</div>
                      <div className="grammar-block__usage-tr">{x.a2uz}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог' : 'Mini dialog'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你好！你是新同学吗？', py: 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', uz: 'Salom! Sen yangi o\'quvchimisan?', ru: 'Привет! Ты новый студент?' },
                  { speaker: 'B', zh: '是，我叫李明。你呢？', py: 'Shì, wǒ jiào Lǐ Míng. Nǐ ne?', uz: 'Ha, mening ismim Li Ming. Senam?', ru: 'Да, меня зовут Ли Мин. А ты?' },
                  { speaker: 'A', zh: '我叫安娜。你喜欢喝茶吗？', py: 'Wǒ jiào Ānnà. Nǐ xǐhuan hē chá ma?', uz: 'Mening ismim Anna. Choy ichishni yoqtirasanmi?', ru: 'Меня зовут Анна. Ты любишь пить чай?' },
                  { speaker: 'B', zh: '喜欢！我们去喝茶吧！', py: 'Xǐhuan! Wǒmen qù hē chá ba!', uz: 'Yoqtiraman! Choy ichgani boraylik!', ru: 'Люблю! Пойдём пить чай!' },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#059669' : '#dc2626' }}>{line.speaker}:</span>
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

        {activeTab === 'other' && (
          <>
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '吗 vs другие типы вопросов' : '吗 vs boshqa savol usullari'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? 'В китайском языке несколько способов задать вопрос. 吗 только для вопросов «да/нет». Если есть вопросительное слово — 吗 не используется!'
                  : 'Xitoy tilida savol berish bir necha xil. 吗 faqat ha/yo\'q savollari uchun. Agar savol so\'zi bo\'lsa — 吗 ishlatilmaydi!'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                  <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em', color: '#059669' }}>吗</div>
                  <div className="grammar-block__usage-type" style={{ color: '#059669' }}>{language === 'ru' ? 'Да / Нет' : 'Ha / Yo\'q'}</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{language === 'ru' ? 'Ответ только «да» или «нет»' : 'Javob faqat «ha» yoki «yo\'q»'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
                  <div className="grammar-block__usage-zh" style={{ fontSize: '1em', color: '#d97706' }}>谁什么哪</div>
                  <div className="grammar-block__usage-type" style={{ color: '#d97706' }}>{language === 'ru' ? 'Вопросительные слова' : 'Savol so\'zlari'}</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{language === 'ru' ? 'Кто? Что? Где?' : 'Kim? Nima? Qayerda?'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">⚠️ {language === 'ru' ? '吗 НЕ используется:' : '吗 ishlatilMAYDI:'}</div>
              {[
                { zh: '你是谁？', py: 'Nǐ shì shéi?', uz: 'Sen kimsan?', ru: 'Кто ты?', word: '谁', reason_uz: '«Kim?» — savol so\'zi bor', reason_ru: '«Кто?» — есть вопросительное слово' },
                { zh: '这是什么？', py: 'Zhè shì shénme?', uz: 'Bu nima?', ru: 'Что это?', word: '什么', reason_uz: '«Nima?» — savol so\'zi bor', reason_ru: '«Что?» — есть вопросительное слово' },
                { zh: '你去哪儿？', py: 'Nǐ qù nǎr?', uz: 'Qayerga borasan?', ru: 'Куда идёшь?', word: '哪儿', reason_uz: '«Qayerga?» — savol so\'zi bor', reason_ru: '«Куда?» — есть вопросительное слово' },
                { zh: '你几岁？', py: 'Nǐ jǐ suì?', uz: 'Necha yoshdasan?', ru: 'Сколько тебе лет?', word: '几', reason_uz: '«Necha?» — savol so\'zi bor', reason_ru: '«Сколько?» — есть вопросительное слово' },
                { zh: '多少钱？', py: 'Duōshao qián?', uz: 'Qancha pul?', ru: 'Сколько стоит?', word: '多少', reason_uz: '«Qancha?» — savol so\'zi bor', reason_ru: '«Сколько?» — есть вопросительное слово' },
              ].map((ex, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ borderLeft: '3px solid #f59e0b', background: '#fffbeb', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65em', fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>{ex.word}</span>
                    <span style={{ fontSize: '0.7em', color: '#888', fontStyle: 'italic' }}>{language === 'ru' ? ex.reason_ru : ex.reason_uz}</span>
                  </div>
                  <div className="grammar-block__usage-zh">{ex.zh}</div>
                  <div className="grammar-block__usage-py">{ex.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? ex.ru : ex.uz}</div>
                </div>
              ))}
              <div className="grammar-block__usage-item" style={{ background: '#fef2f2', borderLeft: '3px solid #ef4444' }}>
                <div style={{ fontSize: '0.8em', color: '#dc2626', fontWeight: 700, marginBottom: 4 }}>
                  ⚠️ {language === 'ru' ? 'Ошибка:' : 'Xato:'}
                </div>
                <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through', color: '#dc2626' }}>你是谁吗？ &nbsp; 这是什么吗？</div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru'
                    ? 'Если есть вопросительное слово (谁, 什么, 哪, 几, 多少) — 吗 не нужна!'
                    : 'Savol so\'zi (谁, 什么, 哪, 几, 多少) bo\'lsa — 吗 kerak emas!'}
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Гл. + 不 + Гл.? (альтернатива 吗)' : 'Fe\'l + 不 + Fe\'l? (吗 alternativasi)'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? 'Вместо 吗 можно использовать повтор глагола с 不. Значение одинаковое:'
                  : 'Ha/yo\'q savolini 吗 o\'rniga fe\'l + 不 + fe\'l bilan ham bersa bo\'ladi. Ma\'no bir xil:'}
              </p>
              {[
                { ma: '你忙吗？', alt: '你忙不忙？', uz: 'Bandmisan?', ru: 'Ты занят?' },
                { ma: '你喜欢吗？', alt: '你喜不喜欢？', uz: 'Yoqtirasanmi?', ru: 'Нравится?' },
                { ma: '好吗？', alt: '好不好？', uz: 'Yaxshimi?', ru: 'Хорошо?' },
                { ma: '你是学生吗？', alt: '你是不是学生？', uz: 'Sen talabamisan?', ru: 'Ты студент?' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65em', color: '#059669', fontWeight: 700, marginBottom: 3 }}>吗 {language === 'ru' ? 'BILAN' : 'bilan'}</div>
                    <div className="grammar-block__usage-zh">{x.ma}</div>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#999' }}>=</div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65em', color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>V+不+V</div>
                    <div className="grammar-block__usage-zh">{x.alt}</div>
                  </div>
                </div>
              ))}
              <p className="grammar-block__hint">{language === 'ru' ? 'Оба варианта правильны — используйте любой' : 'Ikkala usul ham to\'g\'ri — o\'zingizga qulay bo\'lganini ishlating'}</p>
            </div>
          </>
        )}

        {activeTab === 'quiz' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{language === 'ru' ? 'Проверьте себя' : 'O\'zingizni sinang'}</div>
            {quizQuestions.map((q, qi) => {
              const opts = q.options || (language === 'ru' ? q.options_ru : q.options_uz) || [];
              return (
                <div key={qi} className="grammar-quiz__question">
                  <p className="grammar-quiz__q">{qi + 1}. {language === 'ru' ? q.q_ru : q.q_uz}</p>
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

      <PageFooter />
    </div>
  );
}
