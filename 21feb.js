const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "TavdPF";

// Datetime in your Klaviyo account's timezone (check Settings > Account > Timezone)
const SEND_AT = "2026-02-21T19:00:00";

const FROM_EMAIL = "support@drwater.store";
const FROM_LABEL = "Dr. Water";
const REPLY_TO = "support@drwater.store";

const SUBJECT = "We set a code aside for Saturday openers";
const PREHEADER = "It's not in our ads. Not on the site. Just here.";

const PITCHER_LINK = "https://drwater.store/products/hydrogen-water-pitcher";
const HPRO_LINK = "https://drwater.store/products/dr-water-hydrator-pro";

// Build HTML directly — no escaping so Klaviyo tags like {{ first_name }} survive.
// Links are proper <a> tags so they're clickable.
const HTML = `<!doctype html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; color: #000000;">

<p>Hey {{ first_name|default:"there" }},</p>

<p>Most people wait until Monday to do something about their health. You opened this on a Saturday. That tells us something about you.</p>

<p>We pulled a code for this exact send. It's not posted anywhere. It doesn't live on the site. It's just here, for the people paying attention.</p>

<p>Apply it at checkout and it'll unlock a little extra off what you already see. We keep the exact amount as a surprise because honestly, that's the fun part.</p>

<p><strong>Here's what's in the offer:</strong></p>

<p><strong>The HydroPitcher (68oz Glass, up to 1,500 PPB hydrogen)</strong><br>
This is the family one. Countertop plug-in. One 10-minute cycle hydrogenates the whole pitcher. Glass build, not plastic. Great for households or anyone who wants their water to work harder without thinking about it.<br><br>
1 unit is already $125 on the site (was $200). Your code takes it further. First-time customers only for the single unit deal.<br>
2 units drop to $199 total, which works out to $99.50 each. That one is open to everyone.<br><br>
Every order comes with 4 things included automatically, no opt-in needed:<br>
1. Extended warranty<br>
2. Free shipping, delivered in 48 hours<br>
3. HydroFixx (our hydrogen + electrolyte mix)<br>
4. Hydration ebook covering the science<br><br>
<a href="${PITCHER_LINK}" style="color: #0066cc;">Shop the HydroPitcher &rarr;</a></p>

<p><strong>The Hydrator Pro (5,140 PPB, our flagship)</strong><br>
This is the personal performance one. It generates over 5x the hydrogen concentration of the Pitcher. Built for daily carry, gym, desk, wherever your routine takes you.<br><br>
1 unit is $134.99 with the code. 2 units come to $229.99.<br><br>
Every order also comes with 4 gifts included automatically:<br>
1. HydroFixx in 2 flavours<br>
2. Carrier so it travels with you<br>
3. MHI Expert Access<br>
4. Hydration ebook<br><br>
<a href="${HPRO_LINK}" style="color: #0066cc;">Shop the Hydrator Pro &rarr;</a></p>

<p>4.7 stars on Walmart. 4.2 on Amazon. 71,000+ customers across the US. Third-party certified, FDA compliant. 60-day risk-free trial on every order.</p>

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
        name: "Saturday Openers - 7pm",
        audiences: {
          included: [SEGMENT_ID],
          excluded: [],
        },
        send_options: {
          use_smart_sending: false, // Smart sending OFF
          ignore_unsubscribes: false,
        },
        tracking_options: {
          is_tracking_opens: true,
          is_tracking_clicks: true,
          is_add_utm: true,
          utm_params: [
            { name: "utm_source", value: "klaviyo" },
            { name: "utm_medium", value: "email" },
            { name: "utm_campaign", value: "saturday-openers" },
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

  // STEP 2: Get the campaign message ID
  const msgRes = await client.get(
    `/campaigns/${campaignId}/campaign-messages/`,
  );
  const messageId = msgRes.data.data?.[0]?.id;
  if (!messageId) throw new Error("No campaign message found.");
  console.log("✅ Message id:", messageId);

  // STEP 3: Create HTML template
  const tplRes = await client.post("/templates/", {
    data: {
      type: "template",
      attributes: {
        name: "Saturday Openers - Feb 21",
        editor_type: "CODE",
        html: HTML,
      },
    },
  });
  const templateId = tplRes.data.data.id;
  console.log("✅ Template created:", templateId);

  // STEP 4: Assign template to campaign message
  // Correct shape: type = "campaign-message", id = messageId, template in relationships
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

  // STEP 5: Schedule the campaign
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
