const axios = require("axios");

const API_KEY = "pk_7b8b711d067390a0f4415cab0fe382e85c";

const SEGMENT_ID = "TavdPF";

async function checkSegment() {
  try {
    const response = await axios.get(
      `https://a.klaviyo.com/api/segments/${SEGMENT_ID}`,
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${API_KEY}`,
          revision: "2024-02-15",
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Segment Found:");
    console.log("Name:", response.data.data.attributes.name);
    console.log("ID:", response.data.data.id);
  } catch (error) {
    console.error("❌ Error:");
    console.error(error.response?.data || error.message);
  }
}

checkSegment();
