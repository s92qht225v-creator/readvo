'use client';

import type { CSSProperties, ReactNode } from 'react';

export function DeviceIconFrame({
  device,
  compact = false,
  selected = false,
  children,
}: {
  device: 'mobile' | 'desktop';
  compact?: boolean;
  selected?: boolean;
  children: ReactNode;
}) {
  const frame = device === 'mobile' ? mobileDeviceFrame(compact, selected) : desktopIconFrame(compact, selected);
  return (
    <span style={frame}>
      {children}
    </span>
  );
}

export function LayoutIcon({ value, device }: { value: string; device: 'mobile' | 'desktop' }) {
  if (device === 'desktop') {
    return <DesktopCardLayoutIcon value={value} />;
  }
  switch (value) {
    case 'stack':
      return <MobileStackIcon />;
    case 'float':
      return <MobileFloatIcon />;
    case 'split':
      return <MobileSplitIcon />;
    case 'wallpaper':
      return <MobileWallpaperIcon />;
    default:
      return <MobileStackIcon />;
  }
}

function MobileStackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" viewBox="0 0 50.17 74.59" fill="none" aria-hidden="true">
      <rect x="2.63" y="2.96" width="44.91" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="10.14" y="28.06" width="29.9" height="17.69" rx="2.73" ry="2.73" fill="currentColor" />
      <path fill="currentColor" d="M11.74 23.35h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2h-21c-.88 0-1.6.9-1.6 2s.72 2 1.6 2Z" />
      <path fill="currentColor" d="M11.63 54.46h14.98c.82 0 1.49-.9 1.49-2s-.67-2-1.49-2H11.63c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function MobileFloatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" viewBox="0 0 50.17 74.59" fill="none" aria-hidden="true">
      <rect x="2.63" y="2.96" width="44.91" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="10.14" y="19.35" width="29.9" height="17.69" rx="2.73" ry="2.73" fill="currentColor" />
      <path fill="currentColor" d="M11.74 47.35h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2h-21c-.88 0-1.6.9-1.6 2s.72 2 1.6 2Z" />
      <path fill="currentColor" d="M11.63 54.46h14.98c.82 0 1.49-.9 1.49-2s-.67-2-1.49-2H11.63c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function MobileSplitIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" viewBox="0 0 50.17 74.59" fill="none" aria-hidden="true">
      <rect x="2.63" y="2.96" width="44.91" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="7.22" y="8.2" width="35.73" height="28.86" rx="4.4" ry="4.4" fill="currentColor" />
      <path fill="currentColor" d="M11.74 48.52h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2h-21c-.88 0-1.6.9-1.6 2s.72 2 1.6 2Z" />
      <path fill="currentColor" d="M11.63 56.1h14.98c.82 0 1.49-.9 1.49-2s-.67-2-1.49-2H11.63c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function MobileWallpaperIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="33" viewBox="0 0 50.17 74.59" fill="none" aria-hidden="true">
      <rect x="2.63" y="2.96" width="44.91" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <path fill="currentColor" d="M43.05 36.92c.57.23.97.78.97 1.43v22.33c0 3.51-2.84 6.35-6.36 6.35H12.52c-3.52 0-6.36-2.84-6.36-6.35V38.35c0-.65.4-1.2.97-1.43-.57-.23-.97-.78-.97-1.43V13.16c0-3.51 2.84-6.35 6.36-6.35h25.14c3.52 0 6.36 2.84 6.36 6.35v22.33c0 .65-.4 1.2-.97 1.43Z" />
      <path fill="#fff" d="M14.74 36.35h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2h-21c-.88 0-1.6.9-1.6 2s.72 2 1.6 2Z" />
      <path fill="#fff" d="M14.63 43.46h14.98c.82 0 1.49-.9 1.49-2s-.67-2-1.49-2H14.63c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function DesktopCardLayoutIcon({ value }: { value: string }) {
  if (value === 'stack') {
    return <DesktopStackIcon />;
  }
  if (value === 'float-right') {
    return <DesktopFloatRightIcon />;
  }
  if (value === 'float-left') {
    return <DesktopFloatLeftIcon />;
  }
  if (value === 'split-right') {
    return <DesktopSplitRightIcon />;
  }
  if (value === 'split-left') {
    return <DesktopSplitLeftIcon />;
  }
  if (value === 'wallpaper') {
    return <DesktopWallpaperIcon />;
  }
  const kind = desktopIconKind(value);
  const filled = kind.startsWith('filled');
  const fill = kind === 'filled-alt' ? '#6b5f7a' : '#4a4458';
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="42" height="29" viewBox="0 0 40 28" fill="none" aria-hidden="true">
      <rect
        x="0"
        y="0"
        width="40"
        height="28"
        rx="4"
        ry="4"
        fill={filled ? fill : 'white'}
        stroke={filled ? 'none' : '#4a4458'}
        strokeWidth={filled ? undefined : 2}
      />
      {kind === 'outline-image' || kind === 'filled-image' ? (
        <>
          <rect x="5" y="6" width="12" height="9" rx="2" ry="2" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
          <rect x="21" y="8" width="12" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
          <rect x="21" y="13" width="8" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
        </>
      ) : null}
      {kind === 'outline-text' || kind === 'filled-text' ? (
        <>
          <rect x="8" y="9" width="12" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
          <rect x="8" y="14" width="20" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
        </>
      ) : null}
      {kind === 'outline-small' || kind === 'filled-alt' ? (
        <>
          <rect x="5" y="9" width="8" height="8" rx="1.5" ry="1.5" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
          <rect x="17" y="10" width="12" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
          <rect x="17" y="15" width="8" height="2" rx="1" fill={filled ? 'white' : '#4a4458'} opacity={filled ? 0.85 : 1} />
        </>
      ) : null}
    </svg>
  );
}

function DesktopStackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" stroke="currentColor" strokeWidth="4" />
      <rect x="25.43" y="25.95" width="47.24" height="22.69" rx="3.88" ry="3.88" fill="currentColor" />
      <path fill="currentColor" d="M53.66 20.04H27.43c-1.1 0-2-.9-2-2s.9-2 2-2h26.23c1.1 0 2 .9 2 2s-.9 2-2 2Z" />
      <path fill="currentColor" d="M47.54 57.42H27.43c-1.1 0-2-.9-2-2s.9-2 2-2h20.11c1.1 0 2 .9 2 2s-.9 2-2 2Z" />
    </svg>
  );
}

function DesktopFloatRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="52.52" y="25.95" width="29.99" height="22.69" rx="3.09" ry="3.09" fill="currentColor" />
      <path fill="currentColor" d="M39.1 36.38h-21c-.88 0-1.6-.9-1.6-2s.72-2 1.6-2h21c.88 0 1.6.9 1.6 2s-.72 2-1.6 2Z" />
      <path fill="currentColor" d="M33.01 45.3H18.03c-.82 0-1.49-.9-1.49-2s.67-2 1.49-2h14.98c.82 0 1.49.9 1.49 2s-.67 2-1.49 2Z" />
    </svg>
  );
}

function DesktopFloatLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="15.59" y="25.95" width="29.99" height="22.69" rx="3.09" ry="3.09" fill="currentColor" />
      <path fill="currentColor" d="M58.99 36.38h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2h-21c-.88 0-1.6.9-1.6 2s.72 2 1.6 2Z" />
      <path fill="currentColor" d="M65.08 45.3h14.98c.82 0 1.49-.9 1.49-2 0-1.1-.67-2-1.49-2H65.08c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function DesktopSplitRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="48.33" y="9.08" width="41.9" height="56.43" rx="5.76" ry="5.76" fill="currentColor" />
      <path fill="currentColor" d="M12.07 35.62h21c.88 0 1.6-.9 1.6-2s-.72-2-1.6-2H12.07c-.88 0-1.6.9-1.6 2 0 1.1.72 2 1.6 2Z" />
      <path fill="currentColor" d="M11.96 44.63h14.98c.82 0 1.49-.9 1.49-2 0-1.1-.67-2-1.49-2H11.96c-.82 0-1.49.9-1.49 2s.67 2 1.49 2Z" />
    </svg>
  );
}

function DesktopSplitLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="7.87" y="9.08" width="41.9" height="56.43" rx="5.76" ry="5.76" fill="currentColor" />
      <path fill="currentColor" d="M86.02 35.62h-21c-.88 0-1.6-.9-1.6-2s.72-2 1.6-2h21c.88 0 1.6.9 1.6 2s-.72 2-1.6 2Z" />
      <path fill="currentColor" d="M86.14 44.63H71.16c-.82 0-1.49-.9-1.49-2 0-1.1.67-2 1.49-2h14.98c.82 0 1.49.9 1.49 2s-.67 2-1.49 2Z" />
    </svg>
  );
}

function DesktopWallpaperIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="43" height="33" viewBox="0 0 98.1 74.59" fill="none" aria-hidden="true">
      <rect x="2.66" y="2.96" width="92.77" height="68.66" rx="9.46" ry="9.46" fill="none" stroke="currentColor" strokeWidth="4" />
      <rect x="8.08" y="9.08" width="81.94" height="56.43" rx="8.06" ry="8.06" fill="currentColor" />
      <path fill="#fff" d="M80.15 33.62c0 1.11-.72 2-1.6 2h-59c-.89 0-1.6-.89-1.6-2s.71-2 1.6-2h59c.88 0 1.6.9 1.6 2Z" />
      <path fill="#fff" d="M61.9 42.63c0 1.11-.67 2-1.49 2H19.43c-.82 0-1.49-.89-1.49-2s.67-2 1.49-2h40.98c.82 0 1.49.9 1.49 2Z" />
    </svg>
  );
}

function desktopIconKind(value: string) {
  if (value === 'stack') return 'outline-image';
  if (value === 'float-right') return 'outline-text';
  if (value === 'float-left') return 'outline-small';
  if (value === 'split-right') return 'filled-image';
  if (value === 'split-left') return 'filled-text';
  return 'filled-alt';
}

const layoutSelectedIcon: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  color: '#4f4655',
};

const mobileDeviceFrame = (compact = false, selected = false): CSSProperties => ({
  ...layoutSelectedIcon,
  width: compact ? 46 : 45,
  height: compact ? 36 : 34,
  border: 'none',
  borderRadius: 0,
  transform: compact ? 'scale(0.9)' : 'scale(0.9)',
  overflow: 'hidden',
  color: selected ? '#141014' : '#8c858e',
});

const desktopIconFrame = (compact = false, selected = false): CSSProperties => ({
  ...layoutSelectedIcon,
  width: compact ? 46 : 45,
  height: compact ? 36 : 34,
  border: 'none',
  borderRadius: 0,
  transform: compact ? 'scale(0.95)' : 'scale(0.92)',
  overflow: 'hidden',
  color: selected ? '#141014' : '#8c858e',
});
