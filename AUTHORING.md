# Content Authoring Workflow

This document defines how Kitobee content is created, validated, and prepared for consumption.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTHORING PIPELINE                               │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Source  │ →  │ Tokenize │ →  │ Translate│ →  │  Audio   │             │
│  │  Text    │    │  Words   │    │  Review  │    │  Record  │             │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│       │              │               │               │                      │
│       ▼              ▼               ▼               ▼                      │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    JSON Assembler                             │          │
│  │  Combines all data into page JSON with stable IDs            │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    Validator                                  │          │
│  │  Checks all constraints before publishing                    │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    Published JSON                             │          │
│  │  Ready for frontend consumption                              │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Source Text Preparation

### Who Does This
- **Content Author**: Language teacher or curriculum designer
- **Source**: Existing textbook, new curriculum, or licensed content

### Input Format
Plain text or structured document with:
- Section markers (dialogue, vocabulary, grammar, etc.)
- Sentence boundaries (one sentence per line)
- Speaker labels for dialogues

### Example Source File

```
=== DIALOGUE ===
A: 田中さん、おはようございます。
B: おはようございます。お元気ですか。
A: はい、元気です。田中さんは。
B: 私も元気です。ありがとう。

=== VOCABULARY ===
おはようございます
元気
ありがとう

=== GRAMMAR ===
「〜ですか」は質問を作ります。

=== INSTRUCTION ===
ペアで会話を練習しましょう。
```

### Output
- `source.txt` with normalized text
- Section boundaries identified
- Sentence boundaries verified

---

## 2. Word Tokenization

### Who Does This
- **Automated**: NLP tokenizer (MeCab, Kuromoji, Sudachi for Japanese)
- **Review**: Human linguist for corrections

### Process

1. **Run Tokenizer**
   ```bash
   # Example with MeCab for Japanese
   mecab -O json < source.txt > tokens.json
   ```

2. **Extract Required Fields**
   For each token:
   - `surface`: The word as written
   - `lemma`: Dictionary form
   - `pos`: Part of speech
   - `isPunctuation`: Boolean flag

3. **Human Review**
   - Verify compound words split correctly
   - Check proper nouns
   - Validate particles attached correctly

### Tokenizer Configuration

```yaml
# tokenizer-config.yaml
language: ja
tokenizer: mecab
dictionary: unidic
options:
  - split_mode: C  # Most granular splitting
  - normalize: true
pos_mapping:
  名詞: noun
  動詞: verb
  助詞: particle
  記号: punctuation
```

### Output Schema

```json
{
  "sentence": "田中さん、おはようございます。",
  "tokens": [
    { "surface": "田中", "lemma": "田中", "pos": "proper-noun" },
    { "surface": "さん", "lemma": "さん", "pos": "suffix" },
    { "surface": "、", "lemma": "、", "isPunctuation": true },
    { "surface": "おはよう", "lemma": "おはよう", "pos": "interjection" },
    { "surface": "ございます", "lemma": "ございます", "pos": "verb" },
    { "surface": "。", "lemma": "。", "isPunctuation": true }
  ]
}
```

---

## 3. Translation Production

### Who Does This
- **Translator**: Professional translator with target language expertise
- **Reviewer**: Second translator or language teacher

### Guidelines

1. **Translate Meaning, Not Words**
   - Capture the communicative intent
   - Adjust for natural target language phrasing

2. **Match Register**
   - Formal Japanese → Formal English
   - Casual Japanese → Casual English

3. **Keep Consistent**
   - Same word → same translation (within a lesson)
   - Use glossary for technical terms

4. **Vocabulary Section Rules**
   - Translate the word in isolation
   - Include common meanings only
   - No full sentence translations

### Translation Review Checklist

- [ ] All sentences have translations
- [ ] No machine translation artifacts
- [ ] Grammar explanations are accurate
- [ ] Cultural notes included where needed
- [ ] Consistent terminology

### Output Format

```tsv
# translations.tsv
sentence_id	original	translation
l1p1-d-s1	田中さん、おはようございます。	Good morning, Mr. Tanaka.
l1p1-d-s2	おはようございます。お元気ですか。	Good morning. How are you?
```

---

## 4. Audio Production

### Who Does This
- **Voice Actor**: Native speaker with clear pronunciation
- **Audio Engineer**: Recording and post-production

### Recording Guidelines

1. **One Sentence Per File**
   - File naming: `{sentence_id}.mp3`
   - Example: `l1p1-d-s1.mp3`

2. **Audio Specifications**
   ```
   Format: MP3
   Bitrate: 128 kbps (minimum)
   Sample Rate: 44.1 kHz
   Channels: Mono
   Normalization: -3 dB peak
   ```

3. **Recording Notes**
   - Natural pace (not too slow)
   - Clear articulation
   - No background noise
   - 0.5s silence at start/end

4. **Dialogue Recordings**
   - Different voice actors for different speakers
   - OR clearly mark speaker changes

### File Organization

```
audio/
├── lesson1/
│   ├── page1/
│   │   ├── l1p1-d-s1.mp3
│   │   ├── l1p1-d-s2.mp3
│   │   └── ...
│   └── page2/
│       └── ...
└── lesson2/
    └── ...
```

### Audio Manifest

```json
{
  "lesson1-page1": {
    "l1p1-d-s1": "/audio/lesson1/page1/l1p1-d-s1.mp3",
    "l1p1-d-s2": "/audio/lesson1/page1/l1p1-d-s2.mp3"
  }
}
```

---

## 5. JSON Assembly

### Who Does This
- **Build Script**: Automated assembler
- **Human**: Final review

### Assembly Process

```python
# Pseudocode for JSON assembly
def assemble_page(page_id, source, tokens, translations, audio_manifest):
    page = {
        "id": page_id,
        "pageNumber": extract_page_number(page_id),
        "title": extract_title(source),
        "sections": []
    }

    for section in parse_sections(source):
        section_data = {
            "id": f"{page_id}-sec-{section.type}",
            "type": section.type,
            "heading": section.heading,
            "sentences": []
        }

        for i, sentence in enumerate(section.sentences):
            sentence_id = f"{page_id}-{section.type[0]}-s{i+1}"

            sentence_data = {
                "id": sentence_id,
                "section": section.type,
                "text_original": sentence.text,
                "text_translation": translations.get(sentence_id),
                "words": assign_word_ids(tokens.get(sentence.text)),
                "audio_url": audio_manifest.get(sentence_id),
                "speaker": sentence.speaker  # if dialogue
            }

            section_data["sentences"].append(sentence_data)

        page["sections"].append(section_data)

    return page
```

### ID Assignment Rules

| Entity | ID Pattern | Example |
|--------|-----------|---------|
| Page | `lesson{L}-page{P}` | `lesson1-page3` |
| Section | `{page_id}-sec-{type}` | `lesson1-page3-sec-dialogue` |
| Sentence | `l{L}p{P}-{type_initial}-s{N}` | `l1p3-d-s2` |
| Word | `w{N}` (within sentence) | `w0`, `w1`, `w2` |

### Stable ID Contract

> ⚠️ **CRITICAL RULE: Sentence IDs must NEVER change once published.**

This is the most important invariant in the authoring system. IDs are permanent identifiers that may be referenced by:
- User bookmarks
- Analytics systems
- External links
- Spaced repetition systems
- Progress tracking (if added later)

**IDs remain stable even when:**

| Change | ID Status | Example |
|--------|-----------|---------|
| Text is edited | **Keep same ID** | Fix typo in `l1p1-d-s1` → still `l1p1-d-s1` |
| Translation is corrected | **Keep same ID** | Better translation → still `l1p1-d-s1` |
| Audio is re-recorded | **Keep same ID** | New voice actor → still `l1p1-d-s1` |
| Word tokens updated | **Keep same ID** | Better tokenization → still `l1p1-d-s1` |
| Speaker label changed | **Keep same ID** | "A:" → "田中:" → still `l1p1-d-s1` |

**When to create a NEW ID:**

| Change | ID Status | Example |
|--------|-----------|---------|
| Sentence deleted | **Retire ID forever** | Remove `l1p1-d-s3` → never reuse `l1p1-d-s3` |
| Sentence added | **New ID** | Insert between s2 and s3 → use `l1p1-d-s2a` or `l1p1-d-s4` |
| Sentence split into two | **New IDs for both** | `l1p1-d-s5` becomes `l1p1-d-s5` + `l1p1-d-s5b` |
| Two sentences merged | **Keep first, retire second** | Merge s6+s7 → keep `l1p1-d-s6`, retire `l1p1-d-s7` |

**Enforcement:**

1. Build system should detect ID changes between versions
2. CI should fail if a published ID is modified or reused
3. Maintain a `retired-ids.txt` file listing IDs that can never be reused

```bash
# retired-ids.txt
# IDs listed here must never be reused
l1p1-d-s3  # Removed in v1.2.0 - redundant greeting
l2p4-v-s7  # Removed in v1.3.0 - incorrect vocabulary item
```

---

## 6. Validation

### Who Does This
- **Automated**: Validation script (see `src/validation/validator.ts`)
- **Human**: Review validation report

### Validation Checklist

| Check | Severity | Description |
|-------|----------|-------------|
| Missing page ID | Error | Page must have ID |
| Missing section ID | Error | Section must have ID |
| Missing sentence ID | Error | Sentence must have ID |
| Duplicate ID | Error | All IDs must be unique |
| Empty sections | Error | No empty sections |
| Empty sentences | Error | No empty sentences |
| Empty words | Error | Sentences must have tokens |
| Word coverage mismatch | Warning | Tokens should rebuild original |
| Empty translation | Error/Warning | Depends on config |
| Invalid audio URL | Warning | URL format check |

### Running Validation

```typescript
import { validatePage } from './src/validation';

const page = JSON.parse(fs.readFileSync('page.json', 'utf-8'));

try {
  validatePage(page);
  console.log('Validation passed');
} catch (error) {
  console.error('Validation failed:', error.message);
  process.exit(1);
}
```

### CI Integration

```yaml
# .github/workflows/validate-content.yml
name: Validate Content

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run validate-content
```

---

## 7. Publishing

### Directory Structure

```
public/
├── pages/
│   ├── lesson1-page1.json
│   ├── lesson1-page2.json
│   └── ...
├── audio/
│   ├── lesson1/
│   │   └── page1/
│   │       └── *.mp3
│   └── ...
└── manifest.json
```

### Manifest File

```json
{
  "id": "japanese-beginner-1",
  "title": "Japanese for Beginners",
  "targetLanguage": "ja",
  "readerLanguage": "en",
  "totalPages": 120,
  "lessons": [
    {
      "id": "lesson1",
      "title": "Greetings",
      "pages": ["lesson1-page1", "lesson1-page2", "lesson1-page3"]
    }
  ]
}
```

---

## Roles Summary

| Role | Responsibilities |
|------|------------------|
| **Content Author** | Source text, section structure, sentence boundaries |
| **NLP Engineer** | Tokenizer configuration, bulk processing |
| **Linguist** | Token review, compound word verification |
| **Translator** | All translations, cultural notes |
| **Translation Reviewer** | Quality assurance, consistency check |
| **Voice Actor** | Audio recording |
| **Audio Engineer** | Recording, editing, normalization |
| **Build Engineer** | Assembly scripts, validation, CI/CD |

---

## Quality Gates

Before content can be published:

1. **Tokenization Review** - Linguist approval
2. **Translation Review** - Second translator sign-off
3. **Audio Review** - Spot check by native speaker
4. **Validation Pass** - All errors resolved
5. **Visual QA** - Render in browser, check layout

---

## Versioning

Content follows semantic versioning:

- **Major**: Structural changes (new sections, reordered content)
- **Minor**: Content additions (new sentences, translations)
- **Patch**: Fixes (typos, audio quality improvements)

Example: `v1.2.3`

IDs remain stable across all version changes.
