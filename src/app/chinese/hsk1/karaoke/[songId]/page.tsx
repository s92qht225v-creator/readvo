import { notFound } from 'next/navigation';
import { loadKaraokeSong } from '@/services/karaoke';
import { KaraokePlayer } from '@/components/KaraokePlayer';

interface PageParams {
  params: Promise<{
    songId: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { songId } = await params;
  const song = await loadKaraokeSong(songId);

  return {
    title: song
      ? `${song.title} - Karaoke - Blim`
      : 'Karaoke - Blim',
  };
}

export default async function KaraokePage({ params }: PageParams) {
  const { songId } = await params;
  const song = await loadKaraokeSong(songId);

  if (!song) {
    notFound();
  }

  return <KaraokePlayer song={song} bookPath="/chinese/hsk1" />;
}
