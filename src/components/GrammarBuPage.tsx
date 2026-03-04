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
  { id: 'tone', uz: 'Ton · Ibora', ru: 'Тон · Фразы' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '我不吃鱼。', pinyin: 'Wǒ bù chī yú.', uz: 'Men baliq yemayman.', ru: 'Я не ем рыбу.', note_uz: '我 (wǒ) = men, 吃 (chī) = yemoq, 鱼 (yú) = baliq → odatiy inkor', note_ru: '我 (wǒ) = я, 吃 (chī) = есть, 鱼 (yú) = рыба → обычное отрицание' },
  { zh: '他不是老师。', pinyin: 'Tā bú shì lǎoshī.', uz: 'U o\'qituvchi emas.', ru: 'Он не учитель.', note_uz: '他 (tā) = u, 是 (shì) = ...dir, 老师 (lǎoshī) = o\'qituvchi → 不是 = emas', note_ru: '他 (tā) = он, 是 (shì) = является, 老师 (lǎoshī) = учитель → 不是 = не является' },
  { zh: '今天不冷。', pinyin: 'Jīntiān bù lěng.', uz: 'Bugun sovuq emas.', ru: 'Сегодня не холодно.', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq → sifatni inkor qilish', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный → отрицание прилагательного' },
  { zh: '我不想去学校。', pinyin: 'Wǒ bù xiǎng qù xuéxiào.', uz: 'Men maktabga borgim kelmayapti.', ru: 'Я не хочу идти в школу.', note_uz: '想 (xiǎng) = xohlamoq, 去 (qù) = bormoq, 学校 (xuéxiào) = maktab', note_ru: '想 (xiǎng) = хотеть, 去 (qù) = идти, 学校 (xuéxiào) = школа' },
  { zh: '她不喜欢下雨。', pinyin: 'Tā bù xǐhuan xià yǔ.', uz: 'U yomg\'irni yoqtirmaydi.', ru: 'Ей не нравится дождь.', note_uz: '喜欢 (xǐhuan) = yoqtirmoq, 下雨 (xià yǔ) = yomg\'ir yog\'moq', note_ru: '喜欢 (xǐhuan) = нравиться, 下雨 (xià yǔ) = идти дождю' },
  { zh: '这个不贵。', pinyin: 'Zhège bú guì.', uz: 'Bu qimmat emas.', ru: 'Это не дорого.', note_uz: '这个 (zhège) = bu, 贵 (guì) = qimmat → 4-ton oldidan bú bo\'ladi', note_ru: '这个 (zhège) = это, 贵 (guì) = дорогой → перед 4-м тоном bú' },
  { zh: '我不知道。', pinyin: 'Wǒ bù zhīdào.', uz: 'Men bilmayman.', ru: 'Я не знаю.', note_uz: '知道 (zhīdào) = bilmoq → eng ko\'p ishlatiladigan iboralardan biri', note_ru: '知道 (zhīdào) = знать → одно из самых частых выражений' },
  { zh: '对不起。', pinyin: 'Duìbuqǐ.', uz: 'Kechirasiz.', ru: 'Извините.', note_uz: '对 (duì) = to\'g\'ri, 起 (qǐ) = turmoq → 不 o\'rtada keladi!', note_ru: '对 (duì) = правильно, 起 (qǐ) = вставать → 不 стоит в середине!' },
];

const toneExamples = [
  { zh: '不吃', py: 'bù chī', tone_uz: '1-ton', tone_ru: '1-й тон', change: false, uz: 'yemayman', ru: 'не ем' },
  { zh: '不来', py: 'bù lái', tone_uz: '2-ton', tone_ru: '2-й тон', change: false, uz: 'kelmayman', ru: 'не приду' },
  { zh: '不好', py: 'bù hǎo', tone_uz: '3-ton', tone_ru: '3-й тон', change: false, uz: 'yaxshi emas', ru: 'нехорошо' },
  { zh: '不是', py: 'bú shì', tone_uz: '4-ton', tone_ru: '4-й тон', change: true, uz: 'emas', ru: 'не является' },
  { zh: '不去', py: 'bú qù', tone_uz: '4-ton', tone_ru: '4-й тон', change: true, uz: 'bormayman', ru: 'не пойду' },
  { zh: '不看', py: 'bú kàn', tone_uz: '4-ton', tone_ru: '4-й тон', change: true, uz: 'ko\'rmayman', ru: 'не смотрю' },
  { zh: '不对', py: 'bú duì', tone_uz: '4-ton', tone_ru: '4-й тон', change: true, uz: 'noto\'g\'ri', ru: 'неправильно' },
  { zh: '不要', py: 'bú yào', tone_uz: '4-ton', tone_ru: '4-й тон', change: true, uz: 'kerak emas', ru: 'не надо' },
];

const quizQuestions = [
  {
    q_uz: '"Men yemayman" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я не ем"?',
    options: ['吃不我', '我不吃', '不我吃', '我吃不'],
    correct: 1,
  },
  {
    q_uz: '不 qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 不?',
    options_uz: ['Gap oxiriga', 'Otdan keyin', 'Fe\'ldan oldin', 'Egadan oldin'],
    options_ru: ['В конец предложения', 'После существительного', 'Перед глаголом', 'Перед подлежащим'],
    correct: 2,
  },
  {
    q_uz: '"U o\'qituvchi emas" qanday?',
    q_ru: 'Как сказать "Он не учитель"?',
    options: ['他不老师', '不他是老师', '他不是老师', '他是不老师'],
    correct: 2,
  },
  {
    q_uz: '不是 qanday o\'qiladi?',
    q_ru: 'Как читается 不是?',
    options_uz: ['bù shì (4-ton)', 'bú shì (2-ton)', 'bǔ shì (3-ton)', 'bā shì (1-ton)'],
    options_ru: ['bù shì (4-й тон)', 'bú shì (2-й тон)', 'bǔ shì (3-й тон)', 'bā shì (1-й тон)'],
    correct: 1,
  },
  {
    q_uz: '"Men bilmayman" xitoycha?',
    q_ru: 'Как по-китайски "Я не знаю"?',
    options: ['我不知道', '不知道我', '知道不我', '我知不道'],
    correct: 0,
  },
  {
    q_uz: '"Bandmisan?" savol shaklini toping:',
    q_ru: 'Найдите форму вопроса "Ты занят?":',
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
            <Link href="/chinese?tab=grammar" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">HSK 1 · {language === 'ru' ? 'Грамматика' : 'Grammatika'}</div>
          <div className="grammar-page__hero-char">不</div>
          <div className="grammar-page__hero-pinyin">bù</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'отрицательная частица / «не»' : 'inkor yuklamasi / «emas»'} —</div>
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
                <div className="grammar-block__big-char">不</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">bù</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '4-й тон (↘), меняется на 2-й перед 4-м тоном' : '4-ton (↘), 4-ton oldida 2-tonga o\'zgaradi'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'не, нет, -не-' : 'yo\'q, emas, -ma-'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">4</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '不 — основное средство отрицания в китайском языке. Ставится перед глаголом или прилагательным:'
                  : '不 — xitoy tilida inkor qilishning asosiy vositasi. Fe\'l yoki sifat oldiga qo\'yiladi:'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  我<span className="grammar-block__highlight">不</span>吃
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru' ? 'я не ем (–маю)' : 'men yema\'yman'}
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Два основных применения' : '2 asosiy vazifasi'}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Глагол → отриц.' : 'Fe\'l inkori'}</div>
                  <div className="grammar-block__usage-zh">我<span className="grammar-block__highlight">不</span>喝</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'я не пью' : 'men ichmayman'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{language === 'ru' ? 'Прилаг. → отриц.' : 'Sifat inkori'}</div>
                  <div className="grammar-block__usage-zh">今天<span className="grammar-block__highlight">不</span>冷</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'сегодня не холодно' : 'bugun sovuq emas'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Изменение тона' : 'Ton o\'zgarishi'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '不 обычно 4-й тон (bù). Но перед словом с 4-м тоном меняется на 2-й (bú):'
                  : '不 odatda 4-ton (bù). Lekin 4-tonli so\'z oldida 2-tonga (bú) o\'zgaradi:'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-zh">不吃</div>
                  <div className="grammar-block__usage-py" style={{ color: '#16a34a', fontWeight: 600 }}>bù chī ✓</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{language === 'ru' ? '1-й тон → без изменений' : '1-ton → o\'zgarmaydi'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-zh">不是</div>
                  <div className="grammar-block__usage-py" style={{ color: '#d97706', fontWeight: 600 }}>bú shì !</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{language === 'ru' ? '4-й тон → меняется на 2-й' : '4-ton → 2-tonga o\'zgaradi'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. 不 + Глагол (отрицание действия)' : '1. 不 + Fe\'l (harakatni inkor qilish)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' '}
                <span className="grammar-block__formula-neg">不</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '«...не делаю / не делает»' : '«...mayman / ...maydi»'}</p>
              {[
                { zh: '我不吃。', py: 'Wǒ bù chī.', uz: 'Men yemayman.', ru: 'Я не ем.' },
                { zh: '他不喝茶。', py: 'Tā bù hē chá.', uz: 'U choy ichmaydi.', ru: 'Он не пьёт чай.' },
                { zh: '她不看电视。', py: 'Tā bú kàn diànshì.', uz: 'U televizor ko\'rmaydi.', ru: 'Она не смотрит телевизор.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. 不 + Прилагательное (отрицание признака)' : '2. 不 + Sifat (ta\'rifni inkor qilish)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Предмет' : 'Narsa'}</span>
                {' '}
                <span className="grammar-block__formula-neg">不</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '«...не такой»' : '«...emas»'}</p>
              {[
                { zh: '今天不冷。', py: 'Jīntiān bù lěng.', uz: 'Bugun sovuq emas.', ru: 'Сегодня не холодно.' },
                { zh: '这个不贵。', py: 'Zhège bú guì.', uz: 'Bu qimmat emas.', ru: 'Это не дорого.' },
                { zh: '我不忙。', py: 'Wǒ bù máng.', uz: 'Men band emasman.', ru: 'Я не занят.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. 不是 = «не является»' : '3. 不是 = «...emas» (otni inkor)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' '}
                <span className="grammar-block__formula-neg">不是</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Существ.' : 'Ot'}</span>
              </div>
              {[
                { zh: '我不是老师。', py: 'Wǒ bú shì lǎoshī.', uz: 'Men o\'qituvchi emasman.', ru: 'Я не учитель.' },
                { zh: '他不是中国人。', py: 'Tā bú shì Zhōngguó rén.', uz: 'U xitoylik emas.', ru: 'Он не китаец.' },
                { zh: '这不是我的书。', py: 'Zhè bú shì wǒ de shū.', uz: 'Bu mening kitobim emas.', ru: 'Это не моя книга.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. 不想 = «не хочу»' : '4. 不想 = «...gim kelmayapti»'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' '}
                <span className="grammar-block__formula-neg">不想</span>
                {' '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              {[
                { zh: '我不想吃饭。', py: 'Wǒ bù xiǎng chī fàn.', uz: 'Ovqat yegim kelmayapti.', ru: 'Я не хочу есть.' },
                { zh: '他不想去。', py: 'Tā bù xiǎng qù.', uz: 'U borishni xohlamayapti.', ru: 'Он не хочет идти.' },
                { zh: '我不想学习。', py: 'Wǒ bù xiǎng xuéxí.', uz: 'O\'qigim kelmayapti.', ru: 'Я не хочу учиться.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '5. Вопрос: Гл. + 不 + Гл.?' : '5. Savol: Fe\'l + 不 + Fe\'l?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? 'Повтор глагола с 不 = вопрос «да/нет» (альтернатива 吗):'
                  : 'Fe\'lni 不 bilan takrorlash = ha/yo\'q savoli (吗 o\'rniga):'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">你喜<span className="grammar-block__highlight">不</span>喜欢？</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'Тебе нравится или нет?' : 'Yoqtirasanmi?'}</div>
              </div>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center' }}>
                <div className="grammar-block__usage-zh">你是<span className="grammar-block__highlight">不</span>是学生？</div>
                <div className="grammar-block__usage-tr">{language === 'ru' ? 'Ты студент или нет?' : 'Sen talabamisanmi-yo\'qmi?'}</div>
              </div>
            </div>
          </>
        )}

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
              <div className="grammar-block__label">{language === 'ru' ? 'Часто используемые выражения' : 'Ko\'p ishlatiladigan iboralar'}</div>
              {[
                { phrase: '不好', py: 'bù hǎo', uz: 'yaxshi emas / yomon', ru: 'нехорошо / плохо' },
                { phrase: '不是', py: 'bú shì', uz: 'emas', ru: 'не является' },
                { phrase: '不对', py: 'bú duì', uz: 'noto\'g\'ri', ru: 'неправильно' },
                { phrase: '不想', py: 'bù xiǎng', uz: 'xohlamayman', ru: 'не хочу' },
                { phrase: '不知道', py: 'bù zhīdào', uz: 'bilmayman', ru: 'не знаю' },
                { phrase: '不喜欢', py: 'bù xǐhuan', uz: 'yoqtirmayman', ru: 'не нравится' },
                { phrase: '不客气', py: 'bú kèqi', uz: 'arzimaydi', ru: 'пожалуйста / не за что' },
                { phrase: '不用谢', py: 'bú yòng xiè', uz: 'hojat yo\'q', ru: 'не стоит благодарности' },
                { phrase: '对不起', py: 'duìbuqǐ', uz: 'kechirasiz', ru: 'извините' },
              ].map((item, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 8 ? '1px solid #f0f0f3' : 'none' }}>
                  <span className="grammar-block__usage-zh" style={{ minWidth: 64 }}>{item.phrase}</span>
                  <span className="grammar-block__usage-py" style={{ minWidth: 96 }}>{item.py}</span>
                  <span className="grammar-block__info-val">{language === 'ru' ? item.ru : item.uz}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'tone' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Правило изменения тона' : 'Ton o\'zgarishi qoidasi'}</div>
              <div className="grammar-block grammar-block--tip" style={{ margin: 0, marginBottom: 12 }}>
                <p className="grammar-block__tip-text">
                  {language === 'ru'
                    ? '不 обычно 4-й тон (bù). Если следующее слово — 4-й тон, 不 меняется на 2-й (bú).'
                    : '不 odatda 4-ton (bù). Keyingi so\'z 4-ton bo\'lsa, 不 2-tonga (bú) o\'zgaradi.'}
                </p>
                <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95em' }}>
                    {language === 'ru' ? 'Простое правило: 不 + 4-й тон = bú, всё остальное = bù' : 'Oddiy qoida: 不 + 4-ton = bú, qolgan barcha holatlarda = bù'}
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
                    <div className="grammar-block__usage-tr">{language === 'ru' ? ex.ru : ex.uz}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7em', color: '#999' }}>{language === 'ru' ? 'след. слово' : 'keyingi so\'z'}</div>
                    <div style={{ fontSize: '0.75em', fontWeight: 600, color: ex.change ? '#d97706' : '#666' }}>{language === 'ru' ? ex.tone_ru : ex.tone_uz}</div>
                    <div style={{ fontSize: '0.7em', fontWeight: 700, color: ex.change ? '#d97706' : '#16a34a' }}>{ex.change ? 'bú ↗' : 'bù ↘'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Повседневные фразы' : 'Kundalik iboralar'}</div>
              <p className="grammar-block__formula-desc" style={{ marginBottom: 10 }}>
                {language === 'ru' ? 'Эти выражения используются очень часто — выучите наизусть!' : 'Bu iboralar juda ko\'p ishlatiladi — yod oling!'}
              </p>
              {[
                { zh: '不客气', py: 'bú kèqi', uz: 'Arzimaydi / Hech gap emas', ru: 'Пожалуйста / Не за что', ctx_uz: '谢谢 ga javob', ctx_ru: 'ответ на 谢谢' },
                { zh: '对不起', py: 'duìbuqǐ', uz: 'Kechirasiz', ru: 'Извините', ctx_uz: 'Uzr so\'rash', ctx_ru: 'Извинение' },
                { zh: '不用谢', py: 'bú yòng xiè', uz: 'Hojat yo\'q', ru: 'Не стоит благодарности', ctx_uz: '谢谢 ga javob', ctx_ru: 'ответ на 谢谢' },
                { zh: '不知道', py: 'bù zhīdào', uz: 'Bilmayman', ru: 'Не знаю', ctx_uz: 'Eng ko\'p ishlatiladigan!', ctx_ru: 'Самое частое!' },
                { zh: '不好意思', py: 'bù hǎoyìsi', uz: 'Uzr / Noqulay bo\'ldim', ru: 'Неловко / Простите', ctx_uz: 'Yengil uzr', ctx_ru: 'Лёгкое извинение' },
                { zh: '不错', py: 'búcuò', uz: 'Yomon emas / Yaxshi', ru: 'Неплохо / Хорошо', ctx_uz: 'Maqtash', ctx_ru: 'Похвала' },
              ].map((w, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <div style={{ flex: 1 }}>
                    <div className="grammar-block__usage-zh">{w.zh}</div>
                    <div className="grammar-block__usage-py">{w.py}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? w.ru : w.uz}</div>
                  </div>
                  <div style={{ fontSize: '0.7em', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '3px 6px', borderRadius: 4, flexShrink: 0, textAlign: 'center', maxWidth: 90 }}>
                    {language === 'ru' ? w.ctx_ru : w.ctx_uz}
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог' : 'Mini dialog'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你喜欢喝咖啡吗？', py: 'Nǐ xǐhuan hē kāfēi ma?', uz: 'Qahva ichishni yoqtirasanmi?', ru: 'Тебе нравится пить кофе?' },
                  { speaker: 'B', zh: '我不喜欢。我喜欢喝茶。', py: 'Wǒ bù xǐhuan. Wǒ xǐhuan hē chá.', uz: 'Yoqtirmayman. Choy ichishni yoqtiraman.', ru: 'Не нравится. Мне нравится пить чай.' },
                  { speaker: 'A', zh: '想不想去咖啡店？', py: 'Xiǎng bu xiǎng qù kāfēidiàn?', uz: 'Qahvaxonaga borgingmi-yo\'qmi?', ru: 'Хочешь или нет пойти в кафе?' },
                  { speaker: 'B', zh: '好啊！他们也有茶。', py: 'Hǎo a! Tāmen yě yǒu chá.', uz: 'Bo\'pti! Ularda choy ham bor.', ru: 'Хорошо! У них тоже есть чай.' },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 10 : 0 }}>
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

      <footer className="home__footer">
        <p>{language === 'ru' ? 'Blim — Интерактивные учебники языков' : 'Blim — Interaktiv til darsliklari'}</p>
      </footer>
    </div>
  );
}
