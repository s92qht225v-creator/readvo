'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const COLOR = '#dc2626';
const COLOR_DARK = '#b91c1c';

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры' },
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  {
    zh: '你能来吗？',
    pinyin: 'Nǐ néng lái ma?',
    uz: 'Kela olasanmi?',
    ru: 'Сможешь прийти?',
    note_uz: '能 = sharoit imkon beradimi? (vaqting bormi?)',
    note_ru: '能 = позволяет ли ситуация? (есть ли время?)',
  },
  {
    zh: '我今天不能去。',
    pinyin: 'Wǒ jīntiān bù néng qù.',
    uz: 'Men bugun bora olmayman.',
    ru: 'Сегодня я не могу пойти.',
    note_uz: '不能 = sharoit imkon bermayapti (band, kasal va h.k.)',
    note_ru: '不能 = ситуация не позволяет (занят, болен и т.д.)',
  },
  {
    zh: '他能吃辣的。',
    pinyin: 'Tā néng chī là de.',
    uz: 'U achchiq ovqat yeya oladi.',
    ru: 'Он может есть острое.',
    note_uz: '能 = jismoniy qobiliyat (oshqozoni ko\'taradi)',
    note_ru: '能 = физическая способность (желудок позволяет)',
  },
  {
    zh: '你能帮我吗？',
    pinyin: 'Nǐ néng bāng wǒ ma?',
    uz: 'Menga yordam bera olasanmi?',
    ru: 'Можешь мне помочь?',
    note_uz: '能 = imkoningiz bormi? (iltimos)',
    note_ru: '能 = есть ли у тебя возможность? (просьба)',
  },
  {
    zh: '我能看见。',
    pinyin: 'Wǒ néng kàn jiàn.',
    uz: 'Men ko\'ra olaman.',
    ru: 'Я могу видеть.',
    note_uz: '能 = jismoniy imkoniyat (ko\'zim ko\'radi)',
    note_ru: '能 = физическая возможность (глаза видят)',
  },
  {
    zh: '这里不能抽烟。',
    pinyin: 'Zhèlǐ bù néng chōu yān.',
    uz: 'Bu yerda chekish mumkin emas.',
    ru: 'Здесь нельзя курить.',
    note_uz: '不能 = taqiqlangan (qoida/qonun bilan)',
    note_ru: '不能 = запрещено (правилами/законом)',
  },
  {
    zh: '他病了，不能来。',
    pinyin: 'Tā bìng le, bù néng lái.',
    uz: 'U kasal bo\'ldi, kela olmaydi.',
    ru: 'Он заболел, не может прийти.',
    note_uz: '不能 = sharoit imkon bermaydi (kasallik)',
    note_ru: '不能 = ситуация не позволяет (болезнь)',
  },
  {
    zh: '你能说慢一点吗？',
    pinyin: 'Nǐ néng shuō màn yìdiǎn ma?',
    uz: 'Sekinroq gapira olasanmi?',
    ru: 'Можешь говорить помедленнее?',
    note_uz: '能 + 吗 = muloyim iltimos (qila olasanmi?)',
    note_ru: '能 + 吗 = вежливая просьба (сможешь ли?)',
  },
];

const quizQuestions = [
  {
    q_uz: '"Men bugun bora olmayman" qanday?',
    q_ru: 'Как сказать "Сегодня я не могу пойти"?',
    options: ['我不会去', '我今天不能去', '我没能去', '能不我去'],
    correct: 1,
  },
  {
    q_uz: '能 ning asosiy ma\'nosi nima?',
    q_ru: 'Какое основное значение 能?',
    options_uz: ['O\'rganilgan mahorat', 'Sharoit/jismoniy imkoniyat', 'Xohish/niyat', 'Majburiyat'],
    options_ru: ['Выученный навык', 'Возможность/обстоятельства', 'Желание/намерение', 'Обязанность'],
    correct: 1,
  },
  {
    q_uz: '"Bu yerda chekish mumkin emas" qanday?',
    q_ru: 'Как сказать "Здесь нельзя курить"?',
    options: ['这里不会抽烟', '这里不想抽烟', '这里不能抽烟', '这里没抽烟'],
    correct: 2,
  },
  {
    q_uz: '能 qanday o\'qiladi?',
    q_ru: 'Как читается 能?',
    options_uz: ['néng (2-ton)', 'něng (3-ton)', 'nèng (4-ton)', 'nēng (1-ton)'],
    options_ru: ['néng (2-й тон)', 'něng (3-й тон)', 'nèng (4-й тон)', 'nēng (1-й тон)'],
    correct: 0,
  },
  {
    q_uz: 'Qaysi gapda 能 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 能 использован ПРАВИЛЬНО?',
    options_uz: ['我能说中文 (o\'rgangan — bu 会 bo\'lmog\'i kerak)', '他能来吗？(vaqti bormi — to\'g\'ri)', '我能游泳 (o\'rgangan — bu 会 bo\'lmog\'i kerak)', '能他来吗？(tartib xato)'],
    options_ru: ['我能说中文 (навык — нужно 会)', '他能来吗？(есть ли время — правильно)', '我能游泳 (навык — нужно 会)', '能他来吗？(неверный порядок)'],
    correct: 1,
  },
  {
    q_uz: '能 va 会 farqi nima?',
    q_ru: 'В чём разница между 能 и 会?',
    options_uz: ['Farqi yo\'q', '能=sharoit/imkoniyat, 会=mahorat', '能=kelajak, 会=o\'tgan', '能=ijobiy, 会=inkor'],
    options_ru: ['Нет разницы', '能=обстоятельства/возможность, 会=навык', '能=будущее, 会=прошедшее', '能=утверждение, 会=отрицание'],
    correct: 1,
  },
];

export function GrammarNengPage() {
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
      <div className="grammar-page__hero" style={{ background: `linear-gradient(180deg, ${COLOR} 0%, ${COLOR_DARK} 40%, #7f1d1d 100%)` }}>
        <div className="grammar-page__hero-bg">能</div>
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
          <div className="grammar-page__hero-char">能</div>
          <div className="grammar-page__hero-pinyin">néng</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'мочь (возможность)' : '...a olmoq (imkoniyat)'} —</div>
        </div>
      </div>

      <div className="grammar-page__tabs" style={{ borderBottom: `2px solid ${COLOR}` }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`grammar-page__tab ${activeTab === s.id ? 'grammar-page__tab--active' : ''}`}
            style={activeTab === s.id ? { borderBottomColor: COLOR, color: COLOR } : undefined}
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
                <div className="grammar-block__big-char" style={{ color: COLOR }}>能</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">néng</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '2-й тон (вверх ↗)' : '2-ton (pastdan yuqoriga ↗)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'мочь; иметь возможность' : '...a olmoq; imkoniyat bo\'lmoq'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">10</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Модальный глагол' : 'Modal fe\'l'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '能 — говорит о ВОЗМОЖНОСТИ. Позволяет ли ситуация, здоровье, время?'
                  : '能 — IMKONIYAT haqida gapiradi. Sharoit, sog\'liq, vaqt imkon beradimi?'}
              </p>
              <div style={{ marginTop: 8 }}>
                <div className="grammar-block__usage-item" style={{ marginBottom: 6, background: '#dcfce7', borderLeft: `3px solid ${COLOR}` }}>
                  <div style={{ fontSize: '0.7em', color: COLOR, fontWeight: 700, marginBottom: 3 }}>{language === 'ru' ? 'Время есть. Здоров.' : 'Vaqtim bor. Sog\'lom.'}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: COLOR, fontWeight: 700 }}>能</span>去。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я могу пойти.' : 'Men bora olaman.'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ background: '#fee2e2', borderLeft: '3px solid #ef4444' }}>
                  <div style={{ fontSize: '0.7em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>{language === 'ru' ? 'Занят. Болен.' : 'Bandman. Kasal.'}</div>
                  <div className="grammar-block__usage-zh">我<span style={{ color: '#ef4444', fontWeight: 700 }}>不能</span>去。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Я не могу пойти.' : 'Men bora olmayman.'}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? '⚡ Три ситуации для 能' : '⚡ 能 uchun uch holat'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 4 }}>
                {[
                  { emoji: '💪', label_uz: 'Jismoniy qobiliyat', label_ru: 'Физическая способность', sub_uz: 'ko\'zim ko\'radi, oshqozoni ko\'taradi', sub_ru: 'глаза видят, желудок выдерживает', color: COLOR },
                  { emoji: '⏰', label_uz: 'Sharoit / vaqt', label_ru: 'Обстоятельства / время', sub_uz: 'vaqtim bor, bandmasman', sub_ru: 'есть время, не занят', color: '#2563eb' },
                  { emoji: '🚫', label_uz: 'Taqiq / qoida', label_ru: 'Запрет / правило', sub_uz: 'bu yerda mumkin emas', sub_ru: 'здесь нельзя', color: '#ef4444' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: '1 1 calc(33% - 8px)', background: '#fff', border: `1px solid ${item.color}33`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2em' }}>{item.emoji}</div>
                    <div style={{ fontSize: '0.65em', fontWeight: 700, color: item.color, marginTop: 2 }}>{language === 'ru' ? item.label_ru : item.label_uz}</div>
                    <div style={{ fontSize: '0.6em', color: '#888', marginTop: 2 }}>{language === 'ru' ? item.sub_ru : item.sub_uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основное правило' : 'Asosiy qoida'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>能</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол (+ Объект)' : 'Fe\'l (+ To\'ldiruvchi)'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru'
                  ? '能 ставится перед глаголом — как и все модальные глаголы.'
                  : '能 fe\'ldan oldin qo\'yiladi — barcha modal fe\'llar kabi.'}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Физическая возможность' : '1. Jismoniy imkoniyat'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>能</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Тело/физическое состояние позволяет' : 'Tana/jismoniy holat imkon beradi'}</p>
              {[
                { zh: '我能看见。', py: 'Wǒ néng kàn jiàn.', uz: 'Men ko\'ra olaman. (ko\'zim ko\'radi)', ru: 'Я могу видеть. (глаза видят)' },
                { zh: '他能吃辣的。', py: 'Tā néng chī là de.', uz: 'U achchiq yeya oladi. (oshqozoni ko\'taradi)', ru: 'Он может есть острое. (желудок выдерживает)' },
                { zh: '她能跑很快。', py: 'Tā néng pǎo hěn kuài.', uz: 'U juda tez yugura oladi.', ru: 'Она может бегать очень быстро.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. Обстоятельства / время' : '2. Sharoit / vaqt'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Время' : 'Vaqt'}</span>
                {' + '}
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>能</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Глагол' : 'Fe\'l'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Ситуация, время, условие позволяют ли?' : 'Sharoit, vaqt, holat imkon beradimi?'}</p>
              {[
                { zh: '你明天能来吗？', py: 'Nǐ míngtiān néng lái ma?', uz: 'Ertaga kela olasanmi?', ru: 'Ты сможешь прийти завтра?' },
                { zh: '我今天不能去。', py: 'Wǒ jīntiān bù néng qù.', uz: 'Men bugun bora olmayman.', ru: 'Сегодня я не могу пойти.' },
                { zh: '下雨了，不能出去。', py: 'Xià yǔ le, bù néng chū qù.', uz: 'Yomg\'ir yog\'di, chiqa olmaymiz.', ru: 'Дождь пошёл, нельзя выходить.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. Запрет: 不能 = нельзя' : '3. Taqiqlash: 不能 = mumkin emas'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Место' : 'Joy'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不能</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Действие' : 'Harakat'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Правило / закон запрещает' : 'Qoida / qonun bilan taqiqlangan'}</p>
              {[
                { zh: '这里不能抽烟。', py: 'Zhèlǐ bù néng chōu yān.', uz: 'Bu yerda chekish mumkin emas.', ru: 'Здесь нельзя курить.' },
                { zh: '不能在这儿停车。', py: 'Bù néng zài zhèr tíng chē.', uz: 'Bu yerda mashina to\'xtata olmaysiz.', ru: 'Здесь нельзя парковаться.' },
                { zh: '上课不能用手机。', py: 'Shàng kè bù néng yòng shǒujī.', uz: 'Darsda telefon ishlata olmaysiz.', ru: 'На уроке нельзя пользоваться телефоном.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>不能</strong> vs <strong>不会</strong>:{' '}
                  {language === 'ru'
                    ? '不能 = внешняя причина (правило, болезнь, погода). 不会 = нет навыка (не учился). Разница принципиальная!'
                    : '不能 = tashqi sabab (qoida, kasallik, ob-havo). 不会 = mahorat yo\'q (o\'rganmagan). Farq katta!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. Вежливая просьба: 能...吗？' : '4. Muloyim iltimos: 能...吗？'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">你</span>
                {' + '}
                <span style={{ color: COLOR, fontWeight: 700 }}>能</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Действие' : 'Harakat'}</span>
                {' + '}
                <span className="grammar-block__formula-ma">吗？</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Просьба / вопрос — вежливая форма' : 'Iltimos / so\'rov — muloyim shakl'}</p>
              {[
                { zh: '你能帮我吗？', py: 'Nǐ néng bāng wǒ ma?', uz: 'Menga yordam bera olasanmi?', ru: 'Можешь мне помочь?' },
                { zh: '你能说慢一点吗？', py: 'Nǐ néng shuō màn yìdiǎn ma?', uz: 'Sekinroq gapira olasanmi?', ru: 'Можешь говорить помедленнее?' },
                { zh: '你能再说一次吗？', py: 'Nǐ néng zài shuō yí cì ma?', uz: 'Yana bir marta ayta olasanmi?', ru: 'Можешь сказать ещё раз?' },
                { zh: '你能等一下吗？', py: 'Nǐ néng děng yíxià ma?', uz: 'Biroz kuta olasanmi?', ru: 'Можешь немного подождать?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? '你能...吗？ — одна из самых полезных форм просьбы в китайском!'
                    : '你能...吗？ — xitoy tilida eng ko\'p ishlatiladigan iltimos shakllaridan biri!'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. Вопросы с 能' : '5. 能 bilan savollar'}</div>
              {[
                {
                  type_uz: '吗 savoli',
                  type_ru: 'Вопрос с 吗',
                  q: '你能来吗？',
                  py: 'Nǐ néng lái ma?',
                  uz: 'Kela olasanmi?',
                  ru: 'Сможешь прийти?',
                  color: COLOR,
                },
                {
                  type_uz: '能不能 savoli',
                  type_ru: 'Вопрос 能不能',
                  q: '你能不能来？',
                  py: 'Nǐ néng bu néng lái?',
                  uz: 'Kela olasan-olmasanmi?',
                  ru: 'Сможешь прийти или нет?',
                  color: '#2563eb',
                },
                {
                  type_uz: 'Savol so\'zi',
                  type_ru: 'Вопросительное слово',
                  q: '你什么时候能来？',
                  py: 'Nǐ shénme shíhou néng lái?',
                  uz: 'Qachon kela olasan?',
                  ru: 'Когда ты сможешь прийти?',
                  color: '#7c3aed',
                },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 4 }}>{language === 'ru' ? x.type_ru : x.type_uz}</div>
                  <div className="grammar-block__usage-zh" style={{ color: x.color }}>{x.q}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Встреча' : 'Mini dialog 1: Uchrashuvga taklif'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '明天你能来我家吗？', py: 'Míngtiān nǐ néng lái wǒ jiā ma?', uz: 'Ertaga uyimga kela olasanmi?', ru: 'Завтра ты сможешь прийти ко мне?' },
                  { speaker: 'B', zh: '明天不能，我很忙。', py: 'Míngtiān bù néng, wǒ hěn máng.', uz: 'Ertaga olmayman, juda bandman.', ru: 'Завтра не смогу, я очень занят.' },
                  { speaker: 'A', zh: '后天呢？后天能来吗？', py: 'Hòutiān ne? Hòutiān néng lái ma?', uz: 'Indinga-chi? Indinga kela olasanmi?', ru: 'Послезавтра? Послезавтра сможешь?' },
                  { speaker: 'B', zh: '后天能来！几点？', py: 'Hòutiān néng lái! Jǐ diǎn?', uz: 'Indinga olaman! Soat nechada?', ru: 'Послезавтра смогу! В котором часу?' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: У врача' : 'Mini dialog 2: Kasalxonada'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: '🧑‍⚕️', zh: '你不能吃辣的。', py: 'Nǐ bù néng chī là de.', uz: 'Siz achchiq ovqat yeya olmaysiz.', ru: 'Вам нельзя есть острое.' },
                  { speaker: '🤒', zh: '那我能吃什么？', py: 'Nà wǒ néng chī shénme?', uz: 'Unday bo\'lsa nima yeya olaman?', ru: 'Тогда что я могу есть?' },
                  { speaker: '🧑‍⚕️', zh: '能吃米饭和青菜。', py: 'Néng chī mǐfàn hé qīngcài.', uz: 'Guruch va sabzavot yesa bo\'ladi.', ru: 'Можно есть рис и овощи.' },
                  { speaker: '🤒', zh: '好的。能喝咖啡吗？', py: 'Hǎo de. Néng hē kāfēi ma?', uz: 'Yaxshi. Qahva ichsa bo\'ladimi?', ru: 'Хорошо. Можно пить кофе?' },
                  { speaker: '🧑‍⚕️', zh: '不能。只能喝水和茶。', py: 'Bù néng. Zhǐ néng hē shuǐ hé chá.', uz: 'Bo\'lmaydi. Faqat suv va choy ichsa bo\'ladi.', ru: 'Нельзя. Только воду и чай.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === '🧑‍⚕️' ? COLOR : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Частые сочетания с 能' : 'Foydali 能 iboralar'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '能来', py: 'néng lái', uz: 'kela olmoq', ru: 'смочь прийти' },
                  { zh: '能去', py: 'néng qù', uz: 'bora olmoq', ru: 'смочь пойти' },
                  { zh: '能吃', py: 'néng chī', uz: 'yeya olmoq', ru: 'смочь есть' },
                  { zh: '能喝', py: 'néng hē', uz: 'icha olmoq', ru: 'смочь пить' },
                  { zh: '能看', py: 'néng kàn', uz: 'ko\'ra olmoq', ru: 'смочь видеть' },
                  { zh: '能帮', py: 'néng bāng', uz: 'yordam bera olmoq', ru: 'смочь помочь' },
                  { zh: '能说', py: 'néng shuō', uz: 'ayta olmoq', ru: 'смочь сказать' },
                  { zh: '能等', py: 'néng děng', uz: 'kuta olmoq', ru: 'смочь ждать' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em', color: COLOR }}>{w.zh}</div>
                    <div className="grammar-block__usage-py">{w.py}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? w.ru : w.uz}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? '能 vs 会 vs 可以' : '能 vs 会 vs 可以'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'Все три слова — «мочь», но причина разная:'
                  : 'Uchala so\'z ham «...a olaman», lekin sababi boshqa:'}
              </p>
              {[
                {
                  word: '能', py: 'néng', color: COLOR,
                  title_uz: 'Sharoit / jismoniy imkoniyat', title_ru: 'Обстоятельства / физ. возможность',
                  desc_uz: 'Sharoit, vaqt, jismoniy holat imkon beradi.',
                  desc_ru: 'Ситуация, время, физическое состояние позволяют.',
                  ex: '我今天能去。', py_ex: 'Wǒ jīntiān néng qù.',
                  uz: 'Bugun bora olaman. (vaqtim bor)', ru: 'Сегодня могу пойти. (есть время)',
                },
                {
                  word: '会', py: 'huì', color: '#0891b2',
                  title_uz: 'Mahorat (o\'rganib olgan)', title_ru: 'Навык (приобретённый)',
                  desc_uz: 'O\'rganib, mashq qilib olgan ko\'nikma.',
                  desc_ru: 'Освоенный, натренированный навык.',
                  ex: '我会游泳。', py_ex: 'Wǒ huì yóuyǒng.',
                  uz: 'Men suza olaman. (o\'rgangan)', ru: 'Я умею плавать. (научился)',
                },
                {
                  word: '可以', py: 'kěyǐ', color: '#7c3aed',
                  title_uz: 'Ruxsat / mumkin', title_ru: 'Разрешение / дозволено',
                  desc_uz: 'Ijozat, ruxsat, qoidaga muvofiq.',
                  desc_ru: 'Позволено, разрешено, допустимо.',
                  ex: '这里可以坐。', py_ex: 'Zhèlǐ kěyǐ zuò.',
                  uz: 'Bu yerda o\'tirsa bo\'ladi. (ruxsat)', ru: 'Здесь можно сесть. (разрешено)',
                },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #e0e0e6', borderLeftWidth: 4, borderLeftColor: r.color, borderLeftStyle: 'solid' as const }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color: r.color, minWidth: 36 }}>{r.word}</div>
                    <div>
                      <div style={{ fontSize: '0.8em', fontWeight: 700, color: r.color }}>{r.py} — {language === 'ru' ? r.title_ru : r.title_uz}</div>
                      <div style={{ fontSize: '0.72em', color: '#666' }}>{language === 'ru' ? r.desc_ru : r.desc_uz}</div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-item">
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-py">{r.py_ex}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? r.ru : r.uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '"Умею плавать" — три смысла' : '"Suza olaman" — uch xil ma\'no'}</div>
              {[
                { ex: '我会游泳。', label_uz: '会 — o\'rgangan (mahorat bor)', label_ru: '会 — навык (научился)', color: '#0891b2' },
                { ex: '我今天能游泳。', label_uz: '能 — sharoit imkon beradi (shifokor ruxsat berdi)', label_ru: '能 — условие позволяет (врач разрешил)', color: COLOR },
                { ex: '这里可以游泳。', label_uz: '可以 — bu yerda suzsa bo\'ladi (ruxsat bor)', label_ru: '可以 — здесь разрешено плавать', color: '#7c3aed' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginBottom: 6, borderLeft: `3px solid ${x.color}`, paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.7em', fontWeight: 600, color: x.color, marginBottom: 3 }}>{language === 'ru' ? x.label_ru : x.label_uz}</div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Разница в отрицании' : 'Inkor farqlari'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'Каждое отрицание имеет свой смысл:'
                  : 'Har birining inkori boshqa ma\'no beradi:'}
              </p>
              {[
                {
                  neg: '不能', color: COLOR,
                  meaning_uz: 'Sharoit imkon bermaydi', meaning_ru: 'Ситуация не позволяет',
                  ex: '他病了，不能来。', ex_uz: 'U kasal, kela olmaydi.', ex_ru: 'Он болен, не может прийти.',
                },
                {
                  neg: '不会', color: '#0891b2',
                  meaning_uz: 'Mahorat yo\'q (o\'rganmagan)', meaning_ru: 'Нет навыка (не учился)',
                  ex: '他不会游泳。', ex_uz: 'U suza olmaydi (bilmaydi).', ex_ru: 'Он не умеет плавать.',
                },
                {
                  neg: '不可以', color: '#7c3aed',
                  meaning_uz: 'Ruxsat yo\'q / taqiqlangan', meaning_ru: 'Нет разрешения / запрещено',
                  ex: '这里不可以停车。', ex_uz: 'Bu yerda to\'xtash mumkin emas.', ex_ru: 'Здесь нельзя парковаться.',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f5f5f8', borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: `3px solid ${x.color}` }}>
                  <div style={{ fontSize: '1em', fontWeight: 700, color: x.color, minWidth: 52, textAlign: 'center', paddingTop: 2 }}>{x.neg}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72em', fontWeight: 600, color: x.color, marginBottom: 2 }}>{language === 'ru' ? x.meaning_ru : x.meaning_uz}</div>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{x.ex}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.ex_ru : x.ex_uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '能 и 可以 — когда взаимозаменяемы' : '能 va 可以 — almashtirilishi mumkin hollar'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'Иногда 能 и 可以 взаимозаменяемы, но нюанс остаётся:'
                  : 'Ba\'zi holatlarda 能 va 可以 o\'rniga almashadi, lekin nozik farq saqlanadi:'}
              </p>
              {[
                {
                  neng: '你能帮我吗？', neng_uz: 'Yordam bera olasanmi? (imkoning bormi?)', neng_ru: 'Можешь помочь? (есть ли возможность?)',
                  keyi: '你可以帮我吗？', keyi_uz: 'Yordam bersa bo\'ladimi? (tayyormisan?)', keyi_ru: 'Можно тебя попросить помочь? (готов ли?)',
                },
                {
                  neng: '这里不能抽烟。', neng_uz: 'Chekish mumkin emas. (qat\'iy)', neng_ru: 'Здесь нельзя курить. (строго)',
                  keyi: '这里不可以抽烟。', keyi_uz: 'Cheksa bo\'lmaydi. (qoida)', keyi_ru: 'Здесь нельзя курить. (правило)',
                },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <div style={{ fontSize: '0.65em', color: COLOR, fontWeight: 700, marginBottom: 2 }}>能</div>
                    <div className="grammar-block__usage-zh">{x.neng}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.neng_ru : x.neng_uz}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontSize: '0.65em', color: '#7c3aed', fontWeight: 700, marginBottom: 2 }}>可以</div>
                    <div className="grammar-block__usage-zh">{x.keyi}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.keyi_ru : x.keyi_uz}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'Запомните: 不能 = категорически нельзя. 不可以 = по правилам нельзя. 不能 звучит строже.'
                    : 'Eslab qoling: 不能 = mutlaqo mumkin emas. 不可以 = qoida bilan taqiqlangan. 不能 kuchliroq eshitiladi.'}
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
