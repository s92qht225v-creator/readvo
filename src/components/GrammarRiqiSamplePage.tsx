'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { playGrammarAudio } from '@/utils/grammarAudio';

type Copy = { uz: string; ru: string; en: string };

const months = [
  { zh: '一月', py: 'yī yuè', uz: 'Yanvar', ru: 'Январь', en: 'January' },
  { zh: '二月', py: 'èr yuè', uz: 'Fevral', ru: 'Февраль', en: 'February' },
  { zh: '三月', py: 'sān yuè', uz: 'Mart', ru: 'Март', en: 'March' },
  { zh: '四月', py: 'sì yuè', uz: 'Aprel', ru: 'Апрель', en: 'April' },
  { zh: '五月', py: 'wǔ yuè', uz: 'May', ru: 'Май', en: 'May' },
  { zh: '六月', py: 'liù yuè', uz: 'Iyun', ru: 'Июнь', en: 'June' },
  { zh: '七月', py: 'qī yuè', uz: 'Iyul', ru: 'Июль', en: 'July' },
  { zh: '八月', py: 'bā yuè', uz: 'Avgust', ru: 'Август', en: 'August' },
  { zh: '九月', py: 'jiǔ yuè', uz: 'Sentyabr', ru: 'Сентябрь', en: 'September' },
  { zh: '十月', py: 'shí yuè', uz: 'Oktyabr', ru: 'Октябрь', en: 'October' },
  { zh: '十一月', py: 'shíyī yuè', uz: 'Noyabr', ru: 'Ноябрь', en: 'November' },
  { zh: '十二月', py: 'shí’èr yuè', uz: 'Dekabr', ru: 'Декабрь', en: 'December' },
] as const;

const weekdays = [
  { zh: '星期一', py: 'xīngqī yī', uz: 'Dushanba', ru: 'Понедельник', en: 'Monday' },
  { zh: '星期二', py: 'xīngqī èr', uz: 'Seshanba', ru: 'Вторник', en: 'Tuesday' },
  { zh: '星期三', py: 'xīngqī sān', uz: 'Chorshanba', ru: 'Среда', en: 'Wednesday' },
  { zh: '星期四', py: 'xīngqī sì', uz: 'Payshanba', ru: 'Четверг', en: 'Thursday' },
  { zh: '星期五', py: 'xīngqī wǔ', uz: 'Juma', ru: 'Пятница', en: 'Friday' },
  { zh: '星期六', py: 'xīngqī liù', uz: 'Shanba', ru: 'Суббота', en: 'Saturday' },
  { zh: '星期天', py: 'xīngqī tiān', uz: 'Yakshanba', ru: 'Воскресенье', en: 'Sunday' },
] as const;

const quickQuestions = [
  {
    prompt: {
      uz: 'Xitoychada sana tartibi qanday?',
      ru: 'Какой порядок даты в китайском?',
      en: 'What is the date order in Chinese?',
    },
    options: ['kun → oy', 'oy → kun', 'hafta kuni → oy → kun'],
    correct: 1,
  },
  {
    prompt: {
      uz: '“Bugun haftaning qaysi kuni?”',
      ru: '«Какой сегодня день недели?»',
      en: '"What day of the week is it today?"',
    },
    options: ['今天几月几号？', '今天星期几？', '今天几号星期？'],
    correct: 1,
  },
  {
    prompt: {
      uz: '“15-iyun” qaysi variant?',
      ru: 'Какой вариант означает «15 июня»?',
      en: 'Which one is "June 15th"?',
    },
    options: ['十五月六月', '六月十五号', '十五号六月'],
    correct: 1,
  },
] as const;

const dayLabel = (day: number) => `${day}号`;

const dayPinyin = (day: number) => {
  const map: Record<number, string> = {
    1: 'yī hào', 2: 'èr hào', 3: 'sān hào', 4: 'sì hào', 5: 'wǔ hào',
    6: 'liù hào', 7: 'qī hào', 8: 'bā hào', 9: 'jiǔ hào', 10: 'shí hào',
    11: 'shíyī hào', 12: 'shí’èr hào', 13: 'shísān hào', 14: 'shísì hào', 15: 'shíwǔ hào',
    16: 'shíliù hào', 17: 'shíqī hào', 18: 'shíbā hào', 19: 'shíjiǔ hào', 20: 'èrshí hào',
    21: 'èrshíyī hào', 22: 'èrshí’èr hào', 23: 'èrshísān hào', 24: 'èrshísì hào', 25: 'èrshíwǔ hào',
    26: 'èrshíliù hào', 27: 'èrshíqī hào', 28: 'èrshíbā hào',
  };

  return map[day] ?? `${day} hào`;
};

export function GrammarRiqiSamplePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const [monthIndex, setMonthIndex] = useState(8);
  const [day, setDay] = useState(2);
  const [weekdayIndex, setWeekdayIndex] = useState(3);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const t = (copy: Copy) => copy[language] ?? copy.uz;

  const month = months[monthIndex];
  const weekday = weekdays[weekdayIndex];
  const score = Object.entries(answers).filter(([i, a]) => quickQuestions[Number(i)].correct === a).length;

  const composed = useMemo(() => {
    const zh = `${month.zh}${dayLabel(day)} ${weekday.zh}`;
    const py = `${month.py} ${dayPinyin(day)} ${weekday.py}`;
    const tr = {
      uz: `${month.uz}, ${day}-kun · ${weekday.uz}`,
      ru: `${month.ru}, ${day}-е число · ${weekday.ru}`,
      en: `${month.en} ${day} · ${weekday.en}`,
    };

    return { zh, py, tr };
  }, [month, day, weekday]);

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <div className="grammar-page grammar-sample">
      <section className="riqi-sample-hero">
        <div className="riqi-sample-hero__mesh" />
        <div className="riqi-sample-hero__top">
          <Link href="/chinese/hsk1/grammar/riqi" className="dr-back-btn riqi-sample-hero__back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <BannerMenu />
        </div>
        <div className="riqi-sample-hero__content">
          <div className="riqi-sample-hero__eyebrow">
            {t({ uz: 'HSK 1 · Qayta yig‘ilgan namuna', ru: 'HSK 1 · Пересобранный sample', en: 'HSK 1 · Sample Rebuild' })}
          </div>
          <h1 className="riqi-sample-hero__title">
            {t({ uz: 'Sanalarni chalkashmasdan', ru: 'Даты без тумана', en: 'Dates Without The Fog' })}
          </h1>
          <div className="riqi-sample-hero__subtitle">月 / 号 / 星期</div>
          <p className="riqi-sample-hero__deck">
            {t({
              uz: "Bu sample sahifa sanani bitta qoida, bitta konstruktor va bir nechta kuchli misol orqali o'rgatadi.",
              ru: 'Эта версия учит датам через одно правило, один конструктор и несколько сильных примеров.',
              en: 'This sample teaches dates through one rule, one composer, and a few strong examples.',
            })}
          </p>
        </div>
      </section>

      <div className="riqi-sample-layout">
        <section className="riqi-sample-panel riqi-sample-panel--core">
          <div className="riqi-sample-panel__label">{t({ uz: 'Asosiy qoida', ru: 'Главное правило', en: 'Core rule' })}</div>
          <div className="riqi-sample-rule">
            <span className="riqi-sample-rule__month">{t({ uz: 'oy', ru: 'месяц', en: 'month' })}</span>
            <span className="riqi-sample-rule__arrow">→</span>
            <span className="riqi-sample-rule__day">{t({ uz: 'kun', ru: 'число', en: 'day' })}</span>
            <span className="riqi-sample-rule__arrow">→</span>
            <span className="riqi-sample-rule__week">{t({ uz: 'hafta kuni', ru: 'день недели', en: 'weekday' })}</span>
          </div>
          <p className="riqi-sample-panel__body">
            {t({
              uz: "Xitoychada sana odatda katta birlikdan kichikka qarab ketadi: oy, kun, so'ng hafta kuni.",
              ru: 'В китайском дата обычно идёт от большего к меньшему: месяц, число, затем день недели.',
              en: 'In Chinese, dates usually move from bigger unit to smaller one: month, day, then weekday.',
            })}
          </p>

          <div className="riqi-sample-signal-grid">
            <div className="riqi-sample-signal">
              <strong>月</strong>
              <span>{t({ uz: 'oy', ru: 'месяц', en: 'month' })}</span>
            </div>
            <div className="riqi-sample-signal">
              <strong>号</strong>
              <span>{t({ uz: 'sana', ru: 'число', en: 'date number' })}</span>
            </div>
            <div className="riqi-sample-signal">
              <strong>星期</strong>
              <span>{t({ uz: 'hafta kuni', ru: 'день недели', en: 'weekday' })}</span>
            </div>
          </div>
        </section>

        <aside className="riqi-sample-panel riqi-sample-panel--composer">
          <div className="riqi-sample-panel__label">{t({ uz: 'Sana yig‘uvchi', ru: 'Конструктор даты', en: 'Date Composer' })}</div>
          <div className="riqi-sample-composer">
            <div className="riqi-sample-composer__controls">
              <label className="riqi-sample-composer__field">
                <span>{t({ uz: 'Oy', ru: 'Месяц', en: 'Month' })}</span>
                <select value={monthIndex} onChange={e => setMonthIndex(Number(e.target.value))}>
                  {months.map((item, index) => (
                    <option key={item.zh} value={index}>
                      {item.zh} · {item[language]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="riqi-sample-composer__field">
                <span>{t({ uz: 'Kun', ru: 'Число', en: 'Day' })}</span>
                <input type="range" min="1" max="28" value={day} onChange={e => setDay(Number(e.target.value))} />
                <strong>{day}</strong>
              </label>

              <label className="riqi-sample-composer__field">
                <span>{t({ uz: 'Hafta kuni', ru: 'День недели', en: 'Weekday' })}</span>
                <select value={weekdayIndex} onChange={e => setWeekdayIndex(Number(e.target.value))}>
                  {weekdays.map((item, index) => (
                    <option key={item.zh} value={index}>
                      {item.zh} · {item[language]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button type="button" className="riqi-sample-composer__play" onClick={() => playGrammarAudio(composed.zh.replace(' ', ''))}>
              {t({ uz: 'Ovozni eshitish', ru: 'Прослушать', en: 'Play audio' })}
            </button>

            <div className="riqi-sample-composer__output">
              <div className="riqi-sample-composer__zh">{composed.zh}</div>
              <div className="riqi-sample-composer__py">{composed.py}</div>
              <div className="riqi-sample-composer__tr">{composed.tr[language]}</div>
            </div>
          </div>
        </aside>

        <section className="riqi-sample-panel">
          <div className="riqi-sample-panel__label">{t({ uz: 'Yadro misollar', ru: 'Ключевые примеры', en: 'Anchor examples' })}</div>
          <div className="riqi-sample-stack">
            {[
              {
                tag: 'Q1',
                zh: '今天几月几号？',
                py: 'Jīntiān jǐ yuè jǐ hào?',
                tr: { uz: 'Bugun nechanchi oy nechanchi kun?', ru: 'Какое сегодня число?', en: "What is today's date?" },
              },
              {
                tag: 'A1',
                zh: '今天九月二号。',
                py: 'Jīntiān jiǔ yuè èr hào.',
                tr: { uz: 'Bugun 2-sentyabr.', ru: 'Сегодня 2 сентября.', en: 'Today is September 2nd.' },
              },
              {
                tag: 'Q2',
                zh: '今天星期几？',
                py: 'Jīntiān xīngqī jǐ?',
                tr: { uz: 'Bugun haftaning qaysi kuni?', ru: 'Какой сегодня день недели?', en: 'What day is it today?' },
              },
              {
                tag: 'A2',
                zh: '今天星期四。',
                py: 'Jīntiān xīngqī sì.',
                tr: { uz: 'Bugun payshanba.', ru: 'Сегодня четверг.', en: 'Today is Thursday.' },
              },
            ].map((item) => (
              <button key={item.zh} type="button" className="riqi-sample-line" onClick={() => playGrammarAudio(item.zh)}>
                <span className="riqi-sample-line__tag">{item.tag}</span>
                <span className="riqi-sample-line__main">
                  <span className="riqi-sample-line__zh">{item.zh}</span>
                  <span className="riqi-sample-line__py">{item.py}</span>
                  <span className="riqi-sample-line__tr">{item.tr[language]}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="riqi-sample-panel">
          <div className="riqi-sample-panel__label">{t({ uz: 'Xatolarni tez tuzatish', ru: 'Быстрая коррекция ошибок', en: 'Fast mistake correction' })}</div>
          <div className="riqi-sample-mistakes">
            <div className="riqi-sample-mistake riqi-sample-mistake--bad">
              <div className="riqi-sample-mistake__title">{t({ uz: "Noto'g'ri", ru: 'Неверно', en: 'Wrong' })}</div>
              <div className="riqi-sample-mistake__zh">二号九月</div>
              <div className="riqi-sample-mistake__note">{t({ uz: 'kun → oy emas', ru: 'не число → месяц', en: 'not day → month' })}</div>
            </div>
            <div className="riqi-sample-mistake riqi-sample-mistake--good">
              <div className="riqi-sample-mistake__title">{t({ uz: "To'g'ri", ru: 'Верно', en: 'Right' })}</div>
              <div className="riqi-sample-mistake__zh">九月二号</div>
              <div className="riqi-sample-mistake__note">{t({ uz: 'oy → kun', ru: 'месяц → число', en: 'month → day' })}</div>
            </div>
          </div>
          <div className="riqi-sample-mistakes">
            <div className="riqi-sample-mistake riqi-sample-mistake--bad">
              <div className="riqi-sample-mistake__title">{t({ uz: "Noto'g'ri", ru: 'Неверно', en: 'Wrong' })}</div>
              <div className="riqi-sample-mistake__zh">今天几号几月？</div>
            </div>
            <div className="riqi-sample-mistake riqi-sample-mistake--good">
              <div className="riqi-sample-mistake__title">{t({ uz: "To'g'ri", ru: 'Верно', en: 'Right' })}</div>
              <div className="riqi-sample-mistake__zh">今天几月几号？</div>
            </div>
          </div>
        </section>

        <section className="riqi-sample-panel">
          <div className="riqi-sample-panel__label">{t({ uz: 'Mini tekshiruv', ru: 'Мини-проверка', en: 'Mini check' })}</div>
          {quickQuestions.map((item, qIndex) => (
            <div key={qIndex} className="grammar-quiz__question">
              <div className="grammar-quiz__q">{item.prompt[language]}</div>
              <div className="grammar-quiz__options">
                {item.options.map((option, optionIndex) => {
                  const selected = answers[qIndex] === optionIndex;
                  const revealed = answers[qIndex] !== undefined;
                  const className = [
                    'grammar-quiz__option',
                    selected ? 'grammar-quiz__option--selected' : '',
                    revealed && optionIndex === item.correct ? 'grammar-quiz__option--correct' : '',
                    revealed && selected && optionIndex !== item.correct ? 'grammar-quiz__option--wrong' : '',
                  ].filter(Boolean).join(' ');

                  return (
                    <button
                      key={option}
                      type="button"
                      className={className}
                      onClick={() => setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }))}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(answers).length === quickQuestions.length ? (
            <div className={`grammar-quiz__result ${score === quickQuestions.length ? 'grammar-quiz__result--perfect' : ''}`}>
              <div className="grammar-quiz__result-score">{score} / {quickQuestions.length}</div>
              <div className="grammar-quiz__result-msg">
                {score === quickQuestions.length
                  ? t({ uz: 'Tartib tushunarli.', ru: 'Порядок понятен.', en: 'The order is clear.' })
                  : t({ uz: 'Eng ko‘p xato: oy va kun o‘rnini almashtirish.', ru: 'Самая частая ошибка: поменять местами месяц и число.', en: 'Most common miss: swapping month and day.' })}
              </div>
            </div>
          ) : null}
        </section>

      </div>

      <PageFooter />
    </div>
  );
}
