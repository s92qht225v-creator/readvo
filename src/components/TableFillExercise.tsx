'use client';

/**
 * TableFillExercise Component
 *
 * Interactive table where users fill cells by selecting options.
 * Tap a cell, then tap an option to fill it. No wrong answers.
 *
 * Used for classroom activities like "Fill in the Table" (填写表格).
 */

import React, { useState, useCallback } from 'react';

export interface TableFillOption {
  id: string;
  label: string;
  word: string;
  pinyin: string;
}

export interface TableFillColumn {
  id: string;
  label: string;
  pinyin: string;
}

export interface TableFillExerciseProps {
  options: TableFillOption[];
  columns: TableFillColumn[];
  language: 'uz' | 'ru';
}

export const TableFillExercise: React.FC<TableFillExerciseProps> = ({
  options,
  columns,
  language,
}) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [filledCells, setFilledCells] = useState<Map<string, string>>(new Map());

  const handleCellClick = useCallback((cellId: string) => {
    setSelectedCellId((prev) => (prev === cellId ? null : cellId));
  }, []);

  const handleOptionClick = useCallback((optionId: string) => {
    if (!selectedCellId) return;

    setFilledCells((prev) => {
      const next = new Map(prev);
      next.set(selectedCellId, optionId);
      return next;
    });
    setSelectedCellId(null);
  }, [selectedCellId]);

  const getOptionWord = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    return option?.word || '';
  };

  const total = columns.length;
  const filled = filledCells.size;
  const isComplete = filled === total;

  return (
    <div className="tablefill">
      {/* Progress */}
      <div className="fillblank__progress">
        <span className="fillblank__progress-text">
          {filled}/{total}
        </span>
        <div className="fillblank__progress-bar">
          <div
            className="fillblank__progress-fill"
            style={{ width: `${(filled / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Options */}
      <div className="fillblank__options">
        {options.map((option) => (
          <button
            key={option.id}
            className={`fillblank__option ${selectedCellId ? 'fillblank__option--active' : ''}`}
            onClick={() => handleOptionClick(option.id)}
            disabled={!selectedCellId}
          >
            <span className="fillblank__option-label">{option.label}</span>
            <span className="fillblank__option-word">{option.word}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="tablefill__table">
        <div className="tablefill__row tablefill__row--header">
          {columns.map((col) => (
            <div key={col.id} className="tablefill__cell tablefill__cell--header">
              <span className="tablefill__cell-pinyin">{col.pinyin}</span>
              <span className="tablefill__cell-label">{col.label}</span>
            </div>
          ))}
        </div>
        <div className="tablefill__row">
          {columns.map((col) => {
            const cellId = col.id;
            const isSelected = selectedCellId === cellId;
            const filledOptionId = filledCells.get(cellId);
            const isFilled = !!filledOptionId;

            return (
              <button
                key={cellId}
                className={`tablefill__cell tablefill__cell--input ${isSelected ? 'tablefill__cell--selected' : ''} ${isFilled ? 'tablefill__cell--filled' : ''}`}
                onClick={() => handleCellClick(cellId)}
              >
                {isFilled ? getOptionWord(filledOptionId!) : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion */}
      {isComplete && (
        <div className="fillblank__complete">
          <span className="fillblank__complete-icon">🎉</span>
          <span className="fillblank__complete-text">
            {language === 'ru' ? 'Отлично!' : 'Ajoyib!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TableFillExercise;
