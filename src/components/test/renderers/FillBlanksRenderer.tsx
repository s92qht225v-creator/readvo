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
    <div className="test-fill-blanks" style={{ fontSize: 16, lineHeight: 1.8, color: '#0f172a' }}>
      {parts.map((p, idx) => {
        if (idx % 2 === 0) return <span key={idx}>{p}</span>;
        const blankIdx = parseInt(p, 10) - 1;
        const width = blankInputWidth(submitted[blankIdx], blankWidths?.[blankIdx]);
        return (
          <input
            key={idx}
            type="text"
            className="test-fill-blank-input"
            value={submitted[blankIdx] ?? ''}
            onChange={e => set(blankIdx, e.target.value)}
            placeholder=" "
            style={{
              display: 'inline-block',
              width,
              minWidth: '4.6ch',
              maxWidth: '100%',
              height: '1.9em',
              minHeight: '1.9em',
              margin: '0 0.18em',
              padding: '0 0.45em',
              fontSize: 16,
              background: 'rgba(4,69,175,0.08)',
              border: 'none',
              borderBottom: '1.5px solid #0445af',
              borderRadius: '1px 1px 0 0',
              color: '#0445af',
              fontFamily: 'inherit',
              lineHeight: 1.2,
              outline: 'none',
              verticalAlign: 'baseline',
            }}
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
