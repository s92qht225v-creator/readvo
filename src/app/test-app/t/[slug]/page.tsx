'use client';

import { use, useEffect, useState } from 'react';
import { TestPlayer } from '@/components/test/TestPlayer';
import { navigateToTestHref } from '@/lib/test/paths';
import type { PublicTest } from '@/lib/test/types';

type PreviewDevice = 'desktop' | 'mobile';

function shouldShowPreviewTools() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  const isLocalPreviewHost = host === 'localhost' || host === '127.0.0.1' || host === 'test.localhost';
  const isExplicitPreview = new URLSearchParams(window.location.search).get('preview') === '1';
  return isLocalPreviewHost || isExplicitPreview;
}

function goBackToBuilder(testId: string) {
  navigateToTestHref(`/dashboard/${testId}/edit`, true);
}

export default function PublicTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [test, setTest] = useState<PublicTest | null | 'not_found'>(null);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [showPreviewTools] = useState(shouldShowPreviewTools);

  useEffect(() => {
    fetch(`/api/t/${slug}`)
      .then(async r => {
        if (r.status === 404) { setTest('not_found'); return; }
        if (!r.ok) { setTest('not_found'); return; }
        const j = await r.json();
        setTest(j.test);
      })
      .catch(err => {
        console.error('[PublicTestPage] fetch error:', err);
        setTest('not_found');
      });
  }, [slug]);

  if (test === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading…</div>;
  }
  if (test === 'not_found') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Test not found</h1>
          <p style={{ color: '#475569' }}>This test doesn&apos;t exist or hasn&apos;t been published.</p>
        </div>
      </div>
    );
  }

  if (!showPreviewTools) {
    return <TestPlayer test={test} />;
  }

  return (
    <div className={`test-preview-shell test-preview-shell--${device}`}>
      <div className="test-preview-toolbar" aria-label="Preview device">
        <button
          type="button"
          onClick={() => goBackToBuilder(test.id)}
          className="test-preview-toolbar__icon-btn"
          aria-label="Exit preview"
          title="Exit preview"
        >
          ×
        </button>
        <span className="test-preview-toolbar__sep" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setDevice('desktop')}
          className={`test-preview-toolbar__icon-btn ${device === 'desktop' ? 'test-preview-toolbar__icon-btn--active' : ''}`}
          aria-pressed={device === 'desktop'}
          aria-label="Desktop preview"
          title="Desktop preview"
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="1.75" y="3" width="14.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.25 15h5.5M9 12.5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setDevice('mobile')}
          className={`test-preview-toolbar__icon-btn ${device === 'mobile' ? 'test-preview-toolbar__icon-btn--active' : ''}`}
          aria-pressed={device === 'mobile'}
          aria-label="Mobile preview"
          title="Mobile preview"
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="5" y="1.75" width="8" height="14.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="9" cy="13.75" r="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>
      <div className="test-preview-frame">
        <TestPlayer test={test} forceDevice={device} />
      </div>
    </div>
  );
}
