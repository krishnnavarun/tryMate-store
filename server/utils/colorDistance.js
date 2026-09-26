// How different do two colours LOOK? Used for "Colors that suit you".
//
// Why not compare RGB values? Equal steps in RGB aren't equal steps to the eye (e.g. two
// greens can be far apart in RGB yet look almost the same). CIELAB was designed so that
// distances roughly match perception, and CIEDE2000 (ΔE00) is the current standard formula
// on top of it (it corrects LAB's remaining unevenness in blues, greys and saturated colours).
//   ΔE00 ≈ 1   barely noticeable
//   ΔE00 ≈ 10  clearly different shades of the same colour family
//   ΔE00 > 20  different colours
// Reference: Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula".

export function hexToLab(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; // sRGB → linear light
  });
  // linear sRGB → XYZ (D65 white), then normalise by the white point
  const [r, g, b] = rgb;
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const deg = (rad) => (rad * 180) / Math.PI;
const rad = (d) => (d * Math.PI) / 180;

// CIEDE2000 colour difference between two LAB colours
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = C1p === 0 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p === 0 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2));

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else hbarp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63));
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc;

  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh),
  );
}

// A product colour "suits you" when it's within this distance of a suggested colour.
// Under ~6, most people see the two as the same colour; white vs cream is ~7 and
// navy vs indigo ~12, so those don't count. Raise it to be more generous.
export const SUITS_YOU_MAX_DELTA_E = 6;

// Best match between a product's colours and the user's suggested colours.
// Returns { productColor, suggestion, deltaE } for the closest pair, or null.
export function bestColorMatch(productColors, suggestions) {
  let best = null;
  for (const color of productColors) {
    const lab = hexToLab(color.hex);
    for (const suggestion of suggestions) {
      const deltaE = deltaE2000(lab, hexToLab(suggestion.hex));
      if (!best || deltaE < best.deltaE) best = { productColor: color.name, suggestion: suggestion.name, deltaE };
    }
  }
  return best;
}
