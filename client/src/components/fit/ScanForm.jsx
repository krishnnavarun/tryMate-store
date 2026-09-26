import { useState } from 'react';
import { scanBody } from '../../api/fitProfile.js';
import { messageAt, useElapsedSeconds } from '../../hooks/useElapsedSeconds.js';
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

// What the scan animation says while the photo is analysed (seconds → message)
const SCAN_MESSAGES = [
  [0, 'Finding your pose…'],
  [2, 'Measuring shoulders and chest…'],
  [4, 'Measuring waist and length…'],
  [6, 'Reading your skin tone…'],
  [8, 'Choosing colours that suit you…'],
  [12, 'Almost done…'],
];

// Photo + height/weight → scan. Calls onScanned(result) with { fitProfile, fitPreference, warnings }.
export default function ScanForm({ defaultHeight, defaultWeight, onScanned, onCancel }) {
  const [photo, setPhoto] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const elapsed = useElapsedSeconds(scanning);

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

  const section = 'rounded-[28px] border border-sand bg-white p-6 sm:p-8';
  const step = (n, title) => (
    <h2 className="mb-6 flex items-baseline gap-3">
      <span className="font-display text-3xl text-brass">0{n}</span>
      <span className="heading-display text-3xl">{title}</span>
    </h2>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className={`${section} animate-rise`}>
          {step(1, 'Your photo')}
          <PhotoPicker
            photo={photo}
            onChange={setPhoto}
            disabled={scanning}
            scanning={scanning}
            scanMessage={messageAt(SCAN_MESSAGES, elapsed)}
          />
        </section>

        <section className={`${section} animate-rise`} style={{ animationDelay: '100ms' }}>
          {step(2, 'Your height')}
          <div className="grid gap-5 sm:grid-cols-2">
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

        {error && <p className="animate-rise rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton loading={scanning} loadingText="Analysing your photo…" className="sm:w-auto sm:px-10">
            Get my measurements
          </SubmitButton>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={scanning}
              className="link-underline px-2 text-[11px] font-semibold tracking-[0.16em] text-gray-600 uppercase"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <aside className="h-fit animate-rise rounded-[28px] bg-bone p-7 lg:sticky lg:top-32" style={{ animationDelay: '200ms' }}>
        <p className="eyebrow">Before you start</p>
        <h2 className="heading-display mt-2 text-3xl">For an accurate scan</h2>
        <ol className="mt-6 space-y-4">
          {TIPS.map(([title, text], i) => (
            <li key={title} className="flex gap-4 text-sm">
              <span className="w-5 shrink-0 font-display text-lg leading-5 text-brass">{i + 1}</span>
              <span>
                <span className="font-semibold text-ink">{title}.</span> <span className="text-gray-600">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </form>
  );
}
