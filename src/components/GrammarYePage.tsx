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
  { id: 'position', uz: 'O\'rni', ru: 'Позиция' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '我是学生，他也是学生。', pinyin: 'Wǒ shì xuésheng, tā yě shì xuésheng.', uz: 'Men talabaman, u ham talaba.', ru: 'Я студент, он тоже студент.', note_uz: 'Ikki kishi bir xil — 也 ikkinchi gapda egadan keyin', note_ru: 'Два человека — одно и то же: 也 во втором предложении после подлежащего' },
  { zh: '我喜欢茶，我也喜欢咖啡。', pinyin: 'Wǒ xǐhuan chá, wǒ yě xǐhuan kāfēi.', uz: 'Men choyni yoqtiraman, qahvani ham yoqtiraman.', ru: 'Я люблю чай, я также люблю кофе.', note_uz: 'Bir kishi ikki narsa yoqtiradi — 也 ikkinchi gapda', note_ru: 'Один человек любит два разных: 也 во втором предложении' },
  { zh: '她很高，也很漂亮。', pinyin: 'Tā hěn gāo, yě hěn piàoliang.', uz: 'U baland bo\'yli, chiroyli ham.', ru: 'Она высокая и красивая.', note_uz: 'Ikki sifat — 也 ikkinchi sifatdan oldin', note_ru: 'Два прилагательных — 也 перед вторым' },
  { zh: '我也想去。', pinyin: 'Wǒ yě xiǎng qù.', uz: 'Men ham bormoqchiman.', ru: 'Я тоже хочу пойти.', note_uz: 'Boshqa birov bormoqchi — men HAM', note_ru: 'Кто-то другой хочет — я ТОЖЕ' },
  { zh: '他也不喝酒。', pinyin: 'Tā yě bù hē jiǔ.', uz: 'U ham ichkilik ichmaydi.', ru: 'Он тоже не пьёт алкоголь.', note_uz: 'Inkor + ham: 也 + 不 tartib — 也不', note_ru: 'Отрицание + тоже: порядок 也不, не наоборот' },
  { zh: '妈妈也会做饭。', pinyin: 'Māma yě huì zuòfàn.', uz: 'Onam ham ovqat pishira oladi.', ru: 'Мама тоже умеет готовить.', note_uz: 'Modal fe\'l bilan: 也 + 会 + fe\'l', note_ru: 'С модальным глаголом: 也 + 会 + глагол' },
  { zh: '我们也去了。', pinyin: 'Wǒmen yě qù le.', uz: 'Biz ham bordik.', ru: 'Мы тоже ходили.', note_uz: 'O\'tgan zamon: 也 + fe\'l + 了', note_ru: 'Прошедшее время: 也 + глагол + 了' },
  { zh: '这个也很好。', pinyin: 'Zhège yě hěn hǎo.', uz: 'Bu ham juda yaxshi.', ru: 'Это тоже очень хорошо.', note_uz: 'Narsa haqida — 也 boshqa narsaga solishtirish', note_ru: 'О вещи — 也 в сравнении с другой вещью' },
];

const quizQuestions = [
  {
    q_uz: '"Men ham talabaman" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я тоже студент"?',
    options: ['我是也学生', '我也是学生', '也我是学生', '我是学生也'],
    correct: 1,
  },
  {
    q_uz: '也 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 也 в предложении?',
    options_uz: ['Gap oxiriga', 'Ob\'yektdan keyin', 'Egadan keyin, fe\'ldan oldin', 'Gap boshiga'],
    options_ru: ['В конец предложения', 'После объекта', 'После подлежащего, перед глаголом', 'В начало предложения'],
    correct: 2,
  },
  {
    q_uz: '"U ham ichmaydi" qanday?',
    q_ru: 'Как сказать "Он тоже не пьёт"?',
    options: ['他不也喝', '他也喝不', '他也不喝', '也他不喝'],
    correct: 2,
  },
  {
    q_uz: '也 qanday o\'qiladi?',
    q_ru: 'Как читается 也?',
    options_uz: ['yé (2-ton)', 'yè (4-ton)', 'yě (3-ton)', 'ye (tonsiz)'],
    options_ru: ['yé (2-й тон)', 'yè (4-й тон)', 'yě (3-й тон)', 'ye (нейтральный)'],
    correct: 2,
  },
  {
    q_uz: 'Qaysi gapda 也 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 也 использован ПРАВИЛЬНО?',
    options: ['也我喜欢茶', '我喜欢也茶', '我也喜欢茶', '我喜欢茶也'],
    correct: 2,
  },
  {
    q_uz: '也 va 都 birgalikda qanday tartibda?',
    q_ru: 'В каком порядке 也 и 都 стоят вместе?',
    options_uz: ['都也', '也都', 'Farqi yo\'q', 'Birgalikda ishlatilmaydi'],
    options_ru: ['都也', '也都', 'Нет разницы', 'Нельзя использовать вместе'],
    correct: 1,
  },
];

export function GrammarYePage() {
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
        <div className="grammar-page__hero-bg">也</div>
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
          <div className="grammar-page__hero-char">也</div>
          <div className="grammar-page__hero-pinyin">yě</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'тоже / также' : 'ham / ...ham'} —</div>
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
                <div className="grammar-block__big-char">也</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">yě</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '3-й тон (вниз-вверх ↘↗)' : '3-ton (pastga-yuqoriga ↘↗)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'тоже, также' : 'ham, ...ham'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Наречие' : 'Ravish (adverb)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '也 — одно из самых частых слов в китайском. Полный эквивалент русского «тоже»:'
                  : '也 — xitoy tilida eng ko\'p ishlatiladigan so\'zlardan biri. O\'zbek tilidagi «ham» ning to\'liq ekvivalenti:'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  我是学生。→ 他<span className="grammar-block__highlight">也</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? 'Я студент. → Он тоже студент.' : 'Men talabaman. → U ham talaba.'}
                </div>
              </div>
              {language === 'uz' && (
                <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                  <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                    ⚠️ <strong>Muhim farq:</strong>{' '}
                    O&apos;zbekchada «ham» oxiriga tushadi, lekin 也 har doim fe&apos;ldan OLDIN turadi!
                  </p>
                </div>
              )}
              {language === 'ru' && (
                <p className="grammar-block__tip-text" style={{ color: '#059669', marginTop: 8 }}>
                  <strong>Хорошая новость:</strong> Порядок слов такой же, как в русском — Подлежащее + тоже/也 + Глагол.
                </p>
              )}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основное правило' : 'Asosiy qoida'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол/Прилаг.' : 'Fe\'l / Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru'
                  ? '也 всегда стоит после подлежащего, перед глаголом. Как русское «тоже» — порядок совпадает!'
                  : '也 har doim egadan keyin, fe\'ldan oldin — hech qachon boshiga yoki oxiriga qo\'yilmaydi!'}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Два подлежащих — одно действие' : '1. Ikki ega — bir xil ish'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Фраза A' : 'A gap'}</span>
                {', '}
                <span className="grammar-block__formula-b">B</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'глаг.' : 'fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'A делает, B ТОЖЕ делает' : 'A qiladi, B HAM qiladi'}</p>
              {[
                { zh: '我喝茶，他也喝茶。', py: 'Wǒ hē chá, tā yě hē chá.', uz: 'Men choy ichaman, u ham choy ichadi.', ru: 'Я пью чай, он тоже пьёт чай.' },
                { zh: '我去学校，她也去学校。', py: 'Wǒ qù xuéxiào, tā yě qù xuéxiào.', uz: 'Men maktabga boraman, u ham boradi.', ru: 'Я иду в школу, она тоже идёт.' },
                { zh: '爸爸会做饭，妈妈也会做饭。', py: 'Bàba huì zuòfàn, māma yě huì zuòfàn.', uz: 'Otam ovqat pishira oladi, onam ham.', ru: 'Папа умеет готовить, мама тоже.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Одно подлежащее — два действия/признака' : '2. Bir ega — ikki xil ish/sifat'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'глаг₁' : 'fe\'l₁'}</span>
                {', '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'глаг₂' : 'fe\'l₂'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Один человек делает два разных действия' : 'Bir kishi ikki narsa qiladi / ikki xil'}</p>
              {[
                { zh: '我喜欢茶，也喜欢咖啡。', py: 'Wǒ xǐhuan chá, yě xǐhuan kāfēi.', uz: 'Men choyni yoqtiraman, qahvani ham.', ru: 'Я люблю чай и также кофе.' },
                { zh: '她很聪明，也很漂亮。', py: 'Tā hěn cōngming, yě hěn piàoliang.', uz: 'U aqlli, chiroyli ham.', ru: 'Она умная и красивая.' },
                { zh: '他会说英语，也会说中文。', py: 'Tā huì shuō Yīngyǔ, yě huì shuō Zhōngwén.', uz: 'U inglizcha gapira oladi, xitoycha ham.', ru: 'Он умеет говорить по-английски и по-китайски.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. 也不 — тоже не... (отрицание)' : '3. 也不 — ham ...maydi (inkor)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '也 + 不 → тоже не делает / тоже не является' : '也 + 不 → ham ...maydi / ham emas'}</p>
              {[
                { zh: '我不喝酒，他也不喝酒。', py: 'Wǒ bù hē jiǔ, tā yě bù hē jiǔ.', uz: 'Men ichkilik ichmayman, u ham ichmaydi.', ru: 'Я не пью алкоголь, он тоже не пьёт.' },
                { zh: '她不是老师，我也不是。', py: 'Tā bú shì lǎoshī, wǒ yě bú shì.', uz: 'U o\'qituvchi emas, men ham emasman.', ru: 'Она не учитель, я тоже нет.' },
                { zh: '我也不想去。', py: 'Wǒ yě bù xiǎng qù.', uz: 'Men ham bormoqchi emasman.', ru: 'Я тоже не хочу идти.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ {language === 'ru' ? 'Порядок важен: всегда 也不, никогда 不也!' : 'Tartib muhim: har doim 也不, hech qachon 不也!'}
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">
                    <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>他不也喝酒</span>
                    {' ✗ → '}
                    <span style={{ color: '#16a34a' }}>他也不喝酒</span>
                    {' ✓'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. 也 + 都 вместе' : '4. 也 + 都 birgalikda'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '也都 = тоже все / тоже оба' : '也都 = ham hammasi / ham barchasi'}</p>
              {[
                { zh: '我们也都是学生。', py: 'Wǒmen yě dōu shì xuésheng.', uz: 'Biz ham hammamiz talabamiz.', ru: 'Мы тоже все студенты.' },
                { zh: '他们也都去了。', py: 'Tāmen yě dōu qù le.', uz: 'Ular ham hammasi bordi.', ru: 'Они тоже все пошли.' },
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
                    ? '💡 Порядок: 也 всегда стоит ПЕРЕД 都: 也都, никогда 都也.'
                    : '💡 Tartib: 也 har doim 都 dan OLDIN keladi: 也都, hech qachon 都也.'}
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Новый одноклассник' : 'Mini dialog 1: Yangi sinfdosh'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '我是中国人。你呢？', py: 'Wǒ shì Zhōngguó rén. Nǐ ne?', uz: 'Men xitoylikman. Senchi?', ru: 'Я китаец. А ты?' },
                  { speaker: 'B', zh: '我也是中国人！', py: 'Wǒ yě shì Zhōngguó rén!', uz: 'Men ham xitoylikman!', ru: 'Я тоже китаец!' },
                  { speaker: 'A', zh: '你喜欢看电影吗？', py: 'Nǐ xǐhuan kàn diànyǐng ma?', uz: 'Kino ko\'rishni yoqtirasanmi?', ru: 'Тебе нравится смотреть кино?' },
                  { speaker: 'B', zh: '喜欢！我也喜欢听音乐。', py: 'Xǐhuan! Wǒ yě xǐhuan tīng yīnyuè.', uz: 'Ha! Musiqa tinglashni ham yoqtiraman.', ru: 'Да! Я также люблю слушать музыку.' },
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Выбор еды' : 'Mini dialog 2: Ovqat tanlash'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '我不想吃米饭。', py: 'Wǒ bù xiǎng chī mǐfàn.', uz: 'Men guruch yegim kelmayapti.', ru: 'Я не хочу есть рис.' },
                  { speaker: 'B', zh: '我也不想吃米饭。面条呢？', py: 'Wǒ yě bù xiǎng chī mǐfàn. Miàntiáo ne?', uz: 'Men ham yegim kelmayapti. Noodle-chi?', ru: 'Я тоже не хочу. А лапша?' },
                  { speaker: 'A', zh: '好！我喜欢面条，也喜欢饺子。', py: 'Hǎo! Wǒ xǐhuan miàntiáo, yě xǐhuan jiǎozi.', uz: 'Bo\'pti! Men noodle yoqtiraman, chuchvarani ham.', ru: 'Хорошо! Я люблю лапшу и тоже пельмени.' },
                  { speaker: 'B', zh: '太好了！我们都喜欢！', py: 'Tài hǎo le! Wǒmen dōu xǐhuan!', uz: 'Ajoyib! Ikkalamiz ham yoqtiramiz!', ru: 'Отлично! Нам обоим нравится!' },
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

        {/* ── POSITION ── */}
        {activeTab === 'position' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Точная позиция 也' : '也 ning aniq o\'rni'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {language === 'ru'
                  ? '也 всегда после подлежащего, перед глаголом — другие позиции недопустимы. Это отличается от узбекского!'
                  : '也 har doim egadan keyin, fe\'ldan oldin — boshqa o\'ringa qo\'yib bo\'lmaydi. Bu o\'zbekchadan farqli!'}
              </p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{
                  display: 'inline-flex', gap: 4, alignItems: 'center',
                  background: '#f5f5f8', borderRadius: 8, padding: '10px 14px',
                }}>
                  <span style={{ background: '#dcfce7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                    {language === 'ru' ? 'Подлеж.' : 'Ega'}
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fef3c7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, color: '#dc2626', border: '2px solid #dc2626' }}>
                    也
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fee2e2', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {language === 'ru' ? 'Глагол' : 'Fe\'l'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Ошибки и правильные варианты' : 'Xato va to\'g\'ri joylashtirish'}</div>
              {[
                { wrong: '也我是学生。', right: '我也是学生。', rule_uz: '也 gap boshiga qo\'yilmaydi — egadan keyin!', rule_ru: '也 не ставится в начало — только после подлежащего!' },
                { wrong: '我是也学生。', right: '我也是学生。', rule_uz: '也 fe\'l va ob\'yekt orasiga tushmaydi — fe\'ldan oldin!', rule_ru: '也 не между глаголом и объектом — только перед глаголом!' },
                { wrong: '我是学生也。', right: '我也是学生。', rule_uz: '也 gap oxiriga qo\'yilmaydi — bu o\'zbekcha tartib!', rule_ru: '也 не ставится в конец — это узбекский порядок!' },
                { wrong: '我不也去。', right: '我也不去。', rule_uz: 'Inkor bilan: 也不, hech qachon 不也!', rule_ru: 'С отрицанием: 也不, никогда 不也!' },
              ].map((ex, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                      <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {language === 'ru' ? 'НЕВЕРНО' : 'XATO'}</div>
                      <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>{ex.wrong}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                      <div className="grammar-block__usage-zh">{ex.right}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{language === 'ru' ? ex.rule_ru : ex.rule_uz}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Порядок с другими словами' : 'Boshqa so\'zlar bilan tartib'}</div>
              {[
                { combo: '也 + 不', ex: '我也不去', ex_uz: 'Men ham bormayman', ex_ru: 'Я тоже не пойду' },
                { combo: '也 + 没', ex: '他也没来', ex_uz: 'U ham kelmadi', ex_ru: 'Он тоже не пришёл' },
                { combo: '也 + 都', ex: '他们也都去了', ex_uz: 'Ular ham hammasi bordi', ex_ru: 'Они тоже все пошли' },
                { combo: '也 + 很', ex: '她也很高', ex_uz: 'U ham baland bo\'yli', ex_ru: 'Она тоже высокая' },
                { combo: '也 + 会', ex: '我也会说', ex_uz: 'Men ham gapira olaman', ex_ru: 'Я тоже умею говорить' },
                { combo: '也 + 想', ex: '我也想去', ex_uz: 'Men ham bormoqchiman', ex_ru: 'Я тоже хочу пойти' },
              ].map((r, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #f0f0f3' : 'none', alignItems: 'center' }}>
                  <span style={{ minWidth: 60, background: '#f5f5f8', borderRadius: 4, padding: '2px 6px', textAlign: 'center', fontSize: '0.85em', fontWeight: 700, color: '#dc2626' }}>{r.combo}</span>
                  <div style={{ flex: 1, fontSize: '0.85em' }}>
                    <span className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{r.ex}</span>
                    <span className="grammar-block__usage-tr" style={{ display: 'inline', marginLeft: 6 }}>— {language === 'ru' ? r.ex_ru : r.ex_uz}</span>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {language === 'ru'
                    ? '💡 Ключ: 也 всегда стоит ПЕРВЫМ из всех наречий.'
                    : '💡 Kalit: 也 har doim boshqa ravishlardan BIRINCHI keladi.'}
                </p>
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
