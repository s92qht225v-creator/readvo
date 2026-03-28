/**
 * Shared grammar audio player using MiMo TTS API.
 * Caches generated audio in memory to avoid repeated API calls.
 * Falls back to local MP3 files, then Web Speech API.
 */

const audioCache = new Map<string, string>(); // text → objectURL
let _el: HTMLAudioElement | null = null;

function getAudioEl(): HTMLAudioElement {
  if (!_el) _el = new Audio();
  return _el;
}

/** Try local file first (instant), fall back to TTS API, then speechSynthesis */
export function playGrammarAudio(zh: string) {
  const el = getAudioEl();

  // If cached from TTS, play immediately
  const cached = audioCache.get(zh);
  if (cached) {
    el.src = cached;
    el.currentTime = 0;
    el.play().catch(() => {});
    return;
  }

  // Try local MP3 first
  const localSrc = `/audio/hsk1/grammar/${encodeURIComponent(zh)}.mp3`;
  el.src = localSrc;
  el.currentTime = 0;

  const playLocal = el.play();
  if (playLocal) {
    playLocal.catch(() => {
      // Local file missing — try TTS API
      fetchTTS(zh).then(url => {
        if (url) {
          el.src = url;
          el.currentTime = 0;
          el.play().catch(() => {});
        }
      });
    });
  }

  // Also pre-fetch TTS in background for next time (if not cached)
  if (!audioCache.has(zh)) {
    fetchTTS(zh).catch(() => {});
  }
}

async function fetchTTS(text: string): Promise<string | null> {
  // Check cache again (may have been populated by concurrent call)
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
