'use client';

import React, { useState, useEffect, useCallback } from 'react';

type AdminTab = 'payments' | 'users';

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
  created_at: string;
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

  const handleAction = useCallback(async (action: 'approve' | 'reject', paymentId: string) => {
    setActionLoading(paymentId);

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'x-admin-password': password,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, paymentId }),
    });

    if (res.ok) {
      await fetchData();
    }
    setActionLoading(null);
  }, [password, fetchData]);

  const getUserSubscription = useCallback((userId: string) => {
    const now = new Date();
    return subscriptions.find(
      (s) => s.user_id === userId && new Date(s.ends_at) > now
    );
  }, [subscriptions]);

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
      </div>

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="admin__list">
          {payments.length === 0 ? (
            <p className="admin__empty">Hozircha to&apos;lovlar yo&apos;q</p>
          ) : (
            payments.map((p) => (
              <div key={p.id} className={`admin__card admin__card--${p.status}`}>
                <div className="admin__card-header">
                  <span className="admin__card-email">{p.user_email}</span>
                  <span className={`admin__badge admin__badge--${p.status}`}>
                    {p.status === 'pending' ? 'Kutilmoqda' : p.status === 'approved' ? 'Tasdiqlangan' : 'Rad etilgan'}
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
                      onClick={() => handleAction('approve', p.id)}
                      disabled={actionLoading === p.id}
                      type="button"
                    >
                      {actionLoading === p.id ? '...' : 'Tasdiqlash'}
                    </button>
                    <button
                      className="admin__btn admin__btn--reject"
                      onClick={() => handleAction('reject', p.id)}
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
          {users.map((u) => {
            const sub = getUserSubscription(u.id);
            return (
              <div key={u.id} className="admin__card">
                <div className="admin__card-header">
                  <div>
                    <span className="admin__card-name">{u.name}</span>
                    <span className="admin__card-email">{u.email}</span>
                  </div>
                  {sub ? (
                    <span className="admin__badge admin__badge--approved">
                      {PLAN_LABELS[sub.plan] || sub.plan} &rarr; {formatDate(sub.ends_at)}
                    </span>
                  ) : (
                    <span className="admin__badge admin__badge--none">Obuna yo&apos;q</span>
                  )}
                </div>
                <div className="admin__card-details">
                  <span>Ro&apos;yxatdan o&apos;tgan: {formatDate(u.created_at)}</span>
                </div>
              </div>
            );
          })}
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
