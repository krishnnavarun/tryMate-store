import { Link } from 'react-router';
import { formatDate } from '../../utils/format.js';
import { CountUp } from '../ui/Motion.jsx';

const MEASUREMENTS = [
  ['shoulder_cm', 'Shoulders', 'width'],
  ['chest_cm', 'Chest', 'around'],
  ['waist_cm', 'Waist', 'around'],
  ['torso_cm', 'Torso', 'length'],
  ['arm_cm', 'Arm', 'length'],
  ['leg_cm', 'Leg', 'length'],
];

function confidenceLabel(confidence) {
  if (confidence >= 0.85) return ['High', 'bg-emerald-600'];
  if (confidence >= 0.65) return ['Good', 'bg-emerald-500'];
  if (confidence >= 0.45) return ['Fair', 'bg-amber-500'];
  return ['Low', 'bg-red-500'];
}

// The saved fit profile: measurements, skin tone, suggested colours, confidence, warnings
export default function FitResults({ fitProfile, warnings = [] }) {
  const { measurements, skinTone, colorSuggestions = [], confidence = 0, heightCm, weightKg, updatedAt } = fitProfile;
  const [confidenceText, confidenceColor] = confidenceLabel(confidence);

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="animate-rise rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.16em] text-amber-900 uppercase">About this photo</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="animate-rise rounded-[28px] border border-smoke bg-coal p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="heading-display text-3xl">Your measurements</h2>
          <p className="text-xs text-gray-500">
            {heightCm} cm{weightKg ? ` · ${weightKg} kg` : ''} · scanned {formatDate(updatedAt)}
          </p>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEASUREMENTS.map(([key, label, kind], i) => (
            <div key={key} className="animate-rise rounded-2xl bg-noir p-5 ring-1 ring-smoke/70" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <dt className="text-[10.5px] font-semibold tracking-[0.16em] text-gray-500 uppercase">
                {label} <span className="tracking-normal text-gray-500 normal-case">({kind})</span>
              </dt>
              <dd className="mt-2 heading-display text-4xl leading-none text-alabaster tabular-nums">
                <CountUp value={measurements?.[key]} decimals={1} />
                <span className="ml-1 font-sans text-sm text-gray-500">cm</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-7">
          <div className="flex justify-between text-sm">
            <span className="text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase">Confidence</span>
            <span className="text-gray-600">
              {confidenceText} ({Math.round(confidence * 100)}%)
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full origin-left animate-grow rounded-full ${confidenceColor}`}
              style={{ width: `${Math.round(confidence * 100)}%`, animationDelay: '400ms' }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Measurements from a photo are estimates (usually within a few cm). A clearer photo raises the confidence.
          </p>
        </div>
      </section>

      <section className="animate-rise rounded-[28px] border border-smoke bg-coal p-6 sm:p-8" style={{ animationDelay: '150ms' }}>
        <h2 className="heading-display text-3xl">Your colours</h2>
        {skinTone ? (
          <>
            <div className="mt-5 flex items-center gap-5">
              <span
                className="h-16 w-16 shrink-0 animate-pop rounded-full shadow-inner ring-4 ring-onyx"
                style={{ backgroundColor: skinTone.hex }}
                aria-hidden="true"
              />
              <div>
                <p className="heading-display text-2xl text-alabaster">
                  {skinTone.tone[0].toUpperCase() + skinTone.tone.slice(1)} skin tone, {skinTone.undertone} undertone
                </p>
                <p className="text-sm text-gray-600">These colours tend to flatter you:</p>
              </div>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2">
              {colorSuggestions.map((c, i) => (
                <li
                  key={c.name}
                  className="flex animate-pop items-center gap-2 rounded-full border border-smoke bg-noir py-1 pr-4 pl-1 text-sm"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  <span className="h-7 w-7 rounded-full ring-1 ring-black/10 ring-inset" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </li>
              ))}
            </ul>
            <Link to="/shop?suitsMe=true" className="btn-primary mt-7">
              Shop colours that suit you
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            We couldn&rsquo;t see your face clearly in this photo, so there are no colour suggestions yet. Re-scan with your
            face clearly visible to get them.
          </p>
        )}
      </section>
    </div>
  );
}
