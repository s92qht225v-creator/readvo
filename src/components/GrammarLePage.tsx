'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'caution', uz: 'Diqqat', ru: 'Внимание', en: 'Caution' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我吃了。', pinyin: 'Wǒ chī le.', uz: 'Men yedim.', ru: 'Я поел.', note_uz: '吃 (chī) = yemoq → 吃了 = yedim (tugadi)', note_ru: '吃 (chī) = есть → 吃了 = поел (завершено)' },
  { zh: '他去了学校。', pinyin: 'Tā qù le xuéxiào.', uz: 'U maktabga ketdi.', ru: 'Он пошёл в школу.', note_uz: '去 (qù) = bormoq → 去了 = ketdi (ish bajarildi)', note_ru: '去 (qù) = идти → 去了 = пошёл (действие выполнено)' },
  { zh: '我买了一本书。', pinyin: 'Wǒ mǎi le yì běn shū.', uz: 'Men bitta kitob sotib oldim.', ru: 'Я купил одну книгу.', note_uz: '买 (mǎi) = sotib olmoq → 买了 + narsa = nimani oldim', note_ru: '买 (mǎi) = купить → 买了 + объект = что купил' },
  { zh: '下雨了。', pinyin: 'Xià yǔ le.', uz: 'Yomg\'ir yog\'di. / Yomg\'ir yog\'yapti.', ru: 'Пошёл дождь.', note_uz: 'Gap oxiridagi 了 = holat o\'zgardi (oldin yog\'mayotgan edi)', note_ru: '了 в конце предложения = изменение состояния (раньше не шёл)' },
  { zh: '我饿了。', pinyin: 'Wǒ è le.', uz: 'Men ochdim.', ru: 'Я проголодался.', note_uz: '饿 (è) = och → 饿了 = ochdim (holat o\'zgardi — oldin och emas edim)', note_ru: '饿 (è) = голодный → 饿了 = проголодался (изменение состояния)' },
  { zh: '她喝了咖啡。', pinyin: 'Tā hē le kāfēi.', uz: 'U qahva ichdi.', ru: 'Она выпила кофе.', note_uz: '喝 (hē) = ichmoq → 喝了 = ichdi (tugallangan harakat)', note_ru: '喝 (hē) = пить → 喝了 = выпила (завершённое действие)' },
  { zh: '我到了！', pinyin: 'Wǒ dào le!', uz: 'Men yetib keldim!', ru: 'Я приехал!', note_uz: '到 (dào) = yetib kelmoq → 到了 = yetib keldim (hozir!)', note_ru: '到 (dào) = прибыть → 到了 = приехал (сейчас!)' },
  { zh: '他们走了。', pinyin: 'Tāmen zǒu le.', uz: 'Ular ketishdi.', ru: 'Они ушли.', note_uz: '走 (zǒu) = yurmoq/ketmoq → 走了 = ketishdi', note_ru: '走 (zǒu) = уходить → 走了 = ушли' },
];

const quizQuestions = [
  {
    q_uz: '"Men yedim" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я поел"?',
    options: ['我吃的', '我吃了', '了我吃', '我了吃'],
    correct: 1,
  },
  {
    q_uz: '了 qanday o\'qiladi?',
    q_ru: 'Как читается 了?',
    options_uz: ['lè (4-ton)', 'lé (2-ton)', 'le (tonsiz)', 'lā (1-ton)'],
    options_ru: ['lè (4-й тон)', 'lé (2-й тон)', 'le (нейтральный)', 'lā (1-й тон)'],
    correct: 2,
  },
  {
    q_uz: '"Yomg\'ir yog\'di" xitoycha?',
    q_ru: 'Как по-китайски "Пошёл дождь"?',
    options: ['了下雨', '下了雨', '下雨了', '雨下了的'],
    correct: 2,
  },
  {
    q_uz: 'Qaysi gapda 了 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 了 использован ПРАВИЛЬНО?',
    options: ['我了去学校', '我去了学校', '了我去学校', '我去学校的了'],
    correct: 1,
  },
  {
    q_uz: '"Men ochdim" qanday aytiladi?',
    q_ru: 'Как сказать "Я проголодался"?',
    options: ['我饿的', '我不饿了', '我饿了', '了我饿'],
    correct: 2,
  },
  {
    q_uz: '了 nimani bildiradi?',
    q_ru: 'Что означает 了?',
    options_uz: ['Savol', 'Egalik', 'Tugallangan ish / o\'zgarish', 'Inkor'],
    options_ru: ['Вопрос', 'Принадлежность', 'Завершённое действие / изменение', 'Отрицание'],
    correct: 2,
  },
];

export function GrammarLePage() {
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
        <div className="grammar-page__hero-bg">了</div>
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
          <div className="grammar-page__hero-char">了</div>
          <div className="grammar-page__hero-pinyin">le</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'tugallash / holat o\'zgardi', ru: 'завершение / изменение состояния', en: 'tugallash / holat o\'zgardi' } as Record<string, string>)[language]} —</div>
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

        {/* ── INTRO ── */}
        {activeTab === 'intro' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ieroglif', ru: 'Иероглиф', en: 'Character' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">了</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">le</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: 'Tonsiz (yengil, qisqa)', ru: 'Нейтральный (лёгкий, короткий)', en: 'Tonsiz (yengil, qisqa)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: '-dim, -di, bo\'ldi', ru: 'завершил / изменилось', en: '-dim, -di, bo\'ldi' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">2</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'Xitoy tilida fe\'llar o\'zgarmaydi — «yemoq» har doim 吃 (chī). «Yedim» demoq uchun 了 qo\'shiladi:', ru: 'В китайском глаголы не изменяются — «есть» всегда 吃 (chī). Чтобы сказать «поел», добавляют 了:', en: 'Xitoy tilida fe\'llar o\'zgarmaydi — «yemoq» har doim 吃 (chī). «Yedim» demoq uchun 了 qo\'shiladi:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  我吃 → 我吃<span className="grammar-block__highlight">了</span>
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'men yeyapman → men yedim', ru: 'я ем → я поел', en: 'men yeyapman → men yedim' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '了 ning 2 asosiy vazifasi', ru: '2 основных функции 了', en: '了 ning 2 asosiy vazifasi' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Ish tugadi', ru: 'Ish tugadi', en: 'Ish tugadi' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我吃<span className="grammar-block__highlight">了</span></div>
                  <div className="grammar-block__usage-tr">{({ uz: 'men yedim', ru: 'я поел', en: 'men yedim' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-py" style={{ fontSize: '0.7em' }}>{({ uz: 'Fe\'l + 了', ru: 'Глагол + 了', en: 'Fe\'l + 了' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Holat o\'zgardi', ru: 'Состояние изменилось', en: 'Holat o\'zgardi' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">下雨<span className="grammar-block__highlight">了</span></div>
                  <div className="grammar-block__usage-tr">{({ uz: 'yomg\'ir yog\'di', ru: 'пошёл дождь', en: 'yomg\'ir yog\'di' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-py" style={{ fontSize: '0.7em' }}>{({ uz: 'Gap oxiri + 了', ru: 'Конец предл. + 了', en: 'Gap oxiri + 了' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Oddiy tushuncha', ru: 'Простое понятие', en: 'Oddiy tushuncha' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '了 = «bo\'ldi!» — ish bajarildi yoki holat o\'zgardi. Har ikkala holatda 了 ishlatiladi.', ru: '了 = «всё!» — действие выполнено или состояние изменилось. В обоих случаях используется 了.', en: '了 = «bo\'ldi!» — ish bajarildi yoki holat o\'zgardi. Har ikkala holatda 了 ishlatiladi.' } as Record<string, string>)[language]}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Fe\'l + 了 (ish tugadi)', ru: '1. Глагол + 了 (действие завершено)', en: '1. Fe\'l + 了 (ish tugadi)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">了</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«...dim, ...di»', ru: '«...сделал, ...пошёл»', en: '«...dim, ...di»' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我吃了。', py: 'Wǒ chī le.', uz: 'Men yedim.', ru: 'Я поел.' },
                { zh: '他走了。', py: 'Tā zǒu le.', uz: 'U ketdi.', ru: 'Он ушёл.' },
                { zh: '她睡了。', py: 'Tā shuì le.', uz: 'U uxladi.', ru: 'Она уснула.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Fe\'l + 了 + Ob\'yekt (nimani qildim)', ru: '2. Глагол + 了 + Объект (что сделал)', en: '2. Fe\'l + 了 + Ob\'yekt (nimani qildim)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">了</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ob\'yekt', ru: 'Объект', en: 'Ob\'yekt' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Ob\'yekt bor bo\'lsa — 了 fe\'l va ob\'yekt orasiga tushadi', ru: 'Объект после 了 — обычно с количеством или конкретный', en: 'Ob\'yekt bor bo\'lsa — 了 fe\'l va ob\'yekt orasiga tushadi' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我买了一本书。', py: 'Wǒ mǎi le yì běn shū.', uz: 'Men bitta kitob sotib oldim.', ru: 'Я купил одну книгу.' },
                { zh: '她喝了咖啡。', py: 'Tā hē le kāfēi.', uz: 'U qahva ichdi.', ru: 'Она выпила кофе.' },
                { zh: '我们看了电影。', py: 'Wǒmen kàn le diànyǐng.', uz: 'Biz kino ko\'rdik.', ru: 'Мы посмотрели фильм.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Ob\'yekt bor bo\'lganda ko\'pincha miqdor (一本, 两杯) yoki aniq narsa aytiladi.', ru: '💡 С объектом обычно указывается количество (一本, 两杯) или конкретная вещь.', en: '💡 Ob\'yekt bor bo\'lganda ko\'pincha miqdor (一本, 两杯) yoki aniq narsa aytiladi.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. Gap oxiri + 了 (holat o\'zgardi)', ru: '3. Конец предложения + 了 (изменение состояния)', en: '3. Gap oxiri + 了 (holat o\'zgardi)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Gap', ru: 'Фраза', en: 'Phrase' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">了</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Yangi holat — oldin bunday emas edi', ru: 'Новое состояние — раньше так не было', en: 'Yangi holat — oldin bunday emas edi' } as Record<string, string>)[language]}</p>
              {[
                { zh: '下雨了。', py: 'Xià yǔ le.', uz: 'Yomg\'ir yog\'di. (oldin yog\'mayotgan edi)', ru: 'Пошёл дождь. (раньше не шёл)' },
                { zh: '我饿了。', py: 'Wǒ è le.', uz: 'Men ochdim. (oldin och emas edim)', ru: 'Я проголодался. (раньше не был голоден)' },
                { zh: '天冷了。', py: 'Tiān lěng le.', uz: 'Havo sovidi. (oldin sovuq emas edi)', ru: 'Похолодало. (раньше не было холодно)' },
                { zh: '他高了。', py: 'Tā gāo le.', uz: 'U o\'sdi. (oldin past edi)', ru: 'Он вырос. (раньше был ниже)' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Kalit: Bu 了 = «endi boshqacha bo\'ldi». Oldingi holat bilan hozirgi holat farq qiladi.', ru: '💡 Ключ: это 了 = «теперь по-другому». Предыдущее и текущее состояния отличаются.', en: '💡 Kalit: Bu 了 = «endi boshqacha bo\'ldi». Oldingi holat bilan hozirgi holat farq qiladi.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. 太...了 (juda ...!)', ru: '4. 太...了 (очень ...!)', en: '4. 太...了 (juda ...!)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-neg">太</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">了</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«Juda ...!» — kuchli his-tuyg\'u', ru: '«Слишком ...! Очень ...!» — сильное чувство', en: '«Juda ...!» — kuchli his-tuyg\'u' } as Record<string, string>)[language]}</p>
              {[
                { zh: '太好了！', py: 'Tài hǎo le!', uz: 'Juda yaxshi! Ajoyib!', ru: 'Отлично! Замечательно!' },
                { zh: '太贵了！', py: 'Tài guì le!', uz: 'Juda qimmat!', ru: 'Слишком дорого!' },
                { zh: '太冷了！', py: 'Tài lěng le!', uz: 'Juda sovuq!', ru: 'Очень холодно!' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
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

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Kechki ovqat', ru: 'Мини-диалог 1: Ужин', en: 'Mini dialog 1: Kechki ovqat' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你吃了吗？', py: 'Nǐ chī le ma?', uz: 'Ovqat yedingmi?', ru: 'Ты поел?' },
                  { speaker: 'B', zh: '吃了。我吃了米饭。你呢？', py: 'Chī le. Wǒ chī le mǐfàn. Nǐ ne?', uz: 'Yedim. Guruch yedim. Senchi?', ru: 'Поел. Я поел рис. А ты?' },
                  { speaker: 'A', zh: '我还没吃。我饿了！', py: 'Wǒ hái méi chī. Wǒ è le!', uz: 'Men hali yemadim. Ochdim!', ru: 'Я ещё не ел. Я проголодался!' },
                  { speaker: 'B', zh: '我们去饭店吧！', py: 'Wǒmen qù fàndiàn ba!', uz: 'Oshxonaga boraylik!', ru: 'Пойдём в ресторан!' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Ob-havo', ru: 'Мини-диалог 2: Погода', en: 'Mini dialog 2: Ob-havo' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '下雨了！', py: 'Xià yǔ le!', uz: 'Yomg\'ir yog\'di!', ru: 'Пошёл дождь!' },
                  { speaker: 'B', zh: '太冷了！你有伞吗？', py: 'Tài lěng le! Nǐ yǒu sǎn ma?', uz: 'Juda sovuq! Soyaboning bormi?', ru: 'Очень холодно! У тебя есть зонтик?' },
                  { speaker: 'A', zh: '没有。我忘了带伞。', py: 'Méiyǒu. Wǒ wàng le dài sǎn.', uz: 'Yo\'q. Soyabon olishni unutdim.', ru: 'Нет. Я забыл взять зонт.' },
                  { speaker: 'B', zh: '没关系，我买了两把。', py: 'Méi guānxi, wǒ mǎi le liǎng bǎ.', uz: 'Hech gap emas, men ikkita sotib olganman.', ru: 'Ничего страшного, я купил два.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#2563eb' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── CAUTION ── */}
        {activeTab === 'caution' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '了 qo\'yish o\'rni', ru: 'Позиция 了', en: '了 qo\'yish o\'rni' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {({ uz: '了 ning o\'rni ikki xil. HSK 1 da asosan shu ikkitasini bilish kerak:', ru: '了 бывает двух видов. Для HSK 1 достаточно знать эти два:', en: '了 ning o\'rni ikki xil. HSK 1 da asosan shu ikkitasini bilish kerak:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Fe\'ldan keyin', ru: 'После глагола', en: 'Fe\'ldan keyin' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: '#dc2626' }}>吃</span><span className="grammar-block__highlight">了</span>饭</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Ish tugadi', ru: 'Действие завершено', en: 'Ish tugadi' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Gap oxirida', ru: 'В конце предл.', en: 'Gap oxirida' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">下雨<span className="grammar-block__highlight">了</span></div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Holat o\'zgardi', ru: 'Состояние изменилось', en: 'Holat o\'zgardi' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">⚠️ {({ uz: '了 ishlatilMAYDI:', ru: '了 НЕ используется:', en: '了 ishlatilMAYDI:' } as Record<string, string>)[language]}</div>
              {[
                {
                  wrong: '我昨天不吃了饭。',
                  right: '我昨天没吃饭。',
                  rule_uz: 'O\'tgan zamonda inkor = 没, 不了 emas!',
                  rule_ru: 'Отрицание в прошедшем = 没, не 不了!',
                  tag: '不 + 了',
                },
                {
                  wrong: '我每天吃了早饭。',
                  right: '我每天吃早饭。',
                  rule_uz: 'Har kungi odat — 了 kerak emas',
                  rule_ru: 'Ежедневная привычка — 了 не нужен',
                  tag: ({ uz: 'Odat', ru: 'Привычка', en: 'Odat' } as Record<string, string>)[language],
                },
                {
                  wrong: '我喜欢了他。',
                  right: '我喜欢他。',
                  rule_uz: 'His-tuyg\'u fe\'llari (喜欢, 想, 知道) bilan 了 kam ishlatiladi',
                  rule_ru: 'Глаголы чувств (喜欢, 想, 知道) редко используются с 了',
                  tag: ({ uz: 'His', ru: 'Чувства', en: 'His' } as Record<string, string>)[language],
                },
              ].map((ex, i) => (
                <div key={i} className="grammar-block grammar-block--tip" style={{ marginBottom: 8 }}>
                  <div style={{
                    fontSize: '0.65em', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                    color: '#d97706', marginBottom: 6,
                  }}>{ex.tag}</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                      <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {({ uz: 'XATO', ru: 'НЕВЕРНО', en: 'WRONG' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>{ex.wrong}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh">{ex.right}</div>
                    </div>
                  </div>
                  <p className="grammar-block__tip-text" style={{ fontStyle: 'italic' }}>{({ uz: ex.rule_uz, ru: ex.rule_ru, en: (ex as any).rule_en || ex.rule_uz } as Record<string, string>)[language]}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '吃了吗？ — savol shakli', ru: '吃了吗？ — форма вопроса', en: '吃了吗？ — savol shakli' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: '了 bilan savol berish uchun gapning oxiriga 吗 qo\'shing. Inkor javob uchun 还没 (hali ...magan) ishlating:', ru: 'Для вопроса с 了 добавьте 吗 в конец. Для отрицательного ответа используйте 还没 (ещё не):', en: '了 bilan savol berish uchun gapning oxiriga 吗 qo\'shing. Inkor javob uchun 还没 (hali ...magan) ishlating:' } as Record<string, string>)[language]}
              </p>
              {[
                { q: '你吃了吗？', q_uz: 'Yedingmi?', q_ru: 'Ты поел?', yes: '吃了。', yes_uz: 'Yedim.', yes_ru: 'Поел.', no: '还没吃。', no_uz: 'Hali yemadim.', no_ru: 'Ещё не ел.' },
                { q: '你买了吗？', q_uz: 'Sotib oldingmi?', q_ru: 'Ты купил?', yes: '买了。', yes_uz: 'Sotib oldim.', yes_ru: 'Купил.', no: '还没买。', no_uz: 'Hali olmadim.', no_ru: 'Ещё не купил.' },
                { q: '他走了吗？', q_uz: 'U ketdimi?', q_ru: 'Он ушёл?', yes: '走了。', yes_uz: 'Ketdi.', yes_ru: 'Ушёл.', no: '还没走。', no_uz: 'Hali ketmadi.', no_ru: 'Ещё не ушёл.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8 }}>
                  <div className="grammar-block__usage-zh" style={{ color: '#dc2626', marginBottom: 6 }}>
                    {x.q} <span className="grammar-block__usage-tr" style={{ display: 'inline' }}>({({ uz: x.q_uz, ru: x.q_ru, en: (x as any).q_en || x.q_uz } as Record<string, string>)[language]})</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'HA', ru: 'ДА', en: 'YES' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh">{x.yes}</div>
                      <div className="grammar-block__usage-tr">{({ uz: x.yes_uz, ru: x.yes_ru, en: (x as any).yes_en || x.yes_uz } as Record<string, string>)[language]}</div>
                    </div>
                    <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#dc2626', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'HALI YO\'Q', ru: 'ЕЩЁ НЕТ', en: 'HALI YO\'Q' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh">{x.no}</div>
                      <div className="grammar-block__usage-tr">{({ uz: x.no_uz, ru: x.no_ru, en: (x as any).no_en || x.no_uz } as Record<string, string>)[language]}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ <strong>{({ uz: 'Inkor javobda 了 ishlatilmaydi!', ru: 'В отрицательном ответе 了 НЕ используется!', en: 'Inkor javobda 了 ishlatilmaydi!' } as Record<string, string>)[language]}</strong>
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">
                    <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>我不吃了。</span>
                    {' ✗ → '}
                    <span style={{ color: '#16a34a' }}>还没吃。</span>
                    {' ✓'}
                  </div>
                </div>
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
