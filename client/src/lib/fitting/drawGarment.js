// Draws a garment over the person in the live camera image, following their body.
//
// HOW IT WORKS
// 1. A "torso frame" is built from the shoulder and hip landmarks:
//      origin = middle of the shoulders
//      across = unit vector from one shoulder to the other
//      down   = unit vector from the shoulders' middle to the hips' middle
//    canvas.setTransform(across, down, origin) then lets us draw the shirt body in simple
//    garment coordinates (u = sideways, v = downwards, in pixels) and it automatically
//    rotates, leans and moves with the person.
// 2. Garment size comes from the body: width from the shoulder distance (× 1.3 because the
//    landmarks are shoulder *joints*, the seams sit further out), hem width from the hips,
//    length from the torso. The chosen size then scales it (fit.js): narrower = tighter.
// 3. Sleeves are drawn in screen coordinates along shoulder → elbow (→ wrist for long
//    sleeves), so they follow the arms.
// 4. If the product has a transparent PNG cut-out (overlayImageUrl), that image is drawn in
//    the torso frame instead of the drawn shape.
//
// It's a 2D overlay: great for colour, style and proportions; it can't show how fabric
// drapes or wrinkles. The AI try-on ("Make it realistic") is for a photo-real image.

import { P } from './poseTracker.js';

const MIN_VISIBILITY = 0.5;

// How far below the hip landmarks the hem sits (× torso length), per garment type
const HEM_EXTRA = { tshirt: 0.14, polo: 0.14, shirt: 0.22 };
// Landmarks are the shoulder JOINTS; a garment's shoulder seam sits further out, over the deltoid
const SHOULDER_SEAM_FACTOR = 1.3;
// How far the shoulder seam sits below the neckline (× shoulder width): the natural slope
const SHOULDER_DROP = 0.08;

// ---- small vector helpers (points are { x, y } in canvas pixels) -----------------------
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
const len = (a) => Math.hypot(a.x, a.y);
const unit = (a) => mul(a, 1 / (len(a) || 1));
const midpoint = (a, b) => mul(add(a, b), 0.5);
const perp = (a) => ({ x: -a.y, y: a.x });

// ---- colours ------------------------------------------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// amount < 0 darkens, > 0 lightens (−1 … 1)
function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex).map((c) => (amount < 0 ? c * (1 + amount) : c + (255 - c) * amount));
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Very light garments need a visible outline; very dark ones a lighter one
function outlineFor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)';
}

// ---- the torso frame -------------------------------------------------------------------------

// pts: 33 landmarks in canvas pixels ({ x, y, visibility })
export function torsoFrame(pts) {
  if (!pts) return { ok: false, reason: 'no-person' };
  const need = [P.L_SHOULDER, P.R_SHOULDER, P.L_HIP, P.R_HIP];
  if (need.some((i) => (pts[i].visibility ?? 1) < MIN_VISIBILITY)) return { ok: false, reason: 'no-torso' };

  const sL = pts[P.L_SHOULDER];
  const sR = pts[P.R_SHOULDER];
  const hL = pts[P.L_HIP];
  const hR = pts[P.R_HIP];
  const origin = midpoint(sL, sR);
  const hips = midpoint(hL, hR);
  const shoulderW = len(sub(sL, sR));
  const torsoLen = len(sub(hips, origin));
  if (shoulderW < 20 || torsoLen < 20) return { ok: false, reason: 'too-far' };

  return {
    ok: true,
    origin,
    across: unit(sub(sL, sR)),
    down: unit(sub(hips, origin)),
    shoulderW,
    hipW: len(sub(hL, hR)),
    torsoLen,
  };
}

// garment (u, v) coordinates → canvas pixels
const toScreen = (frame, u, v) => add(frame.origin, add(mul(frame.across, u), mul(frame.down, v)));

// ---- drawing ---------------------------------------------------------------------------------

function garmentGeometry(frame, type, scales) {
  const sw = frame.shoulderW;
  const hs = sw * 0.5 * SHOULDER_SEAM_FACTOR * scales.width; // half width at the shoulder seams
  return {
    sw,
    hs,
    hw: Math.max(frame.hipW * 0.9, sw * 0.5) * scales.width, // half width at the hem
    hemV: frame.torsoLen * (1 + (HEM_EXTRA[type] ?? 0.15)) * scales.length,
    armV: frame.torsoLen * 0.3, // armpit height
    neckW: sw * 0.16,
    neckH: sw * 0.07,
    neckDepth: sw * (type === 'tshirt' ? 0.12 : 0.2),
  };
}

function drawSleeve(ctx, pts, frame, g, side, longSleeves, color) {
  const sign = side === 'left' ? 1 : -1; // +across = towards the left shoulder
  const joint = pts[side === 'left' ? P.L_SHOULDER : P.R_SHOULDER];
  const elbow = pts[side === 'left' ? P.L_ELBOW : P.R_ELBOW];
  const wrist = pts[side === 'left' ? P.L_WRIST : P.R_WRIST];
  const seam = toScreen(frame, sign * g.hs, g.sw * SHOULDER_DROP);
  const armpit = toScreen(frame, sign * g.hs * 0.94, g.armV);

  // Arm direction: towards the elbow if we can see it, otherwise hanging down a little outwards
  const elbowSeen = (elbow.visibility ?? 1) >= MIN_VISIBILITY;
  const upperDir = elbowSeen ? unit(sub(elbow, joint)) : unit(add(mul(frame.down, 0.9), mul(frame.across, sign * 0.3)));
  const upperLen = elbowSeen ? len(sub(elbow, joint)) : frame.torsoLen * 0.6;

  const topWidth = len(sub(seam, armpit));
  const outer = (point, halfWidth, dir) => {
    // the side of the sleeve that faces away from the body
    const n = unit(perp(dir));
    const away = Math.sign((seam.x - armpit.x) * n.x + (seam.y - armpit.y) * n.y) || 1;
    return [add(point, mul(n, halfWidth * away)), sub(point, mul(n, halfWidth * away))];
  };

  const polygon = [];
  if (longSleeves) {
    const elbowPoint = add(joint, mul(upperDir, upperLen));
    const wristSeen = elbowSeen && (wrist.visibility ?? 1) >= MIN_VISIBILITY;
    const foreDir = wristSeen ? unit(sub(wrist, elbow)) : upperDir;
    const foreLen = wristSeen ? len(sub(wrist, elbow)) * 0.95 : upperLen * 0.9;
    const cuff = add(elbowPoint, mul(foreDir, foreLen));
    const [eOut, eIn] = outer(elbowPoint, topWidth * 0.36, upperDir);
    const [cOut, cIn] = outer(cuff, topWidth * 0.26, foreDir);
    polygon.push(seam, eOut, cOut, cIn, eIn, armpit);
    // cuff band
    const [cOut2, cIn2] = outer(sub(cuff, mul(foreDir, topWidth * 0.3)), topWidth * 0.27, foreDir);
    ctx.fillStyle = shade(color.hex, -0.06);
    fillPath(ctx, polygon, outlineFor(color.hex));
    ctx.fillStyle = shade(color.hex, -0.15);
    fillPath(ctx, [cOut2, cOut, cIn, cIn2]);
    return;
  }
  // Short sleeve: a tube around the upper arm. It starts at the garment's armhole
  // (shoulder seam → armpit) and ends half-way down the arm, centred on the arm itself, so it
  // covers the top of the arm the way a real sleeve does. Width follows the garment size.
  const sleeveEnd = add(joint, mul(upperDir, upperLen * 0.5));
  const [endOut, endIn] = outer(sleeveEnd, g.hs * 0.24, upperDir);
  polygon.push(seam, endOut, endIn, armpit);
  ctx.fillStyle = shade(color.hex, -0.06);
  fillPath(ctx, polygon, outlineFor(color.hex));
}

function fillPath(ctx, points, stroke) {
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawBody(ctx, g, type, hex) {
  const { hs, hw, hemV, armV, neckW, neckH, neckDepth, sw } = g;
  ctx.beginPath();
  ctx.moveTo(-neckW, -neckH);
  ctx.quadraticCurveTo(-neckW * 1.8, -neckH * 0.2, -hs, sw * SHOULDER_DROP); // left shoulder slope
  ctx.lineTo(-hs * 0.94, armV); // armhole
  ctx.quadraticCurveTo(-Math.max(hw, hs * 0.94) * 1.02, (armV + hemV) / 2, -hw, hemV); // side seam
  ctx.quadraticCurveTo(0, hemV + sw * 0.03, hw, hemV); // hem
  ctx.quadraticCurveTo(Math.max(hw, hs * 0.94) * 1.02, (armV + hemV) / 2, hs * 0.94, armV);
  ctx.lineTo(hs, sw * SHOULDER_DROP);
  ctx.quadraticCurveTo(neckW * 1.8, -neckH * 0.2, neckW, -neckH);
  ctx.quadraticCurveTo(0, neckDepth, -neckW, -neckH); // neckline
  ctx.closePath();

  // Darker at the sides, lighter in the middle: a hint of 3D
  const gradient = ctx.createLinearGradient(-hw, 0, hw, 0);
  gradient.addColorStop(0, shade(hex, -0.28));
  gradient.addColorStop(0.5, shade(hex, 0.06));
  gradient.addColorStop(1, shade(hex, -0.28));
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = outlineFor(hex);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Details
  const detail = shade(hex, -0.35);
  ctx.strokeStyle = detail;
  ctx.fillStyle = detail;
  if (type === 'tshirt') {
    // ribbed crew neck
    ctx.lineWidth = Math.max(2, sw * 0.025);
    ctx.beginPath();
    ctx.moveTo(-neckW, -neckH);
    ctx.quadraticCurveTo(0, neckDepth, neckW, -neckH);
    ctx.stroke();
  } else {
    // collar flaps
    ctx.fillStyle = shade(hex, -0.12);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * neckW * 1.1, -neckH * 1.3);
      ctx.lineTo(s * neckW * 0.15, neckDepth * 0.75);
      ctx.lineTo(s * neckW * 1.35, neckDepth * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = outlineFor(hex);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // placket (polo: short; shirt: full length) with buttons
    const placketEnd = type === 'polo' ? neckDepth + sw * 0.28 : hemV - sw * 0.05;
    ctx.strokeStyle = detail;
    ctx.lineWidth = Math.max(1, sw * 0.012);
    ctx.beginPath();
    ctx.moveTo(0, neckDepth * 0.8);
    ctx.lineTo(0, placketEnd);
    ctx.stroke();
    const buttons = type === 'polo' ? 2 : 6;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < buttons; i++) {
      const v = neckDepth + ((placketEnd - neckDepth) * (i + 0.5)) / buttons;
      ctx.beginPath();
      ctx.arc(sw * 0.015, v, Math.max(1.5, sw * 0.014), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw `garment` on the person described by `pts`.
 * garment: { type: 'tshirt' | 'polo' | 'shirt', hex: '#1F2A44', longSleeves?: boolean, image?: HTMLImageElement }
 * scales:  { width, length } from fit.js (1 = the person's own proportions)
 * Returns { ok: true } or { ok: false, reason } when the body isn't visible enough.
 */
export function drawGarment(ctx, pts, garment, scales = { width: 1, length: 1 }) {
  const frame = torsoFrame(pts);
  if (!frame.ok) return frame;
  const g = garmentGeometry(frame, garment.type, scales);

  ctx.save();
  ctx.globalAlpha = 0.96;

  // A real product cut-out (transparent PNG), when the product has one
  if (garment.image?.complete && garment.image.naturalWidth) {
    const { across, down, origin } = frame;
    ctx.setTransform(across.x, across.y, down.x, down.y, origin.x, origin.y);
    const width = g.hs * 2 * 1.6; // cut-outs include the sleeves
    const height = (width * garment.image.naturalHeight) / garment.image.naturalWidth;
    ctx.drawImage(garment.image, -width / 2, -g.neckH * 2.5, width, height * scales.length);
    ctx.restore();
    return { ok: true };
  }

  const color = { hex: garment.hex };
  const longSleeves = garment.longSleeves ?? garment.type === 'shirt';
  const sleeves = () => {
    drawSleeve(ctx, pts, frame, g, 'left', longSleeves, color);
    drawSleeve(ctx, pts, frame, g, 'right', longSleeves, color);
  };
  const body = () => {
    const { across, down, origin } = frame;
    ctx.save();
    ctx.setTransform(across.x, across.y, down.x, down.y, origin.x, origin.y);
    drawBody(ctx, g, garment.type, garment.hex);
    ctx.restore();
  };
  // Long sleeves run along the arm beside the body: draw them first, body on top.
  // Short sleeves sit over the armhole: draw them after the body.
  if (longSleeves) {
    sleeves();
    body();
  } else {
    body();
    sleeves();
  }
  ctx.restore();
  return { ok: true };
}
