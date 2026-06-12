'use client';

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders text that may contain LaTeX math wrapped in `$...$` (inline)
 * or `$$...$$` (block) delimiters. Non-math segments render as plain
 * text; math segments render via KaTeX.
 *
 * Used for question prompts, descriptions, and answer-choice labels in
 * both the live player and the builder preview. Teachers type e.g.
 * "Soddalashtiring: $4b^2 \cdot a$" and the $...$ part renders as math.
 *
 * KaTeX is configured with `throwOnError: false` so a malformed
 * expression renders in red rather than crashing the page — important
 * because teachers author the LaTeX by hand.
 *
 * Imports `katex/dist/katex.min.css` itself, so the KaTeX styles are
 * bundled only into routes that render MathText (the test app) instead
 * of shipping to every visitor via the root layout.
 */
type Segment = { math: false; text: string } | { math: true; tex: string; display: boolean };

/* Split on $$...$$ first (block), then $...$ (inline). A backslash-
   escaped \$ is treated as a literal dollar sign, not a delimiter. */
function parseSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = '';
  let i = 0;
  const n = input.length;

  const flushText = () => {
    if (buffer) { segments.push({ math: false, text: buffer }); buffer = ''; }
  };

  while (i < n) {
    const ch = input[i];
    if (ch === '\\' && i + 1 < n && input[i + 1] === '$') {
      buffer += '$';
      i += 2;
      continue;
    }
    if (ch === '$') {
      const display = input[i + 1] === '$';
      const open = display ? '$$' : '$';
      const closeFrom = i + open.length;
      const close = input.indexOf(open, closeFrom);
      if (close !== -1) {
        const tex = input.slice(closeFrom, close);
        flushText();
        segments.push({ math: true, tex, display });
        i = close + open.length;
        continue;
      }
    }
    buffer += ch;
    i += 1;
  }
  flushText();
  return segments;
}

export function MathText({ children }: { children: string | null | undefined }) {
  const text = children ?? '';
  const segments = useMemo(() => parseSegments(text), [text]);

  /* Fast path: no math delimiters → render as plain text. */
  if (!text.includes('$')) return <>{text}</>;

  return (
    <>
      {segments.map((seg, idx) => {
        if (!seg.math) return <span key={idx}>{seg.text}</span>;
        let html: string;
        try {
          html = katex.renderToString(seg.tex, {
            displayMode: seg.display,
            throwOnError: false,
            output: 'html',
          });
        } catch {
          html = seg.tex; // ultimate fallback — show the raw source
        }
        return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
}
