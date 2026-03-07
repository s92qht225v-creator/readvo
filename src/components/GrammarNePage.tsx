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
  { id: 'vsMa', uz: '呢 vs 吗', ru: '呢 vs 吗' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '我很好，你呢？', pinyin: 'Wǒ hěn hǎo, nǐ ne?', uz: 'Men yaxshiman, senchi?', ru: 'Я хорошо, а ты?', note_uz: 'Oldingi savol: 你好吗？ → Javob + 你呢 = «senchi?»', note_ru: 'Предыдущий вопрос: 你好吗？ → Ответ + 你呢 = «а ты?»' },
  { zh: '我喜欢茶，你呢？', pinyin: 'Wǒ xǐhuan chá, nǐ ne?', uz: 'Men choyni yoqtiraman, senchi?', ru: 'Я люблю чай, а ты?', note_uz: 'O\'z fikringni aytib, keyin suhbatdoshdan so\'rash', note_ru: 'Сначала говоришь своё мнение, потом спрашиваешь собеседника' },
  { zh: '他去学校了，她呢？', pinyin: 'Tā qù xuéxiào le, tā ne?', uz: 'U maktabga ketdi, u-chi?', ru: 'Он пошёл в школу, а она?', note_uz: 'Bir kishi haqida aytib, ikkinchisi haqida so\'rash', note_ru: 'Говорим об одном человеке, спрашиваем о другом' },
  { zh: '我的书呢？', pinyin: 'Wǒ de shū ne?', uz: 'Mening kitobim qani?', ru: 'Где моя книга?', note_uz: '呢 = «qani?» → narsa/kishini qidirish', note_ru: '呢 = «где?» → ищем вещь или человека' },
  { zh: '我吃米饭，你呢？', pinyin: 'Wǒ chī mǐfàn, nǐ ne?', uz: 'Men guruch yeyapman, senchi?', ru: 'Я ем рис, а ты?', note_uz: 'Taom tanlash — suhbatdoshdan so\'rash', note_ru: 'Выбор блюда — спрашиваем у собеседника' },
  { zh: '妈妈呢？', pinyin: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?', note_uz: '呢 = «qani? qayerda?» — odam qidirish', note_ru: '呢 = «где?» — ищем человека' },
  { zh: '我是学生，你呢？', pinyin: 'Wǒ shì xuésheng, nǐ ne?', uz: 'Men talabaman, senchi?', ru: 'Я студент, а ты?', note_uz: 'O\'zini tanishtirib, keyin suhbatdoshdan so\'rash', note_ru: 'Представляешься и спрашиваешь собеседника' },
  { zh: '钱呢？', pinyin: 'Qián ne?', uz: 'Pul qani?', ru: 'Где деньги?', note_uz: 'Juda qisqa savol — kontekstdan ma\'no aniq', note_ru: 'Очень короткий вопрос — смысл ясен из контекста' },
];

const quizQuestions = [
  {
    q_uz: '"Men yaxshiman, senchi?" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я хорошо, а ты?"?',
    options: ['我很好，你吗？', '我很好，你呢？', '我很好，呢你？', '你呢我很好？'],
    correct: 1,
  },
  {
    q_uz: '呢 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 呢 в предложении?',
    options_uz: ['Gap boshiga', 'Fe\'ldan oldin', 'Ot/olmoshdan keyin', 'Sifatdan oldin'],
    options_ru: ['В начало предложения', 'Перед глаголом', 'После существительного/местоимения', 'Перед прилагательным'],
    correct: 2,
  },
  {
    q_uz: '"Onam qani?" xitoycha?',
    q_ru: 'Как по-китайски "Где мама?"?',
    options: ['妈妈吗？', '妈妈呢？', '呢妈妈？', '妈妈在呢？'],
    correct: 1,
  },
  {
    q_uz: '呢 qanday o\'qiladi?',
    q_ru: 'Как читается 呢?',
    options_uz: ['né (2-ton)', 'nè (4-ton)', 'ne (tonsiz)', 'nǐ (3-ton)'],
    options_ru: ['né (2-й тон)', 'nè (4-й тон)', 'ne (нейтральный тон)', 'nǐ (3-й тон)'],
    correct: 2,
  },
  {
    q_uz: 'Qaysi gapda 呢 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 呢 использован ПРАВИЛЬНО?',
    options: ['你呢是学生？', '你好呢？', '我喝茶，你呢？', '呢你喜欢吗？'],
    correct: 2,
  },
  {
    q_uz: '"Kitobim qani?" qanday aytiladi?',
    q_ru: 'Как сказать "Где моя книга?"?',
    options: ['我的书吗？', '我的书呢？', '呢我的书？', '书的我呢？'],
    correct: 1,
  },
];

export function GrammarNePage() {
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
        <div className="grammar-page__hero-bg">呢</div>
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
          <div className="grammar-page__hero-char">呢</div>
          <div className="grammar-page__hero-pinyin">ne</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'продолжительная частица / «а ты?»' : 'davom yuklamasi / «senchi?»'} —</div>
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
                <div className="grammar-block__big-char">呢</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ne</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? 'Нейтральный (лёгкий, короткий)' : 'Tonsiz (yengil, qisqa)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? '«а ты?», «где?», «-чи?»' : '«senchi?», «qani?», «-chi?»'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '呢 — частица для продолжения разговора. Позволяет задать тот же вопрос в ответ или спросить, где что-то находится:'
                  : '呢 — suhbatni davom ettirish uchun yuklamadir. Xuddi o\'sha savolni qaytarish yoki narsaning qayerdaligini so\'rash uchun:'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  — 你好吗？ — 我很好。你<span className="grammar-block__highlight">呢</span>？
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? '— Как дела? — Хорошо. А ты?' : '— Yaxshimisan? — Yaxshiman. Senchi?'}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2 основных функции 呢' : '呢 ning 2 asosiy vazifasi'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Продолжение' : 'Qaytarish'}</div>
                  <div className="grammar-block__usage-zh">你<span className="grammar-block__highlight">呢</span>？</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'а ты? / и ты?' : 'senchi? / senchi?'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Где? Куда?' : 'Qani? Qayerda?'}</div>
                  <div className="grammar-block__usage-zh">书<span className="grammar-block__highlight">呢</span>？</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'где книга?' : 'kitob qani?'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Продолжение вопроса («а ты?»)' : '1. Savolni qaytarish («senchi?»)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Ответ' : 'Javob'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Сущ./Мест.' : 'Ot/Olmosh'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '«...чи? ...а ты?» — тот же вопрос возвращается' : '«...chi? ...senchi?» — o\'sha savol qaytariladi'}</p>
              {[
                { zh: '我很好，你呢？', py: 'Wǒ hěn hǎo, nǐ ne?', uz: 'Men yaxshiman, senchi?', ru: 'Я хорошо, а ты?' },
                { zh: '我喜欢茶，你呢？', py: 'Wǒ xǐhuan chá, nǐ ne?', uz: 'Men choyni yoqtiraman, senchi?', ru: 'Я люблю чай, а ты?' },
                { zh: '我是学生，你呢？', py: 'Wǒ shì xuésheng, nǐ ne?', uz: 'Men talabaman, senchi?', ru: 'Я студент, а ты?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {language === 'ru'
                    ? '💡 Правило: сначала скажи свой ответ, потом добавь существительное/местоимение + 呢?'
                    : '💡 Qoida: avval o\'z javobingni ayt, keyin ot/olmosh + 呢? qo\'sh.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Вопрос о третьем лице' : '2. Uchinchi shaxs haqida so\'rash'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Фраза' : 'Gap'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Человек' : 'Kishi'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Говорим об одном, спрашиваем о другом' : 'Bir kishi haqida aytib, boshqasi haqida so\'rash'}</p>
              {[
                { zh: '他去学校了，她呢？', py: 'Tā qù xuéxiào le, tā ne?', uz: 'U maktabga ketdi, u-chi?', ru: 'Он пошёл в школу, а она?' },
                { zh: '爸爸在家，妈妈呢？', py: 'Bàba zài jiā, māma ne?', uz: 'Otam uyda, onam-chi?', ru: 'Папа дома, а мама?' },
                { zh: '我吃了，你呢？', py: 'Wǒ chī le, nǐ ne?', uz: 'Men yedim, senchi?', ru: 'Я поел, а ты?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. «Где? Куда?» (поиск вещи/человека)' : '3. «Qani? Qayerda?» (narsa/kishi qidirish)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Вещь/Человек' : 'Narsa/Kishi'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '«...где? ...куда делось?»' : '«...qani? ...qayerda?»'}</p>
              {[
                { zh: '我的书呢？', py: 'Wǒ de shū ne?', uz: 'Kitobim qani?', ru: 'Где моя книга?' },
                { zh: '妈妈呢？', py: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?' },
                { zh: '钱呢？', py: 'Qián ne?', uz: 'Pul qani?', ru: 'Где деньги?' },
                { zh: '你的手机呢？', py: 'Nǐ de shǒujī ne?', uz: 'Telefoning qani?', ru: 'Где твой телефон?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {language === 'ru'
                    ? '💡 Контекст важен: 妈妈呢？ = «Где мама?» — только когда мамы нет рядом.'
                    : '💡 Kontekst muhim: 妈妈呢？ = «Onam qani?» — faqat onam ko\'rinmayotganda.'}
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Знакомство' : 'Mini dialog 1: Tanishuv'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
              {[
                { speaker: 'A', zh: '你好！我叫安娜。你呢？', py: 'Nǐ hǎo! Wǒ jiào Ānnà. Nǐ ne?', uz: 'Salom! Mening ismim Anna. Senchi?', ru: 'Привет! Меня зовут Анна. А тебя?' },
                { speaker: 'B', zh: '我叫李明。你是老师吗？', py: 'Wǒ jiào Lǐ Míng. Nǐ shì lǎoshī ma?', uz: 'Mening ismim Li Ming. Sen o\'qituvchimisan?', ru: 'Меня зовут Ли Мин. Ты учитель?' },
                { speaker: 'A', zh: '不是，我是学生。你呢？', py: 'Bú shì, wǒ shì xuésheng. Nǐ ne?', uz: 'Yo\'q, men talabaman. Senchi?', ru: 'Нет, я студент. А ты?' },
                { speaker: 'B', zh: '我也是学生！', py: 'Wǒ yě shì xuésheng!', uz: 'Men ham talabaman!', ru: 'Я тоже студент!' },
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Поиск' : 'Mini dialog 2: Qidirish'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
              {[
                { speaker: 'A', zh: '妈妈呢？', py: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?' },
                { speaker: 'B', zh: '妈妈去商店了。', py: 'Māma qù shāngdiàn le.', uz: 'Onang do\'konga ketdi.', ru: 'Мама пошла в магазин.' },
                { speaker: 'A', zh: '我的手机呢？', py: 'Wǒ de shǒujī ne?', uz: 'Telefonim qani?', ru: 'Где мой телефон?' },
                { speaker: 'B', zh: '在桌子上。', py: 'Zài zhuōzi shang.', uz: 'Stol ustida.', ru: 'На столе.' },
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

        {/* ── 呢 vs 吗 ── */}
        {activeTab === 'vsMa' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '呢 и 吗 — в чём разница?' : '呢 va 吗 — farqi nima?'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {language === 'ru'
                  ? 'Обе — вопросительные частицы, но функции разные:'
                  : 'Ikkalasi ham savol yuklamasi, lekin vazifasi boshqa:'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type" style={{ color: '#16a34a' }}>吗</div>
                  <div className="grammar-block__usage-zh" style={{ color: '#16a34a' }}>吗</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Да / Нет — полный вопрос' : 'Ha / Yo\'q — to\'liq savol'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type" style={{ color: '#dc2626' }}>呢</div>
                  <div className="grammar-block__usage-zh" style={{ color: '#dc2626' }}>呢</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Продолжение / Где? — краткий вопрос' : 'Davom / Qani? — qisqa savol'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Сравнение' : 'Solishtirish'}</div>
              {[
                { ma: '你好吗？', maUz: 'Yaxshimisiz?', maRu: 'Как дела?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', note_uz: '吗 = to\'liq savol, 呢 = qaytarish', note_ru: '吗 = полный вопрос, 呢 = возврат вопроса' },
                { ma: '你忙吗？', maUz: 'Bandmisan?', maRu: 'Ты занят?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', note_uz: '吗 = yangi savol, 呢 = avvalgi savol davomi', note_ru: '吗 = новый вопрос, 呢 = продолжение предыдущего' },
                { ma: '你喜欢吗？', maUz: 'Yoqtirasanmi?', maRu: 'Тебе нравится?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', note_uz: '吗 = aniq so\'rayapti, 呢 = «o\'sha narsa senchi?»', note_ru: '吗 = конкретный вопрос, 呢 = «а тебе то же самое?»' },
                { ma: '你是学生吗？', maUz: 'Talabamisan?', maRu: 'Ты студент?', ne: '她呢？', neUz: 'U-chi?', neRu: 'А она?', note_uz: '吗 = to\'liq savol, 呢 = boshqa kishiga o\'tish', note_ru: '吗 = полный вопрос, 呢 = переход к другому человеку' },
              ].map((x, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="grammar-block__usage-type" style={{ color: '#16a34a', fontSize: '0.7em' }}>吗</div>
                      <div className="grammar-block__usage-zh">{x.ma}</div>
                      <div className="grammar-block__usage-tr">{language === 'ru' ? x.maRu : x.maUz}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="grammar-block__usage-type" style={{ color: '#dc2626', fontSize: '0.7em' }}>呢</div>
                      <div className="grammar-block__usage-zh">{x.ne}</div>
                      <div className="grammar-block__usage-tr">{language === 'ru' ? x.neRu : x.neUz}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{language === 'ru' ? x.note_ru : x.note_uz}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Итог' : 'Xulosa'}</div>
              {[
                { rule_uz: 'To\'liq ha/yo\'q savol', rule_ru: 'Полный вопрос да/нет', ex: '你是学生吗？', word: '吗', isGreen: true },
                { rule_uz: 'Savolni qaytarish', rule_ru: 'Возврат вопроса', ex: '我很好，你呢？', word: '呢', isGreen: false },
                { rule_uz: 'Narsaning qaerdaligi', rule_ru: 'Поиск вещи/человека', ex: '我的书呢？', word: '呢', isGreen: false },
                { rule_uz: 'Boshqa kishiga o\'tish', rule_ru: 'Переход к другому человеку', ex: '他去了，她呢？', word: '呢', isGreen: false },
              ].map((r, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 3 ? '1px solid #f0f0f3' : 'none', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 22, borderRadius: 4, flexShrink: 0,
                    background: r.isGreen ? '#ecfdf5' : '#fef2f2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: r.isGreen ? '#16a34a' : '#dc2626',
                  }}>{r.word}</div>
                  <div style={{ flex: 1, fontSize: '0.85em' }}>
                    <span style={{ fontWeight: 600 }}>{language === 'ru' ? r.rule_ru : r.rule_uz}</span>
                    <span className="grammar-block__formula-desc" style={{ display: 'inline', marginLeft: 4 }}> — {r.ex}</span>
                  </div>
                </div>
              ))}

              <div className="grammar-block grammar-block--tip" style={{ margin: '12px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ <strong>{language === 'ru' ? 'Ошибка:' : 'Xato:'}</strong>{' '}
                  {language === 'ru' ? '呢 и 吗 нельзя использовать вместе!' : '呢 va 吗 ni birga ishlatib bo\'lmaydi!'}
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">
                    <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>你好吗呢？</span>
                    {' ✗ → '}
                    <span style={{ color: '#16a34a' }}>你好吗？</span>
                    {language === 'ru' ? ' или ' : ' yoki '}
                    <span style={{ color: '#16a34a' }}>你呢？</span>
                    {' ✓'}
                  </div>
                </div>
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
                  ? (language === 'ru' ? 'Проверить' : 'Tekshirish')
                  : `${Object.keys(answers).length} / ${quizQuestions.length} ${language === 'ru' ? 'выбрано' : 'tanlandi'}`}
              </button>
            ) : (
              <div className={`grammar-quiz__result ${score === quizQuestions.length ? 'grammar-quiz__result--perfect' : ''}`}>
                <div className="grammar-quiz__result-emoji">
                  {score === quizQuestions.length ? '🎉' : score >= 4 ? '👍' : '📚'}
                </div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? (language === 'ru' ? 'Отлично! Все правильно!' : 'Ajoyib! Barchasini to\'g\'ri topdingiz!')
                    : score >= 4
                      ? (language === 'ru' ? 'Хорошо! Немного повторите.' : 'Yaxshi! Biroz takrorlang.')
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
