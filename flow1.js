const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

// Sender info
const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

// SMS sending number - must be set up in your Klaviyo account
const SMS_FROM = "+18666422719"; // your Klaviyo SMS sending number

// ─────────────────────────────────────────────
// EMAIL TEMPLATES — using correct event payload paths
// Skips the Re:do return product via vendor filter
// Cart URL: event.extra.checkout_url
// ─────────────────────────────────────────────

const EMAIL_1_HTML = `<!doctype html>
<html><head><meta charset="UTF-8">
<style>
  body { margin:0; padding:0; background:#f0f0ee; font-family:Arial,sans-serif; }
  .wrap { max-width:600px; margin:0 auto; background:#fff; }
  .header { background:#142B77; padding:24px 40px; text-align:center; }
  .header-title { color:#fff; font-size:22px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
  .hero { padding:48px 40px 24px; text-align:center; }
  .hero h1 { font-size:26px; font-weight:900; color:#142B77; text-transform:uppercase; margin:0 0 12px; }
  .hero p { font-size:15px; color:#555; line-height:1.6; margin:0; }
  .product { margin:24px 40px; border:1.5px solid #e0e0e0; border-radius:8px; overflow:hidden; text-decoration:none; display:block; }
  .product-img { width:100%; height:220px; object-fit:cover; display:block; background:#f4f4f4; }
  .product-body { padding:16px 20px; }
  .product-name { font-size:15px; font-weight:700; color:#142B77; margin:0 0 6px; text-transform:uppercase; }
  .product-price { font-size:18px; font-weight:900; color:#142B77; margin:0; }
  .cta { padding:8px 40px 40px; text-align:center; }
  .cta-btn { display:inline-block; background:#142B77; color:#fff; text-decoration:none; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:16px 40px; border-radius:100px; }
  .footer { border-top:1px solid #eee; padding:24px 40px; text-align:center; }
  .footer p { font-size:12px; color:#aaa; line-height:1.6; margin:0; }
  .footer a { color:#142B77; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="header-title">Dr.Water</div></div>
  <div class="hero">
    <h1>You left something behind</h1>
    <p>Hey {{ first_name|default:"there" }}, your cart is saved and waiting.<br>Pick up right where you left off.</p>
  </div>
  {% for item in event.extra.line_items %}
    {% if item.vendor != "re:do" %}
    <a class="product" href="{{ event.extra.checkout_url }}">
      <img class="product-img" src="{{ item.product.images.0.src }}" alt="{{ item.title }}" />
      <div class="product-body">
        <p class="product-name">{{ item.title }}</p>
        <p class="product-price">\${{ item.price }}</p>
      </div>
    </a>
    {% endif %}
  {% endfor %}
  <div class="cta">
    <a class="cta-btn" href="{{ event.extra.checkout_url }}">Return to My Cart</a>
  </div>
  <div class="footer">
    <p>Questions? Just reply — we read every message.<br><br>
    <a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
  </div>
</div>
</body></html>`;

const EMAIL_2_HTML = `<!doctype html>
<html><head><meta charset="UTF-8">
<style>
  body { margin:0; padding:0; background:#f0f0ee; font-family:Arial,sans-serif; }
  .wrap { max-width:600px; margin:0 auto; background:#fff; }
  .header { background:#142B77; padding:24px 40px; text-align:center; }
  .header-title { color:#fff; font-size:22px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
  .hero { padding:48px 40px 24px; text-align:center; }
  .hero h1 { font-size:26px; font-weight:900; color:#142B77; text-transform:uppercase; margin:0 0 12px; }
  .hero p { font-size:15px; color:#555; line-height:1.6; margin:0; }
  .product { margin:24px 40px; border:1.5px solid #e0e0e0; border-radius:8px; overflow:hidden; text-decoration:none; display:block; }
  .product-img { width:100%; height:220px; object-fit:cover; display:block; background:#f4f4f4; }
  .product-body { padding:16px 20px; }
  .product-name { font-size:15px; font-weight:700; color:#142B77; margin:0 0 6px; text-transform:uppercase; }
  .product-price { font-size:18px; font-weight:900; color:#142B77; margin:0; }
  .proof { background:#f4f7fb; margin:0 40px 24px; border-radius:8px; padding:20px 24px; text-align:center; }
  .stars { font-size:20px; color:#142B77; margin:0 0 8px; }
  .quote { font-size:13px; color:#333; font-style:italic; line-height:1.6; margin:0 0 8px; }
  .reviewer { font-size:12px; color:#888; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0; }
  .cta { padding:8px 40px 40px; text-align:center; }
  .cta-btn { display:inline-block; background:#142B77; color:#fff; text-decoration:none; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:16px 40px; border-radius:100px; }
  .footer { border-top:1px solid #eee; padding:24px 40px; text-align:center; }
  .footer p { font-size:12px; color:#aaa; line-height:1.6; margin:0; }
  .footer a { color:#142B77; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="header-title">Dr.Water</div></div>
  <div class="hero">
    <h1>Still thinking about it?</h1>
    <p>Most people feel the difference within the first week.<br>71,000+ customers across the US agree.</p>
  </div>
  {% for item in event.extra.line_items %}
    {% if item.vendor != "re:do" %}
    <a class="product" href="{{ event.extra.checkout_url }}">
      <img class="product-img" src="{{ item.product.images.0.src }}" alt="{{ item.title }}" />
      <div class="product-body">
        <p class="product-name">{{ item.title }}</p>
        <p class="product-price">\${{ item.price }}</p>
      </div>
    </a>
    {% endif %}
  {% endfor %}
  <div class="proof">
    <p class="stars">★★★★★</p>
    <p class="quote">"I was skeptical. By day four my afternoon slump was gone and my skin stopped breaking out. I don't know what changed except the water."</p>
    <p class="reviewer">— Jamie R., Verified Buyer</p>
  </div>
  <div class="cta">
    <a class="cta-btn" href="{{ event.extra.checkout_url }}">Complete My Order</a>
  </div>
  <div class="footer">
    <p>4.7 stars on Walmart · 60-day risk-free trial on every order.<br><br>
    <a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
  </div>
</div>
</body></html>`;

const EMAIL_3_HTML = `<!doctype html>
<html><head><meta charset="UTF-8">
<style>
  body { margin:0; padding:0; background:#f0f0ee; font-family:Arial,sans-serif; }
  .wrap { max-width:600px; margin:0 auto; background:#fff; }
  .header { background:#142B77; padding:24px 40px; text-align:center; }
  .header-title { color:#fff; font-size:22px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
  .banner { background:#142B77; border-top:1px solid rgba(255,255,255,0.15); padding:16px 40px; text-align:center; }
  .banner p { color:#fff; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:2px; margin:0; }
  .discount-code { font-size:24px; letter-spacing:4px; color:#fff; font-weight:900; display:block; margin-top:4px; }
  .hero { padding:48px 40px 24px; text-align:center; }
  .hero h1 { font-size:26px; font-weight:900; color:#142B77; text-transform:uppercase; margin:0 0 12px; }
  .hero p { font-size:15px; color:#555; line-height:1.6; margin:0; }
  .product { margin:24px 40px; border:1.5px solid #142B77; border-radius:8px; overflow:hidden; text-decoration:none; display:block; }
  .product-img { width:100%; height:220px; object-fit:cover; display:block; background:#f4f4f4; }
  .product-body { padding:16px 20px; }
  .product-name { font-size:15px; font-weight:700; color:#142B77; margin:0 0 6px; text-transform:uppercase; }
  .product-price-row { display:flex; align-items:center; gap:10px; }
  .product-price-original { font-size:14px; color:#aaa; text-decoration:line-through; margin:0; }
  .product-price-sale { font-size:18px; font-weight:900; color:#c0392b; margin:0; }
  .urgency { margin:0 40px 24px; background:#fff8f0; border:1.5px solid #f0d9c0; border-radius:8px; padding:16px; text-align:center; }
  .urgency p { font-size:13px; color:#8a4a00; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin:0; }
  .cta { padding:8px 40px 40px; text-align:center; }
  .cta-btn { display:inline-block; background:#142B77; color:#fff; text-decoration:none; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:2px; padding:16px 40px; border-radius:100px; }
  .cta-sub { font-size:12px; color:#aaa; margin:10px 0 0; }
  .footer { border-top:1px solid #eee; padding:24px 40px; text-align:center; }
  .footer p { font-size:12px; color:#aaa; line-height:1.6; margin:0; }
  .footer a { color:#142B77; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="header-title">Dr.Water</div></div>
  <div class="banner">
    <p>Your exclusive offer<span class="discount-code">DRWATER10</span></p>
  </div>
  <div class="hero">
    <h1>Last chance.<br>10% off your cart.</h1>
    <p>This is the last email we'll send. The code expires in 48 hours<br>and it's just for you — no strings attached.</p>
  </div>
  {% for item in event.extra.line_items %}
    {% if item.vendor != "re:do" %}
    <a class="product" href="{{ event.extra.checkout_url }}?discount=DRWATER10">
      <img class="product-img" src="{{ item.product.images.0.src }}" alt="{{ item.title }}" />
      <div class="product-body">
        <p class="product-name">{{ item.title }}</p>
        <div class="product-price-row">
          <p class="product-price-original">\${{ item.compare_at_price }}</p>
          <p class="product-price-sale">\${{ item.price }}</p>
        </div>
      </div>
    </a>
    {% endif %}
  {% endfor %}
  <div class="urgency">
    <p>⏳ &nbsp;Code expires in 48 hours. Don't leave it on the table.</p>
  </div>
  <div class="cta">
    <a class="cta-btn" href="{{ event.extra.checkout_url }}?discount=DRWATER10">Claim My 10% Off</a>
    <p class="cta-sub">Applied automatically at checkout.</p>
  </div>
  <div class="footer">
    <p>After this, the cart clears and the offer goes with it.<br><br>
    <a href="{{ unsubscribe_url }}">Unsubscribe</a></p>
  </div>
</div>
</body></html>`;

// ─────────────────────────────────────────────
// MAIN — deletes old flow templates then creates fresh flow
// ─────────────────────────────────────────────

async function main() {
  const client = axios.create({
    baseURL: "https://a.klaviyo.com/api",
    headers: {
      Authorization: `Klaviyo-API-Key ${API_KEY}`,
      revision: "2024-02-15",
      "Content-Type": "application/json",
    },
  });

  const betaClient = axios.create({
    baseURL: "https://a.klaviyo.com/api",
    headers: {
      Authorization: `Klaviyo-API-Key ${API_KEY}`,
      revision: "2024-10-15.pre",
      "Content-Type": "application/json",
    },
  });

  // STEP 1: Find metric
  console.log("🔍 Looking up Checkout Started metric...");
  const metricsRes = await client.get("/metrics/");
  const checkoutMetric = metricsRes.data.data.find(
    (m) => m.attributes.name === "Checkout Started",
  );
  if (!checkoutMetric)
    throw new Error("Could not find 'Checkout Started' metric.");
  const METRIC_ID = checkoutMetric.id;
  console.log(`✅ Metric: ${METRIC_ID}`);

  // STEP 2: Create templates
  async function createTemplate(name, html) {
    const res = await client.post("/templates/", {
      data: {
        type: "template",
        attributes: { name, editor_type: "CODE", html },
      },
    });
    return res.data.data.id;
  }

  console.log("📧 Creating templates...");
  const tpl1Id = await createTemplate("ATC Flow - Email 1 (1hr)", EMAIL_1_HTML);
  console.log("✅ Template 1:", tpl1Id);
  const tpl2Id = await createTemplate(
    "ATC Flow - Email 2 (24hr)",
    EMAIL_2_HTML,
  );
  console.log("✅ Template 2:", tpl2Id);
  const tpl3Id = await createTemplate(
    "ATC Flow - Email 3 (72hr)",
    EMAIL_3_HTML,
  );
  console.log("✅ Template 3:", tpl3Id);

  // STEP 3: Create flow
  console.log("🔧 Creating flow...");
  const flowRes = await betaClient.post("/flows/", {
    data: {
      type: "flow",
      attributes: {
        name: "Dr.Water — Add to Cart Abandonment",
        definition: {
          triggers: [{ type: "metric", id: METRIC_ID, trigger_filter: null }],
          profile_filter: null,
          entry_action_id: "delay_1hr",
          actions: [
            // T+1hr → Email 1
            {
              temporary_id: "delay_1hr",
              type: "time-delay",
              links: { next: "email_1" },
              data: {
                unit: "hours",
                value: 1,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "email_1",
              type: "send-email",
              links: { next: "delay_2hr" },
              data: {
                message: {
                  template_id: tpl1Id,
                  subject_line: "You left something in your cart",
                  preview_text:
                    "Your cart is saved. Pick up where you left off.",
                  from_email: FROM_EMAIL,
                  from_label: FROM_LABEL,
                  reply_to_email: REPLY_TO,
                  cc_email: null,
                  bcc_email: null,
                },
              },
            },
            // T+3hr → SMS 1
            {
              temporary_id: "delay_2hr",
              type: "time-delay",
              links: { next: "sms_1" },
              data: {
                unit: "hours",
                value: 2,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "sms_1",
              type: "send-sms",
              links: { next: "delay_21hr" },
              data: {
                message: {
                  body: "Hey {{ first_name|default:'there' }} 👋 Still have items in your Dr.Water cart? Pick up where you left off: {{ event.extra.checkout_url }}  Reply STOP to unsubscribe.",
                },
              },
            },
            // T+24hr → Email 2
            {
              temporary_id: "delay_21hr",
              type: "time-delay",
              links: { next: "email_2" },
              data: {
                unit: "hours",
                value: 21,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "email_2",
              type: "send-email",
              links: { next: "delay_1hr_b" },
              data: {
                message: {
                  template_id: tpl2Id,
                  subject_line:
                    "Still thinking about it, {{ first_name|default:'friend' }}?",
                  preview_text: "Here's what 71,000+ customers are saying.",
                  from_email: FROM_EMAIL,
                  from_label: FROM_LABEL,
                  reply_to_email: REPLY_TO,
                  cc_email: null,
                  bcc_email: null,
                },
              },
            },
            // T+25hr → SMS 2
            {
              temporary_id: "delay_1hr_b",
              type: "time-delay",
              links: { next: "sms_2" },
              data: {
                unit: "hours",
                value: 1,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "sms_2",
              type: "send-sms",
              links: { next: "delay_47hr" },
              data: {
                message: {
                  body: "{{ first_name|default:'Hey' }}, your Dr.Water cart is still waiting ⚡ Most customers notice a real difference by day 3. Your body's worth the try → {{ event.extra.checkout_url }}  Reply STOP to unsubscribe.",
                },
              },
            },
            // T+72hr → Email 3
            {
              temporary_id: "delay_47hr",
              type: "time-delay",
              links: { next: "email_3" },
              data: {
                unit: "hours",
                value: 47,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "email_3",
              type: "send-email",
              links: { next: "delay_1hr_c" },
              data: {
                message: {
                  template_id: tpl3Id,
                  subject_line: "Last chance — 10% off is waiting for you",
                  preview_text: "Code DRWATER10 · Expires in 48 hours.",
                  from_email: FROM_EMAIL,
                  from_label: FROM_LABEL,
                  reply_to_email: REPLY_TO,
                  cc_email: null,
                  bcc_email: null,
                },
              },
            },
            // T+73hr → SMS 3
            {
              temporary_id: "delay_1hr_c",
              type: "time-delay",
              links: { next: "sms_3" },
              data: {
                unit: "hours",
                value: 1,
                secondary_value: 0,
                timezone: "profile",
                delay_until_time: null,
                delay_until_weekdays: null,
              },
            },
            {
              temporary_id: "sms_3",
              type: "send-sms",
              links: { next: null },
              data: {
                message: {
                  body: "Last one from us 🙌 Take 10% off with code DRWATER10 — expires in 24hrs. {{ event.extra.checkout_url }}?discount=DRWATER10  Reply STOP to unsubscribe.",
                },
              },
            },
          ],
        },
      },
    },
  });

  const flowId = flowRes.data.data.id;
  console.log("✅ Flow created:", flowId);
  console.log(`\n🎉 Done! https://www.klaviyo.com/flow/${flowId}/edit`);
  console.log(
    "📝 Delete the old draft flow in the UI, then activate this one.",
  );
}

main().catch((e) => {
  console.error("❌ Error:");
  console.error(JSON.stringify(e.response?.data || e.message, null, 2));
});
