import React from 'react';
import { ui } from '../lib/tokens.js';

export default function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#F4F4F5', color: '#52525B' },
    success: { bg: ui.successBg, color: ui.success },
    warning: { bg: '#FFFBEB', color: '#92400E' },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: ui.rFull,
      fontSize: 11, fontWeight: 500,
      background: s.bg, color: s.color,
      fontFamily: "'JustSans', system-ui",
    }}>
      {children}
    </span>
  );
}
