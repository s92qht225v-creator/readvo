import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadKaraokeSong } from '@/services/karaoke';
import { KaraokePlayer } from '@/components/KaraokePlayer';

interface PageParams {
  params: Promise<{
    locale: string;
    songId: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, songId } = await params;
  const song = await loadKaraokeSong(songId);

  return {
    title: song
      ? `${song.title} — Xitoy tili karaoke`
      : 'Xitoy tili karaoke — KTV',
    description: song
      ? `${song.title} (${song.pinyin}) — xitoy tili karaoke (KTV). Pinyin va tarjima bilan xitoycha qo'shiq kuylang. | Караоке на китайском: ${song.titleTranslation_ru}. Пойте с пиньинь и переводом.`
      : 'Xitoy tili karaoke (KTV) — pinyin bilan kuylang. | Караоке на китайском языке с пиньинь.',
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

  return <KaraokePlayer song={song} bookPath="/chinese/hsk1" />;
}
