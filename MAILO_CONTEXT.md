<!-- # MAILO — Engineering Context & Guardrails

> **READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.**
> This is the single source of truth. Every architectural decision is final.
> Do not invent, improve, or deviate from anything not explicitly marked as open.
> When in doubt: stop and ask. Never assume.

---

## What we're building

Mailo is a Shopify app for Shopify + Klaviyo stores ($20k–$200k/month GMV). It:
1. Scrapes brand context from a Shopify storefront (colours, fonts, logo, products)
2. Connects to Shopify via OAuth and Klaviyo via private API key
3. Deploys pre-built email/SMS flow and campaign templates, automatically styled with the brand

Target user: solo founder or small team. No Klaviyo expertise. No designer. No copywriter.
First customer: Dr. Water (drwater.store) — all real IDs in this file are from their account.

---

## Shopify app model — UNLISTED CUSTOM APP

This is NOT a public Shopify App Store app. It is an unlisted custom app.

**What this means:**
- No Shopify App Store submission, no review process, no 20% revenue cut
- Merchants install via a direct install URL you send them manually
- You control billing entirely outside Shopify (via Dodo Payments)
- OAuth flow is identical to a public app — same code, same HMAC validation
- Shopify Partner dashboard: create app as "Custom app" or "Public app" set to unlisted

**Install URL pattern:**
```
https://api.mailo.app/auth/shopify?shop={merchant}.myshopify.com
```
You send this link to each new customer. They click it, Shopify OAuth runs, they land in the dashboard.

**App Store later:**
The codebase is intentionally designed so upgrading to a listed App Store app later is a clean swap:
- OAuth flow: already correct, no changes needed
- Billing: swap Dodo Payments for Shopify Billing API (one file change)
- UI: avoid position:fixed and 100vh in the frontend shell so it can embed in Shopify Admin iframe later
- App Bridge: not needed for unlisted — add later if going embedded

---

## Billing — Dodo Payments

Payment processor: **Dodo Payments** (https://dodopayments.com)
Reason: Works from India, handles international payouts, Stripe-compatible API pattern.

**Billing model (to be confirmed with product decisions):**
- Monthly subscription per store
- Suggested tiers: Starter $49/mo, Growth $99/mo, Scale $199/mo
- All billing happens outside Shopify — Dodo Payments handles it

**Integration points:**
- `POST /api/billing/checkout` — create a Dodo checkout session, return URL
- `POST /api/billing/webhook` — handle Dodo webhook events (subscription created, cancelled, payment failed)
- `GET /api/billing/status?shop={domain}` — return current subscription status
- Middleware `requireActiveSub` — check subscription status before any flow/campaign action

**Dodo Payments docs:** https://docs.dodopayments.com
Use their Node.js SDK if available, otherwise axios against their REST API.

**DO NOT implement billing in Phase 0–5.** Add it in Phase 9 after core flow functionality works.
For development and first customer (Dr. Water), bypass billing check entirely.

---

## Stack — LOCKED. Do not change.

| Layer           | Choice               | Hard constraint                                      |
|-----------------|----------------------|------------------------------------------------------|
| Frontend        | React + Vite         | Do not switch frameworks                             |
| Backend         | Node 20 LTS + Express| Not Fastify, Hono, or Next.js API routes             |
| Database        | Supabase (Postgres)  | Use @supabase/supabase-js v2. Service key only.      |
| File storage    | Supabase Storage     | Logos and font uploads only                          |
| HTTP client     | axios                | Proven in flow1.js and 27feb.js — do not swap        |
| HTML scraping   | cheerio + node-fetch | Not Puppeteer, not Playwright                        |
| Payments        | Dodo Payments        | Not Stripe, not Shopify Billing API (yet)            |
| Frontend host   | Vercel               | Auto-deploy from GitHub                              |
| Backend host    | Railway              | Single service. Env vars in Railway dashboard.       |
| Node version    | 20 LTS               | Pin in .nvmrc and package.json engines field         |

---

## Repository structure — EXACT. Nothing more, nothing less.

```
mailo/
├── MAILO_CONTEXT.md              ← this file, always at root
├── .gitignore
├── .nvmrc                        ← single line: 20
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               ← screen switcher via useState, same pattern as prototype
│       ├── screens/
│       │   ├── BrandContext.jsx
│       │   ├── Auth.jsx
│       │   ├── Dashboard.jsx
│       │   ├── FlowsList.jsx
│       │   ├── FlowDetail.jsx
│       │   └── Campaigns.jsx
│       ├── components/
│       │   ├── Shell.jsx
│       │   ├── Btn.jsx
│       │   ├── Card.jsx
│       │   ├── Badge.jsx
│       │   ├── Steps.jsx
│       │   ├── Icons.jsx         ← ALL SVG icons here, named exports only
│       │   ├── MiniChart.jsx
│       │   └── FullChart.jsx
│       └── lib/
│           ├── api.js            ← every backend call goes through here, nowhere else
│           └── tokens.js         ← ui design tokens object, copied from prototype exactly
│
├── backend/
│   ├── package.json
│   ├── index.js                  ← Express entry, mounts all routes
│   ├── routes/
│   │   ├── brand.js              ← /api/brand/*
│   │   ├── auth.js               ← /auth/shopify, /auth/shopify/callback, /api/klaviyo/connect
│   │   ├── flows.js              ← /api/flows/*
│   │   ├── campaigns.js          ← /api/campaigns/*
│   │   ├── templates.js          ← /api/templates/*
│   │   └── billing.js            ← /api/billing/* (add in Phase 9)
│   ├── lib/
│   │   ├── supabase.js           ← Supabase client singleton (service key)
│   │   ├── klaviyoClient.js      ← axios client factory, standard + beta
│   │   ├── shopifyClient.js      ← axios client factory
│   │   ├── encrypt.js            ← AES-256-GCM, exact implementation below
│   │   └── scraper.js            ← brand scraping logic
│   ├── flows/
│   │   └── registry.js           ← preset flow definitions, structure locked below
│   └── templates/
│       ├── ac_email_1.html       ← abandoned cart email 1 (HTML in flow1.js)
│       ├── ac_email_2.html       ← abandoned cart email 2 (HTML in flow1.js)
│       └── ac_email_3.html       ← abandoned cart email 3 (HTML in flow1.js)
│
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

Do not create files outside this structure without explicit instruction.

---

## Environment variables

### backend/.env — never commit
```
PORT=3001
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://api.mailo.app
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=              # 64 hex chars = 32 bytes
                             # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DODO_API_KEY=                # add in Phase 9
DODO_WEBHOOK_SECRET=         # add in Phase 9
NODE_ENV=development
```

### frontend/.env — never commit
```
VITE_API_URL=http://localhost:3001
```

Always keep .env.example files committed and in sync with real .env files. Never commit .env.

---

## Supabase schema — EXACT. Do not alter column names or types.

```sql
-- supabase/migrations/001_initial.sql

create table brands (
  id             uuid primary key default gen_random_uuid(),
  shop_domain    text not null unique,
  logo_url       text,
  colours        jsonb,          -- { primary, secondary, accent, background }
  fonts          jsonb,          -- { display: { name, url }, body: { name, url } }
  tone_words     text[],
  product_images jsonb,          -- [{ url, alt, productName, price }]
  raw_scrape     jsonb,          -- full dump for debugging
  gaps           text[],         -- fields we couldn't detect: ['logo', 'fonts']
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table accounts (
  id                   uuid primary key default gen_random_uuid(),
  shop_domain          text not null unique,
  shopify_access_token text,     -- AES-256-GCM encrypted
  shopify_scope        text,
  klaviyo_api_key      text,     -- AES-256-GCM encrypted
  klaviyo_account_id   text,
  klaviyo_account_name text,
  sms_number           text,
  from_email           text,
  from_label           text,
  connected_at         timestamptz,
  updated_at           timestamptz default now()
);

create table flows (
  id              uuid primary key default gen_random_uuid(),
  shop_domain     text not null,
  flow_type       text not null,  -- matches key in flows/registry.js
  klaviyo_flow_id text,
  config          jsonb,          -- user's option selections from wizard
  status          text default 'idle',  -- 'live' | 'draft' | 'idle'
  deployed_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table campaigns (
  id                  uuid primary key default gen_random_uuid(),
  shop_domain         text not null,
  klaviyo_campaign_id text,
  theme               text,
  style               text,
  send_date           date,
  status              text,
  created_at          timestamptz default now()
);

-- Phase 9: add subscriptions table when billing is implemented
-- create table subscriptions (
--   id                uuid primary key default gen_random_uuid(),
--   shop_domain       text not null unique,
--   dodo_customer_id  text,
--   dodo_sub_id       text,
--   plan              text,       -- 'starter' | 'growth' | 'scale'
--   status            text,       -- 'active' | 'cancelled' | 'past_due'
--   current_period_end timestamptz,
--   created_at        timestamptz default now(),
--   updated_at        timestamptz default now()
-- );
```

RLS is off. Server uses service key. Add RLS + user auth in a future phase (not in scope).

---

## Klaviyo account — Dr. Water (real IDs, use these)

```
Account ID:  TmnC6g
Timezone:    US/Eastern
Currency:    USD
```

### Key metric IDs — reference only, always look up dynamically

```
TvPeUR   Added to Cart                  ← trigger: abandoned cart flow
WYQDi7   Checkout Started               ← trigger: checkout abandonment flow
XBRFUJ   Placed Order                   ← trigger: post-purchase + winback flows
V7Mvse   Viewed Product                 ← trigger: browse abandonment flow
SHmEdY   Subscribed to List             ← trigger: welcome series flow
QYxWa3   Subscribed to Back in Stock    ← trigger: back-in-stock flow
TfHAWZ   Added to Cart - Triple Pixel   ← alternate ATC (Triple Pixel)
WCGB6i   Checkout Started - Triple Pixel← alternate checkout (Triple Pixel)
```

CRITICAL: Always look up metric IDs dynamically by name at deploy time.
Never hardcode these IDs in flow creation payloads.
They are listed here for documentation only — they will differ for other customers.

### Key list + segment IDs

```
Lists:
TYYUKf   Email List                          ← primary email signup list
TsB8u2   SMS List                            ← primary SMS list
XzQFLd   Preview List                        ← for test sends

Segments:
TavdPF   All Email-Deliverable               ← primary campaign audience
WajWyB   Engaged-45 (safe)                   ← high-deliverability sends
SqzERL   Unengaged-180 (suppress)            ← exclude from campaigns
SeD9M2   Over-contacted (4 in 7d)            ← suppress from flows
RjMAqk   Shopify Customers (all-time buyers) ← winback targeting
Y7K4FF   SMS Subscribers                     ← SMS campaign audience
```

### Sender + SMS config

```
from_email:  support@drwater.store
from_label:  Dr. Water
reply_to:    support@drwater.store
sms_from:    +18666422719
```

### Live flows in account — DO NOT redeploy these

```
SDGXEW   Started Checkout Revised Flow (Jan 7 '26)      [live]
SRXYfk   Warranty Flow for Reviews                      [live]
TrnS4w   testing one time buyers a2c                    [live]
UhRKiu   Added to Cart Flow 1 (17th Oct)                [live]
UimUbZ   awareness to interest                          [live]
VSNpB7   Post Purchase Emails Jan 12 2026               [live]
Vttfnh   Customer Winback - Standard                    [live]
WuPBmu   Drip Flow Going Forward                        [live]
X2TyrS   Customer Feedback call                         [live]
XdWNq4   Post Purchase (16th Sept) HydroPitcher (Final) [live]
XzFTdz   Post Purchase (16th Sept) HydroStanley (Final) [live]
```

Before deploying any flow, check the flows table for an existing live entry with the same
shop_domain + flow_type. If one exists, do not deploy again — return the existing record.

### Welcome series templates already in Klaviyo

```
RqhacZ   Welcome Series: Email 1
TtiNMu   Welcome Series: Email 2
Y4EE4W   Welcome Series: Email 3
T6LMfp   Welcome Series: Email 4
Wh5wzK   Welcome Series: Email 5
RKgVAW   Welcome Series: Email 6
SkSe7q   Welcome Series: Email 7
Smtu9L   Welcome Series: Email 8
```

---

## Klaviyo API — critical patterns. Do not deviate.

### Two clients required — use the right one

```js
// lib/klaviyoClient.js
const axios = require('axios');

function makeKlaviyoClient(apiKey, beta = false) {
  return axios.create({
    baseURL: 'https://a.klaviyo.com/api',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: beta ? '2024-10-15.pre' : '2024-02-15',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

module.exports = { makeKlaviyoClient };
```

Standard client (beta = false): everything except flow creation.
Beta client (beta = true): ONLY for POST /flows/ and GET /flows/:id/. Nothing else.

### Pagination — use Klaviyo's links.next directly

```js
async function klaviyoGetAll(client, path) {
  const results = [];
  let url = path;
  while (url) {
    const res = await client.get(url);
    results.push(...(res.data.data || []));
    url = res.data.links?.next || null; // always a full absolute URL
  }
  return results;
}
```

Never construct pagination URLs manually. links.next handles everything.

### Metric ID lookup — always dynamic

```js
// CORRECT
const metrics = await klaviyoGetAll(client, '/metrics/');
const metric = metrics.find(m => m.attributes.name === 'Checkout Started');
if (!metric) throw new Error("Metric 'Checkout Started' not found in this account");
const metricId = metric.id;

// WRONG — never hardcode
const metricId = 'WYQDi7';
```

### Flow creation structure — from flow1.js, proven working

```js
// POST /flows/ — MUST use beta client
{
  data: {
    type: 'flow',
    attributes: {
      name: 'Flow Name',
      definition: {
        triggers: [{ type: 'metric', id: METRIC_ID, trigger_filter: null }],
        profile_filter: null,
        entry_action_id: 'delay_first',
        actions: [
          {
            temporary_id: 'delay_first',
            type: 'time-delay',
            links: { next: 'email_1' },
            data: {
              unit: 'hours', value: 1, secondary_value: 0,
              timezone: 'profile', delay_until_time: null, delay_until_weekdays: null
            }
          },
          {
            temporary_id: 'email_1',
            type: 'send-email',
            links: { next: 'delay_2' },
            data: {
              message: {
                template_id: 'TPL_ID',
                subject_line: '...',
                preview_text: '...',
                from_email: 'support@drwater.store',
                from_label: 'Dr. Water',
                reply_to_email: 'support@drwater.store',
                cc_email: null,
                bcc_email: null,
              }
            }
          },
          {
            temporary_id: 'sms_final',
            type: 'send-sms',
            links: { next: null },
            data: { message: { body: 'SMS body. Reply STOP to unsubscribe.' } }
          }
        ]
      }
    }
  }
}
```

### Campaign creation — always all 5 steps in this exact order

```
Step 1: POST /campaigns/                                → get campaignId
Step 2: GET  /campaigns/{campaignId}/campaign-messages/ → get messageId
Step 3: POST /templates/                                → get templateId
Step 4: POST /campaign-message-assign-template/        → link template to message
Step 5: POST /campaign-send-jobs/                       → schedule
```

Step 4 payload:
```js
{ data: { type: 'campaign-message', id: messageId, relationships: { template: { data: { type: 'template', id: templateId } } } } }
```

Step 5 payload:
```js
{ data: { type: 'campaign-send-job', id: campaignId } }
```

Never skip steps. Never reorder. Each depends on the previous.

### Klaviyo Django tokens — must survive our interpolation untouched

```
{{ first_name|default:"there" }}
{{ event.extra.checkout_url }}
{% for item in event.extra.line_items %}
{% if item.vendor != "re:do" %}{% endif %}{% endfor %}
{{ item.product.images.0.src }}
{{ item.title }}{{ item.price }}{{ item.compare_at_price }}
{{ unsubscribe_url }}
```

Our tokens: {{noSpaces}} — Klaviyo tokens: {{ withSpaces }}
Renderer must not touch {{ }} that aren't in our token map.

---

## Abandoned cart flow — exact sequence (from flow1.js)

```
T+0    Trigger: Added to Cart (metric: TvPeUR — look up dynamically)
T+1h   Email 1: "You left something behind"
T+3h   SMS 1:   Cart reminder
T+24h  Email 2: "Still thinking about it?"
T+25h  SMS 2:   Urgency / social proof
T+72h  Email 3: "Last chance — 10% off"  coupon: DRWATER10
T+73h  SMS 3:   Final push, code expires
```

HTML for all 3 emails is in flow1.js (EMAIL_1_HTML, EMAIL_2_HTML, EMAIL_3_HTML).
Copy exactly into backend/templates/ac_email_1.html, ac_email_2.html, ac_email_3.html.
Templates already have the correct vendor filter (skip re:do items). Do not remove it.

---

## Flow registry — structure locked

```js
// flows/registry.js — DO NOT change structure. Only add entries.
// Keys = flow_type stored in DB flows table.

module.exports = {
  abandoned_cart: {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    description: 'Recover shoppers who added to cart but did not checkout',
    trigger_metric_name: 'Added to Cart',
    estimated_revenue: '$1,200/mo avg',
    email_templates: ['ac_email_1', 'ac_email_2', 'ac_email_3'],
    sms_templates:   ['ac_sms_1', 'ac_sms_2', 'ac_sms_3'],
    steps: [], // populated from flow1.js action definitions
  },
  checkout_abandonment: {
    id: 'checkout_abandonment',
    name: 'Checkout Abandonment',
    description: 'Catch customers who reached checkout but did not finish',
    trigger_metric_name: 'Checkout Started',
    estimated_revenue: '$900/mo avg',
    email_templates: [], sms_templates: [], steps: [],
  },
  welcome_series: {
    id: 'welcome_series',
    name: 'Welcome Series',
    description: 'Convert new subscribers into first-time buyers',
    trigger_metric_name: 'Subscribed to List',
    estimated_revenue: '$640/mo avg',
    // Dr. Water existing template IDs: RqhacZ TtiNMu Y4EE4W T6LMfp Wh5wzK RKgVAW SkSe7q Smtu9L
    email_templates: [], sms_templates: [], steps: [],
  },
  post_purchase: {
    id: 'post_purchase',
    name: 'Post-Purchase',
    description: 'Get reviews and suggest related products after order',
    trigger_metric_name: 'Placed Order',
    estimated_revenue: '$320/mo avg',
    email_templates: [], sms_templates: [], steps: [],
  },
  winback: {
    id: 'winback',
    name: 'Win-Back',
    description: 'Re-engage customers inactive for 90+ days',
    trigger_metric_name: 'Placed Order',
    estimated_revenue: '$440/mo avg',
    email_templates: [], sms_templates: [], steps: [],
  },
  browse_abandonment: {
    id: 'browse_abandonment',
    name: 'Browse Abandonment',
    description: 'Follow up on product views that never became a cart add',
    trigger_metric_name: 'Viewed Product',
    estimated_revenue: '$270/mo avg',
    email_templates: [], sms_templates: [], steps: [],
  },
  back_in_stock: {
    id: 'back_in_stock',
    name: 'Back in Stock',
    description: 'Alert customers when their wishlist item is available',
    trigger_metric_name: 'Subscribed to Back in Stock',
    estimated_revenue: '$210/mo avg',
    email_templates: [], sms_templates: [], steps: [],
  },
};
```

---

## Encryption — exact implementation, no library

```js
// lib/encrypt.js
const crypto = require('crypto');

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
if (KEY.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');

function encrypt(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), encrypted.toString('hex'), tag.toString('hex')].join(':');
}

function decrypt(encoded) {
  const [ivHex, encHex, tagHex] = encoded.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
```

Rules: encrypt before DB write, decrypt only in the route that needs it, never log or return raw values.

---

## Shopify OAuth — exact flow

```
GET /auth/shopify?shop=example.myshopify.com
  → validate: shop must match *.myshopify.com
  → generate random nonce, store in signed cookie
  → redirect to Shopify OAuth consent screen

GET /auth/shopify/callback?code=...&hmac=...&shop=...&state=...
  → 1. validate state matches cookie (CSRF protection)
  → 2. validate HMAC — mandatory, see below
  → 3. POST https://{shop}/admin/oauth/access_token
  → 4. encrypt token, upsert into accounts table
  → 5. redirect to {FRONTEND_URL}/?shop={shop}
```

Scopes: `read_products,read_orders,read_customers,read_script_tags,write_script_tags`

### HMAC validation — mandatory, no exceptions

```js
function validateShopifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${Array.isArray(rest[k]) ? rest[k].join(',') : rest[k]}`)
    .join('&');
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest, 'hex'),
    Buffer.from(hmac, 'hex')
  );
}
// HMAC fails → return 401, log attempt, do not proceed
```

---

## Brand scraping

```
POST /api/brand/analyse  { shopDomain: "drwater.store" }

1. GET https://{shopDomain}  User-Agent: 'Mozilla/5.0 (compatible; Mailo/1.0)'  Timeout: 10s
2. Parse with cheerio
3. Colours: CSS custom properties → computed header bg → button colour → gap if none
4. Logo: header img with 'logo' in class/alt → apple-touch-icon → upload to Supabase → gap if none
5. Fonts: fetch linked stylesheets → parse @font-face → first 2 families → gap if none
6. Products: GET https://{shopDomain}/products.json?limit=4 (always public, no auth)
7. Upsert to brands table. Return { brand, gaps: ['logo'] }
```

Gap upload: `POST /api/brand/upload` multipart — logo, fontDisplay, fontBody files.
Upload to Supabase Storage, update brands row, remove from gaps[].

Never throw on partial scrape failure. Catch each step individually, add to gaps[], continue.

---

## Email template system

Templates: backend/templates/*.html — ALL CSS INLINE. Email clients strip style tags.

Our tokens: `{{tokenName}}` (no spaces)
Klaviyo tokens: `{{ django_var }}` (with spaces)
They are deliberately different and will not collide.

### Token reference
```
{{brand.primary}} {{brand.secondary}} {{brand.accent}}
{{brand.fontDisplay}} {{brand.fontDisplayUrl}}
{{brand.fontBody}} {{brand.fontBodyUrl}}
{{brand.logoUrl}} {{brand.name}}
{{product.imageUrl}} {{product.name}} {{product.price}}
{{coupon}} {{coupon.discount}}
{{store.url}}
```

### Renderer
```js
function renderTemplate(html, brand, variables = {}) {
  const tokens = {
    'brand.primary':        brand.colours?.primary        || '#000000',
    'brand.secondary':      brand.colours?.secondary      || '#333333',
    'brand.accent':         brand.colours?.accent         || '#ffffff',
    'brand.fontDisplay':    brand.fonts?.display?.name    || 'Arial, sans-serif',
    'brand.fontDisplayUrl': brand.fonts?.display?.url     || '',
    'brand.fontBody':       brand.fonts?.body?.name       || 'Arial, sans-serif',
    'brand.fontBodyUrl':    brand.fonts?.body?.url        || '',
    'brand.logoUrl':        brand.logo_url                || '',
    'brand.name':           brand.shop_domain?.split('.')[0] || 'Store',
    'product.imageUrl':     brand.product_images?.[0]?.url        || '',
    'product.name':         brand.product_images?.[0]?.productName || '',
    'product.price':        brand.product_images?.[0]?.price      || '',
    'store.url':            brand.shop_domain || '',
    ...variables,
  };
  // Match {{token}} only — leave {{ klaviyo_tokens }} untouched
  return html.replace(/\{\{([^\s}][^}]*)\}\}/g, (match, key) => {
    const val = tokens[key.trim()];
    return val !== undefined ? val : match;
  });
}
```

---

## Express app structure

```js
// backend/index.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use('/auth',          require('./routes/auth'));
app.use('/api/brand',     require('./routes/brand'));
app.use('/api/flows',     require('./routes/flows'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/templates', require('./routes/templates'));
// app.use('/api/billing', require('./routes/billing')); // Phase 9

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(process.env.PORT || 3001, () => console.log('Mailo backend running'));
```

Rules: try/catch + next(err) in every route. Always res.json(). Success: { data } Error: { error }.
Prefix console.error with [ERROR] for Railway log filtering.

---

## Frontend API client — all calls through here

```js
// frontend/src/lib/api.js
const BASE = import.meta.env.VITE_API_URL;

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json.data;
}

export const api = {
  brand: {
    analyse: (shopDomain) => request('POST', '/api/brand/analyse', { shopDomain }),
    get:     (shopDomain) => request('GET', `/api/brand/${shopDomain}`),
    upload:  (formData)   => fetch(`${BASE}/api/brand/upload`, { method: 'POST', body: formData }).then(r => r.json()),
  },
  klaviyo: {
    connect: (shopDomain, apiKey) => request('POST', '/api/klaviyo/connect', { shopDomain, apiKey }),
  },
  flows: {
    list:   (shopDomain) => request('GET', `/api/flows/${shopDomain}`),
    deploy: (shopDomain, flowType, config) => request('POST', '/api/flows/deploy', { shopDomain, flowType, config }),
  },
  campaigns: {
    schedule: (payload) => request('POST', '/api/campaigns/schedule', payload),
  },
};
```

No fetch calls in screen components. All API calls through api.js. No exceptions.

---

## Frontend design rules

The prototype (mailo-v4.jsx) is the exact design spec. Match it pixel-for-pixel.

- Typography: JustSans (body) + Anatoleum (display). Copy @font-face URLs from prototype FONT_CSS exactly.
- Tokens: copy the ui{} object from prototype exactly into src/lib/tokens.js.
- Styles: inline JS style objects only. No Tailwind. No CSS files. No CSS modules.
- Routing: useState in App.jsx. No React Router.
- Icons: all in Icons.jsx, named exports, inline SVGs only. No icon library.
- Shell: do NOT use position:fixed or 100vh — keep it embeddable for future App Store upgrade.

### Emoji removal map

| Location                          | Remove         | Replace with                     |
|-----------------------------------|----------------|----------------------------------|
| Nav + auth logo                   | ✉️             | IconMail SVG                     |
| Shopify connect card              | 🛍             | IconBag SVG                      |
| Klaviyo connect card              | 📧             | IconMail SVG                     |
| Auth success + flow launched      | 🎉 🚀          | IconCheck in animated circle     |
| Dashboard brand nudge             | ✅             | IconCheckSmall green SVG         |
| FlowCard: Abandoned Cart          | 🛒             | IconCart                         |
| FlowCard: Checkout                | 💳             | IconCreditCard                   |
| FlowCard: Welcome                 | 👋             | IconWave                         |
| FlowCard: Win-Back                | 🔄             | IconRefresh                      |
| FlowCard: Post-Purchase           | 📦             | IconBox                          |
| FlowCard: Browse Abandonment      | 👁             | IconEye                          |
| FlowCard: Back in Stock           | 📬             | IconBell                         |
| FlowCard: Price Drop              | 🏷             | IconTag                          |
| Sequence step email / SMS         | 📧 💬          | IconMail / IconMessage size=14   |
| Campaign themes + styles          | all emojis     | Text labels only                 |
| Calendar events                   | all emojis     | Text only                        |
| Urgency bar, buttons, placeholders| ⏳ 🚀 💧       | Text only / gray div             |
| SMS body copy                     | 💧 👋 ⚡ 🙌    | Remove from SMS text             |
| Coming soon screens               | 📈 ⚙️          | Remove entirely                  |

---

## What NOT to do — absolute prohibitions

### Architecture
- Do NOT add user login/auth in this phase. Shop domain is the identity.
- Do NOT add Redis, Bull, BullMQ, or any queue.
- Do NOT use Next.js, Remix, or any meta-framework.
- Do NOT add TypeScript. Plain JS throughout.
- Do NOT write unit tests in this phase.
- Do NOT add Docker.
- Do NOT implement billing before Phase 9.

### Klaviyo
- Do NOT hardcode metric IDs, list IDs, or segment IDs in flow payloads.
- Do NOT use beta client except for POST /flows/ and GET /flows/:id/.
- Do NOT skip any of the 5 campaign creation steps.
- Do NOT use Klaviyo OAuth. Private API key only.
- Do NOT deploy a flow if flows table already has a live entry for that shop_domain + flow_type.

### Shopify
- Do NOT skip HMAC validation. Ever.
- Do NOT use Buffer comparison shortcuts — use crypto.timingSafeEqual.
- Do NOT request more scopes than listed.

### Security
- Do NOT store raw keys or tokens. Always encrypt first.
- Do NOT return decrypted values to the frontend.
- Do NOT log request bodies that may contain keys.
- Do NOT commit .env files.

### Frontend
- Do NOT change the design. Prototype is the spec.
- Do NOT add any component library.
- Do NOT use Tailwind.
- Do NOT add React Router.
- Do NOT use position:fixed or 100vh in the Shell (embeddability requirement).
- Do NOT add emojis.
- Do NOT make API calls from screen components.

---

## Build phases — update as you go

| #  | Phase                               | Status  | Notes                                           |
|----|-------------------------------------|---------|-------------------------------------------------|
| 0  | Repo scaffold + health check        | DONE    | Both servers run, GET /health → 200             |
| 1  | Supabase schema + migration         | DONE    | Schema corrected — shop_domain identity, run 001_initial.sql in Supabase dashboard |
| 2  | Brand scraping endpoint             | DONE    | scrapeBrand() + /api/brand/analyse + /upload    |
| 3  | Shopify OAuth                       | DONE    | HMAC validation, cookie nonce, redirect flow    |
| 4  | Klaviyo connect + validate          | DONE    | /auth/klaviyo/connect — validates key, encrypts |
| 5  | Flow registry + deploy endpoint     | DONE    | ATC flow + email templates + POST /api/flows/deploy |
| 6  | Email template engine + renderer    | DONE    | ac_email_1/2/3.html with {{brand.*}} tokens     |
| 7  | Campaign planner backend            | DONE    | Full 5-step Klaviyo pipeline in /api/campaigns/schedule |
| 8  | Frontend — wire to API + swap icons | DONE    | All screens implemented, useState routing, no emojis |
| 9  | Dodo Payments billing               | TODO    | Subscription creation, webhook, middleware      |
| 10 | Deployment (Railway + Vercel)       | TODO    | Env vars, CORS locked, health check in prod. Needs Supabase Storage bucket 'brand-assets' |

Mark [WIP] while in progress. Mark DONE when complete and tested.
Update this table before ending every Claude Code session.

---

## Reference files at repo root

| File           | What it is                                         | Use it for                              |
|----------------|----------------------------------------------------|-----------------------------------------|
| flow1.js       | Working ATC flow creation — proven against Klaviyo | Exact flow API patterns + email HTML    |
| 27feb.js       | Working campaign creation + scheduling             | Exact campaign API patterns             |
| mailo-v4.jsx   | Complete frontend prototype, all screens           | Pixel-perfect design reference          |
| export.json    | Full Klaviyo account dump                          | Real IDs, segments, flow names          |

---

## How to start every Claude Code session

```bash
claude "read MAILO_CONTEXT.md completely, then tell me the current phase status and what to build next"
```

Do not skip this. Update the phase table above before closing every session.

---

*Last updated: 23Feb 2026. Shopify model: unlisted custom app. Payments: Dodo Payments.*

Update 24 Feb:
# MAILO_CONTEXT.md
> Living product document. Last updated: Feb 24, 2026.
> For Claude Code and future Claude sessions — read this before writing a single line.

---

## 0. What This Document Is

This is the single source of truth for building Mailo. It contains the product philosophy, technical stack, database schema, API patterns, competitive context, design system, and step-by-step MVP plan. When in doubt about a product decision, the answer is in here.

---

## 1. The Problem (Raw, From The Market)

These are real quotes from r/shopify and r/ecommerce founders. They are more important than any competitor analysis. Build for these people.

> "This is honestly the biggest hurdle when you're doing everything yourself. I've spent way too many nights in that exact same 'Klaviyo hell' where a 30-minute task somehow eats your entire evening because the design blocks won't align or the mobile view looks like a mess. It's that 'execution gap' that kills you — by the time you finally hit live, you're too burnt out to even think about the next campaign."
> — u/Upbeat-Pressure8091

> "Most people I know are spending crazy amounts of time just editing AI copy to sound even halfway human, then still tweaking it for each campaign and segment."
> — u/Difficult_Buffalo544

> "Honestly, the issue usually isn't design — it's message sequencing and psychology. Step 1: Identify buyer objection. Step 2: Generate emotional + logical hooks. Step 3: Create urgency variants. Step 4: Refine subject lines with A/B versions. You're not just writing one email — you're building a conversion flow."
> — u/child-eater404

> "You are making this harder than it needs to be. An abandoned cart flow should not take 3 hours unless you are rebuilding your brand from scratch every time. The issue is not Klaviyo. It is that you are treating repeatable retention work like custom creative work. You need one working template, one clear trigger, and copy that sounds human."
> — u/JMALIK0702

> "I see some YouTube videos claiming 35% of store revenue from emails, and then I try to get to at least 20% of it. At some months I get there, but it has taken too much of my time but there's still potential. The ROI is good (20% of a $100k store is $20k on a $600 investment), but what if I put that same amount of time in another ad that blew up?"
> — u/Specific_Whereas305 (OP)

> "You're not wrong about the timing window. A lot of revenue gets missed simply because flows take too long to build and launch."
> — u/Skull_Tree

**The signal:** Founders know email works. They know they're leaving money. They're not leaving it because they don't care — they're leaving it because the execution cost in time and cognitive load is too high. That's the problem Mailo solves. Not email strategy. Execution.

---

## 2. Product Philosophy

### The North Star
Mailo is the AI employee for email retention. The founder makes one decision — what's the offer, what's the narrative this month — and Mailo handles everything else. Copy. Design. Segmentation. Flow logic. Timing. Deploy to Klaviyo. Done.

### The Quality Bar: Three Reference Products

**Eltie** — Our direct competitor and our baseline. Campaigns only (no flows), no audit layer, brand execution is weak (pulls fonts incorrectly, templatized section layout). We beat Eltie on: flows, audit quality, brand voice fidelity, and depth of Klaviyo integration. Eltie is the floor, not the ceiling.

**Chronicle HQ** — "AI presentations. Without the slop." Team from McKinsey/BCG/Apple. Every output feels like a real creative professional made it, not an AI. Mailo's emails should feel this way. Not AI-generated. Branded. Intentional. Human.

**Alia** — Smart, opinionated, beautifully crafted. Not one extra feature. Not one unnecessary screen. The craft is visible in what's missing as much as what's there. Every interaction feels considered.

### What "Not Slop" Means For Mailo Specifically

When someone connects their Klaviyo account and sees their brand for the first time in an email preview, it has to feel real immediately. Their actual colours. Their actual font. Their logo. A real product image from their catalogue. If it looks like a generic AI email, we've failed at the first impression and there is no second one.

The email preview is not a prototype. It is the product.

### What The Founder Should Never Touch

These are things Mailo handles invisibly without asking:
- Writing email copy once the offer/angle is decided
- Designing email layout and pulling brand assets
- Choosing the right segment for the send
- Setting up flow logic (triggers, timing, filters, suppression)
- Scheduling send times
- Mobile rendering across clients
- UTM parameters
- Suppressing unengaged profiles
- Updating flows when products change in Klaviyo

These are things only the founder can decide (Mailo asks for these and nothing else):
- What is the offer? (only they know margins)
- What is the narrative this month?
- Which products to feature right now?
- Is this the right time for a promotion?
- External brand moments (press hits, collabs, seasonal events)

**If the founder is doing anything from the first list, the product has failed.**

---

## 3. The Ideal Mailo Monday Morning

Not a dashboard with 20 charts. This:

```
Good morning. Here's what I'm watching for Dr. Water this week.

① Campaign opportunity
Your Engaged-45 segment hasn't heard from you in 11 days.
I've drafted a campaign around your top-selling product. Want to see it?

② Flow improvement
Your welcome series email 3 has a 9% click rate vs 18% average for your
category. I've rewritten it. Want to review?

③ Revenue gap
340 people hit checkout in the last 7 days and didn't complete. Your
abandoned cart flow isn't live. I can deploy it today.
Estimated recovery: ~$1,200 this month.

What would you like to focus on?
```

Founder clicks one. Sees the draft. Adjusts the offer if margins change. Approves. 10 minutes of thinking, zero minutes of execution.

---

## 4. Tech Stack

### Backend
- **Runtime:** Node.js 20 (LTS)
- **Framework:** Express 4.x
- **Database:** Supabase (PostgreSQL)
- **Encryption:** AES-256-GCM for all OAuth tokens
- **Session:** JWT with refresh tokens

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Charts:** Recharts
- **State:** useState / useContext (no Redux)
- **Fonts:** JustSans (body), Anatoleum (display) — hosted on Shopify CDN

### External APIs
- **Klaviyo:** REST API v3 — campaigns, flows, lists, segments, metrics, profiles
- **Shopify:** OAuth via unlisted custom app (not public marketplace)
- **Dodo Payments:** Billing

---

## 5. Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE klaviyo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  api_key_encrypted TEXT NOT NULL,
  account_id TEXT,
  company_name TEXT,
  timezone TEXT,
  currency TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE TABLE brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT,
  font_display TEXT,
  font_body TEXT,
  logo_url TEXT,
  tone_words TEXT[],
  voice_sample TEXT,
  website_url TEXT,
  product_catalogue JSONB,
  UNIQUE(user_id)
);

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  flows_live INTEGER,
  flows_missing TEXT[],
  lists_count INTEGER,
  segments_count INTEGER,
  metrics_snapshot JSONB,
  estimated_monthly_gap NUMERIC,
  recommendations JSONB
);

CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  klaviyo_flow_id TEXT,
  type TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'draft',
  email_count INTEGER DEFAULT 0,
  emails JSONB,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  klaviyo_campaign_id TEXT,
  name TEXT,
  subject TEXT,
  preview_text TEXT,
  segment_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  email_html TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dodo_subscription_id TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Email Object Schema (inside flows.emails JSONB)
```json
{
  "position": 1,
  "delay_hours": 1,
  "subject": "You left something behind",
  "preview_text": "Your cart is waiting — here's a reminder",
  "purpose": "reminder",
  "objection_handled": null,
  "html": "...",
  "klaviyo_message_id": null
}
```

---

## 6. Klaviyo API Patterns

### Authentication
```
Authorization: Klaviyo-API-Key {key}
revision: 2024-10-15
```

### Key Endpoints
```
GET  /api/accounts/
GET  /api/lists/?page[size]=100
GET  /api/segments/?page[size]=100
GET  /api/flows/?page[size]=50
GET  /api/metrics/?page[size]=100
GET  /api/campaigns/?filter=...
POST /api/campaigns/
POST /api/campaigns/{id}/campaign-messages/
POST /api/flows/
POST /api/flow-actions/
POST /api/templates/
POST /api/campaigns/{id}/campaign-send-jobs/
```

### Pagination Pattern (v3 API)
```javascript
async function fetchAllPages(endpoint, params = {}) {
  const results = [];
  let cursor = null;
  do {
    const url = new URL(`https://a.klaviyo.com${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (cursor) url.searchParams.set('page[cursor]', cursor);
    const res = await fetch(url, { headers: klaviyoHeaders });
    const data = await res.json();
    results.push(...(data.data || []));
    cursor = data.links?.next
      ? new URL(data.links.next).searchParams.get('page[cursor]')
      : null;
  } while (cursor);
  return results;
}
```

### Flow Creation Reference
See `flow1.js`. Key steps:
1. Create flow with trigger `metric` on Checkout Started metric ID
2. Add time delay action (1 hour)
3. Add email action with template HTML
4. Add second time delay (23 hours → 24h total from trigger)
5. Add second email action
6. Add third time delay (48 hours → 72h total)
7. Add third email action
8. All actions chain via `relationships.flow-action`

### Campaign Creation Reference
See `27feb.js`. Steps:
1. `POST /api/campaigns/` with name, audiences
2. `POST /api/campaigns/{id}/campaign-messages/` with content
3. `POST /api/templates/` to create HTML template
4. `POST /api/campaigns/{id}/campaign-send-jobs/` with `send_time`

### Token Encryption (AES-256-GCM)
```javascript
const crypto = require('crypto');
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(data) {
  const [ivHex, tagHex, encHex] = data.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}
```

---

## 7. Dr. Water Account Reference

- **Account ID:** `WdY6cU`
- **Metrics:** 86 | **Lists:** 14 | **Segments:** 15 | **Live Flows:** 11
- **Key IDs:** see `export.json`

### Known Gaps (Feb 2026)
- Abandoned cart flow: not live (highest priority)
- Welcome series email 3: 9% CTR vs 18% category average
- Post-purchase flow: exists but stale (4 months old)

---

## 8. MVP Scope

### The Three Things That Prove Craft

**1. Audit Screen**

On Klaviyo connect, Mailo reads the entire account and surfaces:
- Flow gap analysis (what's running vs what should be running)
- Revenue gap in plain language ("~$1,200/month missing from no abandoned cart flow")
- Benchmark comparison ("Your welcome series open rate is 38% vs 45% DTC average")
- Ordered recommendations with one action button each

One screen. Clear language. A diagnosis, not a dashboard. This is the demo for cold outreach.

**2. Brand Voice Capture**

Before generating anything:
1. Read last 10 sent Klaviyo campaigns
2. Scrape website product page + about page if URL provided
3. Identify: tone words, sentence patterns, vocabulary level, formality, humour
4. Generate tone profile (stored in `brand_profiles.voice_sample`)
5. Show founder a sample email: "Does this sound like you?"

If the sample sounds generic, the product has failed. This is what Eltie got wrong.

**3. Abandoned Cart Flow — One-Click Deploy**

Three emails, structured psychologically:

Email 1 (1hr): Soft reminder. Actual product image + name from Klaviyo catalogue. Brand colours, font, voice.

Email 2 (24hr): Handle the most likely objection for the product category. Price, trust, or "is this right for me" — identify which and address it directly.

Email 3 (72hr): Real urgency. Low stock signal from Shopify data if available. No fake countdown timers.

Deployed directly via Klaviyo API. Live and triggering within minutes of founder approval. Not a preview. Not an export.

---

## 9. UI Design System

### Colour Tokens
```javascript
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
```

### Typography
- Display: Anatoleum | Body: JustSans | Fallback: DM Sans, system-ui
- Scale: 11 / 12 / 13 / 14 / 15 / 28px
- Weights: 400 body / 500 labels / 600 buttons / 700 KPI

### Spacing
4px base unit: 4, 8, 12, 16, 20, 24, 32, 48. No exceptions.

### Components (from mailo-v4.jsx — use as-is)
- `<Btn>` — primary / secondary / ghost, sizes sm / md / lg
- `<Badge>` — neutral / success / warning
- `<Card>` — standard surface
- `<Divider>` — 1px borderSubdued
- `<Steps>` — onboarding progress
- `<MiniChart>` — 72px sparkline
- `<FullChart>` — 130px chart with KPI number

### Five Screens (Design In Figma Before Code)
1. Onboarding / Connect Klaviyo
2. Audit result — the first impression, most important screen
3. Flow builder — email list, timing, preview, deploy
4. Email preview + chat — left chat, right live branded preview
5. Dashboard / Home — Monday morning recommendations

### What Makes It Feel Real, Not Slop
Email preview: real brand colours + font + logo + real product image on first render. No placeholders.

Chat: "I can see you have 8,400 people on your welcome list and no welcome series running. Want to start there?" — not "How can I help?"

Loading states: "Reading your flows..." then "Analyzing open rates..." then "Comparing to benchmarks..." — never a bare spinner.

Transitions: content fades in (fadeIn). Nothing snap-loads.

---

## 10. Competitive Positioning

**Eltie (baseline we beat):** Campaigns only. No flows. No audit. Fonts pull wrong. $100/month. Our edge: flows + audit + voice that works.

**Klaviyo K:AI:** Reads URL, not account. Doesn't know what's running or missing. Our edge: we read the account and show the dollar value of each gap.

**Migma.ai:** Generic, ESP-agnostic, $8–24/month. Not Klaviyo-specific, no flows, no audit. Our edge: deep Klaviyo integration, D2C psychology in flows.

**The Gap Nobody Has Filled:**
No tool combines audit (what's missing + what it costs) + flows (deployed automated sequences, not exports) + brand execution (one-click, live in Klaviyo). Eltie does campaigns. K:AI does flows generically. Nobody reads your actual performance data to show gaps in plain language and deploys the fix in the same session.

**Everyone should say: "No other tool does THIS better than Mailo."**

---

## 11. Features: Now / Later / Never

**Now**
- Klaviyo audit on connect
- Brand voice capture
- Abandoned cart flow: generate + preview + deploy
- Welcome series: same treatment
- Campaign suggestion from account data (one intelligent suggestion, not a calendar)
- Email generation with voice applied, deploy to Klaviyo

**Later (after first 10 paying users)**
- Campaign calendar view
- Winback + post-purchase flows
- SMS
- Performance reporting (Mailo-attributed revenue)
- Background optimizations with weekly report
- Segment health view

**Never**
- Drag-and-drop email editor
- Template library with choices
- 20-metric analytics dashboard
- A/B test setup UI
- Anything requiring founder to write copy
- Team / agency features in Phase 1

---

## 12. Go-To-Market

**First 10 Users:** IIT-KGP network. Maximum feedback density, not maximum revenue. Watch where they get stuck. Fix it before opening further.

**The 5-Minute Demo:**
Connect Klaviyo → audit with real data → "You're missing $X/month" → build the flow → emails in their brand → deploy live → done. No slides. No pitch.

**Cold Outreach Angle:**
"I built a tool that reads your Klaviyo account and tells you exactly how much revenue you're leaving on the table. Free audit, no strings. Dr. Water found $1,800/month in gaps in 10 minutes."

The audit is the hook, demo, and conversion. Don't sell Mailo. Give the audit.

**After 10 paying users:** US/UK/AU stores doing $500K–$5M, running ads but underinvesting in email. Post on r/klaviyo, r/shopify.

---

## 13. Build Plan

**Week 1–2:** Figma only. All five screens at full fidelity. Audit screen first. Show to 3 store owners.

**Week 3–5:** Build: Klaviyo connect + audit engine + brand voice + abandoned cart flow.

**Week 6:** Ship to 5 people. Video call sessions. Record everything. Don't explain. Watch.

**Week 7–8:** Fix what's broken, based on recordings not opinions.

**Week 9+:** Welcome series → waitlist → invite-only → IIT-KGP → r/klaviyo.

---

## 14. The One Test

Before shipping anything: **"If someone showed me this as a demo, would I say 'no other tool does this better than Mailo'?"**

If no — it's not ready.

Eltie is the floor. Chronicle is the quality bar. Alia is the restraint bar. Mailo is all three, for email retention.

---

*Update this file after every major product decision.* -->

# MAILO_CONTEXT.md
> Single source of truth. Read this before writing a single line of code.
> Last updated: Feb 28, 2026.

---

## THE MISSION (ONE SENTENCE)

Connect Klaviyo → see what's missing → deploy it in one click → done. However rough. Ship first, make it smart later.

---

## WHAT CHANGED FROM LAST VERSION

The old context was over-engineered. We were building a sophisticated audit engine before having a working product. That's dead.

**New rules:**
- Audit = existence check only. Flow live? ✅ Skip. Not live? 🔴 Deploy button.
- No scoring. No RPFR. No benchmarking. No diagnostic trees. Not yet.
- Flows = hardcoded list of 10. Exact emails + SMS per flow. No wizard. No config.
- Campaigns = generate + deploy. Stop starting from zero every time.
- Intelligence comes later. Right now: make it DO things end to end.

---

## PRODUCT IN ONE PARAGRAPH

Mailo connects to a Shopify + Klaviyo store, checks which of 10 standard flows exist, deploys the missing ones in one click with brand-styled emails and SMS, and schedules campaigns without the founder writing a word. First customer: Dr. Water. Build for them first, generalise later.

---

## STACK — LOCKED. DO NOT CHANGE.

| Layer       | Choice                  | Constraint                              |
|-------------|-------------------------|-----------------------------------------|
| Frontend    | React + Vite            | No framework switch                     |
| Backend     | Node 20 LTS + Express   | Not Fastify, Hono, Next.js              |
| Database    | Supabase (Postgres)     | @supabase/supabase-js v2, service key   |
| File storage| Supabase Storage        | Logos and fonts only                    |
| HTTP client | axios                   | Do not swap                             |
| Scraping    | cheerio + node-fetch    | Not Puppeteer                           |
| Payments    | Dodo Payments           | Phase 9 only, skip for now              |
| Frontend host| Vercel                 | Auto-deploy from GitHub                 |
| Backend host| Railway                 | Single service                          |

---

## REPOSITORY STRUCTURE — EXACT

```
mailo/
├── MAILO_CONTEXT.md
├── .gitignore
├── .nvmrc                        ← "20"
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── screens/
│       │   ├── Auth.jsx
│       │   ├── Dashboard.jsx
│       │   ├── FlowsList.jsx
│       │   └── Campaigns.jsx
│       ├── components/
│       │   ├── Shell.jsx
│       │   ├── Btn.jsx
│       │   ├── Card.jsx
│       │   ├── Badge.jsx
│       │   └── Icons.jsx
│       └── lib/
│           ├── api.js
│           └── tokens.js
│
├── backend/
│   ├── package.json
│   ├── index.js
│   ├── routes/
│   │   ├── auth.js               ← /auth/shopify + /api/klaviyo/connect
│   │   ├── brand.js              ← /api/brand/*
│   │   ├── audit.js              ← /api/audit/:shopDomain
│   │   ├── flows.js              ← /api/flows/*
│   │   └── campaigns.js          ← /api/campaigns/*
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── klaviyoClient.js
│   │   ├── shopifyClient.js
│   │   ├── encrypt.js
│   │   └── scraper.js
│   ├── flows/
│   │   ├── registry.js           ← the 10 flows, hardcoded
│   │   └── deploy.js             ← deploys any flow from registry
│   └── templates/
│       ├── ac_email_1.html
│       ├── ac_email_2.html
│       ├── ac_email_3.html
│       └── [one html file per email across all flows]
│
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

---

## THE AUDIT — EXISTENCE CHECK ONLY

**This is the entire audit logic. Nothing more.**

```
For each of the 10 flows in the registry:
  → Check if a LIVE flow with that trigger metric exists in Klaviyo
  → Yes: mark ✅ LIVE, show estimated monthly revenue (static number from registry)
  → No: mark 🔴 MISSING, show "Deploy" button + estimated revenue recovery

Output: a list. 10 rows. Status + deploy button. That's it.
```

No open rates. No RPFR. No segmentation analysis. No benchmarks.
That all comes in a future version. Right now: exists or doesn't exist.

**Audit endpoint:** `GET /api/audit/:shopDomain`

Response shape:
```json
{
  "flows": [
    {
      "flow_type": "abandoned_cart",
      "name": "Abandoned Cart",
      "status": "live",
      "klaviyo_flow_id": "UhRKiu",
      "estimated_monthly_revenue": "$1,200"
    },
    {
      "flow_type": "welcome_series",
      "name": "Welcome Series",
      "status": "missing",
      "klaviyo_flow_id": null,
      "estimated_monthly_revenue": "$640"
    }
  ]
}
```

How to check if live: pull all flows from Klaviyo, match trigger_metric_name to each registry entry, check status === "live". If match found and live → live. Otherwise → missing.

---

## THE 10 FLOWS — HARDCODED. DO NOT ADD OR REMOVE WITHOUT UPDATING THIS FILE.

These are the only flows Mailo deploys. Every flow has a fixed sequence. No user configuration.

---

### Flow 1: Abandoned Cart
**Trigger:** Added to Cart (metric name: "Added to Cart")
**Sequence:**
- T+1h → Email 1: "You left something behind" (reminder, product image, no discount)
- T+3h → SMS 1: Short cart reminder with link
- T+24h → Email 2: "Still thinking about it?" (social proof / objection handle)
- T+25h → SMS 2: Urgency nudge
- T+72h → Email 3: "Last chance — 10% off" (discount, DRWATER10)
- T+73h → SMS 3: Final push, code expires

**Templates:** ac_email_1.html, ac_email_2.html, ac_email_3.html
**Estimated monthly revenue:** $1,200

---

### Flow 2: Checkout Abandonment
**Trigger:** Checkout Started (metric name: "Checkout Started")
**Sequence:**
- T+1h → Email 1: "You were so close" (direct checkout link)
- T+4h → SMS 1: Checkout link
- T+24h → Email 2: Trust / guarantee angle
- T+72h → Email 3: 10% off to close

**Templates:** co_email_1.html, co_email_2.html, co_email_3.html
**Estimated monthly revenue:** $900

---

### Flow 3: Welcome Series
**Trigger:** Subscribed to List (metric name: "Subscribed to List")
**Sequence:**
- T+0 → Email 1: Welcome + brand story
- T+1d → Email 2: Best seller spotlight
- T+3d → Email 3: Social proof / reviews
- T+5d → Email 4: 10% off first order
- T+7d → SMS 1: Final nudge on discount

**Templates:** ws_email_1.html through ws_email_4.html
**Estimated monthly revenue:** $640
**Note for Dr. Water:** existing templates RqhacZ–Smtu9L already in Klaviyo. Use those instead of deploying new ones.

---

### Flow 4: Post-Purchase
**Trigger:** Placed Order (metric name: "Placed Order")
**Sequence:**
- T+1d → Email 1: Thank you + what to expect
- T+7d → Email 2: How to get the best results (product education)
- T+14d → Email 3: Review request
- T+30d → SMS 1: Refill / reorder nudge

**Templates:** pp_email_1.html, pp_email_2.html, pp_email_3.html
**Estimated monthly revenue:** $320

---

### Flow 5: Win-Back
**Trigger:** Placed Order (metric name: "Placed Order") — entry filter: last order > 90 days ago
**Sequence:**
- T+0 → Email 1: "We miss you" (soft re-engage)
- T+3d → Email 2: What's new / best seller
- T+7d → Email 3: 15% off to come back
- T+7d → SMS 1: Same offer via SMS

**Templates:** wb_email_1.html, wb_email_2.html, wb_email_3.html
**Estimated monthly revenue:** $440

---

### Flow 6: Browse Abandonment
**Trigger:** Viewed Product (metric name: "Viewed Product")
**Sequence:**
- T+4h → Email 1: "Still thinking about [product]?" (product image + link)
- T+24h → Email 2: Social proof for that product
- T+48h → SMS 1: Last nudge

**Templates:** ba_email_1.html, ba_email_2.html
**Estimated monthly revenue:** $270

---

### Flow 7: Back in Stock
**Trigger:** Subscribed to Back in Stock (metric name: "Subscribed to Back in Stock")
**Sequence:**
- T+0 → Email 1: "[Product] is back — grab it before it sells out again"
- T+4h → SMS 1: Same alert, shorter

**Templates:** bis_email_1.html
**Estimated monthly revenue:** $210

---

### Flow 8: SMS Welcome
**Trigger:** Subscribed to SMS List (metric name: "Subscribed to List" — SMS channel)
**Sequence:**
- T+0 → SMS 1: Welcome + 10% off code
- T+2d → SMS 2: Best seller nudge

**Estimated monthly revenue:** $180

---

### Flow 9: VIP / High-Value Customer
**Trigger:** Placed Order — entry filter: lifetime value > $300
**Sequence:**
- T+0 → Email 1: "You're one of our best customers" (exclusive early access angle)
- T+7d → Email 2: Product recommendation based on purchase history
- T+14d → SMS 1: VIP offer

**Templates:** vip_email_1.html, vip_email_2.html
**Estimated monthly revenue:** $380

---

### Flow 10: Price Drop
**Trigger:** Price Drop (metric name: "Price Drop Alert" — Klaviyo native)
**Sequence:**
- T+0 → Email 1: "[Product] price just dropped — here's your chance"
- T+4h → SMS 1: Same alert

**Templates:** pd_email_1.html
**Estimated monthly revenue:** $150

---

## FLOW REGISTRY — flows/registry.js

```js
module.exports = {
  abandoned_cart: {
    id: 'abandoned_cart',
    name: 'Abandoned Cart',
    trigger_metric_name: 'Added to Cart',
    estimated_monthly_revenue: '$1,200',
    steps: [
      { type: 'time-delay', hours: 1 },
      { type: 'send-email', template: 'ac_email_1', subject: 'You left something behind', preview: 'Your cart is waiting' },
      { type: 'time-delay', hours: 2 },
      { type: 'send-sms', body: "Hey {{first_name|default:'there'}} — you left something in your cart. Grab it here: {{ event.extra.checkout_url }} Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 21 },
      { type: 'send-email', template: 'ac_email_2', subject: 'Still thinking about it?', preview: 'Here\'s why others love it' },
      { type: 'time-delay', hours: 1 },
      { type: 'send-sms', body: "Still on the fence? Thousands of customers swear by it. {{ event.extra.checkout_url }} Reply STOP to unsubscribe." },
      { type: 'time-delay', hours: 47 },
      { type: 'send-email', template: 'ac_email_3', subject: 'Last chance — 10% off inside', preview: 'Use code DRWATER10 before it expires' },
      { type: 'time-delay', hours: 1 },
      { type: 'send-sms', body: "Final reminder — use DRWATER10 for 10% off before it expires. {{ event.extra.checkout_url }} Reply STOP to unsubscribe." },
    ]
  },
  checkout_abandonment: {
    id: 'checkout_abandonment',
    name: 'Checkout Abandonment',
    trigger_metric_name: 'Checkout Started',
    estimated_monthly_revenue: '$900',
    steps: [] // populate same pattern
  },
  welcome_series: {
    id: 'welcome_series',
    name: 'Welcome Series',
    trigger_metric_name: 'Subscribed to List',
    estimated_monthly_revenue: '$640',
    steps: []
  },
  post_purchase: {
    id: 'post_purchase',
    name: 'Post-Purchase',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$320',
    steps: []
  },
  winback: {
    id: 'winback',
    name: 'Win-Back',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$440',
    steps: []
  },
  browse_abandonment: {
    id: 'browse_abandonment',
    name: 'Browse Abandonment',
    trigger_metric_name: 'Viewed Product',
    estimated_monthly_revenue: '$270',
    steps: []
  },
  back_in_stock: {
    id: 'back_in_stock',
    name: 'Back in Stock',
    trigger_metric_name: 'Subscribed to Back in Stock',
    estimated_monthly_revenue: '$210',
    steps: []
  },
  sms_welcome: {
    id: 'sms_welcome',
    name: 'SMS Welcome',
    trigger_metric_name: 'Subscribed to List',
    estimated_monthly_revenue: '$180',
    steps: []
  },
  vip: {
    id: 'vip',
    name: 'VIP / High-Value',
    trigger_metric_name: 'Placed Order',
    estimated_monthly_revenue: '$380',
    steps: []
  },
  price_drop: {
    id: 'price_drop',
    name: 'Price Drop',
    trigger_metric_name: 'Price Drop Alert',
    estimated_monthly_revenue: '$150',
    steps: []
  },
};
```

---

## DEPLOY LOGIC — flows/deploy.js

```
POST /api/flows/deploy  { shopDomain, flowType }

1. Load registry entry for flowType
2. Check flows table: if live entry exists for shop_domain + flow_type → return existing, do NOT redeploy
3. Look up trigger metric ID dynamically by name (never hardcode)
4. Load brand from brands table → render all email templates with brand tokens
5. For each email template: POST /templates/ to create in Klaviyo → get template ID
6. Build flow definition from registry steps, injecting template IDs
7. POST /flows/ using BETA client → get klaviyo_flow_id
8. Upsert flows table: { shop_domain, flow_type, klaviyo_flow_id, status: 'live', deployed_at }
9. Return { success: true, klaviyo_flow_id }
```

**Critical:** always look up metric IDs dynamically. Never hardcode.
**Critical:** beta client for POST /flows/ only. Standard client for everything else.

---

## CAMPAIGNS — STOP STARTING FROM ZERO

The campaign problem: every couple of weeks, start from scratch. Fix this by making campaigns a fill-in-the-blank, not a blank page.

**Campaign endpoint:** `POST /api/campaigns/schedule`

Payload:
```json
{
  "shopDomain": "drwater.store",
  "theme": "product_spotlight | promotion | education | seasonal",
  "offer": "10% off sitewide",
  "product": "HydroPitcher Pro",
  "segmentId": "TavdPF",
  "sendDate": "2026-03-05"
}
```

What happens:
1. Pull brand from DB
2. Generate email HTML using a fixed campaign template for the theme (4 templates total, one per theme)
3. Render with brand tokens + offer + product
4. Run all 5 Klaviyo campaign creation steps
5. Schedule for sendDate
6. Save to campaigns table

**4 campaign templates (hardcoded):**
- `campaign_product_spotlight.html` — hero image, product name, CTA
- `campaign_promotion.html` — discount code, urgency bar, product grid
- `campaign_education.html` — tips format, no discount
- `campaign_seasonal.html` — seasonal hook, product tie-in

Founder fills in: theme, offer (optional), product, segment, date. Everything else is generated.

---

## SUPABASE SCHEMA

```sql
create table brands (
  id             uuid primary key default gen_random_uuid(),
  shop_domain    text not null unique,
  logo_url       text,
  colours        jsonb,
  fonts          jsonb,
  tone_words     text[],
  product_images jsonb,
  raw_scrape     jsonb,
  gaps           text[],
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table accounts (
  id                   uuid primary key default gen_random_uuid(),
  shop_domain          text not null unique,
  shopify_access_token text,
  shopify_scope        text,
  klaviyo_api_key      text,
  klaviyo_account_id   text,
  klaviyo_account_name text,
  sms_number           text,
  from_email           text,
  from_label           text,
  connected_at         timestamptz,
  updated_at           timestamptz default now()
);

create table flows (
  id              uuid primary key default gen_random_uuid(),
  shop_domain     text not null,
  flow_type       text not null,
  klaviyo_flow_id text,
  status          text default 'idle',
  deployed_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table campaigns (
  id                  uuid primary key default gen_random_uuid(),
  shop_domain         text not null,
  klaviyo_campaign_id text,
  theme               text,
  offer               text,
  product             text,
  send_date           date,
  status              text,
  created_at          timestamptz default now()
);
```

---

## KLAVIYO API — CRITICAL PATTERNS

### Two clients. Use the right one.

```js
function makeKlaviyoClient(apiKey, beta = false) {
  return axios.create({
    baseURL: 'https://a.klaviyo.com/api',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: beta ? '2024-10-15.pre' : '2024-02-15',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}
```

Beta = true: ONLY for POST /flows/ and GET /flows/:id/
Standard: everything else

### Pagination

```js
async function klaviyoGetAll(client, path) {
  const results = [];
  let url = path;
  while (url) {
    const res = await client.get(url);
    results.push(...(res.data.data || []));
    url = res.data.links?.next || null;
  }
  return results;
}
```

### Metric lookup — always dynamic

```js
const metrics = await klaviyoGetAll(client, '/metrics/');
const metric = metrics.find(m => m.attributes.name === 'Added to Cart');
if (!metric) throw new Error("Metric not found");
const metricId = metric.id;
```

### Campaign creation — 5 steps, exact order, never skip

```
1. POST /campaigns/                                → campaignId
2. GET  /campaigns/{campaignId}/campaign-messages/ → messageId
3. POST /templates/                                → templateId
4. POST /campaign-message-assign-template/         → links template to message
5. POST /campaign-send-jobs/                       → schedules send
```

---

## DR. WATER ACCOUNT (FIRST CUSTOMER)

```
Account ID:  TmnC6g
from_email:  support@drwater.store
from_label:  Dr. Water
sms_from:    +18666422719
```

### Key segment IDs (look up dynamically in production, use these for Dr. Water dev)
```
TavdPF   All Email-Deliverable
WajWyB   Engaged-45
SqzERL   Unengaged-180 (suppress)
Y7K4FF   SMS Subscribers
```

### Live flows — DO NOT redeploy these
```
SDGXEW   Started Checkout Revised Flow
UhRKiu   Added to Cart Flow 1
VSNpB7   Post Purchase Emails Jan 12 2026
Vttfnh   Customer Winback
WuPBmu   Drip Flow
XdWNq4   Post Purchase HydroPitcher
XzFTdz   Post Purchase HydroStanley
```

Before deploying: check flows table for existing live entry with same shop_domain + flow_type. If exists, return it. Do not redeploy.

---

## ENCRYPTION

```js
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), encrypted.toString('hex'), tag.toString('hex')].join(':');
}

function decrypt(encoded) {
  const [ivHex, encHex, tagHex] = encoded.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
}
```

Encrypt before DB write. Decrypt only in the route that needs it. Never log raw values.

---

## SHOPIFY OAUTH

```
GET /auth/shopify?shop=example.myshopify.com
  → validate shop matches *.myshopify.com
  → generate nonce, store in signed cookie
  → redirect to Shopify OAuth

GET /auth/shopify/callback
  → validate state (CSRF)
  → validate HMAC — mandatory, no exceptions
  → POST to Shopify for access token
  → encrypt + upsert to accounts table
  → redirect to {FRONTEND_URL}/?shop={shop}
```

HMAC validation is mandatory. Always use crypto.timingSafeEqual. Never skip.

---

## UI — SCREENS AND RULES

### 4 screens only

1. **Auth** — Connect Shopify + Connect Klaviyo
2. **Audit** — 10 flow rows. ✅ or 🔴. Deploy button on missing ones. That's it.
3. **Flows** — List of deployed flows. Status. Links to Klaviyo.
4. **Campaigns** — Theme picker + fields + schedule. One campaign at a time.

### Design rules
- Tokens from tokens.js — exact copy from prototype
- Inline JS styles only. No Tailwind. No CSS files.
- All API calls through api.js only. Never from screen components.
- No position:fixed or 100vh (embeddability)
- No emojis in UI. Use SVG icons from Icons.jsx.
- No React Router. useState in App.jsx.

### Design tokens
```js
export const ui = {
  bg: "#F4F4F5",
  surface: "#FFFFFF",
  border: "#E2E2E5",
  text: "#18181B",
  textSub: "#71717A",
  cta: "#18181B",
  success: "#16A34A",
  successBg: "#F0FDF4",
  r: 10, rSm: 6,
  shadow: "0 1px 3px rgba(0,0,0,0.07)",
};
```

---

## BUILD PHASES

| # | Phase                            | Status | Notes                                      |
|---|----------------------------------|--------|--------------------------------------------|
| 0 | Repo scaffold + health check     | DONE   |                                            |
| 1 | Supabase schema + migration      | DONE   |                                            |
| 2 | Brand scraping                   | DONE   |                                            |
| 3 | Shopify OAuth                    | DONE   |                                            |
| 4 | Klaviyo connect + validate       | DONE   |                                            |
| 5 | Flow registry + deploy endpoint  | DONE   | ATC flow working                           |
| 6 | Email template engine            | DONE   |                                            |
| 7 | Campaign backend                 | DONE   |                                            |
| 8 | Frontend — all 4 screens wired   | DONE   |                                            |
| 9 | Audit endpoint (existence check) | DONE   | GET /api/audit/:shopDomain — live/missing check via Klaviyo trigger metric matching |
| 10| All 10 flows in registry         | DONE   | All 10 flows + steps in registry.js; deploy.js created; 18 email templates made   |
| 11| Campaign templates (4 themes)    | DONE   | 4 HTML templates; new payload (theme/offer/product/segmentId/sendDate); Campaigns.jsx rewritten |
| 12| Deployment Railway + Vercel      | TODO   | Env vars, CORS, health check               |
| 13| Dodo Payments billing            | TODO   | Phase last                                 |

---

## ABSOLUTE PROHIBITIONS

- Do NOT add RPFR, benchmarking, or scoring to the audit. Not yet.
- Do NOT add user login. Shop domain is identity.
- Do NOT hardcode metric IDs in flow payloads.
- Do NOT use beta client except for POST /flows/ and GET /flows/:id/
- Do NOT redeploy a flow if live entry already exists in flows table
- Do NOT skip HMAC validation
- Do NOT store raw keys. Always encrypt.
- Do NOT make API calls from screen components. api.js only.
- Do NOT add billing before phase 13.
- Do NOT add TypeScript, Docker, Redis, queues, or unit tests in this phase.

---

## HOW TO START EVERY SESSION

```bash
claude "read MAILO_CONTEXT.md fully, tell me current phase status, what to build next"
```

Update the phase table before ending every session.