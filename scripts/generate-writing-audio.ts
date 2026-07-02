/**
 * One-time script to pre-generate TTS audio for writing practice characters
 * and upload to Supabase Storage at the paths the writing cards expect.
 *
 * Uses Google Cloud TTS (cmn-CN neural voice), NOT MiMo: MiMo v2.5 cannot
 * reliably synthesize ISOLATED single characters — it hallucinates random
 * cross-language words for lone particles (的/是/不/她…). Google's cmn-CN
 * voices read single characters deterministically with correct tones. (MiMo is
 * fine for full sentences, which is why /api/tts still uses it.)
 *
 * Usage: npx tsx scripts/generate-writing-audio.ts
 *
 * Requires env vars: GOOGLE_TTS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'audio';
const WRITING_PREFIX = 'HSK 1/Writing';
// Female cmn-CN neural voice; verified 10/10 on set-1 chars via homophone-biased
// Whisper. speakingRate 0.85 = a touch slower for learners.
const VOICE = 'cmn-CN-Wavenet-A';
const SPEAKING_RATE = 0.85;

if (!GOOGLE_TTS_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars: GOOGLE_TTS_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Same logic as getWritingAudioUrl in the app */
function audioFileName(char: string, pinyin: string): string {
  const first = pinyin.split(' / ')[0];
  const stripped = first
    .replace(/[ǖǘǚǜü]/gi, 'v')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s']/g, '')
    .toLowerCase();
  const unicode = Array.from(char).map(c => c.codePointAt(0)).join('');
  return `${stripped}_${unicode}.mp3`;
}

async function generateTTS(text: string): Promise<Buffer | null> {
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'cmn-CN', name: VOICE },
          audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
        }),
      },
    );

    if (!res.ok) {
      console.error(`  TTS API error ${res.status} for "${text}": ${await res.text().catch(() => '')}`);
      return null;
    }

    const data = await res.json();
    const audioBase64 = data.audioContent;
    if (!audioBase64) {
      console.error(`  No audio data for "${text}"`);
      return null;
    }

    return Buffer.from(audioBase64, 'base64');
  } catch (err) {
    console.error(`  TTS fetch error for "${text}":`, err);
    return null;
  }
}

// HSK 2.0 Level 1, Set 1
const SET_WORDS = [
  { char: '我', pinyin: 'wǒ' },
  { char: '你', pinyin: 'nǐ' },
  { char: '他', pinyin: 'tā' },
  { char: '的', pinyin: 'de' },
  { char: '是', pinyin: 'shì' },
  { char: '不', pinyin: 'bù' },
  { char: '吗', pinyin: 'ma' },
  { char: '她', pinyin: 'tā' },
  { char: '什么', pinyin: 'shénme' },
  { char: '这', pinyin: 'zhè' },
];

async function main() {
  console.log(`Generating audio for ${SET_WORDS.length} words...\n`);

  for (const word of SET_WORDS) {
    const fileName = audioFileName(word.char, word.pinyin);
    const path = `${WRITING_PREFIX}/${fileName}`;

    process.stdout.write(`${word.char} (${word.pinyin}) → ${fileName} ... `);

    // Generate (force overwrite)
    const audio = await generateTTS(word.char);
    if (!audio) {
      console.log('FAILED');
      continue;
    }

    // Upload
    const { error } = await supabase.storage.from(BUCKET).upload(path, audio, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

    if (error) {
      console.log(`UPLOAD ERROR: ${error.message}`);
    } else {
      console.log(`OK (${(audio.length / 1024).toFixed(1)} KB)`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone!');
}

main();
