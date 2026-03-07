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
    zh: '我会说中文。',
    pinyin: 'Wǒ huì shuō Zhōngwén.',
    uz: 'Men xitoycha gapira olaman.',
    ru: 'Я умею говорить по-китайски.',
    note_uz: '会 + 说 = gapira olaman (o\'rganib olgan mahorat)',
    note_ru: '会 + 说 = умею говорить (приобретённый навык)',
  },
  {
    zh: '他会做饭。',
    pinyin: 'Tā huì zuòfàn.',
    uz: 'U ovqat pishira oladi.',
    ru: 'Он умеет готовить.',
    note_uz: '会 + 做饭 = pishira oladi (o\'rgangan qobiliyat)',
    note_ru: '会 + 做饭 = умеет готовить (освоенное умение)',
  },
  {
    zh: '她会开车。',
    pinyin: 'Tā huì kāi chē.',
    uz: 'U mashina hayda oladi.',
    ru: 'Она умеет водить машину.',
    note_uz: '会 + 开车 = hayda oladi (o\'rganib olgan ko\'nikma)',
    note_ru: '会 + 开车 = умеет водить (приобретённый навык)',
  },
  {
    zh: '你会游泳吗？',
    pinyin: 'Nǐ huì yóuyǒng ma?',
    uz: 'Suzishni bilasanmi?',
    ru: 'Умеешь ли ты плавать?',
    note_uz: '会 + 游泳 = suza olasanmi? (mahorat bormi?)',
    note_ru: '会 + 游泳 = умеешь плавать? (есть ли навык?)',
  },
  {
    zh: '明天会下雨。',
    pinyin: 'Míngtiān huì xià yǔ.',
    uz: 'Ertaga yomg\'ir yog\'adi.',
    ru: 'Завтра будет дождь.',
    note_uz: '会 = bo\'ladi / yog\'adi (kelajak taxmin, mahorat emas)',
    note_ru: '会 = будет (предсказание о будущем, не навык)',
  },
  {
    zh: '我不会写汉字。',
    pinyin: 'Wǒ bú huì xiě Hànzì.',
    uz: 'Men hieroglif yoza olmayman.',
    ru: 'Я не умею писать иероглифы.',
    note_uz: '不会 = ...a olmayman (mahorat yo\'q). Ton: bú huì (ikkalasi 4-ton, shuning uchun 不 2-tonga o\'zgaradi)',
    note_ru: '不会 = не умею. Тон: bú huì (оба 4-й тон → 不 меняется на 2-й тон)',
  },
  {
    zh: '他也会说英语。',
    pinyin: 'Tā yě huì shuō Yīngyǔ.',
    uz: 'U inglizcha ham gapira oladi.',
    ru: 'Он тоже умеет говорить по-английски.',
    note_uz: '也会 = ...ham ...a oladi → qo\'shimcha mahorat',
    note_ru: '也会 = тоже умеет → дополнительный навык',
  },
  {
    zh: '我会做中国菜。',
    pinyin: 'Wǒ huì zuò Zhōngguó cài.',
    uz: 'Men xitoy ovqatini pishira olaman.',
    ru: 'Я умею готовить китайскую еду.',
    note_uz: '会 + 做 = tayyorlay olaman → o\'rgangan ko\'nikma',
    note_ru: '会 + 做 = умею готовить → освоенный навык',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men xitoycha gapira olaman" qanday?',
    q_ru: 'Как сказать "Я умею говорить по-китайски"?',
    options: ['我说会中文', '我会说中文', '会我说中文', '我说中文会'],
    correct: 1,
  },
  {
    q_uz: '会 ning asosiy ma\'nosi nima?',
    q_ru: 'Какое основное значение 会?',
    options_uz: ['Xohlamoq', 'Bormoq', 'O\'rganib olgan mahorat', 'Hamma narsani bilish'],
    options_ru: ['Хотеть', 'Идти', 'Приобретённый навык (умение)', 'Знать всё'],
    correct: 2,
  },
  {
    q_uz: '"U suzishni bilmaydi" qanday?',
    q_ru: 'Как сказать "Он не умеет плавать"?',
    options: ['他没会游泳', '他不会游泳', '他会不游泳', '他游泳不会'],
    correct: 1,
  },
  {
    q_uz: '会 qanday o\'qiladi?',
    q_ru: 'Как читается 会?',
    options_uz: ['huī (1-ton)', 'huí (2-ton)', 'huǐ (3-ton)', 'huì (4-ton)'],
    options_ru: ['huī (1-й тон)', 'huí (2-й тон)', 'huǐ (3-й тон)', 'huì (4-й тон)'],
    correct: 3,
  },
  {
    q_uz: '"Ertaga yomg\'ir yog\'adi" qanday?',
    q_ru: 'Как сказать "Завтра будет дождь"?',
    options: ['明天下雨会', '会明天下雨', '明天会下雨', '明天下会雨'],
    correct: 2,
  },
  {
    q_uz: '会 va 能 farqi nima?',
    q_ru: 'В чём разница между 会 и 能?',
    options_uz: ['Farqi yo\'q', '会=mahorat, 能=imkoniyat/sharoit', '会=o\'tgan, 能=kelajak', '会=inkor, 能=ijobiy'],
    options_ru: ['Нет разницы', '会=навык, 能=возможность/условие', '会=прошедшее, 能=будущее', '会=отрицание, 能=утверждение'],
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
          <div className="grammar-page__hero-label">HSK 1 · {language === 'ru' ? 'Грамматика' : 'Grammatika'}</div>
          <div className="grammar-page__hero-char">会</div>
          <div className="grammar-page__hero-pinyin">huì</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'уметь / мочь (навык)' : '...a olmoq (mahorat)'} —</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Hieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char" style={{ color: COLOR }}>会</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">huì</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '4-й тон (вниз ↘)' : '4-ton (yuqoridan pastga ↘)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'уметь; мочь (навык); будет (предсказание)' : '...a olmoq (mahorat); ...bo\'ladi (taxmin)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">6</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Модальный глагол' : 'Modal fe\'l'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '2 значения 会' : '会 ning 2 ta ma\'nosi'}</div>
              {[
                {
                  num: '1',
                  color: COLOR,
                  title_uz: 'Mahorat (o\'rganib olgan)',
                  title_ru: 'Навык (приобретённый)',
                  zh: '我<span style="color:' + COLOR + '">会</span>游泳。',
                  uz: 'Men suza olaman.',
                  ru: 'Я умею плавать.',
                  note_uz: 'O\'rgangan, mashq qilingan ko\'nikma',
                  note_ru: 'Освоенный, натренированный навык',
                },
                {
                  num: '2',
                  color: '#7c3aed',
                  title_uz: 'Kelajak taxmin',
                  title_ru: 'Предсказание будущего',
                  zh: '明天<span style="color:#7c3aed">会</span>下雨。',
                  uz: 'Ertaga yomg\'ir yog\'adi.',
                  ru: 'Завтра будет дождь.',
                  note_uz: 'HSK 2+ da ko\'proq. HSK 1 da asosan 1-ma\'no.',
                  note_ru: 'Чаще в HSK 2+. В HSK 1 в основном 1-е значение.',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8, borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                    {item.num}. {language === 'ru' ? item.title_ru : item.title_uz}
                  </div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{language === 'ru' ? item.ru : item.uz}</div>
                  <div style={{ fontSize: '0.72em', color: '#888', marginTop: 3 }}>{language === 'ru' ? item.note_ru : item.note_uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'HSK 1: учите 会 = навык. 会 = «научился и умеет». Второе значение (предсказание) встречается реже.'
                    : 'HSK 1: 会 = mahorat. 会 = «o\'rgandi va qila oladi». Ikkinchi ma\'no (taxmin) kamroq uchraydi.'}
                </p>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? '⚡ Ключевая идея' : '⚡ Kalit tushuncha'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? '会 = навык, который нужно УЧИТЬ. Не врождённое — приобретённое:'
                  : '会 = o\'rganib olingan mahorat. Tug\'ma emas — mashq qilib egallab olingan:'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                {[
                  { emoji: '🗣️', label_uz: 'Til gapirish', label_ru: 'Язык' },
                  { emoji: '🏊', label_uz: 'Suzish', label_ru: 'Плавание' },
                  { emoji: '🚗', label_uz: 'Haydash', label_ru: 'Вождение' },
                  { emoji: '🍳', label_uz: 'Pishirish', label_ru: 'Готовка' },
                  { emoji: '🎵', label_uz: 'Musiqa', label_ru: 'Музыка' },
                  { emoji: '✍️', label_uz: 'Yozish', label_ru: 'Письмо' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#ecfeff', border: `1px solid #a5f3fc`, borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: '1.2em' }}>{item.emoji}</div>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 600 }}>{language === 'ru' ? item.label_ru : item.label_uz}</div>
                  </div>
                ))}
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8, color: '#0e7490' }}>
                {language === 'ru'
                  ? '→ Всё это можно выучить → 会!'
                  : '→ Bularning hammasini o\'rganish mumkin → 会!'}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основное правило' : 'Asosiy qoida'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
                {' (+ '}
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Допол.' : 'To\'ldiruvchi'}</span>
                {')'}
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru'
                  ? '会 ставится перед глаголом — как модальный глагол.'
                  : '会 fe\'ldan oldin qo\'yiladi — modal fe\'l sifatida.'}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR }}>会</span>说中文。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я умею говорить.' : 'Men gapira olaman.'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'НЕВЕРНО' : 'XATO'}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>我说<span style={{ color: '#ef4444' }}>会</span>中文。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? '会 — после глагола!' : '会 — fe\'ldan keyin!'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Навык: 会 + глагол' : '1. Mahorat: 会 + fe\'l'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол (+ Объект)' : 'Fe\'l (+ To\'ldiruvchi)'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Освоенный, выученный навык' : 'O\'rganib, mashq qilib olgan ko\'nikma'}</p>
              {[
                { zh: '我会说中文。', py: 'Wǒ huì shuō Zhōngwén.', uz: 'Men xitoycha gapira olaman.', ru: 'Я умею говорить по-китайски.' },
                { zh: '他会游泳。', py: 'Tā huì yóuyǒng.', uz: 'U suza oladi.', ru: 'Он умеет плавать.' },
                { zh: '妈妈会做饭。', py: 'Māma huì zuòfàn.', uz: 'Onam ovqat pishira oladi.', ru: 'Мама умеет готовить.' },
                { zh: '她会开车。', py: 'Tā huì kāi chē.', uz: 'U mashina hayda oladi.', ru: 'Она умеет водить машину.' },
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
                    ? '会 = язык, спорт, музыка, вождение, готовка — любой приобретённый навык.'
                    : '会 = til, sport, musiqa, haydash, pishirish — o\'rganib olingan istalgan ko\'nikma.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Предсказание будущего: 会' : '2. Kelajak taxmin: 会'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Время / подлеж.' : 'Vaqt / ega'}</span>
                {' + '}
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Событие' : 'Hodisa'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Кажется что произойдёт (предсказание, уверенность)' : 'Bo\'lishi kutilayotgan narsa (taxmin, ishonch)'}</p>
              {[
                { zh: '明天会下雨。', py: 'Míngtiān huì xià yǔ.', uz: 'Ertaga yomg\'ir yog\'adi.', ru: 'Завтра будет дождь.' },
                { zh: '他会来的。', py: 'Tā huì lái de.', uz: 'U keladi (ishonaman).', ru: 'Он придёт (я уверен).' },
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
                    ? 'Это значение чаще в HSK 2+. В HSK 1 фокус на навыке.'
                    : 'Bu ma\'no ko\'proq HSK 2+ da. HSK 1 da asosan mahorat ma\'nosi.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. Отрицание: 不会' : '3. Inkor: 不会'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                <span style={{ color: COLOR, fontWeight: 700 }}>会</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '...не умею / не знаю как' : '...a olmayman / bilmayman'}</p>
              {[
                { zh: '我不会游泳。', py: 'Wǒ bú huì yóuyǒng.', uz: 'Men suza olmayman.', ru: 'Я не умею плавать.' },
                { zh: '他不会说中文。', py: 'Tā bú huì shuō Zhōngwén.', uz: 'U xitoycha gapira olmaydi.', ru: 'Он не умеет говорить по-китайски.' },
                { zh: '我不会开车。', py: 'Wǒ bú huì kāi chē.', uz: 'Men mashina hayda olmayman.', ru: 'Я не умею водить машину.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{language === 'ru' ? 'Изменение тона:' : 'Ton o\'zgarishi:'}</strong>{' '}
                  {language === 'ru'
                    ? '不 обычно 4-й тон (bù), но перед 会 (4-й тон) становится 2-м тоном:'
                    : '不 odatda 4-ton (bù), lekin 会 (4-ton) oldida 2-tonga o\'zgaradi:'}
                  {' '}<strong>bú huì</strong>
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. Вопросы с 会' : '4. 会 bilan savollar'}</div>
              {[
                {
                  type_uz: '吗 savoli',
                  type_ru: 'Вопрос с 吗',
                  q: '你会说中文吗？',
                  py: 'Nǐ huì shuō Zhōngwén ma?',
                  uz: 'Xitoycha gapira olasanmi?',
                  ru: 'Умеешь ли ты говорить по-китайски?',
                  color: '#059669',
                },
                {
                  type_uz: 'Qarama-qarshi savol',
                  type_ru: 'Альтернативный вопрос',
                  q: '你会不会游泳？',
                  py: 'Nǐ huì bu huì yóuyǒng?',
                  uz: 'Suza olasan-olmasanmi?',
                  ru: 'Умеешь плавать или нет?',
                  color: '#2563eb',
                },
                {
                  type_uz: 'Savol so\'zi',
                  type_ru: 'Вопросительное слово',
                  q: '你会说什么语言？',
                  py: 'Nǐ huì shuō shénme yǔyán?',
                  uz: 'Qaysi tillarni gapira olasan?',
                  ru: 'На каких языках ты умеешь говорить?',
                  color: '#7c3aed',
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
                    ? 'Ответ: 会 (да, умею) / 不会 (нет, не умею). Коротко и ясно!'
                    : 'Javob: 会 (ha, ...a olaman) / 不会 (yo\'q, ...a olmayman). Qisqa va aniq!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. 也会 / 都会 — комбинации' : '5. 也会 / 都会 — kombinatsiyalar'}</div>
              {[
                {
                  combo: '也会',
                  ex: '她也会说英语。',
                  py: 'Tā yě huì shuō Yīngyǔ.',
                  uz: 'U inglizcha ham gapira oladi.',
                  ru: 'Она тоже умеет говорить по-английски.',
                },
                {
                  combo: '都会',
                  ex: '我们都会游泳。',
                  py: 'Wǒmen dōu huì yóuyǒng.',
                  uz: 'Biz hammamiz suza olamiz.',
                  ru: 'Мы все умеем плавать.',
                },
                {
                  combo: '也都会',
                  ex: '他们也都会做饭。',
                  py: 'Tāmen yě dōu huì zuòfàn.',
                  uz: 'Ular ham hammasi pishira oladi.',
                  ru: 'Они тоже все умеют готовить.',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div style={{ display: 'inline-block', background: '#ecfeff', borderRadius: 4, padding: '2px 8px', fontSize: '0.75em', fontWeight: 700, color: COLOR, marginBottom: 4 }}>{x.combo}</div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'Порядок: 也 → 都 → 会 → глагол. Всегда такая последовательность!'
                    : 'Tartib: 也 → 都 → 会 → fe\'l. Har doim shu ketma-ketlik!'}
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Знание языков' : 'Mini dialog 1: Til bilish'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你会说中文吗？', py: 'Nǐ huì shuō Zhōngwén ma?', uz: 'Xitoycha gapira olasanmi?', ru: 'Умеешь говорить по-китайски?' },
                  { speaker: 'B', zh: '会一点儿。我在学。', py: 'Huì yìdiǎnr. Wǒ zài xué.', uz: 'Biroz. Hozir o\'rganayapman.', ru: 'Немного. Сейчас учу.' },
                  { speaker: 'A', zh: '你还会说别的语言吗？', py: 'Nǐ hái huì shuō bié de yǔyán ma?', uz: 'Boshqa tillarni ham gapira olasanmi?', ru: 'Умеешь говорить на других языках?' },
                  { speaker: 'B', zh: '会。我会说英语和法语。', py: 'Huì. Wǒ huì shuō Yīngyǔ hé Fǎyǔ.', uz: 'Ha. Inglizcha va frantsuzcha gapira olaman.', ru: 'Да. Умею говорить по-английски и по-французски.' },
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Новые навыки' : 'Mini dialog 2: Yangi ko\'nikmalar'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你会做中国菜吗？', py: 'Nǐ huì zuò Zhōngguó cài ma?', uz: 'Xitoy ovqatini pishira olasanmi?', ru: 'Умеешь готовить китайскую еду?' },
                  { speaker: 'B', zh: '不会。但是我很想学！', py: 'Bú huì. Dànshì wǒ hěn xiǎng xué!', uz: 'Olmayman. Lekin juda o\'rganmoqchiman!', ru: 'Нет. Но очень хочу научиться!' },
                  { speaker: 'A', zh: '我会做饺子，我教你吧。', py: 'Wǒ huì zuò jiǎozi, wǒ jiāo nǐ ba.', uz: 'Men chuchvara qila olaman, senga o\'rgatay.', ru: 'Я умею делать пельмени, давай научу тебя.' },
                  { speaker: 'B', zh: '太好了！谢谢你！', py: 'Tài hǎo le! Xièxie nǐ!', uz: 'Ajoyib! Rahmat!', ru: 'Замечательно! Спасибо!' },
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
              <div className="grammar-block__label">{language === 'ru' ? 'Частые сочетания с 会' : '会 bilan ko\'p ishlatiladigan fe\'llar'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '会说', py: 'huì shuō', uz: 'gapira olmoq', ru: 'уметь говорить' },
                  { zh: '会写', py: 'huì xiě', uz: 'yoza olmoq', ru: 'уметь писать' },
                  { zh: '会读', py: 'huì dú', uz: 'o\'qiy olmoq', ru: 'уметь читать' },
                  { zh: '会做', py: 'huì zuò', uz: 'qila olmoq', ru: 'уметь делать' },
                  { zh: '会做饭', py: 'huì zuòfàn', uz: 'pishira olmoq', ru: 'уметь готовить' },
                  { zh: '会开车', py: 'huì kāi chē', uz: 'hayda olmoq', ru: 'уметь водить' },
                  { zh: '会游泳', py: 'huì yóuyǒng', uz: 'suza olmoq', ru: 'уметь плавать' },
                  { zh: '会用', py: 'huì yòng', uz: 'ishlata olmoq', ru: 'уметь пользоваться' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em', color: COLOR }}>{w.zh}</div>
                    <div className="grammar-block__usage-py">{w.py}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? w.ru : w.uz}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? '会 vs 能 vs 可以' : '会 vs 能 vs 可以'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'В китайском три способа сказать «можно/умею»:'
                  : 'Xitoy tilida «...a olaman»ni uch xil aytish mumkin. Har birining o\'z joyi bor:'}
              </p>
              {[
                {
                  word: '会', py: 'huì', color: COLOR,
                  title_uz: 'Mahorat (o\'rganib olgan)', title_ru: 'Навык (приобретённый)',
                  desc_uz: 'O\'rganib, mashq qilib egallab olingan ko\'nikma.',
                  desc_ru: 'Освоенный, натренированный навык.',
                  ex: '我会游泳。', py_ex: 'Wǒ huì yóuyǒng.',
                  uz: 'Men suza olaman. (o\'rgangan)', ru: 'Я умею плавать. (научился)',
                },
                {
                  word: '能', py: 'néng', color: '#059669',
                  title_uz: 'Imkoniyat / sharoit', title_ru: 'Возможность / условие',
                  desc_uz: 'Jismoniy qobiliyat yoki sharoit (ruxsat, holat).',
                  desc_ru: 'Физическая способность или условие (разрешение, ситуация).',
                  ex: '我今天不能来。', py_ex: 'Wǒ jīntiān bù néng lái.',
                  uz: 'Men bugun kela olmayman. (sharoit)', ru: 'Я сегодня не могу прийти. (условие)',
                },
                {
                  word: '可以', py: 'kěyǐ', color: '#7c3aed',
                  title_uz: 'Ruxsat / mumkin', title_ru: 'Разрешение / дозволено',
                  desc_uz: 'Ijozat, ruxsat, qoidaga ko\'ra mumkin.',
                  desc_ru: 'Позволено, разрешено, допустимо.',
                  ex: '这里可以拍照吗？', py_ex: 'Zhèlǐ kěyǐ pāizhào ma?',
                  uz: 'Bu yerda surat olsa bo\'ladimi?', ru: 'Здесь можно фотографировать?',
                },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e0e0e6', borderLeftWidth: 4, borderLeftColor: r.color, borderLeftStyle: 'solid' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.word}</div>
                    <div>
                      <div style={{ fontSize: '0.8em', fontWeight: 700, color: r.color }}>{r.py} — {language === 'ru' ? r.title_ru : r.title_uz}</div>
                      <div style={{ fontSize: '0.72em', color: '#666' }}>{language === 'ru' ? r.desc_ru : r.desc_uz}</div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-item">
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-py">{r.py_ex}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? r.ru : r.uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Одна ситуация — три слова' : 'Bir vaziyat — uch so\'z'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'Одно «умею плавать» — три разных смысла:'
                  : 'Bir xil «suza olaman» gapi — uch xil ma\'no:'}
              </p>
              {[
                { ex: '我会游泳。', label_uz: '会 — mahorat bor (o\'rganganman)', label_ru: '会 — навык (научился)', color: COLOR },
                { ex: '我能游泳。', label_uz: '能 — sharoit imkon beradi (shifokor ruxsat berdi)', label_ru: '能 — условие позволяет (врач разрешил)', color: '#059669' },
                { ex: '这里可以游泳。', label_uz: '可以 — bu yerda suzsa bo\'ladi (ruxsat bor)', label_ru: '可以 — здесь разрешено плавать', color: '#7c3aed' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 3 }}>{language === 'ru' ? x.label_ru : x.label_uz}</div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '会 vs 想 — разница' : '会 vs 想 — farq'}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 600, marginBottom: 4 }}>会</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? '...УМЕЮ' : '...A OLAMAN'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? 'Навык / умение' : 'Qobiliyat / mahorat'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: '1px solid #fda4af' }}>
                  <div style={{ fontSize: '1.8em', color: '#e11d48', fontWeight: 600, marginBottom: 4 }}>想</div>
                  <div style={{ fontSize: '0.7em', color: '#e11d48', fontWeight: 700, marginBottom: 4 }}>{language === 'ru' ? '...ХОЧУ' : '...MOQCHIMAN'}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{language === 'ru' ? 'Желание / намерение' : 'Xohish / niyat'}</div>
                </div>
              </div>
              {[
                {
                  hui: '我会做饭。', hui_uz: 'Men pishira olaman. (mahorat bor)', hui_ru: 'Я умею готовить. (навык есть)',
                  xiang: '我想做饭。', xiang_uz: 'Men pishirmoqchiman. (xohish)', xiang_ru: 'Я хочу готовить. (желание)',
                },
                {
                  hui: '他会说中文。', hui_uz: 'U xitoycha gapira oladi.', hui_ru: 'Он умеет говорить по-китайски.',
                  xiang: '他想说中文。', xiang_uz: 'U xitoycha gapirmoqchi.', xiang_ru: 'Он хочет говорить по-китайски.',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                    <div className="grammar-block__usage-zh">{x.hui}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.hui_ru : x.hui_uz}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff1f2', border: '1px solid #fda4af' }}>
                    <div className="grammar-block__usage-zh">{x.xiang}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.xiang_ru : x.xiang_uz}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'Вместе: 我想学，以后我会说。 — Хочу учиться, потом буду уметь говорить.'
                    : 'Birgalikda: 我想学，以后我会说。 — O\'rganmoqchiman, keyin gapira olaman.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Таблица модальных глаголов' : 'Modal fe\'llar jadvali'}</div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85em' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f8' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{language === 'ru' ? 'Слово' : 'So\'z'}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{language === 'ru' ? 'Значение' : 'Ma\'nosi'}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{language === 'ru' ? 'Отриц.' : 'Inkor'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { word: '会', py: 'huì', uz: '...a olaman (mahorat)', ru: 'уметь (навык)', neg: '不会', color: COLOR },
                      { word: '能', py: 'néng', uz: '...a olaman (imkoniyat)', ru: 'мочь (возможность)', neg: '不能', color: '#059669' },
                      { word: '可以', py: 'kěyǐ', uz: 'mumkin (ruxsat)', ru: 'можно (разрешение)', neg: '不可以', color: '#7c3aed' },
                      { word: '想', py: 'xiǎng', uz: '...moqchi (xohish)', ru: 'хотеть (желание)', neg: '不想', color: '#e11d48' },
                      { word: '要', py: 'yào', uz: '...aman (qaror/kerak)', ru: 'нужно/собираться', neg: '不要', color: '#d97706' },
                    ].map((r, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e0e0e6' : 'none' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: r.color }}>{r.word} ({r.py})</td>
                        <td style={{ padding: '6px 8px', color: '#444' }}>{language === 'ru' ? r.ru : r.uz}</td>
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
