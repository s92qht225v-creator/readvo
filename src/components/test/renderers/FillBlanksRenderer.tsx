'use client';

export function FillBlanksPlayer({ template, blanks, blankWidths, value, onChange }: {
  template: string;
  blanks: number;
  blankWidths?: number[];
  value: { blanks?: string[] };
  onChange: (v: { blanks: string[] }) => void;
}) {
  const submitted = value.blanks ?? new Array(blanks).fill('');
  const parts = template.split(/\{(\d+)\}/g);
  const set = (i: number, v: string) => {
    const next = submitted.slice();
    next[i] = v;
    onChange({ blanks: next });
  };

  return (
    <div className="test-fill-blanks">
      {parts.map((p, idx) => {
        if (idx % 2 === 0) return <span key={idx}>{p}</span>;
        const blankIdx = parseInt(p, 10) - 1;
        /* Only the dynamic, content-driven width stays inline. All
           other styling (height, padding, font, colors, border-bottom,
           radius) lives in tq-options.css under --fb-* tokens. */
        const width = blankInputWidth(submitted[blankIdx], blankWidths?.[blankIdx]);
        return (
          <input
            key={idx}
            type="text"
            className="test-fill-blank-input"
            value={submitted[blankIdx] ?? ''}
            onChange={e => set(blankIdx, e.target.value)}
            placeholder=" "
            style={{ width }}
          />
        );
      })}
    </div>
  );
}

function blankInputWidth(value: string | undefined, answerLengthHint: number | undefined) {
  const typedLength = (value ?? '').length;
  /* `ch` is the width of the '0' glyph, but proportional fonts render
     many letters wider than that (an 'm' is ~1.5ch). With the input's
     box-sizing: border-box + 0.45em side padding, the inline width below
     maps almost 1:1 to the available text area, so a bare `typedLength`
     of ch left the text cramped and clipped the last character on wide
     words (e.g. "name", whose 'm' overflows a 4ch box). Add ~2 chars of
     slack to cover wide glyphs + the caret. The trailing `+ 0.9em`
     offsets the horizontal padding so the slack lands on the content,
     not the padding. */
  const ch = Math.min(30, Math.max(5, typedLength + 2, (answerLengthHint ?? 4) + 2));
  return `calc(${ch}ch + 0.9em)`;
}
