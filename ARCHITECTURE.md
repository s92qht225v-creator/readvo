# Kitobee Reading System Architecture

## Overview

A DOM-based interactive reading system for language textbooks. Designed for clarity, determinism, and scalability to thousands of pages.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│                                                                              │
│   JSON Files (static, prepared upstream)                                    │
│   ├── pages/lesson1-page1.json                                             │
│   ├── pages/lesson1-page2.json                                             │
│   └── ...                                                                   │
│                                                                              │
│   Hierarchy: Book → Page → Section → Sentence → Word                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TYPE LAYER                                      │
│                                                                              │
│   TypeScript Interfaces (strict contracts)                                  │
│   ├── WordToken     - clickable unit for dictionary lookup                 │
│   ├── Sentence      - atomic unit of meaning (owns words, translation)     │
│   ├── Section       - groups sentences by type                             │
│   └── Page          - unit of loading/navigation                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RENDER LAYER                                     │
│                                                                              │
│   React Components (dumb, declarative)                                      │
│   ├── <Page>        - top-level, owns all UI state                        │
│   │   ├── <Section> - renders heading + sentences                         │
│   │   │   └── <Sentence> - renders words + translation + audio btn       │
│   │   │       └── <Word> - clickable span                                │
│   │   └── <WordPopup> - dictionary display                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERACTION LAYER                                  │
│                                                                              │
│   Event Handlers (single-purpose, predictable)                              │
│   ├── Word click      → show dictionary popup                              │
│   ├── Sentence click  → toggle translation visibility                      │
│   └── Audio button    → play/stop sentence audio                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Invariants

### 1. Sentence is the Atomic Unit

Every piece of readable content is a sentence. Sentences have:
- Stable ID (never changes)
- Section type (dialogue, vocabulary, grammar, instruction)
- Original text
- Translation
- Optional audio URL
- Pre-tokenized words

### 2. Words are Children of Sentences

Words exist **only** for click interaction (dictionary lookup). They:
- Have no standalone meaning
- Have no audio
- Cannot be selected independently of their parent sentence

### 3. Rendering is Dumb

The frontend **never** guesses:
- Sentence boundaries
- Word boundaries
- Word meanings
- Any semantic information

All structure comes from prepared data.

### 4. One Interaction = One Intent

| Action | Result |
|--------|--------|
| Click word | Show word meaning popup |
| Click sentence | Toggle sentence translation |
| Click 🔊 | Play sentence audio |

No combined behaviors. No "smart" inference.

### 5. No PDF Recreation

This is a screen-first digital reading edition:
- No speech bubbles
- No decorative shapes
- No complex layouts

---

## Data Model

### WordToken

```typescript
interface WordToken {
  id: string;           // Stable within sentence (e.g., "w0")
  surface: string;      // Display form (e.g., "食べます")
  lemma: string;        // Dictionary form (e.g., "食べる")
  pos?: string;         // Part of speech
  isPunctuation?: bool; // If true, not clickable
}
```

### Sentence

```typescript
interface Sentence {
  id: string;               // Globally unique (e.g., "l1p1-d-s1")
  section: SectionType;     // "dialogue" | "vocabulary" | "grammar" | "instruction"
  text_original: string;    // Original text
  text_translation: string; // Translation
  words: WordToken[];       // Pre-tokenized
  audio_url?: string;       // Sentence audio only
  speaker?: string;         // For dialogue (e.g., "A:")
}
```

### Section

```typescript
interface Section {
  id: string;
  type: SectionType;
  heading?: string;
  sentences: Sentence[];
}
```

### Page

```typescript
interface Page {
  id: string;
  pageNumber: number;
  title?: string;
  sections: Section[];
}
```

---

## Component Responsibilities

### `<Page>` — State Owner

**Owns:**
- `visibleTranslations: Set<sentenceId>`
- `wordPopup: { isVisible, position, entry }`
- `audioState: { playingSentenceId, isLoading }`

**Does:**
- Renders all sections
- Coordinates callbacks
- Manages audio element

### `<Section>` — Structural Grouping

**Owns:** Nothing (pure render)

**Does:**
- Renders heading
- Maps sentences to `<Sentence>` components
- Passes through callbacks

### `<Sentence>` — Interactive Container

**Owns:** Nothing (receives props)

**Does:**
- Renders speaker label
- Renders word tokens
- Handles sentence click → calls `onSentenceClick`
- Renders audio button (if audio_url)
- Renders translation (if visible)

### `<Word>` — Click Target

**Owns:** Nothing

**Does:**
- Renders surface text
- Handles click → calls `onWordClick`
- Stops propagation to prevent sentence click

### `<WordPopup>` — Dictionary Display

**Owns:** Nothing

**Does:**
- Positions itself near clicked word
- Displays dictionary entry
- Closes on click outside or Escape

---

## State Flow

```
User clicks word
        │
        ▼
Word.handleClick()
        │
        ├── stopPropagation()
        │
        └── onWordClick({ sentenceId, wordId, lemma, position })
                │
                ▼
        Page.handleWordClick()
                │
                ├── setWordPopup({ isVisible: true, position, entry: null })
                │
                └── await dictionaryLookup(lemma)
                        │
                        ▼
                setWordPopup({ ...prev, entry })
```

```
User clicks sentence (not on word)
        │
        ▼
Sentence.handleSentenceClick()
        │
        └── onSentenceClick(sentenceId)
                │
                ▼
        Page.handleSentenceClick()
                │
                └── setVisibleTranslations(toggle sentenceId)
```

---

## Scaling Considerations

### Data Preparation (Upstream)

- Word segmentation is done **before** data reaches frontend
- Sentence boundaries are explicit in data
- All IDs are assigned at content creation time

### Lazy Loading

Pages are loaded on demand:
```typescript
const page = await fetch(`/pages/${pageId}.json`);
```

Only the current page is in memory.

### Virtual Scrolling (Future)

For very long pages, virtualize sentence rendering:
```typescript
<VirtualList items={sentences} renderItem={Sentence} />
```

### Caching

- Pages can be cached in IndexedDB
- Dictionary entries can be cached per-session
- Audio files use browser cache

---

## What This System Does NOT Do

- ❌ Quizzes
- ❌ Games
- ❌ Progress tracking
- ❌ Autoplay
- ❌ Paragraph-level audio
- ❌ Runtime translation APIs
- ❌ Layout recreation from PDF
- ❌ Smart boundary detection
- ❌ Word-level audio

---

## File Structure

```
src/
├── types/
│   ├── schema.ts        # Core data types
│   ├── ui-state.ts      # UI state types
│   └── index.ts
├── components/
│   ├── Word.tsx         # Clickable word
│   ├── Sentence.tsx     # Sentence with translation
│   ├── Section.tsx      # Section grouping
│   ├── Page.tsx         # Top-level state owner
│   ├── WordPopup.tsx    # Dictionary popup
│   └── index.ts
├── styles/
│   └── reading.css      # All styles
└── data/
    └── example-page.json
```
