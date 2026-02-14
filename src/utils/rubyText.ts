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
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
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
  // Handle apostrophe separator (e.g., "kě'ài")
  if (word.includes("'")) {
    return word.split("'");
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
            // ng + vowel: ng is final, vowel starts new syllable
            current += 'ng';
            i += 2;
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
        // "n" followed by vowel: could be final "n" + new vowel-initial syllable,
        // or part of current syllable
        if (i + 1 < word.length && isVowel(word[i + 1])) {
          // n + vowel: n is final of current, next vowel starts new syllable
          current += 'n';
          i += 1;
          syllables.push(current);
          current = '';
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

export function alignPinyinToText(text: string, pinyin: string): RubyPair[] {
  // Split pinyin into space-separated tokens, then split compound words into syllables
  const tokens = pinyin.split(/\s+/).filter(Boolean);
  const syllables: string[] = [];
  for (const token of tokens) {
    const cleaned = stripPunct(token);
    if (!cleaned) continue;
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
      // If the non-CJK text matches the current pinyin syllable (e.g., "AI" = "AI"), consume it
      if (pinyinIndex < syllables.length && nonCjk.toLowerCase() === syllables[pinyinIndex].toLowerCase()) {
        pinyinIndex++;
      }
      result.push({ char: nonCjk });
    }
  }

  return result;
}
