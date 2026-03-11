'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';

export function Paywall() {
  const [language] = useLanguage();

  return (
    <div className="paywall">
      <div className="paywall__card">
        <h2 className="paywall__title">
          {({ uz: 'Sinov muddati tugadi', ru: 'Пробный период закончился', en: 'Trial period expired' } as Record<string, string>)[language]}
        </h2>
        <p className="paywall__text">
          {({ uz: "Obunani rasmiylashtiring va o'qishni davom ettiring.", ru: 'Оформите подписку, чтобы продолжить обучение.', en: 'Subscribe to continue learning.' } as Record<string, string>)[language]}
        </p>
        <Link href="/payment" className="paywall__btn">
          {({ uz: "To'lov", ru: 'Оплата', en: 'Payment' } as Record<string, string>)[language]}
        </Link>
        <Link href="/chinese" className="paywall__back">
          {({ uz: '← Bosh sahifa', ru: '← На главную', en: '← Home' } as Record<string, string>)[language]}
        </Link>
      </div>
    </div>
  );
}
