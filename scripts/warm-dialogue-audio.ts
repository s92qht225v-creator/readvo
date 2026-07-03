/**
 * Pre-warm MiMo TTS for a dialogue's lines (per-speaker voices), mirroring
 * /api/tts exactly so the cache paths match what the reader fetches.
 * Overwrites (upsert) so re-running REGENERATES a fresh take.
 *
 * Usage:
 *   npx tsx scripts/warm-dialogue-audio.ts content/dialogues/hsk2/dialogue24.json
 *   # optional: only (re)warm lines containing any of these substrings
 *   npx tsx scripts/warm-dialogue-audio.ts <file.json> "写，但是" "我在学英语"
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import crypto from 'crypto';
config({ path: '.env.local' });

const MIMO = process.env.MIMO_API_KEY!;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const BUCKET = 'audio';
const DEFAULT_INSTRUCTION = '请用适当放慢、清晰的语速朗读，适合语言学习者。';
const DIALOGUE_VOICE: Record<string, string> = { A: '茉莉', B: '白桦', C: '苏打' };
const VOICE_SLUG: Record<string, string> = { '冰糖': 'bingtang', '茉莉': 'moli', '苏打': 'suda', '白桦': 'baihua' };

function storagePath(text: string, voice?: string): string {
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return voice && VOICE_SLUG[voice] ? `tts/grammar/${VOICE_SLUG[voice]}/${hex}.wav` : `tts/grammar/${hex}.wav`;
}

async function gen(text: string, voice?: string): Promise<Buffer | null> {
  const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST', headers: { 'api-key': MIMO, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mimo-v2.5-tts',
      messages: [{ role: 'user', content: DEFAULT_INSTRUCTION }, { role: 'assistant', content: text }],
      audio: { format: 'wav', voice: voice || 'mimo_default' },
    }),
  });
  if (!res.ok) { console.error(`  gen ${res.status} for "${text}"`); return null; }
  const b64 = (await res.json()).choices?.[0]?.message?.audio?.data;
  return b64 ? Buffer.from(b64, 'base64') : null;
}

const OPENAI = process.env.OPENAI_API_KEY;
const norm = (s: string) => s.replace(/[。，、！？.?\s!,]/g, '');
/** Transcribe a clip; used to reject MiMo hallucinations (it sometimes appends
 *  an extra sentence to short lines → the take runs much longer than the text). */
async function heard(buf: Buffer): Promise<string> {
  if (!OPENAI) return '';
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array(buf)], { type: 'audio/wav' }), 'a.wav');
  fd.append('model', 'gpt-4o-transcribe');
  fd.append('language', 'zh');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${OPENAI}` }, body: fd });
  if (!res.ok) return '';
  return ((await res.json()).text ?? '').trim();
}
/** Generate + verify, retrying MiMo up to `tries` times until the transcript
 *  isn't padded with hallucinated extra content (length guard survives trad↔simp). */
async function genVerified(text: string, voice?: string, tries = 5): Promise<Buffer | null> {
  const want = norm(text);
  let last: Buffer | null = null;
  for (let i = 0; i < tries; i++) {
    const buf = await gen(text, voice);
    if (!buf) continue;
    last = buf;
    if (!OPENAI) return buf;
    const h = norm(await heard(buf));
    if (h.length <= want.length + 2) return buf; // no hallucinated tail
    process.stdout.write(`[reject:+${h.length - want.length}ch] `);
    await new Promise((r) => setTimeout(r, 300));
  }
  return last; // best effort
}

async function main() {
  const file = process.argv[2];
  const d = JSON.parse(readFileSync(file, 'utf-8'));
  let sentences = d.sections.flatMap((s: { sentences: { text_original: string; speaker?: string }[] }) => s.sentences);
  const filters = process.argv.slice(3);
  if (filters.length) sentences = sentences.filter((s: { text_original?: string }) => filters.some((f) => (s.text_original || '').includes(f)));
  const override = d.voices as Record<string, string> | undefined;
  console.log(`Warming ${sentences.length} lines from ${file}${filters.length ? ` (filtered: ${filters.join(', ')})` : ''}\n`);
  for (const s of sentences) {
    const voice = s.speaker ? (override?.[s.speaker] || DIALOGUE_VOICE[s.speaker]) : undefined;
    const text = (s.text_original || '').trim();
    if (!text) continue;
    process.stdout.write(`[${s.speaker}/${voice}] ${text} ... `);
    const buf = await genVerified(text, voice);
    if (!buf) { console.log('FAIL'); continue; }
    const path = storagePath(text, voice);
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: 'audio/wav', upsert: true });
    console.log(error ? `UPLOAD ERR ${error.message}` : `OK (${(buf.length / 1024).toFixed(0)}KB)`);
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log('\nDone.');
}
main();
