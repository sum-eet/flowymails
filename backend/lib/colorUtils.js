'use strict';

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}

function luminance(hex) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  } catch { return 0.5; }
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Returns '#ffffff' or '#000000' — whichever has higher contrast against bg
// WCAG AA minimum is 4.5:1. This always picks the better option.
function safeTextColor(bgHex) {
  try {
    const cW = contrastRatio(bgHex, '#ffffff');
    const cB = contrastRatio(bgHex, '#000000');
    return cW >= cB ? '#ffffff' : '#000000';
  } catch { return '#000000'; }
}

function isDark(hex) {
  try { return luminance(hex) < 0.3; }
  catch { return true; }
}

function lightenHex(hex, amount) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const shift = Math.round(255 * amount / 100);
    const clamp = v => Math.min(255, v + shift);
    return '#' + [clamp(r), clamp(g), clamp(b)]
      .map(v => v.toString(16).padStart(2, '0')).join('');
  } catch { return hex; }
}

module.exports = { safeTextColor, isDark, contrastRatio, luminance, lightenHex };
