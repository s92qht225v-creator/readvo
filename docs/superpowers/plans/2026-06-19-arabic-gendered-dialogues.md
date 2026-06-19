# Arabic Gendered Dialogues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.
>
> **No unit-test harness in this repo** (no vitest/jest). Do NOT add one. Verify with `npm run build`, throwaway `node -e` checks for pure logic, the `preview_*` tools (catalog/public surfaces), and production `curl`. The gendered reader is login-gated, so its interaction is verified by build + code review + a logged-in spot-check by the user.

**Goal:** Add an opt-in male↔female (MM/WW) toggle to the Arabic dialogue reader — a round 👨/👩 button above the play FAB that flips every line's Arabic wording **and** the TTS voice between two men and two women.

**Architecture:** Content sentences carry both gender wordings (`ar_m`/`ar_f` + transliterations). `ArabicDialogueReader` holds a `genderMode` state, maps each API sentence to the current-mode `ReaderSentence` (text + a per-sentence `voice`), and renders the 👨/👩 toggle into a new `fabExtra` slot on `ReaderCore`. `/api/tts-ar` + `resolveTtsUrlAr` gain a `voice` parameter (folded into the cache key). Chinese reader untouched; non-gendered Arabic dialogues render exactly as today (no toggle).

**Tech Stack:** Next.js 16, TypeScript, OpenAI TTS, Supabase Storage.

**Scope:** MM/WW gendered dialogues + the toggle + voice wiring + one migrated sample. **Deferred:** mixed (man↔woman), gendered flashcards, recorded human audio.

---

### Task 0: Branch

- [ ] `git checkout main && git pull --ff-only origin main && git checkout -b arabic-gendered-dialogues`
- [ ] `npm run build` (baseline green).

---

### Task 1: Voice param in the TTS route + client resolver

**Files:**
- Modify: `src/app/api/tts-ar/route.ts`
- Modify: `src/utils/ttsAudioAr.ts`

- [ ] **Step 1: add a `voice` param + per-voice cache path to the route.**

In `src/app/api/tts-ar/route.ts`, replace the `TTS_PREFIX`/`storagePath` and the request parsing + OpenAI call so the voice is honored and cached separately. The file currently hardcodes `voice: 'alloy'` and `TTS_PREFIX = 'ar/tts'`. New version:

```ts
const BUCKET = 'audio';
const TTS_PREFIX = 'ar/tts';
const ALLOWED_VOICES = new Set(['alloy', 'echo', 'onyx', 'nova', 'shimmer', 'fable']);

function storagePath(text: string, voice: string): string {
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return `${TTS_PREFIX}/${voice}/${hex}.mp3`;
}
```

In `POST`, parse + validate the voice (default `alloy` for back-compat), and use it in both `storagePath(...)` calls and the OpenAI body:

```ts
  const { text, voice: rawVoice } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }
  const voice = typeof rawVoice === 'string' && ALLOWED_VOICES.has(rawVoice) ? rawVoice : 'alloy';

  const supabase = getSupabaseAdmin();
  const path = storagePath(text, voice);
```

…and the OpenAI request body uses `voice` instead of the literal:

```ts
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' }),
```

Read the current file first and keep the rest (cookie gate, cache-first download, upload, data-URL fallback) unchanged — only the voice + path lines change.

- [ ] **Step 2: pass `voice` from the client resolver.**

In `src/utils/ttsAudioAr.ts`, change the signature + cache key + request body to include voice (default `alloy`):

```ts
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/** Resolve a playable Arabic TTS URL for `text` in `voice` (Supabase-cached, memoized). */
export async function resolveTtsUrlAr(text: string, voice = 'alloy'): Promise<string | null> {
  const key = `${voice}:${(text ?? '').trim()}`;
  const raw = (text ?? '').trim();
  if (!raw) return null;
  const cached = cache.get(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/tts-ar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: raw, voice }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.url) { cache.set(key, data.url); return data.url; }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
```

(`voice` defaults to `alloy`, so the existing single-arg callers — the flashcard deck — keep working unchanged.)

- [ ] **Step 3: build + commit.** `npm run build` (expect `ƒ /api/tts-ar`). Then:
```bash
git add src/app/api/tts-ar/route.ts src/utils/ttsAudioAr.ts
git commit -m "feat(arabic): voice param in TTS route + resolver (per-voice cache)"
```

---

### Task 2: Gendered content types + migrate the sample dialogue

**Files:**
- Modify: `src/services/arabicContent.ts` (extend `ArabicSentence`)
- Modify: `content/arabic/dialogues/a1/greetings.json` (add gender wordings)

- [ ] **Step 1: extend `ArabicSentence`** in `src/services/arabicContent.ts`. Make the gender wordings optional (so non-gendered dialogues are still valid) and keep the legacy `ar`/`translit` optional:

```ts
export interface ArabicSentence {
  id: string;
  speaker?: 'A' | 'B';
  // Gendered wording (present → the dialogue is gendered):
  ar_m?: string;
  translit_m?: string;
  ar_f?: string;
  translit_f?: string;
  // Legacy single-gender wording (present when not gendered):
  ar?: string;
  translit?: string;
  text_translation_uz: string;
  text_translation_ru: string;
  text_translation_en: string;
  audio_url?: string;
}
```

- [ ] **Step 2: migrate the sample** `content/arabic/dialogues/a1/greetings.json` to gendered form. The IMPLEMENTER authors the Arabic (do not copy Arabic from this plan — combining marks corrupt in transit). For each of the 4 lines, provide BOTH a male-version (`ar_m`/`translit_m`, used when both speakers are men) and a female-version (`ar_f`/`translit_f`, both women), fully vowelized, with correct agreement. Keep `id`, `speaker`, and the shared `text_translation_*`. Example shape for one line (you fill all 4 with correct MSA):

```json
{
  "id": "s3", "speaker": "A",
  "ar_m": "<male: kayfa ḥāluka? vowelized>",  "translit_m": "kayfa ḥāluka?",
  "ar_f": "<female: kayfa ḥāluki? vowelized>", "translit_f": "kayfa ḥāluki?",
  "text_translation_uz": "Qalaysiz?", "text_translation_ru": "Как дела?", "text_translation_en": "How are you?"
}
```

Guidance for the 4 lines (greetings):
- s1 A: "as-salāmu ʿalaykum" — same for both genders (no inflection) → `ar_m` and `ar_f` identical.
- s2 B: "wa-ʿalaykumu s-salām" — same both → identical.
- s3 A: "kayfa ḥāluka?" (m) / "kayfa ḥāluki?" (f).
- s4 B: "anā bi-khayrin, shukran" (m) / "anā bi-khayrin, shukran" — the adjective ـ"bi-khayr" is invariant here, so identical; if you choose a gendered self-description instead, make `ar_m`/`ar_f` differ correctly and report it.

- [ ] **Step 3: verify** the JSON parses, every line has both gender fields vowelized, and at least one line actually differs between genders (proving the toggle will show a change):
```bash
node --input-type=module -e "
import fs from 'fs';
const d=JSON.parse(fs.readFileSync('content/arabic/dialogues/a1/greetings.json','utf8'));
const T=/[ً-ْٰ]/g;
const okFields=d.sentences.every(s=>s.ar_m&&s.translit_m&&s.ar_f&&s.translit_f&&s.text_translation_en);
const vow=d.sentences.every(s=>s.ar_m.replace(T,'').length<s.ar_m.length && s.ar_f.replace(T,'').length<s.ar_f.length);
const differs=d.sentences.some(s=>s.ar_m!==s.ar_f);
console.log('fields:',okFields,'vowelized:',vow,'differs:',differs);
"
```
Expected: `fields: true vowelized: true differs: true`. All three MUST be true.

- [ ] **Step 4: build + commit.** `npm run build`. Then:
```bash
git add src/services/arabicContent.ts content/arabic/dialogues/a1/greetings.json
git commit -m "feat(arabic): gendered sentence type + migrate greetings to MM/WW"
```

---

### Task 3: `fabExtra` slot in `ReaderCore`

**Files:**
- Modify: `src/components/reader/ReaderCore.tsx`
- Modify: `src/lib/reader/scriptConfig.tsx` (`ReaderSentence` gains `voice`)

- [ ] **Step 1: add `voice` to `ReaderSentence`** in `src/lib/reader/scriptConfig.tsx`. Add the optional field to the interface (do not change anything else):

```ts
  audioText: string;     // text sent to TTS when no recorded audioUrl
  audioUrl?: string;
  voice?: string;        // optional TTS voice (Arabic gendered speakers)
```

- [ ] **Step 2: add an optional `fabExtra` prop to `ReaderCore`** and render it directly above the play FAB. In `src/components/reader/ReaderCore.tsx`, extend the props:

```tsx
interface ReaderCoreProps {
  config: ScriptConfig;
  sentences: ReaderSentence[];
  resolveAudio: (s: ReaderSentence) => Promise<string | null>;
  labels: { translation: string };
  fabExtra?: React.ReactNode;
}
```

Destructure it: `export function ReaderCore({ config, sentences, resolveAudio, labels, fabExtra }: ReaderCoreProps) {`

Then render it immediately before the existing `{sentences.length > 0 && (<button className="story__play-fab" ...>)}` block:

```tsx
      {fabExtra}

      {sentences.length > 0 && (
        <button
          className={`story__play-fab ${isLoadingAudio ? 'story__play-fab--loading' : ''}`}
          ...
```

(Leave the play FAB and everything else unchanged.)

- [ ] **Step 3: build + commit.** `npm run build` (reader route stays `●`). Then:
```bash
git add src/components/reader/ReaderCore.tsx src/lib/reader/scriptConfig.tsx
git commit -m "feat(arabic): ReaderCore fabExtra slot + ReaderSentence.voice"
```

---

### Task 4: Gender toggle CSS (round button above the play FAB)

**Files:**
- Modify: `src/styles/arabic.css`

- [ ] **Step 1: add the gender FAB styles.** Append to `src/styles/arabic.css`. The button stacks above the play FAB (which is `bottom: 80px`), is solid (not faded), and uses the accent color so it's green under `.theme-ar`:

```css
/* Gender toggle FAB (stacked above the play-all FAB) */
.ar-gender-fab {
  position: fixed;
  bottom: 148px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--color-accent, #2E8B57);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 80;
}
.ar-gender-fab:active { transform: scale(0.94); }
```

- [ ] **Step 2: commit** (used by the next task):
```bash
git add src/styles/arabic.css
git commit -m "feat(arabic): gender toggle FAB styles"
```

---

### Task 5: Wire gender mode + the toggle into `ArabicDialogueReader`

**Files:**
- Modify: `src/components/reader/ArabicDialogueReader.tsx`

- [ ] **Step 1: read the current file** to anchor the edits (`ApiSentence`, the `sentences` mapping, the `resolveAudio` callback, the `<ReaderCore .../>` usage).

- [ ] **Step 2: extend the API sentence type + add gender state + helpers.** Replace the `ApiSentence` interface and add the gender logic. The API sentence now carries the gender wordings:

```tsx
interface ApiSentence {
  id: string;
  speaker?: 'A' | 'B';
  ar_m?: string; translit_m?: string;
  ar_f?: string; translit_f?: string;
  ar?: string; translit?: string;
  text_translation_uz: string; text_translation_ru: string; text_translation_en: string;
  audio_url?: string;
}
```

Inside the component, after the existing state, add:

```tsx
  const [genderMode, setGenderMode] = useState<'m' | 'f'>('m');

  // A dialogue is gendered iff any sentence carries both gender wordings.
  const isGendered = (dialogue?.sentences ?? []).some((s) => s.ar_m && s.ar_f);

  // OpenAI voice per (mode, speaker): male onyx/echo, female nova/shimmer.
  const voiceFor = (speaker: 'A' | 'B' | undefined): string =>
    genderMode === 'm' ? (speaker === 'B' ? 'echo' : 'onyx') : (speaker === 'B' ? 'shimmer' : 'nova');

  const arOf = (s: ApiSentence): string =>
    genderMode === 'm' ? (s.ar_m ?? s.ar ?? '') : (s.ar_f ?? s.ar ?? '');
  const translitOf = (s: ApiSentence): string =>
    genderMode === 'm' ? (s.translit_m ?? s.translit ?? '') : (s.translit_f ?? s.translit ?? '');
```

- [ ] **Step 3: map sentences using the current gender + per-sentence voice.** Replace the existing `const sentences: ReaderSentence[] = ...map(...)` with:

```tsx
  const sentences: ReaderSentence[] = (dialogue?.sentences ?? []).map((s) => ({
    id: s.id,
    text: arOf(s),
    translit: translitOf(s),
    translation: trOf(s, language),
    speaker: s.speaker,
    audioText: arOf(s),
    audioUrl: s.audio_url,
    voice: isGendered ? voiceFor(s.speaker) : undefined,
  }));
```

- [ ] **Step 4: make `resolveAudio` use the sentence voice.** Replace the existing `resolveAudio` callback with:

```tsx
  const resolveAudio = useCallback(
    (s: ReaderSentence) => resolveTtsUrlAr(s.audioText, s.voice),
    [],
  );
```

(`resolveTtsUrlAr` now takes an optional `voice`; `s.voice` is `undefined` for non-gendered dialogues → defaults to `alloy`, unchanged behaviour.)

- [ ] **Step 5: pass the gender toggle into `ReaderCore`.** Change the `<ReaderCore ... />` usage to pass `fabExtra` only when the dialogue is gendered:

```tsx
          <ReaderCore
            config={arabicScriptConfig}
            sentences={sentences}
            resolveAudio={resolveAudio}
            labels={{ translation: ({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language] }}
            fabExtra={isGendered ? (
              <button
                type="button"
                className="ar-gender-fab"
                onClick={() => setGenderMode((g) => (g === 'm' ? 'f' : 'm'))}
                aria-label={genderMode === 'm' ? 'Switch to female version' : 'Switch to male version'}
              >
                {genderMode === 'm' ? '👨' : '👩'}
              </button>
            ) : undefined}
          />
```

- [ ] **Step 6: build + commit.** `npm run build` (reader route stays `●` SSG). Then:
```bash
git add src/components/reader/ArabicDialogueReader.tsx
git commit -m "feat(arabic): gender toggle + per-speaker voice in dialogue reader"
```

---

### Task 6: Verify + ship (controller)

- [ ] **Step 1: build gate.** `npm run build` — `● /[locale]/arabic/dialogues/[level]/[slug]`; `ƒ /api/tts-ar`; Chinese routes unchanged.
- [ ] **Step 2: logged-in spot-check (user).** On `…/uz/arabic/dialogues/a1/greetings` logged in: the 👨 button shows above ▶; tapping it flips line 3 between *ḥāluka* and *ḥāluki* (and the transliteration); ▶ / tapping a line plays a male voice in 👨 mode, a female voice in 👩 mode, with A and B distinct. A non-gendered dialogue (none exist yet besides greetings, so this is N/A until more content) shows no button.
- [ ] **Step 3: merge + deploy.**
```bash
git checkout main && git merge --ff-only arabic-gendered-dialogues && git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
- [ ] **Step 4: production curl** (gate unaffected):
```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/arabic/dialogues/a1/greetings"   # 307 -> /login
curl -s -o /dev/null -w "%{http_code}\n" "https://blim.uz/uz/arabic/dialogues"                                   # 200 public
```

---

## Deferred (not in this plan)
- Mixed (man↔woman) dialogues.
- Gendered flashcards.
- Recorded human audio for gendered lines (TTS only; reader already prefers `audio_url` if added).
- Auto-replay on gender flip (v1 stops audio; user re-taps).
