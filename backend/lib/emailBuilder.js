const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

// --- SIZE BANDS ---
// Auto-adjust font size and padding based on content length

function headlineBand(text = '') {
  const len = text.length;
  if (len < 30) return { size: '26px', padding: '24px 24px 8px' };
  if (len < 60) return { size: '22px', padding: '20px 24px 8px' };
  return { size: '18px', padding: '16px 24px 8px' };
}

function bodyBand(text = '') {
  const len = text.length;
  if (len < 100) return { size: '16px', padding: '24px 24px' };
  if (len < 250) return { size: '15px', padding: '20px 24px' };
  return { size: '14px', padding: '16px 24px' };
}

function proofBand(text = '') {
  const len = text.length;
  if (len < 100) return { size: '15px', padding: '32px 24px' };
  if (len < 200) return { size: '14px', padding: '28px 24px' };
  return { size: '13px', padding: '24px 24px' };
}

// --- BLOCK LOADER ---

function loadBlock(name) {
  const filePath = path.join(__dirname, '../blocks', `${name}.mjml`);
  return fs.readFileSync(filePath, 'utf8');
}

// --- TOKEN INJECTOR ---
// Injects {{token}} values. Leaves {{ klaviyo_tokens }} untouched.

function injectTokens(mjmlStr, tokens) {
  return mjmlStr.replace(/\{\{([^\s}][^}]*?)\}\}/g, (match, key) => {
    const val = tokens[key.trim()];
    return val !== undefined ? String(val) : match;
  });
}

// --- EMAIL BUILDER ---

function buildEmail(blocks, brand, content) {
  // Resolve size bands from content
  const heroBand  = headlineBand(content.hero?.headline || '');
  const splitBand = bodyBand(content.split?.text || '');
  const pBand     = proofBand(content.proof?.reviewText || '');

  // Build full token map
  const tokens = {
    // Brand tokens
    'brand.name':             brand.shop_domain?.split('.')[0] || 'Store',
    'brand.logoUrl':          brand.logo_url || '',
    'brand.storeUrl':         `https://${brand.shop_domain}`,
    'brand.background':       brand.colours?.background || '#ffffff',
    'brand.text':             brand.colours?.text || '#18181B',
    'brand.textSub':          brand.colours?.textSub || '#71717A',
    'brand.cta':              brand.colours?.primary || '#18181B',
    'brand.ctaText':          brand.colours?.ctaText || '#ffffff',
    'brand.accent':           brand.colours?.accent || '#f0f0f0',
    'brand.announcementText': brand.colours?.announcementText || '#000000',
    'brand.surfaceAlt':       brand.colours?.surfaceAlt || '#f9f9f9',
    'brand.footerBg':         brand.colours?.footerBg || '#1a1a2e',
    'brand.footerText':       brand.colours?.footerText || '#ffffff',
    'brand.footerTextSub':    brand.colours?.footerTextSub || '#aaaaaa',
    'brand.fontDisplay':      brand.fonts?.display?.name || 'Georgia',
    'brand.fontBody':         brand.fonts?.body?.name || 'Arial',
    'brand.tagline':          brand.tagline || '',
    'brand.instagramUrl':     brand.social?.instagram || '#',
    'brand.facebookUrl':      brand.social?.facebook || '#',

    // Announcement
    'announcement.text':      content.announcement?.text || '',

    // Hero — auto-sized
    'hero.imageUrl':          content.hero?.imageUrl || '',
    'hero.alt':               content.hero?.alt || '',
    'hero.headline':          content.hero?.headline || '',
    'hero.subtext':           content.hero?.subtext || '',
    'hero.ctaText':           content.hero?.ctaText || 'Shop Now',
    'hero.ctaUrl':            content.hero?.ctaUrl || `https://${brand.shop_domain}`,
    'hero.headlineSize':      heroBand.size,
    'hero.subSize':           '15px',
    'hero.ctaPadding':        heroBand.padding,

    // Split — auto-sized (convert newlines to <br/> for HTML rendering in mj-text)
    'split.text':             (content.split?.text || '').replace(/\n/g, '<br/>'),
    'split.imageUrl':         content.split?.imageUrl || '',
    'split.imageAlt':         content.split?.imageAlt || '',
    'split.textSize':         splitBand.size,
    'split.padding':          splitBand.padding,

    // Product showcase
    'showcase.product1Image': content.showcase?.product1Image || '',
    'showcase.product1Name':  content.showcase?.product1Name || '',
    'showcase.product1Price': content.showcase?.product1Price || '',
    'showcase.product1Url':   content.showcase?.product1Url || '#',
    'showcase.product2Image': content.showcase?.product2Image || '',
    'showcase.product2Name':  content.showcase?.product2Name || '',
    'showcase.product2Price': content.showcase?.product2Price || '',
    'showcase.product2Url':   content.showcase?.product2Url || '#',
    'showcase.padding':       '24px 0',

    // Social proof — auto-sized
    'proof.imageUrl':         content.proof?.imageUrl || '',
    'proof.reviewerName':     content.proof?.reviewerName || '',
    'proof.reviewText':       content.proof?.reviewText || '',
    'proof.ctaText':          content.proof?.ctaText || 'See their story',
    'proof.ctaUrl':           content.proof?.ctaUrl || '#',
    'proof.textSize':         pBand.size,
    'proof.padding':          pBand.padding,

    // Shop button
    'shopbtn.text':           content.shopbtn?.text || 'SHOP NOW',
    'shopbtn.url':            content.shopbtn?.url || `https://${brand.shop_domain}`,
    'shopbtn.padding':        '24px 24px',
  };

  // Assemble MJML string
  const blockStrings = blocks.map(name => injectTokens(loadBlock(name), tokens));

  const mjmlString = `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="${tokens['brand.fontBody']}, Arial, sans-serif" />
      <mj-text line-height="1.6" />
    </mj-attributes>
    <mj-style>
      a { color: inherit; }
    </mj-style>
  </mj-head>
  <mj-body width="600px" background-color="${tokens['brand.background']}">
    ${blockStrings.join('\n')}
  </mj-body>
</mjml>`;

  const { html, errors } = mjml2html(mjmlString, { validationLevel: 'soft' });

  if (errors && errors.length > 0) {
    console.error('[MJML ERRORS]', errors);
  }

  return html;
}

module.exports = { buildEmail };
