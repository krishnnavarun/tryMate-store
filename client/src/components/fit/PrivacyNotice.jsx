// Shown on every screen where a photo is uploaded (PROJECT_SPEC.md hard rule)
export default function PrivacyNotice({ variant = 'scan' }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm leading-relaxed text-emerald-900">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z M9 12l2 2 4-4" />
      </svg>
      <p>
        <strong className="font-semibold">Your photo is never stored.</strong>{' '}
        {variant === 'scan'
          ? 'It is used once to take your measurements and then deleted. Only the measurements, skin tone and suggested colours are saved to your profile.'
          : 'It is used once to create the try-on image and then deleted. Nothing is saved.'}
      </p>
    </div>
  );
}
