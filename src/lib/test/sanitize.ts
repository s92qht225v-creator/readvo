import type {
  TestQuestion, PublicQuestion,
  MultipleChoiceOptions, ShortTextOptions, PictureChoiceOptions,
  MatchOptions, OrderingOptions, FillBlanksOptions,
  LongAnswerOptions, NumberOptions, DropdownOptions, CheckboxOptions,
  OpinionScaleOptions, RatingOptions,
} from './types';

export function publicOptionId(questionId: string, kind: 'choice' | 'match-right' | 'ordering', index: number): string {
  return `opt_${stableHash(`${kind}:${questionId}:${index}`)}`;
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

function questionMedia(options: unknown): PublicQuestion['media'] {
  const media = (options as { media?: unknown } | null)?.media as PublicQuestion['media'] | undefined;
  if (!media || typeof media.url !== 'string' || !media.url.trim()) return undefined;
  if (media.type !== 'image' && media.type !== 'gif' && media.type !== 'video' && media.type !== 'audio') return undefined;
  if (media.type === 'audio') {
    return {
      type: media.type,
      url: media.url,
      alt: typeof media.alt === 'string' ? media.alt : undefined,
      provider: media.provider,
    };
  }
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
    layoutMobile: media.layoutMobile === 'wallpaper' ? 'stack' : media.layoutMobile,
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
 */
export function sanitizeQuestion(q: TestQuestion): PublicQuestion {
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, `${q.id}:choices`) : choices,
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
      media: questionMedia(q.options),
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
      media: questionMedia(q.options),
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
      media: questionMedia(q.options),
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, `${q.id}:choices`) : choices,
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, `${q.id}:choices`) : choices,
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        min: Number.isFinite(opts.min) ? opts.min : 0,
        max: Number.isFinite(opts.max) ? opts.max : 10,
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        max: Number.isFinite(opts.max) ? opts.max : 5,
        shape: opts.shape ?? 'star',
      },
    };
  }
  if (q.type === 'picture_choice') {
    const opts = q.options as PictureChoiceOptions;
    const choices = (opts.choices ?? []).map((c, i) => ({
      id: publicOptionId(q.id, 'choice', i),
      text: c.text,
      image_url: c.image_url,
    }));
    return {
      id: q.id,
      position: q.position,
      type: 'picture_choice',
      prompt: q.prompt,
      description: questionDescription(q.options),
      media: questionMedia(q.options),
      required: q.required,
      options: {
        choices: opts.randomize ? stableShuffle(choices, `${q.id}:choices`) : choices,
        allowMultiple: !!opts.allowMultiple,
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
      media: questionMedia(q.options),
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
      media: questionMedia(q.options),
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
          `${q.id}:match`,
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        items: stableShuffle(
          items.map((text, i) => ({
            id: publicOptionId(q.id, 'ordering', i),
            text,
          })),
          `${q.id}:ordering`,
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
      media: questionMedia(q.options),
      required: q.required,
      options: {
        template: opts.template ?? '',
        blanks: (opts.blanks ?? []).length,
        blankWidths: (opts.blanks ?? []).map(blank => answerWidthHint(blank.answer)),
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
