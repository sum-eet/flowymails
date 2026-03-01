const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "WajWyB";

// Feb 24, 5:00 PM in your Klaviyo account timezone
const SEND_AT = "2026-02-24T17:00:00";

const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

const SUBJECT = "Monday people are a specific type. This one's for you.";
const PREHEADER = "The ones who open emails on Monday actually follow through.";

const COUPON_CODE = "DRW-BK2L-MON03";

const PITCHER_LINK = "https://drwater.store/products/hydrogen-water-pitcher";
const HPRO_LINK = "https://drwater.store/products/dr-water-hydrator-pro";

const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000;">

<p><strong>Monday Routine</strong></p>

<p>Hey {{ first_name|default:"there" }},</p>

<p>Monday openers are not an accident. They started the week with intention. That is exactly the person this brand was built for.</p>

<p>Here is your Monday code. Apply it at checkout and you will see an extra discount come off. We keep the specific number hidden on purpose. It is always a bit better than expected.</p>

<div style="border: 1px solid #e5e5e5; border-radius: 10px; padding: 14px 16px; margin: 14px 0 18px; background: #fafafa;">
  <div style="font-size: 13px; text-transform: uppercase; color: #444;">
    Your Monday code
  </div>
  <div style="font-size: 20px; font-weight: 700; margin-top: 6px;">
    ${COUPON_CODE}
  </div>
  <div style="font-size: 13px; color: #444; margin-top: 6px;">
    Good today only. Monday codes do not carry into Tuesday.
  </div>
</div>

<p><strong>The HydroPitcher (68oz glass, 1,500 PPB, 10-minute cycle)</strong><br>
This is your whole-household setup. Hydrogen-rich water ready in the time it takes to make coffee. It was $200. It is already $125 on the site. The code <strong>${COUPON_CODE}</strong> brings it further.<br><br>
1 unit is first-time customer pricing. 2 units at $199 is open to everyone.<br><br>
Comes with: extended warranty, free 48-hour shipping, HydroFixx electrolyte mix, and the hydration ebook. All included. No extra steps.<br><br>
<a href="${PITCHER_LINK}" style="color: #0066cc;">Shop the HydroPitcher →</a></p>

<p><strong>The Hydrator Pro (5,140 PPB, our most powerful)</strong><br>
Built for people who move. High-concentration hydrogen, carrier included, electrolyte mix in both flavours. This is the one people use every single morning.<br><br>
1 unit at $134.99 with your code <strong>${COUPON_CODE}</strong>. 2 at $229.99. Also includes MHI Expert Access and the ebook.<br><br>
<a href="${HPRO_LINK}" style="color: #0066cc;">Shop the Hydrator Pro →</a></p>

<p>Backed by 1,500 studies on hydrogen effectiveness. Certified, FDA-compliant, and covered by a 60-day risk-free trial. 71,000+ customers and counting.</p>

<p><strong>Code:</strong> ${COUPON_CODE}. Good today only. Monday codes do not carry into Tuesday.</p>

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
        name: "Monday Routine - Feb 24 - 5pm",
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
            { name: "utm_campaign", value: "monday-routine" },
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
        name: "Monday Routine - Feb 24",
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
}

main().catch((e) => {
  console.error("❌ Error:");
  console.error(JSON.stringify(e.response?.data || e.message, null, 2));
});
