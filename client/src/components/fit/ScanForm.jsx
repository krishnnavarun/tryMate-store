import { useState } from 'react';
import { scanBody } from '../../api/fitProfile.js';
import FormField, { SubmitButton } from '../ui/FormField.jsx';
import PhotoPicker from './PhotoPicker.jsx';
import PrivacyNotice from './PrivacyNotice.jsx';

const TIPS = [
  ['Full body', 'Head to feet in the photo, nothing cut off'],
  ['Stand straight', 'Facing the camera, feet slightly apart'],
  ['Arms slightly away', 'Hold them ~30° from your body (like an "A")'],
  ['Fitted clothes', 'Baggy clothes make you measure bigger'],
  ['Good light', 'Daylight, plain background, no filters'],
  ['Camera at chest height', '2–3 m away, phone upright'],
];

// Photo + height/weight → scan. Calls onScanned(result) with { fitProfile, fitPreference, warnings }.
export default function ScanForm({ defaultHeight, defaultWeight, onScanned, onCancel }) {
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!photo) return setError('Please add a full-body photo first.');
    const form = new FormData(event.currentTarget);
    setScanning(true);
    setError(null);
    try {
      const result = await scanBody({
        photo,
        heightCm: form.get('heightCm'),
        weightKg: form.get('weightKg'),
      });
      onScanned(result);
    } catch (err) {
      setError(err.userMessage);
      setScanning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 p-5">
          <h2 className="mb-4 font-semibold text-gray-900">1. Your photo</h2>
          <PhotoPicker photo={photo} onChange={setPhoto} disabled={scanning} />
        </section>

        <section className="rounded-2xl border border-gray-200 p-5">
          <h2 className="mb-4 font-semibold text-gray-900">2. Your height</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Height (cm)"
              name="heightCm"
              type="number"
              min={120}
              max={230}
              step="0.5"
              required
              defaultValue={defaultHeight ?? ''}
              hint="Needed to turn the photo into centimetres."
            />
            <FormField
              label="Weight (kg, optional)"
              name="weightKg"
              type="number"
              min={20}
              max={400}
              step="0.5"
              defaultValue={defaultWeight ?? ''}
            />
          </div>
        </section>

        <PrivacyNotice />

        {error && <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <SubmitButton loading={scanning} loadingText="Analyzing your photo…" className="sm:w-auto sm:px-8">
            Get my measurements
          </SubmitButton>
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={scanning} className="px-4 text-sm font-medium text-gray-600">
              Cancel
            </button>
          )}
        </div>
      </div>

      <aside className="h-fit rounded-2xl bg-cream p-5">
        <h2 className="font-semibold text-gray-900">Tips for an accurate scan</h2>
        <ul className="mt-4 space-y-3">
          {TIPS.map(([title, text]) => (
            <li key={title} className="flex gap-3 text-sm">
              <span className="mt-0.5 text-brand-accent">✓</span>
              <span>
                <span className="font-medium text-gray-900">{title}.</span> <span className="text-gray-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </form>
  );
}
