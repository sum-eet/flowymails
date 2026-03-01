const axios = require('axios');

function makeShopifyClient(shop, accessToken) {
  return axios.create({
    baseURL: `https://${shop}/admin/api/2024-01`,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  });
}

module.exports = { makeShopifyClient };
