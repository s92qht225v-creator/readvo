'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Language } from '../types/ui-state';
import type { DialoguePreviewData } from './dialoguePreview.types';
import type { VocabItem } from '@/services/glossary';

interface DialoguePreviewBodyProps {
  preview: DialoguePreviewData;
  language: Language;
  /** True when a real user is signed in. Signed-in users reveal the full dialogue
   *  in place via `onReveal`; anonymous users are sent to login by the CTA link. */
  isAuthed: boolean;
  /** Called when a signed-in user clicks "Read & Listen" to load the full dialogue. */
  onReveal: () => void;
  /** True while the full dialogue is being fetched after a reveal click. */
  revealing: boolean;
}

const T = (uz: string, ru: string, en: string, l: Language) =>
  ({ uz, ru, en } as Record<string, string>)[l] ?? uz;

const meaningOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);

/**
 * The public, crawlable body of a dialogue page: a Dialog teaser (first N lines)
 * + a full vocab list, shown to anonymous visitors and search crawlers.
 *
 * Both tab panels are always present in the DOM (toggled with the `hidden`
 * attribute, never conditionally rendered or lazy-fetched) so a crawler reads
 * the vocab even while the Dialog tab is active. The gated lines + audio live in
 * the full reader, which replaces this body once a subscriber's content loads.
 */
export function DialoguePreviewBody({ preview, language, isAuthed, onReveal, revealing }: DialoguePreviewBodyProps) {
  const [tab, setTab] = useState<'dialog' | 'vocab'>('dialog');

  const trOf = (s: DialoguePreviewData['teaser'][number]) =>
    language === 'ru' ? s.text_translation_ru
    : language === 'en' ? (s.text_translation_en || s.text_translation)
    : s.text_translation;

  const tabs: { id: 'dialog' | 'vocab'; label: string }[] = [
    { id: 'dialog', label: T('Dialog', 'Диалог', 'Dialogue', language) },
    { id: 'vocab', label: T("So'zlar", 'Слова', 'Words', language) },
  ];

  return (
    <>
      <div className="dr-tabs">
        <div className="dr-tabs__inner">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`dr-tabs__tab ${tab === t.id ? 'dr-tabs__tab--active' : ''}`}
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Dialog teaser — always in the DOM, hidden when the Words tab is active */}
      <div className="dlg-teaser" hidden={tab !== 'dialog'}>
        {preview.teaser.map((s) => (
          <div className="dlg-teaser__line" key={s.id}>
            <div>
              {s.speaker && <span className="dlg-teaser__speaker">{s.speaker}: </span>}
              <span className="dlg-teaser__zh" lang="zh-Hans">{s.text_original}</span>
              <span className="dlg-teaser__py">{s.pinyin}</span>
            </div>
            <div className="dlg-teaser__tr">{trOf(s)}</div>
          </div>
        ))}
        {preview.hiddenCount > 0 && (
          <div className="dlg-teaser__lock">
            <span>🔒 {T(`yana ${preview.hiddenCount} qator`, `ещё ${preview.hiddenCount} строк`, `${preview.hiddenCount} more lines`, language)}</span>
          </div>
        )}
        {isAuthed ? (
          <button type="button" className="dlg-read-cta" onClick={onReveal} disabled={revealing} aria-busy={revealing}>
            {revealing
              ? T('Yuklanmoqda…', 'Загрузка…', 'Loading…', language)
              : T("O'qish va tinglash", 'Читать и слушать', 'Read & Listen', language)}
          </button>
        ) : (
          <Link href="/login" className="dlg-read-cta">
            {T("O'qish va tinglash", 'Читать и слушать', 'Read & Listen', language)}
          </Link>
        )}
      </div>

      {/* Vocab — a plain, crawlable list (the interactive flip-card trainer is
          gated; this is just readable text for SEO + a preview). Always in the
          DOM, hidden when the Dialog tab is active. */}
      <ul className="dlg-vocab" hidden={tab !== 'vocab'}>
        {preview.vocab.map((v, i) => (
          <li className="dlg-vocab__row" key={i}>
            <span className="dlg-vocab__zh" lang="zh-Hans">{v.zh}</span>
            <span className="dlg-vocab__py">{v.py}</span>
            <span className="dlg-vocab__mean">{meaningOf(v, language)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
