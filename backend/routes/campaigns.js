const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();
const { makeKlaviyoClient } = require('../lib/klaviyoClient');
const { decrypt } = require('../lib/encrypt');
const { getSupabase } = require('../lib/supabase');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Render {{token}} — leave {{ klaviyo_tokens }} (with spaces) untouched
function renderTemplate(html, tokens) {
  return html.replace(/\{\{([^\s}][^}]*)\}\}/g, (match, key) => {
    const val = tokens[key.trim()];
    return val !== undefined ? val : match;
  });
}

const THEME_FILES = {
  product_spotlight: 'campaign_product_spotlight.html',
  promotion:         'campaign_promotion.html',
  education:         'campaign_education.html',
  seasonal:          'campaign_seasonal.html',
};

const THEME_SUBJECTS = {
  product_spotlight: (product) => `${product} — everything you need to know`,
  promotion:         (offer)   => offer || 'A special offer for you',
  education:         (product) => `Getting the most from ${product}`,
  seasonal:          (product) => `The right time to get ${product}`,
};

// POST /api/campaigns/schedule
// Payload: { shopDomain, theme, offer, product, segmentId, sendDate }
router.post('/schedule', async (req, res, next) => {
  try {
    const {
      shopDomain,
      theme     = 'product_spotlight',
      offer     = '',
      product   = '',
      segmentId,
      sendDate,
    } = req.body;

    if (!shopDomain || !segmentId || !sendDate) {
      return res.status(400).json({ error: 'shopDomain, segmentId, and sendDate are required' });
    }

    const templateFile = THEME_FILES[theme];
    if (!templateFile) {
      return res.status(400).json({ error: `Unknown theme: ${theme}. Must be one of: ${Object.keys(THEME_FILES).join(', ')}` });
    }

    const supabase = getSupabase();

    // Load account + decrypt key
    const { data: account, error: accErr } = await supabase
      .from('accounts')
      .select('klaviyo_api_key, from_email, from_label')
      .eq('shop_domain', shopDomain)
      .single();

    if (accErr || !account?.klaviyo_api_key) {
      return res.status(400).json({ error: 'Klaviyo API key not connected for this shop' });
    }

    const apiKey    = decrypt(account.klaviyo_api_key);
    const client    = makeKlaviyoClient(apiKey, false);
    const fromEmail = account.from_email || 'hello@example.com';
    const fromLabel = account.from_label || shopDomain.split('.')[0];

    // Load brand for template rendering
    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('shop_domain', shopDomain)
      .maybeSingle();

    // Build token map
    const brandName = brand?.shop_domain?.split('.')[0] || shopDomain.split('.')[0];
    const tokens = {
      'brand.primary':    brand?.colours?.primary   || '#000000',
      'brand.secondary':  brand?.colours?.secondary || '#333333',
      'brand.accent':     brand?.colours?.accent    || '#ffffff',
      'brand.logoUrl':    brand?.logo_url           || '',
      'brand.name':       brandName,
      'product':          product || brand?.product_images?.[0]?.productName || 'Our Best Seller',
      'product.imageUrl': brand?.product_images?.[0]?.url         || '',
      'product.name':     brand?.product_images?.[0]?.productName || '',
      'product.price':    brand?.product_images?.[0]?.price       || '',
      'offer':            offer   || 'Shop now',
      'coupon':           offer.match(/\b[A-Z0-9]{4,}\b/)?.[0] || 'SAVE10',
      'store.url':        shopDomain,
    };

    // Render template
    let html = fs.readFileSync(path.join(TEMPLATES_DIR, templateFile), 'utf8');
    html = renderTemplate(html, tokens);

    // Build metadata
    const productLabel  = product || tokens['product'];
    const subjectFn     = THEME_SUBJECTS[theme];
    const subject       = typeof subjectFn === 'function'
      ? (theme === 'promotion' ? subjectFn(offer || productLabel) : subjectFn(productLabel))
      : productLabel;
    const previewText   = offer ? `${offer} — ${productLabel}` : `New from ${brandName}`;
    const campaignName  = `${brandName} — ${theme.replace(/_/g, ' ')} — ${sendDate}`;
    const sendAt        = `${sendDate}T10:00:00`; // 10 AM local

    // ── Step 1: Create campaign ──────────────────────────────────────────────
    const createRes = await client.post('/campaigns/', {
      data: {
        type: 'campaign',
        attributes: {
          name: campaignName,
          audiences: {
            included: [segmentId],
            excluded: [],
          },
          send_options: {
            use_smart_sending: false,
            ignore_unsubscribes: false,
          },
          tracking_options: {
            is_tracking_opens: true,
            is_tracking_clicks: true,
          },
          send_strategy: {
            method: 'static',
            options_static: { datetime: sendAt, is_local: false },
          },
          'campaign-messages': {
            data: [{
              type: 'campaign-message',
              attributes: {
                channel: 'email',
                label: 'main',
                content: {
                  subject,
                  preview_text:   previewText,
                  from_email:     fromEmail,
                  from_label:     fromLabel,
                  reply_to_email: fromEmail,
                },
              },
            }],
          },
        },
      },
    });

    const campaignId = createRes.data.data.id;

    // ── Step 2: Get message ID ───────────────────────────────────────────────
    const msgRes  = await client.get(`/campaigns/${campaignId}/campaign-messages/`);
    const messageId = msgRes.data.data?.[0]?.id;
    if (!messageId) throw new Error('No campaign message found after creation');

    // ── Step 3: Create template ──────────────────────────────────────────────
    const tplRes = await client.post('/templates/', {
      data: {
        type: 'template',
        attributes: {
          name:        `${campaignName} — ${shopDomain}`,
          editor_type: 'CODE',
          html,
        },
      },
    });
    const templateId = tplRes.data.data.id;

    // ── Step 4: Assign template to message ───────────────────────────────────
    await client.post('/campaign-message-assign-template/', {
      data: {
        type: 'campaign-message',
        id: messageId,
        relationships: {
          template: { data: { type: 'template', id: templateId } },
        },
      },
    });

    // ── Step 5: Schedule ─────────────────────────────────────────────────────
    const sendJobRes = await client.post('/campaign-send-jobs/', {
      data: { type: 'campaign-send-job', id: campaignId },
    });

    const sendJobId = sendJobRes.data.data.id;

    // ── Persist to DB ────────────────────────────────────────────────────────
    const { data: row, error: dbErr } = await supabase
      .from('campaigns')
      .insert({
        shop_domain:         shopDomain,
        klaviyo_campaign_id: campaignId,
        theme,
        offer:               offer || null,
        product:             productLabel || null,
        send_date:           sendDate,
        status:              'scheduled',
      })
      .select()
      .single();

    if (dbErr) {
      console.error('[ERROR] Failed to save campaign to DB:', dbErr.message);
    }

    res.json({
      data: {
        campaignId,
        messageId,
        templateId,
        sendJobId,
        db: row || null,
      },
    });
  } catch (err) {
    if (err.response) {
      console.error('[CAMPAIGN] Klaviyo error status:', err.response.status);
      console.error('[CAMPAIGN] Klaviyo error body:', JSON.stringify(err.response.data));
    }
    next(err);
  }
});

module.exports = router;
