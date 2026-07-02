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

// Tanwin only: fathatan, dammatan, kasratan (U+064B-U+064D). Written MSA marks
// these grammatical case endings, but reading them aloud word-for-word sounds
// like formal recitation, not natural speech \u2014 native speakers drop them in
// ordinary spoken delivery (pausal form). Stripping just these three (not the
// full TASHKEEL set) keeps mid-word vowels intact for correct pronunciation.
const TANWIN = /[\u064B-\u064D]/g;

/** Remove tanwin (nunation) marks so TTS reads case endings the way a person
 *  speaking naturally would, instead of literal formal/recited nunation. */
export function stripTanwin(text: string): string {
  return text.replace(TANWIN, '');
}
