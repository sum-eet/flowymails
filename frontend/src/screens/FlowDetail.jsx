import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Btn from '../components/Btn.jsx';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import Steps from '../components/Steps.jsx';
import { IconMail, IconMessage, IconCheck } from '../components/Icons.jsx';

const SEQUENCE = [
  { type: 'email', delay: '1 hr after trigger',  label: 'First touch',   options: ['Gentle reminder', 'Cart summary + CTA', 'Social proof'], sel: 1 },
  { type: 'sms',   delay: '3 hrs after trigger',  label: 'Quick nudge',   options: ['Short & direct', 'Friendly tone'], sel: 0 },
  { type: 'email', delay: '24 hrs after trigger', label: 'Build value',   options: ['Product features', 'Customer reviews', '5% discount'], sel: 1 },
  { type: 'sms',   delay: '48 hrs after trigger', label: 'Urgency push',  options: ['Scarcity angle', '10% off offer'], sel: 1 },
  { type: 'email', delay: '72 hrs after trigger', label: 'Final offer',   options: ['10% discount', 'Free shipping', 'Bundle deal'], sel: 0 },
];

const THEMES = [
  { id: 'minimal', name: 'Clean & Minimal', desc: 'White bg, strong type, one CTA' },
  { id: 'dark',    name: 'Bold Dark',       desc: 'Dark bg, high contrast, premium' },
  { id: 'warm',    name: 'Warm & Branded',  desc: 'Brand colours, soft lifestyle feel' },
];

export default function FlowDetail({ flow, navigate, shopDomain, brand }) {
  const [seq, setSeq]         = useState(SEQUENCE);
  const [theme, setTheme]     = useState(null);
  const [step, setStep]       = useState(0);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed]   = useState(false);
  const [errMsg, setErrMsg]   = useState('');

  const isAlreadyLive = flow?.dbFlow?.status === 'live';

  const pickOpt = (si, oi) => setSeq(p => p.map((s, i) => i === si ? { ...s, sel: oi } : s));

  const handleGoLive = async () => {
    if (isAlreadyLive) { navigate('flows'); return; }
    setDeploying(true);
    setErrMsg('');
    try {
      await api.flows.deploy(shopDomain, flow?.id || 'abandoned_cart', {
        theme,
        variables: { coupon: 'DRWATER10' },
      });
      setDeploying(false);
      setDeployed(true);
    } catch (e) {
      setDeploying(false);
      setErrMsg(e.message || 'Deployment failed');
    }
  };

  if (deployed) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480, textAlign: 'center', animation: 'fadeIn 0.3s ease', fontFamily: "'JustSans', system-ui" }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: ui.successBg, border: `2px solid ${ui.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'pop 0.5s ease' }}>
        <IconCheck size={32} color={ui.success} />
      </div>
      <div style={{ fontFamily: "'Anatoleum', Georgia, serif", fontSize: 26, color: ui.text, marginBottom: 6, letterSpacing: '-0.3px' }}>{flow?.name || 'Abandoned Cart'} is live</div>
      <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28, maxWidth: 360 }}>
        Your flow is running and synced with Klaviyo. First recoveries typically show within 24 hours.
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
        <Btn variant="secondary" onClick={() => navigate('flows')}>Back to flows</Btn>
        <Btn variant="primary"   onClick={() => navigate('dashboard')}>View dashboard</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, width: '100%', maxWidth: 480 }}>
        {[['Expected opens', '~320/mo'], ['Expected revenue', '~$960/mo'], ['First recovery', '~1–2 days']].map(([k, v]) => (
          <Card key={k} style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: ui.textSub, marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: ui.text }}>{v}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (deploying) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480, textAlign: 'center', fontFamily: "'JustSans', system-ui" }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
      <div style={{ fontFamily: "'Anatoleum', Georgia, serif", fontSize: 18, color: ui.text, marginBottom: 6 }}>Deploying to Klaviyo…</div>
      <div style={{ fontSize: 13, color: ui.textMuted, animation: 'pulse 1.5s ease infinite' }}>Creating flow · applying brand templates · setting triggers</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'JustSans', system-ui" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('flows')}>← Flows</Btn>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: '-0.3px' }}>{flow?.name || 'Abandoned Cart'}</h1>
          <p style={{ fontSize: 12, color: ui.textSub, margin: '2px 0 0' }}>{flow?.desc}</p>
        </div>
        {isAlreadyLive && <Badge tone="success">Live</Badge>}
      </div>

      <Steps labels={['Configure', 'Theme', 'Preview & launch']} current={step} />

      {errMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: ui.rSm, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>
          {errMsg}
        </div>
      )}

      {/* Step 0 — Sequence */}
      {step === 0 && (
        <>
          <Card>
            <div style={{ padding: '13px 16px', borderBottom: `1px solid ${ui.borderSubdued}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sequence — {seq.length} steps</div>
            </div>
            <div style={{ padding: '0 16px' }}>
              {seq.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', gap: 12, padding: '13px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 30, flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.type === 'email'
                          ? <IconMail size={12} color={ui.text} />
                          : <IconMessage size={12} color={ui.text} />
                        }
                      </div>
                      {i < seq.length - 1 && <div style={{ width: 1, flex: 1, background: ui.borderSubdued, minHeight: 10, margin: '4px 0' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 7 }}>
                        <Badge>{s.type === 'email' ? 'Email' : 'SMS'}</Badge>
                        <span style={{ fontSize: 11, color: ui.textSub }}>{s.delay}</span>
                        <span style={{ fontSize: 11, color: ui.text, fontWeight: 500 }}>· {s.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {s.options.map((o, j) => (
                          <button
                            key={j}
                            onClick={() => pickOpt(i, j)}
                            style={{
                              padding: '4px 11px', borderRadius: ui.rFull, fontSize: 12, fontWeight: 500,
                              cursor: 'pointer', fontFamily: "'JustSans', system-ui",
                              border: `1.5px solid ${s.sel === j ? ui.cta : ui.border}`,
                              background: s.sel === j ? ui.cta : ui.surface,
                              color: s.sel === j ? '#fff' : ui.textSub,
                            }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < seq.length - 1 && <div style={{ height: 1, background: ui.borderSubdued }} />}
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Btn variant="primary" onClick={() => setStep(1)}>Next: Choose theme →</Btn>
          </div>
        </>
      )}

      {/* Step 1 — Theme */}
      {step === 1 && (
        <>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Visual style</div>
              <div style={{ fontSize: 12, color: ui.textSub, marginBottom: 14 }}>All options use your brand fonts and colours automatically</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {THEMES.map(th => (
                  <div
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    style={{ border: `2px solid ${theme === th.id ? ui.cta : ui.border}`, borderRadius: ui.r, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.12s' }}
                  >
                    <div style={{ height: 72, background: th.id === 'dark' ? '#142B77' : th.id === 'warm' ? '#F0F4FF' : '#fff', padding: 10, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                      {[[5, '55%'], [9, '80%'], [5, '65%']].map(([h, w], idx) => (
                        <div key={idx} style={{ height: h, borderRadius: 3, width: w, background: th.id === 'dark' ? `rgba(255,255,255,${idx === 1 ? 0.85 : 0.2})` : idx === 1 ? '#142B77' : ui.border }} />
                      ))}
                      <div style={{ height: 15, borderRadius: 4, background: '#142B77', width: '42%', marginTop: 2 }} />
                    </div>
                    <div style={{ padding: '8px 10px', borderTop: `1px solid ${ui.borderSubdued}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: ui.text }}>{th.name}</div>
                      <div style={{ fontSize: 11, color: ui.textSub }}>{th.desc}</div>
                      {theme === th.id && <div style={{ fontSize: 11, color: ui.success, fontWeight: 600, marginTop: 3 }}>Selected</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setStep(0)}>← Back</Btn>
            <Btn variant="primary" disabled={!theme} onClick={() => theme && setStep(2)}>Preview all messages →</Btn>
          </div>
        </>
      )}

      {/* Step 2 — Preview & launch */}
      {step === 2 && (
        <>
          <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 14 }}>
            {seq.filter(s => s.type === 'email').length} emails and {seq.filter(s => s.type === 'sms').length} SMS messages — all branded with your store's fonts and colours
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
            {seq.map((s, i) => (
              <Card key={i}>
                <div style={{ padding: '11px 16px', borderBottom: `1px solid ${ui.borderSubdued}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.type === 'email'
                    ? <IconMail size={14} color={ui.text} />
                    : <IconMessage size={14} color={ui.text} />
                  }
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Step {i + 1} — {s.type === 'email' ? 'Email' : 'SMS'}</span>
                  <span style={{ fontSize: 12, color: ui.textSub }}>· {s.delay}</span>
                  <Badge>{s.options[s.sel]}</Badge>
                </div>
                <div style={{ padding: 16 }}>
                  {s.type === 'email' ? (
                    <div style={{ fontSize: 12, color: ui.textSub, fontStyle: 'italic' }}>
                      Email preview will render with {shopDomain}'s brand colours and fonts after deploy.
                    </div>
                  ) : (
                    <div style={{ background: '#1C1C1E', borderRadius: 14, padding: 14, maxWidth: 300 }}>
                      <div style={{ background: '#3A3A3C', borderRadius: '14px 14px 14px 4px', padding: '9px 12px', fontSize: 12, color: '#fff', lineHeight: 1.5, fontFamily: "'JustSans', system-ui" }}>
                        Hey — still have items in your cart? Pick up where you left off.
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Ready to go live</div>
                <div style={{ fontSize: 12, color: ui.textSub }}>
                  {seq.length} steps · {THEMES.find(t => t.id === theme)?.name} · Avg {flow?.rev || '$1,200/mo'} recovery
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="secondary" onClick={() => setStep(1)}>← Edit theme</Btn>
                <Btn variant="primary" size="lg" onClick={handleGoLive}>
                  {isAlreadyLive ? 'Already live — view in Klaviyo' : 'Go live'}
                </Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
