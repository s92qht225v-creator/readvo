import type { CSSProperties } from 'react';

export const modalBackdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2000,
  background: 'rgba(28, 22, 38, 0.22)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

export const mediaModal: CSSProperties = {
  width: 'min(440px, 100%)',
  background: '#fff',
  borderRadius: 3,
  boxShadow: '0 20px 70px rgba(28, 22, 38, 0.22)',
  border: '1px solid #e4ded8',
};

export const mediaModalHeader: CSSProperties = {
  height: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  borderBottom: '1px solid #eee7df',
};

export const mediaModalTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: '#1c1626',
};

export const modalClose: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6b6470',
  fontSize: 22,
  cursor: 'pointer',
};

export const mediaModalBody: CSSProperties = {
  padding: 16,
};

export const comingSoonBox: CSSProperties = {
  minHeight: 220,
  border: '1px dashed #ded8d1',
  borderRadius: 7,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8b848f',
  background: '#fbfaf8',
};

export const attachMediaButton: CSSProperties = {
  justifySelf: 'start',
  border: 'none',
  background: '#1c1626',
  color: '#fff',
  borderRadius: 7,
  padding: '10px 14px',
  fontWeight: 850,
  cursor: 'pointer',
};
