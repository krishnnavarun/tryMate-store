// Tests for the admin product form <-> API conversion (run with `npm test`).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EMPTY_FORM, SIZE_FIELDS, emptySizeRow, nextSizeRow, toFormState, toProductBody } from './productForm.js';

const PRODUCT = {
  name: 'Classic Oxford Shirt',
  slug: 'classic-oxford-shirt',
  brand: 'Harbor & Co.',
  description: 'A staple.',
  price: 1999,
  discountPrice: 1599,
  category: 'upper_body',
  type: 'shirt',
  gender: 'men',
  colors: [{ name: 'Sky Blue', hex: '#7FA7D9' }],
  images: ['https://example.com/a.jpg'],
  garmentImageUrl: 'https://example.com/g.jpg',
  sizeChart: {
    M: { chest: [94, 100], waist: [82, 88], length: [74, 76], shoulder: [44.5, 46], sleeve: [62.5, 64] },
  },
  stock: { M: 12 },
};

describe('productForm', () => {
  it('an empty size row has every measurement field (including sleeve)', () => {
    const row = emptySizeRow('S');
    for (const [field] of SIZE_FIELDS) assert.deepEqual(row[field], ['', ''], field);
    for (const row of EMPTY_FORM.sizes) for (const [field] of SIZE_FIELDS) assert.ok(row[field], field);
  });

  it('round-trips a product, sleeve included', () => {
    const { body } = toProductBody(toFormState(PRODUCT));
    assert.deepEqual(body.sizeChart, PRODUCT.sizeChart);
    assert.deepEqual(body.stock, PRODUCT.stock);
  });

  it('leaves out measurements a size does not use', () => {
    const tee = { ...PRODUCT, sizeChart: { M: { chest: [92, 98] } } };
    const { body } = toProductBody(toFormState(tee));
    assert.deepEqual(body.sizeChart, { M: { chest: [92, 98] } });
  });

  it('a new size continues the last one with the usual steps', () => {
    const next = nextSizeRow(toFormState(PRODUCT).sizes);
    assert.deepEqual(next.chest, ['100', '106']);
    assert.deepEqual(next.sleeve, ['64', '65.5']);
  });

  it('copes with a row that is missing a field', () => {
    const form = toFormState(PRODUCT);
    delete form.sizes[0].sleeve; // e.g. state saved before sleeves existed
    assert.ok(nextSizeRow(form.sizes));
    assert.ok(toProductBody(form).body);
  });
});
