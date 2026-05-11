import type { QuestionMedia } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';

type DesktopMediaLayout = NonNullable<QuestionMedia['layoutDesktop']>;

export function getQuestionMedia(q: BuilderQuestion): QuestionMedia | undefined {
  const media = (q.options as { media?: unknown }).media as QuestionMedia | undefined;
  return media?.url ? media : undefined;
}

export function setQuestionMedia(q: BuilderQuestion, media: QuestionMedia | undefined): BuilderQuestion {
  const options = { ...(q.options as Record<string, unknown>) };
  if (media?.url?.trim()) {
    const layoutMobile = media.layoutMobile === 'wallpaper'
      ? 'stack'
      : media.type === 'audio' && media.layoutMobile === 'split'
      ? 'stack'
      : media.layoutMobile ?? 'stack';
    options.media = {
      ...media,
      url: media.url.trim(),
      layoutMobile,
      layoutDesktop: normalizeDesktopLayout(media.layoutDesktop),
    };
  } else {
    delete options.media;
  }
  return { ...q, options: options as BuilderQuestion['options'] };
}

export function normalizeDesktopLayout(value: QuestionMedia['layoutDesktop']): DesktopMediaLayout {
  if (value === 'wallpaper') return 'split-left';
  if (value === 'stack') return 'float-right';
  return value ?? 'float-right';
}
