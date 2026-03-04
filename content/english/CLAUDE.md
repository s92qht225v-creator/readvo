# English Content Guide (Destination B1)

## Architecture
- **Separate routes**: `/english/...` alongside `/chinese/...` (hardcoded, not dynamic `[language]`)
- **Separate content service**: `src/services/english-content.ts` reads from `/content/english/destination-b1/`
- **Separate language page**: `src/components/EnglishLanguagePage.tsx`
- **Reuses**: ReaderLayout (`hidePinyin={true}`, `navSegment="unit"`), BookPage (`tabConfig`, `unitLabel="Unit"`), Page, Section, Sentence
- **Zero Chinese regression**: All existing Chinese files untouched

## English Content JSON Format
```json
{
  "id": "unit1-page1",
  "pageNumber": 1,
  "lessonHeader": {
    "lessonNumber": 1,
    "pinyin": "",
    "title": "Grammar",
    "titleTranslation": "Present simple, present continuous, stative verbs",
    "titleTranslation_ru": "Present simple, present continuous, stative verbs"
  },
  "sections": [...]
}
```
- `pinyin`: Always `""` (triggers "Unit" label in LessonHeader instead of "dars")
- `title`: Section category (e.g., "Grammar", "Vocabulary")
- `titleTranslation`: English grammar topic list — keep in English for BOTH languages

## Grammar Table Data
Tables support inline markdown: `**bold**` for emphasis, `_italic text_` for example sentences.
Translated cells via `cells_uz` / `cells_ru` (first column labels translated, second column English content stays same).

### Form Table (no headers)
```json
{
  "grammarTableData": {
    "headers": ["", ""],
    "rows": [
      {
        "cells": ["**statement**", "I/you/we/they **play** ..."],
        "cells_uz": ["**darak gap**", "I/you/we/they **play** ..."],
        "cells_ru": ["**утверждение**", "I/you/we/they **play** ..."]
      }
    ]
  }
}
```

### Use/Example Table (with translated headers)
```json
{
  "grammarTableData": {
    "headers": ["Use", "Example"],
    "subHeaders": ["Qo'llanilishi", "Misol"],
    "subHeaders_ru": ["Употребление", "Пример"],
    "rows": [
      {
        "cells": ["Present habits", "_Marsha **goes** to dance lessons._"],
        "cells_uz": ["Odatiy harakatlar", "_Marsha **goes** to dance lessons._"],
        "cells_ru": ["Привычки", "_Marsha **goes** to dance lessons._"]
      }
    ]
  }
}
```
When `subHeaders` exist, English headers are hidden — only translated headers shown.

## Tips (Helpful Hints / Watch Out!)
```json
{
  "tip": {
    "label": "Helpful hints",
    "label_uz": "Foydali maslahatlar",
    "label_ru": "Полезные подсказки",
    "text": "",
    "translation": "Uzbek explanation with bullet points...",
    "translation_ru": "Russian explanation with bullet points..."
  }
}
```
- `text`: Always `""` for English (no English explanation text)
- Content goes in `translation` / `translation_ru`
- Use `•` for bullet points, `\n` for line breaks
- Tip renders AFTER grammar table when both exist in same section
- Watch out! labels: UZ "Ehtiyot bo'ling!" / RU "Внимание!"
- Optional `translationBottom` / `translationBottom_ru` for content that renders after `vocabList`
- Optional `vocabList` with `header: true` items for group labels (rendered as bold italic headers)

## Typed Fill-in-Blank Exercise
```json
{
  "type": "typedfillblank",
  "typedFillBlankData": {
    "wordBank": ["belong", "do", "have", "help"],
    "cards": [{
      "id": "card1",
      "parts": [
        {"type": "text", "content": "She "},
        {"type": "blank"},
        {"type": "text", "content": " to school. "},
        {"type": "hint", "content": "go"}
      ],
      "answers": ["goes"],
      "alternateAnswers": [["goes"]],
      "words": [
        {"w": "go", "t": "bormoq", "tr": "идти"},
        {"w": "to school", "t": "maktabga", "tr": "в школу"}
      ]
    }]
  }
}
```
- `hint` part renders prompt in parentheses, e.g., "(go)" in grey italic
- Case-insensitive validation, supports `alternateAnswers`
- `words` array enables tap-to-translate tooltips on sentence text
- Optional `wordBank` array: displays italic word list with bullet separators in a bordered box above the cards
- Multi-blank cards: use multiple `{"type": "blank"}` parts with matching `answers` array (one answer per blank)

### Tick answers
If the correct answer for a blank is `"✓"`, a circular tick toggle button (○/✓) is shown instead of a text input. Used for "correct/incorrect line" exercises. Clicking toggles between unticked (○) and ticked (✓). Neutral color until checked, then green if correct, red if wrong.

### Passage layout (extra word / tick exercises)
```json
{
  "type": "typedfillblank",
  "typedFillBlankData": {
    "layout": "passage",
    "cards": [{
      "id": "card1",
      "parts": [
        {"type": "blank"},
        {"type": "text", "content": "She had been waiting for over an hour."}
      ],
      "answers": ["✓"],
      "words": [{"w": "waiting", "t": "kutmoq", "tr": "ждать"}]
    }, {
      "id": "card2",
      "parts": [
        {"type": "blank"},
        {"type": "text", "content": "She had been waiting been for over an hour."}
      ],
      "answers": ["been"],
      "words": [{"w": "waiting", "t": "kutmoq", "tr": "ждать"}]
    }]
  }
}
```
- `layout: "passage"` renders each card as a row: `[number] [text input] [tick button] passage text`
- `blank` part must be FIRST, then `text` part with the passage line
- Text input for typing the extra word; tick button (○/✓) for marking a correct line — mutually exclusive
- Answer is either the extra word (e.g., `"been"`) or `"✓"` if the line has no extra word
- Check button (Tekshirish) enables as soon as any card is filled; checks only filled cards
- Tick button stays neutral until checked, then turns green (correct) or red (wrong)

## Error Correction Exercise
```json
{
  "type": "errorcorrection",
  "errorCorrectionData": {
    "cards": [{
      "id": "card1",
      "sentence": "She go to school every day.",
      "errorStart": 4,
      "errorEnd": 6,
      "correctAnswer": "goes",
      "alternateAnswers": ["goes"],
      "words": [
        {"w": "go", "t": "bormoq", "tr": "идти"},
        {"w": "every day", "t": "har kuni", "tr": "каждый день"}
      ]
    }]
  }
}
```
- Error portion rendered in bold (`font-weight: 700`) in the sentence
- Single "Check All" button at bottom (not per-card)
- `words` array enables tap-to-translate tooltips on sentence text

## Word Choice Exercise
```json
{
  "type": "wordchoice",
  "wordChoiceData": {
    "cards": [{
      "id": "card1",
      "parts": [
        {"type": "text", "content": "I "},
        {"type": "choice", "options": ["work", "am working"], "correct": 1},
        {"type": "text", "content": " at the local library."}
      ],
      "words": [
        {"w": "work", "t": "ishlamoq", "tr": "работать"},
        {"w": "library", "t": "kutubxona", "tr": "библиотека"}
      ]
    }]
  }
}
```
- `choice` parts have `options` array (2 choices) and `correct` index (0 or 1)
- Choices shown inline as bold tappable buttons separated by `/`
- Correct choice turns green and locks; wrong choice shakes red then resets
- Progress bar tracks completed choices across all cards
- `words` array enables tap-to-translate tooltips on sentence text

## Text Error Exercise (Find & Correct Errors in Passage)
```json
{
  "type": "texterror",
  "textErrorData": {
    "passage": "One game I am loving is backgammon. You are throwing the dice...",
    "errors": [
      {
        "id": 1,
        "errorStart": 11,
        "errorEnd": 20,
        "correctAnswer": "love",
        "alternateAnswers": []
      }
    ],
    "words": [
      {"w": "game", "t": "o'yin", "tr": "игра"}
    ]
  }
}
```
- `passage`: Full paragraph text displayed in bordered box
- `errors`: Array of error objects with character indices, sorted by position in passage
- `errors[].id`: Display number (shown as superscript next to bolded error)
- Error words rendered **bold** with red superscript number
- Numbered text inputs below the passage for corrections
- Single "Check All" button, case-insensitive validation with `alternateAnswers`
- `words` array: shared tap-to-translate tooltips for entire passage

## Exercise Letter (Outlined Box Label)
Add `exerciseLetter` to any section that has an `instruction` to show the exercise letter (A, B, C…) in a small red outlined square before the instruction text:
```json
{
  "exerciseLetter": "C",
  "instruction": "Krossvordni to'ldiring...",
  "instruction_ru": "Заполните кроссворд..."
}
```
- Renders as a bold letter inside a `1.6em` red-outlined square box, aligned with the first line of the instruction
- When omitted, the default `■` bullet is shown instead
- Sections without `instruction` (e.g. reference tables) never show the box
- For crossword exercises split into Across/Down sections, put `exerciseLetter` only on the Across section (Down has no instruction, just a subheading)
