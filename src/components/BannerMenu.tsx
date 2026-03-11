'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useTrial } from '../hooks/useTrial';

export function BannerMenu() {
  const [language, , setLanguage] = useLanguage();
  const { user, logout } = useAuth();
  const trial = useTrial();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [menuOpen]);

  return (
    <div className="home__menu" ref={menuRef}>
      <button
        className="home__menu-btn"
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>
      </button>
      <div className={`home__menu-dropdown${menuOpen ? ' home__menu-dropdown--open' : ''}`}>
          {user && (
            <>
              <div className="home__menu-user">
                <span className="home__menu-user-name">{user.name}</span>
              </div>
              {trial && (
                <div className={`home__menu-trial${trial.isTrialExpired ? ' home__menu-trial--expired' : ''}${trial.hasSubscription ? ' home__menu-trial--subscribed' : ''}`}>
                  {trial.hasSubscription
                    ? ({ uz: `Obuna: ${trial.subscriptionDaysLeft} kun qoldi`, ru: `Подписка: ${trial.subscriptionDaysLeft} дн.`, en: `Subscription: ${trial.subscriptionDaysLeft} days left` } as Record<string, string>)[language]
                    : trial.isTrialExpired
                      ? ({ uz: 'Sinov muddati tugadi', ru: 'Пробный период закончился', en: 'Trial period expired' } as Record<string, string>)[language]
                      : ({ uz: `Sinov: ${trial.daysLeft} kun qoldi`, ru: `Пробный: осталось ${trial.daysLeft} дн.`, en: `Trial: ${trial.daysLeft} days left` } as Record<string, string>)[language]}
                </div>
              )}
              <div className="home__menu-divider" />
            </>
          )}
          <div className="home__menu-section-label">
            {({ uz: 'Til', ru: 'Язык', en: 'Language' } as Record<string, string>)[language]}
          </div>
          <div className="home__menu-lang-row">
            <select
              className="home__menu-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'uz' | 'ru' | 'en')}
            >
              <option value="uz">O&apos;zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="home__menu-divider" />
          <div className="home__menu-section-label">
            {({ uz: "Men o'rganaman", ru: 'Я изучаю', en: "I'm learning" } as Record<string, string>)[language]}
          </div>
          <div className="home__menu-lang-row">
            <Link
              href="/chinese"
              className="home__menu-lang-btn home__menu-lang-btn--active"
              onClick={() => setMenuOpen(false)}
            >
              中文
            </Link>
          </div>
          <div className="home__menu-divider" />
          <Link href="/blog" className="home__menu-item" onClick={() => setMenuOpen(false)}>
            Blog
          </Link>
          <Link href="/payment" className="home__menu-item" onClick={() => setMenuOpen(false)}>
            {({ uz: "To'lov", ru: 'Оплата', en: 'Payment' } as Record<string, string>)[language]}
          </Link>
          {user && (
            <button className="home__menu-item" type="button" onClick={async () => { await logout(); setMenuOpen(false); router.push('/'); }}>
              {({ uz: 'Chiqish', ru: 'Выйти', en: 'Log out' } as Record<string, string>)[language]}
            </button>
          )}
      </div>
    </div>
  );
}
