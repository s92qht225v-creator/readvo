'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HanziCanvas } from './HanziCanvas';

export type HanziWord = { char: string; pinyin: string; uz: string; ru: string; strokes: number };

interface Props {
  lang: 'uz' | 'ru';
  words?: HanziWord[];
  onBack?: () => void;
  autoStart?: boolean;
}

const WORDS: HanziWord[] = [
  { char: '我', pinyin: 'wǒ', uz: 'men', ru: 'я', strokes: 7 },
  { char: '你', pinyin: 'nǐ', uz: 'sen', ru: 'ты', strokes: 6 },
  { char: '他', pinyin: 'tā', uz: 'u (erkak)', ru: 'он', strokes: 5 },
  { char: '她', pinyin: 'tā', uz: 'u (ayol)', ru: 'она', strokes: 6 },
  { char: '们', pinyin: 'men', uz: "ko'plik qo'shimchasi", ru: 'суффикс множества', strokes: 5 },
  { char: '吃', pinyin: 'chī', uz: 'yemoq', ru: 'есть', strokes: 6 },
  { char: '喝', pinyin: 'hē', uz: 'ichmoq', ru: 'пить', strokes: 12 },
  { char: '看', pinyin: 'kàn', uz: "ko'rmoq", ru: 'смотреть', strokes: 9 },
  { char: '听', pinyin: 'tīng', uz: 'tinglаmoq', ru: 'слушать', strokes: 7 },
  { char: '说', pinyin: 'shuō', uz: 'gapirmoq', ru: 'говорить', strokes: 9 },
  { char: '走', pinyin: 'zǒu', uz: 'yurmoq', ru: 'идти', strokes: 7 },
  { char: '来', pinyin: 'lái', uz: 'kelmoq', ru: 'приходить', strokes: 7 },
  { char: '去', pinyin: 'qù', uz: 'ketmoq', ru: 'уходить', strokes: 5 },
  { char: '大', pinyin: 'dà', uz: 'katta', ru: 'большой', strokes: 3 },
  { char: '小', pinyin: 'xiǎo', uz: 'kichik', ru: 'маленький', strokes: 3 },
  { char: '好', pinyin: 'hǎo', uz: 'yaxshi', ru: 'хороший', strokes: 6 },
  { char: '是', pinyin: 'shì', uz: "bo'lmoq", ru: 'быть', strokes: 9 },
  { char: '有', pinyin: 'yǒu', uz: "bor (ega bo'lmoq)", ru: 'иметь', strokes: 6 },
  { char: '人', pinyin: 'rén', uz: 'odam', ru: 'человек', strokes: 2 },
  { char: '中', pinyin: 'zhōng', uz: "o'rta / Xitoy", ru: 'середина / Китай', strokes: 4 },
];

const LS_KEY = 'blim-hanzi-progress';
const BOX_INTERVALS: Record<number, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };

type Progress = Record<string, { box: 1 | 2 | 3 | 4 | 5; nextReviewDate: string }>;
type View = 'home' | 'practice' | 'done';

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch { /* ignore */ }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function HanziWriterPractice({ lang, words: wordsProp, onBack, autoStart }: Props) {
  const activeWords = wordsProp ?? WORDS;
  const [view, setView] = useState<View>('home');

  // Auto-start: skip home screen and go directly to practice
  useEffect(() => {
    if (!autoStart) return;
    const progress = loadProgress();
    const today = getStartOfToday();
    const due = activeWords.filter((w) => {
      const entry = progress[w.char];
      return !entry || new Date(entry.nextReviewDate) <= today;
    });
    if (due.length === 0) return; // nothing due, stay on home to show message
    setSessionQueue(shuffle(due));
    setSessionIndex(0);
    setSessionMistakes(0);
    setQuizComplete(false);
    setView('practice');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount
  const [sessionQueue, setSessionQueue] = useState<HanziWord[]>([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [sessionMistakes, setSessionMistakes] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [showAnswer, setShowAnswer] = useState(0);
  const [hiddenMode, setHiddenMode] = useState(false);

  // Home stats derived from progress
  const [dueCount, setDueCount] = useState(0);
  const [masteryPct, setMasteryPct] = useState(0);

  const recomputeStats = useCallback(() => {
    const progress = loadProgress();
    const today = getStartOfToday();
    let due = 0;
    let mastered = 0;
    for (const word of activeWords) {
      const entry = progress[word.char];
      const isDue = !entry || new Date(entry.nextReviewDate) <= today;
      if (isDue) due++;
      if (entry && entry.box >= 5) mastered++;
    }
    setDueCount(due);
    setMasteryPct(Math.round((mastered / activeWords.length) * 100));
  }, [activeWords]);

  useEffect(() => {
    recomputeStats();
  }, [recomputeStats]);

  const handleStart = useCallback(() => {
    const progress = loadProgress();
    const today = getStartOfToday();
    const due = activeWords.filter((w) => {
      const entry = progress[w.char];
      return !entry || new Date(entry.nextReviewDate) <= today;
    });
    setSessionQueue(shuffle(due));
    setSessionIndex(0);
    setSessionMistakes(0);
    setQuizComplete(false);
    setView('practice');
  }, [activeWords]);

  const advance = useCallback(() => {
    setShowAnswer(0);
    setQuizComplete(false);
    if (sessionIndex + 1 >= sessionQueue.length) {
      setView('done');
    } else {
      setSessionIndex((i) => i + 1);
    }
  }, [sessionIndex, sessionQueue.length]);

  const handleGotIt = useCallback(() => {
    const word = sessionQueue[sessionIndex];
    if (!word) return;
    const progress = loadProgress();
    const entry = progress[word.char];
    const currentBox = entry?.box ?? 1;
    const newBox = Math.min(currentBox + 1, 5) as 1 | 2 | 3 | 4 | 5;
    const today = getStartOfToday();
    progress[word.char] = {
      box: newBox,
      nextReviewDate: addDays(today, BOX_INTERVALS[newBox]).toISOString(),
    };
    saveProgress(progress);
    advance();
  }, [sessionQueue, sessionIndex, advance]);

  const handleForgot = useCallback(() => {
    const word = sessionQueue[sessionIndex];
    if (!word) return;
    const progress = loadProgress();
    progress[word.char] = {
      box: 1,
      nextReviewDate: new Date().toISOString(),
    };
    saveProgress(progress);
    advance();
  }, [sessionQueue, sessionIndex, advance]);

  const handleCanvasComplete = useCallback((mistakes: number) => {
    setSessionMistakes((prev) => prev + mistakes);
    setTimeout(() => setQuizComplete(true), 800);
  }, []);

  const handleErase = useCallback(() => {
    setResetKey((k) => k + 1);
    setShowAnswer(0);
    setQuizComplete(false);
  }, []);

  const handleShow = useCallback(() => {
    if (quizComplete) {
      setResetKey((k) => k + 1);
      setQuizComplete(false);
      setShowAnswer(1);
    } else {
      setShowAnswer((c) => c + 1);
    }
  }, [quizComplete]);

  const handleReset = useCallback(() => {
    const msg = lang === 'ru'
      ? 'Сбросить весь прогресс письма? Это действие нельзя отменить.'
      : "Barcha yozish progressini tiklashni istaysizmi? Bu amalni bekor qilib bo'lmaydi.";
    if (!confirm(msg)) return;
    localStorage.removeItem(LS_KEY);
    recomputeStats();
  }, [lang, recomputeStats]);

  const currentWord = sessionQueue[sessionIndex];

  // --- HOME VIEW ---
  if (view === 'home') {
    return (
      <div className="hanzi-home">
          {onBack && (
            <button className="hanzi-home__back-btn" type="button" onClick={onBack}>
              ‹ {lang === 'ru' ? 'Назад' : 'Orqaga'}
            </button>
          )}
          <div className="hanzi-home__stats-row">
            <div className="hanzi-home__stat-card">
              <div className="hanzi-home__stat-value">{dueCount}</div>
              <div className="hanzi-home__stat-label">
                {lang === 'ru' ? 'К повторению' : "Takrorlash kerak"}
              </div>
            </div>
            <div className="hanzi-home__stat-card">
              <div className="hanzi-home__stat-value">{masteryPct}%</div>
              <div className="hanzi-home__stat-label">
                {lang === 'ru' ? 'Освоено' : "O'zlashtirilgan"}
              </div>
            </div>
            <div className="hanzi-home__stat-card">
              <div className="hanzi-home__stat-value">{activeWords.length}</div>
              <div className="hanzi-home__stat-label">
                {lang === 'ru' ? 'Всего иероглифов' : "Jami belgilar"}
              </div>
            </div>
          </div>

          {dueCount === 0 ? (
            <div className="hanzi-home__nothing-due">
              <p>{lang === 'ru' ? 'На сегодня всё выучено! Возвращайтесь завтра.' : "Bugun hammasi o'rganildi! Ertaga qaytib keling."}</p>
            </div>
          ) : (
            <button className="hanzi-home__start-btn" type="button" onClick={handleStart}>
              {lang === 'ru' ? `Начать (${dueCount})` : `Boshlash (${dueCount})`}
            </button>
          )}

          <button className="hanzi-home__reset-btn" type="button" onClick={handleReset}>
            {lang === 'ru' ? 'Сбросить прогресс' : "Progressni tiklash"}
          </button>
        </div>
    );
  }

  // --- DONE VIEW ---
  if (view === 'done') {
    return (
      <div className="hanzi-done">
        <div className="hanzi-done__title">
          {lang === 'ru' ? 'Отлично! 🎉' : 'Barakalla! 🎉'}
        </div>
        <div className="hanzi-done__stats">
          {lang === 'ru'
            ? `Повторено: ${sessionQueue.length} иероглифов · Ошибок: ${sessionMistakes}`
            : `Takrorlandi: ${sessionQueue.length} belgi · Xatolar: ${sessionMistakes}`}
        </div>
        <button
          className="hanzi-done__restart-btn"
          type="button"
          onClick={() => { recomputeStats(); if (onBack) onBack(); else setView('home'); }}
        >
          {lang === 'ru' ? (onBack ? 'Назад' : 'К началу') : (onBack ? 'Orqaga' : 'Boshiga qaytish')}
        </button>
      </div>
    );
  }

  // --- PRACTICE VIEW ---
  return (
    <div className="hanzi-practice">
      <div className="hanzi-practice__session-progress">
        {sessionIndex + 1} / {sessionQueue.length}
      </div>

      <div className="hanzi-practice__layout">
        {/* Left: canvas */}
        <div className="hanzi-practice__canvas-panel">
          <div className="hanzi-practice__grid-wrapper">
            {currentWord && (
              <HanziCanvas
                key={`${currentWord.char}-${resetKey}`}
                char={currentWord.char}
                lang={lang}
                onComplete={handleCanvasComplete}
                revealAll={showAnswer}
                hidden={hiddenMode}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="hanzi-practice__action-btn" type="button" onClick={handleErase}>
              {lang === 'ru' ? 'Стереть' : 'O\'chirish'}
            </button>
            <button className="hanzi-practice__action-btn" type="button" onClick={handleShow}>
              {lang === 'ru' ? 'Показать' : 'Ko\'rsatish'}
            </button>
            <button
              className={`hanzi-practice__action-btn${hiddenMode ? ' hanzi-practice__action-btn--active' : ''}`}
              type="button"
              onClick={() => {
                setHiddenMode((h) => !h);
                setResetKey((k) => k + 1);
                setShowAnswer(0);
                setQuizComplete(false);
              }}
            >
              {lang === 'ru' ? 'Скрыть' : 'Yashirish'}
            </button>
          </div>
        </div>

        {/* Right: info */}
        <div className="hanzi-practice__info-panel">
          {currentWord && (
            <>
              <div className="hanzi-practice__pinyin">{currentWord.pinyin}</div>
              <div className="hanzi-practice__meaning">
                {lang === 'ru' ? currentWord.ru : currentWord.uz}
              </div>

              <div className="hanzi-practice__stroke-count">
                <span className="hanzi-practice__stroke-separator">
                  {lang === 'ru' ? `${currentWord.strokes} черт` : `${currentWord.strokes} chiziq`}
                </span>
              </div>

              {quizComplete && (
                <div className="hanzi-practice__grade-btns">
                  <button
                    className="hanzi-practice__grade-btn hanzi-practice__grade-btn--forgot"
                    type="button"
                    onClick={handleForgot}
                  >
                    {lang === 'ru' ? 'Не помню' : "Esimda yo'q"}
                  </button>
                  <button
                    className="hanzi-practice__grade-btn hanzi-practice__grade-btn--gotit"
                    type="button"
                    onClick={handleGotIt}
                  >
                    {lang === 'ru' ? 'Знаю!' : "Bilaman!"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
