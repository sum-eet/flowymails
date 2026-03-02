'use strict';
const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

// --- TYPOGRAPHY SYSTEM ---
// Hard floors: headline 18px min, body 14px min, label 13px min.
// Hard ceiling: headline 32px max, body 16px max.

function computeTypography(text = '', context = 'body') {
  const len = text.length;

  if (context === 'headline') {
    if (len <= 20) return { fontSize: '32px', lineHeight: '1.2', paddingBottom: '8px' };
    if (len <= 40) return { fontSize: '26px', lineHeight: '1.2', paddingBottom: '8px' };
    if (len <= 60) return { fontSize: '22px', lineHeight: '1.3', paddingBottom: '6px' };
    return           { fontSize: '18px', lineHeight: '1.3', paddingBottom: '6px' };
    // CEILING: 32px. FLOOR: 18px.
  }

  if (context === 'subtext') {
    if (len <= 60)  return { fontSize: '16px', lineHeight: '1.5', paddingBottom: '16px' };
    if (len <= 120) return { fontSize: '15px', lineHeight: '1.5', paddingBottom: '14px' };
    return           { fontSize: '14px', lineHeight: '1.6', paddingBottom: '12px' };
    // FLOOR: 14px.
  }

  if (context === 'body') {
    if (len <= 100) return { fontSize: '16px', lineHeight: '1.6', padding: '24px' };
    if (len <= 250) return { fontSize: '15px', lineHeight: '1.6', padding: '20px' };
    if (len <= 400) return { fontSize: '14px', lineHeight: '1.7', padding: '16px' };
    // Over 400 chars: never shrink below 14px.
    return           { fontSize: '14px', lineHeight: '1.7', padding: '16px' };
  }

  if (context === 'label') {
    return { fontSize: '13px', lineHeight: '1.4' };
    // Product names, captions. FLOOR: 13px.
  }

  if (context === 'micro') {
    return { fontSize: '11px', lineHeight: '1.4' };
    // Footer legal and unsubscribe only. Never use for content.
  }

  return { fontSize: '14px', lineHeight: '1.6', padding: '16px' };
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

// --- CUSTOM FONT CSS ---
// Builds @font-face declarations for custom fonts stored in Supabase.
// Falls back gracefully for clients that don't support web fonts (Gmail etc.).

function buildFontStyles(fonts) {
  if (!fonts) return '';
  const decls = [];

  const { display, body, bodyBold } = fonts;

  if (display?.url) {
    const fmt = display.format || 'opentype';
    decls.push(`@font-face {
      font-family: '${display.name}';
      src: url('${display.url}') format('${fmt}');
      font-weight: normal; font-style: normal;
    }`);
  }

  if (body?.url) {
    const fmt = body.format || 'woff2';
    const src = body.urlWoff
      ? `url('${body.url}') format('${fmt}'), url('${body.urlWoff}') format('woff')`
      : `url('${body.url}') format('${fmt}')`;
    decls.push(`@font-face {
      font-family: '${body.name}';
      src: ${src};
      font-weight: 400; font-style: normal;
    }`);
  }

  if (bodyBold?.url) {
    const fmt = bodyBold.format || 'woff2';
    const src = bodyBold.urlWoff
      ? `url('${bodyBold.url}') format('${fmt}'), url('${bodyBold.urlWoff}') format('woff')`
      : `url('${bodyBold.url}') format('${fmt}')`;
    decls.push(`@font-face {
      font-family: '${bodyBold.name}';
      src: ${src};
      font-weight: ${bodyBold.weight || '800'}; font-style: normal;
    }`);
  }

  return decls.join('\n');
}

// --- EMAIL BUILDER ---

function buildEmail(blocks, brand, content) {
  // Typography — computed from content length + context
  const heroTypo  = computeTypography(content.hero?.headline   || '', 'headline');
  const subTypo   = computeTypography(content.hero?.subtext    || '', 'subtext');
  const splitTypo = computeTypography(content.split?.text      || '', 'body');
  const proofTypo = computeTypography(content.proof?.reviewText || '', 'body');

  // Use computed color roles if available, fall back to raw colours
  const roles   = brand.color_roles || {};
  const colours = brand.colours     || {};

  const tokens = {
    // Brand identity
    'brand.name':         brand.shop_domain?.split('.')[0] || 'Store',
    'brand.logoUrl':      brand.logo_url       || '',
    'brand.logoUrlLight': brand.logo_url_light || brand.logo_url || '',
    'brand.storeUrl':     `https://${brand.shop_domain}`,

    // Colors — roles take priority, raw colours as fallback
    'brand.background':         roles.background            || colours.background       || '#ffffff',
    'brand.surfaceAlt':         roles.surfaceAlt             || colours.surfaceAlt       || '#f5f5f5',
    'brand.text':               roles.text                   || colours.text             || '#18181B',
    'brand.textSub':            roles.textSub                || colours.textSub          || '#71717A',
    'brand.cta':                roles.cta                    || colours.primary          || '#18181B',
    'brand.ctaText':            roles.ctaText                || colours.ctaText          || '#ffffff',
    'brand.accent':             roles.announcementBackground || colours.accent           || '#f0f0f0',
    'brand.announcementText':   roles.announcementText       || colours.announcementText || '#000000',
    'brand.footerBg':           roles.footerBg               || colours.footerBg         || '#1a1a2e',
    'brand.footerText':         roles.footerText             || colours.footerText       || '#ffffff',
    'brand.footerTextSub':      roles.footerTextSub          || colours.footerTextSub    || '#aaaaaa',
    'brand.footerButtonBg':     roles.footerButtonBg         || 'transparent',
    'brand.footerButtonText':   roles.footerButtonText       || '#ffffff',
    'brand.footerButtonBorder': roles.footerButtonBorder     || '#ffffff',
    'brand.divider':            roles.divider                || '#e5e5e5',

    // Fonts
    'brand.fontDisplay': brand.fonts?.display?.name || 'Georgia',
    'brand.fontBody':    brand.fonts?.body?.name    || 'Arial',

    // Meta
    'brand.tagline':      brand.tagline          || '',
    'brand.instagramUrl': brand.social?.instagram || '#',
    'brand.facebookUrl':  brand.social?.facebook  || '#',

    // Announcement
    'announcement.text': content.announcement?.text || '',

    // Hero — typography-computed
    'hero.imageUrl':     content.hero?.imageUrl || '',
    'hero.alt':          content.hero?.alt      || '',
    'hero.headline':     content.hero?.headline || '',
    'hero.subtext':      content.hero?.subtext  || '',
    'hero.ctaText':      content.hero?.ctaText  || 'Shop Now',
    'hero.ctaUrl':       content.hero?.ctaUrl   || `https://${brand.shop_domain}`,
    'hero.headlineSize': heroTypo.fontSize,
    'hero.headlineLine': heroTypo.lineHeight,
    'hero.subSize':      subTypo.fontSize,
    'hero.ctaPadding':   `${heroTypo.paddingBottom} 32px 20px`,

    // Split — auto-sized (convert newlines to <br/> for HTML rendering in mj-text)
    'split.text':     (content.split?.text || '').replace(/\n/g, '<br/>'),
    'split.imageUrl': content.split?.imageUrl || '',
    'split.imageAlt': content.split?.imageAlt || '',
    'split.textSize': splitTypo.fontSize,
    'split.padding':  splitTypo.padding || '24px',

    // Product showcase
    'showcase.product1Image': content.showcase?.product1Image || '',
    'showcase.product1Name':  content.showcase?.product1Name  || '',
    'showcase.product1Price': content.showcase?.product1Price || '',
    'showcase.product1Url':   content.showcase?.product1Url   || '#',
    'showcase.product2Image': content.showcase?.product2Image || '',
    'showcase.product2Name':  content.showcase?.product2Name  || '',
    'showcase.product2Price': content.showcase?.product2Price || '',
    'showcase.product2Url':   content.showcase?.product2Url   || '#',
    'showcase.padding':       '24px 0',

    // Social proof — auto-sized
    'proof.imageUrl':     content.proof?.imageUrl     || '',
    'proof.reviewerName': content.proof?.reviewerName || '',
    'proof.reviewText':   content.proof?.reviewText   || '',
    'proof.ctaText':      content.proof?.ctaText      || 'See their story',
    'proof.ctaUrl':       content.proof?.ctaUrl       || '#',
    'proof.textSize':     proofTypo.fontSize,
    'proof.padding':      proofTypo.padding || '24px',

    // Shop button
    'shopbtn.text':    content.shopbtn?.text || 'SHOP NOW',
    'shopbtn.url':     content.shopbtn?.url  || `https://${brand.shop_domain}`,
    'shopbtn.padding': '24px 24px',
  };

  // Assemble MJML string
  const blockStrings = blocks.map(name => injectTokens(loadBlock(name), tokens));
  const fontStyles   = buildFontStyles(brand.fonts);

  const bodyStack = brand.fonts?.body?.name
    ? `'${brand.fonts.body.name}', Arial, sans-serif`
    : 'Arial, sans-serif';

  const mjmlString = `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="${bodyStack}" />
      <mj-text line-height="1.6" />
    </mj-attributes>
    <mj-style>
      ${fontStyles}
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
