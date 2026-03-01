const express = require('express');
const router = express.Router();

// GET /api/templates
router.get('/', async (req, res, next) => {
  try {
    res.json({ data: [] });
  } catch (err) { next(err); }
});

module.exports = router;
