// Uploads Dr. Water's custom fonts to Supabase Storage and updates the brands table.
// Run with: node scripts/upload-drwater-fonts.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { getSupabase } = require('../lib/supabase');

const FONTS_DIR = path.join(__dirname, '../../');
const BUCKET = 'brand-assets';

const FONT_FILES = [
  {
    localPath: path.join(FONTS_DIR, 'just_sans/JUST Sans Regular.woff2'),
    storagePath: 'fonts/drwater.store/just-sans-regular.woff2',
    contentType: 'font/woff2',
    role: 'body_woff2',
  },
  {
    localPath: path.join(FONTS_DIR, 'just_sans/JUST Sans Regular.woff'),
    storagePath: 'fonts/drwater.store/just-sans-regular.woff',
    contentType: 'font/woff',
    role: 'body_woff',
  },
  {
    localPath: path.join(FONTS_DIR, 'just_sans/JUST Sans ExBold.woff2'),
    storagePath: 'fonts/drwater.store/just-sans-exbold.woff2',
    contentType: 'font/woff2',
    role: 'bold_woff2',
  },
  {
    localPath: path.join(FONTS_DIR, 'just_sans/JUST Sans ExBold.woff'),
    storagePath: 'fonts/drwater.store/just-sans-exbold.woff',
    contentType: 'font/woff',
    role: 'bold_woff',
  },
  {
    localPath: path.join(FONTS_DIR, 'Akanome.otf'),
    storagePath: 'fonts/drwater.store/akanome.otf',
    contentType: 'font/otf',
    role: 'display_otf',
  },
];

async function upload(supabase, file) {
  const buffer = fs.readFileSync(file.localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(file.storagePath, buffer, { contentType: file.contentType, upsert: true });
  if (error) throw new Error(`Upload failed for ${file.storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(file.storagePath);
  return data.publicUrl;
}

async function main() {
  const supabase = getSupabase();
  const urls = {};

  for (const file of FONT_FILES) {
    if (!fs.existsSync(file.localPath)) {
      console.warn(`  SKIP (not found): ${file.localPath}`);
      continue;
    }
    process.stdout.write(`  Uploading ${path.basename(file.localPath)}... `);
    const url = await upload(supabase, file);
    urls[file.role] = url;
    console.log('OK');
  }

  // Build the fonts object for the brands table
  const fonts = {
    display: {
      name: 'Akanome',
      url:  urls.display_otf,
      format: 'opentype',
    },
    body: {
      name:    'JUST Sans',
      url:     urls.body_woff2,
      urlWoff: urls.body_woff,
      format:  'woff2',
    },
    bodyBold: {
      name:    'JUST Sans',
      weight:  '800',
      url:     urls.bold_woff2,
      urlWoff: urls.bold_woff,
      format:  'woff2',
    },
  };

  const { data, error } = await supabase
    .from('brands')
    .update({ fonts, updated_at: new Date().toISOString() })
    .eq('shop_domain', 'drwater.store')
    .select('shop_domain, fonts')
    .single();

  if (error) throw error;

  console.log('\nBrand fonts updated:');
  console.log(JSON.stringify(data.fonts, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
