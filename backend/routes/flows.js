const express = require('express');
const router  = express.Router();
const registry = require('../flows/registry');
const { deployFlow } = require('../flows/deploy');
const { buildEmail } = require('../lib/emailBuilder');
const emailDefs = require('../flows/emailDefinitions');
const { getSupabase } = require('../lib/supabase');

// GET /api/flows/preview/:emailKey?shop=drwater.store
router.get('/preview/:emailKey', async (req, res, next) => {
  try {
    const { emailKey } = req.params;
    const { shop } = req.query;
    const supabase = getSupabase();

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('shop_domain', shop)
      .maybeSingle();

    const def = emailDefs[emailKey];
    if (!def) return res.status(404).json({ error: `No email definition for: ${emailKey}` });

    const content = def.content(brand || {}, {});
    const html = buildEmail(def.blocks, brand || {}, content);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { next(err); }
});

// GET /api/flows/catalog — all 10 registry entries (must be before /:shopDomain)
router.get('/catalog', (req, res) => {
  const catalog = Object.values(registry).map(f => ({
    id:                        f.id,
    name:                      f.name,
    trigger_metric_name:       f.trigger_metric_name,
    estimated_monthly_revenue: f.estimated_monthly_revenue,
    has_steps:                 f.steps.length > 0,
  }));
  res.json({ data: catalog });
});

// GET /api/flows/:shopDomain — list Mailo-deployed flows for this shop
router.get('/:shopDomain', async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('shop_domain', req.params.shopDomain)
      .order('deployed_at', { ascending: false });

    if (error) throw error;

    // Enrich with registry metadata
    const enriched = (data || []).map(row => ({
      ...row,
      name:                      registry[row.flow_type]?.name                      || row.flow_type,
      estimated_monthly_revenue: registry[row.flow_type]?.estimated_monthly_revenue || null,
    }));

    res.json({ data: enriched });
  } catch (err) { next(err); }
});

// POST /api/flows/deploy  { shopDomain, flowType }
router.post('/deploy', async (req, res, next) => {
  try {
    const { shopDomain, flowType } = req.body;
    if (!shopDomain || !flowType) {
      return res.status(400).json({ error: 'shopDomain and flowType are required' });
    }
    const result = await deployFlow(shopDomain, flowType);
    res.json({ data: result });
  } catch (err) { next(err); }
});

module.exports = router;
