import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Font injection ────────────────────────────────────────────────────────────
const FONT_CSS = `
  @font-face {
    font-family: 'Anatoleum';
    src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Anatoleum.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'JustSans';
    src: url('https://cdn.shopify.com/s/files/1/0671/4245/1372/files/JUST_Sans_Regular.woff2?v=1767008632') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
  @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
`;

// ── PRODUCT IMAGE ─────────────────────────────────────────────────────────────
// TO ADD YOUR IMAGE: Replace the string below with your full base64 data URI.
// Format: "data:image/webp;base64,<YOUR_BASE64_STRING_HERE>"
// This single constant is used everywhere — edit once and it updates all previews.
const PRODUCT_IMG = "PASTE_YOUR_BASE64_HERE";

// ── Dr. Water brand ───────────────────────────────────────────────────────────
const BRAND = {
  primary: "#142B77",
  secondary: "#076AC1",
  accent: "#D6E264",
  bg: "#FFFFFF",
  fontDisplay: "Anatoleum",
  fontBody: "JustSans",
  productImg: PRODUCT_IMG,
  name: "Dr. Water",
  tagline: "Science-backed hydration",
  toneWords: ["Clinical", "Trustworthy", "Clean", "Direct"],
};

// ── UI tokens ─────────────────────────────────────────────────────────────────
const ui = {
  bg: "#F4F4F5",
  surface: "#FFFFFF",
  surfaceHover: "#F9F9FA",
  border: "#E2E2E5",
  borderSubdued: "#EBEBED",
  text: "#18181B",
  textSub: "#71717A",
  textMuted: "#A1A1AA",
  cta: "#18181B",
  ctaHover: "#27272A",
  success: "#16A34A",
  successBg: "#F0FDF4",
  r: 10, rSm: 6, rFull: 9999,
  shadow: "0 1px 3px rgba(0,0,0,0.07)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.09)",
};

// ── Primitives ────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = "primary", size = "md", onClick, disabled, fullWidth, loading }) => {
  const [hov, setHov] = useState(false);
  const vs = {
    primary: { bg: hov ? ui.ctaHover : ui.cta, color: "#fff", border: "none", shadow: "0 1px 2px rgba(0,0,0,0.25)" },
    secondary: { bg: hov ? ui.surfaceHover : ui.surface, color: ui.text, border: `1px solid ${ui.border}`, shadow: ui.shadow },
    ghost: { bg: hov ? ui.bg : "transparent", color: ui.text, border: "none", shadow: "none" },
  };
  const sz = { sm: { p: "6px 12px", fs: 12 }, md: { p: "9px 16px", fs: 13 }, lg: { p: "12px 22px", fs: 14 } };
  const s = vs[variant]; const z = sz[size];
  return (
    <button onClick={!disabled && !loading ? onClick : undefined}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: z.p, fontSize: z.fs, fontWeight: 600, fontFamily: "JustSans, DM Sans, system-ui, sans-serif",
        background: s.bg, color: s.color, border: s.border || "none",
        borderRadius: ui.rSm, cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1, width: fullWidth ? "100%" : undefined,
        boxShadow: s.shadow, transition: "background 0.12s", letterSpacing: "-0.01em",
      }}>
      {loading ? <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${s.color}40`, borderTopColor: s.color, animation: "spin 0.7s linear infinite" }} /> : children}
    </button>
  );
};

const Badge = ({ children, tone = "neutral" }) => {
  const tones = { neutral: { bg: "#F4F4F5", color: "#52525B" }, success: { bg: ui.successBg, color: ui.success }, warning: { bg: "#FFFBEB", color: "#92400E" } };
  const s = tones[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: ui.rFull, fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, fontFamily: "JustSans, system-ui" }}>{children}</span>;
};

const Card = ({ children, style }) => (
  <div style={{ background: ui.surface, border: `1px solid ${ui.border}`, borderRadius: ui.r, overflow: "hidden", boxShadow: ui.shadow, ...style }}>{children}</div>
);
const Divider = () => <div style={{ height: 1, background: ui.borderSubdued }} />;

const Steps = ({ labels, current }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
    {labels.map((l, i) => {
      const done = i < current; const active = i === current;
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, background: done ? ui.success : active ? ui.cta : ui.border, color: done || active ? "#fff" : ui.textMuted }}>{done ? "✓" : i + 1}</div>
            <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? ui.text : ui.textMuted, whiteSpace: "nowrap", fontFamily: "JustSans, system-ui" }}>{l}</span>
          </div>
          {i < labels.length - 1 && <div style={{ flex: 1, height: 1, background: ui.border, margin: "0 10px" }} />}
        </div>
      );
    })}
  </div>
);

// ── Chart data (realistic: 40% open rate, $20k/mo email rev = ~$666/day) ─────
const mkData = (base, variance, n = 30, trend = 0) => Array.from({ length: n }, (_, i) => {
  const d = new Date(2026, 0, 23 + i);
  const label = `${d.getMonth() + 1}/${d.getDate()}`;
  const trendEffect = (i / n) * trend;
  const noise = (Math.random() - 0.5) * variance;
  const val = +(base + trendEffect + noise).toFixed(1);
  return { date: label, value: Math.max(0, val) };
});

// Open rate: hovering 38–43%, trending slightly up
const openData = mkData(40.2, 3.8, 30, 1.5).map(d => ({ ...d, value: +Math.min(48, Math.max(33, d.value)).toFixed(1) }));

// Click rate: 2.8–4.2% (realistic for DTC email)
const clickData = mkData(3.4, 1.1, 30, 0.4).map(d => ({ ...d, value: +Math.max(1.8, d.value).toFixed(1) }));

// Daily email revenue: avg $666/day (~$20k/month), with day-of-week dips
const revData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 0, 23 + i);
  const dow = d.getDay(); // weekends dip
  const base = dow === 0 || dow === 6 ? 480 : 720;
  const spike = i === 6 || i === 20 ? 1400 : 0; // campaign days
  const val = Math.round(base + spike + (Math.random() - 0.4) * 280);
  return { date: `${d.getMonth() + 1}/${d.getDate()}`, value: val };
});

// Unsubscribe rate: low and stable 0.08–0.18%
const unsubData = mkData(0.12, 0.06, 30, -0.01).map(d => ({ ...d, value: +Math.max(0.04, Math.min(0.25, d.value)).toFixed(2) }));

const MiniChart = ({ data, pre = "", suf = "" }) => (
  <ResponsiveContainer width="100%" height={72}>
    <LineChart data={data} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={ui.borderSubdued} vertical={false} />
      <XAxis dataKey="date" tick={{ fontSize: 9, fill: ui.textMuted }} tickLine={false} axisLine={false} interval={6} />
      <YAxis tick={{ fontSize: 9, fill: ui.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${pre}${v}${suf}`} />
      <Tooltip contentStyle={{ fontSize: 11, border: `1px solid ${ui.border}`, borderRadius: 6 }} formatter={v => [`${pre}${v}${suf}`, ""]} labelStyle={{ color: ui.textSub }} />
      <Line type="monotone" dataKey="value" stroke="#71717A" strokeWidth={1.5} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const FullChart = ({ data, title, subtitle, value, pre = "", suf = "" }) => (
  <Card>
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 3, fontFamily: "JustSans, system-ui" }}>{title}</div>
      <div style={{ fontSize: 11, color: ui.textMuted, marginBottom: 10, fontFamily: "JustSans, system-ui" }}>{subtitle}</div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-1px", color: ui.text, marginBottom: 14, fontFamily: "JustSans, system-ui" }}>{value}</div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={ui.borderSubdued} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: ui.textMuted }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fontSize: 10, fill: ui.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `${pre}${v}${suf}`} />
          <Tooltip contentStyle={{ fontSize: 11, border: `1px solid ${ui.border}`, borderRadius: 6 }} formatter={v => [`${pre}${v}${suf}`, ""]} />
          <Line type="monotone" dataKey="value" stroke="#3F3F46" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
);

// ── Shell ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Home" },
  { id: "flows", label: "Flows" },
  { id: "campaigns", label: "Campaigns" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

function Shell({ children, screen, navigate }) {
  const active = screen === "flow-detail" ? "flows" : screen;
  return (
    <div style={{ fontFamily: "JustSans, DM Sans, system-ui, sans-serif", background: ui.bg, minHeight: "100vh" }}>
      <style>{FONT_CSS}</style>
      <div style={{ height: 52, background: ui.surface, borderBottom: `1px solid ${ui.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 16, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: ui.cta, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✉️</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: ui.text, letterSpacing: "-0.3px" }}>Mailo</span>
        </div>
        <div style={{ width: 1, height: 20, background: ui.border }} />
        <nav style={{ display: "flex", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)} style={{ background: active === n.id ? ui.bg : "transparent", border: "none", color: active === n.id ? ui.text : ui.textSub, padding: "5px 12px", borderRadius: ui.rSm, fontSize: 13, fontWeight: active === n.id ? 600 : 400, cursor: "pointer", fontFamily: "JustSans, system-ui" }}>{n.label}</button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: ui.textSub }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: ui.success }} />
          Dr. Water
        </div>
      </div>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "24px", animation: "fadeIn 0.22s ease" }}>
        {children}
      </div>
    </div>
  );
}

// ── STEP 0: Brand Context ─────────────────────────────────────────────────────
function BrandContext({ onDone }) {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("input"); // input | loading | result

  const handleAnalyse = () => {
    if (!url.trim()) return;
    setPhase("loading");
    setTimeout(() => setPhase("result"), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", background: ui.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "JustSans, system-ui" }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, justifyContent: "center" }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: ui.cta, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✉️</div>
          <span style={{ fontWeight: 700, fontSize: 19, color: ui.text, letterSpacing: "-0.4px" }}>Mailo</span>
        </div>

        {phase === "input" && (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: ui.text, marginBottom: 4, textAlign: "center", letterSpacing: "-0.4px" }}>Let's learn your brand</div>
            <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28, textAlign: "center", lineHeight: 1.6 }}>
              Mailo reads your store to pull fonts, colours, and tone — so every email feels on-brand from day one.
            </div>
            <Card>
              <div style={{ padding: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: ui.text, display: "block", marginBottom: 6 }}>Your Shopify store URL</label>
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="drwater.store"
                  onKeyDown={e => e.key === "Enter" && handleAnalyse()}
                  style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${ui.border}`, borderRadius: ui.rSm, padding: "10px 12px", fontSize: 14, color: ui.text, background: ui.surface, outline: "none", fontFamily: "JustSans, system-ui", marginBottom: 14 }}
                />
                {/* Why we need it */}
                <div style={{ background: "#F8F8FA", border: `1px solid ${ui.borderSubdued}`, borderRadius: ui.rSm, padding: "10px 12px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: ui.textSub, lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: ui.text }}>Why we need this · </span>
                    Emails that match your store's visual identity convert 2–3× better than generic templates. We pull your exact fonts, brand colours, and product photos so flows look like they came from your own team.
                  </div>
                </div>
                <Btn variant="primary" fullWidth onClick={handleAnalyse} disabled={!url.trim()}>Analyse my store →</Btn>
              </div>
            </Card>
            <div style={{ fontSize: 11, color: ui.textMuted, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
              Read-only access · We don't store your store password
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div style={{ textAlign: "center", animation: "fadeIn 0.2s ease" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: "spin 0.75s linear infinite", margin: "0 auto 20px" }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: ui.text, marginBottom: 6 }}>Scanning {url}…</div>
            {["Reading HTML & CSS", "Extracting colour palette", "Detecting fonts", "Pulling product images", "Analysing brand tone"].map((step, i) => (
              <div key={i} style={{ fontSize: 12, color: ui.textMuted, marginBottom: 4, animation: `fadeIn 0.3s ${i * 0.4}s ease both` }}>
                <span style={{ marginRight: 6 }}>·</span>{step}
              </div>
            ))}
          </div>
        )}

        {phase === "result" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: ui.text, marginBottom: 2, textAlign: "center", letterSpacing: "-0.3px" }}>Brand context pulled ✓</div>
            <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 20, textAlign: "center" }}>Here's what we found from {url}</div>

            <Card style={{ marginBottom: 12 }}>
              {/* Fonts */}
              <div style={{ padding: 16, borderBottom: `1px solid ${ui.borderSubdued}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Typography</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: ui.bg, borderRadius: ui.rSm, padding: 12 }}>
                    <div style={{ fontSize: 10, color: ui.textMuted, marginBottom: 6 }}>Display font</div>
                    <div style={{ fontFamily: "Anatoleum, serif", fontSize: 22, color: ui.text, lineHeight: 1.2 }}>Anatoleum</div>
                    <div style={{ fontFamily: "Anatoleum, serif", fontSize: 13, color: ui.textSub, marginTop: 3 }}>Aa Bb Cc 123</div>
                  </div>
                  <div style={{ background: ui.bg, borderRadius: ui.rSm, padding: 12 }}>
                    <div style={{ fontSize: 10, color: ui.textMuted, marginBottom: 6 }}>Body font</div>
                    <div style={{ fontFamily: "JustSans, sans-serif", fontSize: 17, color: ui.text, fontWeight: 600 }}>JUST Sans</div>
                    <div style={{ fontFamily: "JustSans, sans-serif", fontSize: 13, color: ui.textSub, marginTop: 3 }}>Aa Bb Cc 123</div>
                  </div>
                </div>
              </div>

              {/* Colours */}
              <div style={{ padding: 16, borderBottom: `1px solid ${ui.borderSubdued}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Colour palette</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { name: "Primary", hex: BRAND.primary },
                    { name: "Secondary", hex: BRAND.secondary },
                    { name: "Accent", hex: BRAND.accent },
                    { name: "Background", hex: "#FFFFFF", border: true },
                  ].map(c => (
                    <div key={c.name} style={{ flex: 1 }}>
                      <div style={{ height: 42, borderRadius: ui.rSm, background: c.hex, marginBottom: 6, border: c.border ? `1px solid ${ui.border}` : "none" }} />
                      <div style={{ fontSize: 10, fontWeight: 600, color: ui.text }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: ui.textMuted }}>{c.hex}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand tone */}
              <div style={{ padding: 16, borderBottom: `1px solid ${ui.borderSubdued}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Brand tone</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {BRAND.toneWords.map(w => (
                    <span key={w} style={{ padding: "4px 10px", borderRadius: ui.rFull, fontSize: 12, fontWeight: 500, background: ui.bg, border: `1px solid ${ui.border}`, color: ui.text }}>{w}</span>
                  ))}
                </div>
              </div>

              {/* Product image */}
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Product image detected</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: ui.rSm, overflow: "hidden", border: `1px solid ${ui.border}`, flexShrink: 0, background: "#f0f4ff" }}>
                    {PRODUCT_IMG !== "PASTE_YOUR_BASE64_HERE"
                      ? <img src={PRODUCT_IMG} alt="Dr. Water product" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💧</div>
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Dr. Water Bottle</div>
                    <div style={{ fontSize: 12, color: ui.textSub }}>1 hero product image pulled</div>
                  </div>
                </div>
              </div>
            </Card>

            <Btn variant="primary" fullWidth size="lg" onClick={onDone}>Looks good — continue →</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth (Shopify + Klaviyo) ───────────────────────────────────────────────────
function Auth({ onComplete }) {
  const [shopify, setShopify] = useState("idle");
  const [klaviyo, setKlaviyo] = useState("idle");
  const [step, setStep] = useState(0);

  const connect = (svc) => {
    if (svc === "shopify") {
      setShopify("connecting");
      setTimeout(() => { setShopify("done"); setStep(1); }, 3000);
    } else {
      setKlaviyo("connecting");
      setTimeout(() => { setKlaviyo("done"); setStep(2); }, 3000);
    }
  };

  if (step === 2 && klaviyo === "done") return (
    <div style={{ minHeight: "100vh", background: ui.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JustSans, system-ui" }}>
      <style>{FONT_CSS}</style>
      <div style={{ textAlign: "center", animation: "pop 0.5s ease" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: ui.text, marginBottom: 6, letterSpacing: "-0.4px" }}>You're all set!</div>
        <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28 }}>Brand context, Shopify, and Klaviyo are all connected.</div>
        <Btn variant="primary" size="lg" onClick={onComplete}>Open Mailo →</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: ui.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "JustSans, system-ui" }}>
      <style>{FONT_CSS}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36, justifyContent: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: ui.cta, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✉️</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: ui.text, letterSpacing: "-0.3px" }}>Mailo</span>
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, color: ui.text, marginBottom: 3, textAlign: "center", letterSpacing: "-0.4px" }}>Connect your accounts</div>
        <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 24, textAlign: "center" }}>Two quick connections and you're ready to send</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ConnectCard logo="🛍" name="Shopify" desc="Sync products, orders and customer data" state={shopify} canConnect={step === 0} onConnect={() => connect("shopify")} />
          <ConnectCard logo="📧" name="Klaviyo" desc="Deploy flows and campaigns to your account" state={klaviyo} canConnect={step === 1} onConnect={() => connect("klaviyo")} />
        </div>
        <div style={{ fontSize: 11, color: ui.textMuted, textAlign: "center", marginTop: 18 }}>Read-only Shopify · Write access to Klaviyo drafts only</div>
      </div>
    </div>
  );
}

function ConnectCard({ logo, name, desc, state, canConnect, onConnect }) {
  return (
    <Card style={{ opacity: !canConnect && state === "idle" ? 0.4 : 1, transition: "opacity 0.3s" }}>
      <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: ui.r, background: ui.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{logo}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 2 }}>{name}</div>
          <div style={{ fontSize: 12, color: ui.textSub }}>{desc}</div>
        </div>
        {state === "idle" && canConnect && <Btn variant="secondary" size="sm" onClick={onConnect}>Connect</Btn>}
        {state === "connecting" && <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: ui.textSub }}><div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid #E4E5E7", borderTopColor: ui.cta, animation: "spin 0.7s linear infinite" }} />Connecting…</div>}
        {state === "done" && <div style={{ fontSize: 12, color: ui.success, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>✓ Connected</div>}
      </div>
    </Card>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ navigate, brandAdded }) {
  const stats = [
    { label: "Open rate", value: "40.2%", delta: "+2.1%", pos: true, data: openData, suf: "%" },
    { label: "Click rate", value: "3.4%", delta: "+0.3%", pos: true, data: clickData, suf: "%" },
    { label: "Attributed revenue", value: "$19,980", delta: "+$2,340", pos: true, data: revData, pre: "$" },
    { label: "Unsubscribe rate", value: "0.12%", delta: "-0.03%", pos: true, data: unsubData, suf: "%" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: "-0.4px" }}>Overview</h1>
          <p style={{ fontSize: 13, color: ui.textSub, margin: "2px 0 0" }}>Last 30 days · Jan 23 – Feb 22</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={() => navigate("campaigns")}>Plan campaign</Btn>
          <Btn variant="primary" size="sm" onClick={() => navigate("flows")}>Set up flow</Btn>
        </div>
      </div>

      {/* Brand added / first flow nudge */}
      <Card style={{ marginBottom: 16, borderLeft: `3px solid ${ui.success}` }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 22 }}>✅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 2 }}>Brand context added — Dr. Water fonts & colours are ready</div>
            <div style={{ fontSize: 12, color: ui.textSub }}>Your emails will look on-brand from the first deploy. Set up your first flow to start recovering revenue.</div>
          </div>
          <Btn variant="primary" size="sm" onClick={() => navigate("flows")}>Create first flow →</Btn>
        </div>
      </Card>

      {/* Revenue potential */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 3 }}>5 flows not yet deployed — ~$2,400/mo uncaptured</div>
            <div style={{ fontSize: 12, color: ui.textSub, marginBottom: 10 }}>Stores with all flows live see 12–15% of GMV from email on average</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 5, background: ui.bg, borderRadius: ui.rFull, overflow: "hidden" }}>
                <div style={{ width: "37.5%", height: "100%", background: ui.success, borderRadius: ui.rFull }} />
              </div>
              <span style={{ fontSize: 11, color: ui.textSub, flexShrink: 0 }}>3 / 8 flows live</span>
            </div>
          </div>
          <Btn variant="secondary" size="sm" onClick={() => navigate("flows")}>Set up flows →</Btn>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: ui.textSub, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: ui.text, letterSpacing: "-0.5px", marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.pos ? ui.success : "#EF4444", fontWeight: 500, marginBottom: 10 }}>{s.delta} vs last month</div>
              <MiniChart data={s.data} pre={s.pre} suf={s.suf} />
            </div>
          </Card>
        ))}
      </div>

      {/* Full charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <FullChart data={openData} title="Email open rate" subtitle="40%+ open rate · industry avg is 21%" value="40.2%" suf="%" />
        <FullChart data={revData} title="Attributed revenue" subtitle="$666/day avg · 20% of $100k/mo GMV" value="$19,980" pre="$" />
      </div>

      {/* Recent flows */}
      <Card>
        <div style={{ padding: "13px 16px", borderBottom: `1px solid ${ui.borderSubdued}` }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Active flows</div>
        </div>
        {[{ icon: "🛒", name: "Abandoned Cart", rev: "$1,240" }, { icon: "👋", name: "Welcome Series", rev: "$640" }, { icon: "📦", name: "Post-Purchase", rev: "$320" }].map((f, i, arr) => (
          <div key={i}>
            <div style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, background: ui.bg, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{f.icon}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.name}</div>
              <Badge tone="success">Live</Badge>
              <div style={{ fontSize: 13, fontWeight: 600, color: ui.success, minWidth: 54, textAlign: "right" }}>{f.rev}</div>
            </div>
            {i < arr.length - 1 && <Divider />}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Flows list ────────────────────────────────────────────────────────────────
const FLOWS = [
  { id: "a2c", icon: "🛒", name: "Abandoned Cart", desc: "Recover shoppers who left items in cart", steps: "3 emails · 2 SMS", rev: "$1,200/mo avg", status: "live" },
  { id: "checkout", icon: "💳", name: "Checkout Abandonment", desc: "Catch customers who reached checkout but didn't finish", steps: "3 emails · 1 SMS", rev: "$900/mo avg", status: "idle" },
  { id: "welcome", icon: "👋", name: "Welcome Series", desc: "Convert new subscribers into first-time buyers", steps: "4 emails", rev: "$640/mo avg", status: "live" },
  { id: "winback", icon: "🔄", name: "Win-Back", desc: "Re-engage customers inactive for 90+ days", steps: "3 emails · 1 SMS", rev: "$440/mo avg", status: "idle" },
  { id: "postpurchase", icon: "📦", name: "Post-Purchase", desc: "Get reviews and suggest related products", steps: "3 emails", rev: "$320/mo avg", status: "live" },
  { id: "browse", icon: "👁", name: "Browse Abandonment", desc: "Follow up on product views that never became a cart add", steps: "2 emails · 1 SMS", rev: "$270/mo avg", status: "idle" },
  { id: "backinstock", icon: "📬", name: "Back in Stock", desc: "Alert customers when their wishlist item is available", steps: "1 email · 1 SMS", rev: "$210/mo avg", status: "idle" },
  { id: "pricedrop", icon: "🏷", name: "Price Drop", desc: "Notify interested buyers when prices fall", steps: "1 email · 1 SMS", rev: "$175/mo avg", status: "idle" },
];

function FlowsList({ navigate }) {
  const live = FLOWS.filter(f => f.status === "live");
  const idle = FLOWS.filter(f => f.status !== "live");
  const idleRev = idle.reduce((s, f) => s + parseInt(f.rev.replace(/\D/g, "")), 0);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: "-0.4px" }}>Flows</h1>
        <p style={{ fontSize: 13, color: ui.textSub, margin: "2px 0 0" }}>Automated sequences that run 24/7</p>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Live · {live.length}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {live.map(f => <FlowCard key={f.id} flow={f} onClick={() => navigate("flow-detail", f)} />)}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: ui.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Not set up</div>
      <div style={{ fontSize: 12, color: ui.textSub, marginBottom: 10 }}>${idleRev.toLocaleString()}/mo in potential revenue not yet running</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {idle.map(f => <FlowCard key={f.id} flow={f} onClick={() => navigate("flow-detail", f)} />)}
      </div>
    </div>
  );
}

function FlowCard({ flow, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: ui.surface, border: `1px solid ${hov ? "#A1A1AA" : ui.border}`, borderRadius: ui.r, padding: 16, cursor: "pointer", transition: "border-color 0.12s", boxShadow: ui.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 22 }}>{flow.icon}</div>
        <Badge tone={flow.status === "live" ? "success" : "neutral"}>{flow.status === "live" ? "Live" : "Not set up"}</Badge>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: ui.text, marginBottom: 3 }}>{flow.name}</div>
      <div style={{ fontSize: 12, color: ui.textSub, lineHeight: 1.45, marginBottom: 10 }}>{flow.desc}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: ui.textMuted }}>{flow.steps}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: ui.success }}>{flow.rev}</span>
      </div>
    </div>
  );
}

// ── Flow Detail ───────────────────────────────────────────────────────────────
const SEQ = [
  { type: "email", delay: "1 hr after trigger", label: "First touch", options: ["Gentle reminder", "Cart summary + CTA", "Social proof"], sel: 1 },
  { type: "sms", delay: "3 hrs after trigger", label: "Quick nudge", options: ["Short & direct", "Friendly tone"], sel: 0 },
  { type: "email", delay: "24 hrs after trigger", label: "Build value", options: ["Product features", "Customer reviews", "5% discount"], sel: 2 },
  { type: "sms", delay: "48 hrs after trigger", label: "Urgency push", options: ["Scarcity angle", "10% off offer"], sel: 1 },
  { type: "email", delay: "72 hrs after trigger", label: "Final offer", options: ["10% discount", "Free shipping", "Bundle deal"], sel: 0 },
];
const THEMES_LIST = [
  { id: "minimal", name: "Clean & Minimal", desc: "White bg, strong type, one CTA" },
  { id: "dark", name: "Bold Dark", desc: "Dark bg, high contrast, premium" },
  { id: "warm", name: "Warm & Branded", desc: "Brand colours, soft lifestyle feel" },
];

function DrWaterEmail({ index, subject, coupon, body, cta }) {
  return (
    <div style={{ border: `1px solid ${ui.border}`, borderRadius: ui.rSm, overflow: "hidden", maxWidth: 400, background: "#fff" }}>
      {/* Browser chrome */}
      <div style={{ background: "#27272A", padding: "7px 12px", display: "flex", gap: 5, alignItems: "center" }}>
        {["#FF605C", "#FFBD44", "#00CA4E"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
      </div>
      {/* Email body */}
      <div style={{ padding: 0 }}>
        {/* Header band */}
        <div style={{ background: BRAND.primary, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Anatoleum, serif", fontSize: 18, color: "#fff", letterSpacing: "0.02em" }}>Dr. Water</span>
          <span style={{ fontFamily: "JustSans, sans-serif", fontSize: 10, color: BRAND.accent, fontWeight: 600, letterSpacing: 1 }}>HYDRATION</span>
        </div>
        {/* Product image */}
        <div style={{ background: "#f0f4ff", height: 140, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {PRODUCT_IMG !== "PASTE_YOUR_BASE64_HERE"
            ? <img src={PRODUCT_IMG} alt="Dr. Water" style={{ height: "160px", width: "auto", objectFit: "contain" }} />
            : <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 4 }}>💧</div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "JustSans, sans-serif" }}>Product image</div>
              </div>
          }
        </div>
        {/* Coupon badge */}
        {coupon && (
          <div style={{ background: BRAND.accent, padding: "7px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "JustSans, sans-serif", fontSize: 11, fontWeight: 700, color: BRAND.primary }}>🎁 USE CODE</span>
            <span style={{ fontFamily: "JustSans, sans-serif", fontSize: 13, fontWeight: 800, color: BRAND.primary, letterSpacing: "0.08em" }}>{coupon}</span>
            <span style={{ fontFamily: "JustSans, sans-serif", fontSize: 11, color: BRAND.primary, opacity: 0.7 }}>— applied at checkout</span>
          </div>
        )}
        {/* Content */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "Anatoleum, serif", fontSize: 16, color: BRAND.primary, marginBottom: 6, lineHeight: 1.3 }}>{subject}</div>
          <div style={{ fontFamily: "JustSans, sans-serif", fontSize: 11, color: "#52525B", lineHeight: 1.65, marginBottom: 12 }}>{body}</div>
          <div style={{ background: BRAND.primary, color: "#fff", borderRadius: 5, padding: "9px 0", textAlign: "center", fontFamily: "JustSans, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.02em" }}>
            {cta || "Complete your order →"}
          </div>
          <div style={{ marginTop: 12, padding: "10px 0", borderTop: `1px solid #E4E5E7`, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.accent }} />
            <span style={{ fontFamily: "JustSans, sans-serif", fontSize: 9, color: "#A1A1AA" }}>Unsubscribe · View in browser · drwater.store</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmsPreview({ text }) {
  return (
    <div style={{ background: "#1C1C1E", borderRadius: 14, padding: 14, maxWidth: 300 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 8, textAlign: "center" }}>Today 10:32 AM</div>
      <div style={{ background: "#3A3A3C", borderRadius: "14px 14px 14px 4px", padding: "9px 12px", fontSize: 12, color: "#fff", lineHeight: 1.5, fontFamily: "JustSans, sans-serif" }}>{text}</div>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Delivered</div>
    </div>
  );
}

const EMAIL_CONTENT = [
  {
    subject: "You left something behind",
    coupon: null,
    body: "Hey — you left your Dr. Water bottle in your cart. We've reserved your stock, but we can only hold it for 24 hours before it goes back to general availability. No discount needed — just your cart, waiting.",
    cta: "Complete my order →",
  },
  {
    subject: "Still on the fence? Here's 5% off.",
    coupon: "HYDRATE5",
    body: "We get it — buying online takes a moment of trust. So here's a little push: use code HYDRATE5 at checkout for 5% off your order. Our bottles are built to last, backed by science, and shipped same day.",
    cta: "Apply HYDRATE5 and order →",
  },
  {
    subject: "24 hours left — and 10% off inside",
    coupon: "HYDRATE10",
    body: "Your cart is about to expire. We're giving you one last offer: 10% off with code HYDRATE10. That's our best discount — we don't run blanket sales. Just clean hydration, at a better price, today only.",
    cta: "Use HYDRATE10 — save 10% →",
  },
  {
    subject: "Final notice: your cart expires tonight",
    coupon: "HYDRATE10",
    body: "This is the last email we'll send about your cart. Code HYDRATE10 still works — 10% off, expires at midnight. After that, your cart clears and the discount disappears. No extensions, no exceptions.",
    cta: "Claim my discount now →",
  },
];
const SMS_CONTENT = [
  "Hey! Your Dr. Water cart is saved 💧 Stock is limited — grab it before it sells out: drwater.store/cart",
  "Last chance — 10% off your Dr. Water order with code HYDRATE10. Expires midnight tonight: drwater.store/cart?discount=HYDRATE10",
];

function FlowDetail({ flow, navigate }) {
  const [seq, setSeq] = useState(SEQ);
  const [theme, setTheme] = useState(null);
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const pickOpt = (si, oi) => setSeq(p => p.map((s, i) => i === si ? { ...s, sel: oi } : s));

  const handleGoLive = () => {
    setLaunching(true);
    setTimeout(() => { setLaunching(false); setLaunched(true); }, 3500);
  };

  if (launched) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 480, textAlign: "center", animation: "fadeIn 0.3s ease" }}>
      <div style={{ fontSize: 56, marginBottom: 18, animation: "pop 0.5s ease" }}>🚀</div>
      <div style={{ fontFamily: "Anatoleum, serif", fontSize: 26, color: ui.text, marginBottom: 6, letterSpacing: "-0.3px" }}>{flow?.name || "Abandoned Cart"} is live</div>
      <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 28, maxWidth: 360 }}>Your flow is running and synced with Klaviyo. First recoveries typically show within 24 hours.</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
        <Btn variant="secondary" onClick={() => navigate("flows")}>Back to flows</Btn>
        <Btn variant="primary" onClick={() => navigate("dashboard")}>View dashboard</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, width: "100%", maxWidth: 480 }}>
        {[["Expected opens", "~320/mo"], ["Expected revenue", "~$960/mo"], ["First recovery", "~1–2 days"]].map(([k, v]) => (
          <Card key={k} style={{ padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: ui.textSub, marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: ui.text }}>{v}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  if (launching) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 480, textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${ui.border}`, borderTopColor: ui.cta, animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
      <div style={{ fontFamily: "Anatoleum, serif", fontSize: 18, color: ui.text, marginBottom: 6 }}>Deploying to Klaviyo…</div>
      <div style={{ fontSize: 13, color: ui.textMuted, animation: "pulse 1.5s ease infinite" }}>Creating flows · applying Dr. Water templates · setting triggers</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate("flows")}>← Flows</Btn>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: "-0.3px" }}>{flow?.icon} {flow?.name || "Abandoned Cart"}</h1>
          <p style={{ fontSize: 12, color: ui.textSub, margin: "2px 0 0" }}>{flow?.desc}</p>
        </div>
      </div>

      <Steps labels={["Configure", "Theme", "Preview & launch"]} current={step} />

      {step === 0 && (
        <>
          <Card>
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${ui.borderSubdued}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sequence — {seq.length} steps</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              {seq.map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", gap: 12, padding: "13px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30, flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: ui.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{s.type === "email" ? "📧" : "💬"}</div>
                      {i < seq.length - 1 && <div style={{ width: 1, flex: 1, background: ui.borderSubdued, minHeight: 10, margin: "4px 0" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 7 }}>
                        <Badge>{s.type === "email" ? "Email" : "SMS"}</Badge>
                        <span style={{ fontSize: 11, color: ui.textSub }}>{s.delay}</span>
                        <span style={{ fontSize: 11, color: ui.text, fontWeight: 500 }}>· {s.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {s.options.map((o, j) => (
                          <button key={j} onClick={() => pickOpt(i, j)} style={{ padding: "4px 11px", borderRadius: ui.rFull, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "JustSans, system-ui", border: `1.5px solid ${s.sel === j ? ui.cta : ui.border}`, background: s.sel === j ? ui.cta : ui.surface, color: s.sel === j ? "#fff" : ui.textSub }}>{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < seq.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Btn variant="primary" onClick={() => setStep(1)}>Next: Choose theme →</Btn>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Visual style</div>
              <div style={{ fontSize: 12, color: ui.textSub, marginBottom: 14 }}>All options use Dr. Water's Anatoleum + JUST Sans fonts and brand colours automatically</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {THEMES_LIST.map(th => (
                  <div key={th.id} onClick={() => setTheme(th.id)} style={{ border: `2px solid ${theme === th.id ? ui.cta : ui.border}`, borderRadius: ui.r, overflow: "hidden", cursor: "pointer", transition: "border-color 0.12s" }}>
                    <div style={{ height: 72, background: th.id === "dark" ? BRAND.primary : th.id === "warm" ? "#F0F4FF" : "#fff", padding: 10, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                      <div style={{ height: 5, borderRadius: 3, width: "55%", background: th.id === "dark" ? "rgba(255,255,255,0.25)" : BRAND.primary + "30" }} />
                      <div style={{ height: 9, borderRadius: 3, width: "80%", background: th.id === "dark" ? "rgba(255,255,255,0.85)" : BRAND.primary }} />
                      <div style={{ height: 5, borderRadius: 3, width: "65%", background: th.id === "dark" ? "rgba(255,255,255,0.35)" : "#C9CDD3" }} />
                      <div style={{ height: 15, borderRadius: 4, background: th.id === "dark" ? BRAND.accent : BRAND.primary, width: "42%", marginTop: 2 }} />
                    </div>
                    <div style={{ padding: "8px 10px", borderTop: `1px solid ${ui.borderSubdued}` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: ui.text }}>{th.name}</div>
                      <div style={{ fontSize: 11, color: ui.textSub }}>{th.desc}</div>
                      {theme === th.id && <div style={{ fontSize: 11, color: ui.success, fontWeight: 600, marginTop: 3 }}>✓ Selected</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setStep(0)}>← Back</Btn>
            <Btn variant="primary" disabled={!theme} onClick={() => theme && setStep(2)}>Preview all messages →</Btn>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ fontSize: 13, color: ui.textSub, marginBottom: 14 }}>
            {seq.filter(s => s.type === "email").length} emails and {seq.filter(s => s.type === "sms").length} SMS messages — all branded with Dr. Water's fonts and colours
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
            {seq.map((s, i) => {
              const emailIdx = seq.slice(0, i).filter(x => x.type === "email").length;
              const smsIdx = seq.slice(0, i).filter(x => x.type === "sms").length;
              return (
                <Card key={i}>
                  <div style={{ padding: "11px 16px", borderBottom: `1px solid ${ui.borderSubdued}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{s.type === "email" ? "📧" : "💬"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Step {i + 1} — {s.type === "email" ? "Email" : "SMS"}</span>
                    <span style={{ fontSize: 12, color: ui.textSub }}>· {s.delay}</span>
                    <Badge>{s.options[s.sel]}</Badge>
                  </div>
                  <div style={{ padding: 16 }}>
                    {s.type === "email"
                      ? <DrWaterEmail index={emailIdx} subject={EMAIL_CONTENT[emailIdx % EMAIL_CONTENT.length].subject} coupon={EMAIL_CONTENT[emailIdx % EMAIL_CONTENT.length].coupon} body={EMAIL_CONTENT[emailIdx % EMAIL_CONTENT.length].body} cta={EMAIL_CONTENT[emailIdx % EMAIL_CONTENT.length].cta} />
                      : <SmsPreview text={SMS_CONTENT[smsIdx % SMS_CONTENT.length]} />
                    }
                  </div>
                </Card>
              );
            })}
          </div>
          <Card>
            <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Ready to go live</div>
                <div style={{ fontSize: 12, color: ui.textSub }}>{seq.length} steps · {THEMES_LIST.find(th => th.id === theme)?.name} · Avg $1,200/mo recovery</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="secondary" onClick={() => setStep(1)}>← Edit theme</Btn>
                <Btn variant="primary" size="lg" onClick={handleGoLive}>🚀 Go live</Btn>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Campaigns (unchanged logic, abbreviated) ──────────────────────────────────
const CAL_EVENTS = { 14: "💝 Valentine's", 20: "📦 Restock", 28: "📅 Month end" };
const C_THEMES = [
  { icon: "💝", name: "Valentine's Sale", reason: "High gifting intent — push bundles" },
  { icon: "🔥", name: "Flash Sale", reason: "24hr urgency — move slow inventory" },
  { icon: "📚", name: "Educational", reason: "Tip or how-to — builds trust" },
  { icon: "🌟", name: "New Arrivals", reason: "Push latest products to engaged list" },
];
const C_STYLES = [
  { icon: "🏷️", name: "Offer / Promo", desc: "Discount-led with urgency copy" },
  { icon: "👤", name: "Founder Story", desc: "Personal, behind-the-scenes" },
  { icon: "💡", name: "Educational", desc: "Value-first, soft product mention" },
  { icon: "📦", name: "Product Feature", desc: "Benefits-led product spotlight" },
];

function Campaigns({ navigate }) {
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(null);
  const [cTheme, setCTheme] = useState(null);
  const [cStyle, setCStyle] = useState(null);
  const [cDesign, setCDesign] = useState(null);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: ui.text, margin: 0, letterSpacing: "-0.4px" }}>Campaign Planner</h1>
        <p style={{ fontSize: 13, color: ui.textSub, margin: "2px 0 0" }}>Plan, generate and schedule campaigns in minutes</p>
      </div>
      <Steps labels={["Date", "Theme", "Style", "Design", "Send"]} current={step} />
      {step === 0 && (
        <Card>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>February 2026 — pick a day</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: ui.textMuted, padding: "3px 0" }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => {
                const ev = CAL_EVENTS[d]; const sel = day === d;
                return (
                  <div key={d} onClick={() => setDay(d)} style={{ border: `1.5px solid ${sel ? ui.cta : ev ? "#A1A1AA" : ui.borderSubdued}`, borderRadius: ui.rSm, padding: "5px 3px", cursor: "pointer", textAlign: "center", minHeight: 46, background: sel ? ui.cta : ev ? ui.bg : ui.surface, transition: "all 0.1s" }}>
                    <div style={{ fontSize: 12, fontWeight: sel ? 700 : 400, color: sel ? "#fff" : ui.text }}>{d}</div>
                    {ev && <div style={{ fontSize: 7.5, lineHeight: 1.2, marginTop: 2, color: sel ? "rgba(255,255,255,0.8)" : ui.textSub }}>{ev}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          {day && <div style={{ padding: "0 16px 16px", display: "flex", justifyContent: "flex-end" }}><Btn variant="primary" onClick={() => setStep(1)}>Plan Feb {day} →</Btn></div>}
        </Card>
      )}
      {step === 1 && (
        <>
          <Card><div style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Suggested for Feb {day}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{C_THEMES.map((th, i) => <div key={i} onClick={() => setCTheme(i)} style={{ border: `2px solid ${cTheme === i ? ui.cta : ui.border}`, borderRadius: ui.r, padding: 14, cursor: "pointer", background: cTheme === i ? ui.bg : ui.surface }}><div style={{ fontSize: 20, marginBottom: 7 }}>{th.icon}</div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{th.name}</div><div style={{ fontSize: 11, color: ui.textSub }}>{th.reason}</div></div>)}</div></div></Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}><Btn variant="secondary" onClick={() => setStep(0)}>← Back</Btn><Btn variant="primary" disabled={cTheme === null} onClick={() => cTheme !== null && setStep(2)}>Next →</Btn></div>
        </>
      )}
      {step === 2 && (
        <>
          <Card><div style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Content approach</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{C_STYLES.map((s, i) => <div key={i} onClick={() => setCStyle(i)} style={{ border: `2px solid ${cStyle === i ? ui.cta : ui.border}`, borderRadius: ui.r, padding: 14, cursor: "pointer", background: cStyle === i ? ui.bg : ui.surface, display: "flex", gap: 10, alignItems: "flex-start" }}><div style={{ fontSize: 20 }}>{s.icon}</div><div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{s.name}</div><div style={{ fontSize: 11, color: ui.textSub }}>{s.desc}</div></div></div>)}</div></div></Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}><Btn variant="secondary" onClick={() => setStep(1)}>← Back</Btn><Btn variant="primary" disabled={cStyle === null} onClick={() => cStyle !== null && setStep(3)}>Next →</Btn></div>
        </>
      )}
      {step === 3 && (
        <>
          <Card><div style={{ padding: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Design template</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>{[{ name: "Clean & Minimal", bg: "#fff" }, { name: "Bold Dark", bg: BRAND.primary }, { name: "Warm & Branded", bg: "#F0F4FF" }].map((d, i) => <div key={i} onClick={() => setCDesign(i)} style={{ border: `2px solid ${cDesign === i ? ui.cta : ui.border}`, borderRadius: ui.r, overflow: "hidden", cursor: "pointer" }}><div style={{ background: d.bg, padding: 12, height: 70, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>{[[5,"55%"],[9,"80%"],[5,"65%"]].map(([h,w],idx) => <div key={idx} style={{ height: h, borderRadius: 3, width: w, background: d.bg === BRAND.primary ? `rgba(255,255,255,${idx===1?0.85:0.2})` : idx===1?BRAND.primary:ui.border }} />)}<div style={{ height: 14, borderRadius: 4, background: BRAND.primary, width: "42%", marginTop: 2 }} /></div><div style={{ padding: "8px 10px", borderTop: `1px solid ${ui.border}` }}><div style={{ fontSize: 12, fontWeight: 600 }}>{d.name}</div>{cDesign===i && <div style={{ fontSize: 11, color: ui.success, fontWeight: 600 }}>✓ Selected</div>}</div></div>)}</div></div></Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}><Btn variant="secondary" onClick={() => setStep(2)}>← Back</Btn><Btn variant="primary" disabled={cDesign === null} onClick={() => cDesign !== null && setStep(4)}>Preview →</Btn></div>
        </>
      )}
      {step === 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${ui.borderSubdued}` }}><div style={{ fontSize: 13, fontWeight: 600 }}>Email preview</div></div>
            <div style={{ padding: 16 }}>
              <DrWaterEmail index={0} subject={`${C_THEMES[cTheme]?.icon} ${C_THEMES[cTheme]?.name} — hydrate smarter`} coupon="HYDRATE15" body="We've picked our best sellers for this occasion. Use code HYDRATE15 at checkout for 15% off — our biggest campaign discount of the month. Science-backed hydration at a price that makes sense." cta="Shop now — save 15% →" />
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Summary</div>
                {[["Send date", `Feb ${day}, 2026 · 10:00 AM`], ["Theme", C_THEMES[cTheme]?.name], ["Style", C_STYLES[cStyle]?.name], ["Audience", "All subscribers · 1,240 contacts"], ["Offer", "15% off · active promotion"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${ui.borderSubdued}`, fontSize: 12 }}>
                    <span style={{ color: ui.textSub }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ background: ui.successBg, borderRadius: ui.rSm, padding: 10, marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ui.success, marginBottom: 2 }}>📈 Projected</div>
                  <div style={{ fontSize: 11, color: ui.textSub }}>~420 opens · ~28 clicks · ~$380 attributed</div>
                </div>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => setStep(3)}>← Edit</Btn>
              <Btn variant="primary" fullWidth onClick={() => navigate("dashboard")}>🚀 Schedule campaign</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("brand");
  const [flowData, setFlowData] = useState(null);
  const [brandDone, setBrandDone] = useState(false);
  const [authDone, setAuthDone] = useState(false);

  const navigate = (target, data) => {
    if (target === "flow-detail") { setFlowData(data); setScreen("flow-detail"); }
    else { setScreen(target); setFlowData(null); }
  };

  if (screen === "brand") return <BrandContext onDone={() => setScreen("auth")} />;
  if (screen === "auth") return <Auth onComplete={() => { setAuthDone(true); setScreen("dashboard"); }} />;

  return (
    <Shell screen={screen} navigate={navigate}>
      {screen === "dashboard" && <Dashboard navigate={navigate} brandAdded={true} />}
      {screen === "flows" && <FlowsList navigate={navigate} />}
      {screen === "flow-detail" && <FlowDetail flow={flowData} navigate={navigate} />}
      {screen === "campaigns" && <Campaigns navigate={navigate} />}
      {(screen === "analytics" || screen === "settings") && (
        <div style={{ textAlign: "center", padding: 80 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{screen === "analytics" ? "📈" : "⚙️"}</div>
          <div style={{ fontFamily: "Anatoleum, serif", fontSize: 18, color: ui.text }}>Coming soon</div>
          <div style={{ fontSize: 13, color: ui.textSub, marginTop: 4 }}>Placeholder for demo</div>
        </div>
      )}
    </Shell>
  );
}
