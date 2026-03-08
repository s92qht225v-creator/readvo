/** Meta Pixel (fbq) helper — safe to call even if pixel is not loaded */

type FbqParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: FbqParams) => void;
  }
}

export function trackEvent(event: string, params?: FbqParams) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}
