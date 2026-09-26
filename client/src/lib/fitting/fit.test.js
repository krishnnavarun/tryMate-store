// Tests for the size → drawing scale maths (run with `npm test`).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fitScales, widthLabel } from './fit.js';

// Men's t-shirt chart from the seed data (server/seed/sizeCharts.js)
const CHART = {
  S: { chest: [88, 94], length: [72, 74] },
  M: { chest: [94, 100], length: [74, 76] },
  XXL: { chest: [112, 120], length: [80, 82] },
};
const shopper = { chest_cm: 97, torso_cm: 48 }; // an M: 94–100 cm chest

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);

describe('fitScales', () => {
  it('the right size is drawn at the shopper’s own width', () => {
    const { width, known } = fitScales(CHART.M, shopper);
    close(width, 1);
    assert.equal(known, true);
  });

  it('a smaller size is narrower, a bigger size is wider', () => {
    close(fitScales(CHART.S, shopper).width, 91 / 97);
    close(fitScales(CHART.XXL, shopper).width, 116 / 97);
    assert.ok(fitScales(CHART.S, shopper).width < 1);
    assert.ok(fitScales(CHART.XXL, shopper).width > 1);
  });

  it('length compares the size’s length with the ideal length for the torso', () => {
    // ideal garment length = torso × 1.55 = 74.4 cm; M is 75 cm long
    close(fitScales(CHART.M, shopper).length, 75 / (48 * 1.55));
  });

  it('keeps the drawing believable when the numbers are far apart', () => {
    assert.equal(fitScales(CHART.XXL, { chest_cm: 70, torso_cm: 30 }).width, 1.2);
    assert.equal(fitScales(CHART.XXL, { chest_cm: 70, torso_cm: 30 }).length, 1.15);
    assert.equal(fitScales(CHART.S, { chest_cm: 140, torso_cm: 70 }).width, 0.85);
    assert.equal(fitScales(CHART.S, { chest_cm: 140, torso_cm: 70 }).length, 0.88);
  });

  it('draws at natural size without a body scan or size chart', () => {
    assert.deepEqual(fitScales(CHART.M, null), { width: 1, length: 1, known: false });
    assert.deepEqual(fitScales(undefined, shopper), { width: 1, length: 1, known: false });
  });

  it('handles charts or scans with missing numbers', () => {
    assert.deepEqual(fitScales({ length: [74, 76] }, shopper), { width: 1, length: fitScales(CHART.M, shopper).length, known: false });
    assert.equal(fitScales(CHART.M, { chest_cm: 97 }).length, 1);
  });
});

describe('widthLabel', () => {
  it('describes the width in plain words', () => {
    assert.equal(widthLabel(0.9), 'Snug');
    assert.equal(widthLabel(1), 'Close to your body shape');
    assert.equal(widthLabel(0.95), 'Close to your body shape');
    assert.equal(widthLabel(1.07), 'Close to your body shape');
    assert.equal(widthLabel(1.1), 'Roomy');
  });
});
