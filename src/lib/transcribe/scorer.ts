import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ScoreResult = {
  result: 'correct' | 'close' | 'wrong';
  feedback: string;
};

const PUNCTUATION_RE = /[。？！，、""''「」《》\s\d]/g;

// Homophones Whisper confuses: 他/她/它 all sound like "tā"
// Normalize to a single form so they don't count as wrong substitutions
const HOMOPHONES: Record<string, string> = { '她': '他', '它': '他' };

function normalize(str: string): string {
  return str
    .trim()
    .replace(PUNCTUATION_RE, '')
    .toLowerCase()
    .split('')
    .map((c) => HOMOPHONES[c] ?? c)
    .join('');
}

// Characters where any substitution always changes meaning — never skip to AI
const CRITICAL_CHARS = new Set('我你他她它这那有没不是很都也吗呢吧啊');

function hasCriticalSubstitution(normExp: string, normHeard: string): boolean {
  const expSet = new Set(normExp);
  const heardSet = new Set(normHeard);
  for (const c of expSet) if (!heardSet.has(c) && CRITICAL_CHARS.has(c)) return true;
  for (const c of heardSet) if (!expSet.has(c) && CRITICAL_CHARS.has(c)) return true;
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

/**
 * Score a transcribed answer against the expected Chinese text.
 *
 * Thresholds:
 *   Short (≤4 chars):  exact → correct, else → GPT judge
 *   Normal (5–8):      dist 0–1 → correct, 2–4 → GPT, 5+ → wrong
 *   Long (9+):         dist 0–1 → correct, 2–4 → GPT, 5+ → wrong
 */
export async function scoreAnswer(
  expected: string,
  heard: string,
  language: string,
): Promise<ScoreResult> {
  const normExp = normalize(expected);
  const normHeard = normalize(heard);
  const dist = levenshtein(normExp, normHeard);
  const len = normExp.length;

  // --- Exact match ---
  if (dist === 0) {
    return { result: 'correct', feedback: '' };
  }

  // --- Superset match: heard contains the full expected answer ---
  // e.g. user said 我在减肥 when expected is 减肥 (added context to help Whisper)
  if (normExp.length >= 2 && normHeard.includes(normExp)) {
    return { result: 'correct', feedback: '' };
  }

  // --- Short sentence (≤4 chars): any difference → ask AI ---
  if (len <= 4) {
    return aiJudgeWithFallback(expected, heard, language, dist);
  }

  // --- Critical char substitution → always wrong, no AI ---
  if (hasCriticalSubstitution(normExp, normHeard)) {
    return { result: 'wrong', feedback: '' };
  }

  // --- Normal (5–8) and Long (9+) ---
  if (dist <= 1) {
    return { result: 'correct', feedback: '' };
  }
  if (dist >= 5) {
    return { result: 'wrong', feedback: '' };
  }
  // dist 2–4 → borderline → GPT judge
  return aiJudgeWithFallback(expected, heard, language, dist);
}

async function aiJudgeWithFallback(
  expected: string,
  heard: string,
  language: string,
  dist: number,
): Promise<ScoreResult> {
  try {
    return await aiJudge(expected, heard, language);
  } catch (err) {
    console.warn('[scorer] GPT-4o mini failed, using Levenshtein fallback:', (err as Error).message);
    // Fallback: dist 1 → close, dist 2+ → wrong
    return {
      result: dist <= 1 ? 'close' : 'wrong',
      feedback: '',
    };
  }
}

async function aiJudge(
  expected: string,
  heard: string,
  language: string,
): Promise<ScoreResult> {
  const langLabel = language === 'ru' ? 'Russian' : language === 'en' ? 'English' : 'Uzbek';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 80,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'You are grading a Chinese language learner\'s spoken answer. Reply with JSON only.',
      },
      {
        role: 'user',
        content: [
          `Expected: "${expected}"`,
          `Learner said: "${heard}"`,
          'Is the learner\'s answer correct, close, or wrong?',
          'Mark CORRECT if: exact match, OR the learner said the expected phrase plus extra context words (e.g. said 我在减肥 when expected is 减肥).',
          'Mark CLOSE if: a tone-only mistake (e.g. 那→拿, same sound different tone), or minor Whisper noise where intended meaning is clear.',
          'Mark WRONG if: a substitution that clearly changes meaning (e.g. 我→你, 不→没, 是→不是, negation or pronoun swap).',
          'Feedback rules: always name the specific Chinese character that is missing or wrong.',
          `IMPORTANT: feedback MUST be in ${langLabel} language only, not in any other language.`,
          language === 'uz'
            ? 'Uzbek feedback MUST use Latin script (NOT Cyrillic). Examples: "\'喝\' so\'zi tushib qolgan", "\'我\' o\'rniga \'你\' deyilgan", "to\'g\'ri aytildi".'
            : language === 'ru'
            ? 'Russian feedback examples: "пропущен иероглиф \'喝\'", "вместо \'我\' сказано \'你\'", "произнесено правильно".'
            : 'English feedback examples: "missing \'喝\'", "said \'你\' instead of \'我\'", "pronounced correctly".',
          `{"result": "correct" | "close" | "wrong", "feedback": "one short ${langLabel} sentence, max 8 words"}`,
        ].join('\n'),
      },
    ],
  });

  const text = completion.choices?.[0]?.message?.content ?? '';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
      result?: string;
      feedback?: string;
    };
    const result = parsed.result === 'correct' || parsed.result === 'close' ? parsed.result : 'wrong';
    return { result, feedback: parsed.feedback ?? '' };
  } catch {
    return { result: 'wrong', feedback: '' };
  }
}

export { levenshtein, normalize };
