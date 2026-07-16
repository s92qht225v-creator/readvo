'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePrimeAudioToken } from '@/hooks/useAudioToken';
import { protectAudioUrlSync } from '@/lib/audio/token-client';

type AdminTab = 'payments' | 'users' | 'audio' | 'glossary' | 'analyzer';

interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  plan: string;
  amount: number;
  screenshot_url: string;
  status: string;
  created_at: string;
  /* Marketplace fields (nullable when the row is a regular
     subscription payment). Approving a marketplace payment
     duplicates the source test into the buyer's workspace
     instead of granting a subscription. */
  kind?: 'subscription' | 'marketplace_test';
  marketplace_source_test_id?: string | null;
  marketplace_copy_test_id?: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  username: string;
  created_at: string;
  last_active: string | null;
}

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  plan: string;
  starts_at: string;
  ends_at: string;
}

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
}

const PLAN_LABELS: Record<string, string> = {
  '1_month': '1 oy',
  '3_months': '3 oy',
  '6_months': '6 oy',
  '12_months': '12 oy',
};

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const NAV_ICONS: Record<AdminTab, React.ReactNode> = {
  payments: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 9.5h19" /><path d="M6 15.5h4" /></svg>),
  users: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3.4 19.2c.7-3.3 3-5.2 5.6-5.2s4.9 1.9 5.6 5.2" /><path d="M16.6 6.1a3 3 0 0 1 0 5.8" /><path d="M17.8 19.2a7.8 7.8 0 0 0-1.5-3.7" /></svg>),
  audio: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 10v4M8 7.5v9M12 4v16M16 7.5v9M20 10.5v3" /></svg>),
  glossary: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4.5h10.5a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2V4.5z" /><path d="M5 18.2A1.8 1.8 0 0 1 6.8 16.4H17.5" /><path d="M9 8.6h5M9 11.4h3.4" /></svg>),
  analyzer: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5m5 14V9m5 10v-6m5 6V4" /></svg>),
};

interface AdminPanelProps {
  password: string;
}

export function AdminPanel({ password }: AdminPanelProps) {
  usePrimeAudioToken();
  const [tab, setTab] = useState<AdminTab>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(() => Date.now());

  // HSK analyzer tab state
  type AnalyzeRow = { zh: string; pinyin: string | null; level: number | null; estimate: boolean; inGlossary: boolean; gloss: string | null };
  type AnalyzeResult = { mode: string; count: number; words: AnalyzeRow[]; perLevel: Record<string, number>; offList: string[] };
  const [analyzeSlug, setAnalyzeSlug] = useState('');
  const [analyzeText, setAnalyzeText] = useState('');
  const [analyzeMode, setAnalyzeMode] = useState<'slug' | 'text'>('slug');
  const [analyzeSort, setAnalyzeSort] = useState<'order' | 'level'>('order');
  const [analyzeRes, setAnalyzeRes] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeErr, setAnalyzeErr] = useState('');
  // easy→hard colour band for a level badge (null = off-list)
  const lvlBand = (l: number | null) => (l === null ? 'off' : l <= 2 ? 'a' : l <= 4 ? 'b' : l <= 6 ? 'c' : 'd');
  const runAnalyze = async (payload: { slug?: string; text?: string }) => {
    setAnalyzing(true); setAnalyzeErr(''); setAnalyzeRes(null);
    try {
      const res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setAnalyzeErr(data.error || 'Xatolik'); return; }
      setAnalyzeRes(data);
    } catch (e) { setAnalyzeErr((e as Error).message); }
    finally { setAnalyzing(false); }
  };
  const lvlLabel = (l: number | null) => (l === null ? '—' : l === 7 ? '7–9' : String(l));

  // Audio tab state
  const [ttsText, setTtsText] = useState('');
  const [ttsStylePreset, setTtsStylePreset] = useState('slow');
  const [ttsCustomStyle, setTtsCustomStyle] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  type LibItem = { id: string; text: string; style: string; url: string; created_at: string };
  const [library, setLibrary] = useState<LibItem[]>([]);
  const ttsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Glossary tab state
  type GlossaryWord = { id: string; zh: string; py: string; uz: string; ru: string; en: string; hsk: number | null };
  const [glossary, setGlossary] = useState<GlossaryWord[]>([]);
  const [glossaryQ, setGlossaryQ] = useState('');
  const [editWord, setEditWord] = useState<Partial<GlossaryWord> | null>(null);
  const [glossaryErr, setGlossaryErr] = useState('');

  const loadGlossary = async (q = '') => {
    setGlossaryErr('');
    try {
      const res = await fetch(`/api/admin/glossary?q=${encodeURIComponent(q)}`, { headers: { 'x-admin-password': password } });
      const json = await res.json();
      if (!res.ok) { setGlossaryErr(json.error || 'Load failed'); return; }
      setGlossary(json.words || []);
    } catch { setGlossaryErr('Load failed'); }
  };
  const saveWord = async () => {
    setGlossaryErr('');
    const res = await fetch('/api/admin/glossary', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(editWord),
    });
    const json = await res.json();
    if (!res.ok) { setGlossaryErr(json.error || 'Save failed'); return; }
    setEditWord(null); await loadGlossary(glossaryQ);
  };
  const deleteWord = async (id: string) => {
    if (!confirm('Delete this word?')) return;
    const res = await fetch(`/api/admin/glossary?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } });
    if (!res.ok) { const j = await res.json().catch(() => ({})); setGlossaryErr(j.error || 'Delete failed'); return; }
    await loadGlossary(glossaryQ);
  };

  const loadLibrary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audio', { headers: { 'x-admin-password': password } });
      const j = await res.json();
      if (res.ok) setLibrary(j.items || []);
    } catch { /* ignore */ }
  }, [password]);
  const deleteLibraryItem = async (id: string) => {
    if (!confirm('Audioni o\'chirishni xohlaysizmi?')) return;
    const res = await fetch(`/api/admin/audio?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } });
    if (res.ok) setLibrary((prev) => prev.filter((x) => x.id !== id));
    else { const j = await res.json().catch(() => ({})); alert(`Xato: ${j.error || res.status}`); }
  };

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin', {
      headers: { 'x-admin-password': password },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        try { sessionStorage.removeItem('blim-admin-pw'); } catch {}
        window.location.reload();
      }
      return;
    }
    const data = await res.json();
    setPayments(data.payments);
    setUsers(data.users);
    setSubscriptions(data.subscriptions);
    setStats(data.stats);
    setLoading(false);
  }, [password]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-password': password },
      });

      if (cancelled) return;
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          try { sessionStorage.removeItem('blim-admin-pw'); } catch {}
          window.location.reload();
        }
        return;
      }

      const data = await res.json();
      if (cancelled) return;

      setPayments(data.payments);
      setUsers(data.users);
      setSubscriptions(data.subscriptions);
      setStats(data.stats);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [password]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  const handleAction = useCallback(async (action: string, payload: Record<string, unknown>) => {
    const loadingKey = (payload.paymentId || payload.subscriptionId || payload.userId || '') as string;
    setActionLoading(loadingKey);

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'x-admin-password': password,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    if (res.ok) {
      await fetchData();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Xato: ${err.error || res.status}`);
    }
    setActionLoading(null);
  }, [password, fetchData]);

  const handleDaysPrompt = useCallback((action: 'add_days' | 'remove_days', subscriptionId: string) => {
    const input = prompt(action === 'add_days' ? 'Necha kun qo\'shish?' : 'Necha kun olib tashlash?');
    if (!input) return;
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return;
    handleAction(action, { subscriptionId, days });
  }, [handleAction]);

  const handleGrantPrompt = useCallback((userId: string, userEmail: string) => {
    const input = prompt('Necha kun obuna berish?');
    if (!input) return;
    const days = parseInt(input, 10);
    if (isNaN(days) || days <= 0) return;
    handleAction('grant_subscription', { userId, userEmail, days });
  }, [handleAction]);

  const getUserSubscription = useCallback((userId: string) => {
    const nowDate = new Date();
    return subscriptions.find(
      (s) => s.user_id === userId && new Date(s.ends_at) > nowDate
    );
  }, [subscriptions]);

  const STYLE_PRESETS: { value: string; label: string }[] = [
    { value: 'slow', label: 'Slow & Clear (learner)' },
    { value: '', label: 'Default (no style)' },
    { value: '开心', label: 'Happy' },
    { value: '温柔，轻声', label: 'Gentle & Soft' },
    { value: 'Slow down', label: 'Slow' },
    { value: 'Speed up', label: 'Fast' },
    { value: 'Whisper', label: 'Whisper' },
    { value: 'custom', label: 'Custom...' },
  ];

  const INLINE_EVENTS = ['[cough]', '[pause]', '[sigh]', '(laugh)', '(sob)', 'um...', '[heavy breathing]'];

  const insertAtCursor = useCallback((tag: string) => {
    const ta = ttsTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ttsText.slice(0, start);
    const after = ttsText.slice(end);
    setTtsText(before + tag + after);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + tag.length;
    });
  }, [ttsText]);

  const getEffectiveStyle = useCallback(() => {
    if (ttsStylePreset === 'slow') return '语速缓慢，吐字清晰，适合语言学习者';
    if (ttsStylePreset === 'custom') return ttsCustomStyle;
    return ttsStylePreset;
  }, [ttsStylePreset, ttsCustomStyle]);

  const handleGenerate = useCallback(async () => {
    if (!ttsText.trim()) return;
    setTtsLoading(true);
    try {
      const style = getEffectiveStyle();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText.trim(), style, skipCache: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`TTS error: ${err.error || res.status}`);
        return;
      }
      const data = await res.json();
      if (data.audio) {
        // Persist the clip to the saved library (upload to Supabase + record a row).
        const save = await fetch('/api/admin/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
          body: JSON.stringify({ text: ttsText.trim(), style: style || '', audioBase64: data.audio }),
        });
        const sj = await save.json().catch(() => ({}));
        if (save.ok && sj.item) setLibrary(prev => [sj.item, ...prev]);
        else alert(`Saqlashda xato: ${sj.error || save.status}`);
      }
    } catch (e) {
      alert(`TTS failed: ${e}`);
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, getEffectiveStyle, password]);

  const playTtsAudio = useCallback((url: string) => {
    if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
    const el = ttsAudioRef.current;
    el.src = protectAudioUrlSync(url);
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const downloadTtsAudio = useCallback((url: string, text: string) => {
    const a = document.createElement('a');
    a.href = protectAudioUrlSync(url);
    a.download = `${text.slice(0, 30)}.wav`;
    a.click();
  }, []);

  const searchLower = search.toLowerCase();
  const filteredPayments = search
    ? payments.filter((p) => p.user_email.toLowerCase().includes(searchLower))
    : payments;
  const filteredUsers = (search
    ? users.filter((u) => u.email.toLowerCase().includes(searchLower) || u.name.toLowerCase().includes(searchLower) || u.username.toLowerCase().includes(searchLower))
    : users
  ).sort((a, b) => {
    if (!a.last_active && !b.last_active) return 0;
    if (!a.last_active) return 1;
    if (!b.last_active) return -1;
    return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
  });

  const NAV: { id: AdminTab; label: string; eyebrow: string; count: number | null }[] = [
    { id: 'payments', label: 'To’lovlar', eyebrow: 'Revenue ops', count: payments.length },
    { id: 'users', label: 'Foydalanuvchilar', eyebrow: 'Members', count: users.length },
    { id: 'audio', label: 'Audio', eyebrow: 'TTS studio', count: null },
    { id: 'glossary', label: 'Lug’at', eyebrow: 'Lexicon', count: glossary.length || null },
    { id: 'analyzer', label: 'HSK Analyzer', eyebrow: 'Levels', count: null },
  ];
  const activeNav = NAV.find((n) => n.id === tab) || NAV[0];

  if (loading) {
    return (
      <div className="adm adm--center">
        <div className="adm__spinner" aria-hidden="true" />
        <p className="adm__loading-text">Yuklanmoqda…</p>
      </div>
    );
  }

  return (
    <div className="adm">
      <meta name="robots" content="noindex, nofollow" />

      {/* ───────── Sidebar ───────── */}
      <aside className="adm__sidebar">
        <div className="adm__brand">
          <span className="adm__brand-mark">blim<span className="adm__brand-dot">.</span></span>
          <span className="adm__brand-eyebrow">Control deck</span>
        </div>

        <nav className="adm__nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`adm__nav-item${tab === n.id ? ' adm__nav-item--active' : ''}`}
              onClick={() => { setTab(n.id); if (n.id === 'glossary' && glossary.length === 0) loadGlossary(); if (n.id === 'audio') loadLibrary(); }}
            >
              <span className="adm__nav-ico">{NAV_ICONS[n.id]}</span>
              <span className="adm__nav-label">{n.label}</span>
              {n.count != null && <span className="adm__nav-count">{n.count}</span>}
            </button>
          ))}
        </nav>

        <div className="adm__sidefoot">
          <span className="adm__sidefoot-char" aria-hidden="true">字</span>
          <span className="adm__sidefoot-txt">Blim Admin<br /><em>internal</em></span>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <main className="adm__main">
        <header className="adm__topbar">
          <div className="adm__head">
            <span className="adm__eyebrow">{activeNav.eyebrow}</span>
            <h1 className="adm__title">{activeNav.label}</h1>
          </div>
          {(tab === 'payments' || tab === 'users') && (
            <div className="adm__search">
              <svg className="adm__search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-3.6-3.6" /></svg>
              <input
                className="adm__search-input"
                type="text"
                placeholder={tab === 'payments' ? 'Email…' : 'Ism yoki email…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button className="adm__search-clear" type="button" onClick={() => setSearch('')} aria-label="clear">&times;</button>}
            </div>
          )}
        </header>

        {stats && (
          <section className="adm__stats">
            <div className="adm__stat">
              <span className="adm__stat-num">{stats.totalUsers}</span>
              <span className="adm__stat-label">Foydalanuvchilar</span>
            </div>
            <div className="adm__stat">
              <span className="adm__stat-num">{stats.activeSubscriptions}</span>
              <span className="adm__stat-label">Faol obuna</span>
            </div>
            <div className="adm__stat adm__stat--accent">
              <span className="adm__stat-num">{formatPrice(stats.totalRevenue)}</span>
              <span className="adm__stat-label">Jami daromad · so&apos;m</span>
            </div>
            <div className="adm__stat">
              <span className="adm__stat-num">{stats.pendingPayments}</span>
              <span className="adm__stat-label">Kutilmoqda</span>
            </div>
          </section>
        )}

        {/* ───────── Payments ───────── */}
        {tab === 'payments' && (
          <section className="adm__grid">
            {filteredPayments.length === 0 ? (
              <p className="adm__empty">{search ? 'Natija topilmadi' : 'Hozircha to’lovlar yo’q'}</p>
            ) : filteredPayments.map((p) => (
              <article key={p.id} className={`adm__card adm__card--${p.status}`}>
                <div className="adm__card-top">
                  <span className="adm__email">{p.user_email}</span>
                  <span className={`adm__pill adm__pill--${p.status}`}>
                    {p.status === 'pending' ? 'Kutilmoqda' : p.status === 'approved' ? 'Tasdiqlangan' : p.status === 'cancelled' ? 'Bekor' : 'Rad etilgan'}
                  </span>
                </div>
                <div className="adm__meta">
                  <span className="adm__meta-plan">{p.kind === 'marketplace_test' ? `Test ${p.marketplace_source_test_id?.slice(0, 8) ?? '?'}` : (PLAN_LABELS[p.plan] || p.plan)}</span>
                  <span className="adm__meta-amt">{formatPrice(p.amount)}</span>
                  <span className="adm__meta-date">{formatDate(p.created_at)}</span>
                </div>
                {p.screenshot_url && (
                  <button type="button" className="adm__shot" onClick={() => setExpandedScreenshot(expandedScreenshot === p.screenshot_url ? null : p.screenshot_url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.screenshot_url} alt="To'lov skrinshoti" />
                  </button>
                )}
                <div className="adm__actions">
                  {p.status === 'pending' && (
                    <>
                      <button className="adm__btn adm__btn--approve" disabled={actionLoading === p.id} onClick={() => handleAction('approve', { paymentId: p.id })} type="button">{actionLoading === p.id ? '…' : 'Tasdiqlash'}</button>
                      <button className="adm__btn adm__btn--reject" disabled={actionLoading === p.id} onClick={() => handleAction('reject', { paymentId: p.id })} type="button">Rad etish</button>
                    </>
                  )}
                  <button className="adm__btn adm__btn--danger" disabled={actionLoading === p.id} onClick={() => { if (confirm('To’lovni butunlay o’chirishni xohlaysizmi?')) handleAction('delete_payment', { paymentId: p.id }); }} type="button">O’chirish</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* ───────── Users ───────── */}
        {tab === 'users' && (
          <div className="adm__table-wrap">
            <table className="adm__table adm__table--users">
              <thead>
                <tr><th>Ism</th><th>Username</th><th>Email</th><th>Ro&apos;yxat</th><th>Tashrif</th><th>Obuna</th><th aria-label="actions" /></tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="adm__table-empty">Natija topilmadi</td></tr>
                ) : filteredUsers.map((u) => {
                  const sub = getUserSubscription(u.id);
                  const daysLeft = sub ? Math.ceil((new Date(sub.ends_at).getTime() - now) / (24 * 60 * 60 * 1000)) : 0;
                  return (
                    <tr key={u.id}>
                      <td className="adm__td-name">{u.name}</td>
                      <td className="adm__td-handle">{u.username ? `@${u.username}` : <span className="adm__dash">—</span>}</td>
                      <td className="adm__td-email">{u.email}</td>
                      <td className="adm__td-date">{formatDate(u.created_at)}</td>
                      <td className="adm__td-date">{u.last_active ? formatDate(u.last_active) : <span className="adm__dash">—</span>}</td>
                      <td>{sub
                        ? <span className="adm__pill adm__pill--approved">{daysLeft} kun</span>
                        : <span className="adm__pill adm__pill--none">Yo&apos;q</span>}</td>
                      <td className="adm__rowact">
                        {sub ? (
                          <>
                            <button className="adm__rowbtn" disabled={actionLoading === sub.id} onClick={() => handleDaysPrompt('add_days', sub.id)} type="button">+Kun</button>
                            <button className="adm__rowbtn" disabled={actionLoading === sub.id} onClick={() => handleDaysPrompt('remove_days', sub.id)} type="button">−Kun</button>
                            <button className="adm__rowbtn adm__rowbtn--del" disabled={actionLoading === sub.id} onClick={() => { if (confirm('Obunani bekor qilishni xohlaysizmi?')) handleAction('cancel_subscription', { subscriptionId: sub.id }); }} type="button">Bekor</button>
                          </>
                        ) : (
                          <button className="adm__rowbtn adm__rowbtn--grant" disabled={actionLoading === u.id} onClick={() => handleGrantPrompt(u.id, u.email)} type="button">+ Obuna</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ───────── Audio (TTS) ───────── */}
        {tab === 'audio' && (
          <section className="adm__studio">
            <div className="adm__panel">
              <textarea ref={ttsTextareaRef} value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder="Chinese text to generate audio…" rows={3} className="adm__textarea" />
              <div className="adm__chips">
                {INLINE_EVENTS.map((tag) => (
                  <button key={tag} type="button" className="adm__chip" onClick={() => insertAtCursor(tag)}>{tag}</button>
                ))}
              </div>
              <div className="adm__studio-row">
                <select value={ttsStylePreset} onChange={(e) => setTtsStylePreset(e.target.value)} className="adm__select">
                  {STYLE_PRESETS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                </select>
                {ttsStylePreset === 'custom' && (
                  <input type="text" value={ttsCustomStyle} onChange={(e) => setTtsCustomStyle(e.target.value)} placeholder="e.g. angry but calm…" className="adm__input adm__input--grow" />
                )}
                <button type="button" className="adm__btn adm__btn--accent" onClick={handleGenerate} disabled={ttsLoading || !ttsText.trim()}>{ttsLoading ? 'Generating…' : 'Generate'}</button>
              </div>
            </div>

            <div className="adm__history">
              <h3 className="adm__history-title">Saqlangan audiolar · {library.length}</h3>
              {library.length === 0 ? (
                <p className="adm__empty" style={{ padding: '32px 0', textAlign: 'left' }}>Hali saqlangan audio yo&apos;q. Yuqorida matn kiriting va «Generate» bosing.</p>
              ) : library.map((item) => (
                <div key={item.id} className="adm__audio-item">
                  <div className="adm__audio-meta">
                    <span className="adm__audio-text">{item.text}</span>
                    <span className="adm__audio-style">{item.style || '(default)'}</span>
                  </div>
                  <div className="adm__audio-btns">
                    <button type="button" className="adm__btn adm__btn--ghost" onClick={() => playTtsAudio(item.url)}>► Play</button>
                    <button type="button" className="adm__btn adm__btn--ghost" onClick={() => downloadTtsAudio(item.url, item.text)}>↓</button>
                    <button type="button" className="adm__btn adm__btn--danger" onClick={() => deleteLibraryItem(item.id)}>O&apos;chirish</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ───────── Glossary ───────── */}
        {tab === 'glossary' && (
          <section className="adm__glossary">
            <div className="adm__toolbar">
              <div className="adm__field">
                <svg className="adm__search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-3.6-3.6" /></svg>
                <input className="adm__field-input" placeholder="汉字 / pinyin / tarjima…" value={glossaryQ} onChange={(e) => setGlossaryQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadGlossary(glossaryQ); }} />
              </div>
              <button className="adm__btn adm__btn--ghost" onClick={() => loadGlossary(glossaryQ)} type="button">Qidirish</button>
              <button className="adm__btn adm__btn--accent" onClick={() => { setEditWord({ zh: '', py: '', uz: '', ru: '', en: '', hsk: null }); setGlossaryErr(''); }} type="button">+ So&apos;z</button>
              <span className="adm__count">{glossary.length} ta</span>
            </div>

            {editWord && (
              <div className="adm__editor">
                <div className="adm__editor-grid">
                  {(['zh', 'py', 'uz', 'ru', 'en'] as const).map((f) => (
                    <label key={f} className="adm__field-lbl">
                      <span>{f.toUpperCase()}</span>
                      <input className="adm__input" placeholder={f} value={(editWord as Record<string, string>)[f] || ''} onChange={(e) => setEditWord({ ...editWord, [f]: e.target.value })} />
                    </label>
                  ))}
                  <label className="adm__field-lbl">
                    <span>HSK</span>
                    <input className="adm__input" placeholder="1–6" value={editWord.hsk ?? ''} onChange={(e) => setEditWord({ ...editWord, hsk: e.target.value ? Number(e.target.value) : null })} />
                  </label>
                </div>
                {glossaryErr && <div className="adm__err">{glossaryErr}</div>}
                <div className="adm__editor-actions">
                  <button className="adm__btn adm__btn--accent" onClick={saveWord} type="button">Saqlash</button>
                  <button className="adm__btn adm__btn--ghost" onClick={() => setEditWord(null)} type="button">Bekor</button>
                </div>
              </div>
            )}

            <div className="adm__table-wrap">
              <table className="adm__table">
                <thead>
                  <tr><th>汉字</th><th>Pinyin</th><th>UZ</th><th>RU</th><th>EN</th><th>HSK</th><th aria-label="actions" /></tr>
                </thead>
                <tbody>
                  {glossary.length === 0 ? (
                    <tr><td colSpan={7} className="adm__table-empty">Hech narsa yo&apos;q — qidiring yoki so&apos;z qo&apos;shing</td></tr>
                  ) : glossary.map((w) => (
                    <tr key={w.id}>
                      <td className="adm__zh">{w.zh}</td>
                      <td className="adm__py">{w.py}</td>
                      <td>{w.uz}</td>
                      <td>{w.ru}</td>
                      <td>{w.en}</td>
                      <td>{w.hsk != null ? <span className="adm__hsk">H{w.hsk}</span> : <span className="adm__dash">—</span>}</td>
                      <td className="adm__rowact">
                        <button className="adm__rowbtn" onClick={() => { setEditWord(w); setGlossaryErr(''); }} type="button">Edit</button>
                        <button className="adm__rowbtn adm__rowbtn--del" onClick={() => deleteWord(w.id)} type="button">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'analyzer' && (
          <section className="hska">
            {/* input mode toggle */}
            <div className="hska__modes">
              <button type="button" className={`hska__mode${analyzeMode === 'slug' ? ' hska__mode--on' : ''}`} onClick={() => setAnalyzeMode('slug')}>Dialog</button>
              <button type="button" className={`hska__mode${analyzeMode === 'text' ? ' hska__mode--on' : ''}`} onClick={() => setAnalyzeMode('text')}>Matn</button>
            </div>

            {analyzeMode === 'slug' ? (
              <div className="hska__inputrow">
                <input className="hska__input" placeholder="Dialog slug — masalan: are-you-cold" value={analyzeSlug}
                  onChange={(e) => setAnalyzeSlug(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && analyzeSlug.trim()) runAnalyze({ slug: analyzeSlug.trim() }); }} />
                <button className="hska__go" type="button" disabled={!analyzeSlug.trim() || analyzing}
                  onClick={() => runAnalyze({ slug: analyzeSlug.trim() })}>{analyzing ? '…' : 'Tahlil'}</button>
              </div>
            ) : (
              <div className="hska__inputrow hska__inputrow--text">
                <textarea className="hska__textarea" rows={3} placeholder="Xitoycha matn qo'ying — 你好！你今天加班吗？" value={analyzeText}
                  onChange={(e) => setAnalyzeText(e.target.value)} />
                <button className="hska__go" type="button" disabled={!analyzeText.trim() || analyzing}
                  onClick={() => runAnalyze({ text: analyzeText.trim() })}>{analyzing ? '…' : 'Tahlil'}</button>
              </div>
            )}

            <p className="hska__legend">
              <span className="hska__b hska__b--a">1–2</span><span className="hska__b hska__b--b">3–4</span>
              <span className="hska__b hska__b--c">5–6</span><span className="hska__b hska__b--d">7–9</span>
              <span className="hska__b hska__b--off">—</span>
              &nbsp;daraja &nbsp;·&nbsp; <b>≈</b> qismlardan taxminiy &nbsp;·&nbsp; <b>—</b> HSK 3.0&apos;da yo&apos;q
            </p>

            {analyzeErr && <div className="adm__err">{analyzeErr}</div>}

            {analyzeRes && (() => {
              const levels = Object.keys(analyzeRes.perLevel).map(Number).filter((l) => l > 0);
              const maxLvl = levels.length ? Math.max(...levels) : null;
              const rows = [...analyzeRes.words];
              if (analyzeSort === 'level') rows.sort((a, b) => (b.level ?? 99) - (a.level ?? 99));
              return (
                <>
                  {/* headline: highest level in the dialogue = the decision anchor */}
                  <div className="hska__headline">
                    <div className="hska__headline-main">
                      <span className="hska__headline-num">{maxLvl === null ? '—' : maxLvl === 7 ? '7–9' : maxLvl}</span>
                      <span className="hska__headline-lbl">eng yuqori daraja<br /><em>{analyzeRes.count} so&apos;z{analyzeRes.mode === 'text' ? ' · taxminiy bo‘lish' : ''}</em></span>
                    </div>
                    <div className="hska__dist">
                      {[1, 2, 3, 4, 5, 6, 7].map((l) => analyzeRes.perLevel[l] ? (
                        <span key={l} className={`hska__chip hska__b--${lvlBand(l)}`}>{l === 7 ? '7–9' : l}<b>{analyzeRes.perLevel[l]}</b></span>
                      ) : null)}
                      {analyzeRes.offList.length > 0 && <span className="hska__chip hska__b--off">—<b>{analyzeRes.offList.length}</b></span>}
                    </div>
                  </div>

                  <div className="hska__tools">
                    <span>Saralash:</span>
                    <button type="button" className={`hska__sort${analyzeSort === 'order' ? ' hska__sort--on' : ''}`} onClick={() => setAnalyzeSort('order')}>Tartib bo&apos;yicha</button>
                    <button type="button" className={`hska__sort${analyzeSort === 'level' ? ' hska__sort--on' : ''}`} onClick={() => setAnalyzeSort('level')}>Daraja bo&apos;yicha</button>
                  </div>

                  <div className="hska__grid">
                    {rows.map((w, i) => (
                      <div key={w.zh + i} className={`hska__word${w.level === maxLvl && maxLvl && maxLvl > 1 ? ' hska__word--top' : ''}`}>
                        <span className={`hska__badge hska__b--${lvlBand(w.level)}`}>
                          {w.level === null ? '—' : (w.estimate ? '≈' : '') + lvlLabel(w.level)}
                        </span>
                        <span className="hska__zh">{w.zh}</span>
                        <span className="hska__py">{w.pinyin || ''}</span>
                        <span className="hska__gloss">{w.gloss || (w.inGlossary ? '' : <em>lug&apos;atda yo&apos;q</em>)}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </section>
        )}
      </main>

      {/* Expanded screenshot overlay */}
      {expandedScreenshot && (
        <div className="adm__overlay" onClick={() => setExpandedScreenshot(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expandedScreenshot} alt="Screenshot" className="adm__overlay-img" />
        </div>
      )}
    </div>
  );
}
