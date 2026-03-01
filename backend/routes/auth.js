const express = require('express');
const crypto = require('crypto');
const cookie = require('cookie');
const axios = require('axios');
const router = express.Router();
const { encrypt } = require('../lib/encrypt');
const { getSupabase } = require('../lib/supabase');
const { makeKlaviyoClient } = require('../lib/klaviyoClient');

const SHOPIFY_API_KEY    = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_APP_URL    = process.env.SHOPIFY_APP_URL || 'https://api.mailo.app';
const FRONTEND_URL       = process.env.FRONTEND_URL    || 'http://localhost:5173';
const SCOPES = 'read_products,read_orders,read_customers,read_script_tags,write_script_tags';

function validateShop(shop) {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}

function validateShopifyHmac(query) {
  const { hmac, ...rest } = query;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${Array.isArray(rest[k]) ? rest[k].join(',') : rest[k]}`)
    .join('&');
  const digest = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, 'hex'),
      Buffer.from(hmac, 'hex')
    );
  } catch {
    return false; // mismatched lengths
  }
}

// GET /auth/shopify?shop=example.myshopify.com
router.get('/shopify', (req, res, next) => {
  try {
    const { shop } = req.query;
    if (!shop || !validateShop(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');

    res.setHeader('Set-Cookie', cookie.serialize('mailo_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/',
    }));

    const redirectUri = `${SHOPIFY_APP_URL}/auth/shopify/callback`;
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

    res.redirect(authUrl);
  } catch (err) { next(err); }
});

// GET /auth/shopify/callback
router.get('/shopify/callback', async (req, res, next) => {
  try {
    const { code, hmac, shop, state } = req.query;

    // 1. Validate state matches cookie (CSRF protection)
    const cookies = cookie.parse(req.headers.cookie || '');
    if (!state || !cookies.mailo_nonce || state !== cookies.mailo_nonce) {
      console.error('[ERROR] Shopify OAuth CSRF validation failed');
      return res.status(403).json({ error: 'State mismatch — possible CSRF attack' });
    }

    // 2. Validate HMAC — mandatory
    if (!hmac || !validateShopifyHmac(req.query)) {
      console.error('[ERROR] Shopify OAuth HMAC validation failed for shop:', shop);
      return res.status(401).json({ error: 'HMAC validation failed' });
    }

    // 3. Validate shop
    if (!shop || !validateShop(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // 4. Exchange code for access token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const { access_token, scope } = tokenRes.data;
    if (!access_token) throw new Error('No access token returned from Shopify');

    // 5. Encrypt token and upsert into accounts table
    const encryptedToken = encrypt(access_token);
    const supabase = getSupabase();
    const { error } = await supabase
      .from('accounts')
      .upsert(
        {
          shop_domain:          shop,
          shopify_access_token: encryptedToken,
          shopify_scope:        scope,
          connected_at:         new Date().toISOString(),
          updated_at:           new Date().toISOString(),
        },
        { onConflict: 'shop_domain' }
      );

    if (error) throw error;

    // Clear nonce cookie
    res.setHeader('Set-Cookie', cookie.serialize('mailo_nonce', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    }));

    // 6. Redirect to frontend
    res.redirect(`${FRONTEND_URL}/?shop=${shop}`);
  } catch (err) {
    console.error('[ERROR] Shopify OAuth callback:', err.message);
    next(err);
  }
});

// POST /auth/klaviyo/connect  — validate key + store encrypted
router.post('/klaviyo/connect', async (req, res, next) => {
  try {
    const { shopDomain, apiKey } = req.body;
    if (!shopDomain || !apiKey) {
      return res.status(400).json({ error: 'shopDomain and apiKey required' });
    }

    // Validate key against Klaviyo API
    const client = makeKlaviyoClient(apiKey);
    let accountId, accountName;
    try {
      const accountRes = await client.get('/accounts/');
      const account = accountRes.data?.data?.[0];
      accountId   = account?.id;
      accountName = account?.attributes?.contact_information?.company_name
                 || account?.attributes?.company_name
                 || null;
    } catch (e) {
      const status = e.response?.status;
      if (status === 401 || status === 403) {
        return res.status(401).json({ error: 'Invalid Klaviyo API key' });
      }
      throw e;
    }

    // Encrypt and upsert
    const encryptedKey = encrypt(apiKey);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('accounts')
      .upsert(
        {
          shop_domain:          shopDomain,
          klaviyo_api_key:      encryptedKey,
          klaviyo_account_id:   accountId   || null,
          klaviyo_account_name: accountName || null,
          updated_at:           new Date().toISOString(),
        },
        { onConflict: 'shop_domain' }
      )
      .select('shop_domain, klaviyo_account_id, klaviyo_account_name, connected_at')
      .single();

    if (error) throw error;

    res.json({ data });
  } catch (err) { next(err); }
});

module.exports = router;
