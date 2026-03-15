'use client';

function playGrammarAudio(zh: string) {
  const audio = new Audio(`/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`);
  audio.play().catch(() => {});
}

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
  { id: 'tone', uz: 'Ton · Ibora', ru: 'Тон · Фразы', en: 'Tone · Phrases' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我不吃鱼。', pinyin: 'Wǒ bù chī yú.', uz: 'Men baliq yemayman.', ru: 'Я не ем рыбу.', en: 'I don\'t eat fish.', note_uz: '我 (wǒ) = men, 吃 (chī) = yemoq, 鱼 (yú) = baliq → odatiy inkor', note_ru: '我 (wǒ) = я, 吃 (chī) = есть, 鱼 (yú) = рыба → обычное отрицание', note_en: '我 (wǒ) = I, 吃 (chī) = to eat, 鱼 (yú) = fish → standard negation' },
  { zh: '他不是老师。', pinyin: 'Tā bú shì lǎoshī.', uz: 'U o\'qituvchi emas.', ru: 'Он не учитель.', en: 'He is not a teacher.', note_uz: '他 (tā) = u, 是 (shì) = ...dir, 老师 (lǎoshī) = o\'qituvchi → 不是 = emas', note_ru: '他 (tā) = он, 是 (shì) = является, 老师 (lǎoshī) = учитель → 不是 = не является', note_en: '他 (tā) = he, 是 (shì) = to be, 老师 (lǎoshī) = teacher → 不是 = is not' },
  { zh: '今天不冷。', pinyin: 'Jīntiān bù lěng.', uz: 'Bugun sovuq emas.', ru: 'Сегодня не холодно.', en: 'It\'s not cold today.', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq → sifatni inkor qilish', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный → отрицание прилагательного', note_en: '今天 (jīntiān) = today, 冷 (lěng) = cold → negating an adjective' },
  { zh: '我不想去学校。', pinyin: 'Wǒ bù xiǎng qù xuéxiào.', uz: 'Men maktabga borgim kelmayapti.', ru: 'Я не хочу идти в школу.', en: 'I don\'t want to go to school.', note_uz: '想 (xiǎng) = xohlamoq, 去 (qù) = bormoq, 学校 (xuéxiào) = maktab', note_ru: '想 (xiǎng) = хотеть, 去 (qù) = идти, 学校 (xuéxiào) = школа', note_en: '想 (xiǎng) = to want, 去 (qù) = to go, 学校 (xuéxiào) = school' },
  { zh: '她不喜欢下雨。', pinyin: 'Tā bù xǐhuan xià yǔ.', uz: 'U yomg\'irni yoqtirmaydi.', ru: 'Ей не нравится дождь.', en: 'She doesn\'t like rain.', note_uz: '喜欢 (xǐhuan) = yoqtirmoq, 下雨 (xià yǔ) = yomg\'ir yog\'moq', note_ru: '喜欢 (xǐhuan) = нравиться, 下雨 (xià yǔ) = идти дождю', note_en: '喜欢 (xǐhuan) = to like, 下雨 (xià yǔ) = to rain' },
  { zh: '这个不贵。', pinyin: 'Zhège bú guì.', uz: 'Bu qimmat emas.', ru: 'Это не дорого.', en: 'This is not expensive.', note_uz: '这个 (zhège) = bu, 贵 (guì) = qimmat → 4-ton oldidan bú bo\'ladi', note_ru: '这个 (zhège) = это, 贵 (guì) = дорогой → перед 4-м тоном bú', note_en: '这个 (zhège) = this, 贵 (guì) = expensive → before 4th tone becomes bú' },
  { zh: '我不知道。', pinyin: 'Wǒ bù zhīdào.', uz: 'Men bilmayman.', ru: 'Я не знаю.', en: 'I don\'t know.', note_uz: '知道 (zhīdào) = bilmoq → eng ko\'p ishlatiladigan iboralardan biri', note_ru: '知道 (zhīdào) = знать → одно из самых частых выражений', note_en: '知道 (zhīdào) = to know → one of the most common expressions' },
  { zh: '对不起。', pinyin: 'Duìbuqǐ.', uz: 'Kechirasiz.', ru: 'Извините.', en: 'Sorry. / Excuse me.', note_uz: '对 (duì) = to\'g\'ri, 起 (qǐ) = turmoq → 不 o\'rtada keladi!', note_ru: '对 (duì) = правильно, 起 (qǐ) = вставать → 不 стоит в середине!', note_en: '对 (duì) = correct, 起 (qǐ) = to rise → 不 goes in the middle!' },
];

const toneExamples = [
  { zh: '不吃', py: 'bù chī', tone_uz: '1-ton', tone_ru: '1-й тон', tone_en: '1st tone', change: false, uz: 'yemayman', ru: 'не ем', en: 'don\'t eat' },
  { zh: '不来', py: 'bù lái', tone_uz: '2-ton', tone_ru: '2-й тон', tone_en: '2nd tone', change: false, uz: 'kelmayman', ru: 'не приду', en: 'won\'t come' },
  { zh: '不好', py: 'bù hǎo', tone_uz: '3-ton', tone_ru: '3-й тон', tone_en: '3rd tone', change: false, uz: 'yaxshi emas', ru: 'нехорошо', en: 'not good' },
  { zh: '不是', py: 'bú shì', tone_uz: '4-ton', tone_ru: '4-й тон', tone_en: '4th tone', change: true, uz: 'emas', ru: 'не является', en: 'is not' },
  { zh: '不去', py: 'bú qù', tone_uz: '4-ton', tone_ru: '4-й тон', tone_en: '4th tone', change: true, uz: 'bormayman', ru: 'не пойду', en: 'won\'t go' },
  { zh: '不看', py: 'bú kàn', tone_uz: '4-ton', tone_ru: '4-й тон', tone_en: '4th tone', change: true, uz: 'ko\'rmayman', ru: 'не смотрю', en: 'don\'t watch' },
  { zh: '不对', py: 'bú duì', tone_uz: '4-ton', tone_ru: '4-й тон', tone_en: '4th tone', change: true, uz: 'noto\'g\'ri', ru: 'неправильно', en: 'incorrect' },
  { zh: '不要', py: 'bú yào', tone_uz: '4-ton', tone_ru: '4-й тон', tone_en: '4th tone', change: true, uz: 'kerak emas', ru: 'не надо', en: 'don\'t want / don\'t' },
];

const quizQuestions = [
  {
    q_uz: '"Men yemayman" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я не ем"?',
    q_en: 'How do you say "I don\'t eat" in Chinese?',
    options: ['吃不我', '我不吃', '不我吃', '我吃不'],
    correct: 1,
  },
  {
    q_uz: '不 qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 不?',
    q_en: 'Where does 不 go in a sentence?',
    options_uz: ['Gap oxiriga', 'Otdan keyin', 'Fe\'ldan oldin', 'Egadan oldin'],
    options_ru: ['В конец предложения', 'После существительного', 'Перед глаголом', 'Перед подлежащим'],
    options_en: ['End of sentence', 'After the noun', 'Before the verb', 'Before the subject'],
    correct: 2,
  },
  {
    q_uz: '"U o\'qituvchi emas" qanday?',
    q_ru: 'Как сказать "Он не учитель"?',
    q_en: 'How do you say "He is not a teacher"?',
    options: ['他不老师', '不他是老师', '他不是老师', '他是不老师'],
    correct: 2,
  },
  {
    q_uz: '不是 qanday o\'qiladi?',
    q_ru: 'Как читается 不是?',
    q_en: 'How is 不是 pronounced?',
    options_uz: ['bù shì (4-ton)', 'bú shì (2-ton)', 'bǔ shì (3-ton)', 'bā shì (1-ton)'],
    options_ru: ['bù shì (4-й тон)', 'bú shì (2-й тон)', 'bǔ shì (3-й тон)', 'bā shì (1-й тон)'],
    options_en: ['bù shì (4th tone)', 'bú shì (2nd tone)', 'bǔ shì (3rd tone)', 'bā shì (1st tone)'],
    correct: 1,
  },
  {
    q_uz: '"Men bilmayman" xitoycha?',
    q_ru: 'Как по-китайски "Я не знаю"?',
    q_en: 'How do you say "I don\'t know" in Chinese?',
    options: ['我不知道', '不知道我', '知道不我', '我知不道'],
    correct: 0,
  },
  {
    q_uz: '"Bandmisan?" savol shaklini toping:',
    q_ru: 'Найдите форму вопроса "Ты занят?":',
    q_en: 'Find the question form for "Are you busy?":',
    options: ['你不忙？', '你忙不忙？', '不你忙吗？', '忙你不？'],
    correct: 1,
  },
];

export function GrammarBuPage() {
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
        <div className="grammar-page__hero-bg">不</div>
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
          <h1 className="grammar-page__hero-char">不</h1>
          <div className="grammar-page__hero-pinyin">bù</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'inkor yuklamasi / «emas»', ru: 'отрицательная частица / «не»', en: 'negative particle / "not"' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">不</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">bù</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '4-ton (↘), 4-ton oldida 2-tonga o\'zgaradi', ru: '4-й тон (↘), меняется на 2-й перед 4-м тоном', en: '4th tone (↘), changes to 2nd before another 4th tone' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'yo\'q, emas, -ma-', ru: 'не, нет, -не-', en: 'no, not, don\'t' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">4</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '不 — xitoy tilida inkor qilishning asosiy vositasi. Fe\'l yoki sifat oldiga qo\'yiladi:', ru: '不 — основное средство отрицания в китайском языке. Ставится перед глаголом или прилагательным:', en: '不 is the main negation word in Chinese. It goes before a verb or adjective:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  我<span className="grammar-block__highlight">不</span>吃
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'men yema\'yman', ru: 'я не ем (–маю)', en: 'I don\'t eat' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2 asosiy vazifasi', ru: 'Два основных применения', en: '2 Main Uses' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Fe\'l inkori', ru: 'Глагол → отриц.', en: 'Verb negation' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">不</span>喝</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'men ichmayman', ru: 'я не пью', en: 'I don\'t drink' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Sifat inkori', ru: 'Прилаг. → отриц.', en: 'Adjective negation' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">今天<span className="grammar-block__highlight">不</span>冷</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'bugun sovuq emas', ru: 'сегодня не холодно', en: 'it\'s not cold today' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Ton o\'zgarishi', ru: 'Изменение тона', en: 'Tone Change' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '不 odatda 4-ton (bù). Lekin 4-tonli so\'z oldida 2-tonga (bú) o\'zgaradi:', ru: '不 обычно 4-й тон (bù). Но перед словом с 4-м тоном меняется на 2-й (bú):', en: '不 is normally 4th tone (bù). But before another 4th-tone word, it changes to 2nd tone (bú):' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-zh">不吃</div>
                  <div className="grammar-block__usage-py" style={{ color: '#16a34a', fontWeight: 600 }}>bù chī ✓</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{({ uz: '1-ton → o\'zgarmaydi', ru: '1-й тон → без изменений', en: '1st tone → no change' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-zh">不是</div>
                  <div className="grammar-block__usage-py" style={{ color: '#d97706', fontWeight: 600 }}>bú shì !</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{({ uz: '4-ton → 2-tonga o\'zgaradi', ru: '4-й тон → меняется на 2-й', en: '4th tone → changes to 2nd' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. 不 + Fe\'l (harakatni inkor qilish)', ru: '1. 不 + Глагол (отрицание действия)', en: '1. 不 + Verb (negating an action)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-neg">不</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«...mayman / ...maydi»', ru: '«...не делаю / не делает»', en: '"don\'t / doesn\'t"' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我不吃。', py: 'Wǒ bù chī.', uz: 'Men yemayman.', ru: 'Я не ем.', en: 'I don\'t eat.' },
                { zh: '他不喝茶。', py: 'Tā bù hē chá.', uz: 'U choy ichmaydi.', ru: 'Он не пьёт чай.', en: 'He doesn\'t drink tea.' },
                { zh: '她不看电视。', py: 'Tā bú kàn diànshì.', uz: 'U televizor ko\'rmaydi.', ru: 'Она не смотрит телевизор.', en: 'She doesn\'t watch TV.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. 不 + Sifat (ta\'rifni inkor qilish)', ru: '2. 不 + Прилагательное (отрицание признака)', en: '2. 不 + Adjective (negating a quality)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Narsa', ru: 'Предмет', en: 'Object' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-neg">不</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '«...emas»', ru: '«...не такой»', en: '"not..."' } as Record<string, string>)[language]}</p>
              {[
                { zh: '今天不冷。', py: 'Jīntiān bù lěng.', uz: 'Bugun sovuq emas.', ru: 'Сегодня не холодно.', en: 'It\'s not cold today.' },
                { zh: '这个不贵。', py: 'Zhège bú guì.', uz: 'Bu qimmat emas.', ru: 'Это не дорого.', en: 'This is not expensive.' },
                { zh: '我不忙。', py: 'Wǒ bù máng.', uz: 'Men band emasman.', ru: 'Я не занят.', en: 'I\'m not busy.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. 不是 = «...emas» (otni inkor)', ru: '3. 不是 = «не является»', en: '3. 不是 = "is not" (negating nouns)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-neg">不是</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Существ.', en: 'Noun' } as Record<string, string>)[language]}</span>
              </div>
              {[
                { zh: '我不是老师。', py: 'Wǒ bú shì lǎoshī.', uz: 'Men o\'qituvchi emasman.', ru: 'Я не учитель.', en: 'I\'m not a teacher.' },
                { zh: '他不是中国人。', py: 'Tā bú shì Zhōngguó rén.', uz: 'U xitoylik emas.', ru: 'Он не китаец.', en: 'He\'s not Chinese.' },
                { zh: '这不是我的书。', py: 'Zhè bú shì wǒ de shū.', uz: 'Bu mening kitobim emas.', ru: 'Это не моя книга.', en: 'This is not my book.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '4. 不想 = «...gim kelmayapti»', ru: '4. 不想 = «не хочу»', en: '4. 不想 = "don\'t want to"' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' '}
                <span className="grammar-block__formula-neg">不想</span>
                {' '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              {[
                { zh: '我不想吃饭。', py: 'Wǒ bù xiǎng chī fàn.', uz: 'Ovqat yegim kelmayapti.', ru: 'Я не хочу есть.', en: 'I don\'t want to eat.' },
                { zh: '他不想去。', py: 'Tā bù xiǎng qù.', uz: 'U borishni xohlamayapti.', ru: 'Он не хочет идти.', en: 'He doesn\'t want to go.' },
                { zh: '我不想学习。', py: 'Wǒ bù xiǎng xuéxí.', uz: 'O\'qigim kelmayapti.', ru: 'Я не хочу учиться.', en: 'I don\'t want to study.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '5. Savol: Fe\'l + 不 + Fe\'l?', ru: '5. Вопрос: Гл. + 不 + Гл.?', en: '5. Question: Verb + 不 + Verb?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'Fe\'lni 不 bilan takrorlash = ha/yo\'q savoli (吗 o\'rniga):', ru: 'Повтор глагола с 不 = вопрос «да/нет» (альтернатива 吗):', en: 'Repeating a verb with 不 = yes/no question (alternative to 吗):' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">你喜<span className="grammar-block__highlight">不</span>喜欢？</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Yoqtirasanmi?', ru: 'Тебе нравится или нет?', en: 'Do you like it or not?' } as Record<string, string>)[language]}</div>
              </div>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center' }}>
                <div className="grammar-block__usage-zh">你是<span className="grammar-block__highlight">不</span>是学生？</div>
                <div className="grammar-block__usage-tr">{({ uz: 'Sen talabamisanmi-yo\'qmi?', ru: 'Ты студент или нет?', en: 'Are you a student or not?' } as Record<string, string>)[language]}</div>
              </div>
            </div>
          </>
        )}

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
                  <button type="button" onClick={e=>{e.stopPropagation();playGrammarAudio(ex.zh);}} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontSize:15,color:'#3b82f6',flexShrink:0}} aria-label="Play">▶</button>
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
              <div className="grammar-block__label">{({ uz: 'Ko\'p ishlatiladigan iboralar', ru: 'Часто используемые выражения', en: 'Common Expressions' } as Record<string, string>)[language]}</div>
              {[
                { phrase: '不好', py: 'bù hǎo', uz: 'yaxshi emas / yomon', ru: 'нехорошо / плохо', en: 'not good / bad' },
                { phrase: '不是', py: 'bú shì', uz: 'emas', ru: 'не является', en: 'is not' },
                { phrase: '不对', py: 'bú duì', uz: 'noto\'g\'ri', ru: 'неправильно', en: 'incorrect / wrong' },
                { phrase: '不想', py: 'bù xiǎng', uz: 'xohlamayman', ru: 'не хочу', en: 'don\'t want to' },
                { phrase: '不知道', py: 'bù zhīdào', uz: 'bilmayman', ru: 'не знаю', en: 'don\'t know' },
                { phrase: '不喜欢', py: 'bù xǐhuan', uz: 'yoqtirmayman', ru: 'не нравится', en: 'don\'t like' },
                { phrase: '不客气', py: 'bú kèqi', uz: 'arzimaydi', ru: 'пожалуйста / не за что', en: 'you\'re welcome' },
                { phrase: '不用谢', py: 'bú yòng xiè', uz: 'hojat yo\'q', ru: 'не стоит благодарности', en: 'don\'t mention it' },
                { phrase: '对不起', py: 'duìbuqǐ', uz: 'kechirasiz', ru: 'извините', en: 'sorry / excuse me' },
              ].map((item, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 8 ? '1px solid #f0f0f3' : 'none' }}>
                  <span className="grammar-block__usage-zh" style={{ minWidth: 64 }}>{item.phrase}</span>
                  <span className="grammar-block__usage-py" style={{ minWidth: 96 }}>{item.py}</span>
                  <span className="grammar-block__info-val">{({ uz: item.uz, ru: item.ru, en: (item as any).en || item.uz } as Record<string, string>)[language]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'tone' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Ton o\'zgarishi qoidasi', ru: 'Правило изменения тона', en: 'Tone Change Rule' } as Record<string, string>)[language]}</div>
              <div className="grammar-block grammar-block--tip" style={{ margin: 0, marginBottom: 12 }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '不 odatda 4-ton (bù). Keyingi so\'z 4-ton bo\'lsa, 不 2-tonga (bú) o\'zgaradi.', ru: '不 обычно 4-й тон (bù). Если следующее слово — 4-й тон, 不 меняется на 2-й (bú).', en: '不 is normally 4th tone (bù). If the next word is 4th tone, 不 changes to 2nd tone (bú).' } as Record<string, string>)[language]}
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95em' }}>
                    {({ uz: 'Oddiy qoida: 不 + 4-ton = bú, qolgan barcha holatlarda = bù', ru: 'Простое правило: 不 + 4-й тон = bú, всё остальное = bù', en: 'Simple rule: 不 + 4th tone = bú, all other cases = bù' } as Record<string, string>)[language]}
                  </div>
                </div>
              </div>
              {toneExamples.map((ex, i) => (
                <div
                  key={i}
                  className="grammar-block__usage-item"
                  style={{
                    borderLeft: `3px solid ${ex.change ? '#f59e0b' : '#d1d5db'}`,
                    background: ex.change ? '#fffbeb' : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 5,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="grammar-block__usage-zh">{ex.zh}</div>
                    <div className="grammar-block__usage-py" style={{ color: ex.change ? '#d97706' : undefined, fontWeight: ex.change ? 600 : undefined }}>{ex.py}</div>
                    <div className="grammar-block__usage-tr">{({ uz: ex.uz, ru: ex.ru, en: (ex as any).en || ex.uz } as Record<string, string>)[language]}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7em', color: '#999' }}>{({ uz: 'keyingi so\'z', ru: 'след. слово', en: 'next word' } as Record<string, string>)[language]}</div>
                    <div style={{ fontSize: '0.75em', fontWeight: 600, color: ex.change ? '#d97706' : '#666' }}>{({ uz: ex.tone_uz, ru: ex.tone_ru, en: (ex as any).tone_en || ex.tone_uz } as Record<string, string>)[language]}</div>
                    <div style={{ fontSize: '0.7em', fontWeight: 700, color: ex.change ? '#d97706' : '#16a34a' }}>{ex.change ? 'bú ↗' : 'bù ↘'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Kundalik iboralar', ru: 'Повседневные фразы', en: 'Everyday Phrases' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__formula-desc" style={{ marginBottom: 10 }}>
                {({ uz: 'Bu iboralar juda ko\'p ishlatiladi — yod oling!', ru: 'Эти выражения используются очень часто — выучите наизусть!', en: 'These expressions are used very often — memorize them!' } as Record<string, string>)[language]}
              </p>
              {[
                { zh: '不客气', py: 'bú kèqi', uz: 'Arzimaydi / Hech gap emas', ru: 'Пожалуйста / Не за что', en: 'You\'re welcome', ctx_uz: '谢谢 ga javob', ctx_ru: 'ответ на 谢谢', ctx_en: 'Reply to 谢谢' },
                { zh: '对不起', py: 'duìbuqǐ', uz: 'Kechirasiz', ru: 'Извините', en: 'Sorry / Excuse me', ctx_uz: 'Uzr so\'rash', ctx_ru: 'Извинение', ctx_en: 'Apology' },
                { zh: '不用谢', py: 'bú yòng xiè', uz: 'Hojat yo\'q', ru: 'Не стоит благодарности', en: 'Don\'t mention it', ctx_uz: '谢谢 ga javob', ctx_ru: 'ответ на 谢谢', ctx_en: 'Reply to 谢谢' },
                { zh: '不知道', py: 'bù zhīdào', uz: 'Bilmayman', ru: 'Не знаю', en: 'I don\'t know', ctx_uz: 'Eng ko\'p ishlatiladigan!', ctx_ru: 'Самое частое!', ctx_en: 'Most commonly used!' },
                { zh: '不好意思', py: 'bù hǎoyìsi', uz: 'Uzr / Noqulay bo\'ldim', ru: 'Неловко / Простите', en: 'Excuse me / My bad', ctx_uz: 'Yengil uzr', ctx_ru: 'Лёгкое извинение', ctx_en: 'Mild apology' },
                { zh: '不错', py: 'búcuò', uz: 'Yomon emas / Yaxshi', ru: 'Неплохо / Хорошо', en: 'Not bad / Pretty good', ctx_uz: 'Maqtash', ctx_ru: 'Похвала', ctx_en: 'Compliment' },
              ].map((w, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <div style={{ flex: 1 }}>
                    <div className="grammar-block__usage-zh">{w.zh}</div>
                    <div className="grammar-block__usage-py">{w.py}</div>
                    <div className="grammar-block__usage-tr">{({ uz: w.uz, ru: w.ru, en: (w as any).en || w.uz } as Record<string, string>)[language]}</div>
                  </div>
                  <div style={{ fontSize: '0.7em', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '3px 6px', borderRadius: 4, flexShrink: 0, textAlign: 'center', maxWidth: 90 }}>
                    {({ uz: w.ctx_uz, ru: w.ctx_ru, en: (w as any).ctx_en || w.ctx_uz } as Record<string, string>)[language]}
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Mini dialog', ru: 'Мини-диалог', en: 'Mini Dialogue' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你喜欢喝咖啡吗？', py: 'Nǐ xǐhuan hē kāfēi ma?', uz: 'Qahva ichishni yoqtirasanmi?', ru: 'Тебе нравится пить кофе?', en: 'Do you like drinking coffee?' },
                  { speaker: 'B', zh: '我不喜欢。我喜欢喝茶。', py: 'Wǒ bù xǐhuan. Wǒ xǐhuan hē chá.', uz: 'Yoqtirmayman. Choy ichishni yoqtiraman.', ru: 'Не нравится. Мне нравится пить чай.', en: 'I don\'t like it. I like drinking tea.' },
                  { speaker: 'A', zh: '想不想去咖啡店？', py: 'Xiǎng bu xiǎng qù kāfēidiàn?', uz: 'Qahvaxonaga borgingmi-yo\'qmi?', ru: 'Хочешь или нет пойти в кафе?', en: 'Do you want to go to a cafe or not?' },
                  { speaker: 'B', zh: '好啊！他们也有茶。', py: 'Hǎo a! Tāmen yě yǒu chá.', uz: 'Bo\'pti! Ularda choy ham bor.', ru: 'Хорошо! У них тоже есть чай.', en: 'Sure! They also have tea.' },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 10 : 0 }}>
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

      <PageFooter />
    </div>
  );
}
