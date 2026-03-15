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
    zh: '我会说中文。',
    pinyin: 'Wǒ huì shuō Zhōngwén.',
    uz: 'Men xitoycha gapira olaman.',
    ru: 'Я умею говорить по-китайски.',
    en: 'I can speak Chinese.',
    note_uz: '会 + 说 = gapira olaman (o\'rganib olgan mahorat)',
    note_ru: '会 + 说 = умею говорить (приобретённый навык)',
    note_en: '会 + 说 = can speak (a learned skill)',
  },
  {
    zh: '他会做饭。',
    pinyin: 'Tā huì zuòfàn.',
    uz: 'U ovqat pishira oladi.',
    ru: 'Он умеет готовить.',
    en: 'He can cook.',
    note_uz: '会 + 做饭 = pishira oladi (o\'rgangan qobiliyat)',
    note_ru: '会 + 做饭 = умеет готовить (освоенное умение)',
    note_en: '会 + 做饭 = can cook (an acquired ability)',
  },
  {
    zh: '她会开车。',
    pinyin: 'Tā huì kāi chē.',
    uz: 'U mashina hayda oladi.',
    ru: 'Она умеет водить машину.',
    en: 'She can drive.',
    note_uz: '会 + 开车 = hayda oladi (o\'rganib olgan ko\'nikma)',
    note_ru: '会 + 开车 = умеет водить (приобретённый навык)',
    note_en: '会 + 开车 = can drive (an acquired skill)',
  },
  {
    zh: '你会游泳吗？',
    pinyin: 'Nǐ huì yóuyǒng ma?',
    uz: 'Suzishni bilasanmi?',
    ru: 'Умеешь ли ты плавать?',
    en: 'Can you swim?',
    note_uz: '会 + 游泳 = suza olasanmi? (mahorat bormi?)',
    note_ru: '会 + 游泳 = умеешь плавать? (есть ли навык?)',
    note_en: '会 + 游泳 = can you swim? (do you have the skill?)',
  },
  {
    zh: '明天会下雨。',
    pinyin: 'Míngtiān huì xià yǔ.',
    uz: 'Ertaga yomg\'ir yog\'adi.',
    ru: 'Завтра будет дождь.',
    en: 'It will rain tomorrow.',
    note_uz: '会 = bo\'ladi / yog\'adi (kelajak taxmin, mahorat emas)',
    note_ru: '会 = будет (предсказание о будущем, не навык)',
    note_en: '会 = will (future prediction, not a skill)',
  },
  {
    zh: '我不会写汉字。',
    pinyin: 'Wǒ bú huì xiě Hànzì.',
    uz: 'Men ieroglif yoza olmayman.',
    ru: 'Я не умею писать иероглифы.',
    en: 'I can\'t write Chinese characters.',
    note_uz: '不会 = ...a olmayman (mahorat yo\'q). Ton: bú huì (ikkalasi 4-ton, shuning uchun 不 2-tonga o\'zgaradi)',
    note_ru: '不会 = не умею. Тон: bú huì (оба 4-й тон → 不 меняется на 2-й тон)',
    note_en: '不会 = can\'t (no skill). Tone: bú huì (both 4th tone, so 不 changes to 2nd tone)',
  },
  {
    zh: '他也会说英语。',
    pinyin: 'Tā yě huì shuō Yīngyǔ.',
    uz: 'U inglizcha ham gapira oladi.',
    ru: 'Он тоже умеет говорить по-английски.',
    en: 'He can also speak English.',
    note_uz: '也会 = ...ham ...a oladi → qo\'shimcha mahorat',
    note_ru: '也会 = тоже умеет → дополнительный навык',
    note_en: '也会 = also can → an additional skill',
  },
  {
    zh: '我会做中国菜。',
    pinyin: 'Wǒ huì zuò Zhōngguó cài.',
    uz: 'Men xitoy ovqatini pishira olaman.',
    ru: 'Я умею готовить китайскую еду.',
    en: 'I can cook Chinese food.',
    note_uz: '会 + 做 = tayyorlay olaman → o\'rgangan ko\'nikma',
    note_ru: '会 + 做 = умею готовить → освоенный навык',
    note_en: '会 + 做 = can make/cook → an acquired skill',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men xitoycha gapira olaman" qanday?',
    q_ru: 'Как сказать "Я умею говорить по-китайски"?',
    q_en: 'How do you say "I can speak Chinese"?',
    options: ['我说会中文', '我会说中文', '会我说中文', '我说中文会'],
    correct: 1,
  },
  {
    q_uz: '会 ning asosiy ma\'nosi nima?',
    q_ru: 'Какое основное значение 会?',
    q_en: 'What is the main meaning of 会?',
    options_uz: ['Xohlamoq', 'Bormoq', 'O\'rganib olgan mahorat', 'Hamma narsani bilish'],
    options_ru: ['Хотеть', 'Идти', 'Приобретённый навык (умение)', 'Знать всё'],
    options_en: ['To want', 'To go', 'A learned skill (ability)', 'To know everything'],
    correct: 2,
  },
  {
    q_uz: '"U suzishni bilmaydi" qanday?',
    q_ru: 'Как сказать "Он не умеет плавать"?',
    q_en: 'How do you say "He can\'t swim"?',
    options: ['他没会游泳', '他不会游泳', '他会不游泳', '他游泳不会'],
    correct: 1,
  },
  {
    q_uz: '会 qanday o\'qiladi?',
    q_ru: 'Как читается 会?',
    q_en: 'How is 会 pronounced?',
    options_uz: ['huī (1-ton)', 'huí (2-ton)', 'huǐ (3-ton)', 'huì (4-ton)'],
    options_ru: ['huī (1-й тон)', 'huí (2-й тон)', 'huǐ (3-й тон)', 'huì (4-й тон)'],
    options_en: ['huī (1st tone)', 'huí (2nd tone)', 'huǐ (3rd tone)', 'huì (4th tone)'],
    correct: 3,
  },
  {
    q_uz: '"Ertaga yomg\'ir yog\'adi" qanday?',
    q_ru: 'Как сказать "Завтра будет дождь"?',
    q_en: 'How do you say "It will rain tomorrow"?',
    options: ['明天下雨会', '会明天下雨', '明天会下雨', '明天下会雨'],
    correct: 2,
  },
  {
    q_uz: '会 va 能 farqi nima?',
    q_ru: 'В чём разница между 会 и 能?',
    q_en: 'What is the difference between 会 and 能?',
    options_uz: ['Farqi yo\'q', '会=mahorat, 能=imkoniyat/sharoit', '会=o\'tgan, 能=kelajak', '会=inkor, 能=ijobiy'],
    options_ru: ['Нет разницы', '会=навык, 能=возможность/условие', '会=прошедшее, 能=будущее', '会=отрицание, 能=утверждение'],
    options_en: ['No difference', '会=skill, 能=ability/circumstance', '会=past, 能=future', '会=negation, 能=affirmation'],
    correct: 1,
  },
];

export function GrammarHuiPage() {
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
        <div className="grammar-page__hero-bg">会</div>
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
          <h1 className="grammar-page__hero-char">会</h1>
          <div className="grammar-page__hero-pinyin">huì</div>
          <div className="grammar-page__hero-meaning">— {({ uz: '...a olmoq (mahorat)', ru: 'уметь / мочь (навык)', en: 'can / to be able to (learned skill)' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char" style={{ color: COLOR }}>会</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">huì</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '4-ton (yuqoridan pastga ↘)', ru: '4-й тон (вниз ↘)', en: '4th tone (falling ↘)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: '...a olmoq (mahorat); ...bo\'ladi (taxmin)', ru: 'уметь; мочь (навык); будет (предсказание)', en: 'can (learned skill); will (prediction)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">6</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Turi', ru: 'Тип слова', en: 'Word Type' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'Modal fe\'l', ru: 'Модальный глагол', en: 'Modal verb' } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '会 ning 2 ta ma\'nosi', ru: '2 значения 会', en: '2 meanings of 会' } as Record<string, string>)[language]}</div>
              {[
                {
                  num: '1',
                  color: COLOR,
                  title_uz: 'Mahorat (o\'rganib olgan)',
                  title_ru: 'Навык (приобретённый)',
                  title_en: 'Learned skill',
                  zh: '我<span style="color:' + COLOR + '">会</span>游泳。',
                  uz: 'Men suza olaman.',
                  ru: 'Я умею плавать.',
                  en: 'I can swim.',
                  note_uz: 'O\'rgangan, mashq qilingan ko\'nikma',
                  note_ru: 'Освоенный, натренированный навык',
                  note_en: 'A skill acquired through learning and practice',
                },
                {
                  num: '2',
                  color: '#7c3aed',
                  title_uz: 'Kelajak taxmin',
                  title_ru: 'Предсказание будущего',
                  title_en: 'Future prediction',
                  zh: '明天<span style="color:#7c3aed">会</span>下雨。',
                  uz: 'Ertaga yomg\'ir yog\'adi.',
                  ru: 'Завтра будет дождь.',
                  en: 'It will rain tomorrow.',
                  note_uz: 'HSK 2+ da ko\'proq. HSK 1 da asosan 1-ma\'no.',
                  note_ru: 'Чаще в HSK 2+. В HSK 1 в основном 1-е значение.',
                  note_en: 'More common in HSK 2+. In HSK 1, mainly the 1st meaning.',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8, borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                    {item.num}. {({ uz: item.title_uz, ru: item.title_ru, en: (item as any).title_en || item.title_uz } as Record<string, string>)[language]}
                  </div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{({ uz: item.uz, ru: item.ru, en: (item as any).en || item.uz } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.72em', color: '#888', marginTop: 3 }}>{({ uz: item.note_uz, ru: item.note_ru, en: (item as any).note_en || item.note_uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'HSK 1: 会 = mahorat. 会 = «o\'rgandi va qila oladi». Ikkinchi ma\'no (taxmin) kamroq uchraydi.', ru: 'HSK 1: учите 会 = навык. 会 = «научился и умеет». Второе значение (предсказание) встречается реже.', en: 'HSK 1: 会 = skill. 会 = "learned and can do". The second meaning (prediction) is less common.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: '⚡ Kalit tushuncha', ru: '⚡ Ключевая идея', en: '⚡ Key concept' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: '会 = o\'rganib olingan mahorat. Tug\'ma emas — mashq qilib egallab olingan:', ru: '会 = навык, который нужно УЧИТЬ. Не врождённое — приобретённое:', en: '会 = a learned skill. Not innate — acquired through practice:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                {[
                  { emoji: '🗣️', label_uz: 'Til gapirish', label_ru: 'Язык', label_en: 'Speaking' },
                  { emoji: '🏊', label_uz: 'Suzish', label_ru: 'Плавание', label_en: 'Swimming' },
                  { emoji: '🚗', label_uz: 'Haydash', label_ru: 'Вождение', label_en: 'Driving' },
                  { emoji: '🍳', label_uz: 'Pishirish', label_ru: 'Готовка', label_en: 'Cooking' },
                  { emoji: '🎵', label_uz: 'Musiqa', label_ru: 'Музыка', label_en: 'Music' },
                  { emoji: '✍️', label_uz: 'Yozish', label_ru: 'Письмо', label_en: 'Writing' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ecfeff', border: `1px solid #a5f3fc`, borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: '1.2em' }}>{item.emoji}</div>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 600 }}>{({ uz: item.label_uz, ru: item.label_ru, en: (item as any).label_en || item.label_uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8, color: '#0e7490' }}>
                {({ uz: '→ Bularning hammasini o\'rganish mumkin → 会!', ru: '→ Всё это можно выучить → 会!', en: '→ All of these can be learned → 会!' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy qoida', ru: 'Основное правило', en: 'Basic Rule' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
                {' (+ '}
                <span className="grammar-block__formula-a">{({ uz: 'To\'ldiruvchi', ru: 'Допол.', en: 'Obj.' } as Record<string, string>)[language]}</span>
                {')'}
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: '会 fe\'ldan oldin qo\'yiladi — modal fe\'l sifatida.', ru: '会 ставится перед глаголом — как модальный глагол.', en: '会 is placed before the verb — as a modal verb.' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR }}>会</span>说中文。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Men gapira olaman.', ru: 'Я умею говорить.', en: 'I can speak.' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'XATO', ru: 'НЕВЕРНО', en: 'WRONG' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>我说<span style={{ color: '#ef4444' }}>会</span>中文。</div>
                  <div className="grammar-block__usage-tr">{({ uz: '会 — fe\'ldan keyin!', ru: '会 — после глагола!', en: '会 — after the verb!' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Mahorat: 会 + fe\'l', ru: '1. Навык: 会 + глагол', en: '1. Skill: 会 + verb' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l (+ To\'ldiruvchi)', ru: 'Глагол (+ Объект)', en: 'Verb (+ Object)' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'O\'rganib, mashq qilib olgan ko\'nikma', ru: 'Освоенный, выученный навык', en: 'A skill acquired through learning and practice' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我会说中文。', py: 'Wǒ huì shuō Zhōngwén.', uz: 'Men xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.', en: 'I can speak Chinese.' },
                { zh: '他会游泳。', py: 'Tā huì yóuyǒng.', uz: 'U suza oladi.', ru: 'Он умеет плавать.', en: 'He can swim.' },
                { zh: '妈妈会做饭。', py: 'Māma huì zuòfàn.', uz: 'Onam ovqat pishira oladi.', ru: 'Мама умеет готовить.', en: 'Mom can cook.' },
                { zh: '她会开车。', py: 'Tā huì kāi chē.', uz: 'U mashina hayda oladi.', ru: 'Она умеет водить машину.', en: 'She can drive.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: '会 = til, sport, musiqa, haydash, pishirish — o\'rganib olingan istalgan ko\'nikma.', ru: '会 = язык, спорт, музыка, вождение, готовка — любой приобретённый навык.', en: '会 = languages, sports, music, driving, cooking — any skill acquired through learning.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Kelajak taxmin: 会', ru: '2. Предсказание будущего: 会', en: '2. Future prediction: 会' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Vaqt / ega', ru: 'Время / подлеж.', en: 'Time / subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Hodisa', ru: 'Событие', en: 'Event' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Bo\'lishi kutilayotgan narsa (taxmin, ishonch)', ru: 'Кажется что произойдёт (предсказание, уверенность)', en: 'Something expected to happen (prediction, certainty)' } as Record<string, string>)[language]}</p>
              {[
                { zh: '明天会下雨。', py: 'Míngtiān huì xià yǔ.', uz: 'Ertaga yomg\'ir yog\'adi.', ru: 'Завтра будет дождь.', en: 'It will rain tomorrow.' },
                { zh: '他会来的。', py: 'Tā huì lái de.', uz: 'U keladi (ishonaman).', ru: 'Он придёт (я уверен).', en: 'He will come (I\'m sure).' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Bu ma\'no ko\'proq HSK 2+ da. HSK 1 da asosan mahorat ma\'nosi.', ru: 'Это значение чаще в HSK 2+. В HSK 1 фокус на навыке.', en: 'This meaning is more common in HSK 2+. In HSK 1, the focus is on the skill meaning.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. Inkor: 不会', ru: '3. Отрицание: 不会', en: '3. Negation: 不会' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '...a olmayman / bilmayman', ru: '...не умею / не знаю как', en: "can't / don't know how to" } as Record<string, string>)[language]}</p>
              {[
                { zh: '我不会游泳。', py: 'Wǒ bú huì yóuyǒng.', uz: 'Men suza olmayman.', ru: 'Я не умею плавать.', en: 'I can\'t swim.' },
                { zh: '他不会说中文。', py: 'Tā bú huì shuō Zhōngwén.', uz: 'U xitoycha gapira olmaydi.', ru: 'Он не умеет говорить по-китайски.', en: 'He can\'t speak Chinese.' },
                { zh: '我不会开车。', py: 'Wǒ bú huì kāi chē.', uz: 'Men mashina hayda olmayman.', ru: 'Я не умею водить машину.', en: 'I can\'t drive.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{({ uz: 'Ton o\'zgarishi:', ru: 'Изменение тона:', en: 'Tone change:' } as Record<string, string>)[language]}</strong>{' '}
                  {({ uz: '不 odatda 4-ton (bù), lekin 会 (4-ton) oldida 2-tonga o\'zgaradi:', ru: '不 обычно 4-й тон (bù), но перед 会 (4-й тон) становится 2-м тоном:', en: '不 is normally 4th tone (bù), but before 会 (4th tone) it changes to 2nd tone:' } as Record<string, string>)[language]}
                  {' '}<strong>bú huì</strong>
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. 会 bilan savollar', ru: '4. Вопросы с 会', en: '4. Questions with 会' } as Record<string, string>)[language]}</div>
              {[
                {
                  type_uz: '吗 savoli',
                  type_ru: 'Вопрос с 吗',
                  type_en: '吗 question',
                  q: '你会说中文吗？',
                  py: 'Nǐ huì shuō Zhōngwén ma?',
                  uz: 'Xitoycha gapira olasanmi?',
                  ru: 'Умеешь ли ты говорить по-китайски?',
                  en: 'Can you speak Chinese?',
                  color: '#059669',
                },
                {
                  type_uz: 'Qarama-qarshi savol',
                  type_ru: 'Альтернативный вопрос',
                  type_en: 'Alternative question',
                  q: '你会不会游泳？',
                  py: 'Nǐ huì bu huì yóuyǒng?',
                  uz: 'Suza olasan-olmasanmi?',
                  ru: 'Умеешь плавать или нет?',
                  en: 'Can you swim or not?',
                  color: '#2563eb',
                },
                {
                  type_uz: 'Savol so\'zi',
                  type_ru: 'Вопросительное слово',
                  type_en: 'Question word',
                  q: '你会说什么语言？',
                  py: 'Nǐ huì shuō shénme yǔyán?',
                  uz: 'Qaysi tillarni gapira olasan?',
                  ru: 'На каких языках ты умеешь говорить?',
                  en: 'What languages can you speak?',
                  color: '#7c3aed',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 4 }}>{({ uz: x.type_uz, ru: x.type_ru, en: (x as any).type_en || x.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ color: x.color }}>{x.q}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Javob: 会 (ha, ...a olaman) / 不会 (yo\'q, ...a olmayman). Qisqa va aniq!', ru: 'Ответ: 会 (да, умею) / 不会 (нет, не умею). Коротко и ясно!', en: 'Answer: 会 (yes, I can) / 不会 (no, I can\'t). Short and clear!' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. 也会 / 都会 — kombinatsiyalar', ru: '5. 也会 / 都会 — комбинации', en: '5. 也会 / 都会 — combinations' } as Record<string, string>)[language]}</div>
              {[
                {
                  combo: '也会',
                  ex: '她也会说英语。',
                  py: 'Tā yě huì shuō Yīngyǔ.',
                  uz: 'U inglizcha ham gapira oladi.',
                  ru: 'Она тоже умеет говорить по-английски.',
                  en: 'She can also speak English.',
                },
                {
                  combo: '都会',
                  ex: '我们都会游泳。',
                  py: 'Wǒmen dōu huì yóuyǒng.',
                  uz: 'Biz hammamiz suza olamiz.',
                  ru: 'Мы все умеем плавать.',
                  en: 'We can all swim.',
                },
                {
                  combo: '也都会',
                  ex: '他们也都会做饭。',
                  py: 'Tāmen yě dōu huì zuòfàn.',
                  uz: 'Ular ham hammasi pishira oladi.',
                  ru: 'Они тоже все умеют готовить.',
                  en: 'They can all cook too.',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div style={{ display: 'inline-block', background: '#ecfeff', borderRadius: 4, padding: '2px 8px', fontSize: '0.75em', fontWeight: 700, color: COLOR, marginBottom: 4 }}>{x.combo}</div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Tartib: 也 → 都 → 会 → fe\'l. Har doim shu ketma-ketlik!', ru: 'Порядок: 也 → 都 → 会 → глагол. Всегда такая последовательность!', en: 'Order: 也 → 都 → 会 → verb. Always this sequence!' } as Record<string, string>)[language]}
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Til bilish', ru: 'Мини-диалог 1: Знание языков', en: 'Mini dialogue 1: Language skills' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你会说中文吗？', py: 'Nǐ huì shuō Zhōngwén ma?', uz: 'Xitoycha gapira olasanmi?', ru: 'Умеешь говорить по-китайски?', en: 'Can you speak Chinese?' },
                  { speaker: 'B', zh: '会一点儿。我在学。', py: 'Huì yìdiǎnr. Wǒ zài xué.', uz: 'Biroz. Hozir o\'rganayapman.', ru: 'Немного. Сейчас учу.', en: 'A little. I\'m studying.' },
                  { speaker: 'A', zh: '你还会说别的语言吗？', py: 'Nǐ hái huì shuō bié de yǔyán ma?', uz: 'Boshqa tillarni ham gapira olasanmi?', ru: 'Умеешь говорить на других языках?', en: 'Can you speak other languages too?' },
                  { speaker: 'B', zh: '会。我会说英语和法语。', py: 'Huì. Wǒ huì shuō Yīngyǔ hé Fǎyǔ.', uz: 'Ha. Inglizcha va frantsuzcha gapira olaman.', ru: 'Да. Умею говорить по-английски и по-французски.', en: 'Yes. I can speak English and French.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Yangi ko\'nikmalar', ru: 'Мини-диалог 2: Новые навыки', en: 'Mini dialogue 2: New skills' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你会做中国菜吗？', py: 'Nǐ huì zuò Zhōngguó cài ma?', uz: 'Xitoy ovqatini pishira olasanmi?', ru: 'Умеешь готовить китайскую еду?', en: 'Can you cook Chinese food?' },
                  { speaker: 'B', zh: '不会。但是我很想学！', py: 'Bú huì. Dànshì wǒ hěn xiǎng xué!', uz: 'Olmayman. Lekin juda o\'rganmoqchiman!', ru: 'Нет. Но очень хочу научиться!', en: 'No. But I really want to learn!' },
                  { speaker: 'A', zh: '我会做饺子，我教你吧。', py: 'Wǒ huì zuò jiǎozi, wǒ jiāo nǐ ba.', uz: 'Men chuchvara qila olaman, senga o\'rgatay.', ru: 'Я умею делать пельмени, давай научу тебя.', en: 'I can make dumplings, let me teach you.' },
                  { speaker: 'B', zh: '太好了！谢谢你！', py: 'Tài hǎo le! Xièxie nǐ!', uz: 'Ajoyib! Rahmat!', ru: 'Замечательно! Спасибо!', en: 'Wonderful! Thank you!' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '会 bilan ko\'p ishlatiladigan fe\'llar', ru: 'Частые сочетания с 会', en: 'Common verb combinations with 会' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '会说', py: 'huì shuō', uz: 'gapira olmoq', ru: 'уметь говорить', en: 'can speak' },
                  { zh: '会写', py: 'huì xiě', uz: 'yoza olmoq', ru: 'уметь писать', en: 'can write' },
                  { zh: '会读', py: 'huì dú', uz: 'o\'qiy olmoq', ru: 'уметь читать', en: 'can read' },
                  { zh: '会做', py: 'huì zuò', uz: 'qila olmoq', ru: 'уметь делать', en: 'can do/make' },
                  { zh: '会做饭', py: 'huì zuòfàn', uz: 'pishira olmoq', ru: 'уметь готовить', en: 'can cook' },
                  { zh: '会开车', py: 'huì kāi chē', uz: 'hayda olmoq', ru: 'уметь водить', en: 'can drive' },
                  { zh: '会游泳', py: 'huì yóuyǒng', uz: 'suza olmoq', ru: 'уметь плавать', en: 'can swim' },
                  { zh: '会用', py: 'huì yòng', uz: 'ishlata olmoq', ru: 'уметь пользоваться', en: 'can use' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
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
              <div className="grammar-block__label">{({ uz: '会 vs 能 vs 可以', ru: '会 vs 能 vs 可以', en: '会 vs 能 vs 可以' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Xitoy tilida «...a olaman»ni uch xil aytish mumkin. Har birining o\'z joyi bor:', ru: 'В китайском три способа сказать «можно/умею»:', en: 'In Chinese there are three ways to say "can/able to". Each has its own usage:' } as Record<string, string>)[language]}
              </p>
              {[
                {
                  word: '会', py: 'huì', color: COLOR,
                  title_uz: 'Mahorat (o\'rganib olgan)', title_ru: 'Навык (приобретённый)', title_en: 'Learned skill',
                  desc_uz: 'O\'rganib, mashq qilib egallab olingan ko\'nikma.',
                  desc_ru: 'Освоенный, натренированный навык.',
                  desc_en: 'A skill acquired through learning and practice.',
                  ex: '我会游泳。', py_ex: 'Wǒ huì yóuyǒng.',
                  uz: 'Men suza olaman. (o\'rgangan)', ru: 'Я умею плавать. (научился)', en: 'I can swim. (learned)',
                },
                {
                  word: '能', py: 'néng', color: '#059669',
                  title_uz: 'Imkoniyat / sharoit', title_ru: 'Возможность / условие', title_en: 'Ability / circumstance',
                  desc_uz: 'Jismoniy qobiliyat yoki sharoit (ruxsat, holat).',
                  desc_ru: 'Физическая способность или условие (разрешение, ситуация).',
                  desc_en: 'Physical ability or circumstance (permission, situation).',
                  ex: '我今天不能来。', py_ex: 'Wǒ jīntiān bù néng lái.',
                  uz: 'Men bugun kela olmayman. (sharoit)', ru: 'Я сегодня не могу прийти. (условие)', en: 'I can\'t come today. (circumstance)',
                },
                {
                  word: '可以', py: 'kěyǐ', color: '#7c3aed',
                  title_uz: 'Ruxsat / mumkin', title_ru: 'Разрешение / дозволено', title_en: 'Permission / allowed',
                  desc_uz: 'Ijozat, ruxsat, qoidaga ko\'ra mumkin.',
                  desc_ru: 'Позволено, разрешено, допустимо.',
                  desc_en: 'Permitted, allowed, acceptable.',
                  ex: '这里可以拍照吗？', py_ex: 'Zhèlǐ kěyǐ pāizhào ma?',
                  uz: 'Bu yerda surat olsa bo\'ladimi?', ru: 'Здесь можно фотографировать?', en: 'Can you take photos here?',
                },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e0e0e6', borderLeftWidth: 4, borderLeftColor: r.color, borderLeftStyle: 'solid' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.word}</div>
                    <div>
                      <div style={{ fontSize: '0.8em', fontWeight: 700, color: r.color }}>{r.py} — {({ uz: r.title_uz, ru: r.title_ru, en: (r as any).title_en || r.title_uz } as Record<string, string>)[language]}</div>
                      <div style={{ fontSize: '0.72em', color: '#666' }}>{({ uz: r.desc_uz, ru: r.desc_ru, en: (r as any).desc_en || r.desc_uz } as Record<string, string>)[language]}</div>
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
              <div className="grammar-block__label">{({ uz: 'Bir vaziyat — uch so\'z', ru: 'Одна ситуация — три слова', en: 'One situation — three words' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: 'Bir xil «suza olaman» gapi — uch xil ma\'no:', ru: 'Одно «умею плавать» — три разных смысла:', en: 'The same "I can swim" — three different meanings:' } as Record<string, string>)[language]}
              </p>
              {[
                { ex: '我会游泳。', label_uz: '会 — mahorat bor (o\'rganganman)', label_ru: '会 — навык (научился)', label_en: '会 — I have the skill (I learned)', color: COLOR },
                { ex: '我能游泳。', label_uz: '能 — sharoit imkon beradi (shifokor ruxsat berdi)', label_ru: '能 — условие позволяет (врач разрешил)', label_en: '能 — circumstances allow (the doctor permitted)', color: '#059669' },
                { ex: '这里可以游泳。', label_uz: '可以 — bu yerda suzsa bo\'ladi (ruxsat bor)', label_ru: '可以 — здесь разрешено плавать', label_en: '可以 — swimming is allowed here (permission)', color: '#7c3aed' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 3 }}>{({ uz: x.label_uz, ru: x.label_ru, en: (x as any).label_en || x.label_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '会 vs 想 — farq', ru: '会 vs 想 — разница', en: '会 vs 想 — difference' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 600, marginBottom: 4 }}>会</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{({ uz: '...A OLAMAN', ru: '...УМЕЮ', en: 'CAN DO' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: 'Qobiliyat / mahorat', ru: 'Навык / умение', en: 'Ability / skill' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: '1px solid #fda4af' }}>
                  <div style={{ fontSize: '1.8em', color: '#e11d48', fontWeight: 600, marginBottom: 4 }}>想</div>
                  <div style={{ fontSize: '0.7em', color: '#e11d48', fontWeight: 700, marginBottom: 4 }}>{({ uz: '...MOQCHIMAN', ru: '...ХОЧУ', en: 'WANT TO' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: 'Xohish / niyat', ru: 'Желание / намерение', en: 'Desire / intention' } as Record<string, string>)[language]}</div>
                </div>
              </div>
              {[
                {
                  hui: '我会做饭。', hui_uz: 'Men pishira olaman. (mahorat bor)', hui_ru: 'Я умею готовить. (навык есть)', hui_en: 'I can cook. (have the skill)',
                  xiang: '我想做饭。', xiang_uz: 'Men pishirmoqchiman. (xohish)', xiang_ru: 'Я хочу готовить. (желание)', xiang_en: 'I want to cook. (desire)',
                },
                {
                  hui: '他会说中文。', hui_uz: 'U xitoycha gapira oladi.', hui_ru: 'Он умеет говорить по-китайски.', hui_en: 'He can speak Chinese.',
                  xiang: '他想说中文。', xiang_uz: 'U xitoycha gapirmoqchi.', xiang_ru: 'Он хочет говорить по-китайски.', xiang_en: 'He wants to speak Chinese.',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                    <div className="grammar-block__usage-zh">{x.hui}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.hui_uz, ru: x.hui_ru, en: (x as any).hui_en || x.hui_uz } as Record<string, string>)[language]}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: '1px solid #fda4af' }}>
                    <div className="grammar-block__usage-zh">{x.xiang}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.xiang_uz, ru: x.xiang_ru, en: (x as any).xiang_en || x.xiang_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Birgalikda: 我想学，以后我会说。 — O\'rganmoqchiman, keyin gapira olaman.', ru: 'Вместе: 我想学，以后我会说。 — Хочу учиться, потом буду уметь говорить.', en: 'Together: 我想学，以后我会说。 — I want to learn, then I\'ll be able to speak.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Modal fe\'llar jadvali', ru: 'Таблица модальных глаголов', en: 'Modal verbs table' } as Record<string, string>)[language]}</div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85em' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f8' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'So\'z', ru: 'Слово', en: 'Word' } as Record<string, string>)[language]}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'Ma\'nosi', ru: 'Значение', en: 'Meaning' } as Record<string, string>)[language]}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'Inkor', ru: 'Отриц.', en: 'Negation' } as Record<string, string>)[language]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { word: '会', py: 'huì', uz: '...a olaman (mahorat)', ru: 'уметь (навык)', en: 'can (learned skill)', neg: '不会', color: COLOR },
                      { word: '能', py: 'néng', uz: '...a olaman (imkoniyat)', ru: 'мочь (возможность)', en: 'can (ability/circumstance)', neg: '不能', color: '#059669' },
                      { word: '可以', py: 'kěyǐ', uz: 'mumkin (ruxsat)', ru: 'можно (разрешение)', en: 'may (permission)', neg: '不可以', color: '#7c3aed' },
                      { word: '想', py: 'xiǎng', uz: '...moqchi (xohish)', ru: 'хотеть (желание)', en: 'want to (desire)', neg: '不想', color: '#e11d48' },
                      { word: '要', py: 'yào', uz: '...aman (qaror/kerak)', ru: 'нужно/собираться', en: 'need to / going to', neg: '不要', color: '#d97706' },
                    ].map((r, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e0e0e6' : 'none' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: r.color }}>{r.word} ({r.py})</td>
                        <td style={{ padding: '6px 8px', color: '#444' }}>{({ uz: r.uz, ru: r.ru, en: (r as any).en || r.uz } as Record<string, string>)[language]}</td>
                        <td style={{ padding: '6px 8px', color: '#ef4444', background: '#fef2f2', borderRadius: 4, fontSize: '0.9em' }}>{r.neg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
