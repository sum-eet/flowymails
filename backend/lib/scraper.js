// Brand scraping logic
// POST /api/brand/analyse calls scrapeBrand()

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { getSupabase } = require('./supabase');

const UA = 'Mozilla/5.0 (compatible; Mailo/1.0)';
const TIMEOUT = 10000;

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    timeout: TIMEOUT,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

// Parse CSS custom properties and common colour patterns from a CSS string
function extractColoursFromCss(css) {
  const colours = {};

  // CSS custom properties: --primary-color: #xxx or --color-primary: #xxx
  const customProps = {};
  const propRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g;
  let m;
  while ((m = propRegex.exec(css)) !== null) {
    customProps[m[1].toLowerCase()] = m[2];
  }

  // Map common naming patterns
  for (const [key, val] of Object.entries(customProps)) {
    if (!colours.primary && /primary|brand|main/.test(key)) colours.primary = val;
    if (!colours.secondary && /secondary/.test(key)) colours.secondary = val;
    if (!colours.accent && /accent|highlight|cta/.test(key)) colours.accent = val;
    if (!colours.background && /background|bg/.test(key)) colours.background = val;
  }

  return colours;
}

// Extract @font-face families from CSS text
function extractFontsFromCss(css) {
  const fonts = [];
  const faceRegex = /@font-face\s*\{([^}]+)\}/gi;
  let m;
  while ((m = faceRegex.exec(css)) !== null) {
    const block = m[1];
    const nameMatch = /font-family\s*:\s*['"]?([^'";,]+)['"]?/i.exec(block);
    const srcMatch = /src\s*:[^;]+url\(['"]?([^'")\s]+)['"]?\)/i.exec(block);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const url = srcMatch ? srcMatch[1].trim() : null;
      if (!fonts.find(f => f.name === name)) {
        fonts.push({ name, url });
      }
    }
  }
  return fonts;
}

async function fetchStylesheetFonts(baseUrl, $) {
  const fontList = [];
  const links = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
  });

  for (const href of links.slice(0, 5)) { // cap at 5 stylesheets
    try {
      const url = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      const res = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 8000 });
      if (!res.ok) continue;
      const css = await res.text();
      const found = extractFontsFromCss(css);
      fontList.push(...found);
      if (fontList.length >= 2) break;
    } catch {
      // ignore individual stylesheet failures
    }
  }

  // Also check inline <style> tags
  $('style').each((_, el) => {
    const css = $(el).children().text() + $(el).text();
    const found = extractFontsFromCss(css);
    fontList.push(...found);
  });

  return fontList;
}

async function uploadLogoToSupabase(logoUrl) {
  try {
    const res = await fetch(logoUrl, { headers: { 'User-Agent': UA }, timeout: 8000 });
    if (!res.ok) return null;

    const buffer = await res.buffer();
    const contentType = res.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('svg') ? 'svg'
      : contentType.includes('webp') ? 'webp'
      : contentType.includes('png') ? 'png'
      : 'jpg';

    const filename = `logos/${Date.now()}.${ext}`;
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(filename, buffer, { contentType, upsert: true });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filename);

    return urlData?.publicUrl || null;
  } catch {
    return null;
  }
}

async function scrapeBrand(shopDomain) {
  const baseUrl = `https://${shopDomain}`;
  const gaps = [];
  const raw = {};

  // --- Step 1: Fetch homepage HTML ---
  const html = await fetchHtml(baseUrl);
  const $ = cheerio.load(html);

  // --- Step 2: Colours ---
  let colours = {};
  try {
    // Collect all inline styles + style tags
    let allCss = '';
    $('style').each((_, el) => { allCss += $(el).text() + '\n'; });

    // Also check body/header inline style
    const headerStyle = $('header').attr('style') || '';
    allCss += headerStyle;

    colours = extractColoursFromCss(allCss);
    raw.css_vars_found = colours;

    // Fallback: grab computed bg from header element
    if (!colours.background) {
      const headerBg = $('header').css('background-color') || $('header').css('background');
      if (headerBg && /^#|^rgb/.test(headerBg)) colours.background = headerBg;
    }

    // Fallback: look for button colours
    if (!colours.accent) {
      const btnStyle = $('button, .btn, [class*="button"]').first().attr('style') || '';
      const bgMatch = /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/i.exec(btnStyle);
      if (bgMatch) colours.accent = bgMatch[1];
    }

    if (!colours.primary && !colours.secondary && !colours.accent && !colours.background) {
      gaps.push('colours');
    }
  } catch {
    gaps.push('colours');
  }

  // --- Step 3: Logo ---
  let logoUrl = null;
  try {
    // header img with 'logo' in class or alt
    $('header img, .header img, #header img').each((_, el) => {
      if (logoUrl) return;
      const alt = ($(el).attr('alt') || '').toLowerCase();
      const cls = ($(el).attr('class') || '').toLowerCase();
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if ((alt.includes('logo') || cls.includes('logo') || src.includes('logo')) && src) {
        logoUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
      }
    });

    // Fallback: apple-touch-icon
    if (!logoUrl) {
      const touchIcon = $('link[rel="apple-touch-icon"]').attr('href');
      if (touchIcon) {
        logoUrl = touchIcon.startsWith('http') ? touchIcon : new URL(touchIcon, baseUrl).href;
      }
    }

    // Fallback: og:image
    if (!logoUrl) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) logoUrl = ogImage;
    }

    if (logoUrl) {
      raw.logo_source_url = logoUrl;
      const uploaded = await uploadLogoToSupabase(logoUrl);
      logoUrl = uploaded || logoUrl; // keep original URL if upload fails
    } else {
      gaps.push('logo');
    }
  } catch {
    gaps.push('logo');
  }

  // --- Step 4: Fonts ---
  let fonts = {};
  try {
    const fontList = await fetchStylesheetFonts(baseUrl, $);
    raw.fonts_found = fontList;

    if (fontList.length > 0) {
      fonts.display = fontList[0];
      if (fontList.length > 1) {
        fonts.body = fontList[1];
      }
    }

    if (!fonts.display && !fonts.body) gaps.push('fonts');
  } catch {
    gaps.push('fonts');
  }

  // --- Step 5: Products ---
  let productImages = [];
  try {
    const prodRes = await fetch(`${baseUrl}/products.json?limit=4`, {
      headers: { 'User-Agent': UA },
      timeout: TIMEOUT,
    });
    if (prodRes.ok) {
      const prodData = await prodRes.json();
      productImages = (prodData.products || []).map(p => ({
        url: p.images?.[0]?.src || '',
        alt: p.images?.[0]?.alt || p.title || '',
        productName: p.title || '',
        price: p.variants?.[0]?.price || '',
      })).filter(p => p.url);
      raw.products_found = productImages.length;
    }
  } catch {
    // non-fatal: Shopify public endpoint, usually works
  }

  return {
    shop_domain: shopDomain,
    logo_url: logoUrl,
    colours: Object.keys(colours).length ? colours : null,
    fonts: Object.keys(fonts).length ? fonts : null,
    product_images: productImages.length ? productImages : null,
    raw_scrape: raw,
    gaps,
  };
}

module.exports = { scrapeBrand };
