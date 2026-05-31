export function PaywallNotice({ limit, message }: { limit: number; message?: string }) {
  const noun = limit === 1 ? 'test' : 'tests';
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #fcd34d',
      borderRadius: 10, padding: 16, color: '#78350f',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{message ? 'Pro feature' : 'Free limit reached'}</div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>
        {message ?? (
          <>
            Free accounts can publish {limit} {noun} at a time. Unpublish the current
            one to publish a different draft, or upgrade for unlimited published tests.
          </>
        )}
      </div>
      <a
        href="https://blim.uz/uz/payment"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block', padding: '8px 14px',
          background: '#dc2626', color: '#fff',
          borderRadius: 8, textDecoration: 'none', fontWeight: 600,
          fontSize: 13,
        }}
      >
        Upgrade
      </a>
    </div>
  );
}
