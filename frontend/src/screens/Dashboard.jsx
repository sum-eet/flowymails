import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Btn from '../components/Btn.jsx';
import Card from '../components/Card.jsx';
import Badge from '../components/Badge.jsx';

// Revenue from missing flows shown as the opportunity total
function sumMissing(flows) {
  return flows
    .filter(f => f.status === 'missing')
    .reduce((sum, f) => {
      const n = parseInt((f.estimated_monthly_revenue || '$0').replace(/\D/g, ''), 10);
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
}

export default function Dashboard({ navigate, shopDomain }) {
  const [flows,      setFlows]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errMsg,     setErrMsg]     = useState('');
  const [deploying,  setDeploying]  = useState(null); // flow_type being deployed
  const [deployErr,  setDeployErr]  = useState('');

  const loadAudit = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrMsg('');
    try {
      const data = await api.audit.get(shopDomain);
      setFlows(data.flows || []);
    } catch (e) {
      setErrMsg(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!shopDomain) return;
    loadAudit();
  }, [shopDomain]);

  const handleDeploy = async (flowType) => {
    setDeploying(flowType);
    setDeployErr('');
    try {
      await api.flows.deploy(shopDomain, flowType);
      await loadAudit(true);
    } catch (e) {
      setDeployErr(e.message || 'Deploy failed');
    } finally {
      setDeploying(null);
    }
  };

  const missingRev = sumMissing(flows);
  const liveCount  = flows.filter(f => f.status === 'live').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, fontFamily: "'JustSans', system-ui" }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
        <div style={{ fontSize: 13, color: ui.textSub }}>Reading your Klaviyo account...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'JustSans', system-ui" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: '-0.4px' }}>Flow Audit</h1>
          <p style={{ fontSize: 13, color: ui.textSub, margin: '2px 0 0' }}>
            {liveCount} of {flows.length} flows live
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" loading={refreshing} onClick={() => loadAudit(true)}>Refresh</Btn>
          <Btn variant="secondary" size="sm" onClick={() => navigate('campaigns')}>Plan campaign</Btn>
        </div>
      </div>

      {errMsg && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: ui.rSm, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>
          {errMsg}
        </div>
      )}

      {/* Missing revenue banner */}
      {missingRev > 0 && (
        <Card style={{ marginBottom: 16, borderLeft: `3px solid #EF4444` }}>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 2 }}>
              ~${missingRev.toLocaleString()}/mo in automated revenue not running
            </div>
            <div style={{ fontSize: 12, color: ui.textSub }}>
              Deploy the flows below to start recovering it — each takes under 60 seconds.
            </div>
          </div>
        </Card>
      )}

      {deployErr && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: ui.rSm, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#B91C1C' }}>
          {deployErr}
        </div>
      )}

      {/* 10 flow rows */}
      <Card>
        {flows.map((flow, i) => {
          const isLive    = flow.status === 'live';
          const isLoading = deploying === flow.flow_type;

          return (
            <div key={flow.flow_type}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Status indicator */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: isLive ? ui.success : '#EF4444',
                }} />

                {/* Flow info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ui.text, marginBottom: 1 }}>{flow.name}</div>
                  <div style={{ fontSize: 11, color: ui.textSub }}>{flow.estimated_monthly_revenue}/mo estimated</div>
                </div>

                {/* Status + action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {isLive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge tone="success">Live</Badge>
                      {flow.klaviyo_flow_id && (
                        <a
                          href={`https://www.klaviyo.com/flow/${flow.klaviyo_flow_id}/edit`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: ui.textSub, textDecoration: 'none', borderBottom: `1px solid ${ui.border}` }}
                        >
                          Klaviyo ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    <Btn
                      variant="primary"
                      size="sm"
                      loading={isLoading}
                      onClick={() => handleDeploy(flow.flow_type)}
                    >
                      Deploy
                    </Btn>
                  )}
                </div>
              </div>
              {i < flows.length - 1 && (
                <div style={{ height: 1, background: ui.borderSubdued }} />
              )}
            </div>
          );
        })}
      </Card>

      {flows.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: ui.textSub, fontSize: 13 }}>
          No flows data — make sure Klaviyo is connected.
        </div>
      )}
    </div>
  );
}
