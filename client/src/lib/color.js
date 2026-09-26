// Small colour helpers shared by the garment drawings (live mirror and product illustrations).
// Colours are '#RRGGBB' strings.

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (channels) => `#${channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

// amount < 0 darkens, > 0 lightens (−1 … 1). Returns an rgb() string for canvas/SVG.
export function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex).map((c) => (amount < 0 ? c * (1 + amount) : c + (255 - c) * amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Blend two colours: t = 0 → a, t = 1 → b
export function mix(a, b, t) {
  const [ra, ga, ba] = hexToRgb(a);
  const [rb, gb, bb] = hexToRgb(b);
  return toHex([ra + (rb - ra) * t, ga + (gb - ga) * t, ba + (bb - ba) * t]);
}

// Perceived brightness 0–255 (the same rule the server uses for placeholder text)
export function brightness(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const isLight = (hex) => brightness(hex) > 160;
