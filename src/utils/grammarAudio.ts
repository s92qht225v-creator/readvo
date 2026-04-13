/**
 * Shared grammar audio player using MiMo TTS API + Supabase cache.
 * Flow: memory cache → Supabase (via API) → MiMo TTS → Web Speech API.
 * Generated audio is saved to Supabase so it's only generated once per phrase.
 */

const audioCache = new Map<string, string>(); // text → playable URL
let _el: HTMLAudioElement | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!_el) _el = new Audio();
  return _el;
}

export function playGrammarAudio(zh: string) {
  const el = getAudioEl();

  // If cached in memory, play immediately
  const cached = audioCache.get(zh);
  if (cached) {
    el.src = cached;
    el.currentTime = 0;
    el.play().catch(() => {});
    return;
  }

  // Fetch from API (checks Supabase cache, generates if needed)
  fetchTTS(zh).then(url => {
    if (url) {
      el.src = url;
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  });
}

async function fetchTTS(text: string): Promise<string | null> {
  if (audioCache.has(text)) return audioCache.get(text)!;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return fallbackSpeech(text);

    const data = await res.json();

    // API returns { url } if cached in Supabase, or { audio } as base64 fallback
    if (data.url) {
      audioCache.set(text, data.url);
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
      audioCache.set(text, url);
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
