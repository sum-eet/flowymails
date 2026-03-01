const BASE = import.meta.env.VITE_API_URL;

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch (_) {
    throw new Error(`Server error (${res.status}) — check backend logs`);
  }
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

export const api = {
  brand: {
    analyse: (shopDomain) => request('POST', '/api/brand/analyse', { shopDomain }),
    get:     (shopDomain) => request('GET',  `/api/brand/${shopDomain}`),
    upload:  (formData)   => fetch(`${BASE}/api/brand/upload`, { method: 'POST', body: formData }).then(r => r.json()),
  },
  klaviyo: {
    connect: (shopDomain, apiKey) => request('POST', '/auth/klaviyo/connect', { shopDomain, apiKey }),
  },
  audit: {
    get: (shopDomain) => request('GET', `/api/audit/${shopDomain}`),
  },
  flows: {
    list:   (shopDomain) => request('GET',  `/api/flows/${shopDomain}`),
    deploy: (shopDomain, flowType) => request('POST', '/api/flows/deploy', { shopDomain, flowType }),
  },
  campaigns: {
    // payload: { shopDomain, theme, offer, product, segmentId, sendDate }
    schedule: (payload) => request('POST', '/api/campaigns/schedule', payload),
  },
};
