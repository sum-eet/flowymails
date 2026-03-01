const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "TavdPF";

// Feb 27, 10:30 AM in your Klaviyo account timezone
const SEND_AT = "2026-02-27T10:30:00";

const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

const SUBJECT = "The 2-unit math is kind of hard to argue with";
const PREHEADER = "Not pushing. Just showing you the numbers.";

const COUPON_CODE_EMAIL = "DRW-PL5W-THU05";
const COUPON_CODE_SMS = "THU05";

const PITCHER_LINK = "https://drwater.store/products/hydrogen-water-pitcher";
const HPRO_LINK = "https://drwater.store/products/dr-water-hydrator-pro";

const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000;">

<p><strong>Bundle Value Emphasis</strong></p>

<p>Hey {{ first_name|default:"there" }},</p>

<p>We are not going to tell you the 2-unit deal is the smarter move. You can do the math yourself.</p>

<div style="border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; margin: 14px 0 18px; background: #fafafa;">
  <div style="font-size: 13px; text-transform: uppercase; color: #444;">
    Today's code
  </div>
  <div style="font-size: 20px; font-weight: 700; margin-top: 6px;">
    ${COUPON_CODE_EMAIL}
  </div>
  <div style="font-size: 13px; color: #444; margin-top: 6px;">
    Expires at midnight.
  </div>
</div>

<p><strong>HydroPitcher, 2 units:</strong><br>
Retail is $400 for two. The site shows $199. Your code today brings it down further. That is $201 in savings before the code even touches it.<br><br>
What is included with both units: extended warranty, 48-hour free shipping, HydroFixx electrolyte mix, and the hydration ebook. All of it, for both.</p>

<p><strong>Hydrator Pro, 2 units:</strong><br>
Retail is $299.98 for two. Down to $229.99. Your code shaves more off. Each one comes with HydroFixx in 2 flavours, a carrier, MHI Expert Access, and the ebook.</p>

<p>If you are buying for yourself only, single units are still the sharpest pricing they have been:</p>

<p><strong>Pitcher 1 unit:</strong> $125 on the site, code brings it lower. First-time customers only.<br>
<strong>Hydrator Pro 1 unit:</strong> $134.99 with the code. Open to everyone.</p>

<p>Both products are third-party certified, FDA-compliant, and covered by a 60-day risk-free trial. Arrives in 48 hours.</p>

<p><strong>Today's code is ${COUPON_CODE_EMAIL}.</strong> Expires at midnight. Same price. Different code tomorrow.</p>

<p>
<a href="${PITCHER_LINK}" style="color: #0066cc;">Shop the HydroPitcher →</a><br>
<a href="${HPRO_LINK}" style="color: #0066cc;">Shop the Hydrator Pro →</a>
</p>

</body>
</html>`;

async function main() {
  const client = axios.create({
    baseURL: "https://a.klaviyo.com/api",
    headers: {
      Authorization: `Klaviyo-API-Key ${API_KEY}`,
      revision: "2024-02-15",
      "Content-Type": "application/json",
    },
  });

  // STEP 1: Create campaign
  const createRes = await client.post("/campaigns/", {
    data: {
      type: "campaign",
      attributes: {
        name: "Bundle Value Emphasis - Feb 27 - 10:30am",
        audiences: {
          included: [SEGMENT_ID],
          excluded: [],
        },
        send_options: {
          use_smart_sending: false,
          ignore_unsubscribes: false,
        },
        tracking_options: {
          is_tracking_opens: true,
          is_tracking_clicks: true,
          is_add_utm: true,
          utm_params: [
            { name: "utm_source", value: "klaviyo" },
            { name: "utm_medium", value: "email" },
            { name: "utm_campaign", value: "bundle-value-emphasis" },
          ],
        },
        send_strategy: {
          method: "static",
          options_static: {
            datetime: SEND_AT,
            is_local: false,
          },
        },
        "campaign-messages": {
          data: [
            {
              type: "campaign-message",
              attributes: {
                channel: "email",
                label: "main",
                content: {
                  subject: SUBJECT,
                  preview_text: PREHEADER,
                  from_email: FROM_EMAIL,
                  from_label: FROM_LABEL,
                  reply_to_email: REPLY_TO,
                },
              },
            },
          ],
        },
      },
    },
  });

  const campaignId = createRes.data.data.id;
  console.log("✅ Campaign created:", campaignId);

  // STEP 2: Get message ID
  const msgRes = await client.get(
    `/campaigns/${campaignId}/campaign-messages/`,
  );
  const messageId = msgRes.data.data?.[0]?.id;
  if (!messageId) throw new Error("No campaign message found.");
  console.log("✅ Message id:", messageId);

  // STEP 3: Create template
  const tplRes = await client.post("/templates/", {
    data: {
      type: "template",
      attributes: {
        name: "Bundle Value Emphasis - Feb 27",
        editor_type: "CODE",
        html: HTML,
      },
    },
  });

  const templateId = tplRes.data.data.id;
  console.log("✅ Template created:", templateId);

  // STEP 4: Assign template
  await client.post("/campaign-message-assign-template/", {
    data: {
      type: "campaign-message",
      id: messageId,
      relationships: {
        template: {
          data: {
            type: "template",
            id: templateId,
          },
        },
      },
    },
  });

  console.log("✅ Template assigned to message");

  // STEP 5: Schedule campaign
  const sendJobRes = await client.post("/campaign-send-jobs/", {
    data: {
      type: "campaign-send-job",
      id: campaignId,
    },
  });

  console.log("🚀 Campaign scheduled! Send job id:", sendJobRes.data.data.id);

  // NOTE: SMS code provided for your reference: THU05
  // If you want, I can generate a separate SMS campaign script using COUPON_CODE_SMS.
}

main().catch((e) => {
  console.error("❌ Error:");
  console.error(JSON.stringify(e.response?.data || e.message, null, 2));
});
