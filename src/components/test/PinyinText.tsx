import type { PinyinSegment } from '@/lib/test/types';

/* Pinyin annotation: per-character flexbox columns (pinyin stacked over the
   character), not <ruby> — gives precise, cross-browser-consistent spacing.
   Segments are generated server-side (pinyin-pro never ships to the player).
   aria-label carries the clean text; the visual columns are aria-hidden.
   Styling lives in tq-options.css (.tq-pinyin*). */
export function PinyinText({ segments }: { segments: PinyinSegment[] }) {
  return (
    <span className="tq-pinyin" aria-label={segments.map(s => s.c).join('')}>
      {segments.map((s, i) => (
        s.c.includes('\n') ? (
          /* A newline forces the following characters onto a new line
             (full-width flex break in the wrapping .tq-pinyin row) so
             multi-line prompts / dialogues keep their line breaks. */
          <span key={i} className="tq-pinyin__break" aria-hidden="true" />
        ) : (
          <span key={i} className="tq-pinyin__col" aria-hidden="true">
            <span className="tq-pinyin__py">{s.p || ' '}</span>
            <span className="tq-pinyin__hz">{s.c}</span>
          </span>
        )
      ))}
    </span>
  );
}
