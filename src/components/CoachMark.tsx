'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'blim-tips-seen';

function getSeenTips(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function markSeen(tipId: string) {
  try {
    const seen = getSeenTips();
    seen[tipId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch { /* noop */ }
}

export function dismissTip(tipId: string) {
  markSeen(tipId);
}

function calculatePosition(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const tooltipH = 160;
  const margin = 12;
  const arrowH = 8;

  const spaceBelow = window.innerHeight - rect.bottom;
  const above = spaceBelow < tooltipH + arrowH + margin;

  const top = above
    ? rect.top + window.scrollY - tooltipH - arrowH
    : rect.bottom + window.scrollY + arrowH;

  const tooltipW = Math.min(280, window.innerWidth - margin * 2);
  let left = rect.left + rect.width / 2 - tooltipW / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tooltipW - margin));

  const arrowLeft = Math.max(16, Math.min(rect.left + rect.width / 2 - left, tooltipW - 16));

  return { top, left, arrowLeft, above };
}

interface Props {
  tipId: string;
  targetRef: React.RefObject<HTMLElement | null>;
  lang: string;
  text: Record<string, string>;
  btnText?: Record<string, string>;
  onDismiss?: () => void;
  delay?: number;
}

export function CoachMark({ tipId, targetRef, lang, text, btnText, onDismiss, delay = 1000 }: Props) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number; above: boolean } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // After delay, start polling for the target element
  useEffect(() => {
    const seen = getSeenTips();
    if (seen[tipId]) return;

    const delayTimer = setTimeout(() => {
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (targetRef.current) {
          clearInterval(poll);
          setShow(true);
        } else if (tries > 30) {
          clearInterval(poll);
        }
      }, 100);
      // Clean up interval on unmount
      cleanupRef.current = () => clearInterval(poll);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      cleanupRef.current?.();
    };
  }, [tipId, delay, targetRef]);

  const cleanupRef = useRef<(() => void) | null>(null);

  // Position the tooltip once visible
  useEffect(() => {
    if (!show || !targetRef.current) return;

    const calculate = () => {
      const el = targetRef.current;
      if (!el) return;
      setPos(calculatePosition(el));
    };

    calculate();
    window.addEventListener('resize', calculate);
    window.addEventListener('scroll', calculate, { passive: true });
    return () => {
      window.removeEventListener('resize', calculate);
      window.removeEventListener('scroll', calculate);
    };
  }, [show, targetRef]);

  const dismiss = useCallback(() => {
    markSeen(tipId);
    setShow(false);
    onDismiss?.();
  }, [tipId, onDismiss]);

  if (!show || !pos) return null;

  const label = text[lang] || text.en || '';
  const btn = btnText?.[lang] || ({ uz: 'Tushundim', ru: 'Понятно', en: 'Got it' } as Record<string, string>)[lang] || 'Got it';

  return (
    <>
      <div className="coach-backdrop" onClick={dismiss} />
      <div
        ref={tooltipRef}
        className={`coach-tooltip ${pos.above ? 'coach-tooltip--above' : ''}`}
        style={{ top: pos.top, left: pos.left, width: Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 24 : 280) }}
      >
        <div
          className={`coach-tooltip__arrow ${pos.above ? 'coach-tooltip__arrow--down' : ''}`}
          style={{ left: pos.arrowLeft }}
        />
        <div className="coach-tooltip__text">{label}</div>
        <button className="coach-tooltip__btn" type="button" onClick={dismiss}>
          {btn} →
        </button>
        <button className="coach-tooltip__skip" type="button" onClick={dismiss}>
          {({ uz: 'Boshqa ko\'rsatilmasin', ru: 'Больше не показывать', en: "Don't show again" } as Record<string, string>)[lang] || "Don't show again"}
        </button>
      </div>
    </>
  );
}

// ── Multi-step tour ──────────────────────────────────────────────────────

export interface TourStep {
  tipId: string;
  targetRef: React.RefObject<HTMLElement | null>;
  text: Record<string, string>;
  forceAbove?: boolean;
}

interface TourProps {
  tourId: string;
  steps: TourStep[];
  lang: string;
  delay?: number;
}

export function CoachMarkTour({ tourId, steps, lang, delay = 1000 }: TourProps) {
  const [step, setStep] = useState(-1); // -1 = not started
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number; above: boolean } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // After delay, check localStorage and start
  useEffect(() => {
    if (steps.length === 0) return;
    const seen = getSeenTips();
    if (seen[tourId]) return;

    const timer = setTimeout(() => {
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (steps[0].targetRef.current) {
          clearInterval(poll);
          setStep(0);
        } else if (tries > 30) {
          clearInterval(poll);
        }
      }, 100);
      cleanupRef.current = () => clearInterval(poll);
    }, delay);

    return () => {
      clearTimeout(timer);
      cleanupRef.current?.();
    };
  }, [tourId, steps, delay]);

  // Position tooltip when step changes
  useEffect(() => {
    if (step < 0 || step >= steps.length) return;
    const el = steps[step].targetRef.current;
    if (!el) return;

    // Scroll target into view if not visible
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Recalculate after possible scroll
    const reposition = () => {
      const current = steps[step].targetRef.current;
      if (!current) return;
      const p = calculatePosition(current);
      if (steps[step].forceAbove) {
        const r = current.getBoundingClientRect();
        p.above = true;
        p.top = r.top + window.scrollY - 160 - 8;
      }
      setPos(p);
    };

    // Small delay to let scroll finish
    const t = setTimeout(reposition, 350);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition);
    };
  }, [step, steps]);

  const dismiss = useCallback(() => {
    markSeen(tourId);
    setStep(-1);
    setPos(null);
  }, [tourId]);

  const next = useCallback(() => {
    if (step >= steps.length - 1) {
      dismiss();
    } else {
      setPos(null); // clear so it recalculates
      setStep(s => s + 1);
    }
  }, [step, steps.length, dismiss]);

  if (step < 0 || step >= steps.length || !pos) return null;

  const current = steps[step];
  const label = current.text[lang] || current.text.en || '';
  const isLast = step === steps.length - 1;
  const btnLabel = isLast
    ? (({ uz: 'Tushundim', ru: 'Понятно', en: 'Got it' } as Record<string, string>)[lang] || 'Got it')
    : (({ uz: 'Keyingi', ru: 'Далее', en: 'Next' } as Record<string, string>)[lang] || 'Next');

  return (
    <>
      <div className="coach-backdrop" onClick={dismiss} />
      <div
        className={`coach-tooltip ${pos.above ? 'coach-tooltip--above' : ''}`}
        style={{ top: pos.top, left: pos.left, width: Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 24 : 280) }}
      >
        <div
          className={`coach-tooltip__arrow ${pos.above ? 'coach-tooltip__arrow--down' : ''}`}
          style={{ left: pos.arrowLeft }}
        />
        <div className="coach-tooltip__text">{label}</div>
        <div className="coach-tooltip__counter">{step + 1} / {steps.length}</div>
        <button className="coach-tooltip__btn" type="button" onClick={next}>
          {btnLabel} →
        </button>
        <button className="coach-tooltip__skip" type="button" onClick={dismiss}>
          {({ uz: 'Boshqa ko\'rsatilmasin', ru: 'Больше не показывать', en: "Don't show again" } as Record<string, string>)[lang] || "Don't show again"}
        </button>
      </div>
    </>
  );
}
