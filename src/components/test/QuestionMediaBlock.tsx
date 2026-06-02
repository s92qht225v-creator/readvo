'use client';

import { useEffect, useRef, useState } from 'react';
import type { QuestionMedia } from '@/lib/test/types';
import { claimAudioPlayback, isActiveAudio, releaseAudio } from './audioCoordinator';
import './question-media.css';

interface Props {
  media?: QuestionMedia;
  className?: string;
  style?: React.CSSProperties;
  /** Fired when this block's AUDIO media finishes playing (audio only). */
  onAudioEnded?: () => void;
  /** Attempt to auto-start AUDIO media on mount (audio only). Used for
   *  audio-locked questions so the student isn't stuck on a disabled
   *  Next wondering why — the clip starts itself (browser gesture
   *  permitting; the play control remains if autoplay is blocked). */
  autoPlayAudio?: boolean;
  /** Play-once for AUDIO media: plays straight through once (no pause/
   *  seek/replay), refresh-proof via consumed/onConsumed. */
  audioPlayOnce?: boolean;
  audioConsumed?: boolean;
  onAudioConsumed?: () => void;
}

export function QuestionMediaLayout({ media, audioMedia, header, answer, children, forceDevice, onAudioEnded, autoPlayAudio, audioPlayOnce, audioConsumed, onAudioConsumed }: {
  /** The VISUAL slot — image or video. */
  media?: QuestionMedia;
  /** The AUDIO slot — rendered above the visual (if any). Carries the
   *  audio-lock / play-once props. */
  audioMedia?: QuestionMedia;
  header?: React.ReactNode;
  answer?: React.ReactNode;
  children?: React.ReactNode;
  forceDevice?: 'mobile' | 'desktop';
  /** Fired when the question's AUDIO media finishes playing. */
  onAudioEnded?: () => void;
  /** Auto-start the question's AUDIO media on mount (audio-locked questions). */
  autoPlayAudio?: boolean;
  /** Play-once for the question's AUDIO media (refresh-proof). */
  audioPlayOnce?: boolean;
  audioConsumed?: boolean;
  onAudioConsumed?: () => void;
}) {
  const content = children ?? (
    <>
      <div className="qmedia-header">{header}</div>
      <div className="qmedia-answer">{answer}</div>
    </>
  );
  /* Legacy safety: if a visual slot still holds audio (un-migrated old
     data), treat it as the audio. New data keeps `media` visual-only. */
  const visual = media && media.type !== 'audio' ? media : undefined;
  const audio = audioMedia?.url ? audioMedia : (media && media.type === 'audio' ? media : undefined);

  const renderAudio = (className: string) => audio ? (
    <QuestionMediaBlock
      media={audio}
      className={className}
      onAudioEnded={onAudioEnded}
      autoPlayAudio={autoPlayAudio}
      audioPlayOnce={audioPlayOnce}
      audioConsumed={audioConsumed}
      onAudioConsumed={onAudioConsumed}
    />
  ) : null;

  // Audio + image: image floats as normal; the audio player sits inside the
  // content column right above the answer choices (same spot as audio-only).
  if (visual?.url && audio) {
    return (
      <div className={layoutClassName(visual, forceDevice)}>
        <QuestionMediaBlock media={visual} className="qmedia-asset" />
        <div className="qmedia-content">
          <div className="qmedia-header">{header}</div>
          <div className="qmedia-answer">
            {renderAudio('qmedia-audio-inline')}
            {answer}
          </div>
        </div>
      </div>
    );
  }

  // Audio only — sits above the content (reordered with header/answer).
  if (audio) {
    return (
      <div className="qmedia-layout qmedia-audio qmedia-audio-top">
        {renderAudio('qmedia-asset')}
        <div className="qmedia-content">{content}</div>
      </div>
    );
  }

  // Visual only (image / video).
  if (visual?.url) {
    return (
      <div className={layoutClassName(visual, forceDevice)}>
        <QuestionMediaBlock media={visual} className="qmedia-asset" />
        <div className="qmedia-content">{content}</div>
      </div>
    );
  }

  // No media — flex-column wrapper so header/answer spacing matches.
  return (
    <div className="qmedia-layout qmedia-no-media">
      <div className="qmedia-content">{content}</div>
    </div>
  );
}

export function QuestionMediaBlock({ media, className, style, onAudioEnded, autoPlayAudio, audioPlayOnce, audioConsumed, onAudioConsumed }: Props) {
  if (!media?.url) return null;

  if (media.type === 'audio') {
    return (
      <div className={className} style={{ ...audioFrameWrap, ...style }}>
        <AudioPlayer src={media.url} onEnded={onAudioEnded} autoPlay={autoPlayAudio} playOnce={audioPlayOnce} consumed={audioConsumed} onConsumed={onAudioConsumed} />
      </div>
    );
  }

  if (media.type === 'video') {
    if (media.provider === 'upload') {
      return <UploadedVideo media={media} className={className} style={style} />;
    }
    return <EmbeddedVideo media={media} className={className} style={style} />;
  }

  const aspectRatio = aspectRatioValue(media);
  const transform = [
    `rotate(${media.rotation ?? 0}deg)`,
    `scaleX(${media.flipX ? -1 : 1})`,
    `scaleY(${media.flipY ? -1 : 1})`,
  ].join(' ');

  const circle = media.aspectRatio === 'circle';
  if (media.crop && aspectRatio) {
    return (
      <div className={`${className ?? ''}${circle ? ' qmedia-asset--circle' : ''}`} style={{ ...imageFrameStyle(aspectRatio), ...style }}>
        <img
          src={media.url}
          alt={media.alt || ''}
          style={{ ...croppedImageStyle(media.crop, media.naturalAspectRatio), transform }}
        />
      </div>
    );
  }

  return (
    <FramedImage
      media={media}
      className={`${className ?? ''}${circle ? ' qmedia-asset--circle' : ''}`}
      style={style}
      transform={transform}
      initialAspect={aspectRatio}
    />
  );
}

/* Uncropped image render with runtime aspect detection — mirrors the
   pattern in UploadedVideo. If aspectRatioValue() couldn't determine a
   ratio (old upload with no `naturalAspectRatio`, no aspectRatio set),
   we'd otherwise default the wrapper to 16/9 and distort square /
   portrait images into landscape. Instead, sniff naturalWidth /
   naturalHeight on the img's onLoad and use that. A square (1/1)
   placeholder is used before load so the wrapper has *some* height
   to render — far less wrong than 16/9 for typical content. */
function FramedImage({ media, className, style, transform, initialAspect }: {
  media: QuestionMedia;
  className?: string;
  style?: React.CSSProperties;
  transform: string;
  initialAspect: string | null;
}) {
  const [runtimeAspect, setRuntimeAspect] = useState<string | null>(null);
  const aspect = initialAspect ?? runtimeAspect ?? '1 / 1';
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (initialAspect || runtimeAspect) return;
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setRuntimeAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
    }
  };
  return (
    <div className={className} style={{ ...imageFrameStyle(aspect), ...style }}>
      <img
        src={media.url}
        alt={media.alt || ''}
        onLoad={onLoad}
        style={{ ...framedImageStyle, transform }}
      />
    </div>
  );
}

function AudioPlayer({ src, onEnded, autoPlay, playOnce, consumed, onConsumed }: {
  src: string;
  onEnded?: () => void;
  autoPlay?: boolean;
  /* Play-once: plays straight through once — no pause, seek, or replay —
     and (via consumed/onConsumed) re-locks after a refresh. Mirrors the
     listening-track ListeningAudioBar play-once behaviour. */
  playOnce?: boolean;
  /* Whether THIS question's audio was already consumed by the respondent
     (e.g. before a refresh). Snapshotted at mount to decide the locked state. */
  consumed?: boolean;
  /* Mark the track consumed (first play) so a refresh re-locks it. */
  onConsumed?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onConsumedRef = useRef(onConsumed);
  onConsumedRef.current = onConsumed;

  /* Play-once bookkeeping (mirrors ListeningAudioBar). Snapshot `consumed`
     at mount: a track already heard mounts locked. `started` hides the play
     button once playback begins; `poEnded` locks it when the clip finishes. */
  const [lockedOnMount] = useState(!!playOnce && !!consumed);
  const [started, setStarted] = useState(false);
  const [poEnded, setPoEnded] = useState(false);
  const maxTimeRef = useRef(0);
  const endedRef = useRef(false);
  const consumedFiredRef = useRef(false);

  /* Auto-start on mount ONLY when explicitly asked (autoPlay — card-mode
     audio-locked questions, where exactly one card is visible). Play-once
     does NOT auto-attempt on its own: in scroll mode every question is on
     one page, so mass-autoplay would overlap — play-once shows a one-time
     Play button instead. Locked-on-mount play-once never loads/plays. */
  useEffect(() => {
    if (lockedOnMount || !autoPlay) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => { /* autoplay blocked — manual control remains */ });
  }, [autoPlay, lockedOnMount, src]);

  /* A play-once track that mounts locked has effectively been heard — fire
     onEnded once so any audio-lock gate on the same question doesn't trap a
     respondent who already listened before a refresh. */
  useEffect(() => {
    if (lockedOnMount) onEndedRef.current?.();
  }, [lockedOnMount]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    setCurrentTime(0);
    setIsPlaying(false);

    const fireConsumed = () => {
      if (!consumedFiredRef.current) { consumedFiredRef.current = true; onConsumedRef.current?.(); }
    };
    const handleMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const handleTime = () => {
      if (playOnce) {
        /* Block forward skips; track furthest point reached. */
        if (audio.currentTime > maxTimeRef.current + 0.4) { audio.currentTime = maxTimeRef.current; return; }
        maxTimeRef.current = Math.max(maxTimeRef.current, audio.currentTime);
      }
      setCurrentTime(audio.currentTime);
    };
    const handlePlay = () => { claimAudioPlayback(audio); setIsPlaying(true); if (playOnce) { setStarted(true); fireConsumed(); } };
    const handlePause = () => {
      setIsPlaying(false);
      /* Play-once: no pausing — silently resume unless the clip ended
         (guards against OS media keys / system pauses). But DON'T fight the
         coordinator: if another audio is now active, this was paused on
         purpose to keep "one at a time", so leave it paused. */
      if (playOnce && !endedRef.current && isActiveAudio(audio) && audio.duration && audio.currentTime < audio.duration - 0.3) {
        audio.play().catch(() => {});
      }
    };
    const handleEnded = () => {
      endedRef.current = true;
      setIsPlaying(false);
      setCurrentTime(audio.duration || 0);
      if (playOnce) setPoEnded(true);
      onEndedRef.current?.();
    };
    /* Play-once: block ALL user seeks (forward AND rewind). Natural
       playback never fires 'seeking', so any seek is a user jump — snap
       back to the furthest point reached. */
    const handleSeeking = () => {
      if (!playOnce) return;
      if (Math.abs(audio.currentTime - maxTimeRef.current) > 0.4) audio.currentTime = maxTimeRef.current;
    };

    audio.addEventListener('loadedmetadata', handleMetadata);
    audio.addEventListener('durationchange', handleMetadata);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeking', handleSeeking);

    return () => {
      audio.removeEventListener('loadedmetadata', handleMetadata);
      audio.removeEventListener('durationchange', handleMetadata);
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeking', handleSeeking);
      releaseAudio(audio);
    };
  }, [src, playOnce]);

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch (error) {
        console.error('Unable to play audio', error);
      }
      return;
    }
    audio.pause();
  };

  const seek = (value: string) => {
    const nextTime = Number(value);
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(nextTime)) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  /* Play-once, already heard before a refresh: locked, no audio element. */
  if (playOnce && lockedOnMount) {
    return (
      <div className="qmedia-audio-player qmedia-audio-player--once">
        <span className="qmedia-audio-once-note">Audio already played</span>
      </div>
    );
  }

  /* Play-once, active: status-only — a one-time Play button before
     playback (browsers block silent autoplay), then a non-interactive
     progress bar. No pause, no scrub, no replay; locks on end. */
  if (playOnce) {
    return (
      <div className="qmedia-audio-player qmedia-audio-player--once">
        <audio ref={audioRef} preload="metadata" src={src} />
        {!started ? (
          <button type="button" className="qmedia-audio-icon-button" onClick={togglePlay} aria-label="Play audio">
            <PlayIcon />
          </button>
        ) : null}
        <div className="qmedia-audio-progress" style={{ '--qmedia-audio-progress': `${progress}%` } as React.CSSProperties}>
          <div className="qmedia-audio-progress-track" aria-hidden="true">
            <span />
          </div>
        </div>
        <span className="qmedia-audio-time">{poEnded ? 'Finished' : `${formatTime(currentTime)} / ${formatTime(duration)}`}</span>
      </div>
    );
  }

  return (
    <div className="qmedia-audio-player">
      <audio ref={audioRef} preload="metadata" src={src} />
      <button type="button" className="qmedia-audio-icon-button" onClick={togglePlay} aria-label={isPlaying ? 'Pause audio' : 'Play audio'}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="qmedia-audio-progress" style={{ '--qmedia-audio-progress': `${progress}%` } as React.CSSProperties}>
        <div className="qmedia-audio-progress-track" aria-hidden="true">
          <span />
        </div>
        <input
          className="qmedia-audio-progress-input"
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={duration ? currentTime : 0}
          onChange={event => seek(event.target.value)}
          aria-label="Audio progress"
        />
      </div>
      <span className="qmedia-audio-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
    </div>
  );
}

function formatTime(value: number) {
  const safeValue = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M4 2.9c0-.8.9-1.3 1.6-.9l7.1 4.4c.6.4.6 1.3 0 1.7l-7.1 4.4c-.7.4-1.6-.1-1.6-.9z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M4 3.2c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v9.6c0 .4-.3.7-.7.7H4.7a.7.7 0 0 1-.7-.7zm5 0c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v9.6c0 .4-.3.7-.7.7H9.7a.7.7 0 0 1-.7-.7z" />
    </svg>
  );
}

function layoutClassName(media: QuestionMedia, forceDevice?: 'mobile' | 'desktop') {
  const mobile = media.layoutMobile === 'wallpaper' || media.layoutMobile === 'split'
    ? 'stack'
    : media.layoutMobile ?? 'stack';
  const desktop = normalizeDesktopLayout(media.layoutDesktop);
  if (forceDevice === 'mobile') {
    return `qmedia-layout qmedia-mobile-${mobile} qmedia-force-mobile`;
  }
  if (forceDevice === 'desktop') {
    return `qmedia-layout qmedia-desktop-${desktop} qmedia-force-desktop`;
  }
  return `qmedia-layout qmedia-mobile-${mobile} qmedia-desktop-${desktop}${forceDevice ? ` qmedia-force-${forceDevice}` : ''}`;
}

function normalizeDesktopLayout(value: QuestionMedia['layoutDesktop']) {
  if (value === 'split-right') return 'float-right';
  if (value === 'split-left') return 'float-left';
  if (value === 'wallpaper') return 'float-right';
  if (value === 'stack') return 'float-right';
  return value ?? 'float-right';
}


function aspectRatioValue(media: QuestionMedia) {
  if (media.aspectRatio === 'circle' || media.aspectRatio === 'square' || media.aspectRatio === '1:1') return '1 / 1';
  if (media.aspectRatio === 'landscape' || media.aspectRatio === '16:9') return '16 / 9';
  if (media.aspectRatio === 'portrait' || media.aspectRatio === '3:4') return '3 / 4';
  if (media.aspectRatio === '4:3') return '4 / 3';
  if (media.aspectRatio === 'free' && media.crop) {
    return `${media.crop.width} / ${media.crop.height}`;
  }
  if ((media.aspectRatio === 'original' || !media.aspectRatio) && media.naturalAspectRatio && Number.isFinite(media.naturalAspectRatio)) {
    return `${media.naturalAspectRatio} / 1`;
  }
  return null;
}

function UploadedVideo({ media, className, style }: { media: QuestionMedia; className?: string; style?: React.CSSProperties }) {
  // Runtime aspect detection: even if media.naturalAspectRatio is
  // missing (older uploads), the loadedmetadata event gives us the
  // real dimensions so the wrapper matches and the <video>'s default
  // object-fit doesn't letterbox.
  const initialAspect = videoAspectRatio(media);
  const [runtimeAspect, setRuntimeAspect] = useState<number | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      if (v.videoWidth && v.videoHeight) {
        setRuntimeAspect(v.videoWidth / v.videoHeight);
      }
    };
    v.addEventListener('loadedmetadata', onLoaded);
    if (v.readyState >= 1) onLoaded();
    return () => v.removeEventListener('loadedmetadata', onLoaded);
  }, [media.url]);
  const aspect = runtimeAspect ?? initialAspect;
  const portrait = aspect ? aspect < 1 : false;
  return (
    <div
      className={`${className ?? ''} qmedia-asset--video${portrait ? ' qmedia-asset--portrait' : ''}`}
      style={{ ...videoFrameWrap, aspectRatio: aspect ? `${aspect}` : '16 / 9', ...style }}
    >
      <video
        ref={videoRef}
        className="qmedia-asset__media"
        src={media.url}
        controls
        playsInline
        preload="metadata"
        aria-label={media.alt || 'Question video'}
      />
    </div>
  );
}

function EmbeddedVideo({ media, className, style }: { media: QuestionMedia; className?: string; style?: React.CSSProperties }) {
  const aspect = videoAspectRatio(media);
  const portrait = aspect ? aspect < 1 : false;
  const embedUrl = toEmbedUrl(media.url ?? '');
  if (!embedUrl) {
    return (
      <a href={media.url} target="_blank" rel="noreferrer" style={mediaLink}>
        Open video
      </a>
    );
  }
  return (
    <div
      className={`${className ?? ''} qmedia-asset--video${portrait ? ' qmedia-asset--portrait' : ''}`}
      style={{ ...videoFrameWrap, aspectRatio: aspect ? `${aspect}` : '16 / 9', ...style }}
    >
      <iframe
        className="qmedia-asset__media"
        src={embedUrl}
        title={media.alt || 'Question video'}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function videoAspectRatio(media: QuestionMedia): number | undefined {
  // Upload path: video file was measured at upload time
  // (getFileVideoAspectRatio) and stored on media.naturalAspectRatio.
  if (Number.isFinite(media.naturalAspectRatio) && (media.naturalAspectRatio as number) > 0) {
    return media.naturalAspectRatio as number;
  }
  // YouTube Shorts are always 9:16. Detect from URL so authors don't
  // need to mark them manually.
  try {
    const u = new URL(media.url ?? '');
    if (u.pathname.includes('/shorts/')) return 9 / 16;
  } catch { /* not a URL */ }
  return undefined;
}

function toEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
        ?? (u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : null)
        ?? (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : null);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function imageFrameStyle(aspectRatio: string): React.CSSProperties {
  // Width, max-width, border-radius, and background are owned by CSS
  // (.qmedia-layout > .qmedia-asset rules driven by --qm-* device
  // tokens, plus .qmedia-asset--circle modifier for circular masks).
  // Inline-style props would fight the cascade across surfaces.
  return {
    position: 'relative',
    aspectRatio,
    overflow: 'hidden',
  };
}

const framedImageStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform 160ms ease',
};

function croppedImageStyle(crop: NonNullable<QuestionMedia['crop']>, naturalAspectRatio: number | undefined): React.CSSProperties {
  const imageRatio = naturalAspectRatio && Number.isFinite(naturalAspectRatio) && naturalAspectRatio > 0
    ? naturalAspectRatio
    : crop.width / crop.height;
  const cropRatio = crop.width / crop.height;
  const widthPercent = (100 / crop.width) * 100;
  const heightPercent = widthPercent * (cropRatio / imageRatio);

  return {
    position: 'absolute',
    left: `${-(crop.x / crop.width) * 100}%`,
    top: `${-(crop.y / 100) * heightPercent}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    objectFit: 'cover',
    transformOrigin: 'center',
    transition: 'transform 160ms ease',
  };
}

// Width / border-radius / background are owned by CSS (.qmedia-layout
// > .qmedia-asset rules driven by --qm-asset-* device tokens and the
// .qmedia-asset--portrait modifier). Inline width: '100%' here was
// silently beating .qmedia-asset--portrait { width: auto }, leaving
// the wrapper too wide and producing left/right black bars around
// portrait videos. The per-instance aspectRatio is added in the
// component below, not here.
const videoFrameWrap: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
};

const mediaLink: React.CSSProperties = {
  display: 'block',
  marginBottom: 22,
  color: '#0445af',
  fontWeight: 800,
};

const audioFrameWrap: React.CSSProperties = {
  // Audio always fills its column (answer column for audio+image, the
  // audio-top row for audio-only) so it lines up with the choices. No
  // max-width cap — the column owns the width.
  width: '100%',
  padding: 0,
  borderRadius: 0,
  background: 'transparent',
  boxSizing: 'border-box',
};
