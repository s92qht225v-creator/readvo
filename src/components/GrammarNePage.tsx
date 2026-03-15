'use client';

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'vsMa', uz: '呢 vs 吗', ru: '呢 vs 吗', en: '呢 vs 吗' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我很好，你呢？', pinyin: 'Wǒ hěn hǎo, nǐ ne?', uz: 'Men yaxshiman, senchi?', ru: 'Я хорошо, а ты?', en: 'I\'m fine, and you?', note_uz: 'Oldingi savol: 你好吗？ → Javob + 你呢 = «senchi?»', note_ru: 'Предыдущий вопрос: 你好吗？ → Ответ + 你呢 = «а ты?»', note_en: 'Previous question: 你好吗？ → Answer + 你呢 = "and you?"' },
  { zh: '我喜欢茶，你呢？', pinyin: 'Wǒ xǐhuan chá, nǐ ne?', uz: 'Men choyni yoqtiraman, senchi?', ru: 'Я люблю чай, а ты?', en: 'I like tea, and you?', note_uz: 'O\'z fikringni aytib, keyin suhbatdoshdan so\'rash', note_ru: 'Сначала говоришь своё мнение, потом спрашиваешь собеседника', note_en: 'First state your opinion, then ask the other person' },
  { zh: '他去学校了，她呢？', pinyin: 'Tā qù xuéxiào le, tā ne?', uz: 'U maktabga ketdi, u-chi?', ru: 'Он пошёл в школу, а она?', en: 'He went to school, what about her?', note_uz: 'Bir kishi haqida aytib, ikkinchisi haqida so\'rash', note_ru: 'Говорим об одном человеке, спрашиваем о другом', note_en: 'Talk about one person, then ask about another' },
  { zh: '我的书呢？', pinyin: 'Wǒ de shū ne?', uz: 'Mening kitobim qani?', ru: 'Где моя книга?', en: 'Where is my book?', note_uz: '呢 = «qani?» → narsa/kishini qidirish', note_ru: '呢 = «где?» → ищем вещь или человека', note_en: '呢 = "where?" → looking for a thing or person' },
  { zh: '我吃米饭，你呢？', pinyin: 'Wǒ chī mǐfàn, nǐ ne?', uz: 'Men guruch yeyapman, senchi?', ru: 'Я ем рис, а ты?', en: 'I\'m eating rice, and you?', note_uz: 'Taom tanlash — suhbatdoshdan so\'rash', note_ru: 'Выбор блюда — спрашиваем у собеседника', note_en: 'Choosing food — asking the other person' },
  { zh: '妈妈呢？', pinyin: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?', en: 'Where is mom?', note_uz: '呢 = «qani? qayerda?» — odam qidirish', note_ru: '呢 = «где?» — ищем человека', note_en: '呢 = "where?" — looking for a person' },
  { zh: '我是学生，你呢？', pinyin: 'Wǒ shì xuésheng, nǐ ne?', uz: 'Men talabaman, senchi?', ru: 'Я студент, а ты?', en: 'I\'m a student, and you?', note_uz: 'O\'zini tanishtirib, keyin suhbatdoshdan so\'rash', note_ru: 'Представляешься и спрашиваешь собеседника', note_en: 'Introduce yourself, then ask the other person' },
  { zh: '钱呢？', pinyin: 'Qián ne?', uz: 'Pul qani?', ru: 'Где деньги?', en: 'Where is the money?', note_uz: 'Juda qisqa savol — kontekstdan ma\'no aniq', note_ru: 'Очень короткий вопрос — смысл ясен из контекста', note_en: 'Very short question — meaning is clear from context' },
];

const quizQuestions = [
  {
    q_uz: '"Men yaxshiman, senchi?" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я хорошо, а ты?"?',
    q_en: 'How do you say "I\'m fine, and you?" in Chinese?',
    options: ['我很好，你吗？', '我很好，你呢？', '我很好，呢你？', '你呢我很好？'],
    correct: 1,
  },
  {
    q_uz: '呢 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 呢 в предложении?',
    q_en: 'Where is 呢 placed in a sentence?',
    options_uz: ['Gap boshiga', 'Fe\'ldan oldin', 'Ot/olmoshdan keyin', 'Sifatdan oldin'],
    options_ru: ['В начало предложения', 'Перед глаголом', 'После существительного/местоимения', 'Перед прилагательным'],
    options_en: ['At the beginning', 'Before the verb', 'After a noun/pronoun', 'Before an adjective'],
    correct: 2,
  },
  {
    q_uz: '"Onam qani?" xitoycha?',
    q_ru: 'Как по-китайски "Где мама?"?',
    q_en: 'How do you say "Where is mom?" in Chinese?',
    options: ['妈妈吗？', '妈妈呢？', '呢妈妈？', '妈妈在呢？'],
    correct: 1,
  },
  {
    q_uz: '呢 qanday o\'qiladi?',
    q_ru: 'Как читается 呢?',
    q_en: 'How is 呢 pronounced?',
    options_uz: ['né (2-ton)', 'nè (4-ton)', 'ne (tonsiz)', 'nǐ (3-ton)'],
    options_ru: ['né (2-й тон)', 'nè (4-й тон)', 'ne (нейтральный тон)', 'nǐ (3-й тон)'],
    options_en: ['né (2nd tone)', 'nè (4th tone)', 'ne (neutral tone)', 'nǐ (3rd tone)'],
    correct: 2,
  },
  {
    q_uz: 'Qaysi gapda 呢 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 呢 использован ПРАВИЛЬНО?',
    q_en: 'In which sentence is 呢 used CORRECTLY?',
    options: ['你呢是学生？', '你好呢？', '我喝茶，你呢？', '呢你喜欢吗？'],
    correct: 2,
  },
  {
    q_uz: '"Kitobim qani?" qanday aytiladi?',
    q_ru: 'Как сказать "Где моя книга?"?',
    q_en: 'How do you say "Where is my book?"?',
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
          <div className="grammar-page__hero-label">HSK 1 · {({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</div>
          <h1 className="grammar-page__hero-char">呢</h1>
          <div className="grammar-page__hero-pinyin">ne</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'davom yuklamasi / «senchi?»', ru: 'продолжительная частица / «а ты?»', en: 'continuation particle / "and you?"' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">呢</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ne</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: 'Tonsiz (yengil, qisqa)', ru: 'Нейтральный (лёгкий, короткий)', en: 'Neutral (light, short)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: '«senchi?», «qani?», «-chi?»', ru: '«а ты?», «где?», «-чи?»', en: '"and you?", "where is?", "what about?"' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '呢 — suhbatni davom ettirish uchun yuklamadir. Xuddi o\'sha savolni qaytarish yoki narsaning qayerdaligini so\'rash uchun:', ru: '呢 — частица для продолжения разговора. Позволяет задать тот же вопрос в ответ или спросить, где что-то находится:', en: '呢 is a particle used to continue a conversation. It lets you return the same question or ask where something is:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  — 你好吗？ — 我很好。你<span className="grammar-block__highlight">呢</span>？
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: '— Yaxshimisan? — Yaxshiman. Senchi?', ru: '— Как дела? — Хорошо. А ты?', en: '— How are you? — I\'m fine. And you?' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '呢 ning 2 asosiy vazifasi', ru: '2 основных функции 呢', en: '2 main functions of 呢' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Qaytarish', ru: 'Продолжение', en: 'Follow-up' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">你<span className="grammar-block__highlight">呢</span>？</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'senchi? / senchi?', ru: 'а ты? / и ты?', en: 'and you? / what about you?' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Qani? Qayerda?', ru: 'Где? Куда?', en: 'Where? Where is?' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">书<span className="grammar-block__highlight">呢</span>？</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'kitob qani?', ru: 'где книга?', en: 'where is the book?' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Savolni qaytarish («senchi?»)', ru: '1. Продолжение вопроса («а ты?»)', en: '1. Returning a question ("and you?")' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Javob', ru: 'Ответ', en: 'Answer' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot/Olmosh', ru: 'Сущ./Мест.', en: 'Noun/Pronoun' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«...chi? ...senchi?» — o\'sha savol qaytariladi', ru: '«...чи? ...а ты?» — тот же вопрос возвращается', en: '"...and you?" — the same question is returned' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我很好，你呢？', py: 'Wǒ hěn hǎo, nǐ ne?', uz: 'Men yaxshiman, senchi?', ru: 'Я хорошо, а ты?', en: 'I\'m fine, and you?' },
                { zh: '我喜欢茶，你呢？', py: 'Wǒ xǐhuan chá, nǐ ne?', uz: 'Men choyni yoqtiraman, senchi?', ru: 'Я люблю чай, а ты?', en: 'I like tea, and you?' },
                { zh: '我是学生，你呢？', py: 'Wǒ shì xuésheng, nǐ ne?', uz: 'Men talabaman, senchi?', ru: 'Я студент, а ты?', en: 'I\'m a student, and you?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Qoida: avval o\'z javobingni ayt, keyin ot/olmosh + 呢? qo\'sh.', ru: '💡 Правило: сначала скажи свой ответ, потом добавь существительное/местоимение + 呢?', en: '💡 Rule: first give your answer, then add noun/pronoun + 呢?' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Uchinchi shaxs haqida so\'rash', ru: '2. Вопрос о третьем лице', en: '2. Asking about a third person' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Gap', ru: 'Фраза', en: 'Phrase' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Kishi', ru: 'Человек', en: 'Person' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Bir kishi haqida aytib, boshqasi haqida so\'rash', ru: 'Говорим об одном, спрашиваем о другом', en: 'Talk about one person, then ask about another' } as Record<string, string>)[language]}</p>
              {[
                { zh: '他去学校了，她呢？', py: 'Tā qù xuéxiào le, tā ne?', uz: 'U maktabga ketdi, u-chi?', ru: 'Он пошёл в школу, а она?', en: 'He went to school, what about her?' },
                { zh: '爸爸在家，妈妈呢？', py: 'Bàba zài jiā, māma ne?', uz: 'Otam uyda, onam-chi?', ru: 'Папа дома, а мама?', en: 'Dad is home, what about mom?' },
                { zh: '我吃了，你呢？', py: 'Wǒ chī le, nǐ ne?', uz: 'Men yedim, senchi?', ru: 'Я поел, а ты?', en: 'I\'ve eaten, and you?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. «Qani? Qayerda?» (narsa/kishi qidirish)', ru: '3. «Где? Куда?» (поиск вещи/человека)', en: '3. "Where?" (looking for a thing/person)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-b">{({ uz: 'Narsa/Kishi', ru: 'Вещь/Человек', en: 'Thing/Person' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">呢？</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«...qani? ...qayerda?»', ru: '«...где? ...куда делось?»', en: '"...where is? ...where did it go?"' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我的书呢？', py: 'Wǒ de shū ne?', uz: 'Kitobim qani?', ru: 'Где моя книга?', en: 'Where is my book?' },
                { zh: '妈妈呢？', py: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?', en: 'Where is mom?' },
                { zh: '钱呢？', py: 'Qián ne?', uz: 'Pul qani?', ru: 'Где деньги?', en: 'Where is the money?' },
                { zh: '你的手机呢？', py: 'Nǐ de shǒujī ne?', uz: 'Telefoning qani?', ru: 'Где твой телефон?', en: 'Where is your phone?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Kontekst muhim: 妈妈呢？ = «Onam qani?» — faqat onam ko\'rinmayotganda.', ru: '💡 Контекст важен: 妈妈呢？ = «Где мама?» — только когда мамы нет рядом.', en: '💡 Context matters: 妈妈呢？ = "Where is mom?" — only when mom is not around.' } as Record<string, string>)[language]}
                </p>
              </div>
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
                  <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1}}>{ex.zh}</span>
                  <span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.zh);}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</span>
                </div>
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Tanishuv', ru: 'Мини-диалог 1: Знакомство', en: 'Mini Dialogue 1: Introduction' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
              {[
                { speaker: 'A', zh: '你好！我叫安娜。你呢？', py: 'Nǐ hǎo! Wǒ jiào Ānnà. Nǐ ne?', uz: 'Salom! Mening ismim Anna. Senchi?', ru: 'Привет! Меня зовут Анна. А тебя?', en: 'Hello! My name is Anna. And yours?' },
                { speaker: 'B', zh: '我叫李明。你是老师吗？', py: 'Wǒ jiào Lǐ Míng. Nǐ shì lǎoshī ma?', uz: 'Mening ismim Li Ming. Sen o\'qituvchimisan?', ru: 'Меня зовут Ли Мин. Ты учитель?', en: 'My name is Li Ming. Are you a teacher?' },
                { speaker: 'A', zh: '不是，我是学生。你呢？', py: 'Bú shì, wǒ shì xuésheng. Nǐ ne?', uz: 'Yo\'q, men talabaman. Senchi?', ru: 'Нет, я студент. А ты?', en: 'No, I\'m a student. And you?' },
                { speaker: 'B', zh: '我也是学生！', py: 'Wǒ yě shì xuésheng!', uz: 'Men ham talabaman!', ru: 'Я тоже студент!', en: 'I\'m also a student!' },
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Qidirish', ru: 'Мини-диалог 2: Поиск', en: 'Mini Dialogue 2: Searching' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
              {[
                { speaker: 'A', zh: '妈妈呢？', py: 'Māma ne?', uz: 'Onam qani?', ru: 'Где мама?', en: 'Where is mom?' },
                { speaker: 'B', zh: '妈妈去商店了。', py: 'Māma qù shāngdiàn le.', uz: 'Onang do\'konga ketdi.', ru: 'Мама пошла в магазин.', en: 'Mom went to the store.' },
                { speaker: 'A', zh: '我的手机呢？', py: 'Wǒ de shǒujī ne?', uz: 'Telefonim qani?', ru: 'Где мой телефон?', en: 'Where is my phone?' },
                { speaker: 'B', zh: '在桌子上。', py: 'Zài zhuōzi shang.', uz: 'Stol ustida.', ru: 'На столе.', en: 'On the table.' },
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

        {/* ── 呢 vs 吗 ── */}
        {activeTab === 'vsMa' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '呢 va 吗 — farqi nima?', ru: '呢 и 吗 — в чём разница?', en: '呢 vs 吗 — what\'s the difference?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {({ uz: 'Ikkalasi ham savol yuklamasi, lekin vazifasi boshqa:', ru: 'Обе — вопросительные частицы, но функции разные:', en: 'Both are question particles, but they have different functions:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type" style={{ color: '#16a34a' }}>吗</div>
                  <div className="grammar-block__usage-zh" style={{ color: '#16a34a' }}>吗</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Ha / Yo\'q — to\'liq savol', ru: 'Да / Нет — полный вопрос', en: 'Yes / No — full question' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type" style={{ color: '#dc2626' }}>呢</div>
                  <div className="grammar-block__usage-zh" style={{ color: '#dc2626' }}>呢</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Davom / Qani? — qisqa savol', ru: 'Продолжение / Где? — краткий вопрос', en: 'Follow-up / Where? — short question' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Solishtirish', ru: 'Сравнение', en: 'Comparison' } as Record<string, string>)[language]}</div>
              {[
                { ma: '你好吗？', maUz: 'Yaxshimisiz?', maRu: 'Как дела?', maEn: 'How are you?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', neEn: 'And you?', note_uz: '吗 = to\'liq savol, 呢 = qaytarish', note_ru: '吗 = полный вопрос, 呢 = возврат вопроса', note_en: '吗 = full question, 呢 = returning the question' },
                { ma: '你忙吗？', maUz: 'Bandmisan?', maRu: 'Ты занят?', maEn: 'Are you busy?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', neEn: 'And you?', note_uz: '吗 = yangi savol, 呢 = avvalgi savol davomi', note_ru: '吗 = новый вопрос, 呢 = продолжение предыдущего', note_en: '吗 = new question, 呢 = continuation of previous question' },
                { ma: '你喜欢吗？', maUz: 'Yoqtirasanmi?', maRu: 'Тебе нравится?', maEn: 'Do you like it?', ne: '你呢？', neUz: 'Senchi?', neRu: 'А ты?', neEn: 'And you?', note_uz: '吗 = aniq so\'rayapti, 呢 = «o\'sha narsa senchi?»', note_ru: '吗 = конкретный вопрос, 呢 = «а тебе то же самое?»', note_en: '吗 = specific question, 呢 = "what about you (same thing)?"' },
                { ma: '你是学生吗？', maUz: 'Talabamisan?', maRu: 'Ты студент?', maEn: 'Are you a student?', ne: '她呢？', neUz: 'U-chi?', neRu: 'А она?', neEn: 'What about her?', note_uz: '吗 = to\'liq savol, 呢 = boshqa kishiga o\'tish', note_ru: '吗 = полный вопрос, 呢 = переход к другому человеку', note_en: '吗 = full question, 呢 = switching to another person' },
              ].map((x, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="grammar-block__usage-type" style={{ color: '#16a34a', fontSize: '0.7em' }}>吗</div>
                      <div className="grammar-block__usage-zh">{x.ma}</div>
                      <div className="grammar-block__usage-tr">{({ uz: x.maUz, ru: x.maRu, en: (x as any).maEn || x.maUz } as Record<string, string>)[language]}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                      <div className="grammar-block__usage-type" style={{ color: '#dc2626', fontSize: '0.7em' }}>呢</div>
                      <div className="grammar-block__usage-zh">{x.ne}</div>
                      <div className="grammar-block__usage-tr">{({ uz: x.neUz, ru: x.neRu, en: (x as any).neEn || x.neUz } as Record<string, string>)[language]}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{({ uz: x.note_uz, ru: x.note_ru, en: (x as any).note_en || x.note_uz } as Record<string, string>)[language]}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Xulosa', ru: 'Итог', en: 'Summary' } as Record<string, string>)[language]}</div>
              {[
                { rule_uz: 'To\'liq ha/yo\'q savol', rule_ru: 'Полный вопрос да/нет', rule_en: 'Full yes/no question', ex: '你是学生吗？', word: '吗', isGreen: true },
                { rule_uz: 'Savolni qaytarish', rule_ru: 'Возврат вопроса', rule_en: 'Returning a question', ex: '我很好，你呢？', word: '呢', isGreen: false },
                { rule_uz: 'Narsaning qaerdaligi', rule_ru: 'Поиск вещи/человека', rule_en: 'Finding a thing/person', ex: '我的书呢？', word: '呢', isGreen: false },
                { rule_uz: 'Boshqa kishiga o\'tish', rule_ru: 'Переход к другому человеку', rule_en: 'Switching to another person', ex: '他去了，她呢？', word: '呢', isGreen: false },
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
                    <span style={{ fontWeight: 600 }}>{({ uz: r.rule_uz, ru: r.rule_ru, en: (r as any).rule_en || r.rule_uz } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__formula-desc" style={{ display: 'inline', marginLeft: 4 }}> — {r.ex}</span>
                  </div>
                </div>
              ))}

              <div className="grammar-block grammar-block--tip" style={{ margin: '12px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ <strong>{({ uz: 'Xato:', ru: 'Ошибка:', en: 'Mistake:' } as Record<string, string>)[language]}</strong>{' '}
                  {({ uz: '呢 va 吗 ni birga ishlatib bo\'lmaydi!', ru: '呢 и 吗 нельзя использовать вместе!', en: 'You cannot use 呢 and 吗 together!' } as Record<string, string>)[language]}
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">
                    <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>你好吗呢？</span>
                    {' ✗ → '}
                    <span style={{ color: '#16a34a' }}>你好吗？</span>
                    {({ uz: ' yoki ', ru: ' или ', en: ' or ' } as Record<string, string>)[language]}
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
                <div className="grammar-quiz__result-emoji">
                  {score === quizQuestions.length ? '🎉' : score >= 4 ? '👍' : '📚'}
                </div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? ({ uz: 'Ajoyib! Barchasini to\'g\'ri topdingiz!', ru: 'Отлично! Все правильно!', en: 'Excellent! You got everything right!' } as Record<string, string>)[language]
                    : score >= 4
                      ? ({ uz: 'Yaxshi! Biroz takrorlang.', ru: 'Хорошо! Немного повторите.', en: 'Good job! Review a little more.' } as Record<string, string>)[language]
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
