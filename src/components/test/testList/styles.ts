import type { CSSProperties } from 'react';

export const limitBanner: CSSProperties = {
  margin: 16,
  minHeight: 54,
  border: '1px solid #9bd7cf',
  borderRadius: 10,
  background: '#fbfffd',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '0 18px',
  color: '#3f3946',
  fontSize: 15,
};

export const diamondIcon: CSSProperties = {
  color: '#0f766e',
  fontSize: 22,
  lineHeight: 1,
};

export const upgradeBtn: CSSProperties = {
  marginLeft: 'auto',
  background: '#0f766e',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 6,
  padding: '7px 13px',
  fontSize: 13,
  fontWeight: 700,
};

export const dismissBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6b6470',
  fontSize: 22,
  cursor: 'pointer',
};

export const tabsBar: CSSProperties = {
  margin: '0 16px',
  height: 58,
  background: '#fff',
  borderRadius: '10px 10px 0 0',
  display: 'flex',
  alignItems: 'center',
  gap: 22,
  padding: '0 20px',
};

export const activeTab: CSSProperties = {
  height: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderBottom: '3px solid #1c1626',
  color: '#3f3946',
  fontWeight: 600,
  fontSize: 14,
};

export const inactiveTab: CSSProperties = {
  color: '#6b6470',
  fontSize: 14,
};

export const workspaceShell: CSSProperties = {
  margin: '0 16px 16px',
  minHeight: 'calc(100vh - 198px)',
  display: 'grid',
  gridTemplateColumns: '256px minmax(0, 1fr)',
  background: '#fff',
  borderRadius: '0 0 10px 10px',
  overflow: 'hidden',
};

export const sideRail: CSSProperties = {
  borderRight: '1px solid #dedbdd',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

export const createBtn: CSSProperties = {
  margin: 16,
  height: 34,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 7,
  background: '#3b2f3f',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const sideBlock: CSSProperties = {
  borderTop: '1px solid #dedbdd',
  padding: 16,
};

export const sideTitle: CSSProperties = {
  color: '#6b6470',
  fontSize: 14,
  marginBottom: 10,
};

export const searchBox: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #dedbdd',
  borderRadius: 8,
  background: '#fff',
  color: '#3f3946',
  padding: '9px 10px',
  fontSize: 14,
  outline: 'none',
};

export const workspaceHead: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#6b6470',
  fontSize: 14,
  marginBottom: 20,
};

export const smallPlus: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: '#fff',
  color: '#3f3946',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  border: '1px solid #dedbdd',
  fontSize: 20,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const privateLabel: CSSProperties = {
  color: '#6b6470',
  fontSize: 14,
  marginBottom: 10,
};

export const workspaceList: CSSProperties = {
  display: 'grid',
  gap: 6,
};

export const workspaceItem: CSSProperties = {
  width: '100%',
  height: 40,
  border: 'none',
  borderRadius: 8,
  background: '#e9e7e8',
  color: '#3f3946',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const workspaceItemMuted: CSSProperties = {
  ...workspaceItem,
  background: '#fff',
  color: '#6b6470',
};

export const quotaBox: CSSProperties = {
  marginTop: 'auto',
  borderTop: '1px solid #dedbdd',
  padding: 16,
  color: '#3f3946',
  fontSize: 14,
};

export const quotaTrack: CSSProperties = {
  height: 4,
  background: '#dedbdd',
  borderRadius: 999,
  overflow: 'hidden',
};

export const quotaFill: CSSProperties = {
  height: '100%',
  background: '#3b2f3f',
};

export const quotaLink: CSSProperties = {
  display: 'inline-flex',
  marginTop: 12,
  padding: '5px 8px',
  border: '1px solid #dedbdd',
  borderRadius: 5,
  color: '#3f3946',
  textDecoration: 'none',
  fontSize: 13,
  background: '#fff',
};

export const mainPane: CSSProperties = {
  padding: '40px 42px',
  background: '#fff',
  overflow: 'auto',
};

export const workspaceHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
};

export const workspaceTitleWrap: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export const workspaceTitle: CSSProperties = {
  fontSize: 26,
  lineHeight: 1.1,
  margin: 0,
  fontWeight: 500,
  color: '#2f2835',
};

export const renameModalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0, 0, 0, 0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

export const renameModal: CSSProperties = {
  position: 'relative',
  width: 'min(448px, calc(100vw - 32px))',
  borderRadius: 6,
  background: '#fff',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.28)',
  padding: '32px 32px 32px',
  color: '#1f1b24',
};

export const renameModalClose: CSSProperties = {
  position: 'absolute',
  top: 15,
  right: 16,
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  color: '#898989',
  fontSize: 30,
  lineHeight: 1,
  cursor: 'pointer',
};

export const renameModalTitle: CSSProperties = {
  margin: '0 0 20px',
  color: '#1f1b24',
  fontSize: 24,
  lineHeight: 1.2,
  fontWeight: 400,
};

export const renameModalInput: CSSProperties = {
  width: '100%',
  height: 32,
  boxSizing: 'border-box',
  border: '1px solid #cfcacd',
  borderRadius: 3,
  background: '#fff',
  color: '#1f1b24',
  padding: '0 10px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
};

export const modalError: CSSProperties = {
  marginTop: 10,
  color: '#dc2626',
  fontSize: 13,
};

export const renameModalActions: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 32,
};

export const renameModalCancel: CSSProperties = {
  height: 32,
  border: 'none',
  borderRadius: 4,
  background: '#e8e6e7',
  color: '#2f2835',
  padding: '0 12px',
  fontSize: 14,
  fontWeight: 400,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const renameModalSave: CSSProperties = {
  ...renameModalCancel,
  background: '#2f2933',
  color: '#fff',
};

export const deleteModalText: CSSProperties = {
  margin: '0',
  color: '#4f4655',
  fontSize: 15,
  lineHeight: 1.45,
};

export const deleteModalButton: CSSProperties = {
  ...renameModalCancel,
  background: '#dc2626',
  color: '#fff',
};

export const workspaceMenuButton: CSSProperties = {
  width: 28,
  height: 26,
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: '#6b6470',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: 1,
  cursor: 'pointer',
};

export const workspaceMenu: CSSProperties = {
  position: 'absolute',
  top: 34,
  left: 'calc(100% - 34px)',
  zIndex: 65,
  width: 140,
  padding: 6,
  borderRadius: 10,
  border: '1px solid #dedbdd',
  background: '#fff',
  boxShadow: '0 14px 32px rgba(47, 40, 53, 0.14)',
  display: 'grid',
  gap: 2,
};

export const workspaceMenuItem: CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  borderRadius: 8,
  color: '#3f3946',
  display: 'block',
  padding: '9px 10px',
  fontSize: 14,
  fontFamily: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
};

export const workspaceMenuDangerItem: CSSProperties = {
  ...workspaceMenuItem,
  color: '#b91c1c',
};

export const workspaceControls: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

export const ghostBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6b6470',
  fontSize: 14,
};

export const sortControlWrap: CSSProperties = {
  position: 'relative',
};

export const sortBtn: CSSProperties = {
  border: '1px solid #dedbdd',
  background: '#fff',
  borderRadius: 8,
  color: '#4f4655',
  padding: '0 10px',
  fontSize: 14,
  height: 34,
  minWidth: 158,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const sortIcon: CSSProperties = {
  width: 16,
  color: '#3f3946',
  display: 'inline-flex',
  justifyContent: 'center',
};

export const chevronIcon: CSSProperties = {
  color: '#3f3946',
  flex: '0 0 auto',
  marginLeft: 2,
  transform: 'translateY(1.5px)',
};

export const sortMenu: CSSProperties = {
  position: 'absolute',
  top: 40,
  left: 0,
  zIndex: 60,
  width: 150,
  padding: '6px 0',
  borderRadius: 10,
  border: '1px solid #dedbdd',
  background: '#fff',
  boxShadow: '0 14px 32px rgba(47, 40, 53, 0.14)',
  overflow: 'hidden',
};

export const sortMenuItem: CSSProperties = {
  width: '100%',
  height: 34,
  border: 'none',
  color: '#5f5764',
  display: 'grid',
  gridTemplateColumns: '22px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 8,
  padding: '0 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
};

export const sortMenuIcon: CSSProperties = {
  fontSize: 13,
  color: '#4f4655',
  display: 'inline-flex',
  justifyContent: 'center',
};

export const viewSegment: CSSProperties = {
  height: 34,
  display: 'inline-flex',
  alignItems: 'stretch',
  border: '1px solid #dedbdd',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
};

export const viewToggle: CSSProperties = {
  border: 'none',
  borderRight: '1px solid #e7e2e6',
  background: '#fff',
  color: '#6b6470',
  padding: '0 11px',
  fontSize: 14,
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  cursor: 'pointer',
};

export const viewToggleActive: CSSProperties = {
  ...viewToggle,
  background: '#f0eeee',
  color: '#3f3946',
};

export const divider: CSSProperties = {
  height: 1,
  background: '#dedbdd',
  margin: '24px 0 28px',
};

export const templateGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 16,
  marginBottom: 34,
};

export const dashboardGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 14,
};

export const gridCard: CSSProperties = {
  minHeight: 150,
  border: '1px solid #dedbdd',
  borderRadius: 12,
  background: '#fff',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  cursor: 'pointer',
};

export const gridCardTop: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

export const gridTitle: CSSProperties = {
  color: '#2f2835',
  textDecoration: 'none',
  fontSize: 17,
  lineHeight: 1.25,
  fontWeight: 700,
};

export const gridMeta: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 12,
  borderTop: '1px solid #eee9ed',
  color: '#8b848f',
  fontSize: 12,
};

export const templateCard: CSSProperties = {
  minHeight: 86,
  border: '1px solid #d8b4fe',
  borderRadius: 8,
  background: '#fff',
  display: 'grid',
  gridTemplateColumns: '24px minmax(0, 1fr) auto 24px',
  alignItems: 'center',
  gap: 12,
  padding: '16px 18px',
};

export const useTemplateBtn: CSSProperties = {
  border: '1px solid #dedbdd',
  background: '#fff',
  color: '#6b6470',
  borderRadius: 7,
  padding: '8px 12px',
  textDecoration: 'none',
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

export const templateClose: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#6b6470',
  fontSize: 22,
  cursor: 'pointer',
};

export const tableHead: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '42px minmax(220px, 1fr) 90px 110px 140px 54px',
  alignItems: 'center',
  color: '#6b6470',
  fontSize: 14,
  marginBottom: 10,
  padding: '0 12px',
};

export const testRows: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: 8,
};

export const testRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '42px minmax(220px, 1fr) 90px 110px 140px 54px',
  alignItems: 'center',
  minHeight: 56,
  background: '#fff',
  border: '1px solid #dedbdd',
  borderRadius: 10,
  padding: '0 12px',
  columnGap: 10,
  cursor: 'pointer',
};

export const testIcon: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  background: '#c76a2a',
  color: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
};

export const testTitle: CSSProperties = {
  color: '#2f2835',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 14,
};

export const testSub: CSSProperties = {
  color: '#8b848f',
  fontSize: 12,
  marginTop: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const mutedCell: CSSProperties = {
  color: '#8b848f',
  fontSize: 13,
};

export const publishedPill: CSSProperties = {
  display: 'inline-flex',
  borderRadius: 999,
  background: '#dcfce7',
  color: '#15803d',
  padding: '3px 9px',
  fontSize: 12,
  fontWeight: 700,
};

export const draftPill: CSSProperties = {
  ...publishedPill,
  background: '#f1f5f9',
  color: '#64748b',
};

export const rowMenuCell: CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'flex-end',
};

export const rowMenuButton: CSSProperties = {
  width: 42,
  height: 36,
  borderRadius: 8,
  border: '1px solid #dedbdd',
  background: '#fff',
  color: '#3f3946',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1,
  cursor: 'pointer',
  letterSpacing: 1,
};

export const rowMenu: CSSProperties = {
  position: 'absolute',
  top: 42,
  right: 0,
  zIndex: 50,
  width: 164,
  padding: 6,
  borderRadius: 12,
  border: '1px solid #dedbdd',
  background: '#fff',
  boxShadow: '0 14px 36px rgba(47, 40, 53, 0.16)',
  display: 'grid',
  gap: 2,
};

export const rowMenuItem: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#3f3946',
  borderRadius: 8,
  padding: '9px 10px',
  fontSize: 14,
  textDecoration: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
};

export const rowMenuButtonItem: CSSProperties = {
  ...rowMenuItem,
};

export const rowMenuDangerItem: CSSProperties = {
  ...rowMenuItem,
  color: '#b91c1c',
};

export const emptyState: CSSProperties = {
  maxWidth: 430,
  margin: '58px auto',
  background: 'transparent',
  padding: 24,
  textAlign: 'center',
};

export const emptyIllustration: CSSProperties = {
  display: 'block',
  margin: '0 auto 18px',
  width: 210,
  height: 152,
  objectFit: 'contain',
};

export const emptyTitle: CSSProperties = {
  margin: '0 0 24px',
  color: '#2f2933',
  fontSize: 24,
  lineHeight: 1.25,
  fontWeight: 400,
};

export const emptyCreate: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: '#3b2f3f',
  color: '#fff',
  borderRadius: 8,
  padding: '8px 15px',
  textDecoration: 'none',
  fontWeight: 500,
  fontSize: 16,
  fontFamily: 'inherit',
  cursor: 'pointer',
};
