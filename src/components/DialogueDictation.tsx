'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Language } from '../types/ui-state';
import { shuffleArray } from '@/utils/shuffle';
import { resolveTtsUrl } from '@/utils/ttsAudio';
import { hanChars, normalizeHan } from '@/utils/hanziNormalize';
import { alignPinyinToText } from '@/utils/rubyText';

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
 * line (text hidden), then reproduces it. Two input modes:
 *   - tiles: rebuild the line by tapping/dragging its CHARACTERS into order
 *            (HSK 1–4 default, and the fallback for learners with no IME).
 *   - type:  type the characters with a Chinese keyboard (HSK 5/6 default).
 * Bespoke, self-contained (no test engine), styled with the reader's `dr-*` look.
 */
export function DialogueDictation({ lines, language, level = 1, pinyinTiles = false, keyboard = false }: { lines: DictationLine[]; language: Language; level?: number; pinyinTiles?: boolean; keyboard?: boolean }) {
  // Two independent choices: WHAT the tokens are (pinyinTiles → syllables, else
  // characters) and HOW you enter them (keyboard → fixed keys + backspace, else
  // drag-tiles). Pinyin always implies the keyboard; characters can use either.
  const useKeyboard = keyboard || pinyinTiles;
  // HSK 5/6 default to typing; lower levels stay on tiles. The mode is session-
  // level (persists across lines), toggled via the fallback link when level≥5.
  const [mode, setMode] = useState<'tiles' | 'type'>(level >= 5 ? 'type' : 'tiles');
  const canType = level >= 5;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);   // tile ids in answer order
  const [tray, setTray] = useState<number[]>([]);        // tile ids still in the tray
  const [typed, setTyped] = useState('');                // typing mode input
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'revealed'>('idle');
  const [mistakes, setMistakes] = useState(0);
  const [results, setResults] = useState<boolean[]>([]); // first-try correct per line
  const [loadingAudio, setLoadingAudio] = useState(false);

  // Auto-grow the typing textarea so the full (wrapped) sentence stays visible.
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [typed, mode, idx]);

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

  // The tiles the learner arranges. Normally one per Han CHARACTER. In
  // pinyin-tile mode (HSK 1 prototype) it's instead one per toned pinyin
  // SYLLABLE — the learner reconstructs the *sound*, not the characters.
  // alignPinyinToText splits compound pinyin per character (明天 → míng·tiān).
  const lineTokens = useCallback((l: DictationLine | undefined): string[] => {
    if (!l) return [];
    if (!pinyinTiles) return Array.from(l.zh).filter(isHan);
    return alignPinyinToText(l.zh, l.pinyin)
      .filter(p => p.pinyin && isHan(p.char[0]))
      .map(p => p.pinyin as string);
  }, [pinyinTiles]);
  const tokens = useMemo(() => lineTokens(line), [line, lineTokens]);

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
    const cs = lineTokens(l);
    setPlaced([]);
    setTray(shuffleArray(cs.map((_, k) => k)));
    setTyped('');
    setStatus('idle');
    setMistakes(0);
    void playLine(l);
  }, [lines, playLine, lineTokens]);

  const start = () => { setPhase('play'); setIdx(0); enterLine(0); };

  // Drag-to-reorder within the answer box. PointerSensor with a small
  // activation distance keeps tap-to-remove working (a tap < 6px is a click,
  // not a drag). `draggedRef` suppresses the click that some browsers fire
  // right after a drag, so reordering never accidentally removes a tile.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const draggedRef = useRef(false);

  // Score a candidate answer order: green when complete + correct, red when
  // complete + wrong, idle while still incomplete.
  const evaluate = (arr: number[]) => {
    if (arr.length !== tokens.length) { setStatus('idle'); return; }
    // Compare the arranged sequence to the correct order. Identical tokens
    // (repeated syllables/chars) are interchangeable, which is fine.
    const answer = arr.map(i => tokens[i]).join('');
    if (answer === tokens.join('')) {
      setStatus('correct');
      setResults(prev => { const n = prev.slice(); n[idx] = mistakes === 0; return n; });
    } else {
      setStatus('wrong');
      setMistakes(m => m + 1);
    }
  };

  const tapTray = (tileId: number) => {
    if (status === 'correct' || status === 'revealed') return;
    const nextPlaced = [...placed, tileId];
    setPlaced(nextPlaced);
    setTray(t => t.filter(x => x !== tileId));
    evaluate(nextPlaced);
  };
  const tapPlaced = (pos: number) => {
    if (draggedRef.current) return; // ignore the click that follows a drag
    if (status === 'correct' || status === 'revealed') return;
    const tileId = placed[pos];
    setStatus('idle');
    setPlaced(p => p.filter((_, i) => i !== pos));
    setTray(t => [...t, tileId]);
  };

  const onDragStart = () => { draggedRef.current = true; };
  const onDragEnd = (e: DragEndEvent) => {
    setTimeout(() => { draggedRef.current = false; }, 0);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = placed.indexOf(active.id as number);
    const to = placed.indexOf(over.id as number);
    if (from < 0 || to < 0) return;
    const nextPlaced = arrayMove(placed, from, to);
    setPlaced(nextPlaced);
    evaluate(nextPlaced); // re-check: a reorder can complete or fix the answer
  };

  // ── Pinyin keyboard model (pinyinTiles mode) ──
  // The scrambled syllables act as a keyboard: keys stay in fixed positions
  // (tray order, never reshuffled), tapping appends the syllable to the answer
  // line and dims the key in place, backspace pops the last one. No drag, no
  // mid-sequence insert — you rebuild the line left-to-right.
  const pressKey = (id: number) => {
    if (status === 'correct' || status === 'revealed' || placed.includes(id)) return;
    const next = [...placed, id];
    setPlaced(next);
    evaluate(next);
  };
  const backspaceKey = () => {
    if (status === 'correct' || status === 'revealed' || placed.length === 0) return;
    setStatus('idle');
    setPlaced(p => p.slice(0, -1));
  };

  // Typing mode: check the typed line against the target (Han-only, trad→simp).
  const checkTyped = () => {
    if (status === 'correct' || status === 'revealed') return;
    if (!normalizeHan(typed)) return; // ignore empty / punctuation-only submits
    if (normalizeHan(typed) === normalizeHan(target)) {
      setStatus('correct');
      setResults(prev => { const n = prev.slice(); n[idx] = mistakes === 0; return n; });
    } else {
      setStatus('wrong');
      setMistakes(m => m + 1);
    }
  };

  // Switch input method (only offered at HSK 5/6). Session-level: persists across
  // lines. Resets the current line's answer so the new mode starts clean; keeps
  // the mistake count so swapping tools isn't a free retry.
  const switchMode = (m: 'tiles' | 'type') => {
    setMode(m);
    setPlaced([]);
    setTray(shuffleArray(tokens.map((_, k) => k)));
    setTyped('');
    setStatus('idle');
  };

  const reveal = () => {
    setPlaced(tokens.map((_, i) => i)); // ordered tiles = correct
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
          {pinyinTiles
            ? T(language,
                'Gapni eshiting va pinyin bo\'g\'inlarini to\'g\'ri tartibda joylang.',
                'Послушайте фразу и расставьте слоги пиньинь в правильном порядке.',
                'Listen to the line, then put the pinyin syllables in the right order.')
            : T(language,
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

      {mode === 'tiles' ? (
        useKeyboard ? (
          <>
            {/* Keyboard: the answer is a compact text line; the scrambled keys
                below stay in place and dim when used. Syllables join with a
                space, characters run together. */}
            <div className={`dr-dict__answer dr-dict__answer--text${status !== 'idle' ? ` dr-dict__answer--${status}` : ''}`}>
              {placed.length === 0
                ? <span className="dr-dict__answer-hint">{pinyinTiles
                    ? T(language, 'Bo\'g\'inlarni bosing', 'Нажимайте слоги', 'Tap the syllables')
                    : T(language, 'Ierogliflarni bosing', 'Нажимайте иероглифы', 'Tap the characters')}</span>
                : placed.map(id => tokens[id]).join(pinyinTiles ? ' ' : '')}
            </div>

            {!done && (
              <div className="dr-dict__tray">
                {tray.map(id => (
                  <button
                    key={id}
                    type="button"
                    className={`dr-dict__tile${pinyinTiles ? ' dr-dict__tile--py' : ''}${placed.includes(id) ? ' dr-dict__tile--used' : ''}`}
                    onClick={() => pressKey(id)}
                    disabled={placed.includes(id)}
                  >
                    {tokens[id]}
                  </button>
                ))}
                <button type="button" className={`dr-dict__tile${pinyinTiles ? ' dr-dict__tile--py' : ''} dr-dict__tile--back`} onClick={backspaceKey} disabled={placed.length === 0} aria-label="Backspace">⌫</button>
              </div>
            )}

            {status === 'wrong' && (
              <div className="dr-dict__feedback dr-dict__feedback--wrong">
                {T(language, 'Tartib noto\'g\'ri — ⌫ bilan tuzating', 'Неверный порядок — исправьте через ⌫', 'Wrong order — fix it with ⌫')}
              </div>
            )}
          </>
        ) : (
        <>
          {/* Answer slots — drag a placed tile to reorder, tap it to remove */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <SortableContext items={placed} strategy={rectSortingStrategy}>
              <div className={`dr-dict__answer dr-dict__answer--${status}`}>
                {placed.length === 0 ? (
                  <span className="dr-dict__answer-hint">{T(language, 'Tartiblang', 'Расставьте', 'Arrange')}</span>
                ) : placed.map((tileId, pos) => (
                  <SortablePlacedTile
                    key={tileId}
                    id={tileId}
                    token={tokens[tileId]}
                    py={pinyinTiles}
                    onTap={() => tapPlaced(pos)}
                    disabled={done}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Tray */}
          {!done && (
            <div className="dr-dict__tray">
              {tray.map(tileId => (
                <button key={tileId} type="button" className={`dr-dict__tile${pinyinTiles ? ' dr-dict__tile--py' : ''}`} onClick={() => tapTray(tileId)}>
                  {tokens[tileId]}
                </button>
              ))}
            </div>
          )}

          {status === 'wrong' && (
            <div className="dr-dict__feedback dr-dict__feedback--wrong">
              {T(language, 'Tartib noto\'g\'ri — qayta urinib ko\'ring', 'Неверный порядок — попробуйте ещё раз', 'Wrong order — try again')}
            </div>
          )}
        </>
        )
      ) : (
        <>
          {/* Typing input — learner types the line with a Chinese IME. A
              textarea (not <input>) so long sentences wrap and stay fully
              visible; Enter is left to the IME, submit is the Check button. */}
          <div className="dr-dict__type">
            <textarea
              ref={inputRef}
              className={`dr-dict__input dr-dict__input--${status}`}
              value={typed}
              onChange={(e) => { setTyped(e.target.value); if (status === 'wrong') setStatus('idle'); }}
              disabled={done}
              rows={2}
              placeholder={T(language, 'Eshitganingizni yozing…', 'Введите услышанное…', 'Type what you hear…')}
              lang="zh"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {!done && (
              <button
                type="button"
                className="dr-dict__btn dr-dict__btn--primary dr-dict__check"
                onClick={checkTyped}
                disabled={!normalizeHan(typed)}
              >
                {T(language, 'Tekshirish', 'Проверить', 'Check')}
              </button>
            )}
          </div>

          {status === 'wrong' && (
            <div className="dr-dict__feedback dr-dict__feedback--wrong">
              <div className="dr-dict__diff">
                {hanChars(typed).map((c, i) => (
                  <span key={i} className={c === chars[i] ? 'dr-dict__diff-ok' : 'dr-dict__diff-bad'}>{c}</span>
                ))}
              </div>
              <div>{T(language, 'Noto\'g\'ri — qayta urinib ko\'ring', 'Неверно — попробуйте ещё раз', 'Not quite — try again')}</div>
            </div>
          )}
        </>
      )}

      {/* Reveal (give up) — only before solving */}
      {!done && (
        <button type="button" className="dr-dict__link" onClick={reveal}>
          {T(language, 'Javobni ko\'rsatish', 'Показать ответ', 'Show answer')}
        </button>
      )}

      {/* Input-method fallback toggle — HSK 5/6 only */}
      {canType && !done && (
        <button type="button" className="dr-dict__link dr-dict__mode-toggle" onClick={() => switchMode(mode === 'type' ? 'tiles' : 'type')}>
          {mode === 'type'
            ? T(language, '⌨️ Xitoycha yoza olmaysizmi? Tartiblang', '⌨️ Не можете печатать? Соберите', '⌨️ Can\'t type Chinese? Arrange instead')
            : T(language, '⌨️ Yozishga qaytish', '⌨️ Вернуться к вводу', '⌨️ Back to typing')}
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

/** A placed answer tile: draggable to reorder (dnd-kit sortable), tappable to
 *  remove. `disabled` (after the line is solved) freezes both. */
function SortablePlacedTile({ id, token, py, onTap, disabled }: {
  id: number; token: string; py: boolean; onTap: () => void; disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 2 : undefined,
    touchAction: 'none',
  };
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={`dr-dict__tile dr-dict__tile--placed${py ? ' dr-dict__tile--py' : ''}`}
      onClick={onTap}
      disabled={disabled}
      {...attributes}
      {...listeners}
    >
      {token}
    </button>
  );
}
