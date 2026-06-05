import type {
  TestQuestion, PublicQuestion, AnswerSubmission,
  MultipleChoiceOptions, ShortTextOptions, PictureChoiceOptions, TrueFalseOptions,
  MatchOptions, OrderingOptions, FillBlanksOptions, ScrambleOptions,
  LongAnswerOptions, NumberOptions, DropdownOptions, CheckboxOptions,
  OpinionScaleOptions, RatingOptions, SpeakingOptions,
} from './types';
import { normalizeQuestionMedia } from './media';

/** True when the question is flagged as a worked example. */
export function isExampleQuestion(q: { options?: unknown }): boolean {
  return (q.options as { isExample?: unknown } | null)?.isExample === true;
}

/**
 * The correct answer of an example question, expressed in the player's
 * submission-value shape so the renderer shows it pre-selected. Returns
 * undefined for types we can't pre-fill (the example still locks + shows the
 * badge, just without a pre-selected answer). Choice ids use the same
 * deterministic publicOptionId as the sanitized options, so they line up
 * regardless of shuffle order.
 */
export function exampleAnswerValue(q: TestQuestion): AnswerSubmission['value'] | undefined {
  const cid = (i: number) => publicOptionId(q.id, 'choice', i);
  if (q.type === 'true_false') {
    const o = q.options as TrueFalseOptions;
    return typeof o.correct === 'boolean' ? { bool: o.correct } : undefined;
  }
  if (q.type === 'multiple_choice' || q.type === 'picture_choice' || q.type === 'image_letters') {
    const o = q.options as MultipleChoiceOptions | PictureChoiceOptions;
    if (o.allowMultiple) {
      const idx = o.correctIndexes ?? (o.correctIndex != null ? [o.correctIndex] : []);
      return idx.length ? { selectedIds: idx.map(cid) } : undefined;
    }
    return o.correctIndex != null ? { selectedId: cid(o.correctIndex) } : undefined;
  }
  if (q.type === 'image_options') {
    // Matching example value: each image i paired with its own description
    // (choice i). cid(i) = publicOptionId(q.id,'choice',i).
    const choices = (q.options as PictureChoiceOptions).choices ?? [];
    return choices.length
      ? { pairs: choices.map((_, i) => ({ leftIndex: i, rightId: cid(i) })) }
      : undefined;
  }
  if (q.type === 'checkbox') {
    const o = q.options as CheckboxOptions;
    const idx = o.correctIndexes ?? [];
    return idx.length ? { selectedIds: idx.map(cid) } : undefined;
  }
  if (q.type === 'dropdown') {
    const o = q.options as DropdownOptions;
    return o.correctIndex != null ? { selectedId: cid(o.correctIndex) } : undefined;
  }
  if (q.type === 'short_text') {
    const o = q.options as ShortTextOptions;
    return o.correctAnswers?.length ? { text: o.correctAnswers[0] } : undefined;
  }
  if (q.type === 'number') {
    const o = q.options as NumberOptions;
    return o.correctValue != null ? { text: String(o.correctValue) } : undefined;
  }
  if (q.type === 'match') {
    const o = q.options as MatchOptions;
    const pairs = o.pairs ?? [];
    return pairs.length
      ? { pairs: pairs.map((_, i) => ({ leftIndex: i, rightId: publicOptionId(q.id, 'match-right', i) })) }
      : undefined;
  }
  if (q.type === 'ordering') {
    const o = q.options as OrderingOptions;
    const items = o.items ?? [];
    return items.length ? { order: items.map((_, i) => publicOptionId(q.id, 'ordering', i)) } : undefined;
  }
  if (q.type === 'fill_blanks') {
    const o = q.options as FillBlanksOptions;
    const blanks = o.blanks ?? [];
    return blanks.length ? { blanks: blanks.map(b => b?.answer ?? '') } : undefined;
  }
  if (q.type === 'scramble') {
    const o = q.options as ScrambleOptions;
    const pieces = splitScrambleAnswer(o.correctAnswer ?? '', o.unit === 'words' ? 'words' : 'letters');
    return pieces.length ? { tileIds: pieces.map((_, i) => publicOptionId(q.id, 'scramble', i)) } : undefined;
  }
  // long_answer (no answer key), opinion_scale, rating, speaking → no pre-fill;
  // the example still shows the badge + locks + is excluded from the score.
  return undefined;
}

export function publicOptionId(questionId: string, kind: 'choice' | 'match-right' | 'ordering' | 'scramble', index: number): string {
  return `opt_${stableHash(`${kind}:${questionId}:${index}`)}`;
}

/** Split a scramble target string into ordered tiles based on the chosen unit. */
export function splitScrambleAnswer(correctAnswer: string, unit: 'letters' | 'words'): string[] {
  const trimmed = (correctAnswer ?? '').trim();
  if (!trimmed) return [];
  if (unit === 'words') return trimmed.split(/\s+/);
  // letters: keep visible characters, skip whitespace
  return Array.from(trimmed).filter(ch => !/\s/.test(ch));
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function stableShuffle<T>(items: T[], seed: string): T[] {
  const arr = items.slice();
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function questionDescription(options: unknown): string | undefined {
  const description = (options as { description?: unknown } | null)?.description;
  return typeof description === 'string' && description.trim() ? description : undefined;
}

function questionInstruction(options: unknown): string | undefined {
  const instruction = (options as { instruction?: unknown } | null)?.instruction;
  return typeof instruction === 'string' && instruction.trim() ? instruction : undefined;
}

/* The VISUAL slot — image or video only (options.media). */
function visualMedia(q: TestQuestion): PublicQuestion['media'] {
  const media = normalizeQuestionMedia((q.options as { media?: unknown } | null)?.media, q.type);
  if (!media || media.type === 'audio') return undefined;
  return normalizeVisualMedia(media);
}

/* The AUDIO slot (options.audioMedia), with legacy fallback to audio that
   was stored in the single options.media slot before the split. */
function audioMediaOf(q: TestQuestion): PublicQuestion['media'] {
  const am = normalizeQuestionMedia((q.options as { audioMedia?: unknown } | null)?.audioMedia, q.type);
  if (am && am.type === 'audio') return am;
  const legacy = normalizeQuestionMedia((q.options as { media?: unknown } | null)?.media, q.type);
  return legacy && legacy.type === 'audio' ? legacy : undefined;
}

function normalizeVisualMedia(media: NonNullable<PublicQuestion['media']>): PublicQuestion['media'] {
  const layoutDesktop = media.layoutDesktop === 'split-right'
    ? 'float-right'
    : media.layoutDesktop === 'split-left'
    ? 'float-left'
    : media.layoutDesktop === 'wallpaper' || media.layoutDesktop === 'stack'
    ? 'float-right'
    : media.layoutDesktop;
  return {
    type: media.type,
    url: media.url,
    alt: typeof media.alt === 'string' ? media.alt : undefined,
    provider: media.provider,
    layoutMobile: media.layoutMobile === 'wallpaper' || media.layoutMobile === 'split' ? 'stack' : media.layoutMobile,
    layoutDesktop,
    aspectRatio: media.aspectRatio,
    naturalAspectRatio: media.naturalAspectRatio,
    crop: media.crop,
    rotation: media.rotation,
    flipX: !!media.flipX,
    flipY: !!media.flipY,
  };
}

/**
 * Strip answer keys (correctIndex / correctAnswers) from a question before
 * sending it to the public player. Always use an explicit per-type allowlist
 * — never spread q.options.
 *
 * `seed` (optional): per-respondent seed for choice/tile shuffling. When
 * provided, randomized questions shuffle differently for each session
 * (true randomization per test-taker, stable across reloads of the same
 * session). When omitted, falls back to the legacy stable-per-question
 * seed so existing callers still work.
 */
export function sanitizeQuestion(q: TestQuestion, seed?: string): PublicQuestion {
  let pub = sanitizeQuestionBase(q, seed);
  if ((q.options as { audioMustFinish?: unknown } | null)?.audioMustFinish === true) {
    pub = { ...pub, audioMustFinish: true };
  }
  if ((q.options as { audioPlayOnce?: unknown } | null)?.audioPlayOnce === true) {
    pub = { ...pub, audioPlayOnce: true };
  }
  if ((q.options as { hidePrompt?: unknown } | null)?.hidePrompt === true) {
    // Author opted to use the question text only as an internal label
    // (shown in the builder's question list), not shown to respondents.
    // Blanking it here means the player — which already renders no title
    // for an empty prompt — hides it on every device/layout.
    pub = { ...pub, prompt: '' };
  }
  if (isExampleQuestion(q)) {
    // Worked example: intentionally reveal its own answer so the player can show
    // it pre-selected. The answer key for every OTHER question stays stripped.
    pub = { ...pub, isExample: true, exampleValue: exampleAnswerValue(q) };
  }
  return pub;
}

function sanitizeQuestionBase(q: TestQuestion, seed?: string): PublicQuestion {
  const choiceSeed = seed ? `${q.id}:choices:${seed}` : `${q.id}:choices`;
  const matchSeed = seed ? `${q.id}:match:${seed}` : `${q.id}:match`;
  const orderingSeed = seed ? `${q.id}:ordering:${seed}` : `${q.id}:ordering`;
  const scrambleSeed = seed ? `${q.id}:scramble:${seed}` : `${q.id}:scramble`;
  if (q.type === 'multiple_choice') {
    const opts = q.options as MultipleChoiceOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'multiple_choice',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, choiceSeed) : choices,
        allowMultiple: !!opts.allowMultiple,
      },
    };
  }
  if (q.type === 'short_text') {
    const opts = q.options as ShortTextOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'short_text',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        minLength: opts.minLength,
        maxLength: opts.maxCharactersEnabled ? opts.maxLength : undefined,
      },
    };
  }
  if (q.type === 'long_answer') {
    const opts = q.options as LongAnswerOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'long_answer',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        minLength: opts.minLength,
        maxLength: opts.maxCharactersEnabled ? opts.maxLength : undefined,
      },
    };
  }
  if (q.type === 'number') {
    const opts = q.options as NumberOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'number',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        min: opts.min,
        max: opts.max,
      },
    };
  }
  if (q.type === 'dropdown') {
    const opts = q.options as DropdownOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'dropdown',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, choiceSeed) : choices,
      },
    };
  }
  if (q.type === 'checkbox') {
    const opts = q.options as CheckboxOptions;
    const choices = (opts.choices ?? []).map((text, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'checkbox',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, choiceSeed) : choices,
      },
    };
  }
  if (q.type === 'opinion_scale') {
    const opts = q.options as OpinionScaleOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'opinion_scale',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        /* 10 is the highest allowed point — cap defensively so any
           legacy/over-limit data still renders 0..10. */
        min: Number.isFinite(opts.min) ? Math.max(0, Math.min(9, opts.min)) : 0,
        max: Number.isFinite(opts.max) ? Math.max(1, Math.min(10, opts.max)) : 10,
        minLabel: opts.minLabel,
        maxLabel: opts.maxLabel,
      },
    };
  }
  if (q.type === 'rating') {
    const opts = q.options as RatingOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'rating',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        max: Number.isFinite(opts.max) ? opts.max : 5,
        shape: opts.shape ?? 'star',
      },
    };
  }
  if (q.type === 'picture_choice' || q.type === 'image_letters') {
    const opts = q.options as PictureChoiceOptions;
    const choices = (opts.choices ?? []).map((c, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text: c.text,
      image_url: c.image_url,
    }));
    return {
      id: q.id,
      position: q.position,
      type: q.type,
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, choiceSeed) : choices,
        allowMultiple: !!opts.allowMultiple,
        columns: opts.columns,
        imagesAsAnswers: q.type === 'image_letters' ? !!opts.imagesAsAnswers : undefined,
      },
    };
  }
  if (q.type === 'image_options') {
    // Matching: each choice carries an image + its description. The images
    // render in upload order (labeled A–F); the descriptions render in
    // `answerOrder` (shuffled per respondent) so they don't line up with the
    // images. Correct pairing is image i ↔ choice i — graded by choice id.
    const opts = q.options as PictureChoiceOptions;
    const choices = (opts.choices ?? []).map((c, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text: c.text,
      image_url: c.image_url,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'image_options',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        choices,
        columns: opts.columns,
        answerOrder: stableShuffle(choices.map(c => c.id), `${q.id}:answers:${seed ?? ''}`),
      },
    };
  }
  if (q.type === 'true_false') {
    return {
      id: q.id,
      position: q.position,
      type: 'true_false',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {},
    };
  }
  if (q.type === 'match') {
    const opts = q.options as MatchOptions;
    const pairs = opts.pairs ?? [];
    return {
      id: q.id,
      position: q.position,
      type: 'match',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        left: pairs.map((p, i) => ({
          id: `left-${i}`,
          text: p.left,
        })),
        right: stableShuffle(
          pairs.map((p, i) => ({
            id: publicOptionId(q.id, 'match-right', i),
            text: p.right,
          })),
          matchSeed,
        ),
      },
    };
  }
  if (q.type === 'ordering') {
    const opts = q.options as OrderingOptions;
    const items = opts.items ?? [];
    return {
      id: q.id,
      position: q.position,
      type: 'ordering',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        items: stableShuffle(
          items.map((text, i) => ({
            id: publicOptionId(q.id, 'ordering', i),
            text,
          })),
          orderingSeed,
        ),
      },
    };
  }
  if (q.type === 'fill_blanks') {
    const opts = q.options as FillBlanksOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'fill_blanks',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        template: opts.template ?? '',
        blanks: (opts.blanks ?? []).length,
        blankWidths: (opts.blanks ?? []).map(blank => answerWidthHint(blank.answer)),
      },
    };
  }
  if (q.type === 'scramble') {
    const opts = q.options as ScrambleOptions;
    const unit = opts.unit === 'words' ? 'words' : 'letters';
    const pieces = splitScrambleAnswer(opts.correctAnswer ?? '', unit);
    const tiles = pieces.map((text, i) => ({
      id: publicOptionId(q.id, 'scramble', i),
      text,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'scramble',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        tiles: stableShuffle(tiles, scrambleSeed),
        unit,
      },
    };
  }
  if (q.type === 'speaking') {
    const opts = q.options as SpeakingOptions;
    return {
      id: q.id,
      position: q.position,
      type: 'speaking',
      prompt: q.prompt,
      description: questionDescription(q.options),
      instruction: questionInstruction(q.options),
      media: visualMedia(q),
      audioMedia: audioMediaOf(q),
      required: q.required,
      options: {
        maxRecordingSeconds: Number.isFinite(opts.maxRecordingSeconds) ? opts.maxRecordingSeconds : 30,
      },
    };
  }
  // Future types must be added here explicitly.
  throw new Error(`Unknown question type: ${(q as { type: string }).type}`);
}

function answerWidthHint(answer: string | undefined) {
  const length = (answer ?? '').trim().length;
  return Math.max(4, Math.min(32, length || 4));
}
