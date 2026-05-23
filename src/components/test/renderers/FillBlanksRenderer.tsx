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
  const ch = Math.min(28, Math.max(4, typedLength, answerLengthHint ?? 4));
  return `calc(${ch}ch + 0.9em)`;
}
