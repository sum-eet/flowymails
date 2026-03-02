'use strict';
const { safeTextColor, isDark, lightenHex } = require('./colorUtils');

function computeBrandRoles(raw = {}) {
  const primary    = raw.primary    || '#000000';
  const accent     = raw.accent     || '#cccccc';
  const background = raw.background || '#ffffff';
  const footerBg   = raw.footerBg   || (isDark(primary) ? primary : '#1a1a1a');

  return {
    // Page backgrounds
    background,
    surfaceAlt: isDark(background) ? lightenHex(background, 8) : '#f5f5f5',

    // Announcement bar
    announcementBackground: accent,
    announcementText:       safeTextColor(accent),

    // Header
    headerBackground: background,

    // Body text — always readable against page background
    text:    safeTextColor(background),
    textSub: isDark(background) ? '#aaaaaa' : '#71717A',

    // CTA button — text is ALWAYS readable against button color
    cta:     primary,
    ctaText: safeTextColor(primary),

    // Footer
    footerBg,
    footerText:    safeTextColor(footerBg),
    footerTextSub: isDark(footerBg) ? '#888888' : '#555555',

    // Footer button — outlined style, always visible on any footer background
    footerButtonBg:     'transparent',
    footerButtonText:   safeTextColor(footerBg),
    footerButtonBorder: safeTextColor(footerBg),

    // Dividers
    divider: isDark(background) ? '#333333' : '#e5e5e5',
  };
}

module.exports = { computeBrandRoles };
