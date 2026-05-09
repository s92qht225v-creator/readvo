export type TestFontScale = 'small' | 'medium' | 'large';

export interface TestThemeConfig {
  backgroundColor?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  fontScale?: TestFontScale;
}

export const DEFAULT_TEST_THEME: Required<TestThemeConfig> = {
  backgroundColor: '#ffffff',
  questionColor: '#000000',
  answerColor: '#0445af',
  buttonColor: '#2f2533',
  fontScale: 'medium',
};

const FONT_SCALE: Record<TestFontScale, string> = {
  small: '0.92',
  medium: '1',
  large: '1.1',
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

export function normalizeTestTheme(input: unknown): Required<TestThemeConfig> {
  const raw = input && typeof input === 'object' ? input as TestThemeConfig : {};
  return {
    backgroundColor: cleanHex(raw.backgroundColor, DEFAULT_TEST_THEME.backgroundColor),
    questionColor: cleanHex(raw.questionColor, DEFAULT_TEST_THEME.questionColor),
    answerColor: cleanHex(raw.answerColor, DEFAULT_TEST_THEME.answerColor),
    buttonColor: cleanHex(raw.buttonColor, DEFAULT_TEST_THEME.buttonColor),
    fontScale: cleanFontScale(raw.fontScale),
  };
}

export function testThemeCssVars(input: unknown): Record<string, string> {
  const theme = normalizeTestTheme(input);
  return {
    '--test-theme-bg': theme.backgroundColor,
    '--test-theme-question': theme.questionColor,
    '--test-theme-answer': theme.answerColor,
    '--test-theme-button': theme.buttonColor,
    '--test-theme-font-scale': FONT_SCALE[theme.fontScale],
  };
}
