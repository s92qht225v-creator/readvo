import React from 'react';
import { alignPinyinToText } from '@/utils/rubyText';
import { stripHarakat } from './harakat';

/** One sentence normalized for the language-agnostic reader core. */
export interface ReaderSentence {
  id: string;
  text: string;          // primary-script text (Arabic vowelized, or Chinese hanzi)
  aid?: string;          // Chinese: source pinyin string for alignment; Arabic: unused
  translit?: string;     // Arabic: Latin transliteration (secondary aid)
  translation: string;   // already resolved to the current UI language by the caller
  speaker?: string;      // 'A' | 'B' for dialogues
  audioText: string;     // text sent to TTS when no recorded audioUrl
  audioUrl?: string;
  voice?: string;        // optional TTS voice (Arabic gendered speakers)
}

export interface RenderOpts {
  showPrimaryAid: boolean;
  showSecondaryAid: boolean;
}

/** The ONLY language-specific seam: direction + how a sentence renders. */
export interface ScriptConfig {
  dir: 'ltr' | 'rtl';
  fontClass: string;            // CSS class applying the script's font
  primaryAidLabel: string;      // bottom-bar toggle label ('Harakat' / 'Pinyin')
  hasSecondaryAid: boolean;     // is there a transliteration line?
  secondaryAidLabel?: string;   // 'Translit'
  renderSentence: (s: ReaderSentence, opts: RenderOpts) => React.ReactNode;
}

/** Arabic: RTL, harakat in-text (strip when aid off), transliteration line. */
export const arabicScriptConfig: ScriptConfig = {
  dir: 'rtl',
  fontClass: 'reader-core--arabic',
  primaryAidLabel: 'Harakat',
  hasSecondaryAid: true,
  secondaryAidLabel: 'Translit',
  renderSentence: (s, { showPrimaryAid, showSecondaryAid }) => (
    <span className="ar-sentence">
      {showSecondaryAid && s.translit && (
        <span className="ar-translit" dir="ltr">{s.translit}</span>
      )}
      <span className="ar-text">{showPrimaryAid ? s.text : stripHarakat(s.text)}</span>
    </span>
  ),
};

/** Chinese PROOF config — validates the seam against a 2nd script. Not wired
 *  into the live /chinese reader (that stays on DialogueReader.tsx). */
export const chineseScriptConfig: ScriptConfig = {
  dir: 'ltr',
  fontClass: 'reader-core--chinese',
  primaryAidLabel: 'Pinyin',
  hasSecondaryAid: false,
  renderSentence: (s, { showPrimaryAid }) => (
    <span className="zh-sentence">
      {alignPinyinToText(s.text, s.aid ?? '').map((p, i) => (
        <span key={i} className="zh-char">
          {showPrimaryAid && p.pinyin && <span className="zh-py">{p.pinyin}</span>}
          <span className="zh-zh">{p.char}</span>
        </span>
      ))}
    </span>
  ),
};
