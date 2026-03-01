import React, { useState } from 'react';
import { ui } from '../lib/tokens.js';

export default function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, fullWidth, loading }) {
  const [hov, setHov] = useState(false);

  const vs = {
    primary:   { bg: hov ? ui.ctaHover : ui.cta, color: '#fff',    border: 'none',                      shadow: '0 1px 2px rgba(0,0,0,0.25)' },
    secondary: { bg: hov ? ui.surfaceHover : ui.surface, color: ui.text, border: `1px solid ${ui.border}`, shadow: ui.shadow },
    ghost:     { bg: hov ? ui.bg : 'transparent',        color: ui.text, border: 'none',                    shadow: 'none' },
  };
  const sz = {
    sm: { p: '6px 12px', fs: 12 },
    md: { p: '9px 16px', fs: 13 },
    lg: { p: '12px 22px', fs: 14 },
  };

  const s = vs[variant] || vs.primary;
  const z = sz[size]    || sz.md;

  return (
    <button
      onClick={!disabled && !loading ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: z.p, fontSize: z.fs, fontWeight: 600,
        fontFamily: "'JustSans', 'DM Sans', system-ui, sans-serif",
        background: s.bg, color: s.color,
        border: s.border || 'none',
        borderRadius: ui.rSm,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        width: fullWidth ? '100%' : undefined,
        boxShadow: s.shadow,
        transition: 'background 0.12s',
        letterSpacing: '-0.01em',
      }}
    >
      {loading
        ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${s.color}40`, borderTopColor: s.color, animation: 'spin 0.7s linear infinite' }} />
        : children}
    </button>
  );
}
