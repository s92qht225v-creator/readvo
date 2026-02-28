'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { ReaderControls } from './ReaderControls';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';

interface KaraokeChar {
  id: number;
  text: string;
  p?: string;
  timestamp: number;
  duration: number;
}

interface KaraokeLine {
  id: number;
  words: KaraokeChar[];
  translation?: string;
  translation_ru?: string;
}

interface KaraokeSong {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  artist: string;
  artist_ru: string;
  audio_url: string;
  lines: KaraokeLine[];
}

interface KaraokePlayerProps {
  song: KaraokeSong;
  bookPath: string;
}

export function KaraokePlayer({ song, bookPath }: KaraokePlayerProps) {
  // Trial check — karaoke is never free
  const trial = useTrial();
  if (trial?.isTrialExpired) {
    return <Paywall />;
  }

  const [language, toggleLanguage] = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const [tappedLineIdx, setTappedLineIdx] = useState(-1);
  const animFrameRef = useRef<number | null>(null);
  const linesContainerRef = useRef<HTMLDivElement | null>(null);

  // Compute the audio-synced line index based on currentTime
  const audioLineIdx = useMemo(() => {
    if (!isPlaying && currentTime === 0) return -1;
    for (let i = song.lines.length - 1; i >= 0; i--) {
      const line = song.lines[i];
      if (line.words.length > 0 && currentTime >= line.words[0].timestamp) {
        return i;
      }
    }
    return -1;
  }, [currentTime, isPlaying, song.lines]);

  // Audio-synced takes priority over tapped; clear tap when audio plays
  const activeLineIdx = audioLineIdx >= 0 ? audioLineIdx : tappedLineIdx;

  // Initialize audio
  useEffect(() => {
    if (!song.audio_url) return;
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('playing', () => {
      setIsLoading(false);
      setIsPlaying(true);
      setTappedLineIdx(-1);
    });
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener('error', () => {
      setIsLoading(false);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [song.audio_url]);

  // Use requestAnimationFrame for smooth time updates
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const tick = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIdx < 0 || !linesContainerRef.current) return;
    const lineEl = linesContainerRef.current.children[activeLineIdx] as HTMLElement;
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIdx]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !song.audio_url) return;

    if (isPlaying) {
      audio.pause();
    } else if (audio.src) {
      audio.play();
    } else {
      setIsLoading(true);
      audio.src = song.audio_url;
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, song.audio_url]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="karaoke">
      {/* Header */}
      <header className="reader__header">
        <div className="reader__header-inner">
          <Link href="/chinese?tab=karaoke" className="reader__home">
            <img src="/logo.svg" alt="Blim" className="reader__home-logo" />
          </Link>
          <ReaderControls
            isPinyinVisible={showPinyin}
            onPinyinToggle={() => {}}
            isTranslationVisible={showTranslation}
            onTranslationToggle={() => {}}
            fontSize={fontSize}
            onFontIncrease={() => setFontSize((s) => Math.min(s + 10, 150))}
            onFontDecrease={() => setFontSize((s) => Math.max(s - 10, 80))}
            language={language}
            onLanguageToggle={toggleLanguage}
            pageNumber={0}
          />
        </div>
      </header>

      {/* Translation panel - fixed below header */}
      {showTranslation && activeLineIdx >= 0 && (() => {
        const activeLine = song.lines[activeLineIdx];
        const activeTranslation = language === 'ru' ? activeLine?.translation_ru : activeLine?.translation;
        return activeTranslation ? (
          <div className="story__translation-panel">
            <p className="story__translation-panel-text">{activeTranslation}</p>
          </div>
        ) : null;
      })()}

      {/* Lyrics */}
      <div className="karaoke__lyrics" ref={linesContainerRef} style={{ fontSize: `${fontSize}%` }}>
        {song.lines.map((line, lineIdx) => {
          const lineText = line.words.map((w) => w.text).join('');
          if (!lineText) return null;

          const isActive = lineIdx === activeLineIdx;
          const isPast = lineIdx < activeLineIdx;

          return (
            <div
              key={line.id}
              className={`karaoke__line ${isActive ? 'karaoke__line--active' : ''} ${isPast ? 'karaoke__line--past' : ''}`}
              onClick={() => setTappedLineIdx(lineIdx === tappedLineIdx ? -1 : lineIdx)}
            >
              {line.words.map((char) => {
                const charStart = char.timestamp;
                const charEnd = char.timestamp + char.duration;
                const isSung = currentTime >= charStart;
                const isSinging = currentTime >= charStart && currentTime < charEnd;
                const isPunct = /^[，。！？、；：""''…—·\s.,!?;:'"()\-]$/.test(char.text);

                return (
                  <ruby
                    key={char.id}
                    className={`karaoke__char ${isSinging ? 'karaoke__char--singing' : ''} ${isSung && isActive ? 'karaoke__char--sung' : ''}`}
                  >
                    {char.text}
                    <rp>(</rp>
                    <rt className={`karaoke__rt ${!showPinyin || isPunct || !char.p ? 'karaoke__rt--hidden' : ''}`}>
                      {char.p || ''}
                    </rt>
                    <rp>)</rp>
                  </ruby>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Audio controls */}
      <div className="karaoke__controls">
        {/* Progress bar */}
        <div className="karaoke__progress" onClick={handleSeek}>
          <div className="karaoke__progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="karaoke__time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Playback buttons */}
        <div className="karaoke__playback-row">
          <button
            className="karaoke__skip-btn"
            onClick={() => handleSkip(-15)}
            type="button"
            aria-label="Rewind 15 seconds"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span className="karaoke__skip-label">15</span>
          </button>
          <button
            className={`karaoke__play-btn ${isLoading ? 'karaoke__play-btn--loading' : ''}`}
            onClick={handlePlayPause}
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <span className="karaoke__spinner" />
            ) : isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            className="karaoke__skip-btn"
            onClick={() => handleSkip(15)}
            type="button"
            aria-label="Forward 15 seconds"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
            <span className="karaoke__skip-label">15</span>
          </button>
        </div>
      </div>

      {/* Bottom bar with toggles */}
      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowTranslation((v) => !v)}
            type="button"
          >
            Tarjima
          </button>
          <button
            className={`reader__nav-toggle ${showPinyin ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowPinyin((v) => !v)}
            type="button"
          >
            Pinyin
          </button>
        </div>
      </nav>
    </div>
  );
}
