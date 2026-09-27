// "How size M fits you": one row per part of the garment, from the AI service's fit
// breakdown. Each row says it in words ("Just right", "A little snug"), gives the numbers
// (you vs. this size) and shows where you sit on a small bar.

const WORDS = {
  good: 'Just right',
  slightly_tight: 'A little snug',
  tight: 'Tight',
  slightly_loose: 'A little roomy',
  loose: 'Loose',
  slightly_short: 'A little short',
  short: 'Short',
  slightly_long: 'A little long',
  long: 'Long',
};

const LABELS = { chest: 'Chest', waist: 'Waist', shoulder: 'Shoulders', length: 'Length', sleeve: 'Sleeves' };
const LENGTHS = new Set(['length', 'sleeve']); // garment lengths: compared with what suits you

function tone(verdict) {
  if (verdict === 'good') return { dot: 'bg-emerald-600', text: 'text-emerald-800' };
  if (verdict.startsWith('slightly_')) return { dot: 'bg-amber-500', text: 'text-amber-800' };
  return { dot: 'bg-red-500', text: 'text-red-700' };
}

const cm = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)} cm`;

export default function FitBreakdown({ size, fields }) {
  if (!fields?.length) return null;
  const rows = [...fields].sort((a, b) => Object.keys(LABELS).indexOf(a.field) - Object.keys(LABELS).indexOf(b.field));

  return (
    <div className="mt-4 border-t border-emerald-200/70 pt-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-emerald-900 uppercase">How size {size} fits you</p>
      <ul className="mt-3 space-y-3">
        {rows.map((f) => {
          const colours = tone(f.verdict);
          const isLength = LENGTHS.has(f.field);
          // Bar: the size's range in the middle, with room either side to show where you are
          const pad = Math.max(3, (f.sizeMax - f.sizeMin) * 1.5);
          const from = Math.min(f.sizeMin, f.bodyCm) - pad;
          const to = Math.max(f.sizeMax, f.bodyCm) + pad;
          const at = (value) => `${((value - from) / (to - from)) * 100}%`;
          return (
            <li key={f.field} className="grid grid-cols-[92px_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[92px_120px_1fr]">
              <span className="text-sm font-semibold text-ink">{LABELS[f.field] ?? f.label}</span>
              <span className={`text-sm font-medium ${colours.text}`}>{WORDS[f.verdict] ?? f.verdict}</span>
              <div className="col-span-2 sm:col-span-1">
                <div className="relative h-1.5 rounded-full bg-white/80" aria-hidden="true">
                  <span
                    className="absolute inset-y-0 rounded-full bg-emerald-200"
                    style={{ left: at(f.sizeMin), width: `calc(${at(f.sizeMax)} - ${at(f.sizeMin)})` }}
                  />
                  <span
                    className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pop rounded-full ring-2 ring-white ${colours.dot}`}
                    style={{ left: at(f.bodyCm) }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {isLength ? 'Best for you' : 'You'} {cm(f.bodyCm)} · this size {f.sizeMin}–{f.sizeMax} cm
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
