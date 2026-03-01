const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "WajWyB";

// Feb 25, 11:35 AM in your Klaviyo account timezone
const SEND_AT = "2026-02-25T11:35:00";

const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

const SUBJECT = "The questions people ask before ordering. Answered.";
const PREHEADER = "We see them in chat every day. So we just put them here.";

const COUPON_CODE_EMAIL = "DRW-VN9T-WED04";
const COUPON_CODE_SMS = "WED04";

const PITCHER_LINK = "https://drwater.store/products/hydrogen-water-pitcher";
const HPRO_LINK = "https://drwater.store/products/dr-water-hydrator-pro";

const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000;">

<p><strong>FAQ Friction Remover</strong></p>

<p>Hey {{ first_name|default:"there" }},</p>

<p>Before most people order, they sit on the same three or four questions. We see them in support chat every week. So instead of a regular email today, we are just going to answer them.</p>

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

<p><strong>What does the mystery code actually do?</strong><br>
The site already shows a reduced price. Your code unlocks an additional percentage off on top of that. We keep the exact number hidden on purpose. It lands between 15 and 20 percent extra. You will see the final number in your cart before you place the order.</p>

<p><strong>What is the difference between the Pitcher and the Hydrator Pro?</strong><br>
<strong>The Pitcher (68oz, glass)</strong> is for the home. It produces up to 1,500 PPB of molecular hydrogen per 10-minute cycle. It sits on your counter and makes enough hydrogen water for the whole household at once. Pick this if you want whole-home coverage or you are buying for more than one person.<br><br>
<strong>The Hydrator Pro</strong> produces 5,140 PPB, which is more than triple the Pitcher's output. It is personal-use, built for daily carry and performance. If you want the strongest hydrogen water in a bottle you can take anywhere, this is the one.</p>

<p><strong>What are the 4 free gifts exactly?</strong><br>
<strong>Pitcher orders get:</strong> extended warranty, free 48-hour shipping, HydroFixx hydrogen and electrolyte mix, and the hydration ebook. All drop into your order automatically.<br>
<strong>Hydrator Pro orders get:</strong> HydroFixx in both flavours, a carrier, MHI Expert Access, and the hydration ebook. Same deal. No extra steps required.</p>

<p><strong>Is there a trial period?</strong><br>
60 days, risk-free. If it does not work for you, that is fine. 71,000+ customers in the US say it does.</p>

<p><strong>Pricing reminder with today's code (${COUPON_CODE_EMAIL}):</strong><br>
Pitcher: from $125 plus extra off with the code. 2 units at $199 for the pair.<br>
Hydrator Pro: from $134.99 with the code. 2 at $229.99.</p>

<p><strong>Code expires at midnight.</strong> Reply to this email if you have a question we did not cover. We actually read them.</p>

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
        name: "FAQ Friction Remover - Feb 25 - 11:35am",
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
            { name: "utm_campaign", value: "faq-friction-remover" },
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
        name: "FAQ Friction Remover - Feb 25",
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

  // NOTE: SMS code provided for your reference: WED04
  // If you want, I can generate a separate SMS campaign script using COUPON_CODE_SMS.
}

main().catch((e) => {
  console.error("❌ Error:");
  console.error(JSON.stringify(e.response?.data || e.message, null, 2));
});
