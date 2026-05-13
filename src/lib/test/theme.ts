export type TestFontScale = 'small' | 'medium' | 'large';
export type TestFontFamily =
  | 'system'
  | 'inter'
  | 'noto-sans'
  | 'arial'
  | 'verdana'
  | 'trebuchet'
  | 'georgia'
  | 'garamond'
  | 'times'
  | 'courier'
  | 'mono'
  | 'serif';
export type TestCornerRadius = 'sharp' | 'soft' | 'round';

export interface TestThemeConfig {
  themeName?: string;
  backgroundColor?: string;
  questionColor?: string;
  descriptionColor?: string;
  answerTextColor?: string;
  answerColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontScale?: TestFontScale;
  fontFamily?: TestFontFamily;
  answerRadius?: TestCornerRadius;
  backgroundImageUrl?: string;
}

export const DEFAULT_TEST_THEME: Required<TestThemeConfig> = {
  themeName: 'My new theme',
  backgroundColor: '#ffffff',
  questionColor: '#000000',
  descriptionColor: '#8b848f',
  answerTextColor: '#0445af',
  answerColor: '#0445af',
  buttonColor: '#2f2533',
  buttonTextColor: '#ffffff',
  fontScale: 'medium',
  fontFamily: 'system',
  answerRadius: 'sharp',
  backgroundImageUrl: '',
};

const FONT_SCALE: Record<TestFontScale, string> = {
  small: '0.92',
  medium: '1',
  large: '1.1',
};

const FONT_FAMILY: Record<TestFontFamily, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  inter: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'noto-sans': '"Noto Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  arial: 'Arial, Helvetica, sans-serif',
  verdana: 'Verdana, Geneva, sans-serif',
  trebuchet: '"Trebuchet MS", Arial, sans-serif',
  georgia: 'Georgia, "Times New Roman", serif',
  garamond: 'Garamond, "Times New Roman", serif',
  times: '"Times New Roman", Times, serif',
  courier: '"Courier New", Courier, monospace',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  serif: 'Georgia, "Times New Roman", serif',
};

function isTestFontFamily(value: unknown): value is TestFontFamily {
  return typeof value === 'string' && value in FONT_FAMILY;
}

const ANSWER_RADIUS: Record<TestCornerRadius, string> = {
  sharp: '0px',
  soft: '6px',
  round: '999px',
};

function cleanHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function cleanFontScale(value: unknown): TestFontScale {
  return value === 'small' || value === 'large' || value === 'medium'
    ? value
    : DEFAULT_TEST_THEME.fontScale;
}

function cleanFontFamily(value: unknown): TestFontFamily {
  return isTestFontFamily(value)
    ? value
    : DEFAULT_TEST_THEME.fontFamily;
}

function cleanRadius(value: unknown): TestCornerRadius {
  return value === 'soft' || value === 'round' || value === 'sharp'
    ? value
    : DEFAULT_TEST_THEME.answerRadius;
}

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeTestTheme(input: unknown): Required<TestThemeConfig> {
  const raw = input && typeof input === 'object' ? input as TestThemeConfig : {};
  return {
    backgroundColor: cleanHex(raw.backgroundColor, DEFAULT_TEST_THEME.backgroundColor),
    themeName: cleanString(raw.themeName) || DEFAULT_TEST_THEME.themeName,
    questionColor: cleanHex(raw.questionColor, DEFAULT_TEST_THEME.questionColor),
    descriptionColor: cleanHex(raw.descriptionColor, DEFAULT_TEST_THEME.descriptionColor),
    answerTextColor: cleanHex(raw.answerTextColor, DEFAULT_TEST_THEME.answerTextColor),
    answerColor: cleanHex(raw.answerColor, DEFAULT_TEST_THEME.answerColor),
    buttonColor: cleanHex(raw.buttonColor, DEFAULT_TEST_THEME.buttonColor),
    buttonTextColor: cleanHex(raw.buttonTextColor, DEFAULT_TEST_THEME.buttonTextColor),
    fontScale: cleanFontScale(raw.fontScale),
    fontFamily: cleanFontFamily(raw.fontFamily),
    answerRadius: cleanRadius(raw.answerRadius),
    backgroundImageUrl: cleanString(raw.backgroundImageUrl),
  };
}

export function testThemeCssVars(input: unknown): Record<string, string> {
  const theme = normalizeTestTheme(input);
  return {
    '--test-theme-bg': theme.backgroundColor,
    '--test-theme-question': theme.questionColor,
    '--test-theme-description': theme.descriptionColor,
    '--test-theme-answer-text': theme.answerTextColor,
    '--test-theme-answer': theme.answerColor,
    '--test-theme-button': theme.buttonColor,
    '--test-theme-button-text': theme.buttonTextColor,
    '--test-theme-font-scale': FONT_SCALE[theme.fontScale],
    '--test-theme-font-family': FONT_FAMILY[theme.fontFamily],
    '--test-theme-answer-radius': ANSWER_RADIUS[theme.answerRadius],
    '--test-theme-bg-image': theme.backgroundImageUrl ? `url("${theme.backgroundImageUrl}")` : 'none',
  };
}
