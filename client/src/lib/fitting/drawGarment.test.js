// Tests for the live fitting room drawing (run with `npm test`, Node's built-in test runner).
//
// A fake canvas records every path in screen pixels, so we can check the shapes without a
// browser. The pose is a real MediaPipe detection saved as numbers (__fixtures__).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { drawGarment, torsoFrame } from './drawGarment.js';
import { P } from './landmarks.js';

const fixture = JSON.parse(readFileSync(new URL('./__fixtures__/standing-pose.json', import.meta.url), 'utf8'));
const standing = fixture.landmarks.map((p) => ({ x: p.x * fixture.width, y: p.y * fixture.height, visibility: p.visibility }));

// ---- test poses -------------------------------------------------------------------------------

// The same person with both arms raised sideways by `degrees`
function armsRaised(pts, degrees) {
  const out = pts.map((p) => ({ ...p }));
  const rotate = (centre, p, rad) => ({
    ...p,
    x: centre.x + (p.x - centre.x) * Math.cos(rad) - (p.y - centre.y) * Math.sin(rad),
    y: centre.y + (p.x - centre.x) * Math.sin(rad) + (p.y - centre.y) * Math.cos(rad),
  });
  // The person's left arm is on the image's right: it rotates the other way
  for (const [shoulder, elbow, wrist, sign] of [
    [P.L_SHOULDER, P.L_ELBOW, P.L_WRIST, -1],
    [P.R_SHOULDER, P.R_ELBOW, P.R_WRIST, 1],
  ]) {
    const rad = (sign * degrees * Math.PI) / 180;
    out[elbow] = rotate(pts[shoulder], pts[elbow], rad);
    out[wrist] = rotate(pts[shoulder], pts[wrist], rad);
  }
  return out;
}

// The whole body tilted (person leaning), rotated about the middle of the shoulders
function leaning(pts, degrees) {
  const c = { x: (pts[P.L_SHOULDER].x + pts[P.R_SHOULDER].x) / 2, y: (pts[P.L_SHOULDER].y + pts[P.R_SHOULDER].y) / 2 };
  const rad = (degrees * Math.PI) / 180;
  return pts.map((p) => ({
    ...p,
    x: c.x + (p.x - c.x) * Math.cos(rad) - (p.y - c.y) * Math.sin(rad),
    y: c.y + (p.x - c.x) * Math.sin(rad) + (p.y - c.y) * Math.cos(rad),
  }));
}

function withHidden(pts, indexes) {
  return pts.map((p, i) => (indexes.includes(i) ? { ...p, visibility: 0.1 } : p));
}

// ---- a canvas that records what is drawn ---------------------------------------------------------

function recordingContext() {
  let transform = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let current = null;
  const paths = []; // { points: [{x, y}] in screen pixels, screenSpace: bool }
  const images = [];
  const toScreen = (x, y) => {
    const [a, b, c, d, e, f] = transform;
    return { x: a * x + c * y + e, y: b * x + d * y + f };
  };
  return {
    paths,
    images,
    fillStyle: null,
    strokeStyle: null,
    lineWidth: 1,
    globalAlpha: 1,
    save() {
      stack.push(transform);
    },
    restore() {
      transform = stack.pop();
    },
    setTransform(a, b, c, d, e, f) {
      transform = [a, b, c, d, e, f];
    },
    beginPath() {
      const [a, b, c, d, e, f] = transform;
      current = { points: [], screenSpace: a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0, filled: false };
    },
    moveTo(x, y) {
      current.points.push(toScreen(x, y));
    },
    lineTo(x, y) {
      current.points.push(toScreen(x, y));
    },
    quadraticCurveTo(_cx, _cy, x, y) {
      current.points.push(toScreen(x, y));
    },
    arc() {},
    closePath() {},
    fill() {
      if (!current.filled) paths.push(current);
      current.filled = true;
    },
    stroke() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    drawImage(image, x, y, w, h) {
      images.push({ image, corner: toScreen(x, y), w, h });
    },
  };
}

function draw(pts, garment, scales) {
  const ctx = recordingContext();
  const result = drawGarment(ctx, pts, { hex: '#1F2A44', ...garment }, scales);
  // Sleeves are drawn in screen space; the body (and its details) in the torso frame
  const sleeves = ctx.paths.filter((p) => p.screenSpace);
  return { result, ctx, sleeves, outlines: sleeves.filter((p) => p.points.length > 4 || !garment.longSleeves) };
}

// ---- geometry helpers ----------------------------------------------------------------------------

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

function segmentsCross(p1, p2, q1, q2) {
  const d1 = cross(q1, q2, p1);
  const d2 = cross(q1, q2, p2);
  const d3 = cross(p1, p2, q1);
  const d4 = cross(p1, p2, q2);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

// Does the closed outline cross itself (a "bow-tie")? Neighbouring edges share a corner, skip them.
function selfCrossing(points) {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsCross(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return true;
    }
  }
  return false;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// ---- tests ------------------------------------------------------------------------------------------

describe('torsoFrame', () => {
  it('builds a frame from a standing person', () => {
    const frame = torsoFrame(standing);
    assert.equal(frame.ok, true);
    assert.ok(frame.shoulderW > 100, `shoulder width ${frame.shoulderW}px`);
    assert.ok(frame.torsoLen > frame.shoulderW, 'the torso is longer than the shoulders are wide');
    assert.ok(Math.abs(Math.hypot(frame.across.x, frame.across.y) - 1) < 1e-9, 'across is a unit vector');
    assert.ok(frame.down.y > 0.95, 'down points down the image for an upright person');
  });

  it('asks the shopper to step into the frame when there is no pose', () => {
    assert.deepEqual(torsoFrame(null), { ok: false, reason: 'no-person' });
  });

  it('asks to see the shoulders and hips when they are not visible', () => {
    assert.equal(torsoFrame(withHidden(standing, [P.L_HIP, P.R_HIP])).reason, 'no-torso');
    assert.equal(torsoFrame(withHidden(standing, [P.R_SHOULDER])).reason, 'no-torso');
  });

  it('asks to come closer when the person is tiny in the image', () => {
    const tiny = standing.map((p) => ({ ...p, x: 600 + p.x * 0.02, y: 300 + p.y * 0.02 }));
    assert.equal(torsoFrame(tiny).reason, 'too-far');
  });

  it('turns with the person when they lean', () => {
    const frame = torsoFrame(leaning(standing, 20));
    const angle = (Math.atan2(frame.down.x, frame.down.y) * 180) / Math.PI;
    assert.ok(Math.abs(Math.abs(angle) - 20) < 2, `frame leans ${angle.toFixed(1)}°`);
  });
});

describe('drawGarment', () => {
  it('draws nothing and reports why when the body is not visible', () => {
    const { result, ctx } = draw(withHidden(standing, [P.L_HIP]), { type: 'tshirt' });
    assert.deepEqual(result, { ok: false, reason: 'no-torso' });
    assert.equal(ctx.paths.length, 0);
  });

  it('draws a body and two sleeves', () => {
    const { result, ctx, outlines } = draw(standing, { type: 'tshirt' });
    assert.deepEqual(result, { ok: true });
    assert.equal(outlines.length, 2);
    assert.ok(ctx.paths.some((p) => !p.screenSpace), 'the body is drawn in the torso frame');
  });

  // The bug this guards against: short sleeves that ended above the armpit had an outline
  // that folded back on itself, so the canvas filled almost nothing (invisible sleeves).
  const poses = {
    standing,
    'arms raised 30°': armsRaised(standing, 30),
    'arms raised 60°': armsRaised(standing, 60),
    'leaning 15°': leaning(standing, 15),
    'elbows hidden': withHidden(standing, [P.L_ELBOW, P.R_ELBOW, P.L_WRIST, P.R_WRIST]),
  };
  for (const [poseName, pts] of Object.entries(poses)) {
    for (const type of ['tshirt', 'polo', 'shirt']) {
      for (const longSleeves of [false, true]) {
        it(`${type} with ${longSleeves ? 'long' : 'short'} sleeves, ${poseName}: sleeve outlines never cross themselves`, () => {
          for (const width of [0.85, 0.94, 1, 1.2]) {
            const { outlines } = draw(pts, { type, longSleeves }, { width, length: 1 });
            assert.equal(outlines.length, 2);
            for (const sleeve of outlines) {
              assert.equal(selfCrossing(sleeve.points), false, `width ${width}: ${JSON.stringify(sleeve.points)}`);
            }
          }
        });
      }
    }
  }

  it('short sleeves reach below the armpit', () => {
    const frame = torsoFrame(standing);
    const { outlines } = draw(standing, { type: 'tshirt' });
    for (const [seam, endOut, endIn, armpit] of outlines.map((s) => s.points)) {
      const depth = (p) => (p.x - frame.origin.x) * frame.down.x + (p.y - frame.origin.y) * frame.down.y;
      assert.ok(depth(mid(endOut, endIn)) > depth(armpit), 'sleeve end is lower than the armpit');
      assert.ok(depth(seam) < depth(armpit));
    }
  });

  it('long sleeves end at the wrists', () => {
    const { outlines } = draw(standing, { type: 'shirt', longSleeves: true });
    const wrists = [standing[P.L_WRIST], standing[P.R_WRIST]];
    const forearm = dist(standing[P.L_WRIST], standing[P.L_ELBOW]);
    for (const sleeve of outlines) {
      const cuff = mid(sleeve.points[2], sleeve.points[3]);
      const nearest = Math.min(...wrists.map((w) => dist(cuff, w)));
      assert.ok(nearest < forearm * 0.1, `cuff is ${nearest.toFixed(1)}px from the wrist`);
    }
  });

  it('a bigger size looks wider, a smaller one narrower', () => {
    const seamSpan = (width) => {
      const [a, b] = draw(standing, { type: 'tshirt' }, { width, length: 1 }).outlines;
      return dist(a.points[0], b.points[0]);
    };
    assert.ok(seamSpan(0.9) < seamSpan(1));
    assert.ok(seamSpan(1) < seamSpan(1.15));
    assert.ok(Math.abs(seamSpan(1.1) / seamSpan(1) - 1.1) < 1e-9, 'shoulder seams scale with the width');
  });

  it('long sleeves are drawn under the body, short sleeves over it', () => {
    const order = (longSleeves) => draw(standing, { type: 'tshirt', longSleeves }).ctx.paths.map((p) => p.screenSpace);
    assert.equal(order(true)[0], true, 'long: sleeves first');
    assert.equal(order(false)[0], false, 'short: body first');
    assert.equal(order(false).at(-1), true);
  });

  it('shirts get long sleeves unless told otherwise', () => {
    assert.equal(draw(standing, { type: 'shirt' }).sleeves.length, 4, 'two sleeves + two cuff bands');
    assert.equal(draw(standing, { type: 'shirt', longSleeves: false }).sleeves.length, 2);
  });

  it('uses the product cut-out image when there is one', () => {
    const image = { complete: true, naturalWidth: 400, naturalHeight: 500 };
    const { result, ctx } = draw(standing, { type: 'tshirt', image });
    assert.deepEqual(result, { ok: true });
    assert.equal(ctx.images.length, 1);
    assert.equal(ctx.paths.length, 0, 'no drawn shape on top of the photo');
  });

  it('ignores a cut-out image that has not loaded yet', () => {
    const image = { complete: false, naturalWidth: 0, naturalHeight: 0 };
    const { ctx } = draw(standing, { type: 'tshirt', image });
    assert.equal(ctx.images.length, 0);
    assert.ok(ctx.paths.length > 0);
  });
});
