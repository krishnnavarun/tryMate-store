// Product name (+ type) → how to draw the garment in a product illustration.
//
// The seed catalogue uses placehold.co images (a flat colour with the product name on it)
// until real photos are added. Those are replaced by drawn flat-lay illustrations
// (components/products/GarmentArt.jsx); this file decides what each one looks like:
//   "Striped Breton Tee", Navy  → tee, crew neck, short sleeves, navy stripes on ecru
//   "Checked Flannel Shirt"     → shirt, point collar, long sleeves, chest pocket, checks

const ECRU = '#EFE9DD';

export function garmentTypeFromName(name = '') {
  if (/polo/i.test(name)) return 'polo';
  if (/\btee\b|t-?shirt|henley/i.test(name)) return 'tshirt';
  if (/shirt/i.test(name)) return 'shirt';
  return 'tshirt';
}

export function garmentStyle({ name = '', type, hex = '#CFC7BB' }) {
  const kind = type ?? garmentTypeFromName(name);

  let neck = 'crew';
  if (kind === 'polo') neck = 'polo';
  else if (kind === 'shirt') neck = /mandarin|band collar/i.test(name) ? 'mandarin' : /resort|camp|cuban/i.test(name) ? 'camp' : 'point';
  else if (/v-?neck/i.test(name)) neck = 'v';
  else if (/henley/i.test(name)) neck = 'henley';

  const longSleeves =
    (kind === 'shirt' && neck !== 'camp') || (kind === 'tshirt' && /long[\s-]?sleeve|henley/i.test(name));

  let pattern = null;
  if (/breton|stripe/i.test(name)) pattern = 'stripes';
  else if (/check|flannel|plaid|gingham/i.test(name)) pattern = 'check';
  else if (/denim|chambray/i.test(name)) pattern = 'denim';
  else if (/linen/i.test(name)) pattern = 'linen';
  else if (/knit/i.test(name)) pattern = 'knit';
  else if (/pique/i.test(name)) pattern = 'pique';
  else if (/oxford/i.test(name)) pattern = 'oxford';
  else if (/print|resort|floral/i.test(name)) pattern = 'print';

  return {
    kind,
    silhouette: /boxy|oversized/i.test(name) ? 'boxy' : kind,
    neck,
    longSleeves,
    pocket: kind === 'shirt' && /oxford|denim|flannel|check|chambray/i.test(name),
    pattern,
    // Stripes: the colour in the catalogue is the stripe colour, on an ecru base
    base: pattern === 'stripes' ? ECRU : hex,
    accent: hex,
  };
}

// placehold.co URLs made by the seed script → { hex, name } (null for any other URL)
//   https://placehold.co/600x800/7FA7D9/222222/png?text=Classic+Oxford+Shirt%0ASky+Blue
export function parsePlaceholder(src) {
  if (typeof src !== 'string' || !src.includes('placehold.co/')) return null;
  try {
    const url = new URL(src);
    const bg = url.pathname.split('/')[2];
    if (!/^[0-9a-f]{6}$/i.test(bg ?? '')) return null;
    const text = url.searchParams.get('text') ?? '';
    const name = text.split('\n')[0].replace(/\s+flat-lay$/i, '').trim();
    return { hex: `#${bg.toUpperCase()}`, name };
  } catch {
    return null;
  }
}
