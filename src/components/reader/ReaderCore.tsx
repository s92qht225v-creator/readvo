'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import '@/styles/arabic.css';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { ScriptConfig, ReaderSentence } from '@/lib/reader/scriptConfig';

interface ReaderCoreProps {
  config: ScriptConfig;
  sentences: ReaderSentence[];
  resolveAudio: (s: ReaderSentence) => Promise<string | null>;
  labels: { translation: string };
  fabExtra?: React.ReactNode;
}

export function ReaderCore({ config, sentences, resolveAudio, labels, fabExtra }: ReaderCoreProps) {
  const [showPrimaryAid, setShowPrimaryAid] = useState(true);
  const [showSecondaryAid, setShowSecondaryAid] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { play, stop } = useAudioPlayer();

  // ── Font size (A-/A+) ──────────────────────────────────────────────────────
  // Percentage applied to the lines container; shared key with the other readers.
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readvo-font-size');
      return saved ? Number(saved) : 100;
    }
    return 100;
  });
  useEffect(() => { localStorage.setItem('readvo-font-size', String(fontSize)); }, [fontSize]);
  const [fontActive, setFontActive] = useState(false);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashFont = useCallback(() => {
    setFontActive(true);
    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    fontTimerRef.current = setTimeout(() => setFontActive(false), 1500);
  }, []);

  // ── Sequential "play all" ──────────────────────────────────────────────────
  // A dedicated <audio> element (not the singleton tap player) so we get an
  // `onended` hook to advance to the next sentence. Tapping a sentence cancels
  // the sequence and vice-versa.
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const seqAudioRef = useRef<HTMLAudioElement | null>(null);
  const seqActiveRef = useRef(false);
  const seqIdxRef = useRef(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    seqAudioRef.current = a;
    return () => { seqActiveRef.current = false; a.onended = null; a.pause(); a.src = ''; };
  }, []);

  const stopSeq = useCallback(() => {
    if (!seqActiveRef.current) return;
    seqActiveRef.current = false;
    const a = seqAudioRef.current;
    if (a) { a.onended = null; a.pause(); }
    setIsPlayingAll(false);
    setIsLoadingAudio(false);
  }, []);

  const playSeqFrom = useCallback(async (idx: number) => {
    if (!seqActiveRef.current) return;
    const s = sentences[idx];
    if (!s) { seqActiveRef.current = false; setIsPlayingAll(false); setIsLoadingAudio(false); setActiveId(null); return; }
    seqIdxRef.current = idx;
    setActiveId(s.id);
    const url = s.audioUrl ?? (await resolveAudio(s));
    if (!seqActiveRef.current) return;
    const a = seqAudioRef.current;
    if (!a) return;
    if (!url) { void playSeqFrom(idx + 1); return; } // skip un-resolvable line
    a.onended = () => { if (seqActiveRef.current) void playSeqFrom(seqIdxRef.current + 1); };
    a.src = url;
    try { await a.play(); setIsLoadingAudio(false); setIsPlayingAll(true); }
    catch { /* autoplay rejected — leave state as-is */ }
  }, [sentences, resolveAudio]);

  const handlePlayAll = useCallback(() => {
    if (seqActiveRef.current) { stopSeq(); return; } // toggle: pause
    stop(); // cancel any tapped-sentence audio
    seqActiveRef.current = true;
    setIsPlayingAll(true);
    setIsLoadingAudio(true);
    const start = sentences.findIndex((s) => s.id === activeId);
    void playSeqFrom(start >= 0 ? start : 0);
  }, [stopSeq, stop, sentences, activeId, playSeqFrom]);

  const onSentence = useCallback(async (s: ReaderSentence) => {
    stopSeq(); // a manual tap cancels "play all"
    setActiveId(s.id);
    const url = s.audioUrl ?? (await resolveAudio(s));
    if (url) play(s.id, url);
  }, [play, resolveAudio, stopSeq]);

  return (
    <div className={`reader-core ${config.fontClass}`} dir={config.dir}>
      <div className="reader-core__lines" style={{ fontSize: `${fontSize}%` }}>
        {sentences.map((s) => (
          <div key={s.id} className="reader-core__line">
            {s.speaker && <span className="reader-core__speaker">{s.speaker}:</span>}
            <span
              className={`reader-core__sentence ${activeId === s.id ? 'reader-core__sentence--active' : ''}`}
              onClick={() => onSentence(s)}
            >
              {config.renderSentence(s, { showPrimaryAid, showSecondaryAid })}
            </span>
            {showTranslation && <div className="reader-core__translation" dir="auto">{s.translation}</div>}
          </div>
        ))}
      </div>

      <div className={`dr-font-controls${fontActive ? ' dr-font-controls--active' : ''}`}>
        <button className="dr-font-btn" onClick={() => { setFontSize((s) => Math.min(s + 10, 160)); flashFont(); }} type="button" aria-label="Increase font size">A+</button>
        <div className="dr-font-divider" />
        <button className="dr-font-btn" onClick={() => { setFontSize((s) => Math.max(s - 10, 80)); flashFont(); }} type="button" aria-label="Decrease font size">A-</button>
      </div>

      {fabExtra}

      {sentences.length > 0 && (
        <button
          className={`story__play-fab ${isLoadingAudio ? 'story__play-fab--loading' : ''}`}
          onClick={handlePlayAll}
          type="button"
          aria-label={isPlayingAll ? 'Pause' : 'Play all'}
        >
          {isLoadingAudio ? <span className="story__play-fab-spinner" /> :
            isPlayingAll
              ? <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              : <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
        </button>
      )}

      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${showPrimaryAid ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowPrimaryAid((v) => !v)}
            type="button"
            aria-pressed={showPrimaryAid}
          >
            {config.primaryAidLabel}
          </button>
          {config.hasSecondaryAid && (
            <button
              className={`reader__nav-toggle ${showSecondaryAid ? 'reader__nav-toggle--active' : ''}`}
              onClick={() => setShowSecondaryAid((v) => !v)}
              type="button"
              aria-pressed={showSecondaryAid}
            >
              {config.secondaryAidLabel}
            </button>
          )}
          <button
            className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowTranslation((v) => !v)}
            type="button"
            aria-pressed={showTranslation}
          >
            {labels.translation}
          </button>
        </div>
      </nav>
    </div>
  );
}
