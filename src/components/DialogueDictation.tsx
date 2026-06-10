'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Language } from '../types/ui-state';
import { shuffleArray } from '@/utils/shuffle';
import { resolveTtsUrl } from '@/utils/ttsAudio';

export interface DictationLine {
  id: string;
  zh: string;
  pinyin: string;
  translation: string;
  audioUrl?: string;
}

const isHan = (c: string) => /[㐀-鿿]/.test(c);

const T = (language: Language, uz: string, ru: string, en: string) =>
  language === 'ru' ? ru : language === 'en' ? en : uz;

/**
 * Dictation (listening) exercise for the dialogue reader. The learner hears a
 * line (text hidden), then rebuilds it by tapping its CHARACTERS into the
 * correct order. Reuses the test app's scramble *idea* — bespoke, self-
 * contained (no test engine), styled with the reader's own `dr-*` look.
 */
export function DialogueDictation({ lines, language }: { lines: DictationLine[]; language: Language }) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);   // tile ids in answer order
  const [tray, setTray] = useState<number[]>([]);        // tile ids still in the tray
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'revealed'>('idle');
  const [mistakes, setMistakes] = useState(0);
  const [results, setResults] = useState<boolean[]>([]); // first-try correct per line
  const [loadingAudio, setLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
    return () => { a.pause(); a.src = ''; };
  }, []);

  const line = lines[idx];
  // Target = the line's Han characters in order (punctuation excluded).
  const chars = useMemo(() => (line ? Array.from(line.zh).filter(isHan) : []), [line]);
  const target = chars.join('');

  const playLine = useCallback(async (l: DictationLine | undefined) => {
    if (!l) return;
    const a = audioRef.current;
    if (!a) return;
    setLoadingAudio(true);
    const url = l.audioUrl ?? await resolveTtsUrl(l.zh);
    setLoadingAudio(false);
    if (!url) return;
    a.src = url;
    try { await a.play(); } catch { /* autoplay blocked — Play button still works */ }
  }, []);

  // Enter a line: shuffle its tiles, clear the answer, autoplay the audio.
  // Done in event handlers (Start / Next / Restart) — not an effect — to
  // avoid setState-in-effect cascading renders.
  const enterLine = useCallback((i: number) => {
    const l = lines[i];
    const cs = l ? Array.from(l.zh).filter(isHan) : [];
    setPlaced([]);
    setTray(shuffleArray(cs.map((_, k) => k)));
    setStatus('idle');
    setMistakes(0);
    void playLine(l);
  }, [lines, playLine]);

  const start = () => { setPhase('play'); setIdx(0); enterLine(0); };

  const tapTray = (tileId: number) => {
    if (status === 'correct' || status === 'revealed') return;
    const nextPlaced = [...placed, tileId];
    setPlaced(nextPlaced);
    setTray(t => t.filter(x => x !== tileId));
    // Check as soon as every tile is placed (no effect needed).
    if (nextPlaced.length === chars.length) {
      const answer = nextPlaced.map(i => chars[i]).join('');
      if (answer === target) {
        setStatus('correct');
        setResults(prev => { const n = prev.slice(); n[idx] = mistakes === 0; return n; });
      } else {
        setStatus('wrong');
        setMistakes(m => m + 1);
      }
    } else {
      setStatus('idle');
    }
  };
  const tapPlaced = (pos: number) => {
    if (status === 'correct' || status === 'revealed') return;
    const tileId = placed[pos];
    setStatus('idle');
    setPlaced(p => p.filter((_, i) => i !== pos));
    setTray(t => [...t, tileId]);
  };

  const reveal = () => {
    setPlaced(chars.map((_, i) => i)); // ordered tiles = correct
    setTray([]);
    setStatus('revealed');
    setResults(prev => { const n = prev.slice(); n[idx] = false; return n; });
  };

  const next = () => {
    if (idx + 1 >= lines.length) { setPhase('done'); return; }
    const ni = idx + 1;
    setIdx(ni);
    enterLine(ni);
  };

  const restart = () => { setResults([]); setPhase('play'); setIdx(0); enterLine(0); };

  if (lines.length === 0) {
    return (
      <div className="dr-empty">
        <div className="dr-empty__icon">🚧</div>
        <div>{T(language, 'Tez kunda', 'Скоро будет', 'Coming soon')}</div>
      </div>
    );
  }

  // ── Ready screen ──
  if (phase === 'ready') {
    return (
      <div className="dr-dict dr-dict--center">
        <div className="dr-dict__ear" aria-hidden="true">🎧</div>
        <h3 className="dr-dict__heading">{T(language, 'Diktant', 'Диктант', 'Dictation')}</h3>
        <p className="dr-dict__intro">
          {T(language,
            'Gapni eshiting va ierogliflarni to\'g\'ri tartibda joylang.',
            'Послушайте фразу и расставьте иероглифы в правильном порядке.',
            'Listen to the line, then put the characters in the right order.')}
        </p>
        <button type="button" className="dr-dict__btn dr-dict__btn--primary" onClick={start}>
          {T(language, 'Boshlash', 'Начать', 'Start')}
        </button>
      </div>
    );
  }

  // ── Done screen ──
  if (phase === 'done') {
    const correct = results.filter(Boolean).length;
    return (
      <div className="dr-dict dr-dict--center">
        <div className="dr-dict__ear" aria-hidden="true">🎉</div>
        <h3 className="dr-dict__heading">{T(language, 'Tugadi!', 'Готово!', 'Done!')}</h3>
        <p className="dr-dict__score">{correct} / {lines.length}</p>
        <p className="dr-dict__intro">
          {T(language, 'birinchi urinishda to\'g\'ri', 'верно с первой попытки', 'correct on the first try')}
        </p>
        <button type="button" className="dr-dict__btn dr-dict__btn--primary" onClick={restart}>
          {T(language, 'Qaytadan', 'Заново', 'Restart')}
        </button>
      </div>
    );
  }

  // ── Playing a line ──
  const done = status === 'correct' || status === 'revealed';
  return (
    <div className="dr-dict">
      <div className="dr-dict__progress">{idx + 1} / {lines.length}</div>

      <button
        type="button"
        className="dr-dict__audio-btn"
        onClick={() => playLine(line)}
        aria-label={T(language, 'Audioni eshitish', 'Прослушать', 'Play audio')}
      >
        {loadingAudio ? (
          <span className="dr-dict__spinner" aria-hidden="true" />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>
        )}
        <span>{T(language, 'Eshitish', 'Слушать', 'Listen')}</span>
      </button>

      {/* Answer slots */}
      <div className={`dr-dict__answer dr-dict__answer--${status}`}>
        {placed.length === 0 ? (
          <span className="dr-dict__answer-hint">{T(language, 'Tartiblang', 'Расставьте', 'Arrange')}</span>
        ) : placed.map((tileId, pos) => (
          <button
            key={pos}
            type="button"
            className="dr-dict__tile dr-dict__tile--placed"
            onClick={() => tapPlaced(pos)}
            disabled={done}
          >
            {chars[tileId]}
          </button>
        ))}
      </div>

      {/* Tray */}
      {!done && (
        <div className="dr-dict__tray">
          {tray.map(tileId => (
            <button key={tileId} type="button" className="dr-dict__tile" onClick={() => tapTray(tileId)}>
              {chars[tileId]}
            </button>
          ))}
        </div>
      )}

      {status === 'wrong' && (
        <div className="dr-dict__feedback dr-dict__feedback--wrong">
          {T(language, 'Tartib noto\'g\'ri — qayta urinib ko\'ring', 'Неверный порядок — попробуйте ещё раз', 'Wrong order — try again')}
        </div>
      )}

      {/* Reveal (give up) — only before solving */}
      {!done && (
        <button type="button" className="dr-dict__link" onClick={reveal}>
          {T(language, 'Javobni ko\'rsatish', 'Показать ответ', 'Show answer')}
        </button>
      )}

      {/* Solved / revealed → show the full line + Next */}
      {done && (
        <div className="dr-dict__reveal">
          <div className={`dr-dict__reveal-badge dr-dict__reveal-badge--${status}`}>
            {status === 'correct'
              ? T(language, '✓ To\'g\'ri', '✓ Верно', '✓ Correct')
              : T(language, 'Javob', 'Ответ', 'Answer')}
          </div>
          <div className="dr-dict__reveal-zh">{line.zh}</div>
          <div className="dr-dict__reveal-py">{line.pinyin}</div>
          <div className="dr-dict__reveal-tr">{line.translation}</div>
          <button type="button" className="dr-dict__btn dr-dict__btn--primary" onClick={next}>
            {idx + 1 >= lines.length
              ? T(language, 'Yakunlash', 'Завершить', 'Finish')
              : T(language, 'Keyingi', 'Дальше', 'Next')}
          </button>
        </div>
      )}
    </div>
  );
}
