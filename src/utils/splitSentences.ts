/**
 * Split a dialogue entry into its individual sentences, pairing each Chinese
 * sentence with its own slice of the translation.
 *
 * Roughly half of all dialogue entries hold more than one sentence (1327 of
 * 3003), but the JSON stores ONE translation string per entry. Showing a
 * translation per sentence therefore means splitting that string and trusting
 * the pairing.
 *
 * The pairing is trusted only when both sides yield the same number of
 * sentences — 99.9% uz / 99.7% ru / 99.0% en across the corpus. When the counts
 * disagree the entry is returned as a single segment, so the reader shows the
 * whole entry's translation. That is precisely what it did before this existed:
 * a miscount degrades to the old behaviour, never to a confidently wrong
 * pairing of the wrong translation to a sentence.
 */

export interface SentenceSegment {
  zh: string;
  tr: string;
  /** Code-point offset (exclusive) of this segment's end within the original. */
  end: number;
}

const OPEN = '「『“（(【[';
const CLOSE = '」』”）)】]';
const ZH_END = '。？！';
const TR_END = '.?!';

/**
 * Chinese side. A terminator only ends a sentence at bracket/quote depth zero —
 * otherwise a quoted question ("…「你怎么不回消息？」") counts as two.
 */
function splitZh(text: string): { zh: string; end: number }[] {
  const cps = [...text];
  const out: { zh: string; end: number }[] = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < cps.length; i++) {
    const ch = cps[i];
    buf += ch;
    if (OPEN.includes(ch)) depth++;
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1);
    else if (ZH_END.includes(ch) && depth === 0) {
      // A closing quote right after the terminator belongs to this sentence.
      while (i + 1 < cps.length && CLOSE.includes(cps[i + 1])) buf += cps[++i];
      out.push({ zh: buf, end: i + 1 });
      buf = '';
    }
  }
  if (buf) out.push({ zh: buf, end: cps.length });
  return out;
}

/**
 * Translation side. Hand-scanned rather than a lookbehind regex — lookbehind
 * only reached Safari in 16.4 and this runs on phones.
 *
 * "…" is deliberately NOT a terminator. Translators use it mid-sentence for the
 * same trailing-off that Chinese writes as "……", and treating it as an ending
 * was the single largest source of miscounts.
 */
function splitTr(text: string): string[] {
  const s = text.replace(/\.\.\./g, '…').trim();
  const out: string[] = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    buf += s[i];
    if (!TR_END.includes(s[i])) continue;
    // Absorb a run of terminators ("?!", "!!").
    while (i + 1 < s.length && TR_END.includes(s[i + 1])) buf += s[++i];
    if (i + 1 < s.length && /\s/.test(s[i + 1])) {
      out.push(buf.trim());
      buf = '';
      while (i + 1 < s.length && /\s/.test(s[i + 1])) i++;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

export function splitAligned(zh: string, tr: string): SentenceSegment[] {
  const total = [...zh].length;
  const whole = [{ zh, tr, end: total }];
  const z = splitZh(zh);
  if (z.length < 2) return whole;
  const t = splitTr(tr || '');
  if (t.length !== z.length) return whole;
  return z.map((seg, i) => ({ zh: seg.zh, tr: t[i], end: seg.end }));
}
