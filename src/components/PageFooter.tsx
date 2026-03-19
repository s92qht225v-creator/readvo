'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const REASONS = [
  { id: 'pinyin', uz: 'Pinyin xatosi', ru: 'Ошибка пиньинь', en: 'Pinyin error' },
  { id: 'translation', uz: 'Tarjima xatosi', ru: 'Ошибка перевода', en: 'Translation error' },
  { id: 'audio', uz: 'Audio xatosi', ru: 'Ошибка аудио', en: 'Audio error' },
  { id: 'grammar', uz: 'Grammatika xatosi', ru: 'Ошибка грамматики', en: 'Grammar error' },
  { id: 'image', uz: 'Rasm xatosi', ru: 'Ошибка изображения', en: 'Image error' },
  { id: 'other', uz: 'Boshqa', ru: 'Другое', en: 'Other' },
];

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function PageFooter() {
  const pathname = usePathname();
  const { user, getAccessToken } = useAuth();
  const [language] = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const showCorrection = pathname !== '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || status === 'submitting') return;

    setStatus('submitting');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason,
          message: message.trim() || undefined,
          pageUrl: window.location.href,
        }),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => {
          setOpen(false);
          setReason('');
          setMessage('');
          setStatus('idle');
        }, 1500);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <footer className="home__footer">
      {showCorrection && (
        <div className="correction-inline">
          {!open ? (
            <button
              className="correction-inline__btn"
              type="button"
              onClick={() => setOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {({ uz: 'Xato haqida xabar berish', ru: 'Сообщить об ошибке', en: 'Report an error' } as Record<string, string>)[language]}
            </button>
          ) : status === 'success' ? (
            <div className="correction-inline__success">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{({ uz: 'Yuborildi!', ru: 'Отправлено!', en: 'Sent!' } as Record<string, string>)[language]}</span>
            </div>
          ) : (
            <form className="correction-inline__form" onSubmit={handleSubmit}>
              <div className="correction-inline__title">
                {({ uz: 'Xato haqida xabar berish', ru: 'Сообщить об ошибке', en: 'Report an error' } as Record<string, string>)[language]}
                <button
                  type="button"
                  className="correction-inline__close"
                  onClick={() => { setOpen(false); setStatus('idle'); }}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <select
                className="correction-inline__select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="" disabled>
                  {({ uz: 'Sababni tanlang...', ru: 'Выберите причину...', en: 'Select a reason...' } as Record<string, string>)[language]}
                </option>
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r as Record<string, string>)[language] || r.uz}
                  </option>
                ))}
              </select>
              <textarea
                className="correction-inline__textarea"
                placeholder={({ uz: 'Yana nima bilishimiz kerak?', ru: 'Что ещё нам следует знать?', en: 'What else should we know?' } as Record<string, string>)[language]}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <button
                type="submit"
                className="correction-inline__submit"
                disabled={!reason || status === 'submitting'}
              >
                {status === 'submitting'
                  ? ({ uz: 'Yuborilmoqda...', ru: 'Отправка...', en: 'Sending...' } as Record<string, string>)[language]
                  : status === 'error'
                  ? ({ uz: 'Xatolik, qayta urinib ko\'ring', ru: 'Ошибка, попробуйте снова', en: 'Error, try again' } as Record<string, string>)[language]
                  : ({ uz: 'Yuborish', ru: 'Отправить', en: 'Submit' } as Record<string, string>)[language]}
              </button>
            </form>
          )}
        </div>
      )}
      <nav className="home__footer-nav">
        <Link href="/chinese" className="home__footer-nav-link">{({ uz: 'Darslar', ru: 'Уроки', en: 'Lessons' } as Record<string, string>)[language]}</Link>
        <Link href="/chinese?tab=grammar" className="home__footer-nav-link">{({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[language]}</Link>
        <Link href="/chinese?tab=dialogues" className="home__footer-nav-link">{({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[language]}</Link>
        <Link href="/chinese?tab=flashcards" className="home__footer-nav-link">{({ uz: 'Flesh-kartalar', ru: 'Флеш-карты', en: 'Flashcards' } as Record<string, string>)[language]}</Link>
        <Link href="/blog" className="home__footer-nav-link">Blog</Link>
      </nav>
      <p>{({ uz: 'Blim — Interaktiv til darsliklari', ru: 'Blim — Интерактивные учебники языков', en: 'Blim — Interactive language textbooks' } as Record<string, string>)[language]}</p>
    </footer>
  );
}
