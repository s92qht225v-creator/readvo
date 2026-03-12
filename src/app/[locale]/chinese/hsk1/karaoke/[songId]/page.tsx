import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadKaraokeSong } from '@/services/karaoke';
import { KaraokePlayer } from '@/components/KaraokePlayer';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface PageParams {
  params: Promise<{
    locale: string;
    songId: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, songId } = await params;
  const song = await loadKaraokeSong(songId);

  const titleLabel: Record<string, string> = {
    uz: 'Xitoy tili karaoke',
    ru: 'Караоке на китайском',
    en: 'Chinese Karaoke',
  };
  const fallbackTitle: Record<string, string> = {
    uz: 'Xitoy tili karaoke — KTV',
    ru: 'Караоке на китайском — KTV',
    en: 'Chinese Karaoke — KTV',
  };
  const translation = song
    ? locale === 'ru' ? song.titleTranslation_ru
    : locale === 'en' ? (song.titleTranslation_en || song.titleTranslation)
    : song.titleTranslation
    : '';
  const descMeta: Record<string, string> = {
    uz: song ? `${song.title} (${song.pinyin}) — xitoy tili karaoke (KTV). Pinyin va tarjima bilan xitoycha qo'shiq kuylang.` : 'Xitoy tili karaoke (KTV) — pinyin bilan kuylang.',
    ru: song ? `${song.title} (${song.pinyin}) — караоке на китайском (KTV). Пойте с пиньинь и переводом.` : 'Караоке на китайском языке с пиньинь.',
    en: song ? `${song.title} (${song.pinyin}) — Chinese karaoke (KTV). Sing along with pinyin and translation.` : 'Chinese karaoke (KTV) — sing along with pinyin.',
  };

  return {
    title: song
      ? `${song.title} — ${titleLabel[locale] || titleLabel.uz}`
      : fallbackTitle[locale] || fallbackTitle.uz,
    description: descMeta[locale] || descMeta.uz,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/karaoke/${songId}`,
      languages: {
        uz: `/uz/chinese/hsk1/karaoke/${songId}`,
        ru: `/ru/chinese/hsk1/karaoke/${songId}`,
        en: `/en/chinese/hsk1/karaoke/${songId}`,
        'x-default': `/uz/chinese/hsk1/karaoke/${songId}`,
      },
    },
  };
}

export default async function KaraokePage({ params }: PageParams) {
  const { locale, songId } = await params;
  setRequestLocale(locale);

  const song = await loadKaraokeSong(songId);

  if (!song) {
    notFound();
  }

  const karaokeLabel = 'KTV';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: karaokeLabel, path: `/${locale}/chinese?tab=karaoke` },
      { name: song.title, path: `/${locale}/chinese/hsk1/karaoke/${songId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <KaraokePlayer song={song} bookPath="/chinese/hsk1" />
    </>
  );
}
