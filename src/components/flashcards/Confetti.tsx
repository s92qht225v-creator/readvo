'use client';

import React, { useMemo } from 'react';

// Pure pseudo-random (deterministic → lint-safe, no Math.random in render).
const rnd = (i: number, n: number) => { const x = Math.sin(i * 12.9898 + n * 4.1414) * 43758.5453; return x - Math.floor(x); };

/** Lightweight CSS confetti burst (no library). Renders once on mount. */
export function Confetti({ count = 30 }: { count?: number }) {
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: rnd(i, 1) * 100,
      bg: ['#dc2626', '#16a34a', '#2563eb', '#f59e0b', '#db2777', '#06b6d4'][i % 6],
      delay: rnd(i, 2) * 0.5,
      dur: 1.4 + rnd(i, 3) * 1.1,
      rot: (rnd(i, 4) * 720 - 360),
      w: 6 + rnd(i, 5) * 5,
    })),
    [count],
  );
  return (
    <div className="fc-confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="fc-confetti__p"
          style={{
            left: `${p.left}%`,
            width: `${p.w}px`,
            height: `${p.w * 1.6}px`,
            background: p.bg,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--rot' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
