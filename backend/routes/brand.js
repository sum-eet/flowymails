const express = require('express');
const multer = require('multer');
const router = express.Router();
const { scrapeBrand } = require('../lib/scraper');
const { getSupabase } = require('../lib/supabase');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/brand/analyse
router.post('/analyse', async (req, res, next) => {
  try {
    const { shopDomain } = req.body;
    if (!shopDomain) return res.status(400).json({ error: 'shopDomain required' });

    const scraped = await scrapeBrand(shopDomain);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('brands')
      .upsert(
        {
          shop_domain:    scraped.shop_domain,
          logo_url:       scraped.logo_url,
          logo_url_light: scraped.logo_url_light,
          colours:        scraped.colours,
          color_roles:    scraped.color_roles,
          fonts:          scraped.fonts,
          product_images: scraped.product_images,
          raw_scrape:     scraped.raw_scrape,
          gaps:           scraped.gaps,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'shop_domain' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ data: { brand: data, gaps: scraped.gaps } });
  } catch (err) { next(err); }
});

// GET /api/brand/:shopDomain
router.get('/:shopDomain', async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('shop_domain', req.params.shopDomain)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Brand not found' });
    }
    if (error) throw error;

    res.json({ data });
  } catch (err) { next(err); }
});

// POST /api/brand/upload  (multipart: logo, fontDisplay, fontBody)
router.post('/upload', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'fontDisplay', maxCount: 1 },
  { name: 'fontBody', maxCount: 1 },
]), async (req, res, next) => {
  try {
    const { shopDomain } = req.body;
    if (!shopDomain) return res.status(400).json({ error: 'shopDomain required' });

    const supabase = getSupabase();
    const updates = {};
    const removedGaps = [];

    async function uploadFile(file, folder) {
      const ext = file.originalname.split('.').pop() || 'bin';
      const path = `${folder}/${shopDomain}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('brand-assets')
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
      return data.publicUrl;
    }

    if (req.files?.logo?.[0]) {
      updates.logo_url = await uploadFile(req.files.logo[0], 'logos');
      removedGaps.push('logo');
    }

    if (req.files?.fontDisplay?.[0]) {
      const url = await uploadFile(req.files.fontDisplay[0], 'fonts');
      updates.fonts = updates.fonts || {};
      updates.fonts.display = { name: req.body.fontDisplayName || 'Custom Font', url };
      removedGaps.push('fonts');
    }

    if (req.files?.fontBody?.[0]) {
      const url = await uploadFile(req.files.fontBody[0], 'fonts');
      updates.fonts = updates.fonts || {};
      updates.fonts.body = { name: req.body.fontBodyName || 'Custom Font', url };
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Merge fonts with existing rather than overwrite
    if (updates.fonts) {
      const { data: existing } = await supabase
        .from('brands')
        .select('fonts, gaps')
        .eq('shop_domain', shopDomain)
        .single();

      if (existing?.fonts) {
        updates.fonts = { ...existing.fonts, ...updates.fonts };
      }

      // Remove 'fonts' from gaps if we now have at least one font
      if (updates.fonts.display || updates.fonts.body) {
        removedGaps.push('fonts');
      }

      // Update gaps array
      if (existing?.gaps && removedGaps.length) {
        updates.gaps = existing.gaps.filter(g => !removedGaps.includes(g));
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('brands')
      .update(updates)
      .eq('shop_domain', shopDomain)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (err) { next(err); }
});

module.exports = router;
