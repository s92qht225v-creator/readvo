'use client';

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
  { id: 'other', uz: 'Boshqa savollar', ru: 'Другие вопросы', en: 'Other Questions' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '你好吗？', pinyin: 'Nǐ hǎo ma?', uz: 'Yaxshimisiz?', ru: 'Как дела?', en: 'How are you?', note_uz: '你 (nǐ) = sen, 好 (hǎo) = yaxshi → eng ko\'p ishlatiladigan savol', note_ru: '你 (nǐ) = ты, 好 (hǎo) = хорошо → самый частый вопрос', note_en: '你 (nǐ) = you, 好 (hǎo) = good → the most common question' },
  { zh: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', uz: 'Sen talabamisan?', ru: 'Ты студент?', en: 'Are you a student?', note_uz: '是 (shì) = ...dir → 是...吗 = ...misan?', note_ru: '是 (shì) = является → 是...吗 = является ли?', note_en: '是 (shì) = to be → 是...吗 = is it...?' },
  { zh: '他喜欢吃鱼吗？', pinyin: 'Tā xǐhuan chī yú ma?', uz: 'U baliq yeyishni yoqtiradimi?', ru: 'Он любит есть рыбу?', en: 'Does he like eating fish?', note_uz: '喜欢 (xǐhuan) = yoqtirmoq → darak gap + 吗 = savol', note_ru: '喜欢 (xǐhuan) = нравиться → повествовательное + 吗 = вопрос', note_en: '喜欢 (xǐhuan) = to like → statement + 吗 = question' },
  { zh: '你忙吗？', pinyin: 'Nǐ máng ma?', uz: 'Bandmisan?', ru: 'Ты занят?', en: 'Are you busy?', note_uz: '忙 (máng) = band → sifatli gap + 吗', note_ru: '忙 (máng) = занятой → прилагательное + 吗', note_en: '忙 (máng) = busy → adjective + 吗' },
  { zh: '今天冷吗？', pinyin: 'Jīntiān lěng ma?', uz: 'Bugun sovuqmi?', ru: 'Сегодня холодно?', en: 'Is it cold today?', note_uz: '今天 (jīntiān) = bugun, 冷 (lěng) = sovuq', note_ru: '今天 (jīntiān) = сегодня, 冷 (lěng) = холодный', note_en: '今天 (jīntiān) = today, 冷 (lěng) = cold' },
  { zh: '你有手机吗？', pinyin: 'Nǐ yǒu shǒujī ma?', uz: 'Senda telefon bormi?', ru: 'У тебя есть телефон?', en: 'Do you have a phone?', note_uz: '有 (yǒu) = bor, 手机 (shǒujī) = telefon → 有...吗 = bormi?', note_ru: '有 (yǒu) = есть, 手机 (shǒujī) = телефон → 有...吗 = есть ли?', note_en: '有 (yǒu) = to have, 手机 (shǒujī) = phone → 有...吗 = do you have...?' },
  { zh: '你想去吗？', pinyin: 'Nǐ xiǎng qù ma?', uz: 'Borgingmi?', ru: 'Ты хочешь идти?', en: 'Do you want to go?', note_uz: '想 (xiǎng) = xohlamoq, 去 (qù) = bormoq', note_ru: '想 (xiǎng) = хотеть, 去 (qù) = идти', note_en: '想 (xiǎng) = to want, 去 (qù) = to go' },
  { zh: '这是你的吗？', pinyin: 'Zhè shì nǐ de ma?', uz: 'Bu senikimi?', ru: 'Это твоё?', en: 'Is this yours?', note_uz: '这 (zhè) = bu, 你的 (nǐ de) = seniki', note_ru: '这 (zhè) = это, 你的 (nǐ de) = твоё', note_en: '这 (zhè) = this, 你的 (nǐ de) = yours' },
];

const quizQuestions = [
  {
    q_uz: '吗 gapning qayeriga qo\'yiladi?',
    q_ru: 'Куда ставится 吗?',
    q_en: 'Where is 吗 placed in a sentence?',
    options_uz: ['Boshiga', 'O\'rtasiga', 'Oxiriga', 'Fe\'ldan oldin'],
    options_ru: ['В начало', 'В середину', 'В конец', 'Перед глаголом'],
    options_en: ['At the beginning', 'In the middle', 'At the end', 'Before the verb'],
    correct: 2,
  },
  {
    q_uz: '"Sen talabamisan?" xitoycha qanday?',
    q_ru: 'Как по-китайски "Ты студент?"?',
    q_en: 'How do you say "Are you a student?" in Chinese?',
    options: ['你是学生吗？', '吗你是学生？', '你学生是吗？', '是你学生吗？'],
    correct: 0,
  },
  {
    q_uz: '吗 bilan savol tuzish uchun nima kerak?',
    q_ru: 'Что нужно для образования вопроса с 吗?',
    q_en: 'What do you need to form a question with 吗?',
    options_uz: ['So\'z tartibini o\'zgartirish', 'Darak gap + 吗', 'Fe\'lni takrorlash', 'Maxsus so\'z qo\'shish'],
    options_ru: ['Изменить порядок слов', 'Повествовательное предл. + 吗', 'Повторить глагол', 'Добавить особое слово'],
    options_en: ['Change the word order', 'Statement + 吗', 'Repeat the verb', 'Add a special word'],
    correct: 1,
  },
  {
    q_uz: 'Qaysi gapda 吗 ishlatilMAYDI?',
    q_ru: 'В каком предложении 吗 НЕ используется?',
    q_en: 'In which sentence is 吗 NOT used?',
    options: ['你好吗？', '你是谁？', '你忙吗？', '你喜欢吗？'],
    correct: 1,
  },
  {
    q_uz: '"Bugun sovuqmi?" xitoycha?',
    q_ru: 'Как по-китайски "Сегодня холодно?"?',
    q_en: 'How do you say "Is it cold today?" in Chinese?',
    options: ['今天冷吗？', '吗今天冷？', '冷今天吗？', '今天吗冷？'],
    correct: 0,
  },
  {
    q_uz: '吗 qanday o\'qiladi?',
    q_ru: 'Как читается 吗?',
    q_en: 'How is 吗 pronounced?',
    options_uz: ['mā (1-ton)', 'má (2-ton)', 'mǎ (3-ton)', 'ma (tonsiz)'],
    options_ru: ['mā (1-й тон)', 'má (2-й тон)', 'mǎ (3-й тон)', 'ma (нейтральный)'],
    options_en: ['mā (1st tone)', 'má (2nd tone)', 'mǎ (3rd tone)', 'ma (neutral)'],
    correct: 3,
  },
];

export function GrammarMaPage() {
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
        <div className="grammar-page__hero-bg">吗</div>
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
          <h1 className="grammar-page__hero-char">吗</h1>
          <div className="grammar-page__hero-pinyin">ma</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'savol yuklamasi', ru: 'вопросительная частица', en: 'question particle' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">吗</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">ma</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: 'Tonsiz (yengil, qisqa)', ru: 'нейтральный (лёгкий, короткий)', en: 'Neutral (light, short)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'savol belgisi (-mi?, -misan?)', ru: 'вопросительная частица (-ли?, -а?)', en: 'question particle (yes/no?)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">6</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '吗 — xitoy tilida eng oddiy savol tuzish usuli. Darak gapning oxiriga 吗 qo\'shsangiz — savol bo\'ladi:', ru: '吗 — самый простой способ задать вопрос в китайском. Добавьте 吗 в конец повествовательного предложения — и оно станет вопросом:', en: '吗 — the simplest way to ask a question in Chinese. Add 吗 to the end of a statement — and it becomes a question:' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ marginTop: 8 }}>
                <div className="grammar-block__usage-zh" style={{ color: '#888', fontSize: '0.85em' }}>
                  你是学生。→ {({ uz: 'Sen talabasan.', ru: 'Ты студент.', en: 'You are a student.' } as Record<string, string>)[language]}
                </div>
                <div className="grammar-block__usage-zh" style={{ marginTop: 4 }}>
                  你是学生<span className="grammar-block__highlight">吗</span>？
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'Sen talabamisan?', ru: 'Ты студент?', en: 'Are you a student?' } as Record<string, string>)[language]}
                </div>
              </div>
              <p className="grammar-block__tip-text" style={{ marginTop: 8 }}>
                {({ uz: 'So\'z tartibi o\'zgarmaydi — faqat oxiriga 吗 qo\'shiladi!', ru: 'Порядок слов не меняется — только добавляется 吗!', en: 'The word order doesn\'t change — just add 吗 at the end!' } as Record<string, string>)[language]}
              </p>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy tamoyil', ru: 'Основной принцип', en: 'Key Principle' } as Record<string, string>)[language]}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="grammar-block__usage-type">{({ uz: 'Darak gap', ru: 'Повествование', en: 'Statement' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">他是老师。</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'U o\'qituvchi.', ru: 'Он учитель.', en: 'He is a teacher.' } as Record<string, string>)[language]}</div>
                </div>
                <div style={{ fontSize: '1.2em', color: '#059669' }}>→</div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                  <div className="grammar-block__usage-type" style={{ color: '#059669' }}>{({ uz: 'Savol', ru: 'Вопрос', en: 'Question' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-zh">他是老师<span className="grammar-block__highlight">吗</span>？</div>
                  <div className="grammar-block__usage-tr">{({ uz: 'U o\'qituvchimi?', ru: 'Он учитель?', en: 'Is he a teacher?' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. 是...吗？ (kimdir nimadirmi?)', ru: '1. 是...吗？ (является ли?)', en: '1. 是...吗？ (is someone something?)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-verb">是</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ot', ru: 'Существ.', en: 'Noun' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你是中国人吗？', py: 'Nǐ shì Zhōngguó rén ma?', uz: 'Sen xitoylimisan?', ru: 'Ты китаец?', en: 'Are you Chinese?' },
                { zh: '她是你妈妈吗？', py: 'Tā shì nǐ māma ma?', uz: 'U sening onangmi?', ru: 'Она твоя мама?', en: 'Is she your mom?' },
                { zh: '这是你的书吗？', py: 'Zhè shì nǐ de shū ma?', uz: 'Bu sening kitobingmi?', ru: 'Это твоя книга?', en: 'Is this your book?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Fe\'l...吗？ (biror narsa qiladimi?)', ru: '2. Глагол...吗？ (делает ли?)', en: '2. Verb...吗？ (does someone do something?)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-verb">{({ uz: 'Fe\'l', ru: 'Гл.', en: 'V.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Ob\'yekt', ru: 'Доп.', en: 'Obj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你喝茶吗？', py: 'Nǐ hē chá ma?', uz: 'Choy ichasanmi?', ru: 'Ты пьёшь чай?', en: 'Do you drink tea?' },
                { zh: '他喜欢看书吗？', py: 'Tā xǐhuan kàn shū ma?', uz: 'U kitob o\'qishni yoqtiradimi?', ru: 'Он любит читать книги?', en: 'Does he like reading books?' },
                { zh: '你想吃饭吗？', py: 'Nǐ xiǎng chī fàn ma?', uz: 'Ovqat yegingmi?', ru: 'Ты хочешь есть?', en: 'Do you want to eat?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. Sifat + 吗？ (qandaymi?)', ru: '3. Прилагательное + 吗？ (какой?)', en: '3. Adjective + 吗？ (is it...?)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Narsa/Kishi', ru: 'Предмет/Лицо', en: 'Thing/Person' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Sifat', ru: 'Прилаг.', en: 'Adj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span style={{ color: '#059669', fontWeight: 700 }}>吗？</span>
              </div>
              {[
                { zh: '你忙吗？', py: 'Nǐ máng ma?', uz: 'Bandmisan?', ru: 'Ты занят?', en: 'Are you busy?' },
                { zh: '今天热吗？', py: 'Jīntiān rè ma?', uz: 'Bugun issiqmi?', ru: 'Сегодня жарко?', en: 'Is it hot today?' },
                { zh: '贵吗？', py: 'Guì ma?', uz: 'Qimmatmi?', ru: 'Дорого?', en: 'Is it expensive?' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '4. 吗 bilan javob berish', ru: '4. Ответы на вопросы с 吗', en: '4. Answering 吗 questions' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '吗 savoliga oddiy ha/yo\'q javob beriladi. Javobda 吗 ishlatilmaydi!', ru: 'На вопрос с 吗 отвечают просто «да/нет». В ответе 吗 не используется!', en: 'Answer 吗 questions with a simple yes/no. Don\'t use 吗 in the answer!' } as Record<string, string>)[language]}
              </p>
              {[
                { q: '你是学生吗？', a1: '是，我是学生。', a1uz: ({ uz: 'Ha, men talabaman.', ru: 'Да, я студент.', en: 'Yes, I\'m a student.' } as Record<string, string>)[language], a2: '不是，我是老师。', a2uz: ({ uz: 'Yo\'q, men o\'qituvchiman.', ru: 'Нет, я учитель.', en: 'No, I\'m a teacher.' } as Record<string, string>)[language] },
                { q: '你喜欢吗？', a1: '喜欢！', a1uz: ({ uz: 'Yoqtiraman!', ru: 'Нравится!', en: 'I like it!' } as Record<string, string>)[language], a2: '不喜欢。', a2uz: ({ uz: 'Yoqtirmayman.', ru: 'Не нравится.', en: 'I don\'t like it.' } as Record<string, string>)[language] },
                { q: '你忙吗？', a1: '忙。', a1uz: ({ uz: 'Bandman.', ru: 'Занят.', en: 'I\'m busy.' } as Record<string, string>)[language], a2: '不忙。', a2uz: ({ uz: 'Band emasman.', ru: 'Не занят.', en: 'I\'m not busy.' } as Record<string, string>)[language] },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh" style={{ color: '#059669', fontWeight: 600 }}>{x.q}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <div style={{ flex: 1, background: '#dcfce7', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>✓ {({ uz: 'HA', ru: 'ДА', en: 'YES' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '0.85em' }}>{x.a1}</div>
                      <div className="grammar-block__usage-tr">{x.a1uz}</div>
                    </div>
                    <div style={{ flex: 1, background: '#fee2e2', borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65em', color: '#dc2626', fontWeight: 700, marginBottom: 3 }}>✗ {({ uz: 'YO\'Q', ru: 'НЕТ', en: 'NO' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ fontSize: '0.85em' }}>{x.a2}</div>
                      <div className="grammar-block__usage-tr">{x.a2uz}</div>
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog', ru: 'Мини-диалог', en: 'Mini Dialogue' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '你好！你是新同学吗？', py: 'Nǐ hǎo! Nǐ shì xīn tóngxué ma?', uz: 'Salom! Sen yangi o\'quvchimisan?', ru: 'Привет! Ты новый студент?', en: 'Hi! Are you a new student?' },
                  { speaker: 'B', zh: '是，我叫李明。你呢？', py: 'Shì, wǒ jiào Lǐ Míng. Nǐ ne?', uz: 'Ha, mening ismim Li Ming. Senam?', ru: 'Да, меня зовут Ли Мин. А ты?', en: 'Yes, my name is Li Ming. And you?' },
                  { speaker: 'A', zh: '我叫安娜。你喜欢喝茶吗？', py: 'Wǒ jiào Ānnà. Nǐ xǐhuan hē chá ma?', uz: 'Mening ismim Anna. Choy ichishni yoqtirasanmi?', ru: 'Меня зовут Анна. Ты любишь пить чай?', en: 'My name is Anna. Do you like drinking tea?' },
                  { speaker: 'B', zh: '喜欢！我们去喝茶吧！', py: 'Xǐhuan! Wǒmen qù hē chá ba!', uz: 'Yoqtiraman! Choy ichgani boraylik!', ru: 'Люблю! Пойдём пить чай!', en: 'I do! Let\'s go drink tea!' },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: i < 3 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.7em', fontWeight: 700, color: line.speaker === 'A' ? '#059669' : '#dc2626' }}>{line.speaker}:</span>
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

        {activeTab === 'other' && (
          <>
            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: '吗 vs boshqa savol usullari', ru: '吗 vs другие типы вопросов', en: '吗 vs other question types' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'Xitoy tilida savol berish bir necha xil. 吗 faqat ha/yo\'q savollari uchun. Agar savol so\'zi bo\'lsa — 吗 ishlatilmaydi!', ru: 'В китайском языке несколько способов задать вопрос. 吗 только для вопросов «да/нет». Если есть вопросительное слово — 吗 не используется!', en: 'Chinese has several ways to ask questions. 吗 is only for yes/no questions. If there\'s a question word — don\'t use 吗!' } as Record<string, string>)[language]}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                  <div className="grammar-block__usage-zh" style={{ fontSize: '1.2em', color: '#059669' }}>吗</div>
                  <div className="grammar-block__usage-type" style={{ color: '#059669' }}>{({ uz: 'Ha / Yo\'q', ru: 'Да / Нет', en: 'Yes / No' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{({ uz: 'Javob faqat «ha» yoki «yo\'q»', ru: 'Ответ только «да» или «нет»', en: 'Answer is only "yes" or "no"' } as Record<string, string>)[language]}</div>
                </div>
                <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
                  <div className="grammar-block__usage-zh" style={{ fontSize: '1em', color: '#d97706' }}>谁什么哪</div>
                  <div className="grammar-block__usage-type" style={{ color: '#d97706' }}>{({ uz: 'Savol so\'zlari', ru: 'Вопросительные слова', en: 'Question words' } as Record<string, string>)[language]}</div>
                  <div className="grammar-block__usage-tr" style={{ fontSize: '0.75em' }}>{({ uz: 'Kim? Nima? Qayerda?', ru: 'Кто? Что? Где?', en: 'Who? What? Where?' } as Record<string, string>)[language]}</div>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">⚠️ {({ uz: '吗 ishlatilMAYDI:', ru: '吗 НЕ используется:', en: '吗 is NOT used:' } as Record<string, string>)[language]}</div>
              {[
                { zh: '你是谁？', py: 'Nǐ shì shéi?', uz: 'Sen kimsan?', ru: 'Кто ты?', en: 'Who are you?', word: '谁', reason_uz: '«Kim?» — savol so\'zi bor', reason_ru: '«Кто?» — есть вопросительное слово', reason_en: '"Who?" — question word present' },
                { zh: '这是什么？', py: 'Zhè shì shénme?', uz: 'Bu nima?', ru: 'Что это?', en: 'What is this?', word: '什么', reason_uz: '«Nima?» — savol so\'zi bor', reason_ru: '«Что?» — есть вопросительное слово', reason_en: '"What?" — question word present' },
                { zh: '你去哪儿？', py: 'Nǐ qù nǎr?', uz: 'Qayerga borasan?', ru: 'Куда идёшь?', en: 'Where are you going?', word: '哪儿', reason_uz: '«Qayerga?» — savol so\'zi bor', reason_ru: '«Куда?» — есть вопросительное слово', reason_en: '"Where?" — question word present' },
                { zh: '你几岁？', py: 'Nǐ jǐ suì?', uz: 'Necha yoshdasan?', ru: 'Сколько тебе лет?', en: 'How old are you?', word: '几', reason_uz: '«Necha?» — savol so\'zi bor', reason_ru: '«Сколько?» — есть вопросительное слово', reason_en: '"How many?" — question word present' },
                { zh: '多少钱？', py: 'Duōshao qián?', uz: 'Qancha pul?', ru: 'Сколько стоит?', en: 'How much?', word: '多少', reason_uz: '«Qancha?» — savol so\'zi bor', reason_ru: '«Сколько?» — есть вопросительное слово', reason_en: '"How much?" — question word present' },
              ].map((ex, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ borderLeft: '3px solid #f59e0b', background: '#fffbeb', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65em', fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4 }}>{ex.word}</span>
                    <span style={{ fontSize: '0.7em', color: '#888', fontStyle: 'italic' }}>{({ uz: ex.reason_uz, ru: ex.reason_ru, en: (ex as any).reason_en || ex.reason_uz } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__usage-zh">{ex.zh}</div>
                  <div className="grammar-block__usage-py">{ex.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: ex.uz, ru: ex.ru, en: (ex as any).en || ex.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block__usage-item" style={{ background: '#fef2f2', borderLeft: '3px solid #ef4444' }}>
                <div style={{ fontSize: '0.8em', color: '#dc2626', fontWeight: 700, marginBottom: 4 }}>
                  ⚠️ {({ uz: 'Xato:', ru: 'Ошибка:', en: 'Wrong:' } as Record<string, string>)[language]}
                </div>
                <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through', color: '#dc2626' }}>你是谁吗？ &nbsp; 这是什么吗？</div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'Savol so\'zi (谁, 什么, 哪, 几, 多少) bo\'lsa — 吗 kerak emas!', ru: 'Если есть вопросительное слово (谁, 什么, 哪, 几, 多少) — 吗 не нужна!', en: 'If there\'s a question word (谁, 什么, 哪, 几, 多少) — 吗 is not needed!' } as Record<string, string>)[language]}
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Fe\'l + 不 + Fe\'l? (吗 alternativasi)', ru: 'Гл. + 不 + Гл.? (альтернатива 吗)', en: 'V + 不 + V? (alternative to 吗)' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: 'Ha/yo\'q savolini 吗 o\'rniga fe\'l + 不 + fe\'l bilan ham bersa bo\'ladi. Ma\'no bir xil:', ru: 'Вместо 吗 можно использовать повтор глагола с 不. Значение одинаковое:', en: 'Instead of 吗, you can also use verb + 不 + verb to ask yes/no questions. The meaning is the same:' } as Record<string, string>)[language]}
              </p>
              {[
                { ma: '你忙吗？', alt: '你忙不忙？', uz: 'Bandmisan?', ru: 'Ты занят?', en: 'Are you busy?' },
                { ma: '你喜欢吗？', alt: '你喜不喜欢？', uz: 'Yoqtirasanmi?', ru: 'Нравится?', en: 'Do you like it?' },
                { ma: '好吗？', alt: '好不好？', uz: 'Yaxshimi?', ru: 'Хорошо?', en: 'Is it okay?' },
                { ma: '你是学生吗？', alt: '你是不是学生？', uz: 'Sen talabamisan?', ru: 'Ты студент?', en: 'Are you a student?' },
              ].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5, alignItems: 'center' }}>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65em', color: '#059669', fontWeight: 700, marginBottom: 3 }}>吗 {({ uz: 'bilan', ru: 'BILAN', en: 'with' } as Record<string, string>)[language]}</div>
                    <div className="grammar-block__usage-zh">{x.ma}</div>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#999' }}>=</div>
                  <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.65em', color: '#2563eb', fontWeight: 700, marginBottom: 3 }}>V+不+V</div>
                    <div className="grammar-block__usage-zh">{x.alt}</div>
                  </div>
                </div>
              ))}
              <p className="grammar-block__hint">{({ uz: 'Ikkala usul ham to\'g\'ri — o\'zingizga qulay bo\'lganini ishlating', ru: 'Оба варианта правильны — используйте любой', en: 'Both ways are correct — use whichever is more convenient for you' } as Record<string, string>)[language]}</p>
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
