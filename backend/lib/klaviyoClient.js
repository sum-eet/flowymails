const axios = require('axios');

// Single revision for all calls (2024-10-15).
// Beta pre-release (2024-10-15.pre) is still required ONLY for POST /flows/ and GET /flows/:id/
// per flow1.js proven patterns — pass beta=true for those calls only.
function makeKlaviyoClient(apiKey, beta = false) {
  return axios.create({
    baseURL: 'https://a.klaviyo.com/api',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: beta ? '2024-10-15.pre' : '2024-10-15',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

// Pagination: pass links.next directly to client.get() — it is always a full absolute URL.
// Never extract page[cursor] manually; axios handles absolute URLs correctly.
async function klaviyoGetAll(client, path) {
  const results = [];
  let url = path;
  while (url) {
    const res = await client.get(url);
    results.push(...(res.data.data || []));
    url = res.data.links?.next || null;
  }
  return results;
}

module.exports = { makeKlaviyoClient, klaviyoGetAll };
