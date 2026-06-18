'use client';

import React, { useState, useCallback } from 'react';
import '@/styles/arabic.css';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { ScriptConfig, ReaderSentence } from '@/lib/reader/scriptConfig';

interface ReaderCoreProps {
  config: ScriptConfig;
  sentences: ReaderSentence[];
  resolveAudio: (s: ReaderSentence) => Promise<string | null>;
  labels: { translation: string };
}

export function ReaderCore({ config, sentences, resolveAudio, labels }: ReaderCoreProps) {
  const [showPrimaryAid, setShowPrimaryAid] = useState(true);
  const [showSecondaryAid, setShowSecondaryAid] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { play } = useAudioPlayer();

  const onSentence = useCallback(async (s: ReaderSentence) => {
    setActiveId(s.id);
    const url = s.audioUrl ?? (await resolveAudio(s));
    if (url) play(s.id, url);
  }, [play, resolveAudio]);

  return (
    <div className={`reader-core ${config.fontClass}`} dir={config.dir}>
      <div className="reader-core__lines">
        {sentences.map((s) => (
          <div key={s.id} className="reader-core__line">
            {s.speaker && <span className="reader-core__speaker">{s.speaker}:</span>}
            <span
              className={`reader-core__sentence ${activeId === s.id ? 'reader-core__sentence--active' : ''}`}
              onClick={() => onSentence(s)}
            >
              {config.renderSentence(s, { showPrimaryAid, showSecondaryAid })}
            </span>
            {showTranslation && <div className="reader-core__translation" dir="auto">{s.translation}</div>}
          </div>
        ))}
      </div>

      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${showPrimaryAid ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowPrimaryAid((v) => !v)}
            type="button"
            aria-pressed={showPrimaryAid}
          >
            {config.primaryAidLabel}
          </button>
          {config.hasSecondaryAid && (
            <button
              className={`reader__nav-toggle ${showSecondaryAid ? 'reader__nav-toggle--active' : ''}`}
              onClick={() => setShowSecondaryAid((v) => !v)}
              type="button"
              aria-pressed={showSecondaryAid}
            >
              {config.secondaryAidLabel}
            </button>
          )}
          <button
            className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowTranslation((v) => !v)}
            type="button"
            aria-pressed={showTranslation}
          >
            {labels.translation}
          </button>
        </div>
      </nav>
    </div>
  );
}
