# Content Authoring Guide

This file covers JSON format conventions for all content files in `/content/`.

## Content JSON Format

### Sentence with pinyin
```json
{
  "id": "l1p1-t1-s1",
  "section": "text",
  "text_original": "AI小语，你好！",
  "text_translation": "Salom, AI Xiaoyu!",
  "text_translation_ru": "Привет, AI Сяоюй!",
  "text_translation_en": "Hello, AI Xiaoyu!",
  "pinyin": "AI Xiǎoyǔ, nǐ hǎo!",
  "speaker": "王一飞",
  "audio_url": "/audio/l1p1-t1-s1.mp3",
  "words": [...]
}
```

### Section with context, image, and audio
```json
{
  "id": "l1p1-sec-text1",
  "type": "text",
  "heading": "",
  "subheading": "Tekst 1",
  "subheading_ru": "Текст 1",
  "subheading_en": "Text 1",
  "context": "开学第一天，在办公室里...",
  "contextPinyin": "Kāixué dì yī tiān...",
  "contextTranslation": "O'quv yilining birinchi kuni...",
  "contextTranslation_ru": "В первый день учёбы...",
  "contextTranslation_en": "On the first day of school, in the office...",
  "instruction": "Dialogni tinglang va ovoz chiqarib o'qing.",
  "instruction_ru": "Послушайте диалог и прочитайте его вслух.",
  "instruction_en": "Listen to the dialogue and read it aloud.",
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/HSK%201-1/dialogue.mp3",
  "image_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/images/HSK%201/HSK-1-1-1.jpg",
  "sentences": [...]
}
```

### Tip with pinyin
```json
{
  "tip": {
    "label": "小语助力",
    "text": "「您」，敬称，对年长者或尊敬的人使用。",
    "pinyin": "「Nín」, jìngchēng, duì niánzhǎng zhě...",
    "translation": "「您」hurmatli olmosh bo'lib...",
    "translation_ru": "「您」— вежливое местоимение...",
    "translation_en": "\"您\" is a polite pronoun used when addressing elders or people you respect."
  }
}
```

### Flashcard deck JSON
```json
{
  "id": "hsk1-flashcards",
  "title": "HSK 1 So'zlar",
  "title_ru": "HSK 1 Слова",
  "words": [
    {
      "id": "fc-hsk1-001",
      "text_original": "你好",
      "pinyin": "nǐ hǎo",
      "text_translation": "salom",
      "text_translation_ru": "привет",
      "lesson": 1,
      "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/nihao.mp3"
    }
  ]
}
```

### Exercise Data Formats

#### Matching Exercise (`matchingItems[]`)
```json
{
  "type": "matching",
  "matchingItems": [
    {
      "id": "l6p1-m1",
      "image_url": "https://...HSK-6-warmup-word.jpg",
      "word": "茶",
      "pinyin": "chá",
      "translation": "choy",
      "translation_ru": "чай"
    }
  ]
}
```

#### Fill-Blank Exercise (`fillBlankData`)
- Supports single or multiple blanks per sentence
- Single blank: use `correctOptionId`
- Multiple blanks: use `correctOptionIds` array (ordered by blank position)
- Use `"_static"` correctOptionId for non-interactive dialogue lines
```json
{
  "type": "fillblank",
  "fillBlankData": {
    "options": [{"id": "A", "text": "喝"}, {"id": "B", "text": "见"}],
    "sentences": [
      {
        "id": "single-blank",
        "parts": [{"type": "text", "content": "我想"}, {"type": "blank"}],
        "correctOptionId": "A"
      },
      {
        "id": "multi-blank",
        "parts": [{"type": "text", "content": "我们（"}, {"type": "blank"}, {"type": "text", "content": "）下课，下午（"}, {"type": "blank"}, {"type": "text", "content": "）吧。"}],
        "correctOptionId": "A",
        "correctOptionIds": ["A", "B"]
      }
    ]
  }
}
```

#### Multiple Choice Exercise (`multipleChoiceData`)
```json
{
  "type": "multiplechoice",
  "multipleChoiceData": {
    "questions": [{
      "id": "...",
      "question": "...",
      "options": [{"id": "a", "text": "..."}],
      "correctOptionId": "a"
    }]
  }
}
```

#### Image Describe Exercise (`imageDescribeData`)
```json
{
  "type": "imagedescribe",
  "imageDescribeData": {
    "cards": [{
      "id": "l6p1-img-1",
      "image_url": "https://...",
      "parts": [{"type": "text", "content": "他在"}, {"type": "blank", "content": ""}],
      "answers": ["喝茶"]
    }]
  }
}
```

#### Bonus Video
```json
{
  "type": "bonus",
  "video_url": "https://..."
}
```

### Karaoke Song JSON
```json
{
  "id": "yueliang",
  "title": "月亮代表我的心",
  "pinyin": "Yuèliàng Dàibiǎo Wǒ De Xīn",
  "titleTranslation": "Oy mening yuragimni ifodalaydi",
  "titleTranslation_ru": "Луна представляет моё сердце",
  "artist": "邓丽君",
  "artist_ru": "Дэн Лицзюнь",
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/karaoke/yueliang.mp3",
  "lines": [
    {
      "id": 0,
      "words": [
        { "id": 0, "text": "你", "p": "nǐ", "timestamp": 13.138, "duration": 0.432 },
        { "id": 1, "text": "问", "p": "wèn", "timestamp": 13.57, "duration": 0.48 }
      ],
      "translation": "Sen meni qanchalik sevishimni so'raysan",
      "translation_ru": "Ты спрашиваешь, как сильно я тебя люблю"
    }
  ]
}
```
- Each `line` contains `words[]` (per-character entries with timestamps)
- Each word/char: `id` (number), `text` (single character), `p` (pinyin, optional), `timestamp` (seconds), `duration` (seconds)
- `translation` / `translation_ru` on each line for panel display
- Song metadata: `title`, `pinyin`, `titleTranslation`, `titleTranslation_ru`, `artist`, `artist_ru`
- Empty lines (no text) are skipped during rendering

### Dialogue JSON

> **Vocabulary (`vocab[]`) is now a reference list, not inline translations.** A dialogue's
> `vocab[]` holds references into the central Supabase `glossary` table: bare `"汉字"` strings,
> `{ "zh", "py" }` for homographs, or `{ "zh", "py?", "uz?", "ru?", "en?" }` to override a gloss
> for that dialogue's context. Translations live in the `glossary` table (edit them in the admin
> Glossary tab), resolved server-side at render. To add a NEW word: add its row to the glossary
> (admin tab or `supabase/migrations/20260612_glossary_seed.sql`) AND list its `zh` in the
> dialogue's `vocab[]`. Run `npm run validate-glossary` to check every reference resolves.

```json
{
  "id": "hsk1-dialogue1",
  "title": "你叫什么名字？",
  "pinyin": "Nǐ jiào shénme míngzi?",
  "titleTranslation": "Ismingiz nima?",
  "titleTranslation_ru": "Как тебя зовут?",
  "level": 1,
  "sections": [
    {
      "id": "d1-sec1",
      "type": "text",
      "heading": "",
      "subheading": "",
      "sentences": [
        {
          "id": "d1-s1",
          "text_original": "你好！",
          "pinyin": "Nǐ hǎo!",
          "text_translation": "Salom!",
          "text_translation_ru": "Привет!",
          "speaker": "A",
          "words": [
            { "i": [0, 2], "p": "nǐ hǎo", "t": "salom", "tr": "привет", "h": 1, "l": 1 }
          ]
        }
      ]
    }
  ]
}
```
- Same format as Story JSON but with `speaker` field on each sentence (typically "A" or "B")
- Dialogue IDs follow the pattern `hsk1-dialogue1`, `hsk1-dialogue2`, etc.
- Sentence IDs follow the pattern `d1-s1`, `d1-s2`, etc.
- The `speaker` field triggers dialogue layout in StoryReader (block layout with speaker labels)
- Data loaded from `content/dialogues/{bookId}/dialogue{N}.json`

### Story JSON
```json
{
  "id": "hsk1-story1",
  "title": "小猫在哪儿？",
  "pinyin": "Xiǎo māo zài nǎr?",
  "titleTranslation": "Mushukcha qayerda?",
  "titleTranslation_ru": "Где котёнок?",
  "level": 1,
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%20stories/1/story.mp3",
  "sections": [
    {
      "id": "s1-sec1",
      "type": "text",
      "heading": "",
      "subheading": "",
      "sentences": [
        {
          "id": "s1-s1",
          "text_original": "我有一个小猫。",
          "pinyin": "Wǒ yǒu yí ge xiǎo māo.",
          "text_translation": "Mening bir mushukcham bor.",
          "text_translation_ru": "У меня есть котёнок.",
          "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%20stories/1/line1.mp3",
          "start": 0,
          "end": 3,
          "words": [
            { "i": [0, 1], "p": "wǒ", "t": "men", "tr": "я", "h": 1, "l": 2 },
            { "i": [1, 2], "p": "yǒu", "t": "bor", "tr": "иметь", "h": 1, "l": 4 },
            { "i": [2, 4], "p": "yí ge", "t": "bitta", "tr": "один", "h": 1, "l": 4 },
            { "i": [4, 6], "p": "xiǎo māo", "t": "mushukcha", "tr": "котёнок", "h": 1, "l": 8 }
          ]
        }
      ]
    }
  ]
}
```
- Each section represents a paragraph (visual grouping of sentences)
- Each sentence must be a single Chinese sentence (one tappable unit for translation)
- Story-level `audio_url` is optional; when present, the floating audio player appears (normal mode)
- Per-sentence `audio_url` is optional; when present, tapping the sentence plays its audio. URL pattern: `HSK%201%20stories/{storyNum}/line{N}.mp3`
- `start`/`end` are optional timestamps in seconds for audio-text sync (e.g., `"start": 6.5, "end": 10`)
- When timestamps are present, the sentence auto-highlights during audio playback
- Each sentence's `end` should match the next sentence's `start` (no gaps)
- For sentences sharing an audio segment, split the time proportionally
- Sections use `"type": "text"` with empty `heading`/`subheading`

## Content Conventions
- Content is loaded from `/content/*.json` files
- Audio/images stored in Supabase Storage (URLs in JSON)
- All pinyin should use tone marks (not numbers)
- Translations should be in Uzbek with proper apostrophes (o', g', etc.)
- Russian translations use standard Cyrillic
- `dialogueNumber` should be plain numbers (e.g., `"1"`, `"2"`) — the component wraps them in parentheses
- All exercise progress bars use `var(--color-accent)` for consistency
- Exercise instructions use section-level `instruction`/`instruction_ru` fields (NOT sentences with `isCheckbox`)
- **NO Chinese in headings**: All `heading` fields are empty (`""`) — Chinese section titles removed
- **NO Chinese in instructions**: All `instruction`/`instruction_ru` fields are Uzbek/Russian only
- **NO Chinese in grammar explanations**: Grammar explanation sentences have no `text_original` (only `text_translation`/`text_translation_ru`)
- Pinyin is ONLY for learning content: Chinese example sentences, vocabulary, dialogues, tongue twisters
- Numbered sentences like `(1) 四口` use inline numbering in `text_original` (not `dialogueNumber`)
- Pinyin/translation for numbered sentences in grammar and exercise sections auto-indent via CSS (`padding-left: 2.2em`)
- For pages with MC listening exercises: split text section into 3 parts: (1) heading+context, (2) MC exercise, (3) instruction+audio+image+dialogue
- **Tongue twisters**: All lines merged into a single sentence entry. Type must be `tonguetwister` (not `text` or `grammar`). Section field must be `tonguetwister`.
- Standard instruction texts (UZ / RU / EN):
  - Dialogue: `"Dialogni tinglang va ovoz chiqarib o'qing."` / `"Послушайте диалог и прочитайте его вслух."` / `"Listen to the dialogue and read it aloud."`
  - MC: `"Dialogni ikki marta tinglab, to'g'ri javobni tanlang."` / `"Прослушайте диалог дважды и выберите правильный ответ."` / `"Listen to the dialogue twice and choose the correct answer."`
  - Fill-blank: `"To'g'ri so'zni tanlab, bo'sh joylarni to'ldiring."` / `"Выберите подходящие слова для заполнения пропусков."` / `"Choose the correct words to fill in the blanks."`
  - Tongue twister: `"Tez aytishni eshiting va aytishni mashq qiling."` / `"Послушайте скороговорку и потренируйтесь произносить."` / `"Listen to the tongue twister and practice saying it."`
- Standard subheading translations (EN): "Objectives", "Text 1"/"Text 2"/"Text 3", "New Words", "Repeat the Tongue Twister", "Xiaoyu's Class", "Tip from Xiaoyu", "Xiaoyu's Bonus Content X-X", "Exercises"

## Content Formatting Standards

### Multiple Choice Questions
- **NEVER** include question numbers like "(1)" or "(2)" in the `content` field of question `parts`
- The `number` field already handles numbering automatically
- Correct format: `"content": "李文问大家("` (no number prefix)
- Incorrect format: `"content": "(1)李文问大家("` (has number prefix)

### Exercise Sentences
- **Keep** numbers in `text_original` with a space: `"(1) 白家月爱吃哪个菜？"`
- **Remove** number prefixes from `pinyin` and translations
- Correct format:
  ```json
  {
    "text_original": "(1) 白家月爱吃哪个菜？",
    "pinyin": "Bái Jiāyuè ài chī nǎge cài?",
    "text_translation": "Bai Jiyayue qaysi taomni yoqtiradi?"
  }
  ```
- Incorrect format: `"pinyin": "(1) Bái Jiāyuè ài chī nǎge cài?"`

### Grammar Example Sentences
- **Must** have `pinyin` field for all example sentences
- **Must NOT** have `dialogueNumber` fields (use inline numbering instead)
- **Must** include inline numbering in `text_original`: `"(1) 我喜欢这个，也喜欢那个。"`
- Correct format:
  ```json
  {
    "text_original": "(1) 我喜欢这个，也喜欢那个。",
    "pinyin": "Wǒ xǐhuan zhège, yě xǐhuan nàge.",
    "text_translation": "Men buni yoqtiraman, uni ham yoqtiraman."
  }
  ```
- Grammar dialogues use `speaker` + `dialogueNumber` fields for A/B exchanges

### Grammar Explanations (no Chinese)
- Grammar explanation sentences have **no `text_original`** and **no `pinyin`** — only translations
- Identified by: `section === 'grammar'` + no `pinyin` field + has `text_translation`
- Validator allows these via `isGrammarExplanation` check
- Sentence.tsx conditionally renders `sentence__text` only when `text_original` exists
- Format:
  ```json
  {
    "id": "l9p2-g3-s2",
    "section": "grammar",
    "text_translation": "\"第\" butun sonlar oldida kelib, tartib sonni bildiradi.",
    "text_translation_ru": "«第» ставится перед целым числом для обозначения порядкового числительного."
  }
  ```

### CSS Auto-Indentation
- Numbered sentences in grammar and exercise sections automatically indent via CSS
- `padding-left: 2.2em` applies to `[data-numbered="true"]` sentences
- Works for both `.section--grammar` and `.section--exercise`

## Story Content Conventions
- Each sentence in a story must be its own entry in `sentences[]` — never combine two sentences in one `text_original`
- Sections represent visual paragraphs; use multiple sections to break the story into readable chunks
- Story IDs follow the pattern `hsk1-story1`, `hsk1-story2`, etc.
- Sentence IDs follow the pattern `s1-s1`, `s1-s2` (or `s1-s8a`, `s1-s8b` when splitting)
- All sentences must have `pinyin` (stories are learning content)
- `words` array contains word-level data for press-and-hold translation (see format below)
- Story-level `audio_url`: one `story.mp3` file for full playback. Per-sentence `audio_url`: individual `line{N}.mp3` files for tap-to-play.
- Audio-text sync: add `start`/`end` (seconds) to each sentence for auto-highlighting during playback
- Ruby text utility (`rubyText.ts`) handles:
  - Compound pinyin splitting: "Jīntiān" → ["Jīn", "tiān"], "xīngqīliù" → ["xīng", "qī", "liù"]
  - Apostrophe-separated syllables: "kě'ài" → ["kě", "ài"]
  - Erhua merging: 玩儿/点儿 with pinyin "wánr"/"diǎnr" renders as one ruby element (works in compounds like "Yǒudiǎnr" too)
  - Quote stripping: leading/trailing `"` `'` `(` `)` stripped from pinyin tokens before splitting
  - Punctuation passthrough: 。，？！ get no pinyin annotation

### Word-Level Data (`words[]`)
Each sentence has a `words` array with compact word entries for press-and-hold translation:
```json
{ "i": [0, 2], "p": "jīntiān", "t": "bugun", "tr": "сегодня", "h": 1, "l": 5 }
```
- `i`: `[startCharIdx, endCharIdx]` — character range in `text_original` (exclusive end)
- `p`: pinyin for this word
- `t`: Uzbek translation
- `tr`: Russian translation
- `h`: HSK level (1-6), currently all `1` for HSK 1 stories
- `l`: lesson number — ONLY when the **exact word** exists in the flashcard deck with the **same meaning**
  - Exact match required: 猫 (in deck) → `"l": 5` ✓ / 小猫 (not in deck) → no `l` ✓
  - No compound inference: 一个, 看看, 星期六, 家里 etc. → no `l` (not exact deck entries)
  - Contextual meaning must match: 贵 as "expensive" → `"l": 10`, NOT `"l": 1` (你贵姓 honorific)
  - Words not in the deck (supplementary vocab like 厨房, 笑, 走, compounds like 小猫) have no `l` field
  - Validate with: `python3 scripts/populate-words.py validate-all`
- Punctuation (。，！？) is excluded — only meaningful Chinese words
- All 3 stories (74 sentences, ~400 words) have complete word data

## CRITICAL: Chinese Quotation Marks in JSON

**NEVER use Chinese curly quotation marks `"..."` inside JSON strings!**

These characters break JSON parsing because they look like the JSON string delimiter `"`.

When Chinese text contains quoted words like `"有"字句` or `"A……，B呢？"`:

1. **In `text_original`**: Escape the quotes → `\"有\"字句` or use corner brackets `「有」字句`
2. **In `pinyin`**: Use single quotes → `'yǒu' zìjù`
3. **In translations**: Use the target language's quotation style:
   - Uzbek: single quotes `'...'`
   - Russian: guillemets `«...»`

**Example:**
```json
{
  "text_original": "能听懂并使用\"有\"字句表达领有。",
  "pinyin": "Néng tīng dǒng bìng shǐyòng 'yǒu' zìjù biǎodá lǐngyǒu.",
  "text_translation": "'有' gap tuzilmasini tushunish.",
  "text_translation_ru": "Понимать предложения с «有»."
}
```

**Always validate JSON after creating content:**
```bash
python3 -c "import json; json.load(open('content/lessonX-pageY.json'))"
```
