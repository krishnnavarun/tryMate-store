// Converts between a product (as the API sends/expects it) and the admin form's state.
// Form inputs hold strings, so numbers are parsed and checked here before saving.

export const SIZE_FIELDS = [
  ['chest', 'Chest'],
  ['waist', 'Waist'],
  ['length', 'Length'],
  ['shoulder', 'Shoulder'],
];

const EMPTY_RANGE = ['', ''];

export function emptySizeRow(size = '') {
  return { size, chest: EMPTY_RANGE, waist: EMPTY_RANGE, length: EMPTY_RANGE, shoulder: EMPTY_RANGE, stock: '0' };
}

export const EMPTY_FORM = {
  name: '',
  slug: '',
  brand: '',
  description: '',
  price: '',
  discountPrice: '',
  category: 'upper_body',
  type: 'shirt',
  gender: 'men',
  colors: [{ name: '', hex: '#1F2A44' }],
  images: [''],
  garmentImageUrl: '',
  sizes: [emptySizeRow('S'), emptySizeRow('M'), emptySizeRow('L')],
};

const str = (v) => (v === undefined || v === null ? '' : String(v));

export function toFormState(product) {
  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    description: product.description ?? '',
    price: str(product.price),
    discountPrice: str(product.discountPrice),
    category: product.category,
    type: product.type,
    gender: product.gender,
    colors: product.colors.map((c) => ({ ...c })),
    images: [...product.images],
    garmentImageUrl: product.garmentImageUrl,
    sizes: Object.entries(product.sizeChart ?? {}).map(([size, ranges]) => ({
      size,
      ...Object.fromEntries(SIZE_FIELDS.map(([f]) => [f, ranges[f] ? ranges[f].map(str) : EMPTY_RANGE])),
      stock: str(product.stock?.[size] ?? 0),
    })),
  };
}

// A new size row continuing the last one: +6 cm chest/waist, +2 length, +1.5 shoulder,
// the usual steps between sizes (see server/seed/sizeCharts.js)
const STEPS = { chest: 6, waist: 6, length: 2, shoulder: 1.5 };
export function nextSizeRow(rows) {
  const last = rows.at(-1);
  if (!last) return emptySizeRow();
  const row = emptySizeRow();
  for (const [field] of SIZE_FIELDS) {
    const [min, max] = last[field];
    row[field] = min !== '' && max !== '' ? [str(Number(min) + STEPS[field]), str(Number(max) + STEPS[field])] : EMPTY_RANGE;
  }
  return row;
}

// → { body } ready for the API, or { error } with a message for the first problem found
export function toProductBody(form) {
  const num = (v) => (v === '' || v === null ? null : Number(v));
  const price = num(form.price);
  if (price === null || !(price > 0)) return { error: 'Enter a price greater than 0.' };
  const discountPrice = num(form.discountPrice);
  if (discountPrice !== null && !(discountPrice > 0 && discountPrice < price)) {
    return { error: 'The discount price must be more than 0 and lower than the price.' };
  }

  const sizeChart = {};
  const stock = {};
  for (const row of form.sizes) {
    const size = row.size.trim();
    if (!size) return { error: 'Every size row needs a label (e.g. M).' };
    if (sizeChart[size]) return { error: `Size "${size}" appears twice.` };
    const ranges = {};
    for (const [field, label] of SIZE_FIELDS) {
      const [min, max] = row[field];
      if (min === '' && max === '') continue; // this field is optional
      if (min === '' || max === '') return { error: `Size ${size}: fill in both min and max for ${label.toLowerCase()}.` };
      if (Number(min) > Number(max)) return { error: `Size ${size}: ${label.toLowerCase()} min is bigger than max.` };
      ranges[field] = [Number(min), Number(max)];
    }
    sizeChart[size] = ranges;
    stock[size] = Math.max(0, Math.round(Number(row.stock) || 0));
  }
  if (!Object.keys(sizeChart).length) return { error: 'Add at least one size.' };

  return {
    body: {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      brand: form.brand.trim(),
      description: form.description,
      price,
      discountPrice,
      category: form.category,
      type: form.type,
      gender: form.gender,
      colors: form.colors.map((c) => ({ name: c.name.trim(), hex: c.hex.toUpperCase() })),
      images: form.images.map((u) => u.trim()).filter(Boolean),
      garmentImageUrl: form.garmentImageUrl.trim(),
      sizeChart,
      stock,
    },
  };
}
