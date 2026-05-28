'use client';

import { useEffect, useState, useCallback, useMemo, type ReactNode, type CSSProperties } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, type DragEndEvent,
} from '@dnd-kit/core';
import { useAuth } from '@/hooks/useAuth';
import { authHeaders } from '@/lib/test/clientFetch';
import { navigateToTestHref } from '@/lib/test/paths';
import type { Test, Workspace } from '@/lib/test/types';
import { FREE_WORKSPACE_LIMIT } from '@/lib/test/types';
import { TestLink } from './TestLink';
import { FormsIcon, MarketplaceIcon, SettingsIcon, ListViewIcon, GridViewIcon, ChevronDownIcon, SortIcon, MoreMenuIcon } from './testList/icons';
import { formatDate } from './testList/formatDate';
import {
  limitBanner,
  diamondIcon,
  upgradeBtn,
  dismissBtn,
  tabsBar,
  activeTab,
  inactiveTab,
  workspaceShell,
  sideRail,
  createBtn,
  sideBlock,
  sideTitle,
  searchBox,
  workspaceHead,
  smallPlus,
  privateLabel,
  workspaceList,
  workspaceItem,
  workspaceItemMuted,
  quotaBox,
  quotaTrack,
  quotaFill,
  quotaLink,
  mainPane,
  workspaceHeader,
  workspaceTitleWrap,
  workspaceTitle,
  renameModalOverlay,
  renameModal,
  renameModalClose,
  renameModalTitle,
  renameModalInput,
  modalError,
  renameModalActions,
  renameModalCancel,
  renameModalSave,
  deleteModalText,
  deleteModalButton,
  workspaceMenuButton,
  workspaceMenu,
  workspaceMenuItem,
  workspaceMenuDangerItem,
  workspaceControls,
  sortControlWrap,
  sortBtn,
  sortIcon,
  sortMenu,
  sortMenuItem,
  sortMenuIcon,
  viewSegment,
  viewToggle,
  viewToggleActive,
  divider,
  dashboardGrid,
  gridCard,
  gridCardTop,
  gridTitle,
  gridMeta,
  tableHead,
  testRows,
  testRow,
  testIcon,
  testTitle,
  testSub,
  mutedCell,
  publishedPill,
  draftPill,
  rowMenuCell,
  rowMenuButton,
  rowMenu,
  rowMenuItem,
  rowMenuButtonItem,
  rowMenuDangerItem,
  emptyState,
  emptyIllustration,
  emptyTitle,
  emptyCreate,
} from './testList/styles';

interface ListItem extends Test {}
interface WorkspaceItem {
  id: string;
  name: string;
}

const SHARE_BASE = process.env.NEXT_PUBLIC_TEST_SHARE_BASE ?? 'https://test.blim.uz';
type SortMode = 'created' | 'updated' | 'alphabetical';
type ViewMode = 'list' | 'grid';

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: 'created', label: 'Date created' },
  { value: 'updated', label: 'Last updated' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

type DashboardTab = 'tests' | 'marketplace' | 'settings';

type MarketplaceTest = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  price: number;
  questionCount: number;
};

const DEFAULT_WORKSPACE: WorkspaceItem = { id: 'default', name: 'My workspace' };
const ACTIVE_WORKSPACE_KEY = 'blim-test-active-workspace';

/* The active-workspace selection (which folder you're viewing) is a UI
   convenience kept in localStorage. The workspace LIST + membership are
   server-backed (test_workspaces + tests.workspace_id). */
function readStoredActiveWorkspace(): string {
  if (typeof window === 'undefined') return 'default';
  try {
    return window.localStorage.getItem(ACTIVE_WORKSPACE_KEY) || 'default';
  } catch {
    return 'default';
  }
}

export function TestList() {
  const { getAccessToken, user, subscription, logout } = useAuth();
  const [hideBranding, setHideBranding] = useState(false);
  const [tests, setTests] = useState<ListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('tests');
  const [marketplaceTests, setMarketplaceTests] = useState<MarketplaceTest[] | null>(null);
  const [buyingTest, setBuyingTest] = useState<MarketplaceTest | null>(null);
  const [showLimitBanner, setShowLimitBanner] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('created');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  /* Server-backed workspaces (test_workspaces). The synthetic
     'default' bucket (workspace_id = null) is prepended for display
     and is not a stored row. */
  const [serverWorkspaces, setServerWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => readStoredActiveWorkspace());
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [draggingTestId, setDraggingTestId] = useState<string | null>(null);
  const workspaces = useMemo<WorkspaceItem[]>(
    () => [DEFAULT_WORKSPACE, ...serverWorkspaces.map(w => ({ id: w.id, name: w.name }))],
    [serverWorkspaces],
  );
  /* 6px activation distance so a click on a test row still navigates;
     only a deliberate drag starts the move. */
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
  const [workspaceDraft, setWorkspaceDraft] = useState('My workspace');
  const [isAddingWorkspace, setIsAddingWorkspace] = useState(false);
  const [newWorkspaceDraft, setNewWorkspaceDraft] = useState('');
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [newTestDraft, setNewTestDraft] = useState('');
  const [createTestError, setCreateTestError] = useState<string | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [renamingTest, setRenamingTest] = useState<ListItem | null>(null);
  const [testDraft, setTestDraft] = useState('');
  const [deletingTest, setDeletingTest] = useState<ListItem | null>(null);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  /* Active-subscription gate: when true, hide free-tier banner + sidebar
     quota box (subscribers don't have the 1-test cap). Initially null
     so we don't flash the banner before the subscription check returns. */
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const tok = await getAccessToken();
    const res = await fetch('/api/tests', { headers: authHeaders(tok) });
    if (!res.ok) {
      setError('Failed to load tests');
      return;
    }
    const json = await res.json();
    setTests(json.tests);
  }, [getAccessToken]);

  const loadWorkspaces = useCallback(async () => {
    const tok = await getAccessToken();
    const res = await fetch('/api/workspaces', { headers: authHeaders(tok) });
    if (!res.ok) return;
    const json = await res.json().catch(() => ({ workspaces: [] }));
    setServerWorkspaces(json.workspaces ?? []);
  }, [getAccessToken]);

  const loadSettings = useCallback(async () => {
    const tok = await getAccessToken();
    const res = await fetch('/api/settings', { headers: authHeaders(tok) });
    if (!res.ok) return;
    const json = await res.json().catch(() => null);
    if (json?.settings) setHideBranding(!!json.settings.hide_branding);
  }, [getAccessToken]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState happens inside async fetch, after await
  useEffect(() => { load(); loadWorkspaces(); loadSettings(); }, [load, loadWorkspaces, loadSettings]);

  /* Lazy-fetch marketplace tests the first time the Marketplace tab
     is opened. Result cached in state for the session; re-fetch on
     tab re-open is a follow-up if listings start changing during a
     session. */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (dashboardTab !== 'marketplace' || marketplaceTests !== null) return;
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/marketplace');
      if (cancelled) return;
      if (!res.ok) { setMarketplaceTests([]); return; }
      const json = await res.json().catch(() => ({ tests: [] }));
      setMarketplaceTests(json.tests ?? []);
    })();
    return () => { cancelled = true; };
  }, [dashboardTab, marketplaceTests]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState happens inside async fetch, after await
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tok = await getAccessToken();
      const res = await fetch('/api/subscription', { headers: authHeaders(tok) });
      if (cancelled) return;
      if (!res.ok) {
        setHasActiveSubscription(false);
        return;
      }
      const json = await res.json().catch(() => ({}));
      /* /api/subscription returns the active sub (ends_at > now) or null. */
      setHasActiveSubscription(!!json.subscription);
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  /* Persist only the active-folder selection (UI convenience). */
  useEffect(() => {
    try { window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, activeWorkspaceId); } catch { /* private mode / quota */ }
  }, [activeWorkspaceId]);

  /* If the active workspace no longer exists (deleted elsewhere or stale
     localStorage), fall back to the default bucket. */
  useEffect(() => {
    if (activeWorkspaceId !== 'default' && !serverWorkspaces.some(w => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId('default');
    }
  }, [serverWorkspaces, activeWorkspaceId]);

  useEffect(() => {
    if (!openMenuId && !isSortOpen && !isWorkspaceMenuOpen) return;
    const close = () => {
      setOpenMenuId(null);
      setIsSortOpen(false);
      setIsWorkspaceMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId, isSortOpen, isWorkspaceMenuOpen]);

  const visibleTests = useMemo(() => {
    if (!tests) return null;
    /* Filter by the active workspace: 'default' shows tests with no
       workspace (workspace_id null/undefined); a real id shows only
       that workspace's tests. */
    const inWorkspace = tests.filter(t => (
      activeWorkspaceId === 'default'
        ? !t.workspace_id
        : t.workspace_id === activeWorkspaceId
    ));
    const q = query.trim().toLowerCase();
    const filtered = q ? inWorkspace.filter(t => (
      t.title.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    )) : inWorkspace;
    return [...filtered].sort((a, b) => {
      if (sortMode === 'alphabetical') return a.title.localeCompare(b.title);
      if (sortMode === 'updated') {
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tests, query, sortMode, activeWorkspaceId]);

  const duplicateTest = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${id}/duplicate`, {
      method: 'POST',
      headers: authHeaders(tok),
    });
    setBusyId(null);
    if (!res.ok) {
      alert('Failed to duplicate test');
      return;
    }
    const json = await res.json();
    setTests(current => current ? [json.test, ...current] : current);
  };

  const deleteTest = (test: ListItem) => {
    setDeletingTest(test);
  };

  const confirmDeleteTest = async () => {
    const test = deletingTest;
    if (!test || busyId) return;
    setBusyId(test.id);
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${test.id}`, {
      method: 'DELETE',
      headers: authHeaders(tok),
    });
    setBusyId(null);
    if (!res.ok) {
      alert('Failed to delete test');
      return;
    }
    setTests(current => current ? current.filter(t => t.id !== test.id) : current);
    setDeletingTest(null);
  };

  const renameTest = async (test: ListItem) => {
    setTestDraft(test.title);
    setRenamingTest(test);
  };

  const saveTestRename = async () => {
    const test = renamingTest;
    if (!test || busyId) return;
    const nextTitle = testDraft.trim();
    if (!nextTitle || nextTitle === test.title) {
      setRenamingTest(null);
      return;
    }
    if (busyId) return;
    setBusyId(test.id);
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${test.id}`, {
      method: 'PATCH',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: nextTitle }),
    });
    setBusyId(null);
    if (!res.ok) {
      alert('Failed to rename test');
      return;
    }
    const json = await res.json();
    setTests(current => current ? current.map(t => t.id === test.id ? json.test : t) : current);
    setRenamingTest(null);
  };

  const copyShareLink = async (test: ListItem) => {
    const shareUrl = `${SHARE_BASE}/t/${test.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt('Copy link', shareUrl);
    }
  };

  const openTestBuilder = (test: ListItem) => {
    navigateToTestHref(`/dashboard/${test.id}/edit`);
  };

  const renameWorkspace = () => {
    setWorkspaceDraft(workspaceName);
    setIsRenamingWorkspace(true);
  };

  const saveWorkspaceRename = async () => {
    const nextTitle = workspaceDraft.trim();
    setIsRenamingWorkspace(false);
    if (!nextTitle || activeWorkspaceId === 'default') return;
    /* Optimistic rename, then persist. */
    setServerWorkspaces(current => current.map(w => (
      w.id === activeWorkspaceId ? { ...w, name: nextTitle } : w
    )));
    const tok = await getAccessToken();
    const res = await fetch(`/api/workspaces/${activeWorkspaceId}`, {
      method: 'PATCH',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: nextTitle }),
    });
    if (!res.ok) loadWorkspaces();  // revert to server truth on failure
  };

  const openAddWorkspace = () => {
    setNewWorkspaceDraft('');
    setWorkspaceError(null);
    setIsAddingWorkspace(true);
  };

  const saveNewWorkspace = async () => {
    const name = newWorkspaceDraft.trim();
    if (!name) return;
    setWorkspaceError(null);
    const tok = await getAccessToken();
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setWorkspaceError(
        json.error === 'free_workspace_limit_reached'
          ? `Free accounts can create up to ${FREE_WORKSPACE_LIMIT} workspaces. Upgrade for unlimited.`
          : 'Failed to create workspace',
      );
      return;
    }
    const { workspace } = await res.json();
    setServerWorkspaces(current => [...current, workspace]);
    setActiveWorkspaceId(workspace.id);
    setIsAddingWorkspace(false);
  };

  /* Move a test into a workspace (or back to default with null). Used
     by drag-and-drop onto the sidebar. Optimistic. */
  const moveTestToWorkspace = useCallback(async (testId: string, workspaceId: string | null) => {
    const targetId = workspaceId === 'default' ? null : workspaceId;
    setTests(current => current?.map(t => (t.id === testId ? { ...t, workspace_id: targetId } : t)) ?? current);
    const tok = await getAccessToken();
    const res = await fetch(`/api/tests/${testId}`, {
      method: 'PATCH',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ workspace_id: targetId }),
    });
    if (!res.ok) load();  // revert to server truth on failure
  }, [getAccessToken, load]);

  const toggleHideBranding = async (next: boolean) => {
    setHideBranding(next);  // optimistic
    const tok = await getAccessToken();
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ hide_branding: next }),
    });
    if (!res.ok) setHideBranding(!next);  // revert on failure
  };

  const openCreateTest = () => {
    setNewTestDraft('');
    setCreateTestError(null);
    setIsCreatingTest(true);
  };

  const createTest = async () => {
    const title = newTestDraft.trim();
    if (!title || isSubmittingTest) return;
    setIsSubmittingTest(true);
    setCreateTestError(null);
    const tok = await getAccessToken();
    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      /* Drop the new test into the workspace currently being viewed. */
      body: JSON.stringify({ title, workspace_id: activeWorkspaceId === 'default' ? null : activeWorkspaceId }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setCreateTestError(json.error ?? 'Failed to create test');
      setIsSubmittingTest(false);
      return;
    }
    const { test } = await res.json();
    setIsCreatingTest(false);
    setIsSubmittingTest(false);
    navigateToTestHref(`/dashboard/${test.id}/edit`);
  };

  const deleteWorkspace = () => {
    if (activeWorkspaceId === 'default') return;
    setIsDeletingWorkspace(true);
  };

  const confirmDeleteWorkspace = async () => {
    const id = activeWorkspaceId;
    setIsDeletingWorkspace(false);
    if (id === 'default') return;
    /* Optimistic: remove from sidebar, return to default. Tests in it
       fall back to the default bucket server-side (FK set null), so
       refresh tests too. */
    setServerWorkspaces(current => current.filter(w => w.id !== id));
    setActiveWorkspaceId('default');
    const tok = await getAccessToken();
    const res = await fetch(`/api/workspaces/${id}`, { method: 'DELETE', headers: authHeaders(tok) });
    if (!res.ok) { loadWorkspaces(); return; }
    load();  // tests that were in it now show null workspace_id
  };

  if (error) return <div style={{ color: '#dc2626', padding: 24 }}>{error}</div>;
  if (tests === null) return <div style={{ color: '#94a3b8', padding: 24 }}>Loading…</div>;

  const publishedCount = tests.filter(t => t.is_published).length;
  const draftCount = tests.length - publishedCount;
  const renderedTests = visibleTests ?? [];
  const activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceName = activeWorkspace?.name ?? 'My workspace';
  const workspaceCount = (id: string) => (
    id === 'default'
      ? tests.filter(t => !t.workspace_id).length
      : tests.filter(t => t.workspace_id === id).length
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTestId(null);
    const testId = event.active?.id ? String(event.active.id) : null;
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!testId || !overId) return;
    /* over ids are prefixed 'ws-' to namespace droppable workspaces. */
    if (!overId.startsWith('ws-')) return;
    const workspaceId = overId.slice(3);
    const test = tests.find(t => t.id === testId);
    const currentWs = test?.workspace_id ?? 'default';
    if (currentWs === workspaceId) return;  // no-op drop on same folder
    moveTestToWorkspace(testId, workspaceId);
  };

  return (
    <div style={{ background: '#fff', minHeight: 'calc(100vh - 61px)' }}>
      <style jsx global>{`
        .test-dashboard-menu-item:hover,
        .test-dashboard-menu-item:focus-visible {
          background: #eeeeee !important;
        }

        .test-dashboard-menu-item:disabled {
          cursor: not-allowed !important;
          opacity: 0.5;
        }

        .test-dashboard-control-menu-item:hover,
        .test-dashboard-control-menu-item:focus-visible {
          background: #eeeeee !important;
        }
      `}</style>
      {isRenamingWorkspace ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-workspace-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              saveWorkspaceRename();
            }}
          >
            <button
              type="button"
              aria-label="Close rename workspace"
              style={renameModalClose}
              onClick={() => setIsRenamingWorkspace(false)}
            >
              ×
            </button>
            <h2 id="rename-workspace-title" style={renameModalTitle}>Rename workspace</h2>
            <input
              autoFocus
              value={workspaceDraft}
              onChange={event => setWorkspaceDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') setIsRenamingWorkspace(false);
              }}
              style={renameModalInput}
              aria-label="Workspace name"
            />
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setIsRenamingWorkspace(false)}>Cancel</button>
              <button type="submit" style={renameModalSave}>Save</button>
            </div>
          </form>
        </div>
      ) : null}
      {renamingTest ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-test-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              saveTestRename();
            }}
          >
            <button
              type="button"
              aria-label="Close rename test"
              style={renameModalClose}
              onClick={() => setRenamingTest(null)}
            >
              ×
            </button>
            <h2 id="rename-test-title" style={renameModalTitle}>Rename test</h2>
            <input
              autoFocus
              value={testDraft}
              onChange={event => setTestDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') setRenamingTest(null);
              }}
              style={renameModalInput}
              aria-label="Test name"
            />
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setRenamingTest(null)}>Cancel</button>
              <button type="submit" style={renameModalSave} disabled={busyId === renamingTest.id}>
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {isAddingWorkspace ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-workspace-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              saveNewWorkspace();
            }}
          >
            <button
              type="button"
              aria-label="Close add workspace"
              style={renameModalClose}
              onClick={() => setIsAddingWorkspace(false)}
            >
              ×
            </button>
            <h2 id="add-workspace-title" style={renameModalTitle}>Add workspace</h2>
            <input
              autoFocus
              value={newWorkspaceDraft}
              onChange={event => setNewWorkspaceDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') setIsAddingWorkspace(false);
              }}
              style={renameModalInput}
              aria-label="Workspace name"
              placeholder="Workspace name"
            />
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setIsAddingWorkspace(false)}>Cancel</button>
              <button type="submit" style={renameModalSave}>Save</button>
            </div>
          </form>
        </div>
      ) : null}
      {isCreatingTest ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-test-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              createTest();
            }}
          >
            <button
              type="button"
              aria-label="Close create test"
              style={renameModalClose}
              onClick={() => {
                if (!isSubmittingTest) setIsCreatingTest(false);
              }}
            >
              ×
            </button>
            <h2 id="create-test-title" style={renameModalTitle}>Name your test</h2>
            <input
              autoFocus
              value={newTestDraft}
              onChange={event => {
                setNewTestDraft(event.target.value);
                setCreateTestError(null);
              }}
              onKeyDown={event => {
                if (event.key === 'Escape' && !isSubmittingTest) setIsCreatingTest(false);
              }}
              style={renameModalInput}
              aria-label="Test name"
              placeholder="Test name"
            />
            {createTestError ? <div style={modalError}>{createTestError}</div> : null}
            <div style={renameModalActions}>
              <button
                type="button"
                style={renameModalCancel}
                onClick={() => setIsCreatingTest(false)}
                disabled={isSubmittingTest}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...renameModalSave,
                  opacity: newTestDraft.trim() && !isSubmittingTest ? 1 : 0.5,
                  cursor: newTestDraft.trim() && !isSubmittingTest ? 'pointer' : 'not-allowed',
                }}
                disabled={!newTestDraft.trim() || isSubmittingTest}
              >
                {isSubmittingTest ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {deletingTest ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-test-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              confirmDeleteTest();
            }}
          >
            <button
              type="button"
              aria-label="Close delete test"
              style={renameModalClose}
              onClick={() => setDeletingTest(null)}
            >
              ×
            </button>
            <h2 id="delete-test-title" style={renameModalTitle}>Delete test</h2>
            <p style={deleteModalText}>
              Delete <strong>{deletingTest.title}</strong>? This also deletes its questions and responses.
            </p>
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setDeletingTest(null)}>Cancel</button>
              <button type="submit" style={deleteModalButton} disabled={busyId === deletingTest.id}>
                Delete
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {isDeletingWorkspace ? (
        <div style={renameModalOverlay} role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-workspace-title"
            style={renameModal}
            onSubmit={event => {
              event.preventDefault();
              confirmDeleteWorkspace();
            }}
          >
            <button
              type="button"
              aria-label="Close delete workspace"
              style={renameModalClose}
              onClick={() => setIsDeletingWorkspace(false)}
            >
              ×
            </button>
            <h2 id="delete-workspace-title" style={renameModalTitle}>Delete workspace</h2>
            <p style={deleteModalText}>
              Delete <strong>{workspaceName}</strong>? Its tests aren&apos;t deleted — they move back to “My workspace”.
            </p>
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setIsDeletingWorkspace(false)}>Cancel</button>
              <button type="submit" style={deleteModalButton}>Delete</button>
            </div>
          </form>
        </div>
      ) : null}
      {showLimitBanner && hasActiveSubscription === false ? (
        <section style={limitBanner}>
          <span style={diamondIcon}>◇</span>
          <span>Free accounts can publish 1 test at a time. Drafts are unlimited.</span>
          <strong>{publishedCount} / 1 published</strong>
          <a href="https://blim.uz/uz/payment" style={upgradeBtn}>Upgrade</a>
          <button type="button" aria-label="Dismiss banner" onClick={() => setShowLimitBanner(false)} style={dismissBtn}>×</button>
        </section>
      ) : null}

      <nav style={tabsBar} aria-label="Test workspace sections">
        <button
          type="button"
          style={{ ...(dashboardTab === 'tests' ? activeTab : inactiveTab), background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => setDashboardTab('tests')}
        >
          <FormsIcon /> Tests
        </button>
        <button
          type="button"
          style={{ ...(dashboardTab === 'marketplace' ? activeTab : inactiveTab), background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => setDashboardTab('marketplace')}
        >
          <MarketplaceIcon /> Marketplace
        </button>
        <button
          type="button"
          style={{ ...(dashboardTab === 'settings' ? activeTab : inactiveTab), background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={() => setDashboardTab('settings')}
        >
          <SettingsIcon /> Settings
        </button>
      </nav>

      <DndContext
        sensors={dndSensors}
        onDragStart={event => setDraggingTestId(event.active?.id ? String(event.active.id) : null)}
        onDragCancel={() => setDraggingTestId(null)}
        onDragEnd={handleDragEnd}
      >
      <div style={workspaceShell}>
        <aside style={sideRail}>
          <button type="button" style={createBtn} onClick={openCreateTest}>+ Create test</button>

          <div style={sideBlock}>
            <div style={sideTitle}>Search</div>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search tests"
              style={searchBox}
            />
          </div>

          <div style={sideBlock}>
            <div style={workspaceHead}>
              <span>Workspaces</span>
              <button type="button" aria-label="Add workspace" onClick={openAddWorkspace} style={smallPlus}>+</button>
            </div>
            <div style={privateLabel}>Private</div>
            <div style={workspaceList}>
              {workspaces.map(workspace => (
                <WorkspaceDropTarget
                  key={workspace.id}
                  workspace={workspace}
                  count={workspaceCount(workspace.id)}
                  active={workspace.id === activeWorkspaceId}
                  dragging={!!draggingTestId}
                  onSelect={() => setActiveWorkspaceId(workspace.id)}
                />
              ))}
            </div>
            {workspaceError ? (
              <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{workspaceError}</div>
            ) : null}
          </div>

          {hasActiveSubscription === true ? (
            <div style={quotaBox}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#0f172a' }}>Pro</div>
              <div style={{ color: '#6b6470' }}>Unlimited published tests</div>
            </div>
          ) : hasActiveSubscription === false ? (
            <div style={quotaBox}>
              <div style={{ marginBottom: 8 }}>Published (free tier)</div>
              <div style={quotaTrack}><div style={{ ...quotaFill, width: `${Math.min(100, (publishedCount / 1) * 100)}%` }} /></div>
              <div style={{ color: '#6b6470', marginTop: 6 }}>{publishedCount} / 1 · drafts unlimited</div>
              <a href="https://blim.uz/uz/payment" style={quotaLink}>Increase limit</a>
            </div>
          ) : null}
        </aside>

        <main style={mainPane}>
          {dashboardTab === 'marketplace' ? (
            <MarketplacePane
              tests={marketplaceTests}
              ownedTestIds={new Set((tests ?? []).map(t => t.id))}
              onBuy={setBuyingTest}
            />
          ) : dashboardTab === 'settings' ? (
            <SettingsPane
              user={user}
              subscription={subscription}
              hasActiveSubscription={hasActiveSubscription}
              hideBranding={hideBranding}
              onToggleHideBranding={toggleHideBranding}
              onLogout={logout}
            />
          ) : (<>
          <header style={workspaceHeader}>
            <div>
              <div style={workspaceTitleWrap} onMouseDown={event => event.stopPropagation()}>
                <h1 style={workspaceTitle}>{workspaceName}</h1>
                <button
                  type="button"
                  aria-label="Workspace actions"
                  aria-haspopup="menu"
                  aria-expanded={isWorkspaceMenuOpen}
                  style={workspaceMenuButton}
                  onClick={() => setIsWorkspaceMenuOpen(open => !open)}
                >
                  <MoreMenuIcon />
                </button>
                {isWorkspaceMenuOpen ? (
                  <div role="menu" style={workspaceMenu}>
                    <button
                      className="test-dashboard-menu-item"
                      type="button"
                      role="menuitem"
                      style={workspaceMenuItem}
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        renameWorkspace();
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="test-dashboard-menu-item"
                      type="button"
                      role="menuitem"
                      style={workspaceMenuDangerItem}
                      onClick={() => {
                        setIsWorkspaceMenuOpen(false);
                        deleteWorkspace();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
              <div style={{ fontSize: 13, color: '#7c7480', marginTop: 6 }}>
                {tests.length} tests · {publishedCount} published · {draftCount} drafts
              </div>
            </div>
            <div style={workspaceControls}>
              <div
                style={sortControlWrap}
                onMouseDown={event => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isSortOpen}
                  onClick={() => setIsSortOpen(open => !open)}
                  style={sortBtn}
                >
                  <SortIcon mode={sortMode} />
                  <span>{SORT_OPTIONS.find(option => option.value === sortMode)?.label}</span>
                  <ChevronDownIcon />
                </button>
                {isSortOpen ? (
                  <div role="listbox" style={sortMenu}>
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={sortMode === option.value}
                        className="test-dashboard-control-menu-item"
                        style={{
                          ...sortMenuItem,
                          background: sortMode === option.value ? '#f4f3f4' : '#fff',
                        }}
                        onClick={() => {
                          setSortMode(option.value);
                          setIsSortOpen(false);
                        }}
                      >
                        <span style={sortMenuIcon}><SortIcon mode={option.value} /></span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div style={viewSegment} aria-label="View mode">
                <button
                  type="button"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  style={viewMode === 'list' ? viewToggleActive : viewToggle}
                >
                  <ListViewIcon /> <span>List</span>
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  style={viewMode === 'grid' ? viewToggleActive : viewToggle}
                >
                  <GridViewIcon /> <span>Grid</span>
                </button>
              </div>
            </div>
          </header>

          <div style={divider} />

          {renderedTests.length === 0 && !query.trim() ? (
            <section style={emptyState}>
              <img src="/test-no-form.svg" alt="" aria-hidden="true" style={emptyIllustration} />
              <h2 style={emptyTitle}>There’s no test</h2>
              <button type="button" style={emptyCreate} onClick={openCreateTest}>+ Create test</button>
            </section>
          ) : renderedTests.length === 0 ? (
            <section style={emptyState}>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>No matches</h2>
              <p style={{ margin: 0, color: '#6b6470' }}>Try another title or slug.</p>
            </section>
          ) : viewMode === 'grid' ? (
            <section style={dashboardGrid}>
              {renderedTests.map(t => (
                <article
                  key={t.id}
                  style={gridCard}
                  role="link"
                  tabIndex={0}
                  onClick={() => openTestBuilder(t)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openTestBuilder(t);
                    }
                  }}
                >
                  <div style={gridCardTop}>
                    <div style={testIcon}>{t.title.slice(0, 1).toUpperCase() || 'T'}</div>
                    <span style={t.is_published ? publishedPill : draftPill}>
                      {t.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <TestLink href={`/dashboard/${t.id}/edit`} style={gridTitle}>{t.title}</TestLink>
                  <div style={testSub}>{t.is_published ? `/t/${t.slug}` : 'Draft test'}</div>
                  <div style={gridMeta}>Updated {formatDate(t.updated_at || t.created_at)}</div>
                </article>
              ))}
            </section>
          ) : (
            <section>
              <div style={tableHead}>
                <span style={{ gridColumn: '1 / 3' }} />
                <span style={{ textAlign: 'center' }}>Responses</span>
                <span style={{ textAlign: 'center' }}>Status</span>
                <span style={{ textAlign: 'center' }}>Updated</span>
                <span style={{ textAlign: 'center' }}>Actions</span>
              </div>
              <ul style={testRows}>
                {renderedTests.map(t => (
                  <DraggableTestRow key={t.id} testId={t.id} onOpen={() => openTestBuilder(t)}>
                    <div style={testIcon}>{t.title.slice(0, 1).toUpperCase() || 'T'}</div>
                    <div style={{ minWidth: 0 }}>
                      <TestLink href={`/dashboard/${t.id}/edit`} style={testTitle}>
                        {t.title}
                      </TestLink>
                      <div style={testSub}>
                        {t.is_published ? `Share: /t/${t.slug}` : 'Draft test'}
                      </div>
                    </div>
                    <div style={{ ...mutedCell, textAlign: 'center' }}>{t.response_count ?? 0}</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={t.is_published ? publishedPill : draftPill}>
                        {t.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div style={{ ...mutedCell, textAlign: 'center' }}>{formatDate(t.updated_at || t.created_at)}</div>
                    <div
                      style={rowMenuCell}
                      onMouseDown={event => event.stopPropagation()}
                      onClick={event => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Actions for ${t.title}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === t.id}
                        onClick={() => setOpenMenuId(current => current === t.id ? null : t.id)}
                        style={rowMenuButton}
                      >
                        <MoreMenuIcon />
                      </button>
                      {openMenuId === t.id ? (
                        <div role="menu" style={rowMenu}>
                          <TestLink className="test-dashboard-menu-item" href={`/dashboard/${t.id}/edit`} style={rowMenuItem} onClick={() => setOpenMenuId(null)}>Edit</TestLink>
                          <button className="test-dashboard-menu-item" type="button" role="menuitem" style={rowMenuButtonItem} onClick={() => { setOpenMenuId(null); copyShareLink(t); }}>Copy link</button>
                          <button className="test-dashboard-menu-item" type="button" role="menuitem" style={rowMenuButtonItem} onClick={() => { setOpenMenuId(null); renameTest(t); }}>Rename</button>
                          <button className="test-dashboard-menu-item" type="button" role="menuitem" style={rowMenuButtonItem} disabled={busyId === t.id} onClick={() => { setOpenMenuId(null); duplicateTest(t.id); }}>Duplicate</button>
                          <button className="test-dashboard-menu-item" type="button" role="menuitem" style={rowMenuDangerItem} disabled={busyId === t.id} onClick={() => { setOpenMenuId(null); deleteTest(t); }}>Delete</button>
                          <TestLink className="test-dashboard-menu-item" href={`/dashboard/${t.id}/edit?tab=results`} style={rowMenuItem} onClick={() => setOpenMenuId(null)}>Results</TestLink>
                        </div>
                      ) : null}
                    </div>
                  </DraggableTestRow>
                ))}
              </ul>
            </section>
          )}
          </>)}
        </main>
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingTestId ? (() => {
          const t = tests.find(x => x.id === draggingTestId);
          if (!t) return null;
          return (
            <div style={dragPreview}>
              <div style={testIcon}>{t.title.slice(0, 1).toUpperCase() || 'T'}</div>
              <span style={dragPreviewTitle}>{t.title}</span>
            </div>
          );
        })() : null}
      </DragOverlay>
      </DndContext>

      {buyingTest ? (
        <MarketplaceBuyModal
          test={buyingTest}
          workspaces={workspaces}
          onClose={() => setBuyingTest(null)}
          onSubmitted={() => {
            setBuyingTest(null);
            /* The copy appears in `tests` after admin approval — next
               full reload picks it up. We don't have realtime here. */
          }}
          getAccessToken={getAccessToken}
        />
      ) : null}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Drag-and-drop: test rows are draggable; sidebar workspaces are drop
   targets. Dropping a row on a workspace moves the test there.
   ────────────────────────────────────────────────────────────────── */
const dragPreview: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 14px 8px 8px',
  background: '#fff',
  border: '1px solid #2f2533',
  borderRadius: 3,
  boxShadow: '0 12px 30px rgba(47,37,51,0.22)',
  cursor: 'grabbing',
  maxWidth: 280,
};

const dragPreviewTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#2f2835',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function DraggableTestRow({ testId, onOpen, children }: {
  testId: string;
  onOpen: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: testId });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ ...testRow, opacity: isDragging ? 0.4 : 1, cursor: isDragging ? 'grabbing' : 'pointer' }}
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {children}
    </li>
  );
}

function WorkspaceDropTarget({ workspace, count, active, dragging, onSelect }: {
  workspace: WorkspaceItem;
  count: number;
  active: boolean;
  dragging: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `ws-${workspace.id}` });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      style={{
        ...(active ? workspaceItem : workspaceItemMuted),
        /* Highlight as a drop zone while a row is being dragged over it. */
        outline: isOver ? '2px solid #2f2533' : 'none',
        outlineOffset: -2,
        background: isOver ? '#f1efec' : (active ? workspaceItem.background : workspaceItemMuted.background),
        transition: dragging ? 'outline 0.08s, background 0.08s' : undefined,
      }}
    >
      <span>{workspace.name}</span>
      <span>{count}</span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────
   SettingsPane — account, subscription, and preferences.
   ────────────────────────────────────────────────────────────────── */
function SettingsPane({ user, subscription, hasActiveSubscription, hideBranding, onToggleHideBranding, onLogout }: {
  user: { name?: string; email?: string; created_at?: string; avatar_url?: string } | null;
  subscription: { ends_at: string; plan?: string } | null;
  hasActiveSubscription: boolean | null;
  hideBranding: boolean;
  onToggleHideBranding: (next: boolean) => void;
  onLogout: () => void;
}) {
  const subDaysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / 86_400_000))
    : 0;
  const isPro = hasActiveSubscription === true;

  return (
    <div style={settingsPane}>
      {/* Subscription */}
      <section style={settingsCard}>
        <h2 style={settingsCardTitle}>Plan</h2>
        {isPro ? (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d' }}>Pro</div>
            <div style={settingsMuted}>
              {subscription?.plan ? `${subscription.plan} · ` : ''}{subDaysLeft} day{subDaysLeft === 1 ? '' : 's'} left
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Free</div>
            <div style={settingsMuted}>1 published test at a time · drafts unlimited · up to {FREE_WORKSPACE_LIMIT} workspaces</div>
            <a href="https://blim.uz/uz/payment" style={settingsUpgradeBtn}>Upgrade to Pro</a>
          </>
        )}
      </section>

      {/* Branding (Pro perk) */}
      <section style={settingsCard}>
        <h2 style={settingsCardTitle}>Branding</h2>
        <div style={settingsRow}>
          <div>
            <div style={{ fontSize: 14, color: '#2f2835', fontWeight: 600 }}>Hide “Made with Blim”</div>
            <div style={settingsMuted}>
              {isPro
                ? 'Remove the Blim badge from your published tests.'
                : 'Available on Pro. Free tests always show the Blim badge.'}
            </div>
          </div>
          <SettingsToggle
            checked={isPro && hideBranding}
            disabled={!isPro}
            onChange={onToggleHideBranding}
          />
        </div>
      </section>

      {/* Account */}
      <section style={settingsCard}>
        <h2 style={settingsCardTitle}>Account</h2>
        {user ? (
          <div style={{ display: 'grid', gap: 6 }}>
            {user.name ? <div style={{ fontSize: 14, color: '#2f2835', fontWeight: 600 }}>{user.name}</div> : null}
            {user.email ? <div style={settingsMuted}>{user.email}</div> : null}
            {user.created_at ? <div style={settingsMuted}>Joined {formatDate(user.created_at)}</div> : null}
          </div>
        ) : <div style={settingsMuted}>Not signed in.</div>}
        <button type="button" onClick={onLogout} style={settingsLogoutBtn}>Log out</button>
      </section>
    </div>
  );
}

function SettingsToggle({ checked, disabled, onChange }: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        flexShrink: 0,
        width: 44, height: 26, borderRadius: 999, border: 'none',
        background: checked ? '#1c1626' : '#d4cfd6',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.15s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s',
      }} />
    </button>
  );
}

const settingsPane: CSSProperties = { padding: 24, display: 'grid', gap: 16, maxWidth: 620 };
const settingsCard: CSSProperties = {
  background: '#fff', border: '1px solid #e4ded8', borderRadius: 3, padding: 20,
};
const settingsCardTitle: CSSProperties = { margin: '0 0 12px', fontSize: 13, fontWeight: 850, letterSpacing: 0.5, textTransform: 'uppercase', color: '#8b848f' };
const settingsMuted: CSSProperties = { fontSize: 13, color: '#6b6470', lineHeight: 1.5 };
const settingsRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 };
const settingsUpgradeBtn: CSSProperties = {
  display: 'inline-block', marginTop: 12, padding: '8px 16px', borderRadius: 3,
  background: '#2f2533', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
};
const settingsLogoutBtn: CSSProperties = {
  marginTop: 14, padding: '8px 16px', borderRadius: 3, border: '1px solid #ded8d1',
  background: '#fff', color: '#b91c1c', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

/* ──────────────────────────────────────────────────────────────────
   MarketplacePane — catalog of premade tests anyone can buy.
   ────────────────────────────────────────────────────────────────── */
function MarketplacePane({ tests, ownedTestIds, onBuy }: {
  tests: MarketplaceTest[] | null;
  ownedTestIds: Set<string>;
  onBuy: (test: MarketplaceTest) => void;
}) {
  if (tests === null) {
    return <div style={{ padding: 32, color: '#6b6470' }}>Loading marketplace…</div>;
  }
  if (tests.length === 0) {
    return (
      <div style={{ padding: 32, color: '#6b6470' }}>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 20 }}>Marketplace</h2>
        <p>No premade tests are available right now. Check back soon.</p>
      </div>
    );
  }
  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 22 }}>Marketplace</h2>
      <p style={{ margin: '0 0 24px', color: '#6b6470', fontSize: 14 }}>
        Premade tests by the Blim team. After purchase, a copy lands in your workspace and you can edit, publish, and collect responses just like your own tests.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {tests.map(t => (
          <article key={t.id} style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            padding: 18, borderRadius: 10, border: '1px solid #e4ded8', background: '#fff',
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#0f172a' }}>{t.title}</h3>
              <div style={{ color: '#6b6470', fontSize: 13, lineHeight: 1.4 }}>
                {t.summary || `${t.questionCount} ${t.questionCount === 1 ? 'question' : 'questions'}`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {t.price > 0 ? `${t.price.toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm` : 'Free'}
              </span>
              <button
                type="button"
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: '#0445b8', color: '#fff', fontWeight: 700, cursor: 'pointer',
                  opacity: ownedTestIds.has(t.id) ? 0.45 : 1,
                }}
                onClick={() => onBuy(t)}
                disabled={ownedTestIds.has(t.id)}
                title={ownedTestIds.has(t.id) ? 'You already own this test' : `Buy ${t.title}`}
              >
                {ownedTestIds.has(t.id) ? 'Owned' : 'Buy'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   MarketplaceBuyModal — payment-screenshot flow for marketplace
   purchases. Reuses POST /api/payment with kind=marketplace_test.
   ────────────────────────────────────────────────────────────────── */
function MarketplaceBuyModal({ test, workspaces, onClose, onSubmitted, getAccessToken }: {
  test: MarketplaceTest;
  workspaces: WorkspaceItem[];
  onClose: () => void;
  onSubmitted: () => void;
  getAccessToken: () => Promise<string | null>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  /* Buyer picks which workspace the purchased copy lands in. */
  const [targetWorkspace, setTargetWorkspace] = useState<string>('default');

  const submit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData();
    form.append('kind', 'marketplace_test');
    form.append('marketplaceTestId', test.id);
    if (targetWorkspace !== 'default') form.append('marketplaceWorkspaceId', targetWorkspace);
    form.append('plan', `marketplace:${test.id}`);
    form.append('amount', String(test.price));
    form.append('screenshot', file);
    const tok = await getAccessToken();
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      body: form,
    });
    setSubmitting(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Payment failed.');
      return;
    }
    setDone(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)', background: '#fff', borderRadius: 12,
          padding: 24, boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
        }}
      >
        {done ? (
          <>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Payment submitted</h3>
            <p style={{ margin: '0 0 16px', color: '#6b6470', fontSize: 14, lineHeight: 1.5 }}>
              We&apos;ve received your payment screenshot for <strong>{test.title}</strong>. Once approved, a copy will appear in your Tests tab.
            </p>
            <button type="button" onClick={onSubmitted} style={{
              padding: '10px 16px', borderRadius: 6, border: 'none',
              background: '#0445b8', color: '#fff', fontWeight: 700, cursor: 'pointer', width: '100%',
            }}>Done</button>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Buy: {test.title}</h3>
            <p style={{ margin: '0 0 16px', color: '#6b6470', fontSize: 13, lineHeight: 1.5 }}>
              Price: <strong>{test.price.toLocaleString('uz-UZ').replace(/,/g, ' ')} so&apos;m</strong>.
              Transfer the amount and upload your payment screenshot. We&apos;ll approve and copy the test into your workspace within a few hours.
            </p>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#0f172a' }}>
              <div><strong>Card:</strong> 8600 1234 5678 9012</div>
              <div><strong>Holder:</strong> BLIM LLC</div>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b6470', marginBottom: 4 }}>
              Add to workspace
            </label>
            <select
              value={targetWorkspace}
              onChange={e => setTargetWorkspace(e.target.value)}
              style={{
                width: '100%', marginBottom: 12, padding: '9px 10px', borderRadius: 3,
                border: '1px solid #d8d3cd', background: '#fff', fontSize: 14, color: '#0f172a',
              }}
            >
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              style={{ marginBottom: 12 }}
            />
            {error ? <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div> : null}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{
                padding: '10px 16px', borderRadius: 6, border: '1px solid #d8d3cd',
                background: '#fff', color: '#0f172a', fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button
                type="button"
                onClick={submit}
                disabled={!file || submitting}
                style={{
                  padding: '10px 16px', borderRadius: 6, border: 'none',
                  background: '#0445b8', color: '#fff', fontWeight: 700,
                  cursor: !file || submitting ? 'not-allowed' : 'pointer',
                  opacity: !file || submitting ? 0.5 : 1,
                }}
              >
                {submitting ? 'Submitting…' : 'Submit payment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
