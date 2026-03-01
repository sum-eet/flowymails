import React from 'react';
import { ui } from '../lib/tokens.js';

export default function Steps({ labels, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
      {labels.map((l, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                background: done ? ui.success : active ? ui.cta : ui.border,
                color: done || active ? '#fff' : ui.textMuted,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? ui.text : ui.textMuted,
                whiteSpace: 'nowrap',
                fontFamily: "'JustSans', system-ui",
              }}>
                {l}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 1, background: ui.border, margin: '0 10px' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
