// Men's size charts for the seed data, in cm.
//
// Each size lists the BODY measurement ranges it is meant to fit
// (the shape the AI service's /recommend-size compares a user's measurements against):
//   chest    – chest circumference, measured under the arms
//   waist    – natural waist circumference
//   length   – garment back length, collar seam to hem (a garment measurement)
//   shoulder – shoulder width, seam to seam across the back
//
// Values follow common high-street conventions for men's tops: ~6 cm chest steps
// between sizes, waist ~12 cm below chest, ~2 cm length and ~1.5–2 cm shoulder steps.
// They are realistic approximations, not copied from one brand. Double-check them
// against real brand charts during R&D (PROJECT_SPEC.md §9, item 6) before relying on them.

// Formal/casual button-down shirts, regular fit
export const REGULAR_SHIRT = {
  S: { chest: [88, 94], waist: [76, 82], length: [72, 74], shoulder: [43, 44.5] },
  M: { chest: [94, 100], waist: [82, 88], length: [74, 76], shoulder: [44.5, 46] },
  L: { chest: [100, 106], waist: [88, 94], length: [76, 78], shoulder: [46, 47.5] },
  XL: { chest: [106, 112], waist: [94, 100], length: [78, 80], shoulder: [47.5, 49] },
  XXL: { chest: [112, 120], waist: [100, 108], length: [80, 82], shoulder: [49, 51] },
};

// Slim-fit shirts: cut closer to the body, so each size fits a smaller body range
export const SLIM_SHIRT = {
  S: { chest: [86, 92], waist: [72, 78], length: [71, 73], shoulder: [42, 43.5] },
  M: { chest: [92, 98], waist: [78, 84], length: [73, 75], shoulder: [43.5, 45] },
  L: { chest: [98, 104], waist: [84, 90], length: [75, 77], shoulder: [45, 46.5] },
  XL: { chest: [104, 110], waist: [90, 96], length: [77, 79], shoulder: [46.5, 48] },
};

// Crew/V-neck t-shirts, regular fit (S–L match the example in PROJECT_SPEC.md)
export const TSHIRT = {
  S: { chest: [86, 92], waist: [74, 80], length: [68, 70], shoulder: [41, 43] },
  M: { chest: [92, 98], waist: [80, 86], length: [70, 72], shoulder: [43, 45] },
  L: { chest: [98, 104], waist: [86, 92], length: [72, 74], shoulder: [45, 47] },
  XL: { chest: [104, 110], waist: [92, 98], length: [74, 76], shoulder: [47, 49] },
  XXL: { chest: [110, 118], waist: [98, 106], length: [76, 78], shoulder: [49, 51] },
};

// Boxy / relaxed tees: same body ranges as TSHIRT, but longer and with dropped shoulders
export const BOXY_TSHIRT = {
  S: { chest: [86, 92], waist: [74, 80], length: [69, 71], shoulder: [47, 49] },
  M: { chest: [92, 98], waist: [80, 86], length: [71, 73], shoulder: [49, 51] },
  L: { chest: [98, 104], waist: [86, 92], length: [73, 75], shoulder: [51, 53] },
  XL: { chest: [104, 110], waist: [92, 98], length: [75, 77], shoulder: [53, 55] },
};

// Polos: between a tee and a shirt
export const POLO = {
  S: { chest: [88, 94], waist: [76, 82], length: [69, 71], shoulder: [42, 44] },
  M: { chest: [94, 100], waist: [82, 88], length: [71, 73], shoulder: [44, 46] },
  L: { chest: [100, 106], waist: [88, 94], length: [73, 75], shoulder: [46, 48] },
  XL: { chest: [106, 112], waist: [94, 100], length: [75, 77], shoulder: [48, 50] },
  XXL: { chest: [112, 120], waist: [100, 108], length: [77, 79], shoulder: [50, 52] },
};
