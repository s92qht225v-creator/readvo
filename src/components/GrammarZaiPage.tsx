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
  { zh: '我在学校。', pinyin: 'Wǒ zài xuéxiào.', uz: 'Men maktabdaman.', ru: 'Я в школе.', note_uz: '学校 (xuéxiào) = maktab', note_ru: '学校 (xuéxiào) = школа' },
  { zh: '他在家吗？', pinyin: 'Tā zài jiā ma?', uz: 'U uyidami?', ru: 'Он дома?', note_uz: '家 (jiā) = uy, 吗 (ma) = savol yuklamasi', note_ru: '家 (jiā) = дом, 吗 (ma) = вопросительная частица' },
  { zh: '书在桌子上。', pinyin: 'Shū zài zhuōzi shàng.', uz: 'Kitob stol ustida.', ru: 'Книга на столе.', note_uz: '桌子 (zhuōzi) = stol, 上 (shàng) = ustida', note_ru: '桌子 (zhuōzi) = стол, 上 (shàng) = на/сверху' },
  { zh: '老师在教室里。', pinyin: 'Lǎoshī zài jiàoshì lǐ.', uz: 'O\'qituvchi sinfxonada.', ru: 'Учитель в классе.', note_uz: '老师 (lǎoshī) = o\'qituvchi, 教室 (jiàoshì) = sinfxona, 里 (lǐ) = ichida', note_ru: '老师 (lǎoshī) = учитель, 教室 (jiàoshì) = класс, 里 (lǐ) = внутри' },
  { zh: '他们在公园里玩儿。', pinyin: 'Tāmen zài gōngyuán lǐ wánr.', uz: 'Ular bog\'da o\'ynayapti.', ru: 'Они играют в парке.', note_uz: '公园 (gōngyuán) = bog\', 玩儿 (wánr) = o\'ynash', note_ru: '公园 (gōngyuán) = парк, 玩儿 (wánr) = играть' },
  { zh: '我在北京工作。', pinyin: 'Wǒ zài Běijīng gōngzuò.', uz: 'Men Pekinda ishlayapman.', ru: 'Я работаю в Пекине.', note_uz: '北京 (Běijīng) = Pekin, 工作 (gōngzuò) = ishlash', note_ru: '北京 (Běijīng) = Пекин, 工作 (gōngzuò) = работать' },
];

const negativeExamples = [
  { zh: '我不在家。', pinyin: 'Wǒ bù zài jiā.', uz: 'Men uyda emasman.', ru: 'Меня нет дома.', note_uz: '不在 (bù zài) = yo\'q / u yerda emas', note_ru: '不在 (bù zài) = нет / не там' },
  { zh: '老师不在学校。', pinyin: 'Lǎoshī bù zài xuéxiào.', uz: 'O\'qituvchi maktabda emas.', ru: 'Учителя нет в школе.', note_uz: null, note_ru: null },
  { zh: '手机不在桌子上。', pinyin: 'Shǒujī bù zài zhuōzi shàng.', uz: 'Telefon stol ustida emas.', ru: 'Телефона нет на столе.', note_uz: '手机 (shǒujī) = telefon', note_ru: '手机 (shǒujī) = телефон' },
];

const quizQuestions = [
  {
    q_uz: '"Men maktabdaman" xitoycha qanday?',
    q_ru: 'Как сказать "Я в школе" по-китайски?',
    options: ['我是学校。', '我在学校。', '我有学校。', '我的学校。'],
    correct: 1,
  },
  {
    q_uz: '在 so\'zining pinyin yozilishi?',
    q_ru: 'Как пишется пиньинь для 在?',
    options: ['zhài', 'zǎi', 'zài', 'zāi'],
    correct: 2,
  },
  {
    q_uz: '在 ning inkor shakli qanday?',
    q_ru: 'Как образуется отрицание от 在?',
    options: ['没在', '不是', '不在', '无在'],
    correct: 2,
  },
  {
    q_uz: '"书在桌子上" tarjimasi?',
    q_ru: 'Перевод "书在桌子上"?',
    options_uz: ['Kitob stol ustida.', 'Kitob uyda.', 'Men kitob o\'qiyman.', 'Stol qayerda?'],
    options_ru: ['Книга на столе.', 'Книга дома.', 'Я читаю книгу.', 'Где стол?'],
    correct: 0,
  },
  {
    q_uz: 'Qaysi gapda 在 joylashuvni bildiradi?',
    q_ru: 'В каком предложении 在 обозначает местонахождение?',
    options_uz: ['我在学习。', '他在学校。', 'Ikkala gap ham.', 'Hech qaysi.'],
    options_ru: ['我在学习。', '他在学校。', 'Оба варианта.', 'Ни один.'],
    correct: 1,
  },
];

export function GrammarZaiPage() {
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
        <div className="grammar-page__hero-bg">在</div>
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
          <div className="grammar-page__hero-char">在</div>
          <div className="grammar-page__hero-pinyin">zài</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'находиться, быть (где-то)' : 'bo\'lmoq / joylashgan bo\'lmoq'} —</div>
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
                <div className="grammar-block__big-char">在</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">zài</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span><span className="grammar-block__tone">{language === 'ru' ? '4-й тон (↘)' : '4-ton (↘)'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span><span className="grammar-block__info-val">{language === 'ru' ? 'находиться, быть (где-то)' : 'bo\'lmoq / joylashgan bo\'lmoq'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span><span className="grammar-block__info-val">6</span></div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '是 vs 在 vs 有' : '是, 在 va 有 farqi'}</div>
              {[
                { type_uz: '是 — tenglashtirish (A = B)', type_ru: '是 — равенство (A = B)', zh: '我<span class="grammar-block__highlight">是</span>学生。', tr_uz: 'Men talabaman.', tr_ru: 'Я студент.' },
                { type_uz: '有 — egalik yoki mavjudlik', type_ru: '有 — обладание / существование', zh: '我<span class="grammar-block__highlight">有</span>书。', tr_uz: 'Menda kitob bor.', tr_ru: 'У меня есть книга.' },
                { type_uz: '在 — joylashuv (qayerda?)', type_ru: '在 — местонахождение (где?)', zh: '我<span class="grammar-block__highlight">在</span>学校。', tr_uz: 'Men maktabdaman.', tr_ru: 'Я в школе.' },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{language === 'ru' ? item.type_ru : item.type_uz}</div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{language === 'ru' ? item.tr_ru : item.tr_uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Два основных значения' : 'Ikki asosiy vazifasi'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Предикат' : 'Kesim'}</div>
                  <div className="grammar-block__usage-zh">我在家</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я дома' : 'Men uyda(man)'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Предлог' : 'Old ko\'makchi'}</div>
                  <div className="grammar-block__usage-zh">在家学习</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Учиться дома' : 'Uyda o\'qish'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Местонахождение (предикат)' : '1. Joylashuv (kesim sifatida)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Лицо/Вещь' : 'Ega/Narsa'}</span>
                {' '}
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Место' : 'Joy'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Кто-то/что-то находится в каком-то месте' : 'Kimdir/nimadir biror joyda joylashgan'}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">猫<span className="grammar-block__highlight">在</span>沙发上。</div>
                <div className="grammar-block__usage-py">Māo zài shāfā shàng.</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'Кот на диване.' : 'Mushuk divanda.'}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Место действия (предлог)' : '2. Harakat joyi (old ko\'makchi)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Лицо' : 'Ega'}</span>
                {' '}
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Место' : 'Joy'}</span>
                {' '}
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Действие происходит в каком-то месте' : 'Harakat biror joyda sodir bo\'ladi'}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">在</span>图书馆学习。</div>
                <div className="grammar-block__usage-py">Wǒ zài túshūguǎn xuéxí.</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я учусь в библиотеке.' : 'Men kutubxonada o\'qiyman.'}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Вопрос — 在哪儿/在哪里' : 'Savol — 在哪儿/在哪里'}</div>
              {[
                { t_uz: '哪儿 (nǎr) — og\'zaki nutq', t_ru: '哪儿 (nǎr) — разговорный', zh: '你在哪儿？', py: 'Nǐ zài nǎr?', uz: 'Sen qayerdasen?', ru: 'Где ты?' },
                { t_uz: '哪里 (nǎlǐ) — rasmiy nutq', t_ru: '哪里 (nǎlǐ) — письменный', zh: '书在哪里？', py: 'Shū zài nǎlǐ?', uz: 'Kitob qayerda?', ru: 'Где книга?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{language === 'ru' ? x.t_ru : x.t_uz}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Частые слова места' : 'Ko\'p ishlatiladigan joy so\'zlari'}</div>
              {[
                { zh: '上', py: 'shàng', uz: 'ustida', ru: 'на/сверху' },
                { zh: '下', py: 'xià', uz: 'ostida', ru: 'под/снизу' },
                { zh: '里', py: 'lǐ', uz: 'ichida', ru: 'внутри' },
                { zh: '旁边', py: 'pángbiān', uz: 'yonida', ru: 'рядом' },
                { zh: '前面', py: 'qiánmiàn', uz: 'oldida', ru: 'впереди' },
                { zh: '后面', py: 'hòumiàn', uz: 'orqasida', ru: 'сзади' },
              ].map((w, i) => (
                <div key={i} className="grammar-block__info-row">
                  <span className="grammar-block__usage-zh" style={{ minWidth: 48 }}>{w.zh}</span>
                  <span className="grammar-block__usage-py" style={{ minWidth: 80 }}>{w.py}</span>
                  <span className="grammar-block__info-val">{language === 'ru' ? w.ru : w.uz}</span>
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
                <span className="grammar-block__formula-neg">不</span>
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'A не находится в B' : 'A B joyida emas'}</p>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Важное правило' : 'Muhim qoida'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '在 отрицается через 不 (bù), в отличие от 有 которое отрицается через 没:'
                  : '在 ning inkori 不 (bù) — 有 esa 没 (méi) bilan inkor qilinadi:'}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? '在 → отрицание' : '在 inkori'}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">不</span>在</div>
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
