const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";
/**
 * klaviyo-export-v2.js
 * Pulls full account data needed for Mailo — fixed campaign filter + SMS + flow definitions
 * Run: node klaviyo-export-v2.js > export.json
 * Summary prints to stderr so it doesn't corrupt the JSON output
 */
/**
 * klaviyo-export-v3.js
 * Pulls all Klaviyo account data needed for Mailo.
 *
 * Run:
 *   node klaviyo-export-v3.js 2>summary.txt | tee export.json
 *
 * Or just:
 *   node klaviyo-export-v3.js > export.json
 *   (summary prints to stderr separately so it doesn't corrupt JSON)
 */

if (API_KEY === "PASTE_YOUR_PRIVATE_KEY_HERE") {
  console.error(
    "ERROR: Paste your Klaviyo private key into the API_KEY variable first.",
  );
  process.exit(1);
}

const BASE = "https://a.klaviyo.com/api";

const HEADERS = {
  Authorization: `Klaviyo-API-Key ${API_KEY}`,
  revision: "2024-02-15",
  "Content-Type": "application/json",
  Accept: "application/json",
};

const HEADERS_BETA = {
  Authorization: `Klaviyo-API-Key ${API_KEY}`,
  revision: "2024-10-15.pre",
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Paginate using full absolute URLs — proven to work with Klaviyo
async function getAll(path, useBeta = false) {
  const results = [];
  let url = `${BASE}${path}`;
  const headers = useBeta ? HEADERS_BETA : HEADERS;

  while (url) {
    const res = await axios.get(url, { headers });
    const data = res.data.data;
    if (Array.isArray(data)) results.push(...data);
    url = res.data.links?.next || null; // next is always a full absolute URL
  }
  return results;
}

async function get(path, useBeta = false) {
  const headers = useBeta ? HEADERS_BETA : HEADERS;
  const res = await axios.get(`${BASE}${path}`, { headers });
  return res.data;
}

async function main() {
  const out = {};

  // ── Account ────────────────────────────────────────────────────────────────
  console.error("[ 1/8 ] Account...");
  try {
    const res = await get("/accounts/");
    const a = res.data[0];
    out.account = {
      id: a.id,
      name: a.attributes.contact_information?.organization_name,
      timezone: a.attributes.timezone,
      currency: a.attributes.preferred_currency,
      email: a.attributes.contact_information?.email,
    };
    console.error(`        ✓ ${out.account.name} (${out.account.timezone})`);
  } catch (e) {
    out.account = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Metrics ────────────────────────────────────────────────────────────────
  console.error("[ 2/8 ] Metrics...");
  try {
    const all = await getAll("/metrics/");
    out.metrics_total = all.length;
    // Keep only the ones relevant to flow triggers
    const keywords = [
      "checkout",
      "cart",
      "purchase",
      "order",
      "viewed product",
      "back in stock",
      "price drop",
      "subscribed",
      "placed order",
    ];
    out.metrics = all
      .filter((m) =>
        keywords.some((k) => m.attributes.name.toLowerCase().includes(k)),
      )
      .map((m) => ({ id: m.id, name: m.attributes.name }));
    // Also keep ALL for reference
    out.metrics_all = all.map((m) => ({ id: m.id, name: m.attributes.name }));
    console.error(
      `        ✓ ${all.length} total, ${out.metrics.length} trigger-relevant`,
    );
  } catch (e) {
    out.metrics = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Lists ──────────────────────────────────────────────────────────────────
  console.error("[ 3/8 ] Lists...");
  try {
    const all = await getAll("/lists/");
    out.lists = all.map((l) => ({ id: l.id, name: l.attributes.name }));
    console.error(`        ✓ ${all.length} lists`);
    out.lists.forEach((l) => console.error(`          • ${l.name} (${l.id})`));
  } catch (e) {
    out.lists = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Segments ───────────────────────────────────────────────────────────────
  console.error("[ 4/8 ] Segments...");
  try {
    const all = await getAll("/segments/");
    out.segments = all.map((s) => ({ id: s.id, name: s.attributes.name }));
    console.error(`        ✓ ${all.length} segments`);
    out.segments.forEach((s) =>
      console.error(`          • ${s.name} (${s.id})`),
    );
  } catch (e) {
    out.segments = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Flows ──────────────────────────────────────────────────────────────────
  console.error("[ 5/8 ] Flows...");
  try {
    const all = await getAll("/flows/");
    const live = all.filter((f) => f.attributes.status === "live");
    const draft = all.filter((f) => f.attributes.status !== "live");

    console.error(
      `        ✓ ${all.length} total (${live.length} live, ${draft.length} draft)`,
    );

    // Pull full definitions for live flows only
    const liveWithDefs = [];
    for (const f of live) {
      console.error(`          → [live] ${f.attributes.name}`);
      let definition = null;
      try {
        const detail = await axios.get(`${BASE}/flows/${f.id}/`, {
          headers: HEADERS_BETA,
        });
        definition = detail.data.data.attributes.definition;
      } catch (e) {
        console.error(`            ✗ definition failed: ${klaviyoError(e)}`);
      }

      // Summarise action chain
      let steps = [];
      if (definition?.actions) {
        steps = definition.actions.map((a) => {
          const base = {
            id: a.temporary_id,
            type: a.type,
            next: a.links?.next,
          };
          if (a.type === "time-delay")
            return { ...base, delay: `${a.data?.value} ${a.data?.unit}` };
          if (a.type === "send-email")
            return {
              ...base,
              subject: a.data?.message?.subject_line,
              template_id: a.data?.message?.template_id,
            };
          if (a.type === "send-sms")
            return {
              ...base,
              body_preview: (a.data?.message?.body || "").substring(0, 100),
            };
          if (a.type === "conditional-split")
            return { ...base, conditions: a.data?.conditions };
          return base;
        });
        console.error(`            ✓ ${steps.length} steps`);
      }

      liveWithDefs.push({
        id: f.id,
        name: f.attributes.name,
        status: f.attributes.status,
        trigger_type: f.attributes.trigger_type,
        created: f.attributes.created,
        updated: f.attributes.updated,
        steps,
        definition,
      });
    }

    out.flows_live = liveWithDefs;
    out.flows_draft = draft.map((f) => ({
      id: f.id,
      name: f.attributes.name,
      trigger_type: f.attributes.trigger_type,
      created: f.attributes.created,
    }));
  } catch (e) {
    out.flows_live = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Templates (names + IDs only — 110 templates, skip HTML body) ───────────
  console.error("[ 6/8 ] Templates...");
  try {
    const all = await getAll("/templates/");
    out.templates = all.map((t) => ({
      id: t.id,
      name: t.attributes.name,
      editor_type: t.attributes.editor_type,
      updated: t.attributes.updated,
    }));
    console.error(`        ✓ ${all.length} templates`);
  } catch (e) {
    out.templates = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── Campaigns (last 50) ────────────────────────────────────────────────────
  console.error("[ 7/8 ] Campaigns...");
  try {
    // No filter — just get all, sort client-side
    const all = await getAll("/campaigns/");
    out.campaigns = all
      .sort(
        (a, b) =>
          new Date(b.attributes.created) - new Date(a.attributes.created),
      )
      .slice(0, 50)
      .map((c) => ({
        id: c.id,
        name: c.attributes.name,
        status: c.attributes.status,
        send_time: c.attributes.send_options?.options_static?.datetime,
        created: c.attributes.created,
      }));
    console.error(`        ✓ ${all.length} total campaigns`);
  } catch (e) {
    out.campaigns = { error: klaviyoError(e) };
    console.error(`        ✗ ${klaviyoError(e)}`);
  }

  // ── SMS + Sender info ──────────────────────────────────────────────────────
  console.error("[ 8/8 ] SMS / Sender profiles...");
  // These endpoints vary by Klaviyo plan — fall through gracefully
  const smsAttempts = [
    "/sms-sending-numbers/",
    "/sms-sending-profiles/",
    "/phone-numbers/",
  ];
  out.sms_numbers = null;
  for (const path of smsAttempts) {
    try {
      const res = await get(path);
      out.sms_numbers = (res.data || []).map((n) => ({
        id: n.id,
        number: n.attributes?.number || n.attributes?.phone_number,
        country: n.attributes?.country_code,
      }));
      console.error(`        ✓ SMS numbers via ${path}`);
      break;
    } catch (_) {}
  }
  if (!out.sms_numbers) {
    out.sms_numbers = {
      note: "Could not pull via API",
      known_from_code: "+18666422719",
    };
    console.error("        ~ SMS: using known number from flow1.js");
  }

  // ── Print JSON ─────────────────────────────────────────────────────────────
  console.log(JSON.stringify(out, null, 2));

  // ── Final summary ──────────────────────────────────────────────────────────
  console.error(
    "\n══════════════════════════════════════════════════════════════════",
  );
  console.error("  MAILO EXPORT COMPLETE");
  console.error(
    "══════════════════════════════════════════════════════════════════",
  );
  console.error(
    `  Account:    ${out.account?.name || "ERROR"} (${out.account?.timezone || ""})`,
  );
  console.error(
    `  Metrics:    ${Array.isArray(out.metrics) ? `${out.metrics_total} total, ${out.metrics.length} trigger-relevant` : "ERROR"}`,
  );
  console.error(
    `  Lists:      ${Array.isArray(out.lists) ? out.lists.length : "ERROR"}`,
  );
  console.error(
    `  Segments:   ${Array.isArray(out.segments) ? out.segments.length : "ERROR"}`,
  );
  console.error(
    `  Flows:      ${Array.isArray(out.flows_live) ? out.flows_live.length : "ERROR"} live, ${Array.isArray(out.flows_draft) ? out.flows_draft.length : "?"} draft`,
  );
  console.error(
    `  Templates:  ${Array.isArray(out.templates) ? out.templates.length : "ERROR"}`,
  );
  console.error(
    `  Campaigns:  ${Array.isArray(out.campaigns) ? out.campaigns.length : "ERROR"}`,
  );
  console.error(
    "══════════════════════════════════════════════════════════════════",
  );

  if (Array.isArray(out.flows_live)) {
    console.error("\n  Live flows:");
    out.flows_live.forEach((f) =>
      console.error(`    • ${f.name} (${f.steps?.length || 0} steps)`),
    );
  }

  const triggerMetrics = Array.isArray(out.metrics) ? out.metrics : [];
  if (triggerMetrics.length) {
    console.error("\n  Trigger metrics found:");
    triggerMetrics.forEach((m) => console.error(`    • ${m.name} (${m.id})`));
  }
  console.error("");
}

function klaviyoError(e) {
  if (e.response?.data?.errors) {
    return e.response.data.errors
      .map((err) => `${err.status} ${err.title}: ${err.detail}`)
      .join(" | ");
  }
  return e.response?.data?.message || e.message;
}

main().catch((e) => {
  console.error("\nFATAL ERROR:");
  console.error(klaviyoError(e));
  process.exit(1);
});
