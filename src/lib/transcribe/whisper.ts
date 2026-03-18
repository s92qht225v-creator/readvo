const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';
const GROQ_TIMEOUT_MS = 3000;
const BASE_PROMPT = '用简体中文输出。';

export type WhisperResult = {
  text: string;
  source: 'gpt4o' | 'groq';
  noSpeechProb: number; // avg no_speech_prob from Groq verbose_json; 0 for GPT-4o
};

/**
 * Build a context-aware prompt from the expected answer.
 * Extracts unique Chinese characters and appends them as vocabulary hints
 * so the STT model is biased toward the right homophones.
 */
function buildPrompt(expected?: string): string {
  if (!expected) return BASE_PROMPT;
  // Extract unique Chinese characters from expected answer
  const chars = [...new Set(expected.replace(/[^\u4e00-\u9fff]/g, ''))];
  if (chars.length === 0) return BASE_PROMPT;
  return `${BASE_PROMPT}上下文词汇：${chars.join('、')}`;
}

/**
 * Transcribe audio via GPT-4o Transcribe (primary) with Groq fallback.
 * Accepts raw ArrayBuffer — rebuilds FormData for each provider
 * so the same body is never reused across fetch calls.
 *
 * @param expected — the expected Chinese answer, used to build context-aware prompt (improvement A)
 */
export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  expected?: string,
): Promise<WhisperResult> {
  const prompt = buildPrompt(expected);

  // --- Primary: GPT-4o Transcribe (best accuracy) ---
  try {
    const text = await callGpt4oTranscribe(audioBuffer, fileName, mimeType, prompt);
    return { text, source: 'gpt4o', noSpeechProb: 0 };
  } catch (err) {
    console.warn('[whisper] GPT-4o Transcribe failed, falling back to Groq:', (err as Error).message);
  }

  // --- Fallback: Groq whisper-large-v3 (free, fast) ---
  try {
    const groq = await callGroq(audioBuffer, fileName, mimeType, prompt);
    return { text: groq.text, source: 'groq', noSpeechProb: groq.noSpeechProb };
  } catch (err) {
    console.error('[whisper] Groq also failed:', (err as Error).message);
    throw new Error('All transcription providers failed');
  }
}

function buildFormData(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  model: string,
  prompt: string,
  responseFormat: 'json' | 'verbose_json' = 'json',
): FormData {
  const blob = new Blob([audioBuffer], { type: mimeType });
  const fd = new FormData();
  fd.append('file', blob, fileName);
  fd.append('model', model);
  fd.append('language', 'zh');
  fd.append('prompt', prompt);
  fd.append('response_format', responseFormat);
  return fd;
}

async function callGpt4oTranscribe(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  prompt: string,
): Promise<string> {
  const fd = buildFormData(audioBuffer, fileName, mimeType, 'gpt-4o-transcribe', prompt);
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: fd,
  });

  if (!res.ok) {
    throw new Error(`GPT-4o Transcribe HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json() as { text?: string };
  return (json.text ?? '').trim();
}

async function callGroq(
  audioBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  prompt: string,
): Promise<{ text: string; noSpeechProb: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const fd = buildFormData(audioBuffer, fileName, mimeType, 'whisper-large-v3', prompt, 'verbose_json');
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
