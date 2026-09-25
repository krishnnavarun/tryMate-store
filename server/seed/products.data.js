// 14 men's shirts / t-shirts / polos for the MVP catalog (all `upper_body`).
// Prices are in INR (the client formats them as ₹).
//
// Images are placeholders from placehold.co: one per color, tinted with that color.
// garmentImageUrl must become a real flat-lay photo (garment alone, plain background)
// before try-on is tested with the real AI service (Phase 7).

import { BOXY_TSHIRT, POLO, REGULAR_SHIRT, SLIM_SHIRT, TSHIRT } from './sizeCharts.js';

// Pick black or white text depending on how light the background is
function textColorFor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? '222222' : 'FFFFFF';
}

function placeholder(width, height, hex, text) {
  const bg = hex.slice(1);
  const label = encodeURIComponent(text).replace(/%20/g, '+');
  return `https://placehold.co/${width}x${height}/${bg}/${textColorFor(hex)}/png?text=${label}`;
}

// Builds the image fields from the product name + colors
function withImages(product) {
  const first = product.colors[0];
  return {
    ...product,
    images: product.colors.map((c) => placeholder(600, 800, c.hex, `${product.name}\n${c.name}`)),
    garmentImageUrl: placeholder(768, 1024, first.hex, `${product.name} flat-lay`),
  };
}

// Stock per size: the numbers are arbitrary, with a few 0s to show "out of stock"
function stockFor(sizeChart, counts) {
  return Object.fromEntries(Object.keys(sizeChart).map((size, i) => [size, counts[i] ?? 10]));
}

const base = { category: 'upper_body', gender: 'men' };

export const products = [
  // ---------------------------------------------------------------- shirts
  {
    ...base,
    name: 'Classic Oxford Shirt',
    brand: 'Harbor & Co.',
    type: 'shirt',
    price: 1999,
    discountPrice: 1599,
    description:
      'A wardrobe staple in soft, breathable Oxford cotton. Button-down collar, chest pocket and a regular fit that works tucked or untucked.',
    colors: [
      { name: 'Sky Blue', hex: '#7FA7D9' },
      { name: 'White', hex: '#F5F5F0' },
    ],
    sizeChart: REGULAR_SHIRT,
    stock: stockFor(REGULAR_SHIRT, [8, 14, 12, 6, 3]),
  },
  {
    ...base,
    name: 'Slim Fit Linen Shirt',
    brand: 'Coastline',
    type: 'shirt',
    price: 2499,
    description:
      'Lightweight pure linen for hot days. Slim through the chest and waist, with a relaxed, slightly textured finish.',
    colors: [
      { name: 'Sage', hex: '#9CAF88' },
      { name: 'Sand', hex: '#D8C8A8' },
    ],
    sizeChart: SLIM_SHIRT,
    stock: stockFor(SLIM_SHIRT, [5, 9, 7, 0]),
  },
  {
    ...base,
    name: 'Checked Flannel Shirt',
    brand: 'Timber Row',
    type: 'shirt',
    price: 2199,
    discountPrice: 1799,
    description: 'Brushed cotton flannel in a classic check. Warm, soft and made for layering.',
    colors: [
      { name: 'Red Check', hex: '#8B1E1E' },
      { name: 'Forest Check', hex: '#2F4F3A' },
    ],
    sizeChart: REGULAR_SHIRT,
    stock: stockFor(REGULAR_SHIRT, [4, 10, 10, 8, 2]),
  },
  {
    ...base,
    name: 'Washed Denim Shirt',
    brand: 'Indigo Lane',
    type: 'shirt',
    price: 2699,
    description: 'Midweight denim with a soft garment wash, snap-free button placket and two flap pockets.',
    colors: [
      { name: 'Indigo', hex: '#2E4A7A' },
      { name: 'Light Wash', hex: '#7B9CC4' },
    ],
    sizeChart: REGULAR_SHIRT,
    stock: stockFor(REGULAR_SHIRT, [6, 12, 9, 5, 0]),
  },
  {
    ...base,
    name: 'Mandarin Collar Shirt',
    brand: 'Harbor & Co.',
    type: 'shirt',
    price: 1899,
    description: 'A clean band collar and a slim cut for a sharp, minimal look.',
    colors: [
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Olive', hex: '#708238' },
    ],
    sizeChart: SLIM_SHIRT,
    stock: stockFor(SLIM_SHIRT, [7, 11, 8, 4]),
  },
  {
    ...base,
    name: 'Printed Resort Shirt',
    brand: 'Coastline',
    type: 'shirt',
    price: 1699,
    discountPrice: 1299,
    description: 'Short sleeves, camp collar and an all-over print in breezy viscose. Made for holidays.',
    colors: [
      { name: 'Navy', hex: '#1F2A44' },
      { name: 'Rust', hex: '#B7410E' },
    ],
    sizeChart: REGULAR_SHIRT,
    stock: stockFor(REGULAR_SHIRT, [9, 12, 12, 7, 4]),
  },

  // -------------------------------------------------------------- t-shirts
  {
    ...base,
    name: 'Essential Crew Neck Tee',
    brand: 'Basics Lab',
    type: 'tshirt',
    price: 699,
    description: '180 GSM combed cotton, a clean crew neck and a regular fit. The everyday tee.',
    colors: [
      { name: 'White', hex: '#F5F5F0' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Heather Grey', hex: '#9E9E9E' },
      { name: 'Navy', hex: '#1F2A44' },
    ],
    sizeChart: TSHIRT,
    stock: stockFor(TSHIRT, [20, 30, 30, 15, 8]),
  },
  {
    ...base,
    name: 'Heavyweight Boxy Tee',
    brand: 'Basics Lab',
    type: 'tshirt',
    price: 999,
    discountPrice: 849,
    description: '240 GSM heavyweight cotton with a boxy, dropped-shoulder fit and a thick ribbed collar.',
    colors: [
      { name: 'Cream', hex: '#F2E8D5' },
      { name: 'Charcoal', hex: '#36454F' },
    ],
    sizeChart: BOXY_TSHIRT,
    stock: stockFor(BOXY_TSHIRT, [10, 16, 14, 6]),
  },
  {
    ...base,
    name: 'V-Neck Cotton Tee',
    brand: 'Everyday Supply',
    type: 'tshirt',
    price: 649,
    description: 'Soft cotton jersey with a shallow V-neck. Layers well under shirts and jackets.',
    colors: [
      { name: 'Olive', hex: '#708238' },
      { name: 'Maroon', hex: '#800000' },
    ],
    sizeChart: TSHIRT,
    stock: stockFor(TSHIRT, [8, 12, 12, 6, 0]),
  },
  {
    ...base,
    name: 'Striped Breton Tee',
    brand: 'Harbor & Co.',
    type: 'tshirt',
    price: 1199,
    description: 'Classic nautical stripes on a midweight cotton tee with a relaxed boat neck.',
    colors: [
      { name: 'Navy Stripe', hex: '#1F2A44' },
      { name: 'Red Stripe', hex: '#B22222' },
    ],
    sizeChart: TSHIRT,
    stock: stockFor(TSHIRT, [5, 10, 10, 5, 2]),
  },
  {
    ...base,
    name: 'Long Sleeve Henley',
    brand: 'Timber Row',
    type: 'tshirt',
    price: 1299,
    discountPrice: 1099,
    description: 'Waffle-knit cotton with a three-button placket and long sleeves. A tee with a bit more character.',
    colors: [
      { name: 'Mustard', hex: '#D4A017' },
      { name: 'Teal', hex: '#008080' },
    ],
    sizeChart: TSHIRT,
    stock: stockFor(TSHIRT, [6, 10, 9, 5, 3]),
  },

  // ----------------------------------------------------------------- polos
  {
    ...base,
    name: 'Classic Pique Polo',
    brand: 'Everyday Supply',
    type: 'polo',
    price: 1299,
    description: 'Breathable cotton pique, a ribbed collar and a two-button placket. Smart enough for the office.',
    colors: [
      { name: 'Navy', hex: '#1F2A44' },
      { name: 'White', hex: '#F5F5F0' },
      { name: 'Forest Green', hex: '#228B22' },
    ],
    sizeChart: POLO,
    stock: stockFor(POLO, [10, 15, 15, 8, 4]),
  },
  {
    ...base,
    name: 'Knit Polo',
    brand: 'Coastline',
    type: 'polo',
    price: 2299,
    discountPrice: 1899,
    description: 'A fine-gauge knit polo with an open collar. A dressier alternative to a tee.',
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Chocolate', hex: '#5C3A21' },
    ],
    sizeChart: POLO,
    stock: stockFor(POLO, [4, 8, 8, 4, 0]),
  },
  {
    ...base,
    name: 'Performance Polo',
    brand: 'Stride',
    type: 'polo',
    price: 1499,
    description: 'Quick-dry, stretchy polyester blend that wicks sweat. Built for golf, travel and hot commutes.',
    colors: [
      { name: 'Sky Blue', hex: '#87CEEB' },
      { name: 'Coral', hex: '#FF7F50' },
    ],
    sizeChart: POLO,
    stock: stockFor(POLO, [7, 12, 12, 7, 5]),
  },
].map(withImages);
