import { pinyin } from 'pinyin-pro';

import type { PinyinSegment } from './types';

const HAN = /[㐀-䶿一-鿿豈-﫿]/;

/**
 * Annotate Chinese text with per-character pinyin (tone marks).
 *
 * Returns one segment per character so the renderer can stack the pinyin
 * directly above its character. `p` is '' for anything that isn't Han, so
 * punctuation, Latin letters, and digits render plainly with no pinyin row.
 *
 * Returns `null` when the text contains no Han characters — nothing to
 * annotate, so callers should fall back to plain text.
 *
 * Uses pinyin-pro's word segmentation, which resolves most polyphonic
 * characters (多音字) from context (e.g. 银行 → háng vs 行走 → xíng).
 */
export function annotatePinyin(text: string): PinyinSegment[] | null {
  if (!text || !HAN.test(text)) return null;
  const items = pinyin(text, { type: 'all', toneType: 'symbol' }) as Array<{
    origin: string;
    pinyin: string;
    isZh: boolean;
  }>;
  return items.map(it => ({ c: it.origin, p: it.isZh ? it.pinyin : '' }));
}
