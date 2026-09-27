import { useId } from 'react';
import { isLight, mix, shade } from '../../lib/color.js';
import { garmentStyle } from '../../lib/garmentStyle.js';

// A flat-lay illustration of a shirt, tee or polo in any colour, drawn as SVG.
// Stands in for the seed catalogue's placeholder images until real photos are added
// (see ProductImage). viewBox 300 × 400 = the 3:4 product image format.
//
// Everything is built from a few anchor points on the LEFT half of the garment; the right
// half is the mirror image (x → 300 − x).

const W = 300;

// Proportions from real garments at ~3 px per cm (a size M tee laid flat: 52 cm wide, 72 cm
// long, 46 cm shoulders, 20 cm sleeves). [x, y] of the left neck point, shoulder point,
// armpit, hem corner, and the sleeve end (outer, inner) for short and long sleeves.
const SILHOUETTES = {
  tshirt: { neck: [123, 90], shoulder: [81, 102], armpit: [73, 154], hem: [75, 306], short: [[33, 136], [59, 173]], long: [[34, 286], [62, 294]] },
  polo: { neck: [123, 88], shoulder: [81, 100], armpit: [73, 152], hem: [75, 310], short: [[36, 132], [60, 166]], long: [[34, 286], [62, 294]] },
  boxy: { neck: [121, 94], shoulder: [70, 108], armpit: [64, 164], hem: [64, 298], short: [[26, 150], [52, 190]], long: [[24, 286], [54, 296]] },
  shirt: { neck: [122, 86], shoulder: [78, 98], armpit: [70, 154], hem: [70, 298], shirttail: true, short: [[30, 138], [58, 176]], long: [[28, 290], [58, 298]] },
};

const n1 = (v) => Math.round(v * 10) / 10;
const L = (x, y) => `${n1(x)} ${n1(y)}`;
const R = (x, y) => `${n1(W - x)} ${n1(y)}`;

function geometry(style) {
  const s = SILHOUETTES[style.silhouette] ?? SILHOUETTES.tshirt;
  const [out, inn] = style.longSleeves ? s.long : s.short;
  return { ...s, out, inn, long: style.longSleeves };
}

// The garment outline, clockwise from the left side of the neck
function outline(g) {
  const [nx, ny] = g.neck;
  const [sx, sy] = g.shoulder;
  const [ax, ay] = g.armpit;
  const [hx, hy] = g.hem;
  const [ox, oy] = g.out;
  const [ix, iy] = g.inn;
  const sl = g.long
    ? { a: [sx - 22, sy + 40], b: [ox + 6, oy - 70], c: [ix + 8, iy - 52], d: [ax - 8, ay + 34] }
    : { a: [sx - 14, sy + 14], b: [ox + 8, oy - 26], c: [ix + 10, iy - 12], d: [ax - 2, ay + 10] };
  const side = { a: [ax + 2, ay + 60], b: [hx - 4, hy - 60] };
  return [
    `M ${L(nx, ny)} L ${L(sx, sy)}`,
    `C ${L(...sl.a)} ${L(...sl.b)} ${L(ox, oy)} L ${L(ix, iy)}`,
    `C ${L(...sl.c)} ${L(...sl.d)} ${L(ax, ay)}`,
    `C ${L(...side.a)} ${L(...side.b)} ${L(hx, hy)}`,
    g.shirttail ? `C ${L(hx + 18, hy + 30)} ${R(hx + 18, hy + 30)} ${R(hx, hy)}` : `L ${R(hx, hy)}`,
    `C ${R(...side.b)} ${R(...side.a)} ${R(ax, ay)}`,
    `C ${R(...sl.d)} ${R(...sl.c)} ${R(ix, iy)} L ${R(ox, oy)}`,
    `C ${R(...sl.b)} ${R(...sl.a)} ${R(sx, sy)} L ${R(nx, ny)}`,
    `Q ${L(150, ny + 6)} ${L(nx, ny)} Z`,
  ].join(' ');
}

// The sleeve's end edge, moved `d` px back towards the shoulder (for cuffs and hem stitching)
function inset([x1, y1], [x2, y2], d) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len = Math.hypot(vx, vy);
  const ox = (vy / len) * d;
  const oy = (-vx / len) * d;
  return [
    [x1 + ox, y1 + oy],
    [x2 + ox, y2 + oy],
  ];
}

const mirror = (points) => points.map(([x, y]) => [W - x, y]);
const polyline = (points) => `M ${points.map(([x, y]) => L(x, y)).join(' L ')}`;

export default function GarmentArt({ name, type, hex, title, backdrop = true, className = '' }) {
  const style = garmentStyle({ name, type, hex });
  const id = `ga${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const g = geometry(style);
  const [nx, ny] = g.neck;
  const [hx, hy] = g.hem;
  const base = style.base;
  const light = isLight(base);

  const c = {
    inside: shade(base, -0.38),
    band: shade(base, -0.07),
    collar: shade(base, -0.03),
    outline: shade(base, -0.32),
    seam: shade(base, light ? -0.28 : 0.22),
    stitch: style.pattern === 'denim' ? '#C9A063' : shade(base, light ? -0.3 : 0.28),
    button: light ? '#E2DBCE' : '#F3EFE7',
    buttonEdge: shade(base, -0.4),
    motif: light ? shade(base, -0.22) : shade(base, 0.42),
    bgInner: mix('#F6F2EC', base, 0.05),
    bgOuter: mix('#E6DFD4', base, 0.1),
  };

  const d = outline(g);
  const sleeveEdge = inset(g.out, g.inn, g.long ? 18 : 6);
  const shirtFront = style.neck === 'point' || style.neck === 'mandarin' || style.neck === 'camp';
  const placketTop = { point: ny + 26, mandarin: ny + 10, camp: ny + 40, polo: ny + 22, henley: ny + 26 }[style.neck];
  const placketBottom = shirtFront ? hy + 18 : style.neck === 'henley' ? ny + 76 : ny + 74;
  const buttons = [];
  if (shirtFront) {
    const step = style.neck === 'camp' ? 36 : 32;
    for (let y = placketTop + (style.neck === 'camp' ? 18 : 14); y < hy + 8; y += step) buttons.push(y);
  } else if (style.neck === 'polo') {
    buttons.push(ny + 38, ny + 58);
  } else if (style.neck === 'henley') {
    buttons.push(ny + 38, ny + 54, ny + 70);
  }

  // title="" (like alt="") marks a decorative copy, e.g. the hover image: hidden from screen readers
  const label = title ?? name;
  const decorative = !label;

  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : undefined}
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor={c.bgInner} />
          <stop offset="100%" stopColor={c.bgOuter} />
        </radialGradient>
        <linearGradient id={`${id}-sx`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.18" />
          <stop offset="0.24" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="0.76" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id={`${id}-sy`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={d} />
        </clipPath>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#1c1a17" floodOpacity="0.16" />
        </filter>
        <filter id={`${id}-soft`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <Pattern id={`${id}-pat`} kind={style.pattern} accent={style.accent} motif={c.motif} />
      </defs>

      {backdrop && (
        <>
          <rect width="300" height="400" fill={`url(#${id}-bg)`} />
          <ellipse cx="150" cy={hy + (g.shirttail ? 40 : 24)} rx="118" ry="9" fill="#1c1a17" opacity="0.1" filter={`url(#${id}-soft)`} />
        </>
      )}

      {/* Body + sleeves, with a soft drop shadow */}
      <path d={d} fill={base} filter={`url(#${id}-shadow)`} />

      {/* Fabric, shading, folds and seams: clipped to the garment */}
      <g clipPath={`url(#${id}-clip)`}>
        {style.pattern && <rect width="300" height="400" fill={`url(#${id}-pat)`} />}
        <rect width="300" height="400" fill={`url(#${id}-sx)`} />
        <rect width="300" height="400" fill={`url(#${id}-sy)`} />
        <g filter={`url(#${id}-soft)`} fill="none" strokeLinecap="round">
          <path d={`M 108 182 C 116 226 104 266 112 ${hy - 12}`} stroke="#000" strokeOpacity="0.045" strokeWidth="8" />
          <path d={`M 194 174 C 186 220 198 262 190 ${hy - 14}`} stroke="#000" strokeOpacity="0.04" strokeWidth="8" />
          <path d="M 94 208 C 134 198 170 214 208 202" stroke="#fff" strokeOpacity="0.07" strokeWidth="9" />
        </g>
        {/* Armhole seams */}
        {[g.shoulder, [W - g.shoulder[0], g.shoulder[1]]].map(([sx, sy], i) => {
          const [ax, ay] = i ? [W - g.armpit[0], g.armpit[1]] : g.armpit;
          const dir = i ? -1 : 1;
          return (
            <path
              key={i}
              d={`M ${L(sx, sy)} C ${L(sx + 4 * dir, sy + 18)} ${L(ax - 4 * dir, ay - 18)} ${L(ax, ay)}`}
              fill="none"
              stroke={c.seam}
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          );
        })}
        {/* Cuffs (long sleeves) or hem stitching (short sleeves) */}
        {[
          [g.out, g.inn],
          mirror([g.out, g.inn]),
        ].map(([o, n], i) => {
          const [o2, n2] = i ? mirror(sleeveEdge) : sleeveEdge;
          return g.long ? (
            <path key={i} d={`${polyline([o, n, n2, o2])} Z`} fill={c.band} stroke={c.seam} strokeOpacity="0.45" strokeWidth="1" />
          ) : (
            <path key={i} d={polyline([o2, n2])} stroke={c.stitch} strokeOpacity="0.55" strokeWidth="1" strokeDasharray="3 3" />
          );
        })}
        {/* Hem stitching */}
        <path
          d={
            g.shirttail
              ? `M ${L(hx + 2, hy - 7)} C ${L(hx + 20, hy + 22)} ${R(hx + 20, hy + 22)} ${R(hx + 2, hy - 7)}`
              : `M ${L(hx + 3, hy - 8)} L ${R(hx + 3, hy - 8)}`
          }
          fill="none"
          stroke={c.stitch}
          strokeOpacity="0.55"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </g>

      <path d={d} fill="none" stroke={c.outline} strokeOpacity="0.5" strokeWidth="1.1" strokeLinejoin="round" />

      <Neck style={style} nx={nx} ny={ny} c={c} />

      {/* Placket and buttons */}
      {placketTop && (
        <rect
          x="145"
          y={placketTop}
          width="10"
          height={placketBottom - placketTop}
          fill={c.collar}
          stroke={c.seam}
          strokeOpacity="0.4"
          strokeWidth="0.8"
        />
      )}
      {buttons.map((y) => (
        <circle key={y} cx="150" cy={y} r="3" fill={c.button} stroke={c.buttonEdge} strokeOpacity="0.35" strokeWidth="0.6" />
      ))}

      {style.pocket && (
        <g>
          <path d="M 166 146 H 196 V 176 L 181 184 L 166 176 Z" fill={c.collar} stroke={c.seam} strokeOpacity="0.5" strokeWidth="0.9" />
          <path d="M 167 152 H 195" stroke={c.stitch} strokeOpacity="0.55" strokeWidth="0.9" strokeDasharray="2.5 2.5" />
        </g>
      )}
    </svg>
  );
}

// Necklines and collars, drawn on top of the body
function Neck({ style, nx, ny, c }) {
  const rx = W - nx;
  const back = `M ${L(nx, ny)} Q ${L(150, ny + 6)} ${L(rx, ny)}`;
  const flap = (points) => <path d={points} fill={c.collar} stroke={c.outline} strokeOpacity="0.45" strokeWidth="0.9" />;
  const mirrorPath = (dStr) =>
    dStr.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${n1(W - Number(x))} ${y}`);

  switch (style.neck) {
    case 'v':
      return (
        <g>
          <path d={`${back} L ${L(150, ny + 46)} Z`} fill={c.inside} />
          <path d={`M ${L(nx, ny)} L ${L(150, ny + 46)} L ${L(rx, ny)}`} fill="none" stroke={c.band} strokeWidth="7" strokeLinejoin="miter" />
          <rect x="146" y={ny + 4} width="8" height="5" rx="1" fill="#F4EFE6" opacity="0.9" />
        </g>
      );
    case 'polo': {
      const left = `M ${L(nx - 2, ny)} C ${L(nx - 2, ny + 18)} ${L(nx + 6, ny + 36)} ${L(nx + 12, ny + 46)} C ${L(nx + 16, ny + 43)} ${L(146, ny + 34)} ${L(149, ny + 26)} C ${L(146, ny + 12)} ${L(nx + 10, ny + 2)} ${L(nx - 2, ny)} Z`;
      return (
        <g>
          <path d={`${back} Q ${L(150, ny + 22)} ${L(nx, ny)} Z`} fill={c.inside} />
          {flap(left)}
          {flap(mirrorPath(left))}
        </g>
      );
    }
    case 'point': {
      const left = `M ${L(nx - 2, ny + 2)} C ${L(nx, ny + 22)} ${L(nx + 6, ny + 42)} ${L(nx + 12, ny + 56)} L ${L(150, ny + 28)} C ${L(146, ny + 16)} ${L(nx + 12, ny + 4)} ${L(nx - 2, ny + 2)} Z`;
      return (
        <g>
          <path
            d={`M ${L(nx - 2, ny)} Q ${L(150, ny - 14)} ${L(rx + 2, ny)} L ${L(rx, ny + 7)} Q ${L(150, ny - 6)} ${L(nx, ny + 7)} Z`}
            fill={c.band}
            stroke={c.outline}
            strokeOpacity="0.4"
            strokeWidth="0.8"
          />
          {flap(left)}
          {flap(mirrorPath(left))}
        </g>
      );
    }
    case 'mandarin':
      return (
        <g>
          <path
            d={`M ${L(nx - 2, ny - 2)} Q ${L(150, ny - 12)} ${L(rx + 2, ny - 2)} L ${L(rx + 2, ny + 10)} Q ${L(150, ny)} ${L(nx - 2, ny + 10)} Z`}
            fill={c.band}
            stroke={c.outline}
            strokeOpacity="0.45"
            strokeWidth="0.9"
          />
          <path d={`M ${L(146, ny + 6)} L ${L(150, ny + 16)} L ${L(154, ny + 6)} Z`} fill={c.inside} />
        </g>
      );
    case 'camp': {
      const left = `M ${L(nx - 2, ny)} L ${L(nx - 16, ny + 24)} L ${L(nx + 18, ny + 70)} L ${L(150, ny + 40)} Q ${L(140, ny + 12)} ${L(nx - 2, ny)} Z`;
      return (
        <g>
          <path d={`M ${L(nx + 2, ny + 2)} Q ${L(150, ny + 10)} ${L(rx - 2, ny + 2)} L ${L(150, ny + 40)} Z`} fill={c.inside} />
          {flap(left)}
          {flap(mirrorPath(left))}
        </g>
      );
    }
    default: // crew and henley
      return (
        <g>
          <path d={`${back} Q ${L(150, ny + 30)} ${L(nx, ny)} Z`} fill={c.inside} />
          <path d={`M ${L(nx, ny)} Q ${L(150, ny + 30)} ${L(rx, ny)}`} fill="none" stroke={c.band} strokeWidth="7" />
          <path
            d={`M ${L(nx + 2, ny + 5)} Q ${L(150, ny + 36)} ${L(rx - 2, ny + 5)}`}
            fill="none"
            stroke={c.stitch}
            strokeOpacity="0.5"
            strokeWidth="0.8"
            strokeDasharray="2.5 2.5"
          />
          <rect x="146" y={ny + 4} width="8" height="5" rx="1" fill="#F4EFE6" opacity="0.9" />
        </g>
      );
  }
}

// Fabric textures, tiled across the garment
function Pattern({ id, kind, accent, motif }) {
  const common = { id, patternUnits: 'userSpaceOnUse' };
  switch (kind) {
    case 'stripes':
      return (
        <pattern {...common} width="300" height="16">
          <rect y="0" width="300" height="6" fill={accent} />
        </pattern>
      );
    case 'check':
      return (
        <pattern {...common} width="34" height="34">
          <rect width="12" height="34" fill="#000" opacity="0.26" />
          <rect width="34" height="12" fill="#000" opacity="0.26" />
          <rect x="22" width="2" height="34" fill="#fff" opacity="0.22" />
          <rect y="22" width="34" height="2" fill="#fff" opacity="0.22" />
        </pattern>
      );
    case 'denim':
      return (
        <pattern {...common} width="5" height="5" patternTransform="rotate(45)">
          <rect width="1.2" height="5" fill="#fff" opacity="0.1" />
        </pattern>
      );
    case 'linen':
      return (
        <pattern {...common} width="40" height="9">
          <rect x="0" y="2" width="14" height="0.8" fill="#000" opacity="0.08" />
          <rect x="20" y="6" width="10" height="0.8" fill="#fff" opacity="0.14" />
          <rect x="31" y="4" width="6" height="0.7" fill="#000" opacity="0.06" />
        </pattern>
      );
    case 'knit':
      return (
        <pattern {...common} width="4" height="4">
          <rect width="1.4" height="4" fill="#000" opacity="0.1" />
        </pattern>
      );
    case 'pique':
      return (
        <pattern {...common} width="5" height="5">
          <circle cx="2.5" cy="2.5" r="0.8" fill="#000" opacity="0.1" />
        </pattern>
      );
    case 'oxford':
      return (
        <pattern {...common} width="4" height="4">
          <path d="M0 0 L4 4" stroke="#fff" strokeOpacity="0.1" strokeWidth="0.6" />
          <path d="M4 0 L0 4" stroke="#000" strokeOpacity="0.06" strokeWidth="0.6" />
        </pattern>
      );
    case 'print':
      return (
        <pattern {...common} width="46" height="46">
          <path d="M8 16 q7 -9 14 0 q-7 9 -14 0 z" fill={motif} opacity="0.75" />
          <path d="M28 34 q6 -8 12 0 q-6 8 -12 0 z" fill={motif} opacity="0.6" transform="rotate(35 34 34)" />
          <circle cx="36" cy="10" r="2.2" fill={motif} opacity="0.7" />
          <circle cx="12" cy="38" r="1.6" fill={motif} opacity="0.6" />
        </pattern>
      );
    default:
      return null;
  }
}
