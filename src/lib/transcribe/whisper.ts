const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';
const GROQ_TIMEOUT_MS = 3000;
const PROMPT = '用简体中文输出。';

export type WhisperResult = {
  text: string;
  source: 'groq' | 'openai';
  noSpeechProb: number; // avg no_speech_prob from Groq verbose_json; 0 for OpenAI
};

/**
 * Transcribe audio via Groq (primary) with OpenAI fallback.
 * Accepts raw ArrayBuffer — rebuilds FormData for each provider
 * so the same body is never reused across fetch calls.
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<WhisperResult> {
  // --- Try Groq first ---
  try {
    const groq = await callGroq(audioBuffer, fileName, mimeType);
    return { text: groq.text, source: 'groq', noSpeechProb: groq.noSpeechProb };
  } catch (err) {
    console.warn('[whisper] Groq failed, falling back to OpenAI:', (err as Error).message);
  }

  // --- Fallback: OpenAI (plain JSON, no no_speech_prob) ---
  const text = await callOpenAI(audioBuffer, fileName, mimeType);
  return { text, source: 'openai', noSpeechProb: 0 };
}

function buildFormData(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  model: string,
  responseFormat: 'json' | 'verbose_json' = 'json',
): FormData {
  const blob = new Blob([audioBuffer], { type: mimeType });
  const fd = new FormData();
  fd.append('file', blob, fileName);
  fd.append('model', model);
  fd.append('language', 'zh');
  fd.append('prompt', PROMPT);
  fd.append('response_format', responseFormat);
  return fd;
}

async function callGroq(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<{ text: string; noSpeechProb: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const fd = buildFormData(audioBuffer, fileName, mimeType, 'whisper-large-v3-turbo', 'verbose_json');
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: fd,
      signal: controller.signal,
    });

    if (res.status === 429 || res.status >= 500) {
      throw new Error(`Groq HTTP ${res.status}`);
    }
    if (!res.ok) {
      throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    }

    const json = await res.json() as { text?: string; segments?: { no_speech_prob?: number }[] };
    const text = (json.text ?? '').trim();
    const segments = json.segments ?? [];
    const noSpeechProb = segments.length > 0
      ? segments.reduce((sum, s) => sum + (s.no_speech_prob ?? 0), 0) / segments.length
      : 0;
    return { text, noSpeechProb };
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const fd = buildFormData(audioBuffer, fileName, mimeType, 'whisper-1');
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: fd,
  });

  if (!res.ok) {
    throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json() as { text?: string };
  return (json.text ?? '').trim();
}
