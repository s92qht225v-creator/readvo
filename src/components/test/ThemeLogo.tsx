import type React from 'react';
import type { TestThemeConfig } from '@/lib/test/theme';
import { normalizeTestTheme } from '@/lib/test/theme';

const LOGO_SIZE = {
  small: 54,
  medium: 72,
  large: 96,
} as const;

export function ThemeLogo({ theme }: { theme?: TestThemeConfig | null }) {
  const normalized = normalizeTestTheme(theme);
  if (!normalized.logoUrl) return null;

  const size = LOGO_SIZE[normalized.logoSize];
  const justifyContent = normalized.logoAlign === 'center'
    ? 'center'
    : normalized.logoAlign === 'right'
      ? 'flex-end'
      : 'flex-start';

  return (
    <div className="test-theme-logo" style={{ ...logoWrap, justifyContent }}>
      <img
        src={normalized.logoUrl}
        alt={normalized.logoAlt}
        style={{ ...logoImage, width: size, height: size }}
      />
    </div>
  );
}

const logoWrap: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  marginBottom: 22,
  flexShrink: 0,
};

const logoImage: React.CSSProperties = {
  display: 'block',
  objectFit: 'contain',
};
