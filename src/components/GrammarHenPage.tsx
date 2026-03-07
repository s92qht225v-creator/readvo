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
  { id: 'compare', uz: 'Taqqoslash', ru: 'Сравнение' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест' },
];

const examples = [
  { zh: '她很漂亮。', pinyin: 'Tā hěn piàoliang.', uz: 'U chiroyli.', ru: 'Она красивая.', note_uz: '很 bu yerda «juda» emas — shunchaki ega + sifatni bog\'lovchi. Neytral ma\'no.', note_ru: '很 здесь не «очень» — просто нейтральная связка между подлежащим и прилагательным.' },
  { zh: '今天很冷。', pinyin: 'Jīntiān hěn lěng.', uz: 'Bugun sovuq.', ru: 'Сегодня холодно.', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq → 很 = neytral bog\'lovchi', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный → 很 = нейтральная связка' },
  { zh: '这本书很好。', pinyin: 'Zhè běn shū hěn hǎo.', uz: 'Bu kitob yaxshi.', ru: 'Эта книга хорошая.', note_uz: '很好 = yaxshi (oddiy holat). Agar ta\'kidlash kerak: 非常好 yoki 真好', note_ru: '很好 = хорошо (нейтрально). Для усиления: 非常好 или 真好' },
  { zh: '他很高。', pinyin: 'Tā hěn gāo.', uz: 'U baland bo\'yli.', ru: 'Он высокий.', note_uz: '很高 = baland (neytral). Taqqoslash emas — shunchaki sifat.', note_ru: '很高 = высокий (нейтрально). Не сравнение — просто признак.' },
  { zh: '中国菜很好吃。', pinyin: 'Zhōngguó cài hěn hǎo chī.', uz: 'Xitoy ovqati mazali.', ru: 'Китайская еда вкусная.', note_uz: '好吃 (hǎo chī) = mazali → 很好吃 = mazali (neytral)', note_ru: '好吃 (hǎo chī) = вкусный → 很好吃 = вкусный (нейтрально)' },
  { zh: '我很忙。', pinyin: 'Wǒ hěn máng.', uz: 'Men bandman.', ru: 'Я занят.', note_uz: '很忙 = band (neytral). Juda band = 非常忙 yoki 太忙了', note_ru: '很忙 = занят (нейтрально). Очень занят = 非常忙 или 太忙了' },
  { zh: '学中文很有意思。', pinyin: 'Xué Zhōngwén hěn yǒu yìsi.', uz: 'Xitoycha o\'rganish qiziqarli.', ru: 'Учить китайский интересно.', note_uz: '有意思 = qiziqarli → bu yerda 很 = neytral', note_ru: '有意思 = интересный → здесь 很 = нейтральная связка' },
  { zh: '妈妈很高兴。', pinyin: 'Māma hěn gāoxìng.', uz: 'Onam xursand.', ru: 'Мама рада.', note_uz: '高兴 (gāoxìng) = xursand → 很 = neytral bog\'lovchi', note_ru: '高兴 (gāoxìng) = радостный → 很 = нейтральная связка' },
];

const quizQuestions = [
  {
    q_uz: '"Men bandman" xitoycha qanday?',
    q_ru: 'Как сказать "Я занят" по-китайски?',
    options: ['我是忙', '我忙很', '我很忙', '很我忙'],
    correct: 2,
  },
  {
    q_uz: '很 gapda qanday vazifa bajaradi?',
    q_ru: 'Какую роль играет 很 в предложении?',
    options_uz: ['Fe\'l', 'Ot (noun)', 'Ega + sifat bog\'lovchi', 'Inkor yuklamasi'],
    options_ru: ['Глагол', 'Существительное', 'Связка подлежащего и прилагательного', 'Отрицательная частица'],
    correct: 2,
  },
  {
    q_uz: '"U chiroyli" qanday aytiladi?',
    q_ru: 'Как сказать "Она красивая"?',
    options: ['她是漂亮', '她很漂亮', '很她漂亮', '她漂亮很'],
    correct: 1,
  },
  {
    q_uz: '很 qanday o\'qiladi?',
    q_ru: 'Как читается 很?',
    options_uz: ['hén (2-ton)', 'hěn (3-ton)', 'hèn (4-ton)', 'hen (tonsiz)'],
    options_ru: ['hén (2-й тон)', 'hěn (3-й тон)', 'hèn (4-й тон)', 'hen (нейтральный)'],
    correct: 1,
  },
  {
    q_uz: 'Qaysi gapda 很 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 很 использован ПРАВИЛЬНО?',
    options: ['很他高', '他高很', '他很是高', '他很高'],
    correct: 3,
  },
  {
    q_uz: '"Juda sovuq" qanday ta\'kidlanadi?',
    q_ru: 'Как усилить "очень холодно"?',
    options_uz: ['很冷', '冷很', '非常冷', '不冷'],
    options_ru: ['很冷', '冷很', '非常冷', '不冷'],
    correct: 2,
  },
];

export function GrammarHenPage() {
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
        <div className="grammar-page__hero-bg">很</div>
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
          <div className="grammar-page__hero-char">很</div>
          <div className="grammar-page__hero-pinyin">hěn</div>
          <div className="grammar-page__hero-meaning">— {language === 'ru' ? 'очень / связка' : 'juda / bog\'lovchi'} —</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Иероглиф' : 'Ieroglif'}</div>
              <div className="grammar-block__char-row">
                <div className="grammar-block__big-char">很</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">hěn</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тон' : 'Ton'}</span>
                    <span className="grammar-block__tone">{language === 'ru' ? '3-й тон (вниз-вверх ↘↗)' : '3-ton (pastga-yuqoriga ↘↗)'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Перевод' : 'Ma\'nosi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'очень; нейтральная связка' : 'juda; neytral bog\'lovchi'}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Черт' : 'Chiziqlar'}</span>
                    <span className="grammar-block__info-val">9</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{language === 'ru' ? 'Тип слова' : 'Turi'}</span>
                    <span className="grammar-block__info-val">{language === 'ru' ? 'Наречие' : 'Ravish (adverb)'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{language === 'ru' ? 'Почему важно?' : 'Nima uchun muhim?'}</div>
              <p className="grammar-block__tip-text">
                {language === 'ru'
                  ? '很 — одно из самых частых слов в китайском. Но оно не всегда означает «очень»!'
                  : '很 — xitoy tilida eng ko\'p ishlatiladigan ravishlardan biri. Lekin u har doim «juda» degani emas!'}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  她<span className="grammar-block__highlight">很</span>漂亮。
                </div>
                <div className="grammar-block__usage-tr">
                  {language === 'ru'
                    ? 'Она красивая. (не «очень» — просто нейтральная связка)'
                    : 'U chiroyli. («juda» emas — shunchaki neytral bog\'lovchi)'}
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8 }}>
                {language === 'ru'
                  ? 'В китайском между подлежащим и прилагательным нужно наречие. 很 — самый нейтральный вариант.'
                  : 'Xitoy tilida ega va sifat orasiga doimo biror ravish kerak. 很 = eng oddiy, neytral variant.'}
              </p>
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? 'Ключевое' : '⚡ Kalit tushuncha'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'Нельзя просто сказать «Он высокий» без 很:'
                  : 'Xitoy tilida shunchaki «U baland» deb bo\'lmaydi 很 siz:'}
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'НЕВЕРНО' : 'XATO'}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>他高。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Незавершённая фраза!' : 'Tugallanmagan gap!'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                  <div className="grammar-block__usage-zh">他<span className="grammar-block__highlight">很</span>高。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? 'Он высокий.' : 'U baland bo\'yli.'}</div>
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8, color: '#b45309' }}>
                💡 {language === 'ru'
                  ? '他高 без 很 = сравнение: «Он выше (чем кто-то)»'
                  : '他高 很 siz = taqqoslash: «U balandroq (boshqalarga nisbatan)»'}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Основное правило' : 'Asosiy qoida'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">很</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {language === 'ru'
                  ? 'Не Подлеж. + Прилаг., а Подлеж. + 很 + Прилаг.'
                  : 'Xitoy tilida: Ega + Sifat emas, Ega + 很 + Sifat.'}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '1. Нейтрально: подлеж. + 很 + прилаг.' : '1. Neytral: ega + 很 + sifat'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">很</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? '很 = нейтральная связка (чаще всего не «очень»!)' : '很 = neytral bog\'lovchi (ko\'pincha «juda» emas!)'}</p>
              {[
                { zh: '他很高。', py: 'Tā hěn gāo.', uz: 'U baland bo\'yli.', ru: 'Он высокий.' },
                { zh: '这个很好。', py: 'Zhège hěn hǎo.', uz: 'Bu yaxshi.', ru: 'Это хорошее.' },
                { zh: '今天很热。', py: 'Jīntiān hěn rè.', uz: 'Bugun issiq.', ru: 'Сегодня жарко.' },
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
                    ? 'В этих предложениях 很 ≠ «очень». Это просто нейтральная связка — в русском она не нужна.'
                    : 'Bu gaplarda 很 = «juda» degani emas. U shunchaki ega va sifatni bog\'laydi — o\'zbekchada kerak emas.'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '2. С ударением: 很 = «очень»' : '2. Ta\'kidlash: 很 = «juda»'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? 'Если произнести 很 с ударением — оно означает «очень». В письме разница не видна — понятно из контекста.'
                  : 'Agar 很 ni kuchli (stressed) o\'qisangiz — u «juda» ma\'nosini beradi. Yozuvda farq yo\'q — kontekstdan tushuniladi.'}
              </p>
              {[
                { zh: '这个菜很好吃！', py: 'Zhège cài hěn hǎo chī!', uz: 'Bu ovqat juda mazali!', ru: 'Это блюдо очень вкусное!' },
                { zh: '我很喜欢你！', py: 'Wǒ hěn xǐhuan nǐ!', uz: 'Men seni juda yoqtiraman!', ru: 'Ты мне очень нравишься!' },
                { zh: '他跑得很快。', py: 'Tā pǎo de hěn kuài.', uz: 'U juda tez yuguradi.', ru: 'Он бегает очень быстро.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '3. Отрицание: 不 + прилаг. (без 很!)' : '3. Inkor: 不 + sifat (很 tushadi!)'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'В отрицании 很 не нужно!' : 'Inkor gapda 很 ishlatilmaydi!'}</p>
              {[
                { pos: '他很高。', neg: '他不高。', uz: 'U baland. → U baland emas.', ru: 'Он высокий. → Он невысокий.' },
                { pos: '今天很冷。', neg: '今天不冷。', uz: 'Bugun sovuq. → Bugun sovuq emas.', ru: 'Сегодня холодно. → Сегодня не холодно.' },
                { pos: '这个很贵。', neg: '这个不贵。', uz: 'Bu qimmat. → Bu qimmat emas.', ru: 'Это дорого. → Это недорого.' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f3ff' }}>
                    <div style={{ fontSize: '0.65em', color: '#7c3aed', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'УТВЕРЖДЕНИЕ' : 'IJOBIY'}</div>
                    <div className="grammar-block__usage-zh">{x.pos}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                    <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'ОТРИЦАНИЕ' : 'INKOR'}</div>
                    <div className="grammar-block__usage-zh">{x.neg}</div>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  ⚠️ <strong>{language === 'ru' ? '不很 тоже правильно' : '不很 ham to\'g\'ri'}</strong> — {language === 'ru' ? 'но другой смысл:' : 'lekin ma\'nosi boshqa:'}
                  {' '}<span style={{ color: '#1a1a2e' }}>他不高</span> = {language === 'ru' ? 'он не высокий' : 'u baland emas'} |{' '}
                  <span style={{ color: '#1a1a2e' }}>他不很高</span> = {language === 'ru' ? 'он не очень высокий' : 'u juda baland emas'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '4. Вопрос: ...吗？' : '4. Savol: ...吗？'}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{language === 'ru' ? 'Подлеж.' : 'Ega'}</span>
                {' + '}
                <span className="grammar-block__formula-b">{language === 'ru' ? 'Прилаг.' : 'Sifat'}</span>
                {' + '}
                <span className="grammar-block__formula-ma">吗？</span>
              </div>
              <p className="grammar-block__formula-desc">{language === 'ru' ? 'В вопросе 很 тоже убирается!' : 'Savol gapda ham 很 tushadi!'}</p>
              {[
                { q: '你忙吗？', a1: '很忙。', a2: '不忙。', uz: 'Bandmisan? — Bandman. / Band emasman.', ru: 'Ты занят? — Занят. / Не занят.' },
                { q: '今天冷吗？', a1: '很冷。', a2: '不冷。', uz: 'Bugun sovuqmi? — Sovuq. / Sovuq emas.', ru: 'Сегодня холодно? — Холодно. / Не холодно.' },
                { q: '贵吗？', a1: '很贵。', a2: '不贵。', uz: 'Qimmatmi? — Qimmat. / Qimmat emas.', ru: 'Дорого? — Дорого. / Недорого.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh" style={{ color: '#7c3aed', marginBottom: 6 }}>{x.q}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700 }}>{language === 'ru' ? 'ДА' : 'HA'}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{x.a1}</div>
                    </div>
                    <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#dc2626', fontWeight: 700 }}>{language === 'ru' ? 'НЕТ' : 'YO\'Q'}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{x.a2}</div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-tr" style={{ marginTop: 4 }}>{language === 'ru' ? x.ru : x.uz}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  💡 {language === 'ru'
                    ? 'Вопрос: 你忙吗？ (без 很). Ответ «да»: 很忙 (很 возвращается). Ответ «нет»: 不忙 (без 很).'
                    : 'Savolda: 你忙吗？ (很 yo\'q). Javobda «ha»: 很忙 (很 qaytadi). «Yo\'q»: 不忙 (很 yo\'q).'}
                </p>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '5. 很 + глагол (чувства)' : '5. 很 + fe\'l (his-tuyg\'u)'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 8 }}>
                {language === 'ru'
                  ? '很 используется и с некоторыми глаголами — в основном выражающими чувства:'
                  : '很 ba\'zi fe\'llar bilan ham ishlatiladi — asosan his-tuyg\'u fe\'llari:'}
              </p>
              {[
                { zh: '我很喜欢。', py: 'Wǒ hěn xǐhuan.', uz: 'Men juda yoqtiraman.', ru: 'Мне очень нравится.' },
                { zh: '他很想你。', py: 'Tā hěn xiǎng nǐ.', uz: 'U seni juda sog\'inadi.', ru: 'Он очень скучает по тебе.' },
                { zh: '我很想去。', py: 'Wǒ hěn xiǎng qù.', uz: 'Men juda bormoqchiman.', ru: 'Я очень хочу пойти.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 1: Знакомство' : 'Mini dialog 1: Tanishuv'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你好！你是新同学吗？', py: 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', uz: 'Salom! Sen yangi sinfdoshmisan?', ru: 'Привет! Ты новый одноклассник?' },
                  { speaker: 'B', zh: '是的。这个学校很大！', py: 'Shì de. Zhège xuéxiào hěn dà!', uz: 'Ha. Bu maktab juda katta!', ru: 'Да. Эта школа очень большая!' },
                  { speaker: 'A', zh: '是的，老师们都很好。', py: 'Shì de, lǎoshīmen dōu hěn hǎo.', uz: 'Ha, o\'qituvchilar hammasi yaxshi.', ru: 'Да, учителя все хорошие.' },
                  { speaker: 'B', zh: '太好了！我很高兴。', py: 'Tài hǎo le! Wǒ hěn gāoxìng.', uz: 'Ajoyib! Men juda xursandman.', ru: 'Отлично! Я очень рад.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#7c3aed' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Мини-диалог 2: Погода' : 'Mini dialog 2: Ob-havo'}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '今天冷吗？', py: 'Jīntiān lěng ma?', uz: 'Bugun sovuqmi?', ru: 'Сегодня холодно?' },
                  { speaker: 'B', zh: '不冷，但是很热。', py: 'Bù lěng, dànshì hěn rè.', uz: 'Sovuq emas, lekin juda issiq.', ru: 'Не холодно, но очень жарко.' },
                  { speaker: 'A', zh: '你渴吗？', py: 'Nǐ kě ma?', uz: 'Chanqadingmi?', ru: 'Ты хочешь пить?' },
                  { speaker: 'B', zh: '很渴！我们去喝水吧。', py: 'Hěn kě! Wǒmen qù hē shuǐ ba.', uz: 'Juda chanqadim! Suv ichgani boraylik.', ru: 'Очень хочу! Пойдём попьём воды.' },
                ].map((line, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#7c3aed' : '#dc2626' }}>{line.speaker}:</span>
                      <span className="grammar-block__usage-zh">{line.zh}</span>
                    </div>
                    <div className="grammar-block__usage-py" style={{ marginLeft: 20 }}>{line.py}</div>
                    <div className="grammar-block__usage-tr" style={{ marginLeft: 20 }}>{language === 'ru' ? line.ru : line.uz}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? 'Частые сочетания с 很' : 'Ko\'p ishlatiladigan 很 iboralar'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { zh: '很好', py: 'hěn hǎo', uz: 'yaxshi', ru: 'хорошо' },
                  { zh: '很大', py: 'hěn dà', uz: 'katta', ru: 'большой' },
                  { zh: '很多', py: 'hěn duō', uz: 'ko\'p', ru: 'много' },
                  { zh: '很少', py: 'hěn shǎo', uz: 'kam', ru: 'мало' },
                  { zh: '很忙', py: 'hěn máng', uz: 'band', ru: 'занят' },
                  { zh: '很冷', py: 'hěn lěng', uz: 'sovuq', ru: 'холодно' },
                  { zh: '很热', py: 'hěn rè', uz: 'issiq', ru: 'жарко' },
                  { zh: '很快', py: 'hěn kuài', uz: 'tez', ru: 'быстро' },
                  { zh: '很高兴', py: 'hěn gāoxìng', uz: 'xursand', ru: 'рад' },
                  { zh: '很漂亮', py: 'hěn piàoliang', uz: 'chiroyli', ru: 'красивый' },
                ].map((w, i) => (
                  <div key={i} className="grammar-block__usage-item" style={{ textAlign: 'center', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em' }}>{w.zh}</div>
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
              <div className="grammar-block__label">{language === 'ru' ? '很 vs 真 vs 非常 vs 太' : '很 vs 真 vs 非常 vs 太'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'В китайском несколько наречий степени. Разная сила:'
                  : 'Xitoy tilida daraja bildiruvchi bir necha ravish bor. Kuchi turlicha:'}
              </p>
              {[
                { word: '很', py: 'hěn', level_uz: 'Neytral / biroz', level_ru: 'Нейтрально / немного', bar: 40, color: '#7c3aed', ex: '他很高。', ex_uz: 'U baland bo\'yli.', ex_ru: 'Он высокий.' },
                { word: '真', py: 'zhēn', level_uz: 'Haqiqatan', level_ru: 'Действительно', bar: 65, color: '#2563eb', ex: '他真高！', ex_uz: 'U haqiqatan baland!', ex_ru: 'Он действительно высокий!' },
                { word: '非常', py: 'fēicháng', level_uz: 'Juda / g\'oyat', level_ru: 'Очень / чрезвычайно', bar: 85, color: '#ea580c', ex: '他非常高！', ex_uz: 'U juda baland!', ex_ru: 'Он очень высокий!' },
                { word: '太', py: 'tài', level_uz: 'Haddan tashqari', level_ru: 'Слишком / чересчур', bar: 100, color: '#dc2626', ex: '他太高了！', ex_uz: 'U haddan tashqari baland!', ex_ru: 'Он слишком высокий!' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 6, border: '1px solid #e0e0e6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: r.color, minWidth: 50, textAlign: 'center' }}>{r.word}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.7em', color: '#888' }}>{r.py} — {language === 'ru' ? r.level_ru : r.level_uz}</div>
                      <div style={{ height: 6, background: '#f0f0f3', borderRadius: 3, marginTop: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${r.bar}%`, background: r.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                  <div className="grammar-block__usage-item">
                    <div className="grammar-block__usage-zh">{r.ex}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? r.ex_ru : r.ex_uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{language === 'ru' ? '很 без прилагательного = сравнение' : '很 siz sifat = taqqoslash'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                {language === 'ru'
                  ? 'Если убрать 很 — предложение приобретает смысл сравнения:'
                  : 'Agar 很 qo\'ymasangiz — gap taqqoslash ma\'nosini beradi:'}
              </p>
              {[
                { with: '他很高。', with_uz: 'U baland bo\'yli. (oddiy fakt)', with_ru: 'Он высокий. (просто факт)', without: '他高。', without_uz: 'U balandroq. (boshqalarga nisbatan)', without_ru: 'Он высокий (чем кто-то). (сравнение)' },
                { with: '今天很冷。', with_uz: 'Bugun sovuq. (oddiy fakt)', with_ru: 'Сегодня холодно. (просто факт)', without: '今天冷。', without_uz: 'Bugun sovuqroq. (nisbatan)', without_ru: 'Сегодня холоднее. (сравнение)' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <div style={{ fontSize: '0.65em', color: '#7c3aed', fontWeight: 700, marginBottom: 3 }}>{language === 'ru' ? 'С 很' : '很 BILAN'}</div>
                    <div className="grammar-block__usage-zh">{x.with}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.with_ru : x.with_uz}</div>
                  </div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div style={{ fontSize: '0.65em', color: '#d97706', fontWeight: 700, marginBottom: 3 }}>{language === 'ru' ? 'Без 很' : '很 SIZ'}</div>
                    <div className="grammar-block__usage-zh">{x.without}</div>
                    <div className="grammar-block__usage-tr">{language === 'ru' ? x.without_ru : x.without_uz}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--warning">
              <div className="grammar-block__label">{language === 'ru' ? '很 vs 是' : '很 vs 是'}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 10 }}>
                ⚠️ {language === 'ru'
                  ? 'Частая ошибка: с прилагательными используется 很, а не 是!'
                  : 'Ko\'p o\'rganuvchilar xato qiladi: sifat bilan 是 emas, 很 ishlatiladi!'}
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                  <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 3 }}>✗ {language === 'ru' ? 'ОШИБКА' : 'XATO'}</div>
                  <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>他<span style={{ color: '#ef4444' }}>是</span>高。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? '是 = с существительным' : '是 = ot bilan'}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                  <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {language === 'ru' ? 'ВЕРНО' : 'TO\'G\'RI'}</div>
                  <div className="grammar-block__usage-zh">他<span className="grammar-block__highlight">很</span>高。</div>
                  <div className="grammar-block__usage-tr">{language === 'ru' ? '很 = с прилагательным' : '很 = sifat bilan'}</div>
                </div>
              </div>
              <p className="grammar-block__tip-text">
                <strong>是</strong> = {language === 'ru' ? 'с существительным: ' : 'ot bilan: '}他<strong>是</strong>老师。 ({language === 'ru' ? 'Он учитель.' : 'U o\'qituvchi.'})
                {'  '}
                <strong>很</strong> = {language === 'ru' ? 'с прилагательным: ' : 'sifat bilan: '}他<strong>很</strong>高。 ({language === 'ru' ? 'Он высокий.' : 'U baland bo\'yli.'})
              </p>
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
