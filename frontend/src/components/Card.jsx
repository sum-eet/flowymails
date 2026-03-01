import React from 'react';
import { ui } from '../lib/tokens.js';

export default function Card({ children, style }) {
  return (
    <div style={{
      background: ui.surface,
      border: `1px solid ${ui.border}`,
      borderRadius: ui.r,
      overflow: 'hidden',
      boxShadow: ui.shadow,
      ...style,
    }}>
      {children}
    </div>
  );
}
