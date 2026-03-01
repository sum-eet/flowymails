import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Btn from '../components/Btn.jsx';
import Card from '../components/Card.jsx';
import { IconMail, IconBag, IconCheck } from '../components/Icons.jsx';

const FONT_CSS = `
  @font-face { font-family: 'JustSans'; src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/JUST_Sans_Regular.woff2?v=1767008632') format('woff2'); font-display: swap; }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pop    { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
  * { box-sizing: border-box; }
`;

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Auth({ shopDomain: initialShopDomain, setShopDomain, onComplete }) {
  // If we landed here after Shopify OAuth (shopDomain set from URL), skip Shopify step
  const [shopConnected, setShopConnected] = useState(!!initialShopDomain);
  const [shopInput, setShopInput]         = useState(initialShopDomain || '');
  const [klaviyoKey, setKlaviyoKey]       = useState('');
  const [klaviyoState, setKlaviyoState]   = useState('idle'); // idle | loading | done
  const [done, setDone]                   = useState(false);
  const [errMsg, setErrMsg]               = useState('');

  const effectiveShop = initialShopDomain || shopInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

  const connectShopify = () => {
    const raw = shopInput.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!raw) return;
    // Normalise: strip any existing .myshopify.com suffix, then re-add it
    const handle = raw.replace(/\.myshopify\.com$/i, '');
    window.location.href = `${BASE}/auth/shopify?shop=${handle}.myshopify.com`;
  };

  const connectKlaviyo = async () => {
    setErrMsg('');
    setKlaviyoState('loading');
    try {
      await api.klaviyo.connect(effectiveShop, klaviyoKey.trim());
      setKlaviyoState('done');
      if (setShopDomain) setShopDomain(effectiveShop);
      setTimeout(() => setDone(true), 800);
    } catch (e) {
      setErrMsg(e.message || 'Invalid API key');
      setKlaviyoState('idle');
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JustSans', system-ui" }}>
        <style>{FONT_CSS}</style>
        <div style={{ textAlign: 'center', animation: 'pop 0.5s ease' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: ui.successBg, border: `2px solid ${ui.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <IconCheck size={28} color={ui.success} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ui.text, marginBottom: 6, letterSpacing: '-0.4px' }}>You're all set!</div>
          <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28 }}>Brand context and Klaviyo are connected.</div>
          <Btn variant="primary" size="lg" onClick={onComplete}>Open Mailo →</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'JustSans', system-ui" }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: ui.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMail size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: ui.text, letterSpacing: '-0.3px' }}>Mailo</span>
        </div>

        <div style={{ fontSize: 21, fontWeight: 700, color: ui.text, marginBottom: 3, textAlign: 'center', letterSpacing: '-0.4px' }}>Connect your accounts</div>
        <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 24, textAlign: 'center' }}>Two quick connections and you're ready to send</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Shopify card */}
          <Card style={{ opacity: shopConnected ? 1 : 1 }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: ui.r, background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconBag size={20} color={ui.text} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 2 }}>Shopify</div>
                <div style={{ fontSize: 12, color: ui.textSub }}>Sync products, orders and customer data</div>
                {!shopConnected && (
                  <input
                    value={shopInput}
                    onChange={e => setShopInput(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    style={{ marginTop: 8, width: '100%', border: `1px solid ${ui.border}`, borderRadius: ui.rSm, padding: '7px 10px', fontSize: 13, color: ui.text, background: ui.surface, outline: 'none', fontFamily: "'JustSans', system-ui" }}
                  />
                )}
              </div>
              {shopConnected
                ? <div style={{ fontSize: 12, color: ui.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><IconCheck size={14} color={ui.success} /> Connected</div>
                : <Btn variant="secondary" size="sm" onClick={connectShopify} disabled={!shopInput.trim()}>Connect</Btn>
              }
            </div>
          </Card>

          {/* Klaviyo card */}
          <Card style={{ opacity: !shopConnected ? 0.4 : 1, transition: 'opacity 0.3s' }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: ui.r, background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconMail size={20} color={ui.text} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 2 }}>Klaviyo</div>
                <div style={{ fontSize: 12, color: ui.textSub }}>Deploy flows and campaigns to your account</div>
                {shopConnected && klaviyoState !== 'done' && (
                  <input
                    value={klaviyoKey}
                    onChange={e => setKlaviyoKey(e.target.value)}
                    placeholder="pk_••••••••••••••••••••••••••••••••"
                    type="password"
                    style={{ marginTop: 8, width: '100%', border: `1px solid ${ui.border}`, borderRadius: ui.rSm, padding: '7px 10px', fontSize: 13, color: ui.text, background: ui.surface, outline: 'none', fontFamily: "'JustSans', system-ui" }}
                  />
                )}
                {errMsg && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 6 }}>{errMsg}</div>}
              </div>
              {klaviyoState === 'done'
                ? <div style={{ fontSize: 12, color: ui.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><IconCheck size={14} color={ui.success} /> Connected</div>
                : <Btn variant="secondary" size="sm" onClick={connectKlaviyo} loading={klaviyoState === 'loading'} disabled={!shopConnected || !klaviyoKey.trim()}>Connect</Btn>
              }
            </div>
          </Card>
        </div>

        <div style={{ fontSize: 11, color: ui.textMuted, textAlign: 'center', marginTop: 18 }}>
          Read-only Shopify · Write access to Klaviyo drafts only
        </div>
      </div>
    </div>
  );
}
