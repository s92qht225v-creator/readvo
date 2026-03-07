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
  { id: 'negative', uz: 'Inkor', ru: 'Отрицание' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
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
          <div className="grammar-page__hero-label">HSK 1 · {language === 'ru' ? 'Грамматика' : 'Grammatika'}</div>
          <div className="grammar-page__hero-char">是</div>
          <div className="grammar-page__hero-pinyin">shì</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'быть, являться' : 'bo\'lmoq'} —</div>
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
            {language === 'ru' ? s.ru : s.uz}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grammar-page__content">

        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Hieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">是</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">Pinyin</span><span className="grammar-block__info-val">shì</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span><span className="grammar-block__tone">{language === 'ru' ? '4-й тон (нисходящий) ↘' : '4-ton (tushuvchi) ↘'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span><span className="grammar-block__info-val">{language === 'ru' ? 'быть, являться' : 'bo\'lmoq, …dir'}</span></div>
                  <div className="grammar-block__info-row"><span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span><span className="grammar-block__info-val">9</span></div>
                </div>
              </div>
            </div>
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Важно' : 'Muhim eslatma'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? 'По-русски «Я студент» — глагол «быть» не нужен. В китайском 是 всегда обязателен:'
                  : 'O\'zbek tilida «Men talabaman» desak, «bo\'lmoq» fe\'li ko\'rinmaydi. Xitoy tilida esa 是 doimo yoziladi:'}
              </p>
              <div className="grammar-block__example-center">
                我<span className="grammar-block__highlight">是</span>学生。
              </div>
              <p className="grammar-block__tip-note">
                {language === 'ru' ? 'Пропускать 是 нельзя!' : 'Xitoy tilida 是 ni tushirib qoldirish mumkin emas!'}
              </p>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основная структура' : 'Asosiy tuzilma'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">A</span>
                {' '}
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'A = B (A является B)' : 'A = B (A — B dir)'}</p>
            </div>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Случаи употребления' : 'Qo\'llanish holatlari'}</div>
              {[
                { t_uz: '1. Shaxs', t_ru: '1. Имя', zh: '我是李明。', py: 'Wǒ shì Lǐ Míng.', uz: 'Men Li Mingman.', ru: 'Я Ли Мин.' },
                { t_uz: '2. Kasb', t_ru: '2. Профессия', zh: '他是医生。', py: 'Tā shì yīshēng.', uz: 'U shifokor.', ru: 'Он врач.' },
                { t_uz: '3. Millat', t_ru: '3. Национальность', zh: '我是乌兹别克人。', py: 'Wǒ shì Wūzībiékè rén.', uz: 'Men o\'zbekman.', ru: 'Я узбек.' },
                { t_uz: '4. Narsa', t_ru: '4. Предмет', zh: '这是茶。', py: 'Zhè shì chá.', uz: 'Bu choy.', ru: 'Это чай.' },
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
              <div className="grammar-block__label">{language === 'ru' ? 'Вопрос' : 'Savol tuzish'}</div>
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
                {language === 'ru' ? 'Добавьте 吗 (ma) в конец — получится вопрос.' : 'Oxiriga 吗 (ma) qo\'shilsa — savol.'}
              </p>
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
                <span className="grammar-block__formula-verb">是</span>
                {' '}
                <span className="grammar-block__formula-b">B</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'A ≠ B (A не является B)' : 'A ≠ B (A — B emas)'}</p>
            </div>
            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? 'Изменение тона' : 'Ton o\'zgarishi'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '不 обычно 4-й тон (bù), но перед 是 меняется на 2-й тон:'
                  : '不 odatda 4-ton (bù), lekin 是 oldida 2-tonga o\'zgaradi:'}
              </p>
              <div className="grammar-block__tone-change">
                bù → <span className="grammar-block__tone-new">bú</span> shì
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
