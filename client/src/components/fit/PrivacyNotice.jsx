// Shown on every screen where a photo is uploaded (PROJECT_SPEC.md hard rule)
export default function PrivacyNotice({ variant = 'scan' }) {
  return (
    <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
      </svg>
      <p>
        <strong>Your photo is never stored.</strong>{' '}
        {variant === 'scan'
          ? 'It is used once to take your measurements and then deleted. Only the measurements, skin tone and suggested colors are saved to your profile.'
          : 'It is used once to create the try-on image and then deleted. Nothing is saved.'}
      </p>
    </div>
  );
}
