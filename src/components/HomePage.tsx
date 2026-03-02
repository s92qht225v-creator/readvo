'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { AdminPanel } from './AdminPanel';

const t = {
  uz: {
    login: 'Telegram orqali kirish',
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
    login: 'Войти через Telegram',
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

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.53 8.16l-1.8 8.48c-.13.6-.5.74-.99.46l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.78 5.07-4.58c.22-.2-.05-.3-.34-.12l-6.27 3.95-2.7-.84c-.59-.18-.6-.59.12-.87l10.55-4.07c.49-.18.92.12.76.85z" fill="#2AABEE"/>
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
          <Image src="/logo.svg" alt="Blim" width={120} height={40} className="home__logo-img" priority />
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
function LandingPage({ language, toggleLanguage, loginWithTelegram, s }: {
  language: string;
  toggleLanguage: () => void;
  loginWithTelegram: () => Promise<void>;
  s: typeof t.uz;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <span className="landing__nav-logo">
            <Image src="/logo.svg" alt="Blim" width={100} height={34} className="landing__nav-logo-img" priority />
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
            <button className="landing__login-btn" onClick={loginWithTelegram} type="button">
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
                  <Image
                    src={`https://flagcdn.com/w160/${lang.code}.png`}
                    alt={lang.name}
                    width={56}
                    height={38}
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
        <button className="landing__cta-btn" onClick={loginWithTelegram} type="button">
          <TelegramIcon />
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
  const { user, isLoading, loginWithTelegram, logout } = useAuth();
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

  return <LandingPage language={language} toggleLanguage={toggleLanguage} loginWithTelegram={loginWithTelegram} s={s} />;
}
