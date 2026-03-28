'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

type AdminTab = 'payments' | 'users' | 'audio';

interface Payment {
  id: string;
  user_id: string;
  user_email: string;
  plan: string;
  amount: number;
  screenshot_url: string;
  status: string;
  created_at: string;
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

interface AdminPanelProps {
  password: string;
}

export function AdminPanel({ password }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Audio tab state
  const [ttsText, setTtsText] = useState('');
  const [ttsStylePreset, setTtsStylePreset] = useState('slow');
  const [ttsCustomStyle, setTtsCustomStyle] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsItems, setTtsItems] = useState<{ text: string; style: string; url: string }[]>([]);
  const ttsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin', {
      headers: { 'x-admin-password': password },
    });

    if (!res.ok) return;
    const data = await res.json();
    setPayments(data.payments);
    setUsers(data.users);
    setSubscriptions(data.subscriptions);
    setStats(data.stats);
    setLoading(false);
  }, [password]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const now = new Date();
    return subscriptions.find(
      (s) => s.user_id === userId && new Date(s.ends_at) > now
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
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setTtsItems(prev => [{ text: ttsText.trim(), style: style || '(default)', url }, ...prev]);
      }
    } catch (e) {
      alert(`TTS failed: ${e}`);
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, getEffectiveStyle]);

  const playTtsAudio = useCallback((url: string) => {
    if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
    const el = ttsAudioRef.current;
    el.src = url;
    el.currentTime = 0;
    el.play().catch(() => {});
  }, []);

  const downloadTtsAudio = useCallback((url: string, text: string) => {
    const a = document.createElement('a');
    a.href = url;
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

  if (loading) {
    return (
      <div className="admin">
        <p className="admin__loading">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="admin">
      <meta name="robots" content="noindex, nofollow" />

      {/* Stats */}
      {stats && (
        <div className="admin__stats">
          <div className="admin__stat">
            <span className="admin__stat-value">{stats.totalUsers}</span>
            <span className="admin__stat-label">Foydalanuvchilar</span>
          </div>
          <div className="admin__stat">
            <span className="admin__stat-value">{stats.activeSubscriptions}</span>
            <span className="admin__stat-label">Faol obuna</span>
          </div>
          <div className="admin__stat">
            <span className="admin__stat-value">{formatPrice(stats.totalRevenue)}</span>
            <span className="admin__stat-label">Jami daromad</span>
          </div>
          <div className="admin__stat">
            <span className="admin__stat-value">{stats.pendingPayments}</span>
            <span className="admin__stat-label">Kutilmoqda</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin__tabs">
        <button
          className={`admin__tab${tab === 'payments' ? ' admin__tab--active' : ''}`}
          onClick={() => setTab('payments')}
          type="button"
        >
          To&apos;lovlar ({payments.length})
        </button>
        <button
          className={`admin__tab${tab === 'users' ? ' admin__tab--active' : ''}`}
          onClick={() => setTab('users')}
          type="button"
        >
          Foydalanuvchilar ({users.length})
        </button>
        <button
          className={`admin__tab${tab === 'audio' ? ' admin__tab--active' : ''}`}
          onClick={() => setTab('audio')}
          type="button"
        >
          Audio
        </button>
      </div>

      {/* Search */}
      <div className="admin__search">
        <input
          className="admin__search-input"
          type="text"
          placeholder={tab === 'payments' ? 'Email bo\'yicha qidirish...' : 'Ism yoki email bo\'yicha qidirish...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="admin__search-clear" type="button" onClick={() => setSearch('')}>
            &times;
          </button>
        )}
      </div>

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="admin__list">
          {filteredPayments.length === 0 ? (
            <p className="admin__empty">{search ? 'Natija topilmadi' : 'Hozircha to\'lovlar yo\'q'}</p>
          ) : (
            filteredPayments.map((p) => (
              <div key={p.id} className={`admin__card admin__card--${p.status}`}>
                <div className="admin__card-header">
                  <span className="admin__card-email">{p.user_email}</span>
                  <span className={`admin__badge admin__badge--${p.status}`}>
                    {p.status === 'pending' ? 'Kutilmoqda' : p.status === 'approved' ? 'Tasdiqlangan' : p.status === 'cancelled' ? 'Bekor qilingan' : 'Rad etilgan'}
                  </span>
                </div>
                <div className="admin__card-details">
                  <span>{PLAN_LABELS[p.plan] || p.plan}</span>
                  <span>{formatPrice(p.amount)} so&apos;m</span>
                  <span>{formatDate(p.created_at)}</span>
                </div>
                {p.screenshot_url && (
                  <div className="admin__screenshot-wrap">
                    <img
                      src={p.screenshot_url}
                      alt="Screenshot"
                      className="admin__screenshot"
                      onClick={() => setExpandedScreenshot(
                        expandedScreenshot === p.screenshot_url ? null : p.screenshot_url
                      )}
                    />
                  </div>
                )}
                {p.status === 'pending' && (
                  <div className="admin__actions">
                    <button
                      className="admin__btn admin__btn--approve"
                      onClick={() => handleAction('approve', { paymentId: p.id })}
                      disabled={actionLoading === p.id}
                      type="button"
                    >
                      {actionLoading === p.id ? '...' : 'Tasdiqlash'}
                    </button>
                    <button
                      className="admin__btn admin__btn--reject"
                      onClick={() => handleAction('reject', { paymentId: p.id })}
                      disabled={actionLoading === p.id}
                      type="button"
                    >
                      Rad etish
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="admin__list">
          {filteredUsers.length === 0 ? (
            <p className="admin__empty">Natija topilmadi</p>
          ) : filteredUsers.map((u) => {
            const sub = getUserSubscription(u.id);
            const daysLeft = sub ? Math.ceil((new Date(sub.ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
            return (
              <div key={u.id} className="admin__card">
                <div className="admin__card-header">
                  <div>
                    <span className="admin__card-name">{u.name}</span>
                    <span className="admin__card-email">{u.username ? `@${u.username}` : u.email}</span>
                  </div>
                  {sub ? (
                    <span className="admin__badge admin__badge--approved">
                      {daysLeft} kun &rarr; {formatDate(sub.ends_at)}
                    </span>
                  ) : (
                    <span className="admin__badge admin__badge--none">Obuna yo&apos;q</span>
                  )}
                </div>
                <div className="admin__card-details">
                  <span>Ro&apos;yxatdan o&apos;tgan: {formatDate(u.created_at)}</span>
                  <span style={{ marginLeft: 12 }}>Oxirgi tashrif: {u.last_active ? formatDate(u.last_active) : '—'}</span>
                </div>
                <div className="admin__sub-actions">
                  {sub ? (
                    <>
                      <button
                        className="admin__sub-btn admin__sub-btn--add"
                        onClick={() => handleDaysPrompt('add_days', sub.id)}
                        disabled={actionLoading === sub.id}
                        type="button"
                      >
                        + Kun
                      </button>
                      <button
                        className="admin__sub-btn admin__sub-btn--remove"
                        onClick={() => handleDaysPrompt('remove_days', sub.id)}
                        disabled={actionLoading === sub.id}
                        type="button"
                      >
                        - Kun
                      </button>
                      <button
                        className="admin__sub-btn admin__sub-btn--cancel"
                        onClick={() => { if (confirm('Obunani bekor qilishni xohlaysizmi?')) handleAction('cancel_subscription', { subscriptionId: sub.id }); }}
                        disabled={actionLoading === sub.id}
                        type="button"
                      >
                        Bekor qilish
                      </button>
                    </>
                  ) : (
                    <button
                      className="admin__sub-btn admin__sub-btn--grant"
                      onClick={() => handleGrantPrompt(u.id, u.email)}
                      disabled={actionLoading === u.id}
                      type="button"
                    >
                      Obuna berish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audio Tab */}
      {tab === 'audio' && (
        <div style={{ padding: '16px 0' }}>
          <div className="admin__card" style={{ padding: 16 }}>
            <textarea
              ref={ttsTextareaRef}
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Chinese text to generate audio..."
              rows={3}
              style={{ width: '100%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical', fontFamily: 'inherit' }}
            />

            {/* Inline audio events */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {INLINE_EVENTS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertAtCursor(tag)}
                  style={{ padding: '4px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #ccc', background: '#f5f5f5', cursor: 'pointer' }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Style selector */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={ttsStylePreset}
                onChange={(e) => setTtsStylePreset(e.target.value)}
                style={{ padding: '6px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #ddd' }}
              >
                {STYLE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {ttsStylePreset === 'custom' && (
                <input
                  type="text"
                  value={ttsCustomStyle}
                  onChange={(e) => setTtsCustomStyle(e.target.value)}
                  placeholder="e.g. angry but calm, Sichuan dialect..."
                  style={{ flex: 1, minWidth: 200, padding: '6px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #ddd' }}
                />
              )}
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={ttsLoading || !ttsText.trim()}
              style={{
                marginTop: 12, padding: '10px 24px', fontSize: 15, fontWeight: 600,
                borderRadius: 6, border: 'none', color: '#fff',
                background: ttsLoading || !ttsText.trim() ? '#aaa' : '#dc2626',
                cursor: ttsLoading || !ttsText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {ttsLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {/* Session history */}
          {ttsItems.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#666' }}>Generated ({ttsItems.length})</h3>
              {ttsItems.map((item, i) => (
                <div key={i} className="admin__card" style={{ padding: '10px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 500 }}>{item.text}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{item.style}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => playTtsAudio(item.url)}
                        style={{ padding: '6px 12px', fontSize: 13, borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                      >
                        &#9654; Play
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTtsAudio(item.url, item.text)}
                        style={{ padding: '6px 12px', fontSize: 13, borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                      >
                        &#8595; Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expanded screenshot overlay */}
      {expandedScreenshot && (
        <div
          className="admin__overlay"
          onClick={() => setExpandedScreenshot(null)}
        >
          <img src={expandedScreenshot} alt="Screenshot" className="admin__overlay-img" />
        </div>
      )}
    </div>
  );
}
