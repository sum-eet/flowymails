// Phase 9 — Dodo Payments billing
// Mount in index.js: app.use('/api/billing', require('./routes/billing'));

const express = require('express');
const router = express.Router();

// POST /api/billing/checkout — create Dodo checkout session, return URL
router.post('/checkout', async (req, res, next) => {
  try {
    res.json({ data: { message: 'Billing checkout — Phase 9' } });
  } catch (err) { next(err); }
});

// POST /api/billing/webhook — handle Dodo webhook events
router.post('/webhook', async (req, res, next) => {
  try {
    res.json({ data: { message: 'Billing webhook — Phase 9' } });
  } catch (err) { next(err); }
});

// GET /api/billing/status?shop={domain}
router.get('/status', async (req, res, next) => {
  try {
    res.json({ data: { message: 'Billing status — Phase 9' } });
  } catch (err) { next(err); }
});

module.exports = router;
