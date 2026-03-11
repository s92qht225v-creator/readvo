import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

const VALID_LOCALES = ['uz', 'ru', 'en'] as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get('blim-language')?.value;

  if (!locale || !VALID_LOCALES.includes(locale as typeof VALID_LOCALES[number])) {
    const accept = (await headers()).get('accept-language') || '';
    if (accept.startsWith('ru')) {
      locale = 'ru';
    } else if (accept.startsWith('uz')) {
      locale = 'uz';
    } else {
      locale = 'en';
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
