import { LogoMark } from '../layout/Header.jsx';
import GarmentArt from '../products/GarmentArt.jsx';

// The home page's motion graphic: a shirt drawn like a tailor's technical sheet. Measurement
// lines draw themselves one after another, their labels pop in, a scan line sweeps over it,
// and two cards float beside it (the size recommendation and colours that suit you).
// The numbers are an illustration of a scan, not anyone's real measurements.

const SUITS_YOU = [
  ['Olive', '#708238'],
  ['Navy', '#1F2A44'],
  ['Rust', '#B7410E'],
  ['Camel', '#C19A6B'],
];

// Measurement lines in the GarmentArt coordinate space (300 × 400, the shirt's anchor points)
const LINES = [
  { d: 'M 78 70 H 222 M 78 64 V 76 M 222 64 V 76', length: 170, label: 'Shoulder 46', x: 150, y: 58, delay: 900 },
  { d: 'M 70 178 H 230 M 70 172 V 184 M 230 172 V 184', length: 190, label: 'Chest 98', x: 150, y: 170, delay: 1250 },
  { d: 'M 74 240 H 226 M 74 234 V 246 M 226 234 V 246', length: 180, label: 'Waist 86', x: 150, y: 232, delay: 1600 },
  { d: 'M 288 86 V 320 M 282 86 H 294 M 282 320 H 294', length: 260, label: 'Length 76', x: 288, y: 206, delay: 1950, vertical: true },
];

export default function HeroGraphic() {
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* The rotating seal */}
      <Seal className="absolute -top-10 -right-6 z-20 h-28 w-28 sm:-right-10" />

      <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] bg-onyx shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10">
        <GarmentArt name="Classic Oxford Shirt" type="shirt" hex="#2F3B52" title="An illustrated navy Oxford shirt" className="absolute inset-0 h-full w-full" />

        {/* Measurements, drawn on top in the same coordinate space */}
        <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {LINES.map((line) => (
            <g key={line.label}>
              <path
                d={line.d}
                fill="none"
                stroke="#dd0200"
                strokeWidth="1.1"
                strokeDasharray={line.length}
                className="animate-draw"
                style={{ '--dash': line.length, animationDelay: `${line.delay}ms` }}
              />
              {/* Rotation on the outer group: the pop animation's CSS transform would replace it */}
              <g transform={line.vertical ? `rotate(-90 ${line.x} ${line.y})` : undefined}>
                <g
                  className="animate-pop"
                  style={{ animationDelay: `${line.delay + 350}ms`, transformOrigin: `${line.x}px ${line.y}px`, transformBox: 'view-box' }}
                >
                  <rect x={line.x - 30} y={line.y - 7.5} width="60" height="15" rx="7.5" fill="#0b0a09" fillOpacity="0.88" />
                  <text
                    x={line.x}
                    y={line.y + 3}
                    textAnchor="middle"
                    fontSize="7.2"
                    fontWeight="700"
                    letterSpacing="0.9"
                    fill="#f1ece6"
                    style={{ fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}
                  >
                    {line.label}
                  </text>
                </g>
              </g>
            </g>
          ))}
        </svg>

        {/* Scan line: a red glow sweeping down, again and again */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 animate-scan bg-linear-to-b from-transparent via-transparent to-racing/20"
            style={{ animationDelay: '2.6s' }}
          >
            <div className="absolute inset-x-0 bottom-0 h-px bg-ember shadow-[0_0_14px_2px_rgb(221_2_0/0.8)]" />
          </div>
        </div>

        {/* Viewfinder corners */}
        {['top-5 left-5 border-t border-l', 'top-5 right-5 border-t border-r', 'bottom-5 left-5 border-b border-l', 'bottom-5 right-5 border-b border-r'].map(
          (corner) => (
            <span key={corner} className={`absolute h-6 w-6 animate-breathe border-ember ${corner}`} />
          ),
        )}
      </div>

      {/* Floating card: the size recommendation */}
      <div
        className="absolute top-24 -left-4 z-10 animate-pop sm:-left-14"
        style={{ animationDelay: '2.4s' }}
      >
        <div className="animate-float rounded-2xl border border-smoke bg-coal/95 px-5 py-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-gray-500 uppercase">Your size</p>
          <p className="mt-1 text-5xl leading-none font-semibold tracking-[-0.04em] text-alabaster">M</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Best fit · Regular
          </p>
        </div>
      </div>

      {/* Floating card: colours that suit you */}
      <div className="absolute -right-3 bottom-16 z-10 animate-pop sm:-right-12" style={{ animationDelay: '2.9s' }}>
        <div
          className="animate-float rounded-2xl border border-smoke bg-coal/95 px-5 py-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] backdrop-blur"
          style={{ animationDelay: '-3.5s' }}
        >
          <p className="text-[10px] font-semibold tracking-[0.2em] text-gray-500 uppercase">Suits your skin tone</p>
          <div className="mt-3 flex gap-2">
            {SUITS_YOU.map(([name, hex], i) => (
              <span
                key={name}
                title={name}
                className="h-7 w-7 animate-pop rounded-full ring-2 ring-coal shadow-sm"
                style={{ backgroundColor: hex, animationDelay: `${3100 + i * 110}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A round seal with text running around it, turning slowly
function Seal({ className = '' }) {
  return (
    <div className={`animate-pop ${className}`} style={{ animationDelay: '1.8s' }}>
      <svg viewBox="0 0 120 120" className="h-full w-full animate-spin-slow" aria-hidden="true">
        <defs>
          <path id="seal-circle" d="M 60 60 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" />
        </defs>
        <circle cx="60" cy="60" r="58" fill="#0b0a09" stroke="#ffffff" strokeOpacity="0.12" />
        {/* textLength = the circle's circumference (2π × 44 ≈ 276), so the text closes the loop */}
        <text fontSize="8" fill="#f1ece6" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          <textPath href="#seal-circle" textLength="274" lengthAdjust="spacing">
            MEASURED FROM ONE PHOTO · NEVER STORED ·
          </textPath>
        </text>
      </svg>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <LogoMark className="h-8 w-8" />
      </span>
    </div>
  );
}
