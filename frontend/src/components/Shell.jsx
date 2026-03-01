import React from 'react';
import { ui } from '../lib/tokens.js';
import { IconMail } from './Icons.jsx';

const FONT_CSS = `
  @font-face {
    font-family: 'Anatoleum';
    src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Anatoleum.woff2') format('woff2');
    font-weight: normal; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: 'JustSans';
    src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/JUST_Sans_Regular.woff2?v=1767008632') format('woff2');
    font-weight: normal; font-style: normal; font-display: swap;
  }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeIn   { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeUp   { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pop      { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes pulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
  @keyframes slideIn  { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  * { box-sizing: border-box; }
`;

const NAV = [
  { id: 'dashboard', label: 'Audit'     },
  { id: 'flows',     label: 'Flows'     },
  { id: 'campaigns', label: 'Campaigns' },
];

// No position:fixed or 100vh — must stay embeddable for future App Store iframe
export default function Shell({ children, screen, navigate, shopDomain }) {
  const active = screen;
  return (
    <div style={{ fontFamily: ui.font, background: ui.bg, minHeight: '100%' }}>
      <style>{FONT_CSS}</style>

      {/* Top nav */}
      <div style={{
        height: 52, background: ui.surface, borderBottom: `1px solid ${ui.border}`,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: ui.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMail size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: ui.text, letterSpacing: '-0.3px' }}>Mailo</span>
        </div>

        <div style={{ width: 1, height: 20, background: ui.border }} />

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              style={{
                background: active === n.id ? ui.bg : 'transparent',
                border: 'none',
                color: active === n.id ? ui.text : ui.textSub,
                padding: '5px 12px', borderRadius: ui.rSm,
                fontSize: 13, fontWeight: active === n.id ? 600 : 400,
                cursor: 'pointer', fontFamily: "'JustSans', system-ui",
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Store indicator */}
        {shopDomain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: ui.textSub }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ui.success }} />
            {shopDomain}
          </div>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px', animation: 'fadeIn 0.22s ease' }}>
        {children}
      </div>
    </div>
  );
}
