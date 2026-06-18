// Arabic tashkeel (vowel/diacritic marks): U+064B..U+0652 (tanwin..sukun)
// plus U+0670 (superscript alef) — the standard MSA vowelization marks.
// Stripping these turns fully vowelized text into the bare consonantal
// skeleton, which is what the "hide pronunciation aid" toggle shows
// (mirrors Chinese's hide-pinyin).
const TASHKEEL = /[\u064B-\u0652\u0670]/g;

/** Remove all harakat (diacritics) from Arabic text. */
export function stripHarakat(text: string): string {
  return text.replace(TASHKEEL, '');
}
