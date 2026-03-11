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
  { zh: '我是学生。', pinyin: 'Wǒ shì xuéshēng.', uz: 'Men talabaman.', ru: 'Я студент.', note_uz: '我 (wǒ) = men, 学生 (xuéshēng) = talaba', note_ru: '我 (wǒ) = я, 学生 (xuéshēng) = студент' },
  { zh: '她是老师。', pinyin: 'Tā shì lǎoshī.', uz: 'U o\'qituvchi.', ru: 'Она учитель.', note_uz: '她 (tā) = u (ayol), 老师 (lǎoshī) = o\'qituvchi', note_ru: '她 (tā) = она, 老师 (lǎoshī) = учитель' },
  { zh: '你是中国人吗？', pinyin: 'Nǐ shì Zhōngguó rén ma?', uz: 'Siz xitoylikmisiz?', ru: 'Вы китаец?', note_uz: '吗 (ma) = savol yuklamasi', note_ru: '吗 (ma) = вопросительная частица' },
  { zh: '这是我的书。', pinyin: 'Zhè shì wǒ de shū.', uz: 'Bu mening kitobim.', ru: 'Это моя книга.', note_uz: '这 (zhè) = bu, 书 (shū) = kitob', note_ru: '这 (zhè) = это, 书 (shū) = книга' },
  { zh: '他是我的朋友。', pinyin: 'Tā shì wǒ de péngyǒu.', uz: 'U mening do\'stim.', ru: 'Он мой друг.', note_uz: '朋友 (péngyǒu) = do\'st', note_ru: '朋友 (péngyǒu) = друг' },
  { zh: '我们是同学。', pinyin: 'Wǒmen shì tóngxué.', uz: 'Biz sinfdoshmiz.', ru: 'Мы однокласники.', note_uz: '我们 (wǒmen) = biz, 同学 (tóngxué) = sinfdosh', note_ru: '我们 (wǒmen) = мы, 同学 (tóngxué) = одноклассник' },
];

const negativeExamples = [
  { zh: '我不是医生。', pinyin: 'Wǒ bú shì yīshēng.', uz: 'Men shifokor emasman.', ru: 'Я не врач.', note_uz: '不 (bù) → 是 oldidan 不 (bú) bo\'ladi (ton o\'zgarishi)', note_ru: '不 (bù) → перед 是 становится 不 (bú) (изменение тона)' },
  { zh: '他不是中国人。', pinyin: 'Tā bú shì Zhōngguó rén.', uz: 'U xitoylik emas.', ru: 'Он не китаец.' },
  { zh: '这不是我的。', pinyin: 'Zhè bú shì wǒ de.', uz: 'Bu meniki emas.', ru: 'Это не моё.' },
];

const quizQuestions = [
  { q_uz: '"Men talabaman" xitoycha qanday?', q_ru: 'Как сказать "Я студент" по-китайски?', options: ['我是学生。', '我不是学生。', '你是学生。', '她是学生。'], correct: 0 },
  { q_uz: '是 so\'zining pinyin yozilishi?', q_ru: 'Как пишется пиньинь для 是?', options: ['sì', 'shì', 'shī', 'xì'], correct: 1 },
  { q_uz: '是 ning inkor shakli qanday?', q_ru: 'Как образуется отрицание от 是?', options: ['没是', '不是', '无是', '非是'], correct: 1 },
  { q_uz: '"她是老师" tarjimasi?', q_ru: 'Перевод "她是老师"?', options_uz: ['U talaba.', 'Men o\'qituvchi.', 'U o\'qituvchi.', 'Siz o\'qituvchi.'], options_ru: ['Она студент.', 'Я учитель.', 'Она учитель.', 'Вы учитель.'], correct: 2 },
  { q_uz: 'Qaysi gap to\'g\'ri?', q_ru: 'Какое предложение правильное?', options: ['我是不学生。', '我不是学生。', '不我是学生。', '是我不学生。'], correct: 1 },
];

export function GrammarShiPage() {
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
      {/* Banner + Hero as one seamless gradient */}
      <div className="grammar-page__hero">
        <div className="grammar-page__hero-bg">是</div>
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
          <div className="grammar-page__hero-char">是</div>
          <div className="grammar-page__hero-pinyin">shì</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'bo\'lmoq', ru: 'быть, являться', en: 'bo\'lmoq' } as Record<string, string>)[language]} —</div>
        </div>
      </div>

      {/* Section tabs */}
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

      {/* Content */}
      <div className="grammar-page__content">

        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ieroglif', ru: 'Иероглиф', en: 'Character' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">是</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">shì</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span><span className="grammar-block__tone">{({ uz: '4-ton (tushuvchi) ↘', ru: '4-й тон (нисходящий) ↘', en: '4-ton (tushuvchi) ↘' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">{({ uz: 'bo\'lmoq, …dir', ru: 'быть, являться', en: 'bo\'lmoq, …dir' } as Record<string, string>)[language]}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span><span className="grammar-block__info-val">9</span></div>
                </div>
              </div>
            </div>
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Muhim eslatma', ru: 'Важно', en: 'Muhim eslatma' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'O\'zbek tilida «Men talabaman» desak, «bo\'lmoq» fe\'li ko\'rinmaydi. Xitoy tilida esa 是 doimo yoziladi:', ru: 'По-русски «Я студент» — глагол «быть» не нужен. В китайском 是 всегда обязателен:', en: 'O\'zbek tilida «Men talabaman» desak, «bo\'lmoq» fe\'li ko\'rinmaydi. Xitoy tilida esa 是 doimo yoziladi:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__example-center">
                我<span className="grammar-block__highlight">是</span>学生。
              </div>
              <p className="grammar-block__tip-note">
                {({ uz: 'Xitoy tilida 是 ni tushirib qoldirish mumkin emas!', ru: 'Пропускать 是 нельзя!', en: 'Xitoy tilida 是 ni tushirib qoldirish mumkin emas!' } as Record<string, string>)[language]}
              </p>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy tuzilma', ru: 'Основная структура', en: 'Asosiy tuzilma' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A = B (A — B dir)', ru: 'A = B (A является B)', en: 'A = B (A — B dir)' } as Record<string, string>)[language]}</p>
            </div>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Qo\'llanish holatlari', ru: 'Случаи употребления', en: 'Qo\'llanish holatlari' } as Record<string, string>)[language]}</div>
              {[
                { t_uz: '1. Shaxs', t_ru: '1. Имя', zh: '我是李明。', py: 'Wǒ shì Lǐ Míng.', uz: 'Men Li Mingman.', ru: 'Я Ли Мин.' },
                { t_uz: '2. Kasb', t_ru: '2. Профессия', zh: '他是医生。', py: 'Tā shì yīshēng.', uz: 'U shifokor.', ru: 'Он врач.' },
                { t_uz: '3. Millat', t_ru: '3. Национальность', zh: '我是乌兹别克人。', py: 'Wǒ shì Wūzībiékè rén.', uz: 'Men o\'zbekman.', ru: 'Я узбек.' },
                { t_uz: '4. Narsa', t_ru: '4. Предмет', zh: '这是茶。', py: 'Zhè shì chá.', uz: 'Bu choy.', ru: 'Это чай.' },
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
              <div className="grammar-block__label">{({ uz: 'Savol tuzish', ru: 'Вопрос', en: 'Savol tuzish' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
                {' '}
                <span className="grammar-block__formula-ma">吗？</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Oxiriga 吗 (ma) qo\'shilsa — savol.', ru: 'Добавьте 吗 (ma) в конец — получится вопрос.', en: 'Oxiriga 吗 (ma) qo\'shilsa — savol.' } as Record<string, string>)[language]}
              </p>
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
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A ≠ B (A — B emas)', ru: 'A ≠ B (A не является B)', en: 'A ≠ B (A — B emas)' } as Record<string, string>)[language]}</p>
            </div>
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: 'Ton o\'zgarishi', ru: 'Изменение тона', en: 'Ton o\'zgarishi' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '不 odatda 4-ton (bù), lekin 是 oldida 2-tonga o\'zgaradi:', ru: '不 обычно 4-й тон (bù), но перед 是 меняется на 2-й тон:', en: '不 odatda 4-ton (bù), lekin 是 oldida 2-tonga o\'zgaradi:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__tone-change">
                bù → <span className="grammar-block__tone-new">bú</span> shì
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
