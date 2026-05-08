'use client';

import { templateCard, useTemplateBtn, templateClose } from './styles';

export function TemplateCard({ text, onDismiss, onUse }: { text: string; onDismiss: () => void; onUse: () => void }) {
  return (
    <article style={templateCard}>
      <span style={{ color: '#8b5cf6', fontSize: 20 }}>✦</span>
      <div style={{ flex: 1, color: '#4f4655', fontSize: 14, lineHeight: 1.35 }}>{text}</div>
      <button type="button" style={useTemplateBtn} onClick={onUse}>Use this</button>
      <button type="button" aria-label="Dismiss suggestion" onClick={onDismiss} style={templateClose}>×</button>
    </article>
  );
}
