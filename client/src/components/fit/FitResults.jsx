import { Link } from 'react-router';
import { formatDate } from '../../utils/format.js';

const MEASUREMENTS = [
  ['shoulder_cm', 'Shoulders', 'width'],
  ['chest_cm', 'Chest', 'around'],
  ['waist_cm', 'Waist', 'around'],
  ['torso_cm', 'Torso', 'length'],
  ['arm_cm', 'Arm', 'length'],
  ['leg_cm', 'Leg', 'length'],
];

function confidenceLabel(confidence) {
  if (confidence >= 0.85) return ['High', 'bg-green-500'];
  if (confidence >= 0.65) return ['Good', 'bg-emerald-400'];
  if (confidence >= 0.45) return ['Fair', 'bg-amber-400'];
  return ['Low', 'bg-red-400'];
}

// The saved fit profile: measurements, skin tone, suggested colours, confidence, warnings
export default function FitResults({ fitProfile, warnings = [] }) {
  const { measurements, skinTone, colorSuggestions = [], confidence = 0, heightCm, weightKg, updatedAt } = fitProfile;
  const [confidenceText, confidenceColor] = confidenceLabel(confidence);

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">About this photo</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Your measurements</h2>
          <p className="text-xs text-gray-500">
            {heightCm} cm{weightKg ? ` · ${weightKg} kg` : ''} · scanned {formatDate(updatedAt)}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEASUREMENTS.map(([key, label, kind]) => (
            <div key={key} className="rounded-xl bg-gray-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {label} <span className="normal-case text-gray-400">({kind})</span>
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-gray-900">
                {measurements?.[key] ?? '—'} <span className="text-sm font-normal text-gray-500">cm</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Confidence</span>
            <span className="text-gray-600">
              {confidenceText} ({Math.round(confidence * 100)}%)
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className={`h-full rounded-full ${confidenceColor}`} style={{ width: `${Math.round(confidence * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Measurements from a photo are estimates (usually within a few cm). A clearer photo raises the confidence.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900">Your colors</h2>
        {skinTone ? (
          <>
            <div className="mt-4 flex items-center gap-4">
              <span
                className="h-14 w-14 shrink-0 rounded-full border border-gray-200 shadow-inner"
                style={{ backgroundColor: skinTone.hex }}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-gray-900">
                  {skinTone.tone[0].toUpperCase() + skinTone.tone.slice(1)} skin tone, {skinTone.undertone} undertone
                </p>
                <p className="text-sm text-gray-600">These colors tend to flatter you:</p>
              </div>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {colorSuggestions.map((c) => (
                <li key={c.name} className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pr-3 pl-1 text-sm">
                  <span className="h-6 w-6 rounded-full border border-gray-200" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </li>
              ))}
            </ul>
            <Link
              to="/shop?suitsMe=true"
              className="mt-5 inline-block rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-light"
            >
              Shop colors that suit you →
            </Link>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            We couldn't see your face clearly in this photo, so there are no color suggestions yet. Re-scan with your face
            clearly visible to get them.
          </p>
        )}
      </section>
    </div>
  );
}
