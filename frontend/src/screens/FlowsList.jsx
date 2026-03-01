import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';
import Btn from '../components/Btn.jsx';
import {
  IconCart, IconCreditCard, IconWave, IconRefresh,
  IconBox, IconEye, IconBell, IconTag, IconMessage, IconMail,
} from '../components/Icons.jsx';

const ICONS = {
  abandoned_cart:      IconCart,
  checkout_abandonment:IconCreditCard,
  welcome_series:      IconWave,
  winback:             IconRefresh,
  post_purchase:       IconBox,
  browse_abandonment:  IconEye,
  back_in_stock:       IconBell,
  sms_welcome:         IconMessage,
  vip:                 IconMail,
  price_drop:          IconTag,
};

export default function FlowsList({ navigate, shopDomain }) {
  const [flows,   setFlows]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState('');

  useEffect(() => {
    if (!shopDomain) return;
    api.flows.list(shopDomain)
      .then(data => { setFlows(data || []); setLoading(false); })
      .catch(e  => { setErrMsg(e.message); setLoading(false); });
  }, [shopDomain]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, fontFamily: "'JustSans', system-ui" }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'JustSans', system-ui" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: '-0.4px' }}>Flows</h1>
          <p style={{ fontSize: 13, color: ui.textSub, margin: '2px 0 0' }}>Mailo-deployed automated sequences</p>
        </div>
        <Btn variant="primary" size="sm" onClick={() => navigate('dashboard')}>+ Deploy from audit</Btn>
      </div>

      {errMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: ui.rSm, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>
          {errMsg}
        </div>
      )}

      {flows.length === 0 && !loading && !errMsg && (
        <Card>
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 6 }}>No flows deployed yet</div>
            <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 20 }}>
              Go to the audit to see which flows are missing and deploy them in one click.
            </div>
            <Btn variant="primary" onClick={() => navigate('dashboard')}>Go to audit</Btn>
          </div>
        </Card>
      )}

      {flows.length > 0 && (
        <Card>
          {flows.map((flow, i) => {
            const FlowIcon = ICONS[flow.flow_type] || IconMail;
            return (
              <div key={flow.id}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FlowIcon size={15} color={ui.text} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ui.text }}>{flow.name || flow.flow_type}</div>
                    <div style={{ fontSize: 11, color: ui.textSub }}>
                      {flow.estimated_monthly_revenue && `${flow.estimated_monthly_revenue}/mo · `}
                      Deployed {flow.deployed_at ? new Date(flow.deployed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Badge tone={flow.status === 'live' ? 'success' : 'neutral'}>
                      {flow.status === 'live' ? 'Live' : flow.status}
                    </Badge>
                    {flow.klaviyo_flow_id && (
                      <a
                        href={`https://www.klaviyo.com/flow/${flow.klaviyo_flow_id}/analytics`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: ui.textSub, textDecoration: 'none', borderBottom: `1px solid ${ui.border}` }}
                      >
                        View in Klaviyo
                      </a>
                    )}
                  </div>
                </div>
                {i < flows.length - 1 && <div style={{ height: 1, background: ui.borderSubdued }} />}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
