'use client';

import { Link } from '@/i18n/navigation';
import type { Language } from '../types/ui-state';
import type { DialoguePreviewData } from './dialoguePreview.types';
import type { VocabItem } from '@/services/glossary';

interface DialoguePreviewBodyProps {
  preview: DialoguePreviewData;
  language: Language;
  /** Localized dialogue title (H2 heading above the description). */
  title: string;
  /** Localized category label (kicker above the title). */
  category?: string;
  /** SEO description shown under the hero. */
  description?: string;
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
 * The public, crawlable body of a dialogue page — a single scroll (no tabs):
 * title + description, the first lines of the dialogue (Chinese only), and the
 * full vocab list. The gated lines + audio live in the full reader, which
 * replaces this body once a subscriber taps the floating "Read & Listen".
 */
export function DialoguePreviewBody({ preview, language, title, category, description, isAuthed, onReveal, revealing }: DialoguePreviewBodyProps) {
  const ctaLabel = revealing
    ? T('Yuklanmoqda…', 'Загрузка…', 'Loading…', language)
    : T("O'qish va tinglash", 'Читать и слушать', 'Read & Listen', language);

  return (
    <>
      <div className="dlg-preview">
        {/* Category kicker + title + SEO description, under the hero */}
        <div className="dlg-intro">
          {category && <div className="dlg-category">{category}</div>}
          <h2 className="dlg-intro__title">{title}</h2>
          {description && <p className="dlg-desc">{description}</p>}
        </div>

        {/* First lines of the dialogue as chat bubbles — Chinese only
            (no pinyin, no translation). A = left, B = right. */}
        <div className="dlg-teaser">
          {preview.teaser.map((s) => (
            <div className={`dlg-bubble dlg-bubble--${(s.speaker || 'a').toLowerCase() === 'b' ? 'b' : 'a'}`} key={s.id}>
              <span className="dlg-bubble__zh" lang="zh-Hans">{s.text_original}</span>
            </div>
          ))}
        </div>

        {/* Full vocab list — plain, crawlable text (the interactive trainer is gated) */}
        <ul className="dlg-vocab">
          {preview.vocab.map((v, i) => (
            <li className="dlg-vocab__row" key={i}>
              <span className="dlg-vocab__zh" lang="zh-Hans">{v.zh}</span>
              <span className="dlg-vocab__py">{v.py}</span>
              <span className="dlg-vocab__mean">{meaningOf(v, language)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Floating "Read & Listen" — fixed, always visible */}
      {isAuthed ? (
        <button type="button" className="dlg-read-cta dlg-read-cta--float" onClick={onReveal} disabled={revealing} aria-busy={revealing}>
          {ctaLabel}
        </button>
      ) : (
        <Link href="/login" className="dlg-read-cta dlg-read-cta--float">
          {ctaLabel}
        </Link>
      )}
    </>
  );
}
