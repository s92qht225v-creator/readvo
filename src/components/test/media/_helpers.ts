import type { QuestionMedia } from '@/lib/test/types';
import { normalizeQuestionMedia, normalizeQuestionOptionsMedia } from '@/lib/test/media';
import type { BuilderQuestion } from '../builderTypes';

type DesktopMediaLayout = NonNullable<QuestionMedia['layoutDesktop']>;

export function getQuestionMedia(q: BuilderQuestion): QuestionMedia | undefined {
  const media = (q.options as { media?: unknown }).media as QuestionMedia | undefined;
  return normalizeQuestionMedia(media, q.type);
}

export function setQuestionMedia(q: BuilderQuestion, media: QuestionMedia | undefined): BuilderQuestion {
  const options = normalizeQuestionOptionsMedia(q.type, q.options as Record<string, unknown>);
  const normalizedMedia = normalizeQuestionMedia(media, q.type);
  if (normalizedMedia) {
    if (normalizedMedia.type === 'audio') {
      options.media = normalizedMedia;
      return { ...q, options: options as BuilderQuestion['options'] };
    }
    const layoutMobile = normalizedMedia.layoutMobile === 'wallpaper'
      ? 'stack'
      : normalizedMedia.layoutMobile ?? 'stack';
    options.media = {
      ...normalizedMedia,
      layoutMobile,
      layoutDesktop: normalizeDesktopLayout(normalizedMedia.layoutDesktop),
    };
  } else {
    delete options.media;
  }
  return { ...q, options: options as BuilderQuestion['options'] };
}

export function normalizeDesktopLayout(value: QuestionMedia['layoutDesktop']): DesktopMediaLayout {
  if (value === 'split-right') return 'float-right';
  if (value === 'split-left') return 'float-left';
  if (value === 'wallpaper') return 'float-right';
  if (value === 'stack') return 'float-right';
  return value ?? 'float-right';
}
