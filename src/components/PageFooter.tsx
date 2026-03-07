'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const REASONS = [
  { id: 'pinyin', uz: 'Pinyin xatosi', ru: 'Ошибка пиньинь' },
  { id: 'translation', uz: 'Tarjima xatosi', ru: 'Ошибка перевода' },
  { id: 'audio', uz: 'Audio xatosi', ru: 'Ошибка аудио' },
  { id: 'grammar', uz: 'Grammatika xatosi', ru: 'Ошибка грамматики' },
  { id: 'image', uz: 'Rasm xatosi', ru: 'Ошибка изображения' },
  { id: 'other', uz: 'Boshqa', ru: 'Другое' },
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

  const isRu = language === 'ru';
  const showCorrection = pathname !== '/' && !!user;

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
              {isRu ? 'Сообщить об ошибке' : 'Xato haqida xabar berish'}
            </button>
          ) : status === 'success' ? (
            <div className="correction-inline__success">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{isRu ? 'Отправлено!' : 'Yuborildi!'}</span>
            </div>
          ) : (
            <form className="correction-inline__form" onSubmit={handleSubmit}>
              <div className="correction-inline__title">
                {isRu ? 'Сообщить об ошибке' : 'Xato haqida xabar berish'}
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
                  {isRu ? 'Выберите причину...' : 'Sababni tanlang...'}
                </option>
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isRu ? r.ru : r.uz}
                  </option>
                ))}
              </select>
              <textarea
                className="correction-inline__textarea"
                placeholder={isRu ? 'Что ещё нам следует знать?' : 'Yana nima bilishimiz kerak?'}
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
                  ? (isRu ? 'Отправка...' : 'Yuborilmoqda...')
                  : status === 'error'
                  ? (isRu ? 'Ошибка, попробуйте снова' : 'Xatolik, qayta urinib ko\'ring')
                  : (isRu ? 'Отправить' : 'Yuborish')}
              </button>
            </form>
          )}
        </div>
      )}
      <p>{isRu ? 'Blim — Интерактивные учебники языков' : 'Blim — Interaktiv til darsliklari'}</p>
    </footer>
  );
}
