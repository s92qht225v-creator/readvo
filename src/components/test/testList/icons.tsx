'use client';

import { chevronIcon } from './styles';
import { ChevronDownIcon as BaseChevronDownIcon } from '@/components/ChevronDownIcon';

type SortMode = 'created' | 'updated' | 'alphabetical';

export function FormsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <g clipPath="url(#forms-clip)">
        <path fill="currentColor" d="M14.499 3.75a.25.25 0 0 0-.25-.25h-2.25v9h2.25a.25.25 0 0 0 .25-.25zM6.249 8.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5zm2-2.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5zm-6.75 6.25c0 .138.113.25.25.25h8.75v-9h-8.75a.25.25 0 0 0-.25.25zm14.5 0a1.75 1.75 0 0 1-1.75 1.75h-12.5A1.75 1.75 0 0 1 0 12.25v-8.5c0-.966.783-1.75 1.75-1.75h12.5c.966 0 1.75.784 1.75 1.75z" />
      </g>
      <defs>
        <clipPath id="forms-clip">
          <path fill="currentColor" d="M0 0h16v16H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* Storefront icon for the Marketplace dashboard tab. Sourced from
   /Users/ali/Desktop/marketplace.svg, recolored to currentColor so
   it inherits the tab text color (active red / inactive grey). */
export function MarketplaceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" fill="none">
        <rect x="10.53" y="21.53" width="29.48" height="17.45" />
        <path d="M13.18,18.83s.03.01.03.03v2.61c0,1.51-1.24,2.75-2.76,2.75h-.39c-1.52,0-2.76-1.24-2.76-2.75v-2.61s.01-.03.03-.03h5.85Z" />
        <path d="M19.12,18.83v2.64c0,.1,0,.19-.01.28-.15,1.38-1.33,2.47-2.75,2.47h-.38c-1.52,0-2.76-1.24-2.76-2.75v-2.64h5.9Z" />
        <path d="M25,18.83v2.64c0,1.51-1.24,2.75-2.76,2.75h-.39c-1.42,0-2.6-1.09-2.75-2.47-.01-.09-.01-.18-.01-.28v-2.64h5.91Z" />
        <path d="M30.9,18.83v2.78c-.08,1.45-1.29,2.61-2.76,2.61h-.38c-1.52,0-2.76-1.24-2.76-2.75v-2.64h5.9Z" />
        <path d="M36.8,18.83v2.64c0,1.51-1.24,2.75-2.76,2.75h-.39c-1.46,0-2.67-1.16-2.74-2.61-.01-.05-.01-.09-.01-.14v-2.64h5.9Z" />
        <path d="M42.62,18.83s.07.03.07.07v2.57c0,1.51-1.24,2.75-2.76,2.75h-.38c-1.52,0-2.76-1.24-2.76-2.75v-2.57s.03-.07.07-.07h5.75Z" />
        <path d="M42.64,18.83H7.47c-.08,0-.14-.06-.11-.12l1.99-3.99,1.83-3.68s.02-.02.04-.02h27.57s.03,0,.04.02l1.83,3.68,2.02,4.07s0,.04-.04.04Z" />
        <rect x="21.4" y="28.66" width="7.2" height="10.31" />
      </g>
    </svg>
  );
}

export function ListViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M.75 2a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 .75 2M4 3.75A.75.75 0 0 1 4.75 3h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 3.75m0 4A.75.75 0 0 1 4.75 7h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 7.75m0 4a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export function GridViewIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M2.75 2.5a.25.25 0 0 0-.25.25v4.5h4.75V2.5zm0-1.5A1.75 1.75 0 0 0 1 2.75v10.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 15 13.25V2.75A1.75 1.75 0 0 0 13.25 1zm6 1.5v4.75h4.75v-4.5a.25.25 0 0 0-.25-.25zm4.75 6.25H8.75v4.75h4.5a.25.25 0 0 0 .25-.25zM7.25 13.5V8.75H2.5v4.5c0 .138.112.25.25.25z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return <BaseChevronDownIcon style={chevronIcon} />;
}

export function SortIcon({ mode }: { mode: SortMode }) {
  if (mode === 'updated') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M10.948.513a1.75 1.75 0 0 1 2.475 0l2.064 2.064a1.75 1.75 0 0 1 0 2.475l-8.435 8.435A1.75 1.75 0 0 1 5.814 14H3.75A1.75 1.75 0 0 1 2 12.25v-2.064c0-.464.185-.91.513-1.238zM15.25 12.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5zM3.573 10.009a.25.25 0 0 0-.073.177v2.064c0 .138.112.25.25.25h2.064a.25.25 0 0 0 .177-.073l6.136-6.138L9.71 3.872zm8.79-8.436a.25.25 0 0 0-.354 0L10.77 2.811l2.417 2.417 1.239-1.237a.25.25 0 0 0 0-.353z" />
      </svg>
    );
  }
  if (mode === 'alphabetical') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
        <path fill="currentColor" d="M12.5 1.75a.75.75 0 0 0-1.5 0v10.69l-.97-.97a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l2.25-2.25a.75.75 0 1 0-1.06-1.06l-.97.97z" />
        <path fill="currentColor" d="M3.5 3.329 3.022 4.5h.956zM4.589 6l.216.532a.75.75 0 0 0 1.39-.566l-1.77-4.346a.998.998 0 0 0-1.85 0L.806 5.967a.75.75 0 1 0 1.39.566l.216-.532zM1.25 9.75A.75.75 0 0 1 2 9h3a.75.75 0 0 1 .608 1.19L3.217 13.5H5.25a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.608-1.19l2.391-3.31H2a.75.75 0 0 1-.75-.75" fillRule="evenodd" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M4.75.5a.75.75 0 0 1 .75.75V2h5v-.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v9.5A1.75 1.75 0 0 1 13.25 15H2.75A1.75 1.75 0 0 1 1 13.25v-9.5C1 2.784 1.784 2 2.75 2H4v-.75A.75.75 0 0 1 4.75.5m-2 3a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25zm10.75 4h-11v5.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}
