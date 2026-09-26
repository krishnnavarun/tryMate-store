// How big should the garment look on this person, for the chosen size?
//
// A size chart range like chest [92, 98] means "this size fits chests of 92–98 cm", so the
// garment is roughly made for a 95 cm chest. Comparing that with the shopper's scanned chest
// tells us whether the garment would be narrower (tighter) or wider (looser) than their body:
//
//   widthScale  = middle of the size's chest range ÷ the shopper's chest
//   lengthScale = middle of the size's length range ÷ the shopper's ideal garment length
//
// The live mirror draws the garment that much narrower/wider and shorter/longer. It's an
// honest *visual approximation* from measurements, not a cloth simulation. The fit notes
// (from the AI service's /recommend-size) are the real fit information.

// Same rule as the AI service (tryMate-Ai app/services/sizing.py: LENGTH_PER_TORSO)
const LENGTH_PER_TORSO = 1.55;

const mid = (range) => (range[0] + range[1]) / 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function fitScales(sizeRanges, measurements) {
  if (!sizeRanges || !measurements) return { width: 1, length: 1, known: false };
  const width = sizeRanges.chest && measurements.chest_cm ? mid(sizeRanges.chest) / measurements.chest_cm : 1;
  const length =
    sizeRanges.length && measurements.torso_cm ? mid(sizeRanges.length) / (measurements.torso_cm * LENGTH_PER_TORSO) : 1;
  return {
    // Limits keep the drawing believable if a measurement is way off
    width: clamp(width, 0.85, 1.2),
    length: clamp(length, 0.88, 1.15),
    known: Boolean(sizeRanges.chest && measurements.chest_cm),
  };
}

// A short plain-words label for the width difference
export function widthLabel(widthScale) {
  if (widthScale < 0.95) return 'Snug';
  if (widthScale > 1.07) return 'Roomy';
  return 'Close to your body shape';
}
