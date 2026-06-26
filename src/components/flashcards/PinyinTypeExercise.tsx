'use client';

import React, { useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import type { Language } from '@/types/ui-state';

/**
 * Ladder rung — production: show 汉字, TYPE the pinyin. First "produce it"
 * (vs "pick it") rung. Lenient matching: tones (marks or numbers), spaces and
 * apostrophes are all ignored — only the base syllables must match. A skip
 * button reveals the answer and counts as a miss (card comes back this session).
 */

// Lenient: lowercase, strip tone marks + tone numbers + spaces/punctuation,
// treat v as ü → compare base syllables only.
function normPinyin(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/v/g, 'u')
    .replace(/[^a-z]/g, '');
}

const L = (uz: string, ru: string, en: string, lang: Language) => ({ uz, ru, en } as Record<string, string>)[lang];

export function PinyinTypeExercise({ card, language, onResult }: ExerciseProps) {
  const correct = card.pinyin;
  const meaning = language === 'ru' && card.text_translation_ru ? card.text_translation_ru
    : language === 'en' && card.text_translation_en ? card.text_translation_en
      : card.text_translation;
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const submit = () => {
    if (result || !value.trim()) return;
    const ok = normPinyin(value) === normPinyin(correct);
    setResult(ok ? 'correct' : 'wrong');
    setTimeout(() => onResult(ok), ok ? 700 : 1500);
  };

  const skip = () => {
    if (result) return;
    setResult('wrong');
    setTimeout(() => onResult(false), 1500);
  };

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div lang="zh-Hans" className="fc-quiz__hanzi">{card.text_original}</div>
        <div className="fc-quiz__prompt-meaning">{meaning}</div>
      </div>

      <div className="fc-quiz__type">
        <input
          className={`fc-quiz__input ${result ? `fc-quiz__input--${result}` : ''}`}
          type="text" inputMode="text" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} autoFocus
          placeholder={L('pinyin yozing…', 'введите пиньинь…', 'type the pinyin…', language)}
          value={value}
          disabled={!!result}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        {result === 'wrong' && <div className="fc-quiz__answer">{correct}</div>}
        <div className="fc-quiz__type-actions">
          <button type="button" className="fc-quiz__skip" onClick={skip} disabled={!!result}>
            {L('Bilmadim', 'Не знаю', 'Skip', language)}
          </button>
          <button type="button" className="fc-quiz__check" onClick={submit} disabled={!!result || !value.trim()}>
            {L('Tekshirish', 'Проверить', 'Check', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
