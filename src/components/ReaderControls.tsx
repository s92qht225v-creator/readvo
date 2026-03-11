'use client';

/**
 * ReaderControls - Header Control Buttons
 *
 * Renders the control buttons (pinyin, translation, font size, language) for the header.
 * State is managed by parent component.
 */

import React from 'react';
import type { Language } from '@/types/ui-state';

export interface ReaderControlsProps {
  /** Whether pinyin is visible */
  isPinyinVisible: boolean;
  /** Callback to toggle pinyin */
  onPinyinToggle: () => void;
  /** Whether translation is visible */
  isTranslationVisible: boolean;
  /** Callback to toggle translation */
  onTranslationToggle: () => void;
  /** Current font size percentage */
  fontSize: number;
  /** Callback to increase font size */
  onFontIncrease: () => void;
  /** Callback to decrease font size */
  onFontDecrease: () => void;
  /** Current language */
  language: Language;
  /** Callback to toggle language */
  onLanguageToggle: () => void;
  /** Current page number */
  pageNumber: number;
  /** Whether focus mode is active (optional, story reader only) */
  isFocusMode?: boolean;
  /** Callback to toggle focus mode (optional, story reader only) */
  onFocusModeToggle?: () => void;
}

export const ReaderControls: React.FC<ReaderControlsProps> = ({
  isPinyinVisible,
  onPinyinToggle,
  isTranslationVisible,
  onTranslationToggle,
  fontSize,
  onFontIncrease,
  onFontDecrease,
  language,
  onLanguageToggle,
  pageNumber,
  isFocusMode,
  onFocusModeToggle,
}) => {
  // UI text based on language
  const texts: Record<string, Record<string, string>> = {
    uz: {
      pinyinLabel: 'Pinyin',
      pinyinHide: 'Pinyinni yashirish',
      pinyinShow: "Pinyinni ko'rsatish",
      translationLabel: 'Tarjima',
      translationHide: 'Tarjimani yashirish',
      translationShow: "Tarjimani ko'rsatish",
      langSwitch: 'Переключить на русский',
      fontDecrease: 'Shriftni kichiklashtirish',
      fontIncrease: 'Shriftni kattalashtirish',
      focusLabel: 'Fokus',
      focusHide: 'Fokus rejimini o\'chirish',
      focusShow: 'Fokus rejimini yoqish',
    },
    ru: {
      pinyinLabel: 'Пиньинь',
      pinyinHide: 'Скрыть пиньинь',
      pinyinShow: 'Показать пиньинь',
      translationLabel: 'Перевод',
      translationHide: 'Скрыть перевод',
      translationShow: 'Показать перевод',
      langSwitch: 'Switch to English',
      fontDecrease: 'Уменьшить шрифт',
      fontIncrease: 'Увеличить шрифт',
      focusLabel: 'Фокус',
      focusHide: 'Выключить режим фокуса',
      focusShow: 'Включить режим фокуса',
    },
    en: {
      pinyinLabel: 'Pinyin',
      pinyinHide: 'Hide pinyin',
      pinyinShow: 'Show pinyin',
      translationLabel: 'Translation',
      translationHide: 'Hide translation',
      translationShow: 'Show translation',
      langSwitch: "O'zbek tiliga o'tish",
      fontDecrease: 'Decrease font',
      fontIncrease: 'Increase font',
      focusLabel: 'Focus',
      focusHide: 'Disable focus mode',
      focusShow: 'Enable focus mode',
    },
  };
  const text = texts[language] || texts.en;

  return (
    <div className="reader__controls">
      {onFocusModeToggle && (
        <button
          className={`page__toggle-btn ${isFocusMode ? 'page__toggle-btn--active' : ''}`}
          onClick={onFocusModeToggle}
          aria-pressed={isFocusMode}
          title={isFocusMode ? text.focusHide : text.focusShow}
          type="button"
        >
          <span className="page__toggle-label">{text.focusLabel}</span>
        </button>
      )}
      <button
        className="page__lang-btn"
        onClick={onLanguageToggle}
        title={text.langSwitch}
        type="button"
      >
        {({ uz: 'RU', ru: 'EN', en: 'UZ' } as Record<string, string>)[language]}
      </button>
      <div className="page__font-controls">
        <button
          className="page__font-btn"
          onClick={onFontDecrease}
          disabled={fontSize <= 80}
          title={text.fontDecrease}
          type="button"
          aria-label={text.fontDecrease}
        >
          A−
        </button>
        <button
          className="page__font-btn"
          onClick={onFontIncrease}
          disabled={fontSize >= 150}
          title={text.fontIncrease}
          type="button"
          aria-label={text.fontIncrease}
        >
          A+
        </button>
      </div>
    </div>
  );
};

export default ReaderControls;
