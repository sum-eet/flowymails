const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "WajWyB";

// Sat Feb 23, 11:00 AM in your Klaviyo account timezone
const SEND_AT = "2026-02-23T11:00:00";

const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

const SUBJECT = "Sunday is genuinely the best day to make this call";
const PREHEADER = "No noise. No rushing. Just the right moment.";

const COUPON_CODE_EMAIL = "DRW-QM7R-SUN02";
const COUPON_CODE_SMS = "SUN02";

const PITCHER_LINK = "https://drwater.store/products/hydrogen-water-pitcher";
const HPRO_LINK = "https://drwater.store/products/dr-water-hydrator-pro";

const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000;">

<p><strong>Sunday Reset</strong></p>

<p>Hey {{ first_name|default:"there" }},</p>

<p>There's a reason Sunday outperforms every other day for decisions like this. You're not in the middle of something. You're not rushed. You're thinking about the week ahead and what you want it to feel like.</p>

<p>We set a Sunday code aside. It works on everything. Apply it at checkout and it'll knock a bit more off what you already see on the site. We leave the exact number as a mystery because that's half the point.</p>

<div style="border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; margin: 14px 0 18px; background: #fafafa;">
  <div style="font-size: 13px; text-transform: uppercase; color: #444;">
    Your Sunday code
  </div>
  <div style="font-size: 20px; font-weight: 700; margin-top: 6px;">
    ${COUPON_CODE_EMAIL}
  </div>
  <div style="font-size: 13px; color: #444; margin-top: 6px;">
    Apply at checkout. Expires at midnight.
  </div>
</div>

<p><strong>The HydroPitcher (68oz glass, 1,500 PPB hydrogen per cycle)</strong><br>
Starts at $125 on the site. Your code <strong>${COUPON_CODE_EMAIL}</strong> brings it down more. First-time customers only for 1 unit. Two units come to $199 for the pair and that one is open to anyone.<br><br>
What comes with every Pitcher order, automatically:<br>
Extended warranty. Free 48-hour shipping. HydroFixx electrolyte mix. Hydration ebook.<br><br>
<a href="${PITCHER_LINK}" style="color: #0066cc;">Shop the HydroPitcher →</a></p>

<p><strong>The Hydrator Pro (5,140 PPB, the highest concentration we make)</strong><br>
This is for people who want hydrogen water on the go and at their best. 5.14 PPM. It's our top-rated product and the one that shows up in Time Magazine, GQ, Women's Health.<br><br>
1 unit at $134.99 with the code <strong>${COUPON_CODE_EMAIL}</strong>. 2 at $229.99.<br>
Both include: HydroFixx in 2 flavours. Carrier. MHI Expert Access. Hydration ebook.<br><br>
<a href="${HPRO_LINK}" style="color: #0066cc;">Shop the Hydrator Pro →</a></p>

<p>60 days to try it risk-free. 71,000+ customers who already have. Arrives in 48 hours.</p>

<p><strong>Code expires at midnight.</strong> The Monday version of this will be different.</p>

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
        name: "Sunday Reset - 11am",
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
            { name: "utm_campaign", value: "sunday-reset" },
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
        name: "Sunday Reset - Feb 23",
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

  // NOTE: SMS code provided for your reference: SUN02
  // If you want, I can generate a separate SMS campaign script using COUPON_CODE_SMS.
}

main().catch((e) => {
  console.error("❌ Error:");
  console.error(JSON.stringify(e.response?.data || e.message, null, 2));
});
