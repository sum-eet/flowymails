import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { ui } from '../lib/tokens.js';
import Btn from '../components/Btn.jsx';
import Card from '../components/Card.jsx';
import { IconMail } from '../components/Icons.jsx';

const FONT_CSS = `
  @font-face { font-family: 'JustSans'; src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/JUST_Sans_Regular.woff2?v=1767008632') format('woff2'); font-display: swap; }
  @font-face { font-family: 'Anatoleum'; src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Anatoleum.woff2') format('woff2'); font-display: swap; }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  * { box-sizing: border-box; }
`;

export default function BrandContext({ onDone }) {
  const [url, setUrl]     = useState('');
  const [phase, setPhase] = useState('input'); // input | loading | result | error
  const [brand, setBrand] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const handleAnalyse = async () => {
    const domain = url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!domain) return;
    setPhase('loading');
    try {
      const res = await api.brand.analyse(domain);
      setBrand(res.brand);
      setPhase('result');
    } catch (e) {
      setErrMsg(e.message || 'Failed to analyse store');
      setPhase('error');
    }
  };

  const domain = url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div style={{ minHeight: '100vh', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'JustSans', system-ui" }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: ui.cta, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMail size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 19, color: ui.text, letterSpacing: '-0.4px' }}>Mailo</span>
        </div>

        {/* Input */}
        {phase === 'input' && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ui.text, marginBottom: 4, textAlign: 'center', letterSpacing: '-0.4px' }}>Let's learn your brand</div>
            <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28, textAlign: 'center', lineHeight: 1.6 }}>
              Mailo reads your store to pull fonts, colours, and tone — so every email feels on-brand from day one.
            </div>
            <Card>
              <div style={{ padding: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: ui.text, display: 'block', marginBottom: 6 }}>Your Shopify store URL</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="drwater.store"
                  onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
                  style={{ width: '100%', border: `1px solid ${ui.border}`, borderRadius: ui.rSm, padding: '10px 12px', fontSize: 14, color: ui.text, background: ui.surface, outline: 'none', fontFamily: "'JustSans', system-ui", marginBottom: 14 }}
                />
                <div style={{ background: '#F8F8FA', border: `1px solid ${ui.borderSubdued}`, borderRadius: ui.rSm, padding: '10px 12px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: ui.textSub, lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: ui.text }}>Why we need this · </span>
                    Emails that match your store's visual identity convert 2–3× better than generic templates. We pull your exact fonts, brand colours, and product photos so flows look like they came from your own team.
                  </div>
                </div>
                <Btn variant="primary" fullWidth onClick={handleAnalyse} disabled={!url.trim()}>Analyse my store →</Btn>
              </div>
            </Card>
            <div style={{ fontSize: 11, color: ui.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
              Read-only access · We don't store your store password
            </div>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: 'spin 0.75s linear infinite', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: ui.text, marginBottom: 6 }}>Scanning {domain}…</div>
            {['Reading HTML & CSS', 'Extracting colour palette', 'Detecting fonts', 'Pulling product images'].map((step, i) => (
              <div key={i} style={{ fontSize: 12, color: ui.textMuted, marginBottom: 4, animation: `fadeIn 0.3s ${i * 0.4}s ease both` }}>
                <span style={{ marginRight: 6 }}>·</span>{step}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <Card style={{ borderLeft: '3px solid #EF4444', marginBottom: 16 }}>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 4 }}>Could not analyse store</div>
                <div style={{ fontSize: 13, color: ui.textSub }}>{errMsg}</div>
              </div>
            </Card>
            <Btn variant="secondary" fullWidth onClick={() => setPhase('input')}>Try again</Btn>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && brand && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: ui.text, marginBottom: 2, textAlign: 'center', letterSpacing: '-0.3px' }}>Brand context pulled</div>
            <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 20, textAlign: 'center' }}>Here's what we found from {domain}</div>

            <Card style={{ marginBottom: 12 }}>
              {/* Colours */}
              {brand.colours && (
                <div style={{ padding: 16, borderBottom: `1px solid ${ui.borderSubdued}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Colour palette</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {Object.entries(brand.colours).map(([name, hex]) => (
                      <div key={name} style={{ flex: 1 }}>
                        <div style={{ height: 42, borderRadius: ui.rSm, background: hex, marginBottom: 6, border: hex === '#ffffff' || hex === '#FFFFFF' ? `1px solid ${ui.border}` : 'none' }} />
                        <div style={{ fontSize: 10, fontWeight: 600, color: ui.text, textTransform: 'capitalize' }}>{name}</div>
                        <div style={{ fontSize: 10, color: ui.textMuted }}>{hex}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fonts */}
              {brand.fonts && (
                <div style={{ padding: 16, borderBottom: `1px solid ${ui.borderSubdued}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Typography</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {brand.fonts.display && (
                      <div style={{ background: ui.bg, borderRadius: ui.rSm, padding: 12 }}>
                        <div style={{ fontSize: 10, color: ui.textMuted, marginBottom: 6 }}>Display font</div>
                        <div style={{ fontSize: 17, color: ui.text, fontWeight: 600 }}>{brand.fonts.display.name}</div>
                      </div>
                    )}
                    {brand.fonts.body && (
                      <div style={{ background: ui.bg, borderRadius: ui.rSm, padding: 12 }}>
                        <div style={{ fontSize: 10, color: ui.textMuted, marginBottom: 6 }}>Body font</div>
                        <div style={{ fontSize: 17, color: ui.text, fontWeight: 600 }}>{brand.fonts.body.name}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              {brand.product_images?.length > 0 && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Products detected</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {brand.product_images.slice(0, 3).map((p, i) => (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{ height: 60, borderRadius: ui.rSm, border: `1px solid ${ui.border}`, overflow: 'hidden', background: ui.bg }}>
                          {p.url && <img src={p.url} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: ui.text, marginTop: 5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.productName}</div>
                        <div style={{ fontSize: 11, color: ui.textSub }}>${p.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps warning */}
              {brand.gaps?.length > 0 && (
                <div style={{ padding: '10px 16px', background: '#FFFBEB', borderTop: `1px solid ${ui.borderSubdued}` }}>
                  <div style={{ fontSize: 12, color: '#92400E' }}>
                    Couldn't detect: {brand.gaps.join(', ')}. You can upload them manually later.
                  </div>
                </div>
              )}
            </Card>

            <Btn variant="primary" fullWidth size="lg" onClick={() => onDone(domain, brand)}>
              Looks good — continue →
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
