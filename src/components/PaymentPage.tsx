'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

const PLANS = [
  { id: '1_month', months: 1, price: 50000 },
  { id: '3_months', months: 3, price: 129000 },
  { id: '6_months', months: 6, price: 229000 },
  { id: '12_months', months: 12, price: 399000 },
] as const;

const PLAN_LABELS: Record<string, string> = {
  '1_month': '1 oy',
  '3_months': '3 oy',
  '6_months': '6 oy',
  '12_months': '12 oy',
};

const PLAN_LABELS_RU: Record<string, string> = {
  '1_month': '1 месяц',
  '3_months': '3 месяца',
  '6_months': '6 месяцев',
  '12_months': '12 месяцев',
};

const CARD_NUMBER = '9860 1234 5678 9012';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type PlanId = typeof PLANS[number]['id'];

interface PaymentStatus {
  id: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function PaymentPage() {
  const [language] = useLanguage();
  const { user, getAccessToken } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPayment, setExistingPayment] = useState<PaymentStatus | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; ends_at: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRu = language === 'ru';

  useEffect(() => {
    async function checkStatus() {
      try {
        const token = await getAccessToken();
        if (!token) { setStatusLoading(false); return; }
        const [paymentRes, subRes] = await Promise.all([
          fetch('/api/payment/status', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/subscription', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (paymentRes.ok) {
          const data = await paymentRes.json();
          if (data.payment) setExistingPayment(data.payment);
        }
        if (subRes.ok) {
          const data = await subRes.json();
          if (data.subscription) setSubscription(data.subscription);
        }
      } catch { /* ignore */ }
      setStatusLoading(false);
    }
    checkStatus();
  }, [getAccessToken]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError(isRu ? 'Выберите изображение' : 'Rasm tanlang');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(isRu ? 'Файл слишком большой (макс. 5 МБ)' : 'Fayl juda katta (maks. 5 MB)');
      return;
    }
    setError(null);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, [isRu]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(CARD_NUMBER.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPlan || !file) return;

    setUploading(true);
    setError(null);

    try {
      const plan = PLANS.find((p) => p.id === selectedPlan)!;
      const token = await getAccessToken();
      if (!token) {
        setError(isRu ? 'Войдите в аккаунт' : 'Hisobga kiring');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('plan', selectedPlan);
      formData.append('amount', String(plan.price));
      formData.append('screenshot', file);

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || (isRu ? 'Произошла ошибка' : 'Xatolik yuz berdi'));
        setUploading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError(isRu ? 'Произошла ошибка' : 'Xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  }, [selectedPlan, file, isRu, getAccessToken]);

  const perMonth = (price: number, months: number) => {
    return formatPrice(Math.round(price / months));
  };

  const monthLabel = (months: number) => {
    if (isRu) {
      if (months === 1) return 'месяц';
      if (months >= 2 && months <= 4) return 'месяца';
      return 'месяцев';
    }
    return 'oy';
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  if (statusLoading) {
    return (
      <main className="payment">
        <header className="payment__header">
          <Link href="/chinese" className="payment__logo">
            <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
          </Link>
        </header>
      </main>
    );
  }

  // Show active subscription
  if (subscription) {
    const subEnd = new Date(subscription.ends_at);
    const subDaysLeft = Math.ceil((subEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const subPlanLabel = isRu
      ? PLAN_LABELS_RU[subscription.plan] || subscription.plan
      : PLAN_LABELS[subscription.plan] || subscription.plan;

    if (subDaysLeft > 0) {
      return (
        <main className="payment">
          <header className="payment__header">
            <Link href="/chinese" className="payment__logo">
              <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
            </Link>
          </header>
          <div className="payment__status">
            <div className="payment__status-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <h2 className="payment__success-title">
              {isRu ? 'Подписка активна' : 'Obuna faol'}
            </h2>
            <p className="payment__success-text">
              {isRu
                ? `${subPlanLabel} — осталось ${subDaysLeft} дн.`
                : `${subPlanLabel} — ${subDaysLeft} kun qoldi`}
            </p>
            <Link href="/chinese" className="payment__back-btn">
              {isRu ? '← На главную' : '← Bosh sahifa'}
            </Link>
          </div>
        </main>
      );
    }
  }

  // Show existing payment status (pending or rejected)
  if (existingPayment && !success) {
    const isPending = existingPayment.status === 'pending';
    const isRejected = existingPayment.status === 'rejected';
    const planLabel = isRu
      ? PLAN_LABELS_RU[existingPayment.plan] || existingPayment.plan
      : PLAN_LABELS[existingPayment.plan] || existingPayment.plan;

    if (isPending) {
      return (
        <main className="payment">
          <header className="payment__header">
            <Link href="/chinese" className="payment__logo">
              <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
            </Link>
          </header>
          <div className="payment__status">
            <div className="payment__status-icon payment__status-icon--pending">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="payment__success-title">
              {isRu ? 'Заявка на рассмотрении' : 'Ariza ko\'rib chiqilmoqda'}
            </h2>
            <p className="payment__success-text">
              {isRu
                ? `Ваш платёж за ${planLabel} (${formatPrice(existingPayment.amount)} сум) проверяется. Мы скоро активируем ваш аккаунт.`
                : `${planLabel} uchun to'lovingiz (${formatPrice(existingPayment.amount)} so'm) tekshirilmoqda. Hisobingiz tez orada faollashtiriladi.`}
            </p>
            <Link href="/chinese" className="payment__back-btn">
              {isRu ? '← На главную' : '← Bosh sahifa'}
            </Link>
          </div>
        </main>
      );
    }

    if (isRejected) {
      return (
        <main className="payment">
          <header className="payment__header">
            <Link href="/chinese" className="payment__logo">
              <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
            </Link>
          </header>
          <div className="payment__status">
            <div className="payment__status-icon payment__status-icon--rejected">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h2 className="payment__success-title">
              {isRu ? 'Платёж отклонён' : 'To\'lov rad etildi'}
            </h2>
            <p className="payment__success-text">
              {isRu
                ? `Ваш платёж за ${planLabel} (${formatPrice(existingPayment.amount)} сум) не был подтверждён. Пожалуйста, отправьте корректный чек.`
                : `${planLabel} uchun to'lovingiz (${formatPrice(existingPayment.amount)} so'm) tasdiqlanmadi. Iltimos, to'g'ri chekni yuboring.`}
            </p>
            <button
              className="payment__back-btn"
              onClick={() => setExistingPayment(null)}
              type="button"
            >
              {isRu ? 'Отправить заново' : 'Qayta yuborish'}
            </button>
          </div>
        </main>
      );
    }
  }

  if (success) {
    return (
      <main className="payment">
        <header className="payment__header">
          <Link href="/chinese" className="payment__logo">
            <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
          </Link>
        </header>
        <div className="payment__success">
          <div className="payment__success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <h2 className="payment__success-title">
            {isRu ? 'Чек отправлен!' : 'Chek yuborildi!'}
          </h2>
          <p className="payment__success-text">
            {isRu
              ? 'Ваш аккаунт будет активирован в ближайшее время.'
              : 'Hisobingiz tez orada faollashtiriladi.'}
          </p>
          <Link href="/chinese" className="payment__back-btn">
            {isRu ? '← На главную' : '← Bosh sahifa'}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="payment">
      <header className="payment__header">
        <Link href="/chinese" className="payment__logo">
          <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
        </Link>
      </header>

      <h1 className="payment__title">
        {isRu ? 'Выберите план' : 'Rejani tanlang'}
      </h1>

      {/* Plan cards */}
      <div className="payment__plans">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            className={`payment__plan${selectedPlan === plan.id ? ' payment__plan--selected' : ''}`}
            onClick={() => setSelectedPlan(plan.id)}
            type="button"
          >
            <span className="payment__plan-months">
              {plan.months} {monthLabel(plan.months)}
            </span>
            <span className="payment__plan-price">
              {formatPrice(plan.price)} {isRu ? 'сум' : "so'm"}
            </span>
            {plan.months > 1 && (
              <span className="payment__plan-per-month">
                {perMonth(plan.price, plan.months)} / {isRu ? 'мес' : "oy"}
              </span>
            )}
            {plan.months >= 3 && (
              <span className="payment__plan-badge">
                {plan.months === 12 ? '-33%' : plan.months === 6 ? '-24%' : '-14%'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Card number */}
      <div className="payment__section">
        <h2 className="payment__section-title">
          {isRu ? 'Переведите на карту' : 'Kartaga o\'tkazing'}
        </h2>
        <div className="payment__card-info">
          <span className="payment__card-number">{CARD_NUMBER}</span>
          <button
            className="payment__copy-btn"
            onClick={handleCopy}
            type="button"
          >
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
        {selectedPlan && (
          <p className="payment__card-amount">
            {isRu ? 'Сумма' : 'Summa'}:{' '}
            <strong>
              {formatPrice(PLANS.find((p) => p.id === selectedPlan)!.price)} {isRu ? 'сум' : "so'm"}
            </strong>
          </p>
        )}
      </div>

      {/* Screenshot upload */}
      <div className="payment__section">
        <h2 className="payment__section-title">
          {isRu ? 'Загрузите скриншот оплаты' : "To'lov skrinshotini yuklang"}
        </h2>
        <div
          className={`payment__upload${preview ? ' payment__upload--has-file' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <img src={preview} alt="Screenshot" className="payment__preview" />
          ) : (
            <div className="payment__upload-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{isRu ? 'Нажмите или перетащите файл' : 'Bosing yoki faylni tashlang'}</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="payment__file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />
        </div>
        {preview && (
          <button
            className="payment__remove-file"
            onClick={() => { setFile(null); setPreview(null); }}
            type="button"
          >
            {isRu ? 'Удалить' : "O'chirish"}
          </button>
        )}
      </div>

      {error && (
        <p className="payment__error">{error}</p>
      )}

      <button
        className="payment__submit"
        onClick={handleSubmit}
        disabled={!selectedPlan || !file || uploading}
        type="button"
      >
        {uploading ? (
          <span className="payment__spinner" />
        ) : (
          isRu ? 'Отправить' : 'Yuborish'
        )}
      </button>
    </main>
  );
}
