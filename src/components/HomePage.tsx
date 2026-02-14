'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

const t = {
  uz: {
    login: 'Google orqali kirish',
    heroTitle: 'Interaktiv kitoblardan til o\'rganing',
    heroSubtitle: 'Pinyin, audio, tarjima va flashkartalar bilan xitoy tilini samarali o\'rganing',
    startFree: 'Bepul boshlang',
    languages: 'Tillarni tanlang',
    howItWorks: 'Qanday ishlaydi?',
    step1Title: 'Darslikni tanlang',
    step1Desc: 'HSK darsliklari va hikoyalardan o\'zingizga mos bo\'lganini tanlang',
    step2Title: 'O\'qing va tinglang',
    step2Desc: 'Pinyin, tarjima va audio bilan har bir gapni tushunib o\'qing',
    step3Title: 'Lug\'atni yodlang',
    step3Desc: 'Flashkartalar va mashqlar bilan so\'zlarni mustahkamlang',
    features: 'Imkoniyatlar',
    feat1Title: 'Pinyin va tarjima',
    feat1Desc: 'Har bir gap uchun pinyin va o\'zbek/rus tarjimasini yoqing yoki o\'chiring',
    feat2Title: 'Audio tinglash',
    feat2Desc: 'Har bir gapni alohida yoki butun dialogni tinglang',
    feat3Title: 'Flashkartalar',
    feat3Desc: 'HSK so\'zlarini 3D kartalar bilan yodlang va tekshiring',
    feat4Title: 'Hikoyalar',
    feat4Desc: 'Darajali hikoyalarni o\'qing, so\'zlarni bosib tarjimasini ko\'ring',
    feat5Title: 'Progress kuzatuv',
    feat5Desc: 'Qaysi darslarni tugatganingizni kuzatib boring',
    feat6Title: 'Ikki tilli',
    feat6Desc: 'O\'zbek va rus tillarida tarjimalar mavjud',
    ctaTitle: 'Hoziroq boshlang',
    ctaSubtitle: 'Bepul ro\'yxatdan o\'ting va o\'qishni boshlang',
    footerText: 'ReadVo — Interaktiv til darsliklari',
    chinese: 'Xitoy tili',
    english: 'Ingliz tili',
  },
  ru: {
    login: 'Войти через Google',
    heroTitle: 'Учите языки по интерактивным учебникам',
    heroSubtitle: 'Эффективно учите китайский с пиньинь, аудио, переводом и карточками',
    startFree: 'Начать бесплатно',
    languages: 'Выберите язык',
    howItWorks: 'Как это работает?',
    step1Title: 'Выберите учебник',
    step1Desc: 'Выберите подходящий учебник HSK или историю',
    step2Title: 'Читайте и слушайте',
    step2Desc: 'Читайте каждое предложение с пиньинь, переводом и аудио',
    step3Title: 'Запоминайте слова',
    step3Desc: 'Закрепляйте слова с помощью карточек и упражнений',
    features: 'Возможности',
    feat1Title: 'Пиньинь и перевод',
    feat1Desc: 'Включайте или выключайте пиньинь и перевод для каждого предложения',
    feat2Title: 'Аудио',
    feat2Desc: 'Слушайте каждое предложение или весь диалог целиком',
    feat3Title: 'Карточки',
    feat3Desc: 'Запоминайте слова HSK с помощью 3D-карточек',
    feat4Title: 'Истории',
    feat4Desc: 'Читайте адаптированные истории, нажимайте на слова для перевода',
    feat5Title: 'Отслеживание прогресса',
    feat5Desc: 'Следите за пройденными уроками',
    feat6Title: 'Двуязычный',
    feat6Desc: 'Переводы на узбекском и русском языках',
    ctaTitle: 'Начните сейчас',
    ctaSubtitle: 'Зарегистрируйтесь бесплатно и начните читать',
    footerText: 'ReadVo — Интерактивные учебники языков',
    chinese: 'Китайский язык',
    english: 'Английский язык',
  },
};

const languages = [
  { id: 'chinese', nameOriginal: '中文', flag: '🇨🇳' },
  { id: 'english', nameOriginal: 'English', flag: '🇬🇧' },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function HomePage() {
  const [language, toggleLanguage] = useLanguage();
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  const s = t[language];

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <span className="landing__nav-logo">📖 ReadVo</span>
          <div className="landing__nav-right">
            <button className="landing__lang-btn" onClick={toggleLanguage} type="button">
              {language === 'uz' ? 'RU' : 'UZ'}
            </button>
            {!isLoading && user ? (
              <button className="landing__user-btn" onClick={logout} type="button">
                {user.avatar_url && (
                  <img src={user.avatar_url} alt="" className="landing__user-avatar" />
                )}
                <span className="landing__user-name">{user.name}</span>
              </button>
            ) : !isLoading ? (
              <button className="landing__login-btn" onClick={loginWithGoogle} type="button">
                <GoogleIcon />
                {s.login}
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <h1 className="landing__hero-title">{s.heroTitle}</h1>
        <p className="landing__hero-subtitle">{s.heroSubtitle}</p>
        {!isLoading && !user && (
          <button className="landing__hero-cta" onClick={loginWithGoogle} type="button">
            <GoogleIcon />
            {s.startFree}
          </button>
        )}
        <div className="landing__hero-visual">
          <div className="landing__demo-card">
            <div className="landing__demo-line">
              <span className="landing__demo-chinese">你好，我叫小语。</span>
            </div>
            <div className="landing__demo-line landing__demo-line--pinyin">Nǐ hǎo, wǒ jiào Xiǎoyǔ.</div>
            <div className="landing__demo-line landing__demo-line--translation">Salom, mening ismim Xiaoyu.</div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="landing__section">
        <h2 className="landing__section-title">{s.languages}</h2>
        <div className="landing__languages">
          {languages.map((lang) => (
            <Link key={lang.id} href={`/${lang.id}`} className="landing__lang-card">
              <span className="landing__lang-flag">{lang.flag}</span>
              <span className="landing__lang-name">
                {s[lang.id as keyof typeof s]}
              </span>
              <span className="landing__lang-original">{lang.nameOriginal}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing__section landing__section--gray">
        <h2 className="landing__section-title">{s.howItWorks}</h2>
        <div className="landing__steps">
          <div className="landing__step">
            <div className="landing__step-icon">📚</div>
            <div className="landing__step-num">1</div>
            <h3 className="landing__step-title">{s.step1Title}</h3>
            <p className="landing__step-desc">{s.step1Desc}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-icon">🎧</div>
            <div className="landing__step-num">2</div>
            <h3 className="landing__step-title">{s.step2Title}</h3>
            <p className="landing__step-desc">{s.step2Desc}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-icon">🃏</div>
            <div className="landing__step-num">3</div>
            <h3 className="landing__step-title">{s.step3Title}</h3>
            <p className="landing__step-desc">{s.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__section">
        <h2 className="landing__section-title">{s.features}</h2>
        <div className="landing__features">
          {[
            { icon: '🔤', title: s.feat1Title, desc: s.feat1Desc },
            { icon: '🔊', title: s.feat2Title, desc: s.feat2Desc },
            { icon: '🎴', title: s.feat3Title, desc: s.feat3Desc },
            { icon: '📖', title: s.feat4Title, desc: s.feat4Desc },
            { icon: '📊', title: s.feat5Title, desc: s.feat5Desc },
            { icon: '🌐', title: s.feat6Title, desc: s.feat6Desc },
          ].map((feat) => (
            <div key={feat.title} className="landing__feature">
              <div className="landing__feature-icon">{feat.icon}</div>
              <h3 className="landing__feature-title">{feat.title}</h3>
              <p className="landing__feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isLoading && !user && (
        <section className="landing__cta">
          <h2 className="landing__cta-title">{s.ctaTitle}</h2>
          <p className="landing__cta-subtitle">{s.ctaSubtitle}</p>
          <button className="landing__cta-btn" onClick={loginWithGoogle} type="button">
            <GoogleIcon />
            {s.startFree}
          </button>
        </section>
      )}

      {/* Footer */}
      <footer className="landing__footer">
        <p className="landing__footer-text">{s.footerText}</p>
      </footer>
    </div>
  );
}
