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
  { id: 'omit', uz: 'Tushirish', ru: 'Пропуск', en: 'Omission' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  {
    zh: '这是我的书。',
    pinyin: 'Zhè shì wǒ de shū.',
    uz: 'Bu mening kitobim.',
    ru: 'Это моя книга.',
    note_uz: '我的 (wǒ de) = mening; 书 (shū) = kitob',
    note_ru: '我的 (wǒ de) = мой; 书 (shū) = книга',
  },
  {
    zh: '她是我的老师。',
    pinyin: 'Tā shì wǒ de lǎoshī.',
    uz: 'U mening o\'qituvchim.',
    ru: 'Она моя учительница.',
    note_uz: '老师 (lǎoshī) = o\'qituvchi',
    note_ru: '老师 (lǎoshī) = учитель',
  },
  {
    zh: '漂亮的花',
    pinyin: 'Piàoliang de huā',
    uz: 'Chiroyli gul',
    ru: 'Красивый цветок',
    note_uz: '漂亮 (piàoliang) = chiroyli; 花 (huā) = gul',
    note_ru: '漂亮 (piàoliang) = красивый; 花 (huā) = цветок',
  },
  {
    zh: '他的朋友很多。',
    pinyin: 'Tā de péngyou hěn duō.',
    uz: 'Uning do\'stlari ko\'p.',
    ru: 'У него много друзей.',
    note_uz: '朋友 (péngyou) = do\'st; 很多 (hěn duō) = ko\'p',
    note_ru: '朋友 (péngyou) = друг; 很多 (hěn duō) = много',
  },
  {
    zh: '我买的东西很便宜。',
    pinyin: 'Wǒ mǎi de dōngxi hěn piányí.',
    uz: 'Men sotib olgan narsa arzon.',
    ru: 'То, что я купил, дёшево.',
    note_uz: '买 (mǎi) = sotib olmoq; 便宜 (piányí) = arzon',
    note_ru: '买 (mǎi) = купить; 便宜 (piányí) = дёшевый',
  },
  {
    zh: '红色的苹果',
    pinyin: 'Hóngsè de píngguǒ',
    uz: 'Qizil olma',
    ru: 'Красное яблоко',
    note_uz: '红色 (hóngsè) = qizil rang; 苹果 (píngguǒ) = olma',
    note_ru: '红色 (hóngsè) = красный цвет; 苹果 (píngguǒ) = яблоко',
  },
];

const omitExamples = [
  {
    label_uz: 'Oila a\'zolari (tushirilishi mumkin)',
    label_ru: 'Члены семьи (можно пропустить)',
    with_de: '我的妈妈',
    with_de_py: 'wǒ de māma',
    without_de: '我妈妈',
    without_de_py: 'wǒ māma',
    tr_uz: 'mening onam',
    tr_ru: 'моя мама',
  },
  {
    label_uz: 'Bir bo\'g\'inli sifatlar (tushirilishi mumkin)',
    label_ru: 'Односложные прилагательные (можно пропустить)',
    with_de: '大的书',
    with_de_py: 'dà de shū',
    without_de: '大书',
    without_de_py: 'dà shū',
    tr_uz: 'katta kitob',
    tr_ru: 'большая книга',
  },
  {
    label_uz: 'Ko\'p bo\'g\'inli sifatlar (tushirib bo\'lmaydi)',
    label_ru: 'Многосложные прилагательные (нельзя пропустить)',
    with_de: '漂亮的花',
    with_de_py: 'piàoliang de huā',
    without_de: '❌ 漂亮花',
    without_de_py: '',
    tr_uz: 'chiroyli gul — 的 kerak',
    tr_ru: 'красивый цветок — 的 обязательна',
  },
];

const quizQuestions = [
  {
    q_uz: '"Mening kitobim" xitoycha qanday?',
    q_ru: 'Как по-китайски "моя книга"?',
    options: ['我是书', '我的书', '我有书', '我在书'],
    correct: 1,
  },
  {
    q_uz: '的 so\'zining pinyin yozilishi?',
    q_ru: 'Как пишется пиньинь для 的?',
    options: ['dé', 'dì', 'de', 'dě'],
    correct: 2,
  },
  {
    q_uz: '"漂亮的花" tarjimasi?',
    q_ru: 'Перевод "漂亮的花"?',
    options_uz: ['Chiroyli gul', 'Katta daraxt', 'Qizil kitob', 'Mening uyim'],
    options_ru: ['Красивый цветок', 'Большое дерево', 'Красная книга', 'Мой дом'],
    correct: 0,
  },
  {
    q_uz: 'Qaysi gapda 的 tushirilishi mumkin?',
    q_ru: 'В каком случае можно пропустить 的?',
    options_uz: ['漂亮的花', '我的妈妈', 'Ikkalasida ham', 'Hech birida ham'],
    options_ru: ['漂亮的花', '我的妈妈', 'В обоих случаях', 'Ни в одном'],
    correct: 1,
  },
  {
    q_uz: '的 qaysi bo\'lakni bog\'laydi?',
    q_ru: 'Что связывает 的?',
    options_uz: [
      'Fe\'l + egalik',
      'Sifat/egalik + ot',
      'Ot + fe\'l',
      'Olmosh + fe\'l',
    ],
    options_ru: [
      'Глагол + принадлежность',
      'Прилагательное/принадлежность + существительное',
      'Существительное + глагол',
      'Местоимение + глагол',
    ],
    correct: 1,
  },
];

export function GrammarDePage() {
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
        <div className="grammar-page__hero-bg">的</div>
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
          <div className="grammar-page__hero-char">的</div>
          <div className="grammar-page__hero-pinyin">de</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'egalik / sifat bog\'lovchi', ru: 'egalik / sifat bog\'lovchi', en: 'egalik / sifat bog\'lovchi' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">的</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">de</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: 'neytral ton (·)', ru: 'нейтральный (·)', en: 'neytral ton (·)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'egalik / sifat bog\'lovchi', ru: 'egalik / sifat bog\'lovchi', en: 'egalik / sifat bog\'lovchi' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">8</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Ikki asosiy vazifasi', ru: 'Два основных значения', en: 'Two Main Uses' } as Record<string, string>)[language]}</div>
              {[
                {
                  type_uz: '1. Egalik — "ning"',
                  type_ru: '1. Притяжательность — "мой/твой"',
                  zh: '我<span class="grammar-block__highlight">的</span>书',
                  tr_uz: 'mening kitobim',
                  tr_ru: 'моя книга',
                },
                {
                  type_uz: '2. Sifat bog\'lovchi — "li/dagi"',
                  type_ru: '2. Атрибутивная связка — "красивый, большой"',
                  zh: '漂亮<span class="grammar-block__highlight">的</span>花',
                  tr_uz: 'chiroyli gul',
                  tr_ru: 'красивый цветок',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: item.type_uz, ru: item.type_ru, en: (item as any).type_en || item.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{({ uz: item.tr_uz, ru: item.tr_ru, en: (item as any).tr_en || item.tr_uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '是, 有, 在, 的 farqi', ru: 'Сравнение: 是, 有, 在, 的', en: '是, 有, 在, 的 farqi' } as Record<string, string>)[language]}</div>
              {[
                {
                  type_uz: '是 — tenglashtirish (A = B)',
                  type_ru: '是 — равенство (A = B)',
                  zh: '我<span class="grammar-block__highlight">是</span>学生。',
                  tr_uz: 'Men talabaman.',
                  tr_ru: 'Я студент.',
                },
                {
                  type_uz: '有 — egalik yoki mavjudlik',
                  type_ru: '有 — обладание / существование',
                  zh: '我<span class="grammar-block__highlight">有</span>书。',
                  tr_uz: 'Menda kitob bor.',
                  tr_ru: 'У меня есть книга.',
                },
                {
                  type_uz: '在 — joylashuv (qayerda?)',
                  type_ru: '在 — местонахождение (где?)',
                  zh: '我<span class="grammar-block__highlight">在</span>学校。',
                  tr_uz: 'Men maktabdaman.',
                  tr_ru: 'Я в школе.',
                },
                {
                  type_uz: '的 — egalik/sifat bog\'lovchi',
                  type_ru: '的 — притяжательность/атрибут',
                  zh: '我<span class="grammar-block__highlight">的</span>书',
                  tr_uz: 'mening kitobim',
                  tr_ru: 'моя книга',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: item.type_uz, ru: item.type_ru, en: (item as any).type_en || item.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" dangerouslySetInnerHTML={{ __html: item.zh }} />
                  <div className="grammar-block__usage-tr">{({ uz: item.tr_uz, ru: item.tr_ru, en: (item as any).tr_en || item.tr_uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Egalik (possessive)', ru: '1. Притяжательность (egalik)', en: '1. Egalik (possessive)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Egasi', ru: 'Владелец', en: 'Owner' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">的</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Narsa', ru: 'Предмет', en: 'Object' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Kimningdir narsasi, joyi yoki munosabatini bildiradi', ru: 'Показывает принадлежность: чья-то вещь, место или отношение', en: 'Kimningdir narsasi, joyi yoki munosabatini bildiradi' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh">这是<span className="grammar-block__highlight">我的</span>书包。</div>
                <div className="grammar-block__usage-py">Zhè shì wǒ de shūbāo.</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Bu mening sumkam.', ru: 'Это мой рюкзак.', en: 'Bu mening sumkam.' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Sifat bog\'lovchi (sifat + ot)', ru: '2. Атрибутивная связка (sifat + ot)', en: '2. Sifat bog\'lovchi (sifat + ot)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Sifat', ru: 'Прилагательное', en: 'Adjective' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-verb">的</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Существительное', en: 'Noun' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Ko\'p bo\'g\'inli sifatlar otdan oldin 的 talab qiladi', ru: 'Многосложные прилагательные требуют 的 перед существительным', en: 'Ko\'p bo\'g\'inli sifatlar otdan oldin 的 talab qiladi' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ marginTop: 10 }}>
                <div className="grammar-block__usage-zh"><span className="grammar-block__highlight">漂亮的</span>花</div>
                <div className="grammar-block__usage-py">piàoliang de huā</div>
                <div className="grammar-block__usage-tr">{({ uz: 'chiroyli gul', ru: 'красивый цветок', en: 'chiroyli gul' } as Record<string, string>)[language]}</div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Kishilik olmoshlari + 的', ru: 'Личные местоимения + 的', en: 'Kishilik olmoshlari + 的' } as Record<string, string>)[language]}</div>
              {[
                { pronoun: '我的', pinyin: 'wǒ de', uz: 'mening', ru: 'мой/моя/моё' },
                { pronoun: '你的', pinyin: 'nǐ de', uz: 'sening', ru: 'твой/твоя/твоё' },
                { pronoun: '他/她的', pinyin: 'tā de', uz: 'uning', ru: 'его/её' },
                { pronoun: '我们的', pinyin: 'wǒmen de', uz: 'bizning', ru: 'наш/наша' },
                { pronoun: '你们的', pinyin: 'nǐmen de', uz: 'sizlarning', ru: 'ваш/ваша' },
                { pronoun: '他们的', pinyin: 'tāmen de', uz: 'ularning', ru: 'их' },
              ].map((w, i) => (
                <div key={i} className="grammar-block__info-row">
                  <span className="grammar-block__usage-zh" style={{ minWidth: 64 }}>{w.pronoun}</span>
                  <span className="grammar-block__usage-py" style={{ minWidth: 80 }}>{w.pinyin}</span>
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

        {activeTab === 'omit' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Qachon 的 ni tushirish mumkin?', ru: 'Когда можно пропустить 的?', en: 'Qachon 的 ni tushirish mumkin?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__formula-desc">
                {({ uz: 'Yaqin munosabatlar (oila) va bir bo\'g\'inli sifatlarda 的 tushirilishi mumkin', ru: '的 можно опустить в близких отношениях (семья) и с односложными прилагательными', en: 'Yaqin munosabatlar (oila) va bir bo\'g\'inli sifatlarda 的 tushirilishi mumkin' } as Record<string, string>)[language]}
              </p>
            </div>

            {omitExamples.map((item, i) => (
              <div key={i} className="grammar-block grammar-block--tip">
                <div className="grammar-block__label">{({ uz: item.label_uz, ru: item.label_ru, en: (item as any).label_en || item.label_uz } as Record<string, string>)[language]}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                    <div className="grammar-block__usage-type">{({ uz: '的 bilan', ru: '的 с частицей', en: '的 bilan' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{item.with_de}</div>
                    {item.with_de_py && <div className="grammar-block__usage-py">{item.with_de_py}</div>}
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                    <div className="grammar-block__usage-type">{({ uz: '的 siz', ru: 'Без частицы', en: '的 siz' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{item.without_de}</div>
                    {item.without_de_py && <div className="grammar-block__usage-py">{item.without_de_py}</div>}
                  </div>
                </div>
                <div className="grammar-block__usage-tr" style={{ marginTop: 8, textAlign: 'center' }}>
                  {({ uz: item.tr_uz, ru: item.tr_ru, en: (item as any).tr_en || item.tr_uz } as Record<string, string>)[language]}
                </div>
              </div>
            ))}

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Xulosa qoida', ru: 'Итоговое правило', en: 'Xulosa qoida' } as Record<string, string>)[language]}</div>
              {[
                {
                  label_uz: '✅ Tushirish mumkin',
                  label_ru: '✅ Можно пропустить',
                  items_uz: ['Oila a\'zolari: 我妈妈, 他爸爸', 'Bir bo\'g\'inli sifat: 大书, 好人'],
                  items_ru: ['Члены семьи: 我妈妈, 他爸爸', 'Односложные прилагательные: 大书, 好人'],
                },
                {
                  label_uz: '❌ Tushirib bo\'lmaydi',
                  label_ru: '❌ Нельзя пропустить',
                  items_uz: ['Ko\'p bo\'g\'inli sifat: 漂亮的花, 高兴的人', 'Olmosh + ot (rasmiy): 我的书, 她的包'],
                  items_ru: ['Многосложные прилагательные: 漂亮的花, 高兴的人', 'Местоимение + существительное (официально): 我的书'],
                },
              ].map((rule, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-type">{({ uz: rule.label_uz, ru: rule.label_ru, en: (rule as any).label_en || rule.label_uz } as Record<string, string>)[language]}</div>
                  {(({ uz: rule.items_uz, ru: rule.items_ru, en: (rule as any).items_en || rule.items_uz } as Record<string, string[]>)[language]).map((item, j) => (
                    <div key={j} className="grammar-block__usage-zh" style={{ fontSize: '0.9em', marginTop: 4 }}>{item}</div>
                  ))}
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
