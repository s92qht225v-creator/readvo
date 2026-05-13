import type { QuestionMedia, QuestionType } from './types';

const MEDIA_TYPES = new Set<QuestionMedia['type']>(['image', 'gif', 'video', 'audio']);

/**
 * Question media is intentionally a single slot. Normalizing at the API/data
 * boundary prevents old or malformed payloads from behaving like parallel
 * image/audio/video attachments.
 */
export function normalizeQuestionMedia(
  media: unknown,
  questionType?: QuestionType,
): QuestionMedia | undefined {
  if (!media || typeof media !== 'object' || Array.isArray(media)) return undefined;

  const input = media as Partial<QuestionMedia>;
  if (!input.type || !MEDIA_TYPES.has(input.type)) return undefined;
  if (typeof input.url !== 'string' || !input.url.trim()) return undefined;

  // Picture choice owns images per answer choice; question-level media is audio-only.
  if (questionType === 'picture_choice' && input.type !== 'audio') return undefined;

  if (input.type === 'audio') {
    return {
      type: 'audio',
      url: input.url.trim(),
      alt: typeof input.alt === 'string' ? input.alt : undefined,
      provider: input.provider,
    };
  }

  return {
    ...input,
    type: input.type,
    url: input.url.trim(),
    alt: typeof input.alt === 'string' ? input.alt : undefined,
  } as QuestionMedia;
}

export function normalizeQuestionOptionsMedia<T extends Record<string, unknown>>(
  questionType: QuestionType,
  options: T | undefined,
): T {
  const next = { ...(options ?? {}) } as T & { media?: QuestionMedia };
  const media = normalizeQuestionMedia(next.media, questionType);
  if (media) {
    next.media = media;
  } else {
    delete next.media;
  }
  return next as T;
}
