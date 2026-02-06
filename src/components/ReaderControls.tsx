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
}) => {
  // UI text based on language
  const text = language === 'ru' ? {
    pinyinHide: 'Скрыть пиньинь',
    pinyinShow: 'Показать пиньинь',
    translationLabel: 'Перевод',
    translationHide: 'Скрыть перевод',
    translationShow: 'Показать перевод',
    langSwitch: "O'zbek tiliga o'tish",
    fontDecrease: 'Уменьшить шрифт',
    fontIncrease: 'Увеличить шрифт',
  } : {
    pinyinHide: 'Pinyinni yashirish',
    pinyinShow: "Pinyinni ko'rsatish",
    translationLabel: 'Tarjima',
    translationHide: 'Tarjimani yashirish',
    translationShow: "Tarjimani ko'rsatish",
    langSwitch: 'Переключить на русский',
    fontDecrease: 'Shriftni kichiklashtirish',
    fontIncrease: 'Shriftni kattalashtirish',
  };

  return (
    <div className="reader__controls">
      <button
        className={`page__toggle-btn ${isPinyinVisible ? 'page__toggle-btn--active' : ''}`}
        onClick={onPinyinToggle}
        aria-pressed={isPinyinVisible}
        title={isPinyinVisible ? text.pinyinHide : text.pinyinShow}
        type="button"
      >
        <span className="page__toggle-label">拼音</span>
      </button>
      <button
        className={`page__toggle-btn ${isTranslationVisible ? 'page__toggle-btn--active' : ''}`}
        onClick={onTranslationToggle}
        aria-pressed={isTranslationVisible}
        title={isTranslationVisible ? text.translationHide : text.translationShow}
        type="button"
      >
        <span className="page__toggle-label">{text.translationLabel}</span>
      </button>
      <button
        className="page__lang-btn"
        onClick={onLanguageToggle}
        title={text.langSwitch}
        type="button"
      >
        {language === 'uz' ? 'RU' : 'UZ'}
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
      <div className="page__number-badge">{pageNumber}</div>
    </div>
  );
};

export default ReaderControls;
