'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { trackAll } from '@/utils/analytics';

const PLANS = [
  { id: '1_month', months: 1, price: 50000 },
  { id: '3_months', months: 3, price: 129000 },
  { id: '6_months', months: 6, price: 229000 },
  { id: '12_months', months: 12, price: 399000 },
] as const;

const PLAN_LABELS: Record<string, string> = {
  '1_month': '1 oy', '3_months': '3 oy', '6_months': '6 oy', '12_months': '12 oy',
};
const PLAN_LABELS_RU: Record<string, string> = {
  '1_month': '1 месяц', '3_months': '3 месяца', '6_months': '6 месяцев', '12_months': '12 месяцев',
};
const PLAN_LABELS_EN: Record<string, string> = {
  '1_month': '1 month', '3_months': '3 months', '6_months': '6 months', '12_months': '12 months',
};

// Manual payment fallback
const CARD_NUMBER = '9860 1766 1049 2223';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type PlanId = typeof PLANS[number]['id'];

type Step = 'plan' | 'card' | 'otp' | 'success';

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

  // Shared state
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [existingPayment, setExistingPayment] = useState<PaymentStatus | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; ends_at: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Atmos card payment state
  const [step, setStep] = useState<Step>('plan');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [otp, setOtp] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedPlan, setCompletedPlan] = useState<string | null>(null);
  const [completedEndsAt, setCompletedEndsAt] = useState<string | null>(null);

  // Manual payment fallback state
  const [manualMode, setManualMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OTP resend timer
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRu = language === 'ru';
  const isEn = language === 'en';
  const t = (uz: string, ru: string, en: string) => isEn ? en : isRu ? ru : uz;

  const planLabel = (planId: string) =>
    isEn ? PLAN_LABELS_EN[planId] || planId
      : isRu ? PLAN_LABELS_RU[planId] || planId
        : PLAN_LABELS[planId] || planId;

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const perMonth = (price: number, months: number) =>
    formatPrice(Math.round(price / months));

  const monthLabel = (months: number) => {
    if (isRu) return months === 1 ? 'месяц' : months >= 2 && months <= 4 ? 'месяца' : 'месяцев';
    if (isEn) return months === 1 ? 'month' : 'months';
    return 'oy';
  };

  // Start resend timer
  const startResendTimer = useCallback(() => {
    setResendTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Check existing payment/subscription status
  useEffect(() => {
    async function checkStatus() {
      try {
        const token = await getAccessToken();
        if (!token) { setStatusLoading(false); return; }
        const [paymentRes, subRes] = await Promise.all([
          fetch('/api/payment/status', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/subscription', { headers: { Authorization: `Bearer ${token}` } }),
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

  // ─── Card number formatting ───
  const handleCardInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setExpiry(digits);
    }
  };

  // ─── Atmos: Create transaction + pre-apply ───
  const handlePayWithCard = useCallback(async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) { setError(t('Hisobga kiring', 'Войдите в аккаунт', 'Please log in')); setLoading(false); return; }

      const cleanCard = cardNumber.replace(/\s/g, '');
      const res = await fetch('/api/payment/atmos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', plan: selectedPlan, cardNumber: cleanCard, expiry }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
        setLoading(false);
        return;
      }

      setTransactionId(data.transaction_id);
      setStep('otp');
      startResendTimer();

      trackAll('InitiateCheckout', 'payment_card_submit', 'begin_checkout', {
        content_name: selectedPlan,
        value: PLANS.find((p) => p.id === selectedPlan)!.price,
        currency: 'UZS',
      });
    } catch {
      setError(t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, cardNumber, expiry, getAccessToken, t, startResendTimer]);

  // ─── Atmos: Confirm with OTP ───
  const handleConfirmOtp = useCallback(async () => {
    if (!transactionId || !otp) return;
    setLoading(true);
    setError(null);

    try {
      const token = await getAccessToken();
      if (!token) { setError(t('Hisobga kiring', 'Войдите в аккаунт', 'Please log in')); setLoading(false); return; }

      const res = await fetch('/api/payment/atmos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', transaction_id: transactionId, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
        setLoading(false);
        return;
      }

      setCompletedPlan(data.plan);
      setCompletedEndsAt(data.ends_at);
      setStep('success');

      trackAll('Purchase', 'payment_atmos_confirm', 'purchase', {
        content_name: selectedPlan || '',
        value: PLANS.find((p) => p.id === selectedPlan)?.price || 0,
        currency: 'UZS',
      });
    } catch {
      setError(t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [transactionId, otp, getAccessToken, selectedPlan, t]);

  // ─── Resend OTP ───
  const handleResendOtp = useCallback(async () => {
    if (!selectedPlan || resendTimer > 0) return;
    // Re-create transaction with same card details
    setOtp('');
    setError(null);
    setLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }

      const cleanCard = cardNumber.replace(/\s/g, '');
      const res = await fetch('/api/payment/atmos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', plan: selectedPlan, cardNumber: cleanCard, expiry }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
      } else {
        setTransactionId(data.transaction_id);
        startResendTimer();
      }
    } catch {
      setError(t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, cardNumber, expiry, resendTimer, getAccessToken, t, startResendTimer]);

  // ─── Manual payment handlers ───
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError(t('Rasm tanlang', 'Выберите изображение', 'Select an image'));
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(t('Fayl juda katta (maks. 10 MB)', 'Файл слишком большой (макс. 10 МБ)', 'File too large (max 10 MB)'));
      return;
    }
    setError(null);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, [t]);

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

  const handleManualSubmit = useCallback(async () => {
    if (!selectedPlan || !file) return;
    setUploading(true);
    setError(null);
    try {
      const plan = PLANS.find((p) => p.id === selectedPlan)!;
      const token = await getAccessToken();
      if (!token) { setError(t('Hisobga kiring', 'Войдите в аккаунт', 'Please log in')); setUploading(false); return; }

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
        setError(data.error || t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
        setUploading(false);
        return;
      }

      setManualSuccess(true);
      trackAll('Purchase', 'payment_submit', 'purchase', {
        content_name: selectedPlan,
        value: plan.price,
        currency: 'UZS',
      });
    } catch {
      setError(t('Xatolik yuz berdi', 'Произошла ошибка', 'An error occurred'));
    } finally {
      setUploading(false);
    }
  }, [selectedPlan, file, t, getAccessToken]);

  // ─── Render helpers ───
  const renderHeader = () => (
    <header className="payment__header">
      <Link href="/chinese" className="payment__logo">
        <Image src="/logo-red.svg" alt="Blim" width={64} height={22} className="reader__home-logo" priority />
      </Link>
    </header>
  );

  // ─── Loading ───
  if (statusLoading) {
    return <main className="payment">{renderHeader()}</main>;
  }

  // ─── Active subscription ───
  if (subscription) {
    const subEnd = new Date(subscription.ends_at);
    const subDaysLeft = Math.ceil((subEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (subDaysLeft > 0) {
      return (
        <main className="payment">
          {renderHeader()}
          <div className="payment__status">
            <div className="payment__status-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <h2 className="payment__success-title">{t('Obuna faol', 'Подписка активна', 'Subscription active')}</h2>
            <p className="payment__success-text">{t(`${subDaysLeft} kun qoldi`, `Осталось ${subDaysLeft} дн.`, `${subDaysLeft} days left`)}</p>
            <Link href="/chinese" className="payment__back-btn">{t('← Bosh sahifa', '← На главную', '← Home')}</Link>
          </div>
        </main>
      );
    }
  }

  // ─── Existing pending/rejected payment (manual) ───
  if (existingPayment && !manualSuccess && step === 'plan') {
    const isPending = existingPayment.status === 'pending';
    const isRejected = existingPayment.status === 'rejected';
    const label = planLabel(existingPayment.plan);

    if (isPending) {
      return (
        <main className="payment">
          {renderHeader()}
          <div className="payment__status">
            <div className="payment__status-icon payment__status-icon--pending">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="payment__success-title">{t("Ariza ko'rib chiqilmoqda", 'Заявка на рассмотрении', 'Payment under review')}</h2>
            <p className="payment__success-text">
              {t(
                `${label} uchun to'lovingiz (${formatPrice(existingPayment.amount)} so'm) tekshirilmoqda. Hisobingiz tez orada faollashtiriladi.`,
                `Ваш платёж за ${label} (${formatPrice(existingPayment.amount)} сум) проверяется. Мы скоро активируем ваш аккаунт.`,
                `Your payment for ${label} (${formatPrice(existingPayment.amount)} UZS) is being reviewed. Your account will be activated soon.`
              )}
            </p>
            <Link href="/chinese" className="payment__back-btn">{t('← Bosh sahifa', '← На главную', '← Home')}</Link>
          </div>
        </main>
      );
    }

    if (isRejected) {
      return (
        <main className="payment">
          {renderHeader()}
          <div className="payment__status">
            <div className="payment__status-icon payment__status-icon--rejected">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h2 className="payment__success-title">{t("To'lov rad etildi", 'Платёж отклонён', 'Payment rejected')}</h2>
            <p className="payment__success-text">
              {t(
                `${label} uchun to'lovingiz (${formatPrice(existingPayment.amount)} so'm) tasdiqlanmadi. Iltimos, to'g'ri chekni yuboring.`,
                `Ваш платёж за ${label} (${formatPrice(existingPayment.amount)} сум) не был подтверждён. Пожалуйста, отправьте корректный чек.`,
                `Your payment for ${label} (${formatPrice(existingPayment.amount)} UZS) was not confirmed. Please submit a valid receipt.`
              )}
            </p>
            <button className="payment__back-btn" onClick={() => setExistingPayment(null)} type="button">
              {t('Qayta yuborish', 'Отправить заново', 'Resubmit')}
            </button>
          </div>
        </main>
      );
    }
  }

  // ─── Manual payment success ───
  if (manualSuccess) {
    return (
      <main className="payment">
        {renderHeader()}
        <div className="payment__success">
          <div className="payment__success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <h2 className="payment__success-title">{t('Chek yuborildi!', 'Чек отправлен!', 'Receipt sent!')}</h2>
          <p className="payment__success-text">{t('Hisobingiz tez orada faollashtiriladi.', 'Ваш аккаунт будет активирован в ближайшее время.', 'Your account will be activated shortly.')}</p>
          <Link href="/chinese" className="payment__back-btn">{t('← Bosh sahifa', '← На главную', '← Home')}</Link>
        </div>
      </main>
    );
  }

  // ─── Atmos success ───
  if (step === 'success') {
    const daysLeft = completedEndsAt ? Math.ceil((new Date(completedEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;
    return (
      <main className="payment">
        {renderHeader()}
        <div className="payment__success">
          <div className="payment__success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <h2 className="payment__success-title">
            {t("To'lov qabul qilindi!", 'Оплата прошла!', 'Payment successful!')}
          </h2>
          <p className="payment__success-text">
            {t(
              `${planLabel(completedPlan || '')} obuna faollashtirildi. ${daysLeft} kun qoldi.`,
              `Подписка ${planLabel(completedPlan || '')} активирована. Осталось ${daysLeft} дн.`,
              `${planLabel(completedPlan || '')} subscription activated. ${daysLeft} days remaining.`
            )}
          </p>
          <Link href="/chinese" className="payment__back-btn" style={{ background: '#16a34a', color: '#fff', border: 'none' }}>
            {t("O'rganishni boshlash", 'Начать обучение', 'Start learning')}
          </Link>
        </div>
      </main>
    );
  }

  // ─── OTP step ───
  if (step === 'otp') {
    return (
      <main className="payment">
        {renderHeader()}
        <div className="payment__section" style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="3" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <h2 className="payment__section-title" style={{ marginBottom: 8 }}>
            {t('SMS kodni kiriting', 'Введите SMS код', 'Enter SMS code')}
          </h2>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            {t(
              "Kartangizga bog'langan raqamga 6 xonali kod yuborildi",
              'На номер привязанный к карте отправлен 6-значный код',
              'A 6-digit code was sent to the phone linked to your card'
            )}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoFocus
              style={{
                width: 180, textAlign: 'center', fontSize: 24, letterSpacing: 8,
                padding: '12px 16px', border: '2px solid #e5e5e5', borderRadius: 8,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {error && <p className="payment__error">{error}</p>}

          <button
            className="payment__submit"
            onClick={handleConfirmOtp}
            disabled={otp.length !== 6 || loading}
            type="button"
            style={{ maxWidth: 300, margin: '0 auto 12px' }}
          >
            {loading ? <span className="payment__spinner" /> : t('Tasdiqlash', 'Подтвердить', 'Confirm')}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendTimer > 0 || loading}
            style={{
              background: 'none', border: 'none', color: resendTimer > 0 ? '#999' : '#dc2626',
              cursor: resendTimer > 0 ? 'default' : 'pointer', fontSize: 14, fontFamily: 'inherit',
              padding: '8px 16px',
            }}
          >
            {resendTimer > 0
              ? t(`Qayta yuborish (${resendTimer}s)`, `Отправить снова (${resendTimer}s)`, `Resend (${resendTimer}s)`)
              : t('Kodni qayta yuborish', 'Отправить код снова', 'Resend code')
            }
          </button>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => { setStep('card'); setOtp(''); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('← Orqaga', '← Назад', '← Back')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Card input step ───
  if (step === 'card' && !manualMode) {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    const cleanCard = cardNumber.replace(/\s/g, '');
    const validCard = /^\d{16}$/.test(cleanCard);
    const validExpiry = /^\d{2}\/\d{2}$/.test(expiry);

    return (
      <main className="payment">
        {renderHeader()}

        <div className="payment__section" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setStep('plan'); setError(null); }}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
            >
              {t('← Orqaga', '← Назад', '← Back')}
            </button>
          </div>

          <h2 className="payment__section-title" style={{ marginBottom: 4 }}>
            {t("Karta ma'lumotlari", 'Данные карты', 'Card details')}
          </h2>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
            Uzcard / Humo
          </p>

          {/* Card number */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              {t('Karta raqami', 'Номер карты', 'Card number')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => handleCardInput(e.target.value)}
              placeholder="0000 0000 0000 0000"
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', fontSize: 16, border: '2px solid #e5e5e5',
                borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Expiry */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>
              {t("Amal qilish muddati", 'Срок действия', 'Expiry date')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => handleExpiryInput(e.target.value)}
              placeholder="MM/YY"
              style={{
                width: 120, padding: '12px 14px', fontSize: 16, border: '2px solid #e5e5e5',
                borderRadius: 8, outline: 'none', fontFamily: 'inherit', textAlign: 'center',
              }}
            />
          </div>

          {error && <p className="payment__error">{error}</p>}

          {/* Pay button */}
          <button
            className="payment__submit"
            onClick={handlePayWithCard}
            disabled={!validCard || !validExpiry || loading}
            type="button"
          >
            {loading ? (
              <span className="payment__spinner" />
            ) : (
              <>
                {t("To'lash", 'Оплатить', 'Pay')}{' '}
                {plan ? `${formatPrice(plan.price)} ${t("so'm", 'сум', 'UZS')}` : ''}
              </>
            )}
          </button>

          {/* Manual payment link */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              style={{
                background: 'none', border: 'none', color: '#999', fontSize: 13,
                cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit',
              }}
            >
              {t("Karta orqali o'tkazma", 'Оплата переводом', 'Pay via bank transfer')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Manual payment mode ───
  if (manualMode) {
    return (
      <main className="payment">
        {renderHeader()}

        <div style={{ padding: '16px 0 0' }}>
          <button
            type="button"
            onClick={() => { setManualMode(false); setError(null); }}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: '0 24px' }}
          >
            {t('← Orqaga', '← Назад', '← Back')}
          </button>
        </div>

        {/* Card number to transfer to */}
        <div className="payment__section">
          <h2 className="payment__section-title">
            {t("Kartaga o'tkazing", 'Переведите на карту', 'Transfer to card')}
          </h2>
          <div className="payment__card-info">
            <span className="payment__card-number">{CARD_NUMBER}</span>
            <button className="payment__copy-btn" onClick={handleCopy} type="button">
              {copied ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
          {selectedPlan && (
            <p className="payment__card-amount">
              {t('Summa', 'Сумма', 'Amount')}:{' '}
              <strong>{formatPrice(PLANS.find((p) => p.id === selectedPlan)!.price)} {t("so'm", 'сум', 'UZS')}</strong>
            </p>
          )}
        </div>

        {/* Screenshot upload */}
        <div className="payment__section">
          <h2 className="payment__section-title">
            {t("To'lov skrinshotini yuklang", 'Загрузите скриншот оплаты', 'Upload payment screenshot')}
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
                  <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>{t('Bosing yoki faylni tashlang', 'Нажмите или перетащите файл', 'Click or drop file here')}</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="payment__file-input"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>
          {preview && (
            <button className="payment__remove-file" onClick={() => { setFile(null); setPreview(null); }} type="button">
              {t("O'chirish", 'Удалить', 'Remove')}
            </button>
          )}
        </div>

        {error && <p className="payment__error">{error}</p>}

        <button
          className="payment__submit"
          onClick={handleManualSubmit}
          disabled={!selectedPlan || !file || uploading}
          type="button"
        >
          {uploading ? <span className="payment__spinner" /> : t('Yuborish', 'Отправить', 'Submit')}
        </button>
      </main>
    );
  }

  // ─── Plan selection (default) ───
  return (
    <main className="payment">
      {renderHeader()}

      <h1 className="payment__title">
        {t('Rejani tanlang', 'Выберите план', 'Choose a plan')}
      </h1>

      <div className="payment__plans">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            className={`payment__plan${selectedPlan === plan.id ? ' payment__plan--selected' : ''}`}
            onClick={() => {
              setSelectedPlan(plan.id);
              trackAll('InitiateCheckout', 'payment_start', 'begin_checkout', {
                content_name: plan.id, value: plan.price, currency: 'UZS',
              });
            }}
            type="button"
          >
            <span className="payment__plan-months">
              {plan.months} {monthLabel(plan.months)}
            </span>
            <span className="payment__plan-price">
              {formatPrice(plan.price)} {t("so'm", 'сум', 'UZS')}
            </span>
            {plan.months > 1 && (
              <span className="payment__plan-per-month">
                {perMonth(plan.price, plan.months)} / {t('oy', 'мес', 'mo')}
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

      {/* Proceed to card input */}
      <button
        className="payment__submit"
        onClick={() => { setStep('card'); setError(null); }}
        disabled={!selectedPlan}
        type="button"
      >
        {t('Davom etish', 'Продолжить', 'Continue')}
      </button>

      {/* Manual payment fallback */}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          type="button"
          onClick={() => { if (selectedPlan) { setManualMode(true); setStep('card'); } }}
          disabled={!selectedPlan}
          style={{
            background: 'none', border: 'none',
            color: selectedPlan ? '#999' : '#ccc',
            fontSize: 13, cursor: selectedPlan ? 'pointer' : 'default',
            textDecoration: 'underline', fontFamily: 'inherit',
          }}
        >
          {t("Karta orqali o'tkazma", 'Оплата переводом', 'Pay via bank transfer')}
        </button>
      </div>
    </main>
  );
}
