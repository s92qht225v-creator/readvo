'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры' },
  { id: 'negative', uz: 'Inkor', ru: 'Отрицание' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
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
            <Link href="/chinese?tab=grammar" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">HSK 1 · {language === 'ru' ? 'Грамматика' : 'Grammatika'}</div>
          <div className="grammar-page__hero-char">有</div>
          <div className="grammar-page__hero-pinyin">yǒu</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'иметь, существовать' : 'bor bo\'lmoq / ega bo\'lmoq'} —</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Hieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">有</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">yǒu</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span><span className="grammar-block__tone">{language === 'ru' ? '3-й тон (↘↗)' : '3-ton (↘↗)'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span><span className="grammar-block__info-val">{language === 'ru' ? 'иметь, существовать' : 'bor bo\'lmoq, ega bo\'lmoq'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span><span className="grammar-block__info-val">6</span></div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '是 vs 有' : '是 va 有 farqi'}</div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-type">{language === 'ru' ? '是 — равенство' : '是 — tenglashtirish'}</div>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">是</span>学生。</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я студент.' : 'Men talabaman.'}</div>
              </div>
              <div className="grammar-block__usage-item">
                <div className="grammar-block__usage-type">{language === 'ru' ? '有 — обладание / существование' : '有 — egalik / mavjudlik'}</div>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">有</span>书。</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'У меня есть книга.' : 'Menda kitob bor.'}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Два основных значения' : 'Ikki asosiy vazifasi'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Обладание' : 'Egalik'}</div>
                  <div className="grammar-block__usage-zh">我有书</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'У меня есть книга' : 'Menda kitob bor'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Существование' : 'Mavjudlik'}</div>
                  <div className="grammar-block__usage-zh">这里有人</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Здесь есть люди' : 'Bu yerda odam bor'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Обладание' : '1. Egalik tuzilmasi'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Лицо' : 'Ega'}</span>
                {' '}
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Вещь' : 'Narsa'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'У кого-то что-то есть' : 'Kimda nimadir bor'}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">有</span>三个朋友。</div>
                <div className="grammar-block__usage-py">Wǒ yǒu sān gè péngyǒu.</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'У меня три друга.' : 'Mening uchta do\'stim bor.'}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Существование' : '2. Mavjudlik tuzilmasi'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Место' : 'Joy'}</span>
                {' '}
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Вещь/Человек' : 'Narsa/Odam'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Где-то что-то / кто-то есть' : 'Biror joyda nimadir / kimdir bor'}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">学校里<span className="grammar-block__highlight">有</span>图书馆。</div>
                <div className="grammar-block__usage-py">Xuéxiào lǐ yǒu túshūguǎn.</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'В школе есть библиотека.' : 'Maktabda kutubxona bor.'}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Вопросы — 3 способа' : 'Savol tuzish — 3 usul'}</div>
              {[
                { t_uz: '1. 吗 bilan', t_ru: '1. С 吗', zh: '你有车吗？', py: 'Nǐ yǒu chē ma?', uz: 'Senda mashina bormi?', ru: 'Есть ли у тебя машина?' },
                { t_uz: '2. 有没有 bilan', t_ru: '2. С 有没有', zh: '你有没有时间？', py: 'Nǐ yǒu méiyǒu shíjiān?', uz: 'Senda vaqt bor-yo\'qmi?', ru: 'Есть ли у тебя время?' },
                { t_uz: '3. 几/多少 bilan', t_ru: '3. С 几/多少', zh: '你有几个孩子？', py: 'Nǐ yǒu jǐ gè háizi?', uz: 'Sening nechta bolang bor?', ru: 'Сколько у тебя детей?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{language === 'ru' ? x.t_ru : x.t_uz}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'examples' && (
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
        )}

        {activeTab === 'negative' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Отрицательная форма' : 'Inkor shakli'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' '}
                <span className="grammar-block__formula-neg">没</span>
                <span className="grammar-block__formula-verb">有</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'У A нет B' : 'A da B yo\'q'}</p>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Важное правило' : 'Muhim qoida'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '有 отрицается через 没 (méi), НЕ через 不. Это одно из важнейших правил:'
                  : '有 ning inkori 没 (méi) — 不 emas! Bu xitoy tilining eng muhim qoidalaridan biri:'}
              </p>
              <div className="grammar-block__example-center" style={{ fontSize: 18 }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.35 }}>不有</span>
                {'  →  '}
                <span style={{ color: '#16a34a', fontWeight: 700 }}>没有</span>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Сравнение отрицаний' : '是 va 有 inkor farqi'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? '是 → отрицание' : '是 inkori'}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">不</span>是</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? '有 → отрицание' : '有 inkori'}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">没</span>有</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Примеры' : 'Misollar'}</div>
              {negativeExamples.map((ex, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{ex.zh}</div>
                  <div className="grammar-block__usage-py">{ex.pinyin}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? ex.ru : ex.uz}</div>
                  {(language === 'ru' ? ex.note_ru : ex.note_uz) && (
                    <div className="grammar-block__usage-note">💡 {language === 'ru' ? ex.note_ru : ex.note_uz}</div>
                  )}
                </div>
              ))}
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
                <div className="grammar-quiz__result-emoji">{score === quizQuestions.length ? '🎉' : score >= 3 ? '👍' : '📚'}</div>
                <div className="grammar-quiz__result-score">{score} / {quizQuestions.length}</div>
                <div className="grammar-quiz__result-msg">
                  {score === quizQuestions.length
                    ? (language === 'ru' ? 'Отлично! Всё правильно!' : 'Ajoyib! Barchasini to\'g\'ri topdingiz!')
                    : score >= 3
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

      <footer className="home__footer">
        <p>{language === 'ru' ? 'Blim — Интерактивные учебники языков' : 'Blim — Interaktiv til darsliklari'}</p>
      </footer>
    </div>
  );
}
