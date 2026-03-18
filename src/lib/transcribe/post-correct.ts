import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Post-correction pass: given what the learner was supposed to say (expected)
 * and what the STT heard (heard), ask GPT-4o mini to fix homophone errors.
 *
 * This catches cases where the learner said the right thing but STT picked
 * the wrong characters (e.g. 封斋 → 风寨, same sound different chars).
 *
 * Returns the corrected Chinese string, or the original if no correction needed.
 */
export async function postCorrect(expected: string, heard: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 60,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: [
          'You are a Chinese speech recognition post-processor.',
          'A learner was supposed to say the Expected sentence.',
          'The STT system heard the Heard sentence.',
          'Chinese has many homophones — characters that sound the same but are written differently.',
          'If the Heard sentence contains homophone errors (wrong characters that sound the same as the expected ones), fix them.',
          'If the learner clearly said something different (not a homophone issue), return the Heard sentence unchanged.',
          'Reply with ONLY the corrected Chinese text, nothing else. No quotes, no explanation.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Expected: ${expected}\nHeard: ${heard}`,
      },
    ],
  });

  const text = (completion.choices?.[0]?.message?.content ?? '').trim();
  // Safety: if the LLM returned something weird (empty, too long, or non-Chinese), ignore it
  if (!text || text.length > heard.length * 2 || !/[\u4e00-\u9fff]/.test(text)) {
    return heard;
  }
  return text;
}
