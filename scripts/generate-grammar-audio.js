// scripts/generate-grammar-audio.js
// Generates TTS audio for all HSK1 grammar lesson example sentences.
// Run once: node scripts/generate-grammar-audio.js
// Skips files that already exist — safe to re-run when new lessons are added.
//
// Requires: OPENAI_API_KEY in .env.local
// Install:  npm install openai dotenv
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUTPUT_DIR = "./public/audio/hsk1/grammar";
// ─── All example sentences from HSK1 grammar lessons ────────
const sentences = [
  // 是 (shì)
  "我是学生。",
  "她是老师。",
  "我是中国人。",
  "他是我的朋友。",
  "这是书。",
  "你是学生吗？",
  "我不是医生。",
  "我们是同学。",
  "不是，我是乌兹别克人。",
  "这是你的书吗？",
  "那是我朋友的书。",
  "是的，我是学生。",
  "我不是学生，我是老师。",
  // 吗 (ma)
  "你好吗？",
  "他是老师吗？",
  "你喜欢茶吗？",
  "你有书吗？",
  "她来吗？",
  "你吃面条吗？",
  "这是你的吗？",
  "有，我有书。",
  "没有。",
  "那也是你的吗？",
  // 谁 (shéi)
  "那是谁？",
  "这是谁？",
  "你是谁？",
  "他是谁？",
  "她是谁？",
  "谁是老师？",
  "谁是你的朋友？",
  "这是谁的书？",
  "那是谁的手机？",
  "他叫王老师。",
  "他是我们的老师。",
  "他是谁的老师？",
  // 什么 (shénme)
  "你吃什么？",
  "你喝什么？",
  "你买什么？",
  "你学什么？",
  "这是什么？",
  "你叫什么名字？",
  "你做什么？",
  "这是什么颜色？",
  "那是什么？",
  "我吃面条。",
  "我喝茶。",
  "我喝水。",
  "我学汉语。",
  // 哪 (nǎ)
  "你是哪国人？",
  "他是哪国人？",
  "哪个是你的？",
  "你喜欢哪个？",
  "你去哪个学校？",
  "你在哪个学校？",
  "你学什么语言？",
  "我学乌兹别克语和中文。",
  "这两本书，哪个是你的？",
  "这个是我的。",
  "你要哪个苹果？",
  "我要那个大的。",
  // 的 (de)
  "这是我的书。",
  "那是你的手机吗？",
  "他是我的朋友。",
  "这是老师的书。",
  "那是谁的？",
  "这本书是我的。",
  "我的妈妈是老师。",
  "这是我们的学校。",
  "这是我的。",
  "那是你的。",
  "不是，那是我朋友的书。",
  "那是我妈妈的手机。",
  "是，这是我的。",
  // 都 (dōu)
  "我们都是学生。",
  "他们都很忙。",
  "大家都喜欢吃饺子。",
  "我和他都是中国人。",
  "这些书我都看了。",
  "你们都来了吗？",
  "他们都不喜欢咖啡。",
  "这些菜我都不吃。",
  "他们不都是学生。",
];
// ─── Generate audio ──────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const total   = sentences.length;
  let generated = 0;
  let skipped   = 0;
  for (const text of sentences) {
    const filename = encodeURIComponent(text) + ".mp3";
    const filepath = path.join(OUTPUT_DIR, filename);
    if (fs.existsSync(filepath)) {
      console.log(`⏭  Skipped (exists): ${text}`);
      skipped++;
      continue;
    }
    try {
      const res = await openai.audio.speech.create({
        model: "tts-1",
        input: text,
        voice: "nova",   // clear, natural female voice — good for Chinese
        speed: 0.85,     // slightly slower for learners
      });
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      console.log(`✓  Generated: ${text}`);
      generated++;
      // small delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`✗  Failed: ${text}`, err.message);
    }
  }
  console.log(`\nDone. Generated: ${generated} | Skipped: ${skipped} | Total: ${total}`);
}
main();
