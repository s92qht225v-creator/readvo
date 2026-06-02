import type { QuestionMedia } from '@/lib/test/types';
import { normalizeQuestionMedia, normalizeQuestionOptionsMedia } from '@/lib/test/media';
import type { BuilderQuestion } from '../builderTypes';

type DesktopMediaLayout = NonNullable<QuestionMedia['layoutDesktop']>;

/* ── Two media slots per question ────────────────────────────────────
   - options.media       = the VISUAL (image OR video)
   - options.audioMedia  = the AUDIO
   Allowed combos: nothing, audio, image, video, OR audio+image.
   Forbidden: audio+video (both have sound), image+video (same spot),
   so a video is always solo. Legacy questions stored audio in
   options.media; the getters migrate that on read, and any write
   migrates it permanently. */

function visualOf(q: BuilderQuestion): QuestionMedia | undefined {
  const m = normalizeQuestionMedia((q.options as { media?: unknown }).media, q.type);
  return m && m.type !== 'audio' ? m : undefined;
}

function audioOf(q: BuilderQuestion): QuestionMedia | undefined {
  const am = normalizeQuestionMedia((q.options as { audioMedia?: unknown }).audioMedia, q.type);
  if (am && am.type === 'audio') return am;
  // Legacy: audio stored in the single media slot.
  const legacy = normalizeQuestionMedia((q.options as { media?: unknown }).media, q.type);
  return legacy && legacy.type === 'audio' ? legacy : undefined;
}

export function getQuestionVisual(q: BuilderQuestion): QuestionMedia | undefined {
  return visualOf(q);
}

export function getQuestionAudio(q: BuilderQuestion): QuestionMedia | undefined {
  return audioOf(q);
}

/* Back-compat alias — returns the VISUAL. Callers that gate layout
   controls / preview on "the media" want the image/video. */
export function getQuestionMedia(q: BuilderQuestion): QuestionMedia | undefined {
  return visualOf(q);
}

function withVisualLayout(media: QuestionMedia): QuestionMedia {
  const layoutMobile = media.layoutMobile === 'wallpaper' || media.layoutMobile === 'split'
    ? 'stack'
    : media.layoutMobile ?? 'stack';
  return { ...media, layoutMobile, layoutDesktop: normalizeDesktopLayout(media.layoutDesktop) };
}

/* Move a legacy audio-in-media into the audio slot so a write never loses it. */
function migrateLegacyAudio(options: Record<string, unknown>): void {
  const m = options.media as QuestionMedia | undefined;
  if (m && m.type === 'audio') {
    if (!options.audioMedia) options.audioMedia = m;
    delete options.media;
  }
}

/* Set the VISUAL slot (image/video). Enforces: a video is solo (clears
   any audio + image-only behaviour flags). */
export function setQuestionVisual(q: BuilderQuestion, media: QuestionMedia | undefined): BuilderQuestion {
  const options = normalizeQuestionOptionsMedia(q.type, q.options as Record<string, unknown>);
  migrateLegacyAudio(options);
  const m = normalizeQuestionMedia(media, q.type);
  if (!m || m.type === 'audio') {
    delete options.media;
    return { ...q, options: options as BuilderQuestion['options'] };
  }
  if (m.type === 'video') {
    // Video can't coexist with audio (both have sound).
    delete options.audioMedia;
    delete (options as Record<string, unknown>).audioMustFinish;
    delete (options as Record<string, unknown>).audioPlayOnce;
  }
  options.media = withVisualLayout(m);
  return { ...q, options: options as BuilderQuestion['options'] };
}

/* Set the AUDIO slot. Enforces: audio can't coexist with a video
   (clears the video from the visual slot if present). */
export function setQuestionAudio(q: BuilderQuestion, media: QuestionMedia | undefined): BuilderQuestion {
  const options = normalizeQuestionOptionsMedia(q.type, q.options as Record<string, unknown>);
  migrateLegacyAudio(options);
  const m = normalizeQuestionMedia(media, q.type);
  if (!m || m.type !== 'audio') {
    delete options.audioMedia;
    delete (options as Record<string, unknown>).audioMustFinish;
    delete (options as Record<string, unknown>).audioPlayOnce;
    return { ...q, options: options as BuilderQuestion['options'] };
  }
  const vis = options.media as QuestionMedia | undefined;
  if (vis && vis.type === 'video') delete options.media;
  options.audioMedia = m;
  return { ...q, options: options as BuilderQuestion['options'] };
}

/* Back-compat: route a single media set by type. Used by the gallery
   modal, which is always opened for one specific kind. */
export function setQuestionMedia(q: BuilderQuestion, media: QuestionMedia | undefined): BuilderQuestion {
  const m = normalizeQuestionMedia(media, q.type);
  if (!m) return q; // ambiguous remove — use removeQuestionMedia(kind)
  return m.type === 'audio' ? setQuestionAudio(q, m) : setQuestionVisual(q, m);
}

/* Kind-aware removal (the visual and audio slots are separate). */
export function removeQuestionMedia(q: BuilderQuestion, kind: 'image' | 'video' | 'audio'): BuilderQuestion {
  return kind === 'audio' ? setQuestionAudio(q, undefined) : setQuestionVisual(q, undefined);
}

export function normalizeDesktopLayout(value: QuestionMedia['layoutDesktop']): DesktopMediaLayout {
  if (value === 'split-right') return 'float-right';
  if (value === 'split-left') return 'float-left';
  if (value === 'wallpaper') return 'float-right';
  if (value === 'stack') return 'float-right';
  return value ?? 'float-right';
}
