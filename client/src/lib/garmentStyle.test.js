// Tests for product name → illustration style, and reading the seed's placeholder URLs.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hexToRgb, isLight, mix, shade } from './color.js';
import { garmentStyle, garmentTypeFromName, parsePlaceholder } from './garmentStyle.js';

describe('garmentTypeFromName', () => {
  it('recognises every product in the seed catalogue', () => {
    const expected = {
      'Classic Oxford Shirt': 'shirt',
      'Checked Flannel Shirt': 'shirt',
      'Mandarin Collar Shirt': 'shirt',
      'Essential Crew Neck Tee': 'tshirt',
      'V-Neck Cotton Tee': 'tshirt',
      'Long Sleeve Henley': 'tshirt',
      'Classic Pique Polo': 'polo',
      'Knit Polo': 'polo',
    };
    for (const [name, type] of Object.entries(expected)) assert.equal(garmentTypeFromName(name), type, name);
  });
});

describe('garmentStyle', () => {
  it('draws Breton stripes in the catalogue colour on an ecru base', () => {
    const style = garmentStyle({ name: 'Striped Breton Tee', type: 'tshirt', hex: '#1F2A44' });
    assert.equal(style.pattern, 'stripes');
    assert.equal(style.accent, '#1F2A44');
    assert.notEqual(style.base, '#1F2A44');
  });

  it('picks collars, sleeves and details from the name', () => {
    const henley = garmentStyle({ name: 'Long Sleeve Henley', type: 'tshirt' });
    assert.equal(henley.neck, 'henley');
    assert.equal(henley.longSleeves, true);

    const resort = garmentStyle({ name: 'Printed Resort Shirt', type: 'shirt' });
    assert.equal(resort.neck, 'camp');
    assert.equal(resort.longSleeves, false, 'resort shirts have short sleeves');
    assert.equal(resort.pattern, 'print');

    const oxford = garmentStyle({ name: 'Classic Oxford Shirt', type: 'shirt' });
    assert.equal(oxford.neck, 'point');
    assert.equal(oxford.pocket, true);
    assert.equal(oxford.pattern, 'oxford');

    assert.equal(garmentStyle({ name: 'Mandarin Collar Shirt', type: 'shirt' }).neck, 'mandarin');
    assert.equal(garmentStyle({ name: 'V-Neck Cotton Tee', type: 'tshirt' }).neck, 'v');
    assert.equal(garmentStyle({ name: 'Heavyweight Boxy Tee', type: 'tshirt' }).silhouette, 'boxy');
    assert.equal(garmentStyle({ name: 'Knit Polo', type: 'polo' }).neck, 'polo');
  });

  it('uses the given type over the name', () => {
    assert.equal(garmentStyle({ name: 'Mystery Top', type: 'polo' }).kind, 'polo');
  });
});

describe('parsePlaceholder', () => {
  it('reads the colour and product name from a seed placeholder URL', () => {
    const url = 'https://placehold.co/600x800/7FA7D9/222222/png?text=Classic+Oxford+Shirt%0ASky+Blue';
    assert.deepEqual(parsePlaceholder(url), { hex: '#7FA7D9', name: 'Classic Oxford Shirt' });
  });

  it('drops the flat-lay suffix of garment images', () => {
    const url = 'https://placehold.co/768x1024/1f2a44/FFFFFF/png?text=Knit+Polo+flat-lay';
    assert.deepEqual(parsePlaceholder(url), { hex: '#1F2A44', name: 'Knit Polo' });
  });

  it('leaves real photos and odd URLs alone', () => {
    assert.equal(parsePlaceholder('https://cdn.example.com/shirt.jpg'), null);
    assert.equal(parsePlaceholder('https://placehold.co/600x800/not-a-colour/fff/png'), null);
    assert.equal(parsePlaceholder(undefined), null);
  });
});

describe('colour helpers', () => {
  it('mixes, shades and judges brightness', () => {
    assert.deepEqual(hexToRgb('#1C1A17'), [28, 26, 23]);
    assert.equal(mix('#000000', '#FFFFFF', 0), '#000000');
    assert.equal(mix('#000000', '#FFFFFF', 1), '#ffffff');
    assert.equal(mix('#000000', '#FFFFFF', 0.5), '#808080');
    assert.equal(shade('#808080', -0.5), 'rgb(64, 64, 64)');
    assert.equal(isLight('#F5F5F0'), true);
    assert.equal(isLight('#1F2A44'), false);
  });
});
