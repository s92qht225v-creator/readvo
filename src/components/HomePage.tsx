'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { AdminPanel } from './AdminPanel';

const t = {
  uz: {
    login: 'Google orqali kirish',
    heroTitle: 'Chet tillarini interaktiv hikoyalar bilan o\'rganing',
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
    showcaseTitle: 'Bosib tarjima qiling',
    showcaseSubtitle: 'Matnda istalgan so\'zni bosing va tarjimasini ko\'ring',
    showcaseLabel1: 'Flashkartalar bilan mashq qiling',
    showcaseLabel2: 'Kontekstda tushunish',
    ctaTitle: 'Hoziroq boshlang',
    ctaSubtitle: 'Bepul ro\'yxatdan o\'ting va o\'qishni boshlang',
    footerText: 'Blim — Interaktiv til darsliklari',
    chinese: 'Xitoy tili',
    english: 'Ingliz tili',
    tagline: 'Interaktiv til darsliklari',
  },
  ru: {
    login: 'Войти через Google',
    heroTitle: 'Учите иностранные языки через интерактивные истории',
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
    showcaseTitle: 'Нажмите для перевода',
    showcaseSubtitle: 'Просто нажмите на любое слово в тексте, чтобы увидеть перевод',
    showcaseLabel1: 'Практикуйте с карточками',
    showcaseLabel2: 'Понимайте в контексте',
    ctaTitle: 'Начните сейчас',
    ctaSubtitle: 'Зарегистрируйтесь бесплатно и начните читать',
    footerText: 'Blim — Интерактивные учебники языков',
    chinese: 'Китайский язык',
    english: 'Английский язык',
    tagline: 'Интерактивные учебники языков',
  },
};

const languageList = [
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

/** Logged-in view: constrained width, hero + language cards */
function AppHome({ language, toggleLanguage, user, logout, s }: {
  language: string;
  toggleLanguage: () => void;
  user: { name: string; avatar_url?: string };
  logout: () => Promise<void>;
  s: typeof t.uz;
}) {
  return (
    <main className="home">
      <header className="home__hero">
        <div className="home__hero-top">
          <button className="home__user-btn" onClick={logout} type="button">
            {user.avatar_url && (
              <img src={user.avatar_url} alt="" className="home__user-avatar" />
            )}
            <span className="home__user-name">{user.name}</span>
          </button>
          <button className="home__lang-btn" onClick={toggleLanguage} type="button">
            {language === 'uz' ? 'RU' : 'UZ'}
          </button>
        </div>
        <h1 className="home__logo">
          <img src="/logo.svg" alt="Blim" className="home__logo-img" />
        </h1>
        <p className="home__tagline">{s.tagline}</p>
      </header>

      <section className="home__content">
        <h2 className="home__section-title">{s.languages}</h2>
        <div className="home__languages">
          {languageList.map((lang) => (
            <Link key={lang.id} href={`/${lang.id}`} className="language-group language-group--link">
              <div className="language-group__header">
                <span className="language-group__flag">{lang.flag}</span>
                <div className="language-group__title">
                  <h3 className="language-group__name">
                    {s[lang.id as keyof typeof s]}
                  </h3>
                  <span className="language-group__original">{lang.nameOriginal}</span>
                </div>
              </div>
              <span className="language-group__arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home__footer">
        <p>{s.footerText}</p>
      </footer>
    </main>
  );
}

/** Landing page: full-width, marketing sections */
function LandingPage({ language, toggleLanguage, loginWithGoogle, s }: {
  language: string;
  toggleLanguage: () => void;
  loginWithGoogle: () => Promise<void>;
  s: typeof t.uz;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <span className="landing__nav-logo">
            <img src="/logo.svg" alt="Blim" className="landing__nav-logo-img" />
          </span>
          <div className="landing__nav-links">
            <a href="#hero" className="landing__nav-link">{language === 'ru' ? 'Главная' : 'Bosh sahifa'}</a>
            <a href="#features" className="landing__nav-link">{s.features}</a>
            <a href="#how" className="landing__nav-link">{s.howItWorks}</a>
          </div>
          <div className="landing__nav-right">
            <button className="landing__lang-btn" onClick={toggleLanguage} type="button">
              {language === 'uz' ? 'RU' : 'UZ'}
            </button>
            <button className="landing__login-btn" onClick={loginWithGoogle} type="button">
              {s.login}
            </button>
            <button
              className="landing__hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : <><span /><span /><span /></>}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="landing__mobile-menu">
            <a href="#hero" className="landing__mobile-link landing__mobile-link--active" onClick={() => setMobileMenuOpen(false)}>
              {language === 'ru' ? 'Главная' : 'Bosh sahifa'}
            </a>
            <a href="#features" className="landing__mobile-link" onClick={() => setMobileMenuOpen(false)}>
              {s.features}
            </a>
            <a href="#how" className="landing__mobile-link" onClick={() => setMobileMenuOpen(false)}>
              {s.howItWorks}
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="landing__hero">
        <h1 className="landing__hero-title">{s.heroTitle}</h1>
        <div className="landing__hero-visual">
          <div className="landing__demo-card">
            <div className="landing__demo-line">
              <span className="landing__demo-chinese">你好，我叫小语。</span>
            </div>
            <div className="landing__demo-line landing__demo-line--pinyin">Nǐ hǎo, wǒ jiào Xiǎoyǔ.</div>
            <div className="landing__demo-line landing__demo-line--translation">Salom, mening ismim Xiaoyu.</div>
          </div>
          <div className="landing__demo-card landing__demo-card--second">
            <div className="landing__demo-line">
              <span className="landing__demo-chinese">我家有四口人：爸爸、妈妈、姐姐和我。</span>
            </div>
            <div className="landing__demo-line landing__demo-line--pinyin">Wǒ jiā yǒu sì kǒu rén: bàba, māma, jiějie hé wǒ.</div>
            <div className="landing__demo-line landing__demo-line--translation">В моей семье четыре человека: папа, мама, старшая сестра и я.</div>
          </div>
          <div className="landing__demo-card landing__demo-card--third">
            <div className="landing__demo-line landing__demo-line--large">
              我今天想去<span className="landing__demo-highlight"><span className="landing__demo-tooltip">oila</span>家<svg className="landing__demo-cursor" viewBox="0 0 32 32" fill="white" stroke="#333" strokeWidth="1"><path d="M10 2v18l4.5-4.5L18 24l4-2-3.5-8.5H26L10 2z"/></svg></span>里看书。
            </div>
          </div>
        </div>
        <div className="landing__hero-langs">
          <div className="landing__hero-langs-inner">
            <div className="landing__hero-langs-row">
              {[
                { code: 'uz', name: "O'zbek" },
                { code: 'ru', name: 'Русский' },
                { code: 'kz', name: 'Қазақ' },
                { code: 'kg', name: 'Кыргыз' },
              ].map((lang) => (
                <div key={lang.name} className="landing__hero-lang">
                  <img
                    src={`https://flagcdn.com/w160/${lang.code}.png`}
                    alt={lang.name}
                    className="landing__hero-lang-flag"
                  />
                  <span className="landing__hero-lang-name">{lang.name}</span>
                </div>
              ))}
            </div>
            <p className="landing__hero-langs-more">
              {language === 'ru' ? '+ Тоҷик, скоро...' : "+ Tojik, tez kunda..."}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing__section landing__section--gray">
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
      <section id="features" className="landing__section">
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
      <section className="landing__cta">
        <h2 className="landing__cta-title">{s.ctaTitle}</h2>
        <p className="landing__cta-subtitle">{s.ctaSubtitle}</p>
        <button className="landing__cta-btn" onClick={loginWithGoogle} type="button">
          <GoogleIcon />
          {s.startFree}
        </button>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <p className="landing__footer-text">{s.footerText}</p>
      </footer>
    </div>
  );
}

export function HomePage() {
  const [language, toggleLanguage] = useLanguage();
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  const s = t[language];
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminParam = searchParams.get('admin') === 'true';
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminError, setAdminError] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !isAdminParam) {
      router.replace('/chinese');
    }
  }, [isLoading, user, router, isAdminParam]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(false);

    const res = await fetch('/api/admin/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPassword }),
    });

    const data = await res.json();
    if (data.isAdmin) {
      setAdminAuthed(true);
    } else {
      setAdminError(true);
    }
    setAdminLoading(false);
  };

  if (isAdminParam) {
    if (adminAuthed) {
      return (
        <main className="home" style={{ background: '#f5f5f5', minHeight: '100vh' }}>
          <meta name="robots" content="noindex, nofollow" />
          <div style={{ padding: '24px 16px 0' }}>
            <AdminPanel password={adminPassword} />
          </div>
        </main>
      );
    }

    return (
      <main className="admin-login">
        <meta name="robots" content="noindex, nofollow" />
        <form className="admin-login__form" onSubmit={handleAdminLogin}>
          <h1 className="admin-login__title">Admin</h1>
          <input
            type="password"
            className="admin-login__input"
            placeholder="Parol"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            autoFocus
          />
          {adminError && (
            <p className="admin-login__error">Noto&apos;g&apos;ri parol</p>
          )}
          <button
            className="admin-login__btn"
            type="submit"
            disabled={!adminPassword || adminLoading}
          >
            {adminLoading ? '...' : 'Kirish'}
          </button>
        </form>
      </main>
    );
  }

  if (isLoading || user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading...</p>
    </div>
  );

  return <LandingPage language={language} toggleLanguage={toggleLanguage} loginWithGoogle={loginWithGoogle} s={s} />;
}
