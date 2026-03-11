import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const meta: Record<string, { alt: string; tagline: string; subjects: string }> = {
  uz: {
    alt: "Blim — Interaktiv til o'rganish",
    tagline: "Interaktiv til o\u2019rganish",
    subjects: 'Xitoy tili \u2022 Ingliz tili \u2022 Darsliklar \u2022 Fleshkartalar \u2022 Karaoke',
  },
  ru: {
    alt: 'Blim — Интерактивное изучение языков',
    tagline: 'Интерактивное изучение языков',
    subjects: 'Китайский \u2022 Английский \u2022 Учебники \u2022 Флешкарты \u2022 Караоке',
  },
  en: {
    alt: 'Blim — Interactive language learning',
    tagline: 'Interactive language learning',
    subjects: 'Chinese \u2022 English \u2022 Textbooks \u2022 Flashcards \u2022 Karaoke',
  },
};

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  const m = meta[params.locale] || meta.uz;
  return [{ id: 'og', alt: m.alt, size, contentType }];
}

export default function Image({ params }: { params: { locale: string } }) {
  const m = meta[params.locale] || meta.uz;
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          Blim
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          {m.tagline}
        </div>
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 16,
          }}
        >
          {m.subjects}
        </div>
      </div>
    ),
    { ...size }
  );
}
