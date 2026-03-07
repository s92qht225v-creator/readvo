'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

// Tunable constants
const STROKE_TOLERANCE = 0.15;
const DIRECTION_THRESHOLD = 0.45;
const HINT_MISTAKES_THRESHOLD = 2;
const ANIMATION_DURATION = 600;
const MAX_SLIDE_OFFSET = 40; // max px offset for slide-from-user-position

interface Point {
  x: number;
  y: number;
}

interface StrokeData {
  path: string;
  median: Array<[number, number]>;
}

interface Props {
  char: string;
  lang: 'uz' | 'ru';
  onComplete?: (mistakes: number) => void;
  revealAll?: number; // increment to trigger reveal; 0 = idle
  hidden?: boolean; // hide character outline (write from memory)
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Point): Point {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function smoothPoints(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const s: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    s.push({
      x: (points[i - 1].x + points[i].x + points[i + 1].x) / 3,
      y: (points[i - 1].y + points[i].y + points[i + 1].y) / 3,
    });
  }
  s.push(points[points.length - 1]);
  return s;
}

function drawTaperedStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  canvasSize: number
): void {
  if (points.length < 2) return;
  const maxW = canvasSize * 0.045;
  const minW = canvasSize * 0.008;
  for (let i = 1; i < points.length; i++) {
    const t = i / points.length;
    const w = maxW * Math.sin(t * Math.PI) + minW;
    ctx.beginPath();
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
}

// hanzi-writer-data uses 1024-wide x 900-tall coordinate space (y-up)
const DATA_WIDTH = 1024;
const DATA_HEIGHT = 900;
const Y_SHIFT = -0.03; // shift character up by 3% of canvas size (prevents bottom clipping)

function computeYOffset(size: number, scale: number): number {
  return (size - DATA_HEIGHT * scale) / 2 + size * Y_SHIFT;
}

function transformMedian(median: Array<[number, number]>, size: number): Point[] {
  const scale = size / DATA_WIDTH;
  const yOffset = computeYOffset(size, scale);
  return median.map(([x, y]) => ({
    x: x * scale,
    y: yOffset + (DATA_HEIGHT - y) * scale,
  }));
}

function drawSVGPath(
  ctx: CanvasRenderingContext2D,
  pathStr: string,
  size: number,
  color: string,
  alpha = 1
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const scale = size / DATA_WIDTH;
  const yOffset = computeYOffset(size, scale);
  // y-flip with vertical centering: maps data (0,900)→top, (0,0)→bottom
  ctx.transform(scale, 0, 0, -scale, 0, DATA_HEIGHT * scale + yOffset);
  try {
    ctx.fill(new Path2D(pathStr));
  } catch { /* ignore */ }
  ctx.restore();
}

// Sample a point along a polyline at a given fraction (0–1) of its total arc length
function samplePolyline(points: Point[], fraction: number): Point {
  if (points.length < 2) return points[0];
  // Compute cumulative distances
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    dists.push(dists[i - 1] + distance(points[i - 1], points[i]));
  }
  const totalLen = dists[dists.length - 1];
  if (totalLen === 0) return points[0];
  const targetDist = totalLen * fraction;
  for (let i = 1; i < points.length; i++) {
    if (dists[i] >= targetDist) {
      const segLen = dists[i] - dists[i - 1];
      const t = segLen > 0 ? (targetDist - dists[i - 1]) / segLen : 0;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
  }
  return points[points.length - 1];
}

function gradeStroke(
  input: Point[],
  targetMedian: Array<[number, number]>,
  size: number
): boolean {
  if (input.length < 2) return false;
  const target = transformMedian(targetMedian, size);
  if (target.length < 2) return false;

  // Reject strokes that are too short (accidental taps/drags)
  const inputLen = distance(input[0], input[input.length - 1]);
  if (inputLen < size * 0.04) return false;

  const tolerance = size * STROKE_TOLERANCE;
  if (distance(input[0], target[0]) > tolerance) return false;
  if (distance(input[input.length - 1], target[target.length - 1]) > tolerance) return false;

  // Direction check
  const iDir = normalize({ x: input[input.length - 1].x - input[0].x, y: input[input.length - 1].y - input[0].y });
  const tDir = normalize({ x: target[target.length - 1].x - target[0].x, y: target[target.length - 1].y - target[0].y });
  if (iDir.x * tDir.x + iDir.y * tDir.y < DIRECTION_THRESHOLD) return false;

  // Shape check: sample both paths at 25%, 50%, 75% and compare
  const shapeTolerance = size * STROKE_TOLERANCE * 1.5; // slightly more forgiving than endpoints
  for (const frac of [0.25, 0.5, 0.75]) {
    const ip = samplePolyline(input, frac);
    const tp = samplePolyline(target, frac);
    if (distance(ip, tp) > shapeTolerance) return false;
  }

  return true;
}

// Helper: redraw all completed strokes on display canvas
function redrawCompleted(
  ctx: CanvasRenderingContext2D,
  strokes: StrokeData[],
  count: number,
  size: number
): void {
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    if (strokes[i]) drawSVGPath(ctx, strokes[i].path, size, '#3d3d3d');
  }
}

// Module-level cache: avoids re-fetching character data on revisit
const strokeCache = new Map<string, StrokeData[]>();

export function HanziCanvas({ char, lang, onComplete, revealAll = 0, hidden = false }: Props) {
  const [canvasSize, setCanvasSize] = useState(400);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const bgRef = useRef<HTMLCanvasElement>(null);
  const displayRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLCanvasElement>(null);

  const strokesRef = useRef<StrokeData[]>([]);
  const completedRef = useRef(0);
  const mistakesRef = useRef(0);
  const mistakesOnStrokeRef = useRef(0);
  const isDrawingRef = useRef(false);
  const currentInputRef = useRef<Point[]>([]);
  const animatingRef = useRef(false); // blocks input during stroke reveal animation
  const animFrameRef = useRef<number | null>(null);
  const inputRafRef = useRef<number | null>(null);
  const isDirtyRef = useRef(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintDotRafRef = useRef(0);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeRef = useRef(400);
  const dprRef = useRef(1);
  const unmountedRef = useRef(false);
  const lastRevealRef = useRef(0); // track last-processed revealAll value
  const guideModeRef = useRef(false); // Show → guide dot for each stroke, user still draws
  const startGuideDotRef = useRef<((idx: number) => void) | null>(null);

  // Keep refs in sync
  useEffect(() => { sizeRef.current = canvasSize; }, [canvasSize]);

  // Track DPR — useLayoutEffect so it's ready before canvas setup
  useLayoutEffect(() => {
    dprRef.current = Math.min(window.devicePixelRatio || 1, 3); // cap at 3x
  }, []);

  // Mark mounted/unmounted for cleanup
  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  // Canvas size
  useEffect(() => {
    const update = () => setCanvasSize(window.innerWidth <= 480 ? 300 : 400);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Helper: set up a canvas for retina rendering
  const setupCanvas = useCallback((canvas: HTMLCanvasElement | null, size: number) => {
    if (!canvas) return null;
    const dpr = dprRef.current;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return ctx;
  }, []);

  // Load character data from CDN (with in-memory cache)
  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    completedRef.current = 0;
    setCompletedCount(0);
    mistakesRef.current = 0;
    mistakesOnStrokeRef.current = 0;
    guideModeRef.current = false;
    lastRevealRef.current = 0;

    // Use cached data if available
    const cached = strokeCache.get(char);
    if (cached) {
      strokesRef.current = cached;
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const strokes: StrokeData[] = (data.strokes || []).map(
          (path: string, idx: number) => ({
            path,
            median: data.medians?.[idx] || [],
          })
        );
        strokeCache.set(char, strokes);
        strokesRef.current = strokes;
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [char]);

  // Draw background (outline + crosshair) — retina-aware
  // useLayoutEffect: must run BEFORE paint so canvas is initialized before user can interact
  useLayoutEffect(() => {
    if (loading || !bgRef.current || strokesRef.current.length === 0) return;
    const ctx = setupCanvas(bgRef.current, canvasSize);
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Crosshair
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, canvasSize / 2);
    ctx.lineTo(canvasSize, canvasSize / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Faint outline (skip in hidden mode — write from memory)
    if (!hidden) {
      strokesRef.current.forEach((s) => {
        drawSVGPath(ctx, s.path, canvasSize, '#c8b89a', 0.45);
      });
    }
  }, [loading, canvasSize, setupCanvas, hidden]);

  // Set up display and input canvases for retina
  // useLayoutEffect: must run BEFORE paint so DPR transform is ready before user draws
  useLayoutEffect(() => {
    if (loading) return;
    setupCanvas(displayRef.current, canvasSize);
    setupCanvas(inputRef.current, canvasSize);

    // Native touchstart preventDefault — prevents browser from intercepting touch
    // for scroll detection. React's onPointerDown preventDefault fires too late
    // (via event delegation at root) — the browser decides during touchstart.
    const canvas = inputRef.current;
    if (!canvas) return;
    const preventTouch = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    return () => canvas.removeEventListener('touchstart', preventTouch);
  }, [loading, canvasSize, setupCanvas]);

  // Persistent rAF loop for input canvas — decouples drawing from pointer events
  useEffect(() => {
    const rafLoop = () => {
      if (isDirtyRef.current && isDrawingRef.current) {
        isDirtyRef.current = false;
        const ctx = inputRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, sizeRef.current, sizeRef.current);
          drawTaperedStroke(ctx, currentInputRef.current, '#3d3d3d', sizeRef.current);
        }
      }
      inputRafRef.current = requestAnimationFrame(rafLoop);
    };
    inputRafRef.current = requestAnimationFrame(rafLoop);
    return () => {
      if (inputRafRef.current) cancelAnimationFrame(inputRafRef.current);
    };
  }, []);

  // Master cleanup on unmount — cancel all async work
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (inputRafRef.current) cancelAnimationFrame(inputRafRef.current);
      cancelAnimationFrame(hintDotRafRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Show guide dot looping along a stroke's median until user draws it
  const showGuideDot = useCallback(
    (strokeIdx: number) => {
      const inputCtx = inputRef.current?.getContext('2d');
      const strokes = strokesRef.current;
      const size = sizeRef.current;
      if (!inputCtx || !strokes[strokeIdx]) return;

      const stroke = strokes[strokeIdx];
      const median = transformMedian(stroke.median, size);
      if (median.length < 2) return;

      const DOT_RADIUS = size * 0.026;
      const DOT_COLOR = 'rgba(90, 75, 55, 0.85)';
      const DOT_TRAVEL_MS = 1000;
      const PAUSE_MS = 400;

      cancelAnimationFrame(hintDotRafRef.current);
      let startTime: number | null = null;
      let phase: 'travel' | 'pause' = 'travel';
      let pauseStart = 0;

      const tick = (now: number) => {
        if (unmountedRef.current) return;
        if (!startTime) startTime = now;

        inputCtx.clearRect(0, 0, size, size);

        if (phase === 'travel') {
          const progress = Math.min((now - startTime) / DOT_TRAVEL_MS, 1);
          const dotPos = samplePolyline(median, progress);
          const dotAlpha = progress > 0.85 ? (1 - progress) / 0.15 : 1;
          inputCtx.save();
          inputCtx.globalAlpha = dotAlpha;
          inputCtx.beginPath();
          inputCtx.arc(dotPos.x, dotPos.y, DOT_RADIUS, 0, Math.PI * 2);
          inputCtx.fillStyle = DOT_COLOR;
          inputCtx.fill();
          inputCtx.restore();
          if (progress >= 1) {
            phase = 'pause';
            pauseStart = now;
          }
        } else {
          // Pause at end, then restart
          if (now - pauseStart >= PAUSE_MS) {
            phase = 'travel';
            startTime = now;
          }
        }

        hintDotRafRef.current = requestAnimationFrame(tick);
      };

      hintDotRafRef.current = requestAnimationFrame(tick);
    },
    []
  );

  // Keep ref in sync so onRevealDone can call it without TDZ
  startGuideDotRef.current = showGuideDot;

  // Post-reveal: increment completed, run completion effect if all done
  const onRevealDone = useCallback((strokes: StrokeData[], safetyTimer: ReturnType<typeof setTimeout>) => {
    if (unmountedRef.current) return;
    clearTimeout(safetyTimer);
    completedRef.current += 1;
    setCompletedCount(completedRef.current);
    animatingRef.current = false;
    // Redraw display cleanly with new completed count
    const dCtx = displayRef.current?.getContext('2d');
    if (dCtx) redrawCompleted(dCtx, strokes, completedRef.current, sizeRef.current);

    // Guide mode: auto-start dot for next stroke
    if (guideModeRef.current && completedRef.current < strokes.length) {
      setTimeout(() => {
        if (!unmountedRef.current && guideModeRef.current && startGuideDotRef.current) {
          startGuideDotRef.current(completedRef.current);
        }
      }, 300);
    }

    if (completedRef.current >= strokes.length) {
      guideModeRef.current = false;
      // Completion effect: scale up → back down, turn red and stay red
      if (dCtx) {
        const size = sizeRef.current;
        let effectStart: number | null = null;
        const EFFECT_DURATION = 500;
        const MAX_SCALE = 1.08;
        const effectTick = (now: number) => {
          if (unmountedRef.current) return;
          if (!effectStart) effectStart = now;
          const t = Math.min((now - effectStart) / EFFECT_DURATION, 1);
          const scaleCurve = Math.sin(t * Math.PI);
          const s = 1 + (MAX_SCALE - 1) * scaleCurve;
          const ease = Math.min(t * 3, 1);
          const r = Math.round(61 + (220 - 61) * ease);
          const g = Math.round(61 + (38 - 61) * ease);
          const b = Math.round(61 + (38 - 61) * ease);
          dCtx.clearRect(0, 0, size, size);
          dCtx.save();
          dCtx.translate(size / 2, size / 2);
          dCtx.scale(s, s);
          dCtx.translate(-size / 2, -size / 2);
          for (let i = 0; i < strokes.length; i++) {
            drawSVGPath(dCtx, strokes[i].path, size, `rgb(${r},${g},${b})`);
          }
          dCtx.restore();
          if (t < 1) {
            animFrameRef.current = requestAnimationFrame(effectTick);
          } else {
            onComplete?.(mistakesRef.current);
          }
        };
        animFrameRef.current = requestAnimationFrame(effectTick);
      } else {
        setTimeout(() => onComplete?.(mistakesRef.current), 800);
      }
    }
  }, [onComplete]);

  // Handle correct stroke
  const onCorrect = useCallback(() => {
    const strokes = strokesRef.current;
    const idx = completedRef.current;
    const size = sizeRef.current;
    const stroke = strokes[idx];

    // Cancel any hint dot animation
    cancelAnimationFrame(hintDotRafRef.current);

    const rawPoints = [...currentInputRef.current];
    currentInputRef.current = [];
    mistakesOnStrokeRef.current = 0;

    // Block input during slide animation
    animatingRef.current = true;
    const safetyTimer = setTimeout(() => { animatingRef.current = false; }, ANIMATION_DURATION + 200);

    // Clear user's raw stroke immediately
    const inputCtx = inputRef.current?.getContext('2d');
    if (inputCtx) inputCtx.clearRect(0, 0, size, size);

    const dCtx = displayRef.current?.getContext('2d');

    // Slide-only animation: full canonical stroke drawn from frame 1, slides into place
    if (dCtx && rawPoints.length >= 2 && stroke && stroke.median.length >= 2) {
      const canonical = transformMedian(stroke.median, size);
      const dx = Math.max(-MAX_SLIDE_OFFSET, Math.min(MAX_SLIDE_OFFSET, rawPoints[0].x - canonical[0].x));
      const dy = Math.max(-MAX_SLIDE_OFFSET, Math.min(MAX_SLIDE_OFFSET, rawPoints[0].y - canonical[0].y));

      if (dx === 0 && dy === 0) {
        // No offset — just snap into place
        onRevealDone(strokes, safetyTimer);
        return;
      }

      const startTime = performance.now();
      const slideTick = (now: number) => {
        if (unmountedRef.current) return;
        const linear = Math.min((now - startTime) / ANIMATION_DURATION, 1);
        const ease = 1 - (1 - linear) ** 4; // easeOutQuart
        const offsetMul = 1 - ease; // fades from full offset → 0

        // Redraw completed + current stroke at offset position
        redrawCompleted(dCtx, strokes, completedRef.current, size);
        dCtx.save();
        dCtx.translate(dx * offsetMul, dy * offsetMul);
        drawSVGPath(dCtx, stroke.path, size, '#3d3d3d');
        dCtx.restore();

        if (linear < 1) {
          animFrameRef.current = requestAnimationFrame(slideTick);
        } else {
          onRevealDone(strokes, safetyTimer);
        }
      };
      animFrameRef.current = requestAnimationFrame(slideTick);
    } else {
      // Fallback: no position data, snap directly
      onRevealDone(strokes, safetyTimer);
    }
  }, [onRevealDone]);

  // Skritter-style traveling dot hint along the stroke median
  const showTravelingDot = useCallback(
    (dCtx: CanvasRenderingContext2D, stroke: StrokeData, size: number) => {
      cancelAnimationFrame(hintDotRafRef.current);

      const pts = transformMedian(stroke.median, size);
      if (pts.length < 2) return;

      // Cumulative arc length for even-speed travel
      const dists: number[] = [0];
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
      }
      const totalLen = dists[dists.length - 1];
      if (totalLen === 0) return;

      const DOT_RADIUS = size * 0.022;
      const DOT_COLOR = 'rgba(90, 75, 55, 0.7)';
      const TRAVEL_DURATION = 1200;
      const PAUSE_AFTER = 400;

      let startTime: number | null = null;
      let phase: 'travel' | 'pause' = 'travel';
      let pauseStart = 0;

      const tick = (now: number) => {
        if (unmountedRef.current) return;
        if (!startTime) startTime = now;
        const elapsed = now - startTime;

        // Find dot position
        let px: number, py: number;
        if (phase === 'travel') {
          const progress = Math.min(elapsed / TRAVEL_DURATION, 1);
          const targetDist = totalLen * progress;
          px = pts[0].x;
          py = pts[0].y;
          for (let i = 1; i < pts.length; i++) {
            if (dists[i] >= targetDist) {
              const segLen = dists[i] - dists[i - 1];
              const t = segLen > 0 ? (targetDist - dists[i - 1]) / segLen : 0;
              px = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
              py = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t;
              break;
            }
            px = pts[i].x;
            py = pts[i].y;
          }
          if (progress >= 1) {
            phase = 'pause';
            pauseStart = now;
          }
        } else {
          px = pts[pts.length - 1].x;
          py = pts[pts.length - 1].y;
          if (now - pauseStart >= PAUSE_AFTER) {
            phase = 'travel';
            startTime = now;
          }
        }

        // Redraw completed strokes + dot
        redrawCompleted(dCtx, strokesRef.current, completedRef.current, size);
        dCtx.save();
        dCtx.beginPath();
        dCtx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
        dCtx.fillStyle = DOT_COLOR;
        dCtx.fill();
        dCtx.restore();

        hintDotRafRef.current = requestAnimationFrame(tick);
      };

      hintDotRafRef.current = requestAnimationFrame(tick);
    },
    []
  );

  // Fade out user stroke in red (shared by onWrong + onOutOfOrder)
  const fadeOutStroke = useCallback(() => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    const inputCtx = inputRef.current?.getContext('2d');
    const points = [...currentInputRef.current];
    const size = sizeRef.current;
    if (inputCtx && points.length > 1) {
      let opacity = 1;
      fadeIntervalRef.current = setInterval(() => {
        if (unmountedRef.current) { clearInterval(fadeIntervalRef.current!); return; }
        opacity -= 0.05;
        inputCtx.clearRect(0, 0, size, size);
        if (opacity > 0) {
          inputCtx.globalAlpha = opacity;
          drawTaperedStroke(inputCtx, points, '#ef4444', size);
          inputCtx.globalAlpha = 1;
        } else {
          clearInterval(fadeIntervalRef.current!);
          fadeIntervalRef.current = null;
          inputCtx.clearRect(0, 0, size, size);
        }
      }, 30);
    }
    currentInputRef.current = [];
  }, []);

  // Handle wrong stroke
  const onWrong = useCallback(() => {
    mistakesRef.current += 1;
    mistakesOnStrokeRef.current += 1;
    fadeOutStroke();

    // Restart guide dot or show traveling dot hint
    if (guideModeRef.current) {
      showGuideDot(completedRef.current);
    } else if (mistakesOnStrokeRef.current >= HINT_MISTAKES_THRESHOLD) {
      const dCtx = displayRef.current?.getContext('2d');
      const strokes = strokesRef.current;
      const idx = completedRef.current;
      if (dCtx && strokes[idx]) {
        showTravelingDot(dCtx, strokes[idx], sizeRef.current);
      }
    }
  }, [fadeOutStroke, showTravelingDot, showGuideDot]);

  // Handle out-of-order stroke: briefly highlight the correct next stroke
  const onOutOfOrder = useCallback(() => {
    mistakesRef.current += 1;
    mistakesOnStrokeRef.current += 1;
    fadeOutStroke();

    if (guideModeRef.current) {
      // In guide mode, just restart the guide dot
      showGuideDot(completedRef.current);
    } else {
      // Highlight the correct next stroke on the display canvas
      const dCtx = displayRef.current?.getContext('2d');
      const strokes = strokesRef.current;
      const idx = completedRef.current;
      const size = sizeRef.current;
      if (dCtx && strokes[idx]) {
        drawSVGPath(dCtx, strokes[idx].path, size, '#3b82f6', 0.5);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          if (!unmountedRef.current) {
            redrawCompleted(dCtx, strokes, completedRef.current, size);
          }
          highlightTimerRef.current = null;
        }, 800);
      }
    }
  }, [fadeOutStroke, showGuideDot]);

  // Pointer events
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (animatingRef.current || completedRef.current >= strokesRef.current.length) return;

    // Kill any running wrong-stroke fade so it doesn't erase our new drawing
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    // Cancel any traveling dot hint animation
    cancelAnimationFrame(hintDotRafRef.current);
    // Cancel any out-of-order highlight and restore display
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
      const dCtx = displayRef.current?.getContext('2d');
      if (dCtx) redrawCompleted(dCtx, strokesRef.current, completedRef.current, sizeRef.current);
    }
    // Clear input canvas for fresh start
    const inputCtx = inputRef.current?.getContext('2d');
    if (inputCtx) inputCtx.clearRect(0, 0, sizeRef.current, sizeRef.current);

    // Capture pointer so we get all events even if finger/cursor leaves canvas bounds
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* optional */ }

    isDrawingRef.current = true;
    const rect = inputRef.current!.getBoundingClientRect();
    currentInputRef.current = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
    isDirtyRef.current = true;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    currentInputRef.current.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    isDirtyRef.current = true;
  }, []);

  // Unified stroke-end: grade or discard. Used by pointerup, pointerleave, pointercancel.
  const handleStrokeEnd = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (animatingRef.current) return;

    if (currentInputRef.current.length < 2) {
      // Too short — just clear the dot
      const inputCtx = inputRef.current?.getContext('2d');
      if (inputCtx) inputCtx.clearRect(0, 0, sizeRef.current, sizeRef.current);
      currentInputRef.current = [];
      return;
    }

    const smoothed = smoothPoints(currentInputRef.current);
    const idx = completedRef.current;
    const strokes = strokesRef.current;
    if (idx >= strokes.length) return;

    if (gradeStroke(smoothed, strokes[idx].median, sizeRef.current)) {
      onCorrect();
    } else {
      // Check if it matches any later stroke (out-of-order)
      let outOfOrder = false;
      for (let i = idx + 1; i < strokes.length; i++) {
        if (gradeStroke(smoothed, strokes[i].median, sizeRef.current)) {
          outOfOrder = true;
          break;
        }
      }
      if (outOfOrder) {
        onOutOfOrder();
      } else {
        onWrong();
      }
    }
  }, [onCorrect, onWrong, onOutOfOrder]);

  // Show button: enter guide mode — dot shows path for current stroke, user draws it
  useEffect(() => {
    if (!revealAll || revealAll === lastRevealRef.current || loading || loadError || animatingRef.current) return;
    lastRevealRef.current = revealAll;
    const strokes = strokesRef.current;
    const idx = completedRef.current;
    if (idx >= strokes.length) return;

    // Cancel all active animations/timers
    cancelAnimationFrame(hintDotRafRef.current);
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    // Clear input canvas
    const inputCtx = inputRef.current?.getContext('2d');
    if (inputCtx) inputCtx.clearRect(0, 0, sizeRef.current, sizeRef.current);
    currentInputRef.current = [];

    // Enter guide mode + penalty
    guideModeRef.current = true;
    mistakesRef.current += 1;
    mistakesOnStrokeRef.current = 0;

    // Show guide dot for current stroke — user must draw it
    showGuideDot(idx);
  }, [revealAll, loading, loadError, showGuideDot]);

  // Stroke counter text
  const strokeCount = strokesRef.current.length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>...</div>;
  }

  if (loadError) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#dc2626' }}>
        {lang === 'ru' ? 'Не удалось загрузить' : "Yuklab bo'lmadi"}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: canvasSize, height: canvasSize }}>
      <canvas
        ref={bgRef}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, backgroundColor: '#fff', width: canvasSize, height: canvasSize }}
      />
      <canvas
        ref={displayRef}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, width: canvasSize, height: canvasSize }}
      />
      <canvas
        ref={inputRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 2,
          cursor: 'crosshair',
          touchAction: 'none',
          width: canvasSize,
          height: canvasSize,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={handleStrokeEnd}
        onPointerCancel={handleStrokeEnd}
        onLostPointerCapture={handleStrokeEnd}
      />
      {/* Stroke counter */}
      {strokeCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            zIndex: 3,
            fontSize: 13,
            fontWeight: 600,
            color: '#b0a898',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {completedCount}/{strokeCount}
        </div>
      )}
    </div>
  );
}
