/**
 * Shared TTS audio player using MiMo TTS API + Supabase cache.
 * Flow: memory cache → Supabase (via API) → MiMo TTS → Web Speech API.
 * Generated audio is saved to Supabase so it's only generated once per phrase.
 */

const audioCache = new Map<string, string>(); // text → playable URL
let _el: HTMLAudioElement | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!_el) _el = new Audio();
  return _el;
}

/** Play grammar audio (stored under tts/grammar/) */
export function playGrammarAudio(zh: string) {
  playTTSAudio(zh, 'tts/grammar');
}

/** Play writing audio (stored under tts/writing/) */
export function playWritingAudio(zh: string) {
  playTTSAudio(zh, 'tts/writing');
}

/** Generic TTS player with configurable storage prefix */
export function playTTSAudio(zh: string, prefix: string = 'tts/grammar') {
  const cacheKey = `${prefix}:${zh}`;
  const el = getAudioEl();

  // If cached in memory, play immediately
  const cached = audioCache.get(cacheKey);
  if (cached) {
    el.src = cached;
    el.currentTime = 0;
    el.play().catch(() => {});
    return;
  }

  // Fetch from API (checks Supabase cache, generates if needed)
  fetchTTS(zh, prefix).then(url => {
    if (url) {
      el.src = url;
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  });
}

/**
 * Fetch TTS URL (generate-on-demand). Returns a playable URL or null.
 * Used by components that need the URL (e.g. WritingTest with its own Audio element).
 */
export async function fetchWritingAudioUrl(text: string): Promise<string | null> {
  return fetchTTS(text, 'tts/writing');
}

async function fetchTTS(text: string, prefix: string): Promise<string | null> {
  const cacheKey = `${prefix}:${text}`;
  if (audioCache.has(cacheKey)) return audioCache.get(cacheKey)!;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, prefix }),
    });

    if (!res.ok) return fallbackSpeech(text);

    const data = await res.json();

    // API returns { url } if cached in Supabase, or { audio } as base64 fallback
    if (data.url) {
      audioCache.set(cacheKey, data.url);
      return data.url;
    }

    if (data.audio) {
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      audioCache.set(cacheKey, url);
      return url;
    }

    return fallbackSpeech(text);
  } catch {
    return fallbackSpeech(text);
  }
}

function fallbackSpeech(text: string): null {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  return null;
}
