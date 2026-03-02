import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Blim — Interaktiv til o\'rganish';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          Interaktiv til o&apos;rganish
        </div>
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 16,
          }}
        >
          Xitoy tili &bull; Ingliz tili &bull; Darsliklar &bull; Fleshkartalar &bull; Karaoke
        </div>
      </div>
    ),
    { ...size }
  );
}
