'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../hooks/useAuth';
import { Paywall } from './Paywall';
import { useAudioToken } from '../hooks/useAudioToken';
import { protectAudioUrlSync } from '../lib/audio/token-client';
import { protectAudioUrl, isStorageUrl } from '../lib/audio/url';
import { BannerMenu } from './BannerMenu';
import { CoachMarkTour } from './CoachMark';
import type { TourStep } from './CoachMark';
import { trackAll } from '@/utils/analytics';

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
  translation_en?: string;
}

// Full song type (includes gated fields: lines, audio_url)
interface KaraokeSongFull {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  artist: string;
  artist_ru: string;
  artist_en?: string;
  audio_url: string;
  lines: KaraokeLine[];
}

export interface KaraokeMeta {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
}

interface KaraokePlayerProps {
  meta: KaraokeMeta;
  bookPath: string;
}

export function KaraokePlayer({ meta, bookPath }: KaraokePlayerProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language, toggleLanguage] = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readvo-font-size');
      return saved ? Number(saved) : 100;
    }
    return 100;
  });
  useEffect(() => {
    localStorage.setItem('readvo-font-size', String(fontSize));
  }, [fontSize]);
  const [tappedLineIdx, setTappedLineIdx] = useState(-1);
  const [fontActive, setFontActive] = useState(false);
  const [mouseScrubbing, setMouseScrubbing] = useState(false);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashFont = useCallback(() => {
    setFontActive(true);
    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    fontTimerRef.current = setTimeout(() => setFontActive(false), 1500);
  }, []);
  const animFrameRef = useRef<number | null>(null);
  const linesContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Fetch state ────────────────────────────────────────────────────────────
  const [song, setSong] = useState<KaraokeSongFull | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setSong(null);
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/karaoke/${meta.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        if (cancelled) return;
        setSong(data.song as KaraokeSongFull);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [meta.id, getAccessToken, reloadKey, authLoading]);

  // Analytics: track karaoke view
  useEffect(() => {
    trackAll('ViewContent', 'karaoke_view', 'karaoke_view', {
      content_name: `Karaoke: ${meta.title}`,
      content_category: 'Karaoke',
      content_type: 'product',
    });
  }, [meta.title]);

  // Compute the audio-synced line index based on currentTime
  const audioLineIdx = useMemo(() => {
    if (!isPlaying && currentTime === 0) return -1;
    const lines = song?.lines ?? [];
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.words.length > 0 && currentTime >= line.words[0].timestamp) {
        return i;
      }
    }
    return -1;
  }, [currentTime, isPlaying, song]);

  // Audio-synced takes priority over tapped; clear tap when audio plays
  const activeLineIdx = audioLineIdx >= 0 ? audioLineIdx : tappedLineIdx;

  // Initialize audio
  useEffect(() => {
    if (!song?.audio_url) return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = protectAudioUrlSync(song.audio_url); // proxied if token ready, else public fallback
    audioRef.current = audio;

    // Property handlers so cleanup can null them out — otherwise a replaced
    // element's stale 'ended' handler still fires and corrupts the progress bar.
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setTappedLineIdx(-1);
    };
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration);
    };
    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    return () => {
      audio.onloadedmetadata = null; audio.onplaying = null; audio.onpause = null;
      audio.onended = null; audio.onerror = null;
      audio.pause();
      audio.src = '';
    };
  }, [song?.audio_url]);

  /* The init effect runs at mount, before the async audio token is ready,
     so the src may have fallen back to the public URL. Once the token
     arrives, upgrade the src to the auth-gated proxy — preserving position
     and resuming if it was already playing. */
  const audioToken = useAudioToken();
  useEffect(() => {
    const audio = audioRef.current;
    const audioUrl = song?.audio_url;
    if (!audio || !audioToken || !audioUrl || !isStorageUrl(audioUrl)) return;
    if (audio.src.includes('/api/audio/') && audio.src.includes('t=')) return; // already proxied
    const wasPlaying = !audio.paused;
    const pos = audio.currentTime;
    audio.src = protectAudioUrl(audioUrl, audioToken);
    if (pos) audio.currentTime = pos;
    if (wasPlaying) void audio.play().catch(() => {});
  }, [audioToken, song?.audio_url]);

  // Use requestAnimationFrame for smooth time updates
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      let cancelled = false;
      const tick = () => {
        if (cancelled) return;
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
      return () => {
        cancelled = true;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
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
    if (!audio || !song?.audio_url) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setIsLoading(true);
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, song?.audio_url]);

  const progressRef = useRef<HTMLDivElement | null>(null);
  const isScrubbing = useRef(false);
  // Coach-mark tour targets (first-run onboarding).
  const firstLineRef = useRef<HTMLDivElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const seekToX = useCallback((clientX: number) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !duration || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  const onScrubMove = useCallback((e: MouseEvent) => {
    if (!isScrubbing.current) return;
    seekToX(e.clientX);
  }, [seekToX]);

  const endMouseScrub = useCallback(() => {
    isScrubbing.current = false;
    setMouseScrubbing(false);
  }, []);

  const onScrubDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    isScrubbing.current = true;
    setMouseScrubbing(true);
    seekToX(e.clientX);
  }, [seekToX]);

  const onScrubTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    isScrubbing.current = true;
    seekToX(e.touches[0].clientX);
  }, [seekToX]);

  const onScrubTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isScrubbing.current) return;
    seekToX(e.touches[0].clientX);
  }, [seekToX]);

  const onScrubTouchEnd = useCallback(() => {
    isScrubbing.current = false;
  }, []);

  // Cleanup scrub listeners on unmount
  useEffect(() => {
    if (!mouseScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => onScrubMove(e);
    const handleMouseUp = () => endMouseScrub();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [endMouseScrub, mouseScrubbing, onScrubMove]);

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

  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {status === 'locked' && <Paywall />}
      <div className="karaoke">
        {/* Hero banner — always rendered */}
        <div className="dr-hero">
          <div className="dr-hero__watermark">曲</div>
          <div className="dr-hero__top-row">
            <Link href="/chinese?tab=karaoke" className="dr-back-btn" aria-label={({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language]}>
              <span aria-hidden>&#8249;</span>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1 · {({ uz: 'Karaoke', ru: 'Караоке', en: 'Karaoke' } as Record<string, string>)[language]}</div>
            <h1 className="dr-hero__title">{meta.title}</h1>
            <div className="dr-hero__pinyin">{meta.pinyin}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? meta.titleTranslation_ru : language === 'en' ? (meta.titleTranslation_en || meta.titleTranslation) : meta.titleTranslation} —</div>
          </div>
        </div>

        {/* Loading spinner */}
        {status === 'loading' && <div className="loading-spinner" />}

        {/* Error + Retry */}
        {status === 'error' && (
          <div className="page__audio-error" role="status" style={{ position: 'static', margin: '24px auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {({ uz: 'Yuklab boʻlmadi.', ru: 'Не удалось загрузить.', en: 'Could not load.' } as Record<string, string>)[language]}
            <button type="button" onClick={() => setReloadKey(k => k + 1)}>
              {({ uz: 'Qayta urinish', ru: 'Повторить', en: 'Retry' } as Record<string, string>)[language]}
            </button>
          </div>
        )}

        {/* Loaded content */}
        {status === 'loaded' && song && (
          <>
            {/* Translation panel - below hero, sticky */}
            {showTranslation && activeLineIdx >= 0 && (() => {
              const activeLine = song.lines[activeLineIdx];
              const activeTranslation = language === 'ru' ? activeLine?.translation_ru : language === 'en' ? (activeLine?.translation_en || activeLine?.translation) : activeLine?.translation;
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
                    ref={lineIdx === 0 ? firstLineRef : undefined}
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

            {/* Font controls - floating pill on right */}
            <div className={`dr-font-controls${fontActive ? ' dr-font-controls--active' : ''}`}>
              <button className="dr-font-btn" onClick={() => { setFontSize(s => Math.min(s + 10, 150)); flashFont(); }} type="button">A+</button>
              <div className="dr-font-divider" />
              <button className="dr-font-btn" onClick={() => { setFontSize(s => Math.max(s - 10, 80)); flashFont(); }} type="button">A-</button>
            </div>

            {/* Audio controls + toggles */}
            <div className="karaoke__controls">
              {/* Toggle row */}
              <div className="karaoke__toggle-row">
                <button
                  ref={toggleRef}
                  className={`karaoke__toggle ${showTranslation ? 'karaoke__toggle--active' : ''}`}
                  onClick={() => setShowTranslation((v) => !v)}
                  type="button"
                  aria-pressed={showTranslation}
                >
                  {({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}
                </button>
                <button
                  className={`karaoke__toggle ${showPinyin ? 'karaoke__toggle--active' : ''}`}
                  onClick={() => setShowPinyin((v) => !v)}
                  type="button"
                  aria-pressed={showPinyin}
                >
                  Pinyin
                </button>
              </div>

              {/* Progress bar */}
              <div
                className="karaoke__progress"
                ref={progressRef}
                onMouseDown={onScrubDown}
                onTouchStart={onScrubTouchStart}
                onTouchMove={onScrubTouchMove}
                onTouchEnd={onScrubTouchEnd}
              >
                <div className="karaoke__progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <div className="karaoke__time">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
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
                  ref={playBtnRef}
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
          </>
        )}
      </div>
      <CoachMarkTour
        tourId="karaoke-tour"
        lang={language}
        steps={[
          { tipId: 'ktv-line', targetRef: firstLineRef, text: { uz: "Tarjimani ko'rish uchun qatorni bosing", ru: 'Нажмите на строку, чтобы увидеть перевод', en: 'Tap a line to see its translation' } },
          { tipId: 'ktv-play', targetRef: playBtnRef, forceAbove: true, text: { uz: "Qo'shiqni boshlash yoki to'xtatish", ru: 'Воспроизвести или приостановить песню', en: 'Play or pause the song' } },
          { tipId: 'ktv-toggle', targetRef: toggleRef, forceAbove: true, text: { uz: 'Tarjima va pinyinni yoqib-oʻchiring', ru: 'Включайте перевод и пиньинь', en: 'Toggle translation and pinyin' } },
        ] as TourStep[]}
      />
    </>
  );
}
