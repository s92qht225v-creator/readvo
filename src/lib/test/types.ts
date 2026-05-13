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
  | 'true_false'
  | 'match'
  | 'ordering'
  | 'fill_blanks';

export interface MultipleChoiceOptions {
  choices: string[];
  randomize?: boolean;
  allowMultiple?: boolean;
  media?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndex: number | null;
  correctIndexes?: number[];
}

export interface ShortTextOptions {
  minLength?: number;
  maxLength?: number;
  maxCharactersEnabled?: boolean;
  media?: QuestionMedia;
  /** Used only when test.is_graded; matched case-insensitively after trim */
  correctAnswers?: string[];
}

export interface LongAnswerOptions {
  minLength?: number;
  maxLength?: number;
  maxCharactersEnabled?: boolean;
  media?: QuestionMedia;
}

export interface NumberOptions {
  min?: number;
  max?: number;
  media?: QuestionMedia;
  /** Used only when test.is_graded */
  correctValue?: number | null;
}

export interface DropdownOptions {
  choices: string[];
  randomize?: boolean;
  media?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndex: number | null;
}

export interface CheckboxOptions {
  choices: string[];
  randomize?: boolean;
  media?: QuestionMedia;
  /** Used only when test.is_graded */
  correctIndexes?: number[];
}

export interface OpinionScaleOptions {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  media?: QuestionMedia;
}

export interface RatingOptions {
  max: number;
  shape?: 'star' | 'heart' | 'number';
  media?: QuestionMedia;
}

export interface PictureChoice {
  text: string;
  image_url?: string;
}

export interface PictureChoiceOptions {
  choices: PictureChoice[];
  randomize?: boolean;
  allowMultiple?: boolean;
  media?: QuestionMedia;
  correctIndex: number | null;
  correctIndexes?: number[];
}

/** True/False */
export interface TrueFalseOptions {
  /** Used only when test.is_graded */
  correct: boolean | null;
  media?: QuestionMedia;
}

/** Match — left items paired with right items (storage order = correct order) */
export interface MatchPair {
  left: string;
  right: string;
}
export interface MatchOptions {
  pairs: MatchPair[];
  media?: QuestionMedia;
}

/** Ordering — student must drag items into the correct sequence (stored order = correct) */
export interface OrderingOptions {
  items: string[];
  media?: QuestionMedia;
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
  | FillBlanksOptions;

export interface TestQuestion {
  id: string;
  test_id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions;
  required: boolean;
  created_at: string;
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
  is_graded: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

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
}

export interface PublicChoice {
  id: string;
  text: string;
}

export interface PublicPictureChoice extends PublicChoice {
  image_url?: string;
}

export interface PublicTrueFalseOptions {}

export interface PublicMatchLeft {
  id: string;
  text: string;
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

export interface PublicQuestion {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  description?: string;
  media?: QuestionMedia;
  required: boolean;
  options:
    | PublicMcOptions
    | PublicShortTextOptions
    | PublicPictureChoiceOptions
    | PublicTrueFalseOptions
    | PublicMatchOptions
    | PublicOrderingOptions
    | PublicFillBlanksOptions
    | PublicLongAnswerOptions
    | PublicNumberOptions
    | PublicDropdownOptions
    | PublicCheckboxOptions
    | PublicOpinionScaleOptions
    | PublicRatingOptions;
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
  is_graded: boolean;
  questions: PublicQuestion[];
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
