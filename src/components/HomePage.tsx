'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { PageFooter } from './PageFooter';
import { useAuth } from '../hooks/useAuth';
import { AdminPanel } from './AdminPanel';

const t = {
  uz: {
    login: 'Telegram orqali kirish',
    heroTitle: 'Xitoy tilini online o\'rganing — HSK 1–6 darslari, dialoglar va karaoke',
    heroSubtitle: 'Pinyin, audio, tarjima va flashkartalar bilan xitoy tilini samarali o\'rganing',
    startFree: 'Bepul boshlang',
    languages: 'Tillarni tanlang',
    howItWorks: 'Qanday ishlaydi?',
    step1Title: 'Dialoglarni tinglang',
    step1Desc: 'Pinyin, tarjima va audio bilan har bir gapni tushunib o\'qing',
    step2Title: 'So\'zlarni yodlang',
    step2Desc: 'Flashkartalar va ieroglif yozish mashqlari bilan mustahkamlang',
    step3Title: 'Karaoke bilan mashq qiling',
    step3Desc: 'Xitoycha qo\'shiqlarni kuylang va talaffuzingizni yaxshilang',
    step4Title: 'Bilimingizni test qiling',
    step4Desc: 'Testlar bilan o\'zingizni sinab ko\'ring va natijangizni kuzating',
    features: 'Imkoniyatlar',
    feat1Title: 'Pinyin yoqish/o\'chirish',
    feat1Desc: 'Har bir gap uchun pinyin va tarjimani alohida yoqing yoki o\'chiring',
    feat2Title: 'Gapma-gap audio',
    feat2Desc: 'Har bir gapni alohida bosib tinglang yoki butun dialogni ijro eting',
    feat3Title: 'Grammatika',
    feat3Desc: 'Grammatik mavzular: 是, 有, 在, 的, 不, 吗 va boshqalar',
    feat4Title: 'Fokus rejimi',
    feat4Desc: 'Bitta gapga e\'tiborni jamlang va uni qayta-qayta tinglang',
    feat5Title: 'Aqlli takrorlash',
    feat5Desc: 'Bilgan ierogliflaringiz kamroq, bilmaganlar ko\'proq takrorlanadi',
    feat6Title: 'Ikki tilli',
    feat6Desc: 'Barcha tarjimalar o\'zbek va rus tillarida mavjud',
    showcaseTitle: 'Bosib tarjima qiling',
    showcaseSubtitle: 'Matnda istalgan so\'zni bosing va tarjimasini ko\'ring',
    showcaseLabel1: 'Flashkartalar bilan mashq qiling',
    showcaseLabel2: 'Kontekstda tushunish',
    ctaTitle: '7 kun bepul sinab ko\'ring',
    ctaSubtitle: 'Ro\'yxatdan o\'ting va barcha imkoniyatlardan foydalaning — hech qanday to\'lov talab qilinmaydi',
    footerText: 'Blim — Interaktiv til darsliklari',
    chinese: 'Xitoy tili',
    english: 'Ingliz tili',
    tagline: 'Interaktiv til darsliklari',
  },
  ru: {
    login: 'Войти через Telegram',
    heroTitle: 'Учите китайский онлайн — уроки HSK 1–6, диалоги и караоке',
    heroSubtitle: 'Эффективно учите китайский с пиньинь, аудио, переводом и карточками',
    startFree: 'Начать бесплатно',
    languages: 'Выберите язык',
    howItWorks: 'Как это работает?',
    step1Title: 'Слушайте диалоги',
    step1Desc: 'Читайте каждое предложение с пиньинь, переводом и аудио',
    step2Title: 'Запоминайте слова',
    step2Desc: 'Закрепляйте с помощью карточек и упражнений по написанию иероглифов',
    step3Title: 'Пойте караоке',
    step3Desc: 'Пойте китайские песни и улучшайте произношение',
    step4Title: 'Проверьте свои знания',
    step4Desc: 'Проходите тесты и отслеживайте свой прогресс',
    features: 'Возможности',
    feat1Title: 'Пиньинь вкл/выкл',
    feat1Desc: 'Включайте или выключайте пиньинь и перевод для каждого предложения',
    feat2Title: 'Аудио по предложениям',
    feat2Desc: 'Нажмите на предложение, чтобы прослушать, или включите весь диалог',
    feat3Title: 'Грамматика',
    feat3Desc: 'Грамматические темы: 是, 有, 在, 的, 不, 吗 и другие',
    feat4Title: 'Режим фокуса',
    feat4Desc: 'Сфокусируйтесь на одном предложении и слушайте его многократно',
    feat5Title: 'Умное повторение',
    feat5Desc: 'Знакомые иероглифы реже, незнакомые — чаще повторяются',
    feat6Title: 'Двуязычный',
    feat6Desc: 'Переводы на узбекском и русском языках',
    showcaseTitle: 'Нажмите для перевода',
    showcaseSubtitle: 'Просто нажмите на любое слово в тексте, чтобы увидеть перевод',
    showcaseLabel1: 'Практикуйте с карточками',
    showcaseLabel2: 'Понимайте в контексте',
    ctaTitle: '7 дней бесплатно',
    ctaSubtitle: 'Зарегистрируйтесь и получите полный доступ ко всем функциям — без оплаты',
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

      <PageFooter />
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
            <Image src="/logo-red.svg" alt="Blim" width={100} height={34} className="landing__nav-logo-img" priority />
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
        <p className="landing__hero-subtitle">{s.heroSubtitle}</p>
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
            <div className="landing__demo-audio-row">
              <div className="landing__demo-audio-btn">▶</div>
              <div className="landing__demo-audio-text">
                <div className="landing__demo-chinese">你想吃什么？</div>
                <div className="landing__demo-line landing__demo-line--pinyin">Nǐ xiǎng chī shénme?</div>
                <div className="landing__demo-line landing__demo-line--translation">{language === 'ru' ? 'Что ты хочешь поесть?' : 'Nima yemoqchisan?'}</div>
              </div>
            </div>
            <div className="landing__demo-waveform">
              {[3,5,8,12,7,10,14,9,6,11,15,8,5,9,13,7,4,8,11,6,3].map((h, i) => (
                <div key={i} className="landing__demo-wave-bar" style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="landing__hero-langs">
          <div className="landing__hero-langs-inner">
            <div className="landing__hero-langs-row">
              {[
                { code: 'uz', name: "O'zbek tili" },
                { code: 'ru', name: 'Русский язык' },
              ].map((lang) => (
                <div key={lang.name} className="landing__hero-lang">
                  <Image
                    src={`https://flagcdn.com/w320/${lang.code}.png`}
                    alt={lang.name}
                    width={120}
                    height={80}
                    className="landing__hero-lang-flag"
                    style={lang.code === 'uz' ? { objectPosition: 'left center' } : undefined}
                  />
                  <span className="landing__hero-lang-name">{lang.name}</span>
                </div>
              ))}
            </div>
            <p className="landing__hero-langs-more">
              {language === 'ru' ? '+ Казахский, скоро...' : "+ Qozoq tili, tez kunda..."}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing__section landing__section--gray">
        <h2 className="landing__section-title">{s.howItWorks}</h2>
        <div className="landing__steps">
          <div className="landing__step">
            <div className="landing__step-num">1</div>
            <h3 className="landing__step-title">{s.step1Title}</h3>
            <p className="landing__step-desc">{s.step1Desc}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-num">2</div>
            <h3 className="landing__step-title">{s.step2Title}</h3>
            <p className="landing__step-desc">{s.step2Desc}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-num">3</div>
            <h3 className="landing__step-title">{s.step3Title}</h3>
            <p className="landing__step-desc">{s.step3Desc}</p>
          </div>
          <div className="landing__step">
            <div className="landing__step-num">4</div>
            <h3 className="landing__step-title">{s.step4Title}</h3>
            <p className="landing__step-desc">{s.step4Desc}</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing__section">
        <h2 className="landing__section-title">{s.features}</h2>
        <div className="landing__features">
          {[
            { title: s.feat1Title, desc: s.feat1Desc },
            { title: s.feat2Title, desc: s.feat2Desc },
            { title: s.feat3Title, desc: s.feat3Desc },
            { title: s.feat4Title, desc: s.feat4Desc },
            { title: s.feat5Title, desc: s.feat5Desc },
            { title: s.feat6Title, desc: s.feat6Desc },
          ].map((feat) => (
            <div key={feat.title} className="landing__feature">
              <h3 className="landing__feature-title">{feat.title}</h3>
              <p className="landing__feature-desc">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__section landing__section--gray">
        <h2 className="landing__section-title">{language === 'ru' ? 'Отзывы' : 'Foydalanuvchilar fikri'}</h2>
        <div className="landing__testimonials">
          {[
            {
              name: language === 'ru' ? 'Дилноза, 22' : 'Dilnoza, 22',
              text: language === 'ru'
                ? 'Караоке — мой любимый способ учить китайский. Теперь я пою песни и запоминаю слова легко!'
                : 'Karaoke — xitoy tilini o\'rganishning eng yoqimli usuli. Endi qo\'shiq aytib so\'zlarni oson yodlayman!',
            },
            {
              name: language === 'ru' ? 'Азиз, 19' : 'Aziz, 19',
              text: language === 'ru'
                ? 'Раньше я путался в тонах, но благодаря аудио к каждому предложению мое произношение стало намного лучше.'
                : 'Oldin tonlarda adashardim, lekin har bir gapdagi audio tufayli talaffuzim ancha yaxshilandi.',
            },
            {
              name: language === 'ru' ? 'Мадина, 25' : 'Madina, 25',
              text: language === 'ru'
                ? 'Флешкарты и написание иероглифов — очень удобно. За месяц выучила больше 200 слов!'
                : 'Fleshkartalar va ieroglif yozish — juda qulay. Bir oyda 200 dan ortiq so\'z yodladim!',
            },
          ].map((t) => (
            <div key={t.name} className="landing__testimonial">
              <div className="landing__testimonial-stars">{'★★★★★'}</div>
              <p className="landing__testimonial-text">&ldquo;{t.text}&rdquo;</p>
              <p className="landing__testimonial-name">— {t.name}</p>
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
        <Image src="/logo.svg" alt="Blim" width={64} height={28} className="landing__footer-logo" />
        <p className="landing__footer-text">{s.footerText}</p>
        <Link href="/blog" className="landing__footer-link">Blog</Link>
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
  const [hasMounted, setHasMounted] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminError, setAdminError] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => setHasMounted(true), []);

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

  /* ── SSR + initial hydration: always render landing page ──
     This ensures crawlers (and Semrush) see the full content in
     the HTML. Auth-based routing only kicks in after mount. */
  if (!hasMounted) {
    return <LandingPage language={language} toggleLanguage={toggleLanguage} loginWithTelegram={loginWithTelegram} s={s} />;
  }

  /* ── Client-side only from here ── */

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

  // Logged-in user: show loading while redirect fires
  if (!isLoading && user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>Loading...</p>
    </div>
  );

  // Loading or logged-out: show landing page (no flash for logged-out users)
  return <LandingPage language={language} toggleLanguage={toggleLanguage} loginWithTelegram={loginWithTelegram} s={s} />;
}
