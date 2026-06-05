/**
 * Internal types — used inside teacher API routes and the builder.
 * The PublicQuestion type below is what the player sees (no answer keys).
 */

export type QuestionType =
  | 'multiple_choice'
  | 'short_text'
  | 'long_answer'
  | 'number'
  | 'dropdown'
  | 'checkbox'
  | 'opinion_scale'
  | 'rating'
  | 'picture_choice'
  | 'image_options'
  | 'image_letters'
  | 'true_false'
  | 'match'
  | 'ordering'
  | 'fill_blanks'
  | 'scramble'
  | 'speaking';

export interface MultipleChoiceOptions {
  choices: string[];
  randomize?: boolean;
  allowMultiple?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndex: number | null;
  correctIndexes?: number[];
}

export interface ShortTextOptions {
  minLength?: number;
  maxLength?: number;
  maxCharactersEnabled?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  /** Used only when test.is_graded; matched case-insensitively after trim */
  correctAnswers?: string[];
}

export interface LongAnswerOptions {
  minLength?: number;
  maxLength?: number;
  maxCharactersEnabled?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

export interface NumberOptions {
  min?: number;
  max?: number;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  /** Used only when test.is_graded */
  correctValue?: number | null;
}

export interface DropdownOptions {
  choices: string[];
  randomize?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndex: number | null;
}

export interface CheckboxOptions {
  choices: string[];
  randomize?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndexes?: number[];
}

export interface OpinionScaleOptions {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

export interface RatingOptions {
  max: number;
  shape?: 'star' | 'heart' | 'number';
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

export interface PictureChoice {
  text: string;
  image_url?: string;
}

export interface PictureChoiceOptions {
  choices: PictureChoice[];
  randomize?: boolean;
  allowMultiple?: boolean;
  /** Fixed number of answer images per row (1-6). Unset = responsive
   *  default (2 on mobile, 5 on desktop). */
  columns?: number;
  /** image_letters only: when true, the (letter-overlaid) images ARE the
   *  clickable answer and the separate letter-button row is hidden. */
  imagesAsAnswers?: boolean;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  correctIndex: number | null;
  correctIndexes?: number[];
}

/** True/False */
export interface TrueFalseOptions {
  /** Used only when test.is_graded */
  correct: boolean | null;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

/** Match — left items paired with right items (storage order = correct order) */
export interface MatchPair {
  left: string;
  right: string;
}
export interface MatchOptions {
  pairs: MatchPair[];
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

/** Ordering — student must drag items into the correct sequence (stored order = correct) */
export interface OrderingOptions {
  items: string[];
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

/** Fill blanks — `template` uses {1}, {2}, … markers; `blanks` is per-marker correct answers */
export interface FillBlank {
  answer: string;
  alternates?: string[];
}
export interface FillBlanksOptions {
  template: string;
  blanks: FillBlank[];
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

/** Scramble — student arranges shuffled tiles (letters or words) to form
 *  the target string. `correctAnswer` is the canonical sentence/word; the
 *  player splits it by the `unit` to produce tiles, then shuffles them
 *  deterministically (stable per question id). */
export interface ScrambleOptions {
  correctAnswer: string;
  unit: 'letters' | 'words';
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

/** Speaking — student records spoken audio; graded on a separate track
 *  against a rubric. The rubric is the answer key and must NOT reach the
 *  player. */
export interface SpeakingRubricCriterion {
  id: string;
  text: string;
  weight: number;
}
export interface SpeakingOptions {
  rubric: SpeakingRubricCriterion[];
  /** Default 30 */
  maxRecordingSeconds: number;
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
}

export interface QuestionMedia {
  type: 'image' | 'gif' | 'video' | 'audio';
  url: string;
  alt?: string;
  provider?: 'upload' | 'external' | 'youtube' | 'vimeo';
  layoutMobile?: 'stack' | 'float' | 'split' | 'wallpaper';
  layoutDesktop?: 'stack' | 'float-left' | 'float-right' | 'split-left' | 'split-right' | 'wallpaper';
  aspectRatio?: 'free' | 'original' | 'portrait' | 'square' | 'landscape' | 'circle' | '1:1' | '4:3' | '16:9' | '3:4';
  naturalAspectRatio?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: 0 | 90 | 180 | 270;
  flipX?: boolean;
  flipY?: boolean;
}

export type QuestionOptions =
  | MultipleChoiceOptions
  | ShortTextOptions
  | LongAnswerOptions
  | NumberOptions
  | DropdownOptions
  | CheckboxOptions
  | OpinionScaleOptions
  | RatingOptions
  | PictureChoiceOptions
  | TrueFalseOptions
  | MatchOptions
  | OrderingOptions
  | FillBlanksOptions
  | ScrambleOptions
  | SpeakingOptions;

export interface TestQuestion {
  id: string;
  test_id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions;
  required: boolean;
  /** When true the question is excluded from the public player and
   *  grading but kept in the builder so the author can restore it. */
  hidden?: boolean;
  /** Optional FK to `test_sections.id`. Null = unsectioned, renders
   *  under a synthetic "All questions" group in the builder. */
  section_id?: string | null;
  created_at: string;
}

/** Per-test ordered group of questions, optionally with its own
 *  continuous listening audio. A test with zero section rows behaves
 *  exactly like stage (a) — sectionless tests are unchanged. */
export interface TestSection {
  id: string;
  test_id: string;
  position: number;
  title: string;
  audio_url: string | null;
  created_at: string;
}

/** Public-facing section, returned with the test on `GET /api/t/[slug]`. */
export interface PublicSection {
  id: string;
  position: number;
  title: string;
  audio_url: string | null;
}

export interface Test {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string;
  theme?: TestThemeConfig | null;
  welcome_screen?: TestScreenConfig | null;
  end_screen?: TestScreenConfig | null;
  timer_enabled?: boolean;
  time_limit_seconds?: number | null;
  /* Presentation mode. 'card' = one question per screen (default,
     Typeform-style). 'scroll' = all questions stacked on one
     scrollable page (IELTS/SurveyMonkey-style listening exams). */
  layout?: 'card' | 'scroll';
  /* Single continuous audio track played while the student works
     through a scroll-mode test (listening exams). Stored as a
     test-media public URL. Used when the test has no `test_sections`
     rows — when sections exist, each section carries its own audio
     and this field is ignored. */
  listening_audio_url?: string | null;
  /* Forward-only navigation + play-once audio when true (IELTS-style
     exam mode). When false, students can navigate freely between
     sections and replay audio. Defaults to false so stage-(a) tests
     behave identically. */
  strict_sections?: boolean;
  /* Listening audio plays once: no seek/replay, and consumption is
     persisted per respondent so a page refresh can't replay it.
     Independent of `strict_sections`. Defaults to false. */
  play_once_audio?: boolean;
  /** When true: the test-taker can't advance past a section until that
   *  section's audio has played through once (per-section / global track). */
  audio_lock?: boolean;
  /** When true: answer choices with Chinese characters render pinyin above
   *  each character (auto-generated). For HSK / Chinese-learner tests. */
  show_pinyin?: boolean;
  is_graded: boolean;
  is_published: boolean;
  published_at: string | null;
  /* Marketplace metadata. When `is_marketplace = true` this test is
     listed publicly under /api/marketplace; buyers get a duplicate
     into their own workspace on admin approval. Owner-managed (any
     test owner can set the flag, but in practice only admin curates
     the marketplace). */
  is_marketplace?: boolean;
  marketplace_price?: number | null;       // soums
  marketplace_summary?: string | null;     // catalog listing description
  /* Workspace membership. null = the default 'My workspace' bucket;
     a uuid = a user-created workspace (test_workspaces.id). */
  workspace_id?: string | null;
  /* Completed-response count. Populated only by GET /api/tests; not a
     persisted column on the tests table. */
  response_count?: number;
  created_at: string;
  updated_at: string;
}

/* User-created folder for organizing tests. Backed by the
   test_workspaces table. The default workspace is represented by
   workspace_id = null on a test (no row), not a stored record. */
export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  position: number;
  created_at: string;
}

export const FREE_WORKSPACE_LIMIT = 3;

export interface TestScreenConfig {
  enabled: boolean;
  title: string;
  description?: string;
  buttonText?: string;
  imageUrl?: string;
  showTimeToComplete?: boolean;
  timeToCompleteText?: string;
  collectFirstName?: boolean;
  collectLastName?: boolean;
  collectPhone?: boolean;
  collectEmail?: boolean;
  collectorLayout?: 'left' | 'right';
  showSocialShare?: boolean;
  buttonLinkEnabled?: boolean;
  buttonLink?: string;
}

export interface TestThemeConfig {
  themeName?: string;
  backgroundColor?: string;
  questionColor?: string;
  descriptionColor?: string;
  answerTextColor?: string;
  answerColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontScale?: 'small' | 'medium' | 'large';
  fontFamily?: 'system' | 'inter' | 'noto-sans' | 'arial' | 'helvetica' | 'tahoma' | 'calibri' | 'verdana' | 'trebuchet' | 'lucida-sans' | 'gill-sans' | 'futura' | 'optima' | 'avenir' | 'georgia' | 'garamond' | 'palatino' | 'baskerville' | 'cambria' | 'book-antiqua' | 'times' | 'didot' | 'rockwell' | 'courier' | 'lucida-console' | 'mono' | 'impact' | 'comic-sans' | 'copperplate' | 'brush-script' | 'serif';
  answerRadius?: 'sharp' | 'soft' | 'round';
  backgroundImageUrl?: string;
}

/* ── Public-facing (sent to the player) — no answer keys ──────────────── */

export interface PublicMcOptions {
  choices: PublicChoice[];
  allowMultiple?: boolean;
}
export interface PublicShortTextOptions {
  minLength?: number;
  maxLength?: number;
}
export interface PublicLongAnswerOptions {
  minLength?: number;
  maxLength?: number;
}
export interface PublicNumberOptions {
  min?: number;
  max?: number;
}
export interface PublicPictureChoiceOptions {
  choices: PublicPictureChoice[];
  allowMultiple?: boolean;
  columns?: number;
  /** image_letters only — see PictureChoiceOptions.imagesAsAnswers. */
  imagesAsAnswers?: boolean;
  /** image_options (matching) only: the order (choice ids) in which to
   *  render the description list, shuffled per respondent so it doesn't line
   *  up with the image grid. */
  answerOrder?: string[];
}

/** One character of pinyin-annotated text (char + its pinyin; pinyin is ''
 *  for non-Han characters). Lives here — not in pinyin.ts — so this types
 *  file never pulls in the pinyin-pro library on the client. */
export interface PinyinSegment {
  c: string;
  p: string;
}

export interface PublicChoice {
  id: string;
  text: string;
  /** Present only when the test has "Show pinyin" on and the text has Han
   *  characters. Server-generated so the player never bundles pinyin-pro. */
  pinyin?: PinyinSegment[];
}

export interface PublicPictureChoice extends PublicChoice {
  image_url?: string;
}

export interface PublicTrueFalseOptions {}

export interface PublicMatchLeft {
  id: string;
  text: string;
  /** image_options matching: the left item is an image (description goes on
   *  the right). */
  image_url?: string;
}
export interface PublicMatchRight {
  id: string;
  text: string;
}
export interface PublicMatchOptions {
  left: PublicMatchLeft[];
  right: PublicMatchRight[];
}

export interface PublicOrderingItem {
  id: string;
  text: string;
}
export interface PublicOrderingOptions {
  items: PublicOrderingItem[];
}

export interface PublicFillBlanksOptions {
  template: string;
  blanks: number;
  blankWidths?: number[];
}

export interface PublicScrambleTile {
  id: string;
  text: string;
}
export interface PublicScrambleOptions {
  /** Pre-shuffled tiles (deterministic per question id). */
  tiles: PublicScrambleTile[];
  unit: 'letters' | 'words';
}

export interface PublicDropdownOptions {
  choices: PublicChoice[];
}

export interface PublicCheckboxOptions {
  choices: PublicChoice[];
}

export interface PublicOpinionScaleOptions {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface PublicRatingOptions {
  max: number;
  shape?: 'star' | 'heart' | 'number';
}

/** Speaking — rubric stripped (answer key); only recording cap reaches the player. */
export interface PublicSpeakingOptions {
  maxRecordingSeconds: number;
}

export interface PublicQuestion {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  /** Per-character pinyin for `prompt` — present only when the test has
   *  "Show pinyin" on and the prompt has Han characters (server-generated). */
  promptPinyin?: PinyinSegment[];
  description?: string;
  /** Optional directive shown ABOVE the question text (e.g. "Read and
   *  select the best option."). Stored in options.instruction. */
  instruction?: string;
  /** When true + this question has audio media: the test-taker can't advance
   *  to the next question until that audio has played through once. Stored in
   *  options.audioMustFinish. */
  audioMustFinish?: boolean;
  /** When true + this question has audio media: the audio plays straight
   *  through ONCE — no pause, seek, or replay — and a refresh re-locks it
   *  ("Audio already played"). Mirrors the listening-track play-once.
   *  Stored in options.audioPlayOnce. */
  audioPlayOnce?: boolean;
  /** When true this is a worked EXAMPLE (HSK-style): the answer is shown
   *  pre-selected, the inputs are locked, and it's excluded from the score.
   *  Stored in options.isExample. */
  isExample?: boolean;
  /** For an example question, the correct answer in the player's submission
   *  shape — used to render it pre-selected. Only sent when isExample. */
  exampleValue?: AnswerSubmission['value'];
  media?: QuestionMedia;
  audioMedia?: QuestionMedia;
  required: boolean;
  /** Same FK as the builder side. Player groups questions by this id
   *  (or by "unsectioned" when null). */
  section_id?: string | null;
  options:
    | PublicMcOptions
    | PublicShortTextOptions
    | PublicPictureChoiceOptions
    | PublicTrueFalseOptions
    | PublicMatchOptions
    | PublicOrderingOptions
    | PublicFillBlanksOptions
    | PublicScrambleOptions
    | PublicLongAnswerOptions
    | PublicNumberOptions
    | PublicDropdownOptions
    | PublicCheckboxOptions
    | PublicOpinionScaleOptions
    | PublicRatingOptions
    | PublicSpeakingOptions;
}

export interface PublicTest {
  id: string;
  slug: string;
  title: string;
  description: string;
  theme?: TestThemeConfig | null;
  welcome_screen?: TestScreenConfig | null;
  end_screen?: TestScreenConfig | null;
  timer_enabled?: boolean;
  time_limit_seconds?: number | null;
  layout?: 'card' | 'scroll';
  listening_audio_url?: string | null;
  /* When true: forward-only navigation across sections + play-once
     audio per section. When false (default): free back/next. Only
     meaningful when `sections.length > 0`. */
  strict_sections?: boolean;
  /* Listening audio plays once (no seek/replay; consumption persisted per
     respondent so refresh can't replay). Independent of strict_sections. */
  play_once_audio?: boolean;
  /** When true: the test-taker can't advance past a section until that
   *  section's audio has played through once (per-section / global track). */
  audio_lock?: boolean;
  /** When true: answer choices render auto-generated pinyin above Chinese. */
  show_pinyin?: boolean;
  /* Ordered list of the test's sections (empty if the test is
     sectionless). Each question's `section_id` references one of
     these ids. */
  sections?: PublicSection[];
  is_graded: boolean;
  questions: PublicQuestion[];
  /* True when the test owner does NOT have an active subscription —
     used to show the "Made with Blim" badge on free-tier tests. */
  show_branding?: boolean;
}

/* ── Submission shape ─────────────────────────────────────────────────── */

export interface AnswerSubmission {
  question_id: string;
  /** Per-type:
   *  - multiple_choice / picture_choice: { selected: number }
   *  - multiple_choice / picture_choice with randomized or multiple selection:
   *    { selectedId: string } or { selectedIds: string[] }
   *  - short_text / long_answer / number: { text: string }
   *  - dropdown: { selectedId: string }
   *  - checkbox: { selectedIds: string[] }
   *  - opinion_scale / rating: { selected: number }
   *  - true_false: { bool: boolean }
   *  - match: { pairs: { leftIndex: number; rightId: string }[] }
   *    Legacy accepted: { matches: string[] } where matches[leftIndex] = selected right item id
   *  - ordering: { order: string[] }  // student's chosen order (array of public item ids)
   *  - fill_blanks: { blanks: string[] }
   *  - speaking: { recorded: boolean }  // graded on a separate track
   */
  value: {
    selected?: number;
    selectedId?: string;
    selectedIds?: string[];
    text?: string;
    bool?: boolean;
    pairs?: { leftIndex: number; rightId: string }[];
    matches?: string[];
    order?: string[];
    blanks?: string[];
    tileIds?: string[];
    recorded?: boolean;
  };
}

export interface ResponseSubmission {
  respondent_token: string;
  respondent_name?: string;
  respondent_profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  started_at?: string;
  timed_out?: boolean;
  answers: AnswerSubmission[];
}
