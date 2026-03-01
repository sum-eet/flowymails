// One-time seed script: upsert Dr. Water brand data into the brands table.
// Run with: node scripts/seed-drwater-brand.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getSupabase } = require('../lib/supabase');

const BRAND = {
  shop_domain: 'drwater.store',
  logo_url: 'https://cdn.shopify.com/s/files/1/0671/4245/1372/files/drwater-logo.png',
  colours: {
    primary:          '#1a237e',   // deep navy blue
    accent:           '#c6f135',   // lime green
    background:       '#ffffff',
    text:             '#18181B',
    textSub:          '#71717A',
    cta:              '#1a237e',
    ctaText:          '#ffffff',
    footerBg:         '#1a1a2e',
    footerText:       '#ffffff',
    footerTextSub:    '#aaaaaa',
    announcementText: '#000000',
    surfaceAlt:       '#f9f9f9',
  },
  fonts: {
    display: { name: 'Georgia' },
    body:    { name: 'Arial' },
  },
  product_images: [
    {
      url:         'https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Bundle3.png?v=1768054098',
      productName: 'Dr.Water Performance Max Bundle',
      price:       '499.99',
    },
    {
      url:         'https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Bundle2.png?v=1768054373',
      productName: 'Family Hydration Essentials Bundle for the Fam',
      price:       '439.99',
    },
    {
      url:         'https://cdn.shopify.com/s/files/1/0671/4245/1372/files/Frame_62.png?v=1769608783',
      productName: 'Glowsoft Filter',
      price:       '59.99',
    },
    {
      url:         'https://cdn.shopify.com/s/files/1/0671/4245/1372/files/package-icon.png?v=1765902996',
      productName: 'Free Return Shipping',
      price:       '1.85',
    },
  ],
  raw_scrape: { seeded_manually: true },
  gaps: [],
  updated_at: new Date().toISOString(),
};

async function main() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('brands')
    .upsert(BRAND, { onConflict: 'shop_domain' })
    .select()
    .single();

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log('Dr. Water brand seeded successfully:');
  console.log('  shop_domain:  ', data.shop_domain);
  console.log('  logo_url:     ', data.logo_url);
  console.log('  colours:      ', JSON.stringify(data.colours));
  console.log('  fonts:        ', JSON.stringify(data.fonts));
  console.log('  product_images:', data.product_images?.length, 'found');
}

main();
