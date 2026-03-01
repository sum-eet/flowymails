const express = require('express');
const router = express.Router();
const registry = require('../flows/registry');
const { makeKlaviyoClient, klaviyoGetAll } = require('../lib/klaviyoClient');
const { decrypt } = require('../lib/encrypt');
const { getSupabase } = require('../lib/supabase');

// Fallback name-pattern matching for metric-triggered flows.
// Used when Klaviyo doesn't expose the trigger metric via API (UI-created flows).
const FLOW_NAME_PATTERNS = {
  abandoned_cart:       [/added.to.cart/i, /cart.abandon/i, /abandon.*cart/i],
  checkout_abandonment: [/checkout/i, /started.checkout/i],
  welcome_series:       [/welcome.series/i, /welcome.email/i, /welcome.flow/i],
  post_purchase:        [/post.purchase/i, /post-purchase/i],
  winback:              [/win.?back/i, /winback/i, /re-?engage/i],
  browse_abandonment:   [/browse.abandon/i, /product.abandon/i, /awareness.to.interest/i, /awareness.*interest/i],
  back_in_stock:        [/back.in.stock/i],
  sms_welcome:          [/sms.welcome/i, /sms.*welcome/i],
  vip:                  [/\bvip\b/i, /high.value/i],
  price_drop:           [/price.drop/i],
};

// Non-metric trigger types map directly to flow types
const TRIGGER_TYPE_MAP = {
  'Added to List':  ['welcome_series', 'sms_welcome'],
  'Price Drop':     ['price_drop'],
  'Back in Stock':  ['back_in_stock'],
};

// GET /api/audit/:shopDomain
// Returns 10 rows — one per registry flow — with live/missing status.
router.get('/:shopDomain', async (req, res, next) => {
  try {
    const { shopDomain } = req.params;
    const supabase = getSupabase();

    // Load account + decrypt key
    const { data: account, error: accErr } = await supabase
      .from('accounts')
      .select('klaviyo_api_key')
      .eq('shop_domain', shopDomain)
      .single();

    if (accErr || !account?.klaviyo_api_key) {
      return res.status(400).json({ error: 'Klaviyo not connected for this shop' });
    }

    const apiKey = decrypt(account.klaviyo_api_key);
    const client = makeKlaviyoClient(apiKey, false);

    // ── 1. Get all live Klaviyo flows ──────────────────────────────────────────
    const allFlows = await klaviyoGetAll(client, '/flows/');
    const liveFlows = allFlows.filter(f => f.attributes.status === 'live');

    // ── 2. Match live flows to registry entries ────────────────────────────────
    // Strategy A: non-metric trigger_type → direct map (e.g. "Added to List" → welcome_series)
    // Strategy B: metric flows → name pattern fallback
    // Note: Klaviyo's relationships/trigger-metric/ endpoint is not available in this API revision.
    const detectedFlows = {}; // flowType → klaviyo_flow_id

    for (const flow of liveFlows) {
      const triggerType = flow.attributes.trigger_type;

      if (triggerType !== 'Metric') {
        // Strategy A
        for (const ft of (TRIGGER_TYPE_MAP[triggerType] || [])) {
          if (!detectedFlows[ft]) detectedFlows[ft] = flow.id;
        }
      } else {
        // Strategy B — name patterns
        const name = flow.attributes.name;
        for (const [flowType, patterns] of Object.entries(FLOW_NAME_PATTERNS)) {
          if (!detectedFlows[flowType] && patterns.some(p => p.test(name))) {
            detectedFlows[flowType] = flow.id;
            break;
          }
        }
      }
    }

    // ── 3. Load our DB flows table for this shop ───────────────────────────────
    const { data: dbFlows } = await supabase
      .from('flows')
      .select('*')
      .eq('shop_domain', shopDomain);

    const dbFlowMap = {};
    for (const f of (dbFlows || [])) {
      dbFlowMap[f.flow_type] = f;
    }

    // ── 4. Build 10-row audit result ──────────────────────────────────────────
    const flows = Object.values(registry).map(entry => {
      const klaviyoFlowId = detectedFlows[entry.id] || null;
      const dbEntry       = dbFlowMap[entry.id];
      const isLive        = !!(klaviyoFlowId || dbEntry?.status === 'live');

      return {
        flow_type:                 entry.id,
        name:                      entry.name,
        status:                    isLive ? 'live' : 'missing',
        klaviyo_flow_id:           klaviyoFlowId || dbEntry?.klaviyo_flow_id || null,
        estimated_monthly_revenue: entry.estimated_monthly_revenue,
      };
    });

    res.json({ data: { flows } });
  } catch (err) { next(err); }
});

module.exports = router;
