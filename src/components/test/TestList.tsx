'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authHeaders } from '@/lib/test/clientFetch';
import { navigateToTestHref } from '@/lib/test/paths';
import type { Test } from '@/lib/test/types';
import { TestLink } from './TestLink';
import { FormsIcon, ListViewIcon, GridViewIcon, ChevronDownIcon, SortIcon } from './testList/icons';
import { TemplateCard } from './testList/TemplateCard';
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
  ghostBtn,
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
  templateGrid,
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

const TEMPLATES = [
  'Create a quick quiz to check understanding after a lesson.',
  'Create a feedback test to collect opinions from students.',
];

export function TestList() {
  const { getAccessToken } = useAuth();
  const [tests, setTests] = useState<ListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showLimitBanner, setShowLimitBanner] = useState(true);
  const [hiddenTemplates, setHiddenTemplates] = useState<Set<number>>(() => new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('created');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([{ id: 'default', name: 'My workspace' }]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('default');
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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- setState happens inside async fetch, after await
  useEffect(() => { load(); }, [load]);

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
    if (activeWorkspaceId !== 'default') return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? tests.filter(t => (
      t.title.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    )) : tests;
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

  const saveWorkspaceRename = () => {
    const nextTitle = workspaceDraft.trim();
    if (nextTitle) {
      setWorkspaces(current => current.map(workspace => (
        workspace.id === activeWorkspaceId ? { ...workspace, name: nextTitle } : workspace
      )));
    }
    setIsRenamingWorkspace(false);
  };

  const openAddWorkspace = () => {
    setNewWorkspaceDraft('');
    setIsAddingWorkspace(true);
  };

  const saveNewWorkspace = () => {
    const name = newWorkspaceDraft.trim();
    if (!name) return;
    const workspace = { id: `local-${Date.now()}`, name };
    setWorkspaces(current => [...current, workspace]);
    setActiveWorkspaceId(workspace.id);
    setIsAddingWorkspace(false);
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
      body: JSON.stringify({ title }),
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
    setIsDeletingWorkspace(true);
  };

  if (error) return <div style={{ color: '#dc2626', padding: 24 }}>{error}</div>;
  if (tests === null) return <div style={{ color: '#94a3b8', padding: 24 }}>Loading…</div>;

  const publishedCount = tests.filter(t => t.is_published).length;
  const draftCount = tests.length - publishedCount;
  const renderedTests = visibleTests ?? [];
  const activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId) ?? workspaces[0];
  const workspaceName = activeWorkspace?.name ?? 'My workspace';

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
              setIsDeletingWorkspace(false);
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
              Workspace deletion is not available yet. This default workspace contains {tests.length} {tests.length === 1 ? 'test' : 'tests'}.
            </p>
            <div style={renameModalActions}>
              <button type="button" style={renameModalCancel} onClick={() => setIsDeletingWorkspace(false)}>Cancel</button>
              <button type="submit" style={deleteModalButton}>Delete</button>
            </div>
          </form>
        </div>
      ) : null}
      {showLimitBanner ? (
        <section style={limitBanner}>
          <span style={diamondIcon}>◇</span>
          <span>You can publish 3 tests for free.</span>
          <strong>{publishedCount} / 3 used</strong>
          <a href="https://blim.uz/uz/payment" style={upgradeBtn}>Upgrade</a>
          <button type="button" aria-label="Dismiss banner" onClick={() => setShowLimitBanner(false)} style={dismissBtn}>×</button>
        </section>
      ) : null}

      <nav style={tabsBar} aria-label="Test workspace sections">
        <span style={activeTab}><FormsIcon /> Tests</span>
        <span style={inactiveTab}>◎ Responses</span>
        <span style={inactiveTab}>⚙ Settings</span>
      </nav>

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
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => setActiveWorkspaceId(workspace.id)}
                  style={workspace.id === activeWorkspaceId ? workspaceItem : workspaceItemMuted}
                >
                  <span>{workspace.name}</span>
                  <span>{workspace.id === 'default' ? tests.length : 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={quotaBox}>
            <div style={{ marginBottom: 8 }}>Published tests</div>
            <div style={quotaTrack}><div style={{ ...quotaFill, width: `${Math.min(100, (publishedCount / 3) * 100)}%` }} /></div>
            <div style={{ color: '#6b6470', marginTop: 6 }}>{publishedCount} / 3</div>
            <a href="https://blim.uz/uz/payment" style={quotaLink}>Increase limit</a>
          </div>
        </aside>

        <main style={mainPane}>
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
                  ···
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
              <span style={ghostBtn}>Invite later</span>
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

          <section style={templateGrid}>
            {TEMPLATES.map((text, index) => hiddenTemplates.has(index) ? null : (
              <TemplateCard
                key={text}
                text={text}
                onDismiss={() => setHiddenTemplates(prev => new Set(prev).add(index))}
                onUse={openCreateTest}
              />
            ))}
          </section>

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
                <span style={{ gridColumn: '1 / 3' }}>Tests</span>
                <span>Responses</span>
                <span>Status</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
              <ul style={testRows}>
                {renderedTests.map(t => (
                  <li
                    key={t.id}
                    style={testRow}
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
                    <div style={testIcon}>{t.title.slice(0, 1).toUpperCase() || 'T'}</div>
                    <div style={{ minWidth: 0 }}>
                      <TestLink href={`/dashboard/${t.id}/edit`} style={testTitle}>
                        {t.title}
                      </TestLink>
                      <div style={testSub}>
                        {t.is_published ? `Share: /t/${t.slug}` : 'Draft test'}
                      </div>
                    </div>
                    <div style={mutedCell}>-</div>
                    <div>
                      <span style={t.is_published ? publishedPill : draftPill}>
                        {t.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div style={mutedCell}>{formatDate(t.updated_at || t.created_at)}</div>
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
                        ···
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
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
