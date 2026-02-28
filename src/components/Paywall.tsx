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
          {language === 'ru'
            ? 'Пробный период закончился'
            : 'Sinov muddati tugadi'}
        </h2>
        <p className="paywall__text">
          {language === 'ru'
            ? 'Оформите подписку, чтобы продолжить обучение.'
            : "Obunani rasmiylashtiring va o'qishni davom ettiring."}
        </p>
        <Link href="/payment" className="paywall__btn">
          {language === 'ru' ? 'Оплата' : "To'lov"}
        </Link>
        <Link href="/chinese" className="paywall__back">
          {language === 'ru' ? '← На главную' : '← Bosh sahifa'}
        </Link>
      </div>
    </div>
  );
}
