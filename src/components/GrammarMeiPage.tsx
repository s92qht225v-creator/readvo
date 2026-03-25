'use client';

/** Safely render Chinese text with <span> highlights as React elements */
function renderZh(html: string) {
  const parts = html.split(/(<span[^>]*>[^<]*<\/span>)/);
  return parts.map((part, i) => {
    const match = part.match(/<span\s+(?:class="([^"]*)"|style="([^"]*)")>([^<]*)<\/span>/);
    if (match) {
      const [, className, style, text] = match;
      if (className) return <span key={i} className={className}>{text}</span>;
      if (style) {
        const styleObj: Record<string, string> = {};
        style.split(';').forEach(s => { const [k, v] = s.split(':'); if (k && v) styleObj[k.trim()] = v.trim(); });
        return <span key={i} style={styleObj}>{text}</span>;
      }
    }
    return part;
  });
}

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const COLOR = '#dc2626';
const COLOR_DARK = '#b91c1c';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение', en: 'Comparison' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  {
    zh: '我没吃饭。',
    pinyin: 'Wǒ méi chī fàn.',
    uz: 'Men ovqat yemadim.',
    ru: 'Я не ел.',
    en: 'I didn\'t eat.',
    note_uz: '没 + 吃 = yemadim (o\'tmishda bo\'lmagan harakat). 了 ishlatilMAYDI!',
    note_ru: '没 + 吃 = не ел (действие не состоялось в прошлом). 了 НЕ используется!',
    note_en: '没 + 吃 = didn\'t eat (action didn\'t happen in the past). 了 is NOT used!',
  },
  {
    zh: '他没来。',
    pinyin: 'Tā méi lái.',
    uz: 'U kelmadi.',
    ru: 'Он не пришёл.',
    en: 'He didn\'t come.',
    note_uz: '没 + 来 = kelmadi → 了 ishlatilMAYDI!',
    note_ru: '没 + 来 = не пришёл → 了 НЕ ставится!',
    note_en: '没 + 来 = didn\'t come → 了 is NOT used!',
  },
  {
    zh: '我没有钱。',
    pinyin: 'Wǒ méiyǒu qián.',
    uz: 'Menda pul yo\'q.',
    ru: 'У меня нет денег.',
    en: 'I don\'t have money.',
    note_uz: '没有 = yo\'q (egalik inkori). Noto\'g\'ri: ~~不有~~',
    note_ru: '没有 = нет (отрицание наличия). Нельзя: ~~不有~~',
    note_en: '没有 = don\'t have (negation of possession). Wrong: ~~不有~~',
  },
  {
    zh: '他没有车。',
    pinyin: 'Tā méiyǒu chē.',
    uz: 'Uning mashinasi yo\'q.',
    ru: 'У него нет машины.',
    en: 'He doesn\'t have a car.',
    note_uz: '没有 + ot = ...yo\'q (biror narsa mavjud emas)',
    note_ru: '没有 + существительное = нет чего-то (не существует)',
    note_en: '没有 + noun = don\'t have something (doesn\'t exist)',
  },
  {
    zh: '我没去过中国。',
    pinyin: 'Wǒ méi qù guo Zhōngguó.',
    uz: 'Men Xitoyga borganim yo\'q.',
    ru: 'Я ни разу не был в Китае.',
    en: 'I\'ve never been to China.',
    note_uz: '没 + 去过 = borganim yo\'q (tajriba inkori)',
    note_ru: '没 + 去过 = ни разу не был (отрицание опыта)',
    note_en: '没 + 去过 = have never been (negation of experience)',
  },
  {
    zh: '今天没下雨。',
    pinyin: 'Jīntiān méi xià yǔ.',
    uz: 'Bugun yomg\'ir yog\'madi.',
    ru: 'Сегодня не было дождя.',
    en: 'It didn\'t rain today.',
    note_uz: '没 + 下雨 = yog\'madi (hodisa bo\'lmadi)',
    note_ru: '没 + 下雨 = не было дождя (событие не произошло)',
    note_en: '没 + 下雨 = didn\'t rain (event didn\'t happen)',
  },
  {
    zh: '她没说什么。',
    pinyin: 'Tā méi shuō shénme.',
    uz: 'U hech narsa demadi.',
    ru: 'Она ничего не сказала.',
    en: 'She didn\'t say anything.',
    note_uz: '没 + 说 = demadi. 什么 = hech narsa (inkor bilan)',
    note_ru: '没 + 说 = не сказала. 什么 = ничего (в отрицании)',
    note_en: '没 + 说 = didn\'t say. 什么 = anything (in negation)',
  },
  {
    zh: '我们没有时间。',
    pinyin: 'Wǒmen méiyǒu shíjiān.',
    uz: 'Bizda vaqt yo\'q.',
    ru: 'У нас нет времени.',
    en: 'We don\'t have time.',
    note_uz: '没有 + 时间 = vaqt yo\'q (mavjud emas)',
    note_ru: '没有 + 时间 = нет времени (не существует)',
    note_en: '没有 + 时间 = don\'t have time (doesn\'t exist)',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men ovqat yemadim" qanday?',
    q_ru: 'Как сказать "Я не ел"?',
    q_en: 'How do you say "I didn\'t eat"?',
    options: ['我不吃饭', '我没吃饭', '我吃没饭', '没我吃饭'],
    correct: 1,
  },
  {
    q_uz: '没 va 不 ning asosiy farqi nima?',
    q_ru: 'В чём основная разница между 没 и 不?',
    q_en: 'What is the main difference between 没 and 不?',
    options_uz: ['Farqi yo\'q', '没=o\'tmish/fakt, 不=odatiy/xohish', '没=kelajak, 不=o\'tmish', '没=ijobiy, 不=inkor'],
    options_ru: ['Нет разницы', '没=прошлое/факт, 不=привычка/желание', '没=будущее, 不=прошлое', '没=утверждение, 不=отрицание'],
    options_en: ['No difference', '没=past/fact, 不=habit/desire', '没=future, 不=past', '没=affirmative, 不=negative'],
    correct: 1,
  },
  {
    q_uz: '"Menda pul yo\'q" qanday?',
    q_ru: 'Как сказать "У меня нет денег"?',
    q_en: 'How do you say "I don\'t have money"?',
    options: ['我不有钱', '我没钱有', '我没有钱', '没我有钱'],
    correct: 2,
  },
  {
    q_uz: '没 qanday o\'qiladi?',
    q_ru: 'Как читается 没?',
    q_en: 'How is 没 pronounced?',
    options_uz: ['méi (2-ton)', 'měi (3-ton)', 'mèi (4-ton)', 'mēi (1-ton)'],
    options_ru: ['méi (2-й тон)', 'měi (3-й тон)', 'mèi (4-й тон)', 'mēi (1-й тон)'],
    options_en: ['méi (2nd tone)', 'měi (3rd tone)', 'mèi (4th tone)', 'mēi (1st tone)'],
    correct: 0,
  },
  {
    q_uz: '没 + fe\'l gapda 了 ishlatiladi-mi?',
    q_ru: 'Используется ли 了 в предложении с 没 + глагол?',
    q_en: 'Is 了 used in sentences with 没 + verb?',
    options_uz: ['Ha, har doim', 'Yo\'q, hech qachon', 'Faqat savol gapda', 'Faqat sifat bilan'],
    options_ru: ['Да, всегда', 'Нет, никогда', 'Только в вопросе', 'Только с прилагательным'],
    options_en: ['Yes, always', 'No, never', 'Only in questions', 'Only with adjectives'],
    correct: 1,
  },
  {
    q_uz: '"U kelmadi" qanday?',
    q_ru: 'Как сказать "Он не пришёл"?',
    q_en: 'How do you say "He didn\'t come"?',
    options: ['他不来', '他没来了', '他没来', '他来没'],
    correct: 2,
  },
];

export function GrammarMeiPage() {
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
      <div className="dr-hero">
        <div className="dr-hero__watermark">没</div>
        <div className="dr-hero__top-row">
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
        </div>
        <div className="dr-hero__body">
          <div className="dr-hero__level">HSK 1 · {({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</div>
          <h1 className="dr-hero__title">没</h1>
          <div className="dr-hero__pinyin">méi</div>
          <div className="dr-hero__translation">— {({ uz: '...madim / yo\'q', ru: 'не (прошлое) / нет', en: 'did not / don\'t have' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char" style={{ color: COLOR }}>没</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">méi</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '2-ton (pastdan yuqoriga ↗)', ru: '2-й тон (вверх ↗)', en: '2nd tone (rising ↗)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: '...madim (o\'tmish); yo\'q (mavjud emas)', ru: 'не (прошлое/факт); нет (отсутствие)', en: 'did not (past); don\'t have (absence)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">7</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Turi', ru: 'Тип слова', en: 'Word Type' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'Inkor ravishi / Fe\'l', ru: 'Отрицательная частица / Глагол', en: 'Negative adverb / Verb' } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Ikki xitoy inkori', ru: 'Два отрицания китайского', en: 'Two Chinese negations' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '没 — xitoy tilining ikkinchi inkor so\'zi. 不 bilan juft:', ru: '没 — второе отрицание китайского языка. В паре с 不:', en: '没 — the second negation word in Chinese. Used in pair with 不:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>没</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{({ uz: 'FAKT / O\'TMISH', ru: 'ФАКТ / ПРОШЛОЕ', en: 'FACT / PAST' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: '...madim\n...yo\'q', ru: '...не делал\n...нет', en: 'didn\'t do\n...don\'t have' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '1.8em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>不</div>
                  <div style={{ fontSize: '0.7em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{({ uz: 'ODATIY / XOHISH', ru: 'ПРИВЫЧКА / ЖЕЛАНИЕ', en: 'HABIT / DESIRE' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: '...mayman\n...xohlamayman', ru: '...не делаю\n...не хочу', en: 'don\'t do\n...don\'t want' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{({ uz: '⚠️ Muhim qoida: 没 + fe\'l → 了 tushadi!', ru: '⚠️ Важное правило: 没 + глагол → без 了!', en: '⚠️ Important rule: 没 + verb → drop 了!' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: '没 ishlatilganda 了 hech qachon qo\'yilmaydi:', ru: 'Когда используется 没, частица 了 не ставится:', en: 'When 没 is used, 了 is never added:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR }}>没</span>吃饭。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'Men yemadim.', ru: 'Я не ел.', en: 'I didn\'t eat.' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'XATO', ru: 'НЕВЕРНО', en: 'WRONG' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>我没吃<span style={{ color: '#ef4444' }}>了</span>饭。</div>
                  <div className="grammar-block__usage-tr">{({ uz: '没 va 了 birga bo\'lmaydi!', ru: '没 и 了 вместе не ставятся!', en: '没 and 了 cannot be used together!' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '没 ning 2 asosiy vazifasi', ru: '2 главных применения 没', en: '2 main uses of 没' } as Record<string, string>)[language]}</div>
              {[
                {
                  num: '1', color: COLOR,
                  title_uz: '没 + Fe\'l = ...madim',
                  title_ru: '没 + Глагол = не делал',
                  title_en: '没 + Verb = didn\'t do',
                  zh: '我<span style="color:' + COLOR + '">没</span>去。',
                  uz: 'Men bormadim.',
                  ru: 'Я не ходил.',
                  en: 'I didn\'t go.',
                },
                {
                  num: '2', color: COLOR_DARK,
                  title_uz: '没有 + Ot = ...yo\'q',
                  title_ru: '没有 + Сущ. = нет чего-то',
                  title_en: '没有 + Noun = don\'t have',
                  zh: '我<span style="color:' + COLOR_DARK + '">没有</span>钱。',
                  uz: 'Menda pul yo\'q.',
                  ru: 'У меня нет денег.',
                  en: 'I don\'t have money.',
                },
              ].map((item, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 8, borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 700, color: item.color, marginBottom: 4 }}>
                    {item.num}. {({ uz: item.title_uz, ru: item.title_ru, en: (item as any).title_en || item.title_uz } as Record<string, string>)[language]}
                  </div>
                  <div className="grammar-block__usage-zh">{renderZh(item.zh)}</div>
                  <div className="grammar-block__usage-tr">{({ uz: item.uz, ru: item.ru, en: (item as any).en || item.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. 没 + Fe\'l = ...madim (o\'tmish)', ru: '1. 没 + Глагол = не делал (прошлое)', en: '1. 没 + Verb = didn\'t (past action)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>没</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l (+ To\'ldiruvchi)', ru: 'Глагол (+ Объект)', en: 'Verb (+ Object)' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'O\'tmishda bo\'lmagan harakat', ru: 'Действие не состоялось в прошлом', en: 'Action that didn\'t happen in the past' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我没吃饭。', py: 'Wǒ méi chī fàn.', uz: 'Men ovqat yemadim.', ru: 'Я не ел.', en: 'I didn\'t eat.' },
                { zh: '他没来。', py: 'Tā méi lái.', uz: 'U kelmadi.', ru: 'Он не пришёл.', en: 'He didn\'t come.' },
                { zh: '我没看电影。', py: 'Wǒ méi kàn diànyǐng.', uz: 'Men kino ko\'rmadim.', ru: 'Я не смотрел кино.', en: 'I didn\'t watch the movie.' },
                { zh: '她没说。', py: 'Tā méi shuō.', uz: 'U demadi.', ru: 'Она не сказала.', en: 'She didn\'t say.' },
                { zh: '我们没去学校。', py: 'Wǒmen méi qù xuéxiào.', uz: 'Biz maktabga bormadik.', ru: 'Мы не ходили в школу.', en: 'We didn\'t go to school.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'O\'zbek tilidagi «-madim / -madi» = xitoycha 没 + fe\'l. 了 qo\'ymang!', ru: 'В узбекском «-мадим / -мади» = по-китайски 没 + глагол. 了 не добавляется!', en: 'English "didn\'t + verb" = Chinese 没 + verb. Don\'t add 了!' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. 没有 + Ot = ...yo\'q (egalik inkori)', ru: '2. 没有 + Сущ. = нет чего-то', en: '2. 没有 + Noun = don\'t have (negation of possession)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>没有</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Существительное', en: 'Noun' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Biror narsa mavjud emas / yo\'q', ru: 'Что-то не существует / отсутствует', en: 'Something doesn\'t exist / is absent' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我没有钱。', py: 'Wǒ méiyǒu qián.', uz: 'Menda pul yo\'q.', ru: 'У меня нет денег.', en: 'I don\'t have money.' },
                { zh: '他没有车。', py: 'Tā méiyǒu chē.', uz: 'Uning mashinasi yo\'q.', ru: 'У него нет машины.', en: 'He doesn\'t have a car.' },
                { zh: '我们没有时间。', py: 'Wǒmen méiyǒu shíjiān.', uz: 'Bizda vaqt yo\'q.', ru: 'У нас нет времени.', en: 'We don\'t have time.' },
                { zh: '这里没有人。', py: 'Zhèlǐ méiyǒu rén.', uz: 'Bu yerda hech kim yo\'q.', ru: 'Здесь никого нет.', en: 'There\'s nobody here.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{({ uz: 'Eslab qoling:', ru: 'Запомните:', en: 'Remember:' } as Record<string, string>)[language]}</strong>{' '}
                  {({ uz: '有 (bor) ning inkori FAQAT 没有. ~~不有~~ deb bo\'lmaydi!', ru: '有 (есть) отрицается ТОЛЬКО через 没有. Нельзя сказать ~~不有~~!', en: '有 (to have) is ONLY negated with 没有. You cannot say ~~不有~~!' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. 没有 → 没 (qisqarishi)', ru: '3. 没有 → 没 (сокращение)', en: '3. 没有 → 没 (abbreviation)' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: 'Og\'zaki nutqda 没有 ko\'pincha 没 ga qisqaradi:', ru: 'В разговорной речи 没有 часто сокращается до 没:', en: 'In spoken Chinese, 没有 is often shortened to 没:' } as Record<string, string>)[language]}
              </p>
              {[
                { full: '我没有钱。', short: '我没钱。', uz: 'Menda pul yo\'q.', ru: 'У меня нет денег.' },
                { full: '他没有时间。', short: '他没时间。', uz: 'Uning vaqti yo\'q.', ru: 'У него нет времени.' },
                { full: '这里没有水。', short: '这里没水。', uz: 'Bu yerda suv yo\'q.', ru: 'Здесь нет воды.' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f5f8' }}>
                    <div style={{ fontSize: '0.65em', color: '#888', fontWeight: 700, marginBottom: 2 }}>{({ uz: 'TO\'LIQ', ru: 'ПОЛНАЯ ФОРМА', en: 'FULL FORM' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.full}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 2 }}>{({ uz: 'QISQA', ru: 'КРАТКАЯ ФОРМА', en: 'SHORT FORM' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.short}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block__usage-tr" style={{ marginTop: 4 }}>{({ uz: 'Ikkalasi ham to\'g\'ri — qisqasi ko\'proq og\'zaki.', ru: 'Обе формы правильны — краткая более разговорная.', en: 'Both forms are correct — the short form is more colloquial.' } as Record<string, string>)[language]}</div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. O\'tmish haqida savol', ru: '4. Вопрос о прошлом', en: '4. Questions about the past' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {({ uz: 'O\'tmish haqida savol berishning ikki usuli:', ru: 'Два способа спросить о прошлом:', en: 'Two ways to ask about the past:' } as Record<string, string>)[language]}
              </p>
              {[
                {
                  type_uz: '...了吗？',
                  type_ru: '...了吗？',
                  type_en: '...了吗？',
                  q: '你吃了吗？',
                  py: 'Nǐ chī le ma?',
                  uz: 'Yedingmi?',
                  ru: 'Ты поел?',
                  en: 'Did you eat?',
                  color: '#059669',
                },
                {
                  type_uz: '...了没有？ (og\'zaki)',
                  type_ru: '...了没有？ (разговорное)',
                  type_en: '...了没有？ (colloquial)',
                  q: '你吃了没有？',
                  py: 'Nǐ chī le méiyǒu?',
                  uz: 'Yeding-yemadingmi?',
                  ru: 'Поел или нет?',
                  en: 'Did you eat or not?',
                  color: COLOR,
                },
                {
                  type_uz: 'Fe\'l 没 Fe\'l',
                  type_ru: 'Глагол 没 Глагол',
                  type_en: 'Verb 没 Verb',
                  q: '你吃没吃？',
                  py: 'Nǐ chī méi chī?',
                  uz: 'Yeding-yemadingmi?',
                  ru: 'Поел или нет?',
                  en: 'Did you eat or not?',
                  color: '#2563eb',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 4 }}>{({ uz: x.type_uz, ru: x.type_ru, en: (x as any).type_en || x.type_uz } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh" style={{ color: x.color }}>{x.q}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: 'Javob: 吃了 (yedim) / 没吃 (yemadim). Qisqa va aniq!', ru: 'Ответ: 吃了 (поел) / 没吃 (не ел). Коротко и ясно!', en: 'Answer: 吃了 (ate) / 没吃 (didn\'t eat). Short and clear!' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '5. 还没 = hali ...madi', ru: '5. 还没 = ещё не', en: '5. 还没 = not yet' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#2563eb', fontWeight: 700 }}>还</span>
                <span style={{ color: COLOR, fontWeight: 700 }}>没</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
                {' (+ '}
                <span className="grammar-block__formula-ma">呢</span>
                {')'}
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Hali qilmadim (lekin qilishi kutilmoqda)', ru: 'Ещё не сделал (но должен / ожидается)', en: 'Haven\'t done yet (but expected to)' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我还没吃呢。', py: 'Wǒ hái méi chī ne.', uz: 'Men hali yemadim.', ru: 'Я ещё не ел.', en: 'I haven\'t eaten yet.' },
                { zh: '他还没来。', py: 'Tā hái méi lái.', uz: 'U hali kelmadi.', ru: 'Он ещё не пришёл.', en: 'He hasn\'t come yet.' },
                { zh: '我还没写完。', py: 'Wǒ hái méi xiě wán.', uz: 'Men hali yozib tugatmadim.', ru: 'Я ещё не дописал.', en: 'I haven\'t finished writing yet.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-zh">{x.zh}</div>

                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {({ uz: '还没 = «hali» — harakat kutilmoqda, lekin hali bo\'lmagan. 呢 qo\'shilsa tabiiylashadi.', ru: '还没 = «ещё не» — действие ожидается, но пока не состоялось. 呢 в конце делает фразу естественнее.', en: '还没 = "not yet" — the action is expected but hasn\'t happened. Adding 呢 at the end makes it sound more natural.' } as Record<string, string>)[language]}
                </p>
              </div>
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
                  <div className="grammar-block__example-zh" style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1}}>{ex.zh}</span>
                  <span role="button" tabIndex={0} onClick={e=>{e.stopPropagation();playGrammarAudio(ex.zh);}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</span>
                </div>
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Ertalab', ru: 'Мини-диалог 1: Утро', en: 'Mini dialogue 1: Morning' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你吃早饭了吗？', py: 'Nǐ chī zǎofàn le ma?', uz: 'Nonushta qildingmi?', ru: 'Ты завтракал?', en: 'Did you have breakfast?' },
                  { speaker: 'B', zh: '还没呢。你呢？', py: 'Hái méi ne. Nǐ ne?', uz: 'Hali yo\'q. Senam?', ru: 'Ещё нет. А ты?', en: 'Not yet. And you?' },
                  { speaker: 'A', zh: '我也没吃。走吧，一起去！', py: 'Wǒ yě méi chī. Zǒu ba, yìqǐ qù!', uz: 'Men ham yemadim. Yur, birga boramiz!', ru: 'Я тоже не ел. Пошли вместе!', en: 'I didn\'t eat either. Let\'s go together!' },
                  { speaker: 'B', zh: '好！我没有钱，你能请我吗？', py: 'Hǎo! Wǒ méiyǒu qián, nǐ néng qǐng wǒ ma?', uz: 'Bo\'pti! Menda pul yo\'q, mehmon qila olasanmi?', ru: 'Хорошо! У меня нет денег, угостишь меня?', en: 'OK! I don\'t have money, can you treat me?' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{({ uz: line.uz, ru: line.ru, en: (line as any).en || line.uz } as Record<string, string>)[language]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Uyga qaytish', ru: 'Мини-диалог 2: Дома', en: 'Mini dialogue 2: Coming home' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '作业写了没有？', py: 'Zuòyè xiě le méiyǒu?', uz: 'Uy vazifani yozdingmi?', ru: 'Ты написал домашнее задание?', en: 'Did you do your homework?' },
                  { speaker: 'B', zh: '还没写呢。', py: 'Hái méi xiě ne.', uz: 'Hali yozmadim.', ru: 'Ещё не написал.', en: 'Haven\'t written it yet.' },
                  { speaker: 'A', zh: '那你看电视了吗？', py: 'Nà nǐ kàn diànshì le ma?', uz: 'Unday bo\'lsa televizor ko\'rdingmi?', ru: 'Тогда телевизор смотрел?', en: 'Then did you watch TV?' },
                  { speaker: 'B', zh: '也没看。我今天什么都没做。', py: 'Yě méi kàn. Wǒ jīntiān shénme dōu méi zuò.', uz: 'Ko\'rmadim ham. Bugun hech narsa qilmadim.', ru: 'Тоже не смотрел. Сегодня ничего не делал.', en: 'Didn\'t watch either. I didn\'t do anything today.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
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

        {/* ── COMPARE ── */}
        {activeTab === 'compare' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '没 vs 不 — asosiy farq', ru: '没 vs 不 — основная разница', en: '没 vs 不 — key difference' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {({ uz: 'Ikkalasi ham inkor, lekin boshqacha:', ru: 'Оба отрицают, но по-разному:', en: 'Both negate, but differently:' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                  <div style={{ fontSize: '1.8em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>没</div>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 4 }}>{({ uz: 'FAKT / O\'TMISH', ru: 'ФАКТ / ПРОШЛОЕ', en: 'FACT / PAST' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: '...madim\n...yo\'q', ru: '...не делал\n...нет', en: 'didn\'t do\n...don\'t have' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '1.8em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>不</div>
                  <div style={{ fontSize: '0.7em', color: '#ef4444', fontWeight: 700, marginBottom: 4 }}>{({ uz: 'ODATIY / XOHISH', ru: 'ПРИВЫЧКА / ЖЕЛАНИЕ', en: 'HABIT / DESIRE' } as Record<string, string>)[language]}</div>
                  <div style={{ fontSize: '0.75em', color: '#555' }}>{({ uz: '...mayman\n...xohlamayman', ru: '...не делаю\n...не хочу', en: 'don\'t do\n...don\'t want' } as Record<string, string>)[language]}</div>
                </div>
              </div>
              {[
                {
                  mei: '我没吃。', mei_uz: 'Men yemadim. (o\'tmish fakt)', mei_ru: 'Я не ел. (факт прошлого)', mei_en: 'I didn\'t eat. (past fact)',
                  bu: '我不吃。', bu_uz: 'Men yemayman. (xohlamayman)', bu_ru: 'Я не ем. (не хочу)', bu_en: 'I don\'t eat. (don\'t want to)',
                },
                {
                  mei: '他没来。', mei_uz: 'U kelmadi. (bo\'lmagan)', mei_ru: 'Он не пришёл. (факт)', mei_en: 'He didn\'t come. (fact)',
                  bu: '他不来。', bu_uz: 'U kelmaydi. (kelishni xohlamaydi)', bu_ru: 'Он не придёт. (не хочет)', bu_en: 'He won\'t come. (doesn\'t want to)',
                },
                {
                  mei: '没下雨。', mei_uz: 'Yomg\'ir yog\'madi. (fakt)', mei_ru: 'Дождя не было. (факт)', mei_en: 'It didn\'t rain. (fact)',
                  bu: '不下雨。', bu_uz: 'Yomg\'ir yog\'maydi. (prognoz)', bu_ru: 'Дождя нет. (прогноз)', bu_en: 'It won\'t rain. (forecast)',
                },
                {
                  mei: '我没喝咖啡。', mei_uz: 'Men qahva ichmadim. (bugun)', mei_ru: 'Я не пил кофе. (сегодня)', mei_en: 'I didn\'t drink coffee. (today)',
                  bu: '我不喝咖啡。', bu_uz: 'Men qahva ichmayman. (umuman)', bu_ru: 'Я не пью кофе. (вообще)', bu_en: 'I don\'t drink coffee. (in general)',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fffbeb', border: `1px solid #fde68a` }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 2 }}>没</div>
                    <div className="grammar-block__usage-zh">{x.mei}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.mei_uz, ru: x.mei_ru, en: (x as any).mei_en || x.mei_uz } as Record<string, string>)[language]}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>不</div>
                    <div className="grammar-block__usage-zh">{x.bu}</div>
                    <div className="grammar-block__usage-tr">{({ uz: x.bu_uz, ru: x.bu_ru, en: (x as any).bu_en || x.bu_uz } as Record<string, string>)[language]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Qaysi fe\'l bilan qaysi inkor?', ru: 'С каким глаголом какое отрицание?', en: 'Which negation with which verb?' } as Record<string, string>)[language]}</div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85em' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f8' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e6' }}>{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e6', color: COLOR }}>没</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '2px solid #e0e0e6', color: '#ef4444' }}>不</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { verb: '有 (bor/есть)', mei: '没有 ✓', bu: '不有 ✗', note_uz: '有 FAQAT 没有', note_ru: '有 только 没有' },
                      { verb: '是 (...dir/это)', mei: '没是 ✗', bu: '不是 ✓', note_uz: '是 FAQAT 不是', note_ru: '是 только 不是' },
                      { verb: '想 (xohla/хотеть)', mei: '没想 ✓', bu: '不想 ✓', note_uz: '没想=o\'ylamadim, 不想=xohlamayman', note_ru: '没想=не думал, 不想=не хочу' },
                      { verb: '去 (bor/идти)', mei: '没去 ✓', bu: '不去 ✓', note_uz: '没去=bormadim, 不去=bormayman', note_ru: '没去=не ходил, 不去=не пойду' },
                      { verb: '会 (olmoq/уметь)', mei: '没会 ✗', bu: '不会 ✓', note_uz: '会 FAQAT 不会', note_ru: '会 только 不会' },
                    ].map((r, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e0e0e6' : 'none' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: '#444' }}>{r.verb}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: r.mei.includes('✗') ? '#ef4444' : COLOR }}>{r.mei}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: r.bu.includes('✗') ? '#ef4444' : '#059669' }}>{r.bu}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ {({ uz: 'Uch istisnoni eslab qoling: 有 → faqat 没有. 是 → faqat 不是. 会 → faqat 不会.', ru: 'Запомните три исключения: 有 → только 没有. 是 → только 不是. 会 → только 不会.', en: 'Remember three exceptions: 有 → only 没有. 是 → only 不是. 会 → only 不会.' } as Record<string, string>)[language]}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '没 va 了 — xulosa', ru: '没 и 了 — итоговая таблица', en: '没 and 了 — summary' } as Record<string, string>)[language]}</div>
              {[
                {
                  icon: '✓', color: '#16a34a', bg: '#dcfce7',
                  label_uz: 'Ijobiy (o\'tmish)', label_ru: 'Утверждение (прошлое)', label_en: 'Affirmative (past)',
                  ex: '我吃了。', ex_uz: 'Yedim.', ex_ru: 'Я поел.', ex_en: 'I ate.',
                },
                {
                  icon: '✓', color: COLOR, bg: '#fffbeb',
                  label_uz: 'Inkor (没)', label_ru: 'Отрицание (没)', label_en: 'Negation (没)',
                  ex: '我没吃。', ex_uz: 'Yemadim. (了 YO\'Q)', ex_ru: 'Я не ел. (без 了)', ex_en: 'I didn\'t eat. (no 了)',
                },
                {
                  icon: '✗', color: '#ef4444', bg: '#fee2e2',
                  label_uz: 'XATO: 没 + 了', label_ru: 'ОШИБКА: 没 + 了', label_en: 'WRONG: 没 + 了',
                  ex: '我没吃了。', ex_uz: '❌ Mumkin emas!', ex_ru: '❌ Так нельзя!', ex_en: '❌ Not possible!',
                },
                {
                  icon: '?', color: '#2563eb', bg: '#eff6ff',
                  label_uz: 'Savol', label_ru: 'Вопрос', label_en: 'Question',
                  ex: '你吃了吗？', ex_uz: 'Yedingmi?', ex_ru: 'Ты поел?', ex_en: 'Did you eat?',
                },
              ].map((r, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: r.bg, borderRadius: 8, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                  <div style={{ fontSize: '1em', fontWeight: 700, color: r.color, minWidth: 20, textAlign: 'center' }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65em', fontWeight: 700, color: r.color, textTransform: 'uppercase' as const }}>{({ uz: r.label_uz, ru: r.label_ru, en: (r as any).label_en || r.label_uz } as Record<string, string>)[language]}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div className="grammar-block__usage-zh">{r.ex}</div>
                      <div className="grammar-block__usage-tr">{({ uz: r.ex_uz, ru: r.ex_ru, en: (r as any).ex_en || r.ex_uz } as Record<string, string>)[language]}</div>
                    </div>
                  </div>
                </div>
              ))}
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
