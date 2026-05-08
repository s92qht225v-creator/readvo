import { TestLink } from '@/components/test/TestLink';

export default function TestLandingPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
        Build a quiz in minutes.
      </h1>
      <p style={{ fontSize: 18, color: '#475569', marginBottom: 32 }}>
        Create one-question-at-a-time tests for your students. Share a link.
        See answers come in.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <TestLink
          href="/login"
          style={{
            display: 'inline-block', padding: '12px 22px',
            background: '#0f172a', color: '#fff', borderRadius: 10,
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          Sign in
        </TestLink>
        <TestLink
          href="/dashboard"
          style={{
            display: 'inline-block', padding: '12px 22px',
            background: '#fff', color: '#0f172a', borderRadius: 10,
            border: '1px solid #cbd5e1',
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          Open dashboard
        </TestLink>
      </div>
    </main>
  );
}
