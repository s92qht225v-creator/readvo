/**
 * Shared grammar audio player using MiMo TTS API.
 * Caches generated audio in memory to avoid repeated API calls.
 * Falls back to Web Speech API if TTS API is unavailable.
 */

const audioCache = new Map<string, string>(); // text → objectURL
let _el: HTMLAudioElement | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!_el) _el = new Audio();
  return _el;
}

export function playGrammarAudio(zh: string) {
  const el = getAudioEl();

  // If cached, play immediately
  const cached = audioCache.get(zh);
  if (cached) {
    el.src = cached;
    el.currentTime = 0;
    el.play().catch(() => {});
    return;
  }

  // Fetch from TTS API
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

    const { audio } = await res.json();
    if (!audio) return fallbackSpeech(text);

    // Decode base64 WAV → blob URL
    const binary = atob(audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    audioCache.set(text, url);
    return url;
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
