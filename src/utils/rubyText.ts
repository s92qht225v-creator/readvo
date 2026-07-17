/**
 * Aligns pinyin syllables to their corresponding Chinese characters.
 *
 * Given a Chinese text string and its sentence-level pinyin,
 * returns an array of { char, pinyin? } pairs for ruby rendering.
 *
 * Handles compound pinyin like "Jīntiān" → ["Jīn", "tiān"] for 今天.
 */

export interface RubyPair {
  char: string;
  pinyin?: string;
}

function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9fff)   // main CJK block
    || (code >= 0x3400 && code <= 0x4dbf)      // Extension A
    || (code >= 0xf900 && code <= 0xfaff);     // Compatibility Ideographs (e.g. 車, 更)
}

/**
 * Pinyin tone vowels — used to detect syllable boundaries in compound words.
 */
const TONE_VOWELS = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
const PLAIN_VOWELS = 'aeiouü';
const ALL_VOWELS = TONE_VOWELS + PLAIN_VOWELS + 'AEIOU' + 'ĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ';

function isVowel(ch: string): boolean {
  return ALL_VOWELS.includes(ch);
}

/**
 * Splits a compound pinyin word into individual syllables.
 * e.g., "Jīntiān" → ["Jīn", "tiān"]
 *       "xīngqīliù" → ["xīng", "qī", "liù"]
 *       "kě'ài" → ["kě", "ài"]
 *       "Xiǎoyǔ" → ["Xiǎo", "yǔ"]
 *
 * Each Mandarin syllable has the structure:
 *   [initial consonant(s)] + vowel group + [final: n, ng, r]
 *
 * We detect boundaries where a consonant follows a completed syllable.
 */
function splitPinyinWord(word: string): string[] {
  // Apostrophe separator (e.g. "kě'ài"). Each side must still be split itself —
  // an apostrophe marks ONE boundary, not every boundary: "èrshí'èr" is
  // èr·shí·èr, not èrshí·èr.
  if (word.includes("'")) {
    return word.split("'").flatMap(part => (part ? splitPinyinWord(part) : []));
  }

  // Single syllable shortcut: count vowel groups
  const vowelGroupCount = countVowelGroups(word);
  if (vowelGroupCount <= 1) {
    return [word];
  }

  // Known pinyin initials (consonants that start a syllable)
  const INITIALS = [
    'zh', 'ch', 'sh',
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'g', 'k', 'h',
    'j', 'q', 'x',
    'z', 'c', 's',
    'r', 'w', 'y',
  ];

  const syllables: string[] = [];
  let current = '';

  let i = 0;
  while (i < word.length) {
    const ch = word[i];

    // If we already have vowel content in current syllable,
    // check if this character starts a new syllable
    if (current.length > 0 && hasVowel(current)) {
      // Check if current position starts a new initial
      const lowerRest = word.slice(i).toLowerCase();

      // 'n' and 'g' are tricky — could be final (n, ng) or new initial
      if (ch.toLowerCase() === 'n') {
        // "ng" at this position: is it a final "ng" or initial "n" + vowel?
        if (i + 1 < word.length && word[i + 1].toLowerCase() === 'g') {
          // Check if after "ng" there's a vowel (then ng is final, next is vowel-initial syllable)
          // or a consonant (then ng is final)
          if (i + 2 < word.length && isVowel(word[i + 2])) {
            // "ng" + vowel is ambiguous, and both readings occur:
            //   yīngér  → yīng·ér   (-ng is the final; "er" is a real syllable)
            //   bàngōng → bàn·gōng  (the g OPENS the next syllable; "ong" is not)
            // Only keep -ng as the final when a genuine zero-initial syllable
            // starts at the vowel.
            if (startsZeroInitialSyllable(word, i + 2)) {
              current += 'ng';
              i += 2;
              syllables.push(current);
              current = '';
              continue;
            }
            // Otherwise the 'g' belongs to the next syllable: 'n' is this
            // syllable's final (bàn·gōng).
            current += 'n';
            i += 1;
            syllables.push(current);
            current = '';
            continue;
          } else if (i + 2 < word.length && !isVowel(word[i + 2])) {
            // ng + consonant: ng is final
            current += 'ng';
            i += 2;
            syllables.push(current);
            current = '';
            continue;
          } else {
            // ng at end of word
            current += 'ng';
            i += 2;
            continue;
          }
        }
        // "n" followed by a vowel: n is the INITIAL of the next syllable, not a
        // final of the current one — e.g. zhìnéng → zhì·néng, kěnéng → kě·néng,
        // rènào → rè·nào. (A genuine final-n before a vowel-initial syllable is
        // written with an apostrophe, e.g. Xī'ān, and is handled above.)
        if (i + 1 < word.length && isVowel(word[i + 1])) {
          syllables.push(current);
          current = 'n';
          i += 1;
          continue;
        }
        // "n" followed by consonant: n is final
        // But if next char is 'r' at the end of the word, it's erhua suffix (e.g., diǎnr)
        if (i + 1 < word.length && !isVowel(word[i + 1])) {
          if (word[i + 1].toLowerCase() === 'r' && i + 2 === word.length) {
            current += 'nr';
            i += 2;
            continue;
          }
          current += 'n';
          i += 1;
          syllables.push(current);
          current = '';
          continue;
        }
      }

      // 'r' after vowel: could be erhua final or initial of next syllable
      if (ch.toLowerCase() === 'r') {
        if (i + 1 < word.length && isVowel(word[i + 1])) {
          // r + vowel: r is initial of new syllable
          syllables.push(current);
          current = '';
          // fall through to add 'r' below
        } else {
          // r at end or r + consonant: erhua suffix
          current += ch;
          i++;
          continue;
        }
      }

      // Check for two-char initials first
      const twoChar = word.slice(i, i + 2).toLowerCase();
      if (['zh', 'ch', 'sh'].includes(twoChar)) {
        syllables.push(current);
        current = '';
        // fall through to add chars below
      } else if (!isVowel(ch) && ch.toLowerCase() !== 'n' && ch.toLowerCase() !== 'r') {
        // Any other consonant after a vowel starts a new syllable
        const chLower = ch.toLowerCase();
        if (INITIALS.includes(chLower)) {
          syllables.push(current);
          current = '';
        }
      }
    }

    current += ch;
    i++;
  }

  if (current) {
    syllables.push(current);
  }

  return syllables;
}

function hasVowel(s: string): boolean {
  return s.split('').some(isVowel);
}

/**
 * The complete set of zero-initial (vowel-initial) Mandarin syllables — the only
 * ones that can legitimately follow a final -n/-ng. Note what's absent: "ong",
 * and anything starting i/u/ü. Those never stand alone (they're written wēng,
 * yī, wū), which is exactly what lets us resolve bàngōng below.
 */
const ZERO_INITIAL_SYLLABLES = new Set([
  'a', 'ai', 'an', 'ang', 'ao', 'e', 'ei', 'en', 'eng', 'er', 'o', 'ou',
]);

/**
 * Maximal-munch test: does a REAL zero-initial syllable start at index `i`?
 * Must be maximal — "ōng" starts with "o", which is a valid syllable on its own,
 * so a non-greedy check would wrongly accept it. Taking the longest form gives
 * "ong", which is not a syllable, and the caller can then split correctly.
 */
function startsZeroInitialSyllable(word: string, i: number): boolean {
  let j = i;
  let vowels = '';
  while (j < word.length && isVowel(word[j])) { vowels += word[j]; j++; }
  if (!vowels) return false;
  let tail = '';
  if (j < word.length) {
    const c = word[j].toLowerCase();
    if (c === 'n') tail = (j + 1 < word.length && word[j + 1].toLowerCase() === 'g') ? 'ng' : 'n';
    else if (c === 'r') tail = 'r';
  }
  return ZERO_INITIAL_SYLLABLES.has(stripPinyinTones(vowels + tail).replace(/\s/g, ''));
}

function countVowelGroups(s: string): number {
  let count = 0;
  let inVowel = false;
  for (const ch of s) {
    if (isVowel(ch)) {
      if (!inVowel) {
        count++;
        inVowel = true;
      }
    } else {
      inVowel = false;
    }
  }
  return count;
}

function stripPunct(syllable: string): string {
  return syllable.replace(/^["""''()（）]+/, '').replace(/[.,!?;:。，！？；："""''()（）]+$/g, '');
}

/**
 * Strips tone marks and punctuation from pinyin, lowercases.
 * e.g., "Nǐ jiào shénme míngzi?" → "ni jiao shenme mingzi"
 */
export function stripPinyinTones(pinyin: string): string {
  const TONE_MAP: Record<string, string> = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
  };
  return pinyin
    .split('')
    .map(ch => TONE_MAP[ch] || TONE_MAP[ch.toLowerCase()] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function alignPinyinToText(text: string, pinyin: string): RubyPair[] {
  // Split pinyin into space-separated tokens, then split compound words into syllables
  const tokens = pinyin.split(/\s+/).filter(Boolean);
  const syllables: string[] = [];
  for (const token of tokens) {
    const cleaned = stripPunct(token);
    // Punctuation-only tokens ("……", "—") must not become syllables, or every
    // character after them is shifted onto the wrong pinyin.
    if (!cleaned || !/\p{L}/u.test(cleaned)) continue;
    const parts = splitPinyinWord(cleaned);
    syllables.push(...parts);
  }

  const result: RubyPair[] = [];
  let pinyinIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (isCJK(char)) {
      if (pinyinIndex < syllables.length) {
        const syl = syllables[pinyinIndex];
        // Handle erhua: if syllable ends with 'r' and next char is 儿,
        // merge both characters under one ruby with the full pinyin (e.g., 玩儿 = wánr)
        if (char !== '儿' && syl.length > 1 && syl.toLowerCase().endsWith('r') && i + 1 < text.length && text[i + 1] === '儿') {
          result.push({ char: char + '儿', pinyin: syl });
          i++; // skip 儿
        } else {
          result.push({ char, pinyin: syl });
        }
      } else {
        result.push({ char });
      }
      pinyinIndex++;
    } else {
      // Non-CJK: collect consecutive non-CJK chars and check if they match current pinyin token
      let nonCjk = char;
      while (i + 1 < text.length && !isCJK(text[i + 1]) && !/[。，！？；：、""''（）]/.test(text[i + 1])) {
        i++;
        nonCjk += text[i];
      }
      // If the non-CJK text matches the current pinyin syllable (e.g. "AI" = "AI"),
      // consume it. Compare on letters/digits only: the run above sweeps up any
      // trailing punctuation the stop-list misses ("App……"), which would
      // otherwise fail to match its token ("App") and shift it onto the next
      // character.
      const core = nonCjk.replace(/[^\p{L}\p{N}]/gu, '');
      if (core && pinyinIndex < syllables.length && core.toLowerCase() === syllables[pinyinIndex].toLowerCase()) {
        pinyinIndex++;
      }
      result.push({ char: nonCjk });
    }
  }

  return result;
}
