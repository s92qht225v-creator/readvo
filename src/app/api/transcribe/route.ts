import Groq from 'groq-sdk';
import OpenAI from 'openai';

const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });
const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizeChinese(str: string): string {
  return str.trim().replace(/[。？！，、""''「」《》\s\d]/g, '').toLowerCase();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Characters where substitution always changes meaning — never allow 'close'
const CRITICAL_CHARS = new Set('我你他她它这那有没不是很都也')

function hasCriticalSubstitution(expected: string, heard: string): boolean {
  // Quick check: if any char present in one but not the other is a critical char
  const expSet  = new Set(expected);
  const heardSet = new Set(heard);
  for (const c of expSet)   if (!heardSet.has(c) && CRITICAL_CHARS.has(c)) return true;
  for (const c of heardSet) if (!expSet.has(c)   && CRITICAL_CHARS.has(c)) return true;
  return false;
}

async function aiJudge(expected: string, heard: string, language: string): Promise<{ result: string; feedback: string }> {
  const langLabel = language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek';
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 80,
    temperature: 0,
    messages: [
      { role: 'system', content: 'You are grading a Chinese language learner\'s spoken answer. Reply with JSON only.' },
      { role: 'user', content: `Expected: "${expected}"\nLearner said: "${heard}"\nIs the learner's answer correct, close (minor Whisper noise or tone mark only), or wrong?\nRules: any substitution that changes meaning (e.g. 我→你, 不→没, pronoun or negation swap) is WRONG, not close. Only mark 'close' for clear speech-recognition noise where meaning is identical.\n{"result": "correct" | "close" | "wrong", "feedback": "one short ${langLabel} sentence explaining why, max 8 words"}` },
    ],
  });
  const text = completion.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { result: 'wrong', feedback: '' };
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio    = formData.get('audio');
    const expected = typeof formData.get('expected') === 'string' ? formData.get('expected') as string : '';
    const language = typeof formData.get('language') === 'string' ? formData.get('language') as string : 'uz';

    if (!audio || !(audio instanceof Blob)) {
      return Response.json({ error: 'No audio file' }, { status: 400 });
    }

    const prompt = expected ? `简体中文。${expected}` : '简体中文';
    const transcription = await groq.audio.transcriptions.create({
      file: audio as File,
      model: 'whisper-large-v3',
      language: 'zh',
      response_format: 'text',
      prompt,
    });

    const heard = (transcription as unknown as string).trim().replace(/\d+/g, '').trim();

    let result: string | null = null;
    let feedback = '';

    if (expected) {
      const normExp  = normalizeChinese(expected);
      const normHeard = normalizeChinese(heard);
      const dist = levenshtein(normExp, normHeard);
      const len  = normExp.length;

      if (dist === 0) {
        result = 'correct';
      } else if (dist >= 5 || (len <= 6 && dist >= 2)) {
        // clearly wrong: too many edits, or very short sentence with 2+ edits
        result = 'wrong';
      } else if (hasCriticalSubstitution(normExp, normHeard)) {
        // pronoun / negation / demonstrative swapped — always wrong regardless of AI
        result = 'wrong';
        feedback = '';
      } else {
        // everything else — ask AI
        const ai = await aiJudge(expected, heard, language);
        result   = ai.result;
        feedback = ai.feedback ?? '';
      }
    }

    return Response.json({ text: heard, result, feedback });
  } catch (err) {
    console.error('Groq Whisper error:', err);
    return Response.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
