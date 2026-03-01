import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Btn from '../components/Btn.jsx';
import Card from '../components/Card.jsx';
import { IconCheck } from '../components/Icons.jsx';

// Dr. Water default segment — hardcoded for first customer
const DEFAULT_SEGMENT = 'TavdPF'; // All Email-Deliverable

const THEMES = [
  { id: 'product_spotlight', name: 'Product Spotlight', desc: 'Hero image, product name, single CTA. Best for featuring a specific product.' },
  { id: 'promotion',         name: 'Promotion',         desc: 'Discount-led with offer code and urgency copy. Best for sales and flash events.' },
  { id: 'education',         name: 'Educational',       desc: 'Tips format, value-first, soft product mention. Best for building trust.' },
  { id: 'seasonal',          name: 'Seasonal',          desc: 'Seasonal hook with product tie-in. Best for holidays and timely moments.' },
];

export default function Campaigns({ navigate, shopDomain }) {
  const [theme,      setTheme]      = useState(null);
  const [offer,      setOffer]      = useState('');
  const [product,    setProduct]    = useState('');
  const [sendDate,   setSendDate]   = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduled,  setScheduled]  = useState(false);
  const [errMsg,     setErrMsg]     = useState('');

  const handleSchedule = async () => {
    if (!theme) return setErrMsg('Please select a theme');
    if (!sendDate) return setErrMsg('Please pick a send date');

    setScheduling(true);
    setErrMsg('');
    try {
      await api.campaigns.schedule({
        shopDomain,
        theme,
        offer:     offer.trim(),
        product:   product.trim(),
        segmentId: DEFAULT_SEGMENT,
        sendDate,
      });
      setScheduled(true);
    } catch (e) {
      setErrMsg(e.message || 'Failed to schedule campaign');
    } finally {
      setScheduling(false);
    }
  };

  const reset = () => {
    setTheme(null); setOffer(''); setProduct('');
    setSendDate(''); setScheduled(false); setErrMsg('');
  };

  if (scheduled) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480, textAlign: 'center', fontFamily: "'JustSans', system-ui" }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: ui.successBg, border: `2px solid ${ui.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <IconCheck size={32} color={ui.success} />
        </div>
        <div style={{ fontFamily: "'Anatoleum', Georgia, serif", fontSize: 24, color: ui.text, marginBottom: 6 }}>Campaign scheduled</div>
        <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28 }}>
          {THEMES.find(t => t.id === theme)?.name} sends {sendDate} at 10:00 AM
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={reset}>Plan another</Btn>
          <Btn variant="primary"   onClick={() => navigate('dashboard')}>Back to audit</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'JustSans', system-ui" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: '-0.4px' }}>Campaign Planner</h1>
        <p style={{ fontSize: 13, color: ui.textSub, margin: '2px 0 0' }}>Schedule a branded campaign in minutes</p>
      </div>

      {errMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: ui.rSm, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>
          {errMsg}
        </div>
      )}

      {/* Theme picker */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Campaign theme</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {THEMES.map(t => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  border: `2px solid ${theme === t.id ? ui.cta : ui.border}`,
                  borderRadius: ui.r, padding: 14, cursor: 'pointer',
                  background: theme === t.id ? ui.bg : ui.surface,
                  transition: 'border-color 0.1s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, color: ui.text }}>{t.name}</div>
                <div style={{ fontSize: 11, color: ui.textSub, lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Details</div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: ui.textSub, marginBottom: 5 }}>
              Product to feature <span style={{ color: ui.textMuted, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder="e.g. HydroPitcher Pro"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px', fontSize: 13, borderRadius: ui.rSm,
                border: `1.5px solid ${ui.border}`, fontFamily: "'JustSans', system-ui",
                color: ui.text, background: ui.surface, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: ui.textSub, marginBottom: 5 }}>
              Offer <span style={{ color: ui.textMuted, fontWeight: 400 }}>(optional — e.g. "10% off sitewide")</span>
            </label>
            <input
              type="text"
              value={offer}
              onChange={e => setOffer(e.target.value)}
              placeholder="e.g. 10% off sitewide"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px', fontSize: 13, borderRadius: ui.rSm,
                border: `1.5px solid ${ui.border}`, fontFamily: "'JustSans', system-ui",
                color: ui.text, background: ui.surface, outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: ui.textSub, marginBottom: 5 }}>
              Send date
            </label>
            <input
              type="date"
              value={sendDate}
              onChange={e => setSendDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                padding: '9px 12px', fontSize: 13, borderRadius: ui.rSm,
                border: `1.5px solid ${ui.border}`, fontFamily: "'JustSans', system-ui",
                color: ui.text, background: ui.surface, outline: 'none',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Summary + send */}
      {theme && sendDate && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Summary</div>
            {[
              ['Theme',    THEMES.find(t => t.id === theme)?.name],
              ['Product',  product || '—'],
              ['Offer',    offer   || '—'],
              ['Send date', sendDate + ' · 10:00 AM'],
              ['Audience', 'All Email-Deliverable'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${ui.borderSubdued}`, fontSize: 12 }}>
                <span style={{ color: ui.textSub }}>{k}</span>
                <span style={{ fontWeight: 500, color: ui.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" onClick={() => navigate('dashboard')}>← Back</Btn>
        <Btn
          variant="primary"
          fullWidth
          loading={scheduling}
          disabled={!theme || !sendDate}
          onClick={handleSchedule}
        >
          Schedule campaign
        </Btn>
      </div>
    </div>
  );
}
