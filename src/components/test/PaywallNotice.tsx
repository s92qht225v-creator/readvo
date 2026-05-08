export function PaywallNotice({ limit }: { limit: number }) {
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #fcd34d',
      borderRadius: 10, padding: 16, color: '#78350f',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Free limit reached</div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>
        You can publish up to {limit} tests on the free plan. Upgrade to publish more.
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
