'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'negative', uz: 'Inkor', ru: 'Отрицание', en: 'Negation' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我有一本书。', pinyin: 'Wǒ yǒu yì běn shū.', uz: 'Menda bir kitob bor.', ru: 'У меня есть одна книга.', note_uz: '一本 (yì běn) = bir dona (kitob uchun), 书 (shū) = kitob', note_ru: '一本 (yì běn) = один (счётное слово для книг), 书 (shū) = книга' },
  { zh: '你有没有手机？', pinyin: 'Nǐ yǒu méiyǒu shǒujī?', uz: 'Senda telefon bormi?', ru: 'Есть ли у тебя телефон?', note_uz: '有没有 = savol shakli (bor-yo\'qmi), 手机 (shǒujī) = telefon', note_ru: '有没有 = вопросительная форма, 手机 (shǒujī) = телефон' },
  { zh: '他有两个孩子。', pinyin: 'Tā yǒu liǎng gè háizi.', uz: 'Uning ikki farzandi bor.', ru: 'У него двое детей.', note_uz: '两 (liǎng) = ikki, 个 (gè) = umumiy son birlik, 孩子 (háizi) = bola', note_ru: '两 (liǎng) = два, 个 (gè) = общий счётный суффикс, 孩子 (háizi) = ребёнок' },
  { zh: '教室里有很多学生。', pinyin: 'Jiàoshì lǐ yǒu hěn duō xuéshēng.', uz: 'Sinfxonada ko\'p talaba bor.', ru: 'В классе много студентов.', note_uz: '教室 (jiàoshì) = sinfxona, 里 (lǐ) = ichida, 很多 (hěn duō) = ko\'p', note_ru: '教室 (jiàoshì) = класс, 里 (lǐ) = внутри, 很多 (hěn duō) = много' },
  { zh: '桌子上有一杯茶。', pinyin: 'Zhuōzi shàng yǒu yì bēi chá.', uz: 'Stol ustida bir piyola choy bor.', ru: 'На столе стоит чашка чая.', note_uz: '桌子 (zhuōzi) = stol, 上 (shàng) = ustida, 杯 (bēi) = stakan/piyola', note_ru: '桌子 (zhuōzi) = стол, 上 (shàng) = на/сверху, 杯 (bēi) = стакан/чашка' },
  { zh: '我有一个问题。', pinyin: 'Wǒ yǒu yí gè wèntí.', uz: 'Mening bir savolim bor.', ru: 'У меня есть один вопрос.', note_uz: '问题 (wèntí) = savol/muammo', note_ru: '问题 (wèntí) = вопрос/проблема' },
];

const negativeExamples = [
  { zh: '我没有钱。', pinyin: 'Wǒ méiyǒu qián.', uz: 'Menda pul yo\'q.', ru: 'У меня нет денег.', note_uz: '没 (méi) ishlatiladi, 不 emas! 钱 (qián) = pul', note_ru: 'Используется 没 (méi), не 不! 钱 (qián) = деньги' },
  { zh: '他没有车。', pinyin: 'Tā méiyǒu chē.', uz: 'Uning mashinasi yo\'q.', ru: 'У него нет машины.', note_uz: '车 (chē) = mashina', note_ru: '车 (chē) = машина' },
  { zh: '这里没有人。', pinyin: 'Zhèlǐ méiyǒu rén.', uz: 'Bu yerda hech kim yo\'q.', ru: 'Здесь никого нет.', note_uz: '这里 (zhèlǐ) = bu yerda, 人 (rén) = odam', note_ru: '这里 (zhèlǐ) = здесь, 人 (rén) = человек' },
];

const quizQuestions = [
  {
    q_uz: '"Menda kitob bor" xitoycha qanday?',
    q_ru: 'Как сказать "У меня есть книга" по-китайски?',
    options: ['我是一本书。', '我有一本书。', '我在一本书。', '我的一本书。'],
    correct: 1,
  },
  {
    q_uz: '有 so\'zining pinyin yozilishi?',
    q_ru: 'Как пишется пиньинь для 有?',
    options: ['yòu', 'yǒu', 'yōu', 'yóu'],
    correct: 1,
  },
  {
    q_uz: '有 ning inkor shakli qanday?',
    q_ru: 'Как образуется отрицание от 有?',
    options: ['不有', '没有', '无有', '非有'],
    correct: 1,
  },
  {
    q_uz: '"桌子上有一杯茶" tarjimasi?',
    q_ru: 'Перевод "桌子上有一杯茶"?',
    options_uz: ['Stol ustida choy bor.', 'Stolda kitob bor.', 'Men choy ichaman.', 'Choy qayerda?'],
    options_ru: ['На столе есть чай.', 'На столе есть книга.', 'Я пью чай.', 'Где чай?'],
    correct: 0,
  },
  {
    q_uz: 'Qaysi gapda 有 mavjudlikni bildiradi?',
    q_ru: 'В каком предложении 有 обозначает существование?',
    options_uz: ['我有朋友。', '教室里有学生。', 'Ikkala gap ham.', 'Hech qaysi.'],
    options_ru: ['我有朋友。', '教室里有学生。', 'Оба варианта.', 'Ни один.'],
    correct: 1,
  },
];

export function GrammarYouPage() {
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
        <div className="grammar-page__hero-bg">有</div>
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
          <div className="grammar-page__hero-char">有</div>
          <div className="grammar-page__hero-pinyin">yǒu</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'bor bo\'lmoq / ega bo\'lmoq', ru: 'иметь, существовать', en: 'bor bo\'lmoq / ega bo\'lmoq' } as Record<string, string>)[language]} —</div>
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

        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ieroglif', ru: 'Иероглиф', en: 'Character' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">有</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">yǒu</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span><span className="grammar-block__tone">{({ uz: '3-ton (↘↗)', ru: '3-й тон (↘↗)', en: '3-ton (↘↗)' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">{({ uz: 'bor bo\'lmoq, ega bo\'lmoq', ru: 'иметь, существовать', en: 'bor bo\'lmoq, ega bo\'lmoq' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">6</span></div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '是 va 有 farqi', ru: '是 vs 有', en: '是 va 有 farqi' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-type">{({ uz: '是 — tenglashtirish', ru: '是 — равенство', en: '是 — tenglashtirish' } as Record<string, string>)[language]}</div>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">是</span>学生。</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Men talabaman.', ru: 'Я студент.', en: 'Men talabaman.' } as Record<string, string>)[language]}</div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-type">{({ uz: '有 — egalik / mavjudlik', ru: '有 — обладание / существование', en: '有 — egalik / mavjudlik' } as Record<string, string>)[language]}</div>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">有</span>书。</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Menda kitob bor.', ru: 'У меня есть книга.', en: 'Menda kitob bor.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ikki asosiy vazifasi', ru: 'Два основных значения', en: 'Two Main Uses' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Egalik', ru: 'Обладание', en: 'Possession' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我有书</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Menda kitob bor', ru: 'У меня есть книга', en: 'Menda kitob bor' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Mavjudlik', ru: 'Существование', en: 'Existence' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">这里有人</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Bu yerda odam bor', ru: 'Здесь есть люди', en: 'Bu yerda odam bor' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Egalik tuzilmasi', ru: '1. Обладание', en: '1. Egalik tuzilmasi' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Лицо', en: 'Person' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Narsa', ru: 'Вещь', en: 'Thing' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Kimda nimadir bor', ru: 'У кого-то что-то есть', en: 'Kimda nimadir bor' } as Record<string, string>)[language]}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">有</span>三个朋友。</div>
                <div className="grammar-block__usage-py">Wǒ yǒu sān gè péngyǒu.</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Mening uchta do\'stim bor.', ru: 'У меня три друга.', en: 'Mening uchta do\'stim bor.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Mavjudlik tuzilmasi', ru: '2. Существование', en: '2. Mavjudlik tuzilmasi' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Joy', ru: 'Место', en: 'Place' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Narsa/Odam', ru: 'Вещь/Человек', en: 'Thing/Person' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Biror joyda nimadir / kimdir bor', ru: 'Где-то что-то / кто-то есть', en: 'Biror joyda nimadir / kimdir bor' } as Record<string, string>)[language]}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">学校里<span className="grammar-block__highlight">有</span>图书馆。</div>
                <div className="grammar-block__usage-py">Xuéxiào lǐ yǒu túshūguǎn.</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Maktabda kutubxona bor.', ru: 'В школе есть библиотека.', en: 'Maktabda kutubxona bor.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Savol tuzish — 3 usul', ru: 'Вопросы — 3 способа', en: 'Savol tuzish — 3 usul' } as Record<string, string>)[language]}</div>
              {[
                { t_uz: '1. 吗 bilan', t_ru: '1. С 吗', zh: '你有车吗？', py: 'Nǐ yǒu chē ma?', uz: 'Senda mashina bormi?', ru: 'Есть ли у тебя машина?' },
                { t_uz: '2. 有没有 bilan', t_ru: '2. С 有没有', zh: '你有没有时间？', py: 'Nǐ yǒu méiyǒu shíjiān?', uz: 'Senda vaqt bor-yo\'qmi?', ru: 'Есть ли у тебя время?' },
                { t_uz: '3. 几/多少 bilan', t_ru: '3. С 几/多少', zh: '你有几个孩子？', py: 'Nǐ yǒu jǐ gè háizi?', uz: 'Sening nechta bolang bor?', ru: 'Сколько у тебя детей?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: x.t_uz, ru: x.t_ru, en: (x as any).t_en || x.t_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'examples' && (
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
        )}

        {activeTab === 'negative' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Inkor shakli', ru: 'Отрицательная форма', en: 'Negative Form' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' '}
                <span className="grammar-block__formula-neg">没</span>
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A da B yo\'q', ru: 'У A нет B', en: 'A da B yo\'q' } as Record<string, string>)[language]}</p>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Muhim qoida', ru: 'Важное правило', en: 'Muhim qoida' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '有 ning inkori 没 (méi) — 不 emas! Bu xitoy tilining eng muhim qoidalaridan biri:', ru: '有 отрицается через 没 (méi), НЕ через 不. Это одно из важнейших правил:', en: '有 ning inkori 没 (méi) — 不 emas! Bu xitoy tilining eng muhim qoidalaridan biri:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__example-center" style={{ fontSize: 18 }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.35 }}>不有</span>
                {'  →  '}
                <span style={{ color: '#16a34a', fontWeight: 700 }}>没有</span>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '是 va 有 inkor farqi', ru: 'Сравнение отрицаний', en: '是 va 有 inkor farqi' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: '是 inkori', ru: '是 → отрицание', en: '是 negation' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">不</span>是</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: '有 inkori', ru: '有 → отрицание', en: '有 negation' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">没</span>有</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Misollar', ru: 'Примеры', en: 'Examples' } as Record<string, string>)[language]}</div>
              {negativeExamples.map((ex, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{ex.zh}</div>
                  <div className="grammar-block__usage-py">{ex.pinyin}</div>
                  <div className="grammar-block__usage-tr">{({ uz: ex.uz, ru: ex.ru, en: (ex as any).en || ex.uz } as Record<string, string>)[language]}</div>
                  {(({ uz: ex.note_uz, ru: ex.note_ru, en: (ex as any).note_en || ex.note_uz } as Record<string, string | undefined>)[language]) && (
                    <div className="grammar-block__usage-note">💡 {({ uz: ex.note_uz, ru: ex.note_ru, en: (ex as any).note_en || ex.note_uz } as Record<string, string | undefined>)[language]}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'quiz' && (
          <div className="grammar-block">
            <div className="grammar-block__label">{({ uz: 'O\'zingizni sinang', ru: 'Проверьте себя', en: 'Test Yourself' } as Record<string, string>)[language]}</div>
            {quizQuestions.map((q, qi) => {
              const opts = q.options || (({ uz: q.options_uz, ru: q.options_ru, en: (q as any).options_en || q.options_uz } as Record<string, string[] | undefined>)[language]) || [];
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
                <div className="grammar-quiz__result-emoji">{score === quizQuestions.length ? '🎉' : score >= 3 ? '👍' : '📚'}</div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? (({ uz: 'Ajoyib! Barchasini to\'g\'ri topdingiz!', ru: 'Отлично! Всё правильно!', en: 'Excellent! All correct!' } as Record<string, string>)[language])
                    : score >= 3
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
