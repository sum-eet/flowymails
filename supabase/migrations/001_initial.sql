-- supabase/migrations/001_initial.sql
-- Mailo schema — shop_domain is the identity. No user login in this phase.

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
  status          text default 'idle',  -- 'live' | 'draft' | 'idle'
  deployed_at     timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (shop_domain, flow_type)
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
