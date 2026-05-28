/**
 * Detect the dominant CJK/Arabic script of a string and return a BCP-47
 * language tag suitable for the `lang` attribute. Used so the browser
 * picks region-correct glyph shapes (via the OpenType `locl` feature)
 * and the `[lang="…"]` font rules in reading.css apply the right
 * regional font.
 *
 * Priority matters: Hangul and kana are script-unique signals, so they
 * win over Han. A string containing kana is Japanese even if it also
 * contains kanji (Han); a string with Hangul is Korean. Pure-Han text
 * is ambiguous across zh/ja/ko — we default it to Chinese ('zh') since
 * Blim is primarily a Chinese-learning platform.
 *
 * Returns undefined for Latin/Cyrillic/etc. so those elements keep the
 * inherited Latin theme font and no lang override.
 */
export function detectScriptLang(text?: string | null): string | undefined {
  if (!text) return undefined;
  // Korean: Hangul syllables + Jamo
  if (/[가-힣ᄀ-ᇿ㄰-㆏]/.test(text)) return 'ko';
  // Japanese: Hiragana + Katakana (kana is unique to Japanese)
  if (/[぀-ゟ゠-ヿ]/.test(text)) return 'ja';
  // Arabic (also drives RTL via dir="auto", which is set separately)
  if (/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text)) return 'ar';
  // Han (CJK Unified Ideographs) — default to Chinese
  if (/[一-鿿㐀-䶿豈-﫿]/.test(text)) return 'zh';
  return undefined;
}
