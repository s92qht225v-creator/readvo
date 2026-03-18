const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';
const GROQ_TIMEOUT_MS = 3000;
const PROMPT = '用简体中文输出。';

export type WhisperResult = {
  text: string;
  source: 'groq' | 'openai';
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
    const text = await callGroq(audioBuffer, fileName, mimeType);
    return { text, source: 'groq' };
  } catch (err) {
    console.warn('[whisper] Groq failed, falling back to OpenAI:', (err as Error).message);
  }

  // --- Fallback: OpenAI ---
  const text = await callOpenAI(audioBuffer, fileName, mimeType);
  return { text, source: 'openai' };
}

function buildFormData(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  model: string,
): FormData {
  const blob = new Blob([audioBuffer], { type: mimeType });
  const fd = new FormData();
  fd.append('file', blob, fileName);
  fd.append('model', model);
  fd.append('language', 'zh');
  fd.append('prompt', PROMPT);
  return fd;
}

async function callGroq(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const fd = buildFormData(audioBuffer, fileName, mimeType, 'whisper-large-v3-turbo');
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

    const json = await res.json() as { text?: string };
    return (json.text ?? '').trim();
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
