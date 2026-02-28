'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

export function BannerMenu() {
  const [language, , setLanguage] = useLanguage();
  const { user, logout } = useAuth();
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
      {menuOpen && (
        <div className="home__menu-dropdown">
          {user && (
            <>
              <div className="home__menu-user">
                <span className="home__menu-user-name">{user.name}</span>
                <span className="home__menu-user-email">{user.email}</span>
              </div>
              <div className="home__menu-divider" />
            </>
          )}
          <div className="home__menu-section-label">
            {language === 'ru' ? 'Язык' : 'Til'}
          </div>
          <div className="home__menu-lang-row">
            <button
              className={`home__menu-lang-btn ${language === 'uz' ? 'home__menu-lang-btn--active' : ''}`}
              type="button"
              onClick={() => setLanguage('uz')}
            >
              O&apos;zbekcha
            </button>
            <button
              className={`home__menu-lang-btn ${language === 'ru' ? 'home__menu-lang-btn--active' : ''}`}
              type="button"
              onClick={() => setLanguage('ru')}
            >
              Русский
            </button>
          </div>
          <div className="home__menu-divider" />
          <div className="home__menu-section-label">
            {language === 'ru' ? 'Я изучаю' : "Men o'rganaman"}
          </div>
          <div className="home__menu-lang-row">
            <button
              className="home__menu-lang-btn home__menu-lang-btn--active"
              type="button"
            >
              中文
            </button>
          </div>
          <div className="home__menu-divider" />
          <button className="home__menu-item" type="button" onClick={() => setMenuOpen(false)}>
            {language === 'ru' ? 'Оплата' : "To'lov"}
          </button>
          {user && (
            <button className="home__menu-item" type="button" onClick={() => { logout(); setMenuOpen(false); }}>
              {language === 'ru' ? 'Выйти' : 'Chiqish'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
