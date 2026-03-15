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

const sections = [
  { id: 'intro', uz: 'Asosiy', ru: 'Основное', en: 'Overview' },
  { id: 'usage', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
  { id: 'examples', uz: 'Misollar', ru: 'Примеры', en: 'Examples' },
  { id: 'position', uz: 'O\'rni', ru: 'Позиция', en: 'Position' },
  { id: 'quiz', uz: 'Mashq', ru: 'Тест', en: 'Quiz' },
];

const examples = [
  { zh: '我是学生，他也是学生。', pinyin: 'Wǒ shì xuésheng, tā yě shì xuésheng.', uz: 'Men talabaman, u ham talaba.', ru: 'Я студент, он тоже студент.', en: 'I\'m a student, he is also a student.', note_uz: 'Ikki kishi bir xil — 也 ikkinchi gapda egadan keyin', note_ru: 'Два человека — одно и то же: 也 во втором предложении после подлежащего', note_en: 'Two people, same thing — 也 in the second clause after the subject' },
  { zh: '我喜欢茶，我也喜欢咖啡。', pinyin: 'Wǒ xǐhuan chá, wǒ yě xǐhuan kāfēi.', uz: 'Men choyni yoqtiraman, qahvani ham yoqtiraman.', ru: 'Я люблю чай, я также люблю кофе.', en: 'I like tea, I also like coffee.', note_uz: 'Bir kishi ikki narsa yoqtiradi — 也 ikkinchi gapda', note_ru: 'Один человек любит два разных: 也 во втором предложении', note_en: 'One person likes two things — 也 in the second clause' },
  { zh: '她很高，也很漂亮。', pinyin: 'Tā hěn gāo, yě hěn piàoliang.', uz: 'U baland bo\'yli, chiroyli ham.', ru: 'Она высокая и красивая.', en: 'She is tall and also beautiful.', note_uz: 'Ikki sifat — 也 ikkinchi sifatdan oldin', note_ru: 'Два прилагательных — 也 перед вторым', note_en: 'Two adjectives — 也 before the second one' },
  { zh: '我也想去。', pinyin: 'Wǒ yě xiǎng qù.', uz: 'Men ham bormoqchiman.', ru: 'Я тоже хочу пойти.', en: 'I also want to go.', note_uz: 'Boshqa birov bormoqchi — men HAM', note_ru: 'Кто-то другой хочет — я ТОЖЕ', note_en: 'Someone else wants to — I ALSO do' },
  { zh: '他也不喝酒。', pinyin: 'Tā yě bù hē jiǔ.', uz: 'U ham ichkilik ichmaydi.', ru: 'Он тоже не пьёт алкоголь.', en: 'He also doesn\'t drink alcohol.', note_uz: 'Inkor + ham: 也 + 不 tartib — 也不', note_ru: 'Отрицание + тоже: порядок 也不, не наоборот', note_en: 'Negation + also: the order is 也 + 不, i.e. 也不' },
  { zh: '妈妈也会做饭。', pinyin: 'Māma yě huì zuòfàn.', uz: 'Onam ham ovqat pishira oladi.', ru: 'Мама тоже умеет готовить.', en: 'Mom can also cook.', note_uz: 'Modal fe\'l bilan: 也 + 会 + fe\'l', note_ru: 'С модальным глаголом: 也 + 会 + глагол', note_en: 'With a modal verb: 也 + 会 + verb' },
  { zh: '我们也去了。', pinyin: 'Wǒmen yě qù le.', uz: 'Biz ham bordik.', ru: 'Мы тоже ходили.', en: 'We also went.', note_uz: 'O\'tgan zamon: 也 + fe\'l + 了', note_ru: 'Прошедшее время: 也 + глагол + 了', note_en: 'Past tense: 也 + verb + 了' },
  { zh: '这个也很好。', pinyin: 'Zhège yě hěn hǎo.', uz: 'Bu ham juda yaxshi.', ru: 'Это тоже очень хорошо.', en: 'This one is also very good.', note_uz: 'Narsa haqida — 也 boshqa narsaga solishtirish', note_ru: 'О вещи — 也 в сравнении с другой вещью', note_en: 'About a thing — 也 comparing with another thing' },
];

const quizQuestions = [
  {
    q_uz: '"Men ham talabaman" xitoycha qanday?',
    q_ru: 'Как по-китайски "Я тоже студент"?',
    q_en: 'How do you say "I am also a student" in Chinese?',
    options: ['我是也学生', '我也是学生', '也我是学生', '我是学生也'],
    correct: 1,
  },
  {
    q_uz: '也 gapda qayerga qo\'yiladi?',
    q_ru: 'Куда ставится 也 в предложении?',
    q_en: 'Where is 也 placed in a sentence?',
    options_uz: ['Gap oxiriga', 'Ob\'yektdan keyin', 'Egadan keyin, fe\'ldan oldin', 'Gap boshiga'],
    options_ru: ['В конец предложения', 'После объекта', 'После подлежащего, перед глаголом', 'В начало предложения'],
    options_en: ['At the end of the sentence', 'After the object', 'After the subject, before the verb', 'At the beginning of the sentence'],
    correct: 2,
  },
  {
    q_uz: '"U ham ichmaydi" qanday?',
    q_ru: 'Как сказать "Он тоже не пьёт"?',
    q_en: 'How do you say "He also doesn\'t drink"?',
    options: ['他不也喝', '他也喝不', '他也不喝', '也他不喝'],
    correct: 2,
  },
  {
    q_uz: '也 qanday o\'qiladi?',
    q_ru: 'Как читается 也?',
    q_en: 'How is 也 pronounced?',
    options_uz: ['yé (2-ton)', 'yè (4-ton)', 'yě (3-ton)', 'ye (tonsiz)'],
    options_ru: ['yé (2-й тон)', 'yè (4-й тон)', 'yě (3-й тон)', 'ye (нейтральный)'],
    options_en: ['yé (2nd tone)', 'yè (4th tone)', 'yě (3rd tone)', 'ye (neutral)'],
    correct: 2,
  },
  {
    q_uz: 'Qaysi gapda 也 TO\'G\'RI ishlatilgan?',
    q_ru: 'В каком предложении 也 использован ПРАВИЛЬНО?',
    q_en: 'In which sentence is 也 used CORRECTLY?',
    options: ['也我喜欢茶', '我喜欢也茶', '我也喜欢茶', '我喜欢茶也'],
    correct: 2,
  },
  {
    q_uz: '也 va 都 birgalikda qanday tartibda?',
    q_ru: 'В каком порядке 也 и 都 стоят вместе?',
    q_en: 'In what order do 也 and 都 appear together?',
    options_uz: ['都也', '也都', 'Farqi yo\'q', 'Birgalikda ishlatilmaydi'],
    options_ru: ['都也', '也都', 'Нет разницы', 'Нельзя использовать вместе'],
    options_en: ['都也', '也都', 'No difference', 'They can\'t be used together'],
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
            <Link href="/chinese?tab=grammar" className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
        </div>
        <div className="grammar-page__hero-body">
          <div className="grammar-page__hero-label">HSK 1 · {({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</div>
          <h1 className="grammar-page__hero-char">也</h1>
          <div className="grammar-page__hero-pinyin">yě</div>
          <div className="grammar-page__hero-meaning">— {({ uz: 'ham / ...ham', ru: 'тоже / также', en: 'also / too' } as Record<string, string>)[language]} —</div>
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
                <div className="grammar-block__big-char">也</div>
                <div className="grammar-block__char-info">
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">Pinyin</span>
                    <span className="grammar-block__info-val">yě</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ton', ru: 'Тон', en: 'Tone' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__tone">{({ uz: '3-ton (pastga-yuqoriga ↘↗)', ru: '3-й тон (вниз-вверх ↘↗)', en: '3rd tone (dip ↘↗)' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Ma\'nosi', ru: 'Перевод', en: 'Meaning' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'ham, ...ham', ru: 'тоже, также', en: 'also, too' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Turi', ru: 'Тип слова', en: 'Word Type' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">{({ uz: 'Ravish (adverb)', ru: 'Наречие', en: 'Adverb' } as Record<string, string>)[language]}</span>
                  </div>
                  <div className="grammar-block__info-row">
                    <span className="grammar-block__info-key">{({ uz: 'Chiziqlar', ru: 'Черт', en: 'Strokes' } as Record<string, string>)[language]}</span>
                    <span className="grammar-block__info-val">3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grammar-block grammar-block--tip">
              <div className="grammar-block__label">{({ uz: 'Nima uchun muhim?', ru: 'Почему важно?', en: 'Why is it important?' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text">
                {({ uz: '也 — xitoy tilida eng ko\'p ishlatiladigan so\'zlardan biri. O\'zbek tilidagi «ham» ning to\'liq ekvivalenti:', ru: '也 — одно из самых частых слов в китайском. Полный эквивалент русского «тоже»:', en: '也 — one of the most common words in Chinese. It is the equivalent of English "also" or "too":' } as Record<string, string>)[language]}
              </p>
              <div className="grammar-block__usage-item" style={{ textAlign: 'center', marginTop: 8 }}>
                <div className="grammar-block__usage-zh">
                  我是学生。→ 他<span className="grammar-block__highlight">也</span>是学生。
                </div>
                <div className="grammar-block__usage-tr">
                  {({ uz: 'Men talabaman. → U ham talaba.', ru: 'Я студент. → Он тоже студент.', en: 'I\'m a student. → He is also a student.' } as Record<string, string>)[language]}
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
              {language !== 'uz' && (
                <p className="grammar-block__tip-text" style={{ color: '#059669', marginTop: 8 }}>
                  <strong>{language === 'ru' ? 'Хорошая новость:' : 'Good news:'}</strong> {language === 'ru' ? 'Порядок слов такой же, как в русском — Подлежащее + тоже/也 + Глагол.' : 'The word order is the same as in English — Subject + also/也 + Verb.'}
                </p>
              )}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Asosiy qoida', ru: 'Основное правило', en: 'Basic Rule' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l / Sifat', ru: 'Глагол/Прилаг.', en: 'Verb / Adj.' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">
                {({ uz: '也 har doim egadan keyin, fe\'ldan oldin — hech qachon boshiga yoki oxiriga qo\'yilmaydi!', ru: '也 всегда стоит после подлежащего, перед глаголом. Как русское «тоже» — порядок совпадает!', en: '也 always goes after the subject and before the verb — never at the beginning or end of the sentence!' } as Record<string, string>)[language]}
              </p>
            </div>
          </>
        )}

        {/* ── USAGE ── */}
        {activeTab === 'usage' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '1. Ikki ega — bir xil ish', ru: '1. Два подлежащих — одно действие', en: '1. Two subjects — same action' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'A gap', ru: 'Фраза A', en: 'Phrase A' } as Record<string, string>)[language]}</span>
                {', '}
                <span className="grammar-block__formula-b">B</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'fe\'l', ru: 'глаг.', en: 'verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'A qiladi, B HAM qiladi', ru: 'A делает, B ТОЖЕ делает', en: 'A does it, B ALSO does it' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我喝茶，他也喝茶。', py: 'Wǒ hē chá, tā yě hē chá.', uz: 'Men choy ichaman, u ham choy ichadi.', ru: 'Я пью чай, он тоже пьёт чай.', en: 'I drink tea, he also drinks tea.' },
                { zh: '我去学校，她也去学校。', py: 'Wǒ qù xuéxiào, tā yě qù xuéxiào.', uz: 'Men maktabga boraman, u ham boradi.', ru: 'Я иду в школу, она тоже идёт.', en: 'I go to school, she also goes to school.' },
                { zh: '爸爸会做饭，妈妈也会做饭。', py: 'Bàba huì zuòfàn, māma yě huì zuòfàn.', uz: 'Otam ovqat pishira oladi, onam ham.', ru: 'Папа умеет готовить, мама тоже.', en: 'Dad can cook, Mom can too.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '2. Bir ega — ikki xil ish/sifat', ru: '2. Одно подлежащее — два действия/признака', en: '2. One subject — two actions/traits' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'fe\'l₁', ru: 'глаг₁', en: 'verb₁' } as Record<string, string>)[language]}</span>
                {', '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'fe\'l₂', ru: 'глаг₂', en: 'verb₂' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: 'Bir kishi ikki narsa qiladi / ikki xil', ru: 'Один человек делает два разных действия', en: 'One person does two different things' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我喜欢茶，也喜欢咖啡。', py: 'Wǒ xǐhuan chá, yě xǐhuan kāfēi.', uz: 'Men choyni yoqtiraman, qahvani ham.', ru: 'Я люблю чай и также кофе.', en: 'I like tea and also like coffee.' },
                { zh: '她很聪明，也很漂亮。', py: 'Tā hěn cōngming, yě hěn piàoliang.', uz: 'U aqlli, chiroyli ham.', ru: 'Она умная и красивая.', en: 'She is smart and also beautiful.' },
                { zh: '他会说英语，也会说中文。', py: 'Tā huì shuō Yīngyǔ, yě huì shuō Zhōngwén.', uz: 'U inglizcha gapira oladi, xitoycha ham.', ru: 'Он умеет говорить по-английски и по-китайски.', en: 'He can speak English and also Chinese.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '3. 也不 — ham ...maydi (inkor)', ru: '3. 也不 — тоже не... (отрицание)', en: '3. 也不 — also not... (negation)' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-neg">不</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '也 + 不 → ham ...maydi / ham emas', ru: '也 + 不 → тоже не делает / тоже не является', en: '也 + 不 → also doesn\'t / also isn\'t' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我不喝酒，他也不喝酒。', py: 'Wǒ bù hē jiǔ, tā yě bù hē jiǔ.', uz: 'Men ichkilik ichmayman, u ham ichmaydi.', ru: 'Я не пью алкоголь, он тоже не пьёт.', en: 'I don\'t drink alcohol, he doesn\'t either.' },
                { zh: '她不是老师，我也不是。', py: 'Tā bú shì lǎoshī, wǒ yě bú shì.', uz: 'U o\'qituvchi emas, men ham emasman.', ru: 'Она не учитель, я тоже нет.', en: 'She isn\'t a teacher, I\'m not either.' },
                { zh: '我也不想去。', py: 'Wǒ yě bù xiǎng qù.', uz: 'Men ham bormoqchi emasman.', ru: 'Я тоже не хочу идти.', en: 'I don\'t want to go either.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text" style={{ color: '#dc2626' }}>
                  ⚠️ {({ uz: 'Tartib muhim: har doim 也不, hech qachon 不也!', ru: 'Порядок важен: всегда 也不, никогда 不也!', en: 'Order matters: always 也不, never 不也!' } as Record<string, string>)[language]}
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
              <div className="grammar-block__label">{({ uz: '4. 也 + 都 birgalikda', ru: '4. 也 + 都 вместе', en: '4. 也 + 都 together' } as Record<string, string>)[language]}</div>
              <div className="grammar-block__formula">
                <span className="grammar-block__formula-a">{({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}</span>
                {' + '}
                <span className="grammar-block__formula-neg">也</span>
                {' + '}
                <span className="grammar-block__formula-b">都</span>
                {' + '}
                <span className="grammar-block__formula-b">{({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}</span>
              </div>
              <p className="grammar-block__formula-desc">{({ uz: '也都 = ham hammasi / ham barchasi', ru: '也都 = тоже все / тоже оба', en: '也都 = also all / also both' } as Record<string, string>)[language]}</p>
              {[
                { zh: '我们也都是学生。', py: 'Wǒmen yě dōu shì xuésheng.', uz: 'Biz ham hammamiz talabamiz.', ru: 'Мы тоже все студенты.', en: 'We are also all students.' },
                { zh: '他们也都去了。', py: 'Tāmen yě dōu qù le.', uz: 'Ular ham hammasi bordi.', ru: 'Они тоже все пошли.', en: 'They also all went.' },
              ].map((x, i) => (
                <div key={i} className="grammar-block__usage-item" style={{ marginTop: 6 }}>
                  <div className="grammar-block__usage-zh">{x.zh}</div>
                  <div className="grammar-block__usage-py">{x.py}</div>
                  <div className="grammar-block__usage-tr">{({ uz: x.uz, ru: x.ru, en: (x as any).en || x.uz } as Record<string, string>)[language]}</div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Tartib: 也 har doim 都 dan OLDIN keladi: 也都, hech qachon 都也.', ru: '💡 Порядок: 也 всегда стоит ПЕРЕД 都: 也都, никогда 都也.', en: '💡 Order: 也 always comes BEFORE 都: 也都, never 都也.' } as Record<string, string>)[language]}
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 1: Yangi sinfdosh', ru: 'Мини-диалог 1: Новый одноклассник', en: 'Mini dialogue 1: New classmate' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '我是中国人。你呢？', py: 'Wǒ shì Zhōngguó rén. Nǐ ne?', uz: 'Men xitoylikman. Senchi?', ru: 'Я китаец. А ты?', en: 'I\'m Chinese. How about you?' },
                  { speaker: 'B', zh: '我也是中国人！', py: 'Wǒ yě shì Zhōngguó rén!', uz: 'Men ham xitoylikman!', ru: 'Я тоже китаец!', en: 'I\'m also Chinese!' },
                  { speaker: 'A', zh: '你喜欢看电影吗？', py: 'Nǐ xǐhuan kàn diànyǐng ma?', uz: 'Kino ko\'rishni yoqtirasanmi?', ru: 'Тебе нравится смотреть кино?', en: 'Do you like watching movies?' },
                  { speaker: 'B', zh: '喜欢！我也喜欢听音乐。', py: 'Xǐhuan! Wǒ yě xǐhuan tīng yīnyuè.', uz: 'Ha! Musiqa tinglashni ham yoqtiraman.', ru: 'Да! Я также люблю слушать музыку.', en: 'Yes! I also like listening to music.' },
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
              <div className="grammar-block__label">{({ uz: 'Mini dialog 2: Ovqat tanlash', ru: 'Мини-диалог 2: Выбор еды', en: 'Mini dialogue 2: Choosing food' } as Record<string, string>)[language]}</div>
              <div style={{ background: '#f5f5f8', borderRadius: 8, padding: 12 }}>
                {[
                  { speaker: 'A', zh: '我不想吃米饭。', py: 'Wǒ bù xiǎng chī mǐfàn.', uz: 'Men guruch yegim kelmayapti.', ru: 'Я не хочу есть рис.', en: 'I don\'t want to eat rice.' },
                  { speaker: 'B', zh: '我也不想吃米饭。面条呢？', py: 'Wǒ yě bù xiǎng chī mǐfàn. Miàntiáo ne?', uz: 'Men ham yegim kelmayapti. Noodle-chi?', ru: 'Я тоже не хочу. А лапша?', en: 'I don\'t want to either. How about noodles?' },
                  { speaker: 'A', zh: '好！我喜欢面条，也喜欢饺子。', py: 'Hǎo! Wǒ xǐhuan miàntiáo, yě xǐhuan jiǎozi.', uz: 'Bo\'pti! Men noodle yoqtiraman, chuchvarani ham.', ru: 'Хорошо! Я люблю лапшу и тоже пельмени.', en: 'Great! I like noodles and also dumplings.' },
                  { speaker: 'B', zh: '太好了！我们都喜欢！', py: 'Tài hǎo le! Wǒmen dōu xǐhuan!', uz: 'Ajoyib! Ikkalamiz ham yoqtiramiz!', ru: 'Отлично! Нам обоим нравится!', en: 'Awesome! We both like them!' },
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

        {/* ── POSITION ── */}
        {activeTab === 'position' && (
          <>
            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: '也 ning aniq o\'rni', ru: 'Точная позиция 也', en: 'Exact position of 也' } as Record<string, string>)[language]}</div>
              <p className="grammar-block__tip-text" style={{ marginBottom: 12 }}>
                {({ uz: '也 har doim egadan keyin, fe\'ldan oldin — boshqa o\'ringa qo\'yib bo\'lmaydi. Bu o\'zbekchadan farqli!', ru: '也 всегда после подлежащего, перед глаголом — другие позиции недопустимы. Это отличается от узбекского!', en: '也 always goes after the subject and before the verb — no other position is allowed.' } as Record<string, string>)[language]}
              </p>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{
                  display: 'inline-flex', gap: 4, alignItems: 'center',
                  background: '#f5f5f8', borderRadius: 8, padding: '10px 14px',
                }}>
                  <span style={{ background: '#dcfce7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                    {({ uz: 'Ega', ru: 'Подлеж.', en: 'Subj.' } as Record<string, string>)[language]}
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fef3c7', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, color: '#dc2626', border: '2px solid #dc2626' }}>
                    也
                  </span>
                  <span style={{ fontSize: 18, color: '#ccc' }}>→</span>
                  <span style={{ background: '#fee2e2', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {({ uz: 'Fe\'l', ru: 'Глагол', en: 'Verb' } as Record<string, string>)[language]}
                  </span>
                </div>
              </div>
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Xato va to\'g\'ri joylashtirish', ru: 'Ошибки и правильные варианты', en: 'Wrong vs. correct placement' } as Record<string, string>)[language]}</div>
              {[
                { wrong: '也我是学生。', right: '我也是学生。', rule_uz: '也 gap boshiga qo\'yilmaydi — egadan keyin!', rule_ru: '也 не ставится в начало — только после подлежащего!', rule_en: '也 can\'t go at the beginning — it goes after the subject!' },
                { wrong: '我是也学生。', right: '我也是学生。', rule_uz: '也 fe\'l va ob\'yekt orasiga tushmaydi — fe\'ldan oldin!', rule_ru: '也 не между глаголом и объектом — только перед глаголом!', rule_en: '也 doesn\'t go between the verb and object — it goes before the verb!' },
                { wrong: '我是学生也。', right: '我也是学生。', rule_uz: '也 gap oxiriga qo\'yilmaydi — bu o\'zbekcha tartib!', rule_ru: '也 не ставится в конец — это узбекский порядок!', rule_en: '也 can\'t go at the end of the sentence!' },
                { wrong: '我不也去。', right: '我也不去。', rule_uz: 'Inkor bilan: 也不, hech qachon 不也!', rule_ru: 'С отрицанием: 也不, никогда 不也!', rule_en: 'With negation: always 也不, never 不也!' },
              ].map((ex, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#fee2e2' }}>
                      <div style={{ fontSize: '0.65em', color: '#ef4444', fontWeight: 700, marginBottom: 2 }}>✗ {({ uz: 'XATO', ru: 'НЕВЕРНО', en: 'WRONG' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh" style={{ textDecoration: 'line-through' }}>{ex.wrong}</div>
                    </div>
                    <div className="grammar-block__usage-item" style={{ flex: 1, textAlign: 'center', background: '#dcfce7' }}>
                      <div style={{ fontSize: '0.65em', color: '#16a34a', fontWeight: 700, marginBottom: 2 }}>✓ {({ uz: 'TO\'G\'RI', ru: 'ВЕРНО', en: 'CORRECT' } as Record<string, string>)[language]}</div>
                      <div className="grammar-block__usage-zh">{ex.right}</div>
                    </div>
                  </div>
                  <p className="grammar-block__formula-desc" style={{ paddingLeft: 4 }}>{({ uz: ex.rule_uz, ru: ex.rule_ru, en: (ex as any).rule_en || ex.rule_uz } as Record<string, string>)[language]}</p>
                </div>
              ))}
            </div>

            <div className="grammar-block">
              <div className="grammar-block__label">{({ uz: 'Boshqa so\'zlar bilan tartib', ru: 'Порядок с другими словами', en: 'Word order with other words' } as Record<string, string>)[language]}</div>
              {[
                { combo: '也 + 不', ex: '我也不去', ex_uz: 'Men ham bormayman', ex_ru: 'Я тоже не пойду', ex_en: 'I\'m not going either' },
                { combo: '也 + 没', ex: '他也没来', ex_uz: 'U ham kelmadi', ex_ru: 'Он тоже не пришёл', ex_en: 'He didn\'t come either' },
                { combo: '也 + 都', ex: '他们也都去了', ex_uz: 'Ular ham hammasi bordi', ex_ru: 'Они тоже все пошли', ex_en: 'They also all went' },
                { combo: '也 + 很', ex: '她也很高', ex_uz: 'U ham baland bo\'yli', ex_ru: 'Она тоже высокая', ex_en: 'She is also tall' },
                { combo: '也 + 会', ex: '我也会说', ex_uz: 'Men ham gapira olaman', ex_ru: 'Я тоже умею говорить', ex_en: 'I can also speak' },
                { combo: '也 + 想', ex: '我也想去', ex_uz: 'Men ham bormoqchiman', ex_ru: 'Я тоже хочу пойти', ex_en: 'I also want to go' },
              ].map((r, i) => (
                <div key={i} className="grammar-block__info-row" style={{ padding: '8px 0', borderBottom: i < 5 ? '1px solid #f0f0f3' : 'none', alignItems: 'center' }}>
                  <span style={{ minWidth: 60, background: '#f5f5f8', borderRadius: 4, padding: '2px 6px', textAlign: 'center', fontSize: '0.85em', fontWeight: 700, color: '#dc2626' }}>{r.combo}</span>
                  <div style={{ flex: 1, fontSize: '0.85em' }}>
                    <span className="grammar-block__usage-zh" style={{ fontSize: '1em' }}>{r.ex}</span>
                    <span className="grammar-block__usage-tr" style={{ display: 'inline', marginLeft: 6 }}>— {({ uz: r.ex_uz, ru: r.ex_ru, en: (r as any).ex_en || r.ex_uz } as Record<string, string>)[language]}</span>
                  </div>
                </div>
              ))}
              <div className="grammar-block grammar-block--tip" style={{ margin: '10px 0 0' }}>
                <p className="grammar-block__tip-text">
                  {({ uz: '💡 Kalit: 也 har doim boshqa ravishlardan BIRINCHI keladi.', ru: '💡 Ключ: 也 всегда стоит ПЕРВЫМ из всех наречий.', en: '💡 Key: 也 always comes FIRST among all adverbs.' } as Record<string, string>)[language]}
                </p>
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
