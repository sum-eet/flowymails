// deploy.js — deploys any flow from the registry to Klaviyo.
// Called by POST /api/flows/deploy.
// Converts simplified registry step format into Klaviyo API action definitions.

const fs = require('fs');
const path = require('path');
const registry = require('./registry');
const { makeKlaviyoClient, klaviyoGetAll } = require('../lib/klaviyoClient');
const { decrypt } = require('../lib/encrypt');
const { getSupabase } = require('../lib/supabase');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

// Render {{token}} — leave {{ klaviyo_tokens }} (with spaces) untouched
function renderTemplate(html, brand, variables = {}) {
  const tokens = {
    'brand.primary':        brand.colours?.primary            || '#000000',
    'brand.secondary':      brand.colours?.secondary          || '#333333',
    'brand.accent':         brand.colours?.accent             || '#ffffff',
    'brand.fontDisplay':    brand.fonts?.display?.name        || 'Arial, sans-serif',
    'brand.fontDisplayUrl': brand.fonts?.display?.url         || '',
    'brand.fontBody':       brand.fonts?.body?.name           || 'Arial, sans-serif',
    'brand.fontBodyUrl':    brand.fonts?.body?.url            || '',
    'brand.logoUrl':        brand.logo_url                    || '',
    'brand.name':           brand.shop_domain?.split('.')[0]  || 'Store',
    'product.imageUrl':     brand.product_images?.[0]?.url         || '',
    'product.name':         brand.product_images?.[0]?.productName || '',
    'product.price':        brand.product_images?.[0]?.price       || '',
    'store.url':            brand.shop_domain                 || '',
    ...variables,
  };
  // Only match {{noSpaces}} — never touch {{ djangoTokens }}
  return html.replace(/\{\{([^\s}][^}]*)\}\}/g, (match, key) => {
    const val = tokens[key.trim()];
    return val !== undefined ? val : match;
  });
}

// Convert simplified steps[] into Klaviyo action definitions with temporary_ids + links
function buildActions(steps, templateIdMap) {
  const actions = [];
  let delayCount = 0;
  let emailCount = 0;
  let smsCount   = 0;

  // First pass: generate temp IDs for each step
  const ids = steps.map((step, i) => {
    if (step.type === 'time-delay') return `delay_${delayCount++}`;
    if (step.type === 'send-email') return `email_${emailCount++}`;
    if (step.type === 'send-sms')   return `sms_${smsCount++}`;
    return `step_${i}`;
  });

  // Second pass: build action objects with correct links
  for (let i = 0; i < steps.length; i++) {
    const step  = steps[i];
    const tid   = ids[i];
    const nextId = i + 1 < steps.length ? ids[i + 1] : null;

    if (step.type === 'time-delay') {
      actions.push({
        temporary_id: tid,
        type: 'time-delay',
        links: { next: nextId },
        data: {
          unit: 'hours',
          value: step.hours,
          secondary_value: 0,
          timezone: 'profile',
          delay_until_time: null,
          delay_until_weekdays: null,
        },
      });
    } else if (step.type === 'send-email') {
      const templateId = templateIdMap[step.template];
      if (!templateId) throw new Error(`Template ID not found for: ${step.template}`);
      actions.push({
        temporary_id: tid,
        type: 'send-email',
        links: { next: nextId },
        data: {
          message: {
            template_id:    templateId,
            subject_line:   step.subject,
            preview_text:   step.preview || '',
            from_email:     null, // filled by caller
            from_label:     null,
            reply_to_email: null,
            cc_email:  null,
            bcc_email: null,
          },
        },
      });
    } else if (step.type === 'send-sms') {
      actions.push({
        temporary_id: tid,
        type: 'send-sms',
        links: { next: nextId },
        data: { message: { body: step.body } },
      });
    }
  }

  return actions;
}

// Fill in from_email / from_label for all send-email actions
function injectSender(actions, fromEmail, fromLabel) {
  return actions.map(action => {
    if (action.type === 'send-email') {
      return {
        ...action,
        data: {
          message: {
            ...action.data.message,
            from_email:     fromEmail,
            from_label:     fromLabel,
            reply_to_email: fromEmail,
          },
        },
      };
    }
    return action;
  });
}

// Main deploy function — called from flows route
async function deployFlow(shopDomain, flowType) {
  const flowDef = registry[flowType];
  if (!flowDef) throw Object.assign(new Error(`Unknown flow type: ${flowType}`), { status: 400 });
  if (!flowDef.steps.length) throw Object.assign(new Error(`Flow ${flowType} has no steps defined yet`), { status: 400 });

  const supabase = getSupabase();

  // Idempotency — don't redeploy if already live
  const { data: existing } = await supabase
    .from('flows')
    .select('*')
    .eq('shop_domain', shopDomain)
    .eq('flow_type', flowType)
    .eq('status', 'live')
    .maybeSingle();

  if (existing) return { ...existing, _already_live: true };

  // Load account + decrypt key
  const { data: account, error: accErr } = await supabase
    .from('accounts')
    .select('klaviyo_api_key, from_email, from_label')
    .eq('shop_domain', shopDomain)
    .single();

  if (accErr || !account?.klaviyo_api_key) {
    throw Object.assign(new Error('Klaviyo API key not connected for this shop'), { status: 400 });
  }

  const apiKey     = decrypt(account.klaviyo_api_key);
  const client     = makeKlaviyoClient(apiKey, false);
  const betaClient = makeKlaviyoClient(apiKey, true);

  const fromEmail = account.from_email || 'hello@example.com';
  const fromLabel = account.from_label || shopDomain.split('.')[0];

  // Load brand for template rendering
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('shop_domain', shopDomain)
    .maybeSingle();

  // Dynamic metric lookup — never hardcode
  const metrics = await klaviyoGetAll(client, '/metrics/');
  const metric  = metrics.find(m => m.attributes.name === flowDef.trigger_metric_name);
  if (!metric) throw new Error(`Metric '${flowDef.trigger_metric_name}' not found in this Klaviyo account`);
  const metricId = metric.id;

  // Create Klaviyo templates for all email steps
  const templateIdMap = {};
  const emailSteps = flowDef.steps.filter(s => s.type === 'send-email');

  for (const step of emailSteps) {
    const htmlPath = path.join(TEMPLATES_DIR, `${step.template}.html`);
    let html;
    try {
      html = fs.readFileSync(htmlPath, 'utf8');
    } catch (_) {
      // Template file missing — use minimal fallback so deploy doesn't fail
      html = `<!doctype html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:{{brand.primary}}">{{brand.name}}</h2><p>${step.subject}</p></body></html>`;
    }

    if (brand) html = renderTemplate(html, brand, { coupon: 'DRWATER10' });

    const tplRes = await client.post('/templates/', {
      data: {
        type: 'template',
        attributes: {
          name: `${flowDef.name} — ${step.template} — ${shopDomain}`,
          editor_type: 'CODE',
          html,
        },
      },
    });

    templateIdMap[step.template] = tplRes.data.data.id;
  }

  // Build and inject sender into Klaviyo actions
  let actions = buildActions(flowDef.steps, templateIdMap);
  actions = injectSender(actions, fromEmail, fromLabel);

  // Entry action = first action in the list
  const entryActionId = actions[0]?.temporary_id;
  if (!entryActionId) throw new Error('Flow has no actions');

  // POST /flows/ via beta client
  const flowRes = await betaClient.post('/flows/', {
    data: {
      type: 'flow',
      attributes: {
        name: `${flowDef.name} — ${shopDomain}`,
        definition: {
          triggers: [{ type: 'metric', id: metricId, trigger_filter: null }],
          profile_filter: null,
          entry_action_id: entryActionId,
          actions,
        },
      },
    },
  });

  const klaviyoFlowId = flowRes.data.data.id;

  // Upsert to flows table
  const { data: flowRow, error: flowErr } = await supabase
    .from('flows')
    .upsert(
      {
        shop_domain:     shopDomain,
        flow_type:       flowType,
        klaviyo_flow_id: klaviyoFlowId,
        status:          'live',
        deployed_at:     new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'shop_domain,flow_type' }
    )
    .select()
    .single();

  if (flowErr) throw flowErr;
  return flowRow;
}

module.exports = { deployFlow };
