/**
 * Unified analytics — fires events to Meta Pixel, Yandex Metrica, and GA4.
 * Safe to call even if any SDK is not loaded.
 */

type EventParams = Record<string, string | number | boolean>;

const YM_ID = 107194604;

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: EventParams) => void;
    ym?: (id: number, action: string, goal?: string) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track an event across all 3 platforms.
 *
 * @param meta   - Meta Pixel event name (e.g. 'ViewContent', 'CompleteRegistration')
 * @param yandex - Yandex Metrica goal name (e.g. 'lesson_view', 'registration')
 * @param ga     - GA4 event name (e.g. 'lesson_view', 'sign_up')
 * @param params - Extra params passed to Meta Pixel and GA4 (Yandex goals don't support params)
 */
export function trackAll(
  meta: string | null,
  yandex: string | null,
  ga: string | null,
  params?: EventParams,
) {
  if (typeof window === 'undefined') return;

  // Meta Pixel
  if (meta && window.fbq) {
    window.fbq('track', meta, params);
  }

  // Yandex Metrica
  if (yandex && window.ym) {
    window.ym(YM_ID, 'reachGoal', yandex);
  }

  // Google Analytics 4
  if (ga && window.gtag) {
    window.gtag('event', ga, params);
  }
}

/** Convenience: Meta Pixel only (kept for backward compat with MetaPageView) */
export function trackEvent(event: string, params?: EventParams) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}
