// One-time seed script: upsert Dr. Water brand data into the brands table.
// Run with: node scripts/seed-drwater-brand.js
// NOTE: Run supabase/migrations/002_brand_roles.sql in Supabase dashboard first.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { getSupabase } = require('../lib/supabase');
const { computeBrandRoles } = require('../lib/brandRoles');

const rawColours = {
  primary:    '#1a237e',  // deep navy blue
  accent:     '#c6f135',  // lime green
  background: '#ffffff',
  footerBg:   '#1a1a2e',
};

const BRAND = {
  shop_domain:    'drwater.store',
  logo_url:       'https://drwater.store/cdn/shop/files/DR.WATER.webp?height=50&v=1769435178',
  logo_url_light: 'https://drwater.store/cdn/shop/files/DR.WATER.webp?height=50&v=1769435178',
  colours:        rawColours,
  color_roles:    computeBrandRoles(rawColours),
  fonts: {
    display: {
      name:   'Akanome',
      url:    'https://pxttzshyfafrdsbyeusq.supabase.co/storage/v1/object/public/brand-assets/fonts/drwater.store/akanome.otf',
      format: 'opentype',
    },
    body: {
      name:    'JUST Sans',
      url:     'https://pxttzshyfafrdsbyeusq.supabase.co/storage/v1/object/public/brand-assets/fonts/drwater.store/just-sans-regular.woff2',
      urlWoff: 'https://pxttzshyfafrdsbyeusq.supabase.co/storage/v1/object/public/brand-assets/fonts/drwater.store/just-sans-regular.woff',
      format:  'woff2',
    },
    bodyBold: {
      name:    'JUST Sans',
      weight:  '800',
      url:     'https://pxttzshyfafrdsbyeusq.supabase.co/storage/v1/object/public/brand-assets/fonts/drwater.store/just-sans-exbold.woff2',
      urlWoff: 'https://pxttzshyfafrdsbyeusq.supabase.co/storage/v1/object/public/brand-assets/fonts/drwater.store/just-sans-exbold.woff',
      format:  'woff2',
    },
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
  tagline:    'More than just water — hydrogen hydration for modern wellness.',
  social:     { instagram: 'https://www.instagram.com/drwater.store', facebook: 'https://www.facebook.com/drwater.store' },
  raw_scrape: { seeded_manually: true },
  gaps:       [],
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
    if (error.message.includes('color_roles') || error.message.includes('logo_url_light')) {
      console.error('\n→ Run supabase/migrations/002_brand_roles.sql in Supabase dashboard first.');
    }
    process.exit(1);
  }

  console.log('Dr. Water brand seeded successfully:');
  console.log('  shop_domain:  ', data.shop_domain);
  console.log('  logo_url:     ', data.logo_url);
  console.log('  color_roles:  ', !!data.color_roles ? 'computed' : 'missing (run migration first)');
  console.log('  fonts:        ', JSON.stringify({ display: data.fonts?.display?.name, body: data.fonts?.body?.name }));
  console.log('  product_images:', data.product_images?.length, 'found');
}

main();
