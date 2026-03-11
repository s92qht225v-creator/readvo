'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
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
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">HSK 1 · {({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</div>
          <div className="grammar-page__hero-char">在</div>
          <div className="grammar-page__hero-pinyin">zài</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'bo\'lmoq / joylashgan bo\'lmoq', ru: 'находиться, быть (где-то)', en: 'bo\'lmoq / joylashgan bo\'lmoq' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">在</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">zài</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span><span className="grammar-block__tone">{({ uz: '4-ton (↘)', ru: '4-й тон (↘)', en: '4-ton (↘)' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">{({ uz: 'bo\'lmoq / joylashgan bo\'lmoq', ru: 'находиться, быть (где-то)', en: 'bo\'lmoq / joylashgan bo\'lmoq' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">6</span></div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '是, 在 va 有 farqi', ru: '是 vs 在 vs 有', en: '是, 在 va 有 farqi' } as Record<string, string>)[language]}</div>
              {[
                { type_uz: '是 — tenglashtirish (A = B)', type_ru: '是 — равенство (A = B)', zh: '我<span class="grammar-block__highlight">是</span>学生。', tr_uz: 'Men talabaman.', tr_ru: 'Я студент.' },
                { type_uz: '有 — egalik yoki mavjudlik', type_ru: '有 — обладание / существование', zh: '我<span class="grammar-block__highlight">有</span>书。', tr_uz: 'Menda kitob bor.', tr_ru: 'У меня есть книга.' },
                { type_uz: '在 — joylashuv (qayerda?)', type_ru: '在 — местонахождение (где?)', zh: '我<span class="grammar-block__highlight">在</span>学校。', tr_uz: 'Men maktabdaman.', tr_ru: 'Я в школе.' },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: item.type_uz, ru: item.type_ru, en: (item as any).type_en || item.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{({ uz: item.tr_uz, ru: item.tr_ru, en: (item as any).tr_en || item.tr_uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ikki asosiy vazifasi', ru: 'Два основных значения', en: 'Two Main Uses' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Kesim', ru: 'Предикат', en: 'Predicate' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我在家</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Men uyda(man)', ru: 'Я дома', en: 'Men uyda(man)' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Old ko\'makchi', ru: 'Предлог', en: 'Preposition' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">在家学习</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Uyda o\'qish', ru: 'Учиться дома', en: 'Uyda o\'qish' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Joylashuv (kesim sifatida)', ru: '1. Местонахождение (предикат)', en: '1. Joylashuv (kesim sifatida)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega/Narsa', ru: 'Лицо/Вещь', en: 'Person/Thing' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Joy', ru: 'Место', en: 'Place' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Kimdir/nimadir biror joyda joylashgan', ru: 'Кто-то/что-то находится в каком-то месте', en: 'Kimdir/nimadir biror joyda joylashgan' } as Record<string, string>)[language]}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">猫<span className="grammar-block__highlight">在</span>沙发上。</div>
                <div className="grammar-block__usage-py">Māo zài shāfā shàng.</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Mushuk divanda.', ru: 'Кот на диване.', en: 'Mushuk divanda.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Harakat joyi (old ko\'makchi)', ru: '2. Место действия (предлог)', en: '2. Harakat joyi (old ko\'makchi)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Лицо', en: 'Person' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Joy', ru: 'Место', en: 'Place' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-a">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Harakat biror joyda sodir bo\'ladi', ru: 'Действие происходит в каком-то месте', en: 'Harakat biror joyda sodir bo\'ladi' } as Record<string, string>)[language]}</p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">在</span>图书馆学习。</div>
                <div className="grammar-block__usage-py">Wǒ zài túshūguǎn xuéxí.</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Men kutubxonada o\'qiyman.', ru: 'Я учусь в библиотеке.', en: 'Men kutubxonada o\'qiyman.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Savol — 在哪儿/在哪里', ru: 'Вопрос — 在哪儿/在哪里', en: 'Savol — 在哪儿/在哪里' } as Record<string, string>)[language]}</div>
              {[
                { t_uz: '哪儿 (nǎr) — og\'zaki nutq', t_ru: '哪儿 (nǎr) — разговорный', zh: '你在哪儿？', py: 'Nǐ zài nǎr?', uz: 'Sen qayerdasen?', ru: 'Где ты?' },
                { t_uz: '哪里 (nǎlǐ) — rasmiy nutq', t_ru: '哪里 (nǎlǐ) — письменный', zh: '书在哪里？', py: 'Shū zài nǎlǐ?', uz: 'Kitob qayerda?', ru: 'Где книга?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: x.t_uz, ru: x.t_ru, en: (x as any).t_en || x.t_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ko\'p ishlatiladigan joy so\'zlari', ru: 'Частые слова места', en: 'Ko\'p ishlatiladigan joy so\'zlari' } as Record<string, string>)[language]}</div>
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
                  <span className="grammar-block__info-val">{({ uz: w.uz, ru: w.ru, en: (w as any).en || w.uz } as Record<string, string>)[language]}</span>
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
                <span className="grammar-block__formula-neg">不</span>
                <span className="grammar-block__formula-verb">在</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A B joyida emas', ru: 'A не находится в B', en: 'A B joyida emas' } as Record<string, string>)[language]}</p>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Muhim qoida', ru: 'Важное правило', en: 'Muhim qoida' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '在 ning inkori 不 (bù) — 有 esa 没 (méi) bilan inkor qilinadi:', ru: '在 отрицается через 不 (bù), в отличие от 有 которое отрицается через 没:', en: '在 ning inkori 不 (bù) — 有 esa 没 (méi) bilan inkor qilinadi:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: '在 inkori', ru: '在 → отрицание', en: '在 negation' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh"><span className="grammar-block__formula-neg">不</span>在</div>
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
