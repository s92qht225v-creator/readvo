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

async function aiJudge(expected: string, heard: string, language: string): Promise<{ result: string; feedback: string }> {
  const langLabel = language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek';
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 80,
    temperature: 0,
    messages: [
      { role: 'system', content: 'You are grading a Chinese language learner\'s spoken answer. Reply with JSON only.' },
      { role: 'user', content: `Expected: "${expected}"\nLearner said: "${heard}"\nIs the learner's answer correct, close (minor error but meaning preserved), or wrong?\nConsider: synonyms, valid paraphrases, word order variations, and Whisper transcription noise.\n{"result": "correct" | "close" | "wrong", "feedback": "one short ${langLabel} sentence explaining why, max 8 words"}` },
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

      if (dist <= 1) {
        result = 'correct';
      } else if (dist >= 5 || len <= 7) {
        // short sentences (≤7 chars) require near-exact match
        result = 'wrong';
      } else {
        // borderline (dist 2–4, longer sentences) — ask AI
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
