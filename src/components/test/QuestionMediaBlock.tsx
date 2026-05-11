'use client';

import type { QuestionMedia } from '@/lib/test/types';
import './question-media.css';

interface Props {
  media?: QuestionMedia;
  className?: string;
  style?: React.CSSProperties;
}

export function QuestionMediaLayout({ media, header, answer, children, forceDevice }: {
  media?: QuestionMedia;
  header?: React.ReactNode;
  answer?: React.ReactNode;
  children?: React.ReactNode;
  forceDevice?: 'mobile' | 'desktop';
}) {
  const content = children ?? (
    <>
      <div className="qmedia-header">{header}</div>
      <div className="qmedia-answer">{answer}</div>
    </>
  );
  if (!media?.url) return <>{content}</>;
  return (
    <div className={layoutClassName(media, forceDevice)}>
      <QuestionMediaBlock media={media} className="qmedia-asset" />
      <div className="qmedia-content">{content}</div>
    </div>
  );
}

export function QuestionMediaBlock({ media, className, style }: Props) {
  if (!media?.url) return null;

  if (media.type === 'audio') {
    return (
      <div className={className} style={{ ...audioFrameWrap, ...style }}>
        <audio controls preload="metadata" src={media.url} style={audioControl}>
          <a href={media.url}>Open audio</a>
        </audio>
      </div>
    );
  }

  if (media.type === 'video') {
    const embedUrl = toEmbedUrl(media.url);
    if (!embedUrl) {
      return (
        <a href={media.url} target="_blank" rel="noreferrer" style={mediaLink}>
          Open video
        </a>
      );
    }
    return (
      <div className={className} style={{ ...videoFrameWrap, ...style }}>
        <iframe
          src={embedUrl}
          title={media.alt || 'Question video'}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={videoFrame}
        />
      </div>
    );
  }

  const aspectRatio = aspectRatioValue(media);
  const transform = [
    `rotate(${media.rotation ?? 0}deg)`,
    `scaleX(${media.flipX ? -1 : 1})`,
    `scaleY(${media.flipY ? -1 : 1})`,
  ].join(' ');

  if (media.crop && aspectRatio) {
    return (
      <div className={className} style={{ ...imageFrameStyle(aspectRatio, media.aspectRatio === 'circle' ? '50%' : 7), ...style }}>
        <img
          src={media.url}
          alt={media.alt || ''}
          style={{ ...croppedImageStyle(media.crop, media.naturalAspectRatio), transform }}
        />
      </div>
    );
  }

  return (
    <div className={className} style={{ ...imageFrameStyle(aspectRatio ?? '16 / 9', 7), ...style }}>
      <img
        src={media.url}
        alt={media.alt || ''}
        style={{ ...framedImageStyle, transform }}
      />
    </div>
  );
}

function layoutClassName(media: QuestionMedia, forceDevice?: 'mobile' | 'desktop') {
  const kind = media.type === 'audio' ? ' qmedia-audio' : '';
  const mobile = media.type === 'audio' && media.layoutMobile === 'wallpaper'
    ? 'stack'
    : media.layoutMobile ?? 'stack';
  const desktop = normalizeDesktopLayout(media.layoutDesktop);
  if (forceDevice === 'mobile') {
    return `qmedia-layout${kind} qmedia-mobile-${mobile} qmedia-force-mobile`;
  }
  if (forceDevice === 'desktop') {
    return `qmedia-layout${kind} qmedia-desktop-${desktop} qmedia-force-desktop`;
  }
  return `qmedia-layout${kind} qmedia-mobile-${mobile} qmedia-desktop-${desktop}${forceDevice ? ` qmedia-force-${forceDevice}` : ''}`;
}

function normalizeDesktopLayout(value: QuestionMedia['layoutDesktop']) {
  if (value === 'wallpaper') return 'split-left';
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

function aspectRatioNumber(value: string) {
  const [left, right] = value.split('/').map(part => Number(part.trim()));
  if (!left || !right || !Number.isFinite(left) || !Number.isFinite(right)) return 16 / 9;
  return left / right;
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

function imageFrameStyle(aspectRatio: string, borderRadius: React.CSSProperties['borderRadius']): React.CSSProperties {
  const ratio = aspectRatioNumber(aspectRatio);
  return {
    position: 'relative',
    width: '100%',
    maxWidth: `min(100%, ${Math.round(360 * ratio)}px)`,
    aspectRatio,
    overflow: 'hidden',
    borderRadius,
    margin: '0 auto 22px',
    background: 'transparent',
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

const videoFrameWrap: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: 7,
  overflow: 'hidden',
  background: '#111827',
  marginBottom: 22,
};

const videoFrame: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 0,
};

const mediaLink: React.CSSProperties = {
  display: 'block',
  marginBottom: 22,
  color: '#0445af',
  fontWeight: 800,
};

const audioFrameWrap: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  margin: '0 auto 12px',
  padding: 0,
  borderRadius: 0,
  background: 'transparent',
  boxSizing: 'border-box',
};

const audioControl: React.CSSProperties = {
  display: 'block',
  width: '100%',
};
