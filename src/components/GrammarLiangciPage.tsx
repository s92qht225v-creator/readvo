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
  { id: 'list', uz: 'Jadval', ru: 'Таблица' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  {
    zh: '一个人', pinyin: 'yí ge rén',
    uz: 'bitta odam', ru: 'один человек',
    note_uz: '个 = eng universal sanash so\'zi. Qaysi sanash so\'zini bilmasangiz — 个 ishlating!',
    note_ru: '个 = самое универсальное СС. Не знаете какое — используйте 个!',
  },
  {
    zh: '两本书', pinyin: 'liǎng běn shū',
    uz: 'ikkita kitob', ru: 'две книги',
    note_uz: '本 = kitob, daftar, jurnal uchun. 两 (ikki) — 二 emas!',
    note_ru: '本 = для книг, тетрадей, журналов. 两 (два) — не 二!',
  },
  {
    zh: '三杯茶', pinyin: 'sān bēi chá',
    uz: 'uchta (stakan) choy', ru: 'три чашки чая',
    note_uz: '杯 = stakan, piyola — ichimliklar uchun',
    note_ru: '杯 = стакан, чашка — для напитков',
  },
  {
    zh: '这件衣服很好看。', pinyin: 'Zhè jiàn yīfu hěn hǎokàn.',
    uz: 'Bu kiyim chiroyli.', ru: 'Эта одежда красивая.',
    note_uz: '件 = kiyim, ishlar uchun. 这件 = bu (kiyim)',
    note_ru: '件 = для одежды, дел. 这件 = эта (одежда)',
  },
  {
    zh: '我有一只猫。', pinyin: 'Wǒ yǒu yì zhī māo.',
    uz: 'Mening bitta mushugim bor.', ru: 'У меня есть кошка.',
    note_uz: '只 = kichik hayvonlar uchun (mushuk, it, qush)',
    note_ru: '只 = для небольших животных (кошка, собака, птица)',
  },
  {
    zh: '五块钱', pinyin: 'wǔ kuài qián',
    uz: 'besh yuan', ru: 'пять юаней',
    note_uz: '块 = pul birligi (yuan). Og\'zaki nutqda 元 o\'rniga 块',
    note_ru: '块 = денежная единица (юань). В разговоре вместо 元',
  },
  {
    zh: '请给我一杯水。', pinyin: 'Qǐng gěi wǒ yì bēi shuǐ.',
    uz: 'Menga bir stakan suv bering.', ru: 'Пожалуйста, дайте мне стакан воды.',
    note_uz: '杯 = stakan/piyola — suv, choy, qahva uchun',
    note_ru: '杯 = стакан/чашка — для воды, чая, кофе',
  },
  {
    zh: '那辆车是我的。', pinyin: 'Nà liàng chē shì wǒ de.',
    uz: 'Anavi mashina meniki.', ru: 'Та машина — моя.',
    note_uz: '辆 = transport vositalari uchun (mashina, velosiped)',
    note_ru: '辆 = для транспортных средств (машина, велосипед)',
  },
];

const mwList = [
  { mw: '个', py: 'ge', uz: 'ta', ru: 'штука', use_uz: 'Odamlar, narsalar — UNIVERSAL', use_ru: 'Люди, предметы — УНИВЕРСАЛЬНОЕ', examples: '一个人、一个苹果、一个朋友', color: '#ef4444' },
  { mw: '本', py: 'běn', uz: 'ta (kitob)', ru: 'штука (книга)', use_uz: 'Kitoblar, daftarlar, jurnallar', use_ru: 'Книги, тетради, журналы', examples: '一本书、一本词典、两本杂志', color: '#f59e0b' },
  { mw: '杯', py: 'bēi', uz: 'stakan/piyola', ru: 'стакан/чашка', use_uz: 'Ichimliklar (stakan/piyolada)', use_ru: 'Напитки (в стакане/чашке)', examples: '一杯水、一杯茶、两杯咖啡', color: '#059669' },
  { mw: '块', py: 'kuài', uz: 'yuan (pul)', ru: 'юань (деньги)', use_uz: 'Pul (yuan) — og\'zaki nutqda', use_ru: 'Деньги (юань) — в разговоре', examples: '五块钱、十块、一百块', color: '#d97706' },
  { mw: '岁', py: 'suì', uz: 'yosh', ru: 'лет (возраст)', use_uz: 'Yosh (necha yoshda)', use_ru: 'Возраст (сколько лет)', examples: '五岁、二十岁、几岁', color: '#7c3aed' },
  { mw: '口', py: 'kǒu', uz: 'kishi (oila)', ru: 'человек (семья)', use_uz: 'Oila a\'zolari', use_ru: 'Члены семьи', examples: '三口人、五口人、几口人', color: '#0891b2' },
  { mw: '只', py: 'zhī', uz: 'ta (hayvon)', ru: 'штука (животное)', use_uz: 'Kichik hayvonlar (mushuk, it, qush)', use_ru: 'Небольшие животные (кошка, собака, птица)', examples: '一只猫、两只狗、三只鸟', color: '#e11d48' },
  { mw: '件', py: 'jiàn', uz: 'ta (kiyim/ish)', ru: 'штука (одежда/дело)', use_uz: 'Kiyimlar, ishlar, hodisalar', use_ru: 'Одежда, дела, события', examples: '一件衣服、一件事、两件', color: '#4f46e5' },
  { mw: '辆', py: 'liàng', uz: 'ta (transport)', ru: 'штука (транспорт)', use_uz: 'Transport vositalari', use_ru: 'Транспортные средства', examples: '一辆车、一辆出租车', color: '#059669' },
  { mw: '些', py: 'xiē', uz: 'bir necha', ru: 'несколько', use_uz: 'Noma\'lum miqdor (biroz, ba\'zi)', use_ru: 'Неопределённое количество (немного, некоторые)', examples: '一些水、一些人、这些书', color: '#dc2626' },
  { mw: '张', py: 'zhāng', uz: 'ta (yassi)', ru: 'штука (плоское)', use_uz: 'Yassi narsalar (stol, qog\'oz, chiqim)', use_ru: 'Плоские предметы (стол, бумага, билет)', examples: '一张桌子、一张纸、两张票', color: '#2563eb' },
  { mw: '条', py: 'tiáo', uz: 'ta (uzun)', ru: 'штука (длинное)', use_uz: 'Uzun narsalar (ko\'cha, baliq, shimlar)', use_ru: 'Длинные предметы (дорога, рыба, брюки)', examples: '一条路、一条鱼、一条裤子', color: '#b45309' },
];

const quizQuestions = [
  {
    q_uz: '"Ikkita kitob" xitoycha qanday?',
    q_ru: 'Как сказать "две книги" по-китайски?',
    options: ['二个书', '两本书', '二本书', '两个书'],
    correct: 1,
  },
  {
    q_uz: 'Qaysi sanash so\'zi eng universal?',
    q_ru: 'Какое СС самое универсальное?',
    options: ['本', '杯', '个', '块'],
    correct: 2,
  },
  {
    q_uz: 'Mushuk uchun qaysi sanash so\'zi ishlatiladi?',
    q_ru: 'Какое СС используется для кошки?',
    options: ['个', '条', '只', '件'],
    correct: 2,
  },
  {
    q_uz: '"Uch stakan choy" qanday?',
    q_ru: 'Как сказать "три чашки чая"?',
    options: ['三个茶', '三杯茶', '三块茶', '三本茶'],
    correct: 1,
  },
  {
    q_uz: 'Sanash so\'zi qayerda turadi?',
    q_ru: 'Где стоит счётное слово?',
    options_uz: ['Otdan keyin', 'Son va ot orasida', 'Gap oxirida', 'Egadan oldin'],
    options_ru: ['После существительного', 'Между числом и существительным', 'В конце предложения', 'Перед подлежащим'],
    correct: 1,
  },
  {
    q_uz: '这/那 bilan sanash so\'zi kerakmi?',
    q_ru: 'Нужно ли СС с 这/那?',
    options_uz: ['Yo\'q, hech qachon', 'Ha, 这/那 + 量词 + ot', 'Faqat 这 bilan', 'Faqat ko\'plikda'],
    options_ru: ['Нет, никогда', 'Да, 这/那 + СС + сущ.', 'Только с 这', 'Только во множественном числе'],
    correct: 1,
  },
];

export function GrammarLiangciPage() {
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
        <div className="grammar-page__hero-bg">量</div>
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
          <div className="grammar-page__hero-char">量词</div>
          <div className="grammar-page__hero-pinyin">liàngcí</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'счётные слова' : 'sanash so\'zlari'} —</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Что такое 量词?' : '量词 nima?'}</div>
              <div className="grammar-block__tip-text">
                <b style={{ color: COLOR }}>量词 (liàngcí)</b> — {language === 'ru'
                  ? 'специальное слово, которое ставится между числом и существительным. В китайском нельзя просто сказать «три книги» — нужно счётное слово!'
                  : 'son va ot orasiga qo\'yiladigan maxsus so\'z. Xitoy tilida shunchaki «uchta kitob» deb bo\'lmaydi — sanash so\'zi kerak!'}
              </div>
              <div style={{ textAlign: 'center', margin: '12px 0' }}>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>
                  {language === 'ru' ? 'По-русски: три книги' : 'O\'zbekcha: uch'}<b style={{ color: COLOR }}>{language === 'ru' ? '' : 'ta'}</b>{language === 'ru' ? '' : ' kitob'}
                </div>
                <div style={{ fontSize: 20, color: '#1a1a2e', letterSpacing: 2 }}>
                  <span style={{ color: '#2563eb' }}>三</span>
                  <span style={{ color: COLOR, fontWeight: 700 }}> 本 </span>
                  <span style={{ color: '#1a1a2e' }}>书</span>
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>sān <b>běn</b> shū</div>
              </div>
              <p className="grammar-block__tip-note">
                {language === 'ru'
                  ? 'В русском тоже есть счётные слова: «три штуки», «два стакана», «пять голов скота». В китайском это обязательно для всех существительных!'
                  : 'O\'zbek tilida ham «ta» bor — lekin xitoy tilida har bir ot turi uchun boshqa sanash so\'zi!'}
              </p>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Основная формула' : 'Asosiy formula'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{language === 'ru' ? 'Число' : 'Son'}</span>
                {' + '}
                <span className="grammar-block__formula-verb">{language === 'ru' ? 'СС' : '量词'}</span>
                {' + '}
                <span style={{ color: '#1a1a2e' }}>{language === 'ru' ? 'Сущ' : 'Ot'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru' ? 'Число → Счётное слово → Существительное. Порядок неизменен!' : 'Son → Sanash so\'zi → Ot. Bu tartib o\'zgarmas!'}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Где нужно СС?' : 'Sanash so\'zi qayerda kerak?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru' ? 'СС нужно везде, где есть число или указатель:' : 'Sanash so\'zi son yoki ko\'rsatish olmoshi bilan hamma joyda kerak:'}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 8 }}>
                {[
                  { label_uz: 'Sanash', label_ru: 'Счёт', ex: '三个人', color: '#ef4444' },
                  { label_uz: '这/那', label_ru: '这/那', ex: '这本书', color: '#2563eb' },
                  { label_uz: '几', label_ru: '几', ex: '几杯？', color: '#7c3aed' },
                  { label_uz: '一 + 量词', label_ru: '一 + СС', ex: '一件事', color: '#059669' },
                ].map((f, i) => (
                  <div key={i} style={{
                    flex: '1 1 45%', background: '#f5f5f8', borderRadius: 8, padding: 8, textAlign: 'center',
                    border: `1px solid ${f.color}33`,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: f.color }}>{language === 'ru' ? f.label_ru : f.label_uz}</div>
                    <div style={{ fontSize: 16, color: '#1a1a2e', marginTop: 2 }}>{f.ex}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? '💡 Не знаете — используйте 个!' : '💡 Bilmasangiz — 个 ishlating!'}</div>
              <p className="grammar-block__tip-text">
                <b style={{ color: COLOR, fontSize: 20 }}>个</b> (ge) — {language === 'ru' ? 'самое универсальное СС. Если не знаете нужное — используйте 个, китайцы поймут!' : 'eng universal sanash so\'zi. Agar to\'g\'ri sanash so\'zini bilmasangiz — 个 ishlatavering. Xitoyliklar tushunadi!'}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {[
                  { label_uz: '✓ IDEAL', label_ru: '✓ ИДЕАЛЬНО', ex: '一本书', note_uz: 'aniq sanash so\'zi', note_ru: 'точное СС', color: '#16a34a' },
                  { label_uz: '✓ HAM BO\'LADI', label_ru: '✓ ТОЖЕ МОЖНО', ex: '一个书', note_uz: 'universal sanash so\'zi', note_ru: 'универсальное СС', color: '#f59e0b' },
                  { label_uz: '✗ XATO', label_ru: '✗ ОШИБКА', ex: '一书', note_uz: 'Sanash so\'zi yo\'q!', note_ru: 'нет СС!', color: '#ef4444', strike: true },
                ].map((x, i) => (
                  <div key={i} style={{ flex: 1, background: '#fff8', borderRadius: 8, padding: 8, textAlign: 'center', border: `1px solid ${x.color}33` }}>
                    <div style={{ fontSize: 9, color: x.color, fontWeight: 700, marginBottom: 3 }}>{language === 'ru' ? x.label_ru : x.label_uz}</div>
                    <div style={{ fontSize: 15, textDecoration: x.strike ? 'line-through' : 'none' }}>{x.ex}</div>
                    <div style={{ fontSize: 9, color: '#888' }}>{language === 'ru' ? x.note_ru : x.note_uz}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Число + СС + Существительное' : '1. Son + 量词 + Ot'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{language === 'ru' ? 'Чис' : 'Son'}</span>
                {' + '}
                <span className="grammar-block__formula-verb">{language === 'ru' ? 'СС' : '量词'}</span>
                {' + '}
                <span style={{ color: '#1a1a2e' }}>{language === 'ru' ? 'Сущ' : 'Ot'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Считаем предметы' : 'Narsalarni sanash'}</p>
              {[
                { ex: '一个人', py: 'yí ge rén', uz: 'bitta odam', ru: 'один человек', mw: '个' },
                { ex: '两本书', py: 'liǎng běn shū', uz: 'ikkita kitob', ru: 'две книги', mw: '本' },
                { ex: '三杯水', py: 'sān bēi shuǐ', uz: 'uch stakan suv', ru: 'три стакана воды', mw: '杯' },
                { ex: '五块钱', py: 'wǔ kuài qián', uz: 'besh yuan', ru: 'пять юаней', mw: '块' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ background: `${COLOR}15`, borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, color: COLOR }}>
                      量词: {x.mw}
                    </span>
                  </div>
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--warning" style={{ marginTop: 8 }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <b>{language === 'ru' ? '两 vs 二:' : '两 vs 二:'}</b>{' '}
                  {language === 'ru'
                    ? '«Два предмета» = 两 (liǎng) + СС. 二 (èr) — только как цифра (12, 20, 200...).'
                    : '«Ikkita narsa» = 两 (liǎng) + sanash so\'zi. 二 (èr) faqat raqam sifatida (12, 20, 200...).'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. 这/那 + СС + Существительное' : '2. 这/那 + 量词 + Ot'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>这/那</span>
                {' + '}
                <span className="grammar-block__formula-verb">{language === 'ru' ? 'СС' : '量词'}</span>
                {' + '}
                <span style={{ color: '#1a1a2e' }}>{language === 'ru' ? 'Сущ' : 'Ot'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru' ? 'Этот / тот — с указательными местоимениями' : 'Bu / anavi — ko\'rsatish olmoshi bilan'}
              </p>
              {[
                { ex: '这个人', py: 'zhège rén', uz: 'bu odam', ru: 'этот человек', note_uz: '这 + 个 = bu (odam)', note_ru: '这 + 个 = этот (человек)' },
                { ex: '那本书', py: 'nà běn shū', uz: 'anavi kitob', ru: 'та книга', note_uz: '那 + 本 = anavi (kitob)', note_ru: '那 + 本 = та (книга)' },
                { ex: '这杯茶', py: 'zhè bēi chá', uz: 'bu (stakan) choy', ru: 'эта чашка чая', note_uz: '这 + 杯 = bu (stakan choy)', note_ru: '这 + 杯 = эта (чашка чая)' },
                { ex: '那件衣服', py: 'nà jiàn yīfu', uz: 'anavi kiyim', ru: 'та одежда', note_uz: '那 + 件 = anavi (kiyim)', note_ru: '那 + 件 = та (одежда)' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                  <div className="grammar-block__usage-note">💡 {language === 'ru' ? x.note_ru : x.note_uz}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 <b>这/那</b> {language === 'ru' ? 'тоже требуют СС!' : 'bilan ham sanash so\'zi majburiy!'} 这书 ✗ → 这<b>本</b>书 ✓
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. 几 + СС + Существительное (вопрос)' : '3. 几 + 量词 + Ot (savol)'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#4f46e5', fontWeight: 700 }}>几</span>
                {' + '}
                <span className="grammar-block__formula-verb">{language === 'ru' ? 'СС' : '量词'}</span>
                {' + '}
                <span style={{ color: '#1a1a2e' }}>{language === 'ru' ? 'Сущ' : 'Ot'}</span>
                {' ？'}
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'Сколько? — спрашиваем количество' : 'Nechta? — sonni so\'rash'}</p>
              {[
                { ex: '几个人？', py: 'Jǐ ge rén?', uz: 'Nechta odam?', ru: 'Сколько человек?' },
                { ex: '几杯咖啡？', py: 'Jǐ bēi kāfēi?', uz: 'Nechta qahva?', ru: 'Сколько чашек кофе?' },
                { ex: '几本书？', py: 'Jǐ běn shū?', uz: 'Nechta kitob?', ru: 'Сколько книг?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. 一 + СС = «один» (обобщённо)' : '4. 一 + 量词 = «bitta» (umumlashgan)'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '一 + СС часто означает «один/какой-то» — не точное число, а обобщение:'
                  : '一 + 量词 ko\'pincha «biror» ma\'nosida — aniq son emas, umumiy:'}
              </p>
              {[
                { ex: '我有一个问题。', py: 'Wǒ yǒu yí ge wèntí.', uz: 'Mening bitta savolim bor.', ru: 'У меня есть один вопрос.' },
                { ex: '给我一杯水。', py: 'Gěi wǒ yì bēi shuǐ.', uz: 'Menga bir stakan suv bering.', ru: 'Дайте мне стакан воды.' },
                { ex: '他是一个好人。', py: 'Tā shì yí ge hǎo rén.', uz: 'U yaxshi odam.', ru: 'Он хороший человек.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. 些 — неопределённое количество' : '5. 些 — noma\'lum miqdor (biroz/ba\'zi)'}</div>
              <div className="grammar-block__formula">
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>一/这/那</span>
                {' + '}
                <span className="grammar-block__formula-verb">些</span>
                {' + '}
                <span style={{ color: '#1a1a2e' }}>{language === 'ru' ? 'Сущ' : 'Ot'}</span>
              </div>
              {[
                { ex: '一些水', py: 'yìxiē shuǐ', uz: 'biroz suv', ru: 'немного воды' },
                { ex: '这些人', py: 'zhèxiē rén', uz: 'bu odamlar (bular)', ru: 'эти люди' },
                { ex: '那些书', py: 'nàxiē shū', uz: 'anavi kitoblar', ru: 'те книги' },
                { ex: '有一些问题。', py: 'Yǒu yìxiē wèntí.', uz: 'Ba\'zi muammolar bor.', ru: 'Есть некоторые проблемы.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item">
                  <div className="grammar-block__usage-zh">{x.ex}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <p className="grammar-block__tip-note">
                💡 <b>些</b> = {language === 'ru' ? 'неопределённое количество.' : 'noaniq miqdor.'}{' '}
                <b>这些</b> = {language === 'ru' ? 'эти,' : 'bular,'}{' '}
                <b>那些</b> = {language === 'ru' ? 'те — выражают множественное число!' : 'anular — ko\'plik ko\'rsatadi!'}
              </p>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Диалог: В кафе' : 'Mini dialog 1: Kaféda'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', color: '#2563eb', zh: '你好！要喝什么？', py: 'Nǐ hǎo! Yào hē shénme?', uz: 'Salom! Nima ichsiz?', ru: 'Здравствуйте! Что будете пить?' },
                  { speaker: 'B', color: COLOR, zh: '两杯咖啡，一杯茶。', py: 'Liǎng bēi kāfēi, yì bēi chá.', uz: 'Ikkita qahva, bitta choy.', ru: 'Два кофе, один чай.' },
                  { speaker: 'A', color: '#2563eb', zh: '好的。还要别的吗？', py: 'Hǎo de. Hái yào bié de ma?', uz: 'Bo\'pti. Yana boshqa nima?', ru: 'Хорошо. Что-то ещё?' },
                  { speaker: 'B', color: COLOR, zh: '再要三块蛋糕。多少钱？', py: 'Zài yào sān kuài dàngāo. Duōshǎo qián?', uz: 'Yana uchta tort. Qancha turadi?', ru: 'Ещё три пирожных. Сколько стоит?' },
                  { speaker: 'A', color: '#2563eb', zh: '一共八十五块。', py: 'Yígòng bāshíwǔ kuài.', uz: 'Jami sakson besh yuan.', ru: 'Итого восемьдесят пять юаней.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: line.color }}>{line.speaker}:</span>
                      <span style={{ fontSize: 16, color: '#1a1a2e' }}>{line.zh}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#4338ca', marginLeft: 20 }}>{line.py}</div>
                    <div style={{ fontSize: 10, color: '#888', marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Диалог: В библиотеке' : 'Mini dialog 2: Kutubxonada'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', color: '#2563eb', zh: '你要借几本书？', py: 'Nǐ yào jiè jǐ běn shū?', uz: 'Nechta kitob olmoqchisan?', ru: 'Сколько книг хочешь взять?' },
                  { speaker: 'B', color: COLOR, zh: '三本。这本和那两本。', py: 'Sān běn. Zhè běn hé nà liǎng běn.', uz: 'Uchta. Bu va anavi ikkita.', ru: 'Три. Эту и те две.' },
                  { speaker: 'A', color: '#2563eb', zh: '好。你还有几本没还？', py: 'Hǎo. Nǐ hái yǒu jǐ běn méi huán?', uz: 'Yaxshi. Hali nechta qaytarmagan kitobing bor?', ru: 'Хорошо. Сколько книг у тебя не возвращено?' },
                  { speaker: 'B', color: COLOR, zh: '一本，明天还。', py: 'Yì běn, míngtiān huán.', uz: 'Bitta, ertaga qaytaraman.', ru: 'Одна, завтра верну.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: line.color }}>{line.speaker}:</span>
                      <span style={{ fontSize: 16, color: '#1a1a2e' }}>{line.zh}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#4338ca', marginLeft: 20 }}>{line.py}</div>
                    <div style={{ fontSize: 10, color: '#888', marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? 'Типичные ошибки' : 'Ko\'p uchraydigan xatolar'}</div>
              {[
                { wrong: '三书', right: '三本书', note_uz: 'Sanash so\'zi tushib qolgan!', note_ru: 'Пропущено СС!' },
                { wrong: '这书', right: '这本书', note_uz: '这 dan keyin sanash so\'zi kerak!', note_ru: 'После 这 нужно СС!' },
                { wrong: '二个人', right: '两个人', note_uz: 'Sanash so\'zi bilan 两 ishlatiladi, 二 emas!', note_ru: 'С СС используется 两, не 二!' },
                { wrong: '一些个问题', right: '一些问题', note_uz: '些 o\'zi sanash so\'zi — yana sanash so\'zi qo\'shmang!', note_ru: '些 уже СС — не добавляйте ещё одно!' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <div style={{ flex: 1, background: '#fee2e2', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {language === 'ru' ? 'ОШИБКА' : 'XATO'}</div>
                    <div style={{ fontSize: 13, color: '#1a1a2e', textDecoration: 'line-through' }}>{x.wrong}</div>
                  </div>
                  <div style={{ flex: 1, background: '#dcfce7', borderRadius: 8, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {language === 'ru' ? 'ПРАВИЛЬНО' : 'TO\'G\'RI'}</div>
                    <div style={{ fontSize: 13, color: '#1a1a2e' }}>{x.right}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 3 }}>{language === 'ru' ? x.note_ru : x.note_uz}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── LIST ── */}
        {activeTab === 'list' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Таблица 量词 для HSK 1' : 'HSK 1 量词 to\'liq jadvali'}</div>
              {mwList.map((mw, i) => (
                <div key={i} style={{
                  background: '#f5f5f8', borderRadius: 8, padding: 10, marginBottom: 6,
                  borderLeftWidth: 3, borderLeftColor: mw.color, borderLeftStyle: 'solid' as const,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: mw.color, minWidth: 36, textAlign: 'center' }}>{mw.mw}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{mw.py}</span>
                        <span style={{ fontSize: 10, color: '#888' }}>= {language === 'ru' ? mw.ru : mw.uz}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#555' }}>{language === 'ru' ? mw.use_ru : mw.use_uz}</div>
                    </div>
                  </div>
                  <div style={{ background: '#fff8', borderRadius: 6, padding: 6, fontSize: 13, color: '#1a1a2e', letterSpacing: 1 }}>
                    {mw.examples}
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Как выбрать СС?' : 'Sanash so\'zi tanlash yo\'l xaritasi'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru' ? 'Смотрите на форму и тип предмета:' : 'Qanday sanash so\'zi tanlash kerak? Shakl va turga qarang:'}
              </p>
              <div style={{ marginTop: 8, fontSize: 11 }}>
                {[
                  { q_uz: 'Odam, narsa?', q_ru: 'Человек, предмет?', a: '个 (universal)', color: '#ef4444' },
                  { q_uz: 'Kitob, daftar?', q_ru: 'Книга, тетрадь?', a: '本', color: '#f59e0b' },
                  { q_uz: 'Ichimlik (stakanda)?', q_ru: 'Напиток (в стакане)?', a: '杯', color: '#059669' },
                  { q_uz: 'Pul (yuan)?', q_ru: 'Деньги (юань)?', a: '块', color: '#d97706' },
                  { q_uz: 'Kiyim, hodisa?', q_ru: 'Одежда, событие?', a: '件', color: '#4f46e5' },
                  { q_uz: 'Kichik hayvon?', q_ru: 'Маленькое животное?', a: '只', color: '#e11d48' },
                  { q_uz: 'Transport?', q_ru: 'Транспорт?', a: '辆', color: '#059669' },
                  { q_uz: 'Yassi narsa (stol, qog\'oz)?', q_ru: 'Плоский предмет (стол, бумага)?', a: '张', color: '#2563eb' },
                  { q_uz: 'Uzun narsa (ko\'cha, baliq)?', q_ru: 'Длинный предмет (дорога, рыба)?', a: '条', color: '#b45309' },
                  { q_uz: 'Bilmayman!', q_ru: 'Не знаю!', a: language === 'ru' ? '个 — можно! ✓' : '个 ishlating! ✓', color: '#16a34a' },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 0', borderBottom: i < 9 ? '1px solid #f0f0f3' : 'none',
                  }}>
                    <span style={{ flex: 1, color: '#555' }}>{language === 'ru' ? r.q_ru : r.q_uz}</span>
                    <span style={{ fontWeight: 700, color: r.color }}>→ {r.a}</span>
                  </div>
                ))}
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
                  <p className="grammar-quiz__q">{qi + 1}. {language === 'ru' ? q.q_ru : q.q_uz}</p>
                  <div className="grammar-quiz__options">
                    {opts.map((opt, ai) => {
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
